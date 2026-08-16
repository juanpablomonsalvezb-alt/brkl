/**
 * Auditoría SEO determinística contra producción.
 *
 * Existe porque las auditorías "a mano" revisaban cosas distintas cada vez: una
 * pasada daba 7/10 y la siguiente encontraba defectos que ya estaban ahí. Con una
 * lista fija, dos corridas del mismo sitio dan el mismo resultado, y una nota
 * solo mejora o empeora cuando el sitio cambia — no cuando cambia el auditor.
 *
 * Cada control es una afirmación verificable. Si algo no se puede comprobar
 * automáticamente, se declara como NO CUBIERTO en vez de asumirse bueno.
 *
 * Uso: node scripts/audit-seo.mjs [--json]
 */
import { mkdirSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HIST = join(ROOT, "seo-history");

const BASE = "https://www.barkleyinstituto.cl";
const BOT = "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)";
const HUM = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36";
const JSON_OUT = process.argv.includes("--json");
const GUARDAR = process.argv.includes("--save");
const DIFF = process.argv.includes("--diff");

const resultados = [];
const ok = (area, ctrl, detalle = "") => resultados.push({ area, ctrl, estado: "ok", detalle });
const fallo = (area, ctrl, detalle) => resultados.push({ area, ctrl, estado: "FALLA", detalle });
const nc = (area, ctrl, detalle) => resultados.push({ area, ctrl, estado: "no cubierto", detalle });

const cache = new Map();
async function traer(ruta, ua = BOT) {
  const clave = `${ua === BOT ? "bot" : "hum"}:${ruta}`;
  if (!cache.has(clave)) {
    const r = await fetch(`${BASE}${ruta}`, { headers: { "User-Agent": ua }, redirect: "follow" });
    // Se lee el cuerpo salvo que sea binario: el sitemap llega como application/xml
    // y filtrar por "text" lo dejaba vacío, reportando "0 URLs" falsamente.
    const ct = r.headers.get("content-type") ?? "";
    const binario = /^(image|video|audio|font)\//.test(ct) || ct.includes("octet-stream");
    cache.set(clave, { status: r.status, url: r.url, html: binario ? "" : await r.text() });
  }
  return cache.get(clave);
}

const meta = (html, prop) =>
  html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${prop}["'][^>]+content=["']([^"']*)["']`, "i"))?.[1] ?? null;
const titulo = (html) => html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? null;
const canonical = (html) => html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i)?.[1] ?? null;
const schemas = (html) => [...new Set([...html.matchAll(/"@type"\s*:\s*"([A-Za-z]+)"/g)].map((m) => m[1]))];

/* ── 1. Sitemap: existe, es válido y todas sus URLs responden 200 ────────── */
async function auditarSitemap() {
  const A = "Sitemap";
  const r = await traer("/sitemap.xml");
  if (r.status !== 200) return fallo(A, "accesible", `HTTP ${r.status}`);
  const urls = [...r.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length === 0) return fallo(A, "tiene URLs", "0 encontradas");
  ok(A, "accesible y con URLs", `${urls.length} URLs`);

  const rotas = [];
  const redirigidas = [];
  for (const u of urls) {
    const res = await fetch(u, { headers: { "User-Agent": BOT }, redirect: "manual" });
    if (res.status >= 400) rotas.push(`${u} → ${res.status}`);
    else if (res.status >= 300) redirigidas.push(`${u} → ${res.status}`);
  }
  rotas.length ? fallo(A, "todas las URLs responden", rotas.join(" | ")) : ok(A, "todas las URLs responden");
  // Una URL del sitemap que redirige hace perder un salto de rastreo en cada visita.
  redirigidas.length
    ? fallo(A, "ninguna URL redirige", redirigidas.join(" | "))
    : ok(A, "ninguna URL redirige");
  return urls;
}

