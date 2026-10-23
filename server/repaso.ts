// Vórtice: repaso espaciado y micropráctica acumulativa sobre preguntas de evaluaciones ya respondidas.
// Recibe la conexión como parámetro para poder probarse contra una base en memoria.
import { and, desc, eq, isNotNull, lte } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import {
  enrollments, evaluationProgress, learningObjectives, levelSubjects, moduleEvaluations, reviewItems, subjects,
} from "@shared/schema";
import { dayKey, initialSchedule, isDue, pickDue, reschedule } from "@shared/repaso";
import { checkEvaluationAccess } from "./vortice";

type Db = LibSQLDatabase<typeof schema>;

interface Question { id: number; question: string; options: string[]; correctAnswer: number; explanation?: string }

function parseJsonArray<T>(json: string | null): T[] {
  try {
    const v = JSON.parse(json ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// Crea los ítems que falten a partir de los intentos de evaluación. Los ítems existentes no se
// tocan: desde que nacen, su programación la maneja solo el repaso. Si hay varios intentos, manda
// el más reciente (orden desc + ON CONFLICT DO NOTHING: la primera fila insertada gana).
// ponytail: recorre todos los intentos del estudiante en cada GET; si pesa, sincronizar al enviar la evaluación.
export async function syncReviewItems(db: Db, userId: string, now: Date): Promise<void> {
  const attempts = await db.select({
    evaluationId: evaluationProgress.evaluationId,
    completedAt: evaluationProgress.completedAt,
    answersJson: evaluationProgress.answersJson,
    questionsJson: moduleEvaluations.questionsJson,
  })
    .from(evaluationProgress)
    .innerJoin(moduleEvaluations, eq(evaluationProgress.evaluationId, moduleEvaluations.id))
    .where(and(eq(evaluationProgress.userId, userId), isNotNull(evaluationProgress.answersJson)))
    .orderBy(desc(evaluationProgress.completedAt));

  const rows: (typeof reviewItems.$inferInsert)[] = [];
  for (const a of attempts) {
    const answers = parseJsonArray<{ questionId: number; answer: number }>(a.answersJson);
    const answeredDay = dayKey(a.completedAt ?? now);
    for (const q of parseJsonArray<Question>(a.questionsJson)) {
      if (!Number.isInteger(q.id)) continue;
      // Pregunta sin responder cuenta como fallada: es justo lo que conviene repasar.
      const correct = answers.some((x) => x?.questionId === q.id && x.answer === q.correctAnswer);
      rows.push({ userId, evaluationId: a.evaluationId, questionId: q.id, ...initialSchedule(correct, answeredDay) });
    }
  }
  for (let i = 0; i < rows.length; i += 200) {
    await db.insert(reviewItems).values(rows.slice(i, i + 200)).onConflictDoNothing();
  }
}

export interface ReviewQuestion {
  id: string;
  question: string;
  options: string[];
  box: number;
  dueDay: string;
  levelSubjectId: string;
  subjectName: string;
  objectiveTitle: string;
}

export interface ReviewSession {
  today: string;
  // Vencidos por asignatura (dominio), antes de aplicar el tope.
  domains: { levelSubjectId: string; subjectName: string; due: number }[];
  items: ReviewQuestion[];
}

// Ítems vencidos hoy (máx. 8), solo de asignaturas con matrícula activa. Sin correctAnswer.
export async function loadDueReview(db: Db, userId: string, now: Date, levelSubjectId?: string): Promise<ReviewSession> {
  await syncReviewItems(db, userId, now);
  const today = dayKey(now);
  const rows = await db.select({
    id: reviewItems.id,
    questionId: reviewItems.questionId,
    box: reviewItems.box,
    dueDay: reviewItems.dueDay,
    questionsJson: moduleEvaluations.questionsJson,
    levelSubjectId: levelSubjects.id,
    subjectName: subjects.name,
    objectiveTitle: learningObjectives.title,
  })
    .from(reviewItems)
    .innerJoin(moduleEvaluations, eq(reviewItems.evaluationId, moduleEvaluations.id))
    .innerJoin(learningObjectives, eq(moduleEvaluations.learningObjectiveId, learningObjectives.id))
    .innerJoin(levelSubjects, eq(learningObjectives.levelSubjectId, levelSubjects.id))
    .innerJoin(subjects, eq(levelSubjects.subjectId, subjects.id))
    .innerJoin(enrollments, and(
      eq(enrollments.levelSubjectId, levelSubjects.id), eq(enrollments.userId, userId), eq(enrollments.isActive, true),
    ))
    .where(and(eq(reviewItems.userId, userId), lte(reviewItems.dueDay, today)));

  const byId = new Map<string, ReviewQuestion & { domain: string }>();
  const questionsCache = new Map<string, Question[]>();
  for (const r of rows) {
    const key = r.questionsJson ?? "";
    if (!questionsCache.has(key)) questionsCache.set(key, parseJsonArray<Question>(r.questionsJson));
    const q = questionsCache.get(key)!.find((x) => x.id === r.questionId);
    if (!q) continue; // la evaluación se regeneró y la pregunta ya no existe
    byId.set(r.id, {
      id: r.id, question: q.question, options: q.options, box: r.box, dueDay: r.dueDay,
      levelSubjectId: r.levelSubjectId, subjectName: r.subjectName, objectiveTitle: r.objectiveTitle,
      domain: r.levelSubjectId,
    });
  }
  const all = [...byId.values()];

  const domains = new Map<string, ReviewSession["domains"][number]>();
  for (const i of all) {
    const d = domains.get(i.domain) ?? { levelSubjectId: i.levelSubjectId, subjectName: i.subjectName, due: 0 };
    d.due++;
    domains.set(i.domain, d);
  }

  const pool = levelSubjectId ? all.filter((i) => i.levelSubjectId === levelSubjectId) : all;
  const items = pickDue(pool, today).map(({ domain, ...rest }) => rest);
  return { today, domains: [...domains.values()], items };
}

export type AnswerResult =
  | { ok: true; registrado: true }
  | { ok: false; status: 403 | 404 | 409; reason: string };

// Corrige en el servidor y reprograma. Solo se puede responder un ítem vencido, una vez por vencimiento.
export async function answerReviewItem(db: Db, userId: string, itemId: string, answer: number, now: Date): Promise<AnswerResult> {
  const [item] = await db.select().from(reviewItems).where(and(eq(reviewItems.id, itemId), eq(reviewItems.userId, userId)));
  if (!item) return { ok: false, status: 404, reason: "Ítem de repaso no encontrado" };

  const access = await checkEvaluationAccess(db, userId, item.evaluationId, now);
  if (!access.ok) return access;

  const [ev] = await db.select({ questionsJson: moduleEvaluations.questionsJson }).from(moduleEvaluations)
    .where(eq(moduleEvaluations.id, item.evaluationId));
  const q = parseJsonArray<Question>(ev?.questionsJson ?? null).find((x) => x.id === item.questionId);
  if (!q) return { ok: false, status: 404, reason: "La pregunta ya no existe" };

  const today = dayKey(now);
  if (!isDue(item, today)) return { ok: false, status: 409, reason: "Este ítem aún no toca repasarlo" };

  const correct = answer === q.correctAnswer;
  const next = reschedule(item.box, correct, today);
  // Condición sobre dueDay: dos envíos simultáneos no pueden reprogramar dos veces.
  const updated = await db.update(reviewItems)
    .set({ box: next.box, dueDay: next.dueDay, reviews: item.reviews + 1, lastReviewedAt: now })
    .where(and(eq(reviewItems.id, item.id), eq(reviewItems.dueDay, item.dueDay)))
    .returning({ id: reviewItems.id });
  if (!updated.length) return { ok: false, status: 409, reason: "Este ítem ya se respondió" };

  // Las preguntas del repaso son las de evaluaciones cuyos intentos pueden no estar agotados:
  // devolver la clave, la explicación, si acertó o la nueva caja/fecha permitiría deducir la
  // respuesta y volver a rendir con ella. Solo se confirma el registro. La política completa de
  // revelación depende del límite de intentos (P0-E, pendiente). Riesgo residual: el ítem vuelve
  // antes si se falló, así que el acierto se puede inferir con días de retraso.
  return { ok: true, registrado: true };
}
