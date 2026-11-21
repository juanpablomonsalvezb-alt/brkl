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
  RefreshCw,
  RotateCcw,
  Sparkles,
  Star,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AristaMapa,
  EstadoVisualMapa,
  NodoMapa,
  RecomendacionMapa,
  ResumenMapaConocimiento,
} from "@shared/mapaConocimiento";
import type { ResumenEvaluacionMapa } from "@shared/cruceEvaluacionMapa";
import type { ItemRetencionProgramado } from "@shared/retencionMapa";

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
    fill: "#FFC548",
    stroke: "#1f4a3d",
    badgeClass: "bg-[#e5ece4] text-[#1f4a3d] border-[#1f4a3d]",
    simbolo: "★",
  },
  por_comprobar: {
    fill: "#FFE08A",
    stroke: "#1f4a3d",
    badgeClass: "bg-[#fef3c7] text-[#92400e] border-[#f59e0b]",
    simbolo: "✦",
  },
  incierto: {
    fill: "#9CC3F5",
    stroke: "#1e40af",
    badgeClass: "bg-[#eff6ff] text-[#1e40af] border-[#93c5fd]",
    simbolo: "◐",
  },
  no_dominado: {
    fill: "#FF9A73",
    stroke: "#9a3412",
    badgeClass: "bg-[#fff7ed] text-[#9a3412] border-[#fdba74]",
    simbolo: "↺",
  },
  listo: {
    fill: "#ffffff",
    stroke: "#4a7fd4",
    badgeClass: "bg-white text-[#1d4ed8] border-[#4a7fd4]",
    simbolo: "◎",
  },
  bloqueado: {
    fill: "transparent",
    stroke: "#94a3b8",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-300",
    simbolo: "·",
  },
};

