// Monitor de uso de Turso (Tarea 10): análisis puro de `turso plan show` y alertas al 50 % y 80 %.
// Sin red ni base de datos.

export const UMBRAL_AVISO_PCT = 50;
export const UMBRAL_CRITICO_PCT = 80;

export type NivelAlertaTurso = "ok" | "aviso" | "critico";

export interface RecursoTurso {
  recurso: string;
  usado: string;
  limite: string;
  porcentaje: number;
}

export interface AlertaTurso extends RecursoTurso {
  nivel: Exclude<NivelAlertaTurso, "ok">;
  umbral: number;
}

export interface EvaluacionUsoTurso {
  nivelGlobal: NivelAlertaTurso;
  alertas: AlertaTurso[];
  recursos: Array<RecursoTurso & { nivel: NivelAlertaTurso }>;
}

export function parsearTursoPlanShow(salida: string): RecursoTurso[] {
  const recursos: RecursoTurso[] = [];
  for (const linea of salida.split(/\r?\n/)) {
    const limpia = linea.trim();
    if (!limpia) continue;
    const partes = limpia.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
    if (partes.length !== 4) continue;
    const matchPct = /^(\d+(?:\.\d+)?)\s*%$/.exec(partes[3]);
    if (!matchPct) continue;
    const porcentaje = Number(matchPct[1]);
    if (!Number.isFinite(porcentaje)) continue;
    recursos.push({
      recurso: partes[0],
      usado: partes[1],
      limite: partes[2],
      porcentaje,
    });
  }
  return recursos;
}

export function evaluarUsoTurso(
  recursos: readonly RecursoTurso[],
  umbrales?: { aviso?: number; critico?: number },
): EvaluacionUsoTurso {
  const aviso = umbrales?.aviso ?? UMBRAL_AVISO_PCT;
  const critico = umbrales?.critico ?? UMBRAL_CRITICO_PCT;
  if (!Number.isFinite(aviso) || !Number.isFinite(critico) || aviso <= 0 || critico < aviso) {
    throw new RangeError(`Umbrales inválidos: aviso=${aviso}, critico=${critico}`);
  }

  const conNivel: Array<RecursoTurso & { nivel: NivelAlertaTurso }> = [];
  const alertas: AlertaTurso[] = [];
  let nivelGlobal: NivelAlertaTurso = "ok";

  for (const r of recursos) {
    const nivel: NivelAlertaTurso =
      r.porcentaje >= critico ? "critico" : r.porcentaje >= aviso ? "aviso" : "ok";
    conNivel.push({ ...r, nivel });
    if (nivel !== "ok") {
      alertas.push({
        ...r,
        nivel,
        umbral: nivel === "critico" ? critico : aviso,
      });
      if (nivel === "critico") nivelGlobal = "critico";
      else if (nivelGlobal === "ok") nivelGlobal = "aviso";
    }
  }

  return { nivelGlobal, alertas, recursos: conNivel };
}
