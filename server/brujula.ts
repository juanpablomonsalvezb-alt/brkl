// Brújula™: plan semanal, preferencias de intensidad, bloques de estudio y autoevaluación.
// Recibe la conexión como parámetro para poder probarse contra una base en memoria.
import { and, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import {
  brujulaPreferences,
  brujulaStudyBlocks,
  brujulaWeeks,
  learningObjectives,
  levelSubjects,
  subjects,
} from "@shared/schema";
import {
  FRANJAS_BRUJULA,
  INTENSIDADES,
  PREFERENCIAS_BRUJULA_DEFECTO,
  maxGoalsFor,
  planificarBloquesSemana,
  previousWeekStart,
  proposeWeeklyPlan,
  weekStartOf,
  ymdMasDiasCivil,
  type BloqueEstudio,
  type BrujulaDifficulty,
  type BrujulaGoal,
  type FranjaBrujula,
  type IntensidadBrujula,
  type PreferenciasBrujula,
} from "@shared/brujula";
import type { VorticeTrack } from "@shared/vortice";
import { calcularPanel, type PanelBrujula } from "@shared/brujulaPanel";
import { loadVorticeOverview, loadVorticeInput, checkModuleAccess } from "./vortice";
import { resolveCalendarConfig, resolveCalendarConfigForLevelSubject } from "./calendarConfig";
import {
  getModuleStartDate, getModuleEndDate, getEvaluation1ReleaseDate, getEvaluation2ReleaseDate,
  getEvaluation3ReleaseDate, getEvaluation4ReleaseDate,
  CHILE_TZ, ymdIn, midnightIn,
} from "./calendarUtils";

type Db = LibSQLDatabase<typeof schema>;
type Result<T> = { ok: true; data: T } | { ok: false; status: 400 | 403 | 404 | 409; reason: string };

export interface BrujulaWeekView {
  weekStart: string;
  track: VorticeTrack | null;
  maxGoals: number;
  // false = propuesta automática, todavía sin guardar.
  saved: boolean;
  goals: BrujulaGoal[];
  explanation: string;
  reflection: { difficulty: BrujulaDifficulty; note: string | null; closedAt: Date | null } | null;
}

export interface BrujulaBlocksView {
  weekStart: string;
  preferencias: PreferenciasBrujula;
  saved: boolean;
  bloques: BloqueEstudio[];
}

async function findWeek(db: Db, userId: string, weekStart: string) {
  const [row] = await db.select().from(brujulaWeeks)
    .where(and(eq(brujulaWeeks.userId, userId), eq(brujulaWeeks.weekStart, weekStart)));
  return row;
}

function parseDiasPreferidos(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const valid = parsed.filter((d): d is number => Number.isInteger(d) && d >= 1 && d <= 7);
      if (valid.length > 0) return Array.from(new Set(valid)).sort((a, b) => a - b);
    }
  } catch {
    // valor corrupto cae a defecto
  }
  return [...PREFERENCIAS_BRUJULA_DEFECTO.diasPreferidos];
}

// Preferencias de Brújula del estudiante. Sin fila devuelve los valores por defecto sin escribir.
export async function getBrujulaPreferences(db: Db, userId: string): Promise<PreferenciasBrujula> {
  const [row] = await db.select().from(brujulaPreferences).where(eq(brujulaPreferences.userId, userId));
  if (!row) {
    return {
      ...PREFERENCIAS_BRUJULA_DEFECTO,
      diasPreferidos: [...PREFERENCIAS_BRUJULA_DEFECTO.diasPreferidos],
    };
  }
  const intensidad: IntensidadBrujula = (INTENSIDADES as readonly string[]).includes(row.intensidad)
    ? (row.intensidad as IntensidadBrujula)
    : PREFERENCIAS_BRUJULA_DEFECTO.intensidad;
  const franja: FranjaBrujula = (FRANJAS_BRUJULA as readonly string[]).includes(row.franja)
    ? (row.franja as FranjaBrujula)
    : PREFERENCIAS_BRUJULA_DEFECTO.franja;
  return {
    intensidad,
    diasPreferidos: parseDiasPreferidos(row.diasPreferidosJson),
    franja,
  };
}

