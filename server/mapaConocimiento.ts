// Servicio M2 + M3: lectura del mapa «Mis conocimientos» y registro en sombra de práctica.
// Solo consulta/escribe estado mediante server/conocimiento.ts y server/practica.ts (AC1);
// nunca lee el reloj del sistema (usa server/reloj.ts) ni modifica P0-E.
import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";
import { obtenerLeccionPrivadaPorOa } from "./aulaUniversalCatalogo";
import {
  calcularRefuerzoDesdeEvaluacionPublicada,
  type ResumenEvaluacionMapa,
} from "../shared/cruceEvaluacionMapa";
import {
  calcularFronteras,
  oaIdDesdeCodigo,
  recomendarSiguienteContenido,
  type AristaMapa,
  type NodoEntradaMapa,
  type NodoMapa,
  type RecomendacionMapa,
  type ResumenMapaConocimiento,
} from "../shared/mapaConocimiento";
import type { ItemRetencionProgramado } from "../shared/retencionMapa";
import { dayKey } from "../shared/repaso";
import { grafoDeVersion, versionPublicada } from "./catalogo";
import { leerEstado } from "./conocimiento";
import { cargarResumenEvaluacionParaMapa } from "./cruceEvaluacionMapa";
import { iniciarSesion, PracticaError, registrarRespuesta } from "./practica";
import { relojMotor } from "./reloj";
import { cargarAgendaRetencion, type ItemRetencionConPregunta } from "./retencionMapa";
import { DOMINIO_PILOTO_PRACTICA_ID } from "./sembrarPilotoPractica";
import { esEntornoEstrictoEsquema } from "./saludEsquema";

export { DOMINIO_PILOTO_PRACTICA_ID };

export interface RetencionMapaDTO {
  hoy: string;
  pendientesCount: number;
  pendientes: ItemRetencionConPregunta[];
  proximas: ItemRetencionProgramado[];
}

export interface MapaConocimientoDTO {
  disponible: boolean;
  dominioId: string;
  dominioNombre: string | null;
  politicaActiva: boolean;
  tieneEvidencia: boolean;
  nodos: NodoMapa[];
  aristas: AristaMapa[];
  recomendacion: RecomendacionMapa | null;
  resumen: ResumenMapaConocimiento;
  retencion: RetencionMapaDTO;
  evaluacion: ResumenEvaluacionMapa | null;
}

export interface RegistrarPracticaMotorResultado {
  registrado: boolean;
  motivo?: string;
  correcta?: boolean;
  duplicada?: boolean;
  /** M-R04: verdadero si el estudiante reintentó la misma pregunta tras fallarla en la misma sesión o día. */
  reintentoMismaPregunta?: boolean;
  estado?: { estado: string; marca: "por_comprobar" | null; motivo: string | null } | null;
}

function mapaVacio(dominioId: string, dominioNombre: string | null = null): MapaConocimientoDTO {
  return {
    disponible: false,
    dominioId,
    dominioNombre,
    politicaActiva: false,
    tieneEvidencia: false,
    nodos: [],
    aristas: [],
    recomendacion: null,
    resumen: { dominados: 0, porComprobar: 0, enPractica: 0, porReforzar: 0, listos: 0, bloqueados: 0, total: 0 },
    retencion: { hoy: "", pendientesCount: 0, pendientes: [], proximas: [] },
    evaluacion: null,
  };
}

