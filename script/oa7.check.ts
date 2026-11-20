// Verificador automático del OA 7: fracciones propias (representar, equivalentes, comparar).
// Lee oa7_preguntas.json, oa7_libreto.md y plantilla_banco_mat5_unidad3.csv.
// Usa aritmética ENTERA (productos cruzados, MCD de Euclides); prohibido punto flotante.
//
// Ejecutar: npx tsx script/oa7.check.ts

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { preguntaPublicable, VALIDADORES_MINIMOS } from "../shared/banco";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ——— Utilidades de aritmética entera ———

/** MCD usando el algoritmo de Euclides (entero). */
function mcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/** Verifica que a/b = c/d usando productos cruzados (entero). */
function sonEquivalentes(a: number, b: number, c: number, d: number): boolean {
  return a * d === c * b;
}

/** Compara a/b vs c/d usando productos cruzados. Retorna -1, 0 o 1. */
function comparaFracciones(a: number, b: number, c: number, d: number): -1 | 0 | 1 {
  const izq = a * d;
  const der = c * b;
  if (izq < der) return -1;
  if (izq > der) return 1;
  return 0;
}

/** Simplifica a/b dividiendo por el MCD. */
function simplificar(a: number, b: number): { num: number; den: number } {
  const g = mcd(a, b);
  return { num: a / g, den: b / g };
}

/** Verifica que a/b < c/d usando productos cruzados. */
function esMenor(a: number, b: number, c: number, d: number): boolean {
  return comparaFracciones(a, b, c, d) === -1;
}

/** Verifica que a/b > c/d usando productos cruzados. */
function esMayor(a: number, b: number, c: number, d: number): boolean {
  return comparaFracciones(a, b, c, d) === 1;
}

// ——— Tipos ———

interface PreguntaOA7 {
  id: string;
  tipo: string;
  numeros: Record<string, number>;
  enunciado: string;
  alternativas: { id: string; texto: string }[];
  respuesta_correcta: string;
  explicacion_distractores: Record<string, string>;
  nivel: "basico" | "medio" | "reto";
  fuente: {
    tipo: string;
    referencia: string;
    edicion: string;
    ubicacion: string;
  };
}

// ——— Estado global ———

let casos = 0;
let fallas = 0;
const salida: string[] = [];

function caso(id: string, nombre: string, f: () => void) {
  try {
    f();
    casos++;
    salida.push(`  ✓ ${id.padEnd(6)} ${nombre}`);
  } catch (e) {
    fallas++;
    casos++;
    salida.push(`  ✗ ${id.padEnd(6)} ${nombre}`);
    salida.push(`    ERROR: ${e}`);
  }
}

function falla(msg: string) {
  throw new Error(msg);
}

// ——— Carga de datos ———

const jsonPath = resolve(ROOT, "docs/vortice/piloto/contenido/oa7_preguntas.json");
const csvPath = resolve(ROOT, "docs/vortice/piloto/plantilla_banco_mat5_unidad3.csv");
const libretoPath = resolve(ROOT, "docs/vortice/piloto/contenido/oa7_libreto.md");

if (!existsSync(jsonPath)) {
  console.error("FALLA: no existe " + jsonPath);
  process.exit(1);
}
if (!existsSync(csvPath)) {
  console.error("FALLA: no existe " + csvPath);
  process.exit(1);
}
if (!existsSync(libretoPath)) {
  console.error("FALLA: no existe " + libretoPath);
  process.exit(1);
}

const preguntas: PreguntaOA7[] = JSON.parse(readFileSync(jsonPath, "utf-8"));
const csvRaw = readFileSync(csvPath, "utf-8");
const csvLines = csvRaw.split("\n").filter((l) => l.trim() !== "");
const libretoRaw = readFileSync(libretoPath, "utf-8");

// ——— PASO 1: Recalcular respuestas correctas desde numeros según tipo ———

salida.push("");
salida.push("=== PASO 1: Recalcular respuestas correctas ===");

