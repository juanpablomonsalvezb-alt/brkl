import { spawn, type ChildProcess } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import puppeteer from "puppeteer";

// Prerender estático para bots que no ejecutan JS (GPTBot, ClaudeBot,
// PerplexityBot, CCBot, la mayoría de crawlers de IA). El sitio es un SPA
// Vite/React puro (sin SSR) — sin esto, esos bots ven <div id="root"></div>
// vacío. Este script levanta el server ya buildeado, renderiza cada ruta
// con Chromium headless y guarda el HTML final. vercel.json enruta a los
// bots hacia estos archivos en vez del index.html vacío.

const PORT = 4790;
const ROUTES: { path: string; out: string }[] = [{ path: "/", out: "dist/public/prerendered/index.html" }];

function waitForServer(url: string, timeoutMs = 20000): Promise<void> {
  const start = Date.now();
  return new Promise((resolvePromise, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolvePromise();
      } catch {
        // servidor todavía no levanta
      }
      if (Date.now() - start > timeoutMs) return reject(new Error("Timeout esperando el servidor"));
      setTimeout(tick, 300);
    };
    tick();
  });
}

async function main() {
  const server: ChildProcess = spawn("node", ["dist/index.cjs"], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "production" },
    stdio: "inherit",
  });

  try {
    await waitForServer(`http://127.0.0.1:${PORT}/`);

    const browser = await puppeteer.launch({ headless: true });
    try {
      for (const route of ROUTES) {
        const page = await browser.newPage();
        await page.goto(`http://127.0.0.1:${PORT}${route.path}`, {
          waitUntil: "networkidle0",
          timeout: 30000,
        });
        // Deja que React termine de hidratar/renderizar contenido async (FAQ, etc.)
        await new Promise((r) => setTimeout(r, 1500));
        const html = await page.content();
        await page.close();

        const outPath = resolve(process.cwd(), route.out);
        await mkdir(dirname(outPath), { recursive: true });
        await writeFile(outPath, html, "utf-8");
        console.log(`Prerenderizado: ${route.path} -> ${route.out} (${html.length} bytes)`);
      }
    } finally {
      await browser.close();
    }
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error("Prerender falló:", err);
  process.exit(1);
});
