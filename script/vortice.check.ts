// Chequeo de la lógica pura de Vórtice. Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { buildOverview, trackForLevel, canViewReflection, type OverviewSubjectInput, type PedagogicalStep } from "../shared/vortice";

assert.equal(trackForLevel("3b"), "basica-1-4");
assert.equal(trackForLevel("7b"), "basica-5-8");
assert.equal(trackForLevel("2m"), "media");
assert.equal(trackForLevel("nm2"), null); // adultos: fuera de Vórtice
assert.equal(trackForLevel("1b"), "basica-1-4");
assert.equal(trackForLevel("4m"), "media");
assert.equal(trackForLevel("xx"), null);
assert.equal(trackForLevel(null), null);

const res = (id: string, sortOrder: number) => ({ id, title: id, resourceType: "video", sortOrder });
const mate: OverviewSubjectInput = {
  levelSubjectId: "ls-mate", subjectName: "Matemática", subjectSlug: "matematica",
  objectives: [
    // Desordenados a propósito: manda el módulo (weekNumber), no el orden del arreglo.
    { id: "oa2", code: "OA 2", title: "Fracciones", weekNumber: 2, sortOrder: 0, resources: [res("m3", 0)] },
    { id: "oa1", code: "OA 1", title: "Números", weekNumber: 1, sortOrder: 0, resources: [res("m2", 1), res("m1", 0)],
      evaluations: [{ id: "e1", title: "Mini evaluación 1", evaluationNumber: 1, available: true }] },
  ],
};
const leng: OverviewSubjectInput = {
  levelSubjectId: "ls-leng", subjectName: "Lenguaje", subjectSlug: "lenguaje",
  objectives: [{ id: "oa9", code: "OA 1", title: "Lectura", weekNumber: 1, sortOrder: 0, resources: [res("l1", 0), res("l2", 1)] }],
};
const vacia: OverviewSubjectInput = { levelSubjectId: "ls-hist", subjectName: "Historia", subjectSlug: "historia", objectives: [] };

const o = buildOverview({ id: "7b", name: "7° Básico" }, [mate, leng, vacia], new Set(["m1", "l1", "l2"]));
assert.equal(o.track, "basica-5-8");
const [m, l, h] = o.subjects;
assert.deepEqual([m.completedItems, m.totalItems, m.percent], [1, 4, 25]);
assert.equal(m.next?.itemId, "m2"); // dentro del OA 1, por sortOrder
assert.equal(m.next?.kind, "resource");
assert.equal(m.currentObjective?.id, "oa1");
assert.equal(l.percent, 100);
assert.equal(l.next, null);
assert.equal(h.percent, null); // sin recursos cargados: sin porcentaje inventado
assert.equal(o.nextStep?.levelSubjectId, "ls-mate"); // la menos avanzada con algo pendiente
assert.deepEqual(o.totals, { totalItems: 6, completedItems: 3, percent: 50 });

// Recursos listos: la evaluación liberada es el siguiente paso.
const conEval = buildOverview(null, [mate], new Set(["m1", "m2"]));
assert.deepEqual([conEval.nextStep?.kind, conEval.nextStep?.itemId], ["evaluation", "e1"]);
// Evaluación aprobada: se avanza al OA siguiente.
assert.equal(buildOverview(null, [mate], new Set(["m1", "m2"]), new Set(["e1"])).nextStep?.itemId, "m3");
// Solo queda una evaluación no liberada: sin siguiente paso, esperando calendario.
const bloqueada: OverviewSubjectInput = { ...leng, objectives: [{ ...leng.objectives[0], evaluations: [{ id: "e9", title: "Eval", evaluationNumber: 3, available: false }] }] };
const espera = buildOverview(null, [bloqueada], new Set(["l1", "l2"]));
assert.equal(espera.nextStep, null);
assert.equal(espera.subjects[0].waitingForRelease, true);

const vacio = buildOverview(null, [], new Set());
assert.deepEqual([vacio.track, vacio.nextStep, vacio.totals.percent], [null, null, null]);

// Secuencia pedagógica (#035): ejemplo → guiada → independiente → reflexión, luego evaluación.
const paso = (id: string, sortOrder: number, pedagogicalStep: PedagogicalStep | null) =>
  ({ id, title: id, resourceType: "video", sortOrder, pedagogicalStep });
const sec: OverviewSubjectInput = {
  levelSubjectId: "ls-sec", subjectName: "Ciencias", subjectSlug: "ciencias",
  objectives: [{ id: "oa-s", code: "OA 1", title: "Célula", weekNumber: 1, sortOrder: 0,
    // sortOrder contradice la secuencia a propósito: manda el paso pedagógico.
    resources: [paso("refl", 0, "reflexion"), paso("indep", 1, "practica_independiente"), paso("guiada", 2, "practica_guiada"),
      paso("ej", 3, "ejemplo"), paso("previo", 9, null)],
    evaluations: [{ id: "ev-s", title: "Eval", evaluationNumber: 1, available: true }] }],
};
const orden: string[] = [];
const hechos = new Set<string>();
for (;;) {
  const n = buildOverview(null, [sec], hechos).nextStep;
  if (!n || n.kind !== "resource") { orden.push(n?.itemId ?? "fin"); break; }
  orden.push(n.itemId); hechos.add(n.itemId);
}
// Sin paso va primero (material previo); luego la secuencia; la evaluación al final.
assert.deepEqual(orden, ["previo", "ej", "guiada", "indep", "refl", "ev-s"]);
assert.equal(buildOverview(null, [sec], new Set(["previo"])).nextStep?.pedagogicalStep, "ejemplo");
// Mismo paso: desempata sortOrder. Sin ningún paso: orden actual por sortOrder (ver m2/m1 arriba).
const dos: OverviewSubjectInput = { ...sec, objectives: [{ ...sec.objectives[0], resources: [paso("b", 5, "ejemplo"), paso("a", 1, "ejemplo")] }] };
assert.equal(buildOverview(null, [dos], new Set()).nextStep?.itemId, "a");
assert.equal(m.next?.pedagogicalStep, null);

// Visibilidad de reflexiones: el estudiante, su tutor asignado o admin.
const alumno = { id: "s1", tutorUserId: "t1" };
assert.equal(canViewReflection({ id: "s1", role: "student" }, alumno), true);
assert.equal(canViewReflection({ id: "t1", role: "tutor" }, alumno), true);
assert.equal(canViewReflection({ id: "t2", role: "tutor" }, alumno), false); // otro tutor
assert.equal(canViewReflection({ id: "a1", role: "admin" }, alumno), true);
assert.equal(canViewReflection({ id: "s2", role: "student" }, alumno), false);
assert.equal(canViewReflection({ id: "t1", role: "student" }, alumno), false); // ya no es tutor
assert.equal(canViewReflection({ id: "t1", role: "tutor" }, { id: "s3", tutorUserId: null }), false);

console.log("vortice: ok");
