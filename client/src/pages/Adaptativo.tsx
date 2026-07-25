/**
 * Adaptativo — programa de Barkley para estudiantes con TDAH o dislexia.
 *
 * PRINCIPIO DE DISEÑO: la página no describe las acomodaciones, las DEMUESTRA.
 * Cada sección es un instrumento manipulable — el apoderado cambia la fuente,
 * el fondo, el interlineado sobre texto real de una lección y ve la diferencia
 * en vivo. La página misma está construida con esas acomodaciones (papel crema,
 * interlineado 1.8, Lexend — tipografía diseñada para reducir esfuerzo lector):
 * es la demostración más honesta posible.
 *
 * Todo lo que se muestra existe en AdaptiveProfileService
 * (barkley-platform/src/server/services/adaptive-profile.service.ts). Sin perfil
 * TEA: la plataforma no lo implementa todavía y prometerlo sería mentir.
 *
 * Dirección estética: editorial cálido / cuaderno de trabajo. Fraunces display +
 * Lexend body. Paleta de marca (navy/gold/rojo) reinterpretada sobre papel.
 */
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Check, X, ArrowRight, Volume2, Pause, Play } from "lucide-react";

/* ─── Paleta: marca Barkley sobre papel cálido ─────────────────────────── */
const PAPER = "#FBF6EC";        // papel cálido — el mismo principio del modo dislexia
const PAPER_DEEP = "#F2E9D8";
const INK = "#152A42";          // navy de marca, profundizado (nunca negro puro)
const INK_SOFT = "#5A6B7E";
const GOLD = "#E0A02E";
const RED = "#C8402F";
const SAGE = "#4F7D5E";
const RULE = "#DCCFB8";

const DISPLAY = "'Fraunces', Georgia, serif";
const BODY = "'Lexend', system-ui, sans-serif";

/* Párrafo real del temario — Ciencias, 5° básico. El texto de la demo no es
   lorem ipsum: es el tipo de contenido que el estudiante va a leer de verdad. */
const LECCION_DEMO =
  "El sistema digestivo transforma los alimentos en nutrientes que el cuerpo puede absorber. El proceso empieza en la boca, donde los dientes trituran la comida y la saliva comienza a descomponerla. Luego el bolo alimenticio baja por el esófago hasta el estómago.";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  return { ref, inView };
}

