/**
 * Clon estructural + visual de https://www.isb.be/ (International School of Brussels).
 * Colores EXACTOS extraídos del CSS fuente real (main.css, tema Finalsite default_25):
 * navy #003366, rojo #FF3D37, dorado #FFC548, morado #861fce, verde #00b273, rosa #fe76b4.
 * Los íconos decorativos reales usan fuentes propietarias (bpa-font-icons / IcoMoon,
 * licenciadas a Finalsite) — no se pueden copiar. Se reemplazan por formas SVG
 * equivalentes (círculo, triángulo, estrella, corazón, flor, flecha) en los mismos
 * colores y misma posición/tamaño relativo — mismo lenguaje visual, sin robar el asset.
 * Estructura real: header con logo cuadrado + menú hamburguesa, hero full-bleed con
 * columna de formas decorativas a la derecha, intro con palabras+forma inline,
 * panel "Cuatro pilares" con bloque de color sólido + foto, fact-boxes negros con
 * glifo grande de color, programa highlights, footer navy con formas orgánicas.
 */
import { useState, useEffect, useRef } from "react";
import {
  Loader2, Check, ArrowUpRight, Menu, X, Search,
  Hourglass, Circle, Triangle, Star, Heart, Leaf, Rows3, ChevronsRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReservationDialog } from "@/components/ReservationDialog";

// Réplica de .fade-in-on-scroll / .animatedElement reales de isb.be (opacity+translateY al entrar en viewport)
// IMPORTANTE: acepta `style` y lo aplica al propio wrapper — si no, el flex-basis del hijo
// no tiene efecto porque el flex-item real dentro del contenedor padre es este div, no el hijo.
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

// Hover EXACTO real: .hoverEffect{transition:all ease-in-out .25s}:hover{transform:scale(1.01)} — sin lift vertical
const cardHover = { whileHover: { scale: 1.01 }, transition: { duration: 0.25, ease: "easeInOut" as const } };

const NAVY = "#003366";
const RED = "#FF3D37";
const GOLD = "#FFC548";
const PURPLE = "#861fce";
const GREEN = "#00b273";
const PINK = "#fe76b4";
const TEXT = "#525252";
const FONT = "'Poppins', sans-serif";
// Azul apagado real usado en titulares grandes e intro (no el navy puro de marca)
const SLATE = "#5b7ba3";
// Paneles de color sólido reales del hero (más claros que navy/morado de marca)
const BLOCK_BLUE = "#4a90d9";
const LAVENDER = "#b39ddb";

// Íconos reales de Lucide (ya en el proyecto) en vez de SVG dibujados a mano —
// el font-icon real de isb.be (bpa-font-icons/IcoMoon) es un asset de tema Finalsite
// pagado, no reproducible; Lucide da la misma pulcritud con licencia abierta (ISC).
function ShapeCircle({ color, size = 40 }: { color: string; size?: number }) {
  return <Circle color={color} fill={color} size={size} strokeWidth={0} />;
}
function ShapeTriangle({ color, size = 40 }: { color: string; size?: number }) {
  return <Triangle color={color} fill={color} size={size} strokeWidth={0} />;
}
function ShapeStar({ color, size = 40 }: { color: string; size?: number }) {
  return <Star color={color} fill={color} size={size} strokeWidth={0} />;
}
function ShapeHeart({ color, size = 40 }: { color: string; size?: number }) {
  return <Heart color={color} fill={color} size={size} strokeWidth={0} />;
}
function ShapeFlower({ color, size = 40 }: { color: string; size?: number }) {
  return <Leaf color={color} fill={color} size={size} strokeWidth={0} />;
}
function ShapeArrow({ color, size = 40 }: { color: string; size?: number }) {
  return <ChevronsRight color={color} size={size} strokeWidth={2.5} />;
}
function ShapeHourglass({ color, size = 40 }: { color: string; size?: number }) {
  return <Hourglass color={color} fill={color} size={size} strokeWidth={1} />;
}
function ShapeStairs({ color, size = 40 }: { color: string; size?: number }) {
  return <Rows3 color={color} fill={color} size={size} strokeWidth={1.5} />;
}
function ShapeLeaf({ color, size = 40 }: { color: string; size?: number }) {
  return <Leaf color={color} fill={color} size={size} strokeWidth={0} />;
}
function ShapeBars({ color, size = 40 }: { color: string; size?: number }) {
  return <Rows3 color={color} fill={color} size={size} strokeWidth={1.5} />;
}
function ShapeFastForward({ color, size = 40 }: { color: string; size?: number }) {
  return <ChevronsRight color={color} size={size} strokeWidth={3} />;
}
const SHAPES = [ShapeCircle, ShapeTriangle, ShapeStar, ShapeHeart, ShapeFlower, ShapeArrow];

