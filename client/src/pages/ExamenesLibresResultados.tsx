/**
 * /examenes-libres-y-resultados — alineación con el MINEDUC, temarios de Exámenes Libres y resultados 2023–2025.
 *
 * Responde dos preguntas del apoderado: «¿qué tan apegado es el contenido al temario oficial?» y
 * «¿qué resultados tienen?». Cada idea es un componente que se puede tocar (nada de muros de texto).
 * Las cifras que debe respaldar la dirección están marcadas en datos-examenes.ts.
 */
import { Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import {
  ANIOS_RESULTADOS, APROBACION_MINIMA, COMPRENSION_ZOOM, CONTEXTO_EXAMINADOR, DOMINIO_UMBRAL, ESCENARIOS, EXIGENCIA_MINEDUC, FASES, NIVELES_TEMARIO,
  TARJETAS_TRANSPARENCIA, type Escenario,
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
      role="group"
      aria-label="Acta de resultados: aprobación en Exámenes Libres, cohortes 2023, 2024 y 2025"
      style={{ background: C.paper, borderRadius: 18, padding: "clamp(22px,3vw,32px)", ...RENGLONES, boxShadow: "0 30px 70px rgba(0,0,0,0.35)" }}
    >
      <div style={{ fontFamily: FONT_UI, fontSize: 12.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textSoft, marginBottom: 6 }}>
        Acta de resultados · Exámenes Libres
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, color: C.ink, lineHeight: 0.92, display: "flex", alignItems: "flex-start", gap: 4 }}>
        <span style={{ fontSize: "clamp(40px,6vw,56px)", marginTop: 14, fontStyle: "italic", color: C.emerald }}>&gt;</span>
        <span style={{ fontSize: "clamp(96px,16vw,148px)", fontWeight: 500, letterSpacing: "-0.04em", ...TABULAR }}>{APROBACION_MINIMA}</span>
        <span style={{ fontSize: "clamp(40px,6vw,56px)", marginTop: 14, color: C.emerald }}>%</span>
      </div>
      <p style={{ fontFamily: FONT_UI, fontSize: 14.5, color: C.text, margin: "6px 0 18px", lineHeight: 1.5 }}>de aprobación en cada una de las tres últimas temporadas.</p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: `1px solid ${C.ink}` }}>
        {ANIOS_RESULTADOS.map((a) => (
          <li key={a} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 2px", borderBottom: `1px solid ${C.rule}`, fontFamily: FONT_UI }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.ink, ...TABULAR }}>Cohorte {a}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, color: C.emerald, ...TABULAR }}>
              &gt; {APROBACION_MINIMA} % <Check size={18} aria-hidden />
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
              Aprobar con excelencia no es suerte: es ingeniería pedagógica
            </p>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(34px,5.6vw,60px)", fontWeight: 500, lineHeight: 1.06, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 20px", textWrap: "balance" as React.CSSProperties["textWrap"] }}>
              Más de un 92 % de aprobación en Exámenes Libres (2023–2024–2025). 100 % alineado a los temarios oficiales del MINEDUC.
            </h1>
            <p style={{ fontFamily: FONT_UI, fontSize: "clamp(16px,1.9vw,19px)", lineHeight: 1.65, color: "#cfe0f5", margin: "0 0 26px", maxWidth: 560 }}>
              Durante tres años consecutivos (2023, 2024 y 2025) nuestra tasa de aprobación ha superado sostenidamente el 92 %. Mientras los colegios tradicionales avanzan aunque el alumno quede con dudas,
              nuestro sistema <strong style={{ color: "#fff" }}>Umbral™</strong> asegura que tu hijo llegue al Examen Libre dominando entre el 80 % y el 100 % de cada objetivo oficial, cuando el Ministerio exige un 60 % para aprobar.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
              <Insignia tono="oscuro"><ShieldCheck size={16} aria-hidden /> &gt; 92 % de aprobación histórica 2023-2024-2025</Insignia>
              <Insignia tono="oscuro"><ShieldCheck size={16} aria-hidden /> 100 % temarios oficiales MINEDUC</Insignia>
              <Insignia tono="oscuro"><ShieldCheck size={16} aria-hidden /> Estándar de dominio Umbral™ ≥ 80 %</Insignia>
            </div>
            <MicroCta href="/#inscripcion" tono="oscuro">Quiero inscribir a mi hijo</MicroCta>
          </Reveal>
        </div>
        <Reveal delay={0.12}><Acta /></Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── 1. Escáner de exigencia ───────────────────────── */

const pct = (n: number) => `${n}%`;

function Regla({ children }: { children: React.ReactNode }) {
  // Pista graduada de 0 a 100 % con la exigencia oficial punteada.
  return (
    <div style={{ position: "relative", height: 168 }}>
      <div style={{ position: "absolute", inset: "0 0 26px 0" }}>{children}</div>
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 24, borderTop: `1px solid ${C.ink}` }}>
        {[0, 20, 40, 60, 80, 100].map((t) => (
          <span key={t} style={{ position: "absolute", left: pct(t), transform: t === 0 ? "none" : t === 100 ? "translateX(-100%)" : "translateX(-50%)", top: 5, fontFamily: FONT_UI, fontSize: 11.5, color: C.textSoft, ...TABULAR }}>
            {t} %
          </span>
        ))}
      </div>
      <div
        aria-hidden
        style={{ position: "absolute", left: pct(EXIGENCIA_MINEDUC), top: 0, bottom: 26, borderLeft: `2px dashed ${C.ink}`, zIndex: 2 }}
      >
        <span style={{ position: "absolute", top: -2, left: 8, whiteSpace: "nowrap", fontFamily: FONT_UI, fontSize: 11.5, fontWeight: 700, color: C.ink, background: C.white, padding: "0 4px" }}>
          Exigencia MINEDUC (nota 4,0): {EXIGENCIA_MINEDUC} %
        </span>
      </div>
    </div>
  );
}

