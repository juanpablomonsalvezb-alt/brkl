// Registro atómico de práctica (IMP-031, H3a). Sesiones y respuestas; la evidencia, los eventos y la
// proyección se escriben con las sentencias de server/conocimiento.ts (único punto de acceso a esas tablas).
// Diseño: 03 §9.1 y 04 §5.4 (3e5c488) y las decisiones D4 y D5.4 de H3a.
//
// El servidor decide estudiante, identificadores, tiempo, secuencia, día de estudio y correctitud. El
// cliente solo aporta la pregunta, la opción elegida y su identificador de idempotencia.
//
// Atomicidad: una respuesta es UN lote (`batch(..., "write")`, una transacción): respuesta, evidencia y,
// si hay política ejecutable, evento y proyección. Sin transacciones interactivas. La concurrencia es
// optimista: la inserción de la respuesta exige que ninguna respuesta nueva del mismo estudiante y
// contenido haya llegado desde que se leyó el estado; las demás sentencias dependen de que la respuesta se
// haya insertado. Si la guarda falla, no se escribe nada y se reintenta (máximo `MAX_INTENTOS`).
// Fuera de H3a: anulaciones, evaluaciones, E2, retención.
import type { Client } from "@libsql/client";
import { randomUUID } from "node:crypto";
import { dayKey } from "../shared/repaso";
import { versionPublicada } from "./catalogo";
import { planificarEstado, resultadoDeRespuesta, sentenciasEvidencia } from "./conocimiento";
import { relojMotor } from "./reloj";

export type CodigoPractica =
  | "dominio_no_publicado" | "sesion_no_encontrada" | "sesion_cerrada" | "sesion_obsoleta"
  | "pregunta_no_disponible" | "opcion_invalida" | "conflicto_idempotencia" | "reintente";

export class PracticaError extends Error {
  constructor(readonly codigo: CodigoPractica, mensaje: string) { super(`${codigo}: ${mensaje}`); }
}

export const MAX_INTENTOS = 3;
export const ASISTENCIAS = ["ninguna", "pista", "explicacion_vista", "tutor"] as const;
export type Asistencia = (typeof ASISTENCIAS)[number];
export type Proposito = "practica" | "retencion";

// D5.4: una sesión abierta por estudiante y dominio, sin importar el propósito. Abrir otra cierra la
// anterior en el mismo lote. Sin caducidad automática.
export async function iniciarSesion(c: Client, p: { estudiante: string; dominioId: string; proposito: Proposito }): Promise<{ id: string; domainVersionId: string }> {
  const dv = await versionPublicada(c, p.dominioId);
  if (!dv) throw new PracticaError("dominio_no_publicado", `el dominio ${p.dominioId} no tiene versión publicada`);
  const ahora = await relojMotor(c).ahora();
  const id = randomUUID();
  try {
    await c.batch([
      { sql: "UPDATE practice_sessions SET ended_at = ? WHERE student_id = ? AND domain_id = ? AND ended_at IS NULL", args: [ahora, p.estudiante, p.dominioId] },
      { sql: "INSERT INTO practice_sessions (id, student_id, domain_id, domain_version_id, purpose, started_at) VALUES (?, ?, ?, ?, ?, ?)",
        args: [id, p.estudiante, p.dominioId, dv.id, p.proposito, ahora] },
    ], "write");
  } catch (e) {
    if (/no está publicada/.test((e as Error).message)) throw new PracticaError("dominio_no_publicado", "la versión dejó de estar publicada");
    throw e;
  }
  return { id, domainVersionId: dv.id };
}

export async function cerrarSesion(c: Client, p: { estudiante: string; sesionId: string }): Promise<void> {
  const ahora = await relojMotor(c).ahora();
  const r = await c.execute({ sql: "UPDATE practice_sessions SET ended_at = ? WHERE id = ? AND student_id = ? AND ended_at IS NULL", args: [ahora, p.sesionId, p.estudiante] });
  if (r.rowsAffected) return;
  const e = (await c.execute({ sql: "SELECT 1 FROM practice_sessions WHERE id = ? AND student_id = ?", args: [p.sesionId, p.estudiante] })).rows[0];
  if (!e) throw new PracticaError("sesion_no_encontrada", p.sesionId); // ya cerrada: idempotente
}

