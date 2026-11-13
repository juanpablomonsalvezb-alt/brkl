// R2: reconciliación de integridad de recursos heredados (SOLO LECTURA, por CLI, sin rutas HTTP).
// Detecta, sin corregir nada, inconsistencias entre weekly_resources, learning_objectives, los vínculos del
// catálogo (knowledge_item_resources / knowledge_item_modules) y los casos de tutoría (V-1..V-5).
//
// Uso:   TEST_DATABASE_URL=file:./copia.db npx tsx server/reconciliacionRecursos.ts [--json]
//        npx tsx server/reconciliacionRecursos.ts --db file:./copia.db [--json]
// Salida: 0 = ejecución COMPLETA y sin hallazgos; 1 = ejecución COMPLETA con hallazgos;
//         2 = ejecución INCOMPLETA o fallida (alguna consulta no pudo ejecutarse, o no se pudo abrir la base).
// Solo acepta bases locales `file:` ya existentes (nunca crea el archivo, nunca usa credenciales ni red).
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import type { Client } from "@libsql/client";
import { crearClienteDb } from "./cliente";
import { assertBaseLocal } from "./dbGuard";

export type Severidad = "alta" | "media" | "baja";
export interface Hallazgo {
  codigo: "V-1" | "V-2" | "V-3" | "V-4" | "V-5";
  consulta: string;            // identificador de la consulta que lo produjo (V-4 tiene cuatro)
  severidad: Severidad;
  recurso: string | null;
  modulo: string | null;
  asignatura: string | null;   // asignatura del módulo
  referencia: string | null;
  asignaturaReferencia: string | null;
  detalle: string;
}
export interface EstadoConsulta { consulta: string; estado: "ok" | "error"; hallazgos: number; error?: string }
export interface Reconciliacion {
  estado: "completa" | "incompleta";   // "completa" solo si TODAS las consultas se ejecutaron
  consultas: EstadoConsulta[];
  hallazgos: Hallazgo[];               // ordenados de forma determinista
}

const ALTA = "CASE WHEN dv.status IN ('validada','publicada','retirada') THEN 'alta' ELSE 'media' END";
const COLS = "codigo, severidad, recurso_id, modulo_id, asignatura_modulo, referencia, asignatura_ref, detalle";

