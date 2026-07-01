/**
 * Clone 1:1 de unthink.ie — estructura completa extraída del HTML fuente real:
 * nav 4 esquinas, hero split-color cycling, text-box, filas de tarjetas (2col/1col),
 * tag-cards de color (col-3), doble quiebre de titular grande, sección "novedades",
 * CTA negro "Hello", fila de 3 tarjetas teaser, footer de 5 columnas.
 * Contenido: Barkley Online (colegio asincrónico Chile) en lugar de agencia de diseño.
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
const CARDS_A = [
  { img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=75", title: "Aprendizaje asincrónico", cat: "Educación  Digital", alt: "Aprendizaje" },
  { img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=75", title: "Exámenes libres MINEDUC", cat: "Certificación  Oficial", alt: "Exámenes libres" },
];
const CARDS_C = [
  { img: "https://images.unsplash.com/photo-1610484826967-09c5720778c7?auto=format&fit=crop&w=900&q=75", title: "Apoderados", cat: "Seguimiento  Portal", alt: "Apoderados" },
  { img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=75", title: "Tutores por asignatura", cat: "Acompañamiento  1 a 1", alt: "Tutores" },
];
const CARDS_G = [
  { img: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=900&q=75", title: "Validación de estudios", cat: "Trámite  MINEDUC", alt: "Validación" },
  { img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=75", title: "Coordinación académica", cat: "Asesoría  Personal", alt: "Coordinación" },
];

const NOVEDADES = [
  { tag: "Admisión", date: "Año académico 2027", text: "Abrimos el proceso de admisión 2027 para 5° básico a 4° medio y validación de adultos." },
  { tag: "Fechas", date: "Sept – Oct", text: "Exámenes libres ante el MINEDUC: 4° medio y NEE fines de septiembre, resto en octubre." },
  { tag: "Plataforma", date: "Todo el año", text: "Seguimiento determinístico de progreso, sin inteligencia artificial generativa en el aula." },
];

interface Faq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

function ImgCard({ img, alt, title, cat, aspect = "4/3" }: { img: string; alt: string; title: string; cat: string; aspect?: string }) {
  return (
    <div>
      <img src={img} alt={alt} loading="lazy" style={{ width: "100%", aspectRatio: aspect, objectFit: "cover", display: "block" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0 0", gap: 16 }}>
        <span style={{ fontSize: BODY_FS, fontWeight: 300 }}>{title}</span>
        <span style={{ fontSize: 18, color: "#6e6e6e", whiteSpace: "nowrap" }}>{cat}</span>
      </div>
    </div>
  );
}

function TagCard({ bg, label, text, href }: { bg: string; label: string; text: string; href: string }) {
  const [hover, setHover] = useState(false);
  return (
    <a href={href} style={{ textDecoration: "none", color: "#000", display: "block", flex: "0 0 25%", minWidth: 220, padding: "0 8px 24px" }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div style={{ background: bg, padding: 24, minHeight: 180, opacity: hover ? 0.7 : 1, transition: "opacity 0.25s ease-in-out" }}>
        <span style={{ fontSize: 22, textDecoration: "underline", textUnderlineOffset: 8 }}>{label} ↗</span>
        <p style={{ fontSize: BODY_FS, fontWeight: 300, margin: "16px 0 0" }}>{text}</p>
      </div>
    </a>
  );
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

  const rowStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", padding: "0 8px 60px", backgroundColor: BODY_BG };
  const halfCol: React.CSSProperties = { flex: "0 0 50%", minWidth: 280, padding: "0 8px" };
  const textBox: React.CSSProperties = { display: "flex", flexWrap: "wrap", backgroundColor: BODY_BG, padding: "60px 15px" };

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

      {/* === TEXT-BOX-2 — "Somos Barkley Online" + párrafo === */}
      <div style={textBox}>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingRight: 15 }}>
          <p style={{ fontSize: BODY_FS, fontWeight: 300, margin: 0, lineHeight: 1.15 }}>Somos Barkley Online</p>
        </div>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingLeft: 15 }}>
          <p style={{ fontSize: BODY_FS, fontWeight: 300, opacity: 0.75, margin: 0, lineHeight: 1.4 }}>
            Un colegio 100% asincrónico, sin clases en vivo por Zoom o Meet, sin horario fijo.
            Desde 5° básico a 4° medio — y validación para adultos — preparando para rendir
            exámenes libres ante el Ministerio de Educación de Chile.
          </p>
          <a href="/nosotros" style={{ display: "inline-block", marginTop: 24, fontSize: 22, color: "#000", textDecoration: "underline", textUnderlineOffset: 10 }}>Más sobre nosotros ↗</a>
        </div>
      </div>

      {/* === FILA A — 2 col: Aprendizaje asincrónico / Exámenes libres === */}
      <div id="metodo" style={rowStyle}>
        {CARDS_A.map(c => <div key={c.title} style={halfCol}><ImgCard {...c} /></div>)}
      </div>

      {/* === FILA B — 1 col full: La plataforma === */}
      <div id="plataforma" style={{ ...rowStyle, display: "block" }}>
        <ImgCard img="https://images.unsplash.com/photo-1555212697-194d092e3b8f?auto=format&fit=crop&w=1380&q=75" alt="Plataforma Barkley Online" title="La plataforma" cat="Asignaturas  Progreso  Seguimiento" aspect="16/7" />
      </div>

      {/* === FILA C — 2 col: Apoderados / Tutores === */}
      <div style={rowStyle}>
        {CARDS_C.map(c => <div key={c.title} style={halfCol}><ImgCard {...c} /></div>)}
      </div>

      {/* === FILA D — tag-card de color, col-3 (como "Books" en el real) === */}
      <div style={{ display: "flex", flexWrap: "wrap", padding: "0 8px 60px" }}>
        <TagCard bg="#ffff76" label="Preguntas frecuentes" text="Todo lo que preguntan los apoderados." href="#faq" />
      </div>

      {/* === TEXT-BOX-6 — "El ritmo es tuyo." headline grande === */}
      <div style={textBox}>
        <div style={{ flex: "0 0 75%", minWidth: 280 }}>
          <p style={{ fontSize: 60, fontWeight: 100, letterSpacing: "-2px", lineHeight: 1.05, margin: "0 0 24px" }}>
            El ritmo<br />es tuyo.
          </p>
          <a href="#metodo" style={{ fontSize: 22, fontWeight: 300, color: BODY_COLOR, textDecoration: "underline", textUnderlineOffset: 10, opacity: 0.75, transition: "opacity 0.25s ease-in-out" }}
            onMouseEnter={e=>fade(e,"0.3")} onMouseLeave={e=>fade(e,"0.75")}>
            Conoce el método ↗
          </a>
        </div>
      </div>

      {/* === FILA E — 1 col full: Validación de estudios === */}
      <div style={{ ...rowStyle, display: "block" }}>
        <ImgCard img="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1380&q=75" alt="Validación de estudios" title="Validación de estudios" cat="Trámite  MINEDUC  Oficial" aspect="16/7" />
      </div>

      {/* === TEXT-BOX-10 — "El algoritmo te acompaña." headline, alineado a la derecha (offset-lg-3 real) === */}
      <div style={{ ...textBox, justifyContent: "flex-end" }}>
        <div style={{ flex: "0 0 75%", minWidth: 280 }}>
          <p style={{ fontSize: 60, fontWeight: 100, letterSpacing: "-2px", lineHeight: 1.05, margin: "0 0 24px" }}>
            El algoritmo<br />te acompaña.
          </p>
          <p style={{ fontSize: BODY_FS, fontWeight: 300, opacity: 0.75, margin: "0 0 24px", lineHeight: 1.4 }}>
            Un sistema determinístico mide tus resultados y ajusta el ritmo y el contenido.
            Sin inteligencia artificial generativa — seguimiento real, sin hype.
          </p>
          <a href="#plataforma" style={{ fontSize: 22, fontWeight: 300, color: BODY_COLOR, textDecoration: "underline", textUnderlineOffset: 10, opacity: 0.75, transition: "opacity 0.25s ease-in-out" }}
            onMouseEnter={e=>fade(e,"0.3")} onMouseLeave={e=>fade(e,"0.75")}>
            Cómo funciona la plataforma ↗
          </a>
        </div>
      </div>

      {/* === FILA G — 2 col: Validación / Coordinación === */}
      <div style={rowStyle}>
        {CARDS_G.map(c => <div key={c.title} style={halfCol}><ImgCard {...c} /></div>)}
      </div>

      {/* === FILA H — tag-card azul, col-3 === */}
      <div style={{ display: "flex", flexWrap: "wrap", padding: "0 8px 60px" }}>
        <TagCard bg="#76daff" label="La plataforma" text="Todo el sistema, por dentro." href="#plataforma" />
      </div>

      {/* === FILA I — mixta 1 imagen (mitad) + 1 tag-card morada (cuarto) === */}
      <div style={{ display: "flex", flexWrap: "wrap", padding: "0 8px 60px" }}>
        <div style={{ flex: "0 0 50%", minWidth: 280, padding: "0 8px" }}>
          <ImgCard img="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=75" alt="Apoderados" title="Portal de apoderados" cat="Transparencia  Total" />
        </div>
        <TagCard bg="#b576ff" label="Para apoderados" text="Seguimiento en tiempo real, sin sorpresas." href="#inscripcion" />
      </div>

      {/* === TEXT-BOX-14 — "Novedades" label + headline, fondo negro === */}
      <div style={{ display: "flex", flexWrap: "wrap", backgroundColor: "#000", color: "#fff", padding: "60px 15px" }}>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingRight: 15 }}>
          <p style={{ fontSize: BODY_FS, fontWeight: 300, margin: 0 }}>Novedades</p>
        </div>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingLeft: 15 }}>
          <p style={{ fontSize: 50, fontWeight: 100, letterSpacing: "-2px", lineHeight: 1.05, margin: 0 }}>
            Mantente al día con fechas, procesos y novedades del colegio.
          </p>
        </div>
      </div>

      {/* Grid simple en vez del glide-slider real — mismo contenido, sin dependencia de carrusel. */}
      <div style={{ backgroundColor: "#000", color: "#fff", padding: "0 15px 60px", display: "flex", flexWrap: "wrap", gap: 24 }}>
        {NOVEDADES.map(n => (
          <div key={n.tag} style={{ flex: "0 0 30%", minWidth: 260 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: "#7f7f7f", marginBottom: 12 }}>
              <span>{n.date}</span>
              <span style={{ background: "#fff", color: "#000", padding: "4px 10px" }}>{n.tag}</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 300, margin: 0 }}>{n.text}</p>
          </div>
        ))}
      </div>

      {/* === FAQ === */}
      {faqs && faqs.length > 0 && (
        <div id="faq" style={{ padding: "60px 15px", backgroundColor: BODY_BG }}>
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
      <div id="inscripcion" style={textBox}>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingRight: 15 }}>
          <p style={{ fontSize: BODY_FS, fontWeight: 300, margin: 0 }}>Admisión 2027</p>
          <p style={{ fontSize: 18, opacity: 0.5, margin: "8px 0 0" }}>Sin compromiso · sin costo</p>
        </div>
        <div style={{ flex: "0 0 50%", minWidth: 280, paddingLeft: 15 }}>
          <InscripcionForm />
        </div>
      </div>

      {/* === FOOTER TEASER — 3 tarjetas (6+3+3), como el real === */}
      <div style={{ display: "flex", flexWrap: "wrap", backgroundColor: "#000" }}>
        <a href="#metodo" style={{ flex: "0 0 50%", minWidth: 300, textDecoration: "none", color: "#000" }}>
          <div style={{ background: "#b576ff", padding: 30, minHeight: 220 }}>
            <span style={{ fontSize: 22, textDecoration: "underline", textUnderlineOffset: 8 }}>Ver el método completo ↗</span>
            <p style={{ fontSize: BODY_FS, fontWeight: 300, margin: "16px 0 0" }}>Cada asignatura, cada evaluación, sin sorpresas.</p>
          </div>
        </a>
        <a href="/nosotros" style={{ flex: "0 0 25%", minWidth: 260, textDecoration: "none", color: "#fff", position: "relative", backgroundImage: "linear-gradient(rgba(0,0,0,0.35),rgba(0,0,0,0.35)), url(https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=700&q=75)", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div style={{ padding: 30, minHeight: 220 }}>
            <span style={{ fontSize: 22, textDecoration: "underline", textUnderlineOffset: 8 }}>Sobre Barkley ↗</span>
          </div>
        </a>
        <a href="#inscripcion" style={{ flex: "0 0 25%", minWidth: 260, textDecoration: "none", color: "#000" }}>
          <div style={{ background: "#ffb5b5", padding: 30, minHeight: 220 }}>
            <span style={{ fontSize: 22, textDecoration: "underline", textUnderlineOffset: 8 }}>Para apoderados ↗</span>
            <p style={{ fontSize: BODY_FS, fontWeight: 300, margin: "16px 0 0" }}>Todo el trámite, explicado simple.</p>
          </div>
        </a>
      </div>

      {/* === FOOTER — 5 columnas reales === */}
      <footer style={{ backgroundColor: "#989898", color: "#000", padding: "40px 15px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          <div style={{ flex: "0 0 20%", minWidth: 180 }}>
            <p style={{ fontSize: 18, textDecoration: "underline", textUnderlineOffset: 10, margin: "0 0 10px" }}>Visítanos</p>
            <p style={{ fontSize: 18, margin: 0, lineHeight: 1.6 }}>Online · Chile<br /><a href="mailto:admisiones@barkley.cl" style={{ color: "#000" }}>admisiones@barkley.cl</a></p>
          </div>
          <div style={{ flex: "0 0 20%", minWidth: 180 }}>
            <p style={{ fontSize: 18, textDecoration: "underline", textUnderlineOffset: 10, margin: "0 0 10px" }}>Navega</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4, fontSize: 18 }}>
              <li><a href="#metodo" style={{ color: "#000" }}>El método</a></li>
              <li><a href="#plataforma" style={{ color: "#000" }}>La plataforma</a></li>
              <li><a href="#faq" style={{ color: "#000" }}>Preguntas frecuentes</a></li>
              <li><a href="#inscripcion" style={{ color: "#000" }}>Inscripción</a></li>
            </ul>
          </div>
          <div style={{ flex: "0 0 20%", minWidth: 180 }}>
            <p style={{ fontSize: 18, textDecoration: "underline", textUnderlineOffset: 10, margin: "0 0 10px" }}>Descubre más</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4, fontSize: 18 }}>
              <li><a href="/nosotros" style={{ color: "#000" }}>Sobre Barkley</a></li>
              <li><button onClick={() => setCallOpen(true)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: BODY_FONT, fontSize: 18, color: "#000" }}>Agendar llamada</button></li>
            </ul>
          </div>
          <div style={{ flex: "0 0 20%", minWidth: 180 }}>
            <p style={{ fontSize: 18, textDecoration: "underline", textUnderlineOffset: 10, margin: "0 0 10px" }}>Políticas</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4, fontSize: 18 }}>
              <li><a href="/privacidad" style={{ color: "#000" }}>Privacidad</a></li>
              <li><a href="/terminos" style={{ color: "#000" }}>Términos de uso</a></li>
            </ul>
          </div>
        </div>
        <p style={{ fontSize: 14, opacity: 0.5, marginTop: 40 }}>© {new Date().getFullYear()} Barkley Online</p>
      </footer>

      <ReservationDialog open={callOpen} onOpenChange={setCallOpen} />
    </div>
  );
}
