// Vista «Mis conocimientos» (M3): constelación conectada de los contenidos del piloto
// + alternativa accesible en lista + sugerencia determinista («Te sugerimos…», sin IA ni candados).
// Nunca mezcla lentes: completar un video/lectura no enciende una estrella; solo practicar y comprobar sin pistas.
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Lock,
  RotateCcw,
  Sparkles,
  Star,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import StateBlock from "@/components/vortice/StateBlock";
import type {
  AristaMapa,
  EstadoVisualMapa,
  NodoMapa,
  RecomendacionMapa,
  ResumenMapaConocimiento,
} from "@shared/mapaConocimiento";
import type { ResumenEvaluacionMapa } from "@shared/cruceEvaluacionMapa";
import type { ItemRetencionProgramado } from "@shared/retencionMapa";
import "./vortice-editorial.css";

interface PreguntaRetencionItem {
  preguntaVersionId: string;
  preguntaId: string;
  enunciado: string;
  opciones: Array<{ id: string; texto: string }>;
}

interface ItemRetencionConPregunta extends ItemRetencionProgramado {
  pregunta: PreguntaRetencionItem | null;
}

interface MapaConocimientoResponse {
  disponible: boolean;
  dominioId: string;
  dominioNombre: string | null;
  politicaActiva: boolean;
  tieneEvidencia: boolean;
  nodos: NodoMapa[];
  aristas: AristaMapa[];
  recomendacion: RecomendacionMapa | null;
  resumen: ResumenMapaConocimiento;
  retencion: {
    hoy: string;
    pendientesCount: number;
    pendientes: ItemRetencionConPregunta[];
    proximas: ItemRetencionProgramado[];
  };
  evaluacion: ResumenEvaluacionMapa | null;
}

const truncPct = (n: number) =>
  (Math.floor(n * 100) / 100).toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const POSICION_NODO: Record<string, { x: number; y: number }> = {
  oa7: { x: 80, y: 120 },
  oa8: { x: 215, y: 55 },
  oa10: { x: 215, y: 185 },
  oa11: { x: 350, y: 185 },
  oa13: { x: 470, y: 120 },
};

const ESTILO_ESTADO: Record<
  EstadoVisualMapa,
  { fill: string; stroke: string; badgeClass: string; simbolo: string }
> = {
  dominado: {
    fill: "#D4942A",
    stroke: "var(--vx-primary)",
    badgeClass: "bg-(--vx-acento-soft) text-(--vx-primary) border-(--vx-primary)/30",
    simbolo: "★",
  },
  por_comprobar: {
    fill: "#FEF6EA",
    stroke: "#8A5A10",
    badgeClass: "bg-[#FEF6EA] text-[#8A5A10] border-[#D4942A]/40",
    simbolo: "✦",
  },
  incierto: {
    fill: "#EEF4FC",
    stroke: "#2F5EA8",
    badgeClass: "bg-[#EEF4FC] text-[#2F5EA8] border-[#2F5EA8]/35",
    simbolo: "◐",
  },
  no_dominado: {
    fill: "#FBF0EB",
    stroke: "#9A4225",
    badgeClass: "bg-[#FBF0EB] text-[#9A4225] border-[#C96442]/40",
    simbolo: "↺",
  },
  listo: {
    fill: "#FFFFFF",
    stroke: "var(--vx-primary)",
    badgeClass: "bg-white text-(--vx-primary) border-(--vx-primary)/40",
    simbolo: "◎",
  },
  bloqueado: {
    fill: "#F3F1EA",
    stroke: "#A8A296",
    badgeClass: "bg-[#F3F1EA] text-[#5E5D59] border-[#D5CFC2]",
    simbolo: "·",
  },
};

