// Siembra una evaluación E2 del piloto (Mat 5.º, Unidad 3: 45 preguntas, 15 en la prueba normal y 30 para extra)
// unificada sobre el mismo dominio publicado (`d-piloto-mat5-u3`) y los mismos 5 `knowledge_items` de práctica (M-R03).
import type { InArgs, ResultSet } from "@libsql/client";
import {
  sembrarEvaluacionPilotoUnificadaX,
  type OpcionesSiembraEvaluacionUnificada,
} from "../../server/sembrarPilotoPractica";

type X = (sql: string, args?: InArgs) => Promise<ResultSet>;
export type OpcionesSiembra = OpcionesSiembraEvaluacionUnificada;

/** Devuelve la clave (pregunta -> opción correcta), solo útil para tests y demo local. */
export async function sembrarEvaluacionPiloto(x: X, o: OpcionesSiembra): Promise<Record<string, string>> {
  return sembrarEvaluacionPilotoUnificadaX(x, o);
}
