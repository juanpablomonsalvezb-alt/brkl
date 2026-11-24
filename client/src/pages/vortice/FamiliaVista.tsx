// Portal Familia (solo lectura): vista del apoderado con ritmo cualitativo, bloques semanales y orientación.
// Nunca muestra porcentajes ni notas de evaluación E2.
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarDays, Compass, Users } from "lucide-react";
import { CONFIG_INTENSIDAD } from "@shared/brujula";
import type { EstadoRitmoApoderado, ResumenBrujulaApoderado } from "@shared/brujulaPanel";
import "./vortice.css";
import "./brujula.css";

interface Usuario { firstName: string | null; name: string | null }
interface EstudianteVinculado { studentUserId: string; name: string | null }
interface ResumenFamilia {
  student: EstudianteVinculado;
  overview: { level: { id: string; name: string } | null };
  month: string;
  studyDays: number;
  evaluationsInReview: { title: string; subjectName: string; completedAt: string | null }[];
  brujula: ResumenBrujulaApoderado;
}

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

const RITMO_CLASE: Record<EstadoRitmoApoderado, string> = {
  al_dia: "ok",
  adelantado: "ok",
  por_recuperar: "atraso",
  sin_datos: "nada",
};

export default function FamiliaVista() {
  const [selectedId, setSelectedId] = useState<string>("");
  const usuario = useQuery({ queryKey: ["/api/auth/user"], queryFn: () => getJson<Usuario>("/api/auth/user"), retry: false });
  const sesion = !!usuario.data;
  const estudiantes = useQuery({
    queryKey: ["/api/familia/estudiantes"],
    queryFn: () => getJson<EstudianteVinculado[]>("/api/familia/estudiantes"),
    enabled: sesion,
  });

  useEffect(() => {
    const lista = estudiantes.data ?? [];
    if (lista.length > 0 && !lista.some((e) => e.studentUserId === selectedId)) {
      setSelectedId(lista[0].studentUserId);
    }
  }, [estudiantes.data, selectedId]);

  const resumen = useQuery({
    queryKey: ["/api/familia/estudiantes", selectedId, "resumen"],
    queryFn: () => getJson<ResumenFamilia>(`/api/familia/estudiantes/${encodeURIComponent(selectedId)}/resumen`),
    enabled: sesion && !!selectedId,
  });

  const enPreview = typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app");
  const salir = enPreview ? "/api/preview/salir" : "/api/logout";

  if (usuario.isLoading) return <div className="vx-state" aria-busy="true"><div className="vx-skeleton" /></div>;
  if (!usuario.data) {
    return (
      <div className="vx" style={{ display: "block" }}>
        <div className="vx-state">
          <h1>Portal Familia</h1>
          <p>Inicia sesión con tu cuenta de apoderado para ver el ritmo de estudio y la orientación semanal.</p>
          <a className="vx-cta" href={enPreview ? "/api/preview/entrar" : "/api/login"}>Iniciar sesión</a>
        </div>
      </div>
    );
  }

  const lista = estudiantes.data ?? [];
  const data = resumen.data;
  const b = data?.brujula;

  return (
    <div className="vx">
      <aside className="vx-side" aria-label="Menú familia">
        <a className="vx-brand" href="/familia">BARKLEY<span>FAMILIA</span></a>
        <nav className="vx-nav" aria-label="Estudiantes">
          <a href="#resumen" aria-current="page"><Compass />Resumen</a>
          <a href="#asignaturas"><BookOpen />Asignaturas</a>
          <a href="#evaluaciones"><CalendarDays />Evaluaciones</a>
        </nav>
        <div className="vx-me">
          <div className="vx-avatar" aria-hidden="true"><Users size={18} /></div>
          <div><b>Apoderado</b><small>Solo lectura</small></div>
          <a href={salir}>Salir</a>
        </div>
      </aside>

      <main className="vx-main" style={{ paddingTop: 18 }}>
        <section className="vx-card" id="resumen" style={{ marginBottom: 16 }}>
          <header>
            <div>
              <span className="vx-kicker" style={{ display: "block", marginBottom: 4 }}>
                Portal familia · solo lectura
              </span>
              <h2><Compass aria-hidden="true" />Acompañamiento semanal</h2>
            </div>
            {lista.length > 1 && (
              <select
                aria-label="Seleccionar estudiante"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 999,
                  border: "1px solid var(--vx-line-strong)",
                  background: "var(--vx-card)",
                  fontFamily: "var(--vx-sans)",
                  fontSize: 13.5,
                }}
              >
                {lista.map((est) => (
                  <option key={est.studentUserId} value={est.studentUserId}>
                    {est.name ?? "Estudiante"}
                  </option>
                ))}
              </select>
            )}
          </header>

          {estudiantes.isLoading ? (
            <div className="vx-skeleton" />
          ) : lista.length === 0 ? (
            <p className="vx-empty">Aún no tienes estudiantes vinculados en Portal Familia.</p>
          ) : resumen.isLoading ? (
            <div className="vx-skeleton" />
          ) : !data || !b ? (
            <p className="vx-empty">No pudimos cargar el resumen de tu estudiante. Intenta recargar la página.</p>
          ) : (
            <>
              <div className="vb-fila" style={{ marginBottom: 14, alignItems: "flex-end" }}>
                <div>
                  <h3 style={{ fontSize: 25, lineHeight: 1.15, marginBottom: 4 }}>
                    {data.student.name ?? "Estudiante"}
                  </h3>
                  <div style={{ color: "var(--vx-ink-soft)", fontSize: 13.5 }}>
                    {data.overview.level?.name ?? "Curso escolar"} · {data.studyDays} {data.studyDays === 1 ? "día" : "días"} de estudio en {data.month}
                  </div>
                </div>
                <span className="vb-chip" data-ritmo={RITMO_CLASE[b.estadoGeneral]}>{b.etiquetaEstado}</span>
              </div>

              <div className="vb-prefs" style={{ marginBottom: 14 }}>
                <div className="vb-fila">
                  <span>Intensidad semanal: <b>{CONFIG_INTENSIDAD[b.intensidad].label}</b></span>
                  <span>Bloques esta semana: <b>{b.bloquesCompletados} de {b.bloquesPlanificados}</b></span>
                </div>
              </div>

              {b.proximaEvaluacion && (
                <p className="vb-proxima">
                  <span>Próxima evaluación</span>
                  <b>{b.proximaEvaluacion.dias === 0 ? "Hoy" : `En ${b.proximaEvaluacion.dias} ${b.proximaEvaluacion.dias === 1 ? "día" : "días"}`}</b>
                  <em>«{b.proximaEvaluacion.titulo}» · {b.proximaEvaluacion.subjectName}</em>
                </p>
              )}

              <ul className="vb-notas" aria-label="Orientación para acompañar">
                {b.orientacionSinProximaEvaluacion.map((texto, i) => (
                  <li key={i} data-tono={b.estadoGeneral === "por_recuperar" ? "aviso" : "ok"}>
                    <span className="vb-aguja" aria-hidden="true" />
                    <div><small>Orientación</small><p>{texto}</p></div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {b && (
          <section className="vx-card" id="asignaturas" style={{ marginBottom: 14 }}>
            <header><h2><BookOpen aria-hidden="true" />Ritmo por asignatura</h2></header>
            {b.asignaturas.length === 0 ? (
              <p className="vx-empty">Aún no hay asignaturas matriculadas.</p>
            ) : (
              <ul className="vb-ritmo">
                {b.asignaturas.map((a) => (
                  <li key={a.subjectName} className="vb-fila" style={{ padding: "8px 0", borderTop: "1px solid var(--vx-line)" }}>
                    <b>{a.subjectName}</b>
                    <span className="vb-chip" data-ritmo={RITMO_CLASE[a.estado]}>{a.etiquetaEstado}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {data && (
          <section className="vx-card" id="evaluaciones">
            <header><h2><CalendarDays aria-hidden="true" />Evaluaciones por completar</h2></header>
            {data.evaluationsInReview.length === 0 ? (
              <p className="vx-empty">No hay evaluaciones pendientes de aprobación en este momento.</p>
            ) : (
              <ul className="vx-agenda">
                {data.evaluationsInReview.map((ev, i) => (
                  <li key={`${ev.subjectName}-${ev.title}-${i}`}>
                    <i style={{ background: "var(--vx-amber)" }} />
                    <span><b>{ev.subjectName}:</b> {ev.title}</span>
                    {ev.completedAt && (
                      <small>{new Date(ev.completedAt).toLocaleDateString("es-CL")}</small>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
