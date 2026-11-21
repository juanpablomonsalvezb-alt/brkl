// Pruebas del Bloque B: consultas y rutas del panel administrativo para perfiles T39
// (`regular` / `neurodivergente` sin datos clínicos O10) y clasificación `0..4` con P7 heredado.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

if (process.env.NODE_ENV === "production") {
  throw new Error("admin-perfiles-ui.check no debe correr en producción");
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-adm-ui-"));
process.env.TEST_DATABASE_URL = `file:${path.join(dir, "adm.db")}`;

const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const schema = await import("../shared/schema");
const { moduleEvaluations, userProfiles } = schema;
const { users } = await import("../shared/models/auth");
const { db, client } = await import("../server/db");
const { sembrarFicticios } = await import("./lib/esquemaHeredado");
const {
  listarClasificacionEvaluaciones,
  listarPerfilesEvaluacion,
} = await import("../server/perfilEvaluacion");

let server: ReturnType<typeof createServer> | null = null;
try {
  const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
  for (const s of ddl) await db.run(sql.raw(s));
  await sembrarFicticios(client as any);

  await db.insert(users).values([
    { id: "adm-b", email: "adm-b@prueba.test", name: "Admin B" },
    { id: "est-b", email: "est-b@prueba.test", name: "Estudiante B" },
  ]);
  await db.insert(userProfiles).values([
    { id: "up-adm-b", userId: "adm-b", role: "admin", evaluationProfile: "regular" },
    { id: "up-est-b", userId: "est-b", role: "student", levelId: "5b", evaluationProfile: "neurodivergente" },
  ]);

  await db.insert(moduleEvaluations).values([
    { id: "ev-leg-2", learningObjectiveId: "lo-mat", evaluationNumber: 2, evaluationFunction: null, title: "Evaluación Heredada 2", releaseWeek: 1 },
    { id: "ev-mod-4", learningObjectiveId: "lo-len", evaluationNumber: 4, evaluationFunction: "modulo", title: "Evaluación Módulo Lectura", releaseWeek: 1 },
  ]);

  // Servicio directo bloquea no-admin con 403.
  const deniedPerf = await listarPerfilesEvaluacion(db, "est-b");
  assert.equal(deniedPerf.ok, false);
  if (!deniedPerf.ok) assert.equal(deniedPerf.status, 403);

  const deniedCls = await listarClasificacionEvaluaciones(db, "est-b");
  assert.equal(deniedCls.ok, false);
  if (!deniedCls.ok) assert.equal(deniedCls.status, 403);

  // Servicio directo para admin devuelve perfiles sin campos clínicos y detecta P7 heredado.
  const okPerf = await listarPerfilesEvaluacion(db, "adm-b");
  assert.equal(okPerf.ok, true);
  if (okPerf.ok) {
    const rowEst = okPerf.value.find((u) => u.userId === "est-b");
    assert.ok(rowEst);
    assert.equal(rowEst.perfil, "neurodivergente");
    assert.deepEqual(Object.keys(rowEst).sort(), [
      "email", "levelId", "name", "perfil", "role", "setAt", "setBy", "userId",
    ]);
  }

  const okCls = await listarClasificacionEvaluaciones(db, "adm-b");
  assert.equal(okCls.ok, true);
  if (okCls.ok) {
    const leg2 = okCls.value.find((e) => e.id === "ev-leg-2");
    const mod4 = okCls.value.find((e) => e.id === "ev-mod-4");
    assert.ok(leg2 && mod4);
    assert.equal(leg2.heredadoP7, true);
    assert.equal(leg2.effectiveFunction, "modulo");
    assert.equal(mod4.heredadoP7, false);
    assert.equal(mod4.effectiveFunction, "modulo");
    assert.equal(mod4.subjectName, "Lenguaje");
    assert.equal(mod4.levelName, "6° Básico");
  }

  // Rutas HTTP reales.
  const { registerRoutes } = await import("../server/routes");
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    const uid = req.header("x-test-user");
    if (uid) req.user = { id: uid };
    next();
  });
  server = createServer(app);
  await registerRoutes(server, app);
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", () => resolve()));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  assert.equal((await fetch(`${base}/api/admin/evaluation-profiles`)).status, 401);
  assert.equal((await fetch(`${base}/api/admin/evaluation-profiles`, { headers: { "x-test-user": "est-b" } })).status, 403);
  assert.equal((await fetch(`${base}/api/admin/evaluations/classification`, { headers: { "x-test-user": "est-b" } })).status, 403);

  const listHttp = await fetch(`${base}/api/admin/evaluation-profiles`, {
    headers: { "x-test-user": "adm-b" },
  });
  assert.equal(listHttp.status, 200);
  const profilesJson = await listHttp.json();
  assert.ok(Array.isArray(profilesJson) && profilesJson.some((r: any) => r.userId === "est-b"));

  // Reclasificar ev-leg-2 a "proceso" vía PATCH quita compatibilidad P7 heredada.
  const patchRes = await fetch(`${base}/api/admin/evaluations/ev-leg-2/function`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-test-user": "adm-b" },
    body: JSON.stringify({ evaluationFunction: "proceso" }),
  });
  assert.equal(patchRes.status, 200);

  const clsAfter = await (
    await fetch(`${base}/api/admin/evaluations/classification`, {
      headers: { "x-test-user": "adm-b" },
    })
  ).json();
  const updatedLeg2 = clsAfter.find((e: any) => e.id === "ev-leg-2");
  assert.equal(updatedLeg2.evaluationFunction, "proceso");
  assert.equal(updatedLeg2.heredadoP7, false);
  assert.equal(updatedLeg2.etiqueta, "Evaluación de proceso 2");

  // Intentar guardar datos clínicos -> 400.
  const badClinico = await fetch(`${base}/api/admin/students/est-b/evaluation-profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-test-user": "adm-b" },
    body: JSON.stringify({ perfil: "neurodivergente", diagnostico: "TEA" }),
  });
  assert.equal(badClinico.status, 400);
} finally {
  if (server) await new Promise<void>((r) => server!.close(() => r()));
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("admin-perfiles-ui: ok");
