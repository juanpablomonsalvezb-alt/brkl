// Chequeo de la lógica pura del repaso espaciado. Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { INTERVALS, addDays, dayKey, initialSchedule, isDue, pickDue, reschedule } from "../shared/repaso";

assert.deepEqual([...INTERVALS], [1, 3, 7, 16]);
assert.equal(addDays("2026-02-27", 3), "2026-03-02"); // cruza fin de mes
assert.equal(addDays("2026-12-31", 1), "2027-01-01");
// Hora de Chile: 02:00 UTC del 10 de marzo todavía es 9 de marzo en Santiago.
assert.equal(dayKey(new Date("2026-03-10T02:00:00Z")), "2026-03-09");
assert.equal(dayKey(new Date("2026-03-10T15:00:00Z")), "2026-03-10");

// Desde la evaluación: fallada vuelve mañana; acertada, en 3 días.
assert.deepEqual(initialSchedule(false, "2026-04-01"), { box: 0, dueDay: "2026-04-02" });
assert.deepEqual(initialSchedule(true, "2026-04-01"), { box: 1, dueDay: "2026-04-04" });

// Escalera Leitner: aciertos suben, el tope se mantiene en 16 días, un error vuelve a 1 día.
assert.deepEqual(reschedule(0, true, "2026-04-01"), { box: 1, dueDay: "2026-04-04" });
assert.deepEqual(reschedule(1, true, "2026-04-01"), { box: 2, dueDay: "2026-04-08" });
assert.deepEqual(reschedule(2, true, "2026-04-01"), { box: 3, dueDay: "2026-04-17" });
assert.deepEqual(reschedule(3, true, "2026-04-01"), { box: 3, dueDay: "2026-04-17" });
assert.deepEqual(reschedule(3, false, "2026-04-01"), { box: 0, dueDay: "2026-04-02" });
assert.deepEqual(reschedule(99, true, "2026-04-01"), { box: 3, dueDay: "2026-04-17" }); // caja corrupta: se acota

// Sin castigo por días sin estudio: un ítem vencido hace 30 días sigue vencido, en su caja,
// y al acertarlo cuenta desde hoy, no desde el vencimiento.
assert.equal(isDue({ dueDay: "2026-03-01" }, "2026-03-31"), true);
assert.equal(isDue({ dueDay: "2026-04-01" }, "2026-03-31"), false);
assert.deepEqual(reschedule(2, true, "2026-03-31"), { box: 3, dueDay: "2026-04-16" });

// pickDue: solo vencidos, tope, cajas bajas primero y asignaturas alternadas.
const it = (id: string, box: number, dueDay: string, domain: string) => ({ id, box, dueDay, domain });
const pool = [
  it("m1", 0, "2026-04-01", "mat"), it("m2", 0, "2026-04-02", "mat"), it("m3", 2, "2026-03-20", "mat"),
  it("l1", 1, "2026-04-01", "len"), it("h1", 0, "2026-04-03", "his"),
  it("futuro", 0, "2026-04-05", "mat"),
];
assert.deepEqual(pickDue(pool, "2026-04-03").map((i) => i.id), ["m1", "h1", "l1", "m2", "m3"]);
assert.deepEqual(pickDue(pool, "2026-04-03", 2).map((i) => i.id), ["m1", "h1"]);
assert.equal(pickDue(Array.from({ length: 20 }, (_, n) => it(`x${n}`, 0, "2026-04-01", "mat")), "2026-04-03").length, 8);
assert.deepEqual(pickDue(pool, "2026-03-01"), []);

console.log("repaso: ok");
