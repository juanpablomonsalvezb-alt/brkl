/**
 * Piezas compartidas de las páginas de confianza (/examenes-libres-y-resultados y /por-que-barkley).
 *
 * Dirección visual: «libreta de calificaciones». Papel frío con renglones finos, tinta azul profunda,
 * esmeralda solo para lo aprobado, índigo para lo que se puede tocar, ámbar quemado para el riesgo.
 * Tipografía aprobada para el sitio: Newsreader (titulares y cifras grandes) + Instrument Sans (texto y datos).
 * Las cifras usan numerales tabulares para que las columnas se lean como una tabla de notas.
 */
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

export const C = {
  ink: "#0B2545",
  navy: "#003366",
  navyDeep: "#001d3d",
  indigo: "#2F3FBF",
  indigoSoft: "#E6E9FB",
  emerald: "#0B8F63",
  emeraldSoft: "#DDF3EA",
  risk: "#B4421C",
  riskSoft: "#FBE6DD",
  gold: "#FFC548",
  paper: "#F6F8FB",
  paperDeep: "#E9EEF6",
  white: "#FFFFFF",
  text: "#33465E",
  textSoft: "#5B6E86",
  rule: "#D3DBE8",
} as const;

export const FONT_UI = "'Instrument Sans', system-ui, sans-serif";
export const FONT_DISPLAY = "'Newsreader', Georgia, serif";
export const TABULAR: CSSProperties = { fontVariantNumeric: "tabular-nums lining-nums" };

/** Renglones finos de cuaderno: la huella de la página. */
export const RENGLONES: CSSProperties = {
  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 31px, ${C.rule}66 31px, ${C.rule}66 32px)`,
};

/** Título, descripción y canónica de cada página (el prerender y el cliente comparten esta convención). */
export function usePageMeta(title: string, description: string, path: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    const desc = document.querySelector('meta[name="description"]');
    const prevDesc = desc?.getAttribute("content") ?? null;
    desc?.setAttribute("content", description);
    const canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute("href") ?? null;
    canonical?.setAttribute("href", `https://www.barkleyinstituto.cl${path}`);
    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) desc?.setAttribute("content", prevDesc);
      if (prevCanonical !== null) canonical?.setAttribute("href", prevCanonical);
    };
  }, [title, description, path]);
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reducir = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducir ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Número que se desplaza suavemente hacia su valor (respeta «reducir movimiento»). */
export function Numero({ valor, formato }: { valor: number; formato: (n: number) => string }) {
  const reducir = useReducedMotion();
  const [mostrado, setMostrado] = useState(valor);
  const previo = useRef(valor);
  useEffect(() => {
    if (reducir) { setMostrado(valor); previo.current = valor; return; }
    const control = animate(previo.current, valor, { duration: 0.5, ease: "easeOut", onUpdate: (v) => setMostrado(v) });
    previo.current = valor;
    return () => control.stop();
  }, [valor, reducir]);
  return <span style={TABULAR}>{formato(mostrado)}</span>;
}

/** Para activar animaciones de barras solo cuando entran en pantalla. */
export function useEnVista<T extends Element>() {
  const ref = useRef<T>(null);
  const visto = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  return { ref, visto };
}

export function Insignia({ children, tono = "claro" }: { children: ReactNode; tono?: "claro" | "oscuro" }) {
  const oscuro = tono === "oscuro";
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, letterSpacing: "0.01em",
        padding: "8px 14px", borderRadius: 999, lineHeight: 1.2,
        background: oscuro ? "rgba(255,255,255,0.1)" : C.emeraldSoft, color: oscuro ? "#fff" : C.emerald,
        border: `1px solid ${oscuro ? "rgba(255,255,255,0.28)" : "#9ad9c0"}`,
      }}
    >
      {children}
    </span>
  );
}