export interface EntradaRespuesta {
  /** Lo fija el servidor a partir de la sesión autenticada; nunca el cliente. */
  estudiante: string;
  sesionId: string;
  preguntaVersionId: string;
  opcionId: string;
  clientSubmissionId: string;
  /** Ayuda ofrecida por la práctica (no por el cliente). */
  asistencia?: Asistencia;
  /** Ajuste de accesibilidad (O9): se guarda sin interpretar; no cuenta como ayuda. */
  ajuste?: string | null;
}

export interface ResultadoRespuesta {
  respuestaId: string;
  evidenciaId: string;
  correcta: boolean;
  secuencia: number;
  /** true si es un reenvío del mismo contenido: ids y correctitud son los originales; el estado es el proyectado hoy. */
  duplicada: boolean;
  /** null si no hay política ejecutable: la respuesta y la evidencia se conservan sin calcular estado. */
  estado: { estado: string; marca: "por_comprobar" | null; motivo: string | null } | null;
}

const reintentable = (m: string) => /no se sustituye|UNIQUE constraint|SQLITE_BUSY|database is locked|secuencia debe ser creciente/.test(m);

export async function registrarRespuesta(c: Client, p: EntradaRespuesta): Promise<ResultadoRespuesta> {
  const asistencia = p.asistencia ?? "ninguna";
  if (!(ASISTENCIAS as readonly string[]).includes(asistencia)) throw new PracticaError("opcion_invalida", `asistencia no admitida: ${asistencia}`);
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    // 1. Idempotencia: mismo identificador y mismo contenido → el resultado original; distinto → conflicto.
    const previa = (await c.execute({ sql: "SELECT id, session_id, question_version_id, selected_option_id, item_id, is_correct, sequence_no FROM practice_answers WHERE student_id = ? AND client_submission_id = ?",
      args: [p.estudiante, p.clientSubmissionId] })).rows[0];
    if (previa) {
      if (String(previa.session_id) !== p.sesionId || String(previa.question_version_id) !== p.preguntaVersionId || String(previa.selected_option_id) !== p.opcionId) {
        throw new PracticaError("conflicto_idempotencia", `el identificador ${p.clientSubmissionId} ya se usó con otro contenido`);
      }
      const r = await resultadoDeRespuesta(c, String(previa.id), p.estudiante, String(previa.item_id));
      if (!r.evidenciaId) throw new Error(`respuesta ${String(previa.id)} sin evidencia: use el detector de respuestas sin evidencia`);
      return { respuestaId: String(previa.id), evidenciaId: r.evidenciaId, correcta: Number(previa.is_correct) === 1, secuencia: Number(previa.sequence_no), duplicada: true, estado: r.estado };
    }

    // 2. Sesión: del estudiante, abierta y sobre la versión de dominio publicada.
    const ses = (await c.execute({ sql: `SELECT s.id, s.purpose, s.domain_version_id, s.ended_at, d.status FROM practice_sessions s
      JOIN knowledge_domain_versions d ON d.id = s.domain_version_id WHERE s.id = ? AND s.student_id = ?`, args: [p.sesionId, p.estudiante] })).rows[0];
    if (!ses) throw new PracticaError("sesion_no_encontrada", p.sesionId);
    if (ses.ended_at != null) throw new PracticaError("sesion_cerrada", p.sesionId);
    if (String(ses.status) !== "publicada") throw new PracticaError("sesion_obsoleta", `la versión ${String(ses.domain_version_id)} ya no está publicada; abra otra sesión`);

    // 3. Pregunta: aprobada, de práctica, no anulada y de un contenido de la versión de la sesión.
    const q = (await c.execute({ sql: `SELECT q.id, q.family_id, q.item_id, q.bank, q.status, q.correct_option_id, q.options_json,
      EXISTS (SELECT 1 FROM question_voids v WHERE v.question_version_id = q.id) AS anulada,
      (SELECT v.id FROM knowledge_item_versions v WHERE v.domain_version_id = ? AND v.item_id = q.item_id) AS item_version_id
      FROM question_versions q WHERE q.id = ?`, args: [String(ses.domain_version_id), p.preguntaVersionId] })).rows[0];
    if (!q || String(q.status) !== "aprobada" || String(q.bank) !== "practica" || Number(q.anulada) === 1 || q.item_version_id == null) {
      throw new PracticaError("pregunta_no_disponible", p.preguntaVersionId);
    }
    let opciones: { id: string }[];
    try { opciones = JSON.parse(String(q.options_json)); } catch { throw new PracticaError("pregunta_no_disponible", "opciones ilegibles"); }
    if (!opciones.some((o) => o.id === p.opcionId)) throw new PracticaError("opcion_invalida", p.opcionId);
    const correcta = p.opcionId === String(q.correct_option_id); // la correctitud la fija el servidor

    // 4. Tiempo y día: reloj de la base, una sola lectura; día de Chile (dayKey).
    const ahora = await relojMotor(c).ahora();
    const dia = dayKey(new Date(ahora * 1000));
    const itemId = String(q.item_id);

    // 5. Estado base (antes de calcular): última secuencia del contenido y estado resultante.
    const ultima = Number((await c.execute({ sql: "SELECT COALESCE(MAX(sequence_no), 0) AS m FROM practice_answers WHERE student_id = ? AND item_id = ?", args: [p.estudiante, itemId] })).rows[0].m);
    const plan = await planificarEstado(c, p.estudiante, itemId, ahora, {
      familia: String(q.family_id), correcta, conAyuda: asistencia !== "ninguna", sesion: p.sesionId, dia, fuente: String(ses.purpose) as "practica" | "retencion",
      versionContenido: String(q.item_version_id),
    });

    // 6. Lote atómico. S0 lleva la guarda; S1–S3 dependen de S0.
    const respuestaId = randomUUID(), evidenciaId = randomUUID(), eventoId = randomUUID();
    const sentencias = [
      { sql: `INSERT INTO practice_answers (id, session_id, student_id, purpose, domain_version_id, question_version_id, family_id, item_id, bank,
                selected_option_id, is_correct, assistance, accommodation, client_submission_id, answered_at, sequence_no, study_day)
              SELECT :id, :ses, :est, :prop, :dv, :qv, :fam, :item, 'practica', :opt, :corr, :asist, :ajuste, :csid, :ahora,
                     (SELECT COALESCE(MAX(sequence_no), 0) + 1 FROM practice_answers WHERE student_id = :est), :dia
              WHERE NOT EXISTS (SELECT 1 FROM practice_answers WHERE student_id = :est AND item_id = :item AND sequence_no > :ultima)`,
        args: { id: respuestaId, ses: p.sesionId, est: p.estudiante, prop: String(ses.purpose), dv: String(ses.domain_version_id), qv: p.preguntaVersionId,
          fam: String(q.family_id), item: itemId, opt: p.opcionId, corr: correcta ? 1 : 0, asist: asistencia, ajuste: p.ajuste ?? null,
          csid: p.clientSubmissionId, ahora, dia, ultima } },
      ...sentenciasEvidencia({ respuestaId, evidenciaId, eventoId, estudiante: p.estudiante, itemId, ahora, plan }),
    ];
    let res;
    try {
      res = await c.batch(sentencias, "write");
    } catch (e) {
      const m = (e as Error).message;
      if (/sesion_cerrada/.test(m)) throw new PracticaError("sesion_cerrada", p.sesionId);
      if (/sesion_obsoleta/.test(m)) throw new PracticaError("sesion_obsoleta", "la versión de dominio dejó de estar publicada");
      if (/pregunta anulada|pregunta no aprobada/.test(m)) throw new PracticaError("pregunta_no_disponible", p.preguntaVersionId);
      if (reintentable(m) && intento < MAX_INTENTOS) continue;
      if (reintentable(m)) throw new PracticaError("reintente", "concurrencia: vuelva a enviar");
      throw e;
    }
    if (res[0].rowsAffected === 0) { // la guarda falló: llegó otra respuesta del contenido; nada se escribió
      if (intento < MAX_INTENTOS) continue;
      throw new PracticaError("reintente", "concurrencia: vuelva a enviar");
    }
    const sec = Number((await c.execute({ sql: "SELECT sequence_no FROM practice_answers WHERE id = ?", args: [respuestaId] })).rows[0].sequence_no);
    return {
      respuestaId, evidenciaId, correcta, secuencia: sec, duplicada: false,
      estado: plan ? { estado: plan.fila.state, marca: plan.fila.flag, motivo: plan.fila.uncertaintyReason } : null,
    };
  }
  throw new PracticaError("reintente", "concurrencia: vuelva a enviar");
}
