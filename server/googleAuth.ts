// Autenticación Google OAuth 2.0 / OpenID Connect para Vórtice (M-R11 / M-R12).
// - Verificación criptográfica real RS256 del id_token contra el JWKS oficial de Google.
// - Validación completa OIDC Core §3.1.3.7: alg, kid, firma, iss, aud/azp, exp, iat, nonce, sub, email_verified.
// - Sin estado en memoria para OAuth: state CSRF, PKCE S256 y nonce persisten en LibSQLSessionStore.
// - Redirect URI explícita y validada al arranque (inmune a Host / req.hostname).
// - Timeout explícito en llamadas externas y logout con destrucción real en LibSQLSessionStore.
import { createHash, createPublicKey, randomBytes, timingSafeEqual, verify as cryptoVerify } from "node:crypto";
import type { Express, RequestHandler } from "express";
import type { Client } from "@libsql/client";
import { getSession } from "./replit_integrations/auth/replitAuth";
import { authStorage, GoogleAccountConflictError, type IAuthStorage } from "./replit_integrations/auth/storage";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_JWKS_ENDPOINT = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const SESSION_TTL_SEC = 7 * 24 * 60 * 60; // 7 días
const EXTERNAL_FETCH_TIMEOUT_MS = 10_000; // 10 segundos
const CLOCK_SKEW_SEC = 60;
const JWKS_DEFAULT_CACHE_MS = 60 * 60 * 1000; // 1 hora
const SESSION_COOKIE_NAME = "connect.sid";

