// Chequeo del repaso espaciado contra una base SQLite en memoria creada desde shared/schema.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "../shared/schema";
import { users } from "../shared/models/auth";
import { answerReviewItem, loadDueReview } from "../server/repaso";

const client = createClient({ url: ":memory:" });
const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
for (const stmt of ddl) await client.execute(stmt);
const db = drizzle(client, { schema });
const { levels, subjects, levelSubjects, enrollments, learningObjectives, moduleEvaluations, evaluationProgress, reviewItems } = schema;

const q = (id: number, correctAnswer: number) => ({ id, question: `P${id}`, options: ["a", "b", "c"], correctAnswer, explanation: `E${id}` });
await db.insert(users).values([{ id: "u1" }, { id: "u2" }]);
await db.insert(levels).values([{ id: "7b", name: "7° Básico", programType: "menores", sortOrder: 1 }]);
await db.insert(subjects).values([
  { id: "s-mat", name: "Matemática", slug: "matematica" },
  { id: "s-len", name: "Lenguaje", slug: "lenguaje" },
]);
await db.insert(levelSubjects).values([
  { id: "ls-mat", levelId: "7b", subjectId: "s-mat" },
  { id: "ls-len", levelId: "7b", subjectId: "s-len" },
]);
await db.insert(enrollments).values([
  { userId: "u1", levelSubjectId: "ls-mat" },
  { userId: "u1", levelSubjectId: "ls-len" },
  { userId: "u2", levelSubjectId: "ls-mat", isActive: false },
]);
await db.insert(learningObjectives).values([
  { id: "oa-mat", levelSubjectId: "ls-mat", code: "OA 1", title: "Enteros", weekNumber: 1 },
  { id: "oa-len", levelSubjectId: "ls-len", code: "OA 1", title: "Lectura", weekNumber: 1 },
]);
await db.insert(moduleEvaluations).values([
  { id: "e-mat", learningObjectiveId: "oa-mat", evaluationNumber: 1, title: "Mat 1", releaseWeek: 1,
    questionsJson: JSON.stringify([q(1, 0), q(2, 1), q(3, 2)]) },
  { id: "e-len", learningObjectiveId: "oa-len", evaluationNumber: 1, title: "Len 1", releaseWeek: 1,
    questionsJson: JSON.stringify([q(1, 0)]) },
]);

// Junio 2026, mediodía en Chile. Un intento antiguo (todo mal) y uno más reciente, que es el que manda.
const dia = (d: number) => new Date(Date.UTC(2026, 5, d, 16));
await db.insert(evaluationProgress).values([
  { userId: "u1", evaluationId: "e-mat", completedAt: dia(1), answersJson: JSON.stringify([]) },
  // P1 bien, P2 mal, P3 sin responder.
  { userId: "u1", evaluationId: "e-mat", completedAt: dia(2), answersJson: JSON.stringify([{ questionId: 1, answer: 0 }, { questionId: 2, answer: 0 }]) },
  { userId: "u1", evaluationId: "e-len", completedAt: dia(2), answersJson: JSON.stringify([{ questionId: 1, answer: 2 }]) },
  { userId: "u2", evaluationId: "e-mat", completedAt: dia(2), answersJson: JSON.stringify([]) },
]);

// Día siguiente: vencen las falladas (P2, P3 de Mat y P1 de Len); P1 de Mat (acertada) espera 3 días.
const s1 = await loadDueReview(db, "u1", dia(3));
assert.equal(s1.today, "2026-06-03");
assert.equal(s1.items.length, 3);
// Alternadas: Lenguaje no queda al final, detrás de las dos de Matemática.
assert.notEqual(s1.items[2].subjectName, "Lenguaje");
assert.ok(s1.items.every((i) => !("correctAnswer" in i) && !("explanation" in i)));
assert.deepEqual(s1.domains.map((d) => [d.levelSubjectId, d.due]).sort(), [["ls-len", 1], ["ls-mat", 2]]);
const mine = async () => (await db.select().from(reviewItems)).filter((r) => r.userId === "u1");
assert.equal((await mine()).length, 4); // un ítem por pregunta, aunque haya dos intentos
// Sincronizar de nuevo no duplica ni reprograma.
await loadDueReview(db, "u1", dia(3));
assert.equal((await mine()).length, 4);

// Por dominio.
assert.deepEqual((await loadDueReview(db, "u1", dia(3), "ls-len")).items.map((i) => i.question), ["P1"]);

// Matrícula inactiva: no hay repaso.
assert.equal((await loadDueReview(db, "u2", dia(3))).items.length, 0);

// Responder: corrige en el servidor y reprograma.
const p2 = s1.items.find((i) => i.subjectName === "Matemática" && i.question === "P2")!;
assert.deepEqual(await answerReviewItem(db, "u1", p2.id, 1, dia(3)),
  { ok: true, correct: true, correctAnswer: 1, explanation: "E2", box: 1, nextDueDay: "2026-06-06" });
// Una vez por vencimiento: repetir hoy no sube otra caja.
assert.deepEqual(await answerReviewItem(db, "u1", p2.id, 1, dia(3)), { ok: false, status: 409, reason: "Este ítem aún no toca repasarlo" });
// Error: vuelve a la caja 0, mañana.
const p3 = s1.items.find((i) => i.question === "P3")!;
assert.deepEqual(await answerReviewItem(db, "u1", p3.id, 0, dia(3)),
  { ok: true, correct: false, correctAnswer: 2, explanation: "E3", box: 0, nextDueDay: "2026-06-04" });
// Ítem ajeno o inexistente: 404.
assert.equal((await answerReviewItem(db, "u2", p3.id, 2, dia(4))).ok, false);
assert.deepEqual(await answerReviewItem(db, "u1", "nope", 0, dia(4)), { ok: false, status: 404, reason: "Ítem de repaso no encontrado" });

// Sin castigo por ausencia: 3 semanas después todo sigue ahí, en su caja.
const vuelta = await loadDueReview(db, "u1", dia(25));
assert.equal(vuelta.items.length, 4);
assert.equal(vuelta.items.find((i) => i.id === p2.id)?.box, 1);

console.log("repaso-db: ok");
