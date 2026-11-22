// Inicio del estudiante en Vórtice, según el diseño entregado por la dirección (2026-10-24).
// Solo datos reales: /api/auth/user, /api/vortice/overview, /api/vortice/brujula/semana,
// /api/vortice/repaso y /api/vortice/portafolio. Las secciones del diseño sin datos en la
// plataforma (ruta PAES, proyectos, recursos, orientación, evaluaciones con fecha) no se muestran.
import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, BarChart3, BookOpen, Compass, BriefcaseBusiness, CalendarDays, ChevronRight, FileText, Home,
  Link2, Menu, MessageCircle, ClipboardCheck, Target, Users, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { VorticeOverview, VorticeTrack } from "@shared/vortice";
import type { BloqueEstudio, BrujulaGoal, PreferenciasBrujula } from "@shared/brujula";
import type { PanelBrujula } from "@shared/brujulaPanel";
import { RobotTutor } from "./RobotTutor";
import { BrujulaPanel } from "./BrujulaPanel";
import "./vortice.css";

interface Usuario { firstName: string | null; name: string | null }
interface Semana { saved: boolean; goals: BrujulaGoal[] }
interface BloquesRes { weekStart: string; preferencias: PreferenciasBrujula; saved: boolean; bloques: BloqueEstudio[] }
interface Repaso { domains: { due: number }[] }
interface MapaResumenInicio {
  disponible: boolean;
  resumen: {
    dominados: number;
    listos: number;
    enPractica: number;
    porReforzar: number;
    porComprobar: number;
  };
  retencion?: { pendientesCount: number };
}
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
const VISIBILIDAD = { privada: ["Privada", "#F3F1EA", "#5E5D59"], tutor: ["Tutor", "#EEF4FC", "#2F5EA8"], familia: ["Familia", "#EDF3F0", "#1F4A3D"] } as const;