/* ── 2. Snapshot para bots: contenido real y sin recursos rotos ──────────── */
async function auditarPrerender(rutas) {
  const A = "Prerender";
  for (const ruta of rutas) {
    const bot = await traer(ruta, BOT);
    const hum = await traer(ruta, HUM);
    if (bot.status !== 200) { fallo(A, `${ruta} responde a bots`, `HTTP ${bot.status}`); continue; }

    const textoBot = bot.html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").trim();
    textoBot.length > 1500
      ? ok(A, `${ruta} entrega contenido renderizado`, `${textoBot.length} caracteres`)
      : fallo(A, `${ruta} entrega contenido renderizado`, `solo ${textoBot.length} caracteres`);

    bot.html.length !== hum.html.length
      ? ok(A, `${ruta} distingue bot de humano`)
      : fallo(A, `${ruta} distingue bot de humano`, "misma respuesta para ambos");

    // Scripts referenciados que dan 404: el snapshot se versiona y los hashes de
    // assets cambian en cada build, así que se desincroniza sin avisar.
    const srcs = [...bot.html.matchAll(/<script[^>]+src=["'](\/[^"']+)["']/g)].map((m) => m[1]);
    const rotos = [];
    for (const s of srcs) {
      const res = await fetch(`${BASE}${s}`, { method: "HEAD", headers: { "User-Agent": BOT } });
      if (res.status >= 400) rotos.push(`${s} → ${res.status}`);
    }
    rotos.length
      ? fallo(A, `${ruta} sin scripts rotos`, rotos.join(" | "))
      : ok(A, `${ruta} sin scripts rotos`, srcs.length ? `${srcs.length} scripts ok` : "sin scripts (correcto)");
  }
}

/* ── 3. Metadatos por página: únicos y correctos ─────────────────────────── */
async function auditarMetadatos(rutas) {
  const A = "Metadatos";
  const titulos = new Map();
  const descripciones = new Map();

  for (const ruta of rutas) {
    const { html, status } = await traer(ruta);
    if (status !== 200) continue;

    const t = titulo(html);
    const d = meta(html, "description");
    const c = canonical(html);

    if (!t) fallo(A, `${ruta} tiene title`, "ausente");
    else if (t.length > 65) fallo(A, `${ruta} title ≤65 caracteres`, `${t.length}: "${t}"`);
    else ok(A, `${ruta} title`, `${t.length} caracteres`);

    if (!d) fallo(A, `${ruta} tiene description`, "ausente");
    else if (d.length > 165) fallo(A, `${ruta} description ≤165`, `${d.length} caracteres`);
    else ok(A, `${ruta} description`, `${d.length} caracteres`);

    // El canonical tiene que apuntar a la propia página. Apuntar al home hace que
    // Google trate la página como duplicado y la excluya del índice.
    const esperado = `${BASE}${ruta}`;
    if (!c) fallo(A, `${ruta} tiene canonical`, "ausente");
    else if (c.replace(/\/$/, "") !== esperado.replace(/\/$/, ""))
      fallo(A, `${ruta} canonical propio`, `apunta a ${c}`);
    else ok(A, `${ruta} canonical propio`);

    if (t) titulos.set(t, [...(titulos.get(t) ?? []), ruta]);
    if (d) descripciones.set(d, [...(descripciones.get(d) ?? []), ruta]);
  }

  const tDup = [...titulos.entries()].filter(([, r]) => r.length > 1);
  tDup.length ? fallo(A, "títulos únicos", tDup.map(([t, r]) => `"${t.slice(0, 40)}" en ${r.length}`).join(" | "))
              : ok(A, "títulos únicos");
  const dDup = [...descripciones.entries()].filter(([, r]) => r.length > 1);
  dDup.length ? fallo(A, "descripciones únicas", dDup.map(([, r]) => `${r.length} páginas comparten una`).join(" | "))
              : ok(A, "descripciones únicas");
}

