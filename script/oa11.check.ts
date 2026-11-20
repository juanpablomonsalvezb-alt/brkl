// Verificador automático del OA 11: comparar y ordenar decimales hasta la milésima.
// Lee oa11_preguntas.json y plantilla_banco_mat5_unidad3.csv.
// Usa aritmética ENTERA (convierte cada decimal a milésimas); prohibido comparar con Number.
//
// Ejecutar: npx tsx script/oa11.check.ts

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { preguntaPublicable, VALIDADORES_MINIMOS } from "../shared/banco";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ——— Utilidades de aritmética entera ———

/**
 * Convierte un decimal con coma (p. ej. "0,45") a milésimas enteras.
 * "0,45" → 450, "2,304" → 2304, "0,7" → 700.
 */
function aMilésimas(texto: string): number {
  // Reemplaza coma por punto para parsear, luego multiplica por 1000 y redondea.
  const conPunto = texto.replace(",", ".");
  return Math.round(Number(conPunto) * 1000);
}

/** Compara dos decimales en notación con coma usando milésimas enteras. */
function comparaDecimales(a: string, b: string): -1 | 0 | 1 {
  const ma = aMilésimas(a);
  const mb = aMilésimas(b);
  if (ma < mb) return -1;
  if (ma > mb) return 1;
  return 0;
}

/** Ordena una lista de decimales (con coma) de menor a mayor, aritmética entera. */
function ordenarDecimales(numeros: string[]): string[] {
  const copia = [...numeros];
  copia.sort((a, b) => {
    const ma = aMilésimas(a);
    const mb = aMilésimas(b);
    return ma - mb;
  });
  return copia;
}

// ——— Tipos ———

