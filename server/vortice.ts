// Vórtice: carga desde la base de datos los datos del resumen del estudiante.
// Recibe la conexión como parámetro para poder probarse contra una base en memoria.
import { and, eq, inArray } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import {
  enrollments, levelSubjects, subjects, levels, learningObjectives, weeklyResources,
  studentProgress, userProfiles, moduleEvaluations, evaluationProgress, reflectionResponses,
  reflectionPromptsSchema, reflectionAnswersSchema, updatePedagogicalStepSchema,
} from "@shared/schema";
import { buildOverview, canViewReflection, type OverviewSubjectInput, type VorticeOverview } from "@shared/vortice";
import { isEvaluationAvailable, isModuleAvailable, type CalendarConfig } from "./calendarUtils";
import { resolveCalendarConfig } from "./calendarConfig";

export async function loadVorticeOverview(
  db: LibSQLDatabase<typeof schema>,
  userId: string,
  now: Date,
): Promise<VorticeOverview> {
  const { level, input, completed, passed } = await loadVorticeInput(db, userId, now);
  return buildOverview(level, input, completed, passed);
}

// Datos crudos del resumen (también los usan las notificaciones, que necesitan el detalle por módulo).
export async function loadVorticeInput(
  db: LibSQLDatabase<typeof schema>,
  userId: string,
  now: Date,
) {
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

  // Calendario resuelto por nivel (normalmente todas las matrículas son del mismo nivel).
  const configs = new Map<string, CalendarConfig>();
  for (const levelId of new Set(rows.map((r) => r.levelId))) configs.set(levelId, await resolveCalendarConfig(db, levelId, now));

  const input: OverviewSubjectInput[] = rows.map((r) => ({
    levelSubjectId: r.levelSubjectId,
    subjectName: r.subjectName,
    subjectSlug: r.subjectSlug,
    objectives: objectives
      .filter((o) => o.levelSubjectId === r.levelSubjectId)
      .map((o) => ({
        id: o.id, code: o.code, title: o.title, weekNumber: o.weekNumber, sortOrder: o.sortOrder,
        available: isModuleAvailable(o.weekNumber, now, completedModules.has(moduleKey(r.levelSubjectId, o.weekNumber - 1)), configs.get(r.levelId)),
        resources: resources
          .filter((x) => x.learningObjectiveId === o.id)
          .map((x) => ({
            id: x.id, title: x.title, resourceType: x.resourceType, sortOrder: x.sortOrder, pedagogicalStep: x.pedagogicalStep,
          })),
        evaluations: evaluations
          .filter((e) => e.learningObjectiveId === o.id)
          .map((e) => ({
            id: e.id, title: e.title, evaluationNumber: e.evaluationNumber,
            // Fuera de 1-4 no hay fecha de liberación definida: se considera disponible.
            available: e.evaluationNumber >= 1 && e.evaluationNumber <= 4
              ? isEvaluationAvailable(o.weekNumber, e.evaluationNumber as 1 | 2 | 3 | 4, now, configs.get(r.levelId))
              : true,
          })),
      })),
  }));

  return { level, input, completed: new Set(done.map((d) => d.resourceId)), passed: passedIds };
}

export type AccessResult =
  | { ok: true; levelSubjectId: string; weekNumber: number }
  | { ok: false; status: 403 | 404; reason: string };

export async function hasActiveEnrollment(
  db: LibSQLDatabase<typeof schema>, userId: string, levelSubjectId: string,
): Promise<boolean> {
  const [enrolled] = await db.select({ id: enrollments.id }).from(enrollments).where(and(
    eq(enrollments.userId, userId), eq(enrollments.levelSubjectId, levelSubjectId), eq(enrollments.isActive, true),
  ));
  return !!enrolled;
}

