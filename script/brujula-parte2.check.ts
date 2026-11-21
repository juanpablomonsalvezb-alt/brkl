// Chequeo de Brújula™ parte 2: intensidad, bloques semanales, vista apoderado y correo semanal.
// Base SQLite EN MEMORIA y transporte de correo simulado. Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

if (process.env.NODE_ENV === "production") {
  throw new Error("brujula-parte2.check no debe correr con NODE_ENV=production");
}
process.env.TEST_DATABASE_URL = ":memory:";

const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const S = await import("../shared/schema");
const { users } = await import("../shared/models/auth");
const { db } = await import("../server/db");
for (const stmt of await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(S as any))) {
  await db.run(sql.raw(stmt));
}

const { buildOverview } = await import("../shared/vortice");
const {
  CONFIG_INTENSIDAD,
  PREFERENCIAS_BRUJULA_DEFECTO,
  maxGoalsFor,
  planificarBloquesSemana,
  proposeWeeklyPlan,
} = await import("../shared/brujula");
const { calcularPanel, resumenBrujulaParaApoderado } = await import("../shared/brujulaPanel");
const {
  getBrujulaBlocks,
  getBrujulaPreferences,
  getBrujulaWeek,
  saveBrujulaBlocks,
  saveBrujulaPreferences,
  toggleBrujulaBlock,
} = await import("../server/brujula");
const { getFamiliaBrujula, loadFamiliaResumen, upsertGuardianLink } = await import("../server/familia");
const { despacharNotificaciones, guardarPreferencias } = await import("../server/notificaciones");
const { registerRoutes } = await import("../server/routes");

const PROHIBIDAS = ["racha", "urgente", "último aviso", "no te olvides", "atrasad", "rápido"];

// 1. Lógica pura: intensidad, metas y bloques semanales
assert.equal(maxGoalsFor("basica-1-4", "suave"), 1);
assert.equal(maxGoalsFor("basica-1-4", "normal"), 2);
assert.equal(maxGoalsFor("basica-1-4", "intensivo"), 3);
assert.equal(maxGoalsFor("media", "suave"), 3);
assert.equal(maxGoalsFor("media", "normal"), 4);
assert.equal(maxGoalsFor("media", "intensivo"), 5);
assert.equal(maxGoalsFor(null, "intensivo"), 0);

const mkSubj = (id: string) => ({
  levelSubjectId: id,
  subjectName: `Asig ${id}`,
  subjectSlug: id,
  objectives: [{ id: `oa-${id}`, code: `OA ${id}`, title: id, weekNumber: 1, sortOrder: 0, resources: [{ id: `r-${id}`, title: "R", resourceType: "video", sortOrder: 0 }] }],
});
const ov5 = buildOverview({ id: "2m", name: "2° Medio" }, ["A", "B", "C", "D", "E"].map(mkSubj), new Set());
assert.equal(proposeWeeklyPlan(ov5, "suave").goals.length, 3);
assert.equal(proposeWeeklyPlan(ov5, "normal").goals.length, 4);
assert.equal(proposeWeeklyPlan(ov5, "intensivo").goals.length, 5);

const metas = proposeWeeklyPlan(ov5, "normal").goals;
const bSuave = planificarBloquesSemana({
  weekStart: "2027-08-30",
  goals: metas,
  preferencias: { intensidad: "suave", diasPreferidos: [1, 3, 5], franja: "manana" },
});
assert.equal(bSuave.length, CONFIG_INTENSIDAD.suave.bloquesPorSemana);
assert.ok(bSuave.every((b) => b.duracionMin === 25 && b.franja === "manana"));

const bNormal = planificarBloquesSemana({
  weekStart: "2027-08-30",
  goals: metas,
  preferencias: PREFERENCIAS_BRUJULA_DEFECTO,
});
assert.equal(bNormal.length, CONFIG_INTENSIDAD.normal.bloquesPorSemana);
assert.ok(bNormal.every((b) => b.duracionMin === 35));

