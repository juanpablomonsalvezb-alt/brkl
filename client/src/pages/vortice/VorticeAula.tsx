// Aula Universal UDL del piloto (Matemática 5.º Básico U3: OA 7, 8, 10, 11, 13).
// Implementa el estándar universal cerrado el 2026-11-21:
// - 4 pasos fijos (Me ubico -> Aprende -> Inténtalo tú -> Comprueba) con guardado real por tramo.
// - 1 puerta principal en «Aprende» + desplegables para otras 3 puertas y apoyos.
// - Botón opcional «Escuchar enunciado» (Web Speech API, costo $0).
// - Diagnóstico 0 orientador sin nota ni bloqueo; comprobación 1..3 sin reloj ni porcentaje.
// - Pistas deterministas en 3 niveles (sin IA) en «Inténtalo tú».
import { useEffect, useRef, useState } from "react";
import { Link, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  obtenerLeccionesPiloto,
  PASOS_LECCION,
  pistaPorNivel,
  seleccionarPuertaPrincipal,
  type GuardarProgresoLeccionInput,
  type LeccionUniversalPiloto,
  type PasoLeccion,
  type PuertaAprendizaje,
} from "@shared/aulaUniversal";

interface ProgresoLeccionDTO extends GuardarProgresoLeccionInput {
  oaId: string;
  completadaPorYaLoSe: boolean;
  practicaLograda: boolean;
  updatedAt: string;
}

interface PilotoResponse {
  lecciones: LeccionUniversalPiloto[];
  progreso: Record<string, ProgresoLeccionDTO>;
}

interface DiagnosticoResult {
  porOa: Array<{
    oaId: string;
    codigo: string;
    titulo: string;
    recomendacion: "ya_lo_se_sugerido" | "conviene_estudiar";
  }>;
  sugeridosRepasar: string[];
  sugeridosYaLoSe: string[];
}

interface ComprobacionResult {
  estado: "logrado" | "sigue_practicando";
  detalle: Record<string, boolean>;
  progreso: ProgresoLeccionDTO | null;
}

const ETIQUETA_PASO: Record<PasoLeccion, string> = {
  me_ubico: "1. Me ubico",
  aprende: "2. Aprende",
  intentalo: "3. Inténtalo tú",
  comprueba: "4. Comprueba",
};

function useLecturaVozAlta() {
  const soporta = typeof window !== "undefined" && "speechSynthesis" in window;
  const [activoId, setActivoId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (soporta) window.speechSynthesis.cancel();
    };
  }, [soporta]);

  const detener = () => {
    if (!soporta) return;
    window.speechSynthesis.cancel();
    setActivoId(null);
  };

  const alternar = (id: string, texto: string) => {
    if (!soporta) return;
    if (activoId === id) {
      detener();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-CL";
    u.rate = 0.96;
    u.onend = () => setActivoId((prev) => (prev === id ? null : prev));
    u.onerror = () => setActivoId((prev) => (prev === id ? null : prev));
    setActivoId(id);
    window.speechSynthesis.speak(u);
  };

  return { soporta, activoId, alternar, detener };
}

function BotonVoz({
  id,
  texto,
  voz,
}: {
  id: string;
  texto: string;
  voz: ReturnType<typeof useLecturaVozAlta>;
}) {
  const leyendo = voz.activoId === id;
  if (!voz.soporta) {
    return (
      <Button type="button" variant="outline" size="sm" disabled title="Tu navegador no incluye síntesis de voz">
        <VolumeX className="w-4 h-4 mr-1.5" />
        Voz no disponible
      </Button>
    );
  }
  return (
    <Button
      type="button"
      variant={leyendo ? "secondary" : "outline"}
      size="sm"
      onClick={() => voz.alternar(id, texto)}
    >
      {leyendo ? <VolumeX className="w-4 h-4 mr-1.5" /> : <Volume2 className="w-4 h-4 mr-1.5" />}
      {leyendo ? "Detener lectura" : "Escuchar enunciado"}
    </Button>
  );
}

