// Regla pura de «publicable» para el banco de preguntas y la evaluación de cierre (E2).
// Funciones puras: no leen estado externo, no guardan nada, no usan Math.random.
//
// Fuente de decisiones (DECISIONES_DIRECCION.md):
//   - «E2 tiene siempre 15 preguntas» (2026-11-20): PREGUNTAS_E2 = 15.
//   - «Fuente curricular oficial»: toda pregunta del banco debe trazarse a una fuente
//     oficial (OA con código; texto escolar o plan y programa con referencia verificable).
//   - «O4: Validan dos personas nombradas»: VALIDADORES_MINIMOS = 2.
//   - «Subtemas del piloto APROBADOS»: 5 subtemas (OA 7, 8, 10, 11, 13), 3 preguntas
//     por subtema en cada prueba, 9 por subtema en el banco.
//   - «Temario de Exámenes Libres»: OA 7, 10, 11, 13 en el examen; OA 8 solo del nivel.
//
// Reutiliza capacidadBanco de shared/armador.ts y minimoPreguntasDeSubtemasFallados
// de shared/perfiles.ts para no duplicar constantes.

import { capacidadBanco } from "./armador";

// ——— Constantes ———

/**
 * Número fijo de preguntas de la evaluación de cierre (E2), en el intento normal
 * y en el extra.
 *
 * Decisión del sostenedor (2026-11-20): «La E2 tendrá 15 preguntas siempre».
 */
export const PREGUNTAS_E2 = 15;

/**
 * Número mínimo de validadores distintos (y distintos del autor) que debe tener
 * una pregunta para ser considerada publicable.
 *
 * Decisión O4 (Bloque 2): «Validan dos personas nombradas».
 */
export const VALIDADORES_MINIMOS = 2;

// ——— Tipos ———

/** Tipos de fuente oficial reconocidos. */
export type TipoFuente =
  | "texto_escolar"
  | "plan_programa"
  | "bases_curriculares"
  | "banco_items_mineduc";

/** Referencia verificable a una fuente curricular oficial. */
export interface FuenteOficial {
  /** Tipo de fuente. */
  tipo: TipoFuente;
  /** Referencia bibliográfica (título, autor, editorial). */
  referencia: string;
  /** Edición o año. */
  edicion: string;
  /** Ubicación dentro de la fuente: capítulo y/o página. */
  ubicacion: string;
}

/** Prioridad de un OA según el temario de Exámenes Libres. */
export type PrioridadOA = "temario_examen_libre" | "solo_nivel";

/** Pregunta del banco de preguntas. */
export interface PreguntaBanco {
  /** Identificador único de la pregunta. */
  id: string;
  /** Identificador del subtema al que pertenece. */
  subtemaId: string;
  /** Número del OA oficial (p. ej. 7, 8, 10, 11, 13). */
  oa: number;
  /** Referencia a la fuente oficial (opcional en borrador, obligatoria para publicar). */
  fuente?: FuenteOficial;
  /** Identificador del autor de la pregunta. */
  autorId: string;
  /** Identificadores de los validadores (puede contener duplicados o al autor). */
  validadoPor: readonly string[];
}

/** Subtema de una evaluación. */
export interface Subtema {
  /** Identificador estable del subtema (p. ej. mat5-u3-oa7). */
  id: string;
  /** Número del OA oficial. */
  oa: number;
  /** Prioridad según el temario de Exámenes Libres. */
  prioridad: PrioridadOA;
  /** Cuántas preguntas de este subtema entran en la prueba normal. */
  preguntasEnNormal: number;
}

// ——— Constantes del piloto ———

/**
 * Prioridad de cada OA del piloto según el temario de Exámenes Libres 5.º Básico.
 *
 * OA 7, 10, 11, 13 están en el temario de Exámenes Libres (núcleo).
 * OA 8 no está en el temario (solo del nivel).
 *
 * Fuente: temario-5-basico.md en BRKL_TEXTOS_OFICIALES.
 */
export const PRIORIDAD_PILOTO: Record<number, PrioridadOA> = {
  7: "temario_examen_libre",
  8: "solo_nivel",
  10: "temario_examen_libre",
  11: "temario_examen_libre",
  13: "temario_examen_libre",
};

/**
 * Los 5 subtemas del piloto de Matemática 5.º Básico, Unidad 3.
 *
 * Decisión del sostenedor (2026-11-20): 5 subtemas, uno por OA.
 * E2 = 15 preguntas = 3 por subtema. Banco mínimo: 45 preguntas (9 por subtema).
 *
 * Cada subtema tiene `preguntasEnNormal: 3` (proporcional, 15 / 5 subtemas).
 */
