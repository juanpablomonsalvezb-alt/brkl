// Chequeo de la matrícula (server/matricula.ts) contra una base SQLite en memoria.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "../shared/schema";
import { users } from "../shared/models/auth";
import { enrollStudentInLevel, listEnrollments, levelIdFromCourse, enrollFromPaidReservation, MatriculaError } from "../server/matricula";
import { loadVorticeOverview } from "../server/vortice";

const client = createClient({ url: ":memory:" });
const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
for (const stmt of ddl) await client.execute(stmt);
const db = drizzle(client, { schema });
const { levels, subjects, levelSubjects, enrollments, userProfiles, reservations } = schema;

await db.insert(users).values([{ id: "u1", email: "Ana@Gmail.com" }, { id: "u2", email: "beto@gmail.com" }, { id: "u3" }]);
await db.insert(levels).values([
  { id: "7b", name: "7° Básico", programType: "menores", sortOrder: 1 },
  { id: "8b", name: "8° Básico", programType: "menores", sortOrder: 2 },
]);
await db.insert(subjects).values([
  { id: "s-mat", name: "Matemática", slug: "matematica" },
  { id: "s-len", name: "Lenguaje", slug: "lenguaje" },
]);
await db.insert(levelSubjects).values([
  { id: "7-mat", levelId: "7b", subjectId: "s-mat" },
  { id: "7-len", levelId: "7b", subjectId: "s-len" },
  { id: "8-mat", levelId: "8b", subjectId: "s-mat" },
]);
const rowsOf = async (userId: string) =>
  (await db.select().from(enrollments).where(eq(enrollments.userId, userId)))
    .map((e) => `${e.levelSubjectId}:${e.isActive ? "on" : "off"}`).sort();

// Primera matrícula: crea perfil y una matrícula por asignatura del nivel.
const r1 = await enrollStudentInLevel(db, "u1", "7b");
assert.deepEqual(r1.created.sort(), ["7-len", "7-mat"]);
assert.deepEqual(await rowsOf("u1"), ["7-len:on", "7-mat:on"]);
assert.ok((await db.select().from(enrollments)).every((e) => e.enrolledAt instanceof Date && e.id.length === 36));
const [p1] = await db.select().from(userProfiles).where(eq(userProfiles.userId, "u1"));
assert.deepEqual([p1.levelId, p1.role], ["7b", "student"]);
assert.equal((await loadVorticeOverview(db, "u1", new Date(2026, 5, 1))).subjects.length, 2);

// Idempotente: repetir no duplica.
const r2 = await enrollStudentInLevel(db, "u1", "7b");
assert.deepEqual([r2.created, r2.alreadyActive.length], [[], 2]);
assert.equal((await rowsOf("u1")).length, 2);

// Cambio de curso: desactiva 7° (sin borrar), activa 8°, y el perfil sigue siendo uno solo.
const r3 = await enrollStudentInLevel(db, "u1", "8b");
assert.deepEqual([r3.created, r3.deactivated.sort()], [["8-mat"], ["7-len", "7-mat"]]);
assert.deepEqual(await rowsOf("u1"), ["7-len:off", "7-mat:off", "8-mat:on"]);
assert.equal((await db.select().from(userProfiles).where(eq(userProfiles.userId, "u1"))).length, 1);

// Volver a 7°: reactiva las existentes en vez de crear nuevas.
const r4 = await enrollStudentInLevel(db, "u1", "7b");
assert.deepEqual([r4.created, r4.reactivated.sort(), r4.deactivated], [[], ["7-len", "7-mat"], ["8-mat"]]);
assert.deepEqual(await rowsOf("u1"), ["7-len:on", "7-mat:on", "8-mat:off"]);

// Perfil existente (p. ej. admin): solo cambia el nivel, no el rol.
await db.insert(userProfiles).values({ userId: "u2", role: "tutor" });
await enrollStudentInLevel(db, "u2", "8b");
const [p2] = await db.select().from(userProfiles).where(eq(userProfiles.userId, "u2"));
assert.deepEqual([p2.levelId, p2.role], ["8b", "tutor"]);

