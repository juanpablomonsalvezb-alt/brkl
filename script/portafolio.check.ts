// Chequeo del portafolio de evidencias contra SQLite en memoria creada desde shared/schema.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "../shared/schema";
import { users } from "../shared/models/auth";
import {
  createEvidence, updateEvidence, deleteEvidence, listMyEvidences, listStudentEvidences, listEvidenceVersions,
} from "../server/portafolio";

const client = createClient({ url: ":memory:" });
const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
for (const stmt of ddl) await client.execute(stmt);
const db = drizzle(client, { schema });
const {
  levels, subjects, levelSubjects, enrollments, learningObjectives, moduleEvaluations, evaluationProgress,
  userProfiles, portfolioEvidenceVersions,
} = schema;

// est: estudiante matriculado en ls1; otro: estudiante en ls1; ajeno: sin matrícula en ls2; tutor; admin.
await db.insert(users).values(["est", "otro", "tutor", "admin"].map((id) => ({ id })));
await db.insert(levels).values([{ id: "7b", name: "7° Básico", programType: "menores", sortOrder: 1 }]);
await db.insert(subjects).values([{ id: "s1", name: "Matemática", slug: "matematica" }, { id: "s2", name: "Lenguaje", slug: "lenguaje" }]);
await db.insert(levelSubjects).values([{ id: "ls1", levelId: "7b", subjectId: "s1" }, { id: "ls2", levelId: "7b", subjectId: "s2" }]);
await db.insert(enrollments).values([{ userId: "est", levelSubjectId: "ls1" }, { userId: "otro", levelSubjectId: "ls1" }]);
await db.insert(learningObjectives).values([
  { id: "oa1", levelSubjectId: "ls1", code: "OA 1", title: "Enteros", weekNumber: 1 },
  { id: "oa2", levelSubjectId: "ls1", code: "OA 2", title: "Fracciones", weekNumber: 2 },
  { id: "oa-len", levelSubjectId: "ls2", code: "OA 1", title: "Lectura", weekNumber: 1 },
]);
await db.insert(moduleEvaluations).values([{ id: "e1", learningObjectiveId: "oa1", evaluationNumber: 1, title: "Mini 1", releaseWeek: 1 }]);
await db.insert(evaluationProgress).values([
  { id: "ep-est", userId: "est", evaluationId: "e1", passed: true, score: 85, answersJson: "[\"secreto\"]" },
  { id: "ep-otro", userId: "otro", evaluationId: "e1", passed: false, score: 30 },
]);
await db.insert(userProfiles).values([{ userId: "tutor", role: "tutor" }, { userId: "admin", role: "admin" }, { userId: "otro", role: "student" }]);

const texto = { kind: "texto", learningObjectiveId: "oa1", title: "Mi explicación", reflection: "Aprendí a restar", content: "−3 − 2 = −5" };
const denied = (r: { ok: boolean; status?: number }, status: number) => assert.deepEqual([r.ok, r.status], [false, status]);

// Crear: por defecto privada, versión 1.
const c1 = await createEvidence(db, "est", texto);
assert.ok(c1.ok);
const id = c1.value.id;
const [mine] = await listMyEvidences(db, "est");
assert.deepEqual([mine.visibility, mine.kind, mine.url], ["privada", "texto", null]);

// Validación: https, largos, visibilidad pública inexistente, campos ajenos, tipo desconocido.
denied(await createEvidence(db, "est", { ...texto, kind: "enlace", content: undefined, url: "http://ejemplo.cl" }), 400);
denied(await createEvidence(db, "est", { kind: "enlace", learningObjectiveId: "oa1", title: "x", url: "javascript:alert(1)" }), 400);
assert.ok((await createEvidence(db, "est", { kind: "enlace", learningObjectiveId: "oa1", title: "Video", url: "https://youtu.be/abc" })).ok);
denied(await createEvidence(db, "est", { ...texto, title: "x".repeat(121) }), 400);
denied(await createEvidence(db, "est", { ...texto, reflection: "x".repeat(601) }), 400);
denied(await createEvidence(db, "est", { ...texto, content: "x".repeat(5001) }), 400);
denied(await createEvidence(db, "est", { ...texto, title: "   " }), 400);
denied(await createEvidence(db, "est", { ...texto, visibility: "publica" }), 400);
denied(await createEvidence(db, "est", { ...texto, userId: "otro" }), 400);
denied(await createEvidence(db, "est", { ...texto, kind: "archivo" }), 400);

