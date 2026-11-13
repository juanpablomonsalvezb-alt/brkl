// R1: PATCH /api/admin/resources/:id con lista blanca estricta. Servidor real (registerRoutes) sobre una base
// SQLite en archivo temporal desechable con el esquema heredado y las migraciones de H2. En cada rechazo se
// comprueba que NINGUNA tabla cambió (no basta con el código HTTP).
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import express from "express";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

if (process.env.NODE_ENV === "production") throw new Error("recursos-patch.check no debe correr con NODE_ENV=production");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recursos-patch-"));
process.env.TEST_DATABASE_URL = `file:${path.join(dir, "base.db")}`;

const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const S = await import("../shared/schema");
const { db } = await import("../server/db");
for (const st of await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(S as any))) await db.run(sql.raw(st));
const client: any = (db as any).$client;
const { migrar } = await import("../server/migrar");
const { sembrarFicticios } = await import("./lib/esquemaHeredado");
const { users } = await import("../shared/models/auth");
await migrar(client, "migrations/vortice");
await sembrarFicticios(client);
const x = (s: string, a: any[] = []) => client.execute({ sql: s, args: a });

// Datos: dos asignaturas, módulos, recursos y un dominio con una versión publicada que vincula wr-mat.
await db.insert(users).values([{ id: "admin" }, { id: "est" }]);
await db.insert(S.userProfiles).values([{ userId: "admin", role: "admin" }, { userId: "est", role: "student" }]);
await x("INSERT INTO learning_objectives (id, level_subject_id, code, title, week_number) VALUES ('lo-mat2','ls-mat-5b','M2','Mod 2',2)");
await x("INSERT INTO weekly_resources (id, learning_objective_id, resource_type, title) VALUES ('wr-free','lo-mat','video','Libre'),('wr-refl-vacio','lo-mat','reflexion','Reflexión vacía'),('wr-video-prompts','lo-mat','video','Video con preguntas')");
await x("INSERT INTO weekly_resources (id, learning_objective_id, resource_type, title, reflection_prompts) VALUES ('wr-refl','lo-mat','reflexion','Reflexión','[\"¿Qué aprendí?\"]')");
await x("UPDATE weekly_resources SET reflection_prompts='[\"x\"]' WHERE id='wr-video-prompts'");
await x("INSERT INTO weekly_resources (id, learning_objective_id, resource_type, title) VALUES ('wr-refl-resp','lo-mat','reflexion','Reflexión con respuestas')");
await x("INSERT INTO reflection_responses (id, user_id, resource_id, answers_json) VALUES ('rr1','est','wr-refl-resp','[\"a\"]')");
await x("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa1','ls-mat-5b','M1','t','https://e.test',2018)");
await x("INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES ('d','ls-mat-5b','d')");
await x("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES ('dv1','d',1,'borrador','ficticio-autor')");
await x("INSERT INTO knowledge_items (id, domain_id, code) VALUES ('a','d','A')");
await x("INSERT INTO knowledge_item_versions (id,item_id,domain_version_id,domain_id,name,operational_definition) VALUES ('av1','a','dv1','d','n','d')");
await x("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES ('av1','oa1')");
await x("INSERT INTO knowledge_item_resources (item_version_id, resource_id, role) VALUES ('av1','wr-mat','explicacion')");
await x("UPDATE knowledge_domain_versions SET status='en_revision' WHERE id='dv1'");
await x("UPDATE knowledge_domain_versions SET status='validada', validated_by='ficticio-validador' WHERE id='dv1'");
await x("UPDATE knowledge_domain_versions SET status='publicada', published_at=1 WHERE id='dv1'");

