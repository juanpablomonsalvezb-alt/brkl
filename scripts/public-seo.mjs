import { writeFileSync, readFileSync } from 'node:fs';
import { readManifest, validateManifest, generateSitemap } from './lib/public-seo-contract.mjs';

const args = process.argv.slice(2);
if (args.some((a) => !['--json', '--write-sitemap', '--check-sitemap'].includes(a))) throw new Error('Opciones: --json, --write-sitemap, --check-sitemap');
const manifest = readManifest();
const report = validateManifest(process.cwd(), manifest);
// Comparar semánticamente, conservando fechas de cambios reales, no el orden.
const records = (xml) => [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => [...m[1].matchAll(/<(loc|lastmod|changefreq|priority)>([^<]*)<\/\1>/g)].map((v) => `${v[1]}=${v[2]}`).sort().join('|')).sort();
if (args.includes('--check-sitemap') && JSON.stringify(records(readFileSync('client/public/sitemap.xml', 'utf8'))) !== JSON.stringify(records(generateSitemap(manifest)))) report.errors.push('Sitemap difiere del manifiesto');
if (args.includes('--write-sitemap') && !report.errors.length) writeFileSync('client/public/sitemap.xml', generateSitemap(manifest));
if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
else {
  console.log(JSON.stringify(report.summary, null, 2));
  for (const error of report.errors) console.error('ERROR', error);
  for (const warning of report.warnings) console.warn('AVISO', warning);
}
if (report.errors.length) process.exitCode = 1;
