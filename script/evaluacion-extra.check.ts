// Intento extra desde la base: cargador del banco, armado, respuesta, envío y subtemas por item.
// Ejecutar: npm run check:vortice

import assert from "node:assert/strict";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import type { Client, InArgs } from "@libsql/client";
import { crearClienteDb } from "../server/cliente"; import { assertBaseLocal } from "../server/dbGuard"; import { migrar } from "../server/migrar";
import { baseArchivo } from "./lib/basePrueba";
import { aplicarEsquemaHeredado, sembrarFicticios } from "./lib/esquemaHeredado";

if (process.env.NODE_ENV === "production") throw new Error("este check no debe correr con NODE_ENV=production");

const AU = "ficticio-autor", VA = "ficticio-validador";
const EST = "est-a";
const OPC = JSON.stringify([{ id: "o1", texto: "Uno" }, { id: "o2", texto: "Dos" }]);
const SEG_POR_HORA = 3600;
type X = (sql: string, args?: InArgs) => ReturnType<Client["execute"]>;

// ——— Helpers idénticos a evaluacion-db.check.ts ———
async function preguntaEval(x: X, id: string, fam: string, item: string, version = 1) {
  if (!(await x("SELECT 1 FROM question_families WHERE id = ?", [fam])).rows.length)
    await x("INSERT INTO question_families (id, item_id, bank) VALUES (?, ?, 'evaluacion')", [fam, item]);
  await x("INSERT INTO question_versions (id, family_id, item_id, bank, version, status, stem, options_json, correct_option_id, origin, authored_by) VALUES (?, ?, ?, 'evaluacion', ?, 'borrador', 'Enunciado', ?, 'o2', 'humano', ?)", [id, fam, item, version, OPC, AU]);
  await x("UPDATE question_versions SET status = 'en_revision' WHERE id = ?", [id]);
  await x("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = ?", [VA, id]);
}

async function versionEval(x: X, id = "ev-v1", evalId = "me-e2", version = 1) {
  await x("INSERT INTO evaluation_versions (id, evaluation_id, version, status, created_by) VALUES (?, ?, ?, 'borrador', ?)", [id, evalId, version, AU]);
  await x("UPDATE evaluation_versions SET status = 'validada', validated_by = ?, validated_at = 1 WHERE id = ?", [VA, id]);
}

async function sembrarEval(x: X) {
  await x("INSERT INTO users (id, email) VALUES ('est-a', 'a@ficticio.test')");
  await x("INSERT INTO module_evaluations (id, learning_objective_id, evaluation_number, title, release_day, release_week, passing_score) VALUES ('me-e2', 'lo-mat', 2, 'E2 Fracciones', 5, 2, 70)");
}

async function dominioPublicado(x: X, dom: string, items: string[]) {
  await x("INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES (?, 'ls-mat-5b', ?)", [dom, dom]);
  await x("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES (?, ?, 1, 'borrador', ?)", [dom + "-v1", dom, AU]);
  for (const it of items) {
    await x("INSERT INTO knowledge_items (id, domain_id, code) VALUES (?, ?, ?)", [it, dom, "COD-" + it]);
    await x("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES (?, ?, ?, ?, 'n', 'd')", [it + "-iv", it, dom + "-v1", dom]);
    await x("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES (?, 'oa1')", [it + "-iv"]);
  }
  await x("UPDATE knowledge_domain_versions SET status = 'en_revision' WHERE id = ?", [dom + "-v1"]);
  await x("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = ? WHERE id = ?", [VA, dom + "-v1"]);
}

const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), "t35-"));

// Plantilla: misma estructura que evaluacion-db.check.ts pero con 9 preguntas (3 subtemas).

import { abrirProceso, iniciarIntento, responder, enviarIntento, cargarBancoExtra, preguntasDelIntento, ErrorEvaluacion } from "../server/evaluacion";
import { armarExtra } from "../shared/armador";

