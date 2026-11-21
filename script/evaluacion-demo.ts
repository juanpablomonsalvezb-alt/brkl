// Demo local de la pantalla de evaluación E2, con datos ficticios y una base desechable.
// NO es un check: no corre en npm run check:vortice. Nunca toca una base real.
// Uso: npx tsx script/evaluacion-demo.ts  → http://localhost:3002/demo/entrar?u=est-reg  (o est-neuro)
// Preguntas: las 45 del piloto Mat 5.º U3 (docs/vortice/piloto/contenido): 15 en la prueba normal, 30 de banco.
import fs from "node:fs"; import path from "node:path";
import express from "express";
import { createServer as createVite } from "vite";
import type { InArgs } from "@libsql/client";
import viteConfig from "../vite.config";
import { migrar } from "../server/migrar";
import { baseArchivo } from "./lib/basePrueba";
import { aplicarEsquemaHeredado, sembrarFicticios } from "./lib/esquemaHeredado";
import { sembrarEvaluacionPiloto } from "./lib/sembrarEvaluacionPiloto";
import { abrirProceso } from "../server/evaluacion";
import { registrarRutasEvaluacion } from "../server/evaluacionRoutes";
import { calcularPanel } from "../shared/brujulaPanel";

if (process.env.NODE_ENV === "production") throw new Error("la demo no corre en producción");

const b = baseArchivo(); const c = b.client;
const x = (s: string, a: InArgs = []) => c.execute({ sql: s, args: a });
await aplicarEsquemaHeredado(c); await sembrarFicticios(c); await migrar(c, "migrations/vortice");
for (const u of ["est-reg", "est-neuro"]) await x("INSERT INTO users (id, email) VALUES (?, ?)", [u, u + "@ficticio.test"]);
await x("INSERT INTO module_evaluations (id, learning_objective_id, evaluation_number, title, release_day, release_week, passing_score) VALUES ('me-e2', 'lo-mat', 2, 'Fracciones y decimales · Matemática 5.º', 5, 2, 70)");
const clave = await sembrarEvaluacionPiloto(x, { levelSubjectId: "ls-mat-5b", evaluacionId: "me-e2", versionId: "ev-demo", oaCurricularId: "oa1" });
await abrirProceso(c, { estudianteId: "est-neuro", evaluacionId: "me-e2", versionId: "ev-demo", perfil: "neurodivergente" });

const app = express(); app.use(express.json());
const cookie = (r: express.Request) => /(?:^|; )demo=([\w-]+)/.exec(r.headers.cookie ?? "")?.[1];
registrarRutasEvaluacion(app, { client: c, userId: cookie, esAdmin: async () => false, acceso: async () => ({ ok: true as const }) });
app.get("/demo/entrar", (req, res) => { const u = req.query.u === "est-neuro" ? "est-neuro" : "est-reg"; res.cookie("demo", u, { path: "/" }); res.redirect("/vortice/evaluacion/me-e2"); });
// Solo demo: acorta el tiempo del intento activo y entrega la clave, para ver el vencimiento y el extra.
app.get("/demo/vencer", async (req, res) => { await x("UPDATE evaluation_attempts SET expires_at = unixepoch('subsec') + ? WHERE status = 'activo' AND student_id = ?", [Number(req.query.seg ?? 5), cookie(req) ?? ""]); res.json({ ok: true }); });
app.get("/demo/clave", (_req, res) => res.json(clave));
// Inicio de Vórtice con respuestas de ejemplo (solo para ver la pantalla; no hay base de matrícula en la demo).
const dia = (n: number) => new Date(Date.UTC(2026, 2, 1) + n * 86_400_000);
const fechasDemo = (_l: string, m: number) => { const i = (m - 1) * 14; return { inicio: dia(i), fin: dia(i + 13), evaluaciones: { 1: dia(i + 2), 2: dia(i + 4), 3: dia(i + 9), 4: dia(i + 11) } as any }; };
const oaDemo = (id: string, w: number, rs: string[], ev: [string, number][] = []) => ({ id, code: "OA " + id, title: "Módulo " + id, weekNumber: w, sortOrder: 0, resources: rs.map((r) => ({ id: r, title: r, resourceType: "video", sortOrder: 0 })), evaluations: ev.map(([e, n]) => ({ id: e, title: "Evaluación de cierre", evaluationNumber: n, available: true })) });
const asigDemo = (id: string, name: string, objs: any[]) => ({ levelSubjectId: id, subjectName: name, subjectSlug: id, objectives: objs });
app.get("/api/auth/user", (_req, res) => res.json({ firstName: "Ana", name: "Ana" }));
app.get("/api/vortice/overview", (_req, res) => res.json({ track: "basica-5-8", level: { id: "5b", name: "5° Básico" }, subjects: [], nextStep: null, totals: { totalItems: 20, completedItems: 11, percent: 55 }, evaluacionE2: true }));
app.get("/api/vortice/brujula/semana", (_req, res) => res.json({ saved: false, goals: [] }));
app.get("/api/vortice/repaso", (_req, res) => res.json({ domains: [] }));
app.get("/api/vortice/portafolio", (_req, res) => res.json([]));
app.get("/api/vortice/brujula/panel", (req, res) => {
  const dias = Number(req.query.dia ?? 36);
  res.json(calcularPanel({ now: dia(dias), fechas: fechasDemo, completed: new Set(["a1", "a2", "b1", "c1", "l1", "l2", "m1", "m2"]), passed: new Set(["ea", "el"]),
    subjects: [
      asigDemo("mat", "Matemática", [oaDemo("m1", 1, ["a1", "a2"], [["ea", 2]]), oaDemo("m2", 2, ["b1", "b2"], [["eb", 2]]), oaDemo("m3", 3, ["c1", "c2"], [["ec", 2]])]),
      asigDemo("len", "Lenguaje", [oaDemo("l1", 1, ["l1", "l2"], [["el", 2]]), oaDemo("l2", 2, ["lx"], [])]),
      asigDemo("cie", "Ciencias", [oaDemo("c1", 1, ["m1", "m2"], [])]),
    ] }));
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
app.listen(PUERTO, () => console.log(`Demo evaluación E2: http://localhost:${PUERTO}/demo/entrar?u=est-reg  |  ?u=est-neuro`));
