// IMP-011: evaluar. TK1–TK15 (03 §9.2) con los mismos datos y esperados que E0 (2edf702,
// e0/src/tk.ts), cada uno con las alternativas abiertas de política; los 10 escenarios de 03 §9;
// N18 = A; determinismo. Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { evaluar, type ContextoVersion, type Evidencia } from "../shared/dominio";
import { politicaEjecutable, type PoliticaEjecutable } from "../shared/politica";

// Política SOLO DE PRUEBA (alternativas recomendadas del diseño; ninguna aprobada salvo K6 y N18).
const BASE = {
  k6_min_families: 2, k6_separation: "ninguna", assisted_counts: false, wrong_with_help_counts: false,
  error_repaired_counts: false, retired_counts: true, demote_wrong_families: 2, not_mastered_wrong_families: 2,
} as const;
const pol = (cambios: Partial<PoliticaEjecutable> = {}): PoliticaEjecutable => {
  const r = politicaEjecutable({ ...BASE, ...cambios });
  if (!r.ejecutable) throw new Error(`política de prueba inválida: ${JSON.stringify(r)}`);
  return r.politica;
};
const CTX: ContextoVersion = { versionActual: "v1", compatibles: [], retencionVencida: false };

const D1 = "2027-03-01", D2 = "2027-03-02";
let n = 0;
const ev = (familia: string, correcta: boolean, o: Partial<Evidencia> = {}): Evidencia => ({
  id: `e${++n}`, familia, correcta, conAyuda: false, sesion: "S1", dia: D1, ocurrida: 1000 + n, secuencia: n,
  fuente: "practica", versionContenido: "v1", anulada: false, familiaRetirada: false, ...o,
});

type Variante = { alt: string; pol: Partial<PoliticaEjecutable>; estado: string; marca?: "por_comprobar" | null; motivo?: string };
type Caso = { id: string; nombre: string; ev: Evidencia[]; ctx?: Partial<ContextoVersion>; variantes: Variante[]; origen: "E0" | "H1" };

