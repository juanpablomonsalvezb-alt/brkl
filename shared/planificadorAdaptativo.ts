// Planificador Adaptativo («Mi calendario») · Lógica pura y determinista (Etapa 1).
// Sin acceso a BD, sin reloj del sistema, sin IA generativa y sin mutar el calendario oficial.
// Respeta:
// - 01 §2.1: nunca mezcla dominio K6 dentro del porcentaje de avance curricular.
// - D1: los bloques de confirmación K6 de un OA practicado hoy se agendan estrictamente en `fecha > hoyYmd`.
// - NI1-NI5 / O7: cero notas, puntajes ni menciones de reprobación E2.
// - UDL por tramo: `basica-1-4` simplificado (sin proyecciones numéricas ni brechas porcentuales).
import { z } from "zod";
import {
  CONFIG_INTENSIDAD,
  INTENSIDADES,
  ymdMasDiasCivil,
  type FranjaBrujula,
  type IntensidadBrujula,
  type PreferenciasBrujula,
} from "./brujula";
import type { DeliveryMode, VorticeTrack } from "./vortice";

export type EstadoRitmoPlanificador =
  | "sin_datos"
  | "riesgo_evaluacion"
  | "atraso_significativo"
  | "levemente_atrasado"
  | "adelantado"
  | "en_ritmo";

export type PrioridadBloque =
  | "evaluacion_proxima"
  | "atraso"
  | "en_curso"
  | "repaso_pre_evaluacion"
  | "retencion_m4"
  | "confirmacion_k6_otro_dia"
  | "repaso_base";

export interface RangoFechasCivil {
  inicio: string; // YYYY-MM-DD
  fin: string; // YYYY-MM-DD
  nombre?: string;
}

export interface ActividadPlanificable {
  id: string;
  tipo: "leccion_aula" | "recurso" | "evaluacion";
  titulo: string;
  levelSubjectId: string;
  subjectName: string;
  deliveryMode: DeliveryMode;
  objectiveId: string;
  objectiveCode: string;
  objectiveTitle: string;
  moduleNumber: number;
  moduleOpen: boolean;
  completada: boolean;
  fechaObjetivo?: string | null; // YYYY-MM-DD (ej. liberación de evaluación)
  href: string;
}

export interface ModuloPlanificado {
  levelSubjectId: string;
  subjectName: string;
  subjectSlug: string;
  deliveryMode: DeliveryMode;
  moduleNumber: number;
  objectiveId: string;
  objectiveCode: string;
  objectiveTitle: string;
  inicioYmd: string;
  finYmd: string;
  disponible: boolean;
  actividades: ActividadPlanificable[];
  evaluaciones: Array<{
    id: string;
    titulo: string;
    numero: 1 | 2 | 3 | 4;
    fechaYmd: string;
    aprobada: boolean;
    href: string;
  }>;
}

export interface OaConfirmacionOtroDia {
  oaId: string;
  nombre: string;
  ultimoDiaPractica: string | null; // YYYY-MM-DD
  levelSubjectId: string;
  subjectName: string;
  objectiveId: string | null;
}

export interface RetencionPendienteInput {
  oaId: string;
  nombre: string;
  diasEsperando: number;
  levelSubjectId: string;
  subjectName: string;
}

export interface BaseSugeridaInput {
  itemId: string;
  nombre: string;
  levelSubjectId: string;
  subjectName: string;
}

export interface ProximaEvaluacionCalendario {
  id: string;
  titulo: string;
  levelSubjectId: string;
  subjectName: string;
  moduleNumber: number;
  fechaYmd: string;
  diasRestantes: number;
  pendientesDelModulo: number;
  href: string;
}

export interface ComparacionAsignatura {
  levelSubjectId: string;
  subjectName: string;
  deliveryMode: DeliveryMode;
  totalActividades: number;
  completadas: number;
  pendientes: number;
  esperadoALaFecha: number;
  brechaItems: number;
  brechaPct: number | null;
  modulosVencidos: number;
  modulosVencidosCerrados: number;
  modulosCerrados: number;
  estadoRitmo: EstadoRitmoPlanificador;
}

export interface ComparacionPlanReal {
  totalActividades: number;
  completadas: number;
  pendientes: number;
  esperadoALaFecha: number;
  brechaItems: number;
  brechaPct: number | null;
  modulosVencidos: number;
  modulosVencidosCerrados: number;
  modulosCerrados: number;
  enPeriodoGracia: boolean;
  porAsignatura: ComparacionAsignatura[];
}

export interface RecomendacionAdaptativa {
  id: string;
  prioridad: "alta" | "media" | "baja";
  titulo: string;
  mensaje: string;
  accionTexto: string;
  accionHref: string;
}

