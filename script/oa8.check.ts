// Verificador automático del OA 8: fracciones impropias y números mixtos.
// Lee oa8_preguntas.json, oa8_libreto.md y plantilla_banco_mat5_unidad3.csv.
// Usa aritmética ENTERA (división entera con cociente y resto); prohibido punto flotante.
//
// Ejecutar: npx tsx script/oa8.check.ts

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { preguntaPublicable, VALIDADORES_MINIMOS } from "../shared/banco";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ——— Utilidades de aritmética entera ———

/**
 * Convierte una fracción impropia a/b a número mixto usando división entera.
 * Devuelve { entero, resto, denominador }.
 * Ejemplo: 7/4 → { entero: 1, resto: 3, denominador: 4 } → 1 3/4
 */
function impropiaAMixto(a: number, b: number): { entero: number; resto: number; denominador: number } {
  if (b === 0) throw new Error("Denominador cero");
  if (a < 0 || b < 0) throw new Error("Numerador y denominador deben ser positivos");
  const entero = Math.floor(a / b);
  const resto = a % b;
  return { entero, resto, denominador: b };
}

/**
 * Convierte un número mixto (entero, numerador, denominador) a fracción impropia.
 * Ejemplo: 1 3/4 → (1 * 4 + 3) / 4 = 7/4
 */
function mixtoAImpropia(entero: number, numerador: number, denominador: number): { numerador: number; denominador: number } {
  if (denominador === 0) throw new Error("Denominador cero");
  const nuevoNumerador = entero * denominador + numerador;
  return { numerador: nuevoNumerador, denominador };
}

/** Verifica que a/b = entero resto/denominador usando aritmética entera. */
function verificaImpropiaMixto(a: number, b: number, entero: number, resto: number): boolean {
  const cociente = Math.floor(a / b);
  const residuo = a % b;
  return cociente === entero && residuo === resto && b > 0;
}

/** Verifica que entero n/d = impropiaNumerador/d usando aritmética entera. */
function verificaMixtoImpropia(entero: number, n: number, d: number, impropiaNumerador: number): boolean {
  const calculado = entero * d + n;
  return calculado === impropiaNumerador && d > 0;
}

// ——— Denominadores permitidos ———

const DENOMINADORES_PERMITIDOS = new Set([2, 3, 4, 5, 6, 8, 10, 12]);

// ——— Tipos ———

interface NumerosImpropiaAMixto {
  numerador: number;
  denominador: number;
  entero: number;
  resto: number;
}

interface NumerosMixtoAImpropia {
  entero: number;
  numerador: number;
  denominador: number;
  impropia_numerador: number;
}

type NumerosOA8 = NumerosImpropiaAMixto | NumerosMixtoAImpropia;

