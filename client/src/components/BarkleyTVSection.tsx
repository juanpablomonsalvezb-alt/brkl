import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

// Extraído de Home.tsx para code-splitting: este componente (más el arreglo
// de 57 videos) no aporta nada al LCP — está debajo del hero — pero sumaba
// peso al bundle inicial que sí bloquea el primer pintado. Cargado vía
// React.lazy() desde Home.tsx, queda en su propio chunk descargado después.
const NAVY = "#003366";
const GOLD = "#FFC548";

function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

const BARKLEY_TV_VIDEOS = [
  { id: "SxwA62_4Pjg", title: "Cómo el Portal Familia Mide el Avance" },
  { id: "MTUOhlcNSsc", title: "Cómo funciona el Aprendizaje por Dominio" },
  { id: "n_TKmtgbq3o", title: "Barkley — el colegio online que se adapta a ti" },
  { id: "203Gb9e1QDU", title: "Por Qué un Algoritmo No Puede Evaluar Tu Escritura" },
  { id: "TFFw-RQjF9c", title: "Barkley — el colegio online que se adapta a ti" },
  { id: "ADGbDql7yYc", title: "Por Qué el Colegio Causa Ansiedad" },
  { id: "9SCe3u3F7II", title: "Lleva tu espacio de aprendizaje contigo" },
  { id: "3P8hpSXmATY", title: "Cómo Barkley Crea Comunidad Digital" },
  { id: "P7mCpI0uuyg", title: "Tu tiempo, tu forma de aprender" },
  { id: "3uBjSabr9us", title: "Aprender a tu propio ritmo" },
  { id: "Is4Q79mzrFM", title: "Barkley — el colegio online que se adapta a ti" },
  { id: "qzuxVhVSd1w", title: "Tu ritmo cambia" },
  { id: "MmD-L_09bZ0", title: "Hay niños y jóvenes que ya no quieren ir al colegio" },
  { id: "AFBsYSeANZg", title: "Cuando el aprendizaje cobra vida" },
  { id: "RfOgaloyfSw", title: "Cómo funciona la orientación vocacional online" },
  { id: "hqjtj3B3suE", title: "Barkley — el colegio online que se adapta a ti" },
  { id: "OYAflFYfong", title: "Barkley — el colegio online que se adapta a ti" },
  { id: "-n6z6AEuvGc", title: "Cómo Funciona un Tutor Asignado" },
  { id: "eWLtxpdB3Pc", title: "Barkley — el colegio online que se adapta a ti" },
  { id: "HTPDGkHf3Mk", title: "Barkley — el colegio online que se adapta a ti" },
  { id: "qMoVgdxe3oU", title: "Barkley — el colegio online que se adapta a ti" },
  { id: "nfRNVcJyIZg", title: "Barkley — el colegio online que se adapta a ti" },
  { id: "8H_TQB309X4", title: "Por Qué Tu Barkley — el colegio online que se adapta a ti" },
  { id: "GT0xJVWNJMw", title: "Por Qué Huyen del Colegio" },
  { id: "z5cGm-3VVG0", title: "Cómo el Colegio Online Frena el Bullying" },
  { id: "VdfERJ-eA1g", title: "En BARKLEY, creemos que cada estudiante tiene su propio ritmo, sus ..." },
  { id: "tDSMmqk_m3U", title: "Tu futuro sigue avanzando, incluso en los momentos de quietud" },
  { id: "utkN_FousmE", title: "Avanzar es dominar" },
  { id: "DROeJg4PtQE", title: "¿Ya hablaste con el colegio y nada cambió? Conoce una nueva alterna..." },
  { id: "8yva1N33eKo", title: "Educación para la autonomía: aprende a tu ritmo y construye tu futuro" },
  { id: "WJPiW52VBlo", title: "Por Qué el Aula Complica el TDAH" },
  { id: "3d0lebSURHw", title: "Tu hijo no fracasó: necesita una educación adaptada a su ritmo" },
  { id: "4CNvkp72kCQ", title: "Inclusión educativa: un lugar para que todos puedan aprender" },
  { id: "BQVCCh29py0", title: "Cómo Validar el Temario Oficial del MINEDUC" },
  { id: "rxSbDQtheD8", title: "Estudia a tu ritmo: educación en línea sin horarios ni clases oblig..." },
  { id: "gHenAFEzyw8", title: "Pausa, retoma y repasa: aprende con mayor libertad" },
  { id: "0-zzHQm-OKA", title: "Barkley vs Enseñanza Tradicional" },
  { id: "0FluOs2d630", title: "Umbral™ El Motor que Exige Entender para Avanzar" },
  { id: "-y602-Q873o", title: "Barkley — el colegio online que se adapta a ti" },
  { id: "vT4he6V59hU", title: "Cómo Funciona una Lección en Barkley" },
  { id: "iMV_zJ6OzsI", title: "Estudia cuando tú puedas: la flexibilidad que tu familia necesita" },
  { id: "LFNbO1vu4D8", title: "Por Qué el Ritmo Fijo Frena a las Altas Capacidades" },
  { id: "h9PYF9BhxeQ", title: "Cómo Funciona el Programa Adaptativo" },
  { id: "51ahUCtISpg", title: "Barkley" },
  { id: "FDW1wuKEEvA", title: "Barkley Online El Modelo" },
  { id: "I4NrQEEumpo", title: "Una educación que se adapta a tu ritmo y a tu forma de aprender" },
  { id: "KkS-pI8FuJQ", title: "La educación debe darte las herramientas para aprender, tomar decis..." },
  { id: "zTCVQS8nKwE", title: "Admisión 2027: estudia 100% online y a tu propio ritmo" },
  { id: "wtljV6t5UA4", title: "Entorno Adaptativo para Reducir la Presión en Dislexia" },
  { id: "m_mrIOgDrw4", title: "Cómo Funciona la Autogestión Escolar" },
  { id: "wmvGza-f_Tw", title: "En un ambiente hogareño, cálido y tranquilo, un estudiante explora ..." },
  { id: "WJtDu2JglVA", title: "Seguridad y tranquilidad en el mundo digital: acompaña a tu hijo" },
  { id: "N3feKr0RNR4", title: "Deconstruyendo a Barkley" },
  { id: "9ZfzV9ToeBU", title: "Por qué el error enseña" },
  { id: "wN3Uk663ijA", title: "Quién Acompaña en Barkley" },
  { id: "bKRA5kNfw7g", title: "Validando Estudios y PAES" },
  { id: "FcyxblFK3jk", title: "La educación no necesita un plan perfecto, sino un corazón presente" },
];

