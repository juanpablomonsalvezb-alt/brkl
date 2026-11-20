// P21 v2 T13: pruebas del efecto «extra disponible» en E2 y corrección de estadoExtra.
// Cubre: E2 normal aprobado, E2 normal reprobado → extra_disponible, E2 extra aprobado → aprobado,
// E2 extra reprobado → reprobada_continua, tercer intento rechazado, idempotencia por envioId,
// E1/E3/E4 sin cambios, violaciones vacío en estados válidos, estadoExtra inicioAt ≥ cierraEn.
// Ejecutar: npx tsx script/p0e-extra.check.ts
import assert from "node:assert/strict";
import {
  consumidos, enviarIntento, esFinal, iniciarIntento, nuevaInstancia, vencer, violaciones,
  type InstanciaP0E, type Resultado,
} from "../shared/p0e";
import { estadoExtra, ventanaExtra } from "../shared/ventanas";

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

const FIN = 1000;
const ok = (r: Resultado) => { assert.ok(r.ok, JSON.stringify(r)); return r; };
const sano = (i: InstanciaP0E) => assert.deepEqual(violaciones(i), [], `violaciones no vacías: ${JSON.stringify(i)}`);

// ——— E2: intento normal aprobado ———

caso("T1", "E2 normal aprobado → cerrado aprobado, efecto 'aprobado'", () => {
  const i = nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true });
  sano(i);
  const r1 = ok(iniciarIntento(i, "a1", 0));
  sano(r1.instancia);
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: true }, 10));
  assert.equal(r2.instancia.estado, "cerrada_aprobada");
  assert.equal(r2.instancia.causaCierre, "aprobacion");
  assert.equal(r2.efectoProceso, "aprobado");
  assert.equal(r2.repetido, false);
  sano(r2.instancia);
});

// ——— E2: intento normal reprobado → extra_disponible ———

caso("T2", "E2 normal reprobado → extra_disponible, instancia disponible para extra", () => {
  const i = nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true });
  sano(i);
  const r1 = ok(iniciarIntento(i, "a1", 0));
  sano(r1.instancia);
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  assert.equal(r2.efectoProceso, "extra_disponible", `se esperaba extra_disponible, obtenido: ${r2.efectoProceso}`);
  assert.equal(r2.instancia.estado, "disponible", "la instancia debe quedar disponible (no cerrada)");
  assert.equal(r2.instancia.extraDisponible, true, "extraDisponible debe ser true");
  assert.equal(r2.instancia.causaCierre, null, "sin causa de cierre");
  assert.equal(consumidos(r2.instancia), 1, "un intento consumido");
  sano(r2.instancia);
});

// ——— E2: extra aprobado → aprobado ———

caso("T3", "E2 extra aprobado → cerrado aprobado, efecto 'aprobado'", () => {
  // Primero fallar el normal para habilitar el extra.
  let i = nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true });
  sano(i);
  const r1 = ok(iniciarIntento(i, "a1", 0));
  sano(r1.instancia);
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  assert.equal(r2.efectoProceso, "extra_disponible");
  i = r2.instancia;
  sano(i);

  // Iniciar el intento extra.
  const r3 = ok(iniciarIntento(i, "a2", 20, "extra"));
  assert.equal(r3.intento.fase, "extra");
  sano(r3.instancia);

  // Aprobar el extra.
  const r4 = ok(enviarIntento(r3.instancia, { intentoId: "a2", envioId: "e2", aprobado: true }, 30));
  assert.equal(r4.instancia.estado, "cerrada_aprobada");
  assert.equal(r4.instancia.causaCierre, "aprobacion");
  assert.equal(r4.efectoProceso, "aprobado");
  assert.equal(r4.repetido, false);
  sano(r4.instancia);
});

// ——— E2: extra reprobado → reprobada_continua ———

caso("T4", "E2 extra reprobado → reprobada_continua, cerrada_agotada", () => {
  let i = nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true });
  sano(i);
  const r1 = ok(iniciarIntento(i, "a1", 0));
  sano(r1.instancia);
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  assert.equal(r2.efectoProceso, "extra_disponible");
  i = r2.instancia;
  sano(i);

  const r3 = ok(iniciarIntento(i, "a2", 20, "extra"));
  sano(r3.instancia);
  const r4 = ok(enviarIntento(r3.instancia, { intentoId: "a2", envioId: "e2", aprobado: false }, 30));
  assert.equal(r4.efectoProceso, "reprobada_continua", `se esperaba reprobada_continua, obtenido: ${r4.efectoProceso}`);
  assert.equal(r4.instancia.estado, "cerrada_agotada");
  assert.equal(r4.instancia.causaCierre, "agotamiento");
  assert.equal(r4.instancia.extraAgotado, true);
  assert.equal(consumidos(r4.instancia), 2, "dos intentos consumidos (normal + extra)");
  sano(r4.instancia);
});

// ——— Tercer intento rechazado ———

