// Chequeo del portal familia (solo lectura) contra SQLite en memoria creada desde shared/schema.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import { eq } from "drizzle-orm";
import * as schema from "../shared/schema";
import { listLinkedStudents, loadFamiliaResumen, guardianLinkInput, upsertGuardianLink } from "../server/familia";

const client = createClient({ url: ":memory:" });
const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
for (const stmt of ddl) await client.execute(stmt);
const db = drizzle(client, { schema });

const {
  users, levels, subjects, levelSubjects, enrollments, learningObjectives, weeklyResources,
  moduleEvaluations, evaluationProgress, studentProgress, userProfiles,
} = schema;

// g1 apoderado de est1; g2 apoderado sin vínculo; est2 otro estudiante; adm admin.
await db.insert(users).values([
  { id: "g1", name: "Apoderada Uno" }, { id: "g2" }, { id: "est1", firstName: "Ana", lastName: "Pérez" },
  { id: "est2", name: "Otro" }, { id: "adm" },
]);
await db.insert(userProfiles).values([{ userId: "adm", role: "admin" }, { userId: "est1", role: "student" }]);
await db.insert(levels).values([{ id: "7b", name: "7° Básico", programType: "menores", sortOrder: 1 }]);
await db.insert(subjects).values([{ id: "s-mat", name: "Matemática", slug: "matematica" }]);
await db.insert(levelSubjects).values([{ id: "ls1", levelId: "7b", subjectId: "s-mat" }]);
await db.insert(enrollments).values([{ userId: "est1", levelSubjectId: "ls1" }, { userId: "est2", levelSubjectId: "ls1" }]);
await db.insert(learningObjectives).values([{ id: "oa1", levelSubjectId: "ls1", code: "OA 1", title: "Enteros", weekNumber: 1 }]);
await db.insert(weeklyResources).values([
  { id: "r1", learningObjectiveId: "oa1", resourceType: "video", title: "Video", sortOrder: 0 },
  { id: "r2", learningObjectiveId: "oa1", resourceType: "audio", title: "Pódcast", sortOrder: 1 },
]);
await db.insert(moduleEvaluations).values([
  { id: "e1", learningObjectiveId: "oa1", evaluationNumber: 1, title: "Mini evaluación 1", releaseWeek: 1 },
  { id: "e2", learningObjectiveId: "oa1", evaluationNumber: 2, title: "Cierre", releaseWeek: 1 },
]);

// 15 de junio 2026, mediodía en Chile.
const now = new Date("2026-06-15T16:00:00Z");
await db.insert(studentProgress).values([
  { userId: "est1", resourceId: "r1", completedAt: new Date("2026-06-02T15:00:00Z") },
  { userId: "est1", resourceId: "r2", completedAt: new Date("2026-06-02T20:00:00Z") }, // mismo día
  { userId: "est1", resourceId: "r2", completedAt: new Date("2026-05-20T15:00:00Z") }, // mes anterior
  // 1 jun 02:00 UTC = 31 may 22:00 en Santiago: no cuenta para junio.
  { userId: "est1", resourceId: "r1", completedAt: new Date("2026-06-01T02:00:00Z") },
  { userId: "est2", resourceId: "r1", completedAt: new Date("2026-06-10T15:00:00Z") }, // otro estudiante
]);
await db.insert(evaluationProgress).values([
  // e1: dos intentos, el segundo aprobado → no está en revisión.
  { userId: "est1", evaluationId: "e1", passed: false, score: 40, answersJson: "[\"SECRETO\"]", completedAt: new Date("2026-06-05T15:00:00Z") },
  { userId: "est1", evaluationId: "e1", passed: true, score: 90, answersJson: "[\"SECRETO\"]", completedAt: new Date("2026-06-06T15:00:00Z") },
  // e2: rendida sin aprobar → en revisión.
  { userId: "est1", evaluationId: "e2", passed: false, score: 30, answersJson: "[\"SECRETO\"]", completedAt: new Date("2026-06-08T15:00:00Z") },
  { userId: "est2", evaluationId: "e2", passed: false, answersJson: "[\"OTRO\"]", completedAt: new Date("2026-06-09T15:00:00Z") },
]);

