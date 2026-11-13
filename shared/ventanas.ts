// Ventanas temporales de una instancia de evaluación ordinaria (IMP-016, H1b-1). Funciones puras: no leen el
// reloj del sistema; reciben `ahora` en segundos UTC (el reloj de la base, D6/D7 aprobada el 2026-11-10).
//
// Reglas IMPLEMENTADAS, todas de la especificación maestra (`docs/P0-E/ESPECIFICACION_MAESTRA.md`, `0a0ccaa`):
//  - §3 «Reloj»: T es el fin del módulo según el calendario, a las 23:59 en hora de Chile.
//  - §3 «Reloj» y §2: la extensión automática dura 48 horas REALES, calculadas en UTC, para todos.
//  - §3 «Reloj»: la zona horaria se persiste explícitamente; deben probarse los cambios de horario de verano.
//  - §2 y §3 «Revisión»: la pauta no se muestra hasta terminar la ventana (con la extensión) y una hora más:
//    review_at = T + 49 horas.
//  - §3 «Reloj» y P15 (APROBADO 2026-10-24): fuera de la extensión no se aceptan envíos (409, sin gracia).
//
// NO implementado (reglas pendientes o fuera de IMP-016): ventanas de recuperación y de lotes (P20-v), ventanas
// de excepciones y sustituciones (P18-v, P25), aviso 24 h antes (canal pendiente, P11), formularios externos (P8).
//
// Ambigüedades de texto, resueltas de la forma indicada y puestas a consideración de la dirección:
//  - Instante exacto T+48 h: P15 dice «al alcanzar T+48 horas, la instancia se marca vencida» y §3 dice
//    «después de T+48 horas, un envío tardío se rechaza». Aquí se sigue P15 (aprobada): en `ahora = T+48 h`
//    el envío ya NO se acepta.
//  - T se toma como las 23:59:00 locales (minuto, como está escrito), no 23:59:59.
//  - Si las 23:59 locales no existen o se repiten por un cambio de horario, se lanza `HoraLocalInvalida`: no se
//    elige una de las dos interpretaciones.

export const ZONA_CHILE = "America/Santiago";
export const HORAS_EXTENSION = 48;
export const HORAS_REVISION_TRAS_EXTENSION = 1;
const SEG_POR_HORA = 3600;

export class HoraLocalInvalida extends Error {
  constructor(readonly tipo: "ambigua" | "inexistente", mensaje: string) { super(mensaje); }
}

export interface VentanaOrdinaria {
  /** Zona horaria con que se calculó T (se persiste junto con la instancia). */
  zonaHoraria: string;
  /** Día calendario del fin del módulo, «YYYY-MM-DD». */
  diaFin: string;
  /** T: segundos UTC de las 23:59 locales de `diaFin`. */
  finModulo: number;
  /** T + 48 h reales: fin de la extensión automática; a partir de aquí no se aceptan envíos. */
  finExtension: number;
  /** review_at = T + 49 h. */
  revisionDesde: number;
}

const formato = (zona: string) => new Intl.DateTimeFormat("en-US", {
  timeZone: zona, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
});

// Hora local (como si fuera UTC, en segundos) de un instante UTC en la zona dada.
function localComoUtc(t: number, zona: string): number {
  const p = Object.fromEntries(formato(zona).formatToParts(new Date(t * 1000)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) / 1000;
}

// Todos los instantes UTC cuya hora local en `zona` es la indicada: ninguno (no existe), uno, o dos (se repite).
export function instanteLocal(ymd: string, hora: number, minuto: number, zona: string = ZONA_CHILE): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) throw new RangeError(`Día inválido: ${ymd}`);
  const [y, mes, d] = [+m[1], +m[2], +m[3]];
  const objetivo = Date.UTC(y, mes - 1, d, hora, minuto, 0) / 1000;
  const comprobado = new Date(objetivo * 1000);
  if (comprobado.getUTCFullYear() !== y || comprobado.getUTCMonth() !== mes - 1 || comprobado.getUTCDate() !== d) throw new RangeError(`Día inexistente: ${ymd}`);
  const candidatos = new Set<number>();
  for (const sonda of [objetivo - 86400, objetivo, objetivo + 86400]) {
    const t = objetivo - (localComoUtc(sonda, zona) - sonda);
    if (localComoUtc(t, zona) === objetivo) candidatos.add(t);
  }
  const lista = [...candidatos].sort((a, b) => a - b);
  if (lista.length === 0) throw new HoraLocalInvalida("inexistente", `${ymd} ${hora}:${minuto} no existe en ${zona} (cambio de horario)`);
  if (lista.length > 1) throw new HoraLocalInvalida("ambigua", `${ymd} ${hora}:${minuto} ocurre dos veces en ${zona} (cambio de horario)`);
  return lista[0];
}

/** T: las 23:59 de Chile del día de fin del módulo, en segundos UTC. */
export function finDeModulo(diaFin: string, zona: string = ZONA_CHILE): number {
  return instanteLocal(diaFin, 23, 59, zona);
}

export function ventanaOrdinaria(diaFin: string, zona: string = ZONA_CHILE): VentanaOrdinaria {
  const finModulo = finDeModulo(diaFin, zona);
  const finExtension = finModulo + HORAS_EXTENSION * SEG_POR_HORA;
  return { zonaHoraria: zona, diaFin, finModulo, finExtension, revisionDesde: finExtension + HORAS_REVISION_TRAS_EXTENSION * SEG_POR_HORA };
}

/** ¿Se acepta un envío en `ahora`? No desde T+48 h (P15: «al alcanzar»), sin período de gracia. */
export function envioAceptable(v: Pick<VentanaOrdinaria, "finExtension">, ahora: number): boolean {
  return ahora < v.finExtension;
}

/** ¿Venció la instancia (se alcanzó T+48 h)? Es el complemento exacto de `envioAceptable`. */
export function extensionAgotada(v: Pick<VentanaOrdinaria, "finExtension">, ahora: number): boolean {
  return ahora >= v.finExtension;
}
