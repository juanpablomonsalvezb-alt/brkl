// Superpone capa.html (títulos, destellos, grano, cierre) sobre out/base.mp4.
//   node video/trailer/componer.mjs            → out/trailer-sin-audio.mp4
//   node video/trailer/componer.mjs --stills 12,20 → PNG de la capa sola en esos segundos
import puppeteer from "puppeteer";
import { spawn } from "child_process";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const aqui = dirname(fileURLToPath(import.meta.url));
const edl = JSON.parse(readFileSync(resolve(aqui, "edl.json"), "utf8"));
const FPS = edl.fps;
const idx = process.argv.indexOf("--stills");
const stills = idx > -1 ? process.argv[idx + 1].split(",").map(Number) : null;

const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve(aqui, "capa.html")).href, { waitUntil: "load" });
await page.evaluate(async (e) => { await window.listo; window.preparar(e); }, edl);

if (stills) {
  for (const s of stills) {
    await page.evaluate((t) => window.render(t), s);
    await page.screenshot({ path: resolve(aqui, "out", `capa-${String(s).replace(".", "_")}.png`), omitBackground: true });
  }
} else {
  const frames = Math.round(edl.duracion * FPS);
  const ff = spawn(process.env.FFMPEG || "ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error",
    "-i", resolve(aqui, "out", "base.mp4"),
    "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
    "-filter_complex", "[0:v][1:v]overlay=format=auto:shortest=1,format=yuv420p[v]", "-map", "[v]",
    "-t", String(edl.duracion), "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-r", String(FPS),
    resolve(aqui, "out", "trailer-sin-audio.mp4"),
  ], { stdio: ["pipe", "inherit", "inherit"] });
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.render(t), f / FPS);
    const buf = await page.screenshot({ type: "png", omitBackground: true });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 240 === 0) console.log(`cuadro ${f}/${frames}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
}
await browser.close();
