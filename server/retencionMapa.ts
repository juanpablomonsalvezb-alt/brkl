// Servicio M4: agenda de comprobaciones de retención espaciada sobre contenidos dominados
// y registro de respuestas de retención usando únicamente el banco `practica`.
// Respeta AC1 (nunca nombra tablas restringidas ni castea evidencias; lee vía server/conocimiento.ts
// y escribe vía server/practica.ts) y nunca consulta el reloj del sistema.
import type { Client } from "@libsql/client";
import { oaIdDesdeCodigo } from "../shared/mapaConocimiento";
import { K6_FAMILIAS } from "../shared/politica";
import {
  calcularAgendaRetencion,
  diaChileDesdeSegundos,
  seleccionarPreguntaRetencion,
  type EntradaDominadoRetencion,
  type EventoRetencion,
  type ItemRetencionProgramado,
} from "../shared/retencionMapa";
import { esPreguntaBancoIndependiente } from "./bancoPracticaPiloto";
import { versionPublicada } from "./catalogo";
import { leerEstado, politicaVigente } from "./conocimiento";
import { iniciarSesion, PracticaError, registrarRespuesta } from "./practica";
import { relojMotor } from "./reloj";
import { DOMINIO_PILOTO_PRACTICA_ID } from "./sembrarPilotoPractica";

export interface PreguntaRetencionDTO {
  preguntaVersionId: string;
  preguntaId: string;
  enunciado: string;
  opciones: Array<{ id: string; texto: string }>;
}

export interface ItemRetencionConPregunta extends ItemRetencionProgramado {
  pregunta: PreguntaRetencionDTO | null;
}

export interface AgendaRetencionDTO {
  disponible: boolean;
  dominioId: string;
  hoy: string;
  pendientesCount: number;
  pendientes: ItemRetencionConPregunta[];
  proximas: ItemRetencionProgramado[];
  vencidosIds: string[];
}

export interface RegistrarRetencionResultado {
  registrado: boolean;
  motivo?: string;
  correcta?: boolean;
  duplicada?: boolean;
  explicacion?: string | null;
  estado?: { estado: string; marca: "por_comprobar" | null; motivo: string | null } | null;
  agenda?: AgendaRetencionDTO;
}

function parseOpciones(raw: unknown): Array<{ id: string; texto: string }> {
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((o) => o && typeof o === "object" && typeof o.id === "string" && typeof o.texto === "string")
      .map((o) => ({ id: o.id, texto: o.texto }));
  } catch {
    return [];
  }
}

