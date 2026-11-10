// Conjunto único de estados de instancia que cuentan como «cerrada» (IMP-006, R-13 de E0).
// Lo usan la condición de publicación (P19-E1: instancia cerrada y review_at) y la protección de
// versiones expuestas (P18). Si se define en dos lugares, divergen: en E0 una versión publicada
// para un alumno «vencida» seguía asignable. Todo SQL que liste estos estados se genera desde aquí;
// script/estados-cerrados.check.ts rechaza listas escritas a mano que difieran.
// Fuente: máquina de estados P0-E §3.1 (propuesta, 0a0ccaa) y maestra §3 (vencida = cierre, P15).
// `cerrada_por_excepcion` no entra: sus reglas siguen sin ratificar (P18-v).
export const ESTADOS_CERRADOS = ["cerrada_aprobada", "cerrada_agotada", "vencida"] as const;
export type EstadoCerrado = (typeof ESTADOS_CERRADOS)[number];

export const SQL_ESTADOS_CERRADOS = `(${ESTADOS_CERRADOS.map((e) => `'${e}'`).join(", ")})`;

export function esEstadoCerrado(estado: string): estado is EstadoCerrado {
  return (ESTADOS_CERRADOS as readonly string[]).includes(estado);
}
