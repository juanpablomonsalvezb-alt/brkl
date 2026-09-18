/**
 * Página dedicada a los Electivos Barkley — oferta nueva, separada por ciclo
 * (5° a 8° básico vs. 1° a 4° medio). Ver research_notes/Ramos electivos
 * colegios online/ para el respaldo: ningún colegio online chileno publica
 * electivos nombrados (programación/finanzas/arte), y los referentes
 * internacionales serios (Acellus, K12/Stride) sí los tienen con nombre
 * propio — este es el mismo patrón, adaptado a Chile.
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Code2, Brain, Landmark, Palette, Sparkles, Layers } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

const NAVY = "#003366";
const GOLD = "#FFC548";
const RED = "#FF3D37";
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

const BASICA = [
  {
    Icon: Sparkles,
    titulo: "Creatividad digital",
    texto: "Introducción a herramientas de diseño y edición simples — el primer paso antes de la animación, pensado para que un estudiante de 5° a 8° básico cree algo propio desde la primera clase.",
  },
  {
    Icon: Code2,
    titulo: "Programación creativa",
    texto: "Lógica y pensamiento computacional con bloques, no código de texto — la misma progresión que usan los programas de introducción a la programación más usados en colegios del mundo para esta edad.",
  },
  {
    Icon: Layers,
    titulo: "Animación",
    texto: "De la creatividad digital a contar una historia en movimiento: principios básicos de animación cuadro a cuadro, con herramientas gratuitas pensadas para principiantes.",
  },
];

const MEDIA = [
  {
    Icon: Landmark,
    titulo: "Educación financiera",
    texto: "Presupuesto real, ahorro, deuda y primeras decisiones de inversión — currículum basado en programas de educación financiera gratuitos con más de una década de uso en escuelas de Estados Unidos.",
  },
  {
    Icon: Brain,
    titulo: "Introducción a la IA",
    texto: "Qué es y qué no es la inteligencia artificial, cómo funciona un modelo de lenguaje, y uso responsable — sin necesitar programación previa. Basado en un curso universitario gratuito con más de 2 millones de estudiantes en el mundo.",
  },
  {
    Icon: Sparkles,
    titulo: "Ajedrez",
    texto: "Pensamiento estratégico, planificación y paciencia — el electivo que casi ningún colegio online ofrece, con plataforma de práctica 100% gratuita y abierta.",
  },
  {
    Icon: Palette,
    titulo: "Historia del arte",
    texto: "De lo clásico a lo contemporáneo, con la misma profundidad que un curso universitario — basado en el recurso de historia del arte más visitado del mundo, socio oficial de Khan Academy.",
  },
];

function useDocumentMeta() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Electivos Barkley: Programación, IA, Ajedrez y Más";
    const desc = document.querySelector('meta[name="description"]');
    const prevDesc = desc?.getAttribute("content") ?? null;
    desc?.setAttribute(
      "content",
      "Los electivos de Barkley Online, separados por ciclo: creatividad digital y programación para básica, IA, ajedrez, finanzas e historia del arte para media.",
    );
    const canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute("href") ?? null;
    canonical?.setAttribute("href", "https://www.barkleyinstituto.cl/electivos");
    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) desc?.setAttribute("content", prevDesc);
      if (prevCanonical !== null) canonical?.setAttribute("href", prevCanonical);
    };
  }, []);
}

function Grupo({ titulo, kicker, items }: { titulo: string; kicker: string; items: typeof BASICA }) {
  return (
    <section style={{ padding: "70px 24px", background: kicker === "5° a 8° básico" ? "#f7f9fb" : "#fff" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Reveal>
          <p style={{ fontSize: 13, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>{kicker}</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,36px)", fontWeight: 700, color: NAVY, margin: "0 0 40px", lineHeight: 1.2 }}>{titulo}</h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 24 }}>
          {items.map((it, i) => (
            <Reveal key={it.titulo} delay={i * 0.08}>
              <div style={{ background: "#fff", border: "1px solid #eef1f5", borderRadius: 18, padding: 28, height: "100%", boxShadow: "0 10px 30px rgba(0,20,60,0.05)" }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "#fff8ea", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <it.Icon style={{ width: 22, height: 22, color: "#b5892a" }} strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: 18.5, fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>{it.titulo}</h3>
                <p style={{ fontSize: 14.5, color: TEXT, margin: 0, lineHeight: 1.7 }}>{it.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Electivos() {
  useDocumentMeta();
  return (
    <div style={{ backgroundColor: "#fff", color: TEXT, fontFamily: FONT, fontSize: 16, lineHeight: 1.8, overflowX: "hidden" }}>
      <SiteHeader overlay={false} />

      <section style={{ background: `linear-gradient(180deg, ${NAVY} 0%, #001d3d 100%)`, padding: "60px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Reveal>
            <span style={{ display: "inline-block", background: "rgba(255,197,72,0.15)", color: GOLD, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 18px", borderRadius: 999, marginBottom: 22 }}>
              El currículum es el piso, no el techo
            </span>
            <h1 style={{ fontSize: "clamp(30px,5vw,48px)", fontWeight: 700, color: "#fff", margin: "0 0 18px", lineHeight: 1.15 }}>
              Electivos Barkley
            </h1>
            <p style={{ fontSize: 17, color: "#cfe0f5", margin: 0 }}>
              Además del temario oficial MINEDUC. Distinto según el ciclo, con el mismo formato de video y práctica de siempre.
            </p>
          </Reveal>
        </div>
      </section>

      <Grupo titulo="Creatividad, programación y animación — el primer paso" kicker="5° a 8° básico" items={BASICA} />
      <Grupo titulo="Finanzas, IA, ajedrez e historia del arte — para pensar como adulto" kicker="1° a 4° medio" items={MEDIA} />

      <section style={{ padding: "50px 24px 90px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", background: "#f5f5f5", borderRadius: 20, padding: "32px 34px" }}>
          <Reveal>
            <p style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: RED, margin: "0 0 10px" }}>Sin maquillaje</p>
            <p style={{ fontSize: 15, color: TEXT, margin: 0, lineHeight: 1.75 }}>
              Los electivos son adicionales al temario oficial — no reemplazan ninguna asignatura evaluada en Exámenes Libres ante el MINEDUC. Se ofrecen con el mismo formato de video y práctica del resto de Barkley, sin cobro aparte.
            </p>
          </Reveal>
        </div>
      </section>

      <section style={{ padding: "80px 24px", background: NAVY, textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 800, color: "#fff", margin: "0 0 18px", lineHeight: 1.2 }}>
              El colegio da el piso. Los electivos, el techo.
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
