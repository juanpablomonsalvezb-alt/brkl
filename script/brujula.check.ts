// Chequeo de Brújula™: propuesta pura + persistencia contra SQLite en memoria.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "../shared/schema";
import { users } from "../shared/models/auth";
import { buildOverview, type OverviewSubjectInput } from "../shared/vortice";
import { proposeWeeklyPlan, weekStartOf, previousWeekStart, saveWeekSchema, closeWeekSchema } from "../shared/brujula";
import { getBrujulaWeek, saveBrujulaWeek, closeBrujulaWeek } from "../server/brujula";

// --- Semana: lunes local.
assert.equal(weekStartOf(new Date(2026, 5, 3)), "2026-06-01"); // miércoles
assert.equal(weekStartOf(new Date(2026, 5, 1)), "2026-06-01"); // lunes
assert.equal(weekStartOf(new Date(2026, 5, 7, 23, 59)), "2026-06-01"); // domingo
assert.equal(previousWeekStart("2026-03-02"), "2026-02-23");

// --- Propuesta pura: menos avanzadas primero, solo con pendiente abierto, tope por tramo.
const res = (id: string) => ({ id, title: id, resourceType: "video", sortOrder: 0 });
const subj = (id: string, resIds: string[]): OverviewSubjectInput => ({
  levelSubjectId: id, subjectName: id, subjectSlug: id,
  objectives: [{ id: `oa-${id}`, code: `OA ${id}`, title: id, weekNumber: 1, sortOrder: 0, resources: resIds.map(res) }],
});
const subjects = [subj("A", ["a1", "a2"]), subj("B", ["b1", "b2"]), subj("C", ["c1", "c2"]), subj("D", ["d1"])];
const done = new Set(["a1", "d1"]); // A 50%, B 0%, C 0%, D completa
const media = proposeWeeklyPlan(buildOverview({ id: "2m", name: "2° Medio" }, subjects, done));
assert.equal(media.maxGoals, 4);
assert.deepEqual(media.goals.map((g) => g.objectiveId), ["oa-B", "oa-C", "oa-A"]); // D completa: fuera
assert.match(media.goals[0].reason!, /menos avanza/);
const chica = proposeWeeklyPlan(buildOverview({ id: "2b", name: "2° Básico" }, subjects, done));
assert.deepEqual(chica.goals.map((g) => g.objectiveId), ["oa-B", "oa-C"]); // básica 1-4: máximo 2
assert.equal(proposeWeeklyPlan(buildOverview({ id: "nm1", name: "Adultos" }, subjects, done)).maxGoals, 0);

// --- Validación de entrada.
assert.equal(saveWeekSchema.safeParse({ objectiveIds: ["x", "x"] }).success, false);
assert.equal(saveWeekSchema.safeParse({ objectiveIds: [] }).success, false);
assert.equal(closeWeekSchema.safeParse({ difficulty: "flojera" }).success, false);
assert.equal(closeWeekSchema.safeParse({ difficulty: "nada", note: "x".repeat(281) }).success, false);

// --- Persistencia.
const client = createClient({ url: ":memory:" });
const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
for (const stmt of ddl) await client.execute(stmt);
const db = drizzle(client, { schema });
const { levels, subjects: subjectsT, levelSubjects, enrollments, learningObjectives, weeklyResources, moduleEvaluations } = schema;

await db.insert(users).values([{ id: "u1" }, { id: "u2" }]);
await db.insert(levels).values([{ id: "3b", name: "3° Básico", programType: "menores", sortOrder: 1 }]);
await db.insert(subjectsT).values([
  { id: "s-mat", name: "Matemática", slug: "matematica" },
  { id: "s-len", name: "Lenguaje", slug: "lenguaje" },
  { id: "s-cie", name: "Ciencias", slug: "ciencias" },
]);
await db.insert(levelSubjects).values([
  { id: "ls-mat", levelId: "3b", subjectId: "s-mat" },
  { id: "ls-len", levelId: "3b", subjectId: "s-len" },
  { id: "ls-cie", levelId: "3b", subjectId: "s-cie" },
]);
await db.insert(enrollments).values([
  { userId: "u1", levelSubjectId: "ls-mat" }, { userId: "u1", levelSubjectId: "ls-len" }, { userId: "u1", levelSubjectId: "ls-cie" },
]);
await db.insert(learningObjectives).values([
  { id: "oa-m1", levelSubjectId: "ls-mat", code: "OA 1", title: "Sumas", weekNumber: 1 },
  { id: "oa-m2", levelSubjectId: "ls-mat", code: "OA 2", title: "Restas", weekNumber: 2 },
  { id: "oa-l1", levelSubjectId: "ls-len", code: "OA 1", title: "Lectura", weekNumber: 1 },
  { id: "oa-c1", levelSubjectId: "ls-cie", code: "OA 1", title: "Seres vivos", weekNumber: 1 },
]);
await db.insert(weeklyResources).values([
  { id: "r-m1", learningObjectiveId: "oa-m1", resourceType: "video", title: "Video sumas" },
  { id: "r-m2", learningObjectiveId: "oa-m2", resourceType: "video", title: "Video restas" },
  { id: "r-l1", learningObjectiveId: "oa-l1", resourceType: "video", title: "Video lectura" },
  { id: "r-c1", learningObjectiveId: "oa-c1", resourceType: "video", title: "Video seres vivos" },
]);
await db.insert(moduleEvaluations).values([
  { id: "e-m1", learningObjectiveId: "oa-m1", evaluationNumber: 2, title: "Cierre", releaseWeek: 1 },
]);

