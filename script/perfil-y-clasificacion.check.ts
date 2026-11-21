// Pruebas de T39: perfil único del estudiante (regular / neurodivergente en user_profiles) y
// clasificación funcional real de evaluaciones (0 = diagnóstico, 1..3 = proceso, 4 = módulo)
// con compatibilidad histórica (P7) en progresión, almacenamiento, analítica y rutas HTTP.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import {
  esNumeroEvaluacionValido,
  funcionPorNumero,
  etiquetaEvaluacion,
  etiquetaResultadoPorFuncion,
  obtenerEvaluacionesDeCierre,
  esEvaluacionDeCierreEnModulo,
  setEvaluationProfileSchema,
} from "../shared/clasificacionEvaluacion";

if (process.env.NODE_ENV === "production") throw new Error("perfil-y-clasificacion.check no debe correr en producción");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-t39-"));
process.env.TEST_DATABASE_URL = `file:${path.join(dir, "base.db")}`;

const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const schema = await import("../shared/schema");
const { users } = await import("../shared/models/auth");
const { db, client } = await import("../server/db");
const { storage } = await import("../server/storage");
const { migrar } = await import("../server/migrar");
const { getPerfilEvaluacion, setPerfilEvaluacion, setFuncionEvaluacion } = await import("../server/perfilEvaluacion");
const { checkModuleAccess, checkEvaluationAccess, checkResourceAccess, loadVorticeInput } = await import("../server/vortice");
const { loadAnaliticaResumen } = await import("../server/analitica");
const { DEFAULT_CONFIG } = await import("../server/calendarUtils");
const { registrarRutasEvaluacion } = await import("../server/evaluacionRoutes");
const { sembrarFicticios } = await import("./lib/esquemaHeredado");

