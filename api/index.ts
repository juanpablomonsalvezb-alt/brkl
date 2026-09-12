// Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "../server/routes";
// Inlineados en el bundle vía esbuild (loader "text") para no depender de
// rutas de filesystem en el runtime serverless.
// El HTML COMPILADO (con el bundle JS real /assets/index-HASH.js), no el
// fuente de client/index.html (ese referencia /src/main.tsx, solo válido en
// dev con Vite — en prod causaba pantalla en blanco, 404 del script).
// @ts-ignore
import spaShellHtml from "../dist/public/index.html";
// @ts-ignore
import prerenderedHtml from "../client/public/prerendered/index.html";
// @ts-ignore
import prerenderedAdaptativoHtml from "../client/public/prerendered/adaptativo.html";
// @ts-ignore
import prerenderedSinLimitesHtml from "../client/public/prerendered/sin-limites.html";

// Bots que no ejecutan JS (o cuya política prefiere HTML estático): reciben
// el snapshot prerenderizado en vez del shell vacío <div id="root"></div>.
// El caché estático de Vercel no reevalúa condiciones "has" por request en
// output 100% estático, así que la decisión se hace en código, acá.
const BOT_USER_AGENT = /(GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|anthropic-ai|Claude-Web|PerplexityBot|Perplexity-User|CCBot|Google-Extended|Applebot-Extended|cohere-ai|Bytespider|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|WhatsApp|Googlebot|bingbot)/i;

/**
 * Antes la home servía a las personas el shell vacío <div id="root"></div>:
 * el navegador no pintaba NADA hasta descargar, parsear y ejecutar ~600KB de
 * JS. Medido con Lighthouse, eso dejaba el LCP en 8.2s.
 *
 * Ahora se sirve el shell compilado (que trae los hashes vigentes de
 * /assets/index-HASH.js y .css) con el contenido real del snapshot inyectado
 * dentro del div#root. El navegador pinta de inmediato y, cuando el bundle
 * termina de cargar, createRoot() de client/src/main.tsx reemplaza ese DOM.
 * Sin riesgo de hydration mismatch: createRoot limpia el contenedor y
 * renderiza de cero (no es hydrateRoot).
 *
 * Por qué fusionar y no servir el snapshot tal cual: script/prerender.ts le
 * quita todos los <script> a propósito, porque los hashes de assets cambian
 * en cada deploy y quedarían en 404.
 *
 * Solo aplica a "/": el <head> viene del shell, que es el de la home. Usarlo
 * en /adaptativo o /sin-limites les pisaría su title/description/canonical
 * propios — esas rutas siguen con el esquema anterior (bot: snapshot con su
 * meta correcta; persona: shell + React, que fija la meta al montar).
 */
function fusionarHome(shell: string, snapshot: string): string {
  const marcadorVacio = '<div id="root"></div>';
  const marcadorInicio = '<div id="root">';

  const inicio = snapshot.indexOf(marcadorInicio);
  if (inicio === -1 || !shell.includes(marcadorVacio)) return shell;

  // Recorre balanceando <div>/</div> para encontrar el cierre real del root
  // (indexOf del primer </div> cortaría en el primer hijo anidado).
  const desde = inicio + marcadorInicio.length;
  let profundidad = 1;
  let i = desde;
  while (i < snapshot.length) {
    const abre = snapshot.indexOf("<div", i);
    const cierra = snapshot.indexOf("</div>", i);
    if (cierra === -1) return shell;
    if (abre !== -1 && abre < cierra) {
      profundidad++;
      i = abre + 4;
    } else {
      profundidad--;
      if (profundidad === 0) {
        const contenido = snapshot.slice(desde, cierra);
        // Función replacer, no string: el HTML renderizado puede contener
        // "$&", "$'" o "$$", que en un string de reemplazo se expanden como
        // patrones y corromperían la salida.
        return shell.replace(marcadorVacio, () => `<div id="root">${contenido}</div>`);
      }
      i = cierra + 6;
    }
  }
  // Snapshot malformado: se sirve el shell, que siempre funciona.
  return shell;
}

// Se calcula una sola vez por instancia (cold start), no por request.
const homeHtml = fusionarHome(spaShellHtml, prerenderedHtml);

// Create Express app for Vercel
const app = express();

app.get("/", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.type("html").send(homeHtml);
});

app.get("/adaptativo", (req, res) => {
  const ua = req.headers["user-agent"] || "";
  res.setHeader("Cache-Control", "no-store");
  res.type("html").send(BOT_USER_AGENT.test(ua) ? prerenderedAdaptativoHtml : spaShellHtml);
});

app.get("/sin-limites", (req, res) => {
  const ua = req.headers["user-agent"] || "";
  res.setHeader("Cache-Control", "no-store");
  res.type("html").send(BOT_USER_AGENT.test(ua) ? prerenderedSinLimitesHtml : spaShellHtml);
});

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