// Objetivo: inexistente 404; de asignatura no matriculada 403.
denied(await createEvidence(db, "est", { ...texto, learningObjectiveId: "nope" }), 404);
denied(await createEvidence(db, "est", { ...texto, learningObjectiveId: "oa-len" }), 403);

// Resultado de evaluación: propio y del mismo objetivo.
const evaluacion = { kind: "evaluacion", learningObjectiveId: "oa1", title: "Mi mini 1", evaluationProgressId: "ep-est", visibility: "tutor" };
const c2 = await createEvidence(db, "est", evaluacion);
assert.ok(c2.ok);
denied(await createEvidence(db, "est", { ...evaluacion, evaluationProgressId: "ep-otro" }), 404); // ajeno
denied(await createEvidence(db, "est", { ...evaluacion, learningObjectiveId: "oa2" }), 400); // otro objetivo

// Editar: otro estudiante no puede (404, no revela existencia); el dueño crea versión 2.
denied(await updateEvidence(db, "otro", id, { ...texto, title: "hackeado" }), 404);
const u1 = await updateEvidence(db, "est", id, { ...texto, content: "−3 − 2 = −5, porque…" });
assert.ok(u1.ok && u1.value.version === 2);
// Solo cambiar visibilidad no crea versión.
const u2 = await updateEvidence(db, "est", id, { ...texto, content: "−3 − 2 = −5, porque…", visibility: "familia" });
assert.ok(u2.ok && u2.value.version === 2);
denied(await updateEvidence(db, "est", id, { ...texto, learningObjectiveId: "oa-len" }), 403);

// Lectura por tutor/admin: solo lo compartido, sin respuestas de la evaluación.
const priv = await createEvidence(db, "est", { ...texto, title: "Borrador privado" });
assert.ok(priv.ok);
const t = await listStudentEvidences(db, "tutor", "est");
assert.ok(t.ok);
const titles = (t.value as any[]).map((e) => e.title).sort();
assert.deepEqual(titles, ["Mi explicación", "Mi mini 1"]);
const ev = (t.value as any[]).find((e) => e.kind === "evaluacion");
assert.deepEqual([ev.evaluationScore, ev.evaluationPassed, ev.evaluationTitle, "answersJson" in ev], [85, true, "Mini 1", false]);
assert.ok((await listStudentEvidences(db, "admin", "est")).ok);
denied(await listStudentEvidences(db, "otro", "est"), 403); // estudiante
denied(await listStudentEvidences(db, "sin-perfil", "est"), 403); // sin perfil = estudiante

// Historial: dueño y tutor (compartida) sí; tutor sobre privada, otro estudiante: 404.
const v = await listEvidenceVersions(db, "est", id);
assert.ok(v.ok && v.value.length === 2);
assert.ok((await listEvidenceVersions(db, "tutor", id)).ok);
denied(await listEvidenceVersions(db, "tutor", priv.value.id), 404);
denied(await listEvidenceVersions(db, "otro", id), 404);

// Borrado real: otro no puede; el dueño borra evidencia e historial.
denied(await deleteEvidence(db, "otro", id), 404);
assert.ok((await deleteEvidence(db, "est", id)).ok);
assert.equal((await db.select().from(portfolioEvidenceVersions)).filter((x) => x.evidenceId === id).length, 0);
assert.ok(!(await listMyEvidences(db, "est")).some((e) => e.id === id));
denied(await deleteEvidence(db, "est", id), 404);

console.log("portafolio: ok");
