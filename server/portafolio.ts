// Vórtice · Portafolio de evidencias. Recibe la conexión como parámetro para probarse en memoria.
// Permisos:
//   - El estudiante crea, edita, lista y borra (borrado real, con su historial) solo sus evidencias.
//   - Tutor y admin (user_profiles.role) leen las de un estudiante solo si la visibilidad no es "privada".
//   - "familia": aún no hay rol ni vínculo apoderado–estudiante, así que hoy la leen tutor y admin.
//     ponytail: lectura por familia pendiente hasta que exista ese vínculo (tabla apoderado→estudiante).
//   - ponytail: no hay asignación tutor→estudiante; cualquier tutor lee lo compartido. Restringir al crear esa tabla.
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, max } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { z } from "zod";
import * as schema from "@shared/schema";
import {
  portfolioEvidences, portfolioEvidenceVersions, learningObjectives, evaluationProgress,
  moduleEvaluations, userProfiles,
} from "@shared/schema";
import { hasActiveEnrollment } from "./vortice";

type Db = LibSQLDatabase<typeof schema>;
export type PortafolioResult<T> = { ok: true; value: T } | { ok: false; status: 400 | 403 | 404; reason: string };

const httpsUrl = z.string().trim().max(2048).refine((u) => {
  try {
    return new URL(u).protocol === "https:";
  } catch {
    return false;
  }
}, "Solo se aceptan enlaces https");

const base = {
  learningObjectiveId: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(120),
  reflection: z.string().trim().max(600).default(""),
  visibility: z.enum(["privada", "tutor", "familia"]).default("privada"),
};

// .strict(): rechaza campos ajenos (userId, visibility "publica" no existe en el enum).
export const evidenceInputSchema = z.discriminatedUnion("kind", [
  z.object({ ...base, kind: z.literal("texto"), content: z.string().trim().min(1).max(5000) }).strict(),
  z.object({ ...base, kind: z.literal("enlace"), url: httpsUrl }).strict(),
  z.object({ ...base, kind: z.literal("evaluacion"), evaluationProgressId: z.string().min(1).max(64) }).strict(),
]);
export type EvidenceInput = z.infer<typeof evidenceInputSchema>;

const fail = (status: 400 | 403 | 404, reason: string) => ({ ok: false as const, status, reason });

