// Armador puro del intento extra y verificador de capacidad del banco.
// Funciones puras: no leen estado externo, no guardan nada, no usan Math.random.
//
// Fuente de decisiones:
//   - P21 v2 (P21_v2_APROBADA.md): intento extra con ≥ 50 % de preguntas
//     de los subtemas fallados en el intento normal.
//   - P20-v (DECISIONES_DIRECCION.md): el extra NO repite preguntas del
//     intento normal; el banco debe tener preguntas para las DOS pruebas
//     con preguntas distintas; si falta capacidad, la evaluación NO se publica.
//
// Reutiliza FRACCION_ENFASIS_SUBTEMAS y minimoPreguntasDeSubtemasFallados
// de shared/perfiles.ts para no duplicar el 0,5.

import { FRACCION_ENFASIS_SUBTEMAS, minimoPreguntasDeSubtemasFallados } from "./perfiles";

// ——— Tipos ———

/** Pregunta ya validada en el banco (solo id y subtema). */
export interface Pregunta {
  id: string;
  subtemaId: string;
}

/** Banco de preguntas inmutable. */
export type Banco = readonly Pregunta[];

/** Prueba normal: lista inmutable de ids de preguntas usadas en el intento normal. */
export type PruebaNormal = readonly string[];

/** Resultado de la verificación de capacidad del banco. */
export interface CapacidadResultado {
  /** true si el banco tiene preguntas suficientes para armar un extra válido
   * para CUALQUIER conjunto no vacío de subtemas fallados. */
  suficiente: boolean;
  /** Por subtema, cuántas preguntas faltarían en el peor caso para alcanzar
   * el mínimo requerido de preguntas de subtemas fallados.
   * Solo se incluyen subtemas con déficit > 0. */
  deficits: Record<string, number>;
}

/** Violación detectada por verificarExtra. */
export interface Violacion {
  /** Tipo de violación. */
  tipo: string;
  /** Descripción humana. */
  detalle: string;
}

// ——— PRNG determinista (Mulberry32) ———

/**
 * Implementación de Mulberry32: generador pseudoaleatorio determinista
 * a partir de una semilla numérica de 32 bits.
 *
 * PROHIBIDO usar Math.random, Date, crypto o cualquier fuente no determinista.
 *
 * Referencia: http://baagoe.com/en/RandomMusings/mulberry32/
 */
function mulberry32(semilla: number): () => number {
  let s = semilla | 0; // asegurar entero de 32 bits
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash simple de una cadena a un entero de 32 bits para usar como semilla.
 * Algoritmo djb2 modificado.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(33, hash) ^ str.charCodeAt(i);
  }
  return hash | 0;
}

// ——— Helpers internos ———

/**
 * Devuelve los subtemas presentes en la prueba normal.
 */
function subtemasDePrueba(banco: Banco, prueba: PruebaNormal): Set<string> {
  const mapa = new Map<string, string>();
  for (const p of banco) {
    mapa.set(p.id, p.subtemaId);
  }
  const subtemas = new Set<string>();
  for (const id of prueba) {
    const st = mapa.get(id);
    if (st !== undefined) {
      subtemas.add(st);
    }
  }
  return subtemas;
}


/**
 * Mezcla un array de forma determinista usando el PRNG dado (Fisher-Yates).
 */
