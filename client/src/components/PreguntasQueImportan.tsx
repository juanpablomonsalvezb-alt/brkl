/**
 * "Las preguntas que importan" — módulo editorial interactivo de la landing.
 * Contenido: Brief Maestro Barkley (16-oct-2026). Ocho preguntas para familias;
 * cada una se abre en un panel integrado (sin modales): idea breve primero,
 * explicación ampliada a pedido. Los CTA apuntan solo a páginas que existen.
 * Regla del brief: no prometer funciones no verificadas (tutoría 24/7, IA
 * adaptativa, feedback instantáneo, resultados garantizados).
 */
import { useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ArrowDown, Plus, Minus } from "lucide-react";

const NOCHE = "#101B2B";
const MARFIL = "#F8F5ED";
const LIMA = "#D6F36A";
const SALVIA = "#52634D";
const AZUL = "#24364A";
const AZUL_2 = "#30445A";
const FONT = "'Poppins', sans-serif";

type Pregunta = {
  tema: string;
  pregunta: string;
  idea: string;
  conexion: string;
  ejemplo: string;
  cierre: string;
  cta: { label: string; href: string };
};

const PREGUNTAS: Pregunta[] = [
  {
    tema: "Tiempo y aprendizaje",
    pregunta: "¿Y si tu hijo no necesitara pasar horas conectado para aprender de verdad?",
    idea: "Aprender no debería medirse solamente por el tiempo que un estudiante permanece frente a una pantalla. También importa qué comprende, qué puede practicar y cómo avanza.",
    conexion: "Barkley organiza su propuesta en torno al aprendizaje asincrónico: el estudiante accede a sus experiencias de aprendizaje sin depender de una clase en vivo a una hora fija. Esto permite distribuir el trabajo con mayor flexibilidad, manteniendo objetivos, actividades y una ruta de estudio clara.",
    ejemplo: "Imagina que una explicación necesita una segunda revisión. En lugar de depender de que vuelva a ocurrir una clase en directo, el estudiante puede volver al material disponible.",
    cierre: "El tiempo importa, pero el propósito del tiempo importa más.",
    cta: { label: "¿Cómo se organiza el aprendizaje?", href: "/sin-limites" },
  },
  {
    tema: "Cuando la clase termina",
    pregunta: "¿Qué pasa cuando tu hijo no entiende algo y la clase ya terminó?",
    idea: "Una duda no siempre aparece cuando alguien está disponible para responderla. Comprender puede requerir volver a mirar, leer, probar y equivocarse.",
    conexion: "En una experiencia asincrónica bien diseñada, el aprendizaje no depende de una única explicación en vivo. Los materiales e instrucciones permiten retomar el contenido y saber cuál es el siguiente paso.",
    ejemplo: "Si un concepto no queda claro a la primera, el estudiante puede volver sobre él y saber qué hacer después. La promesa no es que nunca tendrá dudas, sino que el proceso le ayude a gestionarlas.",
    cierre: "Una duda no debería ser el final del camino.",
    cta: { label: "Descubre cómo se aprende en Barkley", href: "/tour-plataforma" },
  },
  {
    tema: "Aprender o cumplir tareas",
    pregunta: "¿Cómo sabes si tu hijo está aprendiendo o simplemente está cumpliendo tareas?",
    idea: "Completar una actividad no siempre significa comprender. Aprender también implica explicar con palabras propias, aplicar una idea, reconocer un error y mejorar.",
    conexion: "La experiencia educativa conecta objetivos, actividades y evidencias de aprendizaje. Las familias necesitan información comprensible sobre el progreso, no solamente una lista de tareas terminadas.",
    ejemplo: "En vez de preguntar solo “¿terminaste?”, podemos abrir otra conversación: “¿Qué aprendiste?, ¿qué te resultó difícil?, ¿qué podrías explicar de otra manera?”.",
    cierre: "Terminar es una acción. Comprender es el propósito.",
    cta: { label: "Conoce cómo se acompaña el progreso", href: "/adulto-acompanante" },
  },
  {
    tema: "Ritmos de aprendizaje",
    pregunta: "¿Por qué todos deberían aprender lo mismo, al mismo ritmo y al mismo tiempo?",
    idea: "Los estudiantes no siempre comprenden una idea en el mismo momento. Algunos necesitan más práctica; otros, un desafío distinto o más tiempo para conectar conceptos.",
    conexion: "La modalidad asincrónica ofrece flexibilidad para organizar el tiempo y revisar los recursos disponibles sin depender de un horario común. Esa flexibilidad no garantiza por sí sola personalización: el diseño, las actividades y el apoyo son los que ayudan a avanzar con sentido.",
    ejemplo: "Un estudiante puede necesitar detenerse en una idea mientras otro está listo para continuar. El objetivo es dar espacio a esos procesos sin perder la estructura ni los objetivos.",
    cierre: "Un camino claro no tiene que ser un ritmo idéntico para todos.",
    cta: { label: "Explora la propuesta educativa", href: "/#metodo-barkley" },
  },
  {
    tema: "Autonomía con apoyo",
    pregunta: "¿Puede un niño aprender de forma autónoma sin sentirse solo?",
    idea: "La autonomía no significa resolverlo todo sin ayuda. Significa desarrollar gradualmente la capacidad de organizarse, tomar decisiones y reconocer cuándo necesita apoyo.",
    conexion: "Una experiencia asincrónica requiere instrucciones claras, metas comprensibles, una secuencia de trabajo y canales de acompañamiento bien definidos: quién acompaña, cómo pedir ayuda y cuándo esperar respuesta.",
    ejemplo: "Al comienzo, un estudiante puede necesitar que un adulto le ayude a planificar. Con práctica y orientación, puede asumir más decisiones. La autonomía se construye; no se exige de un día para otro.",
    cierre: "Aprender por cuenta propia no significa aprender sin nadie.",
    cta: { label: "Conoce cómo se organiza el acompañamiento", href: "/adulto-acompanante" },
  },
  {
    tema: "Flexibilidad familiar",
    pregunta: "¿Y si estudiar no tuviera que organizar toda la vida de tu familia?",
    idea: "La vida familiar tiene horarios, responsabilidades y ritmos distintos. Una propuesta educativa flexible puede ayudar a distribuir el tiempo de estudio de una manera más compatible con la realidad de cada hogar.",
    conexion: "Al no depender de clases en vivo obligatorias a una hora fija, el modelo asincrónico permite organizar cuándo acceder al aprendizaje, respetando plazos y exigencias académicas. Flexibilidad no significa ausencia de planificación: requiere una rutina realista y expectativas claras.",
    ejemplo: "La familia puede construir una rutina de estudio que encaje con sus días, reservando momentos para aprender, descansar, compartir y realizar otras actividades.",
    cierre: "Más flexibilidad necesita una buena estructura.",
    cta: { label: "Descubre cómo funciona la modalidad", href: "/preguntas-frecuentes" },
  },
  {
    tema: "Otra forma de explicar",
    pregunta: "¿Qué necesita tu hijo cuando una explicación simplemente no le funciona?",
    idea: "No todos comprendemos una idea con el mismo ejemplo o a la primera explicación. A veces necesitamos leerla de nuevo, practicar o relacionarla con algo conocido.",
    conexion: "En una propuesta asincrónica, los recursos se organizan para retomar contenidos y avanzar paso a paso, de modo que siempre haya un siguiente intento posible.",
    ejemplo: "La pregunta útil no es solo “¿por qué no entendiste?”, sino “¿qué otra forma de acercarnos a esta idea podría ayudarte?”.",
    cierre: "Cuando una explicación no basta, el aprendizaje necesita un siguiente paso.",
    cta: { label: "Explora los recursos de aprendizaje", href: "/herramientas-de-estudio" },
  },
  {
    tema: "Diseñar para aprender",
    pregunta: "¿Cómo sería un colegio diseñado para aprender, y no solo para cumplir horarios?",
    idea: "Sería una experiencia que conecta objetivos, recursos, actividades, práctica y seguimiento. La tecnología no sería decoración, sino una herramienta al servicio de una intención pedagógica clara.",
    conexion: "Barkley Instituto propone una experiencia educativa 100 % asincrónica. Su valor se explica desde cómo se organiza el aprendizaje, qué recursos encuentra el estudiante, cómo avanza y qué apoyos tiene disponibles.",
    ejemplo: "Antes de sumar más pantallas o funciones, la pregunta central es: ¿esto ayuda al estudiante a comprender, practicar, avanzar o pedir apoyo?",
    cierre: "La tecnología tiene sentido cuando mejora la experiencia de aprender.",
    cta: { label: "Conoce el modelo Barkley", href: "/asi-esta-construido" },
  },
];

