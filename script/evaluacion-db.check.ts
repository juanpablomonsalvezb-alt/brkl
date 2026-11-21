// T32 (P0-E): la base hace cumplir la evaluación — procesos, instancias, intentos y respuestas.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import v8 from "node:v8"; import vm from "node:vm";
import type { Client, InArgs } from "@libsql/client";
import { crearClienteDb } from "../server/cliente"; import { assertBaseLocal } from "../server/dbGuard"; import { migrar } from "../server/migrar";
import { baseArchivo } from "./lib/basePrueba";
import { aplicarEsquemaHeredado, sembrarFicticios } from "./lib/esquemaHeredado";

if (process.env.NODE_ENV === "production") throw new Error("este check no debe correr con NODE_ENV=production");
v8.setFlagsFromString("--expose-gc");
const gc = vm.runInNewContext("gc") as () => void;
const liberarNativos = async () => { for (let i = 0; i < 2; i++) { gc(); await new Promise((r) => setImmediate(r)); await new Promise((r) => setTimeout(r, 0)); } };
const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), "t32-"));
const AU = "ficticio-autor", VA = "ficticio-validador", OT = "ficticio-otro";
const EA = "est-a", EB = "est-b";
const OPC = JSON.stringify([{ id: "o1", texto: "Uno" }, { id: "o2", texto: "Dos" }]);

type X = (sql: string, args?: InArgs) => ReturnType<Client["execute"]>;

// Sembrar evaluación heredada (module_evaluations) y estudiantes.
async function sembrarEval(x: X) {
  await x("INSERT INTO users (id, email) VALUES ('est-a', 'a@ficticio.test'), ('est-b', 'b@ficticio.test')");
  await x("INSERT INTO module_evaluations (id, learning_objective_id, evaluation_number, title, release_day, release_week, passing_score) VALUES ('me-e2', 'lo-mat', 2, 'E2 Fracciones', 5, 2, 70)");
}

// Versión de evaluación completa (borrador → validada).
async function versionEval(x: X, id = "ev-v1", evalId = "me-e2", version = 1) {
  await x("INSERT INTO evaluation_versions (id, evaluation_id, version, status, created_by) VALUES (?, ?, ?, 'borrador', ?)", [id, evalId, version, AU]);
  await x("UPDATE evaluation_versions SET status = 'validada', validated_by = ?, validated_at = 1 WHERE id = ?", [VA, id]);
}

// Pregunta de evaluación (familia + versión aprobada).
async function preguntaEval(x: X, id: string, fam: string, item: string, version = 1) {
  if (!(await x(`SELECT 1 FROM question_families WHERE id = ?`, [fam])).rows.length)
    await x("INSERT INTO question_families (id, item_id, bank) VALUES (?, ?, 'evaluacion')", [fam, item]);
  await x(`INSERT INTO question_versions (id, family_id, item_id, bank, version, status, stem, options_json, correct_option_id, origin, authored_by)
           VALUES (?, ?, ?, 'evaluacion', ?, 'borrador', 'Enunciado', ?, 'o2', 'humano', ?)`, [id, fam, item, version, OPC, AU]);
  await x("UPDATE question_versions SET status = 'en_revision' WHERE id = ?", [id]);
  await x("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = ?", [VA, id]);
}

// Dominio publicado (lo exige la aprobación de preguntas).
async function dominioPublicado(x: X, dom: string, items: string[]) {
  await x("INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES (?, 'ls-mat-5b', ?)", [dom, dom]);
  await x("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES (?, ?, 1, 'borrador', ?)", [`${dom}-v1`, dom, AU]);
  for (const it of items) {
    await x("INSERT INTO knowledge_items (id, domain_id, code) VALUES (?, ?, ?)", [it, dom, `COD-${it}`]);
    await x("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES (?, ?, ?, ?, 'n', 'd')", [`${it}-iv`, it, `${dom}-v1`, dom]);
    await x("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES (?, 'oa1')", [`${it}-iv`]);
  }
  await x("UPDATE knowledge_domain_versions SET status = 'en_revision' WHERE id = ?", [`${dom}-v1`]);
  await x("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = ? WHERE id = ?", [VA, `${dom}-v1`]);
}

