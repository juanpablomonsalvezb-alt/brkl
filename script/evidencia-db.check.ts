// IMP-030 (H3a): la base hace cumplir la práctica y la evidencia. Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import v8 from "node:v8"; import vm from "node:vm";
import type { Client, InArgs } from "@libsql/client";
import { crearClienteDb } from "../server/cliente"; import { assertBaseLocal } from "../server/dbGuard"; import { migrar } from "../server/migrar";
import { baseArchivo } from "./lib/basePrueba";
import { aplicarEsquemaHeredado, sembrarFicticios } from "./lib/esquemaHeredado";

if (process.env.NODE_ENV === "production") throw new Error("este check no debe correr con NODE_ENV=production");
// libSQL embebido: las transacciones de `migrar` dejan conexiones nativas vivas hasta que el recolector las
// finaliza, y esas finalizaciones tardías fallaban a veces con SIGSEGV (REGISTRO_H2_INTEGRIDAD). Se forzan
// los finalizadores con el proceso sano; si el proceso cae igual, sale con 139 y check:vortice falla.
v8.setFlagsFromString("--expose-gc");
const gc = vm.runInNewContext("gc") as () => void;
const liberarNativos = async () => { for (let i = 0; i < 2; i++) { gc(); await new Promise((r) => setImmediate(r)); await new Promise((r) => setTimeout(r, 0)); } };
const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), "h3a-"));
const AU = "ficticio-autor", VA = "ficticio-validador", OT = "ficticio-otro", EA = "est-a", EB = "est-b";
const OPC = JSON.stringify([{ id: "o1", texto: "Uno" }, { id: "o2", texto: "Dos" }]);
// Política SOLO DE PRUEBA (las alternativas recomendadas del diseño; ninguna aprobada salvo K6 y N18).
const POL_BASE = { k6_min_families: 2, k6_separation: "ninguna", assisted_counts: false, wrong_with_help_counts: false,
  error_repaired_counts: false, retired_counts: true, demote_wrong_families: 2, not_mastered_wrong_families: 2 };

type X = (sql: string, args?: InArgs) => ReturnType<Client["execute"]>;
// Dominio publicado con sus contenidos (la aprobación de preguntas y la práctica lo exigen).
async function dominioPublicado(x: X, dom: string, items: string[], hasta: "publicada" | "validada" = "publicada") {
  await x("INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES (?, 'ls-mat-5b', ?)", [dom, dom]);
  await x("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES (?, ?, 1, 'borrador', ?)", [`${dom}-v1`, dom, AU]);
  for (const it of items) {
    await x("INSERT INTO knowledge_items (id, domain_id, code) VALUES (?, ?, ?)", [it, dom, `COD-${it}`]);
    await x("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES (?, ?, ?, ?, 'n', 'd')", [`${it}-iv`, it, `${dom}-v1`, dom]);
    await x("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES (?, 'oa1')", [`${it}-iv`]);
  }
  await x("UPDATE knowledge_domain_versions SET status = 'en_revision' WHERE id = ?", [`${dom}-v1`]);
  await x("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = ? WHERE id = ?", [VA, `${dom}-v1`]);
  if (hasta === "publicada") await x("UPDATE knowledge_domain_versions SET status = 'publicada', published_at = 1 WHERE id = ?", [`${dom}-v1`]);
}
async function pregunta(x: X, id: string, fam: string, item: string, bank = "practica", version = 1) {
  if (version === 1) await x("INSERT INTO question_families (id, item_id, bank) VALUES (?, ?, ?)", [fam, item, bank]);
  await x(`INSERT INTO question_versions (id, family_id, item_id, bank, version, status, stem, options_json, correct_option_id, origin, authored_by)
           VALUES (?, ?, ?, ?, ?, 'borrador', 'Enunciado', ?, 'o2', 'humano', ?)`, [id, fam, item, bank, version, OPC, AU]);
  await x("UPDATE question_versions SET status = 'en_revision' WHERE id = ?", [id]);
  await x("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = ?", [VA, id]);
}
const retirar = (x: X, id: string, kind: string) =>
  x("UPDATE question_versions SET status = 'retirada', retired_kind = ?, retired_reason = 'motivo', retired_by = ?, retired_at = 2 WHERE id = ?", [kind, VA, id]);
async function politica(x: X, id = "pol1", version = 1, reglas: Record<string, unknown> = POL_BASE) {
  await x("INSERT INTO mastery_policies (id, version, rules_json, status) VALUES (?, ?, ?, 'borrador')", [id, version, JSON.stringify(reglas)]);
  await x("UPDATE mastery_policies SET status = 'aprobada', approved_by = ?, approved_at = 1 WHERE id = ?", [VA, id]);
}

