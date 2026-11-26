import type { ReactNode } from "react";

type Props =
  | { tipo: "cargando"; filas?: number }
  | { tipo: "vacio"; texto: string; children?: ReactNode }
  | { tipo: "error"; texto?: string; onReintentar: () => void };

export default function StateBlock(props: Props) {
  if (props.tipo === "cargando") {
    return (
      <div className="vx-estado" aria-busy="true" aria-label="Cargando">
        {Array.from({ length: props.filas ?? 3 }, (_, index) => (
          <div className="vx-skeleton" key={index} />
        ))}
      </div>
    );
  }

  if (props.tipo === "vacio") {
    return (
      <div className="vx-estado">
        <p>{props.texto}</p>
        {props.children}
      </div>
    );
  }

  return (
    <div className="vx-estado" role="alert">
      <p>{props.texto ?? "No pudimos cargar esto."}</p>
      <button type="button" className="vx-btn-ghost" onClick={props.onReintentar}>
        Reintentar
      </button>
    </div>
  );
}