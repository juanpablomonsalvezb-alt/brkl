/**
 * "Conoce Barkley por dentro" — índice interactivo en la home que reemplaza
 * cuatro secciones largas (Adulto Acompañante, Así está construido, Todo
 * incluido, Herramientas). Cada una vive ahora en su propia página; acá queda
 * el dato que más pesa y un "Leer más", para que nada quede escondido detrás
 * del menú.
 *
 * Escritorio: lista numerada a la izquierda (tabs) + panel navy a la derecha.
 * Móvil: carrusel con scroll-snap nativo (swipe sin librerías) + puntos.
 *
 * Los cuatro paneles están SIEMPRE en el DOM (apilados en la misma celda de
 * grid, solo cambia la opacidad): así el snapshot que reciben Google y las IA
 * contiene el texto de las cuatro pestañas, no solo la activa.
 */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, Circle, Heart, Star, Triangle } from "lucide-react";

const NAVY = "#003366";
const NAVY_DEEP = "#00264d";
const GOLD = "#FFC548";
const TEXT = "#525252";
const SLATE = "#5b7ba3";
const FONT = "'Poppins', sans-serif";

export const POR_DENTRO = [
  {
    href: "/adulto-acompanante",
    n: "01",
    tab: "Adulto Acompañante",
    pregunta: "¿Quién acompaña a mi hijo en casa?",
    eyebrow: "Para 1° a 6° básico",
    titulo: "Un adulto al lado, no un profesor en casa.",
    stat: "4–5 h",
    statLabel: "diarias en 1° básico, que bajan hasta la autonomía completa desde 7° básico",
    resumen: "Así lo hacen los colegios 100% online serios del mundo: contenido autoguiado por dominio y un adulto en casa con un rol claro, cuyas horas bajan con la edad.",
    puntos: ["Acompaña, no enseña ni corrige", "Horas que bajan gradualmente por ciclo", "Asesor humano y Portal Familia siempre activos"],
    Icon: Heart,
    color: "#fe76b4",
  },
  {
    href: "/asi-esta-construido",
    n: "02",
    tab: "Así está construido",
    pregunta: "¿Cómo es una lección por dentro?",
    eyebrow: "Igual de 1° básico a 4° medio",
    titulo: "Asignatura, unidades, lecciones. Siempre el mismo esquema.",
    stat: "70%",
    statLabel: "mínimo en la evaluación para desbloquear la unidad siguiente",
    resumen: "Cada lección trae 2 videos, un pódcast, infografía, guía descargable y evaluación. Si el estudiante se traba, aparece IA Barkley.",
    puntos: ["Unidades en orden, bloqueadas por dominio", "Seis formatos en cada lección", "Libre en el día a día, firme en el calendario"],
    Icon: Triangle,
    color: GOLD,
  },
  {
    href: "/todo-incluido",
    n: "03",
    tab: "Todo incluido",
    pregunta: "¿Qué incluye la mensualidad?",
    eyebrow: "Sin cobros sorpresa",
    titulo: "Un colegio completo, no solo clases grabadas.",
    stat: "7",
    statLabel: "servicios incluidos, más ensayos PAES mensuales en 4° medio",
    resumen: "Diagnóstico de partida, corrección humana de escritura, orientación a educación superior, certificados, Barkley En Vivo, Verano Barkley y electivos.",
    puntos: ["Diagnóstico por asignatura al matricularse", "Ensayos corregidos por un profesor", "Ensayos PAES mensuales en 4° medio"],
    Icon: Star,
    color: "#00b273",
  },
  {
    href: "/herramientas-de-estudio",
    n: "04",
    tab: "Herramientas de estudio",
    pregunta: "¿Qué aprende a usar además?",
    eyebrow: "Ecosistema de estudio",
    titulo: "Herramientas que usará toda la vida.",
    stat: "5",
    statLabel: "aplicaciones reales del mundo del estudio y el trabajo",
    resumen: "Google Workspace, WhatsApp, GeoGebra, Canva y Quizlet complementan la plataforma: lo mismo que usará después en la universidad y en el trabajo.",
    puntos: ["Ensayos entregados en Google Docs", "Matemática interactiva con GeoGebra", "Contacto directo con tutor y asesor por WhatsApp"],
    Icon: Circle,
    color: "#8db4e2",
  },
] as const;

type Item = (typeof POR_DENTRO)[number];

