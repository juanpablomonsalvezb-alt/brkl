import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readManifest, validateManifest, generateSitemap, inspectHtml, isPrivatePath } from '../../scripts/lib/public-seo-contract.mjs';

const origin = 'https://www.barkleyinstituto.cl';
const goodHtml = `<html><head><title>Guía pública</title><meta content='Descripción &amp; fuente' name='description'><link href="${origin}/" rel="canonical"><script type="application/ld+json">{"@type":"WebPage"}</script></head><body><h1>Guía pública</h1><a href="#contenido">Ir</a><section id="contenido">Respuesta</section></body></html>`;
function fixture(fn) {
  const root = mkdtempSync(join(tmpdir(), 'seo-contract-'));
  const write = (path, data) => { mkdirSync(join(root, path, '..'), { recursive: true }); writeFileSync(join(root, path), data); };
  const page = { path: '/', source: 'client/public/index.html', delivery: 'static', indexable: true, sitemap: { lastmod: '2026-11-16' }, title: 'Guía pública', description: 'Descripción & fuente', canonical: origin + '/', schemaTypes: ['WebPage'] };
  const manifest = { version: 1, origin, pages: [page] };
  write(page.source, goodHtml);
  write('shared/prerender-routes.ts', 'export const PRERENDER_ROUTES = [] as const;');
  write('vercel.json', '{"redirects":[]}');
  try { fn({ root, write, manifest, page }); } finally { rmSync(root, { recursive: true, force: true }); }
}
test('contrato válido: orden de atributos, entidades y fragmentos', () => fixture(({ root, manifest }) => {
  assert.deepEqual(validateManifest(root, manifest).errors, []);
  assert.equal(inspectHtml(goodHtml).description, 'Descripción & fuente');
}));
test('detecta deriva de title y description', () => fixture(({ root, write, manifest, page }) => {
  write(page.source, goodHtml.replace('Guía pública</title>', 'Otro título</title>').replace('Descripción &amp; fuente', 'Otra descripción'));
  assert.match(validateManifest(root, manifest).errors.join('\n'), /title difiere[\s\S]*description difiere/);
}));
test('detecta noindex accidental y canonical duplicada', () => fixture(({ root, write, manifest, page }) => {
  write(page.source, goodHtml.replace('</head>', `<meta name="robots" content="noindex"><link rel="canonical" href="${origin}/otra"></head>`));
  const errors = validateManifest(root, manifest).errors.join('\n');
  assert.match(errors, /canonical/); assert.match(errors, /robots/);
}));
test('noindex explícito fuera del sitemap es válido', () => fixture(({ root, write, manifest, page }) => {
  page.indexable = false; page.sitemap = null;
  write(page.source, goodHtml.replace('</head>', '<meta name="robots" content="noindex"></head>'));
  assert.deepEqual(validateManifest(root, manifest).errors, []);
}));
test('rechaza JSON-LD malformado o schema esperado ausente', () => fixture(({ root, write, manifest, page }) => {
  write(page.source, goodHtml.replace('{"@type":"WebPage"}', '{"@type":}'));
  assert.match(validateManifest(root, manifest).errors.join('\n'), /JSON-LD ilegible/);
  write(page.source, goodHtml.replace('WebPage', 'Article'));
  assert.match(validateManifest(root, manifest).errors.join('\n'), /falta schema WebPage/);
}));
test('detecta HTML nuevo no registrado, enlace y fragmento inexistentes', () => fixture(({ root, write, manifest, page }) => {
  write('client/public/nueva/index.html', goodHtml);
  write(page.source, goodHtml.replace('</body>', '<a href="/no-existe/">Error</a><a href="#falta">Fragmento</a></body>'));
  const errors = validateManifest(root, manifest).errors.join('\n');
  assert.match(errors, /HTML público no registrado/); assert.match(errors, /destino local inexistente/); assert.match(errors, /fragmento inexistente/);
}));
test('rechaza fuentes fuera del proyecto y metadatos vacíos', () => fixture(({ root, manifest, page }) => {
  page.source = '../../secret.html'; page.title = '';
  const errors = validateManifest(root, manifest).errors.join('\n');
  assert.match(errors, /fuera del proyecto/); assert.match(errors, /metadatos vacíos/);
}));
test('impide añadir rutas privadas al sitemap o registro público', () => fixture(({ root, manifest, page }) => {
  for (const path of ['/dashboard', '/course/1', '/api/faqs', '/vortice', '/together/sala', '/plataforma/media', '/barkley-admin', '/%64ashboard']) {
    assert.equal(isPrivatePath(path), true, path);
    page.path = path; page.canonical = origin + path;
    assert.throws(() => generateSitemap(manifest), /no publicable/);
    assert.match(validateManifest(root, manifest).errors.join('\n'), /ruta privada/);
  }
  assert.equal(isPrivatePath('/together'), false);
}));
test('noindex no puede entrar en sitemap y fechas inválidas no se aceptan', () => fixture(({ root, manifest, page }) => {
  page.indexable = false;
  assert.throws(() => generateSitemap(manifest), /no publicable/);
  assert.match(validateManifest(root, manifest).errors.join('\n'), /noindex incluido/);
  page.sitemap.lastmod = '2026-99-99';
  assert.match(validateManifest(root, manifest).errors.join('\n'), /lastmod inválido/);
}));
test('duplicados y desajustes de rutas prerender bloquean el contrato', () => fixture(({ root, write, manifest, page }) => {
  manifest.pages.push({ ...page });
  write('shared/prerender-routes.ts', 'export const PRERENDER_ROUTES = [\n "/sin-snapshot",\n] as const;');
  const errors = validateManifest(root, manifest).errors.join('\n');
  assert.match(errors, /ruta duplicada/); assert.match(errors, /runtime y manifiesto no coinciden/);
}));
test('registro real: 77 documentos, 73 URLs de sitemap y grafo informativo', () => {
  const report = validateManifest();
  assert.deepEqual(report.errors, []);
  assert.equal(report.summary.pages, 77); assert.equal(report.summary.sitemapPages, 73);
  assert.equal(report.summary.maxDepth, 4);
  assert.ok(report.summary.orphaned.length > 0);
});
test('generación conserva URLs y lastmod existentes sin promover exclusiones', () => {
  const records = (xml) => [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => [...m[1].matchAll(/<(loc|lastmod|changefreq|priority)>([^<]*)<\/\1>/g)].map((v) => `${v[1]}=${v[2]}`).sort().join('|')).sort();
  const manifest = readManifest();
  assert.deepEqual(records(generateSitemap(manifest)), records(readFileSync('client/public/sitemap.xml', 'utf8')));
  assert.equal(manifest.pages.find((p) => p.path === '/colegio-online-tea-autismo/').indexable, false);
});

test('detecta imagen y poster inexistentes sin peticiones de red', () => fixture(({ root, write, manifest, page }) => {
  write(page.source, goodHtml.replace('</body>', '<img src="/falta.webp"><video poster="/poster-falta.webp"></video></body>'));
  const errors = validateManifest(root, manifest).errors.join('\n');
  assert.match(errors, /recurso local inexistente: \/falta.webp/);
  assert.match(errors, /recurso local inexistente: \/poster-falta.webp/);
}));

test('detecta Open Graph divergente del contrato sin imponer copia del title', () => fixture(({ root, write, manifest, page }) => {
  page.openGraph = { 'og:title': 'Título social específico' };
  write(page.source, goodHtml.replace('</head>', '<meta property="og:title" content="Título social específico"></head>'));
  assert.deepEqual(validateManifest(root, manifest).errors, []);
  write(page.source, goodHtml.replace('</head>', '<meta property="og:title" content="Otro"></head>'));
  assert.match(validateManifest(root, manifest).errors.join('\n'), /og:title difiere/);
}));
