/**
 * Página dedicada al tour de la plataforma — antes era un modal (TourModal)
 * montado eager en Home.tsx, cargando sus 4 imágenes y estado siempre, aunque
 * casi nadie lo abriera. Sacado como ruta propia + lazy() en App.tsx: no pesa
 * nada en el bundle inicial de la home (que define el LCP), y de paso gana
 * una URL indexable propia en vez de vivir solo detrás de un clic.
 */
import { usePageMeta } from "@/lib/usePageMeta";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

const NAVY = "#003366";
const RED = "#FF3D37";
const GOLD = "#FFC548";
const TEXT = "#525252";
const FONT = "'Instrument Sans', system-ui, sans-serif";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const TOUR_SLIDES = [
  {
    img: "/images/tour/01-dashboard.webp",
    title: "Tu escritorio: siempre sabes qué sigue",
    text: "Al entrar, el estudiante ve exactamente dónde quedó y qué lección viene. Su avance real, sus asignaturas y el acceso directo a su asesor — todo en un solo lugar, sin perderse.",
  },
  {
    img: "/images/tour/02-curso.webp",
    title: "Avanzas por dominio, no por tiempo",
    text: "El avance por dominio organiza las unidades en secuencia y exige aprobar la anterior para continuar. Es una regla interna de estudio; no equivale a aprobar el Examen Libre ni a obtener la certificación ministerial.",
  },
  {
    img: "/images/tour/03-leccion.webp",
    title: "Cada lección tiene su propio video",
    text: "Video breve y claro por cada objetivo de aprendizaje. Se pausa, se repite, se ve cuando el día lo permite. Aprendes a tu ritmo real, sin clases en vivo ni horarios que cumplir.",
  },
  {
    img: "/images/tour/04-podcast.webp",
    title: "¿Prefieres escuchar? También hay pódcasts",
    text: "El audio es otro formato para revisar contenido. No sustituye por sí mismo el aprendizaje de la lectura ni garantiza una adaptación adecuada a cada necesidad; consulta los apoyos disponibles antes de matricular.",
  },
];

