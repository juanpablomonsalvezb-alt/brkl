/**
 * Clone 1:1 de unthink.ie — valores reales extraídos con getComputedStyle:
 * - Nav: 4 links fixed en esquinas (top/bottom 30px, left/right 30px, 35px, z-index 4/5)
 * - Hero: 2 bloques 50/50, h1 80px weight 100 -2px, cycling JS con pares de colores reales
 * - Text-box: 2 col 50%, title izq + párrafo der (35px)
 * - Cards: 2 col 50%, imagen full-width + caption flex justify-between
 * Contenido: Barkley Online (colegio asincrónico Chile) en lugar de agencia
 */
import { useState, useEffect, useRef } from "react";
import { Loader2, Check, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReservationDialog } from "@/components/ReservationDialog";

// — Pares del hero: [palabra izq, palabra der, bg izq, bg der]
// Colores hex EXACTOS extraídos del HTML fuente real de unthink.ie (animatedRow, 8 pares)
const PAIRS: [string, string, string, string][] = [
  ["colegio", "asincrónico", "#ff6775", "#ffff76"],
  ["listo", "para aprender", "#dc91f0", "#ffab39"],
  ["sin", "horario fijo", "#ffb5b5", "#00e2a5"],
  ["exámenes", "libres", "#ff6775", "#b8efeb"],
  ["tu", "ritmo", "#dc91f0", "#ffff76"],
  ["colegio", "acompañado", "#00e2a5", "#ffab39"],
  ["directo", "al MINEDUC", "#ffb5b5", "#ff6775"],
  ["barkley", "online", "#dc91f0", "#b8efeb"],
];

const BODY_FONT = "'Hanken Grotesk', sans-serif";
const BODY_BG = "#f4f4ea";
const BODY_COLOR = "#000";
const BODY_FS = 35;

// — Datos de las "tarjetas de proyecto" (asignaturas/programas de Barkley)
const CARDS = [
  {
    img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=75",
    title: "Aprendizaje asincrónico",
    cat: "Educación  Digital",
    alt: "Aprendizaje",
  },
  {
    img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=75",
    title: "Exámenes libres MINEDUC",
    cat: "Certificación  Oficial",
    alt: "Exámenes libres",
  },
];

interface Faq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

function InscripcionForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("");
  const [st, setSt] = useState<"idle"|"loading"|"success"|"error"|"duplicate">("idle");
  const [err, setErr] = useState("");
  const submit = async () => {
    setSt("loading"); setErr("");
    try {
      const res = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, name: name||undefined, levelInterest: level||undefined }) });
      const d = await res.json();
      if (!res.ok) { setErr(d.message||"Error"); setSt("error"); return; }
      setSt(d.alreadySubscribed ? "duplicate" : "success");
    } catch { setErr("Sin conexión"); setSt("error"); }
  };
  if (st === "success" || st === "duplicate") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "60px 0" }}>
      <Check style={{ width: 32, height: 32 }} />
      <p style={{ fontSize: 35, fontWeight: 300, margin: 0 }}>{st === "duplicate" ? "Ya tenemos tu inscripción." : "Inscripción recibida."}</p>
      <p style={{ fontSize: 18, opacity: 0.6, margin: 0 }}>Un asesor te contactará a la brevedad.</p>
    </div>
  );
  const inp: React.CSSProperties = { borderBottom: "1px solid #000", background: "none", fontSize: 22, fontWeight: 300, padding: "8px 0", outline: "none", width: "100%", fontFamily: BODY_FONT };
  return (
    <form onSubmit={e => { e.preventDefault(); submit(); }} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 15, opacity: 0.5 }}>Nombre del apoderado o estudiante *</label>
        <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre completo" style={inp} data-testid="input-name" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 15, opacity: 0.5 }}>Correo electrónico *</label>
        <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com" style={inp} data-testid="input-email" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 15, opacity: 0.5 }}>Nivel de interés</label>
        <select value={level} onChange={e=>setLevel(e.target.value)} style={{ ...inp, cursor: "pointer" }} data-testid="select-level">
          <option value="">Selecciona un nivel</option>
          {["5° Básico","6° Básico","7° Básico","8° Básico","1° Medio","2° Medio","3° Medio","4° Medio","Validación adulto"].map(l=><option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      {st==="error" && <p style={{ color: "red", fontSize: 16, margin: 0 }}>{err}</p>}
      <button type="submit" disabled={st==="loading"} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 22, fontWeight: 300, background: "none", border: "none", borderBottom: "1px solid #000", padding: "8px 0", cursor: "pointer", fontFamily: BODY_FONT, opacity: st==="loading"?0.4:1, width: "fit-content" }}>
        {st==="loading" ? <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" /> : <>Quiero inscribirme <ArrowUpRight style={{ width: 18, height: 18 }} /></>}
      </button>
      <p style={{ fontSize: 14, opacity: 0.4, margin: 0 }}>Sin compromiso · sin costo · cupos limitados año académico 2027</p>
    </form>
  );
}

