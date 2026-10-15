// Chequeo de loadVorticeOverview contra una base SQLite en memoria creada desde shared/schema.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "../shared/schema";
import { users } from "../shared/models/auth";
import { loadVorticeOverview } from "../server/vortice";
import { applyBasica, planBasica } from "../server/seedBasica";
import fs from "node:fs";

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

// Estructura de 1° a 6° Básico desde el temario MINEDUC: simulación no escribe, aplicar es idempotente.
const plan = planBasica(JSON.parse(fs.readFileSync("scripts/data/mineduc-temarios-manifest.json", "utf8")));
assert.equal(plan.levels.length, 6);
assert.ok(!plan.levelSubjects.some((ls) => ls.subjectSlug === "fisica"));
const simulado = await applyBasica(db, plan, false);
assert.equal((await db.select().from(levels)).length, 2);
assert.equal(simulado.levelSubjectsAdded.length, 24); // 6 cursos × 4 asignaturas
const primera = await applyBasica(db, plan, true);
assert.deepEqual(primera.levelsAdded, ["1b", "2b", "3b", "4b", "5b", "6b"]);
assert.ok(!primera.subjectsAdded.includes("matematica")); // reutiliza la existente
assert.equal((await db.select().from(levelSubjects)).length, 1 + 24);
const segunda = await applyBasica(db, plan, true);
assert.deepEqual([segunda.levelsAdded, segunda.subjectsAdded, segunda.levelSubjectsAdded], [[], [], []]);
assert.equal((await db.select().from(levelSubjects)).length, 1 + 24);
// El tramo del nuevo nivel queda listo para su dashboard.
await db.insert(userProfiles).values([{ userId: "u2", levelId: "2b" }]);
assert.equal((await loadVorticeOverview(db, "u2", despues)).track, "basica-1-4");

console.log("vortice-db: ok");

// Acceso: matrícula, calendario y cierre del módulo anterior.
const { checkResourceAccess, checkEvaluationAccess, markResourceCompleteOnce } = await import("../server/vortice");
assert.equal((await checkResourceAccess(db, "u1", "r1", despues)).ok, true);
assert.deepEqual(await checkResourceAccess(db, "u1", "rx", despues), { ok: false, status: 404, reason: "Recurso no encontrado" });
assert.equal((await checkResourceAccess(db, "u2", "r1", despues)).ok, false); // matrícula inactiva
assert.equal((await checkResourceAccess(db, "u1", "r1", antes)).ok, false); // antes del inicio
assert.equal((await checkEvaluationAccess(db, "u1", "e1", despues)).ok, true);
assert.equal((await checkEvaluationAccess(db, "u1", "e1", antes)).ok, false);
assert.equal((await checkEvaluationAccess(db, "u1", "nope", despues)).ok, false);
// Módulo 2: abierto para u1 (aprobó e2); cerrado para u4, matriculado pero sin cerrar el módulo 1.
await db.insert(users).values([{ id: "u4" }]);
await db.insert(enrollments).values([{ userId: "u4", levelSubjectId: "ls1" }]);
assert.equal((await checkResourceAccess(db, "u1", "r3", despues)).ok, true);
assert.equal((await checkResourceAccess(db, "u4", "r3", despues)).ok, false);
// Marcar dos veces no duplica.
const a1 = await markResourceCompleteOnce(db, "u4", "r1");
const a2 = await markResourceCompleteOnce(db, "u4", "r1");
assert.equal(a1.id, a2.id);
console.log("vortice-access: ok");

// Retención: presencia de Together (> 1 hora) y eventos de embudo (> 12 meses). Idempotente.
const { purgarPresenciaVieja, purgarEventosEmbudoViejos } = await import("../server/retencion");
const { togetherPresence, funnelEvents } = schema;
const ahora = new Date(2026, 9, 15, 12, 0, 0);
assert.ok(!("email" in togetherPresence), "together_presence no debe guardar email");
await db.insert(togetherPresence).values([
  { clientId: "activo-1", displayName: "Ana", lastSeen: new Date(ahora.getTime() - 20_000) },
  { clientId: "reciente", displayName: "Beto", lastSeen: new Date(ahora.getTime() - 59 * 60_000) },
  { clientId: "viejo-01", displayName: "Caro", lastSeen: new Date(ahora.getTime() - 2 * 3600_000) },
]);
assert.equal(await purgarPresenciaVieja(db, ahora), 1);
assert.equal(await purgarPresenciaVieja(db, ahora), 0);
assert.deepEqual((await db.select().from(togetherPresence)).map((r) => r.clientId).sort(), ["activo-1", "reciente"]);
await db.insert(funnelEvents).values([
  { step: "llega_pagina", createdAt: new Date(2026, 8, 1) },
  { step: "llega_pagina", createdAt: new Date(2025, 10, 1) }, // 11,5 meses: se queda
  { step: "ve_formulario", createdAt: new Date(2025, 8, 1) }, // 13,5 meses: se borra
]);
assert.equal(await purgarEventosEmbudoViejos(db, ahora), 1);
assert.equal(await purgarEventosEmbudoViejos(db, ahora), 0);
assert.equal((await db.select().from(funnelEvents)).length, 2);
console.log("retencion: ok");