export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface GoogleUserClaims {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export interface GoogleAuthOptions {
  env?: NodeJS.ProcessEnv;
  sessionClient?: Client;
  storage?: Pick<IAuthStorage, "getUser" | "upsertGoogleUser">;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

interface PendingOAuthState {
  state: string;
  codeVerifier: string;
  nonce: string;
  returnTo: string;
  createdAt: number;
}

export interface SessionAuthUser {
  id: string;
  provider: "google";
  expiresAt: number;
}

interface JwkKey {
  kid?: string;
  kty?: string;
  alg?: string;
  use?: string;
  n?: string;
  e?: string;
  [k: string]: unknown;
}

function base64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function sha256Base64Url(value: string): string {
  return base64Url(createHash("sha256").update(value).digest());
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Valida que returnTo sea una ruta relativa interna segura (evita open redirect y control chars). */
export function sanitizarReturnTo(raw: unknown, fallback = "/vortice"): string {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 512) return fallback;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return fallback;
  }
  if (/[\x00-\x1f\x7f]/.test(trimmed)) return fallback;
  try {
    const parsed = new URL(trimmed, "https://vortice.invalid");
    if (parsed.origin !== "https://vortice.invalid") return fallback;
    if (!parsed.pathname.startsWith("/") || parsed.pathname.startsWith("//")) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/** Resuelve y valida la configuración de Google OAuth desde entorno (fail-fast si es inválida). */
export function resolverConfigGoogleAuth(env: NodeJS.ProcessEnv = process.env): GoogleAuthConfig {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Configuración Google OAuth incompleta: se requieren GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET");
  }

  const rawCallback =
    env.GOOGLE_CALLBACK_URL?.trim() ||
    (env.PUBLIC_BASE_URL?.trim() ? `${env.PUBLIC_BASE_URL.trim().replace(/\/+$/, "")}/api/callback` : "");

  if (!rawCallback) {
    throw new Error(
      "Configuración Google OAuth incompleta: se requiere GOOGLE_CALLBACK_URL (o PUBLIC_BASE_URL) explícita; no se infiere desde req.hostname",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(rawCallback);
  } catch {
    throw new Error("GOOGLE_CALLBACK_URL no es una URL válida");
  }

  const esLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  const esProd = env.NODE_ENV === "production" || env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview";
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && esLocal && !esProd)) {
    throw new Error("GOOGLE_CALLBACK_URL debe usar https:// en entornos desplegados");
  }
  if (parsed.pathname !== "/api/callback") {
    throw new Error("GOOGLE_CALLBACK_URL debe terminar exactamente en /api/callback");
  }
  if (parsed.search || parsed.hash) {
    throw new Error("GOOGLE_CALLBACK_URL no debe contener query ni hash");
  }

  return {
    clientId,
    clientSecret,
    callbackUrl: parsed.toString(),
  };
}

function parseJsonBase64Url(segment: string): Record<string, unknown> | null {
  try {
    const json = Buffer.from(segment, "base64url").toString("utf8");
    const obj = JSON.parse(json);
    return obj && typeof obj === "object" && !Array.isArray(obj) ? (obj as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Valida los claims de identidad de Google (sub, email y email_verified === true obligatorios). */
export function validarClaimsGoogle(raw: unknown): { ok: true; claims: GoogleUserClaims } | { ok: false; code: string; message: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, code: "invalid_profile", message: "Perfil de Google vacío o inválido" };
  }
  const c = raw as Record<string, unknown>;
  const sub = typeof c.sub === "string" ? c.sub.trim() : "";
  const email = typeof c.email === "string" ? c.email.trim().toLowerCase() : "";
  const emailVerified = c.email_verified === true;

  if (!sub) {
    return { ok: false, code: "incomplete_profile", message: "El perfil de Google no contiene identificador (sub)" };
  }
  if (!email || !email.includes("@")) {
    return { ok: false, code: "incomplete_profile", message: "El perfil de Google no contiene un correo válido" };
  }
  if (!emailVerified) {
    return { ok: false, code: "email_not_verified", message: "La cuenta de Google no tiene el correo verificado" };
  }

  return {
    ok: true,
    claims: {
      sub,
      email,
      email_verified: true,
      name: typeof c.name === "string" && c.name.trim() ? c.name.trim() : undefined,
      given_name: typeof c.given_name === "string" && c.given_name.trim() ? c.given_name.trim() : undefined,
      family_name: typeof c.family_name === "string" && c.family_name.trim() ? c.family_name.trim() : undefined,
      picture: typeof c.picture === "string" && c.picture.trim() ? c.picture.trim() : undefined,
    },
  };
}

/** Crea un verificador criptográfico de id_token RS256 contra el JWKS oficial de Google. */
export function crearVerificadorIdTokenGoogle(deps: { fetchFn: typeof fetch; now: () => number; clientId: string }) {
  let cacheKeys: JwkKey[] = [];
  let cacheExpMs = 0;

  async function cargarJwks(forzarRefresh: boolean): Promise<JwkKey[]> {
    const ahora = deps.now();
    if (!forzarRefresh && cacheKeys.length > 0 && ahora < cacheExpMs) {
      return cacheKeys;
    }
    const res = await deps.fetchFn(GOOGLE_JWKS_ENDPOINT, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`No se pudo obtener JWKS de Google (${res.status})`);
    }
    const body = (await res.json()) as { keys?: JwkKey[] };
    const keys = Array.isArray(body?.keys) ? body.keys : [];
    const cc = res.headers.get("cache-control") ?? "";
    const m = cc.match(/max-age=(\d+)/i);
    const ttlMs = m ? Math.min(Math.max(Number(m[1]) * 1000, 60_000), 6 * 60 * 60 * 1000) : JWKS_DEFAULT_CACHE_MS;
    cacheKeys = keys;
    cacheExpMs = ahora + ttlMs;
    return keys;
  }

  return async function verificarIdToken(
    idToken: string,
    expectedNonce: string,
  ): Promise<{ ok: true; claims: Record<string, unknown> } | { ok: false; code: string; message: string }> {
    const partes = idToken.split(".");
    if (partes.length !== 3 || !partes[0] || !partes[1] || !partes[2]) {
      return { ok: false, code: "invalid_id_token", message: "Token de identidad malformado" };
    }

    const header = parseJsonBase64Url(partes[0]);
    const payload = parseJsonBase64Url(partes[1]);
    if (!header || !payload) {
      return { ok: false, code: "invalid_id_token", message: "Token de identidad malformado" };
    }

    // Rechazar alg: "none", algoritmos simétricos (HS256) o cualquier algoritmo distinto de RS256.
    if (header.alg !== "RS256") {
      return { ok: false, code: "invalid_alg", message: "Algoritmo de firma de id_token no permitido" };
    }
    const kid = typeof header.kid === "string" ? header.kid.trim() : "";
    if (!kid) {
      return { ok: false, code: "invalid_id_token", message: "Falta identificador de clave (kid) en id_token" };
    }

    let keys = await cargarJwks(false);
    let jwk = keys.find((k) => k.kid === kid && k.kty === "RSA");
    if (!jwk) {
      keys = await cargarJwks(true);
      jwk = keys.find((k) => k.kid === kid && k.kty === "RSA");
    }
    if (!jwk) {
      return { ok: false, code: "unknown_kid", message: "Clave pública de firma no encontrada en JWKS de Google" };
    }

    let firmaValida = false;
    try {
      const publicKey = createPublicKey({ key: jwk as any, format: "jwk" });
      const signingInput = Buffer.from(`${partes[0]}.${partes[1]}`, "ascii");
      const signature = Buffer.from(partes[2], "base64url");
      firmaValida = cryptoVerify("RSA-SHA256", signingInput, publicKey, signature);
    } catch {
      firmaValida = false;
    }
    if (!firmaValida) {
      return { ok: false, code: "invalid_signature", message: "Firma criptográfica del id_token inválida" };
    }

    // Validación completa de claims OIDC Core §3.1.3.7
    if (typeof payload.iss !== "string" || !GOOGLE_ISSUERS.has(payload.iss)) {
      return { ok: false, code: "invalid_issuer", message: "Emisor (iss) del id_token inválido" };
    }

    const aud = payload.aud;
    const audValido =
      aud === deps.clientId ||
      (Array.isArray(aud) && aud.includes(deps.clientId) && payload.azp === deps.clientId);
    if (!audValido) {
      return { ok: false, code: "invalid_audience", message: "Audiencia (aud/azp) del id_token no coincide" };
    }

    const ahoraSeg = Math.floor(deps.now() / 1000);
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp + CLOCK_SKEW_SEC < ahoraSeg) {
      return { ok: false, code: "expired_id_token", message: "El id_token ha expirado" };
    }
    if (payload.iat !== undefined && (typeof payload.iat !== "number" || !Number.isFinite(payload.iat) || payload.iat > ahoraSeg + 300)) {
      return { ok: false, code: "invalid_iat", message: "Marca de emisión (iat) del id_token inválida" };
    }

    if (typeof payload.nonce !== "string" || !safeEqual(payload.nonce, expectedNonce)) {
      return { ok: false, code: "invalid_nonce", message: "Nonce del id_token inválido" };
    }

    if (typeof payload.sub !== "string" || !payload.sub.trim()) {
      return { ok: false, code: "incomplete_profile", message: "Falta identificador (sub) en id_token" };
    }

    if (payload.email_verified !== undefined && payload.email_verified !== true) {
      return { ok: false, code: "email_not_verified", message: "El correo del id_token no está verificado" };
    }

    return { ok: true, claims: payload };
  };
}

