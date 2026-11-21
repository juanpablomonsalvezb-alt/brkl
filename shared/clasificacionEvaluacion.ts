// Clasificación funcional de evaluaciones por módulo (T39) y perfiles de evaluación.
// Funciones y esquemas puros (sin BD ni red):
//   - 0 = Evaluación de diagnóstico (antes de empezar el módulo)
//   - 1, 2, 3 = Evaluaciones de proceso
//   - 4 = Evaluación del módulo (cierre y habilitación del módulo siguiente)
//
// Compatibilidad histórica (P7): si un módulo aún tiene evaluaciones sin `evaluationFunction`
// declarado (todas en null), el cierre sigue usando `evaluationNumber === 2` sin reescribir historial.
import { z } from "zod";

export const EVALUATION_FUNCTIONS = ["diagnostico", "proceso", "modulo"] as const;
export type EvaluationFunction = (typeof EVALUATION_FUNCTIONS)[number];

export const EVALUATION_PROFILES = ["regular", "neurodivergente"] as const;
export type EvaluationProfile = (typeof EVALUATION_PROFILES)[number];

export const evaluationFunctionSchema = z.enum(EVALUATION_FUNCTIONS);

// Solo acepta { perfil }: rechaza datos clínicos o diagnósticos médicos sensibles (O10).
export const setEvaluationProfileSchema = z.object({
  perfil: z.enum(EVALUATION_PROFILES),
}).strict();

export const setEvaluationFunctionSchema = z.object({
  evaluationFunction: evaluationFunctionSchema.nullable(),
}).strict();

export function esNumeroEvaluacionValido(n: number): boolean {
  return Number.isInteger(n) && n >= 0 && n <= 4;
}

export function funcionPorNumero(n: number): EvaluationFunction | null {
  if (n === 0) return "diagnostico";
  if (n === 1 || n === 2 || n === 3) return "proceso";
  if (n === 4) return "modulo";
  return null;
}

export function etiquetaEvaluacion(
  funcion: EvaluationFunction | null | undefined,
  evaluationNumber: number,
): string {
  if (funcion === "diagnostico") return "Evaluación de diagnóstico";
  if (funcion === "proceso") {
    return evaluationNumber >= 1 && evaluationNumber <= 3
      ? `Evaluación de proceso ${evaluationNumber}`
      : "Evaluación de proceso";
  }
  if (funcion === "modulo") return "Evaluación del módulo";
  return `Evaluación ${evaluationNumber}`;
}

export function etiquetaResultadoPorFuncion(funcion: EvaluationFunction, aprobado: boolean): string {
  if (funcion === "modulo") return aprobado ? "Aprobada" : "No aprobada";
  if (funcion === "proceso") return aprobado ? "Logrado" : "No logrado";
  return "Completada";
}

export function obtenerEvaluacionesDeCierre<
  T extends { id: string; evaluationNumber: number; evaluationFunction?: EvaluationFunction | null },
>(evalsDelObjetivo: readonly T[]): T[] {
  const hayClasificadas = evalsDelObjetivo.some((e) => e.evaluationFunction != null);
  if (hayClasificadas) {
    return evalsDelObjetivo.filter((e) => e.evaluationFunction === "modulo");
  }
  return evalsDelObjetivo.filter((e) => e.evaluationNumber === 2);
}

export function esEvaluacionDeCierreEnModulo<
  T extends { id: string; evaluationNumber: number; evaluationFunction?: EvaluationFunction | null },
>(evalsDelObjetivo: readonly T[], evaluacion: Pick<T, "id">): boolean {
  return obtenerEvaluacionesDeCierre(evalsDelObjetivo).some((e) => e.id === evaluacion.id);
}

/**
 * Calcula la función efectiva de una evaluación dentro de su objetivo y señala si
 * opera bajo compatibilidad histórica P7 (`heredadoP7 = true`, cuando todas las
 * evaluaciones del objetivo tienen `evaluationFunction === null`).
 */
export function funcionEfectivaEvaluacion<
  T extends { id: string; evaluationNumber: number; evaluationFunction?: EvaluationFunction | null },
>(
  evalsDelObjetivo: readonly T[],
  evaluacion: T,
): { effectiveFunction: EvaluationFunction | null; heredadoP7: boolean } {
  if (evaluacion.evaluationFunction != null) {
    return { effectiveFunction: evaluacion.evaluationFunction, heredadoP7: false };
  }
  const hayClasificadas = evalsDelObjetivo.some((e) => e.evaluationFunction != null);
  if (hayClasificadas) {
    return { effectiveFunction: null, heredadoP7: false };
  }
  if (evaluacion.evaluationNumber === 2) {
    return { effectiveFunction: "modulo", heredadoP7: true };
  }
  if (evaluacion.evaluationNumber === 0) {
    return { effectiveFunction: "diagnostico", heredadoP7: true };
  }
  return { effectiveFunction: "proceso", heredadoP7: true };
}
