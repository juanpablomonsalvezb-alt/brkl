import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ClipboardCheck } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import StateBlock from "@/components/vortice/StateBlock";
import { VorticeShell } from "@/components/vortice/VorticeShell";
import { SinSesion } from "./SinSesion";
import { useInicioDatos } from "./useInicioDatos";
import "./vortice.css";

function miniaturaAsignatura(slug: string, name: string, track: string | null | undefined): string | null {
  const norm = `${slug} ${name}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (norm.includes("matemat")) return "matematica";
  if (norm.includes("lengua")) return "lenguaje";
  if (norm.includes("histor") || norm.includes("geograf")) return "historia";
  if (norm.includes("cienc")) return track === "media" ? "ciencias-media" : "ciencias-naturales";
  if (norm.includes("ingl")) return "ingles";
  if (norm.includes("arte")) return "artes";
  if (norm.includes("tecnolog")) return "tecnologia";
  if (norm.includes("filos")) return "filosofia";
  if (norm.includes("ciudad")) return "educacion-ciudadana";
  if (norm.includes("electiv")) return "electivo";
  return null;
}

const claseAvance = (p: number) => (p >= 70 ? "[&>div]:bg-(--vx-primary-2)" : p >= 55 ? "[&>div]:bg-(--vx-naranja)" : "[&>div]:bg-(--vx-rojo)");

export default function VorticeInicio() {
  const [location, setLocation] = useLocation();
  const datos = useInicioDatos({ brujula: true, mapa: true });
  const ov = datos.overview.data;
  const nivel = ov?.level;
  const siguiente = ov?.nextStep;
  const aEvaluacion = siguiente?.kind === "evaluation" && ov?.evaluacionE2 === true;
  const linkAsignatura = (slug: string) => (nivel ? `/course/${nivel.id}-${slug}` : "#");
  const linkSiguiente = aEvaluacion
    ? `/vortice/evaluacion/${encodeURIComponent(siguiente!.itemId)}`
    : siguiente ? linkAsignatura(ov!.subjects.find((subject) => subject.levelSubjectId === siguiente.levelSubjectId)?.subjectSlug ?? "") : "#asignaturas";
  const nombre = datos.usuario.data?.firstName || datos.usuario.data?.name?.split(" ")[0] || null;
  const pendientesRepaso = datos.repaso.data?.domains.reduce((total, domain) => total + domain.due, 0) ?? 0;
  const repasosMapa = datos.mapa.data?.disponible ? (datos.mapa.data.retencion?.pendientesCount ?? 0) : 0;
  const repasosTotal = repasosMapa + pendientesRepaso;
  const bloques = datos.bloques.data?.bloques ?? [];

  useEffect(() => {
    const ancla = window.location.hash.slice(1);
    const destinos: Record<string, string> = {
      brujula: "/vortice/semana",
      semana: "/vortice/semana",
      portafolio: "/vortice/portafolio",
      apoyo: "/vortice/apoyo",
    };
    const destino = destinos[ancla];
    if (destino) {
      setLocation(destino, { replace: true });
    } else if (ancla === "asignaturas") {
      document.getElementById("asignaturas")?.scrollIntoView();
    }
  }, [location, ov, setLocation, datos.sesion]);

  if (!datos.sesion) return <SinSesion cargando={datos.usuario.isLoading} enPreview={datos.enPreview} />;

  return (
    <VorticeShell variante="estudiante" activo="inicio" nombre={nombre} detalle={nivel?.name ?? "Sin curso asignado"} tramo={ov?.track} salirHref={datos.salir}>
      <div className="vx-pagina vx-inicio">
        <section className="vx-paso" aria-labelledby="vx-paso" data-con-imagen={ov?.track ? "true" : undefined}>
          <div className="vx-paso-contenido">
            <h1 id="vx-saludo" className="vx-titulo">{nombre ? `Hola, ${nombre}` : "Hola"}</h1>
            <h2 id="vx-paso">Tu siguiente paso</h2>
            {datos.overview.isLoading ? (
              <Skeleton className="h-12 w-full rounded-lg bg-(--vx-surface)" />
            ) : datos.overview.isError ? (
              <StateBlock tipo="error" texto="No pudimos cargar tu siguiente paso." onReintentar={() => datos.overview.refetch()} />
            ) : siguiente ? (
              <>
                <p className="vx-paso-asignatura">{siguiente.subjectName}</p>
                <p className="vx-paso-item">{siguiente.itemTitle}</p>
                <Link className="vx-paso-cta" href={linkSiguiente}>{aEvaluacion ? "Rendir mi evaluación" : "Continuar"}</Link>
              </>
            ) : (
              <>
                <p>Cuando tengas contenido asignado, tu próximo paso aparecerá aquí.</p>
                <Link className="vx-paso-cta" href="#asignaturas">Ver mis asignaturas</Link>
              </>
            )}
          </div>
          {ov?.track && (
            <img
              className="vx-paso-imagen"
              src={`/images/vortice/heroes/${ov.track}-1024.webp`}
              srcSet={`/images/vortice/heroes/${ov.track}-640.webp 640w, /images/vortice/heroes/${ov.track}-1024.webp 1024w, /images/vortice/heroes/${ov.track}-1600.webp 1600w`}
              sizes="(max-width: 760px) 100vw, 1040px"
              width={1600}
              height={686}
              alt=""
              aria-hidden="true"
              decoding="async"
            />
          )}
        </section>

        <div className="vx-inicio-rejilla">
          <section className="vx-card vx-inicio-asignaturas" id="asignaturas" aria-labelledby="vx-aprendiendo">
            <header><h2 id="vx-aprendiendo">Lo que estoy aprendiendo</h2></header>
            {datos.overview.isLoading ? (
              <ul className="vx-inicio-asignaturas-list" aria-label="Cargando asignaturas">
                {[0, 1, 2].map((item) => <li key={item}><Skeleton className="h-16 w-full rounded-lg bg-(--vx-surface)" /></li>)}
              </ul>
            ) : datos.overview.isError ? (
              <StateBlock tipo="error" texto="No pudimos cargar tus asignaturas." onReintentar={() => datos.overview.refetch()} />
            ) : !ov?.subjects.length ? (
              <Empty className="border border-dashed border-(--vx-line) bg-(--vx-bg) py-4 px-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><ClipboardCheck className="text-(--vx-primary)" /></EmptyMedia>
                  <EmptyTitle className="text-base">Sin asignaturas matriculadas</EmptyTitle>
                  <EmptyDescription>Tus cursos aparecerán aquí apenas queden asignados a tu nivel.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="vx-inicio-asignaturas-list">
                {ov.subjects.map((subject) => {
                  const arte = miniaturaAsignatura(subject.subjectSlug, subject.subjectName, ov.track);
                  return (
                    <li key={subject.levelSubjectId}>
                      <Link className="vx-inicio-asignatura" href={linkAsignatura(subject.subjectSlug)}>
                        {arte ? (
                          <img
                            className="vx-inicio-asignatura-imagen"
                            src={`/images/vortice/asignaturas/${arte}-400.webp`}
                            srcSet={`/images/vortice/asignaturas/${arte}-400.webp 400w, /images/vortice/asignaturas/${arte}-800.webp 800w`}
                            sizes="(max-width: 760px) 45vw, 240px"
                            width={400}
                            height={300}
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span className="vx-inicio-asignatura-iniciales" aria-hidden="true">{subject.subjectName.slice(0, 2)}</span>
                        )}
                        <span className="vx-inicio-asignatura-contenido">
                          <b>{subject.subjectName}</b>
                          {subject.percent === null ? <small>Sin contenido aún</small> : (
                            <span className="vx-inicio-avance">
                              <Progress
                                value={subject.percent}
                                aria-label={`Avance en ${subject.subjectName}`}
                                className={`h-1.5 flex-1 bg-(--vx-line) ${claseAvance(subject.percent)}`}
                              />
                              <small>{subject.percent}%</small>
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="vx-card vx-inicio-mapa" aria-labelledby="vx-lo-que-se">
            <header><h2 id="vx-lo-que-se">Lo que sé</h2></header>
            {datos.mapa.isLoading ? (
              <Skeleton className="h-16 w-full rounded-lg bg-(--vx-surface)" />
            ) : datos.mapa.data?.disponible ? (
              <ul className="vx-inicio-resumen">
                <li>{datos.mapa.data.resumen.dominados} {datos.mapa.data.resumen.dominados === 1 ? "confirmada" : "confirmadas"}</li>
                <li>{datos.mapa.data.resumen.enPractica + datos.mapa.data.resumen.porReforzar + datos.mapa.data.resumen.porComprobar} en práctica</li>
                {repasosTotal > 0 && <li>{repasosTotal} {repasosTotal === 1 ? "repaso pendiente" : "repasos pendientes"}</li>}
              </ul>
            ) : datos.repaso.isLoading ? (
              <Skeleton className="h-12 w-full rounded-lg bg-(--vx-surface)" />
            ) : (
              <p>{pendientesRepaso === 0
                ? "Sin repasos pendientes hoy."
                : `${pendientesRepaso} ${pendientesRepaso === 1 ? "pregunta para repasar hoy." : "preguntas para repasar hoy."}`}</p>
            )}
            <Link className="vx-link" href="/vortice/conocimientos">Ver mi mapa</Link>
          </section>

          <section className="vx-card vx-inicio-como-voy" aria-labelledby="vx-como-voy">
            <header><h2 id="vx-como-voy">Cómo voy</h2></header>
            <ul className="vx-inicio-resumen">
              <li>{datos.bloques.isLoading ? "Cargando bloques de la semana" : datos.bloques.isError ? "No pudimos cargar tus bloques" : bloques.length
                ? `${bloques.filter((bloque) => bloque.completado).length} de ${bloques.length} bloques de la semana`
                : "Sin bloques esta semana"}</li>
              {ov?.totals.percent != null && <li>{ov.totals.percent} % de avance en actividades</li>}
              {datos.panel.data?.proximaEvaluacion && (
                <li>
                  {datos.panel.data.proximaEvaluacion.dias === 0
                    ? `Próxima evaluación hoy: ${datos.panel.data.proximaEvaluacion.subjectName}`
                    : `Próxima evaluación en ${datos.panel.data.proximaEvaluacion.dias} ${datos.panel.data.proximaEvaluacion.dias === 1 ? "día" : "días"}: ${datos.panel.data.proximaEvaluacion.subjectName}`}
                </li>
              )}
            </ul>
            <div className="vx-inicio-enlaces">
              <Link className="vx-link" href="/vortice/semana">Ver mi semana</Link>
              <Link className="vx-link" href="/vortice/apoyo">Pedir ayuda a mi tutor</Link>
            </div>
          </section>
        </div>
      </div>
    </VorticeShell>
  );
}