const now = new Date(2026, 5, 3); // miércoles 3 de junio de 2026

// Sin plan guardado: propuesta sin guardar, máximo 2 metas (básica 1-4).
const inicial = await getBrujulaWeek(db, "u1", now);
assert.deepEqual([inicial.saved, inicial.weekStart, inicial.track, inicial.maxGoals], [false, "2026-06-01", "basica-1-4", 2]);
assert.equal(inicial.goals.length, 2);
assert.equal((await db.select().from(schema.brujulaWeeks)).length, 0); // GET no escribe

// Cierre sin plan: 404.
assert.equal((await closeBrujulaWeek(db, "u1", now, { difficulty: "nada" })).ok, false);

// Ajuste: más metas que el tope, objetivo inexistente, módulo cerrado, sin matrícula.
assert.deepEqual(await saveBrujulaWeek(db, "u1", now, ["oa-m1", "oa-l1", "oa-c1"]), { ok: false, status: 400, reason: "Máximo 2 metas por semana" });
assert.equal((await saveBrujulaWeek(db, "u1", now, ["nope"]) as any).status, 404);
assert.equal((await saveBrujulaWeek(db, "u1", now, ["oa-m2"]) as any).status, 403); // módulo 1 sin cerrar
assert.equal((await saveBrujulaWeek(db, "u2", now, ["oa-m1"]) as any).status, 403); // sin tramo/matrícula

// Guardar: propuesta conserva su explicación; elegida por el estudiante, reason null.
const propuesto = inicial.goals[0].objectiveId;
const otro = ["oa-m1", "oa-l1", "oa-c1"].find((id) => !inicial.goals.some((g) => g.objectiveId === id))!;
const guardado = await saveBrujulaWeek(db, "u1", now, [propuesto, otro]);
assert.ok(guardado.ok);
assert.equal(guardado.data.saved, true);
assert.ok(guardado.data.goals[0].reason);
assert.equal(guardado.data.goals[1].reason, null);
// Reajustar la misma semana actualiza la misma fila.
assert.ok((await saveBrujulaWeek(db, "u1", now, [otro])).ok);
assert.equal((await db.select().from(schema.brujulaWeeks)).length, 1);
assert.deepEqual((await getBrujulaWeek(db, "u1", now)).goals.map((g) => g.objectiveId), [otro]);

// Cierre: semana actual; nota vacía queda null; luego no se puede ajustar el plan.
const cierre = await closeBrujulaWeek(db, "u1", now, { difficulty: "concentrarme", note: "  " });
assert.ok(cierre.ok);
assert.equal(cierre.data.note, null);
assert.equal((await getBrujulaWeek(db, "u1", now)).reflection?.difficulty, "concentrarme");
assert.equal((await saveBrujulaWeek(db, "u1", now, [otro]) as any).status, 409);
// El lunes siguiente se puede cerrar (o rehacer) la semana anterior, pero no una más antigua.
const lunes = new Date(2026, 5, 8);
assert.ok((await closeBrujulaWeek(db, "u1", lunes, { difficulty: "entender", note: "fracciones", weekStart: "2026-06-01" })).ok);
assert.equal((await closeBrujulaWeek(db, "u1", lunes, { difficulty: "nada", weekStart: "2026-05-25" }) as any).status, 400);
// Semana nueva: vuelve a proponer, sin arrastre ni castigo.
assert.equal((await getBrujulaWeek(db, "u1", lunes)).saved, false);

console.log("brujula: ok");
