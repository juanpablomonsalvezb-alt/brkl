import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Menu,
  X,
  ArrowRight,
  Brain,
  Compass,
  ShieldCheck,
  Loader2,
  Check,
  Phone,
  Mail,
  Clock,
  CalendarX,
  Gauge,
  Sparkles,
  GraduationCap,
  Users,
  Calculator,
  FlaskConical,
  BookOpen,
  Landmark,
  Languages as LanguagesIcon,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ReservationDialog } from "@/components/ReservationDialog";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

function CountUp({ to, duration = 1.4 }: { to: number; duration?: number }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const rounded = useTransform(spring, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const unsub = rounded.on("change", (v) => setDisplay(v));
    mv.set(to);
    return unsub;
  }, [to]);
  return <>{display}</>;
}

interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
  sortOrder: number;
}

const NAV_LINKS = [
  { label: "El método", href: "#metodo" },
  { label: "Cómo funciona", href: "#funciona" },
  { label: "Asignaturas", href: "#asignaturas" },
  { label: "Admisión", href: "#matricula" },
  { label: "Preguntas", href: "#faq" },
];

const PRINCIPIOS = [
  {
    icon: Brain,
    title: "Función ejecutiva primero",
    body: "Adaptamos el modelo de autorregulación del Dr. Russell Barkley al currículum chileno: cada estudiante aprende a planificar, sostener la atención y autoevaluarse antes de avanzar.",
  },
  {
    icon: Compass,
    title: "Aprendizaje asincrónico",
    body: "Sin clases en vivo por Zoom o Google Meet, sin horario predeterminado. El estudiante avanza cuando rinde mejor; el sistema acompaña, no impone una hora.",
  },
  {
    icon: ShieldCheck,
    title: "Preparación para exámenes libres",
    body: "Currículum alineado a las bases del MINEDUC. Preparamos a cada estudiante para rendir exámenes libres y obtener su licencia de enseñanza media por la vía oficial.",
  },
];

const ASIGNATURAS = [
  { icon: Calculator, name: "Matemática" },
  { icon: FlaskConical, name: "Ciencias" },
  { icon: BookOpen, name: "Lenguaje" },
  { icon: Landmark, name: "Historia" },
  { icon: LanguagesIcon, name: "Inglés" },
  { icon: Palette, name: "Electivos" },
];