export function Seccion({ id, numero, etiqueta, titulo, intro, children, fondo = "claro" }: {
  id?: string; numero: string; etiqueta: string; titulo: string; intro?: string; children: ReactNode; fondo?: "claro" | "papel" | "blanco";
}) {
  const bg = fondo === "blanco" ? C.white : fondo === "papel" ? C.paperDeep : C.paper;
  return (
    <section id={id} style={{ background: bg, padding: "clamp(56px,8vw,96px) 20px", scrollMarginTop: 12 }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <Reveal>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontStyle: "italic", color: C.indigo, ...TABULAR }}>{numero}</span>
            <span style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", color: C.textSoft }}>{etiqueta}</span>
          </div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px,4.6vw,46px)", fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.015em", color: C.ink, margin: "0 0 14px", maxWidth: 820, textWrap: "balance" as CSSProperties["textWrap"] }}>
            {titulo}
          </h2>
          {intro && <p style={{ fontFamily: FONT_UI, fontSize: "clamp(16px,1.9vw,18px)", lineHeight: 1.65, color: C.text, margin: "0 0 34px", maxWidth: 720 }}>{intro}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  );
}

export function MicroCta({ href, children, tono = "claro" }: { href: string; children: ReactNode; tono?: "claro" | "oscuro" }) {
  const oscuro = tono === "oscuro";
  return (
    <a
      href={href}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontWeight: 700, fontSize: 15, textDecoration: "none",
        color: oscuro ? C.navy : C.white, background: oscuro ? C.gold : C.indigo, padding: "13px 20px", borderRadius: 10, minHeight: 46,
      }}
    >
      {children} <ArrowUpRight size={17} aria-hidden />
    </a>
  );
}

/** Pestañas accesibles: flechas, Inicio y Fin; solo la pestaña activa entra en el orden de tabulación. */
export interface ItemPestana { id: string; etiqueta: string; detalle?: string }
export function Pestanas({ items, valor, onCambio, etiquetaAria, base, scroll = true, tono = "papel" }: {
  items: readonly ItemPestana[]; valor: string; onCambio: (id: string) => void; etiquetaAria: string; base: string; scroll?: boolean; tono?: "papel" | "blanco";
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const ir = (id: string) => { onCambio(id); refs.current[id]?.focus(); };
  const alTeclado = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = items.length;
    const destino = e.key === "ArrowRight" || e.key === "ArrowDown" ? items[(i + 1) % n] : e.key === "ArrowLeft" || e.key === "ArrowUp" ? items[(i - 1 + n) % n]
      : e.key === "Home" ? items[0] : e.key === "End" ? items[n - 1] : null;
    if (destino) { e.preventDefault(); ir(destino.id); }
  };
  return (
    <div
      role="tablist" aria-label={etiquetaAria}
      style={{ display: "flex", gap: 8, overflowX: scroll ? "auto" : "visible", flexWrap: scroll ? "nowrap" : "wrap", paddingBottom: 6, margin: "0 -20px", padding: "0 20px 6px", scrollbarWidth: "thin" }}
    >
      {items.map((it, i) => {
        const activo = it.id === valor;
        return (
          <button
            key={it.id} ref={(el) => { refs.current[it.id] = el; }} role="tab" id={`${base}-tab-${it.id}`} aria-selected={activo} aria-controls={`${base}-panel-${it.id}`}
            tabIndex={activo ? 0 : -1} onClick={() => onCambio(it.id)} onKeyDown={(e) => alTeclado(e, i)}
            style={{
              flex: "0 0 auto", fontFamily: FONT_UI, cursor: "pointer", textAlign: "left", minHeight: 46, padding: "10px 16px", borderRadius: 10,
              background: activo ? C.indigo : tono === "blanco" ? C.paper : C.white, color: activo ? "#fff" : C.ink, fontSize: 14.5, fontWeight: activo ? 700 : 600,
              border: `1px solid ${activo ? C.indigo : C.rule}`, transition: "background .2s, color .2s, border-color .2s", whiteSpace: "nowrap",
            }}
          >
            {it.etiqueta}
            {it.detalle && <span style={{ display: "block", fontSize: 12, fontWeight: 500, opacity: activo ? 0.85 : 0.65, marginTop: 1 }}>{it.detalle}</span>}
          </button>
        );
      })}
    </div>
  );
}

export const idPanel = (base: string, id: string) => ({ role: "tabpanel" as const, id: `${base}-panel-${id}`, "aria-labelledby": `${base}-tab-${id}`, tabIndex: 0 });

/** Identificador estable para asociar etiquetas con controles. */
export function useIdCorto(prefijo: string) {
  return `${prefijo}-${useId().replace(/:/g, "")}`;
}

export const tarjeta: CSSProperties = { background: C.white, border: `1px solid ${C.rule}`, borderRadius: 16, padding: "clamp(20px,3vw,30px)" };