// Registro guardado con el DEFAULT de la columna (milisegundos, 12 jun en Chile), como hace markResourceCompleteOnce.
await client.execute({ sql: "insert into student_progress (id, user_id, resource_id, completed_at) values ('ms1', 'est1', 'r1', ?)", args: [Date.parse("2026-06-12T15:00:00Z")] });

// Validación zod del endpoint admin.
assert.equal(guardianLinkInput.safeParse({ guardianUserId: "g1", studentUserId: "g1" }).success, false);
assert.equal(guardianLinkInput.safeParse({ guardianUserId: "g1", studentUserId: "est1", status: "borrado" }).success, false);
assert.equal(guardianLinkInput.safeParse({ guardianUserId: "g1", studentUserId: "est1", extra: 1 }).success, false);
assert.equal(guardianLinkInput.parse({ guardianUserId: "g1", studentUserId: "est1" }).status, "activo");

// Usuario inexistente → 404, sin crear vínculo.
const missing = await upsertGuardianLink(db, { guardianUserId: "g1", studentUserId: "nadie", status: "activo" }, "adm");
assert.deepEqual([missing.ok, !missing.ok && missing.status], [false, 404]);

// Vínculo pendiente: todavía sin acceso.
const pend = await upsertGuardianLink(db, { guardianUserId: "g1", studentUserId: "est1", status: "pendiente" }, "adm");
assert.equal(pend.ok && pend.link.status, "pendiente");
assert.deepEqual(await listLinkedStudents(db, "g1"), []);
assert.equal(await loadFamiliaResumen(db, "g1", "est1", now), null);
// Se asigna rol guardian al apoderado sin perfil.
const [gp] = await db.select().from(userProfiles).where(eq(userProfiles.userId, "g1"));
assert.equal(gp.role, "guardian");

// Activar el mismo par actualiza (no duplica).
const act = await upsertGuardianLink(db, { guardianUserId: "g1", studentUserId: "est1", status: "activo" }, "adm");
assert.ok(act.ok && pend.ok && act.link.id === pend.link.id);
assert.equal((await db.select().from(schema.guardianLinks)).length, 1);
assert.deepEqual(await listLinkedStudents(db, "g1"), [{ studentUserId: "est1", name: "Ana Pérez" }]);

// Nunca degrada el rol de un perfil existente (admin como apoderado).
await upsertGuardianLink(db, { guardianUserId: "adm", studentUserId: "est2", status: "pendiente" }, "adm");
const [ap] = await db.select().from(userProfiles).where(eq(userProfiles.userId, "adm"));
assert.equal(ap.role, "admin");

// Resumen del estudiante vinculado.
const r = await loadFamiliaResumen(db, "g1", "est1", now);
assert.ok(r);
assert.equal(r.student.studentUserId, "est1");
assert.equal(r.overview.level?.id, "7b");
assert.deepEqual([r.overview.totals.completedItems, r.overview.totals.totalItems], [3, 4]); // r1, r2, e1
assert.equal(r.month, "2026-06");
// Días en junio (Santiago): 2, 5, 6, 8, 12 → 5.
assert.equal(r.studyDays, 5);
assert.deepEqual(r.evaluationsInReview.map((e) => [e.title, e.subjectName]), [["Cierre", "Matemática"]]);
// Nunca expone respuestas ni puntajes.
const json = JSON.stringify(r);
assert.ok(!json.includes("SECRETO") && !json.includes("OTRO"));
assert.ok(!/answersJson|"score"|totalCorrect/.test(json));

// Acceso denegado: apoderado sin vínculo, estudiante ajeno, estudiante inexistente, el propio estudiante.
assert.equal(await loadFamiliaResumen(db, "g2", "est1", now), null);
assert.equal(await loadFamiliaResumen(db, "g1", "est2", now), null);
assert.equal(await loadFamiliaResumen(db, "g1", "nadie", now), null);
assert.equal(await loadFamiliaResumen(db, "est1", "est1", now), null);
assert.equal(await loadFamiliaResumen(db, "adm", "est2", now), null); // pendiente
assert.deepEqual(await listLinkedStudents(db, "g2"), []);

// Volver a pendiente revoca el acceso.
await upsertGuardianLink(db, { guardianUserId: "g1", studentUserId: "est1", status: "pendiente" }, "adm");
assert.equal(await loadFamiliaResumen(db, "g1", "est1", now), null);

console.log("familia: ok");
