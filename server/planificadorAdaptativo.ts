// Servicio de solo lectura del Planificador Adaptativo («Mi calendario») · Etapa 2.
// Orquesta las fuentes reales existentes sin nuevas migraciones ni mutaciones del calendario oficial:
// - `server/vortice.ts` (`loadVorticeInput`, `cargarContinuacionesPendientes`)
// - `server/calendarConfig.ts` + `server/calendarUtils.ts` (solo lectura · protegido)
// - `server/brujula.ts` (`getBrujulaPreferences`, `getBrujulaBlocks`)
// - `server/mapaConocimiento.ts` (`cargarMapaConocimiento`, respetando AC1 y D1)
// - Cero lectura de `score_pct`, `total_correct` ni `evaluation_attempt_answers` (NI1-NI5).
import { eq, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Client } from "@libsql/client";
import * as schema from "@shared/schema";
import { lessonStudyProgress, studentProgress } from "@shared/schema";
import {
  calcularComparacionPlanReal,
  calcularProyecciones,
  diagnosticarRitmo,
  diasEntreCivil,
  etiquetaRitmo,
  generarRecomendacionesAdaptativas,
  ritmoParaApoderado,
  simularReorganizacion,
  type ActividadPlanificable,
  type BaseSugeridaInput,
  type BloqueSimulado,
  type ComparacionPlanReal,
  type EstadoRitmoPlanificador,
  type EventoCalendario,
  type ModuloPlanificado,
  type OaConfirmacionOtroDia,
  type ProximaEvaluacionCalendario,
  type ProyeccionEscenario,
  type RangoFechasCivil,
  type RecomendacionAdaptativa,
  type RetencionPendienteInput,
  type SimularPlanificadorInput,
} from "@shared/planificadorAdaptativo";
import { trackForLevel, type VorticeTrack } from "@shared/vortice";
import type { BloqueEstudio, IntensidadBrujula, PreferenciasBrujula } from "@shared/brujula";
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
  type CalendarConfig,
} from "./calendarUtils";
import { resolveCalendarConfig } from "./calendarConfig";
import { getBrujulaBlocks, getBrujulaPreferences } from "./brujula";
import { cargarContinuacionesPendientes, loadVorticeInput } from "./vortice";
import { cargarMapaConocimiento } from "./mapaConocimiento";

type Db = LibSQLDatabase<typeof schema>;

export interface PlanificadorAdaptativoDTO {
  disponible: boolean;
  motivoNoDisponible?: "sin_curso" | "fuera_de_tramo";
  hoyYmd: string;
  zonaHoraria: string;
  nivel: { id: string; name: string } | null;
  track: VorticeTrack | null;
  estadoRitmo: EstadoRitmoPlanificador;
  etiquetaEstado: string;
  ritmoApoderado: "al_dia" | "por_recuperar" | "adelantado" | "sin_datos";
  comparacion: ComparacionPlanReal;
  proximaEvaluacion: ProximaEvaluacionCalendario | null;
  recomendaciones: RecomendacionAdaptativa[];
  preferencias: PreferenciasBrujula;
  bloquesPersonalesSemana: BloqueEstudio[];
  simulacionDefecto: {
    intensidad: IntensidadBrujula;
    horizonteSemanas: 1 | 2 | 4;
    bloques: BloqueSimulado[];
    proyeccion: ProyeccionEscenario;
  };
  eventosCalendario: EventoCalendario[];
  avisoOficial: string;
}

export interface SimulacionPlanificadorDTO {
  hoyYmd: string;
  intensidad: IntensidadBrujula;
  horizonteSemanas: 1 | 2 | 4;
  bloques: BloqueSimulado[];
  proyeccion: ProyeccionEscenario;
  avisoOficial: string;
}