export async function cargarAgendaRetencion(
  c: Client,
  params: { estudianteId: string; dominioId?: string; ahora?: number },
): Promise<AgendaRetencionDTO> {
  const dominioId = params.dominioId?.trim() || DOMINIO_PILOTO_PRACTICA_ID;
  const pub = await versionPublicada(c, dominioId);
  const ahora = params.ahora ?? (await relojMotor(c).ahora());
  const hoy = diaChileDesdeSegundos(ahora);

  if (!pub) {
    return { disponible: false, dominioId, hoy, pendientesCount: 0, pendientes: [], proximas: [], vencidosIds: [] };
  }

  const [itemsRes, proyeccion, pol] = await Promise.all([
    c.execute({
      sql: `SELECT v.item_id, i.code, v.name
            FROM knowledge_item_versions v
            JOIN knowledge_items i ON i.id = v.item_id
            WHERE v.domain_version_id = ?
            ORDER BY i.code`,
      args: [pub.id],
    }),
    leerEstado(c, params.estudianteId, ahora),
    politicaVigente(c),
  ]);

  const itemInfoPorId = new Map(
    itemsRes.rows.map((r) => [
      String(r.item_id),
      { code: String(r.code), oaId: oaIdDesdeCodigo(String(r.code)), nombre: String(r.name) },
    ]),
  );

  const filasDominadas = proyeccion.filas.filter(
    (f) => f.state === "dominado" && itemInfoPorId.has(f.itemId),
  );

  if (filasDominadas.length === 0) {
    return { disponible: true, dominioId, hoy, pendientesCount: 0, pendientes: [], proximas: [], vencidosIds: [] };
  }

  const itemIds = filasDominadas.map((f) => f.itemId);
  const placeholders = itemIds.map(() => "?").join(",");
  const answersRes = await c.execute({
    sql: `SELECT item_id, family_id, question_version_id, is_correct, assistance, session_id, study_day, answered_at, purpose
          FROM practice_answers
          WHERE student_id = ? AND item_id IN (${placeholders})
          ORDER BY answered_at ASC, sequence_no ASC`,
    args: [params.estudianteId, ...itemIds],
  });

  const k6Separation = pol?.politica.k6_separation ?? "dia";
  const k6Min = pol?.politica.k6_min_families ?? K6_FAMILIAS;
  const assistedCounts = pol?.politica.assisted_counts ?? false;

  const historialRetencion: EventoRetencion[] = [];
  const familiasUsadasPorItem = new Map<string, string[]>();
  const preguntasUsadasPorItem = new Map<string, Set<string>>();
  const aciertosPreviosPorItem = new Map<
    string,
    Array<{ familyId: string; sessionId: string; studyDay: string; answeredAt: number }>
  >();
  const dominadoDesdePorItem = new Map<string, number>();

  for (const r of answersRes.rows) {
    const itemId = String(r.item_id);
    const familyId = String(r.family_id);
    const questionVersionId = String(r.question_version_id);
    const isCorrect = Number(r.is_correct) === 1;
    const assistance = String(r.assistance);
    const sinAyuda = assistance === "ninguna";
    const sessionId = String(r.session_id);
    const studyDay = String(r.study_day);
    const answeredAt = Number(r.answered_at);
    const purpose = String(r.purpose);

    const usadas = familiasUsadasPorItem.get(itemId) ?? [];
    usadas.push(familyId);
    familiasUsadasPorItem.set(itemId, usadas);

    const qUsadas = preguntasUsadasPorItem.get(itemId) ?? new Set<string>();
    qUsadas.add(questionVersionId);
    preguntasUsadasPorItem.set(itemId, qUsadas);

    if (purpose === "retencion") {
      historialRetencion.push({ itemId, correcta: isCorrect, sinAyuda, ocurridaAt: answeredAt, studyDay });
    }

    if (isCorrect && (assistedCounts || sinAyuda) && !dominadoDesdePorItem.has(itemId)) {
      const prevs = aciertosPreviosPorItem.get(itemId) ?? [];
      const cumpleSeparacion = (p: { familyId: string; sessionId: string; studyDay: string }) =>
        k6Separation === "ninguna" ||
        (k6Separation === "sesion" ? p.sessionId !== sessionId : p.studyDay !== studyDay);

      if (k6Min <= 2 && prevs.some((p) => p.familyId !== familyId && cumpleSeparacion(p))) {
        dominadoDesdePorItem.set(itemId, answeredAt);
      }
      prevs.push({ familyId, sessionId, studyDay, answeredAt });
      aciertosPreviosPorItem.set(itemId, prevs);
    }
  }

  const dominadosEntrada: EntradaDominadoRetencion[] = filasDominadas.map((f) => {
    const info = itemInfoPorId.get(f.itemId)!;
    return {
      itemId: f.itemId,
      code: info.code,
      oaId: info.oaId,
      nombre: info.nombre,
      dominadoDesdeAt: dominadoDesdePorItem.get(f.itemId) ?? f.lastEvidenceAt ?? ahora,
    };
  });

  const agenda = calcularAgendaRetencion({
    dominados: dominadosEntrada,
    historialRetencion,
    ahora,
  });

  const pendientes: ItemRetencionConPregunta[] = [];
  for (const item of agenda.pendientesMostradas) {
    const qRes = await c.execute({
      sql: `SELECT q.id, q.family_id, q.stem, q.options_json
            FROM question_versions q
            WHERE q.item_id = ?
              AND q.bank = 'practica'
              AND q.status = 'aprobada'
              AND NOT EXISTS (SELECT 1 FROM question_voids qv WHERE qv.question_version_id = q.id)
            ORDER BY q.id ASC`,
      args: [item.itemId],
    });
    const candidatasTodas = qRes.rows.map((q) => ({
      questionVersionId: String(q.id),
      familyId: String(q.family_id),
      stem: String(q.stem),
      optionsJson: String(q.options_json),
    }));
    const usadasSet = preguntasUsadasPorItem.get(item.itemId) ?? new Set<string>();
    const independientes = candidatasTodas.filter((q) => esPreguntaBancoIndependiente(q.questionVersionId));
    const poolBase = independientes.length > 0 ? independientes : candidatasTodas;
    const noRespondidas = poolBase.filter((q) => !usadasSet.has(q.questionVersionId));
    const candidatas = noRespondidas.length > 0 ? noRespondidas : poolBase;
    const elegida = seleccionarPreguntaRetencion(candidatas, familiasUsadasPorItem.get(item.itemId) ?? []);
    pendientes.push({
      ...item,
      pregunta: elegida
        ? {
            preguntaVersionId: elegida.questionVersionId,
            preguntaId: elegida.questionVersionId.replace(/^qv-prac-/, ""),
            enunciado: elegida.stem,
            opciones: parseOpciones(elegida.optionsJson),
          }
        : null,
    });
  }

  return {
    disponible: true,
    dominioId,
    hoy: agenda.hoy,
    pendientesCount: agenda.pendientes.length,
    pendientes,
    proximas: agenda.proximas,
    vencidosIds: agenda.vencidosIds,
  };
}

