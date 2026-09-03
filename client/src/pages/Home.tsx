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
  Loader2, Check, ArrowUpRight, Menu, X, Search, Play, Download,
  Hourglass, Circle, Triangle, Star, Heart, Leaf, Rows3, ChevronsRight,
  Layers, BookOpen, Headphones, Image as ImageIcon, ListChecks, Sparkles,
  Lock, CheckCircle2, ArrowDown, CalendarCheck, CalendarClock, Instagram, Zap, Home as HomeIcon,
} from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/ibarkley.cl";
const TIKTOK_URL = "https://www.tiktok.com/@barkleyonline";

// Ícono TikTok — lucide-react no lo incluye, SVG del logotipo oficial simplificado.
function TikTokIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M16.6 5.82a4.28 4.28 0 0 1-3.14-1.4 4.29 4.29 0 0 1-1-2.7h-3.06v13.5a2.6 2.6 0 1 1-1.83-2.48v-3.1a5.66 5.66 0 1 0 4.89 5.6V9.17a7.3 7.3 0 0 0 4.14 1.29z"/>
    </svg>
  );
}
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReservationDialog } from "@/components/ReservationDialog";
import { SiteHeader } from "@/components/SiteHeader";

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

// Demo del tutor IA — chat en vivo (no un video): se tipea solo al entrar en pantalla,
// para transmitir "esto está funcionando ahora" en vez de "mira esta grabación".
// Fiel al comportamiento real de la plataforma (AiTutorService + NVIDIA NIM): el tutor
// IA no es un chat libre, aparece solo cuando el sistema detecta reprobación real.
// Guion socrático real: la IA nunca da la respuesta de entrada — hace una pregunta
// guía, deja que el alumno razone, y recién confirma la regla al final. Así es como
// el system prompt de AiTutorService lo exige ("guíalo a entender, no resuelvas por él").
export const IA_BARKLEY_SCRIPT: { role: "student" | "ia"; text: string }[] = [
  { role: "student", text: "No entiendo por qué 3/4 es más grande que 2/4 🥲" },
  { role: "ia", text: "Buena pregunta. Si divides una pizza en 4 partes iguales, ¿qué tan grande es cada pedazo comparado con la pizza completa?" },
  { role: "student", text: "Es más chico, como un cuarto de toda la pizza" },
  { role: "ia", text: "Exacto. Ahora dime: si te comes 3 de esos pedazos, ¿comiste más o menos que si te comes solo 2?" },
  { role: "student", text: "Más, porque comí más pedazos" },
  { role: "ia", text: "¡Ahí está! Cuando el denominador es igual, gana la fracción con más numerador — porque representa más pedazos comidos. Por eso 3/4 > 2/4. ¿Intentamos con 5/8 y 3/8?" },
];

