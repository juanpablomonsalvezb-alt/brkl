// Administración del perfil de evaluación del estudiante (regular / neurodivergente)
// y clasificación funcional de evaluaciones por módulo (diagnostico / proceso / modulo).
// Nunca guarda diagnósticos ni documentos clínicos sensibles (O10).
import { asc, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import { learningObjectives, levels, levelSubjects, moduleEvaluations, subjects, userProfiles } from "@shared/schema";
import { users } from "@shared/models/auth";
import {
  etiquetaEvaluacion,
  funcionEfectivaEvaluacion,
  setEvaluationFunctionSchema,
  setEvaluationProfileSchema,
  type EvaluationFunction,
  type EvaluationProfile,
} from "@shared/clasificacionEvaluacion";

export interface PerfilEvaluacionDTO {
  userId: string;
  perfil: EvaluationProfile;
  setBy: string | null;
  setAt: Date | null;
}

export interface PerfilEstudianteListadoDTO extends PerfilEvaluacionDTO {
  email: string | null;
  name: string | null;
  role: string;
  levelId: string | null;
}

export interface ClasificacionEvaluacionDTO {
  id: string;
  learningObjectiveId: string;
  objectiveCode: string;
  objectiveTitle: string;
  moduleNumber: number;
  subjectName: string | null;
  levelName: string | null;
  evaluationNumber: number;
  title: string;
  evaluationFunction: EvaluationFunction | null;
  effectiveFunction: EvaluationFunction | null;
  heredadoP7: boolean;
  etiqueta: string;
}

type Res<T> = { ok: true; value: T } | { ok: false; status: 400 | 403 | 404; reason: string };

async function esAdmin(db: LibSQLDatabase<typeof schema>, userId: string): Promise<boolean> {
  const [p] = await db.select({ role: userProfiles.role }).from(userProfiles).where(eq(userProfiles.userId, userId));
  return p?.role === "admin";
}

export async function getPerfilEvaluacion(
  db: LibSQLDatabase<typeof schema>,
  studentUserId: string,
): Promise<PerfilEvaluacionDTO> {
  const [row] = await db.select({
    evaluationProfile: userProfiles.evaluationProfile,
    evaluationProfileSetBy: userProfiles.evaluationProfileSetBy,
    evaluationProfileSetAt: userProfiles.evaluationProfileSetAt,
  }).from(userProfiles).where(eq(userProfiles.userId, studentUserId));

  return {
    userId: studentUserId,
    perfil: row?.evaluationProfile === "neurodivergente" ? "neurodivergente" : "regular",
    setBy: row?.evaluationProfileSetBy ?? null,
    setAt: row?.evaluationProfileSetAt ?? null,
  };
}

export async function setPerfilEvaluacion(
  db: LibSQLDatabase<typeof schema>,
  params: { adminUserId: string; studentUserId: string; body: unknown; now: Date },
): Promise<Res<PerfilEvaluacionDTO>> {
  if (!(await esAdmin(db, params.adminUserId))) {
    return { ok: false, status: 403, reason: "Solo un administrador puede cambiar el perfil de evaluación" };
  }
  const parsed = setEvaluationProfileSchema.safeParse(params.body);
  if (!parsed.success) {
    return { ok: false, status: 400, reason: "Perfil inválido (use regular o neurodivergente, sin campos adicionales)" };
  }
  const [student] = await db.select({ id: users.id }).from(users).where(eq(users.id, params.studentUserId));
  if (!student) {
    return { ok: false, status: 404, reason: "Estudiante no encontrado" };
  }

  const [existing] = await db.select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.userId, params.studentUserId));

  if (existing) {
    await db.update(userProfiles).set({
      evaluationProfile: parsed.data.perfil,
      evaluationProfileSetBy: params.adminUserId,
      evaluationProfileSetAt: params.now,
    }).where(eq(userProfiles.userId, params.studentUserId));
  } else {
    await db.insert(userProfiles).values({
      userId: params.studentUserId,
      role: "student",
      evaluationProfile: parsed.data.perfil,
      evaluationProfileSetBy: params.adminUserId,
      evaluationProfileSetAt: params.now,
    });
  }

  return {
    ok: true,
    value: {
      userId: params.studentUserId,
      perfil: parsed.data.perfil,
      setBy: params.adminUserId,
      setAt: params.now,
    },
  };
}