/* ── 4. Datos estructurados ──────────────────────────────────────────────── */
async function auditarSchema() {
  const A = "Datos estructurados";
  const exigidos = {
    "/": ["Organization", "FAQPage"],
    "/adaptativo": [],
    "/examenes-libres-4-medio/": ["Course", "FAQPage", "BreadcrumbList"],
    "/blog/tdah-y-colegio-presencial/": ["Article", "FAQPage", "BreadcrumbList"],
  };
  for (const [ruta, tipos] of Object.entries(exigidos)) {
    const { html, status } = await traer(ruta);
    if (status !== 200) { fallo(A, `${ruta} accesible`, `HTTP ${status}`); continue; }
    const presentes = schemas(html);
    const faltan = tipos.filter((t) => !presentes.includes(t));
    faltan.length ? fallo(A, `${ruta} schemas`, `faltan: ${faltan.join(", ")}`)
                  : ok(A, `${ruta} schemas`, presentes.join(", ") || "ninguno");
  }
}

/* ── 5. Social ───────────────────────────────────────────────────────────── */
async function auditarSocial(rutas) {
  const A = "Social";
  const imagenes = new Map();
  for (const ruta of rutas) {
    const { html, status } = await traer(ruta);
    if (status !== 200) continue;
    const img = meta(html, "og:image");
    const url = meta(html, "og:url");
    if (!img) fallo(A, `${ruta} og:image`, "ausente");
    else imagenes.set(img, [...(imagenes.get(img) ?? []), ruta]);
    if (url && url.replace(/\/$/, "") !== `${BASE}${ruta}`.replace(/\/$/, ""))
      fallo(A, `${ruta} og:url propio`, `apunta a ${url}`);
  }
  for (const [img] of imagenes) {
    const r = await fetch(img, { method: "HEAD" });
    r.ok ? ok(A, "og:image accesible", img.split("/").pop())
         : fallo(A, "og:image accesible", `${img} → ${r.status}`);
  }
  const compartida = [...imagenes.values()].find((r) => r.length > 3);
  if (compartida)
    nc(A, "og:image por página", `${compartida.length} páginas comparten la misma imagen (no rompe nada, baja el CTR al compartir)`);
}

/* ── 6. Rastreo: robots, llms.txt, IndexNow ─────────────────────────────── */
async function auditarRastreo() {
  const A = "Rastreo";
  const robots = await traer("/robots.txt");
  if (robots.status !== 200) fallo(A, "robots.txt", `HTTP ${robots.status}`);
  else {
    ok(A, "robots.txt accesible");
    robots.html.includes("Sitemap:") ? ok(A, "robots referencia sitemap") : fallo(A, "robots referencia sitemap", "ausente");
    /Disallow:\s*\/\s*$/m.test(robots.html)
      ? fallo(A, "robots no bloquea el sitio", "hay un Disallow: / global")
      : ok(A, "robots no bloquea el sitio");
  }

  const llms = await traer("/llms.txt");
  llms.status === 200 ? ok(A, "llms.txt", `${llms.html.length} caracteres`)
                      : fallo(A, "llms.txt", `HTTP ${llms.status}`);

  const key = await traer("/93c3bb1aebe943e6a46f5359cad8eea2.txt");
  key.status === 200 ? ok(A, "clave IndexNow accesible") : fallo(A, "clave IndexNow accesible", `HTTP ${key.status}`);
}

/* ── 7. Lo que esta auditoría NO comprueba ──────────────────────────────── */
function declararNoCubierto() {
  const A = "No cubierto";
  nc(A, "Core Web Vitals", "requiere datos de campo reales (Search Console / CrUX)");
  nc(A, "posiciones y clics", "requiere Search Console; esta auditoría solo mira el sitio");
  nc(A, "backlinks", "requiere herramienta externa");
  nc(A, "desborde horizontal en móvil", "requiere navegador; se revisa con el script de responsive");
  nc(A, "calidad del contenido", "juicio humano");
}

const rutasFijas = ["/", "/adaptativo", "/blog/", "/guia-examenes-libres/", "/examenes-libres-4-medio/", "/blog/tdah-y-colegio-presencial/"];

await auditarSitemap();
await auditarPrerender(["/", "/adaptativo"]);
await auditarMetadatos(rutasFijas);
await auditarSchema();
await auditarSocial(rutasFijas);
await auditarRastreo();
declararNoCubierto();

