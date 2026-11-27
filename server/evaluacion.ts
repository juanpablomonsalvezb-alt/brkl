// Servicio del servidor de evaluación E2 / P21 v2.
// Patrón de server/practica.ts: funciones que reciben el cliente de base de datos y datos, sin estado global.
// Sin rutas HTTP/tRPC ni interfaz. Solo lógica de negocio sobre las tablas de migrations/vortice/0005_evaluacion.sql.
//
// Reglas reusadas (NO reescritas):
//   - shared/p0e.ts: máquina de estados pura (iniciarIntento, enviarIntento, vencer, violaciones)
//   - shared/perfiles.ts: parametrosPerfil(), aprueba(), FRACCION_ENFASIS_SUBTEMAS, minimoPreguntasDeSubtemasFallados()
//   - shared/ventanas.ts: HORAS_PLAZO_EXTRA (72h), ventanaExtra(), estadoExtra(), MIN_DURACION_EVALUACION_*, UMBRAL_APROBACION_*
//   - shared/armador.ts: armarExtra(), verificarExtra(), capacidadBanco()
//   - shared/progresion.ts: moduloSiguienteAbierto(), EstadoE2
//   - server/reloj.ts: relojMotor()
//
// Decisiones P21 v2 implementadas:
//   - 1 intento normal + 1 extra (sin más intentos)
//   - Extra desde publicación del resultado normal, plazo 72 h
//   - ≥ 35 % preguntas de subtemas fallados en el extra
//   - Sin repetir preguntas del normal en el extra
//   - Umbral 70 % regular, 50 % neurodivergente (sin redondeo)
//   - Duración 60 min regular, 120 min neurodivergente
//   - Sin cronómetro visible para neurodivergente
//   - E2 sin nota 1–7, solo porcentaje
//   - Mejor porcentaje entre intentos
//   - Si extra no rendido en 72 h → reprobada + módulo siguiente

import type { Client } from "@libsql/client";
import { randomUUID } from "node:crypto";
import {
  INTENTOS_ORDINARIOS, type Evaluacion, type InstanciaP0E, type Intento,
  nuevaInstancia as nuevaInstanciaP0E,
  iniciarIntento as iniciarIntentoP0E,
  enviarIntento as enviarIntentoP0E,
  vencer as vencerP0E,
  violaciones as violacionesP0E,
  esFinal,
} from "../shared/p0e";
import {
  parametrosPerfil, aprueba, type PerfilEstudiante,
} from "../shared/perfiles";
import {
  HORAS_PLAZO_EXTRA, ventanaExtra, estadoExtra,
  MIN_DURACION_EVALUACION_REGULAR, MIN_DURACION_EVALUACION_NEURODIVERGENTE,
  UMBRAL_APROBACION_REGULAR, UMBRAL_APROBACION_NEURODIVERGENTE,
} from "../shared/ventanas";
import { armarExtra, type Pregunta, type Banco } from "../shared/armador";
import { moduloSiguienteAbierto, type EstadoE2 } from "../shared/progresion";
import { esVersionEvaluacionExpuesta } from "./cruceEvaluacionMapa";
import { relojMotor } from "./reloj";

const SEG_POR_HORA = 3600;
const SEG_POR_MINUTO = 60;

// ——— Errores ———

export type CodigoEvaluacion =
  | "perfil_invalido"
  | "proceso_no_encontrado"
  | "instancia_no_encontrada"
  | "intento_no_encontrado"
  | "intento_no_activo"
  | "extra_no_disponible"
  | "extra_plazo_vencido"
  | "extra_ya_existe"
  | "normal_no_enviado"
  | "pregunta_no_pertenece_version"
  | "intento_enviado"
  | "proceso_cerrado"
  | "version_no_encontrada"
  | "capacidad_insuficiente"
  | "entrega_automatica"
  | "cierre_no_permitido"
  | "respuesta_existente"
  | "reapertura_ya_existe"
  | "motivo_invalido";

export class ErrorEvaluacion extends Error {
  constructor(readonly codigo: CodigoEvaluacion, mensaje: string) {
    super(`${codigo}: ${mensaje}`);
  }
}

// ——— Tipos de resultado ———

export interface ProcesoCreado {
  procesoId: string;
  instanciaId: string;
  perfil: PerfilEstudiante;
  duracionMin: number;
  umbral: number;
}

export interface InstanciaCreada {
  instanciaId: string;
  perfil: PerfilEstudiante;
  duracionMin: number;
  umbral: number;
}

export interface IntentoIniciado {
  intentoId: string;
  intentoKind: "normal" | "extra";
  preguntas: readonly string[];
  startedAt: number;
  expiresAt: number;
}

export interface RespuestaRegistrada {
  respuestaId: string;
  correcta: boolean;
  secuencia: number;
}

export interface IntentoEnviado {
  intentoId: string;
  scorePct: number;
  totalCorrect: number;
  totalQuestions: number;
  aprobado: boolean;
  efectoProceso: string | null;
  subtemasFallados: string[];
}

export interface ProcesoCerrado {
  procesoId: string;
  mejorScorePct: number;
  estado: "aprobado" | "reprobado";
  closeCause: string;
  moduloSiguiente: boolean;
}

// ——— Helpers ———

import type { InValue } from "@libsql/client";

type X = (sql: string, args?: InValue[]) => Promise<{ rows: unknown[]; rowsAffected?: number }>;

function row<T extends Record<string, unknown>>(r: { rows: unknown[] } | undefined): T | undefined {
  if (!r || !r.rows || r.rows.length === 0) return undefined;
  return r.rows[0] as T;
}

function rows<T extends Record<string, unknown>>(r: { rows: unknown[] }): T[] {
  return r.rows as T[];
}

/** Banco para armar el extra: preguntas aprobadas del banco de evaluación cuyos subtemas (item_id) están en la versión. */
export async function cargarBancoExtra(c: Client, versionId: string): Promise<Banco> {
  const x: X = (q, a = []) => c.execute({ sql: q, args: a as InValue[] });
  return cargarBancoExtraX(x, versionId);
}
async function cargarBancoExtraX(x: X, versionId: string): Promise<Banco> {
  const r = rows<{ id: string; item_id: string }>(await x(
    "SELECT id, item_id FROM question_versions WHERE bank = 'evaluacion' AND status = 'aprobada' AND item_id IN (SELECT item_id FROM evaluation_version_questions WHERE evaluation_version_id = ?) ORDER BY id",
    [versionId],
  ));
  return r.map((q) => ({ id: String(q.id), subtemaId: String(q.item_id) }));
}

export interface PreguntaDelIntento { id: string; familyId: string; itemId: string }
/** Preguntas de un intento: las de la versión (normal) o las armadas para el extra (permutation_json). */
export async function preguntasDelIntento(c: Client, intentoId: string): Promise<PreguntaDelIntento[]> {
  return preguntasDelIntentoX((q, a = []) => c.execute({ sql: q, args: a as InValue[] }), intentoId);
}
async function preguntasDelIntentoX(x: X, intentoId: string): Promise<PreguntaDelIntento[]> {
  const a = row<{ attempt_kind: string; evaluation_version_id: string; permutation_json: string | null }>(await x(
    "SELECT attempt_kind, evaluation_version_id, permutation_json FROM evaluation_attempts WHERE id = ?", [intentoId]));
  if (!a) return [];
  if (a.attempt_kind === "extra") {
    const ids: string[] = a.permutation_json ? (JSON.parse(String(a.permutation_json)).preguntas ?? []) : [];
    if (!ids.length) return [];
    const r = rows<{ id: string; family_id: string; item_id: string }>(await x(
      `SELECT id, family_id, item_id FROM question_versions WHERE id IN (${ids.map(() => "?").join(",")})`, ids));
    const por = new Map(r.map((q) => [String(q.id), q]));
    return ids.flatMap((id) => { const q = por.get(id); return q ? [{ id, familyId: String(q.family_id), itemId: String(q.item_id) }] : []; });
  }
  const r = rows<{ question_version_id: string; family_id: string; item_id: string }>(await x(
    "SELECT question_version_id, family_id, item_id FROM evaluation_version_questions WHERE evaluation_version_id = ? ORDER BY position",
    [a.evaluation_version_id]));
  return r.map((q) => ({ id: String(q.question_version_id), familyId: String(q.family_id), itemId: String(q.item_id) }));
}