// Mismas reglas de módulo que el resumen y /api/modules/:n/access: matrícula activa en la
// asignatura, fecha de inicio cumplida y módulo anterior completado (evaluación 2 aprobada).
export async function checkModuleAccess(
  db: LibSQLDatabase<typeof schema>,
  userId: string,
  levelSubjectId: string,
  weekNumber: number,
  now: Date,
  config: CalendarConfig,
): Promise<AccessResult> {
  if (!(await hasActiveEnrollment(db, userId, levelSubjectId))) {
    return { ok: false, status: 403, reason: "No tienes matrícula activa en esta asignatura" };
  }

  if (!(await hasActiveEnrollment(db, userId, levelSubjectId))) return { ok: false, status: 403, reason: "No tienes matrícula activa en esta asignatura" };

  let previousCompleted = true;
  if (weekNumber > 1) {
    const closing = await db.select({ id: moduleEvaluations.id }).from(moduleEvaluations)
      .innerJoin(learningObjectives, eq(moduleEvaluations.learningObjectiveId, learningObjectives.id))
      .where(and(
        eq(learningObjectives.levelSubjectId, levelSubjectId),
        eq(learningObjectives.weekNumber, weekNumber - 1),
        eq(moduleEvaluations.evaluationNumber, 2),
      ));
    const passed = closing.length
      ? await db.select({ id: evaluationProgress.id }).from(evaluationProgress).where(and(
          eq(evaluationProgress.userId, userId),
          eq(evaluationProgress.passed, true),
          inArray(evaluationProgress.evaluationId, closing.map((c) => c.id)),
        ))
      : [];
    previousCompleted = passed.length > 0;
  }
  if (!isModuleAvailable(weekNumber, now, previousCompleted, config)) {
    return { ok: false, status: 403, reason: "El módulo aún no está disponible" };
  }
  return { ok: true, levelSubjectId, weekNumber };
}

export async function checkResourceAccess(
  db: LibSQLDatabase<typeof schema>, userId: string, resourceId: string, now: Date,
): Promise<AccessResult> {
  const [row] = await db.select({
    levelSubjectId: learningObjectives.levelSubjectId, weekNumber: learningObjectives.weekNumber, levelId: levelSubjects.levelId,
  })
    .from(weeklyResources)
    .innerJoin(learningObjectives, eq(weeklyResources.learningObjectiveId, learningObjectives.id))
    .innerJoin(levelSubjects, eq(learningObjectives.levelSubjectId, levelSubjects.id))
    .where(and(eq(weeklyResources.id, resourceId), eq(weeklyResources.isActive, true)));
  if (!row) return { ok: false, status: 404, reason: "Recurso no encontrado" };
  const config = await resolveCalendarConfig(db, row.levelId, now);
  return checkModuleAccess(db, userId, row.levelSubjectId, row.weekNumber, now, config);
}

export async function checkEvaluationAccess(
  db: LibSQLDatabase<typeof schema>, userId: string, evaluationId: string, now: Date,
): Promise<AccessResult> {
  const [row] = await db.select({
    levelSubjectId: learningObjectives.levelSubjectId,
    weekNumber: learningObjectives.weekNumber,
    evaluationNumber: moduleEvaluations.evaluationNumber,
    levelId: levelSubjects.levelId,
  })
    .from(moduleEvaluations)
    .innerJoin(learningObjectives, eq(moduleEvaluations.learningObjectiveId, learningObjectives.id))
    .innerJoin(levelSubjects, eq(learningObjectives.levelSubjectId, levelSubjects.id))
    .where(eq(moduleEvaluations.id, evaluationId));
  if (!row) return { ok: false, status: 404, reason: "Evaluación no encontrada" };
  const config = await resolveCalendarConfig(db, row.levelId, now);
  const n = row.evaluationNumber;
  if (n >= 1 && n <= 4 && !isEvaluationAvailable(row.weekNumber, n as 1 | 2 | 3 | 4, now, config)) {
    return { ok: false, status: 403, reason: "La evaluación aún no está liberada" };
  }
  return checkModuleAccess(db, userId, row.levelSubjectId, row.weekNumber, now, config);
}

