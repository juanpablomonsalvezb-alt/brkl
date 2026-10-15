// Retención de datos claramente temporales (Ley 21.719: no guardar más de lo necesario).
// Funciones idempotentes: correrlas dos veces deja la base igual que correrlas una.
// Reciben db como parámetro para poder probarlas contra SQLite en memoria
// (script/vortice-db.check.ts). Ver docs/privacidad-datos.md.
import { lt } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";

type Db = LibSQLDatabase<typeof schema>;

// La presencia solo sirve 30s (ventana de "conectado"); 1 hora da margen de sobra.
export const RETENCION_PRESENCIA_MS = 60 * 60 * 1000;
// Eventos de embudo: comparar un año contra el anterior necesita ~12 meses.
export const RETENCION_EMBUDO_MESES = 12;

/** Borra presencia de Together sin latido en la última hora. Devuelve filas borradas. */
export async function purgarPresenciaVieja(db: Db, ahora = new Date()): Promise<number> {
  const corte = new Date(ahora.getTime() - RETENCION_PRESENCIA_MS);
  const r = await db.delete(schema.togetherPresence).where(lt(schema.togetherPresence.lastSeen, corte));
  return r.rowsAffected;
}

/** Borra eventos de embudo (anónimos) con más de 12 meses. Devuelve filas borradas. */
export async function purgarEventosEmbudoViejos(db: Db, ahora = new Date()): Promise<number> {
  const corte = new Date(ahora);
  corte.setMonth(corte.getMonth() - RETENCION_EMBUDO_MESES);
  const r = await db.delete(schema.funnelEvents).where(lt(schema.funnelEvents.createdAt, corte));
  return r.rowsAffected;
}
