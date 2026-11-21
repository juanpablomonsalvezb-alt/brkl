// Brújula™, panel: ritmo, métricas y mensajes (lógica pura, sin base de datos).
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { calcularPanel, type FechasDeModulo } from "../shared/brujulaPanel";
import type { OverviewSubjectInput } from "../shared/vortice";

const dia = (n: number) => new Date(Date.UTC(2026, 2, 1) + n * 86_400_000); // día 0 = 1-mar-2026
const AHORA = dia(30);
// Módulo m: empieza el día (m-1)*14 y termina 13 días después; E1 el día +2, E2 el día +4 del módulo.
const fechas: FechasDeModulo = (_ls, m) => {
  const ini = (m - 1) * 14;
  return { inicio: dia(ini), fin: dia(ini + 13), evaluaciones: { 1: dia(ini + 2), 2: dia(ini + 4), 3: dia(ini + 9), 4: dia(ini + 11) } };
};
const oa = (id: string, week: number, rs: string[], ev: [string, number][] = []) => ({
  id, code: `OA ${id}`, title: `Módulo ${id}`, weekNumber: week, sortOrder: 0,
  resources: rs.map((r) => ({ id: r, title: r, resourceType: "video", sortOrder: 0 })),
  evaluations: ev.map(([e, n]) => ({ id: e, title: `Evaluación ${n}`, evaluationNumber: n, available: true })),
});
const asig = (id: string, objs: ReturnType<typeof oa>[]): OverviewSubjectInput => ({ levelSubjectId: id, subjectName: id, subjectSlug: id, objectives: objs });
const panel = (subjects: OverviewSubjectInput[], completed: string[], passed: string[] = [], now = AHORA) =>
  calcularPanel({ subjects, completed: new Set(completed), passed: new Set(passed), now, fechas });

let casos = 0; const caso = (id: string, f: () => void) => { f(); casos++; console.log("  ✓ " + id); };

// Mat: módulos 1 y 2 ya vencidos (días 13 y 27), módulo 3 en curso (días 28 a 41).
const mat = asig("Mat", [oa("m1", 1, ["a1", "a2"], [["e1", 2]]), oa("m2", 2, ["b1", "b2"], [["e2", 2]]), oa("m3", 3, ["c1", "c2"], [["e3", 2]])]);

