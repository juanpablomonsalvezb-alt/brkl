// Chequeo del calendario configurable (año/nivel, recesos, feriados, hora de Chile).
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { addDays, addWeeks } from "date-fns";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "../shared/schema";
import { users } from "../shared/models/auth";
import {
  DEFAULT_CONFIG, CHILE_TZ, ymdIn, getModuleStartDate, getModuleEndDate, getEvaluation1ReleaseDate,
  getEvaluation2ReleaseDate, getEvaluation3ReleaseDate, getEvaluation4ReleaseDate, getGeneralEvaluationWeeks,
  type CalendarConfig,
} from "../server/calendarUtils";
import { resolveCalendarConfig, calendarInputToRow } from "../server/calendarConfig";
import { checkResourceAccess, checkEvaluationAccess, loadVorticeOverview } from "../server/vortice";

const ymd = (d: Date) => ymdIn(CHILE_TZ, d);

// 1. Sin configuración: mismas fechas que la fórmula original (offset fijo + 1 semana por evaluación general).
for (let n = 1; n <= DEFAULT_CONFIG.totalModules; n++) {
  const start = addWeeks(DEFAULT_CONFIG.programStartDate, (n - 1) * 2 + (n > 7 ? 1 : 0));
  assert.equal(getModuleStartDate(n).getTime(), start.getTime(), `inicio módulo ${n}`);
  assert.equal(getModuleEndDate(n).getTime(), addDays(addWeeks(start, 2), -1).getTime());
  assert.equal(getEvaluation1ReleaseDate(n).getTime(), addDays(start, 2).getTime());
  assert.equal(getEvaluation2ReleaseDate(n).getTime(), addDays(start, 4).getTime());
  assert.equal(getEvaluation3ReleaseDate(n).getTime(), addDays(addWeeks(start, 1), 2).getTime());
  assert.equal(getEvaluation4ReleaseDate(n).getTime(), addDays(addWeeks(start, 1), 4).getTime());
}
assert.deepEqual(getGeneralEvaluationWeeks().map((w) => w.startDate.getTime()),
  [7, 15].map((m) => addDays(getModuleEndDate(m), 1).getTime()));

// 2. Config de la base: hora de Chile, recesos y feriados.
const row = calendarInputToRow(schema.calendarConfigInputSchema.parse({
  academicYear: 2027, startDate: "2027-03-01", totalModules: 10,
  generalEvaluationWeeks: [{ afterModule: 5, name: "Evaluación semestral" }],
  breaks: [{ start: "2027-06-21", end: "2027-07-02", name: "Vacaciones de invierno" }],
  holidays: ["2027-05-21", "2027-03-03"],
}));
const cfg: CalendarConfig = {
  programStartDate: row.startDate, moduleDurationWeeks: 2, totalModules: 10,
  generalEvaluationWeeks: row.generalEvaluationWeeks, timeZone: CHILE_TZ, breaks: row.breaks, holidays: row.holidays,
};
const starts = Array.from({ length: 10 }, (_, i) => ymd(getModuleStartDate(i + 1, cfg)));
// M1 01-03, …, M5 26-04 (termina 09-05), semana de evaluación 10-05, M6 17-05, M7 31-05;
// M8 caería 14-06 → su 2ª semana (21-06) está en receso: se corre entero al 05-07.
assert.deepEqual(starts, [
  "2027-03-01", "2027-03-15", "2027-03-29", "2027-04-12", "2027-04-26",
  "2027-05-17", "2027-05-31", "2027-07-05", "2027-07-19", "2027-08-02",
]);
assert.equal(ymd(getGeneralEvaluationWeeks(cfg)[0].startDate), "2027-05-10");
// Todas las fechas son medianoche en Chile, también después del cambio de hora de abril.
for (let n = 1; n <= 10; n++) {
  const d = getModuleStartDate(n, cfg);
  assert.equal(new Intl.DateTimeFormat("en-GB", { timeZone: CHILE_TZ, hour: "2-digit", hourCycle: "h23" }).format(d), "00");
}
// Feriados: el miércoles 03-03 pasa al jueves 04-03; el viernes 21-05 pasa al lunes 24-05.
assert.equal(ymd(getEvaluation1ReleaseDate(1, cfg)), "2027-03-04");
assert.equal(ymd(getEvaluation2ReleaseDate(6, cfg)), "2027-05-24");
assert.equal(ymd(getModuleEndDate(7, cfg)), "2027-06-13");

