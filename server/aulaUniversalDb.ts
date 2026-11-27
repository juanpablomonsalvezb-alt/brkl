// Repositorio BD para el Aula Universal UDL (M-R06 · D3 Fase 1).
// Migra las lecciones del piloto desde memoria (`aulaUniversalCatalogo.ts`) a la tabla
// `universal_lessons` y marca `level_subjects.delivery_mode = 'aula_universal'` en las unidades migradas.
// Nunca expone claves de respuesta (`respuestaCorrecta`) ni `explicacionCorrecta` al cliente.
import { asc, eq, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Client } from "@libsql/client";
import * as schema from "@shared/schema";
import { universalLessons } from "@shared/schema";
import type { LeccionUniversalPublica, PuertaAprendizaje } from "@shared/aulaUniversal";
import { obtenerLeccionesPilotoPublicas } from "./aulaUniversalCatalogo";
import { esEntornoEstrictoEsquema } from "./saludEsquema";
import { DOMINIO_PILOTO_PRACTICA_ID } from "./sembrarPilotoPractica";

export const VERSION_CATALOGO_AULA_PILOTO = 2;

const PUERTAS_MULTIMEDIA: readonly PuertaAprendizaje[] = ["video", "podcast", "presentacion"];

function normalizarPuertasPublicas(leccion: LeccionUniversalPublica): LeccionUniversalPublica {
  const puertas = { ...leccion.puertas };
  for (const tipo of PUERTAS_MULTIMEDIA) {
    const p = puertas[tipo];
    if (p && p.mediaUrl === undefined) {
      puertas[tipo] = { ...p, mediaUrl: null };
    }
  }
  return { ...leccion, puertas };
}

/**
 * Siembra idempotentemente las 5 lecciones del piloto en `universal_lessons` y activa
 * `delivery_mode = 'aula_universal'` en la asignatura de Matemática 5.º Básico.
 */
export async function sembrarLeccionesAulaUniversalSql(
  c: Pick<Client, "execute">,
  opts: { levelSubjectId?: string; learningObjectiveId?: string | null } = {},
): Promise<{ sembradas: number; levelSubjectId: string | null }> {
  let lsId = opts.levelSubjectId ?? null;
  if (!lsId) {
    const lsRow = (
      await c.execute(
        `SELECT ls.id
         FROM level_subjects ls
         LEFT JOIN subjects s ON s.id = ls.subject_id
         WHERE ls.id IN ('5b-matematica', 'ls-mat-5b')
            OR (ls.level_id = '5b' AND s.slug = 'matematica')
         ORDER BY CASE WHEN ls.id = '5b-matematica' THEN 0 WHEN ls.id = 'ls-mat-5b' THEN 1 ELSE 2 END
         LIMIT 1`,
      )
    ).rows[0];
    lsId = lsRow ? String(lsRow.id) : null;
  }

  const lsEfectivo = lsId ?? "5b-matematica";
  const lecciones = obtenerLeccionesPilotoPublicas().map(normalizarPuertasPublicas);
  const ahora = Math.floor(Date.now() / 1000);
  let sembradas = 0;

  for (let idx = 0; idx < lecciones.length; idx++) {
    const l = lecciones[idx];
    const id = `ul-${l.oaId}`;
    const knowledgeItemId = `${DOMINIO_PILOTO_PRACTICA_ID}-${l.oaId}`;
    const payload = JSON.stringify(l);
    const existente = (
      await c.execute({ sql: "SELECT version FROM universal_lessons WHERE oa_id = ? LIMIT 1", args: [l.oaId] })
    ).rows[0];
    if (!existente) {
      await c.execute({
        sql: `INSERT INTO universal_lessons
                (id, oa_id, level_subject_id, learning_objective_id, knowledge_item_id, version, sort_order, payload_json, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, l.oaId, lsEfectivo, opts.learningObjectiveId ?? null, knowledgeItemId, VERSION_CATALOGO_AULA_PILOTO, idx + 1, payload, ahora],
      });
      sembradas++;
    } else if (Number(existente.version ?? 0) < VERSION_CATALOGO_AULA_PILOTO) {
      await c.execute({
        sql: `UPDATE universal_lessons
              SET level_subject_id = ?, knowledge_item_id = ?, version = ?, sort_order = ?, payload_json = ?, updated_at = ?
              WHERE oa_id = ?`,
        args: [lsEfectivo, knowledgeItemId, VERSION_CATALOGO_AULA_PILOTO, idx + 1, payload, ahora, l.oaId],
      });
      sembradas++;
    }
  }

  if (lsId) {
    try {
      await c.execute({
        sql: "UPDATE level_subjects SET delivery_mode = 'aula_universal' WHERE id = ?",
        args: [lsId],
      });
    } catch (err) {
      if (esEntornoEstrictoEsquema() || !/no such column/i.test((err as Error)?.message ?? "")) {
        throw err;
      }
    }
  }

  return { sembradas, levelSubjectId: lsId };
}

export async function obtenerLeccionesAulaDesdeDb(
  db: LibSQLDatabase<typeof schema>,
  c?: Pick<Client, "execute">,
): Promise<LeccionUniversalPublica[]> {
  try {
    let rows = await db.select().from(universalLessons).orderBy(asc(universalLessons.sortOrder));
    if (rows.length === 0 && c) {
      await sembrarLeccionesAulaUniversalSql(c);
      rows = await db.select().from(universalLessons).orderBy(asc(universalLessons.sortOrder));
    }
    if (rows.length > 0) {
      return rows.map((r) => normalizarPuertasPublicas(JSON.parse(r.payloadJson) as LeccionUniversalPublica));
    }
  } catch (err) {
    if (esEntornoEstrictoEsquema() || !/no such table/i.test((err as Error)?.message ?? "")) {
      throw err;
    }
  }
  return obtenerLeccionesPilotoPublicas().map(normalizarPuertasPublicas);
}

export async function obtenerLeccionAulaDesdeDb(
  db: LibSQLDatabase<typeof schema>,
  oaId: string,
  c?: Pick<Client, "execute">,
): Promise<LeccionUniversalPublica | null> {
  const norm = oaId.trim().toLowerCase();
  try {
    const [row] = await db.select().from(universalLessons).where(eq(universalLessons.oaId, norm));
    if (row) {
      return normalizarPuertasPublicas(JSON.parse(row.payloadJson) as LeccionUniversalPublica);
    }
    if (c) {
      const total = await db.select({ n: sql<number>`count(*)` }).from(universalLessons);
      if (Number(total[0]?.n ?? 0) === 0) {
        await sembrarLeccionesAulaUniversalSql(c);
        const [seeded] = await db.select().from(universalLessons).where(eq(universalLessons.oaId, norm));
        if (seeded) return normalizarPuertasPublicas(JSON.parse(seeded.payloadJson) as LeccionUniversalPublica);
      }
    }
    return null;
  } catch (err) {
    if (esEntornoEstrictoEsquema() || !/no such table/i.test((err as Error)?.message ?? "")) {
      throw err;
    }
  }
  const fallback = obtenerLeccionesPilotoPublicas().find((l) => l.oaId === norm);
  return fallback ? normalizarPuertasPublicas(fallback) : null;
}