// Widget de chat en vivo (no un video): tamaño 100% fijo — ancho y alto no cambian
// mientras el texto se tipea; el área de mensajes tiene scroll interno propio.
export function IaBarkleyChatWidget({ script = IA_BARKLEY_SCRIPT, width = 440 }: { script?: typeof IA_BARKLEY_SCRIPT; width?: number }) {
  const [started, setStarted] = useState(false);
  const [shown, setShown] = useState<{ role: "student" | "ia"; text: string }[]>([]);
  const [typing, setTyping] = useState<{ role: "student" | "ia"; text: string } | null>(null);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!started) return;
    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      for (const turn of script) {
        if (cancelled) return;
        if (turn.role === "ia") {
          setThinking(true);
          await sleep(900);
          if (cancelled) return;
          setThinking(false);
        } else {
          await sleep(500);
        }
        setTyping({ role: turn.role, text: "" });
        const speed = turn.role === "student" ? 30 : 14;
        for (let i = 1; i <= turn.text.length; i++) {
          if (cancelled) return;
          setTyping({ role: turn.role, text: turn.text.slice(0, i) });
          await sleep(speed);
        }
        if (cancelled) return;
        setShown((prev) => [...prev, turn]);
        setTyping(null);
        await sleep(280);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [started, script]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [shown, typing, thinking]);

  const Bubble = ({ role, text }: { role: "student" | "ia"; text: string }) =>
    role === "student" ? (
      <div style={{ alignSelf: "flex-end", maxWidth: "82%", width: "fit-content", background: GOLD, color: NAVY, borderRadius: "14px 14px 3px 14px", padding: "10px 14px", fontSize: 14, fontWeight: 600, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
        {text}
      </div>
    ) : (
      <div style={{ alignSelf: "flex-start", maxWidth: "88%", width: "fit-content", background: "#fff", border: `1px solid ${SLATE}22`, color: TEXT, borderRadius: "14px 14px 14px 3px", padding: "12px 16px", fontSize: 14, lineHeight: 1.5, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
        {text}
      </div>
    );

  return (
    <motion.div
      viewport={{ once: true, amount: 0.5 }}
      onViewportEnter={() => setStarted(true)}
      // `minWidth: width` forzaba 440px incluso en pantallas de 390: el widget
      // desbordaba y la página se deslizaba de lado. Ahora se encoge y 440 es el tope.
      style={{ width: "100%", maxWidth: width, minWidth: 0, boxSizing: "border-box", background: "#fff", borderRadius: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}
    >
      <div style={{ background: NAVY, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: NAVY, fontSize: 14, flexShrink: 0 }}>IA</div>
        <div>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>IA Barkley</p>
          <p style={{ color: "#8fb0d9", fontSize: 11, margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, display: "inline-block" }} /> Activo — detectó dificultad real
          </p>
        </div>
      </div>
      <div
        ref={scrollRef}
        style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", height: 400, maxHeight: 400, overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 12, background: "#f5f7fa" }}
      >
        {shown.map((m, i) => <Bubble key={i} role={m.role} text={m.text} />)}
        {thinking && (
          <div style={{ alignSelf: "flex-start", background: "#e3e8ef", borderRadius: "14px 14px 14px 3px", padding: "10px 16px", fontSize: 13, color: SLATE, fontWeight: 700 }}>
            IA Barkley está escribiendo…
          </div>
        )}
        {typing && <Bubble role={typing.role} text={typing.text} />}
      </div>
    </motion.div>
  );
}

function IaBarkleyDemo() {
  return <IaBarkleyChatWidget />;
}

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
const BLOCK_BLUE = "#4a7be0";
const PURPLE_PANEL = "#861fce"; // morado saturado real del panel "Latest News" (medido en vivo)
const VIVID_BLUE = "#0b63e5"; // azul vivo real de las secciones Learning Journey / Stories

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

const HERO_PHOTO = "/images/hero-estudiante.webp";

// Consolidado: antes existían PILARES (carrusel) y RAZONES (tarjetas) diciendo
// casi lo mismo con otras palabras — un apoderado leía "sin horario fijo" y
// "el tutor no dicta clase" tres veces seguidas en el scroll. Un solo array,
// mostrado una vez en grid estático (visible completo, sin carrusel que oculte
// 3 de los 4 puntos detrás de una flecha).
const PILARES = [
  { title: "Tu ritmo, no el nuestro", img: "/images/rutas-flexibles.webp", text: "No hay un horario que cumplir ni una clase que no puedes recuperar: decides cuándo estudias, a qué hora y en qué orden. Un asesor sigue tu progreso completo de principio a fin. Lo único fijo es la fecha del examen libre ante el Ministerio de Educación — todo lo demás lo organizas tú." },
  { title: "Aprendizaje por Dominio", img: "/images/metodologia.webp", text: "Trabajamos con Mastery Learning, el modelo de Benjamin Bloom (Harvard, 1968): cada unidad se desbloquea solo si dominas la anterior — video corto, práctica, y si te cuesta, refuerzo antes de seguir. Sin saltos, sin huecos." },
  { title: "El tutor aparece cuando lo necesitas", img: "/images/acompanamiento.webp", text: "No es una clase obligatoria ni algo que pides por capricho: el sistema detecta cuando estás con dificultad real en una asignatura, y ahí aparece la ayuda — no antes, no como un horario más que administrar." },
  { title: "Tu progreso, medido de verdad", img: "/images/plataforma-pilar.webp", text: "Cada intento, cada puntaje, cada unidad completada queda registrado por Umbral™, nuestro motor de progreso — no son solo impresiones. Si tu perfil de aprendizaje es TDAH o dislexia, el contenido se adapta automáticamente (programa Adaptativo). Y siempre hay un asesor humano revisando cómo vas, no solo un algoritmo mirando de lejos." },
];

// Solo Básica y Media en el módulo de niveles del home — Validación de Adultos existe como
// producto pero no se anuncia con el mismo peso: mezclarlo en primer scroll con el mismo tamaño
// que Básica/Media puede leerse como "colegio remedial" a ojos de un apoderado buscando algo
// aspiracional para su hijo. Los competidores (Colegio Online LAT, Instituto Virtual de Chile)
// separan la marca de adultos de la marca K-12 por la misma razón.
const NIVELES = [
  { title: "Enseñanza Básica", sub: "1° a 8° Básico", img: "/images/ensenanza-basica.webp" },
  { title: "Enseñanza Media", sub: "1° a 4° Medio", img: "/images/ensenanza-media.webp" },
];

// Inclusión: el mismo colegio, adaptado a necesidades específicas (sin ser "especializado")
const INCLUSIVOS = [
  { title: "TDAH", desc: "Flexibilidad real: sin hora fija, con ritmo propio y tutor dedicado.", url: "https://claude.ai/code/artifact/c655e492-30b2-44ba-9230-2797ccda2b52", icon: Sparkles },
  { title: "Deportistas", desc: "Para atletas de alto rendimiento: exámenes flexibles, sin asistencia obligatoria.", url: "https://claude.ai/code/artifact/18187b86-35ea-4533-8ea9-54184740f45e", icon: Zap },
  { title: "NEE", desc: "Inclusión real: dislexia, autismo, discapacidad. Adaptaciones desde el diseño.", url: "https://claude.ai/code/artifact/bcdd2509-10cf-4aac-a7d6-b682a9761954", icon: Heart },
  { title: "Exámenes Libres", desc: "Preparación completa para validación oficial MINEDUC, a tu ritmo.", url: "https://claude.ai/code/artifact/32af95e8-9524-4d39-9601-1df2af66463f", icon: CheckCircle2 },
  { title: "Homeschool", desc: "Currículum oficial ya armado, sin diseñar el plan de estudio desde cero.", url: "https://claude.ai/code/artifact/ac137c4e-2002-41f0-9802-ce1f0de6f372", icon: HomeIcon },
];

// Fact-boxes: fondo negro real, glifo grande de color arriba a la derecha (patrón exacto de .fact-box)
// Pastel real: bg claro + chevron/forma grande como marca de agua + número gigante (no negro con ícono chico)
const FACTS = [
  { n: "100%", label: "Asincrónico", shape: ShapeFastForward, bg: "#fdeccb", numColor: NAVY, shapeColor: "#fbd98a" },
  { n: "1°–4°", label: "Básico a Medio", shape: ShapeStairs, bg: "#d9ecff", numColor: NAVY, shapeColor: "#a9d3ff" },
  { n: "6", label: "Asignaturas evaluadas", shape: ShapeHourglass, bg: "#e3d9f7", numColor: NAVY, shapeColor: "#c6b3ea" },
  { n: "2027", label: "Año académico de apertura", shape: ShapeLeaf, bg: "#d7f0e3", numColor: NAVY, shapeColor: "#a9dfc3" },
];

// Solo lo que NO está ya cubierto en el grid consolidado de arriba (PILARES):
// metodología, plataforma y acompañamiento se explican una sola vez, ahí.
// Acá solo lo que es genuinamente nuevo en esta sección.
const PROGRAMAS = [
  { title: "Certificación", sub: "Exámenes libres MINEDUC", text: "Validación oficial ante el Ministerio de Educación de Chile, desde 1° básico a 4° medio.", img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=700&q=75", href: "#metodo" },
  { title: "Familias", sub: "Portal Familia", text: "Transparencia total, sin preguntar cómo le fue: promedio general, avance por asignatura, días de estudio del mes y tutorías tomadas, en un panel que se actualiza solo. Lee los mensajes del asesor y ve qué entregas están en revisión — todo en modo observador, sin interferir en su proceso.", img: "/images/portal-familia.webp", href: "#inscripcion" },
];

// Servicios que vienen incluidos en la matrícula, más allá de las clases. Se
// presentan en presente porque forman parte del programa 2027 al que la familia
// se está inscribiendo — el acceso a la plataforma abre en enero de 2027.
const SERVICIOS = [
  {
    n: "01",
    titulo: "Diagnóstico de Partida",
    lead: "Antes de avanzar, sabemos exactamente dónde está.",
    texto: "Al matricularse, cada estudiante rinde un diagnóstico por asignatura que detecta vacíos de años anteriores. Si algo quedó débil en el pasado, la plataforma agrega nivelación antes de partir. Nadie construye sobre lagunas.",
    color: GOLD,
    Icon: Search,
  },
  {
    n: "02",
    titulo: "Corrección Humana de Escritura",
    lead: "Sus ensayos los lee una persona, no un algoritmo.",
    texto: "Los trabajos escritos se envían por la plataforma y un profesor los devuelve corregidos, con comentarios personalizados y en pocos días. Escribir bien no se aprende con alternativas.",
    color: PINK,
    Icon: BookOpen,
  },
  {
    n: "03",
    titulo: "Orientación a Educación Superior",
    lead: "El egreso no es el final. Es el puente.",
    texto: "En 3° y 4° medio hay un orientador que acompaña la elección de carrera, el calendario PAES y la postulación centralizada. Hasta que la universidad diga que sí.",
    color: GREEN,
    Icon: ArrowUpRight,
  },
  {
    n: "04",
    titulo: "Certificados de Avance",
    lead: "El progreso, en un documento formal, cuando lo necesites.",
    texto: "Desde el Portal Familia se descarga en cualquier momento un certificado con notas y avance, con código de verificación. Para trámites, viajes o lo que la vida pida.",
    color: BLOCK_BLUE,
    Icon: Download,
  },
  {
    n: "05",
    titulo: "Barkley En Vivo",
    lead: "Sin horarios… salvo el que vas a querer tener.",
    texto: "Una transmisión periódica y opcional: ciencia entretenida, actualidad, invitados. Queda grabada, nadie está obligado, todos son bienvenidos. Cada uno estudia a su ritmo, pero hay momentos para encontrarse.",
    color: RED,
    Icon: Play,
  },
  {
    n: "06",
    titulo: "Verano Barkley",
    lead: "El año escolar tiene segunda oportunidad.",
    texto: "En enero y febrero, programas cortos de nivelación y reforzamiento. Para quien llega atrasado, para quien quiere rendir antes, para quien no está dispuesto a perder el año.",
    color: PURPLE,
    Icon: CalendarCheck,
  },
  {
    n: "07",
    titulo: "Electivos Barkley",
    lead: "El currículum es el piso, no el techo.",
    texto: "Además del temario oficial: programación, inglés avanzado, educación financiera, arte. Mismo formato de video y práctica, con certificado propio. Cumplir con el colegio es el comienzo.",
    color: SLATE,
    Icon: Sparkles,
  },
];

interface Faq { id: string; question: string; answer: string; sortOrder: number; isActive?: boolean; }

function ShapeInline({ color, shape: Shape }: { color: string; shape: typeof ShapeCircle }) {
  return <span style={{ display: "inline-block", margin: "0 4px", verticalAlign: "middle", transform: "translateY(2px)" }}><Shape color={color} size={28} /></span>;
}

// Bloque de admisión — headline potente + formulario. Se repite dos veces en el
// home (mitad de página y al final): solo la instancia de más abajo lleva el
// anchorId "inscripcion" al que apunta el nav, para no duplicar el id="" en el DOM.
function AdmisionSection({ anchorId }: { anchorId?: string }) {
  return (
    <section id={anchorId} style={{ background: NAVY, position: "relative", overflow: "hidden", padding: "80px 24px" }}>
      <div style={{ position: "absolute", top: -60, right: -60, opacity: 0.12 }}><ShapeFlower color="#FFC548" size={220} /></div>
      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", display: "flex", flexWrap: "wrap", gap: 44, alignItems: "center" }}>
        <div style={{ flex: "1 1 380px", minWidth: 280 }}>
          <span style={{ display: "inline-block", background: GOLD, color: NAVY, fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: "7px 18px", borderRadius: 999, marginBottom: 20 }}>
            Admisión 2027
          </span>
          <h2 style={{ fontSize: "clamp(38px,6vw,64px)", fontWeight: 800, color: "#fff", margin: "0 0 16px", lineHeight: 1.05 }}>
            Inscríbete ahora.
          </h2>
          <p style={{ fontSize: "clamp(18px,2.4vw,23px)", fontWeight: 600, color: "#cfe0f5", margin: "0 0 6px", lineHeight: 1.4 }}>
            Sin compromiso, sin costo hoy — <span style={{ color: GOLD }}>pagas recién en febrero de 2027</span>.
          </p>
          <p style={{ fontSize: 15, color: "#9db3cf", margin: 0 }}>Cupos limitados para el año académico 2027. No hay matrícula disponible para el año en curso.</p>
        </div>
        <div style={{ flex: "1 1 460px", minWidth: 300, maxWidth: 560, background: "#fff", borderRadius: 24, padding: "44px 40px", boxShadow: "0 32px 80px rgba(0,0,0,0.35)", border: `1px solid rgba(255,255,255,0.08)` }}>
          <InscripcionForm />
        </div>
      </div>
    </section>
  );
}

/**
 * Medición del embudo. Anónima: el id vive en sessionStorage (se borra al cerrar
 * la pestaña), no hay cookies ni datos personales, así que no requiere banner de
 * consentimiento. Si la medición falla, no pasa nada — nunca debe romper el
 * formulario, que es lo único que de verdad importa acá.
 */
function medir(step: "llega_pagina" | "ve_formulario" | "empieza_formulario" | "envia_formulario") {
  try {
    let sid = sessionStorage.getItem("bk_sid");
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("bk_sid", sid);
    }
    // Solo el dominio de origen, nunca la URL completa de donde viene.
    let source = "directo";
    if (document.referrer) {
      try {
        const h = new URL(document.referrer).hostname;
        source = h.includes(location.hostname) ? "interno" : h;
      } catch { /* referrer malformado: queda como directo */ }
    }
    const body = JSON.stringify({ step, path: location.pathname, source, sessionId: sid });
    // sendBeacon sobrevive a que el usuario cierre la pestaña justo después.
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    else fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch { /* la medición jamás debe interrumpir la página */ }
}

// Pasos del formulario tipo wizard: una pregunta a la vez, menos fricción que
// un formulario largo tradicional. El apoderado/estudiante avanza con Enter o
// clic, ve su progreso, y puede volver atrás. Los campos opcionales (perfil de
// aprendizaje, consultas) se agrupan al final para no interrumpir el impulso inicial.
type StepId = "name" | "email" | "level" | "learningProfile" | "confirmYear" | "notes";
const STEPS: StepId[] = ["name", "email", "level", "learningProfile", "confirmYear", "notes"];

function InscripcionForm() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("");
  const [learningProfile, setLearningProfile] = useState("");
  const [confirmedYear, setConfirmedYear] = useState(false);
  const [notes, setNotes] = useState("");
  const [st, setSt] = useState<"idle"|"loading"|"success"|"error"|"duplicate">("idle");
  const [err, setErr] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const empezado = useRef(false);

  // "Vio el formulario": entró al viewport. Distingue a quien llegó a la página
  // de quien de verdad bajó hasta la inscripción.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          medir("ve_formulario");
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const marcarInicio = () => {
    if (empezado.current) return;
    empezado.current = true;
    medir("empieza_formulario");
  };

  const submit = async () => {
    setSt("loading"); setErr("");
    try {
      const res = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, name: name||undefined, levelInterest: level||undefined, learningProfileInterest: learningProfile||undefined, notes: notes||undefined, cohortYear: "2027" }) });
      const d = await res.json();
      if (!res.ok) { setErr(d.message||"Error"); setSt("error"); return; }
      setSt(d.alreadySubscribed ? "duplicate" : "success");
      medir("envia_formulario");
    } catch { setErr("Sin conexión"); setSt("error"); }
  };

  if (st === "success" || st === "duplicate") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "40px 0" }}>
      <Check style={{ width: 32, height: 32, color: NAVY }} />
      <p style={{ fontSize: 24, fontWeight: 600, margin: 0, color: NAVY }}>{st === "duplicate" ? "Ya tenemos tu inscripción." : "Inscripción recibida."}</p>
      <p style={{ fontSize: 16, opacity: 0.7, margin: 0 }}>Un asesor te contactará a la brevedad.</p>
    </div>
  );

  const inp: React.CSSProperties = { border: "1px solid #d5dbe3", borderRadius: 8, background: "#fff", fontSize: 18, padding: "14px 16px", outline: "none", width: "100%", fontFamily: FONT, color: TEXT };
  const stepId = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const requiredOk = stepId === "name" ? name.trim().length > 0 : stepId === "email" ? /\S+@\S+\.\S+/.test(email) : stepId === "confirmYear" ? confirmedYear : true;

  const goNext = () => {
    marcarInicio();
    if (!requiredOk) return;
    if (isLast) { submit(); return; }
    setStep((s) => s + 1);
  };
  const goBack = () => step > 0 && setStep((s) => s - 1);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && stepId !== "notes") { e.preventDefault(); goNext(); }
  };

  const QUESTION: Record<StepId, string> = {
    name: "¿Cómo te llamas?",
    email: "¿Cuál es tu correo electrónico?",
    level: "¿Qué nivel te interesa?",
    learningProfile: "¿Tiene TDAH o dislexia?",
    confirmYear: "Antes de continuar",
    notes: "¿Alguna pregunta para nuestro equipo?",
  };

  return (
    <div ref={wrapRef} onKeyDown={onKeyDown} style={{ display: "flex", flexDirection: "column", gap: 28, minHeight: 360 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Postulación 2027
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: SLATE, fontVariantNumeric: "tabular-nums" }}>
          {step + 1} / {STEPS.length}
        </span>
      </div>
      {/* Barra de progreso — señal de avance, clave en formularios multi-paso */}
      <div style={{ display: "flex", gap: 6, marginTop: -16 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= step ? RED : "#e5e5e5", transition: "background 0.3s" }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stepId}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}
        >
          <label style={{ fontSize: 30, fontWeight: 800, color: NAVY, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            {QUESTION[stepId]}
            {(stepId === "learningProfile" || stepId === "notes") && (
              <span style={{ display: "block", fontSize: 15, fontWeight: 400, opacity: 0.6, marginTop: 6 }}>
                {stepId === "learningProfile" ? "Opcional — programa Adaptativo" : "Opcional"}
              </span>
            )}
          </label>

          {stepId === "name" && (
            <input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre completo" style={inp} data-testid="input-name" />
          )}
          {stepId === "email" && (
            <input autoFocus type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com" style={inp} data-testid="input-email" />
          )}
          {stepId === "level" && (
            <select autoFocus value={level} onChange={e=>setLevel(e.target.value)} style={{ ...inp, cursor: "pointer" }} data-testid="select-level">
              <option value="">Selecciona un nivel</option>
              {["1° Básico","2° Básico","3° Básico","4° Básico","5° Básico","6° Básico","7° Básico","8° Básico","1° Medio","2° Medio","3° Medio","4° Medio","Validación adulto"].map(l=><option key={l} value={l}>{l}</option>)}
            </select>
          )}
          {stepId === "learningProfile" && (
            <select autoFocus value={learningProfile} onChange={e=>setLearningProfile(e.target.value)} style={{ ...inp, cursor: "pointer" }} data-testid="select-learning-profile">
              <option value="">Prefiero no decir / no aplica</option>
              <option value="tdah">TDAH</option>
              <option value="dislexia">Dislexia</option>
              <option value="tea">TEA (autismo)</option>
              <option value="motor">Dificultades motoras</option>
              <option value="ambos">TDAH y dislexia</option>
            </select>
          )}
          {stepId === "confirmYear" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#fff8ea", border: `1px solid ${GOLD}`, borderRadius: 10, padding: "16px 18px" }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: NAVY }}>Cupos disponibles solo para Admisión 2027.</p>
                <p style={{ margin: "6px 0 0", fontSize: 14, color: TEXT }}>No hay matrícula disponible para el año en curso (2026). Esta postulación reserva un cupo para el ciclo académico que comienza en 2027.</p>
              </div>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 15 }}>
                <input
                  autoFocus
                  type="checkbox"
                  checked={confirmedYear}
                  onChange={e => setConfirmedYear(e.target.checked)}
                  style={{ width: 20, height: 20, marginTop: 2, cursor: "pointer", flexShrink: 0 }}
                  data-testid="checkbox-confirm-year"
                />
                <span>Entiendo y confirmo que esta postulación es para <strong>Admisión 2027</strong>, no para el año en curso.</span>
              </label>
            </div>
          )}
          {stepId === "notes" && (
            <textarea autoFocus value={notes} onChange={e=>setNotes(e.target.value)} placeholder="¿Tienes alguna pregunta para nuestro equipo?" rows={3}
              style={{ ...inp, resize: "vertical", fontFamily: FONT }} data-testid="input-notes" />
          )}
        </motion.div>
      </AnimatePresence>

      {st==="error" && <p style={{ color: RED, fontSize: 14, margin: 0 }}>{err}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {step > 0 && (
          <button type="button" onClick={goBack} style={{ background: "none", border: "none", color: SLATE, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT, padding: "10px 4px" }}>
            ← Atrás
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={st==="loading" || !requiredOk}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 16, fontWeight: 600, background: RED, color: "#fff", border: "none", borderRadius: 999, padding: "14px 28px", cursor: requiredOk ? "pointer" : "not-allowed", fontFamily: FONT, opacity: (st==="loading" || !requiredOk) ? 0.5 : 1 }}
        >
          {st==="loading" ? <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" /> : isLast ? <>Quiero inscribirme <ArrowUpRight style={{ width: 18, height: 18 }} /></> : <>Siguiente <ArrowUpRight style={{ width: 18, height: 18 }} /></>}
        </button>
      </div>
      <p style={{ fontSize: 13, opacity: 0.6, margin: 0 }}>Reserva ahora, sin costo — pagas recién en febrero de 2027</p>
    </div>
  );
}

