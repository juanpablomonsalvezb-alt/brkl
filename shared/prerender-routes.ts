// Única fuente de rutas públicas del SPA que se prerenderizan y se sirven con
// HTML completo (a personas y a bots por igual). La usan script/prerender.ts,
// script/build.ts y api/index.ts. Al agregar una ruta acá, sumarla también a
// los rewrites de vercel.json hacia /api/handler.js.
export const PRERENDER_ROUTES = [
  "/",
  "/adaptativo",
  "/sin-limites",
  "/adulto-acompanante",
  "/asi-esta-construido",
  "/todo-incluido",
  "/herramientas-de-estudio",
  "/preguntas-frecuentes",
  "/prepara-tus-examenes",
  "/together",
  "/electivos",
  "/tour-plataforma",
  "/privacidad",
  "/terminos",
  "/reembolso",
] as const;

export const SITE_URL = "https://www.barkleyinstituto.cl";

export function snapshotFile(route: string): string {
  return route === "/" ? "index.html" : `${route.slice(1)}.html`;
}
