// Brújula™, panel del estudiante: métricas (cuánto lleva, cuánto falta, ritmo) y mensajes de orientación.
// Lógica pura: recibe el resumen del estudiante y las fechas del calendario ya resueltas, y devuelve el panel.
// Tono: orienta y propone, sin castigos, rachas ni puntajes (misma regla que shared/brujula.ts).
import type { OverviewSubjectInput } from "./vortice";
import type { IntensidadBrujula } from "./brujula";

export interface FechasModulo {
  inicio: Date;
  fin: Date;
  /** Fecha de liberación de las evaluaciones 1 a 4 del módulo. */
  evaluaciones: Partial<Record<1 | 2 | 3 | 4, Date>>;
}
/** Fechas del calendario de un módulo (su número = weekNumber del objetivo). */
export type FechasDeModulo = (levelSubjectId: string, moduleNumber: number) => FechasModulo;

/** Convierte un instante a día calendario "YYYY-MM-DD" en la zona del calendario. */
export type YmdInFn = (d: Date) => string;
/** Convierte un día calendario "YYYY-MM-DD" a instante (medianoche) en la zona del calendario. */
export type MidnightInFn = (ymd: string) => Date;

export type Ritmo = "al_dia" | "atrasado" | "adelantado" | "sin_datos";
export type Tono = "alerta" | "aviso" | "info" | "ok";

export interface MetricaAsignatura {
  levelSubjectId: string;
  subjectName: string;
  percent: number | null;
  completados: number;
  total: number;
  faltan: number;
  /** Módulos cuya ventana del calendario ya terminó, y cuántos de ellos cerró el estudiante. */
  modulosVencidos: number;
  modulosVencidosCerrados: number;
  ritmo: Ritmo;
  moduloActual: { code: string; title: string; diasParaTerminar: number; faltan: number } | null;
}

export interface MensajeBrujula { id: string; tono: Tono; texto: string; levelSubjectId?: string }

export interface ProximaEvaluacion { titulo: string; subjectName: string; levelSubjectId: string; fecha: string; dias: number }

export interface PanelBrujula {
  avanceTotal: number | null;
  faltanTotal: number;
  metricas: MetricaAsignatura[];
  proximaEvaluacion: ProximaEvaluacion | null;
  mensajes: MensajeBrujula[];
}

const MAX_MENSAJES = 5;
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

// Días calendario hasta una fecha, contados sobre días civiles "YYYY-MM-DD" de la zona del calendario
// (Chile). Se resta como fechas civiles (UTC puro), sin volver a convertir a instantes: así el cambio de
// horario (p. ej. el 5-sep-2027, cuando la medianoche no existe) no altera el conteo.
// Sin zona horaria (pruebas puras) cae a 24 h exactas.
const diasHasta = (fecha: Date, now: Date, ymdIn?: YmdInFn, _midnightIn?: MidnightInFn) => {
  if (ymdIn) {
    const civil = (ymd: string) => { const [y, m, d] = ymd.split("-").map(Number); return Date.UTC(y, m - 1, d); };
    return Math.max(0, Math.round((civil(ymdIn(fecha)) - civil(ymdIn(now))) / 86_400_000));
  }
  return Math.max(0, Math.ceil((fecha.getTime() - now.getTime()) / 86_400_000));
};
const ORDEN: Record<Tono, number> = { alerta: 0, aviso: 1, info: 2, ok: 3 };

