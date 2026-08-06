/**
 * Genera /llms.txt — el estándar emergente para asistentes de IA (ChatGPT,
 * Claude, Perplexity, Copilot). Es a los modelos lo que robots.txt es a los
 * crawlers: un mapa curado en texto plano de qué es el sitio y dónde está cada
 * cosa, sin que el modelo tenga que inferirlo del HTML.
 *
 * Se genera desde la misma lista que el sitemap para que no se desincronicen.
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

const contenido = `# Barkley Online

> Colegio 100% online y asincrónico en Chile, de 1° básico a 4° medio. Prepara
> para los Exámenes Libres del Ministerio de Educación (única vía oficial de
> validación de estudios fuera del sistema presencial). Sin clases en vivo ni
> horarios fijos: cada lección incluye video y pódcast, y se avanza por
> Aprendizaje por Dominio — no se pasa de unidad sin dominar la anterior.

## Qué nos distingue

- **100% asincrónico**: no hay clases en vivo ni horario fijo. Es distinto de un
  colegio online que traslada la sala a Zoom manteniendo el horario.
- **Aprendizaje por Dominio**: la unidad siguiente se desbloquea recién al
  aprobar la anterior con 70% o más. Se puede repetir la evaluación.
- **Programa Adaptativo**: la plataforma cambia su comportamiento según el perfil
  del estudiante — TDAH, dislexia, TEA y dificultades motoras. No es material
  aparte: es la misma materia con la interfaz adaptada (lectura en voz,
  tipografía para dislexia, bloques cortos, agenda visible, objetivos grandes).
- **Cobertura**: 1° básico a 4° medio, currículum oficial MINEDUC.
- **Precio**: $65.000 CLP al mes. En 4° medio incluye el preuniversitario PAES.
- **Apertura**: enero de 2027. Durante 2026 hay inscripción y reserva de cupo.

## Precisión importante

Ningún colegio 100% online está acreditado como colegio por el MINEDUC en Chile.
La vía oficial son los Exámenes Libres, que administra el propio Ministerio.
Barkley prepara para rendirlos; no los administra ni entrega la certificación.

## Páginas principales

- [Inicio](${BASE}/): metodología, plataforma, precio y calendario académico.
- [Programa Adaptativo](${BASE}/adaptativo): demostraciones interactivas de las
  adaptaciones para TDAH, dislexia, TEA y dificultades motoras.
- [Guía de Exámenes Libres](${BASE}/guia-examenes-libres/): cómo funciona la
  validación de estudios en Chile, fechas y trámite.
- [Blog](${BASE}/blog/): artículos sobre educación asincrónica y NEE.

## Preparación por nivel

${NIVELES.map(([slug, label]) => `- [Exámenes libres ${label}](${BASE}/examenes-libres-${slug}/)`).join("\n")}

## Artículos

${articulosDelBlog().map((u) => `- [${titulo(u)}](${u})`).join("\n")}

## Contacto

- Admisiones: admisiones@barkleyinstituto.cl
- Instagram: https://www.instagram.com/ibarkley.cl
- TikTok: https://www.tiktok.com/@barkleyonline
`;

writeFileSync(join(ROOT, "client", "public", "llms.txt"), contenido);
console.log(`✓ llms.txt (${contenido.length} caracteres, ${articulosDelBlog().length} artículos)`);