caso("T5", "E2: tercer intento rechazado tras fallar normal y extra", () => {
  let i = nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true });
  sano(i);
  const r1 = ok(iniciarIntento(i, "a1", 0));
  sano(r1.instancia);
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  i = r2.instancia;
  sano(i);

  const r3 = ok(iniciarIntento(i, "a2", 20, "extra"));
  sano(r3.instancia);
  const r4 = ok(enviarIntento(r3.instancia, { intentoId: "a2", envioId: "e2", aprobado: false }, 30));
  i = r4.instancia;
  sano(i);

  // Intentar un tercer intento (normal) → instancia cerrada.
  const r5 = iniciarIntento(i, "a3", 40);
  assert.equal(r5.ok, false);
  assert.equal((r5 as { motivo: string }).motivo, "instancia_cerrada");

  // Intentar un tercer intento (extra) → instancia cerrada.
  const r6 = iniciarIntento(i, "a3", 40, "extra");
  assert.equal(r6.ok, false);
  assert.equal((r6 as { motivo: string }).motivo, "instancia_cerrada");
});

// ——— Idempotencia por envioId ———

caso("T6", "E2: reenvío del intento normal fallido (idempotencia) → extra_disponible", () => {
  const i = nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true });
  sano(i);
  const r1 = ok(iniciarIntento(i, "a1", 0));
  sano(r1.instancia);
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  assert.equal(r2.efectoProceso, "extra_disponible");
  assert.equal(r2.repetido, false);

  // Reenvío idempotente.
  const r3 = ok(enviarIntento(r2.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 11));
  assert.equal(r3.repetido, true);
  assert.equal(r3.efectoProceso, "extra_disponible", "el reenvío debe devolver el mismo efecto");
  assert.equal(r3.instancia, r2.instancia, "la instancia no cambia");
  sano(r3.instancia);
});

caso("T7", "E2: reenvío del extra fallido (idempotencia) → reprobada_continua", () => {
  let i = nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true });
  sano(i);
  const r1 = ok(iniciarIntento(i, "a1", 0));
  sano(r1.instancia);
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  i = r2.instancia;
  sano(i);

  const r3 = ok(iniciarIntento(i, "a2", 20, "extra"));
  sano(r3.instancia);
  const r4 = ok(enviarIntento(r3.instancia, { intentoId: "a2", envioId: "e2", aprobado: false }, 30));
  assert.equal(r4.efectoProceso, "reprobada_continua");

  // Reenvío idempotente del extra.
  const r5 = ok(enviarIntento(r4.instancia, { intentoId: "a2", envioId: "e2", aprobado: false }, 31));
  assert.equal(r5.repetido, true);
  assert.equal(r5.efectoProceso, "reprobada_continua", "el reenvío del extra debe devolver reprobada_continua");
  sano(r5.instancia);
});

// ——— E1, E3, E4: mismo comportamiento que antes ———

caso("T8", "E1 (maxIntentos=2): fallar 2 → sin_definir, como antes", () => {
  let i = nuevaInstancia({ maxIntentos: 2, finExtension: FIN }); // esE2=false por defecto
  sano(i);
  const r1 = ok(iniciarIntento(i, "a1", 0));
  sano(r1.instancia);
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  assert.equal(r2.efectoProceso, null, "primer fallo de E1 → null");
  sano(r2.instancia);

  const r3 = ok(iniciarIntento(r2.instancia, "a2", 20));
  sano(r3.instancia);
  const r4 = ok(enviarIntento(r3.instancia, { intentoId: "a2", envioId: "e2", aprobado: false }, 30));
  assert.equal(r4.efectoProceso, "sin_definir", "agotamiento E1 → sin_definir");
  assert.equal(r4.instancia.estado, "cerrada_agotada");
  sano(r4.instancia);
});

caso("T9", "E1 (maxIntentos=2): aprobar en segundo intento → aprobado", () => {
  let i = nuevaInstancia({ maxIntentos: 2, finExtension: FIN });
  sano(i);
  const r1 = ok(iniciarIntento(i, "a1", 0));
  sano(r1.instancia);
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  assert.equal(r2.efectoProceso, null);
  sano(r2.instancia);

  const r3 = ok(iniciarIntento(r2.instancia, "a2", 20));
  sano(r3.instancia);
  const r4 = ok(enviarIntento(r3.instancia, { intentoId: "a2", envioId: "e2", aprobado: true }, 30));
  assert.equal(r4.efectoProceso, "aprobado");
  assert.equal(r4.instancia.estado, "cerrada_aprobada");
  sano(r4.instancia);
});

caso("T10", "E3/E4 (maxIntentos=2): primer fallo → null, instancia disponible", () => {
  const i = nuevaInstancia({ maxIntentos: 2, finExtension: FIN });
  sano(i);
  const r1 = ok(iniciarIntento(i, "a1", 0));
  sano(r1.instancia);
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  assert.equal(r2.efectoProceso, null);
  assert.equal(r2.instancia.estado, "disponible");
  sano(r2.instancia);
});

