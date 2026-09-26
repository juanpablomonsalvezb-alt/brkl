import { useEffect } from "react";

// Título y descripción propios de la página mientras está montada; al salir
// restaura los anteriores. noindex agrega <meta name="robots"> y lo quita al salir.
export function usePageMeta({ title, description, noindex }: { title: string; description?: string; noindex?: boolean }) {
  useEffect(() => {
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
      document.title = prevTitle;
      if (prevDesc !== null) desc?.setAttribute("content", prevDesc);
      robots?.remove();
    };
  }, [title, description, noindex]);
}
