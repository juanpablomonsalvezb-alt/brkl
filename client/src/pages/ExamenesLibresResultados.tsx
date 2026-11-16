/**
 * /examenes-libres-y-resultados — alineación con el MINEDUC, temarios de Exámenes Libres y resultados 2023–2025.
 *
 * Responde dos preguntas del apoderado: «¿qué tan apegado es el contenido al temario oficial?» y
 * «¿qué resultados tienen?». Cada idea es un componente que se puede tocar (nada de muros de texto).
 * Las cifras que debe respaldar la dirección están marcadas en datos-examenes.ts.
 */
import { Check, ChevronLeft, ChevronRight, CircleHelp, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import {
  COLCHON, ESCENARIOS, EXIGENCIA_MINEDUC, EXIGENCIA_UMBRAL, FASES, NIVELES_TEMARIO, PROMEDIO_APROBACION, RESULTADOS, pct1, type Escenario,
} from "@/components/paginas-confianza/datos-examenes";
import {
  C, FONT_DISPLAY, FONT_UI, Insignia, MicroCta, Pestanas, RENGLONES, Reveal, Seccion, TABULAR, idPanel, tarjeta, useEnVista, usePageMeta,
} from "@/components/paginas-confianza/ui";

const BASE_NIVELES = "niveles";
const ESTILO_RESPONSIVO = `
  .bk-hero-grid { display: grid; gap: 40px; grid-template-columns: 1fr; align-items: center; }
  .bk-doble { display: grid; gap: 22px; grid-template-columns: 1fr; }
  .bk-fases-rail { display: grid; gap: 10px; grid-template-columns: 1fr; }
  @media (min-width: 860px) {
    .bk-hero-grid { grid-template-columns: 1.15fr 0.85fr; }
    .bk-doble { grid-template-columns: 1fr 1fr; }
    .bk-fases-rail { grid-template-columns: repeat(4, 1fr); }
  }
  .bk-anim { transition: width .7s cubic-bezier(.22,1,.36,1), left .7s cubic-bezier(.22,1,.36,1), opacity .4s; }
  @media (prefers-reduced-motion: reduce) { .bk-anim { transition: none !important; } }
  .bk-foco:focus-visible { outline: 3px solid ${C.indigo}; outline-offset: 3px; }
`;

/* ───────────────────────── Hero ───────────────────────── */

function Acta() {
  return (
    <div
      role="group" aria-label="Acta de resultados: aprobación de inscritos en Exámenes Libres, 2023 a 2025"
      style={{ background: C.paper, borderRadius: 18, padding: "clamp(22px,3vw,32px)", ...RENGLONES, boxShadow: "0 30px 70px rgba(0,0,0,0.35)" }}
    >
      <div style={{ fontFamily: FONT_UI, fontSize: 12.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textSoft, marginBottom: 6 }}>
        Acta de resultados · Exámenes Libres
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, color: C.ink, lineHeight: 0.92, display: "flex", alignItems: "flex-start", gap: 4 }}>
        <span style={{ fontSize: "clamp(96px,16vw,148px)", fontWeight: 500, letterSpacing: "-0.04em", ...TABULAR }}>{PROMEDIO_APROBACION}</span>
        <span style={{ fontSize: "clamp(40px,6vw,56px)", marginTop: 14, color: C.emerald }}>%</span>
      </div>
      <p style={{ fontFamily: FONT_UI, fontSize: 14.5, color: C.text, margin: "6px 0 18px", lineHeight: 1.5 }}>de los inscritos aprueba sus Exámenes Libres (promedio 2023–2025).</p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: `1px solid ${C.ink}` }}>
        {RESULTADOS.map((r) => (
          <li key={r.anio} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 2px", borderBottom: `1px solid ${C.rule}`, fontFamily: FONT_UI }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.ink, ...TABULAR }}>Año {r.anio}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, color: C.emerald, ...TABULAR }}>
              {pct1(r.valor)} % <Check size={18} aria-hidden />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Hero() {
  return (
    <section style={{ background: `linear-gradient(180deg, ${C.navy} 0%, ${C.navyDeep} 100%)`, padding: "clamp(40px,6vw,72px) 20px clamp(56px,8vw,96px)" }}>
      <div className="bk-hero-grid" style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div>
          <Reveal>
            <p style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.gold, margin: "0 0 16px" }}>
              Aprobar con tranquilidad es consecuencia de entrenar con un estándar superior
            </p>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(27px,4.5vw,48px)", fontWeight: 500, lineHeight: 1.08, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 20px", textWrap: "balance" as React.CSSProperties["textWrap"] }}>
              92 % de aprobación promedio en Exámenes Libres (2023–2025) y contenidos 100 % alineados a los temarios del MINEDUC.
            </h1>
            <p style={{ fontFamily: FONT_UI, fontSize: "clamp(16px,1.9vw,19px)", lineHeight: 1.65, color: "#cfe0f5", margin: "0 0 26px", maxWidth: 560 }}>
              Del total de estudiantes que se inscriben en Barkley, un <strong style={{ color: "#fff" }}>92 % promedio aprueba sus Exámenes Libres</strong> ({pct1(RESULTADOS[0].valor)} % en 2023, {pct1(RESULTADOS[1].valor)} % en 2024 y {pct1(RESULTADOS[2].valor)} % en 2025).
              ¿El secreto? Mientras el Ministerio pide un <strong style={{ color: "#fff" }}>{EXIGENCIA_MINEDUC} % de exigencia</strong> para aprobar el examen final, nuestro sistema <strong style={{ color: "#fff" }}>Umbral™</strong> requiere un <strong style={{ color: "#fff" }}>{EXIGENCIA_UMBRAL} % de exigencia</strong> en cada actividad y evaluación formativa interna para avanzar de contenido.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
              <Insignia tono="oscuro"><ShieldCheck size={16} aria-hidden /> 92 % aprobación promedio (2023–2025)</Insignia>
              <Insignia tono="oscuro"><ShieldCheck size={16} aria-hidden /> Exigencia Umbral™: {EXIGENCIA_UMBRAL} % vs. {EXIGENCIA_MINEDUC} % MINEDUC</Insignia>
              <Insignia tono="oscuro"><ShieldCheck size={16} aria-hidden /> 100 % temarios oficiales MINEDUC</Insignia>
            </div>
            <MicroCta href="/#inscripcion" tono="oscuro">Quiero inscribir a mi hijo</MicroCta>
          </Reveal>
        </div>
        <Reveal delay={0.12}><Acta /></Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── 1. Panel dual: resultado y causa ───────────────────────── */

function Historico() {
  const [sel, setSel] = useState<number>(RESULTADOS.length - 1);
  const { ref, visto } = useEnVista<HTMLDivElement>();
  const r = RESULTADOS[sel];
  const ALTO = 190;
  return (
    <div ref={ref} style={{ ...tarjeta }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 500, color: C.ink, margin: "0 0 4px" }}>El resultado</h3>
      <p style={{ fontFamily: FONT_UI, fontSize: 14, color: C.textSoft, margin: "0 0 16px" }}>Porcentaje de inscritos que aprobó sus Exámenes Libres. Toca una barra.</p>
      <div role="group" aria-label="Aprobación por año" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: 12, height: ALTO + 54, borderBottom: `1px solid ${C.ink}` }}>
        {RESULTADOS.map((x, i) => {
          const activo = i === sel;
          return (
            <button
              key={x.anio} type="button" onClick={() => setSel(i)} onMouseEnter={() => setSel(i)} onFocus={() => setSel(i)} aria-pressed={activo} className="bk-foco"
              aria-label={`${x.anio}: ${pct1(x.valor)} % de aprobados`}
              style={{ flex: 1, maxWidth: 110, background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}
            >
              <span style={{ fontFamily: FONT_UI, fontSize: 15, fontWeight: 700, color: activo ? C.emerald : C.textSoft, marginBottom: 6, ...TABULAR }}>{pct1(x.valor)} %</span>
              <span className="bk-anim" style={{ display: "block", width: "100%", height: visto ? (x.valor / 100) * ALTO : 0, background: activo ? `linear-gradient(180deg, #17b183, ${C.emerald})` : C.paperDeep, borderRadius: "8px 8px 0 0", border: `1px solid ${activo ? C.emerald : C.rule}`, borderBottom: "none" }} />
              <span style={{ fontFamily: FONT_UI, fontSize: 14, fontWeight: 700, color: C.ink, padding: "8px 0", ...TABULAR }}>{x.anio}</span>
            </button>
          );
        })}
      </div>
      <p aria-live="polite" style={{ fontFamily: FONT_UI, fontSize: 15.5, lineHeight: 1.55, color: C.text, margin: "14px 0 6px" }}>
        En <strong style={{ color: C.ink }}>{r.anio}</strong> aprobó el <strong style={{ color: C.emerald }}>{pct1(r.valor)} %</strong> de los inscritos.
      </p>
      <p style={{ fontFamily: FONT_UI, fontSize: 14.5, fontWeight: 700, color: C.ink, margin: 0 }}>Promedio del trienio: {PROMEDIO_APROBACION} % (92,2 % exacto)</p>
    </div>
  );
}

