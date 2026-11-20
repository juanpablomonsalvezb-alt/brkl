// Pruebas de shared/perfiles.ts: parámetros por perfil, aprueba, etiquetaResultado,
// minimoPreguntasDeSubtemasFallados, y que los valores provienen de ventanas.ts.
// Ejecutar: npx tsx script/perfiles.check.ts
import assert from "node:assert/strict";
import {
  parametrosPerfil,
  aprueba,
  etiquetaResultado,
  FRACCION_ENFASIS_SUBTEMAS,
  minimoPreguntasDeSubtemasFallados,
} from "../shared/perfiles";
import {
  MIN_DURACION_EVALUACION_REGULAR,
  MIN_DURACION_EVALUACION_NEURODIVERGENTE,
  UMBRAL_APROBACION_REGULAR,
  UMBRAL_APROBACION_NEURODIVERGENTE,
} from "../shared/ventanas";

let casos = 0;
let fallas = 0;
const salida: string[] = [];

const caso = (id: string, nombre: string, f: () => void) => {
  try {
    f();
    casos++;
    salida.push(`  ✓ ${id.padEnd(5)} ${nombre}`);
  } catch (e) {
    fallas++;
    casos++;
    salida.push(`  ✗ ${id.padEnd(5)} ${nombre}`);
    salida.push(`    ERROR: ${e}`);
  }
};

// ——— Tabla de parámetros de ambos perfiles ———

caso("P1", "parametrosPerfil regular: 60 min, 70 %, cronómetro visible", () => {
  const p = parametrosPerfil("regular");
  assert.equal(p.duracionMin, 60);
  assert.equal(p.umbralAprobacion, 70);
  assert.equal(p.cronometroVisible, true);
});

caso("P2", "parametrosPerfil regular: avisos destacados a los 15 y 5 min", () => {
  const p = parametrosPerfil("regular");
  assert.deepEqual(p.avisos, [
    { minutosRestantes: 15, estilo: "destacado" },
    { minutosRestantes: 5, estilo: "destacado" },
  ]);
});

caso("P3", "parametrosPerfil neurodivergente: 120 min, 50 %, sin cronómetro", () => {
  const p = parametrosPerfil("neurodivergente");
  assert.equal(p.duracionMin, 120);
  assert.equal(p.umbralAprobacion, 50);
  assert.equal(p.cronometroVisible, false);
});

caso("P4", "parametrosPerfil neurodivergente: avisos suaves a los 30 y 10 min", () => {
  const p = parametrosPerfil("neurodivergente");
  assert.deepEqual(p.avisos, [
    { minutosRestantes: 30, estilo: "suave" },
    { minutosRestantes: 10, estilo: "suave" },
  ]);
});

// ——— Los valores provienen de ventanas.ts (no hay números duplicados) ———

caso("P5", "parametrosPerfil regular usa constantes de ventanas.ts", () => {
  const p = parametrosPerfil("regular");
  assert.equal(p.duracionMin, MIN_DURACION_EVALUACION_REGULAR, "duracionMin debe ser MIN_DURACION_EVALUACION_REGULAR");
  assert.equal(p.umbralAprobacion, UMBRAL_APROBACION_REGULAR, "umbralAprobacion debe ser UMBRAL_APROBACION_REGULAR");
});

caso("P6", "parametrosPerfil neurodivergente usa constantes de ventanas.ts", () => {
  const p = parametrosPerfil("neurodivergente");
  assert.equal(p.duracionMin, MIN_DURACION_EVALUACION_NEURODIVERGENTE, "duracionMin debe ser MIN_DURACION_EVALUACION_NEURODIVERGENTE");
  assert.equal(p.umbralAprobacion, UMBRAL_APROBACION_NEURODIVERGENTE, "umbralAprobacion debe ser UMBRAL_APROBACION_NEURODIVERGENTE");
});

// ——— aprueba: bordes regular ———

caso("A1", "aprueba regular: 69.99 → false", () => {
  assert.equal(aprueba(69.99, "regular"), false);
});

caso("A2", "aprueba regular: 70 → true", () => {
  assert.equal(aprueba(70, "regular"), true);
});

caso("A3", "aprueba regular: 70.01 → true", () => {
  assert.equal(aprueba(70.01, "regular"), true);
});

caso("A4", "aprueba regular: 69.5 → false (sin redondeo)", () => {
  assert.equal(aprueba(69.5, "regular"), false);
});

// ——— aprueba: bordes neurodivergente ———

caso("A5", "aprueba neurodivergente: 49.99 → false", () => {
  assert.equal(aprueba(49.99, "neurodivergente"), false);
});

caso("A6", "aprueba neurodivergente: 50 → true", () => {
  assert.equal(aprueba(50, "neurodivergente"), true);
});

