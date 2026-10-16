import { addWeeks, addDays, startOfWeek, isBefore, isAfter, isSameDay, format } from "date-fns";
import { es } from "date-fns/locale";

export interface ModuleSchedule {
  moduleNumber: number;
  startDate: Date;
  endDate: Date;
  // 4 mini evaluations: Week 1 Wednesday, Week 1 Friday, Week 2 Wednesday, Week 2 Friday
  evaluation1ReleaseDate: Date; // Week 1 Wednesday
  evaluation2ReleaseDate: Date; // Week 1 Friday
  evaluation3ReleaseDate: Date; // Week 2 Wednesday
  evaluation4ReleaseDate: Date; // Week 2 Friday
  isAvailable: boolean;
  isCompleted: boolean;
  daysUntilStart: number;
  status: "locked" | "available" | "in_progress" | "completed";
  dateRange: string; // Formatted date range for display
}

export interface GeneralEvaluationWeek {
  type: "general_evaluation";
  name: string;
  startDate: Date;
  endDate: Date;
  afterModule: number;
}

export interface CalendarConfig {
  programStartDate: Date;
  moduleDurationWeeks: number;
  totalModules: number;
  generalEvaluationWeeks: { afterModule: number; name: string }[];
  // Opcionales (configs de la base). Sin ellos el cálculo es el original, en la hora local del servidor.
  timeZone?: string; // p. ej. "America/Santiago": todas las fechas son medianoche en esa zona
  breaks?: CalendarBreak[]; // recesos (vacaciones de invierno, etc.)
  holidays?: string[]; // feriados "YYYY-MM-DD"
}

export interface CalendarBreak {
  start: string; // "YYYY-MM-DD", inclusive
  end: string; // "YYYY-MM-DD", inclusive
  name?: string;
}

export const CHILE_TZ = "America/Santiago";

export const DEFAULT_CONFIG: CalendarConfig = {
  programStartDate: new Date(2026, 2, 9), // Monday, March 9, 2026
  moduleDurationWeeks: 2,
  totalModules: 15,
  generalEvaluationWeeks: [
    { afterModule: 7, name: "Semana de Evaluaciones Generales (Primer Semestre)" },
    { afterModule: 15, name: "Semana de Evaluaciones Finales" }
  ]
};