export function calcularPanel(p: {
  subjects: readonly OverviewSubjectInput[];
  completed: ReadonlySet<string>;
  passed: ReadonlySet<string>;
  now: Date;
  fechas: FechasDeModulo;
  /** Opcional: convierte un instante a día calendario en la zona del calendario. */
  ymdIn?: YmdInFn;
  /** Opcional: convierte un día calendario a instante (medianoche) en la zona del calendario. */
  midnightIn?: MidnightInFn;
}): PanelBrujula {
  const { now, ymdIn, midnightIn } = p;
  const metricas: MetricaAsignatura[] = [];
  const mensajes: MensajeBrujula[] = [];
  const evaluaciones: ProximaEvaluacion[] = [];
  let total = 0, hechos = 0;

  for (const s of p.subjects) {
    let sTotal = 0, sHechos = 0, vencidos = 0, vencidosCerrados = 0, cerrados = 0;
    let actual: MetricaAsignatura["moduloActual"] = null;

    for (const oa of [...s.objectives].sort((a, b) => a.weekNumber - b.weekNumber || a.sortOrder - b.sortOrder)) {
      const recursos = oa.resources.map((r) => p.completed.has(r.id));
      const evals = (oa.evaluations ?? []).map((e) => ({ e, ok: p.passed.has(e.id) }));
      const items = recursos.length + evals.length;
      if (items === 0) continue; // módulo sin contenido: no cuenta para el ritmo
      const hechosOa = recursos.filter(Boolean).length + evals.filter((x) => x.ok).length;
      sTotal += items; sHechos += hechosOa;
      const cerrado = hechosOa === items;
      const f = p.fechas(s.levelSubjectId, oa.weekNumber);
      if (cerrado) cerrados++;
      if (f.fin.getTime() < now.getTime()) { vencidos++; if (cerrado) vencidosCerrados++; }
      else if (f.inicio.getTime() <= now.getTime() && !actual) {
        actual = { code: oa.code, title: oa.title, diasParaTerminar: diasHasta(f.fin, now, ymdIn, midnightIn), faltan: items - hechosOa };
      }
      if (!cerrado) {
        for (const { e, ok } of evals) {
          const n = e.evaluationNumber as 1 | 2 | 3 | 4;
          const fecha = n >= 1 && n <= 4 ? f.evaluaciones[n] : undefined;
          if (!ok && fecha) evaluaciones.push({ titulo: e.title, subjectName: s.subjectName, levelSubjectId: s.levelSubjectId, fecha: fecha.toISOString(), dias: fecha.getTime() <= now.getTime() ? 0 : diasHasta(fecha, now, ymdIn, midnightIn) });
        }
      }
    }

    const ritmo: Ritmo = sTotal === 0 ? "sin_datos" : vencidosCerrados < vencidos ? "atrasado" : cerrados > vencidos ? "adelantado" : "al_dia";
    total += sTotal; hechos += sHechos;
    metricas.push({
      levelSubjectId: s.levelSubjectId, subjectName: s.subjectName,
      percent: sTotal === 0 ? null : Math.round((sHechos / sTotal) * 100),
      completados: sHechos, total: sTotal, faltan: sTotal - sHechos,
      modulosVencidos: vencidos, modulosVencidosCerrados: vencidosCerrados, ritmo, moduloActual: actual,
    });

    // Atraso: orienta a recuperar, sin culpar.
    const atraso = vencidos - vencidosCerrados;
    if (ritmo === "atrasado") {
      mensajes.push({
        id: `atraso-${s.levelSubjectId}`, levelSubjectId: s.levelSubjectId, tono: atraso >= 2 ? "alerta" : "aviso",
        texto: `Vas atrasado en ${s.subjectName}: te ${atraso === 1 ? "falta" : "faltan"} cerrar ${plural(atraso, "módulo", "módulos")} que ya pasó. Cerrar uno por semana te pone al día.`,
      });
    }
    // Cierre del módulo en curso.
    if (actual && actual.diasParaTerminar <= 7 && actual.faltan > 0) {
      mensajes.push({
        id: `cierre-${s.levelSubjectId}`, levelSubjectId: s.levelSubjectId, tono: "aviso",
        texto: `Se acerca el cierre de ${actual.code} en ${s.subjectName}: ${actual.diasParaTerminar === 0 ? "termina hoy" : `quedan ${plural(actual.diasParaTerminar, "día", "días")}`} y te ${actual.faltan === 1 ? "falta" : "faltan"} ${plural(actual.faltan, "actividad", "actividades")}.`,
      });
    }
  }

  // Próxima evaluación: la de fecha futura más cercana; si hay una ya disponible sin aprobar, se avisa aparte.
  const futuras = evaluaciones.filter((e) => new Date(e.fecha).getTime() > now.getTime()).sort((a, b) => a.dias - b.dias);
  const proxima = futuras[0] ?? null;
  if (proxima && proxima.dias <= 21) {
    mensajes.push({
      id: "proxima-evaluacion", levelSubjectId: proxima.levelSubjectId, tono: proxima.dias <= 7 ? "aviso" : "info",
      texto: `Te ${proxima.dias === 1 ? "falta" : "faltan"} ${plural(proxima.dias, "día", "días")} para «${proxima.titulo}» de ${proxima.subjectName}.`,
    });
  }
  const abiertas = evaluaciones.filter((e) => new Date(e.fecha).getTime() <= now.getTime());
  if (abiertas.length) {
    const e = abiertas[0];
    mensajes.push({
      id: "evaluacion-disponible", levelSubjectId: e.levelSubjectId, tono: "aviso",
      texto: abiertas.length === 1 ? `«${e.titulo}» de ${e.subjectName} ya está disponible.` : `Tienes ${abiertas.length} evaluaciones disponibles, entre ellas «${e.titulo}» de ${e.subjectName}.`,
    });
  }

  if (metricas.length && metricas.every((m) => m.ritmo === "sin_datos")) {
    mensajes.push({ id: "sin-contenido", tono: "info", texto: "Aún no hay contenido liberado para mostrarte avance. Vuelve cuando se abra tu primer módulo." });
  } else if (!metricas.some((m) => m.ritmo === "atrasado") && metricas.some((m) => m.ritmo === "al_dia" || m.ritmo === "adelantado")) {
    mensajes.push({ id: "al-dia", tono: "ok", texto: "Vas al día con tu calendario. Sigue con el plan de la semana." });
  }

  mensajes.sort((a, b) => ORDEN[a.tono] - ORDEN[b.tono]);
  return {
    avanceTotal: total === 0 ? null : Math.round((hechos / total) * 100),
    faltanTotal: total - hechos,
    metricas,
    proximaEvaluacion: proxima,
    mensajes: mensajes.slice(0, MAX_MENSAJES),
  };
}