function Pista({ id }: { id: Escenario["id"] }) {
  // Escala de exigencia 0–100 %: meta oficial (60) y, solo en Barkley, el estándar interno (70) con su colchón.
  const barkley = id === "barkley";
  const marca = (left: number, txt: string, color: string, top: number, dash = false) => (
    <div aria-hidden style={{ position: "absolute", left: `${left}%`, top, bottom: 26, borderLeft: `2px ${dash ? "dashed" : "solid"} ${color}`, zIndex: 2 }}>
      <span style={{ position: "absolute", top: -2, left: 6, whiteSpace: "nowrap", fontFamily: FONT_UI, fontSize: 11.5, fontWeight: 700, color, background: C.white, padding: "0 4px" }}>{txt}</span>
    </div>
  );
  return (
    <div style={{ position: "relative", height: 150 }}>
      <div style={{ position: "absolute", inset: "0 0 26px 0" }}>
        {marca(EXIGENCIA_MINEDUC, `MINEDUC ${EXIGENCIA_MINEDUC} %`, C.ink, 0, true)}
        {barkley && marca(EXIGENCIA_UMBRAL, `Umbral™ ${EXIGENCIA_UMBRAL} %`, C.emerald, 26)}
        <div className="bk-anim" style={{ position: "absolute", top: 62, left: 0, height: 34, width: barkley ? `${EXIGENCIA_UMBRAL}%` : "100%", borderRadius: barkley ? "0 8px 8px 0" : 8, background: barkley ? `linear-gradient(90deg, ${C.emerald}, #17b183)` : `repeating-linear-gradient(135deg, ${C.riskSoft}, ${C.riskSoft} 8px, #fff 8px, #fff 16px)`, border: barkley ? "none" : `2px dashed ${C.risk}`, display: "flex", alignItems: "center", justifyContent: barkley ? "flex-end" : "center", paddingRight: barkley ? 10 : 0, gap: 8 }}>
          {barkley ? <span style={{ fontFamily: FONT_UI, fontSize: 12.5, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", ...TABULAR }}>+{COLCHON} puntos de colchón</span>
            : <><CircleHelp size={18} color={C.risk} aria-hidden /><span style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, color: C.risk }}>Sin exigencia por contenido</span></>}
        </div>
      </div>
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 24, borderTop: `1px solid ${C.ink}` }}>
        {[0, 20, 40, 60, 80, 100].map((t) => (
          <span key={t} style={{ position: "absolute", left: `${t}%`, transform: t === 0 ? "none" : t === 100 ? "translateX(-100%)" : "translateX(-50%)", top: 5, fontFamily: FONT_UI, fontSize: 11.5, color: C.textSoft, ...TABULAR }}>{t} %</span>
        ))}
      </div>
    </div>
  );
}