// Semana que cruza cambio de horario de septiembre 2027 (5-sep-2027) en aritmética civil exacta
const bIntensivo = planificarBloquesSemana({
  weekStart: "2027-08-30",
  goals: metas,
  preferencias: { intensidad: "intensivo", diasPreferidos: [1, 2, 3, 4, 5, 7], franja: "noche" },
});
assert.equal(bIntensivo.length, CONFIG_INTENSIDAD.intensivo.bloquesPorSemana);
assert.ok(bIntensivo.every((b) => b.duracionMin === 45 && b.franja === "noche"));
assert.deepEqual(
  bIntensivo.map((b) => b.fecha),
  ["2027-08-30", "2027-08-31", "2027-09-01", "2027-09-02", "2027-09-03", "2027-09-05"],
);

assert.deepEqual(planificarBloquesSemana({ weekStart: "2027-08-30", goals: [], preferencias: PREFERENCIAS_BRUJULA_DEFECTO }), []);

// Vista pura del apoderado: traduce atrasado -> por_recuperar y nunca filtra porcentajes
const panelAtrasado = calcularPanel({
  subjects: [mkSubj("Mat")],
  completed: new Set(),
  passed: new Set(),
  now: new Date(Date.UTC(2026, 2, 20)),
  fechas: () => ({ inicio: new Date(Date.UTC(2026, 2, 1)), fin: new Date(Date.UTC(2026, 2, 14)), evaluaciones: {} }),
});
const resumenPuroApo = resumenBrujulaParaApoderado(panelAtrasado, {
  intensidad: "normal",
  bloquesPlanificados: 5,
  bloquesCompletados: 2,
});
assert.equal(resumenPuroApo.estadoGeneral, "por_recuperar");
assert.equal(resumenPuroApo.asignaturas[0].estado, "por_recuperar");
const jsonPuro = JSON.stringify(resumenPuroApo);
assert.ok(!/"percent"|"score"|answersJson|totalCorrect/.test(jsonPuro));
for (const p of PROHIBIDAS) {
  assert.ok(!jsonPuro.toLowerCase().includes(p), `palabra prohibida en vista apoderado: ${p}`);
}

// 2. Persistencia en SQLite en memoria + rutas + vista apoderado + correo semanal
await db.insert(users).values([
  { id: "adm" },
  { id: "est", email: "est@example.test", firstName: "Sofía" },
  { id: "est2", email: "est2@example.test" },
  { id: "apo", email: "apo@example.test", firstName: "Carlos" },
  { id: "apo2", email: "apo2@example.test" },
]);
await db.insert(S.userProfiles).values([
  { userId: "adm", role: "admin" },
  { userId: "est", role: "student", levelId: "7b" },
  { userId: "est2", role: "student", levelId: "7b" },
  { userId: "apo", role: "guardian" },
  { userId: "apo2", role: "guardian" },
]);
await db.insert(S.levels).values([{ id: "7b", name: "7° Básico", programType: "menores", sortOrder: 1 }]);
await db.insert(S.subjects).values([
  { id: "s-mat", name: "Matemática", slug: "matematica" },
  { id: "s-len", name: "Lenguaje", slug: "lenguaje" },
  { id: "s-his", name: "Historia", slug: "historia" },
]);
await db.insert(S.levelSubjects).values([
  { id: "ls-mat", levelId: "7b", subjectId: "s-mat" },
  { id: "ls-len", levelId: "7b", subjectId: "s-len" },
  { id: "ls-his", levelId: "7b", subjectId: "s-his" },
]);
await db.insert(S.enrollments).values([
  { userId: "est", levelSubjectId: "ls-mat" },
  { userId: "est", levelSubjectId: "ls-len" },
  // est NO está matriculado en Historia (ls-his)
]);
await db.insert(S.learningObjectives).values([
  { id: "oa-m1", levelSubjectId: "ls-mat", code: "OA 1", title: "Enteros", weekNumber: 1 },
  { id: "oa-m2", levelSubjectId: "ls-mat", code: "OA 2", title: "Fracciones", weekNumber: 2 },
  { id: "oa-l1", levelSubjectId: "ls-len", code: "OA 1", title: "Lectura", weekNumber: 1 },
  { id: "oa-h1", levelSubjectId: "ls-his", code: "OA 1", title: "Civilizaciones", weekNumber: 1 },
]);
await db.insert(S.weeklyResources).values([
  { id: "r-m1", learningObjectiveId: "oa-m1", resourceType: "video", title: "Video M1" },
  { id: "r-l1", learningObjectiveId: "oa-l1", resourceType: "video", title: "Video L1" },
  { id: "r-h1", learningObjectiveId: "oa-h1", resourceType: "video", title: "Video H1" },
]);
await db.insert(S.moduleEvaluations).values([
  { id: "e-m1", learningObjectiveId: "oa-m1", evaluationNumber: 2, title: "Cierre enteros", releaseWeek: 1 },
]);
await db.insert(S.evaluationProgress).values([
  { userId: "est", evaluationId: "e-m1", passed: false, score: 42, answersJson: "[\"SECRETO\"]", completedAt: new Date("2026-06-04T15:00:00Z") },
]);