export type EstadoRitmoApoderado = "al_dia" | "por_recuperar" | "adelantado" | "sin_datos";

export interface ResumenBrujulaApoderado {
  estadoGeneral: EstadoRitmoApoderado;
  etiquetaEstado: string;
  intensidad: IntensidadBrujula;
  bloquesPlanificados: number;
  bloquesCompletados: number;
  proximaEvaluacion: { titulo: string; subjectName: string; dias: number } | null;
  orientacion: string[];
  asignaturas: { subjectName: string; estado: EstadoRitmoApoderado; etiquetaEstado: string }[];
}

const ETIQUETA_ESTADO_APODERADO: Record<EstadoRitmoApoderado, string> = {
  al_dia: "Al día",
  por_recuperar: "Por retomar a su ritmo",
  adelantado: "Adelantado",
  sin_datos: "Sin contenido aún",
};

const aEstadoApoderado = (r: Ritmo): EstadoRitmoApoderado =>
  r === "atrasado" ? "por_recuperar" : r;

/**
 * Vista de Brújula para el apoderado (C5/D4): ritmo cualitativo, bloques semanales
 * y orientación constructiva, sin porcentajes ni puntajes de evaluación.
 */
export function resumenBrujulaParaApoderado(
  panel: PanelBrujula,
  agenda: { intensidad: IntensidadBrujula; bloquesPlanificados: number; bloquesCompletados: number },
): ResumenBrujulaApoderado {
  const asignaturas = panel.metricas.map((m) => {
    const estado = aEstadoApoderado(m.ritmo);
    return {
      subjectName: m.subjectName,
      estado,
      etiquetaEstado: ETIQUETA_ESTADO_APODERADO[estado],
    };
  });

  let estadoGeneral: EstadoRitmoApoderado = "sin_datos";
  if (asignaturas.some((a) => a.estado === "por_recuperar")) {
    estadoGeneral = "por_recuperar";
  } else if (asignaturas.some((a) => a.estado === "adelantado")) {
    estadoGeneral = "adelantado";
  } else if (asignaturas.some((a) => a.estado === "al_dia")) {
    estadoGeneral = "al_dia";
  }

  const orientacion: string[] = [];
  if (estadoGeneral === "por_recuperar") {
    orientacion.push("Tiene módulos pendientes por retomar; acompañarlo con bloques cortos esta semana ayuda a ponerse al día a su ritmo.");
  } else if (estadoGeneral === "al_dia" || estadoGeneral === "adelantado") {
    orientacion.push("Va al día con su calendario semanal.");
  } else {
    orientacion.push("Aún no hay contenido liberado para observar el ritmo esta semana.");
  }

  if (agenda.bloquesPlanificados > 0) {
    if (agenda.bloquesCompletados >= agenda.bloquesPlanificados) {
      orientacion.push(`Completó los ${agenda.bloquesPlanificados} bloques de estudio planificados esta semana.`);
    } else {
      orientacion.push(`Lleva ${agenda.bloquesCompletados} de ${agenda.bloquesPlanificados} bloques de estudio planificados esta semana.`);
    }
  }

  if (panel.proximaEvaluacion) {
    const cuando = panel.proximaEvaluacion.dias === 0
      ? "disponible hoy"
      : `en ${plural(panel.proximaEvaluacion.dias, "día", "días")}`;
    orientacion.push(`Próxima evaluación: «${panel.proximaEvaluacion.titulo}» de ${panel.proximaEvaluacion.subjectName} (${cuando}).`);
  }

  return {
    estadoGeneral,
    etiquetaEstado: ETIQUETA_ESTADO_APODERADO[estadoGeneral],
    intensidad: agenda.intensidad,
    bloquesPlanificados: agenda.bloquesPlanificados,
    bloquesCompletados: agenda.bloquesCompletados,
    proximaEvaluacion: panel.proximaEvaluacion
      ? {
          titulo: panel.proximaEvaluacion.titulo,
          subjectName: panel.proximaEvaluacion.subjectName,
          dias: panel.proximaEvaluacion.dias,
        }
      : null,
    orientacion: orientacion.slice(0, 3),
    asignaturas,
  };
}
