// Módulo puro: cálculos de calendario 2027 por nivel.
// Sin acceso a datos. Reutiliza las funciones exportadas de server/calendarUtils.ts.
// Para usarlo desde script/ se importa vía ruta relativa; desde server/ vía @shared/calendario2027.

import {
  addDays,
  differenceInWeeks,
  format,
  isBefore,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  CHILE_TZ,
  DEFAULT_CONFIG,
  getModuleEndDate,
  getGeneralEvaluationWeeks,
  ymdIn,
  midnightIn,
  type CalendarConfig,
  type CalendarBreak,
} from "../server/calendarUtils";
import type { CalendarConfigInput } from "./schema";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface Perfil2027 {
  id: string;
  nombre: string;
  cierre: string; // "YYYY-MM-DD" tope de cierre (inclusive)
  inicio: string; // "YYYY-MM-DD" fecha de inicio (lunes)
}

export interface CalculoCalendario {
  perfil: string;
  config: CalendarConfig;
  fechaInicio: string;
  fechaFinModulos: string; // último día del último módulo
  fechaFinEvaluaciones: string; // último día de la última evaluación general
  semanasTotales: number; // semanas ocupadas (módulos + evaluaciones + corrimientos)
  semanasDisponibles: number; // semanas entre inicio y cierre
  cabe: boolean; // ¿el plan completo cabe antes del cierre?
  modulosQueCaben: number; // cuántos módulos de 2 semanas caben antes del tope
  semanasFaltan: number; // positivo = faltan, negativo = sobran (0 = justo)
}

export interface OpcionAjuste {
  descripcion: string;
  totalModulos: number;
  duracionSemanas: number;
  semanasEvaluacion: number;
  semanasTotales: number;
  fechaFin: string;
  cabe: boolean;
  semanasFaltan: number;
  nota?: string;
}

// ---------------------------------------------------------------------------
// Supuestos 2027 (NO son datos oficiales; la resolución del Mineduc 2027 no está publicada)
// ---------------------------------------------------------------------------

export const SUPUESTOS_2027: {
  breaks: CalendarBreak[];
  holidays: string[];
  nota: string;
} = {
  // SUPUESTO: reemplazar por la resolución exenta 2027
  breaks: [
    { start: "2027-07-05", end: "2027-07-16", name: "Receso de invierno (2 semanas)" },
    // SUPUESTO: reemplazar por la resolución exenta 2027
    { start: "2027-09-13", end: "2027-09-17", name: "Semana de Fiestas Patrias" },
  ],
  // PENDIENTE: feriados exactos 2027 (lista vacía hasta que se publiquen)
  holidays: [],
  nota: "Supuestos basados en patrones 2026. Reemplazar con resolución exenta Mineduc 2027.",
};

// ---------------------------------------------------------------------------
// Perfiles 2027
// ---------------------------------------------------------------------------

export const PERFILES_2027: Perfil2027[] = [
  {
    id: "general",
    nombre: "1.º básico – 3.º medio",
    cierre: "2027-10-15", // viernes 15 de octubre de 2027
    inicio: "2027-03-08", // lunes 8 de marzo de 2027
  },
  {
    id: "cuarto_medio",
    nombre: "4.º medio",
    cierre: "2027-09-15", // miércoles 15 de septiembre de 2027
    inicio: "2027-03-08", // lunes 8 de marzo de 2027
  },
];

// ---------------------------------------------------------------------------
// Funciones de cálculo
// ---------------------------------------------------------------------------

