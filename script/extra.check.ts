// P21 v2 enmendada T14b: pruebas del plazo del intento extra (funciones puras).
// Regla enmendada: el extra se habilita DESDE la publicación del resultado del intento normal.
// Las 72 h son el PLAZO MÁXIMO (no una espera previa). No existe «ventana de 48 h» ni «espera previa».
// Convención de tiempo: segundos UTC (igual que shared/ventanas.ts).
// Ejecutar: npx tsx script/extra.check.ts
import assert from "node:assert/strict";
import { ventanaExtra, estadoExtra, HORAS_PLAZO_EXTRA } from "../shared/ventanas";

const SEG_POR_HORA = 3600;
const iso = (t: number) => new Date(t * 1000).toISOString().replace(".000Z", "Z");
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

// ——— 1. ventanaExtra: cálculo básico ———

caso("E1", "habilitaDesde = publicadoAt; cierraEn = publicadoAt + 72 h", () => {
  // Publicado el 2026-03-10 12:00 UTC
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  const v = ventanaExtra(publicadoAt);

  assert.equal(v.habilitaDesde, publicadoAt, "habilitaDesde = publicadoAt (sin espera)");
  assert.equal(v.cierraEn, publicadoAt + HORAS_PLAZO_EXTRA * SEG_POR_HORA, "cierraEn = publicadoAt + 72 h");
  assert.equal(v.cierraEn - publicadoAt, 72 * SEG_POR_HORA, "plazo total 72 h desde publicación");
});

caso("E2", "la constante HORAS_PLAZO_EXTRA es 72", () => {
  assert.equal(HORAS_PLAZO_EXTRA, 72, "HORAS_PLAZO_EXTRA = 72");
});

// ——— 2. estadoExtra: bordes exactos ———

caso("E3", "bordes: publicadoAt exacto → disponible", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  assert.equal(estadoExtra(publicadoAt, publicadoAt), "disponible", "en publicadoAt exacto → disponible (sin espera)");
});

caso("E4", "bordes: publicadoAt + 1 s → disponible", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  assert.equal(estadoExtra(publicadoAt + 1, publicadoAt), "disponible", "1 s después de publicadoAt → disponible");
});

caso("E5", "bordes: cierraEn − 1 s → disponible", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  const { cierraEn } = ventanaExtra(publicadoAt);
  const ahora = cierraEn - 1;
  assert.equal(estadoExtra(ahora, publicadoAt), "disponible", "1 s antes de cierraEn → disponible");
});

caso("E6", "bordes: cierraEn exacto → no_rendido", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  const { cierraEn } = ventanaExtra(publicadoAt);
  assert.equal(estadoExtra(cierraEn, publicadoAt), "no_rendido", "en cierraEn exacto → no_rendido (exclusivo)");
});

// ——— 3. estadoExtra: inicio dentro del plazo ———

caso("E7", "inicio justo antes del cierre → en_curso", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  const { cierraEn } = ventanaExtra(publicadoAt);
  const inicioAt = cierraEn - 1; // 1 s antes del cierre
  const ahora = cierraEn + 3600; // 1 h después del cierre
  assert.equal(estadoExtra(ahora, publicadoAt, inicioAt), "en_curso", "inicio antes de cierraEn → en_curso aunque cierraEn pasó");
});

caso("E8", "inicio en publicadoAt exacto → en_curso", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  assert.equal(estadoExtra(publicadoAt + 100, publicadoAt, publicadoAt), "en_curso", "inicio en publicadoAt → en_curso");
});

caso("E9", "sin inicio tras el cierre → no_rendido", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  const { cierraEn } = ventanaExtra(publicadoAt);
  const ahora = cierraEn + 3600; // 1 h después
  assert.equal(estadoExtra(ahora, publicadoAt), "no_rendido", "sin inicio después de cierraEn → no_rendido");
});

// ——— 4. Validación de entradas ———

caso("E10", "inicio antes de publicadoAt → error", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  const inicioAt = publicadoAt - 3600; // 1 h antes de la publicación
  assert.throws(
    () => estadoExtra(publicadoAt, publicadoAt, inicioAt),
    RangeError,
    "inicioAt anterior a publicadoAt debe lanzar RangeError"
  );
});

caso("E11", "inicio ≥ cierraEn → error", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  const { cierraEn } = ventanaExtra(publicadoAt);
  assert.throws(
    () => estadoExtra(cierraEn + 100, publicadoAt, cierraEn),
    RangeError,
    "inicioAt igual a cierraEn debe lanzar RangeError"
  );
  assert.throws(
    () => estadoExtra(cierraEn + 100, publicadoAt, cierraEn + 3600),
    RangeError,
    "inicioAt posterior a cierraEn debe lanzar RangeError"
  );
});

caso("E12", "publicadoAt no finito → error en ventanaExtra", () => {
  assert.throws(() => ventanaExtra(NaN), RangeError, "NaN debe lanzar error");
  assert.throws(() => ventanaExtra(Infinity), RangeError, "Infinity debe lanzar error");
  assert.throws(() => ventanaExtra(-Infinity), RangeError, "-Infinity debe lanzar error");
});

caso("E13", "publicadoAt no finito → error en estadoExtra", () => {
  assert.throws(() => estadoExtra(1000, NaN), RangeError, "publicadoAt NaN debe lanzar error");
  assert.throws(() => estadoExtra(1000, Infinity), RangeError, "publicadoAt Infinity debe lanzar error");
});