function Section({ num, kicker, title, children }: { num: string; kicker: string; title: string; children: React.ReactNode }) {
  const { ref, inView } = useReveal();
  return (
    <section ref={ref} style={{ padding: "clamp(56px,9vw,104px) 24px", borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{ display: "flex", gap: "clamp(16px,4vw,48px)", alignItems: "flex-start", flexWrap: "wrap", marginBottom: 36 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: "clamp(52px,9vw,104px)", fontWeight: 300, color: RULE, lineHeight: 0.8, flexShrink: 0, fontVariationSettings: "'SOFT' 40, 'WONK' 1" }}>
              {num}
            </span>
            <div style={{ flex: "1 1 420px", minWidth: 280 }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: RED, margin: "0 0 10px" }}>{kicker}</p>
              <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px,4.6vw,46px)", fontWeight: 500, color: INK, margin: 0, lineHeight: 1.1, letterSpacing: "-0.015em", fontVariationSettings: "'SOFT' 30" }}>
                {title}
              </h2>
            </div>
          </div>
          {children}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── DEMO 1 · Lectura: el apoderado transforma el texto en vivo ────────── */
function LecturaDemo() {
  const [dyslexic, setDyslexic] = useState(false);
  const [cream, setCream] = useState(false);
  const [loose, setLoose] = useState(false);
  const anyOn = dyslexic || cream || loose;

  const Toggle = ({ on, set, label, detail }: { on: boolean; set: (v: boolean) => void; label: string; detail: string }) => (
    <button
      onClick={() => set(!on)}
      aria-pressed={on}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
        background: on ? INK : "transparent",
        color: on ? PAPER : INK,
        border: `1.5px solid ${on ? INK : RULE}`,
        borderRadius: 4, padding: "13px 16px", cursor: "pointer",
        fontFamily: BODY, fontSize: 14, transition: "all .22s ease",
      }}
    >
      <span style={{
        width: 34, height: 19, borderRadius: 10, flexShrink: 0, position: "relative",
        background: on ? GOLD : RULE, transition: "background .22s ease",
      }}>
        <span style={{
          position: "absolute", top: 2.5, left: on ? 17.5 : 2.5, width: 14, height: 14,
          borderRadius: "50%", background: on ? INK : "#fff", transition: "left .22s cubic-bezier(.22,1,.36,1)",
        }} />
      </span>
      <span>
        <strong style={{ display: "block", fontWeight: 600, fontSize: 14.5 }}>{label}</strong>
        <span style={{ fontSize: 12.5, opacity: on ? 0.72 : 0.62 }}>{detail}</span>
      </span>
    </button>
  );

  return (
    <div style={{ display: "flex", gap: "clamp(20px,3vw,36px)", flexWrap: "wrap", alignItems: "flex-start" }}>
      {/* Panel de lectura */}
      <div style={{ flex: "1 1 480px", minWidth: 300 }}>
        <div style={{
          background: cream ? "#FFF8F0" : "#FFFFFF",
          border: `1px solid ${RULE}`,
          borderRadius: 6,
          padding: "clamp(24px,4vw,40px)",
          transition: "background .3s ease",
          boxShadow: "0 1px 0 rgba(21,42,66,.04), 0 18px 40px -28px rgba(21,42,66,.35)",
        }}>
          <p style={{ fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: INK_SOFT, margin: "0 0 18px", fontWeight: 500 }}>
            Ciencias · 5° básico · Unidad 2
          </p>
          <p style={{
            fontFamily: dyslexic ? "'OpenDyslexic', " + BODY : BODY,
            fontSize: dyslexic ? 16 : 17,
            lineHeight: loose ? 1.95 : 1.55,
            color: "#2B2B2B",
            margin: 0,
            transition: "line-height .3s ease, font-size .2s ease",
          }}>
            {LECCION_DEMO}
          </p>
          <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${cream ? "#EFE2D0" : "#EEE"}`, display: "flex", alignItems: "center", gap: 8 }}>
            <Volume2 style={{ width: 15, height: 15, color: SAGE }} />
            <span style={{ fontSize: 12.5, color: INK_SOFT }}>Este texto también se puede escuchar</span>
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: INK_SOFT, margin: "14px 2px 0", fontStyle: "italic" }}>
          {anyOn
            ? "Así es como tu hijo vería esta misma lección."
            : "Así se ve una lección estándar. Activa los ajustes de la derecha."}
        </p>
      </div>

      {/* Controles */}
      <div style={{ flex: "0 1 300px", minWidth: 260, display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase", color: INK_SOFT, margin: "0 0 4px" }}>
          Pruébalo tú
        </p>
        <Toggle on={dyslexic} set={setDyslexic} label="Fuente OpenDyslexic" detail="Letras con base pesada: b y d dejan de confundirse" />
        <Toggle on={cream} set={setCream} label="Fondo crema" detail="Menos contraste, menos fatiga visual" />
        <Toggle on={loose} set={setLoose} label="Interlineado amplio" detail="1.8 en vez de 1.6: no se salta de línea" />
      </div>
    </div>
  );
}

/* ─── DEMO 2 · La lección partida en bloques ────────────────────────────── */
function BloquesDemo() {
  const [adaptativo, setAdaptativo] = useState(false);
  const bloques = [7, 7, 7, 7, 7, 6];
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 30, flexWrap: "wrap" }}>
        {[false, true].map((v) => (
          <button
            key={String(v)}
            onClick={() => setAdaptativo(v)}
            style={{
              background: adaptativo === v ? INK : "transparent",
              color: adaptativo === v ? PAPER : INK,
              border: `1.5px solid ${adaptativo === v ? INK : RULE}`,
              borderRadius: 999, padding: "10px 22px", cursor: "pointer",
              fontFamily: BODY, fontSize: 14, fontWeight: 600, transition: "all .2s ease",
            }}
          >
            {v ? "Con Adaptativo" : "Estándar"}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", border: `1px solid ${RULE}`, borderRadius: 6, padding: "clamp(22px,3.5vw,36px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 12.5, color: INK_SOFT }}>
          <span>Inicio</span><span>40 minutos de lección</span>
        </div>

        <div style={{ display: "flex", gap: adaptativo ? 6 : 0, height: 54, alignItems: "stretch" }}>
          {bloques.map((min, i) => (
            <motion.div
              key={i}
              layout
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{
                flex: min,
                background: adaptativo ? SAGE : RED,
                borderRadius: adaptativo ? 4 : i === 0 ? "4px 0 0 4px" : i === bloques.length - 1 ? "0 4px 4px 0" : 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 12.5, fontWeight: 600,
              }}
            >
              {adaptativo ? `${min}′` : i === 2 ? "40 minutos sin corte" : ""}
            </motion.div>
          ))}
        </div>

        <div style={{ marginTop: 18, display: "flex", alignItems: "flex-start", gap: 10 }}>
          {adaptativo
            ? <><Check style={{ width: 17, height: 17, color: SAGE, flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 14.5, color: INK }}>
                  <strong>Seis bloques con pausa entre uno y otro.</strong> Nadie tiene que sostener 40 minutos
                  seguidos de atención — y si se levanta a la mitad, retoma exactamente donde quedó.
                </p></>
            : <><X style={{ width: 17, height: 17, color: RED, flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 14.5, color: INK }}>
                  <strong>Un solo bloque continuo.</strong> Si pierde el hilo en el minuto 12, los 28 restantes
                  se pierden con él.
                </p></>}
        </div>
      </div>
    </div>
  );
}

/* ─── DEMO 3 · El cronómetro que desaparece ─────────────────────────────── */
function TimerDemo() {
  const [visible, setVisible] = useState(true);
  const [seg, setSeg] = useState(47);
  const { ref, inView } = useReveal();

  useEffect(() => {
    if (!visible || !inView) return;
    const t = setInterval(() => setSeg((s) => (s <= 1 ? 47 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [visible, inView]);

  const urgente = seg <= 15;

  return (
    <div ref={ref} style={{ display: "flex", gap: "clamp(20px,3vw,36px)", flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 440px", minWidth: 300 }}>
        <div style={{ background: "#fff", border: `1px solid ${RULE}`, borderRadius: 6, padding: "clamp(22px,3.5vw,34px)", position: "relative", overflow: "hidden" }}>
          {/* barra de tiempo */}
          <div style={{ height: 4, background: "#F0EAE0", borderRadius: 2, overflow: "hidden", marginBottom: 22 }}>
            <div style={{
              height: "100%", width: visible ? `${(seg / 47) * 100}%` : "100%",
              background: visible ? (urgente ? RED : GOLD) : SAGE,
              transition: "width 1s linear, background .3s ease",
            }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.13em", textTransform: "uppercase", color: INK_SOFT, fontWeight: 500 }}>
              Evaluación · Pregunta 3 de 10
            </p>
            {visible ? (
              <motion.span
                animate={urgente ? { scale: [1, 1.09, 1] } : {}}
                transition={{ duration: 0.6, repeat: urgente ? Infinity : 0 }}
                style={{
                  fontFamily: DISPLAY, fontSize: 26, fontWeight: 600, lineHeight: 1,
                  color: urgente ? RED : INK, fontVariantNumeric: "tabular-nums",
                }}
              >
                0:{String(seg).padStart(2, "0")}
              </motion.span>
            ) : (
              <span style={{ fontSize: 12.5, color: SAGE, display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                <Check style={{ width: 14, height: 14 }} /> Sin límite
              </span>
            )}
          </div>

          <p style={{ fontSize: 17, color: INK, margin: "0 0 18px", lineHeight: 1.5 }}>
            ¿En qué parte del cuerpo comienza la digestión?
          </p>
          {["En el estómago", "En la boca", "En el intestino"].map((o) => (
            <div key={o} style={{
              border: `1px solid ${RULE}`, borderRadius: 4, padding: "12px 15px",
              marginBottom: 8, fontSize: 15, color: INK_SOFT, background: PAPER,
            }}>{o}</div>
          ))}
        </div>
      </div>

      <div style={{ flex: "0 1 300px", minWidth: 260 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {[true, false].map((v) => (
            <button
              key={String(v)}
              onClick={() => { setVisible(v); setSeg(47); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: visible === v ? INK : "transparent",
                color: visible === v ? PAPER : INK,
                border: `1.5px solid ${visible === v ? INK : RULE}`,
                borderRadius: 4, padding: "13px 16px", cursor: "pointer",
                fontFamily: BODY, fontSize: 14.5, fontWeight: 600, textAlign: "left",
              }}
            >
              {v ? <Play style={{ width: 15, height: 15 }} /> : <Pause style={{ width: 15, height: 15 }} />}
              {v ? "Con cronómetro (estándar)" : "Sin cronómetro (Adaptativo)"}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 14.5, color: INK, lineHeight: 1.7, margin: 0 }}>
          {visible
            ? "Mira el número mientras baja. Esa presión es lo primero que ocupa la cabeza de un niño con TDAH — antes que la pregunta."
            : "La pregunta es la misma. Lo único que sacamos fue el reloj. Y con él, la carrera contra el tiempo."}
        </p>
      </div>
    </div>
  );
}

/* ─── DEMO 4 · Ritmo de acompañamiento ──────────────────────────────────── */
function CheckinDemo() {
  const [adaptativo, setAdaptativo] = useState(true);
  const dias = Array.from({ length: 30 }, (_, i) => i + 1);
  const cada = adaptativo ? 3 : 7;
  const total = dias.filter((d) => d % cada === 0).length;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
        {[false, true].map((v) => (
          <button
            key={String(v)}
            onClick={() => setAdaptativo(v)}
            style={{
              background: adaptativo === v ? INK : "transparent",
              color: adaptativo === v ? PAPER : INK,
              border: `1.5px solid ${adaptativo === v ? INK : RULE}`,
              borderRadius: 999, padding: "10px 22px", cursor: "pointer",
              fontFamily: BODY, fontSize: 14, fontWeight: 600,
            }}
          >
            {v ? "Con Adaptativo" : "Estándar"}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", border: `1px solid ${RULE}`, borderRadius: 6, padding: "clamp(22px,3.5vw,36px)" }}>
        <p style={{ fontSize: 12, letterSpacing: "0.13em", textTransform: "uppercase", color: INK_SOFT, margin: "0 0 18px", fontWeight: 500 }}>
          Un mes de estudio
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(28px, 1fr))", gap: 7 }}>
          {dias.map((d) => {
            const hay = d % cada === 0;
            return (
              <motion.div
                key={d}
                animate={{ scale: hay ? 1 : 0.82 }}
                transition={{ duration: 0.3, delay: hay ? d * 0.012 : 0 }}
                style={{
                  aspectRatio: "1", borderRadius: 3,
                  background: hay ? SAGE : PAPER_DEEP,
                  border: `1px solid ${hay ? SAGE : RULE}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10.5, fontWeight: 600, color: hay ? "#fff" : "transparent",
                }}
              >
                {hay ? "✓" : ""}
              </motion.div>
            );
          })}
        </div>
        <p style={{ margin: "20px 0 0", fontSize: 14.5, color: INK, lineHeight: 1.7 }}>
          <strong style={{ fontFamily: DISPLAY, fontSize: 21, color: SAGE }}>{total}</strong>{" "}
          {total === 1 ? "revisión" : "revisiones"} del asesor humano en 30 días — una cada {cada} días.
          {adaptativo && " Más del doble que el seguimiento estándar: un atraso se detecta antes de volverse un problema."}
        </p>
      </div>
    </div>
  );
}

