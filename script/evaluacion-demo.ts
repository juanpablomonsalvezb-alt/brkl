// Demo local de revisión en pantalla (Tarea 7): tarjeta de precios, Vórtice + Brújula parte 2,
// Portal Familia (/familia) y pantalla de Evaluación del módulo E2 (regular / neurodivergente).
// NO es un check: no corre en npm run check:vortice. Nunca toca una base real.
// Uso: npx tsx script/evaluacion-demo.ts
import fs from "node:fs"; import path from "node:path";
import express from "express";
import { createServer as createVite } from "vite";
import type { InArgs } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import viteConfig from "../vite.config";
import * as schema from "../shared/schema";
import {
  diagnosticoRespuestasSchema,
  evaluarDiagnosticoCero,
  obtenerLeccionPorOa,
  obtenerLeccionesPiloto,
} from "../shared/aulaUniversal";
import {
  getProgresoLeccion,
  getProgresoLecciones,
  registrarComprobacionProceso,
  saveProgresoLeccion,
} from "../server/aulaUniversal";
import {
  listarClasificacionEvaluaciones,
  listarPerfilesEvaluacion,
  setFuncionEvaluacion,
  setPerfilEvaluacion,
} from "../server/perfilEvaluacion";
import {
  cargarMapaConocimiento,
  DOMINIO_PILOTO_PRACTICA_ID,
  registrarComprobacionEnMotorSombra,
  registrarPracticaEnMotor,
} from "../server/mapaConocimiento";
import { PracticaError } from "../server/practica";
import { sembrarPilotoPractica } from "../server/sembrarPilotoPractica";
import { registrarPracticaInputSchema } from "../shared/mapaConocimiento";
import { migrar } from "../server/migrar";
import { baseArchivo } from "./lib/basePrueba";
import { aplicarEsquemaHeredado, sembrarFicticios } from "./lib/esquemaHeredado";
import { sembrarEvaluacionPiloto } from "./lib/sembrarEvaluacionPiloto";
import { abrirProceso } from "../server/evaluacion";
import { registrarRutasEvaluacion } from "../server/evaluacionRoutes";
import { buildOverview, type OverviewSubjectInput } from "../shared/vortice";
import {
  planificarBloquesSemana,
  PREFERENCIAS_BRUJULA_DEFECTO,
  preferenciasBrujulaSchema,
  proposeWeeklyPlan,
  toggleBloqueSchema,
  weekStartOf,
  type PreferenciasBrujula,
} from "../shared/brujula";
import { calcularPanel, resumenBrujulaParaApoderado } from "../shared/brujulaPanel";

if (process.env.NODE_ENV === "production") throw new Error("la demo no corre en producción");

const b = baseArchivo(); const c = b.client; const demoDb = drizzle(c, { schema });
const x = (s: string, a: InArgs = []) => c.execute({ sql: s, args: a });
await aplicarEsquemaHeredado(c); await sembrarFicticios(c); await migrar(c, "migrations/vortice");
await x("INSERT INTO users (id, email, name) VALUES ('est-reg', 'est-reg@ficticio.test', 'Ana (Regular)'), ('est-neuro', 'est-neuro@ficticio.test', 'Mateo (Neurodivergente)'), ('admin-demo', 'admin@ficticio.test', 'Coordinación Demo')");
await x("INSERT INTO user_profiles (id, user_id, role, level_id, evaluation_profile) VALUES ('up-adm', 'admin-demo', 'admin', NULL, 'regular'), ('up-reg', 'est-reg', 'student', '5b', 'regular'), ('up-neuro', 'est-neuro', 'student', '5b', 'neurodivergente')");
await x("INSERT INTO module_evaluations (id, learning_objective_id, evaluation_number, evaluation_function, title, release_day, release_week, passing_score) VALUES ('me-diag', 'lo-mat', 0, 'diagnostico', 'Diagnóstico inicial · Fracciones y decimales', 1, 1, 70), ('me-p1', 'lo-mat', 1, 'proceso', 'Proceso 1 · Fracciones propias', 3, 1, 70), ('me-e2', 'lo-mat', 4, 'modulo', 'Fracciones y decimales · Matemática 5.º', 5, 2, 70), ('me-leg', 'lo-len', 2, NULL, 'Evaluación heredada P7 · Lectura', 5, 1, 60)");
const clave = await sembrarEvaluacionPiloto(x, { levelSubjectId: "ls-mat-5b", evaluacionId: "me-e2", versionId: "ev-demo", oaCurricularId: "oa1" });
await sembrarPilotoPractica(c, { levelSubjectId: "ls-mat-5b" });
await abrirProceso(c, { estudianteId: "est-neuro", evaluacionId: "me-e2", versionId: "ev-demo", perfil: "neurodivergente" });

