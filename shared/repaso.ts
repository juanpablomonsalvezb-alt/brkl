// Vórtice: repaso espaciado tipo Leitner (lógica pura, sin datos ni UI).
// Cada pregunta ya respondida en una evaluación vive en una "caja". Acertar la sube una caja
// (intervalo más largo); fallar la devuelve a la primera (vuelve mañana). Los días sin estudio
// no castigan: un ítem vencido simplemente espera, conserva su caja y no se acumula castigo.

// Días hasta el próximo repaso según la caja (0..3).
export const INTERVALS = [1, 3, 7, 16] as const;
export const MAX_BOX = INTERVALS.length - 1;
export const MAX_DUE = 8;

// Los días se manejan como "YYYY-MM-DD" en hora de Chile: el colegio vive en ese calendario,
// así que "hoy" no cambia a las 21:00 aunque el servidor corra en UTC.
const DAY_FMT = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" });
export function dayKey(date: Date): string {
  return DAY_FMT.format(date);
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const clampBox = (box: number) => Math.min(Math.max(Math.trunc(box) || 0, 0), MAX_BOX);

// Ítem nuevo desde una evaluación: fallado → caja 0 (mañana); acertado → caja 1 (en 3 días).
export function initialSchedule(correct: boolean, answeredDay: string): { box: number; dueDay: string } {
  const box = correct ? 1 : 0;
  return { box, dueDay: addDays(answeredDay, INTERVALS[box]) };
}

// Respuesta en repaso: acierto sube una caja, error vuelve a la caja 0. Se cuenta desde el día
// en que se responde, no desde el vencimiento: repasar tarde no acorta ni alarga nada.
export function reschedule(box: number, correct: boolean, today: string): { box: number; dueDay: string } {
  const next = correct ? Math.min(clampBox(box) + 1, MAX_BOX) : 0;
  return { box: next, dueDay: addDays(today, INTERVALS[next]) };
}

export function isDue(item: { dueDay: string }, today: string): boolean {
  return item.dueDay <= today;
}

// Vencidos de hoy, máximo `max`. Primero las cajas bajas (lo menos dominado), luego lo más
// antiguo; se alternan asignaturas para que la micropráctica sea acumulativa y mezclada.
export function pickDue<T extends { dueDay: string; box: number; domain: string }>(
  items: readonly T[], today: string, max = MAX_DUE,
): T[] {
  const due = items.filter((i) => isDue(i, today))
    .sort((a, b) => a.box - b.box || a.dueDay.localeCompare(b.dueDay));
  const queues = new Map<string, T[]>();
  for (const i of due) queues.set(i.domain, [...(queues.get(i.domain) ?? []), i]);
  const out: T[] = [];
  while (out.length < max && queues.size) {
    for (const [k, q] of queues) {
      out.push(q.shift()!);
      if (!q.length) queues.delete(k);
      if (out.length >= max) break;
    }
  }
  return out;
}
