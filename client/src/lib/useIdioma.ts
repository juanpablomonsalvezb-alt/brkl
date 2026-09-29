import { useEffect } from "react";
import { SITE_URL } from "@shared/prerender-routes";

// Versiones equivalentes en cada idioma. Google usa estos pares (hreflang) para
// mostrar a cada persona la página en su idioma y no tratarlas como duplicadas.
const PARES: Record<string, { es: string; en: string }> = {
  "/": { es: "/", en: "/en" },
  "/en": { es: "/", en: "/en" },
};

/**
 * Fija <html lang> y los <link rel="alternate" hreflang> de la página mientras
 * está montada. El prerender captura ambos, así que los bots también los ven.
 */
export function useIdioma(idioma: "es" | "en", ruta: string) {
  useEffect(() => {
    const html = document.documentElement;
    const prevLang = html.lang;
    html.lang = idioma === "en" ? "en" : "es-CL";

    const par = PARES[ruta];
    const links: HTMLLinkElement[] = [];
    if (par) {
      for (const [hreflang, path] of [["es-CL", par.es], ["en", par.en], ["x-default", par.es]] as const) {
        const l = document.createElement("link");
        l.rel = "alternate";
        l.hreflang = hreflang;
        l.href = SITE_URL + path;
        l.dataset.idioma = "1";
        document.head.appendChild(l);
        links.push(l);
      }
    }
    return () => {
      html.lang = prevLang;
      links.forEach((l) => l.remove());
    };
  }, [idioma, ruta]);
}