const app = express(); app.use(express.json());
const cookie = (r: express.Request) => /(?:^|; )demo=([\w-]+)/.exec(r.headers.cookie ?? "")?.[1];
registrarRutasEvaluacion(app, { client: c, userId: cookie, esAdmin: async () => false, acceso: async () => ({ ok: true as const }) });

// Aula Universal UDL (Bloque A) usando el estudiante activo en cookie (por defecto est-reg).
const demoStudentId = (r: express.Request) => cookie(r) ?? "est-reg";
app.get("/api/vortice/aula/piloto", async (req, res) => {
  res.json({ lecciones: obtenerLeccionesPiloto(), progreso: await getProgresoLecciones(demoDb, demoStudentId(req)) });
});
app.get("/api/vortice/aula/lecciones/:oaId", async (req, res) => {
  const oaId = String(req.params.oaId);
  const leccion = obtenerLeccionPorOa(oaId);
  if (!leccion) return res.status(404).json({ message: "Lección no encontrada" });
  res.json({ leccion, progreso: await getProgresoLeccion(demoDb, demoStudentId(req), oaId) });
});
app.put("/api/vortice/aula/lecciones/:oaId/progreso", async (req, res) => {
  const r = await saveProgresoLeccion(demoDb, {
    userId: demoStudentId(req),
    oaId: String(req.params.oaId),
    body: req.body,
    now: new Date(),
  });
  if (!r.ok) return res.status(r.status).json({ message: r.reason });
  res.json(r.value);
});
app.post("/api/vortice/aula/diagnostico", (req, res) => {
  const parsed = diagnosticoRespuestasSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Respuestas de diagnóstico inválidas" });
  res.json(evaluarDiagnosticoCero(parsed.data.respuestas));
});
app.post("/api/vortice/aula/lecciones/:oaId/comprobar", async (req, res) => {
  const userId = demoStudentId(req);
  const r = await registrarComprobacionProceso(demoDb, {
    userId,
    oaId: String(req.params.oaId),
    body: req.body,
    now: new Date(),
  });
  if (!r.ok) return res.status(r.status).json({ message: r.reason });
  await registrarComprobacionEnMotorSombra(c, {
    estudianteId: userId,
    oaId: String(req.params.oaId),
    respuestas: req.body?.respuestas ?? {},
  });
  res.json(r.value);
});

// Motor en sombra M2 + Mapa «Mis conocimientos» M3.
app.get("/api/vortice/conocimiento/mapa", async (req, res) => {
  const dominio = typeof req.query.dominio === "string" && req.query.dominio.trim()
    ? req.query.dominio.trim()
    : DOMINIO_PILOTO_PRACTICA_ID;
  res.json(await cargarMapaConocimiento(c, { estudianteId: demoStudentId(req), dominioId: dominio }));
});
app.post("/api/vortice/conocimiento/practica", async (req, res) => {
  const parsed = registrarPracticaInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Práctica inválida" });
  try {
    res.json(await registrarPracticaEnMotor(c, { estudianteId: demoStudentId(req), ...parsed.data }));
  } catch (e) {
    if (e instanceof PracticaError) {
      const status = e.codigo === "conflicto_idempotencia" ? 409 : 400;
      return res.status(status).json({ message: e.message });
    }
    throw e;
  }
});