const { registerRoutes } = await import("../server/routes");
const app = express(); app.use(express.json());
app.use((req: any, _r, next) => { const u = req.header("x-test-user"); req.isAuthenticated = () => !!u; if (u) req.user = { id: u, claims: { sub: u } }; next(); });
const server = createServer(app); await registerRoutes(server, app); await new Promise<void>((r) => server.listen(0, r));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
const http = async (method: string, p: string, user: string | undefined, body?: unknown, crudo?: string) => {
  const r = await fetch(base + p, { method, headers: { "content-type": "application/json", ...(user ? { "x-test-user": user } : {}) }, body: crudo ?? (body === undefined ? undefined : JSON.stringify(body)) });
  const t = await r.text(); let j: any = null; try { j = JSON.parse(t); } catch {}
  return { status: r.status, json: j, text: t };
};
const tablas = (await x("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%' AND name <> 'vortice_migraciones' ORDER BY name")).rows.map((r: any) => String(r.name));
const huella = async (lista = tablas) => { const h = createHash("sha256"); for (const t of lista) h.update(t + JSON.stringify((await x(`SELECT * FROM ${t}`)).rows.map((r: any) => JSON.stringify(Object.values(r))).sort())); return h.digest("hex"); };
const h2 = tablas.filter((t) => t.startsWith("knowledge_") || t === "curriculum_objectives");
const fila = async (id: string) => JSON.stringify((await x("SELECT * FROM weekly_resources WHERE id=?", [id])).rows.map((r: any) => Object.values(r))[0] ?? null);
const P = (id: string, body: unknown, user: string | null = "admin") => http("PATCH", `/api/admin/resources/${id}`, user ?? undefined, body);
let casos = 0; const salida: string[] = [];
const ok = (id: string, t: string) => { casos++; salida.push(`  ✓ ${id.padEnd(5)} ${t}`); };
// Rechazo: código esperado y NINGUNA tabla cambia.
async function rechaza(id: string, titulo: string, recurso: string, body: unknown, status: number, crudo?: string) {
  const antes = await huella(); const f0 = await fila(recurso);
  const r = crudo !== undefined ? await http("PATCH", `/api/admin/resources/${recurso}`, "admin", undefined, crudo) : await P(recurso, body);
  assert.equal(r.status, status, `${id}: esperado ${status}, llegó ${r.status} ${r.text.slice(0, 120)}`);
  assert.equal(await huella(), antes, `${id}: una tabla cambió en un rechazo`);
  assert.equal(await fila(recurso), f0, `${id}: la fila cambió en un rechazo`);
  ok(id, titulo);
}
async function acepta(id: string, titulo: string, recurso: string, body: Record<string, unknown>) {
  const antesH2 = await huella(h2); const f0Obj = { ...((await x("SELECT * FROM weekly_resources WHERE id=?", [recurso])).rows[0] as any) };
  const lo0 = (await x("SELECT learning_objective_id AS l FROM weekly_resources WHERE id=?", [recurso])).rows[0].l;
  const antesOtros = await huella(tablas.filter((t) => t !== "weekly_resources"));
  const r = await P(recurso, body); assert.equal(r.status, 200, `${id}: ${r.text.slice(0, 120)}`);
  const f1 = (await x("SELECT * FROM weekly_resources WHERE id=?", [recurso])).rows[0] as any;
  for (const [k, v] of Object.entries(body)) {
    const col = k.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
    assert.equal(typeof f1[col] === "number" && typeof v === "boolean" ? !!f1[col] : f1[col], v, `${id}: ${k}`);
  }
  assert.equal(f1.learning_objective_id, lo0, `${id}: el módulo cambió`);
  assert.equal(await huella(h2), antesH2, `${id}: cambió un vínculo o dato de H2`);
  assert.equal(await huella(tablas.filter((t) => t !== "weekly_resources")), antesOtros, `${id}: cambió otra tabla`);
  const enviados = new Set(Object.keys(body).map((k) => k.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase())));
  for (const col of Object.keys(f0Obj)) if (!enviados.has(col) && col !== "updated_at") assert.equal(f1[col], f0Obj[col], `${id}: cambió la columna no enviada ${col}`);
  ok(id, titulo);
}

