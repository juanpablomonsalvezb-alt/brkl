// Migraciones del motor Vórtice con SQL propio (IMP-002) y detección de deriva (IMP-003).
// Criterio de la prueba D4 de E0, aceptado: el esquema protegido (triggers, índices) no pasa por
// drizzle-kit, que los borra sin aviso. Basado en `migrar` v2 del arnés E0 (2edf702), reescrito:
// el arnés es desechable y no se copia como código de producción.
//
// Archivos: migrations/vortice/NNNN_nombre.sql, sentencias separadas por `--> statement-breakpoint`.
// Una línea `-- declara: objeto_a, objeto_b` autoriza a la migración a retirar o cambiar esos objetos
// protegidos; sin ella, perder un trigger o índice existente revierte la migración completa.
import type { Client, Transaction } from "@libsql/client";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { verificarClavesForaneas } from "./cliente";

export const DIR_MIGRACIONES = "migrations/vortice";
export const REGISTRO = "vortice_migraciones";
const NOMBRE_VALIDO = /^\d{4}_[a-z0-9_]+\.sql$/;
const SEPARADOR = /^\s*-->\s*statement-breakpoint\s*$/m;
const DECLARA = /^--\s*declara:\s*(.+)$/gm;

// El registro es solo inserción: nadie lo corrige desde la aplicación (el acceso directo a la base
// lo elude y solo se detecta después: R-01 de E0, riesgo aceptado con la prueba D4).
const BOOTSTRAP = [
  `CREATE TABLE IF NOT EXISTS ${REGISTRO} (nombre TEXT PRIMARY KEY, suma TEXT NOT NULL, objetos TEXT NOT NULL, aplicada_en REAL NOT NULL)`,
  `CREATE TRIGGER IF NOT EXISTS ${REGISTRO}_sin_update BEFORE UPDATE ON ${REGISTRO} BEGIN SELECT RAISE(ABORT, '${REGISTRO} es solo inserción'); END`,
  `CREATE TRIGGER IF NOT EXISTS ${REGISTRO}_sin_delete BEFORE DELETE ON ${REGISTRO} BEGIN SELECT RAISE(ABORT, '${REGISTRO} es solo inserción'); END`,
];
const OBJETOS_REGISTRO = [`table ${REGISTRO}`, `trigger ${REGISTRO}_sin_update`, `trigger ${REGISTRO}_sin_delete`];

type Lector = Pick<Client | Transaction, "execute">;
export type Obj = { type: string; name: string; sql: string };
export interface Migracion { nombre: string; suma: string; sentencias: string[]; declara: string[] }
export interface Deriva { ok: boolean; sinRegistro: boolean; faltantes: string[]; alterados: string[] }

