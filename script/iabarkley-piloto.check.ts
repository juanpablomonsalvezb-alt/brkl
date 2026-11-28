// Verificación automática del piloto IABARKLEY Fase 4: Matemática · Módulo 1.
// Ejecutar con: npx tsx script/iabarkley-piloto.check.ts
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ENRIQUECIMIENTO_MATEMATICA_M1 } from "../client/src/data/iabarkley/matematica-m1";
import { obtenerLeccionesPilotoPublicas } from "../server/aulaUniversalCatalogo";

const ROOT = process.cwd();
const EXPECTED_OAS = ["oa7", "oa8", "oa10", "oa11", "oa13"] as const;

function leer(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

// 1. Cobertura exacta de los 5 OA autorizados del piloto
const keys = Object.keys(ENRIQUECIMIENTO_MATEMATICA_M1).sort();
assert.deepEqual(
  keys,
  [...EXPECTED_OAS].sort(),
  "La capa IABARKLEY debe cubrir exactamente oa7, oa8, oa10, oa11 y oa13",
);

// 2. Integridad de todos los campos pedagógicos requeridos
for (const oaId of EXPECTED_OAS) {
  const item = ENRIQUECIMIENTO_MATEMATICA_M1[oaId];
  assert.ok(item, `Falta enriquecimiento para ${oaId}`);
  assert.ok(
    item.conocimientosPrevios.length >= 2 && item.conocimientosPrevios.length <= 3,
    `${oaId}: conocimientosPrevios debe tener 2 a 3 ítems`,
  );
  for (const idea of item.conocimientosPrevios) {
    assert.ok(idea.trim().length >= 20, `${oaId}: conocimiento previo demasiado breve`);
  }

  assert.ok(item.analogia.titulo.trim().length >= 10, `${oaId}: falta título de analogía`);
  assert.ok(item.analogia.explicacion.trim().length >= 30, `${oaId}: falta explicación de analogía`);
  assert.ok(item.analogia.limite.trim().length >= 20, `${oaId}: toda analogía debe declarar su límite`);

  assert.ok(item.contraejemplo.enunciado.trim().length >= 15, `${oaId}: falta enunciado de contraejemplo`);
  assert.ok(item.contraejemplo.porQueNoSirve.trim().length >= 30, `${oaId}: falta explicación de contraejemplo`);

  assert.ok(item.modeladoPorque.porqueFunciona.trim().length >= 30, `${oaId}: falta porqué del modelado`);
  assert.ok(item.modeladoPorque.comoVerificar.trim().length >= 25, `${oaId}: falta verificación del modelado`);

  assert.ok(item.guiaLecturaVisual.queObservar.trim().length >= 25, `${oaId}: falta guía de lectura visual`);
  assert.ok(item.guiaLecturaVisual.otraForma.trim().length >= 25, `${oaId}: falta representación alternativa`);

  assert.ok(item.errorFrecuenteCausa.porqueOcurre.trim().length >= 25, `${oaId}: falta causa del error frecuente`);
  assert.ok(item.errorFrecuenteCausa.comoEvitarlo.trim().length >= 25, `${oaId}: falta prevención del error frecuente`);

  assert.ok(
    item.reflexionMetacognitiva.length >= 2 && item.reflexionMetacognitiva.length <= 3,
    `${oaId}: reflexionMetacognitiva debe tener 2 a 3 preguntas`,
  );
  for (const p of item.reflexionMetacognitiva) {
    assert.ok(p.includes("¿") && p.includes("?"), `${oaId}: reflexión debe ser pregunta abierta`);
  }
}

// 3. Fidelidad curricular y cero alteración del catálogo público oficial
const lecciones = obtenerLeccionesPilotoPublicas();
assert.equal(lecciones.length, 5, "El catálogo oficial del piloto debe conservar sus 5 OA");
for (const leccion of lecciones) {
  assert.ok(
    leccion.oaId in ENRIQUECIMIENTO_MATEMATICA_M1,
    `Falta enriquecimiento para OA oficial ${leccion.oaId}`,
  );
  assert.ok(leccion.ejerciciosPractica.length === 2, `${leccion.oaId}: deben mantenerse los 2 ejercicios públicos`);
  assert.equal(
    "respuestaCorrecta" in leccion.ejerciciosPractica[0],
    false,
    "No deben exponerse respuestas correctas en la vista pública",
  );
}

// 4. Reglas de estilo y límites estrictos en los archivos modificados del cliente
const dataSrc = leer("client/src/data/iabarkley/matematica-m1.ts");
const guiaSrc = leer("client/src/components/vortice/GuiaEstudioModulo.tsx");
const cssSrc = leer("client/src/pages/vortice/guia-estudio.css");

assert.equal(dataSrc.includes("—"), false, "matematica-m1.ts no debe contener rayas largas (—)");
assert.equal(guiaSrc.includes("—"), false, "GuiaEstudioModulo.tsx no debe contener rayas largas (—)");

for (const prohibido of ["respuestaCorrecta", "explicacionCorrecta", "server/aulaUniversalCatalogo"]) {
  assert.equal(dataSrc.includes(prohibido), false, `matematica-m1.ts no debe referenciar ${prohibido}`);
  assert.equal(guiaSrc.includes(prohibido), false, `GuiaEstudioModulo.tsx no debe referenciar ${prohibido}`);
}

for (const verdeProhibido of ["--vx-verde", "#10b981", "#22c55e", "#16a34a", "emerald", "green"]) {
  assert.equal(
    cssSrc.toLowerCase().includes(verdeProhibido),
    false,
    `guia-estudio.css no debe introducir color verde (${verdeProhibido})`,
  );
}

assert.ok(
  guiaSrc.includes("Sin nota · solo para reflexionar"),
  "La reflexión metacognitiva debe indicar explícitamente que es sin nota",
);

console.log("OK · IABARKLEY Fase 4 Piloto Matemática M1 verificado (5 OA, 0 filtraciones, 0 verde, 0 rayas largas).");
