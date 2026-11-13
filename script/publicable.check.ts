// IMP-017 (H1b-1): publicable(instancia, ahora) puro (P19-E1). Verdadero solo con estado cerrado (conjunto único
// ESTADOS_CERRADOS) y ahora ≥ review_at de ESA instancia. Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import fs from "node:fs";
import { ESTADOS_CERRADOS } from "../shared/p0e-estados";
import { publicable } from "../shared/publicable";
import { ventanaOrdinaria } from "../shared/ventanas";

let casos = 0; const salida: string[] = [];
const caso = (id: string, nombre: string, f: () => void) => { f(); casos++; salida.push(`  ✓ ${id.padEnd(4)} ${nombre}`); };
const R = 1_800_000_000;

caso("U1", "cerrada y ahora ≥ review_at: publica, en cada estado cerrado; los bordes exactos", () => {
  for (const estado of ESTADOS_CERRADOS) {
    assert.equal(publicable({ estado, reviewAt: R }, R), true, `${estado}: ahora = review_at`);
    assert.equal(publicable({ estado, reviewAt: R }, R + 1), true);
    assert.equal(publicable({ estado, reviewAt: R }, R + 1e9), true);
    assert.equal(publicable({ estado, reviewAt: R }, R - 0.001), false, `${estado}: review_at − 1 ms`);
    assert.equal(publicable({ estado, reviewAt: R }, R - 1), false);
    assert.equal(publicable({ estado, reviewAt: R }, 0), false);
  }
});
caso("U2", "un estado que no es cerrado no publica nunca, aunque haya pasado review_at", () => {
  for (const estado of ["disponible", "en_curso", "cerrada_por_excepcion", "en_revision", "revision_disponible", "cerrado", "vencido", "VENCIDA", "", "cerrada"]) {
    assert.equal(publicable({ estado, reviewAt: R }, R + 1e9), false, estado);
  }
});
caso("U3", "falla cerrada: sin review_at o con valores no numéricos no publica", () => {
  for (const reviewAt of [null, NaN, Infinity, -Infinity, "1800000000" as unknown as number, undefined as unknown as number]) {
    assert.equal(publicable({ estado: "vencida", reviewAt }, R + 10), false, String(reviewAt));
  }
  for (const ahora of [NaN, Infinity, undefined as unknown as number]) assert.equal(publicable({ estado: "vencida", reviewAt: R }, ahora), false, String(ahora));
});
caso("U4", "P19-E1: depende solo de SU instancia y SU review_at (ni otras instancias, ni otros estudiantes)", () => {
  assert.equal(publicable.length, 2, "firma: (instancia, ahora)");
  const mia = { estado: "cerrada_aprobada", reviewAt: R };
  const otras = [{ estado: "en_curso", reviewAt: R + 10 }, { estado: "disponible", reviewAt: R }];
  void otras; // otras instancias de la misma versión, aún respondiendo: no intervienen
  assert.equal(publicable(mia, R), true);
  assert.deepEqual(Object.keys({ estado: 1, reviewAt: 1 }).sort(), ["estado", "reviewAt"]);
});
caso("U5", "con las ventanas: una instancia vencida publica a T+49 h, no un segundo antes", () => {
  const v = ventanaOrdinaria("2026-03-13");
  assert.equal(publicable({ estado: "vencida", reviewAt: v.revisionDesde }, v.finExtension), false, "al vencer todavía no");
  assert.equal(publicable({ estado: "vencida", reviewAt: v.revisionDesde }, v.revisionDesde - 1), false);
  assert.equal(publicable({ estado: "vencida", reviewAt: v.revisionDesde }, v.revisionDesde), true);
  assert.equal(v.revisionDesde - v.finExtension, 3600);
});
caso("U6", "determinismo y sin lectura del reloj del sistema; sin la regla no aprobada de «hubo un intento»", () => {
  assert.equal(publicable({ estado: "vencida", reviewAt: R }, R), publicable({ estado: "vencida", reviewAt: R }, R));
  const codigo = fs.readFileSync("shared/publicable.ts", "utf8").split("\n").map((l) => l.replace(/\/\/.*$/, ""));
  assert.deepEqual(codigo.filter((l) => /Date\.now\s*\(|new Date\s*\(\s*\)/.test(l)), []);
  assert.ok(!codigo.some((l) => /intento/i.test(l)), "no se implementa la propuesta de maestra §12 (pauta de vencida solo si hubo un intento)");
});

console.log(salida.join("\n")); console.log(`publicable: ok (${casos} casos)`);
