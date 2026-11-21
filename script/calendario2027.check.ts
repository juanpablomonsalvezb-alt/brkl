// Chequeo calendario 2027 por nivel.
// Ejecutar: npx tsx script/calendario2027.check.ts
import assert from "node:assert/strict";
import {
  buildConfig2027,
  calcularCalendario,
  contarModulosQueCaben,
  opcionesDeAjuste,
  PERFILES_2027,
  SUPUESTOS_2027,
  formatearFecha,
  imprimirTablaOpciones,
} from "../shared/calendario2027";
import {
  CHILE_TZ,
  DEFAULT_CONFIG,
  getModuleEndDate,
  getModuleStartDate,
  getGeneralEvaluationWeeks,
  ymdIn,
  midnightIn,
} from "../server/calendarUtils";

// ============================================================================
// 1. Plan de 32 semanas desde 8-mar-2027 termina el viernes 15-oct-2027 sin recesos
// ============================================================================

const perfilGeneral = PERFILES_2027.find((p) => p.id === "general")!;
const cfgGeneral = buildConfig2027(perfilGeneral); // sin recesos

// Verificar que el inicio es lunes 8-mar-2027
assert.equal(ymdIn(CHILE_TZ, cfgGeneral.programStartDate), "2027-03-08");

// Módulo 1 empieza lunes 8-mar-2027
assert.equal(ymdIn(CHILE_TZ, getModuleStartDate(1, cfgGeneral)), "2027-03-08");

// Módulo 15 termina domingo 10-oct-2027
assert.equal(ymdIn(CHILE_TZ, getModuleEndDate(15, cfgGeneral)), "2027-10-10");

// Evaluación general después de módulo 7: semana del 14-20 jun
const evals = getGeneralEvaluationWeeks(cfgGeneral);
assert.equal(evals.length, 2);
assert.equal(ymdIn(CHILE_TZ, evals[0].startDate), "2027-06-14"); // lunes
assert.equal(ymdIn(CHILE_TZ, evals[0].endDate), "2027-06-20"); // domingo
assert.equal(ymdIn(CHILE_TZ, evals[1].startDate), "2027-10-11"); // lunes
assert.equal(ymdIn(CHILE_TZ, evals[1].endDate), "2027-10-17"); // domingo

// El viernes de la última evaluación es 15-oct-2027
const calcGeneral = calcularCalendario(cfgGeneral, "2027-10-15");
assert.equal(calcGeneral.fechaFinEvaluaciones, "2027-10-15", "fin evaluaciones debe ser 15-oct");
assert.equal(calcGeneral.cabe, true, "el plan sin recesos debe caber");
assert.equal(calcGeneral.semanasTotales, 32, "deben ser 32 semanas (15 módulos × 2 + 2 de evaluación)");
assert.equal(calcGeneral.semanasDisponibles, 32, "32 semanas disponibles del 8-mar al viernes 15-oct");
assert.equal(calcGeneral.modulosQueCaben, 15, "deben caber los 15 módulos");
assert.equal(calcGeneral.semanasFaltan, 0, "no deben faltar semanas (caso exacto)");

console.log("✓ Caso 1: plan sin recesos termina exactamente el 15-oct-2027");

// ============================================================================
// 2. Con 3 semanas de receso NO cabe y la función lo dice
// ============================================================================

const cfgRecesos = buildConfig2027(perfilGeneral, {
  breaks: SUPUESTOS_2027.breaks,
  holidays: SUPUESTOS_2027.holidays,
});

// Los recesos supuestos suman ~3 semanas bloqueadas (2 de invierno + 1 de Fiestas Patrias)
const recesosCount = SUPUESTOS_2027.breaks.length;
assert.ok(recesosCount >= 2, "deben haber al menos 2 recesos supuestos");

const calcRecesos = calcularCalendario(cfgRecesos, "2027-10-15");
assert.equal(calcRecesos.cabe, false, "con recesos NO debe caber");
assert.ok(calcRecesos.semanasFaltan > 0, "deben faltar semanas con recesos");
assert.ok(calcRecesos.modulosQueCaben < 15, "deben caber menos de 15 módulos con recesos");

// Verificar que los módulos se corren por el receso
// Módulo 9 sin receso empieza 05-jul; con receso (05-17 jul) se corre al 19-jul
const m9SinReceso = ymdIn(CHILE_TZ, getModuleStartDate(9, cfgGeneral));
const m9ConReceso = ymdIn(CHILE_TZ, getModuleStartDate(9, cfgRecesos));
assert.ok(m9ConReceso > m9SinReceso, `módulo 9 debe correrse por receso: ${m9SinReceso} → ${m9ConReceso}`);

console.log("✓ Caso 2: con recesos NO cabe, módulos se corren correctamente");

