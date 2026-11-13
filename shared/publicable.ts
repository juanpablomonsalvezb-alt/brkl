// Condición de publicación de la pauta de UNA instancia (IMP-017, H1b-1). Función pura.
// Fuente: especificación maestra §3 «Revisión de pauta» y P19-E1 (APROBADO 2026-11-08): se publica si la
// instancia está cerrada y el reloj ha alcanzado SU review_at. No se espera a otros estudiantes de la misma
// versión; por eso la función no recibe otras instancias ni otros estudiantes.
// «Cerrada» es el conjunto único `ESTADOS_CERRADOS` (shared/p0e-estados.ts, IMP-006): cerrada_aprobada,
// cerrada_agotada y vencida (P15: el vencimiento es un cierre). `cerrada_por_excepcion` no entra (sus reglas
// siguen sin ratificar, P18-v).
// NO implementado: «la pauta de una instancia vencida solo si hubo al menos un intento» (maestra §12, propuesta
// NO aprobada). Si se aprobara, cambia solo esta función.
// Falla cerrada: una entrada no numérica o ausente nunca publica.
import { esEstadoCerrado } from "./p0e-estados";

export interface InstanciaPublicable {
  estado: string;
  /** Segundos UTC; `null` si la instancia aún no tiene review_at. */
  reviewAt: number | null;
}

export function publicable(instancia: InstanciaPublicable, ahora: number): boolean {
  if (!esEstadoCerrado(instancia.estado)) return false;
  if (typeof instancia.reviewAt !== "number" || !Number.isFinite(instancia.reviewAt) || !Number.isFinite(ahora)) return false;
  return ahora >= instancia.reviewAt;
}
