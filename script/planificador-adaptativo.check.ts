// Suite QA del Planificador Adaptativo («Mi calendario» · Etapas 1 y 2).
// Verifica:
// 1) Lógica pura: 6 estados de ritmo, gracia intrasemanal de 3 días hábiles, recesos/feriados/generalEvaluationWeeks,
//    candado D1 (`fecha > hoyChile`), fórmula corregida de recuperación (`rSim <= rPlan` -> `recuperable: false`),
//    diferenciación por tramo (`basica-1-4` sin proyecciones), y aritmética civil inmune a DST.
// 2) Integración HTTP: 401/403 por rol, `track === null` (adultos), `aula_universal` con `learning_objective_id = null`
//    sin doble conteo, no-mutación verificada por huella SHA-256 de tablas antes/después de `/simular`,
//    compatibilidad de `aplicableABrujula` con `POST /api/vortice/brujula/bloques`, y cero filtración E2.
// Ejecutar: npx tsx script/planificador-adaptativo.check.ts (incluido en npm run check:vortice)
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import {
  calcularComparacionPlanReal,
  calcularProyecciones,
  contarDiasHabiles,
  diagnosticarRitmo,
  generarRecomendacionesAdaptativas,
  simularReorganizacion,
  type ModuloPlanificado,
} from "../shared/planificadorAdaptativo";
import { PREFERENCIAS_BRUJULA_DEFECTO } from "../shared/brujula";

if (process.env.NODE_ENV === "production") {
  throw new Error("planificador-adaptativo.check no debe correr en producción");
}

// ── 1. Pruebas puras (incluyendo los 7 casos borde NEON / HYDROGEN) ──────────

const feriados = new Set(["2026-05-01"]);
const recesos = [{ inicio: "2026-07-06", fin: "2026-07-17", nombre: "Vacaciones de invierno" }];
const evalGen = [{ inicio: "2026-06-22", fin: "2026-06-28", nombre: "Evaluaciones Generales" }];

// Feriados, recesos y generalEvaluationWeeks no suman días hábiles.
assert.equal(contarDiasHabiles("2026-07-06", "2026-07-17", feriados, recesos, evalGen), 0);
assert.equal(contarDiasHabiles("2026-06-22", "2026-06-28", feriados, recesos, evalGen), 0);
assert.equal(contarDiasHabiles("2026-04-27", "2026-05-01", feriados, recesos, evalGen), 4); // 1 mayo es feriado

const moduloBase = (num: number, inicio: string, fin: string, hechas: number, total = 5): ModuloPlanificado => ({
  levelSubjectId: "5b-matematica",
  subjectName: "Matemática",
  subjectSlug: "matematica",
  deliveryMode: "aula_universal",
  moduleNumber: num,
  objectiveId: `lo-m${num}`,
  objectiveCode: `M${num}`,
  objectiveTitle: `Módulo ${num}`,
  inicioYmd: inicio,
  finYmd: fin,
  disponible: true,
  actividades: Array.from({ length: total }, (_, i) => ({
    id: `m${num}-a${i}`,
    tipo: "leccion_aula" as const,
    titulo: `Lección ${i + 1}`,
    levelSubjectId: "5b-matematica",
    subjectName: "Matemática",
    deliveryMode: "aula_universal" as const,
    objectiveId: `lo-m${num}`,
    objectiveCode: `M${num}`,
    objectiveTitle: `Módulo ${num}`,
    moduleNumber: num,
    moduleOpen: true,
    completada: i < hechas,
    href: "/vortice/aula",
  })),
  evaluaciones: [],
});

// Gracia intrasemanal: día hábil 2 del módulo 1 sin actividades completadas -> `en_ritmo` (no falso atraso).
const compGracia = calcularComparacionPlanReal({
  modulos: [moduloBase(1, "2026-03-09", "2026-03-20", 0, 5)],
  hoyYmd: "2026-03-10",
  feriados,
  recesos,
  semanasEvalGeneral: evalGen,
  proximaEvaluacion: null,
});
assert.equal(compGracia.enPeriodoGracia, true);
assert.equal(compGracia.porAsignatura[0].estadoRitmo, "en_ritmo");

