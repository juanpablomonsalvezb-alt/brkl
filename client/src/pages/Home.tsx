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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { ReservationDialog } from "@/components/ReservationDialog";

interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
  sortOrder: number;
}

const NAV_LINKS = [
  { label: "Inicio", href: "#inicio" },
  { label: "Nuestro método", href: "#metodo" },
  { label: "Admisión", href: "#matricula" },
  { label: "Preguntas frecuentes", href: "#faq" },
];

const PRINCIPIOS = [
  {
    icon: Brain,
    title: "Función ejecutiva primero",
    body: "Adaptamos el modelo de autorregulación del Dr. Russell Barkley al currículum chileno: cada estudiante aprende a planificar, sostener la atención y autoevaluarse antes de avanzar de contenido.",
  },
  {
    icon: Compass,
    title: "Aprendizaje asincrónico",
    body: "Sin clases en vivo por Zoom o Google Meet, sin horario predeterminado. Un algoritmo de seguimiento mide los resultados de cada estudiante y ajusta el ritmo y el contenido según su avance real.",
  },
  {
    icon: ShieldCheck,
    title: "Currículum oficial",
    body: "Plan de estudios alineado a las bases curriculares del MINEDUC. El egresado obtiene la misma licencia de enseñanza media que un colegio presencial.",
  },
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

  return (
    <div className="bg-background text-foreground font-sans">
      {/* ===== BARRA SUPERIOR — contacto real, patrón estándar de sitio institucional ===== */}
      <div className="bg-primary text-primary-foreground py-2 px-4">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs sm:text-sm">
          <span className="font-medium">Generación fundadora 2027 · Proceso de reconocimiento MINEDUC en curso</span>
          <div className="flex items-center gap-4 text-primary-foreground/85">
            <a href="mailto:admisiones@institutobarkley.cl" className="flex items-center gap-1.5 hover:text-secondary">
              <Mail className="w-3.5 h-3.5" /> admisiones@institutobarkley.cl
            </a>
            <button onClick={() => setCallDialogOpen(true)} className="flex items-center gap-1.5 hover:text-secondary">
              <Phone className="w-3.5 h-3.5" /> Agendar llamada
            </button>
          </div>
        </div>
      </div>

      {/* ===== NAV ===== */}
      <header
        className={`sticky top-0 z-50 bg-background transition-shadow ${
          scrolled ? "shadow-md border-b border-border" : "border-b border-transparent"
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-xl border-2 border-secondary">
              B
            </div>
            <div className="leading-tight">
              <div className="font-display text-xl font-bold text-primary">Barkley Online</div>
              <div className="font-label text-[10px] text-muted-foreground">Colegio online · Chile</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-foreground/75 hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Button
              onClick={() => document.getElementById("matricula")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-md font-semibold"
              data-testid="button-matricula-nav"
            >
              Matricúlate sin compromiso
            </Button>
          </div>

          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen((v) => !v)} aria-label="Menú">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-background border-t border-border px-6 py-6 flex flex-col gap-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-foreground/80"
              >
                {l.label}
              </a>
            ))}
            <Button
              onClick={() => {
                setMobileMenuOpen(false);
                document.getElementById("matricula")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-secondary text-secondary-foreground rounded-md font-semibold mt-2"
            >
              Matricúlate sin compromiso
            </Button>
          </div>
        )}
      </header>

      {/* ===== HERO + FORMULARIO ===== */}
      <section id="inicio" className="py-14 md:py-20">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start">
          <div>
            <p className="font-label text-xs text-secondary mb-4">Educación media online · Reconocimiento MINEDUC</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-[1.15] mb-6 text-primary">
              Un colegio online con la seriedad de uno presencial.
            </h1>
            <p className="text-lg text-foreground/75 leading-relaxed mb-8 max-w-[52ch]">
              Barkley Online educa desde 7° básico a 4° medio bajo el modelo de autorregulación
              del Dr. Russell Barkley, con un plan de estudios alineado a las bases curriculares
              del Ministerio de Educación. Abrimos matrículas para nuestra generación fundadora
              en marzo de 2027.
            </p>
            <p className="text-base text-foreground/70 leading-relaxed mb-8 max-w-[54ch]">
              Aprendizaje <strong className="text-primary">asincrónico</strong>: sin clases en
              vivo por Zoom o Google Meet, sin horario predeterminado. Cada estudiante avanza
              según su propio plan, y un algoritmo de seguimiento mide sus resultados y ajusta
              el ritmo y el contenido en consecuencia.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                ["Currículum", "Alineado MINEDUC"],
                ["Metodología", "Modelo Dr. Barkley"],
                ["Modalidad", "Asincrónico, ritmo propio"],
              ].map(([label, value]) => (
                <div key={label} className="border-l-4 border-secondary pl-4">
                  <div className="font-label text-[11px] text-muted-foreground">{label}</div>
                  <div className="font-semibold text-primary text-sm mt-1">{value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <a
                href="#metodo"
                className="text-sm font-semibold text-primary hover:text-secondary underline underline-offset-4"
              >
                Conocer nuestro método →
              </a>
              <button
                onClick={() => setCallDialogOpen(true)}
                className="text-sm font-semibold text-foreground/70 hover:text-primary flex items-center gap-2"
                data-testid="button-agendar-llamada"
              >
                <Phone className="w-4 h-4" />
                Hablar con un asesor
              </button>
            </div>
          </div>

          {/* Formulario de matrícula — destacado, sin compromiso */}
          <div id="matricula" className="scroll-mt-24 bg-card border border-border rounded-lg shadow-lg p-7 md:p-9">
            <h2 className="font-display text-2xl font-bold text-primary mb-2">Matrícula sin compromiso</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Completa tus datos y te contactamos para conversar tu caso. Sin costo, sin obligación
              de continuar.
            </p>

            {formState === "success" || formState === "duplicate" ? (
              <div className="bg-muted rounded-md p-6 flex flex-col items-center gap-3 text-center">
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
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-full">
                    <Label htmlFor="name-matricula" className="text-sm font-medium text-foreground/80">
                      Nombre del apoderado o estudiante <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name-matricula"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nombre completo"
                      className="mt-1.5 h-12"
                      data-testid="input-name-matricula"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email-matricula" className="text-sm font-medium text-foreground/80">
                      Correo electrónico <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email-matricula"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="mt-1.5 h-12"
                      data-testid="input-email-matricula"
                    />
                  </div>
                  <div>
                    <Label htmlFor="level-matricula" className="text-sm font-medium text-foreground/80">
                      Nivel de interés
                    </Label>
                    <select
                      id="level-matricula"
                      value={levelInterest}
                      onChange={(e) => setLevelInterest(e.target.value)}
                      className="mt-1.5 w-full h-12 px-3 bg-background border border-input rounded-md text-base text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring"
                      data-testid="select-level-matricula"
                    >
                      <option value="">Selecciona un nivel</option>
                      {["7° Básico", "8° Básico", "1° Medio", "2° Medio", "3° Medio", "4° Medio", "Validación de estudios (adulto)"].map(
                        (l) => (
                          <option key={l} value={l}>{l}</option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {formState === "error" && <p className="text-destructive text-sm font-medium">{errorMsg}</p>}

                <Button
                  type="submit"
                  disabled={formState === "loading"}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground rounded-md h-12 text-base font-semibold mt-1"
                  data-testid="button-submit-matricula"
                >
                  {formState === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Enviar solicitud
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Sin compromiso. No se requiere pago en esta etapa.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ===== MÉTODO ===== */}
      <section id="metodo" className="bg-muted py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <p className="font-label text-xs text-secondary mb-3">Nuestro método</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary max-w-[36ch] mb-4">
            Un modelo educativo con fundamento, no una promesa vacía.
          </h2>
          <p className="text-foreground/70 max-w-[60ch] mb-12 leading-relaxed">
            No copiamos la sala de clases tradicional a una pantalla. Construimos el plan de
            estudio alrededor de cómo los estudiantes aprenden a sostener el foco y organizar su
            propio aprendizaje.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {PRINCIPIOS.map((p) => (
              <div key={p.title} className="bg-card border border-border rounded-lg p-7">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <p.icon className="w-6 h-6 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-lg font-bold text-primary mb-3">{p.title}</h3>
                <p className="text-foreground/70 leading-relaxed text-[15px]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-16 md:py-24">
        <div className="max-w-[760px] mx-auto px-6 md:px-10">
          <p className="font-label text-xs text-secondary mb-3 text-center">Preguntas frecuentes</p>
          <h2 className="font-display text-3xl font-bold text-primary text-center mb-12">
            Antes de matricularte
          </h2>

          {faqs && faqs.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f) => (
                <AccordionItem key={f.id} value={f.id} className="bg-card border border-border rounded-md px-6">
                  <AccordionTrigger className="font-display text-left text-base font-bold text-primary hover:no-underline py-4">
                    {f.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/70 leading-relaxed pb-4">
                    {f.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-muted-foreground text-sm">Aún no hay preguntas publicadas.</p>
          )}
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="bg-primary text-primary-foreground py-16 px-6 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 max-w-[28ch] mx-auto">
          Conversemos sobre la educación de tu hijo o hija.
        </h2>
        <p className="text-primary-foreground/75 mb-8 max-w-[50ch] mx-auto">
          Completa el formulario de matrícula o agenda una llamada con un asesor de admisión —
          sin costo, sin compromiso.
        </p>
        <Button
          onClick={() => document.getElementById("matricula")?.scrollIntoView({ behavior: "smooth" })}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-md h-12 px-8 font-semibold"
        >
          Ir al formulario de matrícula
        </Button>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-sidebar text-sidebar-foreground py-12 px-6">
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="font-display text-lg font-bold mb-2">Barkley Online</div>
            <p className="text-sidebar-foreground/65 leading-relaxed">
              Colegio online · Educación media · Chile
              <br />
              Generación fundadora — apertura marzo 2027
            </p>
          </div>
          <div>
            <div className="font-label text-xs text-secondary mb-3">Contacto</div>
            <p className="flex items-center gap-2 text-sidebar-foreground/80 mb-2">
              <Mail className="w-4 h-4" /> admisiones@institutobarkley.cl
            </p>
            <button
              onClick={() => setCallDialogOpen(true)}
              className="flex items-center gap-2 text-sidebar-foreground/80 hover:text-secondary"
            >
              <Phone className="w-4 h-4" /> Agendar llamada con asesor
            </button>
          </div>
          <div>
            <div className="font-label text-xs text-secondary mb-3">Navegación</div>
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className="text-sidebar-foreground/80 hover:text-secondary">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto mt-10 pt-6 border-t border-sidebar-border text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} Barkley Online. Todos los derechos reservados.
        </div>
      </footer>

      <ReservationDialog open={callDialogOpen} onOpenChange={setCallDialogOpen} />
    </div>
  );
}
