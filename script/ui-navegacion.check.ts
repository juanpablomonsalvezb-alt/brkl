import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { BARRA_ESTUDIANTE, NAV_ESTUDIANTE, NAV_FAMILIA } from "../client/src/components/vortice/navegacion";

const app = readFileSync("client/src/App.tsx", "utf8");
const rutas = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map(([, path]) => path);
const estudiante = readFileSync("client/src/pages/vortice/VorticeInicio.tsx", "utf8");
const brujula = readFileSync("client/src/pages/vortice/BrujulaPanel.tsx", "utf8");
const familia = readFileSync("client/src/pages/vortice/FamiliaVista.tsx", "utf8");

for (const [ruta, pagina] of [
  ["/vortice/semana", "client/src/pages/vortice/VorticeSemana.tsx"],
  ["/vortice/curriculo", "client/src/pages/vortice/VorticeCurriculo.tsx"],
  ["/vortice/calendario", "client/src/pages/vortice/VorticeCalendario.tsx"],
  ["/vortice/portafolio", "client/src/pages/vortice/VorticePortafolio.tsx"],
  ["/vortice/apoyo", "client/src/pages/vortice/VorticeApoyo.tsx"],
] as const) {
  assert.ok(rutas.includes(ruta), `no existe <Route path="${ruta}">`);
  assert.ok(existsSync(pagina), `no existe la página ${pagina}`);
}

assert.deepEqual(
  NAV_ESTUDIANTE.map(({ id, href }) => [id, href]),
  [
    ["inicio", "/vortice"],
    ["aula", "/vortice/aula"],
    ["curriculo", "/vortice/curriculo"],
    ["saber", "/vortice/conocimientos"],
    ["semana", "/vortice/semana"],
    ["calendario", "/vortice/calendario"],
    ["ano", "/vortice/mi-ano"],
    ["portafolio", "/vortice/portafolio"],
    ["apoyo", "/vortice/apoyo"],
  ],
  "NAV_ESTUDIANTE debe conservar los destinos y el orden definidos",
);
assert.deepEqual(BARRA_ESTUDIANTE, ["inicio", "aula", "saber", "semana"]);

for (const item of [...NAV_ESTUDIANTE, ...NAV_FAMILIA]) {
  const [ruta, ancla] = item.href.split("#");
  const existeRuta = rutas.includes(ruta) || rutas.some((path) => path.replace(/\/:\w+\?$/, "") === ruta);
  assert.ok(existeRuta, `no existe <Route path="${ruta}"> para ${item.id}`);
  if (ancla) {
    const pantalla = ancla === "brujula" ? brujula : NAV_FAMILIA.includes(item) ? familia : estudiante;
    assert.match(pantalla, new RegExp(`id="${ancla}"`), `no existe id="${ancla}" para ${item.id}`);
  }
}

assert.equal(BARRA_ESTUDIANTE.length, 4, "la barra de estudiante debe tener cuatro destinos");
assert.equal(new Set(NAV_ESTUDIANTE.map(({ id }) => id)).size, NAV_ESTUDIANTE.length, "hay ids repetidos en NAV_ESTUDIANTE");
assert.equal(new Set(NAV_FAMILIA.map(({ id }) => id)).size, NAV_FAMILIA.length, "hay ids repetidos en NAV_FAMILIA");
assert.equal(new Set(BARRA_ESTUDIANTE).size, BARRA_ESTUDIANTE.length, "hay ids repetidos en BARRA_ESTUDIANTE");
for (const id of BARRA_ESTUDIANTE) {
  assert.ok(NAV_ESTUDIANTE.some((item) => item.id === id), `BARRA_ESTUDIANTE contiene un id inexistente: ${id}`);
}

console.log("ui-navegacion: ok");