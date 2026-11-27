// Vórtice familia: portal de solo lectura para apoderados (modo observador).
// Toda consulta parte del vínculo activo apoderado ↔ estudiante; sin vínculo, el estudiante "no existe" (null → 404).
// Recibe la conexión como parámetro para poder probarse contra una base en memoria.
import { and, eq, or, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { z } from "zod";
import * as schema from "@shared/schema";
import {
  guardianLinks, users, userProfiles, studentProgress, evaluationProgress,
  moduleEvaluations, learningObjectives, levelSubjects, subjects,
} from "@shared/schema";
import type { VorticeOverview } from "@shared/vortice";
import { resumenBrujulaParaApoderado, type ResumenBrujulaApoderado } from "@shared/brujulaPanel";
import { loadVorticeOverview } from "./vortice";
import { getBrujulaBlocks, getBrujulaPanel } from "./brujula";
import {
  diasEstudioMotorVorticeEnMes,
  resumenAcompanamientoFamilia,
  type AcompanamientoFamiliaCualitativo,
} from "./actividadUnificada";

type Db = LibSQLDatabase<typeof schema>;

// El colegio opera en Chile: el "día de estudio" se cuenta en hora de Santiago.
const TZ = "America/Santiago";
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

export interface FamiliaStudent {
  studentUserId: string;
  name: string | null;
}

export interface FamiliaResumen {
  student: FamiliaStudent;
  overview: VorticeOverview;
  // Mes en curso (YYYY-MM, hora de Chile) y días distintos con actividad registrada.
  month: string;
  studyDays: number;
  // Evaluaciones rendidas y aún no aprobadas. Sin puntajes ni respuestas.
  evaluationsInReview: { title: string; subjectName: string; completedAt: Date | null }[];
  // Brújula parte 2: orientación cualitativa y bloques semanales, sin notas ni porcentajes.
  brujula: ResumenBrujulaApoderado;
  // M-R07: actividad cualitativa del nuevo circuito (Aula Universal + Práctica), sin notas ni resultados E2.
  acompanamiento: AcompanamientoFamiliaCualitativo;
}

const displayName = (u: { name: string | null; firstName: string | null; lastName: string | null }) =>
  u.name || [u.firstName, u.lastName].filter(Boolean).join(" ") || null;

export async function listLinkedStudents(db: Db, guardianUserId: string): Promise<FamiliaStudent[]> {
  const [perfil] = await db.select({ role: userProfiles.role }).from(userProfiles).where(eq(userProfiles.userId, guardianUserId));
  if (perfil && perfil.role !== "guardian" && perfil.role !== "admin") return [];
  const rows = await db
    .select({ studentUserId: guardianLinks.studentUserId, name: users.name, firstName: users.firstName, lastName: users.lastName })
    .from(guardianLinks)
    .innerJoin(users, eq(guardianLinks.studentUserId, users.id))
    .where(and(eq(guardianLinks.guardianUserId, guardianUserId), eq(guardianLinks.status, "activo")));
  return rows.map((r) => ({ studentUserId: r.studentUserId, name: displayName(r) }));
}

async function linkedStudent(db: Db, guardianUserId: string, studentUserId: string): Promise<FamiliaStudent | null> {
  return (await listLinkedStudents(db, guardianUserId)).find((s) => s.studentUserId === studentUserId) ?? null;
}

// completed_at mezcla unidades: el DEFAULT de la columna guarda milisegundos (student_progress sin fecha
// explícita) y drizzle escribe segundos cuando se pasa un Date. Se lee el entero crudo y se normaliza.
const rawToDate = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? new Date(n > 1e11 ? n : n * 1000) : null;
};

// ponytail: trae todas las marcas del estudiante y filtra en memoria (unidades mixtas); acotar en SQL si crecen mucho.
async function studyDaysInMonth(db: Db, studentUserId: string, now: Date) {
  const month = dayKey(now).slice(0, 7);
  const [res, evs, motorDays] = await Promise.all([
    db.select({ at: sql<number | null>`${studentProgress.completedAt}` }).from(studentProgress).where(eq(studentProgress.userId, studentUserId)),
    db.select({ at: sql<number | null>`${evaluationProgress.completedAt}` }).from(evaluationProgress).where(eq(evaluationProgress.userId, studentUserId)),
    diasEstudioMotorVorticeEnMes(db, studentUserId, month),
  ]);
  const days = new Set([
    ...[...res, ...evs].map((r) => rawToDate(r.at)).filter((d): d is Date => !!d).map(dayKey).filter((d) => d.startsWith(month)),
    ...motorDays,
  ]);
  return { month, studyDays: days.size };
}

async function buildBrujulaResumen(db: Db, studentUserId: string, now: Date): Promise<ResumenBrujulaApoderado> {
  const [panel, blocksView] = await Promise.all([
    getBrujulaPanel(db, studentUserId, now),
    getBrujulaBlocks(db, studentUserId, now),
  ]);
  return resumenBrujulaParaApoderado(panel, {
    intensidad: blocksView.preferencias.intensidad,
    bloquesPlanificados: blocksView.bloques.length,
    bloquesCompletados: blocksView.bloques.filter((b) => b.completado).length,
  });
}

