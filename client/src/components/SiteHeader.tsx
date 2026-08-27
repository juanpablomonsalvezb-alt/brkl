/**
 * Header principal, compartido entre Home y cualquier página secundaria
 * (ej. /sin-limites). Los links usan rutas absolutas con hash ("/#seccion")
 * en vez de hash puro ("#seccion") — así funcionan igual estando en el home
 * o en cualquier otra página: navegan de vuelta al home y hacen scroll a
 * la sección. Sin esto, una página secundaria queda sin forma de volver.
 */
import { useState } from "react";
import { Search, Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAVY = "#003366";
const RED = "#FF3D37";
const FONT = "'Poppins', sans-serif";

const NAV_LINKS = [
  { label: "Nosotros", href: "/#nosotros" },
  { label: "El Método", href: "/#metodo-barkley" },
  { label: "Admisión", href: "/#inscripcion" },
  { label: "Aprendizaje", href: "/#metodo" },
  { label: "Plataforma", href: "/#plataforma" },
  { label: "IA Barkley", href: "/#ia-barkley" },
  { label: "Servicios", href: "/#servicios" },
  { label: "Calendario", href: "/#calendario" },
  { label: "Precio", href: "/#precio" },
  { label: "Preguntas", href: "/#faq" },
  { label: "Por qué somos distintos", href: "/sin-limites" },
];

// Barra de acceso a portales — TODAVÍA sin backend real detrás (no hay Canvas
// ni portal de apoderados construido), pero visualmente comunica lo que todo
// colegio serio muestra: un acceso diferenciado para alumno y familia. Lleva
// a la sección de inscripción en vez de a un link muerto, así el clic nunca
// se siente roto aunque el portal real no exista todavía.
function PortalBar() {
  return (
    <div style={{ background: "#0a2e52", display: "flex", justifyContent: "center", alignItems: "center", gap: 0, padding: "10px 0", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em" }}>
      <a href="/#inscripcion" style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", textDecoration: "none", padding: "0 20px" }}>
        <User size={15} /> PORTAL ALUMNO
      </a>
      <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.25)" }} />
      <a href="/#inscripcion" style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", textDecoration: "none", padding: "0 20px" }}>
        <User size={15} /> PORTAL FAMILIA
      </a>
    </div>
  );
}

export function SiteHeader({ overlay = true }: { overlay?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div style={{ position: overlay ? "absolute" : "relative", top: 0, left: 0, right: 0, zIndex: 30 }}>
      <PortalBar />
      <header style={{ position: "relative" }}>
      <style>{`
        @media (max-width: 760px) {
          [data-hdr="controls"] { width: auto !important; padding: 14px 16px !important; gap: 10px !important; }
          [data-hdr="logo"] { padding: 16px 0 0 16px !important; gap: 10px !important; }
          [data-hdr="logo-box"] { width: 56px !important; height: 56px !important; }
          [data-hdr="logo-text"] { font-size: 14px !important; }
          [data-hdr="solo-desktop"] { display: none !important; }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <a href="/" data-hdr="logo" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", padding: "30px 0 0 45px" }}>
          <div data-hdr="logo-box" style={{ width: 84, height: 84, background: "rgba(0,32,61,0.45)", border: "2px solid #fff", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 12 }}>
            <img src="/logos/barkley_isotipo_B_navy.svg" alt="Barkley" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
          </div>
          <span data-hdr="logo-text" style={{ color: "#fff", fontWeight: 600, fontSize: 19, lineHeight: 1.35 }}>Barkley<br />Colegio Online</span>
        </a>
        <div data-hdr="controls" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14, background: "#fff", padding: "26px 30px 26px 20px", width: 344, boxSizing: "border-box", flexShrink: 0 }}>
          <button aria-label="Buscar" data-hdr="solo-desktop" style={{ width: 40, height: 40, borderRadius: "50%", background: "#f1f4f8", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Search style={{ width: 17, height: 17, color: NAVY }} />
          </button>
          <span data-hdr="solo-desktop" style={{ width: 1, height: 22, background: "#d8dee6" }} />
          <a href="/#inscripcion" data-hdr="solo-desktop" style={{ fontSize: 14, fontWeight: 600, color: NAVY, textDecoration: "none", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>MI BARKLEY</a>
          <span data-hdr="solo-desktop" style={{ width: 1, height: 22, background: "#d8dee6" }} />
          <button aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} onClick={() => setMenuOpen(o => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: NAVY, fontFamily: FONT, fontSize: 14, fontWeight: 600, letterSpacing: "0.05em" }}>
            {menuOpen ? <X style={{ width: 22, height: 22 }} /> : <Menu style={{ width: 22, height: 22 }} />}
            MENÚ
          </button>
        </div>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
            style={{ position: "fixed", inset: 0, background: NAVY, zIndex: 40, padding: "60px 40px", display: "flex", flexDirection: "column", gap: 24, overflowY: "auto" }}>
            <button aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} style={{ alignSelf: "flex-end", background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X style={{ width: 32, height: 32 }} /></button>
            {NAV_LINKS.map((l, i) => (
              <motion.a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 * i }}
                style={{ color: "#fff", textDecoration: "none", fontSize: "clamp(22px,5vw,40px)", fontWeight: 600 }}>{l.label}</motion.a>
            ))}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 * NAV_LINKS.length + 0.1 }} style={{ display: "flex", gap: 14, marginTop: 20 }}>
              <a href="/#inscripcion" style={{ textDecoration: "none", background: RED, color: "#fff", borderRadius: 999, padding: "12px 24px", fontSize: 16, fontWeight: 600 }}>Postular</a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </header>
    </div>
  );
}
