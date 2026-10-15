// Brújula™: plan semanal y autoevaluación del estudiante (lógica pura, sin datos ni UI).
// Autonomía estructurada (Atlas #038) y autorregulación (#036): el sistema propone, el
// estudiante decide. Sin rachas, sin puntajes, sin castigos por no cumplir.
import { z } from "zod";
import type { VorticeOverview, VorticeTrack } from "./vortice";

// Carga máxima de metas por semana según el tramo: menos ítems para los más pequeños.
export const MAX_GOALS: Record<VorticeTrack, number> = {
  "basica-1-4": 2,
  "basica-5-8": 3,
  media: 4,
};

export function maxGoalsFor(track: VorticeTrack | null): number {
  return track ? MAX_GOALS[track] : 0; // fuera de 1° Básico a 4° Medio no hay Brújula
}

// Lunes de la semana de `now` (hora local), como "YYYY-MM-DD". Identifica la semana del plan.
export function weekStartOf(now: Date): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function previousWeekStart(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  return weekStartOf(new Date(y, m - 1, d - 7));
}

// Meta = completar un objetivo (OA) de una asignatura.
export interface BrujulaGoal {
  levelSubjectId: string;
  subjectName: string;
  objectiveId: string;
  objectiveCode: string;
  objectiveTitle: string;
  // Por qué se propone; null si el estudiante la agregó por su cuenta.
  reason: string | null;
}

export interface BrujulaProposal {
  maxGoals: number;
  goals: BrujulaGoal[];
  explanation: string;
}

// Propone el objetivo abierto actual de cada asignatura con algo pendiente, primero las
// menos avanzadas (desempate: orden de la lista), hasta la carga máxima del tramo.
export function proposeWeeklyPlan(overview: VorticeOverview): BrujulaProposal {
  const maxGoals = maxGoalsFor(overview.track);
  const candidates = overview.subjects
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.next && s.currentObjective)
    .sort((a, b) => (a.s.percent ?? 0) - (b.s.percent ?? 0) || a.i - b.i)
    .slice(0, maxGoals);

  const goals = candidates.map(({ s }, rank) => ({
    levelSubjectId: s.levelSubjectId,
    subjectName: s.subjectName,
    objectiveId: s.currentObjective!.id,
    objectiveCode: s.currentObjective!.code,
    objectiveTitle: s.currentObjective!.title,
    reason: `${s.subjectName} lleva ${s.percent ?? 0}% de avance` +
      (rank === 0 ? " (la que menos avanza)" : "") +
      `; ${s.currentObjective!.code} es su objetivo abierto ahora.`,
  }));

  const explanation = maxGoals === 0
    ? "Brújula está disponible de 1° Básico a 4° Medio."
    : goals.length === 0
      ? "No hay objetivos abiertos esta semana: puedes repasar o esperar que se libere el siguiente módulo."
      : `Hasta ${maxGoals} metas por semana para tu curso. Primero las asignaturas con menos avance. Puedes cambiarlas.`;

  return { maxGoals, goals, explanation };
}

// Autoevaluación de cierre: una pregunta cerrada ("¿qué te costó?") y un texto opcional corto.
export const DIFFICULTY_OPTIONS = ["entender", "concentrarme", "organizar-tiempo", "animo", "nada"] as const;
export type BrujulaDifficulty = (typeof DIFFICULTY_OPTIONS)[number];
export const NOTE_MAX = 280;

export const saveWeekSchema = z.object({
  objectiveIds: z.array(z.string().min(1).max(64)).min(1).max(Math.max(...Object.values(MAX_GOALS)))
    .refine((ids) => new Set(ids).size === ids.length, "Objetivos repetidos"),
});

export const closeWeekSchema = z.object({
  difficulty: z.enum(DIFFICULTY_OPTIONS),
  note: z.string().trim().max(NOTE_MAX).optional(),
  // Por defecto la semana actual; se permite cerrar la anterior (p. ej. el lunes).
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