// Día calendario "YYYY-MM-DD" de un instante, en la zona del calendario (o la local del servidor).
export function ymdIn(timeZone: string | undefined, d: Date): string {
  if (!timeZone) return format(d, "yyyy-MM-dd");
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

// Instante de las 00:00 del día `ymd` en `timeZone`.
export function midnightIn(timeZone: string, ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const offset = (t: number) => {
    const p = Object.fromEntries(fmt.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - t;
  };
  const first = utc - offset(utc);
  return new Date(utc - offset(first)); // segunda pasada: corrige si el cambio de hora cae entre medio
}

// Con zona horaria, sumar semanas/días puede derivar ±1 h por el horario de verano (el servidor corre en UTC):
// se vuelve a la medianoche del mismo día calendario. Sin zona horaria no toca nada (comportamiento original).
function snap(config: CalendarConfig, d: Date): Date {
  if (!config.timeZone) return d;
  return midnightIn(config.timeZone, ymdIn(config.timeZone, new Date(d.getTime() + 3 * 3600_000)));
}

function weekStart(config: CalendarConfig, weekIndex: number): Date {
  return snap(config, addWeeks(config.programStartDate, weekIndex));
}

// REGLA DE RECESOS: el calendario avanza en semanas lunes–domingo desde programStartDate. Una semana
// está bloqueada si alguno de sus días lunes a viernes cae dentro de un receso. Un módulo necesita
// `moduleDurationWeeks` semanas libres consecutivas: si alguna cae en receso, el módulo completo se corre
// a la primera semana libre después del receso (nunca se parte en dos), y con él todos los siguientes.
// Las semanas de evaluación general también se corren si caen en receso.
function weekBlocked(config: CalendarConfig, weekIndex: number): boolean {
  if (!config.breaks?.length) return false;
  const monday = weekStart(config, weekIndex);
  for (let i = 0; i < 5; i++) {
    const day = ymdIn(config.timeZone, addDays(monday, i));
    if (config.breaks.some((b) => b.start <= day && day <= b.end)) return true;
  }
  return false;
}

function firstFreeRun(config: CalendarConfig, from: number, length: number): number {
  let w = from;
  // ponytail: tope de 520 semanas (10 años) para que un receso mal cargado no cuelgue el servidor.
  while (w < from + 520) {
    let ok = true;
    for (let i = 0; i < length; i++) if (weekBlocked(config, w + i)) { ok = false; w += i + 1; break; }
    if (ok) return w;
  }
  return from;
}

// Semana (índice desde programStartDate) en que parte cada módulo y cada semana de evaluación general.
// Sin recesos equivale a: (n - 1) * duración + una semana por cada evaluación general anterior al módulo.
function layout(config: CalendarConfig, modules: number): { moduleWeek: number[]; evalWeek: number[] } {
  const moduleWeek: number[] = [];
  const evalWeek: number[] = [];
  let cursor = 0;
  for (let m = 1; m <= modules; m++) {
    cursor = firstFreeRun(config, cursor, config.moduleDurationWeeks);
    moduleWeek[m] = cursor;
    cursor += config.moduleDurationWeeks;
    config.generalEvaluationWeeks.forEach((ev, i) => {
      if (ev.afterModule === m) {
        evalWeek[i] = cursor = firstFreeRun(config, cursor, 1);
        cursor += 1;
      }
    });
  }
  return { moduleWeek, evalWeek };
}

function moduleWeekStart(moduleNumber: number, config: CalendarConfig): Date {
  return weekStart(config, layout(config, moduleNumber).moduleWeek[moduleNumber]);
}

// REGLA DE FERIADOS: una fecha puntual (inicio de módulo, liberación de evaluación) que cae en feriado
// o fin de semana se corre al siguiente día hábil. No mueve el resto del calendario.
function nextSchoolDay(config: CalendarConfig, d: Date): Date {
  if (!config.holidays?.length) return d;
  let day = d;
  for (let i = 0; i < 31; i++) {
    const ymd = ymdIn(config.timeZone, day);
    const weekday = new Date(`${ymd}T12:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6 && !config.holidays.includes(ymd)) return day;
    day = snap(config, addDays(day, 1));
  }
  return d;
}

// Calculate module start date accounting for general evaluation weeks, breaks and holidays
export function getModuleStartDate(moduleNumber: number, config: CalendarConfig = DEFAULT_CONFIG): Date {
  return nextSchoolDay(config, moduleWeekStart(moduleNumber, config));
}

export function getModuleEndDate(moduleNumber: number, config: CalendarConfig = DEFAULT_CONFIG): Date {
  const startDate = moduleWeekStart(moduleNumber, config);
  return snap(config, addDays(addWeeks(startDate, config.moduleDurationWeeks), -1));
}

// 4 mini evaluations per module: miércoles y viernes de las semanas 1 y 2 (corridas si caen en feriado)
function evaluationReleaseDate(moduleNumber: number, week: 0 | 1, weekday: 2 | 4, config: CalendarConfig): Date {
  const monday = snap(config, addWeeks(moduleWeekStart(moduleNumber, config), week));
  return nextSchoolDay(config, snap(config, addDays(monday, weekday))); // Monday + 2 = Wednesday, + 4 = Friday
}

export function getEvaluation1ReleaseDate(moduleNumber: number, config: CalendarConfig = DEFAULT_CONFIG): Date {
  return evaluationReleaseDate(moduleNumber, 0, 2, config); // Week 1 Wednesday
}

export function getEvaluation2ReleaseDate(moduleNumber: number, config: CalendarConfig = DEFAULT_CONFIG): Date {
  return evaluationReleaseDate(moduleNumber, 0, 4, config); // Week 1 Friday
}

export function getEvaluation3ReleaseDate(moduleNumber: number, config: CalendarConfig = DEFAULT_CONFIG): Date {
  return evaluationReleaseDate(moduleNumber, 1, 2, config); // Week 2 Wednesday
}

export function getEvaluation4ReleaseDate(moduleNumber: number, config: CalendarConfig = DEFAULT_CONFIG): Date {
  return evaluationReleaseDate(moduleNumber, 1, 4, config); // Week 2 Friday
}

export function isModuleAvailable(
  moduleNumber: number,
  currentDate: Date,
  previousModuleCompleted: boolean,
  config: CalendarConfig = DEFAULT_CONFIG
): boolean {
  if (moduleNumber === 1) {
    const startDate = getModuleStartDate(1, config);
    return !isBefore(currentDate, startDate);
  }

  const startDate = getModuleStartDate(moduleNumber, config);
  const dateAvailable = !isBefore(currentDate, startDate);

  return dateAvailable && previousModuleCompleted;
}

export function isEvaluationAvailable(
  moduleNumber: number,
  evaluationNumber: 1 | 2 | 3 | 4,
  currentDate: Date,
  config: CalendarConfig = DEFAULT_CONFIG
): boolean {
  let releaseDate: Date;
  switch (evaluationNumber) {
    case 1: releaseDate = getEvaluation1ReleaseDate(moduleNumber, config); break;
    case 2: releaseDate = getEvaluation2ReleaseDate(moduleNumber, config); break;
    case 3: releaseDate = getEvaluation3ReleaseDate(moduleNumber, config); break;
    case 4: releaseDate = getEvaluation4ReleaseDate(moduleNumber, config); break;
  }

  return !isBefore(currentDate, releaseDate);
}

export function getModuleSchedule(
  moduleNumber: number,
  currentDate: Date,
  previousModuleCompleted: boolean,
  currentModuleCompleted: boolean,
  config: CalendarConfig = DEFAULT_CONFIG
): ModuleSchedule {
  const startDate = getModuleStartDate(moduleNumber, config);
  const endDate = getModuleEndDate(moduleNumber, config);
  const evaluation1ReleaseDate = getEvaluation1ReleaseDate(moduleNumber, config);
  const evaluation2ReleaseDate = getEvaluation2ReleaseDate(moduleNumber, config);
  const evaluation3ReleaseDate = getEvaluation3ReleaseDate(moduleNumber, config);
  const evaluation4ReleaseDate = getEvaluation4ReleaseDate(moduleNumber, config);

  const isAvailable = isModuleAvailable(moduleNumber, currentDate, previousModuleCompleted, config);
  const isCompleted = currentModuleCompleted;

  const daysUntilStart = Math.ceil((startDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

  let status: ModuleSchedule["status"];
  if (isCompleted) {
    status = "completed";
  } else if (!isAvailable) {
    status = "locked";
  } else if (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
    status = "in_progress";
  } else {
    status = "available";
  }

  // Format date range for display
  const dateRange = `${format(startDate, "d MMM", { locale: es })} - ${format(endDate, "d MMM", { locale: es })}`;

  return {
    moduleNumber,
    startDate,
    endDate,
    evaluation1ReleaseDate,
    evaluation2ReleaseDate,
    evaluation3ReleaseDate,
    evaluation4ReleaseDate,
    isAvailable,
    isCompleted,
    daysUntilStart: Math.max(0, daysUntilStart),
    status,
    dateRange,
  };
}

export function getAllModulesSchedule(
  currentDate: Date,
  completedModules: number[],
  config: CalendarConfig = DEFAULT_CONFIG,
  adminBypass: boolean = false
): ModuleSchedule[] {
  const schedules: ModuleSchedule[] = [];

  for (let i = 1; i <= config.totalModules; i++) {
    const previousCompleted = i === 1 || completedModules.includes(i - 1);
    const currentCompleted = completedModules.includes(i);

    const schedule = getModuleSchedule(i, currentDate, previousCompleted, currentCompleted, config);

    // Admin bypass: force all modules to be available
    if (adminBypass) {
      schedule.isAvailable = true;
      schedule.status = currentCompleted ? "completed" : "available";
    }

    schedules.push(schedule);
  }

  return schedules;
}

// Get general evaluation weeks
export function getGeneralEvaluationWeeks(config: CalendarConfig = DEFAULT_CONFIG): GeneralEvaluationWeek[] {
  const lastModule = Math.max(0, ...config.generalEvaluationWeeks.map((w) => w.afterModule));
  const { evalWeek: weeks } = layout(config, lastModule);
  return config.generalEvaluationWeeks.map((evalWeek, i) => {
    const startDate = weekStart(config, weeks[i]);
    const endDate = snap(config, addDays(startDate, 6));

    return {
      type: "general_evaluation" as const,
      name: evalWeek.name,
      startDate,
      endDate,
      afterModule: evalWeek.afterModule
    };
  });
}

export function formatModuleDates(schedule: ModuleSchedule): {
  startFormatted: string;
  endFormatted: string;
  eval1Formatted: string;
  eval2Formatted: string;
  eval3Formatted: string;
  eval4Formatted: string;
  dateRangeFormatted: string;
} {
  return {
    startFormatted: format(schedule.startDate, "d 'de' MMMM", { locale: es }),
    endFormatted: format(schedule.endDate, "d 'de' MMMM", { locale: es }),
    eval1Formatted: format(schedule.evaluation1ReleaseDate, "EEEE d 'de' MMMM", { locale: es }),
    eval2Formatted: format(schedule.evaluation2ReleaseDate, "EEEE d 'de' MMMM", { locale: es }),
    eval3Formatted: format(schedule.evaluation3ReleaseDate, "EEEE d 'de' MMMM", { locale: es }),
    eval4Formatted: format(schedule.evaluation4ReleaseDate, "EEEE d 'de' MMMM", { locale: es }),
    dateRangeFormatted: schedule.dateRange,
  };
}

export function getCalendarSummary(config: CalendarConfig = DEFAULT_CONFIG): {
  programStart: string;
  programEnd: string;
  totalDuration: string;
  generalEvaluationWeeks: { name: string; dates: string }[];
} {
  const endDate = getModuleEndDate(config.totalModules, config);
  const totalWeeks = config.totalModules * config.moduleDurationWeeks + config.generalEvaluationWeeks.length;

  const evalWeeks = getGeneralEvaluationWeeks(config);

  return {
    programStart: format(config.programStartDate, "d 'de' MMMM, yyyy", { locale: es }),
    programEnd: format(addDays(endDate, 7), "d 'de' MMMM, yyyy", { locale: es }), // +1 week for final eval
    totalDuration: `${totalWeeks} semanas (${config.totalModules} módulos + ${config.generalEvaluationWeeks.length} semanas de evaluaciones)`,
    generalEvaluationWeeks: evalWeeks.map(w => ({
      name: w.name,
      dates: `${format(w.startDate, "d 'de' MMMM", { locale: es })} - ${format(w.endDate, "d 'de' MMMM", { locale: es })}`
    }))
  };
}