export default function VorticeAula() {
  const [, params] = useRoute("/vortice/aula/:oaId");
  const queryClient = useQueryClient();
  const voz = useLecturaVozAlta();

  const pilotoQuery = useQuery<PilotoResponse>({
    queryKey: ["/api/vortice/aula/piloto"],
    queryFn: async () => {
      const res = await fetch("/api/vortice/aula/piloto", { credentials: "include" });
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      if (!res.ok) throw new Error("Error cargando Aula Universal");
      return res.json();
    },
    retry: false,
  });

  const lecciones = pilotoQuery.data?.lecciones ?? obtenerLeccionesPiloto();
  const oaInicial = lecciones.some((l) => l.oaId === params?.oaId) ? params!.oaId : lecciones[0].oaId;

  const [oaSeleccionado, setOaSeleccionado] = useState<string>(oaInicial);
  useEffect(() => {
    if (params?.oaId && lecciones.some((l) => l.oaId === params.oaId)) {
      setOaSeleccionado(params.oaId);
    }
  }, [params?.oaId, lecciones]);

  const leccion = lecciones.find((l) => l.oaId === oaSeleccionado) ?? lecciones[0];
  const progresoActual = pilotoQuery.data?.progreso?.[leccion.oaId] ?? null;

  const [pasoActual, setPasoActual] = useState<PasoLeccion>("me_ubico");
  const [tramoActual, setTramoActual] = useState<number>(0);
  const [puertaPreferida, setPuertaPreferida] = useState<PuertaAprendizaje>(leccion.puertaSugerida);
  const [pasoEjemploVisto, setPasoEjemploVisto] = useState<number>(0);
  const [retomadoBanner, setRetomadoBanner] = useState<string | null>(null);

  // Desplegables en «Aprende» (solo 1 puerta principal visible por defecto).
  const [verOtrasPuertas, setVerOtrasPuertas] = useState(false);
  const [verApoyos, setVerApoyos] = useState(false);
  const [apoyoActivo, setApoyoActivo] = useState<"mapa" | "infografia" | "tarjetas">("mapa");
  const [tarjetaIdx, setTarjetaIdx] = useState(0);
  const [tarjetaVolteada, setTarjetaVolteada] = useState(false);

  // «Inténtalo tú»: 1 pregunta por pantalla y pistas en 3 niveles.
  const [idxPractica, setIdxPractica] = useState(0);
  const [respPractica, setRespPractica] = useState<Record<string, string>>({});
  const [nivelPistaPorEj, setNivelPistaPorEj] = useState<Record<string, 1 | 2 | 3>>({});

  // «Comprueba» (proceso sin nota ni porcentaje).
  const [respComprueba, setRespComprueba] = useState<Record<string, string>>({});
  const [origenYaLoSe, setOrigenYaLoSe] = useState(false);
  const [resComprueba, setResComprueba] = useState<ComprobacionResult | null>(null);

  // Diagnóstico 0 orientador.
  const [abiertoDiagnostico, setAbiertoDiagnostico] = useState(false);
  const [idxDiag, setIdxDiag] = useState(0);
  const [respDiag, setRespDiag] = useState<Record<string, string>>({});
  const [resDiag, setResDiag] = useState<DiagnosticoResult | null>(null);
  const hidratacionRef = useRef<{ oaId: string; cargadoServidor: boolean } | null>(null);
  const saltoYaLoSeOaRef = useRef<string | null>(null);

  useEffect(() => {
    const cambioOa = hidratacionRef.current?.oaId !== leccion.oaId;
    const primeraCargaServidor = Boolean(
      pilotoQuery.isSuccess &&
        hidratacionRef.current?.oaId === leccion.oaId &&
        !hidratacionRef.current.cargadoServidor,
    );
    if (!cambioOa && !primeraCargaServidor) return;

    hidratacionRef.current = { oaId: leccion.oaId, cargadoServidor: pilotoQuery.isSuccess };
    const saltoYaLoSe = saltoYaLoSeOaRef.current === leccion.oaId;
    if (saltoYaLoSe) saltoYaLoSeOaRef.current = null;

    if (cambioOa) {
      voz.detener();
      setVerOtrasPuertas(false);
      setVerApoyos(false);
      setTarjetaIdx(0);
      setTarjetaVolteada(false);
      setIdxPractica(0);
      setRespPractica({});
      setNivelPistaPorEj({});
      setRespComprueba({});
      setResComprueba(null);
    }

    if (progresoActual) {
      setPasoActual(saltoYaLoSe ? "comprueba" : progresoActual.pasoActual);
      setOrigenYaLoSe(saltoYaLoSe);
      setTramoActual(Math.min(progresoActual.tramoActual, Math.max(0, leccion.microTramos.length - 1)));
      setPuertaPreferida(progresoActual.puertaPreferida);
      setPasoEjemploVisto(Math.min(progresoActual.pasoEjemploVisto, Math.max(0, leccion.ejemploResuelto.pasos.length - 1)));
      const hayAvance =
        progresoActual.pasoActual !== "me_ubico" ||
        progresoActual.tramoActual > 0 ||
        progresoActual.practicaLograda;
      setRetomadoBanner(
        hayAvance
          ? `Retomaste donde quedaste (${ETIQUETA_PASO[progresoActual.pasoActual]}, tramo ${progresoActual.tramoActual + 1}).`
          : null,
      );
    } else {
      setPasoActual(saltoYaLoSe ? "comprueba" : "me_ubico");
      setOrigenYaLoSe(saltoYaLoSe);
      setTramoActual(0);
      setPuertaPreferida(leccion.puertaSugerida);
      setPasoEjemploVisto(0);
      setRetomadoBanner(null);
    }
  }, [leccion.oaId, leccion.microTramos.length, leccion.ejemploResuelto.pasos.length, leccion.puertaSugerida, pilotoQuery.isSuccess, progresoActual]);

  const guardarProgresoMutation = useMutation({
    mutationFn: async (input: GuardarProgresoLeccionInput) => {
      const res = await fetch(`/api/vortice/aula/lecciones/${encodeURIComponent(leccion.oaId)}/progreso`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("No se pudo guardar el progreso");
      return res.json() as Promise<ProgresoLeccionDTO>;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<PilotoResponse>(["/api/vortice/aula/piloto"], (prev) =>
        prev ? { ...prev, progreso: { ...prev.progreso, [updated.oaId]: updated } } : prev,
      );
    },
  });

  const diagMutation = useMutation({
    mutationFn: async (respuestas: Record<string, string>) => {
      const res = await fetch("/api/vortice/aula/diagnostico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ respuestas }),
      });
      if (!res.ok) throw new Error("Error evaluando diagnóstico");
      return res.json() as Promise<DiagnosticoResult>;
    },
    onSuccess: (data) => setResDiag(data),
  });

  const comprobarMutation = useMutation({
    mutationFn: async (payload: { respuestas: Record<string, string>; origen: "normal" | "ya_lo_se" }) => {
      const res = await fetch(`/api/vortice/aula/lecciones/${encodeURIComponent(leccion.oaId)}/comprobar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error registrando comprobación");
      return res.json() as Promise<ComprobacionResult>;
    },
    onSuccess: (data) => {
      setResComprueba(data);
      if (data.progreso) {
        queryClient.setQueryData<PilotoResponse>(["/api/vortice/aula/piloto"], (prev) =>
          prev ? { ...prev, progreso: { ...prev.progreso, [data.progreso!.oaId]: data.progreso! } } : prev,
        );
      }
      queryClient.invalidateQueries({ queryKey: ["/api/vortice/conocimiento/mapa"] });
    },
  });

  const registrarPracticaMutation = useMutation({
    mutationFn: async (payload: {
      oaId: string;
      preguntaId: string;
      opcionId: string;
      usoPista: boolean;
      clientSubmissionId: string;
    }) => {
      const res = await fetch("/api/vortice/conocimiento/practica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vortice/conocimiento/mapa"] });
    },
  });

  const actualizarYGuardar = (patch: Partial<GuardarProgresoLeccionInput>) => {
    const siguiente: GuardarProgresoLeccionInput = {
      pasoActual: patch.pasoActual ?? pasoActual,
      tramoActual: patch.tramoActual ?? tramoActual,
      puertaPreferida: patch.puertaPreferida ?? puertaPreferida,
      pasoEjemploVisto: patch.pasoEjemploVisto ?? pasoEjemploVisto,
    };
    setPasoActual(siguiente.pasoActual);
    setTramoActual(siguiente.tramoActual);
    setPuertaPreferida(siguiente.puertaPreferida);
    setPasoEjemploVisto(siguiente.pasoEjemploVisto);
    guardarProgresoMutation.mutate(siguiente);
  };

  if (pilotoQuery.isError && (pilotoQuery.error as Error).message === "UNAUTHORIZED") {
    return (
      <div className="min-h-screen bg-[#f7f4ee] flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Inicia sesión para entrar al Aula</CardTitle>
            <CardDescription>Necesitas tu cuenta activa para guardar exactamente en qué tramo vas.</CardDescription>
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

  const { principal, secundarias } = seleccionarPuertaPrincipal(leccion, puertaPreferida);
  const tramo = leccion.microTramos[tramoActual] ?? leccion.microTramos[0];
  const ejercicioActual = leccion.ejerciciosPractica[idxPractica] ?? leccion.ejerciciosPractica[0];
  const respActual = respPractica[ejercicioActual.id];
  const nivelPistaActual = nivelPistaPorEj[ejercicioActual.id] ?? 0;
  const idxOa = lecciones.findIndex((l) => l.oaId === leccion.oaId);
  const siguienteOa = idxOa >= 0 && idxOa + 1 < lecciones.length ? lecciones[idxOa + 1] : null;
  const diagLeccion = lecciones[idxDiag] ?? lecciones[0];

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1c2a3a] py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-5">
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
                5.º Básico · Matemática · {leccion.modulo}
              </p>
              <h1 className="text-2xl font-serif font-bold text-[#1c2a3a]">Aula Universal del Piloto</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/vortice/conocimientos">
              <Button type="button" variant="outline">
                Mis conocimientos
              </Button>
            </Link>
            <Button
              type="button"
              variant={abiertoDiagnostico ? "secondary" : "outline"}
              onClick={() => setAbiertoDiagnostico((v) => !v)}
            >
              <Compass className="w-4 h-4 mr-2" />
              Diagnóstico inicial (0)
            </Button>
          </div>
        </div>

        {/* Selector de los 5 OA del piloto */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Objetivos del módulo">
          {lecciones.map((item) => {
            const p = pilotoQuery.data?.progreso?.[item.oaId];
            const activo = item.oaId === leccion.oaId;
            return (
              <button
                key={item.oaId}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setOaSeleccionado(item.oaId)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-left transition flex items-center gap-2 ${
                  activo
                    ? "bg-[#1f4a3d] text-white border-[#1f4a3d]"
                    : "bg-white text-[#1c2a3a] border-[#e8e2d6] hover:border-[#1f4a3d]"
                }`}
              >
                <span className="font-semibold text-sm">{item.codigo}</span>
                {p?.practicaLograda && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Panel de Diagnóstico 0 orientador (una pregunta a la vez, sin nota ni reloj) */}
        {abiertoDiagnostico && (
          <Card className="border-[#2f6b55] bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Evaluación de diagnóstico (0) · Orientación sin nota</CardTitle>
              <CardDescription>
                Responde una pregunta breve por tema para sugerir qué te conviene repasar y dónde puedes ir directo a comprobar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!resDiag ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline">
                      Pregunta {idxDiag + 1} de {lecciones.length} · {diagLeccion.codigo}
                    </Badge>
                    <BotonVoz
                      id={`diag-${diagLeccion.preguntaDiagnostico.id}`}
                      texto={`${diagLeccion.preguntaDiagnostico.enunciado}. ${diagLeccion.preguntaDiagnostico.alternativas.map((a) => `${a.id}: ${a.texto}`).join(". ")}`}
                      voz={voz}
                    />
                  </div>
                  <p className="font-medium text-base">{diagLeccion.preguntaDiagnostico.enunciado}</p>
                  <div className="grid gap-2">
                    {diagLeccion.preguntaDiagnostico.alternativas.map((alt) => {
                      const marcada = respDiag[diagLeccion.preguntaDiagnostico.id] === alt.id;
                      return (
                        <button
                          key={alt.id}
                          type="button"
                          onClick={() =>
                            setRespDiag((prev) => ({ ...prev, [diagLeccion.preguntaDiagnostico.id]: alt.id }))
                          }
                          className={`min-h-[44px] px-4 py-2.5 rounded-lg border text-left transition ${
                            marcada ? "bg-[#e5ece4] border-[#1f4a3d] font-semibold" : "bg-white border-[#e8e2d6]"
                          }`}
                        >
                          <span className="font-bold mr-2">{alt.id}.</span>
                          {alt.texto}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={idxDiag === 0}
                      onClick={() => setIdxDiag((i) => Math.max(0, i - 1))}
                    >
                      Anterior
                    </Button>
                    {idxDiag + 1 < lecciones.length ? (
                      <Button type="button" onClick={() => setIdxDiag((i) => i + 1)}>
                        Siguiente tema
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => diagMutation.mutate(respDiag)}
                        disabled={diagMutation.isPending}
                      >
                        Ver sugerencia de ruta
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[#5b6670]">
                    Diagnóstico completado (solo orientador; puedes recorrer igual todos los módulos):
                  </p>
                  <div className="grid gap-2">
                    {resDiag.porOa.map((item) => (
                      <div
                        key={item.oaId}
                        className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-[#e8e2d6] bg-[#faf8f3]"
                      >
                        <div>
                          <span className="font-semibold mr-2">{item.codigo}</span>
                          <span className="text-sm">{item.titulo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={item.recomendacion === "ya_lo_se_sugerido" ? "secondary" : "outline"}
                          >
                            {item.recomendacion === "ya_lo_se_sugerido" ? "Sugerido: Ya lo sé" : "Conviene estudiar"}
                          </Badge>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const yaLoSe = item.recomendacion === "ya_lo_se_sugerido";
                              if (item.oaId === leccion.oaId) {
                                setOrigenYaLoSe(yaLoSe);
                                setPasoActual(yaLoSe ? "comprueba" : "me_ubico");
                              } else {
                                saltoYaLoSeOaRef.current = yaLoSe ? item.oaId : null;
                                setOaSeleccionado(item.oaId);
                              }
                              setAbiertoDiagnostico(false);
                            }}
                          >
                            Abrir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setResDiag(null)}>
                    Responder de nuevo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {retomadoBanner && (
          <Alert className="border-[#2f6b55] bg-[#e5ece4] text-[#1f4a3d]">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>{retomadoBanner}</span>
              {progresoActual?.practicaLograda && (
                <Badge className="bg-[#1f4a3d] text-white">Comprobación lograda</Badge>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Cabecera de la lección actual */}
        <Card className="border-[#e8e2d6] bg-white">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#1f4a3d] text-white">{leccion.codigo}</Badge>
                <Badge variant="outline">
                  {leccion.prioridad === "nucleo_examen" ? "Prioridad de examen" : "Del nivel"}
                </Badge>
                <span className="text-xs text-[#5b6670]">{leccion.tiempoEstimadoMin} min aprox.</span>
              </div>
              {guardarProgresoMutation.isPending && (
                <span className="text-xs text-[#5b6670]">Guardando tramo…</span>
              )}
            </div>
            <CardTitle className="text-xl font-serif pt-1">{leccion.titulo}</CardTitle>
          </CardHeader>

          {/* Barra fija de los 4 bloques */}
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="tablist" aria-label="Pasos de la lección">
              {PASOS_LECCION.map((paso) => {
                const activo = pasoActual === paso;
                return (
                  <button
                    key={paso}
                    type="button"
                    role="tab"
                    aria-selected={activo}
                    onClick={() => {
                      setOrigenYaLoSe(false);
                      actualizarYGuardar({ pasoActual: paso });
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-lg border text-sm font-semibold transition ${
                      activo
                        ? "bg-[#1f4a3d] text-white border-[#1f4a3d]"
                        : "bg-[#faf8f3] text-[#1c2a3a] border-[#e8e2d6] hover:border-[#1f4a3d]"
                    }`}
                  >
                    {ETIQUETA_PASO[paso]}
                  </button>
                );
              })}
            </div>

            {/* BLOQUE 1: ME UBICO (Anticipador + Vocabulario clave previo) */}
            {pasoActual === "me_ubico" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-[#faf8f3] border border-[#e8e2d6] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#1f4a3d]" />
                      ¿Qué vas a lograr aquí?
                    </h2>
                    <BotonVoz id={`obj-${leccion.oaId}`} texto={leccion.objetivo} voz={voz} />
                  </div>
                  <p className="text-base">{leccion.objetivo}</p>
                  <p className="text-xs text-[#5b6670]">
                    Esta lección tiene {leccion.microTramos.length} tramos breves, 1 ejemplo paso a paso y 3 comprobaciones sin cronómetro.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-[#5b6670]">
                    Vocabulario clave antes de partir
                  </h3>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {leccion.vocabulario.map((item) => (
                      <div key={item.termino} className="p-3 rounded-lg border border-[#e8e2d6] bg-white space-y-1">
                        <div className="font-semibold text-[#1f4a3d]">{item.termino}</div>
                        <p className="text-sm text-[#1c2a3a]">{item.definicion}</p>
                        <p className="text-xs text-[#5b6670]">Ejemplo: {item.ejemplo}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOrigenYaLoSe(true);
                      actualizarYGuardar({ pasoActual: "comprueba" });
                    }}
                  >
                    Ya lo sé, ir directo a comprobar
                  </Button>
                  <Button
                    type="button"
                    className="bg-[#1f4a3d] hover:bg-[#173a30]"
                    onClick={() => actualizarYGuardar({ pasoActual: "aprende", tramoActual: 0 })}
                  >
                    Empezar en Aprende
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* BLOQUE 2: APRENDE (1 puerta principal + desplegables + micro-tramo + ejemplo paso a paso) */}
            {pasoActual === "aprende" && (
              <div className="space-y-5">
                {/* Única puerta principal visible por defecto */}
                <div className="p-4 rounded-xl border-2 border-[#1f4a3d] bg-[#faf8f3] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Badge className="bg-[#1f4a3d] text-white mb-1">Puerta principal · {principal.duracion}</Badge>
                      <h2 className="text-lg font-semibold">{principal.etiqueta}</h2>
                    </div>
                    <BotonVoz
                      id={`puerta-${leccion.oaId}-${principal.tipo}`}
                      texto={`${principal.etiqueta}. ${principal.descripcion}. ${principal.transcripcion}`}
                      voz={voz}
                    />
                  </div>
                  <p className="text-sm text-[#5b6670]">{principal.descripcion}</p>

                  {principal.tipo === "explorar" && principal.explorarConfig && (
                    <div className="p-3 rounded-lg bg-white border border-[#e8e2d6] space-y-2">
                      <p className="font-semibold text-sm">{principal.explorarConfig.titulo}</p>
                      <p className="text-xs text-[#5b6670]">{principal.explorarConfig.descripcion}</p>
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium">{principal.explorarConfig.izqEtiqueta}</div>
                        <div className="h-3 rounded-full bg-[#e8e2d6] overflow-hidden">
                          <div
                            className="h-full bg-[#e8893a]"
                            style={{ width: `${principal.explorarConfig.izqValor}%` }}
                          />
                        </div>
                        <div className="text-xs font-medium">{principal.explorarConfig.derEtiqueta}</div>
                        <div className="h-3 rounded-full bg-[#e8e2d6] overflow-hidden">
                          <div
                            className="h-full bg-[#1f4a3d]"
                            style={{ width: `${principal.explorarConfig.derValor}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-white border border-[#e8e2d6] text-sm">
                    <span className="font-semibold block text-xs uppercase text-[#5b6670] mb-1">
                      Transcripción / guion breve
                    </span>
                    {principal.transcripcion}
                  </div>

                  {/* Controles desplegables para no saturar */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-expanded={verOtrasPuertas}
                      onClick={() => setVerOtrasPuertas((v) => !v)}
                    >
                      Ver otras formas de aprender ({secundarias.length})
                      {verOtrasPuertas ? <ChevronUp className="w-4 h-4 ml-1.5" /> : <ChevronDown className="w-4 h-4 ml-1.5" />}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-expanded={verApoyos}
                      onClick={() => setVerApoyos((v) => !v)}
                    >
                      Apoyos (mapa, infografía, tarjetas)
                      {verApoyos ? <ChevronUp className="w-4 h-4 ml-1.5" /> : <ChevronDown className="w-4 h-4 ml-1.5" />}
                    </Button>
                  </div>

                  {verOtrasPuertas && (
                    <div className="grid gap-2 sm:grid-cols-3 pt-2">
                      {secundarias.map((sec) => (
                        <button
                          key={sec.tipo}
                          type="button"
                          onClick={() => {
                            setVerOtrasPuertas(false);
                            actualizarYGuardar({ puertaPreferida: sec.tipo });
                          }}
                          className="min-h-[44px] p-3 rounded-lg border border-[#e8e2d6] bg-white text-left hover:border-[#1f4a3d]"
                        >
                          <div className="font-semibold text-sm">{sec.etiqueta}</div>
                          <div className="text-xs text-[#5b6670]">{sec.duracion}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {verApoyos && (
                    <div className="p-3 rounded-lg border border-[#e8e2d6] bg-white space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {(["mapa", "infografia", "tarjetas"] as const).map((tab) => (
                          <Button
                            key={tab}
                            type="button"
                            size="sm"
                            variant={apoyoActivo === tab ? "default" : "outline"}
                            onClick={() => setApoyoActivo(tab)}
                          >
                            {tab === "mapa" ? "Mapa mental" : tab === "infografia" ? "Infografía" : "Tarjetas"}
                          </Button>
                        ))}
                      </div>
                      {apoyoActivo === "mapa" && (
                        <ul className="space-y-1.5 text-sm">
                          {leccion.apoyos.mapaMental.map((n) => (
                            <li key={n.nodo}>
                              <span className="font-semibold text-[#1f4a3d]">{n.nodo}:</span> {n.detalle}
                            </li>
                          ))}
                        </ul>
                      )}
                      {apoyoActivo === "infografia" && (
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {leccion.apoyos.infografiaResumen.map((linea, idx) => (
                            <li key={idx}>{linea}</li>
                          ))}
                        </ul>
                      )}
                      {apoyoActivo === "tarjetas" && (
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-[#faf8f3] border border-[#e8e2d6] text-sm">
                            <span className="text-xs uppercase text-[#5b6670] block mb-1">
                              Tarjeta {tarjetaIdx + 1} de {leccion.apoyos.tarjetas.length}
                            </span>
                            <p className="font-medium">
                              {tarjetaVolteada
                                ? leccion.apoyos.tarjetas[tarjetaIdx].reverso
                                : leccion.apoyos.tarjetas[tarjetaIdx].frente}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => setTarjetaVolteada((v) => !v)}>
                              {tarjetaVolteada ? "Ver pregunta" : "Dar vuelta"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTarjetaVolteada(false);
                                setTarjetaIdx((i) => (i + 1) % leccion.apoyos.tarjetas.length);
                              }}
                            >
                              Siguiente tarjeta
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Micro-tramo actual (de a uno para menos carga cognitiva) */}
                <div className="p-4 rounded-xl border border-[#e8e2d6] bg-white space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline">
                      Tramo {tramoActual + 1} de {leccion.microTramos.length}
                    </Badge>
                    <BotonVoz
                      id={`tramo-${leccion.oaId}-${tramoActual}`}
                      texto={`${tramo.titulo}. ${tramo.consigna}. ${tramo.contenido}`}
                      voz={voz}
                    />
                  </div>
                  <h3 className="font-semibold text-base">{tramo.titulo}</h3>
                  <p className="text-sm font-medium text-[#2f6b55]">{tramo.consigna}</p>
                  <p className="text-sm leading-relaxed">{tramo.contenido}</p>
                  <div className="flex justify-between pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={tramoActual === 0}
                      onClick={() => actualizarYGuardar({ tramoActual: Math.max(0, tramoActual - 1) })}
                    >
                      Tramo anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={tramoActual + 1 >= leccion.microTramos.length}
                      onClick={() =>
                        actualizarYGuardar({
                          tramoActual: Math.min(leccion.microTramos.length - 1, tramoActual + 1),
                        })
                      }
                    >
                      Siguiente tramo
                    </Button>
                  </div>
                </div>

                {/* Ejemplo resuelto paso a paso (revelar de a uno) */}
                <div className="p-4 rounded-xl border border-[#e8e2d6] bg-[#faf8f3] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-base">{leccion.ejemploResuelto.titulo}</h3>
                    <BotonVoz
                      id={`ej-${leccion.oaId}-${pasoEjemploVisto}`}
                      texto={leccion.ejemploResuelto.pasos.slice(0, pasoEjemploVisto + 1).join(". ")}
                      voz={voz}
                    />
                  </div>
                  <ol className="space-y-2">
                    {leccion.ejemploResuelto.pasos.map((pasoTxt, i) => (
                      <li
                        key={i}
                        className={`p-2.5 rounded-lg border text-sm ${
                          i <= pasoEjemploVisto
                            ? "bg-white border-[#2f6b55] text-[#1c2a3a]"
                            : "bg-[#f4efe6] border-dashed border-[#d6cfc2] text-[#7b858c]"
                        }`}
                      >
                        <span className="font-semibold mr-2">Paso {i + 1}:</span>
                        {i <= pasoEjemploVisto ? pasoTxt : "Paso oculto (pulsa mostrar siguiente paso)"}
                      </li>
                    ))}
                  </ol>
                  <div className="p-3 rounded-lg bg-[#fff7ed] border border-[#fed7aa] text-sm">
                    <span className="font-semibold">Error frecuente:</span> {leccion.ejemploResuelto.errorFrecuente}
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 pt-1">
                    {pasoEjemploVisto + 1 < leccion.ejemploResuelto.pasos.length ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => actualizarYGuardar({ pasoEjemploVisto: pasoEjemploVisto + 1 })}
                      >
                        Mostrar paso {pasoEjemploVisto + 2}
                      </Button>
                    ) : (
                      <span className="text-xs font-medium text-[#2f6b55] self-center">Ejemplo completo revisado</span>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setOrigenYaLoSe(true);
                          actualizarYGuardar({ pasoActual: "comprueba" });
                        }}
                      >
                        Ya lo sé
                      </Button>
                      <Button
                        type="button"
                        className="bg-[#1f4a3d] hover:bg-[#173a30]"
                        onClick={() => actualizarYGuardar({ pasoActual: "intentalo" })}
                      >
                        Seguir con Inténtalo tú
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BLOQUE 3: INTÉNTALO TÚ (1 pregunta por pantalla + 3 niveles deterministas de pista sin IA) */}
            {pasoActual === "intentalo" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline">
                    Práctica {idxPractica + 1} de {leccion.ejerciciosPractica.length} · Sin nota ni cronómetro
                  </Badge>
                  <BotonVoz
                    id={`prac-${ejercicioActual.id}`}
                    texto={`${ejercicioActual.enunciado}. ${ejercicioActual.alternativas.map((a) => `${a.id}: ${a.texto}`).join(". ")}`}
                    voz={voz}
                  />
                </div>

                <p className="text-base font-medium">{ejercicioActual.enunciado}</p>

                <div className="grid gap-2">
                  {ejercicioActual.alternativas.map((alt) => {
                    const seleccionada = respActual === alt.id;
                    const esCorrecta = alt.id === ejercicioActual.respuestaCorrecta;
                    return (
                      <button
                        key={alt.id}
                        type="button"
                        onClick={() => {
                          setRespPractica((prev) => ({ ...prev, [ejercicioActual.id]: alt.id }));
                          const submissionId =
                            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                              ? crypto.randomUUID()
                              : `prac-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
                          registrarPracticaMutation.mutate({
                            oaId: leccion.oaId,
                            preguntaId: ejercicioActual.id,
                            opcionId: alt.id,
                            usoPista: nivelPistaActual > 0,
                            clientSubmissionId: submissionId,
                          });
                        }}
                        className={`min-h-[44px] px-4 py-2.5 rounded-lg border text-left transition ${
                          seleccionada
                            ? esCorrecta
                              ? "bg-[#e5ece4] border-[#1f4a3d] font-semibold"
                              : "bg-[#fef2f2] border-[#d65a4a]"
                            : "bg-white border-[#e8e2d6]"
                        }`}
                      >
                        <span className="font-bold mr-2">{alt.id}.</span>
                        {alt.texto}
                      </button>
                    );
                  })}
                </div>

                {respActual && (
                  <div
                    className={`p-3 rounded-lg border text-sm ${
                      respActual === ejercicioActual.respuestaCorrecta
                        ? "bg-[#e5ece4] border-[#1f4a3d]"
                        : "bg-[#faf8f3] border-[#e8e2d6]"
                    }`}
                  >
                    {respActual === ejercicioActual.respuestaCorrecta ? (
                      <>
                        <span className="font-semibold">Bien:</span> {ejercicioActual.explicacionCorrecta}
                      </>
                    ) : (
                      <span>Aún no coincide. Usa una pista abajo y vuelve a elegir con calma.</span>
                    )}
                  </div>
                )}

                {/* Pistas escalonadas en 3 niveles (deterministas, sin IA) */}
                <div className="p-4 rounded-xl bg-[#faf8f3] border border-[#e8e2d6] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-[#e8893a]" />
                      Pistas paso a paso (sin nota)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {([1, 2, 3] as const).map((n) => (
                        <Button
                          key={n}
                          type="button"
                          size="sm"
                          variant={nivelPistaActual >= n ? "secondary" : "outline"}
                          onClick={() =>
                            setNivelPistaPorEj((prev) => ({ ...prev, [ejercicioActual.id]: n }))
                          }
                        >
                          <HelpCircle className="w-3.5 h-3.5 mr-1" />
                          Pista {n}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {nivelPistaActual > 0 ? (
                    <div className="space-y-1.5 text-sm">
                      {([1, 2, 3] as const)
                        .filter((n) => n <= nivelPistaActual)
                        .map((n) => (
                          <p key={n} className="p-2 rounded bg-white border border-[#e8e2d6]">
                            <span className="font-semibold">
                              Nivel {n} ({n === 1 ? "dónde mirar" : n === 2 ? "primer paso" : "ejemplo similar"}):{" "}
                            </span>
                            {pistaPorNivel(ejercicioActual, n)}
                          </p>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#5b6670]">
                      Si te trabas, pide Pista 1 (dónde mirar), Pista 2 (primer paso) o Pista 3 (ejemplo similar).
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap justify-between gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={idxPractica === 0}
                    onClick={() => setIdxPractica((i) => Math.max(0, i - 1))}
                  >
                    Ejercicio anterior
                  </Button>
                  <div className="flex gap-2">
                    {idxPractica + 1 < leccion.ejerciciosPractica.length ? (
                      <Button type="button" variant="outline" onClick={() => setIdxPractica((i) => i + 1)}>
                        Siguiente ejercicio
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      className="bg-[#1f4a3d] hover:bg-[#173a30]"
                      onClick={() => {
                        setOrigenYaLoSe(false);
                        actualizarYGuardar({ pasoActual: "comprueba" });
                      }}
                    >
                      Pasar a Comprueba
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* BLOQUE 4: COMPRUEBA (proceso sin cronómetro ni porcentaje visible; solo Logrado / Sigue practicando) */}
            {pasoActual === "comprueba" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#1f4a3d]" />
                      Comprueba lo aprendido (sin reloj ni nota)
                    </h2>
                    <p className="text-xs text-[#5b6670]">
                      {origenYaLoSe
                        ? "Entraste directo con «Ya lo sé»: si logras las 3 respuestas, avanzas sin repetir."
                        : "Responde estas 3 preguntas para confirmar tu dominio en este tema."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {leccion.ejerciciosComprobacion.map((ej, idx) => (
                    <div key={ej.id} className="p-4 rounded-xl border border-[#e8e2d6] bg-[#faf8f3] space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline">Comprobación {idx + 1} de 3</Badge>
                        <BotonVoz
                          id={`comp-${ej.id}`}
                          texto={`${ej.enunciado}. ${ej.alternativas.map((a) => `${a.id}: ${a.texto}`).join(". ")}`}
                          voz={voz}
                        />
                      </div>
                      <p className="font-medium text-sm sm:text-base">{ej.enunciado}</p>
                      <div className="grid gap-2">
                        {ej.alternativas.map((alt) => {
                          const marcada = respComprueba[ej.id] === alt.id;
                          return (
                            <button
                              key={alt.id}
                              type="button"
                              onClick={() => setRespComprueba((prev) => ({ ...prev, [ej.id]: alt.id }))}
                              className={`min-h-[44px] px-3.5 py-2 rounded-lg border text-left text-sm transition ${
                                marcada ? "bg-[#e5ece4] border-[#1f4a3d] font-semibold" : "bg-white border-[#e8e2d6]"
                              }`}
                            >
                              <span className="font-bold mr-2">{alt.id}.</span>
                              {alt.texto}
                            </button>
                          );
                        })}
                      </div>
                      {resComprueba && (
                        <p className="text-xs font-medium text-[#1c2a3a]">
                          {resComprueba.detalle[ej.id]
                            ? `Correcto: ${ej.explicacionCorrecta}`
                            : "Revisa este ejercicio antes de volver a comprobar."}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {resComprueba && (
                  <Alert
                    className={
                      resComprueba.estado === "logrado"
                        ? "border-[#1f4a3d] bg-[#e5ece4] text-[#1f4a3d]"
                        : "border-[#e8893a] bg-[#fff7ed] text-[#1c2a3a]"
                    }
                  >
                    <AlertDescription className="font-semibold">
                      {resComprueba.estado === "logrado"
                        ? "Logrado: dominas este tema y tu avance quedó guardado."
                        : "Sigue practicando: revisa las preguntas pendientes o vuelve al paso Aprende."}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => actualizarYGuardar({ pasoActual: "aprende" })}
                  >
                    Volver a Aprende
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="bg-[#1f4a3d] hover:bg-[#173a30]"
                      disabled={comprobarMutation.isPending}
                      onClick={() =>
                        comprobarMutation.mutate({
                          respuestas: respComprueba,
                          origen: origenYaLoSe ? "ya_lo_se" : "normal",
                        })
                      }
                    >
                      Verificar respuestas
                    </Button>
                    {siguienteOa ? (
                      <Button type="button" variant="outline" onClick={() => setOaSeleccionado(siguienteOa.oaId)}>
                        Ir al siguiente tema ({siguienteOa.codigo})
                      </Button>
                    ) : (
                      <Link href="/vortice/evaluacion/me-e2">
                        <Button type="button" variant="outline">
                          Ir a Evaluación del módulo (4)
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
