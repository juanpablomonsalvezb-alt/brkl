// Chequeo de la lógica pura de Vórtice. Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { buildOverview, trackForLevel, type OverviewSubjectInput } from "../shared/vortice";

assert.equal(trackForLevel("3b"), "basica-1-4");
assert.equal(trackForLevel("7b"), "basica-5-8");
assert.equal(trackForLevel("2m"), "media");
assert.equal(trackForLevel("nm2"), "media");
assert.equal(trackForLevel("xx"), null);
assert.equal(trackForLevel(null), null);

const res = (id: string, sortOrder: number) => ({ id, title: id, resourceType: "video", sortOrder });
const mate: OverviewSubjectInput = {
  levelSubjectId: "ls-mate", subjectName: "Matemática", subjectSlug: "matematica",
  objectives: [
    // Desordenados a propósito: manda el módulo (weekNumber), no el orden del arreglo.
    { id: "oa2", code: "OA 2", title: "Fracciones", weekNumber: 2, sortOrder: 0, resources: [res("m3", 0)] },
    { id: "oa1", code: "OA 1", title: "Números", weekNumber: 1, sortOrder: 0, resources: [res("m2", 1), res("m1", 0)] },
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
assert.deepEqual([m.completedResources, m.totalResources, m.percent], [1, 3, 33]);
assert.equal(m.next?.resourceId, "m2"); // dentro del OA 1, por sortOrder
assert.equal(m.currentObjective?.id, "oa1");
assert.equal(l.percent, 100);
assert.equal(l.next, null);
assert.equal(h.percent, null); // sin recursos cargados: sin porcentaje inventado
assert.equal(o.nextStep?.levelSubjectId, "ls-mate"); // la menos avanzada con algo pendiente
assert.deepEqual(o.totals, { totalResources: 5, completedResources: 3, percent: 60 });

const vacio = buildOverview(null, [], new Set());
assert.deepEqual([vacio.track, vacio.nextStep, vacio.totals.percent], [null, null, null]);

console.log("vortice: ok");