export interface BloqueSimulado {
  id: string;
  fecha: string; // YYYY-MM-DD (America/Santiago)
  diaSemana: number; // 1 = lunes .. 7 = domingo
  franja: FranjaBrujula;
  duracionMin: number;
  prioridad: PrioridadBloque;
  etiquetaPrioridad: string;
  titulo: string;
  levelSubjectId: string;
  subjectName: string;
  objectiveId: string | null;
  objectiveCode: string | null;
  objectiveTitle: string | null;
  href: string;
  /** True solo si cae en la semana actual de Chile y tiene objectiveId abierto compatible con `saveBrujulaBlocks`. */
  aplicableABrujula: boolean;
}

export interface ProyeccionEscenario {
  esEstimacion: true;
  disponible: boolean;
  motivoNoDisponible: string | null;
  ritmoActualSemanal: number | null;
  ritmoPlanificadoSemanal: number;
  ritmoSimuladoSemanal: number;
  recuperable: boolean | null;
  semanasRecuperacion: number | null;
  completablesAntesEvaluacionActual: number | null;
  pendientesAntesEvaluacionActual: number | null;
  completablesAntesEvaluacionSimulado: number | null;
  pendientesAntesEvaluacionSimulado: number | null;
  mensajeOrientativo: string;
  supuestos: string[];
}

export interface EventoCalendario {
  id: string;
  fecha: string; // YYYY-MM-DD
  fechaFin?: string;
  capa: "oficial" | "realizado" | "pendiente" | "simulacion" | "consolidacion";
  tipo: "modulo_inicio" | "modulo_fin" | "evaluacion" | "receso" | "evaluacion_general" | "bloque_personal" | "bloque_simulado" | "retencion";
  titulo: string;
  detalle: string;
  levelSubjectId?: string;
  href?: string;
}

export const simularPlanificadorInputSchema = z.object({
  intensidad: z.enum(INTENSIDADES),
  diasPreferidos: z.array(z.number().int().min(1).max(7)).min(1).max(7)
    .refine((xs) => new Set(xs).size === xs.length, "Días repetidos")
    .optional(),
  horizonteSemanas: z.union([z.literal(1), z.literal(2), z.literal(4)]).optional(),
}).strict();

export type SimularPlanificadorInput = z.infer<typeof simularPlanificadorInputSchema>;

// ── Utilidades civiles puras (UTC sobre YYYY-MM-DD, inmunes a DST) ───────────

export function diasEntreCivil(desdeYmd: string, hastaYmd: string): number {
  const toUtc = (ymd: string) => {
    const [y, m, d] = ymd.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(hastaYmd) - toUtc(desdeYmd)) / 86_400_000);
}

/** 1 = lunes .. 7 = domingo para una fecha civil YYYY-MM-DD. */
export function diaSemanaCivil(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dow === 0 ? 7 : dow;
}

/** Lunes (YYYY-MM-DD) de la semana civil que contiene `ymd`. */
export function inicioSemanaCivil(ymd: string): string {
  return ymdMasDiasCivil(ymd, -(diaSemanaCivil(ymd) - 1));
}

export function esDiaNoLectivo(
  ymd: string,
  feriados: ReadonlySet<string>,
  recesos: readonly RangoFechasCivil[],
  semanasEvalGeneral: readonly RangoFechasCivil[],
): boolean {
  const dow = diaSemanaCivil(ymd);
  if (dow === 6 || dow === 7) return true;
  if (feriados.has(ymd)) return true;
  if (recesos.some((r) => r.inicio <= ymd && ymd <= r.fin)) return true;
  if (semanasEvalGeneral.some((s) => s.inicio <= ymd && ymd <= s.fin)) return true;
  return false;
}

export function contarDiasHabiles(
  inicioYmd: string,
  finYmd: string,
  feriados: ReadonlySet<string>,
  recesos: readonly RangoFechasCivil[],
  semanasEvalGeneral: readonly RangoFechasCivil[],
): number {
  if (finYmd < inicioYmd) return 0;
  const total = diasEntreCivil(inicioYmd, finYmd);
  let count = 0;
  for (let i = 0; i <= total && i <= 400; i++) {
    const d = ymdMasDiasCivil(inicioYmd, i);
    if (!esDiaNoLectivo(d, feriados, recesos, semanasEvalGeneral)) count++;
  }
  return count;
}

// ── 1. Comparación Planificado vs. Real ──────────────────────────────────────

const DIAS_GRACIA_MODULO_EN_CURSO = 3;

