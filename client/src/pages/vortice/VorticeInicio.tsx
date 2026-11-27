import { useEffect } from "react";
import { useLocation } from "wouter";
import { VorticeShell } from "@/components/vortice/VorticeShell";
import { InicioPanoramico } from "./InicioPanoramico";
import { SinSesion } from "./SinSesion";
import { useInicioDatos } from "./useInicioDatos";
import "./vortice.css";

function miniaturaAsignatura(slug: string, name: string, track: string | null | undefined): string | null {
  const norm = `${slug} ${name}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (norm.includes("matemat")) return "matematica";
  if (norm.includes("lengua")) return "lenguaje";
  if (norm.includes("histor") || norm.includes("geograf")) return "historia";
  if (norm.includes("cienc")) return track === "media" ? "ciencias-media" : "ciencias-naturales";
  if (norm.includes("ingl")) return "ingles";
  if (norm.includes("arte")) return "artes";
  if (norm.includes("tecnolog")) return "tecnologia";
  if (norm.includes("filos")) return "filosofia";
  if (norm.includes("ciudad")) return "educacion-ciudadana";
  if (norm.includes("electiv")) return "electivo";
  return null;
}

export default function VorticeInicio() {
  const [location, setLocation] = useLocation();
  const datos = useInicioDatos({ brujula: true, mapa: true });
  const ov = datos.overview.data;
  const nivel = ov?.level;
  const siguiente = ov?.nextStep;
  const aEvaluacion = siguiente?.kind === "evaluation" && ov?.evaluacionE2 === true;
  const linkAsignatura = (slug: string) => (nivel ? `/course/${nivel.id}-${slug}` : "#");
  const linkSiguiente = aEvaluacion
    ? `/vortice/evaluacion/${encodeURIComponent(siguiente!.itemId)}`
    : siguiente ? linkAsignatura(ov!.subjects.find((subject) => subject.levelSubjectId === siguiente.levelSubjectId)?.subjectSlug ?? "") : "#asignaturas";
  const nombre = datos.usuario.data?.firstName || datos.usuario.data?.name?.split(" ")[0] || null;
  const pendientesRepaso = datos.repaso.data?.domains.reduce((total, domain) => total + domain.due, 0) ?? 0;
  const repasosMapa = datos.mapa.data?.disponible ? (datos.mapa.data.retencion?.pendientesCount ?? 0) : 0;
  const repasosTotal = repasosMapa + pendientesRepaso;

  useEffect(() => {
    const ancla = window.location.hash.slice(1);
    const destinos: Record<string, string> = {
      brujula: "/vortice/semana",
      semana: "/vortice/semana",
      portafolio: "/vortice/portafolio",
      apoyo: "/vortice/apoyo",
    };
    const destino = destinos[ancla];
    if (destino) {
      setLocation(destino, { replace: true });
    } else if (ancla === "asignaturas") {
      document.getElementById("asignaturas")?.scrollIntoView();
    }
  }, [location, ov, setLocation, datos.sesion]);

  if (!datos.sesion) return <SinSesion cargando={datos.usuario.isLoading} enPreview={datos.enPreview} />;

  return (
    <VorticeShell variante="estudiante" activo="inicio" nombre={nombre} detalle={nivel?.name ?? "Sin curso asignado"} tramo={ov?.track} salirHref={datos.salir} flotante>
      <InicioPanoramico datos={datos} nombre={nombre} linkSiguiente={linkSiguiente} aEvaluacion={aEvaluacion} repasosTotal={repasosTotal}
        hrefAsignatura={(s) => linkAsignatura(s.subjectSlug)} miniatura={miniaturaAsignatura} />
    </VorticeShell>
  );
}
