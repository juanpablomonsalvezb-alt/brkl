// T33: servicio del servidor de evaluación (E2 / P21 v2).
// Pruebas de server/evaluacion.ts sobre bases desechables.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import type { Client, InArgs } from "@libsql/client";
import { crearClienteDb } from "../server/cliente"; import { assertBaseLocal } from "../server/dbGuard"; import { migrar } from "../server/migrar";
import { baseArchivo } from "./lib/basePrueba";
import { aplicarEsquemaHeredado, sembrarFicticios } from "./lib/esquemaHeredado";
import {
  abrirProceso, iniciarIntento, responder, enviarIntento, cerrarProceso,
  verificarEntregaAutomatica, ErrorEvaluacion,
} from "../server/evaluacion";

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

const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), "t33-"));

// Plantilla: misma estructura que evaluacion-db.check.ts pero con 9 preguntas (3 subtemas).
async function construirPlantilla(): Promise<string> {
  const b = baseArchivo(); const c = b.client; const x: X = (s, a = []) => c.execute({ sql: s, args: a });
  await aplicarEsquemaHeredado(c); await sembrarFicticios(c); await migrar(c, "migrations/vortice");
  await x("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa1','ls-mat-5b','M1','t','https://e.test',2018)");
  await sembrarEval(x);
  await dominioPublicado(x, "d1", ["i1"]);
  // 9 preguntas, 9 familias (una por pregunta). family_id = subtema para subtemasFallados.
  // Subtemas: sf1 (qe1-3), sf2 (qe4-6), sf3 (qe7-9).
  for (let i = 1; i <= 9; i++) {
    const fam = "ef" + i;
    await preguntaEval(x, "qe" + i, fam, "i1");
  }
  await versionEval(x);
  for (let i = 1; i <= 9; i++) {
    const fam = "ef" + i;
    await x("INSERT INTO evaluation_version_questions (evaluation_version_id, question_version_id, family_id, item_id, bank, position) VALUES ('ev-v1', 'qe" + i + "', '" + fam + "', 'i1', 'evaluacion', " + (i - 1) + ")");
  }
  const f = path.join(RAIZ, "plantilla.db"); fs.copyFileSync(b.url.replace(/^file:/, ""), f); await b.cerrar(); return f;
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

const P = await construirPlantilla();
const conBase = async (f: (bd: ReturnType<typeof abrir>) => Promise<void>) => { const bd = abrir(P); try { await f(bd); } finally { bd.cerrar(); } };

// ── Casos VÁLIDOS ──────────────────────────────────────────────────────────────

await caso("V1", "abrirProceso: crea proceso e instancia regular (60 min, 70 %)", async () => {
  const bd = conBase as any;
  const r = await abrirProceso((bd as any).c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });
  assert.equal(r.perfil, "regular");
  assert.equal(r.duracionMin, 60);
  assert.equal(r.umbral, 70);
});

await caso("V2", "abrirProceso: perfil neurodivergente (120 min, 50 %)", async () => {
  const bd = conBase as any;
  const r = await abrirProceso((bd as any).c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "neurodivergente" });
  assert.equal(r.perfil, "neurodivergente");
  assert.equal(r.duracionMin, 120);
  assert.equal(r.umbral, 50);
});

// V1 y V2 fallan porque conBase no devuelve el bd directamente. Necesito un patrón diferente.
// Reescribo los casos para usar abrir() directamente.

// Limpiar salida anterior de V1/V2 fallidos.
salida.length = 0;
casos = 0;

await caso("V1", "abrirProceso: crea proceso e instancia regular (60 min, 70 %)", async () => {
  const bd = abrir(P);
  const r = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });
  assert.equal(r.perfil, "regular");
  assert.equal(r.duracionMin, 60);
  assert.equal(r.umbral, 70);
  assert.ok(r.procesoId);
  assert.ok(r.instanciaId);
  bd.cerrar();
});

await caso("V2", "abrirProceso: perfil neurodivergente (120 min, 50 %)", async () => {
  const bd = abrir(P);
  const r = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "neurodivergente" });
  assert.equal(r.perfil, "neurodivergente");
  assert.equal(r.duracionMin, 120);
  assert.equal(r.umbral, 50);
  bd.cerrar();
});