// Valida forma, matrícula en la asignatura del objetivo y que el resultado de evaluación sea propio y del mismo objetivo.
async function prepare(db: Db, userId: string, raw: unknown) {
  const parsed = evidenceInputSchema.safeParse(raw);
  if (!parsed.success) return fail(400, parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "));
  const input = parsed.data;

  const [oa] = await db.select({ levelSubjectId: learningObjectives.levelSubjectId })
    .from(learningObjectives).where(eq(learningObjectives.id, input.learningObjectiveId));
  if (!oa) return fail(404, "Objetivo no encontrado");
  if (!(await hasActiveEnrollment(db, userId, oa.levelSubjectId))) {
    return fail(403, "No tienes matrícula activa en la asignatura de este objetivo");
  }

  if (input.kind === "evaluacion") {
    const [ep] = await db.select({ learningObjectiveId: moduleEvaluations.learningObjectiveId })
      .from(evaluationProgress)
      .innerJoin(moduleEvaluations, eq(evaluationProgress.evaluationId, moduleEvaluations.id))
      .where(and(eq(evaluationProgress.id, input.evaluationProgressId), eq(evaluationProgress.userId, userId)));
    if (!ep) return fail(404, "Resultado de evaluación no encontrado");
    if (ep.learningObjectiveId !== input.learningObjectiveId) return fail(400, "El resultado no corresponde a este objetivo");
  }

  return {
    ok: true as const,
    visibility: input.visibility,
    fields: {
      learningObjectiveId: input.learningObjectiveId,
      kind: input.kind,
      title: input.title,
      reflection: input.reflection,
      content: input.kind === "texto" ? input.content : null,
      url: input.kind === "enlace" ? input.url : null,
      evaluationProgressId: input.kind === "evaluacion" ? input.evaluationProgressId : null,
    },
  };
}

function versionRow(evidenceId: string, version: number, f: Awaited<ReturnType<typeof prepare>> & { ok: true }) {
  const { learningObjectiveId: _oa, ...rest } = f.fields;
  return { evidenceId, version, ...rest };
}

// Lectura con el resumen del resultado de evaluación (sin respuestas), para dueño y lectores autorizados.
function selectEvidences(db: Db) {
  return db.select({
    id: portfolioEvidences.id,
    userId: portfolioEvidences.userId,
    learningObjectiveId: portfolioEvidences.learningObjectiveId,
    kind: portfolioEvidences.kind,
    title: portfolioEvidences.title,
    reflection: portfolioEvidences.reflection,
    content: portfolioEvidences.content,
    url: portfolioEvidences.url,
    evaluationProgressId: portfolioEvidences.evaluationProgressId,
    visibility: portfolioEvidences.visibility,
    createdAt: portfolioEvidences.createdAt,
    updatedAt: portfolioEvidences.updatedAt,
    evaluationTitle: moduleEvaluations.title,
    evaluationScore: evaluationProgress.score,
    evaluationPassed: evaluationProgress.passed,
  })
    .from(portfolioEvidences)
    .leftJoin(evaluationProgress, eq(portfolioEvidences.evaluationProgressId, evaluationProgress.id))
    .leftJoin(moduleEvaluations, eq(evaluationProgress.evaluationId, moduleEvaluations.id));
}

async function ownEvidence(db: Db, userId: string, id: string) {
  const [row] = await db.select().from(portfolioEvidences)
    .where(and(eq(portfolioEvidences.id, id), eq(portfolioEvidences.userId, userId)));
  return row;
}

async function viewerRole(db: Db, viewerId: string) {
  const [p] = await db.select({ role: userProfiles.role }).from(userProfiles).where(eq(userProfiles.userId, viewerId));
  return p?.role ?? "student";
}

const SHARED = ["tutor", "familia"] as const;

export async function listMyEvidences(db: Db, userId: string) {
  return selectEvidences(db).where(eq(portfolioEvidences.userId, userId)).orderBy(desc(portfolioEvidences.createdAt));
}

export async function createEvidence(db: Db, userId: string, raw: unknown): Promise<PortafolioResult<{ id: string }>> {
  const p = await prepare(db, userId, raw);
  if (!p.ok) return p;
  const id = randomUUID();
  await db.batch([
    db.insert(portfolioEvidences).values({ id, userId, visibility: p.visibility, ...p.fields }),
    db.insert(portfolioEvidenceVersions).values(versionRow(id, 1, p)),
  ]);
  return { ok: true, value: { id } };
}

export async function updateEvidence(db: Db, userId: string, id: string, raw: unknown): Promise<PortafolioResult<{ id: string; version: number }>> {
  const current = await ownEvidence(db, userId, id);
  if (!current) return fail(404, "Evidencia no encontrada");
  const p = await prepare(db, userId, raw);
  if (!p.ok) return p;

  const [{ last }] = await db.select({ last: max(portfolioEvidenceVersions.version) })
    .from(portfolioEvidenceVersions).where(eq(portfolioEvidenceVersions.evidenceId, id));
  // Cambiar solo la visibilidad no es una mejora del trabajo: no crea versión.
  const changed = (Object.keys(p.fields) as (keyof typeof p.fields)[]).some((k) => p.fields[k] !== current[k]);
  const version = changed ? (last ?? 0) + 1 : (last ?? 1);

  const update = db.update(portfolioEvidences)
    .set({ ...p.fields, visibility: p.visibility, updatedAt: new Date() })
    .where(and(eq(portfolioEvidences.id, id), eq(portfolioEvidences.userId, userId)));
  if (changed) await db.batch([update, db.insert(portfolioEvidenceVersions).values(versionRow(id, version, p))]);
  else await update;
  return { ok: true, value: { id, version } };
}

// Borrado real a pedido del estudiante: evidencia e historial, en un solo lote atómico.
export async function deleteEvidence(db: Db, userId: string, id: string): Promise<PortafolioResult<{ id: string }>> {
  if (!(await ownEvidence(db, userId, id))) return fail(404, "Evidencia no encontrada");
  await db.batch([
    db.delete(portfolioEvidenceVersions).where(eq(portfolioEvidenceVersions.evidenceId, id)),
    db.delete(portfolioEvidences).where(and(eq(portfolioEvidences.id, id), eq(portfolioEvidences.userId, userId))),
  ]);
  return { ok: true, value: { id } };
}

// Tutor/admin: evidencias compartidas de un estudiante. Lo privado nunca sale.
export async function listStudentEvidences(db: Db, viewerId: string, studentId: string): Promise<PortafolioResult<unknown[]>> {
  const role = await viewerRole(db, viewerId);
  if (role !== "tutor" && role !== "admin") return fail(403, "Solo tutores y administración");
  const rows = await selectEvidences(db)
    .where(and(eq(portfolioEvidences.userId, studentId), inArray(portfolioEvidences.visibility, [...SHARED])))
    .orderBy(desc(portfolioEvidences.createdAt));
  return { ok: true, value: rows };
}

// Historial de mejora: el dueño siempre; tutor/admin si la evidencia está compartida. Si no, 404 (no revela existencia).
export async function listEvidenceVersions(db: Db, viewerId: string, id: string): Promise<PortafolioResult<unknown[]>> {
  const [ev] = await db.select({ userId: portfolioEvidences.userId, visibility: portfolioEvidences.visibility })
    .from(portfolioEvidences).where(eq(portfolioEvidences.id, id));
  const allowed = ev && (ev.userId === viewerId
    || (ev.visibility !== "privada" && ["tutor", "admin"].includes(await viewerRole(db, viewerId))));
  if (!allowed) return fail(404, "Evidencia no encontrada");
  const rows = await db.select().from(portfolioEvidenceVersions)
    .where(eq(portfolioEvidenceVersions.evidenceId, id)).orderBy(portfolioEvidenceVersions.version);
  return { ok: true, value: rows };
}
