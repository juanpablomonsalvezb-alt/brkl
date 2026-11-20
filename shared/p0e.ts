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

// Maestra §3 «Intentos ordinarios». E2 tiene 1 intento normal más 1 extra (el extra se modela aparte, en T13).
export const INTENTOS_ORDINARIOS = { E1: 2, E2: 1, E3: 2, E4: 2 } as const;
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
  /** Fase del intento: "normal" (intento ordinario) o "extra" (intento extra de E2). Solo relevante para E2. */
  fase: "normal" | "extra";
}

export interface InstanciaP0E {
  estado: EstadoInstancia;
  maxIntentos: number;
  /** T + 48 h, en segundos UTC (shared/ventanas.ts). */
  finExtension: number;
  intentos: readonly Intento[];
  causaCierre: CausaCierre | null;
  /** Indica si esta instancia corresponde a E2 (donde aplica la lógica de intento extra). */
  esE2: boolean;
  /** Si es E2 y se falló el intento normal, marca que el extra está disponible. */
  extraDisponible: boolean;
  /** Si es E2 y se falló el extra, marca que el extra se agotó (reprobada_continua). */
  extraAgotado: boolean;
}

/** Efecto sobre el proceso. `sin_definir` = decisión pendiente (no se infiere);
 * `extra_disponible` = E2 falló el intento normal; `reprobada_continua` = E2 falló también el extra;
 * `null` = ninguno. */
export type EfectoProceso = "aprobado" | "sin_definir" | "extra_disponible" | "reprobada_continua" | null;

export type MotivoRechazo =
  | "instancia_cerrada" | "ventana_cerrada" | "intentos_agotados" | "intento_inexistente"
  | "intento_expirado" | "conflicto_idempotencia" | "intento_duplicado"
  | "extra_no_disponible" | "extra_agotado";

export type Resultado =
  | { ok: true; instancia: InstanciaP0E; efectoProceso: EfectoProceso; repetido: boolean; intento: Intento }
  | { ok: false; motivo: MotivoRechazo };

const FINALES: readonly string[] = ESTADOS_CERRADOS;
export const esFinal = (e: EstadoInstancia) => FINALES.includes(e);
export const consumidos = (i: InstanciaP0E) => i.intentos.filter((x) => x.estado === "enviado").length;
const activo = (i: InstanciaP0E) => i.intentos.find((x) => x.estado === "activo") ?? null;

export function nuevaInstancia(p: { maxIntentos: number; finExtension: number; esE2?: boolean }): InstanciaP0E {
  if (!Number.isInteger(p.maxIntentos) || p.maxIntentos < 1) throw new RangeError("maxIntentos debe ser un entero ≥ 1");
  if (!Number.isFinite(p.finExtension)) throw new RangeError("finExtension debe ser finito");
  return { estado: "disponible", maxIntentos: p.maxIntentos, finExtension: p.finExtension, intentos: [], causaCierre: null, esE2: p.esE2 ?? false, extraDisponible: false, extraAgotado: false };
}

// Iniciar un intento, o retomar el activo (misma petición, mismo intento). No consume.
// Para E2: `fase` indica si es el intento normal o el extra. Si no se pasa, se asume "normal".
export function iniciarIntento(i: InstanciaP0E, intentoId: string, ahora: number, fase?: "normal" | "extra"): Resultado {
  if (esFinal(i.estado)) return { ok: false, motivo: "instancia_cerrada" };
  if (ahora >= i.finExtension) return { ok: false, motivo: "ventana_cerrada" };
  const a = activo(i);
  if (a) return { ok: true, instancia: i, efectoProceso: null, repetido: true, intento: a };

  // Lógica E2: si se pide fase "extra", verificar que esté disponible.
  if (fase === "extra") {
    if (!i.esE2) return { ok: false, motivo: "extra_no_disponible" };
    if (!i.extraDisponible) return { ok: false, motivo: "extra_no_disponible" };
    if (i.extraAgotado) return { ok: false, motivo: "extra_agotado" };
  }

  if (consumidos(i) >= i.maxIntentos && fase !== "extra") return { ok: false, motivo: "intentos_agotados" };
  if (i.intentos.some((x) => x.id === intentoId)) return { ok: false, motivo: "intento_duplicado" }; // guarda técnica: el id lo genera el servidor y no se reutiliza
  const intentoFase: "normal" | "extra" = fase ?? "normal";
  const nuevo: Intento = { id: intentoId, estado: "activo", envioId: null, aprobado: null, fase: intentoFase };
  return { ok: true, instancia: { ...i, estado: "en_curso", intentos: [...i.intentos, nuevo] }, efectoProceso: null, repetido: false, intento: nuevo };
}