export async function saveBrujulaPreferences(
  db: Db,
  userId: string,
  input: PreferenciasBrujula,
): Promise<PreferenciasBrujula> {
  const diasOrdenados = Array.from(new Set(input.diasPreferidos)).sort((a, b) => a - b);
  const saved: PreferenciasBrujula = {
    intensidad: input.intensidad,
    diasPreferidos: diasOrdenados,
    franja: input.franja,
  };
  await db
    .insert(brujulaPreferences)
    .values({
      userId,
      intensidad: saved.intensidad,
      diasPreferidosJson: JSON.stringify(saved.diasPreferidos),
      franja: saved.franja,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: brujulaPreferences.userId,
      set: {
        intensidad: saved.intensidad,
        diasPreferidosJson: JSON.stringify(saved.diasPreferidos),
        franja: saved.franja,
        updatedAt: new Date(),
      },
    });
  return saved;
}

// Plan de la semana actual: el guardado o, si no existe, una propuesta sin guardar.
export async function getBrujulaWeek(db: Db, userId: string, now: Date): Promise<BrujulaWeekView> {
  const weekStart = weekStartOf(now);
  const [overview, prefs, row] = await Promise.all([
    loadVorticeOverview(db, userId, now),
    getBrujulaPreferences(db, userId),
    findWeek(db, userId, weekStart),
  ]);
  const proposal = proposeWeeklyPlan(overview, prefs.intensidad);
  return {
    weekStart,
    track: overview.track,
    maxGoals: proposal.maxGoals,
    saved: !!row,
    goals: row ? JSON.parse(row.goalsJson) : proposal.goals,
    explanation: row ? "Este es el plan que elegiste para la semana." : proposal.explanation,
    reflection: row?.difficulty
      ? { difficulty: row.difficulty as BrujulaDifficulty, note: row.note, closedAt: row.closedAt }
      : null,
  };
}

// Guarda (o ajusta) el plan de la semana actual. Solo objetivos de asignaturas en las que
// el estudiante está matriculado y cuyo módulo ya está abierto; respeta la carga del tramo e intensidad.
export async function saveBrujulaWeek(
  db: Db, userId: string, now: Date, objectiveIds: string[],
): Promise<Result<BrujulaWeekView>> {
  const [overview, prefs] = await Promise.all([
    loadVorticeOverview(db, userId, now),
    getBrujulaPreferences(db, userId),
  ]);
  const proposal = proposeWeeklyPlan(overview, prefs.intensidad);
  if (proposal.maxGoals === 0) return { ok: false, status: 403, reason: "Brújula está disponible de 1° Básico a 4° Medio" };
  if (objectiveIds.length > proposal.maxGoals) {
    return { ok: false, status: 400, reason: `Máximo ${proposal.maxGoals} metas por semana` };
  }

  const weekStart = weekStartOf(now);
  const existing = await findWeek(db, userId, weekStart);
  if (existing?.closedAt) return { ok: false, status: 409, reason: "La semana ya está cerrada" };

  const proposedReason = new Map(proposal.goals.map((g) => [g.objectiveId, g.reason]));
  const goals: BrujulaGoal[] = [];
  for (const objectiveId of objectiveIds) {
    const [oa] = await db.select({
      levelSubjectId: learningObjectives.levelSubjectId, weekNumber: learningObjectives.weekNumber,
      code: learningObjectives.code, title: learningObjectives.title, subjectName: subjects.name,
    })
      .from(learningObjectives)
      .innerJoin(levelSubjects, eq(learningObjectives.levelSubjectId, levelSubjects.id))
      .innerJoin(subjects, eq(levelSubjects.subjectId, subjects.id))
      .where(eq(learningObjectives.id, objectiveId));
    if (!oa) return { ok: false, status: 404, reason: "Objetivo no encontrado" };
    const config = await resolveCalendarConfigForLevelSubject(db, oa.levelSubjectId, now);
    const access = await checkModuleAccess(db, userId, oa.levelSubjectId, oa.weekNumber, now, config);
    if (!access.ok) return { ok: false, status: access.status, reason: access.reason };
    goals.push({
      levelSubjectId: oa.levelSubjectId, subjectName: oa.subjectName, objectiveId,
      objectiveCode: oa.code, objectiveTitle: oa.title, reason: proposedReason.get(objectiveId) ?? null,
    });
  }

  const goalsJson = JSON.stringify(goals);
  await db.insert(brujulaWeeks).values({ userId, weekStart, goalsJson })
    .onConflictDoUpdate({ target: [brujulaWeeks.userId, brujulaWeeks.weekStart], set: { goalsJson, updatedAt: now } });
  return { ok: true, data: await getBrujulaWeek(db, userId, now) };
}

