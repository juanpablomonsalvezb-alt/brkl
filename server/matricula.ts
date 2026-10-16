// Vórtice: matrícula de un estudiante en un nivel (curso).
// Recibe la conexión como parámetro para poder probarse contra una base en memoria.
import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import { enrollments, levelSubjects, levels, subjects, userProfiles, reservations } from "@shared/schema";
import { users } from "@shared/models/auth";
import { trackForLevel } from "@shared/vortice";

type Db = LibSQLDatabase<typeof schema>;

export interface EnrollResult {
  levelId: string;
  created: string[]; // levelSubjectIds
  reactivated: string[];
  alreadyActive: string[];
  deactivated: string[]; // de otro nivel
}

export class MatriculaError extends Error {
  constructor(public status: 404, message: string) { super(message); }
}

// Idempotente: deja al usuario con perfil en `levelId` y matrícula activa en cada asignatura
// del nivel. Reactiva las inactivas, desactiva las de otros niveles (cambio de curso) y nunca
// borra filas, así el historial y el avance quedan intactos.
//
// Las escrituras van en un solo batch (una transacción en libsql) y cada sentencia es por sí
// misma idempotente (INSERT ... WHERE NOT EXISTS, UPDATE por conjunto): dos llamadas simultáneas
// no duplican filas aunque el informe de la lectura previa quede desfasado.
// No se usa db.transaction(): en libsql local abre otra conexión y la segunda choca con SQLITE_BUSY.
export async function enrollStudentInLevel(db: Db, userId: string, levelId: string): Promise<EnrollResult> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (!user) throw new MatriculaError(404, "Usuario no encontrado");
  const [level] = await db.select({ id: levels.id }).from(levels).where(eq(levels.id, levelId));
  if (!level) throw new MatriculaError(404, "Nivel no encontrado");

  const target = (await db.select({ id: levelSubjects.id }).from(levelSubjects).where(eq(levelSubjects.levelId, levelId))).map((r) => r.id);
  const current = await db.select({ levelSubjectId: enrollments.levelSubjectId, isActive: enrollments.isActive })
    .from(enrollments).where(eq(enrollments.userId, userId));

  const inTarget = new Set(target);
  const covered = new Set(current.map((e) => e.levelSubjectId));
  const uniq = (xs: string[]) => Array.from(new Set(xs));
  const result: EnrollResult = {
    levelId,
    created: target.filter((id) => !covered.has(id)),
    reactivated: uniq(current.filter((e) => inTarget.has(e.levelSubjectId) && !e.isActive).map((e) => e.levelSubjectId)),
    alreadyActive: uniq(current.filter((e) => inTarget.has(e.levelSubjectId) && e.isActive).map((e) => e.levelSubjectId)),
    deactivated: uniq(current.filter((e) => !inTarget.has(e.levelSubjectId) && e.isActive).map((e) => e.levelSubjectId)),
  };

  const levelSubjectIds = db.select({ id: levelSubjects.id }).from(levelSubjects).where(eq(levelSubjects.levelId, levelId));
  await db.batch([
    db.run(sql`insert into user_profiles (id, user_id, level_id) select ${randomUUID()}, ${userId}, ${levelId}
      where not exists (select 1 from user_profiles where user_id = ${userId})`),
    db.update(userProfiles).set({ levelId }).where(eq(userProfiles.userId, userId)),
    db.update(enrollments).set({ isActive: true })
      .where(and(eq(enrollments.userId, userId), inArray(enrollments.levelSubjectId, levelSubjectIds))),
    db.update(enrollments).set({ isActive: false })
      .where(and(eq(enrollments.userId, userId), eq(enrollments.isActive, true), notInArray(enrollments.levelSubjectId, levelSubjectIds))),
    ...target.map((lsId) => db.run(sql`insert into enrollments (id, user_id, level_subject_id) select ${randomUUID()}, ${userId}, ${lsId}
      where not exists (select 1 from enrollments where user_id = ${userId} and level_subject_id = ${lsId})`)),
  ]);
  return result;
}

