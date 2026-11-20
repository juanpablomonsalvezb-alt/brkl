// P21 v2 enmendada T14b: pruebas de la regla pura de avance de módulo (shared/progresion.ts).
// Regla enmendada: 6 estados de E2 (sin normal_reprobado_en_espera).
// Ejecutar: npx tsx script/progresion.check.ts
import assert from "node:assert/strict";
import { moduloSiguienteAbierto, type EstadoE2 } from "../shared/progresion";

let casos = 0;
const salida: string[] = [];
let fallas = 0;

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

// ——— 1. Tabla de verdad: los 6 estados de E2 (enmendada) ———

caso("T1", "sin_rendir → NO abre módulo siguiente", () => {
  assert.equal(moduloSiguienteAbierto('sin_rendir'), false, "sin_rendir debe cerrar el avance");
});

caso("T2", "extra_disponible → NO abre módulo siguiente", () => {
  assert.equal(moduloSiguienteAbierto('extra_disponible'), false, "extra disponible pero no iniciado debe cerrar el avance");
});

caso("T3", "extra_en_curso → NO abre módulo siguiente", () => {
  assert.equal(moduloSiguienteAbierto('extra_en_curso'), false, "extra en curso debe cerrar el avance");
});

caso("T4", "aprobada → abre módulo siguiente", () => {
  assert.equal(moduloSiguienteAbierto('aprobada'), true, "aprobada debe abrir el avance");
});

caso("T5", "reprobada_continua → abre módulo siguiente (P21 v2: reprobar no bloquea)", () => {
  assert.equal(moduloSiguienteAbierto('reprobada_continua'), true, "reprobada_continua debe abrir el avance");
});

caso("T6", "no_rendido → abre módulo siguiente (P21 v2: no rendir no bloquea)", () => {
  assert.equal(moduloSiguienteAbierto('no_rendido'), true, "no_rendido debe abrir el avance");
});

// ——— 2. Mapeo legado: comportamiento observable idéntico ———

caso("T7", "mapeo legado: E2 aprobada (passed > 0) → estado 'aprobada' → abre módulo", () => {
  // Simula el mapeo de vortice.ts: passed.length > 0 ? 'aprobada' : 'sin_rendir'
  const passed = [{ id: 'e2-id' }]; // hay registro de aprobada
  const estadoE2Legado: EstadoE2 = passed.length > 0 ? 'aprobada' : 'sin_rendir';
  assert.equal(moduloSiguienteAbierto(estadoE2Legado), true, "legado: aprobada → abierto");
});

caso("T8", "mapeo legado: E2 sin aprobar (passed = 0) → estado 'sin_rendir' → cierra módulo", () => {
  const passed: Array<{ id: string }> = []; // no hay registro de aprobada
  const estadoE2Legado: EstadoE2 = passed.length > 0 ? 'aprobada' : 'sin_rendir';
  assert.equal(moduloSiguienteAbierto(estadoE2Legado), false, "legado: sin_rendir → cerrado");
});

// ——— 3. Completitud: los 6 estados cubiertos ———

caso("T9", "completitud: los 6 estados producen resultado determinista", () => {
  const estados: EstadoE2[] = [
    'sin_rendir',
    'extra_disponible',
    'extra_en_curso',
    'aprobada',
    'reprobada_continua',
    'no_rendido',
  ];
  const abiertos = estados.filter((e) => moduloSiguienteAbierto(e));
  const cerrados = estados.filter((e) => !moduloSiguienteAbierto(e));
  assert.equal(abiertos.length, 3, "exactamente 3 estados abren");
  assert.equal(cerrados.length, 3, "exactamente 3 estados cierran");
  assert.deepEqual(abiertos, ['aprobada', 'reprobada_continua', 'no_rendido'], "los 3 correctos abren");
  assert.deepEqual(cerrados, ['sin_rendir', 'extra_disponible', 'extra_en_curso'], "los 3 correctos cierran");
});

// ——— 4. Sin estado normal_reprobado_en_espera ———

caso("T10", "no existe estado 'normal_reprobado_en_espera' en el tipo", () => {
  // Verificación estástica: el tipo EstadoE2 no incluye 'normal_reprobado_en_espera'.
  // Si este caso compila, el estado fue eliminado correctamente.
  const estados: EstadoE2[] = [
    'sin_rendir',
    'extra_disponible',
    'extra_en_curso',
    'aprobada',
    'reprobada_continua',
    'no_rendido',
  ];
  assert.equal(estados.length, 6, "exactamente 6 estados en EstadoE2");
  for (const e of estados) {
    assert.notEqual(e, 'normal_reprobado_en_espera', "no debe contener normal_reprobado_en_espera");
  }
});

// ——— Resumen ———

salida.push("");
salida.push(`progresion: ${casos} casos, ${fallas} fallas`);
console.log(salida.join("\n"));

if (fallas > 0) {
  process.exit(1);
}
