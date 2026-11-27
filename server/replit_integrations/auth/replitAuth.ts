import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import { authStorage } from "./storage";
import type { Client } from "@libsql/client";
import { client as dbClient } from "../../db";
import { LibSQLSessionStore } from "../../libsqlSessionStore";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession(customClient?: Client, env: NodeJS.ProcessEnv = process.env) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  // Sesiones persistentes en LibSQL/Turso: sin estado en memoria ni temporizadores (serverless).
  const sessionStore = new LibSQLSessionStore(customClient ?? dbClient, { ttlMs: sessionTtl });

  // Sin secreto propio no se firman sesiones: un valor por defecto público permitiría falsificarlas.
  const secret = env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET ausente o demasiado corto (mínimo 32 caracteres)");
  const esHttps = env.NODE_ENV === "production" || env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview";
  return session({
    secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: esHttps,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const esHttps = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";
    const redirigir = () => {
      res.clearCookie("connect.sid", { path: "/", httpOnly: true, sameSite: "lax", secure: esHttps });
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    };
    req.logout(() => {
      if (req.session && typeof req.session.destroy === "function") {
        req.session.destroy((err) => {
          if (err) console.error("[auth:replit] Error destruyendo sesión en store");
          redirigir();
        });
      } else {
        redirigir();
      }
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  // Sin login configurado (ni Google OAuth, ni Preview firmado, ni Replit) req.isAuthenticated no es función.
  if (typeof req.isAuthenticated !== "function" || !req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Acceso firmado exclusivo de Vercel Preview (validado por HMAC en server/previewLogin.ts).
  if (user.preview === true && typeof user.id === "string" && user.id) {
    return next();
  }

  // Sesión persistente de Google OAuth (hidratada desde LibSQLSessionStore en server/googleAuth.ts).
  if (user.provider === "google" && typeof user.id === "string" && user.id && typeof user.expires_at === "number") {
    const now = Math.floor(Date.now() / 1000);
    return now <= user.expires_at ? next() : res.status(401).json({ message: "Unauthorized" });
  }

  if (!user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