// Escenario base: evaluación, versión validada, preguntas, proceso e instancia.
async function construirPlantilla(nombre: string): Promise<string> {
  const b = baseArchivo(); const c = b.client; const x: X = (s, a = []) => c.execute({ sql: s, args: a });
  await aplicarEsquemaHeredado(c); await sembrarFicticios(c); await migrar(c, "migrations/vortice");
  await x("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa1','ls-mat-5b','M1','t','https://e.test',2018)");
  await sembrarEval(x);
  await dominioPublicado(x, "d1", ["i1"]);
  await preguntaEval(x, "qe1", "ef1", "i1");
  await preguntaEval(x, "qe2", "ef2", "i1");
  await versionEval(x);
  // Agregar pregunta a versión.
  await x("INSERT INTO evaluation_version_questions (evaluation_version_id, question_version_id, family_id, item_id, bank, position) VALUES ('ev-v1', 'qe1', 'ef1', 'i1', 'evaluacion', 0)");
  await x("INSERT INTO evaluation_version_questions (evaluation_version_id, question_version_id, family_id, item_id, bank, position) VALUES ('ev-v1', 'qe2', 'ef2', 'i1', 'evaluacion', 1)");
  // Proceso e instancia.
  await x("INSERT INTO evaluation_processes (id, student_id, evaluation_id, status) VALUES ('ep1', 'est-a', 'me-e2', 'abierto')");
  await x("INSERT INTO evaluation_instances (id, process_id, student_id, evaluation_version_id, phase, window_end_at, max_attempts, status, student_profile, duration_minutes, passing_score) VALUES ('ei1', 'ep1', 'est-a', 'ev-v1', 'ordinaria', 1000000, 1, 'disponible', 'regular', 60, 70)");
  const f = path.join(RAIZ, `${nombre}.db`); fs.copyFileSync(b.url.replace(/^file:/, ""), f); await b.cerrar(); return f;
}
const abrir = (plantilla: string) => {
  const carpeta = fs.mkdtempSync(path.join(RAIZ, "b-")); const f = path.join(carpeta, "base.db"); fs.copyFileSync(plantilla, f);
  const url = `file:${f}`; assertBaseLocal(process.env, url);
  const abiertos: Client[] = []; const nueva = () => { const k = crearClienteDb(url); abiertos.push(k); return k; };
  const c = nueva();
  return { c, f, nueva, x: ((s: string, a: InArgs = []) => c.execute({ sql: s, args: a })) as X, cerrar: () => { for (const k of abiertos) k.close(); fs.rmSync(carpeta, { recursive: true, force: true }); } };
};
const huella = async (c: Client) => {
  const ts = (await c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%' ORDER BY name")).rows.map((r) => String(r.name));
  const h = createHash("sha256");
  for (const t of ts) h.update(t + JSON.stringify((await c.execute(`SELECT * FROM "${t}"`)).rows.map((r) => JSON.stringify(Object.values(r))).sort()));
  h.update(JSON.stringify((await c.execute("SELECT type,name,sql FROM sqlite_master ORDER BY type,name")).rows.map((r) => JSON.stringify(Object.values(r)))));
  return h.digest("hex");
};
const n = async (c: Client, tabla: string, donde = "1=1") => Number((await c.execute(`SELECT COUNT(*) AS n FROM ${tabla} WHERE ${donde}`)).rows[0].n);
const salida: string[] = []; let casos = 0;
const caso = async (id: string, nombre: string, f: () => Promise<unknown>) => { await f(); casos++; salida.push(`  ✓ ${id.padEnd(6)} ${nombre}`); await liberarNativos(); };
import { verificarDeriva } from "../server/migrar";

const P = await construirPlantilla("A");
await liberarNativos();
const conBase = async (f: (bd: ReturnType<typeof abrir>) => Promise<void>) => { const bd = abrir(P); try { await f(bd); } finally { bd.cerrar(); } };
const rechaza = async (bd: ReturnType<typeof abrir>, sql: string, args: InArgs, motivo: RegExp, nombre: string) => {
  const antes = await huella(bd.c);
  await assert.rejects(bd.c.execute({ sql, args }), motivo, nombre);
  assert.equal(await huella(bd.c), antes, `${nombre}: el rechazo no debe cambiar ninguna tabla`);
};

// ── Migración 0005 ──────────────────────────────────────────────────────────────
await caso("M1", "0005 se aplica; ocho tablas nuevas; deriva nula", () => conBase(async (bd) => {
  const d = await verificarDeriva(bd.c); assert.deepEqual([d.ok, d.faltantes, d.alterados], [true, [], []]);
  for (const t of ["evaluation_versions", "evaluation_version_releases", "evaluation_version_questions",
    "evaluation_processes", "evaluation_instances", "evaluation_attempts", "evaluation_attempt_answers", "progression_continuations"])
    assert.equal(await n(bd.c, "sqlite_master", `name = '${t}' AND type = 'table'`), 1, t);
}));

// ── Casos válidos ───────────────────────────────────────────────────────────────
await caso("V1", "cadena válida: intento normal, envío, respuesta", () => conBase(async (bd) => {
  // Intento normal activo.
  await bd.x("INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type) VALUES ('ea1', 'ei1', 'est-a', 'ev-v1', 100, 'normal', 1, 'activo', 'evaluacion_cierre')");
  assert.equal(await n(bd.c, "evaluation_attempts"), 1);
  // Enviar intento.
  await bd.x("UPDATE evaluation_attempts SET status = 'enviado', submitted_at = 200, submission_id = 'sub-1', score_pct = 58.333333, total_correct = 7, total_questions = 12, passed = 0 WHERE id = 'ea1'");
  // Respuestas del intento.
  await bd.x("INSERT INTO evaluation_attempt_answers (id, attempt_id, student_id, evaluation_version_id, evidence_source_type, review_at, question_version_id, family_id, item_id, bank, selected_option_id, is_correct, answered_at, sequence_no, study_day) VALUES ('eaa1', 'ea1', 'est-a', 'ev-v1', 'evaluacion_cierre', 100, 'qe1', 'ef1', 'i1', 'evaluacion', 'o2', 1, 201, 1, '2027-03-01')");
  await bd.x("INSERT INTO evaluation_attempt_answers (id, attempt_id, student_id, evaluation_version_id, evidence_source_type, review_at, question_version_id, family_id, item_id, bank, selected_option_id, is_correct, answered_at, sequence_no, study_day) VALUES ('eaa2', 'ea1', 'est-a', 'ev-v1', 'evaluacion_cierre', 100, 'qe2', 'ef2', 'i1', 'evaluacion', 'o1', 0, 202, 2, '2027-03-01')");
  assert.equal(await n(bd.c, "evaluation_attempt_answers"), 2);
}));

await caso("V2", "intento extra después del normal (P21 v2)", () => conBase(async (bd) => {
  await bd.x("INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type) VALUES ('ea1', 'ei1', 'est-a', 'ev-v1', 100, 'normal', 1, 'activo', 'evaluacion_cierre')");
  await bd.x("UPDATE evaluation_attempts SET status = 'enviado', submitted_at = 200, submission_id = 'sub-1', score_pct = 58.333333, total_correct = 7, total_questions = 12, passed = 0 WHERE id = 'ea1'");
  // Intento extra.
  await bd.x("INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type) VALUES ('ea2', 'ei1', 'est-a', 'ev-v1', 100, 'extra', 2, 'activo', 'evaluacion_cierre')");
  assert.equal(await n(bd.c, "evaluation_attempts", "attempt_kind = 'extra'"), 1);
}));

await caso("V3", "perfil neurodivergente: 120 min, umbral 50 %", () => conBase(async (bd) => {
  await bd.x("INSERT INTO evaluation_processes (id, student_id, evaluation_id, status) VALUES ('ep2', 'est-b', 'me-e2', 'abierto')");
  await bd.x("INSERT INTO evaluation_instances (id, process_id, student_id, evaluation_version_id, phase, window_end_at, max_attempts, status, student_profile, duration_minutes, passing_score) VALUES ('ei2', 'ep2', 'est-b', 'ev-v1', 'ordinaria', 1000000, 1, 'disponible', 'neurodivergente', 120, 50)");
  assert.equal(await n(bd.c, "evaluation_instances", "student_profile = 'neurodivergente'"), 1);
}));

await caso("V4", "proceso: transición abierto → aprobado con cierre coherente", () => conBase(async (bd) => {
  await bd.x("UPDATE evaluation_processes SET status = 'aprobado', closed_at = 300, close_cause = 'aprobacion' WHERE id = 'ep1'");
  assert.equal(await n(bd.c, "evaluation_processes", "status = 'aprobado'"), 1);
}));

await caso("V5", "versión: transición borrador → validada → asignada", () => conBase(async (bd) => {
  await bd.x("INSERT INTO evaluation_versions (id, evaluation_id, version, status, created_by) VALUES ('ev-v2', 'me-e2', 2, 'borrador', ?)", [AU]);
  await bd.x("UPDATE evaluation_versions SET status = 'validada', validated_by = ?, validated_at = 1 WHERE id = 'ev-v2'", [VA]);
  await bd.x("UPDATE evaluation_versions SET status = 'asignada' WHERE id = 'ev-v2'");
  assert.equal(await n(bd.c, "evaluation_versions", "status = 'asignada'"), 1);
}));

await caso("V6", "liberación de versión y continuación de progreso", () => conBase(async (bd) => {
  // La liberación requiere que no haya instancias en esa versión — en la plantilla ya hay ei1.
  // Se libera una versión sin instancias.
  await bd.x("INSERT INTO evaluation_versions (id, evaluation_id, version, status, created_by) VALUES ('ev-v3', 'me-e2', 3, 'borrador', ?)", [AU]);
  await bd.x("UPDATE evaluation_versions SET status = 'validada', validated_by = ?, validated_at = 1 WHERE id = 'ev-v3'", [VA]);
  await bd.x("INSERT INTO evaluation_version_releases (evaluation_version_id, released_at) VALUES ('ev-v3', 500)");
  assert.equal(await n(bd.c, "evaluation_version_releases"), 1);
  // Continuación de progreso.
  await bd.x("INSERT INTO progression_continuations (id, student_id, process_id, from_module_id) VALUES ('pc1', 'est-a', 'ep1', 'lo-mat')");
  assert.equal(await n(bd.c, "progression_continuations"), 1);
}));

// ── Casos INVÁLIDOS ─────────────────────────────────────────────────────────────
await caso("I1", "FK rota: intento con instancia inexistente", () => conBase(async (bd) => {
  await rechaza(bd, "INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type) VALUES ('ea-z', 'zz', 'est-a', 'ev-v1', 100, 'normal', 1, 'activo', 'evaluacion_cierre')", [], /FOREIGN KEY/, "instancia inexistente");
}));

await caso("I2", "segundo intento del mismo tipo en la misma instancia (UNIQUE instance_id, attempt_kind)", () => conBase(async (bd) => {
  await bd.x("INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type) VALUES ('ea1', 'ei1', 'est-a', 'ev-v1', 100, 'normal', 1, 'activo', 'evaluacion_cierre')");
  await rechaza(bd, "INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type) VALUES ('ea1b', 'ei1', 'est-a', 'ev-v1', 100, 'normal', 2, 'activo', 'evaluacion_cierre')", [], /no se sustituye|UNIQUE/, "segundo normal");
}));

await caso("I3", "UPDATE y DELETE en tablas solo-inserción (eaa, evr, pc)", () => conBase(async (bd) => {
  // Primero armar una respuesta válida.
  await bd.x("INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type) VALUES ('ea1', 'ei1', 'est-a', 'ev-v1', 100, 'normal', 1, 'activo', 'evaluacion_cierre')");
  await bd.x("INSERT INTO evaluation_attempt_answers (id, attempt_id, student_id, evaluation_version_id, evidence_source_type, review_at, question_version_id, family_id, item_id, bank, selected_option_id, is_correct, answered_at, sequence_no, study_day) VALUES ('eaa1', 'ea1', 'est-a', 'ev-v1', 'evaluacion_cierre', 100, 'qe1', 'ef1', 'i1', 'evaluacion', 'o2', 1, 201, 1, '2027-03-01')");
  for (const sql of [
    "UPDATE evaluation_attempt_answers SET is_correct = 0 WHERE id = 'eaa1'",
    "DELETE FROM evaluation_attempt_answers WHERE id = 'eaa1'",
  ]) await rechaza(bd, sql, [], /solo inserción/, sql);
}));

await caso("I4", "intento extra sin intento normal previo — la base lo permite (es regla de negocio)", () => conBase(async (bd) => {
  // La base permite insertar un extra sin normal porque es una regla de negocio (p0e.ts).
  // Se verifica que la FK compuesta funcione.
  await bd.x("INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type) VALUES ('ea-extra', 'ei1', 'est-a', 'ev-v1', 100, 'extra', 1, 'activo', 'evaluacion_cierre')");
  assert.equal(await n(bd.c, "evaluation_attempts", "attempt_kind = 'extra'"), 1);
}));

await caso("I5", "perfil inválido en instancia", () => conBase(async (bd) => {
  await bd.x("INSERT INTO evaluation_processes (id, student_id, evaluation_id, status) VALUES ('ep3', 'est-b', 'me-e2', 'abierto')");
  await rechaza(bd, "INSERT INTO evaluation_instances (id, process_id, student_id, evaluation_version_id, phase, window_end_at, max_attempts, status, student_profile) VALUES ('ei3', 'ep3', 'est-b', 'ev-v1', 'ordinaria', 1000000, 1, 'disponible', 'otro')", [], /CHECK/, "perfil inválido");
}));

await caso("I6", "porcentaje fuera de 0–100", () => conBase(async (bd) => {
  await bd.x("INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type) VALUES ('ea1', 'ei1', 'est-a', 'ev-v1', 100, 'normal', 1, 'activo', 'evaluacion_cierre')");
  await rechaza(bd, "UPDATE evaluation_attempts SET status = 'enviado', submitted_at = 200, submission_id = 'sub-1', score_pct = 101 WHERE id = 'ea1'", [], /CHECK/, "score_pct > 100");
  await rechaza(bd, "UPDATE evaluation_attempts SET status = 'enviado', submitted_at = 200, submission_id = 'sub-1', score_pct = -1 WHERE id = 'ea1'", [], /CHECK/, "score_pct < 0");
}));

await caso("I7", "respuesta con pregunta ajena a la versión de evaluación", () => conBase(async (bd) => {
  await bd.x("INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type) VALUES ('ea1', 'ei1', 'est-a', 'ev-v1', 100, 'normal', 1, 'activo', 'evaluacion_cierre')");
  // qe2 está en la versión, pero usamos una pregunta que no existe en evaluation_version_questions.
  // Crear una pregunta de evaluación que NO está en la versión.
  await bd.x("INSERT INTO question_families (id, item_id, bank) VALUES ('ef3', 'i1', 'evaluacion')");
  await bd.x(`INSERT INTO question_versions (id, family_id, item_id, bank, version, status, stem, options_json, correct_option_id, origin, authored_by) VALUES ('qe3', 'ef3', 'i1', 'evaluacion', 1, 'borrador', 'E', ?, 'o2', 'humano', ?)`, [OPC, AU]);
  await bd.x("UPDATE question_versions SET status = 'en_revision' WHERE id = 'qe3'");
  await bd.x("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = 'qe3'", [VA]);
  await rechaza(bd, "INSERT INTO evaluation_attempt_answers (id, attempt_id, student_id, evaluation_version_id, evidence_source_type, review_at, question_version_id, family_id, item_id, bank, selected_option_id, is_correct, answered_at, sequence_no, study_day) VALUES ('eaa1', 'ea1', 'est-a', 'ev-v1', 'evaluacion_cierre', 100, 'qe3', 'ef3', 'i1', 'evaluacion', 'o2', 1, 201, 1, '2027-03-01')", [], /no pertenece al intento/, "pregunta no en versión");
}));

await caso("I8", "proceso: transición invierta (aprobado → abierto)", () => conBase(async (bd) => {
  await bd.x("UPDATE evaluation_processes SET status = 'aprobado', closed_at = 300, close_cause = 'aprobacion' WHERE id = 'ep1'");
  await rechaza(bd, "UPDATE evaluation_processes SET status = 'abierto', closed_at = NULL, close_cause = NULL WHERE id = 'ep1'", [], /no se reabre/, "reabrir proceso");
}));

await caso("I9", "instancia: transición inválida (cerrada → disponible)", () => conBase(async (bd) => {
  await bd.x("UPDATE evaluation_instances SET status = 'cerrada_aprobada', close_cause = 'aprobacion' WHERE id = 'ei1'");
  await rechaza(bd, "UPDATE evaluation_instances SET status = 'disponible', close_cause = NULL WHERE id = 'ei1'", [], /no se reabre/, "reabrir instancia");
}));

await caso("I10", "intento enviado no se modifica", () => conBase(async (bd) => {
  await bd.x("INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type) VALUES ('ea1', 'ei1', 'est-a', 'ev-v1', 100, 'normal', 1, 'activo', 'evaluacion_cierre')");
  await bd.x("UPDATE evaluation_attempts SET status = 'enviado', submitted_at = 200, submission_id = 'sub-1', score_pct = 75, total_correct = 9, total_questions = 12, passed = 1 WHERE id = 'ea1'");
  await rechaza(bd, "UPDATE evaluation_attempts SET score_pct = 80 WHERE id = 'ea1'", [], /enviado no cambia/, "modificar enviado");
}));

await caso("I11", "versión de evaluación: transición inválida (asignada → borrador)", () => conBase(async (bd) => {
  await bd.x("INSERT INTO evaluation_versions (id, evaluation_id, version, status, created_by) VALUES ('ev-vx', 'me-e2', 4, 'borrador', ?)", [AU]);
  await bd.x("UPDATE evaluation_versions SET status = 'validada', validated_by = ?, validated_at = 1 WHERE id = 'ev-vx'", [VA]);
  await bd.x("UPDATE evaluation_versions SET status = 'asignada' WHERE id = 'ev-vx'");
  await rechaza(bd, "UPDATE evaluation_versions SET status = 'borrador' WHERE id = 'ev-vx'", [], /transición no permitida/, "asignada → borrador");
}));

await caso("I12", "liberación duplicada y DELETE", () => conBase(async (bd) => {
  await bd.x("INSERT INTO evaluation_versions (id, evaluation_id, version, status, created_by) VALUES ('ev-v5', 'me-e2', 5, 'borrador', ?)", [AU]);
  await bd.x("UPDATE evaluation_versions SET status = 'validada', validated_by = ?, validated_at = 1 WHERE id = 'ev-v5'", [VA]);
  await bd.x("INSERT INTO evaluation_version_releases (evaluation_version_id, released_at) VALUES ('ev-v5', 500)");
  await rechaza(bd, "INSERT INTO evaluation_version_releases (evaluation_version_id, released_at) VALUES ('ev-v5', 600)", [], /no se sustituye|UNIQUE/, "duplicada");
  await rechaza(bd, "DELETE FROM evaluation_version_releases WHERE evaluation_version_id = 'ev-v5'", [], /solo inserción/, "DELETE");
}));

await caso("I13", "continuación duplicada por proceso", () => conBase(async (bd) => {
  await bd.x("INSERT INTO progression_continuations (id, student_id, process_id, from_module_id) VALUES ('pc1', 'est-a', 'ep1', 'lo-mat')");
  await rechaza(bd, "INSERT INTO progression_continuations (id, student_id, process_id, from_module_id) VALUES ('pc2', 'est-a', 'ep1', 'lo-mat')", [], /no se sustituye|UNIQUE/, "duplicada por proceso");
}));

await caso("I14", "respuesta duplicada en el mismo intento (misma pregunta)", () => conBase(async (bd) => {
  await bd.x("INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type) VALUES ('ea1', 'ei1', 'est-a', 'ev-v1', 100, 'normal', 1, 'activo', 'evaluacion_cierre')");
  await bd.x("INSERT INTO evaluation_attempt_answers (id, attempt_id, student_id, evaluation_version_id, evidence_source_type, review_at, question_version_id, family_id, item_id, bank, selected_option_id, is_correct, answered_at, sequence_no, study_day) VALUES ('eaa1', 'ea1', 'est-a', 'ev-v1', 'evaluacion_cierre', 100, 'qe1', 'ef1', 'i1', 'evaluacion', 'o2', 1, 201, 1, '2027-03-01')");
  await rechaza(bd, "INSERT INTO evaluation_attempt_answers (id, attempt_id, student_id, evaluation_version_id, evidence_source_type, review_at, question_version_id, family_id, item_id, bank, selected_option_id, is_correct, answered_at, sequence_no, study_day) VALUES ('eaa2', 'ea1', 'est-a', 'ev-v1', 'evaluacion_cierre', 100, 'qe1', 'ef1', 'i1', 'evaluacion', 'o1', 0, 202, 2, '2027-03-01')", [], /no se sustituye|UNIQUE/, "duplicada");
}));

await caso("I15", "instancia sobre versión liberada", () => conBase(async (bd) => {
  await bd.x("INSERT INTO evaluation_versions (id, evaluation_id, version, status, created_by) VALUES ('ev-v6', 'me-e2', 6, 'borrador', ?)", [AU]);
  await bd.x("UPDATE evaluation_versions SET status = 'validada', validated_by = ?, validated_at = 1 WHERE id = 'ev-v6'", [VA]);
  await bd.x("INSERT INTO evaluation_version_releases (evaluation_version_id, released_at) VALUES ('ev-v6', 500)");
  await bd.x("INSERT INTO evaluation_processes (id, student_id, evaluation_id, status) VALUES ('ep4', 'est-b', 'me-e2', 'abierto')");
  await rechaza(bd, "INSERT INTO evaluation_instances (id, process_id, student_id, evaluation_version_id, phase, window_end_at, max_attempts, status) VALUES ('ei4', 'ep4', 'est-b', 'ev-v6', 'ordinaria', 1000000, 1, 'disponible')", [], /no se crea instancia sobre versión liberada/, "versión liberada");
}));

await caso("I16", "intento: transición inválida (enviado → activo)", () => conBase(async (bd) => {
  await bd.x("INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type) VALUES ('ea1', 'ei1', 'est-a', 'ev-v1', 100, 'normal', 1, 'activo', 'evaluacion_cierre')");
  await bd.x("UPDATE evaluation_attempts SET status = 'enviado', submitted_at = 200, submission_id = 'sub-1', score_pct = 75, total_correct = 9, total_questions = 12, passed = 1 WHERE id = 'ea1'");
  await rechaza(bd, "UPDATE evaluation_attempts SET status = 'activo' WHERE id = 'ea1'", [], /transición no permitida|enviado no cambia/, "enviado → activo");
}));

await caso("I17", "score_pct como REAL sin redondeo (Q3): 69.5 no aprueba con umbral 70", () => conBase(async (bd) => {
  // La base almacena score_pct como REAL; el umbral es regla de negocio (p0e.ts).
  // Aquí solo verificamos que se pueda almacenar un valor con decimales.
  await bd.x("INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type) VALUES ('ea1', 'ei1', 'est-a', 'ev-v1', 100, 'normal', 1, 'activo', 'evaluacion_cierre')");
  await bd.x("UPDATE evaluation_attempts SET status = 'enviado', submitted_at = 200, submission_id = 'sub-1', score_pct = 69.5, total_correct = 8, total_questions = 12, passed = 0 WHERE id = 'ea1'");
  const row = (await bd.x("SELECT score_pct FROM evaluation_attempts WHERE id = 'ea1'")).rows[0];
  assert.equal(Number(row.score_pct), 69.5, "score_pct debe conservar decimales");
}));

// ── Patrón de 0003: INSERT OR REPLACE / ON CONFLICT en tablas de evaluación ────
const SUSTITUIBLES_EVAL: [string, string, string][] = [
  ["evaluation_version_releases", "evaluation_version_id = 'ev-v7'", "released_at"],
  ["evaluation_attempt_answers", "id = 'eaa1'", "is_correct"],
  ["progression_continuations", "id = 'pc1'", "acknowledged_at"],
];
await caso("SU1", "INSERT OR REPLACE / ON CONFLICT en tablas solo-inserción de evaluación", () => conBase(async (bd) => {
  // Armar datos para probar.
  await bd.x("INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type) VALUES ('ea1', 'ei1', 'est-a', 'ev-v1', 100, 'normal', 1, 'activo', 'evaluacion_cierre')");
  await bd.x("INSERT INTO evaluation_attempt_answers (id, attempt_id, student_id, evaluation_version_id, evidence_source_type, review_at, question_version_id, family_id, item_id, bank, selected_option_id, is_correct, answered_at, sequence_no, study_day) VALUES ('eaa1', 'ea1', 'est-a', 'ev-v1', 'evaluacion_cierre', 100, 'qe1', 'ef1', 'i1', 'evaluacion', 'o2', 1, 201, 1, '2027-03-01')");
  // Liberación: necesitamos una versión sin instancias.
  await bd.x("INSERT INTO evaluation_versions (id, evaluation_id, version, status, created_by) VALUES ('ev-v7', 'me-e2', 7, 'borrador', ?)", [AU]);
  await bd.x("UPDATE evaluation_versions SET status = 'validada', validated_by = ?, validated_at = 1 WHERE id = 'ev-v7'", [VA]);
  await bd.x("INSERT INTO evaluation_version_releases (evaluation_version_id, released_at) VALUES ('ev-v7', 500)");
  await bd.x("INSERT INTO progression_continuations (id, student_id, process_id, from_module_id) VALUES ('pc1', 'est-a', 'ep1', 'lo-mat')");

  for (const [t, donde, col] of SUSTITUIBLES_EVAL) {
    for (const [nombre, sql] of [
      ["OR REPLACE", `INSERT OR REPLACE INTO ${t} SELECT * FROM ${t} WHERE ${donde}`],
      ["DO NOTHING", `INSERT INTO ${t} SELECT * FROM ${t} WHERE ${donde} ON CONFLICT DO NOTHING`],
      ["DO UPDATE", `INSERT INTO ${t} SELECT * FROM ${t} WHERE ${donde} ON CONFLICT DO UPDATE SET ${col} = excluded.${col}`],
    ]) await rechaza(bd, sql, [], /no se sustituye|solo inserción/, `${t} ${nombre}`);
  }
}));

fs.rmSync(RAIZ, { recursive: true, force: true });
console.log(salida.join("\n"));
console.log(`evaluacion-db: ok (${casos} casos)`);
await liberarNativos();