function IconoEstado({ estadoVisual }: { estadoVisual: EstadoVisualMapa }) {
  if (estadoVisual === "dominado") return <CheckCircle2 className="w-4 h-4 text-[#1f4a3d] shrink-0" />;
  if (estadoVisual === "por_comprobar") return <Sparkles className="w-4 h-4 text-[#92400e] shrink-0" />;
  if (estadoVisual === "no_dominado") return <RotateCcw className="w-4 h-4 text-[#9a3412] shrink-0" />;
  if (estadoVisual === "bloqueado") return <Lock className="w-4 h-4 text-slate-500 shrink-0" />;
  return <Star className="w-4 h-4 text-[#2f6b55] shrink-0" />;
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
      <div className="min-h-screen bg-[#f7f4ee] flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Inicia sesión para ver Mis conocimientos</CardTitle>
            <CardDescription>Necesitas entrar con tu cuenta para consultar tu mapa real de dominio.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/vortice">
              <Button>Ir a Vórtice</Button>
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
    <div className="min-h-screen bg-[#f7f4ee] text-[#1c2a3a] py-6 px-4">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/vortice">
              <Button type="button" variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Volver a Vórtice
              </Button>
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2f6b55]">
                5.º Básico · Matemática
              </p>
              <h1 className="text-2xl font-serif font-bold text-[#1c2a3a]">Mis conocimientos</h1>
            </div>
          </div>

          <Link href="/vortice/aula">
            <Button type="button" className="bg-[#1f4a3d] hover:bg-[#173a30]">
              Ir al Aula Universal
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        <Alert className="border-[#d6cfc2] bg-white">
          <AlertDescription className="text-sm text-[#1c2a3a]">
            Completar lecturas o videos ordena tu camino, pero <strong>no enciende estrellas</strong>. Las estrellas
            se confirman por separado cuando practicas y compruebas sin pistas en dos ejercicios distintos.
          </AlertDescription>
        </Alert>

        {mapaQuery.isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-[#5b6670]">
              Cargando mapa de conocimientos…
            </CardContent>
          </Card>
        ) : mapaQuery.isError ? (
          <Card className="border-[#d65a4a]">
            <CardContent className="py-8 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm font-medium text-[#9a3412]">No pudimos cargar el mapa.</p>
              <Button type="button" variant="outline" onClick={() => mapaQuery.refetch()}>
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : !data?.disponible || nodos.length === 0 ? (
          <Card>
            <CardContent className="py-8 space-y-3">
              <p className="font-medium">Este curso todavía no tiene un mapa publicado en el piloto.</p>
              <Link href="/vortice/aula">
                <Button type="button" variant="outline">Ir a estudiar en el Aula</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {!data.tieneEvidencia && (
              <Alert className="border-[#4a7fd4] bg-[#eff6ff] text-[#1e3a8a]">
                <AlertDescription>
                  Tu mapa aparecerá con estrellas reales desde tu primera práctica o comprobación. Ya puedes ver qué
                  contenidos dependen de cuáles y dónde conviene empezar.
                </AlertDescription>
              </Alert>
            )}

            {/* Sugerencia determinista de siguiente paso */}
            {data.recomendacion && (
              <Card className="border-[#1f4a3d] bg-[#e5ece4]/60">
                <CardContent className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#1f4a3d] flex items-center gap-1.5">
                      <Compass className="w-4 h-4" />
                      Siguiente paso sugerido
                    </div>
                    <p className="font-semibold text-base text-[#1c2a3a]">{data.recomendacion.motivo}</p>
                  </div>
                  <Link href={`/vortice/aula/${encodeURIComponent(data.recomendacion.oaId)}`}>
                    <Button type="button" className="bg-[#1f4a3d] hover:bg-[#173a30]">
                      Ir a {data.recomendacion.oaId.toUpperCase()}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Resumen de estados sin porcentajes ni notas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white border border-[#e8e2d6]">
                <div className="text-xs text-[#5b6670]">Lo dominas</div>
                <div className="text-2xl font-bold text-[#1f4a3d]">{data.resumen.dominados}</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#e8e2d6]">
                <div className="text-xs text-[#5b6670]">En práctica / refuerzo</div>
                <div className="text-2xl font-bold text-[#1c2a3a]">
                  {data.resumen.enPractica + data.resumen.porReforzar + data.resumen.porComprobar}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#e8e2d6]">
                <div className="text-xs text-[#5b6670]">Listos para aprender</div>
                <div className="text-2xl font-bold text-[#1d4ed8]">{data.resumen.listos}</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#e8e2d6]">
                <div className="text-xs text-[#5b6670]">Esperando su base</div>
                <div className="text-2xl font-bold text-slate-600">{data.resumen.bloqueados}</div>
              </div>
            </div>

            {/* Comprobaciones de retención espaciada (M4, sin reloj ni castigo por ausencia) */}
            {(data.retencion?.pendientes?.length > 0 || data.retencion?.proximas?.length > 0 || retencionFeedback) && (
              <Card className="border-[#d6cfc2] bg-white">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">Repaso breve para mantener tus estrellas</CardTitle>
                    <Badge variant="outline" className="bg-[#f7f4ee] text-[#1f4a3d] border-[#d6cfc2]">
                      Sin cronómetro · sin castigo por días sin entrar
                    </Badge>
                  </div>
                  <CardDescription>
                    Una pregunta del banco de práctica para confirmar que lo aprendido sigue firme.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {retencionFeedback && (
                    <Alert
                      className={
                        retencionFeedback.correcta
                          ? "border-[#1f4a3d] bg-[#e5ece4]/70 text-[#1c2a3a]"
                          : "border-[#d97706] bg-amber-50 text-[#1c2a3a]"
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
                                    ? "bg-[#1f4a3d] hover:bg-[#173a30]"
                                    : ""
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
                          <div className="p-4 rounded-xl bg-[#faf8f3] border border-[#e8e2d6] space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5b6670]">
                              <span className="font-semibold text-[#1f4a3d]">
                                {activoRet.oaId.toUpperCase()} · {activoRet.nombre}
                              </span>
                              <span>Intervalo actual: cada {activoRet.intervaloDias} días</span>
                            </div>
                            <p className="font-medium text-sm text-[#1c2a3a]">{preg.enunciado}</p>
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
                                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition flex items-center gap-2.5 ${
                                      elegida
                                        ? "border-[#1f4a3d] bg-[#e5ece4] font-medium"
                                        : "border-[#d6cfc2] bg-white hover:border-[#1f4a3d]"
                                    }`}
                                  >
                                    <span className="font-mono text-xs font-bold text-[#1f4a3d]">{opt.id}</span>
                                    <span>{opt.texto}</span>
                                  </button>
                                );
                              })}
                            </div>
                            {retencionError && (
                              <p role="alert" className="text-xs text-[#9a3412] font-medium">
                                {retencionError}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs text-[#5b6670]">
                                {data.retencion.pendientesCount > pendientes.length
                                  ? `Mostrando ${pendientes.length} de ${data.retencion.pendientesCount} comprobaciones para no recargarte.`
                                  : "Responde sin prisa cuando te sientas listo."}
                              </span>
                              <Button
                                type="button"
                                className="bg-[#1f4a3d] hover:bg-[#173a30]"
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
                          <p className="text-sm text-[#5b6670]">
                            No encontramos otra pregunta disponible en este momento para este repaso.
                          </p>
                        )}
                      </div>
                    );
                  })() : (
                    data.retencion.proximas.length > 0 && (
                      <p className="text-sm text-[#5b6670]">
                        Tus estrellas están al día. Próxima comprobación sugerida el{" "}
                        <strong className="text-[#1c2a3a]">{data.retencion.proximas[0].proximoDia}</strong> (sin castigo si
                        entras otro día).
                      </p>
                    )
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cruce evaluación del módulo (M5 / M6) respetando embargo P19-E1 y P21 v2 */}
            {data.evaluacion && data.evaluacion.estadoProceso !== "sin_iniciar" && (
              <Card className="border-[#d6cfc2] bg-white">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">Evaluación del módulo</CardTitle>
                    <Badge
                      variant="outline"
                      className={
                        data.evaluacion.estadoProceso === "aprobado"
                          ? "bg-[#e5ece4] text-[#1f4a3d] border-[#1f4a3d]"
                          : data.evaluacion.estadoProceso === "reprobado"
                            ? "bg-[#fff7ed] text-[#9a3412] border-[#fdba74]"
                            : "bg-[#eff6ff] text-[#1e40af] border-[#93c5fd]"
                      }
                    >
                      {data.evaluacion.estadoProceso === "aprobado"
                        ? "Aprobado"
                        : data.evaluacion.estadoProceso === "reprobado"
                          ? "Reprobado"
                          : "En curso"}
                    </Badge>
                  </div>
                  <CardDescription>
                    El puntaje de la evaluación es un canal independiente y nunca enciende estrellas por sí solo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.evaluacion.publicada ? (
                    <>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {data.evaluacion.mejorScorePct != null && (
                          <span>
                            Mejor porcentaje: <strong className="text-[#1c2a3a]">{truncPct(data.evaluacion.mejorScorePct)} %</strong>
                            {data.evaluacion.umbral != null ? ` (umbral ${data.evaluacion.umbral} %)` : ""}
                          </span>
                        )}
                        <span className="text-[#5b6670]">
                          {data.evaluacion.moduloSiguienteAbierto
                            ? "Módulo siguiente abierto."
                            : "Módulo siguiente pendiente de cierre."}
                        </span>
                      </div>

                      {data.evaluacion.contenidosAReforzar.length > 0 ? (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#9a3412]">
                            Temas sugeridos para reforzar desde esta evaluación
                          </p>
                          <ul className="space-y-2">
                            {data.evaluacion.contenidosAReforzar.map((ref) => (
                              <li
                                key={ref.itemId}
                                className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-[#fff7ed]/60 border border-[#fed7aa]"
                              >
                                <div className="text-sm">
                                  <span className="font-semibold text-[#1c2a3a]">
                                    {ref.oaId.toUpperCase()} · {ref.nombre}
                                  </span>
                                  <p className="text-xs text-[#5b6670]">{ref.motivo}</p>
                                </div>
                                <Link href={`/vortice/aula/${encodeURIComponent(ref.oaId)}`}>
                                  <Button type="button" size="sm" variant="outline">
                                    Reforzar en el Aula
                                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                  </Button>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-sm text-[#1f4a3d]">
                          No quedaron temas pendientes por reforzar en la revisión de esta evaluación.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-[#5b6670]">
                      Tu proceso está en estado{" "}
                      <strong className="text-[#1c2a3a]">
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

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
              {/* Constelación SVG de prerrequisitos */}
              <Card className="overflow-hidden border-[#e8e2d6]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Constelación de contenidos conectados</CardTitle>
                  <CardDescription>
                    Las líneas muestran qué contenido sirve de base para abrir los siguientes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl bg-[#0b2545] p-3">
                    <svg
                      viewBox="0 0 550 245"
                      className="w-full h-auto block"
                      role="img"
                      aria-label="Constelación de contenidos del módulo conectados por prerrequisitos"
                    >
                      {data.aristas.map((arista) => {
                        const dest = nodoPorId.get(arista.itemId);
                        const orig = nodoPorId.get(arista.prerequisiteItemId);
                        if (!dest || !orig) return null;
                        const pOrig = POSICION_NODO[orig.oaId] ?? { x: 80, y: 120 };
                        const pDest = POSICION_NODO[dest.oaId] ?? { x: 470, y: 120 };
                        const punteda = dest.estadoVisual === "bloqueado";
                        return (
                          <line
                            key={`${orig.itemId}-${dest.itemId}`}
                            x1={pOrig.x}
                            y1={pOrig.y}
                            x2={pDest.x}
                            y2={pDest.y}
                            stroke={punteda ? "#5b7399" : "#9CC3F5"}
                            strokeWidth={2.5}
                            strokeDasharray={punteda ? "5 5" : undefined}
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
                              <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={25}
                                fill="none"
                                stroke="#FFC548"
                                strokeWidth={2.5}
                              />
                            )}
                            <circle
                              cx={pos.x}
                              cy={pos.y}
                              r={19}
                              fill={est.fill}
                              stroke={est.stroke}
                              strokeWidth={2.5}
                              strokeDasharray={n.estadoVisual === "bloqueado" ? "4 3" : undefined}
                            />
                            <text
                              x={pos.x}
                              y={pos.y + 5}
                              textAnchor="middle"
                              fontSize="14"
                              fontWeight="700"
                              fill={n.estadoVisual === "bloqueado" ? "#cbd5e1" : "#1c2a3a"}
                            >
                              {est.simbolo}
                            </text>
                            <text
                              x={pos.x}
                              y={pos.y + (textoDebajo ? 34 : -26)}
                              textAnchor="middle"
                              fontSize="11.5"
                              fontWeight="600"
                              fill="#EAF1FB"
                            >
                              {n.oaId.toUpperCase()}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </CardContent>
              </Card>

              {/* Panel de detalle del nodo seleccionado */}
              {seleccionado && (
                <Card className="border-[#e8e2d6] bg-white">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="outline">{seleccionado.oaId.toUpperCase()}</Badge>
                      <Badge variant="outline" className={ESTILO_ESTADO[seleccionado.estadoVisual].badgeClass}>
                        {seleccionado.etiqueta}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg pt-1">{seleccionado.nombre}</CardTitle>
                    <CardDescription>{seleccionado.definicion}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {seleccionado.inconsistencia && (
                      <Alert className="border-amber-300 bg-amber-50 text-amber-950">
                        <AlertDescription className="text-xs">
                          Este contenido figura dominado antes de completar su base. Puedes seguir sin perder tu avance.
                        </AlertDescription>
                      </Alert>
                    )}

                    {seleccionado.faltantes.length > 0 && (
                      <div className="p-3 rounded-lg bg-[#faf8f3] border border-[#e8e2d6] text-xs space-y-1">
                        <div className="font-semibold text-[#1c2a3a]">Conviene dominar primero:</div>
                        <ul className="list-disc pl-4 space-y-0.5 text-[#5b6670]">
                          {seleccionado.faltantes.map((f) => (
                            <li key={f.itemId}>
                              <button
                                type="button"
                                className="underline text-[#1f4a3d]"
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
                      <div className="text-xs text-[#5b6670]">
                        Abre el camino hacia:{" "}
                        {seleccionado.desbloquea
                          .map((id) => nodoPorId.get(id)?.oaId.toUpperCase())
                          .filter(Boolean)
                          .join(", ")}
                        .
                      </div>
                    )}

                    <Link href={destinoAula}>
                      <Button type="button" className="w-full bg-[#1f4a3d] hover:bg-[#173a30]">
                        {seleccionado.accion}
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Alternativa accesible en lista (navegable por teclado y lector de pantalla) */}
            <Card className="border-[#e8e2d6] bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Lista accesible de contenidos</CardTitle>
                <CardDescription>
                  Misma información de la constelación en formato de lista con estado y texto explícito.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2" aria-label="Lista de contenidos por estado">
                  {nodos.map((n) => {
                    const activo = seleccionado?.itemId === n.itemId;
                    return (
                      <li key={n.itemId}>
                        <button
                          type="button"
                          aria-pressed={activo}
                          onClick={() => setSeleccionadoId(n.itemId)}
                          className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl border text-left transition flex flex-wrap items-center justify-between gap-2 ${
                            activo
                              ? "border-[#1f4a3d] bg-[#e5ece4]/40"
                              : "border-[#e8e2d6] bg-white hover:border-[#1f4a3d]"
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <IconoEstado estadoVisual={n.estadoVisual} />
                            <span className="font-semibold text-sm">
                              {n.oaId.toUpperCase()} · {n.nombre}
                            </span>
                          </span>
                          <Badge variant="outline" className={ESTILO_ESTADO[n.estadoVisual].badgeClass}>
                            {n.etiqueta}
                          </Badge>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
