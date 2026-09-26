import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, rename, writeFile } from "fs/promises";
import { existsSync, readFileSync } from "fs";
import type { Plugin } from "esbuild";
import { PRERENDER_ROUTES, snapshotFile } from "../shared/prerender-routes";
import { aplicarPrecios, marcadoresDesconocidos } from "../shared/precios";
import { readdir } from "fs/promises";
import { join } from "path";

// Reemplaza {{precio_*}} en los archivos estáticos ya copiados a dist/public
// (landings, blog, llms.txt, index.html). Un marcador mal escrito corta el build
// en vez de publicarse crudo.
async function aplicarPreciosEnDist(dir = "dist/public"): Promise<void> {
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (!["assets", "videos", "images", "fonts"].includes(entrada.name)) await aplicarPreciosEnDist(ruta);
      continue;
    }
    if (!/\.(html|txt|xml)$/.test(entrada.name)) continue;
    const original = await readFile(ruta, "utf-8");
    if (!original.includes("{{")) continue;
    const desconocidos = marcadoresDesconocidos(original);
    if (desconocidos.length) throw new Error(`Marcador de precio desconocido en ${ruta}: ${desconocidos.join(", ")}`);
    await writeFile(ruta, aplicarPrecios(original));
  }
}

// Módulo virtual "virtual:prerendered": { "/ruta": "<html del snapshot>" } para
// todas las rutas de shared/prerender-routes.ts que tengan snapshot versionado.
const snapshotsPlugin: Plugin = {
  name: "prerendered-snapshots",
  setup(build) {
    build.onResolve({ filter: /^virtual:prerendered$/ }, (args) => ({ path: args.path, namespace: "prerendered" }));
    build.onLoad({ filter: /.*/, namespace: "prerendered" }, () => {
      const mapa: Record<string, string> = {};
      for (const ruta of PRERENDER_ROUTES) {
        const archivo = `client/public/prerendered/${snapshotFile(ruta)}`;
        if (existsSync(archivo)) mapa[ruta] = readFileSync(archivo, "utf-8");
        else console.warn(`sin snapshot para ${ruta} (correr npm run prerender)`);
      }
      return { contents: `export default ${JSON.stringify(mapa)};`, loader: "js" };
    });
  },
};

/**
 * app.html es el fallback de las rutas del SPA sin snapshot (dashboard, salas
 * privadas de Together, 404…). Heredaba la canónica, og:url y el FAQPage de la
 * home: cada una de esas URLs le decía a Google "soy la home". Sin canónica,
 * Google asume la propia URL.
 */
function limpiarFallback(html: string): string {
  return html
    .replace(/\s*<link rel="canonical"[^>]*>/i, "")
    .replace(/\s*<meta property="og:url"[^>]*>/i, "")
    .replace(/\s*<link rel="preload" as="image"[^>]*>/gi, "")
    .replace(/\s*<script type="application\/ld\+json">(?:(?!<\/script>)[\s\S])*?"FAQPage"[\s\S]*?<\/script>/gi, "");
}

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "better-sqlite3",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "openid-client",
  "passport",
  "passport-local",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();
  await aplicarPreciosEnDist();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  console.log("building vercel api handler...");
  await esbuild({
    entryPoints: ["api/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "api/handler.js",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    // El shell SPA y el snapshot prerenderizado para bots se inlinean como texto
    // en el bundle — así la función no depende de rutas de filesystem en runtime.
    loader: { ".html": "text" },
    plugins: [snapshotsPlugin],
    logLevel: "info",
  });

  // El prerender para bots (GPTBot, ClaudeBot, PerplexityBot, etc.) NO corre acá:
  // requiere levantar Chromium + el server completo, y el contenedor de build de
  // Vercel no lo soporta de forma confiable (sandboxing). Se genera localmente con
  // `npm run prerender` y se versiona en client/public/prerendered/ — Vite lo copia
  // como asset estático en cada build sin ejecutar nada adicional.

  if (process.env.VERCEL) {
    // Vercel prioriza un archivo estático que exista en la ruta exacta por sobre
    // cualquier rewrite — con dist/public/index.html presente, "/" nunca llega a
    // /api/handler.js y el bot-detection en código nunca se ejecuta.
    //
    // No se borra: el resto de las rutas del SPA (/privacidad, /planes-2026,
    // /dashboard…) dependen del rewrite fallback hacia ese archivo, y sin él
    // devuelven 404. Se renombra a app.html — "/" queda libre para la función,
    // y el fallback del SPA apunta a app.html en vercel.json.
    await rename("dist/public/index.html", "dist/public/app.html");
    await writeFile("dist/public/app.html", limpiarFallback(await readFile("dist/public/app.html", "utf-8")));
    console.log("dist/public/index.html → app.html (Vercel): '/' la sirve api/handler.js, el resto del SPA cae en app.html");
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