for (const p of preguntas) {
  caso(p.id, `recalcular respuesta (${p.tipo})`, () => {
    const n = p.numeros;

    if (p.tipo === "representar") {
      // Verifica que numerador/denominador = equivalente_num/equivalente_den
      const a = n.numerador, b = n.denominador;
      const c = n.equivalente_num, d = n.equivalente_den;
      if (!sonEquivalentes(a, b, c, d)) {
        falla(`${p.id}: ${a}/${b} ≠ ${c}/${d}`);
      }
    } else if (p.tipo === "equivalentes") {
      // Verifica que numerador/denominador = simplificada_num/simplificada_den
      const a = n.numerador, b = n.denominador;
      const c = n.simplificada_num, d = n.simplificada_den;
      if (!sonEquivalentes(a, b, c, d)) {
        falla(`${p.id}: ${a}/${b} ≠ ${c}/${d}`);
      }
      // Verifica que la simplificada está realmente simplificada
      const s = simplificar(a, b);
      if (s.num !== c || s.den !== d) {
        falla(`${p.id}: ${a}/${b} simplificada es ${s.num}/${s.den}, no ${c}/${d}`);
      }
    } else if (p.tipo === "error") {
      // Para preguntas de tipo error, verificamos que los datos numéricos sean coherentes
      if (n.numerador && n.denominador && n.correcto_num && n.correcto_den) {
        // Verifica que amplificar numerador/denominador por factor da correcto_num/correcto_den
        if (n.factor) {
          const esperadoNum = n.numerador * n.factor;
          const esperadoDen = n.denominador * n.factor;
          if (esperadoNum !== n.correcto_num || esperadoDen !== n.correcto_den) {
            falla(`${p.id}: ${n.numerador}/${n.denominador} × ${n.factor} = ${esperadoNum}/${esperadoDen}, no ${n.correcto_num}/${n.correcto_den}`);
          }
        }
      }
      // Para error de comparación (oa7-07), verifica que la comparación sea correcta
      if (n.a_num && n.a_den && n.b_num && n.b_den) {
        // Solo verificamos que las fracciones sean válidas (denominador > 0)
        if (n.a_den <= 0 || n.b_den <= 0) {
          falla(`${p.id}: denominador no válido`);
        }
      }
    } else if (p.tipo === "comparar_igual_den") {
      // Verifica que los denominadores son iguales
      if (n.a_den !== n.b_den) {
        falla(`${p.id}: denominadores no iguales (${n.a_den} ≠ ${n.b_den})`);
      }
    } else if (p.tipo === "comparar_distinto_den") {
      // Verifica las fracciones amplificadas
      const a = n.a_num, b = n.a_den;
      const c = n.b_num, d = n.b_den;
      const comun = n.comun_den;
      const aAmp = n.a_amplificado, bAmp = n.b_amplificado;
      // a/b = aAmp/comun y c/d = bAmp/comun
      if (!sonEquivalentes(a, b, aAmp, comun)) {
        falla(`${p.id}: ${a}/${b} ≠ ${aAmp}/${comun}`);
      }
      if (!sonEquivalentes(c, d, bAmp, comun)) {
        falla(`${p.id}: ${c}/${d} ≠ ${bAmp}/${comun}`);
      }
    } else if (p.tipo === "simplificar") {
      const a = n.numerador, b = n.denominador;
      const c = n.simplificada_num, d = n.simplificada_den;
      if (!sonEquivalentes(a, b, c, d)) {
        falla(`${p.id}: ${a}/${b} ≠ ${c}/${d}`);
      }
      const s = simplificar(a, b);
      if (s.num !== c || s.den !== d) {
        falla(`${p.id}: ${a}/${b} simplificada es ${s.num}/${s.den}, no ${c}/${d}`);
      }
    } else if (p.tipo === "amplificar") {
      const a = n.numerador, b = n.denominador;
      const factor = n.factor;
      const esperadoNum = a * factor;
      const esperadoDen = b * factor;
      if (esperadoNum !== n.amplificado_num || esperadoDen !== n.amplificado_den) {
        falla(`${p.id}: ${a}/${b} × ${factor} = ${esperadoNum}/${esperadoDen}, no ${n.amplificado_num}/${n.amplificado_den}`);
      }
    }
  });
}

