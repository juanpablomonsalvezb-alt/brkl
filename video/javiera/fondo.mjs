// Renderiza <EP>/escena.html (EP=ep01-umbral por defecto) (fondo + gráficos + placa final) a out/<EP>/fondo.mp4.
//   node video/javiera/fondo.mjs              → out/<EP>/fondo.mp4
//   node video/javiera/fondo.mjs --stills 3,9 → out/<EP>/fondo-3.png, …
import puppeteer from "puppeteer";
import { spawn } from "child_process";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const aqui = dirname(fileURLToPath(import.meta.url));
const EP = process.env.EP || "ep01-umbral";
const out = resolve(aqui, "out", EP);
const linea = JSON.parse(readFileSync(resolve(out, "linea.json"), "utf8"));
const FPS = linea.fps;
const idx = process.argv.indexOf("--stills");
const stills = idx > -1 ? process.argv[idx + 1].split(",").map(Number) : null;

const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"] });
const page = await browser.newPage();
const errores = [];
page.on("pageerror", (e) => errores.push(e.message));
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve(aqui, EP, "escena.html")).href, { waitUntil: "load" });
await page.evaluate(async (l) => { await window.listo; window.preparar(l); }, linea);

if (stills) {
  for (const s of stills) {
    await page.evaluate((t) => window.render(t), s);
    await page.screenshot({ path: resolve(out, `fondo-${String(s).replace(".", "_")}.png`) });
  }
} else {
  const frames = Math.round(linea.duracion * FPS);
  const ff = spawn(process.env.FFMPEG || "ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "fast", "-crf", "14", "-pix_fmt", "yuv420p", resolve(out, "fondo.mp4"),
  ], { stdio: ["pipe", "inherit", "inherit"] });
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.render(t), f / FPS);
    const buf = await page.screenshot({ type: "jpeg", quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 240 === 0) console.log(`fondo ${f}/${frames}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
}
await browser.close();
if (errores.length) throw new Error(errores.join("\n"));