// ── Autorización y existencia ──
assert.equal((await P("wr-free", { title: "x" }, null)).status, 401); assert.equal((await P("wr-free", { title: "x" }, "est")).status, 403);
{ const a = await huella(); assert.equal((await P("no-existe", { title: "x" })).status, 404); assert.equal(await huella(), a); }
ok("A18", "recurso inexistente: 404; sin sesión 401; estudiante 403; sin cambios");

// ── Movimiento curricular, identidad y auditoría: 400 y sin cambios (A01–A08, A11, A17) ──
await rechaza("A01", "mover un recurso vinculado a otra asignatura", "wr-mat", { learningObjectiveId: "lo-len" }, 400);
await rechaza("A02", "mover un recurso libre a otra asignatura", "wr-free", { learningObjectiveId: "lo-len" }, 400);
await rechaza("A03", "mover a otro módulo de la misma asignatura", "wr-free", { learningObjectiveId: "lo-mat2" }, 400);
await rechaza("A04", "mover a un objetivo inexistente", "wr-free", { learningObjectiveId: "no-existe" }, 400);
await rechaza("A11", "learningObjectiveId nulo", "wr-free", { learningObjectiveId: null }, 400);
await rechaza("A05", "cambiar el id", "wr-free", { id: "otro-id" }, 400);
await rechaza("A06", "cambiar el id de un recurso vinculado a una versión publicada", "wr-mat", { id: "otro-id" }, 400);
await rechaza("A07", "createdAt y updatedAt como texto", "wr-free", { createdAt: "2000-01-01", updatedAt: "2000-01-01" }, 400);
await rechaza("A08", "createdAt como número", "wr-free", { createdAt: 946684800 }, 400);
await rechaza("A17", "campo válido más learningObjectiveId: no se aplica ninguno", "wr-free", { title: "Valido", learningObjectiveId: "lo-len" }, 400);
await rechaza("A13", "pedagogicalStep (tiene su ruta)", "wr-free", { pedagogicalStep: "ejemplo" }, 400);
await rechaza("A13b", "reflectionPrompts (tiene su ruta)", "wr-refl", { reflectionPrompts: ["x"] }, 400);
await rechaza("A09", "campo desconocido más válido: no se aplica el válido", "wr-free", { campoDesconocido: "x", title: "Titulo B" }, 400);
await rechaza("A09b", "dos desconocidos", "wr-free", { a: 1, b: 2 }, 400);
// ── Valores y tipos ──
await rechaza("A10", "title nulo", "wr-free", { title: null }, 400);
await rechaza("A12", "resourceType fuera de la lista", "wr-free", { resourceType: "ejecutable" }, 400);
await rechaza("A12b", "resourceType no textual o nulo", "wr-free", { resourceType: 5 }, 400);
await rechaza("A12c", "resourceType nulo", "wr-free", { resourceType: null }, 400);
await rechaza("A14", "title como objeto", "wr-free", { title: { a: 1 } }, 400);
await rechaza("A15", "title como arreglo", "wr-free", { title: ["x"] }, 400);
await rechaza("A15b", "title como número", "wr-free", { title: 5 }, 400);
await rechaza("A16", "sortOrder como texto", "wr-free", { sortOrder: "abc" }, 400);
await rechaza("A16b", "sortOrder decimal", "wr-free", { sortOrder: 1.5 }, 400);
await rechaza("A16c", "sortOrder nulo", "wr-free", { sortOrder: null }, 400);
await rechaza("A16d", "isActive como texto", "wr-free", { isActive: "no" }, 400);
await rechaza("A16e", "isActive como número", "wr-free", { isActive: 0 }, 400);
await rechaza("A16f", "isActive nulo", "wr-free", { isActive: null }, 400);
await rechaza("A16g", "notebookLmUrl como número", "wr-free", { notebookLmUrl: 5 }, 400);
await rechaza("A16h", "textos anulables como objeto", "wr-free", { studentHelp: { a: 1 }, barkleyFoundation: ["x"] }, 400);
for (const campo of ["notebookLmUrl", "barkleyFoundation", "studentHelp", "pedagogicalObjective"]) {
  await rechaza(`A16i-${campo}`, `${campo} como objeto, número o booleano`, "wr-free", { [campo]: { a: 1 } }, 400);
  await rechaza(`A16j-${campo}`, `${campo} como número`, "wr-free", { [campo]: 7 }, 400);
}
await rechaza("A19", "cuerpo vacío (D-1)", "wr-free", {}, 400);
await rechaza("A19b", "cuerpo arreglo", "wr-free", [], 400);
await rechaza("A19c", "cuerpo null (lo rechaza el analizador JSON de express antes de la ruta)", "wr-free", null, 400, "null");
await rechaza("A19d", "cuerpo JSON mal formado (lo rechaza el analizador JSON de express antes de la ruta)", "wr-free", undefined, 400, "{no es json");