caso("A7", "aprueba neurodivergente: 50.01 → true", () => {
  assert.equal(aprueba(50.01, "neurodivergente"), true);
});

// ——— aprueba: bordes 0 y 100 ———

caso("A8", "aprueba regular: 0 → false", () => {
  assert.equal(aprueba(0, "regular"), false);
});

caso("A9", "aprueba regular: 100 → true", () => {
  assert.equal(aprueba(100, "regular"), true);
});

caso("A10", "aprueba neurodivergente: 0 → false", () => {
  assert.equal(aprueba(0, "neurodivergente"), false);
});

caso("A11", "aprueba neurodivergente: 100 → true", () => {
  assert.equal(aprueba(100, "neurodivergente"), true);
});

// ——— aprueba: entradas inválidas ———

caso("A12", "aprueba: NaN → RangeError", () => {
  assert.throws(() => aprueba(NaN, "regular"), RangeError);
});

caso("A13", "aprueba: Infinity → RangeError", () => {
  assert.throws(() => aprueba(Infinity, "regular"), RangeError);
});

caso("A14", "aprueba: -1 → RangeError", () => {
  assert.throws(() => aprueba(-1, "regular"), RangeError);
});

caso("A15", "aprueba: 100.01 → RangeError", () => {
  assert.throws(() => aprueba(100.01, "regular"), RangeError);
});

// ——— etiquetaResultado: 4 evaluaciones × aprobado/no ———

caso("E1", "etiquetaResultado E2 aprobado → 'Aprobada'", () => {
  assert.equal(etiquetaResultado("E2", true), "Aprobada");
});

caso("E2", "etiquetaResultado E2 no aprobado → 'No aprobada'", () => {
  assert.equal(etiquetaResultado("E2", false), "No aprobada");
});

caso("E3", "etiquetaResultado E1 aprobado → 'Logrado'", () => {
  assert.equal(etiquetaResultado("E1", true), "Logrado");
});

caso("E4", "etiquetaResultado E1 no aprobado → 'No logrado'", () => {
  assert.equal(etiquetaResultado("E1", false), "No logrado");
});

caso("E5", "etiquetaResultado E3 aprobado → 'Logrado'", () => {
  assert.equal(etiquetaResultado("E3", true), "Logrado");
});

caso("E6", "etiquetaResultado E3 no aprobado → 'No logrado'", () => {
  assert.equal(etiquetaResultado("E3", false), "No logrado");
});

caso("E7", "etiquetaResultado E4 aprobado → 'Logrado'", () => {
  assert.equal(etiquetaResultado("E4", true), "Logrado");
});

caso("E8", "etiquetaResultado E4 no aprobado → 'No logrado'", () => {
  assert.equal(etiquetaResultado("E4", false), "No logrado");
});

// ——— FRACCION_ENFASIS_SUBTEMAS ———

caso("F1", "FRACCION_ENFASIS_SUBTEMAS = 0.35 (ENMENDADO 2026-11-19, antes 0.5)", () => {
  assert.equal(FRACCION_ENFASIS_SUBTEMAS, 0.35);
});

// ——— minimoPreguntasDeSubtemasFallados ———

caso("M1", "minimoPreguntasDeSubtemasFallados(12) → 5 (⌈12×0.35⌉=⌈4.2⌉=5, antes 6)", () => {
  assert.equal(minimoPreguntasDeSubtemasFallados(12), 5);
});

caso("M2", "minimoPreguntasDeSubtemasFallados(11) → 4 (⌈11×0.35⌉=⌈3.85⌉=4, antes 6)", () => {
  assert.equal(minimoPreguntasDeSubtemasFallados(11), 4);
});

caso("M3", "minimoPreguntasDeSubtemasFallados(1) → 1 (⌈1×0.35⌉=⌈0.35⌉=1, sin cambio)", () => {
  assert.equal(minimoPreguntasDeSubtemasFallados(1), 1);
});

caso("M4", "minimoPreguntasDeSubtemasFallados(0) → RangeError", () => {
  assert.throws(() => minimoPreguntasDeSubtemasFallados(0), RangeError);
});

caso("M5", "minimoPreguntasDeSubtemasFallados(2.5) → RangeError", () => {
  assert.throws(() => minimoPreguntasDeSubtemasFallados(2.5), RangeError);
});

caso("M6", "minimoPreguntasDeSubtemasFallados(-1) → RangeError", () => {
  assert.throws(() => minimoPreguntasDeSubtemasFallados(-1), RangeError);
});

// ——— Resumen ———

salida.push("");
salida.push(`perfiles: ${casos} casos, ${fallas} fallas`);
console.log(salida.join("\n"));

if (fallas > 0) {
  process.exit(1);
}
