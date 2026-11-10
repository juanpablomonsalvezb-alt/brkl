// Política de dominio (IMP-010). Diseño: 03 §6–§9 y 05 §2 (3e5c488).
// Ningún parámetro tiene valor por omisión: los que dependen de decisiones abiertas (O1, O2, O3,
// N16, N17, escenarios 3 y 4) los fija la dirección. Con un solo parámetro nulo o inválido, la
// política no se ejecuta (TK15). Aquí no hay valores «recomendados»: viven solo en las pruebas.

// O2: qué separa dos aciertos para K6. La alternativa `intervalo:<n>` del diseño no está
// implementada: exigiría fijar un número, que es una decisión pedagógica (03 §9.1).
export const SEPARACIONES = ["ninguna", "sesion", "dia"] as const;
export type Separacion = (typeof SEPARACIONES)[number];

// K6 (COMUNICADO): dos respuestas correctas en familias distintas. No es un parámetro libre.
export const K6_FAMILIAS = 2;

export interface PoliticaEjecutable {
  /** K6: solo se admite 2. */
  k6_min_families: number;
  /** O2. */
  k6_separation: Separacion;
  /** O3: si una respuesta con ayuda de la práctica cuenta para K6. */
  assisted_counts: boolean;
  /** N16: si un error con ayuda cuenta como familia errada. */
  wrong_with_help_counts: boolean;
  /** Escenario 3: si un error reparado después (acierto en la misma familia) sigue contando. */
  error_repaired_counts: boolean;
  /** N17: si la evidencia de una familia retirada sin defecto sigue contando. */
  retired_counts: boolean;
  /** Escenarios 4 y 10: familias erradas después del dominio que lo bajan a `incierto`. */
  demote_wrong_families: number;
  /** O1: familias erradas que dan `no_dominado`. */
  not_mastered_wrong_families: number;
}

export type PoliticaGuardada = { [K in keyof PoliticaEjecutable]: PoliticaEjecutable[K] | null };

export type ResultadoPolitica =
  | { ejecutable: true; politica: PoliticaEjecutable }
  | { ejecutable: false; nulos: string[]; invalidos: string[] };

const CAMPOS: (keyof PoliticaEjecutable)[] = [
  "k6_min_families", "k6_separation", "assisted_counts", "wrong_with_help_counts",
  "error_repaired_counts", "retired_counts", "demote_wrong_families", "not_mastered_wrong_families",
];
const entero = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 1;
const VALIDOS: Record<keyof PoliticaEjecutable, (v: unknown) => boolean> = {
  k6_min_families: (v) => v === K6_FAMILIAS,
  k6_separation: (v) => (SEPARACIONES as readonly unknown[]).includes(v),
  assisted_counts: (v) => typeof v === "boolean",
  wrong_with_help_counts: (v) => typeof v === "boolean",
  error_repaired_counts: (v) => typeof v === "boolean",
  retired_counts: (v) => typeof v === "boolean",
  demote_wrong_families: entero,
  not_mastered_wrong_families: entero,
};

export function politicaEjecutable(p: Partial<PoliticaGuardada>): ResultadoPolitica {
  const nulos = CAMPOS.filter((k) => p[k] === null || p[k] === undefined);
  const invalidos = CAMPOS.filter((k) => !nulos.includes(k) && !VALIDOS[k](p[k]));
  const extras = Object.keys(p).filter((k) => !(CAMPOS as string[]).includes(k));
  if (nulos.length || invalidos.length || extras.length) {
    return { ejecutable: false, nulos, invalidos: [...invalidos, ...extras.map((k) => `${k} (desconocido)`)] };
  }
  return { ejecutable: true, politica: Object.freeze({ ...(p as PoliticaEjecutable) }) };
}

// Comprobación en tiempo de ejecución: el tipo no basta si alguien fuerza una conversión.
export function esPoliticaEjecutable(p: unknown): p is PoliticaEjecutable {
  return typeof p === "object" && p !== null && politicaEjecutable(p as Partial<PoliticaGuardada>).ejecutable;
}
