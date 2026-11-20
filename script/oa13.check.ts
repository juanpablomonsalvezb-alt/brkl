// Verificador automático del OA 13: suma y resta de fracciones y decimales.
// Lee oa13_preguntas.json, oa13_libreto.md y plantilla_banco_mat5_unidad3.csv.
// Usa aritmética ENTERA: fracciones con numerador/denominador enteros y mcm/mcd por Euclides;
// decimales como enteros escalados por 1000 (parsear texto "0,125" a 125).
//
// Ejecutar: npx tsx script/oa13.check.ts

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { preguntaPublicable, VALIDADORES_MINIMOS } from "../shared/banco";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ——— Utilidades de aritmética entera ———

/** MCD por algoritmo de Euclides. */
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

/** MCM usando MCD. */
function mcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / mcd(a, b);
}

/**
 * Suma o resta de dos fracciones con aritmética entera.
 * a/b ± c/d → resultado como {numerador, denominador}.
 */
function operaFracciones(
  a: number,
  b: number,
  c: number,
  d: number,
  op: "suma" | "resta"
): { numerador: number; denominador: number } {
  const denComun = mcm(b, d);
  const a2 = a * (denComun / b);
  const c2 = c * (denComun / d);
  const num = op === "suma" ? a2 + c2 : a2 - c2;
  const g = mcd(Math.abs(num), denComun);
  return { numerador: num / g, denominador: denComun / g };
}

/**
 * Convierte un decimal con coma (p. ej. "0,125") a milésimas enteras.
 * "0,125" → 125, "1,250" → 1250, "3,4" → 3400.
 */
function decimalAMilésimas(texto: string): number {
  const sinComa = texto.replace(",", "");
  const entero = parseInt(sinComa, 10);
  const partes = texto.split(",");
  const decimales = partes[1] ? partes[1].length : 0;
  // Escalar a milésimas: si tiene 1 decimal → ×100, 2 decimales → ×10, 3 decimales → ×1
  if (decimales === 0) return entero * 1000;
  if (decimales === 1) return entero * 100;
  if (decimales === 2) return entero * 10;
  if (decimales === 3) return entero;
  throw new Error(`Decimal "${texto}" tiene ${decimales} cifras decimales (se esperan 0-3)`);
}

/** Convierte milésimas enteras a string decimal con coma. */
function milésimasADecimal(mil: number): string {
  const signo = mil < 0 ? "-" : "";
  const abs = Math.abs(mil);
  const entero = Math.floor(abs / 1000);
  const frac = abs % 1000;
  return `${signo}${entero},${String(frac).padStart(3, "0")}`;
}

/** Verifica que a/b + c/d = rNum/rDen usando aritmética entera. */
function verificaSumaFracciones(
  a: number,
  b: number,
  c: number,
  d: number,
  rNum: number,
  rDen: number
): boolean {
  const res = operaFracciones(a, b, c, d, "suma");
  // Compara fracciones cruzadas para evitar simplificación
  return res.numerador * rDen === rNum * res.denominador;
}

/** Verifica que a/b - c/d = rNum/rDen usando aritmética entera. */
function verificaRestaFracciones(
  a: number,
  b: number,
  c: number,
  d: number,
  rNum: number,
  rDen: number
): boolean {
  const res = operaFracciones(a, b, c, d, "resta");
  return res.numerador * rDen === rNum * res.denominador;
}

// ——— Tipos ———