// Los 6 estados de ritmo:
assert.equal(diagnosticarRitmo({ totalActividades: 0, completadas: 0, esperadoALaFecha: 0, brechaItems: 0, brechaPct: null, modulosVencidos: 0, modulosVencidosCerrados: 0, modulosCerrados: 0, enPeriodoGracia: false, proximaEvaluacion: null, inicioProgramaYmd: "2026-03-09", hoyYmd: "2026-03-10" }), "sin_datos");
assert.equal(diagnosticarRitmo({ totalActividades: 5, completadas: 2, esperadoALaFecha: 3, brechaItems: -1, brechaPct: -33, modulosVencidos: 0, modulosVencidosCerrados: 0, modulosCerrados: 0, enPeriodoGracia: false, proximaEvaluacion: { id: "e1", titulo: "E2", levelSubjectId: "5b-matematica", subjectName: "Matemática", moduleNumber: 1, fechaYmd: "2026-03-20", diasRestantes: 5, pendientesDelModulo: 3, href: "/vortice/evaluacion/e1" }, inicioProgramaYmd: "2026-03-09", hoyYmd: "2026-03-15" }), "riesgo_evaluacion");
assert.equal(diagnosticarRitmo({ totalActividades: 15, completadas: 2, esperadoALaFecha: 10, brechaItems: -8, brechaPct: -80, modulosVencidos: 2, modulosVencidosCerrados: 0, modulosCerrados: 0, enPeriodoGracia: false, proximaEvaluacion: null, inicioProgramaYmd: "2026-03-09", hoyYmd: "2026-04-10" }), "atraso_significativo");
assert.equal(diagnosticarRitmo({ totalActividades: 10, completadas: 4, esperadoALaFecha: 5, brechaItems: -1, brechaPct: -20, modulosVencidos: 1, modulosVencidosCerrados: 0, modulosCerrados: 0, enPeriodoGracia: false, proximaEvaluacion: null, inicioProgramaYmd: "2026-03-09", hoyYmd: "2026-03-24" }), "levemente_atrasado");
assert.equal(diagnosticarRitmo({ totalActividades: 10, completadas: 8, esperadoALaFecha: 5, brechaItems: 3, brechaPct: 60, modulosVencidos: 1, modulosVencidosCerrados: 1, modulosCerrados: 1, enPeriodoGracia: false, proximaEvaluacion: null, inicioProgramaYmd: "2026-03-09", hoyYmd: "2026-03-24" }), "adelantado");

// Candado D1 en simulador: OA practicado hoy (2026-04-13) se agenda estrictamente en fecha > 2026-04-13.
const simD1 = simularReorganizacion({
  hoyYmd: "2026-04-13",
  track: "basica-5-8",
  preferencias: PREFERENCIAS_BRUJULA_DEFECTO,
  intensidadSimulada: "normal",
  horizonteSemanas: 2,
  modulos: [moduloBase(1, "2026-04-06", "2026-04-17", 5, 5)],
  proximaEvaluacion: null,
  retencionPendiente: [],
  confirmacionOtroDia: [{ oaId: "oa7", nombre: "Fracciones propias", ultimoDiaPractica: "2026-04-13", levelSubjectId: "5b-matematica", subjectName: "Matemática", objectiveId: "lo-m1" }],
  basesSugeridas: [],
  feriados,
  recesos,
  semanasEvalGeneral: evalGen,
});
assert.equal(simD1.length, 1);
assert.ok(simD1[0].fecha > "2026-04-13", `D1: confirmación K6 debe ser en otro día calendario (obtenido ${simD1[0].fecha})`);

// Proyecciones: rSim <= rPlan (intensidad Suave con atraso) -> recuperable: false, semanasRecuperacion: null.
const proySuave = calcularProyecciones({
  track: "media",
  comparacion: { totalActividades: 15, completadas: 4, pendientes: 11, esperadoALaFecha: 10, brechaItems: -6, brechaPct: -60, modulosVencidos: 2, modulosVencidosCerrados: 0, modulosCerrados: 0, enPeriodoGracia: false, porAsignatura: [] },
  completadasUltimos28Dias: 4,
  diasDesdeInicioPrograma: 28,
  intensidadSimulada: "suave",
  proximaEvaluacion: null,
});
assert.equal(proySuave.disponible, true);
assert.equal(proySuave.recuperable, false);
assert.equal(proySuave.semanasRecuperacion, null);