// Evaluaciones abiertas del estudiante (para bloquear el copiloto sin depender del cliente):
// matrícula activa, liberada, módulo abierto (misma regla que checkEvaluationAccess) y sin
// intento aprobado. Sin fin de ventana ni límite de intentos (núcleo P0-E pendiente), una
// evaluación sigue abierta hasta aprobarla: el bloqueo peca por exceso, no por defecto.
// ponytail: recorre todas las evaluaciones matriculadas en cada mensaje; cachear si pesa.
export async function openEvaluationsForStudent(
  db: LibSQLDatabase<typeof schema>, userId: string, now: Date,
): Promise<(typeof moduleEvaluations.$inferSelect)[]> {
  const rows = await db.select({
    evaluation: moduleEvaluations,
    levelSubjectId: learningObjectives.levelSubjectId,
    weekNumber: learningObjectives.weekNumber,
    levelId: levelSubjects.levelId,
  })
    .from(enrollments)
    .innerJoin(levelSubjects, eq(enrollments.levelSubjectId, levelSubjects.id))
    .innerJoin(learningObjectives, eq(learningObjectives.levelSubjectId, levelSubjects.id))
    .innerJoin(moduleEvaluations, eq(moduleEvaluations.learningObjectiveId, learningObjectives.id))
    .where(and(eq(enrollments.userId, userId), eq(enrollments.isActive, true)));
  if (!rows.length) return [];

  const passed = new Set((await db.select({ id: evaluationProgress.evaluationId }).from(evaluationProgress)
    .where(and(eq(evaluationProgress.userId, userId), eq(evaluationProgress.passed, true)))).map((r) => r.id));
  const configs = new Map<string, CalendarConfig>();
  const modules = new Map<string, boolean>();
  const open: (typeof moduleEvaluations.$inferSelect)[] = [];
  for (const r of rows) {
    const e = r.evaluation;
    if (passed.has(e.id) || (!e.questionsJson && !e.htmlContent)) continue;
    const levelKey = r.levelId ?? "";
    if (!configs.has(levelKey)) configs.set(levelKey, await resolveCalendarConfig(db, r.levelId, now));
    const config = configs.get(levelKey)!;
    const n = e.evaluationNumber;
    if (n >= 1 && n <= 4 && !isEvaluationAvailable(r.weekNumber, n as 1 | 2 | 3 | 4, now, config)) continue;
    const moduleKey = `${r.levelSubjectId}:${r.weekNumber}`;
    if (!modules.has(moduleKey)) {
      modules.set(moduleKey, (await checkModuleAccess(db, userId, r.levelSubjectId, r.weekNumber, now, config)).ok);
    }
    if (modules.get(moduleKey)) open.push(e);
  }
  return open;
}

// Marcar un recurso como visto dos veces no debe duplicar el registro.
// `created` dice si fue la primera vez (la analítica solo cuenta esa).
export async function markResourceCompleteOnce(
  db: LibSQLDatabase<typeof schema>, userId: string, resourceId: string,
) {
  const [existing] = await db.select().from(studentProgress)
    .where(and(eq(studentProgress.userId, userId), eq(studentProgress.resourceId, resourceId)));
  if (existing) return { progress: existing, created: false };
  const [progress] = await db.insert(studentProgress).values({ userId, resourceId }).returning();
  return { progress, created: true };
}

type Fail = { ok: false; status: 400 | 403 | 404 | 409; reason: string };

