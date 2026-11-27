// Planificador Adaptativo («Mi calendario») · Etapa 3 (interfaz visual).
// Consume exclusivamente GET /api/vortice/calendario y POST /api/vortice/calendario/simular.
// No duplica lógica de negocio, no modifica el calendario oficial y respeta la paleta Vórtice (cero verde).
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Info,
  List,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import StateBlock from "@/components/vortice/StateBlock";
import { VorticeShell } from "@/components/vortice/VorticeShell";
import type { IntensidadBrujula } from "@shared/brujula";
import type {
  BloqueSimulado,
  ComparacionPlanReal,
  EstadoRitmoPlanificador,
  EventoCalendario,
  ProximaEvaluacionCalendario,
  ProyeccionEscenario,
  RecomendacionAdaptativa,
} from "@shared/planificadorAdaptativo";
import { SinSesion } from "./SinSesion";
import { useInicioDatos } from "./useInicioDatos";
import "./calendario.css";

interface PlanificadorResponse {
  disponible: boolean;
  motivoNoDisponible?: "sin_curso" | "fuera_de_tramo";
  hoyYmd: string;
  zonaHoraria: string;
  nivel: { id: string; name: string } | null;
  track: "basica-1-4" | "basica-5-8" | "media" | null;
  estadoRitmo: EstadoRitmoPlanificador;
  etiquetaEstado: string;
  ritmoApoderado: "al_dia" | "por_recuperar" | "adelantado" | "sin_datos";
  comparacion: ComparacionPlanReal;
  proximaEvaluacion: ProximaEvaluacionCalendario | null;
  recomendaciones: RecomendacionAdaptativa[];
  preferencias: {
    intensidad: IntensidadBrujula;
    diasPreferidos: number[];
    franja: "manana" | "tarde" | "noche";
  };
  bloquesPersonalesSemana: Array<{
    id: string;
    fecha: string;
    duracionMin: number;
    subjectName: string;
    objectiveCode: string;
    objectiveTitle: string;
    completado: boolean;
  }>;
  simulacionDefecto: {
    intensidad: IntensidadBrujula;
    horizonteSemanas: 1 | 2 | 4;
    bloques: BloqueSimulado[];
    proyeccion: ProyeccionEscenario;
  };
  eventosCalendario: EventoCalendario[];
  avisoOficial: string;
}

interface SimulacionResponse {
  hoyYmd: string;
  intensidad: IntensidadBrujula;
  horizonteSemanas: 1 | 2 | 4;
  bloques: BloqueSimulado[];
  proyeccion: ProyeccionEscenario;
  avisoOficial: string;
}

const DIAS_CORTO = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const INTENSIDADES_UI: Array<{ id: IntensidadBrujula; label: string; detalle: string }> = [
  { id: "suave", label: "Suave", detalle: "3 bloques/sem" },
  { id: "normal", label: "Normal", detalle: "5 bloques/sem" },
  { id: "intensivo", label: "Intensivo", detalle: "6 bloques/sem" },
];

