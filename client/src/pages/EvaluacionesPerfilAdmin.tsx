// Panel interno de administración T39 (Bloque B):
// 1. Perfil único de evaluación por estudiante (regular / neurodivergente, regla O10 sin datos clínicos).
// 2. Clasificación funcional 0..4 por módulo (0 diagnóstico, 1..3 proceso, 4 evaluación del módulo) y compatibilidad P7.
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, CheckCircle2, ClipboardList, Loader2, Save, ShieldCheck, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { EvaluationFunction, EvaluationProfile } from "@shared/clasificacionEvaluacion";
import "./vortice/vortice-editorial.css";

interface PerfilRow {
  userId: string;
  email: string | null;
  name: string | null;
  role: string;
  levelId: string | null;
  perfil: EvaluationProfile;
  setBy: string | null;
  setAt: string | null;
}

interface ClasificacionRow {
  id: string;
  learningObjectiveId: string;
  objectiveCode: string;
  objectiveTitle: string;
  moduleNumber: number;
  subjectName: string | null;
  levelName: string | null;
  evaluationNumber: number;
  title: string;
  evaluationFunction: EvaluationFunction | null;
  effectiveFunction: EvaluationFunction | null;
  heredadoP7: boolean;
  etiqueta: string;
}

async function fetchAdminJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 401 || res.status === 403) {
    throw new Error("FORBIDDEN");
  }
  if (!res.ok) {
    throw new Error(`Error ${res.status} al consultar ${url}`);
  }
  return res.json();
}