// ============================================================================
// 3. 4.º medio con tope 15-sep calcula 27 semanas disponibles
// ============================================================================

const perfil4m = PERFILES_2027.find((p) => p.id === "cuarto_medio")!;
const cfg4m = buildConfig2027(perfil4m);
const calc4m = calcularCalendario(cfg4m, "2027-09-15");

assert.equal(calc4m.semanasDisponibles, 27, "4to medio debe tener 27 semanas disponibles");
assert.equal(calc4m.cabe, false, "4to medio sin recesos NO debe caber (mismo plan que general)");
assert.ok(calc4m.semanasFaltan > 0, "4to medio debe tener semanas faltantes");

console.log("✓ Caso 3: 4to medio tiene 27 semanas disponibles, no cabe el plan completo");

// ============================================================================
// 4. Semanas totales correctas (conteo)
// ============================================================================

// Sin recesos: 15 módulos × 2 semanas = 30 + 2 semanas de evaluación = 32 semanas de contenido
// Pero como el inicio es lunes y el fin es viernes de la última semana de evaluación,
// el rango es de 31 semanas (el lunes de la semana 31 es el inicio de la evaluación final)
assert.equal(calcGeneral.semanasTotales, 32, "semanas totales sin recesos debe ser 32");

// Con recesos: 32 semanas de contenido + corrimiento por recesos
assert.ok(calcRecesos.semanasTotales > 32, "con recesos debe ocupar más semanas");

console.log("✓ Caso 4: conteo de semanas correcto");

// ============================================================================
// 5. Corrimiento por receso
// ============================================================================

// El receso de invierno (05-17 jul) bloquea las semanas que lo contienen
// Módulo 8 (21-27 jun) está antes del receso y no se mueve
const m8Sin5 = ymdIn(CHILE_TZ, getModuleStartDate(8, cfgGeneral));
const m8Con5 = ymdIn(CHILE_TZ, getModuleStartDate(8, cfgRecesos));
assert.equal(m8Sin5, m8Con5, `módulo 8 no debe moverse (antes del receso): ${m8Sin5} === ${m8Con5}`);

// Módulo 9 cae dentro del receso y se corre
const m9Sin5 = ymdIn(CHILE_TZ, getModuleStartDate(9, cfgGeneral));
const m9Con5 = ymdIn(CHILE_TZ, getModuleStartDate(9, cfgRecesos));
assert.ok(m9Con5 > m9Sin5, `módulo 9 debe correrse: ${m9Sin5} → ${m9Con5}`);

// Módulos 1-8 no deberían moverse (están antes del receso)
for (let m = 1; m <= 8; m++) {
  const sin = ymdIn(CHILE_TZ, getModuleStartDate(m, cfgGeneral));
  const con = ymdIn(CHILE_TZ, getModuleStartDate(m, cfgRecesos));
  assert.equal(sin, con, `módulo ${m} no debe moverse (antes del receso): ${sin} === ${con}`);
}

console.log("✓ Caso 5: corrimiento por receso correcto (módulos antes no se mueven, los después sí)");

// ============================================================================
// 6. Fechas en cambio de horario (septiembre/octubre en Chile)
// ============================================================================

