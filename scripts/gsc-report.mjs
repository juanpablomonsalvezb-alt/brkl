/**
 * Mitad de demanda del bucle SEO: qué pasa DESPUÉS de que Google rastrea.
 *
 * audit-seo.mjs verifica que el sitio esté bien construido. Esto verifica si
 * alguien llega: clics, impresiones, posición media, qué consultas nos traen
 * gente y cuántas páginas están indexadas de verdad.
 *
 * Guarda cada corrida en seo-history/gsc-*.json y compara con la anterior, igual
 * que la auditoría técnica: lo que importa no es el número de hoy sino si sube
 * o baja.
 *
 * Requiere .gsc-key.json (cuenta de servicio con acceso de lectura a la
 * propiedad en Search Console). Ese archivo está en .gitignore y nunca se sube.
 *
 * Uso: node scripts/gsc-report.mjs [--dias 28] [--save]
 */
import { google } from "googleapis";
import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = join(ROOT, ".gsc-key.json");
const HIST = join(ROOT, "seo-history");
const SITE = "sc-domain:barkleyinstituto.cl";

const args = process.argv.slice(2);
const GUARDAR = args.includes("--save");
const DIAS = Number(args[args.indexOf("--dias") + 1]) || 28;

if (!existsSync(KEY)) {
  console.error(`✗ Falta ${KEY.replace(ROOT + "/", "")} — la credencial de la cuenta de servicio.`);
  process.exit(1);
}

/** Search Console tiene ~2 días de rezago: pedir hasta hoy devuelve ceros. */
function rango(dias) {
  const fin = new Date(Date.now() - 3 * 86400000);
  const ini = new Date(fin.getTime() - dias * 86400000);
  const f = (d) => d.toISOString().slice(0, 10);
  return { startDate: f(ini), endDate: f(fin) };
}

const auth = new google.auth.GoogleAuth({
  keyFile: KEY,
  scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
});
const sc = google.searchconsole({ version: "v1", auth });

async function consultar(dimensions, rowLimit, periodo) {
  const { data } = await sc.searchanalytics.query({
    siteUrl: SITE,
    requestBody: { ...periodo, dimensions, rowLimit },
  });
  return data.rows ?? [];
}

const actual = rango(DIAS);
const previo = (() => {
  const ini = new Date(new Date(actual.startDate).getTime() - DIAS * 86400000);
  const fin = new Date(new Date(actual.startDate).getTime() - 86400000);
  const f = (d) => d.toISOString().slice(0, 10);
  return { startDate: f(ini), endDate: f(fin) };
})();

let totalAhora, totalAntes, consultas, paginas;
try {
  [totalAhora, totalAntes, consultas, paginas] = await Promise.all([
    consultar([], 1, actual),
    consultar([], 1, previo),
    consultar(["query"], 25, actual),
    consultar(["page"], 25, actual),
  ]);
} catch (e) {
  const msg = e?.message ?? String(e);
  if (/permission|forbidden|403/i.test(msg)) {
    console.error("✗ La cuenta de servicio no tiene acceso a la propiedad en Search Console.");
    console.error("  Revisa: Configuración → Usuarios y permisos → debe aparecer");
    console.error("  barkley-seo@patagonia-focus.iam.gserviceaccount.com");
  } else if (/has not been used|disabled/i.test(msg)) {
    console.error("✗ La Search Console API no está habilitada en el proyecto de Google Cloud.");
  } else {
    console.error("✗ Error consultando Search Console:", msg.slice(0, 300));
  }
  process.exit(1);
}

const t = (filas) => filas[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
const a = t(totalAhora);
const b = t(totalAntes);

const delta = (ahora, antes, invertir = false) => {
  if (antes === 0 && ahora === 0) return "  =";
  if (antes === 0) return "  ↑ nuevo";
  const pct = ((ahora - antes) / antes) * 100;
  const mejora = invertir ? pct < 0 : pct > 0; // en posición, bajar es mejorar
  const signo = pct > 0 ? "+" : "";
  return `  ${mejora ? "↑" : pct === 0 ? "=" : "↓"} ${signo}${pct.toFixed(0)}%`;
};

console.log(`\nSearch Console · ${actual.startDate} a ${actual.endDate} (${DIAS} días)`);
console.log(`comparado con  · ${previo.startDate} a ${previo.endDate}\n`);
console.log(`  clics          ${String(a.clicks).padStart(6)}${delta(a.clicks, b.clicks)}`);
console.log(`  impresiones    ${String(a.impressions).padStart(6)}${delta(a.impressions, b.impressions)}`);
console.log(`  CTR            ${(a.ctr * 100).toFixed(2).padStart(6)}%${delta(a.ctr, b.ctr)}`);
console.log(`  posición media ${a.position.toFixed(1).padStart(6)}${delta(a.position, b.position, true)}`);

if (consultas.length) {
  console.log("\nConsultas que traen gente:");
  for (const q of consultas.slice(0, 12)) {
    console.log(
      `  ${String(q.clicks).padStart(4)} clics · ${String(q.impressions).padStart(5)} impr · pos ${q.position.toFixed(1).padStart(5)}  ${q.keys[0]}`,
    );
  }
} else {
  console.log("\nSin consultas registradas en el período. Normal en un dominio nuevo:");
  console.log("Google necesita semanas de rastreo antes de mostrar datos de rendimiento.");
}

if (paginas.length) {
  console.log("\nPáginas con más impresiones:");
  for (const p of paginas.slice(0, 8)) {
    console.log(
      `  ${String(p.clicks).padStart(4)} clics · ${String(p.impressions).padStart(5)} impr  ${p.keys[0].replace("https://www.barkleyinstituto.cl", "")}`,
    );
  }
}

if (GUARDAR) {
  mkdirSync(HIST, { recursive: true });
  const sello = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "");
  const archivo = join(HIST, `gsc-${sello}.json`);
  writeFileSync(
    archivo,
    JSON.stringify({ fecha: new Date().toISOString(), periodo: actual, total: a, consultas, paginas }, null, 2),
  );
  console.log(`\nGuardado: ${archivo.replace(ROOT + "/", "")}`);
}