export default function BarkleyTVSection() {
  const [activeId, setActiveId] = useState(BARKLEY_TV_VIDEOS[0].id);
  const activeTitle = BARKLEY_TV_VIDEOS.find((v) => v.id === activeId)?.title ?? "";
  const listRef = useRef<HTMLDivElement>(null);
  const scrollListDown = () => {
    listRef.current?.scrollBy({ top: 240, behavior: "smooth" });
  };
  // Alto exacto del marco de video (ancho 9:16) para que la lista calce con él,
  // en vez de un maxHeight fijo que no seguía el tamaño real del reproductor.
  const PLAYER_HEIGHT = "calc(min(340px, 88vw) * 16 / 9)";

  return (
    <section id="barkley-tv" style={{ background: "#0a0e14", padding: "72px 24px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>Barkley TV</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 600, color: "#fff", margin: "0 0 14px" }}>Todo sobre Barkley, sin pausa.</h2>
          <p style={{ fontSize: 15.5, color: "rgba(255,255,255,0.7)", maxWidth: 560, margin: "0 auto 32px" }}>
            Umbral™, Brújula™, el Programa Adaptativo y más. Elige un video de la lista o déjalo corriendo solo.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div style={{ display: "flex", gap: 28, justifyContent: "center", alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Marco tipo teléfono — el contenido es 100% vertical (Shorts), un
                iframe horizontal genérico dejaba franjas negras enormes. */}
            <div style={{ position: "relative", width: "min(340px, 88vw)", flexShrink: 0 }}>
              <div style={{
                position: "absolute", inset: "-14px",
                borderRadius: 44,
                background: "linear-gradient(155deg, #0e1a2e, #060a12)",
                boxShadow: `0 0 0 1px rgba(255,197,72,0.25), 0 30px 70px rgba(0,0,0,0.6)`,
              }} />
              <div style={{
                position: "relative", width: "100%", aspectRatio: "9 / 16",
                borderRadius: 32, overflow: "hidden",
                border: `2px solid rgba(255,197,72,0.4)`,
                background: "#000",
              }}>
                <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 60, height: 5, borderRadius: 999, background: "rgba(255,255,255,0.25)", zIndex: 2 }} />
                <iframe
                  key={activeId}
                  src={`https://www.youtube-nocookie.com/embed/${activeId}?autoplay=1&mute=1&loop=1&playlist=${activeId}&playsinline=1&modestbranding=1&rel=0&cc_load_policy=0`}
                  title={activeTitle || "Barkley TV"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                />
              </div>
            </div>

            {/* Lista de reproducción — mismo alto que el marco de video */}
            <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 360, height: PLAYER_HEIGHT }}>
              <div
                ref={listRef}
                style={{ height: "100%", textAlign: "left", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "8px", overflowY: "auto" }}
              >
                {BARKLEY_TV_VIDEOS.map((v) => {
                  const active = v.id === activeId;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setActiveId(v.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                        background: active ? "rgba(255,197,72,0.14)" : "transparent",
                        border: "none", borderRadius: 10, padding: "10px 12px", marginBottom: 2,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: "50%", background: active ? GOLD : "rgba(255,255,255,0.25)" }} />
                      <span style={{ fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? GOLD : "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>{v.title}</span>
                    </button>
                  );
                })}
              </div>
              {/* Botón para bajar — 57 videos no caben visualmente, hace explícito que hay más */}
              <button
                aria-label="Ver más videos"
                onClick={scrollListDown}
                style={{
                  position: "absolute", bottom: 8, right: 8, width: 34, height: 34, borderRadius: "50%",
                  background: NAVY, border: `1px solid ${GOLD}`, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
                }}
              >
                <ArrowDown style={{ width: 16, height: 16, color: GOLD }} />
              </button>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, borderRadius: "0 0 16px 16px", background: "linear-gradient(to top, #0a0e14, rgba(10,14,20,0))", pointerEvents: "none" }} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