// Enviar un intento ya corregido. Idempotente por `envioId`.
export function enviarIntento(i: InstanciaP0E, e: { intentoId: string; envioId: string; aprobado: boolean }, ahora: number): Resultado {
  const t = i.intentos.find((x) => x.id === e.intentoId);
  if (!t) return { ok: false, motivo: "intento_inexistente" };
  if (t.estado === "enviado") {
    if (t.envioId !== e.envioId) return { ok: false, motivo: "conflicto_idempotencia" };
    const enviados = i.intentos.filter((x) => x.estado === "enviado");
    // Calcular el efectoProceso histórico para este intento enviado (idempotencia).
    let efectoProceso: EfectoProceso;
    if (t.aprobado) {
      efectoProceso = "aprobado";
    } else if (t.fase === "extra" && i.esE2) {
      // E2: falló el extra → reprobada_continua
      efectoProceso = "reprobada_continua";
    } else if (t.fase === "normal" && i.esE2 && i.extraDisponible && !i.extraAgotado) {
      // E2: falló el normal → extra_disponible (pero en reenvío el efecto se calcula desde el estado actual)
      // En realidad, el efecto original de este intento fue extra_disponible.
      // Para idempotencia, necesitamos saber qué efecto tuvo. Lo calculamos:
      // Si es E2, fase normal, y fue el último intento normal (consumidos normales = maxIntentos),
      // entonces el efecto fue extra_disponible.
      const normalesEnviados = enviados.filter((x) => x.fase === "normal").length;
      if (normalesEnviados >= i.maxIntentos) {
        efectoProceso = "extra_disponible";
      } else {
        efectoProceso = null;
      }
    } else if (i.causaCierre === "agotamiento" && enviados[enviados.length - 1]?.id === t.id) {
      efectoProceso = "sin_definir";
    } else {
      efectoProceso = null;
    }
    return { ok: true, instancia: i, efectoProceso, repetido: true, intento: t };
  }
  if (t.estado === "expirado") return { ok: false, motivo: "intento_expirado" };
  if (esFinal(i.estado)) return { ok: false, motivo: "instancia_cerrada" };
  if (ahora >= i.finExtension) return { ok: false, motivo: "ventana_cerrada" };
  const enviado: Intento = { ...t, estado: "enviado", envioId: e.envioId, aprobado: e.aprobado };
  const intentos = i.intentos.map((x) => (x.id === t.id ? enviado : x));
  const usados = intentos.filter((x) => x.estado === "enviado").length;

  // Caso aprobado: cierra la instancia.
  if (e.aprobado) return { ok: true, instancia: { ...i, estado: "cerrada_aprobada", intentos, causaCierre: "aprobacion" }, efectoProceso: "aprobado", repetido: false, intento: enviado };

  // Caso reprobado: distinguir E2 (fase normal vs extra) de E1/E3/E4.
  if (i.esE2 && t.fase === "extra") {
    // E2: falló el intento extra → reprobada_continua
    return { ok: true, instancia: { ...i, estado: "cerrada_agotada", intentos, causaCierre: "agotamiento", extraAgotado: true }, efectoProceso: "reprobada_continua", repetido: false, intento: enviado };
  }

  if (i.esE2 && t.fase === "normal" && usados >= i.maxIntentos) {
    // E2: falló el intento normal → extra_disponible (no cerrada, queda disponible para el extra)
    return { ok: true, instancia: { ...i, estado: "disponible", intentos, extraDisponible: true }, efectoProceso: "extra_disponible", repetido: false, intento: enviado };
  }

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
// Para E2 con extra: el máximo de intentos normales es maxIntentos; el extra es adicional.
export function violaciones(i: InstanciaP0E): string[] {
  const v: string[] = [];
  const activos = i.intentos.filter((x) => x.estado === "activo").length;
  const enviados = consumidos(i);
  const aprobado = i.intentos.some((x) => x.estado === "enviado" && x.aprobado === true);
  if (activos > 1) v.push("más de un intento activo");
  // Para E2, el extra es adicional al maxIntentos.
  const maxEnviados = i.esE2 ? i.maxIntentos + 1 : i.maxIntentos;
  if (enviados > maxEnviados) v.push("más envíos que intentos disponibles");
  if (new Set(i.intentos.map((x) => x.id)).size !== i.intentos.length) v.push("ids de intento repetidos");
  if (i.intentos.some((x) => x.estado === "enviado" && (x.envioId === null || x.aprobado === null))) v.push("envío sin resultado");
  if (i.intentos.some((x) => x.estado !== "enviado" && (x.envioId !== null || x.aprobado !== null))) v.push("resultado en un intento no enviado");
  if (i.intentos.filter((x) => x.estado === "enviado" && x.aprobado === true).length > 1) v.push("más de una aprobación");
  switch (i.estado) {
    case "disponible":
      // Para E2 con extraDisponible, puede tener enviados === maxIntentos (falló normal) sin causaCierre.
      const maxDisp = i.esE2 && i.extraDisponible ? i.maxIntentos : i.maxIntentos - 1;
      if (activos || aprobado || enviados > maxDisp || i.causaCierre) v.push("estado disponible inconsistente");
      break;
    case "en_curso": if (activos !== 1 || aprobado || i.causaCierre) v.push("estado en_curso inconsistente"); break;
    case "cerrada_aprobada": if (!aprobado || activos || i.causaCierre !== "aprobacion") v.push("cerrada_aprobada inconsistente"); break;
    case "cerrada_agotada":
      // Para E2 con extra: enviados puede ser maxIntentos + 1 (normal + extra).
      const maxAgotada = i.esE2 && i.extraAgotado ? i.maxIntentos + 1 : i.maxIntentos;
      if (aprobado || activos || enviados !== maxAgotada || i.causaCierre !== "agotamiento") v.push("cerrada_agotada inconsistente");
      break;
    case "vencida":
      const maxVencida = i.esE2 ? i.maxIntentos + 1 : i.maxIntentos;
      if (aprobado || activos || enviados > maxVencida || i.causaCierre !== "vencimiento") v.push("vencida inconsistente");
      break;
  }
  return v;
}
