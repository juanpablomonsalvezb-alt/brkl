// Analítica de aprendizaje, capa mínima: registrar eventos proporcionales e interpretables y
// resumirlos para administración sin listar estudiantes. Recibe la conexión como parámetro
// para poder probarse contra una base en memoria (script/vortice-db.check.ts).
import { and, asc, count, countDistinct, eq, gte, inArray, lt, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import {
  learningEvents, enrollments, learningObjectives, weeklyResources, moduleEvaluations,
  type LearningEventType,
} from "@shared/schema";

type Db = LibSQLDatabase<typeof schema>;

// Los eventos se borran pasados 12 meses: alcanza para comparar un año escolar con el
// anterior y nada más. purgeOldEvents lo aplica; no corre sola.
export const RETENCION_MESES = 12;
// Bajo este número de matriculados el resumen no se entrega: con grupos chicos un
// agregado deja de ser anónimo.
export const MIN_GRUPO = 5;
// Anti-spam de recurso_abierto: abrir el mismo recurso de nuevo dentro de la ventana no
// cuenta, y hay un tope por estudiante por hora.
export const VENTANA_DUPLICADO_MIN = 30;
export const MAX_ABIERTOS_POR_HORA = 60;

export interface LearningEventInput {
  userId: string;
  tipo: LearningEventType;
  referencia: string;
  levelSubjectId: string;
}

// Nunca rompe la acción principal: si falla, lo deja en el log y devuelve false.
export async function recordEvent(db: Db, event: LearningEventInput, now = new Date()): Promise<boolean> {
  try {
    await db.insert(learningEvents).values({ ...event, createdAt: now });
    return true;
  } catch (error) {
    console.error("analitica: no se pudo registrar el evento", event.tipo, error);
    return false;
  }
}

// ponytail: leer-y-luego-insertar sin transacción; dos pedidos simultáneos pueden pasar el
// tope por uno. Basta para frenar spam; un índice único por ventana si hiciera falta exactitud.
export async function recordResourceOpened(
  db: Db, userId: string, resourceId: string, levelSubjectId: string, now = new Date(),
): Promise<"registrado" | "duplicado" | "limite"> {
  const haceUnaHora = new Date(now.getTime() - 60 * 60 * 1000);
  const ventana = new Date(now.getTime() - VENTANA_DUPLICADO_MIN * 60 * 1000);
  const recientes = await db.select({ referencia: learningEvents.referencia, createdAt: learningEvents.createdAt })
    .from(learningEvents)
    .where(and(
      eq(learningEvents.userId, userId),
      eq(learningEvents.tipo, "recurso_abierto"),
      gte(learningEvents.createdAt, haceUnaHora),
    ));
  if (recientes.some((e) => e.referencia === resourceId && e.createdAt >= ventana)) return "duplicado";
  if (recientes.length >= MAX_ABIERTOS_POR_HORA) return "limite";
  await recordEvent(db, { userId, tipo: "recurso_abierto", referencia: resourceId, levelSubjectId }, now);
  return "registrado";
}

// Idempotente: borrar dos veces con la misma fecha no borra nada más.
export async function purgeOldEvents(db: Db, now = new Date(), meses = RETENCION_MESES): Promise<number> {
  const corte = new Date(now);
  corte.setMonth(corte.getMonth() - meses);
  const result = await db.delete(learningEvents).where(lt(learningEvents.createdAt, corte));
  return result.rowsAffected;
}

export type AnaliticaResumen =
  | { levelSubjectId: string; suprimido: true; minimoGrupo: number }
  | {
      levelSubjectId: string;
      suprimido: false;
      matriculados: number;
      // Semana = lunes (UTC) en que empieza.
      semanas: { semana: string; tipo: string; eventos: number; estudiantes: number }[];
      objetivos: {
        id: string; code: string; title: string; weekNumber: number;
        recursos: number;
        // % de (estudiante, recurso) completados sobre recursos × matriculados.
        recursosCompletadosPct: number | null;
        // % de matriculados que aprobó la evaluación de cierre (evaluación 2).
        cierreAprobadoPct: number | null;
      }[];
    };

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : null);

// Solo cuenta a estudiantes con matrícula activa hoy; las tasas cubren lo que quede dentro
// de la retención.
export async function loadAnaliticaResumen(db: Db, levelSubjectId: string): Promise<AnaliticaResumen> {
  const activos = and(eq(enrollments.levelSubjectId, levelSubjectId), eq(enrollments.isActive, true));
  const [{ n: matriculados }] = await db.select({ n: countDistinct(enrollments.userId) }).from(enrollments).where(activos);
  if (matriculados < MIN_GRUPO) return { levelSubjectId, suprimido: true, minimoGrupo: MIN_GRUPO };

  const semana = sql<string>`date(${learningEvents.createdAt}, 'unixepoch', 'weekday 0', '-6 days')`;
  const semanas = await db.select({
    semana,
    tipo: learningEvents.tipo,
    eventos: count(),
    estudiantes: countDistinct(learningEvents.userId),
  })
    .from(learningEvents)
    .where(eq(learningEvents.levelSubjectId, levelSubjectId))
    .groupBy(semana, learningEvents.tipo)
    .orderBy(semana, learningEvents.tipo);

  const objectives = await db.select().from(learningObjectives)
    .where(eq(learningObjectives.levelSubjectId, levelSubjectId))
    .orderBy(asc(learningObjectives.weekNumber), asc(learningObjectives.sortOrder));
  const oaIds = objectives.map((o) => o.id);
  const resources = oaIds.length
    ? await db.select({ id: weeklyResources.id, oa: weeklyResources.learningObjectiveId }).from(weeklyResources)
        .where(and(inArray(weeklyResources.learningObjectiveId, oaIds), eq(weeklyResources.isActive, true)))
    : [];
  const cierres = oaIds.length
    ? await db.select({ id: moduleEvaluations.id, oa: moduleEvaluations.learningObjectiveId }).from(moduleEvaluations)
        .where(and(inArray(moduleEvaluations.learningObjectiveId, oaIds), eq(moduleEvaluations.evaluationNumber, 2)))
    : [];

  // Pares únicos (estudiante, referencia): se usan para contar y se descartan, no se devuelven.
  const pares = await db.selectDistinct({ userId: learningEvents.userId, tipo: learningEvents.tipo, referencia: learningEvents.referencia })
    .from(learningEvents)
    .innerJoin(enrollments, and(eq(enrollments.userId, learningEvents.userId), activos))
    .where(and(
      eq(learningEvents.levelSubjectId, levelSubjectId),
      inArray(learningEvents.tipo, ["recurso_completado", "evaluacion_aprobada"]),
    ));

  const objetivos = objectives.map((o) => {
    const recursosOa = new Set(resources.filter((r) => r.oa === o.id).map((r) => r.id));
    const cierresOa = new Set(cierres.filter((e) => e.oa === o.id).map((e) => e.id));
    const completados = pares.filter((p) => p.tipo === "recurso_completado" && recursosOa.has(p.referencia)).length;
    const aprobaron = new Set(pares.filter((p) => p.tipo === "evaluacion_aprobada" && cierresOa.has(p.referencia)).map((p) => p.userId));
    return {
      id: o.id, code: o.code, title: o.title, weekNumber: o.weekNumber,
      recursos: recursosOa.size,
      recursosCompletadosPct: pct(completados, recursosOa.size * matriculados),
      cierreAprobadoPct: cierresOa.size ? pct(aprobaron.size, matriculados) : null,
    };
  });

  return { levelSubjectId, suprimido: false, matriculados, semanas, objetivos };
}
