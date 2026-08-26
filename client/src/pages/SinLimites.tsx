/**
 * Página dedicada al fundamento "por qué no hay clases en vivo / Zoom".
 * Estructura y argumentos adaptados de Wolsey Hall Oxford (referente 1894,
 * 130+ países, 750.000+ alumnos) — mismo patrón retórico Problema→Agitar→Resolver
 * que ellos usan, con vocabulario propio de Barkley. La tabla comparativa
 * síncrono/asincrónico es la pieza central: es la que más convierte porque
 * usa el principio de contraste (una opción se ve mala solo al lado de la otra).
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Check, X, Lock, Unlock } from "lucide-react";

const NAVY = "#003366";
const RED = "#FF3D37";
const GOLD = "#FFC548";
const GREEN = "#00b273";
const TEXT = "#525252";
const SLATE = "#5b7ba3";
const FONT = "'Poppins', sans-serif";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Placeholders con especificación exacta para que el usuario genere las imágenes
// reales y las reemplace por src. IMG_SPECS documenta qué pidió cada una.
const IMG_SPECS = [
  { id: "hero", ratio: "16/10", desc: "Jaula o reja abierta con luz entrando, o candado roto — metáfora de 'liberarse de un sistema rígido'. Estilo fotográfico realista, tonos cálidos." },
  { id: "problema", ratio: "4/3", desc: "Estudiante mirando el reloj en un aula tradicional o videollamada Zoom, expresión de aburrimiento/ansiedad. Luz fría, ambiente gris." },
  { id: "libertad", ratio: "4/3", desc: "Estudiante estudiando en un lugar no convencional (jardín, sofá, viajando) con laptop, expresión relajada/enfocada. Luz cálida, natural." },
  { id: "tutor", ratio: "4/3", desc: "Persona adulta (tutor) revisando/corrigiendo un trabajo en pantalla, no dando clase — postura de feedback 1:1, no de exposición a grupo." },
  { id: "comunidad", ratio: "16/9", desc: "Collage o composición de 3-4 estudiantes distintos (edades/contextos variados) conectados por videollamada informal o chat, no clase formal — sensación de comunidad, no de aula." },
];

const COMPARACION = [
  {
    sync: "Un profesor dirige la clase, entrega la información y fija el ritmo para todos por igual.",
    async: "El estudiante avanza solo, elige entre video y pódcast, y recibe feedback de un tutor cuando lo necesita.",
  },
  {
    sync: "Hasta 40 estudiantes en la misma sala virtual, compitiendo por atención.",
    async: "Estudia donde esté — su pieza, la cocina, de viaje — sin depender de que 40 personas se conecten a la vez.",
  },
  {
    sync: "Clase a horario fijo, mismo inicio y término todos los días, sin excepción.",
    async: "Define su propio horario. Estudia cuando su día — o su cabeza — realmente lo permite.",
  },
  {
    sync: "Si te desconectas 10 minutos, perdiste el contenido para siempre.",
    async: "Cada lección queda disponible. Pausa, rebobina, repite las veces que necesite.",
  },
  {
    sync: "El ritmo lo decide el grupo. El más rápido se aburre, el más lento se atrasa.",
    async: "El ritmo lo decide él. Avanza rápido en lo que domina, se detiene en lo que le cuesta.",
  },
];

function ComparacionTabla() {
  const [activeRow, setActiveRow] = useState<number | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <div style={{ background: "#8a8f98", color: "#fff", padding: "18px 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <Lock size={18} />
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.02em" }}>SINCRÓNICO (clases en vivo)</span>
        </div>
        <div style={{ background: NAVY, color: "#fff", padding: "18px 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <Unlock size={18} color={GOLD} />
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.02em" }}>BARKLEY (asincrónico)</span>
        </div>
      </div>
      {COMPARACION.map((row, i) => (
        <div
          key={i}
          onMouseEnter={() => setActiveRow(i)}
          onMouseLeave={() => setActiveRow(null)}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, transition: "transform 0.2s", transform: activeRow === i ? "scale(1.005)" : "scale(1)" }}
        >
          <div style={{ background: "#f3f1ee", padding: "20px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <X size={18} color="#b0483f" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 14.5, color: TEXT, lineHeight: 1.55 }}>{row.sync}</p>
          </div>
          <div style={{ background: "#fff", padding: "20px", display: "flex", gap: 10, alignItems: "flex-start", borderLeft: `3px solid ${GOLD}` }}>
            <Check size={18} color={GREEN} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 14.5, color: NAVY, fontWeight: 500, lineHeight: 1.55 }}>{row.async}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const PILARES_FILOSOFIA = [
  {
    n: "01",
    title: "Tu ritmo, no el del grupo",
    text: "En una sala con 40 estudiantes, el ritmo lo pone el promedio — nunca tu hijo. Avanza rápido en lo que domina, se detiene el tiempo que necesite en lo que le cuesta. Sin nadie mirando el reloj por él.",
  },
  {
    n: "02",
    title: "El tutor da feedback, no dirige",
    text: "No eliminamos al adulto — cambiamos su rol. En vez de exponer una clase a 40 personas a la vez, el tutor revisa el trabajo real de tu hijo y responde exactamente donde se atoró. Acompañamiento, no vigilancia de asistencia.",
  },
  {
    n: "03",
    title: "El contenido no desaparece",
    text: "Una clase en vivo pasa una sola vez. Si te perdiste 5 minutos, se perdieron para siempre. Cada lección de Barkley queda disponible indefinidamente — se pausa, se repite, se revisa antes de una prueba.",
  },
  {
    n: "04",
    title: "Aprender no exige estar encerrado",
    text: "No hace falta una sala, ni un horario fijo, ni estar frente a la pantalla a las 9:00 en punto. El aprendizaje ocurre donde y cuando tu hijo esté en condiciones reales de aprender — no cuando el sistema lo obliga.",
  },
];

function useDocumentMeta() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Aprende sin estar atrapado — Por qué Barkley no tiene clases en vivo";
    const desc = document.querySelector('meta[name="description"]');
    const prevDesc = desc?.getAttribute("content") ?? null;
    desc?.setAttribute(
      "content",
      "Por qué Barkley es 100% asincrónico: sin Zoom, sin horario fijo. El fundamento completo, comparado con colegios sincrónicos, y cómo funciona el rol del tutor.",
    );
    const canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute("href") ?? null;
    canonical?.setAttribute("href", "https://www.barkleyinstituto.cl/sin-limites");
    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) desc?.setAttribute("content", prevDesc);
      if (prevCanonical !== null) canonical?.setAttribute("href", prevCanonical);
    };
  }, []);
}

export default function SinLimites() {
  useDocumentMeta();
  return (
    <div style={{ backgroundColor: "#fff", color: TEXT, fontFamily: FONT, fontSize: 16, lineHeight: 1.8, overflowX: "hidden" }}>

      {/* === HERO === */}
      <section style={{ background: `linear-gradient(180deg, ${NAVY} 0%, #001d3d 100%)`, padding: "100px 24px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 48, alignItems: "center" }}>
          <div style={{ flex: "1 1 420px", minWidth: 300 }}>
            <Reveal>
              <span style={{ display: "inline-block", background: "rgba(255,197,72,0.15)", color: GOLD, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 18px", borderRadius: 999, marginBottom: 24 }}>
                Por qué somos distintos
              </span>
              <h1 style={{ fontSize: "clamp(36px,5.5vw,58px)", fontWeight: 800, color: "#fff", margin: "0 0 20px", lineHeight: 1.08 }}>
                Aprende sin estar<br />atrapado.
              </h1>
              <p style={{ fontSize: "clamp(17px,2vw,20px)", color: "#cfe0f5", margin: 0, maxWidth: 480, lineHeight: 1.6 }}>
                La mayoría de los colegios online solo trasladaron la sala de clases a Zoom. Mismo horario fijo, mismo profesor exponiendo, misma sala llena — solo que ahora es una videollamada. Eso no es libertad. Es la misma jaula, con wifi.
              </p>
            </Reveal>
          </div>
          <div style={{ flex: "1 1 360px", minWidth: 280 }}>
            <Reveal delay={0.15}>
              <div style={{ aspectRatio: IMG_SPECS[0].ratio, borderRadius: 20, background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>[Imagen: {IMG_SPECS[0].desc}]</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* === EL PROBLEMA === */}
      <section style={{ padding: "90px 24px", background: "#fafaf9" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Reveal>
            <p style={{ fontSize: 14, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>El problema real</p>
            <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 700, color: NAVY, margin: "0 0 28px", lineHeight: 1.2 }}>
              Muchas familias se sienten atrapadas en un sistema que no fue diseñado para su hijo.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 40, alignItems: "center" }}>
              <div style={{ flex: "1 1 300px", minWidth: 260 }}>
                <p style={{ fontSize: 17, color: TEXT, lineHeight: 1.75, margin: "0 0 18px" }}>
                  Un colegio tradicional — presencial u online por Zoom — enseña a todos en la misma sala, con los mismos recursos, a la misma hora, todos los días. Es un solo camino, y si tu hijo no calza en ese camino, el sistema no se adapta: es él quien tiene que forzarse a encajar.
                </p>
                <p style={{ fontSize: 17, color: TEXT, lineHeight: 1.75, margin: 0 }}>
                  ¿Qué pasa cuando ese camino rígido no funciona? Cuando le cuesta levantarse porque el ritmo del grupo lo angustia. Cuando tiene un talento — deportivo, artístico — que exige horas de entrenamiento que un horario fijo no permite. Cuando aprende distinto y necesita más tiempo, o menos ruido, o simplemente otro momento del día.
                </p>
              </div>
              <div style={{ flex: "1 1 280px", minWidth: 240 }}>
                <div style={{ aspectRatio: IMG_SPECS[1].ratio, borderRadius: 16, background: "#eee", border: "1px dashed #ccc", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
                  <p style={{ color: "#999", fontSize: 12, margin: 0 }}>[Imagen: {IMG_SPECS[1].desc}]</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* === TABLA COMPARATIVA === */}
      <section style={{ padding: "90px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>La comparación real</p>
              <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.2 }}>
                Sincrónico vs. asincrónico, lado a lado
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ComparacionTabla />
          </Reveal>
        </div>
      </section>

      {/* === LIBERTAD (imagen + texto invertido) === */}
      <section style={{ padding: "90px 24px", background: NAVY, position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexWrap: "wrap-reverse", gap: 48, alignItems: "center" }}>
          <div style={{ flex: "1 1 320px", minWidth: 260 }}>
            <div style={{ aspectRatio: IMG_SPECS[2].ratio, borderRadius: 16, background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>[Imagen: {IMG_SPECS[2].desc}]</p>
            </div>
          </div>
          <div style={{ flex: "1 1 380px", minWidth: 280 }}>
            <Reveal>
              <p style={{ fontSize: 14, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>Lo que sí ofrecemos</p>
              <h2 style={{ fontSize: "clamp(26px,3.6vw,38px)", fontWeight: 700, color: "#fff", margin: "0 0 18px", lineHeight: 1.25 }}>
                La libertad de aprender donde y cuando tu hijo realmente puede.
              </h2>
              <p style={{ fontSize: 16, color: "#cfe0f5", margin: 0, lineHeight: 1.7 }}>
                No se trata de "estudiar solo". Se trata de que el aprendizaje se adapte a tu hijo, y no al revés. Estudia en su pieza, en la cocina, de vacaciones, entrenando fuera de temporada — el contenido lo espera, no le exige que llegue a tiempo a una sala que no volverá a repetirse.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* === 4 PILARES DE LA FILOSOFÍA === */}
      <section style={{ padding: "90px 24px", background: "#fafaf9" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>El fundamento</p>
              <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.2 }}>
                Cuatro razones por las que esto funciona
              </h2>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 28 }}>
            {PILARES_FILOSOFIA.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.08}>
                <div style={{ background: "#fff", borderRadius: 16, padding: "32px 26px", height: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: GOLD, letterSpacing: "0.05em" }}>{p.n}</span>
                  <h3 style={{ fontSize: 19, fontWeight: 700, color: NAVY, margin: "10px 0 12px", lineHeight: 1.3 }}>{p.title}</h3>
                  <p style={{ fontSize: 14.5, color: TEXT, margin: 0, lineHeight: 1.65 }}>{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* === TUTOR: FEEDBACK NO DIRECCIÓN === */}
      <section style={{ padding: "90px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 48, alignItems: "center" }}>
          <div style={{ flex: "1 1 380px", minWidth: 280 }}>
            <Reveal>
              <p style={{ fontSize: 14, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>¿Y el profesor?</p>
              <h2 style={{ fontSize: "clamp(26px,3.6vw,38px)", fontWeight: 700, color: NAVY, margin: "0 0 18px", lineHeight: 1.25 }}>
                No eliminamos al tutor. Cambiamos su trabajo.
              </h2>
              <p style={{ fontSize: 16, color: TEXT, margin: "0 0 16px", lineHeight: 1.7 }}>
                En una clase en vivo, el profesor reparte su atención entre 40 estudiantes al mismo tiempo — inevitablemente, la mayoría recibe migajas. En Barkley, el tutor no expone una clase: revisa el trabajo real de tu hijo, entrega feedback específico, y aparece cuando el sistema detecta que de verdad lo necesita.
              </p>
              <p style={{ fontSize: 16, color: NAVY, fontWeight: 600, margin: 0, lineHeight: 1.7 }}>
                Es la diferencia entre un profesor que habla para el grupo, y un tutor que responde a tu hijo.
              </p>
            </Reveal>
          </div>
          <div style={{ flex: "1 1 320px", minWidth: 260 }}>
            <div style={{ aspectRatio: IMG_SPECS[3].ratio, borderRadius: 16, background: "#eee", border: "1px dashed #ccc", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
              <p style={{ color: "#999", fontSize: 12, margin: 0 }}>[Imagen: {IMG_SPECS[3].desc}]</p>
            </div>
          </div>
        </div>
      </section>

      {/* === COMUNIDAD (contrarresta el miedo al aislamiento) === */}
      <section style={{ padding: "90px 24px", background: "#fafaf9" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <p style={{ fontSize: 14, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>¿Y no se aísla?</p>
            <h2 style={{ fontSize: "clamp(26px,3.6vw,38px)", fontWeight: 700, color: NAVY, margin: "0 0 18px", lineHeight: 1.25 }}>
              Sin horario fijo no significa sin comunidad.
            </h2>
            <p style={{ fontSize: 16, color: TEXT, margin: "0 auto 36px", maxWidth: 620, lineHeight: 1.7 }}>
              Precisamente porque no está atado a una sala llena de compañeros que no eligió, tu hijo tiene más tiempo real para conectar con quien sí elige — en su comunidad, en sus actividades, en encuentros con otros estudiantes Barkley que comparten intereses reales.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ aspectRatio: IMG_SPECS[4].ratio, borderRadius: 20, background: "#eee", border: "1px dashed #ccc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, maxWidth: 700, margin: "0 auto" }}>
              <p style={{ color: "#999", fontSize: 13, margin: 0 }}>[Imagen: {IMG_SPECS[4].desc}]</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* === CTA FINAL === */}
      <section style={{ padding: "90px 24px", background: NAVY, textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(28px,4.5vw,44px)", fontWeight: 800, color: "#fff", margin: "0 0 18px", lineHeight: 1.2 }}>
              Deja de forzar a tu hijo a encajar en un sistema que no lo pensó a él.
            </h2>
            <p style={{ fontSize: 17, color: "#cfe0f5", margin: "0 0 32px" }}>
              Conoce cómo Barkley adapta la educación a su ritmo, no al revés.
            </p>
            <motion.a
              href="/#inscripcion"
              whileHover={{ scale: 1.05 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GOLD, color: NAVY, textDecoration: "none", fontWeight: 700, fontSize: 15, letterSpacing: "0.04em", borderRadius: 999, padding: "18px 36px" }}
            >
              Quiero inscribirme <ArrowUpRight size={18} />
            </motion.a>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