// Panel Admin T39 (Bloque B) en demo local con cuenta admin-demo ficticia.
app.get("/api/admin/evaluation-profiles", async (_req, res) => {
  const r = await listarPerfilesEvaluacion(demoDb, "admin-demo");
  if (!r.ok) return res.status(r.status).json({ message: r.reason });
  res.json(r.value);
});
app.put("/api/admin/students/:userId/evaluation-profile", async (req, res) => {
  const r = await setPerfilEvaluacion(demoDb, {
    adminUserId: "admin-demo",
    studentUserId: String(req.params.userId),
    body: req.body,
    now: new Date(),
  });
  if (!r.ok) return res.status(r.status).json({ message: r.reason });
  res.json(r.value);
});
app.get("/api/admin/evaluations/classification", async (_req, res) => {
  const r = await listarClasificacionEvaluaciones(demoDb, "admin-demo");
  if (!r.ok) return res.status(r.status).json({ message: r.reason });
  res.json(r.value);
});
app.patch("/api/admin/evaluations/:id/function", async (req, res) => {
  const r = await setFuncionEvaluacion(demoDb, {
    adminUserId: "admin-demo",
    evaluationId: String(req.params.id),
    body: req.body,
  });
  if (!r.ok) return res.status(r.status).json({ message: r.reason });
  res.json(r.value);
});
app.get("/demo/entrar", (req, res) => { const u = req.query.u === "est-neuro" ? "est-neuro" : "est-reg"; res.cookie("demo", u, { path: "/" }); res.redirect("/vortice/evaluacion/me-e2"); });
// Solo demo: acorta el tiempo del intento activo y entrega la clave, para ver el vencimiento y el extra.
app.get("/demo/vencer", async (req, res) => { await x("UPDATE evaluation_attempts SET expires_at = unixepoch('subsec') + ? WHERE status = 'activo' AND student_id = ?", [Number(req.query.seg ?? 5), cookie(req) ?? ""]); res.json({ ok: true }); });
app.get("/demo/clave", (_req, res) => res.json(clave));

// Datos de ejemplo reales en memoria para /vortice (Brújula 1 y 2) y /familia.
const dia = (n: number) => new Date(Date.UTC(2026, 2, 1) + n * 86_400_000);
const fechasDemo = (_l: string, m: number) => {
  const i = (m - 1) * 14;
  return { inicio: dia(i), fin: dia(i + 13), evaluaciones: { 1: dia(i + 2), 2: dia(i + 4), 3: dia(i + 9), 4: dia(i + 11) } as any };
};
const oaDemo = (id: string, w: number, rs: string[], ev: [string, number][] = []) => ({
  id, code: "OA " + id.toUpperCase(), title: "Módulo " + id.toUpperCase(), weekNumber: w, sortOrder: 0,
  resources: rs.map((r) => ({ id: r, title: `Recurso ${r}`, resourceType: "video", sortOrder: 0 })),
  evaluations: ev.map(([e, n]) => ({ id: e, title: "Evaluación del módulo", evaluationNumber: n, available: true })),
});
const asigDemo = (id: string, name: string, objs: OverviewSubjectInput["objectives"]): OverviewSubjectInput => ({
  levelSubjectId: id, subjectName: name, subjectSlug: id, objectives: objs,
});
const subjectsDemo: OverviewSubjectInput[] = [
  asigDemo("mat", "Matemática", [oaDemo("m1", 1, ["a1", "a2"], [["ea", 4]]), oaDemo("m2", 2, ["b1", "b2"], [["eb", 4]]), oaDemo("m3", 3, ["c1", "c2"], [["ec", 4]])]),
  asigDemo("len", "Lenguaje", [oaDemo("l1", 1, ["l1", "l2"], [["el", 4]]), oaDemo("l2", 2, ["lx"], [])]),
  asigDemo("cie", "Ciencias", [oaDemo("c1", 1, ["m1", "m2"], [])]),
];
const completedDemo = new Set(["a1", "a2", "b1", "c1", "l1", "l2", "m1", "m2"]);
const passedDemo = new Set(["ea", "el"]);
const overviewDemo = buildOverview({ id: "5b", name: "5° Básico" }, subjectsDemo, completedDemo, passedDemo);

let prefsDemo: PreferenciasBrujula = { ...PREFERENCIAS_BRUJULA_DEFECTO };
const weekStartDemo = weekStartOf(dia(36));
const completadosBloqueDemo = new Set<string>();
const bloquesDemo = () => {
  const propuesta = proposeWeeklyPlan(overviewDemo, prefsDemo.intensidad);
  return planificarBloquesSemana({
    weekStart: weekStartDemo,
    goals: propuesta.goals,
    preferencias: prefsDemo,
    completadosIds: completadosBloqueDemo,
  });
};
const panelDe = (diasOffset = 36) => calcularPanel({
  now: dia(diasOffset),
  fechas: fechasDemo,
  completed: completedDemo,
  passed: passedDemo,
  subjects: subjectsDemo,
});

