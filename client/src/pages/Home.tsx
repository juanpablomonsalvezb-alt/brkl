/**
 * Clon estructural de https://www.isb.be/ (International School of Brussels) —
 * colegio internacional real, no agencia creativa. Estructura extraída del HTML
 * fuente real: header con nav + botones Visitar/Postular, hero slideshow con fade,
 * texto intro con palabras resaltadas de color, sección "pilares" con imagen+4 cajas,
 * grid de niveles educativos, testimonios en pestañas, franja de stats, grid de
 * programas, CTA, footer con contacto/enlaces/acreditación.
 * Paleta EXACTA real: navy #003366, rojo #FF3D37, dorado #FFC548, fondo blanco,
 * texto #525252, fuente Poppins.
 */
import { useState, useEffect, useRef } from "react";
import { Loader2, Check, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReservationDialog } from "@/components/ReservationDialog";

const NAVY = "#003366";
const RED = "#FF3D37";
const GOLD = "#FFC548";
const TEXT = "#525252";
const FONT = "'Poppins', sans-serif";

const HERO_SLIDES = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=75",
  "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1600&q=75",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1600&q=75",
  "https://images.unsplash.com/photo-1610484826967-09c5720778c7?auto=format&fit=crop&w=1600&q=75",
];

const PILARES = [
  { title: "Acompañamiento", img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=75", text: "Vínculos reales con asesores académicos que conocen a cada estudiante y lo acompañan en su progreso." },
  { title: "Metodología", img: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=700&q=75", text: "Nuestros tutores diseñan evaluación y contenido diferenciado según el perfil de cada estudiante." },
  { title: "Rutas flexibles", img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=700&q=75", text: "Cada estudiante avanza a su ritmo, con fechas límite claras y amplio margen de organización." },
  { title: "Plataforma", img: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=700&q=75", text: "Seguimiento determinístico de progreso, evaluación diferenciada y acompañamiento docente." },
];

const NIVELES = [
  { title: "Enseñanza Básica", sub: "5° a 8° Básico", img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=700&q=75" },
  { title: "Enseñanza Media", sub: "1° a 4° Medio", img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=700&q=75" },
  { title: "Validación de Adultos", sub: "Mayores de 18 años", img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=700&q=75" },
];

const RAZONES = [
  { title: "Sin horario fijo", text: "Estudias cuando puedes, a tu propio ritmo, sin clases en vivo obligatorias." },
  { title: "Validación oficial", text: "Preparamos exámenes libres ante el Ministerio de Educación de Chile." },
  { title: "Seguimiento real", text: "Sistema determinístico de progreso — sin inteligencia artificial generativa en el aula." },
];

const STATS = [
  { n: "100%", label: "Asincrónico", color: NAVY },
  { n: "5°–4°", label: "Básico a Medio", color: RED },
  { n: "6", label: "Asignaturas evaluadas", color: GOLD },
  { n: "2027", label: "Año académico de apertura", color: NAVY },
];

const PROGRAMAS = [
  { title: "Metodología", sub: "Aprendizaje asincrónico", text: "Sin Zoom, sin horario fijo. Material propio diseñado para el ritmo de cada estudiante.", img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=700&q=75", href: "#metodo" },
  { title: "Certificación", sub: "Exámenes libres MINEDUC", text: "Validación oficial ante el Ministerio de Educación de Chile, desde 5° básico a 4° medio.", img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=700&q=75", href: "#metodo" },
  { title: "Plataforma", sub: "Seguimiento algorítmico", text: "Un sistema determinístico mide resultados y ajusta el contenido — sin IA generativa.", img: "https://images.unsplash.com/photo-1555212697-194d092e3b8f?auto=format&fit=crop&w=700&q=75", href: "#plataforma" },
  { title: "Acompañamiento", sub: "Tutores por asignatura", text: "Apoyo 1 a 1 en las asignaturas que más lo necesitan.", img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=700&q=75", href: "#plataforma" },
  { title: "Familias", sub: "Portal de apoderados", text: "Transparencia total: seguimiento en tiempo real del progreso de cada estudiante.", img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=75", href: "#inscripcion" },
  { title: "Trámite", sub: "Validación de estudios", text: "Guías y asesoría personalizada para completar el trámite MINEDUC correctamente.", img: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=700&q=75", href: "#faq" },
];

interface Faq { id: string; question: string; answer: string; sortOrder: number; }

function Highlight({ color, children }: { color: string; children: string }) {
  return <span style={{ position: "relative", fontWeight: 600, color }}>{children}</span>;
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "40px 0" }}>
      <Check style={{ width: 32, height: 32, color: NAVY }} />
      <p style={{ fontSize: 24, fontWeight: 600, margin: 0, color: NAVY }}>{st === "duplicate" ? "Ya tenemos tu inscripción." : "Inscripción recibida."}</p>
      <p style={{ fontSize: 16, opacity: 0.7, margin: 0 }}>Un asesor te contactará a la brevedad.</p>
    </div>
  );
  const inp: React.CSSProperties = { border: "1px solid #d5dbe3", borderRadius: 8, background: "#fff", fontSize: 16, padding: "12px 14px", outline: "none", width: "100%", fontFamily: FONT, color: TEXT };
  return (
    <form onSubmit={e => { e.preventDefault(); submit(); }} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>Nombre del apoderado o estudiante *</label>
        <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre completo" style={inp} data-testid="input-name" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>Correo electrónico *</label>
        <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com" style={inp} data-testid="input-email" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>Nivel de interés</label>
        <select value={level} onChange={e=>setLevel(e.target.value)} style={{ ...inp, cursor: "pointer" }} data-testid="select-level">
          <option value="">Selecciona un nivel</option>
          {["5° Básico","6° Básico","7° Básico","8° Básico","1° Medio","2° Medio","3° Medio","4° Medio","Validación adulto"].map(l=><option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      {st==="error" && <p style={{ color: RED, fontSize: 14, margin: 0 }}>{err}</p>}
      <button type="submit" disabled={st==="loading"} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 16, fontWeight: 600, background: RED, color: "#fff", border: "none", borderRadius: 999, padding: "14px 28px", cursor: "pointer", fontFamily: FONT, opacity: st==="loading"?0.6:1, width: "fit-content" }}>
        {st==="loading" ? <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" /> : <>Quiero inscribirme <ArrowUpRight style={{ width: 18, height: 18 }} /></>}
      </button>
      <p style={{ fontSize: 13, opacity: 0.6, margin: 0 }}>Sin compromiso · sin costo · cupos limitados año académico 2027</p>
    </form>
  );
}

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [tab, setTab] = useState<"estudiantes"|"apoderados">("estudiantes");
  const [callOpen, setCallOpen] = useState(false);
  const { data: faqs } = useQuery<Faq[]>({ queryKey: ["/api/faqs"], staleTime: 5*60*1000 });
  const slideRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    slideRef.current = setInterval(() => setSlide(i => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(slideRef.current);
  }, []);

  const navLinks = [
    { label: "Nosotros", href: "#nosotros" },
    { label: "Admisión", href: "#inscripcion" },
    { label: "Aprendizaje", href: "#metodo" },
    { label: "Plataforma", href: "#plataforma" },
    { label: "Preguntas", href: "#faq" },
  ];

  return (
    <div style={{ backgroundColor: "#fff", color: TEXT, fontFamily: FONT, fontSize: 16, lineHeight: 1.8 }}>

      {/* === HEADER === */}
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff", borderBottom: "1px solid #eef1f5" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <a href="/" style={{ textDecoration: "none", color: NAVY, fontWeight: 700, fontSize: 20, lineHeight: 1.1 }}>
            Barkley<br /><span style={{ fontSize: 13, fontWeight: 400, color: TEXT }}>Online</span>
          </a>
          <nav style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {navLinks.map(l => (
              <a key={l.href} href={l.href} style={{ color: TEXT, textDecoration: "none", fontSize: 15, fontWeight: 500, transition: "color 0.2s" }}
                onMouseEnter={e=>(e.currentTarget.style.color=NAVY)} onMouseLeave={e=>(e.currentTarget.style.color=TEXT)}>
                {l.label}
              </a>
            ))}
          </nav>
          <div style={{ display: "flex", gap: 10 }}>
            <a href="#inscripcion" style={{ textDecoration: "none", border: `1.5px solid ${NAVY}`, color: NAVY, borderRadius: 999, padding: "9px 18px", fontSize: 14, fontWeight: 600 }}>Visitar</a>
            <a href="#inscripcion" style={{ textDecoration: "none", background: RED, color: "#fff", borderRadius: 999, padding: "9px 18px", fontSize: 14, fontWeight: 600 }}>Postular</a>
          </div>
        </div>
      </header>

      {/* === HERO — slideshow con fade + caption === */}
      <section style={{ position: "relative", height: "70vh", minHeight: 420, overflow: "hidden" }}>
        {HERO_SLIDES.map((src, i) => (
          <img key={src} src={src} alt="" style={{
            position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            opacity: i === slide ? 1 : 0, transition: "opacity 1s ease-in-out",
          }} />
        ))}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,51,102,0) 40%, rgba(0,51,102,0.55) 100%)" }} />
        <div style={{ position: "absolute", left: 24, bottom: 32, right: 24, color: "#fff" }}>
          <p style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 8px" }}>Líderes en Educación Asincrónica Inclusiva</p>
          <h1 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 700, margin: 0, maxWidth: 700, lineHeight: 1.15 }}>El colegio online que se adapta a tu ritmo.</h1>
        </div>
        <button aria-label="Anterior" onClick={() => setSlide(i => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronLeft style={{ width: 20, height: 20, color: NAVY }} />
        </button>
        <button aria-label="Siguiente" onClick={() => setSlide(i => (i + 1) % HERO_SLIDES.length)}
          style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronRight style={{ width: 20, height: 20, color: NAVY }} />
        </button>
      </section>

      {/* === INTRO — texto con palabras resaltadas de color, como isb.be === */}
      <section id="nosotros" style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px", textAlign: "center" }}>
        <p style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 400, lineHeight: 1.5, color: TEXT, margin: 0 }}>
          Somos un <Highlight color={NAVY}>colegio</Highlight> 100% asincrónico en <Highlight color={RED}>Chile</Highlight> para{" "}
          <Highlight color={GOLD}>estudiantes</Highlight> desde 5° básico hasta 4° <Highlight color={NAVY}>medio</Highlight>, ofreciendo una
          preparación <Highlight color={RED}>rigurosa</Highlight> para rendir exámenes libres ante personas de todo{" "}
          <Highlight color={GOLD}>Chile</Highlight>.
        </p>
      </section>

      {/* === PILARES — imagen grande + 4 cajas, como "An Education Designed Around You" === */}
      <section style={{ background: "#f7f9fb", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" }}>Aprendizaje personalizado en Barkley</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 700, color: NAVY, margin: "0 0 40px", maxWidth: 700 }}>Una educación diseñada en torno a ti</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
            {PILARES.map(p => (
              <div key={p.title} style={{ flex: "1 1 240px", minWidth: 220 }}>
                <img src={p.img} alt={p.title} loading="lazy" style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover", borderRadius: 12, display: "block", marginBottom: 16 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>{p.title}</h3>
                <p style={{ fontSize: 15, margin: 0, color: TEXT }}>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === NIVELES — "Nuestro camino de aprendizaje" === */}
      <section id="metodo" style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" }}>De 5° básico a validación de adultos</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 700, color: NAVY, margin: "0 0 40px" }}>Nuestro camino de aprendizaje</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {NIVELES.map(n => (
              <a key={n.title} href="#inscripcion" style={{ flex: "1 1 260px", minWidth: 240, textDecoration: "none", color: NAVY, position: "relative", borderRadius: 16, overflow: "hidden", display: "block", boxShadow: "0 8px 24px -8px rgba(0,51,102,0.25)" }}>
                <img src={n.img} alt={n.title} loading="lazy" style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,51,102,0) 40%, rgba(0,51,102,0.85) 100%)" }} />
                <div style={{ position: "absolute", left: 20, bottom: 18, color: "#fff" }}>
                  <p style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{n.title}</p>
                  <p style={{ fontSize: 14, margin: "4px 0 0", opacity: 0.9 }}>{n.sub}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* === RAZONES — reemplaza testimonios fabricados por razones reales, en pestañas === */}
      <section style={{ background: "#f7f9fb", padding: "64px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" }}>Por qué Barkley</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 700, color: NAVY, margin: "0 0 32px" }}>Historias que nos conectan</h2>
          <div style={{ display: "inline-flex", gap: 8, marginBottom: 40, background: "#fff", borderRadius: 999, padding: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {(["estudiantes","apoderados"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                border: "none", borderRadius: 999, padding: "10px 24px", fontSize: 14, fontWeight: 600, fontFamily: FONT, cursor: "pointer",
                background: tab === t ? NAVY : "transparent", color: tab === t ? "#fff" : TEXT, textTransform: "capitalize",
              }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
          {RAZONES.map(r => (
            <div key={r.title} style={{ flex: "1 1 260px", minWidth: 240, background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>{r.title}</h3>
              <p style={{ fontSize: 15, margin: 0 }}>{r.text}{tab === "apoderados" ? " Transparencia total desde el portal de apoderados." : ""}</p>
            </div>
          ))}
        </div>
      </section>

      {/* === STATS — "Más que un colegio" === */}
      <section style={{ padding: "56px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" }}>Barkley en cifras</p>
          <h2 style={{ fontSize: "clamp(24px,3.5vw,34px)", fontWeight: 700, color: NAVY, margin: "0 0 40px" }}>Más que un colegio</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
            {STATS.map(s => (
              <div key={s.label} style={{ flex: "1 1 180px", minWidth: 160 }}>
                <p style={{ fontSize: 44, fontWeight: 800, color: s.color, margin: 0 }}>{s.n}</p>
                <p style={{ fontSize: 15, margin: "6px 0 0", color: TEXT }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === PROGRAMAS — grid tipo "Discover & Experience" === */}
      <section id="plataforma" style={{ background: "#f7f9fb", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" }}>Descubre y experimenta</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 700, color: NAVY, margin: "0 0 40px" }}>La plataforma, por dentro</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 28 }}>
            {PROGRAMAS.map(p => (
              <a key={p.title} href={p.href} style={{ flex: "1 1 300px", minWidth: 260, textDecoration: "none", color: TEXT, background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
                <img src={p.img} alt={p.title} loading="lazy" style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover", display: "block" }} />
                <div style={{ padding: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.03em", margin: "0 0 4px" }}>{p.title}</p>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>{p.sub}</h3>
                  <p style={{ fontSize: 14, margin: 0 }}>{p.text}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      {faqs && faqs.length > 0 && (
        <section id="faq" style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px" }}>
          <h2 style={{ fontSize: "clamp(24px,3.5vw,34px)", fontWeight: 700, color: NAVY, margin: "0 0 32px" }}>Preguntas frecuentes</h2>
          <Accordion type="single" collapsible>
            {faqs.map(f => (
              <AccordionItem key={f.id} value={f.id} style={{ borderTop: "1px solid #eef1f5", borderBottom: "none" }}>
                <AccordionTrigger style={{ fontSize: 17, fontWeight: 600, color: NAVY, padding: "18px 0" }} className="hover:no-underline">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent style={{ fontSize: 15, opacity: 0.85, paddingBottom: 18 }}>
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      {/* === CTA — navy, blanco === */}
      <section style={{ backgroundColor: NAVY, color: "#fff", padding: "64px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 700, margin: "0 0 16px" }}>¿Quieres saber más sobre Barkley Online?</h2>
          <p style={{ fontSize: 16, opacity: 0.85, margin: "0 0 28px" }}>Déjanos tus datos y te contactamos.</p>
          <button onClick={() => document.getElementById("inscripcion")?.scrollIntoView({ behavior: "smooth" })}
            style={{ fontSize: 15, fontWeight: 700, color: NAVY, background: GOLD, border: "none", borderRadius: 999, padding: "14px 30px", cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 8 }}
          >Ir al formulario de inscripción <ArrowUpRight style={{ width: 18, height: 18 }} /></button>
        </div>
      </section>

      {/* === INSCRIPCIÓN (formulario) === */}
      <section id="inscripcion" style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px", display: "flex", flexWrap: "wrap", gap: 40 }}>
        <div style={{ flex: "1 1 320px", minWidth: 260 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" }}>Admisión 2027</p>
          <h2 style={{ fontSize: "clamp(24px,3.5vw,32px)", fontWeight: 700, color: NAVY, margin: 0 }}>Inscríbete.</h2>
          <p style={{ fontSize: 15, opacity: 0.7, margin: "10px 0 0" }}>Sin compromiso · sin costo</p>
        </div>
        <div style={{ flex: "1 1 380px", minWidth: 280 }}>
          <InscripcionForm />
        </div>
      </section>

      {/* === FOOTER — contacto, enlaces, acreditación real === */}
      <footer style={{ backgroundColor: "#f7f9fb", color: TEXT, padding: "48px 24px 24px", borderTop: "1px solid #eef1f5" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 32 }}>
          <div style={{ flex: "1 1 240px" }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>Barkley Online</p>
            <p style={{ fontSize: 14, margin: 0, lineHeight: 1.8 }}>Colegio 100% asincrónico · Chile<br /><a href="mailto:admisiones@barkley.cl" style={{ color: NAVY }}>admisiones@barkley.cl</a></p>
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>Enlaces útiles</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
              <li><a href="#metodo" style={{ color: TEXT }}>El método</a></li>
              <li><a href="#plataforma" style={{ color: TEXT }}>La plataforma</a></li>
              <li><a href="#faq" style={{ color: TEXT }}>Preguntas frecuentes</a></li>
              <li><a href="#inscripcion" style={{ color: TEXT }}>Inscripción</a></li>
            </ul>
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>Contacto directo</p>
            <button onClick={() => setCallOpen(true)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT, fontSize: 14, color: TEXT }}>Agendar llamada</button>
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>Validación oficial</p>
            <p style={{ fontSize: 13, margin: 0, opacity: 0.75 }}>Preparación para Exámenes Libres ante el Ministerio de Educación de Chile (MINEDUC).</p>
          </div>
        </div>
        <div style={{ maxWidth: 1280, margin: "32px auto 0", paddingTop: 20, borderTop: "1px solid #e2e7ee", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 13, opacity: 0.6, margin: 0 }}>© {new Date().getFullYear()} Barkley Online</p>
          <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
            <a href="/privacidad" style={{ color: TEXT }}>Privacidad</a>
            <a href="/terminos" style={{ color: TEXT }}>Términos de uso</a>
          </div>
        </div>
      </footer>

      <ReservationDialog open={callOpen} onOpenChange={setCallOpen} />
    </div>
  );
}
