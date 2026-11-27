import { and, asc, eq, isNotNull, max, min } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import {
  enrollments, evaluationProgress, learningEvents, lessonStudyProgress, levelSubjects,
  portfolioEvidences, reflectionResponses, studentProgress,
} from "@shared/schema";
import { diasSinActividad } from "@shared/atencion";
import { getModuleStartDate } from "./calendarUtils";
import { resolveCalendarConfig } from "./calendarConfig";
import { ultimaActividadMotorVortice } from "./actividadUnificada";

type Db = LibSQLDatabase<typeof schema>;

export async function ultimaActividad(db: Db, userId: string): Promise<Date | null> {
  const [eventos, progreso, leccion, evaluacion, reflexion, portafolio, motorVortice] = await Promise.all([
    db.select({ fecha: max(learningEvents.createdAt) }).from(learningEvents).where(eq(learningEvents.userId, userId)),
    db.select({ fecha: max(studentProgress.completedAt) }).from(studentProgress).where(eq(studentProgress.userId, userId)),
    db.select({ fecha: max(lessonStudyProgress.updatedAt) }).from(lessonStudyProgress).where(eq(lessonStudyProgress.userId, userId)),
    db.select({ fecha: max(evaluationProgress.completedAt) }).from(evaluationProgress).where(eq(evaluationProgress.userId, userId)),
    db.select({ fecha: max(reflectionResponses.updatedAt) }).from(reflectionResponses).where(eq(reflectionResponses.userId, userId)),
    db.select({ fecha: max(portfolioEvidences.updatedAt) }).from(portfolioEvidences).where(eq(portfolioEvidences.userId, userId)),
    ultimaActividadMotorVortice(db, userId),
  ]);

  // limitación: brujula_study_blocks guarda los bloques en JSON y no se consulta aquí su estado completado.
  const fechas = [eventos[0]?.fecha, progreso[0]?.fecha, leccion[0]?.fecha, evaluacion[0]?.fecha, reflexion[0]?.fecha, portafolio[0]?.fecha, motorVortice]
    .filter((fecha): fecha is Date => fecha instanceof Date);
  return fechas.reduce<Date | null>((ultima, fecha) => ultima === null || fecha > ultima ? fecha : ultima, null);
}

export async function inicioMedicion(db: Db, userId: string, ahora: Date): Promise<Date | null> {
  const [matricula] = await db.select({
    fecha: min(enrollments.enrolledAt),
    levelId: levelSubjects.levelId,
  })
    .from(enrollments)
    .innerJoin(levelSubjects, eq(enrollments.levelSubjectId, levelSubjects.id))
    .where(and(
      eq(enrollments.userId, userId),
      eq(enrollments.isActive, true),
      isNotNull(enrollments.enrolledAt),
    ))
    .groupBy(levelSubjects.levelId)
    .orderBy(asc(min(enrollments.enrolledAt)))
    .limit(1);

  const config = await resolveCalendarConfig(db, matricula?.levelId, ahora);
  const inicioCalendario = getModuleStartDate(1, config);
  const inicio = matricula?.fecha && matricula.fecha > inicioCalendario ? matricula.fecha : inicioCalendario;
  return ahora < inicio ? null : inicio;
}

export async function diasSinActividadDe(db: Db, userId: string, ahora: Date): Promise<number | null> {
  return diasSinActividad(ahora, await ultimaActividad(db, userId), await inicioMedicion(db, userId, ahora));
}