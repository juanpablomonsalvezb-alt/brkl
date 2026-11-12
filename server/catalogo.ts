// Catálogo de conocimiento y versionamiento (H2: IMP-023 sin auditoría ni roles; consultas para H1).
// Diseño: 02 §1–§4 y 04 §5.1, §8 (3e5c488). Tablas: migrations/vortice/0001_catalogo.sql.
// La base hace cumplir identidad, integridad, inmutabilidad y aislamiento; aquí van el flujo,
// la validación del grafo al publicar y las consultas. Acceso por SQL propio, sin modelos Drizzle
// (prueba D4 de E0: drizzle-kit no debe gestionar estas tablas con triggers).
// Fuera de H2: roles y permisos (IMP-022, O4), governance_audit (columnas sin definir en el diseño),
// banco de preguntas (IMP-021), herramienta editorial (IMP-025).
import type { Client, Transaction } from "@libsql/client";
import { randomUUID } from "node:crypto";
import type { ContextoVersion } from "../shared/dominio";
import { validarGrafo, type AristaGrafo, type ErrorGrafo, type GrafoBorrador, type Relacion } from "../shared/grafo";

export type EstadoVersion = "borrador" | "en_revision" | "validada" | "publicada" | "retirada";
export type Continuidad = "compatible" | "ruptura";

export class CatalogoError extends Error {
  constructor(message: string, readonly errores: ErrorGrafo[] = []) { super(message); }
}

type Ejecutor = Pick<Client | Transaction, "execute">;
const fila = async (c: Ejecutor, sql: string, args: (string | number | null)[]) => (await c.execute({ sql, args })).rows[0];

// ── Escritura ─────────────────────────────────────────────────────────────────

export async function crearDominio(c: Ejecutor, d: { levelSubjectId: string; name: string }): Promise<string> {
  const id = randomUUID();
  await c.execute({ sql: "INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES (?, ?, ?)", args: [id, d.levelSubjectId, d.name] });
  return id;
}

// Nueva versión de dominio en borrador. Si hay una publicada, copia sus contenidos (cada uno
// reemplaza a su versión publicada, con continuidad SIN declarar) y sus aristas SIN validar (P-H2-2: cada arista se valida de nuevo). La continuidad la
// declara una persona por contenido (04 §8); sin ella no se publica.
// Lectura y escritura en una sola transacción de escritura: dos llamadas simultáneas no leen el
// mismo número de versión ni copian una publicada que otra transacción acaba de retirar.
// ponytail: transacción interactiva; es una operación editorial poco frecuente, fuera del núcleo
// evaluativo donde C-6 las prohíbe.
async function enTransaccion<T>(c: Client, f: (t: Transaction) => Promise<T>): Promise<T> {
  const t = await c.transaction("write");
  try { const r = await f(t); await t.commit(); return r; } catch (e) { await t.rollback().catch(() => {}); throw e; } finally { t.close(); }
}

export function crearVersionDominio(c: Client, domainId: string, actor: string): Promise<{ id: string; version: number }> {
  return enTransaccion(c, (t) => crearVersionEn(t, domainId, actor));
}

