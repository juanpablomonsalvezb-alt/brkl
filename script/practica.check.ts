// IMP-031 (H3a): registro atómico de práctica. Ejecutar: npm run check:vortice
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
const RCOLS = ["id", "session_id", "student_id", "purpose", "domain_version_id", "question_version_id", "family_id", "item_id", "bank", "selected_option_id", "is_correct", "assistance", "accommodation", "client_submission_id", "answered_at", "sequence_no", "study_day"];

// ── IMP-031: registro atómico de práctica (server/practica.ts) ────────────────────────────────────────
import { cerrarSesion, iniciarSesion, MAX_INTENTOS, PracticaError, registrarRespuesta } from "../server/practica";
import { compararProyeccion } from "../server/reconstruccion";
import { dayKey } from "../shared/repaso";

const PA = await construirPlantilla("A"); await liberarNativos();
const PB = await construirPlantilla("B"); await liberarNativos();   // segunda base, construida desde cero
const conBase = async (f: (bd: ReturnType<typeof abrir>) => Promise<void>, plantilla = PA) => { const bd = abrir(plantilla); try { await f(bd); } finally { bd.cerrar(); } };
const resp = (c: Client, ses: string, est: string, qv: string, opt: string, csid: string, extra: Record<string, unknown> = {}) =>
  registrarRespuesta(c, { estudiante: est, sesionId: ses, preguntaVersionId: qv, opcionId: opt, clientSubmissionId: csid, ...extra } as never);
const codigo = async (p: Promise<unknown>, cod: string, nombre: string) => assert.rejects(p, (e: unknown) => e instanceof PracticaError && e.codigo === cod, nombre);
const sin = async (bd: ReturnType<typeof abrir>, f: () => Promise<unknown>, cod: string, nombre: string) => {
  const antes = await huella(bd.c); await codigo(f(), cod, nombre); assert.equal(await huella(bd.c), antes, `${nombre}: el rechazo no debe escribir nada`);
};
const TABLAS = ["practice_answers", "knowledge_evidence", "knowledge_state_events", "student_knowledge_state"];
const cuentas = async (c: Client) => Object.fromEntries(await Promise.all(TABLAS.map(async (t) => [t, await n(c, t)])));