function IconoEstado({ estadoVisual }: { estadoVisual: EstadoVisualMapa }) {
  if (estadoVisual === "dominado") return <CheckCircle2 className="w-4 h-4 text-(--vx-primary) shrink-0" />;
  if (estadoVisual === "por_comprobar") return <Sparkles className="w-4 h-4 text-[#8A5A10] shrink-0" />;
  if (estadoVisual === "no_dominado") return <RotateCcw className="w-4 h-4 text-[#9A4225] shrink-0" />;
  if (estadoVisual === "bloqueado") return <Lock className="w-4 h-4 text-[#87867F] shrink-0" />;
  return <Star className="w-4 h-4 text-[#2F5EA8] shrink-0" />;
}

export default function VorticeMapa() {
  const queryClient = useQueryClient();
  const mapaQuery = useQuery<MapaConocimientoResponse>({
    queryKey: ["/api/vortice/conocimiento/mapa"],
    queryFn: async () => {
      const res = await fetch("/api/vortice/conocimiento/mapa", { credentials: "include" });
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      if (!res.ok) throw new Error("No pudimos cargar el mapa");
      return res.json();
    },
    retry: false,
  });

  const data = mapaQuery.data;
  const nodos = data?.nodos ?? [];
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [retencionIdx, setRetencionIdx] = useState(0);
  const [retencionOpcion, setRetencionOpcion] = useState<string | null>(null);
  const [retencionFeedback, setRetencionFeedback] = useState<{
    correcta: boolean;
    explicacion: string | null;
    nombre: string;
  } | null>(null);
  const [retencionError, setRetencionError] = useState<string | null>(null);

  const retencionMutation = useMutation({
    mutationFn: async (vars: {
      dominioId: string;
      oaId: string;
      preguntaId: string;
      opcionId: string;
      nombre: string;
    }) => {
      const res = await fetch("/api/vortice/conocimiento/retencion", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dominioId: vars.dominioId,
          oaId: vars.oaId,
          preguntaId: vars.preguntaId,
          opcionId: vars.opcionId,
          clientSubmissionId: crypto.randomUUID(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message ?? "No pudimos registrar tu repaso");
      return {
        correcta: Boolean(json?.correcta),
        explicacion: typeof json?.explicacion === "string" ? json.explicacion : null,
        nombre: vars.nombre,
      };
    },
    onSuccess: async (res) => {
      setRetencionError(null);
      setRetencionFeedback(res);
      setRetencionOpcion(null);
      setRetencionIdx(0);
      await queryClient.invalidateQueries({ queryKey: ["/api/vortice/conocimiento/mapa"] });
    },
    onError: (err) => {
      setRetencionError((err as Error).message);
    },
  });

  useEffect(() => {
    if (!nodos.length) return;
    if (seleccionadoId && nodos.some((n) => n.itemId === seleccionadoId)) return;
    const pref =
      nodos.find((n) => n.itemId === data?.recomendacion?.itemId) ??
      nodos.find((n) => n.estadoVisual === "listo") ??
      nodos[0];
    setSeleccionadoId(pref?.itemId ?? null);
  }, [nodos, seleccionadoId, data?.recomendacion?.itemId]);

  if (mapaQuery.isError && (mapaQuery.error as Error).message === "UNAUTHORIZED") {
    return (
      <div className="vx-editorial min-h-screen flex items-center justify-center p-6">
        <Card className="vx-paper max-w-md w-full border-[#E6E2D8] shadow-none">
          <CardHeader>
            <span className="vx-kicker">Sesión requerida</span>
            <CardTitle className="vx-serif font-medium text-2xl mt-1">Inicia sesión para ver Mis conocimientos</CardTitle>
            <CardDescription className="text-[#5E5D59]">
              Necesitas entrar con tu cuenta para consultar tu mapa real de dominio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/vortice" className="vx-btn-primary">
              Ir a Vórtice
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nodoPorId = new Map(nodos.map((n) => [n.itemId, n]));
  const seleccionado = (seleccionadoId && nodoPorId.get(seleccionadoId)) || nodos[0] || null;
  const destinoAula = seleccionado
    ? seleccionado.estadoVisual === "bloqueado" && seleccionado.faltantes[0]
      ? `/vortice/aula/${encodeURIComponent(seleccionado.faltantes[0].oaId)}`
      : `/vortice/aula/${encodeURIComponent(seleccionado.oaId)}`
    : "/vortice/aula";

  return (
    <div className="vx-editorial min-h-screen">
      <header className="vx-topbar">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link href="/vortice" className="vx-pill-nav">
            <ArrowLeft className="w-4 h-4" />
            Volver a Vórtice
          </Link>
          <div className="flex items-center gap-3">
            <span className="vx-kicker hidden sm:inline">5.º Básico · Matemática</span>
            <Link href="/vortice/aula" className="vx-btn-primary min-h-0 h-9 px-4 text-sm">
              Ir al Aula Universal
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="space-y-1">
              <span className="vx-kicker">Constelación de aprendizaje · M3</span>
              <h1 className="text-3xl sm:text-[2.35rem] leading-[1.12] text-[#141413]">Mis conocimientos</h1>
              <p className="text-[14.5px] leading-relaxed text-[#5E5D59] max-w-[68ch] pt-1">
                Completar lecturas o videos ordena tu camino, pero <strong className="text-[#141413] font-medium">no enciende estrellas</strong>. Las estrellas
                se confirman cuando practicas y compruebas sin pistas en dos ejercicios distintos.
                {!data?.tieneEvidencia && " Tu mapa se irá encendiendo desde tu primera práctica o comprobación."}
              </p>
            </div>

        {mapaQuery.isLoading ? (
          <StateBlock tipo="cargando" filas={4} />
        ) : mapaQuery.isError ? (
          <StateBlock tipo="error" texto="No pudimos cargar el mapa." onReintentar={() => mapaQuery.refetch()} />
        ) : !data?.disponible || nodos.length === 0 ? (
          <Card className="vx-paper border-[#E6E2D8] shadow-none">
            <CardContent className="py-4">
              <Empty className="border border-dashed border-[#D5CFC2] bg-[#FAF9F5]/80 py-8 px-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Compass className="text-(--vx-primary)" />
                  </EmptyMedia>
                  <EmptyTitle className="vx-serif font-medium text-xl text-[#141413]">
                    Mapa aún no disponible
                  </EmptyTitle>
                  <EmptyDescription>
                    Este curso todavía no tiene un mapa publicado en el piloto.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Link href="/vortice/aula" className="vx-btn-primary">
                    Ir a estudiar en el Aula
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Sugerencia determinista de siguiente paso */}
            {data.recomendacion && (
              <Card className="rounded-2xl border border-(--vx-primary)/25 bg-(--vx-acento-soft) shadow-none">
                <CardContent className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="vx-kicker !text-(--vx-primary) flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" />
                      Siguiente paso sugerido
                    </div>
                    <p className="vx-serif font-medium text-lg sm:text-xl text-[#141413] leading-snug">
                      {data.recomendacion.motivo}
                    </p>
                  </div>
                  <Link href={`/vortice/aula/${encodeURIComponent(data.recomendacion.oaId)}`} className="vx-btn-primary">
                    Ir a {data.recomendacion.oaId.toUpperCase()}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Resumen de estados sin porcentajes ni notas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <Card className="vx-paper border-[#E6E2D8] shadow-none">
                <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="text-xs font-medium text-[#5E5D59]">Lo dominas</div>
                    <div className="vx-serif text-[2rem] leading-none font-medium text-(--vx-primary) mt-2">
                      {data.resumen.dominados}
                    </div>
                  </div>
                  <Progress
                    value={nodos.length ? (data.resumen.dominados / nodos.length) * 100 : 0}
                    aria-label="Progreso visual de contenidos dominados"
                    className="mt-3 h-1.5 bg-[#ECE8DE] [&>div]:bg-(--vx-primary)"
                  />
                </CardContent>
              </Card>
              <Card className="vx-paper border-[#E6E2D8] shadow-none">
                <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="text-xs font-medium text-[#5E5D59]">En práctica / refuerzo</div>
                    <div className="vx-serif text-[2rem] leading-none font-medium text-[#141413] mt-2">
                      {data.resumen.enPractica + data.resumen.porReforzar + data.resumen.porComprobar}
                    </div>
                  </div>
                  <span className="text-[11px] text-[#87867F] mt-3 block">Por consolidar</span>
                </CardContent>
              </Card>
              <Card className="vx-paper border-[#E6E2D8] shadow-none">
                <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="text-xs font-medium text-[#5E5D59]">Listos para aprender</div>
                    <div className="vx-serif text-[2rem] leading-none font-medium text-(--vx-primary) mt-2">
                      {data.resumen.listos}
                    </div>
                  </div>
                  <span className="text-[11px] text-[#87867F] mt-3 block">Base completada</span>
                </CardContent>
              </Card>
              <Card className="vx-paper border-[#E6E2D8] shadow-none">
                <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="text-xs font-medium text-[#5E5D59]">Esperando su base</div>
                    <div className="vx-serif text-[2rem] leading-none font-medium text-[#87867F] mt-2">
                      {data.resumen.bloqueados}
                    </div>
                  </div>
                  <span className="text-[11px] text-[#87867F] mt-3 block">Se abren al avanzar</span>
                </CardContent>
              </Card>
            </div>

            {/* Comprobaciones de retención espaciada (M4, sin reloj ni castigo por ausencia) */}
            {(data.retencion?.pendientes?.length > 0 || data.retencion?.proximas?.length > 0 || retencionFeedback) && (
              <Card className="vx-paper border-[#E6E2D8] shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="vx-serif font-medium text-xl">Repaso breve para mantener tus estrellas</CardTitle>
                    <Badge variant="outline" className="rounded-full bg-[#FAF9F5] text-(--vx-primary) border-[#D5CFC2] font-normal">
                      Sin cronómetro · sin castigo por días sin entrar
                    </Badge>
                  </div>
                  <CardDescription className="text-[#5E5D59]">
                    Una pregunta del banco de práctica para confirmar que lo aprendido sigue firme.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {retencionFeedback && (
                    <Alert
                      className={
                        retencionFeedback.correcta
                          ? "rounded-xl border-(--vx-primary)/35 bg-(--vx-acento-soft) text-[#141413]"
                          : "rounded-xl border-[#D4942A]/45 bg-[#FEF6EA] text-[#141413]"
                      }
                    >
                      <AlertDescription className="text-sm space-y-1">
                        <div className="font-semibold">
                          {retencionFeedback.correcta
                            ? `Confirmado: ${retencionFeedback.nombre} sigue firme en tu mapa.`
                            : `Guardado en ${retencionFeedback.nombre}: lo dejaremos por comprobar para repasarlo pronto.`}
                        </div>
                        {retencionFeedback.explicacion && <p>{retencionFeedback.explicacion}</p>}
                      </AlertDescription>
                    </Alert>
                  )}

                  {data.retencion.pendientes.length > 0 ? (() => {
                    const pendientes = data.retencion.pendientes;
                    const activoRet = pendientes[retencionIdx] ?? pendientes[0];
                    const preg = activoRet?.pregunta;
                    return (
                      <div className="space-y-3">
                        {pendientes.length > 1 && (
                          <div className="flex flex-wrap gap-2">
                            {pendientes.map((item, idx) => (
                              <Button
                                key={item.itemId}
                                type="button"
                                size="sm"
                                variant={idx === (retencionIdx < pendientes.length ? retencionIdx : 0) ? "default" : "outline"}
                                className={
                                  idx === (retencionIdx < pendientes.length ? retencionIdx : 0)
                                    ? "rounded-full bg-(--vx-primary) hover:bg-(--vx-primary-hover) text-white"
                                    : "rounded-full border-[#D5CFC2] text-[#141413]"
                                }
                                onClick={() => {
                                  setRetencionIdx(idx);
                                  setRetencionOpcion(null);
                                  setRetencionError(null);
                                }}
                              >
                                {item.oaId.toUpperCase()} · {item.nombre}
                              </Button>
                            ))}
                          </div>
                        )}

                        {activoRet && preg ? (
                          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F5] border border-[#E6E2D8] space-y-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5E5D59]">
                              <span className="vx-mono font-medium text-(--vx-primary)">
                                {activoRet.oaId.toUpperCase()} · {activoRet.nombre}
                              </span>
                              <span>Intervalo actual: cada {activoRet.intervaloDias} días</span>
                            </div>
                            <p className="font-medium text-[15.5px] text-[#141413] leading-snug">{preg.enunciado}</p>
                            <div role="radiogroup" aria-label={`Pregunta de repaso ${activoRet.oaId}`} className="grid gap-2">
                              {preg.opciones.map((opt) => {
                                const elegida = retencionOpcion === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={elegida}
                                    onClick={() => setRetencionOpcion(opt.id)}
                                    className={`vx-option-card text-sm flex items-center gap-3 ${
                                      elegida
                                        ? "!border-(--vx-primary) !bg-(--vx-acento-soft) font-medium"
                                        : ""
                                    }`}
                                  >
                                    <span className="vx-mono text-xs font-medium text-(--vx-primary)">{opt.id}</span>
                                    <span>{opt.texto}</span>
                                  </button>
                                );
                              })}
                            </div>
                            {retencionError && (
                              <p role="alert" className="text-xs text-[#B84A39] font-medium">
                                {retencionError}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <span className="text-xs text-[#5E5D59]">
                                {data.retencion.pendientesCount > pendientes.length
                                  ? `Mostrando ${pendientes.length} de ${data.retencion.pendientesCount} comprobaciones para no recargarte.`
                                  : "Responde sin prisa cuando te sientas listo."}
                              </span>
                              <Button
                                type="button"
                                className="rounded-full px-5 bg-(--vx-primary) hover:bg-(--vx-primary-hover) text-white"
                                disabled={!retencionOpcion || retencionMutation.isPending}
                                onClick={() => {
                                  if (!retencionOpcion) return;
                                  retencionMutation.mutate({
                                    dominioId: data.dominioId,
                                    oaId: activoRet.oaId,
                                    preguntaId: preg.preguntaId,
                                    opcionId: retencionOpcion,
                                    nombre: activoRet.nombre,
                                  });
                                }}
                              >
                                {retencionMutation.isPending ? "Comprobando…" : "Comprobar"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-[#5E5D59]">
                            No encontramos otra pregunta disponible en este momento para este repaso.
                          </p>
                        )}
                      </div>
                    );
                  })() : (
                    data.retencion.proximas.length > 0 && (
                      <p className="text-sm text-[#5E5D59]">
                        Tus estrellas están al día. Próxima comprobación sugerida el{" "}
                        <strong className="text-[#141413] font-medium">{data.retencion.proximas[0].proximoDia}</strong> (sin castigo si
                        entras otro día).
                      </p>
                    )
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cruce evaluación del módulo (M5 / M6) respetando embargo P19-E1 y P21 v2 */}
            {data.evaluacion && data.evaluacion.estadoProceso !== "sin_iniciar" && (
              <Card className="vx-paper border-[#E6E2D8] shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="vx-serif font-medium text-xl">Evaluación del módulo</CardTitle>
                    <Badge
                      variant="outline"
                      className={`rounded-full font-normal ${
                        data.evaluacion.estadoProceso === "aprobado"
                          ? "bg-(--vx-acento-soft) text-(--vx-primary) border-(--vx-primary)/30"
                          : data.evaluacion.estadoProceso === "reprobado"
                            ? "bg-[#FBF0EB] text-[#9A4225] border-[#C96442]/40"
                            : "bg-[#EEF4FC] text-[#2F5EA8] border-[#2F5EA8]/35"
                      }`}
                    >
                      {data.evaluacion.estadoProceso === "aprobado"
                        ? "Aprobado"
                        : data.evaluacion.estadoProceso === "reprobado"
                          ? "Reprobado"
                          : "En curso"}
                    </Badge>
                  </div>
                  <CardDescription className="text-[#5E5D59]">
                    El puntaje de la evaluación es un canal independiente y nunca enciende estrellas por sí solo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.evaluacion.publicada ? (
                    <>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {data.evaluacion.mejorScorePct != null && (
                          <span>
                            Mejor porcentaje: <strong className="vx-mono text-[#141413] font-medium">{truncPct(data.evaluacion.mejorScorePct)} %</strong>
                            {data.evaluacion.umbral != null ? ` (umbral ${data.evaluacion.umbral} %)` : ""}
                          </span>
                        )}
                        <span className="text-[#5E5D59]">
                          {data.evaluacion.moduloSiguienteAbierto
                            ? "Módulo siguiente abierto."
                            : "Módulo siguiente pendiente de cierre."}
                        </span>
                      </div>

                      {data.evaluacion.contenidosAReforzar.length > 0 ? (
                        <div className="space-y-2.5 pt-1">
                          <p className="vx-kicker !text-[#9A4225]">
                            Temas sugeridos para reforzar desde esta evaluación
                          </p>
                          <ItemGroup className="gap-2">
                            {data.evaluacion.contenidosAReforzar.map((ref) => (
                              <Item
                                key={ref.itemId}
                                variant="outline"
                                size="sm"
                                className="rounded-xl bg-[#FBF0EB]/70 border-[#C96442]/30"
                              >
                                <ItemContent>
                                  <ItemTitle className="text-[#141413]">
                                    <span className="vx-mono text-xs text-[#9A4225]">{ref.oaId.toUpperCase()}</span>
                                    <span>{ref.nombre}</span>
                                  </ItemTitle>
                                  <ItemDescription className="text-xs text-[#5E5D59]">{ref.motivo}</ItemDescription>
                                </ItemContent>
                                <ItemActions>
                                  <Link href={`/vortice/aula/${encodeURIComponent(ref.oaId)}`}>
                                    <Button type="button" size="sm" variant="outline" className="rounded-full border-[#D5CFC2] bg-white">
                                      Reforzar en el Aula
                                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                  </Link>
                                </ItemActions>
                              </Item>
                            ))}
                          </ItemGroup>
                        </div>
                      ) : (
                        <p className="text-sm text-(--vx-primary)">
                          No quedaron temas pendientes por reforzar en la revisión de esta evaluación.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-[#5E5D59]">
                      Tu proceso está en estado{" "}
                      <strong className="text-[#141413] font-medium">
                        {data.evaluacion.estadoProceso === "aprobado"
                          ? "Aprobado"
                          : data.evaluacion.estadoProceso === "reprobado"
                            ? "Reprobado"
                            : "En curso"}
                      </strong>
                      . {data.evaluacion.moduloSiguienteAbierto ? "El módulo siguiente ya está abierto. " : ""}
                      El detalle por tema se mostrará cuando concluya tu evaluación y se cumpla la ventana de revisión.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] items-start">
              {/* Constelación SVG de prerrequisitos */}
              <Card className="vx-paper border-[#E6E2D8] shadow-none overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="vx-serif font-medium text-xl">Constelación de contenidos conectados</CardTitle>
                  <CardDescription className="text-[#5E5D59]">
                    Las líneas muestran qué contenido sirve de base para abrir los siguientes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-2xl bg-[#F7F5EE] p-3.5 border border-[#E6E2D8]">
                    <svg
                      viewBox="0 0 550 245"
                      className="w-full h-auto block"
                      role="img"
                      aria-label="Constelación de contenidos del módulo conectados por prerrequisitos"
                    >
                      <defs>
                        <radialGradient id="vx-sky-glow" cx="50%" cy="50%" r="65%">
                          <stop offset="0%" stopColor="#EFECE3" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#F7F5EE" stopOpacity="0" />
                        </radialGradient>
                        <marker id="vx-edge-arrow" viewBox="0 0 10 10" refX="27" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--vx-primary)" opacity="0.65" />
                        </marker>
                      </defs>
                      <rect x="0" y="0" width="550" height="245" rx="12" fill="url(#vx-sky-glow)" />

                      {data.aristas.map((arista) => {
                        const dest = nodoPorId.get(arista.itemId);
                        const orig = nodoPorId.get(arista.prerequisiteItemId);
                        if (!dest || !orig) return null;
                        const pOrig = POSICION_NODO[orig.oaId] ?? { x: 80, y: 120 };
                        const pDest = POSICION_NODO[dest.oaId] ?? { x: 470, y: 120 };
                        const punteada = dest.estadoVisual === "bloqueado";
                        const mx = (pOrig.x + pDest.x) / 2;
                        const my = (pOrig.y + pDest.y) / 2;
                        const dx = pDest.x - pOrig.x;
                        const dy = pDest.y - pOrig.y;
                        const offset = Math.abs(dy) < 12 ? 0 : dy > 0 ? -12 : 12;
                        const d = `M ${pOrig.x} ${pOrig.y} Q ${mx} ${my + offset} ${pDest.x} ${pDest.y}`;
                        void dx;
                        return (
                          <path
                            key={`${orig.itemId}-${dest.itemId}`}
                            d={d}
                            fill="none"
                            stroke={punteada ? "#C4BEAF" : "var(--vx-primary)"}
                            strokeOpacity={punteada ? 0.85 : 0.65}
                            strokeWidth={1.85}
                            strokeDasharray={punteada ? "4 5" : undefined}
                            markerEnd={punteada ? undefined : "url(#vx-edge-arrow)"}
                          />
                        );
                      })}

                      {nodos.map((n, idx) => {
                        const pos = POSICION_NODO[n.oaId] ?? { x: 90 + idx * 95, y: 120 };
                        const est = ESTILO_ESTADO[n.estadoVisual];
                        const activo = seleccionado?.itemId === n.itemId;
                        const textoDebajo = n.oaId === "oa10" || n.oaId === "oa11";
                        return (
                          <g
                            key={n.itemId}
                            tabIndex={0}
                            role="button"
                            aria-label={`${n.oaId.toUpperCase()} ${n.nombre}: ${n.etiqueta}`}
                            onClick={() => setSeleccionadoId(n.itemId)}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter" || ev.key === " ") {
                                ev.preventDefault();
                                setSeleccionadoId(n.itemId);
                              }
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            {activo && (
                              <>
                                <circle
                                  cx={pos.x}
                                  cy={pos.y}
                                  r={28}
                                  fill="var(--vx-primary)"
                                  fillOpacity={0.1}
                                />
                                <circle
                                  cx={pos.x}
                                  cy={pos.y}
                                  r={24}
                                  fill="none"
                                  stroke="var(--vx-primary)"
                                  strokeWidth={1.75}
                                />
                              </>
                            )}
                            <circle
                              cx={pos.x}
                              cy={pos.y}
                              r={19}
                              fill={est.fill}
                              stroke={est.stroke}
                              strokeWidth={2}
                              strokeDasharray={n.estadoVisual === "bloqueado" ? "4 3" : undefined}
                            />
                            <text
                              x={pos.x}
                              y={pos.y + 5}
                              textAnchor="middle"
                              fontSize="13.5"
                              fontWeight="600"
                              fill={n.estadoVisual === "bloqueado" ? "#87867F" : "#141413"}
                            >
                              {est.simbolo}
                            </text>
                            <text
                              x={pos.x}
                              y={pos.y + (textoDebajo ? 34 : -26)}
                              textAnchor="middle"
                              fontSize="11"
                              fontWeight="600"
                              fontFamily="JetBrains Mono, monospace"
                              fill="#141413"
                            >
                              {n.oaId.toUpperCase()}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#5E5D59] px-1">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D4942A] border border-(--vx-primary)" />
                      Dominado
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EEF4FC] border border-[#2F5EA8]" />
                      En práctica / incierto
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-white border border-(--vx-primary)" />
                      Listo
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F3F1EA] border border-[#A8A296]" />
                      Esperando base
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Panel de detalle del nodo seleccionado */}
              {seleccionado && (
                <Card className="vx-paper border-[#E6E2D8] shadow-none">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="outline" className="vx-mono rounded-full border-[#E6E2D8] text-[#5E5D59] font-normal">
                        {seleccionado.oaId.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={`rounded-full font-normal ${ESTILO_ESTADO[seleccionado.estadoVisual].badgeClass}`}>
                        {seleccionado.etiqueta}
                      </Badge>
                    </div>
                    <CardTitle className="vx-serif font-medium text-xl pt-2">{seleccionado.nombre}</CardTitle>
                    <CardDescription className="text-[#5E5D59] leading-relaxed">
                      {seleccionado.definicion}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Separator className="bg-[#E6E2D8]" />
                    {seleccionado.inconsistencia && (
                      <Alert className="rounded-xl border-[#D4942A]/45 bg-[#FEF6EA] text-[#141413]">
                        <AlertDescription className="text-xs">
                          Este contenido figura dominado antes de completar su base. Puedes seguir sin perder tu avance.
                        </AlertDescription>
                      </Alert>
                    )}

                    {seleccionado.faltantes.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E6E2D8] text-xs space-y-1.5">
                        <div className="font-medium text-[#141413]">Conviene dominar primero:</div>
                        <ul className="list-disc pl-4 space-y-1 text-[#5E5D59]">
                          {seleccionado.faltantes.map((f) => (
                            <li key={f.itemId}>
                              <button
                                type="button"
                                className="underline text-(--vx-primary) font-medium hover:text-(--vx-primary-hover)"
                                onClick={() => setSeleccionadoId(f.itemId)}
                              >
                                {f.oaId.toUpperCase()} · {f.nombre}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {seleccionado.desbloquea.length > 0 && (
                      <div className="text-xs text-[#5E5D59]">
                        Abre el camino hacia:{" "}
                        <span className="font-medium text-[#141413]">
                          {seleccionado.desbloquea
                            .map((id) => nodoPorId.get(id)?.oaId.toUpperCase())
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                        .
                      </div>
                    )}

                    <Link href={destinoAula} className="vx-btn-primary w-full">
                      {seleccionado.accion}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Alternativa accesible en lista (navegable por teclado y lector de pantalla) */}
            <Card className="vx-paper border-[#E6E2D8] shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="vx-serif font-medium text-xl">Lista accesible de contenidos</CardTitle>
                <CardDescription className="text-[#5E5D59]">
                  Misma información de la constelación en formato de lista con estado y texto explícito.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ItemGroup className="gap-2" aria-label="Lista de contenidos por estado">
                  {nodos.map((n) => {
                    const activo = seleccionado?.itemId === n.itemId;
                    return (
                      <Item
                        key={n.itemId}
                        variant="outline"
                        size="sm"
                        asChild
                        className={`rounded-xl transition ${
                          activo
                            ? "border-(--vx-primary) bg-(--vx-acento-soft)/60 shadow-[inset_0_0_0_1px_var(--vx-primary)]"
                            : "border-[#E6E2D8] bg-white hover:border-(--vx-primary-2) hover:bg-[#FAF9F5]/60"
                        }`}
                      >
                        <button
                          type="button"
                          aria-pressed={activo}
                          onClick={() => setSeleccionadoId(n.itemId)}
                          className="w-full text-left"
                        >
                          <ItemMedia variant="icon" className="rounded-lg border-[#E6E2D8] bg-[#FAF9F5]">
                            <IconoEstado estadoVisual={n.estadoVisual} />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle className="text-[#141413]">
                              <span className="vx-mono text-xs text-[#5E5D59]">{n.oaId.toUpperCase()}</span>
                              <span>{n.nombre}</span>
                            </ItemTitle>
                            <ItemDescription className="text-xs text-[#5E5D59] line-clamp-1">
                              {n.definicion}
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            <Badge variant="outline" className={`rounded-full font-normal ${ESTILO_ESTADO[n.estadoVisual].badgeClass}`}>
                              {n.etiqueta}
                            </Badge>
                          </ItemActions>
                        </button>
                      </Item>
                    );
                  })}
                </ItemGroup>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
