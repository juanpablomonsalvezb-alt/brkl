// Vórtice: carga desde la base de datos los datos del resumen del estudiante.
// Recibe la conexión como parámetro para poder probarse contra una base en memoria.
import { and, eq, inArray } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import {
  enrollments, levelSubjects, subjects, levels, learningObjectives, weeklyResources,
  studentProgress, userProfiles, moduleEvaluations, evaluationProgress,
} from "@shared/schema";
import { buildOverview, type OverviewSubjectInput, type VorticeOverview } from "@shared/vortice";
import { isEvaluationAvailable, isModuleAvailable } from "./calendarUtils";

export async function loadVorticeOverview(
  db: LibSQLDatabase<typeof schema>,
  userId: string,
  now: Date,
): Promise<VorticeOverview> {
  const rows = await db
    .select({
      levelSubjectId: levelSubjects.id,
      levelId: levels.id,
      levelName: levels.name,
      subjectName: subjects.name,
      subjectSlug: subjects.slug,
    })
    .from(enrollments)
    .innerJoin(levelSubjects, eq(enrollments.levelSubjectId, levelSubjects.id))
    .innerJoin(subjects, eq(levelSubjects.subjectId, subjects.id))
    .innerJoin(levels, eq(levelSubjects.levelId, levels.id))
    .where(and(eq(enrollments.userId, userId), eq(enrollments.isActive, true)));

  // Nivel: el de la matrícula; si aún no hay matrícula, el del perfil.
  let level = rows[0] ? { id: rows[0].levelId, name: rows[0].levelName } : null;
  if (!level) {
    const [profile] = await db.select({ levelId: userProfiles.levelId }).from(userProfiles).where(eq(userProfiles.userId, userId));
    if (profile?.levelId) {
      const [lvl] = await db.select({ id: levels.id, name: levels.name }).from(levels).where(eq(levels.id, profile.levelId));
      level = lvl ?? null;
    }
  }

  const lsIds = rows.map((r) => r.levelSubjectId);
  const objectives = lsIds.length
    ? await db.select().from(learningObjectives).where(inArray(learningObjectives.levelSubjectId, lsIds))
    : [];
  const oaIds = objectives.map((o) => o.id);
  const resources = oaIds.length
    ? await db.select().from(weeklyResources).where(and(inArray(weeklyResources.learningObjectiveId, oaIds), eq(weeklyResources.isActive, true)))
    : [];
  const done = await db.select({ resourceId: studentProgress.resourceId }).from(studentProgress).where(eq(studentProgress.userId, userId));
  const allEvaluations = oaIds.length
    ? await db.select().from(moduleEvaluations).where(inArray(moduleEvaluations.learningObjectiveId, oaIds))
    : [];
  // La evaluación 2 cierra el módulo, así que siempre es un paso aunque no esté marcada obligatoria.
  const evaluations = allEvaluations.filter((e) => e.isRequired || e.evaluationNumber === 2);
  const passed = await db.select({ evaluationId: evaluationProgress.evaluationId }).from(evaluationProgress)
    .where(and(eq(evaluationProgress.userId, userId), eq(evaluationProgress.passed, true)));

  const passedIds = new Set(passed.map((p) => p.evaluationId));
  // Módulo completado = evaluación 2 aprobada (misma regla que storage.getUserCompletedModules).
  const objectiveById = new Map(objectives.map((o) => [o.id, o]));
  const moduleKey = (levelSubjectId: string, weekNumber: number) => `${levelSubjectId}:${weekNumber}`;
  const completedModules = new Set(
    allEvaluations
      .filter((e) => e.evaluationNumber === 2 && passedIds.has(e.id))
      .map((e) => objectiveById.get(e.learningObjectiveId)!)
      .map((o) => moduleKey(o.levelSubjectId, o.weekNumber)),
  );

  const input: OverviewSubjectInput[] = rows.map((r) => ({
    levelSubjectId: r.levelSubjectId,
    subjectName: r.subjectName,
    subjectSlug: r.subjectSlug,
    objectives: objectives
      .filter((o) => o.levelSubjectId === r.levelSubjectId)
      .map((o) => ({
        id: o.id, code: o.code, title: o.title, weekNumber: o.weekNumber, sortOrder: o.sortOrder,
        available: isModuleAvailable(o.weekNumber, now, completedModules.has(moduleKey(r.levelSubjectId, o.weekNumber - 1))),
        resources: resources
          .filter((x) => x.learningObjectiveId === o.id)
          .map((x) => ({ id: x.id, title: x.title, resourceType: x.resourceType, sortOrder: x.sortOrder })),
        evaluations: evaluations
          .filter((e) => e.learningObjectiveId === o.id)
          .map((e) => ({
            id: e.id, title: e.title, evaluationNumber: e.evaluationNumber,
            // Fuera de 1-4 no hay fecha de liberación definida: se considera disponible.
            available: e.evaluationNumber >= 1 && e.evaluationNumber <= 4
              ? isEvaluationAvailable(o.weekNumber, e.evaluationNumber as 1 | 2 | 3 | 4, now)
              : true,
          })),
      })),
  }));

  return buildOverview(level, input, new Set(done.map((d) => d.resourceId)), passedIds);
}
