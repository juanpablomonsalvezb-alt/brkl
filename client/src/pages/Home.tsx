import { useState, useEffect, useRef } from "react";
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
  Gauge,
  GraduationCap,
  Users,
  Calculator,
  FlaskConical,
  BookOpen,
  Landmark,
  Languages as LanguagesIcon,
  Palette,
  LayoutDashboard,
  PlayCircle,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { motion, useMotionValue, useSpring, useScroll, useTransform } from "framer-motion";
import { ReservationDialog } from "@/components/ReservationDialog";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

/** Contador animado que arranca al entrar en viewport (transición real). */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 1600, bounce: 0 });
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => spring.on("change", (v) => setVal(Math.round(v))), [spring]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          mv.set(to);
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, mv]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

/** Formulario de inscripción — instancia independiente (usado en 2 lugares). */
function InscripcionForm({ idPrefix }: { idPrefix: string }) {
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
      if (!res.ok) {
        setErr(data.message || "No se pudo enviar tu solicitud");
        setState("error");
        return;
      }
      setState(data.alreadySubscribed ? "duplicate" : "success");
    } catch {
      setErr("Sin conexión, intenta de nuevo");
      setState("error");
    }
  };

  if (state === "success" || state === "duplicate") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg bg-muted p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-7 w-7" />
        </div>
        <p className="font-display text-xl font-bold text-primary">
          {state === "duplicate" ? "Ya tenemos tu inscripción." : "¡Inscripción recibida!"}
        </p>
        <p className="text-sm text-muted-foreground">
          Un asesor de admisión te contactará para conversar tu caso.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <div className="col-span-full">
        <Label htmlFor={`${idPrefix}-name`} className="text-sm font-medium text-foreground/80">
          Nombre del apoderado o estudiante <span className="text-destructive">*</span>
        </Label>
        <Input id={`${idPrefix}-name`} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" className="mt-1.5 h-12" data-testid={`input-name-${idPrefix}`} />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-email`} className="text-sm font-medium text-foreground/80">
          Correo electrónico <span className="text-destructive">*</span>
        </Label>
        <Input id={`${idPrefix}-email`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className="mt-1.5 h-12" data-testid={`input-email-${idPrefix}`} />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-level`} className="text-sm font-medium text-foreground/80">Nivel de interés</Label>
        <select id={`${idPrefix}-level`} value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1.5 h-12 w-full rounded-md border border-input bg-background px-3 text-base text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring" data-testid={`select-level-${idPrefix}`}>
          <option value="">Selecciona un nivel</option>
          {["5° Básico", "6° Básico", "7° Básico", "8° Básico", "1° Medio", "2° Medio", "3° Medio", "4° Medio", "Validación de estudios (adulto)"].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      {state === "error" && <p className="col-span-full text-sm font-medium text-destructive">{err}</p>}
      <Button type="submit" disabled={state === "loading"} className="col-span-full mt-1 h-12 rounded-md bg-primary text-base font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60" data-testid={`button-submit-${idPrefix}`}>
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Quiero inscribirme<ArrowRight className="ml-2 h-4 w-4" /></>}
      </Button>
      <p className="col-span-full text-center text-xs text-muted-foreground">
        Sin compromiso · sin costo en esta etapa · cupos generación fundadora 2027
      </p>
    </form>
  );
}

/** Recorrido por la plataforma — tabs con pantallas mock construidas en código. */
function PlatformPreview() {
  const [tab, setTab] = useState(0);
  const tabs = ["Panel del estudiante", "Lección asincrónica", "Avance y logros"];

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === i ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70 hover:bg-muted/70"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Marco de navegador */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-premium-lg">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-secondary/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/40" />
          <span className="ml-3 font-label text-[10px] text-muted-foreground">app.barkley.cl</span>
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="p-5 md:p-7">
          {tab === 0 && (
            <div className="space-y-3">
              {[
                ["Matemática · 8° Básico", 72],
                ["Lenguaje · 8° Básico", 54],
                ["Ciencias · 8° Básico", 88],
              ].map(([c, p]) => (
                <div key={c as string} className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">{c}</span>
                    <span className="text-xs text-muted-foreground">{p}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${p}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 1 && (
            <div className="space-y-3">
              {["Bloque 1 · Video (6 min)", "Bloque 2 · Lectura guiada", "Pausa activa", "Bloque 3 · Quiz de práctica"].map((b, i) => (
                <div key={b} className="flex items-center gap-3 rounded-lg border border-border p-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                  <span className="text-sm text-foreground/80">{b}</span>
                  {i < 2 && <Check className="ml-auto h-4 w-4 text-success" />}
                </div>
              ))}
            </div>
          )}
          {tab === 2 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Unidades", "12 / 18"],
                ["Promedio", "6,3"],
                ["Racha", "9 días"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border p-4 text-center">
                  <div className="font-display text-2xl font-bold text-primary">{v}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{k}</div>
                </div>
              ))}
              <div className="col-span-3 rounded-lg border border-border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Gauge className="h-4 w-4 text-secondary" /> El sistema ajustó tu plan: +2 sesiones de refuerzo en Lenguaje.
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
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
  { label: "La plataforma", href: "#plataforma" },
  { label: "Asignaturas", href: "#asignaturas" },
  { label: "Inscripción", href: "#inscripcion" },
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

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=70";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const photoY = useTransform(heroProgress, [0, 1], ["0%", "12%"]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [photoOk, setPhotoOk] = useState(true);

  const { data: faqs } = useQuery<Faq[]>({
    queryKey: ["/api/faqs"],
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goInscripcion = () => document.getElementById("inscripcion")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="relative bg-background font-sans text-foreground">
      <div className="grain-overlay pointer-events-none fixed inset-0 z-[1] opacity-[0.025] mix-blend-multiply" />
      {/* ===== BARRA SUPERIOR ===== */}
      <div className="bg-primary px-4 py-2 text-primary-foreground">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-1.5 text-xs sm:flex-row sm:text-sm">
          <span className="font-medium">Generación fundadora · Inscripciones abren marzo 2027</span>
          <div className="flex items-center gap-4 text-primary-foreground/85">
            <a href="mailto:admisiones@barkley.cl" className="flex items-center gap-1.5 hover:text-secondary">
              <Mail className="h-3.5 w-3.5" /> admisiones@barkley.cl
            </a>
            <button onClick={() => setCallDialogOpen(true)} className="flex items-center gap-1.5 hover:text-secondary">
              <Phone className="h-3.5 w-3.5" /> Agendar llamada
            </button>
          </div>
        </div>
      </div>

      {/* ===== NAV ===== */}
      <header className={`sticky top-0 z-50 bg-background transition-shadow ${scrolled ? "border-b border-border shadow-md" : "border-b border-transparent"}`}>
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6 md:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-secondary bg-primary font-display text-xl text-primary-foreground">B</div>
            <div className="leading-tight">
              <div className="font-display text-xl font-bold text-primary">Barkley Online</div>
              <div className="font-label text-[10px] text-muted-foreground">Colegio asincrónico · Chile</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-foreground/75 transition-colors hover:text-primary">{l.label}</a>
            ))}
          </nav>
          <div className="hidden lg:flex">
            <Button onClick={goInscripcion} className="rounded-md bg-secondary font-semibold text-secondary-foreground transition-all hover:-translate-y-0.5 hover:bg-secondary/90 hover:shadow-lg hover:shadow-secondary/30">
              Inscríbete
            </Button>
          </div>
          <button className="p-2 lg:hidden" onClick={() => setMobileMenuOpen((v) => !v)} aria-label="Menú">{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
        {mobileMenuOpen && (
          <div className="flex flex-col gap-4 border-t border-border bg-background px-6 py-6 lg:hidden">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-foreground/80">{l.label}</a>
            ))}
            <Button onClick={() => { setMobileMenuOpen(false); goInscripcion(); }} className="mt-2 rounded-md bg-secondary font-semibold text-secondary-foreground">Inscríbete</Button>
          </div>
        )}
      </header>

      {/* ===== HERO con fotografía dúotono + formulario ===== */}
      <section ref={heroRef} className="relative isolate overflow-hidden bg-primary">
        {/* Grano táctil — profundidad, no decoración hueca */}
        <div className="grain-overlay pointer-events-none absolute inset-0 z-[2] opacity-[0.06] mix-blend-overlay" />

        {/* Foto de fondo con parallax + tratamiento dúotono navy/dorado (no overlay plano genérico) */}
        {photoOk && (
          <motion.img
            style={{ y: photoY, filter: "grayscale(1) contrast(1.15)" }}
            src={HERO_PHOTO}
            alt="Estudiante aprendiendo en casa a su propio ritmo"
            onError={() => setPhotoOk(false)}
            className="absolute inset-x-0 -top-10 h-[115%] w-full object-cover"
          />
        )}
        {/* Capa 1: navy multiply — tiñe la foto del color de marca en vez de oscurecerla plano */}
        <div className="absolute inset-0" style={{ background: "hsl(218 60% 22%)", mixBlendMode: "multiply" }} />
        {/* Capa 2: degradé direccional para legibilidad del texto */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, hsl(218 52% 12% / 0.92) 0%, hsl(218 52% 13% / 0.78) 45%, hsl(218 50% 15% / 0.5) 100%)",
          }}
        />
        {/* Capa 3: insinuación dorada en el borde — firma de marca, sutil */}
        <div
          className="absolute inset-0 mix-blend-screen"
          style={{ background: "radial-gradient(ellipse 60% 50% at 85% 15%, hsl(38 75% 50% / 0.18), transparent 70%)" }}
        />

        <div className="relative z-[3] mx-auto grid max-w-[1280px] items-center gap-10 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-primary-foreground">
            <p className="font-label gold-rule mb-4 text-xs text-secondary">Educación básica y media · Reconocimiento MINEDUC</p>
            <h1 className="mb-6 font-display text-4xl font-bold leading-[1.08] md:text-[3.5rem]">
              El colegio que se adapta a{" "}
              <span className="relative inline-block text-secondary">
                tu ritmo
                <motion.svg
                  className="absolute -bottom-1.5 left-0 w-full"
                  height="10"
                  viewBox="0 0 220 10"
                  preserveAspectRatio="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.6, ease: "easeInOut" }}
                >
                  <motion.path
                    d="M2 7C50 2 170 2 218 7"
                    fill="none"
                    stroke="hsl(var(--secondary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </motion.svg>
              </span>
              , no al revés.
            </h1>
            <p className="mb-6 max-w-[50ch] text-lg leading-relaxed text-primary-foreground/85">
              Colegio <strong className="text-secondary">100% asincrónico</strong>: sin clases en vivo por Zoom o
              Meet, sin horario fijo. Desde 5° básico a 4° medio — y validación para adultos — preparándote para
              rendir <strong className="text-secondary">exámenes libres</strong> ante el MINEDUC.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-primary-foreground/80">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-secondary" /> Aprende a tu propio ritmo</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-secondary" /> Acompañamiento de un asesor real</span>
            </div>
          </motion.div>

          {/* Formulario grande (reemplaza el antiguo "tu semana / tu ritmo") */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }} id="inscripcion-hero" className="shadow-premium-lg rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="mb-1 flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-secondary" />
              <span className="font-label text-xs text-secondary">Generación fundadora 2027</span>
            </div>
            <h2 className="mb-2 font-display text-2xl font-bold text-primary">Inscríbete sin compromiso</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Déjanos tus datos y un asesor te contacta para conversar tu caso.
            </p>
            <InscripcionForm idPrefix="hero" />
          </motion.div>
        </div>
      </section>

      {/* ===== CIFRAS con transición ===== */}
      <section className="bg-primary py-10 text-primary-foreground md:py-14">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-8 px-6 text-center md:grid-cols-4 md:px-10">
          {[
            { node: <><CountUp to={9} /> niveles</>, label: "5° básico a 4° medio" },
            { node: <CountUp to={100} suffix="%" />, label: "Alineado a bases MINEDUC" },
            { node: <CountUp to={0} />, label: "Clases por Zoom o Meet" },
            { node: <>2027</>, label: "Generación fundadora" },
          ].map((s, i) => (
            <motion.div key={i} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <div className="font-display text-3xl font-bold md:text-4xl">{s.node}</div>
              <div className="mt-2 text-xs text-primary-foreground/75 md:text-sm">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== LA PLATAFORMA POR DENTRO ===== */}
      <section id="plataforma" className="py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <motion.div {...fadeUp}>
              <p className="font-label gold-rule mb-3 text-xs text-secondary">La plataforma por dentro</p>
              <h2 className="mb-4 font-display text-3xl font-bold text-primary md:text-4xl">
                Mira cómo se ve aprender en Barkley.
              </h2>
              <p className="mb-6 leading-relaxed text-foreground/70">
                Una plataforma propia, construida desde cero para el aprendizaje asincrónico. Cada lección en
                bloques, cada avance medido, cada plan ajustado a tu rendimiento real — sin clases en vivo.
              </p>
              <ul className="mb-8 space-y-3 text-sm text-foreground/75">
                {[
                  [LayoutDashboard, "Panel claro: tus cursos y tu avance de un vistazo"],
                  [BookOpen, "Lecciones en bloques cortos, disponibles 24/7"],
                  [Gauge, "El sistema mide y ajusta tu plan automáticamente"],
                ].map(([Icon, t]) => (
                  <li key={t as string} className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" strokeWidth={1.75} />
                    <span>{t as string}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => setCallDialogOpen(true)} className="inline-flex items-center gap-2 font-semibold text-primary underline-offset-4 hover:text-secondary hover:underline">
                <PlayCircle className="h-5 w-5" /> Agenda un recorrido guiado
              </button>
            </motion.div>
            <motion.div {...fadeUp}>
              <PlatformPreview />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== ASIGNATURAS ===== */}
      <section id="asignaturas" className="bg-muted py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <motion.div {...fadeUp} className="mb-10">
            <p className="font-label gold-rule mb-3 text-xs text-secondary">Plan de estudios</p>
            <h2 className="max-w-[30ch] font-display text-3xl font-bold text-primary md:text-4xl">
              Áreas alineadas a las bases curriculares del MINEDUC.
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {ASIGNATURAS.map((a, i) => (
              <motion.div key={a.name} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.06 }} className="rounded-lg border border-border bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-secondary hover:shadow-md">
                <a.icon className="mx-auto mb-3 h-7 w-7 text-secondary" strokeWidth={1.5} />
                <span className="text-sm font-semibold text-primary">{a.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PARA QUIÉN ===== */}
      <section className="bg-primary py-16 text-primary-foreground md:py-20">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-6 md:grid-cols-2 md:px-10">
          <motion.div {...fadeUp}>
            <p className="font-label gold-rule mb-3 text-xs text-secondary">Para quién es</p>
            <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">Pensado para quien necesita otro ritmo.</h2>
            <p className="leading-relaxed text-primary-foreground/80">
              Estudiantes que aprenden distinto, familias que quieren acompañamiento real, y adultos que buscan
              completar su enseñanza media por la vía de exámenes libres.
            </p>
          </motion.div>
          <motion.div {...fadeUp} className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: GraduationCap, t: "5° básico a 4° medio", b: "Educación básica y media completa, online." },
              { icon: Brain, t: "Ritmos y perfiles diversos", b: "Acomodaciones para quienes aprenden distinto." },
              { icon: Users, t: "Familias presentes", b: "Portal de apoderados para seguir el avance." },
              { icon: GraduationCap, t: "Adultos", b: "Validación de estudios y exámenes libres." },
            ].map((c) => (
              <div key={c.t} className="rounded-lg bg-primary-foreground/10 p-5">
                <c.icon className="mb-3 h-6 w-6 text-secondary" strokeWidth={1.75} />
                <h3 className="mb-1 font-display font-bold">{c.t}</h3>
                <p className="text-sm text-primary-foreground/75">{c.b}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== MÉTODO ===== */}
      <section id="metodo" className="py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <motion.div {...fadeUp} className="mb-12">
            <p className="font-label gold-rule mb-3 text-xs text-secondary">Nuestro método</p>
            <h2 className="mb-4 max-w-[34ch] font-display text-3xl font-bold text-primary md:text-4xl">
              Un modelo educativo con fundamento, no una promesa vacía.
            </h2>
            <p className="max-w-[60ch] leading-relaxed text-foreground/70">
              Construimos el plan de estudio alrededor de cómo los estudiantes aprenden a sostener el foco y a
              organizar su propio aprendizaje — base del modelo del Dr. Russell Barkley.
            </p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {PRINCIPIOS.map((p, i) => (
              <motion.div key={p.title} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }} className="rounded-lg border border-border bg-card p-7 transition-shadow hover:shadow-premium-lg">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <p.icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="mb-3 font-display text-lg font-bold text-primary">{p.title}</h3>
                <p className="text-[15px] leading-relaxed text-foreground/70">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== INSCRIPCIÓN (2do lugar del formulario) ===== */}
      <section id="inscripcion" className="scroll-mt-24 bg-muted py-16 md:py-24">
        <div className="mx-auto grid max-w-[1100px] items-center gap-10 px-6 md:px-10 lg:grid-cols-[1fr_1.1fr]">
          <motion.div {...fadeUp}>
            <p className="font-label gold-rule mb-3 text-xs text-secondary">Admisión generación fundadora 2027</p>
            <h2 className="mb-4 font-display text-3xl font-bold text-primary md:text-4xl">
              Asegura tu cupo para marzo de 2027.
            </h2>
            <p className="mb-6 leading-relaxed text-foreground/70">
              Las inscripciones de la generación fundadora son limitadas. Déjanos tus datos y un asesor de
              admisión te contacta — sin costo, sin obligación de continuar.
            </p>
            <ul className="space-y-2 text-sm text-foreground/75">
              {["Respuesta de un asesor real, no un bot", "No se requiere pago en esta etapa", "Te explicamos el modelo asincrónico paso a paso"].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />{t}</li>
              ))}
            </ul>
          </motion.div>
          <motion.div {...fadeUp} className="rounded-2xl border border-border bg-card shadow-premium-lg p-7 md:p-8">
            <InscripcionForm idPrefix="sec" />
          </motion.div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <motion.section {...fadeUp} id="faq" className="py-16 md:py-24">
        <div className="mx-auto max-w-[760px] px-6 md:px-10">
          <p className="font-label gold-rule justify-center mb-3 text-center text-xs text-secondary">Preguntas frecuentes</p>
          <h2 className="mb-12 text-center font-display text-3xl font-bold text-primary">Antes de inscribirte</h2>
          {faqs && faqs.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f) => (
                <AccordionItem key={f.id} value={f.id} className="rounded-md border border-border bg-card px-6">
                  <AccordionTrigger className="py-4 text-left font-display text-base font-bold text-primary hover:no-underline">{f.question}</AccordionTrigger>
                  <AccordionContent className="pb-4 leading-relaxed text-foreground/70">{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Aún no hay preguntas publicadas.</p>
          )}
        </div>
      </motion.section>

      {/* ===== CTA FINAL ===== */}
      <motion.section {...fadeUp} className="bg-primary px-6 py-16 text-center text-primary-foreground">
        <h2 className="mx-auto mb-4 max-w-[28ch] font-display text-3xl font-bold md:text-4xl">Conversemos sobre la educación de tu hijo o hija.</h2>
        <p className="mx-auto mb-8 max-w-[50ch] text-primary-foreground/75">Inscríbete o agenda una llamada con un asesor de admisión — sin costo, sin compromiso.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button onClick={goInscripcion} className="h-12 rounded-md bg-secondary px-8 font-semibold text-secondary-foreground transition-all hover:-translate-y-0.5 hover:bg-secondary/90 hover:shadow-lg hover:shadow-secondary/30">
            Inscríbete ahora
          </Button>
          <button onClick={() => setCallDialogOpen(true)} className="flex h-12 items-center gap-2 rounded-md border border-primary-foreground/30 px-6 font-semibold hover:bg-primary-foreground/10">
            <Phone className="h-4 w-4" /> Agendar llamada
          </button>
        </div>
      </motion.section>

      {/* ===== FOOTER (navy explícito + texto claro) ===== */}
      <footer style={{ backgroundColor: "hsl(218 52% 14%)", color: "hsl(42 38% 92%)" }} className="px-6 py-12">
        <div className="mx-auto grid max-w-[1280px] gap-8 text-sm md:grid-cols-3">
          <div>
            <div className="mb-2 font-display text-lg font-bold text-white">Barkley Online</div>
            <p className="leading-relaxed text-white/65">
              Colegio online asincrónico · Chile
              <br />
              Generación fundadora — apertura marzo 2027
            </p>
          </div>
          <div>
            <div className="font-label mb-3 text-xs text-secondary">Contacto</div>
            <p className="mb-2 flex items-center gap-2 text-white/80"><Mail className="h-4 w-4" /> admisiones@barkley.cl</p>
            <button onClick={() => setCallDialogOpen(true)} className="flex items-center gap-2 text-white/80 hover:text-secondary"><Phone className="h-4 w-4" /> Agendar llamada con asesor</button>
          </div>
          <div>
            <div className="font-label mb-3 text-xs text-secondary">Navegación</div>
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((l) => (<a key={l.href} href={l.href} className="text-white/80 hover:text-secondary">{l.label}</a>))}
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-[1280px] border-t border-white/15 pt-6 text-xs text-white/50">
          © {new Date().getFullYear()} Barkley Online. Todos los derechos reservados.
        </div>
      </footer>

      <ReservationDialog open={callDialogOpen} onOpenChange={setCallDialogOpen} />
    </div>
  );
}