const num = (i: number) => String(i + 1).padStart(2, "0");

export default function PreguntasQueImportan() {
  const [activa, setActiva] = useState(0);
  const [ampliada, setAmpliada] = useState(false);
  const [vistas, setVistas] = useState<Set<number>>(() => new Set([0]));
  const panelRef = useRef<HTMLDivElement>(null);
  const escenarioRef = useRef<HTMLDivElement>(null);
  const reducir = useReducedMotion();
  const p = PREGUNTAS[activa];

  function elegir(i: number) {
    setActiva(i);
    setAmpliada(false);
    setVistas((v) => new Set(v).add(i));
    // En móvil el panel queda arriba de la lista: se lleva la vista hasta él.
    if (window.matchMedia("(max-width: 899px)").matches) {
      panelRef.current?.scrollIntoView({ behavior: reducir ? "auto" : "smooth", block: "start" });
    }
  }

  const fade = reducir
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

  return (
    <section
      id="preguntas"
      aria-labelledby="preguntas-titulo"
      className="pqi"
      style={{ background: NOCHE, color: MARFIL, fontFamily: FONT, padding: "clamp(64px,9vw,112px) 24px", position: "relative", overflow: "hidden" }}
    >
      <style>{`
        .pqi :focus-visible { outline: 3px solid ${LIMA}; outline-offset: 3px; }
        .pqi-grid { display: grid; gap: 28px; grid-template-columns: 1fr; }
        .pqi-cards { display: grid; gap: 12px; grid-template-columns: 1fr; }
        @media (min-width: 900px) {
          .pqi-grid { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); align-items: start; }
          .pqi-panel { position: sticky; top: 96px; }
          .pqi-cards { grid-template-columns: 1fr 1fr; }
          .pqi-cards > li:nth-child(3n + 1) { grid-column: span 2; }
        }
        .pqi-card { transition: transform .2s ease, background-color .2s ease, border-color .2s ease; }
        @media (hover: hover) { .pqi-card:hover { transform: translateY(-3px); } .pqi-card[aria-pressed="false"]:hover { background-color: ${AZUL_2}; } }
        @media (prefers-reduced-motion: reduce) { .pqi-card, .pqi-card:hover { transition: none; transform: none; } }
      `}</style>

      {/* Trazo de recorrido: decoración, no información */}
      <svg aria-hidden="true" viewBox="0 0 1200 600" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.14, pointerEvents: "none" }}>
        <path d="M-20 520 C 220 420, 340 560, 560 430 S 900 180, 1220 260" fill="none" stroke={LIMA} strokeWidth="1.5" strokeDasharray="3 9" />
        <circle cx="560" cy="430" r="5" fill={LIMA} />
        <circle cx="1020" cy="215" r="5" fill={LIMA} />
      </svg>

      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
        {/* A. Entrada */}
        <header style={{ maxWidth: 760, marginBottom: "clamp(40px,6vw,64px)" }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.14em", color: LIMA, margin: "0 0 18px" }}>
            UNA CONVERSACIÓN SOBRE APRENDER
          </p>
          <h2 id="preguntas-titulo" style={{ fontSize: "clamp(40px,7vw,84px)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em", margin: "0 0 24px" }}>
            Las preguntas{" "}
            <span style={{ position: "relative", display: "inline-block" }}>
              que importan
              <motion.span
                aria-hidden="true"
                initial={reducir ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "absolute", left: 0, right: 0, bottom: "0.02em", height: "0.12em", background: LIMA, transformOrigin: "left", borderRadius: 4 }}
              />
            </span>
            .
          </h2>
          <p style={{ fontSize: "clamp(16px,1.6vw,19px)", lineHeight: 1.65, color: "#C9CFD8", margin: "0 0 30px", maxWidth: 620 }}>
            A veces, para imaginar una educación diferente, primero hay que hacer mejores preguntas. Explora ocho ideas
            sobre el tiempo, la comprensión, la autonomía y el sentido de aprender.
          </p>
          <button
            type="button"
            onClick={() => escenarioRef.current?.scrollIntoView({ behavior: reducir ? "auto" : "smooth", block: "start" })}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, background: LIMA, color: NOCHE, border: "none", borderRadius: 999, padding: "15px 28px", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          >
            Explorar las preguntas <ArrowDown size={17} />
          </button>
        </header>

        <div ref={escenarioRef} className="pqi-grid" style={{ scrollMarginTop: 90 }}>
          {/* B + D. Pregunta protagonista con respuesta integrada */}
          <div ref={panelRef} className="pqi-panel" style={{ scrollMarginTop: 90 }}>
            <div
              id="pqi-respuesta"
              role="region"
              aria-live="polite"
              aria-label={`Pregunta ${num(activa)}`}
              style={{ background: MARFIL, color: NOCHE, borderRadius: 24, padding: "clamp(28px,4vw,48px)", boxShadow: "0 30px 80px rgba(0,0,0,0.35)" }}
            >
              <AnimatePresence mode="wait">
                <motion.div key={activa} {...fade} transition={{ duration: 0.28 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 18 }}>
                    <span style={{ fontSize: "clamp(44px,6vw,72px)", fontWeight: 800, lineHeight: 0.9, color: SALVIA, letterSpacing: "-0.04em" }}>{num(activa)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: SALVIA }}>{p.tema}</span>
                  </div>
                  <h3 style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 700, lineHeight: 1.18, letterSpacing: "-0.015em", margin: "0 0 20px", textWrap: "balance" as any }}>
                    {p.pregunta}
                  </h3>
                  <p style={{ fontSize: 17, lineHeight: 1.7, margin: "0 0 24px", color: "#3A4656" }}>{p.idea}</p>

                  <button
                    type="button"
                    aria-expanded={ampliada}
                    aria-controls="pqi-ampliada"
                    onClick={() => setAmpliada((v) => !v)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, background: NOCHE, color: MARFIL, border: "none", borderRadius: 999, padding: "12px 22px", fontFamily: FONT, fontWeight: 600, fontSize: 14.5, cursor: "pointer" }}
                  >
                    {ampliada ? <Minus size={16} /> : <Plus size={16} />}
                    {ampliada ? "Cerrar el enfoque" : "Descubrir el enfoque"}
                  </button>

                  <div id="pqi-ampliada" hidden={!ampliada}>
                    {ampliada && (
                      <motion.div {...fade} transition={{ duration: 0.25 }} style={{ marginTop: 28, display: "grid", gap: 22 }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: SALVIA, margin: "0 0 6px" }}>Desde Barkley</p>
                          <p style={{ fontSize: 16, lineHeight: 1.7, margin: 0 }}>{p.conexion}</p>
                        </div>
                        <div style={{ borderLeft: `3px solid ${SALVIA}`, paddingLeft: 18 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: SALVIA, margin: "0 0 6px" }}>Un ejemplo</p>
                          <p style={{ fontSize: 16, lineHeight: 1.7, margin: 0, color: "#3A4656" }}>{p.ejemplo}</p>
                        </div>
                        <p style={{ fontSize: "clamp(20px,2.2vw,26px)", fontWeight: 700, lineHeight: 1.3, margin: "4px 0 0", letterSpacing: "-0.01em" }}>
                          “{p.cierre}”
                        </p>
                        <a href={p.cta.href} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: NOCHE, fontWeight: 700, fontSize: 15, textDecoration: "underline", textDecorationColor: SALVIA, textDecorationThickness: 2, textUnderlineOffset: 5, width: "fit-content" }}>
                          {p.cta.label} <ArrowUpRight size={16} />
                        </a>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <p aria-live="polite" style={{ fontSize: 13, color: "#9AA6B5", margin: "14px 4px 0" }}>
              Exploraste {vistas.size} de {PREGUNTAS.length}
            </p>
          </div>

          {/* C. Constelación de preguntas */}
          <nav aria-label="Las ocho preguntas">
            <ul className="pqi-cards" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {PREGUNTAS.map((q, i) => {
                const sel = i === activa;
                return (
                  <li key={q.tema} style={{ display: "flex" }}>
                    <button
                      type="button"
                      className="pqi-card"
                      aria-pressed={sel}
                      aria-controls="pqi-respuesta"
                      onClick={() => elegir(i)}
                      style={{
                        textAlign: "left", width: "100%", height: "100%", cursor: "pointer", fontFamily: FONT,
                        // Seleccionada: fondo lima con texto oscuro, para que destaque sobre el fondo noche.
                        background: sel ? LIMA : AZUL, color: sel ? NOCHE : MARFIL,
                        border: `1.5px solid ${sel ? LIMA : "rgba(248,245,237,0.08)"}`,
                        boxShadow: sel ? "0 14px 36px rgba(214,243,106,0.25)" : "none",
                        borderRadius: 18, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: 10, rowGap: 2, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: sel ? SALVIA : "#9AA6B5" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          {num(i)}
                          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 999, background: sel ? NOCHE : vistas.has(i) ? LIMA : "transparent", border: `1px solid ${sel ? NOCHE : LIMA}` }} />
                        </span>
                        <span>{q.tema}</span>
                      </span>
                      <span style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.4 }}>{q.pregunta}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* E. Cierre */}
        <div style={{ marginTop: "clamp(56px,8vw,88px)", paddingTop: 40, borderTop: "1px solid rgba(248,245,237,0.12)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 28 }}>
          <div style={{ maxWidth: 620 }}>
            <p style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.015em", margin: "0 0 10px" }}>
              Una buena pregunta puede abrir otra forma de aprender.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: "#C9CFD8", margin: 0 }}>
              Conoce el modelo de Barkley Instituto y descubre cómo se organiza una experiencia educativa 100 % asincrónica.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a href="/tour-plataforma" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: LIMA, color: NOCHE, textDecoration: "none", fontWeight: 700, fontSize: 15, borderRadius: 999, padding: "15px 26px" }}>
              Conoce cómo funciona Barkley <ArrowUpRight size={16} />
            </a>
            <a href="/#metodo" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: MARFIL, textDecoration: "none", fontWeight: 600, fontSize: 15, borderRadius: 999, padding: "14px 24px", border: `1.5px solid rgba(248,245,237,0.35)` }}>
              Explora nuestros niveles
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
