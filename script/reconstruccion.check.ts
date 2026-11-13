// IMP-033 (H3a): reconstrucción, comparación y reparación de la proyección (D9). Ejecutar: npm run check:vortice
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

// ── IMP-033: reconstrucción, comparación y reparación de la proyección (D9) ────────────────────────────
import { compararProyeccion, rehacerProyeccion, reconstruir, respuestasSinEvidencia, retiradasPorDefectoSinAnular } from "../server/reconstruccion";
import { leerProyeccion } from "../server/conocimiento";
import { iniciarSesion, registrarRespuesta } from "../server/practica";

const PA = await construirPlantilla("A"); await liberarNativos();
const PB = await construirPlantilla("B"); await liberarNativos();   // segunda base, construida desde cero
const conBase = async (f: (bd: ReturnType<typeof abrir>) => Promise<void>, plantilla = PA) => { const bd = abrir(plantilla); try { await f(bd); } finally { bd.cerrar(); } };
const T = 4e9;
const resp = (bd: ReturnType<typeof abrir>, ses: string, est: string, qv: string, opt: string, csid: string) =>
  registrarRespuesta(bd.c, { estudiante: est, sesionId: ses, preguntaVersionId: qv, opcionId: opt, clientSubmissionId: csid });
// Guion: EA responde en i1 (q1 ok, q2 ok, q3 mal) y en i2 (r1 ok); EB en i1 (q1 ok). Devuelve los ids de evidencia de EA.
async function jugar(bd: ReturnType<typeof abrir>) {
  await politica(bd.x);
  const sa = (await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" })).id, sb = (await iniciarSesion(bd.c, { estudiante: EB, dominioId: "d1", proposito: "practica" })).id;
  const e = [(await resp(bd, sa, EA, "q1", "o2", "a1")).evidenciaId, (await resp(bd, sa, EA, "q2", "o2", "a2")).evidenciaId, (await resp(bd, sa, EA, "q3", "o1", "a3")).evidenciaId, (await resp(bd, sa, EA, "r1", "o2", "a4")).evidenciaId];
  await resp(bd, sb, EB, "q1", "o2", "b1");
  return { sa, sb, e };
}
const SOLO_HISTORIA = ["knowledge_evidence", "knowledge_state_events", "practice_answers", "evidence_voids"];

await caso("RC1", "D9: la proyección escrita por el servicio es igual a su reconstrucción; la reconstrucción es determinista", () => conBase(async (bd) => {
  await jugar(bd);
  for (const est of [EA, EB]) {
    const c = await compararProyeccion(bd.c, est, T);
    assert.deepEqual([c.iguales, c.diferencias, c.politicaEjecutable, c.sinContexto], [true, [], true, []], est);
  }
  const r1 = await reconstruir(bd.c, EA, T), r2 = await reconstruir(bd.c, EA, T);
  assert.equal(JSON.stringify(r1), JSON.stringify(r2));
  assert.deepEqual(r1.filas.map((f) => [f.itemId, f.state, f.flag]), [["i1", "dominado", "por_comprobar"], ["i2", "incierto", null]]);
  const almacenado = await leerProyeccion(bd.c, EA);
  assert.deepEqual(almacenado.map(({ updatedAt, ...f }) => f), r1.filas, "campo por campo, salvo updated_at (control)");
}));
await caso("RC2", "manipular la proyección: la comparación lista cada diferencia y rehacer la repara sin tocar historia ni eventos", () => conBase(async (bd) => {
  await jugar(bd);
  const historia = await huella(bd.c, SOLO_HISTORIA);
  await bd.x("UPDATE student_knowledge_state SET state = 'no_dominado', flag = NULL, uncertainty_reason = 'contradictoria', computed_through = 1 WHERE student_id = ? AND item_id = 'i1'", [EA]);
  await bd.x("DELETE FROM student_knowledge_state WHERE student_id = ? AND item_id = 'i2'", [EA]);
  const c = await compararProyeccion(bd.c, EA, T);
  assert.equal(c.iguales, false);
  assert.deepEqual(c.diferencias.map((d) => `${d.itemId}.${d.campo}`).sort(), ["i1.computedThrough", "i1.flag", "i1.state", "i1.uncertaintyReason", "i2.fila"]);
  const antes = await huella(bd.c, SOLO_HISTORIA);
  const r = await rehacerProyeccion(bd.c, EA, T);
  assert.deepEqual([r.escritas, r.politicaEjecutable], [2, true]);
  assert.equal(await huella(bd.c, SOLO_HISTORIA), antes, "rehacer no toca respuestas, evidencia, eventos ni anulaciones");
  assert.equal(await huella(bd.c, SOLO_HISTORIA), historia);
  assert.equal(await n(bd.c, "knowledge_state_events"), 5, "ni emite ni reescribe eventos (3 de i1, 1 de i2, 1 de EB)");
  assert.equal((await compararProyeccion(bd.c, EA, T)).iguales, true);
  const dos = await rehacerProyeccion(bd.c, EA, T); assert.equal(dos.escritas, 2);   // idempotente
  assert.equal((await compararProyeccion(bd.c, EA, T)).iguales, true);
  assert.equal((await compararProyeccion(bd.c, EB, T)).iguales, true, "no tocó a otro estudiante");
}));
await caso("RC3", "anulación de evidencia: la reconstrucción la excluye, la comparación detecta la proyección vieja y rehacer la corrige; la evidencia se conserva", () => conBase(async (bd) => {
  const { e } = await jugar(bd);
  await bd.x("INSERT INTO evidence_voids (id, evidence_id, reason, requested_by, approved_by, at) VALUES ('v1', ?, 'defecto', ?, ?, 5)", [e[0], AU, VA]);   // se anula la evidencia de f1
  const rec = await reconstruir(bd.c, EA, T);
  assert.deepEqual(rec.filas.find((f) => f.itemId === "i1")!.state, "incierto", "ya no hay dos familias válidas con acierto");
  const c = await compararProyeccion(bd.c, EA, T);
  assert.ok(!c.iguales && c.diferencias.some((d) => d.itemId === "i1" && d.campo === "state" && d.almacenado === "dominado" && d.reconstruido === "incierto"), JSON.stringify(c.diferencias));
  const evBefore = await n(bd.c, "knowledge_evidence"), evt = await n(bd.c, "knowledge_state_events");
  await rehacerProyeccion(bd.c, EA, T);
  assert.equal(await n(bd.c, "knowledge_evidence"), evBefore, "la evidencia anulada se conserva"); assert.equal(await n(bd.c, "knowledge_state_events"), evt, "sin evento de anulación (es de H3b)");
  assert.equal((await compararProyeccion(bd.c, EA, T)).iguales, true);
  assert.equal(String((await bd.x("SELECT state FROM student_knowledge_state WHERE student_id = ? AND item_id = 'i1'", [EA])).rows[0].state), "incierto");
  // Anular todo lo de un contenido: queda `sin_evidencia`, con la evidencia intacta.
  await bd.x("INSERT INTO evidence_voids (id, evidence_id, reason, requested_by, approved_by, at) VALUES ('v2', ?, 'defecto', ?, ?, 5)", [e[3], AU, VA]);
  await rehacerProyeccion(bd.c, EA, T);
  const i2 = (await bd.x("SELECT state, flag, uncertainty_reason, last_evidence_at FROM student_knowledge_state WHERE student_id = ? AND item_id = 'i2'", [EA])).rows[0];
  assert.deepEqual([i2.state, i2.flag, i2.uncertainty_reason, i2.last_evidence_at], ["sin_evidencia", null, null, null]);
}));
await caso("RC4", "sin política ejecutable: no se compara ni se repara; no se escribe nada", () => conBase(async (bd) => {
  const sa = (await iniciarSesion(bd.c, { estudiante: EA, dominioId: "d1", proposito: "practica" })).id;
  await resp(bd, sa, EA, "q1", "o2", "a1");
  const antes = await huella(bd.c);
  const c = await compararProyeccion(bd.c, EA, T);
  assert.deepEqual([c.politicaEjecutable, c.iguales, c.diferencias], [false, true, []]);
  assert.deepEqual(await rehacerProyeccion(bd.c, EA, T), { escritas: 0, politicaEjecutable: false });
  assert.equal(await huella(bd.c), antes);
  // Aprobada la política, la reconstrucción puebla la proyección desde la evidencia conservada.
  await politica(bd.x);
  assert.equal((await compararProyeccion(bd.c, EA, T)).iguales, false);
  await rehacerProyeccion(bd.c, EA, T);
  assert.equal((await compararProyeccion(bd.c, EA, T)).iguales, true);
  assert.equal(await n(bd.c, "knowledge_state_events"), 0, "rehacer no inventa eventos del pasado");
}));
await caso("RC5", "cambio de política: la comparación lo detecta y rehacer recalcula con la vigente, sin tocar eventos", () => conBase(async (bd) => {
  await jugar(bd);
  await politica(bd.x, "pol2", 2, { ...POL_BASE, demote_wrong_families: 1 });   // un error ya baja a incierto
  const c = await compararProyeccion(bd.c, EA, T);
  assert.ok(c.diferencias.some((d) => d.campo === "policyId" && d.reconstruido === "pol2"), JSON.stringify(c.diferencias));
  const evt = await n(bd.c, "knowledge_state_events");
  await rehacerProyeccion(bd.c, EA, T);
  assert.equal((await compararProyeccion(bd.c, EA, T)).iguales, true);
  const f = (await bd.x("SELECT state, uncertainty_reason, policy_id FROM student_knowledge_state WHERE student_id = ? AND item_id = 'i1'", [EA])).rows[0];
  assert.deepEqual([f.state, f.uncertainty_reason, f.policy_id], ["incierto", "contradictoria", "pol2"]);
  assert.equal(await n(bd.c, "knowledge_state_events"), evt, "el cambio de política es de H3b");
}));
await caso("RC6", "contenido sin versión publicada: se informa como sin contexto, no como diferencia", () => conBase(async (bd) => {
  await jugar(bd);
  await bd.x("UPDATE knowledge_domain_versions SET status = 'retirada' WHERE id = 'd1-v1'");
  const c = await compararProyeccion(bd.c, EA, T);
  assert.deepEqual([c.iguales, c.sinContexto], [true, ["i1", "i2"]]);
  const antes = await huella(bd.c);
  assert.equal((await rehacerProyeccion(bd.c, EA, T)).escritas, 0); assert.equal(await huella(bd.c), antes);
}));
await caso("RC7", "`ahora` acota lo reconstruido; una fila almacenada sin evidencia se informa y no se borra", () => conBase(async (bd) => {
  await jugar(bd);
  const c = await compararProyeccion(bd.c, EA, 0);
  assert.deepEqual(c.diferencias.map((d) => `${d.itemId}.${d.campo}`).sort(), ["i1.fila", "i2.fila"]);
  await bd.x("INSERT INTO users (id, email) VALUES ('est-c', 'c@f.test')");
  await bd.x("INSERT INTO student_knowledge_state (student_id, item_id, state, flag, uncertainty_reason, last_evidence_at, policy_id, domain_version_id, computed_through, updated_at) VALUES ('est-c', 'i1', 'dominado', NULL, NULL, 1, 'pol1', 'd1-v1', 1, 1)");
  const huerfana = await compararProyeccion(bd.c, "est-c", T);
  assert.equal(huerfana.diferencias.length, 1);
  assert.deepEqual(await rehacerProyeccion(bd.c, "est-c", T), { escritas: 0, politicaEjecutable: true });
  assert.equal(await n(bd.c, "student_knowledge_state", "student_id = 'est-c'"), 1, "reparar no borra filas: la limitación se informa");
}));
await caso("RC8", "detectores accesibles desde la reconstrucción y de solo lectura", () => conBase(async (bd) => {
  await jugar(bd);
  const antes = await huella(bd.c);
  assert.deepEqual(await respuestasSinEvidencia(bd.c), []); assert.deepEqual(await retiradasPorDefectoSinAnular(bd.c), []);
  assert.equal(await huella(bd.c), antes);
}));
await caso("RC9", "el mismo guion en dos bases construidas desde cero reconstruye lo mismo", async () => {
  const salidas: string[] = [];
  for (const p of [PA, PB, PA]) await conBase(async (bd) => {
    await jugar(bd); const r = await reconstruir(bd.c, EA, T);
    salidas.push(JSON.stringify([r.filas.map(({ computedThrough, lastEvidenceAt, ...f }) => f), (await compararProyeccion(bd.c, EA, T)).iguales, await n(bd.c, "knowledge_state_events")]));
  }, p);
  assert.equal(salidas[0], salidas[1]); assert.equal(salidas[0], salidas[2]);
});

fs.rmSync(RAIZ, { recursive: true, force: true });
console.log(salida.join("\n"));
console.log(`reconstruccion: ok (${casos} casos)`);
await liberarNativos();
