import { useEffect } from "react";
import { useLocation } from "wouter";
import { canonicalFor, isPublicSeoRoute } from "@shared/seo-policy";

// Las páginas mantienen sus títulos; esta capa sincroniza la identidad también
// al navegar desde otra ruta, no solamente al producir el snapshot.
export function PageSeo() {
  const [location] = useLocation();
  useEffect(() => {
    const publicPage = isPublicSeoRoute(location);
    function setMeta(selector: string, attribute: string, value: string, create: () => HTMLElement) {
      const el = document.head.querySelector(selector) ?? document.head.appendChild(create());
      if (el.getAttribute(attribute) !== value) el.setAttribute(attribute, value);
    }
    function meta(key: string, value: string, property = true) {
      const attr = property ? "property" : "name";
      setMeta(`meta[${attr}="${key}"]`, "content", value, () => {
        const el = document.createElement("meta"); el.setAttribute(attr, key); return el;
      });
    }
    function sync() {
      const robots = document.head.querySelectorAll('meta[name="robots"]');
      // Una sola directiva: no heredar noindex del fallback en páginas públicas.
      robots.forEach((el, i) => { if (i > 0) el.remove(); });
      meta("robots", publicPage ? "index, follow" : "noindex, nofollow", false);
      if (publicPage) {
        setMeta('link[rel="canonical"]', "href", canonicalFor(location), () => {
          const el = document.createElement("link"); el.rel = "canonical"; return el;
        });
        meta("og:url", canonicalFor(location));
      } else {
        document.head.querySelectorAll('link[rel="canonical"], meta[property="og:url"]').forEach((el) => el.remove());
      }
      const title = document.title;
      const description = document.head.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
      meta("og:title", title); meta("twitter:title", title, false);
      meta("og:description", description); meta("twitter:description", description, false);
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.head, { subtree: true, childList: true, attributes: true, characterData: true });
    return () => observer.disconnect();
  }, [location]);
  return null;
}
