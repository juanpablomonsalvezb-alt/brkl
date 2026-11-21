// Módulo idempotente: carga el calendario 2027 en program_calendar por nivel.
// Recibe la conexión Drizzle como parámetro para poder probarse contra una base en memoria.
import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import { levels, programCalendar, calendarConfigInputSchema } from "@shared/schema";
import { planCalendario2027PorNivel } from "@shared/calendario2027";
import { calendarInputToRow } from "./calendarConfig";

export interface ApplyCalendario2027Result {
  academicYear: 2027;
  write: boolean;
  insertados: string[];
  yaExistian: string[];
  nivelesAusentes: string[];
}

export async function applyCalendario2027(
  db: LibSQLDatabase<typeof schema>,
  options: { write: boolean },
): Promise<ApplyCalendario2027Result> {
  const parsed = planCalendario2027PorNivel().map((cfg) => calendarConfigInputSchema.parse(cfg));
  const insertados: string[] = [];
  const yaExistian: string[] = [];
  const nivelesAusentes: string[] = [];

  // Consultar niveles y filas 2027 existentes en una sola lectura por tabla.
  const [allLevels, existingRows] = await Promise.all([
    db.select({ id: levels.id, programType: levels.programType }).from(levels),
    db
      .select({ levelId: programCalendar.levelId })
      .from(programCalendar)
      .where(eq(programCalendar.academicYear, 2027)),
  ]);

  const levelsMap = new Map(allLevels.map((l) => [l.id, l.programType]));
  const existingSet = new Set(
    existingRows.map((r) => r.levelId).filter((id): id is string => id !== null),
  );

  for (const cfg of parsed) {
    const levelId = cfg.levelId;
    if (levelId == null) continue;

    if (!levelsMap.has(levelId)) {
      nivelesAusentes.push(levelId);
      continue;
    }

    // Defensa en profundidad: nunca tocar niveles de adultos.
    if (levelsMap.get(levelId) !== "menores") {
      continue;
    }

    if (existingSet.has(levelId)) {
      yaExistian.push(levelId);
      continue;
    }

    if (options.write) {
      await db.insert(programCalendar).values(calendarInputToRow(cfg));
    }
    insertados.push(levelId);
  }

  return {
    academicYear: 2027,
    write: options.write,
    insertados,
    yaExistian,
    nivelesAusentes,
  };
}
