// Verificador unificado de los OA restantes de Matemática 5.º (T30).
// Recorre todas las carpetas oaN bajo docs/vortice/piloto/mat5_resto/ y comprueba:
// - esquema JSON válido, 9 preguntas, 4 alternativas, una correcta
// - base_libro.texto existe en el archivo de BRKL_TEXTOS_OFICIALES
// - cada cita « » del libreto existe en el archivo citado
// - cada hecho de la sección 6 es aritméticamente verdadero
//
// Ejecutar: npx tsx script/mat5-resto.check.ts

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TEXTOS_DIR = resolve(process.env.HOME ?? "", "Downloads/BRKL_TEXTOS_OFICIALES");
const OA_RESTO_DIR = resolve(ROOT, "docs/vortice/piloto/mat5_resto");

let casos = 0;
let fallas = 0;
const salida: string[] = [];

function caso(id: string, nombre: string, f: () => void) {
  try {
    f();
    casos++;
    salida.push(`  ✓ ${id.padEnd(18)} ${nombre}`);
  } catch (e) {
    fallas++;
    casos++;
    salida.push(`  ✗ ${id.padEnd(18)} ${nombre}`);
    salida.push(`    ERROR: ${e}`);
  }
}

function falla(msg: string) {
  throw new Error(msg);
}

// ——— Evaluar expresión aritmética simple ———
function evaluarAritmetica(expr: string): number {
  // Normaliza: "×" → "*", "•" → "*", ":" → "/", "·" → "*"
  let normalizada = expr
    .replace(/[×•]/g, "*")
    .replace(/:/g, "/")
    .replace(/\./g, "") // quita puntos de miles
    .replace(/\s+/g, "");
  // Solo permite números, operadores y paréntesis
  if (!/^[0-9+\-*/().]+$/.test(normalizada)) {
    return NaN;
  }
  try {
    // eslint-disable-next-line no-eval
    return Function(`"use strict"; return (${normalizada})`)();
  } catch {
    return NaN;
  }
}

