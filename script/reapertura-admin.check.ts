// Suite M-R05: Reapertura administrativa auditable de E2 (D2 · migración 0006),
// triggers negativos de inmutabilidad, respeto de perfil vigente (60 min regular / 120 min neurodivergente),
// regla P18 (versión no expuesta) y consumo real de `progression_continuations` en el módulo siguiente.
// Ejecutar: npx tsx script/reapertura-admin.check.ts (incluido en npm run check:vortice)
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { InArgs } from "@libsql/client";

if (process.env.NODE_ENV === "production") {
  throw new Error("reapertura-admin.check no debe correr en producción");
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-mr05-"));
process.env.TEST_DATABASE_URL = `file:${path.join(dir, "mr05.db")}`;
process.env.VORTICE_EVALUACION_RUTAS = "1";

const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const S = await import("../shared/schema");
const { users } = await import("../shared/models/auth");
const { db, client } = await import("../server/db");
const { migrar, verificarDeriva } = await import("../server/migrar");
const {
  abrirProceso,
  iniciarIntento,
  responder,
  enviarIntento,
  cerrarProceso,
  reabrirPorAdministrador,
  listarProcesosEvaluacionAdmin,
  ErrorEvaluacion,
} = await import("../server/evaluacion");
const { cargarContinuacionesPendientes, loadVorticeOverview } = await import("../server/vortice");
const { sembrarEvaluacionPiloto } = await import("./lib/sembrarEvaluacionPiloto");
const { registerRoutes } = await import("../server/routes");

const x = (q: string, a: InArgs = []) => client.execute({ sql: q, args: a });

let server: ReturnType<typeof createServer> | null = null;
try {
  // 1. Esquema completo + migraciones 0001..0006 + verificarDeriva
  const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(S as any));
  for (const stmt of ddl) await db.run(sql.raw(stmt));
  const migRes = await migrar(client as any, "migrations/vortice");
  assert.ok(migRes.aplicadas.includes("0006_reapertura_administrativa.sql"), "0006 debe aplicarse");
  const deriva = await verificarDeriva(client as any);
  assert.equal(deriva.ok, true, `Sin deriva tras 0006: ${JSON.stringify(deriva)}`);

  // 2. Sembrar usuarios (admin, estudiante regular, estudiante neurodivergente, estudiante P18) + módulos 1 y 2.
  await db.insert(users).values([
    { id: "admin-1", email: "admin@barkley.test", name: "Directora Admin" },
    { id: "est-reg", email: "reg@barkley.test", name: "Estudiante Regular" },
    { id: "est-nd", email: "nd@barkley.test", name: "Estudiante ND" },
    { id: "est-p18", email: "p18@barkley.test", name: "Estudiante P18" },
  ]);
  await db.insert(S.levels).values({ id: "5b", name: "5° Básico", programType: "menores", sortOrder: 5 });
  await db.insert(S.subjects).values({ id: "mat", name: "Matemática", slug: "matematica" });
  await db.insert(S.levelSubjects).values({ id: "5b-matematica", levelId: "5b", subjectId: "mat" });
  await db.insert(S.userProfiles).values([
    { userId: "admin-1", role: "admin" },
    { userId: "est-reg", role: "student", levelId: "5b", evaluationProfile: "regular" },
    { userId: "est-nd", role: "student", levelId: "5b", evaluationProfile: "neurodivergente" },
    { userId: "est-p18", role: "student", levelId: "5b", evaluationProfile: "regular" },
  ]);
  await db.insert(S.enrollments).values([
    { userId: "est-reg", levelSubjectId: "5b-matematica", isActive: true },
    { userId: "est-nd", levelSubjectId: "5b-matematica", isActive: true },
    { userId: "est-p18", levelSubjectId: "5b-matematica", isActive: true },
  ]);
  await db.insert(S.learningObjectives).values([
    { id: "lo-m1", levelSubjectId: "5b-matematica", code: "M1", title: "Módulo 1 · Fracciones", weekNumber: 1, sortOrder: 1 },
    { id: "lo-m2", levelSubjectId: "5b-matematica", code: "M2", title: "Módulo 2 · Operaciones", weekNumber: 2, sortOrder: 2 },
  ]);
  await db.insert(S.moduleEvaluations).values({
    id: "me-m1-e2",
    learningObjectiveId: "lo-m1",
    evaluationNumber: 4,
    evaluationFunction: "modulo",
    title: "Evaluación Módulo 1",
    releaseDay: 1,
    releaseWeek: 1,
    passingScore: 70,
  });

  const clave = await sembrarEvaluacionPiloto(x, {
    levelSubjectId: "5b-matematica",
    evaluacionId: "me-m1-e2",
    versionId: "ev-mr05-v1",
  });

  const responderTodo = async (intentoId: string, estudianteId: string, acertarTodo: boolean) => {
    const qs = (
      await x("SELECT question_version_id FROM evaluation_version_questions WHERE evaluation_version_id = 'ev-mr05-v1' ORDER BY position")
    ).rows;
    for (const r of qs) {
      const qid = String(r.question_version_id);
      const corr = clave[qid];
      const opt = acertarTodo ? corr : ["A", "B", "C", "D"].find((o) => o !== corr)!;
      await responder(client as any, { intentoId, estudianteId, preguntaVersionId: qid, opcionId: opt });
    }
  };

  // 3. Estudiante regular reprueba normal + extra -> proceso cerrado como `reprobado` + progression_continuations creada.
  const procReg = await abrirProceso(client as any, {
    estudianteId: "est-reg",
    evaluacionId: "me-m1-e2",
    versionId: "ev-mr05-v1",
    perfil: "regular",
  });
  const intNorm = await iniciarIntento(client as any, { instanciaId: procReg.instanciaId, estudianteId: "est-reg", tipo: "normal" });
  await responderTodo(intNorm.intentoId, "est-reg", false);
  await enviarIntento(client as any, { intentoId: intNorm.intentoId, estudianteId: "est-reg" });

  const intExtra = await iniciarIntento(client as any, { instanciaId: procReg.instanciaId, estudianteId: "est-reg", tipo: "extra" });
  // Responder mal en el extra para reprobar definitivamente.
  for (const qid of intExtra.preguntas) {
    const corr = clave[qid];
    const mal = ["A", "B", "C", "D"].find((o) => o !== corr)!;
    await responder(client as any, { intentoId: intExtra.intentoId, estudianteId: "est-reg", preguntaVersionId: qid, opcionId: mal });
  }
  await enviarIntento(client as any, { intentoId: intExtra.intentoId, estudianteId: "est-reg" });
  const cierreReg = await cerrarProceso(client as any, { procesoId: procReg.procesoId, estudianteId: "est-reg" });
  assert.equal(cierreReg.estado, "reprobado");
  assert.equal(cierreReg.moduloSiguiente, true);

  // 4. Consumo real de `progression_continuations` en módulo siguiente (Módulo 2).
  const conts = await cargarContinuacionesPendientes(db, "est-reg");
  assert.equal(conts.length, 1);
  assert.equal(conts[0].processId, procReg.procesoId);
  assert.equal(conts[0].targetWeekNumber, 2);
  assert.ok(conts[0].pendingItems.length > 0, "Debe listar los ítems pendientes reales");
  assert.ok(conts[0].pendingItems.every((it) => it.code && it.name), "Los ítems pendientes deben resolver código y nombre");

  const overview = await loadVorticeOverview(db, "est-reg", new Date("2026-06-01T12:00:00Z"));
  assert.ok((overview.subjects[0]?.requiereBase?.length ?? 0) > 0, "loadVorticeOverview debe exponer requiereBase en el módulo siguiente");

  // 5. NEGATIVO DE TRIGGER: UPDATE directo en proceso `reprobado` SIN fila en `evaluation_reopenings` -> ABORTADO por SQLite.
  await assert.rejects(
    x("UPDATE evaluation_processes SET status = 'recuperacion_abierta', closed_at = NULL, close_cause = NULL WHERE id = ?", [procReg.procesoId]),
    /un proceso cerrado no se reabre|transición no permitida/,
    "UPDATE directo sin fila en evaluation_reopenings debe ser abortado",
  );

  // 6. Motivo corto (< 10 chars) rechazado.
  await assert.rejects(
    reabrirPorAdministrador(client as any, {
      procesoId: procReg.procesoId,
      estudianteId: "est-reg",
      administradorId: "admin-1",
      motivo: "corte",
    }),
    (e: unknown) => e instanceof ErrorEvaluacion && e.codigo === "motivo_invalido",
  );

  // 7. Reapertura administrativa válida para estudiante regular (60 min, umbral 70 %).
  const intentosAntes = Number((await x("SELECT COUNT(*) AS n FROM evaluation_attempts WHERE student_id = 'est-reg'")).rows[0].n);
  const reapReg = await reabrirPorAdministrador(client as any, {
    procesoId: procReg.procesoId,
    estudianteId: "est-reg",
    administradorId: "admin-1",
    motivo: "Corte prolongado de suministro eléctrico verificado con apoderado.",
  });
  assert.equal(reapReg.perfil, "regular");
  assert.equal(reapReg.duracionMin, 60);
  assert.equal(reapReg.umbral, 70);
  assert.equal(reapReg.sourceAttemptId, intExtra.intentoId);

  // Verificar que el proceso quedó en `recuperacion_abierta` y los intentos previos siguen intactos.
  const procState = (await x("SELECT status, closed_at, close_cause FROM evaluation_processes WHERE id = ?", [procReg.procesoId])).rows[0];
  assert.equal(String(procState.status), "recuperacion_abierta");
  assert.equal(procState.closed_at, null);
  assert.equal(Number((await x("SELECT COUNT(*) AS n FROM evaluation_attempts WHERE student_id = 'est-reg'")).rows[0].n), intentosAntes);

  // Triggers de solo inserción en `evaluation_reopenings`.
  await assert.rejects(x("UPDATE evaluation_reopenings SET reason = 'otro motivo alterado' WHERE id = ?", [reapReg.reopeningId]), /solo inserción/);
  await assert.rejects(x("DELETE FROM evaluation_reopenings WHERE id = ?", [reapReg.reopeningId]), /solo inserción/);

  // Segunda reapertura del mismo proceso -> rechazada.
  await assert.rejects(
    reabrirPorAdministrador(client as any, {
      procesoId: procReg.procesoId,
      estudianteId: "est-reg",
      administradorId: "admin-1",
      motivo: "Segundo intento de reapertura que debe fallar.",
    }),
    (e: unknown) => e instanceof ErrorEvaluacion && e.codigo === "reapertura_ya_existe",
  );

  // En la instancia de reapertura NO se permite intento `extra`, solo 1 intento completo.
  await assert.rejects(
    iniciarIntento(client as any, { instanciaId: reapReg.nuevaInstanciaId, estudianteId: "est-reg", tipo: "extra" }),
    (e: unknown) => e instanceof ErrorEvaluacion,
  );

  // Estudiante rinde y aprueba el intento reabierto -> cierra proceso como `aprobado`.
  const intReap = await iniciarIntento(client as any, { instanciaId: reapReg.nuevaInstanciaId, estudianteId: "est-reg", tipo: "normal" });
  assert.equal(Math.round((intReap.expiresAt - intReap.startedAt) / 60), 60);
  await responderTodo(intReap.intentoId, "est-reg", true);
  const envReap = await enviarIntento(client as any, { intentoId: intReap.intentoId, estudianteId: "est-reg" });
  assert.equal(envReap.aprobado, true);
  const cierreFinal = await cerrarProceso(client as any, { procesoId: procReg.procesoId, estudianteId: "est-reg" });
  assert.equal(cierreFinal.estado, "aprobado");

  // Un proceso `aprobado` nunca puede volver a reabrirse ni por SQL ni por servicio.
  await assert.rejects(
    x("UPDATE evaluation_processes SET status = 'recuperacion_abierta', closed_at = NULL, close_cause = NULL WHERE id = ?", [procReg.procesoId]),
    /un proceso cerrado no se reabre|transición no permitida/,
  );

  // 8. Perfil neurodivergente (D2 confirmada): reapertura respeta 120 min y umbral 50 %.
  const procNd = await abrirProceso(client as any, {
    estudianteId: "est-nd",
    evaluacionId: "me-m1-e2",
    versionId: "ev-mr05-v1",
    perfil: "neurodivergente",
  });
  const intNd = await iniciarIntento(client as any, { instanciaId: procNd.instanciaId, estudianteId: "est-nd", tipo: "normal" });
  await responderTodo(intNd.intentoId, "est-nd", false);
  await enviarIntento(client as any, { intentoId: intNd.intentoId, estudianteId: "est-nd" });

  const reapNd = await reabrirPorAdministrador(client as any, {
    procesoId: procNd.procesoId,
    estudianteId: "est-nd",
    administradorId: "admin-1",
    motivo: "Desconexión involuntaria de red durante evaluación con adaptación.",
  });
  assert.equal(reapNd.perfil, "neurodivergente");
  assert.equal(reapNd.duracionMin, 120);
  assert.equal(reapNd.umbral, 50);
  const intNdReap = await iniciarIntento(client as any, { instanciaId: reapNd.nuevaInstanciaId, estudianteId: "est-nd", tipo: "normal" });
  assert.equal(Math.round((intNdReap.expiresAt - intNdReap.startedAt) / 60), 120);

  // 9. Regla P18: si la única versión ya quedó expuesta (instancia cerrada y `review_at <= ahora`),
  // no se puede reabrir sobre esa versión.
  const ahoraP18 = Number((await x("SELECT unixepoch('subsec')")).rows[0][0]);
  const procP18 = await abrirProceso(client as any, {
    estudianteId: "est-p18",
    evaluacionId: "me-m1-e2",
    versionId: "ev-mr05-v1",
    perfil: "regular",
    reviewAt: ahoraP18 - 60,
  });
  const intP18 = await iniciarIntento(client as any, { instanciaId: procP18.instanciaId, estudianteId: "est-p18", tipo: "normal" });
  await responderTodo(intP18.intentoId, "est-p18", false);
  await enviarIntento(client as any, { intentoId: intP18.intentoId, estudianteId: "est-p18" });
  const extP18 = await iniciarIntento(client as any, { instanciaId: procP18.instanciaId, estudianteId: "est-p18", tipo: "extra" });
  for (const qid of extP18.preguntas) {
    const corr = clave[qid];
    const mal = ["A", "B", "C", "D"].find((o) => o !== corr)!;
    await responder(client as any, { intentoId: extP18.intentoId, estudianteId: "est-p18", preguntaVersionId: qid, opcionId: mal });
  }
  await enviarIntento(client as any, { intentoId: extP18.intentoId, estudianteId: "est-p18" });
  await cerrarProceso(client as any, { procesoId: procP18.procesoId, estudianteId: "est-p18" });
  await assert.rejects(
    reabrirPorAdministrador(client as any, {
      procesoId: procP18.procesoId,
      estudianteId: "est-p18",
      administradorId: "admin-1",
      motivo: "Intento de reapertura con única versión ya expuesta (P18).",
    }),
    (e: unknown) => e instanceof ErrorEvaluacion && e.codigo === "version_no_encontrada",
  );

  // 10. Listado admin + rutas HTTP reales.
  const lista = await listarProcesosEvaluacionAdmin(client as any);
  const filaReg = lista.find((f) => f.procesoId === procReg.procesoId);
  assert.ok(filaReg?.reapertura, "Listado admin debe incluir trazabilidad completa de la reapertura");
  assert.equal(filaReg.reapertura.adminUserId, "admin-1");
  assert.equal(filaReg.reapertura.resultadoIntento?.passed, true);

  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    const uid = req.header("x-test-user");
    if (uid) {
      req.user = { id: uid };
      req.isAuthenticated = () => true;
    } else {
      req.isAuthenticated = () => false;
    }
    next();
  });
  server = createServer(app);
  await registerRoutes(server, app);
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", () => resolve()));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  assert.equal((await fetch(`${base}/api/admin/vortice/evaluaciones/procesos`)).status, 401);
  assert.equal((await fetch(`${base}/api/admin/vortice/evaluaciones/procesos`, { headers: { "x-test-user": "est-reg" } })).status, 403);
  const adminRes = await fetch(`${base}/api/admin/vortice/evaluaciones/procesos`, { headers: { "x-test-user": "admin-1" } });
  assert.equal(adminRes.status, 200);
  const adminJson = await adminRes.json();
  assert.ok(Array.isArray(adminJson) && adminJson.length === 3);

  const contHttp = await fetch(`${base}/api/vortice/continuaciones`, { headers: { "x-test-user": "est-reg" } });
  assert.equal(contHttp.status, 200);
  const contJson = await contHttp.json();
  assert.equal(contJson.length, 1);

  assert.equal((await verificarDeriva(client as any)).ok, true);
} finally {
  if (server) await new Promise<void>((r) => server!.close(() => r()));
  client.close();
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("reapertura-admin: ok");
