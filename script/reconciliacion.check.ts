// R2: pruebas de la reconciliación de recursos (server/reconciliacionRecursos.ts). Bases locales desechables
// (libSQL embebido en archivo). V-1..V-5 por separado y combinadas; cada una: escenario sano sin falsos positivos,
// detección exacta con severidad, determinismo, huella de TODAS las tablas idéntica antes y después, y una segunda
// base construida desde cero. También: ejecución incompleta, solo lectura y CLI.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import v8 from "node:v8"; import vm from "node:vm";
import { spawnSync } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import type { Client } from "@libsql/client";
import { migrar } from "../server/migrar"; import { crearClienteDb } from "../server/cliente"; import { assertBaseLocal } from "../server/dbGuard";
import { codigoSalida, formatear, IDENTIFICADORES_CONSULTA, reconciliar, type Reconciliacion } from "../server/reconciliacionRecursos";
import { baseArchivo } from "./lib/basePrueba";
import { aplicarEsquemaHeredado, sembrarFicticios } from "./lib/esquemaHeredado";

if (process.env.NODE_ENV === "production") throw new Error("reconciliacion.check no debe correr con NODE_ENV=production");
// libSQL embebido: client.transaction() (lo usa migrar) deja conexiones nativas vivas hasta que el recolector las
// finaliza, y esas finalizaciones tardías fallaban a veces con SIGSEGV (ver REGISTRO_H2_INTEGRIDAD). Se fuerzan
// los finalizadores mientras el proceso está sano; si aun así el proceso cae, sale con 139 y check:vortice falla.
v8.setFlagsFromString("--expose-gc");
const gc = vm.runInNewContext("gc") as () => void;
const liberarNativos = async () => { for (let i = 0; i < 2; i++) { gc(); await new Promise((r) => setImmediate(r)); await new Promise((r) => setTimeout(r, 0)); } };
const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), "recon-"));
const AU = "ficticio-autor", VA = "ficticio-validador", OT = "ficticio-otro";
const ESTADOS = ["borrador", "en_revision", "validada", "publicada", "retirada"] as const;

