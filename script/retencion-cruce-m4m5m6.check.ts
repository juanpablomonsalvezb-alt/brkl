// Pruebas de Paso 3 (Retención M4 + Cruce Evaluación `4` M5/M6 + Progresión P21 v2):
// - Agenda de retención espaciada [3, 7, 14, 30] días sin castigo por ausencia.
// - No interferencia NI1-NI5 de E2 antes y después de `review_at` (P19-E1) + bloqueo P18.
// - Dos canales independientes: aprobar E2 no enciende estrellas; reprobar E2 tras concluir
//   el proceso abre el módulo siguiente manteniendo E2 en Reprobado y registrando pendientes.
// - Rutas HTTP con Cache-Control: no-store.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Client, InArgs } from "@libsql/client";
import {
  calcularAgendaRetencion,
  diaChileDesdeSegundos,
  seleccionarPreguntaRetencion,
} from "../shared/retencionMapa";
import {
  calcularRefuerzoDesdeEvaluacionPublicada,
  mapearProcesoAEstadoE2,
  moduloSiguienteAbierto,
} from "../shared/cruceEvaluacionMapa";
import { calcularFronteras, recomendarSiguienteContenido, type NodoEntradaMapa } from "../shared/mapaConocimiento";
import { addDays } from "../shared/repaso";

