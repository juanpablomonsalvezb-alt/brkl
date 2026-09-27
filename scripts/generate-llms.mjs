/**
 * Genera /llms.txt — el estándar emergente para asistentes de IA (ChatGPT,
 * Claude, Perplexity, Copilot). Es a los modelos lo que robots.txt es a los
 * crawlers: un mapa curado en texto plano de qué es el sitio y dónde está cada
 * cosa, sin que el modelo tenga que inferirlo del HTML.
 *
 * Las listas de niveles y artículos se completan desde el sitemap para que no
 * se desincronicen; el resto del archivo es curado a mano.
 *
 * Uso: node scripts/generate-llms.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://www.barkleyinstituto.cl";

/** Descripciones curadas: lo que un modelo necesita saber para citarnos bien. */
const NIVELES = [
  ["1-basico", "1° Básico"], ["2-basico", "2° Básico"], ["3-basico", "3° Básico"],
  ["4-basico", "4° Básico"], ["5-basico", "5° Básico"], ["6-basico", "6° Básico"],
  ["7-basico", "7° Básico"], ["8-basico", "8° Básico"], ["1-medio", "1° Medio"],
  ["2-medio", "2° Medio"], ["3-medio", "3° Medio"], ["4-medio", "4° Medio"],
];

function articulosDelBlog() {
  // Se leen del sitemap para no mantener dos listas.
  const sitemap = readFileSync(join(ROOT, "client", "public", "sitemap.xml"), "utf8");
  return [...sitemap.matchAll(/<loc>([^<]*\/blog\/[^<]+)<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => !u.endsWith("/blog/"));
}

function titulo(url) {
  const slug = url.replace(`${BASE}/blog/`, "").replace(/\/$/, "");
  const html = readFileSync(join(ROOT, "client", "public", "blog", slug, "index.html"), "utf8");
  return (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? slug).replace(" | Blog Barkley Online", "");
}

// llms.txt se edita a mano (descripciones curadas, precios con marcadores
// {{...}}). Este script ya no lo reescribe: solo agrega lo que falte de las
// listas automáticas —niveles y artículos del blog del sitemap—, así correrlo
// nunca borra contenido curado.
const RUTA = join(ROOT, "client", "public", "llms.txt");
let contenido = readFileSync(RUTA, "utf8");

function agregarEnSeccion(titulo, lineas) {
  const faltan = lineas.filter((l) => !contenido.includes(l.match(/\]\(([^)]+)\)/)[1] + ")"));
  if (!faltan.length) return 0;
  const i = contenido.indexOf(`## ${titulo}\n`);
  if (i === -1) throw new Error(`llms.txt no tiene la sección "## ${titulo}"`);
  const fin = contenido.indexOf("\n## ", i + 3);
  const corte = fin === -1 ? contenido.length : fin;
  contenido = contenido.slice(0, corte).replace(/\n+$/, "\n") + faltan.join("\n") + "\n" + contenido.slice(corte);
  return faltan.length;
}

const nuevosNiveles = agregarEnSeccion(
  "Preparación por nivel",
  NIVELES.map(([slug, label]) => `- [Exámenes libres ${label}](${BASE}/examenes-libres-${slug}/)`),
);
const nuevosArticulos = agregarEnSeccion("Artículos", articulosDelBlog().map((u) => `- [${titulo(u)}](${u})`));

writeFileSync(RUTA, contenido);
console.log(`✓ llms.txt: ${nuevosNiveles} nivel(es) y ${nuevosArticulos} artículo(s) agregados`);
