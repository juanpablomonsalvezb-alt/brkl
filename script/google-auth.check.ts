// Suite M-R11 / M-R12: Google OAuth 2.0/OIDC con verificación criptográfica RS256 JWKS real,
// protección CSRF/state/PKCE/nonce, redirect_uri validada, sanitización estricta de returnTo,
// protección account_conflict, persistencia/destrucción en LibSQLSessionStore y previewLogin con exp firmado.
// Ejecutar: npx tsx script/google-auth.check.ts (incluido en npm run check:vortice)
import assert from "node:assert/strict";
import { createHmac, generateKeyPairSync, sign as cryptoSign } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

if (process.env.NODE_ENV === "production") {
  throw new Error("google-auth.check no debe correr en producción");
}

// Configurar base SQLite desechable ANTES de importar módulos que inicien server/db.ts.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-google-auth-"));
process.env.TEST_DATABASE_URL = `file:${path.join(dir, "auth.db")}`;
delete process.env.GOOGLE_CLIENT_ID;
delete process.env.GOOGLE_CLIENT_SECRET;

const {
  resolverConfigGoogleAuth,
  sanitizarReturnTo,
  setupGoogleAuth,
  validarClaimsGoogle,
} = await import("../server/googleAuth");

// ── 1. Validación fail-fast de configuración y sanitización estricta ─────────
assert.throws(
  () => resolverConfigGoogleAuth({ GOOGLE_CLIENT_ID: "cid" } as any),
  /GOOGLE_CLIENT_SECRET/,
  "Debe fallar si falta GOOGLE_CLIENT_SECRET",
);
assert.throws(
  () => resolverConfigGoogleAuth({ GOOGLE_CLIENT_ID: "cid", GOOGLE_CLIENT_SECRET: "sec" } as any),
  /GOOGLE_CALLBACK_URL/,
  "Debe fallar si falta GOOGLE_CALLBACK_URL (no inferir desde hostname)",
);
assert.throws(
  () =>
    resolverConfigGoogleAuth({
      NODE_ENV: "production",
      GOOGLE_CLIENT_ID: "cid",
      GOOGLE_CLIENT_SECRET: "sec",
      GOOGLE_CALLBACK_URL: "http://www.barkleyinstituto.cl/api/callback",
    } as any),
  /https:\/\//,
  "Debe rechazar http:// en producción",
);
assert.throws(
  () =>
    resolverConfigGoogleAuth({
      GOOGLE_CLIENT_ID: "cid",
      GOOGLE_CLIENT_SECRET: "sec",
      GOOGLE_CALLBACK_URL: "https://www.barkleyinstituto.cl/otra-ruta",
    } as any),
  /\/api\/callback/,
  "Debe exigir path exacto /api/callback",
);
const cfgOk = resolverConfigGoogleAuth({
  NODE_ENV: "production",
  GOOGLE_CLIENT_ID: "cid-123",
  GOOGLE_CLIENT_SECRET: "sec-456",
  GOOGLE_CALLBACK_URL: "https://www.barkleyinstituto.cl/api/callback",
} as any);
assert.equal(cfgOk.callbackUrl, "https://www.barkleyinstituto.cl/api/callback");

// Vectores anti open-redirect (MR12-H04)
assert.equal(sanitizarReturnTo("https://evil.com"), "/vortice");
assert.equal(sanitizarReturnTo("//evil.com/path"), "/vortice");
assert.equal(sanitizarReturnTo("///evil.com"), "/vortice");
assert.equal(sanitizarReturnTo("/\\evil.com"), "/vortice");
assert.equal(sanitizarReturnTo("/\t/evil.com"), "/vortice");
assert.equal(sanitizarReturnTo("/vortice\r\nSet-Cookie:x=1"), "/vortice");
assert.equal(sanitizarReturnTo("/" + "a".repeat(600)), "/vortice");
assert.equal(sanitizarReturnTo("/vortice/calendario?vista=mes"), "/vortice/calendario?vista=mes");

assert.equal(validarClaimsGoogle({ sub: "1", email: "a@b.cl", email_verified: false }).ok, false);
assert.equal(validarClaimsGoogle({ sub: "", email: "a@b.cl", email_verified: true }).ok, false);
assert.equal(validarClaimsGoogle({ sub: "1", email: "a@b.cl", email_verified: true }).ok, true);

// ── 2. Par de claves RSA-2048 real para firmar id_token y publicar JWKS ──────
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicJwk = { ...(publicKey.export({ format: "jwk" }) as Record<string, unknown>), kid: "google-test-kid-1", alg: "RS256", use: "sig" };