if (process.env.NODE_ENV === "production") {
  throw new Error("retencion-cruce-m4m5m6.check no debe correr en producción");
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-m4m5m6-"));
process.env.TEST_DATABASE_URL = `file:${path.join(dir, "m4m5m6.db")}`;

const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const schema = await import("../shared/schema");
const { users } = await import("../shared/models/auth");
const { db, client } = await import("../server/db");
const { migrar } = await import("../server/migrar");
const { relojMotor } = await import("../server/reloj");
const { sembrarPilotoPractica } = await import("../server/sembrarPilotoPractica");
const { cargarMapaConocimiento, registrarPracticaEnMotor } = await import("../server/mapaConocimiento");
const { cargarAgendaRetencion, registrarComprobacionRetencion } = await import("../server/retencionMapa");
const { abrirProceso, iniciarIntento, responder, enviarIntento, cerrarProceso, ErrorEvaluacion } = await import(
  "../server/evaluacion"
);
const { checkModuleAccess } = await import("../server/vortice");
const { sembrarEvaluacionPiloto } = await import("./lib/sembrarEvaluacionPiloto");
const { sembrarFicticios } = await import("./lib/esquemaHeredado");

const DIA_SEG = 86400;

/** Envuelve el cliente de pruebas para simular un reloj determinista en `relojMotor` sin depender del reloj real del sistema. */
const RELOJ_BASE_SIM_SEG = 2_000_023_200; // 2033-05-18T10:00:00Z (06:00 America/Santiago)
function clienteConOffset(base: Client, getOffsetSeg: () => number): Client {
  return new Proxy(base, {
    get(target, prop) {
      if (prop === "execute") {
        return async (...args: Parameters<typeof target.execute>) => {
          const res = await target.execute(...args);
          const sqlTxt = typeof args[0] === "string" ? args[0] : (args[0] as any)?.sql;
          if (typeof sqlTxt === "string" && /SELECT\s+unixepoch\s*\(\s*'subsec'\s*\)/i.test(sqlTxt) && res.rows?.[0]) {
            const val = RELOJ_BASE_SIM_SEG + getOffsetSeg();
            const fila = Object.assign([val], { "unixepoch('subsec')": val });
            return { ...res, rows: [fila] };
          }
          return res;
        };
      }
      const v = Reflect.get(target, prop, target);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}

let simOffsetSeg = 0;
const cSim = clienteConOffset(client as unknown as Client, () => simOffsetSeg);

let server: ReturnType<typeof createServer> | null = null;
try {
  // ── 1. Pruebas puras M4 y M5/M6 ──
  const tBase = 1_800_000_000;
  const dia0 = diaChileDesdeSegundos(tBase);

  const agInicial = calcularAgendaRetencion({
    dominados: [{ itemId: "i7", code: "MAT5U3-OA07", oaId: "oa7", nombre: "Fracciones", dominadoDesdeAt: tBase }],
    historialRetencion: [],
    ahora: tBase + 2 * DIA_SEG,
  });
  assert.equal(agInicial.pendientes.length, 0);
  assert.equal(agInicial.proximas[0]?.intervaloDias, 3);
  assert.equal(agInicial.proximas[0]?.proximoDia, addDays(dia0, 3));

  // Ausencia prolongada (+25 días): vence sin degradar paso (se mantiene en paso 0) ni castigar.
  const agAusente = calcularAgendaRetencion({
    dominados: [{ itemId: "i7", code: "MAT5U3-OA07", oaId: "oa7", nombre: "Fracciones", dominadoDesdeAt: tBase }],
    historialRetencion: [],
    ahora: tBase + 25 * DIA_SEG,
  });
  assert.equal(agAusente.pendientes.length, 1);
  assert.equal(agAusente.pendientes[0].paso, 0);
  assert.equal(agAusente.pendientes[0].diasEsperando, 22);

  // Respuesta correcta tras ausencia: sube a paso 1 (+7 días desde día real de respuesta, no desde vencimiento).
  const diaResp = diaChileDesdeSegundos(tBase + 25 * DIA_SEG);
  const agPaso1 = calcularAgendaRetencion({
    dominados: [{ itemId: "i7", code: "MAT5U3-OA07", oaId: "oa7", nombre: "Fracciones", dominadoDesdeAt: tBase }],
    historialRetencion: [
      { itemId: "i7", correcta: true, sinAyuda: true, ocurridaAt: tBase + 25 * DIA_SEG, studyDay: diaResp },
    ],
    ahora: tBase + 26 * DIA_SEG,
  });
  assert.equal(agPaso1.pendientes.length, 0);
  assert.equal(agPaso1.proximas[0]?.paso, 1);
  assert.equal(agPaso1.proximas[0]?.intervaloDias, 7);
  assert.equal(agPaso1.proximas[0]?.proximoDia, addDays(diaResp, 7));

  // Tope de MAX_COMPROBACIONES_RETENCION = 3 y preferencia de familia no usada recientemente.
  const sel = seleccionarPreguntaRetencion(
    [
      { questionVersionId: "q1", familyId: "f1" },
      { questionVersionId: "q2", familyId: "f2" },
      { questionVersionId: "q3", familyId: "f3" },
    ],
    ["f2", "f1"],
  );
  assert.equal(sel?.familyId, "f3");

  assert.equal(moduloSiguienteAbierto(mapearProcesoAEstadoE2({ status: "abierto", closeCause: null, hayNormalFallado: true })), false);
  assert.equal(moduloSiguienteAbierto(mapearProcesoAEstadoE2({ status: "reprobado", closeCause: "agotamiento" })), true);
  assert.equal(moduloSiguienteAbierto(mapearProcesoAEstadoE2({ status: "reprobado", closeCause: "reprobada_continua" })), true);

  // Refuerzo C8 alimenta recomendación solo si proviene de resultados publicados.
  const fPura = calcularFronteras(
    [
      { itemId: "i7", code: "MAT5U3-OA07", oaId: "oa7", nombre: "Fracciones propias", definicion: "d", estado: "dominado", marca: null, motivo: null },
      { itemId: "i8", code: "MAT5U3-OA08", oaId: "oa8", nombre: "Impropias", definicion: "d", estado: "sin_evidencia", marca: null, motivo: null },
      { itemId: "i10", code: "MAT5U3-OA10", oaId: "oa10", nombre: "Decimales", definicion: "d", estado: "sin_evidencia", marca: null, motivo: null },
    ],
    [
      { itemId: "i8", prerequisiteItemId: "i7", relation: "necesaria" },
      { itemId: "i10", prerequisiteItemId: "i7", relation: "necesaria" },
    ],
  );
  const crucePuro = calcularRefuerzoDesdeEvaluacionPublicada({
    nodos: fPura.nodos,
    resultadosPublicadosPorOa: [
      { oaId: "oa7", correctas: 2, incorrectas: 1, total: 3 },
      { oaId: "oa10", correctas: 1, incorrectas: 2, total: 3 },
    ],
  });
  assert.deepEqual(crucePuro.dominadosPorComprobarOaIds, ["oa7"]);
  assert.equal(crucePuro.refuerzos.map((r) => r.oaId).join(","), "oa10");
  assert.equal(
    recomendarSiguienteContenido(fPura, { refuerzoEvaluacionOaIds: crucePuro.refuerzos.map((r) => r.oaId) })?.oaId,
    "oa10",
  );

  // ── 2. Integración completa en BD (M4 + NI1-NI5 + M6 P21 v2) ──
  const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
  for (const s of ddl) await db.run(sql.raw(s));
  await migrar(client as any, "migrations/vortice");
  await sembrarFicticios(client as any);

  await db.insert(users).values([
    { id: "est-a", email: "esta@ficticio.test", name: "Est A" },
    { id: "est-b", email: "est-b@ficticio.test", name: "Est B" },
    { id: "est-c", email: "est-c@ficticio.test", name: "Est C" },
    { id: "est-d", email: "est-d@ficticio.test", name: "Est D" },
    { id: "est-e", email: "est-e@ficticio.test", name: "Est E" },
    { id: "est-f", email: "est-f@ficticio.test", name: "Est F" },
  ]);

  await db.insert(schema.enrollments).values(
    ["est-a", "est-b", "est-c", "est-d", "est-f"].map((userId) => ({
      userId,
      levelSubjectId: "ls-mat-5b",
      isActive: true,
    })),
  );
  await db.insert(schema.learningObjectives).values({
    id: "lo-mat-m2",
    levelSubjectId: "ls-mat-5b",
    code: "M2",
    title: "Módulo 2 Operaciones",
    weekNumber: 2,
    sortOrder: 1,
  });
  // Clasificación real T39 en módulo 1: evaluación `4` de cierre + `2` de proceso.
  await db.insert(schema.moduleEvaluations).values([
    {
      id: "me-p2",
      learningObjectiveId: "lo-mat",
      evaluationNumber: 2,
      evaluationFunction: "proceso",
      title: "Proceso 2",
      releaseDay: 3,
      releaseWeek: 1,
      passingScore: 70,
    },
    {
      id: "me-e2",
      learningObjectiveId: "lo-mat",
      evaluationNumber: 4,
      evaluationFunction: "modulo",
      title: "Evaluación módulo 1",
      releaseDay: 5,
      releaseWeek: 2,
      passingScore: 70,
    },
  ]);

  const x = (q: string, a: InArgs = []) => client.execute({ sql: q, args: a });
  const claveEval = await sembrarEvaluacionPiloto(x as any, {
    levelSubjectId: "ls-mat-5b",
    evaluacionId: "me-e2",
    versionId: "ev-piloto",
    oaCurricularId: "oa1",
  });
  await sembrarPilotoPractica(cSim, { levelSubjectId: "ls-mat-5b" });

  // Est A, Est B y Est C dominan exactamente igual OA7 en práctica (D1: aciertos en 2 días calendario distintos: T-1 y T0).
  simOffsetSeg = -DIA_SEG;
  for (const est of ["est-a", "est-b", "est-c"]) {
    await registrarPracticaEnMotor(cSim, {
      estudianteId: est,
      oaId: "oa7",
      preguntaId: "oa7-c1",
      opcionId: "A",
      usoPista: false,
      clientSubmissionId: `init-${est}-c1`,
    });
  }
  simOffsetSeg = 0;
  for (const est of ["est-a", "est-b", "est-c"]) {
    await registrarPracticaEnMotor(cSim, {
      estudianteId: est,
      oaId: "oa7",
      preguntaId: "oa7-c2",
      opcionId: "C",
      usoPista: false,
      clientSubmissionId: `init-${est}-c2`,
    });
  }

  // ── 2a. M4 Retención sobre Est A con reloj simulado ──
  const agA0 = await cargarAgendaRetencion(cSim, { estudianteId: "est-a" });
  assert.equal(agA0.pendientesCount, 0);
  assert.equal(agA0.proximas.length, 1);
  assert.equal(agA0.proximas[0].oaId, "oa7");
  assert.equal(agA0.proximas[0].intervaloDias, 3);

  // +3 días: aparece vencida y el mapa pasa a por_comprobar + prioridad en recomendación.
  simOffsetSeg = 3 * DIA_SEG;
  const agA3 = await cargarAgendaRetencion(cSim, { estudianteId: "est-a" });
  assert.equal(agA3.pendientesCount, 1);
  assert.equal(agA3.pendientes[0].oaId, "oa7");
  assert.ok(agA3.pendientes[0].pregunta, "debe ofrecer pregunta de práctica");
  assert.equal("correcta" in (agA3.pendientes[0].pregunta as any), false);
  assert.equal("explicacion" in (agA3.pendientes[0].pregunta as any), false);
  // Verifica que proviene del banco independiente de práctica y evita oa7-c1 / oa7-c2 ya usados (M-R04).
  assert.ok(!["oa7-c1", "oa7-c2"].includes(agA3.pendientes[0].pregunta!.preguntaId));
  assert.ok(agA3.pendientes[0].pregunta!.preguntaId.includes("-ind-"), "Retención M4 debe priorizar variantes del banco independiente");

  const mapaRetVencida = await cargarMapaConocimiento(cSim, { estudianteId: "est-a" });
  assert.equal(mapaRetVencida.nodos.find((n) => n.oaId === "oa7")?.estadoVisual, "por_comprobar");
  assert.equal(mapaRetVencida.recomendacion?.oaId, "oa7");
  assert.equal(mapaRetVencida.recomendacion?.tipo, "comprobar");

  // Sin castigo por ausencia (+20 días más, total +23 días): paso sigue en 0.
  simOffsetSeg = 23 * DIA_SEG;
  const agA23 = await cargarAgendaRetencion(cSim, { estudianteId: "est-a" });
  assert.equal(agA23.pendientes[0].paso, 0);
  assert.equal(agA23.pendientes[0].diasEsperando, 20);

  // Responder bien en retención + probar idempotencia.
  const qRet1 = agA23.pendientes[0].pregunta!;
  const claveRet1 = String(
    (await client.execute({ sql: "SELECT correct_option_id FROM question_versions WHERE id = ?", args: [qRet1.preguntaVersionId] }))
      .rows[0].correct_option_id,
  );
  const respRetOk = await registrarComprobacionRetencion(cSim, {
    estudianteId: "est-a",
    oaId: "oa7",
    preguntaId: qRet1.preguntaId,
    opcionId: claveRet1,
    clientSubmissionId: "ret-est-a-ok-1",
  });
  assert.equal(respRetOk.registrado, true);
  assert.equal(respRetOk.correcta, true);
  assert.ok(respRetOk.explicacion);
  assert.equal(respRetOk.agenda?.pendientesCount, 0);
  assert.equal(respRetOk.agenda?.proximas[0]?.paso, 1);
  assert.equal(respRetOk.agenda?.proximas[0]?.intervaloDias, 7);

  const respRetDup = await registrarComprobacionRetencion(cSim, {
    estudianteId: "est-a",
    oaId: "oa7",
    preguntaId: qRet1.preguntaId,
    opcionId: claveRet1,
    clientSubmissionId: "ret-est-a-ok-1",
  });
  assert.equal(respRetDup.duplicada, true);

  // Mapa ya volvió a «Lo dominas» limpio.
  const mapaRetLimpio = await cargarMapaConocimiento(cSim, { estudianteId: "est-a" });
  assert.equal(mapaRetLimpio.nodos.find((n) => n.oaId === "oa7")?.estadoVisual, "dominado");
  assert.equal(mapaRetLimpio.nodos.find((n) => n.oaId === "oa7")?.marca, null);

  // +7 días más (total +30 días): vuelve a vencer en paso 1; si falla reinicia a paso 0 y marca por_comprobar.
  simOffsetSeg = 30 * DIA_SEG;
  const agA30 = await cargarAgendaRetencion(cSim, { estudianteId: "est-a" });
  assert.equal(agA30.pendientesCount, 1);
  assert.equal(agA30.pendientes[0].paso, 1);
  const qRet2 = agA30.pendientes[0].pregunta!;
  const claveRet2 = String(
    (await client.execute({ sql: "SELECT correct_option_id FROM question_versions WHERE id = ?", args: [qRet2.preguntaVersionId] }))
      .rows[0].correct_option_id,
  );
  const optIncorrecta2 = qRet2.opciones.find((o) => o.id !== claveRet2)!.id;
  const respRetMal = await registrarComprobacionRetencion(cSim, {
    estudianteId: "est-a",
    oaId: "oa7",
    preguntaId: qRet2.preguntaId,
    opcionId: optIncorrecta2,
    clientSubmissionId: "ret-est-a-mal-2",
  });
  assert.equal(respRetMal.correcta, false);
  assert.equal(respRetMal.agenda?.proximas[0]?.paso, 0);
  assert.equal(respRetMal.agenda?.proximas[0]?.intervaloDias, 3);
  const mapaTrasFalloRet = await cargarMapaConocimiento(cSim, { estudianteId: "est-a" });
  assert.equal(mapaTrasFalloRet.nodos.find((n) => n.oaId === "oa7")?.estadoVisual, "por_comprobar");

  // Volvemos reloj a +25 días (limpio para NI1 entre est-a y est-b usando otra pareja limpia est-a/est-b? Mejor: usamos est-b vs est-a en nueva marca? Notar que est-a tuvo fallo en retención; reset simOffsetSeg = 100 días o usamos nuevo estudiante? Mejor: limpiar/comparar dos cuentas frescas o resetear simOffset a 0 no cambia historia de est-a! Creamos est-ni1 y est-ni2 idénticos para NI1-NI5 limpios!)
  simOffsetSeg = 40 * DIA_SEG;
  await db.insert(users).values([
    { id: "est-ni1", email: "ni1@ficticio.test", name: "NI 1" },
    { id: "est-ni2", email: "ni2@ficticio.test", name: "NI 2" },
    { id: "est-ni3", email: "ni3@ficticio.test", name: "NI 3" },
  ]);
  await db.insert(schema.enrollments).values(
    ["est-ni1", "est-ni2", "est-ni3"].map((userId) => ({
      userId,
      levelSubjectId: "ls-mat-5b",
      isActive: true,
    })),
  );
  // D1 (M-R04): dominar OA7 en 2 días calendario distintos (día 39 y día 40) para que tEval quede en día 40.
  simOffsetSeg = 39 * DIA_SEG;
  for (const est of ["est-ni1", "est-ni2", "est-ni3"]) {
    await registrarPracticaEnMotor(cSim, {
      estudianteId: est,
      oaId: "oa7",
      preguntaId: "oa7-c1",
      opcionId: "A",
      usoPista: false,
      clientSubmissionId: `ni-${est}-c1`,
    });
  }
  simOffsetSeg = 40 * DIA_SEG;
  for (const est of ["est-ni1", "est-ni2", "est-ni3"]) {
    await registrarPracticaEnMotor(cSim, {
      estudianteId: est,
      oaId: "oa7",
      preguntaId: "oa7-c2",
      opcionId: "C",
      usoPista: false,
      clientSubmissionId: `ni-${est}-c2`,
    });
  }

  const tEval = await relojMotor(cSim).ahora();
  const reviewAtTemprano = tEval + 49 * 3600;
  const reviewAtTardio = tEval + 100 * 3600;

  // Responder evaluación normal con preguntas de d-piloto (sembradas por sembrarEvaluacionPiloto):
  // Nota: las 15 preguntas están agrupadas 3 por OA en orden [oa7 x3, oa8 x3, oa10 x3, oa11 x3, oa13 x3].
  async function rendirEvalConPatron(
    estudianteId: string,
    reviewAt: number,
    fallarPregunta: (idx: number, qId: string) => boolean,
    conExtraReprobado = false,
  ) {
    const proc = await abrirProceso(cSim, {
      estudianteId,
      evaluacionId: "me-e2",
      versionId: "ev-piloto",
      perfil: "regular",
      reviewAt,
    });
    const norm = await iniciarIntento(cSim, { instanciaId: proc.instanciaId, estudianteId, tipo: "normal" });
    const qRows = (
      await client.execute({
        sql: "SELECT question_version_id FROM evaluation_version_questions WHERE evaluation_version_id = 'ev-piloto' ORDER BY position",
      })
    ).rows;
    for (let idx = 0; idx < qRows.length; idx++) {
      const qId = String(qRows[idx].question_version_id);
      const correcta = claveEval[qId];
      const errar = fallarPregunta(idx, qId);
      const opt = errar ? ["A", "B", "C", "D"].find((xOpt) => xOpt !== correcta)! : correcta;
      await responder(cSim, { intentoId: norm.intentoId, estudianteId, preguntaVersionId: qId, opcionId: opt });
    }
    await enviarIntento(cSim, { intentoId: norm.intentoId, estudianteId });

    if (conExtraReprobado) {
      const ext = await iniciarIntento(cSim, { instanciaId: proc.instanciaId, estudianteId, tipo: "extra", semilla: "s-m6" });
      for (const qId of ext.preguntas) {
        const correcta = claveEval[qId];
        const opt = ["A", "B", "C", "D"].find((xOpt) => xOpt !== correcta)!;
        await responder(cSim, { intentoId: ext.intentoId, estudianteId, preguntaVersionId: qId, opcionId: opt });
      }
      await enviarIntento(cSim, { intentoId: ext.intentoId, estudianteId });
    }
    return cerrarProceso(cSim, { procesoId: proc.procesoId, estudianteId });
  }

  // NI1: est-ni1 aprueba 100 % (15/15); est-ni2 aprueba 73.33 % (11/15, falla 2 de OA8 y 2 de OA10).
  const c1 = await rendirEvalConPatron("est-ni1", reviewAtTemprano, () => false);
  const c2 = await rendirEvalConPatron("est-ni2", reviewAtTemprano, (idx) => idx === 3 || idx === 4 || idx === 6 || idx === 7);
  // NI2: est-ni3 reprueba tras agotar extra (close_cause = agotamiento).
  const c3 = await rendirEvalConPatron("est-ni3", reviewAtTemprano, () => true, true);
  // NI4: est-d mantiene intento abierto con reviewAt lejano.
  const procD = await abrirProceso(cSim, {
    estudianteId: "est-d",
    evaluacionId: "me-e2",
    versionId: "ev-piloto",
    perfil: "regular",
    reviewAt: reviewAtTardio,
  });
  await iniciarIntento(cSim, { instanciaId: procD.instanciaId, estudianteId: "est-d", tipo: "normal" });

  assert.equal(c1.estado, "aprobado");
  assert.equal(c2.estado, "aprobado");
  assert.equal(c3.estado, "reprobado");
  assert.equal(c3.closeCause, "agotamiento");
  assert.equal(c3.moduloSiguiente, true);

  // progression_continuations creada en agotamiento con from_module_id y pending_items_json reales.
  const pcNi3 = (
    await client.execute({
      sql: "SELECT from_module_id, pending_items_json FROM progression_continuations WHERE process_id = ?",
      args: [c3.procesoId],
    })
  ).rows[0];
  assert.ok(pcNi3, "debe existir continuation también por agotamiento");
  assert.equal(pcNi3.from_module_id, "lo-mat");
  const pendingItemsNi3 = JSON.parse(String(pcNi3.pending_items_json));
  assert.ok(Array.isArray(pendingItemsNi3) && pendingItemsNi3.length > 0);

  // Normaliza la parte de evaluación / timestamps que no depende de identidad ni puntuación.
  const normalizarParaNI = (m: Awaited<ReturnType<typeof cargarMapaConocimiento>>) => JSON.stringify(m);

  // ── 2b. NI1: est-ni1 vs est-ni2 idénticos byte a byte antes de review_at ──
  const mNi1Antes = await cargarMapaConocimiento(cSim, { estudianteId: "est-ni1" });
  const mNi2Antes = await cargarMapaConocimiento(cSim, { estudianteId: "est-ni2" });
  const mNi3Antes = await cargarMapaConocimiento(cSim, { estudianteId: "est-ni3" });
  const mDAntes = await cargarMapaConocimiento(cSim, { estudianteId: "est-d" });

  assert.equal(mNi1Antes.evaluacion?.publicada, false);
  assert.equal(mNi1Antes.evaluacion?.mejorScorePct, null);
  assert.deepEqual(mNi1Antes.evaluacion?.contenidosAReforzar, []);
  assert.equal(normalizarParaNI(mNi1Antes), normalizarParaNI(mNi2Antes), "NI1: salidas idénticas byte a byte bajo embargo");

  // ── NI2: distinto estado (aprobado vs reprobado antes de review_at) ──
  assert.equal(mNi3Antes.evaluacion?.publicada, false);
  assert.equal(mNi3Antes.evaluacion?.estadoProceso, "reprobado");
  assert.equal(mNi3Antes.evaluacion?.moduloSiguienteAbierto, true);
  assert.equal(mNi3Antes.evaluacion?.mejorScorePct, null);
  assert.deepEqual(mNi3Antes.evaluacion?.contenidosAReforzar, []);
  assert.deepEqual(mNi1Antes.nodos, mNi3Antes.nodos);
  assert.deepEqual(mNi1Antes.recomendacion, mNi3Antes.recomendacion);

  // ── NI3 y NI4: avanzar reloj a reviewAtTemprano (+49 h) ──
  simOffsetSeg = 40 * DIA_SEG + 49 * 3600 + 5;
  const mNi1Despues = await cargarMapaConocimiento(cSim, { estudianteId: "est-ni1" });
  const mNi2Despues = await cargarMapaConocimiento(cSim, { estudianteId: "est-ni2" });
  const mDDespues = await cargarMapaConocimiento(cSim, { estudianteId: "est-d" });

  assert.equal(mNi1Despues.evaluacion?.publicada, true);
  assert.equal(mNi1Despues.evaluacion?.mejorScorePct, 100);
  assert.deepEqual(mNi1Despues.evaluacion?.contenidosAReforzar, []);
  // 03 §8.1: aprobar E2 con 100 % no enciende OA sin práctica en `dominado`.
  assert.equal(mNi1Despues.nodos.find((n) => n.oaId === "oa8")?.estado, "sin_evidencia");
  assert.equal(mNi1Despues.nodos.find((n) => n.oaId === "oa11")?.estado, "sin_evidencia");

  // Est-ni2 publica sus errores (OA8 y OA10) y la recomendación prioriza reforzar OA8.
  assert.equal(mNi2Despues.evaluacion?.publicada, true);
  assert.ok(Math.abs((mNi2Despues.evaluacion?.mejorScorePct ?? 0) - (11 / 15) * 100) < 0.01);
  assert.deepEqual(
    mNi2Despues.evaluacion?.contenidosAReforzar.map((r) => r.oaId),
    ["oa8", "oa10"],
  );
  assert.equal(mNi2Despues.recomendacion?.oaId, "oa8");
  assert.equal(mNi2Despues.recomendacion?.tipo, "reforzar");
  assert.notEqual(normalizarParaNI(mNi1Despues), normalizarParaNI(mNi2Despues), "NI3: control debe diferir al publicar");

  // NI4: est-d sigue en curso en la misma versión y su salida (normalizada la fecha del día `hoy`) NO cambió cuando est-ni1/ni2 publicaron.
  const sinHoy = (m: Awaited<ReturnType<typeof cargarMapaConocimiento>>) =>
    JSON.stringify({ ...m, retencion: { ...m.retencion, hoy: "DIA" } });
  assert.equal(sinHoy(mDDespues), sinHoy(mDAntes));

  // NI5 / P18: versión ya expuesta rechaza abrir nueva instancia para est-e.
  await assert.rejects(
    abrirProceso(cSim, {
      estudianteId: "est-e",
      evaluacionId: "me-e2",
      versionId: "ev-piloto",
      perfil: "regular",
    }),
    (e: unknown) => e instanceof ErrorEvaluacion && e.codigo === "version_no_encontrada",
  );

  // ── 2c. M6 Progresión real P21 v2 en checkModuleAccess ──
  const { DEFAULT_CONFIG } = await import("../server/calendarUtils");
  const cfgM6 = {
    ...DEFAULT_CONFIG,
    startDate: "2026-03-01",
    moduleDays: 14,
    breaks: [],
    holidays: [],
  };
  const fechaMod2 = new Date("2026-04-01T12:00:00Z");

  // est-d tiene proceso en_curso: aunque domine los 5 OA en el mapa (en 2 días calendario distintos, D1), módulo 2 sigue bloqueado (05 §1).
  const oasM6 = ["oa7", "oa8", "oa10", "oa11", "oa13"] as const;
  for (const oaId of oasM6) {
    const qC1 = (await client.execute({ sql: "SELECT correct_option_id FROM question_versions WHERE id = ?", args: [`qv-prac-${oaId}-c1`] })).rows[0];
    await registrarPracticaEnMotor(cSim, {
      estudianteId: "est-d",
      oaId,
      preguntaId: `${oaId}-c1`,
      opcionId: String(qC1.correct_option_id),
      usoPista: false,
      clientSubmissionId: `dom-d-${oaId}-1`,
    });
  }
  simOffsetSeg += DIA_SEG;
  for (const oaId of oasM6) {
    const qC2 = (await client.execute({ sql: "SELECT correct_option_id FROM question_versions WHERE id = ?", args: [`qv-prac-${oaId}-c2`] })).rows[0];
    await registrarPracticaEnMotor(cSim, {
      estudianteId: "est-d",
      oaId,
      preguntaId: `${oaId}-c2`,
      opcionId: String(qC2.correct_option_id),
      usoPista: false,
      clientSubmissionId: `dom-d-${oaId}-2`,
    });
  }
  const mapaDTodoDominado = await cargarMapaConocimiento(cSim, { estudianteId: "est-d" });
  assert.equal(mapaDTodoDominado.resumen.dominados, 5);
  const accD = await checkModuleAccess(db, "est-d", "ls-mat-5b", 2, fechaMod2, cfgM6);
  assert.equal(accD.ok, false, "sin concluir E2 el mapa nunca abre módulo 2");

  // est-ni1 (aprobado) y est-ni3 (reprobado agotamiento) SÍ abren módulo 2.
  assert.equal((await checkModuleAccess(db, "est-ni1", "ls-mat-5b", 2, fechaMod2, cfgM6 as any)).ok, true);
  assert.equal((await checkModuleAccess(db, "est-ni3", "ls-mat-5b", 2, fechaMod2, cfgM6 as any)).ok, true);

  // También abrir módulo 2 por `reprobada_continua` (72 h vencidas sin extra) creando proceso sobre otra eval cerrada me-p2?
  // Probamos con nueva versión `ev-piloto-v2` (como excepción P18).
  await x("INSERT INTO evaluation_versions (id, evaluation_id, version, status, created_by) VALUES ('ev-piloto-v2', 'me-e2', 2, 'borrador', 'ficticio-autor')");
  await x("UPDATE evaluation_versions SET status = 'validada', validated_by = 'ficticio-validador', validated_at = 1 WHERE id = 'ev-piloto-v2'");
  const procF = await abrirProceso(cSim, {
    estudianteId: "est-f",
    evaluacionId: "me-e2",
    versionId: "ev-piloto-v2",
    perfil: "regular",
  });
  const normF = await iniciarIntento(cSim, { instanciaId: procF.instanciaId, estudianteId: "est-f", tipo: "normal" });
  await enviarIntento(cSim, { intentoId: normF.intentoId, estudianteId: "est-f" });
  await x("UPDATE evaluation_instances SET extra_deadline_at = 1 WHERE id = ?", [procF.instanciaId]);
  const cerradoF = await cerrarProceso(cSim, { procesoId: procF.procesoId, estudianteId: "est-f" });
  assert.equal(cerradoF.estado, "reprobado");
  assert.equal(cerradoF.closeCause, "reprobada_continua");
  assert.equal((await checkModuleAccess(db, "est-f", "ls-mat-5b", 2, fechaMod2, cfgM6 as any)).ok, true);

  // ── 3. Rutas HTTP reales (/conocimiento/mapa y /conocimiento/retencion) ──
  const { registerRoutes } = await import("../server/routes");
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    const uid = req.header("x-test-user");
    if (uid) req.user = { id: uid };
    next();
  });
  server = createServer(app);
  await registerRoutes(server, app);
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", () => resolve()));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  assert.equal((await fetch(`${base}/api/vortice/conocimiento/retencion`)).status, 401);
  assert.equal((await fetch(`${base}/api/vortice/conocimiento/retencion`, { method: "POST", body: "{}" })).status, 401);

  // Con reloj real del servidor (sin offset simulado), est-ni2 aún está bajo embargo.
  await db.insert(schema.userProfiles).values({ userId: "est-ni2", role: "student" });
  const mapaHttpEmbargado = await fetch(`${base}/api/vortice/conocimiento/mapa`, {
    headers: { "x-test-user": "est-ni2" },
  });
  assert.equal(mapaHttpEmbargado.status, 200);
  assert.match(mapaHttpEmbargado.headers.get("cache-control") ?? "", /no-store/);
  const mapaHttpEmbJson = await mapaHttpEmbargado.json();
  assert.equal(mapaHttpEmbJson.evaluacion?.publicada, false);
  assert.equal(mapaHttpEmbJson.evaluacion?.mejorScorePct, null);
  assert.deepEqual(mapaHttpEmbJson.evaluacion?.contenidosAReforzar, []);

  // Para probar HTTP publicado real + POST /conocimiento/retencion, est-http rinde en ev-piloto-v2 con reviewAt pasado.
  await db.insert(users).values({ id: "est-http", email: "http@ficticio.test" });
  await db.insert(schema.userProfiles).values({ userId: "est-http", role: "student" });
  await db.insert(schema.enrollments).values({ userId: "est-http", levelSubjectId: "ls-mat-5b", isActive: true });
  const qOrig = (
    await client.execute({
      sql: "SELECT question_version_id, family_id, item_id, bank, position FROM evaluation_version_questions WHERE evaluation_version_id = 'ev-piloto' ORDER BY position",
    })
  ).rows;
  for (const r of qOrig) {
    await client.execute({
      sql: "INSERT INTO evaluation_version_questions (evaluation_version_id, question_version_id, family_id, item_id, bank, position) VALUES ('ev-piloto-v2', ?, ?, ?, ?, ?)",
      args: [r.question_version_id, r.family_id, r.item_id, r.bank, r.position],
    });
  }
  const realNow = await relojMotor(client as any).ahora();
  const procHttp = await abrirProceso(client as any, {
    estudianteId: "est-http",
    evaluacionId: "me-e2",
    versionId: "ev-piloto-v2",
    perfil: "regular",
    reviewAt: realNow - 10,
  });
  const intHttp = await iniciarIntento(client as any, { instanciaId: procHttp.instanciaId, estudianteId: "est-http", tipo: "normal" });
  const qsHttp = (
    await client.execute({
      sql: "SELECT question_version_id FROM evaluation_version_questions WHERE evaluation_version_id = 'ev-piloto-v2' ORDER BY position",
    })
  ).rows;
  for (let i = 0; i < qsHttp.length; i++) {
    const qId = String(qsHttp[i].question_version_id);
    const corr = claveEval[qId];
    const opt = i === 3 ? ["A", "B", "C", "D"].find((o) => o !== corr)! : corr; // falla 1 de OA8
    await responder(client as any, { intentoId: intHttp.intentoId, estudianteId: "est-http", preguntaVersionId: qId, opcionId: opt });
  }
  await enviarIntento(client as any, { intentoId: intHttp.intentoId, estudianteId: "est-http" });
  await cerrarProceso(client as any, { procesoId: procHttp.procesoId, estudianteId: "est-http" });

  const mapaHttp = await fetch(`${base}/api/vortice/conocimiento/mapa`, {
    headers: { "x-test-user": "est-http" },
  });
  assert.equal(mapaHttp.status, 200);
  assert.match(mapaHttp.headers.get("cache-control") ?? "", /no-store/);
  const mapaHttpJson = await mapaHttp.json();
  assert.equal(mapaHttpJson.evaluacion?.publicada, true);
  assert.deepEqual(mapaHttpJson.evaluacion?.contenidosAReforzar?.map((r: any) => r.oaId), ["oa8"]);

  const retHttpGet = await fetch(`${base}/api/vortice/conocimiento/retencion`, {
    headers: { "x-test-user": "est-http" },
  });
  assert.equal(retHttpGet.status, 200);
  assert.match(retHttpGet.headers.get("cache-control") ?? "", /no-store/);

  const badRet = await fetch(`${base}/api/vortice/conocimiento/retencion`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-user": "est-http" },
    body: JSON.stringify({ oaId: "oa7", preguntaId: "oa7-c3", opcionId: "B", clientSubmissionId: "s1", extra: 1 }),
  });
  assert.equal(badRet.status, 400);

  const okRetHttp = await fetch(`${base}/api/vortice/conocimiento/retencion`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-user": "est-http" },
    body: JSON.stringify({ oaId: "oa7", preguntaId: "oa7-c3", opcionId: "B", clientSubmissionId: "ret-http-1" }),
  });
  assert.equal(okRetHttp.status, 200);
  const okRetJson = await okRetHttp.json();
  assert.equal(okRetJson.registrado, true);
  assert.equal(typeof okRetJson.correcta, "boolean");
} finally {
  if (server) await new Promise<void>((r) => server!.close(() => r()));
  client.close();
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("retencion-cruce-m4m5m6: ok");