// Preguntas guardadas como JSON en el recurso; inválidas o ausentes = sin preguntas.
function parsePrompts(raw: string | null): string[] | null {
  if (!raw) return null;
  try {
    const parsed = reflectionPromptsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// Estudiante responde la reflexión de un recurso: mismo acceso que el recurso, una respuesta
// por pregunta, reenviar sobrescribe. Guardarla marca el recurso como completado.
export async function saveReflection(
  db: LibSQLDatabase<typeof schema>, userId: string, resourceId: string, body: unknown, now: Date,
): Promise<{ ok: true; resourceId: string; prompts: string[]; answers: string[] } | Fail> {
  const access = await checkResourceAccess(db, userId, resourceId, now);
  if (!access.ok) return access;
  const [resource] = await db.select({ resourceType: weeklyResources.resourceType, reflectionPrompts: weeklyResources.reflectionPrompts })
    .from(weeklyResources).where(eq(weeklyResources.id, resourceId));
  if (resource?.resourceType !== "reflexion") return { ok: false, status: 400, reason: "El recurso no es una reflexión" };
  const prompts = parsePrompts(resource.reflectionPrompts);
  if (!prompts) return { ok: false, status: 409, reason: "La reflexión no tiene preguntas configuradas" };
  const parsed = reflectionAnswersSchema.safeParse(body);
  if (!parsed.success) return { ok: false, status: 400, reason: "Respuestas inválidas" };
  const { answers } = parsed.data;
  if (answers.length !== prompts.length) return { ok: false, status: 400, reason: "Debe responder cada pregunta" };

  const answersJson = JSON.stringify(answers);
  await db.insert(reflectionResponses).values({ userId, resourceId, answersJson })
    .onConflictDoUpdate({ target: [reflectionResponses.userId, reflectionResponses.resourceId], set: { answersJson, updatedAt: now } });
  await markResourceCompleteOnce(db, userId, resourceId);
  return { ok: true, resourceId, prompts, answers };
}

// Lectura de la reflexión de un estudiante: él mismo, su tutor asignado o un admin.
export async function getReflection(
  db: LibSQLDatabase<typeof schema>, viewerId: string, studentId: string, resourceId: string,
): Promise<{ ok: true; resourceId: string; userId: string; prompts: string[]; answers: string[]; updatedAt: Date | null } | Fail> {
  const [viewer] = await db.select({ role: userProfiles.role }).from(userProfiles).where(eq(userProfiles.userId, viewerId));
  const [student] = await db.select({ tutorUserId: userProfiles.tutorUserId }).from(userProfiles).where(eq(userProfiles.userId, studentId));
  if (!canViewReflection({ id: viewerId, role: viewer?.role }, { id: studentId, tutorUserId: student?.tutorUserId })) {
    return { ok: false, status: 403, reason: "No puedes ver esta reflexión" };
  }
  const [row] = await db.select({ answersJson: reflectionResponses.answersJson, updatedAt: reflectionResponses.updatedAt, prompts: weeklyResources.reflectionPrompts })
    .from(reflectionResponses)
    .innerJoin(weeklyResources, eq(reflectionResponses.resourceId, weeklyResources.id))
    .where(and(eq(reflectionResponses.userId, studentId), eq(reflectionResponses.resourceId, resourceId)));
  if (!row) return { ok: false, status: 404, reason: "Sin respuesta" };
  return { ok: true, resourceId, userId: studentId, prompts: parsePrompts(row.prompts) ?? [], answers: JSON.parse(row.answersJson), updatedAt: row.updatedAt };
}

// Admin: asigna (o quita con null) el paso pedagógico y, en recursos de reflexión, sus preguntas.
export async function setPedagogicalStep(
  db: LibSQLDatabase<typeof schema>, resourceId: string, body: unknown,
): Promise<{ ok: true; resource: typeof weeklyResources.$inferSelect } | Fail> {
  const parsed = updatePedagogicalStepSchema.safeParse(body);
  if (!parsed.success) return { ok: false, status: 400, reason: "Datos inválidos" };
  const [resource] = await db.select({ resourceType: weeklyResources.resourceType }).from(weeklyResources).where(eq(weeklyResources.id, resourceId));
  if (!resource) return { ok: false, status: 404, reason: "Recurso no encontrado" };
  const { pedagogicalStep, reflectionPrompts } = parsed.data;
  if (reflectionPrompts && resource.resourceType !== "reflexion") {
    return { ok: false, status: 400, reason: "Solo los recursos de reflexión llevan preguntas" };
  }
  const [updated] = await db.update(weeklyResources).set({
    pedagogicalStep,
    ...(reflectionPrompts !== undefined && { reflectionPrompts: reflectionPrompts && JSON.stringify(reflectionPrompts) }),
    updatedAt: new Date(),
  }).where(eq(weeklyResources.id, resourceId)).returning();
  return { ok: true, resource: updated };
}
