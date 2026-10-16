// Chequeo del conversor HTML → questionsJson y de la migración. Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "../shared/schema";
import { htmlToQuestions } from "../shared/evaluationHtml";
import { convertHtmlEvaluations } from "../server/evaluationHtmlMigration";

// 1. Datos JS en <script> (claves sin comillas, comillas simples, coma final, letra como respuesta).
const scriptHtml = `<div id="quiz"></div><script>
  // banco de preguntas
  const preguntas = [
    { pregunta: '1. ¿Cuánto es 2 + 2?', opciones: ['A) 3', 'B) 4', 'C) 5', 'D) 6'], respuesta: 'B', explicacion: "2 + 2 = 4" },
    { question: "¿Capital de Chile?", options: ["Lima", "Santiago", "Quito", "Bogotá"], correctAnswer: 1, },
    { pregunta: "¿Color del cielo?", opciones: [{ texto: "Verde" }, { texto: "Azul", correcta: true }] },
    { pregunta: "Sin respuesta", opciones: ["x", "y"] },
    { pregunta: "Fuera de rango", opciones: ["x", "y"], respuesta: 7 },
  ];
  document.getElementById("quiz").innerText = preguntas.length;
</script>`;
const s = htmlToQuestions(scriptHtml);
assert.equal(s.format, "script");
assert.deepEqual(s.questions[0], { id: 1, question: "¿Cuánto es 2 + 2?", options: ["3", "4", "5", "6"], correctAnswer: 1, explanation: "2 + 2 = 4" });
assert.equal(s.questions[1].correctAnswer, 1);
assert.deepEqual([s.questions[2].options, s.questions[2].correctAnswer], [["Verde", "Azul"], 1]);
assert.deepEqual(s.failed.map((f) => [f.index, f.reason]), [
  [4, "No se detectó la respuesta correcta"],
  [5, 'Respuesta "7" no corresponde a ninguna alternativa'],
]);

// 2. Formulario con radios: data-correct, class en <label>, mapa de respuestas en script y texto oculto.
const radioHtml = `<form>
  <div class="q"><p>1. ¿Qué es un sustantivo?</p>
    <label><input type="radio" name="q1" value="a"> A) Una acción</label>
    <label><input type="radio" name="q1" value="b" data-correct="true"> B) Un nombre</label>
  </div>
  <div class="q"><p>2. ¿Cuál es un verbo?</p>
    <label class="option correct"><input type="radio" name="q2" value="a"> correr</label>
    <label class="option incorrect"><input type="radio" name="q2" value="b"> mesa</label>
  </div>
  <div class="q"><h3>3. ¿Cuál es un adjetivo?</h3>
    <input type="radio" id="q3a" name="q3" value="a"><label for="q3a">azul</label>
    <input type="radio" id="q3b" name="q3" value="b"><label for="q3b">saltar</label>
  </div>
  <div class="q"><p>4. ¿Cuál es un artículo?</p>
    <label><input type="radio" name="q4" value="a"> el</label>
    <label><input type="radio" name="q4" value="b"> de</label>
    <div class="feedback" style="display:none">Respuesta correcta: A. Explicación: "el" es artículo definido.</div>
  </div>
  <div class="q"><p>5. ¿Sin clave?</p>
    <label><input type="radio" name="q5" value="a"> uno</label>
    <label><input type="radio" name="q5" value="b"> dos</label>
  </div>
</form>
<script>const respuestasCorrectas = { q3: "a" };</script>`;
const r = htmlToQuestions(radioHtml);
assert.equal(r.format, "formulario");
assert.deepEqual(r.questions.map((q) => [q.question, q.options, q.correctAnswer]), [
  ["¿Qué es un sustantivo?", ["Una acción", "Un nombre"], 1],
  ["¿Cuál es un verbo?", ["correr", "mesa"], 0],
  ["¿Cuál es un adjetivo?", ["azul", "saltar"], 0],
  ["¿Cuál es un artículo?", ["el", "de"], 0],
]);
assert.deepEqual(r.failed, [{ index: 5, question: "¿Sin clave?", reason: "No se detectó la respuesta correcta" }]);

// 3. Texto: alternativas en líneas, marca ✓, "(correcta)", class="correct", respuesta en línea y pauta final.
const textHtml = `<h2>Evaluación formativa 1</h2>
<p><strong>1.</strong> ¿Qué planeta es el más grande?</p>
<p>a) Marte</p><p>b) Júpiter ✓</p><p>c) Venus</p>
<p>2. Lee el texto.</p><p>¿Cuál es la idea principal?</p>
<ul><li>a) Una</li><li class="correct">b) Otra</li></ul>
<p>3. ¿Cuánto es 3 &times; 3? a) 6 b) 9 c) 12</p>
<p>Respuesta correcta: B</p>
<p>Explicación: tres por tres es nueve.</p>
<p>4. ¿Dos marcadas?</p><p>a) x (correcta)</p><p>b) y (correcta)</p>
<p>5. ¿Una sola alternativa?</p><p>a) única</p>
<p>6. ¿R&iacute;o m&aacute;s largo de Chile?</p><p>a) Loa</p><p>b) Biobío</p>
<h3>Pauta de corrección</h3><p>1-B, 6-A</p>`;
const t = htmlToQuestions(textHtml);
assert.equal(t.format, "texto");
assert.deepEqual(t.questions.map((q) => [q.question, q.options, q.correctAnswer]), [
  ["¿Qué planeta es el más grande?", ["Marte", "Júpiter", "Venus"], 1],
  ["Lee el texto. ¿Cuál es la idea principal?", ["Una", "Otra"], 1],
  ["¿Cuánto es 3 × 3?", ["6", "9", "12"], 1],
  ["¿Río más largo de Chile?", ["Loa", "Biobío"], 0],
]);
assert.equal(t.questions[2].explanation, "tres por tres es nueve.");
assert.deepEqual(t.failed.map((f) => [f.index, f.reason]), [
  [4, "Más de una alternativa marcada como correcta"],
  [5, "Tiene 1 alternativa(s); se necesitan al menos 2"],
]);
// Pauta que contradice la marca en línea: no se elige ninguna.
assert.equal(htmlToQuestions("<p>1. ¿A?</p><p>a) x ✓</p><p>b) y</p><h3>Respuestas</h3><p>1-B</p>").failed[0].reason, "Marcas de respuesta contradictorias");
// "Respuesta: a la izquierda" no es una letra de respuesta.
assert.equal(htmlToQuestions("<p>1. ¿Dónde?</p><p>a) arriba</p><p>b) abajo</p><p>Respuesta: a la izquierda</p>").questions.length, 0);

