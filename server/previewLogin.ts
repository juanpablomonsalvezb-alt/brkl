// Acceso de prueba SOLO para Vercel Preview, con cuentas ficticias de la base de pruebas.
// Requiere VERCEL_ENV=preview y PREVIEW_TEST_LOGIN_SECRET (≥ 32 caracteres). Dos vías:
// - API: encabezados x-preview-secret (igual al secreto) y x-preview-user (ficticio-*).
// - Navegador: /api/preview/entrar deja una cookie firmada con HMAC del secreto. La página solo
//   es alcanzable tras el inicio de sesión de Vercel (protección del despliegue de Preview).
// La base ya pasó assertPreviewDatabase (server/db.ts) o la app no habría arrancado.
// Fuera de Preview no se registra nada: producción y local siguen sin este acceso.
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Express, RequestHandler } from "express";

const COOKIE = "brkl_preview";
const CUENTA = /^ficticio-[a-z0-9-]+$/;
export const CUENTAS_FICTICIAS = [
  ["ficticio-estudiante", "Estudiante"], ["ficticio-apoderado", "Apoderado"],
  ["ficticio-tutor", "Tutor"], ["ficticio-admin", "Administrador"], ["ficticio-ajeno", "Estudiante sin matrícula"],
] as const;

const igual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

function enabledSecret(env: NodeJS.ProcessEnv): string | null {
  const secret = env.PREVIEW_TEST_LOGIN_SECRET;
  return env.VERCEL_ENV === "preview" && secret && secret.length >= 32 ? secret : null;
}

const firmar = (secret: string, user: string) => createHmac("sha256", secret).update(user).digest("hex");

function cookieUser(secret: string, header: string | undefined): string | null {
  const raw = (header ?? "").split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return null;
  const [user, sig] = decodeURIComponent(raw.slice(COOKIE.length + 1)).split(".");
  return user && sig && CUENTA.test(user) && igual(sig, firmar(secret, user)) ? user : null;
}

export function previewTestLogin(env: NodeJS.ProcessEnv): RequestHandler | null {
  const secret = enabledSecret(env);
  if (!secret) return null;
  return (req: any, _res, next) => {
    const user = String(req.headers["x-preview-user"] ?? "");
    const viaHeader = igual(String(req.headers["x-preview-secret"] ?? ""), secret) && CUENTA.test(user) ? user : null;
    const id = viaHeader ?? cookieUser(secret, req.headers.cookie);
    if (id) {
      req.user = { id };
      req.isAuthenticated = () => true;
    }
    next();
  };
}

// Página para elegir una cuenta ficticia desde el navegador (solo Preview).
export function registerPreviewLoginPages(app: Express, env: NodeJS.ProcessEnv): void {
  const secret = enabledSecret(env);
  if (!secret) return;
  app.get("/api/preview/entrar", (_req, res) => {
    const botones = CUENTAS_FICTICIAS.map(([id, rol]) =>
      `<button name="cuenta" value="${id}">${rol}<small>${id}</small></button>`).join("");
    res.type("html").send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Entrar a la vista previa</title>
<style>body{font-family:Inter,system-ui,sans-serif;background:#f4f5f1;color:#173047;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}
main{background:#fff;border:1px solid #dfe8e3;border-radius:18px;padding:32px;max-width:420px;width:100%}
h1{font-family:Georgia,serif;font-size:26px;margin:0 0 6px}p{color:#587078;margin:0 0 22px;line-height:1.5}
form{display:grid;gap:10px}button{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border:1px solid #dfe8e3;border-radius:12px;background:#fbfcfa;color:#173047;font:600 15px Inter,system-ui,sans-serif;cursor:pointer}
button:hover,button:focus-visible{border-color:#237b72;outline:2px solid #237b72;outline-offset:1px}small{color:#6c7d80;font-weight:400}</style>
<main><h1>Vista previa de Vórtice</h1><p>Elige una cuenta ficticia. Solo existe en este entorno de pruebas, con datos inventados.</p>
<form method="post" action="/api/preview/entrar">${botones}</form></main>`);
  });
  // El formulario llega ya interpretado por express.urlencoded (server/index.ts, api/index.ts).
  app.post("/api/preview/entrar", (req, res) => {
    const cuenta = String(req.body?.cuenta ?? "");
    if (!CUENTAS_FICTICIAS.some(([id]) => id === cuenta)) return res.status(400).send("Cuenta no válida");
    res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(`${cuenta}.${firmar(secret, cuenta)}`)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`);
    res.redirect(303, cuenta === "ficticio-admin" ? "/barkley-admin" : "/vortice");
  });
  app.get("/api/preview/salir", (_req, res) => {
    res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    res.redirect(303, "/api/preview/entrar");
  });
}
