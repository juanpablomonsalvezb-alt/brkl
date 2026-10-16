// Calendario configurable por año académico y nivel, guardado en program_calendar.
// Recibe la conexión como parámetro para poder probarse contra una base en memoria.
import { and, eq, isNull, or } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import { programCalendar, levelSubjects, type ProgramCalendar, type CalendarConfigInput } from "@shared/schema";
import { CHILE_TZ, DEFAULT_CONFIG, midnightIn, ymdIn, type CalendarConfig } from "./calendarUtils";

type Db = LibSQLDatabase<typeof schema>;

export function rowToCalendarConfig(row: ProgramCalendar): CalendarConfig {
  return {
    programStartDate: row.startDate,
    moduleDurationWeeks: row.moduleDurationWeeks,
    totalModules: row.totalModules,
    generalEvaluationWeeks: row.generalEvaluationWeeks,
    timeZone: CHILE_TZ,
    breaks: row.breaks,
    holidays: row.holidays,
  };
}

// Fila → forma de entrada de la API (fechas como día calendario de Chile).
export function rowToCalendarInput(row: ProgramCalendar): CalendarConfigInput {
  return {
    academicYear: row.academicYear,
    levelId: row.levelId,
    startDate: ymdIn(CHILE_TZ, row.startDate),
    moduleDurationWeeks: row.moduleDurationWeeks,
    totalModules: row.totalModules,
    generalEvaluationWeeks: row.generalEvaluationWeeks,
    breaks: row.breaks,
    holidays: row.holidays,
  };
}

export function calendarInputToRow(input: CalendarConfigInput) {
  return { ...input, startDate: midnightIn(CHILE_TZ, input.startDate) };
}

// Config aplicable: nivel + año > año (level_id NULL) > DEFAULT_CONFIG.
// El año académico es el año calendario de `date` en hora de Chile (el año escolar va de marzo a diciembre).
export async function resolveCalendarConfig(db: Db, levelId: string | null | undefined, date: Date): Promise<CalendarConfig> {
  const academicYear = Number(ymdIn(CHILE_TZ, date).slice(0, 4));
  const rows = await db.select().from(programCalendar).where(and(
    eq(programCalendar.academicYear, academicYear),
    levelId ? or(eq(programCalendar.levelId, levelId), isNull(programCalendar.levelId)) : isNull(programCalendar.levelId),
  ));
  const row = rows.find((r) => r.levelId) ?? rows[0];
  return row ? rowToCalendarConfig(row) : DEFAULT_CONFIG;
}

export async function resolveCalendarConfigForLevelSubject(db: Db, levelSubjectId: string, date: Date): Promise<CalendarConfig> {
  const [ls] = await db.select({ levelId: levelSubjects.levelId }).from(levelSubjects).where(eq(levelSubjects.id, levelSubjectId));
  return resolveCalendarConfig(db, ls?.levelId, date);
}