// 4. Malformados: nada que convertir, sin excepciones.
for (const bad of [
  "", "   ", null, 42, "<p>Hola, sin preguntas</p>", "<div><p>1. ¿Abierta?<p>a) sin cerrar",
  "<script>const preguntas = [{ pregunta: 'x', opciones: ['a', 'b'], respuesta: 0 </script>", // JS truncado
  "<script>const preguntas = [{ pregunta: `${x}`, opciones: [a, b] }];</script>", // expresiones, no datos
  "<input type='radio' name='q1'><input type='radio' name='q1'>", // radios sin texto
  "<<<>>> &bogus; &#99999999; <p",
]) {
  const out = htmlToQuestions(bad);
  assert.equal(out.questions.length, 0, `no debería convertir: ${String(bad)}`);
}
// Truncado a mitad de pregunta: lo completo se convierte, lo cortado se informa.
const cut = htmlToQuestions("<p>1. ¿Uno?</p><p>a) x</p><p>b) y ✓</p><p>2. ¿Dos?</p><p>a) z");
assert.deepEqual([cut.questions.length, cut.failed.map((f) => f.index)], [1, [2]]);

// 5. Migración: simula sin escribir, aplica solo lo 100% convertible y conserva htmlContent.
const client = createClient({ url: ":memory:" });
for (const stmt of await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any))) await client.execute(stmt);
const db = drizzle(client, { schema });
const { levels, subjects, levelSubjects, learningObjectives, moduleEvaluations } = schema;
await db.insert(levels).values([{ id: "7b", name: "7° Básico", programType: "menores", sortOrder: 1 }]);
await db.insert(subjects).values([{ id: "s", name: "Matemática", slug: "matematica" }]);
await db.insert(levelSubjects).values([{ id: "ls", levelId: "7b", subjectId: "s" }]);
await db.insert(learningObjectives).values([{ id: "oa", levelSubjectId: "ls", code: "OA 1", title: "OA", weekNumber: 1 }]);
const okHtml = "<p>1. ¿Uno?</p><p>a) x</p><p>b) y ✓</p>";
await db.insert(moduleEvaluations).values([
  { id: "ok", learningObjectiveId: "oa", evaluationNumber: 1, title: "Completa", releaseWeek: 1, htmlContent: okHtml },
  { id: "parcial", learningObjectiveId: "oa", evaluationNumber: 2, title: "Parcial", releaseWeek: 1, htmlContent: textHtml },
  { id: "nada", learningObjectiveId: "oa", evaluationNumber: 3, title: "Vacía", releaseWeek: 2, htmlContent: "<p>Hola</p>" },
  { id: "ya", learningObjectiveId: "oa", evaluationNumber: 4, title: "IA", releaseWeek: 2, htmlContent: okHtml, questionsJson: "[]" },
]);
const sim = await convertHtmlEvaluations(db, false);
assert.deepEqual(sim.map((i) => [i.id, i.status, i.written]).sort(), [
  ["nada", "sin-preguntas", false], ["ok", "convertible", false], ["parcial", "parcial", false], ["ya", "ya-tiene-preguntas", false],
]);
assert.equal((await db.select().from(moduleEvaluations).where(eq(moduleEvaluations.id, "ok")))[0].questionsJson, null);
const applied = await convertHtmlEvaluations(db, true);
assert.deepEqual(applied.filter((i) => i.written).map((i) => i.id), ["ok"]);
const [ok] = await db.select().from(moduleEvaluations).where(eq(moduleEvaluations.id, "ok"));
assert.equal(ok.htmlContent, okHtml);
assert.equal(ok.totalQuestions, 1);
assert.deepEqual(JSON.parse(ok.questionsJson!), [{ id: 1, question: "¿Uno?", options: ["x", "y"], correctAnswer: 1, explanation: "" }]);
assert.equal((await db.select().from(moduleEvaluations).where(eq(moduleEvaluations.id, "ya")))[0].questionsJson, "[]");
// Segunda pasada: idempotente.
assert.equal((await convertHtmlEvaluations(db, true)).filter((i) => i.written).length, 0);

console.log("evaluation-html: ok");
