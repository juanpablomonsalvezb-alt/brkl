import assert from "node:assert/strict";
import {
  CLAVE_LECTURA,
  CONTRASTES,
  FUENTES,
  LECTURA_POR_DEFECTO,
  TAMANOS,
  leerLecturaGuardada,
  normalizarLectura,
} from "../shared/lectura";

const clavesEsperadas = ["contraste", "fuente", "tamano"];
const defectoInicial = { ...LECTURA_POR_DEFECTO };

function comprobarClaves(valor: unknown): asserts valor is Record<string, unknown> {
  assert.deepEqual(Object.keys(valor as object).sort(), clavesEsperadas);
}

for (const texto of [null, "", "no es JSON", '"5"', "[]", "null"]) {
  const resultado = leerLecturaGuardada(texto);
  assert.deepEqual(resultado, LECTURA_POR_DEFECTO);
  comprobarClaves(resultado);
}

const campoInvalido = leerLecturaGuardada('{"tamano":"enorme"}');
assert.deepEqual(campoInvalido, LECTURA_POR_DEFECTO);
comprobarClaves(campoInvalido);

const extras = normalizarLectura({ tamano: "grande", extra: true, otro: "dato" });
assert.deepEqual(extras, { ...LECTURA_POR_DEFECTO, tamano: "grande" });
comprobarClaves(extras);

for (const tamano of TAMANOS) {
  assert.equal(normalizarLectura({ tamano }).tamano, tamano);
}
for (const fuente of FUENTES) {
  assert.equal(normalizarLectura({ fuente }).fuente, fuente);
}
for (const contraste of CONTRASTES) {
  assert.equal(normalizarLectura({ contraste }).contraste, contraste);
}

for (const tamano of TAMANOS) {
  for (const fuente of FUENTES) {
    for (const contraste of CONTRASTES) {
      const preferencias = { tamano, fuente, contraste };
      const resultado = leerLecturaGuardada(JSON.stringify(preferencias));
      assert.deepEqual(resultado, preferencias);
      comprobarClaves(resultado);
    }
  }
}

assert.deepEqual(LECTURA_POR_DEFECTO, defectoInicial);
assert.equal(CLAVE_LECTURA, "vortice.lectura.v1", "la clave guardada en los navegadores no cambia sin migrar");
assert.notEqual(normalizarLectura(null), LECTURA_POR_DEFECTO, "devuelve una copia, no el objeto compartido");
assert.deepEqual(normalizarLectura([]), LECTURA_POR_DEFECTO);
console.log("lectura: ok");