const CSS = `
.pdh-desk { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 40px; align-items: stretch; }
.pdh-mob { display: none; }
.pdh-tab { transition: background .25s ease, color .25s ease; }
.pdh-tab:hover:not([aria-selected="true"]) { background: #f2f5f9; }
.pdh-tab:focus-visible, .pdh-cta:focus-visible, .pdh-dot:focus-visible { outline: 3px solid ${GOLD}; outline-offset: 3px; }
.pdh-cta { transition: transform .2s ease, box-shadow .2s ease; }
.pdh-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(255,197,72,.35); }
.pdh-track { display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding: 0 24px; padding: 4px 24px 8px; margin: 0 -24px; scrollbar-width: none; }
.pdh-track::-webkit-scrollbar { display: none; }
@media (max-width: 899px) {
  .pdh-desk { display: none; }
  .pdh-mob { display: block; }
}
`;

function Panel({ item, compact = false, oculto = false }: { item: Item; compact?: boolean; oculto?: boolean }) {
  const { Icon } = item;
  return (
    <div style={{ position: "relative", height: "100%", background: `linear-gradient(160deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`, borderRadius: compact ? 22 : 28, padding: compact ? "28px 24px 26px" : "clamp(32px,4vw,52px)", color: "#fff", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Forma del lenguaje visual del sitio, gigante y casi transparente */}
      <Icon aria-hidden style={{ position: "absolute", right: compact ? -40 : -60, bottom: compact ? -40 : -70, width: compact ? 180 : 300, height: compact ? 180 : 300, color: item.color, opacity: 0.1 }} fill={item.color} strokeWidth={0} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: item.color, margin: "0 0 12px" }}>
          {item.n} · {item.eyebrow}
        </p>
        <h3 style={{ fontSize: compact ? 22 : "clamp(24px,2.6vw,32px)", fontWeight: 700, lineHeight: 1.18, margin: "0 0 22px", maxWidth: 520 }}>{item.titulo}</h3>

        <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap", paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.14)" }}>
          <span style={{ fontSize: compact ? 48 : "clamp(56px,6.5vw,84px)", fontWeight: 800, lineHeight: 0.95, color: GOLD, letterSpacing: "-0.03em" }}>{item.stat}</span>
          <span style={{ fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,0.75)", maxWidth: 240 }}>{item.statLabel}</span>
        </div>

        {/* En la tarjeta móvil se omite: con dato + 3 puntos basta y la tarjeta no pasa de una pantalla */}
        {!compact && <p style={{ fontSize: 15.5, lineHeight: 1.7, color: "rgba(255,255,255,0.85)", margin: "0 0 18px", maxWidth: 560 }}>{item.resumen}</p>}
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "grid", gap: 9 }}>
          {item.puntos.map((p) => (
            <li key={p} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: 1.5, color: "#fff" }}>
              <span style={{ flexShrink: 0, marginTop: 2, width: 18, height: 18, borderRadius: "50%", background: `${item.color}33`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Check style={{ width: 11, height: 11, color: item.color }} strokeWidth={3} />
              </span>
              {p}
            </li>
          ))}
        </ul>
        <a className="pdh-cta" href={item.href} tabIndex={oculto ? -1 : undefined} style={{ marginTop: "auto", alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, background: GOLD, color: NAVY, textDecoration: "none", fontWeight: 700, fontSize: 15, borderRadius: 999, padding: "13px 24px" }}>
          Leer más <span style={{ fontWeight: 500, opacity: 0.8 }}>· {item.tab}</span> <ArrowUpRight style={{ width: 17, height: 17 }} />
        </a>
      </div>
    </div>
  );
}