export function calcularComparacionPlanReal(params: {
  modulos: readonly ModuloPlanificado[];
  hoyYmd: string;
  feriados: ReadonlySet<string>;
  recesos: readonly RangoFechasCivil[];
  semanasEvalGeneral: readonly RangoFechasCivil[];
  proximaEvaluacion: ProximaEvaluacionCalendario | null;
}): ComparacionPlanReal {
  const { modulos, hoyYmd, feriados, recesos, semanasEvalGeneral, proximaEvaluacion } = params;
  const porLs = new Map<string, ModuloPlanificado[]>();
  for (const m of modulos) {
    const arr = porLs.get(m.levelSubjectId) ?? [];
    arr.push(m);
    porLs.set(m.levelSubjectId, arr);
  }

  let totalGlobal = 0;
  let compGlobal = 0;
  let espGlobal = 0;
  let vencGlobal = 0;
  let vencCerrGlobal = 0;
  let cerrGlobal = 0;
  let algunModuloEnGracia = false;
  const porAsignatura: ComparacionAsignatura[] = [];

  for (const [lsId, lista] of porLs.entries()) {
    const ordenada = [...lista].sort((a, b) => a.moduleNumber - b.moduleNumber);
    const meta = ordenada[0];
    let sTotal = 0;
    let sComp = 0;
    let sEsp = 0;
    let sVenc = 0;
    let sVencCerr = 0;
    let sCerr = 0;
    let sEnGracia = false;

    for (const m of ordenada) {
      const nAct = m.actividades.length;
      if (nAct === 0) continue;
      const nComp = m.actividades.filter((a) => a.completada).length;
      const cerrado = nComp === nAct;
      sTotal += nAct;
      sComp += nComp;
      if (cerrado) sCerr++;

      if (m.finYmd < hoyYmd) {
        sVenc++;
        if (cerrado) sVencCerr++;
        sEsp += nAct;
      } else if (m.inicioYmd <= hoyYmd && hoyYmd <= m.finYmd) {
        const habilesTotales = Math.max(1, contarDiasHabiles(m.inicioYmd, m.finYmd, feriados, recesos, semanasEvalGeneral));
        const habilesTranscurridos = contarDiasHabiles(m.inicioYmd, hoyYmd, feriados, recesos, semanasEvalGeneral);
        if (habilesTranscurridos <= DIAS_GRACIA_MODULO_EN_CURSO) {
          sEnGracia = true;
          algunModuloEnGracia = true;
          // En los primeros 3 días hábiles no exige fracción penalizadora para respetar ritmo asincrónico.
        } else {
          const fraccion = Math.min(1, habilesTranscurridos / habilesTotales);
          sEsp += nAct * fraccion;
        }
      }
    }

    const esperadoRedondeado = Number(sEsp.toFixed(2));
    const brechaItems = Number((sComp - esperadoRedondeado).toFixed(2));
    const brechaPct = esperadoRedondeado >= 1 ? Math.round((brechaItems / esperadoRedondeado) * 100) : null;
    const proxLs = proximaEvaluacion && proximaEvaluacion.levelSubjectId === lsId ? proximaEvaluacion : null;

    const estadoRitmo = diagnosticarRitmo({
      totalActividades: sTotal,
      completadas: sComp,
      esperadoALaFecha: esperadoRedondeado,
      brechaItems,
      brechaPct,
      modulosVencidos: sVenc,
      modulosVencidosCerrados: sVencCerr,
      modulosCerrados: sCerr,
      enPeriodoGracia: sEnGracia && sVenc === 0,
      proximaEvaluacion: proxLs,
      inicioProgramaYmd: ordenada[0]?.inicioYmd ?? null,
      hoyYmd,
    });

    totalGlobal += sTotal;
    compGlobal += sComp;
    espGlobal += sEsp;
    vencGlobal += sVenc;
    vencCerrGlobal += sVencCerr;
    cerrGlobal += sCerr;

    porAsignatura.push({
      levelSubjectId: lsId,
      subjectName: meta.subjectName,
      deliveryMode: meta.deliveryMode,
      totalActividades: sTotal,
      completadas: sComp,
      pendientes: sTotal - sComp,
      esperadoALaFecha: esperadoRedondeado,
      brechaItems,
      brechaPct,
      modulosVencidos: sVenc,
      modulosVencidosCerrados: sVencCerr,
      modulosCerrados: sCerr,
      estadoRitmo,
    });
  }

  const espGlobalRed = Number(espGlobal.toFixed(2));
  const brechaGlobal = Number((compGlobal - espGlobalRed).toFixed(2));
  const brechaPctGlobal = espGlobalRed >= 1 ? Math.round((brechaGlobal / espGlobalRed) * 100) : null;

  return {
    totalActividades: totalGlobal,
    completadas: compGlobal,
    pendientes: totalGlobal - compGlobal,
    esperadoALaFecha: espGlobalRed,
    brechaItems: brechaGlobal,
    brechaPct: brechaPctGlobal,
    modulosVencidos: vencGlobal,
    modulosVencidosCerrados: vencCerrGlobal,
    modulosCerrados: cerrGlobal,
    enPeriodoGracia: algunModuloEnGracia && vencGlobal === 0,
    porAsignatura,
  };
}

// ── 2. Diagnóstico fundamentado de ritmo (6 estados) ─────────────────────────