let server: ReturnType<typeof createServer> | null = null;
try {
  // ── 1. Funciones puras (shared/clasificacionEvaluacion.ts) ──
  assert.equal(esNumeroEvaluacionValido(0), true);
  assert.equal(esNumeroEvaluacionValido(4), true);
  assert.equal(esNumeroEvaluacionValido(-1), false);
  assert.equal(esNumeroEvaluacionValido(5), false);
  assert.equal(esNumeroEvaluacionValido(1.5), false);

  assert.equal(funcionPorNumero(0), "diagnostico");
  assert.equal(funcionPorNumero(1), "proceso");
  assert.equal(funcionPorNumero(2), "proceso");
  assert.equal(funcionPorNumero(3), "proceso");
  assert.equal(funcionPorNumero(4), "modulo");
  assert.equal(funcionPorNumero(5), null);

  assert.equal(etiquetaEvaluacion("diagnostico", 0), "Evaluación de diagnóstico");
  assert.equal(etiquetaEvaluacion("proceso", 1), "Evaluación de proceso 1");
  assert.equal(etiquetaEvaluacion("proceso", 3), "Evaluación de proceso 3");
  assert.equal(etiquetaEvaluacion("modulo", 4), "Evaluación del módulo");
  assert.equal(etiquetaEvaluacion(null, 2), "Evaluación 2");

  assert.equal(etiquetaResultadoPorFuncion("modulo", true), "Aprobada");
  assert.equal(etiquetaResultadoPorFuncion("modulo", false), "No aprobada");
  assert.equal(etiquetaResultadoPorFuncion("proceso", true), "Logrado");
  assert.equal(etiquetaResultadoPorFuncion("proceso", false), "No logrado");
  assert.equal(etiquetaResultadoPorFuncion("diagnostico", false), "Completada");

  // Con clasificación explícita: solo `modulo` cierra (aunque el #2 esté presente como `proceso`).
  const evalsClasificadas = [
    { id: "e0", evaluationNumber: 0, evaluationFunction: "diagnostico" as const },
    { id: "e1", evaluationNumber: 1, evaluationFunction: "proceso" as const },
    { id: "e2", evaluationNumber: 2, evaluationFunction: "proceso" as const },
    { id: "e3", evaluationNumber: 3, evaluationFunction: "proceso" as const },
    { id: "e4", evaluationNumber: 4, evaluationFunction: "modulo" as const },
  ];
  assert.deepEqual(obtenerEvaluacionesDeCierre(evalsClasificadas).map((e) => e.id), ["e4"]);
  assert.equal(esEvaluacionDeCierreEnModulo(evalsClasificadas, { id: "e2" }), false);
  assert.equal(esEvaluacionDeCierreEnModulo(evalsClasificadas, { id: "e4" }), true);

  // Heredadas sin clasificar (P7): todas en null → compatibilidad con evaluación 2.
  const evalsHeredadas = [
    { id: "h1", evaluationNumber: 1, evaluationFunction: null },
    { id: "h2", evaluationNumber: 2, evaluationFunction: null },
  ];
  assert.deepEqual(obtenerEvaluacionesDeCierre(evalsHeredadas).map((e) => e.id), ["h2"]);
  assert.equal(setEvaluationProfileSchema.safeParse({ perfil: "neurodivergente", diagnostico: "TDAH" }).success, false);

  // ── Preparación de BD local desechable + migraciones 0001..0005 ──
  // registerRoutes se importa después de crear las tablas (replitAuth crea "sessions" al cargarse).
  const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
  for (const s of ddl) await db.run(sql.raw(s));
  const { registerRoutes } = await import("../server/routes");
  await migrar(client as any, "migrations/vortice");
  await sembrarFicticios(client as any);

  await db.insert(users).values([
    { id: "adm", email: "adm@prueba.test" },
    { id: "tut", email: "tut@prueba.test" },
    { id: "apo", email: "apo@prueba.test" },
    { id: "est-a", email: "esta@prueba.test" },
    { id: "est-sin-perfil", email: "sinp@prueba.test" },
    { id: "est-b", email: "estb@prueba.test" },
    { id: "est-c", email: "estc@prueba.test" },
    { id: "est-d", email: "estd@prueba.test" },
  ]);
  await db.insert(schema.userProfiles).values([
    { userId: "adm", role: "admin" },
    { userId: "tut", role: "tutor" },
    { userId: "apo", role: "guardian" },
    { userId: "est-a", role: "student" },
  ]);

  // ── 2. Servicio de perfil de evaluación y función de evaluaciones ──
  const def = await getPerfilEvaluacion(db, "est-sin-perfil");
  assert.deepEqual(def, { userId: "est-sin-perfil", perfil: "regular", setBy: null, setAt: null });

  const t1 = new Date("2027-03-01T12:00:00Z");
  const rNoAdmin = await setPerfilEvaluacion(db, { adminUserId: "est-a", studentUserId: "est-a", body: { perfil: "neurodivergente" }, now: t1 });
  assert.equal(rNoAdmin.ok, false);
  if (!rNoAdmin.ok) assert.equal(rNoAdmin.status, 403);

  const rTutor = await setPerfilEvaluacion(db, { adminUserId: "tut", studentUserId: "est-a", body: { perfil: "neurodivergente" }, now: t1 });
  assert.equal(rTutor.ok, false);
  if (!rTutor.ok) assert.equal(rTutor.status, 403);

  const rApo = await setPerfilEvaluacion(db, { adminUserId: "apo", studentUserId: "est-a", body: { perfil: "neurodivergente" }, now: t1 });
  assert.equal(rApo.ok, false);
  if (!rApo.ok) assert.equal(rApo.status, 403);

  const rInex = await setPerfilEvaluacion(db, { adminUserId: "adm", studentUserId: "no-existe", body: { perfil: "neurodivergente" }, now: t1 });
  assert.equal(rInex.ok, false);
  if (!rInex.ok) assert.equal(rInex.status, 404);

  const rExtra = await setPerfilEvaluacion(db, {
    adminUserId: "adm", studentUserId: "est-a", body: { perfil: "neurodivergente", diagnostico: "TDAH" }, now: t1,
  });
  assert.equal(rExtra.ok, false);
  if (!rExtra.ok) assert.equal(rExtra.status, 400);

  const rInv = await setPerfilEvaluacion(db, { adminUserId: "adm", studentUserId: "est-a", body: { perfil: "otro" }, now: t1 });
  assert.equal(rInv.ok, false);
  if (!rInv.ok) assert.equal(rInv.status, 400);

  // Crea fila automática cuando no existía (est-sin-perfil).
  const rCrea = await setPerfilEvaluacion(db, {
    adminUserId: "adm", studentUserId: "est-sin-perfil", body: { perfil: "neurodivergente" }, now: t1,
  });
  assert.equal(rCrea.ok, true);
  if (rCrea.ok) {
    assert.equal(rCrea.value.perfil, "neurodivergente");
    assert.equal(rCrea.value.setBy, "adm");
    assert.equal(rCrea.value.setAt?.getTime(), t1.getTime());
  }

  // Actualiza a neurodivergente y vuelve a regular (est-a).
  await setPerfilEvaluacion(db, { adminUserId: "adm", studentUserId: "est-a", body: { perfil: "neurodivergente" }, now: t1 });
  assert.equal((await getPerfilEvaluacion(db, "est-a")).perfil, "neurodivergente");
  const t2 = new Date("2027-03-02T12:00:00Z");
  await setPerfilEvaluacion(db, { adminUserId: "adm", studentUserId: "est-a", body: { perfil: "regular" }, now: t2 });
  const leidoReg = await getPerfilEvaluacion(db, "est-a");
  assert.equal(leidoReg.perfil, "regular");
  assert.equal(leidoReg.setBy, "adm");

  // Sembrar dominio + 2 evaluaciones E2 de prueba para integración con evaluacionRoutes.ts
  const AU = "ficticio-autor", VA = "ficticio-validador";
  const OPC = JSON.stringify([{ id: "o1", texto: "Uno" }, { id: "o2", texto: "Dos" }]);
  await client.execute("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa-cur','ls-mat-5b','M1','t','https://e.test',2018)");
  await client.execute({ sql: "INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES ('d1', 'ls-mat-5b', 'Dom')", args: [] });
  await client.execute({ sql: "INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES ('d1-v1', 'd1', 1, 'borrador', ?)", args: [AU] });
  await client.execute({ sql: "INSERT INTO knowledge_items (id, domain_id, code) VALUES ('i1', 'd1', 'COD-1')", args: [] });
  await client.execute({ sql: "INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES ('i1-iv', 'i1', 'd1-v1', 'd1', 'n', 'd')", args: [] });
  await client.execute("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES ('i1-iv', 'oa-cur')");
  await client.execute({ sql: "UPDATE knowledge_domain_versions SET status = 'en_revision' WHERE id = 'd1-v1'", args: [] });
  await client.execute({ sql: "UPDATE knowledge_domain_versions SET status = 'validada', validated_by = ? WHERE id = 'd1-v1'", args: [VA] });

  await db.insert(schema.learningObjectives).values([
    { id: "lo-m2", levelSubjectId: "ls-mat-5b", code: "M2", title: "Módulo 2", weekNumber: 2 },
    { id: "lo-her1", levelSubjectId: "ls-len-6b", code: "L1", title: "Heredado 1", weekNumber: 1 },
    { id: "lo-her2", levelSubjectId: "ls-len-6b", code: "L2", title: "Heredado 2", weekNumber: 2 },
  ]);
  await db.insert(schema.weeklyResources).values([
    { id: "wr-m2", learningObjectiveId: "lo-m2", resourceType: "video", title: "Video M2" },
    { id: "wr-her2", learningObjectiveId: "lo-her2", resourceType: "video", title: "Video Her2" },
  ]);
  await db.insert(schema.moduleEvaluations).values([
    { id: "me-0", learningObjectiveId: "lo-mat", evaluationNumber: 0, evaluationFunction: "diagnostico", title: "Evaluación de diagnóstico", releaseDay: 1, releaseWeek: 1, isRequired: false },
    { id: "me-1", learningObjectiveId: "lo-mat", evaluationNumber: 1, evaluationFunction: "proceso", title: "Evaluación de proceso 1", releaseDay: 3, releaseWeek: 1 },
    { id: "me-2", learningObjectiveId: "lo-mat", evaluationNumber: 2, evaluationFunction: "proceso", title: "Evaluación de proceso 2", releaseDay: 5, releaseWeek: 1 },
    { id: "me-3", learningObjectiveId: "lo-mat", evaluationNumber: 3, evaluationFunction: "proceso", title: "Evaluación de proceso 3", releaseDay: 3, releaseWeek: 2 },
    { id: "me-4", learningObjectiveId: "lo-mat", evaluationNumber: 4, evaluationFunction: "modulo", title: "Evaluación del módulo", releaseDay: 5, releaseWeek: 2, passingScore: 70 },
    // Heredado sin clasificar (P7) en Lenguaje
    { id: "her-1", learningObjectiveId: "lo-her1", evaluationNumber: 1, evaluationFunction: null, title: "Evaluación Formativa 1", releaseDay: 3, releaseWeek: 1 },
    { id: "her-2", learningObjectiveId: "lo-her1", evaluationNumber: 2, evaluationFunction: null, title: "Evaluación Formativa 2", releaseDay: 5, releaseWeek: 1 },
  ]);

  // Crear preguntas y versiones de evaluación validadas para me-4 y her-2
  for (let i = 1; i <= 9; i++) {
    const fam = `ef${i}`;
    await client.execute({ sql: "INSERT INTO question_families (id, item_id, bank) VALUES (?, 'i1', 'evaluacion')", args: [fam] });
    await client.execute({
      sql: "INSERT INTO question_versions (id, family_id, item_id, bank, version, status, stem, options_json, correct_option_id, origin, authored_by) VALUES (?, ?, 'i1', 'evaluacion', 1, 'borrador', 'Enunciado', ?, 'o2', 'humano', ?)",
      args: [`qe${i}`, fam, OPC, AU],
    });
    await client.execute({ sql: "UPDATE question_versions SET status = 'en_revision' WHERE id = ?", args: [`qe${i}`] });
    await client.execute({ sql: "UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = ?", args: [VA, `qe${i}`] });
  }
  for (const [evId, evalTarget] of [["ev-v1", "me-4"], ["ev-v2", "her-2"]] as const) {
    await client.execute({ sql: "INSERT INTO evaluation_versions (id, evaluation_id, version, status, created_by) VALUES (?, ?, 1, 'borrador', ?)", args: [evId, evalTarget, AU] });
    await client.execute({ sql: "UPDATE evaluation_versions SET status = 'validada', validated_by = ?, validated_at = 1 WHERE id = ?", args: [VA, evId] });
    for (let i = 1; i <= 9; i++) {
      await client.execute({
        sql: "INSERT INTO evaluation_version_questions (evaluation_version_id, question_version_id, family_id, item_id, bank, position) VALUES (?, ?, ?, 'i1', 'evaluacion', ?)",
        args: [evId, `qe${i}`, `ef${i}`, i - 1],
      });
    }
  }

  // setFuncionEvaluacion: admin / no-admin / 404 / 400
  assert.equal((await setFuncionEvaluacion(db, { adminUserId: "est-a", evaluationId: "me-1", body: { evaluationFunction: "modulo" } })).status, 403);
  assert.equal((await setFuncionEvaluacion(db, { adminUserId: "adm", evaluationId: "no-existe", body: { evaluationFunction: "modulo" } })).status, 404);
  assert.equal((await setFuncionEvaluacion(db, { adminUserId: "adm", evaluationId: "me-1", body: { evaluationFunction: "invalida" } })).status, 400);
  const fOk = await setFuncionEvaluacion(db, { adminUserId: "adm", evaluationId: "me-1", body: { evaluationFunction: "modulo" } });
  assert.equal(fOk.ok, true);
  await setFuncionEvaluacion(db, { adminUserId: "adm", evaluationId: "me-1", body: { evaluationFunction: "proceso" } });

  // ── 3 & HTTP admin endpoints + registrarRutasEvaluacion ──
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    const u = req.header("x-test-user");
    req.isAuthenticated = () => !!u;
    if (u) req.user = { id: u, claims: { sub: u }, expires_at: Math.floor(Date.now() / 1000) + 3600 };
    next();
  });
  server = createServer(app);
  await registerRoutes(server, app);
  registrarRutasEvaluacion(app, {
    client: client as any,
    userId: (req: any) => req.user?.id,
    esAdmin: async (uid) => (await storage.getUserProfile(uid))?.role === "admin",
    acceso: async () => ({ ok: true }),
  });
  await new Promise<void>((r) => server!.listen(0, r));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const call = async (method: string, route: string, user?: string, body?: unknown) => {
    const res = await fetch(baseUrl + route, {
      method,
      headers: { "content-type": "application/json", ...(user ? { "x-test-user": user } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, json: await res.json().catch(() => null) };
  };

  // HTTP admin endpoints: auth + persistencia
  assert.equal((await call("GET", "/api/admin/students/est-a/evaluation-profile")).status, 401);
  assert.equal((await call("GET", "/api/admin/students/est-a/evaluation-profile", "est-a")).status, 403);
  assert.equal((await call("PUT", "/api/admin/students/est-a/evaluation-profile", "est-a", { perfil: "neurodivergente" })).status, 403);
  assert.equal((await call("PATCH", "/api/admin/evaluations/me-4/function", "est-a", { evaluationFunction: "modulo" })).status, 403);

  // Alumno est-a (hoy regular) abre proceso → regular, 60 min, 70 %
  const procReg = await call("POST", "/api/vortice/evaluaciones/me-4/proceso", "est-a");
  assert.equal(procReg.status, 200);
  assert.deepEqual([procReg.json.perfil, procReg.json.duracionMin, procReg.json.umbral], ["regular", 60, 70]);

  // Admin marca a est-a como neurodivergente vía HTTP PUT
  const putNd = await call("PUT", "/api/admin/students/est-a/evaluation-profile", "adm", { perfil: "neurodivergente" });
  assert.equal(putNd.status, 200);
  assert.equal(putNd.json.perfil, "neurodivergente");

  // Alumno est-a abre proceso en otra evaluación (her-2) → automáticamente neurodivergente, 120 min, 50 %
  const procNd = await call("POST", "/api/vortice/evaluaciones/her-2/proceso", "est-a");
  assert.equal(procNd.status, 200);
  assert.deepEqual([procNd.json.perfil, procNd.json.duracionMin, procNd.json.umbral], ["neurodivergente", 120, 50]);

  // Admin sube HTML en evaluación 0 (diagnóstico): debe aceptarse y clasificarse automáticamente
  const putHtml0 = await call("PUT", "/api/admin/evaluations/lo-mat/0/html", "adm", { htmlContent: "<p>Diagnóstico</p>" });
  assert.equal(putHtml0.status, 200);

  // ── 4. Integración en progresión, storage.getUserCompletedModules, analitica y P7 ──
  await db.insert(schema.enrollments).values([
    { userId: "est-a", levelSubjectId: "ls-mat-5b" },
    { userId: "est-b", levelSubjectId: "ls-mat-5b" },
    { userId: "est-c", levelSubjectId: "ls-mat-5b" },
    { userId: "est-d", levelSubjectId: "ls-mat-5b" },
    { userId: "est-sin-perfil", levelSubjectId: "ls-mat-5b" },
    { userId: "est-a", levelSubjectId: "ls-len-6b" },
  ]);

  const now = new Date(2026, 5, 1); // módulo 1 y 2 en rango calendario DEFAULT_CONFIG (marzo 2026)

  // Evaluación 0 (diagnóstico) disponible apenas abre módulo 1, sin bloquear módulo 1 ni contar como cierre.
  const acc0 = await checkEvaluationAccess(db, "est-a", "me-0", now);
  assert.equal(acc0.ok, true);
  // Con isRequired: false, me-0 no aparece como obligatoria en loadVorticeInput, pero si es requerida igual abre al inicio.
  await db.update(schema.moduleEvaluations).set({ isRequired: true }).where(sql`id = 'me-0'`);
  const ovIn = await loadVorticeInput(db, "est-a", now);
  const ev0Ov = ovIn.input.find((s) => s.levelSubjectId === "ls-mat-5b")?.objectives.find((o) => o.id === "lo-mat")?.evaluations?.find((e) => e.id === "me-0");
  assert.equal(ev0Ov?.available, true);
  await db.update(schema.moduleEvaluations).set({ isRequired: false }).where(sql`id = 'me-0'`);

  // HTTP /api/modules/1/evaluations devuelve 0..4 con títulos reales (0=diagnóstico, 1..3=proceso, 4=módulo).
  const mod1Evals = await call("GET", "/api/modules/1/evaluations?levelSubjectId=ls-mat-5b", "est-a");
  assert.equal(mod1Evals.status, 200);
  assert.deepEqual(
    mod1Evals.json.evaluations.map((e: any) => e.number),
    [0, 1, 2, 3, 4],
  );
  assert.equal(mod1Evals.json.evaluations[0].title, "Evaluación de diagnóstico");
  assert.equal(mod1Evals.json.evaluations[0].isAvailable, true);
  assert.equal(mod1Evals.json.evaluations[4].title, "Evaluación del módulo");

  // Aprobar evaluación 2 ('proceso') en módulo clasificado NO abre módulo 2 ni cuenta en analítica/completados.
  await db.insert(schema.evaluationProgress).values({ userId: "est-a", evaluationId: "me-2", passed: true, score: 100 });
  assert.equal((await checkResourceAccess(db, "est-a", "wr-m2", now)).ok, false);
  assert.equal((await checkModuleAccess(db, "est-a", "ls-mat-5b", 2, now, DEFAULT_CONFIG)).ok, false);
  assert.deepEqual(await storage.getUserCompletedModules("est-a", "ls-mat-5b"), []);

  // Analítica (5 matriculados): me-2 aprobada no cuenta como evaluación de cierre; tasa debe ser 0 %.
  await db.insert(schema.learningEvents).values({
    id: "ev-a-p2", userId: "est-a", tipo: "evaluacion_aprobada", referencia: "me-2", levelSubjectId: "ls-mat-5b", createdAt: now,
  });
  const anaAntes = await loadAnaliticaResumen(db, "ls-mat-5b");
  assert.equal(anaAntes.suprimido, false);
  if (!anaAntes.suprimido) {
    assert.equal(anaAntes.objetivos[0].cierreAprobadoPct, 0);
  }

  // Aprobar evaluación 4 ('modulo') SÍ abre módulo 2, cuenta en getUserCompletedModules y en analítica.
  await db.insert(schema.evaluationProgress).values({ userId: "est-a", evaluationId: "me-4", passed: true, score: 85 });
  assert.equal((await checkResourceAccess(db, "est-a", "wr-m2", now)).ok, true);
  assert.equal((await checkModuleAccess(db, "est-a", "ls-mat-5b", 2, now, DEFAULT_CONFIG)).ok, true);
  assert.deepEqual(await storage.getUserCompletedModules("est-a", "ls-mat-5b"), [1]);

  await db.insert(schema.learningEvents).values({
    id: "ev-a-m4", userId: "est-a", tipo: "evaluacion_aprobada", referencia: "me-4", levelSubjectId: "ls-mat-5b", createdAt: now,
  });
  const anaDespues = await loadAnaliticaResumen(db, "ls-mat-5b");
  assert.equal(anaDespues.suprimido, false);
  if (!anaDespues.suprimido) {
    assert.equal(anaDespues.objetivos[0].cierreAprobadoPct, 20); // 1 de 5 matriculados = 20 %
  }

  // Compatibilidad P7: módulo heredado sin clasificar (evaluation_function = null) sigue abriendo con evaluación 2.
  assert.equal((await checkResourceAccess(db, "est-a", "wr-her2", now)).ok, false);
  await db.insert(schema.evaluationProgress).values({ userId: "est-a", evaluationId: "her-2", passed: true, score: 80 });
  assert.equal((await checkResourceAccess(db, "est-a", "wr-her2", now)).ok, true);
  assert.deepEqual(await storage.getUserCompletedModules("est-a", "ls-len-6b"), [1]);
} finally {
  if (server) await new Promise<void>((r) => server!.close(() => r()));
  client.close();
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("perfil-y-clasificacion: ok");