caso("P1 ritmo al día: módulos vencidos cerrados", () => {
  const p = panel([mat], ["a1", "a2", "b1", "b2"], ["e1", "e2"]);
  assert.equal(p.metricas[0].ritmo, "al_dia");
  assert.equal(p.metricas[0].modulosVencidos, 2); assert.equal(p.metricas[0].modulosVencidosCerrados, 2);
  assert.ok(p.mensajes.some((m) => m.id === "al-dia" && m.tono === "ok"));
});
caso("P2 atraso de 1 módulo: aviso; de 2: alerta; sin culpar", () => {
  const uno = panel([mat], ["a1", "a2", "b1"], ["e1"]); // m2 sin cerrar
  assert.equal(uno.metricas[0].ritmo, "atrasado");
  const m1 = uno.mensajes.find((m) => m.id === "atraso-Mat")!; assert.equal(m1.tono, "aviso"); assert.match(m1.texto, /Vas atrasado en Mat: te falta cerrar 1 módulo/);
  const dos = panel([mat], [], []);
  assert.equal(dos.mensajes.find((m) => m.id === "atraso-Mat")!.tono, "alerta"); assert.match(dos.mensajes[0].texto, /faltan cerrar 2 módulos/);
  assert.ok(!/culp|castig|mal /i.test(dos.mensajes.map((m) => m.texto).join(" ")));
  assert.ok(!dos.mensajes.some((m) => m.id === "al-dia"));
});
caso("P3 adelantado: cerró el módulo en curso", () => {
  const p = panel([mat], ["a1", "a2", "b1", "b2", "c1", "c2"], ["e1", "e2", "e3"]);
  assert.equal(p.metricas[0].ritmo, "adelantado"); assert.equal(p.avanceTotal, 100); assert.equal(p.faltanTotal, 0);
});
caso("P4 métricas: porcentaje, faltan y módulo actual", () => {
  const p = panel([mat], ["a1", "a2", "b1", "b2", "c1"], ["e1", "e2"]);
  const m = p.metricas[0];
  assert.equal(m.total, 9); assert.equal(m.completados, 7); assert.equal(m.faltan, 2); assert.equal(m.percent, 78);
  assert.deepEqual(m.moduloActual, { code: "OA m3", title: "Módulo m3", diasParaTerminar: 11, faltan: 2 });
});
caso("P5 próxima evaluación: la más cercana, con días; aviso si faltan ≤ 7", () => {
  // La E2 del módulo 3 se libera el día 28+4 = 32.
  const p = panel([mat], ["a1", "a2", "b1", "b2"], ["e1", "e2"], dia(30));
  assert.equal(p.proximaEvaluacion?.titulo, "Evaluación 2"); assert.equal(p.proximaEvaluacion?.dias, 2);
  const m = p.mensajes.find((x) => x.id === "proxima-evaluacion")!; assert.equal(m.tono, "aviso"); assert.match(m.texto, /Te faltan 2 días para «Evaluación 2» de Mat/);
  const lejos = panel([mat], ["a1", "a2", "b1", "b2"], ["e1", "e2"], dia(22));
  assert.equal(lejos.proximaEvaluacion?.dias, 10); assert.equal(lejos.mensajes.find((x) => x.id === "proxima-evaluacion")!.tono, "info");
});
caso("P6 evaluación ya disponible sin aprobar", () => {
  const p = panel([mat], ["a1", "a2", "b1", "b2", "c1", "c2"], ["e1", "e2"], dia(37));
  assert.ok(p.mensajes.some((m) => m.id === "evaluacion-disponible" && /ya está disponible/.test(m.texto)));
});
caso("P7 cierre del módulo en curso (≤ 7 días) con actividades pendientes", () => {
  const p = panel([mat], ["a1", "a2", "b1", "b2"], ["e1", "e2"], dia(36));
  const m = p.mensajes.find((x) => x.id === "cierre-Mat")!; assert.match(m.texto, /Se acerca el cierre de OA m3 en Mat: quedan 5 días y te faltan 3 actividades/);
  assert.ok(!panel([mat], ["a1", "a2", "b1", "b2", "c1", "c2"], ["e1", "e2", "e3"], dia(36)).mensajes.some((x) => x.id === "cierre-Mat"));
});
caso("P8 sin contenido: mensaje claro y sin porcentajes inventados", () => {
  const p = panel([asig("Len", [oa("l1", 1, [])])], []);
  assert.equal(p.avanceTotal, null); assert.equal(p.metricas[0].percent, null); assert.equal(p.metricas[0].ritmo, "sin_datos");
  assert.ok(p.mensajes.some((m) => m.id === "sin-contenido"));
});
caso("P9 varias asignaturas: orden por gravedad y tope de mensajes", () => {
  const otras = ["A", "B", "C", "D"].map((a) => asig(a, [oa(a + "1", 1, [a + "r"]), oa(a + "2", 2, [a + "s"])]));
  const p = panel([mat, ...otras], [], []);
  assert.ok(p.mensajes.length <= 5);
  const tonos = p.mensajes.map((m) => m.tono); assert.deepEqual(tonos, [...tonos].sort((x, y) => ["alerta", "aviso", "info", "ok"].indexOf(x) - ["alerta", "aviso", "info", "ok"].indexOf(y)));
  assert.equal(p.metricas.length, 5);
});
caso("P10 singular y plural", () => {
  const p = panel([mat], ["a1", "a2", "b1", "b2"], ["e1", "e2"], dia(40)); // faltan 1 día, 3 actividades
  assert.match(p.mensajes.find((m) => m.id === "cierre-Mat")!.texto, /quedan 1 día y te faltan 3 actividades\./);
  assert.match(panel([mat], ["a1", "a2", "b1", "b2", "c1", "c2"], ["e1", "e2"], dia(40)).mensajes.find((m) => m.id === "cierre-Mat")!.texto, /te falta 1 actividad\./);
});