async function tablaExiste(db: Db, nombre: string): Promise<boolean> {
  const rows = await db.all<{ name: string }>(
    sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${nombre} LIMIT 1`,
  );
  return rows.length > 0;
}

function toDateSeg(raw: unknown): Date | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n > 1e11 ? n : n * 1000);
}

async function cargarLeccionesAulaPorAsignatura(
  db: Db,
  userId: string,
  levelSubjectId: string,
): Promise<Array<{ oaId: string; titulo: string; learningObjectiveId: string | null; lograda: boolean; updatedAt: Date | null }>> {
  const logradasPorOa = new Map<string, { lograda: boolean; updatedAt: Date | null }>();
  if (await tablaExiste(db, "lesson_study_progress")) {
    const rows = await db
      .select({
        oaId: lessonStudyProgress.oaId,
        practicaLograda: lessonStudyProgress.practicaLograda,
        updatedAt: sql<number | null>`${lessonStudyProgress.updatedAt}`,
      })
      .from(lessonStudyProgress)
      .where(eq(lessonStudyProgress.userId, userId));
    for (const r of rows) {
      logradasPorOa.set(r.oaId, { lograda: Boolean(r.practicaLograda), updatedAt: toDateSeg(r.updatedAt) });
    }
  }

  if (await tablaExiste(db, "universal_lessons")) {
    const ulRows = await db.all<{ oa_id: string; learning_objective_id: string | null; payload_json: string }>(
      sql`SELECT oa_id, learning_objective_id, payload_json
          FROM universal_lessons
          WHERE level_subject_id = ${levelSubjectId}
          ORDER BY sort_order ASC`,
    );
    if (ulRows.length > 0) {
      return ulRows.map((r) => {
        let titulo = String(r.oa_id).toUpperCase();
        try {
          const parsed = JSON.parse(String(r.payload_json));
          if (typeof parsed?.titulo === "string" && parsed.titulo.trim()) titulo = parsed.titulo.trim();
        } catch {
          // conservar código OA
        }
        const prog = logradasPorOa.get(String(r.oa_id));
        return {
          oaId: String(r.oa_id),
          titulo,
          learningObjectiveId: r.learning_objective_id ? String(r.learning_objective_id) : null,
          lograda: prog?.lograda ?? false,
          updatedAt: prog?.updatedAt ?? null,
        };
      });
    }
  }

  return (["oa7", "oa8", "oa10", "oa11", "oa13"] as const).map((oaId) => {
    const prog = logradasPorOa.get(oaId);
    return {
      oaId,
      titulo: oaId.toUpperCase(),
      learningObjectiveId: null,
      lograda: prog?.lograda ?? false,
      updatedAt: prog?.updatedAt ?? null,
    };
  });
}

async function contarCompletadasUltimos28Dias(db: Db, userId: string, now: Date): Promise<number> {
  const corteMs = now.getTime() - 28 * 86_400_000;
  let total = 0;

  const spRows = await db
    .select({ at: sql<number | null>`${studentProgress.completedAt}` })
    .from(studentProgress)
    .where(eq(studentProgress.userId, userId));
  for (const r of spRows) {
    const d = toDateSeg(r.at);
    if (d && d.getTime() >= corteMs) total++;
  }

  if (await tablaExiste(db, "lesson_study_progress")) {
    const lpRows = await db
      .select({
        lograda: lessonStudyProgress.practicaLograda,
        at: sql<number | null>`${lessonStudyProgress.updatedAt}`,
      })
      .from(lessonStudyProgress)
      .where(eq(lessonStudyProgress.userId, userId));
    for (const r of lpRows) {
      const d = toDateSeg(r.at);
      if (r.lograda && d && d.getTime() >= corteMs) total++;
    }
  }

  return total;
}

async function ultimoDiaPracticaPorOa(db: Db, userId: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!(await tablaExiste(db, "practice_answers")) || !(await tablaExiste(db, "knowledge_items"))) {
    return out;
  }
  const rows = await db.all<{ code: string; ultimo_dia: string }>(sql`
    SELECT ki.code, MAX(pa.study_day) AS ultimo_dia
    FROM practice_answers pa
    JOIN knowledge_items ki ON ki.id = pa.item_id
    WHERE pa.student_id = ${userId}
    GROUP BY ki.code
  `);
  for (const r of rows) {
    const m = /OA0?(\d+)$/i.exec(String(r.code ?? ""));
    if (m && r.ultimo_dia) out.set(`oa${Number(m[1])}`, String(r.ultimo_dia));
  }
  return out;
}

interface ContextoPlanificador {
  disponible: boolean;
  motivoNoDisponible?: "sin_curso" | "fuera_de_tramo";
  hoyYmd: string;
  nivel: { id: string; name: string } | null;
  track: VorticeTrack | null;
  config: CalendarConfig | null;
  feriados: Set<string>;
  recesos: RangoFechasCivil[];
  semanasEvalGeneral: RangoFechasCivil[];
  modulos: ModuloPlanificado[];
  proximaEvaluacion: ProximaEvaluacionCalendario | null;
  comparacion: ComparacionPlanReal;
  estadoRitmo: EstadoRitmoPlanificador;
  preferencias: PreferenciasBrujula;
  bloquesPersonalesSemana: BloqueEstudio[];
  retencionPendiente: RetencionPendienteInput[];
  confirmacionOtroDia: OaConfirmacionOtroDia[];
  basesSugeridas: BaseSugeridaInput[];
  completadasUltimos28Dias: number;
  diasDesdeInicioPrograma: number;
  eventosCalendario: EventoCalendario[];
}

async function construirContextoPlanificador(
  db: Db,
  client: Client,
  userId: string,
  now: Date,
): Promise<ContextoPlanificador> {
  const hoyYmd = ymdIn(CHILE_TZ, now);
  const [{ level, input, completed, passed }, preferencias, bloquesView, continuaciones, completadas28, ultDiaPorOa] =
    await Promise.all([
      loadVorticeInput(db, userId, now),
      getBrujulaPreferences(db, userId),
      getBrujulaBlocks(db, userId, now),
      cargarContinuacionesPendientes(db, userId),
      contarCompletadasUltimos28Dias(db, userId, now),
      ultimoDiaPracticaPorOa(db, userId),
    ]);

  const track = trackForLevel(level?.id);
  const vacioComparacion: ComparacionPlanReal = {
    totalActividades: 0,
    completadas: 0,
    pendientes: 0,
    esperadoALaFecha: 0,
    brechaItems: 0,
    brechaPct: null,
    modulosVencidos: 0,
    modulosVencidosCerrados: 0,
    modulosCerrados: 0,
    enPeriodoGracia: false,
    porAsignatura: [],
  };

  if (!level) {
    return {
      disponible: false,
      motivoNoDisponible: "sin_curso",
      hoyYmd,
      nivel: null,
      track: null,
      config: null,
      feriados: new Set(),
      recesos: [],
      semanasEvalGeneral: [],
      modulos: [],
      proximaEvaluacion: null,
      comparacion: vacioComparacion,
      estadoRitmo: "sin_datos",
      preferencias,
      bloquesPersonalesSemana: bloquesView.bloques,
      retencionPendiente: [],
      confirmacionOtroDia: [],
      basesSugeridas: [],
      completadasUltimos28Dias: completadas28,
      diasDesdeInicioPrograma: 0,
      eventosCalendario: [],
    };
  }

  if (!track) {
    return {
      disponible: false,
      motivoNoDisponible: "fuera_de_tramo",
      hoyYmd,
      nivel: level,
      track: null,
      config: null,
      feriados: new Set(),
      recesos: [],
      semanasEvalGeneral: [],
      modulos: [],
      proximaEvaluacion: null,
      comparacion: vacioComparacion,
      estadoRitmo: "sin_datos",
      preferencias,
      bloquesPersonalesSemana: bloquesView.bloques,
      retencionPendiente: [],
      confirmacionOtroDia: [],
      basesSugeridas: [],
      completadasUltimos28Dias: completadas28,
      diasDesdeInicioPrograma: 0,
      eventosCalendario: [],
    };
  }

  const config = await resolveCalendarConfig(db, level.id, now);
  const feriados = new Set(config.holidays ?? []);
  const recesos: RangoFechasCivil[] = (config.breaks ?? []).map((b) => ({
    inicio: b.start,
    fin: b.end,
    nombre: b.name ?? "Receso",
  }));
  const semanasEvalGeneral: RangoFechasCivil[] = getGeneralEvaluationWeeks(config).map((w) => ({
    inicio: ymdIn(CHILE_TZ, w.startDate),
    fin: ymdIn(CHILE_TZ, w.endDate),
    nombre: w.name,
  }));

  const modulos: ModuloPlanificado[] = [];
  const candidatasEval: ProximaEvaluacionCalendario[] = [];
  const eventosCalendario: EventoCalendario[] = [];

  for (const r of recesos) {
    eventosCalendario.push({
      id: `receso-${r.inicio}`,
      fecha: r.inicio,
      fechaFin: r.fin,
      capa: "oficial",
      tipo: "receso",
      titulo: r.nombre ?? "Receso académico",
      detalle: "Período de receso del calendario oficial",
    });
  }
  for (const w of semanasEvalGeneral) {
    eventosCalendario.push({
      id: `eval-gen-${w.inicio}`,
      fecha: w.inicio,
      fechaFin: w.fin,
      capa: "oficial",
      tipo: "evaluacion_general",
      titulo: w.nombre ?? "Semana de Evaluaciones Generales",
      detalle: "Semana oficial de evaluaciones generales",
    });
  }

  for (const s of input) {
    const mode = s.deliveryMode ?? "legacy";
    const aulaLecciones = mode === "aula_universal"
      ? await cargarLeccionesAulaPorAsignatura(db, userId, s.levelSubjectId)
      : [];
    const oasOrdenados = [...s.objectives].sort((a, b) => a.weekNumber - b.weekNumber || a.sortOrder - b.sortOrder);
    const primerOaId = oasOrdenados[0]?.id ?? null;

    for (const oa of oasOrdenados) {
      const inicioYmd = ymdIn(CHILE_TZ, getModuleStartDate(oa.weekNumber, config));
      const finYmd = ymdIn(CHILE_TZ, getModuleEndDate(oa.weekNumber, config));
      const evalFechas: Record<1 | 2 | 3 | 4, string> = {
        1: ymdIn(CHILE_TZ, getEvaluation1ReleaseDate(oa.weekNumber, config)),
        2: ymdIn(CHILE_TZ, getEvaluation2ReleaseDate(oa.weekNumber, config)),
        3: ymdIn(CHILE_TZ, getEvaluation3ReleaseDate(oa.weekNumber, config)),
        4: ymdIn(CHILE_TZ, getEvaluation4ReleaseDate(oa.weekNumber, config)),
      };

      const actividades: ActividadPlanificable[] = [];
      if (mode === "aula_universal") {
        // Regla NEON anti doble conteo: en aula_universal solo cuentan universal_lessons + evaluaciones de cierre.
        const leccionesDelModulo = aulaLecciones.filter(
          (l) => (l.learningObjectiveId ?? primerOaId) === oa.id,
        );
        for (const l of leccionesDelModulo) {
          actividades.push({
            id: `aula-${l.oaId}`,
            tipo: "leccion_aula",
            titulo: l.titulo,
            levelSubjectId: s.levelSubjectId,
            subjectName: s.subjectName,
            deliveryMode: mode,
            objectiveId: oa.id,
            objectiveCode: oa.code,
            objectiveTitle: oa.title,
            moduleNumber: oa.weekNumber,
            moduleOpen: oa.available !== false,
            completada: l.lograda,
            href: `/vortice/aula?oa=${encodeURIComponent(l.oaId)}`,
          });
        }
      } else {
        for (const res of oa.resources) {
          actividades.push({
            id: res.id,
            tipo: "recurso",
            titulo: res.title,
            levelSubjectId: s.levelSubjectId,
            subjectName: s.subjectName,
            deliveryMode: mode,
            objectiveId: oa.id,
            objectiveCode: oa.code,
            objectiveTitle: oa.title,
            moduleNumber: oa.weekNumber,
            moduleOpen: oa.available !== false,
            completada: completed.has(res.id),
            href: `/course/${level.id}-${s.subjectSlug}`,
          });
        }
      }

      const evalsMod: ModuloPlanificado["evaluaciones"] = [];
      for (const ev of oa.evaluations ?? []) {
        const num = ev.evaluationNumber as 1 | 2 | 3 | 4;
        const fechaYmd = num >= 1 && num <= 4 ? evalFechas[num] : finYmd;
        const aprobada = passed.has(ev.id);
        const hrefEval = num === 4 ? `/vortice/evaluacion/${encodeURIComponent(ev.id)}` : `/course/${level.id}-${s.subjectSlug}`;
        actividades.push({
          id: ev.id,
          tipo: "evaluacion",
          titulo: ev.title,
          levelSubjectId: s.levelSubjectId,
          subjectName: s.subjectName,
          deliveryMode: mode,
          objectiveId: oa.id,
          objectiveCode: oa.code,
          objectiveTitle: oa.title,
          moduleNumber: oa.weekNumber,
          moduleOpen: oa.available !== false,
          completada: aprobada,
          fechaObjetivo: fechaYmd,
          href: hrefEval,
        });
        if (num >= 1 && num <= 4) {
          evalsMod.push({ id: ev.id, titulo: ev.title, numero: num, fechaYmd, aprobada, href: hrefEval });
          eventosCalendario.push({
            id: `ev-${ev.id}`,
            fecha: fechaYmd,
            capa: aprobada ? "realizado" : "oficial",
            tipo: "evaluacion",
            titulo: ev.title,
            detalle: `${s.subjectName} · Módulo ${oa.weekNumber}`,
            levelSubjectId: s.levelSubjectId,
            href: hrefEval,
          });
        }
      }

      const pendientesPrevias = actividades.filter((a) => !a.completada && a.tipo !== "evaluacion").length;
      for (const ev of evalsMod) {
        if (!ev.aprobada) {
          const dias = Math.max(0, diasEntreCivil(hoyYmd, ev.fechaYmd));
          candidatasEval.push({
            id: ev.id,
            titulo: ev.titulo,
            levelSubjectId: s.levelSubjectId,
            subjectName: s.subjectName,
            moduleNumber: oa.weekNumber,
            fechaYmd: ev.fechaYmd,
            diasRestantes: dias,
            pendientesDelModulo: pendientesPrevias,
            href: ev.href,
          });
        }
      }

      modulos.push({
        levelSubjectId: s.levelSubjectId,
        subjectName: s.subjectName,
        subjectSlug: s.subjectSlug,
        deliveryMode: mode,
        moduleNumber: oa.weekNumber,
        objectiveId: oa.id,
        objectiveCode: oa.code,
        objectiveTitle: oa.title,
        inicioYmd,
        finYmd,
        disponible: oa.available !== false,
        actividades,
        evaluaciones: evalsMod,
      });

      eventosCalendario.push({
        id: `mod-${s.levelSubjectId}-${oa.weekNumber}`,
        fecha: inicioYmd,
        fechaFin: finYmd,
        capa: "oficial",
        tipo: "modulo_inicio",
        titulo: `${s.subjectName} · ${oa.code}`,
        detalle: oa.title,
        levelSubjectId: s.levelSubjectId,
        href: mode === "aula_universal" ? "/vortice/aula" : `/course/${level.id}-${s.subjectSlug}`,
      });
    }
  }

  for (const b of bloquesView.bloques) {
    eventosCalendario.push({
      id: `bloq-${b.id}`,
      fecha: b.fecha,
      capa: b.completado ? "realizado" : "pendiente",
      tipo: "bloque_personal",
      titulo: `${b.subjectName} · ${b.objectiveCode}`,
      detalle: `${b.duracionMin} min · ${b.objectiveTitle}`,
      levelSubjectId: b.levelSubjectId,
    });
  }

  // Consultar capa de conocimiento/retención vía API pública (`cargarMapaConocimiento`, respeta AC1).
  const retencionPendiente: RetencionPendienteInput[] = [];
  const confirmacionOtroDia: OaConfirmacionOtroDia[] = [];
  const subjectMat = input.find((s) => s.deliveryMode === "aula_universal");
  if (subjectMat && (await tablaExiste(db, "knowledge_domain_versions"))) {
    const mapa = await cargarMapaConocimiento(client, {
      estudianteId: userId,
      ahora: Math.floor(now.getTime() / 1000),
    });
    if (mapa.disponible) {
      for (const r of mapa.retencion.pendientes) {
        retencionPendiente.push({
          oaId: r.oaId,
          nombre: r.nombre,
          diasEsperando: r.diasEsperando,
          levelSubjectId: subjectMat.levelSubjectId,
          subjectName: subjectMat.subjectName,
        });
        eventosCalendario.push({
          id: `ret-${r.oaId}`,
          fecha: hoyYmd,
          capa: "consolidacion",
          tipo: "retencion",
          titulo: `Repaso de memoria · ${r.nombre}`,
          detalle: subjectMat.subjectName,
          levelSubjectId: subjectMat.levelSubjectId,
          href: "/vortice/conocimientos",
        });
      }
      for (const n of mapa.nodos) {
        if (n.estado === "incierto" && n.pendienteOtroDia) {
          confirmacionOtroDia.push({
            oaId: n.oaId,
            nombre: n.nombre,
            ultimoDiaPractica: ultDiaPorOa.get(n.oaId) ?? null,
            levelSubjectId: subjectMat.levelSubjectId,
            subjectName: subjectMat.subjectName,
            objectiveId: subjectMat.objectives[0]?.id ?? null,
          });
        }
      }
    }
  }

  // Continuaciones pendientes (`progression_continuations`) con etiqueta neutra (sin mencionar reprobación E2).
  const basesSugeridas: BaseSugeridaInput[] = [];
  const subjectNameByLs = new Map(input.map((s) => [s.levelSubjectId, s.subjectName]));
  for (const cont of continuaciones) {
    const lsId = cont.levelSubjectId ?? input[0]?.levelSubjectId ?? "";
    const subjectName = subjectNameByLs.get(lsId) ?? "Asignatura";
    for (const it of cont.pendingItems) {
      basesSugeridas.push({
        itemId: it.itemId,
        nombre: it.name ?? it.code ?? it.itemId,
        levelSubjectId: lsId,
        subjectName,
      });
    }
  }

  // Próxima evaluación (futura más cercana, o disponible hoy).
  candidatasEval.sort((a, b) => a.diasRestantes - b.diasRestantes || a.fechaYmd.localeCompare(b.fechaYmd));
  const proximaEvaluacion = candidatasEval[0] ?? null;

  const comparacion = calcularComparacionPlanReal({
    modulos,
    hoyYmd,
    feriados,
    recesos,
    semanasEvalGeneral,
    proximaEvaluacion,
  });

  const inicioProgramaYmd = ymdIn(CHILE_TZ, getModuleStartDate(1, config));
  const diasDesdeInicioPrograma = Math.max(0, diasEntreCivil(inicioProgramaYmd, hoyYmd));
  const estadoRitmo = diagnosticarRitmo({
    totalActividades: comparacion.totalActividades,
    completadas: comparacion.completadas,
    esperadoALaFecha: comparacion.esperadoALaFecha,
    brechaItems: comparacion.brechaItems,
    brechaPct: comparacion.brechaPct,
    modulosVencidos: comparacion.modulosVencidos,
    modulosVencidosCerrados: comparacion.modulosVencidosCerrados,
    modulosCerrados: comparacion.modulosCerrados,
    enPeriodoGracia: comparacion.enPeriodoGracia,
    proximaEvaluacion,
    inicioProgramaYmd,
    hoyYmd,
  });

  return {
    disponible: true,
    hoyYmd,
    nivel: level,
    track,
    config,
    feriados,
    recesos,
    semanasEvalGeneral,
    modulos,
    proximaEvaluacion,
    comparacion,
    estadoRitmo,
    preferencias,
    bloquesPersonalesSemana: bloquesView.bloques,
    retencionPendiente,
    confirmacionOtroDia,
    basesSugeridas,
    completadasUltimos28Dias: completadas28,
    diasDesdeInicioPrograma,
    eventosCalendario: eventosCalendario.sort((a, b) => a.fecha.localeCompare(b.fecha)),
  };
}

const AVISO_OFICIAL =
  "Planificación visual personal: es una orientación y simulación para organizar tu tiempo; no modifica el calendario oficial, los contenidos ni las fechas de evaluación.";

export async function cargarPlanificadorAdaptativo(
  db: Db,
  client: Client,
  userId: string,
  now: Date,
): Promise<PlanificadorAdaptativoDTO> {
  const ctx = await construirContextoPlanificador(db, client, userId, now);
  if (!ctx.disponible) {
    return {
      disponible: false,
      motivoNoDisponible: ctx.motivoNoDisponible,
      hoyYmd: ctx.hoyYmd,
      zonaHoraria: CHILE_TZ,
      nivel: ctx.nivel,
      track: ctx.track,
      estadoRitmo: "sin_datos",
      etiquetaEstado: etiquetaRitmo("sin_datos"),
      ritmoApoderado: "sin_datos",
      comparacion: ctx.comparacion,
      proximaEvaluacion: null,
      recomendaciones: [],
      preferencias: ctx.preferencias,
      bloquesPersonalesSemana: ctx.bloquesPersonalesSemana,
      simulacionDefecto: {
        intensidad: ctx.preferencias.intensidad,
        horizonteSemanas: 2,
        bloques: [],
        proyeccion: calcularProyecciones({
          track: ctx.track,
          comparacion: ctx.comparacion,
          completadasUltimos28Dias: 0,
          diasDesdeInicioPrograma: 0,
          intensidadSimulada: ctx.preferencias.intensidad,
          proximaEvaluacion: null,
        }),
      },
      eventosCalendario: [],
      avisoOficial: AVISO_OFICIAL,
    };
  }

  const siguienteActividad =
    ctx.modulos
      .flatMap((m) => m.actividades)
      .find((a) => !a.completada && a.moduleOpen) ?? null;

  const recomendaciones = generarRecomendacionesAdaptativas({
    estado: ctx.estadoRitmo,
    comparacion: ctx.comparacion,
    proximaEvaluacion: ctx.proximaEvaluacion,
    siguienteActividad,
    retencionPendiente: ctx.retencionPendiente,
    confirmacionOtroDia: ctx.confirmacionOtroDia,
    basesSugeridas: ctx.basesSugeridas,
    track: ctx.track,
  });

  const horizonteDefecto: 1 | 2 | 4 = ctx.track === "basica-1-4" ? 1 : 2;
  const bloquesSim = simularReorganizacion({
    hoyYmd: ctx.hoyYmd,
    track: ctx.track,
    preferencias: ctx.preferencias,
    intensidadSimulada: ctx.preferencias.intensidad,
    horizonteSemanas: horizonteDefecto,
    modulos: ctx.modulos,
    proximaEvaluacion: ctx.proximaEvaluacion,
    retencionPendiente: ctx.retencionPendiente,
    confirmacionOtroDia: ctx.confirmacionOtroDia,
    basesSugeridas: ctx.basesSugeridas,
    feriados: ctx.feriados,
    recesos: ctx.recesos,
    semanasEvalGeneral: ctx.semanasEvalGeneral,
  });

  const proyeccion = calcularProyecciones({
    track: ctx.track,
    comparacion: ctx.comparacion,
    completadasUltimos28Dias: ctx.completadasUltimos28Dias,
    diasDesdeInicioPrograma: ctx.diasDesdeInicioPrograma,
    intensidadSimulada: ctx.preferencias.intensidad,
    proximaEvaluacion: ctx.proximaEvaluacion,
  });

  return {
    disponible: true,
    hoyYmd: ctx.hoyYmd,
    zonaHoraria: CHILE_TZ,
    nivel: ctx.nivel,
    track: ctx.track,
    estadoRitmo: ctx.estadoRitmo,
    etiquetaEstado: etiquetaRitmo(ctx.estadoRitmo),
    ritmoApoderado: ritmoParaApoderado(ctx.estadoRitmo),
    comparacion: ctx.comparacion,
    proximaEvaluacion: ctx.proximaEvaluacion,
    recomendaciones,
    preferencias: ctx.preferencias,
    bloquesPersonalesSemana: ctx.bloquesPersonalesSemana,
    simulacionDefecto: {
      intensidad: ctx.preferencias.intensidad,
      horizonteSemanas: horizonteDefecto,
      bloques: bloquesSim,
      proyeccion,
    },
    eventosCalendario: ctx.eventosCalendario,
    avisoOficial: AVISO_OFICIAL,
  };
}

/** Simulación estrictamente de solo lectura: nunca escribe en la base de datos. */
export async function simularPlanificadorAdaptativo(
  db: Db,
  client: Client,
  userId: string,
  input: SimularPlanificadorInput,
  now: Date,
): Promise<SimulacionPlanificadorDTO> {
  const ctx = await construirContextoPlanificador(db, client, userId, now);
  const horizonte: 1 | 2 | 4 = input.horizonteSemanas ?? (ctx.track === "basica-1-4" ? 1 : 2);
  const bloques = ctx.disponible
    ? simularReorganizacion({
        hoyYmd: ctx.hoyYmd,
        track: ctx.track,
        preferencias: ctx.preferencias,
        intensidadSimulada: input.intensidad,
        diasPreferidosOverride: input.diasPreferidos,
        horizonteSemanas: horizonte,
        modulos: ctx.modulos,
        proximaEvaluacion: ctx.proximaEvaluacion,
        retencionPendiente: ctx.retencionPendiente,
        confirmacionOtroDia: ctx.confirmacionOtroDia,
        basesSugeridas: ctx.basesSugeridas,
        feriados: ctx.feriados,
        recesos: ctx.recesos,
        semanasEvalGeneral: ctx.semanasEvalGeneral,
      })
    : [];

  const proyeccion = calcularProyecciones({
    track: ctx.track,
    comparacion: ctx.comparacion,
    completadasUltimos28Dias: ctx.completadasUltimos28Dias,
    diasDesdeInicioPrograma: ctx.diasDesdeInicioPrograma,
    intensidadSimulada: input.intensidad,
    proximaEvaluacion: ctx.proximaEvaluacion,
  });

  return {
    hoyYmd: ctx.hoyYmd,
    intensidad: input.intensidad,
    horizonteSemanas: horizonte,
    bloques,
    proyeccion,
    avisoOficial: AVISO_OFICIAL,
  };
}