// Cada consulta devuelve las columnas de COLS. Condiciones idénticas a las del cierre de decisiones.
const CONSULTAS: { id: string; codigo: Hallazgo["codigo"]; sql: string }[] = [
  { id: "V-1", codigo: "V-1", sql: `
    SELECT 'V-1' AS codigo, ${ALTA} AS severidad, l.resource_id AS recurso_id, w.learning_objective_id AS modulo_id,
           lo.level_subject_id AS asignatura_modulo, kd.id || '/v' || dv.version AS referencia,
           kd.level_subject_id AS asignatura_ref, 'version ' || dv.status || '; contenido ' || iv.item_id AS detalle
    FROM knowledge_item_resources l
    JOIN knowledge_item_versions iv ON iv.id = l.item_version_id
    JOIN knowledge_domain_versions dv ON dv.id = iv.domain_version_id
    JOIN knowledge_domains kd ON kd.id = iv.domain_id
    JOIN weekly_resources w ON w.id = l.resource_id
    JOIN learning_objectives lo ON lo.id = w.learning_objective_id
    WHERE lo.level_subject_id IS NOT kd.level_subject_id` },
  { id: "V-2", codigo: "V-2", sql: `
    SELECT 'V-2', ${ALTA}, NULL, l.learning_objective_id, lo.level_subject_id, kd.id || '/v' || dv.version,
           kd.level_subject_id, 'version ' || dv.status || '; contenido ' || iv.item_id
    FROM knowledge_item_modules l
    JOIN knowledge_item_versions iv ON iv.id = l.item_version_id
    JOIN knowledge_domain_versions dv ON dv.id = iv.domain_version_id
    JOIN knowledge_domains kd ON kd.id = iv.domain_id
    JOIN learning_objectives lo ON lo.id = l.learning_objective_id
    WHERE lo.level_subject_id IS NOT kd.level_subject_id` },
  { id: "V-3", codigo: "V-3", sql: `
    SELECT 'V-3', 'media', c.resource_id, w.learning_objective_id, lo.level_subject_id, 'caso ' || c.id, NULL,
           'objetivo del caso ' || c.learning_objective_id || ' / módulo del recurso ' || w.learning_objective_id
    FROM tutoring_cases c
    JOIN weekly_resources w ON w.id = c.resource_id
    JOIN learning_objectives lo ON lo.id = w.learning_objective_id
    WHERE c.resource_id IS NOT NULL AND w.learning_objective_id <> c.learning_objective_id` },
  { id: "V-4/resource_type", codigo: "V-4", sql: `
    SELECT 'V-4', 'media', w.id, w.learning_objective_id, NULL, NULL, NULL, 'resource_type=' || w.resource_type
    FROM weekly_resources w WHERE w.resource_type NOT IN ('video','infografia','audio','presentacion','reflexion')` },
  { id: "V-4/pedagogical_step", codigo: "V-4", sql: `
    SELECT 'V-4', 'media', w.id, w.learning_objective_id, NULL, NULL, NULL, 'pedagogical_step=' || w.pedagogical_step
    FROM weekly_resources w
    WHERE w.pedagogical_step IS NOT NULL AND w.pedagogical_step NOT IN ('ejemplo','practica_guiada','practica_independiente','reflexion')` },
  { id: "V-4/sort_order", codigo: "V-4", sql: `
    SELECT 'V-4', 'media', w.id, w.learning_objective_id, NULL, NULL, NULL, 'sort_order(' || typeof(w.sort_order) || ')=' || w.sort_order
    FROM weekly_resources w WHERE typeof(w.sort_order) <> 'integer'` },
  { id: "V-4/is_active", codigo: "V-4", sql: `
    SELECT 'V-4', 'media', w.id, w.learning_objective_id, NULL, NULL, NULL, 'is_active(' || typeof(w.is_active) || ')=' || w.is_active
    FROM weekly_resources w WHERE w.is_active IS NOT NULL AND (typeof(w.is_active) <> 'integer' OR w.is_active NOT IN (0, 1))` },
  { id: "V-5", codigo: "V-5", sql: `
    SELECT 'V-5', 'baja', w.id, w.learning_objective_id, NULL, NULL, NULL, 'tipo ' || w.resource_type || ' con reflection_prompts'
    FROM weekly_resources w WHERE w.reflection_prompts IS NOT NULL AND w.resource_type <> 'reflexion'` },
];
export const IDENTIFICADORES_CONSULTA = CONSULTAS.map((c) => c.id);

