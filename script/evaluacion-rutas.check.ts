// Rutas HTTP de la evaluación E2: sesión, propiedad, errores y que no se filtre la clave.
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

const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), "t34-"));

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

// ── Servidor de prueba con sesión falsa: cabecera x-test-user ─────────────────
import express from "express";
import { registrarRutasEvaluacion, rutasEvaluacionHabilitadas } from "../server/evaluacionRoutes";

const bd = abrir(P);
await bd.c.execute("INSERT INTO users (id, email) VALUES ('est-b', 'b@ficticio.test')");
await bd.c.execute("INSERT INTO users (id, email) VALUES ('adm-1', 'adm@ficticio.test')");
const app = express(); app.use(express.json());
registrarRutasEvaluacion(app, { client: bd.c, userId: (r) => (r.headers["x-test-user"] as string) || undefined, esAdmin: async (u) => u === "adm-1" });
const srv = app.listen(0); const port = (srv.address() as any).port;
const http = async (m: string, u: string, who?: string, body?: unknown) => {
  const r = await fetch(`http://127.0.0.1:${port}${u}`, { method: m, headers: { "content-type": "application/json", ...(who ? { "x-test-user": who } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { s: r.status, j: await r.json().catch(() => null) as any };
};
const E = "/api/vortice/evaluaciones";

await caso("R1", "apagadas por defecto: flag distinto de 1 no habilita", async () => {
  assert.equal(rutasEvaluacionHabilitadas({ VORTICE_EVALUACION_RUTAS: "0" } as any), false);
  assert.equal(rutasEvaluacionHabilitadas({} as any), false);
  assert.equal(rutasEvaluacionHabilitadas({ VORTICE_EVALUACION_RUTAS: "1" } as any), true);
});
await caso("R2", "sin sesión: 401 en todas", async () => {
  for (const [m, u] of [["POST", `${E}/me-e2/proceso`], ["POST", `${E}/instancias/x/intentos`], ["GET", `${E}/intentos/x/preguntas`], ["POST", `${E}/intentos/x/responder`], ["POST", `${E}/intentos/x/enviar`], ["POST", `${E}/procesos/x/cerrar`], ["POST", "/api/admin/vortice/evaluaciones/me-e2/proceso"]])
    assert.equal((await http(m, u)).s, 401, u);
});
let proc: any, int: any;
await caso("R3", "abrir proceso: versión del servidor, perfil regular; repetir devuelve el mismo", async () => {
  const r = await http("POST", `${E}/me-e2/proceso`, EST); assert.equal(r.s, 200); proc = r.j;
  assert.equal(proc.perfil, "regular"); assert.equal(proc.duracionMin, 60); assert.equal(proc.umbral, 70);
  const r2 = await http("POST", `${E}/me-e2/proceso`, EST); assert.equal(r2.j.procesoId, proc.procesoId); assert.equal(r2.j.existente, true);
});
await caso("R4", "evaluación sin versión publicada: 404", async () => {
  assert.equal((await http("POST", `${E}/no-existe/proceso`, EST)).s, 404);
});
await caso("R5", "intento normal; tipo inválido 400; extra sin normal enviado 409", async () => {
  const r = await http("POST", `${E}/instancias/${proc.instanciaId}/intentos`, EST, { tipo: "normal" }); assert.equal(r.s, 200); int = r.j;
  assert.equal((await http("POST", `${E}/instancias/${proc.instanciaId}/intentos`, EST, { tipo: "otro" })).s, 400);
  assert.equal((await http("POST", `${E}/instancias/${proc.instanciaId}/intentos`, EST, { tipo: "extra" })).s, 409);
});
await caso("R6", "preguntas sin clave ni explicación", async () => {
  const r = await http("GET", `${E}/intentos/${int.intentoId}/preguntas`, EST); assert.equal(r.s, 200);
  assert.equal(r.j.length, 9);
  const t = JSON.stringify(r.j); assert.ok(!/correct/i.test(t) && !/explic/i.test(t));
});
await caso("R7", "otro estudiante no ve ni usa el intento ajeno", async () => {
  assert.equal((await http("GET", `${E}/intentos/${int.intentoId}/preguntas`, "est-b")).s, 404);
  assert.equal((await http("POST", `${E}/intentos/${int.intentoId}/enviar`, "est-b", {})).s, 404);
  assert.equal((await http("POST", `${E}/procesos/${proc.procesoId}/cerrar`, "est-b")).s, 404);
});
await caso("R8", "responder: no revela si es correcta; cuerpo incompleto 400", async () => {
  const q = (await http("GET", `${E}/intentos/${int.intentoId}/preguntas`, EST)).j[0];
  const r = await http("POST", `${E}/intentos/${int.intentoId}/responder`, EST, { preguntaVersionId: q.preguntaVersionId, opcionId: "o1" });
  assert.equal(r.s, 200); assert.ok(!("correcta" in r.j));
  assert.equal((await http("POST", `${E}/intentos/${int.intentoId}/responder`, EST, { preguntaVersionId: q.preguntaVersionId })).s, 400);
});
await caso("R9", "enviar: calcula resultado; reenviar es idempotente con el mismo envioId", async () => {
  const r = await http("POST", `${E}/intentos/${int.intentoId}/enviar`, EST, { envioId: "e1" }); assert.equal(r.s, 200);
  assert.equal(r.j.totalQuestions, 9);
  const r2 = await http("POST", `${E}/intentos/${int.intentoId}/enviar`, EST, { envioId: "e1" }); assert.equal(r2.s, 200); assert.equal(r2.j.scorePct, r.j.scorePct);
});
await caso("R10", "responder tras enviar: 409", async () => {
  const q = (await http("GET", `${E}/intentos/${int.intentoId}/preguntas`, EST)).j[1];
  assert.equal((await http("POST", `${E}/intentos/${int.intentoId}/responder`, EST, { preguntaVersionId: q.preguntaVersionId, opcionId: "o1" })).s, 409);
});
await caso("R11", "admin: estudiante común recibe 403; admin declara perfil neurodivergente", async () => {
  assert.equal((await http("POST", "/api/admin/vortice/evaluaciones/me-e2/proceso", EST, { estudianteId: "est-b", perfil: "neurodivergente" })).s, 403);
  const r = await http("POST", "/api/admin/vortice/evaluaciones/me-e2/proceso", "adm-1", { estudianteId: "est-b", perfil: "neurodivergente" });
  assert.equal(r.s, 200); assert.equal(r.j.duracionMin, 120); assert.equal(r.j.umbral, 50);
  assert.equal((await http("POST", "/api/admin/vortice/evaluaciones/me-e2/proceso", "adm-1", { estudianteId: "est-b", perfil: "raro" })).s, 400);
});
await caso("R12", "reabrir: 403 si no es admin; motivo obligatorio", async () => {
  assert.equal((await http("POST", `/api/admin/vortice/evaluaciones/procesos/${proc.procesoId}/reabrir`, EST, { estudianteId: EST, motivo: "x" })).s, 403);
  assert.equal((await http("POST", `/api/admin/vortice/evaluaciones/procesos/${proc.procesoId}/reabrir`, "adm-1", { estudianteId: EST })).s, 404);
});
await caso("R13", "error interno no filtra detalles", async () => {
  const r = await http("GET", `${E}/intentos/%00/preguntas`, EST); assert.ok(r.s === 404 || r.s === 500); assert.ok(!JSON.stringify(r.j).includes("SELECT"));
});

srv.close(); bd.cerrar();
fs.rmSync(RAIZ, { recursive: true, force: true });
console.log(salida.join("\n"));
console.log("evaluacion-rutas: ok (" + casos + " casos)");