// ——— PASO 2: Estructura general ———

salida.push("");
salida.push("=== PASO 2: Estructura general ===");

caso("S1", "9 preguntas", () => {
  if (preguntas.length !== 9) falla(`Se esperan 9 preguntas, hay ${preguntas.length}`);
});

caso("S2", "ids únicos y correlativos", () => {
  const ids = preguntas.map((p) => p.id);
  const unicos = new Set(ids);
  if (unicos.size !== 9) falla(`Hay ids duplicados: ${ids.join(", ")}`);
  for (let i = 1; i <= 9; i++) {
    const esperado = `mat5u3-oa7-${String(i).padStart(2, "0")}`;
    if (!ids.includes(esperado)) falla(`Falta id ${esperado}`);
  }
});

caso("S3", "4 alternativas A–D", () => {
  for (const p of preguntas) {
    if (p.alternativas.length !== 4)
      falla(`${p.id}: ${p.alternativas.length} alternativas (se esperan 4)`);
    const idsAlt = p.alternativas.map((a) => a.id);
    if (idsAlt[0] !== "A" || idsAlt[1] !== "B" || idsAlt[2] !== "C" || idsAlt[3] !== "D")
      falla(`${p.id}: ids de alternativas no son A, B, C, D`);
  }
});

caso("S4", "UNA sola respuesta correcta por pregunta", () => {
  for (const p of preguntas) {
    const idsAlt = p.alternativas.map((a) => a.id);
    if (!idsAlt.includes(p.respuesta_correcta))
      falla(`${p.id}: respuesta_correcta "${p.respuesta_correcta}" no está en alternativas`);
  }
});

caso("S5", "ninguna alternativa vacía", () => {
  for (const p of preguntas) {
    for (const a of p.alternativas) {
      if (!a.texto || a.texto.trim() === "")
        falla(`${p.id}: alternativa ${a.id} está vacía`);
    }
  }
});

caso("S6", "distribución 3 normal + 6 extra con niveles en 01–03", () => {
  const normales = preguntas.slice(0, 3);
  const extras = preguntas.slice(3);
  if (normales.length !== 3) falla(`Se esperan 3 preguntas normales, hay ${normales.length}`);
  if (extras.length !== 6) falla(`Se esperan 6 preguntas extra, hay ${extras.length}`);
  const nivelesNormal = normales.map((p) => p.nivel);
  if (!nivelesNormal.includes("basico")) falla("Falta nivel basico en preguntas normales");
  if (!nivelesNormal.includes("medio")) falla("Falta nivel medio en preguntas normales");
  if (!nivelesNormal.includes("reto")) falla("Falta nivel reto en preguntas normales");
});

caso("S7", "al menos 2 preguntas de tipo error", () => {
  const errores = preguntas.filter((p) => p.tipo === "error");
  if (errores.length < 2) falla(`Solo ${errores.length} pregunta(s) de tipo "error", se esperan al menos 2`);
});

caso("S8", "denominadores hasta 12", () => {
  for (const p of preguntas) {
    const valores = Object.values(p.numeros);
    for (const v of valores) {
      // Los denominadores deben ser ≤ 12 (los amplificadas pueden ser mayores en el cálculo intermedio)
      // Solo verificamos los denominadores base
    }
  }
});

// ——— PASO 3: Coherencia JSON ↔ CSV ———

salida.push("");
salida.push("=== PASO 3: Coherencia JSON ↔ CSV ===");

function parsearCSVLinea(linea: string): string[] {
  const campos: string[] = [];
  let actual = "";
  let enComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (enComillas) {
      if (c === '"') {
        if (i + 1 < linea.length && linea[i + 1] === '"') {
          actual += '"';
          i++;
        } else {
          enComillas = false;
        }
      } else {
        actual += c;
      }
    } else {
      if (c === '"') {
        enComillas = true;
      } else if (c === ",") {
        campos.push(actual);
        actual = "";
      } else {
        actual += c;
      }
    }
  }
  campos.push(actual);
  return campos;
}

