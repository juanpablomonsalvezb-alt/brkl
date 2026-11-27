import { useEffect, useState } from "react";
import { VorticeShell } from "@/components/vortice/VorticeShell";
import { SinSesion } from "./SinSesion";
import { useInicioDatos } from "./useInicioDatos";
import "./vortice.css";
import "./curriculo.css";

interface ObjetivoAprendizaje {
  numero: number | string;
  texto: string;
  indicadores: string[];
  eje: string | null;
  pagina: number | null;
}

interface AsignaturaCurriculo {
  slug: string;
  nombre: string;
  descripcion: string | null;
  fuente: string;
  oa: ObjetivoAprendizaje[];
}

interface CurriculoGrado {
  grado: string;
  etiqueta: string;
  asignaturas: AsignaturaCurriculo[];
}

const ARCHIVOS_CURRICULO = import.meta.glob<{ default: CurriculoGrado }>("../../data/curriculo/*.json");
const GRADOS_CURRICULO = Object.keys(ARCHIVOS_CURRICULO)
  .map((ruta) => ruta.match(/\/([^/]+)\.json$/)?.[1])
  .filter((grado): grado is string => Boolean(grado))
  .sort((a, b) => {
    const [numeroA, nivelA] = a.split("_");
    const [numeroB, nivelB] = b.split("_");
    return (nivelA === nivelB ? 0 : nivelA === "basico" ? -1 : 1) || Number(numeroA) - Number(numeroB);
  });

function etiquetaGrado(grado: string) {
  const [numero, nivel] = grado.split("_");
  return `${numero}° ${nivel === "basico" ? "Básico" : "Medio"}`;
}

export default function VorticeCurriculo() {
  const datos = useInicioDatos();
  const [elegido, setGradoSeleccionado] = useState("");
  // Por defecto, el curso del estudiante ("7° Básico" -> "7_basico"); si no se sabe, el primero.
  const propio = datos.overview.data?.level?.name?.match(/^(\d)\D{0,3}(Básico|Medio)/);
  const gradoPropio = propio ? `${propio[1]}_${propio[2] === "Medio" ? "medio" : "basico"}` : "";
  const gradoSeleccionado = elegido || (GRADOS_CURRICULO.includes(gradoPropio) ? gradoPropio : GRADOS_CURRICULO[0] ?? "");
  const [curriculo, setCurriculo] = useState<CurriculoGrado | null>(null);
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;
    const cargar = ARCHIVOS_CURRICULO[`../../data/curriculo/${gradoSeleccionado}.json`];

    setCurriculo(null);
    setAsignaturaSeleccionada("");
    setError(false);

    if (!gradoSeleccionado || !cargar) {
      setCargando(false);
      setError(Boolean(gradoSeleccionado));
      return () => { vigente = false; };
    }

    setCargando(true);
    cargar()
      .then((modulo) => {
        if (!vigente) return;
        setCurriculo(modulo.default);
        setAsignaturaSeleccionada(modulo.default.asignaturas[0]?.slug ?? "");
      })
      .catch(() => {
        if (vigente) setError(true);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => { vigente = false; };
  }, [gradoSeleccionado]);

  if (!datos.sesion) return <SinSesion cargando={datos.usuario.isLoading} enPreview={datos.enPreview} />;

  const nombre = datos.usuario.data?.firstName || datos.usuario.data?.name?.split(" ")[0] || null;
  const nivel = datos.overview.data?.level;
  const asignatura = curriculo?.asignaturas.find(({ slug }) => slug === asignaturaSeleccionada);

  return (
    <VorticeShell variante="estudiante" activo="curriculo" nombre={nombre} detalle={nivel?.name ?? "Sin curso asignado"} tramo={datos.overview.data?.track} salirHref={datos.salir}>
      <div className="vx-pagina vx-curriculo">
        <header className="vx-curriculo-intro">
          <h1 className="vx-titulo">Currículo</h1>
          <p>Elige tu curso y una asignatura para revisar los objetivos de aprendizaje.</p>
        </header>

        <section className="vx-card vx-curriculo-filtros" aria-label="Selecciona curso y asignatura">
          <div className="vx-curriculo-campo">
            <label htmlFor="vx-curriculo-grado">Curso</label>
            <select
              id="vx-curriculo-grado"
              value={gradoSeleccionado}
              onChange={(evento) => setGradoSeleccionado(evento.target.value)}
            >
              {GRADOS_CURRICULO.map((grado) => <option key={grado} value={grado}>{etiquetaGrado(grado)}</option>)}
            </select>
          </div>
          <div className="vx-curriculo-campo">
            <label htmlFor="vx-curriculo-asignatura">Asignatura</label>
            <select
              id="vx-curriculo-asignatura"
              value={asignaturaSeleccionada}
              onChange={(evento) => setAsignaturaSeleccionada(evento.target.value)}
              disabled={cargando || !curriculo?.asignaturas.length}
            >
              {curriculo?.asignaturas.map(({ slug, nombre: nombreAsignatura }) => (
                <option key={slug} value={slug}>{nombreAsignatura}</option>
              ))}
            </select>
          </div>
        </section>

        {cargando ? (
          <p className="vx-curriculo-estado" role="status" aria-live="polite">Cargando el currículo...</p>
        ) : error ? (
          <p className="vx-curriculo-estado vx-curriculo-error" role="alert">No pudimos cargar el currículo. Recarga la página para intentarlo de nuevo.</p>
        ) : asignatura ? (
          <>
            <section className="vx-card vx-curriculo-detalle" aria-labelledby="vx-curriculo-asignatura-titulo">
              <h2 id="vx-curriculo-asignatura-titulo">{asignatura.nombre}</h2>
              {asignatura.descripcion && <p className="vx-curriculo-descripcion">{asignatura.descripcion}</p>}
            </section>

            {asignatura.oa.length ? (
              <section className="vx-curriculo-objetivos" aria-label="Objetivos de aprendizaje">
                {asignatura.oa.map((objetivo, indice) => (
                  <article className="vx-card vx-curriculo-oa" key={`${objetivo.numero}-${indice}`}>
                    <h3>OA {objetivo.numero}{objetivo.eje ? `, ${objetivo.eje}` : ""}</h3>
                    <p className="vx-curriculo-texto">{objetivo.texto}</p>
                    <details className="vx-curriculo-indicadores">
                      <summary>Indicadores de evaluación ({objetivo.indicadores.length})</summary>
                      <ul>
                        {objetivo.indicadores.map((indicador, indicadorIndice) => (
                          <li key={`${indicador}-${indicadorIndice}`}>{indicador}</li>
                        ))}
                      </ul>
                    </details>
                  </article>
                ))}
              </section>
            ) : (
              <p className="vx-card vx-curriculo-no-incorporado">Este temario todavía no está incorporado.</p>
            )}

            <p className="vx-curriculo-fuente">Fuente: Temario de Exámenes de Validación de Estudios, MINEDUC ({asignatura.fuente})</p>
          </>
        ) : curriculo && !curriculo.asignaturas.length ? (
          <p className="vx-curriculo-estado">No hay asignaturas disponibles para este curso.</p>
        ) : null}
      </div>
    </VorticeShell>
  );
}