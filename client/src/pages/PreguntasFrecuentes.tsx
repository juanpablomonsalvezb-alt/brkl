/**
 * Página dedicada a las preguntas frecuentes — antes vivía como sección
 * inline en Home.tsx (Accordion + useQuery), pesando en el bundle inicial
 * de la home sin aportar nada al LCP. El FAQPage JSON-LD para buscadores/IA
 * queda en Home.tsx (ya lo consumen sin cargar JS); esta página es la
 * versión visual completa, con URL propia indexable.
 */
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SiteHeader } from "@/components/SiteHeader";

const NAVY = "#003366";
const GOLD = "#FFC548";
const RED = "#FF3D37";
const SLATE = "#5b7ba3";
const TEXT = "#525252";
const FONT = "'Poppins', sans-serif";

interface Faq { id: string; question: string; answer: string; sortOrder: number; isActive?: boolean; }

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

function useDocumentMeta() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Preguntas Frecuentes | Barkley Online";
    const desc = document.querySelector('meta[name="description"]');
    const prevDesc = desc?.getAttribute("content") ?? null;
    desc?.setAttribute(
      "content",
      "Todas las preguntas frecuentes sobre Barkley Online: exámenes libres, costos, ritmo de estudio, requisitos y cómo funciona la validación MINEDUC.",
    );
    const canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute("href") ?? null;
    canonical?.setAttribute("href", "https://www.barkleyinstituto.cl/preguntas-frecuentes");
    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) desc?.setAttribute("content", prevDesc);
      if (prevCanonical !== null) canonical?.setAttribute("href", prevCanonical);
    };
  }, []);
}

export default function PreguntasFrecuentes() {
  useDocumentMeta();
  const { data: faqs } = useQuery<Faq[]>({ queryKey: ["/api/faqs"], staleTime: 5 * 60 * 1000 });

  return (
    <div style={{ backgroundColor: "#fff", color: TEXT, fontFamily: FONT, fontSize: 16, lineHeight: 1.8, overflowX: "hidden" }}>
      <SiteHeader overlay={false} />

      <section style={{ background: `linear-gradient(180deg, ${NAVY} 0%, #001d3d 100%)`, padding: "60px 24px 50px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <Reveal>
            <span style={{ display: "inline-block", background: "rgba(255,197,72,0.15)", color: GOLD, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 18px", borderRadius: 999, marginBottom: 22 }}>
              Resolvemos tus dudas
            </span>
            <h1 style={{ fontSize: "clamp(30px,5vw,48px)", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.15 }}>
              Preguntas frecuentes
            </h1>
          </Reveal>
        </div>
      </section>

      <section style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px 80px" }}>
        {faqs && faqs.length > 0 ? (
          <Reveal>
            <Accordion type="single" collapsible>
              {faqs.map((f) => (
                <AccordionItem key={f.id} value={f.id} style={{ borderTop: "1px solid #eef1f5", borderBottom: "none" }}>
                  <AccordionTrigger style={{ fontSize: 16, fontWeight: 600, color: NAVY, padding: "16px 0", textAlign: "left" }} className="hover:no-underline">
                    {f.question}
                  </AccordionTrigger>
                  <AccordionContent style={{ fontSize: 15, opacity: 0.85, paddingBottom: 16 }}>
                    {f.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        ) : (
          <p style={{ textAlign: "center", color: SLATE }}>Cargando preguntas…</p>
        )}
      </section>

      <section style={{ padding: "90px 24px", background: NAVY, textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 800, color: "#fff", margin: "0 0 18px", lineHeight: 1.2 }}>
              ¿Tu pregunta no está acá?
            </h2>
            <p style={{ fontSize: 17, color: "#cfe0f5", margin: "0 0 32px" }}>
              Escríbenos y te respondemos directo.
            </p>
            <a
              href="/#inscripcion"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GOLD, color: NAVY, textDecoration: "none", fontWeight: 700, fontSize: 15, letterSpacing: "0.04em", borderRadius: 999, padding: "18px 36px" }}
            >
              Ir al formulario de inscripción
            </a>
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
