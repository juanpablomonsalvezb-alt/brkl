// Chequeo de tutoría como caso y del guard de autenticación sin login configurado.
// Base SQLite en memoria creada desde shared/schema. Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import express from "express";
import * as schema from "../shared/schema";
import {
  crearCaso, casosDelEstudiante, casosDelTutor, casosParaAdmin, asignarCaso, responderCaso, cerrarCaso, MAX_OPEN_CASES,
} from "../server/tutoria";

// --- 500 de GET /api/reservations: sin setupAuth passport no agrega req.isAuthenticated. ---
// server/db.ts abre la base al importarse: se apunta a memoria para no tocar db.sqlite.
process.env.NODE_ENV = "production";
process.env.TURSO_DATABASE_URL = ":memory:";
const { isAuthenticated } = await import("../server/replit_integrations/auth/replitAuth");
const app = express();
app.get("/protegida", isAuthenticated, (_req, res) => { res.json({ ok: true }); });
const server = app.listen(0);
const port = (server.address() as { port: number }).port;
const resp = await fetch(`http://127.0.0.1:${port}/protegida`);
server.close();
assert.equal(resp.status, 401); // antes: 500 "req.isAuthenticated is not a function"
console.log("auth-sin-login: ok");

// --- Tutoría ---
const client = createClient({ url: ":memory:" });
const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
for (const stmt of ddl) await client.execute(stmt);
const db = drizzle(client, { schema });
const { users, levels, subjects, levelSubjects, enrollments, learningObjectives, weeklyResources, userProfiles } = schema;

await db.insert(users).values(["est", "est2", "sinperfil", "tut", "tut2", "adm"].map((id) => ({ id })));
await db.insert(userProfiles).values([
  { userId: "est", role: "student" }, { userId: "est2", role: "student" },
  { userId: "tut", role: "tutor" }, { userId: "tut2", role: "tutor" }, { userId: "adm", role: "admin" },
]);
await db.insert(levels).values([{ id: "7b", name: "7° Básico", programType: "menores" }]);
await db.insert(subjects).values([{ id: "s-mat", name: "Matemática", slug: "matematica" }, { id: "s-len", name: "Lenguaje", slug: "lenguaje" }]);
await db.insert(levelSubjects).values([{ id: "ls1", levelId: "7b", subjectId: "s-mat" }, { id: "ls2", levelId: "7b", subjectId: "s-len" }]);
await db.insert(enrollments).values([{ userId: "est", levelSubjectId: "ls1" }, { userId: "est2", levelSubjectId: "ls1" }]);
await db.insert(learningObjectives).values([
  { id: "oa1", levelSubjectId: "ls1", code: "OA 1", title: "Enteros", weekNumber: 1 },
  { id: "oa9", levelSubjectId: "ls2", code: "OA 9", title: "Lectura", weekNumber: 1 },
]);
await db.insert(weeklyResources).values([
  { id: "r1", learningObjectiveId: "oa1", resourceType: "video", title: "Video" },
  { id: "r9", learningObjectiveId: "oa9", resourceType: "video", title: "Otro OA" },
]);

const t0 = new Date(2026, 3, 1, 10, 0, 0);
const t1 = new Date(2026, 3, 1, 12, 0, 0);
const t2 = new Date(2026, 3, 1, 15, 30, 0);
const t3 = new Date(2026, 3, 2, 9, 0, 0);
const pregunta = "No entiendo cómo restar números negativos";
const fails = (r: { ok: boolean; status?: number }, status: number) => { assert.equal(r.ok, false); assert.equal(r.status, status); };

// Crear: solo estudiantes con matrícula activa en el OA; contexto válido; textos acotados.
fails(await crearCaso(db, "tut", { learningObjectiveId: "oa1", pregunta }, t0), 403);
fails(await crearCaso(db, "sinperfil", { learningObjectiveId: "oa1", pregunta }, t0), 403);
fails(await crearCaso(db, "est", { learningObjectiveId: "oa9", pregunta }, t0), 403); // sin matrícula
fails(await crearCaso(db, "est", { learningObjectiveId: "nope", pregunta }, t0), 404);
fails(await crearCaso(db, "est", { learningObjectiveId: "oa1", resourceId: "r9", pregunta }, t0), 404); // recurso de otro OA
fails(await crearCaso(db, "est", { learningObjectiveId: "oa1", pregunta: "corta" }, t0), 400);
fails(await crearCaso(db, "est", { learningObjectiveId: "oa1", pregunta: "x".repeat(2001) }, t0), 400);
fails(await crearCaso(db, "est", { learningObjectiveId: "oa1", pregunta, studentId: "est2" }, t0), 400); // campos extra
const creado = await crearCaso(db, "est", { learningObjectiveId: "oa1", resourceId: "r1", pregunta: `  ${pregunta}  ` }, t0);
assert.ok(creado.ok);
const caso = creado.value;
assert.deepEqual([caso.status, caso.studentId, caso.question, caso.tutorId], ["abierto", "est", pregunta, null]);
assert.equal(caso.createdAt.getTime(), t0.getTime());