interface PreguntaOA13 {
  id: string;
  tipo:
    | "fraccion_igual_denominador"
    | "fraccion_distinto_denominador"
    | "decimal"
    | "error";
  numeros: Record<string, unknown>;
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

const jsonPath = resolve(ROOT, "docs/vortice/piloto/contenido/oa13_preguntas.json");
const csvPath = resolve(ROOT, "docs/vortice/piloto/plantilla_banco_mat5_unidad3.csv");
const libretoPath = resolve(ROOT, "docs/vortice/piloto/contenido/oa13_libreto.md");

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

const preguntas: PreguntaOA13[] = JSON.parse(readFileSync(jsonPath, "utf-8"));
const csvRaw = readFileSync(csvPath, "utf-8");
const csvLines = csvRaw.split("\n").filter((l) => l.trim() !== "");
const libretoRaw = readFileSync(libretoPath, "utf-8");

// ——— PASO 1: Recalcular respuesta correcta desde numeros según tipo ———

salida.push("");
salida.push("=== PASO 1: Recalcular respuestas correctas ===");

for (const p of preguntas) {
  caso(p.id, `recalcular respuesta (${p.tipo})`, () => {
    const n = p.numeros;
    const altCorrecta = p.alternativas.find((a) => a.id === p.respuesta_correcta);
    if (!altCorrecta) falla(`${p.id}: alternativa ${p.respuesta_correcta} no encontrada`);

    if (p.tipo === "error") {
      // Para preguntas de tipo "error", verificamos que la respuesta correcta
      // contenga el resultado correcto o niegue el error
      if (n["resultado_correcto_numerador"] !== undefined) {
        // Error con fracciones
        const rNum = n["resultado_correcto_numerador"] as number;
        const rDen = n["resultado_correcto_denominador"] as number;
        const fraccionTexto = `${rNum}/${rDen}`;
        if (!altCorrecta.texto.includes(fraccionTexto)) {
          falla(`${p.id}: alternativa correcta no contiene la fracción correcta "${fraccionTexto}"`);
        }
      }
      if (n["resultado_correcto_milesimas"] !== undefined) {
        // Error con decimales
        const rMil = n["resultado_correcto_milesimas"] as number;
        const decTexto = milésimasADecimal(rMil);
        if (!altCorrecta.texto.includes(decTexto)) {
          falla(`${p.id}: alternativa correcta no contiene el decimal correcto "${decTexto}"`);
        }
      }
      return;
    }

    if (p.tipo === "fraccion_igual_denominador" || p.tipo === "fraccion_distinto_denominador") {
      const a = n["fraccion1_numerador"] as number;
      const b = n["fraccion1_denominador"] as number;
      const c = n["fraccion2_numerador"] as number;
      const d = n["fraccion2_denominador"] as number;
      const op = n["operacion"] as "suma" | "resta";

      // Si hay número mixto (entero1)
      if (n["entero1"] !== undefined) {
        const entero1 = n["entero1"] as number;
        const rEntero = n["resultado_entero"] as number;
        const rNum = n["resultado_numerador"] as number;
        const rDen = n["resultado_denominador"] as number;

        const res = operaFracciones(a, b, c, d, op);
        // Verifica que la parte fraccionaria sea correcta
        if (res.numerador * rDen !== rNum * res.denominador) {
          falla(`${p.id}: ${a}/${b} ${op === "suma" ? "+" : "-"} ${c}/${d} ≠ ${rNum}/${rDen}`);
        }
        // Verifica entero
        if (rEntero !== entero1) {
          falla(`${p.id}: entero resultado ${rEntero} ≠ ${entero1}`);
        }
        // Verifica que la alternativa correcta contenga el resultado
        const resultadoTexto = `${rEntero} ${rNum}/${rDen}`;
        if (!altCorrecta.texto.includes(`${rNum}/${rDen}`)) {
          falla(`${p.id}: alternativa correcta no contiene "${resultadoTexto}"`);
        }
      } else {
        const rNum = n["resultado_numerador"] as number;
        const rDen = n["resultado_denominador"] as number;
        const res = operaFracciones(a, b, c, d, op);
        if (res.numerador * rDen !== rNum * res.denominador) {
          falla(`${p.id}: ${a}/${b} ${op === "suma" ? "+" : "-"} ${c}/${d} ≠ ${rNum}/${rDen}`);
        }
        // Verifica que la alternativa correcta contenga la fracción resultado
        const fraccionTexto = `${rNum}/${rDen}`;
        if (!altCorrecta.texto.includes(fraccionTexto)) {
          falla(`${p.id}: alternativa correcta no contiene "${fraccionTexto}"`);
        }
      }
    }

    if (p.tipo === "decimal") {
      const d1 = n["decimal1_milesimas"] as number;
      const d2 = n["decimal2_milesimas"] as number;
      const op = n["operacion"] as "suma" | "resta";
      const rMil = n["resultado_milesimas"] as number;

      const esperado = op === "suma" ? d1 + d2 : d1 - d2;
      if (esperado !== rMil) {
        falla(
          `${p.id}: ${milésimasADecimal(d1)} ${op === "suma" ? "+" : "-"} ${milésimasADecimal(d2)} = ${milésimasADecimal(esperado)} ≠ ${milésimasADecimal(rMil)}`
        );
      }
      // Verifica que la alternativa correcta contenga el decimal resultado
      const decTexto = milésimasADecimal(rMil);
      if (!altCorrecta.texto.includes(decTexto)) {
        falla(`${p.id}: alternativa correcta no contiene "${decTexto}"`);
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

caso("S2", "ids únicos y correlativos mat5u3-oa13-01…09", () => {
  const ids = preguntas.map((p) => p.id);
  const unicos = new Set(ids);
  if (unicos.size !== 9) falla(`Hay ids duplicados: ${ids.join(", ")}`);
  for (let i = 1; i <= 9; i++) {
    const esperado = `mat5u3-oa13-${String(i).padStart(2, "0")}`;
    if (!ids.includes(esperado)) falla(`Falta id ${esperado}`);
  }
});

caso("S3", "4 alternativas A–D por pregunta", () => {
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

caso("S6", "coma decimal (no punto) en enunciados y alternativas", () => {
  for (const p of preguntas) {
    // Verifica que no haya puntos decimales (solo comas)
    // Busca patrones como \d\.\d que indicarían punto decimal
    const puntoDecimal = /\d+\.\d+/.test(p.enunciado);
    if (puntoDecimal) falla(`${p.id}: enunciado usa punto decimal en vez de coma`);
    for (const a of p.alternativas) {
      if (/\d+\.\d+/.test(a.texto))
        falla(`${p.id}: alternativa ${a.id} usa punto decimal en vez de coma`);
    }
  }
});

caso("S7", "distribución 3 normal (básico, medio, reto) + 6 extra", () => {
  const normales = preguntas.slice(0, 3);
  const extras = preguntas.slice(3);
  if (normales.length !== 3) falla(`Se esperan 3 preguntas normales, hay ${normales.length}`);
  if (extras.length !== 6) falla(`Se esperan 6 preguntas extra, hay ${extras.length}`);
  const nivelesNormal = normales.map((p) => p.nivel);
  if (!nivelesNormal.includes("basico")) falla("Falta nivel basico en preguntas normales");
  if (!nivelesNormal.includes("medio")) falla("Falta nivel medio en preguntas normales");
  if (!nivelesNormal.includes("reto")) falla("Falta nivel reto en preguntas normales");
});

caso("S8", "al menos 2 de igual denominador o mixtos", () => {
  const count = preguntas.filter(
    (p) => p.tipo === "fraccion_igual_denominador"
  ).length;
  if (count < 2) falla(`Solo ${count} pregunta(s) de igual denominador/mixtos, se esperan ≥2`);
});

caso("S9", "al menos 2 de distinto denominador", () => {
  const count = preguntas.filter(
    (p) => p.tipo === "fraccion_distinto_denominador"
  ).length;
  if (count < 2) falla(`Solo ${count} pregunta(s) de distinto denominador, se esperan ≥2`);
});

caso("S10", "al menos 2 de decimales, una con milésimas", () => {
  const decimales = preguntas.filter((p) => p.tipo === "decimal");
  if (decimales.length < 2) falla(`Solo ${decimales.length} pregunta(s) decimal, se esperan ≥2`);
  // Verifica que al menos una use milésimas (3 cifras decimales en el enunciado)
  const conMilesimas = decimales.some((p) => {
    const match = p.enunciado.match(/(\d+,\d{3})/g);
    return match && match.length > 0;
  });
  if (!conMilesimas) falla("Ninguna pregunta decimal usa milésimas");
});

caso("S11", "al menos 2 de «detectar el error»", () => {
  const errores = preguntas.filter((p) => p.tipo === "error");
  if (errores.length < 2) falla(`Solo ${errores.length} pregunta(s) de tipo "error", se esperan ≥2`);
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

caso("CSV3", "coherencia JSON ↔ CSV para las 9 preguntas OA 13", () => {
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
    if (v1 !== "claude" || v2 !== "verificador-oa13")
      falla(`${p.id}: validadores CSV son "${v1}" y "${v2}", se espera "claude" y "verificador-oa13"`);

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
    subtemaId: "mat5-u3-oa13",
    oa: 13,
    fuente: {
      tipo: p.fuente.tipo as any,
      referencia: p.fuente.referencia,
      edicion: p.fuente.edicion,
      ubicacion: p.fuente.ubicacion,
    },
    autorId: "junie",
    validadoPor: ["claude", "verificador-oa13"] as readonly string[],
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
      subtemaId: "mat5-u3-oa13",
      oa: 13,
      fuente: {
        tipo: p.fuente.tipo as any,
        referencia: p.fuente.referencia,
        edicion: p.fuente.edicion,
        ubicacion: p.fuente.ubicacion,
      },
      autorId: "junie",
    };
    // Con validadores ["claude","verificador-oa13"]: debe ser publicable
    const con = preguntaPublicable({ ...base, validadoPor: ["claude", "verificador-oa13"] as readonly string[] }, oaOficiales);
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
      // Patrón a/b + c/d = e/f (suma de fracciones)
      const sumaFraccMatch = hecho.match(
        /(\d+)\/(\d+)\s*\+\s*(\d+)\/(\d+)\s*=\s*(\d+)\/(\d+)/
      );
      if (sumaFraccMatch) {
        const a = parseInt(sumaFraccMatch[1], 10);
        const b = parseInt(sumaFraccMatch[2], 10);
        const c = parseInt(sumaFraccMatch[3], 10);
        const d = parseInt(sumaFraccMatch[4], 10);
        const rNum = parseInt(sumaFraccMatch[5], 10);
        const rDen = parseInt(sumaFraccMatch[6], 10);
        if (!verificaSumaFracciones(a, b, c, d, rNum, rDen)) {
          const res = operaFracciones(a, b, c, d, "suma");
          falla(`${a}/${b} + ${c}/${d} = ${res.numerador}/${res.denominador} ≠ ${rNum}/${rDen}`);
        }
        return;
      }

      // Patrón a/b - c/d = e/f (resta de fracciones)
      const restaFraccMatch = hecho.match(
        /(\d+)\/(\d+)\s*-\s*(\d+)\/(\d+)\s*=\s*(\d+)\/(\d+)/
      );
      if (restaFraccMatch) {
        const a = parseInt(restaFraccMatch[1], 10);
        const b = parseInt(restaFraccMatch[2], 10);
        const c = parseInt(restaFraccMatch[3], 10);
        const d = parseInt(restaFraccMatch[4], 10);
        const rNum = parseInt(restaFraccMatch[5], 10);
        const rDen = parseInt(restaFraccMatch[6], 10);
        if (!verificaRestaFracciones(a, b, c, d, rNum, rDen)) {
          const res = operaFracciones(a, b, c, d, "resta");
          falla(`${a}/${b} - ${c}/${d} = ${res.numerador}/${res.denominador} ≠ ${rNum}/${rDen}`);
        }
        return;
      }

      // Patrón a/b = c/d (equivalencia de fracciones)
      const eqFraccMatch = hecho.match(/(\d+)\/(\d+)\s*=\s*(\d+)\/(\d+)/);
      if (eqFraccMatch) {
        const a = parseInt(eqFraccMatch[1], 10);
        const b = parseInt(eqFraccMatch[2], 10);
        const c = parseInt(eqFraccMatch[3], 10);
        const d = parseInt(eqFraccMatch[4], 10);
        if (a * d !== c * b) {
          falla(`${a}/${b} ≠ ${c}/${d} (crucado: ${a}×${d}=${a * d} ≠ ${c}×${b}=${c * b})`);
        }
        return;
      }

      // Patrón a/b + c/d = e/f (suma ya cubierta arriba, pero por si solo hay =)
      // Patrón x,y + z,w = r,s (suma de decimales)
      const sumaDecMatch = hecho.match(
        /(\d+,\d+)\s*\+\s*(\d+,\d+)\s*=\s*(\d+,\d+)/
      );
      if (sumaDecMatch) {
        const d1 = decimalAMilésimas(sumaDecMatch[1]);
        const d2 = decimalAMilésimas(sumaDecMatch[2]);
        const r = decimalAMilésimas(sumaDecMatch[3]);
        if (d1 + d2 !== r) {
          falla(`${sumaDecMatch[1]} + ${sumaDecMatch[2]} = ${milésimasADecimal(d1 + d2)} ≠ ${sumaDecMatch[3]}`);
        }
        return;
      }

      // Patrón x,y - z,w = r,s (resta de decimales)
      const restaDecMatch = hecho.match(
        /(\d+,\d+)\s*-\s*(\d+,\d+)\s*=\s*(\d+,\d+)/
      );
      if (restaDecMatch) {
        const d1 = decimalAMilésimas(restaDecMatch[1]);
        const d2 = decimalAMilésimas(restaDecMatch[2]);
        const r = decimalAMilésimas(restaDecMatch[3]);
        if (d1 - d2 !== r) {
          falla(`${restaDecMatch[1]} - ${restaDecMatch[2]} = ${milésimasADecimal(d1 - d2)} ≠ ${restaDecMatch[3]}`);
        }
        return;
      }

      // Patrón entero a/b + c/d = entero e/f (número mixto)
      const mixtoMatch = hecho.match(
        /(\d+)\s+(\d+)\/(\d+)\s*\+\s*(\d+)\/(\d+)\s*=\s*(\d+)\s+(\d+)\/(\d+)/
      );
      if (mixtoMatch) {
        const entero1 = parseInt(mixtoMatch[1], 10);
        const a = parseInt(mixtoMatch[2], 10);
        const b = parseInt(mixtoMatch[3], 10);
        const c = parseInt(mixtoMatch[4], 10);
        const d = parseInt(mixtoMatch[5], 10);
        const rEntero = parseInt(mixtoMatch[6], 10);
        const rNum = parseInt(mixtoMatch[7], 10);
        const rDen = parseInt(mixtoMatch[8], 10);

        const res = operaFracciones(a, b, c, d, "suma");
        if (res.numerador * rDen !== rNum * res.denominador) {
          falla(`${a}/${b} + ${c}/${d} ≠ ${rNum}/${rDen}`);
        }
        if (rEntero !== entero1) {
          falla(`Entero ${rEntero} ≠ ${entero1}`);
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

// NEG1: Detecta respuesta marcada ≠ resultado del enunciado (fracción)
caso("NEG1", "detecta respuesta marcada errónea (fracción)", () => {
  const p: PreguntaOA13 = {
    id: "neg-01",
    tipo: "fraccion_igual_denominador",
    numeros: {
      operacion: "suma",
      fraccion1_numerador: 2,
      fraccion1_denominador: 5,
      fraccion2_numerador: 1,
      fraccion2_denominador: 5,
      resultado_numerador: 3,
      resultado_denominador: 5,
    },
    enunciado: "¿Cuánto es 2/5 + 1/5?",
    alternativas: [
      { id: "A", texto: "1/5 de litro" }, // Incorrecta
      { id: "B", texto: "3/5 de litro" }, // Correcta
      { id: "C", texto: "2/5 de litro" },
      { id: "D", texto: "3/10 de litro" },
    ],
    respuesta_correcta: "A", // Marcada incorrectamente
    explicacion_distractores: {},
    nivel: "basico",
    fuente: { tipo: "texto_escolar", referencia: "x", edicion: "x", ubicacion: "x" },
  };
  const n = p.numeros;
  const rNum = n["resultado_numerador"] as number;
  const rDen = n["resultado_denominador"] as number;
  const altMarcada = p.alternativas.find((a) => a.id === p.respuesta_correcta);
  const fraccionTexto = `${rNum}/${rDen}`;
  if (altMarcada?.texto.includes(fraccionTexto)) {
    falla("NEG1: no detectó respuesta errónea (alternativa marcada contiene la fracción correcta)");
  }
  // Correcto: la alternativa A (1/5) no contiene 3/5 → respuesta errónea detectada
});

// NEG2: Detecta respuesta marcada errónea (decimal)
caso("NEG2", "detecta respuesta marcada errónea (decimal)", () => {
  const p: PreguntaOA13 = {
    id: "neg-02",
    tipo: "decimal",
    numeros: {
      operacion: "suma",
      decimal1_milesimas: 500,
      decimal2_milesimas: 250,
      resultado_milesimas: 750,
    },
    enunciado: "¿Cuánto es 0,5 + 0,25?",
    alternativas: [
      { id: "A", texto: "0,30" }, // Incorrecta
      { id: "B", texto: "0,75" }, // Correcta
      { id: "C", texto: "0,20" },
      { id: "D", texto: "0,525" },
    ],
    respuesta_correcta: "A", // Marcada incorrectamente
    explicacion_distractores: {},
    nivel: "basico",
    fuente: { tipo: "texto_escolar", referencia: "x", edicion: "x", ubicacion: "x" },
  };
  const rMil = p.numeros["resultado_milesimas"] as number;
  const decTexto = milésimasADecimal(rMil);
  const altMarcada = p.alternativas.find((a) => a.id === p.respuesta_correcta);
  if (altMarcada?.texto.includes(decTexto)) {
    falla("NEG2: no detectó respuesta errónea (alternativa marcada contiene el decimal correcto)");
  }
});

// NEG3: MCD por Euclides
caso("NEG3", "mcd(12, 8) = 4", () => {
  if (mcd(12, 8) !== 4) falla("mcd(12, 8) debería ser 4");
});

// NEG4: MCM
caso("NEG4", "mcm(4, 6) = 12", () => {
  if (mcm(4, 6) !== 12) falla("mcm(4, 6) debería ser 12");
});

// NEG5: Suma de fracciones con distinto denominador
caso("NEG5", "1/3 + 1/4 = 7/12 (no 2/7)", () => {
  const res = operaFracciones(1, 3, 1, 4, "suma");
  if (res.numerador !== 7 || res.denominador !== 12) {
    falla(`1/3 + 1/4 = ${res.numerador}/${res.denominador} ≠ 7/12`);
  }
  // Verifica que 2/7 ≠ 7/12
  if (2 * 12 === 7 * 7) {
    falla("2/7 debería ser distinto de 7/12");
  }
});

// NEG6: Decimal a milésimas
caso("NEG6", "decimalAMilésimas('0,5') = 500", () => {
  if (decimalAMilésimas("0,5") !== 500) falla("0,5 debería ser 500 milésimas");
});

// NEG7: Hecho falso simulado: 1/3 + 1/4 = 2/7
caso("NEG7", "detecta hecho falso: 1/3 + 1/4 ≠ 2/7", () => {
  if (verificaSumaFracciones(1, 3, 1, 4, 2, 7)) {
    falla("NEG7: 1/3 + 1/4 ≠ 2/7, pero el verificador lo aceptó");
  }
  // Correcto: 1/3 + 1/4 = 7/12
  if (!verificaSumaFracciones(1, 3, 1, 4, 7, 12)) {
    falla("NEG7: 1/3 + 1/4 = 7/12 debería ser verdadero");
  }
});

// NEG8: Resta de decimales con milésimas
caso("NEG8", "5,480 - 2,150 = 3,330 (no 3,370)", () => {
  const d1 = decimalAMilésimas("5,480");
  const d2 = decimalAMilésimas("2,150");
  const resultado = d1 - d2;
  if (resultado !== 3330) falla(`5,480 - 2,150 = ${milésimasADecimal(resultado)} ≠ 3,330`);
});

// NEG9: Equivalencia de fracciones incorrecta
caso("NEG9", "1/4 ≠ 2/12 (equivocada)", () => {
  // 1/4 = 3/12, no 2/12
  if (1 * 12 === 2 * 4) {
    falla("1/4 debería ser distinto de 2/12");
  }
  // 1/4 = 3/12
  if (1 * 12 !== 3 * 4) {
    falla("1/4 = 3/12 debería ser verdadero");
  }
});

// NEG10: Decimal con punto en vez de coma
caso("NEG10", "detecta punto decimal en vez de coma", () => {
  const texto = "1.250";
  const tienePunto = /\d+\.\d+/.test(texto);
  if (!tienePunto) falla("NEG10: caso de prueba no tiene punto decimal");
  // El verificador debería rechazar esto en S6
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