// Escenario CORRECTO construido desde cero (esquema heredado + migraciones). Cada llamada es una base nueva.
async function construirPlantilla(nombre: string): Promise<string> {
  const b = baseArchivo(); const c = b.client; const x = (s: string, a: any[] = []) => c.execute({ sql: s, args: a });
  await aplicarEsquemaHeredado(c); await sembrarFicticios(c); await migrar(c, "migrations/vortice");
  await x("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa1','ls-mat-5b','M1','t','https://e.test',2018)");
  await x("INSERT INTO weekly_resources (id, learning_objective_id, resource_type, title, sort_order) VALUES ('wr-libre1','lo-mat','audio','L1',90),('wr-libre2','lo-mat','infografia','L2',91),('wr-libre3','lo-mat','presentacion','L3',92),('wr-t1','lo-mat','video','T1',93),('wr-t2','lo-mat','video','T2',94)");
  await x("INSERT INTO learning_objectives (id, level_subject_id, code, title, week_number) VALUES ('lo-y','ls-mat-5b','M9','y',9)");
  await x("INSERT INTO weekly_resources (id, learning_objective_id, resource_type, title, reflection_prompts, pedagogical_step) VALUES ('wr-refl','lo-y','reflexion','Refl','[\"¿Qué aprendí?\"]','reflexion'),('wr-refl2','lo-y','reflexion','Refl2',NULL,'ejemplo')");
  await x("INSERT INTO tutoring_cases (id, student_id, tutor_id, learning_objective_id, resource_id, question, status, created_at) VALUES ('tc1',?,?,'lo-mat','wr-t1','d','abierto',1),('tc2',?,?,'lo-y',NULL,'d','abierto',1),('tc3',?,?,'lo-mat','wr-t2','d','abierto',1)", [AU, OT, AU, OT, AU, OT]);
  // Un dominio por estado de versión, con un módulo propio y un recurso propio, todos de la misma asignatura.
  for (const e of ESTADOS) {
    await x("INSERT INTO learning_objectives (id, level_subject_id, code, title, week_number) VALUES (?, 'ls-mat-5b', ?, ?, 20)", [`lo-${e}`, `M-${e}`, e]);
    await x("INSERT INTO weekly_resources (id, learning_objective_id, resource_type, title, sort_order) VALUES (?, 'lo-mat', 'video', ?, 50)", [`wr-${e}`, e]);
    await x("INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES (?, 'ls-mat-5b', ?)", [`d-${e}`, e]);
    await x("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES (?, ?, 1, 'borrador', ?)", [`dv-${e}`, `d-${e}`, AU]);
    await x("INSERT INTO knowledge_items (id, domain_id, code) VALUES (?, ?, 'A')", [`i-${e}`, `d-${e}`]);
    await x("INSERT INTO knowledge_item_versions (id,item_id,domain_version_id,domain_id,name,operational_definition) VALUES (?,?,?,?,'n','d')", [`iv-${e}`, `i-${e}`, `dv-${e}`, `d-${e}`]);
    await x("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES (?, 'oa1')", [`iv-${e}`]);
    await x("INSERT INTO knowledge_item_modules (item_version_id, learning_objective_id) VALUES (?, ?)", [`iv-${e}`, `lo-${e}`]);
    await x("INSERT INTO knowledge_item_resources (item_version_id, resource_id, role) VALUES (?, ?, 'explicacion')", [`iv-${e}`, `wr-${e}`]);
    const v = `dv-${e}`;
    if (e !== "borrador") await x("UPDATE knowledge_domain_versions SET status='en_revision' WHERE id=?", [v]);
    if (["validada", "publicada", "retirada"].includes(e)) await x("UPDATE knowledge_domain_versions SET status='validada', validated_by=? WHERE id=?", [VA, v]);
    if (["publicada", "retirada"].includes(e)) await x("UPDATE knowledge_domain_versions SET status='publicada', published_at=1 WHERE id=?", [v]);
    if (e === "retirada") await x("UPDATE knowledge_domain_versions SET status='retirada' WHERE id=?", [v]);
  }
  const f = path.join(RAIZ, `${nombre}.db`); fs.copyFileSync(b.url.replace(/^file:/, ""), f); await b.cerrar(); return f;
}