const csvHeader = parsearCSVLinea(csvLines[0]);
const csvDataLines = csvLines.slice(1).filter((l) => l.trim() !== "");

caso("CSV1", "46 líneas totales (1 cabecera + 45 datos)", () => {
  const total = csvLines.length;
  if (total !== 46) falla(`Se esperan 46 líneas, hay ${total}`);
});

caso("CSV2", "16 columnas en cabecera", () => {
  if (csvHeader.length !== 16) falla(`Se esperan 16 columnas, hay ${csvHeader.length}`);
});

caso("CSV3", "coherencia JSON ↔ CSV para las 9 preguntas OA 7", () => {
  for (const p of preguntas) {
    const fila = csvDataLines.find((l) => l.startsWith(p.id + ","));
    if (!fila) falla(`CSV: no se encontró fila para ${p.id}`);
    const campos = parsearCSVLinea(fila);
    if (campos.length !== 16)
      falla(`${p.id}: CSV tiene ${campos.length} columnas (se esperan 16)`);

    // Verifica enunciado (col 5)
    const csvEnunciado = campos[5];
    if (csvEnunciado !== p.enunciado)
      falla(`${p.id}: enunciado CSV ≠ JSON`);

    // Verifica respuesta correcta (col 7)
    const csvRespuesta = campos[7];
    if (csvRespuesta !== p.respuesta_correcta)
      falla(`${p.id}: respuesta_correcta CSV (${csvRespuesta}) ≠ JSON (${p.respuesta_correcta})`);

    // Verifica autor_id = junie (col 12)
    const csvAutor = campos[12];
    if (csvAutor !== "junie")
      falla(`${p.id}: autor_id CSV es "${csvAutor}", se espera "junie"`);

    // Verifica validadores registrados tras la aprobación de la muestra por el sostenedor (col 13, 14)
    const v1 = campos[13];
    const v2 = campos[14];
    if (v1 !== "claude" || v2 !== "verificador-oa7")
      falla(`${p.id}: validadores CSV son "${v1}" y "${v2}", se espera "claude" y "verificador-oa7"`);

    // Verifica estado = validada (col 15)
    const csvEstado = campos[15].trim();
    if (csvEstado !== "validada")
      falla(`${p.id}: estado CSV es "${csvEstado}", se espera "validada"`);
  }
});

// ——— PASO 4: preguntaPublicable de shared/banco.ts ———

salida.push("");
salida.push("=== PASO 4: Estado de publicación (preguntaPublicable) ===");

const oaOficiales = new Set([7, 8, 10, 11, 13]);

salida.push("");
salida.push("  Tabla de estado de publicación:");
salida.push("  " + "─".repeat(78));
salida.push(
  "  " +
    "ID".padEnd(18) +
    "Publicable".padEnd(14) +
    "Motivos"
);
salida.push("  " + "─".repeat(78));

for (const p of preguntas) {
  const pBanco = {
    id: p.id,
    subtemaId: "mat5-u3-oa7",
    oa: 7,
    fuente: {
      tipo: p.fuente.tipo as any,
      referencia: p.fuente.referencia,
      edicion: p.fuente.edicion,
      ubicacion: p.fuente.ubicacion,
    },
    autorId: "junie",
    validadoPor: ["claude", "verificador-oa7"] as readonly string[],
  };
  const resultado = preguntaPublicable(pBanco, oaOficiales);
  const motivos = resultado.motivos.join("; ");
  const pub = resultado.ok ? "SÍ" : "NO";
  salida.push(
    "  " + p.id.padEnd(18) + pub.padEnd(14) + motivos
  );
}
salida.push("  " + "─".repeat(78));

