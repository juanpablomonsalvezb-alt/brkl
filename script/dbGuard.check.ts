// Chequeo de la barrera de base de datos de Preview. Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { assertPreviewDatabase } from "../server/dbGuard";

const host = "brkl-preview-juanpablomonsalvezb-alt.aws-us-west-2.turso.io";
const ok = { VERCEL_ENV: "preview", DB_ENTORNO: "pruebas", DB_PREVIEW_HOST: host };
const bloquea = (env: Record<string, string | undefined>, url: string | undefined, motivo: RegExp) =>
  assert.throws(() => assertPreviewDatabase(env as NodeJS.ProcessEnv, url), motivo);

// Fuera de Preview no interviene (producción y local siguen igual).
assertPreviewDatabase({ VERCEL_ENV: "production" } as NodeJS.ProcessEnv, "libsql://brkl-prod.turso.io");
assertPreviewDatabase({} as NodeJS.ProcessEnv, "file:./db.sqlite");

// Preview con la base de pruebas confirmada: pasa.
assertPreviewDatabase(ok as NodeJS.ProcessEnv, `libsql://${host}`);

// Preview bloqueado.
bloquea({ ...ok, DB_ENTORNO: undefined }, `libsql://${host}`, /DB_ENTORNO/);
bloquea(ok, undefined, /falta la URL/);
bloquea(ok, "no es una url", /inválida/);
bloquea({ ...ok, DB_PREVIEW_HOST: "brkl-db-juanpablomonsalvezb-alt.aws-us-west-2.turso.io" }, "libsql://brkl-db-juanpablomonsalvezb-alt.aws-us-west-2.turso.io", /host no corresponde/);
bloquea(ok, "libsql://brkl-preview-otra.aws-us-east-1.turso.io", /no coincide/);
bloquea({ ...ok, DB_PREVIEW_HOST: "brkl-preview-x.turso.io.evil.com" }, "libsql://brkl-preview-x.turso.io.evil.com", /host no corresponde/);

console.log("dbGuard: ok");
