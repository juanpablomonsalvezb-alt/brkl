/**
 * Piezas compartidas de las páginas en inglés (/en y /en/support): colores de
 * marca, animación de entrada, montos en CLP y pie de página. Las páginas en
 * inglés están pensadas para lectores internacionales —filántropos, fundaciones,
 * aliados—, por eso explican lo que un chileno da por sabido (Exámenes Libres,
 * MINEDUC, niveles 1° básico – 4° medio).
 */
import { motion } from "framer-motion";
import { Instagram, Youtube } from "lucide-react";
import { MARCADORES } from "@shared/precios";

export const NAVY = "#003366";
export const RED = "#FF3D37";
export const GOLD = "#FFC548";
export const TEXT = "#525252";
export const SLATE = "#5b7ba3";
export const VIVID_BLUE = "#0b63e5";
export const FONT = "'Poppins', sans-serif";

export const CONTACTO = "admisiones@barkleyinstituto.cl";

const clp = (n: number) => `CLP ${n.toLocaleString("en-US")}`;
const escolar = Number(MARCADORES.precio_escolar_numero);
const adultos = Number(MARCADORES.precio_adultos_numero);
const MESES = 8; // marzo a octubre
export const MONTOS = {
  escolarMes: clp(escolar),
  adultosMes: clp(adultos),
  escolarAnio: clp(escolar * MESES),
  descuentoAnual: MARCADORES.descuento_anual,
  meses: MESES,
};

export function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay, ease: "easeOut" }} style={style}>
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, color = RED }: { children: React.ReactNode; color?: string }) {
  return <p style={{ fontSize: 13, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>{children}</p>;
}

export function H2({ children, color = NAVY, center }: { children: React.ReactNode; color?: string; center?: boolean }) {
  return <h2 style={{ fontSize: "clamp(30px,4.6vw,48px)", fontWeight: 700, lineHeight: 1.15, color, margin: "0 0 20px", textAlign: center ? "center" : undefined }}>{children}</h2>;
}

export function BotonOro({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 600, color: NAVY, background: GOLD, borderRadius: 999, padding: "14px 28px", textDecoration: "none", fontFamily: FONT }}>
      {children}
    </a>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden>
      <path d="M16.6 5.82a4.28 4.28 0 0 1-3.14-1.4 4.29 4.29 0 0 1-1-2.7h-3.06v13.5a2.6 2.6 0 1 1-1.83-2.48v-3.1a5.66 5.66 0 1 0 4.89 5.6V9.17a7.3 7.3 0 0 0 4.14 1.29z" />
    </svg>
  );
}

export function FooterEn() {
  const redes = [
    { href: "https://www.instagram.com/ibarkley.cl", label: "Barkley on Instagram", icon: <Instagram style={{ width: 20, height: 20 }} /> },
    { href: "https://www.tiktok.com/@barkleyonline", label: "Barkley on TikTok", icon: <TikTokIcon /> },
    { href: "https://www.youtube.com/@barkleyonline1/shorts", label: "Barkley on YouTube", icon: <Youtube style={{ width: 20, height: 20 }} /> },
  ];
  return (
    <footer style={{ backgroundColor: NAVY, color: "#fff", padding: "56px 24px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 32 }}>
        <div style={{ flex: "1 1 260px" }}>
          <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Barkley Online School</p>
          <p style={{ fontSize: 14, margin: 0, lineHeight: 1.8, opacity: 0.85 }}>100% asynchronous online school · Chile</p>
          <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
            {redes.map((r) => (
              <a key={r.href} href={r.href} target="_blank" rel="me noreferrer" aria-label={r.label} style={{ color: "#fff", opacity: 0.85, display: "flex" }}>{r.icon}</a>
            ))}
          </div>
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Explore</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6, fontSize: 14, opacity: 0.85 }}>
            <li><a href="/en#method" style={{ color: "#fff" }}>How it works</a></li>
            <li><a href="/en#every-learner" style={{ color: "#fff" }}>Designed for every learner</a></li>
            <li><a href="/en/support" style={{ color: "#fff" }}>Support our mission</a></li>
            <li><a href="/" hrefLang="es" style={{ color: "#fff" }}>Sitio en español</a></li>
          </ul>
        </div>
        <div style={{ flex: "1 1 240px" }}>
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Contact</p>
          <p style={{ fontSize: 14, margin: 0, opacity: 0.85 }}><a href={`mailto:${CONTACTO}`} style={{ color: "#fff" }}>{CONTACTO}</a></p>
          <p style={{ fontSize: 13, margin: "10px 0 0", opacity: 0.7 }}>Students are certified through Chile's official Exámenes Libres, administered by the Ministry of Education (MINEDUC).</p>
        </div>
      </div>
      <div style={{ maxWidth: 1280, margin: "32px auto 0", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        <p style={{ fontSize: 13, opacity: 0.6, margin: 0 }}>© {new Date().getFullYear()} Barkley Online</p>
      </div>
    </footer>
  );
}