export default function Home() {
  const [pairIdx, setPairIdx] = useState(0);
  const [callOpen, setCallOpen] = useState(false);
  const [heroStarted, setHeroStarted] = useState(false);
  const { data: faqs } = useQuery<Faq[]>({ queryKey: ["/api/faqs"], staleTime: 5*60*1000 });
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Timing real de unthink.ie: 750ms por fila. Mobile autoplay inmediato,
  // desktop arranca recién al primer hover sobre el hero (comportamiento exacto del sitio real).
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      intervalRef.current = setInterval(() => setPairIdx(i => (i + 1) % PAIRS.length), 750);
      return () => clearInterval(intervalRef.current);
    }
  }, []);

  const startHeroCycle = () => {
    if (heroStarted) return;
    setHeroStarted(true);
    intervalRef.current = setInterval(() => setPairIdx(i => (i + 1) % PAIRS.length), 750);
  };

  const [leftWord, rightWord, leftBg, rightBg] = PAIRS[pairIdx];
  const navLink: React.CSSProperties = {
    position: "fixed",
    fontSize: 35,
    fontWeight: 300,
    color: BODY_COLOR,
    textDecoration: "none",
    transition: "opacity 0.5s ease",
    zIndex: 4,
    fontFamily: BODY_FONT,
    lineHeight: 1,
  };
  const fade = (e: React.MouseEvent<HTMLAnchorElement|HTMLButtonElement>, v: string) =>
    ((e.currentTarget as HTMLElement).style.opacity = v);

  return (
    <div style={{ backgroundColor: BODY_BG, color: BODY_COLOR, fontFamily: BODY_FONT, fontSize: BODY_FS, fontWeight: 300 }}>

      {/* === NAV — 4 links FIXED en las 4 esquinas (replicado exacto) === */}
      <a href="/" style={{ ...navLink, top: 30, left: 30, zIndex: 5 }}
        onMouseEnter={e=>fade(e,"0.4")} onMouseLeave={e=>fade(e,"1")}>Barkley Online</a>
      <a href="#metodo" style={{ ...navLink, top: 30, right: 30 }}
        onMouseEnter={e=>fade(e,"0.4")} onMouseLeave={e=>fade(e,"1")}>El método</a>
      <a href="#plataforma" style={{ ...navLink, bottom: 30, left: 30 }}
        onMouseEnter={e=>fade(e,"0.4")} onMouseLeave={e=>fade(e,"1")}>La plataforma</a>
      <a href="#inscripcion" style={{ ...navLink, bottom: 30, right: 30 }}
        onMouseEnter={e=>fade(e,"0.4")} onMouseLeave={e=>fade(e,"1")}>Inscripción</a>

      {/* === HERO — 2 bloques de color 50/50, h1 80px weight 100 -2px === */}
      <div onMouseEnter={startHeroCycle} style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <div style={{ flex: 1, backgroundColor: leftBg, display: "flex", alignItems: "flex-end", padding: "0 15px 15px", transition: "background-color 0.15s ease" }}>
          <h1 style={{ fontSize: 80, fontWeight: 100, letterSpacing: "-2px", lineHeight: 1, margin: 0 }}>{leftWord}</h1>
        </div>
        <div style={{ flex: 1, backgroundColor: rightBg, display: "flex", alignItems: "flex-end", padding: "0 15px 15px", transition: "background-color 0.15s ease" }}>
          <h1 style={{ fontSize: 80, fontWeight: 100, letterSpacing: "-2px", lineHeight: 1, margin: 0 }}>{rightWord}</h1>
        </div>
      </div>

      {/* === TEXT BOX 2 — "Somos Barkley Online" + párrafo (2 col 50%) === */}
      <div style={{ display: "flex", flexWrap: "wrap", backgroundColor: BODY_BG, padding: "60px 15px" }}>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingRight: 15 }}>
          <p style={{ fontSize: BODY_FS, fontWeight: 300, margin: 0, lineHeight: 1.15 }}>Somos Barkley Online</p>
        </div>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingLeft: 15 }}>
          <p style={{ fontSize: BODY_FS, fontWeight: 300, opacity: 0.75, margin: 0, lineHeight: 1.4 }}>
            Un colegio 100% asincrónico, sin clases en vivo por Zoom o Meet, sin horario fijo.
            Desde 5° básico a 4° medio — y validación para adultos — preparando para rendir
            exámenes libres ante el Ministerio de Educación de Chile.
          </p>
        </div>
      </div>

      {/* === TARJETA 1 — Aprendizaje asincrónico (2 col 50%, imagen + caption) === */}
      <div id="metodo" style={{ display: "flex", flexWrap: "wrap", padding: "0 15px 60px", backgroundColor: BODY_BG }}>
        {CARDS.map((c, i) => (
          <div key={c.title} style={{ flex: "0 0 50%", minWidth: 280, padding: i===0 ? "0 15px 0 0" : "0 0 0 15px" }}>
            <img src={c.img} alt={c.alt} loading="lazy"
              style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0 0", gap: 16 }}>
              <span style={{ fontSize: BODY_FS, fontWeight: 300 }}>{c.title}</span>
              <span style={{ fontSize: 18, color: "#6e6e6e", whiteSpace: "nowrap" }}>{c.cat}</span>
            </div>
          </div>
        ))}
      </div>

      {/* === TEXT BOX — "El ritmo es tuyo." (2 col 50%) === */}
      <div style={{ display: "flex", flexWrap: "wrap", backgroundColor: BODY_BG, padding: "60px 15px" }}>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingRight: 15 }}>
          <p style={{ fontSize: 60, fontWeight: 100, letterSpacing: "-2px", lineHeight: 1.05, margin: 0 }}>
            El ritmo<br />es tuyo.
          </p>
        </div>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingLeft: 15, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <a href="#metodo" style={{ fontSize: BODY_FS, fontWeight: 300, color: BODY_COLOR, textDecoration: "none", opacity: 0.75, transition: "opacity 0.25s ease-in-out" }}
            onMouseEnter={e=>fade(e,"0.3")} onMouseLeave={e=>fade(e,"0.75")}>
            Conoce el método ↗
          </a>
        </div>
      </div>

      {/* === TARJETA 3 — La plataforma (1 col full) === */}
      <div id="plataforma" style={{ padding: "0 15px 60px", backgroundColor: BODY_BG }}>
        <img
          src="https://images.unsplash.com/photo-1555212697-194d092e3b8f?auto=format&fit=crop&w=1380&q=75"
          alt="Plataforma Barkley Online" loading="lazy"
          style={{ width: "100%", aspectRatio: "16/7", objectFit: "cover", display: "block" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0 0", gap: 16 }}>
          <span style={{ fontSize: BODY_FS, fontWeight: 300 }}>La plataforma</span>
          <span style={{ fontSize: 18, color: "#6e6e6e" }}>Asignaturas  Progreso  Seguimiento</span>
        </div>
      </div>

      {/* === TEXT BOX — "El algoritmo te acompaña." === */}
      <div style={{ display: "flex", flexWrap: "wrap", backgroundColor: BODY_BG, padding: "60px 15px" }}>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingRight: 15 }}>
          <p style={{ fontSize: 60, fontWeight: 100, letterSpacing: "-2px", lineHeight: 1.05, margin: 0 }}>
            El algoritmo<br />te acompaña.
          </p>
        </div>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingLeft: 15, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <p style={{ fontSize: BODY_FS, fontWeight: 300, opacity: 0.75, margin: 0, lineHeight: 1.4 }}>
            Un sistema determinístico mide tus resultados y ajusta el ritmo y el contenido.
            Sin inteligencia artificial generativa — seguimiento real, sin hype.
          </p>
        </div>
      </div>

      {/* === FAQ === */}
      {faqs && faqs.length > 0 && (
        <div style={{ padding: "60px 15px", backgroundColor: BODY_BG }}>
          <p style={{ fontSize: BODY_FS, fontWeight: 300, marginBottom: 40 }}>Preguntas frecuentes</p>
          <Accordion type="single" collapsible>
            {faqs.map(f => (
              <AccordionItem key={f.id} value={f.id} style={{ borderTop: "1px solid rgba(0,0,0,0.15)", borderBottom: "none" }}>
                <AccordionTrigger style={{ fontSize: 22, fontWeight: 300, padding: "18px 0" }} className="hover:no-underline">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent style={{ fontSize: 18, opacity: 0.7, paddingBottom: 18 }}>
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* === CTA / HELLO — fondo negro, blanco === */}
      <div style={{ backgroundColor: "#000", color: "#fff", padding: "60px 15px", display: "flex", flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingRight: 15 }}>
          <p style={{ fontSize: BODY_FS, fontWeight: 300, margin: 0 }}>Inscríbete.</p>
        </div>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingLeft: 15 }}>
          <p style={{ fontSize: BODY_FS, fontWeight: 300, margin: "0 0 24px", opacity: 0.75, lineHeight: 1.3 }}>
            ¿Quieres saber más sobre Barkley Online?<br />
            Déjanos tus datos y te contactamos. ↗
          </p>
          <button onClick={() => document.getElementById("inscripcion")?.scrollIntoView({ behavior: "smooth" })}
            style={{ fontSize: 22, fontWeight: 300, color: "#fff", background: "none", border: "none", borderBottom: "1px solid #fff", padding: "6px 0", cursor: "pointer", fontFamily: BODY_FONT, opacity: 0.75, transition: "opacity 0.25s", display: "inline-flex", alignItems: "center", gap: 6 }}
            onMouseEnter={e=>(e.currentTarget.style.opacity="0.4")} onMouseLeave={e=>(e.currentTarget.style.opacity="0.75")}
          >Ir al formulario de inscripción <ArrowUpRight style={{ width: 18, height: 18 }} /></button>
        </div>
      </div>

      {/* === INSCRIPCIÓN (formulario) === */}
      <div id="inscripcion" style={{ display: "flex", flexWrap: "wrap", backgroundColor: BODY_BG, padding: "60px 15px" }}>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingRight: 15 }}>
          <p style={{ fontSize: BODY_FS, fontWeight: 300, margin: 0 }}>Admisión 2027</p>
          <p style={{ fontSize: 18, opacity: 0.5, margin: "8px 0 0" }}>Sin compromiso · sin costo</p>
        </div>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingLeft: 15 }}>
          <InscripcionForm />
        </div>
      </div>

      {/* === FOOTER === */}
      <footer style={{ backgroundColor: "#000", color: "#fff", padding: "40px 15px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 300, margin: 0 }}>Barkley Online</p>
            <p style={{ fontSize: 16, opacity: 0.4, margin: "6px 0 0" }}>Colegio asincrónico · Chile</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <a href="mailto:admisiones@barkley.cl" style={{ fontSize: 16, color: "#fff", textDecoration: "none", opacity: 0.5, transition: "opacity 0.25s" }}
              onMouseEnter={e=>((e.currentTarget as HTMLElement).style.opacity="1")} onMouseLeave={e=>((e.currentTarget as HTMLElement).style.opacity="0.5")}>
              admisiones@barkley.cl
            </a>
            <button onClick={() => setCallOpen(true)}
              style={{ fontSize: 16, color: "#fff", background: "none", border: "none", padding: 0, cursor: "pointer", opacity: 0.5, transition: "opacity 0.25s", fontFamily: BODY_FONT, textAlign: "left" }}
              onMouseEnter={e=>(e.currentTarget.style.opacity="1")} onMouseLeave={e=>(e.currentTarget.style.opacity="0.5")}
            >Agendar llamada</button>
          </div>
        </div>
        <p style={{ fontSize: 14, opacity: 0.25, marginTop: 40 }}>© {new Date().getFullYear()} Barkley Online</p>
      </footer>

      <ReservationDialog open={callOpen} onOpenChange={setCallOpen} />
    </div>
  );
}