const viernes = new Date("2026-06-05T15:00:00Z"); // viernes 11:00 CLT, semana 2026-06-01

// Preferencias y bloques sin guardar: GET no escribe
assert.deepEqual(await getBrujulaPreferences(db, "est"), PREFERENCIAS_BRUJULA_DEFECTO);
const bInit = await getBrujulaBlocks(db, "est", viernes);
assert.equal(bInit.saved, false);
assert.equal((await db.select().from(S.brujulaPreferences)).length, 0);
assert.equal((await db.select().from(S.brujulaStudyBlocks)).length, 0);

// Cambiar intensidad afecta getBrujulaWeek (7b: basica-5-8 base=3, suave=2)
await saveBrujulaPreferences(db, "est", { intensidad: "suave", diasPreferidos: [1, 3, 5], franja: "manana" });
assert.equal((await getBrujulaWeek(db, "est", viernes)).maxGoals, 2);

// saveBrujulaBlocks rechaza fecha fuera de semana y OA sin matrícula/cerrado
const badFecha = await saveBrujulaBlocks(db, "est", viernes, [{ ...bInit.bloques[0], fecha: "2026-05-20" }]);
assert.equal(badFecha.ok, false);
assert.equal(!badFecha.ok && badFecha.status, 400);

const badObj = await saveBrujulaBlocks(db, "est", viernes, [{ ...bInit.bloques[0], objectiveId: "oa-h1" }]);
assert.equal(badObj.ok, false);
assert.equal(!badObj.ok && badObj.status, 403);

const badLocked = await saveBrujulaBlocks(db, "est", viernes, [{ ...bInit.bloques[0], objectiveId: "oa-m2" }]);
assert.equal(badLocked.ok, false);
assert.equal(!badLocked.ok && badLocked.status, 403);

// Toggle bloque
const bSuaveDb = await getBrujulaBlocks(db, "est", viernes);
assert.equal(bSuaveDb.bloques.length, 3);
const tog = await toggleBrujulaBlock(db, "est", viernes, bSuaveDb.bloques[0].id, true);
assert.ok(tog.ok);
assert.equal(tog.data.saved, true);
assert.equal(tog.data.bloques[0].completado, true);
assert.equal((await toggleBrujulaBlock(db, "est", viernes, "no-existe", true)).ok, false);

// 3. Vínculo apoderado: pendiente no accede ni recibe correo; activo accede sin puntajes
await upsertGuardianLink(db, { guardianUserId: "apo", studentUserId: "est", status: "pendiente" }, "adm");
assert.equal(await getFamiliaBrujula(db, "apo", "est", viernes), null);

