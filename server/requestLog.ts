import type { RequestHandler } from "express";

// Registro de peticiones /api: solo método, ruta, estado y duración. Nunca el cuerpo de la
// respuesta (puede traer claves de evaluaciones, datos personales o tokens).
export function requestLogger(log: (line: string) => void): RequestHandler {
  return (req, res, next) => {
    const start = Date.now();
    const path = req.path;
    res.on("finish", () => {
      if (path.startsWith("/api")) log(`${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`);
    });
    next();
  };
}