// Mismos datos y esperados que E0. Donde E0 no fija `marca`, aquí se fija y se indica.
const casos = (): Caso[] => { n = 0; return [
  { id: "TK1", origen: "E0", nombre: "Error F1, acierto F1", ev: [ev("F1", false), ev("F1", true)], variantes: [
    { alt: "recomendada", pol: {}, estado: "incierto" }, { alt: "B escenario 3", pol: { error_repaired_counts: true }, estado: "incierto" }] },
  { id: "TK2", origen: "E0", nombre: "Acierto F1, F2, error F3", ev: [ev("F1", true), ev("F2", true), ev("F3", false)], variantes: [
    { alt: "recomendada", pol: {}, estado: "dominado", marca: "por_comprobar" }, { alt: "B escenario 4", pol: { demote_wrong_families: 1 }, estado: "incierto", motivo: "contradictoria" }] },
  { id: "TK3", origen: "E0", nombre: "Sesiones distintas, mismo día", ev: [ev("F1", true, { sesion: "S1" }), ev("F2", true, { sesion: "S2" })], variantes: [
    { alt: "O2 ninguna", pol: { k6_separation: "ninguna" }, estado: "dominado" }, { alt: "O2 sesion", pol: { k6_separation: "sesion" }, estado: "dominado" }, { alt: "O2 dia", pol: { k6_separation: "dia" }, estado: "incierto" }] },
  { id: "TK4", origen: "E0", nombre: "Misma sesión", ev: [ev("F1", true), ev("F2", true)], variantes: [
    { alt: "O2 ninguna", pol: { k6_separation: "ninguna" }, estado: "dominado" }, { alt: "O2 sesion", pol: { k6_separation: "sesion" }, estado: "incierto" }, { alt: "O2 dia", pol: { k6_separation: "dia" }, estado: "incierto" }] },
  { id: "TK5", origen: "E0", nombre: "Sesiones y días distintos", ev: [ev("F1", true, { sesion: "S1", dia: D1 }), ev("F2", true, { sesion: "S2", dia: D2 })], variantes: [
    { alt: "O2 ninguna", pol: { k6_separation: "ninguna" }, estado: "dominado" }, { alt: "O2 sesion", pol: { k6_separation: "sesion" }, estado: "dominado" }, { alt: "O2 dia", pol: { k6_separation: "dia" }, estado: "dominado" }] },
  { id: "TK6", origen: "E0", nombre: "2 familias, una con ayuda", ev: [ev("F1", true), ev("F2", true, { conAyuda: true })], variantes: [
    { alt: "recomendada", pol: {}, estado: "incierto" }, { alt: "C O3", pol: { assisted_counts: true }, estado: "dominado" }] },
  { id: "TK7", origen: "E0", nombre: "2 familias con ayuda y errores con ayuda", ev: [ev("F1", true, { conAyuda: true }), ev("F2", true, { conAyuda: true }), ev("F3", false, { conAyuda: true }), ev("F4", false, { conAyuda: true })], variantes: [
    { alt: "recomendada", pol: {}, estado: "incierto", motivo: "solo_con_ayuda" }, { alt: "B N16", pol: { wrong_with_help_counts: true }, estado: "no_dominado" }] },
  { id: "TK8", origen: "E0", nombre: "2 familias, se anula F1", ev: [ev("F1", true, { anulada: true }), ev("F2", true)], variantes: [
    { alt: "recomendada", pol: {}, estado: "incierto" }] },
  { id: "TK9", origen: "E0", nombre: "2 familias, se retira F1 sin defecto", ev: [ev("F1", true, { familiaRetirada: true }), ev("F2", true)], variantes: [
    { alt: "recomendada", pol: {}, estado: "dominado" }, { alt: "B N17", pol: { retired_counts: false }, estado: "incierto" }] },
  { id: "TK10", origen: "E0", nombre: "Versión compatible", ev: [ev("F1", true), ev("F2", true)], ctx: { versionActual: "v2", compatibles: ["v1"] }, variantes: [
    { alt: "recomendada", pol: {}, estado: "dominado", marca: null }] },
  { id: "TK11", origen: "E0", nombre: "Versión con ruptura", ev: [ev("F1", true), ev("F2", true)], ctx: { versionActual: "v2" }, variantes: [
    { alt: "N18 = A", pol: {}, estado: "dominado", marca: "por_comprobar", motivo: "ruptura" }] },
  { id: "TK11a", origen: "E0", nombre: "Ruptura + 1 acierto nuevo: no se suma", ev: [ev("F1", true), ev("F2", true), ev("F3", true, { versionContenido: "v2" })], ctx: { versionActual: "v2" }, variantes: [
    { alt: "N18 = A", pol: {}, estado: "dominado", marca: "por_comprobar" }] },
  { id: "TK11b", origen: "E0", nombre: "Ruptura + K6 en versión nueva: retira marca", ev: [ev("F1", true), ev("F2", true), ev("F3", true, { versionContenido: "v2" }), ev("F4", true, { versionContenido: "v2" })], ctx: { versionActual: "v2" }, variantes: [
    { alt: "N18 = A", pol: {}, estado: "dominado", marca: null }] },
  { id: "TK11c", origen: "E0", nombre: "Ruptura + 2 familias erradas nuevas", ev: [ev("F1", true), ev("F2", true), ev("F3", false, { versionContenido: "v2" }), ev("F4", false, { versionContenido: "v2" })], ctx: { versionActual: "v2" }, variantes: [
    { alt: "N18 = A", pol: {}, estado: "no_dominado" }] },
  { id: "TK11d", origen: "E0", nombre: "Ruptura sin dominio previo", ev: [ev("F1", true)], ctx: { versionActual: "v2" }, variantes: [
    { alt: "N18 = A", pol: {}, estado: "sin_evidencia" }] },
  { id: "TK11e", origen: "E0", nombre: "Ruptura + 1 error nuevo", ev: [ev("F1", true), ev("F2", true), ev("F3", false, { versionContenido: "v2" })], ctx: { versionActual: "v2" }, variantes: [
    { alt: "N18 = A", pol: {}, estado: "dominado", marca: "por_comprobar" }] },
  // Casos nuevos de H1: N18 = A exige que la versión anterior, POR SÍ SOLA, estuviera dominada.
  // La referencia de E0 calcula ese dominio mezclando evidencia anterior y nueva (diferencia D-1).
  { id: "TK11f", origen: "H1", nombre: "Ruptura: 1 acierto v1 + 1 acierto v2 no hereda", ev: [ev("F1", true), ev("F2", true, { versionContenido: "v2" })], ctx: { versionActual: "v2" }, variantes: [
    { alt: "N18 = A", pol: {}, estado: "incierto", motivo: "pocas_evidencias" }] },
  { id: "TK11g", origen: "H1", nombre: "Ruptura: v1 dominada y luego contradictoria no hereda", ev: [ev("F1", true), ev("F2", true), ev("F3", false), ev("F4", false)], ctx: { versionActual: "v2" }, variantes: [
    { alt: "N18 = A", pol: {}, estado: "sin_evidencia" }] },
  { id: "TK11h", origen: "H1", nombre: "Dos rupturas: acierto en v1 y en v2 no se suman entre sí", ev: [ev("F1", true), ev("F2", true, { versionContenido: "v2" })], ctx: { versionActual: "v3" }, variantes: [
    { alt: "N18 = A", pol: {}, estado: "sin_evidencia" }] },
  { id: "TK11i", origen: "H1", nombre: "Dos rupturas: v1 dominada por sí sola sí hereda", ev: [ev("F1", true), ev("F2", true), ev("F3", true, { versionContenido: "v2" })], ctx: { versionActual: "v3" }, variantes: [
    { alt: "N18 = A", pol: {}, estado: "dominado", marca: "por_comprobar", motivo: "ruptura" }] },
  // Decisión A-1 (2026-11-11): tras ruptura, dos familias erradas nuevas dan no_dominado con cualquier O1.
  { id: "A1a", origen: "H1", nombre: "A-1: ruptura + 2 errores nuevos, O1 = 3", ev: [ev("F1", true), ev("F2", true), ev("F3", false, { versionContenido: "v2" }), ev("F4", false, { versionContenido: "v2" })], ctx: { versionActual: "v2" }, variantes: [
    { alt: "O1 = 3", pol: { not_mastered_wrong_families: 3 }, estado: "no_dominado" }, { alt: "O1 = 2", pol: { not_mastered_wrong_families: 2 }, estado: "no_dominado" }] },
  { id: "A1b", origen: "H1", nombre: "A-1: ruptura + 1 error nuevo, O1 = 1", ev: [ev("F1", true), ev("F2", true), ev("F3", false, { versionContenido: "v2" })], ctx: { versionActual: "v2" }, variantes: [
    { alt: "O1 = 1", pol: { not_mastered_wrong_families: 1 }, estado: "dominado", marca: "por_comprobar", motivo: "ruptura" }] },
  { id: "A1c", origen: "H1", nombre: "A-1 no toca O1 sin ruptura: 2 errores, O1 = 3", ev: [ev("F1", false), ev("F2", false)], variantes: [
    { alt: "O1 = 3", pol: { not_mastered_wrong_families: 3 }, estado: "incierto" }] },
  // Decisión D-2 (2026-11-11): hereda solo si la versión anterior terminó en `dominado` (TK11g: no).
  { id: "D2a", origen: "H1", nombre: "D-2: v1 dominada con 1 error posterior (sigue dominada) hereda", ev: [ev("F1", true), ev("F2", true), ev("F3", false)], ctx: { versionActual: "v2" }, variantes: [
    { alt: "N18 = A", pol: {}, estado: "dominado", marca: "por_comprobar", motivo: "ruptura" }] },
  { id: "D2b", origen: "H1", nombre: "D-2: v1 cumplió K6 y terminó incierto (escenario 4 B) no hereda", ev: [ev("F1", true), ev("F2", true), ev("F3", false), ev("F4", false)], ctx: { versionActual: "v2" }, variantes: [
    { alt: "escenario 4 B", pol: { demote_wrong_families: 1 }, estado: "sin_evidencia" }] },
  // O3 y N16 son independientes (diferencia D-3 con E0).
  { id: "N16b", origen: "H1", nombre: "O3 = sí, N16 = no: errores con ayuda no cuentan", ev: [ev("F1", true), ev("F2", true), ev("F3", false, { conAyuda: true }), ev("F4", false, { conAyuda: true })], variantes: [
    { alt: "O3 C, N16 A", pol: { assisted_counts: true, wrong_with_help_counts: false }, estado: "dominado", marca: null }] },
  // Escenarios de 03 §9 no cubiertos por TK1–TK15.
  { id: "ESC2", origen: "H1", nombre: "Escenario 2: 2 correctas, misma familia", ev: [ev("F1", true), ev("F1", true)], variantes: [
    { alt: "recomendada", pol: {}, estado: "incierto", motivo: "pocas_evidencias" }] },
  { id: "ESC3b", origen: "H1", nombre: "Escenario 3 tras dominio: error reparado y otro error", ev: [ev("F1", true), ev("F2", true), ev("F3", false), ev("F3", true), ev("F4", false)], variantes: [
    { alt: "recomendada", pol: {}, estado: "dominado", marca: "por_comprobar" }, { alt: "B escenario 3", pol: { error_repaired_counts: true }, estado: "incierto", motivo: "contradictoria" }] },
  { id: "ESC5", origen: "H1", nombre: "Escenario 5: solo una correcta con ayuda", ev: [ev("F1", true, { conAyuda: true })], variantes: [
    { alt: "recomendada", pol: {}, estado: "incierto", motivo: "solo_con_ayuda" }] },
  { id: "ESC10a", origen: "H1", nombre: "Escenario 10: retención fallida tras dominio", ev: [ev("F1", true), ev("F2", true), ev("F3", false, { fuente: "retencion" })], variantes: [
    { alt: "recomendada", pol: {}, estado: "dominado", marca: "por_comprobar" }] },
  { id: "ESC10b", origen: "H1", nombre: "Escenario 10: dos retenciones fallidas en familias distintas", ev: [ev("F1", true), ev("F2", true), ev("F3", false, { fuente: "retencion" }), ev("F4", false, { fuente: "retencion" })], variantes: [
    { alt: "recomendada", pol: {}, estado: "incierto", motivo: "contradictoria" }] },
  { id: "ESC10c", origen: "H1", nombre: "Retención vencida sin error", ev: [ev("F1", true), ev("F2", true)], ctx: { retencionVencida: true }, variantes: [
    { alt: "recomendada", pol: {}, estado: "dominado", marca: "por_comprobar" }] },
  { id: "O1", origen: "H1", nombre: "O1: 2 errores en familias distintas, sin aciertos", ev: [ev("F1", false), ev("F2", false)], variantes: [
    { alt: "O1 = 2", pol: {}, estado: "no_dominado" }, { alt: "O1 = 3", pol: { not_mastered_wrong_families: 3 }, estado: "incierto" }] },
]; };

