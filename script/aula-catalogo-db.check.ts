// Suite Ola 3 (M-R06 + M-R07 + M-R08):
// - M-R06: Aula Universal en BD (`universal_lessons`), `delivery_mode` por asignatura,
//   ocultamiento de puertas multimedia sin `mediaUrl` real, y depuración de 0 solapamiento con E2.
// - M-R07: Actividad unificada (Aula + Práctica + P0-E) visible en Inicio, Alertas (`atencion.ts`) y
//   Familia (`familia.ts`) sin filtrar notas ni pautas E2.
// - M-R08: Apagado efectivo de Copiloto IA (`ENABLE_AI_COPILOT=false`, 403 C19), retiro de suma dual
//   en VorticeInicio y runner unificado `aplicarMigracionesUnificadas` idempotente en 2 corridas.
// Ejecutar: npx tsx script/aula-catalogo-db.check.ts (incluido en npm run check:vortice)
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { InArgs } from "@libsql/client";
import { puertasDisponibles, seleccionarPuertaPrincipal } from "../shared/aulaUniversal";

if (process.env.NODE_ENV === "production") {
  throw new Error("aula-catalogo-db.check no debe correr en producción");
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-ola3-"));
process.env.TEST_DATABASE_URL = `file:${path.join(dir, "ola3.db")}`;
delete process.env.ENABLE_AI_COPILOT;

const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const S = await import("../shared/schema");
const { users } = await import("../shared/models/auth");
const { db, client } = await import("../server/db");
const { aplicarMigracionesUnificadas } = await import("../server/migrarTodo");
const { sembrarLeccionesAulaUniversalSql, obtenerLeccionesAulaDesdeDb } = await import("../server/aulaUniversalDb");
const { sembrarPilotoPractica } = await import("../server/sembrarPilotoPractica");
const { sembrarEvaluacionPiloto } = await import("./lib/sembrarEvaluacionPiloto");
const { registrarPracticaEnMotor } = await import("../server/mapaConocimiento");
const { registrarComprobacionProceso } = await import("../server/aulaUniversal");
const { loadVorticeOverview } = await import("../server/vortice");
const { ultimaActividad, diasSinActividadDe } = await import("../server/atencion");
const { loadFamiliaResumen, upsertGuardianLink } = await import("../server/familia");
const { registerRoutes } = await import("../server/routes");

const x = (q: string, a: InArgs = []) => client.execute({ sql: q, args: a });

let server: ReturnType<typeof createServer> | null = null;
try {
  // 1. M-R08: Esquema base + runner unificado en 2 corridas consecutivas idempotentes + verificarDeriva.
  const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(S as any));
  for (const stmt of ddl) await db.run(sql.raw(stmt));

  const m1 = await aplicarMigracionesUnificadas(client as any);
  assert.equal(m1.deriva.ok, true);
  assert.ok(m1.aplicadas.includes("0006_reapertura_administrativa.sql"));

  const m2 = await aplicarMigracionesUnificadas(client as any);
  assert.equal(m2.deriva.ok, true);
  assert.deepEqual(m2.aplicadas, [], "Segunda corrida del migrador unificado debe ser 100 % idempotente");

  // 2. Sembrar 2 asignaturas (Matemática 5.º -> aula_universal; Lenguaje 5.º -> legacy) + estudiante + apoderado.
  await db.insert(users).values([
    { id: "est-ola3", email: "est-ola3@test.cl", name: "Estudiante Ola 3" },
    { id: "apo-ola3", email: "apo-ola3@test.cl", name: "Apoderado Ola 3" },
  ]);
  await db.insert(S.levels).values({ id: "5b", name: "5° Básico", programType: "menores", sortOrder: 5 });
  await db.insert(S.subjects).values([
    { id: "mat", name: "Matemática", slug: "matematica" },
    { id: "len", name: "Lenguaje", slug: "lenguaje" },
  ]);
  await db.insert(S.levelSubjects).values([
    { id: "5b-matematica", levelId: "5b", subjectId: "mat" },
    { id: "5b-lenguaje", levelId: "5b", subjectId: "len" },
  ]);
  await db.insert(S.userProfiles).values([
    { userId: "est-ola3", role: "student", levelId: "5b" },
    { userId: "apo-ola3", role: "guardian" },
  ]);
  const fechaMatricula = new Date("2026-03-01T12:00:00Z");
  await db.insert(S.enrollments).values([
    { userId: "est-ola3", levelSubjectId: "5b-matematica", isActive: true, enrolledAt: fechaMatricula },
    { userId: "est-ola3", levelSubjectId: "5b-lenguaje", isActive: true, enrolledAt: fechaMatricula },
  ]);
  await db.insert(S.learningObjectives).values({
    id: "lo-5b-m1",
    levelSubjectId: "5b-matematica",
    code: "M1",
    title: "Fracciones y decimales",
    weekNumber: 1,
  });
  await db.insert(S.moduleEvaluations).values({
    id: "me-ola3-e2",
    learningObjectiveId: "lo-5b-m1",
    evaluationNumber: 4,
    evaluationFunction: "modulo",
    title: "Evaluación Módulo 1",
    releaseDay: 5,
    releaseWeek: 2,
    passingScore: 70,
  });

  // 3. M-R06: Sembrar Aula Universal en BD + sembrar práctica y evaluación para comprobar 0 solapamiento.
  const seedAula = await sembrarLeccionesAulaUniversalSql(client as any);
  assert.equal(seedAula.sembradas, 5);
  assert.equal(seedAula.levelSubjectId, "5b-matematica");

  const leccionesDb = await obtenerLeccionesAulaDesdeDb(db, client as any);
  assert.equal(leccionesDb.length, 5);

  // Puertas multimedia sin mediaUrl real quedan ocultas (solo queda `explorar`).
  for (const l of leccionesDb) {
    assert.deepEqual(puertasDisponibles(l), ["explorar"], `OA ${l.oaId}: puertas sin mediaUrl real deben ocultarse`);
    const sel = seleccionarPuertaPrincipal(l, "video");
    assert.equal(sel.principal.tipo, "explorar");
    assert.equal(sel.secundarias.length, 0);
  }
  // Si una lección SÍ tiene `mediaUrl` real en `video`, aparece junto a `explorar`.
  const conVideo = {
    ...leccionesDb[0],
    puertas: {
      ...leccionesDb[0].puertas,
      video: { ...leccionesDb[0].puertas.video, mediaUrl: "https://cdn.barkleyinstituto.cl/mat5-oa7.mp4" },
    },
  };
  assert.deepEqual(puertasDisponibles(conVideo), ["video", "explorar"]);
  assert.equal(seleccionarPuertaPrincipal(conVideo, "video").principal.tipo, "video");
  assert.equal(seleccionarPuertaPrincipal(conVideo, "video").secundarias.length, 1);

  // Verificar 0 solapamiento de enunciados entre TODOS los 55 ítems de práctica y los 45 de evaluación.
  await sembrarPilotoPractica(client as any, { levelSubjectId: "5b-matematica" });
  await sembrarEvaluacionPiloto(x, { levelSubjectId: "5b-matematica", evaluacionId: "me-ola3-e2", versionId: "ev-ola3-1" });
  const solapeTotal = (
    await x(
      `SELECT COUNT(*) AS n
       FROM question_versions p
       JOIN question_versions e ON e.bank = 'evaluacion' AND (p.id = e.id OR trim(lower(p.stem)) = trim(lower(e.stem)))
       WHERE p.bank = 'practica'`,
    )
  ).rows[0];
  assert.equal(Number(solapeTotal.n), 0, "M-R06: cero solapamiento total entre práctica (55) y evaluación (45)");

  // 4. M-R07: Actividad exclusivamente del nuevo circuito (Aula Universal + Práctica, sin student_progress legado).
  const ahora = new Date("2026-04-10T15:00:00Z");
  await registrarComprobacionProceso(db, {
    userId: "est-ola3",
    oaId: "oa7",
    body: { respuestas: { "oa7-c1": "A", "oa7-c2": "C", "oa7-c3": "A" }, origen: "normal" },
    now: ahora,
  });
  await registrarComprobacionProceso(db, {
    userId: "est-ola3",
    oaId: "oa8",
    body: { respuestas: { "oa8-c1": "A", "oa8-c2": "C", "oa8-c3": "B" }, origen: "normal" },
    now: ahora,
  });
  await registrarPracticaEnMotor(client as any, {
    estudianteId: "est-ola3",
    oaId: "oa7",
    preguntaId: "oa7-ind-f1-v1",
    opcionId: "B",
    usoPista: false,
    clientSubmissionId: "ola3-prac-1",
  });

  // Inicio (loadVorticeOverview): deliveryMode correcto + avance Aula reflejado sin mezclar dominio K6.
  const overview = await loadVorticeOverview(db, "est-ola3", ahora);
  const matSub = overview.subjects.find((s) => s.levelSubjectId === "5b-matematica");
  const lenSub = overview.subjects.find((s) => s.levelSubjectId === "5b-lenguaje");
  assert.equal(matSub?.deliveryMode, "aula_universal");
  assert.equal(lenSub?.deliveryMode, "legacy");
  assert.deepEqual(matSub?.aulaProgreso, { logradas: 2, total: 5 });
  // 2 lecciones logradas / (5 lecciones Aula + 1 evaluación de cierre) = 33 %
  assert.equal(matSub?.percent, 33);

  // Atención / Tutoría: estudiante desaparece de «inactivos» gracias a la actividad del nuevo circuito.
  const ultAct = await ultimaActividad(db, "est-ola3");
  assert.ok(ultAct instanceof Date, "ultimaActividad debe detectar actividad de Aula/Práctica");
  const diasInact = await diasSinActividadDe(db, "est-ola3", ahora);
  assert.equal(diasInact, 0, "Estudiante activo en Aula/Práctica no debe figurar con días de inactividad");

  // Familia: refleja días reales de estudio y resumen cualitativo sin notas/puntajes E2.
  const linkRes = await upsertGuardianLink(
    db,
    { guardianUserId: "apo-ola3", studentUserId: "est-ola3", status: "activo" },
    "admin-test",
  );
  assert.equal(linkRes.ok, true);
  const fam = await loadFamiliaResumen(db, "apo-ola3", "est-ola3", ahora);
  assert.ok(fam);
  assert.ok(fam.studyDays >= 1, "Familia debe contar días de estudio desde Aula/Práctica");
  assert.deepEqual(fam.acompanamiento, {
    leccionesIniciadas: 2,
    leccionesLogradas: 2,
    practicasRespondidas: 1,
    estadoCualitativo: "avanzando",
  });
  assert.equal("scorePct" in (fam as any), false);
  assert.equal("nota" in (fam as any), false);

  // 5. HTTP: Aula lee desde BD (modificación en universal_lessons se refleja en HTTP) + Copiloto IA bloqueado (403 C19).
  await x("UPDATE universal_lessons SET payload_json = replace(payload_json, 'Fracciones propias', 'Fracciones propias (BD)') WHERE oa_id = 'oa7'");

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

  const aulaHttp = await fetch(`${base}/api/vortice/aula/piloto`, { headers: { "x-test-user": "est-ola3" } });
  assert.equal(aulaHttp.status, 200);
  const aulaJson = await aulaHttp.json();
  assert.ok(String(aulaJson.lecciones[0].titulo).includes("(BD)"), "GET /api/vortice/aula/piloto debe leer desde BD");
  assert.ok(!JSON.stringify(aulaJson).includes("respuestaCorrecta"), "Cero claves de respuesta en /api/vortice/aula/piloto");

  // M-R08 (C19): Copiloto IA desactivado por defecto -> 403.
  const chatRes = await fetch(`${base}/api/academic-copilot/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-user": "est-ola3" },
    body: JSON.stringify({ message: "Hola" }),
  });
  assert.equal(chatRes.status, 403, "Copiloto IA debe devolver 403 con ENABLE_AI_COPILOT apagado");

  const copList = await fetch(`${base}/api/gemini-copilots`, { headers: { "x-test-user": "est-ola3" } });
  assert.equal(copList.status, 403);

  const copLvl = await fetch(`${base}/api/gemini-copilots/by-level/5b`, { headers: { "x-test-user": "est-ola3" } });
  assert.equal(copLvl.status, 403);

  // Verificación estática M-R08: VorticeInicio no suma ambos motores de repaso y GeminiCopilotButton se oculta en sidebar si falla/403.
  const inicioSrc = fs.readFileSync("client/src/pages/vortice/VorticeInicio.tsx", "utf8");
  assert.ok(!inicioSrc.includes("repasosMapa + pendientesRepaso"), "VorticeInicio no debe sumar repaso legado + retención M4");
  const copBtnSrc = fs.readFileSync("client/src/components/GeminiCopilotButton.tsx", "utf8");
  assert.ok(copBtnSrc.includes("if (isLoading || isError || !copilot)"), "GeminiCopilotButton debe ocultarse en todas las variantes al recibir 403");
} finally {
  if (server) await new Promise<void>((r) => server!.close(() => r()));
  client.close();
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("aula-catalogo-db: ok");