// SQLite reescribe comillas y espacios al guardar o renombrar: se comparan normalizados.
const norm = (s: string) => s.replace(/[`"]/g, "").replace(/\s+/g, " ").replace(/;$/, "").trim();

async function objetos(c: Lector): Promise<Obj[]> {
  const r = await c.execute(
    "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%' ORDER BY type, name",
  );
  return r.rows.map((x) => ({ type: String(x.type), name: String(x.name), sql: norm(String(x.sql)) }));
}

export function leerMigraciones(dir = DIR_MIGRACIONES): Migracion[] {
  if (!fs.existsSync(dir)) return [];
  const archivos = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const malos = archivos.filter((f) => !NOMBRE_VALIDO.test(f));
  if (malos.length) throw new Error(`Nombre de migración inválido (NNNN_nombre.sql): ${malos.join(", ")}`);
  return archivos.map((nombre) => {
    const texto = fs.readFileSync(path.join(dir, nombre), "utf8");
    const declara = [...texto.matchAll(DECLARA)].flatMap((m) => m[1].split(",").map((s) => s.trim()).filter(Boolean));
    const sentencias = texto.split(SEPARADOR).map((s) => s.trim()).filter((s) => s.replace(/^--.*$/gm, "").trim());
    if (!sentencias.length) throw new Error(`Migración vacía: ${nombre}`);
    return { nombre, suma: createHash("sha256").update(texto).digest("hex"), sentencias, declara };
  });
}

async function hayRegistro(c: Lector): Promise<boolean> {
  const r = await c.execute({ sql: "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?", args: [REGISTRO] });
  return r.rows.length > 0;
}

// Estado esperado = plegar el registro en orden. Sin listas escritas a mano.
async function esperado(c: Lector): Promise<Map<string, Obj>> {
  const esp = new Map<string, Obj>();
  const r = await c.execute(`SELECT objetos FROM ${REGISTRO} ORDER BY nombre`);
  for (const fila of r.rows) {
    const { crea, retira } = JSON.parse(String(fila.objetos)) as { crea: Obj[]; retira: string[] };
    for (const o of crea) esp.set(o.name, o);
    for (const n of retira) esp.delete(n);
  }
  return esp;
}

// Deriva: objetos que las migraciones crearon y que hoy faltan o cambiaron. Los objetos heredados
// (creados con db:push antes del motor) no se juzgan: no hay estado esperado para ellos.
export async function verificarDeriva(c: Lector): Promise<Deriva> {
  if (!(await hayRegistro(c))) return { ok: true, sinRegistro: true, faltantes: [], alterados: [] };
  const real = new Map((await objetos(c)).map((o) => [o.name, o]));
  const faltantes = OBJETOS_REGISTRO.filter((n) => !real.has(n.split(" ")[1]));
  const alterados: string[] = [];
  for (const o of (await esperado(c)).values()) {
    const actual = real.get(o.name);
    if (!actual) faltantes.push(`${o.type} ${o.name}`);
    else if (actual.sql !== o.sql) alterados.push(`${o.type} ${o.name}`);
  }
  return { ok: !faltantes.length && !alterados.length, sinRegistro: false, faltantes, alterados };
}

async function aplicar(c: Client, m: Migracion, protegidasPorMigracion: Set<string>): Promise<void> {
  const t = await c.transaction("write");
  try {
    const antes = await objetos(t);
    for (const s of m.sentencias) await t.execute(s);
    const despues = await objetos(t);
    const mapaAntes = new Map(antes.map((o) => [o.name, o]));
    const mapaDespues = new Map(despues.map((o) => [o.name, o]));
    const protegidos = antes.filter((o) => o.type === "trigger" || o.type === "index" || protegidasPorMigracion.has(o.name));
    const perdidas = protegidos
      .filter((o) => !m.declara.includes(o.name) && mapaDespues.get(o.name)?.sql !== o.sql)
      .map((o) => `${o.type} ${o.name}`);
    if (perdidas.length) {
      throw new Error(`Migración ${m.nombre} elimina o altera objetos protegidos sin declararlo: ${perdidas.join(", ")}`);
    }
    const crea = despues.filter((o) => mapaAntes.get(o.name)?.sql !== o.sql);
    const retira = antes.filter((o) => !mapaDespues.has(o.name)).map((o) => o.name);
    await t.execute({
      sql: `INSERT INTO ${REGISTRO} (nombre, suma, objetos, aplicada_en) VALUES (?, ?, ?, unixepoch('subsec'))`,
      args: [m.nombre, m.suma, JSON.stringify({ crea, retira })],
    });
    await t.commit();
  } catch (e) {
    await t.rollback().catch(() => {});
    throw e;
  }
}

// Aplica las migraciones pendientes, en orden y una transacción por archivo. Antes exige:
// claves foráneas activas, registro coherente con los archivos y ausencia de deriva.
export async function migrar(c: Client, dir = DIR_MIGRACIONES): Promise<{ aplicadas: string[] }> {
  const migraciones = leerMigraciones(dir);
  await verificarClavesForaneas(c);
  await c.batch(BOOTSTRAP, "write");

  const registradas = (await c.execute(`SELECT nombre, suma FROM ${REGISTRO} ORDER BY nombre`)).rows
    .map((r) => ({ nombre: String(r.nombre), suma: String(r.suma) }));
  for (const r of registradas) {
    const m = migraciones.find((x) => x.nombre === r.nombre);
    if (!m) throw new Error(`Migración aplicada sin archivo: ${r.nombre}`);
    if (m.suma !== r.suma) throw new Error(`Migración alterada después de aplicada: ${r.nombre}`);
  }
  const ultima = registradas.at(-1)?.nombre;
  const pendientes = migraciones.filter((m) => !registradas.some((r) => r.nombre === m.nombre));
  const fueraDeOrden = pendientes.filter((m) => ultima && m.nombre < ultima).map((m) => m.nombre);
  if (fueraDeOrden.length) throw new Error(`Migración fuera de orden (anterior a ${ultima}): ${fueraDeOrden.join(", ")}`);

  const deriva = await verificarDeriva(c);
  if (!deriva.ok) throw new Error(`Deriva de esquema: faltan [${deriva.faltantes.join(", ")}], alterados [${deriva.alterados.join(", ")}]`);

  const aplicadas: string[] = [];
  for (const m of pendientes) {
    const protegidas = new Set((await esperado(c)).keys());
    await aplicar(c, m, protegidas);
    aplicadas.push(m.nombre);
  }
  return { aplicadas };
}

// Al arrancar: claves foráneas activas y sin deriva. Solo lee. Estricto fuera de producción;
// en producción solo registra el error hasta verificar el comportamiento de Turso (A1, no otorgada).
export async function asegurarIntegridad(c: Lector, o: { estricto: boolean }): Promise<void> {
  try {
    await verificarClavesForaneas(c);
    const d = await verificarDeriva(c);
    if (!d.ok) throw new Error(`Integridad: deriva de esquema; faltan [${d.faltantes.join(", ")}], alterados [${d.alterados.join(", ")}]`);
  } catch (e) {
    if (o.estricto) throw e;
    console.error(`[integridad] ${(e as Error).message}`);
  }
}
