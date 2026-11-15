/**
 * /por-que-barkley — los siete miedos de las familias chilenas, cuánto cuesta el colegio presencial y los cuatro motores.
 * Todo lo que se puede tocar (matriz, calculadora, tarjetas) guarda su estado con useState.
 * Las cifras nacionales viven en datos-miedos.ts, marcadas para que la dirección las respalde con fuente.
 */
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Clock, Compass, Heart, RotateCw, Wallet } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { CONTROLES_CALCULADORA, DIAS_LECTIVOS, MESES_LECTIVOS, MIEDOS, MOTORES, type LimitesCalculadora } from "@/components/paginas-confianza/datos-miedos";
import {
  C, FONT_DISPLAY, FONT_UI, Insignia, MicroCta, Numero, Pestanas, RENGLONES, Reveal, Seccion, TABULAR, idPanel, tarjeta, useIdCorto, usePageMeta,
} from "@/components/paginas-confianza/ui";

const BASE_MIEDOS = "miedos";
const ESTILO = `
  .pq-hero { display: grid; gap: 36px; grid-template-columns: 1fr; align-items: center; }
  .pq-tres { display: grid; gap: 14px; grid-template-columns: 1fr; }
  .pq-calc { display: grid; gap: 22px; grid-template-columns: 1fr; }
  .pq-motores { display: grid; gap: 16px; grid-template-columns: 1fr; }
  @media (min-width: 640px) { .pq-motores { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 900px) {
    .pq-hero { grid-template-columns: 1.1fr 0.9fr; }
    .pq-tres { grid-template-columns: 1fr 1fr 1fr; }
    .pq-calc { grid-template-columns: 1.1fr 0.9fr; }
    .pq-motores { grid-template-columns: repeat(4, 1fr); }
  }
  .pq-foco:focus-visible { outline: 3px solid ${C.indigo}; outline-offset: 3px; }
  .pq-rango { -webkit-appearance: none; appearance: none; width: 100%; height: 36px; background: transparent; cursor: pointer; }
  .pq-rango::-webkit-slider-runnable-track { height: 8px; border-radius: 999px; background: linear-gradient(90deg, var(--pq-fill, ${C.indigo}) var(--pq-p, 0%), ${C.paperDeep} var(--pq-p, 0%)); }
  .pq-rango::-moz-range-track { height: 8px; border-radius: 999px; background: ${C.paperDeep}; }
  .pq-rango::-moz-range-progress { height: 8px; border-radius: 999px; background: ${C.indigo}; }
  .pq-rango::-webkit-slider-thumb { -webkit-appearance: none; width: 26px; height: 26px; margin-top: -9px; border-radius: 50%; background: #fff; border: 3px solid ${C.indigo}; box-shadow: 0 2px 6px rgba(11,37,69,.3); }
  .pq-rango::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: #fff; border: 3px solid ${C.indigo}; }
  .pq-rango:focus-visible { outline: 3px solid ${C.indigo}; outline-offset: 2px; border-radius: 8px; }
  .pq-cara { backface-visibility: hidden; -webkit-backface-visibility: hidden; position: absolute; inset: 0; border-radius: 16px; padding: 22px; display: flex; flex-direction: column; }
  .pq-giro { transition: transform .6s cubic-bezier(.22,1,.36,1); transform-style: preserve-3d; position: relative; height: 100%; }
  @media (prefers-reduced-motion: reduce) { .pq-giro { transition: none !important; } }
`;

const clp = (n: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Math.round(n));
const num = (n: number, d = 0) => new Intl.NumberFormat("es-CL", { maximumFractionDigits: d }).format(n);

/* ───────────────────────── Hero ───────────────────────── */