// Autoevaluación de cierre. Por defecto la semana actual; también la anterior, para quien
// cierra el lunes. Se puede rehacer: no hay nota ni castigo asociado.
export async function closeBrujulaWeek(
  db: Db, userId: string, now: Date,
  input: { difficulty: BrujulaDifficulty; note?: string; weekStart?: string },
): Promise<Result<{ weekStart: string; difficulty: BrujulaDifficulty; note: string | null; closedAt: Date }>> {
  const current = weekStartOf(now);
  const weekStart = input.weekStart ?? current;
  if (weekStart !== current && weekStart !== previousWeekStart(current)) {
    return { ok: false, status: 400, reason: "Solo puedes cerrar la semana actual o la anterior" };
  }
  const row = await findWeek(db, userId, weekStart);
  if (!row) return { ok: false, status: 404, reason: "Primero guarda tu plan de la semana" };
  const note = input.note?.trim() || null;
  await db.update(brujulaWeeks)
    .set({ difficulty: input.difficulty, note, closedAt: now, updatedAt: now })
    .where(eq(brujulaWeeks.id, row.id));
  return { ok: true, data: { weekStart, difficulty: input.difficulty, note, closedAt: now } };
}

// Bloques de estudio semanales (parte 2): guardados o propuestos en memoria sin escribir.
export async function getBrujulaBlocks(db: Db, userId: string, now: Date): Promise<BrujulaBlocksView> {
  const weekStart = weekStartOf(now);
  const [preferencias, row] = await Promise.all([
    getBrujulaPreferences(db, userId),
    db.select().from(brujulaStudyBlocks)
      .where(and(eq(brujulaStudyBlocks.userId, userId), eq(brujulaStudyBlocks.weekStart, weekStart)))
      .then((rows) => rows[0]),
  ]);

  if (row) {
    return {
      weekStart,
      preferencias,
      saved: true,
      bloques: JSON.parse(row.blocksJson) as BloqueEstudio[],
    };
  }

  const weekView = await getBrujulaWeek(db, userId, now);
  return {
    weekStart,
    preferencias,
    saved: false,
    bloques: planificarBloquesSemana({
      weekStart,
      goals: weekView.goals,
      preferencias,
    }),
  };
}

