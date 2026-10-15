// Chequeo de loadVorticeOverview contra una base SQLite en memoria creada desde shared/schema.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "../shared/schema";
import { users } from "../shared/models/auth";
import { loadVorticeOverview } from "../server/vortice";

const client = createClient({ url: ":memory:" });
const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
for (const stmt of ddl) await client.execute(stmt);
const db = drizzle(client, { schema });

const {
  levels, subjects, levelSubjects, enrollments, learningObjectives, weeklyResources,
  moduleEvaluations, evaluationProgress, studentProgress, userProfiles,
} = schema;

await db.insert(users).values([{ id: "u1" }, { id: "u2" }, { id: "u3" }]);
await db.insert(levels).values([
  { id: "7b", name: "7° Básico", programType: "menores", sortOrder: 1 },
  { id: "1m", name: "1° Medio", programType: "menores", sortOrder: 3 },
]);
await db.insert(subjects).values([{ id: "s-mat", name: "Matemática", slug: "matematica" }]);
await db.insert(levelSubjects).values([{ id: "ls1", levelId: "7b", subjectId: "s-mat" }]);
await db.insert(enrollments).values([
  { userId: "u1", levelSubjectId: "ls1" },
  { userId: "u2", levelSubjectId: "ls1", isActive: false }, // matrícula inactiva: no cuenta
]);
await db.insert(userProfiles).values([{ userId: "u3", levelId: "1m" }]);
await db.insert(learningObjectives).values([
  { id: "oa1", levelSubjectId: "ls1", code: "OA 1", title: "Números enteros", weekNumber: 1 },
  { id: "oa2", levelSubjectId: "ls1", code: "OA 2", title: "Fracciones", weekNumber: 2 },
]);
await db.insert(weeklyResources).values([
  { id: "r1", learningObjectiveId: "oa1", resourceType: "video", title: "Video OA1", sortOrder: 0 },
  { id: "r2", learningObjectiveId: "oa1", resourceType: "audio", title: "Pódcast OA1", sortOrder: 1 },
  { id: "r3", learningObjectiveId: "oa2", resourceType: "video", title: "Video OA2", sortOrder: 0 },
  { id: "rx", learningObjectiveId: "oa2", resourceType: "video", title: "Inactivo", sortOrder: 1, isActive: false },
]);
await db.insert(moduleEvaluations).values([
  { id: "e1", learningObjectiveId: "oa1", evaluationNumber: 1, title: "Mini evaluación 1", releaseWeek: 1 },
  // Evaluación 2 marcada opcional: igual es un paso, porque aprobarla completa el módulo y abre el siguiente.
  { id: "e2", learningObjectiveId: "oa1", evaluationNumber: 2, title: "Cierre de módulo", releaseWeek: 1, isRequired: false },
  { id: "e3", learningObjectiveId: "oa1", evaluationNumber: 3, title: "Opcional", releaseWeek: 2, isRequired: false },
]);
await db.insert(studentProgress).values([{ userId: "u1", resourceId: "r1" }, { userId: "u1", resourceId: "r2" }]);

// Fecha posterior a la liberación de la evaluación 1 del módulo 1 (calendario 2026).
const despues = new Date(2026, 5, 1);
const antes = new Date(2026, 0, 1);

const o = await loadVorticeOverview(db, "u1", despues);
assert.deepEqual(o.level, { id: "7b", name: "7° Básico" });
assert.equal(o.track, "basica-5-8");
assert.equal(o.subjects.length, 1);
// r1, r2, r3 + e1 + e2 (rx inactivo y e3 opcional quedan fuera).
assert.deepEqual([o.subjects[0].completedItems, o.subjects[0].totalItems], [2, 5]);
assert.deepEqual([o.nextStep?.kind, o.nextStep?.itemId], ["evaluation", "e1"]);

// Antes del inicio del programa todo está cerrado: sin siguiente paso, esperando calendario.
const temprano = await loadVorticeOverview(db, "u1", antes);
assert.equal(temprano.nextStep, null);
assert.equal(temprano.subjects[0].waitingForRelease, true);

// Aprobada la evaluación 1, el siguiente paso es la evaluación 2, que cierra el módulo 1.
await db.insert(evaluationProgress).values([{ userId: "u1", evaluationId: "e1", passed: true, score: 80 }]);
assert.equal((await loadVorticeOverview(db, "u1", despues)).nextStep?.itemId, "e2");

// Aprobada la evaluación 2, se abre el módulo 2.
await db.insert(evaluationProgress).values([{ userId: "u1", evaluationId: "e2", passed: true, score: 90 }]);
assert.equal((await loadVorticeOverview(db, "u1", despues)).nextStep?.itemId, "r3");

// Matrícula inactiva: sin asignaturas ni nivel.
const inactivo = await loadVorticeOverview(db, "u2", despues);
assert.deepEqual([inactivo.subjects.length, inactivo.level, inactivo.track], [0, null, null]);

// Sin matrícula pero con nivel en el perfil: se conoce el tramo.
const soloPerfil = await loadVorticeOverview(db, "u3", despues);
assert.deepEqual([soloPerfil.level?.id, soloPerfil.track], ["1m", "media"]);

console.log("vortice-db: ok");