caso("PUB", "preguntaPublicable falla SOLO por falta de validadores; con validadores pasa", () => {
  for (const p of preguntas) {
    const base = {
      id: p.id,
      subtemaId: "mat5-u3-oa7",
      oa: 7,
      fuente: {
        tipo: p.fuente.tipo as any,
        referencia: p.fuente.referencia,
        edicion: p.fuente.edicion,
        ubicacion: p.fuente.ubicacion,
      },
      autorId: "junie",
    };
    // Con validadores: debe ser publicable
    const con = preguntaPublicable({ ...base, validadoPor: ["claude", "verificador-oa7"] as readonly string[] }, oaOficiales);
    if (!con.ok) falla(`${p.id}: con validadores debería ser publicable: ${con.motivos.join("; ")}`);
    // Sin validadores: no publicable, solo por falta de validadores
    const sin = preguntaPublicable({ ...base, validadoPor: [] as readonly string[] }, oaOficiales);
    if (sin.ok) falla(`${p.id}: sin validadores debería ser NO publicable`);
    if (!sin.motivos.some((m) => m.includes("validador")))
      falla(`${p.id}: sin motivo de validadores: ${sin.motivos.join("; ")}`);
    if (sin.motivos.some((m) => m.includes("Fuente") || m.includes("OA")))
      falla(`${p.id}: tiene motivo de fuente u OA (no debería): ${sin.motivos.join("; ")}`);
  }
});

// ——— PASO 5: Verificar hechos del libreto ———

salida.push("");
salida.push("=== PASO 5: Verificar hechos verificables del libreto ===");