caso("E14", "ahora no finito → error en estadoExtra", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  assert.throws(() => estadoExtra(NaN, publicadoAt), RangeError, "ahora NaN debe lanzar error");
  assert.throws(() => estadoExtra(Infinity, publicadoAt), RangeError, "ahora Infinity debe lanzar error");
});

caso("E15", "inicioAt no finito → error en estadoExtra", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  assert.throws(() => estadoExtra(publicadoAt + 100, publicadoAt, NaN), RangeError, "inicioAt NaN debe lanzar error");
});

// ——— 5. Cambio de hora de verano de Chile (DST) ———

caso("E16", "DST Chile: publicado antes del cambio de abril → 72 h exactas", () => {
  // En Chile, el sábado 4 de abril de 2026 a las 24:00 los relojes retroceden a las 23:00
  // (fin del horario de verano, UTC-3 → UTC-4).
  // Publicamos el viernes 3 de abril a las 12:00 UTC.
  const publicadoAt = Date.UTC(2026, 3, 3, 12, 0, 0) / 1000;
  const v = ventanaExtra(publicadoAt);

  // habilitaDesde = publicadoAt (sin espera)
  assert.equal(v.habilitaDesde, publicadoAt, "habilitaDesde = publicadoAt");

  // 72 h exactas en segundos, sin importar el DST.
  assert.equal(
    v.cierraEn - publicadoAt,
    72 * SEG_POR_HORA,
    "cierraEn debe ser exactamente 72 h después de publicadoAt (259200 s)"
  );

  // Los instantes son UTC puros:
  // cierraEn = publicadoAt + 72h = 2026-04-06 12:00:00Z (lunes, después del cambio)
  assert.equal(iso(v.cierraEn), "2026-04-06T12:00:00Z", "cierraEn en UTC");
});

caso("E17", "DST Chile: publicado antes del cambio de septiembre → 72 h exactas", () => {
  // En Chile, el sábado 5 de septiembre de 2026 a las 24:00 los relojes avanzan a las 01:00
  // (inicio del horario de verano, UTC-4 → UTC-3).
  // Publicamos el viernes 4 de septiembre a las 12:00 UTC.
  const publicadoAt = Date.UTC(2026, 8, 4, 12, 0, 0) / 1000;
  const v = ventanaExtra(publicadoAt);

  assert.equal(
    v.cierraEn - publicadoAt,
    72 * SEG_POR_HORA,
    "72 h exactas aunque cruce el inicio de DST"
  );
  // cierraEn = 2026-09-07 12:00:00Z
  assert.equal(iso(v.cierraEn), "2026-09-07T12:00:00Z");
});

// ——— 6. Sin estado 'en_espera' ———

caso("E18", "no existe estado 'en_espera': antes de cierraEn siempre es disponible", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  // Justo en publicadoAt → disponible (no en_espera)
  assert.equal(estadoExtra(publicadoAt, publicadoAt), "disponible");
  // 1 h después → disponible
  assert.equal(estadoExtra(publicadoAt + 3600, publicadoAt), "disponible");
  // 71 h después → disponible
  assert.equal(estadoExtra(publicadoAt + 71 * SEG_POR_HORA, publicadoAt), "disponible");
});

// ——— 7. Tabla de verdad de los 3 estados ———

caso("E19", "tabla de verdad: 3 estados posibles (disponible, en_curso, no_rendido)", () => {
  const publicadoAt = Date.UTC(2026, 2, 10, 12, 0, 0) / 1000;
  const { cierraEn } = ventanaExtra(publicadoAt);

  // disponible: ahora en [publicadoAt, cierraEn), sin inicio
  assert.equal(estadoExtra(publicadoAt, publicadoAt), "disponible");
  assert.equal(estadoExtra(publicadoAt + 3600, publicadoAt), "disponible");
  assert.equal(estadoExtra(cierraEn - 1, publicadoAt), "disponible");

  // en_curso: inicioAt en [publicadoAt, cierraEn)
  assert.equal(estadoExtra(publicadoAt + 100, publicadoAt, publicadoAt), "en_curso");
  assert.equal(estadoExtra(cierraEn + 100, publicadoAt, cierraEn - 1), "en_curso");

  // no_rendido: ahora ≥ cierraEn, sin inicio
  assert.equal(estadoExtra(cierraEn, publicadoAt), "no_rendido");
  assert.equal(estadoExtra(cierraEn + 3600, publicadoAt), "no_rendido");
});

// ——— 8. Funciones puras: determinismo ———

caso("E20", "determinismo: mismo input → mismo output", () => {
  const publicadoAt = Date.UTC(2026, 5, 15, 8, 30, 0) / 1000;
  const v1 = ventanaExtra(publicadoAt);
  const v2 = ventanaExtra(publicadoAt);
  assert.deepEqual(v1, v2, "ventanaExtra es determinista");

  const s1 = estadoExtra(v1.habilitaDesde + 100, publicadoAt);
  const s2 = estadoExtra(v1.habilitaDesde + 100, publicadoAt);
  assert.equal(s1, s2, "estadoExtra es determinista");
});

// ——— Resumen ———

salida.push("");
salida.push(`extra: ${casos} casos, ${fallas} fallas`);
console.log(salida.join("\n"));

if (fallas > 0) {
  process.exit(1);
}
