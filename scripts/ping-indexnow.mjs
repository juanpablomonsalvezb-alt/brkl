/**
 * Notifica a IndexNow (Bing, Copilot, Yandex, DuckDuckGo) que hay URLs nuevas o
 * actualizadas, en vez de esperar a que las descubran solas.
 *
 * La clave ya estaba publicada en /<key>.txt desde antes, pero nada la usaba: el
 * sitio dependía del rastreo pasivo. Google no participa de IndexNow —para eso
 * está el sitemap enviado en Search Console—, pero Bing sí, y es lo que alimenta
 * a Copilot.
 *
 * Uso:
 *   node scripts/ping-indexnow.mjs            # todas las URLs del sitemap
 *   node scripts/ping-indexnow.mjs /blog/x/   # solo las rutas indicadas
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "www.barkleyinstituto.cl";
const BASE = `https://${HOST}`;
const KEY = "93c3bb1aebe943e6a46f5359cad8eea2";

function urlsDelSitemap() {
  const xml = readFileSync(join(ROOT, "client", "public", "sitemap.xml"), "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const args = process.argv.slice(2);
const urlList = args.length
  ? args.map((r) => (r.startsWith("http") ? r : `${BASE}${r.startsWith("/") ? r : `/${r}`}`))
  : urlsDelSitemap();

// La clave tiene que estar publicada y accesible: si no, IndexNow rechaza el lote
// completo y el error es silencioso.
const keyUrl = `${BASE}/${KEY}.txt`;
const keyRes = await fetch(keyUrl);
if (!keyRes.ok) {
  console.error(`✗ La clave no está accesible en ${keyUrl} (HTTP ${keyRes.status}). No se envía nada.`);
  process.exit(1);
}

const res = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: keyUrl, urlList }),
});

// 200 y 202 son ambos éxito: 202 significa aceptado y pendiente de validar la clave.
if (res.ok) {
  console.log(`✓ ${urlList.length} URL(s) notificadas a IndexNow (HTTP ${res.status})`);
} else {
  console.error(`✗ IndexNow respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
  process.exit(1);
}