function Simulador() {
  const [id, setId] = useState<Escenario["id"]>("barkley");
  const e = ESCENARIOS.find((x) => x.id === id)!;
  const fila = { fontFamily: FONT_UI, fontSize: 15, lineHeight: 1.6, color: C.text, margin: "0 0 10px" } as const;
  const rot = { color: C.ink, fontWeight: 700 } as const;
  return (
    <div style={{ ...tarjeta }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 500, color: C.ink, margin: "0 0 4px" }}>La causa pedagógica</h3>
      <p style={{ fontFamily: FONT_UI, fontSize: 14, color: C.textSoft, margin: "0 0 14px" }}>¿Por qué aprueba el 92 %? Cambia de modelo y mira la exigencia.</p>
      <Pestanas
        etiquetaAria="Modelos educativos" base="escenarios" tono="blanco"
        items={ESCENARIOS.map((x) => ({ id: x.id, etiqueta: x.etiqueta, detalle: x.subetiqueta }))}
        valor={id} onCambio={(v) => setId(v as Escenario["id"])}
      />
      <div style={{ marginTop: 14 }}><Pista id={id} /></div>
      <div style={{ marginTop: 10 }} aria-live="polite">
        <p style={fila}><span style={rot}>Cómo funciona: </span>{e.funciona}</p>
        {e.impacto && <p style={fila}><span style={rot}>Impacto en el aprendizaje: </span>{e.impacto}</p>}
        <p style={{ ...fila, margin: 0, ...(id === "barkley" ? { fontFamily: FONT_DISPLAY, fontSize: 18, color: C.ink, paddingLeft: 14, borderLeft: `3px solid ${C.emerald}` } : {}) }}>
          <span style={id === "barkley" ? { fontWeight: 700 } : rot}>En octubre: </span>{e.octubre}
        </p>
      </div>
    </div>
  );
}

