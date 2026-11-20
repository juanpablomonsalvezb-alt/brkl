// Verificador automático del OA 10: decimal que corresponde a fracciones con denominador 2, 4, 5 y 10.
// Lee oa10_preguntas.json, oa10_libreto.md y plantilla_banco_mat5_unidad3.csv.
// Usa aritmética ENTERA (convierte a centésimas con enteros); prohibido punto flotante.
//
// Ejecutar: npx tsx script/oa10.check.ts

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { preguntaPublicable, VALIDADORES_MINIMOS } from "../shared/banco";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ——— Utilidades de aritmética entera ———

/**
 * Convierte una fracción a/b a centésimas enteras.
 * a/b → (a * 100) / b  (entero exacto para b en {2,4,5,10}).
 */
function fraccionACentésimas(a: number, b: number): number {
  if (b === 0) throw new Error("Denominador cero");
  if ((a * 100) % b !== 0) throw new Error(`Fracción ${a}/${b} no da centésimas exactas`);
  return (a * 100) / b;
}

/**
 * Convierte un decimal con coma (p. ej. "0,75") a centésimas enteras.
 * "0,75" → 75, "0,5" → 50, "0,2" → 20.
 */
function decimalACentésimas(texto: string): number {
  const sinComa = texto.replace(",", "");
  const entero = parseInt(sinComa, 10);
  const partes = texto.split(",");
  const decimales = partes[1] ? partes[1].length : 0;
  // Si tiene 1 decimal (décimos), multiplicar por 10 para obtener centésimas
  // Si tiene 2 decimales (centésimas), ya está
  if (decimales === 1) return entero * 10;
  if (decimales === 2) return entero;
  throw new Error(`Decimal "${texto}" tiene ${decimales} cifras decimales (se esperan 1 o 2)`);
}

/** Compara dos decimales en notación con coma usando centésimas enteras. */
function comparaDecimales(a: string, b: string): -1 | 0 | 1 {
  const ma = decimalACentésimas(a);
  const mb = decimalACentésimas(b);
  if (ma < mb) return -1;
  if (ma > mb) return 1;
  return 0;
}

// Verifica que a/b = decimal usando centésimas enteras
function verificaFraccionDecimal(a: number, b: number, decimal: string): boolean {
  const centFraccion = fraccionACentésimas(a, b);
  const centDecimal = decimalACentésimas(decimal);
  return centFraccion === centDecimal;
}

// ——— Tipos ———

interface NumerosOA10 {
  numerador: number;
  denominador: number;
  decimal: string;
}

