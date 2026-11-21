// Brújula™ en el inicio del estudiante: dónde está, cuánto le falta, intensidad y bloques semanales.
// Solo lectura de /api/vortice/brujula/panel más preferencias y bloques. Tono de orientación, sin puntajes ni castigos.
import { Check, Compass } from "lucide-react";
import {
  CONFIG_INTENSIDAD,
  FRANJAS_BRUJULA,
  INTENSIDADES,
  type BloqueEstudio,
  type FranjaBrujula,
  type PreferenciasBrujula,
} from "@shared/brujula";
import type { PanelBrujula, Ritmo, Tono } from "@shared/brujulaPanel";
import "./brujula.css";

const RITMO: Record<Ritmo, [string, string]> = {
  al_dia: ["Al día", "ok"], adelantado: ["Adelantado", "ok"], atrasado: ["Por recuperar", "atraso"], sin_datos: ["Sin contenido", "nada"],
};
const TONO_ETIQUETA: Record<Tono, string> = { alerta: "Importante", aviso: "Atención", info: "Para tener presente", ok: "Todo en orden" };
const DIAS_CORTO = ["L", "M", "X", "J", "V", "S", "D"] as const;
const DIAS_NOM = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
const FRANJA_LABEL: Record<FranjaBrujula, string> = { manana: "Mañana", tarde: "Tarde", noche: "Noche" };

export function BrujulaPanel({
  panel,
  cargando,
  error,
  preferencias,
  bloques,
  onSavePreferencias,
  onToggleBloque,
  guardandoPreferencias,
  guardandoBloqueId,
}: {
  panel: PanelBrujula | undefined;
  cargando: boolean;
  error: boolean;
  preferencias?: PreferenciasBrujula;
  bloques?: BloqueEstudio[];
  onSavePreferencias?: (p: PreferenciasBrujula) => void;
  onToggleBloque?: (blockId: string, completado: boolean) => void;
  guardandoPreferencias?: boolean;
  guardandoBloqueId?: string | null;
}) {
  const toggleDia = (dia: number) => {
    if (!preferencias || !onSavePreferencias) return;
    const existe = preferencias.diasPreferidos.includes(dia);
    if (existe && preferencias.diasPreferidos.length <= 1) return;
    const diasPreferidos = existe
      ? preferencias.diasPreferidos.filter((d) => d !== dia)
      : [...preferencias.diasPreferidos, dia].sort((a, b) => a - b);
    onSavePreferencias({ ...preferencias, diasPreferidos });
  };

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

          {preferencias && onSavePreferencias && (
            <div className="vb-prefs" aria-label="Ritmo y preferencias de estudio">
              <div className="vb-prefs-row">
                <span className="vb-prefs-lbl">Intensidad</span>
                <div className="vb-pills" role="group" aria-label="Intensidad semanal">
                  {INTENSIDADES.map((k) => (
                    <button
                      key={k}
                      type="button"
                      className="vb-pill"
                      aria-pressed={preferencias.intensidad === k}
                      disabled={guardandoPreferencias}
                      onClick={() => onSavePreferencias({ ...preferencias, intensidad: k })}
                    >
                      {CONFIG_INTENSIDAD[k].label} · {CONFIG_INTENSIDAD[k].minutosBloque}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="vb-prefs-row">
                <span className="vb-prefs-lbl">Días</span>
                <div className="vb-pills" role="group" aria-label="Días preferidos">
                  {DIAS_CORTO.map((letra, idx) => {
                    const dia = idx + 1;
                    const activo = preferencias.diasPreferidos.includes(dia);
                    return (
                      <button
                        key={dia}
                        type="button"
                        className="vb-pill vb-pill-day"
                        aria-pressed={activo}
                        aria-label={DIAS_NOM[idx]}
                        disabled={guardandoPreferencias}
                        onClick={() => toggleDia(dia)}
                      >
                        {letra}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="vb-prefs-row">
                <span className="vb-prefs-lbl">Horario</span>
                <div className="vb-pills" role="group" aria-label="Franja horaria preferida">
                  {FRANJAS_BRUJULA.map((f) => (
                    <button
                      key={f}
                      type="button"
                      className="vb-pill"
                      aria-pressed={preferencias.franja === f}
                      disabled={guardandoPreferencias}
                      onClick={() => onSavePreferencias({ ...preferencias, franja: f })}
                    >
                      {FRANJA_LABEL[f]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {bloques !== undefined && (
            <div className="vb-bloques">
              <div className="vb-bloques-head">
                <h3>Bloques de estudio de esta semana</h3>
                {bloques.length > 0 && (
                  <small>{bloques.filter((b) => b.completado).length} de {bloques.length} hechos</small>
                )}
              </div>
              {bloques.length === 0 ? (
                <p className="vx-empty">Sin bloques esta semana: todavía no hay metas activas.</p>
              ) : (
                <ul className="vb-bloques-list" aria-label="Bloques semanales de estudio">
                  {bloques.map((b) => {
                    const [, mm, dd] = b.fecha.split("-");
                    const diaTxt = DIAS_NOM[b.diaSemana - 1] ?? "Día";
                    return (
                      <li key={b.id} data-done={b.completado}>
                        <button
                          type="button"
                          className="vb-check"
                          aria-pressed={b.completado}
                          aria-label={`${b.completado ? "Desmarcar" : "Marcar"} bloque de ${b.subjectName} (${b.objectiveCode})`}
                          disabled={!onToggleBloque || guardandoBloqueId === b.id}
                          onClick={() => onToggleBloque?.(b.id, !b.completado)}
                        >
                          {b.completado && <Check aria-hidden="true" />}
                        </button>
                        <div className="vb-bloque-info">
                          <b>{b.subjectName} · {b.objectiveCode}</b>
                          <small>{diaTxt} {dd}/{mm} · {FRANJA_LABEL[b.franja]} · {b.duracionMin} min</small>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
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
