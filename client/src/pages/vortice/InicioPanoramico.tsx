// Inicio del estudiante, maqueta A «Panorámica» (elegida por el sostenedor, 2026-11-27).
// Solo presentación: los datos y los enlaces los decide VorticeInicio.
import { Link } from "wouter";
import { ArrowRight, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import StateBlock from "@/components/vortice/StateBlock";
import type { VorticeOverview } from "@shared/vortice";
import type { useInicioDatos } from "./useInicioDatos";
import "./inicio.css";

type Asignatura = VorticeOverview["subjects"][number];

interface Props {
  datos: ReturnType<typeof useInicioDatos>;
  nombre: string | null;
  linkSiguiente: string;
  aEvaluacion: boolean;
  repasosTotal: number;
  hrefAsignatura: (asignatura: Asignatura) => string;
  miniatura: (slug: string, nombre: string, tramo: string | null | undefined) => string | null;
}

const TINTES: [RegExp, string][] = [
  [/matemat/, "azul"], [/lengua/, "violeta"], [/histor|geograf/, "naranja"], [/cienc/, "turquesa"],
];
const ORDEN = ["azul", "violeta", "naranja", "turquesa"];
const tinte = (nombre: string, i: number) => {
  const n = nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return TINTES.find(([r]) => r.test(n))?.[1] ?? ORDEN[i % ORDEN.length];
};

export function InicioPanoramico({ datos, nombre, linkSiguiente, aEvaluacion, repasosTotal, hrefAsignatura, miniatura }: Props) {
  const ov = datos.overview.data;
  const siguiente = ov?.nextStep;
  const mapa = datos.mapa.data?.disponible ? datos.mapa.data.resumen : null;
  const bloques = datos.bloques.data?.bloques ?? [];
  const hechos = bloques.filter((b) => b.completado).length;
  const examen = datos.panel.data?.proximaEvaluacion;
  const enPractica = mapa ? mapa.enPractica + mapa.porReforzar + mapa.porComprobar : 0;

  return (
    <div className="ini">
      <link rel="stylesheet" precedence="default" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600;700&display=swap" />

      <section className="ini-hero" aria-labelledby="ini-paso">
        {ov?.track && (
          <img
            className="ini-escena" data-tramo={ov.track}
            src={`/images/vortice/heroes/${ov.track}-1600.webp`}
            srcSet={`/images/vortice/heroes/${ov.track}-640.webp 640w, /images/vortice/heroes/${ov.track}-1024.webp 1024w, /images/vortice/heroes/${ov.track}-1600.webp 1600w`}
            sizes="100vw" width={1600} height={686} alt="" aria-hidden="true" decoding="async" fetchPriority="high"
          />
        )}
        <div className="ini-saludo">
          <h1 className="ini-hola">{nombre ? `Hola, ${nombre}` : "Hola"}. Tu siguiente paso</h1>
          {datos.overview.isLoading ? (
            <div aria-busy="true"><Skeleton className="h-32 w-80 max-w-full rounded-2xl bg-white/20" /></div>
          ) : datos.overview.isError ? (
            <StateBlock tipo="error" texto="No pudimos cargar tu siguiente paso." onReintentar={() => datos.overview.refetch()} />
          ) : siguiente ? (
            <>
              <h2 id="ini-paso" className="ini-titulo">{siguiente.subjectName}</h2>
              <p className="ini-item">{siguiente.itemTitle}</p>
              <Link className="ini-cta" href={linkSiguiente}><Play aria-hidden="true" />{aEvaluacion ? "Rendir mi evaluación" : "Continuar"}</Link>
            </>
          ) : (
            <>
              <h2 id="ini-paso" className="ini-titulo ini-titulo-largo">Aún no tienes contenido asignado</h2>
              <p className="ini-item">Cuando lo tengas, tu próximo paso aparecerá aquí.</p>
              <a className="ini-cta" href="#asignaturas">Ver mis asignaturas</a>
            </>
          )}
        </div>
      </section>

      <div className="ini-cuerpo">
        <section id="asignaturas" aria-label="Lo que estoy aprendiendo">
          {datos.overview.isLoading ? (
            <div className="ini-grid" aria-busy="true">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[3/4] w-full rounded-[26px] bg-white" />)}</div>
          ) : datos.overview.isError ? (
            <div className="ini-panel"><StateBlock tipo="error" texto="No pudimos cargar tus asignaturas." onReintentar={() => datos.overview.refetch()} /></div>
          ) : !ov?.subjects.length ? (
            <div className="ini-panel"><p>Tus cursos aparecerán aquí apenas queden asignados a tu nivel.</p></div>
          ) : (
            <ul className="ini-grid">
              {ov.subjects.map((s, i) => {
                const arte = miniatura(s.subjectSlug, s.subjectName, ov.track);
                return (
                  <li key={s.levelSubjectId}>
                    <Link className="ini-card" data-tinte={tinte(s.subjectName, i)} href={hrefAsignatura(s)}>
                      <span className="ini-arte">
                        {arte ? (
                          <img src={`/images/vortice/asignaturas/${arte}-400.webp`} srcSet={`/images/vortice/asignaturas/${arte}-400.webp 400w, /images/vortice/asignaturas/${arte}-800.webp 800w`}
                            sizes="(max-width: 900px) 45vw, 290px" width={400} height={300} alt="" aria-hidden="true" decoding="async" />
                        ) : <span className="ini-letras" aria-hidden="true">{s.subjectName.slice(0, 2)}</span>}
                      </span>
                      <span className="ini-pie">
                        <b>{s.subjectName}</b>
                        {s.percent === null ? <small>Sin contenido aún</small> : <span className="ini-pct">{s.percent}%</span>}
                      </span>
                      <span className="ini-barra" aria-hidden="true">{s.percent !== null && <i style={{ width: `${Math.max(s.percent, 2)}%` }} />}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="ini-dos">
          <section className="ini-panel ini-oscuro" aria-labelledby="ini-se">
            <h2 id="ini-se">Lo que sé</h2>
            {datos.mapa.isLoading ? (
              <Skeleton className="h-16 w-full rounded-xl bg-white/20" />
            ) : (
              <ul className="ini-cifras">
                {mapa && <li data-tono="dorado"><b>{mapa.dominados}</b>{mapa.dominados === 1 ? "confirmada" : "confirmadas"}</li>}
                {mapa && <li data-tono="violeta"><b>{enPractica}</b>en práctica</li>}
                <li data-tono="naranja"><b>{repasosTotal}</b>{repasosTotal === 1 ? "repaso" : "repasos"}</li>
              </ul>
            )}
            <Link className="ini-enlace" href="/vortice/conocimientos">Ver mi mapa<ArrowRight aria-hidden="true" /></Link>
          </section>

          <section className="ini-panel" aria-labelledby="ini-voy">
            <div className="ini-fila">
              <h2 id="ini-voy">Cómo voy</h2>
              {ov?.totals.percent != null && <p className="ini-grande"><b>{ov.totals.percent}%</b><span>de avance en actividades</span></p>}
            </div>
            <div className="ini-fila">
              {bloques.length > 0 && <ol className="ini-puntos" aria-hidden="true">{bloques.map((b, i) => <li key={b.id} data-hecho={b.completado}>{i + 1}</li>)}</ol>}
              <p>{datos.bloques.isLoading ? "Cargando bloques" : datos.bloques.isError ? "No pudimos cargar tus bloques" : bloques.length ? `${hechos} de ${bloques.length} bloques de la semana` : "Sin bloques esta semana"}</p>
            </div>
            {examen && (
              <p className="ini-examen">
                {examen.dias === 0 ? `Evaluación de ${examen.subjectName} hoy` : `Evaluación de ${examen.subjectName} en ${examen.dias} ${examen.dias === 1 ? "día" : "días"}`}
              </p>
            )}
            <div className="ini-enlaces">
              <Link className="ini-enlace" href="/vortice/semana">Ver mi semana<ArrowRight aria-hidden="true" /></Link>
              <Link className="ini-enlace" href="/vortice/apoyo">Pedir ayuda a mi tutor</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