export async function cargarMapaConocimiento(
  c: Client,
  params: { estudianteId: string; dominioId?: string; ahora?: number; evaluacionId?: string },
): Promise<MapaConocimientoDTO> {
  const dominioId = params.dominioId?.trim() || DOMINIO_PILOTO_PRACTICA_ID;
  const pub = await versionPublicada(c, dominioId);
  if (!pub) return mapaVacio(dominioId);

  const domRow = (
    await c.execute({ sql: "SELECT name FROM knowledge_domains WHERE id = ? LIMIT 1", args: [dominioId] })
  ).rows[0];
  const dominioNombre = domRow ? String(domRow.name) : dominioId;

  const itemsRes = await c.execute({
    sql: `SELECT v.item_id, i.code, v.name, v.operational_definition
          FROM knowledge_item_versions v
          JOIN knowledge_items i ON i.id = v.item_id
          WHERE v.domain_version_id = ?
          ORDER BY i.code`,
    args: [pub.id],
  });
  if (itemsRes.rows.length === 0) return mapaVacio(dominioId, dominioNombre);

  const ahora = params.ahora ?? (await relojMotor(c).ahora());
  const proyeccion = await leerEstado(c, params.estudianteId, ahora);
  const filaPorItem = new Map(proyeccion.filas.map((f) => [f.itemId, f]));

  const itemIdsDelDominioList = itemsRes.rows.map((r) => String(r.item_id));
  const phItems = itemIdsDelDominioList.map(() => "?").join(",");
  const aciertosSinAyudaRes = await c.execute({
    sql: `SELECT item_id, COUNT(DISTINCT study_day) AS dias_acierto
          FROM practice_answers
          WHERE student_id = ? AND item_id IN (${phItems}) AND is_correct = 1 AND assistance = 'ninguna'
          GROUP BY item_id`,
    args: [params.estudianteId, ...itemIdsDelDominioList],
  });
  const diasAciertoPorItem = new Map<string, number>();
  for (const r of aciertosSinAyudaRes.rows) {
    diasAciertoPorItem.set(String(r.item_id), Number(r.dias_acierto ?? 0));
  }

  const yaLoSeOas = new Set<string>();
  try {
    const progRes = await c.execute({
      sql: "SELECT oa_id FROM lesson_study_progress WHERE user_id = ? AND completada_por_ya_lo_se = 1",
      args: [params.estudianteId],
    });
    for (const r of progRes.rows) yaLoSeOas.add(String(r.oa_id));
  } catch (err) {
    if (esEntornoEstrictoEsquema() || !/no such table/i.test((err as Error)?.message ?? "")) {
      throw err;
    }
  }

  const nodosBase: NodoEntradaMapa[] = itemsRes.rows.map((r) => {
    const itemId = String(r.item_id);
    const code = String(r.code);
    const oaId = oaIdDesdeCodigo(code);
    const fila = filaPorItem.get(itemId);
    const estado = fila?.state ?? "sin_evidencia";
    const diasAcierto = diasAciertoPorItem.get(itemId) ?? 0;
    const pendienteOtroDia = estado === "incierto" && (diasAcierto === 1 || yaLoSeOas.has(oaId));
    return {
      itemId,
      code,
      oaId,
      nombre: String(r.name),
      definicion: String(r.operational_definition),
      estado,
      marca: fila?.flag ?? null,
      motivo: fila?.uncertaintyReason ?? null,
      pendienteOtroDia,
    };
  });

  const [grafo, agendaRetencion, evalCruce] = await Promise.all([
    grafoDeVersion(c, pub.id),
    cargarAgendaRetencion(c, { estudianteId: params.estudianteId, dominioId, ahora }),
    cargarResumenEvaluacionParaMapa(c, {
      estudianteId: params.estudianteId,
      ahora,
      evaluacionId: params.evaluacionId,
    }),
  ]);

  const cruceEval = calcularRefuerzoDesdeEvaluacionPublicada({
    nodos: nodosBase,
    resultadosPublicadosPorOa: evalCruce.resultadosPublicadosPorOa,
  });

  const vencidosSet = new Set(agendaRetencion.vencidosIds);
  const dominadosEvalComprobar = new Set(cruceEval.dominadosPorComprobarOaIds);
  const nodosEntrada: NodoEntradaMapa[] = nodosBase.map((n) => ({
    ...n,
    marca:
      n.estado === "dominado" &&
      (n.marca === "por_comprobar" || vencidosSet.has(n.itemId) || dominadosEvalComprobar.has(n.oaId))
        ? "por_comprobar"
        : n.marca,
  }));

  const aristas: AristaMapa[] = grafo.aristas.map((a) => ({
    itemId: a.itemId,
    prerequisiteItemId: a.prerequisiteItemId,
    relation: a.relation,
  }));

  const fronteras = calcularFronteras(nodosEntrada, aristas);
  const recomendacion = recomendarSiguienteContenido(fronteras, {
    refuerzoEvaluacionOaIds: cruceEval.refuerzos.map((r) => r.oaId),
  });
  const itemIdsDelDominio = new Set(nodosEntrada.map((n) => n.itemId));
  const tieneEvidencia = proyeccion.filas.some(
    (f) => itemIdsDelDominio.has(f.itemId) && f.lastEvidenceAt != null,
  );

  const evaluacion: ResumenEvaluacionMapa = evalCruce.resumen.publicada
    ? { ...evalCruce.resumen, contenidosAReforzar: cruceEval.refuerzos }
    : { ...evalCruce.resumen, contenidosAReforzar: [] };

  return {
    disponible: true,
    dominioId,
    dominioNombre,
    politicaActiva: proyeccion.politicaEjecutable,
    tieneEvidencia,
    nodos: fronteras.nodos,
    aristas: fronteras.aristas,
    recomendacion,
    resumen: fronteras.resumen,
    retencion: {
      hoy: agendaRetencion.hoy,
      pendientesCount: agendaRetencion.pendientesCount,
      pendientes: agendaRetencion.pendientes,
      proximas: agendaRetencion.proximas,
    },
    evaluacion,
  };
}