// ── Cambios legítimos de metadatos ──
await acepta("L1", "title", "wr-free", { title: "Título nuevo" });
await acepta("L2", "notebookLmUrl: cualquier texto (sin N-1) y nulo", "wr-free", { notebookLmUrl: "texto libre sin formato de URL" });
await acepta("L2b", "notebookLmUrl nulo", "wr-free", { notebookLmUrl: null });
await acepta("L3", "barkleyFoundation, studentHelp, pedagogicalObjective", "wr-free", { barkleyFoundation: "Activación", studentHelp: "Ayuda", pedagogicalObjective: "Objetivo" });
await acepta("L3b", "textos anulables a nulo", "wr-free", { barkleyFoundation: null, studentHelp: null, pedagogicalObjective: null });
await acepta("L4", "sortOrder", "wr-free", { sortOrder: 7 });
await acepta("L5", "isActive falso y verdadero", "wr-free", { isActive: false });
await acepta("L5b", "isActive verdadero", "wr-free", { isActive: true });
await acepta("L6", "resourceType entre tipos sin reflexión", "wr-free", { resourceType: "audio" });
await acepta("L7", "todos los campos permitidos a la vez", "wr-free", { title: "T", notebookLmUrl: "u", barkleyFoundation: "b", studentHelp: "s", pedagogicalObjective: "p", sortOrder: 3, isActive: true, resourceType: "video" });
{ // un solo recurso cambia; los demás recursos no
  const otros = await huella(["student_progress", "reflection_responses", "knowledge_item_resources", "learning_objectives"]);
  assert.equal((await P("wr-free", { title: "Solo este" })).status, 200);
  assert.equal(await huella(["student_progress", "reflection_responses", "knowledge_item_resources", "learning_objectives"]), otros);
  assert.equal(JSON.parse(await fila("wr-len"))[3], "Lectura", "otro recurso intacto"); ok("L8", "solo cambia el recurso indicado; módulos, progreso, vínculos intactos");
}
{ const r = await P("wr-free", { title: "Resp" }); assert.equal(r.status, 200); assert.equal(r.json.title, "Resp"); assert.equal(r.json.learningObjectiveId, "lo-mat"); ok("L9", "la respuesta 200 devuelve la fila actualizada"); }
await acepta("L10", "el recurso vinculado a una versión publicada admite metadatos", "wr-mat", { title: "Fracciones (editado)", sortOrder: 2 });

await acepta("L11", "title vacío: paridad con POST (D-2, sin longitud mínima nueva)", "wr-free", { title: "" });
{ const r = await http("POST", "/api/admin/resources", "admin", { learningObjectiveId: "lo-mat2", resourceType: "video", title: "" }); assert.equal(r.status, 200, "POST acepta title vacío: el PATCH conserva la misma exigencia"); ok("L12", "POST acepta title vacío (paridad)"); }
await acepta("L13", "sortOrder: entero sin cotas, como la columna (paridad con POST)", "wr-free", { sortOrder: -3 });

