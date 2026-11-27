// Suite E2E HTTP de Certificación de Piloto Adulto (M-R09 · Ola 4 · D5).
// Levanta un servidor Express real con cookies HMAC firmadas de Preview (`previewTestLogin`),
// sobre una base SQLite local sembrada idénticamente a `scripts/preparar-preview.ts`,
// ejercitando las 5 cuentas ficticias oficiales y el circuito completo de D5 sin mocks de resultado.
// Ejecutar: npx tsx script/piloto-adulto-e2e.check.ts (incluido en npm run check:vortice)
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Client, InArgs } from "@libsql/client";

if (process.env.NODE_ENV === "production") {
  throw new Error("piloto-adulto-e2e.check no debe correr en producción");
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-piloto-adulto-e2e-"));
process.env.TEST_DATABASE_URL = `file:${path.join(dir, "piloto-adulto.db")}`;
process.env.VORTICE_STRICT_SCHEMA = "1";
process.env.VORTICE_EVALUACION_RUTAS = "1";
delete process.env.ENABLE_AI_COPILOT;

const PREVIEW_SECRET = "secreto-e2e-piloto-adulto-vortice-2026-min-32-chars";
const PREVIEW_ENV: NodeJS.ProcessEnv = {
  VERCEL_ENV: "preview",
  PREVIEW_TEST_LOGIN_SECRET: PREVIEW_SECRET,
};

const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const S = await import("../shared/schema");
const { users } = await import("../shared/models/auth");
const { db, client } = await import("../server/db");
const { aplicarMigracionesUnificadas } = await import("../server/migrarTodo");
const { sembrarLeccionesAulaUniversalSql } = await import("../server/aulaUniversalDb");
const { sembrarPilotoPractica } = await import("../server/sembrarPilotoPractica");
const { sembrarEvaluacionPiloto } = await import("./lib/sembrarEvaluacionPiloto");
const { registrarPracticaEnMotor } = await import("../server/mapaConocimiento");
const { LibSQLSessionStore } = await import("../server/libsqlSessionStore");
const { previewTestLogin, registerPreviewLoginPages } = await import("../server/previewLogin");
const { registerRoutes } = await import("../server/routes");

const x = (q: string, a: InArgs = []) => client.execute({ sql: q, args: a });

/** Proxy de reloj determinista para verificar D1 (día T vs día T+1) sobre la misma BD SQLite. */
function clienteConOffset(base: Client, getOffsetSeg: () => number): Client {
  return new Proxy(base, {
    get(target, prop) {
      if (prop === "execute") {
        return async (...args: Parameters<typeof target.execute>) => {
          const res = await target.execute(...args);
          const sqlTxt = typeof args[0] === "string" ? args[0] : (args[0] as any)?.sql;
          if (typeof sqlTxt === "string" && /SELECT\s+unixepoch\s*\(\s*'subsec'\s*\)/i.test(sqlTxt) && res.rows?.[0]) {
            const val = Number(res.rows[0][0]) + getOffsetSeg();
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

let server: ReturnType<typeof createServer> | null = null;
const resultadosEscenarios: string[] = [];
const marcar = (nombre: string) => resultadosEscenarios.push(`✓ ${nombre}`);

try {
  // ── 0. Preparación idéntica a Preview ──
  const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(S as any));
  for (const stmt of ddl) await db.run(sql.raw(stmt));

  const mig1 = await aplicarMigracionesUnificadas(client as any);
  assert.equal(mig1.deriva.ok, true);
  const mig2 = await aplicarMigracionesUnificadas(client as any);
  assert.equal(mig2.deriva.ok, true);
  assert.deepEqual(mig2.aplicadas, []);

  // 5 cuentas ficticias oficiales de Preview (`CUENTAS_FICTICIAS`).
  await db.insert(users).values([
    { id: "ficticio-estudiante", email: "estudiante@preview.barkley.test", name: "Estudiante Piloto" },
    { id: "ficticio-apoderado", email: "apoderado@preview.barkley.test", name: "Apoderado Piloto" },
    { id: "ficticio-tutor", email: "tutor@preview.barkley.test", name: "Tutor Piloto" },
    { id: "ficticio-admin", email: "admin@preview.barkley.test", name: "Admin Piloto" },
    { id: "ficticio-ajeno", email: "ajeno@preview.barkley.test", name: "Ajeno Sin Matrícula" },
  ]);
  await db.insert(S.levels).values({ id: "5b", name: "5° Básico", programType: "menores", sortOrder: 5 });
  await db.insert(S.subjects).values([
    { id: "mat", name: "Matemática", slug: "matematica" },
    { id: "len", name: "Lenguaje", slug: "lenguaje" },
  ]);
  await db.insert(S.levelSubjects).values([
    { id: "5b-matematica", levelId: "5b", subjectId: "mat" },
    { id: "5b-lenguaje", levelId: "5b", subjectId: "len" },
  ]);
  await db.insert(S.userProfiles).values([
    { userId: "ficticio-estudiante", role: "student", levelId: "5b", tutorUserId: "ficticio-tutor", evaluationProfile: "regular" },
    { userId: "ficticio-apoderado", role: "guardian" },
    { userId: "ficticio-tutor", role: "tutor" },
    { userId: "ficticio-admin", role: "admin" },
    { userId: "ficticio-ajeno", role: "student", levelId: "5b" },
  ]);
  await db.insert(S.enrollments).values([
    { userId: "ficticio-estudiante", levelSubjectId: "5b-matematica", isActive: true, enrolledAt: new Date("2026-03-01T12:00:00Z") },
    { userId: "ficticio-estudiante", levelSubjectId: "5b-lenguaje", isActive: true, enrolledAt: new Date("2026-03-01T12:00:00Z") },
  ]);
  await db.insert(S.guardianLinks).values({
    guardianUserId: "ficticio-apoderado",
    studentUserId: "ficticio-estudiante",
    status: "activo",
    createdBy: "ficticio-admin",
  });
  await db.insert(S.learningObjectives).values([
    { id: "lo-5b-m1", levelSubjectId: "5b-matematica", code: "M1", title: "Fracciones y decimales", weekNumber: 1, sortOrder: 1 },
    { id: "lo-5b-m2", levelSubjectId: "5b-matematica", code: "M2", title: "Operaciones y problemas", weekNumber: 2, sortOrder: 2 },
  ]);
  await db.insert(S.moduleEvaluations).values({
    id: "ficticio-e2",
    learningObjectiveId: "lo-5b-m1",
    evaluationNumber: 4,
    evaluationFunction: "modulo",
    title: "Evaluación Módulo 1",
    releaseDay: 1,
    releaseWeek: 1,
    passingScore: 70,
  });

  await sembrarLeccionesAulaUniversalSql(client as any, { levelSubjectId: "5b-matematica", learningObjectiveId: "lo-5b-m1" });
  await sembrarPilotoPractica(client as any, { levelSubjectId: "5b-matematica" });
  const claveEval = await sembrarEvaluacionPiloto(x, {
    levelSubjectId: "5b-matematica",
    evaluacionId: "ficticio-e2",
    versionId: "ev-preview-1",
  });

  // Levantar servidor Express real con el middleware real de Preview Login.
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  const previewMw = previewTestLogin(PREVIEW_ENV);
  assert.ok(previewMw, "previewTestLogin debe activarse en entorno tipo Preview");
  app.use(previewMw);
  registerPreviewLoginPages(app, PREVIEW_ENV);
  server = createServer(app);
  await registerRoutes(server, app);
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", () => resolve()));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const loginPreview = async (cuenta: string): Promise<string> => {
    const res = await fetch(`${base}/api/preview/entrar`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `cuenta=${encodeURIComponent(cuenta)}`,
      redirect: "manual",
    });
    assert.equal(res.status, 303, `Login Preview de ${cuenta} debe responder 303`);
    const sc = res.headers.get("set-cookie") ?? "";
    assert.ok(sc.includes("brkl_preview=") && sc.includes("HttpOnly") && sc.includes("SameSite=Lax"));
    return sc.split(";")[0];
  };

  const api = async (
    method: string,
    ruta: string,
    cookie?: string,
    body?: unknown,
  ): Promise<{ status: number; json: any; headers: Headers }> => {
    const headers: Record<string, string> = {};
    if (cookie) headers.Cookie = cookie;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(`${base}${ruta}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const txt = await res.text();
    let json: any = null;
    try { json = txt ? JSON.parse(txt) : null; } catch { json = txt; }
    return { status: res.status, json, headers: res.headers };
  };

  // ── 1. Salud del esquema y persistencia de sesiones LibSQL ──
  const health = await api("GET", "/api/health/vortice");
  assert.equal(health.status, 200);
  assert.equal(health.json.ok, true);

  const storeA = new LibSQLSessionStore(client as any);
  const storeB = new LibSQLSessionStore(client as any);
  await new Promise<void>((res, rej) =>
    storeA.set("sid-e2e-persist", { cookie: { maxAge: 3600_000, originalMaxAge: 3600_000 } as any, passport: { user: { id: "ficticio-estudiante" } } } as any, (e) => (e ? rej(e) : res())),
  );
  const persisted = await new Promise<any>((res, rej) =>
    storeB.get("sid-e2e-persist", (e, s) => (e ? rej(e) : res(s))),
  );
  assert.equal(persisted?.passport?.user?.id, "ficticio-estudiante");
  marcar("E1 Salud de esquema (/api/health/vortice 200) y persistencia LibSQLSessionStore");

  // ── 2. Autenticación real con las 5 cuentas ficticias + 401 sin sesión ──
  for (const ruta of [
    "/api/vortice/overview",
    "/api/vortice/aula/piloto",
    "/api/vortice/conocimiento/mapa",
    "/api/vortice/continuaciones",
    "/api/familia/estudiantes",
    "/api/tutoria/bandeja",
    "/api/admin/evaluation-profiles",
    "/api/admin/vortice/evaluaciones/procesos",
  ]) {
    assert.equal((await api("GET", ruta)).status, 401, `Sin sesión debe dar 401 en ${ruta}`);
  }
  const badLogin = await fetch(`${base}/api/preview/entrar`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "cuenta=usuario-no-valido",
    redirect: "manual",
  });
  assert.equal(badLogin.status, 400);

  const cEst = await loginPreview("ficticio-estudiante");
  const cApo = await loginPreview("ficticio-apoderado");
  const cTut = await loginPreview("ficticio-tutor");
  const cAdm = await loginPreview("ficticio-admin");
  const cAje = await loginPreview("ficticio-ajeno");
  marcar("E2 Autenticación por cookie firmada de las 5 cuentas ficticias y bloqueo 401 sin sesión");

  // ── 3. Permisos, aislamiento entre cuentas y apagado IA C19 ──
  assert.equal((await api("GET", "/api/vortice/aula/piloto", cAje)).status, 403);
  assert.equal((await api("GET", "/api/vortice/conocimiento/mapa", cAje)).status, 403);
  assert.equal((await api("GET", "/api/vortice/evaluaciones/ficticio-e2/estado", cAje)).status, 403);
  assert.equal((await api("GET", "/api/admin/vortice/evaluaciones/procesos", cAje)).status, 403);

  assert.equal((await api("GET", "/api/vortice/aula/piloto", cApo)).status, 403);
  assert.equal((await api("GET", "/api/vortice/conocimiento/mapa", cApo)).status, 403);
  assert.equal((await api("GET", "/api/familia/estudiantes/ficticio-ajeno/resumen", cApo)).status, 404);
  assert.equal((await api("GET", "/api/admin/familia/vinculos", cApo)).status, 403);

  assert.equal((await api("GET", "/api/vortice/aula/piloto", cTut)).status, 403);
  assert.equal((await api("GET", "/api/admin/evaluation-profiles", cTut)).status, 403);

  assert.equal((await api("GET", "/api/admin/evaluation-profiles", cEst)).status, 403);
  assert.equal((await api("POST", "/api/academic-copilot/chat", cEst, { message: "Hola" })).status, 403);
  assert.equal((await api("GET", "/api/gemini-copilots/by-level/5b", cEst)).status, 403);
  marcar("E3 Aislamiento de roles entre las 5 cuentas y apagado efectivo del Copiloto IA (C19)");

  // ── 4. Aula Universal en BD + Práctica + Comprueba («Ya lo sé») + Sin claves ──
  const aula = await api("GET", "/api/vortice/aula/piloto", cEst);
  assert.equal(aula.status, 200);
  assert.equal(aula.json.lecciones.length, 5);
  assert.ok(!JSON.stringify(aula.json).includes("respuestaCorrecta"), "Cero claves en Aula Universal");
  assert.ok(!JSON.stringify(aula.json).includes("explicacionCorrecta"), "Cero explicaciones privadas en Aula Universal");
  assert.equal(aula.json.lecciones[0].puertas.video.mediaUrl, null);

  const progSave = await api("PUT", "/api/vortice/aula/lecciones/oa7/progreso", cEst, {
    pasoActual: "aprende",
    tramoActual: 1,
    puertaPreferida: "explorar",
    pasoEjemploVisto: 1,
  });
  assert.equal(progSave.status, 200);

  const pracAula = await api("POST", "/api/vortice/aula/lecciones/oa7/practica", cEst, {
    preguntaId: "oa7-p1",
    opcionId: "A",
    usoPista: false,
    clientSubmissionId: "e2e-aula-p1",
  });
  assert.equal(pracAula.status, 200);
  assert.equal(pracAula.json.correcta, true);

  const compYaLoSe = await api("POST", "/api/vortice/aula/lecciones/oa7/comprobar", cEst, {
    respuestas: { "oa7-c1": "A", "oa7-c2": "C", "oa7-c3": "A" },
    origen: "ya_lo_se",
  });
  assert.equal(compYaLoSe.status, 200);
  assert.equal(compYaLoSe.json.estado, "logrado");
  assert.equal(compYaLoSe.json.progreso?.completadaPorYaLoSe, true);
  assert.equal("porcentaje" in compYaLoSe.json, false);
  marcar("E4 Aula Universal en BD, práctica en servidor, «Ya lo sé» y cero filtración de claves");

  // ── 5. K6 en días diferentes (D1) + Anti auto-reparación por reintento inmediato ──
  const pracDia1 = await api("POST", "/api/vortice/conocimiento/practica", cEst, {
    oaId: "oa7",
    preguntaId: "oa7-ind-f1-v1",
    opcionId: "B",
    usoPista: false,
    clientSubmissionId: "e2e-oa7-ind-dia1",
  });
  assert.equal(pracDia1.status, 200);
  assert.equal(pracDia1.json.correcta, true);
  assert.equal(pracDia1.json.estado?.estado, "incierto", "D1: en día T nunca domina");

  const mapaDia1 = await api("GET", "/api/vortice/conocimiento/mapa", cEst);
  assert.equal(mapaDia1.status, 200);
  assert.equal(mapaDia1.json.disponible, true);
  assert.equal(mapaDia1.json.nodos.find((n: any) => n.oaId === "oa7")?.etiqueta, "Por confirmar otro día");
  assert.equal(mapaDia1.json.nodos.find((n: any) => n.oaId === "oa8")?.estadoVisual, "bloqueado");

  // Anti auto-reparación: fallar y reintentar misma pregunta inmediatamente.
  await api("POST", "/api/vortice/conocimiento/practica", cEst, {
    oaId: "oa8",
    preguntaId: "oa8-p1",
    opcionId: "A", // incorrecta (correcta B)
    usoPista: false,
    clientSubmissionId: "e2e-oa8-err",
  });
  const retryOa8 = await api("POST", "/api/vortice/conocimiento/practica", cEst, {
    oaId: "oa8",
    preguntaId: "oa8-p1",
    opcionId: "B",
    usoPista: false,
    clientSubmissionId: "e2e-oa8-retry",
  });
  assert.equal(retryOa8.status, 200);
  assert.equal(retryOa8.json.reintentoMismaPregunta, true);

  // Día T+1 (+86400 s en reloj simulado sobre la misma BD): familia independiente distinta -> dominado.
  const cDia2 = clienteConOffset(client as unknown as Client, () => 86400);
  const resDia2 = await registrarPracticaEnMotor(cDia2, {
    estudianteId: "ficticio-estudiante",
    oaId: "oa7",
    preguntaId: "oa7-ind-f2-v1",
    opcionId: "A",
    usoPista: false,
    clientSubmissionId: "e2e-oa7-ind-dia2",
  });
  assert.equal(resDia2.correcta, true);
  assert.equal(resDia2.estado?.estado, "dominado");

  const mapaDia2 = await api("GET", "/api/vortice/conocimiento/mapa", cEst);
  assert.equal(mapaDia2.status, 200);
  assert.equal(mapaDia2.json.nodos.find((n: any) => n.oaId === "oa7")?.estadoVisual, "dominado");
  // oa8 ya tenía 1 error + 1 reintento inmediato (no reparado) -> desbloqueado (`disponible: true`) en estado `incierto`.
  assert.equal(mapaDia2.json.nodos.find((n: any) => n.oaId === "oa8")?.disponible, true);
  assert.equal(mapaDia2.json.nodos.find((n: any) => n.oaId === "oa8")?.estadoVisual, "incierto");
  assert.equal(mapaDia2.json.nodos.find((n: any) => n.oaId === "oa10")?.estadoVisual, "listo");
  marcar("E5 K6 en días diferentes (D1), anti auto-reparación inmediata y desbloqueo de fronteras");

  // ── 6. Ciclo E2 completo (normal -> extra -> reprobado -> continuations -> reapertura D2 -> aprobado) ──
  const procRes = await api("POST", "/api/vortice/evaluaciones/ficticio-e2/proceso", cEst);
  assert.equal(procRes.status, 200);
  assert.equal(procRes.json.perfil, "regular");
  assert.equal(procRes.json.duracionMin, 60);
  const procesoId = procRes.json.procesoId as string;
  const instanciaId = procRes.json.instanciaId as string;

  const responderIntentoHttp = async (intentoId: string, acertar: boolean) => {
    const pRes = await api("GET", `/api/vortice/evaluaciones/intentos/${intentoId}/preguntas`, cEst);
    assert.equal(pRes.status, 200);
    assert.ok(pRes.json.length === 15);
    assert.ok(!/correct/i.test(JSON.stringify(pRes.json)), "Las preguntas de E2 nunca filtran clave correcta");
    for (const q of pRes.json) {
      const corr = claveEval[q.preguntaVersionId];
      const opcionId = acertar ? corr : ["A", "B", "C", "D"].find((o) => o !== corr)!;
      const rResp = await api("POST", `/api/vortice/evaluaciones/intentos/${intentoId}/responder`, cEst, {
        preguntaVersionId: q.preguntaVersionId,
        opcionId,
      });
      assert.equal(rResp.status, 200);
      assert.equal("correcta" in rResp.json, false, "Responder no revela correctitud antes de enviar");
    }
    const env = await api("POST", `/api/vortice/evaluaciones/intentos/${intentoId}/enviar`, cEst, {});
    assert.equal(env.status, 200);
    return env.json;
  };

  // Normal reprobado
  const norm = await api("POST", `/api/vortice/evaluaciones/instancias/${instanciaId}/intentos`, cEst, { tipo: "normal" });
  assert.equal(norm.status, 200);
  const envNorm = await responderIntentoHttp(norm.json.intentoId, false);
  assert.equal(envNorm.aprobado, false);

  // Extra reprobado
  const ext = await api("POST", `/api/vortice/evaluaciones/instancias/${instanciaId}/intentos`, cEst, { tipo: "extra" });
  assert.equal(ext.status, 200);
  const envExt = await responderIntentoHttp(ext.json.intentoId, false);
  assert.equal(envExt.aprobado, false);

  // Cerrar proceso -> reprobado + progression_continuations
  const cierre1 = await api("POST", `/api/vortice/evaluaciones/procesos/${procesoId}/cerrar`, cEst);
  assert.equal(cierre1.status, 200);
  assert.equal(cierre1.json.estado, "reprobado");
  assert.equal(cierre1.json.moduloSiguiente, true);

  const conts = await api("GET", "/api/vortice/continuaciones", cEst);
  assert.equal(conts.status, 200);
  assert.equal(conts.json.length, 1);
  assert.equal(conts.json[0].targetWeekNumber, 2);
  assert.ok(conts.json[0].pendingItems.length > 0);

  // Admin lista procesos, autoriza reapertura (D2) y se bloquea una segunda reapertura.
  const admProcs = await api("GET", "/api/admin/vortice/evaluaciones/procesos", cAdm);
  assert.equal(admProcs.status, 200);
  assert.ok(admProcs.json.some((p: any) => p.procesoId === procesoId && p.status === "reprobado"));

  const reap = await api("POST", `/api/admin/vortice/evaluaciones/procesos/${procesoId}/reabrir`, cAdm, {
    estudianteId: "ficticio-estudiante",
    motivo: "Interrupción eléctrica comprobada durante el intento extra del piloto adulto.",
  });
  assert.equal(reap.status, 200);
  assert.equal(reap.json.duracionMin, 60);
  assert.equal(reap.json.umbral, 70);

  const reap2 = await api("POST", `/api/admin/vortice/evaluaciones/procesos/${procesoId}/reabrir`, cAdm, {
    estudianteId: "ficticio-estudiante",
    motivo: "Segunda reapertura que debe ser rechazada por política D2.",
  });
  assert.equal(reap2.status, 409);

  // Estudiante rinde el intento único de la instancia reabierta y aprueba.
  const estReap = await api("GET", "/api/vortice/evaluaciones/ficticio-e2/estado", cEst);
  assert.equal(estReap.status, 200);
  assert.equal(estReap.json.proceso.instanciaId, reap.json.nuevaInstanciaId);
  const intReap = await api("POST", `/api/vortice/evaluaciones/instancias/${reap.json.nuevaInstanciaId}/intentos`, cEst, { tipo: "normal" });
  assert.equal(intReap.status, 200);
  const envReap = await responderIntentoHttp(intReap.json.intentoId, true);
  assert.equal(envReap.aprobado, true);
  const cierre2 = await api("POST", `/api/vortice/evaluaciones/procesos/${procesoId}/cerrar`, cEst);
  assert.equal(cierre2.status, 200);
  assert.equal(cierre2.json.estado, "aprobado");
  marcar("E6 Ciclo E2 completo (normal, extra, continuations, reapertura auditable D2 y aprobación)");

  // ── 7. Inicio unificado, Brújula, Familia, Alertas y Tutoría ──
  const ov = await api("GET", "/api/vortice/overview", cEst);
  assert.equal(ov.status, 200);
  const matOv = ov.json.subjects.find((s: any) => s.levelSubjectId === "5b-matematica");
  const lenOv = ov.json.subjects.find((s: any) => s.levelSubjectId === "5b-lenguaje");
  assert.equal(matOv?.deliveryMode, "aula_universal");
  assert.equal(lenOv?.deliveryMode, "legacy");
  assert.deepEqual(matOv?.aulaProgreso, { logradas: 1, total: 5 });
  assert.ok((matOv?.requiereBase?.length ?? 0) > 0, "Inicio debe exponer requiereBase desde progression_continuations");

  const hoyIso = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const diaSem = ((new Date(`${hoyIso}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
  const bloq = await api("POST", "/api/vortice/brujula/bloques", cEst, {
    bloques: [
      {
        id: "b1",
        fecha: hoyIso,
        diaSemana: diaSem,
        franja: "tarde",
        duracionMin: 45,
        levelSubjectId: "5b-matematica",
        subjectName: "<script>alert(1)</script>",
        objectiveId: "lo-5b-m1",
        objectiveCode: "FAKE",
        objectiveTitle: "FAKE",
        completado: false,
      },
    ],
  });
  assert.equal(bloq.status, 200);
  assert.equal(bloq.json.bloques[0].subjectName, "Matemática", "Brújula debe sanitizar nombre de asignatura desde BD");
  assert.equal(bloq.json.bloques[0].objectiveCode, "M1", "Brújula debe sanitizar código de objetivo desde BD");

  const casoNuevo = await api("POST", "/api/vortice/ayuda", cEst, {
    learningObjectiveId: "lo-5b-m1",
    pregunta: "Tengo una consulta sobre equivalencia de fracciones en OA7.",
  });
  assert.equal(casoNuevo.status, 201);
  const casoId = casoNuevo.json.id as string;

  const bandeja = await api("GET", "/api/tutoria/bandeja", cTut);
  assert.equal(bandeja.status, 200);
  const todosCasos = [...(bandeja.json.sinAsignar ?? []), ...(bandeja.json.mios ?? [])];
  assert.ok(todosCasos.some((c: any) => c.id === casoId));
  assert.equal((await api("POST", `/api/tutoria/casos/${casoId}/tomar`, cTut)).status, 200);
  assert.equal((await api("POST", `/api/tutoria/casos/${casoId}/responder`, cTut, { respuesta: "Revisemos el ejemplo paso a paso de OA7." })).status, 200);

  const atencion = await api("GET", "/api/tutoria/atencion", cTut);
  assert.equal(atencion.status, 200);
  assert.ok(Array.isArray(atencion.json));
  const alertaEst = atencion.json.find((e: any) => e.studentId === "ficticio-estudiante");
  assert.equal(alertaEst, undefined, "Estudiante activo en Aula/Práctica/E2 no debe aparecer como inactivo en Alertas");

  const famList = await api("GET", "/api/familia/estudiantes", cApo);
  assert.equal(famList.status, 200);
  assert.equal(famList.json.length, 1);

  const famRes = await api("GET", "/api/familia/estudiantes/ficticio-estudiante/resumen", cApo);
  assert.equal(famRes.status, 200);
  assert.ok(famRes.json.studyDays >= 1);
  assert.equal(famRes.json.acompanamiento.leccionesLogradas, 1);
  assert.equal(famRes.json.acompanamiento.estadoCualitativo, "avanzando");
  const famRaw = JSON.stringify(famRes.json);
  assert.ok(!famRaw.includes("scorePct") && !famRaw.includes("totalCorrect") && !famRaw.includes("respuestaCorrecta"), "Familia no debe filtrar puntajes ni claves E2");

  const admPerfiles = await api("GET", "/api/admin/evaluation-profiles", cAdm);
  assert.equal(admPerfiles.status, 200);
  const admVinculos = await api("GET", "/api/admin/familia/vinculos", cAdm);
  assert.equal(admVinculos.status, 200);
  assert.ok(admVinculos.json.length >= 1);
  marcar("E7 Inicio unificado, Brújula sanitizada, Tutoría/Alertas, Familia sin filtraciones y Admin");
} finally {
  if (server) await new Promise<void>((r) => server!.close(() => r()));
  client.close();
  fs.rmSync(dir, { recursive: true, force: true });
}

for (const linea of resultadosEscenarios) console.log(`  ${linea}`);
console.log(`piloto-adulto-e2e: ok (${resultadosEscenarios.length} escenarios)`);
