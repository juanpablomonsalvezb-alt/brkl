// Pruebas P0 (autorización, claves de evaluación, formularios externos, logs y build).
// Corre contra una base SQLite EN MEMORIA creada desde el schema: nunca toca producción ni db.sqlite.
// Ejecutar: npm run check:vortice  (o: npx tsx script/p0.check.ts)
import assert from "node:assert/strict";
import fs from "node:fs";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

if (process.env.NODE_ENV === "production") throw new Error("p0.check no debe correr con NODE_ENV=production");
process.env.TEST_DATABASE_URL = ":memory:";

const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const schema = await import("../shared/schema");
const { db } = await import("../server/db");
for (const stmt of await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any))) {
  await db.run(sql.raw(stmt));
}
// Las rutas se importan después de crear las tablas (replitAuth crea "sessions" al cargarse).
const { registerRoutes } = await import("../server/routes");
const { requestLogger } = await import("../server/requestLog");

// Datos mínimos: admin, estudiante matriculado, estudiante ajeno; módulo 1 con evaluación
// corregida en servidor (1) y formulario externo (2, cierra el módulo); módulo 2 con un recurso.
const { users } = await import("../shared/models/auth");
const S = schema;
await db.insert(users).values([{ id: "admin" }, { id: "alumno" }, { id: "ajeno" }]);
await db.insert(S.userProfiles).values([
  { userId: "admin", role: "admin" }, { userId: "alumno", role: "student" }, { userId: "ajeno", role: "student" },
]);
await db.insert(S.levels).values({ id: "7b", name: "7° Básico", programType: "menores", sortOrder: 1 });
await db.insert(S.subjects).values({ id: "mat", name: "Matemática", slug: "matematica" });
await db.insert(S.levelSubjects).values({ id: "ls1", levelId: "7b", subjectId: "mat" });
await db.insert(S.enrollments).values({ userId: "alumno", levelSubjectId: "ls1" });
await db.insert(S.learningObjectives).values([
  { id: "m1", levelSubjectId: "ls1", code: "M1", title: "Módulo 1", weekNumber: 1 },
  { id: "m2", levelSubjectId: "ls1", code: "M2", title: "Módulo 2", weekNumber: 2 },
]);
const preguntas = [
  { id: 1, question: "¿2+2?", options: ["3", "4"], correctAnswer: 1, explanation: "CLAVE_SECRETA_EXPLICACION" },
  { id: 2, question: "¿3+3?", options: ["6", "7"], correctAnswer: 0, explanation: "CLAVE_SECRETA_EXPLICACION_2" },
];
await db.insert(S.moduleEvaluations).values([
  { id: "e1", learningObjectiveId: "m1", evaluationNumber: 1, title: "Eval 1", releaseWeek: 1, questionsJson: JSON.stringify(preguntas), totalQuestions: 2 },
  { id: "e2", learningObjectiveId: "m1", evaluationNumber: 2, title: "Formulario", releaseWeek: 1, formUrl: "https://forms.example/x" },
  { id: "e3", learningObjectiveId: "m1", evaluationNumber: 3, title: "HTML con clave", releaseWeek: 2,
    htmlContent: '<script>const preguntas=[{pregunta:"¿Capital de Chile?",opciones:["Lima","Santiago"],respuesta:"b"}];</script>' },
]);
await db.insert(S.weeklyResources).values({ id: "r2", learningObjectiveId: "m2", resourceType: "video", title: "Video M2" });