const claseAvance = (p: number) => (p >= 70 ? "[&>div]:bg-[#2D6654]" : p >= 55 ? "[&>div]:bg-[#C96442]" : "[&>div]:bg-[#C84B3B]");

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

  const queryClient = useQueryClient();
  const usuario = useQuery({ queryKey: ["/api/auth/user"], queryFn: () => getJson<Usuario>("/api/auth/user"), retry: false });
  const sesion = !!usuario.data;
  const overview = useQuery({ queryKey: ["/api/vortice/overview"], queryFn: () => getJson<VorticeOverview & { evaluacionE2?: boolean }>("/api/vortice/overview"), enabled: sesion });
  const semana = useQuery({ queryKey: ["/api/vortice/brujula/semana"], queryFn: () => getJson<Semana>("/api/vortice/brujula/semana"), enabled: sesion });
  const panel = useQuery({ queryKey: ["/api/vortice/brujula/panel"], queryFn: () => getJson<PanelBrujula>("/api/vortice/brujula/panel"), enabled: sesion });
  const preferencias = useQuery({ queryKey: ["/api/vortice/brujula/preferencias"], queryFn: () => getJson<PreferenciasBrujula>("/api/vortice/brujula/preferencias"), enabled: sesion });
  const bloques = useQuery({ queryKey: ["/api/vortice/brujula/bloques"], queryFn: () => getJson<BloquesRes>("/api/vortice/brujula/bloques"), enabled: sesion });
  const repaso = useQuery({ queryKey: ["/api/vortice/repaso"], queryFn: () => getJson<Repaso>("/api/vortice/repaso"), enabled: sesion });
  const mapa = useQuery({ queryKey: ["/api/vortice/conocimiento/mapa"], queryFn: () => getJson<MapaResumenInicio>("/api/vortice/conocimiento/mapa"), enabled: sesion, retry: false });
  const portafolio = useQuery({ queryKey: ["/api/vortice/portafolio"], queryFn: () => getJson<Evidencia[]>("/api/vortice/portafolio"), enabled: sesion });

  const savePrefsMutation = useMutation({
    mutationFn: async (next: PreferenciasBrujula) => {
      const res = await fetch("/api/vortice/brujula/preferencias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error("Error guardando preferencias");
      return res.json() as Promise<PreferenciasBrujula>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vortice/brujula/preferencias"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vortice/brujula/bloques"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vortice/brujula/semana"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vortice/brujula/panel"] });
    },
  });

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const toggleBloqueMutation = useMutation({
    mutationFn: async ({ blockId, completado }: { blockId: string; completado: boolean }) => {
      setTogglingId(blockId);
      const res = await fetch(`/api/vortice/brujula/bloques/${encodeURIComponent(blockId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ completado }),
      });
      if (!res.ok) throw new Error("Error actualizando bloque");
      return res.json() as Promise<BloquesRes>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/vortice/brujula/bloques"], data);
    },
    onSettled: () => setTogglingId(null),
  });

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
  const aEvaluacion = siguiente?.kind === "evaluation" && ov?.evaluacionE2 === true;
  const linkSiguiente = aEvaluacion
    ? `/vortice/evaluacion/${encodeURIComponent(siguiente!.itemId)}`
    : siguiente ? linkAsignatura(ov!.subjects.find((s) => s.levelSubjectId === siguiente.levelSubjectId)?.subjectSlug ?? "") : "#asignaturas";
  const metas = semana.data?.goals ?? [];
  // Meta cumplida: el objetivo ya no es el objetivo abierto actual de su asignatura.
  const cumplida = (g: BrujulaGoal) => {
    const s = ov?.subjects.find((x) => x.levelSubjectId === g.levelSubjectId);
    return !!s && s.currentObjective?.id !== g.objectiveId;
  };
  const pendientesRepaso = repaso.data?.domains.reduce((n, d) => n + d.due, 0) ?? 0;
  const metasCumplidas = metas.filter(cumplida).length;
  const estrellasConfirmadas = mapa.data?.disponible ? mapa.data.resumen.dominados : null;
  const repasosMapa = mapa.data?.disponible ? (mapa.data.retencion?.pendientesCount ?? 0) : 0;
  const repasosTotal = repasosMapa + pendientesRepaso;
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
          <div className="vx-nav-group">Estudio</div>
          <Link href="/vortice" aria-current="page"><Home />Inicio</Link>
          <Link href="/vortice/aula"><BookOpen />Aula del piloto</Link>
          <Link href="/vortice/conocimientos"><Target />Mis conocimientos</Link>
          <a href="#asignaturas" onClick={() => setMenu(false)}><ClipboardCheck />Asignaturas</a>

          <div className="vx-nav-group">Organización</div>
          <a href="#semana" onClick={() => setMenu(false)}><CalendarDays />Planificador</a>
          <a href="#brujula" onClick={() => setMenu(false)}><Compass />Brújula</a>
          <a href="#portafolio" onClick={() => setMenu(false)}><BriefcaseBusiness />Portafolio</a>

          <div className="vx-nav-group">Apoyo</div>
          <Link href="/academic-copilot"><MessageCircle />Tutor virtual</Link>
          <Link href="/together"><Users />Together</Link>
        </nav>
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

        <div className="vx-shell">
          <section className="vx-hero-ed" aria-labelledby="vx-saludo">
            <div className="vx-hero-copy">
              <span className="vx-kicker">{nivel?.name ?? "Tu espacio"} · {mes}</span>
              <h1 id="vx-saludo">{nombre ? `Hola, ${nombre}` : "Hola"}</h1>
              <p className="vx-sub">{ov?.track ? SUBTITULO[ov.track] : "Este es tu espacio de aprendizaje."}</p>
              <div className="vx-hero-actions">
                <Link className="vx-cta" href={linkSiguiente}>
                  {aEvaluacion ? "Rendir mi evaluación" : siguiente ? "Continuar mi plan de hoy" : "Ver mis asignaturas"} <ArrowRight aria-hidden="true" />
                </Link>
                <Link className="vx-btn-ghost" href="/vortice/aula">
                  Aula universal (5 OA)
                </Link>
                <Link className="vx-btn-ghost" href="/vortice/conocimientos">
                  Mis conocimientos
                </Link>
              </div>
            </div>

            <div className="vx-hero-kpis" aria-label="Resumen de hoy">
              <div className="vx-kpi">
                <span className="vx-kpi-lbl">Metas de la semana</span>
                <strong className="vx-kpi-val">
                  {semana.isLoading ? "..." : `${metasCumplidas} / ${metas.length}`}
                </strong>
              </div>
              <div className="vx-kpi">
                <span className="vx-kpi-lbl">
                  {estrellasConfirmadas !== null ? "Estrellas confirmadas" : "Avance global"}
                </span>
                <strong className="vx-kpi-val">
                  {estrellasConfirmadas !== null
                    ? estrellasConfirmadas
                    : ov?.totals.percent != null ? `${ov.totals.percent}%` : "..."}
                </strong>
              </div>
              <div className="vx-kpi" data-highlight={repasosTotal > 0 ? "true" : undefined}>
                <span className="vx-kpi-lbl">Repasos hoy</span>
                <strong className="vx-kpi-val">{repasosTotal}</strong>
              </div>
            </div>
          </section>

          <div className="vx-cols">
            <div className="vx-main-col">
              <BrujulaPanel
                panel={panel.data ?? undefined}
                cargando={panel.isLoading}
                error={panel.isError}
                preferencias={preferencias.data ?? undefined}
                bloques={bloques.data?.bloques}
                onSavePreferencias={(p) => savePrefsMutation.mutate(p)}
                onToggleBloque={(blockId, completado) => toggleBloqueMutation.mutate({ blockId, completado })}
                guardandoPreferencias={savePrefsMutation.isPending}
                guardandoBloqueId={togglingId}
              />

              <section className="vx-card" id="asignaturas" aria-labelledby="vx-asig">
                <header><h2 id="vx-asig"><ClipboardCheck aria-hidden="true" />Mis asignaturas</h2>{nivel && <small>{nivel.name}</small>}</header>
                {overview.isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-xl bg-[#EFECE3]" />
                    ))}
                  </div>
                ) : overview.isError ? (
                  <p className="vx-empty">No pudimos cargar tus asignaturas. Recarga la página para intentarlo de nuevo.</p>
                ) : !ov?.subjects.length ? (
                  <Empty className="border border-dashed border-[#D5CFC2] bg-[#FAF9F5]/80 py-6 px-4 md:py-7">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ClipboardCheck className="text-[#1F4A3D]" />
                      </EmptyMedia>
                      <EmptyTitle className="text-base">Sin asignaturas matriculadas</EmptyTitle>
                      <EmptyDescription>Tus cursos aparecerán aquí apenas queden asignados a tu nivel.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="vx-subjects">
                    {ov.subjects.map((s) => {
                      const img = MINIATURA[s.subjectSlug] ?? "asig-electivo";
                      return (
                        <Link key={s.levelSubjectId} className="vx-subject" href={linkAsignatura(s.subjectSlug)}>
                          <div className="vx-thumb" style={{ backgroundImage: `url(/images/vortice/${img}.jpg)` }} />
                          <b title={s.subjectName}>{s.subjectName}</b>
                          {s.percent === null ? <small className="vx-empty">Sin contenido aún</small> : (
                            <div className="vx-meter">
                              <Progress
                                value={s.percent}
                                aria-label={`Avance en ${s.subjectName}`}
                                className={`h-1.5 flex-1 bg-[#ECE8DE] ${claseAvance(s.percent)}`}
                              />
                              {s.percent}%
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="vx-card" id="portafolio" aria-labelledby="vx-port">
                <header><h2 id="vx-port"><FileText aria-hidden="true" />Mi portafolio</h2></header>
                <Tabs value={pestana} onValueChange={(v) => setPestana(v as "producciones" | "evaluaciones")}>
                  <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl bg-[#F3F1EA] border border-[#E6E2D8] p-1">
                    <TabsTrigger
                      value="producciones"
                      className="rounded-lg py-1.5 text-sm text-[#5E5D59] data-[state=active]:bg-white data-[state=active]:text-[#141413] data-[state=active]:shadow-sm"
                    >
                      Producciones
                    </TabsTrigger>
                    <TabsTrigger
                      value="evaluaciones"
                      className="rounded-lg py-1.5 text-sm text-[#5E5D59] data-[state=active]:bg-white data-[state=active]:text-[#141413] data-[state=active]:shadow-sm"
                    >
                      Evaluaciones
                    </TabsTrigger>
                  </TabsList>
                  {(["producciones", "evaluaciones"] as const).map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-3">
                      {portafolio.isLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-14 w-full rounded-xl bg-[#EFECE3]" />
                          <Skeleton className="h-14 w-full rounded-xl bg-[#EFECE3]" />
                        </div>
                      ) : evidencias.length === 0 ? (
                        <Empty className="border border-dashed border-[#D5CFC2] bg-[#FAF9F5]/80 py-6 px-4 md:py-7">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <FileText className="text-[#1F4A3D]" />
                            </EmptyMedia>
                            <EmptyTitle className="text-base">
                              {tab === "producciones" ? "Sin producciones todavía" : "Sin evaluaciones registradas"}
                            </EmptyTitle>
                            <EmptyDescription>
                              {tab === "producciones"
                                ? "Aún no hay producciones en tu portafolio."
                                : "Aún no hay evaluaciones en tu portafolio."}
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      ) : (
                        <ItemGroup className="gap-2">
                          {evidencias.slice(0, 5).map((e) => {
                            const [txt, bg, fg] = VISIBILIDAD[e.visibility];
                            const Icon = e.kind === "enlace" ? Link2 : e.kind === "evaluacion" ? ClipboardCheck : FileText;
                            return (
                              <Item
                                key={e.id}
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-[#E6E2D8] bg-[#FAF9F5]/60 px-3.5 py-2.5"
                              >
                                <ItemMedia
                                  variant="icon"
                                  className="rounded-lg border-transparent"
                                  style={{
                                    background: e.kind === "enlace" ? "#FBF0EB" : "#EEF4FC",
                                    color: e.kind === "enlace" ? "#C96442" : "#2F5EA8",
                                  }}
                                >
                                  <Icon aria-hidden="true" />
                                </ItemMedia>
                                <ItemContent>
                                  <ItemTitle className="text-[#141413]">{e.title}</ItemTitle>
                                  <ItemDescription className="text-xs text-[#87867F]">
                                    {e.evaluationTitle ?? (e.kind === "enlace" ? "Enlace" : "Texto")} ·{" "}
                                    {new Date(e.createdAt).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                                  </ItemDescription>
                                </ItemContent>
                                <ItemActions>
                                  <Badge
                                    variant="outline"
                                    className="rounded-full border-transparent font-medium"
                                    style={{ background: bg, color: fg }}
                                    title="Quién puede verla"
                                  >
                                    {txt}
                                  </Badge>
                                </ItemActions>
                              </Item>
                            );
                          })}
                        </ItemGroup>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </section>
            </div>

            <aside className="vx-rail-col" aria-label="Mi semana">
              <section className="vx-card" id="semana" aria-labelledby="vx-cal">
                <header><h2 id="vx-cal"><CalendarDays aria-hidden="true" />{mes}</h2>{semana.data && !semana.data.saved && <small>Plan propuesto</small>}</header>
                <div className="vx-week">
                  {dias.map((d) => (
                    <div key={d.toISOString()} aria-current={mismoDia(d, hoy) ? "date" : undefined}>
                      {d.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "")}<b>{d.getDate()}</b>
                    </div>
                  ))}
                </div>
                {semana.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-9 w-full rounded-lg bg-[#EFECE3]" />
                    <Skeleton className="h-9 w-full rounded-lg bg-[#EFECE3]" />
                  </div>
                ) : metas.length ? (
                  <ul className="vx-agenda">
                    {metas.map((g) => (
                      <li key={g.objectiveId}>
                        <span className="vx-agenda-check" data-done={cumplida(g)} aria-hidden="true" />
                        <span>{g.subjectName}: {g.objectiveTitle}</span>
                        <small>{cumplida(g) ? "Cumplida" : g.objectiveCode}</small>
                      </li>
                    ))}
                  </ul>
                ) : <p className="vx-empty">No hay metas para esta semana.</p>}
              </section>

              <section className="vx-card" id="progreso" aria-labelledby="vx-prog">
                <header>
                  <h2 id="vx-prog"><BarChart3 aria-hidden="true" />Mi progreso y conocimientos</h2>
                  <Link href="/vortice/conocimientos">Constelación <ChevronRight aria-hidden="true" /></Link>
                </header>

                <div className="vx-pulse-split">
                  <div className="vx-pulse-ch">
                    <span className="vx-kicker">Conocimientos y repaso</span>
                    {mapa.data?.disponible ? (
                      <div className="vx-pulse-map">
                        <p>
                          <strong>{mapa.data.resumen.dominados}</strong> confirmadas · <b>{mapa.data.resumen.listos}</b> listos para aprender
                        </p>
                        {(repasosMapa > 0 || pendientesRepaso > 0) && (
                          <div className="vx-pulse-alert">
                            <span>{repasosTotal} {repasosTotal === 1 ? "repaso pendiente" : "repasos pendientes"}</span>
                            <Link href="/vortice/conocimientos">Repasar ahora <ArrowRight aria-hidden="true" /></Link>
                          </div>
                        )}
                      </div>
                    ) : repaso.isLoading ? (
                      <Skeleton className="h-11 w-full rounded-lg bg-[#EFECE3]" />
                    ) : (
                      <div className="vx-pulse-map">
                        <p>
                          {pendientesRepaso === 0
                            ? "Sin repasos pendientes hoy."
                            : <><strong>{pendientesRepaso}</strong> {pendientesRepaso === 1 ? "pregunta para repasar hoy." : "preguntas para repasar hoy."}</>}
                        </p>
                      </div>
                    )}
                    <Link className="vx-pulse-link" href="/vortice/conocimientos">
                      Abrir constelación <ArrowRight aria-hidden="true" />
                    </Link>
                  </div>

                  <div className="vx-pulse-ch">
                    <span className="vx-kicker">Actividades del curso</span>
                    {overview.isLoading ? (
                      <Skeleton className="h-24 w-full rounded-lg bg-[#EFECE3]" />
                    ) : ov?.totals.percent == null ? (
                      <p className="vx-empty">Todavía no hay contenido cargado para medir tu avance.</p>
                    ) : (
                      <>
                        <div className="vx-bar-global">
                          <div className="vx-bar-top">
                            <strong>{ov.totals.percent}%</strong>
                            <small>Avance en actividades</small>
                          </div>
                          <Progress
                            value={ov.totals.percent}
                            aria-label={`${ov.totals.percent}% de avance en actividades`}
                            className="h-2 bg-[#ECE8DE] [&>div]:bg-[#1F4A3D]"
                          />
                        </div>
                        <Separator className="my-1 bg-[#E6E2D8]" />
                        <ul className="vx-stats">
                          <li><i style={{ background: "#2D6654" }} />Actividades completadas <b>{ov.totals.completedItems} / {ov.totals.totalItems}</b></li>
                          <li><i style={{ background: "#1F4A3D" }} />Asignaturas con avance <b>{ov.subjects.filter((s) => (s.percent ?? 0) > 0).length} / {ov.subjects.length}</b></li>
                          <li><i style={{ background: "#C96442" }} />Metas de la semana <b>{metasCumplidas} / {metas.length}</b></li>
                          <li><i style={{ background: "#2F5EA8" }} />Repasos hoy <b>{repasosTotal}</b></li>
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </section>

              <section className="vx-card" id="apoyo" aria-labelledby="vx-apoyo">
                <header><h2 id="vx-apoyo"><MessageCircle aria-hidden="true" />¿Necesitas apoyo?</h2></header>
                <div className="vx-help-compact">
                  <RobotTutor className="vx-help-robot-sm" />
                  <p>Te explico con otras palabras o te doy pistas paso a paso.</p>
                  <Link href="/academic-copilot"><MessageCircle aria-hidden="true" />Tutor virtual</Link>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
