// Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "../server/routes";
// Inlineados en el bundle vía esbuild (loader "text") para no depender de
// rutas de filesystem en el runtime serverless.
// @ts-ignore
import spaShellHtml from "../client/index.html";
// @ts-ignore
import prerenderedHtml from "../client/public/prerendered/index.html";

// Bots que no ejecutan JS (o cuya política prefiere HTML estático): reciben
// el snapshot prerenderizado en vez del shell vacío <div id="root"></div>.
// El caché estático de Vercel no reevalúa condiciones "has" por request en
// output 100% estático, así que la decisión se hace en código, acá.
const BOT_USER_AGENT = /(GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|anthropic-ai|Claude-Web|PerplexityBot|Perplexity-User|CCBot|Google-Extended|Applebot-Extended|cohere-ai|Bytespider|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|WhatsApp|Googlebot|bingbot)/i;

// Create Express app for Vercel
const app = express();

app.get("/", (req, res) => {
  const ua = req.headers["user-agent"] || "";
  // Nunca cachear en el edge: la respuesta depende del User-Agent y Vercel
  // no varía el caché por header en output estático — con cache-control
  // cacheaba la PRIMERA respuesta (shell o snapshot, según quién pegó primero)
  // y la servía a todos los demás sin importar su User-Agent.
  res.setHeader("Cache-Control", "no-store");
  res.type("html").send(BOT_USER_AGENT.test(ua) ? prerenderedHtml : spaShellHtml);
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