// Carga el estado P0E de una instancia desde la base.
async function cargarInstanciaP0E(x: X, instanciaId: string): Promise<InstanciaP0E> {
  const inst = row<{
    id: string; phase: string; max_attempts: number; window_end_at: number; extension_ends_at: number | null;
    review_at: number | null; status: string; close_cause: string | null;
    student_profile: string | null; duration_minutes: number | null; passing_score: number | null;
    extra_deadline_at: number | null; evaluation_version_id: string;
  }>(await x(
    "SELECT id, phase, max_attempts, window_end_at, extension_ends_at, review_at, status, close_cause, student_profile, duration_minutes, passing_score, extra_deadline_at, evaluation_version_id FROM evaluation_instances WHERE id = ?",
    [instanciaId],
  ));
  if (!inst) throw new ErrorEvaluacion("instancia_no_encontrada", `instancia ${instanciaId} no existe`);

  const intentosRows = rows<{
    id: string; status: string; submission_id: string | null; score_pct: number | null;
    passed: number | null; attempt_kind: string;
  }>(await x(
    "SELECT id, status, submission_id, score_pct, passed, attempt_kind FROM evaluation_attempts WHERE instance_id = ?",
    [instanciaId],
  ));

  const intentos: Intento[] = intentosRows.map((r) => ({
    id: String(r.id),
    estado: r.status as Intento["estado"],
    envioId: r.submission_id ?? null,
    aprobado: r.passed === 1 ? true : r.passed === 0 ? false : null,
    fase: (r.attempt_kind === "extra" ? "extra" : "normal") as Intento["fase"],
  }));

  // Mapear estado de base a estado P0E
  const estadoMap: Record<string, InstanciaP0E["estado"]> = {
    disponible: "disponible",
    en_curso: "en_curso",
    cerrada_aprobada: "cerrada_aprobada",
    cerrada_agotada: "cerrada_agotada",
    vencida: "vencida",
  };

  // Determinar extraDisponible y extraAgotado desde los intentos
  const normalEnviado = intentos.some((i) => i.fase === "normal" && i.estado === "enviado");
  const extraEnviado = intentos.some((i) => i.fase === "extra" && i.estado === "enviado");
  const normalAprobado = intentos.some((i) => i.fase === "normal" && i.aprobado === true);
  const extraAprobado = intentos.some((i) => i.fase === "extra" && i.aprobado === true);

  let extraDisponible = false;
  let extraAgotado = false;

  if (normalEnviado && !normalAprobado && !extraEnviado) {
    extraDisponible = true;
  }
  if (extraEnviado && !extraAprobado) {
    extraAgotado = true;
  }

  const causaCierre = inst.close_cause as InstanciaP0E["causaCierre"];
  const finExtension = inst.extension_ends_at ?? inst.window_end_at;

  const esOrdinaria = inst.phase === "ordinaria";
  return {
    estado: estadoMap[inst.status] ?? "disponible",
    maxIntentos: Number(inst.max_attempts),
    finExtension,
    intentos,
    causaCierre,
    esE2: esOrdinaria,
    extraDisponible: esOrdinaria && extraDisponible,
    extraAgotado: esOrdinaria && extraAgotado,
  };
}

// Guarda el estado P0E en la base.
async function guardarInstanciaP0E(x: X, instanciaId: string, p0e: InstanciaP0E): Promise<void> {
  const estadoMap: Record<InstanciaP0E["estado"], string> = {
    disponible: "disponible",
    en_curso: "en_curso",
    cerrada_aprobada: "cerrada_aprobada",
    cerrada_agotada: "cerrada_agotada",
    vencida: "vencida",
  };

  await x(
    "UPDATE evaluation_instances SET status = ?, close_cause = ? WHERE id = ?",
    [estadoMap[p0e.estado], p0e.causaCierre, instanciaId],
  );
}

// ——— 1. abrirProceso / abrirInstancia ———

/**
 * Abre un proceso de evaluación E2 para un estudiante y crea la instancia con el perfil correspondiente.
 *
 * Usa shared/perfiles.ts para obtener los parámetros del perfil (duración, umbral).
 * Usa shared/ventanas.ts para HORAS_PLAZO_EXTRA (72 h).
 */
export async function abrirProceso(
  c: Client,
  params: {
    estudianteId: string;
    evaluacionId: string; // module_evaluations.id
    versionId: string; // evaluation_versions.id
    perfil: PerfilEstudiante;
    evaluacionTipo?: Evaluacion;
    reviewAt?: number | null;
  },
): Promise<ProcesoCreado> {
  const x: X = (s, a = []) => c.execute({ sql: s, args: a as InValue[] });
  const ahora = await relojMotor(c).ahora();

  // Validar perfil.
  const perfilParams = parametrosPerfil(params.perfil);
  if (params.perfil !== "regular" && params.perfil !== "neurodivergente") {
    throw new ErrorEvaluacion("perfil_invalido", `perfil no válido: ${params.perfil}`);
  }

  const evalTipo: Evaluacion = params.evaluacionTipo ?? "E2";
  const maxIntentos = INTENTOS_ORDINARIOS[evalTipo];

  // Verificar que la versión existe y está validada, y que no esté ya expuesta (P18).
  const version = row<{ status: string }>(await x(
    "SELECT status FROM evaluation_versions WHERE id = ?",
    [params.versionId],
  ));
  if (!version) throw new ErrorEvaluacion("version_no_encontrada", `versión ${params.versionId} no existe`);
  if (version.status !== "validada" && version.status !== "asignada") {
    throw new ErrorEvaluacion("version_no_encontrada", `versión ${params.versionId} no está validada (status: ${version.status})`);
  }
  if (await esVersionEvaluacionExpuesta(c, params.versionId, ahora)) {
    throw new ErrorEvaluacion("version_no_encontrada", `versión ${params.versionId} ya fue expuesta`);
  }

  // Verificar que no existe proceso para este estudiante y evaluación.
  const existente = row<{ id: string }>(await x(
    "SELECT id FROM evaluation_processes WHERE student_id = ? AND evaluation_id = ?",
    [params.estudianteId, params.evaluacionId],
  ));
  if (existente) {
    throw new ErrorEvaluacion("proceso_no_encontrado", `proceso ya existe para estudiante ${params.estudianteId} y evaluación ${params.evaluacionId}`);
  }

  const procesoId = randomUUID();
  const instanciaId = randomUUID();

  // Plazo extra: 72 h desde ahora (se actualizará cuando se publique el resultado del normal).
  const extraDeadline = ahora + HORAS_PLAZO_EXTRA * SEG_POR_HORA;

  await c.batch([
    {
      sql: "INSERT INTO evaluation_processes (id, student_id, evaluation_id, status) VALUES (?, ?, ?, 'abierto')",
      args: [procesoId, params.estudianteId, params.evaluacionId],
    },
    {
      sql: "INSERT INTO evaluation_instances (id, process_id, student_id, evaluation_version_id, phase, window_end_at, review_at, max_attempts, status, student_profile, duration_minutes, passing_score, extra_deadline_at) VALUES (?, ?, ?, ?, 'ordinaria', ?, ?, ?, 'disponible', ?, ?, ?, ?)",
      args: [
        instanciaId,
        procesoId,
        params.estudianteId,
        params.versionId,
        ahora + HORAS_PLAZO_EXTRA * SEG_POR_HORA * 2, // window_end_at lejano (se puede ajustar)
        params.reviewAt ?? null,
        maxIntentos,
        params.perfil,
        perfilParams.duracionMin,
        perfilParams.umbralAprobacion,
        extraDeadline,
      ],
    },
  ], "write");

  return {
    procesoId,
    instanciaId,
    perfil: params.perfil,
    duracionMin: perfilParams.duracionMin,
    umbral: perfilParams.umbralAprobacion,
  };
}

