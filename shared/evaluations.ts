// Saneamiento de evaluaciones para estudiantes: correctAnswer y explanation solo vuelven
// en la respuesta de POST /api/evaluations/:id/submit, nunca antes.

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
    hasQuestions: !!e.questionsJson,
    totalQuestions: e.totalQuestions,
    passingScore: e.passingScore,
    isRequired: e.isRequired,
  };
}