const abrir = (plantilla: string) => {
  const carpeta = fs.mkdtempSync(path.join(RAIZ, "b-")); const f = path.join(carpeta, "base.db"); fs.copyFileSync(plantilla, f);
  const url = `file:${f}`; assertBaseLocal(process.env, url); const c: Client = crearClienteDb(url);
  return { c, f, x: (s: string, a: any[] = []) => c.execute({ sql: s, args: a }), cerrar: () => { c.close(); fs.rmSync(carpeta, { recursive: true, force: true }); } };
};
// Huella de TODAS las tablas (incluidas las de control) más el esquema (triggers e índices).
const huella = async (c: Client) => {
  const ts = (await c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%' ORDER BY name")).rows.map((r) => String(r.name));
  const h = createHash("sha256");
  for (const t of ts) h.update(t + JSON.stringify((await c.execute(`SELECT * FROM "${t}"`)).rows.map((r) => JSON.stringify(Object.values(r))).sort()));
  h.update(JSON.stringify((await c.execute("SELECT type,name,sql FROM sqlite_master ORDER BY type,name")).rows.map((r) => JSON.stringify(Object.values(r)))));
  return h.digest("hex");
};
const linea = (h: Reconciliacion["hallazgos"][number]) => `${h.codigo}|${h.severidad}|${h.recurso ?? "-"}|${h.modulo ?? "-"}|${h.referencia ?? "-"}`;
const resumen: string[] = []; const huellas: string[] = [];

const plantillaA = await construirPlantilla("A"); await liberarNativos();
const plantillaB = await construirPlantilla("B"); await liberarNativos();   // segunda base, construida desde cero

async function prueba(id: string, introducir: string[], esperado: string[]) {
  let previoJson: string | null = null;
  for (const [n, plantilla] of [["A", plantillaA], ["B", plantillaB]] as const) {
    const bd = abrir(plantilla);
    const sana = await reconciliar(bd.c);
    assert.equal(sana.estado, "completa", `${id}/${n}: la reconciliación sana no terminó`);
    assert.deepEqual(sana.hallazgos, [], `${id}/${n}: falso positivo en el escenario correcto: ${sana.hallazgos.map(linea).join(" ; ")}`);
    assert.equal(codigoSalida(sana), 0);
    for (const s of introducir) await bd.x(s);
    const antes = await huella(bd.c);
    const r1 = await reconciliar(bd.c); const r2 = await reconciliar(bd.c);
    const despues = await huella(bd.c);
    assert.equal(despues, antes, `${id}/${n}: la reconciliación modificó la base`);
    assert.equal(r1.estado, "completa");
    assert.deepEqual(r1, r2, `${id}/${n}: resultado no determinista`);
    assert.equal(formatear(r1), formatear(r2));
    assert.deepEqual(r1.hallazgos.map(linea), esperado, `${id}/${n}: hallazgos distintos de los esperados`);
    assert.equal(codigoSalida(r1), 1);
    const j = JSON.stringify(r1);
    if (previoJson === null) previoJson = j; else assert.equal(j, previoJson, `${id}: la segunda base desde cero da otro resultado`);
    huellas.push(`${id}/${n} ${antes.slice(0, 12)}→${despues.slice(0, 12)}`);
    bd.cerrar(); await liberarNativos();
  }
  resumen.push(`  ✓ ${id}: ${esperado.length} hallazgo(s): ${esperado.join(" ; ")}`);
}

// --- V-1: recurso vinculado a un dominio de otra asignatura (alta: validada/publicada/retirada; media: borrador/en revisión)
await prueba("V-1", [`UPDATE weekly_resources SET learning_objective_id='lo-len' WHERE id IN ('wr-borrador','wr-en_revision','wr-validada','wr-publicada','wr-retirada')`], [
  "V-1|media|wr-borrador|lo-len|d-borrador/v1", "V-1|media|wr-en_revision|lo-len|d-en_revision/v1",
  "V-1|alta|wr-publicada|lo-len|d-publicada/v1", "V-1|alta|wr-retirada|lo-len|d-retirada/v1", "V-1|alta|wr-validada|lo-len|d-validada/v1"]);
await prueba("V-1 (un solo recurso)", [`UPDATE weekly_resources SET learning_objective_id='lo-len' WHERE id='wr-publicada'`], ["V-1|alta|wr-publicada|lo-len|d-publicada/v1"]);
// --- V-2: módulo vinculado a un dominio de otra asignatura
await prueba("V-2", [`UPDATE learning_objectives SET level_subject_id='ls-len-6b' WHERE id IN ('lo-borrador','lo-en_revision','lo-validada','lo-publicada','lo-retirada')`], [
  "V-2|media|-|lo-borrador|d-borrador/v1", "V-2|media|-|lo-en_revision|d-en_revision/v1",
  "V-2|alta|-|lo-publicada|d-publicada/v1", "V-2|alta|-|lo-retirada|d-retirada/v1", "V-2|alta|-|lo-validada|d-validada/v1"]);
// --- V-3: caso de tutoría cuyo recurso y objetivo son de módulos distintos (no se activa con resource_id nulo)
await prueba("V-3", [`UPDATE tutoring_cases SET learning_objective_id='lo-y' WHERE id='tc1'`, `UPDATE tutoring_cases SET learning_objective_id='lo-mat' WHERE id='tc2'`], ["V-3|media|wr-t1|lo-mat|caso tc1"]);
// --- V-4: cuatro tipos de dato inválido (SQLite acepta texto en columnas de enteros)
await prueba("V-4", [
  `UPDATE weekly_resources SET resource_type='ejecutable' WHERE id='wr-libre1'`, `UPDATE weekly_resources SET sort_order='abc' WHERE id='wr-libre2'`,
  `UPDATE weekly_resources SET is_active='no' WHERE id='wr-libre3'`, `UPDATE weekly_resources SET pedagogical_step='inventado' WHERE id='wr-t1'`,
  `UPDATE weekly_resources SET is_active=2 WHERE id='wr-t2'`], [
  // orden: código, consulta (is_active, pedagogical_step, resource_type, sort_order), recurso
  "V-4|media|wr-libre3|lo-mat|-", "V-4|media|wr-t2|lo-mat|-", "V-4|media|wr-t1|lo-mat|-", "V-4|media|wr-libre1|lo-mat|-", "V-4|media|wr-libre2|lo-mat|-"]);
// --- V-5: preguntas de reflexión en recurso que no es de reflexión (los de reflexión con preguntas no se reportan)
await prueba("V-5", [`UPDATE weekly_resources SET reflection_prompts='["x"]' WHERE id='wr-libre1'`], ["V-5|baja|wr-libre1|lo-mat|-"]);
// --- Combinada: las cinco a la vez, sin interferencia (cada una usa filas distintas)
const combinadaSQL = [
  `UPDATE weekly_resources SET learning_objective_id='lo-len' WHERE id='wr-publicada'`,        // V-1 alta
  `UPDATE learning_objectives SET level_subject_id='ls-len-6b' WHERE id='lo-borrador'`,        // V-2 media
  `UPDATE tutoring_cases SET learning_objective_id='lo-y' WHERE id='tc3'`,                      // V-3
  `UPDATE weekly_resources SET resource_type='ejecutable' WHERE id='wr-libre2'`,               // V-4
  `UPDATE weekly_resources SET reflection_prompts='["x"]' WHERE id='wr-libre3'`,               // V-5
];
await prueba("TODAS", combinadaSQL, [
  "V-1|alta|wr-publicada|lo-len|d-publicada/v1", "V-2|media|-|lo-borrador|d-borrador/v1", "V-3|media|wr-t2|lo-mat|caso tc3",
  "V-4|media|wr-libre2|lo-mat|-", "V-5|baja|wr-libre3|lo-mat|-"]);

// --- Recurso con caso de tutoría movido a otro módulo (sin vínculos del catálogo): solo V-3
await prueba("V-3 con el recurso movido de módulo", [`UPDATE weekly_resources SET learning_objective_id='lo-len' WHERE id='wr-t1'`], ["V-3|media|wr-t1|lo-len|caso tc1"]);   // wr-t1 no está vinculado: solo V-3

// --- Ejecución incompleta: una consulta que no puede ejecutarse NO se convierte en resultado vacío ni parcial
{
  const bd = abrir(plantillaA);
  await bd.x("UPDATE weekly_resources SET reflection_prompts='[\"x\"]' WHERE id='wr-libre1'");   // habría un hallazgo V-5
  await bd.x("DROP TABLE tutoring_cases");
  const r = await reconciliar(bd.c);
  assert.equal(r.estado, "incompleta");
  assert.equal(codigoSalida(r), 2);
  assert.deepEqual(r.hallazgos, [], "una ejecución incompleta no entrega hallazgos como resultado");
  const v3 = r.consultas.find((c) => c.consulta === "V-3")!;
  assert.equal(v3.estado, "error"); assert.match(v3.error ?? "", /tutoring_cases/);
  assert.deepEqual(r.consultas.filter((c) => c.estado === "error").map((c) => c.consulta), ["V-3"]);
  assert.match(formatear(r), /INCOMPLETA: NO ES UN RESULTADO VALIDO/);
  assert.match(formatear(r), /consulta V-3: ERROR/);
  assert.doesNotMatch(formatear(r), /RECONCILIACION COMPLETA/);
  assert.equal(JSON.stringify(await reconciliar(bd.c)), JSON.stringify(r), "la ejecución incompleta debe ser determinista");
  resumen.push("  ✓ incompleta: V-3 sin tabla → estado incompleta, salida 2, sin hallazgos presentados");
  bd.cerrar();
}
{   // tabla de recursos ausente: fallan todas las consultas que la leen; nunca "completa y vacía"
  const bd = abrir(plantillaA); await bd.x("PRAGMA foreign_keys=OFF"); await bd.x("DROP TABLE knowledge_item_resources");
  const r = await reconciliar(bd.c);
  assert.equal(r.estado, "incompleta"); assert.ok(r.consultas.find((c) => c.consulta === "V-1")!.error);
  assert.equal(r.consultas.filter((c) => c.estado === "ok").length, IDENTIFICADORES_CONSULTA.length - 1);
  bd.cerrar();
}
{   // el cliente falla del todo: no se oculta ni se vuelve "completa"
  const roto = { execute: async () => { throw new Error("conexión perdida"); } } as any;
  const r = await reconciliar(roto);
  assert.equal(r.estado, "incompleta"); assert.ok(r.consultas.every((c) => c.estado === "error")); assert.equal(r.consultas.length, IDENTIFICADORES_CONSULTA.length);
  assert.deepEqual(r.hallazgos, []);
  resumen.push("  ✓ cliente roto: todas las consultas en error, estado incompleta");
}

// --- Solo lectura: instrumentación del cliente. Solo SELECT y PRAGMA query_only; query_only activo mientras se lee y restaurado después.
{
  const bd = abrir(plantillaA); const visto: string[] = [];
  const espia = { execute: async (s: any) => { const t = typeof s === "string" ? s : s.sql; visto.push(t.trim()); return bd.c.execute(t); } } as any;
  await reconciliar(espia);
  const normal = visto.filter((t) => !/^PRAGMA query_only/i.test(t));
  assert.equal(normal.length, IDENTIFICADORES_CONSULTA.length);
  assert.ok(normal.every((t) => /^SELECT\b/i.test(t) && !/\b(INSERT|UPDATE|DELETE|REPLACE)\b/i.test(t.replace(/'[^']*'/g, ""))), "todas las sentencias son SELECT");
  assert.match(visto[0], /^PRAGMA query_only$/i); assert.match(visto[1], /^PRAGMA query_only = 1$/i);
  assert.match(visto[visto.length - 1], /^PRAGMA query_only = 0$/i);
  assert.equal(Number((await bd.x("PRAGMA query_only")).rows[0][0]), 0, "query_only restaurado a 0");
  await bd.x("PRAGMA query_only = 1"); await reconciliar(bd.c);
  assert.equal(Number((await bd.x("PRAGMA query_only")).rows[0][0]), 1, "si ya estaba activo, sigue activo");
  await bd.x("PRAGMA query_only = 0");
  await bd.x("INSERT INTO weekly_resources (id, learning_objective_id, resource_type, title) VALUES ('wr-post','lo-mat','video','post')");   // escribir de nuevo funciona
  // Mientras corre, el motor rechaza escrituras: se comprueba con una consulta inyectada que escribe.
  const intruso = { execute: async (s: any) => { const t = typeof s === "string" ? s : s.sql; if (/^PRAGMA/i.test(t)) return bd.c.execute(t); try { await bd.c.execute("INSERT INTO weekly_resources (id, learning_objective_id, resource_type, title) VALUES ('wr-intruso','lo-mat','video','x')"); visto.push("ESCRITURA ACEPTADA"); } catch { visto.push("ESCRITURA RECHAZADA"); } return bd.c.execute(t); } } as any;
  visto.length = 0; await reconciliar(intruso);
  assert.ok(!visto.includes("ESCRITURA ACEPTADA") && visto.includes("ESCRITURA RECHAZADA"), "la conexión rechaza escrituras durante la reconciliación");
  assert.equal((await bd.x("SELECT COUNT(*) c FROM weekly_resources WHERE id='wr-intruso'")).rows[0].c, 0);
  resumen.push("  ✓ solo lectura: 8 SELECT, query_only activo durante la lectura y restaurado, escritura intrusa rechazada");
  bd.cerrar();
}

// --- CLI
{
  const cli = (args: string[], env: Record<string, string> = {}) => spawnSync("node_modules/.bin/tsx", ["server/reconciliacionRecursos.ts", ...args], { encoding: "utf8", env: { PATH: process.env.PATH ?? "", HOME: process.env.HOME ?? "", ...env }, timeout: 120000 });
  const sana = abrir(plantillaA); const cerrarSana = () => sana.cerrar();
  const archivo = (f: string) => createHash("sha256").update(fs.readFileSync(f)).digest("hex");
  const f0 = archivo(sana.f); sana.c.close();
  let r = cli(["--db", `file:${sana.f}`]);
  assert.equal(r.status, 0, r.stderr + r.stdout); assert.match(r.stdout, /^RECONCILIACION COMPLETA/); assert.match(r.stdout, /hallazgos: 0/);
  assert.equal(archivo(sana.f), f0, "el CLI no modificó el archivo de la base");
  const con = abrir(plantillaA); for (const s of combinadaSQL) await con.x(s); con.c.close();
  const f1 = archivo(con.f);
  r = cli(["--db", `file:${con.f}`]); assert.equal(r.status, 1, r.stderr + r.stdout);
  const r2 = cli([], { TEST_DATABASE_URL: `file:${con.f}` }); assert.equal(r2.status, 1); assert.equal(r2.stdout, r.stdout, "salida del CLI idéntica entre ejecuciones");
  assert.equal(archivo(con.f), f1, "el CLI no modificó el archivo de la base con hallazgos");
  assert.equal((r.stdout.match(/^V-\d \|/gm) ?? []).length, 5);
  // texto de la base con caracteres de control: no llega crudo a la terminal
  const esc = abrir(plantillaA); await esc.x("UPDATE weekly_resources SET resource_type=? WHERE id='wr-libre1'", ["x\u001b[31mROJO\u0007"]); esc.c.close();
  r = cli(["--db", `file:${esc.f}`]); assert.equal(r.status, 1); assert.ok(!/[\u001b\u0007]/.test(r.stdout), "sin caracteres de control en la salida"); assert.match(r.stdout, /resource_type=x\?\[31mROJO\?/); esc.cerrar();
  const j = cli(["--db", `file:${con.f}`, "--json"]); assert.equal(j.status, 1); assert.equal(JSON.parse(j.stdout).hallazgos.length, 5); assert.equal(JSON.parse(j.stdout).estado, "completa");
  const inexistente = path.join(RAIZ, "no-existe.db");
  r = cli(["--db", `file:${inexistente}`]); assert.equal(r.status, 2); assert.match(r.stderr, /INCOMPLETA/); assert.ok(!fs.existsSync(inexistente), "el CLI no crea la base");
  r = cli(["--db", "https://ejemplo.turso.io"]); assert.equal(r.status, 2); assert.match(r.stderr, /base local/);
  r = cli([]); assert.equal(r.status, 2);
  r = cli(["--db", `file:${sana.f}`], { TURSO_AUTH_TOKEN: "x" }); assert.equal(r.status, 2); assert.match(r.stderr, /Base local bloqueada/);
  // base sin tablas del catálogo: ejecución incompleta, salida 2, no "sin hallazgos"
  const vacia = path.join(RAIZ, "vacia.db"); const cv = crearClienteDb(`file:${vacia}`); await cv.execute("CREATE TABLE t (a)"); cv.close();
  r = cli(["--db", `file:${vacia}`]); assert.equal(r.status, 2, r.stdout); assert.match(r.stdout, /INCOMPLETA/);
  resumen.push("  ✓ CLI: salida 0 sana, 1 con hallazgos, 2 incompleta/no local/no existe; archivo intacto; no crea bases");
  con.cerrar(); cerrarSana();
}

fs.rmSync(RAIZ, { recursive: true, force: true });
console.log(resumen.join("\n")); console.log("huellas antes→después (idénticas):\n  " + huellas.join("\n  "));
console.log("reconciliacion: ok");
await liberarNativos();