function Hero() {
  return (
    <section style={{ background: `linear-gradient(180deg, ${C.navy} 0%, ${C.navyDeep} 100%)`, padding: "clamp(40px,6vw,72px) 20px clamp(56px,8vw,96px)" }}>
      <div className="pq-hero" style={{ maxWidth: 1120, margin: "0 auto" }}>
        <Reveal>
          <p style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.gold, margin: "0 0 16px" }}>
            Entendemos lo que sientes cada marzo
          </p>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(34px,5.6vw,58px)", fontWeight: 500, lineHeight: 1.07, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 20px", textWrap: "balance" as React.CSSProperties["textWrap"] }}>
            Tu hijo merece aprender sin miedo, sin vacíos y sin que tu familia pague de más.
          </h1>
          <p style={{ fontFamily: FONT_UI, fontSize: "clamp(16px,1.9vw,19px)", lineHeight: 1.65, color: "#cfe0f5", margin: "0 0 26px", maxWidth: 560 }}>
            Siete preocupaciones se repiten en las familias chilenas. Toca cada una, mira qué dice la realidad del país y cómo la resuelve Barkley. Después calcula cuánto te ahorrarías y cuánto tiempo recuperarías.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
            <Insignia tono="oscuro"><Heart size={16} aria-hidden /> Aprendizaje sin miedo</Insignia>
            <Insignia tono="oscuro"><Compass size={16} aria-hidden /> Cada hijo a su ritmo</Insignia>
            <Insignia tono="oscuro"><Wallet size={16} aria-hidden /> Sin gastos ocultos de marzo</Insignia>
          </div>
          <MicroCta href="#miedos" tono="oscuro">Empezar por mi preocupación</MicroCta>
        </Reveal>
        <Reveal delay={0.12}>
          <div style={{ background: C.paper, borderRadius: 18, padding: "26px clamp(20px,3vw,30px)", ...RENGLONES, boxShadow: "0 30px 70px rgba(0,0,0,0.35)" }}>
            <div style={{ fontFamily: FONT_UI, fontSize: 12.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textSoft, marginBottom: 10 }}>Lista de preocupaciones</div>
            <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {MIEDOS.map((m, i) => (
                <li key={m.id} style={{ display: "flex", gap: 12, alignItems: "baseline", minHeight: 32, fontFamily: FONT_UI, fontSize: 15, color: C.ink, fontWeight: 600 }}>
                  <span style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: C.indigo, width: 18, ...TABULAR }}>{i + 1}</span>
                  {m.corto}
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── 1. Matriz de los 7 miedos ───────────────────────── */

function Columna({ titulo, tono, children }: { titulo: string; tono: "papel" | "riesgo" | "esmeralda"; children: React.ReactNode }) {
  const est = tono === "esmeralda" ? { bg: C.emeraldSoft, bd: "#9ad9c0", ft: C.emerald } : tono === "riesgo" ? { bg: C.riskSoft, bd: "#f0c3b0", ft: C.risk } : { bg: C.white, bd: C.rule, ft: C.textSoft };
  return (
    <div style={{ background: est.bg, border: `1px solid ${est.bd}`, borderRadius: 16, padding: "20px 20px 22px" }}>
      <h4 style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: est.ft, margin: "0 0 12px" }}>{titulo}</h4>
      {children}
    </div>
  );
}