/**
 * Abre una instancia dentro de un proceso existente (por ejemplo, recuperación).
 */
export async function abrirInstancia(
  c: Client,
  params: {
    procesoId: string;
    estudianteId: string;
    versionId: string;
    perfil: PerfilEstudiante;
    evaluacionTipo?: Evaluacion;
  },
): Promise<InstanciaCreada> {
  const x: X = (s, a = []) => c.execute({ sql: s, args: a as InValue[] });
  const ahora = await relojMotor(c).ahora();

  const perfilParams = parametrosPerfil(params.perfil);
  const evalTipo: Evaluacion = params.evaluacionTipo ?? "E2";
  const maxIntentos = INTENTOS_ORDINARIOS[evalTipo];

  // Verificar proceso.
  const proceso = row<{ status: string }>(await x(
    "SELECT status FROM evaluation_processes WHERE id = ? AND student_id = ?",
    [params.procesoId, params.estudianteId],
  ));
  if (!proceso) throw new ErrorEvaluacion("proceso_no_encontrado", `proceso ${params.procesoId} no existe`);
  if (proceso.status === "aprobado" || proceso.status === "reprobado") {
    throw new ErrorEvaluacion("proceso_cerrado", `proceso ${params.procesoId} ya está cerrado`);
  }

  const instanciaId = randomUUID();
  const extraDeadline = ahora + HORAS_PLAZO_EXTRA * SEG_POR_HORA;

  await x(
    "INSERT INTO evaluation_instances (id, process_id, student_id, evaluation_version_id, phase, window_end_at, max_attempts, status, student_profile, duration_minutes, passing_score, extra_deadline_at) VALUES (?, ?, ?, ?, 'ordinaria', ?, ?, 'disponible', ?, ?, ?, ?)",
    [
      instanciaId,
      params.procesoId,
      params.estudianteId,
      params.versionId,
      ahora + HORAS_PLAZO_EXTRA * SEG_POR_HORA * 2,
      maxIntentos,
      params.perfil,
      perfilParams.duracionMin,
      perfilParams.umbralAprobacion,
      extraDeadline,
    ],
  );

  return {
    instanciaId,
    perfil: params.perfil,
    duracionMin: perfilParams.duracionMin,
    umbral: perfilParams.umbralAprobacion,
  };
}

// ——— 2. iniciarIntento ———

/**
 * Inicia un intento ('normal' o 'extra') para una instancia.
 *
 * Reglas:
 * - 'normal': usa shared/p0e.ts iniciarIntento con fase 'normal'.
 * - 'extra': solo si el normal fue enviado y no aprobado, dentro del plazo de 72 h.
 *   Usa shared/ventanas.ts estadoExtra() para verificar el plazo.
 *   Usa shared/armador.ts armarExtra() para armar las preguntas.
 *   Rechaza si ya existe un intento de ese tipo.
 */
