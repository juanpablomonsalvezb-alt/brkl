// Reglas puras del cruce entre evaluación del módulo `4` (M5/M6) y el mapa «Mis conocimientos».
// Aplica el principio de dos canales (03 §8.1), la regla C8 de contenidos a reforzar (03 §8.5 rec. A)
// y la progresión real P21 v2 (shared/progresion.ts) respetando el embargo P19-E1 (shared/publicable.ts).
import type { NodoMapa } from "./mapaConocimiento";
import { moduloSiguienteAbierto, type EstadoE2 } from "./progresion";
import { publicable } from "./publicable";

export { moduloSiguienteAbierto, publicable };

export interface ResumenOaEvaluacionPublicable {
  itemId?: string;
  oaId: string;
  correctas: number;
  incorrectas: number;
  total: number;
}

export interface RefuerzoEvaluacionMapa {
  itemId: string;
  code: string;
  oaId: string;
  nombre: string;
  incorrectas: number;
  motivo: string;
}

export type ResumenEvaluacionBase =
  | {
      evaluacionId: string | null;
      estadoProceso: "sin_iniciar" | "en_curso" | "aprobado" | "reprobado";
      publicada: false;
      moduloSiguienteAbierto: boolean;
      mejorScorePct: null;
      umbral: null;
    }
  | {
      evaluacionId: string;
      estadoProceso: "aprobado" | "reprobado";
      publicada: true;
      moduloSiguienteAbierto: boolean;
      mejorScorePct: number | null;
      umbral: number | null;
    };

export type ResumenEvaluacionMapa =
  | (Extract<ResumenEvaluacionBase, { publicada: false }> & { contenidosAReforzar: [] })
  | (Extract<ResumenEvaluacionBase, { publicada: true }> & { contenidosAReforzar: RefuerzoEvaluacionMapa[] });

/**
 * Mapea una fila de `evaluation_processes` (con estado de intentos si sigue abierto) a `EstadoE2`
 * para decidir la apertura del módulo siguiente con `moduloSiguienteAbierto`.
 */
export function mapearProcesoAEstadoE2(
  proceso: {
    status: string;
    closeCause: string | null;
    hayExtraIniciado?: boolean;
    hayNormalFallado?: boolean;
  } | null,
): EstadoE2 {
  if (!proceso) return "sin_rendir";
  if (proceso.status === "aprobado") return "aprobada";
  if (proceso.status === "reprobado") {
    return proceso.closeCause === "reprobada_continua" || proceso.closeCause === "vencimiento"
      ? "no_rendido"
      : "reprobada_continua";
  }
  if (proceso.hayExtraIniciado || proceso.status === "recuperacion_abierta") return "extra_en_curso";
  if (proceso.hayNormalFallado || proceso.status === "recuperacion_pendiente") return "extra_disponible";
  return "sin_rendir";
}

/**
 * Regla C8 (03 §8.5 alternativa recomendada A):
 * - Los OA no `dominado` con al menos 1 error ya liberado pasan a `contenidosAReforzar` en orden de código.
 * - Los OA ya `dominado` con errores liberados en E2 se marcan `por_comprobar` sin degradarse (03 §6).
 * - Mientras `resultadosPublicadosPorOa` está vacío (embargo activo), no devuelve nada.
 */
export function calcularRefuerzoDesdeEvaluacionPublicada(params: {
  nodos: readonly Pick<NodoMapa, "itemId" | "code" | "oaId" | "nombre" | "estado">[];
  resultadosPublicadosPorOa: readonly ResumenOaEvaluacionPublicable[];
}): { refuerzos: RefuerzoEvaluacionMapa[]; dominadosPorComprobarOaIds: string[] } {
  if (params.resultadosPublicadosPorOa.length === 0) {
    return { refuerzos: [], dominadosPorComprobarOaIds: [] };
  }

  const incorrectasPorItemId = new Map<string, number>();
  const incorrectasPorOa = new Map<string, number>();
  for (const r of params.resultadosPublicadosPorOa) {
    if (r.incorrectas > 0) {
      if (r.itemId) {
        incorrectasPorItemId.set(r.itemId, (incorrectasPorItemId.get(r.itemId) ?? 0) + r.incorrectas);
      }
      incorrectasPorOa.set(r.oaId, (incorrectasPorOa.get(r.oaId) ?? 0) + r.incorrectas);
    }
  }

  const nodosItemIds = new Set(params.nodos.map((n) => n.itemId));
  const usarMatchPorItemId = params.resultadosPublicadosPorOa.some(
    (r) => Boolean(r.itemId && nodosItemIds.has(r.itemId)),
  );

  const nodosOrdenados = [...params.nodos].sort((a, b) =>
    a.code < b.code ? -1 : a.code > b.code ? 1 : 0,
  );
  const refuerzos: RefuerzoEvaluacionMapa[] = [];
  const dominadosPorComprobarOaIds: string[] = [];

  for (const nodo of nodosOrdenados) {
    const incorrectas = usarMatchPorItemId
      ? (incorrectasPorItemId.get(nodo.itemId) ?? 0)
      : (incorrectasPorOa.get(nodo.oaId) ?? 0);
    if (incorrectas <= 0) continue;

    if (nodo.estado === "dominado") {
      dominadosPorComprobarOaIds.push(nodo.oaId);
    } else {
      refuerzos.push({
        itemId: nodo.itemId,
        code: nodo.code,
        oaId: nodo.oaId,
        nombre: nodo.nombre,
        incorrectas,
        motivo: `Tuviste ${incorrectas} respuesta${incorrectas === 1 ? "" : "s"} por reforzar en la evaluación del módulo.`,
      });
    }
  }

  return { refuerzos, dominadosPorComprobarOaIds };
}
