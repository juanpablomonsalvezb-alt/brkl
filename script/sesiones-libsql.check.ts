// Suite M-R02: sesiones persistentes en LibSQL/Turso (sin MemoryStore ni setInterval),
// verificación de salud de esquema (/api/health/vortice) y erradicación de fallbacks silenciosos.
// Ejecutar: npx tsx script/sesiones-libsql.check.ts (incluido en npm run check:vortice)
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createClient } from "@libsql/client";
import { LibSQLSessionStore } from "../server/libsqlSessionStore";

if (process.env.NODE_ENV === "production") {
  throw new Error("sesiones-libsql.check no debe correr en producción");
}

// 1. Comprobación estática: replitAuth.ts no contiene MemoryStore ni setInterval.
const authSrc = fs.readFileSync(path.resolve("server/replit_integrations/auth/replitAuth.ts"), "utf8");
assert.equal(/\bMemoryStore\b/.test(authSrc), false, "replitAuth.ts no debe usar MemoryStore");
assert.equal(/\bsetInterval\b/.test(authSrc), false, "replitAuth.ts no debe crear setInterval");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-sesiones-"));
const dbPath = path.join(dir, "sesiones.db");
const dbUrl = `file:${dbPath}`;

const promisifyGet = (store: LibSQLSessionStore, sid: string) =>
  new Promise<any>((resolve, reject) => store.get(sid, (err, s) => (err ? reject(err) : resolve(s))));
const promisifySet = (store: LibSQLSessionStore, sid: string, sess: any) =>
  new Promise<void>((resolve, reject) => store.set(sid, sess, (err) => (err ? reject(err) : resolve())));
const promisifyTouch = (store: LibSQLSessionStore, sid: string, sess: any) =>
  new Promise<void>((resolve, reject) => store.touch(sid, sess, (err) => (err ? reject(err) : resolve())));
const promisifyDestroy = (store: LibSQLSessionStore, sid: string) =>
  new Promise<void>((resolve, reject) => store.destroy(sid, (err) => (err ? reject(err) : resolve())));

let server: ReturnType<typeof createServer> | null = null;
const prevStrict = process.env.VORTICE_STRICT_SCHEMA;
try {
  // 2. Persistencia real entre dos instancias separadas (simula cold start / cambio de instancia serverless).
  const c1 = createClient({ url: dbUrl });
  const store1 = new LibSQLSessionStore(c1, { ttlMs: 60_000, cleanupIntervalMs: 600_000 });
  await promisifySet(store1, "sid-persist-1", {
    cookie: { maxAge: 60_000 },
    passport: { user: { id: "est-serverless", role: "student" } },
  });
  c1.close();

  const c2 = createClient({ url: dbUrl });
  const store2 = new LibSQLSessionStore(c2, { ttlMs: 60_000, cleanupIntervalMs: 600_000 });
  const recuperada = await promisifyGet(store2, "sid-persist-1");
  assert.equal(recuperada?.passport?.user?.id, "est-serverless", "La sesión debe sobrevivir entre instancias");

  // touch + expiración + cleanup + destroy.
  await promisifyTouch(store2, "sid-persist-1", { cookie: { maxAge: 120_000 } });
  assert.equal((await promisifyGet(store2, "sid-persist-1"))?.passport?.user?.id, "est-serverless");

  await promisifySet(store2, "sid-expirada", { cookie: { maxAge: -10_000 }, user: "viejo" });
  assert.equal(await promisifyGet(store2, "sid-expirada"), undefined, "Sesión expirada no debe devolverse");

  await promisifySet(store2, "sid-cleanup", { cookie: { maxAge: -10_000 }, user: "limpiar" });
  const borradas = await store2.cleanup();
  assert.ok(borradas >= 1, "cleanup debe eliminar filas expiradas");

  await promisifyDestroy(store2, "sid-persist-1");
  assert.equal(await promisifyGet(store2, "sid-persist-1"), undefined, "destroy debe borrar la sesión");
  c2.close();

  // 3. Base sin migraciones 0001..0005 bajo modo estricto -> /api/health/vortice = 503, mapa = 500 (nunca 200 vacío).
  const dbSinMigrar = path.join(dir, "sin-migrar.db");
  process.env.TEST_DATABASE_URL = `file:${dbSinMigrar}`;
  process.env.VORTICE_STRICT_SCHEMA = "1";

  const { sql } = await import("drizzle-orm");
  const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
  const S = await import("../shared/schema");
  const { users } = await import("../shared/models/auth");
  const { db } = await import("../server/db");
  const { registerRoutes } = await import("../server/routes");

  const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(S as any));
  for (const stmt of ddl) await db.run(sql.raw(stmt));

  await db.insert(users).values({ id: "est-strict", email: "strict@test.cl" });
  await db.insert(S.levels).values({ id: "5b", name: "5° Básico", programType: "menores", sortOrder: 5 });
  await db.insert(S.subjects).values({ id: "mat", name: "Matemática", slug: "matematica" });
  await db.insert(S.levelSubjects).values({ id: "5b-matematica", levelId: "5b", subjectId: "mat" });
  await db.insert(S.userProfiles).values({ userId: "est-strict", role: "student", levelId: "5b" });
  await db.insert(S.enrollments).values({ userId: "est-strict", levelSubjectId: "5b-matematica", isActive: true });

  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    const u = req.header("x-test-user");
    if (u) req.user = { id: u };
    next();
  });
  server = createServer(app);
  await registerRoutes(server, app);
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", () => resolve()));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const healthRes = await fetch(`${base}/api/health/vortice`);
  assert.equal(healthRes.status, 503, "Sin migraciones 0001..0005 /api/health/vortice debe responder 503");
  const healthJson = await healthRes.json();
  assert.equal(healthJson.ok, false);
  assert.ok(healthJson.tablasFaltantes.includes("knowledge_domains"));

  const mapaRes = await fetch(`${base}/api/vortice/conocimiento/mapa`, {
    headers: { "x-test-user": "est-strict" },
  });
  assert.equal(mapaRes.status, 500, "Sin tablas de conocimiento el mapa debe fallar con 500, nunca 200 vacío");

  const compRes = await fetch(`${base}/api/vortice/aula/lecciones/oa7/comprobar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-user": "est-strict" },
    body: JSON.stringify({ respuestas: { "oa7-c1": "A", "oa7-c2": "C", "oa7-c3": "A" }, origen: "normal" }),
  });
  assert.equal(compRes.status, 500, "En modo estricto un fallo del motor en sombra no debe silenciarse");
} finally {
  if (prevStrict === undefined) delete process.env.VORTICE_STRICT_SCHEMA;
  else process.env.VORTICE_STRICT_SCHEMA = prevStrict;
  if (server) await new Promise<void>((r) => server!.close(() => r()));
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("sesiones-libsql: ok");
