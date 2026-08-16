/**
 * Embudo de inscripción: dónde se pierde la gente entre que llega y se inscribe.
 *
 * Search Console dice cuánta gente llega. Esto dice qué hace después. Sin esta
 * mitad, un formulario que no convierte se ve idéntico a no tener visitas — y la
 * respuesta a "¿por qué no hay inscripciones?" es distinta en cada caso.
 *
 * Uso: node scripts/embudo.mjs [--dias 30]
 */
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const DIAS = Number(args[args.indexOf("--dias") + 1]) || 30;

const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env"), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);
const c = createClient({ url: env.TURSO_DATABASE_URL || env.DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });

// Drizzle guarda `timestamp` en SEGUNDOS Unix, no milisegundos. Comparar contra
// Date.now() (milisegundos) hacía que el filtro no coincidiera nunca y el reporte
// saliera siempre vacío aunque los eventos estuvieran guardados.
const desde = Math.floor((Date.now() - DIAS * 86400000) / 1000);

/** Personas distintas por paso — no eventos: alguien que teclea 10 veces es una persona. */
const PASOS = [
  ["llega_pagina", "Llegó a la página"],
  ["ve_formulario", "Bajó hasta el formulario"],
  ["empieza_formulario", "Empezó a escribir"],
  ["envia_formulario", "Se inscribió"],
];

const conteos = new Map();
for (const [paso] of PASOS) {
  const r = await c.execute({
    sql: "select count(distinct session_id) n from funnel_events where step = ? and created_at >= ?",
    args: [paso, desde],
  });
  conteos.set(paso, Number(r.rows[0].n));
}

const inicio = conteos.get("llega_pagina") || 0;
console.log(`\nEmbudo de inscripción · últimos ${DIAS} días\n`);

if (inicio === 0) {
  console.log("  Sin datos todavía. La medición empieza a registrar desde su despliegue.");
} else {
  let previo = inicio;
  for (const [paso, etiqueta] of PASOS) {
    const n = conteos.get(paso) || 0;
    const pctTotal = ((n / inicio) * 100).toFixed(0);
    const caida = previo > 0 && paso !== "llega_pagina" ? ` (se perdió ${previo - n})` : "";
    const barra = "█".repeat(Math.round((n / inicio) * 30)).padEnd(30, "·");
    console.log(`  ${etiqueta.padEnd(26)} ${String(n).padStart(5)}  ${barra} ${pctTotal}%${caida}`);
    previo = n;
  }
  const conv = (((conteos.get("envia_formulario") || 0) / inicio) * 100).toFixed(1);
  console.log(`\n  Conversión total: ${conv}%`);
}

// De dónde viene quien llega: distingue tráfico de buscador del de redes.
const src = await c.execute({
  sql: `select source, count(distinct session_id) n from funnel_events
        where step = 'llega_pagina' and created_at >= ? group by source order by n desc limit 8`,
  args: [desde],
});
if (src.rows.length) {
  console.log("\n  Origen de las visitas:");
  for (const r of src.rows) console.log(`    ${String(r.n).padStart(5)}  ${r.source ?? "desconocido"}`);
}

// Qué páginas llevan gente al formulario: dice qué landing conviene trabajar.
const paths = await c.execute({
  sql: `select path, count(distinct session_id) n from funnel_events
        where step = 've_formulario' and created_at >= ? group by path order by n desc limit 8`,
  args: [desde],
});
if (paths.rows.length) {
  console.log("\n  Páginas desde las que se llega al formulario:");
  for (const r of paths.rows) console.log(`    ${String(r.n).padStart(5)}  ${r.path ?? "?"}`);
}

const total = await c.execute({ sql: "select count(*) n from waitlist_signups" });
console.log(`\n  Inscripciones en la base: ${total.rows[0].n}\n`);