// Despacho con vínculo pendiente y preferencia apagada: NO envía al apoderado
await guardarPreferencias(db, "est", { resumenSemanal: false, resumenSemanalApoderado: true });
let enviados: { para: string; asunto: string; texto: string }[] = [];
const transp = async (c: { para: string; asunto: string; texto: string }) => { enviados.push(c); };
await despacharNotificaciones(db, transp, viernes);
assert.equal(enviados.length, 0, "vínculo pendiente no envía correo al apoderado");

// Activar vínculo, pero con resumenSemanalApoderado=false -> NO envía
await upsertGuardianLink(db, { guardianUserId: "apo", studentUserId: "est", status: "activo" }, "adm");
await guardarPreferencias(db, "est", { resumenSemanal: false, resumenSemanalApoderado: false });
await despacharNotificaciones(db, transp, viernes);
assert.equal(enviados.length, 0, "sin opt-in no envía correo al apoderado");

// Activar resumenSemanalApoderado=true -> SÍ envía al apoderado con bloques y orientación, sin puntajes ni palabras prohibidas
await guardarPreferencias(db, "est", { resumenSemanal: false, resumenSemanalApoderado: true });
await despacharNotificaciones(db, transp, viernes);
assert.equal(enviados.length, 1);
assert.equal(enviados[0].para, "apo@example.test");
assert.ok(enviados[0].texto.includes("1 de 3 bloques completados"), "correo incluye avance de bloques");
assert.ok(!enviados[0].texto.includes("42"), "correo no expone puntaje de evaluación");
for (const p of PROHIBIDAS) {
  assert.ok(!enviados[0].texto.toLowerCase().includes(p), `correo apoderado contiene palabra prohibida: ${p}`);
}

// Segunda corrida en misma semana ISO es idempotente
enviados = [];
await despacharNotificaciones(db, transp, viernes);
assert.equal(enviados.length, 0, "correo semanal apoderado es idempotente");

// Vista apoderado en loadFamiliaResumen y getFamiliaBrujula
const fam = await loadFamiliaResumen(db, "apo", "est", viernes);
assert.ok(fam);
assert.equal(fam.brujula.bloquesPlanificados, 3);
assert.equal(fam.brujula.bloquesCompletados, 1);
const famJson = JSON.stringify(fam.brujula);
assert.ok(!/"percent"|"score"|answersJson|totalCorrect|SECRETO/.test(famJson));
assert.equal(await getFamiliaBrujula(db, "apo2", "est", viernes), null);

// 4. Rutas HTTP
const app = express();
app.use(express.json());
app.use((req: any, _res, next) => {
  const u = req.header("x-test-user");
  if (u) req.user = { id: u, claims: { sub: u } };
  next();
});
const server = createServer(app);
await registerRoutes(server, app);
await new Promise<void>((r) => server.listen(0, r));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

const call = async (method: string, path: string, user?: string, body?: unknown) => {
  const res = await fetch(base + path, {
    method,
    headers: { "content-type": "application/json", ...(user ? { "x-test-user": user } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
};

assert.equal((await call("GET", "/api/vortice/brujula/preferencias")).status, 401);
assert.equal((await call("GET", "/api/vortice/brujula/bloques")).status, 401);
assert.equal((await call("GET", "/api/familia/estudiantes/est/brujula")).status, 401);
assert.equal((await call("GET", "/api/familia/estudiantes/est/brujula", "apo2")).status, 404);

const putPrefs = await call("PUT", "/api/vortice/brujula/preferencias", "est", {
  intensidad: "intensivo",
  diasPreferidos: [1, 2, 4],
  franja: "tarde",
});
assert.equal(putPrefs.status, 200);
assert.equal(putPrefs.json.intensidad, "intensivo");

const getFamBruj = await call("GET", "/api/familia/estudiantes/est/brujula", "apo");
assert.equal(getFamBruj.status, 200);
assert.equal(getFamBruj.json.intensidad, "intensivo");
assert.ok(!/"percent"|"score"|answersJson|totalCorrect/.test(JSON.stringify(getFamBruj.json)));

server.close();
console.log("brujula-parte2: ok");
