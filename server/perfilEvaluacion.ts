// Administración del perfil de evaluación del estudiante (regular / neurodivergente)
// y clasificación funcional de evaluaciones por módulo (diagnostico / proceso / modulo).
// Nunca guarda diagnósticos ni documentos clínicos sensibles (O10).
import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import { moduleEvaluations, userProfiles } from "@shared/schema";
import { users } from "@shared/models/auth";
import {
  setEvaluationFunctionSchema,
  setEvaluationProfileSchema,
  type EvaluationProfile,
} from "@shared/clasificacionEvaluacion";

export interface PerfilEvaluacionDTO {
  userId: string;
  perfil: EvaluationProfile;
  setBy: string | null;
  setAt: Date | null;
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