await caso("SE1", "sesiones: abrir otra del mismo estudiante y dominio cierra la anterior (cualquier propósito); otros dominios y estudiantes no", () => conBase(async (bd) => {
  const s1 = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" });
  assert.equal(s1.domainVersionId, "d1-v1");
  const s2 = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "retencion" });
  assert.equal(await n(bd.c, "practice_sessions", "ended_at IS NULL AND student_id = 'est-a' AND domain_id = 'd1'"), 1);
  assert.notEqual(s1.id, s2.id);
  assert.ok((await bd.x("SELECT ended_at FROM practice_sessions WHERE id = ?", [s1.id])).rows[0].ended_at != null, "la anterior quedó cerrada");
  await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d2", proposito: "practica" }); await iniciarSesion(bd.c, { estudiante: EB, dominioId: "d1", proposito: "practica" });
  assert.equal(await n(bd.c, "practice_sessions", "ended_at IS NULL"), 3);
  await cerrarSesion(bd.c, { estudiante: EA, sesionId: s2.id }); await cerrarSesion(bd.c, { estudiante: EA, sesionId: s2.id });   // idempotente
  await codigo(cerrarSesion(bd.c, { estudiante: EB, sesionId: s2.id }), "sesion_no_encontrada", "cerrar la sesión de otro");
  await dominioPublicado(bd.x, "d9", ["i9"], "validada");
  await sin(bd, () => iniciarSesion(bd.c, { estudiante: EA, dominioId: "d9", proposito: "practica" }), "dominio_no_publicado", "dominio sin versión publicada");
}));
await caso("SE2", "abrir sesión es atómico: si falla la apertura, la anterior sigue abierta", () => conBase(async (bd) => {
  const s1 = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" });
  await bd.x("CREATE TRIGGER fallo_sesion BEFORE INSERT ON practice_sessions BEGIN SELECT RAISE(ABORT, 'fallo forzado'); END");
  const antes = await huella(bd.c);
  await assert.rejects(iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" }), /fallo forzado/);
  assert.equal(await huella(bd.c), antes);
  assert.ok((await bd.x("SELECT ended_at FROM practice_sessions WHERE id = ?", [s1.id])).rows[0].ended_at == null);
}));

await caso("RE1", "sin política ejecutable: se conservan respuesta y evidencia; no hay evento ni proyección", () => conBase(async (bd) => {
  const s = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" });
  const r = await resp(bd.c, s.id, EA, "q1", "o2", "c1");
  assert.deepEqual([r.correcta, r.secuencia, r.duplicada, r.estado], [true, 1, false, null]);
  assert.deepEqual(await cuentas(bd.c), { practice_answers: 1, knowledge_evidence: 1, knowledge_state_events: 0, student_knowledge_state: 0 });
  await bd.x("INSERT INTO mastery_policies (id, version, rules_json, status) VALUES ('pb', 1, '{\"k6_min_families\": 2}', 'borrador')");   // un borrador no es política vigente
  await resp(bd.c, s.id, EA, "q2", "o1", "c2");
  assert.deepEqual(await cuentas(bd.c), { practice_answers: 2, knowledge_evidence: 2, knowledge_state_events: 0, student_knowledge_state: 0 });
}));
await caso("RE2", "con política: evento solo al cambiar el estado o la marca; proyección actualizada; K6 con dos familias", () => conBase(async (bd) => {
  await politica(bd.x);
  const s = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" });
  const r1 = await resp(bd.c, s.id, EA, "q1", "o2", "c1");
  assert.deepEqual([r1.estado?.estado, r1.estado?.motivo], ["incierto", "pocas_evidencias"]);
  const r1b = await resp(bd.c, s.id, EA, "q1", "o2", "c1b");   // misma familia: sigue incierto, sin evento nuevo
  assert.equal(r1b.estado?.estado, "incierto");
  assert.equal(await n(bd.c, "knowledge_state_events"), 1, "sin cambio de estado no hay evento");
  const r2 = await resp(bd.c, s.id, EA, "q2", "o2", "c2");
  assert.equal(r2.estado?.estado, "dominado"); assert.equal(r2.estado?.marca, null);
  const r3 = await resp(bd.c, s.id, EA, "q3", "o1", "c3");   // error en una tercera familia: dominado con marca
  assert.deepEqual([r3.estado?.estado, r3.estado?.marca], ["dominado", "por_comprobar"]);
  assert.deepEqual([r1.secuencia, r1b.secuencia, r2.secuencia, r3.secuencia], [1, 2, 3, 4]);
  const ev = (await bd.x("SELECT from_state, to_state, from_flag, to_flag, reason FROM knowledge_state_events ORDER BY computed_at, rowid")).rows.map((x) => `${x.from_state}>${x.to_state}/${x.from_flag}>${x.to_flag}/${x.reason}`);
  assert.deepEqual(ev, ["null>incierto/null>null/evidencia", "incierto>dominado/null>null/evidencia", "dominado>dominado/null>por_comprobar/evidencia"]);
  const p = (await bd.x("SELECT * FROM student_knowledge_state WHERE student_id = ? AND item_id = 'i1'", [EA])).rows[0];
  assert.deepEqual([p.state, p.flag, p.policy_id, p.domain_version_id], ["dominado", "por_comprobar", "pol1", "d1-v1"]);
  const ultima = (await bd.x("SELECT MAX(answered_at) AS t FROM practice_answers")).rows[0].t;
  assert.deepEqual([p.computed_through, p.last_evidence_at], [ultima, ultima]);
  assert.equal((await compararProyeccion(bd.c, EA, ultima as number + 1)).iguales, true, "la proyección escrita es la reconstruible (D9)");
  const sb = await iniciarSesion(bd.c, { estudiante: EB, dominioId: "d1", proposito: "practica" });
  assert.equal((await resp(bd.c, sb.id, EB, "q1", "o2", "c1")).secuencia, 1, "la secuencia es por estudiante; el identificador de idempotencia también");
}));
await caso("RE3", "la correctitud la fija el servidor; un is_correct del cliente se ignora", () => conBase(async (bd) => {
  const s = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" });
  const r = await resp(bd.c, s.id, EA, "q1", "o1", "c1", { is_correct: 1, correcta: true } as never);
  assert.equal(r.correcta, false);
  assert.equal(Number((await bd.x("SELECT is_correct FROM practice_answers WHERE id = ?", [r.respuestaId])).rows[0].is_correct), 0);
  assert.equal(Number((await bd.x("SELECT is_correct FROM knowledge_evidence WHERE id = ?", [r.evidenciaId])).rows[0].is_correct), 0);
}));
await caso("RE4", "rechazos sin escribir nada: opción ajena, pregunta no disponible, sesión ajena, cerrada u obsoleta", () => conBase(async (bd) => {
  const s = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" });
  await sin(bd, () => resp(bd.c, s.id, EA, "q1", "zz", "c1"), "opcion_invalida", "opción ajena");
  await sin(bd, () => resp(bd.c, s.id, EA, "nopreg", "o2", "c1"), "pregunta_no_disponible", "pregunta inexistente");
  await sin(bd, () => resp(bd.c, s.id, EA, "qe", "o2", "c1"), "pregunta_no_disponible", "banco de evaluación");
  await sin(bd, () => resp(bd.c, s.id, EA, "s1", "o2", "c1"), "pregunta_no_disponible", "contenido de otro dominio");
  await bd.x("INSERT INTO question_families (id, item_id, bank) VALUES ('fb', 'i1', 'practica')");
  await bd.x("INSERT INTO question_versions (id, family_id, item_id, bank, version, status, stem, options_json, correct_option_id, origin, authored_by) VALUES ('qb', 'fb', 'i1', 'practica', 1, 'borrador', 'E', ?, 'o2', 'humano', ?)", [OPC, AU]);
  await sin(bd, () => resp(bd.c, s.id, EA, "qb", "o2", "c1"), "pregunta_no_disponible", "borrador");
  await retirar(bd.x, "q2", "renovacion"); await sin(bd, () => resp(bd.c, s.id, EA, "q2", "o2", "c1"), "pregunta_no_disponible", "retirada");
  await bd.x("INSERT INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('qvo', 'q3', 'x', ?, ?, 3)", [AU, VA]);
  await sin(bd, () => resp(bd.c, s.id, EA, "q3", "o2", "c1"), "pregunta_no_disponible", "anulada (DB-13)");
  await sin(bd, () => resp(bd.c, s.id, EA, "q1", "o2", "c1", { asistencia: "magia" }), "opcion_invalida", "asistencia fuera de lista");
  await sin(bd, () => resp(bd.c, s.id, EB, "q1", "o2", "c1"), "sesion_no_encontrada", "sesión de otro estudiante");
  await sin(bd, () => resp(bd.c, "zz", EA, "q1", "o2", "c1"), "sesion_no_encontrada", "sesión inexistente");
  await bd.x("UPDATE knowledge_domain_versions SET status = 'retirada' WHERE id = 'd1-v1'");
  await sin(bd, () => resp(bd.c, s.id, EA, "q1", "o2", "c1"), "sesion_obsoleta", "sesión cuya versión dejó de estar publicada");
  const s2 = await iniciarSesion(bd.c, { estudiante: EB, dominioId: "d2", proposito: "practica" }); await cerrarSesion(bd.c, { estudiante: EB, sesionId: s2.id });
  await sin(bd, () => resp(bd.c, s2.id, EB, "s1", "o2", "c9"), "sesion_cerrada", "sesión cerrada");
  assert.equal(await n(bd.c, "practice_answers"), 0);
}));
await caso("RE5", "tiempo y día los fija el servidor (reloj de la base, día de Chile); ayuda y ajuste se guardan; la ayuda no cuenta para K6 (O3 recomendada)", () => conBase(async (bd) => {
  await politica(bd.x);
  const s = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" });
  const r = await resp(bd.c, s.id, EA, "q1", "o2", "c1", { asistencia: "pista", ajuste: "tiempo extra" });
  const a = (await bd.x("SELECT answered_at, study_day, assistance, accommodation, session_id, student_id FROM practice_answers WHERE id = ?", [r.respuestaId])).rows[0];
  assert.ok(Math.abs(Number(a.answered_at) - Date.now() / 1000) < 30, "answered_at sale del reloj de la base");   // Date.now solo en la prueba, para acotar
  assert.equal(a.study_day, dayKey(new Date(Number(a.answered_at) * 1000)));
  assert.deepEqual([a.assistance, a.accommodation, a.session_id, a.student_id], ["pista", "tiempo extra", s.id, EA]);
  const e = (await bd.x("SELECT accommodation, assistance, occurred_at, practice_released_at FROM knowledge_evidence WHERE id = ?", [r.evidenciaId])).rows[0];
  assert.deepEqual([e.accommodation, e.assistance, e.occurred_at === a.answered_at, e.practice_released_at === a.answered_at], ["tiempo extra", "pista", true, true]);
  const r2 = await resp(bd.c, s.id, EA, "q2", "o2", "c2");   // 2 familias, una con ayuda: TK6 → incierto
  assert.equal(r2.estado?.estado, "incierto");
  // La ayuda de la respuesta NUEVA también cuenta: acierto limpio y luego acierto con pista → incierto (TK6).
  const sb = await iniciarSesion(bd.c, { estudiante: EB, dominioId: "d1", proposito: "practica" });
  await resp(bd.c, sb.id, EB, "q1", "o2", "b1");
  assert.equal((await resp(bd.c, sb.id, EB, "q2", "o2", "b2", { asistencia: "pista" })).estado?.estado, "incierto");
  assert.equal((await resp(bd.c, sb.id, EB, "q3", "o2", "b3")).estado?.estado, "dominado", "q1 y q3 sin ayuda: dos familias");
  // El tiempo sale del reloj de la base: con un reloj inyectado se ve en answered_at y en el día de estudio.
  const sc = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d2", proposito: "practica" });
  const fijo = { execute: (s: unknown, ...r: unknown[]) => (typeof s === "string" && /unixepoch\('subsec'\)/.test(s) ? Promise.resolve({ rows: [[1_900_000_000.5]] }) : (bd.c.execute as (...a: unknown[]) => unknown)(s, ...r)),
    batch: bd.c.batch.bind(bd.c) } as unknown as Client;
  const rf = await registrarRespuesta(fijo, { estudiante: EA, sesionId: sc.id, preguntaVersionId: "s1", opcionId: "o2", clientSubmissionId: "cf" });
  const af = (await bd.x("SELECT answered_at, study_day FROM practice_answers WHERE id = ?", [rf.respuestaId])).rows[0];
  assert.deepEqual([af.answered_at, af.study_day], [1_900_000_000.5, dayKey(new Date(1_900_000_000.5 * 1000))]);
}));

await caso("ID1", "idempotencia secuencial: mismo identificador y contenido devuelve el original; otro contenido es conflicto", () => conBase(async (bd) => {
  await politica(bd.x);
  const s = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" });
  const r = await resp(bd.c, s.id, EA, "q1", "o2", "c1");
  const antes = await huella(bd.c);
  const d = await resp(bd.c, s.id, EA, "q1", "o2", "c1");
  assert.deepEqual([d.respuestaId, d.evidenciaId, d.correcta, d.secuencia, d.duplicada, d.estado], [r.respuestaId, r.evidenciaId, r.correcta, r.secuencia, true, r.estado]);
  assert.equal(await huella(bd.c), antes, "el reenvío no escribe nada");
  await sin(bd, () => resp(bd.c, s.id, EA, "q1", "o1", "c1"), "conflicto_idempotencia", "otra opción");
  await sin(bd, () => resp(bd.c, s.id, EA, "q2", "o2", "c1"), "conflicto_idempotencia", "otra pregunta");
  const s2 = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" });
  await sin(bd, () => resp(bd.c, s2.id, EA, "q1", "o2", "c1"), "conflicto_idempotencia", "otra sesión");
}));
await caso("ID2", "envíos simultáneos del mismo identificador: una sola respuesta efectiva", () => conBase(async (bd) => {
  await politica(bd.x);
  const s = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" });
  const clientes = Array.from({ length: 5 }, () => bd.nueva());
  const res = await Promise.allSettled(clientes.map((k) => resp(k, s.id, EA, "q1", "o2", "c-igual")));
  const ok = res.filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof resp>>> => r.status === "fulfilled");
  for (const r of res) if (r.status === "rejected") assert.ok(r.reason instanceof PracticaError && r.reason.codigo === "reintente", String(r.reason));
  assert.ok(ok.length >= 1, "al menos un envío termina");
  assert.equal(await n(bd.c, "practice_answers"), 1); assert.equal(await n(bd.c, "knowledge_evidence"), 1);
  assert.equal(new Set(ok.map((r) => r.value.respuestaId)).size, 1, "todos reciben la misma respuesta");
  assert.equal(ok.filter((r) => !r.value.duplicada).length <= 1, true);
  // reintentado después, siempre resuelve al original
  const otra = await resp(bd.c, s.id, EA, "q1", "o2", "c-igual"); assert.equal(otra.duplicada, true);
}));
await caso("CO1", "respuestas simultáneas del mismo estudiante: secuencias únicas, evidencia 1:1 y proyección reconstruible", () => conBase(async (bd) => {
  await politica(bd.x);
  const s = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" });
  const clientes = Array.from({ length: 4 }, () => bd.nueva());
  const trabajos = [["q1", "o2"], ["q2", "o2"], ["q3", "o1"], ["q1", "o1"], ["q2", "o1"], ["r1", "o2"]].map(([q, o], i) => resp(clientes[i % 4], s.id, EA, q, o, `c${i}`));
  const res = await Promise.allSettled(trabajos);
  for (const r of res) if (r.status === "rejected") assert.ok(r.reason instanceof PracticaError && r.reason.codigo === "reintente", String(r.reason));
  const ok = res.filter((r) => r.status === "fulfilled").length;
  assert.ok(ok >= 1);
  assert.equal(await n(bd.c, "practice_answers"), ok); assert.equal(await n(bd.c, "knowledge_evidence"), ok);
  const seq = (await bd.x("SELECT sequence_no FROM practice_answers ORDER BY sequence_no")).rows.map((r) => Number(r.sequence_no));
  assert.deepEqual(seq, Array.from({ length: ok }, (_, i) => i + 1), "secuencias contiguas y únicas");
  assert.equal((await compararProyeccion(bd.c, EA, 4e9)).iguales, true, "la proyección coincide con la reconstrucción");
}));

