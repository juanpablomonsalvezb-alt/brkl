// Vórtice: repaso espaciado y micropráctica acumulativa sobre preguntas de evaluaciones ya respondidas.
// Recibe la conexión como parámetro para poder probarse contra una base en memoria.
import { and, desc, eq, isNotNull, lte } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import {
  enrollments, evaluationProgress, learningObjectives, levelSubjects, moduleEvaluations, reviewItems, subjects,
} from "@shared/schema";
import { dayKey, initialSchedule, isDue, pickDue, reschedule } from "@shared/repaso";
import { gradableQuestions } from "@shared/evaluations";
import { checkEvaluationAccess } from "./vortice";

type Db = LibSQLDatabase<typeof schema>;

// Mientras no exista límite de intentos (P0-E), las preguntas del repaso pertenecen a evaluaciones
// que el estudiante puede volver a rendir. Si la caja o la fecha dependieran del acierto, el orden,
// la fecha de regreso o el número de ítems vencidos delatarían qué respondió bien. Por eso la
// programación es neutra: todo ítem nace en la caja 0 y avanza una caja al responderlo, acierte o no.
// ponytail: Leitner adaptativo suspendido; reactivar el acierto cuando P0-E revele la clave.
// Solo preguntas válidas (correctAnswer dentro de las alternativas); con una inválida, ninguna.
const validQuestions = (questionsJson: string | null) => (questionsJson ? gradableQuestions({ questionsJson }) : null) ?? [];

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
    const answeredDay = dayKey(a.completedAt ?? now);
    for (const q of validQuestions(a.questionsJson)) {
      // Programación neutra: caja 0 para todas, sin mirar las respuestas.
      rows.push({ userId, evaluationId: a.evaluationId, questionId: q.id, ...initialSchedule(false, answeredDay) });
    }
  }
  for (let i = 0; i < rows.length; i += 200) {
    await db.insert(reviewItems).values(rows.slice(i, i + 200)).onConflictDoNothing();
  }
}

// Sin caja ni fecha: no se exponen datos de programación al estudiante.
export interface ReviewQuestion {
  id: string;
  question: string;
  options: string[];
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

  const byId = new Map<string, ReviewQuestion & { domain: string; box: number; dueDay: string }>();
  const questionsCache = new Map<string, { id: number; question: string; options: string[] }[]>();
  for (const r of rows) {
    const key = r.questionsJson ?? "";
    if (!questionsCache.has(key)) questionsCache.set(key, validQuestions(r.questionsJson));
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
  const items = pickDue(pool, today).map(({ domain, box, dueDay, ...rest }) => rest);
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
  const q = validQuestions(ev?.questionsJson ?? null).find((x) => x.id === item.questionId);
  if (!q) return { ok: false, status: 404, reason: "La pregunta ya no existe" };

  const today = dayKey(now);
  if (!isDue(item, today)) return { ok: false, status: 409, reason: "Este ítem aún no toca repasarlo" };

  // Programación neutra (ver validQuestions): avanza igual acierte o no. La respuesta no se usa
  // hasta P0-E; se valida solo que sea una alternativa existente.
  if (answer < 0 || answer >= q.options.length) return { ok: false, status: 409, reason: "Alternativa inexistente" };
  const next = reschedule(item.box, true, today);
  // Condición sobre dueDay: dos envíos simultáneos no pueden reprogramar dos veces.
  const updated = await db.update(reviewItems)
    .set({ box: next.box, dueDay: next.dueDay, reviews: item.reviews + 1, lastReviewedAt: now })
    .where(and(eq(reviewItems.id, item.id), eq(reviewItems.dueDay, item.dueDay)))
    .returning({ id: reviewItems.id });
  if (!updated.length) return { ok: false, status: 409, reason: "Este ítem ya se respondió" };

  // Las preguntas del repaso son las de evaluaciones cuyos intentos pueden no estar agotados:
  // devolver la clave, la explicación, si acertó o la nueva caja/fecha permitiría deducir la
  // respuesta y volver a rendir con ella. Solo se confirma el registro. La política completa de
  // revelación depende del límite de intentos (P0-E, pendiente).
  return { ok: true, registrado: true };
}
