// Check del contrato "Próxima evaluación" en la orientación del apoderado.
// Verifica la función pura resumenBrujulaParaApoderado(shared/brujulaPanel.ts).
// Sin base de datos. Ejecutar: npx tsx script/brujula-orientacion-apoderado.check.ts
import { calcularPanel, resumenBrujulaParaApoderado } from "../shared/brujulaPanel";
import type { OverviewSubjectInput } from "../shared/vortice";

let fallas = 0;
const ok = (msg: string) => console.log(`  ✓ ${msg}`);
const fail = (msg: string) => { console.log(`  ✗ ${msg}`); fallas++; };

// Helper para armar una asignatura mínima (mismo patrón que brujula-parte2.check.ts).
const mkSubj = (id: string): OverviewSubjectInput => ({
  levelSubjectId: id,
  subjectName: `Asig ${id}`,
  subjectSlug: id,
  objectives: [
    {
      id: `oa-${id}`,
      code: `OA 1`,
      title: id,
      weekNumber: 1,
      sortOrder: 0,
      resources: [{ id: `r-${id}`, title: "R", resourceType: "video" }],
      evaluations: [{ id: `e-${id}`, title: `Evaluación ${id}`, evaluationNumber: 1, releaseWeek: 1 }],
    },
  ],
});

const agenda = { intensidad: "normal" as const, bloquesPlanificados: 5, bloquesCompletados: 3 };
const now = new Date(Date.UTC(2026, 5, 10)); // junio 2026

// --- Caso 1: dias: 3 → "en 3 días" (plural) ---
{
  const panel = calcularPanel({
    subjects: [mkSubj("Mat")],
    completed: new Set(),
    passed: new Set(),
    now,
    fechas: () => ({
      inicio: new Date(Date.UTC(2026, 5, 1)),
      fin: new Date(Date.UTC(2026, 5, 28)),
      evaluaciones: { 1: new Date(Date.UTC(2026, 5, 13)) }, // 3 días después de now
    }),
  });
  const res = resumenBrujulaParaApoderado(panel, agenda);
  const frases = res.orientacion.filter((f) => f.startsWith("Próxima evaluación:"));
  if (frases.length === 1) ok("Caso 1: exactamente una frase 'Próxima evaluación:'");
  else fail(`Caso 1: se esperaba 1 frase, se obtuvieron ${frases.length}`);
  const frase = frases[0] ?? "";
  if (frase.includes("Asig Mat")) ok("Caso 1: contiene el nombre de la asignatura");
  else fail(`Caso 1: no contiene 'Asig Mat' → "${frase}"`);
  if (frase.includes("Evaluación Mat")) ok("Caso 1: contiene el título de la evaluación");
  else fail(`Caso 1: no contiene 'Evaluación Mat' → "${frase}"`);
  if (frase.includes("en 3 días")) ok("Caso 1: contiene 'en 3 días'");
  else fail(`Caso 1: no contiene 'en 3 días' → "${frase}"`);
  // proximaEvaluacion estructurado
  if (res.proximaEvaluacion && res.proximaEvaluacion.titulo && res.proximaEvaluacion.subjectName && res.proximaEvaluacion.dias === 3) {
    ok("Caso 1: proximaEvaluacion estructurado con titulo, subjectName y dias=3");
  } else fail(`Caso 1: proximaEvaluacion no estructurado → ${JSON.stringify(res.proximaEvaluacion)}`);
}

// --- Caso 2: dias: 1 → "en 1 día" (singular) ---
{
  const panel = calcularPanel({
    subjects: [mkSubj("Len")],
    completed: new Set(),
    passed: new Set(),
    now,
    fechas: () => ({
      inicio: new Date(Date.UTC(2026, 5, 1)),
      fin: new Date(Date.UTC(2026, 5, 28)),
      evaluaciones: { 1: new Date(Date.UTC(2026, 5, 11)) }, // 1 día después de now
    }),
  });
  const res = resumenBrujulaParaApoderado(panel, agenda);
  const frases = res.orientacion.filter((f) => f.startsWith("Próxima evaluación:"));
  if (frases.length === 1) ok("Caso 2: exactamente una frase 'Próxima evaluación:'");
  else fail(`Caso 2: se esperaba 1 frase, se obtuvieron ${frases.length}`);
  const frase = frases[0] ?? "";
  if (/en 1 día\b(?!s)/.test(frase) && !frase.includes("1 días")) ok("Caso 2: contiene 'en 1 día' (singular exacto, no '1 días')");
  else fail(`Caso 2: no contiene 'en 1 día' → "${frase}"`);
  if (res.proximaEvaluacion && res.proximaEvaluacion.dias === 1) {
    ok("Caso 2: proximaEvaluacion.dias = 1");
  } else fail(`Caso 2: proximaEvaluacion.dias !== 1 → ${JSON.stringify(res.proximaEvaluacion)}`);
}

