// Pruebas de lógica pura de atención por inactividad.
import assert from "node:assert/strict";
import { diasSinActividad, nivelDeAtencion, UMBRAL_AVISO_ESTUDIANTE_DIAS, UMBRAL_ATENCION_DIAS } from "../shared/atencion";

// --- Constantes ---
assert.equal(UMBRAL_AVISO_ESTUDIANTE_DIAS, 3);
assert.equal(UMBRAL_ATENCION_DIAS, 5);

// --- diasSinActividad: desde null → null ---
assert.equal(diasSinActividad(new Date("2026-10-20T15:00:00Z"), new Date("2026-10-10T15:00:00Z"), null), null);

// --- diasSinActividad: sin actividad, referencia = desde ---
// Matriculado el 10 oct (Chile), ahora 20 oct → 10 días.
assert.equal(
  diasSinActividad(
    new Date("2026-10-20T15:00:00Z"), // 12:00 Chile
    null,
    new Date("2026-10-10T15:00:00Z"), // 12:00 Chile
  ),
  10,
);

// --- diasSinActividad: actividad reciente ---
// Última actividad ayer → 1 día.
assert.equal(
  diasSinActividad(
    new Date("2026-10-20T15:00:00Z"), // 12:00 Chile
    new Date("2026-10-19T15:00:00Z"), // 12:00 Chile
    new Date("2026-10-10T15:00:00Z"),
  ),
  1,
);

// --- diasSinActividad: actividad anterior a desde → cuenta desde desde ---
// Actividad el 5 oct, pero desde es 10 oct → referencia = desde (10 oct).
assert.equal(
  diasSinActividad(
    new Date("2026-10-20T15:00:00Z"), // 12:00 Chile
    new Date("2026-10-05T15:00:00Z"), // antes de desde
    new Date("2026-10-10T15:00:00Z"),
  ),
  10,
);

// --- diasSinActividad: referencia futura → 0 ---
assert.equal(
  diasSinActividad(
    new Date("2026-10-10T15:00:00Z"),
    new Date("2026-10-20T15:00:00Z"),
    new Date("2026-10-05T15:00:00Z"),
  ),
  0,
);

// --- Límites exactos: 2 días → al_dia ---
assert.equal(
  diasSinActividad(
    new Date("2026-10-12T15:00:00Z"),
    new Date("2026-10-10T15:00:00Z"),
    new Date("2026-10-01T15:00:00Z"),
  ),
  2,
);
assert.equal(nivelDeAtencion(2), "al_dia");

// --- 3 días → aviso_estudiante ---
assert.equal(
  diasSinActividad(
    new Date("2026-10-13T15:00:00Z"),
    new Date("2026-10-10T15:00:00Z"),
    new Date("2026-10-01T15:00:00Z"),
  ),
  3,
);
assert.equal(nivelDeAtencion(3), "aviso_estudiante");

// --- 4 días → aviso_estudiante ---
assert.equal(
  diasSinActividad(
    new Date("2026-10-14T15:00:00Z"),
    new Date("2026-10-10T15:00:00Z"),
    new Date("2026-10-01T15:00:00Z"),
  ),
  4,
);
assert.equal(nivelDeAtencion(4), "aviso_estudiante");

// --- 5 días → atencion ---
assert.equal(
  diasSinActividad(
    new Date("2026-10-15T15:00:00Z"),
    new Date("2026-10-10T15:00:00Z"),
    new Date("2026-10-01T15:00:00Z"),
  ),
  5,
);
assert.equal(nivelDeAtencion(5), "atencion");

// --- 6 días → atencion ---
assert.equal(nivelDeAtencion(6), "atencion");

// --- null → al_dia ---
assert.equal(nivelDeAtencion(null), "al_dia");

// --- 0 → al_dia ---
assert.equal(nivelDeAtencion(0), "al_dia");

// --- Cambio de hora: alrededor del 2026-09-06 (Chile pasa de UTC-4 a UTC-3) ---
// El 5 sep a las 15:00 UTC = 11:00 Chile (UTC-4).
// El 6 sep a las 15:00 UTC = 13:00 Chile (UTC-3, ya cambió).
// Debería contar 1 día civil.
const antesHorario = new Date("2026-09-05T15:00:00Z"); // 11:00 Chile UTC-4
const despuesHorario = new Date("2026-09-06T15:00:00Z"); // 13:00 Chile UTC-3
assert.equal(
  diasSinActividad(despuesHorario, antesHorario, new Date("2026-09-01T15:00:00Z")),
  1,
  "cambio de hora septiembre: debería ser 1 día",
);

// --- Cambio de hora: alrededor del 2027-04-04 (Chile pasa de UTC-3 a UTC-4) ---
const antesHorarioAbril = new Date("2027-04-03T15:00:00Z"); // 12:00 Chile UTC-3
const despuesHorarioAbril = new Date("2027-04-04T15:00:00Z"); // 11:00 Chile UTC-4
assert.equal(
  diasSinActividad(despuesHorarioAbril, antesHorarioAbril, new Date("2027-04-01T15:00:00Z")),
  1,
  "cambio de hora abril: debería ser 1 día",
);

// --- Actividad a las 23:30 Chile, ahora a las 00:30 del día siguiente → 1 día ---
// 23:30 Chile = 02:30 UTC del día siguiente.
// 00:30 Chile = 03:30 UTC del mismo día.
// Ahora: 2026-10-16 03:30 UTC = 00:30 Chile del 16.
// Actividad: 2026-10-15 02:30 UTC = 23:30 Chile del 14... no, ajustemos.
// Queremos: actividad a las 23:30 Chile del 15 = 2026-10-16T02:30:00Z
// Ahora a las 00:30 Chile del 16 = 2026-10-16T03:30:00Z
// Diferencia real: 1 hora, pero días civiles: 16 - 15 = 1 día.
assert.equal(
  diasSinActividad(
    new Date("2026-10-16T03:30:00Z"), // 00:30 Chile 16 oct
    new Date("2026-10-16T02:30:00Z"), // 23:30 Chile 15 oct
    new Date("2026-10-01T15:00:00Z"),
  ),
  1,
  "23:30 a 00:30 del día siguiente cuenta 1 día civil",
);

console.log("atencion: ok");
