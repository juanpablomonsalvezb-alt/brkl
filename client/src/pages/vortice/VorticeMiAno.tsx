import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import "./vortice.css";

type EstadoPeriodo = "pasado" | "actual" | "proximo";

interface MiAno {
  nivel: string | null;
  inicio: string | null;
  fin: string | null;
  modulos: {
    numero: number;
    inicio: string;
    fin: string;
    estado: EstadoPeriodo;
    evaluaciones: { numero: 1 | 2 | 3 | 4; fecha: string }[];
  }[];
  semanasEvaluacion: {
    nombre: string;
    despuesDelModulo: number;
    inicio: string;
    fin: string;
    estado: EstadoPeriodo;
  }[];
}

const ESTADO_TEXTO: Record<EstadoPeriodo, string> = {
  pasado: "Terminado",
  actual: "En curso",
  proximo: "Próximo",
};

function fechaLarga(ymd: string): string {
  return new Date(`${ymd}T12:00:00`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fechaCorta(ymd: string): string {
  return new Date(`${ymd}T12:00:00`).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

function fechaEvaluacion(ymd: string): string {
  const date = new Date(`${ymd}T12:00:00`);
  const parts = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).formatToParts(date);
  const byType = new Map(parts.map((p) => [p.type, p.value]));
  const weekday = byType.get("weekday");
  const day = byType.get("day");
  const month = byType.get("month");
  if (weekday && day && month) {
    return `${weekday} ${day} de ${month}`;
  }
  return date.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
}

function rango(inicio: string, fin: string): string {
  return `${fechaCorta(inicio)} al ${fechaCorta(fin)}`;
}

export default function VorticeMiAno() {
  const ano = useQuery<MiAno>({
    queryKey: ["/api/vortice/mi-ano"],
    queryFn: async () => {
      const response = await fetch("/api/vortice/mi-ano", { credentials: "include" });
      if (response.status === 401) throw new Error("UNAUTHORIZED");
      if (!response.ok) throw new Error("No fue posible cargar el calendario");
      return response.json();
    },
    retry: false,
  });

  const data = ano.data;
  const lineaDeTiempo = data ? data.modulos.flatMap((modulo) => [
    { tipo: "modulo" as const, clave: `modulo-${modulo.numero}`, modulo },
    ...data.semanasEvaluacion
      .filter((semana) => semana.despuesDelModulo === modulo.numero)
      .map((semana, index) => ({ tipo: "semana" as const, clave: `semana-${modulo.numero}-${index}`, semana })),
  ]) : [];

  return (
    <div className="vx-editorial vx-ano min-h-screen">
      <header className="vx-topbar">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link href="/vortice" className="vx-pill-nav">
            <ArrowLeft className="w-4 h-4" />
            Volver a Vórtice
          </Link>
        </div>
      </header>

      <main className="vx-ano-content">
        <h1 className="vx-ano-title">Mi año</h1>

        {ano.isLoading ? (
          <p className="vx-ano-message">Cargando tu año…</p>
        ) : ano.isError && (ano.error as Error)?.message === "UNAUTHORIZED" ? (
          <div className="vx-ano-message space-y-3" role="alert">
            <p>Necesitas iniciar sesión para revisar tu calendario del año.</p>
            <Link href="/vortice" className="vx-btn-primary">Ir a Vórtice</Link>
          </div>
        ) : ano.isError ? (
          <p className="vx-ano-message" role="alert">No pudimos cargar tu año. Intenta de nuevo más tarde.</p>
        ) : data?.nivel === null ? (
          <p className="vx-ano-message">Cuando tengas un curso asignado, tu año aparecerá aquí.</p>
        ) : data ? (
          <>
            <section className="vx-card vx-ano-summary" aria-label="Resumen del año">
              <h2>{data.nivel}</h2>
              {data.inicio && data.fin && <p>Del {fechaLarga(data.inicio)} al {fechaLarga(data.fin)}</p>}
            </section>

            <ol className="vx-ano-timeline" aria-label="Calendario del año">
              {lineaDeTiempo.map((item) => {
                const esModulo = item.tipo === "modulo";
                const periodo = esModulo ? item.modulo : item.semana;
                return (
                  <li
                    className={`vx-card vx-ano-item vx-ano-item-${periodo.estado}`}
                    key={item.clave}
                    aria-current={periodo.estado === "actual" ? "step" : undefined}
                  >
                    <div className="vx-ano-item-heading">
                      <div>
                        <h2>{esModulo ? `Módulo ${item.modulo.numero}` : item.semana.nombre}</h2>
                        <p className="vx-ano-dates">{rango(periodo.inicio, periodo.fin)}</p>
                      </div>
                      <span className="vx-ano-status">{ESTADO_TEXTO[periodo.estado]}</span>
                    </div>
                    {esModulo && (
                      <ul className="vx-ano-evaluations" aria-label={`Evaluaciones del Módulo ${item.modulo.numero}`}>
                        {item.modulo.evaluaciones.map((evaluacion) => (
                          <li key={evaluacion.numero}>
                            Evaluación {evaluacion.numero}: {fechaEvaluacion(evaluacion.fecha)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        ) : null}
      </main>
    </div>
  );
}