// Máquina de estados PURA de una instancia de evaluación ORDINARIA (IMP-015, H1b-1). Sin base de datos, sin
// reloj del sistema: `ahora` llega en segundos UTC. El resultado de corregir un envío (aprobado o no) llega ya
// calculado: el umbral (C16) no es de esta máquina.
//
// Reglas IMPLEMENTADAS y su fuente (especificación maestra `0a0ccaa`, §2, §3, §6; máquina de estados §3–§5):
//  - Intentos ordinarios: E1, E3 y E4: 2; E2: 3. El intento se consume al ENVIAR (§3).
//  - Un solo intento activo por instancia; recargar retoma el mismo intento (§2, §3).
//  - Aprobar cierra la instancia de inmediato (§2); agotar los intentos sin aprobar la cierra (§2).
//  - P15 (APROBADO 2026-10-24): al alcanzar T+48 h la instancia queda `vencida` aunque queden intentos; un
//    intento activo expira sin consumir y se registra la causa (vencimiento).
//  - Envío repetido: devuelve el resultado ya registrado o un conflicto, nunca un segundo consumo (§4, inv. 2–3).
//  - Fuera de la extensión no se aceptan envíos (409, sin gracia) (§3).
//  - Sin resurrección: un estado final no vuelve a `disponible` ni a `en_curso` (inv. 4).
//  - Aprobar cierra el proceso con resultado «Aprobado» (§6).
//
// BLOQUEADO / NO implementado, porque su definición sigue pendiente o no está aprobada (se marca, no se infiere):
//  - Estados de instancia `cerrada_por_excepcion`, `en_revision` y `revision_disponible` (la revisión se deriva
//    con `publicable`); estados de intento `cancelado_por_cierre` (solo tiene sentido con cierres por excepción).
//  - Estados de proceso distintos de «aprobado»: `recuperacion_pendiente`, `recuperacion_abierta`, `reprobado`,
//    `cerrado_sin_resolucion` y `en_espera_excepcion` (P12/P17/P20-v, P16, P21, vencimiento sin intentos
//    enviados). Tras agotar o vencer, el efecto sobre el proceso se devuelve como `"sin_definir"`.
//  - Recuperación y lotes (P17: número de intentos; P20-v), excepciones (P18-v), sustitución (P25), formularios
//    externos (P8), solicitud pendiente al vencer.
import { ESTADOS_CERRADOS } from "./p0e-estados";

// Maestra §3 «Intentos ordinarios».
export const INTENTOS_ORDINARIOS = { E1: 2, E2: 3, E3: 2, E4: 2 } as const;
export type Evaluacion = keyof typeof INTENTOS_ORDINARIOS;

export type EstadoInstancia = "disponible" | "en_curso" | (typeof ESTADOS_CERRADOS)[number];
export type EstadoIntento = "activo" | "enviado" | "expirado";
export type CausaCierre = "aprobacion" | "agotamiento" | "vencimiento";

export interface Intento {
  id: string;
  estado: EstadoIntento;
  /** Identificador de idempotencia del envío; solo en intentos enviados. */
  envioId: string | null;
  /** Resultado de la corrección; solo en intentos enviados. */
  aprobado: boolean | null;
}

export interface InstanciaP0E {
  estado: EstadoInstancia;
  maxIntentos: number;
  /** T + 48 h, en segundos UTC (shared/ventanas.ts). */
  finExtension: number;
  intentos: readonly Intento[];
  causaCierre: CausaCierre | null;
}

/** Efecto sobre el proceso. `sin_definir` = decisión pendiente (no se infiere); `null` = ninguno. */
export type EfectoProceso = "aprobado" | "sin_definir" | null;

export type MotivoRechazo =
  | "instancia_cerrada" | "ventana_cerrada" | "intentos_agotados" | "intento_inexistente"
  | "intento_expirado" | "conflicto_idempotencia" | "intento_duplicado";

export type Resultado =
  | { ok: true; instancia: InstanciaP0E; efectoProceso: EfectoProceso; repetido: boolean; intento: Intento }
  | { ok: false; motivo: MotivoRechazo };

const FINALES: readonly string[] = ESTADOS_CERRADOS;
export const esFinal = (e: EstadoInstancia) => FINALES.includes(e);
export const consumidos = (i: InstanciaP0E) => i.intentos.filter((x) => x.estado === "enviado").length;
const activo = (i: InstanciaP0E) => i.intentos.find((x) => x.estado === "activo") ?? null;

export function nuevaInstancia(p: { maxIntentos: number; finExtension: number }): InstanciaP0E {
  if (!Number.isInteger(p.maxIntentos) || p.maxIntentos < 1) throw new RangeError("maxIntentos debe ser un entero ≥ 1");
  if (!Number.isFinite(p.finExtension)) throw new RangeError("finExtension debe ser finito");
  return { estado: "disponible", maxIntentos: p.maxIntentos, finExtension: p.finExtension, intentos: [], causaCierre: null };
}

