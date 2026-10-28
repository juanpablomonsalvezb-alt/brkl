/**
 * /asi-trabajamos — la metodología de Barkley en cinco infografías.
 * Pieza central: "Así trabajamos en Barkley" (el proceso completo).
 * Debajo, la misma experiencia vista a escala de día, mes, semestre y año.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Maximize2, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

const NAVY = "#003366";
const BLUE = "#1f6bff";
const RED = "#FF3D37";
const GOLD = "#FFC548";
const TEXT = "#525252";
const FONT = "'Poppins', sans-serif";

const CENTRAL = {
  src: "/metodologia/asi-trabajamos.png",
  alt: "Infografía: así trabajamos en Barkley, en cinco pasos — conocemos al estudiante, ruta clara en Vórtice, aprende y demuestra, apoyo cuando lo necesita y portal para la familia.",
};

const ESCALAS = [
  { id: "dia", label: "Un día", lema: "Tu ritmo. Tu camino. Siempre acompañado.", src: "/metodologia/dia.png", alt: "Infografía: un día de aprendizaje en Barkley, de 08:00 a 10:30." },
  { id: "mes", label: "Un mes", lema: "El progreso se ve semana a semana.", src: "/metodologia/mes.png", alt: "Infografía: un mes de progreso en Barkley." },
  { id: "semestre", label: "Un semestre", lema: "Una ruta con hitos claros y apoyo constante.", src: "/metodologia/semestre.png", alt: "Infografía: un semestre en Barkley, ruta de aprendizaje con cinco hitos." },
  { id: "ano", label: "Un año", lema: "Un año completo, paso a paso, hacia sus metas.", src: "/metodologia/ano.png", alt: "Infografía: un año de aprendizaje en Barkley." },
] as const;

const SELLOS = ["100% asincrónico", "Acompañamiento real", "Progreso visible", "Pensado en cada estudiante"];

function useDocumentMeta() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Así trabajamos en Barkley — Un proceso claro, flexible y acompañado";
    const desc = document.querySelector('meta[name="description"]');
    const prevDesc = desc?.getAttribute("content") ?? null;
    desc?.setAttribute("content", "Cómo es aprender en Barkley: diagnóstico inicial, ruta clara en Vórtice, tutor IA y humano, y portal para la familia. Mira un día, un mes, un semestre y un año.");
    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) desc?.setAttribute("content", prevDesc);
    };
  }, []);
}

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,20,45,0.92)", overflowY: "auto", padding: "24px 16px", display: "flex", justifyContent: "center", cursor: "zoom-out" }}
    >
      <button
        onClick={onClose}
        aria-label="Cerrar"
        style={{ position: "fixed", top: 16, right: 16, width: 44, height: 44, borderRadius: 999, border: "none", background: "#fff", cursor: "pointer", display: "grid", placeItems: "center", zIndex: 1 }}
      >
        <X size={20} color={NAVY} />
      </button>
      <img src={src} alt={alt} style={{ width: "min(1100px, 100%)", height: "auto", alignSelf: "flex-start", borderRadius: 16 }} />
    </motion.div>
  );
}

export default function AsiTrabajamos() {
  useDocumentMeta();
  const [escala, setEscala] = useState<(typeof ESCALAS)[number]["id"]>("dia");
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
  const actual = ESCALAS.find((e) => e.id === escala) ?? ESCALAS[0];

  return (
    <div style={{ fontFamily: FONT, background: "#f6f9ff", color: TEXT, minHeight: "100vh" }}>
      <SiteHeader overlay={false} />
      <style>{`
        .at-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,460px);gap:56px;align-items:center}
        .at-tabs{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
        .at-tab{font-family:inherit;border:1.5px solid ${NAVY}22;background:#fff;color:${NAVY};padding:12px 22px;border-radius:999px;font-weight:600;font-size:15px;cursor:pointer;transition:background .2s,color .2s,transform .2s}
        .at-tab:hover{transform:translateY(-2px)}
        .at-tab:focus-visible,.at-zoom:focus-visible{outline:3px solid ${GOLD};outline-offset:3px}
        .at-tab[aria-selected="true"]{background:${NAVY};color:#fff;border-color:${NAVY}}
        .at-frame{position:relative;border-radius:28px;background:#fff;padding:12px;box-shadow:0 40px 90px -20px rgba(0,51,102,.35),0 0 0 1px rgba(0,51,102,.06)}
        .at-zoom{position:absolute;right:24px;bottom:24px;display:flex;gap:8px;align-items:center;border:none;border-radius:999px;background:${NAVY};color:#fff;padding:10px 16px;font:600 13px ${FONT};cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25)}
        @media (max-width:900px){.at-hero{grid-template-columns:1fr;gap:36px}.at-hero-copy{text-align:center}.at-hero-copy .at-sellos{justify-content:center}}
        @media (prefers-reduced-motion:reduce){.at-tab{transition:none}}
      `}</style>

      {/* HERO: texto + infografía central */}
      <section style={{ padding: "56px 20px 24px", background: "linear-gradient(180deg,#eaf2ff 0%,#f6f9ff 100%)", overflow: "hidden" }}>
        <div className="at-hero" style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div className="at-hero-copy">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontSize: "clamp(40px,6.4vw,76px)", lineHeight: 1.02, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: "-0.03em", textWrap: "balance" as never }}
            >
              Así trabajamos en <span style={{ color: BLUE }}>Barkley</span>
            </motion.h1>
            <p style={{ fontSize: "clamp(17px,2vw,21px)", lineHeight: 1.6, margin: "24px 0 28px", maxWidth: 520 }}>
              Un proceso claro, flexible y acompañado para que tu hijo aprenda y avance. Sin clases en vivo, sin quedarse solo y con su avance a la vista de la familia.
            </p>
            <div className="at-sellos" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SELLOS.map((s) => (
                <span key={s} style={{ background: "#fff", border: `1px solid ${NAVY}1f`, borderRadius: 999, padding: "8px 16px", fontSize: 14, fontWeight: 600, color: NAVY }}>
                  {s}
                </span>
              ))}
            </div>
            <a
              href="#escalas"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 32, color: NAVY, fontWeight: 700, textDecoration: "none", borderBottom: `2px solid ${GOLD}`, paddingBottom: 4 }}
            >
              Míralo en un día, un mes, un semestre o un año <ArrowUpRight size={18} />
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="at-frame"
          >
            <img src={CENTRAL.src} alt={CENTRAL.alt} width={1024} height={1536} style={{ width: "100%", height: "auto", display: "block", borderRadius: 18 }} />
            <button className="at-zoom" onClick={() => setZoom(CENTRAL)} aria-label="Ampliar la infografía Así trabajamos en Barkley">
              <Maximize2 size={15} /> Ampliar
            </button>
          </motion.div>
        </div>
      </section>

      {/* ESCALAS */}
      <section id="escalas" style={{ padding: "88px 20px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px,4.2vw,46px)", fontWeight: 800, color: NAVY, margin: 0, letterSpacing: "-0.02em", textWrap: "balance" as never }}>
            El mismo acompañamiento, a cualquier escala
          </h2>
          <p style={{ fontSize: 18, margin: "16px auto 36px", maxWidth: 620, lineHeight: 1.6 }}>{actual.lema}</p>

          <div role="tablist" aria-label="Escala de tiempo" className="at-tabs">
            {ESCALAS.map((e) => (
              <button key={e.id} role="tab" aria-selected={escala === e.id} className="at-tab" onClick={() => setEscala(e.id)}>
                {e.label}
              </button>
            ))}
          </div>

          <div className="at-frame" style={{ marginTop: 40, textAlign: "left" }}>
            <AnimatePresence mode="wait">
              <motion.img
                key={actual.id}
                src={actual.src}
                alt={actual.alt}
                width={1222}
                height={1287}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ width: "100%", height: "auto", display: "block", borderRadius: 18 }}
              />
            </AnimatePresence>
            <button className="at-zoom" onClick={() => setZoom(actual)} aria-label={`Ampliar la infografía de ${actual.label.toLowerCase()}`}>
              <Maximize2 size={15} /> Ampliar
            </button>
          </div>
        </div>
      </section>

      {/* CIERRE */}
      <section style={{ padding: "64px 20px 96px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", background: NAVY, color: "#fff", borderRadius: 28, padding: "clamp(32px,6vw,64px)", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 800, margin: 0, letterSpacing: "-0.02em", textWrap: "balance" as never }}>
            Un mismo objetivo: que tu hijo aprenda, avance y desarrolle todo su potencial.
          </h2>
          <a
            href="/planes-2026"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 32, background: RED, color: "#fff", fontWeight: 700, padding: "16px 32px", borderRadius: 999, textDecoration: "none" }}
          >
            Conocer los planes <ArrowUpRight size={18} />
          </a>
        </div>
      </section>

      <AnimatePresence>{zoom && <Lightbox src={zoom.src} alt={zoom.alt} onClose={() => setZoom(null)} />}</AnimatePresence>
    </div>
  );
}
