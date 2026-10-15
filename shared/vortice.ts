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

export interface OverviewObjective {
  id: string;
  code: string;
  title: string;
  weekNumber: number;
  sortOrder: number;
  resources: OverviewResource[];
}

export interface OverviewSubjectInput {
  levelSubjectId: string;
  subjectName: string;
  subjectSlug: string;
  objectives: OverviewObjective[];
}

export interface NextStep {
  levelSubjectId: string;
  subjectName: string;
  objectiveId: string;
  objectiveTitle: string;
  resourceId: string;
  resourceTitle: string;
  resourceType: string;
}

export interface SubjectSummary {
  levelSubjectId: string;
  subjectName: string;
  subjectSlug: string;
  totalResources: number;
  completedResources: number;
  // null cuando la asignatura aún no tiene recursos cargados: no hay avance que mostrar.
  percent: number | null;
  currentObjective: { id: string; code: string; title: string } | null;
  next: NextStep | null;
}

const byOrder = <T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder;
const byModule = (a: OverviewObjective, b: OverviewObjective) =>
  a.weekNumber - b.weekNumber || a.sortOrder - b.sortOrder;

export function summarizeSubject(input: OverviewSubjectInput, completed: ReadonlySet<string>): SubjectSummary {
  const objectives = [...input.objectives].sort(byModule);
  let total = 0;
  let done = 0;
  let next: NextStep | null = null;
  let current: SubjectSummary["currentObjective"] = null;

  for (const oa of objectives) {
    for (const r of [...oa.resources].sort(byOrder)) {
      total++;
      if (completed.has(r.id)) {
        done++;
      } else if (!next) {
        current = { id: oa.id, code: oa.code, title: oa.title };
        next = {
          levelSubjectId: input.levelSubjectId,
          subjectName: input.subjectName,
          objectiveId: oa.id,
          objectiveTitle: oa.title,
          resourceId: r.id,
          resourceTitle: r.title,
          resourceType: r.resourceType,
        };
      }
    }
  }

  return {
    levelSubjectId: input.levelSubjectId,
    subjectName: input.subjectName,
    subjectSlug: input.subjectSlug,
    totalResources: total,
    completedResources: done,
    percent: total ? Math.round((done / total) * 100) : null,
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
  totals: { totalResources: number; completedResources: number; percent: number | null };
}

export function buildOverview(
  level: { id: string; name: string } | null,
  subjects: OverviewSubjectInput[],
  completed: ReadonlySet<string>,
): VorticeOverview {
  const summaries = subjects.map((s) => summarizeSubject(s, completed));
  const pending = summaries.filter((s) => s.next);
  const behind = pending.reduce<SubjectSummary | null>(
    (min, s) => (!min || (s.percent ?? 0) < (min.percent ?? 0) ? s : min),
    null,
  );
  const totalResources = summaries.reduce((n, s) => n + s.totalResources, 0);
  const completedResources = summaries.reduce((n, s) => n + s.completedResources, 0);
  return {
    track: trackForLevel(level?.id),
    level,
    subjects: summaries,
    nextStep: behind?.next ?? null,
    totals: {
      totalResources,
      completedResources,
      percent: totalResources ? Math.round((completedResources / totalResources) * 100) : null,
    },
  };
}
