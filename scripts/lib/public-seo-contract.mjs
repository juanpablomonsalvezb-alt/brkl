import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';

export const MANIFEST_PATH = 'scripts/data/public-seo-manifest.json';
export function readManifest(root = process.cwd()) {
  return JSON.parse(readFileSync(resolve(root, MANIFEST_PATH), 'utf8'));
}
const decode = (value) => value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (match, entity) => {
  if (entity[0] === '#') return String.fromCodePoint(parseInt(entity.slice(entity[1].toLowerCase() === 'x' ? 2 : 1), entity[1].toLowerCase() === 'x' ? 16 : 10));
  return { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' }[entity.toLowerCase()] ?? match;
});
// Extractor del contrato, no un validador general de HTML. Reconoce atributos
// en cualquier orden y comillas simples/dobles, sin ejecutar JS ni cargar URLs.
function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b((?:"[^"]*"|'[^']*'|[^'">])*)>`, 'gi'))].map((match) => {
    const attrs = {};
    for (const attr of match[1].matchAll(/([^\s=<>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) attrs[attr[1].toLowerCase()] = decode(attr[2] ?? attr[3] ?? attr[4]);
    return attrs;
  });
}
export function inspectHtml(html) {
  const metadata = Object.fromEntries(tags(html, 'meta').map((a) => [a.name ?? a.property, a.content]));
  const schemas = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => JSON.parse(m[1]));
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, '');
  return {
    title: decode(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''),
    description: metadata.description ?? '',
    metadata,
    canonical: tags(html, 'link').filter((a) => a.rel === 'canonical').map((a) => a.href),
    robots: tags(html, 'meta').filter((a) => ['robots', 'googlebot'].includes(a.name?.toLowerCase())).map((a) => a.content ?? ''),
    schemas,
    h1Count: tags(markup, 'h1').length,
    links: tags(markup, 'a').map((a) => a.href).filter(Boolean),
    resources: ['img', 'video', 'audio', 'source'].flatMap((name) => tags(markup, name).flatMap((a) => [a.src, a.poster].filter(Boolean))),
    ids: new Set([...markup.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((m) => decode(m[1]))),
  };
}
export function isPrivatePath(path) {
  const normalized = decodeURIComponent(path).replace(/\/+$/, '') || '/';
  return /^\/(?:api|dashboard|course|drive-sync|textbook-config(?:-new)?|reservations(?:-admin)?|plan-settings|level-plan-settings|planes-2026|barkley-admin|evaluation-links-admin|gemini-copilots-admin|faq-admin|paes-admin|academic-copilot|payment-result|plataforma|asi-trabajamos|vortice)(?:\/|$)/i.test(normalized)
    || /^\/together\//i.test(normalized);
}
function localPath(root, path) {
  const absolute = resolve(root, path);
  if (relative(root, absolute).split(sep).includes('..')) throw new Error(`Archivo fuera del proyecto: ${path}`);
  return absolute;
}
function htmlFiles(root, directory = 'client/public') {
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? htmlFiles(root, path) : path.endsWith('.html') ? [path] : [];
  });
}
export function generateSitemap(manifest) {
  const xml = (text) => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + manifest.pages.filter((p) => p.sitemap !== null).map((p) => {
      if (!p.indexable || isPrivatePath(p.path)) throw new Error(`URL no publicable en sitemap: ${p.path}`);
      return `  <url>\n    <loc>${xml(p.canonical)}</loc>\n` + ['lastmod', 'changefreq', 'priority'].filter((key) => p.sitemap[key] !== undefined).map((key) => `    <${key}>${xml(p.sitemap[key])}</${key}>\n`).join('') + '  </url>\n';
    }).join('') + '</urlset>\n';
}
export function validateManifest(root = process.cwd(), manifest = readManifest(root)) {
  root = resolve(root);
  const errors = [], warnings = [], documents = new Map(), paths = new Set(), sources = new Set();
  const fail = (page, message) => errors.push(`${page}: ${message}`);
  if (manifest.version !== 1 || manifest.origin !== 'https://www.barkleyinstituto.cl') errors.push('Versión u origen del manifiesto no reconocido');
  for (const page of manifest.pages) {
    if (paths.has(page.path)) fail(page.path, 'ruta duplicada');
    if (sources.has(page.source)) fail(page.path, 'archivo reutilizado');
    paths.add(page.path); sources.add(page.source);
    if (!page.path.startsWith('/') || /[?#]/.test(page.path) || page.canonical !== manifest.origin + page.path) fail(page.path, 'canónica o ruta no válida');
    if (isPrivatePath(page.path)) fail(page.path, 'ruta privada en manifiesto público');
    if (typeof page.indexable !== 'boolean') fail(page.path, 'indexable debe ser booleano');
    if (page.sitemap !== null && !page.indexable) fail(page.path, 'noindex incluido en sitemap');
    if (page.sitemap?.lastmod && (!/^\d{4}-\d{2}-\d{2}$/.test(page.sitemap.lastmod) || Number.isNaN(Date.parse(page.sitemap.lastmod)) || new Date(page.sitemap.lastmod).toISOString().slice(0, 10) !== page.sitemap.lastmod)) fail(page.path, 'lastmod inválido');
    const expectedSource = page.delivery === 'snapshot'
      ? `client/public/prerendered/${page.path === '/' ? 'index' : page.path.slice(1)}.html`
      : `client/public${page.path}index.html`;
    if (!['static', 'snapshot'].includes(page.delivery) || page.source !== expectedSource) fail(page.path, 'ruta de fuente no corresponde al tipo de entrega');
    if (!page.title || !page.description) fail(page.path, 'metadatos vacíos');
    try {
      const doc = inspectHtml(readFileSync(localPath(root, page.source), 'utf8'));
      documents.set(page.path, doc);
      if (doc.title !== page.title) fail(page.path, 'title difiere del contrato');
      if (doc.description !== page.description) fail(page.path, 'description difiere del contrato');
      for (const [key, value] of Object.entries(page.openGraph ?? {})) if (doc.metadata[key] !== value) fail(page.path, `${key} difiere del contrato`);
      if (doc.canonical.length !== 1 || doc.canonical[0] !== page.canonical) fail(page.path, 'canonical ausente, duplicada o distinta');
      if (doc.h1Count !== 1) fail(page.path, `se esperaba un H1; encontrados ${doc.h1Count}`);
      const noindex = doc.robots.some((r) => /\b(noindex|none)\b/i.test(r));
      if (page.indexable === noindex) fail(page.path, 'robots contradice indexabilidad');
      const types = new Set(doc.schemas.flatMap((s) => [s].flat().flatMap((node) => node['@graph'] ?? [node])).flatMap((s) => s['@type'] ?? []));
      for (const type of page.schemaTypes) if (!types.has(type)) fail(page.path, `falta schema ${type}`);
    } catch (error) { fail(page.path, `HTML o JSON-LD ilegible: ${error.message}`); }
  }
  for (const file of htmlFiles(root)) if (!sources.has(file)) fail(file, 'HTML público no registrado (no indexar automáticamente)');
  const routeFile = readFileSync(resolve(root, 'shared/prerender-routes.ts'), 'utf8');
  const runtimeRoutes = [...routeFile.split('] as const')[0].matchAll(/^\s*"([^"]+)"/gm)].map((m) => m[1]);
  const snapshots = manifest.pages.filter((p) => p.delivery === 'snapshot').map((p) => p.path);
  if ([...runtimeRoutes].sort().join('\n') !== [...snapshots].sort().join('\n')) errors.push('Rutas prerender de runtime y manifiesto no coinciden');
  const redirects = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8')).redirects.filter((r) => !r.has).map((r) => ({ source: r.source.replace('{/}?', ''), destination: r.destination }));
  const redirected = new Map(redirects.map((r) => [r.source.replace(/\/$/, ''), r.destination]));
  const find = (path) => paths.has(path) ? path : paths.has(path.replace(/\/$/, '')) ? path.replace(/\/$/, '') : paths.has(path + '/') ? path + '/' : null;
  for (const [path, doc] of documents) for (const resource of new Set(doc.resources)) {
    const url = new URL(resource, manifest.origin + path);
    if (url.origin !== manifest.origin || url.pathname.startsWith('/assets/')) continue;
    if (!existsSync(localPath(root, `client/public/${decodeURIComponent(url.pathname).replace(/^\//, '')}`))) fail(path, `recurso local inexistente: ${resource}`);
  }
  const graph = new Map(manifest.pages.map((p) => [p.path, new Set()]));
  for (const [path, doc] of documents) for (const href of new Set(doc.links)) {
    let url;
    try { url = new URL(href, manifest.origin + path); } catch { fail(path, `enlace inválido: ${href}`); continue; }
    if (url.origin !== manifest.origin) continue;
    let targetPath = decodeURIComponent(url.pathname);
    if (isPrivatePath(targetPath)) { warnings.push(`${path}: enlace a ruta excluida ${targetPath}`); continue; }
    const redirect = redirected.get(targetPath.replace(/\/$/, ''));
    if (redirect) {
      warnings.push(`${path}: enlace a redirección configurada ${targetPath}`);
      const target = new URL(redirect, manifest.origin); targetPath = target.pathname;
    }
    const target = find(targetPath);
    if (target) {
      graph.get(path).add(target);
      if (url.hash && !redirect && !documents.get(target)?.ids.has(decodeURIComponent(url.hash.slice(1)))) fail(path, `fragmento inexistente: ${href}`);
    } else if (!existsSync(localPath(root, `client/public/${targetPath.replace(/^\//, '')}`))) fail(path, `destino local inexistente: ${href}`);
  }
  const depths = { '/': 0 }, queue = ['/'];
  for (let i = 0; i < queue.length; i++) for (const target of graph.get(queue[i]) ?? []) if (!(target in depths)) { depths[target] = depths[queue[i]] + 1; queue.push(target); }
  const orphaned = manifest.pages.filter((p) => p.indexable && !(p.path in depths)).map((p) => p.path);
  for (const path of orphaned) warnings.push(`${path}: sin recorrido HTML desde portada`);
  return { errors, warnings: [...new Set(warnings)], summary: { pages: manifest.pages.length, sitemapPages: manifest.pages.filter((p) => p.sitemap !== null).length, orphaned, maxDepth: Math.max(...Object.values(depths)) }, graph: Object.fromEntries([...graph].map(([p, links]) => [p, { depth: depths[p] ?? null, outlinks: [...links] }])) };
}