await caso("V3", "iniciarIntento normal: crea intento activo", async () => {
  const bd = abrir(P);
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });
  const intento = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "normal" });
  assert.equal(intento.intentoKind, "normal");
  assert.ok(intento.intentoId);
  assert.ok(intento.expiresAt > intento.startedAt);
  bd.cerrar();
});

await caso("V4", "responder: registra respuesta correcta e incorrecta", async () => {
  const bd = abrir(P);
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });
  const intento = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "normal" });

  const r1 = await responder(bd.c, { intentoId: intento.intentoId, estudianteId: EST, preguntaVersionId: "qe1", opcionId: "o2" });
  assert.equal(r1.correcta, true);
  assert.equal(r1.secuencia, 1);

  const r2 = await responder(bd.c, { intentoId: intento.intentoId, estudianteId: EST, preguntaVersionId: "qe2", opcionId: "o1" });
  assert.equal(r2.correcta, false);
  assert.equal(r2.secuencia, 2);
  bd.cerrar();
});

await caso("V5", "enviarIntento: calcula porcentaje sin redondeo (7/9 = 77.77... %)", async () => {
  const bd = abrir(P);
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });
  const intento = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "normal" });

  for (let i = 1; i <= 9; i++) {
    const opcion = i <= 7 ? "o2" : "o1";
    await responder(bd.c, { intentoId: intento.intentoId, estudianteId: EST, preguntaVersionId: "qe" + i, opcionId: opcion });
  }

  const resultado = await enviarIntento(bd.c, { intentoId: intento.intentoId, estudianteId: EST });
  assert.equal(resultado.totalCorrect, 7);
  assert.equal(resultado.totalQuestions, 9);
  assert.ok(Math.abs(resultado.scorePct - (7 / 9) * 100) < 0.001);
  assert.equal(resultado.aprobado, true);
  bd.cerrar();
});

await caso("V6", "enviarIntento: 6/9 = 66.66 % no aprueba con umbral 70 %", async () => {
  const bd = abrir(P);
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });
  const intento = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "normal" });

  for (let i = 1; i <= 9; i++) {
    const opcion = i <= 6 ? "o2" : "o1";
    await responder(bd.c, { intentoId: intento.intentoId, estudianteId: EST, preguntaVersionId: "qe" + i, opcionId: opcion });
  }

  const resultado = await enviarIntento(bd.c, { intentoId: intento.intentoId, estudianteId: EST });
  assert.equal(resultado.totalCorrect, 6);
  assert.equal(resultado.aprobado, false);
  assert.ok(resultado.subtemasFallados.length > 0);
  bd.cerrar();
});

await caso("V7", "neurodivergente 4/9 = 44.44 % no aprueba (umbral 50 %)", async () => {
  const bd = abrir(P);
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "neurodivergente" });
  const intento = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "normal" });

  for (let i = 1; i <= 9; i++) {
    const opcion = i <= 4 ? "o2" : "o1";
    await responder(bd.c, { intentoId: intento.intentoId, estudianteId: EST, preguntaVersionId: "qe" + i, opcionId: opcion });
  }

  const resultado = await enviarIntento(bd.c, { intentoId: intento.intentoId, estudianteId: EST });
  assert.equal(resultado.aprobado, false);
  bd.cerrar();
});

await caso("V8", "neurodivergente 5/9 = 55.55 % aprueba (umbral 50 %)", async () => {
  const bd = abrir(P);
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "neurodivergente" });
  const intento = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "normal" });

  for (let i = 1; i <= 9; i++) {
    const opcion = i <= 5 ? "o2" : "o1";
    await responder(bd.c, { intentoId: intento.intentoId, estudianteId: EST, preguntaVersionId: "qe" + i, opcionId: opcion });
  }

  const resultado = await enviarIntento(bd.c, { intentoId: intento.intentoId, estudianteId: EST });
  assert.equal(resultado.aprobado, true);
  bd.cerrar();
});

await caso("V9", "cerrarProceso: aprobada con mejor porcentaje", async () => {
  const bd = abrir(P);
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });
  const intento = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "normal" });

  for (let i = 1; i <= 9; i++) {
    const opcion = i <= 8 ? "o2" : "o1";
    await responder(bd.c, { intentoId: intento.intentoId, estudianteId: EST, preguntaVersionId: "qe" + i, opcionId: opcion });
  }
  await enviarIntento(bd.c, { intentoId: intento.intentoId, estudianteId: EST });

  const cerrado = await cerrarProceso(bd.c, { procesoId: proc.procesoId, estudianteId: EST });
  assert.equal(cerrado.estado, "aprobado");
  assert.ok(cerrado.mejorScorePct > 0);
  bd.cerrar();
});