export async function iniciarIntento(
  c: Client,
  params: {
    instanciaId: string;
    estudianteId: string;
    tipo: "normal" | "extra";
    banco?: Banco; // Solo para 'extra': banco de preguntas para armar el extra
    semilla?: string; // Solo para 'extra': semilla para el armador determinista
  },
): Promise<IntentoIniciado> {
  const x: X = (s, a = []) => c.execute({ sql: s, args: a as InValue[] });
  const ahora = await relojMotor(c).ahora();

  // Cargar instancia P0E.
  const p0e = await cargarInstanciaP0E(x, params.instanciaId);

  // Verificar que la instancia pertenece al estudiante.
  const inst = row<{ student_id: string; evaluation_version_id: string; extra_deadline_at: number | null; review_at: number | null }>(await x(
    "SELECT student_id, evaluation_version_id, extra_deadline_at, review_at FROM evaluation_instances WHERE id = ?",
    [params.instanciaId],
  ));
  if (!inst) throw new ErrorEvaluacion("instancia_no_encontrada", `instancia ${params.instanciaId} no existe`);
  if (String(inst.student_id) !== params.estudianteId) {
    throw new ErrorEvaluacion("instancia_no_encontrada", `instancia no pertenece al estudiante ${params.estudianteId}`);
  }

  // Para 'extra': verificar que el normal fue enviado.
  if (params.tipo === "extra") {
    const normalEnviado = p0e.intentos.some((i) => i.fase === "normal" && i.estado === "enviado");
    if (!normalEnviado) {
      throw new ErrorEvaluacion("normal_no_enviado", "no se puede iniciar el extra sin haber enviado el intento normal");
    }

    // Verificar que no existe ya un intento extra.
    const extraExistente = p0e.intentos.some((i) => i.fase === "extra");
    if (extraExistente) {
      throw new ErrorEvaluacion("extra_ya_existe", "ya existe un intento extra para esta instancia");
    }

    // Verificar plazo de 72 h usando shared/ventanas.ts.
    // Necesitamos el publicadoAt (cuando se envió el normal).
    const normalRow = row<{ submitted_at: number }>(await x(
      "SELECT submitted_at FROM evaluation_attempts WHERE instance_id = ? AND attempt_kind = 'normal'",
      [params.instanciaId],
    ));
    if (!normalRow || !normalRow.submitted_at) {
      throw new ErrorEvaluacion("normal_no_enviado", "el intento normal no tiene fecha de envío");
    }

    const publicadoAt = Number(normalRow.submitted_at);
    const extraState = estadoExtra(ahora, publicadoAt);
    if (extraState === "no_rendido") {
      throw new ErrorEvaluacion("extra_plazo_vencido", "el plazo de 72 h para el intento extra ha vencido");
    }

    // Armar las preguntas del extra con el banco dado o el cargado desde la base.
    {
      const banco = params.banco ?? await cargarBancoExtraX(x, inst.evaluation_version_id);
      // Obtener preguntas del normal.
      const normalIntentoId = p0e.intentos.find((i) => i.fase === "normal" && i.estado === "enviado")?.id;
      if (!normalIntentoId) {
        throw new ErrorEvaluacion("normal_no_enviado", "no se encontró el intento normal enviado");
      }

      const normalPreguntas = rows<{ question_version_id: string }>(await x(
        "SELECT question_version_id FROM evaluation_attempt_answers WHERE attempt_id = ?",
        [normalIntentoId],
      ));
      // El normal son todas las preguntas de la versión (también las no respondidas) más lo respondido.
      const delNormal = await preguntasDelIntentoX(x, normalIntentoId);
      const normalIds = [...new Set([...delNormal.map((q) => q.id), ...normalPreguntas.map((r) => String(r.question_version_id))])];

      // Obtener subtemas fallados del normal.
      const respuestas = rows<{
        question_version_id: string; is_correct: number; family_id: string; item_id: string; bank: string;
      }>(await x(
        `SELECT qva.question_version_id, qva.is_correct, qva.family_id, qva.item_id, qva.bank
         FROM evaluation_attempt_answers qva
         WHERE qva.attempt_id = ? AND qva.is_correct = 0`,
        [normalIntentoId],
      ));

      // Los subtemas fallados se derivan de las preguntas incorrectas.
      // Subtema = item_id; incluye los subtemas con preguntas sin responder.
      const respondidas = new Set(normalPreguntas.map((r) => String(r.question_version_id)));
      const subtemasFallados = [...new Set([...respuestas.map((r) => String(r.item_id)), ...delNormal.filter((q) => !respondidas.has(q.id)).map((q) => q.itemId)])];

      if (subtemasFallados.length === 0) {
        // Si no hay subtemas fallados (aprobó el normal), no debería llegar aquí,
        // pero por seguridad: el extra no se inicia si aprobó.
        throw new ErrorEvaluacion("extra_no_disponible", "no se requiere intento extra (aprobó el normal)");
      }

      // Armar el extra con shared/armador.ts.
      const semilla = params.semilla ?? `${params.instanciaId}-extra-${ahora}`;
      const N = normalIds.length;
      let extraPreguntas: readonly string[];
      try {
        extraPreguntas = armarExtra({ banco, normal: normalIds as readonly string[], fallados: subtemasFallados, N, semilla });
      } catch (e) {
        if ((e as { code?: string }).code === "capacidad_insuficiente") throw new ErrorEvaluacion("capacidad_insuficiente", (e as Error).message);
        throw e;
      }

      // Guardar las preguntas del extra en el intento (permutation_json).
      // Primero crear el intento.
      const intentoId = randomUUID();
      const perfilRow2 = row<{ student_profile: string }>(await x(
        "SELECT student_profile FROM evaluation_instances WHERE id = ?",
        [params.instanciaId],
      ));
      const perfilParams = parametrosPerfil((perfilRow2?.student_profile as PerfilEstudiante) ?? "regular");
      const expiresAt = ahora + perfilParams.duracionMin * SEG_POR_MINUTO;

      await x(
        "INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type, started_at, expires_at, permutation_json) VALUES (?, ?, ?, ?, ?, 'extra', ?, 'activo', 'evaluacion_cierre', ?, ?, ?)",
        [
          intentoId,
          params.instanciaId,
          params.estudianteId,
          inst.evaluation_version_id,
          ahora,
          p0e.intentos.length + 1,
          ahora,
          expiresAt,
          JSON.stringify({ preguntas: extraPreguntas, subtemasFallados }),
        ],
      );

      // Actualizar P0E.
      const resultadoP0E = iniciarIntentoP0E(p0e, intentoId, ahora, "extra");
      if (!resultadoP0E.ok) {
        throw new ErrorEvaluacion("extra_no_disponible", `P0E rechaza: ${resultadoP0E.motivo}`);
      }
      await guardarInstanciaP0E(x, params.instanciaId, resultadoP0E.instancia);

      return {
        intentoId,
        intentoKind: "extra",
        preguntas: extraPreguntas,
        startedAt: ahora,
        expiresAt,
      };
    }
  }

  // Para 'normal' o 'extra' sin banco: crear intento sin preguntas pre-armadas.
  const intentoId = randomUUID();

  // P0E check.
  const resultadoP0E = iniciarIntentoP0E(p0e, intentoId, ahora, params.tipo);
  if (!resultadoP0E.ok) {
    const motivoMap: Record<string, CodigoEvaluacion> = {
      instancia_cerrada: "proceso_cerrado",
      ventana_cerrada: "extra_plazo_vencido",
      intentos_agotados: "extra_ya_existe",
      extra_no_disponible: "extra_no_disponible",
      extra_agotado: "extra_ya_existe",
    };
    throw new ErrorEvaluacion(
      motivoMap[resultadoP0E.motivo] ?? "extra_no_disponible",
      `P0E rechaza: ${resultadoP0E.motivo}`,
    );
  }

  // Obtener perfil para calcular expiresAt.
  const perfilRow = row<{ student_profile: string; duration_minutes: number }>(await x(
    "SELECT student_profile, duration_minutes FROM evaluation_instances WHERE id = ?",
    [params.instanciaId],
  ));
  const duracionMin = perfilRow ? Number(perfilRow.duration_minutes) : MIN_DURACION_EVALUACION_REGULAR;
  const expiresAt = ahora + duracionMin * SEG_POR_MINUTO;

  // Determinar attempt_number.
  const existingAttempts = await x(
    "SELECT MAX(attempt_number) AS max_n FROM evaluation_attempts WHERE instance_id = ?",
    [params.instanciaId],
  );
  const attemptNumber = (Number(row<{ max_n: number }>(existingAttempts)?.max_n) ?? 0) + 1;

  await x(
    "INSERT INTO evaluation_attempts (id, instance_id, student_id, evaluation_version_id, review_at, attempt_kind, attempt_number, status, evidence_source_type, started_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'activo', 'evaluacion_cierre', ?, ?)",
    [
      intentoId,
      params.instanciaId,
      params.estudianteId,
      inst.evaluation_version_id,
      inst.review_at ?? ahora,
      params.tipo,
      attemptNumber,
      ahora,
      expiresAt,
    ],
  );

  await guardarInstanciaP0E(x, params.instanciaId, resultadoP0E.instancia);

  return {
    intentoId,
    intentoKind: params.tipo,
    preguntas: [],
    startedAt: ahora,
    expiresAt,
  };
}

// ——— 3. responder ———

/**
 * Registra una respuesta para un intento activo.
 * Solo inserción, validando que la pregunta pertenece a la versión de evaluación.
 */
