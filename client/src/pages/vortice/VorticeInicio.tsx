// Inicio del estudiante en Vórtice, según el diseño entregado por la dirección (2026-10-24).
// Solo datos reales: /api/auth/user, /api/vortice/overview, /api/vortice/brujula/semana,
// /api/vortice/repaso y /api/vortice/portafolio. Las secciones del diseño sin datos en la
// plataforma (ruta PAES, proyectos, recursos, orientación, evaluaciones con fecha) no se muestran.
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, BarChart3, BookOpen, BriefcaseBusiness, CalendarDays, ChevronRight, FileText, Home,
  Link2, Menu, MessageCircle, ClipboardCheck, RotateCcw, Target, Users, X,
} from "lucide-react";
import type { VorticeOverview, VorticeTrack } from "@shared/vortice";
import type { BrujulaGoal } from "@shared/brujula";
import "./vortice.css";

interface Usuario { firstName: string | null; name: string | null }
interface Semana { saved: boolean; goals: BrujulaGoal[] }
interface Repaso { domains: { due: number }[] }
interface Evidencia {
  id: string; kind: "texto" | "enlace" | "evaluacion"; title: string;
  visibility: "privada" | "tutor" | "familia"; createdAt: string; evaluationTitle: string | null;
}

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

const SUBTITULO: Record<VorticeTrack, string> = {
  "basica-1-4": "Hoy seguimos aprendiendo, paso a paso.",
  "basica-5-8": "Cada día avanzas un poco más.",
  "media": "Tu aprendizaje construye tu futuro.",
};

// Miniatura por asignatura (provisionales, recortadas del diseño; reemplazar por originales).
const MINIATURA: Record<string, string> = {
  "lengua-y-literatura": "asig-lengua", "lenguaje": "asig-lengua", "matematica": "asig-matematica",
  "historia": "asig-historia", "ingles": "asig-ingles", "ciencias-naturales": "asig-ciencias",
  "filosofia": "asig-filosofia", "educacion-ciudadana": "asig-ciudadana",
};
const PUNTOS = ["#4a7fd4", "#1f4a3d", "#e8893a", "#7a5fd0", "#d65a4a", "#2f6b55", "#c9a227"];
const VISIBILIDAD = { privada: ["Privada", "#f2efe8", "#5b6670"], tutor: ["Tutor", "#e6eef9", "#3a64a8"], familia: ["Familia", "#e5ece4", "#1f4a3d"] } as const;

const colorAvance = (p: number) => (p >= 70 ? "#2f6b55" : p >= 55 ? "#e8893a" : "#d65a4a");