await caso("V10", "normal reprobado -> efectoProceso extra_disponible", async () => {
  const bd = abrir(P);
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });
  const intento = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "normal" });

  for (let i = 1; i <= 9; i++) {
    const opcion = i <= 5 ? "o2" : "o1";
    await responder(bd.c, { intentoId: intento.intentoId, estudianteId: EST, preguntaVersionId: "qe" + i, opcionId: opcion });
  }
  const resultado = await enviarIntento(bd.c, { intentoId: intento.intentoId, estudianteId: EST });
  assert.equal(resultado.aprobado, false);
  assert.equal(resultado.efectoProceso, "extra_disponible");
  bd.cerrar();
});

await caso("V11", "entrega automática: null cuando tiempo no vencido", async () => {
  const bd = abrir(P);
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });
  const intento = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "normal" });

  const resultado = await verificarEntregaAutomatica(bd.c, { intentoId: intento.intentoId, estudianteId: EST });
  assert.equal(resultado, null);
  bd.cerrar();
});

// ── Casos INVÁLIDOS ────────────────────────────────────────────────────────────

await caso("I1", "extra sin normal enviado -> ErrorEvaluacion", async () => {
  const bd = abrir(P);
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });

  await assert.rejects(
    iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "extra" }),
    (e: ErrorEvaluacion) => e instanceof ErrorEvaluacion && e.codigo === "normal_no_enviado",
  );
  bd.cerrar();
});

await caso("I2", "extra tras 72 h: estadoExtra devuelve no_rendido", async () => {
  const { estadoExtra } = await import("../shared/ventanas");
  const publicadoAt = 1_000_000;
  const tras72h = publicadoAt + 72 * SEG_POR_HORA + 1;
  assert.equal(estadoExtra(tras72h, publicadoAt), "no_rendido");
});

await caso("I3", "perfil inválido -> ErrorEvaluacion", async () => {
  const bd = abrir(P);
  // @ts-expect-error: perfil inválido intencional.
  await assert.rejects(
    abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "otro" }),
    (e: ErrorEvaluacion) => e instanceof ErrorEvaluacion && e.codigo === "perfil_invalido",
  );
  bd.cerrar();
});

await caso("I4", "respuesta con pregunta ajena a la versión -> ErrorEvaluacion", async () => {
  const bd = abrir(P);
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });
  const intento = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "normal" });

  // Crear pregunta NO en la versión.
  await bd.x("INSERT INTO question_families (id, item_id, bank) VALUES ('ef99', 'i1', 'evaluacion')");
  await bd.x("INSERT INTO question_versions (id, family_id, item_id, bank, version, status, stem, options_json, correct_option_id, origin, authored_by) VALUES ('qe99', 'ef99', 'i1', 'evaluacion', 1, 'borrador', 'X', ?, 'o2', 'humano', ?)", [OPC, AU]);
  await bd.x("UPDATE question_versions SET status = 'en_revision' WHERE id = 'qe99'");
  await bd.x("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = 'qe99'", [VA]);

  await assert.rejects(
    responder(bd.c, { intentoId: intento.intentoId, estudianteId: EST, preguntaVersionId: "qe99", opcionId: "o2" }),
    (e: ErrorEvaluacion) => e instanceof ErrorEvaluacion && e.codigo === "pregunta_no_pertenece_version",
  );
  bd.cerrar();
});

await caso("I5", "cerrarProceso: proceso ya cerrado -> ErrorEvaluacion", async () => {
  const bd = abrir(P);
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });
  const intento = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "normal" });
  for (let i = 1; i <= 9; i++) {
    await responder(bd.c, { intentoId: intento.intentoId, estudianteId: EST, preguntaVersionId: "qe" + i, opcionId: "o2" });
  }
  await enviarIntento(bd.c, { intentoId: intento.intentoId, estudianteId: EST });
  await cerrarProceso(bd.c, { procesoId: proc.procesoId, estudianteId: EST });

  await assert.rejects(
    cerrarProceso(bd.c, { procesoId: proc.procesoId, estudianteId: EST }),
    (e: ErrorEvaluacion) => e instanceof ErrorEvaluacion && e.codigo === "proceso_cerrado",
  );
  bd.cerrar();
});