// Plantilla: 3 subtemas (i1..i3), prueba normal de 9 (3 por subtema), banco extra de 15 (5 por subtema).
async function plantilla(poolPorItem: number): Promise<string> {
  const b = baseArchivo(); const c = b.client; const x: X = (s, a = []) => c.execute({ sql: s, args: a });
  await aplicarEsquemaHeredado(c); await sembrarFicticios(c); await migrar(c, "migrations/vortice");
  await x("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa1','ls-mat-5b','M1','t','https://e.test',2018)");
  await sembrarEval(x);
  await dominioPublicado(x, "d1", ["i1", "i2", "i3"]);
  for (let k = 1; k <= 9; k++) await preguntaEval(x, "qe" + k, "ef" + k, "i" + (Math.floor((k - 1) / 3) + 1));
  for (let k = 1; k <= poolPorItem * 3; k++) await preguntaEval(x, "qx" + k, "fx" + k, "i" + (((k - 1) % 3) + 1));
  await versionEval(x);
  for (let k = 1; k <= 9; k++) await x("INSERT INTO evaluation_version_questions (evaluation_version_id, question_version_id, family_id, item_id, bank, position) VALUES ('ev-v1', ?, ?, ?, 'evaluacion', ?)", ["qe" + k, "ef" + k, "i" + (Math.floor((k - 1) / 3) + 1), k - 1]);
  const f = path.join(RAIZ, "p" + poolPorItem + ".db"); fs.copyFileSync(b.url.replace(/^file:/, ""), f); await b.cerrar(); return f;
}

const abrir = (plantilla: string) => {
  const carpeta = fs.mkdtempSync(path.join(RAIZ, "b-")); const f = path.join(carpeta, "base.db"); fs.copyFileSync(plantilla, f);
  const url = "file:" + f; assertBaseLocal(process.env, url);
  const abiertos: Client[] = [];
  const c = crearClienteDb(url); abiertos.push(c);
  return { c, x: ((s: string, a: InArgs = []) => c.execute({ sql: s, args: a })) as X, cerrar: () => { for (const k of abiertos) k.close(); fs.rmSync(carpeta, { recursive: true, force: true }); } };
};

const salida: string[] = [];
let casos = 0;
const caso = async (id: string, nombre: string, f: () => Promise<void>) => {
  try {
    await f();
    casos++;
    salida.push("  \u2713 " + id.padEnd(6) + " " + nombre);
  } catch (e) {
    casos++;
    salida.push("  \u2717 " + id.padEnd(6) + " " + nombre + ": " + (e as Error).message);
    process.exitCode = 1;
  }
};


const P = await plantilla(5), PCHICA = await plantilla(1);

// Normal con las 3 de i1 mal y el resto bien; devuelve el intento enviado.
async function normalFallandoI1(bd: ReturnType<typeof abrir>, responderTodas = true) {
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });
  const n = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "normal" });
  for (let k = 1; k <= (responderTodas ? 9 : 6); k++) await responder(bd.c, { intentoId: n.intentoId, estudianteId: EST, preguntaVersionId: "qe" + k, opcionId: k <= 3 ? "o1" : "o2" });
  const env = await enviarIntento(bd.c, { intentoId: n.intentoId, estudianteId: EST });
  return { proc, n, env };
}

