import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VorticeOverview } from "@shared/vortice";
import type { BloqueEstudio, BrujulaGoal, PreferenciasBrujula } from "@shared/brujula";
import type { PanelBrujula } from "@shared/brujulaPanel";

interface Usuario { firstName: string | null; name: string | null }
interface Semana { saved: boolean; goals: BrujulaGoal[] }
interface BloquesRes { weekStart: string; preferencias: PreferenciasBrujula; saved: boolean; bloques: BloqueEstudio[] }
interface Repaso { domains: { due: number }[] }
interface MapaResumenInicio {
  disponible: boolean;
  resumen: {
    dominados: number;
    listos: number;
    enPractica: number;
    porReforzar: number;
    porComprobar: number;
  };
  retencion?: { pendientesCount: number };
}
interface Evidencia {
  id: string; kind: "texto" | "enlace" | "evaluacion"; title: string;
  visibility: "privada" | "tutor" | "familia"; createdAt: string; evaluationTitle: string | null;
}

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

export function useInicioDatos({
  brujula = false,
  mapa: cargarMapa = false,
  portafolio: cargarPortafolio = false,
}: { brujula?: boolean; mapa?: boolean; portafolio?: boolean } = {}) {
  const queryClient = useQueryClient();
  const usuario = useQuery({ queryKey: ["/api/auth/user"], queryFn: () => getJson<Usuario>("/api/auth/user"), retry: false });
  const sesion = !!usuario.data;
  const overview = useQuery({ queryKey: ["/api/vortice/overview"], queryFn: () => getJson<VorticeOverview & { evaluacionE2?: boolean }>("/api/vortice/overview"), enabled: sesion });
  const semana = useQuery({ queryKey: ["/api/vortice/brujula/semana"], queryFn: () => getJson<Semana>("/api/vortice/brujula/semana"), enabled: sesion && brujula });
  const panel = useQuery({ queryKey: ["/api/vortice/brujula/panel"], queryFn: () => getJson<PanelBrujula>("/api/vortice/brujula/panel"), enabled: sesion && brujula });
  const preferencias = useQuery({ queryKey: ["/api/vortice/brujula/preferencias"], queryFn: () => getJson<PreferenciasBrujula>("/api/vortice/brujula/preferencias"), enabled: sesion && brujula });
  const bloques = useQuery({ queryKey: ["/api/vortice/brujula/bloques"], queryFn: () => getJson<BloquesRes>("/api/vortice/brujula/bloques"), enabled: sesion && brujula });
  const repaso = useQuery({ queryKey: ["/api/vortice/repaso"], queryFn: () => getJson<Repaso>("/api/vortice/repaso"), enabled: sesion && (brujula || cargarMapa) });
  const mapa = useQuery({ queryKey: ["/api/vortice/conocimiento/mapa"], queryFn: () => getJson<MapaResumenInicio>("/api/vortice/conocimiento/mapa"), enabled: sesion && cargarMapa, retry: false });
  const portafolio = useQuery({ queryKey: ["/api/vortice/portafolio"], queryFn: () => getJson<Evidencia[]>("/api/vortice/portafolio"), enabled: sesion && cargarPortafolio });

  const savePrefsMutation = useMutation({
    mutationFn: async (next: PreferenciasBrujula) => {
      const res = await fetch("/api/vortice/brujula/preferencias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error("Error guardando preferencias");
      return res.json() as Promise<PreferenciasBrujula>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vortice/brujula/preferencias"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vortice/brujula/bloques"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vortice/brujula/semana"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vortice/brujula/panel"] });
    },
  });

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const toggleBloqueMutation = useMutation({
    mutationFn: async ({ blockId, completado }: { blockId: string; completado: boolean }) => {
      setTogglingId(blockId);
      const res = await fetch(`/api/vortice/brujula/bloques/${encodeURIComponent(blockId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ completado }),
      });
      if (!res.ok) throw new Error("Error actualizando bloque");
      return res.json() as Promise<BloquesRes>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/vortice/brujula/bloques"], data);
    },
    onSettled: () => setTogglingId(null),
  });

  const enPreview = typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app");
  const salir = enPreview ? "/api/preview/salir" : "/api/logout";

  return {
    usuario,
    sesion,
    overview,
    semana,
    panel,
    preferencias,
    bloques,
    repaso,
    mapa,
    portafolio,
    savePrefsMutation,
    toggleBloqueMutation,
    togglingId,
    enPreview,
    salir,
  };
}