import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check, X, Loader2 } from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
}

// El servidor solo informa el resultado; ni puntaje, ni correctas, ni pauta.
interface EvaluationResult {
  resultado: "aprobado" | "no_aprobado";
}

interface EvaluationQuizProps {
  evaluationId: string;
  title: string;
  questions: Question[];
  passingScore: number;
  onComplete: (result: EvaluationResult) => void;
  onClose: () => void;
}

export function EvaluationQuiz({
  evaluationId,
  title,
  questions,
  passingScore,
  onComplete,
  onClose
}: EvaluationQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; answer: number }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<EvaluationResult | null>(null);

  const submitMutation = useMutation({
    mutationFn: async (submittedAnswers: { questionId: number; answer: number }[]) => {
      const res = await fetch(`/api/evaluations/${evaluationId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answers: submittedAnswers })
      });
      if (!res.ok) throw new Error('Failed to submit evaluation');
      return res.json();
    },
    onSuccess: (data) => {
      setResults(data);
      setShowResults(true);
      onComplete(data);
    }
  });

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = answers.length;

  const handleSelectAnswer = (optionIndex: number) => {
    if (showResults) return;
    
    setAnswers(prev => {
      const existing = prev.findIndex(a => a.questionId === currentQuestion.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { questionId: currentQuestion.id, answer: optionIndex };
        return updated;
      }
      return [...prev, { questionId: currentQuestion.id, answer: optionIndex }];
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = () => {
    if (answers.length < questions.length) {
      const unanswered = questions.length - answers.length;
      if (!confirm(`Tienes ${unanswered} preguntas sin responder. ¿Deseas enviar igual?`)) {
        return;
      }
    }
    submitMutation.mutate(answers);
  };

  if (showResults && results) {
    const aprobado = results.resultado === "aprobado";
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <div className={cn(
                "w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4",
                aprobado ? "bg-green-100" : "bg-red-100"
              )}>
                {aprobado ? (
                  <Check className="w-12 h-12 text-green-600" aria-hidden="true" />
                ) : (
                  <X className="w-12 h-12 text-red-600" aria-hidden="true" />
                )}
              </div>

              <h2 className="text-2xl font-bold text-[#0A192F] mb-2" data-testid="evaluation-result">
                {aprobado ? "Aprobado" : "No aprobado"}
              </h2>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-slate-600">
                Las respuestas correctas y sus explicaciones estarán disponibles cuando termine el período de revisión.
              </p>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-[#A51C30] hover:bg-[#821626]"
              data-testid="close-results-button"
            >
              Cerrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0A192F]">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="close-quiz-button"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Pregunta {currentIndex + 1} de {questions.length}</span>
              <span>{answeredCount} respondidas</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-4">
            <p className="text-lg font-medium text-[#0A192F]" data-testid="question-text">
              {currentQuestion?.question}
            </p>

            <div className="space-y-2">
              {currentQuestion?.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  className={cn(
                    "w-full p-4 text-left rounded-lg border-2 transition-all",
                    currentAnswer?.answer === idx
                      ? "border-[#A51C30] bg-[#A51C30]/5"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                  data-testid={`option-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      currentAnswer?.answer === idx
                        ? "bg-[#A51C30] text-white"
                        : "bg-slate-100 text-slate-600"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm text-[#0A192F]">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              data-testid="prev-question-button"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>

            <div className="flex gap-1">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all",
                    idx === currentIndex
                      ? "bg-[#A51C30]"
                      : answers.some(a => a.questionId === questions[idx].id)
                        ? "bg-green-500"
                        : "bg-slate-300"
                  )}
                  data-testid={`nav-dot-${idx}`}
                />
              ))}
            </div>

            {currentIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="bg-[#A51C30] hover:bg-[#821626]"
                data-testid="submit-evaluation-button"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Evaluación"
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                data-testid="next-question-button"
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
