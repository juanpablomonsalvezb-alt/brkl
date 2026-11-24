// Pruebas de atención y notificaciones contra SQLite en memoria.
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "../shared/schema";
import { users } from "../shared/models/auth";
import { despacharNotificaciones, type Correo } from "../server/notificaciones";
import { diasSinActividadDe, inicioMedicion, ultimaActividad } from "../server/atencion";
import { getModuleStartDate } from "../server/calendarUtils";

const client = createClient({ url: ":memory:" });
const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
for (const stmt of ddl) await client.execute(stmt);
const db = drizzle(client, { schema });
const {
  levels, subjects, levelSubjects, enrollments, learningObjectives, weeklyResources, studentProgress, guardianLinks,
  learningEvents, lessonStudyProgress, moduleEvaluations, evaluationProgress, reflectionResponses, portfolioEvidences, programCalendar,
} = schema;

await db.insert(users).values([
  { id: "tres-dias", email: "tres@example.test" },
  { id: "dos-dias", email: "dos@example.test" },
  { id: "cinco-activo", email: "cinco-activo@example.test" },
  { id: "cinco-pendiente", email: "cinco-pendiente@example.test" },
  { id: "hoy", email: "hoy@example.test" },
  { id: "apo-activo", email: "apo-activo@example.test" },
  { id: "apo-pendiente", email: "apo-pendiente@example.test" },
  { id: "sin-actividad" },
  { id: "ajeno" },
  { id: "actividad" },
  { id: "matricula-tardia" },
  { id: "calendario-tarde" },
  { id: "inicio-futuro" },
  { id: "matricula-inactiva" },
]);
await db.insert(levels).values([
  { id: "7b", name: "7° Básico", programType: "menores", sortOrder: 1 },
  { id: "8b", name: "8° Básico", programType: "menores", sortOrder: 2 },
]);
await db.insert(subjects).values([{ id: "mat", name: "Matemática", slug: "matematica" }]);
await db.insert(levelSubjects).values([
  { id: "ls", levelId: "7b", subjectId: "mat" },
  { id: "ls8b", levelId: "8b", subjectId: "mat" },
]);
await db.insert(enrollments).values(["tres-dias", "dos-dias", "cinco-activo", "cinco-pendiente", "hoy"].map((userId) => ({
  userId, levelSubjectId: "ls", enrolledAt: new Date("2026-03-09T15:00:00Z"), isActive: true,
})));
await db.insert(learningObjectives).values([{ id: "oa", levelSubjectId: "ls", code: "OA 1", title: "Números", weekNumber: 1 }]);
await db.insert(weeklyResources).values([{ id: "recurso", learningObjectiveId: "oa", resourceType: "video", title: "Video", sortOrder: 0 }]);
await db.insert(moduleEvaluations).values([{ id: "evaluacion", learningObjectiveId: "oa", evaluationNumber: 1, title: "Evaluación", releaseWeek: 1 }]);
await db.insert(studentProgress).values([
  { userId: "tres-dias", resourceId: "recurso", completedAt: new Date("2026-03-15T15:00:00Z") },
  { userId: "dos-dias", resourceId: "recurso", completedAt: new Date("2026-03-16T15:00:00Z") },
  { userId: "cinco-activo", resourceId: "recurso", completedAt: new Date("2026-03-13T15:00:00Z") },
  { userId: "cinco-pendiente", resourceId: "recurso", completedAt: new Date("2026-03-13T15:00:00Z") },
  { userId: "hoy", resourceId: "recurso", completedAt: new Date("2026-03-18T15:00:00Z") },
]);
await db.insert(guardianLinks).values([
  { guardianUserId: "apo-activo", studentUserId: "cinco-activo", status: "activo" },
  { guardianUserId: "apo-pendiente", studentUserId: "cinco-pendiente", status: "pendiente" },
]);

