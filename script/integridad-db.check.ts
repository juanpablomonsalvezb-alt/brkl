// Corrección de integridad del catálogo (H2): migración 0003_integridad_catalogo. Reproduce los
// bypasses de INSERT OR REPLACE sobre una base con solo 0001 y 0002, y demuestra que la migración los
// bloquea, junto con INSERT OR IGNORE, ON CONFLICT DO UPDATE y UPDATE OR REPLACE, en las cuatro
// combinaciones de claves foráneas (activas o no) y recursive_triggers (apagado o activo). Bases locales
// desechables (libSQL embebido): no se extrapola a sqld ni a Turso.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import v8 from "node:v8";
import vm from "node:vm";
import type { Client } from "@libsql/client";
import { migrar, verificarDeriva } from "../server/migrar";
import { baseArchivo } from "./lib/basePrueba";
import { crearClienteDb } from "../server/cliente";
import { assertBaseLocal } from "../server/dbGuard";
import { aplicarEsquemaHeredado, sembrarFicticios } from "./lib/esquemaHeredado";

const AU = "ficticio-autor", VA = "ficticio-validador";
const ESTADOS = ["borrador", "en_revision", "validada", "publicada", "retirada"] as const;
const NO_EDITABLES = ["validada", "publicada", "retirada"] as const;
const COD: Record<string, string> = { borrador: "dB", en_revision: "dR", validada: "dV", publicada: "dP", retirada: "dX" };
const VACIAS: Record<string, string> = { borrador: "eB", en_revision: "eR", validada: "eV", publicada: "eP", retirada: "eX" };

// Directorio con solo 0001 y 0002: el estado anterior a la corrección.
const dirAntes = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-mig-antes-"));
for (const f of ["0001_catalogo.sql", "0002_banco.sql"]) fs.copyFileSync(path.join("migrations/vortice", f), path.join(dirAntes, f));
const DIR_DESPUES = "migrations/vortice";

type Modo = { fk: boolean; rt: boolean };
// Cada base se arma UNA vez por estado de migración (plantilla) y se copia como archivo en cada prueba.
// Aplicar las migraciones en decenas de bases abre decenas de conexiones nativas por `client.transaction()`
// que la API de libSQL no cierra (ver REGISTRO_H2_INTEGRIDAD.md, «Terminación del proceso»).
async function construir(dir: string) {
  const b = baseArchivo(); const c = b.client;
  await aplicarEsquemaHeredado(c); await sembrarFicticios(c);
  await migrar(c, dir);
  const x = (s: string, a: any[] = []) => c.execute({ sql: s, args: a });
  await x("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa1','ls-mat-5b','M1','t','https://e.test',2018),('oa2','ls-len-6b','L1','t','https://e.test',2018),('oa3','ls-mat-5b','M3','t','https://e.test',2018)");
  const arista = (id: string, dv: string, i: string, p: string) => x("INSERT INTO knowledge_prerequisites (id,domain_version_id,item_id,prerequisite_item_id,relation,justification,confidence) VALUES (?,?,?,?, 'necesaria','j','alta')", [id, dv, i, p]);
  const llevar = async (dv: string, hasta: string) => {
    if (hasta === "borrador") return;
    await x("UPDATE knowledge_domain_versions SET status='en_revision' WHERE id=?", [dv]);
    if (hasta === "en_revision") return;
    await x("UPDATE knowledge_domain_versions SET status='validada', validated_by=? WHERE id=?", [VA, dv]);
    if (hasta === "validada") return;
    await x("UPDATE knowledge_domain_versions SET status='publicada', published_at=1 WHERE id=?", [dv]);
    if (hasta === "retirada") await x("UPDATE knowledge_domain_versions SET status='retirada' WHERE id=?", [dv]);
  };
  // Un dominio por estado, con contenidos, vínculos y una arista validada; más un borrador destino (v9).
  for (const estado of ESTADOS) {
    const k = COD[estado];
    await x("INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES (?, 'ls-mat-5b', ?)", [k, k]);
    await x("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES (?,?,1,'borrador',?),(?,?,9,'borrador',?)", [`${k}1`, k, AU, `${k}9`, k, AU]);
    await x("INSERT INTO knowledge_items (id, domain_id, code) VALUES (?,?,?),(?,?,?)", [`${k}a`, k, `${k}a`, `${k}b`, k, `${k}b`]);
    await x("INSERT INTO knowledge_item_versions (id,item_id,domain_version_id,domain_id,name,operational_definition) VALUES (?,?,?,?,'n','d'),(?,?,?,?,'n','d'),(?,?,?,?,'n','d'),(?,?,?,?,'n','d')",
      [`${k}a1`, `${k}a`, `${k}1`, k, `${k}b1`, `${k}b`, `${k}1`, k, `${k}a9`, `${k}a`, `${k}9`, k, `${k}b9`, `${k}b`, `${k}9`, k]);
    for (const v of ["a1", "b1", "a9", "b9"]) await x("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES (?, 'oa1')", [`${k}${v}`]);
    await arista(`${k}e1`, `${k}1`, `${k}b`, `${k}a`); await arista(`${k}x9`, `${k}9`, `${k}a`, `${k}b`);
    await x("UPDATE knowledge_prerequisites SET validated_by=?, validated_at=1 WHERE id=?", [VA, `${k}e1`]);
    await llevar(`${k}1`, estado);
    // Versión de dominio vacía (sin contenidos), en el mismo estado.
    const e = VACIAS[estado];
    await x("INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES (?, 'ls-mat-5b', ?)", [e, e]);
    await x("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES (?,?,1,'borrador',?)", [`${e}1`, e, AU]);
    await llevar(`${e}1`, estado);
  }
  // Filas sin dependientes y un dominio para probar el nacimiento de versiones.
  await x("INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES ('dz','ls-mat-5b','dz'),('dn','ls-mat-5b','dn')");
  await x("INSERT INTO knowledge_items (id, domain_id, code) VALUES ('z','dB','Z'),('zq','dB','ZQ')");
  await x("INSERT INTO knowledge_item_versions (id,item_id,domain_version_id,domain_id,name,operational_definition) VALUES ('zq1','zq','dB9','dB','n','d')");
  await arista("dBy9", "dB9", "dBb", "dBa");
  return { b, c, x };
}

