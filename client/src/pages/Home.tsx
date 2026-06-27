import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { Menu, X, ArrowRight, Brain, Compass, ShieldCheck, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ReservationDialog } from "@/components/ReservationDialog";

const LAUNCH_DATE = new Date("2027-03-01T08:00:00-04:00");

const PRINCIPIOS = [
  {
    n: "01",
    icon: Brain,
    title: "Función ejecutiva primero",
    body: "Adaptamos el modelo de autorregulación de Russell Barkley al currículum chileno: planificar, sostener atención y autoevaluarse antes de avanzar de contenido.",
  },
  {
    n: "02",
    icon: Compass,
    title: "Ritmo propio, meta común",
    body: "Sin clases sincrónicas obligatorias de 8 horas. Carga semanal según la curva de energía real de cada estudiante, con hitos quincenales verificables.",
  },
  {
    n: "03",
    icon: ShieldCheck,
    title: "Validado por el sistema",
    body: "Currículum alineado MINEDUC. Misma licencia de enseñanza media que un colegio presencial.",
  },
];

function useCountdown(target: Date) {
  const [diff, setDiff] = useState(() => Math.max(0, target.getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, target.getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

function MagneticButton({ children, onClick, className, type = "button", disabled }: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 14 });
  const sy = useSpring(y, { stiffness: 200, damping: 14 });

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - r.left - r.width / 2) * 0.3);
        y.set((e.clientY - r.top - r.height / 2) * 0.3);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      onClick={onClick}
      style={{ x: sx, y: sy }}
      className={className}
      data-testid="button-magnetic"
    >
      {children}
    </motion.button>
  );
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [levelInterest, setLevelInterest] = useState("");
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error" | "duplicate">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const cursorSx = useSpring(cursorX, { stiffness: 500, damping: 40 });
  const cursorSy = useSpring(cursorY, { stiffness: 500, damping: 40 });
  const [cursorHover, setCursorHover] = useState(false);

  const countdown = useCountdown(LAUNCH_DATE);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursorX.set(e.clientX - 12);
      cursorY.set(e.clientY - 12);
      const el = document.elementFromPoint(e.clientX, e.clientY);
      setCursorHover(!!el?.closest("[data-magnetic-zone]"));
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [cursorX, cursorY]);

  const ticker = useMemo(
    () => Array.from({ length: 6 }, () => "GENERACIÓN FUNDADORA — MATRÍCULAS MARZO 2027").join(" · "),
    []
  );

  const submitWaitlist = async () => {
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
        setErrorMsg(data.message || "No se pudo registrar");
        setFormState("error");
        return;
      }
      setFormState(data.alreadySubscribed ? "duplicate" : "success");
    } catch {
      setErrorMsg("Sin conexión, intenta de nuevo");
      setFormState("error");
    }
  };

  return (
    <div className="bg-background text-foreground font-serif relative cursor-none">
      {/* Cursor custom */}
      <motion.div
        className="fixed top-0 left-0 w-6 h-6 rounded-full border border-primary pointer-events-none z-[100] mix-blend-difference hidden md:block"
        style={{
          x: cursorSx,
          y: cursorSy,
          scale: cursorHover ? 2.4 : 1,
          backgroundColor: cursorHover ? "hsl(var(--primary))" : "transparent",
        }}
      />

      {/* Grano de papel */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ===== NAV ===== */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-background/95 backdrop-blur-sm border-b border-border shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold tracking-tight">Barkley</span>
            <span className="font-label text-[10px] text-primary translate-y-[-2px]">Instituto</span>
          </Link>

          <div className="hidden md:flex items-center gap-2 font-label text-[10px] text-foreground/55">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            APERTURA DE MATRÍCULAS · MARZO 2027
          </div>

          <div data-magnetic-zone className="hidden lg:block">
            <MagneticButton
              onClick={() => document.getElementById("lista")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm font-label text-[11px] h-10 px-5 inline-flex items-center"
            >
              Asegurar mi cupo
            </MagneticButton>
          </div>

          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen((v) => !v)} aria-label="Menú">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-background border-t border-border px-6 py-6">
            <Button
              onClick={() => {
                setMobileMenuOpen(false);
                document.getElementById("lista")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-primary text-primary-foreground rounded-sm font-label text-xs h-11 w-full"
            >
              Asegurar mi cupo
            </Button>
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section className="relative pt-40 pb-24 md:pt-52 md:pb-32 overflow-hidden">
        <motion.svg
          className="absolute -right-40 top-10 w-[600px] h-[600px] opacity-[0.5] pointer-events-none"
          viewBox="0 0 200 200"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        >
          <motion.path
            d="M100 20 C140 20 180 60 180 100 C180 140 140 180 100 180 C60 180 20 140 20 100 C20 70 40 45 65 32"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="1.2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.4, ease: "easeInOut" }}
          />
          <motion.circle
            cx="100"
            cy="100"
            r="55"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="0.6"
            strokeDasharray="2 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{ duration: 1.8, delay: 0.6 }}
          />
        </motion.svg>

        <div className="max-w-[1320px] mx-auto px-6 md:px-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-label text-[11px] text-primary mb-7 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Generación fundadora · MINEDUC Chile
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-[13vw] leading-[0.94] md:text-[5.6rem] lg:text-[6.6rem] font-medium tracking-tight max-w-[18ch]"
          >
            El colegio que se adapta a ti abre sus puertas en 2027.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-9 max-w-[44ch] text-lg md:text-xl text-foreground/75 leading-relaxed"
          >
            Instituto Barkley abre matrículas en marzo de 2027 con cupos limitados para su
            generación fundadora. Currículum alineado MINEDUC, modelo de autorregulación de
            Russell Barkley, ritmo propio. Reserva tu lugar antes que el resto se entere.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10"
          >
            <a
              href="#lista"
              className="font-label text-[11px] text-foreground/70 hover:text-primary border-b border-foreground/30 hover:border-primary pb-1 transition-colors"
            >
              Ver apertura de matrículas ↓
            </a>
          </motion.div>
        </div>
      </section>

      {/* ===== MARQUEE TICKER ===== */}
      <div className="bg-foreground text-background py-4 overflow-hidden border-y border-background/10">
        <motion.div
          className="flex whitespace-nowrap font-label text-xs"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          <span className="pr-8">{ticker}</span>
          <span className="pr-8">{ticker}</span>
        </motion.div>
      </div>

      {/* ===== COUNTDOWN ===== */}
      <section className="py-24 md:py-32 text-center">
        <div className="font-label text-[11px] text-primary mb-8">Apertura de matrículas en</div>
        <div className="flex items-end justify-center gap-6 md:gap-12 flex-wrap px-6">
          {[
            ["DÍAS", countdown.days],
            ["HRS", countdown.hours],
            ["MIN", countdown.minutes],
            ["SEG", countdown.seconds],
          ].map(([label, value]) => (
            <div key={label as string}>
              <div className="font-display text-5xl md:text-7xl text-foreground tabular-nums">
                {String(value).padStart(2, "0")}
              </div>
              <div className="font-label text-[10px] text-foreground/50 mt-2">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== MÉTODO (teaser) ===== */}
      <section id="metodo" className="bg-foreground text-background py-24 md:py-32">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10">
          <div className="font-label text-[11px] text-accent mb-5">El método</div>
          <h2 className="font-display text-3xl md:text-5xl font-medium max-w-[20ch] leading-[1.08]">
            No copiamos la sala de clases. Copiamos cómo se aprende a sostener el foco.
          </h2>

          <div className="mt-16 grid md:grid-cols-3 gap-px bg-background/15">
            {PRINCIPIOS.map((p) => (
              <div key={p.n} className="bg-foreground p-8 md:p-10">
                <div className="flex items-center justify-between mb-8">
                  <span className="font-display text-sm text-background/40">{p.n}</span>
                  <p.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-2xl mb-4">{p.title}</h3>
                <p className="text-background/65 leading-relaxed text-[15px]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WAITLIST ===== */}
      <section id="lista" className="py-28 md:py-40 scroll-mt-20">
        <div className="max-w-[640px] mx-auto px-6 text-center">
          <div className="font-label text-[11px] text-primary mb-6">Generación fundadora</div>
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-6 leading-[1.08]">
            Asegura tu cupo antes de la apertura oficial.
          </h2>
          <p className="text-foreground/65 leading-relaxed mb-12">
            Los cupos de la generación fundadora son limitados. Déjanos tu correo y te
            contactamos directamente cuando abramos el proceso de matrícula — sin spam.
          </p>

          {formState === "success" || formState === "duplicate" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-foreground text-background rounded-sm p-10 flex flex-col items-center gap-3"
            >
              <Check className="w-8 h-8 text-accent" />
              <p className="font-display text-xl">
                {formState === "duplicate" ? "Ya tienes tu cupo reservado." : "Listo, tu cupo está reservado."}
              </p>
              <p className="text-background/60 text-sm">Te avisamos apenas abramos inscripciones.</p>
            </motion.div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitWaitlist();
              }}
              className="flex flex-col gap-4 text-left"
            >
              <input
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 px-5 bg-card border border-border rounded-sm font-serif text-base focus:outline-none focus:border-primary"
                data-testid="input-email-waitlist"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Tu nombre (opcional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 px-5 bg-card border border-border rounded-sm font-serif text-base focus:outline-none focus:border-primary"
                  data-testid="input-name-waitlist"
                />
                <select
                  value={levelInterest}
                  onChange={(e) => setLevelInterest(e.target.value)}
                  className="h-14 px-5 bg-card border border-border rounded-sm font-serif text-base focus:outline-none focus:border-primary text-foreground/70"
                  data-testid="select-level-waitlist"
                >
                  <option value="">Nivel de interés</option>
                  {["7° Básico", "8° Básico", "1° Medio", "2° Medio", "3° Medio", "4° Medio", "Adulto"].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {formState === "error" && (
                <p className="text-destructive text-sm font-label text-[11px]">{errorMsg}</p>
              )}

              <div data-magnetic-zone>
                <MagneticButton
                  type="submit"
                  disabled={formState === "loading"}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground rounded-sm h-14 text-base inline-flex items-center justify-center gap-2"
                >
                  {formState === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Asegurar mi cupo
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </MagneticButton>
              </div>
            </form>
          )}

          <button
            onClick={() => setCallDialogOpen(true)}
            className="mt-8 font-label text-[10px] text-foreground/50 hover:text-primary border-b border-foreground/20 hover:border-primary pb-1"
            data-testid="button-agendar-llamada"
          >
            ¿Quieres conversar antes? Agenda una llamada
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border py-14 px-6">
        <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="font-display text-lg">Instituto Barkley</span>
          <p className="font-label text-[10px] text-foreground/50 text-center">
            Generación fundadora · Apertura de matrículas marzo 2027 · Chile
          </p>
        </div>
      </footer>

      <ReservationDialog open={callDialogOpen} onOpenChange={setCallDialogOpen} />
    </div>
  );
}