// En Chile, el cambio de horario de verano ocurre en septiembre (último domingo)
// y el de invierno en abril (último domingo). Las fechas deben ser medianoche en Chile.
for (let m = 1; m <= 15; m++) {
  const d = getModuleStartDate(m, cfgGeneral);
  const hora = new Intl.DateTimeFormat("en-GB", {
    timeZone: CHILE_TZ,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(d);
  assert.equal(hora, "00", `módulo ${m} debe ser medianoche en Chile, no ${hora}`);
}

// Módulo que cae en octubre (después del cambio de horario de invierno)
const m15 = getModuleStartDate(15, cfgGeneral);
const horaM15 = new Intl.DateTimeFormat("en-GB", {
  timeZone: CHILE_TZ,
  hour: "2-digit",
  hourCycle: "h23",
}).format(m15);
assert.equal(horaM15, "00", "módulo 15 en octubre debe ser medianoche en Chile");

console.log("✓ Caso 6: fechas correctas en cambio de horario (todas medianoche en Chile)");

// ============================================================================
// 7. opcionesDeAjuste devuelve alternativas sin elegir ninguna
// ============================================================================

const opcionesGeneral = opcionesDeAjuste(perfilGeneral, false);
assert.ok(opcionesGeneral.length >= 2, "debe haber al menos 2 opciones de ajuste");

// La primera opción es el plan actual
assert.ok(
  opcionesGeneral[0].descripcion.includes("15 módulos"),
  "primera opción debe ser el plan actual"
);

// Con recesos, debe haber opciones adicionales (reducir módulos, etc.)
const opcionesConRecesos = opcionesDeAjuste(perfilGeneral, true);
assert.ok(
  opcionesConRecesos.length > opcionesGeneral.length,
  "con recesos debe haber más opciones de ajuste"
);

console.log("✓ Caso 7: opcionesDeAjuste devuelve alternativas correctas");

// ============================================================================
// 8. formatearFecha e imprimirTablaOpciones no fallan
// ============================================================================

const fechaFormateada = formatearFecha("2027-10-15");
assert.ok(fechaFormateada.includes("octubre"), `fecha formateada debe contener 'octubre': ${fechaFormateada}`);
assert.ok(fechaFormateada.includes("viernes"), `fecha formateada debe contener 'viernes': ${fechaFormateada}`);

const tabla = imprimirTablaOpciones(perfilGeneral, false);
assert.ok(tabla.includes("1.º básico"), "tabla debe incluir el nombre del perfil");
assert.ok(tabla.includes("15 módulos"), "tabla debe mencionar los módulos");

console.log("✓ Caso 8: formatearFecha e imprimirTablaOpciones funcionan");

// ============================================================================
// 9. SUPUESTOS_2027 está correctamente marcado
// ============================================================================

assert.ok(SUPUESTOS_2027.breaks.length >= 2, "deben haber al menos 2 recesos supuestos");
assert.equal(SUPUESTOS_2027.holidays.length, 0, "feriados deben estar vacíos (PENDIENTE)");
assert.ok(
  SUPUESTOS_2027.nota.toLowerCase().includes("supuesto") ||
  SUPUESTOS_2027.nota.toLowerCase().includes("pendiente"),
  "la nota debe indicar que son supuestos"
);

console.log("✓ Caso 9: SUPUESTOS_2027 correctamente marcado como supuestos");

// ============================================================================
// 10. Ninguna prueba depende de la fecha de hoy
// ============================================================================

// Todas las pruebas usan fechas fijas en 2027. No se usa new Date() sin argumento.
// Esto se verifica por inspección del código, pero aquí confirmamos que los resultados
// son deterministas ejecutando dos veces:
const calc1a = calcularCalendario(cfgGeneral, "2027-10-15");
const calc1b = calcularCalendario(cfgGeneral, "2027-10-15");
assert.deepStrictEqual(
  { fechaFinEvaluaciones: calc1a.fechaFinEvaluaciones, cabe: calc1a.cabe },
  { fechaFinEvaluaciones: calc1b.fechaFinEvaluaciones, cabe: calc1b.cabe },
  "resultados deben ser deterministas"
);

console.log("✓ Caso 10: resultados deterministas, no dependen de la fecha de hoy");


// Caso 11 (verificación del arquitecto): al reducir módulos se conservan las 2 semanas de evaluación y el fin es real.
{
  const perfil = PERFILES_2027.find((p) => p.id !== "general") ?? PERFILES_2027[1];
  const ops = opcionesDeAjuste(perfil, false);
  const red = ops.find((o) => o.descripcion.startsWith("Reducir"))!;
  assert.ok(red, "falta la opción de reducir módulos");
  assert.equal(red.semanasEvaluacion, 2, "mantiene las 2 semanas de evaluación");
  assert.ok(red.fechaFin > "2027-08-31", `el fin no puede ser antes de septiembre (fue ${red.fechaFin})`);
  assert.ok(red.fechaFin <= perfil.cierre, "la opción propuesta debe caber");
  assert.equal(red.totalModulos, 12, "4.º medio sin recesos: caben 12 módulos con 2 semanas de evaluación");
  console.log("✓ Caso 11: reducir módulos conserva evaluaciones y da un fin real");
}
// Caso 12: conteo de semanas del plan completo = 32 (8-mar a viernes 15-oct).
{
  const general = PERFILES_2027[0];
  const calc = calcularCalendario(buildConfig2027(general, { breaks: [], holidays: [] }), general.cierre);
  assert.equal(calc.semanasTotales, 32);
  assert.equal(calc.fechaFinEvaluaciones, "2027-10-15");
  console.log("✓ Caso 12: el plan completo ocupa 32 semanas");
}
// Caso 13: la semana de evaluación cercana al 5-sep-2027 (cambio de horario) termina el viernes 3, no el jueves 2.
{
  const cuarto = PERFILES_2027.find((p) => p.id === "cuarto_medio")!;
  const red = opcionesDeAjuste(cuarto, false).find((o) => o.descripcion.startsWith("Reducir"))!;
  assert.equal(red.fechaFin, "2027-09-03");
  assert.equal(new Date(red.fechaFin + "T12:00:00Z").getUTCDay(), 5, "debe ser viernes");
  console.log("✓ Caso 13: el viernes de evaluación no se corre por el cambio de horario");
}
console.log("\n✅ calendario2027.check.ts: todas las pruebas pasaron");