// Validación de entrada.
const bad = (x: object) => !schema.calendarConfigInputSchema.safeParse(x).success;
assert.ok(bad({ academicYear: 2027, startDate: "2027-03-02" })); // no es lunes
assert.ok(bad({ academicYear: 2028, startDate: "2027-03-01" })); // otro año
assert.ok(bad({ academicYear: 2027, startDate: "2027-02-30" }));
assert.ok(bad({ academicYear: 2027, startDate: "2027-03-01", breaks: [{ start: "2027-07-02", end: "2027-06-21" }] }));
assert.ok(bad({ academicYear: 2027, startDate: "2027-03-01", totalModules: 6 })); // evaluación tras módulo 7 y 15
assert.ok(bad({ academicYear: 2027, startDate: "2027-03-01", extra: 1 }));

// 3. Resolución: nivel + año > año > DEFAULT_CONFIG, y uso en acceso/resumen.
const client = createClient({ url: ":memory:" });
const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
for (const stmt of ddl) await client.execute(stmt);
const db = drizzle(client, { schema });
const { levels, subjects, levelSubjects, enrollments, learningObjectives, weeklyResources, moduleEvaluations, programCalendar } = schema;

await db.insert(users).values([{ id: "u1" }]);
await db.insert(levels).values([
  { id: "7b", name: "7° Básico", programType: "menores" },
  { id: "1m", name: "1° Medio", programType: "menores" },
]);
await db.insert(subjects).values([{ id: "s", name: "Matemática", slug: "matematica" }]);
await db.insert(levelSubjects).values([{ id: "ls1", levelId: "7b", subjectId: "s" }]);
await db.insert(enrollments).values([{ userId: "u1", levelSubjectId: "ls1" }]);
await db.insert(learningObjectives).values([{ id: "oa1", levelSubjectId: "ls1", code: "OA 1", title: "Números", weekNumber: 1 }]);
await db.insert(weeklyResources).values([{ id: "r1", learningObjectiveId: "oa1", resourceType: "video", title: "Video" }]);
await db.insert(moduleEvaluations).values([{ id: "e1", learningObjectiveId: "oa1", evaluationNumber: 1, title: "Mini 1", releaseWeek: 1 }]);

const abril = new Date("2026-04-01T15:00:00Z");
assert.equal(await resolveCalendarConfig(db, "7b", abril), DEFAULT_CONFIG); // base vacía
assert.equal((await checkResourceAccess(db, "u1", "r1", abril)).ok, true);

const input = (x: object) => calendarInputToRow(schema.calendarConfigInputSchema.parse(x));
await db.insert(programCalendar).values(input({ academicYear: 2026, startDate: "2026-03-16" }));
assert.equal(ymd((await resolveCalendarConfig(db, "7b", abril)).programStartDate), "2026-03-16"); // año
await db.insert(programCalendar).values(input({ academicYear: 2026, levelId: "7b", startDate: "2026-04-06" }));
assert.equal(ymd((await resolveCalendarConfig(db, "7b", abril)).programStartDate), "2026-04-06"); // nivel + año
assert.equal(ymd((await resolveCalendarConfig(db, "1m", abril)).programStartDate), "2026-03-16"); // otro nivel: la del año
assert.equal(ymd((await resolveCalendarConfig(db, null, abril)).programStartDate), "2026-03-16");
assert.equal(await resolveCalendarConfig(db, "7b", new Date("2027-04-01T15:00:00Z")), DEFAULT_CONFIG); // otro año
// Una sola config por (año, nivel), también para la de todo el año (level_id NULL).
await assert.rejects(db.insert(programCalendar).values(input({ academicYear: 2026, startDate: "2026-03-02" })));
await assert.rejects(db.insert(programCalendar).values(input({ academicYear: 2026, levelId: "7b", startDate: "2026-03-02" })));

// 7° Básico parte el lunes 6 de abril (hora de Chile): el 1 de abril todo cerrado; desde el 6, módulo 1 abierto.
assert.equal((await checkResourceAccess(db, "u1", "r1", abril)).ok, false);
assert.equal((await checkEvaluationAccess(db, "u1", "e1", abril)).ok, false);
assert.equal((await loadVorticeOverview(db, "u1", abril)).subjects[0].waitingForRelease, true);
// El 5 de abril de 2026 Chile vuelve a UTC-4: el lunes 6 a las 00:00 son las 04:00Z.
assert.equal((await checkResourceAccess(db, "u1", "r1", new Date("2026-04-06T03:59:00Z"))).ok, false); // 23:59 del domingo
assert.equal((await checkResourceAccess(db, "u1", "r1", new Date("2026-04-06T04:00:00Z"))).ok, true);
assert.equal((await checkEvaluationAccess(db, "u1", "e1", new Date("2026-04-08T04:00:00Z"))).ok, true); // miércoles 00:00 Chile
console.log("vortice-calendar: ok");
