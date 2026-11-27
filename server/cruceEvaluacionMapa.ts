// Servicio M5/M6: lectura embargada de evaluación de cierre (E2 / P19-E1) y exposición de versión (P18).
// Garantía de no interferencia (NI1-NI5): antes de que alguna instancia del proceso sea publicable
// (`publicable(instancia, ahora)`), nunca consulta `score_pct` ni `evaluation_attempt_answers`.
import type { Client } from "@libsql/client";
import {
  mapearProcesoAEstadoE2,
  moduloSiguienteAbierto,
  publicable,
  type ResumenEvaluacionBase,
  type ResumenOaEvaluacionPublicable,
} from "../shared/cruceEvaluacionMapa";
import { oaIdDesdeCodigo } from "../shared/mapaConocimiento";

/**
 * P18: determina si una versión de evaluación ya está expuesta porque existe una liberación
 * explícita o porque al menos una instancia sobre esa versión ya es publicable en `ahora`.
 * Solo lee tablas de evaluación; no intenta escribir durante lecturas concurrentes sobre
 * versiones con instancias activas (trigger `evr_bloquea_instancia`).
 */
export async function esVersionEvaluacionExpuesta(
  c: Client,
  versionId: string,
  ahora: number,
): Promise<boolean> {
  const rel = await c.execute({
    sql: "SELECT 1 FROM evaluation_version_releases WHERE evaluation_version_id = ? LIMIT 1",
    args: [versionId],
  });
  if (rel.rows.length > 0) return true;

  const insts = await c.execute({
    sql: "SELECT status, review_at FROM evaluation_instances WHERE evaluation_version_id = ?",
    args: [versionId],
  });
  return insts.rows.some((r) =>
    publicable(
      {
        estado: String(r.status),
        reviewAt: r.review_at == null ? null : Number(r.review_at),
      },
      ahora,
    ),
  );
}