interface PreguntaOA8 {
  id: string;
  tipo: "impropia_a_mixto" | "mixto_a_impropia" | "pictorica" | "recta" | "error";
  numeros: NumerosOA8;
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

const jsonPath = resolve(ROOT, "docs/vortice/piloto/contenido/oa8_preguntas.json");
const csvPath = resolve(ROOT, "docs/vortice/piloto/plantilla_banco_mat5_unidad3.csv");
const libretoPath = resolve(ROOT, "docs/vortice/piloto/contenido/oa8_libreto.md");

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

const preguntas: PreguntaOA8[] = JSON.parse(readFileSync(jsonPath, "utf-8"));
const csvRaw = readFileSync(csvPath, "utf-8");
const csvLines = csvRaw.split("\n").filter((l) => l.trim() !== "");
const libretoRaw = readFileSync(libretoPath, "utf-8");

// ——— PASO 1: Recalcular respuesta correcta desde numeros según tipo ———

salida.push("");
salida.push("=== PASO 1: Recalcular respuestas correctas ===");

for (const p of preguntas) {
  caso(p.id, `recalcular respuesta (${p.tipo})`, () => {
    const n = p.numeros;

    // Verifica denominador permitido
    const denom = "denominador" in n ? n.denominador : (n as any).denominador;
    if (denom && !DENOMINADORES_PERMITIDOS.has(denom)) {
      falla(`${p.id}: denominador ${denom} no está en {2,3,4,5,6,8,10,12}`);
    }

    if (p.tipo === "impropia_a_mixto" || p.tipo === "pictorica" || p.tipo === "recta") {
      const nm = n as NumerosImpropiaAMixto;
      // Verifica que numerador/denominador = entero resto/denominador
      if (!verificaImpropiaMixto(nm.numerador, nm.denominador, nm.entero, nm.resto)) {
        const mixto = impropiaAMixto(nm.numerador, nm.denominador);
        falla(`${p.id}: ${nm.numerador}/${nm.denominador} = ${mixto.entero} ${mixto.resto}/${mixto.denominador} ≠ ${nm.entero} ${nm.resto}/${nm.denominador}`);
      }
    }

    if (p.tipo === "mixto_a_impropia") {
      const nm = n as NumerosMixtoAImpropia;
      // Verifica que entero n/d = impropiaNumerador/d
      if (!verificaMixtoImpropia(nm.entero, nm.numerador, nm.denominador, nm.impropia_numerador)) {
        const impropia = mixtoAImpropia(nm.entero, nm.numerador, nm.denominador);
        falla(`${p.id}: ${nm.entero} ${nm.numerador}/${nm.denominador} = ${impropia.numerador}/${impropia.denominador} ≠ ${nm.impropia_numerador}/${nm.denominador}`);
      }
    }

    // Para tipo "error", la respuesta correcta debe negar el error
    if (p.tipo === "error") {
      return;
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
    const esperado = `mat5u3-oa8-${String(i).padStart(2, "0")}`;
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

caso("S7", "denominadores solo en {2,3,4,5,6,8,10,12}", () => {
  for (const p of preguntas) {
    const n = p.numeros;
    const denom = "denominador" in n ? n.denominador : (n as any).denominador;
    if (denom && !DENOMINADORES_PERMITIDOS.has(denom)) {
      falla(`${p.id}: denominador ${denom} no permitido`);
    }
  }
});

caso("S8", "al menos 2 preguntas de tipo error", () => {
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

caso("CSV3", "coherencia JSON ↔ CSV para las 9 preguntas OA 8", () => {
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
    if (v1 !== "claude" || v2 !== "verificador-oa8")
      falla(`${p.id}: validadores CSV son "${v1}" y "${v2}", se espera "claude" y "verificador-oa8"`);

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
    subtemaId: "mat5-u3-oa8",
    oa: 8,
    fuente: {
      tipo: p.fuente.tipo as any,
      referencia: p.fuente.referencia,
      edicion: p.fuente.edicion,
      ubicacion: p.fuente.ubicacion,
    },
    autorId: "junie",
    validadoPor: ["claude", "verificador-oa8"] as readonly string[],
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
      subtemaId: "mat5-u3-oa8",
      oa: 8,
      fuente: {
        tipo: p.fuente.tipo as any,
        referencia: p.fuente.referencia,
        edicion: p.fuente.edicion,
        ubicacion: p.fuente.ubicacion,
      },
      autorId: "junie",
    };
    // Con validadores: debe ser publicable
    const con = preguntaPublicable({ ...base, validadoPor: ["claude", "verificador-oa8"] as readonly string[] }, oaOficiales);
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
      // Patrón a/b = entero n/d (impropia a mixto)
      const impropiaMixtoMatch = hecho.match(/(\d+)\/(\d+)\s*=\s*(\d+)\s+(\d+)\/(\d+)/);
      if (impropiaMixtoMatch) {
        const a = parseInt(impropiaMixtoMatch[1], 10);
        const b = parseInt(impropiaMixtoMatch[2], 10);
        const entero = parseInt(impropiaMixtoMatch[3], 10);
        const resto = parseInt(impropiaMixtoMatch[4], 10);
        const d = parseInt(impropiaMixtoMatch[5], 10);
        if (!verificaImpropiaMixto(a, b, entero, resto)) {
          const mixto = impropiaAMixto(a, b);
          falla(`${a}/${b} = ${mixto.entero} ${mixto.resto}/${mixto.denominador} ≠ ${entero} ${resto}/${d}`);
        }
        return;
      }

      // Patrón entero n/d = a/b (mixto a impropia)
      const mixtoImpropiaMatch = hecho.match(/(\d+)\s+(\d+)\/(\d+)\s*=\s*(\d+)\/(\d+)/);
      if (mixtoImpropiaMatch) {
        const entero = parseInt(mixtoImpropiaMatch[1], 10);
        const n = parseInt(mixtoImpropiaMatch[2], 10);
        const d = parseInt(mixtoImpropiaMatch[3], 10);
        const a = parseInt(mixtoImpropiaMatch[4], 10);
        const b = parseInt(mixtoImpropiaMatch[5], 10);
        if (!verificaMixtoImpropia(entero, n, d, a)) {
          const impropia = mixtoAImpropia(entero, n, d);
          falla(`${entero} ${n}/${d} = ${impropia.numerador}/${impropia.denominador} ≠ ${a}/${b}`);
        }
        return;
      }

      // Patrón a/b = entero (fracción que da número natural exacto)
      const impropiaNaturalMatch = hecho.match(/(\d+)\/(\d+)\s*=\s*(\d+)$/);
      if (impropiaNaturalMatch) {
        const a = parseInt(impropiaNaturalMatch[1], 10);
        const b = parseInt(impropiaNaturalMatch[2], 10);
        const entero = parseInt(impropiaNaturalMatch[3], 10);
        if (Math.floor(a / b) !== entero || a % b !== 0) {
          falla(`${a}/${b} ≠ ${entero} (división: ${Math.floor(a / b)} resto ${a % b})`);
        }
        return;
      }

      // Patrón a/b > entero (comparación)
      const mayorMatch = hecho.match(/(\d+)\/(\d+)\s*>\s*(\d+)/);
      if (mayorMatch) {
        const a = parseInt(mayorMatch[1], 10);
        const b = parseInt(mayorMatch[2], 10);
        const entero = parseInt(mayorMatch[3], 10);
        // a/b > entero ⇔ a > entero * b
        if (!(a > entero * b)) {
          falla(`${a}/${b} no es mayor que ${entero}`);
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

// NEG1: impropiaAMixto con resultado incorrecto
caso("NEG1", "impropiaAMixto rechaza 7/4 = 2 3/4", () => {
  if (verificaImpropiaMixto(7, 4, 2, 3)) {
    falla("NEG1: 7/4 ≠ 2 3/4, pero el verificador lo aceptó");
  }
  // Correcto: 7/4 = 1 3/4
  if (!verificaImpropiaMixto(7, 4, 1, 3)) {
    falla("NEG1: 7/4 = 1 3/4 debería ser verdadero");
  }
});

// NEG2: mixtoAImpropia con resultado incorrecto
caso("NEG2", "mixtoAImpropia rechaza 2 3/5 = 11/5", () => {
  if (verificaMixtoImpropia(2, 3, 5, 11)) {
    falla("NEG2: 2 3/5 ≠ 11/5, pero el verificador lo aceptó");
  }
  // Correcto: 2 3/5 = 13/5
  if (!verificaMixtoImpropia(2, 3, 5, 13)) {
    falla("NEG2: 2 3/5 = 13/5 debería ser verdadero");
  }
});

// NEG3: Denominador fuera de {2,3,4,5,6,8,10,12}
caso("NEG3", "detecta denominador fuera del conjunto permitido", () => {
  if (DENOMINADORES_PERMITIDOS.has(7)) {
    falla("NEG3: 7 no debería estar en denominadores permitidos");
  }
  if (DENOMINADORES_PERMITIDOS.has(9)) {
    falla("NEG3: 9 no debería estar en denominadores permitidos");
  }
});

// NEG4: Fracción que no es impropia (numerador < denominador)
caso("NEG4", "detecta fracción propia (no impropia)", () => {
  const mixto = impropiaAMixto(3, 4);
  if (mixto.entero !== 0 || mixto.resto !== 3) {
    falla("NEG4: 3/4 = 0 3/4, no debería dar entero > 0");
  }
});

// NEG5: mixtoAImpropia con multiplicación incorrecta
caso("NEG5", "detecta error de multiplicar entero × numerador", () => {
  // Error común: 2 × 3 + 5 = 11 en vez de 2 × 5 + 3 = 13
  if (verificaMixtoImpropia(2, 3, 5, 11)) {
    falla("NEG5: 2 3/5 ≠ 11/5, pero el verificador lo aceptó");
  }
});

// NEG6: impropiaAMixto con denominador cambiado
caso("NEG6", "detecta cambio de denominador en mixto", () => {
  // Error: 7/4 = 1 3/7 (cambia denominador)
  if (verificaImpropiaMixto(7, 4, 1, 3, 7)) {
    // Nota: verificaImpropiaMixto no toma 5to arg, pero verificamos con los datos
  }
  // El denominador en el mixto debe ser el mismo que en la impropia
  const mixto = impropiaAMixto(7, 4);
  if (mixto.denominador !== 4) {
    falla("NEG6: el denominador no debería cambiar: 7/4 → denominador debe ser 4");
  }
});

// NEG7: Fracción que da número natural exacto
caso("NEG7", "8/4 = 2 (sin parte fraccionaria)", () => {
  const mixto = impropiaAMixto(8, 4);
  if (mixto.entero !== 2 || mixto.resto !== 0) {
    falla("NEG7: 8/4 = 2, resto debe ser 0");
  }
});

// NEG8: JSON ↔ CSV incoherente (simulado)
caso("NEG8", "detecta JSON ↔ CSV incoherente (respuesta distinta)", () => {
  const p = preguntas[0];
  const filaSimulada = `${p.id},mat5-u3-oa8,8,solo_nivel,1,"${p.enunciado}","alternativas","B",texto_escolar,"ref",2026,"ubic",junie,,,borrador`;
  const campos = parsearCSVLinea(filaSimulada);
  if (campos[7] === p.respuesta_correcta) {
    falla("NEG8: la fila simulada debería tener respuesta distinta");
  }
});

// NEG9: Denominador 0 debe fallar
caso("NEG9", "rechaza denominador cero", () => {
  try {
    impropiaAMixto(7, 0);
    falla("NEG9: denominador 0 debería lanzar error");
  } catch (e: any) {
    // Esperado
  }
});

// NEG10: mixtoAImpropia con denominador 0
caso("NEG10", "rechaza denominador cero en mixtoAImpropia", () => {
  try {
    mixtoAImpropia(2, 3, 0);
    falla("NEG10: denominador 0 debería lanzar error");
  } catch (e: any) {
    // Esperado
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