await caso("AT1", "atomicidad con fallos forzados: ninguna sentencia del lote deja rastro y la secuencia no se consume", () => conBase(async (bd) => {
  await politica(bd.x);
  const s = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" });
  for (const [trig, evento] of [["knowledge_evidence", "INSERT"], ["knowledge_state_events", "INSERT"], ["student_knowledge_state", "INSERT"]] as const) {
    await bd.x(`CREATE TRIGGER fallo_t BEFORE ${evento} ON ${trig} BEGIN SELECT RAISE(ABORT, 'fallo forzado en ${trig}'); END`);
    const antes = await huella(bd.c);
    await assert.rejects(resp(bd.c, s.id, EA, "q1", "o2", `c-${trig}`), new RegExp(`fallo forzado en ${trig}`));
    assert.equal(await huella(bd.c), antes, `fallo en ${trig}: nada quedó escrito`);
    await bd.x("DROP TRIGGER fallo_t");
  }
  const ok = await resp(bd.c, s.id, EA, "q1", "o2", "c-ok");
  assert.equal(ok.secuencia, 1, "los fallos no consumieron secuencia");
  await bd.x("CREATE TRIGGER fallo_u BEFORE UPDATE ON student_knowledge_state BEGIN SELECT RAISE(ABORT, 'fallo forzado en la actualización'); END");
  const antes = await huella(bd.c);
  await assert.rejects(resp(bd.c, s.id, EA, "q2", "o2", "c-2"), /fallo forzado en la actualización/);
  assert.equal(await huella(bd.c), antes, "fallo al actualizar la proyección: ni respuesta ni evidencia ni evento");
}));
await caso("GU1", "guarda de concurrencia: una respuesta concurrente del contenido invalida el intento, que no escribe y se reintenta", () => conBase(async (bd) => {
  await politica(bd.x);
  const s = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" });
  const otro = bd.nueva();
  let interferencias = 0;
  const competidor = async () => { interferencias++; await otro.execute({ sql: `INSERT INTO practice_answers (${RCOLS.join(", ")}) SELECT 'comp' || ?, ?, ?, 'practica', 'd1-v1', 'q3', 'f3', 'i1', 'practica', 'o2', 1, 'ninguna', NULL, 'cc' || ?, ?, (SELECT COALESCE(MAX(sequence_no),0)+1 FROM practice_answers WHERE student_id = ?), '2027-03-01'`,
    args: [interferencias, s.id, EA, interferencias, 1000 + interferencias, EA] }); };
  const envuelto = (veces: number) => { let k = 0; return { execute: bd.c.execute.bind(bd.c), batch: async (...a: Parameters<Client["batch"]>) => { if (k++ < veces) await competidor(); return bd.c.batch(...a); } } as unknown as Client; };
  const r = await registrarRespuesta(envuelto(1), { estudiante: EA, sesionId: s.id, preguntaVersionId: "q1", opcionId: "o2", clientSubmissionId: "c1" });
  assert.equal(r.secuencia, 2, "el primer intento no escribió; el segundo quedó detrás del competidor");
  assert.equal(await n(bd.c, "practice_answers"), 2); assert.equal(await n(bd.c, "knowledge_evidence"), 1);
  interferencias = 0;
  const antes = (await bd.x("SELECT COUNT(*) AS n FROM practice_answers WHERE client_submission_id = 'c2'")).rows[0].n;
  await assert.rejects(registrarRespuesta(envuelto(99), { estudiante: EA, sesionId: s.id, preguntaVersionId: "q2", opcionId: "o2", clientSubmissionId: "c2" }), (e: unknown) => e instanceof PracticaError && e.codigo === "reintente");
  assert.equal(interferencias, 3, "se intentó el máximo de veces (3)"); assert.equal(MAX_INTENTOS, 3);
  assert.equal(Number((await bd.x("SELECT COUNT(*) AS n FROM practice_answers WHERE client_submission_id = 'c2'")).rows[0].n), Number(antes), "agotados los intentos, nada de la respuesta quedó escrito");
  assert.equal(await n(bd.c, "knowledge_evidence"), 1);
}));