export async function responder(
  c: Client,
  params: {
    intentoId: string;
    estudianteId: string;
    preguntaVersionId: string;
    opcionId: string;
  },
): Promise<RespuestaRegistrada> {
  const x: X = (s, a = []) => c.execute({ sql: s, args: a as InValue[] });
  const ahora = await relojMotor(c).ahora();

  // Verificar intento activo.
  const intento = row<{
    id: string; instance_id: string; status: string; student_id: string;
    evaluation_version_id: string; evidence_source_type: string; review_at: number | null; expires_at: number | null;
  }>(await x(
    "SELECT id, instance_id, status, student_id, evaluation_version_id, evidence_source_type, review_at, expires_at FROM evaluation_attempts WHERE id = ?",
    [params.intentoId],
  ));
  if (!intento) throw new ErrorEvaluacion("intento_no_encontrado", `intento ${params.intentoId} no existe`);
  if (String(intento.student_id) !== params.estudianteId) {
    throw new ErrorEvaluacion("intento_no_encontrado", `intento no pertenece al estudiante ${params.estudianteId}`);
  }
  if (intento.status !== "activo") throw new ErrorEvaluacion("intento_no_activo", `intento ${params.intentoId} no está activo (status: ${intento.status})`);
  // El tiempo lo controla el servidor: vencido el plazo no se acepta nada más y el intento se entrega con lo respondido a tiempo.
  if (intento.expires_at != null && ahora >= Number(intento.expires_at)) {
    await verificarEntregaAutomatica(c, { intentoId: params.intentoId, estudianteId: params.estudianteId });
    throw new ErrorEvaluacion("intento_no_activo", "el tiempo terminó: el intento se entregó con lo respondido a tiempo");
  }

  // Validar que la pregunta pertenece a la versión de evaluación.
  const delIntento = (await preguntasDelIntentoX(x, params.intentoId)).find((q) => q.id === params.preguntaVersionId);
  const preguntaEnVersion = delIntento && { family_id: delIntento.familyId, item_id: delIntento.itemId, bank: "evaluacion" };
  if (!preguntaEnVersion) {
    throw new ErrorEvaluacion("pregunta_no_pertenece_version", `pregunta ${params.preguntaVersionId} no pertenece a la versión ${intento.evaluation_version_id}`);
  }

  // Solo inserción: una respuesta guardada no se cambia (409 claro en vez de un error de la base).
  const yaRespondida = await x("SELECT 1 FROM evaluation_attempt_answers WHERE attempt_id = ? AND question_version_id = ?", [params.intentoId, params.preguntaVersionId]);
  if (yaRespondida.rows.length) throw new ErrorEvaluacion("respuesta_existente", "esa pregunta ya tiene una respuesta guardada");

  // Obtener la respuesta correcta de la pregunta.
  const pregunta = row<{ correct_option_id: string }>(await x(
    "SELECT correct_option_id FROM question_versions WHERE id = ?",
    [params.preguntaVersionId],
  ));
  if (!pregunta) throw new ErrorEvaluacion("pregunta_no_pertenece_version", `pregunta ${params.preguntaVersionId} no encontrada`);

  const correcta = params.opcionId === String(pregunta.correct_option_id) ? 1 : 0;

  // Secuencia: siguiente número.
  const secRow = await x(
    "SELECT COALESCE(MAX(sequence_no), 0) AS max_s FROM evaluation_attempt_answers WHERE attempt_id = ?",
    [params.intentoId],
  );
  const secuencia = Number(row<{ max_s: number }>(secRow)?.max_s ?? 0) + 1;

  const respuestaId = randomUUID();
  const studyDay = new Date(ahora * 1000).toISOString().slice(0, 10);

  await x(
    "INSERT INTO evaluation_attempt_answers (id, attempt_id, student_id, evaluation_version_id, evidence_source_type, review_at, question_version_id, family_id, item_id, bank, selected_option_id, is_correct, answered_at, sequence_no, study_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      respuestaId,
      params.intentoId,
      params.estudianteId,
      intento.evaluation_version_id,
      intento.evidence_source_type,
      intento.review_at ?? ahora,
      params.preguntaVersionId,
      preguntaEnVersion.family_id,
      preguntaEnVersion.item_id,
      preguntaEnVersion.bank,
      params.opcionId,
      correcta,
      ahora,
      secuencia,
      studyDay,
    ],
  );

  return { respuestaId, correcta: correcta === 1, secuencia };
}

// ——— 4. enviarIntento ———

/**
 * Envía un intento activo: calcula el porcentaje SIN redondeo, aplica el umbral del perfil,
 * y maneja la entrega automática si venció el tiempo.
 *
 * Reglas:
 * - Porcentaje = (correctas / total_preguntas_version) * 100, sin redondeo.
 * - Umbral: shared/perfiles.ts aprueba() con el perfil de la instancia.
 * - Entrega automática: si ahora >= expiresAt, se envía con lo respondido.
 * - Registra señales mínimas de tiempo (started_at, expires_at, submitted_at).
 * - Para E2 normal: si no aprueba, el extra queda disponible.
 * - Para E2 extra: si no aprueba, reprobada_continua.
 */
export async function enviarIntento(
  c: Client,
  params: {
    intentoId: string;
    estudianteId: string;
    envioId?: string; // Idempotencia
  },
): Promise<IntentoEnviado> {
  const x: X = (s, a = []) => c.execute({ sql: s, args: a as InValue[] });
  const ahora = await relojMotor(c).ahora();

  // Verificar intento.
  const intento = row<{
    id: string; instance_id: string; status: string; student_id: string;
    evaluation_version_id: string; attempt_kind: string; expires_at: number | null;
    submission_id: string | null;
  }>(await x(
    "SELECT id, instance_id, status, student_id, evaluation_version_id, attempt_kind, expires_at, submission_id FROM evaluation_attempts WHERE id = ?",
    [params.intentoId],
  ));
  if (!intento) throw new ErrorEvaluacion("intento_no_encontrado", `intento ${params.intentoId} no existe`);
  if (String(intento.student_id) !== params.estudianteId) {
    throw new ErrorEvaluacion("intento_no_encontrado", `intento no pertenece al estudiante ${params.estudianteId}`);
  }

  // Idempotencia: si ya fue enviado con el mismo envioId, devolver el resultado.
  if (intento.status === "enviado") {
    if (params.envioId && intento.submission_id !== params.envioId) {
      throw new ErrorEvaluacion("intento_enviado", "conflicto de idempotencia");
    }
    return await cargarResultadoIntento(x, params.intentoId);
  }

  if (intento.status !== "activo") {
    throw new ErrorEvaluacion("intento_no_activo", `intento ${params.intentoId} no está activo (status: ${intento.status})`);
  }

  // Obtener perfil de la instancia.
  const inst = row<{ student_profile: string; passing_score: number; duration_minutes: number }>(await x(
    "SELECT student_profile, passing_score, duration_minutes FROM evaluation_instances WHERE id = ?",
    [intento.instance_id],
  ));
  if (!inst) throw new ErrorEvaluacion("instancia_no_encontrada", "instancia no encontrada");

  const perfil = (inst.student_profile as PerfilEstudiante) ?? "regular";
  const umbral = Number(inst.passing_score) ?? parametrosPerfil(perfil).umbralAprobacion;

  // Calcular correctas y total.
  // Solo cuentan las respuestas dadas antes del vencimiento (las posteriores se tratan como sin responder).
  const limite = intento.expires_at != null ? Number(intento.expires_at) : null;
  const aTiempo = "AND (? IS NULL OR answered_at <= ?)";
  const respuestas = rows<{ is_correct: number }>(await x(
    `SELECT is_correct FROM evaluation_attempt_answers WHERE attempt_id = ? ${aTiempo}`,
    [params.intentoId, limite, limite],
  ));
  const totalCorrect = respuestas.filter((r) => Number(r.is_correct) === 1).length;

  // Total preguntas de la versión.
  const preguntasIntento = await preguntasDelIntentoX(x, params.intentoId);
  const totalQuestions = preguntasIntento.length;

  // Porcentaje sin redondeo.
  const scorePct = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  // Determinar si aprueba usando shared/perfiles.ts.
  const aprobado = aprueba(scorePct, perfil);

  // Subtemas fallados (para el extra).
  const subtemasFallados: string[] = [];
  if (params.intentoId && !aprobado) {
    const falladas = rows<{ item_id: string }>(await x(
      `SELECT item_id FROM evaluation_attempt_answers WHERE attempt_id = ? AND is_correct = 0 ${aTiempo}`,
      [params.intentoId, limite, limite],
    ));
    // item_id es el subtema.
    const falladosSet = new Set(falladas.map((r) => String(r.item_id)));
    // También los subtemas sin responder cuentan como fallados.
    const respondidas = new Set(
      rows<{ question_version_id: string }>(await x(
        `SELECT question_version_id FROM evaluation_attempt_answers WHERE attempt_id = ? ${aTiempo}`,
        [params.intentoId, limite, limite],
      )).map((r) => String(r.question_version_id)),
    );
    for (const p of preguntasIntento) {
      if (!respondidas.has(p.id)) falladosSet.add(p.itemId);
    }
    subtemasFallados.push(...falladosSet);
  }

  const envioId = params.envioId ?? randomUUID();

  // Calcular la transición P0E con el intento aún activo antes de marcarlo como enviado.
  const p0e = await cargarInstanciaP0E(x, intento.instance_id);
  const resultadoP0E = enviarIntentoP0E(
    p0e,
    { intentoId: params.intentoId, envioId, aprobado },
    ahora,
  );
  if (!resultadoP0E.ok) {
    throw new ErrorEvaluacion("intento_enviado", `P0E rechaza: ${resultadoP0E.motivo}`);
  }

  await x(
    "UPDATE evaluation_attempts SET status = 'enviado', submitted_at = ?, submission_id = ?, score_pct = ?, total_correct = ?, total_questions = ?, passed = ? WHERE id = ?",
    [ahora, envioId, scorePct, totalCorrect, totalQuestions, aprobado ? 1 : 0, params.intentoId],
  );
  await guardarInstanciaP0E(x, intento.instance_id, resultadoP0E.instancia);

  // Si es intento normal y no aprueba, actualizar extra_deadline_at con el plazo real (72 h desde ahora).
  if (intento.attempt_kind === "normal" && !aprobado) {
    const extraDeadline = ahora + HORAS_PLAZO_EXTRA * SEG_POR_HORA;
    await x(
      "UPDATE evaluation_instances SET extra_deadline_at = ? WHERE id = ?",
      [extraDeadline, intento.instance_id],
    );
  }

  return {
    intentoId: params.intentoId,
    scorePct,
    totalCorrect,
    totalQuestions,
    aprobado,
    efectoProceso: resultadoP0E.efectoProceso,
    subtemasFallados,
  };
}

