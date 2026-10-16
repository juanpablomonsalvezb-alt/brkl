// Vórtice: lógica pura del resumen del estudiante (sin acceso a datos ni UI).
// La consumen el endpoint /api/vortice/overview y los tres dashboards por nivel.

export type VorticeTrack = "basica-1-4" | "basica-5-8" | "media";

// El colegio va de 1° Básico a 4° Medio, en los mismos tres tramos que las portadas
// de la landing (/plataforma/:nivel). Los niveles de adultos (nb*/nm*) no son parte de Vórtice.
const TRACK_BY_LEVEL: Record<string, VorticeTrack> = {
  "1b": "basica-1-4", "2b": "basica-1-4", "3b": "basica-1-4", "4b": "basica-1-4",
  "5b": "basica-5-8", "6b": "basica-5-8", "7b": "basica-5-8", "8b": "basica-5-8",
  "1m": "media", "2m": "media", "3m": "media", "4m": "media",
};

export function trackForLevel(levelId: string | null | undefined): VorticeTrack | null {
  return (levelId && TRACK_BY_LEVEL[levelId]) || null;
}

// Secuencia pedagógica del objetivo (IES "Organizing Instruction and Study"):
// ejemplo resuelto → práctica guiada → práctica independiente → reflexión breve; luego evaluación.
export const PEDAGOGICAL_STEPS = ["ejemplo", "practica_guiada", "practica_independiente", "reflexion"] as const;
export type PedagogicalStep = (typeof PEDAGOGICAL_STEPS)[number];

// Reflexión: preguntas breves con respuestas cortas del estudiante.
export const REFLECTION_MAX_PROMPTS = 5;
export const REFLECTION_PROMPT_MAX = 300;
export const REFLECTION_ANSWER_MAX = 500;

export interface OverviewResource {
  id: string;
  title: string;
  resourceType: string;
  sortOrder: number;
  // null/ausente en recursos sin paso asignado (datos existentes).
  pedagogicalStep?: PedagogicalStep | null;
}

// Orden dentro del objetivo: los recursos sin paso van primero (material previo, por sortOrder);
// los que tienen paso siguen la secuencia pedagógica y, dentro del mismo paso, sortOrder.
// Si ningún recurso tiene paso, queda exactamente el orden por sortOrder.
const stepRank = (r: OverviewResource) => (r.pedagogicalStep ? PEDAGOGICAL_STEPS.indexOf(r.pedagogicalStep) : -1);
export const byPedagogicalOrder = (a: OverviewResource, b: OverviewResource) =>
  stepRank(a) - stepRank(b) || a.sortOrder - b.sortOrder;

// Quién ve las respuestas de reflexión: el propio estudiante, su tutor asignado o un admin.
export function canViewReflection(
  viewer: { id: string; role: string | null | undefined },
  student: { id: string; tutorUserId: string | null | undefined },
): boolean {
  if (viewer.id === student.id || viewer.role === "admin") return true;
  return viewer.role === "tutor" && !!student.tutorUserId && student.tutorUserId === viewer.id;
}

export interface OverviewEvaluation {
  id: string;
  title: string;
  evaluationNumber: number;
  // Liberada según el calendario del módulo; se calcula en el servidor.
  available: boolean;
}

export interface OverviewObjective {
  id: string;
  code: string;
  title: string;
  weekNumber: number;
  sortOrder: number;
  resources: OverviewResource[];
  // Módulo abierto según calendario y avance (mismas reglas que /api/modules/:n/access). Por defecto, abierto.
  available?: boolean;
  // Solo evaluaciones obligatorias; cuentan como completadas al aprobarse.
  evaluations?: OverviewEvaluation[];
}

export interface OverviewSubjectInput {
  levelSubjectId: string;
  subjectName: string;
  subjectSlug: string;
  objectives: OverviewObjective[];
}

export interface NextStep {
  kind: "resource" | "evaluation";
  levelSubjectId: string;
  subjectName: string;
  objectiveId: string;
  objectiveTitle: string;
  // id del recurso o de la evaluación, según kind.
  itemId: string;
  itemTitle: string;
  resourceType: string | null;
  // Paso pedagógico del recurso; null en evaluaciones o recursos sin paso.
  pedagogicalStep: PedagogicalStep | null;
}