function firmarJwtRs256(
  payload: Record<string, unknown>,
  headerOverride: Record<string, unknown> = {},
  alterarFirma = false,
): string {
  const header = { alg: "RS256", typ: "JWT", kid: "google-test-kid-1", ...headerOverride };
  const h = Buffer.from(JSON.stringify(header)).toString("base64url");
  const p = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const input = Buffer.from(`${h}.${p}`, "ascii");
  const sigBuf = cryptoSign("RSA-SHA256", input, privateKey);
  if (alterarFirma) sigBuf[0] ^= 0xff;
  return `${h}.${p}.${sigBuf.toString("base64url")}`;
}

// ── 3. Pruebas HTTP reales contra Express + LibSQLSessionStore (SQLite desechable) ──
const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const S = await import("../shared/schema");
const { users } = await import("../shared/models/auth");
const { db, client } = await import("../server/db");
const { aplicarMigracionesUnificadas } = await import("../server/migrarTodo");
const { registerAuthRoutes, isAuthenticated } = await import("../server/replit_integrations/auth");
const { previewTestLogin } = await import("../server/previewLogin");

const ddl = await generateSQLiteMigration(
  await generateSQLiteDrizzleJson({}),
  await generateSQLiteDrizzleJson(S as any),
);
for (const stmt of ddl) await db.run(sql.raw(stmt));
await aplicarMigracionesUnificadas(client as any);

await db.insert(users).values([
  { id: "est-preexistente-id", email: "sofia.real@colegio.cl", name: "Sofía Previa" },
  { id: "ficticio-admin", email: "admin@preview.test", name: "Admin Preview" },
  { id: "ficticio-estudiante", email: "est@preview.test", name: "Estudiante Preview" },
]);
await db.insert(S.userProfiles).values([
  { userId: "est-preexistente-id", role: "student" },
  { userId: "ficticio-admin", role: "admin" },
  { userId: "ficticio-estudiante", role: "student" },
]);

let ahoraMs = Date.now();
let nextUserInfo: Record<string, unknown> = {
  sub: "google-sub-sofia-999",
  email: "sofia.real@colegio.cl",
  email_verified: true,
  name: "Sofía Morales",
  given_name: "Sofía",
  family_name: "Morales",
  picture: "https://lh3.googleusercontent.com/sofia.png",
};
let nextIdTokenOverride: (() => string | undefined) | null = null;
let capturedNonce = "";
let forceTokenError = false;