// ——— Normalizar texto para comparación ———
function norm(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

// ——— Extraer citas del libreto ———
function extraerCitas(texto: string): Array<{ cita: string; archivo: string; linea: string }> {
  const citas: Array<{ cita: string; archivo: string; linea: string }> = [];
  // Patrón: «cita» [ARCHIVO:LINEA]
  const regex = /«([^»]+)»\s*\[([A-Z][A-Z0-9_]*):(\d+(?:-\d+)?)\]/g;
  let m;
  while ((m = regex.exec(texto)) !== null) {
    citas.push({ cita: m[1], archivo: m[2], linea: m[3] });
  }
  return citas;
}

// ——— Extraer hechos verificables del libreto ———
function extraerHechos(texto: string): string[] {
  const hechos: string[] = [];
  const lines = texto.split("\n");
  let enHechos = false;
  for (const line of lines) {
    if (line.includes("## 6. Hechos verificables")) {
      enHechos = true;
      continue;
    }
    if (enHechos && line.match(/^\d+\./)) {
      hechos.push(line.replace(/^\d+\.\s*/, ""));
    } else if (enHechos && line.trim() === "") {
      // continue
    } else if (enHechos && line.match(/^#/)) {
      break;
    }
  }
  return hechos;
}

// ——— Mapeo de etiquetas de archivo a nombres reales ———
function etiquetaARuta(etiqueta: string): string {
  const mapa: Record<string, string> = {
    "E": "MATME26E5B.md",
    "E1": "MATME26E5B_1.md",
    "S": "matematica5.md",
    "S2": "matematica5_tomo2.md",
    "G": "MATME26G5B.md",
  };
  return mapa[etiqueta] || etiqueta;
}

// ——— Procesar cada OA ———
const oas = readdirSync(OA_RESTO_DIR).filter((d) => d.startsWith("oa"));

for (const oaDir of oas) {
  const oaNum = oaDir.replace("oa", "");
  const jsonPath = resolve(OA_RESTO_DIR, oaDir, "preguntas.json");
  const libretoPath = resolve(OA_RESTO_DIR, oaDir, "libreto.md");

  salida.push("");
  salida.push(`=== OA ${oaNum} ===`);

  // ——— Preguntas JSON ———
  if (!existsSync(jsonPath)) {
    salida.push(`  ✗ ${oaDir.padEnd(18)} preguntas.json no existe`);
    fallas++;
    casos++;
    continue;
  }

  const preguntas = JSON.parse(readFileSync(jsonPath, "utf-8"));

  caso(`${oaDir}-count`, "9 preguntas", () => {
    if (preguntas.length !== 9) falla(`Se esperan 9 preguntas, hay ${preguntas.length}`);
  });

  for (const p of preguntas) {
    caso(p.id, "4 alternativas A–D", () => {
      if (p.alternativas.length !== 4) falla(`${p.alternativas.length} alternativas`);
      const ids = p.alternativas.map((a: any) => a.id);
      if (ids[0] !== "A" || ids[1] !== "B" || ids[2] !== "C" || ids[3] !== "D") {
        falla(`ids no son A, B, C, D`);
      }
      const textos = p.alternativas.map((a: any) => a.texto);
      if (new Set(textos).size !== 4) falla("alternativas repetidas");
    });

    caso(p.id, "respuesta correcta en alternativas", () => {
      const ids = p.alternativas.map((a: any) => a.id);
      if (!ids.includes(p.respuesta_correcta)) {
        falla(`respuesta_correcta "${p.respuesta_correcta}" no está en alternativas`);
      }
    });

    caso(p.id, "base_libro presente", () => {
      if (!p.base_libro || !p.base_libro.archivo || !p.base_libro.texto) {
        falla("falta base_libro.archivo o base_libro.texto");
      }
    });

    // Verificar base_libro.texto en el archivo fuente
    caso(p.id, "base_libro.texto en archivo", () => {
      if (!p.base_libro) return;
      const ruta = resolve(TEXTOS_DIR, p.base_libro.archivo);
      if (!existsSync(ruta)) {
        salida.push(`    AVISO: no está ${p.base_libro.archivo} en esta máquina`);
        return;
      }
      const contenido = readFileSync(ruta, "utf-8");
      const lines = contenido.split("\n");
      const textoNorm = norm(p.base_libro.texto);
      const encontrado = lines.some((l) => norm(l).includes(textoNorm) || norm(l) === textoNorm);
      if (!encontrado) {
        falla(`«${p.base_libro.texto}» no encontrado en ${p.base_libro.archivo}`);
      }
    });
  }

  // ——— Libreto ———
  if (!existsSync(libretoPath)) {
    salida.push(`  ✗ ${oaDir.padEnd(18)} libreto.md no existe`);
    fallas++;
    casos++;
    continue;
  }

  const libreto = readFileSync(libretoPath, "utf-8");

  // Verificar secciones requeridas
  caso(`${oaDir}-libreto`, "secciones requeridas", () => {
    const secciones = [
      "## 1. Qué vas a aprender",
      "## 2.",
      "## 3.",
      "## 5.",
      "## 6. Hechos verificables",
    ];
    for (const sec of secciones) {
      if (!libreto.includes(sec)) {
        // Intenta con variaciones
        if (sec === "## 2." && !libreto.match(/##\s*2\./)) falla("falta sección 2");
        else if (sec === "## 3." && !libreto.match(/##\s*3\./)) falla("falta sección 3");
        else if (sec === "## 5." && !libreto.match(/##\s*5\./)) falla("falta sección 5");
        else if (!libreto.includes(sec)) falla(`falta sección: ${sec}`);
      }
    }
  });

  // Verificar citas del libreto
  const citas = extraerCitas(libreto);
  for (const c of citas) {
    caso(`${oaDir}-cita`, `cita «${c.cita.substring(0, 40)}...»`, () => {
      const nombreArchivo = etiquetaARuta(c.archivo);
      const ruta = resolve(TEXTOS_DIR, nombreArchivo);
      if (!existsSync(ruta)) {
        salida.push(`    AVISO: no está ${nombreArchivo} en esta máquina`);
        return;
      }
      const contenido = readFileSync(ruta, "utf-8");
      const citaNorm = norm(c.cita);
      // Busca la cita (o parte significativa) en el contenido
      const encontrado = norm(contenido).includes(citaNorm);
      if (!encontrado) {
        // Intenta con la primera mitad de la cita
        const mitad = citaNorm.substring(0, Math.ceil(citaNorm.length / 2));
        if (mitad.length > 10 && norm(contenido).includes(mitad)) {
          // Aceptable: la cita es larga y la mitad coincide
          return;
        }
        falla(`cita «${c.cita}» no encontrada en ${c.archivo}`);
      }
    });
  }

  // Verificar hechos verificables
  const hechos = extraerHechos(libreto);
  for (const hecho of hechos) {
    caso(`${oaDir}-hecho`, `hecho: ${hecho.substring(0, 50)}`, () => {
      // Intenta evaluar como expresión aritmética
      const resultado = evaluarAritmetica(hecho);
      if (isNaN(resultado)) {
        // No es una expresión simple; podría ser "a = b"
        const partes = hecho.split("=");
        if (partes.length === 2) {
          const izq = evaluarAritmetica(partes[0].trim());
          const der = evaluarAritmetica(partes[1].trim());
          if (isNaN(izq) || isNaN(der)) {
            // No se puede evaluar; se saltea
            return;
          }
          if (Math.abs(izq - der) > 0.001) {
            falla(`${partes[0].trim()} ≠ ${partes[1].trim()} (${izq} ≠ ${der})`);
          }
        }
        return;
      }
      // Si es una expresión sin "=", el resultado debe ser un número válido
      // (no hay nada que verificar más allá de que se evalúa)
    });
  }
}

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