await caso("I6", "intento enviado no se puede responder", async () => {
  const bd = abrir(P);
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });
  const intento = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "normal" });
  for (let i = 1; i <= 9; i++) {
    await responder(bd.c, { intentoId: intento.intentoId, estudianteId: EST, preguntaVersionId: "qe" + i, opcionId: "o2" });
  }
  await enviarIntento(bd.c, { intentoId: intento.intentoId, estudianteId: EST });

  await assert.rejects(
    responder(bd.c, { intentoId: intento.intentoId, estudianteId: EST, preguntaVersionId: "qe1", opcionId: "o2" }),
    (e: ErrorEvaluacion) => e instanceof ErrorEvaluacion && e.codigo === "intento_no_activo",
  );
  bd.cerrar();
});

await caso("I7", "enviarIntento idempotente: mismo envioId", async () => {
  const bd = abrir(P);
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });
  const intento = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "normal" });
  for (let i = 1; i <= 9; i++) {
    await responder(bd.c, { intentoId: intento.intentoId, estudianteId: EST, preguntaVersionId: "qe" + i, opcionId: "o2" });
  }

  const envioId = "sub-idempotente-1";
  const r1 = await enviarIntento(bd.c, { intentoId: intento.intentoId, estudianteId: EST, envioId });
  const r2 = await enviarIntento(bd.c, { intentoId: intento.intentoId, estudianteId: EST, envioId });
  assert.equal(r1.scorePct, r2.scorePct);
  assert.equal(r1.aprobado, r2.aprobado);
  bd.cerrar();
});

await caso("I8", "proceso duplicado para mismo estudiante y evaluación", async () => {
  const bd = abrir(P);
  await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });
  await assert.rejects(
    abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" }),
    /proceso/,
  );
  bd.cerrar();
});

await caso("I9", "cerrarProceso con extra no rendido (72 h vencidas) -> reprobada + progression_continuations", async () => {
  const bd = abrir(P);
  const proc = await abrirProceso(bd.c, { estudianteId: EST, evaluacionId: "me-e2", versionId: "ev-v1", perfil: "regular" });

  const intento = await iniciarIntento(bd.c, { instanciaId: proc.instanciaId, estudianteId: EST, tipo: "normal" });
  for (let i = 1; i <= 9; i++) {
    await responder(bd.c, { intentoId: intento.intentoId, estudianteId: EST, preguntaVersionId: "qe" + i, opcionId: "o1" });
  }
  await enviarIntento(bd.c, { intentoId: intento.intentoId, estudianteId: EST });

  // Simular 72 h vencidas.
  await bd.x("UPDATE evaluation_instances SET extra_deadline_at = 100 WHERE id = ?", [proc.instanciaId]);

  const cerrado = await cerrarProceso(bd.c, { procesoId: proc.procesoId, estudianteId: EST });
  assert.equal(cerrado.estado, "reprobado");
  assert.equal(cerrado.moduloSiguiente, true);

  const pc = await bd.x("SELECT COUNT(*) AS n FROM progression_continuations WHERE process_id = ?", [proc.procesoId]);
  assert.equal(Number(pc.rows[0].n), 1);
  bd.cerrar();
});

await caso("I10", "estadoExtra: disponible dentro del plazo", async () => {
  const { estadoExtra } = await import("../shared/ventanas");
  const publicadoAt = 1_000_000;
  const dentroPlazo = publicadoAt + 36 * SEG_POR_HORA;
  assert.equal(estadoExtra(dentroPlazo, publicadoAt), "disponible");
});

await caso("I11", "estadoExtra: en_curso con inicioAt válido", async () => {
  const { estadoExtra } = await import("../shared/ventanas");
  const publicadoAt = 1_000_000;
  const ahora = publicadoAt + 10 * SEG_POR_HORA;
  const inicioAt = publicadoAt + 5 * SEG_POR_HORA;
  assert.equal(estadoExtra(ahora, publicadoAt, inicioAt), "en_curso");
});

// ── Resumen ────────────────────────────────────────────────────────────────────

fs.rmSync(RAIZ, { recursive: true, force: true });
console.log(salida.join("\n"));
console.log("evaluacion-servicio: ok (" + casos + " casos)");