// Defensa en profundidad: ninguna consulta puede escribir.
for (const c of CONSULTAS) {
  if (!/^\s*SELECT\b/i.test(c.sql) || /\b(INSERT|UPDATE|DELETE|REPLACE|DROP|ALTER|CREATE|PRAGMA|ATTACH)\b/i.test(c.sql.replace(/'[^']*'/g, "''"))) {
    throw new Error(`Reconciliación: la consulta ${c.id} no es de solo lectura`);
  }
}

const texto = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
const clave = (h: Hallazgo) => [h.codigo, h.consulta, h.recurso ?? "", h.modulo ?? "", h.referencia ?? "", h.detalle];
const comparar = (a: Hallazgo, b: Hallazgo) => {
  const x = clave(a), y = clave(b);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;   // orden por unidades de código, no por locale
  return 0;
};

// Ejecuta las ocho consultas. Una consulta que falla se informa como error y la reconciliación queda
// "incompleta": nunca se devuelve un resultado parcial presentado como completo.
export async function reconciliar(client: Pick<Client, "execute">): Promise<Reconciliacion> {
  const consultas: EstadoConsulta[] = [];
  const hallazgos: Hallazgo[] = [];
  // query_only: la conexión rechaza cualquier escritura mientras dura la reconciliación; se restaura al terminar.
  let previo: string | null = null;
  try {
    previo = String((await client.execute("PRAGMA query_only")).rows[0]?.[0] ?? "0");
    await client.execute("PRAGMA query_only = 1");
  } catch (e) {
    // Sin poder garantizar solo lectura no se ejecuta nada.
    const error = `no se pudo activar la solo lectura: ${(e as Error).message}`;
    return { estado: "incompleta", consultas: CONSULTAS.map((c) => ({ consulta: c.id, estado: "error" as const, hallazgos: 0, error })), hallazgos: [] };
  }
  try {
    for (const c of CONSULTAS) {
      try {
        const r = await client.execute(c.sql);
        const filas = r.rows.map((f): Hallazgo => ({
          codigo: c.codigo, consulta: c.id, severidad: String(f[1]) as Severidad,
          recurso: texto(f[2]), modulo: texto(f[3]), asignatura: texto(f[4]), referencia: texto(f[5]),
          asignaturaReferencia: texto(f[6]), detalle: String(f[7] ?? ""),
        }));
        consultas.push({ consulta: c.id, estado: "ok", hallazgos: filas.length });
        hallazgos.push(...filas);
      } catch (e) {
        consultas.push({ consulta: c.id, estado: "error", hallazgos: 0, error: (e as Error).message });
      }
    }
  } finally {
    try { await client.execute(`PRAGMA query_only = ${previo === "1" ? 1 : 0}`); } catch { /* la conexión ya no existe */ }
  }
  hallazgos.sort(comparar);
  const completa = consultas.every((c) => c.estado === "ok");
  // Una ejecución incompleta no entrega hallazgos como si fueran el resultado: se conservan solo en `consultas`.
  return { estado: completa ? "completa" : "incompleta", consultas, hallazgos: completa ? hallazgos : [] };
}

// Los textos salen de la base: se neutralizan los caracteres de control antes de escribirlos en una terminal.
const limpio = (v: string) => v.replace(/[\u0000-\u001f\u007f-\u009f]/g, "?");

export function formatear(r: Reconciliacion): string {
  const l: string[] = [`RECONCILIACION ${r.estado === "completa" ? "COMPLETA" : "INCOMPLETA: NO ES UN RESULTADO VALIDO"}`];
  for (const c of r.consultas) l.push(`consulta ${c.consulta}: ${c.estado === "ok" ? `ok, ${c.hallazgos} hallazgo(s)` : `ERROR: ${limpio(c.error ?? "")}`}`);
  if (r.estado === "completa") {
    l.push(`hallazgos: ${r.hallazgos.length}`);
    for (const h of r.hallazgos) l.push([h.codigo, h.severidad, `recurso=${h.recurso ?? "-"}`, `modulo=${h.modulo ?? "-"}`, `asignatura=${h.asignatura ?? "-"}`, `referencia=${h.referencia ?? "-"}`, h.detalle].map(limpio).join(" | "));
  } else l.push("hallazgos: no disponibles (la ejecución no terminó)");
  return l.join("\n");
}

export const codigoSalida = (r: Reconciliacion) => (r.estado === "incompleta" ? 2 : r.hallazgos.length ? 1 : 0);

async function principal(): Promise<number> {
  const args = process.argv.slice(2);
  const i = args.indexOf("--db");
  const url = i >= 0 ? args[i + 1] : process.env.TEST_DATABASE_URL;
  const json = args.includes("--json");
  try {
    if (!url || !url.startsWith("file:")) throw new Error("se requiere una base local: --db file:<ruta> o TEST_DATABASE_URL=file:<ruta>");
    assertBaseLocal(process.env, url);
    const ruta = url.slice("file:".length).split("?")[0];
    if (!fs.existsSync(ruta)) throw new Error(`la base no existe (no se crea): ${ruta}`);
    const client = crearClienteDb(url);
    let r: Reconciliacion;
    try { r = await reconciliar(client); } finally { client.close(); }
    console.log(json ? JSON.stringify(r, null, 2) : formatear(r));
    return codigoSalida(r);
  } catch (e) {
    console.error(`RECONCILIACION INCOMPLETA: ${(e as Error).message}`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) void principal().then((c) => { process.exitCode = c; });
