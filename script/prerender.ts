import { spawn, type ChildProcess } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import puppeteer from "puppeteer";
import { PRERENDER_ROUTES, SITE_URL, snapshotFile } from "../shared/prerender-routes";

// Prerender estático para bots que no ejecutan JS (GPTBot, ClaudeBot,
// PerplexityBot, CCBot, la mayoría de crawlers de IA). El sitio es un SPA
// Vite/React puro (sin SSR) — sin esto, esos bots ven <div id="root"></div>
// vacío. Este script levanta el server ya buildeado, renderiza cada ruta
// con Chromium headless y guarda el HTML final. vercel.json enruta a los
// bots hacia estos archivos en vez del index.html vacío.

const PORT = 4790;
const ROUTES = PRERENDER_ROUTES.map((path) => ({
  path,
  out: `dist/public/prerendered/${snapshotFile(path)}`,
}));

/**
 * El shell (client/index.html) trae la canónica, og:url y el FAQPage de la home.
 * Las páginas que no los reescriben al montar quedaban declarando ser la home:
 * Google veía la canónica apuntando a "/" y las dejaba fuera del índice. Acá se
 * fija la canónica de cada ruta, y el FAQPage de la home solo queda en la home
 * (Google exige que ese marcado describa preguntas visibles en esa página).
 */
// Corre dentro de Chromium vía page.evaluate: sin funciones internas con nombre,
// porque tsx las envuelve en un helper __name que no existe en el navegador.
function fijarIdentidad(args: { url: string; esHome: boolean }) {
  const specs: [string, string, string, string, string][] = [
    ['link[rel="canonical"]', "href", "link", "rel", "canonical"],
    ['meta[property="og:url"]', "content", "meta", "property", "og:url"],
  ];
  for (const [sel, attr, tag, key, value] of specs) {
    let el = document.head.querySelector(sel);
    if (!el) {
      el = document.createElement(tag);
      el.setAttribute(key, value);
      document.head.appendChild(el);
    }
    el.setAttribute(attr, args.url);
  }
  if (!args.esHome) {
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      if (/"@type"\s*:\s*"FAQPage"/.test(s.textContent || "")) s.remove();
    });
    // La imagen del hero de la home competía por ancho de banda con el LCP real de cada página.
    document.head.querySelectorAll('link[rel="preload"][as="image"]').forEach((l) => l.remove());
  }
}

/**
 * El snapshot se versiona en git, pero Vercel recompila los assets al desplegar y
 * les cambia el hash: el HTML quedaba apuntando a un /assets/index-XXXX.js que da
 * 404 en producción. Los bots no necesitan el JS —reciben el HTML ya renderizado—
 * así que se quitan todos los scripts salvo los JSON-LD, que son datos SEO.
 * De paso el snapshot queda más liviano y no intenta hidratar.
 */
function limpiarParaBots(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (tag) =>
    /type\s*=\s*["'](application\/ld\+json|speculationrules)["']/i.test(tag) ? tag : "",
  );
}

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

    const browser = await puppeteer.launch({
      headless: true,
      // Sin esto, Chrome se cuelga o crashea ("Target closed") en entornos con
      // sandbox restringido (contenedores, CI, algunas shells con permisos
      // limitados) — necesita renunciar a su propio sandbox y a /dev/shm.
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      // page.content() tardó justo 180s (el default) antes de fallar — sospecha
      // de que simplemente es lento en este entorno, no un cuelgue infinito.
      // Se sube el techo para confirmar/descartar antes de seguir investigando.
      protocolTimeout: 300000,
    });
    try {
      for (const route of ROUTES) {
        const page = await browser.newPage();
        // networkidle0/networkidle2 nunca se cumplían — algo en la página deja
        // conexiones activas indefinidamente (más de 2 a la vez), así que el
        // timeout se agotaba siempre, hasta en una máquina limpia de CI sin
        // problemas de sandbox. domcontentloaded no depende del estado de red;
        // el sleep de abajo ya cubre la hidratación de React y el fetch del FAQ.
        await page.goto(`http://127.0.0.1:${PORT}${route.path}`, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        // Deja que React termine de hidratar/renderizar contenido async (FAQ, etc.)
        // — antes esto se apoyaba en networkidle0/2 para "saber cuándo terminó",
        // ahora es la única señal de espera, así que va con más margen.
        await new Promise((r) => setTimeout(r, 3000));
        await page.evaluate(fijarIdentidad, {
          url: route.path === "/" ? `${SITE_URL}/` : `${SITE_URL}${route.path}`,
          esHome: route.path === "/",
        });
        const html = limpiarParaBots(await page.content());
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