export async function registrarComprobacionRetencion(
  c: Client,
  params: {
    estudianteId: string;
    dominioId?: string;
    oaId: string;
    preguntaId: string;
    opcionId: string;
    clientSubmissionId: string;
    ahora?: number;
  },
): Promise<RegistrarRetencionResultado> {
  const dominioId = params.dominioId?.trim() || DOMINIO_PILOTO_PRACTICA_ID;
  const pub = await versionPublicada(c, dominioId);
  if (!pub) {
    return { registrado: false, motivo: "motor_no_sembrado" };
  }

  const qRow = (
    await c.execute({
      sql: `SELECT q.id, q.explanation, i.code
            FROM question_versions q
            JOIN knowledge_items i ON i.id = q.item_id
            JOIN knowledge_item_versions v ON v.item_id = q.item_id AND v.domain_version_id = ?
            WHERE q.id IN (?, ?)
              AND q.bank = 'practica'
              AND q.status = 'aprobada'
              AND NOT EXISTS (SELECT 1 FROM question_voids qv WHERE qv.question_version_id = q.id)
            LIMIT 1`,
      args: [pub.id, params.preguntaId, `qv-prac-${params.preguntaId}`],
    })
  ).rows[0];

  if (!qRow) {
    return { registrado: false, motivo: "pregunta_no_disponible" };
  }
  if (oaIdDesdeCodigo(String(qRow.code)) !== params.oaId) {
    throw new PracticaError("pregunta_no_disponible", "La pregunta no pertenece al objetivo indicado");
  }

  const preguntaVersionId = String(qRow.id);
  const obtenerSesionRetencion = async (): Promise<string> => {
    const abierta = (
      await c.execute({
        sql: `SELECT id FROM practice_sessions
              WHERE student_id = ? AND domain_id = ? AND domain_version_id = ? AND purpose = 'retencion' AND ended_at IS NULL
              LIMIT 1`,
        args: [params.estudianteId, dominioId, pub.id],
      })
    ).rows[0];
    if (abierta) return String(abierta.id);
    const creada = await iniciarSesion(c, {
      estudiante: params.estudianteId,
      dominioId,
      proposito: "retencion",
    });
    return creada.id;
  };

  for (let intento = 0; intento < 2; intento++) {
    const sesionId = await obtenerSesionRetencion();
    try {
      const res = await registrarRespuesta(c, {
        estudiante: params.estudianteId,
        sesionId,
        preguntaVersionId,
        opcionId: params.opcionId,
        clientSubmissionId: params.clientSubmissionId,
        asistencia: "ninguna",
      });
      const agenda = await cargarAgendaRetencion(c, {
        estudianteId: params.estudianteId,
        dominioId,
        ahora: params.ahora,
      });
      return {
        registrado: true,
        correcta: res.correcta,
        duplicada: res.duplicada,
        explicacion: qRow.explanation == null ? null : String(qRow.explanation),
        estado: res.estado,
        agenda,
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