export async function cargarResumenEvaluacionParaMapa(
  c: Client,
  params: { estudianteId: string; ahora: number; evaluacionId?: string },
): Promise<{
  resumen: ResumenEvaluacionBase;
  resultadosPublicadosPorOa: ResumenOaEvaluacionPublicable[];
}> {
  const sinIniciar = (evaluacionId: string | null = params.evaluacionId ?? null) => ({
    resumen: {
      evaluacionId,
      estadoProceso: "sin_iniciar" as const,
      publicada: false as const,
      moduloSiguienteAbierto: false,
      mejorScorePct: null,
      umbral: null,
    },
    resultadosPublicadosPorOa: [] as ResumenOaEvaluacionPublicable[],
  });

  const filtroEval = params.evaluacionId ? "AND p.evaluation_id = ?" : "";
  const args: (string | number)[] = params.evaluacionId
    ? [params.estudianteId, params.evaluacionId]
    : [params.estudianteId];

  const procRes = await c.execute({
    sql: `SELECT p.id, p.evaluation_id, p.status, p.close_cause
          FROM evaluation_processes p
          LEFT JOIN module_evaluations me ON me.id = p.evaluation_id
          WHERE p.student_id = ? ${filtroEval}
          ORDER BY CASE WHEN me.evaluation_function = 'modulo' OR me.evaluation_number = 4 THEN 0 ELSE 1 END,
                   p.rowid DESC
          LIMIT 1`,
    args,
  });
  const proc = procRes.rows[0];
  if (!proc) return sinIniciar();

  const procesoId = String(proc.id);
  const evaluacionId = String(proc.evaluation_id);
  const procStatus = String(proc.status);
  const closeCause = proc.close_cause == null ? null : String(proc.close_cause);

  const instRes = await c.execute({
    sql: `SELECT id, status, review_at, passing_score
          FROM evaluation_instances
          WHERE process_id = ? AND student_id = ?`,
    args: [procesoId, params.estudianteId],
  });
  const instIds = instRes.rows.map((r) => String(r.id));

  let hayExtraIniciado = false;
  let hayNormalFallado = false;
  if (instIds.length > 0 && procStatus !== "aprobado" && procStatus !== "reprobado") {
    const ph = instIds.map(() => "?").join(",");
    const attRes = await c.execute({
      sql: `SELECT attempt_kind, status, passed
            FROM evaluation_attempts
            WHERE instance_id IN (${ph}) AND student_id = ?`,
      args: [...instIds, params.estudianteId],
    });
    for (const a of attRes.rows) {
      if (String(a.attempt_kind) === "extra") hayExtraIniciado = true;
      if (String(a.attempt_kind) === "normal" && String(a.status) === "enviado" && Number(a.passed ?? 0) === 0) {
        hayNormalFallado = true;
      }
    }
  }

  const estadoE2 = mapearProcesoAEstadoE2({
    status: procStatus,
    closeCause,
    hayExtraIniciado,
    hayNormalFallado,
  });
  const sigAbierto = moduloSiguienteAbierto(estadoE2);

  const instPublicables = instRes.rows.filter((r) =>
    publicable(
      {
        estado: String(r.status),
        reviewAt: r.review_at == null ? null : Number(r.review_at),
      },
      params.ahora,
    ),
  );

  const procesoFinalizado = procStatus === "aprobado" || procStatus === "reprobado";
  if (instPublicables.length === 0) {
    const estadoProceso: "en_curso" | "aprobado" | "reprobado" =
      procStatus === "aprobado" || procStatus === "reprobado" ? procStatus : "en_curso";
    return {
      resumen: {
        evaluacionId,
        estadoProceso,
        publicada: false,
        moduloSiguienteAbierto: sigAbierto,
        mejorScorePct: null,
        umbral: null,
      },
      resultadosPublicadosPorOa: [],
    };
  }

  const pubIds = instPublicables.map((r) => String(r.id));
  const phPub = pubIds.map(() => "?").join(",");
  const attemptsPub = await c.execute({
    sql: `SELECT id, score_pct
          FROM evaluation_attempts
          WHERE instance_id IN (${phPub}) AND student_id = ? AND status = 'enviado'`,
    args: [...pubIds, params.estudianteId],
  });

  const attemptIds = attemptsPub.rows.map((r) => String(r.id));
  let mejorScorePct: number | null = null;
  for (const a of attemptsPub.rows) {
    if (a.score_pct != null) {
      const s = Number(a.score_pct);
      mejorScorePct = mejorScorePct == null || s > mejorScorePct ? s : mejorScorePct;
    }
  }
  const umbralRaw = instPublicables.find((r) => r.passing_score != null)?.passing_score;
  const umbral = umbralRaw == null ? null : Number(umbralRaw);

  const porItem = new Map<string, ResumenOaEvaluacionPublicable>();
  if (attemptIds.length > 0) {
    const phAtt = attemptIds.map(() => "?").join(",");
    const ansRes = await c.execute({
      sql: `SELECT a.item_id, ki.code, a.is_correct
            FROM evaluation_attempt_answers a
            LEFT JOIN knowledge_items ki ON ki.id = a.item_id
            WHERE a.attempt_id IN (${phAtt}) AND a.student_id = ?`,
      args: [...attemptIds, params.estudianteId],
    });
    for (const row of ansRes.rows) {
      const itemId = String(row.item_id);
      const oaId = row.code ? oaIdDesdeCodigo(String(row.code)) : oaIdDesdeCodigo(itemId);
      const actual = porItem.get(itemId) ?? { itemId, oaId, correctas: 0, incorrectas: 0, total: 0 };
      if (Number(row.is_correct) === 1) actual.correctas += 1;
      else actual.incorrectas += 1;
      actual.total += 1;
      porItem.set(itemId, actual);
    }
  }

  const resultadosPublicadosPorOa = [...porItem.values()].sort((a, b) =>
    a.oaId < b.oaId ? -1 : a.oaId > b.oaId ? 1 : 0,
  );

  const estadoPublicado: "aprobado" | "reprobado" = procesoFinalizado
    ? (procStatus as "aprobado" | "reprobado")
    : instPublicables.some((r) => String(r.status) === "cerrada_aprobada")
      ? "aprobado"
      : "reprobado";

  return {
    resumen: {
      evaluacionId,
      estadoProceso: estadoPublicado,
      publicada: true,
      moduloSiguienteAbierto: sigAbierto || instPublicables.some((r) => String(r.status) === "cerrada_aprobada"),
      mejorScorePct,
      umbral,
    },
    resultadosPublicadosPorOa,
  };
}
