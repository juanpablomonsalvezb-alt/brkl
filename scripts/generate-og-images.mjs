/**
 * Genera una og:image distinta por landing de nivel — hoy las 13 páginas
 * comparten og-image.jpg genérico, así que al compartir en WhatsApp/redes
 * todas se ven idénticas y no dicen a qué nivel corresponden (baja CTR).
 *
 * Uso: node scripts/generate-og-images.mjs
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "client", "public", "og");
mkdirSync(OUT_DIR, { recursive: true });

const NAVY = "#003366";
const GOLD = "#FFC548";
const W = 1200;
const H = 630;

const NIVELES = [
  { slug: "1-basico", label: "1° Básico" },
  { slug: "2-basico", label: "2° Básico" },
  { slug: "3-basico", label: "3° Básico" },
  { slug: "4-basico", label: "4° Básico" },
  { slug: "5-basico", label: "5° Básico" },
  { slug: "6-basico", label: "6° Básico" },
  { slug: "7-basico", label: "7° Básico" },
  { slug: "8-basico", label: "8° Básico" },
  { slug: "1-medio", label: "1° Medio" },
  { slug: "2-medio", label: "2° Medio" },
  { slug: "3-medio", label: "3° Medio" },
  { slug: "4-medio", label: "4° Medio" },
];

function svg(label) {
  return `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${NAVY}"/>
        <stop offset="100%" stop-color="#001a33"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect x="0" y="0" width="10" height="${H}" fill="${GOLD}"/>
    <text x="80" y="180" font-family="Georgia, serif" font-size="30" font-weight="700" fill="${GOLD}" letter-spacing="2">BARKLEY</text>
    <text x="80" y="330" font-family="Georgia, serif" font-size="98" font-weight="700" fill="#ffffff">${label}</text>
    <text x="80" y="400" font-family="Georgia, serif" font-size="34" fill="#ffffff" opacity="0.85">Examen Libre MINEDUC — colegio asincrónico</text>
    <text x="80" y="560" font-family="Georgia, serif" font-size="26" fill="${GOLD}">barkleyinstituto.cl</text>
  </svg>`;
}

for (const n of NIVELES) {
  const out = join(OUT_DIR, `${n.slug}.jpg`);
  await sharp(Buffer.from(svg(n.label))).jpeg({ quality: 90 }).toFile(out);
  console.log(`✓ og/${n.slug}.jpg`);
}
console.log(`Listo: ${NIVELES.length} og:images generadas.`);