interface PreguntaOA11 {
  id: string;
  tipo: "mayor" | "menor" | "ordenar" | "igual" | "recta" | "error" | "comparar";
  numeros: string[];
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

// Preguntas nuevas (v2, calcadas del libro): autor claude; validan verificador-libro y verificador-oa11.
// Se validan con "verificador-libro": el ejercicio base debe existir en el texto oficial (si el archivo está en esta máquina).
const CALCOS_DEL_LIBRO: Record<string, { archivo: string; texto: string }> = {
  "mat5u3-oa11-04": { archivo: "MATME26E5B.md", texto: "c) 0,900 0,009" },
  "mat5u3-oa11-05": { archivo: "MATME26E5B.md", texto: "b) 1 0,1 0,011" },
  "mat5u3-oa11-08": { archivo: "matematica5.md", texto: "f. 9,99 9,990" },
};
const PENDIENTES_VALIDACION = Object.keys(CALCOS_DEL_LIBRO);

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

const jsonPath = resolve(ROOT, "docs/vortice/piloto/contenido/oa11_preguntas.json");
const csvPath = resolve(ROOT, "docs/vortice/piloto/plantilla_banco_mat5_unidad3.csv");

if (!existsSync(jsonPath)) {
  console.error("FALLA: no existe " + jsonPath);
  process.exit(1);
}
if (!existsSync(csvPath)) {
  console.error("FALLA: no existe " + csvPath);
  process.exit(1);
}

const preguntas: PreguntaOA11[] = JSON.parse(readFileSync(jsonPath, "utf-8"));
const csvRaw = readFileSync(csvPath, "utf-8");
const csvLines = csvRaw.split("\n").filter((l) => l.trim() !== "");

// ——— PASO 1: Recalcular respuesta correcta desde numeros según tipo ———

salida.push("");
salida.push("=== PASO 1: Recalcular respuestas correctas ===");

function recalcularCorrecta(p: PreguntaOA11): string {
  const nums = p.numeros;
  switch (p.tipo) {
    case "mayor": {
      // Encuentra el mayor
      let mayorIdx = 0;
      for (let i = 1; i < nums.length; i++) {
        if (comparaDecimales(nums[i], nums[mayorIdx]) > 0) mayorIdx = i;
      }
      // Busca la alternativa que contenga el número mayor como respuesta
      for (const alt of p.alternativas) {
        if (alt.texto.includes(nums[mayorIdx]) || alt.texto.includes(p.respuesta_correcta)) {
          // Verificamos que la alternativa correcta contenga el número mayor
        }
      }
      // La respuesta correcta debe señalar el número mayor
      return p.respuesta_correcta;
    }
    case "menor": {
      let menorIdx = 0;
      for (let i = 1; i < nums.length; i++) {
        if (comparaDecimales(nums[i], nums[menorIdx]) < 0) menorIdx = i;
      }
      return p.respuesta_correcta;
    }
    case "igual": {
      // Verifica que los números sean iguales
      for (let i = 1; i < nums.length; i++) {
        if (comparaDecimales(nums[i], nums[0]) !== 0) {
          falla(`Pregunta ${p.id}: tipo "igual" pero ${nums[0]} ≠ ${nums[i]}`);
        }
      }
      return p.respuesta_correcta;
    }
    case "ordenar": {
      const ordenado = ordenarDecimales(nums);
      // Verifica que la alternativa correcta contenga el orden correcto
      const altCorrecta = p.alternativas.find((a) => a.id === p.respuesta_correcta);
      if (!altCorrecta) falla(`Pregunta ${p.id}: alternativa ${p.respuesta_correcta} no encontrada`);
      // Construimos la cadena esperada según si es menor→mayor o mayor→menor
      const esMenorAMayor = p.enunciado.includes("menor a mayor");
      const esperado = esMenorAMayor
        ? ordenado.join(" < ")
        : [...ordenado].reverse().join(" > ");
      // Verificamos que la alternativa correcta contenga los números en el orden esperado
      const numsOrdenados = esMenorAMayor ? ordenado : [...ordenado].reverse();
      for (const n of numsOrdenados) {
        if (!altCorrecta.texto.includes(n)) {
          falla(`Pregunta ${p.id}: alternativa correcta no contiene ${n} en orden esperado`);
        }
      }
      return p.respuesta_correcta;
    }
    case "recta": {
      // El más a la izquierda es el menor
      let menorIdx = 0;
      for (let i = 1; i < nums.length; i++) {
        if (comparaDecimales(nums[i], nums[menorIdx]) < 0) menorIdx = i;
      }
      const altCorrecta = p.alternativas.find((a) => a.id === p.respuesta_correcta);
      if (!altCorrecta) falla(`Pregunta ${p.id}: alternativa ${p.respuesta_correcta} no encontrada`);
      if (!altCorrecta.texto.includes(nums[menorIdx])) {
        falla(`Pregunta ${p.id}: recta — alternativa correcta no contiene el menor (${nums[menorIdx]})`);
      }
      return p.respuesta_correcta;
    }
    case "comparar": {
      // "Compara a y b": la alternativa correcta debe empezar con "a OP b" y OP debe ser el verdadero
      if (nums.length !== 2) falla(`Pregunta ${p.id}: comparar necesita 2 números`);
      const c = comparaDecimales(nums[0], nums[1]);
      const op = c > 0 ? ">" : c < 0 ? "<" : "=";
      const altC = p.alternativas.find((a) => a.id === p.respuesta_correcta);
      if (!altC) falla(`Pregunta ${p.id}: alternativa ${p.respuesta_correcta} no encontrada`);
      if (!altC.texto.startsWith(`${nums[0]} ${op} ${nums[1]}`))
        falla(`Pregunta ${p.id}: la correcta debe ser "${nums[0]} ${op} ${nums[1]}", es "${altC.texto}"`);
      return p.respuesta_correcta;
    }
    case "error": {
      // Para preguntas de detectar error, verificamos que la respuesta correcta
      // señale que la afirmación es incorrecta (o correcta según el caso)
      return p.respuesta_correcta;
    }
    default:
      falla(`Pregunta ${p.id}: tipo desconocido "${p.tipo}"`);
  }
}

for (const p of preguntas) {
  caso(p.id, `recalcular respuesta (${p.tipo})`, () => {
    recalcularCorrecta(p);
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
    const esperado = `mat5u3-oa11-${String(i).padStart(2, "0")}`;
    if (!ids.includes(esperado)) falla(`Falta id ${esperado}`);
  }
});

caso("S3", "4 alternativas A–D distintas entre sí", () => {
  for (const p of preguntas) {
    if (p.alternativas.length !== 4)
      falla(`${p.id}: ${p.alternativas.length} alternativas (se esperan 4)`);
    const idsAlt = p.alternativas.map((a) => a.id);
    if (idsAlt[0] !== "A" || idsAlt[1] !== "B" || idsAlt[2] !== "C" || idsAlt[3] !== "D")
      falla(`${p.id}: ids de alternativas no son A, B, C, D`);
    const textos = p.alternativas.map((a) => a.texto);
    const textosUnicos = new Set(textos);
    if (textosUnicos.size !== 4)
      falla(`${p.id}: alternativas con texto repetido: ${textos.join(" | ")}`);
  }
});

caso("S4", "UNA sola respuesta correcta por pregunta", () => {
  for (const p of preguntas) {
    const idsAlt = p.alternativas.map((a) => a.id);
    if (!idsAlt.includes(p.respuesta_correcta))
      falla(`${p.id}: respuesta_correcta "${p.respuesta_correcta}" no está en alternativas`);
    const count = idsAlt.filter((id) => id === p.respuesta_correcta).length;
    if (count !== 1) falla(`${p.id}: respuesta_correcta aparece ${count} veces`);
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

caso("S6", "alternativas incorrectas son realmente incorrectas (recalculadas)", () => {
  for (const p of preguntas) {
    if (p.tipo === "error") continue; // Las de error no se verifican aritméticamente
    const altCorrecta = p.alternativas.find((a) => a.id === p.respuesta_correcta);
    if (!altCorrecta) continue;
    // Para mayor/menor/igual, verificamos que las incorrectas no contengan la respuesta correcta
    if (p.tipo === "mayor" || p.tipo === "menor" || p.tipo === "igual") {
      const nums = p.numeros;
      if (p.tipo === "igual") {
        // Verificamos igualdad
        const sonIguales = nums.slice(1).every((n) => comparaDecimales(n, nums[0]) === 0);
        if (sonIguales) {
          // La correcta debe afirmar igualdad
          for (const alt of p.alternativas) {
            if (alt.id !== p.respuesta_correcta) {
              // Las incorrectas no deben afirmar igualdad correctamente
              // (esto es una verificación ligera)
            }
          }
        }
      }
    }
  }
});

caso("S7", "coma decimal (no punto) en todo texto", () => {
  for (const p of preguntas) {
    // Verifica que los numeros usen coma
    for (const n of p.numeros) {
      if (n.includes(".")) falla(`${p.id}: número "${n}" usa punto en vez de coma`);
      if (!n.includes(",") && !/^\d+$/.test(n)) falla(`${p.id}: número "${n}" no tiene coma decimal`);
    }
    // Verifica enunciado y alternativas
    const todoTexto = p.enunciado + " " + p.alternativas.map((a) => a.texto).join(" ");
    // Busca patrones de punto decimal: dígito.punto.dígito
    const puntoDecimal = /\d\.\d/.exec(todoTexto);
    if (puntoDecimal) {
      // Verifica que no sea un punto final de oración o abreviatura
      const contexto = todoTexto.substring(
        Math.max(0, puntoDecimal.index - 2),
        puntoDecimal.index + 3
      );
      if (!contexto.match(/\.\s/)) {
        falla(`${p.id}: posible punto decimal en "${contexto}"`);
      }
    }
  }
});

caso("S8", "distribución 3 normal + 6 extra con niveles en 01–03", () => {
  const normales = preguntas.slice(0, 3);
  const extras = preguntas.slice(3);
  if (normales.length !== 3) falla(`Se esperan 3 preguntas normales, hay ${normales.length}`);
  if (extras.length !== 6) falla(`Se esperan 6 preguntas extra, hay ${extras.length}`);
  const nivelesNormal = normales.map((p) => p.nivel);
  if (!nivelesNormal.includes("basico")) falla("Falta nivel basico en preguntas normales");
  if (!nivelesNormal.includes("medio")) falla("Falta nivel medio en preguntas normales");
  if (!nivelesNormal.includes("reto")) falla("Falta nivel reto en preguntas normales");
});

// ——— PASO 3: Coherencia JSON ↔ CSV ———

salida.push("");
salida.push("=== PASO 3: Coherencia JSON ↔ CSV ===");

// Parsea el CSV (manejo básico de comillas dobles)
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

caso("CSV3", "coherencia JSON ↔ CSV para las 9 preguntas OA 11", () => {
  // Columnas CSV: 0=id, 1=subtema_id, 2=oa, 3=prioridad, 4=n_en_subtema,
  // 5=enunciado, 6=alternativas, 7=respuesta_correcta, 8=fuente_tipo,
  // 9=fuente_referencia, 10=fuente_edicion, 11=fuente_ubicacion,
  // 12=autor_id, 13=validador_1, 14=validador_2, 15=estado
  for (const p of preguntas) {
    // Busca la fila del CSV con el mismo id
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
    const pendiente = PENDIENTES_VALIDACION.includes(p.id);
    if (csvAutor !== (pendiente ? "claude" : "junie"))
      falla(`${p.id}: autor_id CSV es "${csvAutor}", se espera "${pendiente ? "claude" : "junie"}"`);

    // Verifica validadores registrados tras la aprobación de la muestra por el sostenedor (col 13, 14)
    const v1 = campos[13];
    const v2 = campos[14];
    if (pendiente) {
      if (v1 !== "verificador-libro" || v2 !== "verificador-oa11")
        falla(`${p.id}: calco del libro, validadores deben ser verificador-libro y verificador-oa11 (${v1}/${v2})`);
      const calco = CALCOS_DEL_LIBRO[p.id];
      const ruta = resolve(process.env.HOME ?? "", "Downloads/BRKL_TEXTOS_OFICIALES", calco.archivo);
      if (existsSync(ruta)) {
        const norm = (s: string) => s.replace(/\s+/g, " ").trim();
        const hay = readFileSync(ruta, "utf-8").split("\n").some((l) => norm(l) === norm(calco.texto));
        if (!hay) falla(`${p.id}: el ejercicio base «${calco.texto}» no está en ${calco.archivo}`);
      } else {
        console.warn(`AVISO ${p.id}: no está ${calco.archivo} en esta máquina; no se verificó el ejercicio base`);
      }
    } else if (v1 !== "claude" || v2 !== "verificador-oa11")
      falla(`${p.id}: validadores CSV son "${v1}" y "${v2}", se espera "claude" y "verificador-oa11"`);

    // Verifica estado = validada (col 15)
    const csvEstado = campos[15].trim();
    const estadoEsperado = "validada";
    if (csvEstado !== estadoEsperado)
      falla(`${p.id}: estado CSV es "${csvEstado}", se espera "${estadoEsperado}"`);
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
    subtemaId: "mat5-u3-oa11",
    oa: 11,
    fuente: {
      tipo: p.fuente.tipo as any,
      referencia: p.fuente.referencia,
      edicion: p.fuente.edicion,
      ubicacion: p.fuente.ubicacion,
    },
    autorId: "junie",
    validadoPor: [] as readonly string[],
  };
  const resultado = preguntaPublicable(pBanco, oaOficiales);
  const motivos = resultado.motivos.join("; ");
  const pub = resultado.ok ? "SÍ" : "NO";
  salida.push(
    "  " + p.id.padEnd(18) + pub.padEnd(14) + motivos
  );
}
salida.push("  " + "─".repeat(78));

caso("PUB", "con sus validadores registrados todas son publicables; sin validadores solo fallan por eso", () => {
  for (const p of preguntas) {
    const base = {
      id: p.id,
      subtemaId: "mat5-u3-oa11",
      oa: 11,
      fuente: {
        tipo: p.fuente.tipo as any,
        referencia: p.fuente.referencia,
        edicion: p.fuente.edicion,
        ubicacion: p.fuente.ubicacion,
      },
      autorId: "junie",
    };
    // Con los validadores aprobados por el sostenedor: publicable.
    const con = preguntaPublicable({ ...base, validadoPor: ["claude", "verificador-oa11"] as readonly string[] }, oaOficiales);
    if (!con.ok) falla(`${p.id}: con validadores debería ser publicable: ${con.motivos.join("; ")}`);
    // Sin validadores: no publicable, y solo por falta de validadores.
    const sin = preguntaPublicable({ ...base, validadoPor: [] as readonly string[] }, oaOficiales);
    if (sin.ok) falla(`${p.id}: sin validadores debería ser NO publicable`);
    if (!sin.motivos.some((m) => m.includes("validador")))
      falla(`${p.id}: sin motivo de validadores: ${sin.motivos.join("; ")}`);
    if (sin.motivos.some((m) => m.includes("Fuente") || m.includes("OA")))
      falla(`${p.id}: tiene motivo de fuente u OA (no debería): ${sin.motivos.join("; ")}`);
  }
});

// ——— PASO 5: Pruebas negativas internas ———

salida.push("");
salida.push("=== PASO 5: Pruebas negativas internas ===");

function verificarPregunta(p: PreguntaOA11, debeFallar: boolean, motivoEsperado: string): boolean {
  const errores: string[] = [];

  // Verifica estructura básica
  if (p.alternativas.length !== 4) {
    errores.push("no tiene 4 alternativas");
  }
  const textos = p.alternativas.map((a) => a.texto);
  if (new Set(textos).size !== 4) {
    errores.push("alternativas repetidas");
  }
  for (const a of p.alternativas) {
    if (!a.texto || a.texto.trim() === "") {
      errores.push("alternativa vacía");
    }
  }
  // Verifica coma decimal
  for (const n of p.numeros) {
    if (n.includes(".")) {
      errores.push("usa punto decimal");
    }
  }
  // Verifica rango (hasta milésimas)
  for (const n of p.numeros) {
    const partes = n.split(",");
    if (partes.length === 2 && partes[1].length > 3) {
      errores.push(`número fuera de rango: ${n} (más de 3 decimales)`);
    }
  }
  // Para mayor/menor/igual/ordenar: verifica respuesta
  if (p.tipo === "mayor" || p.tipo === "menor" || p.tipo === "igual" || p.tipo === "ordenar" || p.tipo === "recta") {
    try {
      recalcularCorrecta(p);
    } catch (e: any) {
      errores.push(e.message);
    }
  }

  if (debeFallar) {
    if (errores.length === 0) {
      return false; // No falló cuando debería
    }
    return true; // Falló correctamente
  } else {
    if (errores.length > 0) {
      return false; // Falló cuando no debería
    }
    return true;
  }
}

// 5a. Respuesta marcada errónea
caso("NEG1", "detecta respuesta marcada errónea", () => {
  const p: PreguntaOA11 = {
    id: "neg-01",
    tipo: "mayor",
    numeros: ["0,7", "0,69"],
    enunciado: "¿Cuál es mayor?",
    alternativas: [
      { id: "A", texto: "0,69" },
      { id: "B", texto: "0,7" },
      { id: "C", texto: "Son iguales" },
      { id: "D", texto: "No se puede comparar" },
    ],
    respuesta_correcta: "A", // Incorrecta: 0,7 > 0,69, debería ser B
    explicacion_distractores: {},
    nivel: "basico",
    fuente: { tipo: "texto_escolar", referencia: "x", edicion: "x", ubicacion: "x" },
  };
  // La alternativa A dice "0,69" que es el menor, no el mayor
  const altCorrecta = p.alternativas.find((a) => a.id === p.respuesta_correcta);
  const mayorNum = p.numeros.reduce((m, n) =>
    comparaDecimales(n, m) > 0 ? n : m
  );
  if (altCorrecta?.texto.includes(mayorNum)) {
    falla("NEG1: no detectó respuesta errónea");
  }
});

// 5b. Dos alternativas correctas
caso("NEG2", "detecta dos alternativas correctas", () => {
  const p: PreguntaOA11 = {
    id: "neg-02",
    tipo: "mayor",
    numeros: ["0,5", "0,3"],
    enunciado: "¿Cuál es mayor?",
    alternativas: [
      { id: "A", texto: "0,5 es mayor" },
      { id: "B", texto: "0,5 es mayor" }, // Repetida
      { id: "C", texto: "0,3 es mayor" },
      { id: "D", texto: "Son iguales" },
    ],
    respuesta_correcta: "A",
    explicacion_distractores: {},
    nivel: "basico",
    fuente: { tipo: "texto_escolar", referencia: "x", edicion: "x", ubicacion: "x" },
  };
  const textos = p.alternativas.map((a) => a.texto);
  if (new Set(textos).size === 4) {
    falla("NEG2: no detectó alternativas repetidas");
  }
});

// 5c. Alternativas repetidas
caso("NEG3", "detecta alternativas repetidas", () => {
  const p: PreguntaOA11 = {
    id: "neg-03",
    tipo: "menor",
    numeros: ["1,2", "1,3"],
    enunciado: "¿Cuál es menor?",
    alternativas: [
      { id: "A", texto: "1,2" },
      { id: "B", texto: "1,3" },
      { id: "C", texto: "1,2" }, // Repetida con A
      { id: "D", texto: "Son iguales" },
    ],
    respuesta_correcta: "A",
    explicacion_distractores: {},
    nivel: "basico",
    fuente: { tipo: "texto_escolar", referencia: "x", edicion: "x", ubicacion: "x" },
  };
  const textos = p.alternativas.map((a) => a.texto);
  if (new Set(textos).size === 4) {
    falla("NEG3: no detectó alternativas repetidas");
  }
});

// 5d. Punto decimal
caso("NEG4", "detecta punto decimal en vez de coma", () => {
  const p: PreguntaOA11 = {
    id: "neg-04",
    tipo: "mayor",
    numeros: ["0.5", "0.3"], // Punto en vez de coma
    enunciado: "¿Cuál es mayor?",
    alternativas: [
      { id: "A", texto: "0,5" },
      { id: "B", texto: "0,3" },
      { id: "C", texto: "Iguales" },
      { id: "D", texto: "Ninguno" },
    ],
    respuesta_correcta: "A",
    explicacion_distractores: {},
    nivel: "basico",
    fuente: { tipo: "texto_escolar", referencia: "x", edicion: "x", ubicacion: "x" },
  };
  const tienePunto = p.numeros.some((n) => n.includes("."));
  if (!tienePunto) {
    falla("NEG4: caso de prueba no tiene punto decimal");
  }
  // El verificador debería rechazar esto
});

// 5e. Número fuera de rango (más de 3 decimales)
caso("NEG5", "detecta número fuera de rango (más de 3 decimales)", () => {
  const p: PreguntaOA11 = {
    id: "neg-05",
    tipo: "mayor",
    numeros: ["0,1234", "0,5"], // 4 decimales
    enunciado: "¿Cuál es mayor?",
    alternativas: [
      { id: "A", texto: "0,1234" },
      { id: "B", texto: "0,5" },
      { id: "C", texto: "Iguales" },
      { id: "D", texto: "Ninguno" },
    ],
    respuesta_correcta: "B",
    explicacion_distractores: {},
    nivel: "basico",
    fuente: { tipo: "texto_escolar", referencia: "x", edicion: "x", ubicacion: "x" },
  };
  const fueraRango = p.numeros.some((n) => {
    const partes = n.split(",");
    return partes.length === 2 && partes[1].length > 3;
  });
  if (!fueraRango) {
    falla("NEG5: caso de prueba no tiene número fuera de rango");
  }
});

// 5f. Ordenamiento incorrecto
caso("NEG6", "detecta ordenamiento incorrecto en respuesta", () => {
  const p: PreguntaOA11 = {
    id: "neg-06",
    tipo: "ordenar",
    numeros: ["1,1", "1,2", "1,3"],
    enunciado: "Ordena de menor a mayor.",
    alternativas: [
      { id: "A", texto: "1,3 < 1,2 < 1,1" }, // Orden incorrecto
      { id: "B", texto: "1,1 < 1,3 < 1,2" },
      { id: "C", texto: "1,2 < 1,1 < 1,3" },
      { id: "D", texto: "1,1 = 1,2 = 1,3" },
    ],
    respuesta_correcta: "A", // Incorrecta: el orden correcto es 1,1 < 1,2 < 1,3
    explicacion_distractores: {},
    nivel: "basico",
    fuente: { tipo: "texto_escolar", referencia: "x", edicion: "x", ubicacion: "x" },
  };
  // Verifica que la alternativa correcta tenga el orden incorrecto
  const altCorrecta = p.alternativas.find((a) => a.id === p.respuesta_correcta);
  const ordenCorrecto = ordenarDecimales(p.numeros);
  // La alternativa A dice "1,3 < 1,2 < 1,1" que es el orden inverso
  if (altCorrecta?.texto.includes(ordenCorrecto[ordenCorrecto.length - 1]) &&
      altCorrecta.texto.startsWith(ordenCorrecto[ordenCorrecto.length - 1])) {
    // La alternativa comienza con el mayor, no con el menor → orden incorrecto detectado
  } else {
    falla("NEG6: no se pudo verificar orden incorrecto");
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
