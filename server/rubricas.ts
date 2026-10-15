// Umbral™: rúbricas por objetivo de aprendizaje (criterios de logro visibles antes de evaluar).
// Recibe la conexión como parámetro para poder probarse contra una base en memoria.
import { and, asc, desc, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { z } from "zod";
import { randomUUID } from "crypto";
import * as schema from "@shared/schema";
import { learningObjectives, rubrics, rubricCriteria } from "@shared/schema";
import { hasActiveEnrollment } from "./vortice";

type Db = LibSQLDatabase<typeof schema>;

const performanceLevelSchema = z.object({
  label: z.string().trim().min(1).max(40), // "Inicial", "En desarrollo", "Logrado", "Destacado"
  description: z.string().trim().min(1).max(1000),
});

export const rubricInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  publish: z.boolean().default(false),
  criteria: z.array(z.object({
    description: z.string().trim().min(1).max(1000),
    performanceLevels: z.array(performanceLevelSchema).min(2).max(6)
      .refine((ls) => new Set(ls.map((l) => l.label.toLowerCase())).size === ls.length, "Etiquetas de nivel repetidas"),
  })).min(1).max(30),
});
export type RubricInput = z.infer<typeof rubricInputSchema>;

export type RubricView = {
  id: string; learningObjectiveId: string; title: string; version: number; isPublished: boolean;
  criteria: { id: string; description: string; performanceLevels: { label: string; description: string }[]; sortOrder: number }[];
};
type Result<T> = { ok: true; value: T } | { ok: false; status: 403 | 404 | 409; reason: string };

async function withCriteria(db: Db, rubric: typeof rubrics.$inferSelect): Promise<RubricView> {
  const criteria = await db.select().from(rubricCriteria)
    .where(eq(rubricCriteria.rubricId, rubric.id)).orderBy(asc(rubricCriteria.sortOrder));
  return {
    id: rubric.id, learningObjectiveId: rubric.learningObjectiveId, title: rubric.title,
    version: rubric.version, isPublished: rubric.isPublished,
    criteria: criteria.map(({ id, description, performanceLevels, sortOrder }) => ({ id, description, performanceLevels, sortOrder })),
  };
}

async function latestRubric(db: Db, objectiveId: string, publishedOnly: boolean) {
  const [row] = await db.select().from(rubrics)
    .where(publishedOnly
      ? and(eq(rubrics.learningObjectiveId, objectiveId), eq(rubrics.isPublished, true))
      : eq(rubrics.learningObjectiveId, objectiveId))
    .orderBy(desc(rubrics.version)).limit(1);
  return row;
}

// Estudiante: última versión publicada, solo con matrícula activa en la asignatura del objetivo.
export async function getStudentRubric(db: Db, userId: string, objectiveId: string): Promise<Result<RubricView>> {
  const [oa] = await db.select({ levelSubjectId: learningObjectives.levelSubjectId })
    .from(learningObjectives).where(eq(learningObjectives.id, objectiveId));
  if (!oa) return { ok: false, status: 404, reason: "Objetivo no encontrado" };
  if (!(await hasActiveEnrollment(db, userId, oa.levelSubjectId))) {
    return { ok: false, status: 403, reason: "No tienes matrícula activa en esta asignatura" };
  }
  const rubric = await latestRubric(db, objectiveId, true);
  if (!rubric) return { ok: false, status: 404, reason: "Este objetivo aún no tiene rúbrica publicada" };
  return { ok: true, value: await withCriteria(db, rubric) };
}

// Admin: crea una versión nueva (max + 1). Las anteriores, publicadas o no, quedan intactas.
// ponytail: dos POST simultáneos chocan con el índice único (version) y uno falla; reintentar basta.
export async function createRubricVersion(db: Db, objectiveId: string, input: RubricInput): Promise<Result<RubricView>> {
  const [oa] = await db.select({ id: learningObjectives.id }).from(learningObjectives).where(eq(learningObjectives.id, objectiveId));
  if (!oa) return { ok: false, status: 404, reason: "Objetivo no encontrado" };
  const prev = await latestRubric(db, objectiveId, false);
  const id = randomUUID();
  // batch = una sola transacción atómica (db.transaction en libsql :memory: abre otra conexión).
  const [[created]] = await db.batch([
    db.insert(rubrics).values({
      id, learningObjectiveId: objectiveId, title: input.title, version: (prev?.version ?? 0) + 1, isPublished: input.publish,
    }).returning(),
    db.insert(rubricCriteria).values(input.criteria.map((c, i) => ({ rubricId: id, ...c, sortOrder: i }))),
  ]);
  return { ok: true, value: await withCriteria(db, created) };
}

// Admin: edita la última versión mientras sea borrador. Una versión publicada no se modifica
// (los estudiantes ya la vieron): se responde 409 y se debe crear una versión nueva con POST.
export async function updateDraftRubric(db: Db, objectiveId: string, input: RubricInput): Promise<Result<RubricView>> {
  const draft = await latestRubric(db, objectiveId, false);
  if (!draft) return { ok: false, status: 404, reason: "Este objetivo no tiene rúbrica; créala con POST" };
  if (draft.isPublished) {
    return { ok: false, status: 409, reason: "La última versión ya está publicada; crea una versión nueva con POST" };
  }
  // ponytail: chequeo de borrador fuera del batch; dos admins publicando a la vez podrían pisarse.
  // Si llega a importar, condicionar el batch con un trigger o columna de versión optimista.
  const [[updated]] = await db.batch([
    db.update(rubrics).set({ title: input.title, isPublished: input.publish })
      .where(eq(rubrics.id, draft.id)).returning(),
    db.delete(rubricCriteria).where(eq(rubricCriteria.rubricId, draft.id)),
    db.insert(rubricCriteria).values(input.criteria.map((c, i) => ({ rubricId: draft.id, ...c, sortOrder: i }))),
  ]);
  return { ok: true, value: await withCriteria(db, updated) };
}
