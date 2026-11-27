import type * as React from "react";

export default function StatusTag({ tono, children }: { tono: "hecho" | "practica" | "confirmada" | "pendiente" | "neutro"; children: React.ReactNode }) {
  return <span className={`vx-tag vx-tag--${tono}`}>{children}</span>;
}