caso("T11", "E1: aprobar en primer intento → aprobado", () => {
  const i = nuevaInstancia({ maxIntentos: 2, finExtension: FIN });
  sano(i);
  const r1 = ok(iniciarIntento(i, "a1", 0));
  sano(r1.instancia);
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: true }, 10));
  assert.equal(r2.efectoProceso, "aprobado");
  assert.equal(r2.instancia.estado, "cerrada_aprobada");
  sano(r2.instancia);
});

// ——— violaciones vacío en todos los estados válidos ———

caso("T12", "violaciones vacío: E2 en cada estado del flujo completo", () => {
  let i = nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true });
  sano(i); // disponible inicial

  const r1 = ok(iniciarIntento(i, "a1", 0));
  sano(r1.instancia); // en_curso

  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  sano(r2.instancia); // disponible con extraDisponible

  const r3 = ok(iniciarIntento(r2.instancia, "a2", 20, "extra"));
  sano(r3.instancia); // en_curso (extra)

  const r4 = ok(enviarIntento(r3.instancia, { intentoId: "a2", envioId: "e2", aprobado: false }, 30));
  sano(r4.instancia); // cerrada_agotada (reprobada_continua)
});

caso("T13", "violaciones vacío: E2 extra aprobado", () => {
  let i = nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true });
  sano(i);
  const r1 = ok(iniciarIntento(i, "a1", 0));
  sano(r1.instancia);
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  sano(r2.instancia);
  const r3 = ok(iniciarIntento(r2.instancia, "a2", 20, "extra"));
  sano(r3.instancia);
  const r4 = ok(enviarIntento(r3.instancia, { intentoId: "a2", envioId: "e2", aprobado: true }, 30));
  sano(r4.instancia); // cerrada_aprobada
});

// ——— estadoExtra: inicioAt ≥ cierraEn debe lanzar RangeError ———

caso("T14", "estadoExtra: inicioAt = cierraEn → RangeError", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  const { cierraEn } = ventanaExtra(publicadoAt);
  assert.throws(
    () => estadoExtra(cierraEn + 100, publicadoAt, cierraEn),
    RangeError,
    "inicioAt igual a cierraEn debe lanzar RangeError"
  );
});

caso("T15", "estadoExtra: inicioAt > cierraEn → RangeError", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  const { cierraEn } = ventanaExtra(publicadoAt);
  const inicioAt = cierraEn + 3600; // 1 h después del cierre
  assert.throws(
    () => estadoExtra(inicioAt, publicadoAt, inicioAt),
    RangeError,
    "inicioAt posterior a cierraEn debe lanzar RangeError"
  );
});

caso("T16", "estadoExtra: inicioAt < cierraEn → en_curso (no lanza)", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  const { habilitaDesde, cierraEn } = ventanaExtra(publicadoAt);
  const inicioAt = cierraEn - 1; // 1 s antes del cierre
  const s = estadoExtra(cierraEn + 100, publicadoAt, inicioAt);
  assert.equal(s, "en_curso", "inicio antes de cierraEn → en_curso");
});

// ——— E2: extra no disponible sin fallar normal ———

caso("T17", "E2: iniciar extra sin fallar normal → extra_no_disponible", () => {
  const i = nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true });
  sano(i);
  const r = iniciarIntento(i, "a1", 0, "extra");
  assert.equal(r.ok, false);
  assert.equal((r as { motivo: string }).motivo, "extra_no_disponible");
});

// ——— E2: fase extra en instancia no-E2 ———

caso("T18", "no-E2: iniciar con fase extra → extra_no_disponible", () => {
  const i = nuevaInstancia({ maxIntentos: 2, finExtension: FIN }); // esE2=false
  sano(i);
  const r = iniciarIntento(i, "a1", 0, "extra");
  assert.equal(r.ok, false);
  assert.equal((r as { motivo: string }).motivo, "extra_no_disponible");
});

// T19: cierre de la mutación «E2 extra sin verificar esE2» — instancia incoherente
// (esE2: false, extraDisponible: true) debe ser rechazada con extra_no_disponible.

caso("T19", "instancia incoherente (esE2=false, extraDisponible=true): iniciar extra → extra_no_disponible", () => {
  // Construir a mano una instancia incoherente: esE2=false pero extraDisponible=true.
  // En flujo normal esto no puede ocurrir, pero la máquina debe rechazarlo.
  const i: InstanciaP0E = {
    estado: "disponible",
    maxIntentos: 1,
    finExtension: FIN,
    intentos: [],
    causaCierre: null,
    esE2: false,
    extraDisponible: true, // incoherente: no es E2 pero extraDisponible=true
    extraAgotado: false,
  };
  const r = iniciarIntento(i, "a1", 0, "extra");
  assert.equal(r.ok, false, "debe rechazar el intento extra en instancia no-E2");
  assert.equal((r as { motivo: string }).motivo, "extra_no_disponible");
});

// ——— Resumen ———

salida.push("");
salida.push(`p0e-extra: ${casos} casos, ${fallas} fallas`);
console.log(salida.join("\n"));

if (fallas > 0) {
  process.exit(1);
}
