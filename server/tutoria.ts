// Tutoría humana como caso (Atlas #006). Recibe la conexión como parámetro para probarse
// contra una base en memoria. Los permisos se deciden aquí por el rol de user_profiles,
// sin depender de los middlewares de la ruta (isAdmin hoy deja pasar a todos).
import { and, asc, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { z } from "zod";
import * as schema from "@shared/schema";
import {
  enrollments, learningObjectives, weeklyResources, userProfiles, tutoringCases,
  tutoringCaseStatuses, levelSubjects, levels, subjects, users, type TutoringCase,
} from "@shared/schema";

type Db = LibSQLDatabase<typeof schema>;
type Role = (typeof userProfiles.$inferSelect)["role"];
export type TutoriaResult<T> = { ok: true; value: T } | { ok: false; status: 400 | 403 | 404 | 409; reason: string };

// ponytail: tope fijo de casos sin cerrar por estudiante contra spam; configurable si hace falta.
export const MAX_OPEN_CASES = 5;

const id = z.string().trim().min(1).max(64);
export const crearCasoSchema = z.object({
  learningObjectiveId: id,
  resourceId: id.optional(),
  pregunta: z.string().trim().min(10).max(2000),
}).strict();
export const asignarCasoSchema = z.object({ tutorId: z.string().trim().min(1).max(128) }).strict();
export const responderCasoSchema = z.object({ respuesta: z.string().trim().min(1).max(4000) }).strict();
export const cerrarCasoSchema = z.object({ notaCierre: z.string().trim().min(1).max(1000) }).strict();
export const estadoCasoSchema = z.enum(tutoringCaseStatuses);

const fail = (status: 400 | 403 | 404 | 409, reason: string) => ({ ok: false as const, status, reason });
const invalid = (e: z.ZodError) => fail(400, e.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; "));

async function roleOf(db: Db, userId: string): Promise<Role | null> {
  const [p] = await db.select({ role: userProfiles.role }).from(userProfiles).where(eq(userProfiles.userId, userId));
  return p?.role ?? null;
}

async function requireRole(db: Db, userId: string, role: Role) {
  return (await roleOf(db, userId)) === role ? null : fail(403, `Requiere rol ${role}`);
}

export async function crearCaso(db: Db, studentId: string, body: unknown, now: Date): Promise<TutoriaResult<TutoringCase>> {
  const denied = await requireRole(db, studentId, "student");
  if (denied) return denied;
  const parsed = crearCasoSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);
  const { learningObjectiveId, resourceId, pregunta } = parsed.data;

  const [oa] = await db.select({ levelSubjectId: learningObjectives.levelSubjectId })
    .from(learningObjectives).where(eq(learningObjectives.id, learningObjectiveId));
  if (!oa) return fail(404, "Objetivo no encontrado");
  const [enrolled] = await db.select({ id: enrollments.id }).from(enrollments).where(and(
    eq(enrollments.userId, studentId), eq(enrollments.levelSubjectId, oa.levelSubjectId), eq(enrollments.isActive, true),
  ));
  if (!enrolled) return fail(403, "No tienes matrícula activa en esta asignatura");
  if (resourceId) {
    const [r] = await db.select({ id: weeklyResources.id }).from(weeklyResources).where(and(
      eq(weeklyResources.id, resourceId), eq(weeklyResources.learningObjectiveId, learningObjectiveId), eq(weeklyResources.isActive, true),
    ));
    if (!r) return fail(404, "Actividad no encontrada en este objetivo");
  }
  const open = await db.select({ id: tutoringCases.id }).from(tutoringCases)
    .where(and(eq(tutoringCases.studentId, studentId), ne(tutoringCases.status, "cerrado")));
  if (open.length >= MAX_OPEN_CASES) return fail(409, `Ya tienes ${MAX_OPEN_CASES} casos sin cerrar`);

  const [created] = await db.insert(tutoringCases).values({
    studentId, learningObjectiveId, resourceId: resourceId ?? null, question: pregunta, createdAt: now,
  }).returning();
  return { ok: true, value: created };
}

export async function casosDelEstudiante(db: Db, studentId: string): Promise<TutoriaResult<TutoringCase[]>> {
  const denied = await requireRole(db, studentId, "student");
  if (denied) return denied;
  return { ok: true, value: await db.select().from(tutoringCases).where(eq(tutoringCases.studentId, studentId)).orderBy(desc(tutoringCases.createdAt)) };
}

export async function casosDelTutor(db: Db, tutorId: string): Promise<TutoriaResult<TutoringCase[]>> {
  const denied = await requireRole(db, tutorId, "tutor");
  if (denied) return denied;
  return { ok: true, value: await db.select().from(tutoringCases).where(eq(tutoringCases.tutorId, tutorId)).orderBy(desc(tutoringCases.createdAt)) };
}

export async function casosParaAdmin(db: Db, adminId: string, estado: unknown): Promise<TutoriaResult<TutoringCase[]>> {
  const denied = await requireRole(db, adminId, "admin");
  if (denied) return denied;
  const filtro = estado === undefined ? null : estadoCasoSchema.safeParse(estado);
  if (filtro && !filtro.success) return invalid(filtro.error);
  const q = db.select().from(tutoringCases);
  return { ok: true, value: await (filtro ? q.where(eq(tutoringCases.status, filtro.data)) : q).orderBy(desc(tutoringCases.createdAt)) };
}

// Aplica una transición solo si el caso sigue en el estado esperado (evita carreras).
async function transicion(
  db: Db, caseId: string, from: TutoringCase["status"][], extra: ReturnType<typeof eq> | undefined,
  set: Partial<typeof tutoringCases.$inferInsert>,
): Promise<TutoriaResult<TutoringCase>> {
  const [updated] = await db.update(tutoringCases).set(set)
    .where(and(eq(tutoringCases.id, caseId), inArray(tutoringCases.status, from), extra)).returning();
  return updated ? { ok: true, value: updated } : fail(409, "El caso cambió de estado; recarga e intenta de nuevo");
}

export async function asignarCaso(db: Db, adminId: string, caseId: string, body: unknown, now: Date): Promise<TutoriaResult<TutoringCase>> {
  const denied = await requireRole(db, adminId, "admin");
  if (denied) return denied;
  const parsed = asignarCasoSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);
  const [caso] = await db.select().from(tutoringCases).where(eq(tutoringCases.id, caseId));
  if (!caso) return fail(404, "Caso no encontrado");
  if (caso.status !== "abierto" && caso.status !== "asignado") return fail(409, `No se puede asignar un caso ${caso.status}`);
  if ((await roleOf(db, parsed.data.tutorId)) !== "tutor") return fail(400, "El responsable debe tener rol tutor");
  // Reasignar (asignado → asignado) reinicia assignedAt: el tiempo se mide desde el responsable actual.
  return transicion(db, caseId, ["abierto", "asignado"], undefined, { tutorId: parsed.data.tutorId, status: "asignado", assignedAt: now });
}