export function diagnosticarRitmo(params: {
  totalActividades: number;
  completadas: number;
  esperadoALaFecha: number;
  brechaItems: number;
  brechaPct: number | null;
  modulosVencidos: number;
  modulosVencidosCerrados: number;
  modulosCerrados: number;
  enPeriodoGracia: boolean;
  proximaEvaluacion: ProximaEvaluacionCalendario | null;
  inicioProgramaYmd: string | null;
  hoyYmd: string;
}): EstadoRitmoPlanificador {
  if (params.totalActividades === 0) return "sin_datos";
  if (params.inicioProgramaYmd && params.hoyYmd < params.inicioProgramaYmd) return "sin_datos";

  const vencidosSinCerrar = Math.max(0, params.modulosVencidos - params.modulosVencidosCerrados);

  if (
    params.proximaEvaluacion &&
    params.proximaEvaluacion.diasRestantes <= 7 &&
    (params.proximaEvaluacion.pendientesDelModulo >= 2 || vencidosSinCerrar >= 1)
  ) {
    return "riesgo_evaluacion";
  }

  if (
    vencidosSinCerrar >= 2 ||
    params.brechaItems <= -5 ||
    (params.brechaPct !== null && params.brechaPct <= -30)
  ) {
    return "atraso_significativo";
  }

  if (
    vencidosSinCerrar === 1 ||
    (!params.enPeriodoGracia && (params.brechaItems <= -2 || (params.brechaPct !== null && params.brechaPct <= -10)))
  ) {
    return "levemente_atrasado";
  }

  if (
    vencidosSinCerrar === 0 &&
    (params.modulosCerrados > params.modulosVencidos ||
      (params.brechaItems >= 2 && (params.brechaPct === null || params.brechaPct >= 15)))
  ) {
    return "adelantado";
  }

  return "en_ritmo";
}

export function etiquetaRitmo(estado: EstadoRitmoPlanificador): string {
  switch (estado) {
    case "sin_datos": return "Sin contenido activo aún";
    case "riesgo_evaluacion": return "Atención: evaluación próxima";
    case "atraso_significativo": return "Por retomar con plan gradual";
    case "levemente_atrasado": return "Levemente atrasado";
    case "adelantado": return "Adelantado";
    case "en_ritmo": return "En ritmo";
  }
}

/** Mapeo coherente para vista apoderado (`Familia`, 4 estados cualitativos). */
export function ritmoParaApoderado(estado: EstadoRitmoPlanificador): "al_dia" | "por_recuperar" | "adelantado" | "sin_datos" {
  if (estado === "sin_datos") return "sin_datos";
  if (estado === "adelantado") return "adelantado";
  if (estado === "en_ritmo") return "al_dia";
  return "por_recuperar";
}

// ── 3. Recomendaciones adaptativas deterministas (sin IA, máx. 3) ────────────