// libSQL (0.5.22, addon nativo) no cierra la conexión que abre `client.transaction()`: queda viva hasta que el
// recolector de basura la finaliza, y esas finalizaciones tardías fallaban a veces con SIGSEGV (ver el
// registro). Se fuerzan los finalizadores mientras el proceso aún está sano, tras cerrar cada base.
v8.setFlagsFromString("--expose-gc");
const gc = vm.runInNewContext("gc") as () => void;
const liberarNativos = async () => { for (let i = 0; i < 2; i++) { gc(); await new Promise((r) => setImmediate(r)); await new Promise((r) => setTimeout(r, 0)); } };

const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-integridad-"));
const PLANTILLAS = new Map<string, string>();
async function plantilla(dir: string): Promise<string> {
  const hecha = PLANTILLAS.get(dir);
  if (hecha) return hecha;
  const { b, c } = await construir(dir);
  const archivo = path.join(RAIZ, `plantilla-${PLANTILLAS.size}.db`);
  assert.equal(String((await c.execute("PRAGMA journal_mode")).rows[0][0]), "delete", "la copia de archivo exige un solo archivo de base");
  fs.copyFileSync(b.url.replace(/^file:/, ""), archivo);
  await b.cerrar();
  await liberarNativos();
  PLANTILLAS.set(dir, archivo);
  return archivo;
}
async function fixture(dir: string, modo: Modo = { fk: true, rt: false }) {
  const origen = await plantilla(dir);
  const carpeta = fs.mkdtempSync(path.join(RAIZ, "base-"));
  const archivo = path.join(carpeta, "base.db");
  fs.copyFileSync(origen, archivo);
  const url = `file:${archivo}`;
  assertBaseLocal(process.env, url);
  const c = crearClienteDb(url);
  const x = (s: string, a: any[] = []) => c.execute({ sql: s, args: a });
  await x(`PRAGMA foreign_keys = ${modo.fk ? "ON" : "OFF"}`);
  await x(`PRAGMA recursive_triggers = ${modo.rt ? "ON" : "OFF"}`);
  assert.equal(Number((await x("PRAGMA foreign_keys")).rows[0][0]), modo.fk ? 1 : 0);
  assert.equal(Number((await x("PRAGMA recursive_triggers")).rows[0][0]), modo.rt ? 1 : 0);
  const b = { async cerrar() { c.close(); fs.rmSync(carpeta, { recursive: true, force: true }); await liberarNativos(); } };
  return { b, c, x };
}

