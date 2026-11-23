// Componente para pedir ayuda al tutor humano desde el Inicio del estudiante.
// Usa la API existente: GET/POST /api/vortice/ayuda (no se modifica el servidor).
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface AyudaTutorProps {
  asignaturas: {
    levelSubjectId: string;
    subjectName: string;
    currentObjective: { id: string; code: string; title: string } | null;
  }[];
}

interface Consulta {
  id: string;
  question: string;
  response: string | null;
  closingNote: string | null;
  status: "abierto" | "asignado" | "respondido" | "cerrado";
  createdAt: string;
  learningObjectiveId: string;
}

const ETIQUETA_ESTADO: Record<Consulta["status"], string> = {
  abierto: "Enviada",
  asignado: "Con tu tutor",
  respondido: "Respondida",
  cerrado: "Cerrada",
};

async function getConsultas(): Promise<Consulta[]> {
  const res = await fetch("/api/vortice/ayuda", { credentials: "include" });
  if (res.status === 401 || res.status === 403) throw new Error(`auth:${res.status}`);
  if (!res.ok) throw new Error(`ayuda-get:${res.status}`);
  return res.json();
}

async function crearConsulta(body: { learningObjectiveId: string; pregunta: string }): Promise<Consulta> {
  const res = await fetch("/api/vortice/ayuda", {
    credentials: "include",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ message: `Error ${res.status}` }));
    throw new Error(e.message ?? `Error ${res.status}`);
  }
  return res.json();
}

export function AyudaTutor({ asignaturas }: AyudaTutorProps) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [pregunta, setPregunta] = useState("");
  const [objetivoId, setObjetivoId] = useState("");
  const [verTodas, setVerTodas] = useState(false);

  const { data: consultas, isLoading } = useQuery({
    queryKey: ["/api/vortice/ayuda"],
    queryFn: getConsultas,
    retry: false,
    select: (data) => {
      if (!data || data.length === 0) return null;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: crearConsulta,
    onSuccess: () => {
      setPregunta("");
      setObjetivoId("");
      queryClient.invalidateQueries({ queryKey: ["/api/vortice/ayuda"] });
    },
  });

  // Si la consulta falla (401, 403 u otro error), no se muestra nada. Va después de TODOS los hooks.
  if (consultas === undefined && !isLoading) {
    return null;
  }

  // Filtrar asignaturas con currentObjective no nulo
  const asignaturasValidas = asignaturas.filter((a) => a.currentObjective != null);

  // Si no hay asignaturas válidas y no hay consultas, no hay nada que mostrar
  const hayAlgo = asignaturasValidas.length > 0 || (consultas != null && consultas.length > 0);
  if (!hayAlgo && !formOpen) {
    return null;
  }

  const preguntaTrim = pregunta.trim();
  const puedeEnviar = preguntaTrim.length >= 10 && !mutation.isPending && objetivoId !== "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!puedeEnviar) return;
    mutation.mutate({ learningObjectiveId: objetivoId, pregunta: preguntaTrim });
  }

  // Mostrar las 3 más nuevas
  const consultasRecientes = consultas != null && consultas.length > 3 && !verTodas ? consultas.slice(0, 3) : consultas;
  const hayMas = consultas != null && consultas.length > 3;

  return (
    <div className="vx-ayuda">
      <button
        type="button"
        className="vx-ayuda-toggle"
        onClick={() => setFormOpen((v) => !v)}
        aria-expanded={formOpen}
        aria-controls="vx-ayuda-form"
      >
        Pedir ayuda a mi tutor
      </button>

      {formOpen && (
        <form id="vx-ayuda-form" className="vx-ayuda-form" onSubmit={handleSubmit} noValidate>
          <div className="vx-ayuda-field">
            <label htmlFor="vx-ayuda-asignatura">Asignatura</label>
            <select
              id="vx-ayuda-asignatura"
              value={objetivoId}
              onChange={(e) => setObjetivoId(e.target.value)}
              required
            >
              <option value="">Elige una asignatura</option>
              {asignaturasValidas.map((a) => (
                <option key={a.currentObjective!.id} value={a.currentObjective!.id}>
                  {a.subjectName} · {a.currentObjective!.code}
                </option>
              ))}
            </select>
          </div>

          <div className="vx-ayuda-field">
            <label htmlFor="vx-ayuda-pregunta">Cuéntale a tu tutor qué no entiendes</label>
            <textarea
              id="vx-ayuda-pregunta"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              maxLength={2000}
              rows={4}
              required
            />
            <span className="vx-ayuda-counter">{pregunta.length} / 2000</span>
          </div>

          <button type="submit" className="vx-cta" disabled={!puedeEnviar}>
            Enviar a mi tutor
          </button>

          {mutation.isPending && (
            <p className="vx-ayuda-status" aria-live="polite">Enviando tu consulta…</p>
          )}

          {mutation.isSuccess && (
            <p className="vx-ayuda-success" aria-live="polite">
              Enviamos tu consulta. Tu tutor te responderá aquí.
            </p>
          )}

          {mutation.error && !mutation.isPending && (
            <p className="vx-ayuda-error" role="alert">
              {mutation.error.message}
            </p>
          )}
        </form>
      )}

      {/* Lista de consultas */}
      {consultasRecientes != null && consultasRecientes.length > 0 && (
        <div className="vx-ayuda-lista">
          <h3 className="vx-ayuda-lista-title">Mis consultas</h3>
          <ul className="vx-ayuda-items">
            {consultasRecientes.map((c) => (
              <li key={c.id} className="vx-ayuda-item">
                <div className="vx-ayuda-item-header">
                  <time className="vx-ayuda-item-date">
                    {new Date(c.createdAt).toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                  <span className={`vx-ayuda-badge vx-ayuda-badge--${c.status}`}>
                    {ETIQUETA_ESTADO[c.status]}
                  </span>
                </div>
                <p className="vx-ayuda-item-question">{c.question}</p>
                {c.response && (
                  <div className="vx-ayuda-response">
                    <strong>Respuesta de tu tutor</strong>
                    <p>{c.response}</p>
                  </div>
                )}
                {c.closingNote && (
                  <p className="vx-ayuda-closing">Cierre: {c.closingNote}</p>
                )}
              </li>
            ))}
          </ul>
          {hayMas && (
            <button type="button" className="vx-ayuda-ver-todo" onClick={() => setVerTodas((v) => !v)} aria-expanded={verTodas}>
              {verTodas ? "Ver menos" : `Ver todas (${consultas.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
