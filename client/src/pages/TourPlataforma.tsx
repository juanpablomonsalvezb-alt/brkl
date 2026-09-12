/**
 * Página dedicada al tour de la plataforma — antes era un modal (TourModal)
 * montado eager en Home.tsx, cargando sus 4 imágenes y estado siempre, aunque
 * casi nadie lo abriera. Sacado como ruta propia + lazy() en App.tsx: no pesa
 * nada en el bundle inicial de la home (que define el LCP), y de paso gana
 * una URL indexable propia en vez de vivir solo detrás de un clic.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

const NAVY = "#003366";
const RED = "#FF3D37";
const GOLD = "#FFC548";
const TEXT = "#525252";
const FONT = "'Poppins', sans-serif";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const TOUR_SLIDES = [
  {
    img: "/images/tour/01-dashboard.webp",
    title: "Tu escritorio: siempre sabes qué sigue",
    text: "Al entrar, el estudiante ve exactamente dónde quedó y qué lección viene. Su avance real, sus asignaturas y el acceso directo a su asesor — todo en un solo lugar, sin perderse.",
  },
  {
    img: "/images/tour/02-curso.webp",
    title: "Avanzas por dominio, no por tiempo",
    text: "Cada unidad se desbloquea solo cuando dominas la anterior. Sin saltos, sin huecos: es Mastery Learning, el modelo de Benjamin Bloom (Harvard). El contenido sigue el temario oficial MINEDUC, objetivo por objetivo.",
  },
  {
    img: "/images/tour/03-leccion.webp",
    title: "Cada lección tiene su propio video",
    text: "Video breve y claro por cada objetivo de aprendizaje. Se pausa, se repite, se ve cuando el día lo permite. Aprendes a tu ritmo real, sin clases en vivo ni horarios que cumplir.",
  },
  {
    img: "/images/tour/04-podcast.webp",
    title: "¿Prefieres escuchar? También hay pódcasts",
    text: "Cada lección incluye además 2 a 3 audios tipo pódcast. Para aprender caminando, en el transporte, o si leer te cuesta. Inclusión de verdad — pensado también para TDAH y dislexia (programa Adaptativo).",
  },
];

function useDocumentMeta() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Tour de la Plataforma: Así Es Barkley por Dentro";
    const desc = document.querySelector('meta[name="description"]');
    const prevDesc = desc?.getAttribute("content") ?? null;
    desc?.setAttribute(
      "content",
      "Recorre la plataforma real de Barkley paso a paso: el escritorio del estudiante, el avance por dominio, cada lección con video y pódcast.",
    );
    const canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute("href") ?? null;
    canonical?.setAttribute("href", "https://www.barkleyinstituto.cl/tour-plataforma");
    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) desc?.setAttribute("content", prevDesc);
      if (prevCanonical !== null) canonical?.setAttribute("href", prevCanonical);
    };
  }, []);
}

export default function TourPlataforma() {
  useDocumentMeta();
  return (
    <div style={{ backgroundColor: "#fff", color: TEXT, fontFamily: FONT, fontSize: 16, lineHeight: 1.8, overflowX: "hidden" }}>
      <SiteHeader overlay={false} />

      <section style={{ background: `linear-gradient(180deg, ${NAVY} 0%, #001d3d 100%)`, padding: "60px 24px 50px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <Reveal>
            <span style={{ display: "inline-block", background: "rgba(255,197,72,0.15)", color: GOLD, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 18px", borderRadius: 999, marginBottom: 22 }}>
              Plataforma real
            </span>
            <h1 style={{ fontSize: "clamp(30px,5vw,48px)", fontWeight: 700, color: "#fff", margin: "0 0 16px", lineHeight: 1.15 }}>
              Así es Barkley por dentro
            </h1>
            <p style={{ fontSize: 17, color: "#cfe0f5", margin: 0 }}>
              Cuatro pasos reales, tal como los ve el estudiante desde el primer día.
            </p>
          </Reveal>
        </div>
      </section>

      {TOUR_SLIDES.map((slide, i) => (
        <section key={slide.title} style={{ padding: "70px 24px", background: i % 2 === 0 ? "#fff" : "#f7f9fb" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 44, alignItems: "center", flexDirection: i % 2 === 0 ? "row" : "row-reverse" }}>
            <div style={{ flex: "1 1 380px", minWidth: 280 }}>
              <Reveal>
                <span style={{ display: "inline-block", background: GOLD, color: NAVY, fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "5px 14px", marginBottom: 16 }}>
                  Paso {i + 1} de {TOUR_SLIDES.length}
                </span>
                <h2 style={{ fontSize: "clamp(22px,3.2vw,30px)", fontWeight: 700, color: NAVY, margin: "0 0 14px", lineHeight: 1.25 }}>{slide.title}</h2>
                <p style={{ fontSize: 16.5, color: TEXT, margin: 0 }}>{slide.text}</p>
              </Reveal>
            </div>
            <div style={{ flex: "1 1 380px", minWidth: 280 }}>
              <Reveal delay={0.1}>
                <img src={slide.img} alt={slide.title} loading="lazy" style={{ width: "100%", borderRadius: 16, display: "block", aspectRatio: "1280 / 820", objectFit: "cover", boxShadow: "0 20px 50px rgba(0,20,60,0.12)" }} />
              </Reveal>
            </div>
          </div>
        </section>
      ))}

      <section style={{ padding: "90px 24px", background: NAVY, textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(28px,4.5vw,44px)", fontWeight: 800, color: "#fff", margin: "0 0 18px", lineHeight: 1.2 }}>
              ¿Listo para verlo funcionando de verdad?
            </h2>
            <p style={{ fontSize: 17, color: "#cfe0f5", margin: "0 0 32px" }}>
              Reserva tu cupo — sin costo hoy, pagas recién en enero de 2027.
            </p>
            <motion.a
              href="/#inscripcion"
              whileHover={{ scale: 1.05 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GOLD, color: NAVY, textDecoration: "none", fontWeight: 700, fontSize: 15, letterSpacing: "0.04em", borderRadius: 999, padding: "18px 36px" }}
            >
              Quiero inscribirme <ArrowUpRight size={18} />
            </motion.a>
          </Reveal>
        </div>
      </section>

      <footer style={{ background: NAVY, color: "rgba(255,255,255,0.75)", fontSize: 13, textAlign: "center", padding: "26px 24px" }}>
        <p style={{ margin: 0 }}>
          Barkley Online — Colegio 100% asincrónico e inclusivo en Chile ·{" "}
          <a href="/" style={{ color: GOLD, textDecoration: "none" }}>barkleyinstituto.cl</a>
        </p>
      </footer>
    </div>
  );
}
