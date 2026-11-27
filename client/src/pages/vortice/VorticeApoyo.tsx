import { MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { VorticeShell } from "@/components/vortice/VorticeShell";
import { AyudaTutor } from "./AyudaTutor";
import { RobotTutor } from "./RobotTutor";
import { SinSesion } from "./SinSesion";
import { useInicioDatos } from "./useInicioDatos";
import "./vortice.css";

export default function VorticeApoyo() {
  const datos = useInicioDatos();
  if (!datos.sesion) return <SinSesion cargando={datos.usuario.isLoading} enPreview={datos.enPreview} />;

  const nombre = datos.usuario.data?.firstName || datos.usuario.data?.name?.split(" ")[0] || null;
  const ov = datos.overview.data;
  const nivel = ov?.level;

  return (
    <VorticeShell variante="estudiante" activo="apoyo" nombre={nombre} detalle={nivel?.name ?? "Sin curso asignado"} tramo={ov?.track} salirHref={datos.salir}>
      <div className="vx-pagina">
        <h1 className="vx-titulo">Apoyo</h1>
        <section className="vx-card" aria-labelledby="vx-ayuda-tutor-titulo">
          <header><h2 id="vx-ayuda-tutor-titulo">Pregúntale a tu tutor</h2></header>
          <AyudaTutor asignaturas={ov?.subjects ?? []} />
        </section>
        <section className="vx-card" aria-labelledby="vx-tutor-virtual-titulo">
          <header><h2 id="vx-tutor-virtual-titulo">Tutor virtual</h2></header>
          <div className="vx-help-compact">
            <RobotTutor className="vx-help-robot-sm" />
            <p>Te explico con otras palabras o te doy pistas paso a paso.</p>
            <Link href="/academic-copilot"><MessageCircle aria-hidden="true" />Tutor virtual</Link>
          </div>
        </section>
        <Link className="vx-link" href="/together">Together</Link>
      </div>
    </VorticeShell>
  );
}