// Bandeja compartida del tutor (decisión 9, 2026-11-23): el tutor ve los casos sin asignar y los TOMA; así una sola
// persona puede ser tutor de todos sin necesitar una cuenta de administrador. Cada caso trae el contexto mínimo para
// responder (estudiante, curso, asignatura y objetivo); no se expone el correo.
export type CasoTutor = TutoringCase & {
  estudiante: string; curso: string; asignatura: string; objetivoCodigo: string; objetivoTitulo: string;
};

async function casosConContexto(db: Db, condicion: ReturnType<typeof and>, orden: ReturnType<typeof asc>): Promise<CasoTutor[]> {
  const filas = await db.select({
    caso: tutoringCases, nombre: users.name, primerNombre: users.firstName,
    curso: levels.name, asignatura: subjects.name, objetivoCodigo: learningObjectives.code, objetivoTitulo: learningObjectives.title,
  }).from(tutoringCases)
    .innerJoin(users, eq(tutoringCases.studentId, users.id))
    .innerJoin(learningObjectives, eq(tutoringCases.learningObjectiveId, learningObjectives.id))
    .innerJoin(levelSubjects, eq(learningObjectives.levelSubjectId, levelSubjects.id))
    .innerJoin(levels, eq(levelSubjects.levelId, levels.id))
    .innerJoin(subjects, eq(levelSubjects.subjectId, subjects.id))
    .where(condicion).orderBy(orden);
  return filas.map((f) => ({
    ...f.caso, estudiante: f.nombre || f.primerNombre || "Estudiante sin nombre",
    curso: f.curso, asignatura: f.asignatura, objetivoCodigo: f.objetivoCodigo, objetivoTitulo: f.objetivoTitulo,
  }));
}

