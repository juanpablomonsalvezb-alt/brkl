// Chequeo de notificaciones de aprendizaje: lógica pura + despacho contra SQLite en memoria
// con transporte simulado (no se envía ningún correo real). Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "../shared/schema";
import { users } from "../shared/models/auth";
import {
  PREFERENCIAS_POR_DEFECTO, dentroDeHorario, momentoChile, planificarNotificaciones, semanaIso,
  actualizarPreferenciasSchema, type EntradaNotificaciones,
} from "../shared/notificaciones";
import { buildOverview } from "../shared/vortice";
import { aCorreo, cronAutorizado, despacharNotificaciones, guardarPreferencias, leerPreferencias, type Correo } from "../server/notificaciones";

// --- Hora de Chile y semanas ---
assert.deepEqual(momentoChile(new Date("2026-10-15T12:00:00Z")), { fecha: "2026-10-15", hora: 9, diaSemana: 4 }); // UTC-3 (verano)
assert.deepEqual(momentoChile(new Date("2026-06-15T12:00:00Z")), { fecha: "2026-06-15", hora: 8, diaSemana: 1 }); // UTC-4 (invierno)
assert.equal(momentoChile(new Date("2026-10-16T02:00:00Z")).fecha, "2026-10-15"); // aún jueves en Chile
assert.equal(dentroDeHorario(new Date("2026-10-15T12:00:00Z")), true); // 09:00
assert.equal(dentroDeHorario(new Date("2026-06-15T12:00:00Z")), false); // 08:00
assert.equal(dentroDeHorario(new Date("2026-10-15T23:00:00Z")), false); // 20:00
assert.equal(dentroDeHorario(new Date("2026-10-15T05:00:00Z")), false); // 02:00
assert.equal(semanaIso("2026-10-15"), "2026-W42");
assert.equal(semanaIso("2027-01-01"), "2026-W53");
assert.equal(semanaIso("2021-01-03"), "2020-W53");
assert.equal(semanaIso("2024-12-30"), "2025-W01");

// --- Planificación pura ---
const viernes = new Date("2026-10-16T15:00:00Z"); // viernes 12:00 Chile
const resumen = buildOverview({ id: "7b", name: "7° Básico" }, [{
  levelSubjectId: "ls", subjectName: "Matemática", subjectSlug: "matematica",
  objectives: [{ id: "oa", code: "OA 1", title: "Números", weekNumber: 1, sortOrder: 0, resources: [{ id: "r", title: "Video", resourceType: "video", sortOrder: 0 }] }],
}], new Set());
const base: EntradaNotificaciones = {
  ahora: viernes,
  estudiante: { nombre: "Ana", email: "ana@example.test" },
  apoderado: null,
  preferencias: { ...PREFERENCIAS_POR_DEFECTO },
  enviadas: new Set(),
  modulos: [
    { asignatura: "Matemática", titulo: "Números", abierto: true, abreEl: "2026-10-12",
      evaluaciones: [
        { id: "e1", titulo: "Mini evaluación 1", liberadaEl: "2026-10-14", aprobada: false },
        { id: "e2", titulo: "Cierre <módulo>", liberadaEl: "2026-10-16", aprobada: false },
      ] },
    // Módulo cerrado: aunque su evaluación salga hoy, no se avisa.
    { asignatura: "Lenguaje", titulo: "Lectura", abierto: false, abreEl: "2026-10-16",
      evaluaciones: [{ id: "e9", titulo: "Eval", liberadaEl: "2026-10-16", aprobada: false }] },
  ],
  resumen,
  avancesSemana: 0,
};
const tipos = (e: EntradaNotificaciones) => planificarNotificaciones(e).map((n) => n.tipo);

