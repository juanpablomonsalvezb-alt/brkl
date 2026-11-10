import { defineConfig } from "drizzle-kit";

// Prueba D4 de E0 (criterio aceptado por la usuaria): drizzle-kit `push` y `migrate` borran sin aviso
// los triggers que no modela, así que quedan prohibidos sobre bases protegidas (IMP-002, IMP-008).
// La herramienta solo opera sobre un archivo local, confirmado con DB_ENTORNO=local. El esquema del
// motor se aplica con server/migrar.ts (SQL propio).
if (process.env.DB_ENTORNO !== "local") {
  throw new Error("drizzle-kit bloqueado: solo opera con DB_ENTORNO=local (prueba D4: prohibido sobre bases protegidas)");
}
const url = process.env.DRIZZLE_DB_URL ?? "file:./db.sqlite";
if (!url.startsWith("file:")) {
  throw new Error("drizzle-kit bloqueado: solo admite una base local file:");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: { url },
});
