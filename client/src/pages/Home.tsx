import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Menu,
  X,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Compass,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { ReservationDialog } from "@/components/ReservationDialog";
import { PlanConfiguratorYouthPremium } from "@/components/PlanConfiguratorYouthPremium";
import { PlanConfiguratorAdultsNew } from "@/components/PlanConfiguratorAdultsNew";
import PaesConfigurator from "@/components/PaesConfigurator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  { label: "Planes", href: "#planes" },
  { label: "Plataforma", href: "#plataforma" },
  { label: "Preguntas", href: "#faq" },
];

const PRINCIPIOS = [
  {
    n: "01",
    icon: Brain,
    title: "Función ejecutiva primero",
    body:
      "Adaptamos el modelo de autorregulación de Russell Barkley al currículum chileno: cada estudiante aprende a planificar, sostener atención y autoevaluarse antes de avanzar de contenido.",
  },
  {
    n: "02",
    icon: Compass,
    title: "Ritmo propio, meta común",
    body:
      "Sin clases sincrónicas obligatorias de 8 horas. El estudiante distribuye su carga semanal según su curva de energía real, con hitos quincenales verificables.",
  },
  {
    n: "03",
    icon: ShieldCheck,
    title: "Validado por el sistema",
    body:
      "Currículum 100% alineado MINEDUC. Egresas con la misma licencia de enseñanza media que un colegio presencial — exámenes libres o validación de estudios, según tu caso.",
  },
];