// App de prueba: la sesión se simula con un encabezado (solo en esta prueba, no en el servidor real).
const app = express();
app.use(express.json());
const logs: string[] = [];
app.use(requestLogger((l) => logs.push(l)));
app.use((req: any, _res, next) => {
  const u = req.header("x-test-user");
  req.isAuthenticated = () => !!u;
  if (u) req.user = { id: u, claims: { sub: u }, expires_at: Math.floor(Date.now() / 1000) + 3600 };
  next();
});
const server = createServer(app);
await registerRoutes(server, app);
await new Promise<void>((r) => server.listen(0, r));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
const call = async (method: string, path: string, user?: string, body?: unknown) => {
  const res = await fetch(base + path, {
    method,
    headers: { "content-type": "application/json", ...(user ? { "x-test-user": user } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, text, json: (() => { try { return JSON.parse(text); } catch { return null; } })() };
};

// 1–3. Autorización administrativa (incluye módulos separados: faqRoutes, paesRoutes, evaluationLinks).
const rutasAdmin: [string, string, unknown?][] = [
  ["POST", "/api/admin/levels", { id: "9z", name: "x", programType: "menores", sortOrder: 9 }],
  ["GET", "/api/admin/faqs"],
  ["POST", "/api/admin/paes/subjects", {}],
  ["GET", "/api/admin/paes/subscriptions"],
  ["PUT", "/api/admin/evaluations/m1/1/html", { htmlContent: "<p>x</p>" }],
  ["GET", "/api/admin/evaluations/e3/html-preview"],
  ["POST", "/api/admin/learning-objectives/m1/generate-evaluations"],
  ["POST", "/api/admin/seed"],
  ["GET", "/api/admin/drive/folders"],
  ["POST", "/api/admin/level-subjects/ls1/create-modules", {}],
  ["POST", "/api/evaluation-links", {}],
  ["DELETE", "/api/evaluation-links/x"],
  ["POST", "/api/textbooks/auto-match", {}],
];
for (const [m, p, b] of rutasAdmin) {
  assert.equal((await call(m, p, undefined, b)).status, 401, `anónimo ${m} ${p}`);
  assert.equal((await call(m, p, "alumno", b)).status, 403, `estudiante ${m} ${p}`);
}
const adminCrea = await call("POST", "/api/admin/levels", "admin", { id: "9z", name: "Prueba", programType: "menores", sortOrder: 9 });
assert.equal(adminCrea.status, 200, "admin autorizado crea nivel");
assert.equal((await call("GET", "/api/admin/faqs", "admin")).status, 200, "admin lee FAQ (módulo separado)");
const preview = await call("GET", "/api/admin/evaluations/e3/html-preview", "admin");
assert.equal(preview.status, 200, "admin puede previsualizar");

// 4. Acceso a evaluaciones: el ajeno (sin matrícula) no consulta ni envía.
assert.equal((await call("GET", "/api/evaluations/e1", "ajeno")).status, 403);
assert.equal((await call("POST", "/api/evaluations/e1/submit", "ajeno", { answers: [] })).status, 403);
assert.equal((await call("GET", "/api/evaluations/m1/1/html", "ajeno")).status, 403);
assert.equal((await call("GET", "/api/evaluations/e1")).status, 401);

// 5. Sin claves antes de agotar intentos (no hay máximo configurable aún: nunca se revelan).
const vista = await call("GET", "/api/evaluations/e1", "alumno");
assert.equal(vista.status, 200);
assert.ok(!vista.text.includes("correctAnswer") && !vista.text.includes("CLAVE_SECRETA"), "consulta sin clave");
const envio = await call("POST", "/api/evaluations/e1/submit", "alumno", { answers: [{ questionId: 1, answer: 0 }] });
assert.equal(envio.status, 200);
assert.ok(!envio.text.includes("correctAnswer") && !envio.text.includes("CLAVE_SECRETA"), "envío sin clave");
// Respuesta inmediata: solo el resultado (lista blanca), sin puntaje, correctas ni pauta.
assert.deepEqual(envio.json, { resultado: "no_aprobado" });
const [fila1] = await db.select().from(S.evaluationProgress).where(sql`evaluation_id = 'e1' and user_id = 'alumno'`);
assert.equal(fila1.score, 0, "el puntaje se guarda solo en el servidor");
// HTML convertible de forma segura: nunca se entrega el HTML; se ofrece como cuestionario saneado.
const html3 = await call("GET", "/api/evaluations/m1/3/html", "alumno");
assert.equal(html3.status, 200);
assert.deepEqual(html3.json, { htmlContent: null, structured: true, evaluationId: "e3" });
const vista3 = await call("GET", "/api/evaluations/e3", "alumno");
assert.equal(vista3.status, 200);
assert.deepEqual(vista3.json.questions, [{ id: 1, question: "¿Capital de Chile?", options: ["Lima", "Santiago"] }]);
assert.ok(!vista3.text.includes("correctAnswer") && !vista3.text.includes("respuesta"));
const envio3 = await call("POST", "/api/evaluations/e3/submit", "alumno", { answers: [{ questionId: 1, answer: 1 }] });
assert.equal(envio3.status, 200);
assert.deepEqual(envio3.json, { resultado: "aprobado" }, "se corrige en el servidor contra la clave convertida");
assert.ok(!envio3.text.includes("correctAnswer") && !envio3.text.includes("explanation"));

// 5b. Índice numérico ambiguo y conversión parcial (3 de texto + 1 en script): bloqueados, nada se sirve.
const bloqueados: Record<string, string> = {
  ambigua: '<script>const preguntas=[{pregunta:"¿A?",opciones:["x","y"],respuesta:1}];</script>',
  parcial: '<p>1. ¿Uno?</p><p>a) x</p><p>b) y ✓</p><p>2. ¿Dos?</p><p>a) x ✓</p><p>b) y</p><p>3. ¿Tres?</p><p>a) x</p><p>b) y ✓</p>' +
    '<script>const preguntas=[{pregunta:"¿Cuatro?",opciones:["x","y"],respuesta:1}];</script>',
};
for (const [nombre, html] of Object.entries(bloqueados)) {
  const oa = `mb-${nombre}`, ev = `evb-${nombre}`;
  await db.insert(S.learningObjectives).values({ id: oa, levelSubjectId: "ls1", code: "MB", title: nombre, weekNumber: 1 });
  await db.insert(S.moduleEvaluations).values({ id: ev, learningObjectiveId: oa, evaluationNumber: 1, title: nombre, releaseWeek: 1, htmlContent: html });
  const h = await call("GET", `/api/evaluations/${oa}/1/html`, "alumno");
  assert.equal(h.status, 409, `${nombre}: bloqueado`);
  assert.ok(!h.text.includes("<script") && !h.text.includes("✓"), `${nombre}: sin HTML`);
  assert.equal((await call("GET", `/api/evaluations/${ev}`, "alumno")).status, 404, `${nombre}: sin preguntas`);
  assert.equal((await call("POST", `/api/evaluations/${ev}/submit`, "alumno", { answers: [] })).status, 404, `${nombre}: no se corrige`);
}

// 5c. Repaso: tras fallar e1, responder el ítem no devuelve clave, explicación ni acierto.
await call("GET", "/api/vortice/repaso", "alumno"); // crea los ítems desde el intento
await db.update(S.reviewItems).set({ dueDay: "2000-01-01" }).where(sql`user_id = 'alumno'`);
const rep = await call("GET", "/api/vortice/repaso", "alumno");
assert.ok(rep.json.items.length > 0, "hay ítems vencidos");
assert.ok(!rep.text.includes("correctAnswer") && !rep.text.includes("CLAVE_SECRETA") && !rep.text.includes("explanation"));
for (const it of rep.json.items) {
  const r = await call("POST", `/api/vortice/repaso/${it.id}/responder`, "alumno", { answer: 1 });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { registrado: true }, "solo acuse de recibo");
  assert.ok(!r.text.includes("correctAnswer") && !r.text.includes("CLAVE_SECRETA") && !r.text.includes("explanation"));
}
assert.equal((await call("POST", `/api/vortice/repaso/${rep.json.items[0].id}/responder`, "ajeno", { answer: 1 })).status, 404, "ítem ajeno");

// 5d. Copiloto: una evaluación HTML activa bloquea la asistencia sobre sus preguntas (sin llamar al proveedor).
await db.insert(S.moduleEvaluations).values({ id: "ecop", learningObjectiveId: "m1", evaluationNumber: 4, title: "HTML copiloto", releaseWeek: 1,
  htmlContent: '<p>1. ¿Qué océano baña las costas de Chile continental?</p><p>a) Atlántico</p><p>b) Pacífico ✓</p>' });
const cop = await call("POST", "/api/academic-copilot/chat", "alumno", { message: "¿Qué océano baña las costas de Chile continental?", evaluationId: "ecop" });
assert.equal(cop.status, 200);
assert.equal(cop.json.notice, "evaluation", "bloqueo por evaluación HTML en curso");

// 5e. /complete solo para formularios externos; metadatos coherentes con gradableQuestions; clave fuera de rango bloquea.
await db.insert(S.learningObjectives).values({ id: "mk", levelSubjectId: "ls1", code: "MK", title: "Claves", weekNumber: 1 });
await db.insert(S.moduleEvaluations).values([
  { id: "ek-mala", learningObjectiveId: "mk", evaluationNumber: 1, title: "Clave fuera de rango", releaseWeek: 1, totalQuestions: 2,
    questionsJson: JSON.stringify([preguntas[0], { ...preguntas[1], correctAnswer: 5 }]) },
  { id: "ek-html", learningObjectiveId: "mk", evaluationNumber: 2, title: "HTML corregible", releaseWeek: 1, formUrl: "https://forms.example/y",
    htmlContent: "<p>1. ¿Uno?</p><p>a) x</p><p>b) y ✓</p>" },
  { id: "ek-ambigua", learningObjectiveId: "mk", evaluationNumber: 3, title: "HTML bloqueado", releaseWeek: 1, totalQuestions: 9,
    htmlContent: bloqueados.ambigua },
]);
for (const ev of ["e1", "e3", "ek-mala", "ek-html", "ek-ambigua"]) {
  assert.equal((await call("POST", `/api/evaluations/${ev}/complete`, "alumno", { passed: true })).status, 409, `${ev}: sin vía de formulario`);
}
assert.equal((await call("GET", "/api/evaluations/ek-mala", "alumno")).status, 404, "clave inválida: no se sirve");
assert.equal((await call("POST", "/api/evaluations/ek-mala/submit", "alumno", { answers: [{ questionId: 2, answer: 1 }] })).status, 404, "ni se corrige");
const metaLo = (await call("GET", "/api/learning-objectives/mk/evaluations", "alumno")).json;
const metaMod = (await call("GET", "/api/modules/1/evaluations?levelSubjectId=ls1", "alumno")).text;
assert.deepEqual(metaLo.map((e: any) => [e.id, e.hasQuestions, e.totalQuestions]).sort(),
  [["ek-ambigua", false, null], ["ek-html", true, 1], ["ek-mala", false, null]]);
assert.ok(!metaMod.includes("CLAVE_SECRETA") && !JSON.stringify(metaLo).includes("CLAVE_SECRETA"));
const meta3 = (await call("GET", "/api/learning-objectives/m1/evaluations", "alumno")).json.find((e: any) => e.id === "e3");
assert.deepEqual([meta3.hasQuestions, meta3.totalQuestions], [true, 1], "HTML convertible descrito como corregible");
// Repaso por HTTP: ni caja ni fecha en el GET.
const rep2 = await call("GET", "/api/vortice/repaso", "alumno");
assert.ok(!/"box"|"dueDay"|correctAnswer|explanation/.test(rep2.text), "GET de repaso sin datos de programación");

// 6. Formulario externo: queda pendiente, ignora score/passed del cliente, no habilita el módulo 2.
const form = await call("POST", "/api/evaluations/e2/complete", "alumno", { score: 100, passed: true });
assert.equal(form.status, 202);
assert.equal(form.json.estado, "pendiente_revision");
const [fila] = await db.select().from(S.evaluationProgress).where(sql`id = ${form.json.id}`);
assert.equal(fila.passed, false);
assert.equal(fila.score, null);
assert.equal((await call("POST", "/api/progress", "alumno", { resourceId: "r2" })).status, 403, "pendiente no habilita módulo 2");
assert.equal((await call("POST", `/api/admin/evaluation-progress/${form.json.id}/validar`, "alumno", { decision: "aprobada_validada" })).status, 403, "estudiante no se valida");
const val = await call("POST", `/api/admin/evaluation-progress/${form.json.id}/validar`, "admin", { decision: "aprobada_validada", motivo: "Revisado" });
assert.equal(val.status, 200);
assert.equal(val.json.validadoPor, "admin");
assert.equal((await call("POST", `/api/admin/evaluation-progress/${form.json.id}/validar`, "admin", { decision: "aprobada_validada" })).status, 409, "no se valida dos veces");
assert.equal((await call("POST", "/api/progress", "alumno", { resourceId: "r2" })).status, 200, "validada habilita módulo 2");
// Rechazo (rechazada_requiere_correccion): con un estudiante propio, para no depender del caso anterior.
await db.insert(users).values({ id: "alumno2" });
await db.insert(S.userProfiles).values({ userId: "alumno2", role: "student" });
await db.insert(S.enrollments).values({ userId: "alumno2", levelSubjectId: "ls1" });
const formR = await call("POST", "/api/evaluations/e2/complete", "alumno2", { score: 100, passed: true });
assert.equal(formR.status, 202);
assert.equal((await call("POST", `/api/admin/evaluation-progress/${formR.json.id}/validar`, "alumno2", { decision: "rechazada_requiere_correccion" })).status, 403, "estudiante no se rechaza ni aprueba");
assert.equal((await call("POST", `/api/admin/evaluation-progress/${formR.json.id}/validar`, "admin", { decision: "otra" })).status, 400, "decisión inválida");
const rech = await call("POST", `/api/admin/evaluation-progress/${formR.json.id}/validar`, "admin", { decision: "rechazada_requiere_correccion", motivo: "Falta la pregunta 3" });
assert.equal(rech.status, 200);
assert.equal(rech.json.passed, false);
assert.equal(rech.json.estado, "rechazada_requiere_correccion");
const [filaR] = await db.select().from(S.evaluationProgress).where(sql`id = ${formR.json.id}`);
assert.equal(filaR.passed, false);
assert.deepEqual(
  (({ estado, validadoPor, motivo }) => ({ estado, validadoPor, motivo }))(JSON.parse(filaR.answersJson!)),
  { estado: "rechazada_requiere_correccion", validadoPor: "admin", motivo: "Falta la pregunta 3" },
);
assert.equal((await call("POST", `/api/admin/evaluation-progress/${formR.json.id}/validar`, "admin", { decision: "aprobada_validada" })).status, 409, "rechazada no se reabre por esta vía");
assert.equal((await call("POST", "/api/progress", "alumno2", { resourceId: "r2" })).status, 403, "rechazada no habilita módulo 2");

// Sin matrícula: no puede ni entregar.
const form2 = await call("POST", "/api/evaluations/e2/complete", "ajeno", { passed: true });
assert.equal(form2.status, 403, "sin matrícula ni siquiera entrega");

// 6b. Autovalidación: un admin no valida su propia entrega; sí la de otro estudiante (ver arriba).
await db.insert(S.enrollments).values({ userId: "admin", levelSubjectId: "ls1" });
const propia = await call("POST", "/api/evaluations/e2/complete", "admin", { passed: true });
assert.equal(propia.status, 202);
assert.equal((await call("POST", `/api/admin/evaluation-progress/${propia.json.id}/validar`, "admin", { decision: "aprobada_validada" })).status, 403, "admin no se autovalida");
const [filaPropia] = await db.select().from(S.evaluationProgress).where(sql`id = ${propia.json.id}`);
assert.equal(filaPropia.passed, false);
assert.equal(JSON.parse(filaPropia.answersJson!).estado, "pendiente_revision", "sigue pendiente");
await db.insert(users).values({ id: "admin2" });
await db.insert(S.userProfiles).values({ userId: "admin2", role: "admin" });
assert.equal((await call("POST", `/api/admin/evaluation-progress/${propia.json.id}/validar`, "admin2", { decision: "aprobada_validada" })).status, 200, "otro admin sí puede");

// 6c. Enlaces de evaluación (Gemini): privados, por matrícula, módulo abierto y fecha de liberación.
await db.insert(S.evaluationLinks).values([
  { id: "l1", courseId: "ls1", moduleNumber: 1, evaluationNumber: 1, geminiLink: "https://gemini.example/m1e1" },
  { id: "l4", courseId: "ls1", moduleNumber: 1, evaluationNumber: 4, geminiLink: "https://gemini.example/m1e4-futura", releaseDate: new Date("2099-01-01") },
  { id: "l2", courseId: "ls1", moduleNumber: 2, evaluationNumber: 1, geminiLink: "https://gemini.example/m2e1" },
]);
for (const p of ["/api/evaluation-links/ls1/1", "/api/evaluation-links/ls1"]) {
  assert.equal((await call("GET", p)).status, 401, `anónimo ${p}`);
  assert.equal((await call("GET", p, "ajeno")).status, 403, `sin matrícula ${p}`);
}
// alumno2 (formulario rechazado): el módulo 2 sigue cerrado.
assert.equal((await call("GET", "/api/evaluation-links/ls1/2", "alumno2")).status, 403, "sin acceso temporal al módulo");
const curso2 = await call("GET", "/api/evaluation-links/ls1", "alumno2");
assert.deepEqual(curso2.json.map((l: any) => l.id), ["l1"], "solo módulos abiertos y enlaces liberados");
assert.ok(!curso2.text.includes("m1e4-futura") && !curso2.text.includes("m2e1"));
// alumno (formulario validado): módulo 2 abierto; el enlace futuro sigue oculto.
assert.deepEqual((await call("GET", "/api/evaluation-links/ls1/2", "alumno")).json.map((l: any) => l.id), ["l2"]);
assert.deepEqual((await call("GET", "/api/evaluation-links/ls1/1", "alumno")).json.map((l: any) => l.id), ["l1"]);
// admin: todos.
assert.deepEqual((await call("GET", "/api/evaluation-links/ls1", "admin2")).json.map((l: any) => l.id).sort(), ["l1", "l2", "l4"]);
assert.equal((await call("POST", "/api/evaluation-links", "alumno", {})).status, 403, "escritura sigue siendo solo admin");

// 6d. HTML con la clave en formatos que el parser no reconoce: nunca se entrega ni se ofrece.
const formatos: Record<string, string> = {
  data_answer: '<div data-answer="b"><p>1. ¿A?</p><p>a) x</p><p>b) y</p></div>',
  comentario: '<p>1. ¿A?</p><p>a) x</p><p>b) y</p><!-- correcta: b -->',
  negrita: '<p>1. ¿A?</p><p>a) x</p><p><strong>b) y</strong></p>',
  estilo: '<p>1. ¿A?</p><p>a) x</p><p style="color:green">b) y</p>',
  js_ofuscado: '<script>const k=atob("Yg==");</script><p>1. ¿A?</p><p>a) x</p><p>b) y</p>',
  script_externo: '<script src="https://x.example/key.js"></script><p>1. ¿A?</p><p>a) x</p><p>b) y</p>',
};
for (const [nombre, html] of Object.entries(formatos)) {
  const ls = `ls-${nombre}`, oa = `m-${nombre}`, ev = `ev-${nombre}`;
  await db.insert(S.levelSubjects).values({ id: ls, levelId: "7b", subjectId: "mat" });
  await db.insert(S.enrollments).values({ userId: "alumno", levelSubjectId: ls });
  await db.insert(S.learningObjectives).values({ id: oa, levelSubjectId: ls, code: "M1", title: "Módulo 1", weekNumber: 1 });
  await db.insert(S.moduleEvaluations).values({ id: ev, learningObjectiveId: oa, evaluationNumber: 1, title: nombre, releaseWeek: 1, htmlContent: html });
  const h = await call("GET", `/api/evaluations/${oa}/1/html`, "alumno");
  assert.equal(h.status, 409, `${nombre}: bloqueado`);
  for (const fragmento of ["data-answer", "correcta", "<strong>", "color:green", "atob", "key.js", "<script", "b) y"]) {
    assert.ok(!h.text.includes(fragmento), `${nombre}: no filtra "${fragmento}"`);
  }
  assert.equal((await call("GET", `/api/evaluations/${ev}`, "alumno")).status, 404, `${nombre}: sin preguntas servibles`);
  assert.equal((await call("POST", `/api/evaluations/${ev}/submit`, "alumno", { answers: [] })).status, 404, `${nombre}: no se corrige`);
  const meta = await call("GET", `/api/modules/1/evaluations?levelSubjectId=${ls}`, "alumno");
  assert.ok(!meta.text.includes("data-answer") && !meta.text.includes("atob") && !meta.text.includes("<script"), `${nombre}: metadatos sin HTML`);
}

// 7. Logs: solo método, ruta, estado y duración; sin cuerpos ni claves.
const todo = logs.join("\n");
assert.ok(logs.some((l) => l.startsWith("POST /api/evaluations/e1/submit 200")));
assert.ok(!todo.includes("::") && !todo.includes("correctAnswer") && !todo.includes("CLAVE_SECRETA") && !todo.includes("pendiente_revision"));

// 8. Build sin migraciones ni seeds productivos; scripts con confirmación explícita.
const render = fs.readFileSync("render.yaml", "utf8").split("\n").find((l) => l.includes("buildCommand")) ?? "";
assert.ok(!/deploy:db|migrate|seed/.test(render), "build de Render sin migrar/sembrar");
assert.ok(!/deploy:db|migrate|seed/.test(JSON.parse(fs.readFileSync("vercel.json", "utf8")).buildCommand));
for (const f of ["scripts/migrate-production.ts", "scripts/seed-production.ts"]) {
  const src = fs.readFileSync(f, "utf8");
  const guarda = src.indexOf('CONFIRMO_ESCRITURA_PRODUCCION !== "si"');
  assert.ok(guarda > 0 && guarda < src.indexOf("createClient("), `${f}: confirmación antes de conectar`);
}
assert.ok(!fs.readFileSync("scripts/seed-production.ts", "utf8").includes("db.update(paesSubjects)"), "seed no sobrescribe precios");

server.close();
console.log("p0: ok");
