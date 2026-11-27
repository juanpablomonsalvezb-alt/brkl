// Persistencia por tramo y comprobación cualitativa para el Aula Universal UDL (Bloque A).
// Respeta el estándar universal: sin cronómetro ni porcentaje numérico en práctica/proceso,
// con guardado idempotente por (user_id, oa_id) para pausar y retomar real.
import { and, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import { lessonStudyProgress, type LessonStudyProgressRow } from "@shared/schema";
import {
  guardarProgresoLeccionSchema,
  procesoRespuestasSchema,
  type PasoLeccion,
  type PuertaAprendizaje,
} from "@shared/aulaUniversal";
import {
  evaluarProcesoSinPorcentaje,
  explicacionesAcertadasProceso,
  obtenerLeccionPrivadaPorOa,
} from "./aulaUniversalCatalogo";

export interface ProgresoLeccionDTO {
  oaId: string;
  pasoActual: PasoLeccion;
  tramoActual: number;
  puertaPreferida: PuertaAprendizaje;
  pasoEjemploVisto: number;
  completadaPorYaLoSe: boolean;
  practicaLograda: boolean;
  updatedAt: Date;
}

type Res<T> = { ok: true; value: T } | { ok: false; status: 400 | 404; reason: string };

function serializeProgreso(row: LessonStudyProgressRow): ProgresoLeccionDTO {
  return {
    oaId: row.oaId,
    pasoActual: row.pasoActual,
    tramoActual: row.tramoActual,
    puertaPreferida: row.puertaPreferida,
    pasoEjemploVisto: row.pasoEjemploVisto,
    completadaPorYaLoSe: Boolean(row.completadaPorYaLoSe),
    practicaLograda: Boolean(row.practicaLograda),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
  };
}

export async function getProgresoLecciones(
  db: LibSQLDatabase<typeof schema>,
  userId: string,
): Promise<Record<string, ProgresoLeccionDTO>> {
  const rows = await db
    .select()
    .from(lessonStudyProgress)
    .where(eq(lessonStudyProgress.userId, userId));
  const out: Record<string, ProgresoLeccionDTO> = {};
  for (const r of rows) {
    out[r.oaId] = serializeProgreso(r);
  }
  return out;
}

export async function getProgresoLeccion(
  db: LibSQLDatabase<typeof schema>,
  userId: string,
  oaId: string,
): Promise<ProgresoLeccionDTO | null> {
  const [row] = await db
    .select()
    .from(lessonStudyProgress)
    .where(and(eq(lessonStudyProgress.userId, userId), eq(lessonStudyProgress.oaId, oaId)));
  return row ? serializeProgreso(row) : null;
}

export async function saveProgresoLeccion(
  db: LibSQLDatabase<typeof schema>,
  params: { userId: string; oaId: string; body: unknown; now: Date },
): Promise<Res<ProgresoLeccionDTO>> {
  const leccion = obtenerLeccionPrivadaPorOa(params.oaId);
  if (!leccion) {
    return { ok: false, status: 404, reason: "Lección no encontrada" };
  }
  const parsed = guardarProgresoLeccionSchema.safeParse(params.body);
  if (!parsed.success) {
    return { ok: false, status: 400, reason: "Progreso inválido" };
  }

  const maxTramo = Math.max(0, leccion.microTramos.length - 1);
  const maxPasoEj = Math.max(0, leccion.ejemploResuelto.pasos.length - 1);
  const tramoActual = Math.min(parsed.data.tramoActual, maxTramo);
  const pasoEjemploVisto = Math.min(parsed.data.pasoEjemploVisto, maxPasoEj);

  const [existing] = await db
    .select()
    .from(lessonStudyProgress)
    .where(and(eq(lessonStudyProgress.userId, params.userId), eq(lessonStudyProgress.oaId, leccion.oaId)));

  // Las banderas de logro (`practicaLograda` y `completadaPorYaLoSe`) solo se activan mediante comprobación real.
  if (existing) {
    const [updated] = await db
      .update(lessonStudyProgress)
      .set({
        pasoActual: parsed.data.pasoActual,
        tramoActual,
        puertaPreferida: parsed.data.puertaPreferida,
        pasoEjemploVisto,
        updatedAt: params.now,
      })
      .where(eq(lessonStudyProgress.id, existing.id))
      .returning();
    return { ok: true, value: serializeProgreso(updated) };
  }

  const [inserted] = await db
    .insert(lessonStudyProgress)
    .values({
      userId: params.userId,
      oaId: leccion.oaId,
      pasoActual: parsed.data.pasoActual,
      tramoActual,
      puertaPreferida: parsed.data.puertaPreferida,
      pasoEjemploVisto,
      completadaPorYaLoSe: false,
      practicaLograda: false,
      updatedAt: params.now,
    })
    .returning();
  return { ok: true, value: serializeProgreso(inserted) };
}

export async function registrarComprobacionProceso(
  db: LibSQLDatabase<typeof schema>,
  params: { userId: string; oaId: string; body: unknown; now: Date },
): Promise<
  Res<{
    estado: "logrado" | "sigue_practicando";
    detalle: Record<string, boolean>;
    explicaciones: Record<string, string>;
    progreso: ProgresoLeccionDTO | null;
  }>
> {
  const leccion = obtenerLeccionPrivadaPorOa(params.oaId);
  if (!leccion) {
    return { ok: false, status: 404, reason: "Lección no encontrada" };
  }
  const parsed = procesoRespuestasSchema.safeParse(params.body);
  if (!parsed.success) {
    return { ok: false, status: 400, reason: "Respuestas de comprobación inválidas" };
  }

  const evaluacion = evaluarProcesoSinPorcentaje(leccion.oaId, parsed.data.respuestas);
  const [existing] = await db
    .select()
    .from(lessonStudyProgress)
    .where(and(eq(lessonStudyProgress.userId, params.userId), eq(lessonStudyProgress.oaId, leccion.oaId)));

  let progreso: ProgresoLeccionDTO | null = existing ? serializeProgreso(existing) : null;

  if (evaluacion.estado === "logrado") {
    const yaLoSe = parsed.data.origen === "ya_lo_se";
    if (existing) {
      const [updated] = await db
        .update(lessonStudyProgress)
        .set({
          pasoActual: "comprueba",
          practicaLograda: true,
          completadaPorYaLoSe: Boolean(existing.completadaPorYaLoSe) || yaLoSe,
          updatedAt: params.now,
        })
        .where(eq(lessonStudyProgress.id, existing.id))
        .returning();
      progreso = serializeProgreso(updated);
    } else {
      const [inserted] = await db
        .insert(lessonStudyProgress)
        .values({
          userId: params.userId,
          oaId: leccion.oaId,
          pasoActual: "comprueba",
          tramoActual: Math.max(0, leccion.microTramos.length - 1),
          puertaPreferida: leccion.puertaSugerida,
          pasoEjemploVisto: Math.max(0, leccion.ejemploResuelto.pasos.length - 1),
          completadaPorYaLoSe: yaLoSe,
          practicaLograda: true,
          updatedAt: params.now,
        })
        .returning();
      progreso = serializeProgreso(inserted);
    }
  }

  return {
    ok: true,
    value: {
      estado: evaluacion.estado,
      detalle: evaluacion.detalle,
      explicaciones: explicacionesAcertadasProceso(leccion.oaId, evaluacion.detalle),
      progreso,
    },
  };
}
