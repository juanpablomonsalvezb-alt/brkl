/**
 * Barkley Adaptativo — página propia, interactiva, para familias con hijos
 * con TDAH, dislexia u otro ritmo de aprendizaje. Selector de perfil que
 * cambia la metodología mostrada, basada en técnicas reales documentadas
 * (UDL, Vectored Instruction de Acellus, horarios visuales para TEA) — no
 * inventadas. Mismo lenguaje visual que Home.tsx (colores isb.be).
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain, BookOpen, Compass, Check, Headphones, Video, Clock,
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

type ProfileKey = "tdah" | "dislexia" | "otro";

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
    headline: "Bloques cortos, refuerzo dirigido, cero espera obligada",
    intro: "El desafío real del TDAH no es la capacidad — es sostener atención en bloques largos y fijos que no eligió. Barkley elimina esa exigencia en vez de pedirle que la supere.",
    techniques: [
      { icon: Clock, title: "Microaprendizaje en bloques de 3 a 6 minutos", text: "Cada objetivo se divide en videos cortos, no en clases de 45 minutos. Es la misma técnica de chunking que usan los programas de educación especial más avanzados del mundo (Acellus SPED-X): fragmentar el contenido en piezas que sí se pueden sostener." },
      { icon: ListChecks, title: "Refuerzo dirigido al error específico, no repetición completa", text: "Si falla dos veces la misma pregunta, el sistema no lo hace repetir la unidad entera — le muestra un refuerzo puntual de 1 a 2 minutos sobre justo ese concepto. Es el mismo principio de la 'Instrucción Vectorizada' de Acellus: identificar por qué falló, no solo que falló." },
      { icon: Repeat, title: "Avance por logro, no por reloj", text: "Cada unidad completada es un cierre real y visible — no una clase que termina porque se acabó la hora. El progreso se mide en dominio, no en tiempo sentado." },
      { icon: Shield, title: "Sin comparación en vivo con el curso", text: "No hay 30 compañeros avanzando a la vez ni la presión de \"todos ya entendieron menos yo\". Avanza contra su propio progreso anterior." },
    ],
  },
  dislexia: {
    label: "Dislexia",
    icon: BookOpen,
    headline: "Dos formatos por lección: para ver o para escuchar",
    intro: "La dificultad de la dislexia es con el texto, no con el contenido. Si el camino de entrada es solo lectura, el problema no es lo que el estudiante sabe — es la puerta que usamos para llegar a eso.",
    techniques: [
      { icon: Headphones, title: "Pódcast como formato principal, no como extra", text: "Cada objetivo del temario viene también en audio narrado — la misma técnica que usan las herramientas de lectura asistida (text-to-speech) que se recomiendan para dislexia, integrada de fábrica en cada lección." },
      { icon: Video, title: "Video con apoyo visual, nunca solo texto en pantalla", text: "Aprendizaje multisensorial: lo que se explica en palabras se refuerza con imagen y ejemplo visual — la combinación que más ayuda a fijar el concepto cuando leer cuesta." },
      { icon: ListChecks, title: "Contenido troceado, nunca un bloque largo de texto", text: "La misma técnica de chunking que se usa en diseño de e-learning para dislexia: piezas breves y autocontenidas en vez de párrafos extensos." },
      { icon: Repeat, title: "Pausa y repetición sin límite, sin quedar atrás", text: "Puede volver a escuchar o ver una parte tantas veces como necesite sin que el resto del curso avance sin él — porque no hay 'resto del curso avanzando' en tiempo real." },
    ],
  },
  otro: {
    label: "Otro ritmo",
    icon: Compass,
    headline: "Previsibilidad total: sin sorpresas, sin cambios de último minuto",
    intro: "Para muchos estudiantes con TEA u otros perfiles sensoriales, la ansiedad no viene del contenido — viene de no saber qué sigue. Barkley resuelve eso con estructura visible, siempre igual.",
    techniques: [
      { icon: ListChecks, title: "La misma estructura, siempre, en todos los niveles", text: "Asignatura → Unidad → Lección → Formatos fijos (2 videos, 1 pódcast, guía, evaluación). Es el equivalente asincrónico de un horario visual: el estudiante siempre sabe exactamente qué viene después." },
      { icon: Shield, title: "Estudia en su entorno conocido, sin sobrecarga sensorial", text: "Sin aula ruidosa, sin luces ni texturas impuestas, sin bullying — el espacio de estudio es el que la familia ya adaptó para él." },
      { icon: Clock, title: "Sin transiciones forzadas entre actividades", text: "Nada de 'ahora cambien todos de actividad' al sonar un timbre. Cada estudiante decide cuándo termina un bloque y empieza el siguiente." },
      { icon: Repeat, title: "Rutina propia, repetible día a día", text: "Puede construir su propio ritual de estudio — mismo horario, mismo orden, mismas señales — sin que el colegio se lo imponga distinto cada semana." },
    ],
  },
};

const FAQS = [
  { q: "¿Adaptativo es una terapia o tratamiento?", a: "No. Es un formato de estudio que se acomoda a cómo aprende tu hijo — no una terapia ni un tratamiento clínico. El acompañamiento profesional (psicopedagogo, terapeuta ocupacional, neurólogo) sigue siendo el de tu confianza; Barkley no lo reemplaza." },
  { q: "¿Rinde los mismos exámenes que el resto?", a: "Sí. El contenido es el temario oficial MINEDUC completo y la validación es la misma: Exámenes Libres. Se adapta la forma de aprender, nunca la exigencia académica." },
  { q: "¿Necesito un diagnóstico o informe para matricular?", a: "No lo pedimos para matricular. La conversación inicial con el asesor es donde definimos juntos cómo adaptar el recorrido según lo que cuentes de tu hijo." },
  { q: "¿Qué pasa si mi hijo tiene más de un perfil (por ejemplo TDAH y dislexia)?", a: "Las técnicas no son excluyentes — se combinan. El selector de arriba muestra el énfasis principal, pero el mismo contenido en video+pódcast, bloques cortos y refuerzo dirigido aplica en conjunto." },
];

export default function Adaptativo() {
  const [profile, setProfile] = useState<ProfileKey>("tdah");
  const active = PROFILES[profile];
  const ActiveIcon = active.icon;

  useEffect(() => {
    document.title = "Adaptativo — Colegio online para niños con TDAH, dislexia y otros ritmos | Barkley Online";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Adaptativo, el programa de Barkley: educación online 100% asincrónica para niños con TDAH, dislexia u otro ritmo de aprendizaje. Técnicas reales: microaprendizaje, refuerzo dirigido, formato dual video+pódcast. Preparación oficial para Exámenes Libres MINEDUC en Chile.");
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
            Si tu hijo tiene TDAH, dislexia u otro ritmo de aprendizaje, el problema casi nunca es él —
            es el formato. Elige su perfil abajo y mira exactamente cómo Barkley lo resuelve.
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
