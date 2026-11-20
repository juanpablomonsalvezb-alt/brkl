// Progresión de módulos: regla pura de avance tras E2.
//
// Con P21 v2 enmendada el avance ya no depende de un simple booleano (passed = true),
// sino del estado del proceso de E2 (normal, extra, agotada).
// Esta función es PURA: no lee la base de datos ni el reloj del sistema.
// La fuente de datos (qué estado real tiene E2) llegará con una migración futura.
//
// Regla enmendada (confirmada por el sostenedor): el extra se habilita desde la publicación
// del resultado del intento normal; las 72 h son el plazo máximo. No existe "espera previa".
// El módulo siguiente se abre cuando E2 está aprobada, o cuando el proceso de E2 concluyó
// (reprobada_continua o no_rendido). NO se abre mientras el proceso está en curso.

/**
 * Estados posibles del proceso de E2 según P21 v2 enmendada.
 *
 * - sin_rendir: el estudiante aún no ha iniciado el intento normal.
 * - extra_disponible: falló el intento normal; el extra está disponible (plazo de 72 h abierto).
 * - extra_en_curso: inició el intento extra dentro del plazo.
 * - aprobada: aprobó E2 (normal o extra).
 * - reprobada_continua: falló normal y extra; agotó todos los intentos.
 * - no_rendido: el proceso terminó sin aprobar y sin rendir el extra
 *   (vencieron las 72 h sin iniciarlo).
 */
export type EstadoE2 =
  | 'sin_rendir'
  | 'extra_disponible'
  | 'extra_en_curso'
  | 'aprobada'
  | 'reprobada_continua'
  | 'no_rendido';

/**
 * Decide si el módulo siguiente debe abrirse según el estado de E2 del módulo actual.
 *
 * Regla confirmada (P21 v2 enmendada): abre el módulo siguiente SOLO cuando el proceso de E2
 * terminó completamente:
 *   - aprobada → sí abre (aprobó, avanza)
 *   - reprobada_continua → sí abre (reprobó tras agotar intentos; con P21 v2 reprobar no bloquea)
 *   - no_rendido → sí abre (vencieron las 72 h sin rendir el extra; con P21 v2 no bloquea)
 *
 * NO abre mientras el proceso de E2 está en curso:
 *   - sin_rendir → no abre (no ha rendido el intento normal)
 *   - extra_disponible → no abre (extra disponible pero no iniciado)
 *   - extra_en_curso → no abre (extra en progreso)
 *
 * Con P21 v2 enmendada reprobar ya no bloquea; lo que se exige es haber concluido el proceso de E2.
 */
export function moduloSiguienteAbierto(estado: EstadoE2): boolean {
  switch (estado) {
    case 'aprobada':
    case 'reprobada_continua':
    case 'no_rendido':
      return true;
    case 'sin_rendir':
    case 'extra_disponible':
    case 'extra_en_curso':
      return false;
  }
}
