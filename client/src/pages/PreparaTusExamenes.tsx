/**
 * Prepara tus Exámenes — gancho SEO/lead: guía interactiva para Exámenes Libres
 * MINEDUC, PAES y pruebas globales de colegio. Mismo principio que Adaptativo:
 * la página no describe las técnicas, las DEMUESTRA con herramientas reales.
 *
 * Fechas oficiales citadas: MINEDUC Exámenes Libres 2026 (mismas que Home.tsx)
 * y PAES 2026 / Admisión 2027 (DEMRE, calendario oficial publicado jun-2026).
 * Evidencia de técnicas de estudio: Dunlosky et al. 2013, "Improving Students'
 * Learning With Effective Learning Techniques", Psychological Science in the
 * Public Interest — retrieval practice y spaced practice como las dos técnicas
 * con mayor respaldo empírico; releer y subrayar con respaldo bajo.
 *
 * Dirección estética: misma paleta y tipografía de Adaptativo.tsx (Fraunces +
 * Lexend, papel cálido) — coherencia de familia visual entre páginas de gancho.
 */
import { useEffect, useMemo, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, X, Clock, Calendar, Brain, ArrowRight } from "lucide-react";

const PAPER = "#FBF6EC";
const PAPER_DEEP = "#F2E9D8";
const INK = "#152A42";
const INK_SOFT = "#5A6B7E";
const GOLD = "#E0A02E";
const RED = "#C8402F";
const SAGE = "#4F7D5E";
const RULE = "#DCCFB8";

const DISPLAY = "'Fraunces', Georgia, serif";
const BODY = "'Lexend', system-ui, sans-serif";

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

/* ─── HERRAMIENTA 1 · Cuenta regresiva a fechas oficiales reales ────────── */
const PRUEBAS_OFICIALES = [
  { id: "libres1", label: "Exámenes Libres MINEDUC — 1er período", fecha: new Date("2026-09-21T09:00:00-03:00") },
  { id: "libres2", label: "Exámenes Libres MINEDUC — 2do período", fecha: new Date("2026-10-19T09:00:00-03:00") },
  { id: "paes", label: "PAES Regular — Admisión 2027", fecha: new Date("2026-11-30T09:00:00-03:00") },
];

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const diffMs = target.getTime() - now.getTime();
  const dias = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return { dias, pasada: diffMs < 0 };
}