// Carga el resultado de un intento enviado (para idempotencia).
async function cargarResultadoIntento(x: X, intentoId: string): Promise<IntentoEnviado> {
  const intento = row<{
    score_pct: number; total_correct: number; total_questions: number; passed: number;
  }>(await x(
    "SELECT score_pct, total_correct, total_questions, passed FROM evaluation_attempts WHERE id = ?",
    [intentoId],
  ));
  if (!intento) throw new ErrorEvaluacion("intento_no_encontrado", `intento ${intentoId} no existe`);

  return {
    intentoId,
    scorePct: Number(intento.score_pct),
    totalCorrect: Number(intento.total_correct),
    totalQuestions: Number(intento.total_questions),
    aprobado: Number(intento.passed) === 1,
    efectoProceso: null,
    subtemasFallados: [],
  };
}

// ——— Entrega automática ———

/**
 * Verifica y ejecuta la entrega automática de intentos activos cuyo tiempo ha vencido.
 * Si ahora >= expiresAt, se envía el intento con las respuestas registradas.
 */
export async function verificarEntregaAutomatica(
  c: Client,
  params: { intentoId: string; estudianteId: string },
): Promise<IntentoEnviado | null> {
  const x: X = (s, a = []) => c.execute({ sql: s, args: a as InValue[] });
  const ahora = await relojMotor(c).ahora();

  const intento = row<{ id: string; status: string; expires_at: number | null; student_id: string }>(await x(
    "SELECT id, status, expires_at, student_id FROM evaluation_attempts WHERE id = ?",
    [params.intentoId],
  ));
  if (!intento) return null;
  if (String(intento.student_id) !== params.estudianteId) return null;
  if (intento.status !== "activo") return null;
  if (!intento.expires_at || ahora < intento.expires_at) return null;

  // Tiempo vencido: enviar automáticamente.
  return enviarIntento(c, { intentoId: params.intentoId, estudianteId: params.estudianteId });
}

// ——— 5. cerrarProceso ———

/**
 * Cierra un proceso de evaluación E2.
 *
 * Reglas:
 * - Mejor porcentaje entre intentos (normal y extra).
 * - Estado: aprobada si algún intento aprobó, reprobada si no.
 * - Si el extra obligatorio no se rinde en 72 h → reprobada y se abre el módulo siguiente
 *   (progression_continuations).
 * - E2 NO muestra nota 1–7, solo porcentaje.
 */
export async function cerrarProceso(
  c: Client,
  params: {
    procesoId: string;
    estudianteId: string;
  },
): Promise<ProcesoCerrado> {
  const x: X = (s, a = []) => c.execute({ sql: s, args: a as InValue[] });
  const ahora = await relojMotor(c).ahora();

  // Verificar proceso.
  const proceso = row<{ id: string; status: string; student_id: string }>(await x(
    "SELECT id, status, student_id FROM evaluation_processes WHERE id = ?",
    [params.procesoId],
  ));
  if (!proceso) throw new ErrorEvaluacion("proceso_no_encontrado", `proceso ${params.procesoId} no existe`);
  if (String(proceso.student_id) !== params.estudianteId) {
    throw new ErrorEvaluacion("proceso_no_encontrado", `proceso no pertenece al estudiante ${params.estudianteId}`);
  }
  if (proceso.status === "aprobado" || proceso.status === "reprobado") {
    throw new ErrorEvaluacion("proceso_cerrado", `proceso ${params.procesoId} ya está cerrado`);
  }

  // Obtener todas las instancias del proceso.
  const instancias = rows<{ id: string }>(await x(
    "SELECT id FROM evaluation_instances WHERE process_id = ?",
    [params.procesoId],
  ));

  // Obtener todos los intentos enviados de todas las instancias.
  let mejorScorePct = 0;
  let hayAprobado = false;
  let hayExtraNoRendido = false;
  let closeCause = "agotamiento";

  for (const inst of instancias) {
    const intentos = rows<{
      score_pct: number | null; passed: number | null; attempt_kind: string;
    }>(await x(
      "SELECT score_pct, passed, attempt_kind FROM evaluation_attempts WHERE instance_id = ? AND status = 'enviado'",
      [inst.id],
    ));

    for (const intento of intentos) {
      const score = Number(intento.score_pct ?? 0);
      if (score > mejorScorePct) mejorScorePct = score;
      if (Number(intento.passed) === 1) hayAprobado = true;
    }

    // Verificar si hay extra no rendido (plazo vencido sin extra).
    const instData = row<{ extra_deadline_at: number | null }>(await x(
      "SELECT extra_deadline_at FROM evaluation_instances WHERE id = ?",
      [inst.id],
    ));

    const normalEnviado = intentos.some((i) => i.attempt_kind === "normal");
    const extraEnviado = intentos.some((i) => i.attempt_kind === "extra");
    const normalAprobado = intentos.some((i) => i.attempt_kind === "normal" && Number(i.passed ?? 0) === 1);

    if (normalEnviado && !normalAprobado && !extraEnviado && instData?.extra_deadline_at && ahora >= Number(instData.extra_deadline_at)) {
      hayExtraNoRendido = true;
    }
  }

  // El estudiante no puede cerrar a su antojo: solo con un intento aprobado, el extra ya enviado,
  // el plazo del extra vencido o el intento único de una instancia de reapertura enviado.
  const hayExtraEnviado = rows<{ n: number }>(await x(
    "SELECT COUNT(*) AS n FROM evaluation_attempts a JOIN evaluation_instances i ON i.id = a.instance_id WHERE i.process_id = ? AND a.attempt_kind = 'extra' AND a.status = 'enviado'",
    [params.procesoId],
  ))[0]?.n;
  const hayReaperturaEnviada = rows<{ n: number }>(await x(
    "SELECT COUNT(*) AS n FROM evaluation_attempts a JOIN evaluation_instances i ON i.id = a.instance_id WHERE i.process_id = ? AND i.phase = 'recuperacion' AND a.status = 'enviado'",
    [params.procesoId],
  ))[0]?.n;
  if (!hayAprobado && !Number(hayExtraEnviado ?? 0) && !hayExtraNoRendido && !Number(hayReaperturaEnviada ?? 0)) {
    throw new ErrorEvaluacion("cierre_no_permitido", "el proceso no se puede cerrar todavía: falta el intento extra o que venza su plazo");
  }
  const estado: "aprobado" | "reprobado" = hayAprobado ? "aprobado" : "reprobado";
  if (hayAprobado) closeCause = "aprobacion";
  if (hayExtraNoRendido && !hayAprobado) closeCause = "reprobada_continua";

  // Cerrar proceso.
  await x(
    "UPDATE evaluation_processes SET status = ?, closed_at = ?, close_cause = ? WHERE id = ?",
    [estado, ahora, closeCause, params.procesoId],
  );

  // Si reprobada (agotamiento o extra no rendido en 72 h), registrar progression_continuations con pendientes reales.
  if (estado === "reprobado") {
    const yaCont = row<{ id: string }>(await x(
      "SELECT id FROM progression_continuations WHERE process_id = ? LIMIT 1",
      [params.procesoId],
    ));
    if (!yaCont) {
      const modRow = row<{ learning_objective_id: string | null }>(await x(
        `SELECT me.learning_objective_id
         FROM evaluation_processes p
         LEFT JOIN module_evaluations me ON me.id = p.evaluation_id
         WHERE p.id = ? LIMIT 1`,
        [params.procesoId],
      ));
      const instIds = instancias.map((i) => i.id);
      const pendingSet = new Set<string>();
      if (instIds.length > 0) {
        const ph = instIds.map(() => "?").join(",");
        const falladosRes = rows<{ item_id: string }>(await x(
          `SELECT DISTINCT ans.item_id
           FROM evaluation_attempt_answers ans
           JOIN evaluation_attempts att ON att.id = ans.attempt_id
           WHERE att.instance_id IN (${ph}) AND att.status = 'enviado' AND ans.is_correct = 0`,
          instIds,
        ));
        for (const r of falladosRes) pendingSet.add(String(r.item_id));
      }
      const pcId = randomUUID();
      await x(
        "INSERT INTO progression_continuations (id, student_id, process_id, from_module_id, pending_items_json) VALUES (?, ?, ?, ?, ?)",
        [pcId, params.estudianteId, params.procesoId, modRow?.learning_objective_id ?? null, JSON.stringify([...pendingSet].sort())],
      );
    }
  }

  // Determinar si el módulo siguiente debe abrirse.
  const estadoE2: EstadoE2 = hayAprobado
    ? "aprobada"
    : hayExtraNoRendido
      ? "no_rendido"
      : "reprobada_continua";
  const abreModuloSiguiente = moduloSiguienteAbierto(estadoE2);

  return {
    procesoId: params.procesoId,
    mejorScorePct,
    estado,
    closeCause,
    moduloSiguiente: abreModuloSiguiente,
  };
}