// Barajado determinista (mismo generador que E0).
const baraja = <T,>(a: T[], s: number) => { const r = [...a]; let x = s; for (let i = r.length - 1; i > 0; i--) { x = (x * 1103515245 + 12345) & 0x7fffffff; const j = x % (i + 1); [r[i], r[j]] = [r[j], r[i]]; } return r; };

const filas: string[] = [];
let total = 0;
for (const c of casos()) {
  const ctx = { ...CTX, ...c.ctx };
  for (const v of c.variantes) {
    const p = pol(v.pol);
    const o = evaluar(c.ev, ctx, p);
    const okEstado = o.estado === v.estado;
    const okMarca = v.marca === undefined || o.marca === v.marca;
    const okMotivo = v.motivo === undefined || o.motivo === v.motivo;
    const json = JSON.stringify(o);
    const determinista = Array.from({ length: 100 }, (_, i) => JSON.stringify(evaluar(baraja(c.ev, i + 1), ctx, p))).every((j) => j === json);
    const ok = okEstado && okMarca && okMotivo && determinista;
    filas.push(`${ok ? "APROBADA " : "RECHAZADA"} ${c.id.padEnd(7)} [${c.origen}] ${v.alt.padEnd(15)} esperado ${v.estado}${v.marca !== undefined ? "/" + v.marca : ""} → ${o.estado}/${o.marca}${o.motivo ? " (" + o.motivo + ")" : ""}${determinista ? "" : " NO DETERMINISTA"}`);
    assert.ok(ok, filas.at(-1));
    total++;
  }
}