export default function EvaluacionesPerfilAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [busquedaPerfil, setBusquedaPerfil] = useState("");
  const [busquedaEval, setBusquedaEval] = useState("");
  const [filtroModulo, setFiltroModulo] = useState<string>("todos");

  const [perfilesEditados, setPerfilesEditados] = useState<Record<string, EvaluationProfile>>({});
  const [funcionesEditadas, setFuncionesEditadas] = useState<Record<string, EvaluationFunction | "">>({});

  const perfilesQuery = useQuery<PerfilRow[]>({
    queryKey: ["/api/admin/evaluation-profiles"],
    queryFn: () => fetchAdminJson<PerfilRow[]>("/api/admin/evaluation-profiles"),
    retry: false,
  });

  const clasificacionQuery = useQuery<ClasificacionRow[]>({
    queryKey: ["/api/admin/evaluations/classification"],
    queryFn: () => fetchAdminJson<ClasificacionRow[]>("/api/admin/evaluations/classification"),
    retry: false,
  });

  useEffect(() => {
    if (!perfilesQuery.data) return;
    const next: Record<string, EvaluationProfile> = {};
    for (const row of perfilesQuery.data) {
      next[row.userId] = row.perfil;
    }
    setPerfilesEditados(next);
  }, [perfilesQuery.data]);

  useEffect(() => {
    if (!clasificacionQuery.data) return;
    const next: Record<string, EvaluationFunction | ""> = {};
    for (const row of clasificacionQuery.data) {
      next[row.id] = row.evaluationFunction ?? "";
    }
    setFuncionesEditadas(next);
  }, [clasificacionQuery.data]);

  const guardarPerfilMutation = useMutation({
    mutationFn: async ({ userId, perfil }: { userId: string; perfil: EvaluationProfile }) => {
      const res = await fetch(`/api/admin/students/${encodeURIComponent(userId)}/evaluation-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ perfil }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "No se pudo guardar el perfil");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/evaluation-profiles"] });
      toast({
        title: "Perfil actualizado",
        description: "El perfil de evaluación se guardó con auditoría administrativa.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const guardarFuncionMutation = useMutation({
    mutationFn: async ({
      evaluationId,
      evaluationFunction,
    }: {
      evaluationId: string;
      evaluationFunction: EvaluationFunction | null;
    }) => {
      const res = await fetch(`/api/admin/evaluations/${encodeURIComponent(evaluationId)}/function`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ evaluationFunction }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "No se pudo actualizar la clasificación");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/evaluations/classification"] });
      toast({
        title: "Clasificación guardada",
        description: "La función de evaluación quedó actualizada.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const perfilesFiltrados = useMemo(() => {
    const q = busquedaPerfil.trim().toLowerCase();
    return (perfilesQuery.data ?? []).filter((r) => {
      if (!q) return true;
      return (
        r.userId.toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        (r.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [perfilesQuery.data, busquedaPerfil]);

  const modulosDisponibles = useMemo(() => {
    const set = new Set<number>();
    for (const r of clasificacionQuery.data ?? []) {
      set.add(r.moduleNumber);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [clasificacionQuery.data]);

  const evaluacionesFiltradas = useMemo(() => {
    const q = busquedaEval.trim().toLowerCase();
    return (clasificacionQuery.data ?? []).filter((r) => {
      if (filtroModulo !== "todos" && String(r.moduleNumber) !== filtroModulo) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.objectiveCode.toLowerCase().includes(q) ||
        r.objectiveTitle.toLowerCase().includes(q) ||
        (r.subjectName ?? "").toLowerCase().includes(q)
      );
    });
  }, [clasificacionQuery.data, busquedaEval, filtroModulo]);

  const errorAcceso =
    (perfilesQuery.isError && (perfilesQuery.error as Error).message === "FORBIDDEN") ||
    (clasificacionQuery.isError && (clasificacionQuery.error as Error).message === "FORBIDDEN");

  if (errorAcceso) {
    return (
      <div className="vx-editorial min-h-screen flex items-center justify-center p-6">
        <Card className="vx-paper max-w-lg w-full border-[#E6E2D8] shadow-none">
          <CardHeader>
            <span className="vx-kicker">Acceso administrativo</span>
            <CardTitle className="vx-serif font-medium flex items-center gap-2 text-[#B84A39] text-2xl mt-1">
              <AlertCircle className="w-5 h-5" />
              Acceso restringido a administración
            </CardTitle>
            <CardDescription className="text-[#5E5D59]">
              Esta vista requiere una sesión activa con rol de administrador (<code className="vx-mono text-xs">role = admin</code>).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/barkley-admin" className="vx-btn-ghost">
              Volver a Administración
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="vx-editorial min-h-screen">
      <header className="vx-topbar">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link href="/barkley-admin" className="vx-pill-nav">
            <ArrowLeft className="w-4 h-4" />
            Volver al Panel Comercial
          </Link>
          <span className="vx-kicker hidden sm:inline">Administración · P7 &amp; O10</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-2">
          <span className="vx-kicker">Configuración evaluativa</span>
          <h1 className="text-3xl sm:text-[2.25rem] leading-[1.15] text-[#141413]">
            Perfiles de Evaluación y Clasificación 0..4
          </h1>
          <p className="text-[#5E5D59] text-[15px] max-w-2xl">
            Gestión administrativa de adaptaciones en Evaluación del módulo (4) y función real de evaluaciones por módulo.
          </p>
        </div>

        <Alert className="rounded-2xl border-[#1F4A3D]/25 bg-[#EDF3F0] text-[#141413]">
          <ShieldCheck className="h-4 w-4 text-[#1F4A3D]" />
          <AlertDescription className="text-[14.5px] leading-relaxed">
            <strong>Regla de privacidad O10:</strong> aquí nunca se guardan diagnósticos ni informes clínicos. El perfil{" "}
            <code className="vx-mono text-xs px-1.5 py-0.5 rounded bg-white/80 border border-[#E6E2D8]">regular</code> o{" "}
            <code className="vx-mono text-xs px-1.5 py-0.5 rounded bg-white/80 border border-[#E6E2D8]">neurodivergente</code> aplica exclusivamente en la Evaluación del módulo (4):{" "}
            120 min, aprobación al 50 % sin redondeo y sin cronómetro visible.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="perfiles" className="space-y-5">
          <TabsList className="inline-flex h-auto bg-[#F3F1EA] border border-[#E6E2D8] p-1 rounded-full gap-1">
            <TabsTrigger
              value="perfiles"
              className="rounded-full px-4 py-2 text-sm text-[#5E5D59] data-[state=active]:bg-white data-[state=active]:text-[#141413] data-[state=active]:shadow-sm"
            >
              <Users className="w-4 h-4 mr-2" />
              Perfiles de estudiantes
            </TabsTrigger>
            <TabsTrigger
              value="clasificacion"
              className="rounded-full px-4 py-2 text-sm text-[#5E5D59] data-[state=active]:bg-white data-[state=active]:text-[#141413] data-[state=active]:shadow-sm"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Clasificación 0..4
            </TabsTrigger>
          </TabsList>

          {/* PESTAÑA 1: PERFILES DE EVALUACIÓN */}
          <TabsContent value="perfiles">
            <Card className="vx-paper border-[#E6E2D8] shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="vx-serif font-medium text-xl">
                  Perfiles de evaluación{" "}
                  <code className="vx-mono text-xs font-normal px-2 py-0.5 rounded-md bg-[#F3F1EA] text-[#5E5D59] align-middle">
                    user_profiles.evaluation_profile
                  </code>
                </CardTitle>
                <CardDescription className="text-[#5E5D59]">
                  Solo editable por administración. Queda registro de quién aplicó el cambio y en qué fecha.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Buscar estudiante por nombre, correo o ID…"
                  value={busquedaPerfil}
                  onChange={(e) => setBusquedaPerfil(e.target.value)}
                  className="max-w-md rounded-xl border-[#D5CFC2] bg-[#FAF9F5]/60 focus-visible:ring-[#1F4A3D]"
                />

                {perfilesQuery.isLoading ? (
                  <div className="flex items-center gap-2 py-8 text-[#5E5D59]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando perfiles…
                  </div>
                ) : perfilesFiltrados.length === 0 ? (
                  <p className="text-sm text-[#87867F] py-4">No se encontraron cuentas con ese filtro.</p>
                ) : (
                  <div className="divide-y divide-[#E6E2D8] rounded-2xl border border-[#E6E2D8] bg-white overflow-hidden">
                    {perfilesFiltrados.map((row) => {
                      const seleccion = perfilesEditados[row.userId] ?? row.perfil;
                      const hayCambios = seleccion !== row.perfil;
                      return (
                        <div
                          key={row.userId}
                          className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-[#FAF9F5]/65 transition-colors"
                        >
                          <div className="space-y-1.5 min-w-[220px]">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-[15px] text-[#141413]">
                                {row.name || row.email || row.userId}
                              </span>
                              <Badge variant="outline" className="border-[#E6E2D8] text-[#5E5D59] rounded-full font-normal">
                                {row.role}
                              </Badge>
                              {row.levelId && (
                                <Badge variant="secondary" className="bg-[#F3F1EA] text-[#5E5D59] rounded-full font-normal">
                                  {row.levelId}
                                </Badge>
                              )}
                              <Badge
                                className={
                                  row.perfil === "neurodivergente"
                                    ? "rounded-full bg-[#FBF0EB] text-[#9A4225] border border-[#C96442]/30 hover:bg-[#FBF0EB]"
                                    : "rounded-full bg-[#F3F1EA] text-[#5E5D59] border border-[#E6E2D8] hover:bg-[#F3F1EA]"
                                }
                              >
                                {row.perfil}
                              </Badge>
                            </div>
                            <p className="text-xs text-[#5E5D59]">
                              <span className="vx-mono">ID: {row.userId}</span> · Correo: {row.email || "sin correo"}
                            </p>
                            <p className="text-xs text-[#87867F]">
                              {row.setBy
                                ? `Último ajuste por ${row.setBy} (${row.setAt ? new Date(row.setAt).toLocaleString("es-CL") : "fecha registrada"})`
                                : "Valor por defecto (sin cambio manual registrado)"}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5">
                            <select
                              aria-label={`Perfil de ${row.name || row.userId}`}
                              value={seleccion}
                              onChange={(e) =>
                                setPerfilesEditados((prev) => ({
                                  ...prev,
                                  [row.userId]: e.target.value as EvaluationProfile,
                                }))
                              }
                              className="h-10 rounded-xl border border-[#D5CFC2] bg-white px-3 text-sm text-[#141413] focus:outline-none focus:border-[#1F4A3D]"
                            >
                              <option value="regular">regular (60 min, 70 %)</option>
                              <option value="neurodivergente">neurodivergente (120 min, 50 %)</option>
                            </select>
                            <Button
                              type="button"
                              size="sm"
                              className="h-10 rounded-full px-4 bg-[#1F4A3D] hover:bg-[#16382E] text-white"
                              disabled={!hayCambios || guardarPerfilMutation.isPending}
                              onClick={() =>
                                guardarPerfilMutation.mutate({ userId: row.userId, perfil: seleccion })
                              }
                            >
                              <Save className="w-4 h-4 mr-1.5" />
                              Guardar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PESTAÑA 2: CLASIFICACIÓN 0..4 */}
          <TabsContent value="clasificacion">
            <Card className="vx-paper border-[#E6E2D8] shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="vx-serif font-medium text-xl">Clasificación funcional de evaluaciones por módulo</CardTitle>
                <CardDescription className="text-[#5E5D59]">
                  0 = Diagnóstico (al abrir el módulo) · 1, 2, 3 = Proceso · 4 = Evaluación del módulo (habilita siguiente módulo).
                  Las filas sin clasificar en módulos heredados mantienen compatibilidad histórica (P7).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Input
                    placeholder="Filtrar por título, OA o asignatura…"
                    value={busquedaEval}
                    onChange={(e) => setBusquedaEval(e.target.value)}
                    className="max-w-sm rounded-xl border-[#D5CFC2] bg-[#FAF9F5]/60 focus-visible:ring-[#1F4A3D]"
                  />
                  <select
                    aria-label="Filtrar por módulo"
                    value={filtroModulo}
                    onChange={(e) => setFiltroModulo(e.target.value)}
                    className="h-10 rounded-xl border border-[#D5CFC2] bg-white px-3 text-sm text-[#141413] focus:outline-none focus:border-[#1F4A3D]"
                  >
                    <option value="todos">Todos los módulos</option>
                    {modulosDisponibles.map((m) => (
                      <option key={m} value={String(m)}>
                        Módulo {m}
                      </option>
                    ))}
                  </select>
                </div>

                {clasificacionQuery.isLoading ? (
                  <div className="flex items-center gap-2 py-8 text-[#5E5D59]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando evaluaciones…
                  </div>
                ) : evaluacionesFiltradas.length === 0 ? (
                  <p className="text-sm text-[#87867F] py-4">No hay evaluaciones registradas con ese filtro.</p>
                ) : (
                  <div className="divide-y divide-[#E6E2D8] rounded-2xl border border-[#E6E2D8] bg-white overflow-hidden">
                    {evaluacionesFiltradas.map((ev) => {
                      const actualValor = ev.evaluationFunction ?? "";
                      const valorEditado = funcionesEditadas[ev.id] ?? actualValor;
                      const hayCambios = valorEditado !== actualValor;
                      return (
                        <div
                          key={ev.id}
                          className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-[#FAF9F5]/65 transition-colors"
                        >
                          <div className="space-y-1.5 min-w-[240px]">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="vx-mono border-[#E6E2D8] text-[#5E5D59] rounded-full font-normal">
                                Módulo {ev.moduleNumber}
                              </Badge>
                              <Badge variant="secondary" className="vx-mono bg-[#F3F1EA] text-[#5E5D59] rounded-full font-normal">
                                #{ev.evaluationNumber}
                              </Badge>
                              <span className="font-medium text-[15px] text-[#141413]">{ev.title}</span>
                            </div>
                            <p className="text-xs text-[#5E5D59]">
                              {ev.levelName ? `${ev.levelName} · ` : ""}
                              {ev.subjectName ? `${ev.subjectName} · ` : ""}
                              {ev.objectiveCode}: {ev.objectiveTitle}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="inline-flex items-center gap-1 font-medium text-[#1F4A3D]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#1F4A3D]" />
                                Efectiva: {ev.etiqueta} ({ev.effectiveFunction ?? "sin definir"})
                              </span>
                              {ev.heredadoP7 && (
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-[#D4942A]/45 text-[#8A5A10] bg-[#FEF6EA]"
                                >
                                  Compatibilidad P7 heredada
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5">
                            <select
                              aria-label={`Función de ${ev.title}`}
                              value={valorEditado}
                              onChange={(e) =>
                                setFuncionesEditadas((prev) => ({
                                  ...prev,
                                  [ev.id]: e.target.value as EvaluationFunction | "",
                                }))
                              }
                              className="h-10 rounded-xl border border-[#D5CFC2] bg-white px-3 text-sm text-[#141413] focus:outline-none focus:border-[#1F4A3D]"
                            >
                              <option value="">Sin clasificar (NULL / heredado P7)</option>
                              <option value="diagnostico">diagnostico (0 · diagnóstico inicial)</option>
                              <option value="proceso">proceso (1..3 · evaluación de proceso)</option>
                              <option value="modulo">modulo (4 · evaluación de cierre)</option>
                            </select>
                            <Button
                              type="button"
                              size="sm"
                              className="h-10 rounded-full px-4 bg-[#1F4A3D] hover:bg-[#16382E] text-white"
                              disabled={!hayCambios || guardarFuncionMutation.isPending}
                              onClick={() =>
                                guardarFuncionMutation.mutate({
                                  evaluationId: ev.id,
                                  evaluationFunction: valorEditado === "" ? null : valorEditado,
                                })
                              }
                            >
                              <Save className="w-4 h-4 mr-1.5" />
                              Guardar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
