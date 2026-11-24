import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import "./vortice.css";

interface CasoTutor {
  id: string;
  studentId: string;
  question: string;
  response: string | null;
  closingNote: string | null;
  status: "abierto" | "asignado" | "respondido" | "cerrado";
  createdAt: string;
  assignedAt: string | null;
  respondedAt: string | null;
  estudiante: string;
  curso: string;
  asignatura: string;
  objetivoCodigo: string;
  objetivoTitulo: string;
}

interface BandejaResponse {
  sinAsignar: CasoTutor[];
  mios: CasoTutor[];
}

interface EstudianteAtencion {
  studentId: string;
  estudiante: string;
  cursos: string[];
  diasSinActividad: number;
  ultimaActividad: string | null;
}

function tiempoRelativo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "hace menos de 1 hora";
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  if (diffDays === 1) return "hace 1 día";
  return `hace ${diffDays} días`;
}

function fechaCorta(isoString: string): string {
  return new Date(isoString).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CasoCard({
  caso,
  onTomar,
  onResponder,
  onCerrar,
}: {
  caso: CasoTutor;
  onTomar: () => void;
  onResponder: (respuesta: string) => void;
  onCerrar: (nota: string) => void;
}) {
  const [texto, setTexto] = useState("");
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const handleTomar = async () => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await onTomar();
      setExito("Caso tomado correctamente.");
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const handleResponder = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await onResponder(texto);
      setTexto("");
      setExito("Respuesta enviada correctamente.");
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const handleCerrar = async () => {
    if (!nota.trim()) return;
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await onCerrar(nota);
      setNota("");
      setExito("Caso cerrado correctamente.");
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="vx-tutor-card">
      <div className="vx-tutor-card-meta">
        <span className="vx-tutor-card-student">
          {caso.estudiante} · {caso.curso}
        </span>
        <span className="vx-tutor-card-subject">
          {caso.asignatura} · {caso.objetivoCodigo} · {caso.objetivoTitulo}
        </span>
        <span className="vx-tutor-card-date">
          {fechaCorta(caso.createdAt)} · {tiempoRelativo(caso.createdAt)}
        </span>
      </div>

      <p className="vx-tutor-card-question">{caso.question}</p>

      {error && <p role="alert" className="vx-tutor-error">{error}</p>}
      {exito && <p aria-live="polite" className="vx-tutor-success">{exito}</p>}

      {caso.status === "abierto" && (
        <button
          type="button"
          className="vx-cta"
          disabled={enviando}
          onClick={handleTomar}
        >
          {enviando ? "Tomando..." : "Tomar este caso"}
        </button>
      )}

      {caso.status === "asignado" && (
        <div className="vx-tutor-form">
          <div className="vx-tutor-field">
            <label htmlFor={`respuesta-${caso.id}`} className="vx-tutor-label">
              Tu respuesta
            </label>
            <textarea
              id={`respuesta-${caso.id}`}
              className="vx-tutor-textarea"
              rows={4}
              maxLength={4000}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe tu respuesta al estudiante..."
            />
            <span className="vx-tutor-counter">{texto.length} / 4000</span>
          </div>
          <button
            type="button"
            className="vx-cta"
            disabled={!texto.trim() || enviando}
            onClick={handleResponder}
          >
            <Send className="w-4 h-4" />
            {enviando ? "Enviando..." : "Enviar respuesta"}
          </button>
        </div>
      )}

      {caso.status === "respondido" && (
        <div className="vx-tutor-form">
          <div className="vx-tutor-response">
            <span className="vx-tutor-response-label">Tu respuesta</span>
            <p className="vx-tutor-response-text">{caso.response}</p>
          </div>
          <div className="vx-tutor-field">
            <label htmlFor={`nota-${caso.id}`} className="vx-tutor-label">
              Nota de cierre
            </label>
            <textarea
              id={`nota-${caso.id}`}
              className="vx-tutor-textarea"
              rows={3}
              maxLength={1000}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Breve nota sobre el cierre del caso..."
            />
            <span className="vx-tutor-counter">{nota.length} / 1000</span>
          </div>
          <button
            type="button"
            className="vx-cta"
            disabled={!nota.trim() || enviando}
            onClick={handleCerrar}
          >
            <CheckCircle2 className="w-4 h-4" />
            {enviando ? "Cerrando..." : "Cerrar caso"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function TutorBandeja() {
  const queryClient = useQueryClient();

  const bandejaQuery = useQuery<BandejaResponse>({
    queryKey: ["/api/tutoria/bandeja"],
    queryFn: async () => {
      const res = await fetch("/api/tutoria/bandeja", { credentials: "include" });
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      if (res.status === 403) throw new Error("FORBIDDEN");
      if (!res.ok) throw new Error("No pudimos cargar la bandeja");
      return res.json();
    },
    retry: false,
  });

  const atencionQuery = useQuery<EstudianteAtencion[]>({
    queryKey: ["/api/tutoria/atencion"],
    queryFn: async () => {
      const res = await fetch("/api/tutoria/atencion", { credentials: "include" });
      if (!res.ok) throw new Error("No pudimos cargar la lista de atención");
      return res.json();
    },
    retry: false,
  });

  const tomarMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tutoria/casos/${id}/tomar`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? "No se pudo tomar el caso");
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/tutoria/bandeja"] });
    },
  });

  const responderMutation = useMutation({
    mutationFn: async ({ id, respuesta }: { id: string; respuesta: string }) => {
      const res = await fetch(`/api/tutoria/casos/${id}/responder`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuesta }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? "No se pudo enviar la respuesta");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/tutoria/bandeja"] });
    },
  });

  const cerrarMutation = useMutation({
    mutationFn: async ({ id, notaCierre }: { id: string; notaCierre: string }) => {
      const res = await fetch(`/api/tutoria/casos/${id}/cerrar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notaCierre }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? "No se pudo cerrar el caso");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/tutoria/bandeja"] });
    },
  });

  if (bandejaQuery.isError) {
    const msg = (bandejaQuery.error as Error).message;
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN") {
      return (
        <div className="vx-editorial min-h-screen flex items-center justify-center p-6">
          <div className="vx-tutor-unauthorized">
            <p className="vx-tutor-unauthorized-text">
              Esta pantalla es solo para tutores.
            </p>
          </div>
        </div>
      );
    }
  }

  const data = bandejaQuery.data;
  const sinAsignar = data?.sinAsignar ?? [];
  const mios = data?.mios ?? [];

  return (
    <div className="vx-editorial min-h-screen">
      <header className="vx-topbar">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link href="/vortice" className="vx-pill-nav">
            <ArrowLeft className="w-4 h-4" />
            Volver a Vórtice
          </Link>
          <button
            type="button"
            className="vx-btn-ghost !min-h-0 h-9 px-4 text-sm"
            onClick={() => {
              void bandejaQuery.refetch();
              void atencionQuery.refetch();
            }}
            disabled={bandejaQuery.isFetching || atencionQuery.isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${bandejaQuery.isFetching || atencionQuery.isFetching ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="space-y-1">
          <span className="vx-kicker">Panel de tutoría</span>
          <h1 className="text-3xl sm:text-[2.35rem] leading-[1.12] text-(--vx-ink)">
            Bandeja del tutor
          </h1>
          <p className="text-[14.5px] leading-relaxed text-(--vx-ink-soft) max-w-[68ch] pt-1">
            Consulta, responde y cierra las solicitudes de ayuda de los estudiantes.
          </p>
        </div>

        {bandejaQuery.isLoading ? (
          <p className="text-(--vx-ink-soft)">Cargando bandeja...</p>
        ) : bandejaQuery.isError ? (
          <p role="alert" className="text-(--vx-clay-text)">
            No pudimos cargar la bandeja.
          </p>
        ) : (
          <>
            <section className="vx-tutor-section">
              <h2 className="vx-tutor-section-title">
                Necesitan atención ({atencionQuery.data?.length ?? 0})
              </h2>
              {atencionQuery.isError ? (
                <p role="alert" className="vx-tutor-error">No pudimos cargar la lista de atención.</p>
              ) : atencionQuery.isSuccess && atencionQuery.data.length === 0 ? (
                <p className="vx-tutor-empty">Nadie lleva 5 días sin actividad.</p>
              ) : atencionQuery.data && atencionQuery.data.length > 0 ? (
                <ul className="vx-tutor-attention-list">
                  {atencionQuery.data.map((estudiante) => (
                    <li key={estudiante.studentId} className="vx-card vx-tutor-attention-card">
                      <strong>{estudiante.estudiante}</strong>
                      <span>{estudiante.cursos.join(" · ")}</span>
                      <span>Lleva {estudiante.diasSinActividad} días sin actividad</span>
                      {estudiante.ultimaActividad && (
                        <span>Última actividad: {fechaCorta(estudiante.ultimaActividad)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="vx-tutor-section">
              <h2 className="vx-tutor-section-title">
                Sin asignar ({sinAsignar.length})
              </h2>
              {sinAsignar.length === 0 ? (
                <p className="vx-tutor-empty">No hay consultas sin asignar.</p>
              ) : (
                <div className="vx-tutor-list">
                  {sinAsignar.map((caso) => (
                    <CasoCard
                      key={caso.id}
                      caso={caso}
                      onTomar={() => tomarMutation.mutateAsync(caso.id)}
                      onResponder={() => {}}
                      onCerrar={() => {}}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="vx-tutor-section">
              <h2 className="vx-tutor-section-title">
                Mis casos ({mios.length})
              </h2>
              {mios.length === 0 ? (
                <p className="vx-tutor-empty">No tienes casos abiertos.</p>
              ) : (
                <div className="vx-tutor-list">
                  {mios.map((caso) => (
                    <CasoCard
                      key={caso.id}
                      caso={caso}
                      onTomar={() => {}}
                      onResponder={(respuesta) =>
                        responderMutation.mutateAsync({ id: caso.id, respuesta })
                      }
                      onCerrar={(nota) =>
                        cerrarMutation.mutateAsync({ id: caso.id, notaCierre: nota })
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