function Historico() {
  const { ref, visto } = useEnVista<HTMLDivElement>();
  return (
    <div ref={ref} style={{ ...tarjeta }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 500, color: C.ink, margin: "0 0 4px" }}>Resultados históricos</h3>
      <p style={{ fontFamily: FONT_UI, fontSize: 14, color: C.textSoft, margin: "0 0 18px" }}>Tasa de aprobación en Exámenes Libres, por cohorte. La barra marca el mínimo informado.</p>
      <Regla>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", height: "100%", paddingTop: 22 }}>
          {ANIOS_RESULTADOS.map((a, i) => (
            <div key={a} style={{ position: "relative", height: 28 }}>
              <div
                className="bk-anim"
                style={{ width: visto ? pct(APROBACION_MINIMA) : "0%", height: "100%", background: `linear-gradient(90deg, ${C.emerald}, #17b183)`, borderRadius: "0 8px 8px 0", transitionDelay: `${i * 120}ms`, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10 }}
              >
                <span style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, color: "#fff", ...TABULAR }}>{a} · &gt; {APROBACION_MINIMA} %</span>
              </div>
            </div>
          ))}
        </div>
      </Regla>
      <p style={{ fontFamily: FONT_UI, fontSize: 12.5, color: C.textSoft, margin: "12px 0 0", lineHeight: 1.5 }}>
        Cada barra llega a 92 %, que es el piso informado por Barkley para esa cohorte; no representa el valor exacto del año.
      </p>
    </div>
  );
}