export default function TourPlataforma() {
  usePageMeta({
    title: "Vórtice: cómo se estudia en la plataforma Barkley",
    description: "Conoce Vórtice con un recorrido público de estudio y un ejemplo ficticio resuelto. Distingue práctica, avance por dominio y certificación MINEDUC.",
  });
  return (
    <div style={{ backgroundColor: "#fff", color: TEXT, fontFamily: FONT, fontSize: 16, lineHeight: 1.8, overflowX: "hidden" }}>
      <SiteHeader overlay={false} />
      <main id="contenido-tour">

      <section style={{ background: `linear-gradient(180deg, ${NAVY} 0%, #001d3d 100%)`, padding: "60px 24px 50px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <Reveal>
            <span style={{ display: "inline-block", background: "rgba(255,197,72,0.15)", color: GOLD, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 18px", borderRadius: 999, marginBottom: 22 }}>
              Vórtice · plataforma Barkley
            </span>
            <h1 style={{ fontSize: "clamp(30px,5vw,48px)", fontWeight: 700, color: "#fff", margin: "0 0 16px", lineHeight: 1.15 }}>
              Cómo se estudia en Vórtice
            </h1>
            <p style={{ fontSize: 17, color: "#cfe0f5", margin: 0 }}>
              Un recorrido por la propuesta de estudio de Barkley: contenido, práctica y revisión. Sin entrar a cuentas privadas ni consultar datos de estudiantes.
            </p>
          </Reveal>
        </div>
      </section>

      <nav aria-label="Contenido del tour" style={{ maxWidth: 1000, margin: "0 auto", padding: "24px", display: "flex", flexWrap: "wrap", gap: 20 }}>
        <a href="#ejemplo-vortice" style={{ color: NAVY }}>Ver un ejemplo ilustrativo</a>
        <a href="#antes-de-elegir" style={{ color: NAVY }}>Qué confirmar antes de elegir</a>
        <a href="/guia-examenes-libres/" style={{ color: NAVY }}>Requisitos de Exámenes Libres</a>
      </nav>
      <section id="ejemplo-vortice" aria-labelledby="ejemplo-titulo" style={{ background: "#f7f9fb", padding: "48px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 id="ejemplo-titulo" style={{ color: NAVY }}>De la consigna a la comprensión: un ejemplo de recorrido</h2>
          <p><strong>Ejemplo ficticio e ilustrativo.</strong> No es una captura de una cuenta, una evaluación interna ni una pregunta oficial del MINEDUC. Describe una forma de revisar el aprendizaje, no reproduce una sesión real.</p>
          <ol style={{ paddingLeft: 24 }}>
            <li><h3>Identificar qué se busca aprender</h3><p>En este ejemplo, distinguir el precio de cada objeto del costo total de una compra.</p></li>
            <li><h3>Revisar una explicación</h3><p>Una compra de tres cuadernos del mismo precio más $600 de envío cuesta $4.200. La pregunta es cuánto vale un cuaderno, no cuánto costó el envío.</p></li>
            <li><h3>Practicar y explicar</h3><p>Si x es el precio de un cuaderno: 3x + 600 = 4.200. Restar el envío deja $3.600; dividir entre tres da $1.200 por cuaderno.</p></li>
            <li><h3>Comprobar y decidir qué repasar</h3><p>La comprobación es 3 × 1.200 + 600 = 4.200. Si falla la ecuación, revisar cómo se representa el problema; si falla la operación, practicar ese cálculo. Cambiar un dato ayuda a comprobar que no se memorizó solo la respuesta.</p></li>
          </ol>
          <p><strong>Práctica no es certificación.</strong> El resultado de una actividad ilustrativa no representa una nota oficial ni demuestra que se domina todo un nivel. Conoce <a href="/como-funciona-umbral/" style={{ color: NAVY }}>la explicación pública de Umbral</a> y <a href="/asi-esta-construido" style={{ color: NAVY }}>cómo se organiza una lección</a>.</p>
          <p>El mismo recorrido puede necesitar apoyos distintos: <a href="/adulto-acompanante" style={{ color: NAVY }}>acompañamiento en casa</a> y <a href="/neurodivergentes" style={{ color: NAVY }}>apoyos y límites para estudiantes neurodivergentes</a>.</p>
        </div>
      </section>

      {TOUR_SLIDES.map((slide, i) => (
        <section key={slide.title} style={{ padding: "70px 24px", background: i % 2 === 0 ? "#fff" : "#f7f9fb" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 44, alignItems: "center", flexDirection: i % 2 === 0 ? "row" : "row-reverse" }}>
            <div style={{ flex: "1 1 380px", minWidth: 280 }}>
              <Reveal>
                <span style={{ display: "inline-block", background: GOLD, color: NAVY, fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "5px 14px", marginBottom: 16 }}>
                  Paso {i + 1} de {TOUR_SLIDES.length}
                </span>
                <h2 style={{ fontSize: "clamp(22px,3.2vw,30px)", fontWeight: 700, color: NAVY, margin: "0 0 14px", lineHeight: 1.25 }}>{slide.title}</h2>
                <p style={{ fontSize: 16.5, color: TEXT, margin: 0 }}>{slide.text}</p>
              </Reveal>
            </div>
            <div style={{ flex: "1 1 380px", minWidth: 280 }}>
              <Reveal delay={0.1}>
                <img src={slide.img} alt={slide.title} loading="lazy" style={{ width: "100%", borderRadius: 16, display: "block", aspectRatio: "1280 / 820", objectFit: "cover", boxShadow: "0 20px 50px rgba(0,20,60,0.12)" }} />
              </Reveal>
            </div>
          </div>
        </section>
      ))}

      <section id="antes-de-elegir" style={{ padding: "48px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ color: NAVY }}>Qué confirmar antes de elegir la preparación</h2>
          <ul style={{ paddingLeft: 24 }}>
            <li>Qué contenidos y formatos están disponibles para el nivel que necesitas.</li>
            <li>Quién acompañará el estudio en casa y cómo se solicita ayuda.</li>
            <li>Qué información recibe la familia y qué apoyos concretos están disponibles.</li>
            <li>Cómo se separan la reserva de Barkley y la inscripción oficial ante el MINEDUC.</li>
          </ul>
          <nav aria-label="Preparación por etapa" style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            <a href="/examenes-libres-1-basico/" style={{ color: NAVY }}>1° básico: acompañamiento y lectura</a>
            <a href="/examenes-libres-8-basico/" style={{ color: NAVY }}>8° básico: explicar y comprobar</a>
            <a href="/preguntas-frecuentes" style={{ color: NAVY }}>Resolver preguntas de admisión</a>
          </nav>
        </div>
      </section>
      <section style={{ padding: "90px 24px", background: NAVY, textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(28px,4.5vw,44px)", fontWeight: 800, color: "#fff", margin: "0 0 18px", lineHeight: 1.2 }}>
              ¿Quieres consultar por tu nivel?
            </h2>
            <p style={{ fontSize: 17, color: "#cfe0f5", margin: "0 0 32px" }}>
              Reserva tu cupo — sin costo hoy, pagas recién en enero de 2027.
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

      </main>
      <footer style={{ background: NAVY, color: "rgba(255,255,255,0.75)", fontSize: 13, textAlign: "center", padding: "26px 24px" }}>
        <p style={{ margin: 0 }}>
          Barkley Online — Colegio 100% asincrónico e inclusivo en Chile ·{" "}
          <a href="/" style={{ color: GOLD, textDecoration: "none" }}>barkleyinstituto.cl</a>
        </p>
      </footer>
    </div>
  );
}
