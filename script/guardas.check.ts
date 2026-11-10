// IMP-007, IMP-008 e IMP-001 (c): guardas de base local, drizzle-kit bloqueado fuera de una base
// local (prueba D4) y una sola llamada a createClient en el código de la aplicación.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { assertBaseLocal } from "../server/dbGuard";

// 1. Guarda de base local.
const limpio = { PATH: "" } as NodeJS.ProcessEnv;
for (const url of [":memory:", "file:/tmp/x.db", "http://127.0.0.1:8080", "ws://127.0.0.1:9000"]) {
  assert.doesNotThrow(() => assertBaseLocal(limpio, url), url);
}
const rechazos: [NodeJS.ProcessEnv, string, RegExp][] = [
  [{ NODE_ENV: "production" }, ":memory:", /NODE_ENV=production/],
  [{ VERCEL_ENV: "preview" }, ":memory:", /entorno Vercel/],
  [{ TURSO_AUTH_TOKEN: "" }, ":memory:", /TURSO_AUTH_TOKEN/],
  [{ TURSO_DATABASE_URL: "libsql://x" }, "file:/tmp/x.db", /TURSO_DATABASE_URL/],
  [{ LIBSQL_AUTH_TOKEN: "t" }, ":memory:", /LIBSQL_AUTH_TOKEN/],
  [{ DATABASE_URL: "x" }, ":memory:", /DATABASE_URL/],
  [limpio, "libsql://brkl-db-org.turso.io", /solo se admiten/],
  [limpio, "https://127.0.0.1:8080", /solo se admiten/],
  [limpio, "http://localhost:8080", /solo se admiten/],
  [limpio, "http://192.168.1.10:8080", /solo se admiten/],
  [limpio, "http://u:p@127.0.0.1:8080", /solo se admiten/],
  [limpio, "http://127.0.0.1:8080?authToken=x", /solo se admiten/],
  [limpio, "no es url", /inválida/],
];
for (const [env, url, motivo] of rechazos) assert.throws(() => assertBaseLocal(env, url), motivo, `${JSON.stringify(env)} ${url}`);

// 2. Una sola llamada a createClient en server/ y shared/ (código de la aplicación).
const llamadas = (texto: string) => texto.split("\n").filter((l) => /\bcreateClient\s*\(/.test(l.replace(/\/\/.*$/, ""))).length;
const ts = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? ts(path.join(dir, e.name)) : e.name.endsWith(".ts") ? [path.join(dir, e.name)] : []);
const conLlamada = [...ts("server"), ...ts("shared")].filter((f) => llamadas(fs.readFileSync(f, "utf8")) > 0);
assert.deepEqual(conLlamada, [path.join("server", "cliente.ts")], `createClient fuera de server/cliente.ts: ${conLlamada}`);
assert.equal(llamadas(fs.readFileSync("server/cliente.ts", "utf8")), 1);
// Control: el detector ve una llamada nueva y no confunde comentarios.
assert.equal(llamadas("const c = createClient({ url });"), 1);
assert.equal(llamadas("// la URL que usará createClient(...)"), 0);

// 3. drizzle-kit no opera sobre bases protegidas (prueba D4). Entorno mínimo, sin credenciales.
const base = { PATH: process.env.PATH ?? "", HOME: process.env.HOME ?? "" };
const configura = (env: Record<string, string>) => spawnSync("node_modules/.bin/tsx", ["-e", "import('./drizzle.config.ts').catch((e) => { console.error(e.message); process.exit(1); })"],
  { encoding: "utf8", env: { ...base, ...env }, timeout: 60000 });
const sinEntorno = configura({});
assert.notEqual(sinEntorno.status, 0);
assert.match(sinEntorno.stderr, /drizzle-kit bloqueado: solo opera con DB_ENTORNO=local/);
const remota = configura({ DB_ENTORNO: "local", DRIZZLE_DB_URL: "libsql://brkl-db-org.turso.io" });
assert.notEqual(remota.status, 0);
assert.match(remota.stderr, /solo admite una base local file:/);
assert.equal(configura({ DB_ENTORNO: "local" }).status, 0, "base local confirmada: la configuración carga");
// La orden real del proyecto (npm run db:push) se detiene antes de conectar.
const push = spawnSync("node_modules/.bin/drizzle-kit", ["push", "--config=drizzle.config.ts"],
  { encoding: "utf8", env: base, timeout: 120000, input: "\n" });
assert.notEqual(push.status, 0);
assert.match(push.stdout + push.stderr, /drizzle-kit bloqueado/);

console.log("guardas: ok");