// --- Caso 3: dias: 0 → "disponible hoy" ---
// Se arma el panel a mano porque calcularPanel clasifica dias=0 como "abierta" (no futura)
// y proximaEvaluacion queda null. El contrato de resumenBrujulaParaApoderado debe manejarlo.
{
  const panel = {
    avanceTotal: null,
    faltanTotal: 1,
    metricas: [{
      levelSubjectId: "His",
      subjectName: "Asig His",
      percent: null,
      completados: 0,
      total: 1,
      faltan: 1,
      modulosVencidos: 0,
      modulosVencidosCerrados: 0,
      ritmo: "al_dia" as const,
      moduloActual: null,
    }],
    proximaEvaluacion: { titulo: "Evaluación His", subjectName: "Asig His", levelSubjectId: "His", fecha: "", dias: 0 },
    mensajes: [],
  };
  const res = resumenBrujulaParaApoderado(panel, agenda);
  const frases = res.orientacion.filter((f) => f.startsWith("Próxima evaluación:"));
  if (frases.length === 1) ok("Caso 3: exactamente una frase 'Próxima evaluación:'");
  else fail(`Caso 3: se esperaba 1 frase, se obtuvieron ${frases.length}`);
  const frase = frases[0] ?? "";
  if (frase.includes("disponible hoy")) ok("Caso 3: contiene 'disponible hoy'");
  else fail(`Caso 3: no contiene 'disponible hoy' → "${frase}"`);
  if (res.proximaEvaluacion && res.proximaEvaluacion.dias === 0) {
    ok("Caso 3: proximaEvaluacion.dias = 0");
  } else fail(`Caso 3: proximaEvaluacion.dias !== 0 → ${JSON.stringify(res.proximaEvaluacion)}`);
}

// --- Caso 4: proximaEvaluacion = null → ninguna frase con "Próxima evaluación:" ---
{
  const panel = calcularPanel({
    subjects: [mkSubj("Cie")],
    completed: new Set(),
    passed: new Set(),
    now,
    fechas: () => ({
      inicio: new Date(Date.UTC(2026, 5, 1)),
      fin: new Date(Date.UTC(2026, 5, 28)),
      evaluaciones: {}, // sin evaluaciones → proximaEvaluacion = null
    }),
  });
  const res = resumenBrujulaParaApoderado(panel, agenda);
  const frases = res.orientacion.filter((f) => f.startsWith("Próxima evaluación:"));
  if (frases.length === 0) ok("Caso 4: ninguna frase 'Próxima evaluación:' cuando proximaEvaluacion = null");
  else fail(`Caso 4: se esperaba 0 frases, se obtuvieron ${frases.length}`);
  if (res.proximaEvaluacion === null) ok("Caso 4: proximaEvaluacion es null");
  else fail(`Caso 4: proximaEvaluacion no es null → ${JSON.stringify(res.proximaEvaluacion)}`);
}

// --- Caso 5: proximaEvaluacion conserva estructura (titulo, subjectName, dias) ---
{
  const panel = calcularPanel({
    subjects: [mkSubj("Ed")],
    completed: new Set(),
    passed: new Set(),
    now,
    fechas: () => ({
      inicio: new Date(Date.UTC(2026, 5, 1)),
      fin: new Date(Date.UTC(2026, 5, 28)),
      evaluaciones: { 1: new Date(Date.UTC(2026, 5, 15)) },
    }),
  });
  const res = resumenBrujulaParaApoderado(panel, agenda);
  const pe = res.proximaEvaluacion;
  if (pe && typeof pe.titulo === "string" && typeof pe.subjectName === "string" && typeof pe.dias === "number") {
    ok("Caso 5: proximaEvaluacion conserva estructura (titulo, subjectName, dias)");
  } else fail(`Caso 5: proximaEvaluacion sin estructura esperada → ${JSON.stringify(pe)}`);
}

// --- Salida final ---
console.log(`\nResultados: ${fallas === 0 ? "TODOS OK" : `${fallas} FALLA(s)`}`);
process.exitCode = fallas === 0 ? 0 : 1;