// Llamadas simultáneas no duplican.
await Promise.all([enrollStudentInLevel(db, "u3", "7b"), enrollStudentInLevel(db, "u3", "7b")]);
assert.deepEqual(await rowsOf("u3"), ["7-len:on", "7-mat:on"]);

// Errores: usuario o nivel inexistente, sin escribir nada.
await assert.rejects(enrollStudentInLevel(db, "nadie", "7b"), MatriculaError);
await assert.rejects(enrollStudentInLevel(db, "u3", "9z"), MatriculaError);
assert.deepEqual(await rowsOf("u3"), ["7-len:on", "7-mat:on"]);

// Listado por nivel.
const lista7 = await listEnrollments(db, "7b");
assert.deepEqual(lista7.map((r) => `${r.userId}:${r.levelSubjectId}:${r.isActive}`).sort(),
  ["u1:7-len:true", "u1:7-mat:true", "u3:7-len:true", "u3:7-mat:true"]);
assert.equal((await listEnrollments(db)).length, 4 + 1 + 1); // + u1 8-mat inactiva + u2 8-mat

// Curso de la reserva / inscripción → nivel de Vórtice.
assert.equal(levelIdFromCourse("7basico"), "7b");
assert.equal(levelIdFromCourse("4medio"), "4m");
assert.equal(levelIdFromCourse("1° Básico"), "1b");
assert.equal(levelIdFromCourse("2° Medio"), "2m");
for (const fuera of ["adultos_nivel1_basica", "Validación adulto", "paes", "9basico", "", null]) {
  assert.equal(levelIdFromCourse(fuera), null);
}

// Enganche del webhook de Flow.
const base = { fullName: "x", rut: "x", email: "x@gmail.com", phone: "x", dateOfBirth: "x", programType: "focus" as const };
await db.insert(users).values([{ id: "u4", email: "caro@gmail.com" }]);
await db.insert(reservations).values([
  { ...base, id: "pend", studentEmail: "caro@gmail.com", courseOfInterest: "7basico", paymentStatus: "pending" },
  { ...base, id: "ok", studentEmail: "CARO@gmail.com", courseOfInterest: "7basico", paymentStatus: "completed" },
  { ...base, id: "adulto", studentEmail: "caro@gmail.com", courseOfInterest: "adultos_nivel1_basica", paymentStatus: "completed" },
  { ...base, id: "sincuenta", studentEmail: "nuevo@gmail.com", courseOfInterest: "8basico", paymentStatus: "completed" },
  { ...base, id: "cambio", studentEmail: "caro@gmail.com", courseOfInterest: "8basico", paymentStatus: "completed" },
]);
assert.deepEqual(await enrollFromPaidReservation(db, "pend"), { ok: false, reason: "Pago no confirmado" });
assert.equal((await enrollFromPaidReservation(db, "adulto")).ok, false);
assert.equal((await enrollFromPaidReservation(db, "sincuenta")).ok, false);
const auto = await enrollFromPaidReservation(db, "ok");
assert.ok(auto.ok && auto.userId === "u4");
assert.deepEqual(await rowsOf("u4"), ["7-len:on", "7-mat:on"]);
const [rOk] = await db.select().from(reservations).where(eq(reservations.id, "ok"));
assert.equal(rOk.status, "enrolled");
// Reintento del webhook: idempotente.
assert.equal((await enrollFromPaidReservation(db, "ok")).ok, true);
assert.deepEqual(await rowsOf("u4"), ["7-len:on", "7-mat:on"]);
// Un pago no cambia de curso a quien ya está matriculado en otro nivel.
assert.equal((await enrollFromPaidReservation(db, "cambio")).ok, false);
assert.deepEqual(await rowsOf("u4"), ["7-len:on", "7-mat:on"]);

console.log("matricula: ok");