if (JSON_OUT) {
  console.log(JSON.stringify(resultados, null, 2));
} else {
  let area = "";
  for (const r of resultados) {
    if (r.area !== area) { area = r.area; console.log(`\n${area}`); }
    const icono = r.estado === "ok" ? "  ok  " : r.estado === "FALLA" ? "FALLA " : "  --  ";
    console.log(`${icono} ${r.ctrl}${r.detalle ? ` — ${r.detalle}` : ""}`);
  }
}

/* ── Historial: cada corrida se guarda para poder comparar en el tiempo. Sin
      esto la auditoría es una foto y no se puede saber si vamos mejorando. ── */
function corridasPrevias() {
  try {
    // Solo las corridas de esta auditoría: el mismo directorio guarda también los
    // reportes de Search Console (gsc-*.json), que tienen otra forma.
    return readdirSync(HIST).filter((f) => f.endsWith(".json") && !f.startsWith("gsc-")).sort();
  } catch {
    return [];
  }
}

function guardar() {
  mkdirSync(HIST, { recursive: true });
  const sello = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "");
  const archivo = join(HIST, `${sello}.json`);
  writeFileSync(archivo, JSON.stringify({ fecha: new Date().toISOString(), resultados }, null, 2));
  return archivo;
}

function comparar() {
  const previas = corridasPrevias();
  if (previas.length === 0) {
    console.log("\nSin corridas anteriores: esta queda como línea base.");
    return;
  }
  const anterior = JSON.parse(readFileSync(join(HIST, previas[previas.length - 1]), "utf8"));
  if (!Array.isArray(anterior.resultados)) {
    console.log("\nLa corrida anterior no tiene el formato esperado; no se compara.");
    return 0;
  }
  const clave = (r) => `${r.area}|${r.ctrl}`;
  const antes = new Map(anterior.resultados.map((r) => [clave(r), r.estado]));
  const ahora = new Map(resultados.map((r) => [clave(r), r.estado]));

  const arreglados = [...ahora].filter(([k, e]) => e === "ok" && antes.get(k) === "FALLA").map(([k]) => k);
  const rotos = [...ahora].filter(([k, e]) => e === "FALLA" && antes.get(k) === "ok").map(([k]) => k);
  const nuevos = [...ahora.keys()].filter((k) => !antes.has(k));
  const idos = [...antes.keys()].filter((k) => !ahora.has(k));

  console.log(`\nComparado con ${previas[previas.length - 1].replace(".json", "")}:`);
  if (!arreglados.length && !rotos.length && !nuevos.length && !idos.length) {
    console.log("  sin cambios");
  }
  for (const k of arreglados) console.log(`  ARREGLADO  ${k.replace("|", " · ")}`);
  // Una regresión es lo más grave: algo que funcionaba dejó de funcionar.
  for (const k of rotos) console.log(`  REGRESIÓN  ${k.replace("|", " · ")}`);
  for (const k of nuevos) console.log(`  nuevo      ${k.replace("|", " · ")}`);
  for (const k of idos) console.log(`  ya no está ${k.replace("|", " · ")}`);
  return rotos.length;
}

const fallas = resultados.filter((r) => r.estado === "FALLA");
const oks = resultados.filter((r) => r.estado === "ok");
const nocub = resultados.filter((r) => r.estado === "no cubierto");
console.log(`\n${"─".repeat(60)}`);
console.log(`Controles: ${oks.length} ok · ${fallas.length} fallas · ${nocub.length} no cubiertos`);
if (fallas.length) {
  console.log("\nFallas:");
  for (const f of fallas) console.log(`  · [${f.area}] ${f.ctrl} — ${f.detalle}`);
}

let regresiones = 0;
if (DIFF) regresiones = comparar() ?? 0;
if (GUARDAR) console.log(`\nGuardado: ${guardar().replace(ROOT + "/", "")}`);

process.exit(fallas.length ? 1 : 0);
