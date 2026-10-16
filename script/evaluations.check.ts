// Chequeo del saneamiento de evaluaciones. Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { toStudentQuestions, toPublicEvaluation } from "../shared/evaluations";

const questionsJson = JSON.stringify([
  { id: 1, question: "¿2+2?", options: ["3", "4", "5", "6"], correctAnswer: 1, explanation: "Suma básica" },
  { id: 2, question: "¿Capital de Chile?", options: ["Lima", "Santiago", "Quito", "Bogotá"], correctAnswer: 1, explanation: "Es Santiago" },
]);

const qs = toStudentQuestions(questionsJson);
assert.equal(qs.length, 2);
assert.deepEqual(qs[0], { id: 1, question: "¿2+2?", options: ["3", "4", "5", "6"] });
assert.ok(!JSON.stringify(qs).includes("correctAnswer"));
assert.ok(!JSON.stringify(qs).includes("explanation"));
assert.deepEqual(toStudentQuestions("{}"), []);

const row = {
  id: "e1", learningObjectiveId: "oa1", evaluationNumber: 1, title: "Eval", description: null,
  releaseDay: 5, releaseWeek: 1, formUrl: "https://forms.example/x", htmlContent: "<p>Respuesta: B</p>",
  questionsJson, totalQuestions: 2, passingScore: 60, generatedAt: null, isRequired: true, createdAt: null,
};
const pub = toPublicEvaluation(row);
const s = JSON.stringify(pub);
assert.ok(!s.includes("correctAnswer") && !s.includes("explanation") && !s.includes("Respuesta: B"));
assert.ok(!("questionsJson" in pub) && !("htmlContent" in pub));
assert.equal(pub.hasQuestions, true);
assert.equal(pub.formUrl, "https://forms.example/x");
assert.equal(toPublicEvaluation({ ...row, questionsJson: null }).hasQuestions, false);

console.log("evaluations.check OK");
