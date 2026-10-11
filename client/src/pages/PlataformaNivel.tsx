import { useRoute, Link } from "wouter";
import { X } from "lucide-react";

const VISTAS: Record<string, { src: string; alt: string }> = {
  "basica-1-4": { src: "/images/plataforma-basica-1-4.webp", alt: "Plataforma Barkley — Enseñanza Básica, 1° a 4° básico" },
  "basica-5-8": { src: "/images/plataforma-basica-5-8.webp", alt: "Plataforma Barkley — Enseñanza Básica, 5° a 8° básico" },
  "media": { src: "/images/plataforma-media.webp", alt: "Plataforma Barkley — Enseñanza Media, 1° a 4° medio" },
};

export default function PlataformaNivel() {
  const [, params] = useRoute("/plataforma/:nivel");
  const vista = params ? VISTAS[params.nivel] : undefined;
  if (!vista) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "#fbf8f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img src={vista.src} alt={vista.alt} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      <Link href="/" aria-label="Volver al inicio" style={{ position: "fixed", top: 14, right: 14, width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.92)", color: "#152a42", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.18)" }}>
        <X size={20} />
      </Link>
    </div>
  );
}