const huella = async (c: Client) => {
  const tablas = (await c.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%' AND name <> 'vortice_migraciones' ORDER BY name")).rows.map((r) => String(r.name));
  const h = createHash("sha256");
  for (const t of tablas) h.update(t + JSON.stringify((await c.execute(`SELECT * FROM ${t}`)).rows.map((r) => JSON.stringify(Object.values(r))).sort()));
  return h.digest("hex");
};

// Huella ligera por ataque: filas de todas las tablas (una sola consulta) y contenido de la tabla atacada.
// La huella completa de todas las tablas se compara al inicio y al final de cada serie de ataques.
let TABLAS: string[] | null = null;
const ligera = async (c: Client, tabla: string) => {
  TABLAS ??= (await c.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%' AND name <> 'vortice_migraciones' ORDER BY name")).rows.map((r) => String(r.name));
  const cuentas = (await c.execute(TABLAS.map((t) => `SELECT '${t}' AS t, COUNT(*) AS n FROM ${t}`).join(" UNION ALL "))).rows.map((r) => `${r.t}=${r.n}`).join(",");
  const filas = (await c.execute(`SELECT * FROM ${tabla}`)).rows.map((r) => JSON.stringify(Object.values(r))).sort().join("|");
  return createHash("sha256").update(cuentas + filas).digest("hex");
};

// ── Ataques: SQL por tabla y verbo ──
// `nuevo`: ningún trigger de 0001 ni clave foránea detiene este ataque antes que 0003; con las claves
// foráneas apagadas debe fallar por el trigger de 0003 (no se acepta cualquier otro error).
type Ataque = { id: string; tabla: string; sql: string; nuevo?: boolean };
type Def = { tabla: string; cols: string; unicas: string | null; set: string };
const DEFS = {
  kp: { tabla: "knowledge_prerequisites", cols: "id,domain_version_id,item_id,prerequisite_item_id,relation,justification,confidence", unicas: "domain_version_id,item_id,prerequisite_item_id", set: "relation = excluded.relation" },
  kdv: { tabla: "knowledge_domain_versions", cols: "id,domain_id,version,status,created_by", unicas: "domain_id,version", set: "status = excluded.status" },
  ki: { tabla: "knowledge_items", cols: "id,domain_id,code", unicas: "domain_id,code", set: "domain_id = excluded.domain_id" },
  kd: { tabla: "knowledge_domains", cols: "id,level_subject_id,name", unicas: null, set: "level_subject_id = excluded.level_subject_id" },
  co: { tabla: "curriculum_objectives", cols: "id,level_subject_id,official_code,text,source_url,source_year", unicas: "level_subject_id,official_code,source_year", set: "level_subject_id = excluded.level_subject_id" },
  kiv: { tabla: "knowledge_item_versions", cols: "id,item_id,domain_version_id,domain_id,name,operational_definition", unicas: "domain_version_id,item_id", set: "name = excluded.name" },
} satisfies Record<string, Def>;
// Los cuatro verbos de sustitución, contra la clave primaria o contra la clave única.
function verbos(id: string, d: Def, vals: string, porUnica = false, nuevo = true): Ataque[] {
  const objetivo = porUnica && d.unicas ? `(${d.unicas})` : "(id)";
  const ins = (cabeza: string, cola = "") => `${cabeza} INTO ${d.tabla} (${d.cols}) VALUES (${vals}) ${cola}`.trim();
  return [
    { id: `${id} REPLACE`, tabla: d.tabla, sql: ins("INSERT OR REPLACE"), nuevo },
    { id: `${id} OR IGNORE`, tabla: d.tabla, sql: ins("INSERT OR IGNORE"), nuevo },
    { id: `${id} ON CONFLICT DO UPDATE`, tabla: d.tabla, sql: ins("INSERT", `ON CONFLICT${objetivo} DO UPDATE SET ${d.set}`), nuevo },
    { id: `${id} ON CONFLICT DO NOTHING`, tabla: d.tabla, sql: ins("INSERT", "ON CONFLICT DO NOTHING"), nuevo },
  ];
}
const edge = (id: string, dv: string, i: string, p: string) => `'${id}','${dv}','${i}','${p}','contributiva','otra','baja'`;
const itemv = (id: string, item: string, dv: string, dom: string) => `'${id}','${item}','${dv}','${dom}','REEMPLAZO','d'`;
const dver = (id: string, dom: string, ver: number, st = "borrador") => `'${id}','${dom}',${ver},'${st}','${AU}'`;

function ataques(): Ataque[] {
  const editable = (e: string) => e === "borrador" || e === "en_revision";
  const out: Ataque[] = [];
  for (const estado of ESTADOS) {
    const k = COD[estado], e = VACIAS[estado], s = `[${estado}]`;
    // Aristas: mover la arista a un borrador, sustituirla en su versión y sustituirla por la clave única.
    out.push(...verbos(`KP mover a un borrador ${s}`, DEFS.kp, edge(`${k}e1`, `${k}9`, `${k}b`, `${k}a`)));
    out.push(...verbos(`KP misma versión ${s}`, DEFS.kp, edge(`${k}e1`, `${k}1`, `${k}b`, `${k}a`), false, editable(estado)));
    out.push(...verbos(`KP por clave única, otro id ${s}`, DEFS.kp, edge(`${k}e1x`, `${k}1`, `${k}b`, `${k}a`), true, editable(estado)));
    // Versiones de dominio con contenidos y vacías.
    out.push(...verbos(`KDV con contenidos, por id ${s}`, DEFS.kdv, dver(`${k}1`, k, 1)));
    out.push(...verbos(`KDV con contenidos, por (dominio, número) ${s}`, DEFS.kdv, dver(`${k}1x`, k, 1), true));
    out.push(...verbos(`KDV con contenidos, por id con otro número ${s}`, DEFS.kdv, dver(`${k}1`, k, 2)));
    out.push(...verbos(`KDV vacía, por id con otro número ${s}`, DEFS.kdv, dver(`${e}1`, e, 2)));
    out.push(...verbos(`KDV vacía, por id ${s}`, DEFS.kdv, dver(`${e}1`, e, 1)));
    out.push(...verbos(`KDV vacía, por (dominio, número) ${s}`, DEFS.kdv, dver(`${e}1x`, e, 1), true));
    // Versiones de contenido: mover a un borrador, misma versión, por la clave única.
    out.push(...verbos(`KIV mover a un borrador ${s}`, DEFS.kiv, itemv(`${k}a1`, `${k}a`, `${k}9`, k)));
    out.push(...verbos(`KIV misma versión ${s}`, DEFS.kiv, itemv(`${k}a1`, `${k}a`, `${k}1`, k), false, editable(estado)));
    out.push(...verbos(`KIV por clave única, otro id ${s}`, DEFS.kiv, itemv(`${k}a1x`, `${k}a`, `${k}1`, k), true, editable(estado)));
    // Contenidos y dominios con dependientes.
    out.push(...verbos(`KI con versiones, por id ${s}`, DEFS.ki, `'${k}a','dz','${k}a'`));
    out.push(...verbos(`KI con versiones, por (dominio, código) ${s}`, DEFS.ki, `'${k}anuevo','${k}','${k}a'`, true));
    out.push(...verbos(`KD con versiones ${s}`, DEFS.kd, `'${k}','ls-len-6b','${k}'`));
    // Relaciones y referencias a la versión: UPDATE OR REPLACE.
    out.push({ id: `KP UPDATE OR REPLACE id ${s}`, tabla: "knowledge_prerequisites", sql: `UPDATE OR REPLACE knowledge_prerequisites SET id='${k}x9' WHERE id='${k}e1'` });
    out.push({ id: `KP UPDATE OR REPLACE mover ${s}`, tabla: "knowledge_prerequisites", sql: `UPDATE OR REPLACE knowledge_prerequisites SET domain_version_id='${k}9' WHERE id='${k}e1'` });
    out.push({ id: `KIV UPDATE OR REPLACE mover ${s}`, tabla: "knowledge_item_versions", sql: `UPDATE OR REPLACE knowledge_item_versions SET domain_version_id='${k}1' WHERE id='${k}a9'` });
    out.push({ id: `KDV UPDATE OR REPLACE número ${s}`, tabla: "knowledge_domain_versions", sql: `UPDATE OR REPLACE knowledge_domain_versions SET version=1 WHERE id='${k}9'` });
  }
  // Filas sin dependientes (la protección no puede depender de las claves foráneas) y claves únicas.
  out.push(...verbos("KI sin versiones, por id", DEFS.ki, "'z','dP','Z'"));
  out.push(...verbos("KD sin versiones, por id", DEFS.kd, "'dz','ls-len-6b','dz'"));
  out.push(...verbos("CO vinculado, por id", DEFS.co, "'oa1','ls-len-6b','M1','t','https://e.test',2018"));
  out.push(...verbos("CO sin vínculos, por id", DEFS.co, "'oa3','ls-len-6b','M3','t','https://e.test',2018"));
  out.push(...verbos("CO por (asignatura, código, año), otro id", DEFS.co, "'oa3x','ls-mat-5b','M3','t','https://e.test',2018", true));
  out.push(...verbos("KIV borrador sin hijos, por id", DEFS.kiv, itemv("zq1", "zq", "dP9", "dP")));
  out.push(...verbos("KP borrador, por id", DEFS.kp, edge("dBy9", "dP9", "dPb", "dPa")));
  out.push({ id: "KI UPDATE OR REPLACE código", tabla: "knowledge_items", sql: "UPDATE OR REPLACE knowledge_items SET code='dBa' WHERE id='z'" });
  out.push({ id: "CO UPDATE OR REPLACE id", tabla: "curriculum_objectives", sql: "UPDATE OR REPLACE curriculum_objectives SET id='oa2' WHERE id='oa3'" });
  out.push({ id: "CO UPDATE OR REPLACE código", tabla: "curriculum_objectives", sql: "UPDATE OR REPLACE curriculum_objectives SET official_code='M1' WHERE id='oa3'" });
  out.push({ id: "KP UPDATE OR REPLACE pareja", tabla: "knowledge_prerequisites", sql: "UPDATE OR REPLACE knowledge_prerequisites SET item_id='dBb', prerequisite_item_id='dBa' WHERE id='dBx9'" });
  // Una versión de dominio no nace avanzada ni con validador preinstalado.
  const nace = (id: string, st: string, val: string, pub: string) =>
    `INSERT INTO knowledge_domain_versions (id,domain_id,version,status,created_by,validated_by,published_at) VALUES ('${id}','dn',${100 + Number(id.slice(1))},'${st}','${AU}',${val},${pub})`;
  out.push({ id: "KDV nace en_revision", tabla: "knowledge_domain_versions", sql: nace("n1", "en_revision", "NULL", "NULL"), nuevo: true });
  out.push({ id: "KDV nace validada", tabla: "knowledge_domain_versions", sql: nace("n2", "validada", `'${VA}'`, "NULL"), nuevo: true });
  out.push({ id: "KDV nace publicada", tabla: "knowledge_domain_versions", sql: nace("n3", "publicada", `'${VA}'`, "1"), nuevo: true });
  out.push({ id: "KDV nace retirada", tabla: "knowledge_domain_versions", sql: nace("n4", "retirada", `'${VA}'`, "1"), nuevo: true });
  out.push({ id: "KDV nace borrador con fecha de publicación", tabla: "knowledge_domain_versions", sql: nace("n6", "borrador", "NULL", "1"), nuevo: false });
  out.push({ id: "KDV nace borrador con validador", tabla: "knowledge_domain_versions", sql: nace("n5", "borrador", `'${VA}'`, "NULL"), nuevo: true });
  return out;
}

// Los bypasses originales que deben reproducirse en 0001+0002 (con las claves foráneas activas).
const ORIGINALES: Ataque[] = [];
let BYPASS_ARISTA: Ataque;
{
  const todos = ataques();
  const pick = (id: string) => { const a = todos.find((t) => t.id === id); assert.ok(a, id); return a; };
  for (const e of NO_EDITABLES) ORIGINALES.push(pick(`KP mover a un borrador [${e}] REPLACE`));
  BYPASS_ARISTA = pick("KP mover a un borrador [publicada] REPLACE");
  for (const e of ["validada", "publicada", "retirada"] as const) ORIGINALES.push(pick(`KDV vacía, por id [${e}] REPLACE`), pick(`KDV vacía, por (dominio, número) [${e}] REPLACE`));
  for (const id of ["KI sin versiones, por id REPLACE", "KD sin versiones, por id REPLACE", "CO sin vínculos, por id REPLACE", "KDV nace en_revision", "KDV nace validada", "KDV nace publicada", "KDV nace retirada", "KDV nace borrador con validador"]) ORIGINALES.push(pick(id));
}
// Bypasses que hoy detiene solo la clave foránea: con las claves foráneas apagadas se reproducen.
const SOLO_FK_APAGADAS: string[] = [
  "KIV mover a un borrador [publicada] REPLACE", "KIV mover a un borrador [validada] REPLACE", "KDV con contenidos, por id [publicada] REPLACE",
  "KI con versiones, por id [publicada] REPLACE", "KD con versiones [publicada] REPLACE", "CO vinculado, por id REPLACE",
];

const salida: string[] = [];
let casos = 0;
const nota = (s: string) => salida.push(s);
const caso = async (id: string, nombre: string, f: () => Promise<unknown>) => { await f(); casos++; nota(`  ✓ ${id.padEnd(4)} ${nombre}`); };
const intento = async (c: Client, sql: string) => { try { await c.execute(sql); return { ok: true as const, error: "" }; } catch (e) { return { ok: false as const, error: String((e as Error).message) }; } };

try {
  // ── I1: reproducir los bypasses originales ANTES de la corrección ──
  await caso("I1", `reproduce ${ORIGINALES.length} bypasses originales con solo 0001 y 0002 (FK activas)`, async () => {
    for (const a of ORIGINALES) {
      const { b, c } = await fixture(dirAntes);
      const antes = await huella(c);
      const r = await intento(c, a.sql);
      assert.equal(r.ok, true, `${a.id}: debía reproducirse, pero falló: ${r.error}`);
      assert.notEqual(await huella(c), antes, `${a.id}: debía cambiar la base`);
      await b.cerrar();
    }
  });
  await caso("I2", `reproduce ${SOLO_FK_APAGADAS.length} bypasses que antes solo detenía la clave foránea (FK apagadas)`, async () => {
    for (const id of SOLO_FK_APAGADAS) {
      const a = ataques().find((t) => t.id === id)!;
      const { b, c } = await fixture(dirAntes, { fk: false, rt: false });
      const antes = await huella(c);
      const r = await intento(c, a.sql);
      assert.equal(r.ok, true, `${a.id}: con FK apagadas debía reproducirse: ${r.error}`);
      assert.notEqual(await huella(c), antes, a.id);
      await b.cerrar();
    }
  });
  await caso("I3", "con recursive_triggers activo en 0001+0002, qué bypasses siguen (informativo, aristas y versiones vacías)", async () => {
    for (const id of ["KP mover a un borrador [publicada] REPLACE", "KP mover a un borrador [validada] REPLACE", "KDV vacía, por id [publicada] REPLACE", "KDV vacía, por id [validada] REPLACE", "KI sin versiones, por id REPLACE"]) {
      const a = ataques().find((t) => t.id === id)!;
      const { b, c } = await fixture(dirAntes, { fk: true, rt: true });
      const antes = await huella(c);
      const r = await intento(c, a.sql);
      nota(`      rt=ON, antes de 0003: ${id.padEnd(52)} ${r.ok ? (await huella(c)) !== antes ? "ACEPTADA y cambió la base" : "aceptada sin cambio" : "rechazada (" + r.error.replace(/^SQLITE_CONSTRAINT[A-Z_]*: /, "").slice(0, 55) + ")"}`);
      await b.cerrar();
    }
  });

  // ── I4: la migración se aplica sobre una base con datos y no deja deriva ──
  await caso("I4", "0003 se aplica sobre una base ya poblada; sin deriva; segunda aplicación vacía", async () => {
    const { b, c } = await fixture(dirAntes);
    const antes = await huella(c);
    assert.deepEqual(await migrar(c, DIR_DESPUES), { aplicadas: ["0003_integridad_catalogo.sql"] });
    assert.equal(await huella(c), antes, "los datos no cambian al migrar");
    assert.equal((await verificarDeriva(c)).ok, true);
    assert.deepEqual(await migrar(c, DIR_DESPUES), { aplicadas: [] });
    const r = await intento(c, BYPASS_ARISTA.sql);
    assert.match(r.error, /no se sustituye/);
    assert.equal(r.ok, false, "tras migrar, el bypass ya no se reproduce");
    await b.cerrar();
  });

  // ── I5: cada ataque queda rechazado, sin cambios parciales, en las cuatro combinaciones ──
  const modos: Modo[] = [{ fk: true, rt: false }, { fk: false, rt: false }, { fk: true, rt: true }, { fk: false, rt: true }];
  for (const [i, modo] of modos.entries()) {
    await caso(`I5.${i + 1}`, `tras 0003, todos los ataques rechazados y sin cambios (claves foráneas ${modo.fk ? "activas" : "APAGADAS"}, recursive_triggers ${modo.rt ? "ACTIVO" : "apagado"})`, async () => {
      const { b, c } = await fixture(DIR_DESPUES, modo);
      let n = 0;
      const inicio = await huella(c);
      for (const a of ataques()) {
        const antes = await ligera(c, a.tabla);
        const r = await intento(c, a.sql);
        assert.equal(r.ok, false, `${a.id} [fk=${modo.fk} rt=${modo.rt}] debía rechazarse`);
        assert.match(r.error, /^SQLITE_CONSTRAINT/, `${a.id}: debe fallar por una restricción, no por un error de la sentencia: ${r.error}`);
        if (a.nuevo && !modo.fk) assert.match(r.error, /no se sustituye|nace en borrador/, `${a.id}: sin claves foráneas debe detenerlo el trigger de 0003: ${r.error}`);
        assert.equal(await ligera(c, a.tabla), antes, `${a.id} [fk=${modo.fk} rt=${modo.rt}]: modificación parcial`);
        n++;
      }
      assert.equal(await huella(c), inicio, "tras todos los ataques, ninguna tabla cambió");
      nota(`      ${n} ataques rechazados (${modo.fk ? "FK" : "sin FK"}, rt=${modo.rt ? "ON" : "OFF"})`);
      await b.cerrar();
    });
  }
  await caso("I6", "sin claves foráneas, la defensa la pone la migración: los ataques se rechazan por sus triggers", async () => {
    const { b, c } = await fixture(DIR_DESPUES, { fk: false, rt: false });
    for (const id of SOLO_FK_APAGADAS) {
      const a = ataques().find((t) => t.id === id)!;
      const r = await intento(c, a.sql);
      assert.equal(r.ok, false, id);
      assert.match(r.error, /no se sustituye/, `${id}: ${r.error}`);
      assert.doesNotMatch(r.error, /FOREIGN KEY/, id);
    }
    await b.cerrar();
  });

  // ── I7: atomicidad: un lote con una sustitución indebida no deja nada a medias ──
  await caso("I7", "un lote con una sustitución rechazada se revierte entero", async () => {
    const { b, c } = await fixture(DIR_DESPUES);
    const antes = await huella(c);
    await assert.rejects(c.batch([
      "INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES ('lote-ok','ls-mat-5b','x')",
      "INSERT INTO knowledge_items (id, domain_id, code) VALUES ('lote-ok-i','lote-ok','L1')",
      BYPASS_ARISTA.sql,
    ], "write"), /no se sustituye/);
    assert.equal(await huella(c), antes, "ninguna de las filas válidas del lote quedó");
    await b.cerrar();
  });

  // ── I8: lo legítimo sigue funcionando (controles) ──
  for (const [i, modo] of modos.entries()) {
    await caso(`I8.${i + 1}`, `controles: el flujo normal sigue (FK ${modo.fk ? "activas" : "apagadas"}, rt=${modo.rt ? "ON" : "OFF"})`, async () => {
      const { b, c, x } = await fixture(DIR_DESPUES, modo);
      // filas nuevas sin conflicto en cada tabla
      await x("INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES ('nd','ls-mat-5b','nuevo')");
      await x("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES ('nd1','nd',1,'borrador',?)", [AU]);
      await x("INSERT INTO knowledge_items (id, domain_id, code) VALUES ('na','nd','NA'),('nb','nd','NB')");
      await x("INSERT INTO knowledge_item_versions (id,item_id,domain_version_id,domain_id,name,operational_definition) VALUES ('na1','na','nd1','nd','n','d'),('nb1','nb','nd1','nd','n','d')");
      await x("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa9','ls-mat-5b','M9','t','https://e.test',2018)");
      await x("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES ('na1','oa9'),('nb1','oa9')");
      await x("INSERT INTO knowledge_prerequisites (id,domain_version_id,item_id,prerequisite_item_id,relation,justification,confidence) VALUES ('ne1','nd1','nb','na','necesaria','j','alta')");
      // la validación de la arista sigue siendo de otra persona
      await assert.rejects(x("UPDATE knowledge_prerequisites SET validated_by=?, validated_at=1 WHERE id='ne1'", [AU]), /no valida sus aristas/);
      await x("UPDATE knowledge_prerequisites SET validated_by=?, validated_at=1 WHERE id='ne1'", [VA]);
      // ediciones de un borrador y cambios que no chocan
      await x("UPDATE knowledge_item_versions SET name='editado' WHERE id='na1'");
      await x("UPDATE knowledge_items SET code='NA2' WHERE id='na'");
      await x("UPDATE curriculum_objectives SET text='otro texto' WHERE id='oa9'");
      await x("UPDATE curriculum_objectives SET official_code='M10' WHERE id='oa9'");
      // editar un contenido anula la validación de sus aristas (P-H2-2): se vuelve a validar
      await x("UPDATE knowledge_prerequisites SET validated_by=?, validated_at=3 WHERE id='ne1'", [VA]);
      // transiciones de la versión de dominio
      await x("UPDATE knowledge_domain_versions SET status='en_revision' WHERE id='nd1'");
      await x("UPDATE knowledge_domain_versions SET status='validada', validated_by=? WHERE id='nd1'", [VA]);
      await x("UPDATE knowledge_domain_versions SET status='publicada', published_at=2 WHERE id='nd1'");
      await x("UPDATE knowledge_domain_versions SET status='retirada' WHERE id='nd1'");
      // y lo que ya fallaba sigue fallando
      await assert.rejects(x("INSERT INTO knowledge_items (id, domain_id, code) VALUES ('dup','nd','NB')"), /UNIQUE|no se sustituye/);
      await b.cerrar();
    });
  }
  // sin regresión: los vínculos ya protegidos siguen protegidos
  await caso("I9", "vínculos de OA, módulo y recurso: sin regresión", async () => {
    const { b, c } = await fixture(DIR_DESPUES);
    for (const k of ["dV", "dP", "dX"]) {
      for (const sql of [
        `INSERT OR REPLACE INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES ('${k}a1','oa1')`,
        `INSERT OR REPLACE INTO knowledge_item_modules (item_version_id, learning_objective_id) VALUES ('${k}a1','lo-mat')`,
        `INSERT OR REPLACE INTO knowledge_item_resources (item_version_id, resource_id, role) VALUES ('${k}a1','wr-mat','explicacion')`,
      ]) assert.equal((await intento(c, sql)).ok, false, sql);
    }
    await b.cerrar();
  });
  await caso("I11", "las declaraciones UNIQUE de las claves siguen presentes (el trigger las precede, así que se verifica el catálogo)", async () => {
    const { b, c } = await fixture(DIR_DESPUES);
    const unicos = async (t: string) => {
      const out: string[] = [];
      for (const ix of (await c.execute(`PRAGMA index_list(${t})`)).rows.filter((r) => Number(r.unique) === 1)) {
        out.push((await c.execute(`PRAGMA index_info(${String(ix.name)})`)).rows.map((r) => String(r.name)).join(","));
      }
      return out;
    };
    assert.ok((await unicos("knowledge_prerequisites")).includes("domain_version_id,item_id,prerequisite_item_id"));
    assert.ok((await unicos("knowledge_domain_versions")).includes("domain_id,version"));
    assert.ok((await unicos("knowledge_items")).includes("domain_id,code"));
    assert.ok((await unicos("curriculum_objectives")).includes("level_subject_id,official_code,source_year"));
    assert.ok((await unicos("knowledge_item_versions")).includes("domain_version_id,item_id"));
    await b.cerrar();
  });
  await caso("I10", "los 12 triggers de la migración están en el manifiesto", async () => {
    const { b, c } = await fixture(DIR_DESPUES);
    const triggers = (await c.execute("SELECT name FROM sqlite_master WHERE type='trigger' ORDER BY name")).rows.map((r) => String(r.name));
    for (const n of ["kp_no_sustituir", "kdv_no_sustituir", "ki_no_sustituir", "kd_no_sustituir", "co_no_sustituir", "kiv_no_sustituir", "kdv_nace_borrador",
      "ki_codigo_unico", "co_clave_unica", "co_id_inmutable", "kp_clave_unica", "kp_id_inmutable"]) assert.ok(triggers.includes(n), n);
    assert.equal(triggers.filter((t) => /_no_sustituir$|_nace_borrador$|_codigo_unico$|_clave_unica$|_id_inmutable$/.test(t) && !/^(qv_|qf_|qvoid_)/.test(t)).length, 12);
    await b.cerrar();
  });
} finally {
  fs.rmSync(dirAntes, { recursive: true, force: true });
  fs.rmSync(RAIZ, { recursive: true, force: true });
  await liberarNativos();
}
console.log(salida.join("\n"));
console.log(`integridad-db: ok (${casos} casos, ${ataques().length} ataques por modo)`);
