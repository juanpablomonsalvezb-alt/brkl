// Parámetros por perfil de estudiante: regular y neurodivergente declarado.
// Funciones puras: no leen estado externo, no guardan nada.
//
// Fuente de decisiones (DECISIONES_DIRECCION.md):
//   - «Reglas para estudiantes neurodivergentes declarados» (2026-11-19):
//     duración 120 min, umbral 50 %, sin cronómetro visible, avisos suaves.
//   - «Cuatro decisiones de cierre» (2026-11-19): Q2 etiquetas E2 vs E1/E3/E4.
//   - P21 v2 enmendada: duración 60 min regular, umbral 70 %, cronómetro visible,
//     avisos destacados a los 15 y 5 min.
//
// Reutiliza las constantes de shared/ventanas.ts (MIN_DURACION_EVALUACION_*,
// UMBRAL_APROBACION_*) para no duplicar números.

import {
  MIN_DURACION_EVALUACION_REGULAR,
  MIN_DURACION_EVALUACION_NEURODIVERGENTE,
  UMBRAL_APROBACION_REGULAR,
  UMBRAL_APROBACION_NEURODIVERGENTE,
} from "./ventanas";

/** Perfil de estudiante: regular o neurodivergente declarado. */
export type PerfilEstudiante = "regular" | "neurodivergente";

/** Aviso durante una evaluación. */
export interface Aviso {
  /** Minutos restantes cuando se muestra el aviso. */
  minutosRestantes: number;
  /** Estilo visual: destacado (regular) o suave (neurodivergente). */
  estilo: "destacado" | "suave";
}

/** Parámetros derivados del perfil de un estudiante. */
export interface ParametrosPerfil {
  /** Duración mínima de evaluación en minutos. */
  duracionMin: number;
  /** Umbral de aprobación en porcentaje (sin redondeo). */
  umbralAprobacion: number;
  /** ¿El cronómetro es visible para el estudiante? */
  cronometroVisible: boolean;
  /** Lista de avisos durante el intento, ordenados de mayor a menor minutosRestantes. */
  avisos: readonly Aviso[];
}

/**
 * Devuelve los parámetros de evaluación para un perfil dado.
 *
 * Los valores provienen de las constantes de `shared/ventanas.ts` para evitar
 * duplicación: `MIN_DURACION_EVALUACION_REGULAR` (60), `MIN_DURACION_EVALUACION_NEURODIVERGENTE` (120),
 * `UMBRAL_APROBACION_REGULAR` (70), `UMBRAL_APROBACION_NEURODIVERGENTE` (50).
 *
 * Decisiones citadas:
 * - Regular: 60 min, 70 %, cronómetro visible, avisos destacados a los 15 y 5 min
 *   (P21 v2 §4 «Duración de toda evaluación», «Avisos destacados»).
 * - Neurodivergente: 120 min, 50 %, sin cronómetro, avisos suaves a los 30 y 10 min
 *   (DECISIONES_DIRECCION «Reglas para estudiantes neurodivergentes declarados»,
 *    «Avisos y declaración del perfil neurodivergente»).
 */
export function parametrosPerfil(perfil: PerfilEstudiante): ParametrosPerfil {
  if (perfil === "regular") {
    return {
      duracionMin: MIN_DURACION_EVALUACION_REGULAR,
      umbralAprobacion: UMBRAL_APROBACION_REGULAR,
      cronometroVisible: true,
      avisos: [
        { minutosRestantes: 15, estilo: "destacado" as const },
        { minutosRestantes: 5, estilo: "destacado" as const },
      ],
    };
  }
  // perfil === "neurodivergente"
  return {
    duracionMin: MIN_DURACION_EVALUACION_NEURODIVERGENTE,
    umbralAprobacion: UMBRAL_APROBACION_NEURODIVERGENTE,
    cronometroVisible: false,
    avisos: [
      { minutosRestantes: 30, estilo: "suave" as const },
      { minutosRestantes: 10, estilo: "suave" as const },
    ],
  };
}

/**
 * Determina si un porcentaje aprueba según el umbral del perfil.
 *
 * Comparación EXACTA sin redondear: `porcentaje >= umbral`.
 * Ejemplos: 69.5 con umbral 70 → false; 70 → true; 49.99 con 50 → false.
 *
 * Decisión Q3 (Cuatro decisiones de cierre): «Sin redondeo hacia arriba».
 *
 * Lanza `RangeError` si `porcentaje` no es finito o está fuera de [0, 100].
 */
export function aprueba(porcentaje: number, perfil: PerfilEstudiante): boolean {
  if (!Number.isFinite(porcentaje)) {
    throw new RangeError(`porcentaje debe ser un número finito, recibido: ${porcentaje}`);
  }
  if (porcentaje < 0 || porcentaje > 100) {
    throw new RangeError(`porcentaje debe estar en [0, 100], recibido: ${porcentaje}`);
  }
  const { umbralAprobacion } = parametrosPerfil(perfil);
  return porcentaje >= umbralAprobacion;
}

/**
 * Etiqueta de resultado para mostrar al estudiante.
 *
 * - E2: «Aprobada» / «No aprobada» (decisión Q2: solo E2 usa esta etiqueta).
 * - E1, E3, E4: «Logrado» / «No logrado» (decisión Q2).
 *
 * Decisión Q2 (Cuatro decisiones de cierre): «Prácticas E1, E3 y E4 muestran
 * Logrado / No logrado; solo E2 Aprobada / No aprobada».
 */
export function etiquetaResultado(evaluacion: "E1" | "E2" | "E3" | "E4", aprobado: boolean): string {
  if (evaluacion === "E2") {
    return aprobado ? "Aprobada" : "No aprobada";
  }
  return aprobado ? "Logrado" : "No logrado";
}

/**
 * Fracción mínima de preguntas del intento extra que deben provenir de los
 * subtemas fallados en el intento normal.
 *
 * Valor fijo: 0.5 (≥ 50 %). NO depende del perfil.
 *
 * Decisión Q-D (P21 v2 CONFIRMADA): «al menos el 50 % de las preguntas
 * provienen de los subtemas fallados».
 */
export const FRACCION_ENFASIS_SUBTEMAS = 0.5;

/**
 * Calcula el número mínimo de preguntas que deben provenir de los subtemas
 * fallados, dado el total de preguntas del intento extra.
 *
 * Fórmula: `Math.ceil(totalPreguntas * FRACCION_ENFASIS_SUBTEMAS)`.
 * El resultado es siempre un entero positivo.
 *
 * Lanza `RangeError` si `totalPreguntas` no es un entero positivo.
 */
export function minimoPreguntasDeSubtemasFallados(totalPreguntas: number): number {
  if (!Number.isInteger(totalPreguntas) || totalPreguntas < 1) {
    throw new RangeError(
      `totalPreguntas debe ser un entero positivo, recibido: ${totalPreguntas}`
    );
  }
  return Math.ceil(totalPreguntas * FRACCION_ENFASIS_SUBTEMAS);
}