assert.equal(await ultimaActividad(db, "sin-actividad"), null, "sin actividad devuelve null");
assert.equal(await ultimaActividad(db, "ajeno"), null, "la actividad de otra persona no cuenta");
const fechasFuentes = [
  new Date("2026-03-10T15:00:00Z"),
  new Date("2026-03-11T15:00:00Z"),
  new Date("2026-03-12T15:00:00Z"),
  new Date("2026-03-13T15:00:00Z"),
  new Date("2026-03-14T15:00:00Z"),
  new Date("2026-03-15T15:00:00Z"),
];
await db.insert(learningEvents).values({
  userId: "actividad", tipo: "recurso_abierto", referencia: "recurso", levelSubjectId: "ls", createdAt: fechasFuentes[0],
});
assert.equal((await ultimaActividad(db, "actividad"))?.getTime(), fechasFuentes[0].getTime(), "learning_events cuenta como actividad");
await db.insert(studentProgress).values({ userId: "actividad", resourceId: "recurso", completedAt: fechasFuentes[1] });
assert.equal((await ultimaActividad(db, "actividad"))?.getTime(), fechasFuentes[1].getTime(), "student_progress cuenta como actividad");
await db.insert(lessonStudyProgress).values({ userId: "actividad", oaId: "oa", updatedAt: fechasFuentes[2] });
assert.equal((await ultimaActividad(db, "actividad"))?.getTime(), fechasFuentes[2].getTime(), "lesson_study_progress cuenta como actividad");
await db.insert(evaluationProgress).values({ userId: "actividad", evaluationId: "evaluacion", completedAt: fechasFuentes[3] });
assert.equal((await ultimaActividad(db, "actividad"))?.getTime(), fechasFuentes[3].getTime(), "evaluation_progress cuenta como actividad");
await db.insert(reflectionResponses).values({ userId: "actividad", resourceId: "recurso", answersJson: "[]", updatedAt: fechasFuentes[4] });
assert.equal((await ultimaActividad(db, "actividad"))?.getTime(), fechasFuentes[4].getTime(), "reflection_responses cuenta como actividad");
await db.insert(portfolioEvidences).values({
  userId: "actividad", learningObjectiveId: "oa", kind: "texto", title: "Evidencia", updatedAt: fechasFuentes[5],
});
assert.equal((await ultimaActividad(db, "actividad"))?.getTime(), fechasFuentes[5].getTime(), "portfolio_evidences cuenta como actividad");
await db.insert(learningEvents).values({
  userId: "ajeno", tipo: "recurso_abierto", referencia: "recurso", levelSubjectId: "ls", createdAt: new Date("2026-03-30T15:00:00Z"),
});
assert.equal((await ultimaActividad(db, "actividad"))?.getTime(), fechasFuentes[5].getTime(), "actividad de otro usuario no altera el máximo");
assert.equal(await diasSinActividadDe(db, "actividad", new Date("2026-03-20T15:00:00Z")), 5);

await db.insert(enrollments).values([
  { userId: "matricula-tardia", levelSubjectId: "ls", enrolledAt: new Date("2026-03-12T15:00:00Z"), isActive: true },
  { userId: "calendario-tarde", levelSubjectId: "ls", enrolledAt: new Date("2026-03-01T15:00:00Z"), isActive: true },
  { userId: "inicio-futuro", levelSubjectId: "ls8b", enrolledAt: new Date("2026-03-01T15:00:00Z"), isActive: true },
  { userId: "matricula-inactiva", levelSubjectId: "ls", enrolledAt: new Date("2026-03-09T15:00:00Z"), isActive: false },
  { userId: "matricula-inactiva", levelSubjectId: "ls8b", enrolledAt: new Date("2026-03-12T15:00:00Z"), isActive: true },
]);
await db.insert(programCalendar).values({
  academicYear: 2026, levelId: "8b", startDate: new Date("2026-04-20T04:00:00Z"),
});
const abril = new Date("2026-04-10T15:00:00Z");
assert.equal((await inicioMedicion(db, "matricula-tardia", abril))?.toISOString(), "2026-03-12T15:00:00.000Z", "la matrícula posterior gana");
assert.equal((await inicioMedicion(db, "calendario-tarde", abril))?.getTime(), getModuleStartDate(1).getTime(), "el calendario posterior gana");
assert.equal((await inicioMedicion(db, "matricula-inactiva", new Date("2026-05-10T15:00:00Z")))?.getTime(), new Date("2026-04-20T04:00:00Z").getTime(), "la matrícula inactiva no cuenta");
assert.equal(await inicioMedicion(db, "inicio-futuro", abril), null, "no se mide antes del inicio futuro");

const ahora = new Date("2026-03-18T15:00:00Z");
let correos: Correo[] = [];
const transporte = async (correo: Correo) => { correos.push(correo); };
await despacharNotificaciones(db, transporte, ahora);

const destinatarios = () => correos.map((c) => c.para).sort();
assert.deepEqual(destinatarios(), [
  "apo-activo@example.test",
  "cinco-activo@example.test",
  "cinco-pendiente@example.test",
  "tres@example.test",
].sort(), "el servidor debe avisar a los 3/5 días y solo al apoderado activo");
assert.equal(correos.some((c) => c.para === "dos@example.test"), false, "no debe avisar con 2 días");
assert.equal(correos.some((c) => c.para === "apo-pendiente@example.test"), false, "no debe avisar al vínculo pendiente");
assert.equal(correos.some((c) => c.para === "hoy@example.test"), false, "no debe avisar con actividad de hoy");

correos = [];
await despacharNotificaciones(db, transporte, ahora);
assert.equal(correos.length, 0, "un segundo despacho de la misma semana no debe reenviar avisos");

console.log("atencion-servidor: ok");