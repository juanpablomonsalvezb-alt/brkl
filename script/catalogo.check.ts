// IMP-023 (H2) y consultas para H1: flujo de versiones, publicación con validación del grafo,
// linaje, compatibilidad y ruptura, diferencias entre versiones, y el contexto que recibe `evaluar`.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import type { Client } from "@libsql/client";
import {
  agregarContenido, agregarPrerrequisito, cambiarEstado, CatalogoError, contextoVersion, crearDominio, crearVersionDominio,
  declararContinuidad, diferencias, editarContenido, linaje, validarArista, versionPublicada, vincularOA, desvincularOA,
} from "../server/catalogo";
import { migrar } from "../server/migrar";
import { evaluar, type ContextoVersion, type Evidencia } from "../shared/dominio";
import { politicaEjecutable } from "../shared/politica";
import { baseArchivo } from "./lib/basePrueba";
import { aplicarEsquemaHeredado, sembrarFicticios } from "./lib/esquemaHeredado";

const AUTOR = "ficticio-autor", VALIDADOR = "ficticio-validador";
const b = baseArchivo();
const c: Client = b.client;
const prueba = (p: Partial<Parameters<typeof agregarPrerrequisito>[2]> & { itemId: string; prerequisiteItemId: string }) =>
  ({ relation: "necesaria" as const, justification: "requiere representar antes", confidence: "alta", ...p });
const publicar = async (dv: string, t: number) => {
  await cambiarEstado(c, dv, "en_revision", AUTOR, t);
  await cambiarEstado(c, dv, "validada", VALIDADOR, t);
  await cambiarEstado(c, dv, "publicada", VALIDADOR, t);
};
// En las pruebas, «el validador» revisa una por una las aristas que siguen sin validar.
const aristasSinValidar = async (dv: string) => (await c.execute({ sql: "SELECT id FROM knowledge_prerequisites WHERE domain_version_id = ? AND validated_by IS NULL ORDER BY id", args: [dv] })).rows.map((x) => String(x.id));
const resultados: string[] = [];
const hecho = (s: string) => resultados.push(s);

