// Brújula™: plan semanal y autoevaluación del estudiante. Recibe la conexión como parámetro
// para poder probarse contra una base en memoria (igual que server/vortice.ts).
import { and, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import { brujulaWeeks, learningObjectives, levelSubjects, subjects } from "@shared/schema";
import {
  proposeWeeklyPlan, weekStartOf, previousWeekStart,
  type BrujulaGoal, type BrujulaDifficulty,
} from "@shared/brujula";
import type { VorticeTrack } from "@shared/vortice";
import { loadVorticeOverview, checkModuleAccess } from "./vortice";

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

async function findWeek(db: Db, userId: string, weekStart: string) {
  const [row] = await db.select().from(brujulaWeeks)
    .where(and(eq(brujulaWeeks.userId, userId), eq(brujulaWeeks.weekStart, weekStart)));
  return row;
}

// Plan de la semana actual: el guardado o, si no existe, una propuesta sin guardar.
export async function getBrujulaWeek(db: Db, userId: string, now: Date): Promise<BrujulaWeekView> {
  const weekStart = weekStartOf(now);
  const overview = await loadVorticeOverview(db, userId, now);
  const proposal = proposeWeeklyPlan(overview);
  const row = await findWeek(db, userId, weekStart);
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
// el estudiante está matriculado y cuyo módulo ya está abierto; respeta la carga del tramo.
export async function saveBrujulaWeek(
  db: Db, userId: string, now: Date, objectiveIds: string[],
): Promise<Result<BrujulaWeekView>> {
  const overview = await loadVorticeOverview(db, userId, now);
  const proposal = proposeWeeklyPlan(overview);
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
    const access = await checkModuleAccess(db, userId, oa.levelSubjectId, oa.weekNumber, now);
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