/** Suma `n` días a un día civil "YYYY-MM-DD" (UTC puro, sin horario de verano). */
export function ymdMasDias(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
/** Viernes (día civil) de una semana de evaluación general. Se calcula desde el lunes y por días civiles:
 *  restar desde el domingo falla la semana del 5-sep-2027, cuando la medianoche local no existe. */
const viernesDeEvaluacion = (e: { startDate: Date }) => ymdMasDias(ymdIn(CHILE_TZ, e.startDate), 4);

// Construye un CalendarConfig para un perfil 2027 dado.
export function buildConfig2027(
  perfil: Perfil2027,
  overrides: Partial<CalendarConfig> = {}
): CalendarConfig {
  const startDate = midnightIn(CHILE_TZ, perfil.inicio);
  return {
    programStartDate: startDate, // siempre forzar el inicio del perfil
    moduleDurationWeeks: DEFAULT_CONFIG.moduleDurationWeeks,
    totalModules: DEFAULT_CONFIG.totalModules,
    generalEvaluationWeeks: DEFAULT_CONFIG.generalEvaluationWeeks,
    timeZone: CHILE_TZ,
    breaks: [],
    holidays: [],
    ...overrides,
  };
}

// Calcula el calendario completo para un config y un tope de cierre.
// La "fecha de fin" del plan es el viernes de la última semana de evaluación general,
// porque el cierre escolar también es un viernes (día hábil).
export function calcularCalendario(config: CalendarConfig, cierre: string): CalculoCalendario {
  const perfil = "perfil"; // placeholder; el caller puede ajustar
  const fechaInicio = ymdIn(CHILE_TZ, config.programStartDate);

  // Fechas de fin de módulos y evaluaciones
  const ultimoModulo = config.totalModules;
  const fechaFinModulos = ymdIn(CHILE_TZ, getModuleEndDate(ultimoModulo, config));

  const evalWeeks = getGeneralEvaluationWeeks(config);
  const ultimaEval = evalWeeks[evalWeeks.length - 1];
  // La evaluación general es una semana (lunes a domingo). El último día hábil es el viernes.
  // endDate = lunes + 6 días = domingo. Restamos 2 días para obtener el viernes.
  const viernesUltimaEval = viernesDeEvaluacion(ultimaEval);
  const finModulosYmd = ymdIn(CHILE_TZ, getModuleEndDate(ultimoModulo, config));
  // Si hay módulos después de la última evaluación general (p. ej. con menos módulos), manda el fin del último módulo.
  const fechaFinEvaluaciones = (viernesUltimaEval >= finModulosYmd ? viernesUltimaEval : finModulosYmd);

  // Semanas totales ocupadas: desde inicio hasta el viernes de la última evaluación
  const inicioDate = config.programStartDate;
  const finDate = midnightIn(CHILE_TZ, fechaFinEvaluaciones);
  // Sumamos 1 día para incluir el último día
  const semanasTotales = Math.round((addDays(finDate, 1).getTime() - inicioDate.getTime()) / (7 * 86_400_000));

  // Semanas disponibles entre inicio y cierre
  const cierreDate = midnightIn(CHILE_TZ, cierre);
  const semanasDisponibles = Math.round((addDays(cierreDate, 1).getTime() - inicioDate.getTime()) / (7 * 86_400_000));

  // ¿Cabe?
  const cabe = fechaFinEvaluaciones <= cierre;

  // Cuántos módulos de 2 semanas caben antes del tope (sin evaluaciones)
  // Se calcula iterativamente: se van agregando módulos hasta que el fin supere el tope
  const modulosQueCaben = contarModulosQueCaben(config, cierre);

  // Semanas que faltan o sobran:
  // positivo = faltan (no cabe), negativo = sobran (cabe con holgura), 0 = justo
  let semanasFaltan: number;
  if (cabe) {
    semanasFaltan = semanasTotales - semanasDisponibles; // cero o negativo: sobran
  } else {
    semanasFaltan = semanasTotales - semanasDisponibles; // positivo: faltan
  }
  // Evitar -0 (quirk de JavaScript)
  if (semanasFaltan === 0) semanasFaltan = 0;

  return {
    perfil,
    config,
    fechaInicio,
    fechaFinModulos,
    fechaFinEvaluaciones,
    semanasTotales: Math.abs(semanasTotales),
    semanasDisponibles: Math.abs(semanasDisponibles),
    cabe,
    modulosQueCaben,
    semanasFaltan,
  };
}

// Cuántos módulos de `moduleDurationWeeks` semanas caben antes del tope,
// considerando recesos y evaluaciones generales intermedias.
// Se prueba cada cantidad de módulos (de más a menos) hasta encontrar una cuyo
// viernes de la última evaluación general no supere el cierre.
/** Config con `m` módulos: las evaluaciones generales anteriores se conservan y la final pasa a ir tras el módulo `m`. */
export function configConModulos(config: CalendarConfig, m: number): CalendarConfig {
  const evals = config.generalEvaluationWeeks;
  const ultima = evals[evals.length - 1];
  const previas = evals.filter((e) => e.afterModule < m && e !== ultima);
  return { ...config, totalModules: m, generalEvaluationWeeks: ultima ? [...previas, { ...ultima, afterModule: m }] : previas };
}

function contarModulosQueCaben(config: CalendarConfig, cierre: string): number {
  const cierreDate = midnightIn(CHILE_TZ, cierre);
  for (let m = config.totalModules; m >= 1; m--) {
    // Config con solo m módulos y sus evaluaciones correspondientes
    const cfgReducido = configConModulos(config, m);

    const evalWeeks = getGeneralEvaluationWeeks(cfgReducido);
    const ultima = evalWeeks[evalWeeks.length - 1];
    // Viernes de la última evaluación (o fin del último módulo si no hay evals)
    const finReal = ultima
      ? (viernesDeEvaluacion(ultima) >= ymdIn(CHILE_TZ, getModuleEndDate(m, cfgReducido)) ? viernesDeEvaluacion(ultima) : ymdIn(CHILE_TZ, getModuleEndDate(m, cfgReducido)))
      : ymdIn(CHILE_TZ, getModuleEndDate(m, cfgReducido));

    if (finReal <= cierre) {
      return m;
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Opciones de ajuste
// ---------------------------------------------------------------------------

export function opcionesDeAjuste(perfil: Perfil2027, conRecesos: boolean): OpcionAjuste[] {
  const opciones: OpcionAjuste[] = [];
  const breaks = conRecesos ? SUPUESTOS_2027.breaks : [];
  const holidays = SUPUESTOS_2027.holidays;

  // Opción 1: plan actual (15 módulos + 2 evals) sin cambios
  const config1 = buildConfig2027(perfil, { breaks, holidays });
  const calc1 = calcularCalendario(config1, perfil.cierre);
  opciones.push({
    descripcion: "Plan actual: 15 módulos de 2 semanas + 2 semanas de evaluación",
    totalModulos: 15,
    duracionSemanas: 2,
    semanasEvaluacion: 2,
    semanasTotales: calc1.semanasTotales,
    fechaFin: calc1.fechaFinEvaluaciones,
    cabe: calc1.cabe,
    semanasFaltan: calc1.semanasFaltan,
    nota: calc1.cabe
      ? "El plan cabe dentro del tope."
      : `No cabe: faltan ${Math.abs(calc1.semanasFaltan)} semanas.`,
  });

  // Opción 2: reducir módulos hasta que quepa
  if (!calc1.cabe) {
    const modulosNecesarios = calc1.modulosQueCaben;
    if (modulosNecesarios > 0) {
      const config2 = buildConfig2027(perfil, {
        breaks,
        holidays,
        totalModules: modulosNecesarios,
        generalEvaluationWeeks: configConModulos(DEFAULT_CONFIG, modulosNecesarios).generalEvaluationWeeks,
      });
      const calc2 = calcularCalendario(config2, perfil.cierre);
      opciones.push({
        descripcion: `Reducir a ${modulosNecesarios} módulos (ajuste mínimo)`,
        totalModulos: modulosNecesarios,
        duracionSemanas: 2,
        semanasEvaluacion: config2.generalEvaluationWeeks.length,
        semanasTotales: calc2.semanasTotales,
        fechaFin: calc2.fechaFinEvaluaciones,
        cabe: calc2.cabe,
        semanasFaltan: calc2.semanasFaltan,
        nota: `Se eliminan ${15 - modulosNecesarios} módulos.`,
      });
    }
  }

  // Opción 3: avanzar fecha de inicio para que quepan 15 módulos
  // Se calcula cuántas semanas atrás hay que mover el inicio
  if (!calc1.cabe) {
    const semanasExceso = Math.abs(calc1.semanasFaltan);
    const nuevoInicio = midnightIn(
      CHILE_TZ,
      ymdIn(CHILE_TZ, addDays(config1.programStartDate, -7 * semanasExceso))
    );
    // Ajustar al lunes más cercano
    const lunesInicio = startOfWeek(nuevoInicio, { weekStartsOn: 1 });
    const config3 = buildConfig2027(perfil, {
      breaks,
      holidays,
      programStartDate: midnightIn(CHILE_TZ, ymdIn(CHILE_TZ, lunesInicio)),
    });
    const calc3 = calcularCalendario(config3, perfil.cierre);
    opciones.push({
      descripcion: `Avanzar inicio al ${ymdIn(CHILE_TZ, config3.programStartDate)}`,
      totalModulos: 15,
      duracionSemanas: 2,
      semanasEvaluacion: 2,
      semanasTotales: calc3.semanasTotales,
      fechaFin: calc3.fechaFinEvaluaciones,
      cabe: calc3.cabe,
      semanasFaltan: calc3.semanasFaltan,
      nota: `Inicio ${semanasExceso} semanas antes del original.`,
    });
  }

  // Opción 4: módulos de 1 semana (acortar duración)
  const config4 = buildConfig2027(perfil, {
    breaks,
    holidays,
    moduleDurationWeeks: 1,
  });
  const calc4 = calcularCalendario(config4, perfil.cierre);
  opciones.push({
    descripcion: "Módulos de 1 semana (en vez de 2)",
    totalModulos: 15,
    duracionSemanas: 1,
    semanasEvaluacion: 2,
    semanasTotales: calc4.semanasTotales,
    fechaFin: calc4.fechaFinEvaluaciones,
    cabe: calc4.cabe,
    semanasFaltan: calc4.semanasFaltan,
    nota: "Cada módulo dura 1 semana en vez de 2.",
  });

  return opciones;
}

// ---------------------------------------------------------------------------
// Utilidades de formato
// ---------------------------------------------------------------------------

export function formatearFecha(ymd: string): string {
  const d = midnightIn(CHILE_TZ, ymd);
  return format(d, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
}

export function imprimirTablaOpciones(perfil: Perfil2027, conRecesos: boolean): string {
  const opciones = opcionesDeAjuste(perfil, conRecesos);
  const recesoLabel = conRecesos ? "CON recesos supuestos" : "SIN recesos";
  let salida = `\n=== ${perfil.nombre} (${recesoLabel}) ===\n`;
  salida += `Inicio: ${formatearFecha(perfil.inicio)}\n`;
  salida += `Cierre: ${formatearFecha(perfil.cierre)}\n`;
  salida += `-`.repeat(80) + "\n";

  for (const op of opciones) {
    const estado = op.cabe ? "✓ CABE" : "✗ NO CABE";
    salida += `\n${op.descripcion}\n`;
    salida += `  ${estado}\n`;
    salida += `  Módulos: ${op.totalModulos} × ${op.duracionSemanas} sem + ${op.semanasEvaluacion} sem evaluación\n`;
    salida += `  Semanas totales: ${op.semanasTotales}\n`;
    salida += `  Fecha de fin: ${formatearFecha(op.fechaFin)}\n`;
    if (op.nota) salida += `  Nota: ${op.nota}\n`;
  }

  return salida;
}

// ---------------------------------------------------------------------------
// Niveles escolares 2027 y plan por nivel (T36)
// ---------------------------------------------------------------------------

export const NIVELES_GENERAL_2027 = ["1b", "2b", "3b", "4b", "5b", "6b", "7b", "8b", "1m", "2m", "3m"] as const;

export const NIVEL_CUARTO_MEDIO_2027 = "4m" as const;

export const NIVELES_ESCOLARES_2027 = [...NIVELES_GENERAL_2027, NIVEL_CUARTO_MEDIO_2027] as const;

/** Retorna los 12 perfiles CalendarConfigInput para cargar en program_calendar (año 2027).
 *  11 niveles generales (1b-3m): 15 módulos, evaluaciones tras 7 y 15.
 *  4m: 12 módulos, evaluaciones tras 7 y 12.
 *  Sin recesos, sin filas NULL ni niveles de adultos. */
export function planCalendario2027PorNivel(): CalendarConfigInput[] {
  const resultado: CalendarConfigInput[] = [];

  for (const nivel of NIVELES_GENERAL_2027) {
    resultado.push({
      academicYear: 2027,
      levelId: nivel,
      startDate: "2027-03-08",
      moduleDurationWeeks: 2,
      totalModules: 15,
      generalEvaluationWeeks: [
        { afterModule: 7, name: "Semana de Evaluaciones Generales (Primer Semestre)" },
        { afterModule: 15, name: "Semana de Evaluaciones Finales" },
      ],
      breaks: [],
      holidays: [],
    });
  }

  resultado.push({
    academicYear: 2027,
    levelId: NIVEL_CUARTO_MEDIO_2027,
    startDate: "2027-03-08",
    moduleDurationWeeks: 2,
    totalModules: 12,
    generalEvaluationWeeks: [
      { afterModule: 7, name: "Semana de Evaluaciones Generales (Primer Semestre)" },
      { afterModule: 12, name: "Semana de Evaluaciones Finales" },
    ],
    breaks: [],
    holidays: [],
  });

  return resultado;
}
