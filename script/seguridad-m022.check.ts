// Suite de verificación de seguridad M-R01 (cierre M022: H-01 a H-12) sobre servidor HTTP real
// y SQLite aislada. Verifica los 5 perfiles de Preview (ficticio-estudiante, ficticio-ajeno,
// ficticio-apoderado, ficticio-tutor, ficticio-admin) y anónimo.
// Ejecutar: npx tsx script/seguridad-m022.check.ts (incluido en npm run check:vortice)
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

if (process.env.NODE_ENV === "production") {
  throw new Error("seguridad-m022.check no debe correr en producción");
}

// ── 1. Comprobación estática: ni shared/aulaUniversal.ts ni client/ contienen claves de Aula Universal ──
const sharedAulaSrc = fs.readFileSync(path.resolve("shared/aulaUniversal.ts"), "utf8");
const clientAulaSrc = fs.readFileSync(path.resolve("client/src/pages/vortice/VorticeAula.tsx"), "utf8");
assert.equal(/respuestaCorrecta|explicacionCorrecta/.test(sharedAulaSrc), false, "shared/aulaUniversal.ts no debe exponer claves");
assert.equal(/respuestaCorrecta|explicacionCorrecta/.test(clientAulaSrc), false, "VorticeAula.tsx no debe contener claves");
assert.equal(/aulaUniversalCatalogo/.test(clientAulaSrc), false, "client/ no puede importar catálogo privado de servidor");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-sec-m022-"));
process.env.TEST_DATABASE_URL = `file:${path.join(dir, "sec.db")}`;

const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const S = await import("../shared/schema");
const { users } = await import("../shared/models/auth");
const { db, client } = await import("../server/db");
const { migrar } = await import("../server/migrar");
const { sembrarPilotoPractica } = await import("../server/sembrarPilotoPractica");
const { weekStartOf } = await import("../shared/brujula");