function semanaActual(hoy: Date) {
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
}
const mismoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export default function VorticeInicio() {
  const [menu, setMenu] = useState(false);
  const [pestana, setPestana] = useState<"producciones" | "evaluaciones">("producciones");
  useEffect(() => {
    const id = "vx-inter";
    if (document.getElementById(id)) return;
    document.head.appendChild(Object.assign(document.createElement("link"), {
      id, rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    }));
  }, []);

  const usuario = useQuery({ queryKey: ["/api/auth/user"], queryFn: () => getJson<Usuario>("/api/auth/user"), retry: false });
  const sesion = !!usuario.data;
  const overview = useQuery({ queryKey: ["/api/vortice/overview"], queryFn: () => getJson<VorticeOverview>("/api/vortice/overview"), enabled: sesion });
  const semana = useQuery({ queryKey: ["/api/vortice/brujula/semana"], queryFn: () => getJson<Semana>("/api/vortice/brujula/semana"), enabled: sesion });
  const repaso = useQuery({ queryKey: ["/api/vortice/repaso"], queryFn: () => getJson<Repaso>("/api/vortice/repaso"), enabled: sesion });
  const portafolio = useQuery({ queryKey: ["/api/vortice/portafolio"], queryFn: () => getJson<Evidencia[]>("/api/vortice/portafolio"), enabled: sesion });

  const enPreview = typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app");
  const salir = enPreview ? "/api/preview/salir" : "/api/logout";

  if (usuario.isLoading) return <div className="vx-state" aria-busy="true"><div className="vx-skeleton" /></div>;
  if (!usuario.data) {
    return (
      <div className="vx" style={{ display: "block" }}>
        <div className="vx-state">
          <h1>Inicia sesión para ver tu espacio</h1>
          <p>Tu avance, tus metas de la semana y tu siguiente paso aparecen aquí cuando entras con tu cuenta.</p>
          <a className="vx-cta" href={enPreview ? "/api/preview/entrar" : "/api/login"}>Iniciar sesión</a>
        </div>
      </div>
    );
  }

  const nombre = usuario.data.firstName || usuario.data.name?.split(" ")[0] || null;
  const ov = overview.data;
  const nivel = ov?.level;
  const linkAsignatura = (slug: string) => (nivel ? `/course/${nivel.id}-${slug}` : "#");
  const siguiente = ov?.nextStep;
  const linkSiguiente = siguiente ? linkAsignatura(ov!.subjects.find((s) => s.levelSubjectId === siguiente.levelSubjectId)?.subjectSlug ?? "") : "#asignaturas";
  const metas = semana.data?.goals ?? [];
  // Meta cumplida: el objetivo ya no es el objetivo abierto actual de su asignatura.
  const cumplida = (g: BrujulaGoal) => {
    const s = ov?.subjects.find((x) => x.levelSubjectId === g.levelSubjectId);
    return !!s && s.currentObjective?.id !== g.objectiveId;
  };
  const pendientesRepaso = repaso.data?.domains.reduce((n, d) => n + d.due, 0) ?? 0;
  const hoy = new Date();
  const dias = semanaActual(hoy);
  const mesNombre = hoy.toLocaleDateString("es-CL", { month: "long" });
  const mes = `${mesNombre.charAt(0).toUpperCase()}${mesNombre.slice(1)} ${hoy.getFullYear()}`;
  const evidencias = (portafolio.data ?? []).filter((e) => (pestana === "evaluaciones" ? e.kind === "evaluacion" : e.kind !== "evaluacion"));

  return (
    <div className="vx">
      <aside className="vx-side" data-open={menu} aria-label="Menú principal">
        <a className="vx-brand" href="/vortice">BARKLEY<span>INSTITUTO</span></a>
        <nav className="vx-nav" aria-label="Secciones">
          <Link href="/vortice" aria-current="page"><Home />Inicio</Link>
          <a href="#semana" onClick={() => setMenu(false)}><CalendarDays />Planificador</a>
          <a href="#asignaturas" onClick={() => setMenu(false)}><BookOpen />Asignaturas</a>
          <a href="#portafolio" onClick={() => setMenu(false)}><BriefcaseBusiness />Portafolio</a>
          <Link href="/academic-copilot"><MessageCircle />Tutor virtual</Link>
          <Link href="/together"><Users />Together</Link>
        </nav>
        <div className="vx-quote">
          <p>“Pequeños avances, grandes resultados.”</p>
          <img src="/images/vortice/planta.jpg" alt="" />
        </div>
        <div className="vx-me">
          <div className="vx-avatar" aria-hidden="true">{(nombre ?? "?").charAt(0)}</div>
          <div><b>{nombre ?? "Estudiante"}</b><small>{nivel?.name ?? "Sin curso asignado"}</small></div>
          <a href={salir}>Salir</a>
        </div>
      </aside>

      <main className="vx-main">
        <div className="vx-top">
          <a className="vx-brand" href="/vortice">BARKLEY<span>INSTITUTO</span></a>
          <button type="button" onClick={() => setMenu(!menu)} aria-label={menu ? "Cerrar menú" : "Abrir menú"} aria-expanded={menu}>
            {menu ? <X /> : <Menu />}
          </button>
        </div>

        <div className="vx-board">
          <div className="vx-stack">
          <section className="vx-hero" aria-labelledby="vx-saludo">
            <div className="vx-hero-art" role="img" aria-label="Estudiante escribiendo en su escritorio" />
            <div className="vx-hero-body">
              <h1 id="vx-saludo">{nombre ? `Hola, ${nombre}` : "Hola"}</h1>
              <p className="vx-sub">{ov?.track ? SUBTITULO[ov.track] : "Este es tu espacio de aprendizaje."}</p>
              <p className="vx-lema">“Pequeños avances, grandes resultados.”</p>
              <Link className="vx-cta" href={linkSiguiente}>
                {siguiente ? "Continuar mi plan de hoy" : "Ver mis asignaturas"} <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className="vx-focus" id="semana">
              <h2><Target aria-hidden="true" />Enfoque de la semana</h2>
              {semana.isLoading ? <div className="vx-skeleton" style={{ minHeight: 70 }} /> : metas.length === 0 ? (
                <p className="vx-empty">Sin metas esta semana: no quedan objetivos liberados.</p>
              ) : (
                <ul>
                  {metas.map((g) => (
                    <li key={g.objectiveId}>
                      <i data-done={cumplida(g)} aria-hidden="true" />
                      <span>{g.subjectName}: {g.objectiveTitle}<small>{cumplida(g) ? "Cumplida" : g.objectiveCode}</small></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>


          <div className="vx-cards">
          <section className="vx-card" aria-labelledby="vx-prog">
            <header><h2 id="vx-prog"><BarChart3 aria-hidden="true" />Mi progreso académico</h2></header>
            {overview.isLoading ? <div className="vx-skeleton" /> : ov?.totals.percent == null ? (
              <p className="vx-empty">Todavía no hay contenido cargado para medir tu avance.</p>
            ) : (
              <div className="vx-progress">
                <div className="vx-ring" style={{ ["--p" as string]: ov.totals.percent }} role="img" aria-label={`${ov.totals.percent}% de avance global`}>
                  <div><div><strong>{ov.totals.percent}%</strong><small>Avance global</small></div></div>
                </div>
                <ul className="vx-stats">
                  <li><i style={{ background: "#2f6b55" }} />Actividades completadas <b>{ov.totals.completedItems} / {ov.totals.totalItems}</b></li>
                  <li><i style={{ background: "#1f4a3d" }} />Asignaturas con avance <b>{ov.subjects.filter((s) => (s.percent ?? 0) > 0).length} / {ov.subjects.length}</b></li>
                  <li><i style={{ background: "#e8893a" }} />Metas de la semana <b>{metas.filter(cumplida).length} / {metas.length}</b></li>
                  <li><i style={{ background: "#4a7fd4" }} />Preguntas de repaso <b>{pendientesRepaso}</b></li>
                </ul>
              </div>
            )}
          </section>

          <section className="vx-card" id="asignaturas" aria-labelledby="vx-asig">
            <header><h2 id="vx-asig"><ClipboardCheck aria-hidden="true" />Mis asignaturas</h2>{nivel && <small>{nivel.name}</small>}</header>
            {overview.isLoading ? <div className="vx-skeleton" /> : overview.isError ? (
              <p className="vx-empty">No pudimos cargar tus asignaturas. Recarga la página para intentarlo de nuevo.</p>
            ) : !ov?.subjects.length ? (
              <p className="vx-empty">Aún no tienes asignaturas matriculadas.</p>
            ) : (
              <div className="vx-subjects">
                {ov.subjects.map((s) => {
                  const img = MINIATURA[s.subjectSlug] ?? "asig-electivo";
                  return (
                    <Link key={s.levelSubjectId} className="vx-subject" href={linkAsignatura(s.subjectSlug)}>
                      <div className="vx-thumb" style={{ backgroundImage: `url(/images/vortice/${img}.jpg)` }} />
                      <b title={s.subjectName}>{s.subjectName}</b>
                      {s.percent === null ? <small className="vx-empty">Sin contenido aún</small> : (
                        <div className="vx-meter" role="progressbar" aria-valuenow={s.percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Avance en ${s.subjectName}`}>
                          <span><i style={{ width: `${s.percent}%`, background: colorAvance(s.percent) }} /></span>{s.percent}%
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="vx-card vx-span2" id="portafolio" aria-labelledby="vx-port">
            <header><h2 id="vx-port"><FileText aria-hidden="true" />Mi portafolio</h2></header>
            <div className="vx-tabs" role="tablist" aria-label="Tipo de evidencia">
              <button role="tab" aria-selected={pestana === "producciones"} onClick={() => setPestana("producciones")}>Producciones</button>
              <button role="tab" aria-selected={pestana === "evaluaciones"} onClick={() => setPestana("evaluaciones")}>Evaluaciones</button>
            </div>
            {portafolio.isLoading ? <div className="vx-skeleton" /> : evidencias.length === 0 ? (
              <p className="vx-empty">{pestana === "producciones" ? "Aún no hay producciones en tu portafolio." : "Aún no hay evaluaciones en tu portafolio."}</p>
            ) : (
              <ul className="vx-list">
                {evidencias.slice(0, 5).map((e) => {
                  const [txt, bg, fg] = VISIBILIDAD[e.visibility];
                  const Icon = e.kind === "enlace" ? Link2 : e.kind === "evaluacion" ? ClipboardCheck : FileText;
                  return (
                    <li key={e.id}>
                      <div className="vx-doc" style={{ background: e.kind === "enlace" ? "#fdf0e3" : "#e6eef9", color: e.kind === "enlace" ? "#c06a1f" : "#3a64a8" }}><Icon aria-hidden="true" /></div>
                      <div><b>{e.title}</b><small>{e.evaluationTitle ?? (e.kind === "enlace" ? "Enlace" : "Texto")} · {new Date(e.createdAt).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}</small></div>
                      <span className="vx-chip" style={{ background: bg, color: fg }} title="Quién puede verla">{txt}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          </div>
          </div>
          <aside className="vx-stack vx-right" aria-label="Mi semana">
            <section className="vx-card" aria-labelledby="vx-cal">
              <header><h2 id="vx-cal"><CalendarDays aria-hidden="true" />{mes}</h2>{semana.data && !semana.data.saved && <small>Plan propuesto</small>}</header>
              <div className="vx-week">
                {dias.map((d) => (
                  <div key={d.toISOString()} aria-current={mismoDia(d, hoy) ? "date" : undefined}>
                    {d.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "")}<b>{d.getDate()}</b>
                  </div>
                ))}
              </div>
              {metas.length ? (
                <ul className="vx-agenda">
                  {metas.map((g, i) => (
                    <li key={g.objectiveId}><i style={{ background: PUNTOS[i % PUNTOS.length] }} />{g.subjectName}: {g.objectiveTitle}<small>{g.objectiveCode}</small></li>
                  ))}
                </ul>
              ) : <p className="vx-empty">No hay metas para esta semana.</p>}
            </section>

            <section className="vx-card" aria-labelledby="vx-repaso">
              <header><h2 id="vx-repaso"><RotateCcw aria-hidden="true" />Repaso</h2></header>
              {repaso.isLoading ? <div className="vx-skeleton" style={{ minHeight: 48 }} /> : (
pendientesRepaso === 0 ? <p className="vx-empty">No tienes preguntas para repasar hoy.</p> : (
                <div className="vx-review">
                  <strong>{pendientesRepaso}</strong>
                  <p className="vx-empty">{pendientesRepaso === 1 ? "pregunta para repasar hoy." : "preguntas para repasar hoy."}</p>
                </div>
              )
              )}
            </section>

            <section className="vx-card" aria-labelledby="vx-apoyo">
              <header><h2 id="vx-apoyo"><MessageCircle aria-hidden="true" />¿Necesitas apoyo?</h2></header>
              <div className="vx-help">
                <img src="/images/vortice/robot-apoyo.jpg" alt="" />
                <div>
                  <p>Puedes preguntarme lo que necesites. Te explico con otras palabras y te doy pistas.</p>
                  <Link href="/academic-copilot"><MessageCircle aria-hidden="true" />Hablar con mi tutor virtual</Link>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
