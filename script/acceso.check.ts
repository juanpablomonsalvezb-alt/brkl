// Matriz de acceso por rol contra el servidor real (registerRoutes) y una base SQLite EN MEMORIA.
// Nunca toca producción ni db.sqlite. Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

if (process.env.NODE_ENV === "production") throw new Error("acceso.check no debe correr con NODE_ENV=production");
process.env.TEST_DATABASE_URL = ":memory:";

const { sql } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const S = await import("../shared/schema");
const { db } = await import("../server/db");
for (const stmt of await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(S as any))) {
  await db.run(sql.raw(stmt));
}
const { registerRoutes } = await import("../server/routes");
const { users } = await import("../shared/models/auth");

// Datos: estudiante matriculado en ls1, otro estudiante en ls1, estudiante sin matrícula,
// apoderado vinculado y no vinculado, tutor asignado y sin asignar, admin.
const ids = ["admin", "est", "otro", "sinmat", "apo", "apo2", "tutor", "tutor2"];
await db.insert(users).values(ids.map((id) => ({ id })));
await db.insert(S.userProfiles).values([
  { userId: "admin", role: "admin" }, { userId: "est", role: "student" }, { userId: "otro", role: "student" },
  { userId: "sinmat", role: "student" }, { userId: "apo", role: "guardian" }, { userId: "apo2", role: "guardian" },
  { userId: "tutor", role: "tutor" }, { userId: "tutor2", role: "tutor" },
]);
await db.insert(S.levels).values({ id: "1m", name: "1° Medio", programType: "menores", sortOrder: 1 });
await db.insert(S.subjects).values({ id: "mat", name: "Matemática", slug: "matematica" });
await db.insert(S.levelSubjects).values({ id: "ls1", levelId: "1m", subjectId: "mat" });
await db.insert(S.enrollments).values([{ userId: "est", levelSubjectId: "ls1" }, { userId: "otro", levelSubjectId: "ls1" }]);
await db.insert(S.learningObjectives).values({ id: "oa1", levelSubjectId: "ls1", code: "OA 1", title: "Números", weekNumber: 1 });
await db.insert(S.weeklyResources).values({ id: "r1", learningObjectiveId: "oa1", resourceType: "video", title: "Video" });
await db.insert(S.moduleEvaluations).values({
  id: "e1", learningObjectiveId: "oa1", evaluationNumber: 1, title: "Eval", releaseWeek: 1,
  questionsJson: JSON.stringify([{ id: 1, question: "¿2+2?", options: ["3", "4"], correctAnswer: 1, explanation: "PAUTA_SECRETA" }]),
});
await db.insert(S.guardianLinks).values({ guardianUserId: "apo", studentUserId: "est", status: "activo" });
await db.insert(S.portfolioEvidences).values({ id: "pe1", userId: "otro", learningObjectiveId: "oa1", kind: "texto", title: "Privada de otro", content: "x", visibility: "privada" });
await db.insert(S.tutoringCases).values({ id: "tc1", studentId: "est", tutorId: "tutor", learningObjectiveId: "oa1", question: "Duda", status: "asignado" });

