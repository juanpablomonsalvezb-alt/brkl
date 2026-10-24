// Inicio del estudiante en Vórtice. Solo datos reales del servidor:
// /api/auth/user, /api/vortice/overview, /api/vortice/brujula/semana y /api/vortice/repaso.
// Estilo según la referencia entregada por la dirección (ver vortice.css).
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, Calculator, ChevronRight, Compass, FlaskConical, Globe2, Landmark, LayoutGrid,
  Languages, Menu, MessageCircle, RotateCcw, Scale, Target, Trophy, Users, X,
} from "lucide-react";
import type { VorticeOverview, VorticeTrack, SubjectSummary } from "@shared/vortice";
import type { BrujulaGoal } from "@shared/brujula";
import "./vortice.css";

interface Usuario { firstName: string | null; name: string | null; email: string | null }
interface Semana { saved: boolean; goals: BrujulaGoal[]; maxGoals: number }
interface Repaso { domains: { due: number }[] }

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

const SALUDO: Record<VorticeTrack, string> = {
  "basica-1-4": "Hoy seguimos aprendiendo, paso a paso.",
  "basica-5-8": "Hoy es un buen día para seguir avanzando.",
  "media": "Esto es lo que tienes por delante esta semana.",
};

// Icono y tono por asignatura (slug de la base); el resto usa uno neutro.
const ASIGNATURA: Record<string, [typeof BookOpen, string]> = {
  "lengua-y-literatura": [BookOpen, "tone-coral"],
  "lenguaje": [BookOpen, "tone-coral"],
  "matematica": [Calculator, "tone-plum"],
  "ciencias-naturales": [FlaskConical, "tone-sage"],
  "historia": [Globe2, "tone-gold"],
  "ingles": [Languages, "tone-blue"],
  "educacion-ciudadana": [Landmark, "tone-teal"],
  "filosofia": [Scale, "tone-teal"],
};

function primerNombre(u: Usuario | null) {
  return u?.firstName || u?.name?.split(" ")[0] || null;
}

function estadoAsignatura(s: SubjectSummary) {
  if (s.percent === null) return "Sin contenido cargado";
  if (s.waitingForRelease) return `${s.percent}% · próximo contenido pronto`;
  return `${s.percent}% completado`;
}

