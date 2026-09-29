import { useEffect } from "react";

// Título y descripción propios de la página mientras está montada; al salir
// restaura los anteriores. noindex agrega <meta name="robots"> y lo quita al salir.
// ogLocale además reescribe la vista previa al compartir (og:/twitter:) con el
// mismo título y descripción: la del shell está en español y /en la necesita en inglés.
export function usePageMeta({ title, description, noindex, ogLocale }: { title: string; description?: string; noindex?: boolean; ogLocale?: string }) {
  useEffect(() => {
    const previos: [Element, string][] = [];
    if (ogLocale) {
      const valores: [string, string | undefined][] = [
        ['meta[property="og:title"]', title], ['meta[name="twitter:title"]', title],
        ['meta[property="og:description"]', description], ['meta[name="twitter:description"]', description],
        ['meta[property="og:locale"]', ogLocale],
      ];
      for (const [sel, v] of valores) {
        const el = document.querySelector(sel);
        if (el && v) { previos.push([el, el.getAttribute("content") ?? ""]); el.setAttribute("content", v); }
      }
    }
    const prevTitle = document.title;
    document.title = title;

    const desc = document.querySelector('meta[name="description"]');
    const prevDesc = desc?.getAttribute("content") ?? null;
    if (description) desc?.setAttribute("content", description);

    let robots: HTMLMetaElement | null = null;
    if (noindex) {
      robots = document.createElement("meta");
      robots.name = "robots";
      robots.content = "noindex, follow";
      document.head.appendChild(robots);
    }

    return () => {
      previos.forEach(([el, v]) => el.setAttribute("content", v));
      document.title = prevTitle;
      if (prevDesc !== null) desc?.setAttribute("content", prevDesc);
      robots?.remove();
    };
  }, [title, description, noindex, ogLocale]);
}