function MatrizMiedos() {
  const [id, setId] = useState(MIEDOS[0].id);
  const reducir = useReducedMotion();
  const m = MIEDOS.find((x) => x.id === id)!;
  const p = { fontFamily: FONT_UI, fontSize: 16, lineHeight: 1.65, color: C.text, margin: 0 } as const;
  return (
    <Seccion
      id="miedos" numero="01" etiqueta="Siete miedos, siete respuestas" titulo="Elige lo que más te preocupa"
      intro="Cada tarjeta se abre en tres partes: lo que muestra el país, lo que viven las familias y lo que hace Barkley al respecto."
    >
      <Reveal>
        <Pestanas
          etiquetaAria="Preocupaciones de las familias" base={BASE_MIEDOS}
          items={MIEDOS.map((x) => ({ id: x.id, etiqueta: x.corto }))} valor={id} onCambio={setId}
        />
        <div {...idPanel(BASE_MIEDOS, id)} className="pq-foco" style={{ marginTop: 18 }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(22px,3vw,30px)", fontWeight: 500, color: C.ink, margin: "0 0 16px", lineHeight: 1.2 }}>{m.titulo}</h3>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={m.id} className="pq-tres" aria-live="polite"
              initial={reducir ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reducir ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.28 }}
            >
              <Columna titulo="Realidad en Chile" tono="papel">
                {m.cifra && <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(44px,6vw,60px)", color: C.ink, lineHeight: 1, marginBottom: 8, ...TABULAR }}>{m.cifra}</div>}
                <p style={p}>{m.dato}</p>
              </Columna>
              <Columna titulo="Lo que sientes" tono="riesgo">
                <p style={{ ...p, marginBottom: 12 }}>{m.anguloA}</p>
                <p style={p}>{m.anguloB}</p>
              </Columna>
              <Columna titulo="Cómo lo resuelve Barkley" tono="esmeralda">
                <p style={{ ...p, color: C.ink, fontWeight: 500 }}>{m.solucion}</p>
                {m.motor && <p style={{ fontFamily: FONT_UI, fontSize: 13.5, fontWeight: 700, color: C.emerald, margin: "12px 0 0" }}>Motor: {m.motor}</p>}
              </Columna>
            </motion.div>
          </AnimatePresence>
        </div>
        <div style={{ marginTop: 26 }}><MicroCta href="/#consultas">Contarnos mi caso</MicroCta></div>
      </Reveal>
    </Seccion>
  );
}

/* ───────────────────────── 2. Calculadora ───────────────────────── */

function formatoValor(c: LimitesCalculadora, v: number) {
  return c.unidad === "horas-dia" ? `${num(v, 2)} h` : clp(v);
}

function Control({ c, valor, onCambio }: { c: LimitesCalculadora; valor: number; onCambio: (v: number) => void }) {
  const id = useIdCorto("calc");
  const pct = ((valor - c.min) / (c.max - c.min)) * 100;
  return (
    <div style={{ padding: "14px 0", borderBottom: `1px solid ${C.rule}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <label htmlFor={id} style={{ fontFamily: FONT_UI, fontSize: 15.5, fontWeight: 600, color: C.ink }}>
          {c.etiqueta} <span style={{ fontWeight: 500, color: C.textSoft, fontSize: 13 }}>· {c.ayuda}</span>
        </label>
        <output htmlFor={id} style={{ fontFamily: FONT_UI, fontWeight: 700, color: C.indigo, fontSize: 16, ...TABULAR }}>{formatoValor(c, valor)}</output>
      </div>
      <input
        id={id} type="range" className="pq-rango" min={c.min} max={c.max} step={c.paso} value={valor}
        onChange={(e) => onCambio(Number(e.target.value))} style={{ ["--pq-p" as string]: `${pct}%` }}
        aria-valuetext={formatoValor(c, valor)}
      />
    </div>
  );
}

function Calculadora() {
  const [v, setV] = useState<Record<LimitesCalculadora["id"], number>>(() => Object.fromEntries(CONTROLES_CALCULADORA.map((c) => [c.id, c.inicial])) as Record<LimitesCalculadora["id"], number>);
  const ahorro = v.furgon * MESES_LECTIVOS + v.uniformes + v.particulares * MESES_LECTIVOS;
  const horas = v.traslado * DIAS_LECTIVOS;
  return (
    <Seccion
      id="calculadora" numero="02" etiqueta="Tu propio cálculo" fondo="papel" titulo="Cuánto te cuesta hoy el colegio presencial"
      intro="Mueve cada control hasta tu gasto real. El resultado se actualiza al instante y todos los supuestos están a la vista."
    >
      <Reveal>
        <div className="pq-calc">
          <div style={{ ...tarjeta, padding: "8px clamp(18px,3vw,28px) 14px" }}>
            {CONTROLES_CALCULADORA.map((c) => <Control key={c.id} c={c} valor={v[c.id]} onCambio={(x) => setV((s) => ({ ...s, [c.id]: x }))} />)}
          </div>
          <div style={{ background: C.ink, borderRadius: 16, padding: "clamp(22px,3vw,32px)", color: "#fff", display: "flex", flexDirection: "column", gap: 22 }} aria-live="polite">
            <div>
              <div style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.gold, display: "flex", gap: 8, alignItems: "center" }}><Wallet size={16} aria-hidden /> Ahorro anual estimado</div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(38px,6vw,56px)", lineHeight: 1.05, marginTop: 6, ...TABULAR }}><Numero valor={ahorro} formato={clp} /></div>
            </div>
            <div>
              <div style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.gold, display: "flex", gap: 8, alignItems: "center" }}><Clock size={16} aria-hidden /> Tiempo recuperado</div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(34px,5vw,48px)", lineHeight: 1.05, marginTop: 6, ...TABULAR }}>
                +<Numero valor={horas} formato={(n) => num(n)} /> horas libres al año
              </div>
            </div>
            <p style={{ fontFamily: FONT_UI, fontSize: 13, lineHeight: 1.6, color: "#b8cbe3", margin: 0 }}>
              Cálculo: furgón y particulares × {MESES_LECTIVOS} meses lectivos, más uniformes y útiles de un año, y horas de traslado × {DIAS_LECTIVOS} días de clases.
              Es un ahorro bruto: no descuenta la mensualidad de Barkley.
            </p>
            <MicroCta href="/#inscripcion" tono="oscuro">Quiero ese tiempo y ese ahorro</MicroCta>
          </div>
        </div>
      </Reveal>
    </Seccion>
  );
}

/* ───────────────────────── 3. Motores (tarjetas que giran) ───────────────────────── */

function TarjetaMotor({ nombre, lema, descripcion }: { nombre: string; lema: string; descripcion: string }) {
  const [vuelta, setVuelta] = useState(false);
  return (
    <button
      type="button" aria-pressed={vuelta} onClick={() => setVuelta((x) => !x)} className="pq-foco"
      aria-label={`${nombre}: ${lema}. ${vuelta ? "Mostrando el detalle." : "Toca para ver el detalle."}`}
      style={{ perspective: 1000, height: 250, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", borderRadius: 16 }}
    >
      <div className="pq-giro" style={{ transform: vuelta ? "rotateY(180deg)" : "none" }}>
        <div className="pq-cara" aria-hidden={vuelta} style={{ background: C.white, border: `1px solid ${C.rule}`, justifyContent: "space-between" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 500, color: C.ink, lineHeight: 1.1 }}>{nombre}</div>
          <div>
            <div style={{ fontFamily: FONT_UI, fontSize: 16, fontWeight: 700, color: C.emerald, marginBottom: 14 }}>{lema}</div>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center", fontFamily: FONT_UI, fontSize: 13.5, fontWeight: 600, color: C.indigo }}><RotateCw size={15} aria-hidden /> Toca para ver el detalle</span>
          </div>
        </div>
        <div className="pq-cara" aria-hidden={!vuelta} style={{ background: C.indigo, color: "#fff", transform: "rotateY(180deg)", justifyContent: "center" }}>
          <div style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.gold, marginBottom: 10 }}>{nombre}</div>
          <p style={{ fontFamily: FONT_UI, fontSize: 15.5, lineHeight: 1.6, margin: 0 }}>{descripcion}</p>
        </div>
      </div>
    </button>
  );
}

function Motores() {
  return (
    <Seccion
      id="motores" numero="03" etiqueta="Lo que hay detrás" titulo="Cuatro motores que trabajan por tu hijo"
      intro="Cada uno responde a una de las preocupaciones anteriores. Toca una tarjeta para darla vuelta."
    >
      <Reveal>
        <div className="pq-motores">{MOTORES.map((m) => <TarjetaMotor key={m.id} nombre={m.nombre} lema={m.lema} descripcion={m.descripcion} />)}</div>
        <div style={{ marginTop: 28 }}><MicroCta href="/examenes-libres-y-resultados">Ver resultados y temarios</MicroCta></div>
      </Reveal>
    </Seccion>
  );
}

function Cierre() {
  return (
    <section style={{ background: C.navy, padding: "clamp(60px,8vw,96px) 20px", textAlign: "center" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <Reveal>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px,4.6vw,46px)", fontWeight: 500, color: "#fff", margin: "0 0 16px", lineHeight: 1.12, textWrap: "balance" as React.CSSProperties["textWrap"] }}>
            Este marzo, que lo único que pese en la mochila sea lo que se aprende.
          </h2>
          <p style={{ fontFamily: FONT_UI, fontSize: 17, color: "#cfe0f5", margin: "0 0 30px", lineHeight: 1.6 }}>Inscribe a tu hijo hoy o escríbenos si prefieres conversar primero.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <MicroCta href="/#inscripcion" tono="oscuro">Inscribirme</MicroCta>
            <a href="/#consultas" style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 15, color: "#fff", textDecoration: "underline", textUnderlineOffset: 4, display: "inline-flex", alignItems: "center", minHeight: 46 }}>Tengo una consulta</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function PorQueBarkley() {
  usePageMeta(
    "Por qué Barkley: sin bullying, sin vacíos y sin gastos ocultos",
    "Los siete miedos de las familias chilenas, cómo los resuelve Barkley y una calculadora de ahorro y tiempo recuperado frente al colegio presencial.",
    "/por-que-barkley",
  );
  return (
    <div style={{ background: C.paper, color: C.text, fontFamily: FONT_UI, overflowX: "hidden" }}>
      <style>{ESTILO}</style>
      <SiteHeader overlay={false} />
      <main>
        <Hero />
        <MatrizMiedos />
        <Calculadora />
        <Motores />
        <Cierre />
      </main>
    </div>
  );
}
