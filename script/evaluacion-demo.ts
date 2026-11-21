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
import { abrirProceso } from "../server/evaluacion";
import { registrarRutasEvaluacion } from "../server/evaluacionRoutes";

if (process.env.NODE_ENV === "production") throw new Error("la demo no corre en producción");
const AU = "ficticio-autor", VA = "ficticio-validador";
const CONT = path.resolve(import.meta.dirname, "../docs/vortice/piloto/contenido");
const OAS = [7, 8, 10, 11, 13];

const b = baseArchivo(); const c = b.client;
const x = (s: string, a: InArgs = []) => c.execute({ sql: s, args: a });
await aplicarEsquemaHeredado(c); await sembrarFicticios(c); await migrar(c, "migrations/vortice");
await x("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa1','ls-mat-5b','M1','t','https://e.test',2018)");
for (const u of ["est-reg", "est-neuro"]) await x("INSERT INTO users (id, email) VALUES (?, ?)", [u, u + "@ficticio.test"]);
await x("INSERT INTO module_evaluations (id, learning_objective_id, evaluation_number, title, release_day, release_week, passing_score) VALUES ('me-e2', 'lo-mat', 2, 'Fracciones y decimales · Matemática 5.º', 5, 2, 70)");
await x("INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES ('d1', 'ls-mat-5b', 'd1')");
await x("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES ('d1-v1', 'd1', 1, 'borrador', ?)", [AU]);
for (const oa of OAS) {
  const it = "oa" + oa;
  await x("INSERT INTO knowledge_items (id, domain_id, code) VALUES (?, 'd1', ?)", [it, "COD-" + it]);
  await x("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES (?, ?, 'd1-v1', 'd1', 'n', 'd')", [it + "-iv", it]);
  await x("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES (?, 'oa1')", [it + "-iv"]);
}
await x("UPDATE knowledge_domain_versions SET status = 'en_revision' WHERE id = 'd1-v1'");
await x("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = ? WHERE id = 'd1-v1'", [VA]);
await x("INSERT INTO evaluation_versions (id, evaluation_id, version, status, created_by) VALUES ('ev-demo', 'me-e2', 1, 'borrador', ?)", [AU]);
await x("UPDATE evaluation_versions SET status = 'validada', validated_by = ?, validated_at = 1 WHERE id = 'ev-demo'", [VA]);

const clave: Record<string, string> = {}; let pos = 0;
for (const oa of OAS) {
  const qs = JSON.parse(fs.readFileSync(path.join(CONT, `oa${oa}_preguntas.json`), "utf8")) as any[];
  for (const [k, q] of qs.entries()) {
    const id = q.id, it = "oa" + oa;
    await x("INSERT INTO question_families (id, item_id, bank) VALUES (?, ?, 'evaluacion')", ["f-" + id, it]);
    await x("INSERT INTO question_versions (id, family_id, item_id, bank, version, status, stem, options_json, correct_option_id, origin, authored_by) VALUES (?, ?, ?, 'evaluacion', 1, 'borrador', ?, ?, ?, 'humano', ?)",
      [id, "f-" + id, it, q.enunciado, JSON.stringify(q.alternativas), q.respuesta_correcta, AU]);
    await x("UPDATE question_versions SET status = 'en_revision' WHERE id = ?", [id]);
    await x("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = ?", [VA, id]);
    clave[id] = q.respuesta_correcta;
    if (k < 3) await x("INSERT INTO evaluation_version_questions (evaluation_version_id, question_version_id, family_id, item_id, bank, position) VALUES ('ev-demo', ?, ?, ?, 'evaluacion', ?)", [id, "f-" + id, it, pos++]);
  }
}
await abrirProceso(c, { estudianteId: "est-neuro", evaluacionId: "me-e2", versionId: "ev-demo", perfil: "neurodivergente" });

const app = express(); app.use(express.json());
const cookie = (r: express.Request) => /(?:^|; )demo=([\w-]+)/.exec(r.headers.cookie ?? "")?.[1];
registrarRutasEvaluacion(app, { client: c, userId: cookie, esAdmin: async () => false, acceso: async () => ({ ok: true as const }) });
app.get("/demo/entrar", (req, res) => { const u = req.query.u === "est-neuro" ? "est-neuro" : "est-reg"; res.cookie("demo", u, { path: "/" }); res.redirect("/vortice/evaluacion/me-e2"); });
// Solo demo: acorta el tiempo del intento activo y entrega la clave, para ver el vencimiento y el extra.
app.get("/demo/vencer", async (req, res) => { await x("UPDATE evaluation_attempts SET expires_at = unixepoch('subsec') + ? WHERE status = 'activo' AND student_id = ?", [Number(req.query.seg ?? 5), cookie(req) ?? ""]); res.json({ ok: true }); });
app.get("/demo/clave", (_req, res) => res.json(clave));
app.get("/vortice", (_req, res) => res.send("<h1>Inicio de Vórtice (demo)</h1>"));

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