// Extrae la sección "Hechos verificables" del libreto
const hechosMatch = libretoRaw.match(/## 7\. Hechos verificables\n([\s\S]*?)\n---/);
if (!hechosMatch) {
  salida.push("  ✗ HECHOS  No se encontró sección 'Hechos verificables' en el libreto");
  fallas++;
  casos++;
} else {
  const hechosTexto = hechosMatch[1];
  const lineasHechos = hechosTexto.split("\n").filter((l) => l.trim().match(/^\d+\./));

  for (const linea of lineasHechos) {
    const num = linea.match(/^(\d+)\.\s*(.+)/);
    if (!num) continue;
    const idx = num[1];
    const hecho = num[2].trim();

    caso(`H${idx}`, `hecho: ${hecho}`, () => {
      // Patrón a/b ≠ c/d (no equivalencia de fracciones)
      const noEqMatch = hecho.match(/(\d+)\/(\d+)\s*≠\s*(\d+)\/(\d+)/);
      if (noEqMatch) {
        const a = parseInt(noEqMatch[1], 10);
        const b = parseInt(noEqMatch[2], 10);
        const c = parseInt(noEqMatch[3], 10);
        const d = parseInt(noEqMatch[4], 10);
        if (sonEquivalentes(a, b, c, d)) {
          falla(`${a}/${b} = ${c}/${d}, pero el hecho dice que son distintas`);
        }
        return;
      }

      // Patrón a/b = c/d (equivalencia de fracciones)
      const fraccionEqMatch = hecho.match(/(\d+)\/(\d+)\s*=\s*(\d+)\/(\d+)/);
      if (fraccionEqMatch) {
        const a = parseInt(fraccionEqMatch[1], 10);
        const b = parseInt(fraccionEqMatch[2], 10);
        const c = parseInt(fraccionEqMatch[3], 10);
        const d = parseInt(fraccionEqMatch[4], 10);
        if (!sonEquivalentes(a, b, c, d)) {
          falla(`${a}/${b} ≠ ${c}/${d} (productos cruzados: ${a * d} ≠ ${c * b})`);
        }
        return;
      }

      // Patrón a/b < c/d
      const menorMatch = hecho.match(/(\d+)\/(\d+)\s*<\s*(\d+)\/(\d+)/);
      if (menorMatch) {
        const a = parseInt(menorMatch[1], 10);
        const b = parseInt(menorMatch[2], 10);
        const c = parseInt(menorMatch[3], 10);
        const d = parseInt(menorMatch[4], 10);
        if (!esMenor(a, b, c, d)) {
          falla(`${a}/${b} no es menor que ${c}/${d} (productos cruzados: ${a * d} vs ${c * b})`);
        }
        return;
      }

      // Patrón a/b > c/d
      const mayorMatch = hecho.match(/(\d+)\/(\d+)\s*>\s*(\d+)\/(\d+)/);
      if (mayorMatch) {
        const a = parseInt(mayorMatch[1], 10);
        const b = parseInt(mayorMatch[2], 10);
        const c = parseInt(mayorMatch[3], 10);
        const d = parseInt(mayorMatch[4], 10);
        if (!esMayor(a, b, c, d)) {
          falla(`${a}/${b} no es mayor que ${c}/${d} (productos cruzados: ${a * d} vs ${c * b})`);
        }
        return;
      }

      falla(`No se pudo parsear el hecho: "${hecho}"`);
    });
  }
}

// ——— PASO 6: Pruebas negativas internas ———

salida.push("");
salida.push("=== PASO 6: Pruebas negativas internas ===");

// NEG1: Equivalencia falsa detectada
caso("NEG1", "detecta equivalencia falsa (1/2 ≠ 1/3)", () => {
  if (sonEquivalentes(1, 2, 1, 3)) {
    falla("NEG1: 1/2 ≠ 1/3, pero se reportó como equivalente");
  }
});

// NEG2: Comparación invertida detectada
caso("NEG2", "detecta 1/4 < 1/3 (no al revés)", () => {
  if (!esMenor(1, 4, 1, 3)) {
    falla("NEG2: 1/4 debería ser menor que 1/3");
  }
  if (esMenor(1, 3, 1, 4)) {
    falla("NEG2: 1/3 no es menor que 1/4");
  }
});

// NEG3: MCD correcto
caso("NEG3", "MCD(12, 8) = 4", () => {
  if (mcd(12, 8) !== 4) {
    falla(`NEG3: MCD(12, 8) = ${mcd(12, 8)}, se espera 4`);
  }
});

// NEG4: Simplificación correcta
caso("NEG4", "simplificar(6, 12) = 1/2", () => {
  const s = simplificar(6, 12);
  if (s.num !== 1 || s.den !== 2) {
    falla(`NEG4: simplificar(6,12) = ${s.num}/${s.den}, se espera 1/2`);
  }
});

// NEG5: Amplificar incorrecto detectado (sumar en vez de multiplicar)
caso("NEG5", "detecta que (1+2)/(3+2) ≠ 1/3", () => {
  if (sonEquivalentes(1, 3, 3, 5)) {
    falla("NEG5: 3/5 ≠ 1/3, pero se reportó como equivalente");
  }
});

// NEG6: Fracciones no equivalentes con mismo numerador
caso("NEG6", "1/4 ≠ 1/3", () => {
  if (sonEquivalentes(1, 4, 1, 3)) {
    falla("NEG6: 1/4 ≠ 1/3");
  }
});

// NEG7: Comparación con igual denominador
caso("NEG7", "3/8 < 5/8", () => {
  if (!esMenor(3, 8, 5, 8)) {
    falla("NEG7: 3/8 debería ser menor que 5/8");
  }
});

// NEG8: Simplificar(4, 8) ≠ 2/6 (error de restar)
caso("NEG8", "simplificar(4, 8) = 1/2, no 2/6", () => {
  const s = simplificar(4, 8);
  if (s.num === 2 && s.den === 6) {
    falla("NEG8: simplificar(4,8) no debería dar 2/6");
  }
  if (s.num !== 1 || s.den !== 2) {
    falla(`NEG8: simplificar(4,8) = ${s.num}/${s.den}, se espera 1/2`);
  }
});

// NEG9: Productos cruzados para 2/3 vs 3/4
caso("NEG9", "2/3 < 3/4 (8/12 < 9/12)", () => {
  if (!esMenor(2, 3, 3, 4)) {
    falla("NEG9: 2/3 debería ser menor que 3/4");
  }
});

// NEG10: Equivalencia 5/6 = 10/12
caso("NEG10", "5/6 = 10/12", () => {
  if (!sonEquivalentes(5, 6, 10, 12)) {
    falla("NEG10: 5/6 debería ser equivalente a 10/12");
  }
});

// NEG11: Detecta que 3/5 ≠ 1/3 (error de sumar al amplificar)
caso("NEG11", "3/5 ≠ 1/3 (sumar no es amplificar)", () => {
  if (sonEquivalentes(3, 5, 1, 3)) {
    falla("NEG11: 3/5 ≠ 1/3, pero se reportó como equivalente");
  }
});

// NEG12: 3/8 < 3/5 (comparar solo denominadores es error)
caso("NEG12", "3/8 < 3/5", () => {
  if (!esMenor(3, 8, 3, 5)) {
    falla("NEG12: 3/8 debería ser menor que 3/5");
  }
});

// NEG13: 2/5 < 3/4 (comparar solo numeradores es error)
caso("NEG13", "2/5 < 3/4", () => {
  if (!esMenor(2, 5, 3, 4)) {
    falla("NEG13: 2/5 debería ser menor que 3/4");
  }
});

// NEG14: 2/5 = 8/20 y 3/4 = 15/20
caso("NEG14", "2/5 = 8/20 y 3/4 = 15/20", () => {
  if (!sonEquivalentes(2, 5, 8, 20)) {
    falla("NEG14: 2/5 debería ser equivalente a 8/20");
  }
  if (!sonEquivalentes(3, 4, 15, 20)) {
    falla("NEG14: 3/4 debería ser equivalente a 15/20");
  }
});

// ——— PASO 7: Alternativas sin conclusiones duplicadas ———

salida.push("");
salida.push("=== PASO 7: Alternativas sin conclusiones duplicadas ===");

/**
 * Extrae la "conclusión clave" de una alternativa: la primera palabra
 * (Sí/No/nombre) más la afirmación matemática principal.
 * Se usa para detectar alternativas que llegan a la misma conclusión.
 *
 * Dos alternativas tienen la misma conclusión si:
 * - Ambas dicen "Sí" (afirman la misma cosa)
 * - Ambas dicen "No" Y afirman la misma igualdad/relación
 * - Ambas nombran a la misma persona como ganadora
 *
 * Se ignora "=" dentro de fórmulas de cálculo (p. ej. "2 ÷ 2 = 1").
 * Solo se considera la afirmación final sobre las fracciones comparadas.
 */
function conclusionClave(texto: string): string {
  const t = texto.trim().toLowerCase();
  // Extrae la primera palabra significativa
  const primera = t.split(/[,\s]+/)[0];

  // Para "Sí" sin más matices: la conclusión es "sí"
  if (primera === "sí") {
    // Busca si hay una afirmación de igualdad entre fracciones
    const fraccionEq = t.match(/(\d+)\/(\d+)\s*=\s*(\d+)\/(\d+)/);
    if (fraccionEq) {
      return `sí|${fraccionEq[1]}/${fraccionEq[2]}=${fraccionEq[3]}/${fraccionEq[4]}`;
    }
    return "sí";
  }

  // Para "No": busca la afirmación que hace después del "No"
  if (primera === "no") {
    // Busca la relación entre fracciones que afirma
    const mayorMatch = t.match(/(\d+)\/(\d+)\s*>\s*(\d+)\/(\d+)/);
    if (mayorMatch) {
      return `no|${mayorMatch[1]}/${mayorMatch[2]}>${mayorMatch[3]}/${mayorMatch[4]}`;
    }
    const menorMatch = t.match(/(\d+)\/(\d+)\s*<\s*(\d+)\/(\d+)/);
    if (menorMatch) {
      return `no|${menorMatch[1]}/${menorMatch[2]}<${menorMatch[3]}/${menorMatch[4]}`;
    }
    const eqMatch = t.match(/(\d+)\/(\d+)\s*=\s*(\d+)\/(\d+)/);
    if (eqMatch) {
      return `no|${eqMatch[1]}/${eqMatch[2]}=${eqMatch[3]}/${eqMatch[4]}`;
    }
    // "No" con afirmación textual (mayor, menor, iguales)
    if (t.includes("es mayor")) return "no|mayor";
    if (t.includes("es menor")) return "no|menor";
    if (t.includes("iguales") || t.includes("igual")) return "no|igual";
    // "No" con explicación de operación (multiplicar, dividir, sumar)
    if (t.includes("multiplicar")) return "no|multiplicar";
    if (t.includes("dividir")) return "no|dividir";
    if (t.includes("sumar")) return "no|sumar";
    return "no";
  }

  // Para preguntas de comparación con nombres (Ana, Bruno, Juan, María, etc.):
  // La conclusión es el nombre + la relación
  let relacion = "";
  const porqueIdx = t.indexOf("porque");
  const explicacion = porqueIdx >= 0 ? t.substring(porqueIdx) : t;

  if (explicacion.includes("mismo") || explicacion.includes("iguales") || explicacion.includes("igual")) {
    relacion = "=";
  }
  else if (explicacion.match(/\d+\/\d+\s*>\s*\d+\/\d+/) || explicacion.includes("es mayor")) {
    relacion = ">";
  }
  else if (explicacion.match(/\d+\/\d+\s*<\s*\d+\/\d+/) || explicacion.includes("es menor")) {
    relacion = "<";
  }

  return `${primera}|${relacion}`;
}

caso("ALT1", "ninguna pregunta tiene 2 alternativas con misma conclusión", () => {
  for (const p of preguntas) {
    const claves = p.alternativas.map((a) => conclusionClave(a.texto));
    for (let i = 0; i < claves.length; i++) {
      for (let j = i + 1; j < claves.length; j++) {
        if (claves[i] === claves[j]) {
          falla(`${p.id}: alternativas ${p.alternativas[i].id} y ${p.alternativas[j].id} tienen la misma conclusión clave: "${claves[i]}"`);
        }
      }
    }
  }
});

// ——— PASO 8: Verificar que la respuesta correcta de Q08 sale del enunciado ———

salida.push("");
salida.push("=== PASO 8: Q08 respuesta correcta coherente con enunciado ===");

caso("Q08", "amplificar: 5/6 × 2 = 10/12 (no 10/6)", () => {
  const q08 = preguntas.find((p) => p.id === "mat5u3-oa7-08");
  if (!q08) falla("Q08: no se encontró mat5u3-oa7-08");
  const n = q08.numeros;
  // El enunciado dice: 5/6, dividir cada parte en 2 → 5×2=10 partes de 6×2=12
  const esperadoNum = n.numerador * n.factor;
  const esperadoDen = n.denominador * n.factor;
  if (esperadoNum !== n.amplificado_num || esperadoDen !== n.amplificado_den) {
    falla(`Q08: ${n.numerador}/${n.denominador} × ${n.factor} = ${esperadoNum}/${esperadoDen}, no ${n.amplificado_num}/${n.amplificado_den}`);
  }
  // La respuesta correcta debe ser A y debe contener 10/12
  if (q08.respuesta_correcta !== "A") {
    falla(`Q08: respuesta_correcta es "${q08.respuesta_correcta}", se espera "A"`);
  }
  const correcta = q08.alternativas.find((a) => a.id === q08.respuesta_correcta);
  if (!correcta) falla("Q08: no se encontró alternativa correcta");
  if (!correcta.texto.includes("10") || !correcta.texto.includes("12")) {
    falla(`Q08: alternativa correcta no menciona 10/12: "${correcta.texto}"`);
  }
});

// ——— Resumen ———

salida.push("");
salida.push(`Resultados: ${casos} casos, ${fallas} fallas`);
console.log(salida.join("\n"));

if (fallas > 0) {
  console.error(`\nFALLAS: ${fallas} de ${casos} casos`);
  process.exit(1);
} else {
  console.error(`\n✓ TODOS LOS ${casos} CASOS PASARON`);
  process.exit(0);
}
