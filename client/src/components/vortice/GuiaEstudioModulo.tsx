// Guía de Estudio Integral del Módulo (lectura autónoma, índice navegable, tamaño de texto,
// integración multimodal con el Aula e impresión / exportación a PDF limpia).
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Compass,
  Download,
  ExternalLink,
  Lightbulb,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  puertasDisponibles,
  type LeccionUniversalPiloto,
  type OaPilotoId,
  type PasoLeccion,
} from "@shared/aulaUniversal";
import { ENRIQUECIMIENTO_MATEMATICA_M1 } from "@/data/iabarkley/matematica-m1";
import "../../pages/vortice/guia-estudio.css";

type EscalaTexto = "normal" | "grande" | "xl";
type AlcanceGuia = "modulo" | "oa_actual";

interface Props {
  curso: string;
  asignatura: string;
  modulo: string;
  lecciones: readonly LeccionUniversalPiloto[];
  oaActualId: OaPilotoId;
  onVolverAula: () => void;
  onIrAlAula: (oaId: OaPilotoId, paso: PasoLeccion) => void;
}

export default function GuiaEstudioModulo({
  curso,
  asignatura,
  modulo,
  lecciones,
  oaActualId,
  onVolverAula,
  onIrAlAula,
}: Props) {
  const [escala, setEscala] = useState<EscalaTexto>("normal");
  const [alcance, setAlcance] = useState<AlcanceGuia>("modulo");

  const leccionesVisibles =
    alcance === "oa_actual"
      ? lecciones.filter((l) => l.oaId === oaActualId)
      : lecciones;

  const fechaHoy = new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const tiempoTotalMin = leccionesVisibles.reduce(
    (acc, l) => acc + l.tiempoEstimadoMin,
    0,
  );

  const imprimirDocumento = () => {
    const tituloPrevio = document.title;
    const sufijo =
      alcance === "oa_actual" && leccionesVisibles[0]
        ? `_${leccionesVisibles[0].codigo.replace(/\s+/g, "")}`
        : "_Modulo_Completo";
    document.title = `Guia_de_Estudio_${asignatura}_${modulo.replace(/\s+/g, "_")}${sufijo}`;
    window.print();
    window.setTimeout(() => {
      document.title = tituloPrevio;
    }, 500);
  };

  return (
    <div className="vx-guia-wrap">
      {/* Barra de controles de lectura, alcance e impresión/PDF (se oculta al imprimir) */}
      <div className="vx-guia-toolbar no-print" role="region" aria-label="Controles de la Guía de Estudio">
        <div className="vx-guia-toolbar-grupo">
          <Button type="button" variant="outline" size="sm" onClick={onVolverAula}>
            <ArrowLeft size={15} aria-hidden="true" />
            Volver al Aula interactiva
          </Button>

          <div className="vx-guia-seg" role="group" aria-label="Alcance de la guía">
            <button
              type="button"
              className="vx-guia-seg-btn"
              aria-pressed={alcance === "modulo"}
              onClick={() => setAlcance("modulo")}
            >
              Módulo completo ({lecciones.length} OA)
            </button>
            <button
              type="button"
              className="vx-guia-seg-btn"
              aria-pressed={alcance === "oa_actual"}
              onClick={() => setAlcance("oa_actual")}
            >
              Solo OA actual
            </button>
          </div>
        </div>

        <div className="vx-guia-toolbar-grupo">
          <div className="vx-guia-seg" role="group" aria-label="Tamaño de letra">
            <button
              type="button"
              className="vx-guia-seg-btn"
              aria-pressed={escala === "normal"}
              onClick={() => setEscala("normal")}
              title="Letra tamaño normal"
            >
              A
            </button>
            <button
              type="button"
              className="vx-guia-seg-btn"
              aria-pressed={escala === "grande"}
              onClick={() => setEscala("grande")}
              title="Letra tamaño grande"
            >
              A+
            </button>
            <button
              type="button"
              className="vx-guia-seg-btn"
              aria-pressed={escala === "xl"}
              onClick={() => setEscala("xl")}
              title="Letra tamaño muy grande"
            >
              A++
            </button>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={imprimirDocumento}>
            <Printer size={15} aria-hidden="true" />
            Imprimir
          </Button>
          <Button type="button" size="sm" onClick={imprimirDocumento}>
            <Download size={15} aria-hidden="true" />
            Guardar en PDF
          </Button>
        </div>
      </div>

      <div className="vx-guia-layout">
        {/* Índice navegable (se oculta al imprimir) */}
        <aside className="vx-guia-indice no-print" aria-label="Índice de la Guía de Estudio">
          <p className="vx-guia-indice-titulo">Índice del módulo</p>
          <ul className="vx-guia-indice-lista">
            {leccionesVisibles.map((item) => (
              <li key={item.oaId}>
                <a className="vx-guia-indice-link" href={`#guia-${item.oaId}`}>
                  <span className="vx-guia-indice-codigo">{item.codigo}</span>
                  <span>{item.titulo}</span>
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Documento académico principal */}
        <article className="vx-guia-doc" data-escala={escala} aria-label={`Guía de Estudio: ${modulo}`}>
          <header className="vx-guia-portada">
            <span className="vx-guia-kicker">
              Instituto Barkley · Vórtice · Guía de Estudio
            </span>
            <h1 className="vx-guia-titulo-modulo">{modulo}</h1>
            <div className="vx-guia-meta">
              <span><strong>Asignatura:</strong> {asignatura}</span>
              <span><strong>Curso:</strong> {curso}</span>
              <span>
                <strong>Cobertura:</strong>{" "}
                {alcance === "modulo"
                  ? `${leccionesVisibles.length} objetivos de aprendizaje`
                  : leccionesVisibles[0]?.codigo ?? "OA"}
              </span>
              <span><strong>Tiempo estimado de estudio:</strong> {tiempoTotalMin} min</span>
              <span><strong>Fecha:</strong> {fechaHoy}</span>
            </div>
          </header>

          {leccionesVisibles.map((leccion) => {
            const puertasActivas = puertasDisponibles(leccion);
            const explorar = leccion.puertas.explorar?.explorarConfig;
            const ia = ENRIQUECIMIENTO_MATEMATICA_M1[leccion.oaId];
            return (
              <section
                key={leccion.oaId}
                id={`guia-${leccion.oaId}`}
                className="vx-guia-capitulo"
                aria-labelledby={`guia-titulo-${leccion.oaId}`}
              >
                <div className="vx-guia-cap-header">
                  <div className="vx-guia-cap-badges">
                    <span className="vx-guia-badge vx-guia-badge-oa">{leccion.codigo}</span>
                    {leccion.prioridad === "nucleo_examen" && (
                      <span className="vx-guia-badge vx-guia-badge-prioridad">
                        Prioridad de examen
                      </span>
                    )}
                    <span className="vx-guia-badge vx-guia-badge-tiempo">
                      {leccion.tiempoEstimadoMin} min aprox.
                    </span>
                  </div>
                  <h2 id={`guia-titulo-${leccion.oaId}`} className="vx-guia-cap-titulo">
                    {leccion.titulo}
                  </h2>
                </div>

                {/* 1. Qué aprenderás */}
                <div className="vx-guia-seccion">
                  <h3 className="vx-guia-subtitulo">Qué aprenderás</h3>
                  <div className="vx-guia-caja-objetivo">{leccion.objetivo}</div>
                </div>

                {/* 1b. Activación de conocimientos previos (IABARKLEY) */}
                {ia && ia.conocimientosPrevios.length > 0 && (
                  <div className="vx-guia-seccion">
                    <h3 className="vx-guia-subtitulo">Antes de empezar: qué conviene recordar</h3>
                    <div className="vx-guia-previos">
                      <ul className="vx-guia-previos-lista">
                        {ia.conocimientosPrevios.map((idea, idx) => (
                          <li key={idx}>{idea}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 2. Conceptos fundamentales */}
                {leccion.vocabulario.length > 0 && (
                  <div className="vx-guia-seccion">
                    <h3 className="vx-guia-subtitulo">Conceptos fundamentales</h3>
                    <div className="vx-guia-tabla-wrap">
                      <table className="vx-guia-tabla">
                        <thead>
                          <tr>
                            <th>Concepto</th>
                            <th>Explicación</th>
                            <th>Ejemplo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leccion.vocabulario.map((v) => (
                            <tr key={v.termino}>
                              <td><strong>{v.termino}</strong></td>
                              <td>{v.definicion}</td>
                              <td><span className="vx-guia-ejemplo-mono">{v.ejemplo}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. Desarrollo secuencial de la materia */}
                <div className="vx-guia-seccion">
                  <h3 className="vx-guia-subtitulo">Desarrollo de la materia</h3>
                  {leccion.microTramos.map((tramo) => (
                    <div key={tramo.titulo} className="vx-guia-tramo">
                      <h4 className="vx-guia-tramo-titulo">{tramo.titulo}</h4>
                      <p className="vx-guia-tramo-consigna">{tramo.consigna}</p>
                      <p style={{ margin: 0 }}>{tramo.contenido}</p>
                    </div>
                  ))}
                  {ia && (
                    <div className="vx-guia-apoyo-grid">
                      <div className="vx-guia-analogia">
                        <span className="vx-guia-etiqueta-mini">Para entenderlo mejor (analogía)</span>
                        <strong>{ia.analogia.titulo}</strong>
                        <p style={{ margin: 0 }}>{ia.analogia.explicacion}</p>
                        <p className="vx-guia-analogia-limite">
                          <strong>Límite de la comparación:</strong> {ia.analogia.limite}
                        </p>
                      </div>
                      <div className="vx-guia-contraejemplo">
                        <span className="vx-guia-etiqueta-mini">Qué NO funciona (contraejemplo)</span>
                        <strong>{ia.contraejemplo.enunciado}</strong>
                        <p style={{ margin: 0 }}>{ia.contraejemplo.porQueNoSirve}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Ejemplo desarrollado paso a paso */}
                <div className="vx-guia-seccion">
                  <h3 className="vx-guia-subtitulo">Ejemplo desarrollado paso a paso</h3>
                  <div className="vx-guia-ejemplo">
                    <strong>{leccion.ejemploResuelto.titulo}</strong>
                    <ol className="vx-guia-pasos">
                      {leccion.ejemploResuelto.pasos.map((paso, idx) => (
                        <li key={idx}>{paso}</li>
                      ))}
                    </ol>
                    {ia && (
                      <div className="vx-guia-modelado-nota">
                        <p>
                          <strong>Por qué funciona este procedimiento:</strong>{" "}
                          {ia.modeladoPorque.porqueFunciona}
                        </p>
                        <p>
                          <strong>Cómo verificar tu resultado:</strong>{" "}
                          {ia.modeladoPorque.comoVerificar}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Diagrama visual comparativo (si el OA incluye configuración visual) */}
                {explorar && (
                  <div className="vx-guia-seccion">
                    <h3 className="vx-guia-subtitulo">Representación visual</h3>
                    <div className="vx-guia-diagrama">
                      <strong>{explorar.titulo}</strong>
                      <p style={{ margin: 0, fontSize: "0.92em" }}>{explorar.descripcion}</p>
                      <div className="vx-guia-barra-fila">
                        <span>{explorar.izqEtiqueta}</span>
                        <div className="vx-guia-barra-track" aria-hidden="true">
                          <div
                            className="vx-guia-barra-fill-a"
                            style={{ width: `${Math.min(100, Math.max(8, Math.round(explorar.izqValor <= 1 ? explorar.izqValor * 100 : explorar.izqValor)))}%` }}
                          />
                        </div>
                      </div>
                      <div className="vx-guia-barra-fila">
                        <span>{explorar.derEtiqueta}</span>
                        <div className="vx-guia-barra-track" aria-hidden="true">
                          <div
                            className="vx-guia-barra-fill-b"
                            style={{ width: `${Math.min(100, Math.max(8, Math.round(explorar.derValor <= 1 ? explorar.derValor * 100 : explorar.derValor)))}%` }}
                          />
                        </div>
                      </div>
                      {ia && (
                        <div className="vx-guia-visual-guia">
                          <p>
                            <strong>Qué observar en las barras:</strong>{" "}
                            {ia.guiaLecturaVisual.queObservar}
                          </p>
                          <p>
                            <strong>Otra forma de verlo:</strong>{" "}
                            {ia.guiaLecturaVisual.otraForma}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. Error frecuente y aclaración */}
                <div className="vx-guia-error" role="note" aria-label="Error frecuente">
                  <strong>Error frecuente a evitar</strong>
                  <span>{leccion.ejemploResuelto.errorFrecuente}</span>
                  {ia && (
                    <div className="vx-guia-error-detalle">
                      <p>
                        <strong>Por qué suele ocurrir:</strong> {ia.errorFrecuenteCausa.porqueOcurre}
                      </p>
                      <p>
                        <strong>Cómo evitarlo:</strong> {ia.errorFrecuenteCausa.comoEvitarlo}
                      </p>
                    </div>
                  )}
                </div>

                {/* 7. Síntesis de conceptos clave */}
                {(leccion.apoyos.infografiaResumen.length > 0 || leccion.apoyos.mapaMental.length > 0) && (
                  <div className="vx-guia-seccion">
                    <h3 className="vx-guia-subtitulo">Síntesis de conceptos clave</h3>
                    <div className="vx-guia-sintesis">
                      {leccion.apoyos.infografiaResumen.length > 0 && (
                        <ul>
                          {leccion.apoyos.infografiaResumen.map((punto, idx) => (
                            <li key={idx}>{punto}</li>
                          ))}
                        </ul>
                      )}
                      {leccion.apoyos.mapaMental.length > 0 && (
                        <div className="vx-guia-mapa-nodos">
                          {leccion.apoyos.mapaMental.map((n) => (
                            <div key={n.nodo} className="vx-guia-nodo">
                              <strong>{n.nodo}</strong>
                              <span>{n.detalle}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 7b. Reflexión metacognitiva no evaluativa (IABARKLEY) */}
                {ia && ia.reflexionMetacognitiva.length > 0 && (
                  <div className="vx-guia-seccion">
                    <h3 className="vx-guia-subtitulo">Pausa para comprobar tu comprensión</h3>
                    <div className="vx-guia-reflexion" role="note" aria-label="Reflexión metacognitiva sin nota">
                      <div className="vx-guia-reflexion-head">
                        <p className="vx-guia-reflexion-nota">
                          Preguntas personales para ordenar tus ideas antes de practicar.
                        </p>
                        <span className="vx-guia-badge vx-guia-badge-tiempo">
                          Sin nota · solo para reflexionar
                        </span>
                      </div>
                      <ul className="vx-guia-reflexion-lista">
                        {ia.reflexionMetacognitiva.map((pregunta, idx) => (
                          <li key={idx}>{pregunta}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 8. Recursos complementarios en el Aula (solo interactivo, oculto al imprimir) */}
                <div className="vx-guia-recursos no-print">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Compass size={16} aria-hidden="true" />
                    <strong>Recursos complementarios de {leccion.codigo}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.9em" }}>
                    Si prefieres reforzar este tema de forma interactiva, puedes abrir directamente las actividades del Aula (no es obligatorio usar todos los formatos).
                  </p>
                  <div className="vx-guia-recursos-acciones">
                    {puertasActivas.includes("explorar") && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onIrAlAula(leccion.oaId, "aprende")}
                      >
                        <BookOpen size={14} aria-hidden="true" />
                        Abrir Laboratorio visual
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onIrAlAula(leccion.oaId, "intentalo")}
                    >
                      <Lightbulb size={14} aria-hidden="true" />
                      Practicar {leccion.codigo} con pistas
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onIrAlAula(leccion.oaId, "comprueba")}
                    >
                      <ExternalLink size={14} aria-hidden="true" />
                      Ir a Comprueba
                    </Button>
                  </div>
                </div>

                {/* 9. Autoevaluación de repaso (enunciados públicos sin filtrar respuestas correctas) */}
                <div className="vx-guia-seccion">
                  <h3 className="vx-guia-subtitulo">Autoevaluación de repaso</h3>
                  <div className="vx-guia-auto-lista">
                    {leccion.ejerciciosPractica.map((ej, idx) => (
                      <div key={ej.id} className="vx-guia-auto-item">
                        <strong>Pregunta {idx + 1}. {ej.enunciado}</strong>
                        <ul className="vx-guia-auto-opts">
                          {ej.alternativas.map((alt) => (
                            <li key={alt.id}>
                              <strong>{alt.id}.</strong> {alt.texto}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="vx-guia-btn-practica no-print">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onIrAlAula(leccion.oaId, "intentalo")}
                    >
                      Verificar mis respuestas en el Aula interactiva
                    </Button>
                  </div>
                </div>
              </section>
            );
          })}
        </article>
      </div>
    </div>
  );
}