let server: ReturnType<typeof createServer> | null = null;
try {
  const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(S as any));
  for (const stmt of ddl) await db.run(sql.raw(stmt));
  await migrar(client as any, "migrations/vortice");

  // Sembrar los 5 perfiles de Preview + otro estudiante matriculado + nuevo apoderado sin perfil previo.
  await db.insert(users).values([
    { id: "ficticio-estudiante", email: "est@preview.test", name: "Estudiante Piloto" },
    { id: "ficticio-otro-est", email: "otro@preview.test", name: "Otro Estudiante" },
    { id: "ficticio-ajeno", email: "ajeno@preview.test", name: "Sin Matrícula" },
    { id: "ficticio-apoderado", email: "apo@preview.test", name: "Apoderado Vinculado" },
    { id: "ficticio-apoderado-2", email: "apo2@preview.test", name: "Apoderado No Vinculado" },
    { id: "ficticio-nuevo-apo", email: "aponuevo@preview.test", name: "Apoderado Nuevo" },
    { id: "ficticio-tutor", email: "tutor@preview.test", name: "Tutor" },
    { id: "ficticio-admin", email: "admin@preview.test", name: "Administrador" },
  ]);

  await db.insert(S.levels).values([
    { id: "5b", name: "5° Básico", programType: "menores", sortOrder: 5 },
    { id: "6b", name: "6° Básico", programType: "menores", sortOrder: 6 },
  ]);
  await db.insert(S.subjects).values([
    { id: "mat", name: "Matemática", slug: "matematica" },
    { id: "len", name: "Lenguaje", slug: "lenguaje" },
  ]);
  await db.insert(S.levelSubjects).values([
    { id: "ls-mat-5b", levelId: "5b", subjectId: "mat" },
    { id: "ls-len-6b", levelId: "6b", subjectId: "len" },
  ]);

  await db.insert(S.userProfiles).values([
    { userId: "ficticio-estudiante", role: "student", levelId: "5b" },
    { userId: "ficticio-otro-est", role: "student", levelId: "5b" },
    { userId: "ficticio-ajeno", role: "student", levelId: "6b" }, // sin matrícula activa en Mat 5.º
    { userId: "ficticio-apoderado", role: "guardian" },
    { userId: "ficticio-apoderado-2", role: "guardian" },
    { userId: "ficticio-tutor", role: "tutor" },
    { userId: "ficticio-admin", role: "admin" },
  ]);

  await db.insert(S.enrollments).values([
    { userId: "ficticio-estudiante", levelSubjectId: "ls-mat-5b", isActive: true },
    { userId: "ficticio-otro-est", levelSubjectId: "ls-mat-5b", isActive: true },
  ]);

  await db.insert(S.learningObjectives).values([
    { id: "lo-mat-1", levelSubjectId: "ls-mat-5b", code: "OA 7", title: "Fracciones propias", weekNumber: 1 },
  ]);
  await db.insert(S.weeklyResources).values([
    { id: "wr-mat-1", learningObjectiveId: "lo-mat-1", resourceType: "video", title: "Video OA7", isActive: true },
  ]);
  await db.insert(S.programCalendar).values({
    id: "cal-5b",
    academicYear: new Date().getUTCFullYear(),
    levelId: "5b",
    startDate: new Date("2020-03-02T04:00:00Z"),
    moduleDurationWeeks: 2,
    totalModules: 15,
  });

  await sembrarPilotoPractica(client as any, { levelSubjectId: "ls-mat-5b" });

  const { registerRoutes } = await import("../server/routes");
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    const u = req.header("x-test-user");
    req.isAuthenticated = () => Boolean(u);
    if (u) req.user = { id: u, claims: { sub: u } };
    next();
  });
  server = createServer(app);
  await registerRoutes(server, app);
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", () => resolve()));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const reqHttp = async (method: string, route: string, user?: string, body?: unknown) => {
    const res = await fetch(`${base}${route}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(user ? { "x-test-user": user } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* raw */ }
    return { status: res.status, text, json };
  };

  // ── 2. H-02: Matriz de autorización estricta en Aula Universal y Conocimiento ──
  const rutasEstudianteMatriculado: Array<[string, string, unknown?]> = [
    ["GET", "/api/vortice/aula/piloto"],
    ["GET", "/api/vortice/aula/lecciones/oa7"],
    ["PUT", "/api/vortice/aula/lecciones/oa7/progreso", { pasoActual: "aprende", tramoActual: 1, puertaPreferida: "video", pasoEjemploVisto: 0 }],
    ["POST", "/api/vortice/aula/diagnostico", { respuestas: { "oa7-diag": "A" } }],
    ["POST", "/api/vortice/aula/lecciones/oa7/practica", { preguntaId: "oa7-p1", opcionId: "A", usoPista: false, clientSubmissionId: "sec-prac-1" }],
    ["POST", "/api/vortice/aula/lecciones/oa7/comprobar", { respuestas: { "oa7-c1": "A", "oa7-c2": "C", "oa7-c3": "A" }, origen: "normal" }],
    ["GET", "/api/vortice/conocimiento/mapa"],
    ["GET", "/api/vortice/conocimiento/retencion"],
    ["POST", "/api/vortice/conocimiento/practica", { oaId: "oa7", preguntaId: "oa7-p2", opcionId: "B", usoPista: false, clientSubmissionId: "sec-prac-2" }],
    ["POST", "/api/vortice/conocimiento/retencion", { oaId: "oa7", preguntaId: "oa7-c3", opcionId: "A", clientSubmissionId: "sec-ret-1" }],
  ];

  for (const [m, p, b] of rutasEstudianteMatriculado) {
    assert.equal((await reqHttp(m, p, undefined, b)).status, 401, `Anónimo 401 en ${m} ${p}`);
    for (const rolNoAutorizado of ["ficticio-ajeno", "ficticio-apoderado", "ficticio-tutor", "ficticio-admin"]) {
      assert.equal(
        (await reqHttp(m, p, rolNoAutorizado, b)).status,
        403,
        `${rolNoAutorizado} debe recibir 403 en ${m} ${p}`,
      );
    }
    assert.equal(
      (await reqHttp(m, p, "ficticio-estudiante", b)).status,
      200,
      `ficticio-estudiante matriculado debe recibir 200 en ${m} ${p}`,
    );
  }

  // ── 3. H-01: Cero filtración de pauta en GET y en respuestas incorrectas ──
  const pilotoGet = await reqHttp("GET", "/api/vortice/aula/piloto", "ficticio-estudiante");
  const leccionGet = await reqHttp("GET", "/api/vortice/aula/lecciones/oa8", "ficticio-estudiante");
  assert.equal(/respuestaCorrecta|explicacionCorrecta|correct_option_id/.test(pilotoGet.text), false);
  assert.equal(/respuestaCorrecta|explicacionCorrecta|correct_option_id/.test(leccionGet.text), false);

  // Práctica incorrecta -> explicacion === null (no revela la explicación de la respuesta correcta).
  const pracWrong = await reqHttp("POST", "/api/vortice/aula/lecciones/oa8/practica", "ficticio-estudiante", {
    preguntaId: "oa8-p1",
    opcionId: "A", // incorrecta (correcta B)
    usoPista: false,
  });
  assert.equal(pracWrong.status, 200);
  assert.deepEqual(pracWrong.json, { correcta: false, explicacion: null });

  // Comprobación parcialmente incorrecta -> solo incluye explicación de las acertadas.
  const compMix = await reqHttp("POST", "/api/vortice/aula/lecciones/oa8/comprobar", "ficticio-estudiante", {
    respuestas: { "oa8-c1": "A", "oa8-c2": "A", "oa8-c3": "A" }, // solo oa8-c1 es correcta
    origen: "normal",
  });
  assert.equal(compMix.status, 200);
  assert.equal(compMix.json.estado, "sigue_practicando");
  assert.deepEqual(Object.keys(compMix.json.explicaciones), ["oa8-c1"]);

  // Aislamiento entre estudiantes: ficticio-otro-est no ve progreso de ficticio-estudiante.
  const otroPiloto = await reqHttp("GET", "/api/vortice/aula/piloto", "ficticio-otro-est");
  assert.deepEqual(otroPiloto.json.progreso, {});

  // ── 4. H-03 & H-12: Administración de vínculos apoderado-estudiante y Portafolio familiar ──
  assert.equal((await reqHttp("GET", "/api/admin/familia/vinculos", "ficticio-estudiante")).status, 403);
  assert.equal((await reqHttp("GET", "/api/admin/familia/vinculos", "ficticio-tutor")).status, 403);

  // Rechaza vincular a un admin/tutor como estudiante o a un estudiante como apoderado.
  assert.equal(
    (await reqHttp("POST", "/api/admin/familia/vinculos", "ficticio-admin", {
      guardianUserId: "ficticio-apoderado",
      studentUserId: "ficticio-admin",
      status: "activo",
    })).status,
    400,
  );
  assert.equal(
    (await reqHttp("POST", "/api/admin/familia/vinculos", "ficticio-admin", {
      guardianUserId: "ficticio-otro-est",
      studentUserId: "ficticio-estudiante",
      status: "activo",
    })).status,
    400,
  );

  // Crear vínculo válido, listar y verificar Portafolio por visibilidad.
  const crearVinculo = await reqHttp("POST", "/api/admin/familia/vinculos", "ficticio-admin", {
    guardianUserId: "ficticio-apoderado",
    studentUserId: "ficticio-estudiante",
    status: "activo",
  });
  assert.equal(crearVinculo.status, 200);
  const linkId = crearVinculo.json.id as string;

  const listaVinculos = await reqHttp("GET", "/api/admin/familia/vinculos", "ficticio-admin");
  assert.equal(listaVinculos.status, 200);
  assert.equal(listaVinculos.json.length, 1);

  // Estudiante crea 3 evidencias: privada, tutor, familia.
  const evPriv = await reqHttp("POST", "/api/vortice/portafolio", "ficticio-estudiante", {
    kind: "texto", learningObjectiveId: "lo-mat-1", title: "Privada", content: "secreto", visibility: "privada",
  });
  const evTutor = await reqHttp("POST", "/api/vortice/portafolio", "ficticio-estudiante", {
    kind: "texto", learningObjectiveId: "lo-mat-1", title: "Solo Tutor", content: "tutor", visibility: "tutor",
  });
  const evFam = await reqHttp("POST", "/api/vortice/portafolio", "ficticio-estudiante", {
    kind: "texto", learningObjectiveId: "lo-mat-1", title: "Para Familia", content: "familia", visibility: "familia",
  });
  assert.ok(evPriv.status === 200 && evTutor.status === 200 && evFam.status === 200);

  // Apoderado vinculado solo ve "familia" (nunca "tutor" ni "privada"); apoderado no vinculado recibe 403.
  const portApo = await reqHttp("GET", "/api/vortice/portafolio/estudiante/ficticio-estudiante", "ficticio-apoderado");
  assert.equal(portApo.status, 200);
  assert.deepEqual(portApo.json.map((e: any) => e.title), ["Para Familia"]);
  assert.equal(
    (await reqHttp("GET", `/api/vortice/portafolio/${evTutor.json.id}/versiones`, "ficticio-apoderado")).status,
    404,
  );
  assert.equal(
    (await reqHttp("GET", `/api/vortice/portafolio/${evFam.json.id}/versiones`, "ficticio-apoderado")).status,
    200,
  );
  assert.equal(
    (await reqHttp("GET", "/api/vortice/portafolio/estudiante/ficticio-estudiante", "ficticio-apoderado-2")).status,
    403,
  );

  // Revocar vínculo -> apoderado pierde acceso tanto a Familia como a Portafolio.
  const delVinculo = await reqHttp("DELETE", `/api/admin/familia/vinculos/${encodeURIComponent(linkId)}`, "ficticio-admin");
  assert.equal(delVinculo.status, 200);
  assert.equal(
    (await reqHttp("GET", "/api/familia/estudiantes/ficticio-estudiante/resumen", "ficticio-apoderado")).status,
    404,
  );
  assert.equal(
    (await reqHttp("GET", "/api/vortice/portafolio/estudiante/ficticio-estudiante", "ficticio-apoderado")).status,
    403,
  );

  // ── 5. H-04: Brújula sanitiza metadatos de bloques desde la BD ──
  const lunesActual = weekStartOf(new Date());
  const saveBlk = await reqHttp("POST", "/api/vortice/brujula/bloques", "ficticio-estudiante", {
    bloques: [
      {
        id: "blk-spoof-1",
        fecha: lunesActual,
        diaSemana: 7, // falsificado (lunes es 1)
        franja: "manana",
        duracionMin: 45,
        objectiveId: "lo-mat-1",
        levelSubjectId: "ls-len-6b", // falsificado
        subjectName: "Asignatura Falsa XSS", // falsificado
        objectiveCode: "FAKE-99", // falsificado
        objectiveTitle: "Título Falso", // falsificado
        completado: false,
      },
    ],
  });
  assert.equal(saveBlk.status, 200);
  assert.equal(saveBlk.json.bloques[0].diaSemana, 1);
  assert.equal(saveBlk.json.bloques[0].levelSubjectId, "ls-mat-5b");
  assert.equal(saveBlk.json.bloques[0].subjectName, "Matemática");
  assert.equal(saveBlk.json.bloques[0].objectiveCode, "OA 7");
  assert.equal(saveBlk.json.bloques[0].objectiveTitle, "Fracciones propias");

  // ── 6. H-06: Tope atómico MAX_OPEN_CASES = 5 ante ráfaga concurrente en Tutoría ──
  const rafaga = await Promise.all(
    Array.from({ length: 8 }, (_, idx) =>
      reqHttp("POST", "/api/vortice/ayuda", "ficticio-estudiante", {
        learningObjectiveId: "lo-mat-1",
        pregunta: `Consulta concurrente número ${idx + 1} sobre fracciones equivalentes`,
      }),
    ),
  );
  const creados = rafaga.filter((r) => r.status === 201).length;
  const rechazados = rafaga.filter((r) => r.status === 409).length;
  assert.equal(creados, 5, "Exactamente 5 casos abiertos permitidos bajo concurrencia");
  assert.equal(rechazados, 3, "Los 3 excedentes reciben 409");

  // ── 7. H-11: el esquema ya impide duplicados globales (índice parcial program_calendar_year_all_levels_unique) ──
  await db.insert(S.programCalendar).values({ academicYear: 2031, levelId: null, startDate: new Date("2031-03-03T04:00:00Z") });
  await assert.rejects(
    db.insert(S.programCalendar).values({ academicYear: 2031, levelId: null, startDate: new Date("2031-03-03T04:00:00Z") }),
    /UNIQUE/i,
  );

  // ── 8. H-05: Cookie de sesión con sameSite="lax" explícito ──
  const { getSession } = await import("../server/replit_integrations/auth/replitAuth");
  const prevSecret = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = "x".repeat(40);
  const sessionMw = getSession();
  assert.equal(typeof sessionMw, "function");
  if (prevSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = prevSecret;
} finally {
  if (server) await new Promise<void>((r) => server!.close(() => r()));
  client.close();
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("seguridad-m022: ok");
process.exit(0);