function Simulador() {
  const [id, setId] = useState<Escenario["id"]>("barkley");
  const esc = ESCENARIOS.find((e) => e.id === id)!;
  return (
    <div style={{ ...tarjeta }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 500, color: C.ink, margin: "0 0 4px" }}>¿Por qué se logra?</h3>
      <p style={{ fontFamily: FONT_UI, fontSize: 14, color: C.textSoft, margin: "0 0 14px" }}>Toca un escenario y mira dónde queda frente a la exigencia oficial.</p>
      <Pestanas
        etiquetaAria="Escenarios de preparación del Examen Libre" base="escenarios" tono="blanco"
        items={ESCENARIOS.map((e) => ({ id: e.id, etiqueta: e.etiqueta, detalle: e.subetiqueta }))}
        valor={id} onCambio={(v) => setId(v as Escenario["id"])}
      />
      <div style={{ marginTop: 14 }}>
        <Regla>
          <div style={{ position: "relative", height: "100%", paddingTop: 24 }}>
            {id === "zoom" && (
              <div className="bk-anim" style={{ position: "absolute", top: 58, left: 0, width: pct(COMPRENSION_ZOOM), height: 34, background: C.risk, borderRadius: "0 8px 8px 0", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10 }}>
                <span style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, color: "#fff", ...TABULAR }}>≈ {COMPRENSION_ZOOM} %</span>
              </div>
            )}
            {id === "solitario" && (
              <div className="bk-anim" style={{ position: "absolute", top: 58, left: 0, width: "100%", height: 34, borderRadius: 8, border: `2px dashed ${C.risk}`, background: `repeating-linear-gradient(135deg, ${C.riskSoft}, ${C.riskSoft} 8px, #fff 8px, #fff 16px)`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <CircleHelp size={18} color={C.risk} aria-hidden />
                <span style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, color: C.risk }}>Sin medición de dominio</span>
              </div>
            )}
            {id === "barkley" && (
              <div className="bk-anim" style={{ position: "absolute", top: 58, left: pct(DOMINIO_UMBRAL.desde), width: pct(DOMINIO_UMBRAL.hasta - DOMINIO_UMBRAL.desde), height: 34, background: `linear-gradient(90deg, ${C.emerald}, #17b183)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: FONT_UI, fontSize: 12.5, fontWeight: 700, color: "#fff", ...TABULAR, whiteSpace: "nowrap" }}>80–100 %</span>
              </div>
            )}
          </div>
        </Regla>
      </div>
      <div style={{ marginTop: 12, fontFamily: FONT_UI }} aria-live="polite">
        <p style={{ fontSize: 15.5, lineHeight: 1.6, color: C.text, margin: "0 0 8px" }}>{esc.descripcion}</p>
        <p style={{ fontSize: 14.5, fontWeight: 700, color: id === "barkley" ? C.emerald : C.risk, margin: 0 }}>{esc.riesgo}</p>
        {esc.mensaje && (
          <p style={{ fontFamily: FONT_DISPLAY, fontSize: 18, lineHeight: 1.5, color: C.ink, margin: "14px 0 0", paddingLeft: 14, borderLeft: `3px solid ${C.emerald}` }}>{esc.mensaje}</p>
        )}
      </div>
      <p style={{ fontFamily: FONT_UI, fontSize: 12.5, color: C.textSoft, margin: "14px 0 0" }}>Escenarios ilustrativos; el 55 % es un ejemplo de comprensión por lagunas acumuladas.</p>
    </div>
  );
}

function Escaner() {
  return (
    <Seccion
      id="escaner" numero="01" etiqueta="El escáner de exigencia" titulo="El Ministerio pide 60 %. Barkley entrena sobre 80 %."
      intro="Un Examen Libre se aprueba con el 60 % de logro. La diferencia entre pasar justo y llegar tranquilo está en cuánto domina el alumno cuando se sienta a rendir."
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
      intro="Elige el nivel. Barkley elimina el «relleno» y concentra toda la energía en lo que sí entra en el Examen Libre (Validación de Estudios para menores de 18 años)."
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
      id="ruta" numero="03" etiqueta="Ruta de blindaje" titulo="Cómo resolvemos el colegio examinador en cuatro fases"
      intro={CONTEXTO_EXAMINADOR}
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
                    <span style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.85 }}>{f.periodo}</span>
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, display: "block" }}>{f.titulo}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div role="region" aria-live="polite" aria-label={`Fase ${fase.numero}: ${fase.titulo}`} style={{ ...tarjeta, marginTop: 14, display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 320px" }}>
            <div style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, color: C.indigo, marginBottom: 6 }}>Fase {fase.numero} · {fase.periodo}</div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(22px,3vw,30px)", fontWeight: 500, color: C.ink, margin: "0 0 10px", lineHeight: 1.2 }}>{fase.titulo}</h3>
            <p style={{ fontFamily: FONT_UI, fontSize: 16.5, lineHeight: 1.65, color: C.text, margin: 0 }}>{fase.texto}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} aria-label="Fase anterior" className="bk-foco"
              style={{ width: 46, height: 46, borderRadius: 10, border: `1px solid ${C.rule}`, background: C.white, cursor: i === 0 ? "not-allowed" : "pointer", opacity: i === 0 ? 0.4 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button type="button" onClick={() => setI(Math.min(FASES.length - 1, i + 1))} disabled={i === FASES.length - 1} aria-label="Fase siguiente" className="bk-foco"
              style={{ width: 46, height: 46, borderRadius: 10, border: `1px solid ${C.indigo}`, background: C.indigo, color: "#fff", cursor: i === FASES.length - 1 ? "not-allowed" : "pointer", opacity: i === FASES.length - 1 ? 0.4 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
        </div>
        <div style={{ marginTop: 26 }}><MicroCta href="/#calendario">Ver el calendario del año</MicroCta></div>
      </Reveal>
    </Seccion>
  );
}

/* ───────────────────────── 4. Transparencia estadística ───────────────────────── */

function Transparencia() {
  const [abierta, setAbierta] = useState<string | null>(TARJETAS_TRANSPARENCIA[0].id);
  return (
    <Seccion
      id="transparencia" numero="04" etiqueta="Transparencia" fondo="blanco" titulo="Nuestro respaldo histórico 2023–2024–2025 (más del 92 %)"
      intro="Tres tarjetas para entender qué medimos, por qué el estándar interno es más alto que el oficial y qué puede ver el apoderado."
    >
      <Reveal>
        <div style={{ display: "grid", gap: 12 }}>
          {TARJETAS_TRANSPARENCIA.map((t) => {
            const abre = abierta === t.id;
            return (
              <div key={t.id} style={{ border: `1px solid ${abre ? C.indigo : C.rule}`, borderRadius: 14, background: C.paper, overflow: "hidden", transition: "border-color .2s" }}>
                <h3 style={{ margin: 0 }}>
                  <button
                    type="button" aria-expanded={abre} aria-controls={`transp-${t.id}`} id={`transp-btn-${t.id}`} onClick={() => setAbierta(abre ? null : t.id)} className="bk-foco"
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, textAlign: "left", cursor: "pointer", background: "transparent", border: "none", padding: "18px 20px", minHeight: 64, fontFamily: FONT_UI }}
                  >
                    <span>
                      <span style={{ display: "block", fontSize: 17, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{t.titulo}</span>
                      <span style={{ display: "block", fontSize: 14, color: C.textSoft, marginTop: 3 }}>{t.resumen}</span>
                    </span>
                    <ChevronDown size={22} aria-hidden style={{ flex: "0 0 auto", color: C.indigo, transform: abre ? "rotate(180deg)" : "none", transition: "transform .25s" }} />
                  </button>
                </h3>
                <div id={`transp-${t.id}`} role="region" aria-labelledby={`transp-btn-${t.id}`} hidden={!abre} style={{ padding: "0 20px 20px" }}>
                  <p style={{ fontFamily: FONT_UI, fontSize: 16.5, lineHeight: 1.7, color: C.text, margin: 0, maxWidth: 760 }}>{t.cuerpo}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 26 }}><MicroCta href="/#consultas">Resolver mis dudas</MicroCta></div>
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
    "Exámenes Libres: más de 92 % de aprobación y temarios MINEDUC | Barkley",
    "Resultados 2023, 2024 y 2025 en Exámenes Libres, apego a los temarios oficiales del MINEDUC por nivel y la ruta en cuatro fases hacia el colegio examinador.",
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
        <Transparencia />
        <CierreCta />
      </main>
    </div>
  );
}
