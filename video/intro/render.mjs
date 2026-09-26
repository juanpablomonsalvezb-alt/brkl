// Render cuadro a cuadro de intro.html a MP4 (H.264).
//   node video/intro/render.mjs                 → video/intro/out/intro-1080p.mp4
//   node video/intro/render.mjs --stills 3,12,20 → PNG de esos segundos
//   --file intro-v2.html  elige la animación; SUB=3 promedia 3 subcuadros por cuadro (desenfoque de movimiento)
//   --vertical            formato 9:16 (1080×1920) para redes
// Requiere Chromium (PUPPETEER_EXECUTABLE_PATH) y ffmpeg con libx264 (FFMPEG).
import puppeteer from "puppeteer";
import { spawn } from "child_process";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const aqui = dirname(fileURLToPath(import.meta.url));
const out = resolve(aqui, "out");
mkdirSync(out, { recursive: true });
const FPS = Number(process.env.FPS || 30);
const idx = process.argv.indexOf("--stills");
const stills = idx > -1 ? process.argv[idx + 1].split(",").map(Number) : null;
const fi = process.argv.indexOf("--file");
const archivo = fi > -1 ? process.argv[fi + 1] : "intro.html";
const vertical = process.argv.includes("--vertical");
const nombre = archivo.replace(/\.html$/, "") + (vertical ? "-vertical" : "");
const SUB = Number(process.env.SUB || 1);

const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"] });
const page = await browser.newPage();
await page.setViewport(vertical ? { width: 1080, height: 1920, deviceScaleFactor: 1 } : { width: 1920, height: 1080, deviceScaleFactor: 1 });
const errores = [];
page.on("pageerror", (e) => errores.push(e.message));
await page.goto(pathToFileURL(resolve(aqui, archivo)).href + (vertical ? "?vertical" : ""), { waitUntil: "load" });
await page.evaluate(() => window.listo || document.fonts.ready);
if (errores.length) throw new Error(errores.join("\n"));

if (stills) {
  for (const s of stills) {
    await page.evaluate((t) => window.render(t), s);
    await page.screenshot({ path: resolve(out, `${nombre}-still-${String(s).replace(".", "_")}.png`) });
  }
} else {
  const dur = await page.evaluate(() => window.DURATION);
  const frames = Math.round(dur * FPS * SUB);
  const mezcla = SUB > 1 ? ["-vf", `tmix=frames=${SUB},fps=${FPS}`] : [];
  const ff = spawn(process.env.FFMPEG || "ffmpeg", [
    "-y", "-f", "image2pipe", "-framerate", String(FPS * SUB), "-c:v", "mjpeg", "-i", "-",
    ...mezcla,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    resolve(out, `${nombre}-${vertical ? "1080x1920" : "1080p"}.mp4`),
  ], { stdio: ["pipe", "inherit", "inherit"] });
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.render(t), f / (FPS * SUB));
    const buf = await page.screenshot({ type: "jpeg", quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 300 === 0) console.log(`cuadro ${f}/${frames}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
}
await browser.close();
if (errores.length) throw new Error(errores.join("\n"));
