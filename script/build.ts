import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, rename } from "fs/promises";

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
    console.log("dist/public/index.html → app.html (Vercel): '/' la sirve api/handler.js, el resto del SPA cae en app.html");
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