export async function saveBrujulaBlocks(
  db: Db,
  userId: string,
  now: Date,
  bloques: BloqueEstudio[],
): Promise<Result<BrujulaBlocksView>> {
  const [overview, preferencias] = await Promise.all([
    loadVorticeOverview(db, userId, now),
    getBrujulaPreferences(db, userId),
  ]);
  if (maxGoalsFor(overview.track, preferencias.intensidad) === 0) {
    return { ok: false, status: 403, reason: "Brújula está disponible de 1° Básico a 4° Medio" };
  }

  const weekStart = weekStartOf(now);
  const weekEnd = ymdMasDiasCivil(weekStart, 6);
  const seenIds = new Set<string>();
  const uniqueObjectives = new Set<string>();

  for (const b of bloques) {
    if (seenIds.has(b.id)) return { ok: false, status: 400, reason: "Bloques con id repetido" };
    seenIds.add(b.id);
    if (b.fecha < weekStart || b.fecha > weekEnd) {
      return { ok: false, status: 400, reason: "La fecha del bloque debe corresponder a la semana actual" };
    }
    uniqueObjectives.add(b.objectiveId);
  }

  for (const objectiveId of Array.from(uniqueObjectives)) {
    const [oa] = await db.select({
      levelSubjectId: learningObjectives.levelSubjectId,
      weekNumber: learningObjectives.weekNumber,
    })
      .from(learningObjectives)
      .where(eq(learningObjectives.id, objectiveId));
    if (!oa) return { ok: false, status: 404, reason: "Objetivo no encontrado" };
    const config = await resolveCalendarConfigForLevelSubject(db, oa.levelSubjectId, now);
    const access = await checkModuleAccess(db, userId, oa.levelSubjectId, oa.weekNumber, now, config);
    if (!access.ok) return { ok: false, status: access.status, reason: access.reason };
  }

  const blocksJson = JSON.stringify(bloques);
  await db
    .insert(brujulaStudyBlocks)
    .values({ userId, weekStart, blocksJson, updatedAt: now })
    .onConflictDoUpdate({
      target: [brujulaStudyBlocks.userId, brujulaStudyBlocks.weekStart],
      set: { blocksJson, updatedAt: now },
    });

  return {
    ok: true,
    data: { weekStart, preferencias, saved: true, bloques },
  };
}

export async function toggleBrujulaBlock(
  db: Db,
  userId: string,
  now: Date,
  blockId: string,
  completado: boolean,
): Promise<Result<BrujulaBlocksView>> {
  const current = await getBrujulaBlocks(db, userId, now);
  const idx = current.bloques.findIndex((b) => b.id === blockId);
  if (idx === -1) {
    return { ok: false, status: 404, reason: "Bloque no encontrado en la semana actual" };
  }

  const nextBloques = current.bloques.map((b, i) => (i === idx ? { ...b, completado } : b));
  const blocksJson = JSON.stringify(nextBloques);
  await db
    .insert(brujulaStudyBlocks)
    .values({ userId, weekStart: current.weekStart, blocksJson, updatedAt: now })
    .onConflictDoUpdate({
      target: [brujulaStudyBlocks.userId, brujulaStudyBlocks.weekStart],
      set: { blocksJson, updatedAt: now },
    });

  return {
    ok: true,
    data: {
      weekStart: current.weekStart,
      preferencias: current.preferencias,
      saved: true,
      bloques: nextBloques,
    },
  };
}

// Panel del estudiante: métricas, ritmo frente al calendario y mensajes de orientación. Solo lee.
export async function getBrujulaPanel(db: Db, userId: string, now: Date): Promise<PanelBrujula> {
  const { level, input, completed, passed } = await loadVorticeInput(db, userId, now);
  const cfg = await resolveCalendarConfig(db, level?.id, now);
  return calcularPanel({
    subjects: input, completed, passed, now,
    fechas: (_levelSubjectId, m) => ({
      inicio: getModuleStartDate(m, cfg), fin: getModuleEndDate(m, cfg),
      evaluaciones: { 1: getEvaluation1ReleaseDate(m, cfg), 2: getEvaluation2ReleaseDate(m, cfg), 3: getEvaluation3ReleaseDate(m, cfg), 4: getEvaluation4ReleaseDate(m, cfg) },
    }),
    ymdIn: (d) => ymdIn(CHILE_TZ, d),
    midnightIn: (ymd) => midnightIn(CHILE_TZ, ymd),
  });
}