const fakeGoogleFetch: typeof fetch = (async (url: any, init?: any) => {
  const u = String(url);
  assert.ok(init?.signal, `fetch a ${u} debe incluir AbortSignal timeout`);

  if (u.includes("googleapis.com/oauth2/v3/certs")) {
    return new Response(JSON.stringify({ keys: [publicJwk] }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=3600" },
    });
  }
  if (u.includes("oauth2.googleapis.com/token")) {
    if (forceTokenError) {
      return new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 });
    }
    const body = new URLSearchParams(String(init?.body ?? ""));
    assert.equal(body.get("redirect_uri"), "http://127.0.0.1:5099/api/callback");
    assert.ok(body.get("code_verifier"), "Debe enviar PKCE code_verifier");
    const ahoraSeg = Math.floor(ahoraMs / 1000);
    const idToken = nextIdTokenOverride
      ? nextIdTokenOverride()
      : firmarJwtRs256({
          iss: "https://accounts.google.com",
          sub: nextUserInfo.sub,
          aud: "google-client-test",
          exp: ahoraSeg + 3600,
          iat: ahoraSeg,
          nonce: capturedNonce,
          email: nextUserInfo.email,
          email_verified: nextUserInfo.email_verified,
        });
    const resp: Record<string, unknown> = { access_token: "ya29.test-token" };
    if (idToken !== undefined) resp.id_token = idToken;
    return new Response(JSON.stringify(resp), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  if (u.includes("openidconnect.googleapis.com/v1/userinfo")) {
    return new Response(JSON.stringify(nextUserInfo), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  throw new Error(`Unexpected fetch URL in test: ${u}`);
}) as any;

const GOOGLE_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  SESSION_SECRET: "secreto-sesion-mr11-google-auth-min-32-caracteres",
  GOOGLE_CLIENT_ID: "google-client-test",
  GOOGLE_CLIENT_SECRET: "google-secret-test",
  GOOGLE_CALLBACK_URL: "http://127.0.0.1:5099/api/callback",
};

const PREVIEW_SECRET = "secreto-preview-mr11-hmac-min-32-caracteres";
const PREVIEW_ENV: NodeJS.ProcessEnv = {
  VERCEL_ENV: "preview",
  PREVIEW_TEST_LOGIN_SECRET: PREVIEW_SECRET,
};

async function levantarApp() {
  const app = express();
  app.use(express.json());
  await setupGoogleAuth(app, {
    env: GOOGLE_ENV,
    sessionClient: client as any,
    fetchImpl: fakeGoogleFetch,
    now: () => ahoraMs,
  });
  const pv = previewTestLogin(PREVIEW_ENV);
  if (pv) app.use(pv);
  registerAuthRoutes(app);

  app.get("/api/test-protegida", isAuthenticated, (req: any, res) => {
    res.json({ ok: true, userId: req.user?.id, preview: Boolean(req.user?.preview) });
  });

  const srv = createServer(app);
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", () => r()));
  const base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
  return { srv, base };
}

let { srv, base } = await levantarApp();

async function iniciarLogin(returnTo = "/vortice/calendario") {
  const r = await fetch(`${base}/api/login?returnTo=${encodeURIComponent(returnTo)}`, {
    headers: { host: "evil.attacker.com" },
    redirect: "manual",
  });
  assert.equal(r.status, 302);
  const loc = new URL(r.headers.get("location")!);
  assert.equal(loc.origin, "https://accounts.google.com");
  assert.equal(loc.searchParams.get("redirect_uri"), "http://127.0.0.1:5099/api/callback");
  assert.equal(loc.searchParams.get("code_challenge_method"), "S256");
  const state = loc.searchParams.get("state")!;
  capturedNonce = loc.searchParams.get("nonce")!;
  const setCookie = r.headers.get("set-cookie") ?? "";
  assert.ok(setCookie.includes("HttpOnly"));
  assert.ok(/SameSite=Lax/i.test(setCookie));
  return { state, cookie: setCookie.split(";")[0] };
}

try {
  // Sin sesión -> 401
  assert.equal((await fetch(`${base}/api/auth/user`)).status, 401);
  assert.equal((await fetch(`${base}/api/test-protegida`)).status, 401);

  // State inválido -> 401
  {
    const { cookie } = await iniciarLogin();
    const r = await fetch(`${base}/api/callback?code=c1&state=invalido`, { headers: { cookie, accept: "application/json" } });
    assert.equal(r.status, 401);
    assert.equal((await r.json()).error, "invalid_state");
  }

  // State expirado (> 10 min) -> 401 expired_state
  {
    const { state, cookie } = await iniciarLogin();
    ahoraMs += 11 * 60 * 1000;
    const r = await fetch(`${base}/api/callback?code=c-exp&state=${encodeURIComponent(state)}`, { headers: { cookie, accept: "application/json" } });
    assert.equal(r.status, 401);
    assert.equal((await r.json()).error, "expired_state");
    ahoraMs -= 11 * 60 * 1000;
  }

  // Error de Google -> 401 (JSON) y 302 (navegador)
  {
    const { cookie } = await iniciarLogin();
    const r = await fetch(`${base}/api/callback?error=access_denied`, { headers: { cookie, accept: "application/json" } });
    assert.equal(r.status, 401);
    assert.equal((await r.json()).error, "oauth_provider_error");
  }
  {
    const r = await fetch(`${base}/api/callback?error=access_denied`, { redirect: "manual" });
    assert.equal(r.status, 302);
    assert.equal(r.headers.get("location"), "/?auth_error=oauth_provider_error");
  }

  // id_token ausente -> 401 id_token_missing (MR12-H01)
  {
    const { state, cookie } = await iniciarLogin();
    nextIdTokenOverride = () => undefined;
    const r = await fetch(`${base}/api/callback?code=c-noid&state=${encodeURIComponent(state)}`, { headers: { cookie, accept: "application/json" } });
    assert.equal(r.status, 401);
    assert.equal((await r.json()).error, "id_token_missing");
    nextIdTokenOverride = null;
  }

  // alg: "none" -> 401 invalid_alg (MR12-H01)
  {
    const { state, cookie } = await iniciarLogin();
    const ahoraSeg = Math.floor(ahoraMs / 1000);
    nextIdTokenOverride = () =>
      firmarJwtRs256({ iss: "https://accounts.google.com", sub: "s", aud: "google-client-test", exp: ahoraSeg + 600, nonce: capturedNonce }, { alg: "none" });
    const r = await fetch(`${base}/api/callback?code=c-none&state=${encodeURIComponent(state)}`, { headers: { cookie, accept: "application/json" } });
    assert.equal(r.status, 401);
    assert.equal((await r.json()).error, "invalid_alg");
    nextIdTokenOverride = null;
  }

  // Firma criptográfica manipulada -> 401 invalid_signature (MR12-H01)
  {
    const { state, cookie } = await iniciarLogin();
    const ahoraSeg = Math.floor(ahoraMs / 1000);
    nextIdTokenOverride = () =>
      firmarJwtRs256({ iss: "https://accounts.google.com", sub: "s", aud: "google-client-test", exp: ahoraSeg + 600, nonce: capturedNonce }, {}, true);
    const r = await fetch(`${base}/api/callback?code=c-badsig&state=${encodeURIComponent(state)}`, { headers: { cookie, accept: "application/json" } });
    assert.equal(r.status, 401);
    assert.equal((await r.json()).error, "invalid_signature");
    nextIdTokenOverride = null;
  }

  // iss inválido -> 401 invalid_issuer (MR12-H01)
  {
    const { state, cookie } = await iniciarLogin();
    const ahoraSeg = Math.floor(ahoraMs / 1000);
    nextIdTokenOverride = () =>
      firmarJwtRs256({ iss: "https://evil.example.com", sub: "s", aud: "google-client-test", exp: ahoraSeg + 600, nonce: capturedNonce });
    const r = await fetch(`${base}/api/callback?code=c-iss&state=${encodeURIComponent(state)}`, { headers: { cookie, accept: "application/json" } });
    assert.equal(r.status, 401);
    assert.equal((await r.json()).error, "invalid_issuer");
    nextIdTokenOverride = null;
  }

  // id_token expirado -> 401 expired_id_token (MR12-H01)
  {
    const { state, cookie } = await iniciarLogin();
    const ahoraSeg = Math.floor(ahoraMs / 1000);
    nextIdTokenOverride = () =>
      firmarJwtRs256({ iss: "https://accounts.google.com", sub: "s", aud: "google-client-test", exp: ahoraSeg - 120, nonce: capturedNonce });
    const r = await fetch(`${base}/api/callback?code=c-exptok&state=${encodeURIComponent(state)}`, { headers: { cookie, accept: "application/json" } });
    assert.equal(r.status, 401);
    assert.equal((await r.json()).error, "expired_id_token");
    nextIdTokenOverride = null;
  }

  // aud inválido -> 401 invalid_audience
  {
    const { state, cookie } = await iniciarLogin();
    const ahoraSeg = Math.floor(ahoraMs / 1000);
    nextIdTokenOverride = () =>
      firmarJwtRs256({ iss: "https://accounts.google.com", sub: "s", aud: "otro-client-id", exp: ahoraSeg + 600, nonce: capturedNonce });
    const r = await fetch(`${base}/api/callback?code=c-aud&state=${encodeURIComponent(state)}`, { headers: { cookie, accept: "application/json" } });
    assert.equal(r.status, 401);
    assert.equal((await r.json()).error, "invalid_audience");
    nextIdTokenOverride = null;
  }

  // Email no verificado -> 403 email_not_verified
  {
    const { state, cookie } = await iniciarLogin();
    nextUserInfo = { sub: "sub-unverified", email: "no@verificado.cl", email_verified: false };
    const r = await fetch(`${base}/api/callback?code=c2&state=${encodeURIComponent(state)}`, { headers: { cookie, accept: "application/json" } });
    assert.equal(r.status, 403);
    assert.equal((await r.json()).error, "email_not_verified");
  }

  // Error de token endpoint -> 401 token_exchange_failed
  {
    const { state, cookie } = await iniciarLogin();
    forceTokenError = true;
    const r = await fetch(`${base}/api/callback?code=c5&state=${encodeURIComponent(state)}`, { headers: { cookie, accept: "application/json" } });
    assert.equal(r.status, 401);
    assert.equal((await r.json()).error, "token_exchange_failed");
    forceTokenError = false;
  }

  // Callback válido con RS256 real: preserva user.id preexistente, regenera sesión, persiste tras reinicio y destruye en logout
  nextUserInfo = {
    sub: "google-sub-sofia-999",
    email: "sofia.real@colegio.cl",
    email_verified: true,
    name: "Sofía Morales",
    given_name: "Sofía",
    family_name: "Morales",
    picture: "https://lh3.googleusercontent.com/sofia.png",
  };
  const { state: stOk, cookie: cookiePreLogin } = await iniciarLogin("/vortice/calendario");
  const rCb = await fetch(`${base}/api/callback?code=code-valido&state=${encodeURIComponent(stOk)}`, {
    headers: { cookie: cookiePreLogin },
    redirect: "manual",
  });
  assert.equal(rCb.status, 302);
  assert.equal(rCb.headers.get("location"), "/vortice/calendario");
  const cookieAuth = (rCb.headers.get("set-cookie") ?? "").split(";")[0];
  assert.ok(cookieAuth.startsWith("connect.sid="));
  assert.notEqual(cookieAuth, cookiePreLogin, "Debe regenerar la cookie de sesión");

  // Replay del mismo state -> 401
  assert.equal(
    (await fetch(`${base}/api/callback?code=code-valido&state=${encodeURIComponent(stOk)}`, { headers: { cookie: cookieAuth, accept: "application/json" } })).status,
    401,
  );

  // Verificar preservación de ID preexistente
  const me = await (await fetch(`${base}/api/auth/user`, { headers: { cookie: cookieAuth } })).json();
  assert.equal(me.id, "est-preexistente-id");
  assert.equal(me.provider, "google");

  // Conflicto de identidad Google (MR12-H05): otro sub intenta reclamar el mismo email ya vinculado a provider="google" -> 409 account_conflict
  {
    const { state, cookie } = await iniciarLogin();
    nextUserInfo = {
      sub: "google-sub-otro-impostor",
      email: "sofia.real@colegio.cl",
      email_verified: true,
      name: "Otro Usuario",
    };
    const rConf = await fetch(`${base}/api/callback?code=c-conf&state=${encodeURIComponent(state)}`, { headers: { cookie, accept: "application/json" } });
    assert.equal(rConf.status, 409);
    assert.equal((await rConf.json()).error, "account_conflict");
  }

  // Reinicio completo del servidor HTTP: la sesión persiste en LibSQLSessionStore
  await new Promise<void>((r) => srv.close(() => r()));
  ({ srv, base } = await levantarApp());
  assert.equal((await fetch(`${base}/api/auth/user`, { headers: { cookie: cookieAuth } })).status, 200);

  // Sesión expirada (> 7 días) -> 401
  ahoraMs += 8 * 24 * 60 * 60 * 1000;
  assert.equal((await fetch(`${base}/api/test-protegida`, { headers: { cookie: cookieAuth } })).status, 401);
  ahoraMs -= 8 * 24 * 60 * 60 * 1000;

  // Logout real: destruye sesión en SQLite y limpia cookie
  const rOut = await fetch(`${base}/api/logout`, { headers: { cookie: cookieAuth }, redirect: "manual" });
  assert.equal(rOut.status, 303);
  assert.ok((rOut.headers.get("set-cookie") ?? "").includes("connect.sid=;"));
  assert.equal((await fetch(`${base}/api/test-protegida`, { headers: { cookie: cookieAuth } })).status, 401);

  // ── 4. Preview Login: compatibilidad con isAuthenticated, bloqueo en prod y exp firmado (MR12-H06) ──
  assert.equal(previewTestLogin({ VERCEL_ENV: "production", PREVIEW_TEST_LOGIN_SECRET: PREVIEW_SECRET }), null);
  const rPvOk = await fetch(`${base}/api/test-protegida`, {
    headers: { "x-preview-secret": PREVIEW_SECRET, "x-preview-user": "ficticio-admin" },
  });
  assert.equal(rPvOk.status, 200);

  // Cookie brkl_preview firmada pero expirada -> 401
  const expPasado = String(Math.floor(Date.now() / 1000) - 60);
  const sigPasado = createHmac("sha256", PREVIEW_SECRET).update(`ficticio-admin.${expPasado}`).digest("hex");
  const cookiePvExp = `brkl_preview=${encodeURIComponent(`ficticio-admin.${expPasado}.${sigPasado}`)}`;
  assert.equal(
    (await fetch(`${base}/api/test-protegida`, { headers: { cookie: cookiePvExp } })).status,
    401,
    "Cookie brkl_preview expirada debe ser rechazada aunque la firma HMAC sea válida",
  );

  console.log("google-auth: ok");
} finally {
  await new Promise<void>((r) => srv.close(() => r()));
  fs.rmSync(dir, { recursive: true, force: true });
}