// Por defecto solo el resumen semanal.
assert.deepEqual(tipos(base), ["resumenSemanal"]);
const todo = { ...base, preferencias: { evaluacionLiberada: true, moduloAbierto: true, resumenSemanal: true, resumenSemanalApoderado: true } };
assert.deepEqual(tipos(todo), ["evaluacionLiberada", "resumenSemanal"]); // sin apoderado vinculado no hay resumen al apoderado
const [evalHoy] = planificarNotificaciones(todo);
assert.ok(evalHoy.lineas.some((l) => l.includes("Cierre <módulo>")));
assert.ok(!evalHoy.lineas.some((l) => l.includes("Mini evaluación 1") || l.includes("Eval»"))); // ni la de ayer ni la del módulo cerrado
assert.equal(evalHoy.periodo, "2026-10-16");
assert.ok(aCorreo(evalHoy).html.includes("Cierre &lt;módulo&gt;")); // HTML escapado
// Aprobada: no se avisa.
assert.deepEqual(tipos({ ...todo, modulos: [{ ...todo.modulos[0], evaluaciones: [{ ...todo.modulos[0].evaluaciones[1], aprobada: true }] }] }), ["resumenSemanal"]);
// Módulo que abre hoy por calendario.
assert.deepEqual(tipos({ ...todo, modulos: [{ ...todo.modulos[1], abierto: true, evaluaciones: [] }] }), ["moduloAbierto", "resumenSemanal"]);
// Ya registrado en el día / la semana: no se repite.
assert.deepEqual(tipos({ ...todo, enviadas: new Set(["evaluacionLiberada|2026-10-16", "resumenSemanal|2026-W42"]) }), []);
// Con apoderado vinculado y consentimiento, también le llega su resumen.
const conApoderado = planificarNotificaciones({ ...todo, apoderado: { nombre: null, email: "apo@example.test" } });
assert.deepEqual(conApoderado.map((n) => [n.tipo, n.para]).at(-1), ["resumenSemanalApoderado", "apo@example.test"]);
// De noche, nada.
assert.deepEqual(tipos({ ...todo, ahora: new Date("2026-10-17T02:00:00Z") }), []);
// El resumen sale de viernes a domingo; el jueves no.
assert.deepEqual(tipos({ ...base, ahora: new Date("2026-10-15T15:00:00Z") }), []);
assert.deepEqual(tipos({ ...base, ahora: new Date("2026-10-18T15:00:00Z") }), ["resumenSemanal"]);
// Sin matrícula, sin resumen.
assert.deepEqual(tipos({ ...base, resumen: buildOverview(null, [], new Set()) }), []);
// Tono: sin culpa cuando no hubo avance; reconocimiento cuando sí; nada de rachas ni urgencia.
const [sinAvance] = planificarNotificaciones(base);
assert.ok(!sinAvance.lineas.join(" ").includes("avanzaste"));
const [conAvance] = planificarNotificaciones({ ...base, avancesSemana: 3 });
assert.ok(conAvance.lineas.includes("Esta semana avanzaste en 3 actividades. ¡Bien hecho!"));
assert.ok(conAvance.lineas.some((l) => l.includes("«Video» en Matemática")));
const todoTexto = [...planificarNotificaciones(todo), conAvance].flatMap((n) => [n.asunto, ...n.lineas]).join(" ").toLowerCase();
for (const prohibida of ["racha", "urgente", "último aviso", "no te olvides", "atrasad", "rápido"]) {
  assert.ok(!todoTexto.includes(prohibida), `texto con presión: ${prohibida}`);
}
// Validación de preferencias.
assert.equal(actualizarPreferenciasSchema.safeParse({ moduloAbierto: true }).success, true);
assert.equal(actualizarPreferenciasSchema.safeParse({ moduloAbierto: "si" }).success, false);
assert.equal(actualizarPreferenciasSchema.safeParse({ otra: true }).success, false);

// --- Secreto del cron ---
assert.equal(cronAutorizado("Bearer s3creto", "s3creto"), true);
assert.equal(cronAutorizado("Bearer otro", "s3creto"), false);
assert.equal(cronAutorizado("s3creto", "s3creto"), false);
assert.equal(cronAutorizado(undefined, "s3creto"), false);

console.log("notificaciones: ok");

// --- Despacho contra SQLite en memoria, transporte simulado ---
const client = createClient({ url: ":memory:" });
const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
for (const stmt of ddl) await client.execute(stmt);
const db = drizzle(client, { schema });
const { levels, subjects, levelSubjects, enrollments, learningObjectives, weeklyResources, moduleEvaluations, evaluationProgress, notificationLog } = schema;

await db.insert(users).values([
  { id: "u1", email: "u1@example.test", firstName: "Ana" },
  { id: "u2", email: "u2@example.test" },
  { id: "u3" }, // sin correo
  { id: "u4", email: "u4@example.test" }, // matrícula inactiva
  { id: "u5", email: "u5@example.test" },
]);
await db.insert(levels).values([{ id: "7b", name: "7° Básico", programType: "menores", sortOrder: 1 }]);
await db.insert(subjects).values([{ id: "s-mat", name: "Matemática", slug: "matematica" }]);
await db.insert(levelSubjects).values([{ id: "ls1", levelId: "7b", subjectId: "s-mat" }]);
await db.insert(enrollments).values([
  { userId: "u1", levelSubjectId: "ls1" }, { userId: "u2", levelSubjectId: "ls1" }, { userId: "u3", levelSubjectId: "ls1" },
  { userId: "u4", levelSubjectId: "ls1", isActive: false },
]);
await db.insert(learningObjectives).values([
  { id: "oa1", levelSubjectId: "ls1", code: "OA 1", title: "Números enteros", weekNumber: 1 },
  { id: "oa2", levelSubjectId: "ls1", code: "OA 2", title: "Fracciones", weekNumber: 2 },
]);
await db.insert(weeklyResources).values([
  { id: "r1", learningObjectiveId: "oa1", resourceType: "video", title: "Video OA1", sortOrder: 0 },
  { id: "r2", learningObjectiveId: "oa2", resourceType: "video", title: "Video OA2", sortOrder: 0 },
]);
await db.insert(moduleEvaluations).values([
  { id: "e1", learningObjectiveId: "oa1", evaluationNumber: 1, title: "Mini evaluación 1", releaseWeek: 1 },
  { id: "e2", learningObjectiveId: "oa1", evaluationNumber: 2, title: "Cierre de módulo", releaseWeek: 1 },
]);

