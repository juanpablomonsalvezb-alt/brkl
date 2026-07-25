/**
 * Adaptativo — programa de Barkley, página propia e interactiva para
 * familias con hijos con TDAH o dislexia. El selector muestra las
 * acomodaciones REALES ya implementadas en AdaptiveProfileService
 * (barkley-platform/src/server/services/adaptive-profile.service.ts) —
 * no conceptos genéricos. Sin perfil TEA/"otro ritmo": la plataforma no
 * tiene esa lógica implementada todavía, listarlo sería sobre-prometer.
 * Mismo lenguaje visual que Home.tsx (colores isb.be), reusando el patrón
 * de módulo de método (pasos numerados en auto-play) para que la
 * metodología se explique con el mismo nivel visual que el resto del sitio.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, BookOpen, Check, Headphones, Video, Clock,
  ListChecks, Repeat, Shield, ArrowRight, HelpCircle, X,
} from "lucide-react";

const NAVY = "#003366";
const GOLD = "#FFC548";
const PURPLE = "#861fce";
const RED = "#FF3D37";
const GREEN = "#00b273";
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

interface Paso { n: string; title: string; text: string; color: string; }
interface ComparisonRow { label: string; estandar: string; adaptativo: string; }

const PROFILES: Record<ProfileKey, {
  label: string;
  icon: typeof Brain;
  headline: string;
  intro: string;
  pasos: Paso[];
  comparison: ComparisonRow[];
}> = {
  tdah: {
    label: "TDAH",
    icon: Brain,
    headline: "Bloques de 7 minutos, sin timer, con reintentos",
    intro: "El desafío real del TDAH no es la capacidad — es sostener atención en bloques largos y fijos que no eligió. Esto no es una promesa: así queda configurada la plataforma apenas se declara el perfil en la matrícula.",
    pasos: [
      { n: "01", title: "El video se corta en bloques de 7 min", text: "En vez de una lección larga, el sistema la parte en bloques con pausa obligatoria entre uno y otro — la misma lógica de chunking que usan los programas de educación especial más avanzados (Acellus SPED-X).", color: GOLD },
      { n: "02", title: "La evaluación no muestra cronómetro", text: "El temporizador del quiz se oculta para este perfil. Para muchos estudiantes con TDAH, la presión de un reloj corriendo distrae más que la pregunta misma.", color: GREEN },
      { n: "03", title: "Si falla, puede reintentar", text: "Un mal resultado por una distracción puntual no queda fijo — el sistema permite reintentar y se queda con el mejor puntaje de los intentos.", color: PURPLE },
      { n: "04", title: "El asesor revisa cada 3 días, no cada 7", text: "El seguimiento humano es más frecuente que el estándar — así se detecta un atraso antes de que se acumule.", color: RED },
    ],
    comparison: [
      { label: "Duración del bloque de video", estandar: "Sin límite fijo", adaptativo: "Máximo 7 minutos" },
      { label: "Cronómetro en evaluaciones", estandar: "Visible", adaptativo: "Oculto" },
      { label: "Reintentos en evaluación", estandar: "No", adaptativo: "Sí — cuenta el mejor puntaje" },
      { label: "Frecuencia de check-in del asesor", estandar: "Cada 7 días", adaptativo: "Cada 3 días" },
    ],
  },
  dislexia: {
    label: "Dislexia",
    icon: BookOpen,
    headline: "Fuente OpenDyslexic, texto a voz, fondo crema",
    intro: "La dificultad de la dislexia es con el texto, no con el contenido. Estos no son ajustes de diseño sugeridos — son configuraciones reales que la plataforma activa apenas se declara el perfil.",
    pasos: [
      { n: "01", title: "Activa la fuente OpenDyslexic", text: "Tipografía diseñada específicamente para reducir la confusión entre letras simétricas (b/d, p/q) — se activa como opción real dentro de la cuenta del estudiante.", color: GOLD },
      { n: "02", title: "Escucha el texto en vez de leerlo", text: "El contenido escrito de cada lección puede convertirse a audio — mismo mecanismo que usan las herramientas de lectura asistida recomendadas para dislexia.", color: GREEN },
      { n: "03", title: "Lee sobre fondo crema, con más espacio", text: "El contraste extremo de texto negro sobre blanco puro cansa más a un lector con dislexia. El fondo #FFF8F0 y el interlineado 1.8 (vs. 1.6 estándar) reducen ese esfuerzo visual.", color: PURPLE },
      { n: "04", title: "Repasa vocabulario en dos idiomas", text: "Las listas de vocabulario clave de cada unidad aparecen en español e inglés — apoyo adicional documentado para comprensión lectora en dislexia.", color: RED },
    ],
    comparison: [
      { label: "Tipografía", estandar: "Estándar de la plataforma", adaptativo: "OpenDyslexic (activable)" },
      { label: "Texto a voz", estandar: "No disponible", adaptativo: "Sí, en toda lección" },
      { label: "Fondo de lectura", estandar: "Blanco", adaptativo: "Crema #FFF8F0" },
      { label: "Interlineado", estandar: "1.6", adaptativo: "1.8" },
      { label: "Vocabulario de la unidad", estandar: "Solo español", adaptativo: "Español + inglés" },
    ],
  },
};

const FAQS = [
  { q: "¿Adaptativo es una terapia o tratamiento?", a: "No. Es un formato de estudio que se acomoda a cómo aprende tu hijo — no una terapia ni un tratamiento clínico. El acompañamiento profesional (psicopedagogo, terapeuta ocupacional, neurólogo) sigue siendo el de tu confianza; Barkley no lo reemplaza." },
  { q: "¿Rinde los mismos exámenes que el resto?", a: "Sí. El contenido es el temario oficial MINEDUC completo y la validación es la misma: Exámenes Libres. Se adapta la forma de aprender, nunca la exigencia académica." },
  { q: "¿Necesito un diagnóstico o informe para matricular?", a: "No lo pedimos para matricular. En el formulario de inscripción puedes indicar si tu hijo tiene TDAH o dislexia, y la conversación con el asesor define cómo activar el perfil correcto." },
  { q: "¿Qué pasa si mi hijo tiene TDAH y dislexia a la vez?", a: "La plataforma tiene un tercer perfil, 'combinado', que activa todas las acomodaciones de ambos a la vez — bloques cortos y sin timer, además de fuente OpenDyslexic y texto a voz. No es necesario elegir una sola." },
  { q: "¿Y si mi hijo tiene TEA u otro perfil que no está en esta página?", a: "Hoy la plataforma solo tiene acomodaciones automáticas para TDAH y dislexia — todavía no para TEA ni otros perfiles. Preferimos decirlo con franqueza a prometer algo que aún no está construido. Escríbenos y lo conversamos igual: puede haber acompañamiento posible aunque no sea automático en la plataforma." },
];

function PasosModule({ pasos }: { pasos: Paso[] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    setIdx(0);
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % pasos.length), 4200);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasos, paused]);
  const paso = pasos[idx];
  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "clamp(24px,5vw,44px)", minHeight: 200 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${paso.n}-${paso.title}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", flexWrap: "wrap", gap: "clamp(18px,4vw,40px)", alignItems: "center" }}
        >
          <span style={{ fontSize: "clamp(52px,10vw,96px)", fontWeight: 800, color: paso.color, lineHeight: 0.9, flexShrink: 0 }}>{paso.n}</span>
          <div style={{ flex: "1 1 300px", minWidth: 240 }}>
            <h3 style={{ fontSize: "clamp(20px,3.2vw,28px)", fontWeight: 600, color: "#fff", margin: "0 0 10px" }}>{paso.title}</h3>
            <p style={{ fontSize: "clamp(15px,1.8vw,17px)", lineHeight: 1.6, color: "rgba(255,255,255,0.88)", margin: 0 }}>{paso.text}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div style={{ display: "flex", gap: 8, marginTop: 28, justifyContent: "center" }}>
        {pasos.map((p, i) => (
          <button
            key={p.n}
            aria-label={`Paso ${i + 1}: ${p.title}`}
            onClick={() => setIdx(i)}
            style={{ width: i === idx ? 36 : 10, height: 6, borderRadius: 3, border: "none", background: i === idx ? GOLD : "rgba(255,255,255,0.25)", cursor: "pointer", transition: "width 0.3s, background 0.3s" }}
          />
        ))}
      </div>
    </div>
  );
}

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
          <a href="/#inscripcion" style={{ background: RED, color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 14, padding: "10px 22px", borderRadius: 999 }}>Inscribirse</a>
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
            es el formato. Elige su perfil abajo y mira, paso a paso, cómo funciona de verdad.
          </p>
        </div>
      </section>

      {/* === SELECTOR DE PERFIL === */}
      <section style={{ padding: "48px 24px 0" }}>
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

      {/* === MÓDULO DE METODOLOGÍA — pasos numerados en auto-play, mismo patrón
          visual que "Aprendizaje por Dominio" en el home. Explica el MECANISMO
          real paso a paso, no una lista plana de bullets. === */}
      <section style={{ background: NAVY, padding: "48px 24px 56px", marginTop: 40 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ActiveIcon style={{ width: 24, height: 24, color: GOLD }} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Cómo funciona · {active.label}</p>
              <h2 style={{ fontSize: "clamp(20px,3vw,26px)", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.25 }}>{active.headline}</h2>
            </div>
          </div>
          <p style={{ fontSize: 15.5, color: "rgba(255,255,255,0.82)", maxWidth: 700, margin: "0 0 28px" }}>{active.intro}</p>
          <PasosModule pasos={active.pasos} />
        </div>
      </section>

      {/* === TABLA COMPARATIVA — estándar vs. Adaptativo, fila por fila === */}
      <section style={{ padding: "56px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(20px,3vw,26px)", fontWeight: 700, color: NAVY, margin: "0 0 20px", textAlign: "center" }}>
            Qué cambia exactamente frente al estándar
          </h2>
          <div style={{ overflowX: "auto", borderRadius: 16, border: "1px solid #eee" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14.5, minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "14px 18px", background: "#f8f8f8", color: NAVY, fontWeight: 700 }}></th>
                  <th style={{ textAlign: "left", padding: "14px 18px", background: "#f8f8f8", color: TEXT, fontWeight: 600 }}>Estándar</th>
                  <th style={{ textAlign: "left", padding: "14px 18px", background: "#f6f1ff", color: PURPLE, fontWeight: 700 }}>Adaptativo · {active.label}</th>
                </tr>
              </thead>
              <tbody>
                {active.comparison.map((row, i) => (
                  <tr key={row.label} style={{ background: i % 2 === 0 ? "#fff" : "#fbfbfb" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: NAVY, borderTop: "1px solid #eee" }}>{row.label}</td>
                    <td style={{ padding: "14px 18px", color: "#8a8a8a", borderTop: "1px solid #eee" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <X style={{ width: 14, height: 14, opacity: 0.5 }} />{row.estandar}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", color: NAVY, fontWeight: 600, borderTop: "1px solid #eee" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Check style={{ width: 14, height: 14, color: GREEN }} />{row.adaptativo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* === LO QUE NO CAMBIA, sea cual sea el perfil === */}
      <section style={{ background: "#f6f1ff", padding: "64px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ color: NAVY, fontSize: "clamp(22px,3.4vw,30px)", fontWeight: 700, margin: "0 0 28px", textAlign: "center" }}>
            Lo que nunca cambia, sea cual sea su perfil
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
            <Reveal>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 16px rgba(0,20,60,0.08)" }}>
                <Check style={{ width: 22, height: 22, color: PURPLE, marginBottom: 10 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>Mismo temario oficial</h3>
                <p style={{ fontSize: 14.5, color: TEXT, margin: 0 }}>Currículo MINEDUC completo, sin recorte ni versión simplificada.</p>
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 16px rgba(0,20,60,0.08)" }}>
                <Check style={{ width: 22, height: 22, color: PURPLE, marginBottom: 10 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>Misma validación oficial</h3>
                <p style={{ fontSize: 14.5, color: TEXT, margin: 0 }}>Exámenes Libres MINEDUC, igual que cualquier estudiante Barkley.</p>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 16px rgba(0,20,60,0.08)" }}>
                <Check style={{ width: 22, height: 22, color: PURPLE, marginBottom: 10 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>Acompañamiento humano real</h3>
                <p style={{ fontSize: 14.5, color: TEXT, margin: 0 }}>Un asesor sigue su proceso — no es contenido que corre solo.</p>
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
          <p style={{ fontSize: 14.5, margin: "0 0 26px" }}>O pago anual de $442.000 (15% dcto). Reserva ahora sin costo — pagas recién en febrero de 2027. En el formulario puedes indicar el perfil de tu hijo.</p>
          <a href="/#inscripcion" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: RED, color: "#fff", fontWeight: 700, fontSize: 15, padding: "14px 30px", borderRadius: 999, textDecoration: "none" }}>
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