function Escaner() {
  return (
    <Seccion
      id="escaner" numero="01" etiqueta="Resultado y causa" titulo={`El Ministerio pide ${EXIGENCIA_MINEDUC} %. Barkley entrena todo el año al ${EXIGENCIA_UMBRAL} %.`}
      intro={`Dos métricas distintas: cuántos inscritos aprueban (el resultado) y cuánta exigencia se practica durante el año (la causa). Ese colchón de +${COLCHON} puntos es lo que explica el resultado.`}
    >
      <Reveal>
        <div className="bk-doble"><Historico /><Simulador /></div>
        <div style={{ marginTop: 28 }}><MicroCta href="/#inscripcion">Inscribir a mi hijo</MicroCta></div>
      </Reveal>
    </Seccion>
  );
}

/* ───────────────────────── 2. Explorador de temarios ───────────────────────── */

function Explorador() {
  const [id, setId] = useState(NIVELES_TEMARIO[1].id);
  const nivel = NIVELES_TEMARIO.find((n) => n.id === id)!;
  return (
    <Seccion
      id="temarios" numero="02" etiqueta="Apego curricular" fondo="papel" titulo="Qué evalúa el MINEDUC en tu curso, y cómo lo cubre Barkley"
      intro="Elige el ciclo. Barkley se concentra en lo que sí evalúa el Examen Libre (Validación de Estudios del MINEDUC)."
    >
      <Reveal>
        <Pestanas
          etiquetaAria="Nivel escolar" base={BASE_NIVELES} scroll={false}
          items={NIVELES_TEMARIO.map((n) => ({ id: n.id, etiqueta: n.etiqueta, detalle: n.detalle }))} valor={id} onCambio={setId}
        />
        <div {...idPanel(BASE_NIVELES, id)} className="bk-doble bk-foco" style={{ marginTop: 18 }}>
          <div style={{ ...tarjeta }}>
            <h3 style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.textSoft, margin: "0 0 14px" }}>Asignaturas oficiales evaluadas</h3>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {nivel.asignaturas.map((a) => (
                <li key={a} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontFamily: FONT_UI, fontSize: 16, color: C.ink, fontWeight: 600, padding: "10px 12px", background: C.paper, borderRadius: 10, border: `1px solid ${C.rule}` }}>
                  <Check size={18} color={C.emerald} aria-hidden style={{ flex: "0 0 auto", marginTop: 2 }} /> {a}
                </li>
              ))}
            </ul>
            {nivel.nota && <p style={{ fontFamily: FONT_UI, fontSize: 14, color: C.indigo, fontWeight: 600, margin: "14px 0 0" }}>{nivel.nota}</p>}
          </div>
          <div style={{ ...tarjeta, background: C.ink, border: "none" }}>
            <h3 style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.gold, margin: "0 0 14px" }}>Cómo lo aborda Barkley</h3>
            <p style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(19px,2.4vw,23px)", lineHeight: 1.5, color: "#fff", margin: 0 }}>{nivel.barkley}</p>
          </div>
        </div>
        <div style={{ marginTop: 26 }}><MicroCta href="/#consultas">Preguntar por el temario de mi curso</MicroCta></div>
      </Reveal>
    </Seccion>
  );
}

/* ───────────────────────── 3. Ruta de blindaje en 4 fases ───────────────────────── */

