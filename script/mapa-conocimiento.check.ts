// Pruebas de Paso 2 (Motor en sombra M2 + Mapa «Mis conocimientos» M3):
// - Fronteras puras, inconsistencias, estados visuales y recomendación determinista (sin IA).
// - No-mezcla: lesson_study_progress NO enciende estrellas.
// - Ayuda vs sin ayuda: aciertos con usoPista quedan en `incierto` (`solo_con_ayuda`); 2 familias sin ayuda
//   llevan a `dominado` («Lo dominas») y desbloquean los siguientes OA (`oa8` y `oa10`).
// - Coherencia con compararProyeccion y rutas HTTP reales.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Client } from "@libsql/client";
import {
  calcularFronteras,
  recomendarSiguienteContenido,
  type AristaMapa,
  type NodoEntradaMapa,
} from "../shared/mapaConocimiento";

const DIA_SEG = 86400;
const RELOJ_BASE_SIM_SEG = 2_000_023_200; // 2033-05-18T10:00:00Z
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

if (process.env.NODE_ENV === "production") {
  throw new Error("mapa-conocimiento.check no debe correr en producción");
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-m2-m3-"));
process.env.TEST_DATABASE_URL = `file:${path.join(dir, "m2m3.db")}`;

const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const schema = await import("../shared/schema");
const { users } = await import("../shared/models/auth");
const { db, client } = await import("../server/db");
const { migrar } = await import("../server/migrar");
const { saveProgresoLeccion } = await import("../server/aulaUniversal");
const { cargarMapaConocimiento, registrarPracticaEnMotor } = await import("../server/mapaConocimiento");
const { compararProyeccion } = await import("../server/reconstruccion");
const { relojMotor } = await import("../server/reloj");
const { sembrarPilotoPractica } = await import("../server/sembrarPilotoPractica");
const { sembrarFicticios } = await import("./lib/esquemaHeredado");

let server: ReturnType<typeof createServer> | null = null;
try {
  // ── 1. Pruebas puras de fronteras, estados y recomendación ──
  const baseNodos: NodoEntradaMapa[] = [
    { itemId: "i7", code: "MAT5U3-OA07", oaId: "oa7", nombre: "Fracciones propias", definicion: "d", estado: "sin_evidencia", marca: null, motivo: null },
    { itemId: "i8", code: "MAT5U3-OA08", oaId: "oa8", nombre: "Impropias y mixtos", definicion: "d", estado: "sin_evidencia", marca: null, motivo: null },
    { itemId: "i10", code: "MAT5U3-OA10", oaId: "oa10", nombre: "Fracción a decimal", definicion: "d", estado: "sin_evidencia", marca: null, motivo: null },
    { itemId: "i11", code: "MAT5U3-OA11", oaId: "oa11", nombre: "Comparar decimales", definicion: "d", estado: "sin_evidencia", marca: null, motivo: null },
  ];
  const baseAristas: AristaMapa[] = [
    { itemId: "i8", prerequisiteItemId: "i7", relation: "necesaria" },
    { itemId: "i10", prerequisiteItemId: "i7", relation: "necesaria" },
    { itemId: "i11", prerequisiteItemId: "i10", relation: "necesaria" },
  ];

  const fInicial = calcularFronteras(baseNodos, baseAristas);
  assert.deepEqual(fInicial.fronteraExterna, ["i7"]);
  assert.deepEqual(fInicial.bloqueados, ["i8", "i10", "i11"]);
  assert.equal(fInicial.nodos.find((n) => n.itemId === "i7")?.etiqueta, "Listo para aprender");
  assert.equal(fInicial.nodos.find((n) => n.itemId === "i8")?.etiqueta, "Primero: Fracciones propias");
  assert.equal(recomendarSiguienteContenido(fInicial)?.oaId, "oa7");

  // Estado no factible (i8 dominado sin su base i7) marca inconsistencia sin inferir i7 dominado.
  const nodosInconsistentes = baseNodos.map((n) =>
    n.itemId === "i8" ? { ...n, estado: "dominado" as const } : n,
  );
  const fInc = calcularFronteras(nodosInconsistentes, baseAristas);
  assert.deepEqual(fInc.inconsistencias, ["i8"]);
  assert.equal(fInc.nodos.find((n) => n.itemId === "i7")?.estado, "sin_evidencia");

  // ── 2. Integración real con BD (0001..0004 + M2 + M3 + Aula + HTTP) ──
  const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
  for (const s of ddl) await db.run(sql.raw(s));
  await migrar(client as any, "migrations/vortice");
  await sembrarFicticios(client as any);

  await db.insert(users).values([{ id: "est-m2", email: "m2@prueba.test", name: "Estudiante M2" }]);
  await db.insert(schema.userProfiles).values({ userId: "est-m2", role: "student" });
  await db.insert(schema.enrollments).values({ userId: "est-m2", levelSubjectId: "ls-mat-5b", isActive: true });

  let simOffsetSeg = 0;
  const cSim = clienteConOffset(client as unknown as Client, () => simOffsetSeg);

  const s1 = await sembrarPilotoPractica(cSim, { levelSubjectId: "ls-mat-5b" });
  assert.equal(s1.yaPublicado, false);
  const s2 = await sembrarPilotoPractica(cSim, { levelSubjectId: "ls-mat-5b" });
  assert.equal(s2.yaPublicado, true);

  // Estado inicial en DB: oa7 listo, oa8..oa13 bloqueados.
  const m0 = await cargarMapaConocimiento(cSim, { estudianteId: "est-m2" });
  assert.equal(m0.disponible, true);
  assert.equal(m0.politicaActiva, true);
  assert.equal(m0.tieneEvidencia, false);
  assert.equal(m0.nodos.find((n) => n.oaId === "oa7")?.estadoVisual, "listo");
  assert.equal(m0.nodos.find((n) => n.oaId === "oa8")?.estadoVisual, "bloqueado");
  assert.equal(m0.recomendacion?.oaId, "oa7");

  // No-mezcla: guardar progreso en Aula Universal NO cambia el mapa de dominio.
  await saveProgresoLeccion(db, {
    userId: "est-m2",
    oaId: "oa7",
    body: { pasoActual: "comprueba", tramoActual: 2, puertaPreferida: "video", pasoEjemploVisto: 2 },
    now: new Date(),
  });
  const mDespuesLectura = await cargarMapaConocimiento(cSim, { estudianteId: "est-m2" });
  assert.equal(mDespuesLectura.tieneEvidencia, false);
  assert.equal(mDespuesLectura.nodos.find((n) => n.oaId === "oa7")?.estadoVisual, "listo");

  // Práctica con pista (`usoPista: true`) en dos familias distintas -> incierto (`solo_con_ayuda`), NO dominado.
  await registrarPracticaEnMotor(cSim, {
    estudianteId: "est-m2",
    oaId: "oa7",
    preguntaId: "oa7-p1",
    opcionId: "A",
    usoPista: true,
    clientSubmissionId: "sub-pista-1",
  });
  const rPista2 = await registrarPracticaEnMotor(cSim, {
    estudianteId: "est-m2",
    oaId: "oa7",
    preguntaId: "oa7-p2",
    opcionId: "B",
    usoPista: true,
    clientSubmissionId: "sub-pista-2",
  });
  assert.equal(rPista2.registrado, true);
  assert.equal(rPista2.correcta, true);
  assert.equal(rPista2.estado?.estado, "incierto");
  assert.equal(rPista2.estado?.motivo, "solo_con_ayuda");

  // Idempotencia: reenvío con mismo clientSubmissionId -> duplicada: true.
  const rDup = await registrarPracticaEnMotor(cSim, {
    estudianteId: "est-m2",
    oaId: "oa7",
    preguntaId: "oa7-p2",
    opcionId: "B",
    usoPista: true,
    clientSubmissionId: "sub-pista-2",
  });
  assert.equal(rDup.duplicada, true);

  // D1 (M-R04): múltiples aciertos SIN pista en el MISMO día T -> NUNCA domina; queda en «Por confirmar otro día».
  await registrarPracticaEnMotor(cSim, {
    estudianteId: "est-m2",
    oaId: "oa7",
    preguntaId: "oa7-c1",
    opcionId: "A",
    usoPista: false,
    clientSubmissionId: "sub-oa7-c1",
  });
  const rMismoDia = await registrarPracticaEnMotor(cSim, {
    estudianteId: "est-m2",
    oaId: "oa7",
    preguntaId: "oa7-c2",
    opcionId: "C",
    usoPista: false,
    clientSubmissionId: "sub-oa7-c2",
  });
  assert.equal(rMismoDia.estado?.estado, "incierto", "D1: aciertos en el mismo día T nunca generan dominio");
  const mDia1 = await cargarMapaConocimiento(cSim, { estudianteId: "est-m2" });
  assert.equal(mDia1.nodos.find((n) => n.oaId === "oa7")?.etiqueta, "Por confirmar otro día");
  assert.equal(mDia1.nodos.find((n) => n.oaId === "oa8")?.estadoVisual, "bloqueado");

  // Avanzar reloj a día T+1 y responder una familia independiente sin ayuda -> domina oa7 y desbloquea oa8 y oa10.
  simOffsetSeg += DIA_SEG;
  const rDia2 = await registrarPracticaEnMotor(cSim, {
    estudianteId: "est-m2",
    oaId: "oa7",
    preguntaId: "oa7-ind-f1-v1",
    opcionId: "B",
    usoPista: false,
    clientSubmissionId: "sub-oa7-ind-dia2",
  });
  assert.equal(rDia2.correcta, true);
  assert.equal(rDia2.estado?.estado, "dominado", "D1: acierto en día T+1 con familia distinta promueve a dominado");

  const mDesbloqueado = await cargarMapaConocimiento(cSim, { estudianteId: "est-m2" });
  assert.equal(mDesbloqueado.tieneEvidencia, true);
  assert.equal(mDesbloqueado.nodos.find((n) => n.oaId === "oa7")?.estadoVisual, "dominado");
  assert.equal(mDesbloqueado.nodos.find((n) => n.oaId === "oa7")?.etiqueta, "Lo dominas");
  assert.equal(mDesbloqueado.nodos.find((n) => n.oaId === "oa8")?.estadoVisual, "listo");
  assert.equal(mDesbloqueado.nodos.find((n) => n.oaId === "oa10")?.estadoVisual, "listo");
  assert.equal(mDesbloqueado.nodos.find((n) => n.oaId === "oa11")?.estadoVisual, "bloqueado");

  // M-R04 anti-auto-reparación: fallar y reintentar la MISMA pregunta 2 segundos después NO repara el error ni suma acierto autónomo.
  await registrarPracticaEnMotor(cSim, {
    estudianteId: "est-m2",
    oaId: "oa8",
    preguntaId: "oa8-p1",
    opcionId: "A", // correcta B
    usoPista: false,
    clientSubmissionId: "sub-oa8-err1",
  });
  simOffsetSeg += 2;
  const rReintento = await registrarPracticaEnMotor(cSim, {
    estudianteId: "est-m2",
    oaId: "oa8",
    preguntaId: "oa8-p1",
    opcionId: "B", // correcta, pero reintento inmediato tras fallar
    usoPista: false,
    clientSubmissionId: "sub-oa8-retry1",
  });
  assert.equal(rReintento.reintentoMismaPregunta, true, "Reintentar misma pregunta tras error debe marcarse como reintento asistido");

  await registrarPracticaEnMotor(cSim, {
    estudianteId: "est-m2",
    oaId: "oa8",
    preguntaId: "oa8-p2",
    opcionId: "A", // correcta B
    usoPista: false,
    clientSubmissionId: "sub-oa8-err2",
  });
  const mReforzar = await cargarMapaConocimiento(cSim, { estudianteId: "est-m2" });
  assert.equal(mReforzar.nodos.find((n) => n.oaId === "oa8")?.estadoVisual, "no_dominado", "El reintento inmediato no debió reparar el error de oa8-p1");
  assert.equal(mReforzar.nodos.find((n) => n.oaId === "oa8")?.etiqueta, "Lo reforzamos");

  // Consistencia total con reconstrucción.
  const ahora = await relojMotor(cSim).ahora();
  const comp = await compararProyeccion(cSim, "est-m2", ahora);
  assert.equal(comp.iguales, true);
  assert.equal(comp.politicaEjecutable, true);
  assert.deepEqual(comp.diferencias, []);

  // ── 3. Rutas HTTP reales + sincronización en sombra desde /comprobar ──
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

  assert.equal((await fetch(`${base}/api/vortice/conocimiento/mapa`)).status, 401);
  assert.equal((await fetch(`${base}/api/vortice/conocimiento/practica`, { method: "POST", body: "{}" })).status, 401);

  const badPrac = await fetch(`${base}/api/vortice/conocimiento/practica`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-user": "est-m2" },
    body: JSON.stringify({ oaId: "oa10", preguntaId: "oa10-p1", opcionId: "B", usoPista: false, extra: 1 }),
  });
  assert.equal(badPrac.status, 400);

  // D1 («Ya lo sé»): enviar comprobación correcta en oa10 el mismo día -> logrado en Aula (`completadaPorYaLoSe`),
  // pero en Mapa queda `incierto` («Por confirmar otro día») hasta confirmar en otro día calendario.
  const compOa10 = await fetch(`${base}/api/vortice/aula/lecciones/oa10/comprobar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-user": "est-m2" },
    body: JSON.stringify({
      respuestas: { "oa10-c1": "C", "oa10-c2": "A", "oa10-c3": "B" },
      origen: "ya_lo_se",
    }),
  });
  assert.equal(compOa10.status, 200);
  const compOa10Json = await compOa10.json();
  assert.equal(compOa10Json.estado, "logrado");
  assert.equal(compOa10Json.progreso?.completadaPorYaLoSe, true);
  assert.equal("porcentaje" in compOa10Json, false);

  const mapaHttpRes = await fetch(`${base}/api/vortice/conocimiento/mapa`, {
    headers: { "x-test-user": "est-m2" },
  });
  assert.equal(mapaHttpRes.status, 200);
  const mapaHttp = await mapaHttpRes.json();
  assert.equal(mapaHttp.nodos.find((n: any) => n.oaId === "oa10")?.estadoVisual, "incierto");
  assert.equal(mapaHttp.nodos.find((n: any) => n.oaId === "oa10")?.etiqueta, "Por confirmar otro día");

  // Al responder una familia independiente de oa10 en otro día (cSim en 2033 vs hoy), oa10 transiciona a dominado.
  await registrarPracticaEnMotor(cSim, {
    estudianteId: "est-m2",
    oaId: "oa10",
    preguntaId: "oa10-ind-f1-v1",
    opcionId: "C",
    usoPista: false,
    clientSubmissionId: "sub-oa10-ind-otro-dia",
  });
  const mOa10Dom = await cargarMapaConocimiento(cSim, { estudianteId: "est-m2" });
  assert.equal(mOa10Dom.nodos.find((n) => n.oaId === "oa10")?.estadoVisual, "dominado");
  assert.equal(mOa10Dom.nodos.find((n) => n.oaId === "oa11")?.estadoVisual, "listo");
} finally {
  if (server) await new Promise<void>((r) => server!.close(() => r()));
  client.close();
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("mapa-conocimiento: ok");