async function crearVersionEn(c: Transaction, domainId: string, actor: string): Promise<{ id: string; version: number }> {
  const max = await fila(c, "SELECT COALESCE(MAX(version), 0) AS v FROM knowledge_domain_versions WHERE domain_id = ?", [domainId]);
  const version = Number(max.v) + 1;
  const id = randomUUID();
  const sentencias = [{ sql: "INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES (?, ?, ?, 'borrador', ?)", args: [id, domainId, version, actor] }];
  const pub = await versionPublicada(c, domainId);
  if (pub) {
    const items = (await c.execute({ sql: "SELECT id, item_id, name, operational_definition FROM knowledge_item_versions WHERE domain_version_id = ? ORDER BY item_id", args: [pub.id] })).rows;
    for (const v of items) {
      const nueva = randomUUID();
      sentencias.push({ sql: "INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition, supersedes_version_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [nueva, String(v.item_id), id, domainId, String(v.name), String(v.operational_definition), String(v.id)] as any });
      // P-H2-4: la versión nueva parte con una COPIA de las asociaciones de la anterior; puede cambiarlas
      // mientras sea editable sin tocar las de la versión anterior.
      for (const [tabla, cols] of VINCULOS) {
        sentencias.push({ sql: `INSERT INTO ${tabla} (item_version_id, ${cols}) SELECT ?, ${cols} FROM ${tabla} WHERE item_version_id = ?`, args: [nueva, String(v.id)] });
      }
    }
    const aristas = (await c.execute({ sql: "SELECT item_id, prerequisite_item_id, relation, alt_group, justification, confidence, validated_by, validated_at FROM knowledge_prerequisites WHERE domain_version_id = ? ORDER BY item_id, prerequisite_item_id", args: [pub.id] })).rows;
    for (const a of aristas) {
      sentencias.push({ sql: "INSERT INTO knowledge_prerequisites (id, domain_version_id, item_id, prerequisite_item_id, relation, alt_group, justification, confidence, validated_by, validated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [randomUUID(), id, a.item_id, a.prerequisite_item_id, a.relation, a.alt_group, a.justification, a.confidence, null, null] as any });
    }
  }
  for (const s of sentencias) await c.execute(s);
  return { id, version };
}

// Agrega un contenido nuevo (código nuevo en el dominio) a una versión editable.
export async function agregarContenido(c: Client, domainVersionId: string, x: { code: string; name: string; operationalDefinition: string }): Promise<{ itemId: string; itemVersionId: string }> {
  const dv = await fila(c, "SELECT domain_id FROM knowledge_domain_versions WHERE id = ?", [domainVersionId]);
  if (!dv) throw new CatalogoError("Versión de dominio inexistente");
  const itemId = randomUUID(), itemVersionId = randomUUID();
  await c.batch([
    { sql: "INSERT INTO knowledge_items (id, domain_id, code) VALUES (?, ?, ?)", args: [itemId, String(dv.domain_id), x.code] },
    { sql: "INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES (?, ?, ?, ?, ?, ?)",
      args: [itemVersionId, itemId, domainVersionId, String(dv.domain_id), x.name, x.operationalDefinition] },
  ], "write");
  return { itemId, itemVersionId };
}

// Edita nombre o definición mientras la versión del dominio no esté publicada (la base lo exige).
export async function editarContenido(c: Ejecutor, itemVersionId: string, x: { name: string; operationalDefinition: string }): Promise<void> {
  await c.execute({ sql: "UPDATE knowledge_item_versions SET name = ?, operational_definition = ? WHERE id = ?", args: [x.name, x.operationalDefinition, itemVersionId] });
}

export async function declararContinuidad(c: Ejecutor, itemVersionId: string, continuidad: Continuidad, actor: string): Promise<void> {
  const r = await c.execute({ sql: "UPDATE knowledge_item_versions SET evidence_continuity = ?, continuity_decided_by = ? WHERE id = ? AND supersedes_version_id IS NOT NULL", args: [continuidad, actor, itemVersionId] });
  if (r.rowsAffected !== 1) throw new CatalogoError("Solo una versión que reemplaza a otra declara continuidad");
}

export async function agregarPrerrequisito(c: Ejecutor, domainVersionId: string, a: {
  itemId: string; prerequisiteItemId: string; relation: Relacion; altGroup?: string | null;
  justification: string; confidence: string;
}): Promise<string> {
  const id = randomUUID();
  await c.execute({ sql: "INSERT INTO knowledge_prerequisites (id, domain_version_id, item_id, prerequisite_item_id, relation, alt_group, justification, confidence, validated_by, validated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, domainVersionId, a.itemId, a.prerequisiteItemId, a.relation, a.altGroup ?? null, a.justification, a.confidence, null, null] });
  return id;
}

// Valida una arista de una versión editable (P-H2-2). Toda arista nace sin validar; la valida otra
// persona que la autora de la versión. La base rechaza validar una versión con aristas
// sin validar, y bloquea las aristas desde `validada` (P-H2-1).
export async function validarArista(c: Ejecutor, prerequisiteId: string, actor: string, ahora: number): Promise<void> {
  // Solo valida una arista pendiente: una validación hecha no se sobrescribe.
  const r = await c.execute({ sql: "UPDATE knowledge_prerequisites SET validated_by = ?, validated_at = ? WHERE id = ? AND validated_by IS NULL", args: [actor, ahora, prerequisiteId] });
  if (r.rowsAffected !== 1) throw new CatalogoError("Arista inexistente o ya validada");
}

// Asociaciones curriculares de UNA versión del contenido (P-H2-4). La base las bloquea desde `validada`
// y exige que sean de la misma asignatura y nivel que el dominio.
const VINCULOS = [["knowledge_item_oas", "curriculum_objective_id"], ["knowledge_item_modules", "learning_objective_id"], ["knowledge_item_resources", "resource_id, role"]] as const;
export type RolRecurso = "explicacion" | "ejemplo" | "repaso";
export async function vincularOA(c: Ejecutor, itemVersionId: string, curriculumObjectiveId: string): Promise<void> {
  await c.execute({ sql: "INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES (?, ?)", args: [itemVersionId, curriculumObjectiveId] });
}
export async function vincularModulo(c: Ejecutor, itemVersionId: string, learningObjectiveId: string): Promise<void> {
  await c.execute({ sql: "INSERT INTO knowledge_item_modules (item_version_id, learning_objective_id) VALUES (?, ?)", args: [itemVersionId, learningObjectiveId] });
}
export async function vincularRecurso(c: Ejecutor, itemVersionId: string, resourceId: string, role: RolRecurso): Promise<void> {
  await c.execute({ sql: "INSERT INTO knowledge_item_resources (item_version_id, resource_id, role) VALUES (?, ?, ?)", args: [itemVersionId, resourceId, role] });
}
const exigirBorrado = (r: { rowsAffected: number }) => { if (r.rowsAffected === 0) throw new Error("El vínculo no existe"); };
export async function desvincularOA(c: Ejecutor, itemVersionId: string, curriculumObjectiveId: string): Promise<void> {
  exigirBorrado(await c.execute({ sql: "DELETE FROM knowledge_item_oas WHERE item_version_id = ? AND curriculum_objective_id = ?", args: [itemVersionId, curriculumObjectiveId] }));
}
export async function desvincularModulo(c: Ejecutor, itemVersionId: string, learningObjectiveId: string): Promise<void> {
  exigirBorrado(await c.execute({ sql: "DELETE FROM knowledge_item_modules WHERE item_version_id = ? AND learning_objective_id = ?", args: [itemVersionId, learningObjectiveId] }));
}
export async function desvincularRecurso(c: Ejecutor, itemVersionId: string, resourceId: string, role: RolRecurso): Promise<void> {
  exigirBorrado(await c.execute({ sql: "DELETE FROM knowledge_item_resources WHERE item_version_id = ? AND resource_id = ? AND role = ?", args: [itemVersionId, resourceId, role] }));
}

// Transiciones del ciclo de vida. `validada` registra al validador (distinto del autor: lo exige la
// base). `publicada` valida el grafo (etapa 1) y retira la publicada anterior DENTRO de la misma
// transacción de escritura que lee el grafo: nadie puede cambiarlo entre la validación y la
// publicación. La base revisa además continuidad, OA y linaje (kdv_publicar_*).
export async function cambiarEstado(c: Client, domainVersionId: string, a: EstadoVersion, actor: string, ahora: number): Promise<void> {
  const dv = await fila(c, "SELECT domain_id, status FROM knowledge_domain_versions WHERE id = ?", [domainVersionId]);
  if (!dv) throw new CatalogoError("Versión de dominio inexistente");
  if (a === "validada") {
    await c.execute({ sql: "UPDATE knowledge_domain_versions SET status = 'validada', validated_by = ? WHERE id = ?", args: [actor, domainVersionId] });
    return;
  }
  if (a === "publicada") {
    await enTransaccion(c, async (t) => {
      const r = validarGrafo(await grafoDeVersion(t, domainVersionId), 1);
      if (!r.ok) throw new CatalogoError("El grafo no se puede publicar", r.errores);
      await t.execute({ sql: "UPDATE knowledge_domain_versions SET status = 'retirada' WHERE domain_id = ? AND status = 'publicada'", args: [String(dv.domain_id)] });
      await t.execute({ sql: "UPDATE knowledge_domain_versions SET status = 'publicada', published_at = ? WHERE id = ?", args: [ahora, domainVersionId] });
    });
    return;
  }
  // Volver a revisión o a borrador anula la validación (P-H2-1): hay que validar de nuevo.
  const extra = a === "borrador" || a === "en_revision" ? ", validated_by = NULL" : "";
  await c.execute({ sql: `UPDATE knowledge_domain_versions SET status = ?${extra} WHERE id = ?`, args: [a, domainVersionId] });
}

// ── Lectura ───────────────────────────────────────────────────────────────────

export async function versionPublicada(c: Ejecutor, domainId: string): Promise<{ id: string; version: number } | null> {
  const r = await fila(c, "SELECT id, version FROM knowledge_domain_versions WHERE domain_id = ? AND status = 'publicada'", [domainId]);
  return r ? { id: String(r.id), version: Number(r.version) } : null;
}

export async function grafoDeVersion(c: Ejecutor, domainVersionId: string): Promise<GrafoBorrador> {
  const nodos = (await c.execute({ sql: "SELECT v.item_id, i.code FROM knowledge_item_versions v JOIN knowledge_items i ON i.id = v.item_id WHERE v.domain_version_id = ? ORDER BY i.code", args: [domainVersionId] })).rows
    .map((x) => ({ itemId: String(x.item_id), code: String(x.code) }));
  const aristas: AristaGrafo[] = (await c.execute({ sql: "SELECT item_id, prerequisite_item_id, relation, alt_group, validated_by FROM knowledge_prerequisites WHERE domain_version_id = ? ORDER BY item_id, prerequisite_item_id", args: [domainVersionId] })).rows
    .map((x) => ({ itemId: String(x.item_id), prerequisiteItemId: String(x.prerequisite_item_id), relation: x.relation as Relacion, altGroup: x.alt_group == null ? null : String(x.alt_group), validatedBy: x.validated_by == null ? null : String(x.validated_by) }));
  return { nodos, aristas };
}

export interface EslabonLinaje { itemVersionId: string; domainVersionId: string; version: number; status: EstadoVersion; continuidad: Continuidad | null }

// Linaje de un contenido: de su versión en la versión de dominio indicada hacia atrás, por
// `supersedes_version_id`. La `continuidad` de cada eslabón describe su relación con el anterior.
export async function linaje(c: Ejecutor, itemVersionId: string): Promise<EslabonLinaje[]> {
  const r = await c.execute({ sql: `
    WITH RECURSIVE l(id, n) AS (
      SELECT ?, 0
      UNION ALL SELECT v.supersedes_version_id, l.n + 1 FROM knowledge_item_versions v JOIN l ON v.id = l.id WHERE v.supersedes_version_id IS NOT NULL AND l.n < 1000
    )
    SELECT v.id, v.domain_version_id, d.version, d.status, v.evidence_continuity FROM l
    JOIN knowledge_item_versions v ON v.id = l.id JOIN knowledge_domain_versions d ON d.id = v.domain_version_id ORDER BY l.n`, args: [itemVersionId] });
  return r.rows.map((x) => ({ itemVersionId: String(x.id), domainVersionId: String(x.domain_version_id), version: Number(x.version), status: x.status as EstadoVersion, continuidad: x.evidence_continuity == null ? null : (x.evidence_continuity as Continuidad) }));
}

// Contexto de versión para `evaluar` (shared/dominio.ts): la versión vigente del contenido es la de
// la versión publicada de su dominio; compatibles son las anteriores alcanzables por eslabones
// `compatible` sin cruzar una `ruptura`. Las demás quedan como anteriores con ruptura, y `evaluar`
// las mantiene separadas (N18 = A; D-1, D-2, D-2b). `retencionVencida` no es del catálogo (H7).
export async function contextoVersion(c: Ejecutor, itemId: string, retencionVencida: boolean): Promise<ContextoVersion | null> {
  const r = await fila(c, `SELECT v.id FROM knowledge_item_versions v JOIN knowledge_domain_versions d ON d.id = v.domain_version_id
    WHERE v.item_id = ? AND d.status = 'publicada'`, [itemId]);
  if (!r) return null;
  const cadena = await linaje(c, String(r.id));
  const compatibles: string[] = [];
  for (let i = 0; i < cadena.length - 1 && cadena[i].continuidad === "compatible"; i++) compatibles.push(cadena[i + 1].itemVersionId);
  return { versionActual: cadena[0].itemVersionId, compatibles, retencionVencida };
}

export interface Diferencias {
  agregados: string[]; retirados: string[]; modificados: string[]; sinCambios: string[];
  aristasAgregadas: string[]; aristasRetiradas: string[]; aristasModificadas: string[];
  // P-H2-4: asociaciones como «código → oa:id», «código → modulo:id» o «código → recurso:id:rol».
  vinculosAgregados: string[]; vinculosRetirados: string[];
}

// Cambios entre dos versiones de un mismo dominio, por código de contenido. Una arista se identifica
// como «código ← código del prerrequisito»; cambia si cambia su relación o su grupo alternativo.
export async function diferencias(c: Ejecutor, versionA: string, versionB: string): Promise<Diferencias> {
  const contenidos = async (id: string) => new Map((await c.execute({ sql: `SELECT i.code, v.name, v.operational_definition FROM knowledge_item_versions v
    JOIN knowledge_items i ON i.id = v.item_id WHERE v.domain_version_id = ?`, args: [id] })).rows.map((x) => [String(x.code), `${x.name}\u0000${x.operational_definition}`]));
  const aristas = async (id: string) => new Map((await c.execute({ sql: `SELECT i.code AS a, p.code AS b, k.relation, k.alt_group FROM knowledge_prerequisites k
    JOIN knowledge_items i ON i.id = k.item_id JOIN knowledge_items p ON p.id = k.prerequisite_item_id WHERE k.domain_version_id = ?`, args: [id] })).rows
    .map((x) => [`${x.a} ← ${x.b}`, `${x.relation}\u0000${x.alt_group ?? ""}`]));
  const filas = (await c.execute({ sql: "SELECT id, domain_id FROM knowledge_domain_versions WHERE id IN (?, ?)", args: [versionA, versionB] })).rows;
  if (filas.length !== (versionA === versionB ? 1 : 2)) throw new CatalogoError("Versión de dominio inexistente");
  if (new Set(filas.map((x) => String(x.domain_id))).size !== 1) throw new CatalogoError("Las versiones deben ser del mismo dominio");
  const vinculos = async (id: string) => new Set((await c.execute({ sql: `
    SELECT i.code || ' → oa:' || o.curriculum_objective_id AS k FROM knowledge_item_oas o JOIN knowledge_item_versions v ON v.id = o.item_version_id JOIN knowledge_items i ON i.id = v.item_id WHERE v.domain_version_id = ?
    UNION ALL SELECT i.code || ' → modulo:' || m.learning_objective_id FROM knowledge_item_modules m JOIN knowledge_item_versions v ON v.id = m.item_version_id JOIN knowledge_items i ON i.id = v.item_id WHERE v.domain_version_id = ?
    UNION ALL SELECT i.code || ' → recurso:' || r.resource_id || ':' || r.role FROM knowledge_item_resources r JOIN knowledge_item_versions v ON v.id = r.item_version_id JOIN knowledge_items i ON i.id = v.item_id WHERE v.domain_version_id = ?`,
    args: [id, id, id] })).rows.map((x) => String(x.k)));
  const [ca, cb, aa, ab, va, vb] = await Promise.all([contenidos(versionA), contenidos(versionB), aristas(versionA), aristas(versionB), vinculos(versionA), vinculos(versionB)]);
  const orden = (s: string[]) => s.sort();
  return {
    agregados: orden([...cb.keys()].filter((k) => !ca.has(k))),
    retirados: orden([...ca.keys()].filter((k) => !cb.has(k))),
    modificados: orden([...cb.keys()].filter((k) => ca.has(k) && ca.get(k) !== cb.get(k))),
    sinCambios: orden([...cb.keys()].filter((k) => ca.get(k) === cb.get(k))),
    aristasAgregadas: orden([...ab.keys()].filter((k) => !aa.has(k))),
    aristasRetiradas: orden([...aa.keys()].filter((k) => !ab.has(k))),
    aristasModificadas: orden([...ab.keys()].filter((k) => aa.has(k) && aa.get(k) !== ab.get(k))),
    vinculosAgregados: orden([...vb].filter((k) => !va.has(k))),
    vinculosRetirados: orden([...va].filter((k) => !vb.has(k))),
  };
}