// Iniciar un intento, o retomar el activo (misma petición, mismo intento). No consume.
export function iniciarIntento(i: InstanciaP0E, intentoId: string, ahora: number): Resultado {
  if (esFinal(i.estado)) return { ok: false, motivo: "instancia_cerrada" };
  if (ahora >= i.finExtension) return { ok: false, motivo: "ventana_cerrada" };
  const a = activo(i);
  if (a) return { ok: true, instancia: i, efectoProceso: null, repetido: true, intento: a };
  if (consumidos(i) >= i.maxIntentos) return { ok: false, motivo: "intentos_agotados" };
  if (i.intentos.some((x) => x.id === intentoId)) return { ok: false, motivo: "intento_duplicado" }; // guarda técnica: el id lo genera el servidor y no se reutiliza
  const nuevo: Intento = { id: intentoId, estado: "activo", envioId: null, aprobado: null };
  return { ok: true, instancia: { ...i, estado: "en_curso", intentos: [...i.intentos, nuevo] }, efectoProceso: null, repetido: false, intento: nuevo };
}

// Enviar un intento ya corregido. Idempotente por `envioId`.
export function enviarIntento(i: InstanciaP0E, e: { intentoId: string; envioId: string; aprobado: boolean }, ahora: number): Resultado {
  const t = i.intentos.find((x) => x.id === e.intentoId);
  if (!t) return { ok: false, motivo: "intento_inexistente" };
  if (t.estado === "enviado") {
    return t.envioId === e.envioId
      ? { ok: true, instancia: i, efectoProceso: i.causaCierre === "aprobacion" ? "aprobado" : i.causaCierre === "agotamiento" ? "sin_definir" : null, repetido: true, intento: t }
      : { ok: false, motivo: "conflicto_idempotencia" };
  }
  if (t.estado === "expirado") return { ok: false, motivo: "intento_expirado" };
  if (esFinal(i.estado)) return { ok: false, motivo: "instancia_cerrada" };
  if (ahora >= i.finExtension) return { ok: false, motivo: "ventana_cerrada" };
  const enviado: Intento = { ...t, estado: "enviado", envioId: e.envioId, aprobado: e.aprobado };
  const intentos = i.intentos.map((x) => (x.id === t.id ? enviado : x));
  const usados = intentos.filter((x) => x.estado === "enviado").length;
  if (e.aprobado) return { ok: true, instancia: { ...i, estado: "cerrada_aprobada", intentos, causaCierre: "aprobacion" }, efectoProceso: "aprobado", repetido: false, intento: enviado };
  if (usados >= i.maxIntentos) return { ok: true, instancia: { ...i, estado: "cerrada_agotada", intentos, causaCierre: "agotamiento" }, efectoProceso: "sin_definir", repetido: false, intento: enviado };
  return { ok: true, instancia: { ...i, estado: "disponible", intentos }, efectoProceso: null, repetido: false, intento: enviado };
}

// Vencimiento (P15): idempotente; no hace nada en un estado final ni antes de T+48 h.
export function vencer(i: InstanciaP0E, ahora: number): { instancia: InstanciaP0E; cambio: boolean; efectoProceso: EfectoProceso } {
  if (esFinal(i.estado) || ahora < i.finExtension) return { instancia: i, cambio: false, efectoProceso: null };
  const intentos = i.intentos.map((x): Intento => (x.estado === "activo" ? { ...x, estado: "expirado" } : x)); // expira sin consumir
  return { instancia: { ...i, estado: "vencida", intentos, causaCierre: "vencimiento" }, cambio: true, efectoProceso: "sin_definir" };
}

// Invariantes 1–5 de la máquina de estados, comprobables en memoria. Devuelve las violaciones (vacío = cumple).
export function violaciones(i: InstanciaP0E): string[] {
  const v: string[] = [];
  const activos = i.intentos.filter((x) => x.estado === "activo").length;
  const enviados = consumidos(i);
  const aprobado = i.intentos.some((x) => x.estado === "enviado" && x.aprobado === true);
  if (activos > 1) v.push("más de un intento activo");
  if (enviados > i.maxIntentos) v.push("más envíos que intentos disponibles");
  if (new Set(i.intentos.map((x) => x.id)).size !== i.intentos.length) v.push("ids de intento repetidos");
  if (i.intentos.some((x) => x.estado === "enviado" && (x.envioId === null || x.aprobado === null))) v.push("envío sin resultado");
  if (i.intentos.some((x) => x.estado !== "enviado" && (x.envioId !== null || x.aprobado !== null))) v.push("resultado en un intento no enviado");
  if (i.intentos.filter((x) => x.estado === "enviado" && x.aprobado === true).length > 1) v.push("más de una aprobación");
  switch (i.estado) {
    case "disponible": if (activos || aprobado || enviados >= i.maxIntentos || i.causaCierre) v.push("estado disponible inconsistente"); break;
    case "en_curso": if (activos !== 1 || aprobado || i.causaCierre) v.push("estado en_curso inconsistente"); break;
    case "cerrada_aprobada": if (!aprobado || activos || i.causaCierre !== "aprobacion") v.push("cerrada_aprobada inconsistente"); break;
    case "cerrada_agotada": if (aprobado || activos || enviados !== i.maxIntentos || i.causaCierre !== "agotamiento") v.push("cerrada_agotada inconsistente"); break;
    case "vencida": if (aprobado || activos || enviados >= i.maxIntentos || i.causaCierre !== "vencimiento") v.push("vencida inconsistente"); break;
  }
  return v;
}
