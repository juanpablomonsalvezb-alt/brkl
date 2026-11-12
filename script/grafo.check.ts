// IMP-013 (H2): validación técnica del grafo de prerrequisitos (02 §4). Pura, en memoria.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { validarGrafo, type AristaGrafo, type GrafoBorrador } from "../shared/grafo";

const nodos = (...codes: string[]) => codes.map((c) => ({ itemId: `id-${c}`, code: c }));
const a = (item: string, pre: string, o: Partial<AristaGrafo> = {}): AristaGrafo =>
  ({ itemId: `id-${item}`, prerequisiteItemId: `id-${pre}`, relation: "necesaria", altGroup: null, validatedBy: "ficticio-validador", ...o });
const tipos = (g: GrafoBorrador, etapa: 1 | 2 = 1) => { const r = validarGrafo(g, etapa); return r.ok ? [] : r.errores.map((e) => e.tipo); };

// Grafo hipotético de 02 §7: A → B → {C, D}, C → D → E.
const ejemplo: GrafoBorrador = { nodos: nodos("HIP-E", "HIP-C", "HIP-A", "HIP-D", "HIP-B"),
  aristas: [a("HIP-B", "HIP-A"), a("HIP-C", "HIP-B"), a("HIP-D", "HIP-B"), a("HIP-D", "HIP-C"), a("HIP-E", "HIP-D")] };
const r = validarGrafo(ejemplo, 1);
assert.ok(r.ok);
assert.deepEqual(r.ok && r.orden, ["HIP-A", "HIP-B", "HIP-C", "HIP-D", "HIP-E"], "orden topológico");

// Determinismo: el orden de entrada no cambia el resultado; los empates se resuelven por código.
const ramas: GrafoBorrador = { nodos: nodos("Z", "M", "A", "R"), aristas: [a("R", "A")] };
const r1 = JSON.stringify(validarGrafo(ramas, 1));
const baraja = <T,>(l: readonly T[], s: number) => { const r = [...l]; let x = s; for (let i = r.length - 1; i > 0; i--) { x = (x * 1103515245 + 12345) & 0x7fffffff; const j = x % (i + 1); [r[i], r[j]] = [r[j], r[i]]; } return r; };
for (let i = 1; i <= 50; i++) {
  assert.equal(JSON.stringify(validarGrafo({ nodos: baraja(ramas.nodos, i), aristas: ramas.aristas }, 1)), r1);
  assert.equal(JSON.stringify(validarGrafo({ nodos: baraja(ejemplo.nodos, i), aristas: baraja(ejemplo.aristas, i + 99) }, 1)), JSON.stringify(r));
}
assert.deepEqual(JSON.parse(r1).orden, ["A", "M", "R", "Z"]);

// Rechazos con su motivo.
assert.deepEqual(tipos({ nodos: nodos("A", "B"), aristas: [a("B", "A"), a("A", "B")] }), ["ciclo"]);
assert.deepEqual(tipos({ nodos: nodos("A", "B", "C"), aristas: [a("B", "A"), a("C", "B"), a("A", "C")] }), ["ciclo"]);
const conCola = validarGrafo({ nodos: nodos("A", "B", "C"), aristas: [a("A", "B"), a("B", "A"), a("C", "A")] }, 1);
assert.ok(!conCola.ok && conCola.errores.some((e) => e.tipo === "ciclo") && conCola.errores.some((e) => e.tipo === "inalcanzable" && e.code === "C"),
  "lo que depende de un ciclo es inalcanzable");
assert.deepEqual(tipos({ nodos: nodos("A"), aristas: [a("A", "X")] }), ["referencia_externa"]);
assert.deepEqual(tipos({ nodos: nodos("A"), aristas: [a("A", "A")] }), ["autorreferencia"]);
assert.deepEqual(tipos({ nodos: nodos("A", "B"), aristas: [a("B", "A"), a("B", "A")] }), ["arista_duplicada"]);
assert.deepEqual(tipos({ nodos: nodos("A", "B"), aristas: [a("B", "A", { validatedBy: null })] }), ["sin_validador"]);
assert.deepEqual(tipos({ nodos: [...nodos("A"), { itemId: "id-otro", code: "A" }], aristas: [] }), ["codigo_duplicado"]);
// K8: `alternativa` solo en etapa 2, y siempre con grupo.
assert.deepEqual(tipos({ nodos: nodos("A", "B"), aristas: [a("B", "A", { relation: "alternativa", altGroup: "g1" })] }, 1), ["alternativa_en_etapa_1"]);
assert.deepEqual(tipos({ nodos: nodos("A", "B"), aristas: [a("B", "A", { relation: "alternativa", altGroup: "g1" })] }, 2), []);
assert.deepEqual(tipos({ nodos: nodos("A", "B"), aristas: [a("B", "A", { relation: "alternativa", altGroup: null })] }, 2), ["alternativa_sin_grupo"]);
// Una arista contributiva también ordena (02 §4: orienta el orden) y puede formar ciclo.
assert.deepEqual(tipos({ nodos: nodos("A", "B"), aristas: [a("B", "A", { relation: "contributiva" }), a("A", "B")] }), ["ciclo"]);
assert.ok(validarGrafo({ nodos: [], aristas: [] }, 1).ok, "versión vacía: grafo válido");

console.log("grafo: ok");
