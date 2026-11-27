// Capa unificada de actividad, progreso de Aula Universal y acompañamiento cualitativo (M-R07 · D3/D5).
// Respeta estrictamente:
// - 01 §2.1: nunca mezcla dominio K6 dentro del porcentaje de avance de actividades.
// - AC1: nunca nombra tablas restringidas del motor de conocimiento.
// - O7 / D4 / NI1-NI5: nunca lee ni expone notas, puntajes, respuestas ni pautas embargadas de E2.
import { eq, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import { lessonStudyProgress } from "@shared/schema";
import type { AulaProgresoResumen } from "@shared/vortice";

type Db = LibSQLDatabase<typeof schema>;

const TZ = "America/Santiago";
const dayKeyChile = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

function toDateSeg(raw: unknown): Date | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n > 1e11 ? n : n * 1000);
}

async function tablaExiste(db: Db, nombre: string): Promise<boolean> {
  const rows = await db.all<{ name: string }>(
    sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${nombre} LIMIT 1`,
  );
  return rows.length > 0;
}

/**
 * Última fecha de actividad en el circuito nuevo (práctica/retención + intentos P0-E).
 * Solo consulta marcas temporales (`answered_at`, `started_at`, `submitted_at`), nunca notas ni puntajes.
 */
export async function ultimaActividadMotorVortice(db: Db, userId: string): Promise<Date | null> {
  const fechas: Date[] = [];

  if (await tablaExiste(db, "practice_answers")) {
    const rows = await db.all<{ ts: number | null }>(
      sql`SELECT MAX(answered_at) AS ts FROM practice_answers WHERE student_id = ${userId}`,
    );
    const d = toDateSeg(rows[0]?.ts);
    if (d) fechas.push(d);
  }

  if (await tablaExiste(db, "evaluation_attempts")) {
    const rows = await db.all<{ ts: number | null }>(
      sql`SELECT MAX(COALESCE(submitted_at, started_at)) AS ts FROM evaluation_attempts WHERE student_id = ${userId}`,
    );
    const d = toDateSeg(rows[0]?.ts);
    if (d) fechas.push(d);
  }

  return fechas.reduce<Date | null>((acc, d) => (!acc || d > acc ? d : acc), null);
}

/**
 * Días distintos (hora de Chile, formato YYYY-MM-DD) dentro de `month` (YYYY-MM) con actividad
 * en Aula Universal (`lesson_study_progress`), Práctica/Retención (`practice_answers`) o P0-E (`evaluation_attempts`).
 */
export async function diasEstudioMotorVorticeEnMes(
  db: Db,
  userId: string,
  month: string,
): Promise<Set<string>> {
  const dias = new Set<string>();

  if (await tablaExiste(db, "lesson_study_progress")) {
    const aulaRows = await db
      .select({ at: sql<number | null>`${lessonStudyProgress.updatedAt}` })
      .from(lessonStudyProgress)
      .where(eq(lessonStudyProgress.userId, userId));
    for (const r of aulaRows) {
      const d = toDateSeg(r.at);
      if (d) {
        const key = dayKeyChile(d);
        if (key.startsWith(month)) dias.add(key);
      }
    }
  }

  if (await tablaExiste(db, "practice_answers")) {
    const pracRows = await db.all<{ study_day: string }>(
      sql`SELECT DISTINCT study_day FROM practice_answers WHERE student_id = ${userId}`,
    );
    for (const r of pracRows) {
      const key = String(r.study_day ?? "");
      if (key.startsWith(month)) dias.add(key);
    }
  }

  if (await tablaExiste(db, "evaluation_attempts")) {
    const evalRows = await db.all<{ ts: number | null }>(
      sql`SELECT COALESCE(submitted_at, started_at) AS ts FROM evaluation_attempts WHERE student_id = ${userId}`,
    );
    for (const r of evalRows) {
      const d = toDateSeg(r.ts);
      if (d) {
        const key = dayKeyChile(d);
        if (key.startsWith(month)) dias.add(key);
      }
    }
  }

  return dias;
}

/**
 * Resumen de avance de lecciones en Aula Universal para una asignatura migrada (`delivery_mode = 'aula_universal'`).
 * Mantiene el avance de estudio separado del estado de dominio K6 (01 §2.1).
 */
export async function progresoAulaPorAsignatura(
  db: Db,
  userId: string,
  levelSubjectId: string,
): Promise<AulaProgresoResumen | null> {
  if (!(await tablaExiste(db, "lesson_study_progress"))) return null;
  let oas: string[] = [];
  if (await tablaExiste(db, "universal_lessons")) {
    const ulRows = await db.all<{ oa_id: string }>(
      sql`SELECT oa_id FROM universal_lessons WHERE level_subject_id = ${levelSubjectId}`,
    );
    oas = ulRows.map((r) => String(r.oa_id));
  }
  if (oas.length === 0) {
    oas = ["oa7", "oa8", "oa10", "oa11", "oa13"];
  }
  const progRows = await db
    .select({ oaId: lessonStudyProgress.oaId, practicaLograda: lessonStudyProgress.practicaLograda })
    .from(lessonStudyProgress)
    .where(eq(lessonStudyProgress.userId, userId));
  const oaSet = new Set(oas);
  const logradas = progRows.filter((p) => oaSet.has(p.oaId) && Boolean(p.practicaLograda)).length;
  return { logradas, total: oas.length };
}

export interface AcompanamientoFamiliaCualitativo {
  leccionesIniciadas: number;
  leccionesLogradas: number;
  practicasRespondidas: number;
  estadoCualitativo: "sin_actividad" | "en_marcha" | "avanzando";
}

/**
 * Resumen estrictamente cualitativo para `/familia` (O7 / D4 / NI1-NI5):
 * refleja actividad real del nuevo circuito (Aula Universal + Práctica) sin exponer notas,
 * porcentajes ni resultados embargados de E2.
 */
export async function resumenAcompanamientoFamilia(
  db: Db,
  userId: string,
): Promise<AcompanamientoFamiliaCualitativo> {
  let leccionesIniciadas = 0;
  let leccionesLogradas = 0;
  let practicasRespondidas = 0;

  if (await tablaExiste(db, "lesson_study_progress")) {
    const aulaRows = await db
      .select({ practicaLograda: lessonStudyProgress.practicaLograda })
      .from(lessonStudyProgress)
      .where(eq(lessonStudyProgress.userId, userId));
    leccionesIniciadas = aulaRows.length;
    leccionesLogradas = aulaRows.filter((r) => Boolean(r.practicaLograda)).length;
  }

  if (await tablaExiste(db, "practice_answers")) {
    const pracRow = await db.all<{ n: number }>(
      sql`SELECT COUNT(*) AS n FROM practice_answers WHERE student_id = ${userId}`,
    );
    practicasRespondidas = Number(pracRow[0]?.n ?? 0);
  }

  const estadoCualitativo: AcompanamientoFamiliaCualitativo["estadoCualitativo"] =
    leccionesLogradas > 0
      ? "avanzando"
      : leccionesIniciadas > 0 || practicasRespondidas > 0
        ? "en_marcha"
        : "sin_actividad";

  return {
    leccionesIniciadas,
    leccionesLogradas,
    practicasRespondidas,
    estadoCualitativo,
  };
}