export const SUBTEMAS_PILOTO: readonly Subtema[] = [
  { id: "mat5-u3-oa7", oa: 7, prioridad: "temario_examen_libre", preguntasEnNormal: 3 },
  { id: "mat5-u3-oa8", oa: 8, prioridad: "solo_nivel", preguntasEnNormal: 3 },
  { id: "mat5-u3-oa10", oa: 10, prioridad: "temario_examen_libre", preguntasEnNormal: 3 },
  { id: "mat5-u3-oa11", oa: 11, prioridad: "temario_examen_libre", preguntasEnNormal: 3 },
  {
    id: "mat5-u3-oa13",
    oa: 13,
    prioridad: "temario_examen_libre",
    preguntasEnNormal: 3,
  },
] as const;

// ——— Funciones puras ———

/**
 * Verifica si una fuente oficial está completa.
 *
 * Devuelve una lista de campos faltantes (vacía = completa).
 * Exige:
 *   - `tipo` válido (uno de los 4 TipoFuente).
 *   - `referencia`, `edicion`, `ubicacion` no vacíos (sin espacios solos).
 *
 * Si `fuente` es `undefined` o `null`, reporta todos los campos.
 */
export function fuenteCompleta(fuente?: FuenteOficial): string[] {
  const faltantes: string[] = [];

  if (!fuente) {
    faltantes.push("fuente ausente");
    return faltantes;
  }

  const tiposValidos: TipoFuente[] = [
    "texto_escolar",
    "plan_programa",
    "bases_curriculares",
    "banco_items_mineduc",
  ];
  if (!tiposValidos.includes(fuente.tipo)) {
    faltantes.push("tipo inválido");
  }

  if (!fuente.referencia || fuente.referencia.trim() === "") {
    faltantes.push("referencia vacía");
  }

  if (!fuente.edicion || fuente.edicion.trim() === "") {
    faltantes.push("edición vacía");
  }

  if (!fuente.ubicacion || fuente.ubicacion.trim() === "") {
    faltantes.push("ubicación vacía");
  }

  return faltantes;
}

/**
 * Cuenta cuántos validadores DISTINTOS entre sí y DISTINTOS del autor
 * tiene una pregunta.
 *
 * Ignora duplicados y al propio autor.
 *
 * Ejemplo: autor = "A", validadoPor = ["B", "B", "A", "C"] → 2 (B y C).
 */
export function validacionesDe(p: PreguntaBanco): number {
  const validadores = new Set<string>();
  for (const v of p.validadoPor) {
    if (v !== p.autorId) {
      validadores.add(v);
    }
  }
  return validadores.size;
}

/**
 * Verifica si una pregunta cumple la regla de «publicable».
 *
 * Condiciones (todas deben cumplirse):
 *   1. El OA de la pregunta está en `oaOficiales`.
 *   2. La fuente oficial está completa (fuenteCompleta devuelve []).
 *   3. Tiene al menos VALIDADORES_MINIMOS validadores distintos del autor.
 *
 * Devuelve `{ ok: boolean; motivos: string[] }`.
 * `ok = true` ⇔ `motivos` está vacío.
 * Cada incumplimiento añade un motivo claro.
 */
export function preguntaPublicable(
  p: PreguntaBanco,
  oaOficiales: ReadonlySet<number>
): { ok: boolean; motivos: string[] } {
  const motivos: string[] = [];

  // 1. OA presente en oaOficiales
  if (!oaOficiales.has(p.oa)) {
    motivos.push(`OA ${p.oa} no está en la lista de OA oficiales`);
  }

  // 2. Fuente completa
  const faltantes = fuenteCompleta(p.fuente);
  if (faltantes.length > 0) {
    motivos.push(`Fuente incompleta: ${faltantes.join(", ")}`);
  }

  // 3. Validadores mínimos
  const validaciones = validacionesDe(p);
  if (validaciones < VALIDADORES_MINIMOS) {
    motivos.push(
      `Solo ${validaciones} validador(es) distinto(s) del autor (mínimo: ${VALIDADORES_MINIMOS})`
    );
  }

  return { ok: motivos.length === 0, motivos };
}

/**
 * Verifica si una evaluación completa (banco + prueba normal) es publicable.
 *
 * Condiciones (todas deben cumplirse):
 *   (a) La suma de `preguntasEnNormal` de los subtemas = PREGUNTAS_E2
 *       y cada una ≥ 1.
 *   (b) `normal` (ids) tiene exactamente PREGUNTAS_E2 ids, todos presentes
 *       en el banco, y su distribución por subtema coincide con `preguntasEnNormal`.
 *   (c) TODAS las preguntas consideradas (las de `normal` y las que cuentan
 *       como capacidad) son `preguntaPublicable`. Una pregunta no publicable
 *       NO cuenta para la capacidad ni la prueba: se filtra el banco a las
 *       publicables antes de `capacidadBanco`. Si alguna de `normal` no lo es,
 *       → no ok con el motivo.
 *   (d) `capacidadBanco(bancoPublicable, normal, PREGUNTAS_E2).suficiente`;
 *       el déficit por subtema va en `capacidad`.
 *   Si algún OA de un subtema no está en `oaOficiales` → no ok.
 *
 * @returns `{ ok, motivos, capacidad }` donde `capacidad` es el resultado
 * de `capacidadBanco` (o `undefined` si no se llega a calcular).
 */