// Guion completo sobre dos bases construidas desde cero: mismos resultados, sin depender de ids ni de fechas.
const guion = async (plantilla: string) => {
  const bd = abrir(plantilla);
  try {
    await politica(bd.x);
    const s = await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" });
    const salidaGuion: unknown[] = [];
    for (const [q, o, csid] of [["q1", "o2", "g1"], ["q1", "o2", "g1"], ["q2", "o2", "g2"], ["q3", "o1", "g3"], ["r1", "o1", "g4"]]) {
      const r = await resp(bd.c, s.id, EA, q, o, csid); salidaGuion.push([r.correcta, r.secuencia, r.duplicada, r.estado]);
    }
    const p = (await bd.x("SELECT item_id, state, flag, uncertainty_reason FROM student_knowledge_state ORDER BY item_id")).rows.map((x) => JSON.stringify(Object.values(x)));
    return JSON.stringify([salidaGuion, p, await cuentas(bd.c)]);
  } finally { bd.cerrar(); }
};
await caso("SEG", "el mismo guion en dos bases construidas desde cero, y repetido, da los mismos resultados", async () => {
  const a = await guion(PA), b = await guion(PB), a2 = await guion(PA);
  assert.equal(a, b); assert.equal(a, a2);
});

fs.rmSync(RAIZ, { recursive: true, force: true });
console.log(salida.join("\n"));
console.log(`practica: ok (${casos} casos)`);
await liberarNativos();
