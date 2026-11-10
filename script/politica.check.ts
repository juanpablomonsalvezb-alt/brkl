// IMP-010: una política con parámetros nulos o inválidos no se ejecuta (TK15).
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { esPoliticaEjecutable, politicaEjecutable, type PoliticaGuardada } from "../shared/politica";

// Valores SOLO DE PRUEBA: las alternativas recomendadas del diseño, ninguna aprobada salvo K6.
const PRUEBA: PoliticaGuardada = {
  k6_min_families: 2, k6_separation: "ninguna", assisted_counts: false, wrong_with_help_counts: false,
  error_repaired_counts: false, retired_counts: true, demote_wrong_families: 2, not_mastered_wrong_families: 2,
};
const r = politicaEjecutable(PRUEBA);
assert.ok(r.ejecutable);
assert.ok(Object.isFrozen(r.politica), "la política ejecutable no se modifica después");

// TK15: cada parámetro nulo, uno por uno, y todos a la vez.
const campos = Object.keys(PRUEBA) as (keyof PoliticaGuardada)[];
for (const k of campos) {
  const x = politicaEjecutable({ ...PRUEBA, [k]: null });
  assert.equal(x.ejecutable, false, `${k} nulo debió volverla no ejecutable`);
  if (!x.ejecutable) assert.deepEqual(x.nulos, [k]);
  const sin = { ...PRUEBA }; delete (sin as any)[k];
  assert.equal(politicaEjecutable(sin).ejecutable, false, `${k} ausente`);
}
const vacia = politicaEjecutable({});
assert.ok(!vacia.ejecutable && vacia.nulos.length === campos.length);

// Valores inválidos.
const invalidos: [keyof PoliticaGuardada, unknown][] = [
  ["k6_min_families", 3], ["k6_min_families", 1], // K6 fija 2
  ["k6_separation", "intervalo:3600"], ["k6_separation", "semana"], // intervalo: no implementado (O2)
  ["assisted_counts", "no"], ["demote_wrong_families", 0], ["demote_wrong_families", 1.5], ["not_mastered_wrong_families", -1],
];
for (const [k, v] of invalidos) {
  const x = politicaEjecutable({ ...PRUEBA, [k]: v as any });
  assert.ok(!x.ejecutable && x.invalidos.includes(k), `${k}=${String(v)} debió ser inválido`);
}
const extra = politicaEjecutable({ ...PRUEBA, umbral_secreto: 1 } as any);
assert.ok(!extra.ejecutable && extra.invalidos.includes("umbral_secreto (desconocido)"));

assert.equal(esPoliticaEjecutable(PRUEBA), true);
assert.equal(esPoliticaEjecutable({ ...PRUEBA, k6_separation: null }), false);
assert.equal(esPoliticaEjecutable(null), false);
console.log(`politica: ok (TK15: ${campos.length} nulos y ${invalidos.length + 1} inválidos rechazados)`);