// Calendario 2026: módulo 1 abre el lunes 9 de marzo; evaluación 2 se libera el viernes 13; módulo 2 abre el lunes 23.
const viernes13 = new Date("2026-03-13T15:00:00Z"); // 12:00 Chile
const lunes23 = new Date("2026-03-23T15:00:00Z");

let enviados: Correo[] = [];
const simulado = async (c: Correo) => { enviados.push(c); };

// Preferencias: sin fila = por defecto; guardar mezcla con lo existente.
assert.deepEqual(await leerPreferencias(db, "u1"), PREFERENCIAS_POR_DEFECTO);
await guardarPreferencias(db, "u1", { evaluacionLiberada: true });
assert.deepEqual(await guardarPreferencias(db, "u1", { moduloAbierto: true }),
  { ...PREFERENCIAS_POR_DEFECTO, evaluacionLiberada: true, moduloAbierto: true });

const r1 = await despacharNotificaciones(db, simulado, viernes13);
assert.deepEqual(r1, { fueraDeHorario: false, usuarios: 2, enviadas: 3, fallidas: 0 });
assert.deepEqual(enviados.map((c) => [c.para, c.asunto]).sort(), [
  ["u1@example.test", "Hay una evaluación nueva disponible"],
  ["u1@example.test", "Tu semana en Barkley"],
  ["u2@example.test", "Tu semana en Barkley"],
]);
assert.ok(enviados.find((c) => c.asunto.startsWith("Hay"))!.texto.includes("«Cierre de módulo» — Matemática"));

// Segunda ejecución el mismo día: idempotente.
enviados = [];
assert.equal((await despacharNotificaciones(db, simulado, viernes13)).enviadas, 0);
assert.equal(enviados.length, 0);
assert.equal((await db.select().from(notificationLog)).length, 3);

// De noche no se envía ni se consulta nada.
assert.deepEqual(await despacharNotificaciones(db, simulado, new Date("2026-03-14T03:00:00Z")),
  { fueraDeHorario: true, usuarios: 0, enviadas: 0, fallidas: 0 });

// Falla del transporte: se libera la reserva y se reintenta en la próxima ejecución.
await db.insert(enrollments).values([{ userId: "u5", levelSubjectId: "ls1" }]);
const falla = async () => { throw new Error("SMTP caído"); };
assert.equal((await despacharNotificaciones(db, falla, viernes13)).fallidas, 1);
assert.equal((await db.select().from(notificationLog)).length, 3);
enviados = [];
assert.equal((await despacharNotificaciones(db, simulado, viernes13)).enviadas, 1);
assert.equal(enviados[0].para, "u5@example.test");

// Lunes 23: u1 cerró el módulo 1 → aviso de módulo abierto; u2 no (no lo cerró, y además no lo activó).
await db.insert(evaluationProgress).values([{ userId: "u1", evaluationId: "e2", passed: true, score: 90, completedAt: new Date("2026-03-21T15:00:00Z") }]);
enviados = [];
const r2 = await despacharNotificaciones(db, simulado, lunes23);
assert.equal(r2.enviadas, 1);
assert.equal(enviados[0].asunto, "Se abrió un módulo nuevo");
assert.ok(enviados[0].texto.includes("Matemática: Fracciones"));

// Resumen de la semana siguiente con avance de los últimos 7 días.
enviados = [];
await despacharNotificaciones(db, simulado, new Date("2026-03-27T15:00:00Z"));
const resumenU1 = enviados.find((c) => c.para === "u1@example.test")!;
assert.ok(resumenU1.texto.includes("Esta semana avanzaste en 1 actividad."));
assert.ok(resumenU1.texto.startsWith("Hola, Ana:"));

console.log("notificaciones-db: ok");
