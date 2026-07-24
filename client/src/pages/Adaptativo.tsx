/**
 * Adaptativo — programa de Barkley, página propia e interactiva para
 * familias con hijos con TDAH o dislexia. El selector muestra las
 * acomodaciones REALES ya implementadas en AdaptiveProfileService
 * (barkley-platform/src/server/services/adaptive-profile.service.ts) —
 * no conceptos genéricos. Sin perfil TEA/"otro ritmo": la plataforma no
 * tiene esa lógica implementada todavía, listarlo sería sobre-prometer.
 * Mismo lenguaje visual que Home.tsx (colores isb.be).
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain, BookOpen, Check, Headphones, Video, Clock,
  ListChecks, Repeat, Shield, ArrowRight, HelpCircle,
} from "lucide-react";

const NAVY = "#003366";
const GOLD = "#FFC548";
const PURPLE = "#861fce";
const TEXT = "#525252";
const FONT = "'Poppins', sans-serif";

function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// Perfiles reales: coinciden exactamente con AdaptiveProfileService
// (server/services/adaptive-profile.service.ts) en barkley-platform — un motor
// de reglas determinístico, sin LLM, que resuelve acomodaciones en render time
// según el perfil declarado en la matrícula. No se lista un perfil TEA/"otro
// ritmo" porque la plataforma hoy NO tiene esa lógica implementada — listarlo
// sería prometer algo que no existe todavía.
type ProfileKey = "tdah" | "dislexia";

const PROFILES: Record<ProfileKey, {
  label: string;
  icon: typeof Brain;
  headline: string;
  intro: string;
  techniques: { icon: typeof Brain; title: string; text: string }[];
}> = {
  tdah: {
    label: "TDAH",
    icon: Brain,
    headline: "Bloques de 7 minutos, sin timer, con reintentos",
    intro: "El desafío real del TDAH no es la capacidad — es sostener atención en bloques largos y fijos que no eligió. Barkley elimina esa exigencia en vez de pedirle que la supere. Esto no es una promesa: es una configuración real y activa en la plataforma.",
    techniques: [
      { icon: Clock, title: "Lecciones partidas en bloques de máximo 7 minutos", text: "En vez de un video largo, el sistema corta el contenido en bloques con pausa obligatoria — la misma lógica de chunking que usan los programas de educación especial más avanzados del mundo (Acellus SPED-X)." },
      { icon: ListChecks, title: "Sin cronómetro visible en las evaluaciones", text: "El temporizador de los quiz se oculta para este perfil — la presión de un reloj corriendo es, para muchos estudiantes con TDAH, más disruptiva que la pregunta misma." },
      { icon: Repeat, title: "Reintentos permitidos, cuenta el mejor puntaje", text: "Si el primer intento sale mal por una distracción, no queda esa nota fija — puede reintentar y el sistema se queda con el mejor resultado." },
      { icon: Shield, title: "Check-in del asesor cada 3 días, no cada semana", text: "El asesor humano hace seguimiento más frecuente que con un estudiante estándar — detecta antes si algo se está atrasando." },
    ],
  },
  dislexia: {
    label: "Dislexia",
    icon: BookOpen,
    headline: "Fuente OpenDyslexic, texto a voz, fondo crema",
    intro: "La dificultad de la dislexia es con el texto, no con el contenido. Estas no son sugerencias de diseño — son ajustes reales que la plataforma activa automáticamente para este perfil.",
    techniques: [
      { icon: BookOpen, title: "Fuente OpenDyslexic activable", text: "Tipografía diseñada específicamente para reducir la confusión de letras simétricas (b/d, p/q), disponible como opción real dentro de la plataforma." },
      { icon: Headphones, title: "Texto a voz en el contenido de las lecciones", text: "El texto escrito de cada lección puede escucharse en vez de leerse — mismo mecanismo que usan las herramientas de lectura asistida recomendadas para dislexia." },
      { icon: Video, title: "Interlineado 1.8 y fondo crema, no blanco puro", text: "El contraste extremo de texto negro sobre blanco cansa más a un lector con dislexia; el fondo #FFF8F0 y el espaciado ampliado reducen ese esfuerzo visual." },
      { icon: ListChecks, title: "Vocabulario clave en español e inglés", text: "Las listas de vocabulario de cada unidad se presentan en ambos idiomas, apoyo adicional documentado para comprensión lectora en dislexia." },
    ],
  },
};

const FAQS = [
  { q: "¿Adaptativo es una terapia o tratamiento?", a: "No. Es un formato de estudio que se acomoda a cómo aprende tu hijo — no una terapia ni un tratamiento clínico. El acompañamiento profesional (psicopedagogo, terapeuta ocupacional, neurólogo) sigue siendo el de tu confianza; Barkley no lo reemplaza." },
  { q: "¿Rinde los mismos exámenes que el resto?", a: "Sí. El contenido es el temario oficial MINEDUC completo y la validación es la misma: Exámenes Libres. Se adapta la forma de aprender, nunca la exigencia académica." },
  { q: "¿Necesito un diagnóstico o informe para matricular?", a: "No lo pedimos para matricular. La conversación inicial con el asesor es donde definimos juntos cómo adaptar el recorrido según lo que cuentes de tu hijo." },
  { q: "¿Qué pasa si mi hijo tiene TDAH y dislexia a la vez?", a: "La plataforma tiene un tercer perfil, 'combinado', que activa todas las acomodaciones de ambos a la vez — bloques cortos y sin timer, además de fuente OpenDyslexic y texto a voz. No es necesario elegir una sola." },
  { q: "¿Y si mi hijo tiene TEA u otro perfil que no está en esta página?", a: "Hoy la plataforma solo tiene acomodaciones automáticas para TDAH y dislexia — todavía no para TEA ni otros perfiles. Preferimos decirlo con franqueza a prometer algo que aún no está construido. Escríbenos y lo conversamos igual: puede haber acompañamiento posible aunque no sea automático en la plataforma." },
];

export default function Adaptativo() {
  const [profile, setProfile] = useState<ProfileKey>("tdah");
  const active = PROFILES[profile];
  const ActiveIcon = active.icon;

  useEffect(() => {
    document.title = "Adaptativo — Colegio online para niños con TDAH y dislexia | Barkley Online";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Adaptativo, el programa de Barkley: acomodaciones reales para TDAH (bloques de 7 min, sin timer, reintentos) y dislexia (fuente OpenDyslexic, texto a voz, fondo crema). Preparación oficial para Exámenes Libres MINEDUC en Chile.");
  }, []);

  return (
    <div style={{ backgroundColor: "#fff", color: TEXT, fontFamily: FONT, fontSize: 16, lineHeight: 1.75 }}>
      {/* === HEADER simple, coherente con el resto del sitio === */}
      <header style={{ padding: "22px 24px", borderBottom: "1px solid #eee" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 42, height: 42, background: NAVY, border: `2px solid ${GOLD}`, borderRadius: 8, color: "#fff", fontWeight: 800, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>BK</div>
            <span style={{ fontWeight: 700, color: NAVY, fontSize: 15, lineHeight: 1.2 }}>The Barkley<br />Online School</span>
          </a>
          <a href="/#inscripcion" style={{ background: "#FF3D37", color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 14, padding: "10px 22px", borderRadius: 999 }}>Inscribirse</a>
        </div>
      </header>

      {/* === HERO === */}
      <section style={{ background: PURPLE, color: "#fff", padding: "64px 24px 56px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ color: GOLD, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
            Adaptativo · el programa de Barkley para 1° básico a 4° medio
          </p>
          <h1 style={{ fontSize: "clamp(30px,5.2vw,48px)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 18px" }}>
            No todos aprenden igual.<br />No todos deberían estudiar igual.
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.92)", maxWidth: 680, margin: 0 }}>
            Si tu hijo tiene TDAH o dislexia, el problema casi nunca es él —
            es el formato. Elige su perfil abajo y mira exactamente qué acomodaciones activa la plataforma.
          </p>
        </div>
      </section>

      {/* === SELECTOR DE PERFIL === */}
      <section style={{ padding: "48px 24px 8px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {(Object.keys(PROFILES) as ProfileKey[]).map((key) => {
              const p = PROFILES[key];
              const Icon = p.icon;
              const isActive = profile === key;
              return (
                <button
                  key={key}
                  onClick={() => setProfile(key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    border: isActive ? `2px solid ${PURPLE}` : "2px solid #e8e8e8",
                    background: isActive ? "#f6f1ff" : "#fff",
                    color: isActive ? PURPLE : TEXT,
                    borderRadius: 999, padding: "14px 26px",
                    fontWeight: 700, fontSize: 15, fontFamily: FONT, cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon style={{ width: 20, height: 20 }} />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* === CONTENIDO POR PERFIL (animado al cambiar) === */}
      <section style={{ padding: "40px 24px 64px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {/* Sin motion/AnimatePresence acá a propósito: el snapshot prerenderizado
              (Puppeteer) captura los estilos inline de framer-motion ya resueltos
              (opacity:1) mientras el primer render del cliente parte en su estado
              `initial` (opacity:0) — el mismatch de hidratación resultante hacía que
              React dejara de reconciliar este subárbol en cambios de estado
              posteriores (el botón cambiaba de estilo, el contenido no). Div plano,
              sin animación de entrada/salida, evita la clase de bug entera. */}
          <div key={profile}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f6f1ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ActiveIcon style={{ width: 26, height: 26, color: PURPLE }} />
              </div>
              <h2 style={{ fontSize: "clamp(22px,3.4vw,30px)", fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.2 }}>{active.headline}</h2>
            </div>
            <p style={{ fontSize: 16.5, color: TEXT, maxWidth: 700, margin: "0 0 32px" }}>{active.intro}</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
              {active.techniques.map((t) => {
                const TIcon = t.icon;
                return (
                  <div key={t.title} style={{ background: "#f8f8f8", borderRadius: 16, padding: 24 }}>
                    <TIcon style={{ width: 22, height: 22, color: PURPLE, marginBottom: 10 }} />
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>{t.title}</h3>
                    <p style={{ fontSize: 14.5, margin: 0 }}>{t.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* === LO QUE NO CAMBIA, sea cual sea el perfil === */}
      <section style={{ background: NAVY, color: "#fff", padding: "64px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ color: "#fff", fontSize: "clamp(22px,3.4vw,30px)", fontWeight: 700, margin: "0 0 28px", textAlign: "center" }}>
            Lo que nunca cambia, sea cual sea su perfil
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
            <Reveal>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
                <Check style={{ width: 22, height: 22, color: GOLD, marginBottom: 10 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: GOLD, margin: "0 0 8px" }}>Mismo temario oficial</h3>
                <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.85)", margin: 0 }}>Currículo MINEDUC completo, sin recorte ni versión simplificada.</p>
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
                <Check style={{ width: 22, height: 22, color: GOLD, marginBottom: 10 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: GOLD, margin: "0 0 8px" }}>Misma validación oficial</h3>
                <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.85)", margin: 0 }}>Exámenes Libres MINEDUC, igual que cualquier estudiante Barkley.</p>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
                <Check style={{ width: 22, height: 22, color: GOLD, marginBottom: 10 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: GOLD, margin: "0 0 8px" }}>Acompañamiento humano real</h3>
                <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.85)", margin: 0 }}>Un asesor sigue su proceso — no es contenido que corre solo.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      <section style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px,3.4vw,30px)", fontWeight: 700, color: NAVY, margin: "0 0 24px", display: "flex", alignItems: "center", gap: 10 }}>
            <HelpCircle style={{ width: 26, height: 26, color: PURPLE }} />
            Preguntas frecuentes
          </h2>
          {FAQS.map((f) => (
            <div key={f.q} style={{ borderBottom: "1px solid #eee", padding: "20px 0" }}>
              <b style={{ display: "block", color: NAVY, fontSize: 16.5, marginBottom: 8 }}>{f.q}</b>
              <p style={{ fontSize: 15, margin: 0 }}>{f.a}</p>
            </div>
          ))}
          <p style={{ fontSize: 13.5, color: "#8a8a8a", maxWidth: 620, margin: "28px auto 0", textAlign: "center" }}>
            Adaptativo no reemplaza el diagnóstico ni el tratamiento profesional de tu hijo —
            es un formato de estudio que se acomoda a cómo aprende, no una terapia.
          </p>
        </div>
      </section>

      {/* === CTA FINAL === */}
      <section style={{ background: "#f5f5f5", padding: "56px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px,3.4vw,30px)", fontWeight: 700, color: NAVY, margin: "0 0 12px" }}>
            Mismo valor que todo Barkley, sin recargo
          </h2>
          <p style={{ fontSize: 32, fontWeight: 800, color: NAVY, margin: "0 0 6px" }}>$65.000 <span style={{ fontSize: 15, fontWeight: 500, color: TEXT }}>/ mes</span></p>
          <p style={{ fontSize: 14.5, margin: "0 0 26px" }}>O pago anual de $442.000 (15% dcto). Reserva ahora sin costo — pagas recién en febrero de 2027.</p>
          <a href="/#inscripcion" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FF3D37", color: "#fff", fontWeight: 700, fontSize: 15, padding: "14px 30px", borderRadius: 999, textDecoration: "none" }}>
            Reservar cupo en Adaptativo <ArrowRight style={{ width: 16, height: 16 }} />
          </a>
        </div>
      </section>

      <footer style={{ background: NAVY, color: "rgba(255,255,255,0.75)", fontSize: 13, textAlign: "center", padding: "26px 24px" }}>
        <p style={{ margin: 0 }}>
          Barkley Online — Colegio 100% asincrónico e inclusivo en Chile · Preparación para Exámenes Libres ante el MINEDUC ·{" "}
          <a href="/" style={{ color: GOLD, textDecoration: "none" }}>barkleyinstituto.cl</a>
        </p>
      </footer>
    </div>
  );
}