// ——— 6. reabrirPorAdministrador ———

export interface ReaperturaAdministrativaResultado {
  reopeningId: string;
  procesoId: string;
  evaluacionId: string;
  estudianteId: string;
  administradorId: string;
  motivo: string;
  reopenedAt: number;
  sourceAttemptId: string | null;
  nuevaInstanciaId: string;
  versionId: string;
  perfil: PerfilEstudiante;
  duracionMin: number;
  umbral: number;
}

/**
 * Reabre un proceso de evaluación E2 tras una interrupción involuntaria justificada (D2 · M-R05).
 *
 * Reglas aprobadas:
 * - Solo una reapertura administrativa por proceso (`evaluation_reopenings.process_id UNIQUE`).
 * - Respeta el perfil vigente del estudiante (60 min regular / 120 min neurodivergente).
 * - Exige motivo obligatorio (mínimo 10 caracteres) y registra trazabilidad completa.
 * - Respeta P18: solo usa una versión validada/asignada que no esté expuesta.
 * - Conserva inmutable todo el historial de instancias, intentos y respuestas previas.
 */
export async function reabrirPorAdministrador(
  c: Client,
  params: {
    procesoId: string;
    estudianteId: string;
    administradorId: string;
    motivo: string;
    versionId?: string;
  },
): Promise<ReaperturaAdministrativaResultado> {
  const x: X = (s, a = []) => c.execute({ sql: s, args: a as InValue[] });
  const ahora = await relojMotor(c).ahora();
  const motivoLimpio = params.motivo.trim();
  if (motivoLimpio.length < 10) {
    throw new ErrorEvaluacion("motivo_invalido", "el motivo de reapertura debe tener al menos 10 caracteres");
  }

  const proceso = row<{ id: string; status: string; student_id: string; evaluation_id: string }>(await x(
    "SELECT id, status, student_id, evaluation_id FROM evaluation_processes WHERE id = ?",
    [params.procesoId],
  ));
  if (!proceso) throw new ErrorEvaluacion("proceso_no_encontrado", `proceso ${params.procesoId} no existe`);
  if (String(proceso.student_id) !== params.estudianteId) {
    throw new ErrorEvaluacion("proceso_no_encontrado", `proceso no pertenece al estudiante ${params.estudianteId}`);
  }
  if (proceso.status === "aprobado") {
    throw new ErrorEvaluacion("proceso_cerrado", `proceso ${params.procesoId} ya fue aprobado y no puede reabrirse`);
  }

  // Solo una reapertura administrativa por proceso.
  const yaReabierto = row<{ id: string }>(await x(
    "SELECT id FROM evaluation_reopenings WHERE process_id = ? LIMIT 1",
    [params.procesoId],
  ));
  if (yaReabierto) {
    throw new ErrorEvaluacion("reapertura_ya_existe", `el proceso ${params.procesoId} ya fue reabierto una vez`);
  }

  const instAnterior = row<{ student_profile: string | null; evaluation_version_id: string }>(await x(
    "SELECT student_profile, evaluation_version_id FROM evaluation_instances WHERE process_id = ? ORDER BY rowid DESC LIMIT 1",
    [params.procesoId],
  ));

  // D2 confirmada: respeta el perfil de adaptación vigente en user_profiles (regular 60 min / neurodivergente 120 min).
  const perfilRow = row<{ evaluation_profile: string | null }>(await x(
    "SELECT evaluation_profile FROM user_profiles WHERE user_id = ? LIMIT 1",
    [params.estudianteId],
  ));
  const perfilVigenteRaw = perfilRow?.evaluation_profile ?? instAnterior?.student_profile ?? "regular";
  const perfil: PerfilEstudiante = perfilVigenteRaw === "neurodivergente" ? "neurodivergente" : "regular";
  const perfilParams = parametrosPerfil(perfil);

  // P18: seleccionar versión validada/asignada NO expuesta.
  let versionElegida: string | null = null;
  const candidatas: string[] = [];
  if (params.versionId?.trim()) {
    const vRow = row<{ id: string }>(await x(
      "SELECT id FROM evaluation_versions WHERE id = ? AND evaluation_id = ? AND status IN ('validada','asignada') LIMIT 1",
      [params.versionId.trim(), proceso.evaluation_id],
    ));
    if (!vRow) throw new ErrorEvaluacion("version_no_encontrada", `versión ${params.versionId} no válida para la evaluación`);
    candidatas.push(String(vRow.id));
  } else {
    const versiones = rows<{ id: string }>(await x(
      "SELECT id FROM evaluation_versions WHERE evaluation_id = ? AND status IN ('validada','asignada') ORDER BY version DESC",
      [proceso.evaluation_id],
    ));
    if (instAnterior?.evaluation_version_id) {
      candidatas.push(String(instAnterior.evaluation_version_id));
    }
    for (const v of versiones) {
      const vid = String(v.id);
      if (!candidatas.includes(vid)) candidatas.push(vid);
    }
  }
  for (const vid of candidatas) {
    if (!(await esVersionEvaluacionExpuesta(c, vid, ahora))) {
      versionElegida = vid;
      break;
    }
  }
  if (!versionElegida) {
    throw new ErrorEvaluacion("version_no_encontrada", "no hay versión no expuesta disponible para reabrir (P18)");
  }

  // Intento origen (último intento registrado en el proceso, si existe) para trazabilidad.
  const ultimoIntento = row<{ id: string }>(await x(
    `SELECT a.id
     FROM evaluation_attempts a
     JOIN evaluation_instances i ON i.id = a.instance_id
     WHERE i.process_id = ?
     ORDER BY a.rowid DESC
     LIMIT 1`,
    [params.procesoId],
  ));
  const sourceAttemptId = ultimoIntento ? String(ultimoIntento.id) : null;

  const nuevaInstanciaId = randomUUID();
  const reopeningId = randomUUID();
  const batchStmts: Array<{ sql: string; args: InValue[] }> = [
    {
      sql: `INSERT INTO evaluation_instances
              (id, process_id, student_id, evaluation_version_id, phase, window_end_at, max_attempts, status, student_profile, duration_minutes, passing_score, extra_deadline_at)
            VALUES (?, ?, ?, ?, 'recuperacion', ?, 1, 'disponible', ?, ?, ?, NULL)`,
      args: [
        nuevaInstanciaId,
        params.procesoId,
        params.estudianteId,
        versionElegida,
        ahora + HORAS_PLAZO_EXTRA * SEG_POR_HORA * 2,
        perfil,
        perfilParams.duracionMin,
        perfilParams.umbralAprobacion,
      ],
    },
    {
      sql: `INSERT INTO evaluation_reopenings
              (id, process_id, student_id, evaluation_id, admin_user_id, reason, source_attempt_id, new_instance_id, reopened_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        reopeningId,
        params.procesoId,
        params.estudianteId,
        proceso.evaluation_id,
        params.administradorId,
        motivoLimpio,
        sourceAttemptId,
        nuevaInstanciaId,
        ahora,
      ],
    },
  ];
  if (proceso.status !== "recuperacion_abierta") {
    batchStmts.push({
      sql: "UPDATE evaluation_processes SET status = 'recuperacion_abierta', closed_at = NULL, close_cause = NULL WHERE id = ?",
      args: [params.procesoId],
    });
  }

  await c.batch(batchStmts, "write");

  return {
    reopeningId,
    procesoId: params.procesoId,
    evaluacionId: String(proceso.evaluation_id),
    estudianteId: params.estudianteId,
    administradorId: params.administradorId,
    motivo: motivoLimpio,
    reopenedAt: ahora,
    sourceAttemptId,
    nuevaInstanciaId,
    versionId: versionElegida,
    perfil,
    duracionMin: perfilParams.duracionMin,
    umbral: perfilParams.umbralAprobacion,
  };
}

export interface ProcesoEvaluacionAdminDTO {
  procesoId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  evaluationId: string;
  evaluationTitle: string;
  status: string;
  closeCause: string | null;
  closedAt: number | null;
  perfilVigente: PerfilEstudiante;
  duracionMinVigente: number;
  intentosEnviados: number;
  mejorScorePct: number | null;
  reapertura: {
    id: string;
    adminUserId: string;
    adminName: string | null;
    reason: string;
    sourceAttemptId: string | null;
    newInstanceId: string;
    reopenedAt: number;
    resultadoIntento: {
      status: string;
      scorePct: number | null;
      passed: boolean | null;
    } | null;
  } | null;
}

export async function listarProcesosEvaluacionAdmin(c: Client): Promise<ProcesoEvaluacionAdminDTO[]> {
  const x: X = (s, a = []) => c.execute({ sql: s, args: a as InValue[] });
  const procs = rows<{
    proceso_id: string;
    student_id: string;
    student_name: string | null;
    student_email: string | null;
    evaluation_id: string;
    evaluation_title: string | null;
    status: string;
    close_cause: string | null;
    closed_at: number | null;
    evaluation_profile: string | null;
  }>(
    await x(
      `SELECT p.id AS proceso_id, p.student_id, u.name AS student_name, u.email AS student_email,
              p.evaluation_id, me.title AS evaluation_title, p.status, p.close_cause, p.closed_at,
              up.evaluation_profile
       FROM evaluation_processes p
       LEFT JOIN users u ON u.id = p.student_id
       LEFT JOIN module_evaluations me ON me.id = p.evaluation_id
       LEFT JOIN user_profiles up ON up.user_id = p.student_id
       ORDER BY p.rowid DESC`,
    ),
  );

  const out: ProcesoEvaluacionAdminDTO[] = [];
  for (const p of procs) {
    const agg = row<{ enviados: number; mejor: number | null }>(
      await x(
        `SELECT COUNT(*) AS enviados, MAX(a.score_pct) AS mejor
         FROM evaluation_attempts a
         JOIN evaluation_instances i ON i.id = a.instance_id
         WHERE i.process_id = ? AND a.status = 'enviado'`,
        [p.proceso_id],
      ),
    );
    const reap = row<{
      id: string;
      admin_user_id: string;
      admin_name: string | null;
      reason: string;
      source_attempt_id: string | null;
      new_instance_id: string;
      reopened_at: number;
    }>(
      await x(
        `SELECT r.id, r.admin_user_id, au.name AS admin_name, r.reason, r.source_attempt_id, r.new_instance_id, r.reopened_at
         FROM evaluation_reopenings r
         LEFT JOIN users au ON au.id = r.admin_user_id
         WHERE r.process_id = ?
         LIMIT 1`,
        [p.proceso_id],
      ),
    );
    let resultadoIntento: { status: string; scorePct: number | null; passed: boolean | null } | null = null;
    if (reap) {
      const att = row<{ status: string; score_pct: number | null; passed: number | null }>(
        await x(
          "SELECT status, score_pct, passed FROM evaluation_attempts WHERE instance_id = ? ORDER BY rowid DESC LIMIT 1",
          [reap.new_instance_id],
        ),
      );
      if (att) {
        resultadoIntento = {
          status: String(att.status),
          scorePct: att.score_pct == null ? null : Number(att.score_pct),
          passed: att.passed == null ? null : Number(att.passed) === 1,
        };
      }
    }
    const perfilVigente: PerfilEstudiante = p.evaluation_profile === "neurodivergente" ? "neurodivergente" : "regular";
    out.push({
      procesoId: String(p.proceso_id),
      studentId: String(p.student_id),
      studentName: p.student_name ? String(p.student_name) : null,
      studentEmail: p.student_email ? String(p.student_email) : null,
      evaluationId: String(p.evaluation_id),
      evaluationTitle: p.evaluation_title ? String(p.evaluation_title) : String(p.evaluation_id),
      status: String(p.status),
      closeCause: p.close_cause ? String(p.close_cause) : null,
      closedAt: p.closed_at == null ? null : Number(p.closed_at),
      perfilVigente,
      duracionMinVigente: parametrosPerfil(perfilVigente).duracionMin,
      intentosEnviados: Number(agg?.enviados ?? 0),
      mejorScorePct: agg?.mejor == null ? null : Number(agg.mejor),
      reapertura: reap
        ? {
            id: String(reap.id),
            adminUserId: String(reap.admin_user_id),
            adminName: reap.admin_name ? String(reap.admin_name) : null,
            reason: String(reap.reason),
            sourceAttemptId: reap.source_attempt_id ? String(reap.source_attempt_id) : null,
            newInstanceId: String(reap.new_instance_id),
            reopenedAt: Number(reap.reopened_at),
            resultadoIntento,
          }
        : null,
    });
  }
  return out;
}
