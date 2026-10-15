// Vórtice: lógica pura del resumen del estudiante (sin acceso a datos ni UI).
// La consumen el endpoint /api/vortice/overview y los tres dashboards por nivel.

export type VorticeTrack = "basica-1-4" | "basica-5-8" | "media";

// Mismos tres tramos que las portadas de la landing (/plataforma/:nivel).
// ponytail: adultos se mapean al tramo equivalente; separar si tendrán dashboard propio.
const TRACK_BY_LEVEL: Record<string, VorticeTrack> = {
  "1b": "basica-1-4", "2b": "basica-1-4", "3b": "basica-1-4", "4b": "basica-1-4",
  "5b": "basica-5-8", "6b": "basica-5-8", "7b": "basica-5-8", "8b": "basica-5-8",
  "1m": "media", "2m": "media", "3m": "media", "4m": "media",
  nb1: "basica-1-4", nb2: "basica-5-8", nb3: "basica-5-8", nm1: "media", nm2: "media",
};

export function trackForLevel(levelId: string | null | undefined): VorticeTrack | null {
  return (levelId && TRACK_BY_LEVEL[levelId]) || null;
}

export interface OverviewResource {
  id: string;
  title: string;
  resourceType: string;
  sortOrder: number;
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

const byOrder = <T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder;
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
    // Dentro del objetivo: primero los recursos, después las evaluaciones.
    const open = oa.available !== false;
    for (const r of [...oa.resources].sort(byOrder)) {
      total++;
      if (completed.has(r.id)) done++;
      else if (!open) lockedPending++;
      else if (!next) {
        next = { kind: "resource", ...base(oa), itemId: r.id, itemTitle: r.title, resourceType: r.resourceType };
      }
    }
    for (const ev of [...(oa.evaluations ?? [])].sort((a, b) => a.evaluationNumber - b.evaluationNumber)) {
      total++;
      if (passed.has(ev.id)) done++;
      else if (!open || !ev.available) lockedPending++;
      else if (!next) {
        next = { kind: "evaluation", ...base(oa), itemId: ev.id, itemTitle: ev.title, resourceType: null };
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