const app = express();
app.use(express.json());
app.use((req: any, _res, next) => {
  const u = req.header("x-test-user");
  req.isAuthenticated = () => !!u;
  if (u) req.user = { id: u, claims: { sub: u } };
  next();
});
const server = createServer(app);
await registerRoutes(server, app);
await new Promise<void>((r) => server.listen(0, r));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
const call = async (method: string, path: string, user?: string, body?: unknown) => {
  const res = await fetch(base + path, {
    method, headers: { "content-type": "application/json", ...(user ? { "x-test-user": user } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, text };
};
const espera = async (method: string, path: string, user: string | undefined, status: number, nota: string, body?: unknown) =>
  assert.equal((await call(method, path, user, body)).status, status, `${nota}: ${method} ${path} como ${user ?? "anónimo"}`);

// Rutas académicas privadas: anónimo 401, sin matrícula 403, matriculado y admin 200.
const privadas = [
  "/api/level-subjects/ls1/objectives", "/api/objectives/oa1/resources", "/api/objectives/oa1/module-info",
  "/api/level-subjects/1m-matematica/calendar", "/api/modules/1/access?levelSubjectId=ls1", "/api/modules/1/evaluations?levelSubjectId=ls1",
  "/api/learning-objectives/oa1/evaluations", "/api/evaluations/e1",
];
for (const p of privadas) {
  await espera("GET", p, undefined, 401, "anónimo");
  await espera("GET", p, "sinmat", 403, "sin matrícula");
  await espera("GET", p, "apo", 403, "apoderado no accede al contenido del curso");
  await espera("GET", p, "est", 200, "matriculado");
}
for (const p of privadas.filter((x) => !x.startsWith("/api/evaluations/"))) await espera("GET", p, "admin", 200, "admin");

// Perfil: sin sesión ya no devuelve un admin de desarrollo.
const perfil = await call("GET", "/api/profile");
assert.equal(perfil.status, 401, "perfil anónimo");
assert.ok(!perfil.text.includes("admin"), "sin perfil admin por defecto");

// Calendario: el estudiante ve su calendario real (sin desbloqueo total); el admin, todos los módulos.
const calEst = JSON.parse((await call("GET", "/api/level-subjects/1m-matematica/calendar", "est")).text);
const calAdm = JSON.parse((await call("GET", "/api/level-subjects/1m-matematica/calendar", "admin")).text);
assert.ok(calAdm.modules.every((m: any) => m.isAvailable), "admin: todos disponibles");
assert.ok(calEst.modules.some((m: any) => !m.isAvailable), "estudiante: módulos bloqueados según calendario y avance");

// Datos de otro estudiante.
await espera("GET", "/api/vortice/portafolio/estudiante/otro", "est", 403, "estudiante leyendo portafolio ajeno");
await espera("GET", "/api/familia/estudiantes/otro/resumen", "apo", 404, "apoderado: estudiante no vinculado");
await espera("GET", "/api/familia/estudiantes/est/resumen", "apo2", 404, "apoderado no vinculado");
await espera("GET", "/api/familia/estudiantes/est/resumen", "apo", 200, "apoderado vinculado");
assert.ok([403, 404].includes((await call("GET", "/api/familia/estudiantes/est/resumen", "est")).status), "estudiante en la vista de familia: denegado");

// Tutor: solo sus casos asignados.
await espera("POST", "/api/tutoria/casos/tc1/responder", "tutor2", 404, "tutor no asignado responde", { response: "Hola" });
const casos2 = JSON.parse((await call("GET", "/api/tutoria/casos", "tutor2")).text);
assert.equal(casos2.length, 0, "tutor sin asignación no ve casos");
await espera("GET", "/api/tutoria/casos", "est", 403, "estudiante en vista de tutor");

// Administración: solo admin real; el rol o el id enviados por el cliente no cuentan.
for (const [m, p, b] of [["GET", "/api/admin/analitica/resumen"], ["POST", "/api/admin/levels", { id: "x", name: "x", programType: "menores", sortOrder: 9 }], ["POST", "/api/evaluation-links", []], ["GET", "/api/pdf-proxy?url=x"], ["GET", "/api/drive/folder/x/pdfs"]] as [string, string, unknown?][]) {
  await espera(m, p, undefined, 401, "admin anónimo", b);
  await espera(m, p, "est", 403, "escritura/lectura admin por estudiante", b);
  await espera(m, p, "tutor", 403, "admin por tutor", b);
}
assert.equal((await call("POST", "/api/admin/levels", "est", { id: "x", name: "x", programType: "menores", sortOrder: 9, role: "admin", userId: "admin" })).status, 403, "rol en el cuerpo no autoriza");
await espera("GET", "/api/admin/tutoria/casos", "admin", 200, "admin autorizado");

// Evaluación: la pauta no sale antes de tiempo (consulta, envío, metadatos).
for (const [m, p, b] of [["GET", "/api/evaluations/e1"], ["POST", "/api/evaluations/e1/submit", { answers: [{ questionId: 1, answer: 0 }] }], ["GET", "/api/learning-objectives/oa1/evaluations"], ["GET", "/api/modules/1/evaluations?levelSubjectId=ls1"]] as [string, string, unknown?][]) {
  const r = await call(m, p, "est", b);
  assert.ok(!/PAUTA_SECRETA|correctAnswer|explanation/.test(r.text), `sin pauta: ${p}`);
}

// Evaluación aún no liberada por calendario: denegada antes de servir preguntas o aceptar envíos.
await db.insert(S.learningObjectives).values({ id: "oa30", levelSubjectId: "ls1", code: "OA 30", title: "Futuro", weekNumber: 30 });
await db.insert(S.moduleEvaluations).values({ id: "e30", learningObjectiveId: "oa30", evaluationNumber: 1, title: "Futura", releaseWeek: 30,
  questionsJson: JSON.stringify([{ id: 1, question: "¿x?", options: ["a", "b"], correctAnswer: 0 }]) });
await espera("GET", "/api/evaluations/e30", "est", 403, "evaluación no liberada");
await espera("POST", "/api/evaluations/e30/submit", "est", 403, "envío a evaluación no liberada", { answers: [] });

server.close();
console.log("acceso: ok");