// ── D-3: tipo desde o hacia reflexión ──
await acepta("R1", "video sin preguntas ni respuestas → reflexion", "wr-free", { resourceType: "reflexion" });
await acepta("R2", "reflexion sin preguntas ni respuestas → video", "wr-refl-vacio", { resourceType: "video" });
await rechaza("R3", "reflexion con reflection_prompts → video: 409", "wr-refl", { resourceType: "video" }, 409);
await rechaza("R4", "reflexion con respuestas de estudiantes → video: 409", "wr-refl-resp", { resourceType: "audio" }, 409);
await rechaza("R5", "video con reflection_prompts → reflexion: 409", "wr-video-prompts", { resourceType: "reflexion" }, 409);
await rechaza("R6", "409 con otros campos válidos en el cuerpo: tampoco se aplican", "wr-refl", { title: "No debe cambiar", resourceType: "video" }, 409);
await x("INSERT INTO weekly_resources (id, learning_objective_id, resource_type, title, reflection_prompts) VALUES ('wr-refl-corchetes','lo-mat','reflexion','Con corchetes','[]')");
await acepta("R6b", "preguntas vacías ('[]') no cuentan: reflexion → video permitido", "wr-refl-corchetes", { resourceType: "video" });
await acepta("R7", "reflexion con preguntas: metadatos y mismo tipo sí", "wr-refl", { title: "Reflexión editada", resourceType: "reflexion", sortOrder: 4 });
await acepta("R8", "reflexion con respuestas: metadatos sí", "wr-refl-resp", { title: "Con respuestas, editada", isActive: false });
{ const a = JSON.stringify([await huella(["reflection_responses"]), (await x("SELECT reflection_prompts FROM weekly_resources WHERE id='wr-refl'")).rows[0].reflection_prompts]); await P("wr-refl", { resourceType: "video" }); const b = JSON.stringify([await huella(["reflection_responses"]), (await x("SELECT reflection_prompts FROM weekly_resources WHERE id='wr-refl'")).rows[0].reflection_prompts]); assert.equal(a, b); ok("R9", "el 409 no borra ni modifica preguntas ni respuestas"); }

// ── Regresión: POST y la ruta pedagógica ──
{ const r = await http("POST", "/api/admin/resources", "admin", { learningObjectiveId: "lo-mat2", resourceType: "video", title: "Nuevo" }); assert.equal(r.status, 200); assert.equal(r.json.learningObjectiveId, "lo-mat2"); ok("G1", "POST de recurso sigue igual"); }
{ const a = await huella(); const r = await http("POST", "/api/admin/resources", "admin", { resourceType: "video" }); assert.equal(r.status, 400); assert.equal(await huella(), a); ok("G2", "POST inválido sigue en 400 sin cambios"); }
{ const r = await http("PATCH", "/api/admin/resources/wr-refl/pedagogical-step", "admin", { pedagogicalStep: "reflexion", reflectionPrompts: ["¿Qué aprendí hoy?"] }); assert.equal(r.status, 200, r.text); ok("G3", "la ruta pedagogical-step conserva su contrato (200)"); }
{ const a = await huella(); const r = await http("PATCH", "/api/admin/resources/wr-free/pedagogical-step", "admin", { pedagogicalStep: "inventado" }); assert.equal(r.status, 400); assert.equal(await huella(), a); ok("G4", "pedagogical-step con valor inválido: 400 sin cambios"); }
{ const a = await huella(); const r = await http("PATCH", "/api/admin/resources/wr-free/pedagogical-step", "admin", { pedagogicalStep: "ejemplo", learningObjectiveId: "lo-len" }); assert.equal(r.status, 400); assert.equal(await huella(), a); ok("G5", "pedagogical-step sigue siendo estricta"); }
// Vínculo publicado intacto de punta a punta: crear una versión nueva del dominio sigue funcionando.
{ const { crearVersionDominio } = await import("../server/catalogo"); const v = await crearVersionDominio(client, "d", "ficticio-autor"); assert.equal(v.version, 2); ok("H2", "tras los cambios aceptados, crear la versión 2 del dominio sigue funcionando"); }

server.close();
fs.rmSync(dir, { recursive: true, force: true });
console.log(salida.join("\n"));
console.log(`recursos-patch: ok (${casos} casos)`);