export async function registrarPracticaEnMotor(
  c: Client,
  params: {
    estudianteId: string;
    dominioId?: string;
    oaId: string;
    preguntaId: string;
    opcionId: string;
    usoPista: boolean;
    clientSubmissionId: string;
  },
): Promise<RegistrarPracticaMotorResultado> {
  const dominioId = params.dominioId?.trim() || DOMINIO_PILOTO_PRACTICA_ID;
  const pub = await versionPublicada(c, dominioId);
  if (!pub) {
    return { registrado: false, motivo: "motor_no_sembrado" };
  }

  const qRow = (
    await c.execute({
      sql: `SELECT q.id, i.code
            FROM question_versions q
            JOIN knowledge_items i ON i.id = q.item_id
            JOIN knowledge_item_versions v ON v.item_id = q.item_id AND v.domain_version_id = ?
            WHERE q.id IN (?, ?) AND q.bank = 'practica' AND q.status = 'aprobada'
              AND NOT EXISTS (SELECT 1 FROM question_voids qv WHERE qv.question_version_id = q.id)
            LIMIT 1`,
      args: [pub.id, params.preguntaId, `qv-prac-${params.preguntaId}`],
    })
  ).rows[0];

  if (!qRow) {
    return { registrado: false, motivo: "pregunta_no_sembrada" };
  }
  const preguntaVersionId = String(qRow.id);
  if (oaIdDesdeCodigo(String(qRow.code)) !== params.oaId) {
    throw new PracticaError("pregunta_no_disponible", "La pregunta no pertenece al objetivo indicado");
  }

  const obtenerSesionActiva = async (): Promise<string> => {
    const abierta = (
      await c.execute({
        sql: `SELECT id FROM practice_sessions
              WHERE student_id = ? AND domain_id = ? AND domain_version_id = ? AND ended_at IS NULL
              LIMIT 1`,
        args: [params.estudianteId, dominioId, pub.id],
      })
    ).rows[0];
    if (abierta) return String(abierta.id);
    const creada = await iniciarSesion(c, {
      estudiante: params.estudianteId,
      dominioId,
      proposito: "practica",
    });
    return creada.id;
  };

  for (let intento = 0; intento < 2; intento++) {
    const sesionId = await obtenerSesionActiva();
    // M-R04: impedir auto-reparación inmediata sobre la misma pregunta en la misma sesión o mismo día.
    // Si ya falló esta misma pregunta hoy o en la sesión activa, el reintento se registra con
    // `explicacion_vista` (no cuenta como acierto autónomo ni repara el error bajo `assisted_counts: false`).
    const ahora = await relojMotor(c).ahora();
    const hoy = dayKey(new Date(ahora * 1000));
    const falloPrevio = (
      await c.execute({
        sql: `SELECT 1 FROM practice_answers
              WHERE student_id = ? AND question_version_id = ? AND is_correct = 0
                AND (session_id = ? OR study_day = ?)
                AND client_submission_id <> ?
              LIMIT 1`,
        args: [params.estudianteId, preguntaVersionId, sesionId, hoy, params.clientSubmissionId],
      })
    ).rows.length > 0;
    const asistencia = params.usoPista ? "pista" : falloPrevio ? "explicacion_vista" : "ninguna";
    try {
      const res = await registrarRespuesta(c, {
        estudiante: params.estudianteId,
        sesionId,
        preguntaVersionId,
        opcionId: params.opcionId,
        clientSubmissionId: params.clientSubmissionId,
        asistencia,
      });
      return {
        registrado: true,
        correcta: res.correcta,
        duplicada: res.duplicada,
        reintentoMismaPregunta: falloPrevio,
        estado: res.estado,
      };
    } catch (e) {
      if (e instanceof PracticaError && (e.codigo === "sesion_cerrada" || e.codigo === "sesion_obsoleta") && intento === 0) {
        continue;
      }
      throw e;
    }
  }

  return { registrado: false, motivo: "sesion_no_disponible" };
}

/**
 * Registra en sombra las respuestas enviadas al paso «Comprueba» del Aula Universal
 * sin afectar el resultado cualitativo del aula cuando el motor aún no está sembrado.
 */
export async function registrarComprobacionEnMotorSombra(
  c: Client,
  params: {
    estudianteId: string;
    oaId: string;
    respuestas: Record<string, string>;
    dominioId?: string;
  },
): Promise<void> {
  const leccion = obtenerLeccionPrivadaPorOa(params.oaId);
  if (!leccion) return;
  for (const ej of leccion.ejerciciosComprobacion) {
    const opcionId = params.respuestas[ej.id];
    if (typeof opcionId !== "string" || !opcionId.trim()) continue;
    try {
      await registrarPracticaEnMotor(c, {
        estudianteId: params.estudianteId,
        dominioId: params.dominioId,
        oaId: leccion.oaId,
        preguntaId: ej.id,
        opcionId: opcionId.trim(),
        usoPista: false,
        clientSubmissionId: `aula-comp-${leccion.oaId}-${ej.id}-${randomUUID()}`,
      });
    } catch (err) {
      if (esEntornoEstrictoEsquema()) {
        throw err;
      }
      console.error("[vortice:motor-sombra] Fallo sincronizando comprobación:", {
        oaId: leccion.oaId,
        preguntaId: ej.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
