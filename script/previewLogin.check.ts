// Chequeo del acceso de prueba de Preview. Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { previewTestLogin } from "../server/previewLogin";

const secret = "s".repeat(40);
const run = (env: Record<string, string>, headers: Record<string, string>) => {
  const mw = previewTestLogin(env as NodeJS.ProcessEnv);
  if (!mw) return "sin middleware";
  const req: any = { headers };
  mw(req, {} as any, () => {});
  return req.user?.id ?? null;
};
const preview = { VERCEL_ENV: "preview", PREVIEW_TEST_LOGIN_SECRET: secret };
const ok = { "x-preview-secret": secret, "x-preview-user": "ficticio-estudiante" };

// Fuera de Preview, o sin secreto suficiente: no existe.
assert.equal(run({ VERCEL_ENV: "production", PREVIEW_TEST_LOGIN_SECRET: secret }, ok), "sin middleware");
assert.equal(run({ PREVIEW_TEST_LOGIN_SECRET: secret }, ok), "sin middleware");
assert.equal(run({ VERCEL_ENV: "preview" }, ok), "sin middleware");
assert.equal(run({ VERCEL_ENV: "preview", PREVIEW_TEST_LOGIN_SECRET: "corto" }, ok), "sin middleware");

// En Preview: solo con secreto exacto y cuenta ficticia.
assert.equal(run(preview, ok), "ficticio-estudiante");
assert.equal(run(preview, { ...ok, "x-preview-secret": secret + "x" }), null);
assert.equal(run(preview, { ...ok, "x-preview-secret": "" }), null);
assert.equal(run(preview, { ...ok, "x-preview-user": "admin-real" }), null);
assert.equal(run(preview, { ...ok, "x-preview-user": "ficticio-x; drop" }), null);

console.log("previewLogin: ok");