try {
  await aplicarEsquemaHeredado(c);
  await sembrarFicticios(c);
  await migrar(c, "migrations/vortice");
  await c.execute("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa1', 'ls-mat-5b', 'MA05 OA 07', 't', 'https://ejemplo.test/oa', 2018)");

  // ── Versión 1: A ← B ← C (hipotético, 02 §7). ──
  const dom = await crearDominio(c, { levelSubjectId: "ls-mat-5b", name: "Fracciones (hipotético)" });
  const v1 = await crearVersionDominio(c, dom, AUTOR);
  assert.equal(v1.version, 1);
  const A = await agregarContenido(c, v1.id, { code: "HIP-A", name: "Representar fracciones", operationalDefinition: "def A" });
  const B = await agregarContenido(c, v1.id, { code: "HIP-B", name: "Fracciones equivalentes", operationalDefinition: "def B" });
  const C = await agregarContenido(c, v1.id, { code: "HIP-C", name: "Sumar igual denominador", operationalDefinition: "def C" });
  for (const x of [A, B, C]) await vincularOA(c, x.itemVersionId, "oa1");
  await agregarPrerrequisito(c, v1.id, prueba({ itemId: B.itemId, prerequisiteItemId: A.itemId }));
  await agregarPrerrequisito(c, v1.id, prueba({ itemId: C.itemId, prerequisiteItemId: B.itemId }));
  assert.equal(await versionPublicada(c, dom), null, "nada publicado aún");
  assert.equal(await contextoVersion(c, A.itemId, false), null, "sin versión publicada no hay contexto");

  // P-H2-2: las aristas nacen sin validar; las valida otra persona que la autora, una sola vez.
  const [aristaV1] = await aristasSinValidar(v1.id);
  await assert.rejects(validarArista(c, aristaV1, AUTOR, 1), /no valida sus aristas/);
  for (const id of await aristasSinValidar(v1.id)) await validarArista(c, id, VALIDADOR, 1);
  await assert.rejects(validarArista(c, aristaV1, VALIDADOR, 1), /ya validada/, "una validación hecha no se sobrescribe");
  // Validador distinto del autor (la base lo exige).
  await cambiarEstado(c, v1.id, "en_revision", AUTOR, 1);
  await assert.rejects(cambiarEstado(c, v1.id, "validada", AUTOR, 1), /CHECK/);
  await cambiarEstado(c, v1.id, "validada", VALIDADOR, 1);
  await cambiarEstado(c, v1.id, "publicada", VALIDADOR, 1);
  assert.deepEqual(await versionPublicada(c, dom), { id: v1.id, version: 1 });
  hecho("v1 publicada; validador ≠ autor exigido");

  // ── Ciclos y alternativa en etapa 1: la publicación los rechaza con su motivo. ──
  const dom2 = await crearDominio(c, { levelSubjectId: "ls-mat-5b", name: "Con ciclo" });
  const w1 = await crearVersionDominio(c, dom2, AUTOR);
  const X = await agregarContenido(c, w1.id, { code: "X", name: "x", operationalDefinition: "x" });
  const Y = await agregarContenido(c, w1.id, { code: "Y", name: "y", operationalDefinition: "y" });
  for (const x of [X, Y]) await vincularOA(c, x.itemVersionId, "oa1");
  await agregarPrerrequisito(c, w1.id, prueba({ itemId: Y.itemId, prerequisiteItemId: X.itemId }));
  const ciclo = await agregarPrerrequisito(c, w1.id, prueba({ itemId: X.itemId, prerequisiteItemId: Y.itemId }));
  for (const id of await aristasSinValidar(w1.id)) await validarArista(c, id, VALIDADOR, 1);
  await cambiarEstado(c, w1.id, "en_revision", AUTOR, 1);
  await cambiarEstado(c, w1.id, "validada", VALIDADOR, 1);
  await assert.rejects(cambiarEstado(c, w1.id, "publicada", VALIDADOR, 1), (e: unknown) => e instanceof CatalogoError && e.errores.some((x) => x.tipo === "ciclo"));
  assert.equal(await versionPublicada(c, dom2), null, "el ciclo impide publicar y nada queda a medias");
  // Corregir exige volver a revisión (P-H2-1) y validar de nuevo.
  await cambiarEstado(c, w1.id, "en_revision", AUTOR, 1);
  await c.execute({ sql: "DELETE FROM knowledge_prerequisites WHERE id = ?", args: [ciclo] });
  await agregarPrerrequisito(c, w1.id, prueba({ itemId: X.itemId, prerequisiteItemId: Y.itemId, relation: "alternativa", altGroup: "g1" }));
  for (const id of await aristasSinValidar(w1.id)) await validarArista(c, id, VALIDADOR, 1);
  await cambiarEstado(c, w1.id, "validada", VALIDADOR, 1);
  await assert.rejects(cambiarEstado(c, w1.id, "publicada", VALIDADOR, 1), (e: unknown) => e instanceof CatalogoError && e.errores.some((x) => x.tipo === "alternativa_en_etapa_1"));
  hecho("ciclo y alternativa en etapa 1 rechazados al publicar");

  // ── Versión 2: copia v1. B cambia de definición y se declara ruptura; A y C, compatibles. ──
  const v2 = await crearVersionDominio(c, dom, AUTOR);
  const enV = async (dv: string, item: string) => String((await c.execute({ sql: "SELECT id FROM knowledge_item_versions WHERE domain_version_id = ? AND item_id = ?", args: [dv, item] })).rows[0].id);
  const [A2, B2, C2] = [await enV(v2.id, A.itemId), await enV(v2.id, B.itemId), await enV(v2.id, C.itemId)];
  assert.equal((await linaje(c, A2)).map((e) => e.itemVersionId).join(), [A2, A.itemVersionId].join(), "la copia reemplaza a la versión publicada");
  await editarContenido(c, B2, { name: "Fracciones equivalentes", operationalDefinition: "def B revisada: ahora incluye amplificar y simplificar" });
  // P-H2-4: los vínculos se copiaron a cada versión; B2 cambia los suyos sin tocar los de B1.
  const oasDe = async (iv: string) => (await c.execute({ sql: "SELECT curriculum_objective_id AS o FROM knowledge_item_oas WHERE item_version_id = ? ORDER BY o", args: [iv] })).rows.map((x) => String(x.o));
  assert.deepEqual(await oasDe(B2), ["oa1"], "la copia trae los vínculos de la versión publicada");
  await c.execute("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa2', 'ls-mat-5b', 'MA05 OA 08', 't', 'https://ejemplo.test/oa', 2018)");
  await vincularOA(c, B2, "oa2");
  await desvincularOA(c, B2, "oa1");
  assert.deepEqual(await oasDe(B2), ["oa2"]);
  await assert.rejects(desvincularOA(c, B2, "oa1"), /El vínculo no existe/, "quitar un vínculo inexistente falla, no es silencioso");
  await assert.rejects(desvincularOA(c, "no-existe", "oa2"), /El vínculo no existe/, "versión inexistente");
  assert.deepEqual(await oasDe(B.itemVersionId), ["oa1"], "B1 (publicada) conserva su asociación");
  await assert.rejects(vincularOA(c, B.itemVersionId, "oa2"), /no es editable/, "la versión publicada no recibe vínculos");
  await cambiarEstado(c, v2.id, "en_revision", AUTOR, 2);
  await assert.rejects(cambiarEstado(c, v2.id, "validada", VALIDADOR, 2), /sin continuidad declarada/);
  await assert.rejects(declararContinuidad(c, A.itemVersionId, "compatible", AUTOR), /no editable|Solo una versión que reemplaza/, "la versión publicada no cambia");
  await declararContinuidad(c, A2, "compatible", AUTOR);
  await declararContinuidad(c, B2, "ruptura", AUTOR);
  await declararContinuidad(c, C2, "compatible", AUTOR);
  // P-H2-2: las aristas copiadas llegan sin validar; ninguna se publica sin una validación nueva.
  const pendientesV2 = await aristasSinValidar(v2.id);
  assert.equal(pendientesV2.length, 2, "las dos aristas de v1 se copiaron sin su validación");
  await assert.rejects(cambiarEstado(c, v2.id, "validada", VALIDADOR, 2), /arista sin validar/);
  for (const id of pendientesV2) await validarArista(c, id, VALIDADOR, 2);
  await cambiarEstado(c, v2.id, "validada", VALIDADOR, 2);
  // P-H2-1: validada bloquea; para cambiar algo se vuelve a revisión y la validación se anula.
  await assert.rejects(editarContenido(c, B2, { name: "Fracciones equivalentes", operationalDefinition: "cambio tras validar" }), /no editable/);
  await assert.rejects(desvincularOA(c, B2, "oa2"), /no es editable/, "P-H2-4: validada bloquea vínculos");
  await cambiarEstado(c, v2.id, "en_revision", AUTOR, 2);
  const validador = (await c.execute({ sql: "SELECT validated_by FROM knowledge_domain_versions WHERE id = ?", args: [v2.id] })).rows[0].validated_by;
  assert.equal(validador, null, "volver a revisión anula la validación");
  await editarContenido(c, B2, { name: "Fracciones equivalentes", operationalDefinition: "def B revisada tras observación: amplificar, simplificar y comparar" });
  await assert.rejects(cambiarEstado(c, v2.id, "publicada", VALIDADOR, 2), /transición no permitida|El grafo no se puede publicar/, "sin nueva validación no se publica");
  // El cambio de B anuló las aristas que lo tocan: hay que revisarlas antes de validar de nuevo.
  await assert.rejects(cambiarEstado(c, v2.id, "validada", VALIDADOR, 2), /arista sin validar/);
  for (const id of await aristasSinValidar(v2.id)) await validarArista(c, id, VALIDADOR, 2);
  await cambiarEstado(c, v2.id, "validada", VALIDADOR, 2);
  // Cambios entre versiones (antes de publicar).
  const d12 = await diferencias(c, v1.id, v2.id);
  assert.deepEqual({ mod: d12.modificados, sin: d12.sinCambios, ag: d12.agregados, ret: d12.retirados, aa: d12.aristasAgregadas, ar: d12.aristasRetiradas },
    { mod: ["HIP-B"], sin: ["HIP-A", "HIP-C"], ag: [], ret: [], aa: [], ar: [] });
  assert.deepEqual([d12.vinculosAgregados, d12.vinculosRetirados], [["HIP-B → oa:oa2"], ["HIP-B → oa:oa1"]], "P-H2-4: diferencias de vínculos");
  await cambiarEstado(c, v2.id, "publicada", VALIDADOR, 2);
  assert.deepEqual(await versionPublicada(c, dom), { id: v2.id, version: 2 });
  const estadoV1 = (await c.execute({ sql: "SELECT status FROM knowledge_domain_versions WHERE id = ?", args: [v1.id] })).rows[0].status;
  assert.equal(estadoV1, "retirada", "publicar v2 retira v1 en el mismo lote");
  hecho("v2: continuidad, P-H2-2 (aristas copiadas sin validar), P-H2-1 (revisión anula la validación), diferencias y retiro de v1");

  // ── Versión 3: agrega D; B compatible con v2; se retira la arista C ← B y se pone C ← D. ──
  const v3 = await crearVersionDominio(c, dom, AUTOR);
  const [A3, B3, C3] = [await enV(v3.id, A.itemId), await enV(v3.id, B.itemId), await enV(v3.id, C.itemId)];
  const D = await agregarContenido(c, v3.id, { code: "HIP-D", name: "Sumar distinto denominador", operationalDefinition: "def D" });
  await vincularOA(c, D.itemVersionId, "oa1");
  await c.execute({ sql: "DELETE FROM knowledge_prerequisites WHERE domain_version_id = ? AND item_id = ? AND prerequisite_item_id = ?", args: [v3.id, C.itemId, B.itemId] });
  await agregarPrerrequisito(c, v3.id, prueba({ itemId: D.itemId, prerequisiteItemId: B.itemId }));
  await agregarPrerrequisito(c, v3.id, prueba({ itemId: C.itemId, prerequisiteItemId: D.itemId, relation: "contributiva" }));
  for (const [v, k] of [[A3, "compatible"], [B3, "compatible"], [C3, "ruptura"]] as const) await declararContinuidad(c, v, k, AUTOR);
  for (const id of await aristasSinValidar(v3.id)) await validarArista(c, id, VALIDADOR, 3);
  const d23 = await diferencias(c, v2.id, v3.id);
  assert.deepEqual({ ag: d23.agregados, aa: d23.aristasAgregadas, ar: d23.aristasRetiradas }, { ag: ["HIP-D"], aa: ["HIP-C ← HIP-D", "HIP-D ← HIP-B"], ar: ["HIP-C ← HIP-B"] });
  await publicar(v3.id, 3);
  assert.deepEqual(await versionPublicada(c, dom), { id: v3.id, version: 3 });
  hecho("v3: contenido nuevo, aristas cambiadas y diferencias");

  // ── Linaje y contexto para H1. ──
  const linB = await linaje(c, B3);
  assert.deepEqual(linB.map((e) => [e.version, e.continuidad]), [[3, "compatible"], [2, "ruptura"], [1, null]]);
  const ctxA = (await contextoVersion(c, A.itemId, false))!;
  const ctxB = (await contextoVersion(c, B.itemId, false))!;
  const ctxC = (await contextoVersion(c, C.itemId, true))!;
  const ctxD = (await contextoVersion(c, D.itemId, false))!;
  assert.deepEqual(ctxA, { versionActual: A3, compatibles: [A2, A.itemVersionId], retencionVencida: false }, "A: todo compatible");
  assert.deepEqual(ctxB, { versionActual: B3, compatibles: [B2], retencionVencida: false }, "B: la ruptura de v2 corta v1");
  assert.deepEqual(ctxC, { versionActual: C3, compatibles: [], retencionVencida: true }, "C: ruptura en v3");
  assert.deepEqual(ctxD, { versionActual: D.itemVersionId, compatibles: [], retencionVencida: false }, "D: sin anteriores");
  hecho("linaje y contexto: compatibles hasta la primera ruptura");

  // ── Integración con evaluar (H1): el contexto del catálogo separa versiones incompatibles. ──
  const pol = politicaEjecutable({ k6_min_families: 2, k6_separation: "ninguna", assisted_counts: false, wrong_with_help_counts: false,
    error_repaired_counts: false, retired_counts: true, demote_wrong_families: 2, not_mastered_wrong_families: 2 });
  assert.ok(pol.ejecutable);
  let n = 0;
  const ev = (familia: string, correcta: boolean, versionContenido: string): Evidencia => ({ id: `e${++n}`, familia, correcta, conAyuda: false,
    sesion: "S1", dia: "2027-03-01", ocurrida: 1000 + n, secuencia: n, fuente: "practica", versionContenido, anulada: false, familiaRetirada: false });
  const ev_ = (ctx: ContextoVersion, l: Evidencia[]) => evaluar(l, ctx, pol.politica);
  // A: evidencia de v1 (compatible por cadena) cuenta junto con la de v3 → dominado sin marca (TK10).
  assert.deepEqual(ev_(ctxA, [ev("F1", true, A.itemVersionId), ev("F2", true, A3)]), { estado: "dominado", marca: null, motivo: null });
  // B: dominio en v1 (antes de la ruptura) no se suma; hereda solo si v1 por sí sola terminó dominada (D-2).
  assert.deepEqual(ev_(ctxB, [ev("F1", true, B.itemVersionId), ev("F2", true, B.itemVersionId)]), { estado: "dominado", marca: "por_comprobar", motivo: "ruptura" });
  // B: un acierto en v1 y otro en v2 compatible con v3: no se suman (D-1).
  assert.deepEqual(ev_(ctxB, [ev("F1", true, B.itemVersionId), ev("F2", true, B2)]).estado, "incierto");
  // B: K6 completo en v2 + v3 (compatibles) → dominado sin marca.
  assert.deepEqual(ev_(ctxB, [ev("F1", true, B2), ev("F2", true, B3)]), { estado: "dominado", marca: null, motivo: null });
  // B: heredado y dos familias erradas en la vigente → no_dominado (A-1).
  assert.equal(ev_(ctxB, [ev("F1", true, B.itemVersionId), ev("F2", true, B.itemVersionId), ev("F3", false, B3), ev("F4", false, B3)]).estado, "no_dominado");
  // C: retención vencida del contexto llega a evaluar.
  assert.deepEqual(ev_(ctxC, [ev("F1", true, C3), ev("F2", true, C3)]), { estado: "dominado", marca: "por_comprobar", motivo: null });
  hecho("integración con evaluar: TK10, N18 = A, D-1, D-2, A-1 y retención");

  // ── Borradores en paralelo (revisión de código): ambos copian v3; publicado v4, v5 ya no se
  // construye sobre la última publicada y se rechaza; y una versión anterior no se publica después. ──
  const v4 = await crearVersionDominio(c, dom, AUTOR);
  const v5 = await crearVersionDominio(c, dom, AUTOR);
  assert.deepEqual([v4.version, v5.version], [4, 5]);
  for (const dv of [v4.id, v5.id]) for (const item of [A.itemId, B.itemId, C.itemId, D.itemId]) await declararContinuidad(c, await enV(dv, item), "compatible", AUTOR);
  for (const dv of [v4.id, v5.id]) for (const id of await aristasSinValidar(dv)) await validarArista(c, id, VALIDADOR, 5);
  await publicar(v5.id, 5);
  await cambiarEstado(c, v4.id, "en_revision", AUTOR, 6);
  await cambiarEstado(c, v4.id, "validada", VALIDADOR, 6);
  await assert.rejects(cambiarEstado(c, v4.id, "publicada", VALIDADOR, 6), /igual o posterior/);
  assert.deepEqual(await versionPublicada(c, dom), { id: v5.id, version: 5 }, "v5 sigue vigente");
  const v6 = await crearVersionDominio(c, dom, AUTOR);
  const v7 = await crearVersionDominio(c, dom, AUTOR);
  for (const dv of [v6.id, v7.id]) for (const item of [A.itemId, B.itemId, C.itemId, D.itemId]) await declararContinuidad(c, await enV(dv, item), "compatible", AUTOR);
  for (const dv of [v6.id, v7.id]) for (const id of await aristasSinValidar(dv)) await validarArista(c, id, VALIDADOR, 5);
  await publicar(v6.id, 7);
  await assert.rejects(publicar(v7.id, 8), /no reemplaza a su versión en la última publicada/, "v7 se construyó sobre v5, no sobre v6");
  hecho("borradores en paralelo: el linaje se protege al publicar");

  // Publicaciones simultáneas de dos versiones validadas sobre la misma base: a lo más una gana; la
  // otra falla entera (ocupado o linaje). Nunca dos publicadas, nunca un estado a medias.
  const v8 = await crearVersionDominio(c, dom, AUTOR);
  const v9 = await crearVersionDominio(c, dom, AUTOR);
  for (const dv of [v8.id, v9.id]) {
    for (const item of [A.itemId, B.itemId, C.itemId, D.itemId]) await declararContinuidad(c, await enV(dv, item), "compatible", AUTOR);
    for (const id of await aristasSinValidar(dv)) await validarArista(c, id, VALIDADOR, 9);
    await cambiarEstado(c, dv, "en_revision", AUTOR, 9);
    await cambiarEstado(c, dv, "validada", VALIDADOR, 9);
  }
  const carrera = await Promise.allSettled([cambiarEstado(c, v8.id, "publicada", VALIDADOR, 10), cambiarEstado(c, v9.id, "publicada", VALIDADOR, 10)]);
  for (const x of carrera) if (x.status === "rejected") assert.match(String((x.reason as Error).message), /SQLITE_BUSY|igual o posterior|no reemplaza/);
  const publicadas = (await c.execute({ sql: "SELECT COUNT(*) AS n FROM knowledge_domain_versions WHERE domain_id = ? AND status = 'publicada'", args: [dom] })).rows[0].n;
  assert.equal(Number(publicadas), 1, "una sola publicada");
  assert.ok(carrera.filter((x) => x.status === "fulfilled").length <= 1, "a lo más una publicación gana");
  hecho("publicaciones simultáneas: una sola publicada, sin estados a medias");

  // Concurrencia al crear versiones: o se crean con números distintos, o la transacción perdedora
  // falla entera (SQLITE_BUSY en libSQL embebido, sin espera). Nunca un número repetido ni filas a medias.
  const intentos = await Promise.allSettled(Array.from({ length: 5 }, () => crearVersionDominio(c, dom2, AUTOR)));
  const creadas = intentos.flatMap((x) => (x.status === "fulfilled" ? [x.value.version] : []));
  for (const x of intentos) if (x.status === "rejected") assert.match(String((x.reason as Error).message), /SQLITE_BUSY|UNIQUE/);
  const enBase = (await c.execute({ sql: "SELECT version FROM knowledge_domain_versions WHERE domain_id = ? AND version > 1 ORDER BY version", args: [dom2] })).rows.map((x) => Number(x.version));
  assert.deepEqual(enBase, [...creadas].sort((a, b) => a - b), "en la base solo están las versiones que respondieron bien");
  assert.equal(new Set(enBase).size, enBase.length, "sin números repetidos");
  hecho("versiones creadas a la vez: sin números repetidos ni escrituras a medias");

  // ── Aislamiento: diferencias y contexto no cruzan dominios. ──
  await assert.rejects(diferencias(c, v1.id, "no-existe"), /inexistente/);
  await assert.rejects(diferencias(c, v1.id, w1.id), /mismo dominio/);
  const otrasVersiones = (await c.execute({ sql: "SELECT COUNT(*) AS n FROM knowledge_item_versions WHERE item_id = ? AND domain_id <> ?", args: [A.itemId, dom] })).rows[0].n;
  assert.equal(Number(otrasVersiones), 0);
  hecho("aislamiento entre dominios");
} finally {
  await b.cerrar();
}
for (const r of resultados) console.log(`  ✓ ${r}`);
console.log(`catalogo: ok (${resultados.length} bloques)`);