export async function bandejaTutor(db: Db, tutorId: string): Promise<TutoriaResult<{ sinAsignar: CasoTutor[]; mios: CasoTutor[] }>> {
  const denied = await requireRole(db, tutorId, "tutor");
  if (denied) return denied;
  return {
    ok: true,
    value: {
      // Los que llevan más tiempo esperando, primero.
      sinAsignar: await casosConContexto(db, and(eq(tutoringCases.status, "abierto"), isNull(tutoringCases.tutorId)), asc(tutoringCases.createdAt)),
      mios: await casosConContexto(db, and(eq(tutoringCases.tutorId, tutorId), ne(tutoringCases.status, "cerrado")), asc(tutoringCases.createdAt)),
    },
  };
}

export async function tomarCaso(db: Db, tutorId: string, caseId: string, now: Date): Promise<TutoriaResult<TutoringCase>> {
  const denied = await requireRole(db, tutorId, "tutor");
  if (denied) return denied;
  const [caso] = await db.select({ id: tutoringCases.id }).from(tutoringCases).where(eq(tutoringCases.id, caseId));
  if (!caso) return fail(404, "Caso no encontrado");
  // Solo desde «abierto» y sin responsable: si otro tutor lo tomó antes, la transición no aplica y responde 409.
  return transicion(db, caseId, ["abierto"], isNull(tutoringCases.tutorId), { tutorId, status: "asignado", assignedAt: now });
}

async function casoDelTutor(db: Db, tutorId: string, caseId: string) {
  const denied = await requireRole(db, tutorId, "tutor");
  if (denied) return denied;
  const [caso] = await db.select({ tutorId: tutoringCases.tutorId }).from(tutoringCases).where(eq(tutoringCases.id, caseId));
  // Mismo 404 si no existe o es de otro tutor: no se revela la existencia de casos ajenos.
  if (!caso || caso.tutorId !== tutorId) return fail(404, "Caso no encontrado");
  return null;
}

export async function responderCaso(db: Db, tutorId: string, caseId: string, body: unknown, now: Date): Promise<TutoriaResult<TutoringCase>> {
  const denied = await casoDelTutor(db, tutorId, caseId);
  if (denied) return denied;
  const parsed = responderCasoSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);
  return transicion(db, caseId, ["asignado"], eq(tutoringCases.tutorId, tutorId), { response: parsed.data.respuesta, status: "respondido", respondedAt: now });
}

export async function cerrarCaso(db: Db, tutorId: string, caseId: string, body: unknown, now: Date): Promise<TutoriaResult<TutoringCase>> {
  const denied = await casoDelTutor(db, tutorId, caseId);
  if (denied) return denied;
  const parsed = cerrarCasoSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);
  return transicion(db, caseId, ["respondido"], eq(tutoringCases.tutorId, tutorId), { closingNote: parsed.data.notaCierre, status: "cerrado", closedAt: now });
}