await caso("X1", "cargarBancoExtra: aprobadas del banco de evaluación, subtema = item", async () => {
  const bd = abrir(P); try {
    const b = await cargarBancoExtra(bd.c, "ev-v1");
    assert.equal(b.length, 9 + 15);
    assert.ok(b.every((q) => /^i[123]$/.test(q.subtemaId)));
    assert.equal(b.find((q) => q.id === "qe1")?.subtemaId, "i1");
  } finally { bd.cerrar(); }
});
await caso("X2", "normal reprobado en i1: subtema fallado = item, no familia", async () => {
  const bd = abrir(P); try {
    const { env } = await normalFallandoI1(bd);
    assert.equal(env.aprobado, false); assert.deepEqual(env.subtemasFallados, ["i1"]);
  } finally { bd.cerrar(); }
});
await caso("X3", "extra desde la base: 9 preguntas, ninguna del normal, ≥35 % de i1, determinista", async () => {
  const bd = abrir(P); try {
    const { proc } = await normalFallandoI1(bd);
    const e = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "extra", semilla: "s1" });
    assert.equal(e.preguntas.length, 9);
    assert.ok(e.preguntas.every((id) => !/^qe/.test(id)), "repite del normal");
    const banco = await cargarBancoExtra(bd.c, "ev-v1");
    const deI1 = e.preguntas.filter((id) => banco.find((q) => q.id === id)?.subtemaId === "i1").length;
    assert.ok(deI1 >= Math.ceil(9 * 0.35), "i1 insuficiente: " + deI1);
    const otra = armarExtra({ banco, normal: ["qe1","qe2","qe3","qe4","qe5","qe6","qe7","qe8","qe9"], fallados: ["i1"], N: 9, semilla: "s1" });
    assert.deepEqual([...e.preguntas], [...otra]);
  } finally { bd.cerrar(); }
});
await caso("X4", "extra: responde sus preguntas, no las del normal; total = 9 del extra; aprobar cierra aprobado", async () => {
  const bd = abrir(P); try {
    const { proc } = await normalFallandoI1(bd);
    const e = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "extra" });
    await assert.rejects(responder(bd.c, { intentoId: e.intentoId, estudianteId: EST, preguntaVersionId: "qe1", opcionId: "o2" }), (er: any) => er instanceof ErrorEvaluacion && er.codigo === "pregunta_no_pertenece_version");
    assert.deepEqual((await preguntasDelIntento(bd.c, e.intentoId)).map((q) => q.id), [...e.preguntas]);
    for (const id of e.preguntas) await responder(bd.c, { intentoId: e.intentoId, estudianteId: EST, preguntaVersionId: id, opcionId: "o2" });
    const env = await enviarIntento(bd.c, { intentoId: e.intentoId, estudianteId: EST });
    assert.equal(env.totalQuestions, 9); assert.equal(env.totalCorrect, 9); assert.equal(env.aprobado, true);
  } finally { bd.cerrar(); }
});
await caso("X5", "normal con preguntas sin responder: no se repiten en el extra y su subtema cuenta como fallado", async () => {
  const bd = abrir(P); try {
    const { proc, env } = await normalFallandoI1(bd, false); // qe7..qe9 (i3) sin responder
    assert.deepEqual([...env.subtemasFallados].sort(), ["i1", "i3"]);
    const e = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "extra" });
    assert.ok(e.preguntas.every((id) => !/^qe/.test(id)));
  } finally { bd.cerrar(); }
});
await caso("X6", "banco chico: capacidad_insuficiente como ErrorEvaluacion", async () => {
  const bd = abrir(PCHICA); try {
    const { proc } = await normalFallandoI1(bd);
    await assert.rejects(iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "extra" }), (er: any) => er instanceof ErrorEvaluacion && er.codigo === "capacidad_insuficiente");
  } finally { bd.cerrar(); }
});
await caso("X7", "banco: preguntas no aprobadas no entran", async () => {
  const bd = abrir(P); try {
    await bd.x("UPDATE question_versions SET status = 'retirada', retired_kind = 'otro', retired_reason = 'x', retired_by = ?, retired_at = 2 WHERE id = 'qx1'", [VA]);
    assert.ok(!(await cargarBancoExtra(bd.c, "ev-v1")).some((q) => q.id === "qx1"));
  } finally { bd.cerrar(); }
});

fs.rmSync(RAIZ, { recursive: true, force: true });
console.log(salida.join("\n"));
console.log("evaluacion-extra: ok (" + casos + " casos)");
