// Saneamiento de evaluaciones para estudiantes: correctAnswer y explanation solo vuelven
// en la respuesta de POST /api/evaluations/:id/submit, nunca antes.

import { htmlToQuestions, type ConvertedQuestion } from "./evaluationHtml";

// Restos de marcas de corrección que no deben llegar al estudiante en el texto de una pregunta.
const KEY_MARKER = /✓|✔|☑|✅|\(\s*correct[ao]?\s*\)|\bcorrect[ao]s?\b|respuesta\s+correcta|\bclave\b/i;

/**
 * Preguntas corregibles en el servidor de una evaluación, o null si no las hay de forma segura.
 * - questionsJson: se usa tal cual (lo genera la plataforma).
 * - htmlContent: solo si la conversión es completa (todas las preguntas con una correcta, sin
 *   fallidas) y ningún texto conserva marcas de corrección. El HTML original nunca se entrega.
 */
export function gradableQuestions(e: { questionsJson: string | null; htmlContent?: string | null }): ConvertedQuestion[] | null {
  if (e.questionsJson) {
    try {
      const q = JSON.parse(e.questionsJson);
      return Array.isArray(q) && q.length ? q : null;
    } catch {
      return null;
    }
  }
  if (!e.htmlContent) return null;
  const c = htmlToQuestions(e.htmlContent);
  if (!c.questions.length || c.failed.length) return null;
  const leaks = c.questions.some((q) => KEY_MARKER.test(q.question) || q.options.some((o) => KEY_MARKER.test(o)));
  return leaks ? null : c.questions;
}

export interface StudentQuestion {
  id: number;
  question: string;
  options: string[];
}

/** Preguntas sin correctAnswer/explanation (lista blanca de campos). */
export function toStudentQuestions(questionsJson: string): StudentQuestion[] {
  const questions = JSON.parse(questionsJson);
  if (!Array.isArray(questions)) return [];
  return questions.map((q: any) => ({ id: q.id, question: q.question, options: q.options }));
}

/** Fila de module_evaluations sin questionsJson ni htmlContent (lista blanca de campos). */
export function toPublicEvaluation<T extends {
  id: string; learningObjectiveId: string; evaluationNumber: number; title: string;
  description: string | null; releaseDay: number; releaseWeek: number; formUrl: string | null;
  questionsJson: string | null; totalQuestions: number | null; passingScore: number | null; isRequired: boolean | null;
  htmlContent?: string | null;
}>(e: T) {
  return {
    id: e.id,
    learningObjectiveId: e.learningObjectiveId,
    evaluationNumber: e.evaluationNumber,
    title: e.title,
    description: e.description,
    releaseDay: e.releaseDay,
    releaseWeek: e.releaseWeek,
    formUrl: e.formUrl,
    hasQuestions: gradableQuestions(e) !== null,
    totalQuestions: e.totalQuestions ?? gradableQuestions(e)?.length ?? null,
    passingScore: e.passingScore,
    isRequired: e.isRequired,
  };
}
