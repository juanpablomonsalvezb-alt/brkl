// Servicio M2 + M3: lectura del mapa «Mis conocimientos» y registro en sombra de práctica.
// Solo consulta/escribe estado mediante server/conocimiento.ts y server/practica.ts (AC1);
// nunca lee el reloj del sistema (usa server/reloj.ts) ni modifica P0-E.
import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";
import { obtenerLeccionPorOa } from "../shared/aulaUniversal";
import {
  calcularFronteras,
  recomendarSiguienteContenido,
  type AristaMapa,
  type NodoEntradaMapa,
  type NodoMapa,
  type RecomendacionMapa,
  type ResumenMapaConocimiento,
} from "../shared/mapaConocimiento";
import { grafoDeVersion, versionPublicada } from "./catalogo";
import { leerEstado } from "./conocimiento";
import { iniciarSesion, PracticaError, registrarRespuesta } from "./practica";
import { relojMotor } from "./reloj";
import { DOMINIO_PILOTO_PRACTICA_ID } from "./sembrarPilotoPractica";

export { DOMINIO_PILOTO_PRACTICA_ID };

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
}

export interface RegistrarPracticaMotorResultado {
  registrado: boolean;
  motivo?: string;
  correcta?: boolean;
  duplicada?: boolean;
  estado?: { estado: string; marca: "por_comprobar" | null; motivo: string | null } | null;
}

function oaIdDesdeCodigo(code: string): string {
  const m = /OA0?(\d+)$/i.exec(code.trim());
  return m ? `oa${Number(m[1])}` : code.trim().toLowerCase();
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
  };
}

export async function cargarMapaConocimiento(
  c: Client,
  params: { estudianteId: string; dominioId?: string; ahora?: number },
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

  const nodosEntrada: NodoEntradaMapa[] = itemsRes.rows.map((r) => {
    const itemId = String(r.item_id);
    const code = String(r.code);
    const fila = filaPorItem.get(itemId);
    return {
      itemId,
      code,
      oaId: oaIdDesdeCodigo(code),
      nombre: String(r.name),
      definicion: String(r.operational_definition),
      estado: fila?.state ?? "sin_evidencia",
      marca: fila?.flag ?? null,
      motivo: fila?.uncertaintyReason ?? null,
    };
  });

  const grafo = await grafoDeVersion(c, pub.id);
  const aristas: AristaMapa[] = grafo.aristas.map((a) => ({
    itemId: a.itemId,
    prerequisiteItemId: a.prerequisiteItemId,
    relation: a.relation,
  }));

  const fronteras = calcularFronteras(nodosEntrada, aristas);
  const recomendacion = recomendarSiguienteContenido(fronteras);
  const itemIdsDelDominio = new Set(nodosEntrada.map((n) => n.itemId));
  const tieneEvidencia = proyeccion.filas.some(
    (f) => itemIdsDelDominio.has(f.itemId) && f.lastEvidenceAt != null,
  );

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

  const preguntaVersionId = `qv-prac-${params.preguntaId}`;
  const qRow = (
    await c.execute({
      sql: `SELECT q.id, i.code
            FROM question_versions q
            JOIN knowledge_items i ON i.id = q.item_id
            JOIN knowledge_item_versions v ON v.item_id = q.item_id AND v.domain_version_id = ?
            WHERE q.id = ? AND q.bank = 'practica' AND q.status = 'aprobada'
              AND NOT EXISTS (SELECT 1 FROM question_voids qv WHERE qv.question_version_id = q.id)
            LIMIT 1`,
      args: [pub.id, preguntaVersionId],
    })
  ).rows[0];

  if (!qRow) {
    return { registrado: false, motivo: "pregunta_no_sembrada" };
  }
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

  const asistencia = params.usoPista ? "pista" : "ninguna";

  for (let intento = 0; intento < 2; intento++) {
    const sesionId = await obtenerSesionActiva();
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
  const leccion = obtenerLeccionPorOa(params.oaId);
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
    } catch {
      // Modo sombra: nunca bloquea ni interrumpe la respuesta del Aula Universal.
    }
  }
}
