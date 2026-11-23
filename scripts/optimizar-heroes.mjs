// Optimiza las escenas del hero de Vórtice (una por tramo) a WebP en varios anchos.
// Uso: node scripts/optimizar-heroes.mjs [carpeta-con-originales]
// Entrada: atmosfera_estudio_{encantado,exploracion,atardecer}.png (por defecto en ~/Downloads).
// Salida: client/public/images/vortice/heroes/<tramo>-<ancho>.webp y un resumen con el color dominante.
import sharp from "sharp";
import { mkdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const origen = process.argv[2] ?? join(homedir(), "Downloads");
const destino = new URL("../client/public/images/vortice/heroes/", import.meta.url).pathname;
const ANCHOS = [640, 1024, 1600];
const ESCENAS = [
  { tramo: "basica-1-4", archivo: "atmosfera_estudio_encantado.png" },
  { tramo: "basica-5-8", archivo: "atmosfera_estudio_exploracion.png" },
  { tramo: "media", archivo: "atmosfera_estudio_atardecer.png" },
];

mkdirSync(destino, { recursive: true });
const resumen = {};
for (const { tramo, archivo } of ESCENAS) {
  const entrada = join(origen, archivo);
  const { dominant } = await sharp(entrada).resize(64).stats();
  const hex = "#" + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, "0")).join("");
  resumen[tramo] = { dominante: hex, archivos: {} };
  for (const ancho of ANCHOS) {
    const salida = join(destino, `${tramo}-${ancho}.webp`);
    await sharp(entrada).resize({ width: ancho }).webp({ quality: 76, effort: 5 }).toFile(salida);
    resumen[tramo].archivos[ancho] = Math.round(statSync(salida).size / 1024) + " KB";
  }
}
console.log(JSON.stringify(resumen, null, 2));