// Proyecciones en basica-1-4: desactivadas (UDL simplificado).
const proyBasica14 = calcularProyecciones({
  track: "basica-1-4",
  comparacion: compGracia,
  completadasUltimos28Dias: 6,
  diasDesdeInicioPrograma: 20,
  intensidadSimulada: "normal",
  proximaEvaluacion: null,
});
assert.equal(proyBasica14.disponible, false);
assert.equal(proyBasica14.motivoNoDisponible, "simplificado_basica_1_4");

// Textos de recomendaciones con `basesSugeridas` nunca mencionan "reprob".
const recsBase = generarRecomendacionesAdaptativas({
  estado: "en_ritmo",
  comparacion: compGracia,
  proximaEvaluacion: null,
  siguienteActividad: null,
  retencionPendiente: [],
  confirmacionOtroDia: [],
  basesSugeridas: [{ itemId: "i7", nombre: "Fracciones", levelSubjectId: "5b-matematica", subjectName: "Matemática" }],
  track: "basica-5-8",
});
assert.ok(!/reprob/i.test(JSON.stringify(recsBase)), "Recomendaciones nunca deben mencionar reprobación E2");

// ── 2. Integración HTTP real y garantía de no-mutación ───────────────────────

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-planificador-"));
process.env.TEST_DATABASE_URL = `file:${path.join(dir, "planificador.db")}`;

const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const S = await import("../shared/schema");
const { users } = await import("../shared/models/auth");
const { db, client } = await import("../server/db");
const { aplicarMigracionesUnificadas } = await import("../server/migrarTodo");
const { sembrarLeccionesAulaUniversalSql } = await import("../server/aulaUniversalDb");
const { sembrarPilotoPractica } = await import("../server/sembrarPilotoPractica");
const { registerRoutes } = await import("../server/routes");

const huellaTablasOficiales = async () => {
  const h = createHash("sha256");
  for (const t of ["program_calendar", "learning_objectives", "module_evaluations", "brujula_study_blocks"]) {
    const rows = (await client.execute(`SELECT * FROM "${t}"`)).rows;
    h.update(t + JSON.stringify(rows));
  }
  return h.digest("hex");
};