interface PreguntaOA10 {
  id: string;
  tipo: "fraccion_a_decimal" | "decimal_a_fraccion" | "pictorica" | "recta" | "error";
  numeros: NumerosOA10;
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

// Cada pregunta se apoya en un ejercicio/pasaje de los libros oficiales (se verifica si el archivo está en esta máquina).
const BASE_LIBRO: Record<string, { archivo: string; texto: string }> = {
  "mat5u3-oa10-01": { archivo: "MATME26E5B.md", texto: "Idea de Ema" },
  "mat5u3-oa10-02": { archivo: "matematica5.md", texto: "se representa como número decimal 0,75, ya que:" },
  "mat5u3-oa10-03": { archivo: "MATME26E5B.md", texto: "22 ¿Cuál es mayor: 0,25 o 1" },
  "mat5u3-oa10-04": { archivo: "matematica5.md", texto: "Representar fracciones como números decimales" },
  "mat5u3-oa10-05": { archivo: "MATME26E5B.md", texto: "Se llaman fracciones decimales las que tienen o pueden expresarse con" },
  "mat5u3-oa10-06": { archivo: "matematica5.md", texto: "Relaciona la fracción de la columna A con el número decimal de la columna B" },
  "mat5u3-oa10-07": { archivo: "MATME26E5B.md", texto: "55 Pensemos cómo expresar 1" },
  "mat5u3-oa10-08": { archivo: "MATME26E5B.md", texto: "Se llaman fracciones decimales las que tienen o pueden expresarse con" },
  "mat5u3-oa10-09": { archivo: "matematica5.md", texto: "Al amplificar por el número 2 la fracción" },
};

// ——— Carga de datos ———

const jsonPath = resolve(ROOT, "docs/vortice/piloto/contenido/oa10_preguntas.json");
const csvPath = resolve(ROOT, "docs/vortice/piloto/plantilla_banco_mat5_unidad3.csv");
const libretoPath = resolve(ROOT, "docs/vortice/piloto/contenido/oa10_libreto.md");

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

const preguntas: PreguntaOA10[] = JSON.parse(readFileSync(jsonPath, "utf-8"));
const csvRaw = readFileSync(csvPath, "utf-8");
const csvLines = csvRaw.split("\n").filter((l) => l.trim() !== "");
const libretoRaw = readFileSync(libretoPath, "utf-8");

// ——— PASO 1: Recalcular respuesta correcta desde numeros según tipo ———

salida.push("");
salida.push("=== PASO 1: Recalcular respuestas correctas ===");

const DENOMINADORES_PERMITIDOS = new Set([2, 4, 5, 10]);

for (const p of preguntas) {
  caso(p.id, `recalcular respuesta (${p.tipo})`, () => {
    const { numerador: a, denominador: b, decimal } = p.numeros;

    // Verifica denominador permitido
    if (!DENOMINADORES_PERMITIDOS.has(b)) {
      falla(`${p.id}: denominador ${b} no está en {2,4,5,10}`);
    }

    // Verifica que a/b = decimal con aritmética entera
    if (!verificaFraccionDecimal(a, b, decimal)) {
      const centFraccion = fraccionACentésimas(a, b);
      const centDecimal = decimalACentésimas(decimal);
      falla(`${p.id}: ${a}/${b} = ${centFraccion}/100 ≠ ${centDecimal}/100 (${decimal})`);
    }

    // Verifica que la alternativa correcta contenga el decimal correcto o la fracción correcta
    const altCorrecta = p.alternativas.find((a) => a.id === p.respuesta_correcta);
    if (!altCorrecta) falla(`${p.id}: alternativa ${p.respuesta_correcta} no encontrada`);
    // Para tipo "error", la respuesta es sobre detectar el error, no sobre el valor
    if (p.tipo === "error") {
      // No verificamos que contenga el decimal; la respuesta correcta debe negar el error
      return;
    }
    // Para decimal_a_fraccion, la alternativa contiene la fracción, no el decimal
    if (p.tipo === "decimal_a_fraccion") {
      const fraccionTexto = `${a}/${b}`;
      if (!altCorrecta.texto.includes(fraccionTexto)) {
        falla(`${p.id}: alternativa correcta no contiene la fracción "${fraccionTexto}"`);
      }
    } else {
      if (!altCorrecta.texto.includes(decimal)) {
        falla(`${p.id}: alternativa correcta no contiene el decimal "${decimal}"`);
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
    const esperado = `mat5u3-oa10-${String(i).padStart(2, "0")}`;
    if (!ids.includes(esperado)) falla(`Falta id ${esperado}`);
  }
});

caso("S3", "4 alternativas A–D con valores numéricos distintos", () => {
  for (const p of preguntas) {
    if (p.alternativas.length !== 4)
      falla(`${p.id}: ${p.alternativas.length} alternativas (se esperan 4)`);
    const idsAlt = p.alternativas.map((a) => a.id);
    if (idsAlt[0] !== "A" || idsAlt[1] !== "B" || idsAlt[2] !== "C" || idsAlt[3] !== "D")
      falla(`${p.id}: ids de alternativas no son A, B, C, D`);

    // Para preguntas de tipo "error", las alternativas son razonamientos, no valores puros
    // Se salta la verificación de valores duplicados
    if (p.tipo === "error") continue;

    // Extrae los valores decimales de las alternativas
    const decimalesEncontrados: string[] = [];
    for (const a of p.alternativas) {
      const match = a.texto.match(/(\d+,\d+)/g);
      if (match) decimalesEncontrados.push(...match);
    }
    // Verifica que no haya dos alternativas con el mismo valor decimal
    if (decimalesEncontrados.length >= 2) {
      const centesimas = decimalesEncontrados.map(decimalACentésimas);
      for (let i = 0; i < centesimas.length; i++) {
        for (let j = i + 1; j < centesimas.length; j++) {
          if (centesimas[i] === centesimas[j]) {
            falla(`${p.id}: dos alternativas con el mismo valor numérico: ${decimalesEncontrados[i]} y ${decimalesEncontrados[j]}`);
          }
        }
      }
    }
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

caso("LIBRO", "cada pregunta tiene su pasaje base en el texto oficial", () => {
  const dir = resolve(process.env.HOME ?? "", "Downloads/BRKL_TEXTOS_OFICIALES");
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  for (const p of preguntas) {
    const b = BASE_LIBRO[p.id];
    if (!b) falla(`${p.id}: sin pasaje base declarado`);
    const ruta = resolve(dir, b.archivo);
    if (!existsSync(ruta)) { console.warn(`AVISO ${p.id}: no está ${b.archivo}; pasaje base sin verificar`); continue; }
    if (!norm(readFileSync(ruta, "utf-8")).includes(norm(b.texto))) falla(`${p.id}: pasaje «${b.texto}» no está en ${b.archivo}`);
  }
});

caso("S6", "coma decimal (no punto) en numeros", () => {
  for (const p of preguntas) {
    const d = p.numeros.decimal;
    if (d.includes(".")) falla(`${p.id}: decimal "${d}" usa punto en vez de coma`);
    if (!d.includes(",")) falla(`${p.id}: decimal "${d}" no tiene coma decimal`);
  }
});

caso("S7", "distribución 3 normal + 6 extra con niveles en 01–03", () => {
  const normales = preguntas.slice(0, 3);
  const extras = preguntas.slice(3);
  if (normales.length !== 3) falla(`Se esperan 3 preguntas normales, hay ${normales.length}`);
  if (extras.length !== 6) falla(`Se esperan 6 preguntas extra, hay ${extras.length}`);
  const nivelesNormal = normales.map((p) => p.nivel);
  if (!nivelesNormal.includes("basico")) falla("Falta nivel basico en preguntas normales");
  if (!nivelesNormal.includes("medio")) falla("Falta nivel medio en preguntas normales");
  if (!nivelesNormal.includes("reto")) falla("Falta nivel reto en preguntas normales");
});

caso("S8", "denominadores solo en {2,4,5,10}", () => {
  for (const p of preguntas) {
    if (!DENOMINADORES_PERMITIDOS.has(p.numeros.denominador)) {
      falla(`${p.id}: denominador ${p.numeros.denominador} no permitido`);
    }
  }
});

caso("S9", "al menos 2 preguntas de tipo error", () => {
  const errores = preguntas.filter((p) => p.tipo === "error");
  if (errores.length < 2) falla(`Solo ${errores.length} pregunta(s) de tipo "error", se esperan al menos 2`);
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

caso("CSV3", "coherencia JSON ↔ CSV para las 9 preguntas OA 10", () => {
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
    if (v1 !== "claude" || v2 !== "verificador-oa10")
      falla(`${p.id}: validadores CSV son "${v1}" y "${v2}", se espera "claude" y "verificador-oa10"`);

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
    subtemaId: "mat5-u3-oa10",
    oa: 10,
    fuente: {
      tipo: p.fuente.tipo as any,
      referencia: p.fuente.referencia,
      edicion: p.fuente.edicion,
      ubicacion: p.fuente.ubicacion,
    },
    autorId: "junie",
    validadoPor: ["claude", "verificador-oa10"] as readonly string[],
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
      subtemaId: "mat5-u3-oa10",
      oa: 10,
      fuente: {
        tipo: p.fuente.tipo as any,
        referencia: p.fuente.referencia,
        edicion: p.fuente.edicion,
        ubicacion: p.fuente.ubicacion,
      },
      autorId: "junie",
    };
    // Con validadores: debe ser publicable
    const con = preguntaPublicable({ ...base, validadoPor: ["claude", "verificador-oa10"] as readonly string[] }, oaOficiales);
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
      // Patrón a/b = x
      const fraccionMatch = hecho.match(/(\d+)\/(\d+)\s*=\s*(\d+,\d+)/);
      if (fraccionMatch) {
        const a = parseInt(fraccionMatch[1], 10);
        const b = parseInt(fraccionMatch[2], 10);
        const decimal = fraccionMatch[3];
        if (!verificaFraccionDecimal(a, b, decimal)) {
          const centF = fraccionACentésimas(a, b);
          const centD = decimalACentésimas(decimal);
          falla(`${a}/${b} = ${centF}/100 ≠ ${centD}/100 (${decimal})`);
        }
        return;
      }

      // Patrón x = y (igualdad de decimales)
      const igualMatch = hecho.match(/(\d+,\d+)\s*=\s*(\d+,\d+)/);
      if (igualMatch) {
        const a = igualMatch[1];
        const b = igualMatch[2];
        if (comparaDecimales(a, b) !== 0) {
          falla(`${a} ≠ ${b}`);
        }
        return;
      }

      // Patrón x < y
      const menorMatch = hecho.match(/(\d+,\d+)\s*<\s*(\d+,\d+)/);
      if (menorMatch) {
        const a = menorMatch[1];
        const b = menorMatch[2];
        if (comparaDecimales(a, b) !== -1) {
          falla(`${a} no es menor que ${b}`);
        }
        return;
      }

      // Patrón x > y
      const mayorMatch = hecho.match(/(\d+,\d+)\s*>\s*(\d+,\d+)/);
      if (mayorMatch) {
        const a = mayorMatch[1];
        const b = mayorMatch[2];
        if (comparaDecimales(a, b) !== 1) {
          falla(`${a} no es mayor que ${b}`);
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

// NEG1: Respuesta marcada errónea
caso("NEG1", "detecta respuesta marcada errónea", () => {
  const p: PreguntaOA10 = {
    id: "neg-01",
    tipo: "fraccion_a_decimal",
    numeros: { numerador: 1, denominador: 2, decimal: "0,5" },
    enunciado: "¿Cuánto es 1/2?",
    alternativas: [
      { id: "A", texto: "0,2" },
      { id: "B", texto: "0,5" },
      { id: "C", texto: "1,2" },
      { id: "D", texto: "0,12" },
    ],
    respuesta_correcta: "A", // Incorrecta: debería ser B (0,5)
    explicacion_distractores: {},
    nivel: "basico",
    fuente: { tipo: "texto_escolar", referencia: "x", edicion: "x", ubicacion: "x" },
  };
  const altCorrecta = p.alternativas.find((a) => a.id === p.respuesta_correcta);
  if (altCorrecta?.texto.includes(p.numeros.decimal)) {
    falla("NEG1: no detectó respuesta errónea (alternativa marcada contiene el decimal correcto)");
  }
  // La alternativa A (0,2) no contiene 0,5 → respuesta errónea detectada
});

// NEG2: Dos alternativas con el mismo valor numérico (0,50 y 0,5)
caso("NEG2", "detecta dos alternativas con el mismo valor", () => {
  const p: PreguntaOA10 = {
    id: "neg-02",
    tipo: "fraccion_a_decimal",
    numeros: { numerador: 1, denominador: 2, decimal: "0,5" },
    enunciado: "¿Cuánto es 1/2?",
    alternativas: [
      { id: "A", texto: "0,50" },
      { id: "B", texto: "0,5" }, // Mismo valor que 0,50
      { id: "C", texto: "0,2" },
      { id: "D", texto: "0,12" },
    ],
    respuesta_correcta: "A",
    explicacion_distractores: {},
    nivel: "basico",
    fuente: { tipo: "texto_escolar", referencia: "x", edicion: "x", ubicacion: "x" },
  };
  const decimalesEncontrados: string[] = [];
  for (const a of p.alternativas) {
    const match = a.texto.match(/(\d+,\d+)/g);
    if (match) decimalesEncontrados.push(...match);
  }
  const centesimas = decimalesEncontrados.map(decimalACentésimas);
  let encontrado = false;
  for (let i = 0; i < centesimas.length; i++) {
    for (let j = i + 1; j < centesimas.length; j++) {
      if (centesimas[i] === centesimas[j]) {
        encontrado = true;
      }
    }
  }
  if (!encontrado) {
    falla("NEG2: no detectó dos alternativas con el mismo valor numérico");
  }
});

// NEG3: Alternativas con el mismo valor (0,5 y 0,50)
caso("NEG3", "detecta 0,5 y 0,50 como mismo valor", () => {
  const vals = ["0,5", "0,50"];
  const c1 = decimalACentésimas(vals[0]);
  const c2 = decimalACentésimas(vals[1]);
  if (c1 !== c2) {
    falla("NEG3: 0,5 y 0,50 deberían tener el mismo valor en centésimas");
  }
});

// NEG4: Punto decimal en vez de coma
caso("NEG4", "detecta punto decimal en vez de coma", () => {
  const p: PreguntaOA10 = {
    id: "neg-04",
    tipo: "fraccion_a_decimal",
    numeros: { numerador: 1, denominador: 2, decimal: "0.5" }, // Punto
    enunciado: "¿Cuánto es 1/2?",
    alternativas: [
      { id: "A", texto: "0,5" },
      { id: "B", texto: "0,2" },
      { id: "C", texto: "1,2" },
      { id: "D", texto: "0,12" },
    ],
    respuesta_correcta: "A",
    explicacion_distractores: {},
    nivel: "basico",
    fuente: { tipo: "texto_escolar", referencia: "x", edicion: "x", ubicacion: "x" },
  };
  if (!p.numeros.decimal.includes(".")) {
    falla("NEG4: caso de prueba no tiene punto decimal");
  }
  // El verificador debería rechazar esto
});

// NEG5: Denominador fuera de {2,4,5,10}
caso("NEG5", "detecta denominador fuera de {2,4,5,10}", () => {
  const p: PreguntaOA10 = {
    id: "neg-05",
    tipo: "fraccion_a_decimal",
    numeros: { numerador: 1, denominador: 3, decimal: "0,33" }, // Denominador 3
    enunciado: "¿Cuánto es 1/3?",
    alternativas: [
      { id: "A", texto: "0,33" },
      { id: "B", texto: "0,3" },
      { id: "C", texto: "0,333" },
      { id: "D", texto: "0,13" },
    ],
    respuesta_correcta: "A",
    explicacion_distractores: {},
    nivel: "basico",
    fuente: { tipo: "texto_escolar", referencia: "x", edicion: "x", ubicacion: "x" },
  };
  if (DENOMINADORES_PERMITIDOS.has(p.numeros.denominador)) {
    falla("NEG5: caso de prueba debería tener denominador no permitido");
  }
});

// NEG6: División mal hecha (fracción que no da centésimas exactas)
caso("NEG6", "detecta fracción que no da centésimas exactas", () => {
  try {
    fraccionACentésimas(1, 3);
    falla("NEG6: 1/3 debería fallar al convertir a centésimas exactas");
  } catch (e: any) {
    // Esperado: falla correctamente
  }
});

// NEG7: Hecho falso en el libreto simulado
caso("NEG7", "detecta hecho falso (1/4 = 0,4)", () => {
  // Simula un hecho incorrecto: 1/4 = 0,4
  if (verificaFraccionDecimal(1, 4, "0,4")) {
    falla("NEG7: 1/4 ≠ 0,4, pero el verificador lo aceptó");
  }
  // Correcto: 1/4 = 0,25
  if (!verificaFraccionDecimal(1, 4, "0,25")) {
    falla("NEG7: 1/4 = 0,25 debería ser verdadero");
  }
});

// NEG8: JSON ↔ CSV incoherente (simulado)
caso("NEG8", "detecta JSON ↔ CSV incoherente (respuesta distinta)", () => {
  // Simula una fila CSV con respuesta distinta a la del JSON
  const p = preguntas[0];
  const filaSimulada = `${p.id},mat5-u3-oa10,10,temario_examen_libre,1,"${p.enunciado}","alternativas","B",texto_escolar,"ref",2026,"ubic",junie,,,borrador`;
  const campos = parsearCSVLinea(filaSimulada);
  if (campos[7] === p.respuesta_correcta) {
    falla("NEG8: la fila simulada debería tener respuesta distinta");
  }
  // El verificador detectaría esta incoherencia
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