function RutaFases() {
  const [i, setI] = useState(0);
  const fase = FASES[i];
  return (
    <Seccion
      id="ruta" numero="03" etiqueta="Del temario al examen" titulo="Cuatro pasos hasta el día del examen"
      intro="Cuatro pasos que acompañan al alumno todo el año, desde el temario oficial hasta el día del examen."
    >
      <Reveal>
        <ol className="bk-fases-rail" style={{ listStyle: "none", margin: 0, padding: 0, counterReset: "fase" }}>
          {FASES.map((f, k) => {
            const hecho = k < i, activo = k === i;
            return (
              <li key={f.id}>
                <button
                  type="button" aria-current={activo ? "step" : undefined} onClick={() => setI(k)} className="bk-foco"
                  style={{
                    width: "100%", textAlign: "left", cursor: "pointer", fontFamily: FONT_UI, minHeight: 92, padding: "14px 16px", borderRadius: 14,
                    background: activo ? C.indigo : hecho ? C.emeraldSoft : C.white, color: activo ? "#fff" : C.ink,
                    border: `1px solid ${activo ? C.indigo : hecho ? "#9ad9c0" : C.rule}`, transition: "background .25s, border-color .25s",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, background: activo ? "#fff" : hecho ? C.emerald : C.paperDeep, color: activo ? C.indigo : hecho ? "#fff" : C.ink, ...TABULAR }}>
                      {hecho ? <Check size={16} aria-hidden /> : f.numero}
                    </span>
                    
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, display: "block" }}>{f.titulo}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div role="region" aria-live="polite" aria-label={`Paso ${fase.numero}: ${fase.titulo}`} style={{ ...tarjeta, marginTop: 14, display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 320px" }}>
            <div style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, color: C.indigo, marginBottom: 6 }}>Paso {fase.numero} de {FASES.length}</div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(22px,3vw,30px)", fontWeight: 500, color: C.ink, margin: "0 0 10px", lineHeight: 1.2 }}>{fase.titulo}</h3>
            <p style={{ fontFamily: FONT_UI, fontSize: 16.5, lineHeight: 1.65, color: C.text, margin: 0 }}>{fase.texto}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} aria-label="Paso anterior" className="bk-foco"
              style={{ width: 46, height: 46, borderRadius: 10, border: `1px solid ${C.rule}`, background: C.white, cursor: i === 0 ? "not-allowed" : "pointer", opacity: i === 0 ? 0.4 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button type="button" onClick={() => setI(Math.min(FASES.length - 1, i + 1))} disabled={i === FASES.length - 1} aria-label="Paso siguiente" className="bk-foco"
              style={{ width: 46, height: 46, borderRadius: 10, border: `1px solid ${C.indigo}`, background: C.indigo, color: "#fff", cursor: i === FASES.length - 1 ? "not-allowed" : "pointer", opacity: i === FASES.length - 1 ? 0.4 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
        </div>
        <div style={{ marginTop: 26 }}><MicroCta href="/#inscripcion">Inscribir a mi hijo</MicroCta></div>
      </Reveal>
    </Seccion>
  );
}

/* ───────────────────────── Cierre ───────────────────────── */

function CierreCta() {
  return (
    <section style={{ background: C.navy, padding: "clamp(60px,8vw,96px) 20px", textAlign: "center" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <Reveal>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px,4.6vw,46px)", fontWeight: 500, color: "#fff", margin: "0 0 16px", lineHeight: 1.12, textWrap: "balance" as React.CSSProperties["textWrap"] }}>
            Que tu hijo llegue al examen sabiendo, no esperando.
          </h2>
          <p style={{ fontFamily: FONT_UI, fontSize: 17, color: "#cfe0f5", margin: "0 0 30px", lineHeight: 1.6 }}>
            Inscríbete sin compromiso y sin costo hoy, o escríbenos si prefieres resolver una duda antes.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <MicroCta href="/#inscripcion" tono="oscuro">Inscribirme</MicroCta>
            <a href="/#consultas" style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 15, color: "#fff", textDecoration: "underline", textUnderlineOffset: 4, display: "inline-flex", alignItems: "center", minHeight: 46 }}>Tengo una consulta</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function ExamenesLibresResultados() {
  usePageMeta(
    "Exámenes Libres: 92 % de aprobación y temarios MINEDUC | Barkley",
    "92 % de aprobación promedio en Exámenes Libres (2023–2025), exigencia Umbral™ del 70 % frente al 60 % del MINEDUC y apego a los temarios oficiales por ciclo.",
    "/examenes-libres-y-resultados",
  );
  return (
    <div style={{ background: C.paper, color: C.text, fontFamily: FONT_UI, overflowX: "hidden" }}>
      <style>{ESTILO_RESPONSIVO}</style>
      <SiteHeader overlay={false} />
      <main>
        <Hero />
        <Escaner />
        <Explorador />
        <RutaFases />
        <CierreCta />
      </main>
    </div>
  );
}
