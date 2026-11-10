// IMP-004: reloj de la base (autoridad temporal, decisión D6/D7) y reloj simulado para pruebas.
// Los módulos del motor no leen el reloj del sistema para decidir.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import fs from "node:fs";
import { relojMotor, relojSimulado } from "../server/reloj";
import { baseArchivo, baseSqld } from "./lib/basePrueba";

async function probarMotor(etiqueta: string, b: { client: any }) {
  const r = relojMotor(b.client);
  const a = await r.ahora();
  const sistema = Date.now() / 1000; // solo en la prueba, para acotar
  assert.ok(Math.abs(a - sistema) < 5, `${etiqueta}: el reloj de la base debe estar cerca del sistema (${a})`);
  let previo = a;
  for (let i = 0; i < 20; i++) { const x = await r.ahora(); assert.ok(x >= previo, `${etiqueta}: no retrocede en lecturas seguidas`); previo = x; }
  // Dentro de una transacción, el valor sale de esa misma transacción.
  const t = await b.client.transaction("read");
  try { assert.ok((await relojMotor(t).ahora()) >= a); } finally { t.close(); }
}

const archivo = baseArchivo();
try { await probarMotor("archivo", archivo); } finally { await archivo.cerrar(); }
const sqld = await baseSqld();
if (sqld) { try { await probarMotor("sqld", sqld); } finally { await sqld.cerrar(); } }
else console.log("reloj sqld: OMITIDA (sqld no instalado)");

// Reloj simulado: determinista.
const s = relojSimulado(1_800_000_000);
assert.equal(await s.ahora(), 1_800_000_000);
s.avanzar(49 * 3600);
assert.equal(await s.ahora(), 1_800_000_000 + 49 * 3600);
s.fijar(5);
assert.equal(await s.ahora(), 5);

// Módulos del motor: sin Date.now() ni new Date() fuera de comentarios. La lista crece con cada hito.
const MODULOS_MOTOR = ["server/reloj.ts", "server/migrar.ts", "server/cliente.ts", "shared/p0e-estados.ts"]
  .concat(["shared/politica.ts", "shared/dominio.ts"].filter((f) => fs.existsSync(f)));
const lecturaDeReloj = (texto: string) => texto.split("\n")
  .map((l) => l.replace(/\/\/.*$/, ""))
  .filter((l) => /Date\.now\s*\(|new Date\s*\(/.test(l));
for (const f of MODULOS_MOTOR) assert.deepEqual(lecturaDeReloj(fs.readFileSync(f, "utf8")), [], `${f} lee el reloj del sistema`);
// Control: el detector reconoce ambas formas e ignora comentarios.
assert.equal(lecturaDeReloj("const t = Date.now();\nconst d = new Date();\n// Date.now()").length, 2);

console.log("reloj: ok");
