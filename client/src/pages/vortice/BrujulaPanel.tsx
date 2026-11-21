// Brújula™ en el inicio del estudiante: dónde está, cuánto le falta y qué le aconseja el calendario.
// Solo lectura de /api/vortice/brujula/panel. Tono de orientación, sin puntajes ni castigos.
import { Compass } from "lucide-react";
import type { PanelBrujula, Ritmo, Tono } from "@shared/brujulaPanel";
import "./brujula.css";

const RITMO: Record<Ritmo, [string, string]> = {
  al_dia: ["Al día", "ok"], adelantado: ["Adelantado", "ok"], atrasado: ["Por recuperar", "atraso"], sin_datos: ["Sin contenido", "nada"],
};
const TONO_ETIQUETA: Record<Tono, string> = { alerta: "Importante", aviso: "Atención", info: "Para tener presente", ok: "Todo en orden" };

export function BrujulaPanel({ panel, cargando, error }: { panel: PanelBrujula | undefined; cargando: boolean; error: boolean }) {
  return (
    <section className="vx-card vb" id="brujula" aria-labelledby="vb-titulo">
      <header>
        <h2 id="vb-titulo"><Compass aria-hidden="true" />Brújula</h2>
        {panel?.avanceTotal != null && <small>Faltan {panel.faltanTotal} actividades</small>}
      </header>

      {cargando ? <div className="vx-skeleton" /> : error ? (
        <p className="vx-empty">No pudimos cargar tu Brújula. Recarga la página para intentarlo de nuevo.</p>
      ) : !panel || panel.metricas.length === 0 ? (
        <p className="vx-empty">Cuando tengas asignaturas matriculadas, aquí verás cómo vas y qué sigue.</p>
      ) : (
        <>
          <ul className="vb-notas" aria-label="Mensajes de tu Brújula">
            {panel.mensajes.map((m) => (
              <li key={m.id} data-tono={m.tono}>
                <span className="vb-aguja" aria-hidden="true" />
                <div><small>{TONO_ETIQUETA[m.tono]}</small><p>{m.texto}</p></div>
              </li>
            ))}
          </ul>

          {panel.proximaEvaluacion && (
            <p className="vb-proxima">
              <span>Próxima evaluación</span>
              <b>{panel.proximaEvaluacion.dias === 0 ? "Hoy" : `En ${panel.proximaEvaluacion.dias} ${panel.proximaEvaluacion.dias === 1 ? "día" : "días"}`}</b>
              <em>«{panel.proximaEvaluacion.titulo}» · {panel.proximaEvaluacion.subjectName}</em>
            </p>
          )}

          <ul className="vb-ritmo" aria-label="Ritmo por asignatura">
            {panel.metricas.map((m) => {
              const [etiqueta, clase] = RITMO[m.ritmo];
              return (
                <li key={m.levelSubjectId}>
                  <div className="vb-fila"><b>{m.subjectName}</b><span className="vb-chip" data-ritmo={clase}>{etiqueta}</span></div>
                  <div className="vb-barra" role="img" aria-label={m.percent == null ? "Sin contenido cargado" : `${m.percent}% de avance`}>
                    <i style={{ width: `${m.percent ?? 0}%` }} data-ritmo={clase} />
                  </div>
                  <small>
                    {m.percent == null ? "Aún sin contenido" : `${m.percent}% · ${m.faltan === 0 ? "completa" : `faltan ${m.faltan}`}`}
                    {m.moduloActual && m.moduloActual.faltan > 0 && ` · ${m.moduloActual.code} cierra en ${m.moduloActual.diasParaTerminar} ${m.moduloActual.diasParaTerminar === 1 ? "día" : "días"}`}
                  </small>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