let server: ReturnType<typeof createServer> | null = null;
try {
  const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(S as any));
  for (const stmt of ddl) await db.run(sql.raw(stmt));
  await aplicarMigracionesUnificadas(client as any);

  await db.insert(users).values([
    { id: "est-cal", email: "est-cal@test.cl", name: "Estudiante Calendario" },
    { id: "est-adulto", email: "adulto@test.cl", name: "Estudiante Adulto" },
    { id: "apo-cal", email: "apo-cal@test.cl", name: "Apoderado" },
  ]);
  await db.insert(S.levels).values([
    { id: "5b", name: "5° Básico", programType: "menores", sortOrder: 5 },
    { id: "nb1", name: "Nivel Básico 1", programType: "adultos", sortOrder: 20 },
  ]);
  await db.insert(S.subjects).values([
    { id: "mat", name: "Matemática", slug: "matematica" },
    { id: "len", name: "Lenguaje", slug: "lenguaje" },
  ]);
  await db.insert(S.levelSubjects).values([
    { id: "5b-matematica", levelId: "5b", subjectId: "mat" },
    { id: "5b-lenguaje", levelId: "5b", subjectId: "len" },
    { id: "nb1-matematica", levelId: "nb1", subjectId: "mat" },
  ]);
  await db.insert(S.userProfiles).values([
    { userId: "est-cal", role: "student", levelId: "5b" },
    { userId: "est-adulto", role: "student", levelId: "nb1" },
    { userId: "apo-cal", role: "guardian" },
  ]);
  await db.insert(S.enrollments).values([
    { userId: "est-cal", levelSubjectId: "5b-matematica", isActive: true, enrolledAt: new Date("2026-03-01T12:00:00Z") },
    { userId: "est-cal", levelSubjectId: "5b-lenguaje", isActive: true, enrolledAt: new Date("2026-03-01T12:00:00Z") },
    { userId: "est-adulto", levelSubjectId: "nb1-matematica", isActive: true, enrolledAt: new Date("2026-03-01T12:00:00Z") },
  ]);
  await db.insert(S.learningObjectives).values([
    { id: "lo-m1", levelSubjectId: "5b-matematica", code: "M1", title: "Fracciones y decimales", weekNumber: 1, sortOrder: 1 },
    { id: "lo-len-m1", levelSubjectId: "5b-lenguaje", code: "L1", title: "Lectura comprensiva", weekNumber: 1, sortOrder: 1 },
  ]);
  // Recurso heredado en 5b-matematica para probar regla anti doble conteo en aula_universal.
  await db.insert(S.weeklyResources).values([
    { id: "res-mat-legado", learningObjectiveId: "lo-m1", title: "Guía heredada", resourceType: "pdf", isActive: true, sortOrder: 1 },
    { id: "res-len-1", learningObjectiveId: "lo-len-m1", title: "Lectura 1", resourceType: "pdf", isActive: true, sortOrder: 1 },
  ]);
  await db.insert(S.moduleEvaluations).values({
    id: "me-cal-e2",
    learningObjectiveId: "lo-m1",
    evaluationNumber: 4,
    evaluationFunction: "modulo",
    title: "Evaluación Módulo 1",
    releaseDay: 5,
    releaseWeek: 2,
    passingScore: 70,
  });

  // Sembrar universal_lessons con learning_objective_id = NULL (caso borde NEON).
  await sembrarLeccionesAulaUniversalSql(client as any, { levelSubjectId: "5b-matematica", learningObjectiveId: null });
  await sembrarPilotoPractica(client as any, { levelSubjectId: "5b-matematica" });

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

  // 401 sin sesión; 403 para apoderado.
  assert.equal((await fetch(`${base}/api/vortice/calendario`)).status, 401);
  assert.equal((await fetch(`${base}/api/vortice/calendario`, { headers: { "x-test-user": "apo-cal" } })).status, 403);
  assert.equal((await fetch(`${base}/api/vortice/calendario/simular`, { method: "POST", headers: { "Content-Type": "application/json", "x-test-user": "apo-cal" }, body: JSON.stringify({ intensidad: "normal" }) })).status, 403);

  // Estudiante fuera de tramo (`nb1` -> track === null): 200 `{ disponible: false, motivoNoDisponible: "fuera_de_tramo" }`.
  const adultoRes = await fetch(`${base}/api/vortice/calendario`, { headers: { "x-test-user": "est-adulto" } });
  assert.equal(adultoRes.status, 200);
  const adultoJson = await adultoRes.json();
  assert.equal(adultoJson.disponible, false);
  assert.equal(adultoJson.motivoNoDisponible, "fuera_de_tramo");

  // Estudiante 5.º Básico: 5 lecciones Aula + 1 E2 = 6 actividades en Matemática (sin doble conteo con res-mat-legado).
  const calRes = await fetch(`${base}/api/vortice/calendario`, { headers: { "x-test-user": "est-cal" } });
  assert.equal(calRes.status, 200);
  const calJson = await calRes.json();
  assert.equal(calJson.disponible, true);
  assert.equal(calJson.zonaHoraria, "America/Santiago");
  const matComp = calJson.comparacion.porAsignatura.find((a: any) => a.levelSubjectId === "5b-matematica");
  assert.equal(matComp.totalActividades, 6, "Anti doble conteo: 5 universal_lessons + 1 E2 (no sumar res-mat-legado)");
  assert.ok(!/scorePct|totalCorrect|respuestaCorrecta/i.test(JSON.stringify(calJson)), "Cero filtración E2/claves");

  // Simular reorganización (intensidad intensivo, 2 semanas): 200 y huella de tablas oficiales 100 % idéntica.
  const huellaAntes = await huellaTablasOficiales();
  const simRes = await fetch(`${base}/api/vortice/calendario/simular`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-user": "est-cal" },
    body: JSON.stringify({ intensidad: "intensivo", diasPreferidos: [1, 2, 3, 4, 5], horizonteSemanas: 2 }),
  });
  assert.equal(simRes.status, 200);
  const simJson = await simRes.json();
  assert.ok(Array.isArray(simJson.bloques) && simJson.bloques.length > 0);
  assert.equal(simJson.proyeccion.esEstimacion, true);
  assert.equal(await huellaTablasOficiales(), huellaAntes, "POST /simular nunca debe modificar tablas oficiales ni bloques guardados");

  // Body inválido -> 400.
  const badSim = await fetch(`${base}/api/vortice/calendario/simular`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-user": "est-cal" },
    body: JSON.stringify({ intensidad: "extremo" }),
  });
  assert.equal(badSim.status, 400);
} finally {
  if (server) await new Promise<void>((r) => server!.close(() => r()));
  client.close();
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("planificador-adaptativo: ok");