/** Middleware que hidrata req.user y req.isAuthenticated() desde la sesión persistente de Google. */
export function hidratarSesionGoogle(now: () => number = Date.now): RequestHandler {
  return (req: any, _res, next) => {
    const authUser = req.session?.authUser as SessionAuthUser | undefined;
    const ahoraSeg = Math.floor(now() / 1000);
    if (authUser && typeof authUser.id === "string" && authUser.id && typeof authUser.expiresAt === "number" && ahoraSeg <= authUser.expiresAt) {
      req.user = {
        id: authUser.id,
        provider: authUser.provider,
        expires_at: authUser.expiresAt,
      };
      req.isAuthenticated = () => true;
    } else if (typeof req.isAuthenticated !== "function") {
      req.isAuthenticated = () => false;
    }
    next();
  };
}

function responderErrorOAuth(req: any, res: any, status: number, code: string, message: string) {
  const aceptaJson = typeof req.headers?.accept === "string" && req.headers.accept.includes("application/json");
  if (aceptaJson) {
    return res.status(status).json({ error: code, message });
  }
  return res.redirect(302, `/?auth_error=${encodeURIComponent(code)}`);
}

/** Configura Google OAuth 2.0 / OIDC real con sesiones persistentes LibSQLSessionStore. */
export async function setupGoogleAuth(app: Express, options: GoogleAuthOptions = {}): Promise<GoogleAuthConfig> {
  const env = options.env ?? process.env;
  const config = resolverConfigGoogleAuth(env);
  const fetchFn = options.fetchImpl ?? fetch;
  const store = options.storage ?? authStorage;
  const now = options.now ?? Date.now;
  const esHttps = env.NODE_ENV === "production" || env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview";
  const verificarIdToken = crearVerificadorIdTokenGoogle({ fetchFn, now, clientId: config.clientId });

  app.set("trust proxy", 1);
  app.use(getSession(options.sessionClient, env));
  app.use(hidratarSesionGoogle(now));

  // 1. Inicio de autenticación Google OAuth 2.0 + PKCE S256 + state CSRF persistido en sesión
  app.get("/api/login", (req: any, res) => {
    const state = base64Url(randomBytes(32));
    const codeVerifier = base64Url(randomBytes(32));
    const nonce = base64Url(randomBytes(24));
    const returnTo = sanitizarReturnTo(req.query?.returnTo, "/vortice");

    const pending: PendingOAuthState = {
      state,
      codeVerifier,
      nonce,
      returnTo,
      createdAt: now(),
    };
    req.session.oauth = pending;

    req.session.save((err: unknown) => {
      if (err) {
        console.error("[auth:google] Error persistiendo estado OAuth en sesión");
        return res.status(500).json({ message: "No se pudo iniciar la autenticación" });
      }
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.callbackUrl,
        response_type: "code",
        scope: "openid email profile",
        state,
        nonce,
        code_challenge: sha256Base64Url(codeVerifier),
        code_challenge_method: "S256",
        prompt: "select_account",
      });
      res.redirect(302, `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`);
    });
  });

  // 2. Callback de Google: valida state/TTL, intercambia code+PKCE, verifica firma JWKS del id_token y regenera sesión
  app.get("/api/callback", async (req: any, res) => {
    const pending = req.session?.oauth as PendingOAuthState | undefined;
    if (req.session) {
      delete req.session.oauth;
    }

    if (typeof req.query?.error === "string" && req.query.error) {
      if (req.session && typeof req.session.save === "function") {
        return req.session.save(() => {
          responderErrorOAuth(req, res, 401, "oauth_provider_error", "Autenticación cancelada o rechazada por Google");
        });
      }
      return responderErrorOAuth(req, res, 401, "oauth_provider_error", "Autenticación cancelada o rechazada por Google");
    }

    const code = typeof req.query?.code === "string" ? req.query.code.trim() : "";
    const state = typeof req.query?.state === "string" ? req.query.state.trim() : "";

    if (!code || !state || !pending || !safeEqual(state, pending.state)) {
      return responderErrorOAuth(req, res, 401, "invalid_state", "Parámetro state inválido o ausente");
    }

    if (now() - pending.createdAt > OAUTH_STATE_TTL_MS) {
      return responderErrorOAuth(req, res, 401, "expired_state", "La solicitud de inicio de sesión expiró");
    }

    try {
      const tokenRes = await fetchFn(GOOGLE_TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
        signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.callbackUrl,
          code_verifier: pending.codeVerifier,
        }).toString(),
      });

      if (!tokenRes.ok) {
        return responderErrorOAuth(req, res, 401, "token_exchange_failed", "No se pudo validar el código con Google");
      }

      const tokenBody = (await tokenRes.json()) as { access_token?: string; id_token?: string };
      const accessToken = typeof tokenBody?.access_token === "string" ? tokenBody.access_token : "";
      const idToken = typeof tokenBody?.id_token === "string" ? tokenBody.id_token : "";

      if (!accessToken) {
        return responderErrorOAuth(req, res, 401, "token_missing", "Respuesta de token incompleta");
      }
      if (!idToken) {
        return responderErrorOAuth(req, res, 401, "id_token_missing", "Google no entregó id_token OIDC");
      }

      const verifId = await verificarIdToken(idToken, pending.nonce);
      if (!verifId.ok) {
        const status = verifId.code === "email_not_verified" ? 403 : 401;
        return responderErrorOAuth(req, res, status, verifId.code, verifId.message);
      }

      const userInfoRes = await fetchFn(GOOGLE_USERINFO_ENDPOINT, {
        method: "GET",
        headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
        signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
      });

      if (!userInfoRes.ok) {
        return responderErrorOAuth(req, res, 401, "userinfo_failed", "No se pudo obtener el perfil verificado de Google");
      }

      const rawProfile = await userInfoRes.json();
      const validacion = validarClaimsGoogle(rawProfile);
      if (!validacion.ok) {
        const status = validacion.code === "email_not_verified" ? 403 : 400;
        return responderErrorOAuth(req, res, status, validacion.code, validacion.message);
      }

      if (verifId.claims.sub !== validacion.claims.sub) {
        return responderErrorOAuth(req, res, 401, "subject_mismatch", "El identificador del perfil no coincide con el id_token");
      }

      let usuario;
      try {
        usuario = await store.upsertGoogleUser({
          sub: validacion.claims.sub,
          email: validacion.claims.email,
          name: validacion.claims.name,
          givenName: validacion.claims.given_name,
          familyName: validacion.claims.family_name,
          picture: validacion.claims.picture,
        });
      } catch (err) {
        if (err instanceof GoogleAccountConflictError) {
          return responderErrorOAuth(req, res, 409, "account_conflict", err.message);
        }
        throw err;
      }

      const returnTo = sanitizarReturnTo(pending.returnTo, "/vortice");
      const expiresAt = Math.floor(now() / 1000) + SESSION_TTL_SEC;

      // Regenerar ID de sesión para prevenir session fixation
      req.session.regenerate((regenErr: unknown) => {
        if (regenErr) {
          console.error("[auth:google] Error regenerando sesión tras callback");
          return res.status(500).json({ message: "No se pudo crear la sesión" });
        }
        req.session.authUser = {
          id: usuario.id,
          provider: "google",
          expiresAt,
        } satisfies SessionAuthUser;

        req.session.save((saveErr: unknown) => {
          if (saveErr) {
            console.error("[auth:google] Error guardando sesión persistente");
            return res.status(500).json({ message: "No se pudo persistir la sesión" });
          }
          res.redirect(302, returnTo);
        });
      });
    } catch {
      console.error("[auth:google] Excepción controlada procesando callback OAuth");
      return responderErrorOAuth(req, res, 502, "oauth_exchange_error", "Error comunicándose con el proveedor de identidad");
    }
  });

  // 3. Logout: destruye la fila en LibSQLSessionStore y limpia la cookie de sesión
  app.get("/api/logout", (req: any, res) => {
    const finalizar = () => {
      res.clearCookie(SESSION_COOKIE_NAME, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: esHttps,
      });
      res.redirect(303, "/");
    };

    if (req.session && typeof req.session.destroy === "function") {
      req.session.destroy((err: unknown) => {
        if (err) {
          console.error("[auth:google] Error destruyendo sesión en store");
        }
        finalizar();
      });
    } else {
      finalizar();
    }
  });

  return config;
}