export async function listEnrollments(db: Db, levelId?: string) {
  return db.select({
    enrollmentId: enrollments.id,
    userId: enrollments.userId,
    email: users.email,
    name: users.name,
    levelId: levels.id,
    levelName: levels.name,
    levelSubjectId: levelSubjects.id,
    subjectName: subjects.name,
    isActive: enrollments.isActive,
    enrolledAt: enrollments.enrolledAt,
  })
    .from(enrollments)
    .innerJoin(levelSubjects, eq(enrollments.levelSubjectId, levelSubjects.id))
    .innerJoin(levels, eq(levelSubjects.levelId, levels.id))
    .innerJoin(subjects, eq(levelSubjects.subjectId, subjects.id))
    .leftJoin(users, eq(enrollments.userId, users.id))
    .where(levelId ? eq(levels.id, levelId) : undefined)
    .orderBy(users.email, subjects.name);
}

export async function findUserIdByEmail(db: Db, email: string): Promise<string | null> {
  const [u] = await db.select({ id: users.id }).from(users)
    .where(sql`lower(${users.email}) = ${email.trim().toLowerCase()}`);
  return u?.id ?? null;
}

// Curso de interés de la reserva ("7basico", "1medio") o de la inscripción ("7° Básico") → id de nivel.
// Solo niveles de Vórtice (1° Básico a 4° Medio); adultos, PAES y textos libres → null.
export function levelIdFromCourse(course: string | null | undefined): string | null {
  const m = (course ?? "").trim().toLowerCase().match(/^([1-8])\s*°?\s*(b[aá]sico|medio)$/);
  if (!m) return null;
  const id = `${m[1]}${m[2].startsWith("m") ? "m" : "b"}`;
  return trackForLevel(id) ? id : null;
}

export type AutoEnrollResult = { ok: true; userId: string; enroll: EnrollResult } | { ok: false; reason: string };

// Punto de enganche del webhook de Flow: matricula al estudiante de una reserva pagada.
// La reserva no guarda userId; el vínculo es el correo del estudiante contra users.email,
// que solo existe si el estudiante ya inició sesión. Un pago nunca cambia de curso a quien
// ya tiene matrícula activa en otro nivel: eso queda para el admin (POST /api/admin/matriculas).
export async function enrollFromPaidReservation(db: Db, reservationId: string): Promise<AutoEnrollResult> {
  const [r] = await db.select().from(reservations).where(eq(reservations.id, reservationId));
  if (!r) return { ok: false, reason: "Reserva no encontrada" };
  if (r.paymentStatus !== "completed") return { ok: false, reason: "Pago no confirmado" };
  const levelId = levelIdFromCourse(r.courseOfInterest || r.levelInterest);
  if (!levelId) return { ok: false, reason: `Curso sin nivel de Vórtice: ${r.courseOfInterest || r.levelInterest || "(vacío)"}` };
  const email = r.studentEmail || r.email;
  if (!email) return { ok: false, reason: "Reserva sin correo del estudiante" };
  const userId = await findUserIdByEmail(db, email);
  if (!userId) return { ok: false, reason: "El estudiante aún no tiene cuenta (no ha iniciado sesión)" };

  const otherLevel = await db.select({ id: enrollments.id }).from(enrollments)
    .innerJoin(levelSubjects, eq(enrollments.levelSubjectId, levelSubjects.id))
    .where(and(eq(enrollments.userId, userId), eq(enrollments.isActive, true), sql`${levelSubjects.levelId} <> ${levelId}`))
    .limit(1);
  if (otherLevel.length) return { ok: false, reason: "El estudiante tiene matrícula activa en otro nivel; requiere admin" };

  const enroll = await enrollStudentInLevel(db, userId, levelId);
  await db.update(reservations).set({ status: "enrolled", updatedAt: new Date() }).where(eq(reservations.id, r.id));
  return { ok: true, userId, enroll };
}
