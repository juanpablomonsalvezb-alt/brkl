/**
 * Secciones de detalle que antes vivían en la home (Así está construido,
 * Herramientas, Todo incluido). Se movieron a páginas propias (/por-dentro)
 * para acortar la home; ahí las enlaza el índice PorDentroHub.
 * Mismo código visual que tenían en Home.tsx, sin cambios de diseño.
 */
import { motion } from "framer-motion";
import {
  ArrowUpRight, Play, Download, Circle, Triangle, Star, Heart, Leaf, Rows3, Search,
  Layers, BookOpen, Headphones, Image as ImageIcon, ListChecks, Sparkles,
  Lock, CheckCircle2, ArrowDown, CalendarCheck, CalendarClock,
} from "lucide-react";

const NAVY = "#003366";
const RED = "#FF3D37";
const GOLD = "#FFC548";
const PURPLE = "#861fce";
const GREEN = "#00b273";
const PINK = "#fe76b4";
const TEXT = "#525252";
const SLATE = "#5b7ba3";
const BLOCK_BLUE = "#4a7be0";

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

function ShapeCircle({ color, size = 40 }: { color: string; size?: number }) {
  return <Circle color={color} fill={color} size={size} strokeWidth={0} />;
}
function ShapeStar({ color, size = 40 }: { color: string; size?: number }) {
  return <Star color={color} fill={color} size={size} strokeWidth={0} />;
}
function ShapeFlower({ color, size = 40 }: { color: string; size?: number }) {
  return <Leaf color={color} fill={color} size={size} strokeWidth={0} />;
}

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
    texto: "Además del temario oficial: programación, IA, ajedrez, historia del arte, educación financiera y más — distinto según el ciclo. Mismo formato de video y práctica. Cumplir con el colegio es el comienzo.",
    color: SLATE,
    Icon: Sparkles,
  },
];

export function EstructuraSection() {
  return (
    <>
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
                <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0 }}>Las evaluaciones de unidad y los <a href="/#calendario" style={{ color: GOLD, fontWeight: 600 }}>períodos oficiales MINEDUC</a> tienen plazo fijo. Es semiflexibilidad: libre en el día a día, firme en el calendario.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

export function HerramientasSection() {
  return (
    <>
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
    </>
  );
}

export function ServiciosSection() {
  return (
    <>
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
                <div style={{ flex: "1 1 320px", alignSelf: "center", maxWidth: 620 }}>
                  <p style={{ fontSize: 14.5, color: TEXT, margin: "0 0 12px", lineHeight: 1.75 }}>{s.texto}</p>
                  <a href="/electivos" style={{ fontSize: 14.5, fontWeight: 700, color: NAVY, textDecoration: "underline", textDecorationColor: s.color }}>
                    Ver todos los electivos →
                  </a>
                </div>
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
                  href="/#inscripcion"
                  style={{ display: "inline-block", marginTop: 4, background: RED, color: "#fff", fontWeight: 700, fontSize: 15, padding: "14px 28px", borderRadius: 999, textDecoration: "none" }}
                >
                  Reservar cupo 2027 →
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
