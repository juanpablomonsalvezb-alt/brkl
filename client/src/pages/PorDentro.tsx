/**
 * Páginas de detalle de "Conoce Barkley por dentro": una por cada tarjeta del
 * índice PorDentroHub de la home. Mismo contenido que antes estaba en la home,
 * con su propio title/description/canonical (y snapshot prerenderizado para
 * bots, ver script/prerender.ts y api/index.ts).
 */
import { useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import AdultoAcompananteSection from "@/components/AdultoAcompananteSection";
import { EstructuraSection, HerramientasSection, ServiciosSection } from "@/components/PorDentroSecciones";
import { POR_DENTRO } from "@/components/PorDentroHub";

const NAVY = "#003366";
const GOLD = "#FFC548";
const TEXT = "#525252";
const SLATE = "#5b7ba3";
const FONT = "'Poppins', sans-serif";
const BASE = "https://www.barkleyinstituto.cl";

const PAGINAS: Record<string, { titulo: string; descripcion: string; Seccion: React.ComponentType }> = {
  "/adulto-acompanante": {
    titulo: "Adulto Acompañante: cómo se acompaña a un niño en un colegio online | Barkley",
    descripcion: "Cuántas horas diarias acompaña un adulto en casa de 1° básico a 4° medio, qué hace y qué no, y cómo lo hacen K12, Laurel Springs y Wolsey Hall.",
    Seccion: AdultoAcompananteSection,
  },
  "/asi-esta-construido": {
    titulo: "Así está construido Barkley: asignaturas, unidades y lecciones | Barkley",
    descripcion: "El mismo esquema de 1° básico a 4° medio: unidades que se desbloquean con 70%, lecciones con video, pódcast, infografía, guía y evaluación.",
    Seccion: EstructuraSection,
  },
  "/todo-incluido": {
    titulo: "Qué incluye la mensualidad de Barkley: 7 servicios | Barkley",
    descripcion: "Diagnóstico de partida, corrección humana de escritura, orientación vocacional, certificados, Barkley En Vivo, Verano Barkley, electivos y ensayos PAES mensuales.",
    Seccion: ServiciosSection,
  },
  "/herramientas-de-estudio": {
    titulo: "Herramientas de estudio en Barkley: Google Workspace, GeoGebra y más | Barkley",
    descripcion: "Las aplicaciones reales que complementan la plataforma Barkley: Google Workspace, WhatsApp, GeoGebra, Canva y Quizlet.",
    Seccion: HerramientasSection,
  },
};

function useDocumentMeta(ruta: string, titulo: string, descripcion: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = titulo;
    const desc = document.querySelector('meta[name="description"]');
    const prevDesc = desc?.getAttribute("content") ?? null;
    desc?.setAttribute("content", descripcion);
    const canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute("href") ?? null;
    canonical?.setAttribute("href", `${BASE}${ruta}`);
    window.scrollTo(0, 0);
    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) desc?.setAttribute("content", prevDesc);
      if (prevCanonical !== null) canonical?.setAttribute("href", prevCanonical);
    };
  }, [ruta, titulo, descripcion]);
}

export default function PorDentro({ ruta }: { ruta: keyof typeof PAGINAS }) {
  const pagina = PAGINAS[ruta];
  const item = POR_DENTRO.find((p) => p.href === ruta)!;
  const otros = POR_DENTRO.filter((p) => p.href !== ruta);
  useDocumentMeta(ruta, pagina.titulo, pagina.descripcion);
  const { Seccion } = pagina;

  return (
    <div style={{ backgroundColor: "#fff", color: TEXT, fontFamily: FONT, fontSize: 16, lineHeight: 1.8, overflowX: "hidden" }}>
      <SiteHeader overlay={false} />

      <header style={{ background: "#f6f8fb", padding: "40px 24px 44px", borderBottom: "1px solid #eef1f5" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <nav aria-label="Ruta" style={{ fontSize: 13, color: "#8a96a6", marginBottom: 16 }}>
            <a href="/" style={{ color: NAVY, fontWeight: 600, textDecoration: "none" }}>Inicio</a>
            <span style={{ margin: "0 8px" }}>›</span>
            <a href="/#por-dentro" style={{ color: NAVY, fontWeight: 600, textDecoration: "none" }}>Conoce Barkley por dentro</a>
            <span style={{ margin: "0 8px" }}>›</span>
            <span>{item.tab}</span>
          </nav>
          <p style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: SLATE, margin: "0 0 8px" }}>{item.n} · {item.eyebrow}</p>
          <h1 style={{ fontSize: "clamp(30px,4.5vw,46px)", fontWeight: 700, color: NAVY, margin: "0 0 10px", lineHeight: 1.12 }}>{item.tab}</h1>
          <p style={{ fontSize: 17, color: TEXT, margin: 0, maxWidth: 680 }}>{item.resumen}</p>
        </div>
      </header>

      <main>
        <Seccion />
      </main>

      <section aria-labelledby="sigue-explorando" style={{ background: "#fff", padding: "80px 24px", borderTop: "1px solid #eef1f5" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <h2 id="sigue-explorando" style={{ fontSize: "clamp(24px,3vw,32px)", fontWeight: 700, color: NAVY, margin: "0 0 28px" }}>Sigue explorando</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 16 }}>
            {otros.map((o) => (
              <a key={o.href} href={o.href} style={{ display: "flex", flexDirection: "column", gap: 6, textDecoration: "none", border: "1px solid #e6ebf2", borderTop: `3px solid ${o.color}`, borderRadius: 16, padding: "22px 22px 20px", background: "#fff" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: SLATE, letterSpacing: "0.04em" }}>{o.n}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: NAVY }}>{o.tab}</span>
                <span style={{ fontSize: 14, color: TEXT, lineHeight: 1.5 }}>{o.pregunta}</span>
                <span style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: NAVY, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  Leer más <ArrowUpRight style={{ width: 15, height: 15 }} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 24px", background: NAVY, textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 800, color: "#fff", margin: "0 0 14px", lineHeight: 1.2 }}>Admisión 2027 abierta</h2>
          <p style={{ fontSize: 16.5, color: "#cfe0f5", margin: "0 0 28px" }}>Reserva tu cupo sin costo hoy. Pagas recién en enero de 2027.</p>
          <a href="/#inscripcion" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GOLD, color: NAVY, textDecoration: "none", fontWeight: 700, fontSize: 15, borderRadius: 999, padding: "16px 32px" }}>
            Reservar cupo <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
    </div>
  );
}
