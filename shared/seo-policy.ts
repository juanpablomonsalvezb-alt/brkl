import { PRERENDER_ROUTES, SITE_URL } from "./prerender-routes";

// Lista positiva: las rutas nuevas son noindex hasta decidir que son públicas.
// No es autenticación ni reemplaza controles de acceso.
export function isPublicSeoRoute(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return (PRERENDER_ROUTES as readonly string[]).includes(path);
}

export function canonicalFor(pathname: string): string {
  return SITE_URL + (pathname.replace(/\/+$/, "") || "/");
}

export function privateFallback(html: string): string {
  return html
    .replace(/\s*<link rel="canonical"[^>]*>/gi, "")
    .replace(/\s*<meta property="og:url"[^>]*>/gi, "")
    .replace(/\s*<meta name="robots"[^>]*>/gi, "")
    .replace(/\s*<link rel="preload" as="image"[^>]*>/gi, "")
    .replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/head>/i, '<meta name="robots" content="noindex, nofollow">\n</head>');
}

export function assertSnapshot(html: string, route: string): void {
  if (!/<h1[\s>]/i.test(html) || /Cargando preguntas/.test(html)) {
    throw new Error(`Snapshot incompleto: ${route}`);
  }
  if (!html.includes(`href="${canonicalFor(route)}"`)) {
    throw new Error(`Snapshot sin canónica propia: ${route}`);
  }
  if (/<meta name="robots"[^>]*noindex/i.test(html)) {
    throw new Error(`Snapshot público con noindex: ${route}`);
  }
  if (route === "/preguntas-frecuentes" && (!html.includes("FAQPage") || !html.includes("data-public-faqs"))) {
    throw new Error("Snapshot FAQ sin respuestas y marcado");
  }
}
