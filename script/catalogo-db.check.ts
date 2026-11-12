// IMP-020 (H2): la base hace cumplir identidad, integridad, ciclo de vida, protección histórica y
// aislamiento del catálogo. SQL directo, sin el servicio: prueba la base por sí sola.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import type { Client } from "@libsql/client";
import { migrar, verificarDeriva } from "../server/migrar";
import { baseArchivo } from "./lib/basePrueba";
import { aplicarEsquemaHeredado, sembrarFicticios } from "./lib/esquemaHeredado";

const b = baseArchivo();
const c: Client = b.client;
const ok = (sql: string) => c.execute(sql);
const falla = (sql: string, motivo: RegExp, nombre: string) => assert.rejects(c.execute(sql), motivo, nombre);
let casos = 0;
const caso = async (nombre: string, f: () => Promise<unknown>) => { await f(); casos++; void nombre; };

try {
  await aplicarEsquemaHeredado(c);
  await sembrarFicticios(c);
  assert.deepEqual(await migrar(c, "migrations/vortice"), { aplicadas: ["0001_catalogo.sql"] });
  assert.equal((await verificarDeriva(c)).ok, true);

  // Dominio de Matemática 5° (ls-mat-5b), versión 1 en borrador con A y B; B requiere A.
  await ok("INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES ('dom', 'ls-mat-5b', 'Fracciones'), ('dom-len', 'ls-len-6b', 'Lectura')");
  await ok("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES ('v1', 'dom', 1, 'borrador', 'ficticio-autor'), ('vl1', 'dom-len', 1, 'borrador', 'ficticio-autor')");
  await ok("INSERT INTO knowledge_items (id, domain_id, code) VALUES ('A', 'dom', 'HIP-A'), ('B', 'dom', 'HIP-B'), ('L', 'dom-len', 'LEC-1')");
  await ok("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES ('A1', 'A', 'v1', 'dom', 'Representar fracciones', 'def A'), ('B1', 'B', 'v1', 'dom', 'Equivalentes', 'def B'), ('L1', 'L', 'vl1', 'dom-len', 'Leer', 'def L')");
  const arista = (id: string, dv: string, item: string, pre: string, extra = "'necesaria', NULL") =>
    `INSERT INTO knowledge_prerequisites (id, domain_version_id, item_id, prerequisite_item_id, relation, alt_group, justification, confidence) VALUES ('${id}', '${dv}', '${item}', '${pre}', ${extra}, 'j', 'alta')`;
  await ok(arista("p1", "v1", "B", "A"));

  // Identificadores únicos.
  await caso("código duplicado en el dominio", () => falla("INSERT INTO knowledge_items (id, domain_id, code) VALUES ('A2x', 'dom', 'HIP-A')", /UNIQUE/, "código"));
  await caso("mismo código en otro dominio: permitido", () => ok("INSERT INTO knowledge_items (id, domain_id, code) VALUES ('L2', 'dom-len', 'HIP-A')"));
  await caso("número de versión repetido", () => falla("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES ('v1b', 'dom', 1, 'borrador', 'ficticio-autor')", /UNIQUE/, "versión"));
  await caso("dos versiones del contenido en la misma versión de dominio", () => falla("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES ('A1b', 'A', 'v1', 'dom', 'x', 'y')", /UNIQUE/, "item×versión"));
  await caso("arista repetida", () => falla(arista("p1b", "v1", "B", "A"), /UNIQUE/, "arista"));
  await caso("OA repetido (asignatura, código, año)", async () => {
    await ok("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa1', 'ls-mat-5b', 'MA05 OA 07', 'texto', 'https://ejemplo.test/oa', 2018)");
    await falla("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa1b', 'ls-mat-5b', 'MA05 OA 07', 'otro', 'https://ejemplo.test/oa', 2018)", /UNIQUE/, "OA");
  });

  // Integridad referencial.
  await caso("contenido de otro dominio en esta versión", () => falla("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES ('Lx', 'L', 'v1', 'dom', 'x', 'y')", /FOREIGN KEY/, "dominio cruzado"));
  await caso("domain_id que no corresponde a la versión", () => falla("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES ('Lx2', 'L', 'v1', 'dom-len', 'x', 'y')", /FOREIGN KEY/, "domain_id"));
  await caso("arista a un contenido fuera de la versión", () => falla(arista("p2", "v1", "B", "L"), /FOREIGN KEY/, "arista externa"));
  await caso("arista consigo mismo", () => falla(arista("p3", "v1", "A", "A"), /CHECK/, "autorreferencia"));
  await caso("alternativa sin grupo / grupo sin alternativa", async () => {
    await falla(arista("p4", "v1", "A", "B", "'alternativa', NULL"), /CHECK/, "alternativa sin grupo");
    await falla(arista("p5", "v1", "A", "B", "'necesaria', 'g1'"), /CHECK/, "grupo sin alternativa");
  });
  await caso("fecha de validación sin validador (y al revés)", async () => {
    await falla("INSERT INTO knowledge_prerequisites (id, domain_version_id, item_id, prerequisite_item_id, relation, justification, confidence, validated_at) VALUES ('p6', 'v1', 'A', 'B', 'necesaria', 'j', 'alta', 1)", /CHECK/, "fecha sin validador");
    await falla("UPDATE knowledge_prerequisites SET validated_by = 'ficticio-validador' WHERE id = 'p1'", /CHECK/, "validador sin fecha");
  });
  // P-H2-2 (cierre): ninguna arista nace validada; la valida otra persona que la autora de la versión.
  await caso("P-H2-2: una arista no nace validada", () => falla("INSERT INTO knowledge_prerequisites (id, domain_version_id, item_id, prerequisite_item_id, relation, justification, confidence, validated_by, validated_at) VALUES ('p6c', 'v1', 'A', 'B', 'necesaria', 'j', 'alta', 'ficticio-validador', 1)", /se crea sin validar/, "nace validada"));
  await caso("P-H2-2: la autora de la versión no valida sus aristas", () => falla("UPDATE knowledge_prerequisites SET validated_by = 'ficticio-autor', validated_at = 1 WHERE id = 'p1'", /no valida sus aristas/, "autovalidación"));
  await ok("UPDATE knowledge_prerequisites SET validated_by = 'ficticio-validador', validated_at = 1 WHERE id = 'p1'");
  await caso("P-H2-2: modificar una arista validada sin anular su validación", async () => {
    await falla("UPDATE knowledge_prerequisites SET relation = 'contributiva' WHERE id = 'p1'", /su validación se anula/, "cambio con validación");
    await ok("UPDATE knowledge_prerequisites SET relation = 'contributiva', validated_by = NULL, validated_at = NULL WHERE id = 'p1'");
    await ok("UPDATE knowledge_prerequisites SET relation = 'necesaria' WHERE id = 'p1'");
    await ok("UPDATE knowledge_prerequisites SET validated_by = 'ficticio-validador', validated_at = 1 WHERE id = 'p1'");
  });
  await caso("P-H2-2: cambiar la definición de un contenido anula las aristas que lo tocan", async () => {
    await ok("UPDATE knowledge_item_versions SET operational_definition = 'def A precisada' WHERE id = 'A1'");
    const v = (await c.execute("SELECT validated_by FROM knowledge_prerequisites WHERE id = 'p1'")).rows[0].validated_by;
    assert.equal(v, null, "la arista B ← A perdió su validación");
    await ok("UPDATE knowledge_prerequisites SET validated_by = 'ficticio-validador', validated_at = 1 WHERE id = 'p1'");
  });
  await caso("continuidad sin versión anterior", () => falla("UPDATE knowledge_item_versions SET evidence_continuity = 'compatible', continuity_decided_by = 'ficticio-autor' WHERE id = 'A1'", /CHECK/, "continuidad sin anterior"));

  // Ciclo de vida.
  await caso("borrador → publicada directo", () => falla("UPDATE knowledge_domain_versions SET status = 'publicada', published_at = 1 WHERE id = 'v1'", /transición no permitida/, "salto"));
  await ok("UPDATE knowledge_domain_versions SET status = 'en_revision' WHERE id = 'v1'");
  await caso("validar con contenido sin OA", () => falla("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = 'ficticio-validador' WHERE id = 'v1'", /contenido sin OA/, "OA al validar"));
  await ok("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES ('A1', 'oa1'), ('B1', 'oa1')");
  await caso("validador igual al autor", () => falla("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = 'ficticio-autor' WHERE id = 'v1'", /CHECK/, "autor=validador"));
  await caso("validada sin validador", () => falla("UPDATE knowledge_domain_versions SET status = 'validada' WHERE id = 'v1'", /CHECK/, "sin validador"));
  await ok("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = 'ficticio-validador' WHERE id = 'v1'");
  await caso("P-H2-4: vínculos bloqueados desde validada (no se quita ni agrega OA)", async () => {
    await falla("DELETE FROM knowledge_item_oas WHERE item_version_id = 'B1'", /no es editable/, "quitar OA en validada");
    await falla("INSERT INTO knowledge_item_modules (item_version_id, learning_objective_id) VALUES ('A1', 'lo-mat')", /no es editable/, "agregar módulo en validada");
  });
  await caso("publicada sin fecha", () => falla("UPDATE knowledge_domain_versions SET status = 'publicada' WHERE id = 'v1'", /CHECK/, "fecha"));
  await ok("UPDATE knowledge_domain_versions SET status = 'publicada', published_at = 1 WHERE id = 'v1'");
  await caso("validada → borrador", () => falla("UPDATE knowledge_domain_versions SET status = 'borrador', validated_by = NULL, published_at = NULL WHERE id = 'v1'", /transición no permitida/, "retroceso"));
  await caso("cambiar el número de versión", () => falla("UPDATE knowledge_domain_versions SET version = 9 WHERE id = 'v1'", /transición no permitida/, "número"));
  await caso("borrar una versión publicada", () => falla("DELETE FROM knowledge_domain_versions WHERE id = 'v1'", /solo se puede descartar un borrador/, "borrar"));

  // Protección de versiones históricas: lo publicado no se edita.
  await caso("editar contenido publicado", () => falla("UPDATE knowledge_item_versions SET name = 'otro' WHERE id = 'A1'", /no editable/, "editar"));
  await caso("agregar contenido a versión publicada", async () => {
    await ok("INSERT INTO knowledge_items (id, domain_id, code) VALUES ('C', 'dom', 'HIP-C')");
    await falla("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES ('C1', 'C', 'v1', 'dom', 'c', 'c')", /no es editable/, "agregar");
  });
  await caso("borrar contenido publicado", () => falla("DELETE FROM knowledge_item_versions WHERE id = 'B1'", /no es editable/, "borrar contenido"));
  await caso("agregar, editar o borrar aristas publicadas", async () => {
    await falla(arista("p7", "v1", "A", "B"), /no es editable/, "agregar arista");
    await falla("UPDATE knowledge_prerequisites SET relation = 'contributiva' WHERE id = 'p1'", /no es editable/, "editar arista");
    await falla("DELETE FROM knowledge_prerequisites WHERE id = 'p1'", /no es editable/, "borrar arista");
  });

  // Versión 2: linaje y continuidad.
  await ok("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES ('v2', 'dom', 2, 'borrador', 'ficticio-autor')");
  await caso("reemplazar a una versión de otro contenido", () => falla("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition, supersedes_version_id) VALUES ('A2x', 'A', 'v2', 'dom', 'a', 'a', 'B1')", /FOREIGN KEY/, "otro contenido"));
  await ok("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition, supersedes_version_id) VALUES ('A2', 'A', 'v2', 'dom', 'a', 'a', 'A1'), ('B2', 'B', 'v2', 'dom', 'b2', 'nueva def', 'B1')");
  await caso("P-H2-4: la versión nueva declara sus vínculos sin tocar los de la anterior", async () => {
    await ok("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES ('A2', 'oa1'), ('B2', 'oa1')");
    await ok("INSERT INTO knowledge_item_modules (item_version_id, learning_objective_id) VALUES ('B2', 'lo-mat')");
    await ok("INSERT INTO knowledge_item_resources (item_version_id, resource_id, role) VALUES ('B2', 'wr-mat', 'repaso')");
    const n = async (t: string, v: string) => Number((await c.execute({ sql: `SELECT COUNT(*) AS n FROM ${t} WHERE item_version_id = ?`, args: [v] })).rows[0].n);
    assert.deepEqual([await n("knowledge_item_oas", "B1"), await n("knowledge_item_modules", "B1"), await n("knowledge_item_resources", "B1")], [1, 0, 0], "B1 conserva sus vínculos");
    await ok("DELETE FROM knowledge_item_resources WHERE item_version_id = 'B2'");
    assert.equal(await n("knowledge_item_oas", "B1"), 1, "quitar en B2 no toca B1");
  });
  await caso("reemplazar a una versión no publicada o posterior", async () => {
    await ok("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES ('v3', 'dom', 3, 'borrador', 'ficticio-autor')");
    await falla("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition, supersedes_version_id) VALUES ('A3', 'A', 'v3', 'dom', 'a', 'a', 'A2')", /solo reemplaza una versión publicada anterior/, "borrador");
    await falla("UPDATE knowledge_item_versions SET supersedes_version_id = 'A2' WHERE id = 'A2'", /CHECK|solo reemplaza/, "a sí misma");
  });
  await caso("continuidad sin quien decide", () => falla("UPDATE knowledge_item_versions SET evidence_continuity = 'ruptura' WHERE id = 'B2'", /CHECK/, "decidido por"));
  await ok("UPDATE knowledge_domain_versions SET status = 'en_revision' WHERE id = 'v2'");
  await caso("validar sin declarar continuidad", () => falla("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = 'ficticio-validador' WHERE id = 'v2'", /sin continuidad declarada/, "continuidad"));
  await ok("UPDATE knowledge_item_versions SET evidence_continuity = 'compatible', continuity_decided_by = 'ficticio-autor' WHERE id = 'A2'");
  await ok("UPDATE knowledge_item_versions SET evidence_continuity = 'ruptura', continuity_decided_by = 'ficticio-autor' WHERE id = 'B2'");
  // P-H2-2: una arista copiada llega sin validar y bloquea la validación de la versión.
  await ok("INSERT INTO knowledge_prerequisites (id, domain_version_id, item_id, prerequisite_item_id, relation, alt_group, justification, confidence) VALUES ('p2v', 'v2', 'B', 'A', 'necesaria', NULL, 'j', 'alta')");
  await caso("P-H2-2: validar la versión con una arista sin validar", () => falla("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = 'ficticio-validador' WHERE id = 'v2'", /arista sin validar/, "arista sin validar"));
  await caso("P-H2-2: la autora de v2 no valida la arista copiada", () => falla("UPDATE knowledge_prerequisites SET validated_by = 'ficticio-autor', validated_at = 2 WHERE id = 'p2v'", /no valida sus aristas/, "autovalidación copia"));
  await ok("UPDATE knowledge_prerequisites SET validated_by = 'ficticio-validador', validated_at = 2 WHERE id = 'p2v'");
  await ok("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = 'ficticio-validador' WHERE id = 'v2'");
  // P-H2-1: desde `validada` nada se edita; volver a revisión anula la validación y obliga a validar de nuevo.
  await caso("P-H2-1: validada bloquea contenidos y aristas", async () => {
    await falla("UPDATE knowledge_item_versions SET name = 'cambio tardío' WHERE id = 'A2'", /no editable/, "editar contenido validado");
    await falla("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES ('C2x', 'C', 'v2', 'dom', 'c', 'c')", /no es editable/, "agregar contenido validado");
    await falla("DELETE FROM knowledge_item_versions WHERE id = 'B2'", /no es editable/, "borrar contenido validado");
    await falla("UPDATE knowledge_item_versions SET evidence_continuity = 'compatible' WHERE id = 'B2'", /no editable/, "continuidad validada");
    await falla("UPDATE knowledge_prerequisites SET relation = 'contributiva' WHERE id = 'p2v'", /no es editable/, "editar arista validada");
    await falla("UPDATE knowledge_prerequisites SET validated_by = NULL, validated_at = NULL WHERE id = 'p2v'", /no es editable/, "desvalidar arista");
  });
  await caso("P-H2-1: volver a revisión conservando la validación", () => falla("UPDATE knowledge_domain_versions SET status = 'en_revision' WHERE id = 'v2'", /transición no permitida/, "validación conservada"));
  await caso("P-H2-1: la validación anterior no sirve tras modificar", async () => {
    await ok("UPDATE knowledge_domain_versions SET status = 'en_revision', validated_by = NULL WHERE id = 'v2'");
    await ok("UPDATE knowledge_item_versions SET operational_definition = 'nueva def corregida' WHERE id = 'B2'");
    await falla("UPDATE knowledge_domain_versions SET status = 'publicada', published_at = 2 WHERE id = 'v2'", /transición no permitida/, "publicar sin revalidar");
    const v = (await c.execute("SELECT validated_by FROM knowledge_domain_versions WHERE id = 'v2'")).rows[0].validated_by;
    assert.equal(v, null, "la validación anterior quedó anulada");
    // Cambió B: la arista B ← A perdió su validación y bloquea la nueva validación hasta revisarla.
    await falla("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = 'ficticio-validador' WHERE id = 'v2'", /arista sin validar/, "arista tocada por el cambio");
    await ok("UPDATE knowledge_prerequisites SET validated_by = 'ficticio-validador', validated_at = 3 WHERE id = 'p2v'");
    await ok("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = 'ficticio-validador' WHERE id = 'v2'");
  });
  await caso("publicar v2 retirando v1 en un lote", () => c.batch([
    "UPDATE knowledge_domain_versions SET status = 'retirada' WHERE id = 'v1'",
    "UPDATE knowledge_domain_versions SET status = 'publicada', published_at = 2 WHERE id = 'v2'",
  ], "write"));
  await caso("la versión retirada sigue protegida", () => falla("UPDATE knowledge_item_versions SET name = 'otro' WHERE id = 'A1'", /no editable/, "retirada"));
  await caso("retirada no vuelve a publicada", () => falla("UPDATE knowledge_domain_versions SET status = 'publicada' WHERE id = 'v1'", /transición no permitida/, "retirada→publicada"));
  await caso("cambiar continuidad ya publicada", () => falla("UPDATE knowledge_item_versions SET evidence_continuity = 'compatible' WHERE id = 'B2'", /no editable/, "continuidad publicada"));

  // Correcciones de la revisión de código.
  await caso("cambiar el reemplazado exige volver a declarar la continuidad", async () => {
    await ok("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition, supersedes_version_id, evidence_continuity, continuity_decided_by) VALUES ('A3', 'A', 'v3', 'dom', 'a', 'a', 'A2', 'compatible', 'ficticio-autor')");
    await ok("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES ('A3', 'oa1')");
    await falla("UPDATE knowledge_item_versions SET supersedes_version_id = 'A1' WHERE id = 'A3'", /debe declararse de nuevo/, "continuidad heredada");
    await ok("UPDATE knowledge_item_versions SET supersedes_version_id = 'A1', evidence_continuity = NULL, continuity_decided_by = NULL WHERE id = 'A3'");
  });
  await caso("publicar sin reemplazar la versión de la última publicada", async () => {
    // A3 reemplaza a A1 (retirada) en vez de a A2 (vigente); B no está en v3: se puede quitar.
    await ok("UPDATE knowledge_item_versions SET evidence_continuity = 'ruptura', continuity_decided_by = 'ficticio-autor' WHERE id = 'A3'");
    await ok("UPDATE knowledge_domain_versions SET status = 'en_revision' WHERE id = 'v3'");
    await ok("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = 'ficticio-validador' WHERE id = 'v3'");
    await assert.rejects(c.batch(["UPDATE knowledge_domain_versions SET status = 'retirada' WHERE id = 'v2'", "UPDATE knowledge_domain_versions SET status = 'publicada', published_at = 3 WHERE id = 'v3'"], "write"), /no reemplaza a su versión en la última publicada/);
    // Un contenido que existía en la base y aparece sin reemplazarla también se rechaza
    // (para editar, v3 vuelve a revisión y se valida de nuevo: P-H2-1).
    await ok("UPDATE knowledge_domain_versions SET status = 'en_revision', validated_by = NULL WHERE id = 'v3'");
    await ok("UPDATE knowledge_item_versions SET supersedes_version_id = NULL, evidence_continuity = NULL, continuity_decided_by = NULL WHERE id = 'A3'");
    await ok("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = 'ficticio-validador' WHERE id = 'v3'");
    await assert.rejects(c.batch(["UPDATE knowledge_domain_versions SET status = 'retirada' WHERE id = 'v2'", "UPDATE knowledge_domain_versions SET status = 'publicada', published_at = 3 WHERE id = 'v3'"], "write"), /no reemplaza a su versión en la última publicada/);
    const estado = (await c.execute("SELECT status FROM knowledge_domain_versions WHERE id = 'v2'")).rows[0].status;
    assert.equal(estado, "publicada", "el lote rechazado no retira v2");
  });
  await caso("vínculos: no se reescriben; la asignatura de un OA no cambia", async () => {
    await falla("UPDATE knowledge_item_oas SET curriculum_objective_id = 'oa1' WHERE item_version_id = 'A1'", /no se modifica/, "update OA");
    await falla("UPDATE curriculum_objectives SET level_subject_id = 'ls-len-6b' WHERE id = 'oa1'", /asignatura no cambia/, "asignatura del OA");
  });
  await caso("P-H2-4: vínculos de versiones publicadas o retiradas no cambian", async () => {
    await ok("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa2', 'ls-mat-5b', 'MA05 OA 08', 't', 'https://ejemplo.test/oa', 2018)");
    await falla("DELETE FROM knowledge_item_oas WHERE item_version_id = 'A1'", /no es editable/, "quitar OA retirado");
    await falla("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES ('A2', 'oa2')", /no es editable/, "agregar OA publicado");
    await falla("DELETE FROM knowledge_item_modules WHERE item_version_id = 'B2'", /no es editable/, "quitar módulo publicado");
    const filas = (await c.execute("SELECT item_version_id || ':' || curriculum_objective_id AS k FROM knowledge_item_oas WHERE item_version_id IN ('A1','B1','A2','B2') ORDER BY k")).rows.map((x) => x.k);
    assert.deepEqual(filas, ["A1:oa1", "A2:oa1", "B1:oa1", "B2:oa1"], "asociaciones históricas intactas");
  });

  // Aislamiento entre asignaturas, sobre una versión editable (v4 en borrador).
  await ok("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES ('v4', 'dom', 4, 'borrador', 'ficticio-autor')");
  await ok("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition, supersedes_version_id, evidence_continuity, continuity_decided_by) VALUES ('A4', 'A', 'v4', 'dom', 'a', 'a', 'A2', 'compatible', 'ficticio-autor')");
  await caso("OA de otra asignatura", async () => {
    await ok("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa-len', 'ls-len-6b', 'LE06 OA 01', 't', 'https://ejemplo.test/len', 2018)");
    await falla("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES ('A4', 'oa-len')", /otra asignatura/, "OA cruzado");
  });
  await caso("módulo de otra asignatura", () => falla("INSERT INTO knowledge_item_modules (item_version_id, learning_objective_id) VALUES ('A4', 'lo-len')", /otra asignatura/, "módulo cruzado"));
  await caso("recurso de otra asignatura", () => falla("INSERT INTO knowledge_item_resources (item_version_id, resource_id, role) VALUES ('A4', 'wr-len', 'repaso')", /otra asignatura/, "recurso cruzado"));
  await caso("vínculos de la misma asignatura: permitidos", async () => {
    await ok("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES ('A4', 'oa1')");
    await ok("INSERT INTO knowledge_item_modules (item_version_id, learning_objective_id) VALUES ('A4', 'lo-mat')");
    await ok("INSERT INTO knowledge_item_resources (item_version_id, resource_id, role) VALUES ('A4', 'wr-mat', 'explicacion')");
    await falla("INSERT INTO knowledge_item_resources (item_version_id, resource_id, role) VALUES ('A4', 'wr-mat', 'otro')", /CHECK/, "rol");
  });
  await caso("P-H2-4: validar y publicar revisan la integridad de las asociaciones", async () => {
    // Se salta la barrera de inserción para simular una asociación corrupta; luego se restaura.
    const sqlTrigger = String((await c.execute("SELECT sql FROM sqlite_master WHERE name = 'kio_misma_asignatura'")).rows[0].sql);
    await ok("DROP TRIGGER kio_misma_asignatura");
    await ok("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES ('A4', 'oa-len')");
    await ok("UPDATE knowledge_domain_versions SET status = 'en_revision' WHERE id = 'v4'");
    await falla("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = 'ficticio-validador' WHERE id = 'v4'", /asociación de otra asignatura/, "integridad al validar");
    await ok("DELETE FROM knowledge_item_oas WHERE item_version_id = 'A4' AND curriculum_objective_id = 'oa-len'");
    await ok("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = 'ficticio-validador' WHERE id = 'v4'");
    // Corrupción después de validar (saltando también el bloqueo): publicar la detecta.
    const sqlBloqueo = String((await c.execute("SELECT sql FROM sqlite_master WHERE name = 'kio_bloqueo_insert'")).rows[0].sql);
    await ok("DROP TRIGGER kio_bloqueo_insert");
    await ok("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES ('A4', 'oa-len')");
    await falla("UPDATE knowledge_domain_versions SET status = 'publicada', published_at = 4 WHERE id = 'v4'", /asociación de otra asignatura/, "integridad al publicar");
    await ok("UPDATE knowledge_domain_versions SET status = 'en_revision', validated_by = NULL WHERE id = 'v4'");
    await ok("DELETE FROM knowledge_item_oas WHERE item_version_id = 'A4' AND curriculum_objective_id = 'oa-len'");
    await ok(sqlBloqueo);
    await ok(sqlTrigger);
    await ok("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = 'ficticio-validador' WHERE id = 'v4'");
  });

  // Identidad estable.
  await caso("mover un contenido de dominio", () => falla("UPDATE knowledge_items SET domain_id = 'dom-len' WHERE id = 'A'", /identidad inmutable/, "contenido"));
  await caso("cambiar la asignatura de un dominio", () => falla("UPDATE knowledge_domains SET level_subject_id = 'ls-len-6b' WHERE id = 'dom'", /identidad inmutable/, "dominio"));
  await caso("borrar un contenido con versiones", () => falla("DELETE FROM knowledge_items WHERE id = 'A'", /FOREIGN KEY/, "borrar contenido"));

  // Una sola publicada por dominio (índice parcial), probada con otra versión que sí cumple todo.
  await caso("dos publicadas a la vez", async () => {
    await falla("UPDATE knowledge_domain_versions SET status = 'publicada', published_at = 4 WHERE id = 'v4'", /UNIQUE/, "una publicada");
  });

  assert.equal((await verificarDeriva(c)).ok, true, "sin deriva tras las pruebas");
} finally {
  await b.cerrar();
}
console.log(`catalogo-db: ok (${casos} casos)`);