// TK12: una corrección docente no es fuente de evidencia.
assert.throws(() => evaluar([ev("F1", true), ev("F2", true), { ...ev("F1", false), fuente: "revision_docente" as any }], CTX, pol()), /Fuente de evidencia no admitida: revision_docente/);
filas.push("APROBADA  TK12    [E0] corrección docente rechazada");
// TK14: evidencia de E2 embargada. El filtro (fuera de H1) decide qué entra; evaluar ordena por la fecha efectiva.
const emb = ev("F1", true, { fuente: "evaluacion_cierre", ocurrida: 1000 }), pra = ev("F2", true, { ocurrida: 2000 });
assert.equal(evaluar([pra], CTX, pol()).estado, "incierto");
assert.equal(evaluar([emb, pra], CTX, pol()).estado, "dominado");
filas.push("APROBADA  TK14    [E0] antes de publicar: incierto; publicada: dominado");
// TK15: política no ejecutable, aunque se fuerce el tipo.
for (const k of Object.keys(BASE)) assert.throws(() => evaluar([], CTX, { ...BASE, [k]: null } as any), /Política no ejecutable/, k);
filas.push(`APROBADA  TK15    [E0] ${Object.keys(BASE).length} parámetros nulos, uno por uno: no se ejecuta`);
filas.push("FUERA     TK13    [E0] idempotencia por client_submission_id: es de persistencia (IMP-031, H3), no de evaluar");

