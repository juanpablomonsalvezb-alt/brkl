// Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "../server/routes";
// Inlineados en el bundle vía esbuild (loader "text" y el módulo virtual que
// arma script/build.ts) para no depender de rutas de filesystem en runtime.
// El HTML COMPILADO (con el bundle JS real /assets/index-HASH.js), no el
// fuente de client/index.html (ese referencia /src/main.tsx, solo válido en dev).
// @ts-ignore
import spaShellHtml from "../dist/public/index.html";
// @ts-ignore
import snapshots from "virtual:prerendered";
import { PRERENDER_ROUTES } from "../shared/prerender-routes";

/**
 * Cada ruta pública se sirve con el MISMO HTML a personas y a bots:
 * el <head> del snapshot (title, description, canónica, og, JSON-LD propios de
 * esa página) + el contenido ya renderizado dentro de #root + los assets
 * vigentes del shell compilado.
 *
 * - Bots que no ejecutan JS (GPTBot, ClaudeBot, PerplexityBot…) ven la página
 *   completa en vez de <div id="root"></div>.
 * - Google recibe una sola versión: antes los bots veían el snapshot y las
 *   personas el shell vacío, lo que roza el "cloaking".
 * - Las personas ven contenido en el primer pintado (LCP) en vez de esperar el
 *   bundle. Cuando carga, createRoot() de client/src/main.tsx reemplaza el DOM
 *   (no es hydrateRoot, así que no hay hydration mismatch).
 *
 * El snapshot no trae <script> propios (script/prerender.ts los quita porque
 * los hashes de /assets cambian en cada deploy); los assets se toman del shell.
 */
const ASSET_TAG = /<(?:script|link)\b[^>]*["']\/assets\/[^>]*>(?:\s*<\/script>)?/gi;
const HEAD = /(<head[^>]*>)([\s\S]*?)(<\/head>)/i;

function contenidoDeRoot(snapshot: string): string | null {
  const marcadorInicio = '<div id="root">';
  const inicio = snapshot.indexOf(marcadorInicio);
  if (inicio === -1) return null;
  // Recorre balanceando <div>/</div> para encontrar el cierre real del root
  // (indexOf del primer </div> cortaría en el primer hijo anidado).
  const desde = inicio + marcadorInicio.length;
  let profundidad = 1;
  let i = desde;
  while (i < snapshot.length) {
    const abre = snapshot.indexOf("<div", i);
    const cierra = snapshot.indexOf("</div>", i);
    if (cierra === -1) return null;
    if (abre !== -1 && abre < cierra) {
      profundidad++;
      i = abre + 4;
    } else {
      profundidad--;
      if (profundidad === 0) return snapshot.slice(desde, cierra);
      i = cierra + 6;
    }
  }
  return null;
}

function componer(shell: string, snapshot: string): string {
  const marcadorVacio = '<div id="root"></div>';
  const headShell = shell.match(HEAD);
  const headSnap = snapshot.match(HEAD);
  const contenido = contenidoDeRoot(snapshot);
  // Snapshot malformado: se sirve el shell, que siempre funciona.
  if (!headShell || !headSnap || contenido === null || !shell.includes(marcadorVacio)) return shell;

  const assets = headShell[2].match(ASSET_TAG) ?? [];
  const head = headSnap[2].replace(ASSET_TAG, "") + assets.join("\n");
  // Funciones replacer, no strings: el HTML puede contener "$&", "$'" o "$$",
  // que en un string de reemplazo se expanden como patrones.
  return shell
    .replace(HEAD, (_m, abre, _h, cierra) => `${abre}${head}${cierra}`)
    .replace(marcadorVacio, () => `<div id="root">${contenido}</div>`);
}

// Se calcula una sola vez por instancia (cold start), no por request.
const paginas = new Map<string, string>();
for (const ruta of PRERENDER_ROUTES) {
  const snapshot = (snapshots as Record<string, string>)[ruta];
  if (snapshot) paginas.set(ruta, componer(spaShellHtml, snapshot));
}

// Create Express app for Vercel
const app = express();

for (const [ruta, html] of paginas) {
  app.get(ruta, (_req, res) => {
    // no-cache (no no-store): revalida en cada visita, así nunca sirve un build
    // viejo, pero no bloquea el back/forward cache del navegador.
    res.setHeader("Cache-Control", "no-cache");
    res.type("html").send(html);
  });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes (without starting HTTP server)
let routesInitialized = false;

async function initializeApp() {
  if (routesInitialized) return;
  
  // Create a dummy HTTP server for route registration
  const { createServer } = await import("http");
  const httpServer = createServer(app);
  
  await registerRoutes(httpServer, app);
  
  // Error handler
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    
    if (res.headersSent) {
      return next(err);
    }
    
    return res.status(status).json({ message });
  });
  
  // Vercel sirve client/dist/public como estáticos vía outputDirectory + rewrites,
  // no acá: esta función solo maneja /api/*.
  routesInitialized = true;
}

// Export handler for Vercel
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  await initializeApp();
  
  // Delegate to Express app
  return app(req as any, res as any, () => {
    res.status(404).json({ message: "Not found" });
  });
}
