// Acceso de prueba SOLO para Vercel Preview, con cuentas ficticias de la base de pruebas.
// Requiere a la vez: VERCEL_ENV=preview, PREVIEW_TEST_LOGIN_SECRET (≥ 32 caracteres) configurado,
// el encabezado x-preview-secret igual a ese secreto y un x-preview-user que empiece por "ficticio-".
// La base ya pasó assertPreviewDatabase (server/db.ts) o la app no habría arrancado.
// Fuera de Preview no hace nada: producción y local siguen sin este acceso.
import { timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

export function previewTestLogin(env: NodeJS.ProcessEnv): RequestHandler | null {
  const secret = env.PREVIEW_TEST_LOGIN_SECRET;
  if (env.VERCEL_ENV !== "preview" || !secret || secret.length < 32) return null;
  const expected = Buffer.from(secret);
  return (req: any, _res, next) => {
    const given = Buffer.from(String(req.headers["x-preview-secret"] ?? ""));
    const user = String(req.headers["x-preview-user"] ?? "");
    if (given.length === expected.length && timingSafeEqual(given, expected) && /^ficticio-[a-z0-9-]+$/.test(user)) {
      req.user = { id: user };
    }
    next();
  };
}