const PASOS = [
  {
    n: "1",
    title: "Diagnóstico de entrada",
    body: "Evaluamos nivel académico real y hábitos de estudio actuales — no asumimos nada por tu edad o curso anterior.",
  },
  {
    n: "2",
    title: "Plan de estudio propio",
    body: "Configuras tu carga de asignaturas y calendario de evaluaciones según el plan que más calce con tu objetivo (licencia, PAES, validación adulto).",
  },
  {
    n: "3",
    title: "Seguimiento quincenal",
    body: "Cada 15 días revisamos avance real contra meta. Si algo no calza, ajustamos el plan — no esperamos al cierre de semestre para reaccionar.",
  },
  {
    n: "4",
    title: "Cierre y validación",
    body: "Rindes exámenes libres o validación de estudios ante el organismo correspondiente, con respaldo documental completo del proceso.",
  },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: faqs, isLoading: faqsLoading } = useQuery<Faq[]>({
    queryKey: ["/api/faqs"],
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-background text-foreground font-serif relative">
      {/* Grano de papel — textura sutil sobre todo el documento */}
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
          <Link href="/" className="flex items-baseline gap-2 group">
            <span className="font-display text-2xl font-semibold tracking-tight">Barkley</span>
            <span className="font-label text-[10px] text-primary translate-y-[-2px]">Instituto</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-9">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-label text-[11px] text-foreground/70 hover:text-primary transition-colors"
                data-testid={`link-nav-${l.label}`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                onClick={() => setLocation("/dashboard")}
                className="bg-foreground hover:bg-foreground/85 text-background rounded-sm font-label text-[11px] h-10 px-5"
                data-testid="button-dashboard"
              >
                Mi panel
              </Button>
            ) : (
              <Button
                onClick={() => setReservationDialogOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm font-label text-[11px] h-10 px-5"
                data-testid="button-reservar-nav"
              >
                Reservar entrevista
              </Button>
            )}
          </div>

          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Menú"
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-background border-t border-border px-6 py-6 flex flex-col gap-5">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-label text-xs text-foreground/80"
              >
                {l.label}
              </a>
            ))}
            <Button
              onClick={() => {
                setMobileMenuOpen(false);
                setReservationDialogOpen(true);
              }}
              className="bg-primary text-primary-foreground rounded-sm font-label text-xs h-11"
            >
              Reservar entrevista
            </Button>
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section className="relative pt-40 pb-28 md:pt-52 md:pb-36 overflow-hidden">
        <div
          className="absolute -right-32 top-12 w-[520px] h-[520px] rounded-full opacity-[0.18] blur-2xl"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
        />
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-label text-[11px] text-primary mb-7 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Colegio online · MINEDUC Chile
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-[14vw] leading-[0.92] md:text-[6.4rem] lg:text-[7.4rem] font-medium tracking-tight max-w-[16ch]"
          >
            Educación que se{" "}
            <span className="relative inline-block text-primary italic">
              adapta
              <svg
                className="absolute left-0 -bottom-2 w-full"
                height="14"
                viewBox="0 0 300 14"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 9C60 2 140 2 298 9"
                  stroke="hsl(var(--accent))"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            a ti. No al revés.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-9 max-w-[42ch] text-lg md:text-xl text-foreground/75 leading-relaxed"
          >
            Instituto Barkley es un colegio 100% online en Chile, construido sobre el modelo de
            autorregulación de Russell Barkley. Currículum oficial, ritmo propio, seguimiento real.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-11 flex flex-wrap items-center gap-5"
          >
            <Button
              onClick={() => setReservationDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm h-14 px-8 text-base group"
              data-testid="button-reservar-hero"
            >
              Reservar entrevista
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <a
              href="#metodo"
              className="font-label text-[11px] text-foreground/70 hover:text-primary border-b border-foreground/30 hover:border-primary pb-1 transition-colors"
            >
              Conocer el método
            </a>
          </motion.div>

          {/* Margen de notas — estadísticas estilo anotación académica */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-border pt-10">
            {[
              ["100%", "Alineado MINEDUC"],
              ["7°–4°", "Básico a Medio"],
              ["Quincenal", "Seguimiento real de avance"],
              ["0", "IA en el aula — solo en el desarrollo de la plataforma"],
            ].map(([num, label]) => (
              <div key={label}>
                <div className="font-display text-3xl md:text-4xl text-primary">{num}</div>
                <div className="font-label text-[10px] text-foreground/55 mt-2 leading-snug">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MÉTODO ===== */}
      <section id="metodo" className="bg-foreground text-background py-28 md:py-36 scroll-mt-20">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10">
          <div className="font-label text-[11px] text-accent mb-5">El método</div>
          <h2 className="font-display text-4xl md:text-6xl font-medium max-w-[18ch] leading-[1.05]">
            No copiamos la sala de clases. Copiamos cómo se aprende a sostener el foco.
          </h2>

          <div className="mt-20 grid md:grid-cols-3 gap-px bg-background/15">
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

      {/* ===== CÓMO FUNCIONA ===== */}
      <section id="funciona" className="py-28 md:py-36 scroll-mt-20">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-16">
            <div>
              <div className="font-label text-[11px] text-primary mb-5">Cómo funciona</div>
              <h2 className="font-display text-4xl md:text-5xl font-medium leading-[1.08] sticky top-32">
                Cuatro pasos, sin letra chica.
              </h2>
            </div>

            <div className="flex flex-col">
              {PASOS.map((p, i) => (
                <motion.div
                  key={p.n}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className={`flex gap-7 py-9 ${i !== 0 ? "border-t border-border" : ""}`}
                >
                  <span className="font-display text-3xl text-primary/70 shrink-0 w-10">{p.n}</span>
                  <div>
                    <h3 className="font-display text-xl mb-2">{p.title}</h3>
                    <p className="text-foreground/65 leading-relaxed">{p.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PLANES — configuradores funcionales existentes ===== */}
      <div id="planes" className="scroll-mt-20 bg-muted/40">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 pt-28 pb-4">
          <div className="font-label text-[11px] text-primary mb-5">Planes</div>
          <h2 className="font-display text-4xl md:text-5xl font-medium max-w-[20ch] leading-[1.08]">
            Configura tu plan según tu objetivo real.
          </h2>
          <p className="mt-5 text-foreground/65 max-w-[50ch]">
            Todos los valores incluyen IVA. Ciclo académico marzo–diciembre.
          </p>
        </div>
        <PlanConfiguratorYouthPremium />
        <PlanConfiguratorAdultsNew />
        <div id="paes" className="scroll-mt-20">
          <PaesConfigurator />
        </div>
      </div>

      {/* ===== PLATAFORMA ===== */}
      <section id="plataforma" className="py-28 md:py-36 scroll-mt-20 overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="font-label text-[11px] text-primary mb-5">La plataforma</div>
              <h2 className="font-display text-4xl md:text-5xl font-medium leading-[1.08] mb-7">
                Construida desde cero. Sin Moodle, sin plantillas genéricas.
              </h2>
              <p className="text-foreground/65 leading-relaxed mb-9 max-w-[46ch]">
                Cada módulo, evaluación y reporte de avance vive en una plataforma propia, pensada
                para el modelo de autorregulación — no adaptada de un LMS genérico.
              </p>
              <a
                href="#faq"
                className="inline-flex items-center gap-2 font-label text-[11px] text-foreground/70 hover:text-primary border-b border-foreground/30 hover:border-primary pb-1 transition-colors"
              >
                Ver preguntas frecuentes
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 border border-primary/30 rounded-sm -z-10" />
              <div className="bg-foreground rounded-sm p-9 md:p-11 shadow-2xl shadow-foreground/10">
                <div className="flex items-center justify-between mb-10">
                  <span className="font-label text-[10px] text-background/45">Panel del estudiante</span>
                  <span className="w-2 h-2 rounded-full bg-accent" />
                </div>
                {[
                  ["Plan de estudio activo", "8 asignaturas · 4° Medio"],
                  ["Avance del ciclo", "62% completado"],
                  ["Próxima evaluación", "Lenguaje · en 6 días"],
                ].map(([label, value], i) => (
                  <div key={label} className={`flex items-center justify-between py-5 ${i !== 0 ? "border-t border-background/12" : ""}`}>
                    <span className="text-background/60 text-sm">{label}</span>
                    <span className="font-display text-background text-lg">{value}</span>
                  </div>
                ))}
                <div className="mt-8 h-2 rounded-full bg-background/12 overflow-hidden">
                  <div className="h-full w-[62%] bg-accent rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-28 md:py-36 bg-muted/40 scroll-mt-20">
        <div className="max-w-[840px] mx-auto px-6 md:px-10">
          <div className="font-label text-[11px] text-primary mb-5 text-center">Preguntas frecuentes</div>
          <h2 className="font-display text-4xl md:text-5xl font-medium text-center mb-16">
            Antes de que preguntes
          </h2>

          {faqs && faqs.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f) => (
                <AccordionItem
                  key={f.id}
                  value={f.id}
                  className="bg-card border border-border rounded-sm px-6"
                >
                  <AccordionTrigger className="font-display text-left text-lg hover:no-underline py-5">
                    {f.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/65 leading-relaxed pb-5">
                    {f.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-foreground/50 font-label text-xs">
              {faqsLoading ? "Cargando preguntas…" : "Aún no hay preguntas publicadas."}
            </p>
          )}
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="py-28 md:py-40 text-center px-6">
        <div className="font-label text-[11px] text-primary mb-6">Empecemos</div>
        <h2 className="font-display text-4xl md:text-6xl font-medium max-w-[20ch] mx-auto leading-[1.05]">
          Tu colegio, a tu ritmo. Conversemos 20 minutos.
        </h2>
        <Button
          onClick={() => setReservationDialogOpen(true)}
          className="mt-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm h-14 px-9 text-base group"
          data-testid="button-reservar-cta"
        >
          Reservar entrevista
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border py-14 px-6">
        <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="font-display text-lg">Instituto Barkley</span>
          <p className="font-label text-[10px] text-foreground/50 text-center">
            Reconocimiento Oficial MINEDUC · Chile · {new Date().getFullYear()}
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="font-label text-[10px] text-foreground/55 hover:text-primary flex items-center gap-1"
          >
            Volver arriba <ChevronDown className="w-3 h-3 -rotate-90" />
          </button>
        </div>
      </footer>

      <ReservationDialog open={reservationDialogOpen} onOpenChange={setReservationDialogOpen} />
    </div>
  );
}