export async function setFuncionEvaluacion(
  db: LibSQLDatabase<typeof schema>,
  params: { adminUserId: string; evaluationId: string; body: unknown },
): Promise<Res<typeof moduleEvaluations.$inferSelect>> {
  if (!(await esAdmin(db, params.adminUserId))) {
    return { ok: false, status: 403, reason: "Solo un administrador puede clasificar evaluaciones" };
  }
  const parsed = setEvaluationFunctionSchema.safeParse(params.body);
  if (!parsed.success) {
    return { ok: false, status: 400, reason: "Función de evaluación inválida" };
  }
  const [existing] = await db.select().from(moduleEvaluations).where(eq(moduleEvaluations.id, params.evaluationId));
  if (!existing) {
    return { ok: false, status: 404, reason: "Evaluación no encontrada" };
  }
  const [updated] = await db.update(moduleEvaluations)
    .set({ evaluationFunction: parsed.data.evaluationFunction })
    .where(eq(moduleEvaluations.id, params.evaluationId))
    .returning();
  return { ok: true, value: updated };
}

export async function listarPerfilesEvaluacion(
  db: LibSQLDatabase<typeof schema>,
  adminUserId: string,
): Promise<Res<PerfilEstudianteListadoDTO[]>> {
  if (!(await esAdmin(db, adminUserId))) {
    return { ok: false, status: 403, reason: "Solo un administrador puede consultar perfiles de evaluación" };
  }
  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      firstName: users.firstName,
      lastName: users.lastName,
      role: userProfiles.role,
      levelId: userProfiles.levelId,
      evaluationProfile: userProfiles.evaluationProfile,
      setBy: userProfiles.evaluationProfileSetBy,
      setAt: userProfiles.evaluationProfileSetAt,
    })
    .from(users)
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .orderBy(asc(users.email));

  // Solo devuelve campos no clínicos (O10): identificador, rol, curso, perfil y auditoría.
  return {
    ok: true,
    value: rows.map((r) => {
      const nombreDerivado =
        r.name?.trim() || [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || null;
      return {
        userId: r.userId,
        email: r.email ?? null,
        name: nombreDerivado,
        role: r.role ?? "student",
        levelId: r.levelId ?? null,
        perfil: r.evaluationProfile === "neurodivergente" ? "neurodivergente" : "regular",
        setBy: r.setBy ?? null,
        setAt: r.setAt ?? null,
      };
    }),
  };
}

export async function listarClasificacionEvaluaciones(
  db: LibSQLDatabase<typeof schema>,
  adminUserId: string,
): Promise<Res<ClasificacionEvaluacionDTO[]>> {
  if (!(await esAdmin(db, adminUserId))) {
    return { ok: false, status: 403, reason: "Solo un administrador puede consultar la clasificación de evaluaciones" };
  }
  const rows = await db
    .select({
      id: moduleEvaluations.id,
      learningObjectiveId: moduleEvaluations.learningObjectiveId,
      objectiveCode: learningObjectives.code,
      objectiveTitle: learningObjectives.title,
      moduleNumber: learningObjectives.weekNumber,
      subjectName: subjects.name,
      levelName: levels.name,
      evaluationNumber: moduleEvaluations.evaluationNumber,
      title: moduleEvaluations.title,
      evaluationFunction: moduleEvaluations.evaluationFunction,
    })
    .from(moduleEvaluations)
    .innerJoin(learningObjectives, eq(moduleEvaluations.learningObjectiveId, learningObjectives.id))
    .leftJoin(levelSubjects, eq(learningObjectives.levelSubjectId, levelSubjects.id))
    .leftJoin(subjects, eq(levelSubjects.subjectId, subjects.id))
    .leftJoin(levels, eq(levelSubjects.levelId, levels.id))
    .orderBy(
      asc(learningObjectives.weekNumber),
      asc(learningObjectives.code),
      asc(moduleEvaluations.evaluationNumber),
    );

  const porObjetivo = new Map<string, typeof rows>();
  for (const r of rows) {
    const arr = porObjetivo.get(r.learningObjectiveId) ?? [];
    arr.push(r);
    porObjetivo.set(r.learningObjectiveId, arr);
  }

  return {
    ok: true,
    value: rows.map((r) => {
      const grupo = porObjetivo.get(r.learningObjectiveId) ?? [r];
      const { effectiveFunction, heredadoP7 } = funcionEfectivaEvaluacion(grupo, r);
      return {
        id: r.id,
        learningObjectiveId: r.learningObjectiveId,
        objectiveCode: r.objectiveCode,
        objectiveTitle: r.objectiveTitle,
        moduleNumber: r.moduleNumber,
        subjectName: r.subjectName ?? null,
        levelName: r.levelName ?? null,
        evaluationNumber: r.evaluationNumber,
        title: r.title,
        evaluationFunction: r.evaluationFunction ?? null,
        effectiveFunction,
        heredadoP7,
        etiqueta: etiquetaEvaluacion(effectiveFunction, r.evaluationNumber),
      };
    }),
  };
}