export default function VorticeInicio() {
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    // Inter solo para Vórtice (la landing usa su propia tipografía).
    const id = "vx-inter";
    if (document.getElementById(id)) return;
    const link = Object.assign(document.createElement("link"), {
      id, rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
    });
    document.head.appendChild(link);
  }, []);

  const usuario = useQuery({ queryKey: ["/api/auth/user"], queryFn: () => getJson<Usuario>("/api/auth/user"), retry: false });
  const sesion = usuario.data !== null && !usuario.isLoading;
  const overview = useQuery({ queryKey: ["/api/vortice/overview"], queryFn: () => getJson<VorticeOverview>("/api/vortice/overview"), enabled: sesion });
  const semana = useQuery({ queryKey: ["/api/vortice/brujula/semana"], queryFn: () => getJson<Semana>("/api/vortice/brujula/semana"), enabled: sesion });
  const repaso = useQuery({ queryKey: ["/api/vortice/repaso"], queryFn: () => getJson<Repaso>("/api/vortice/repaso"), enabled: sesion });

  const salir = typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app") ? "/api/preview/salir" : "/api/logout";

  if (usuario.isLoading) return <div className="vx-state" aria-busy="true"><div className="vx-skeleton" /></div>;
  if (!usuario.data) {
    return (
      <div className="vx" style={{ display: "block" }}>
        <div className="vx-state">
          <h1>Inicia sesión para ver tu espacio</h1>
          <p>Tu avance, tus metas de la semana y tu siguiente paso aparecen aquí cuando entras con tu cuenta.</p>
          <a className="vx-btn" href={salir === "/api/logout" ? "/api/login" : "/api/preview/entrar"}>Iniciar sesión</a>
        </div>
      </div>
    );
  }

  const nombre = primerNombre(usuario.data);
  const ov = overview.data;
  const nivel = ov?.level;
  const siguiente = ov?.nextStep;
  const linkAsignatura = (slug: string) => (nivel ? `/course/${nivel.id}-${slug}` : "#");
  const pendientesRepaso = repaso.data?.domains.reduce((n, d) => n + d.due, 0) ?? 0;

  const nav = (
    <nav className="vx-nav" aria-label="Secciones">
      <Link href="/vortice" aria-current="page"><LayoutGrid />Inicio</Link>
      <a href="#asignaturas" onClick={() => setMenu(false)}><BookOpen />Mis asignaturas</a>
      <a href="#semana" onClick={() => setMenu(false)}><Compass />Mi semana</a>
      <Link href="/academic-copilot"><MessageCircle />Tutor virtual</Link>
      <Link href="/together"><Users />Together</Link>
    </nav>
  );

  return (
    <div className="vx">
      <aside className="vx-side" data-open={menu} aria-label="Menú principal">
        <a className="vx-brand" href="/vortice">BARKLEY<span>INSTITUTO</span></a>
        {nav}
        <div className="vx-me">
          <div className="vx-avatar" aria-hidden="true">{(nombre ?? "?").charAt(0)}</div>
          <div><b>{nombre ?? "Estudiante"}</b><small>{nivel?.name ?? "Sin curso asignado"}</small></div>
          <a href={salir}>Salir</a>
        </div>
      </aside>

      <main className="vx-main">
        <div className="vx-top">
          <a className="vx-brand" href="/vortice">BARKLEY</a>
          <button type="button" onClick={() => setMenu(!menu)} aria-label={menu ? "Cerrar menú" : "Abrir menú"} aria-expanded={menu}>
            {menu ? <X /> : <Menu />}
          </button>
        </div>

        <div className="vx-grid">
          <div className="vx-col">
            <section className="vx-hero" style={{ backgroundImage: "url(/images/vortice-hero.jpg)" }} aria-labelledby="vx-saludo">
              <div className="vx-hero-body">
                <h1 id="vx-saludo">{nombre ? `¡Hola, ${nombre}!` : "¡Hola!"}</h1>
                <p>{ov?.track ? SALUDO[ov.track] : "Este es tu espacio de aprendizaje."}</p>
                {overview.isLoading ? <div className="vx-skeleton" style={{ minHeight: 72 }} /> : siguiente ? (
                  <div className="vx-next">
                    <div className="vx-next-icon"><Target aria-hidden="true" /></div>
                    <div>
                      <small>Tu siguiente paso · {siguiente.subjectName}</small>
                      <b>{siguiente.itemTitle}</b>
                      <span>{siguiente.objectiveTitle}</span>
                    </div>
                    <Link className="vx-btn" href={linkAsignatura(ov!.subjects.find((s) => s.levelSubjectId === siguiente.levelSubjectId)?.subjectSlug ?? "")}>
                      Continuar <ChevronRight aria-hidden="true" />
                    </Link>
                  </div>
                ) : (
                  <div className="vx-next"><div><b>Estás al día</b><span>No hay pasos pendientes liberados por ahora.</span></div></div>
                )}
              </div>
            </section>

            <section className="vx-card" id="asignaturas" aria-labelledby="vx-asig">
              <header><h2 id="vx-asig"><BookOpen aria-hidden="true" />Mis asignaturas</h2>{ov && <small>{ov.subjects.length} en {nivel?.name}</small>}</header>
              {overview.isLoading ? <div className="vx-skeleton" /> : overview.isError ? (
                <p className="vx-empty">No pudimos cargar tus asignaturas. Recarga la página para intentarlo de nuevo.</p>
              ) : !ov?.subjects.length ? (
                <p className="vx-empty">Aún no tienes asignaturas matriculadas. Cuando se active tu matrícula aparecerán aquí.</p>
              ) : (
                <div className="vx-subjects">
                  {ov.subjects.map((s) => {
                    const [Icon, tone] = ASIGNATURA[s.subjectSlug] ?? [BookOpen, "tone-teal"];
                    return (
                      <Link key={s.levelSubjectId} className="vx-subject" href={linkAsignatura(s.subjectSlug)}>
                        <div className={`vx-subject-icon ${tone}`}><Icon aria-hidden="true" /></div>
                        <b>{s.subjectName}</b>
                        <span>{estadoAsignatura(s)}</span>
                        {s.percent !== null && <div className="vx-bar" role="progressbar" aria-valuenow={s.percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Avance en ${s.subjectName}`}><i style={{ width: `${s.percent}%` }} /></div>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="vx-card" aria-labelledby="vx-ayuda">
              <header><h2 id="vx-ayuda"><MessageCircle aria-hidden="true" />¿Necesitas ayuda?</h2></header>
              <div className="vx-help">
                <p>El tutor virtual te explica con otras palabras y te da pistas. No resuelve evaluaciones en curso.</p>
                <Link className="vx-btn" href="/academic-copilot">Hablar con el tutor virtual</Link>
              </div>
            </section>
          </div>

          <aside className="vx-col" aria-label="Resumen de la semana">
            <section className="vx-card" id="semana" aria-labelledby="vx-semana">
              <header><h2 id="vx-semana"><Compass aria-hidden="true" />Mi semana</h2>{semana.data && !semana.data.saved && <span className="vx-chip">Propuesta</span>}</header>
              {semana.isLoading ? <div className="vx-skeleton" /> : !semana.data?.goals.length ? (
                <p className="vx-empty">Esta semana no hay metas propuestas: no quedan objetivos pendientes liberados.</p>
              ) : (
                <>
                  <ul className="vx-goals">
                    {semana.data.goals.map((g) => (
                      <li key={g.objectiveId}><div><b>{g.subjectName}</b><span>{g.objectiveCode} · {g.objectiveTitle}</span></div></li>
                    ))}
                  </ul>
                  {!semana.data.saved && <p className="vx-note">Brújula propone estas metas según tu avance. Puedes ajustarlas con tu tutor.</p>}
                </>
              )}
            </section>

            <section className="vx-card" aria-labelledby="vx-progreso">
              <header><h2 id="vx-progreso"><Trophy aria-hidden="true" />Mi progreso</h2></header>
              {overview.isLoading ? <div className="vx-skeleton" /> : ov?.totals.percent == null ? (
                <p className="vx-empty">Todavía no hay contenido cargado para medir tu avance.</p>
              ) : (
                <div className="vx-progress">
                  <div className="vx-ring" style={{ ["--p" as string]: ov.totals.percent }} role="img" aria-label={`${ov.totals.percent}% del contenido completado`}>
                    <div><div><strong>{ov.totals.percent}%</strong><small>completado</small></div></div>
                  </div>
                  <div className="vx-stats">
                    <span>Actividades completadas <b>{ov.totals.completedItems} de {ov.totals.totalItems}</b></span>
                    <span>Asignaturas activas <b>{ov.subjects.length}</b></span>
                  </div>
                </div>
              )}
            </section>

            <section className="vx-card" aria-labelledby="vx-repaso">
              <header><h2 id="vx-repaso"><RotateCcw aria-hidden="true" />Repaso</h2></header>
              {repaso.isLoading ? <div className="vx-skeleton" style={{ minHeight: 48 }} /> : (
                <p className="vx-empty">{pendientesRepaso === 0
                  ? "No tienes preguntas para repasar hoy."
                  : `Tienes ${pendientesRepaso} ${pendientesRepaso === 1 ? "pregunta" : "preguntas"} para repasar.`}</p>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
