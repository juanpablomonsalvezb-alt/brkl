// IMP-016 (H1b-1): ventanas de una instancia ordinaria. T = 23:59 de Chile, +48 h reales, review_at = T + 49 h,
// rechazo desde T+48 h, cambios de horario de America/Santiago. El oráculo es independiente: instantes UTC
// calculados a mano con los desfases oficiales (verano UTC−3, invierno UTC−4) y comprobación inversa con Intl.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import fs from "node:fs";
import { envioAceptable, extensionAgotada, finDeModulo, HoraLocalInvalida, instanteLocal, ventanaOrdinaria, ZONA_CHILE } from "../shared/ventanas";

const iso = (t: number) => new Date(t * 1000).toISOString().replace(".000Z", "Z");
const local = (t: number) => new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_CHILE, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
  .format(new Date(t * 1000)).replace(", ", " ");
let casos = 0; const salida: string[] = [];
const caso = (id: string, nombre: string, f: () => void) => { f(); casos++; salida.push(`  ✓ ${id.padEnd(5)} ${nombre}`); };

caso("V1", "verano (UTC−3): T, T+48 h y review_at", () => {
  let v!: ReturnType<typeof ventanaOrdinaria>;
  assert.doesNotThrow(() => { v = ventanaOrdinaria("2026-03-13"); }, "V1: un día normal de verano no debe lanzar excepción (HoraLocalInvalida u otra)"); // viernes
  assert.deepEqual([iso(v.finModulo), iso(v.finExtension), iso(v.revisionDesde)], ["2026-03-14T02:59:00Z", "2026-03-16T02:59:00Z", "2026-03-16T03:59:00Z"]);
  assert.equal(v.zonaHoraria, "America/Santiago"); assert.equal(v.diaFin, "2026-03-13");
  assert.equal(local(v.finModulo), "2026-03-13 23:59");
});
caso("V2", "invierno (UTC−4)", () => {
  const v = ventanaOrdinaria("2026-07-10");
  assert.deepEqual([iso(v.finModulo), iso(v.finExtension), iso(v.revisionDesde)], ["2026-07-11T03:59:00Z", "2026-07-13T03:59:00Z", "2026-07-13T04:59:00Z"]);
});
caso("V3", "fin del horario de verano (abril): las 48 h son reales, la hora local del cierre cambia", () => {
  const v = ventanaOrdinaria("2026-04-03"); // viernes; el sábado 4 a las 24:00 los relojes retroceden
  assert.deepEqual([iso(v.finModulo), iso(v.finExtension), iso(v.revisionDesde)], ["2026-04-04T02:59:00Z", "2026-04-06T02:59:00Z", "2026-04-06T03:59:00Z"]);
  assert.equal(v.finExtension - v.finModulo, 48 * 3600, "48 horas reales");
  assert.equal(local(v.finExtension), "2026-04-05 22:59", "la hora local del fin de la extensión es 22:59, no 23:59");
});
caso("V4", "inicio del horario de verano (septiembre): las 48 h son reales", () => {
  const v = ventanaOrdinaria("2026-09-04"); // viernes; el sábado 5 a las 24:00 los relojes avanzan
  assert.deepEqual([iso(v.finModulo), iso(v.finExtension), iso(v.revisionDesde)], ["2026-09-05T03:59:00Z", "2026-09-07T03:59:00Z", "2026-09-07T04:59:00Z"]);
  assert.equal(v.finExtension - v.finModulo, 48 * 3600);
  assert.equal(local(v.finExtension), "2026-09-07 00:59", "la extensión termina a las 00:59 locales del lunes");
});
caso("V5", "las 23:59 del sábado del cambio de abril ocurren dos veces: se rechaza en vez de elegir", () => {
  assert.throws(() => finDeModulo("2026-04-04"), (e: unknown) => e instanceof HoraLocalInvalida && e.tipo === "ambigua");
  assert.doesNotThrow(() => finDeModulo("2026-09-05"), "el sábado de septiembre las 23:59 existen una sola vez");
  assert.throws(() => instanteLocal("2026-09-06", 0, 30), (e: unknown) => e instanceof HoraLocalInvalida && e.tipo === "inexistente");
});
caso("V6", "barrido de 2026 y 2027: T es siempre las 23:59 locales; la extensión son 172 800 s; review_at = T + 49 h", () => {
  let ambiguos = 0, ndias = 0;
  for (let d = Date.UTC(2026, 0, 1); d < Date.UTC(2028, 0, 1); d += 86400000) {
    const ymd = new Date(d).toISOString().slice(0, 10); ndias++;
    try {
      const v = ventanaOrdinaria(ymd);
      assert.equal(local(v.finModulo), `${ymd} 23:59`, ymd);
      assert.equal(v.finExtension - v.finModulo, 172800, ymd); assert.equal(v.revisionDesde - v.finModulo, 176400, ymd);
    } catch (e) { if (e instanceof HoraLocalInvalida) ambiguos++; else throw e; }
  }
  assert.equal(ndias, 730); assert.equal(ambiguos, 2, "solo el sábado de abril de cada año (2026 y 2027) es ambiguo");
});
caso("V7", "envío aceptable hasta T+48 h; desde ahí no (P15, sin período de gracia)", () => {
  const v = ventanaOrdinaria("2026-03-13");
  for (const [dt, ok] of [[-86400, true], [-1, true], [0, true], [47 * 3600, true], [48 * 3600 - 0.001, true], [48 * 3600, false], [48 * 3600 + 1, false], [49 * 3600, false]] as const) {
    assert.equal(envioAceptable(v, v.finModulo + dt), ok, `T${dt >= 0 ? "+" : ""}${dt}`);
    assert.equal(extensionAgotada(v, v.finModulo + dt), !ok, "complementarias");
  }
});
caso("V8", "días inválidos y zonas: entrada rechazada, otra zona cambia el instante", () => {
  for (const mal of ["2026-02-30", "2026-13-01", "26-03-13", "2026/03/13", "", "2026-03-13T00:00"]) assert.throws(() => finDeModulo(mal), RangeError, mal);
  assert.notEqual(finDeModulo("2026-03-13", "UTC"), finDeModulo("2026-03-13"));
  assert.equal(finDeModulo("2026-03-13", "UTC"), Date.UTC(2026, 2, 13, 23, 59) / 1000);
  assert.deepEqual(ventanaOrdinaria("2026-03-13", "UTC").zonaHoraria, "UTC");
});
caso("V9", "determinismo y sin lectura del reloj del sistema", () => {
  assert.deepEqual(ventanaOrdinaria("2026-05-15"), ventanaOrdinaria("2026-05-15"));
  const codigo = fs.readFileSync("shared/ventanas.ts", "utf8").split("\n").map((l) => l.replace(/\/\/.*$/, "")).filter((l) => /Date\.now\s*\(|new Date\s*\(\s*\)/.test(l));
  assert.deepEqual(codigo, [], "ventanas.ts no debe leer el reloj del sistema");
});

console.log(salida.join("\n")); console.log(`ventanas: ok (${casos} casos)`);
