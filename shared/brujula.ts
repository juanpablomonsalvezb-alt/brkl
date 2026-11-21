// Brújula™: plan semanal, intensidad, bloques de estudio y autoevaluación del estudiante (lógica pura).
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

export const INTENSIDADES = ["suave", "normal", "intensivo"] as const;
export type IntensidadBrujula = (typeof INTENSIDADES)[number];

export const CONFIG_INTENSIDAD: Record<
  IntensidadBrujula,
  { label: string; bloquesPorSemana: number; minutosBloque: number; factorMetas: -1 | 0 | 1 }
> = {
  suave: { label: "Suave", bloquesPorSemana: 3, minutosBloque: 25, factorMetas: -1 },
  normal: { label: "Normal", bloquesPorSemana: 5, minutosBloque: 35, factorMetas: 0 },
  intensivo: { label: "Intensivo", bloquesPorSemana: 6, minutosBloque: 45, factorMetas: 1 },
};

export const FRANJAS_BRUJULA = ["manana", "tarde", "noche"] as const;
export type FranjaBrujula = (typeof FRANJAS_BRUJULA)[number];

export interface PreferenciasBrujula {
  intensidad: IntensidadBrujula;
  diasPreferidos: number[]; // 1 = lunes .. 7 = domingo
  franja: FranjaBrujula;
}

export const PREFERENCIAS_BRUJULA_DEFECTO: PreferenciasBrujula = {
  intensidad: "normal",
  diasPreferidos: [1, 2, 3, 4, 5],
  franja: "tarde",
};

export function maxGoalsFor(track: VorticeTrack | null, intensidad: IntensidadBrujula = "normal"): number {
  if (!track) return 0; // fuera de 1° Básico a 4° Medio no hay Brújula
  const base = MAX_GOALS[track];
  if (intensidad === "suave") return Math.max(1, base - 1);
  if (intensidad === "intensivo") return Math.min(5, base + 1);
  return base;
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

/** Suma `delta` días a una fecha civil "YYYY-MM-DD" en UTC puro (sin deriva por cambio de horario). */
export function ymdMasDiasCivil(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
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

export interface BloqueEstudio {
  id: string;
  fecha: string; // "YYYY-MM-DD"
  diaSemana: number; // 1 = lunes .. 7 = domingo
  franja: FranjaBrujula;
  duracionMin: number;
  levelSubjectId: string;
  subjectName: string;
  objectiveId: string;
  objectiveCode: string;
  objectiveTitle: string;
  completado: boolean;
}

// Propone el objetivo abierto actual de cada asignatura con algo pendiente, primero las
// menos avanzadas (desempate: orden de la lista), hasta la carga máxima del tramo e intensidad.
export function proposeWeeklyPlan(
  overview: VorticeOverview,
  intensidad: IntensidadBrujula = "normal",
): BrujulaProposal {
  const maxGoals = maxGoalsFor(overview.track, intensidad);
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

/**
 * Planifica bloques concretos de estudio para una semana a partir de las metas e intensidad.
 * Usa aritmética civil UTC pura para evitar corrimientos en semanas con cambio de horario.
 */
export function planificarBloquesSemana(input: {
  weekStart: string;
  goals: readonly BrujulaGoal[];
  preferencias: PreferenciasBrujula;
  completadosIds?: ReadonlySet<string>;
}): BloqueEstudio[] {
  if (input.goals.length === 0) return [];
  const cfg = CONFIG_INTENSIDAD[input.preferencias.intensidad];
  const diasOrdenados = Array.from(new Set(input.preferencias.diasPreferidos))
    .filter((d) => Number.isInteger(d) && d >= 1 && d <= 7)
    .sort((a, b) => a - b);
  if (diasOrdenados.length === 0) return [];

  const totalBloques = Math.min(cfg.bloquesPorSemana, diasOrdenados.length * 2);
  const bloques: BloqueEstudio[] = [];

  for (let i = 0; i < totalBloques; i++) {
    const dia = diasOrdenados[i % diasOrdenados.length];
    const indiceDia = Math.floor(i / diasOrdenados.length) + 1;
    const goal = input.goals[i % input.goals.length];
    const id = `${input.weekStart}-d${dia}-b${indiceDia}`;
    bloques.push({
      id,
      fecha: ymdMasDiasCivil(input.weekStart, dia - 1),
      diaSemana: dia,
      franja: input.preferencias.franja,
      duracionMin: cfg.minutosBloque,
      levelSubjectId: goal.levelSubjectId,
      subjectName: goal.subjectName,
      objectiveId: goal.objectiveId,
      objectiveCode: goal.objectiveCode,
      objectiveTitle: goal.objectiveTitle,
      completado: input.completadosIds?.has(id) ?? false,
    });
  }

  return bloques.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id));
}

// Autoevaluación de cierre: una pregunta cerrada ("¿qué te costó?") y un texto opcional corto.
export const DIFFICULTY_OPTIONS = ["entender", "concentrarme", "organizar-tiempo", "animo", "nada"] as const;
export type BrujulaDifficulty = (typeof DIFFICULTY_OPTIONS)[number];
export const NOTE_MAX = 280;

export const saveWeekSchema = z.object({
  objectiveIds: z.array(z.string().min(1).max(64)).min(1).max(Math.max(5, ...Object.values(MAX_GOALS)))
    .refine((ids) => new Set(ids).size === ids.length, "Objetivos repetidos"),
});

export const closeWeekSchema = z.object({
  difficulty: z.enum(DIFFICULTY_OPTIONS),
  note: z.string().trim().max(NOTE_MAX).optional(),
  // Por defecto la semana actual; se permite cerrar la anterior (p. ej. el lunes).
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const preferenciasBrujulaSchema = z.object({
  intensidad: z.enum(INTENSIDADES),
  diasPreferidos: z.array(z.number().int().min(1).max(7)).min(1).max(7)
    .refine((xs) => new Set(xs).size === xs.length, "Días repetidos"),
  franja: z.enum(FRANJAS_BRUJULA),
}).strict();

export const bloqueEstudioSchema = z.object({
  id: z.string().trim().min(1).max(64),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  diaSemana: z.number().int().min(1).max(7),
  franja: z.enum(FRANJAS_BRUJULA),
  duracionMin: z.number().int().min(10).max(120),
  levelSubjectId: z.string().trim().min(1).max(120),
  subjectName: z.string().trim().min(1).max(120),
  objectiveId: z.string().trim().min(1).max(120),
  objectiveCode: z.string().trim().min(1).max(40),
  objectiveTitle: z.string().trim().min(1).max(200),
  completado: z.boolean(),
}).strict();

export const guardarBloquesSchema = z.object({
  bloques: z.array(bloqueEstudioSchema).max(21),
}).strict();

export const toggleBloqueSchema = z.object({
  completado: z.boolean(),
}).strict();
