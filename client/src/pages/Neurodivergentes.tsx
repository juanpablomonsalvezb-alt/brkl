/**
 * Página única para familias de estudiantes con TEA, dislexia y TDAH.
 * Contenido base: guía "Cómo trabajamos con estudiantes con TEA, dislexia y TDAH"
 * (15-oct-2026). Regla de la guía: no prometer funciones sin validar. Por eso
 * las imágenes se rotulan como ilustración referencial y hay un bloque de límites.
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

const NAVY = "#003366";
const GOLD = "#FFC548";
const TEXT = "#525252";
const SLATE = "#5b7ba3";
const FONT = "'Poppins', sans-serif";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const PASOS = [
  { n: "1", t: "Me ubico", d: "Veo la asignatura, el objetivo y cuánto abarca la actividad." },
  { n: "2", t: "Comprendo", d: "Explicación breve, instrucciones concretas y un ejemplo resuelto." },
  { n: "3", t: "Practico", d: "Respondo una actividad corta y puedo volver a leer la instrucción." },
  { n: "4", t: "Compruebo", d: "Reviso mi respuesta y recibo retroalimentación." },
  { n: "5", t: "Continúo o refuerzo", d: "Sé cuál es el siguiente paso o qué conviene repasar." },
];

type Perfil = {
  id: string;
  nombre: string;
  kicker: string;
  titulo: string;
  bajada: string;
  color: string;
  tint: string;
  img: string;
  alt: string;
  prioridad: string;
  como: { t: string; d: string }[];
  ejemplo: string;
  limite: string;
  fundamento: string;
};

const PERFILES: Perfil[] = [
  {
    id: "tea",
    nombre: "TEA / Autismo",
    kicker: "Previsibilidad",
    titulo: "Un entorno donde siempre se sabe qué viene después",
    bajada:
      "Para estudiantes con TEA priorizamos la previsibilidad, las instrucciones explícitas y la reducción de ambigüedad. El diagnóstico no define por sí solo las necesidades: cada estudiante puede requerir apoyos distintos.",
    color: "#2f6fd6",
    tint: "#eef4ff",
    img: "/images/neurodivergentes/tea.webp",
    alt: "Ilustración referencial de una actividad de Ciencias Naturales en Barkley para estudiantes con TEA: pasos Explora, Aprende, Practica, Revisa y Continúa",
    prioridad: "Previsibilidad, instrucciones explícitas, menos ambigüedad.",
    como: [
      { t: "Antes", d: "Anticipamos el objetivo, la cantidad de pasos y qué ocurrirá al terminar." },
      { t: "Durante", d: "Mismo orden visual en cada actividad, frases concretas y una instrucción por bloque." },
      { t: "En la actividad", d: "Separamos con claridad “mira”, “lee”, “responde” y “revisa”. Nada decorativo compite con la consigna." },
      { t: "Al terminar", d: "Se indica qué se completó y qué viene después, sin cambios inesperados en la ruta." },
    ],
    ejemplo:
      "En Ciencias, el estudiante primero observa una imagen, luego lee una instrucción breve, elige respuestas y finalmente revisa el resultado. Esa secuencia se mantiene estable entre actividades.",
    limite:
      "La modalidad asincrónica permite distribuir el tiempo, pero no elimina por sí sola barreras sensoriales, de comunicación, de transición o de regulación, ni reemplaza apoyos especializados cuando son necesarios.",
    fundamento:
      "La estructura visual y la anticipación son el núcleo de la enseñanza estructurada que desarrolla el programa TEACCH de la Universidad de Carolina del Norte en Chapel Hill.",
  },
  {
    id: "dislexia",
    nombre: "Dislexia",
    kicker: "Acceso al contenido",
    titulo: "Aprender sin barreras, sin rebajar el objetivo",
    bajada:
      "La dislexia afecta principalmente la lectura y la escritura, y sus manifestaciones varían. Facilitamos el acceso al contenido sin bajar la exigencia de lo que se aprende.",
    color: "#7b5ad8",
    tint: "#f3effd",
    img: "/images/neurodivergentes/dislexia.webp",
    alt: "Ilustración referencial de una lectura guiada de Ciencias en Barkley para estudiantes con dislexia, con texto organizado, apoyo visual y retroalimentación",
    prioridad: "Acceso al contenido y lectura trabajada de forma explícita.",
    como: [
      { t: "Instrucciones aparte", d: "Las consignas se separan del texto principal y se mantienen breves." },
      { t: "Texto organizado", d: "Párrafos cortos, subtítulos y apoyos visuales en lugar de bloques extensos." },
      { t: "Vocabulario anticipado", d: "Antes de leer, las palabras clave se presentan con imagen y definición." },
      { t: "Lectura que se enseña", d: "Escuchar un texto ayuda a acceder al contenido, pero no sustituye aprender a leer: esa enseñanza es explícita, sistemática y acorde al nivel." },
    ],
    ejemplo:
      "Antes de una lectura sobre los seres vivos se muestra el vocabulario clave con imagen y definición; luego se trabaja un párrafo breve y se responde una pregunta de comprensión.",
    limite:
      "Los formatos alternativos (audio, lectura en voz alta, tipografía o espaciado ajustables) se informan solo cuando están disponibles y comprobados. Un recurso de audio no sustituye la enseñanza de la lectura.",
    fundamento:
      "Se apoya en la lectura estructurada (Structured Literacy) de la International Dyslexia Association y en la guía de intervenciones de lectura del Institute of Education Sciences de EE. UU.",
  },
  {
    id: "tdah",
    nombre: "TDAH",
    kicker: "Iniciar, organizar, terminar",
    titulo: "Tareas pequeñas, primer paso claro, avance real",
    bajada:
      "Para estudiantes con TDAH ayudamos a iniciar, organizar y terminar tareas. La flexibilidad asincrónica permite distribuir el trabajo, pero también exige planificación: por eso la actividad ya viene dividida.",
    color: "#e8801a",
    tint: "#fff4e8",
    img: "/images/neurodivergentes/tdah.webp",
    alt: "Ilustración referencial de una lección de Ciencias Naturales en Barkley para estudiantes con TDAH, con actividades breves, múltiples formatos y avance visible",
    prioridad: "Iniciar, organizar y terminar con un siguiente paso siempre visible.",
    como: [
      { t: "Bloques pequeños", d: "Las actividades largas se dividen en tramos con un objetivo visible por bloque." },
      { t: "Primer paso directo", d: "Por ejemplo: “Mira la imagen y después responde una pregunta”." },
      { t: "Menos carga a la vez", d: "Se reduce la cantidad de instrucciones simultáneas y se muestra qué hay que completar." },
      { t: "Avance honesto", d: "El progreso se muestra solo con datos reales; sin contadores decorativos ni progreso ficticio." },
    ],
    ejemplo:
      "En vez de una sola tarea con muchas consignas, la actividad se presenta en tres tramos: observar, resolver una pregunta y revisar. La interfaz muestra con claridad cuál es el tramo actual.",
    limite:
      "La plataforma no garantiza atención sostenida ni reemplaza el apoyo familiar, pedagógico o clínico que cada estudiante pueda necesitar. Pausar y retomar se ofrece solo donde el sistema guarda el estado y fue probado.",
    fundamento:
      "Descomponer tareas, dar instrucciones únicas y mostrar el avance son estrategias consistentes con los principios de Diseño Universal para el Aprendizaje de CAST.",
  },
];

const FUNDAMENTOS = [
  {
    inst: "CAST",
    t: "Universal Design for Learning Guidelines 3.0 (2024)",
    d: "Marco de diseño que ofrece múltiples formas de representar, responder y comprometerse con el aprendizaje.",
    href: "https://udlguidelines.cast.org/",
  },
  {
    inst: "UNESCO",
    t: "Guidelines on inclusion of learners with disabilities in open and distance learning",
    d: "Orientaciones para incluir a estudiantes con discapacidad en educación abierta y a distancia.",
    href: "https://www.unesco.org/en/articles/revised-guidelines-inclusion-learners-disabilities-open-and-distance-learning-odl",
  },
  {
    inst: "Institute of Education Sciences",
    t: "Providing Reading Interventions for Students in Grades 4–9",
    d: "Guía de práctica del What Works Clearinghouse sobre intervenciones de lectura.",
    href: "https://ies.ed.gov/ncee/wwc/PracticeGuide/29",
  },
  {
    inst: "International Dyslexia Association",
    t: "Structured Literacy",
    d: "Enseñanza de la lectura explícita, sistemática y acumulativa.",
    href: "https://dyslexiaida.org/structuredliteracy/",
  },
  {
    inst: "Universidad de Carolina del Norte en Chapel Hill",
    t: "TEACCH Autism Program",
    d: "Enseñanza estructurada: organización visual, rutinas y anticipación.",
    href: "https://teacch.com/",
  },
  {
    inst: "Biblioteca del Congreso Nacional de Chile",
    t: "Ley 21.545 (Ley TEA)",
    d: "Marco legal chileno para la inclusión y protección de personas con trastorno del espectro autista.",
    href: "https://www.bcn.cl/leychile/navegar?idNorma=1190123",
  },
];

const COMPARA = [
  { n: "TEA", ref: "#tea", c: "#2f6fd6", ve: "Orden previsible, pasos explícitos, lenguaje concreto y anticipación.", no: "Que la plataforma resuelve todas las necesidades sensoriales o de comunicación." },
  { n: "Dislexia", ref: "#dislexia", c: "#7b5ad8", ve: "Texto organizado, vocabulario anticipado, apoyo visual y formatos accesibles cuando existen.", no: "Que cualquier recurso de audio sustituye la enseñanza de la lectura." },
  { n: "TDAH", ref: "#tdah", c: "#e8801a", ve: "Tareas acotadas, primer paso claro, secuencia visible y progreso real.", no: "Que la flexibilidad garantiza concentración o que hay recordatorios y guardado automático sin validarlos." },
];

export default function Neurodivergentes() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Cómo trabajamos con TEA, dislexia y TDAH — Barkley Instituto";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div style={{ backgroundColor: "#fff", color: TEXT, fontFamily: FONT, fontSize: 16, lineHeight: 1.8, overflowX: "hidden" }}>
      <SiteHeader overlay={false} />

      {/* HERO */}
      <section style={{ padding: "150px 24px 70px", background: "linear-gradient(180deg,#f4f8fd 0%,#fff 100%)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <p style={{ fontSize: 14, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>
              Para familias neurodivergentes
            </p>
            <h1 style={{ fontSize: "clamp(32px,5.4vw,54px)", fontWeight: 800, color: NAVY, margin: "0 0 20px", lineHeight: 1.15, textWrap: "balance" as any }}>
              Cómo trabajamos con estudiantes con TEA, dislexia y TDAH
            </h1>
            <p style={{ fontSize: 18, color: TEXT, margin: "0 auto 32px", maxWidth: 680 }}>
              Muchas familias nos preguntan el <strong style={{ color: NAVY }}>cómo</strong>. Aquí lo explicamos paso a paso:
              qué vive tu hijo o hija cuando entra a Barkley, qué cambia según su necesidad y qué no prometemos.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              {PERFILES.map((p) => (
                <a
                  key={p.id}
                  href={`#${p.id}`}
                  style={{ textDecoration: "none", background: p.tint, color: p.color, border: `2px solid ${p.color}`, borderRadius: 999, padding: "10px 24px", fontWeight: 700, fontSize: 15 }}
                >
                  {p.nombre}
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECUENCIA COMÚN */}
      <section style={{ padding: "70px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>La base común</p>
              <h2 style={{ fontSize: "clamp(26px,3.8vw,38px)", fontWeight: 700, color: NAVY, margin: "0 0 14px", lineHeight: 1.25 }}>
                Una misma secuencia en cada actividad
              </h2>
              <p style={{ maxWidth: 640, margin: "0 auto" }}>
                La consistencia reduce la incertidumbre. Por eso no hay tres plataformas separadas: hay una sola, con los apoyos que cada estudiante necesita.
              </p>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 18 }}>
            {PASOS.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.06}>
                <div style={{ background: "#f4f8fd", borderRadius: 16, padding: "24px 20px", height: "100%" }}>
                  <span style={{ display: "inline-flex", width: 34, height: 34, borderRadius: "50%", background: NAVY, color: "#fff", fontWeight: 700, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>{p.n}</span>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>{p.t}</h3>
                  <p style={{ fontSize: 14.5, margin: 0, lineHeight: 1.6 }}>{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* UN BLOQUE POR DIAGNÓSTICO */}
      {PERFILES.map((p, idx) => (
        <section key={p.id} id={p.id} style={{ padding: "90px 24px", background: idx % 2 === 0 ? p.tint : "#fff", scrollMarginTop: 70 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <Reveal>
              <p style={{ fontSize: 14, fontWeight: 800, color: p.color, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
                {p.nombre} · {p.kicker}
              </p>
              <h2 style={{ fontSize: "clamp(28px,4.2vw,44px)", fontWeight: 800, color: NAVY, margin: "0 0 16px", lineHeight: 1.2, maxWidth: 820, textWrap: "balance" as any }}>
                {p.titulo}
              </h2>
              <p style={{ fontSize: 17, maxWidth: 760, margin: "0 0 40px" }}>{p.bajada}</p>
            </Reveal>

            <Reveal delay={0.05}>
              <figure style={{ margin: "0 0 12px" }}>
                <img
                  src={p.img}
                  alt={p.alt}
                  loading="lazy"
                  style={{ width: "100%", height: "auto", borderRadius: 20, display: "block", boxShadow: "0 12px 40px rgba(0,51,102,0.14)" }}
                />
                <figcaption style={{ fontSize: 13, color: "#7a7a7a", margin: "10px 4px 0" }}>
                  Ilustración referencial de la experiencia de aprendizaje. Los apoyos concretos disponibles pueden variar según la asignatura.
                </figcaption>
              </figure>
            </Reveal>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 22, margin: "44px 0 30px" }}>
              {p.como.map((c, i) => (
                <Reveal key={c.t} delay={i * 0.07}>
                  <div style={{ background: "#fff", borderRadius: 16, padding: "26px 24px", height: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", borderTop: `4px solid ${p.color}` }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>{c.t}</h3>
                    <p style={{ fontSize: 14.5, margin: 0, lineHeight: 1.65 }}>{c.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
              <Reveal>
                <div style={{ background: "#fff", borderRadius: 16, padding: "26px 24px", height: "100%", border: `1px solid ${p.color}33` }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: p.color, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Un ejemplo concreto</p>
                  <p style={{ fontSize: 15, margin: 0 }}>{p.ejemplo}</p>
                </div>
              </Reveal>
              <Reveal delay={0.08}>
                <div style={{ background: "#fff", borderRadius: 16, padding: "26px 24px", height: "100%", border: `1px solid ${p.color}33` }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: p.color, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Fundamento</p>
                  <p style={{ fontSize: 15, margin: 0 }}>{p.fundamento}</p>
                </div>
              </Reveal>
              <Reveal delay={0.16}>
                <div style={{ background: "#fffaf0", borderRadius: 16, padding: "26px 24px", height: "100%", border: `1px solid ${GOLD}` }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#a06a00", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                    <AlertTriangle size={15} /> Límite que decimos de frente
                  </p>
                  <p style={{ fontSize: 15, margin: 0 }}>{p.limite}</p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      ))}

      {/* COMPARACIÓN PARA FAMILIAS */}
      <section style={{ padding: "90px 24px", background: "#fafaf9" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>De un vistazo</p>
              <h2 style={{ fontSize: "clamp(26px,3.8vw,38px)", fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.25 }}>
                Qué verás en la actividad, y qué no prometemos
              </h2>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 22 }}>
            {COMPARA.map((c, i) => (
              <Reveal key={c.n} delay={i * 0.08}>
                <div style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", height: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                  <a href={c.ref} style={{ fontSize: 20, fontWeight: 800, color: c.c, textDecoration: "none" }}>{c.n}</a>
                  <p style={{ fontSize: 12.5, fontWeight: 800, color: "#00875a", textTransform: "uppercase", letterSpacing: "0.05em", margin: "16px 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={14} /> Cómo se refleja
                  </p>
                  <p style={{ fontSize: 14.5, margin: 0 }}>{c.ve}</p>
                  <p style={{ fontSize: 12.5, fontWeight: 800, color: "#c0392b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "16px 0 4px" }}>Qué no prometemos</p>
                  <p style={{ fontSize: 14.5, margin: 0 }}>{c.no}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FUNDAMENTOS */}
      <section style={{ padding: "90px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>Con respaldo</p>
              <h2 style={{ fontSize: "clamp(26px,3.8vw,38px)", fontWeight: 700, color: NAVY, margin: "0 0 12px", lineHeight: 1.25 }}>
                En qué nos apoyamos
              </h2>
              <p style={{ maxWidth: 620, margin: "0 auto" }}>
                Son marcos y guías de instituciones reconocidas. Los citamos como base de nuestras decisiones de diseño, no como certificación de Barkley.
              </p>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {FUNDAMENTOS.map((f, i) => (
              <Reveal key={f.t} delay={(i % 3) * 0.07}>
                <a
                  href={f.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block", textDecoration: "none", background: "#f4f8fd", borderRadius: 16, padding: "24px", height: "100%" }}
                >
                  <p style={{ fontSize: 12.5, fontWeight: 800, color: SLATE, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>{f.inst}</p>
                  <h3 style={{ fontSize: 16.5, fontWeight: 700, color: NAVY, margin: "0 0 8px", lineHeight: 1.35 }}>
                    {f.t} <ExternalLink size={13} style={{ verticalAlign: "-1px" }} />
                  </h3>
                  <p style={{ fontSize: 14, color: TEXT, margin: 0, lineHeight: 1.6 }}>{f.d}</p>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TEXTO PARA FAMILIAS + AVISO */}
      <section style={{ padding: "80px 24px", background: "#fafaf9" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(24px,3.4vw,32px)", fontWeight: 700, color: NAVY, margin: "0 0 18px", lineHeight: 1.3 }}>
              En pocas palabras
            </h2>
            <p style={{ fontSize: 17, margin: "0 0 18px" }}>
              En Barkley, el aprendizaje se organiza en una plataforma 100 % online y asincrónica. Buscamos que cada estudiante sepa qué aprenderá,
              comprenda las instrucciones, trabaje paso a paso y revise su avance. La adecuación concreta depende de las funciones disponibles
              en la plataforma y de las necesidades de cada estudiante.
            </p>
            <p style={{ fontSize: 15, background: "#fff", borderLeft: `4px solid ${GOLD}`, borderRadius: 8, padding: "16px 20px", margin: 0 }}>
              <strong style={{ color: NAVY }}>Importante:</strong> Barkley no es un servicio clínico, no sustituye terapias ni promete supervisión humana permanente.
              El aprendizaje depende también del compromiso y el acompañamiento de la familia.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "90px 24px", background: NAVY, textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(26px,4.2vw,40px)", fontWeight: 800, color: "#fff", margin: "0 0 18px", lineHeight: 1.2 }}>
              ¿Dudas sobre cómo sería para tu hijo o hija?
            </h2>
            <p style={{ fontSize: 17, color: "#cfe0f5", margin: "0 0 32px" }}>
              Cuéntanos su situación y revisamos juntos si Barkley es el entorno adecuado.
            </p>
            <motion.a
              href="/#inscripcion"
              whileHover={{ scale: 1.05 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GOLD, color: NAVY, textDecoration: "none", fontWeight: 700, fontSize: 15, letterSpacing: "0.04em", borderRadius: 999, padding: "18px 36px" }}
            >
              Quiero conversar <ArrowUpRight size={18} />
            </motion.a>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