export function generarRecomendacionesAdaptativas(params: {
  estado: EstadoRitmoPlanificador;
  comparacion: ComparacionPlanReal;
  proximaEvaluacion: ProximaEvaluacionCalendario | null;
  siguienteActividad: ActividadPlanificable | null;
  retencionPendiente: readonly RetencionPendienteInput[];
  confirmacionOtroDia: readonly OaConfirmacionOtroDia[];
  basesSugeridas: readonly BaseSugeridaInput[];
  track: VorticeTrack | null;
}): RecomendacionAdaptativa[] {
  const out: RecomendacionAdaptativa[] = [];
  const { estado, proximaEvaluacion, siguienteActividad, retencionPendiente, confirmacionOtroDia, basesSugeridas } = params;

  if (estado === "riesgo_evaluacion" && proximaEvaluacion) {
    out.push({
      id: "rec-eval-proxima",
      prioridad: "alta",
      titulo: `Prepara «${proximaEvaluacion.titulo}»`,
      mensaje: `Tu avance está por debajo de lo planificado y «${proximaEvaluacion.titulo}» de ${proximaEvaluacion.subjectName} llega en ${proximaEvaluacion.diasRestantes} ${proximaEvaluacion.diasRestantes === 1 ? "día" : "días"}. Distribuye las ${proximaEvaluacion.pendientesDelModulo} actividades pendientes y reserva un período previo para repasar.`,
      accionTexto: siguienteActividad ? `Ir a ${siguienteActividad.titulo}` : "Ver evaluación",
      accionHref: siguienteActividad?.href ?? proximaEvaluacion.href,
    });
  } else if (estado === "atraso_significativo") {
    out.push({
      id: "rec-atraso-gradual",
      prioridad: "alta",
      titulo: "Retoma paso a paso sin sobrecargarte",
      mensaje: "Tienes actividades pendientes de períodos anteriores. Prioriza cerrar el módulo más cercano y prueba una distribución gradual en el simulador.",
      accionTexto: siguienteActividad ? `Retomar ${siguienteActividad.titulo}` : "Ver mis asignaturas",
      accionHref: siguienteActividad?.href ?? "/vortice",
    });
    out.push({
      id: "rec-apoyo-tutor",
      prioridad: "media",
      titulo: "Acompañamiento disponible",
      mensaje: "Si necesitas ayuda para priorizar tus actividades pendientes, puedes escribirle a tu tutor.",
      accionTexto: "Pedir apoyo a mi tutor",
      accionHref: "/vortice/apoyo",
    });
  } else if (estado === "levemente_atrasado") {
    out.push({
      id: "rec-leve-atraso",
      prioridad: "media",
      titulo: "Ajuste ligero para volver al ritmo",
      mensaje: "Tienes un leve atraso respecto de tu planificación. Organizar las próximas actividades en tus días preferidos te permitirá ponerte al día esta semana.",
      accionTexto: siguienteActividad ? `Continuar con ${siguienteActividad.titulo}` : "Ver mi semana",
      accionHref: siguienteActividad?.href ?? "/vortice/semana",
    });
  } else if (estado === "adelantado") {
    out.push({
      id: "rec-adelantado",
      prioridad: "baja",
      titulo: "Buen ritmo: consolida y descansa",
      mensaje: "Vas adelantado respecto de tu planificación. No necesitas aumentar tu carga: aprovecha este espacio para consolidar lo aprendido, repasar y mantener un equilibrio saludable.",
      accionTexto: retencionPendiente.length > 0 ? "Hacer repaso breve" : "Ver mi mapa",
      accionHref: "/vortice/conocimientos",
    });
  } else if (estado === "en_ritmo") {
    out.push({
      id: "rec-en-ritmo",
      prioridad: "baja",
      titulo: "Vas en ritmo con tu planificación",
      mensaje: proximaEvaluacion && proximaEvaluacion.diasRestantes <= 14
        ? `Tu avance acompaña el calendario. Recuerda que en ${proximaEvaluacion.diasRestantes} días se abre «${proximaEvaluacion.titulo}».`
        : "Tu avance acompaña bien la planificación oficial. Mantén tu ritmo habitual esta semana.",
      accionTexto: siguienteActividad ? `Seguir con ${siguienteActividad.titulo}` : "Ver mi semana",
      accionHref: siguienteActividad?.href ?? "/vortice/semana",
    });
  }

  if (out.length < 3 && retencionPendiente.length > 0) {
    const r = retencionPendiente[0];
    out.push({
      id: `rec-retencion-${r.oaId}`,
      prioridad: "media",
      titulo: "Comprobación de memoria",
      mensaje: `Tienes un repaso breve disponible en «${r.nombre}» para mantener fresco lo que ya dominas.`,
      accionTexto: "Comprobar ahora",
      accionHref: "/vortice/conocimientos",
    });
  }

  if (out.length < 3 && confirmacionOtroDia.length > 0) {
    const c = confirmacionOtroDia[0];
    out.push({
      id: `rec-k6-${c.oaId}`,
      prioridad: "baja",
      titulo: "Confirmar aprendizaje en otro día",
      mensaje: `Avanzaste muy bien en «${c.nombre}». Una verificación breve en un día calendario distinto confirmará tu dominio.`,
      accionTexto: "Ir a mi mapa",
      accionHref: "/vortice/conocimientos",
    });
  }

  if (out.length < 3 && basesSugeridas.length > 0) {
    const b = basesSugeridas[0];
    out.push({
      id: `rec-base-${b.itemId}`,
      prioridad: "media",
      titulo: "Repaso de base sugerido",
      mensaje: `Antes de avanzar con lo nuevo en ${b.subjectName}, conviene repasar «${b.nombre}» para fortalecer tu base.`,
      accionTexto: "Reforzar base",
      accionHref: "/vortice/conocimientos",
    });
  }

  return out.slice(0, params.track === "basica-1-4" ? 2 : 3);
}

// ── 4. Simulador de reorganización (solo lectura, sin mutar plan oficial) ────

const TOPE_BLOQUES_POR_TRAMO: Record<VorticeTrack, number> = {
  "basica-1-4": 3,
  "basica-5-8": 5,
  media: 6,
};

const ETIQUETA_PRIORIDAD: Record<PrioridadBloque, string> = {
  evaluacion_proxima: "Prioridad · Evaluación próxima",
  atraso: "Prioridad · Pendiente anterior",
  en_curso: "Módulo en curso",
  repaso_pre_evaluacion: "Repaso previo a evaluación",
  retencion_m4: "Repaso de memoria",
  confirmacion_k6_otro_dia: "Confirmar en otro día",
  repaso_base: "Repaso de base sugerido",
};

