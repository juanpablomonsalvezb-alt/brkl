import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import { loadVorticeInput } from "./vortice";
import { resolveCalendarConfig } from "./calendarConfig";
import {
  CHILE_TZ,
  getEvaluation1ReleaseDate,
  getEvaluation2ReleaseDate,
  getEvaluation3ReleaseDate,
  getEvaluation4ReleaseDate,
  getGeneralEvaluationWeeks,
  getModuleEndDate,
  getModuleStartDate,
  ymdIn,
} from "./calendarUtils";

type Db = LibSQLDatabase<typeof schema>;

export type EstadoPeriodo = "pasado" | "actual" | "proximo";

export interface MiAno {
  nivel: string | null;
  inicio: string | null;
  fin: string | null;
  modulos: {
    numero: number;
    inicio: string;
    fin: string;
    estado: EstadoPeriodo;
    evaluaciones: { numero: 1 | 2 | 3 | 4; fecha: string }[];
  }[];
  semanasEvaluacion: {
    nombre: string;
    despuesDelModulo: number;
    inicio: string;
    fin: string;
    estado: EstadoPeriodo;
  }[];
}

const FECHAS_EVALUACION = [
  getEvaluation1ReleaseDate,
  getEvaluation2ReleaseDate,
  getEvaluation3ReleaseDate,
  getEvaluation4ReleaseDate,
] as const;

function estadoDePeriodo(inicio: string, fin: string, hoy: string): EstadoPeriodo {
  if (fin < hoy) return "pasado";
  if (inicio > hoy) return "proximo";
  return "actual";
}

export async function construirMiAno(db: Db, userId: string, ahora: Date): Promise<MiAno> {
  const { level } = await loadVorticeInput(db, userId, ahora);
  if (!level) return { nivel: null, inicio: null, fin: null, modulos: [], semanasEvaluacion: [] };

  const config = await resolveCalendarConfig(db, level.id, ahora);
  const hoy = ymdIn(CHILE_TZ, ahora);
  const modulos = Array.from({ length: config.totalModules }, (_, index) => {
    const numero = index + 1;
    const inicio = ymdIn(CHILE_TZ, getModuleStartDate(numero, config));
    const fin = ymdIn(CHILE_TZ, getModuleEndDate(numero, config));
    return {
      numero,
      inicio,
      fin,
      estado: estadoDePeriodo(inicio, fin, hoy),
      evaluaciones: FECHAS_EVALUACION.map((getFecha, i) => ({
        numero: (i + 1) as 1 | 2 | 3 | 4,
        fecha: ymdIn(CHILE_TZ, getFecha(numero, config)),
      })),
    };
  });
  const semanasEvaluacion = getGeneralEvaluationWeeks(config).map((semana) => {
    const inicio = ymdIn(CHILE_TZ, semana.startDate);
    const fin = ymdIn(CHILE_TZ, semana.endDate);
    return {
      nombre: semana.name,
      despuesDelModulo: semana.afterModule,
      inicio,
      fin,
      estado: estadoDePeriodo(inicio, fin, hoy),
    };
  });

  return {
    nivel: level.name,
    inicio: modulos[0]?.inicio ?? null,
    fin: semanasEvaluacion.at(-1)?.fin ?? modulos.at(-1)?.fin ?? null,
    modulos,
    semanasEvaluacion,
  };
}