// Tour del producto — capturas REALES del piloto (no mockups), para que el visitante
// conozca la plataforma sin registrarse. Modal con 4 slides.
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

function TourModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  // El modal queda montado (AnimatePresence controla la visibilidad); reinicia al paso 1 en cada apertura.
  useEffect(() => { if (open) setIdx(0); }, [open]);
  const slide = TOUR_SLIDES[idx];
  const last = TOUR_SLIDES.length - 1;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,20,45,0.82)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <motion.div
            initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 18, maxWidth: 880, width: "100%", overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
            <div style={{ position: "relative", background: "#eef1f5" }}>
              <img src={slide.img} alt={slide.title} loading="lazy" style={{ width: "100%", display: "block", aspectRatio: "1280 / 820", objectFit: "cover" }} />
              <button aria-label="Cerrar" onClick={onClose}
                style={{ position: "absolute", top: 14, right: 14, width: 38, height: 38, borderRadius: "50%", background: "rgba(0,20,45,0.7)", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X style={{ width: 20, height: 20 }} />
              </button>
              <span style={{ position: "absolute", top: 16, left: 18, background: GOLD, color: NAVY, fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "5px 12px", letterSpacing: "0.03em" }}>
                Plataforma real · paso {idx + 1} de {TOUR_SLIDES.length}
              </span>
            </div>
            <div style={{ padding: "28px 32px 26px" }}>
              <h3 style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 600, color: NAVY, margin: "0 0 10px" }}>{slide.title}</h3>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: TEXT, margin: "0 0 22px" }}>{slide.text}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {TOUR_SLIDES.map((_, i) => (
                    <button key={i} aria-label={`Ir al paso ${i+1}`} onClick={() => setIdx(i)}
                      style={{ width: i === idx ? 26 : 9, height: 9, borderRadius: 5, border: "none", background: i === idx ? NAVY : "#d5dbe3", cursor: "pointer", transition: "width 0.3s" }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {idx > 0 && (
                    <button onClick={() => setIdx(i => Math.max(0, i - 1))}
                      style={{ fontSize: 15, fontWeight: 600, color: NAVY, background: "none", border: `1.5px solid ${NAVY}`, borderRadius: 999, padding: "10px 22px", cursor: "pointer", fontFamily: FONT }}>
                      Anterior
                    </button>
                  )}
                  {idx < last ? (
                    <button onClick={() => setIdx(i => Math.min(last, i + 1))}
                      style={{ fontSize: 15, fontWeight: 600, color: "#fff", background: NAVY, border: "none", borderRadius: 999, padding: "10px 24px", cursor: "pointer", fontFamily: FONT }}>
                      Siguiente →
                    </button>
                  ) : (
                    <a href="#inscripcion" onClick={onClose}
                      style={{ fontSize: 15, fontWeight: 600, color: "#fff", background: RED, border: "none", borderRadius: 999, padding: "10px 24px", cursor: "pointer", fontFamily: FONT, textDecoration: "none" }}>
                      Quiero inscribirme →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// EL MÉTODO — el gancho central de Barkley. Sin clases en vivo, el método las suple.
// Módulo dedicado, muy visual, con pasos en auto-play. Nombre real (Mastery Learning),
// fundamento (Bloom/Harvard) y quiénes lo usan en el mundo (colegios reales licenciados).
const METODO_PASOS = [
  { n: "01", title: "Aprendes", text: "Cada objetivo del temario oficial viene con 2 a 3 videos y sus pódcasts. Ves, escuchas, pausas y repites — a tu ritmo, cuando tu día lo permite.", color: GOLD },
  { n: "02", title: "Practicas", text: "Ejercicios que se corrigen solos, al instante. Sabes de inmediato si entendiste, sin esperar a que un profesor revise la próxima semana.", color: GREEN },
  { n: "03", title: "Refuerzas", text: "¿Te costó? Antes de seguir, refuerzo del mismo tema. Nadie avanza arrastrando vacíos — el error se corrige en el momento, no meses después.", color: PINK },
  { n: "04", title: "Dominas", text: "Evaluación de la unidad. Umbral™ verifica que tengas 70% o más antes de desbloquear la siguiente. Avanzas porque de verdad dominaste, no porque pasó el calendario.", color: RED },
];

function MetodoModule() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx(i => (i + 1) % METODO_PASOS.length), 4200);
    return () => clearInterval(t);
  }, [paused]);
  const paso = METODO_PASOS[idx];
  return (
    <section id="metodo-barkley" style={{ background: NAVY, color: "#fff", padding: "88px 24px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -40, right: -40, opacity: 0.06 }}><ShapeFastForward color="#fff" size={280} /></div>
      <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative" }}>
        {/* Orden pensado como AIDA: primero el nombre propio y memorable (Umbral)
            que engancha, después la autoridad científica (Bloom/Harvard) que
            cierra la confianza — un apoderado scrolleando responde primero a un
            concepto pegajoso, la ciencia detrás es lo que sostiene esa primera
            impresión, no lo que la genera. */}
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>Nuestro método · lo que nos hace distintos</p>
            <h2 style={{ fontSize: "clamp(34px,6vw,60px)", fontWeight: 600, margin: "10px 0 6px" }}>Umbral<sup style={{ fontSize: "0.35em", fontWeight: 600, marginLeft: 2 }}>™</sup></h2>
            <p style={{ fontSize: 16, opacity: 0.8, margin: 0 }}>
              El motor que decide cuándo estás listo para avanzar — basado en <em>Mastery Learning</em>, el modelo de <strong style={{ color: "#fff" }}>Benjamin Bloom</strong>, Universidad de Harvard, 1968.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p style={{ fontSize: "clamp(17px,2.2vw,20px)", lineHeight: 1.6, textAlign: "center", maxWidth: 760, margin: "24px auto 48px", opacity: 0.92 }}>
            No tenemos clases en vivo — y esa es una ventaja. En una clase por Zoom, todos avanzan al mismo ritmo aunque no entiendan, y el que se queda atrás, se queda atrás. Con Umbral<sup style={{ fontSize: "0.6em" }}>™</sup>, <strong style={{ color: GOLD }}>cada estudiante avanza solo cuando de verdad domina el tema</strong>. Nadie arrastra vacíos.
          </p>
        </Reveal>

        {/* Los 4 pasos en auto-play */}
        <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "clamp(28px,5vw,48px)", minHeight: 220 }}>
          <AnimatePresence mode="wait">
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: "flex", flexWrap: "wrap", gap: "clamp(20px,4vw,44px)", alignItems: "center" }}>
              <span style={{ fontSize: "clamp(64px,12vw,120px)", fontWeight: 800, color: paso.color, lineHeight: 0.9, flexShrink: 0 }}>{paso.n}</span>
              <div style={{ flex: "1 1 320px", minWidth: 260 }}>
                <h3 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 600, margin: "0 0 12px" }}>{paso.title}</h3>
                <p style={{ fontSize: "clamp(16px,2vw,19px)", lineHeight: 1.6, opacity: 0.9, margin: 0 }}>{paso.text}</p>
              </div>
            </motion.div>
          </AnimatePresence>
          <div style={{ display: "flex", gap: 8, marginTop: 32, justifyContent: "center" }}>
            {METODO_PASOS.map((p, i) => (
              <button key={p.n} aria-label={`Paso ${i+1}: ${p.title}`} onClick={() => setIdx(i)}
                style={{ width: i === idx ? 40 : 12, height: 6, borderRadius: 3, border: "none", background: i === idx ? GOLD : "rgba(255,255,255,0.25)", cursor: "pointer", transition: "width 0.3s, background 0.3s" }} />
            ))}
          </div>
        </div>

        {/* Fundamento + quiénes lo usan en el mundo */}
        <Reveal delay={0.15}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 40 }}>
            <div style={{ flex: "1 1 300px", background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "24px 26px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>El respaldo científico</p>
              <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.9, margin: 0 }}>
                El "Problema de las 2 Sigma" de Bloom (1984) demostró que un estudiante con dominio y apoyo personalizado rinde muy por encima del promedio de una clase tradicional. Ese es el principio que aplicamos.
              </p>
            </div>
            <div style={{ flex: "1 1 300px", background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "24px 26px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Quiénes lo usan en el mundo</p>
              <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.9, margin: 0 }}>
                Colegios online líderes de EE.UU. como <strong style={{ color: "#fff" }}>Acellus Academy</strong> y <strong style={{ color: "#fff" }}>Edmentum / Apex Learning</strong> educan con este mismo método. En Chile, somos los primeros en traerlo — con video, podcast y tutor incluidos.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  const [callOpen, setCallOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);
  const { data: faqs } = useQuery<Faq[]>({ queryKey: ["/api/faqs"], staleTime: 5*60*1000 });

  // Botón flotante de volver arriba: aparece tras pasar una pantalla de scroll,
  // visible en toda la página (no solo al llegar al footer) y en cualquier dispositivo.
  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Primer escalón del embudo. Una sola vez por sesión, no por render.
  useEffect(() => {
    if (sessionStorage.getItem("bk_llegada")) return;
    sessionStorage.setItem("bk_llegada", "1");
    medir("llega_pagina");
  }, []);

  // Chrome restaura la posición de scroll de la pestaña al recargar una SPA,
  // lo que hace parecer que la página siempre abre "al final". Forzamos el
  // comportamiento estándar de sitio nuevo: arriba, salvo que la URL apunte
  // a un ancla específica (#inscripcion, #faq, etc.).
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div style={{ backgroundColor: "#fff", color: TEXT, fontFamily: FONT, fontSize: 16, lineHeight: 1.8 }}>

      {/* Organization schema: le da a buscadores e IA una entidad de marca clara
          (nombre, logo) en vez de solo texto — mejora que te citen por nombre. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            name: "Barkley Online",
            alternateName: "Barkley",
            url: "https://www.barkleyinstituto.cl/",
            logo: "https://www.barkleyinstituto.cl/og-image.jpg",
            description: "Colegio 100% online y asíncrono en Chile, de 1° básico a 4° medio, con validación oficial MINEDUC.",
            address: { "@type": "PostalAddress", addressCountry: "CL" },
            areaServed: { "@type": "Country", name: "Chile" },
            sameAs: [INSTAGRAM_URL, TIKTOK_URL],
          }),
        }}
      />

      {/* VideoObject schema del tour real de la plataforma — permite aparecer en
          Google Video y que la IA cite directamente qué muestra el video. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: "Tour de la plataforma Barkley Online — alumno y apoderado",
            description: "Recorrido narrado por el dashboard del alumno y el portal del apoderado de Barkley Online, colegio 100% asincrónico en Chile.",
            thumbnailUrl: "https://www.barkleyinstituto.cl/videos/tour-poster.jpg",
            // ISO 8601 con zona horaria obligatoria: Google Search Console marca
            // como "no válido" una fecha sin hora/offset, aunque el resto del
            // schema esté correcto. -04:00 es horario de Chile (CLT).
            uploadDate: "2026-07-11T12:00:00-04:00",
            duration: "PT53S",
            contentUrl: "https://www.barkleyinstituto.cl/videos/tour-plataforma.mp4",
            embedUrl: "https://www.barkleyinstituto.cl/#plataforma",
          }),
        }}
      />

      {faqs && faqs.length > 0 && (
        // FAQPage schema: permite a buscadores e IA (ChatGPT, Perplexity, Google AI
        // Overviews) extraer preguntas/respuestas directamente sin tener que
        // interpretar el acordeón visual.
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs
                .filter((f) => f.isActive)
                .map((f) => ({
                  "@type": "Question",
                  name: f.question,
                  acceptedAnswer: { "@type": "Answer", text: f.answer },
                })),
            }),
          }}
        />
      )}

      <TourModal open={tourOpen} onClose={() => setTourOpen(false)} />

      <SiteHeader />

      {/* === HERO — como el real: marco blanco de 15px alrededor, foto a la izquierda,
          columna derecha con bloque azul (doble triángulo dorado cortado por el borde)
          y bloque morado saturado (pinwheel rosa), texto de paneles abajo-izquierda === */}
      <section data-hero="sec" style={{ position: "relative", display: "flex", gap: 15, padding: 15, background: "#fff", height: "min(885px,88vh)", boxSizing: "border-box" }}>
        {/* Variante móvil del hero. En desktop es foto a la izquierda + columna de
            paneles de 314px a la derecha; bajo 760px eso deja la foto como una
            franja inservible, así que se apila: foto vertical grande arriba y los
            dos accesos como banda horizontal compacta abajo. Va en media query con
            !important porque el hero está compuesto con estilos inline. */}
        <style>{`
          @media (max-width: 760px) {
            [data-hero="sec"] { flex-direction: column !important; height: auto !important; padding: 10px !important; gap: 10px !important; }
            [data-hero="foto"] { min-height: 68vh !important; border-radius: 4px; }
            [data-hero="texto"] { left: 22px !important; right: 22px !important; bottom: 26px !important; }
            [data-hero="titulo"] { font-size: 37px !important; line-height: 1.08 !important; }
            [data-hero="panels"] { width: auto !important; flex-direction: row !important; gap: 10px !important; }
            [data-hero="panel"] { flex: 1 1 0 !important; min-height: 152px !important; }
            /* position:relative — el adorno va en absolute y, sin esto, se pinta
               por encima del texto y lo vuelve ilegible en el panel angosto. */
            [data-hero="panel"] > div:last-child { position: relative; padding: 14px 14px !important; font-size: 17px !important; }
            [data-hero="deco"] { transform: scale(0.42); transform-origin: top right; }
          }
        `}</style>
        <div data-hero="foto" style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <img src={HERO_PHOTO} alt="" fetchPriority="high" decoding="async" style={{ width: "100%", height: "100%", position: "absolute", inset: 0, objectFit: "cover", filter: "saturate(0.85)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,51,102,0) 45%, rgba(20,35,55,0.6) 100%)" }} />
          {/* Un solo titular gigante real (sin eyebrow separado — la etiqueta real ES el h1), flechas prev/next circulares bottom-right junto al texto */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            data-hero="texto" style={{ position: "absolute", left: 45, right: 40, bottom: 42, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ maxWidth: 780 }}>
              <h1 data-hero="titulo" style={{ fontSize: "clamp(36px,5vw,69px)", fontWeight: 600, margin: 0, lineHeight: 1.05 }}>Líderes en Educación Asincrónica Inclusiva</h1>
              <button onClick={() => setTourOpen(true)}
                style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 600, color: NAVY, background: GOLD, border: "none", borderRadius: 999, padding: "13px 26px", cursor: "pointer", fontFamily: FONT }}>
                <span style={{ display: "inline-flex", width: 22, height: 22, borderRadius: "50%", background: NAVY, color: GOLD, alignItems: "center", justifyContent: "center", fontSize: 11 }}>▶</span>
                Ver cómo funciona
              </button>
            </div>
            <div style={{ gap: 10, flexShrink: 0 }} className="hidden md:flex">
              <button aria-label="Anterior" style={{ width: 48, height: 48, borderRadius: "50%", border: "1.5px solid #fff", background: "none", color: "#fff", cursor: "pointer", fontSize: 18 }}>‹</button>
              <button aria-label="Siguiente" style={{ width: 48, height: 48, borderRadius: "50%", border: "1.5px solid #fff", background: "none", color: "#fff", cursor: "pointer", fontSize: 18 }}>›</button>
            </div>
          </motion.div>
        </div>
        <div data-hero="panels" style={{ width: 314, display: "flex", flexDirection: "column", gap: 0 }}>
          <motion.a href="#plataforma" data-hero="panel" whileHover={{ opacity: 0.9 }} transition={{ duration: 0.25 }} style={{ flex: 1, background: BLOCK_BLUE, position: "relative", textDecoration: "none", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            {/* Doble triángulo SÓLIDO dorado gigante, cortado por el borde derecho — patrón real (▶▶, no chevrón) */}
            <motion.div data-hero="deco" whileHover={{ x: 6 }} transition={{ duration: 0.3 }} style={{ position: "absolute", top: "6%", right: -40 }}>
              <svg width="230" height="190" viewBox="0 0 230 190">
                <polygon points="10,20 105,95 10,170" fill={GOLD} />
                <polygon points="115,20 210,95 115,170" fill={GOLD} />
              </svg>
            </motion.div>
            <div style={{ padding: "28px 26px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", color: "#fff", fontWeight: 500, fontSize: 26, lineHeight: 1.25 }}>
              <span>Cómo<br />Funciona</span> <ArrowUpRight style={{ width: 26, height: 26, marginBottom: 6 }} />
            </div>
          </motion.a>
          {/* Pinwheel de 4 cuartos rosa arriba, sobre morado saturado real (#861FCE), texto blanco */}
          <motion.a href="#faq" data-hero="panel" whileHover={{ opacity: 0.9 }} transition={{ duration: 0.25 }} style={{ flex: 1, background: PURPLE_PANEL, position: "relative", textDecoration: "none", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <motion.div data-hero="deco" whileHover={{ rotate: 8 }} transition={{ duration: 0.4 }} style={{ position: "absolute", top: 12, right: -26, width: 190, height: 190, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8 }}>
              {/* Un solo path (cuarto de disco, pivote en la esquina interior) espejado en las 4 celdas → pinwheel */}
              <svg viewBox="0 0 50 50"><path d="M50,50 L50,0 A50,50 0 0,0 0,50 Z" fill={PINK} /></svg>
              <svg viewBox="0 0 50 50" style={{ transform: "scaleX(-1)" }}><path d="M50,50 L50,0 A50,50 0 0,0 0,50 Z" fill={PINK} /></svg>
              <svg viewBox="0 0 50 50" style={{ transform: "scaleY(-1)" }}><path d="M50,50 L50,0 A50,50 0 0,0 0,50 Z" fill={PINK} /></svg>
              <svg viewBox="0 0 50 50" style={{ transform: "scale(-1,-1)" }}><path d="M50,50 L50,0 A50,50 0 0,0 0,50 Z" fill={PINK} /></svg>
            </motion.div>
            <div style={{ padding: "28px 26px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", color: "#fff", fontWeight: 500, fontSize: 26, lineHeight: 1.25 }}>
              <span>Últimas<br />Noticias</span> <ArrowUpRight style={{ width: 26, height: 26, marginBottom: 6 }} />
            </div>
          </motion.a>
        </div>
      </section>

      {/* Pestaña vertical fija al borde derecho, siempre visible — patrón real .sticky--cta--nav */}
      {/* Sin `display` inline: lo define la clase (hidden md:flex). Con el inline
          puesto, `hidden` nunca ganaba y la pestaña asomaba en móvil, sobresaliendo
          25px del borde y provocando scroll horizontal. */}
      <div style={{ position: "fixed", right: 0, top: "45%", zIndex: 25, flexDirection: "column" }} className="hidden md:flex">
        <a href="#inscripcion" style={{ background: PINK, color: NAVY, textDecoration: "none", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", padding: "18px 10px", writingMode: "vertical-rl", textOrientation: "mixed" }}>INSCRIBIRSE</a>
      </div>

      {/* Botón flotante "volver arriba" — aparece tras pasar una pantalla de scroll,
          visible en cualquier dispositivo (a diferencia de la insignia del footer,
          que solo se ve en desktop y solo al llegar hasta abajo). */}
      <AnimatePresence>
        {showBackTop && (
          <motion.button
            aria-label="Volver arriba"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            style={{ position: "fixed", right: 20, bottom: 20, zIndex: 30, width: 48, height: 48, borderRadius: "50%", background: NAVY, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,51,102,0.35)" }}
          >
            <ArrowUpRight style={{ width: 20, height: 20, color: "#fff", transform: "rotate(-45deg)" }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* === INTRO — azul apagado real (no navy puro), formas literales inline (hourglass/circle/triangle/stairs/leaf/bars) === */}
      <section id="nosotros" style={{ maxWidth: 1180, margin: "0 auto", padding: "90px 24px", textAlign: "left" }}>
        <Reveal>
          <p style={{ fontSize: "clamp(26px,3.6vw,42px)", fontWeight: 500, lineHeight: 1.35, color: SLATE, margin: 0 }}>
            Somos un colegio<ShapeInline color={BLOCK_BLUE} shape={ShapeHourglass} /> 100% asincrónico en Chile<ShapeInline color={PINK} shape={ShapeCircle} /> para
            estudiantes<ShapeInline color={RED} shape={ShapeTriangle} /> desde 1° básico hasta 4° medio<ShapeInline color={PURPLE} shape={ShapeStairs} />, ofreciendo una
            preparación rigurosa y culturalmente cercana<ShapeInline color={GREEN} shape={ShapeLeaf} /> para rendir exámenes libres ante personas<ShapeInline color={GOLD} shape={ShapeBars} /> de todo Chile.
          </p>
        </Reveal>
      </section>

      {/* === EL MÉTODO — módulo dedicado, el gancho central === */}
      <MetodoModule />

      {/* === VIDEOS === */}
      <section id="videos" style={{ background: "#f5f5f5", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <Reveal><h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 600, color: SLATE, margin: "0 0 8px", textAlign: "center" }}>Conócenos en video</h2></Reveal>
          <Reveal delay={0.05}><p style={{ fontSize: 16, color: TEXT, textAlign: "center", margin: "0 0 40px" }}>Explicaciones cortas, directo al punto. Se abren en YouTube.</p></Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(187px, 1fr))", gap: 20 }}>
            {[
              { title: "Umbral™: el motor que exige entender", img: "/videos/umbral-v2.jpg", href: "https://youtube.com/shorts/0FluOs2d630" },
              { title: "Por qué huyen del colegio", img: "/videos/por-que-huyen-v2.jpg", href: "https://youtube.com/shorts/GT0xJVWNJMw" },
              { title: "Cómo funciona el Aprendizaje por Dominio", img: "/videos/aprendizaje-dominio-v2.jpg", href: "https://youtube.com/shorts/MTUOhlcNSsc" },
              { title: "Cómo frenamos el bullying", img: "/videos/bullying-v2.jpg", href: "https://youtube.com/shorts/z5cGm-3VVG0" },
              { title: "Cómo funciona el Programa Adaptativo", img: "/videos/programa-adaptativo-v2.jpg", href: "https://youtube.com/shorts/h9PYF9BhxeQ" },
              { title: "Por qué el aula complica el TDAH", img: "/videos/tdah.jpg", href: "https://youtube.com/shorts/WJPiW52VBlo" },
              { title: "Cómo funciona una lección en Barkley", img: "/videos/leccion.jpg", href: "https://youtube.com/shorts/vT4he6V59hU" },
              { title: "Barkley vs enseñanza tradicional", img: "/videos/vs-tradicional.jpg", href: "https://youtube.com/shorts/0-zzHQm-OKA" },
              { title: "Por qué el colegio causa ansiedad", img: "/videos/ansiedad.jpg", href: "https://youtube.com/shorts/ADGbDql7yYc" },
              { title: "Por qué el ritmo fijo frena las altas capacidades", img: "/videos/altas-capacidades.jpg", href: "https://youtube.com/shorts/LFNbO1vu4D8" },
              { title: "Cómo validar el temario oficial del MINEDUC", img: "/videos/curriculum.jpg", href: "https://youtube.com/shorts/BQVCCh29py0" },
              { title: "Cómo funciona la autogestión escolar", img: "/videos/autogestion.jpg", href: "https://youtube.com/shorts/m_mrIOgDrw4" },
              { title: "Entorno adaptativo para dislexia", img: "/videos/dislexia.jpg", href: "https://youtube.com/shorts/wtljV6t5UA4" },
            ].map((v, i) => (
              <Reveal key={v.href} delay={0.05 * i}>
                <a
                  href={v.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", flexDirection: "column", height: "100%", textDecoration: "none", borderRadius: 14, overflow: "hidden", background: "#fff", boxShadow: "0 4px 18px rgba(0,0,0,0.08)" }}
                >
                  <div style={{ position: "relative", aspectRatio: "9/16", background: NAVY }}>
                    <img src={v.img} alt={v.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,51,102,0.15)" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.25)" }}>
                        <div style={{ width: 0, height: 0, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderLeft: `15px solid ${NAVY}`, marginLeft: 3 }} />
                      </div>
                    </div>
                  </div>
                  <p style={{ flex: 1, display: "flex", alignItems: "center", fontSize: 12.5, fontWeight: 600, color: NAVY, lineHeight: 1.35, margin: 0, padding: "10px 12px", minHeight: 58 }}>{v.title}</p>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* === COLEGIOS CON EL MISMO MÉTODO — registro editorial con escudos heráldicos propios === */}
      <section id="referentes" style={{ background: "#fff", padding: "88px 24px", borderTop: `4px solid ${GOLD}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 56, alignItems: "flex-start" }}>
          {/* Columna editorial izquierda */}
          <Reveal>
            <div style={{ flex: "1 1 340px", minWidth: "min(300px, 100%)", maxWidth: 440 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>No estamos solos en esto</p>
              <h2 style={{ fontSize: "clamp(32px,4.5vw,52px)", fontWeight: 700, color: NAVY, margin: "0 0 20px", lineHeight: 1.1 }}>
                El mismo método,<br />en <em style={{ fontStyle: "normal", color: SLATE }}>cuatro colegios</em><br />del mundo.
              </h2>
              <p style={{ fontSize: 16, color: TEXT, lineHeight: 1.75, margin: "0 0 28px" }}>
                El Aprendizaje por Dominio no es un experimento: forma a miles de estudiantes en colegios online acreditados de Estados Unidos y Reino Unido. Barkley es el primero en traerlo a Chile.
              </p>
              <div style={{ display: "flex", gap: 28 }}>
                {[["4", "colegios"], ["3", "países"], ["1", "método"]].map(([n, l]) => (
                  <div key={l}>
                    <p style={{ fontSize: 40, fontWeight: 800, color: NAVY, margin: 0, lineHeight: 1 }}>{n}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.08em", margin: "6px 0 0" }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          {/* Registro institucional derecha */}
          <div style={{ flex: "1 1 520px", minWidth: "min(300px, 100%)" }}>
            {[
              { logo: "/images/colegios/acellus-white.webp", pad: "16px 14px", nombre: "Acellus Academy", meta: "Estados Unidos · Acreditado WASC", dato: "Mastery Learning en más de 6.000 escuelas" },
              { logo: "/images/colegios/apex-icon.webp", pad: "10px", nombre: "Apex Learning Virtual School", meta: "Estados Unidos · Acreditado Cognia", dato: "Currículum mastery-based de secundaria" },
              { logo: "/images/colegios/edmentum-white.webp", pad: "20px 14px", nombre: "Edmentum EdOptions Academy", meta: "Estados Unidos · Acreditado Cognia", dato: "Colegio online K-12 por dominio" },
              { logo: "/images/colegios/wolsey-hall-white.svg", pad: "16px 12px", nombre: "Wolsey Hall Oxford", meta: "Reino Unido · Fundado en 1894", dato: "Homeschooling 100% asincrónico" },
            ].map((c, i) => (
              <Reveal key={c.nombre} delay={i * 0.08}>
                <motion.div whileHover={{ x: 8 }} transition={{ duration: 0.25 }}
                  /* flexWrap: la placa del logo mide 128px y no encoge; en pantallas de
                     ~320px el texto ya no cabe en la misma línea y desbordaba. */
                  style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 24, padding: "26px 8px", borderBottom: i < 3 ? "1px solid #e8edf3" : "none" }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#c3cdd9", minWidth: 30 }}>{String(i + 1).padStart(2, "0")}</span>
                  {/* Logotipo oficial de la institución sobre placa navy */}
                  <div style={{ width: 128, height: 64, flexShrink: 0, background: NAVY, borderRadius: 12, border: "1px solid #d8e0ea", display: "flex", alignItems: "center", justifyContent: "center", padding: c.pad, boxSizing: "border-box" }}>
                    <img src={c.logo} alt={`Logo ${c.nombre}`} loading="lazy" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "clamp(17px,2vw,21px)", fontWeight: 700, color: NAVY, margin: "0 0 3px", lineHeight: 1.25 }}>{c.nombre}</p>
                    <p style={{ fontSize: 11.5, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 5px" }}>{c.meta}</p>
                    <p style={{ fontSize: 14, color: TEXT, margin: 0 }}>{c.dato}</p>
                  </div>
                </motion.div>
              </Reveal>
            ))}
            <p style={{ fontSize: 10.5, color: "#b6c1cd", margin: "16px 0 0", textAlign: "right" }}>
              Los logotipos pertenecen a sus respectivas instituciones y se muestran solo como referencia del método.
            </p>
          </div>
        </div>
      </section>

      {/* === ADULTO ACOMPAÑANTE — cómo lo hacen los colegios 100% online serios con niños chicos === */}
      <section id="adulto-acompanante" style={{ background: "#fff", padding: "88px 24px", borderTop: "1px solid #eef1f5" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <Reveal>
            <p style={{ fontSize: 13, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px", textAlign: "center" }}>Para 1° a 6° básico</p>
            <h2 style={{ fontSize: "clamp(30px,4.5vw,48px)", fontWeight: 700, color: NAVY, margin: "0 auto 20px", lineHeight: 1.15, textAlign: "center", maxWidth: 780 }}>
              El <em style={{ fontStyle: "normal", color: "#b5892a" }}>Adulto Acompañante</em>: así lo hacen los colegios 100% online serios del mundo
            </h2>
            <p style={{ fontSize: 16, color: TEXT, lineHeight: 1.8, margin: "0 auto 48px", maxWidth: 720, textAlign: "center" }}>
              Ningún colegio online acreditado del mundo le pide autonomía total a un niño de 6 años. Todos usan el mismo mecanismo: contenido autoguiado por dominio + <strong style={{ color: NAVY }}>un adulto en casa con rol formal y horas definidas, que baja gradual con la edad</strong>. Así lo hacen tres referentes reales:
            </p>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 24, marginBottom: 56 }}>
            {[
              { nombre: "K12 / Stride", pais: "Estados Unidos", rol: "“Learning Coach”", detalle: "3 a 6 horas diarias en K-5: facilita lecciones, maneja materiales, registra avance.", color: BLOCK_BLUE },
              { nombre: "Laurel Springs", pais: "Estados Unidos · 100% asincrónico", rol: "“Learning Coach”", detalle: "2 a 3 horas diarias en K-5: da estructura, lee en voz alta, revisa y acompaña.", color: GREEN },
              { nombre: "Wolsey Hall Oxford", pais: "Reino Unido · desde 1894", rol: "“Parent-Guided Learning”", detalle: "En 4-7 años el apoderado es el educador principal, con planes de lección diarios ya listos.", color: PURPLE },
            ].map((c, i) => (
              <Reveal key={c.nombre} delay={i * 0.08}>
                <div style={{ background: "#f5f5f5", borderRadius: 20, padding: "32px 28px", height: "100%" }}>
                  <span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 700, color: "#fff", background: c.color, padding: "5px 12px", borderRadius: 999, marginBottom: 16 }}>{c.pais}</span>
                  <p style={{ fontSize: 20, fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>{c.nombre}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#b5892a", margin: "0 0 12px" }}>{c.rol}</p>
                  <p style={{ fontSize: 14.5, color: TEXT, lineHeight: 1.65, margin: 0 }}>{c.detalle}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <div style={{ background: NAVY, borderRadius: 24, padding: "44px 40px", color: "#fff" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Así lo hace Barkley</p>
              <h3 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 700, margin: "0 0 24px" }}>Mismo mecanismo, con horas que bajan gradual por ciclo</h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 16, marginBottom: 32 }}>
                {[
                  { ciclo: "1° y 2° básico", horas: "4 a 5 h/día", detalle: "Adulto presente casi todo el estudio" },
                  { ciclo: "3° y 4° básico", horas: "3 h/día", detalle: "Acompaña el inicio, luego supervisa" },
                  { ciclo: "5° y 6° básico", horas: "2 h/día", detalle: "Revisa avances, resuelve dudas puntuales" },
                  { ciclo: "7° a 4° medio", horas: "Autónomo", detalle: "Solo seguimiento vía Portal Familia" },
                ].map((c) => (
                  <div key={c.ciclo} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px" }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>{c.ciclo}</p>
                    <p style={{ fontSize: 22, fontWeight: 800, color: GOLD, margin: "0 0 4px" }}>{c.horas}</p>
                    <p style={{ fontSize: 13, opacity: 0.8, margin: 0, lineHeight: 1.4 }}>{c.detalle}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 28 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: GOLD, margin: "0 0 6px" }}>Rol con nombre</p>
                  <p style={{ fontSize: 14.5, opacity: 0.88, lineHeight: 1.6, margin: 0 }}>Desde 1° básico, el apoderado es el <strong>Adulto Acompañante</strong>: quien está al lado durante el estudio, no quien enseña ni corrige — eso lo hace la plataforma.</p>
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: GOLD, margin: "0 0 6px" }}>Baja gradual, no de golpe</p>
                  <p style={{ fontSize: 14.5, opacity: 0.88, lineHeight: 1.6, margin: 0 }}>De acompañamiento casi total en 1°-2° a autonomía completa en media — igual que el tránsito que describen K12 y Laurel Springs en sus propios niveles.</p>
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: GOLD, margin: "0 0 6px" }}>El colegio no desaparece</p>
                  <p style={{ fontSize: 14.5, opacity: 0.88, lineHeight: 1.6, margin: 0 }}>Video + pódcast ya grabados, evaluación auto-corregida, Asesor humano que monitorea a distancia y Portal Familia con avance en tiempo real.</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* === PILARES — bloque de color sólido + foto, como "An Education Designed Around You" === */}
      <section style={{ background: "#f5f5f5", padding: "64px 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <Reveal>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 0, marginBottom: 48, alignItems: "stretch" }}>
              <div style={{ flex: "1 1 320px", minWidth: 260, position: "relative", minHeight: 340, overflow: "hidden" }}>
                <img src="/images/asincronico-tablet.webp" alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ flex: "1 1 380px", minWidth: 280, background: "#fff", padding: "40px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" }}>Sin clases en vivo. Sin horarios fijos.</p>
                <h2 style={{ fontSize: "clamp(30px,5vw,52px)", fontWeight: 600, color: NAVY, margin: "0 0 16px" }}>Aprende cuando puedas. Avanza a tu ritmo real.</h2>
                <p style={{ fontSize: 15, margin: 0 }}>Barkley es 100% asincrónico: nada de clases por Zoom ni horarios que cumplir. Cada estudiante avanza a su propio paso, con tutores y asesores disponibles cuando los necesita — pensado para quienes no tienen acceso constante a un horario fijo, y para quienes aprenden distinto.</p>
              </div>
            </div>
          </Reveal>
          {/* Grid estático — los 4 puntos visibles a la vez, sin carrusel que
              esconda 3 de cada 4 detrás de una flecha que casi nadie toca. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 32 }}>
            {PILARES.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <img src={p.img} alt={p.title} loading="lazy" style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover", borderRadius: 12, display: "block", marginBottom: 18 }} />
                <h3 style={{ fontSize: 19, fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>{p.title}</h3>
                <p style={{ fontSize: 14.5, margin: 0, color: TEXT, lineHeight: 1.6 }}>{p.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* === NIVELES — panel azul sólido detrás + botón dorado debajo, como el real === */}
      <section id="metodo" style={{ padding: "64px 24px 0", textAlign: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: SLATE, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>De 1° básico a 4° medio</p>
        {/* h2 slate 600 — como "Our Learning Journey" real (no navy bold) */}
        <h2 style={{ fontSize: "clamp(34px,6vw,64px)", fontWeight: 600, color: SLATE, margin: "0 0 48px" }}>Nuestro camino de aprendizaje</h2>
      </section>
      <section style={{ background: VIVID_BLUE, padding: "0 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", transform: "translateY(-24px)" }}>
          {/* Con solo 2 tarjetas no deben estirarse a llenar el ancho — tamaño fijo, centradas */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
            {NIVELES.map((n, i) => (
              <Reveal key={n.title} delay={i * 0.1} style={{ flex: "0 1 300px", width: 300, maxWidth: 300 }}>
                {/* Tarjetas altas tipo retrato con overlay navy denso abajo, título 26px sobre subtítulo+flecha — patrón real */}
                <motion.a href="#inscripcion" whileHover={{ scale: 1.01 }} transition={{ duration: 0.25, ease: "easeInOut" }} style={{ textDecoration: "none", color: NAVY, position: "relative", overflow: "hidden", display: "block" }}>
                  <img src={n.img} alt={n.title} loading="lazy" style={{ width: "100%", aspectRatio: "3/3.4", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,25,50,0) 40%, rgba(10,25,50,0.92) 100%)" }} />
                  <div style={{ position: "absolute", left: 28, right: 24, bottom: 24, color: "#fff" }}>
                    <p style={{ fontSize: 26, fontWeight: 500, margin: 0, lineHeight: 1.25 }}>{n.title}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                      <p style={{ fontSize: 13, margin: 0, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{n.sub}</p>
                      <ArrowUpRight style={{ width: 22, height: 22, flexShrink: 0 }} />
                    </div>
                  </div>
                </motion.a>
              </Reveal>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 56 }}>
            <motion.a href="#plataforma" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GOLD, color: NAVY, textDecoration: "none", fontWeight: 600, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 999, padding: "18px 36px" }}>Aprendizaje en Barkley <ArrowUpRight style={{ width: 16, height: 16 }} /></motion.a>
          </div>
        </div>
      </section>

      {/* === INCLUSIVO — Para todos, adaptado a cada uno === */}
      <section style={{ padding: "64px 24px", background: "#f5f5f5" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: SLATE, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Inclusión real</p>
              <h2 style={{ fontSize: "clamp(34px,6vw,64px)", fontWeight: 600, color: NAVY, margin: "0 0 24px" }}>Para todos. Adaptado a cada uno.</h2>
              <p style={{ fontSize: 16, color: TEXT, maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>Barkley es un colegio para todos. Si tienes TDAH, eres deportista de alto rendimiento, tienes una necesidad educativa especial o necesitas flexibilidad para exámenes libres, la tecnología y metodología ya están diseñadas para ti.</p>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {INCLUSIVOS.map((inc, i) => {
              const Icon = inc.icon;
              return (
                <Reveal key={inc.title} delay={i * 0.1}>
                  <motion.a
                    href={inc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    style={{
                      padding: 28,
                      background: "#fff",
                      border: `1px solid #e5e5e5`,
                      borderRadius: 12,
                      textDecoration: "none",
                      color: "inherit",
                      transition: "all 0.25s ease-in-out",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <Icon size={28} color={GOLD} strokeWidth={2} />
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: 0 }}>{inc.title}</h3>
                    </div>
                    <p style={{ fontSize: 14, color: TEXT, margin: 0, lineHeight: 1.5, flex: 1 }}>{inc.desc}</p>
                    <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, color: SLATE, fontSize: 13, fontWeight: 600 }}>
                      Leer más <ArrowUpRight size={14} />
                    </div>
                  </motion.a>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* === BARKLEY ADAPTATIVO — sección propia, dirigida a familias con hijos TDAH/dislexia/
          otro ritmo de aprendizaje. Separada del carrusel de razones a pedido: necesita su
          propio espacio, no un ítem más dentro de una lista genérica. === */}
      <section id="adaptativo" style={{ background: "#f6f1ff", padding: "90px 24px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: PURPLE, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
            Adaptativo · el programa de Barkley para otros ritmos de aprendizaje
          </p>
          <h2 style={{ fontSize: "clamp(30px,5vw,48px)", fontWeight: 600, color: NAVY, margin: "0 0 20px", lineHeight: 1.15 }}>
            No todos aprenden igual.<br />No todos deberían estudiar igual.
          </h2>
          <p style={{ fontSize: 18, color: TEXT, maxWidth: 680, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Si tu hijo tiene TDAH o dislexia, el problema casi nunca es él — es el formato.
            Una clase de 45 minutos por Zoom exige algo que no todos los cerebros dan igual.
            Adaptativo ajusta la forma, no la exigencia: mismo contenido oficial, presentado
            de un modo que sí puede recorrer.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center", marginBottom: 40 }}>
            {[
              { t: "Sin exigencia de atención sostenida", d: "Video y pódcast en bloques cortos, con pausas donde tu hijo las necesite — no donde el reloj lo decide." },
              { t: "Sin comparación con el curso", d: "Avanza contra su propio progreso anterior, no contra el ritmo de 30 compañeros en una clase en vivo." },
              { t: "Con acompañamiento humano real", d: "Un asesor sigue su proceso — no es contenido que corre solo mientras nadie mira cómo le va." },
            ].map((f) => (
              <div key={f.t} style={{ background: "#fff", borderRadius: 16, padding: 26, flex: "1 1 260px", minWidth: 240, textAlign: "left", boxShadow: "0 4px 16px rgba(0,20,60,0.1)" }}>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: NAVY, margin: "0 0 8px" }}>{f.t}</h3>
                <p style={{ fontSize: 14, margin: 0, color: TEXT }}>{f.d}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: SLATE, maxWidth: 600, margin: "0 auto 28px" }}>
            Adaptativo no reemplaza el diagnóstico ni el tratamiento profesional de tu
            hijo — es un formato de estudio que se acomoda a cómo aprende, no una terapia.
          </p>
          <a href="/adaptativo" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: PURPLE, color: "#fff", fontWeight: 700, fontSize: 15, padding: "14px 28px", borderRadius: 999, textDecoration: "none" }}>
            Quiero saber más de Adaptativo
          </a>
        </div>
      </section>

      {/* === FACT-BOXES — pastel real con forma grande de fondo + número gigante (verificado en vivo, no negro) === */}
      <section style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px", textAlign: "center" }}>Barkley en cifras</p>
          <h2 style={{ fontSize: "clamp(34px,6vw,60px)", fontWeight: 600, color: NAVY, margin: "0 0 40px", textAlign: "center" }}>Más que un colegio</h2>
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

      {/* === INSCRIPCIÓN (mitad de página) — misma sección, sin id repetido === */}
      <AdmisionSection />

      {/* === ESTRUCTURA — esquema de cómo está armado el contenido, igual para cualquier nivel === */}
      <section id="estructura" style={{ background: NAVY, padding: "88px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, opacity: 0.12 }}><ShapeFlower color="#fff" size={220} /></div>
        <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative" }}>
          <Reveal>
            <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px", textAlign: "center" }}>Así está construido — igual en cualquier nivel</p>
            <h2 style={{ fontSize: "clamp(30px,4.5vw,48px)", fontWeight: 700, color: "#fff", margin: "0 auto 16px", lineHeight: 1.15, textAlign: "center", maxWidth: 760 }}>
              De 1° básico a 4° medio, <em style={{ fontStyle: "normal", color: GOLD }}>el mismo esquema</em>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.78)", lineHeight: 1.8, margin: "0 auto 56px", maxWidth: 640, textAlign: "center" }}>
              No importa la asignatura ni el nivel: la estructura es siempre la misma. Así se ve de arriba hacia abajo.
            </p>
          </Reveal>

          {/* Nivel 1 — Asignatura */}
          <Reveal>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
              <div style={{ background: GOLD, color: NAVY, borderRadius: 16, padding: "18px 36px", textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px", opacity: 0.75 }}>Nivel 1</p>
                <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Asignatura</p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}><ArrowDown style={{ width: 22, height: 22, color: "rgba(255,255,255,0.4)" }} /></div>
          </Reveal>

          {/* Nivel 2 — Unidades (bloqueadas por dominio) */}
          <Reveal delay={0.06}>
            <p style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Nivel 2 · Unidades, en orden — se desbloquean solo con 70% o más</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              {[
                { label: "Unidad 1", state: "done" },
                { label: "Unidad 2", state: "done" },
                { label: "Unidad 3", state: "current" },
                { label: "Unidad 4", state: "locked" },
                { label: "Unidad 5", state: "locked" },
              ].map((u) => (
                <div key={u.label} style={{
                  display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "12px 16px",
                  background: u.state === "current" ? GOLD : u.state === "done" ? "rgba(0,178,115,0.18)" : "rgba(255,255,255,0.06)",
                  border: u.state === "current" ? "none" : "1px solid rgba(255,255,255,0.15)",
                }}>
                  {u.state === "done" && <CheckCircle2 style={{ width: 16, height: 16, color: GREEN }} />}
                  {u.state === "current" && <Layers style={{ width: 16, height: 16, color: NAVY }} />}
                  {u.state === "locked" && <Lock style={{ width: 14, height: 14, color: "rgba(255,255,255,0.4)" }} />}
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: u.state === "current" ? NAVY : u.state === "locked" ? "rgba(255,255,255,0.4)" : "#fff" }}>{u.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}><ArrowDown style={{ width: 22, height: 22, color: "rgba(255,255,255,0.4)" }} /></div>
          </Reveal>

          {/* Nivel 3 — Lecciones dentro de la unidad */}
          <Reveal delay={0.12}>
            <p style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Nivel 3 · Cada unidad tiene varias lecciones</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              {["Lección 3.1", "Lección 3.2", "Lección 3.3"].map((l, i) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, background: i === 0 ? "rgba(255,197,72,0.16)" : "rgba(255,255,255,0.06)", border: `1px solid ${i === 0 ? GOLD : "rgba(255,255,255,0.15)"}`, borderRadius: 12, padding: "12px 18px" }}>
                  <BookOpen style={{ width: 16, height: 16, color: i === 0 ? GOLD : "rgba(255,255,255,0.6)" }} />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>{l}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}><ArrowDown style={{ width: 22, height: 22, color: "rgba(255,255,255,0.4)" }} /></div>
          </Reveal>

          {/* Nivel 4 — Formatos dentro de una lección */}
          <Reveal delay={0.18}>
            <p style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>Nivel 4 · Cada lección trae todos estos formatos</p>
            <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))", gap: 14, marginBottom: 8 }}>
              {[
                { icon: Play, label: "2 videos", color: NAVY },
                { icon: Headphones, label: "1 pódcast", color: SLATE },
                { icon: ImageIcon, label: "Infografía", color: PINK },
                { icon: Download, label: "Guía descargable", color: RED },
                { icon: ListChecks, label: "Evaluación", color: "#b5892a" },
                { icon: Sparkles, label: "IA Barkley si te trabas", color: GREEN },
              ].map((f) => (
                <div key={f.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8, padding: "12px 8px" }}>
                  <span style={{ width: 44, height: 44, borderRadius: "50%", background: `${f.color}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <f.icon style={{ width: 20, height: 20, color: f.color }} strokeWidth={2.2} />
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: NAVY, lineHeight: 1.3 }}>{f.label}</span>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Semiflexibilidad — organización diaria libre + fechas de evaluación fijas */}
          <Reveal delay={0.24}>
            <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 20 }}>
              <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 18, padding: "26px 28px" }}>
                <CalendarClock style={{ width: 26, height: 26, color: GOLD, marginBottom: 12 }} strokeWidth={2.2} />
                <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>Tú organizas el día</p>
                <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0 }}>Estudias cuando tu rutina lo permite — a las 9 AM o a las 6 PM, todos los días o repartido en la semana. Sin horario fijo diario.</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 18, padding: "26px 28px" }}>
                <CalendarCheck style={{ width: 26, height: 26, color: GOLD, marginBottom: 12 }} strokeWidth={2.2} />
                <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>Pero hay fechas que sí se cumplen</p>
                <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0 }}>Las evaluaciones de unidad y los <a href="#calendario" style={{ color: GOLD, fontWeight: 600 }}>períodos oficiales MINEDUC</a> tienen plazo fijo. Es semiflexibilidad: libre en el día a día, firme en el calendario.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* === PROGRAMAS === */}
      <section id="plataforma" style={{ background: "#f5f5f5", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" }}>Descubre y experimenta</p>
          <h2 style={{ fontSize: "clamp(34px,6vw,64px)", fontWeight: 600, color: SLATE, margin: "0 0 24px" }}>La plataforma, por dentro</h2>

          {/* Tour virtual narrado: recorrido real por el dashboard del alumno y el portal del apoderado */}
          <Reveal>
            <div style={{ margin: "0 auto 48px", maxWidth: 880 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, margin: "0 0 14px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: NAVY, color: "#fff", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "6px 12px", borderRadius: 999 }}>
                  <Play style={{ width: 13, height: 13 }} strokeWidth={3} /> Video resumen · 53 segundos
                </span>
                <span style={{ fontSize: 14, color: TEXT }}>Lo que ve tu hijo y lo que ves tú como apoderado — al grano.</span>
              </div>
              <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "0 18px 50px rgba(0,20,60,0.18)", border: `1px solid ${SLATE}22`, background: NAVY }}>
                <video
                  controls
                  preload="metadata"
                  poster="/videos/tour-poster.jpg"
                  playsInline
                  style={{ width: "100%", display: "block", aspectRatio: "16/9", background: NAVY }}
                >
                  <source src="/videos/tour-plataforma.mp4" type="video/mp4" />
                  Tu navegador no puede reproducir el video.
                </video>
              </div>
              {/* CTA a la demo REAL de la plataforma — lección completa + dashboards alumno y familia */}
              <div style={{ marginTop: 22, background: "#fff", border: `1px solid ${SLATE}22`, borderRadius: 16, padding: "22px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, boxShadow: "0 6px 24px rgba(0,20,60,0.06)" }}>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 700, color: NAVY, margin: "0 0 3px" }}>¿Quieres verla por dentro de verdad?</p>
                  <p style={{ fontSize: 14, color: TEXT, margin: 0 }}>Entra a una cuenta de ejemplo con una lección completa — como alumno o como familia.</p>
                </div>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  <a href="https://barkley-platform.vercel.app/demo/student" target="_blank" rel="noopener noreferrer"
                    style={{ textDecoration: "none", background: RED, color: "#fff", fontWeight: 700, fontSize: 15, borderRadius: 999, padding: "12px 22px", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    Entrar a la demo <ArrowUpRight style={{ width: 16, height: 16 }} />
                  </a>
                </div>
              </div>
              {/* Atribución requerida por licencia CC BY 4.0 de la pista musical */}
              <p style={{ fontSize: 11, color: "#9aa7b8", margin: "10px 2px 0", textAlign: "right" }}>
                Música: "Wholesome" — Kevin MacLeod (incompetech.com), CC BY 4.0
              </p>
            </div>
          </Reveal>

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
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* === IA BARKLEY — demo en vivo del tutor IA (no un video, un chat que se tipea solo) === */}
      <section id="ia-barkley" style={{ background: "#eef2f7", padding: "88px 24px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 56, alignItems: "center" }}>
          <Reveal>
            <div style={{ flex: "1 1 420px", minWidth: "min(300px, 100%)", maxWidth: 520 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Cuando de verdad lo necesita</p>
              <h2 style={{ fontSize: "clamp(30px,4.5vw,48px)", fontWeight: 700, color: NAVY, margin: "0 0 18px", lineHeight: 1.12 }}>
                <em style={{ fontStyle: "normal", color: "#b5892a" }}>IA Barkley</em>: el tutor que aparece solo cuando toca.
              </h2>
              <p style={{ fontSize: 16, color: TEXT, lineHeight: 1.75, margin: "0 0 20px" }}>
                No es un chat libre para copiar respuestas. IA Barkley se activa cuando el sistema detecta reprobación real — dos intentos fallidos y menos de 70% en una unidad — y explica el concepto con paciencia, sin resolver la evaluación por el estudiante.
              </p>
              <div style={{ display: "flex", gap: 28 }}>
                {[["2", "intentos fallidos"], ["<70%", "para activarse"], ["20", "preguntas / día"]].map(([n, l]) => (
                  <div key={l}>
                    <p style={{ fontSize: 28, fontWeight: 800, color: NAVY, margin: 0, lineHeight: 1 }}>{n}</p>
                    <p style={{ fontSize: 11.5, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: "6px 0 0" }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <div style={{ flex: "1 1 380px", minWidth: "min(300px, 100%)", display: "flex", justifyContent: "center" }}>
            <IaBarkleyDemo />
          </div>
        </div>
      </section>

      {/* === HERRAMIENTAS EXTERNAS — banda navy editorial con el lenguaje de formas del sitio === */}
      <section id="herramientas" style={{ background: NAVY, padding: "76px 24px", position: "relative", overflow: "hidden" }}>
        {/* Forma decorativa de fondo, mismo lenguaje que el footer/CTA */}
        <div style={{ position: "absolute", top: -30, right: -30, opacity: 0.35 }}><ShapeFlower color="#ffffff14" size={180} /></div>
        <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
          <Reveal>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 18, margin: "0 0 44px" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Ecosistema de estudio</p>
                <h2 style={{ fontSize: "clamp(30px,4.5vw,48px)", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.12, maxWidth: 620 }}>
                  Aprende con herramientas <em style={{ fontStyle: "normal", color: GOLD }}>que usará toda la vida</em>.
                </h2>
              </div>
              <p style={{ fontSize: 15, color: "#b9cbe2", maxWidth: 330, margin: 0, lineHeight: 1.7 }}>
                La plataforma Barkley se complementa con aplicaciones reales del mundo del estudio y el trabajo.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(190px, 100%), 1fr))" }}>
              {[
                { Shape: Circle, color: GOLD, nombre: "Google Workspace", uso: "Documentos, correo y entrega de ensayos" },
                { Shape: Heart, color: PINK, nombre: "WhatsApp", uso: "Comunicación directa con tutor y asesor" },
                { Shape: Triangle, color: GREEN, nombre: "GeoGebra", uso: "Matemática y geometría interactiva" },
                { Shape: Star, color: RED, nombre: "Canva", uso: "Presentaciones y trabajos creativos" },
                { Shape: Rows3, color: "#8db4e2", nombre: "Quizlet", uso: "Repaso con tarjetas de memoria" },
              ].map(({ Shape, color, nombre, uso }, i) => (
                <motion.div key={nombre} whileHover={{ backgroundColor: "rgba(255,255,255,0.05)", y: -4 }} transition={{ duration: 0.25 }}
                  style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.14)" : "none", padding: "8px 22px 12px", borderRadius: 4 }}>
                  <Shape style={{ width: 30, height: 30, color, marginBottom: 16 }} strokeWidth={2.4} fill={color === GOLD || color === RED ? color : "none"} fillOpacity={0.25} />
                  <p style={{ fontSize: 19, fontWeight: 700, color: "#fff", margin: "0 0 8px", lineHeight: 1.25 }}>{nombre}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#9fb3cc", textTransform: "uppercase", letterSpacing: "0.07em", lineHeight: 1.7, margin: 0 }}>{uso}</p>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* === SERVICIOS INCLUIDOS — banda papel cálido, numeración editorial y
          bloque destacado de ensayos PAES mensuales para 4° medio === */}
      <section id="servicios" style={{ background: "#fdf7ee", padding: "92px 24px", position: "relative", overflow: "hidden" }}>
        {/* Formas de fondo, mismo lenguaje decorativo del resto del sitio */}
        <div style={{ position: "absolute", top: 60, left: -50, opacity: 0.5 }}><ShapeFlower color="#f2d9b0" size={200} /></div>
        <div style={{ position: "absolute", bottom: 120, right: -40, opacity: 0.45 }}><ShapeCircle color="#f7e3c4" size={150} /></div>

        <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
          <Reveal>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24, margin: "0 0 56px" }}>
              <div style={{ maxWidth: 660 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 12px" }}>Todo esto viene incluido</p>
                <h2 style={{ fontSize: "clamp(32px,5vw,54px)", fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.1 }}>
                  Un colegio completo,<br />
                  <em style={{ fontStyle: "normal", color: "#b5892a" }}>no solo clases grabadas</em>.
                </h2>
              </div>
              <p style={{ fontSize: 15.5, color: TEXT, maxWidth: 330, margin: 0, lineHeight: 1.75 }}>
                Siete servicios que acompañan el año completo — más ensayos PAES mensuales para 4° medio. Sin cobros sorpresa, sin módulos aparte.
              </p>
            </div>
          </Reveal>

          {/* Grilla editorial: numeral grande como elemento gráfico, regla superior por tarjeta.
              Los seis primeros van en grilla de 3; el séptimo cierra a ancho completo en
              horizontal, para que la última fila no quede con dos huecos vacíos. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(290px, 100%), 1fr))", gap: "0 44px" }}>
            {SERVICIOS.slice(0, 6).map((s, i) => (
              <Reveal key={s.n} delay={Math.min(i, 3) * 0.06}>
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  style={{ borderTop: `3px solid ${s.color}`, padding: "26px 0 38px", height: "100%" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, color: s.color, letterSpacing: "-0.03em" }}>{s.n}</span>
                    <s.Icon style={{ width: 26, height: 26, color: s.color }} strokeWidth={2.2} />
                  </div>
                  <h3 style={{ fontSize: 20.5, fontWeight: 700, color: NAVY, margin: "0 0 10px", lineHeight: 1.25 }}>{s.titulo}</h3>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#7a6033", margin: "0 0 12px", lineHeight: 1.5 }}>{s.lead}</p>
                  <p style={{ fontSize: 14.5, color: TEXT, margin: 0, lineHeight: 1.75 }}>{s.texto}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>

          {/* Séptimo servicio a ancho completo — cierra la grilla y da ritmo editorial */}
          {SERVICIOS.slice(6).map((s) => (
            <Reveal key={s.n} delay={0.08}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                style={{ borderTop: `3px solid ${s.color}`, padding: "26px 0 8px", display: "flex", flexWrap: "wrap", gap: 40 }}
              >
                <div style={{ flex: "0 0 auto", minWidth: 250, maxWidth: 420 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                    <span style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, color: s.color, letterSpacing: "-0.03em" }}>{s.n}</span>
                    <s.Icon style={{ width: 26, height: 26, color: s.color }} strokeWidth={2.2} />
                  </div>
                  <h3 style={{ fontSize: 20.5, fontWeight: 700, color: NAVY, margin: "0 0 8px", lineHeight: 1.25 }}>{s.titulo}</h3>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#7a6033", margin: 0, lineHeight: 1.5 }}>{s.lead}</p>
                </div>
                <p style={{ flex: "1 1 320px", fontSize: 14.5, color: TEXT, margin: 0, lineHeight: 1.75, alignSelf: "center", maxWidth: 620 }}>{s.texto}</p>
              </motion.div>
            </Reveal>
          ))}

          {/* Ensayos PAES mensuales — bloque navy destacado, incluido para 4° medio */}
          <Reveal delay={0.1}>
            <div style={{ marginTop: 56, background: NAVY, borderRadius: 22, padding: "clamp(32px,5vw,54px)", position: "relative", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,20,60,0.22)" }}>
              <div style={{ position: "absolute", top: -40, right: -30, opacity: 0.5 }}><ShapeStar color="#ffffff12" size={190} /></div>
              <div style={{ position: "relative" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>4° medio · Preparación PAES</p>
                <h3 style={{ fontSize: "clamp(26px,3.6vw,40px)", fontWeight: 700, color: "#fff", margin: "0 0 18px", lineHeight: 1.15, maxWidth: 640 }}>
                  Ensayos PAES mensuales, <em style={{ fontStyle: "normal", color: GOLD }}>incluidos en tu mensualidad</em>.
                </h3>
                <p style={{ fontSize: 15.5, color: "#b9cbe2", lineHeight: 1.8, margin: "0 0 18px", maxWidth: 640 }}>
                  No es un preuniversitario aparte. Si estás en 4° medio, cada mes rindes un ensayo con formato oficial PAES, para que llegues a la prueba real sabiendo exactamente cómo te está yendo — sin pagar un servicio adicional.
                </p>
                <a
                  href="#inscripcion"
                  style={{ display: "inline-block", marginTop: 4, background: RED, color: "#fff", fontWeight: 700, fontSize: 15, padding: "14px 28px", borderRadius: 999, textDecoration: "none" }}
                >
                  Reservar cupo 2027 →
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* === CALENDARIO ACADÉMICO — hitos del año de preparación === */}
      <section id="calendario" style={{ background: "#fff", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <p style={{ fontSize: 14, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px", textAlign: "center" }}>Fechas claras, sin letra chica</p>
            <h2 style={{ fontSize: "clamp(30px,5vw,48px)", fontWeight: 600, color: NAVY, margin: "0 0 48px", textAlign: "center" }}>Calendario académico 2026–2027</h2>
          </Reveal>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 21, top: 8, bottom: 8, width: 2, background: "#e3e8ef" }} className="hidden md:block" />
            {[
              { fecha: "Ahora", titulo: "Reserva tu cupo", texto: "Sin pago, sin matrícula. Solo completas tus datos y aseguras el lugar." },
              { fecha: "Febrero 2027", titulo: "Primer pago", texto: "Confirmas tu plan (mensual o anual con 15% dcto) y activas la cuenta." },
              { fecha: "Marzo 2027", titulo: "Inicio del año de preparación", texto: "Acceso completo a la plataforma: video, pódcast, tutor y asesor." },
              { fecha: "Marzo – octubre", texto: "8 meses de avance a tu ritmo con Aprendizaje por Dominio, acompañado por tu tutor y monitoreado por tu asesor.", titulo: "Año lectivo" },
              { fecha: "31 de octubre 2027", titulo: "Exámenes libres MINEDUC", texto: "Rindes tus exámenes libres ante el Ministerio de Educación de Chile." },
            ].map((h, i) => (
              <Reveal key={h.titulo} delay={i * 0.06}>
                <div style={{ display: "flex", gap: 24, marginBottom: 36, position: "relative" }}>
                  <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%", background: i === 4 ? RED : NAVY, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, zIndex: 1 }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#b5892a", textTransform: "uppercase", letterSpacing: "0.08em", margin: "6px 0 4px" }}>{h.fecha}</p>
                    <p style={{ fontSize: 19, fontWeight: 700, color: NAVY, margin: "0 0 4px" }}>{h.titulo}</p>
                    <p style={{ fontSize: 15, color: TEXT, margin: 0, maxWidth: 560 }}>{h.texto}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.24}>
            <div style={{ background: "#f5f5f5", borderRadius: 20, padding: "32px 36px", marginTop: 40, marginBottom: 28 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Fechas oficiales MINEDUC 2026</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: NAVY, margin: "0 0 18px" }}>Períodos de inscripción y rendición de Exámenes Libres (menores de 18 años)</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 22 }}>
                <div style={{ flex: "1 1 260px", background: "#fff", borderRadius: 14, padding: "20px 22px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#b5892a", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Primer período · todos los cursos y NEE</p>
                  <p style={{ fontSize: 15, color: TEXT, margin: "0 0 4px" }}><strong style={{ color: NAVY }}>Inscripción:</strong> 6 al 29 de abril de 2026</p>
                  <p style={{ fontSize: 15, color: TEXT, margin: "0 0 4px" }}><strong style={{ color: NAVY }}>Rendición:</strong> 8 al 19 de junio de 2026</p>
                  <p style={{ fontSize: 15, color: TEXT, margin: 0 }}><strong style={{ color: NAVY }}>Resultados:</strong> 27 de julio de 2026</p>
                </div>
                <div style={{ flex: "1 1 260px", background: "#fff", borderRadius: 14, padding: "20px 22px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#b5892a", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Segundo período · solo 4° medio y NEE</p>
                  <p style={{ fontSize: 15, color: TEXT, margin: "0 0 4px" }}><strong style={{ color: NAVY }}>Inscripción:</strong> 12 de mayo al 17 de julio de 2026</p>
                  <p style={{ fontSize: 15, color: TEXT, margin: "0 0 4px" }}><strong style={{ color: NAVY }}>Rendición:</strong> 21 de septiembre al 2 de octubre de 2026</p>
                  <p style={{ fontSize: 15, color: TEXT, margin: 0 }}><strong style={{ color: NAVY }}>Resultados:</strong> 27 de octubre de 2026</p>
                </div>
                <div style={{ flex: "1 1 260px", background: "#fff", borderRadius: 14, padding: "20px 22px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#b5892a", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Tercer período · todos los cursos excepto 4° medio y NEE</p>
                  <p style={{ fontSize: 15, color: TEXT, margin: "0 0 4px" }}><strong style={{ color: NAVY }}>Inscripción:</strong> mismo plazo del primer período (6 al 29 de abril)</p>
                  <p style={{ fontSize: 15, color: TEXT, margin: "0 0 4px" }}><strong style={{ color: NAVY }}>Rendición:</strong> 19 al 30 de octubre de 2026</p>
                  <p style={{ fontSize: 15, color: TEXT, margin: 0 }}><strong style={{ color: NAVY }}>Resultados:</strong> 20 de noviembre de 2026</p>
                </div>
              </div>
              <p style={{ fontSize: 14, color: TEXT, margin: "0 0 18px" }}>
                Inscripción gratuita a través del Portal de Ayuda Mineduc. Quien necesite validar 4° medio o presente NEE solo puede inscribirse en el primer o segundo período (junio o septiembre) para asegurar la certificación a tiempo. <a href="/blog/como-inscribirse-examenes-libres-mineduc/" style={{ color: NAVY, fontWeight: 700 }}>Ver guía paso a paso →</a>
              </p>
              <a href="https://epja.mineduc.cl/wp-content/uploads/sites/43/2026/03/plazos-oficiales-2026-menores.pdf"
                target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#fff", background: NAVY, borderRadius: 999, padding: "12px 26px", fontSize: 15, fontWeight: 700 }}>
                <Download style={{ width: 17, height: 17 }} /> Ver calendario oficial MINEDUC (PDF)
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <div style={{ textAlign: "center" }}>
              <a href="/docs/malla-curricular-barkley.pdf" download
                style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: NAVY, border: `1.5px solid ${NAVY}`, borderRadius: 999, padding: "12px 26px", fontSize: 15, fontWeight: 700 }}>
                <Download style={{ width: 17, height: 17 }} /> Descargar folleto y malla curricular (PDF)
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* === URGENCIA — cupos limitados + primer pago en febrero 2027 === */}
      <section style={{ background: NAVY, padding: "40px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, left: -40, opacity: 0.3 }}><ShapeFlower color="#ffffff14" size={160} /></div>
        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 24, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: "50%", background: GOLD, flexShrink: 0 }}>
              <Hourglass style={{ width: 22, height: 22, color: NAVY }} strokeWidth={2.4} />
            </span>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Cupos limitados — proceso 2027</p>
              <p style={{ fontSize: "clamp(17px,2.4vw,22px)", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>
                Reserva tu cupo ahora. <span style={{ color: GOLD }}>Pagas recién en febrero de 2027.</span>
              </p>
            </div>
          </div>
          <motion.a whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }} href="#inscripcion"
            style={{ flexShrink: 0, fontSize: 15, fontWeight: 700, color: NAVY, background: GOLD, textDecoration: "none", borderRadius: 999, padding: "13px 28px", display: "inline-flex", alignItems: "center", gap: 8 }}>
            Reservar mi cupo <ArrowUpRight style={{ width: 17, height: 17 }} />
          </motion.a>
        </div>
      </section>

      {/* === PRECIO — un solo valor, sin matrícula, con descuento anual === */}
      <section id="precio" style={{ background: "#f5f5f5", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <p style={{ fontSize: 14, fontWeight: 600, color: RED, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Precio transparente</p>
            <h2 style={{ fontSize: "clamp(30px,5vw,52px)", fontWeight: 600, color: NAVY, margin: "0 0 12px" }}>Un solo valor, sin letra chica</h2>
            <p style={{ fontSize: 16, color: TEXT, margin: "0 auto 20px", maxWidth: 640 }}>
              Sin costos ocultos. El año de preparación va de <strong style={{ color: NAVY }}>marzo al 31 de octubre</strong>, cuando rindes tus exámenes libres. Todo incluido — 2 a 3 videos y pódcasts por lección, un tutor general que te acompaña en todo (no solo lo académico), asesor que sigue tu progreso y portal para tu familia.
            </p>
            <p style={{ display: "inline-block", background: "#fff8ea", border: `1px solid ${GOLD}`, borderRadius: 999, padding: "8px 20px", fontSize: 14.5, fontWeight: 700, color: NAVY, margin: "0 0 40px" }}>
              🎁 Matrícula gratis para quienes se inscriban antes del 30 de noviembre
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", alignItems: "stretch" }}>
              {/* Card mensual */}
              <div style={{ flex: "1 1 320px", maxWidth: 380, background: "#fff", borderRadius: 18, padding: "36px 32px", boxShadow: "0 6px 24px rgba(0,20,60,0.08)", textAlign: "left" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Plan mensual</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "10px 0 4px" }}>
                  <span style={{ fontSize: 48, fontWeight: 700, color: NAVY }}>$65.000</span>
                  <span style={{ fontSize: 16, color: TEXT }}>/ mes</span>
                </div>
                <p style={{ fontSize: 14, color: TEXT, margin: "0 0 22px" }}>Matrícula gratis si te inscribes antes del 30 de noviembre. De marzo a octubre, cancela cuando quieras.</p>
                {["Todas las asignaturas de tu nivel", "2 a 3 videos y pódcasts en cada lección", "Un tutor general que te acompaña integralmente", "Asesor que sigue tu progreso", "Portal Familia con avance en tiempo real", "Preparación para exámenes libres MINEDUC"].map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <Check style={{ width: 18, height: 18, color: GREEN, flexShrink: 0, marginTop: 2 }} strokeWidth={3} />
                    <span style={{ fontSize: 15, color: TEXT }}>{f}</span>
                  </div>
                ))}
                <a href="#inscripcion" style={{ display: "block", textAlign: "center", marginTop: 26, background: RED, color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 16, borderRadius: 999, padding: "14px 0" }}>Inscribirme →</a>
              </div>
              {/* Card anual destacada */}
              <div style={{ flex: "1 1 320px", maxWidth: 380, background: NAVY, color: "#fff", borderRadius: 18, padding: "36px 32px", boxShadow: "0 10px 30px rgba(0,20,60,0.25)", textAlign: "left", position: "relative", overflow: "hidden" }}>
                <span style={{ position: "absolute", top: 20, right: -34, background: GOLD, color: NAVY, fontSize: 12, fontWeight: 700, padding: "5px 40px", transform: "rotate(45deg)" }}>15% dcto</span>
                <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Pago único del año</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "10px 0 4px" }}>
                  <span style={{ fontSize: 48, fontWeight: 700 }}>$442.000</span>
                  <span style={{ fontSize: 16, opacity: 0.8, textDecoration: "line-through" }}>$520.000</span>
                </div>
                <p style={{ fontSize: 14, opacity: 0.85, margin: "0 0 22px" }}>15% de descuento por pagar todo el año de una vez. Ahorras $78.000.</p>
                {["Todo lo del plan mensual", "15% de descuento", "Precio congelado todo el año", "Un solo pago, cero preocupaciones"].map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <Check style={{ width: 18, height: 18, color: GOLD, flexShrink: 0, marginTop: 2 }} strokeWidth={3} />
                    <span style={{ fontSize: 15 }}>{f}</span>
                  </div>
                ))}
                <a href="#inscripcion" style={{ display: "block", textAlign: "center", marginTop: 26, background: GOLD, color: NAVY, textDecoration: "none", fontWeight: 700, fontSize: 16, borderRadius: 999, padding: "14px 0" }}>Quiero el pago único →</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* === FAQ === */}
      {faqs && faqs.length > 0 && (
        <section id="faq" style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 24px" }}>
          <Reveal><h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 600, color: SLATE, margin: "0 0 24px" }}>Preguntas frecuentes</h2></Reveal>
          {/* Dos columnas independientes para que el acordeón abierto no empuje la otra mitad */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", columnGap: 48, alignItems: "start" }}>
            {[faqs.filter((_, i) => i % 2 === 0), faqs.filter((_, i) => i % 2 === 1)].map((col, ci) => (
              <Accordion key={ci} type="single" collapsible>
                {col.map(f => (
                  <AccordionItem key={f.id} value={f.id} style={{ borderTop: "1px solid #eef1f5", borderBottom: "none" }}>
                    <AccordionTrigger style={{ fontSize: 15, fontWeight: 600, color: NAVY, padding: "12px 0", textAlign: "left" }} className="hover:no-underline">
                      {f.question}
                    </AccordionTrigger>
                    <AccordionContent style={{ fontSize: 14, opacity: 0.85, paddingBottom: 12 }}>
                      {f.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ))}
          </div>
        </section>
      )}

      {/* === SIN LÍMITES — remate del argumento "por qué no hay Zoom" justo antes
          del CTA final, con link a la página dedicada /sin-limites. Antes vivía
          a mitad de scroll, repitiendo el mismo punto que PILARES 20 segundos
          después — acá funciona como resumen + invitación a profundizar. === */}
      <section style={{ background: NAVY, padding: "72px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <span style={{ display: "inline-block", background: "rgba(255,197,72,0.15)", color: GOLD, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "7px 18px", borderRadius: 999, marginBottom: 20 }}>
              Por qué somos distintos
            </span>
            <h2 style={{ fontSize: "clamp(30px,5vw,48px)", fontWeight: 800, color: "#fff", margin: "0 0 20px", lineHeight: 1.15 }}>
              Aprende sin estar atrapado.
            </h2>
            <p style={{ fontSize: 17, color: "#cfe0f5", margin: "0 auto 36px", maxWidth: 620, lineHeight: 1.7 }}>
              Muchos colegios online solo trasladaron la sala de clases a Zoom: mismo horario fijo, mismo profesor exponiendo, misma sala llena. Eso no es libertad — es la misma jaula, con wifi. En Barkley el tutor da feedback, no dirige una clase a 40 personas a la vez.
            </p>
            <a href="/sin-limites" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GOLD, color: NAVY, textDecoration: "none", fontWeight: 700, fontSize: 15, letterSpacing: "0.02em", borderRadius: 999, padding: "16px 32px" }}>
              Ver el fundamento completo <ArrowUpRight size={16} />
            </a>
          </Reveal>
        </div>
      </section>

      {/* === CTA — bloque de color sólido navy === */}
      <section style={{ backgroundColor: NAVY, color: "#fff", padding: "72px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -20, left: -20, opacity: 0.5 }}><ShapeFlower color="#ffffff22" size={140} /></div>
        <Reveal>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative" }}>
            <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 600, margin: "0 0 16px" }}>¿Quieres saber más sobre Barkley Online?</h2>
            <p style={{ fontSize: 16, opacity: 0.85, margin: "0 0 28px" }}>Déjanos tus datos y te contactamos.</p>
            <motion.button whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }} onClick={() => document.getElementById("inscripcion")?.scrollIntoView({ behavior: "smooth" })}
              style={{ fontSize: 15, fontWeight: 700, color: NAVY, background: GOLD, border: "none", borderRadius: 999, padding: "14px 30px", cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 8 }}
            >Ir al formulario de inscripción <ArrowUpRight style={{ width: 18, height: 18 }} /></motion.button>
          </div>
        </Reveal>
      </section>

      {/* === INSCRIPCIÓN === */}
      <AdmisionSection anchorId="inscripcion" />

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
            <p style={{ fontSize: 14, margin: 0, lineHeight: 1.8, opacity: 0.85 }}>Colegio 100% asincrónico · Chile</p>
            <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
              <a href={INSTAGRAM_URL} target="_blank" rel="me noreferrer" aria-label="Instagram de Barkley Online" style={{ color: "#fff", opacity: 0.85, display: "flex" }}>
                <Instagram style={{ width: 20, height: 20 }} />
              </a>
              <a href={TIKTOK_URL} target="_blank" rel="me noreferrer" aria-label="TikTok de Barkley Online" style={{ color: "#fff", opacity: 0.85, display: "flex" }}>
                <TikTokIcon style={{ width: 20, height: 20 }} />
              </a>
            </div>
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Enlaces útiles</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6, fontSize: 14, opacity: 0.85 }}>
              <li><a href="#metodo" style={{ color: "#fff" }}>El método</a></li>
              <li><a href="#plataforma" style={{ color: "#fff" }}>La plataforma</a></li>
              <li><a href="/adaptativo" style={{ color: "#fff" }}>Adaptativo</a></li>
              <li><a href="/guia-examenes-libres/" style={{ color: "#fff" }}>Guía de Exámenes Libres</a></li>
              <li><a href="/blog/" style={{ color: "#fff" }}>Blog</a></li>
              <li><a href="#faq" style={{ color: "#fff" }}>Preguntas frecuentes</a></li>
              <li><a href="#inscripcion" style={{ color: "#fff" }}>Inscripción</a></li>
            </ul>
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Validación oficial</p>
            <p style={{ fontSize: 13, margin: 0, opacity: 0.75 }}>Preparación para Exámenes Libres ante el Ministerio de Educación de Chile (MINEDUC).</p>
          </div>
          <div style={{ flex: "1 1 100%", marginTop: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Exámenes libres por nivel</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", fontSize: 13, opacity: 0.85 }}>
              {["1-basico|1° Básico", "2-basico|2° Básico", "3-basico|3° Básico", "4-basico|4° Básico", "5-basico|5° Básico", "6-basico|6° Básico", "7-basico|7° Básico", "8-basico|8° Básico", "1-medio|1° Medio", "2-medio|2° Medio", "3-medio|3° Medio", "4-medio|4° Medio"].map((item) => {
                const [slug, label] = item.split("|");
                return <a key={slug} href={`/examenes-libres-${slug}/`} style={{ color: "#fff" }}>{label}</a>;
              })}
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1280, margin: "32px auto 0", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, position: "relative" }}>
          <p style={{ fontSize: 13, opacity: 0.6, margin: 0 }}>© {new Date().getFullYear()} Barkley Online</p>
          <div style={{ display: "flex", gap: 16, fontSize: 13, opacity: 0.85 }}>
            <a href="/privacidad" style={{ color: "#fff" }}>Privacidad</a>
            <a href="/terminos" style={{ color: "#fff" }}>Términos de uso</a>
            <a href="/reembolso" style={{ color: "#fff" }}>Reembolso</a>
          </div>
        </div>
      </footer>

      <ReservationDialog open={callOpen} onOpenChange={setCallOpen} />
    </div>
  );
}
