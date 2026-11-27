// Pruebas del Bloque A: Aula Universal UDL del piloto (5 OA Matemática 5.º U3),
// Diagnóstico 0 orientador, comprobación 1..3 sin porcentaje numérico, pistas en 3 niveles
// y guardado idempotente por tramo (pausar y retomar real) vía HTTP.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import {
  pistaPorNivel,
  PUERTAS_APRENDIZAJE,
  seleccionarPuertaPrincipal,
} from "../shared/aulaUniversal";
import {
  evaluarDiagnosticoCero,
  evaluarEjercicioPractica,
  evaluarProcesoSinPorcentaje,
  obtenerLeccionPrivadaPorOa,
  obtenerLeccionPublicaPorOa,
  obtenerLeccionesPilotoPrivadas,
  obtenerLeccionesPilotoPublicas,
} from "../server/aulaUniversalCatalogo";

if (process.env.NODE_ENV === "production") {
  throw new Error("aula-universal.check no debe correr en producción");
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-aula-"));
process.env.TEST_DATABASE_URL = `file:${path.join(dir, "aula.db")}`;

const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const schema = await import("../shared/schema");
const { users } = await import("../shared/models/auth");
const { db } = await import("../server/db");
const { saveProgresoLeccion } = await import("../server/aulaUniversal");

let server: ReturnType<typeof createServer> | null = null;
try {
  // ── 1. Pruebas puras del piloto y reglas UDL ──
  const lecciones = obtenerLeccionesPilotoPrivadas();
  assert.deepEqual(lecciones.map((l) => l.oaId), ["oa7", "oa8", "oa10", "oa11", "oa13"]);
  const publicas = obtenerLeccionesPilotoPublicas();
  assert.equal(/respuestaCorrecta|explicacionCorrecta/.test(JSON.stringify(publicas)), false, "Catálogo público sin claves");

  for (const l of lecciones) {
    assert.ok(l.vocabulario.length >= 2, `${l.oaId} requiere vocabulario clave`);
    assert.ok(l.microTramos.length >= 2, `${l.oaId} requiere micro-tramos`);
    assert.ok(l.ejemploResuelto.pasos.length >= 3, `${l.oaId} requiere ejemplo resuelto en 3 pasos`);
    assert.equal(l.ejerciciosPractica.length, 2, `${l.oaId} requiere 2 ejercicios de práctica`);
    assert.equal(l.ejerciciosComprobacion.length, 3, `${l.oaId} requiere 3 ejercicios de comprobación`);

    // M-R06: puertas multimedia sin mediaUrl real se ocultan (queda solo `explorar`);
    // cuando todas tienen mediaUrl real, se mantiene la regla de 1 puerta principal + 3 secundarias.
    const selSinMedios = seleccionarPuertaPrincipal(l, "video");
    assert.equal(selSinMedios.principal.tipo, "explorar");
    assert.equal(selSinMedios.secundarias.length, 0);

    const leccionConMedios = {
      ...l,
      puertas: {
        ...l.puertas,
        video: { ...l.puertas.video, mediaUrl: "https://cdn.barkleyinstituto.cl/demo.mp4" },
        podcast: { ...l.puertas.podcast, mediaUrl: "https://cdn.barkleyinstituto.cl/demo.mp3" },
        presentacion: { ...l.puertas.presentacion, mediaUrl: "https://cdn.barkleyinstituto.cl/demo.pdf" },
      },
    };
    for (const pPref of PUERTAS_APRENDIZAJE) {
      const sel = seleccionarPuertaPrincipal(leccionConMedios, pPref);
      assert.equal(sel.principal.tipo, pPref);
      assert.equal(sel.secundarias.length, 3);
      assert.equal(sel.secundarias.some((s) => s.tipo === pPref), false);
    }

    // Regla pistas en 3 niveles deterministas (sin IA).
    for (const ej of l.ejerciciosPractica) {
      assert.equal(ej.pistas.length, 3);
      const p1 = pistaPorNivel(ej, 1);
      const p2 = pistaPorNivel(ej, 2);
      const p3 = pistaPorNivel(ej, 3);
      assert.ok(p1.length > 10 && p2.length > 10 && p3.length > 10);
      assert.notEqual(p1, p2);
      assert.notEqual(p2, p3);
    }

    // Ninguna referencia interna del archivo/página debe exponerse en textos de estudio.
    const textoVisible = [
      l.objetivo,
      ...l.microTramos.map((t) => t.contenido),
      ...Object.values(l.puertas).map((p) => p.transcripcion),
    ].join("\n");
    assert.equal(/\[[EGS]:\d+|MATME|matematica5/i.test(textoVisible), false, `Fuga interna en ${l.oaId}`);
  }

  assert.equal(obtenerLeccionPrivadaPorOa("no-existe"), null);
  assert.equal(obtenerLeccionPublicaPorOa("no-existe"), null);
  const pracOk = evaluarEjercicioPractica("oa7", "oa7-p1", "A");
  assert.ok(pracOk.ok && pracOk.correcta === true && typeof pracOk.explicacion === "string");
  const pracFail = evaluarEjercicioPractica("oa7", "oa7-p1", "B");
  assert.ok(pracFail.ok && pracFail.correcta === false && pracFail.explicacion === null);

  // Diagnóstico 0 orientador: sin porcentaje ni bloqueo.
  const diag = evaluarDiagnosticoCero({
    "oa7-diag": "A", // correcta
    "oa11-diag": "B", // incorrecta
  });
  assert.ok(diag.sugeridosYaLoSe.includes("oa7"));
  assert.ok(diag.sugeridosRepasar.includes("oa11"));
  assert.equal("porcentaje" in (diag as any), false);

  // Proceso 1..3 sin porcentaje numérico ni nota.
  const okProc = evaluarProcesoSinPorcentaje("oa11", {
    "oa11-c1": "A",
    "oa11-c2": "A",
    "oa11-c3": "A",
  });
  assert.deepEqual(Object.keys(okProc).sort(), ["detalle", "estado"]);
  assert.equal(okProc.estado, "logrado");

  const failProc = evaluarProcesoSinPorcentaje("oa11", {
    "oa11-c1": "A",
    "oa11-c2": "B",
    "oa11-c3": "A",
  });
  assert.deepEqual(Object.keys(failProc).sort(), ["detalle", "estado"]);
  assert.equal(failProc.estado, "sigue_practicando");
  assert.equal(failProc.detalle["oa11-c2"], false);

  // ── 2. Persistencia real + rutas HTTP ──
  const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
  for (const s of ddl) await db.run(sql.raw(s));

  await db.insert(users).values([
    { id: "est-aula", email: "aula@prueba.test", name: "Estudiante Aula" },
    { id: "est-ajeno", email: "ajeno@prueba.test", name: "Sin Matrícula" },
  ]);
  await db.insert(schema.levels).values({ id: "5b", name: "5° Básico", programType: "menores", sortOrder: 5 });
  await db.insert(schema.subjects).values({ id: "mat", name: "Matemática", slug: "matematica" });
  await db.insert(schema.levelSubjects).values({ id: "ls-mat-5b", levelId: "5b", subjectId: "mat" });
  await db.insert(schema.userProfiles).values([
    { userId: "est-aula", role: "student" },
    { userId: "est-ajeno", role: "student" },
  ]);
  await db.insert(schema.enrollments).values({ userId: "est-aula", levelSubjectId: "ls-mat-5b", isActive: true });

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

  // Sin sesión -> 401; sin matrícula activa -> 403.
  const noAuth = await fetch(`${base}/api/vortice/aula/piloto`);
  assert.equal(noAuth.status, 401);
  const noEnroll = await fetch(`${base}/api/vortice/aula/piloto`, {
    headers: { "x-test-user": "est-ajeno" },
  });
  assert.equal(noEnroll.status, 403);

  // OA inexistente -> 404.
  const notFound = await fetch(`${base}/api/vortice/aula/lecciones/oa99`, {
    headers: { "x-test-user": "est-aula" },
  });
  assert.equal(notFound.status, 404);

  // Guardar tramo en oa7 (incluye intento de forzar completadaPorYaLoSe=true sin aprobar -> se ignora).
  const put1 = await fetch(`${base}/api/vortice/aula/lecciones/oa7/progreso`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-test-user": "est-aula" },
    body: JSON.stringify({
      pasoActual: "aprende",
      tramoActual: 2,
      puertaPreferida: "podcast",
      pasoEjemploVisto: 1,
      completadaPorYaLoSe: true,
    }),
  });
  assert.equal(put1.status, 200);
  const p1 = await put1.json();
  assert.equal(p1.pasoActual, "aprende");
  assert.equal(p1.tramoActual, 2);
  assert.equal(p1.puertaPreferida, "podcast");
  assert.equal(p1.completadaPorYaLoSe, false);
  assert.equal(p1.practicaLograda, false);

  // Validación estricta: rechaza campo extra o puerta inválida.
  const badPut = await saveProgresoLeccion(db, {
    userId: "est-aula",
    oaId: "oa7",
    body: {
      pasoActual: "aprende",
      tramoActual: 1,
      puertaPreferida: "podcast",
      pasoEjemploVisto: 0,
      extraNoPermitido: 1,
    },
    now: new Date(),
  });
  assert.equal(badPut.ok, false);

  // Al recargar el piloto se retoma el tramo exacto guardado y nunca viajan claves al cliente.
  const pilotoRes = await fetch(`${base}/api/vortice/aula/piloto`, {
    headers: { "x-test-user": "est-aula" },
  });
  assert.equal(pilotoRes.status, 200);
  const pilotoRaw = await pilotoRes.text();
  assert.equal(/respuestaCorrecta|explicacionCorrecta/.test(pilotoRaw), false, "Payload HTTP sin claves");
  const pilotoJson = JSON.parse(pilotoRaw);
  assert.equal(pilotoJson.progreso.oa7.tramoActual, 2);
  assert.equal(pilotoJson.progreso.oa7.puertaPreferida, "podcast");

  // Comprobación fallida -> sigue_practicando y sin porcentaje numérico.
  const compFail = await fetch(`${base}/api/vortice/aula/lecciones/oa7/comprobar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-user": "est-aula" },
    body: JSON.stringify({
      respuestas: { "oa7-c1": "B", "oa7-c2": "C", "oa7-c3": "A" },
      origen: "ya_lo_se",
    }),
  });
  assert.equal(compFail.status, 200);
  const compFailJson = await compFail.json();
  assert.equal(compFailJson.estado, "sigue_practicando");
  assert.equal("porcentaje" in compFailJson, false);
  assert.equal(compFailJson.progreso.practicaLograda, false);

  // Comprobación correcta por vía «ya_lo_se» -> marca logrado + completadaPorYaLoSe.
  const compOk = await fetch(`${base}/api/vortice/aula/lecciones/oa7/comprobar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-user": "est-aula" },
    body: JSON.stringify({
      respuestas: { "oa7-c1": "A", "oa7-c2": "C", "oa7-c3": "A" },
      origen: "ya_lo_se",
    }),
  });
  assert.equal(compOk.status, 200);
  const compOkJson = await compOk.json();
  assert.equal(compOkJson.estado, "logrado");
  assert.equal("porcentaje" in compOkJson, false);
  assert.equal(compOkJson.progreso.practicaLograda, true);
  assert.equal(compOkJson.progreso.completadaPorYaLoSe, true);
} finally {
  if (server) await new Promise<void>((r) => server!.close(() => r()));
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("aula-universal: ok");