const HERO_PHOTO = "/images/hero-estudiante.jpeg";

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

// Fact-boxes: fondo negro real, glifo grande de color arriba a la derecha (patrón exacto de .fact-box)
// Pastel real: bg claro + chevron/forma grande como marca de agua + número gigante (no negro con ícono chico)
const FACTS = [
  { n: "100%", label: "Asincrónico", shape: ShapeFastForward, bg: "#fdeccb", numColor: NAVY, shapeColor: "#fbd98a" },
  { n: "5°–4°", label: "Básico a Medio", shape: ShapeStairs, bg: "#d9ecff", numColor: NAVY, shapeColor: "#a9d3ff" },
  { n: "6", label: "Asignaturas evaluadas", shape: ShapeHourglass, bg: "#e3d9f7", numColor: NAVY, shapeColor: "#c6b3ea" },
  { n: "2027", label: "Año académico de apertura", shape: ShapeLeaf, bg: "#d7f0e3", numColor: NAVY, shapeColor: "#a9dfc3" },
];

const PROGRAMAS = [
  { title: "Metodología", sub: "Aprendizaje asincrónico", text: "Sin Zoom, sin horario fijo. Material propio diseñado para el ritmo de cada estudiante.", img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=700&q=75", href: "#metodo" },
  { title: "Certificación", sub: "Exámenes libres MINEDUC", text: "Validación oficial ante el Ministerio de Educación de Chile, desde 5° básico a 4° medio.", img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=700&q=75", href: "#metodo" },
  { title: "Plataforma", sub: "Seguimiento algorítmico", text: "Un sistema determinístico mide resultados y ajusta el contenido — sin IA generativa.", img: "https://images.unsplash.com/photo-1555212697-194d092e3b8f?auto=format&fit=crop&w=700&q=75", href: "#plataforma" },
  { title: "Acompañamiento", sub: "Tutores por asignatura", text: "Apoyo 1 a 1 en las asignaturas que más lo necesitan.", img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=700&q=75", href: "#plataforma" },
  { title: "Familias", sub: "Portal de apoderados", text: "Transparencia total: seguimiento en tiempo real del progreso de cada estudiante.", img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=75", href: "#inscripcion" },
  { title: "Trámite", sub: "Validación de estudios", text: "Guías y asesoría personalizada para completar el trámite MINEDUC correctamente.", img: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=700&q=75", href: "#faq" },
];

const NAV_LINKS = [
  { label: "Nosotros", href: "#nosotros" },
  { label: "Admisión", href: "#inscripcion" },
  { label: "Aprendizaje", href: "#metodo" },
  { label: "Plataforma", href: "#plataforma" },
  { label: "Preguntas", href: "#faq" },
];

interface Faq { id: string; question: string; answer: string; sortOrder: number; }

function ShapeInline({ color, shape: Shape }: { color: string; shape: typeof ShapeCircle }) {
  return <span style={{ display: "inline-block", margin: "0 4px", verticalAlign: "middle", transform: "translateY(2px)" }}><Shape color={color} size={28} /></span>;
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
  const [tab, setTab] = useState<"estudiantes"|"apoderados">("estudiantes");
  const [pilarIdx, setPilarIdx] = useState(0);
  const [callOpen, setCallOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: faqs } = useQuery<Faq[]>({ queryKey: ["/api/faqs"], staleTime: 5*60*1000 });

  return (
    <div style={{ backgroundColor: "#fff", color: TEXT, fontFamily: FONT, fontSize: 16, lineHeight: 1.8 }}>

      {/* === HEADER — logo cuadrado + hamburguesa, como el real (icono search + MY ISB + MENU) === */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "#fff", borderBottom: "1px solid #eef1f5" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo con marco cuadrado + subrayado rojo, como el real (logo ISB: cuadro con borde navy, texto bold, filete rojo debajo) */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
            <div style={{ width: 60, height: 60, background: NAVY, border: `2.5px solid ${NAVY}`, borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 4 }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px", lineHeight: 1 }}>BK</span>
              <span style={{ width: 28, height: 3, background: RED, marginTop: 4, borderRadius: 2 }} />
            </div>
            <span style={{ color: NAVY, fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>The Barkley<br />Online School</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button aria-label="Buscar" style={{ width: 36, height: 36, borderRadius: "50%", background: "#f1f4f8", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Search style={{ width: 16, height: 16, color: NAVY }} />
            </button>
            <span style={{ width: 1, height: 20, background: "#d8dee6" }} />
            <a href="#inscripcion" style={{ fontSize: 13, fontWeight: 700, color: NAVY, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>MI BARKLEY</a>
            <span style={{ width: 1, height: 20, background: "#d8dee6" }} />
            <button aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} onClick={() => setMenuOpen(o => !o)}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: NAVY, fontFamily: FONT, fontSize: 13, fontWeight: 700 }}>
              {menuOpen ? <X style={{ width: 22, height: 22 }} /> : <Menu style={{ width: 22, height: 22 }} />}
              MENÚ
            </button>
          </div>
        </div>
        {/* Overlay pantalla completa navy, links 48px blancos — transición real: fondo fade + links deslizan hacia arriba en cascada */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
              style={{ position: "fixed", inset: 0, background: NAVY, zIndex: 40, padding: "60px 40px", display: "flex", flexDirection: "column", gap: 28, overflowY: "auto" }}>
              <button aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} style={{ alignSelf: "flex-end", background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X style={{ width: 32, height: 32 }} /></button>
              {NAV_LINKS.map((l, i) => (
                <motion.a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 * i }}
                  style={{ color: "#fff", textDecoration: "none", fontSize: "clamp(28px,6vw,48px)", fontWeight: 600 }}>{l.label}</motion.a>
              ))}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 * NAV_LINKS.length + 0.1 }} style={{ display: "flex", gap: 14, marginTop: 20 }}>
                <a href="#inscripcion" style={{ textDecoration: "none", border: "1.5px solid #fff", color: "#fff", borderRadius: 999, padding: "12px 24px", fontSize: 16, fontWeight: 600 }}>Visitar</a>
                <a href="#inscripcion" style={{ textDecoration: "none", background: RED, color: "#fff", borderRadius: 999, padding: "12px 24px", fontSize: 16, fontWeight: 600 }}>Postular</a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* === HERO — foto full-bleed 885px real + columna con bloque azul medio (doble flecha) y lavanda (pétalos), texto overlay directo === */}
      <section style={{ position: "relative", display: "flex", height: "min(885px,88vh)" }}>
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <img src={HERO_PHOTO} alt="" style={{ width: "100%", height: "100%", position: "absolute", inset: 0, objectFit: "cover", filter: "saturate(0.85)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,51,102,0) 35%, rgba(20,35,55,0.75) 100%)" }} />
          {/* Un solo titular gigante real (sin eyebrow separado — la etiqueta real ES el h1), flechas prev/next circulares bottom-right junto al texto */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            style={{ position: "absolute", left: 40, right: 40, bottom: 48, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <h1 style={{ fontSize: "clamp(36px,6.5vw,68px)", fontWeight: 800, margin: 0, maxWidth: 760, lineHeight: 1.1 }}>Líderes en Educación Asincrónica Inclusiva</h1>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }} className="hidden md:flex">
              <button aria-label="Anterior" style={{ width: 44, height: 44, borderRadius: "50%", border: "1.5px solid #fff", background: "none", color: "#fff", cursor: "pointer" }}>‹</button>
              <button aria-label="Siguiente" style={{ width: 44, height: 44, borderRadius: "50%", border: "1.5px solid #fff", background: "none", color: "#fff", cursor: "pointer" }}>›</button>
            </div>
          </motion.div>
        </div>
        <div style={{ width: 314, display: "flex", flexDirection: "column" }} className="hidden md:flex">
          <motion.a href="#plataforma" whileHover={{ opacity: 0.85 }} transition={{ duration: 0.25 }} style={{ flex: 1, background: BLOCK_BLUE, position: "relative", textDecoration: "none", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <motion.div whileHover={{ x: 6 }} transition={{ duration: 0.3 }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><ShapeFastForward color={GOLD} size={100} /></motion.div>
            <div style={{ padding: "22px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", fontWeight: 700, fontSize: 17 }}>Tour Virtual <ArrowUpRight style={{ width: 20, height: 20 }} /></div>
          </motion.a>
          {/* Pinwheel de 4 cuartos rosa, como el real (2x2), sobre lavanda */}
          <motion.a href="#faq" whileHover={{ opacity: 0.85 }} transition={{ duration: 0.25 }} style={{ flex: 1, background: LAVENDER, position: "relative", textDecoration: "none", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <motion.div whileHover={{ rotate: 8 }} transition={{ duration: 0.4 }} style={{ position: "absolute", top: 14, right: 14, width: 100, height: 100, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" }}>
              {/* Un solo path (cuarto de disco, pivote en la esquina interior) espejado en las 4 celdas → pinwheel */}
              <svg viewBox="0 0 50 50"><path d="M50,50 L50,0 A50,50 0 0,0 0,50 Z" fill={PINK} /></svg>
              <svg viewBox="0 0 50 50" style={{ transform: "scaleX(-1)" }}><path d="M50,50 L50,0 A50,50 0 0,0 0,50 Z" fill={PINK} /></svg>
              <svg viewBox="0 0 50 50" style={{ transform: "scaleY(-1)" }}><path d="M50,50 L50,0 A50,50 0 0,0 0,50 Z" fill={PINK} /></svg>
              <svg viewBox="0 0 50 50" style={{ transform: "scale(-1,-1)" }}><path d="M50,50 L50,0 A50,50 0 0,0 0,50 Z" fill={PINK} /></svg>
            </motion.div>
            <div style={{ flex: 1 }} />
            <div style={{ padding: "22px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", color: NAVY, fontWeight: 700, fontSize: 17 }}>Últimas Noticias <ArrowUpRight style={{ width: 20, height: 20 }} /></div>
          </motion.a>
        </div>
      </section>

      {/* Pestañas verticales fijas al borde derecho, siempre visibles — patrón real .sticky--cta--nav */}
      <div style={{ position: "fixed", right: 0, top: "45%", zIndex: 25, display: "flex", flexDirection: "column" }} className="hidden md:flex">
        <a href="#inscripcion" style={{ background: SLATE, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", padding: "18px 10px", writingMode: "vertical-rl", textOrientation: "mixed" }}>VISITAR</a>
        <a href="#inscripcion" style={{ background: PINK, color: NAVY, textDecoration: "none", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", padding: "18px 10px", writingMode: "vertical-rl", textOrientation: "mixed" }}>POSTULAR</a>
      </div>

      {/* === INTRO — azul apagado real (no navy puro), formas literales inline (hourglass/circle/triangle/stairs/leaf/bars) === */}
      <section id="nosotros" style={{ maxWidth: 1180, margin: "0 auto", padding: "90px 24px", textAlign: "left" }}>
        <Reveal>
          <p style={{ fontSize: "clamp(26px,3.6vw,42px)", fontWeight: 500, lineHeight: 1.35, color: SLATE, margin: 0 }}>
            Somos un colegio<ShapeInline color={BLOCK_BLUE} shape={ShapeHourglass} /> 100% asincrónico en Chile<ShapeInline color={PINK} shape={ShapeCircle} /> para
            estudiantes<ShapeInline color={RED} shape={ShapeTriangle} /> desde 5° básico hasta 4° medio<ShapeInline color={PURPLE} shape={ShapeStairs} />, ofreciendo una
            preparación rigurosa y culturalmente cercana<ShapeInline color={GREEN} shape={ShapeLeaf} /> para rendir exámenes libres ante personas<ShapeInline color={GOLD} shape={ShapeBars} /> de todo Chile.
          </p>
        </Reveal>
      </section>

      {/* === PILARES — bloque de color sólido + foto, como "An Education Designed Around You" === */}
      <section style={{ background: "#f5f5f5", padding: "64px 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <Reveal>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 0, marginBottom: 48, alignItems: "stretch" }}>
              <div style={{ flex: "1 1 320px", minWidth: 260, position: "relative", minHeight: 340, overflow: "hidden" }}>
                <img src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=700&q=75" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: `${GREEN}66` }} />
                <div style={{ position: "absolute", top: 16, left: 16 }}><ShapeLeaf color={GOLD} size={70} /></div>
              </div>
              <div style={{ flex: "1 1 380px", minWidth: 280, background: "#fff", padding: "40px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" }}>Aprendizaje personalizado en Barkley</p>
                <h2 style={{ fontSize: "clamp(30px,5vw,52px)", fontWeight: 700, color: SLATE, margin: "0 0 16px" }}>Una educación diseñada en torno a ti</h2>
                <p style={{ fontSize: 15, margin: 0 }}>Barkley reconoce a cada estudiante como un individuo único. Nuestro plan se adapta a él, asegurando el apoyo académico necesario para prosperar dentro y fuera del aula.</p>
              </div>
            </div>
          </Reveal>
          {/* Carrusel real "Four Areas of Focus": una tarjeta visible + flechas + indicador, no grid estático */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <button aria-label="Anterior" onClick={() => setPilarIdx(i => (i - 1 + PILARES.length) % PILARES.length)}
              style={{ width: 44, height: 44, borderRadius: "50%", border: `1.5px solid ${SLATE}`, background: "none", color: SLATE, cursor: "pointer", flexShrink: 0 }}>‹</button>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <AnimatePresence mode="wait">
                <motion.div key={pilarIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }}
                  style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center" }}>
                  <img src={PILARES[pilarIdx].img} alt={PILARES[pilarIdx].title} style={{ flex: "1 1 320px", minWidth: 260, aspectRatio: "3/2", objectFit: "cover", borderRadius: 12, display: "block" }} />
                  <div style={{ flex: "1 1 320px", minWidth: 260 }}>
                    <h3 style={{ fontSize: "clamp(22px,2.6vw,32px)", fontWeight: 700, color: NAVY, margin: "0 0 12px" }}>{PILARES[pilarIdx].title}</h3>
                    <p style={{ fontSize: 16, margin: 0, color: TEXT }}>{PILARES[pilarIdx].text}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div style={{ display: "flex", gap: 8, marginTop: 28 }}>
                {PILARES.map((_, i) => (
                  <button key={i} aria-label={`Ir al panel ${i+1}`} onClick={() => setPilarIdx(i)}
                    style={{ width: i === pilarIdx ? 28 : 8, height: 8, borderRadius: 4, border: "none", background: i === pilarIdx ? SLATE : "#d5dbe3", cursor: "pointer", transition: "width 0.3s" }} />
                ))}
              </div>
            </div>
            <button aria-label="Siguiente" onClick={() => setPilarIdx(i => (i + 1) % PILARES.length)}
              style={{ width: 44, height: 44, borderRadius: "50%", border: `1.5px solid ${SLATE}`, background: "none", color: SLATE, cursor: "pointer", flexShrink: 0 }}>›</button>
          </div>
        </div>
      </section>

      {/* === NIVELES — panel azul sólido detrás + botón dorado debajo, como el real === */}
      <section id="metodo" style={{ padding: "64px 24px 0", textAlign: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>De 5° básico a validación de adultos</p>
        <h2 style={{ fontSize: "clamp(34px,6vw,64px)", fontWeight: 800, color: NAVY, margin: "0 0 40px" }}>Nuestro camino de aprendizaje</h2>
      </section>
      <section style={{ background: BLOCK_BLUE, padding: "48px 24px 64px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {NIVELES.map((n, i) => (
              <Reveal key={n.title} delay={i * 0.1} style={{ flex: "1 1 260px", minWidth: 240 }}>
                <motion.a href="#inscripcion" whileHover={{ scale: 1.01 }} transition={{ duration: 0.25, ease: "easeInOut" }} style={{ textDecoration: "none", color: NAVY, position: "relative", overflow: "hidden", display: "block" }}>
                  <img src={n.img} alt={n.title} loading="lazy" style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,20,50,0) 35%, rgba(0,20,50,0.9) 100%)" }} />
                  <div style={{ position: "absolute", left: 20, right: 20, bottom: 18, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{n.title}</p>
                      <p style={{ fontSize: 13, margin: "4px 0 0", opacity: 0.85, textTransform: "uppercase", letterSpacing: "0.04em" }}>{n.sub}</p>
                    </div>
                    <ArrowUpRight style={{ width: 20, height: 20, flexShrink: 0 }} />
                  </div>
                </motion.a>
              </Reveal>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <motion.a href="#plataforma" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GOLD, color: NAVY, textDecoration: "none", fontWeight: 700, fontSize: 14, letterSpacing: "0.03em", textTransform: "uppercase", borderRadius: 999, padding: "16px 32px" }}>Aprendizaje en Barkley <ArrowUpRight style={{ width: 16, height: 16 }} /></motion.a>
          </div>
        </div>
      </section>

      {/* === RAZONES — pestañas, sin testimonios fabricados con nombre === */}
      <section style={{ background: "#f5f5f5", padding: "64px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" }}>Por qué Barkley</p>
          <h2 style={{ fontSize: "clamp(34px,6vw,64px)", fontWeight: 700, color: SLATE, margin: "0 0 32px" }}>Historias que nos conectan</h2>
          <div style={{ display: "inline-flex", gap: 8, marginBottom: 40, background: "#fff", borderRadius: 999, padding: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {(["estudiantes","apoderados"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                border: "none", borderRadius: 999, padding: "10px 24px", fontSize: 14, fontWeight: 600, fontFamily: FONT, cursor: "pointer",
                background: tab === t ? NAVY : "transparent", color: tab === t ? "#fff" : TEXT, textTransform: "capitalize",
              }}>{t}</button>
            ))}
          </div>
        </div>
        {/* Grilla de miniaturas de color + tarjeta destacada con insignia circular rotando, como el módulo real de Community Stories
            (sin inventar nombres/identidades de personas reales — usamos categorías, no personas fabricadas) */}
        <Reveal>
          <div style={{ maxWidth: 1000, margin: "0 auto 40px", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "stretch" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, flex: "1 1 320px" }}>
              {[PINK, GREEN, RED, GOLD, PURPLE].map((c, i) => (
                <div key={i} style={{ background: c, aspectRatio: "1", borderRadius: 8 }} />
              ))}
            </div>
            <div style={{ flex: "1 1 380px", position: "relative", borderRadius: 12, overflow: "hidden", minHeight: 220 }}>
              <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=75" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", left: 20, bottom: 20, right: 90, background: "rgba(0,51,102,0.88)", padding: "18px 22px", borderRadius: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff" }}>
                  <ShapeFastForward color={GREEN} size={26} />
                  <span style={{ fontWeight: 700, fontSize: 20 }}>Aprendizaje personalizado</span>
                </div>
                <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.4)", margin: "10px 0" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#cfe0f5" }}>ENSEÑANZA MEDIA</span>
              </div>
              <motion.div
                animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                style={{ position: "absolute", top: 16, right: 16, width: 74, height: 74, borderRadius: "50%", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="74" height="74" viewBox="0 0 74 74">
                  <path id="circlePath" d="M 37,37 m -28,0 a 28,28 0 1,1 56,0 a 28,28 0 1,1 -56,0" fill="none" />
                  <text fontSize="9" fontWeight="700" fill="#fff" letterSpacing="2">
                    <textPath href="#circlePath">+ VER MÁS · + VER MÁS ·</textPath>
                  </text>
                </svg>
              </motion.div>
            </div>
          </div>
        </Reveal>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
          {RAZONES.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.08} style={{ flex: "1 1 260px", minWidth: 240 }}>
              <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.25, ease: "easeInOut" }} style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>{r.title}</h3>
                <p style={{ fontSize: 15, margin: 0 }}>{r.text}{tab === "apoderados" ? " Transparencia total desde el portal de apoderados." : ""}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* === FACT-BOXES — pastel real con forma grande de fondo + número gigante (verificado en vivo, no negro) === */}
      <section style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px", textAlign: "center" }}>Barkley en cifras</p>
          <h2 style={{ fontSize: "clamp(34px,6vw,60px)", fontWeight: 800, color: NAVY, margin: "0 0 40px", textAlign: "center" }}>Más que un colegio</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            {FACTS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08} style={{ flex: "1 1 260px", minWidth: 240 }}>
                <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.25, ease: "easeInOut" }} style={{ background: s.bg, borderRadius: 8, padding: "32px", position: "relative", minHeight: 260, display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden", height: "100%" }}>
                  <div style={{ position: "absolute", top: -10, right: -10, opacity: 0.9 }}><s.shape color={s.shapeColor} size={150} /></div>
                  <p style={{ fontSize: 52, fontWeight: 800, color: s.numColor, margin: 0, position: "relative" }}>{s.n}</p>
                  <p style={{ fontSize: 15, margin: "8px 0 0", color: s.numColor, opacity: 0.75, position: "relative" }}>{s.label}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* === PROGRAMAS === */}
      <section id="plataforma" style={{ background: "#f5f5f5", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" }}>Descubre y experimenta</p>
          <h2 style={{ fontSize: "clamp(34px,6vw,64px)", fontWeight: 700, color: SLATE, margin: "0 0 40px" }}>La plataforma, por dentro</h2>
          {/* Filas horizontales alternadas imagen/texto (izq-der, der-izq), como .program-box real (flex-direction row-reverse alternado) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
            {PROGRAMAS.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.05}>
                <a href={p.href} style={{ textDecoration: "none", color: TEXT, display: "flex", flexDirection: i % 2 === 0 ? "row" : "row-reverse", flexWrap: "wrap", gap: 40, alignItems: "center" }}>
                  <div style={{ flex: "1 1 420px", minWidth: 280, overflow: "hidden", borderRadius: 12 }}>
                    <motion.img src={p.img} alt={p.title} loading="lazy" whileHover={{ scale: 1.05 }} transition={{ duration: 0.4, ease: "easeInOut" }}
                      style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", display: "block" }} />
                  </div>
                  <div style={{ flex: "1 1 320px", minWidth: 260 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.03em", margin: "0 0 6px" }}>{p.title}</p>
                    <h3 style={{ fontSize: "clamp(22px,2.4vw,30px)", fontWeight: 700, color: NAVY, margin: "0 0 12px" }}>{p.sub}</h3>
                    <p style={{ fontSize: 15, margin: "0 0 16px" }}>{p.text}</p>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: NAVY }}>Ver más <ArrowUpRight style={{ width: 16, height: 16 }} /></span>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      {faqs && faqs.length > 0 && (
        <section id="faq" style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px" }}>
          <Reveal><h2 style={{ fontSize: "clamp(30px,5vw,52px)", fontWeight: 700, color: SLATE, margin: "0 0 32px" }}>Preguntas frecuentes</h2></Reveal>
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

      {/* === CTA — bloque de color sólido navy === */}
      <section style={{ backgroundColor: NAVY, color: "#fff", padding: "72px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -20, left: -20, opacity: 0.5 }}><ShapeFlower color="#ffffff22" size={140} /></div>
        <Reveal>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative" }}>
            <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 700, margin: "0 0 16px" }}>¿Quieres saber más sobre Barkley Online?</h2>
            <p style={{ fontSize: 16, opacity: 0.85, margin: "0 0 28px" }}>Déjanos tus datos y te contactamos.</p>
            <motion.button whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }} onClick={() => document.getElementById("inscripcion")?.scrollIntoView({ behavior: "smooth" })}
              style={{ fontSize: 15, fontWeight: 700, color: NAVY, background: GOLD, border: "none", borderRadius: 999, padding: "14px 30px", cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 8 }}
            >Ir al formulario de inscripción <ArrowUpRight style={{ width: 18, height: 18 }} /></motion.button>
          </div>
        </Reveal>
      </section>

      {/* === INSCRIPCIÓN === */}
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

      {/* === FOOTER — navy sólido + formas orgánicas, como el real === */}
      <footer style={{ backgroundColor: NAVY, color: "#fff", padding: "56px 24px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 30, left: -30, opacity: 0.5 }}><ShapeFlower color="#00b27355" size={120} /></div>
        <div style={{ position: "absolute", bottom: 40, left: 60, opacity: 0.6 }}><ShapeCircle color="#00b27377" size={40} /></div>
        {/* Insignia circular "Volver arriba" rotando, como .back-top real */}
        <button aria-label="Volver arriba" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ position: "absolute", right: 24, bottom: 24, width: 80, height: 80, borderRadius: "50%", background: "none", border: "1px solid rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} className="hidden md:flex">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", inset: 0 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <path id="topPath" d="M 40,40 m -32,0 a 32,32 0 1,1 64,0 a 32,32 0 1,1 -64,0" fill="none" />
              <text fontSize="9" fontWeight="700" fill="#fff" letterSpacing="2">
                <textPath href="#topPath">VOLVER ARRIBA · VOLVER ARRIBA ·</textPath>
              </text>
            </svg>
          </motion.div>
          <ArrowUpRight style={{ width: 20, height: 20, color: "#fff", transform: "rotate(-45deg)" }} />
        </button>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 32, position: "relative" }}>
          <div style={{ flex: "1 1 240px" }}>
            <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Barkley Online</p>
            <p style={{ fontSize: 14, margin: 0, lineHeight: 1.8, opacity: 0.85 }}>Colegio 100% asincrónico · Chile<br /><a href="mailto:admisiones@barkley.cl" style={{ color: "#fff" }}>admisiones@barkley.cl</a></p>
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Enlaces útiles</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6, fontSize: 14, opacity: 0.85 }}>
              <li><a href="#metodo" style={{ color: "#fff" }}>El método</a></li>
              <li><a href="#plataforma" style={{ color: "#fff" }}>La plataforma</a></li>
              <li><a href="#faq" style={{ color: "#fff" }}>Preguntas frecuentes</a></li>
              <li><a href="#inscripcion" style={{ color: "#fff" }}>Inscripción</a></li>
            </ul>
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Contacto directo</p>
            <button onClick={() => setCallOpen(true)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT, fontSize: 14, color: "#fff", opacity: 0.85 }}>Agendar llamada</button>
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Validación oficial</p>
            <p style={{ fontSize: 13, margin: 0, opacity: 0.75 }}>Preparación para Exámenes Libres ante el Ministerio de Educación de Chile (MINEDUC).</p>
          </div>
        </div>
        <div style={{ maxWidth: 1280, margin: "32px auto 0", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, position: "relative" }}>
          <p style={{ fontSize: 13, opacity: 0.6, margin: 0 }}>© {new Date().getFullYear()} Barkley Online</p>
          <div style={{ display: "flex", gap: 16, fontSize: 13, opacity: 0.85 }}>
            <a href="/privacidad" style={{ color: "#fff" }}>Privacidad</a>
            <a href="/terminos" style={{ color: "#fff" }}>Términos de uso</a>
          </div>
        </div>
      </footer>

      <ReservationDialog open={callOpen} onOpenChange={setCallOpen} />
    </div>
  );
}