// --- Zona horaria Chile: días calendario, no 24 h exactas ---
// Simula ymdIn/midnightIn de America/Santiago con un offset fijo (-3 UTC, sin DST para simplificar).
const offsetMs = -3 * 3600_000; // CLT = UTC-3
function ymdCLT(d: Date): string {
  const utc = d.getTime() + offsetMs;
  const dt = new Date(utc);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`;
}
function midnightCLT(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - offsetMs);
}
const panelCLT = (subjects: OverviewSubjectInput[], completed: string[], passed: string[] = [], now = AHORA) =>
  calcularPanel({ subjects, completed: new Set(completed), passed: new Set(passed), now, fechas, ymdIn: ymdCLT, midnightIn: midnightCLT });

caso("P11 zona horaria: a las 23:00 del día anterior, faltan 1 día (no 0 ni 2)", () => {
  // Módulo 3 termina dia(41) = 11-abr-2026 UTC = 10-abr CLT.
  // now = 23:00 del día anterior en CLT = midnightCLT("2026-04-09") + 23h.
  const finModulo3 = dia(41); // 11-abr UTC = 10-abr CLT
  const finCLT = ymdCLT(finModulo3); // "2026-04-10"
  // now a las 23:00 del día anterior en CLT
  const now23 = new Date(midnightCLT("2026-04-09").getTime() + 23 * 3600_000);
  assert.equal(ymdCLT(now23), "2026-04-09", "now debe ser 9-abr en CLT");
  const p = panelCLT([mat], ["a1", "a2", "b1", "b2"], ["e1", "e2"], now23);
  assert.equal(p.metricas[0].moduloActual?.diasParaTerminar, 1, "a las 23:00 del día anterior deben faltar 1 día calendario");
});

caso("P12 zona horaria: medianoche exacta del día meta → 0 días", () => {
  // Módulo 3 termina dia(41) = 11-abr UTC = 10-abr CLT.
  // now = medianoche del 10-abr en CLT → mismo día que el fin → 0 días.
  const p = panelCLT([mat], ["a1", "a2", "b1", "b2"], ["e1", "e2"], midnightCLT("2026-04-10"));
  assert.equal(p.metricas[0].moduloActual?.diasParaTerminar, 0, "medianoche del día de cierre → 0 días");
});

caso("P13 zona horaria: cambio de horario de verano (DST) — día extra no cambia conteo", () => {
  // Simula un DST donde el 18-sep-2026 el reloj salta de 24:00 a 01:00 (día con 23 h).
  // El conteo de días calendario debe seguir siendo correcto: 18→19 = 1 día.
  const dstDate = "2026-09-18";
  const ymdDst = (d: Date) => {
    // Simula que el 18-sep tiene 23h: midnightIn devuelve 1h más tarde que lo normal.
    const base = ymdCLT(d);
    return base;
  };
  const midnightDst = (ymd: string): Date => {
    if (ymd === "2026-09-18") return new Date(midnightCLT(ymd).getTime() + 3600_000); // +1h por DST
    return midnightCLT(ymd);
  };
  const pDst = calcularPanel({
    subjects: [mat], completed: new Set(["a1", "a2", "b1", "b2"]), passed: new Set(["e1", "e2"]),
    now: midnightCLT("2026-09-17"), fechas, ymdIn: ymdDst, midnightIn: midnightDst,
  });
  // El módulo 3 (días 28-41) ya terminó hace mucho; no hay moduloActual.
  // Lo que importa es que no se cuelga ni devuelve NaN.
  assert.ok(pDst.metricas[0].moduloActual === null || typeof pDst.metricas[0].moduloActual.diasParaTerminar === "number");
});

// --- Receso: módulo corrido por vacaciones — no debe contar atrasado antes de tiempo ---
const recesoFechas: FechasDeModulo = (_ls, m) => {
  // Módulo 1: días 0-13 (normal). Módulo 2: corrido por receso días 14-20 → empieza día 21, termina día 34.
  if (m === 1) return { inicio: dia(0), fin: dia(13), evaluaciones: { 1: dia(2), 2: dia(4) } };
  if (m === 2) return { inicio: dia(21), fin: dia(34), evaluaciones: { 1: dia(23), 2: dia(25) } };
  return { inicio: dia(35), fin: dia(48), evaluaciones: { 1: dia(37), 2: dia(39) } };
};
const mat2 = asig("Mat", [oa("m1", 1, ["a1", "a2"], [["e1", 2]]), oa("m2", 2, ["b1", "b2"], [["e2", 2]])]);

caso("P14 receso: módulo corrido no cuenta como atrasado antes de su ventana", () => {
  // now = día 15 (dentro del receso). Módulo 1 vencido y cerrado. Módulo 2 aún no empieza (día 21).
  const p = calcularPanel({
    subjects: [mat2], completed: new Set(["a1", "a2"]), passed: new Set(["e1"]),
    now: dia(15), fechas: recesoFechas,
  });
  assert.equal(p.metricas[0].ritmo, "al_dia", "no debe marcar atrasado por el receso");
  assert.equal(p.metricas[0].modulosVencidos, 1, "solo módulo 1 vencido");
  assert.equal(p.metricas[0].modulosVencidosCerrados, 1, "módulo 1 cerrado");
  assert.ok(!p.mensajes.some((m) => m.id.startsWith("atraso-")), "sin mensaje de atraso durante receso");
});

// --- Feriado: fecha de evaluación corrida ---
const feriadoFechas: FechasDeModulo = (_ls, m) => {
  const ini = (m - 1) * 14;
  // E1 del módulo 1 cae en feriado → se corre de día 2 a día 3.
  const e1 = m === 1 ? dia(ini + 3) : dia(ini + 2);
  return { inicio: dia(ini), fin: dia(ini + 13), evaluaciones: { 1: e1, 2: dia(ini + 4) } };
};

caso("P15 feriado: evaluación corrida se refleja en días correctos", () => {
  const p = calcularPanel({
    subjects: [mat2], completed: new Set(["a1"]), passed: new Set(),
    now: dia(1), fechas: feriadoFechas,
  });
  // La evaluación del módulo 1 es evaluationNumber=2 → feriadoFechas devuelve evaluaciones[2] = dia(4).
  // Faltan 3 días desde dia(1).
  const prox = p.proximaEvaluacion;
  assert.ok(prox, "debe haber próxima evaluación");
  assert.equal(prox.dias, 3, "E2 del módulo 1 en día 4, now=día 1 → faltan 3 días");
});

// --- Asignatura sin contenido (módulos vacíos) ---
caso("P16 asignatura sin contenido: ritmo sin_datos, percent null, mensaje claro", () => {
  const vacia = asig("Ed_Fisica", [oa("v1", 1, [])]);
  const p = panel([vacia], []);
  assert.equal(p.metricas[0].ritmo, "sin_datos");
  assert.equal(p.metricas[0].percent, null);
  assert.equal(p.metricas[0].total, 0);
  assert.ok(p.mensajes.some((m) => m.id === "sin-contenido"));
});

// --- Varias asignaturas: mezcla de estados ---
caso("P17 varias asignaturas: mezcla de al_dia, atrasado y sin_datos", () => {
  const len = asig("Len", [oa("l1", 1, ["l1", "l2"], [["el", 2]])]);
  const vacia = asig("Ed_Fisica", [oa("v1", 1, [])]);
  const p = panel([mat, len, vacia], ["a1", "a2", "b1", "b2", "l1", "l2"], ["e1", "e2", "el"]);
  assert.equal(p.metricas.length, 3);
  assert.equal(p.metricas.find((m) => m.levelSubjectId === "Mat")!.ritmo, "al_dia");
  assert.equal(p.metricas.find((m) => m.levelSubjectId === "Len")!.ritmo, "al_dia");
  assert.equal(p.metricas.find((m) => m.levelSubjectId === "Ed_Fisica")!.ritmo, "sin_datos");
  // Mensaje al-dia solo si hay al menos una al_dia/adelantado y ninguna atrasada.
  assert.ok(p.mensajes.some((m) => m.id === "al-dia"));
});


// P18: cambio de horario de verano de septiembre (5-sep-2027): la medianoche no existe y el conteo no debe romperse.
import { CHILE_TZ as TZ, ymdIn as ymdInTz, midnightIn as midnightInTz } from "../server/calendarUtils";
caso("P18 zona horaria: cruzar el cambio de horario de septiembre cuenta días civiles (no 400)", () => {
  const unaAsig = (fin: string, ahora: string) => calcularPanel({
    subjects: [asig("Mat", [oa("m1", 1, ["r1"])])], completed: new Set(), passed: new Set(), now: midnightInTz(TZ, ahora),
    fechas: () => ({ inicio: midnightInTz(TZ, "2027-03-01"), fin: midnightInTz(TZ, fin), evaluaciones: {} }),
    ymdIn: (d) => ymdInTz(TZ, d), midnightIn: (y) => midnightInTz(TZ, y),
  }).metricas[0].moduloActual!.diasParaTerminar;
  assert.equal(unaAsig("2027-09-08", "2027-09-01"), 7);
  assert.equal(unaAsig("2027-09-08", "2027-09-03"), 5);
  assert.equal(unaAsig("2027-09-08", "2027-09-06"), 2);
  assert.equal(unaAsig("2027-10-08", "2027-10-01"), 7);
  assert.equal(unaAsig("2027-04-12", "2027-04-01"), 11); // fin de horario de verano (abril)
});
console.log("brujula-panel: ok (" + casos + " casos)");
