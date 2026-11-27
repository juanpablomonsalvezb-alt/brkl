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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PASOS_LECCION,
  pistaPorNivel,
  seleccionarPuertaPrincipal,
  type GuardarProgresoLeccionInput,
  type LeccionUniversalPiloto,
  type PasoLeccion,
  type PuertaAprendizaje,
} from "@shared/aulaUniversal";
import "./vortice-editorial.css";

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
  explicaciones?: Record<string, string>;
  progreso: ProgresoLeccionDTO | null;
}

interface PracticaRespuestaEstado {
  opcionId: string;
  correcta: boolean;
  explicacion: string | null;
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full border-[#D5CFC2] text-[#87867F]"
        disabled
        title="Tu navegador no incluye síntesis de voz"
      >
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
      className={
        leyendo
          ? "rounded-full bg-(--vx-acento-soft) text-(--vx-primary) border border-(--vx-primary)/40 hover:bg-(--vx-acento-soft)"
          : "rounded-full border-[#D5CFC2] bg-white text-[#141413] hover:border-(--vx-primary) hover:bg-[#FAF9F5]"
      }
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
      if (res.status === 403) throw new Error("FORBIDDEN");
      if (!res.ok) throw new Error("Error cargando Aula Universal");
      return res.json();
    },
    retry: false,
  });

  const lecciones = pilotoQuery.data?.lecciones ?? [];
  const oaInicial = params?.oaId ?? "oa7";

  const [oaSeleccionado, setOaSeleccionado] = useState<string>(oaInicial);
  useEffect(() => {
    if (params?.oaId && lecciones.some((l) => l.oaId === params.oaId)) {
      setOaSeleccionado(params.oaId);
    } else if (lecciones.length > 0 && !lecciones.some((l) => l.oaId === oaSeleccionado)) {
      setOaSeleccionado(lecciones[0].oaId);
    }
  }, [params?.oaId, lecciones, oaSeleccionado]);

  const leccion = lecciones.find((l) => l.oaId === oaSeleccionado) ?? lecciones[0] ?? null;
  const progresoActual = leccion ? pilotoQuery.data?.progreso?.[leccion.oaId] ?? null : null;

  const [pasoActual, setPasoActual] = useState<PasoLeccion>("me_ubico");
  const [tramoActual, setTramoActual] = useState<number>(0);
  const [puertaPreferida, setPuertaPreferida] = useState<PuertaAprendizaje>("video");
  const [pasoEjemploVisto, setPasoEjemploVisto] = useState<number>(0);
  const [retomadoBanner, setRetomadoBanner] = useState<string | null>(null);

  // Desplegables en «Aprende» (solo 1 puerta principal visible por defecto).
  const [verOtrasPuertas, setVerOtrasPuertas] = useState(false);
  const [verApoyos, setVerApoyos] = useState(false);
  const [apoyoActivo, setApoyoActivo] = useState<"mapa" | "infografia" | "tarjetas">("mapa");
  const [tarjetaIdx, setTarjetaIdx] = useState(0);
  const [tarjetaVolteada, setTarjetaVolteada] = useState(false);

  // «Inténtalo tú»: 1 pregunta por pantalla y pistas en 3 niveles (corrección en servidor).
  const [idxPractica, setIdxPractica] = useState(0);
  const [respPractica, setRespPractica] = useState<Record<string, PracticaRespuestaEstado>>({});
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
    if (!leccion) return;
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
  }, [leccion, pilotoQuery.isSuccess, progresoActual]);

  const guardarProgresoMutation = useMutation({
    mutationFn: async (input: GuardarProgresoLeccionInput) => {
      if (!leccion) throw new Error("Lección no cargada");
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
      if (!leccion) throw new Error("Lección no cargada");
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
      const res = await fetch(`/api/vortice/aula/lecciones/${encodeURIComponent(payload.oaId)}/practica`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          preguntaId: payload.preguntaId,
          opcionId: payload.opcionId,
          usoPista: payload.usoPista,
          clientSubmissionId: payload.clientSubmissionId,
        }),
      });
      if (!res.ok) throw new Error("Error corrigiendo práctica");
      return res.json() as Promise<{ correcta: boolean; explicacion: string | null }>;
    },
    onSuccess: (data, variables) => {
      setRespPractica((prev) => ({
        ...prev,
        [variables.preguntaId]: {
          opcionId: variables.opcionId,
          correcta: data.correcta,
          explicacion: data.explicacion,
        },
      }));
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
      <div className="vx-editorial min-h-screen flex items-center justify-center p-6">
        <Card className="vx-paper max-w-md w-full border-[#E6E2D8] shadow-none">
          <CardHeader>
            <span className="vx-kicker">Sesión requerida</span>
            <CardTitle className="vx-serif font-medium text-2xl mt-1">Inicia sesión para entrar al Aula</CardTitle>
            <CardDescription className="text-[#5E5D59]">
              Necesitas tu cuenta activa para guardar exactamente en qué tramo vas.
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

  if (pilotoQuery.isError && (pilotoQuery.error as Error).message === "FORBIDDEN") {
    return (
      <div className="vx-editorial min-h-screen flex items-center justify-center p-6">
        <Card className="vx-paper max-w-md w-full border-[#E6E2D8] shadow-none">
          <CardHeader>
            <span className="vx-kicker">Acceso restringido</span>
            <CardTitle className="vx-serif font-medium text-2xl mt-1">Sin matrícula activa en esta asignatura</CardTitle>
            <CardDescription className="text-[#5E5D59]">
              Esta unidad está disponible únicamente para estudiantes con matrícula activa en el curso correspondiente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/vortice" className="vx-btn-primary">
              Volver a Vórtice
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pilotoQuery.isLoading) {
    return (
      <div className="vx-editorial min-h-screen flex items-center justify-center p-6">
        <p className="text-[#5E5D59]">Cargando Aula Universal…</p>
      </div>
    );
  }

  if (pilotoQuery.isError || !leccion) {
    return (
      <div className="vx-editorial min-h-screen flex items-center justify-center p-6">
        <Card className="vx-paper max-w-md w-full border-[#E6E2D8] shadow-none">
          <CardHeader>
            <CardTitle className="vx-serif font-medium text-2xl">No pudimos abrir el Aula</CardTitle>
            <CardDescription className="text-[#5E5D59]">
              Intenta recargar en unos segundos o vuelve al inicio de Vórtice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/vortice" className="vx-btn-primary">
              Volver a Vórtice
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
    <div className="vx-editorial min-h-screen">
      <header className="vx-topbar">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 min-h-14 py-2 flex items-center justify-between flex-wrap gap-2">
          <Link href="/vortice" className="vx-pill-nav">
            <ArrowLeft className="w-4 h-4" />
            <span className="sm:hidden">Volver</span><span className="hidden sm:inline">Volver a Vórtice</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Link href="/vortice/conocimientos" className="vx-pill-nav">
              <span className="sm:hidden">Conocimientos</span><span className="hidden sm:inline">Mis conocimientos</span>
            </Link>
            <button
              type="button"
              onClick={() => setAbiertoDiagnostico((v) => !v)}
              className={`vx-pill-nav ${
                abiertoDiagnostico ? "!border-(--vx-primary) !bg-(--vx-acento-soft) !text-(--vx-primary)" : ""
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="sm:hidden">Diagnóstico (0)</span><span className="hidden sm:inline">Diagnóstico inicial (0)</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-1.5">
          <span className="vx-kicker">5.º Básico · Matemática · {leccion.modulo}</span>
          <h1 className="text-3xl sm:text-[2.35rem] leading-[1.12] text-[#141413]">Aula Universal del Piloto</h1>
        </div>

        {/* Selector de los 5 OA del piloto con código y título corto */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2" role="tablist" aria-label="Objetivos del módulo">
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
                className={`min-h-[56px] px-3.5 py-2.5 rounded-2xl border text-left transition flex flex-col justify-between gap-1 ${
                  activo
                    ? "bg-(--vx-primary) text-white border-(--vx-primary) shadow-sm"
                    : "bg-white text-[#141413] border-[#E6E2D8] hover:border-(--vx-primary) hover:bg-[#FAF9F5]"
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 w-full">
                  <span className={`vx-mono font-medium text-xs ${activo ? "text-(--vx-acento)" : "text-[#C96442]"}`}>
                    {item.codigo}
                  </span>
                  {p?.practicaLograda && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                </div>
                <span className={`text-xs font-medium leading-tight line-clamp-1 ${activo ? "text-white" : "text-[#141413]"}`}>
                  {item.titulo}
                </span>
              </button>
            );
          })}
        </div>

        {/* Panel de Diagnóstico 0 orientador (una pregunta a la vez, sin nota ni reloj) */}
        {abiertoDiagnostico && (
          <Card className="vx-paper border-(--vx-primary)/35 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="vx-serif font-medium text-xl">Evaluación de diagnóstico (0) · Orientación sin nota</CardTitle>
              <CardDescription className="text-[#5E5D59]">
                Responde una pregunta breve por tema para sugerir qué te conviene repasar y dónde puedes ir directo a comprobar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!resDiag ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline" className="vx-mono rounded-full border-[#D5CFC2] text-[#5E5D59] font-normal">
                      Pregunta {idxDiag + 1} de {lecciones.length} · {diagLeccion.codigo}
                    </Badge>
                    <BotonVoz
                      id={`diag-${diagLeccion.preguntaDiagnostico.id}`}
                      texto={`${diagLeccion.preguntaDiagnostico.enunciado}. ${diagLeccion.preguntaDiagnostico.alternativas.map((a) => `${a.id}: ${a.texto}`).join(". ")}`}
                      voz={voz}
                    />
                  </div>
                  <p className="font-medium text-base text-[#141413] leading-relaxed">
                    {diagLeccion.preguntaDiagnostico.enunciado}
                  </p>
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
                          className={`vx-option-card ${
                            marcada ? "!bg-(--vx-acento-soft) !border-(--vx-primary) font-medium" : ""
                          }`}
                        >
                          <span className="vx-mono text-xs font-medium text-(--vx-primary) mr-2.5">{alt.id}.</span>
                          {alt.texto}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-[#D5CFC2]"
                      disabled={idxDiag === 0}
                      onClick={() => setIdxDiag((i) => Math.max(0, i - 1))}
                    >
                      Anterior
                    </Button>
                    {idxDiag + 1 < lecciones.length ? (
                      <Button
                        type="button"
                        className="rounded-full bg-(--vx-primary) hover:bg-(--vx-primary-hover) text-white"
                        onClick={() => setIdxDiag((i) => i + 1)}
                      >
                        Siguiente tema
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="rounded-full bg-(--vx-primary) hover:bg-(--vx-primary-hover) text-white"
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
                  <p className="text-sm text-[#5E5D59]">
                    Diagnóstico completado (solo orientador; puedes recorrer igual todos los módulos):
                  </p>
                  <ItemGroup className="gap-2">
                    {resDiag.porOa.map((item) => (
                      <Item
                        key={item.oaId}
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-[#E6E2D8] bg-[#FAF9F5]"
                      >
                        <ItemContent>
                          <ItemTitle className="text-[#141413]">
                            <span className="vx-mono text-sm text-(--vx-primary)">{item.codigo}</span>
                            <span className="font-normal">{item.titulo}</span>
                          </ItemTitle>
                        </ItemContent>
                        <ItemActions>
                          <Badge
                            variant="outline"
                            className={`rounded-full font-normal ${
                              item.recomendacion === "ya_lo_se_sugerido"
                                ? "bg-(--vx-acento-soft) text-(--vx-primary) border-(--vx-primary)/30"
                                : "bg-[#FBF0EB] text-[#9A4225] border-[#C96442]/30"
                            }`}
                          >
                            {item.recomendacion === "ya_lo_se_sugerido" ? "Sugerido: Ya lo sé" : "Conviene estudiar"}
                          </Badge>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-full border-[#D5CFC2] bg-white"
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
                        </ItemActions>
                      </Item>
                    ))}
                  </ItemGroup>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full border-[#D5CFC2]"
                    onClick={() => setResDiag(null)}
                  >
                    Responder de nuevo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {retomadoBanner && (
          <Alert className="rounded-2xl border-(--vx-primary)/30 bg-(--vx-acento-soft) text-(--vx-primary)">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2 text-[14.5px]">
              <span>{retomadoBanner}</span>
              {progresoActual?.practicaLograda && (
                <Badge className="rounded-full bg-(--vx-primary) text-white font-normal">Comprobación lograda</Badge>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Cabecera de la lección actual */}
        <Card className="vx-paper border-[#E6E2D8] shadow-none">
          <CardHeader className="pb-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="vx-mono rounded-full bg-(--vx-primary) text-white font-normal">{leccion.codigo}</Badge>
                <Badge variant="outline" className="rounded-full border-[#D5CFC2] text-[#5E5D59] font-normal">
                  {leccion.prioridad === "nucleo_examen" ? "Prioridad de examen" : "Del nivel"}
                </Badge>
                <span className="vx-mono text-xs text-[#87867F]">{leccion.tiempoEstimadoMin} min aprox.</span>
              </div>
              {guardarProgresoMutation.isPending && (
                <span className="text-xs text-[#5E5D59]">Guardando tramo…</span>
              )}
            </div>
            <CardTitle className="vx-serif font-medium text-2xl sm:text-[1.65rem] leading-snug pt-1 text-[#141413]">
              {leccion.titulo}
            </CardTitle>
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs text-[#5E5D59]">
                <span className="vx-mono">
                  Paso {PASOS_LECCION.indexOf(pasoActual) + 1} de {PASOS_LECCION.length}
                </span>
                <span>{ETIQUETA_PASO[pasoActual]}</span>
              </div>
              <Progress
                value={((PASOS_LECCION.indexOf(pasoActual) + 1) / PASOS_LECCION.length) * 100}
                aria-label={`Paso ${PASOS_LECCION.indexOf(pasoActual) + 1} de ${PASOS_LECCION.length}`}
                className="h-1.5 bg-[#ECE8DE] [&>div]:bg-(--vx-primary)"
              />
            </div>
          </CardHeader>

          {/* Barra fija de los 4 bloques */}
          <CardContent>
            <Tabs
              value={pasoActual}
              onValueChange={(v) => {
                setOrigenYaLoSe(false);
                actualizarYGuardar({ pasoActual: v as PasoLeccion });
              }}
              className="space-y-6"
            >
              <TabsList
                className="grid h-auto w-full grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-2xl bg-[#F3F1EA] border border-[#E6E2D8] p-1.5"
                aria-label="Pasos de la lección"
              >
                {PASOS_LECCION.map((paso) => (
                  <TabsTrigger
                    key={paso}
                    value={paso}
                    className="min-h-[42px] rounded-xl border border-transparent px-3 py-2 text-sm text-[#5E5D59] hover:text-[#141413] hover:bg-white/60 data-[state=active]:bg-white data-[state=active]:text-[#141413] data-[state=active]:border-[#D5CFC2] data-[state=active]:shadow-sm"
                  >
                    {ETIQUETA_PASO[paso]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* BLOQUE 1: ME UBICO (Anticipador + Vocabulario clave previo) */}
              <TabsContent value="me_ubico" className="mt-0 space-y-6">
                <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E6E2D8] border-l-2 border-l-[#C96442] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="vx-serif font-medium text-lg flex items-center gap-2 text-[#141413]">
                      <BookOpen className="w-4 h-4 text-(--vx-primary)" />
                      ¿Qué vas a lograr aquí?
                    </h2>
                    <BotonVoz id={`obj-${leccion.oaId}`} texto={leccion.objetivo} voz={voz} />
                  </div>
                  <p className="text-[16px] leading-[1.65] text-[#141413] max-w-[66ch]">{leccion.objetivo}</p>
                  <p className="text-xs text-[#5E5D59]">
                    Esta lección tiene {leccion.microTramos.length} tramos breves, 1 ejemplo paso a paso y 3 comprobaciones sin cronómetro.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="vx-kicker !text-[#5E5D59]">
                    Vocabulario clave antes de partir
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {leccion.vocabulario.map((item) => (
                      <div key={item.termino} className="p-4 rounded-xl border border-[#E6E2D8] bg-white space-y-1.5">
                        <div className="vx-serif font-medium text-[17px] text-(--vx-primary)">{item.termino}</div>
                        <p className="text-sm leading-relaxed text-[#141413]">{item.definicion}</p>
                        <p className="text-xs text-[#5E5D59]">Ejemplo: {item.ejemplo}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-[#E6E2D8]" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-[#D5CFC2]"
                    onClick={() => {
                      setOrigenYaLoSe(true);
                      actualizarYGuardar({ pasoActual: "comprueba" });
                    }}
                  >
                    Ya lo sé, ir directo a comprobar
                  </Button>
                  <Button
                    type="button"
                    className="rounded-full px-5 bg-(--vx-primary) hover:bg-(--vx-primary-hover) text-white"
                    onClick={() => actualizarYGuardar({ pasoActual: "aprende", tramoActual: 0 })}
                  >
                    Empezar en Aprende
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </TabsContent>

              {/* BLOQUE 2: APRENDE (1 puerta principal + desplegables + micro-tramo + ejemplo paso a paso) */}
              <TabsContent value="aprende" className="mt-0 space-y-5">
                {/* Única puerta principal visible por defecto */}
                <div className="p-5 rounded-2xl border border-(--vx-primary)/35 bg-[#FAF9F5] space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <Badge className="rounded-full bg-(--vx-primary) text-white font-normal">
                        Puerta principal · {principal.duracion}
                      </Badge>
                      <h2 className="vx-serif font-medium text-xl text-[#141413]">{principal.etiqueta}</h2>
                    </div>
                    <BotonVoz
                      id={`puerta-${leccion.oaId}-${principal.tipo}`}
                      texto={`${principal.etiqueta}. ${principal.descripcion}. ${principal.transcripcion}`}
                      voz={voz}
                    />
                  </div>
                  <p className="text-[14.5px] leading-relaxed text-[#5E5D59]">{principal.descripcion}</p>

                  {principal.tipo === "explorar" && principal.explorarConfig && (
                    <div className="p-4 rounded-xl bg-white border border-[#E6E2D8] space-y-2.5">
                      <p className="font-medium text-sm text-[#141413]">{principal.explorarConfig.titulo}</p>
                      <p className="text-xs text-[#5E5D59]">{principal.explorarConfig.descripcion}</p>
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-[#141413]">{principal.explorarConfig.izqEtiqueta}</div>
                        <div className="h-3 rounded-full bg-[#F3F1EA] overflow-hidden">
                          <div
                            className="h-full bg-[#C96442] rounded-full"
                            style={{ width: `${principal.explorarConfig.izqValor}%` }}
                          />
                        </div>
                        <div className="text-xs font-medium text-[#141413]">{principal.explorarConfig.derEtiqueta}</div>
                        <div className="h-3 rounded-full bg-[#F3F1EA] overflow-hidden">
                          <div
                            className="h-full bg-(--vx-primary) rounded-full"
                            style={{ width: `${principal.explorarConfig.derValor}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-white border border-[#E6E2D8] text-[15px] leading-[1.65] text-[#141413]">
                    <span className="vx-kicker !text-[#5E5D59] block mb-1.5">
                      Transcripción / guion breve
                    </span>
                    <div className="max-w-[66ch]">{principal.transcripcion}</div>
                  </div>

                  {/* Controles desplegables para no saturar */}
                  <div className="space-y-2.5 pt-1">
                    {secundarias.length > 0 && (
                    <Collapsible open={verOtrasPuertas} onOpenChange={setVerOtrasPuertas} className="space-y-2">
                      <CollapsibleTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full border-[#D5CFC2] bg-white"
                          aria-expanded={verOtrasPuertas}
                        >
                          Ver otras formas de aprender ({secundarias.length})
                          {verOtrasPuertas ? <ChevronUp className="w-4 h-4 ml-1.5" /> : <ChevronDown className="w-4 h-4 ml-1.5" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="grid gap-2.5 sm:grid-cols-3 pt-1">
                          {secundarias.map((sec) => (
                            <button
                              key={sec.tipo}
                              type="button"
                              onClick={() => {
                                setVerOtrasPuertas(false);
                                actualizarYGuardar({ puertaPreferida: sec.tipo });
                              }}
                              className="vx-option-card !min-h-[44px] !p-3"
                            >
                              <div className="font-medium text-sm text-[#141413]">{sec.etiqueta}</div>
                              <div className="text-xs text-[#5E5D59] mt-0.5">{sec.duracion}</div>
                            </button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                    )}

                    <Collapsible open={verApoyos} onOpenChange={setVerApoyos} className="space-y-2">
                      <CollapsibleTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full border-[#D5CFC2] bg-white"
                          aria-expanded={verApoyos}
                        >
                          Apoyos (mapa, infografía, tarjetas)
                          {verApoyos ? <ChevronUp className="w-4 h-4 ml-1.5" /> : <ChevronDown className="w-4 h-4 ml-1.5" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Tabs
                          value={apoyoActivo}
                          onValueChange={(v) => setApoyoActivo(v as "mapa" | "infografia" | "tarjetas")}
                          className="p-4 rounded-xl border border-[#E6E2D8] bg-white space-y-3"
                        >
                          <TabsList className="inline-flex h-auto flex-wrap gap-1 rounded-full bg-[#F3F1EA] border border-[#E6E2D8] p-1">
                            {(["mapa", "infografia", "tarjetas"] as const).map((tab) => (
                              <TabsTrigger
                                key={tab}
                                value={tab}
                                className="rounded-full px-3.5 py-1 text-xs font-medium text-[#5E5D59] data-[state=active]:bg-(--vx-primary) data-[state=active]:text-white"
                              >
                                {tab === "mapa" ? "Mapa mental" : tab === "infografia" ? "Infografía" : "Tarjetas"}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          <TabsContent value="mapa" className="mt-0">
                            <ul className="space-y-1.5 text-sm leading-relaxed text-[#141413]">
                              {leccion.apoyos.mapaMental.map((n) => (
                                <li key={n.nodo}>
                                  <span className="font-semibold text-(--vx-primary)">{n.nodo}:</span> {n.detalle}
                                </li>
                              ))}
                            </ul>
                          </TabsContent>
                          <TabsContent value="infografia" className="mt-0">
                            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-[#141413]">
                              {leccion.apoyos.infografiaResumen.map((linea, idx) => (
                                <li key={idx}>{linea}</li>
                              ))}
                            </ul>
                          </TabsContent>
                          <TabsContent value="tarjetas" className="mt-0">
                            <div className="space-y-2.5">
                              <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E6E2D8] text-sm">
                                <span className="vx-kicker !text-[#5E5D59] block mb-1.5">
                                  Tarjeta {tarjetaIdx + 1} de {leccion.apoyos.tarjetas.length}
                                </span>
                                <p className="font-medium text-[15px] text-[#141413]">
                                  {tarjetaVolteada
                                    ? leccion.apoyos.tarjetas[tarjetaIdx].reverso
                                    : leccion.apoyos.tarjetas[tarjetaIdx].frente}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full border-[#D5CFC2]"
                                  onClick={() => setTarjetaVolteada((v) => !v)}
                                >
                                  {tarjetaVolteada ? "Ver pregunta" : "Dar vuelta"}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full border-[#D5CFC2]"
                                  onClick={() => {
                                    setTarjetaVolteada(false);
                                    setTarjetaIdx((i) => (i + 1) % leccion.apoyos.tarjetas.length);
                                  }}
                                >
                                  Siguiente tarjeta
                                </Button>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>

                {/* Micro-tramo actual (de a uno para menos carga cognitiva) */}
                <div className="p-5 rounded-2xl border border-[#E6E2D8] bg-white space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline" className="vx-mono rounded-full border-[#D5CFC2] text-[#5E5D59] font-normal">
                      Tramo {tramoActual + 1} de {leccion.microTramos.length}
                    </Badge>
                    <BotonVoz
                      id={`tramo-${leccion.oaId}-${tramoActual}`}
                      texto={`${tramo.titulo}. ${tramo.consigna}. ${tramo.contenido}`}
                      voz={voz}
                    />
                  </div>
                  <h3 className="vx-serif font-medium text-xl text-[#141413]">{tramo.titulo}</h3>
                  <p className="text-sm font-medium text-(--vx-primary)">{tramo.consigna}</p>
                  <p className="text-[15.5px] leading-[1.68] text-[#141413] max-w-[66ch]">{tramo.contenido}</p>
                  <div className="flex justify-between pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-[#D5CFC2]"
                      disabled={tramoActual === 0}
                      onClick={() => actualizarYGuardar({ tramoActual: Math.max(0, tramoActual - 1) })}
                    >
                      Tramo anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-[#D5CFC2]"
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
                <div className="p-5 rounded-2xl border border-[#E6E2D8] bg-[#FAF9F5] space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="vx-serif font-medium text-lg text-[#141413]">{leccion.ejemploResuelto.titulo}</h3>
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
                        className={`p-3 rounded-xl border text-[14.5px] leading-relaxed ${
                          i <= pasoEjemploVisto
                            ? "bg-white border-(--vx-primary)/35 text-[#141413]"
                            : "bg-[#F3F1EA] border-dashed border-[#D5CFC2] text-[#87867F]"
                        }`}
                      >
                        <span className="vx-mono text-xs font-medium text-(--vx-primary) mr-2.5">Paso {i + 1}</span>
                        {i <= pasoEjemploVisto ? pasoTxt : "Paso oculto (pulsa mostrar siguiente paso)"}
                      </li>
                    ))}
                  </ol>
                  <div className="p-3.5 rounded-xl bg-[#FBF0EB] border border-[#C96442]/30 text-sm text-[#141413]">
                    <span className="font-semibold text-[#9A4225]">Error frecuente:</span>{" "}
                    {leccion.ejemploResuelto.errorFrecuente}
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 pt-1">
                    {pasoEjemploVisto + 1 < leccion.ejemploResuelto.pasos.length ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-[#D5CFC2] bg-white"
                        onClick={() => actualizarYGuardar({ pasoEjemploVisto: pasoEjemploVisto + 1 })}
                      >
                        Mostrar paso {pasoEjemploVisto + 2}
                      </Button>
                    ) : (
                      <span className="text-xs font-medium text-(--vx-primary) self-center">Ejemplo completo revisado</span>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-[#D5CFC2] bg-white"
                        onClick={() => {
                          setOrigenYaLoSe(true);
                          actualizarYGuardar({ pasoActual: "comprueba" });
                        }}
                      >
                        Ya lo sé
                      </Button>
                      <Button
                        type="button"
                        className="rounded-full px-5 bg-(--vx-primary) hover:bg-(--vx-primary-hover) text-white"
                        onClick={() => actualizarYGuardar({ pasoActual: "intentalo" })}
                      >
                        Seguir con Inténtalo tú
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* BLOQUE 3: INTÉNTALO TÚ (1 pregunta por pantalla + 3 niveles deterministas de pista sin IA) */}
              <TabsContent value="intentalo" className="mt-0 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline" className="vx-mono rounded-full border-[#D5CFC2] text-[#5E5D59] font-normal">
                    Práctica {idxPractica + 1} de {leccion.ejerciciosPractica.length} · Sin nota ni cronómetro
                  </Badge>
                  <BotonVoz
                    id={`prac-${ejercicioActual.id}`}
                    texto={`${ejercicioActual.enunciado}. ${ejercicioActual.alternativas.map((a) => `${a.id}: ${a.texto}`).join(". ")}`}
                    voz={voz}
                  />
                </div>

                <p className="text-[16.5px] font-medium leading-relaxed text-[#141413] max-w-[66ch]">
                  {ejercicioActual.enunciado}
                </p>

                <div className="grid gap-2">
                  {ejercicioActual.alternativas.map((alt) => {
                    const seleccionada = respActual?.opcionId === alt.id;
                    const esCorrecta = Boolean(respActual?.correcta);
                    return (
                      <button
                        key={alt.id}
                        type="button"
                        disabled={registrarPracticaMutation.isPending}
                        onClick={() => {
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
                        className={`vx-option-card ${
                          seleccionada
                            ? esCorrecta
                              ? "!bg-(--vx-acento-soft) !border-(--vx-primary) font-medium"
                              : "!bg-[#FBF0EB] !border-[#C84B3B]/60"
                            : ""
                        }`}
                      >
                        <span className="vx-mono text-xs font-medium text-(--vx-primary) mr-2.5">{alt.id}.</span>
                        {alt.texto}
                      </button>
                    );
                  })}
                </div>

                {respActual && (
                  <div
                    className={`p-3.5 rounded-xl border text-sm ${
                      respActual.correcta
                        ? "bg-(--vx-acento-soft) border-(--vx-primary)/35 text-[#141413]"
                        : "bg-[#FAF9F5] border-[#E6E2D8] text-[#141413]"
                    }`}
                  >
                    {respActual.correcta ? (
                      <>
                        <span className="font-semibold text-(--vx-primary)">Bien:</span> {respActual.explicacion}
                      </>
                    ) : (
                      <span>Aún no coincide. Usa una pista abajo y vuelve a elegir con calma.</span>
                    )}
                  </div>
                )}

                {/* Pistas escalonadas en 3 niveles (deterministas, sin IA) */}
                <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E6E2D8] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#141413] flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-[#C96442]" />
                      Pistas paso a paso (sin nota)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {([1, 2, 3] as const).map((n) => (
                        <Button
                          key={n}
                          type="button"
                          size="sm"
                          variant={nivelPistaActual >= n ? "secondary" : "outline"}
                          className={
                            nivelPistaActual >= n
                              ? "rounded-full bg-[#FBF0EB] text-[#9A4225] border border-[#C96442]/35"
                              : "rounded-full border-[#D5CFC2] bg-white"
                          }
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
                    <div className="space-y-2 text-sm">
                      {([1, 2, 3] as const)
                        .filter((n) => n <= nivelPistaActual)
                        .map((n) => (
                          <p key={n} className="p-3 rounded-xl bg-white border border-[#E6E2D8] leading-relaxed">
                            <span className="font-medium text-(--vx-primary)">
                              Nivel {n} ({n === 1 ? "dónde mirar" : n === 2 ? "primer paso" : "ejemplo similar"}):{" "}
                            </span>
                            {pistaPorNivel(ejercicioActual, n)}
                          </p>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#5E5D59]">
                      Si te trabas, pide Pista 1 (dónde mirar), Pista 2 (primer paso) o Pista 3 (ejemplo similar).
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap justify-between gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-[#D5CFC2]"
                    disabled={idxPractica === 0}
                    onClick={() => setIdxPractica((i) => Math.max(0, i - 1))}
                  >
                    Ejercicio anterior
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    {idxPractica + 1 < leccion.ejerciciosPractica.length ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-[#D5CFC2]"
                        onClick={() => setIdxPractica((i) => i + 1)}
                      >
                        Siguiente ejercicio
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      className="rounded-full px-5 bg-(--vx-primary) hover:bg-(--vx-primary-hover) text-white"
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
              </TabsContent>

              {/* BLOQUE 4: COMPRUEBA (proceso sin cronómetro ni porcentaje visible; solo Logrado / Sigue practicando) */}
              <TabsContent value="comprueba" className="mt-0 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="vx-serif font-medium text-xl flex items-center gap-2 text-[#141413]">
                      <Sparkles className="w-4 h-4 text-(--vx-primary)" />
                      Comprueba lo aprendido (sin reloj ni nota)
                    </h2>
                    <p className="text-xs text-[#5E5D59] mt-0.5">
                      {origenYaLoSe
                        ? "Entraste directo con «Ya lo sé»: si logras las 3 respuestas, avanzas sin repetir."
                        : "Responde estas 3 preguntas para confirmar tu dominio en este tema."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {leccion.ejerciciosComprobacion.map((ej, idx) => (
                    <div key={ej.id} className="p-5 rounded-2xl border border-[#E6E2D8] bg-[#FAF9F5] space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline" className="vx-mono rounded-full border-[#D5CFC2] text-[#5E5D59] font-normal">
                          Comprobación {idx + 1} de 3
                        </Badge>
                        <BotonVoz
                          id={`comp-${ej.id}`}
                          texto={`${ej.enunciado}. ${ej.alternativas.map((a) => `${a.id}: ${a.texto}`).join(". ")}`}
                          voz={voz}
                        />
                      </div>
                      <p className="font-medium text-[15.5px] leading-relaxed text-[#141413]">{ej.enunciado}</p>
                      <div className="grid gap-2">
                        {ej.alternativas.map((alt) => {
                          const marcada = respComprueba[ej.id] === alt.id;
                          return (
                            <button
                              key={alt.id}
                              type="button"
                              onClick={() => setRespComprueba((prev) => ({ ...prev, [ej.id]: alt.id }))}
                              className={`vx-option-card text-sm ${
                                marcada ? "!bg-(--vx-acento-soft) !border-(--vx-primary) font-medium" : ""
                              }`}
                            >
                              <span className="vx-mono text-xs font-medium text-(--vx-primary) mr-2.5">{alt.id}.</span>
                              {alt.texto}
                            </button>
                          );
                        })}
                      </div>
                      {resComprueba && (
                        <p className="text-xs font-medium text-[#141413]">
                          {resComprueba.detalle[ej.id]
                            ? `Correcto: ${resComprueba.explicaciones?.[ej.id] ?? ""}`
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
                        ? "rounded-2xl border-(--vx-primary)/35 bg-(--vx-acento-soft) text-(--vx-primary)"
                        : "rounded-2xl border-[#C96442]/35 bg-[#FBF0EB] text-[#141413]"
                    }
                  >
                    <AlertDescription className="font-medium">
                      {resComprueba.estado === "logrado"
                        ? origenYaLoSe || progresoActual?.completadaPorYaLoSe
                          ? "Buen avance: saltaste el estudio y este tema quedó «Por confirmar otro día». Vuelve en un día diferente para confirmar tu dominio."
                          : "Buen avance hoy: tu progreso quedó guardado. Vuelve en un día diferente para confirmar tu dominio."
                        : "Sigue practicando: revisa las preguntas pendientes o vuelve al paso Aprende."}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-[#D5CFC2]"
                    onClick={() => actualizarYGuardar({ pasoActual: "aprende" })}
                  >
                    Volver a Aprende
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="rounded-full px-5 bg-(--vx-primary) hover:bg-(--vx-primary-hover) text-white"
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
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-[#D5CFC2]"
                        onClick={() => setOaSeleccionado(siguienteOa.oaId)}
                      >
                        Ir al siguiente tema ({siguienteOa.codigo})
                      </Button>
                    ) : (
                      <Link href="/vortice/evaluacion/me-e2" className="vx-btn-ghost">
                        Ir a Evaluación del módulo (4)
                      </Link>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