export function evaluacionPublicable(params: {
  subtemas: readonly Subtema[];
  banco: readonly PreguntaBanco[];
  normal: readonly string[];
  oaOficiales: ReadonlySet<number>;
}): { ok: boolean; motivos: string[]; capacidad?: ReturnType<typeof capacidadBanco> } {
  const { subtemas, banco, normal, oaOficiales } = params;
  const motivos: string[] = [];

  // (a) Suma de preguntasEnNormal = PREGUNTAS_E2 y cada una ≥ 1
  const sumaPreguntas = subtemas.reduce((s, st) => s + st.preguntasEnNormal, 0);
  if (sumaPreguntas !== PREGUNTAS_E2) {
    motivos.push(
      `La suma de preguntasEnNormal (${sumaPreguntas}) no es ${PREGUNTAS_E2}`
    );
  }
  for (const st of subtemas) {
    if (st.preguntasEnNormal < 1) {
      motivos.push(
        `Subtema ${st.id} tiene preguntasEnNormal = ${st.preguntasEnNormal} (mínimo: 1)`
      );
    }
  }

  // Verificar que todos los OA de los subtemas están en oaOficiales
  for (const st of subtemas) {
    if (!oaOficiales.has(st.oa)) {
      motivos.push(`OA ${st.oa} del subtema ${st.id} no está en oaOficiales`);
    }
  }

  // (b) normal tiene exactamente PREGUNTAS_E2 ids
  if (normal.length !== PREGUNTAS_E2) {
    motivos.push(
      `La prueba normal tiene ${normal.length} preguntas (se esperan ${PREGUNTAS_E2})`
    );
  }

  // Mapa id → pregunta del banco
  const mapaBanco = new Map<string, PreguntaBanco>();
  for (const p of banco) {
    mapaBanco.set(p.id, p);
  }

  // Todos los ids de normal deben estar en el banco
  const normalSet = new Set(normal);
  for (const id of normal) {
    if (!mapaBanco.has(id)) {
      motivos.push(`Id "${id}" de normal no está en el banco`);
    }
  }

  // Distribución por subtema coincide con preguntasEnNormal
  const conteoPorSubtema = new Map<string, number>();
  for (const id of normal) {
    const p = mapaBanco.get(id);
    if (p) {
      conteoPorSubtema.set(p.subtemaId, (conteoPorSubtema.get(p.subtemaId) ?? 0) + 1);
    }
  }
  for (const st of subtemas) {
    const conteo = conteoPorSubtema.get(st.id) ?? 0;
    if (conteo !== st.preguntasEnNormal) {
      motivos.push(
        `Subtema ${st.id}: ${conteo} en normal, se esperan ${st.preguntasEnNormal}`
      );
    }
  }

  // (c) Filtrar el banco a las publicables
  const bancoPublicable: PreguntaBanco[] = [];
  const noPublicables: Map<string, string[]> = new Map();
  for (const p of banco) {
    const r = preguntaPublicable(p, oaOficiales);
    if (r.ok) {
      bancoPublicable.push(p);
    } else {
      noPublicables.set(p.id, r.motivos);
    }
  }

  // Si alguna de normal no es publicable → no ok
  const normalNoPublicables: string[] = [];
  for (const id of normal) {
    const motivosP = noPublicables.get(id);
    if (motivosP) {
      normalNoPublicables.push(id);
      motivos.push(`Pregunta "${id}" de normal no es publicable: ${motivosP.join("; ")}`);
    }
  }

  // Si la suma de preguntasEnNormal no es correcta, no se puede verificar capacidad
  if (sumaPreguntas !== PREGUNTAS_E2) {
    return { ok: false, motivos };
  }

  // (d) capacidadBanco con el banco filtrado a publicables
  // Convertir bancoPublicable al tipo de armador.ts (solo id y subtemaId)
  const bancoParaCapacidad = bancoPublicable.map((p) => ({
    id: p.id,
    subtemaId: p.subtemaId,
  }));

  const capacidad = capacidadBanco(bancoParaCapacidad, normal, PREGUNTAS_E2);
  if (!capacidad.suficiente) {
    const deficitStr = Object.entries(capacidad.deficits)
      .map(([st, d]) => `${st}: -${d}`)
      .join(", ");
    motivos.push(`Capacidad insuficiente: ${deficitStr}`);
  }

  return { ok: motivos.length === 0, motivos, capacidad };
}
