// Verifica que todos los textos de inicio de cobro estén unificados a enero de 2027 (Tarea 8).
// No toca ni prohíbe las menciones legítimas a «Verano Barkley» en enero y febrero.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import fs from "node:fs";

const NIVELES_LANDING = [
  "1-basico", "2-basico", "3-basico", "4-basico",
  "5-basico", "6-basico", "7-basico", "8-basico",
  "1-medio", "2-medio", "3-medio", "4-medio",
];

const ARCHIVOS_COBRO = [
  "scripts/generate-landings.mjs",
  ...NIVELES_LANDING.map((s) => `client/public/examenes-libres-${s}/index.html`),
  "client/public/guia-examenes-libres/index.html",
  "client/src/pages/Legal.tsx",
  "client/public/prerendered/reembolso.html",
  "server/notify.ts",
  "client/src/pages/Home.tsx",
];

const PATRONES_PROHIBIDOS = [
  /febrero\s+de\s+2027/i,
  /febrero\s+2027/i,
  /enero\s+o\s+febrero\s+de\s+2027/i,
  /hasta\s+febrero\s+de\s+2027/i,
];

for (const ruta of ARCHIVOS_COBRO) {
  const texto = fs.readFileSync(ruta, "utf8");
  for (const re of PATRONES_PROHIBIDOS) {
    assert.ok(!re.test(texto), `${ruta}: aún contiene referencia antigua de cobro (${re})`);
  }
}

const ARCHIVOS_ENERO_OBLIGATORIO: Array<[string, RegExp]> = [
  ["scripts/generate-landings.mjs", /pagas recién en enero de 2027/],
  ...NIVELES_LANDING.map((s): [string, RegExp] => [
    `client/public/examenes-libres-${s}/index.html`,
    /pagas recién en enero de 2027/,
  ]),
  ["client/public/guia-examenes-libres/index.html", /pagas recién en enero de 2027/],
  ["client/src/pages/Legal.tsx", /sin pagar hasta enero de 2027/],
  ["client/public/prerendered/reembolso.html", /sin pagar hasta enero de 2027/],
  ["server/notify.ts", /a partir de <strong>enero de 2027<\/strong>/],
  ["client/src/pages/Home.tsx", /pagas recién en enero de 2027/],
  ["client/src/pages/Electivos.tsx", /pagas recién en enero de 2027/],
  ["client/src/pages/TourPlataforma.tsx", /pagas recién en enero de 2027/],
  ["client/src/pages/PorDentro.tsx", /Pagas recién en enero de 2027/],
  ["server/salesChatRoutes.ts", /a partir de enero de 2027/],
];

for (const [ruta, re] of ARCHIVOS_ENERO_OBLIGATORIO) {
  const texto = fs.readFileSync(ruta, "utf8");
  assert.match(texto, re, `${ruta}: falta la fecha unificada de cobro en enero de 2027`);
}

console.log(`fechas-cobro: ok (${ARCHIVOS_COBRO.length} archivos revisados)`);
