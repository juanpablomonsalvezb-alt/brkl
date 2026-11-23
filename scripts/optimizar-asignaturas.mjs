// Recorta la lámina vectorial de asignaturas (11 composiciones sobre fondo transparente) en
// una miniatura por asignatura, 4:3, en WebP con transparencia (800x600 y 400x300).
// Uso: node scripts/optimizar-asignaturas.mjs [lamina.svg]   (por defecto ~/Downloads/hoja_asignaturas_redisenada.svg)
// Salida: client/public/images/vortice/asignaturas/<asignatura>-800.webp y -400.webp
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const lamina = process.argv[2] ?? join(homedir(), "Downloads", "hoja_asignaturas_redisenada.svg");
const destino = new URL("../client/public/images/vortice/asignaturas/", import.meta.url).pathname;
const ESCALA = 2; // 2400x1800 del SVG -> 4800x3600 px
const CELDA = 600; // las composiciones están en una retícula de 600 unidades

// [asignatura, x0, y0] en unidades del SVG (origen de cada celda de 600x600)
const CELDAS = [
  ["lenguaje", 30, 28], ["matematica", 630, 28], ["ciencias-naturales", 1230, 28], ["ciencias-media", 1830, 28],
  ["historia", 30, 628], ["ingles", 630, 628], ["artes", 1230, 628], ["tecnologia", 1830, 628],
  ["filosofia", 330, 1228], ["educacion-ciudadana", 930, 1228], ["electivo", 1530, 1228],
];

mkdirSync(destino, { recursive: true });
const hoja = await sharp(lamina, { density: 72 * ESCALA }).png().toBuffer();
const { width: W, height: H } = await sharp(hoja).metadata();

for (const [nombre, x0, y0] of CELDAS) {
  const left = Math.round(x0 * ESCALA), top = Math.round(y0 * ESCALA);
  const width = Math.min(CELDA * ESCALA, W - left), height = Math.min(CELDA * ESCALA, H - top);
  const celda = await sharp(hoja).extract({ left, top, width, height }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // recuadro real del contenido: píxeles con alfa visible
  let x1 = width, y1 = height, x2 = -1, y2 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (celda.data[(y * width + x) * 4 + 3] > 8) { if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y; }
  }
  if (x2 < 0) throw new Error(`celda vacía: ${nombre}`);
  const w = x2 - x1 + 1, h = y2 - y1 + 1;
  const recorte = { data: await sharp(celda.data, { raw: { width, height, channels: 4 } }).extract({ left: x1, top: y1, width: w, height: h }).png().toBuffer() };
  const lado = Math.max(w * 1.26, h * 1.26 * (4 / 3)); // margen del 12 % por lado
  const lienzoW = Math.round(lado), lienzoH = Math.round(lado * 0.75);
  const base = await sharp({ create: { width: lienzoW, height: lienzoH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: recorte.data, left: Math.round((lienzoW - w) / 2), top: Math.round((lienzoH - h) / 2) }])
    .png().toBuffer();
  for (const ancho of [800, 400]) {
    await sharp(base).resize({ width: ancho }).webp({ quality: 84, effort: 5, alphaQuality: 90 }).toFile(join(destino, `${nombre}-${ancho}.webp`));
  }
  console.log(nombre.padEnd(20), `${w}x${h} px de contenido`);
}