function mezclarDeterminista<T>(array: T[], rng: () => number): T[] {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// ——— Funciones exportadas ———

/**
 * Verifica si el banco tiene capacidad suficiente para armar un intento extra
 * válido para CUALQUIER conjunto no vacío de subtemas fallados.
 *
 * Criterio: para cada subconjunto no vacío F de los subtemas presentes en `normal`:
 *   - `disponiblesF` = preguntas del banco de subtemas en F que NO están en `normal`
 *   - Se requiere `disponiblesF.length >= ceil(0.5 * N)` (fracción de énfasis)
 *   - Además, el total de preguntas no usadas del banco debe ser >= N
 *
 * Optimización del peor caso: en lugar de enumerar 2^k subconjuntos, observamos que
 * `disponiblesF` es mínimo cuando F contiene el subtema con MENOS preguntas disponibles
 * (excluyendo las de `normal`). La demostración es breve:
 *   - `disponiblesF` = Σ_{s ∈ F} (banco_s - usadasEnNormal_s) donde banco_s son las
 *     preguntas del banco del subtema s y usadasEnNormal_s las usadas en normal.
 *   - Como cada término es no negativo (si es negativo, ese subtema tiene déficit),
 *     la suma es mínima cuando F = {subtema con menor valor individual}.
 *   - Por lo tanto, basta con verificar el subtema individual con menos disponibles.
 *   - Si ese subtema individual cumple el mínimo, todo subconjunto que lo contenga
 *     también lo cumple (la suma solo crece al agregar subtemas).
 *
 * @param banco - Banco completo de preguntas validadas.
 * @param normal - Prueba normal (ids de preguntas usadas).
 * @param N - Tamaño de la prueba (por defecto el tamaño de `normal`).
 * @returns Resultado con `suficiente` y `deficits` por subtema.
 */
export function capacidadBanco(
  banco: Banco,
  normal: PruebaNormal,
  N?: number
): CapacidadResultado {
  const tamaño = N ?? normal.length;
  if (!Number.isInteger(tamaño) || tamaño < 1) {
    throw new RangeError(
      `N debe ser un entero positivo, recibido: ${tamaño}`
    );
  }

  // Mapa id → subtema
  const mapaSubtema = new Map<string, string>();
  for (const p of banco) {
    mapaSubtema.set(p.id, p.subtemaId);
  }

  // Conjunto de ids usados en normal
  const normalSet = new Set(normal);

  // Subtemas presentes en normal
  const subtemasEnNormal = subtemasDePrueba(banco, normal);

  // Para cada subtema en normal, contar preguntas disponibles (no usadas en normal)
  const disponiblesPorSubtema = new Map<string, number>();
  for (const st of subtemasEnNormal) {
    let count = 0;
    for (const p of banco) {
      if (p.subtemaId === st && !normalSet.has(p.id)) {
        count++;
      }
    }
    disponiblesPorSubtema.set(st, count);
  }

  // Total de preguntas no usadas en el banco
  const totalNoUsadas = banco.length - normal.filter((id) => mapaSubtema.has(id)).length;

  // Mínimo requerido de preguntas de subtemas fallados
  const minFallados = minimoPreguntasDeSubtemasFallados(tamaño);

  const deficits: Record<string, number> = {};
  let suficiente = true;

  // Verificación del peor caso: el subtema con menos disponibles
  // (ver demostración en el comentario de la función)
  for (const [st, count] of disponiblesPorSubtema) {
    if (count < minFallados) {
      const deficit = minFallados - count;
      deficits[st] = deficit;
      suficiente = false;
    }
  }

  // Además, el total de no usadas debe ser >= N para armar la prueba completa
  if (totalNoUsadas < tamaño) {
    suficiente = false;
    // Reportar el déficit global distribuido entre subtemas
    const deficitGlobal = tamaño - totalNoUsadas;
    // Asignar el déficit al subtema con más disponibles (el que más puede absorber)
    let maxSt = "";
    let maxCount = -1;
    for (const [st, count] of disponiblesPorSubtema) {
      if (count > maxCount) {
        maxCount = count;
        maxSt = st;
      }
    }
    if (maxSt) {
      deficits[maxSt] = (deficits[maxSt] ?? 0) + deficitGlobal;
    }
  }

  return { suficiente, deficits };
}

/**
 * Arma un intento extra determinista a partir del banco, la prueba normal
 * y los subtemas fallados.
 *
 * Reglas:
 *   (a) Al menos `ceil(0.5 * N)` preguntas de los subtemas fallados,
 *       no usadas en `normal`, repartidas lo más parejo posible entre ellos
 *       (round-robin determinista).
 *   (b) El resto de preguntas no usadas, priorizando subtemas NO fallados
 *       y luego los fallados.
 *   (c) Sin repetir nunca ids de `normal` ni duplicados.
 *   (d) Tamaño exactamente N.
 *   (e) Determinista: misma semilla + mismas entradas ⇒ misma salida.
 *   (f) Si no hay capacidad, lanza `Error` con código `capacidad_insuficiente`.
 *
 * @param banco - Banco completo de preguntas validadas.
 * @param normal - Prueba normal (ids de preguntas usadas).
 * @param fallados - Subtemas fallados (no vacío, todos presentes en `normal`).
 * @param N - Tamaño de la prueba (por defecto el tamaño de `normal`).
 * @param semilla - Semilla para el PRNG determinista (cadena o número).
 * @returns Lista inmutable de ids de preguntas para el intento extra.
 */
export function armarExtra(params: {
  banco: Banco;
  normal: PruebaNormal;
  fallados: readonly string[];
  N?: number;
  semilla: string | number;
}): readonly string[] {
  const { banco, normal, fallados, N, semilla } = params;
  const tamaño = N ?? normal.length;

  // Validación de fallados
  if (!fallados.length) {
    throw new RangeError("fallados no puede estar vacío");
  }

  // Mapa id → subtema
  const mapaSubtema = new Map<string, string>();
  for (const p of banco) {
    mapaSubtema.set(p.id, p.subtemaId);
  }

  // Verificar que todos los fallados están presentes en normal
  const subtemasEnNormal = subtemasDePrueba(banco, normal);
  for (const st of fallados) {
    if (!subtemasEnNormal.has(st)) {
      throw new RangeError(
        `fallados contiene subtema '${st}' que no está presente en la prueba normal`
      );
    }
  }

  const normalSet = new Set(normal);
  const falladosSet = new Set(fallados);

  // Preguntas disponibles (no usadas en normal)
  const disponiblesFallados: Pregunta[] = [];
  const disponiblesNoFallados: Pregunta[] = [];

  for (const p of banco) {
    if (normalSet.has(p.id)) continue;
    if (falladosSet.has(p.subtemaId)) {
      disponiblesFallados.push(p);
    } else {
      disponiblesNoFallados.push(p);
    }
  }

  // Mínimo requerido de preguntas de subtemas fallados
  const minFallados = minimoPreguntasDeSubtemasFallados(tamaño);

  // Verificar capacidad mínima
  if (disponiblesFallados.length < minFallados) {
    const err = new Error(
      `capacidad_insuficiente: se requieren al menos ${minFallados} preguntas de subtemas fallados, pero solo hay ${disponiblesFallados.length} disponibles`
    );
    (err as Error & { code?: string }).code = "capacidad_insuficiente";
    throw err;
  }

  if (disponiblesFallados.length + disponiblesNoFallados.length < tamaño) {
    const err = new Error(
      `capacidad_insuficiente: se requieren ${tamaño} preguntas en total, pero solo hay ${disponiblesFallados.length + disponiblesNoFallados.length} disponibles`
    );
    (err as Error & { code?: string }).code = "capacidad_insuficiente";
    throw err;
  }

  // Inicializar PRNG determinista
  const semillaNum = typeof semilla === "string" ? hashString(semilla) : semilla;
  const rng = mulberry32(semillaNum);

  // (a) Seleccionar preguntas de subtemas fallados con round-robin determinista
  // Agrupar por subtema
  const porSubtema = new Map<string, Pregunta[]>();
  for (const st of fallados) {
    porSubtema.set(st, []);
  }
  for (const p of disponiblesFallados) {
    const lista = porSubtema.get(p.subtemaId);
    if (lista) lista.push(p);
  }

  // Mezclar cada grupo de forma determinista
  for (const lista of porSubtema.values()) {
    lista.sort(() => rng() - 0.5);
  }

  // Round-robin: tomar una de cada subtema alternando
  const seleccionadasFallados: Pregunta[] = [];
  const indices = new Map<string, number>();
  for (const st of fallados) {
    indices.set(st, 0);
  }

  // Primero llenar hasta minFallados con round-robin
  while (seleccionadasFallados.length < minFallados) {
    let encontrada = false;
    for (const st of fallados) {
      const lista = porSubtema.get(st)!;
      const idx = indices.get(st)!;
      if (idx < lista.length) {
        seleccionadasFallados.push(lista[idx]);
        indices.set(st, idx + 1);
        encontrada = true;
        if (seleccionadasFallados.length >= minFallados) break;
      }
    }
    if (!encontrada) break; // no hay más preguntas de fallados
  }

  const idsSeleccionadas = new Set(seleccionadasFallados.map((p) => p.id));

  // (b) Completar con preguntas no falladas primero, luego falladas restantes

  // Mezclar disponiblesNoFallados de forma determinista
  const noFalladosMezclados = mezclarDeterminista(disponiblesNoFallados, rng);

  // Preguntas falladas restantes (no seleccionadas aún)
  const falladasRestantes: Pregunta[] = [];
  for (const st of fallados) {
    const lista = porSubtema.get(st)!;
    const idx = indices.get(st)!;
    for (let i = idx; i < lista.length; i++) {
      falladasRestantes.push(lista[i]);
    }
  }
  const falladasRestantesMezcladas = mezclarDeterminista(falladasRestantes, rng);

  const extraIds: string[] = [...seleccionadasFallados.map((p) => p.id)];

  // Agregar no falladas primero
  for (const p of noFalladosMezclados) {
    if (extraIds.length >= tamaño) break;
    if (!idsSeleccionadas.has(p.id)) {
      extraIds.push(p.id);
      idsSeleccionadas.add(p.id);
    }
  }

  // Si aún falta, agregar falladas restantes
  if (extraIds.length < tamaño) {
    for (const p of falladasRestantesMezcladas) {
      if (extraIds.length >= tamaño) break;
      if (!idsSeleccionadas.has(p.id)) {
        extraIds.push(p.id);
        idsSeleccionadas.add(p.id);
      }
    }
  }

  return extraIds as readonly string[];
}

/**
 * Verifica independientemente que un intento extra cumple todas las reglas.
 * Devuelve una lista de violaciones (vacía = correcta).
 *
 * Reglas verificadas:
 *   - Tamaño exactamente N.
 *   - Sin duplicados.
 *   - Todos los ids pertenecen al banco.
 *   - Ningún id está repetido de `normal`.
 *   - La fracción de preguntas de subtemas fallados es ≥ 50 %.
 *
 * @param banco - Banco completo de preguntas.
 * @param normal - Prueba normal (ids).
 * @param fallados - Subtemas fallados.
 * @param extra - Intento extra a verificar (ids).
 * @param N - Tamaño esperado (por defecto el tamaño de `normal`).
 * @returns Lista de violaciones (vacía si el extra es correcto).
 */
export function verificarExtra(params: {
  banco: Banco;
  normal: PruebaNormal;
  fallados: readonly string[];
  extra: readonly string[];
  N?: number;
}): readonly Violacion[] {
  const { banco, normal, fallados, extra, N } = params;
  const tamaño = N ?? normal.length;
  const violaciones: Violacion[] = [];

  // 1. Tamaño
  if (extra.length !== tamaño) {
    violaciones.push({
      tipo: "tamaño",
      detalle: `El extra tiene ${extra.length} preguntas, pero se esperan ${tamaño}`,
    });
  }

  // Mapa id → subtema
  const mapaSubtema = new Map<string, string>();
  for (const p of banco) {
    mapaSubtema.set(p.id, p.subtemaId);
  }

  const bancoIds = new Set(banco.map((p) => p.id));
  const normalSet = new Set(normal);
  const falladosSet = new Set(fallados);

  // 2. Duplicados
  const extraSet = new Set<string>();
  const duplicados: string[] = [];
  for (const id of extra) {
    if (extraSet.has(id)) {
      if (!duplicados.includes(id)) {
        duplicados.push(id);
      }
    }
    extraSet.add(id);
  }
  if (duplicados.length > 0) {
    violaciones.push({
      tipo: "duplicados",
      detalle: `Ids duplicados en el extra: ${duplicados.join(", ")}`,
    });
  }

  // 3. IDs ajenos al banco
  const ajenos: string[] = [];
  for (const id of extra) {
    if (!bancoIds.has(id)) {
      ajenos.push(id);
    }
  }
  if (ajenos.length > 0) {
    violaciones.push({
      tipo: "ajeno_al_banco",
      detalle: `Ids no pertenecen al banco: ${ajenos.join(", ")}`,
    });
  }

  // 4. IDs repetidos de normal
  const repetidosDeNormal: string[] = [];
  for (const id of extra) {
    if (normalSet.has(id)) {
      repetidosDeNormal.push(id);
    }
  }
  if (repetidosDeNormal.length > 0) {
    violaciones.push({
      tipo: "repetido_de_normal",
      detalle: `Ids repetidos del intento normal: ${repetidosDeNormal.join(", ")}`,
    });
  }

  // 5. Fracción de fallados ≥ 50 %
  const minFallados = minimoPreguntasDeSubtemasFallados(tamaño);
  let countFallados = 0;
  for (const id of extra) {
    const st = mapaSubtema.get(id);
    if (st && falladosSet.has(st)) {
      countFallados++;
    }
  }
  if (countFallados < minFallados) {
    violaciones.push({
      tipo: "fraccion_fallados",
      detalle: `Solo ${countFallados} de ${tamaño} preguntas son de subtemas fallados (mínimo: ${minFallados}, fracción: ${FRACCION_ENFASIS_SUBTEMAS})`,
    });
  }

  return violaciones as readonly Violacion[];
}