export function simularReorganizacion(params: {
  hoyYmd: string;
  track: VorticeTrack | null;
  preferencias: PreferenciasBrujula;
  intensidadSimulada: IntensidadBrujula;
  diasPreferidosOverride?: readonly number[];
  horizonteSemanas: 1 | 2 | 4;
  modulos: readonly ModuloPlanificado[];
  proximaEvaluacion: ProximaEvaluacionCalendario | null;
  retencionPendiente: readonly RetencionPendienteInput[];
  confirmacionOtroDia: readonly OaConfirmacionOtroDia[];
  basesSugeridas: readonly BaseSugeridaInput[];
  feriados: ReadonlySet<string>;
  recesos: readonly RangoFechasCivil[];
  semanasEvalGeneral: readonly RangoFechasCivil[];
}): BloqueSimulado[] {
  const {
    hoyYmd,
    track,
    preferencias,
    intensidadSimulada,
    horizonteSemanas,
    modulos,
    proximaEvaluacion,
    retencionPendiente,
    confirmacionOtroDia,
    basesSugeridas,
    feriados,
    recesos,
    semanasEvalGeneral,
  } = params;

  const cfg = CONFIG_INTENSIDAD[intensidadSimulada];
  const topeTramo = track ? TOPE_BLOQUES_POR_TRAMO[track] : cfg.bloquesPorSemana;
  const bloquesPorSemana = Math.min(cfg.bloquesPorSemana, topeTramo);
  const diasPref = new Set(
    (params.diasPreferidosOverride?.length ? params.diasPreferidosOverride : preferencias.diasPreferidos)
      .filter((d) => Number.isInteger(d) && d >= 1 && d <= 7),
  );
  if (diasPref.size === 0) return [];

  // Construir cola priorizada de ítems a distribuir.
  interface ItemCola {
    prioridad: PrioridadBloque;
    titulo: string;
    levelSubjectId: string;
    subjectName: string;
    objectiveId: string | null;
    objectiveCode: string | null;
    objectiveTitle: string | null;
    href: string;
    moduleOpen: boolean;
    soloDespuesDeYmd?: string; // Candado D1: fecha > soloDespuesDeYmd
  }

  const cola: ItemCola[] = [];
  const modOrdenados = [...modulos].sort((a, b) => a.moduleNumber - b.moduleNumber);

  // 1) Pendientes de módulo con evaluación en <= 14 días.
  if (proximaEvaluacion && proximaEvaluacion.diasRestantes <= 14) {
    for (const m of modOrdenados) {
      if (m.levelSubjectId !== proximaEvaluacion.levelSubjectId || m.moduleNumber !== proximaEvaluacion.moduleNumber) continue;
      for (const act of m.actividades) {
        if (!act.completada && act.tipo !== "evaluacion") {
          cola.push({
            prioridad: "evaluacion_proxima",
            titulo: act.titulo,
            levelSubjectId: act.levelSubjectId,
            subjectName: act.subjectName,
            objectiveId: act.objectiveId,
            objectiveCode: act.objectiveCode,
            objectiveTitle: act.objectiveTitle,
            href: act.href,
            moduleOpen: act.moduleOpen,
          });
        }
      }
    }
  }

  // 2) Pendientes de módulos vencidos más antiguos y luego módulo en curso.
  const yaEnCola = new Set(cola.map((c) => `${c.levelSubjectId}:${c.objectiveId}:${c.titulo}`));
  for (const m of modOrdenados) {
    const esVencido = m.finYmd < hoyYmd;
    const esEnCurso = m.inicioYmd <= hoyYmd && hoyYmd <= m.finYmd;
    if (!esVencido && !esEnCurso) continue;
    for (const act of m.actividades) {
      if (act.completada || act.tipo === "evaluacion") continue;
      const key = `${act.levelSubjectId}:${act.objectiveId}:${act.titulo}`;
      if (yaEnCola.has(key)) continue;
      yaEnCola.add(key);
      cola.push({
        prioridad: esVencido ? "atraso" : "en_curso",
        titulo: act.titulo,
        levelSubjectId: act.levelSubjectId,
        subjectName: act.subjectName,
        objectiveId: act.objectiveId,
        objectiveCode: act.objectiveCode,
        objectiveTitle: act.objectiveTitle,
        href: act.href,
        moduleOpen: act.moduleOpen,
      });
    }
  }

  // 3) Repaso previo a evaluación si está dentro del horizonte.
  if (proximaEvaluacion && proximaEvaluacion.diasRestantes >= 1 && proximaEvaluacion.diasRestantes <= horizonteSemanas * 7) {
    cola.push({
      prioridad: "repaso_pre_evaluacion",
      titulo: `Repaso previo · ${proximaEvaluacion.titulo}`,
      levelSubjectId: proximaEvaluacion.levelSubjectId,
      subjectName: proximaEvaluacion.subjectName,
      objectiveId: null,
      objectiveCode: null,
      objectiveTitle: null,
      href: proximaEvaluacion.href,
      moduleOpen: false,
    });
  }

  // 4) Retención M4, confirmación K6 en otro día (D1) y repaso de base sugerido (sin mencionar reprobación E2).
  for (const r of retencionPendiente.slice(0, 2)) {
    cola.push({
      prioridad: "retencion_m4",
      titulo: `Comprobar memoria · ${r.nombre}`,
      levelSubjectId: r.levelSubjectId,
      subjectName: r.subjectName,
      objectiveId: null,
      objectiveCode: null,
      objectiveTitle: null,
      href: "/vortice/conocimientos",
      moduleOpen: false,
    });
  }
  for (const k of confirmacionOtroDia.slice(0, 2)) {
    cola.push({
      prioridad: "confirmacion_k6_otro_dia",
      titulo: `Confirmar aprendizaje · ${k.nombre}`,
      levelSubjectId: k.levelSubjectId,
      subjectName: k.subjectName,
      objectiveId: null,
      objectiveCode: null,
      objectiveTitle: null,
      href: "/vortice/conocimientos",
      moduleOpen: false,
      soloDespuesDeYmd: k.ultimoDiaPractica === hoyYmd ? hoyYmd : undefined,
    });
  }
  for (const b of basesSugeridas.slice(0, 2)) {
    cola.push({
      prioridad: "repaso_base",
      titulo: `Repaso de base sugerido · ${b.nombre}`,
      levelSubjectId: b.levelSubjectId,
      subjectName: b.subjectName,
      objectiveId: null,
      objectiveCode: null,
      objectiveTitle: null,
      href: "/vortice/conocimientos",
      moduleOpen: false,
    });
  }

  if (cola.length === 0) return [];

  // Recorrer días hábiles disponibles dentro del horizonte respetando recesos, feriados, generalEvaluationWeeks y tope semanal.
  const semanaInicioActual = inicioSemanaCivil(hoyYmd);
  const semanaFinActual = ymdMasDiasCivil(semanaInicioActual, 6);
  const bloques: BloqueSimulado[] = [];
  const asignadosPorSemana = new Map<string, number>();
  const asignadosPorDia = new Map<string, number>();
  const pendientesRestantes = [...cola];
  const totalDiasHorizonte = horizonteSemanas * 7;

  for (let offset = 0; offset < totalDiasHorizonte && pendientesRestantes.length > 0; offset++) {
    const fecha = ymdMasDiasCivil(hoyYmd, offset);
    const dow = diaSemanaCivil(fecha);
    if (!diasPref.has(dow)) continue;
    if (feriados.has(fecha)) continue;
    if (recesos.some((r) => r.inicio <= fecha && fecha <= r.fin)) continue;
    if (semanasEvalGeneral.some((s) => s.inicio <= fecha && fecha <= s.fin)) continue;

    const sem = inicioSemanaCivil(fecha);
    const usadosSem = asignadosPorSemana.get(sem) ?? 0;
    if (usadosSem >= bloquesPorSemana) continue;

    // Buscar primer ítem elegible para esta fecha (respetando candado D1 `fecha > soloDespuesDeYmd`).
    const idx = pendientesRestantes.findIndex((it) => !it.soloDespuesDeYmd || fecha > it.soloDespuesDeYmd);
    if (idx === -1) continue;

    const item = pendientesRestantes.splice(idx, 1)[0];
    const nDia = (asignadosPorDia.get(fecha) ?? 0) + 1;
    asignadosPorDia.set(fecha, nDia);
    asignadosPorSemana.set(sem, usadosSem + 1);

    const enSemanaActual = fecha >= semanaInicioActual && fecha <= semanaFinActual;
    const aplicableABrujula = Boolean(enSemanaActual && item.objectiveId && item.moduleOpen);

    bloques.push({
      id: `sim-${fecha}-b${nDia}`,
      fecha,
      diaSemana: dow,
      franja: preferencias.franja,
      duracionMin: cfg.minutosBloque,
      prioridad: item.prioridad,
      etiquetaPrioridad: ETIQUETA_PRIORIDAD[item.prioridad],
      titulo: item.titulo,
      levelSubjectId: item.levelSubjectId,
      subjectName: item.subjectName,
      objectiveId: item.objectiveId,
      objectiveCode: item.objectiveCode,
      objectiveTitle: item.objectiveTitle,
      href: item.href,
      aplicableABrujula,
    });
  }

  return bloques;
}