export default function PorDentroHub() {
  const [activo, setActivo] = useState(0);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);

  // Flechas ←/→/↑/↓, Inicio y Fin: patrón ARIA de tabs.
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const n = POR_DENTRO.length;
    const destino =
      e.key === "ArrowDown" || e.key === "ArrowRight" ? (i + 1) % n
      : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (i - 1 + n) % n
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : null;
    if (destino === null) return;
    e.preventDefault();
    setActivo(destino);
    tabsRef.current[destino]?.focus();
  };

  // Punto activo del carrusel según qué tarjeta está más centrada.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const cards = Array.from(track.children) as HTMLElement[];
      const centro = track.scrollLeft + track.clientWidth / 2;
      let mejor = 0;
      cards.forEach((c, i) => {
        if (Math.abs(c.offsetLeft + c.offsetWidth / 2 - centro) < Math.abs(cards[mejor].offsetLeft + cards[mejor].offsetWidth / 2 - centro)) mejor = i;
      });
      setSlide(mejor);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  const irASlide = (i: number) => {
    const card = trackRef.current?.children[i] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  return (
    <section id="por-dentro" style={{ background: "#fff", padding: "96px 24px", borderTop: "1px solid #eef1f5", fontFamily: FONT }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -80px 0px" }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 48 }}
        >
          <div style={{ maxWidth: 640 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#FF3D37", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Conoce Barkley por dentro</p>
            <h2 style={{ fontSize: "clamp(30px,4.5vw,48px)", fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.1 }}>
              Lo que un apoderado pregunta <em style={{ fontStyle: "normal", color: "#b5892a" }}>antes de inscribir</em>.
            </h2>
          </div>
          <p style={{ fontSize: 15, color: TEXT, maxWidth: 320, margin: 0, lineHeight: 1.7 }}>
            Cuatro respuestas cortas. Si quieres el detalle completo, cada una tiene su propia página.
          </p>
        </motion.div>

        {/* === Escritorio: índice + panel === */}
        <div className="pdh-desk">
          <div role="tablist" aria-label="Conoce Barkley por dentro" aria-orientation="vertical" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {POR_DENTRO.map((it, i) => {
              const sel = i === activo;
              return (
                <button
                  key={it.n}
                  ref={(el) => { tabsRef.current[i] = el; }}
                  role="tab"
                  id={`pdh-tab-${i}`}
                  aria-selected={sel}
                  aria-controls={`pdh-panel-${i}`}
                  tabIndex={sel ? 0 : -1}
                  className="pdh-tab"
                  onClick={() => setActivo(i)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  style={{ position: "relative", display: "flex", alignItems: "center", gap: 20, textAlign: "left", width: "100%", border: "none", cursor: "pointer", borderRadius: 18, padding: "22px 24px", background: sel ? "#f2f5f9" : "transparent", fontFamily: FONT, flex: 1 }}
                >
                  {sel && (
                    <motion.span layoutId="pdh-barra" transition={{ type: "spring", stiffness: 420, damping: 36 }}
                      style={{ position: "absolute", left: 0, top: 16, bottom: 16, width: 4, borderRadius: 4, background: it.color }} />
                  )}
                  <span style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em", color: sel ? NAVY : "transparent", WebkitTextStroke: sel ? "0" : `1.5px ${SLATE}66`, transition: "color .25s ease", minWidth: 58 }}>
                    {it.n}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: sel ? NAVY : "#3d4a5c" }}>{it.tab}</span>
                    <span style={{ fontSize: 14, color: sel ? SLATE : "#8a96a6" }}>{it.pregunta}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "grid" }}>
            {POR_DENTRO.map((it, i) => {
              const sel = i === activo;
              return (
                <div
                  key={it.n}
                  role="tabpanel"
                  id={`pdh-panel-${i}`}
                  aria-labelledby={`pdh-tab-${i}`}
                  aria-hidden={!sel}
                  style={{ gridArea: "1 / 1", opacity: sel ? 1 : 0, transform: sel ? "translateY(0)" : "translateY(10px)", transition: "opacity .4s ease, transform .4s cubic-bezier(.22,1,.36,1)", pointerEvents: sel ? "auto" : "none", zIndex: sel ? 1 : 0 }}
                >
                  <Panel item={it} oculto={!sel} />
                </div>
              );
            })}
          </div>
        </div>

        {/* === Móvil: carrusel con swipe nativo === */}
        <div className="pdh-mob">
          <div ref={trackRef} className="pdh-track" role="region" aria-roledescription="carrusel" aria-label="Conoce Barkley por dentro">
            {POR_DENTRO.map((it, i) => (
              <div key={it.n} role="group" aria-roledescription="tarjeta" aria-label={`${i + 1} de ${POR_DENTRO.length}: ${it.tab}`}
                style={{ flex: "0 0 86%", scrollSnapAlign: "center" }}>
                <Panel item={it} compact />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 18 }}>
            {POR_DENTRO.map((it, i) => (
              <button key={it.n} className="pdh-dot" aria-label={`Ir a ${it.tab}`} aria-current={i === slide}
                onClick={() => irASlide(i)}
                style={{ width: i === slide ? 26 : 8, height: 8, borderRadius: 999, border: "none", padding: 0, cursor: "pointer", background: i === slide ? NAVY : "#cfd8e3", transition: "width .3s ease, background .3s ease" }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
