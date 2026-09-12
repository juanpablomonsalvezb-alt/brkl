import { motion } from "framer-motion";

// Extraído de Home.tsx para code-splitting: sección de venta debajo del hero,
// no aporta al LCP pero sí pesaba en el bundle inicial. Igual que
// BarkleyTVSection, se carga vía React.lazy() desde Home.tsx.
const NAVY = "#003366";
const GOLD = "#FFC548";
const RED = "#FF3D37";
const TEXT = "#525252";
const BLOCK_BLUE = "#4a7be0";
const GREEN = "#00b273";
const PURPLE = "#861fce";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function AdultoAcompananteSection() {
  return (
    <section id="adulto-acompanante" style={{ background: "#fff", padding: "88px 24px", borderTop: "1px solid #eef1f5" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <Reveal>
          <p style={{ fontSize: 13, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px", textAlign: "center" }}>Para 1° a 6° básico</p>
          <h2 style={{ fontSize: "clamp(30px,4.5vw,48px)", fontWeight: 700, color: NAVY, margin: "0 auto 20px", lineHeight: 1.15, textAlign: "center", maxWidth: 780 }}>
            El <em style={{ fontStyle: "normal", color: "#b5892a" }}>Adulto Acompañante</em>: así lo hacen los colegios 100% online serios del mundo
          </h2>
          <p style={{ fontSize: 16, color: TEXT, lineHeight: 1.8, margin: "0 auto 48px", maxWidth: 720, textAlign: "center" }}>
            Ningún colegio online acreditado del mundo le pide autonomía total a un niño de 6 años. Todos usan el mismo mecanismo: contenido autoguiado por dominio + <strong style={{ color: NAVY }}>un adulto en casa con rol formal y horas definidas, que baja gradual con la edad</strong>. Así lo hacen tres referentes reales:
          </p>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 24, marginBottom: 56 }}>
          {[
            { nombre: "K12 / Stride", pais: "Estados Unidos", rol: "“Learning Coach”", detalle: "3 a 6 horas diarias en K-5: facilita lecciones, maneja materiales, registra avance.", color: BLOCK_BLUE },
            { nombre: "Laurel Springs", pais: "Estados Unidos · 100% asincrónico", rol: "“Learning Coach”", detalle: "2 a 3 horas diarias en K-5: da estructura, lee en voz alta, revisa y acompaña.", color: GREEN },
            { nombre: "Wolsey Hall Oxford", pais: "Reino Unido · desde 1894", rol: "“Parent-Guided Learning”", detalle: "En 4-7 años el apoderado es el educador principal, con planes de lección diarios ya listos.", color: PURPLE },
          ].map((c, i) => (
            <Reveal key={c.nombre} delay={i * 0.08}>
              <div style={{ background: "#f5f5f5", borderRadius: 20, padding: "32px 28px", height: "100%" }}>
                <span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 700, color: "#fff", background: c.color, padding: "5px 12px", borderRadius: 999, marginBottom: 16 }}>{c.pais}</span>
                <p style={{ fontSize: 20, fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>{c.nombre}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#b5892a", margin: "0 0 12px" }}>{c.rol}</p>
                <p style={{ fontSize: 14.5, color: TEXT, lineHeight: 1.65, margin: 0 }}>{c.detalle}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15}>
          <div style={{ background: NAVY, borderRadius: 24, padding: "44px 40px", color: "#fff" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Así lo hace Barkley</p>
            <h3 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 700, margin: "0 0 24px" }}>Mismo mecanismo, con horas que bajan gradual por ciclo</h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 16, marginBottom: 32 }}>
              {[
                { ciclo: "1° y 2° básico", horas: "4 a 5 h/día", detalle: "Adulto presente casi todo el estudio" },
                { ciclo: "3° y 4° básico", horas: "3 h/día", detalle: "Acompaña el inicio, luego supervisa" },
                { ciclo: "5° y 6° básico", horas: "2 h/día", detalle: "Revisa avances, resuelve dudas puntuales" },
                { ciclo: "7° a 4° medio", horas: "Autónomo", detalle: "Solo seguimiento vía Portal Familia" },
              ].map((c) => (
                <div key={c.ciclo} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px" }}>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>{c.ciclo}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: GOLD, margin: "0 0 4px" }}>{c.horas}</p>
                  <p style={{ fontSize: 13, opacity: 0.8, margin: 0, lineHeight: 1.4 }}>{c.detalle}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 28 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: GOLD, margin: "0 0 6px" }}>Rol con nombre</p>
                <p style={{ fontSize: 14.5, opacity: 0.88, lineHeight: 1.6, margin: 0 }}>Desde 1° básico, el apoderado es el <strong>Adulto Acompañante</strong>: quien está al lado durante el estudio, no quien enseña ni corrige — eso lo hace la plataforma.</p>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: GOLD, margin: "0 0 6px" }}>Baja gradual, no de golpe</p>
                <p style={{ fontSize: 14.5, opacity: 0.88, lineHeight: 1.6, margin: 0 }}>De acompañamiento casi total en 1°-2° a autonomía completa en media — igual que el tránsito que describen K12 y Laurel Springs en sus propios niveles.</p>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: GOLD, margin: "0 0 6px" }}>El colegio no desaparece</p>
                <p style={{ fontSize: 14.5, opacity: 0.88, lineHeight: 1.6, margin: 0 }}>Video + pódcast ya grabados, evaluación auto-corregida, Asesor humano que monitorea a distancia y Portal Familia con avance en tiempo real.</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