// ── 5. Estimaciones y proyecciones transparentes ─────────────────────────────

export function calcularProyecciones(params: {
  track: VorticeTrack | null;
  comparacion: ComparacionPlanReal;
  completadasUltimos28Dias: number;
  diasDesdeInicioPrograma: number;
  intensidadSimulada: IntensidadBrujula;
  proximaEvaluacion: ProximaEvaluacionCalendario | null;
}): ProyeccionEscenario {
  const { track, comparacion, completadasUltimos28Dias, diasDesdeInicioPrograma, intensidadSimulada, proximaEvaluacion } = params;
  const cfg = CONFIG_INTENSIDAD[intensidadSimulada];
  const topeTramo = track ? TOPE_BLOQUES_POR_TRAMO[track] : cfg.bloquesPorSemana;
  const rSim = Math.min(cfg.bloquesPorSemana, topeTramo);
  // Ritmo planificado base: 5 actividades por semana (equivalente a intensidad normal de 2 semanas / módulo).
  const rPlan = 5;

  if (track === "basica-1-4") {
    return {
      esEstimacion: true,
      disponible: false,
      motivoNoDisponible: "simplificado_basica_1_4",
      ritmoActualSemanal: null,
      ritmoPlanificadoSemanal: rPlan,
      ritmoSimuladoSemanal: rSim,
      recuperable: null,
      semanasRecuperacion: null,
      completablesAntesEvaluacionActual: null,
      pendientesAntesEvaluacionActual: null,
      completablesAntesEvaluacionSimulado: null,
      pendientesAntesEvaluacionSimulado: null,
      mensajeOrientativo: "En 1.º a 4.º Básico priorizamos tu plan de esta semana paso a paso, sin proyecciones numéricas.",
      supuestos: ["Vista simplificada para primer ciclo básico (UDL)."],
    };
  }

  if (diasDesdeInicioPrograma < 7 || completadasUltimos28Dias < 2) {
    return {
      esEstimacion: true,
      disponible: false,
      motivoNoDisponible: "datos_insuficientes",
      ritmoActualSemanal: null,
      ritmoPlanificadoSemanal: rPlan,
      ritmoSimuladoSemanal: rSim,
      recuperable: null,
      semanasRecuperacion: null,
      completablesAntesEvaluacionActual: null,
      pendientesAntesEvaluacionActual: null,
      completablesAntesEvaluacionSimulado: null,
      pendientesAntesEvaluacionSimulado: null,
      mensajeOrientativo: "Aún tenemos pocos días de actividad para proyectar tu ritmo real; puedes usar el simulador con intensidad Suave, Normal o Intensivo para explorar escenarios.",
      supuestos: [
        `Días transcurridos desde el inicio: ${Math.max(0, diasDesdeInicioPrograma)} (se requieren al menos 7).`,
        `Actividades completadas en los últimos 28 días: ${completadasUltimos28Dias} (se requieren al menos 2).`,
      ],
    };
  }

  const semanasVentana = Math.min(4, Math.max(1, diasDesdeInicioPrograma / 7));
  const rReal = Number((completadasUltimos28Dias / semanasVentana).toFixed(1));
  const atrasoItems = comparacion.brechaItems < 0 ? Math.abs(comparacion.brechaItems) : 0;

  let recuperable: boolean | null = null;
  let semanasRecuperacion: number | null = null;
  if (atrasoItems > 0) {
    if (rSim > rPlan) {
      recuperable = true;
      semanasRecuperacion = Math.ceil(atrasoItems / (rSim - rPlan));
    } else {
      // Corrección NEON: si rSim <= rPlan, nunca inventar semanas falsas de recuperación.
      recuperable = false;
      semanasRecuperacion = null;
    }
  }

  let compEvalActual: number | null = null;
  let pendEvalActual: number | null = null;
  let compEvalSim: number | null = null;
  let pendEvalSim: number | null = null;

  if (proximaEvaluacion) {
    const semanasHastaEval = Math.max(0, proximaEvaluacion.diasRestantes / 7);
    const totalPend = proximaEvaluacion.pendientesDelModulo;
    compEvalActual = Math.min(totalPend, Math.floor(rReal * semanasHastaEval));
    pendEvalActual = Math.max(0, totalPend - compEvalActual);
    compEvalSim = Math.min(totalPend, Math.floor(rSim * semanasHastaEval));
    pendEvalSim = Math.max(0, totalPend - compEvalSim);
  }

  let mensajeOrientativo: string;
  if (atrasoItems === 0) {
    mensajeOrientativo = `Con tu ritmo observable de ~${rReal} actividades/semana mantienes un avance estable respecto del calendario.`;
  } else if (recuperable && semanasRecuperacion !== null) {
    mensajeOrientativo = `Con intensidad ${cfg.label} (${rSim} bloques/semana), podrías reducir tu atraso gradualmente en aproximadamente ${semanasRecuperacion} ${semanasRecuperacion === 1 ? "semana" : "semanas"}.`;
  } else {
    mensajeOrientativo = `Con intensidad ${cfg.label} (${rSim} bloques/semana) mantendrías un ritmo más pausado que el calendario oficial (${rPlan}/semana); prueba una intensidad mayor si deseas acortar pendientes gradualmente.`;
  }

  return {
    esEstimacion: true,
    disponible: true,
    motivoNoDisponible: null,
    ritmoActualSemanal: rReal,
    ritmoPlanificadoSemanal: rPlan,
    ritmoSimuladoSemanal: rSim,
    recuperable,
    semanasRecuperacion,
    completablesAntesEvaluacionActual: compEvalActual,
    pendientesAntesEvaluacionActual: pendEvalActual,
    completablesAntesEvaluacionSimulado: compEvalSim,
    pendientesAntesEvaluacionSimulado: pendEvalSim,
    mensajeOrientativo,
    supuestos: [
      `Ritmo real calculado con ${completadasUltimos28Dias} actividades completadas en ${semanasVentana.toFixed(1)} semanas observables.`,
      `Escenario simulado con intensidad ${cfg.label}: hasta ${rSim} bloques/semana de ${cfg.minutosBloque} min.`,
      "Las proyecciones son orientativas y no modifican el calendario ni las fechas oficiales de evaluación.",
    ],
  };
}