// Determinismo amplio: 2 000 conjuntos aleatorios × 20 órdenes, con todas las combinaciones de política.
const rnd = (() => { let s = 42; return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; })();
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
let conjuntos = 0;
for (let i = 0; i < 2000; i++) {
  n = 0;
  const lista = Array.from({ length: 1 + Math.floor(rnd() * 8) }, () => ev(pick(["F1", "F2", "F3", "F4"]), rnd() < 0.6, {
    conAyuda: rnd() < 0.2, sesion: pick(["S1", "S2"]), dia: pick([D1, D2]), anulada: rnd() < 0.1, familiaRetirada: rnd() < 0.1,
    versionContenido: pick(["v1", "v2"]), fuente: pick(["practica", "retencion", "evaluacion_cierre"]),
  }));
  const p = pol({ k6_separation: pick(["ninguna", "sesion", "dia"]), assisted_counts: rnd() < 0.5, wrong_with_help_counts: rnd() < 0.5,
    error_repaired_counts: rnd() < 0.5, retired_counts: rnd() < 0.5, demote_wrong_families: pick([1, 2]), not_mastered_wrong_families: pick([2, 3]) });
  const ctx = { versionActual: pick(["v1", "v2"]), compatibles: rnd() < 0.5 ? ["v1"] : [], retencionVencida: rnd() < 0.2 };
  const ref = JSON.stringify(evaluar(lista, ctx, p));
  for (let s = 1; s <= 20; s++) assert.equal(JSON.stringify(evaluar(baraja(lista, s * 7919 + i), ctx, p)), ref, `no determinista en el conjunto ${i}`);
  conjuntos++;
}

for (const f of filas) console.log(f);
console.log(`dominio: ok (${total} variantes TK y escenarios, 100 órdenes cada una; ${conjuntos} conjuntos aleatorios × 20 órdenes)`);
