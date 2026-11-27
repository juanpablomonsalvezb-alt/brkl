// Suite M-R03: unificación del dominio piloto (`d-piloto-mat5-u3`), resolución de `5b-matematica`,
// idempotencia de siembra tipo Preview, salud 200 en /api/health/vortice y cruce E2-Mapa por item_id real.
// Ejecutar: npx tsx script/siembra-preview-unificada.check.ts (incluido en npm run check:vortice)
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { InArgs } from "@libsql/client";

if (process.env.NODE_ENV === "production") {
  throw new Error("siembra-preview-unificada.check no debe correr en producción");
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-preview-unif-"));
process.env.TEST_DATABASE_URL = `file:${path.join(dir, "preview.db")}`;

const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const S = await import("../shared/schema");
const { users } = await import("../shared/models/auth");
const { db, client } = await import("../server/db");
const { migrar } = await import("../server/migrar");
const { sembrarPilotoPractica, DOMINIO_PILOTO_PRACTICA_ID } = await import("../server/sembrarPilotoPractica");
const { sembrarEvaluacionPiloto } = await import("./lib/sembrarEvaluacionPiloto");
const { abrirProceso, iniciarIntento, responder, enviarIntento, cerrarProceso } = await import("../server/evaluacion");
const { relojMotor } = await import("../server/reloj");
const { registerRoutes } = await import("../server/routes");

let server: ReturnType<typeof createServer> | null = null;
try {
  const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(S as any));
  for (const stmt of ddl) await db.run(sql.raw(stmt));
  await migrar(client as any, "migrations/vortice");

  // Formato real de Preview/Producción: `5b-matematica` (no `ls-mat-5b`).
  await db.insert(users).values({ id: "ficticio-estudiante", email: "est@preview.test", name: "Estudiante Preview" });
  await db.insert(S.levels).values({ id: "5b", name: "5° Básico", programType: "menores", sortOrder: 5 });
  await db.insert(S.subjects).values({ id: "mat", name: "Matemática", slug: "matematica" });
  await db.insert(S.levelSubjects).values({ id: "5b-matematica", levelId: "5b", subjectId: "mat" });
  await db.insert(S.userProfiles).values({ userId: "ficticio-estudiante", role: "student", levelId: "5b" });
  await db.insert(S.enrollments).values({ userId: "ficticio-estudiante", levelSubjectId: "5b-matematica", isActive: true });
  await db.insert(S.learningObjectives).values({
    id: "lo-5b-m1",
    levelSubjectId: "5b-matematica",
    code: "M1",
    title: "Fracciones y decimales",
    weekNumber: 1,
  });
  await db.insert(S.moduleEvaluations).values({
    id: "ficticio-e2",
    learningObjectiveId: "lo-5b-m1",
    evaluationNumber: 4,
    evaluationFunction: "modulo",
    title: "Evaluación módulo 1",
    releaseDay: 5,
    releaseWeek: 2,
    passingScore: 70,
  });

  const x = (q: string, a: InArgs = []) => client.execute({ sql: q, args: a });

  // Corrida 1 (sin pasar levelSubjectId -> resuelve `5b-matematica` automáticamente) + evaluación E2.
  const s1 = await sembrarPilotoPractica(client as any);
  assert.equal(s1.domainId, DOMINIO_PILOTO_PRACTICA_ID);
  assert.equal(s1.yaPublicado, false);
  const clave1 = await sembrarEvaluacionPiloto(x, {
    levelSubjectId: "5b-matematica",
    evaluacionId: "ficticio-e2",
    versionId: "ev-preview-1",
  });
  assert.equal(Object.keys(clave1).length, 45);

  // Corrida 2: 100 % idempotente.
  const s2 = await sembrarPilotoPractica(client as any);
  assert.equal(s2.yaPublicado, true);
  const clave2 = await sembrarEvaluacionPiloto(x, {
    levelSubjectId: "5b-matematica",
    evaluacionId: "ficticio-e2",
    versionId: "ev-preview-1",
  });
  assert.deepEqual(clave2, clave1);

  // Verificar un único dominio publicado y que práctica (25) + evaluación (45) comparten exactamente los mismos 5 item_id.
  const doms = await x("SELECT id, level_subject_id FROM knowledge_domains");
  assert.equal(doms.rows.length, 1);
  assert.equal(String(doms.rows[0].id), DOMINIO_PILOTO_PRACTICA_ID);
  assert.equal(String(doms.rows[0].level_subject_id), "5b-matematica");

  const vers = await x("SELECT status FROM knowledge_domain_versions WHERE domain_id = ?", [DOMINIO_PILOTO_PRACTICA_ID]);
  assert.equal(vers.rows.length, 1);
  assert.equal(String(vers.rows[0].status), "publicada");

  const pracItems = (await x("SELECT DISTINCT item_id FROM question_versions WHERE bank = 'practica' ORDER BY item_id")).rows.map((r) => String(r.item_id));
  const evalItems = (await x("SELECT DISTINCT item_id FROM question_versions WHERE bank = 'evaluacion' ORDER BY item_id")).rows.map((r) => String(r.item_id));
  assert.equal(pracItems.length, 5);
  assert.deepEqual(evalItems, pracItems, "Práctica y Evaluación E2 deben compartir los mismos 5 item_id");

  const conteos = (await x("SELECT (SELECT COUNT(*) FROM question_versions WHERE bank = 'practica') AS qp, (SELECT COUNT(*) FROM question_versions WHERE bank = 'evaluacion') AS qe")).rows[0];
  // 25 del aula + 30 del banco independiente de práctica (M-R04) = 55 en `bank = 'practica'`; 45 en `bank = 'evaluacion'`.
  assert.equal(Number(conteos.qp), 55);
  assert.equal(Number(conteos.qe), 45);

  // Separación estricta de bancos (M-R04 + M-R06): cero solapamiento de IDs o enunciados entre
  // TODOS los 55 ítems de `bank = 'practica'` (25 aula depurados + 30 independientes) y los 45 de `bank = 'evaluacion'`.
  const solapeTotal = (
    await x(
      `SELECT COUNT(*) AS n
       FROM question_versions p
       JOIN question_versions e ON e.bank = 'evaluacion' AND (p.id = e.id OR trim(lower(p.stem)) = trim(lower(e.stem)))
       WHERE p.bank = 'practica'`,
    )
  ).rows[0];
  assert.equal(Number(solapeTotal.n), 0, "Cero solapamiento de IDs o enunciados entre práctica (55) y evaluación (45)");

  // Política vigente con D1 (`k6_separation: "dia"`).
  const polRow = (await x("SELECT rules_json FROM mastery_policies WHERE status = 'aprobada' ORDER BY version DESC LIMIT 1")).rows[0];
  assert.equal(JSON.parse(String(polRow.rules_json)).k6_separation, "dia");

  // Rendir E2 fallando 1 pregunta de OA 10 (reviewAt ya vencido) y verificar cruce HTTP por item_id real.
  const ahora = await relojMotor(client as any).ahora();
  const proc = await abrirProceso(client as any, {
    estudianteId: "ficticio-estudiante",
    evaluacionId: "ficticio-e2",
    versionId: "ev-preview-1",
    perfil: "regular",
    reviewAt: ahora - 10,
  });
  const intento = await iniciarIntento(client as any, { instanciaId: proc.instanciaId, estudianteId: "ficticio-estudiante", tipo: "normal" });
  const qs = (
    await x("SELECT question_version_id, item_id FROM evaluation_version_questions WHERE evaluation_version_id = 'ev-preview-1' ORDER BY position")
  ).rows;
  const oa10ItemId = `${DOMINIO_PILOTO_PRACTICA_ID}-oa10`;
  let falloOa10 = false;
  for (const r of qs) {
    const qId = String(r.question_version_id);
    const itId = String(r.item_id);
    const corr = clave1[qId];
    const opt = !falloOa10 && itId === oa10ItemId ? ["A", "B", "C", "D"].find((o) => o !== corr)! : corr;
    if (itId === oa10ItemId) falloOa10 = true;
    await responder(client as any, { intentoId: intento.intentoId, estudianteId: "ficticio-estudiante", preguntaVersionId: qId, opcionId: opt });
  }
  await enviarIntento(client as any, { intentoId: intento.intentoId, estudianteId: "ficticio-estudiante" });
  await cerrarProceso(client as any, { procesoId: proc.procesoId, estudianteId: "ficticio-estudiante" });

  // HTTP: /api/health/vortice = 200 y /api/vortice/conocimiento/mapa = 200 con refuerzo exacto por item_id.
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

  const health = await fetch(`${base}/api/health/vortice`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);

  const mapaRes = await fetch(`${base}/api/vortice/conocimiento/mapa`, {
    headers: { "x-test-user": "ficticio-estudiante" },
  });
  assert.equal(mapaRes.status, 200);
  const mapa = await mapaRes.json();
  assert.equal(mapa.disponible, true);
  assert.equal(mapa.nodos.length, 5);
  assert.equal(mapa.evaluacion.publicada, true);
  assert.deepEqual(mapa.evaluacion.contenidosAReforzar.map((r: any) => r.itemId), [oa10ItemId]);
} finally {
  if (server) await new Promise<void>((r) => server!.close(() => r()));
  client.close();
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("siembra-preview-unificada: ok");
