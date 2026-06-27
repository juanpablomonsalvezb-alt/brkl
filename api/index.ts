// Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "../server/routes";

// Create Express app for Vercel
const app = express();

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