const SEMANA = [
  { dia: "LUN", bloque: "Matemática · 2 bloques", t: "10:00" },
  { dia: "MAR", bloque: "Lenguaje · ensayo", t: "tú eliges" },
  { dia: "MIÉ", bloque: "Ciencias · laboratorio", t: "16:30" },
  { dia: "JUE", bloque: "Libre · descanso activo", t: "—" },
  { dia: "VIE", bloque: "Historia · quiz unidad", t: "tú eliges" },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [levelInterest, setLevelInterest] = useState("");
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error" | "duplicate">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: faqs } = useQuery<Faq[]>({
    queryKey: ["/api/faqs"],
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitMatricula = async () => {
    setFormState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, levelInterest: levelInterest || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "No se pudo enviar tu solicitud");
        setFormState("error");
        return;
      }
      setFormState(data.alreadySubscribed ? "duplicate" : "success");
    } catch {
      setErrorMsg("Sin conexión, intenta de nuevo");
      setFormState("error");
    }
  };

  const matriculaForm = (
    <>
      {formState === "success" || formState === "duplicate" ? (
        <div className="bg-muted rounded-lg p-6 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Check className="w-6 h-6" />
          </div>
          <p className="font-display text-lg font-bold text-primary">
            {formState === "duplicate" ? "Ya tenemos tu solicitud." : "Solicitud recibida."}
          </p>
          <p className="text-sm text-muted-foreground">
            Un asesor de admisión te contactará a la brevedad.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitMatricula();
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="col-span-full">
            <Label htmlFor="name-m" className="text-sm font-medium text-foreground/80">
              Nombre del apoderado o estudiante <span className="text-destructive">*</span>
            </Label>
            <Input id="name-m" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" className="mt-1.5 h-12" data-testid="input-name-matricula" />
          </div>
          <div>
            <Label htmlFor="email-m" className="text-sm font-medium text-foreground/80">
              Correo electrónico <span className="text-destructive">*</span>
            </Label>
            <Input id="email-m" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className="mt-1.5 h-12" data-testid="input-email-matricula" />
          </div>
          <div>
            <Label htmlFor="level-m" className="text-sm font-medium text-foreground/80">Nivel de interés</Label>
            <select id="level-m" value={levelInterest} onChange={(e) => setLevelInterest(e.target.value)} className="mt-1.5 w-full h-12 px-3 bg-background border border-input rounded-md text-base text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring" data-testid="select-level-matricula">
              <option value="">Selecciona un nivel</option>
              {["5° Básico", "6° Básico", "7° Básico", "8° Básico", "1° Medio", "2° Medio", "3° Medio", "4° Medio", "Validación de estudios (adulto)"].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          {formState === "error" && <p className="col-span-full text-destructive text-sm font-medium">{errorMsg}</p>}
          <Button type="submit" disabled={formState === "loading"} className="col-span-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground rounded-md h-12 text-base font-semibold mt-1 transition-all hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5" data-testid="button-submit-matricula">
            {formState === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enviar solicitud<ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
          <p className="col-span-full text-xs text-muted-foreground text-center">
            Sin compromiso. No se requiere pago en esta etapa.
          </p>
        </form>
      )}
    </>
  );

  return (
    <div className="bg-background text-foreground font-sans">
      {/* ===== BARRA SUPERIOR ===== */}
      <div className="bg-primary text-primary-foreground py-2 px-4">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs sm:text-sm">
          <span className="font-medium">Generación fundadora · Matrículas abren marzo 2027</span>
          <div className="flex items-center gap-4 text-primary-foreground/85">
            <a href="mailto:admisiones@barkley.cl" className="flex items-center gap-1.5 hover:text-secondary">
              <Mail className="w-3.5 h-3.5" /> admisiones@barkley.cl
            </a>
            <button onClick={() => setCallDialogOpen(true)} className="flex items-center gap-1.5 hover:text-secondary">
              <Phone className="w-3.5 h-3.5" /> Agendar llamada
            </button>
          </div>
        </div>
      </div>

      {/* ===== NAV ===== */}
      <header className={`sticky top-0 z-50 bg-background transition-shadow ${scrolled ? "shadow-md border-b border-border" : "border-b border-transparent"}`}>
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-xl border-2 border-secondary">B</div>
            <div className="leading-tight">
              <div className="font-display text-xl font-bold text-primary">Barkley Online</div>
              <div className="font-label text-[10px] text-muted-foreground">Colegio asincrónico · Chile</div>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-foreground/75 hover:text-primary transition-colors">{l.label}</a>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            <Button onClick={() => document.getElementById("matricula")?.scrollIntoView({ behavior: "smooth" })} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-md font-semibold transition-all hover:shadow-lg hover:shadow-secondary/30 hover:-translate-y-0.5">
              Matricúlate sin compromiso
            </Button>
          </div>
          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen((v) => !v)} aria-label="Menú">{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden bg-background border-t border-border px-6 py-6 flex flex-col gap-4">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-foreground/80">{l.label}</a>
            ))}
            <Button onClick={() => { setMobileMenuOpen(false); document.getElementById("matricula")?.scrollIntoView({ behavior: "smooth" }); }} className="bg-secondary text-secondary-foreground rounded-md font-semibold mt-2">Matricúlate sin compromiso</Button>
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section id="inicio" className="py-12 md:py-20 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="font-label text-xs text-secondary mb-4">Educación básica y media · Reconocimiento MINEDUC</p>
            <h1 className="font-display text-4xl md:text-[3.4rem] font-bold leading-[1.1] mb-6">
              El colegio que se adapta{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">a tu ritmo</span>, no al revés.
            </h1>
            <p className="text-lg text-foreground/75 leading-relaxed mb-6 max-w-[52ch]">
              Barkley Online es un colegio <strong className="text-primary">100% asincrónico</strong>: sin clases en
              vivo por Zoom o Meet, sin horario predeterminado. Desde 5° básico a 4° medio — y validación de estudios
              para adultos — preparándote para rendir <strong className="text-primary">exámenes libres</strong> ante el MINEDUC.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button onClick={() => document.getElementById("matricula")?.scrollIntoView({ behavior: "smooth" })} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md h-12 px-6 font-semibold transition-all hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5">
                Matricúlate sin compromiso <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <a href="#funciona" className="text-sm font-semibold text-primary hover:text-secondary underline underline-offset-4">Cómo funciona el modelo →</a>
            </div>
          </motion.div>

          {/* Visual construido en código: planificador semanal asincrónico (no foto stock) */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }} className="relative">
            <div className="absolute -inset-3 bg-gradient-to-br from-secondary/15 to-primary/10 rounded-2xl blur-xl" />
            <div className="relative bg-paper-card border border-border rounded-xl shadow-xl p-5 md:p-6" style={{ background: "hsl(var(--card))" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarX className="w-5 h-5 text-secondary" />
                  <span className="font-display font-bold text-primary">Tu semana, tu ritmo</span>
                </div>
                <span className="font-label text-[10px] text-muted-foreground">SIN HORARIO FIJO</span>
              </div>
              <div className="space-y-2">
                {SEMANA.map((d, i) => (
                  <motion.div
                    key={d.dia}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                    className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5"
                  >
                    <span className="font-label text-[10px] w-9 text-secondary">{d.dia}</span>
                    <span className="flex-1 text-sm text-foreground/80">{d.bloque}</span>
                    <span className={`text-xs font-medium ${d.t === "tú eliges" ? "text-secondary" : "text-muted-foreground"}`}>{d.t}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2.5">
                <Gauge className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-foreground/70">El sistema mide tus resultados y ajusta el plan de la próxima semana.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== CIFRAS REALES ===== */}
      <motion.section {...fadeUp} className="bg-primary text-primary-foreground py-10 md:py-14">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: <><CountUp to={9} />&nbsp;niveles</>, label: "5° básico a 4° medio" },
            { value: <><CountUp to={100} />%</>, label: "Alineado a bases MINEDUC" },
            { value: <><CountUp to={0} /></>, label: "Clases por Zoom o Meet" },
            { value: "2027", label: "Generación fundadora" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
              <div className="font-display text-3xl md:text-4xl font-bold">{s.value}</div>
              <div className="text-xs md:text-sm text-primary-foreground/75 mt-2">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ===== LA DIFERENCIA: tradicional vs Barkley ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <motion.div {...fadeUp} className="text-center mb-12">
            <p className="font-label text-xs text-secondary mb-3">Por qué somos distintos</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary max-w-[28ch] mx-auto">
              El colegio online típico copió la sala de clases a una pantalla. Nosotros no.
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div {...fadeUp} className="rounded-lg border border-border bg-muted/40 p-7">
              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <Clock className="w-5 h-5" />
                <span className="font-display font-bold">Colegio online tradicional</span>
              </div>
              <ul className="space-y-3 text-sm text-foreground/70">
                {["Clases en vivo por Zoom a una hora fija", "Si te pierdes la sesión, te atrasas", "El mismo ritmo para todos los estudiantes", "Avanzas aunque no hayas dominado la unidad"].map((t) => (
                  <li key={t} className="flex items-start gap-2"><X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />{t}</li>
                ))}
              </ul>
            </motion.div>
            <motion.div {...fadeUp} className="rounded-lg border-2 border-secondary bg-secondary/5 p-7">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Sparkles className="w-5 h-5 text-secondary" />
                <span className="font-display font-bold">Barkley Online — asincrónico</span>
              </div>
              <ul className="space-y-3 text-sm text-foreground/80">
                {["Estudias cuando rindes mejor, sin horario fijo", "Todo el material disponible 24/7, a tu ritmo", "Un algoritmo ajusta el plan a tu avance real", "No avanzas de unidad sin dominarla (≥70%)"].map((t) => (
                  <li key={t} className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" />{t}</li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== CÓMO FUNCIONA EL ALGORITMO ===== */}
      <section id="funciona" className="bg-muted py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <motion.div {...fadeUp} className="mb-12 max-w-[60ch]">
            <p className="font-label text-xs text-secondary mb-3">Cómo funciona</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
              Un algoritmo que mide, ajusta y acompaña — semana a semana.
            </h2>
            <p className="text-foreground/70 leading-relaxed">
              No es inteligencia artificial generativa: es seguimiento determinístico de tus resultados.
              Cada entrega alimenta tu plan, y tu asesor recibe alertas cuando algo necesita atención.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: "1", icon: BookOpen, t: "Estudias", b: "Avanzas por unidades con material disponible siempre, a tu propio ritmo." },
              { n: "2", icon: Gauge, t: "El sistema mide", b: "Cada quiz y entrega registra tu dominio real de cada unidad." },
              { n: "3", icon: Compass, t: "Ajusta el plan", b: "Refuerza lo que cuesta, desbloquea lo siguiente solo cuando dominas (≥70%)." },
              { n: "4", icon: Users, t: "Tu asesor actúa", b: "Recibe alertas por inactividad o notas bajas y te contacta antes de que sea tarde." },
            ].map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay: i * 0.1 }} className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display text-2xl font-bold text-secondary/40">{s.n}</span>
                  <s.icon className="w-6 h-6 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-base font-bold text-primary mb-2">{s.t}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">{s.b}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ASIGNATURAS ===== */}
      <section id="asignaturas" className="py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <motion.div {...fadeUp} className="mb-10">
            <p className="font-label text-xs text-secondary mb-3">Plan de estudios</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary max-w-[30ch]">
              Áreas alineadas a las bases curriculares del MINEDUC.
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {ASIGNATURAS.map((a, i) => (
              <motion.div key={a.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }} className="rounded-lg border border-border bg-card p-5 text-center hover:border-secondary hover:shadow-md transition-all">
                <a.icon className="w-7 h-7 text-secondary mx-auto mb-3" strokeWidth={1.5} />
                <span className="text-sm font-semibold text-primary">{a.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PARA QUIÉN ===== */}
      <section className="bg-primary text-primary-foreground py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 grid md:grid-cols-2 gap-10 items-center">
          <motion.div {...fadeUp}>
            <p className="font-label text-xs text-secondary mb-3">Para quién es</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Pensado para quien el colegio tradicional dejó fuera.</h2>
            <p className="text-primary-foreground/80 leading-relaxed">
              Estudiantes que necesitan otro ritmo, familias que buscan acompañamiento real, y adultos que
              quieren completar su enseñanza media por la vía de exámenes libres.
            </p>
          </motion.div>
          <motion.div {...fadeUp} className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: GraduationCap, t: "5° básico a 4° medio", b: "Educación básica y media completa, online." },
              { icon: Brain, t: "Ritmos y perfiles diversos", b: "Acomodaciones para quienes aprenden distinto." },
              { icon: Users, t: "Familias presentes", b: "Portal de apoderados para seguir el avance." },
              { icon: GraduationCap, t: "Adultos", b: "Validación de estudios y exámenes libres." },
            ].map((c) => (
              <div key={c.t} className="rounded-lg bg-primary-foreground/10 p-5">
                <c.icon className="w-6 h-6 text-secondary mb-3" strokeWidth={1.75} />
                <h3 className="font-display font-bold mb-1">{c.t}</h3>
                <p className="text-sm text-primary-foreground/75">{c.b}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== MÉTODO ===== */}
      <section id="metodo" className="py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <motion.div {...fadeUp} className="mb-12">
            <p className="font-label text-xs text-secondary mb-3">Nuestro método</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary max-w-[34ch] mb-4">
              Un modelo educativo con fundamento, no una promesa vacía.
            </h2>
            <p className="text-foreground/70 max-w-[60ch] leading-relaxed">
              Construimos el plan de estudio alrededor de cómo los estudiantes aprenden a sostener el foco
              y a organizar su propio aprendizaje — base del modelo del Dr. Russell Barkley.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {PRINCIPIOS.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay: i * 0.1 }} className="bg-card border border-border rounded-lg p-7 transition-shadow hover:shadow-xl">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <p.icon className="w-6 h-6 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-lg font-bold text-primary mb-3">{p.title}</h3>
                <p className="text-foreground/70 leading-relaxed text-[15px]">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MATRÍCULA (form grande, énfasis) ===== */}
      <section id="matricula" className="scroll-mt-24 bg-muted py-16 md:py-24">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10 grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
          <motion.div {...fadeUp}>
            <p className="font-label text-xs text-secondary mb-3">Admisión generación fundadora</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
              Matrícula sin compromiso.
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-6">
              Déjanos tus datos y un asesor de admisión te contacta para conversar tu caso. Sin costo, sin
              obligación de continuar. Los cupos de la generación fundadora son limitados.
            </p>
            <ul className="space-y-2 text-sm text-foreground/75">
              {["Respuesta de un asesor real, no un bot", "No se requiere pago en esta etapa", "Te explicamos el modelo asincrónico paso a paso"].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="w-4 h-4 text-success" />{t}</li>
              ))}
            </ul>
          </motion.div>
          <motion.div {...fadeUp} className="bg-card/80 backdrop-blur-md border border-border rounded-xl shadow-xl p-7 md:p-8">
            {matriculaForm}
          </motion.div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <motion.section {...fadeUp} id="faq" className="py-16 md:py-24">
        <div className="max-w-[760px] mx-auto px-6 md:px-10">
          <p className="font-label text-xs text-secondary mb-3 text-center">Preguntas frecuentes</p>
          <h2 className="font-display text-3xl font-bold text-primary text-center mb-12">Antes de matricularte</h2>
          {faqs && faqs.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f) => (
                <AccordionItem key={f.id} value={f.id} className="bg-card border border-border rounded-md px-6">
                  <AccordionTrigger className="font-display text-left text-base font-bold text-primary hover:no-underline py-4">{f.question}</AccordionTrigger>
                  <AccordionContent className="text-foreground/70 leading-relaxed pb-4">{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-muted-foreground text-sm">Aún no hay preguntas publicadas.</p>
          )}
        </div>
      </motion.section>

      {/* ===== CTA FINAL ===== */}
      <motion.section {...fadeUp} className="bg-primary text-primary-foreground py-16 px-6 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 max-w-[28ch] mx-auto">Conversemos sobre la educación de tu hijo o hija.</h2>
        <p className="text-primary-foreground/75 mb-8 max-w-[50ch] mx-auto">Completa el formulario de matrícula o agenda una llamada con un asesor — sin costo, sin compromiso.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button onClick={() => document.getElementById("matricula")?.scrollIntoView({ behavior: "smooth" })} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-md h-12 px-8 font-semibold transition-all hover:shadow-lg hover:shadow-secondary/30 hover:-translate-y-0.5">
            Ir al formulario de matrícula
          </Button>
          <button onClick={() => setCallDialogOpen(true)} className="h-12 px-6 rounded-md border border-primary-foreground/30 font-semibold hover:bg-primary-foreground/10 flex items-center gap-2">
            <Phone className="w-4 h-4" /> Agendar llamada
          </button>
        </div>
      </motion.section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-ink-deep text-primary-foreground py-12 px-6" style={{ backgroundColor: "hsl(218 52% 14%)" }}>
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="font-display text-lg font-bold mb-2">Barkley Online</div>
            <p className="text-primary-foreground/65 leading-relaxed">Colegio online asincrónico · Chile<br />Generación fundadora — apertura marzo 2027</p>
          </div>
          <div>
            <div className="font-label text-xs text-secondary mb-3">Contacto</div>
            <p className="flex items-center gap-2 text-primary-foreground/80 mb-2"><Mail className="w-4 h-4" /> admisiones@barkley.cl</p>
            <button onClick={() => setCallDialogOpen(true)} className="flex items-center gap-2 text-primary-foreground/80 hover:text-secondary"><Phone className="w-4 h-4" /> Agendar llamada con asesor</button>
          </div>
          <div>
            <div className="font-label text-xs text-secondary mb-3">Navegación</div>
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((l) => (<a key={l.href} href={l.href} className="text-primary-foreground/80 hover:text-secondary">{l.label}</a>))}
            </div>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto mt-10 pt-6 border-t border-primary-foreground/15 text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} Barkley Online. Todos los derechos reservados.
        </div>
      </footer>

      <ReservationDialog open={callDialogOpen} onOpenChange={setCallDialogOpen} />
    </div>
  );
}