// null = sin vínculo activo (la ruta responde 404 sin distinguir si el estudiante existe).
export async function loadFamiliaResumen(
  db: Db, guardianUserId: string, studentUserId: string, now: Date,
): Promise<FamiliaResumen | null> {
  const student = await linkedStudent(db, guardianUserId, studentUserId);
  if (!student) return null;

  const [overview, days, attempts, brujula, acompanamiento] = await Promise.all([
    loadVorticeOverview(db, studentUserId, now),
    studyDaysInMonth(db, studentUserId, now),
    // Solo columnas no sensibles: nunca answersJson, score ni totalCorrect.
    db.select({
      evaluationId: evaluationProgress.evaluationId, passed: evaluationProgress.passed,
      title: moduleEvaluations.title, subjectName: subjects.name, completedAt: evaluationProgress.completedAt,
    })
      .from(evaluationProgress)
      .innerJoin(moduleEvaluations, eq(evaluationProgress.evaluationId, moduleEvaluations.id))
      .innerJoin(learningObjectives, eq(moduleEvaluations.learningObjectiveId, learningObjectives.id))
      .innerJoin(levelSubjects, eq(learningObjectives.levelSubjectId, levelSubjects.id))
      .innerJoin(subjects, eq(levelSubjects.subjectId, subjects.id))
      .where(eq(evaluationProgress.userId, studentUserId)),
    buildBrujulaResumen(db, studentUserId, now),
    resumenAcompanamientoFamilia(db, studentUserId),
  ]);
  // Hay un registro por intento: "en revisión" = rendida al menos una vez y ningún intento aprobado.
  const byEval = new Map<string, FamiliaResumen["evaluationsInReview"][number] & { passed: boolean }>();
  for (const a of attempts) {
    const prev = byEval.get(a.evaluationId);
    const latest = !prev || (a.completedAt?.getTime() ?? 0) > (prev.completedAt?.getTime() ?? 0) ? a.completedAt : prev.completedAt;
    byEval.set(a.evaluationId, { title: a.title, subjectName: a.subjectName, completedAt: latest, passed: !!prev?.passed || !!a.passed });
  }
  const inReview = [...byEval.values()].filter((e) => !e.passed).map(({ passed: _p, ...e }) => e);
  return { student, overview, ...days, evaluationsInReview: inReview, brujula, acompanamiento };
}

export async function getFamiliaBrujula(
  db: Db, guardianUserId: string, studentUserId: string, now: Date,
): Promise<ResumenBrujulaApoderado | null> {
  const student = await linkedStudent(db, guardianUserId, studentUserId);
  if (!student) return null;
  return buildBrujulaResumen(db, studentUserId, now);
}

export const guardianLinkInput = z.object({
  guardianUserId: z.string().trim().min(1).max(200),
  studentUserId: z.string().trim().min(1).max(200),
  status: z.enum(["pendiente", "activo"]).default("activo"),
}).strict().refine((v) => v.guardianUserId !== v.studentUserId, { message: "Apoderado y estudiante deben ser distintos" });

export type GuardianLinkInput = z.infer<typeof guardianLinkInput>;

// Crea el vínculo o actualiza su estado (idempotente por par). Exige que studentUserId tenga rol
// "student" y que guardianUserId no tenga un rol incompatible (student/tutor/admin).
export async function upsertGuardianLink(db: Db, input: GuardianLinkInput, createdBy: string | undefined) {
  const found = await db.select({ id: users.id }).from(users)
    .where(or(eq(users.id, input.guardianUserId), eq(users.id, input.studentUserId)));
  if (found.length < 2) return { ok: false as const, status: 404 as const, reason: "Usuario no encontrado" };

  const [studentProfile] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.userId, input.studentUserId));
  if (!studentProfile || studentProfile.role !== "student") {
    return { ok: false as const, status: 400 as const, reason: "El usuario vinculado como estudiante debe tener rol student" };
  }

  const [guardianProfile] = await db
    .select({ id: userProfiles.id, role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.userId, input.guardianUserId));
  if (guardianProfile && guardianProfile.role !== "guardian") {
    return { ok: false as const, status: 400 as const, reason: "El apoderado no puede tener rol de estudiante, tutor o administrador" };
  }

  const [link] = await db.insert(guardianLinks)
    .values({ guardianUserId: input.guardianUserId, studentUserId: input.studentUserId, status: input.status, createdBy })
    .onConflictDoUpdate({ target: [guardianLinks.guardianUserId, guardianLinks.studentUserId], set: { status: input.status } })
    .returning();

  if (!guardianProfile) {
    await db.insert(userProfiles).values({ userId: input.guardianUserId, role: "guardian" });
  }

  return { ok: true as const, link };
}

export interface GuardianLinkListado {
  id: string;
  guardianUserId: string;
  guardianEmail: string | null;
  guardianName: string | null;
  studentUserId: string;
  studentEmail: string | null;
  studentName: string | null;
  status: "pendiente" | "activo";
  createdBy: string | null;
  createdAt: Date | null;
}

export async function listAllGuardianLinks(db: Db): Promise<GuardianLinkListado[]> {
  const links = await db.select().from(guardianLinks);
  if (links.length === 0) return [];
  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    firstName: users.firstName,
    lastName: users.lastName,
  }).from(users);
  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  return links.map((l) => {
    const g = userMap.get(l.guardianUserId);
    const s = userMap.get(l.studentUserId);
    return {
      id: l.id,
      guardianUserId: l.guardianUserId,
      guardianEmail: g?.email ?? null,
      guardianName: g ? displayName(g) : null,
      studentUserId: l.studentUserId,
      studentEmail: s?.email ?? null,
      studentName: s ? displayName(s) : null,
      status: l.status,
      createdBy: l.createdBy ?? null,
      createdAt: l.createdAt ?? null,
    };
  });
}

export async function revokeGuardianLink(db: Db, linkId: string) {
  const [deleted] = await db
    .delete(guardianLinks)
    .where(eq(guardianLinks.id, linkId))
    .returning({ id: guardianLinks.id });
  if (!deleted) return { ok: false as const, status: 404 as const, reason: "Vínculo no encontrado" };
  return { ok: true as const, id: deleted.id };
}