function sumarDiasYmd(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

function inicioSemanaYmd(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const offset = dow === 0 ? 6 : dow - 1;
  return sumarDiasYmd(ymd, -offset);
}

function formatoDiaCorto(ymd: string): string {
  return new Date(`${ymd}T12:00:00Z`).toLocaleDateString("es-CL", { day: "numeric", month: "short", timeZone: "UTC" });
}

function formatoMesAnio(year: number, monthIdx: number): string {
  return new Date(Date.UTC(year, monthIdx, 15)).toLocaleDateString("es-CL", { month: "long", year: "numeric", timeZone: "UTC" });
}

function IconoRitmo({ estado }: { estado: EstadoRitmoPlanificador }) {
  if (estado === "adelantado") return <Sparkles size={16} aria-hidden="true" />;
  if (estado === "en_ritmo") return <CheckCircle2 size={16} aria-hidden="true" />;
  if (estado === "riesgo_evaluacion" || estado === "atraso_significativo") return <AlertTriangle size={16} aria-hidden="true" />;
  if (estado === "levemente_atrasado") return <TrendingUp size={16} aria-hidden="true" />;
  return <Compass size={16} aria-hidden="true" />;
}

function claseRitmo(estado: EstadoRitmoPlanificador, esBasica14: boolean): string {
  if (esBasica14 && (estado === "atraso_significativo" || estado === "riesgo_evaluacion")) {
    return "vx-cal-ritmo-suave-basica";
  }
  return `vx-cal-ritmo-${estado}`;
}

export default function VorticeCalendario() {
  const datos = useInicioDatos();
  const [vista, setVista] = useState<"semana" | "mes" | "lista">("semana");
  const [offsetSemana, setOffsetSemana] = useState(0);
  const [offsetMes, setOffsetMes] = useState(0);
  const [intensidadSim, setIntensidadSim] = useState<IntensidadBrujula | null>(null);
  const [horizonteSim, setHorizonteSim] = useState<1 | 2 | 4 | null>(null);
  const [simulacionActiva, setSimulacionActiva] = useState<SimulacionResponse | null>(null);

  const calQuery = useQuery<PlanificadorResponse>({
    queryKey: ["/api/vortice/calendario"],
    enabled: datos.sesion,
    queryFn: async () => {
      const res = await fetch("/api/vortice/calendario", { credentials: "include" });
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      if (res.status === 403) throw new Error("FORBIDDEN");
      if (!res.ok) throw new Error("No pudimos cargar tu calendario adaptativo.");
      return res.json();
    },
    retry: false,
  });

  const simularMutation = useMutation({
    mutationFn: async (payload: { intensidad: IntensidadBrujula; horizonteSemanas: 1 | 2 | 4 }) => {
      const res = await fetch("/api/vortice/calendario/simular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "No pudimos generar la simulación.");
      }
      return (await res.json()) as SimulacionResponse;
    },
    onSuccess: (res) => setSimulacionActiva(res),
  });

  const data = calQuery.data;
  const esBasica14 = data?.track === "basica-1-4";
  const nombre = datos.usuario.data?.firstName || datos.usuario.data?.name?.split(" ")[0] || null;
  const hoyYmd = data?.hoyYmd ?? new Date().toISOString().slice(0, 10);

  const intensidadMostrada: IntensidadBrujula = intensidadSim ?? data?.simulacionDefecto.intensidad ?? "normal";
  const horizonteMostrado: 1 | 2 | 4 = horizonteSim ?? data?.simulacionDefecto.horizonteSemanas ?? (esBasica14 ? 1 : 2);
  const bloquesSimulados = simulacionActiva?.bloques ?? data?.simulacionDefecto.bloques ?? [];
  const proyeccion = simulacionActiva?.proyeccion ?? data?.simulacionDefecto.proyeccion ?? null;

  // Combinar eventos oficiales/personales con los bloques de la simulación activa para visualizarlos diferenciados.
  const eventosPorDia = useMemo(() => {
    const mapa = new Map<string, EventoCalendario[]>();
    const agregar = (fecha: string, ev: EventoCalendario) => {
      const arr = mapa.get(fecha) ?? [];
      arr.push(ev);
      mapa.set(fecha, arr);
    };
    for (const ev of data?.eventosCalendario ?? []) {
      agregar(ev.fecha, ev);
    }
    for (const b of bloquesSimulados) {
      agregar(b.fecha, {
        id: b.id,
        fecha: b.fecha,
        capa: "simulacion",
        tipo: "bloque_simulado",
        titulo: b.titulo,
        detalle: `${b.etiquetaPrioridad} · ${b.duracionMin} min`,
        levelSubjectId: b.levelSubjectId,
        href: b.href,
      });
    }
    return mapa;
  }, [data?.eventosCalendario, bloquesSimulados]);

  const diasSemana = useMemo(() => {
    const lunes = sumarDiasYmd(inicioSemanaYmd(hoyYmd), offsetSemana * 7);
    return Array.from({ length: 7 }, (_, i) => sumarDiasYmd(lunes, i));
  }, [hoyYmd, offsetSemana]);

  const grillaMes = useMemo(() => {
    const [yBase, mBase] = hoyYmd.split("-").map(Number);
    const ref = new Date(Date.UTC(yBase, mBase - 1 + offsetMes, 1));
    const year = ref.getUTCFullYear();
    const monthIdx = ref.getUTCMonth();
    const primeroYmd = `${year}-${String(monthIdx + 1).padStart(2, "0")}-01`;
    const inicioGrilla = inicioSemanaYmd(primeroYmd);
    const celdas = Array.from({ length: 35 }, (_, i) => {
      const ymd = sumarDiasYmd(inicioGrilla, i);
      return { ymd, enMes: Number(ymd.slice(5, 7)) === monthIdx + 1 };
    });
    return { titulo: formatoMesAnio(year, monthIdx), celdas };
  }, [hoyYmd, offsetMes]);

  const ejecutarSimulacion = (nuevaInt: IntensidadBrujula, nuevoHor: 1 | 2 | 4) => {
    setIntensidadSim(nuevaInt);
    setHorizonteSim(nuevoHor);
    simularMutation.mutate({ intensidad: nuevaInt, horizonteSemanas: nuevoHor });
  };

  if (!datos.sesion) return <SinSesion cargando={datos.usuario.isLoading} enPreview={datos.enPreview} />;

  return (
    <VorticeShell
      variante="estudiante"
      activo="calendario"
      nombre={nombre}
      detalle={data?.nivel?.name ?? datos.overview.data?.level?.name ?? "Planificador personal"}
      tramo={data?.track ?? datos.overview.data?.track}
      salirHref={datos.salir}
    >
      <div className="vx-cal-pagina">
        <header className="vx-cal-header">
          <div>
            <span className="vx-cal-kicker">Planificador Adaptativo</span>
            <h1 className="vx-titulo">Mi calendario</h1>
          </div>
          <Link className="vx-link" href="/vortice/mi-ano">
            Ver calendario oficial del año
          </Link>
        </header>

        <div className="vx-cal-aviso-oficial" role="note">
          <Info size={18} aria-hidden="true" />
          <span>
            <strong>Propuesta personal de organización del estudio:</strong>{" "}
            {data?.avisoOficial ??
              "Esta vista te ayuda a organizar tu ritmo sin modificar tu calendario oficial, contenidos ni fechas de evaluación."}
          </span>
        </div>

        {calQuery.isLoading ? (
          <div className="space-y-4" aria-label="Cargando Mi calendario">
            <Skeleton className="h-36 w-full rounded-2xl bg-(--vx-surface)" />
            <Skeleton className="h-64 w-full rounded-2xl bg-(--vx-surface)" />
          </div>
        ) : calQuery.isError ? (
          <StateBlock
            tipo="error"
            texto={
              (calQuery.error as Error)?.message === "FORBIDDEN"
                ? "Mi calendario está disponible solo para cuentas de estudiante."
                : "No pudimos cargar tu planificación en este momento."
            }
            onReintentar={() => calQuery.refetch()}
          />
        ) : !data?.disponible ? (
          <section className="vx-card" aria-label="Estado de disponibilidad">
            <h2>Tu calendario estará disponible pronto</h2>
            <p className="text-(--vx-ink-soft) mt-2">
              {data?.motivoNoDisponible === "fuera_de_tramo"
                ? "El Planificador Adaptativo está diseñado para los cursos de 1.º Básico a 4.º Medio."
                : "Cuando tengas un curso asignado, aquí verás tu planificación oficial comparada con tu avance real."}
            </p>
            <div className="mt-4">
              <Link className="vx-link" href="/vortice">Volver a Inicio</Link>
            </div>
          </section>
        ) : (
          <>
            {/* 1. ¿CÓMO VOY? + PRÓXIMA EVALUACIÓN */}
            <section className="vx-cal-resumen" aria-label="Estado general y próxima evaluación">
              <article className="vx-cal-estado-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`vx-cal-badge-ritmo ${claseRitmo(data.estadoRitmo, esBasica14)}`}>
                    <IconoRitmo estado={data.estadoRitmo} />
                    {data.etiquetaEstado}
                  </span>
                  <span className="text-xs text-(--vx-muted)">Hoy: {formatoDiaCorto(data.hoyYmd)}</span>
                </div>

                <div className="vx-cal-metricas-grid">
                  <div className="vx-cal-metrica">
                    <small>Completadas</small>
                    <strong>{data.comparacion.completadas}</strong>
                  </div>
                  <div className="vx-cal-metrica">
                    <small>Planificadas a hoy</small>
                    <strong>{Math.round(data.comparacion.esperadoALaFecha)}</strong>
                  </div>
                  <div className="vx-cal-metrica">
                    <small>Pendientes</small>
                    <strong>{data.comparacion.pendientes}</strong>
                  </div>
                </div>

                {!esBasica14 && data.comparacion.brechaPct !== null && (
                  <p className="text-sm text-(--vx-ink-soft) m-0">
                    {data.comparacion.brechaItems > 0
                      ? `Llevas ${Math.abs(data.comparacion.brechaItems).toFixed(1)} actividades por sobre lo planificado a hoy (+${data.comparacion.brechaPct} %).`
                      : data.comparacion.brechaItems < 0
                        ? `Tienes una diferencia de ${Math.abs(data.comparacion.brechaItems).toFixed(1)} actividades respecto de lo planificado a hoy (${data.comparacion.brechaPct} %).`
                        : "Tu avance coincide exactamente con lo planificado a la fecha."}
                  </p>
                )}
              </article>

              <article className="vx-cal-eval-card">
                <div className="space-y-2">
                  <span className="vx-cal-kicker">Próxima evaluación</span>
                  {data.proximaEvaluacion ? (
                    <>
                      <span className="vx-cal-eval-pill">
                        <CalendarClock size={14} aria-hidden="true" />
                        {data.proximaEvaluacion.diasRestantes === 0
                          ? "Disponible hoy"
                          : `En ${data.proximaEvaluacion.diasRestantes} ${data.proximaEvaluacion.diasRestantes === 1 ? "día" : "días"}`}
                      </span>
                      <h2 className="text-xl">{data.proximaEvaluacion.titulo}</h2>
                      <p className="text-sm text-(--vx-ink-soft) m-0">
                        {data.proximaEvaluacion.subjectName} · {formatoDiaCorto(data.proximaEvaluacion.fechaYmd)}
                        {data.proximaEvaluacion.pendientesDelModulo > 0
                          ? ` · ${data.proximaEvaluacion.pendientesDelModulo} actividades previas pendientes`
                          : " · Actividades previas al día"}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl">Sin evaluaciones pendientes próximas</h2>
                      <p className="text-sm text-(--vx-ink-soft) m-0">
                        Cuando se acerque una evaluación oficial aparecerá destacada aquí.
                      </p>
                    </>
                  )}
                </div>
                {data.proximaEvaluacion && (
                  <Link className="vx-link inline-flex items-center gap-1" href={data.proximaEvaluacion.href}>
                    Ir a la evaluación <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                )}
              </article>
            </section>

            {/* 2. CALENDARIO VISUAL (SEMANAL / MENSUAL / LISTA ACCESIBLE) */}
            <section className="vx-card space-y-4" aria-labelledby="vx-cal-vista-titulo">
              <div className="vx-cal-toolbar">
                <div>
                  <h2 id="vx-cal-vista-titulo">Tu planificación visual</h2>
                  <p className="text-xs text-(--vx-muted) m-0">
                    Compara hitos oficiales, lo realizado, tus pendientes y la propuesta personal.
                  </p>
                </div>
                <div className="vx-cal-tabs" role="group" aria-label="Modo de visualización del calendario">
                  <button
                    type="button"
                    className="vx-cal-tab"
                    aria-pressed={vista === "semana"}
                    onClick={() => setVista("semana")}
                  >
                    <CalendarDays size={14} className="inline mr-1" aria-hidden="true" />
                    Semana
                  </button>
                  {!esBasica14 && (
                    <button
                      type="button"
                      className="vx-cal-tab"
                      aria-pressed={vista === "mes"}
                      onClick={() => setVista("mes")}
                    >
                      Mes
                    </button>
                  )}
                  <button
                    type="button"
                    className="vx-cal-tab"
                    aria-pressed={vista === "lista"}
                    onClick={() => setVista("lista")}
                  >
                    <List size={14} className="inline mr-1" aria-hidden="true" />
                    Lista
                  </button>
                </div>
              </div>

              <div className="vx-cal-leyenda" aria-label="Leyenda de colores">
                <span className="vx-cal-leyenda-item"><span className="vx-cal-punto vx-cal-punto-oficial" />Plan oficial</span>
                <span className="vx-cal-leyenda-item"><span className="vx-cal-punto vx-cal-punto-realizado" />Realizado</span>
                <span className="vx-cal-leyenda-item"><span className="vx-cal-punto vx-cal-punto-pendiente" />Pendiente</span>
                <span className="vx-cal-leyenda-item"><span className="vx-cal-punto vx-cal-punto-simulacion" />Propuesta personal</span>
                <span className="vx-cal-leyenda-item"><span className="vx-cal-punto vx-cal-punto-consolidacion" />Repaso / consolidación</span>
              </div>

              {vista === "semana" && (
                <>
                  <div className="vx-cal-mes-nav">
                    <Button type="button" variant="outline" size="sm" onClick={() => setOffsetSemana((s) => s - 1)}>
                      <ChevronLeft size={15} /> Semana anterior
                    </Button>
                    <strong className="text-sm text-(--vx-ink)">
                      {formatoDiaCorto(diasSemana[0])} al {formatoDiaCorto(diasSemana[6])}
                    </strong>
                    <Button type="button" variant="outline" size="sm" onClick={() => setOffsetSemana((s) => s + 1)}>
                      Siguiente semana <ChevronRight size={15} />
                    </Button>
                  </div>
                  <div className="vx-cal-semana-grid">
                    {diasSemana.map((ymd, idx) => {
                      const evs = eventosPorDia.get(ymd) ?? [];
                      const esHoy = ymd === data.hoyYmd;
                      return (
                        <div key={ymd} className={`vx-cal-dia-col ${esHoy ? "vx-cal-dia-hoy" : ""}`}>
                          <div className="vx-cal-dia-head">
                            <span>{DIAS_CORTO[idx]}</span>
                            <strong>{ymd.slice(8)}</strong>
                          </div>
                          {evs.length === 0 ? (
                            <span className="text-xs text-(--vx-muted)">Sin hitos</span>
                          ) : (
                            evs.slice(0, 4).map((ev) =>
                              ev.href ? (
                                <Link key={ev.id} href={ev.href} className={`vx-cal-chip vx-cal-chip-${ev.capa}`}>
                                  <strong>{ev.titulo}</strong>
                                </Link>
                              ) : (
                                <span key={ev.id} className={`vx-cal-chip vx-cal-chip-${ev.capa}`}>
                                  <strong>{ev.titulo}</strong>
                                </span>
                              ),
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {vista === "mes" && !esBasica14 && (
                <>
                  <div className="vx-cal-mes-nav">
                    <Button type="button" variant="outline" size="sm" onClick={() => setOffsetMes((m) => m - 1)}>
                      <ChevronLeft size={15} /> Mes anterior
                    </Button>
                    <strong className="text-sm text-(--vx-ink)">
                      {grillaMes.titulo.charAt(0).toUpperCase() + grillaMes.titulo.slice(1)}
                    </strong>
                    <Button type="button" variant="outline" size="sm" onClick={() => setOffsetMes((m) => m + 1)}>
                      Mes siguiente <ChevronRight size={15} />
                    </Button>
                  </div>
                  <div className="vx-cal-mes-cabeceras" aria-hidden="true">
                    {DIAS_CORTO.map((dia) => (
                      <span key={dia}>{dia}</span>
                    ))}
                  </div>
                  <div className="vx-cal-mes-grid">
                    {grillaMes.celdas.map((celda) => {
                      const evs = eventosPorDia.get(celda.ymd) ?? [];
                      const esHoy = celda.ymd === data.hoyYmd;
                      return (
                        <div
                          key={celda.ymd}
                          className={`vx-cal-mes-celda ${celda.enMes ? "" : "vx-cal-mes-fuera"} ${esHoy ? "vx-cal-dia-hoy" : ""}`}
                        >
                          <span className="text-xs font-mono text-(--vx-muted)">{celda.ymd.slice(8)}</span>
                          {evs.slice(0, 2).map((ev) => (
                            <span key={ev.id} className={`vx-cal-chip vx-cal-chip-${ev.capa}`}>
                              {ev.titulo}
                            </span>
                          ))}
                          {evs.length > 2 && <span className="text-[11px] text-(--vx-muted)">+{evs.length - 2} más</span>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {vista === "lista" && (
                <div className="vx-cal-lista-sim">
                  {Array.from(eventosPorDia.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .slice(0, 20)
                    .map(([fecha, evs]) => (
                      <div key={fecha} className="vx-cal-asig-row">
                        <strong className="text-sm text-(--vx-ink)">{formatoDiaCorto(fecha)}</strong>
                        <div className="flex flex-wrap gap-2">
                          {evs.map((ev) => (
                            <span key={ev.id} className={`vx-cal-chip vx-cal-chip-${ev.capa}`}>
                              {ev.titulo} · {ev.detalle}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>

            {/* 3. ¿QUÉ RECOMIENDA VÓRTICE? + AVANCE POR ASIGNATURA */}
            <section className="vx-cal-dos-cols" aria-label="Recomendaciones y asignaturas">
              <article className="vx-card space-y-3">
                <h2>Qué recomienda Vórtice</h2>
                {data.recomendaciones.length === 0 ? (
                  <p className="text-sm text-(--vx-ink-soft)">
                    No hay recomendaciones urgentes hoy. Sigue a tu ritmo habitual.
                  </p>
                ) : (
                  <div className="vx-cal-lista-recs">
                    {data.recomendaciones.map((rec) => (
                      <div key={rec.id} className={`vx-cal-rec-item vx-cal-rec-${rec.prioridad}`}>
                        <strong className="text-[15px] text-(--vx-ink)">{rec.titulo}</strong>
                        <p className="text-sm text-(--vx-ink-soft) m-0">{rec.mensaje}</p>
                        <Link className="vx-link inline-flex items-center gap-1 text-sm" href={rec.accionHref}>
                          {rec.accionTexto} <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="vx-card space-y-3">
                <h2>Avance por asignatura</h2>
                {data.comparacion.porAsignatura.length === 0 ? (
                  <p className="text-sm text-(--vx-ink-soft)">Aún no tienes asignaturas con actividades cargadas.</p>
                ) : (
                  <div className="vx-cal-lista-asigs">
                    {data.comparacion.porAsignatura.map((asig) => {
                      const pct = asig.totalActividades > 0
                        ? Math.round((asig.completadas / asig.totalActividades) * 100)
                        : 0;
                      return (
                        <div key={asig.levelSubjectId} className="vx-cal-asig-row">
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-[15px] text-(--vx-ink)">{asig.subjectName}</strong>
                            <span className="text-xs text-(--vx-muted)">
                              {asig.completadas} / {asig.totalActividades} actividades
                            </span>
                          </div>
                          <Progress
                            value={pct}
                            aria-label={`Avance en ${asig.subjectName}`}
                            className="h-2 bg-(--vx-line) [&>div]:bg-(--vx-primary)"
                          />
                          <span className="text-xs text-(--vx-ink-soft)">
                            Planificado a hoy: {Math.round(asig.esperadoALaFecha)} · Pendientes: {asig.pendientes}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            </section>

            {/* 4. PROPUESTA PERSONAL DE ORGANIZACIÓN (SIMULADOR VISUAL SOLO LECTURA) */}
            <section className="vx-cal-simulador" aria-labelledby="vx-cal-sim-titulo">
              <div className="space-y-1">
                <span className="vx-cal-sim-badge">
                  <Sparkles size={13} aria-hidden="true" />
                  Propuesta personal de organización del estudio
                </span>
                <h2 id="vx-cal-sim-titulo">Simular reorganización de mi tiempo</h2>
                <p className="text-sm text-(--vx-ink-soft) m-0">
                  Explora cómo se distribuirían tus pendientes según tu intensidad. Esta simulación es solo visual y{" "}
                  <strong>no modifica tu calendario oficial ni tus evaluaciones</strong>.
                </p>
              </div>

              <div className="vx-cal-sim-controles" role="group" aria-label="Elegir intensidad de simulación">
                {INTENSIDADES_UI.map((opt) => (
                  <Button
                    key={opt.id}
                    type="button"
                    size="sm"
                    variant={intensidadMostrada === opt.id ? "default" : "outline"}
                    disabled={simularMutation.isPending}
                    onClick={() => ejecutarSimulacion(opt.id, horizonteMostrado)}
                  >
                    {opt.label} ({opt.detalle})
                  </Button>
                ))}
                {!esBasica14 && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs text-(--vx-muted)">Horizonte:</span>
                    {([1, 2, 4] as const).map((h) => (
                      <Button
                        key={h}
                        type="button"
                        size="sm"
                        variant={horizonteMostrado === h ? "default" : "outline"}
                        disabled={simularMutation.isPending}
                        onClick={() => ejecutarSimulacion(intensidadMostrada, h)}
                      >
                        {h} sem
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {simularMutation.isError && (
                <StateBlock
                  tipo="error"
                  texto={(simularMutation.error as Error)?.message || "No pudimos recalcular la simulación."}
                  onReintentar={() => ejecutarSimulacion(intensidadMostrada, horizonteMostrado)}
                />
              )}

              {proyeccion && (
                <div className="vx-cal-proyeccion" aria-label="Estimación orientativa">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm text-(--vx-ink)">Estimación orientativa (no es garantía)</strong>
                    {proyeccion.disponible && proyeccion.ritmoActualSemanal !== null && (
                      <span className="text-xs font-mono text-(--vx-violeta)">
                        Ritmo real: ~{proyeccion.ritmoActualSemanal}/sem · Simulado: {proyeccion.ritmoSimuladoSemanal}/sem
                      </span>
                    )}
                  </div>
                  <p className="m-0 text-(--vx-ink-soft)">{proyeccion.mensajeOrientativo}</p>
                  {proyeccion.supuestos.length > 0 && (
                    <ul className="vx-cal-supuestos">
                      {proyeccion.supuestos.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {bloquesSimulados.length === 0 ? (
                <p className="text-sm text-(--vx-ink-soft) m-0">
                  No hay actividades pendientes para reorganizar en este horizonte.
                </p>
              ) : (
                <div className="vx-cal-lista-sim">
                  {bloquesSimulados.slice(0, 8).map((b) => (
                    <div key={b.id} className="vx-cal-asig-row">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm text-(--vx-ink)">
                          {formatoDiaCorto(b.fecha)} · {b.titulo}
                        </strong>
                        <span className="text-xs font-mono text-(--vx-violeta)">
                          {b.etiquetaPrioridad} · {b.duracionMin} min
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-(--vx-muted)">
                        <span>{b.subjectName}</span>
                        <Link className="vx-link" href={b.href}>Abrir actividad</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </VorticeShell>
  );
}
