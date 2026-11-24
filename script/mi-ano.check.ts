import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "../shared/schema";
import { users } from "../shared/models/auth";
import { CHILE_TZ, DEFAULT_CONFIG, getGeneralEvaluationWeeks, getModuleEndDate, getModuleStartDate, ymdIn } from "../server/calendarUtils";
import { resolveCalendarConfig } from "../server/calendarConfig";
import { construirMiAno } from "../server/miAno";

const client = createClient({ url: ":memory:" });
const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
for (const statement of ddl) await client.execute(statement);
const db = drizzle(client, { schema });

const { levels, subjects, levelSubjects, enrollments, programCalendar } = schema;
const instant = (ymd: string) => new Date(`${ymd}T18:00:00Z`);
const siguienteDia = (ymd: string) => {
  const day = new Date(`${ymd}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
};

await db.insert(users).values([
  { id: "sin-nivel", email: "sin-nivel@example.test", firstName: "Estudiante" },
  { id: "matriculado", email: "matriculado@example.test", firstName: "Estudiante" },
]);
await db.insert(levels).values([{ id: "7b", name: "5.º Básico", programType: "menores", sortOrder: 1 }]);
await db.insert(subjects).values([{ id: "mat", name: "Matemática", slug: "matematica" }]);
await db.insert(levelSubjects).values([{ id: "ls-mat", levelId: "7b", subjectId: "mat" }]);
await db.insert(enrollments).values([{ userId: "matriculado", levelSubjectId: "ls-mat" }]);

// Sin matrícula ni nivel: calendario vacío, sin datos personales.
const sinNivel = await construirMiAno(db, "sin-nivel", instant("2026-03-08"));
assert.deepEqual(sinNivel, { nivel: null, inicio: null, fin: null, modulos: [], semanasEvaluacion: [] });
assert.deepEqual(Object.keys(sinNivel).sort(), ["fin", "inicio", "modulos", "nivel", "semanasEvaluacion"]);

const ahora = instant("2026-03-08");
const config = await resolveCalendarConfig(db, "7b", ahora);
const calendario = await construirMiAno(db, "matriculado", ahora);
assert.equal(calendario.nivel, "5.º Básico");
assert.equal(calendario.modulos.length, 15);
assert.equal(calendario.modulos[0].inicio, "2026-03-09");
assert.match(calendario.inicio!, /^\d{4}-\d{2}-\d{2}$/);
assert.match(calendario.fin!, /^\d{4}-\d{2}-\d{2}$/);
assert.deepEqual(calendario.modulos.map((modulo) => modulo.numero), Array.from({ length: 15 }, (_, i) => i + 1));
for (const modulo of calendario.modulos) {
  assert.match(modulo.inicio, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(modulo.fin, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(modulo.evaluaciones.map((evaluacion) => evaluacion.numero), [1, 2, 3, 4]);
  assert.equal(modulo.evaluaciones.length, 4);
  for (const evaluacion of modulo.evaluaciones) assert.match(evaluacion.fecha, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(modulo.evaluaciones[0].fecha < modulo.evaluaciones[1].fecha);
  assert.ok(modulo.evaluaciones[1].fecha < modulo.evaluaciones[2].fecha);
  assert.ok(modulo.evaluaciones[2].fecha < modulo.evaluaciones[3].fecha);
}
assert.equal(calendario.fin, ymdIn(CHILE_TZ, getGeneralEvaluationWeeks(config).at(-1)!.endDate));
assert.deepEqual(calendario.semanasEvaluacion.map(({ nombre, despuesDelModulo, inicio, fin }) => ({
  nombre, despuesDelModulo, inicio, fin,
})), getGeneralEvaluationWeeks(config).map((semana) => ({
  nombre: semana.name,
  despuesDelModulo: semana.afterModule,
  inicio: ymdIn(CHILE_TZ, semana.startDate),
  fin: ymdIn(CHILE_TZ, semana.endDate),
})));

// Los estados usan límites inclusivos para cada día calendario de Chile.
const antesDeInicio = await construirMiAno(db, "matriculado", instant("2026-03-08"));
assert.ok(antesDeInicio.modulos.every((modulo) => modulo.estado === "proximo"));
assert.ok(antesDeInicio.semanasEvaluacion.every((semana) => semana.estado === "proximo"));
const inicioModulo3 = ymdIn(CHILE_TZ, getModuleStartDate(3, config));
const duranteModulo3 = await construirMiAno(db, "matriculado", instant(inicioModulo3));
assert.equal(duranteModulo3.modulos[0].estado, "pasado");
assert.equal(duranteModulo3.modulos[1].estado, "pasado");
assert.equal(duranteModulo3.modulos[2].estado, "actual");
assert.equal(duranteModulo3.modulos[3].estado, "proximo");
const exactoInicio = await construirMiAno(db, "matriculado", instant(calendario.modulos[0].inicio));
assert.equal(exactoInicio.modulos[0].estado, "actual");
const finModulo1 = calendario.modulos[0].fin;
const exactoFin = await construirMiAno(db, "matriculado", instant(finModulo1));
assert.equal(exactoFin.modulos[0].estado, "actual", "el ultimo dia del modulo sigue en curso");
// 23:30 hora de Chile del ultimo dia: en UTC ya es el dia siguiente, pero para el estudiante aun es ese dia.
const nocheDelFin = await construirMiAno(db, "matriculado", new Date(`${siguienteDia(finModulo1)}T02:30:00Z`));
assert.equal(nocheDelFin.modulos[0].estado, "actual", "el dia se mide en hora de Chile");
const diaDespuesDelFin = await construirMiAno(db, "matriculado", instant(siguienteDia(ymdIn(CHILE_TZ, getModuleEndDate(1, config)))));
assert.equal(diaDespuesDelFin.modulos[0].estado, "pasado");

// Una configuración explícita del nivel desplaza el inicio del módulo 1.
await db.insert(programCalendar).values({
  academicYear: 2026,
  levelId: "7b",
  startDate: instant("2026-03-16"),
  moduleDurationWeeks: 2,
  totalModules: 15,
  generalEvaluationWeeks: DEFAULT_CONFIG.generalEvaluationWeeks,
  breaks: [],
  holidays: [],
});
const calendarioConfigurado = await construirMiAno(db, "matriculado", ahora);
assert.equal(calendarioConfigurado.modulos[0].inicio, "2026-03-16");

// El payload incluye solo calendario y no contiene nombre ni correo del estudiante.
assert.deepEqual(Object.keys(calendario).sort(), ["fin", "inicio", "modulos", "nivel", "semanasEvaluacion"]);
assert.deepEqual(Object.keys(calendario.modulos[0]).sort(), ["estado", "evaluaciones", "fin", "inicio", "numero"]);
assert.deepEqual(Object.keys(calendario.modulos[0].evaluaciones[0]).sort(), ["fecha", "numero"]);
assert.deepEqual(Object.keys(calendario.semanasEvaluacion[0]).sort(), ["despuesDelModulo", "estado", "fin", "inicio", "nombre"]);
assert.ok(!JSON.stringify(calendario).includes("@example.test"));
assert.ok(!JSON.stringify(calendario).includes("Estudiante"));

await client.close();
console.log("mi-ano: ok");