app.get("/api/auth/user", (_req, res) => res.json({ firstName: "Ana", name: "Ana" }));
app.get("/api/vortice/overview", (_req, res) => res.json({ ...overviewDemo, evaluacionE2: true }));
app.get("/api/vortice/repaso", (_req, res) => res.json({ domains: [] }));
app.get("/api/vortice/portafolio", (_req, res) => res.json([]));
app.get("/api/vortice/brujula/panel", (req, res) => {
  res.json(panelDe(Number(req.query.dia ?? 36)));
});
app.get("/api/vortice/brujula/semana", (_req, res) => {
  res.json({ saved: true, goals: proposeWeeklyPlan(overviewDemo, prefsDemo.intensidad).goals });
});
app.get("/api/vortice/brujula/preferencias", (_req, res) => res.json(prefsDemo));
app.put("/api/vortice/brujula/preferencias", (req, res) => {
  const parsed = preferenciasBrujulaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Preferencias inválidas" });
  prefsDemo = parsed.data;
  res.json(prefsDemo);
});
app.get("/api/vortice/brujula/bloques", (_req, res) => {
  res.json({ weekStart: weekStartDemo, preferencias: prefsDemo, saved: true, bloques: bloquesDemo() });
});
app.patch("/api/vortice/brujula/bloques/:blockId", (req, res) => {
  const parsed = toggleBloqueSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Estado de bloque inválido" });
  const id = String(req.params.blockId);
  if (parsed.data.completado) completadosBloqueDemo.add(id);
  else completadosBloqueDemo.delete(id);
  res.json({ weekStart: weekStartDemo, preferencias: prefsDemo, saved: true, bloques: bloquesDemo() });
});

const buildResumenFamiliaDemo = () => {
  const bloques = bloquesDemo();
  return resumenBrujulaParaApoderado(panelDe(36), {
    intensidad: prefsDemo.intensidad,
    bloquesPlanificados: bloques.length,
    bloquesCompletados: bloques.filter((bl) => bl.completado).length,
  });
};
app.get("/api/familia/estudiantes", (_req, res) => res.json([{ studentUserId: "est-reg", name: "Ana" }]));
app.get("/api/familia/estudiantes/:studentUserId/resumen", (_req, res) => {
  res.json({
    student: { studentUserId: "est-reg", name: "Ana" },
    overview: { level: { id: "5b", name: "5° Básico" } },
    month: "2026-04",
    studyDays: 4,
    evaluationsInReview: [],
    brujula: buildResumenFamiliaDemo(),
  });
});
app.get("/api/familia/estudiantes/:studentUserId/brujula", (_req, res) => {
  res.json(buildResumenFamiliaDemo());
});

const vite = await createVite({ ...viteConfig, configFile: false, server: { middlewareMode: true, allowedHosts: true as const }, appType: "custom" });
app.use(vite.middlewares);
app.use("/{*path}", async (req, res, next) => {
  try {
    const html = await fs.promises.readFile(path.resolve(import.meta.dirname, "../client/index.html"), "utf8");
    res.status(200).set({ "Content-Type": "text/html" }).end(await vite.transformIndexHtml(req.originalUrl, html));
  } catch (e) { next(e); }
});
const PUERTO = Number(process.env.PORT ?? 3002);
app.listen(PUERTO, () => {
  console.log(`Demo lista en http://localhost:${PUERTO}`);
  console.log(`  - Precios:      http://localhost:${PUERTO}/#precio`);
  console.log(`  - Brújula 1+2:  http://localhost:${PUERTO}/vortice`);
  console.log(`  - Aula UDL:     http://localhost:${PUERTO}/vortice/aula`);
  console.log(`  - Mapa M3:      http://localhost:${PUERTO}/vortice/conocimientos`);
  console.log(`  - Familia:      http://localhost:${PUERTO}/familia`);
  console.log(`  - Admin T39:    http://localhost:${PUERTO}/admin/evaluaciones-perfil`);
  console.log(`  - Evaluación:   http://localhost:${PUERTO}/demo/entrar?u=est-reg  |  ?u=est-neuro`);
});
