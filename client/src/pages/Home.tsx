/**
 * Home — estructura fiel a unthink.ie (getComputedStyle real):
 * - Font: 35px para TODO (nav, body, headings, tags)
 * - Padding: 0 15px en todas las secciones
 * - Alternas: crema #f4f4ea / negro
 * - Sin jerarquía tipográfica extra, sin sombras, radius 0
 * - Transiciones: opacity 0.25s ease-in-out únicamente
 */
import { useState, useRef } from "react";
import { Link } from "wouter";
import { Loader2, Check, Phone, Mail, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { ReservationDialog } from "@/components/ReservationDialog";
import { useQuery } from "@tanstack/react-query";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const CREAM = "rgb(244,244,234)";
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1600&q=70";

const NAV_LINKS = [
  { label: "El método", href: "#metodo" },
  { label: "La plataforma", href: "#plataforma" },
  { label: "Inscripción", href: "#inscripcion" },
  { label: "Contacto", href: "#contacto" },
];

const PROGRAMAS = [
  {
    title: "Aprendizaje asincrónico",
    tags: ["Sin Zoom", "Sin horario fijo", "Ritmo propio"],
    img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1380&q=70",
    alt: "Estudiante aprendiendo en casa",
  },
  {
    title: "Exámenes libres ante el MINEDUC",
    tags: ["5° básico", "4° medio", "Licencia oficial"],
    img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1380&q=70",
    alt: "Estudiante rindiendo examen",
  },
  {
    title: "La plataforma",
    tags: ["Sin IA en el aula", "Algoritmo adaptativo", "Seguimiento real"],
    img: "https://images.unsplash.com/photo-1555212697-194d092e3b8f?auto=format&fit=crop&w=1380&q=70",
    alt: "Plataforma Barkley Online",
  },
];

interface Faq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

function InscripcionForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error" | "duplicate">("idle");
  const [err, setErr] = useState("");

  const submit = async () => {
    setState("loading");
    setErr("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, levelInterest: level || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.message || "No se pudo enviar"); setState("error"); return; }
      setState(data.alreadySubscribed ? "duplicate" : "success");
    } catch { setErr("Sin conexión"); setState("error"); }
  };

  if (state === "success" || state === "duplicate") {
    return (
      <div className="flex flex-col gap-4 py-8">
        <Check className="h-8 w-8" />
        <p style={{ fontSize: 35 }} className="font-light">
          {state === "duplicate" ? "Ya tenemos tu inscripción." : "Inscripción recibida."}
        </p>
        <p className="text-sm">Un asesor te contactará a la brevedad.</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm opacity-60">Nombre del apoderado o estudiante *</label>
        <input
          required value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Nombre completo"
          className="border-b border-current bg-transparent py-2 text-lg outline-none placeholder:opacity-40"
          data-testid="input-name"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm opacity-60">Correo electrónico *</label>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="border-b border-current bg-transparent py-2 text-lg outline-none placeholder:opacity-40"
          data-testid="input-email"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm opacity-60">Nivel de interés</label>
        <select
          value={level} onChange={(e) => setLevel(e.target.value)}
          className="border-b border-current bg-transparent py-2 text-lg outline-none"
          data-testid="select-level"
        >
          <option value="">Selecciona un nivel</option>
          {["5° Básico","6° Básico","7° Básico","8° Básico","1° Medio","2° Medio","3° Medio","4° Medio","Validación adulto"].map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      {state === "error" && <p className="text-sm text-red-600">{err}</p>}
      <button
        type="submit" disabled={state === "loading"}
        className="mt-2 flex items-center gap-2 border-b border-current pb-1 text-left text-lg opacity-100 transition-opacity hover:opacity-60 disabled:opacity-40"
        data-testid="button-submit"
      >
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Quiero inscribirme <ArrowUpRight className="h-4 w-4" /></>}
      </button>
      <p className="text-sm opacity-50">Sin compromiso · sin costo en esta etapa · cupos limitados año académico 2027</p>
    </form>
  );
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [photoOk, setPhotoOk] = useState(true);

  const { data: faqs } = useQuery<Faq[]>({ queryKey: ["/api/faqs"], staleTime: 5 * 60 * 1000 });

  const goInscripcion = () => document.getElementById("inscripcion")?.scrollIntoView({ behavior: "smooth" });

  const s = { fontSize: 35, fontWeight: 300, lineHeight: "1.1" };

  return (
    <div style={{ backgroundColor: CREAM, color: "#000", fontFamily: "'Hanken Grotesk', sans-serif" }}>

      {/* ===== NAV — 35px, plano, sin botón extra ===== */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: CREAM, borderBottom: "none", padding: "0 15px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingTop: 20, paddingBottom: 20 }}>
          <Link href="/" style={{ ...s, textDecoration: "none", color: "#000" }}>Barkley Online</Link>
          <nav className="hidden md:flex" style={{ gap: 32, display: "flex" }}>
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href}
                style={{ ...s, fontSize: 18, textDecoration: "none", color: "#000", opacity: 0.85, transition: "opacity 0.25s ease-in-out" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.4")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0.85")}
              >{l.label}</a>
            ))}
          </nav>
          <button className="md:hidden" onClick={() => setMobileOpen(v => !v)} style={{ ...s, fontSize: 18, background: "none", border: "none", cursor: "pointer" }}>
            {mobileOpen ? "Cerrar" : "Menú"}
          </button>
        </div>
        {mobileOpen && (
          <div style={{ padding: "20px 0", display: "flex", flexDirection: "column", gap: 16 }}>
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                style={{ ...s, fontSize: 22, textDecoration: "none", color: "#000" }}>{l.label}</a>
            ))}
          </div>
        )}
      </header>

      {/* ===== HERO — fullHeight 100vh, foto con overlay texto ===== */}
      <section style={{ position: "relative", height: "100vh", overflow: "hidden", padding: "0 15px" }}>
        {photoOk && (
          <img src={HERO_PHOTO} alt="Estudiante" onError={() => setPhotoOk(false)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.3)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 100%)" }} />
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 48 }}>
          <p style={{ ...s, fontSize: "clamp(42px, 6vw, 80px)", color: "#fff", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1, maxWidth: "14ch" }}>
            El colegio que<br />se adapta<br />a tu ritmo.
          </p>
          <a href="#inscripcion" onClick={(e) => { e.preventDefault(); goInscripcion(); }}
            style={{ marginTop: 32, color: "#fff", fontSize: 18, opacity: 0.85, transition: "opacity 0.25s", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.4")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.85")}
          >Inscríbete <ArrowUpRight style={{ width: 16, height: 16 }} /></a>
        </div>
      </section>

      {/* ===== TEXT BOX 1 — "Somos Barkley Online" (crema, 35px) ===== */}
      <section style={{ padding: "80px 15px", backgroundColor: CREAM }}>
        <p style={{ ...s }}>Somos Barkley Online</p>
        <p style={{ ...s, marginTop: 24, maxWidth: "60ch", opacity: 0.75 }}>
          Un colegio 100% asincrónico: sin clases en vivo por Zoom o Meet, sin horario predeterminado.
          Desde 5° básico a 4° medio — y validación para adultos — preparando para rendir exámenes libres
          ante el Ministerio de Educación de Chile.
        </p>
      </section>

      {/* ===== PROGRAMA CARDS + TEXT BOXES alternados ===== */}
      {PROGRAMAS.map((p, i) => (
        <div key={p.title}>
          {/* Card de programa — imagen full-width + título + tags (35px) */}
          <section style={{ padding: "0 15px 0", backgroundColor: i % 2 === 0 ? CREAM : "#f0f0e8" }}>
            <img src={p.img} alt={p.alt}
              style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block", filter: "grayscale(0.15)" }}
              loading="lazy"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "24px 0 48px" }}>
              <p style={{ ...s }}>{p.title}</p>
              <p style={{ fontSize: 18, opacity: 0.55 }}>{p.tags.join("  ·  ")}</p>
            </div>
          </section>

          {/* Text box después de cada card */}
          {i === 0 && (
            <section id="metodo" style={{ padding: "80px 15px", backgroundColor: CREAM }}>
              <p style={{ ...s, fontSize: "clamp(28px, 4vw, 55px)", fontWeight: 200, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                El aprendizaje es<br />asincrónico.
              </p>
              <a href="#plataforma"
                style={{ marginTop: 32, fontSize: 18, color: "#000", opacity: 0.7, transition: "opacity 0.25s", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.3")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
              >Cómo funciona el método <ArrowUpRight style={{ width: 16, height: 16 }} /></a>
            </section>
          )}
          {i === 1 && (
            <section style={{ padding: "80px 15px", backgroundColor: CREAM }}>
              <p style={{ ...s, fontSize: "clamp(28px, 4vw, 55px)", fontWeight: 200, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                El algoritmo<br />te acompaña.
              </p>
              <p style={{ ...s, marginTop: 24, maxWidth: "50ch", opacity: 0.75 }}>
                Un sistema determinístico mide los resultados de cada estudiante y ajusta el
                ritmo y el contenido en consecuencia. Sin inteligencia artificial generativa
                en el aula — solo seguimiento real.
              </p>
            </section>
          )}
          {i === 2 && (
            <section id="plataforma" style={{ padding: "80px 15px", backgroundColor: CREAM }}>
              <p style={{ ...s, fontSize: "clamp(28px, 4vw, 55px)", fontWeight: 200, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                Construida<br />desde cero.
              </p>
              <p style={{ ...s, marginTop: 24, maxWidth: "50ch", opacity: 0.75 }}>
                Sin Moodle, sin plantillas genéricas. Plataforma propia diseñada para
                el modelo de autorregulación del Dr. Russell Barkley.
              </p>
            </section>
          )}
        </div>
      ))}

      {/* ===== FAQ ===== */}
      {faqs && faqs.length > 0 && (
        <section style={{ padding: "80px 15px", backgroundColor: CREAM }}>
          <p style={{ ...s, marginBottom: 48 }}>Preguntas frecuentes</p>
          <Accordion type="single" collapsible className="space-y-0">
            {faqs.map(f => (
              <AccordionItem key={f.id} value={f.id} style={{ borderTop: "1px solid rgba(0,0,0,0.15)", borderBottom: "none" }}>
                <AccordionTrigger style={{ fontSize: 22, fontWeight: 300, padding: "20px 0", textAlign: "left" }} className="hover:no-underline">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent style={{ fontSize: 18, opacity: 0.75, paddingBottom: 20 }}>
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      {/* ===== CTA / HELLO — fondo negro, blanco, 35px ===== */}
      <section id="contacto" style={{ backgroundColor: "#000", color: "#fff", padding: "80px 15px" }}>
        <p style={{ ...s }}>Inscríbete.</p>
        <p style={{ ...s, marginTop: 16, maxWidth: "40ch", opacity: 0.75 }}>
          ¿Quieres saber más sobre Barkley Online?<br />Conversemos.
        </p>
        <button onClick={goInscripcion}
          style={{ marginTop: 32, fontSize: 18, color: "#fff", background: "none", border: "none", cursor: "pointer", opacity: 0.85, transition: "opacity 0.25s", padding: 0, display: "inline-flex", alignItems: "center", gap: 6 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.4")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0.85")}
        >Ir al formulario de inscripción <ArrowUpRight style={{ width: 16, height: 16 }} /></button>
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setCallOpen(true)}
            style={{ fontSize: 18, color: "#fff", background: "none", border: "none", cursor: "pointer", opacity: 0.6, transition: "opacity 0.25s", padding: 0, display: "inline-flex", alignItems: "center", gap: 6 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.3")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
          ><Phone style={{ width: 14 }} /> Agendar llamada</button>
        </div>
      </section>

      {/* ===== INSCRIPCIÓN — sección dedicada, crema ===== */}
      <section id="inscripcion" style={{ backgroundColor: CREAM, padding: "80px 15px" }}>
        <p style={{ ...s, marginBottom: 48 }}>Admisión 2027</p>
        <div style={{ maxWidth: 560 }}>
          <InscripcionForm />
        </div>
      </section>

      {/* ===== FOOTER — negro ===== */}
      <footer style={{ backgroundColor: "#000", color: "#fff", padding: "60px 15px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 300 }}>Barkley Online</p>
            <p style={{ fontSize: 16, opacity: 0.55, marginTop: 8 }}>Colegio asincrónico · Chile</p>
            <p style={{ fontSize: 16, opacity: 0.55, marginTop: 4 }}>Admisión año académico 2027</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <a href="mailto:admisiones@barkley.cl"
              style={{ fontSize: 16, color: "#fff", opacity: 0.6, textDecoration: "none", transition: "opacity 0.25s", display: "flex", alignItems: "center", gap: 6 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
            ><Mail style={{ width: 14 }} /> admisiones@barkley.cl</a>
            <button onClick={() => setCallOpen(true)}
              style={{ fontSize: 16, color: "#fff", background: "none", border: "none", cursor: "pointer", opacity: 0.6, transition: "opacity 0.25s", padding: 0, display: "flex", alignItems: "center", gap: 6, textAlign: "left" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
            ><Phone style={{ width: 14 }} /> Agendar llamada</button>
          </div>
        </div>
        <p style={{ fontSize: 14, opacity: 0.35, marginTop: 48 }}>© {new Date().getFullYear()} Barkley Online</p>
      </footer>

      <ReservationDialog open={callOpen} onOpenChange={setCallOpen} />
    </div>
  );
}