// Listados por rol: cada estudiante ve solo los suyos; el tutor no lista como estudiante.
const mios = await casosDelEstudiante(db, "est");
assert.ok(mios.ok && mios.value.length === 1);
const ajenos = await casosDelEstudiante(db, "est2");
assert.ok(ajenos.ok && ajenos.value.length === 0);
fails(await casosDelEstudiante(db, "tut"), 403);
fails(await casosDelTutor(db, "est"), 403);
fails(await casosParaAdmin(db, "tut", undefined), 403);
fails(await casosParaAdmin(db, "adm", "inventado"), 400);
const abiertos = await casosParaAdmin(db, "adm", "abierto");
assert.ok(abiertos.ok && abiertos.value.length === 1);

// Responder antes de asignar: el caso no es de ningún tutor.
fails(await responderCaso(db, "tut", caso.id, { respuesta: "Hola" }, t1), 404);

// Asignar: solo admin, solo a un tutor.
fails(await asignarCaso(db, "tut", caso.id, { tutorId: "tut" }, t1), 403);
fails(await asignarCaso(db, "est", caso.id, { tutorId: "tut" }, t1), 403);
fails(await asignarCaso(db, "adm", caso.id, { tutorId: "est2" }, t1), 400);
fails(await asignarCaso(db, "adm", "nope", { tutorId: "tut" }, t1), 404);
const asignado = await asignarCaso(db, "adm", caso.id, { tutorId: "tut" }, t1);
assert.ok(asignado.ok && asignado.value.status === "asignado" && asignado.value.tutorId === "tut");
assert.equal(asignado.value.assignedAt?.getTime(), t1.getTime());

// Otro tutor no ve ni puede tocar el caso.
const delTut2 = await casosDelTutor(db, "tut2");
assert.ok(delTut2.ok && delTut2.value.length === 0);
fails(await responderCaso(db, "tut2", caso.id, { respuesta: "Intruso" }, t2), 404);
fails(await responderCaso(db, "adm", caso.id, { respuesta: "Admin" }, t2), 403);
fails(await responderCaso(db, "est", caso.id, { respuesta: "Yo" }, t2), 403);
fails(await cerrarCaso(db, "tut", caso.id, { notaCierre: "Antes de responder" }, t2), 409);
fails(await responderCaso(db, "tut", caso.id, { respuesta: "x".repeat(4001) }, t2), 400);

const respondido = await responderCaso(db, "tut", caso.id, { respuesta: "Restar un negativo es sumar su opuesto." }, t2);
assert.ok(respondido.ok && respondido.value.status === "respondido");
// Tiempo de respuesta real medible desde las fechas: 5,5 h desde la solicitud.
assert.equal((respondido.value.respondedAt!.getTime() - respondido.value.createdAt.getTime()) / 3_600_000, 5.5);
fails(await responderCaso(db, "tut", caso.id, { respuesta: "Otra vez" }, t2), 409);
fails(await asignarCaso(db, "adm", caso.id, { tutorId: "tut2" }, t2), 409); // ya respondido

fails(await cerrarCaso(db, "tut", caso.id, { notaCierre: "" }, t3), 400);
fails(await cerrarCaso(db, "tut2", caso.id, { notaCierre: "Ajeno" }, t3), 404);
const cerrado = await cerrarCaso(db, "tut", caso.id, { notaCierre: "Resuelto; se sugirió repasar el video r1." }, t3);
assert.ok(cerrado.ok && cerrado.value.status === "cerrado" && cerrado.value.closedAt?.getTime() === t3.getTime());
fails(await cerrarCaso(db, "tut", caso.id, { notaCierre: "Otra vez" }, t3), 409);

// Reasignación mientras sigue asignado reinicia la fecha de asignación.
const otro = await crearCaso(db, "est", { learningObjectiveId: "oa1", pregunta }, t0);
assert.ok(otro.ok);
await asignarCaso(db, "adm", otro.value.id, { tutorId: "tut" }, t1);
const reasignado = await asignarCaso(db, "adm", otro.value.id, { tutorId: "tut2" }, t2);
assert.ok(reasignado.ok && reasignado.value.tutorId === "tut2" && reasignado.value.assignedAt?.getTime() === t2.getTime());
fails(await responderCaso(db, "tut", otro.value.id, { respuesta: "Ya no es mío" }, t3), 404);

// Tope de casos sin cerrar por estudiante.
for (let i = 1; i < MAX_OPEN_CASES; i++) assert.ok((await crearCaso(db, "est", { learningObjectiveId: "oa1", pregunta }, t0)).ok);
fails(await crearCaso(db, "est", { learningObjectiveId: "oa1", pregunta }, t0), 409);

console.log("tutoria: ok");