// Escenario base: dominio d1 (contenidos i1 con familias f1, f2, f3 e i2 con g1), dominio d2 (i3, h1), banco de
// evaluación (e1) y dos estudiantes. Se arma DESDE CERO una vez por plantilla y cada prueba copia el archivo.
async function construirPlantilla(nombre: string): Promise<string> {
  const b = baseArchivo(); const c = b.client; const x: X = (s, a = []) => c.execute({ sql: s, args: a });
  await aplicarEsquemaHeredado(c); await sembrarFicticios(c); await migrar(c, "migrations/vortice");
  await x("INSERT INTO users (id, email) VALUES ('est-a', 'a@ficticio.test'), ('est-b', 'b@ficticio.test')");
  await x("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa1','ls-mat-5b','M1','t','https://e.test',2018)");
  await dominioPublicado(x, "d1", ["i1", "i2"]); await dominioPublicado(x, "d2", ["i3"]);
  await pregunta(x, "q1", "f1", "i1"); await pregunta(x, "q2", "f2", "i1"); await pregunta(x, "q3", "f3", "i1");
  await pregunta(x, "r1", "g1", "i2"); await pregunta(x, "s1", "h1", "i3"); await pregunta(x, "qe", "e1", "i1", "evaluacion");
  const f = path.join(RAIZ, `${nombre}.db`); fs.copyFileSync(b.url.replace(/^file:/, ""), f); await b.cerrar(); return f;
}
const abrir = (plantilla: string) => {
  const carpeta = fs.mkdtempSync(path.join(RAIZ, "b-")); const f = path.join(carpeta, "base.db"); fs.copyFileSync(plantilla, f);
  const url = `file:${f}`; assertBaseLocal(process.env, url);
  const abiertos: Client[] = []; const nueva = () => { const k = crearClienteDb(url); abiertos.push(k); return k; };
  const c = nueva();
  return { c, f, nueva, x: ((s: string, a: InArgs = []) => c.execute({ sql: s, args: a })) as X, cerrar: () => { for (const k of abiertos) k.close(); fs.rmSync(carpeta, { recursive: true, force: true }); } };
};
// Huella de TODAS las tablas (con sus datos) y del esquema (triggers e índices).
const huella = async (c: Client, solo?: string[]) => {
  const ts = (await c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%' ORDER BY name")).rows.map((r) => String(r.name)).filter((t) => !solo || solo.includes(t));
  const h = createHash("sha256");
  for (const t of ts) h.update(t + JSON.stringify((await c.execute(`SELECT * FROM "${t}"`)).rows.map((r) => JSON.stringify(Object.values(r))).sort()));
  if (!solo) h.update(JSON.stringify((await c.execute("SELECT type,name,sql FROM sqlite_master ORDER BY type,name")).rows.map((r) => JSON.stringify(Object.values(r)))));
  return h.digest("hex");
};
const n = async (c: Client, tabla: string, donde = "1=1") => Number((await c.execute(`SELECT COUNT(*) AS n FROM ${tabla} WHERE ${donde}`)).rows[0].n);
const salida: string[] = []; let casos = 0;
const caso = async (id: string, nombre: string, f: () => Promise<unknown>) => { await f(); casos++; salida.push(`  ✓ ${id.padEnd(6)} ${nombre}`); await liberarNativos(); };

// ── IMP-030: la base hace cumplir la práctica y la evidencia (SQL directo, sin servicios) ───────────────
// Casos de 04 §7 (1–6, 10–12, 15, 18), endurecimientos D4, patrón de 0003 en las siete tablas, políticas,
// eventos y proyección. Cada rechazo se acompaña de la huella de TODAS las tablas: no cambió nada.
import { verificarDeriva } from "../server/migrar";

const P = await construirPlantilla("A");
await liberarNativos();
const conBase = async (f: (bd: ReturnType<typeof abrir>) => Promise<void>) => { const bd = abrir(P); try { await f(bd); } finally { bd.cerrar(); } };
const rechaza = async (bd: ReturnType<typeof abrir>, sql: string, args: InArgs, motivo: RegExp, nombre: string) => {
  const antes = await huella(bd.c);
  await assert.rejects(bd.c.execute({ sql, args }), motivo, nombre);
  assert.equal(await huella(bd.c), antes, `${nombre}: el rechazo no debe cambiar ninguna tabla`);
};
const sesion = (x: X, id = "s1", est = EA, dom = "d1", prop = "practica") =>
  x("INSERT INTO practice_sessions (id, student_id, domain_id, domain_version_id, purpose, started_at) VALUES (?, ?, ?, ?, ?, 50)", [id, est, dom, `${dom}-v1`, prop]);
const RCOLS = ["id", "session_id", "student_id", "purpose", "domain_version_id", "question_version_id", "family_id", "item_id", "bank", "selected_option_id", "is_correct", "assistance", "accommodation", "client_submission_id", "answered_at", "sequence_no", "study_day"];
const respuesta = (x: X, o: Record<string, unknown>) => {
  const v: Record<string, unknown> = { session_id: "s1", student_id: EA, purpose: "practica", domain_version_id: "d1-v1", question_version_id: "q1", family_id: "f1", item_id: "i1",
    bank: "practica", selected_option_id: "o2", is_correct: 1, assistance: "ninguna", accommodation: null, client_submission_id: `c-${o.id}`, answered_at: 100, sequence_no: 1, study_day: "2027-03-01", ...o };
  return x(`INSERT INTO practice_answers (${RCOLS.join(", ")}) VALUES (${RCOLS.map(() => "?").join(", ")})`, RCOLS.map((k) => v[k] as never));
};
const ECOLS = ["id", "student_id", "item_id", "family_id", "question_version_id", "item_version_id", "domain_version_id", "source_type", "practice_answer_id", "attempt_answer_id",
  "is_correct", "assistance", "accommodation", "session_ref", "sequence_no", "study_day", "evaluation_version_id", "review_at", "occurred_at", "practice_released_at"];
async function valoresEvidencia(x: X, aid: string): Promise<Record<string, unknown>> {
  const a = (await x("SELECT * FROM practice_answers WHERE id = ?", [aid])).rows[0];
  const v = (await x("SELECT id FROM knowledge_item_versions WHERE domain_version_id = ? AND item_id = ?", [a.domain_version_id as string, a.item_id as string])).rows[0];
  return { student_id: a.student_id, item_id: a.item_id, family_id: a.family_id, question_version_id: a.question_version_id, item_version_id: v.id, domain_version_id: a.domain_version_id,
    source_type: a.purpose, practice_answer_id: a.id, attempt_answer_id: null, is_correct: a.is_correct, assistance: a.assistance, accommodation: a.accommodation, session_ref: a.session_id,
    sequence_no: a.sequence_no, study_day: a.study_day, evaluation_version_id: null, review_at: null, occurred_at: a.answered_at, practice_released_at: a.answered_at };
}
const evidencia = async (x: X, id: string, aid: string, cambios: Record<string, unknown> = {}) => {
  const v = { id, ...(await valoresEvidencia(x, aid)), ...cambios };
  return x(`INSERT INTO knowledge_evidence (${ECOLS.join(", ")}) VALUES (${ECOLS.map(() => "?").join(", ")})`, ECOLS.map((k) => v[k] as never));
};
const evidenciaSQL = async (x: X, id: string, aid: string, cambios: Record<string, unknown> = {}) => {
  const v = { id, ...(await valoresEvidencia(x, aid)), ...cambios };
  return { sql: `INSERT INTO knowledge_evidence (${ECOLS.join(", ")}) VALUES (${ECOLS.map(() => "?").join(", ")})`, args: ECOLS.map((k) => v[k] as never) };
};
const evento = (x: X, id = "k1", cambios: Record<string, unknown> = {}) => {
  const v: Record<string, unknown> = { id, student_id: EA, item_id: "i1", from_state: null, to_state: "incierto", from_flag: null, to_flag: null, reason: "evidencia", trigger_evidence_id: "e1", trigger_void_id: null,
    policy_id: "pol1", domain_version_id: "d1-v1", computed_at: 100, effective_at: 100, ...cambios };
  const cols = Object.keys(v);
  return x(`INSERT INTO knowledge_state_events (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`, cols.map((k) => v[k] as never));
};
const proyeccion = (x: X, cambios: Record<string, unknown> = {}) => {
  const v: Record<string, unknown> = { student_id: EA, item_id: "i1", state: "incierto", flag: null, uncertainty_reason: "pocas_evidencias", last_evidence_at: 100, policy_id: "pol1", domain_version_id: "d1-v1", computed_through: 100, updated_at: 100, ...cambios };
  const cols = Object.keys(v);
  return x(`INSERT INTO student_knowledge_state (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`, cols.map((k) => v[k] as never));
};
// Cadena completa válida: política, sesión, respuesta, evidencia, evento, proyección y anulación.
async function cadena(x: X) {
  await politica(x); await sesion(x); await respuesta(x, { id: "a1" }); await evidencia(x, "e1", "a1"); await evento(x); await proyeccion(x);
  await x("INSERT INTO evidence_voids (id, evidence_id, reason, requested_by, approved_by, at) VALUES ('v1', 'e1', 'motivo', ?, ?, 5)", [AU, VA]);
}

await caso("M1", "0004 se aplica una sola vez; deriva nula; siete tablas; aplicar otra vez no cambia nada", () => conBase(async (bd) => {
  const antes = await huella(bd.c);
  assert.deepEqual((await migrar(bd.c, "migrations/vortice")).aplicadas, []);
  assert.equal(await huella(bd.c), antes);
  const d = await verificarDeriva(bd.c); assert.deepEqual([d.ok, d.faltantes, d.alterados], [true, [], []]);
  for (const t of ["practice_sessions", "practice_answers", "knowledge_evidence", "evidence_voids", "mastery_policies", "knowledge_state_events", "student_knowledge_state"]) assert.equal(await n(bd.c, "sqlite_master", `name = '${t}' AND type = 'table'`), 1, t);
  assert.ok((await bd.x("SELECT nombre FROM vortice_migraciones WHERE nombre LIKE '0004%'")).rows.length === 1);
}));
await caso("M2", "deriva: borrar o alterar un trigger de 0004 se detecta con su nombre", () => conBase(async (bd) => {
  await bd.x("DROP TRIGGER ke_no_update");
  let d = await verificarDeriva(bd.c); assert.ok(!d.ok && d.faltantes.includes("trigger ke_no_update"), JSON.stringify(d));
  await bd.x("CREATE TRIGGER ke_no_update BEFORE UPDATE ON knowledge_evidence BEGIN SELECT 1; END");
  d = await verificarDeriva(bd.c); assert.ok(!d.ok && d.alterados.includes("trigger ke_no_update"), JSON.stringify(d));
}));
await caso("V1", "cadena válida: sesión, respuesta, evidencia, evento, proyección, anulación", () => conBase(async (bd) => {
  await cadena(bd.x);
  for (const [t, k] of [["practice_sessions", 1], ["practice_answers", 1], ["knowledge_evidence", 1], ["evidence_voids", 1], ["mastery_policies", 1], ["knowledge_state_events", 1], ["student_knowledge_state", 1]] as const) assert.equal(await n(bd.c, t), k, t);
}));

// ── Inválidos de 04 §7 ─────────────────────────────────────────────────────────
await caso("I1", "evidencia de otro estudiante con una respuesta ajena (FK compuesta)", () => conBase(async (bd) => {
  await sesion(bd.x); await respuesta(bd.x, { id: "a1" });
  const s = await evidenciaSQL(bd.x, "e1", "a1", { student_id: EB }); await rechaza(bd, s.sql, s.args, /FOREIGN KEY/, "I1");
}));
await caso("I2", "evidencia con is_correct distinto de la respuesta", () => conBase(async (bd) => {
  await sesion(bd.x); await respuesta(bd.x, { id: "a1", selected_option_id: "o1", is_correct: 0 });
  const s = await evidenciaSQL(bd.x, "e1", "a1", { is_correct: 1 }); await rechaza(bd, s.sql, s.args, /FOREIGN KEY/, "I2");
}));
await caso("I3", "evidencia con familia o contenido distintos de la respuesta", () => conBase(async (bd) => {
  await sesion(bd.x); await respuesta(bd.x, { id: "a1" });
  for (const c of [{ family_id: "f2" }, { item_id: "i2" }, { question_version_id: "q2" }]) { const s = await evidenciaSQL(bd.x, "e1", "a1", c); await rechaza(bd, s.sql, s.args, /FOREIGN KEY/, `I3 ${JSON.stringify(c)}`); }
}));
await caso("I4-I6", "origen: solo práctica; con intento, sin origen o con fecha de publicación distinta, se rechaza (CHECK/NOT NULL)", () => conBase(async (bd) => {
  await sesion(bd.x); await respuesta(bd.x, { id: "a1" });
  for (const [c, motivo] of [[{ source_type: "evaluacion_cierre" }, /CHECK|FOREIGN KEY/], [{ attempt_answer_id: "aa-1" }, /CHECK/], [{ practice_answer_id: null }, /NOT NULL/],
    [{ evaluation_version_id: "ev-v1" }, /CHECK/], [{ review_at: 5 }, /CHECK/], [{ practice_released_at: 999 }, /CHECK/], [{ practice_released_at: null }, /CHECK|NOT NULL/]] as [Record<string, unknown>, RegExp][]) {
    const s = await evidenciaSQL(bd.x, "e1", "a1", c); await rechaza(bd, s.sql, s.args, motivo, `I4-6 ${JSON.stringify(c)}`);
  }
}));
await caso("I10", "segunda evidencia para la misma respuesta", () => conBase(async (bd) => {
  await sesion(bd.x); await respuesta(bd.x, { id: "a1" }); await evidencia(bd.x, "e1", "a1");
  const s = await evidenciaSQL(bd.x, "e2", "a1"); await rechaza(bd, s.sql, s.args, /no se sustituye|UNIQUE/, "I10");
}));
await caso("I11", "UPDATE y DELETE de evidencia, respuesta, evento, anulación", () => conBase(async (bd) => {
  await cadena(bd.x);
  for (const [sql, a] of [["UPDATE knowledge_evidence SET is_correct = 0 WHERE id = 'e1'", []], ["DELETE FROM knowledge_evidence WHERE id = 'e1'", []],
    ["UPDATE practice_answers SET is_correct = 0 WHERE id = 'a1'", []], ["DELETE FROM practice_answers WHERE id = 'a1'", []],
    ["UPDATE knowledge_state_events SET reason = 'liberacion' WHERE id = 'k1'", []], ["DELETE FROM knowledge_state_events WHERE id = 'k1'", []],
    ["UPDATE evidence_voids SET reason = 'x' WHERE id = 'v1'", []], ["DELETE FROM evidence_voids WHERE id = 'v1'", []],
    ["UPDATE OR REPLACE knowledge_evidence SET id = 'e9' WHERE id = 'e1'", []]] as [string, InArgs][]) await rechaza(bd, sql, a, /solo inserción|no se sustituye/, sql);
}));
await caso("I12", "respuesta a una pregunta en borrador, en revisión, retirada, anulada o de otro banco", () => conBase(async (bd) => {
  await sesion(bd.x);
  await bd.x("INSERT INTO question_families (id, item_id, bank) VALUES ('fb', 'i1', 'practica')");
  await bd.x(`INSERT INTO question_versions (id, family_id, item_id, bank, version, status, stem, options_json, correct_option_id, origin, authored_by) VALUES ('qb', 'fb', 'i1', 'practica', 1, 'borrador', 'E', ?, 'o2', 'humano', ?)`, [OPC, AU]);
  const r = (o: Record<string, unknown>) => ({ sql: `INSERT INTO practice_answers (${RCOLS.join(", ")}) VALUES (${RCOLS.map(() => "?").join(", ")})`,
    args: RCOLS.map((k) => ({ id: "a1", session_id: "s1", student_id: EA, purpose: "practica", domain_version_id: "d1-v1", question_version_id: "q1", family_id: "f1", item_id: "i1", bank: "practica", selected_option_id: "o2", is_correct: 1,
      assistance: "ninguna", accommodation: null, client_submission_id: "c1", answered_at: 100, sequence_no: 1, study_day: "2027-03-01", ...o } as Record<string, unknown>)[k] as never) });
  let s = r({ question_version_id: "qb", family_id: "fb" }); await rechaza(bd, s.sql, s.args, /pregunta no aprobada/, "borrador");
  await bd.x("UPDATE question_versions SET status = 'en_revision' WHERE id = 'qb'");
  await rechaza(bd, s.sql, s.args, /pregunta no aprobada/, "en revisión");
  await retirar(bd.x, "q2", "renovacion"); s = r({ question_version_id: "q2", family_id: "f2" }); await rechaza(bd, s.sql, s.args, /pregunta no aprobada/, "retirada");
  await bd.x("INSERT INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('qv-void', 'q3', 'defecto', ?, ?, 3)", [AU, VA]);
  s = r({ question_version_id: "q3", family_id: "f3" }); await rechaza(bd, s.sql, s.args, /pregunta anulada/, "anulada (DB-13)");
  s = r({ question_version_id: "qe", family_id: "e1", bank: "evaluacion" }); await rechaza(bd, s.sql, s.args, /CHECK/, "banco de evaluación");
}));
await caso("I15", "anulación de evidencia: solicitante = aprobador solo con anulación de pregunta; razón obligatoria; coherencia con la pregunta", () => conBase(async (bd) => {
  await sesion(bd.x); await respuesta(bd.x, { id: "a1" }); await evidencia(bd.x, "e1", "a1");
  await rechaza(bd, "INSERT INTO evidence_voids (id, evidence_id, reason, requested_by, approved_by, at) VALUES ('v1','e1','m',?,?,5)", [AU, AU], /CHECK/, "mismas personas");
  await rechaza(bd, "INSERT INTO evidence_voids (id, evidence_id, reason, requested_by, approved_by, at) VALUES ('v1','e1','  ',?,?,5)", [AU, VA], /CHECK/, "razón vacía");
  await bd.x("INSERT INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('qv-void', 'q2', 'x', ?, ?, 3)", [AU, VA]);
  await rechaza(bd, "INSERT INTO evidence_voids (id, evidence_id, question_void_id, reason, requested_by, approved_by, at) VALUES ('v1','e1','qv-void','m',?,?,5)", [AU, VA], /no corresponde a la evidencia/, "anulación de otra pregunta");
  await bd.x("INSERT INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('qv-void2', 'q1', 'x', ?, ?, 3)", [AU, VA]);
  await bd.x("INSERT INTO evidence_voids (id, evidence_id, question_void_id, reason, requested_by, approved_by, at) VALUES ('v2','e1','qv-void2','m',?,?,5)", [AU, VA]);
  assert.equal(await n(bd.c, "evidence_voids"), 1);
  assert.equal(await n(bd.c, "knowledge_evidence"), 1, "anular no borra la evidencia");
}));
await caso("I18", "evidencia con session_ref ajeno", () => conBase(async (bd) => {
  await sesion(bd.x); await sesion(bd.x, "s2", EB); await respuesta(bd.x, { id: "a1" });
  const s = await evidenciaSQL(bd.x, "e1", "a1", { session_ref: "s2" }); await rechaza(bd, s.sql, s.args, /FOREIGN KEY/, "I18");
}));

// ── Endurecimientos D4 ────────────────────────────────────────────────────────
await caso("D4a", "coherencia sesión-dominio-evidencia: fecha, secuencia, día y dominio copiados verificados por FK", () => conBase(async (bd) => {
  await sesion(bd.x); await respuesta(bd.x, { id: "a1" });
  for (const c of [{ occurred_at: 101, practice_released_at: 101 }, { sequence_no: 2 }, { study_day: "2027-03-02" }, { assistance: "pista" }, { domain_version_id: "d2-v1" }]) {
    const s = await evidenciaSQL(bd.x, "e1", "a1", c); await rechaza(bd, s.sql, s.args, /FOREIGN KEY/, `copia ${JSON.stringify(c)}`);
  }
  const s = await evidenciaSQL(bd.x, "e1", "a1", { accommodation: "tiempo extra" }); await rechaza(bd, s.sql, s.args, /accommodation distinto/, "accommodation copiado");
  await respuesta(bd.x, { id: "a2", sequence_no: 2, family_id: "f2", question_version_id: "q2", accommodation: "tiempo extra" });
  await evidencia(bd.x, "e2", "a2");   // con el ajuste copiado: válido
  await respuesta(bd.x, { id: "a3", sequence_no: 3, family_id: "f3", question_version_id: "q3" });
  const t = await evidenciaSQL(bd.x, "e3", "a3", { item_version_id: "i2-iv" }); await rechaza(bd, t.sql, t.args, /FOREIGN KEY/, "versión de contenido de otro contenido");
}));
await caso("D4b", "dominio publicado: la sesión lo exige; una sesión obsoleta no admite respuestas ni evidencia", () => conBase(async (bd) => {
  await dominioPublicado(bd.x, "d3", ["i4"], "validada");
  await rechaza(bd, "INSERT INTO practice_sessions (id, student_id, domain_id, domain_version_id, purpose, started_at) VALUES ('sx', ?, 'd3', 'd3-v1', 'practica', 1)", [EA], /no está publicada/, "sesión sobre dominio validado");
  await sesion(bd.x, "s2", EA, "d2"); await respuesta(bd.x, { id: "a1", session_id: "s2", domain_version_id: "d2-v1", question_version_id: "s1", family_id: "h1", item_id: "i3" });
  await bd.x("UPDATE knowledge_domain_versions SET status = 'retirada' WHERE id = 'd2-v1'");
  await rechaza(bd, `INSERT INTO practice_answers (${RCOLS.join(", ")}) VALUES (${RCOLS.map(() => "?").join(", ")})`,
    ["a2", "s2", EA, "practica", "d2-v1", "s1", "h1", "i3", "practica", "o2", 1, "ninguna", null, "c-a2", 101, 2, "2027-03-01"], /sesion_obsoleta/, "respuesta sobre versión retirada");
  const s = await evidenciaSQL(bd.x, "e1", "a1"); await rechaza(bd, s.sql, s.args, /no está publicada/, "evidencia sobre versión retirada");
}));
await caso("D4c", "una sesión cerrada no admite respuestas", () => conBase(async (bd) => {
  await sesion(bd.x); await bd.x("UPDATE practice_sessions SET ended_at = 60 WHERE id = 's1'");
  await rechaza(bd, `INSERT INTO practice_answers (${RCOLS.join(", ")}) VALUES (${RCOLS.map(() => "?").join(", ")})`,
    ["a1", "s1", EA, "practica", "d1-v1", "q1", "f1", "i1", "practica", "o2", 1, "ninguna", null, "c1", 100, 1, "2027-03-01"], /sesion_cerrada/, "respuesta en sesión cerrada");
  // La respuesta debe coincidir con su sesión (estudiante, propósito, versión de dominio): FK compuesta.
  await sesion(bd.x, "s2", EA, "d2");
  const ins = (o: Record<string, unknown>) => { const v: Record<string, unknown> = { id: "a1", session_id: "s2", student_id: EA, purpose: "practica", domain_version_id: "d2-v1", question_version_id: "s1", family_id: "h1", item_id: "i3", bank: "practica",
    selected_option_id: "o2", is_correct: 1, assistance: "ninguna", accommodation: null, client_submission_id: "c1", answered_at: 100, sequence_no: 1, study_day: "2027-03-01", ...o };
    return { sql: `INSERT INTO practice_answers (${RCOLS.join(", ")}) VALUES (${RCOLS.map(() => "?").join(", ")})`, args: RCOLS.map((k) => v[k] as never) }; };
  for (const [c, nombre] of [[{ session_id: "zz" }, "sesión inexistente"], [{ student_id: EB }, "estudiante distinto del de la sesión"], [{ purpose: "retencion" }, "propósito distinto del de la sesión"], [{ domain_version_id: "d1-v1", question_version_id: "q1", family_id: "f1", item_id: "i1" }, "versión de dominio distinta de la de la sesión"]] as [Record<string, unknown>, string][]) {
    const t = ins(c); await rechaza(bd, t.sql, t.args, /FOREIGN KEY/, nombre);
  }
  const ok = ins({}); await bd.x(ok.sql, ok.args);
}));
await caso("D4d", "secuencia única y creciente; identificador de idempotencia único; por estudiante", () => conBase(async (bd) => {
  await sesion(bd.x); await sesion(bd.x, "s2", EB); await respuesta(bd.x, { id: "a1", sequence_no: 5 });
  const ins = (o: Record<string, unknown>) => ({ sql: `INSERT INTO practice_answers (${RCOLS.join(", ")}) VALUES (${RCOLS.map(() => "?").join(", ")})`,
    args: RCOLS.map((k) => ({ id: "a2", session_id: "s1", student_id: EA, purpose: "practica", domain_version_id: "d1-v1", question_version_id: "q2", family_id: "f2", item_id: "i1", bank: "practica",
      selected_option_id: "o2", is_correct: 1, assistance: "ninguna", accommodation: null, client_submission_id: "c-a2", answered_at: 101, sequence_no: 6, study_day: "2027-03-01", ...o } as Record<string, unknown>)[k] as never) });
  let s = ins({ sequence_no: 5 }); await rechaza(bd, s.sql, s.args, /no se sustituye|UNIQUE|creciente/, "secuencia repetida");
  s = ins({ sequence_no: 3 }); await rechaza(bd, s.sql, s.args, /creciente/, "secuencia decreciente");
  s = ins({ client_submission_id: "c-a1" }); await rechaza(bd, s.sql, s.args, /no se sustituye|UNIQUE/, "client_submission_id repetido");
  s = ins({ student_id: EB, session_id: "s2", sequence_no: 5, client_submission_id: "c-a1" });
  await bd.x(s.sql, s.args);   // otro estudiante: misma secuencia y mismo identificador es válido
  assert.equal(await n(bd.c, "practice_answers"), 2);
}));
await caso("D4e", "correctitud verificada contra la clave; la opción debe ser de la pregunta", () => conBase(async (bd) => {
  await sesion(bd.x);
  const ins = (o: Record<string, unknown>) => ({ sql: `INSERT INTO practice_answers (${RCOLS.join(", ")}) VALUES (${RCOLS.map(() => "?").join(", ")})`,
    args: RCOLS.map((k) => ({ id: "a1", session_id: "s1", student_id: EA, purpose: "practica", domain_version_id: "d1-v1", question_version_id: "q1", family_id: "f1", item_id: "i1", bank: "practica",
      selected_option_id: "o2", is_correct: 1, assistance: "ninguna", accommodation: null, client_submission_id: "c1", answered_at: 100, sequence_no: 1, study_day: "2027-03-01", ...o } as Record<string, unknown>)[k] as never) });
  let s = ins({ selected_option_id: "o1", is_correct: 1 }); await rechaza(bd, s.sql, s.args, /is_correct no corresponde/, "incorrecta marcada correcta");
  s = ins({ selected_option_id: "o2", is_correct: 0 }); await rechaza(bd, s.sql, s.args, /is_correct no corresponde/, "correcta marcada incorrecta");
  s = ins({ selected_option_id: "zz", is_correct: 0 }); await rechaza(bd, s.sql, s.args, /opción no pertenece/, "opción ajena");
  s = ins({ study_day: "ayer" }); await rechaza(bd, s.sql, s.args, /CHECK/, "día mal formado");
  s = ins({ assistance: "otra" }); await rechaza(bd, s.sql, s.args, /CHECK/, "asistencia fuera de lista");
  s = ins({ contenido: 1, item_id: "i2" }); await rechaza(bd, s.sql, s.args, /FOREIGN KEY|no pertenece/, "contenido que no es de la pregunta");
  s = ins({ domain_version_id: "d2-v1" }); await rechaza(bd, s.sql, s.args, /FOREIGN KEY|no pertenece/, "dominio distinto del de la sesión");
  s = ins({ question_version_id: "s1", family_id: "h1", item_id: "i3" }); await rechaza(bd, s.sql, s.args, /no pertenece a la versión de dominio/, "pregunta de un contenido que no está en la versión de dominio de la sesión");
}));

// ── Sesiones: una abierta por estudiante y dominio, sin importar el propósito (D5.4) ─────────────────
await caso("S1", "una sesión abierta por estudiante y dominio, de cualquier propósito; otras combinaciones sí", () => conBase(async (bd) => {
  await sesion(bd.x);
  await rechaza(bd, "INSERT INTO practice_sessions (id, student_id, domain_id, domain_version_id, purpose, started_at) VALUES ('s2', ?, 'd1', 'd1-v1', 'practica', 51)", [EA], /UNIQUE|no se sustituye/, "misma práctica");
  await rechaza(bd, "INSERT INTO practice_sessions (id, student_id, domain_id, domain_version_id, purpose, started_at) VALUES ('s2', ?, 'd1', 'd1-v1', 'retencion', 51)", [EA], /UNIQUE|no se sustituye/, "otro propósito, mismo dominio");
  await sesion(bd.x, "s3", EB); await sesion(bd.x, "s4", EA, "d2");   // otro estudiante / otro dominio
  await bd.c.batch([{ sql: "UPDATE practice_sessions SET ended_at = 60 WHERE id = 's1'" },
    { sql: "INSERT INTO practice_sessions (id, student_id, domain_id, domain_version_id, purpose, started_at) VALUES ('s5', ?, 'd1', 'd1-v1', 'retencion', 60)", args: [EA] }], "write");
  assert.equal(await n(bd.c, "practice_sessions", "ended_at IS NULL AND student_id = 'est-a' AND domain_id = 'd1'"), 1);
}));
await caso("S2", "sesión: nace abierta, identidad inmutable, no se reabre, no se borra, se sustituye nunca", () => conBase(async (bd) => {
  await rechaza(bd, "INSERT INTO practice_sessions (id, student_id, domain_id, domain_version_id, purpose, started_at) VALUES ('s8', ?, 'd1', 'd1-v1', 'evaluacion', 1)", [EA], /CHECK/, "propósito fuera de lista");
  await rechaza(bd, "INSERT INTO practice_sessions (id, student_id, domain_id, domain_version_id, purpose, started_at, ended_at) VALUES ('s9', ?, 'd1', 'd1-v1', 'practica', 1, 2)", [EA], /nace abierta/, "nace cerrada");
  await sesion(bd.x);
  for (const c of ["id = 'sz'", "student_id = 'est-b'", "domain_id = 'd2'", "domain_version_id = 'd2-v1'", "purpose = 'retencion'", "started_at = 1"]) await rechaza(bd, `UPDATE practice_sessions SET ${c} WHERE id = 's1'`, [], /identidad inmutable/, c);
  await rechaza(bd, "UPDATE practice_sessions SET ended_at = 10 WHERE id = 's1'", [], /CHECK/, "cierre anterior al inicio");
  await bd.x("UPDATE practice_sessions SET ended_at = 60 WHERE id = 's1'");
  await rechaza(bd, "UPDATE practice_sessions SET ended_at = NULL WHERE id = 's1'", [], /no se reabre/, "reabrir");
  await rechaza(bd, "UPDATE practice_sessions SET ended_at = 70 WHERE id = 's1'", [], /no se reabre/, "recerrar");
  await rechaza(bd, "DELETE FROM practice_sessions WHERE id = 's1'", [], /no se borra/, "borrar");
}));

// ── Políticas (D5.3) ──────────────────────────────────────────────────────────
await caso("PO1", "política: nace en borrador, única transición borrador→aprobada, aprobada inmutable", () => conBase(async (bd) => {
  await rechaza(bd, "INSERT INTO mastery_policies (id, version, rules_json, status, approved_by, approved_at) VALUES ('p9', 9, ?, 'aprobada', ?, 1)", [JSON.stringify(POL_BASE), VA], /nace en borrador/, "nace aprobada");
  await rechaza(bd, "INSERT INTO mastery_policies (id, version, rules_json, status) VALUES ('p9', 9, '[1]', 'borrador')", [], /CHECK/, "JSON no objeto");
  await rechaza(bd, "INSERT INTO mastery_policies (id, version, rules_json, status) VALUES ('p9', 9, 'no json', 'borrador')", [], /CHECK/, "JSON inválido");
  await rechaza(bd, "INSERT INTO mastery_policies (id, version, rules_json, status) VALUES ('p9', 9, '{}', 'retirada')", [], /CHECK|nace en borrador/, "estado retirada no existe");
  await bd.x("INSERT INTO mastery_policies (id, version, rules_json, status) VALUES ('p1', 1, '{\"k6_min_families\": null}', 'borrador')");   // el borrador admite nulos
  await bd.x("UPDATE mastery_policies SET rules_json = ? WHERE id = 'p1'", [JSON.stringify(POL_BASE)]);   // y se edita
  await rechaza(bd, "UPDATE mastery_policies SET approved_by = ? WHERE id = 'p1'", [VA], /CHECK/, "aprobador sin aprobar");
  await rechaza(bd, "UPDATE mastery_policies SET status = 'aprobada' WHERE id = 'p1'", [], /CHECK/, "aprobar sin aprobador ni fecha");
  await bd.x("UPDATE mastery_policies SET status = 'aprobada', approved_by = ?, approved_at = 5 WHERE id = 'p1'", [VA]);
  for (const sql of ["UPDATE mastery_policies SET rules_json = '{}' WHERE id = 'p1'", "UPDATE mastery_policies SET status = 'borrador', approved_by = NULL, approved_at = NULL WHERE id = 'p1'",
    "UPDATE mastery_policies SET approved_by = 'ficticio-otro' WHERE id = 'p1'", "UPDATE mastery_policies SET version = 7 WHERE id = 'p1'", "DELETE FROM mastery_policies WHERE id = 'p1'"]) await rechaza(bd, sql, [], /inmutable|no se borra|única transición|identidad/, sql);
  await bd.x("INSERT INTO mastery_policies (id, version, rules_json, status) VALUES ('p2', 2, '{}', 'borrador')");
  await rechaza(bd, "UPDATE mastery_policies SET id = 'p3' WHERE id = 'p2'", [], /identidad/, "id");
  await rechaza(bd, "UPDATE mastery_policies SET version = 1 WHERE id = 'p2'", [], /identidad/, "versión");
  await bd.x("DELETE FROM mastery_policies WHERE id = 'p2'");   // un borrador se descarta
  assert.equal(await n(bd.c, "mastery_policies"), 1);
}));
await caso("PO2", "aprobar exige los ocho parámetros completos, tipados y no nulos (la base los valida)", () => conBase(async (bd) => {
  const intento = async (reglas: unknown, motivo: RegExp | null, id: string, version: number) => {
    await bd.x("INSERT INTO mastery_policies (id, version, rules_json, status) VALUES (?, ?, ?, 'borrador')", [id, version, JSON.stringify(reglas)]);
    const sql = "UPDATE mastery_policies SET status = 'aprobada', approved_by = ?, approved_at = 9 WHERE id = ?";
    if (motivo) await rechaza(bd, sql, [VA, id], motivo, JSON.stringify(reglas)); else await bd.x(sql, [VA, id]);
  };
  let v = 10;
  for (const k of Object.keys(POL_BASE)) {
    const sin = { ...POL_BASE } as Record<string, unknown>; delete sin[k];
    await intento(sin, /ocho parámetros/, `pa${v}`, v++);
    await intento({ ...POL_BASE, [k]: null }, /ocho parámetros/, `pa${v}`, v++);
  }
  const malos: Record<string, unknown>[] = [{ k6_min_families: 3 }, { k6_min_families: 2.5 }, { k6_min_families: "2" }, { k6_separation: "otra" }, { k6_separation: 1 }, { assisted_counts: 1 }, { assisted_counts: "true" },
    { wrong_with_help_counts: null }, { error_repaired_counts: "no" }, { retired_counts: 0 }, { demote_wrong_families: 0 }, { demote_wrong_families: "2" }, { not_mastered_wrong_families: 1.5 }, { not_mastered_wrong_families: -1 }, { extra: 1 }];
  for (const m of malos) await intento({ ...POL_BASE, ...m }, /ocho parámetros/, `pa${v}`, v++);
  await intento(POL_BASE, null, `pa${v}`, v++);   // completa: se aprueba
  await intento({ ...POL_BASE, k6_separation: "dia", retired_counts: false, demote_wrong_families: 1 }, null, `pa${v}`, v++);
}));

// ── Eventos y proyección ──────────────────────────────────────────────────────
await caso("EV1", "eventos: reason y trigger coherentes, un evento solo si algo cambia, política aprobada, evidencia del mismo contenido", () => conBase(async (bd) => {
  await politica(bd.x); await sesion(bd.x); await respuesta(bd.x, { id: "a1" }); await evidencia(bd.x, "e1", "a1");
  const ins = (c: Record<string, unknown>) => { const v: Record<string, unknown> = { id: "k1", student_id: EA, item_id: "i1", from_state: null, to_state: "incierto", from_flag: null, to_flag: null, reason: "evidencia",
    trigger_evidence_id: "e1", trigger_void_id: null, policy_id: "pol1", domain_version_id: "d1-v1", computed_at: 100, effective_at: 100, ...c }; const cols = Object.keys(v); return { sql: `INSERT INTO knowledge_state_events (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`, args: cols.map((k) => v[k] as never) }; };
  for (const [c, m] of [[{ reason: "evidencia", trigger_evidence_id: null }, /CHECK/], [{ reason: "evidencia", trigger_void_id: "v1" }, /CHECK|FOREIGN KEY/], [{ reason: "anulacion", trigger_evidence_id: null, trigger_void_id: null }, /CHECK/],
    [{ reason: "otra" }, /CHECK/], [{ to_state: "dominio" }, /CHECK/], [{ from_state: "incierto", to_state: "incierto" }, /CHECK/], [{ to_flag: "otra" }, /CHECK/], [{ policy_id: "zz" }, /FOREIGN KEY|no está aprobada/],
    [{ student_id: EB }, /no es del mismo estudiante/], [{ item_id: "i2" }, /no es del mismo estudiante/], [{ domain_version_id: "zz" }, /FOREIGN KEY/]] as [Record<string, unknown>, RegExp][]) {
    const s = ins(c); await rechaza(bd, s.sql, s.args, m, JSON.stringify(c));
  }
  await bd.x("INSERT INTO mastery_policies (id, version, rules_json, status) VALUES ('pb', 2, '{}', 'borrador')");
  const b = ins({ policy_id: "pb" }); await rechaza(bd, b.sql, b.args, /no está aprobada/, "política en borrador");
  for (const r of ["liberacion", "nueva_version", "cambio_politica", "retencion_vencida"]) { const s = ins({ id: `k-${r}`, reason: r, trigger_evidence_id: null, from_state: "incierto", to_state: "dominado" }); await bd.x(s.sql, s.args); }
  const ok = ins({}); await bd.x(ok.sql, ok.args);
  assert.equal(await n(bd.c, "knowledge_state_events"), 5);
}));
await caso("PR1", "proyección: sin conteos de familias, assisted_count ni mastered_at; seis motivos; UPDATE permitido; UPSERT y REPLACE rechazados", () => conBase(async (bd) => {
  await politica(bd.x);
  const cols = (await bd.x("PRAGMA table_info(student_knowledge_state)")).rows.map((r) => String(r.name));
  for (const k of ["correct_families", "wrong_families", "assisted_count", "mastered_at"]) assert.ok(!cols.includes(k), `la proyección no debe tener ${k} (D5.5)`);
  let i = 0;
  for (const r of ["pocas_evidencias", "solo_con_ayuda", "contradictoria", "ruptura", "retencion_vencida", "banco_insuficiente"]) { await bd.x("INSERT INTO users (id, email) VALUES (?, ?)", [`u${i}`, `u${i}@f.test`]); await proyeccion(bd.x, { student_id: `u${i++}`, uncertainty_reason: r }); }
  for (const [c, m] of [[{ state: "x" }, /CHECK/], [{ flag: "otra" }, /CHECK/], [{ uncertainty_reason: "otra" }, /CHECK/], [{ policy_id: "zz" }, /FOREIGN KEY|no está aprobada/], [{ item_id: "zz" }, /FOREIGN KEY/], [{ student_id: "zz" }, /FOREIGN KEY/]] as [Record<string, unknown>, RegExp][]) {
    await rechaza(bd, `INSERT INTO student_knowledge_state (student_id, item_id, state, flag, uncertainty_reason, last_evidence_at, policy_id, domain_version_id, computed_through, updated_at)
      VALUES (:student_id, :item_id, :state, :flag, :uncertainty_reason, 1, :policy_id, 'd1-v1', 1, 1)`,
      { student_id: EB, item_id: "i1", state: "incierto", flag: null, uncertainty_reason: null, policy_id: "pol1", ...c } as never, m, JSON.stringify(c));
  }
  await proyeccion(bd.x);
  await bd.x("UPDATE student_knowledge_state SET state = 'dominado', flag = 'por_comprobar', computed_through = 200, updated_at = 200 WHERE student_id = ? AND item_id = 'i1'", [EA]);   // se actualiza
  await rechaza(bd, "UPDATE student_knowledge_state SET item_id = 'i2' WHERE student_id = ? AND item_id = 'i1'", [EA], /identidad/, "identidad");
  await rechaza(bd, "UPDATE student_knowledge_state SET policy_id = 'zz' WHERE student_id = ?", [EA], /FOREIGN KEY|no está aprobada/, "política");
  await bd.x("INSERT INTO mastery_policies (id, version, rules_json, status) VALUES ('pb', 2, '{}', 'borrador')");
  await rechaza(bd, "UPDATE student_knowledge_state SET policy_id = 'pb' WHERE student_id = ?", [EA], /no está aprobada/, "política en borrador (UPDATE)");
  await rechaza(bd, "INSERT INTO student_knowledge_state (student_id, item_id, state, policy_id, domain_version_id, computed_through, updated_at) VALUES (?, 'i2', 'incierto', 'pb', 'd1-v1', 1, 1)", [EA], /no está aprobada/, "política en borrador (INSERT)");
  await rechaza(bd, "INSERT INTO student_knowledge_state SELECT * FROM student_knowledge_state WHERE student_id = ? ON CONFLICT DO UPDATE SET state = 'incierto'", [EA], /no se sustituye/, "UPSERT");
  await rechaza(bd, "INSERT OR REPLACE INTO student_knowledge_state SELECT * FROM student_knowledge_state WHERE student_id = ?", [EA], /no se sustituye/, "REPLACE");
}));

// ── Patrón de 0003: ninguna tabla nueva admite sustitución, con o sin claves foráneas activas ─────────────
const SUSTITUIBLES: [string, string, string[], string][] = [
  ["practice_sessions", "id = 's1'", [], "ended_at"], ["practice_answers", "id = 'a1'", [], "is_correct"], ["knowledge_evidence", "id = 'e1'", [], "is_correct"],
  ["evidence_voids", "id = 'v1'", [], "reason"], ["mastery_policies", "id = 'pol1'", [], "rules_json"], ["knowledge_state_events", "id = 'k1'", [], "reason"],
  ["student_knowledge_state", "student_id = 'est-a'", [], "state"],
];
for (const fkOff of [false, true]) {
  await caso(fkOff ? "SU2" : "SU1", `INSERT OR REPLACE / OR IGNORE / ON CONFLICT sobre las siete tablas se rechaza y no cambia nada${fkOff ? " (PRAGMA foreign_keys = OFF: no dependen de las FK)" : ""}`, () => conBase(async (bd) => {
    await cadena(bd.x);
    if (fkOff) await bd.x("PRAGMA foreign_keys = OFF");
    for (const [t, donde, , col] of SUSTITUIBLES) {
      for (const [nombre, sql] of [
        ["OR REPLACE", `INSERT OR REPLACE INTO ${t} SELECT * FROM ${t} WHERE ${donde}`], ["OR IGNORE", `INSERT OR IGNORE INTO ${t} SELECT * FROM ${t} WHERE ${donde}`],
        ["DO NOTHING", `INSERT INTO ${t} SELECT * FROM ${t} WHERE ${donde} ON CONFLICT DO NOTHING`], ["DO UPDATE", `INSERT INTO ${t} SELECT * FROM ${t} WHERE ${donde} ON CONFLICT DO UPDATE SET ${col} = excluded.${col}`]]) {
        await rechaza(bd, sql, [], /no se sustituye|solo inserción|inmutable|identidad|creciente|nace en borrador/, `${t} ${nombre}`);
      }
    }
    // Sustituciones por una clave única distinta de la primaria (fila nueva con el id cambiado).
    await rechaza(bd, `INSERT OR REPLACE INTO practice_answers (${RCOLS.join(", ")}) VALUES (${RCOLS.map(() => "?").join(", ")})`,
      ["a9", "s1", EA, "practica", "d1-v1", "q1", "f1", "i1", "practica", "o2", 1, "ninguna", null, "c-a1", 101, 2, "2027-03-01"], /no se sustituye|UNIQUE/, "respuesta con el client_submission_id de otra");
    await rechaza(bd, `INSERT OR REPLACE INTO practice_answers (${RCOLS.join(", ")}) VALUES (${RCOLS.map(() => "?").join(", ")})`,
      ["a1", "s1", EA, "practica", "d1-v1", "q1", "f1", "i1", "practica", "o2", 1, "ninguna", null, "c-otro", 150, 9, "2027-03-01"], /no se sustituye/, "respuesta con el id de otra y otra secuencia");
    await rechaza(bd, "INSERT OR REPLACE INTO mastery_policies (id, version, rules_json, status) VALUES ('p9', 1, '{}', 'borrador')", [], /no se sustituye/, "política con la versión de otra");
    await rechaza(bd, "INSERT OR REPLACE INTO evidence_voids (id, evidence_id, reason, requested_by, approved_by, at) VALUES ('v9', 'e1', 'x', ?, ?, 9)", [AU, VA], /no se sustituye|UNIQUE/, "anulación de la misma evidencia");
    const e9 = await evidenciaSQL(bd.x, "e9", "a1"); await rechaza(bd, e9.sql.replace("INSERT INTO", "INSERT OR REPLACE INTO"), e9.args, /no se sustituye|UNIQUE/, "evidencia de la misma respuesta");
    await rechaza(bd, "INSERT OR REPLACE INTO practice_sessions (id, student_id, domain_id, domain_version_id, purpose, started_at) VALUES ('s9', ?, 'd1', 'd1-v1', 'practica', 51)", [EA], /no se sustituye/, "segunda sesión abierta del dominio");
    for (const sql of ["UPDATE knowledge_evidence SET id = 'x' WHERE id = 'e1'", "DELETE FROM practice_answers", "DELETE FROM knowledge_state_events", "UPDATE OR REPLACE practice_answers SET sequence_no = 1"]) await rechaza(bd, sql, [], /solo inserción/, `${sql} (FK ${fkOff ? "off" : "on"})`);
  }));
}

fs.rmSync(RAIZ, { recursive: true, force: true });
console.log(salida.join("\n"));
console.log(`evidencia-db: ok (${casos} casos)`);
await liberarNativos();