/* ─── FAQ ───────────────────────────────────────────────────────────────── */
const FAQS = [
  { q: "¿Adaptativo es una terapia o un tratamiento?", a: "No. Es un formato de estudio que se acomoda a cómo aprende tu hijo — no una terapia ni un tratamiento clínico. El acompañamiento profesional (psicopedagogo, terapeuta ocupacional, neurólogo) sigue siendo el de tu confianza; Barkley no lo reemplaza ni pretende hacerlo." },
  { q: "¿Rinde los mismos exámenes que el resto?", a: "Sí. El contenido es el temario oficial MINEDUC completo y la validación es la misma: Exámenes Libres. Se adapta la forma de aprender, nunca la exigencia académica ni el nivel del contenido." },
  { q: "¿Necesito un diagnóstico o un informe para matricular?", a: "No lo pedimos. En el formulario de inscripción puedes indicar si tu hijo tiene TDAH o dislexia, y la conversación con el asesor define cómo activar el perfil que corresponda." },
  { q: "¿Y si tiene TDAH y dislexia a la vez?", a: "Existe un tercer perfil, combinado, que activa todas las acomodaciones de ambos al mismo tiempo: bloques cortos y sin cronómetro, más fuente OpenDyslexic, texto a voz y fondo crema. No hay que elegir una sola." },
  { q: "¿Y si mi hijo tiene TEA u otro perfil que no aparece aquí?", a: "Hoy la plataforma solo tiene acomodaciones automáticas para TDAH y dislexia — todavía no para TEA ni otros perfiles. Preferimos decirlo con franqueza antes que prometer algo que aún no está construido. Escríbenos igual y lo conversamos: puede haber acompañamiento posible aunque no sea automático." },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div style={{ maxWidth: 780 }}>
      {FAQS.map((f, i) => (
        <div key={f.q} style={{ borderBottom: `1px solid ${RULE}` }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            style={{
              width: "100%", textAlign: "left", background: "none", border: "none",
              padding: "22px 0", cursor: "pointer", display: "flex", gap: 18,
              alignItems: "flex-start", justifyContent: "space-between", fontFamily: BODY,
            }}
          >
            <span style={{ fontFamily: DISPLAY, fontSize: "clamp(17px,2.2vw,21px)", fontWeight: 500, color: INK, lineHeight: 1.35 }}>
              {f.q}
            </span>
            <span style={{
              flexShrink: 0, width: 26, height: 26, borderRadius: "50%", border: `1.5px solid ${RULE}`,
              display: "flex", alignItems: "center", justifyContent: "center", color: RED,
              fontSize: 17, lineHeight: 1, transform: open === i ? "rotate(45deg)" : "none",
              transition: "transform .25s ease", marginTop: 2,
            }}>+</span>
          </button>
          {open === i && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ margin: "0 0 24px", fontSize: 15.5, lineHeight: 1.8, color: INK_SOFT, maxWidth: 640 }}
            >
              {f.a}
            </motion.p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Página ────────────────────────────────────────────────────────────── */
export default function Adaptativo() {
  useEffect(() => {
    document.title = "Adaptativo — el programa de Barkley para TDAH y dislexia";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Adaptativo, el programa de Barkley: pruébalo tú mismo. Cambia la fuente a OpenDyslexic, el fondo a crema, quita el cronómetro de la evaluación y mira cómo cambia la lección. Acomodaciones reales para TDAH y dislexia, de 1° básico a 4° medio.");

    const id = "adaptativo-fonts";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600&family=Lexend:wght@300;400;500;600&display=swap');
        /* OTF oficial del repo de OpenDyslexic, no el subset "latin" de fontsource:
           ese subset no trae los glifos acentuados precompuestos y renderiza
           "esófago" como "eso'fago" — inaceptable en una página en español.
           Pesa ~175KB pero solo se descarga cuando el apoderado activa el toggle,
           porque ninguna otra parte de la página usa esta familia. */
        @font-face {
          font-family: 'OpenDyslexic';
          src: url('https://cdn.jsdelivr.net/gh/antijingoist/opendyslexic@master/compiled/OpenDyslexic-Regular.otf') format('opentype');
          font-display: swap;
        }
      `;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div style={{ background: PAPER, color: INK, fontFamily: BODY, fontSize: 16, lineHeight: 1.75, minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ padding: "20px 24px", borderBottom: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, background: INK, borderRadius: 5, color: PAPER, fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY }}>BK</div>
            <span style={{ fontWeight: 500, color: INK, fontSize: 14, lineHeight: 1.25 }}>The Barkley<br />Online School</span>
          </a>
          <a href="/#inscripcion" style={{ background: RED, color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 14, padding: "10px 22px", borderRadius: 999 }}>Inscribirse</a>
        </div>
      </header>

      {/* Hero editorial */}
      <section style={{ padding: "clamp(56px,10vw,116px) 24px clamp(40px,7vw,76px)", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-14%", right: "-6%", width: 420, height: 420, borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD}22 0%, transparent 68%)`, pointerEvents: "none",
        }} />
        <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative" }}>
          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: RED, margin: "0 0 22px" }}
          >
            Adaptativo · un programa de Barkley
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: DISPLAY, fontSize: "clamp(38px,7.6vw,88px)", fontWeight: 300, lineHeight: 1.02,
              letterSpacing: "-0.03em", margin: "0 0 30px", maxWidth: 980,
              fontVariationSettings: "'SOFT' 40, 'WONK' 1",
            }}
          >
            El problema nunca fue<br />
            <span style={{ fontStyle: "italic", fontWeight: 500 }}>cómo aprende tu hijo.</span><br />
            Fue el formato.
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.24 }}
            style={{ display: "flex", gap: "clamp(20px,4vw,56px)", flexWrap: "wrap", alignItems: "flex-start" }}
          >
            <p style={{ flex: "1 1 420px", maxWidth: 560, fontSize: "clamp(16px,2vw,19px)", lineHeight: 1.75, color: INK_SOFT, margin: 0 }}>
              Un colegio no puede cambiar cómo funciona el cerebro de un niño con TDAH o dislexia.
              Pero sí puede cambiar el formato que lo deja afuera. Esta página no te lo explica:
              te deja <strong style={{ color: INK }}>probarlo tú mismo</strong>, ahora, sobre una lección real.
            </p>
            <div style={{ flex: "0 1 220px", borderLeft: `2px solid ${GOLD}`, paddingLeft: 18 }}>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: INK_SOFT }}>
                Esta misma página está escrita en <strong style={{ color: INK }}>Lexend</strong>, una tipografía
                diseñada para reducir el esfuerzo de lectura, sobre papel cálido y con interlineado amplio.
                Empezamos por aplicarnos lo que proponemos.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Section num="01" kicker="Demostración en vivo" title="Cómo se ve una lección cuando el texto deja de estorbar">
        <LecturaDemo />
      </Section>

      <Section num="02" kicker="Atención sostenida" title="Una lección de 40 minutos, o seis pedazos de siete">
        <BloquesDemo />
      </Section>

      <Section num="03" kicker="Evaluación sin carrera" title="El cronómetro que decidimos apagar">
        <TimerDemo />
      </Section>

      <Section num="04" kicker="Acompañamiento humano" title="Cuántas veces alguien revisa cómo va">
        <CheckinDemo />
      </Section>

      {/* Lo que no cambia */}
      <section style={{ background: INK, color: PAPER, padding: "clamp(56px,9vw,96px) 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(26px,4.2vw,42px)", fontWeight: 400, margin: "0 0 12px", lineHeight: 1.15, fontVariationSettings: "'SOFT' 30" }}>
            Lo que <span style={{ fontStyle: "italic" }}>no</span> cambia
          </h2>
          <p style={{ color: "rgba(251,246,236,.62)", margin: "0 0 44px", maxWidth: 560, fontSize: 15.5 }}>
            Adaptar el formato no significa bajar la vara. El contenido y la exigencia son exactamente los mismos.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 1, background: "rgba(251,246,236,.14)", border: "1px solid rgba(251,246,236,.14)" }}>
            {[
              ["Mismo temario oficial", "Currículo MINEDUC completo. Sin recortes, sin versión simplificada."],
              ["Misma validación", "Exámenes Libres ante el Ministerio, igual que cualquier estudiante."],
              ["Mismo valor", "$65.000 al mes. Adaptativo no cuesta un peso más."],
            ].map(([t, d]) => (
              <div key={t} style={{ background: INK, padding: "30px 26px" }}>
                <Check style={{ width: 19, height: 19, color: GOLD, marginBottom: 14 }} />
                <h3 style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 500, margin: "0 0 8px", color: PAPER }}>{t}</h3>
                <p style={{ fontSize: 14.5, color: "rgba(251,246,236,.66)", margin: 0, lineHeight: 1.7 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "clamp(56px,9vw,104px) 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(26px,4.2vw,42px)", fontWeight: 400, margin: "0 0 36px", lineHeight: 1.15, fontVariationSettings: "'SOFT' 30" }}>
            Lo que las familias preguntan
          </h2>
          <Faq />
          <p style={{ fontSize: 13, color: INK_SOFT, margin: "36px 0 0", maxWidth: 640, fontStyle: "italic", lineHeight: 1.7 }}>
            Adaptativo no reemplaza el diagnóstico ni el tratamiento profesional de tu hijo. Es un formato de
            estudio que se acomoda a cómo aprende — no una terapia.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: PAPER_DEEP, padding: "clamp(52px,8vw,88px) 24px", borderTop: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(26px,4.4vw,44px)", fontWeight: 400, margin: "0 0 16px", lineHeight: 1.12, fontVariationSettings: "'SOFT' 40, 'WONK' 1" }}>
            Cuéntanos cómo aprende<br />tu hijo.
          </h2>
          <p style={{ fontSize: 16, color: INK_SOFT, margin: "0 0 32px", lineHeight: 1.75 }}>
            En el formulario puedes indicar su perfil. Reservar no cuesta nada — el primer pago es
            recién en febrero de 2027.
          </p>
          <a href="/#inscripcion" style={{
            display: "inline-flex", alignItems: "center", gap: 10, background: RED, color: "#fff",
            fontWeight: 600, fontSize: 15.5, padding: "16px 34px", borderRadius: 999, textDecoration: "none",
          }}>
            Reservar cupo 2027 <ArrowRight style={{ width: 17, height: 17 }} />
          </a>
        </div>
      </section>

      <footer style={{ background: INK, color: "rgba(251,246,236,.6)", fontSize: 13, textAlign: "center", padding: "26px 24px" }}>
        <p style={{ margin: 0 }}>
          Barkley Online — Colegio 100% asincrónico e inclusivo en Chile · Preparación para Exámenes Libres ante el MINEDUC ·{" "}
          <a href="/" style={{ color: GOLD, textDecoration: "none" }}>barkleyinstituto.cl</a>
        </p>
      </footer>
    </div>
  );
}