export interface SubjectSummary {
  levelSubjectId: string;
  subjectName: string;
  subjectSlug: string;
  // Ítems = recursos + evaluaciones obligatorias.
  totalItems: number;
  completedItems: number;
  // null cuando la asignatura aún no tiene contenido cargado: no hay avance que mostrar.
  percent: number | null;
  // Hay pendientes, pero ninguno liberado todavía por el calendario.
  waitingForRelease: boolean;
  currentObjective: { id: string; code: string; title: string } | null;
  next: NextStep | null;
}

const byModule = (a: OverviewObjective, b: OverviewObjective) =>
  a.weekNumber - b.weekNumber || a.sortOrder - b.sortOrder;

export function summarizeSubject(
  input: OverviewSubjectInput,
  completed: ReadonlySet<string>,
  passed: ReadonlySet<string> = new Set(),
): SubjectSummary {
  const objectives = [...input.objectives].sort(byModule);
  let total = 0;
  let done = 0;
  let lockedPending = 0;
  let next: NextStep | null = null;
  let current: SubjectSummary["currentObjective"] = null;

  const base = (oa: OverviewObjective) => ({
    levelSubjectId: input.levelSubjectId,
    subjectName: input.subjectName,
    objectiveId: oa.id,
    objectiveTitle: oa.title,
  });

  for (const oa of objectives) {
    // Dentro del objetivo: primero los recursos (en orden pedagógico), después las evaluaciones.
    const open = oa.available !== false;
    for (const r of [...oa.resources].sort(byPedagogicalOrder)) {
      total++;
      if (completed.has(r.id)) done++;
      else if (!open) lockedPending++;
      else if (!next) {
        next = { kind: "resource", ...base(oa), itemId: r.id, itemTitle: r.title, resourceType: r.resourceType,
          pedagogicalStep: r.pedagogicalStep ?? null };
      }
    }
    for (const ev of [...(oa.evaluations ?? [])].sort((a, b) => a.evaluationNumber - b.evaluationNumber)) {
      total++;
      if (passed.has(ev.id)) done++;
      else if (!open || !ev.available) lockedPending++;
      else if (!next) {
        next = { kind: "evaluation", ...base(oa), itemId: ev.id, itemTitle: ev.title, resourceType: null, pedagogicalStep: null };
      }
    }
    if (next && !current) current = { id: oa.id, code: oa.code, title: oa.title };
  }

  return {
    levelSubjectId: input.levelSubjectId,
    subjectName: input.subjectName,
    subjectSlug: input.subjectSlug,
    totalItems: total,
    completedItems: done,
    percent: total ? Math.round((done / total) * 100) : null,
    waitingForRelease: !next && lockedPending > 0,
    currentObjective: current,
    next,
  };
}

export interface VorticeOverview {
  track: VorticeTrack | null;
  level: { id: string; name: string } | null;
  subjects: SubjectSummary[];
  // Siguiente paso sugerido: el de la asignatura menos avanzada (desempate: orden de la lista).
  nextStep: NextStep | null;
  totals: { totalItems: number; completedItems: number; percent: number | null };
}

export function buildOverview(
  level: { id: string; name: string } | null,
  subjects: OverviewSubjectInput[],
  completed: ReadonlySet<string>,
  passed: ReadonlySet<string> = new Set(),
): VorticeOverview {
  const summaries = subjects.map((s) => summarizeSubject(s, completed, passed));
  const pending = summaries.filter((s) => s.next);
  const behind = pending.reduce<SubjectSummary | null>(
    (min, s) => (!min || (s.percent ?? 0) < (min.percent ?? 0) ? s : min),
    null,
  );
  const totalItems = summaries.reduce((n, s) => n + s.totalItems, 0);
  const completedItems = summaries.reduce((n, s) => n + s.completedItems, 0);
  return {
    track: trackForLevel(level?.id),
    level,
    subjects: summaries,
    nextStep: behind?.next ?? null,
    totals: {
      totalItems,
      completedItems,
      percent: totalItems ? Math.round((completedItems / totalItems) * 100) : null,
    },
  };
}