function CuentaRegresivaDemo() {
  const [sel, setSel] = useState(PRUEBAS_OFICIALES[0].id);
  const prueba = PRUEBAS_OFICIALES.find((p) => p.id === sel)!;
  const { dias, pasada } = useCountdown(prueba.fecha);
  const semanas = Math.floor(dias / 7);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {PRUEBAS_OFICIALES.map((p) => (
          <button
            key={p.id}
            onClick={() => setSel(p.id)}
            style={{
              padding: "9px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600,
              background: sel === p.id ? INK : "transparent",
              color: sel === p.id ? PAPER : INK,
              border: `1.5px solid ${sel === p.id ? INK : RULE}`,
              cursor: "pointer", fontFamily: BODY,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ background: INK, borderRadius: 12, padding: "clamp(28px,5vw,44px)", display: "flex", alignItems: "center", gap: "clamp(20px,4vw,40px)", flexWrap: "wrap" }}>
        <Calendar style={{ width: 40, height: 40, color: GOLD, flexShrink: 0 }} />
        <div>
          {pasada ? (
            <p style={{ fontFamily: DISPLAY, fontSize: "clamp(22px,3.4vw,30px)", color: PAPER, margin: 0 }}>Este período ya se rindió.</p>
          ) : (
            <>
              <p style={{ fontFamily: DISPLAY, fontSize: "clamp(38px,6.5vw,58px)", fontWeight: 500, color: PAPER, margin: 0, lineHeight: 1 }}>
                {dias} días
              </p>
              <p style={{ fontSize: 14, color: "rgba(251,246,236,.7)", margin: "6px 0 0" }}>
                ≈ {semanas} semanas — { "" }
                {semanas >= 8 ? "todavía alcanza un plan completo de 8 semanas." : semanas >= 4 ? "alcanza para un plan corto, sin tiempo que perder." : "quedan pocos días: prioriza simulacros, no contenido nuevo."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── HERRAMIENTA 2 · Generador de plan según semanas restantes ─────────── */
function generarPlan(semanas: number) {
  if (semanas <= 0) return [];
  if (semanas <= 2) {
    return [
      ["Ahora", "Simulacros cronometrados a diario, foco en formato y tiempo."],
      ["Últimos días", "Repaso ligero de lo que aún falla. Nada de contenido nuevo. Dormir bien."],
    ];
  }
  if (semanas <= 4) {
    return [
      ["Semana 1", "Diagnóstico honesto: qué dominas y qué no, por asignatura."],
      ["Semana 2", "Ataca primero lo débil — no repases lo que ya sabes todavía."],
      [`Semanas 3${semanas === 4 ? "-4" : ""}`, "Simulacros cronometrados + repaso espaciado de todo el temario."],
    ];
  }
  return [
    ["Semanas " + semanas + "-" + (semanas - 1), "Diagnóstico por asignatura. No estudies aún, primero mapea los vacíos."],
    ["Semanas " + (semanas - 2) + "-" + (semanas - 3), "Ataca las unidades débiles detectadas en el diagnóstico."],
    ["Semanas " + (semanas - 4) + "-" + Math.max(3, semanas - 5), "Cobertura completa: repasa todo el temario una vez, incluido lo que dominas."],
    ["Semana 2", "Simulacros cronometrados en condiciones reales."],
    ["Semana 1", "Repasos cortos y espaciados. Foco en lo que aún falla. Sin contenido nuevo."],
  ];
}

function PlanGeneradorDemo() {
  const [semanas, setSemanas] = useState(8);
  const plan = useMemo(() => generarPlan(semanas), [semanas]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>Semanas hasta tu examen:</span>
        <input
          type="range" min={1} max={12} value={semanas}
          onChange={(e) => setSemanas(Number(e.target.value))}
          style={{ width: 200, accentColor: GOLD }}
        />
        <span style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 600, color: INK, minWidth: 36 }}>{semanas}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 10, overflow: "hidden" }}>
        {plan.map(([cuando, que]) => (
          <div key={cuando} style={{ background: PAPER, padding: "16px 20px", display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap" }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 700, color: GOLD, minWidth: 130 }}>{cuando}</span>
            <span style={{ fontSize: 14, color: INK_SOFT, lineHeight: 1.6, flex: "1 1 260px" }}>{que}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── HERRAMIENTA 3 · Releer vs. Recuperar activamente — la misma comparación
   que respalda Dunlosky et al. 2013: practice testing es de las dos técnicas
   con mayor evidencia, releer tiene respaldo bajo. ──────────────────────── */
const PARRAFO_DEMO = "La fotosíntesis es el proceso mediante el cual las plantas transforman la luz solar en energía química. Ocurre en los cloroplastos, usando dióxido de carbono y agua, y libera oxígeno como resultado.";

function RecuperacionDemo() {
  const [modo, setModo] = useState<"releer" | "recuperar">("releer");
  const [respuesta, setRespuesta] = useState("");
  const [revelado, setRevelado] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["releer", "recuperar"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setModo(m); setRevelado(false); setRespuesta(""); }}
            style={{
              padding: "9px 16px", borderRadius: 999, fontSize: 13.5, fontWeight: 600,
              background: modo === m ? INK : "transparent",
              color: modo === m ? PAPER : INK,
              border: `1.5px solid ${modo === m ? INK : RULE}`,
              cursor: "pointer", fontFamily: BODY,
            }}
          >
            {m === "releer" ? "Releer el párrafo" : "Recuperar de memoria"}
          </button>
        ))}
      </div>

      {modo === "releer" ? (
        <div style={{ background: PAPER_DEEP, borderRadius: 10, padding: "22px 24px", border: `1px solid ${RULE}` }}>
          <p style={{ fontSize: 15, color: INK, margin: "0 0 12px", lineHeight: 1.8 }}>{PARRAFO_DEMO}</p>
          <p style={{ fontSize: 13, color: INK_SOFT, margin: 0, fontStyle: "italic" }}>
            Se siente productivo — pero Dunlosky et al. (2013) encontraron evidencia baja de que releer mejore
            la retención real. El cerebro reconoce el texto, no lo recuerda.
          </p>
        </div>
      ) : (
        <div style={{ background: PAPER_DEEP, borderRadius: 10, padding: "22px 24px", border: `1px solid ${RULE}` }}>
          <p style={{ fontSize: 14.5, fontWeight: 600, color: INK, margin: "0 0 12px" }}>
            Sin mirar arriba: ¿qué usan las plantas y qué liberan en la fotosíntesis?
          </p>
          <textarea
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            placeholder="Escribe lo que recuerdes, de memoria…"
            style={{
              width: "100%", minHeight: 70, borderRadius: 8, border: `1.5px solid ${RULE}`,
              padding: 12, fontFamily: BODY, fontSize: 14, color: INK, background: PAPER, resize: "vertical",
            }}
          />
          <button
            onClick={() => setRevelado(true)}
            style={{ marginTop: 10, background: INK, color: PAPER, border: "none", borderRadius: 999, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Comparar con el original
          </button>
          {revelado && (
            <p style={{ fontSize: 13.5, color: SAGE, margin: "14px 0 0", lineHeight: 1.7 }}>
              <strong>Original:</strong> {PARRAFO_DEMO}
              <br /><br />
              El solo hecho de intentar recordarlo — aunque te haya faltado algo — ya fortaleció la memoria más
              que otra relectura. Eso es <em>retrieval practice</em>, la técnica con mayor evidencia según Dunlosky et al.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── FAQ ─────────────────────────────────────────────────────────────── */
const FAQS = [
  { q: "¿Cuál es la diferencia entre Exámenes Libres, PAES y una prueba global de colegio?", a: "Los Exámenes Libres validan tu nivel escolar completo ante el MINEDUC sin asistir a un colegio tradicional. La PAES es la prueba de acceso a la educación superior, aparte de la validación escolar. Una prueba global de colegio es una evaluación acumulativa interna, propia de cada establecimiento — no la define el Ministerio." },
  { q: "¿Estas técnicas sirven para cualquiera de las tres?", a: "Sí. La evidencia sobre repetición espaciada y recuperación activa no depende del tipo de prueba — depende de cómo funciona la memoria. Lo que cambia entre Exámenes Libres, PAES y pruebas de colegio es el temario y el formato, no la forma de estudiar para retener." },
  { q: "¿Cuántas semanas antes debería empezar?", a: "Idealmente 8. Con menos tiempo el plan se comprime a diagnóstico rápido y simulacros, que es mejor que nada pero deja menos margen para reforzar vacíos grandes." },
  { q: "¿Esto reemplaza estudiar con un profesor o tutor?", a: "No. Es el método — cómo distribuir y practicar el estudio. Barkley aplica exactamente este mismo principio (repetición espaciada, dominio antes de avanzar) con un tutor real haciendo seguimiento, no solo una guía." },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div>
      {FAQS.map((f, i) => (
        <div key={f.q} style={{ borderBottom: `1px solid ${RULE}` }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, cursor: "pointer" }}
          >
            <span style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 500, color: INK }}>{f.q}</span>
            <ArrowRight style={{ width: 16, height: 16, color: GOLD, flexShrink: 0, transform: open === i ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
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

/* ─── Página ─────────────────────────────────────────────────────────── */
export default function PreparaTusExamenes() {
  useEffect(() => {
    document.title = "Prepara tus Exámenes — Exámenes Libres, PAES y pruebas globales | Barkley";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Cuenta regresiva a fechas oficiales, generador de plan de estudio y técnicas con evidencia real (Dunlosky et al.) para Exámenes Libres MINEDUC, PAES y pruebas globales.");
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", "https://www.barkleyinstituto.cl/prepara-tus-examenes");
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", "https://www.barkleyinstituto.cl/prepara-tus-examenes");
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", "Prepara tus Exámenes — Exámenes Libres, PAES y pruebas globales | Barkley");

    const id = "prepara-examenes-fonts";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600&family=Lexend:wght@300;400;500;600&display=swap');`;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div style={{ background: PAPER, color: INK, fontFamily: BODY, fontSize: 16, lineHeight: 1.75, minHeight: "100vh" }}>
      <header style={{ padding: "20px 24px", borderBottom: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, background: INK, borderRadius: 5, color: PAPER, fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY }}>BK</div>
            <span style={{ fontWeight: 500, color: INK, fontSize: 14, lineHeight: 1.25 }}>The Barkley<br />Online School</span>
          </a>
          <a href="/#inscripcion" style={{ background: RED, color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 14, padding: "10px 22px", borderRadius: 999 }}>Inscribirse</a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: "clamp(56px,10vw,116px) 24px clamp(40px,7vw,76px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-14%", right: "-6%", width: 420, height: 420, borderRadius: "50%", background: `radial-gradient(circle, ${GOLD}22 0%, transparent 68%)`, pointerEvents: "none" }} />
        <div style={{ maxWidth: 860, margin: "0 auto", position: "relative" }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: RED, margin: "0 0 16px" }}>
            Exámenes Libres · PAES · Pruebas globales
          </p>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(34px,6vw,58px)", fontWeight: 500, color: INK, margin: "0 0 20px", lineHeight: 1.08, letterSpacing: "-0.02em", fontVariationSettings: "'SOFT' 30" }}>
            Prepárate con el método que la evidencia respalda, no con más horas la última semana
          </h1>
          <p style={{ fontSize: "clamp(16px,2vw,19px)", color: INK_SOFT, maxWidth: 620, margin: 0, lineHeight: 1.7 }}>
            Cuenta regresiva a las fechas oficiales, un plan de estudio armado según el tiempo que te queda,
            y una comparación en vivo entre releer y recuperar de memoria — la técnica con más respaldo
            científico real.
          </p>
        </div>
      </section>

      <Section num="01" kicker="Cuánto tiempo te queda" title="Fechas oficiales, no estimaciones">
        <CuentaRegresivaDemo />
      </Section>

      <Section num="02" kicker="Tu plan, según tus semanas" title="Ajusta el tiempo y mira cómo cambia el plan">
        <PlanGeneradorDemo />
      </Section>

      <Section num="03" kicker="Evidencia · Dunlosky et al. 2013" title="Pruébalo tú mismo: releer vs. recuperar">
        <RecuperacionDemo />
      </Section>

      {/* Qué funciona y qué no */}
      <section style={{ background: INK, color: PAPER, padding: "clamp(56px,9vw,96px) 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(26px,4.2vw,42px)", fontWeight: 400, margin: "0 0 12px", lineHeight: 1.15, fontVariationSettings: "'SOFT' 30" }}>
            Lo que dice la evidencia
          </h2>
          <p style={{ color: "rgba(251,246,236,.62)", margin: "0 0 44px", maxWidth: 620, fontSize: 15.5 }}>
            Dunlosky et al. (2013), la revisión más citada sobre técnicas de estudio, analizó 10 técnicas comunes.
            Estas dos quedaron con la mayor evidencia — y estas otras, con la más baja.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 1, background: "rgba(251,246,236,.14)", border: "1px solid rgba(251,246,236,.14)" }}>
            {[
              [Check, SAGE, "Recuperación activa", "Responder de memoria antes de revisar el material — no releerlo."],
              [Check, SAGE, "Repetición espaciada", "Repasar el mismo contenido en intervalos crecientes, no todo junto."],
              [X, RED, "Releer el material", "Se siente productivo, pero la evidencia de que mejore la retención es baja."],
              [X, RED, "Subrayar o resaltar", "Es pasivo — no obliga al cerebro a reconstruir nada."],
            ].map(([Icon, color, t, d]: any) => (
              <div key={t} style={{ background: INK, padding: "28px 24px" }}>
                <Icon style={{ width: 19, height: 19, color, marginBottom: 14 }} />
                <h3 style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 500, margin: "0 0 8px", color: PAPER }}>{t}</h3>
                <p style={{ fontSize: 14, color: "rgba(251,246,236,.66)", margin: 0, lineHeight: 1.7 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fechas oficiales, tabla */}
      <section style={{ padding: "clamp(56px,9vw,96px) 24px", borderTop: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(26px,4.2vw,42px)", fontWeight: 400, margin: "0 0 32px", lineHeight: 1.15, fontVariationSettings: "'SOFT' 30" }}>
            Calendario oficial 2026
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 10, overflow: "hidden" }}>
            {[
              ["Exámenes Libres MINEDUC — 1er período", "Rendición: 21 de septiembre al 2 de octubre de 2026 · Resultados: 27 de octubre de 2026"],
              ["Exámenes Libres MINEDUC — 2do período", "Rendición: 19 al 30 de octubre de 2026"],
              ["PAES Regular — Admisión 2027", "Rendición: 30 de noviembre, 1 y 2 de diciembre de 2026 · Resultados: 4 de enero de 2027"],
              ["PAES de Invierno 2026", "Rendición: 15, 16 y 17 de junio · Resultados: 17 de julio de 2026 (ya rendida este año)"],
            ].map(([t, d]) => (
              <div key={t} style={{ background: PAPER, padding: "18px 22px", display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap" }}>
                <Clock style={{ width: 16, height: 16, color: GOLD, flexShrink: 0 }} />
                <span style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 600, color: INK, minWidth: 260 }}>{t}</span>
                <span style={{ fontSize: 13.5, color: INK_SOFT }}>{d}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12.5, color: INK_SOFT, margin: "18px 0 0", fontStyle: "italic" }}>
            Verifica siempre el calendario vigente en el Portal de Ayuda MINEDUC y demre.cl — las fechas se confirman año a año.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "clamp(56px,9vw,104px) 24px", borderTop: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(26px,4.2vw,42px)", fontWeight: 400, margin: "0 0 36px", lineHeight: 1.15, fontVariationSettings: "'SOFT' 30" }}>
            Preguntas frecuentes
          </h2>
          <Faq />
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: PAPER_DEEP, padding: "clamp(52px,8vw,88px) 24px", borderTop: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <Brain style={{ width: 34, height: 34, color: GOLD, margin: "0 auto 18px" }} />
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(26px,4vw,38px)", fontWeight: 500, color: INK, margin: "0 0 14px", lineHeight: 1.2, fontVariationSettings: "'SOFT' 30" }}>
            Este mismo método corre dentro de Barkley — con tutor real
          </h2>
          <p style={{ fontSize: 15.5, color: INK_SOFT, margin: "0 0 28px", lineHeight: 1.7 }}>
            Umbral™, nuestro motor de progreso, no deja avanzar sin dominar de verdad — el mismo principio de
            repetición y recuperación activa, aplicado a todo el año, no solo a la semana del examen.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/together" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: INK, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15, padding: "14px 26px", borderRadius: 999 }}>
              Estudiar acompañado ahora <ArrowRight style={{ width: 16, height: 16 }} />
            </a>
            <a href="/#inscripcion" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: RED, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15, padding: "14px 30px", borderRadius: 999 }}>
              Conocer Barkley <ArrowRight style={{ width: 16, height: 16 }} />
            </a>
          </div>
        </div>
      </section>

      <footer style={{ padding: "24px", textAlign: "center", borderTop: `1px solid ${RULE}` }}>
        <p style={{ fontSize: 12.5, color: INK_SOFT, margin: 0 }}>Barkley Online · The Barkley Online School</p>
      </footer>
    </div>
  );
}
