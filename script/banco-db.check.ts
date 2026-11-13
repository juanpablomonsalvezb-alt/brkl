// IMP-021: la base hace cumplir el banco de preguntas (familias, versiones y anulaciones). SQL directo,
// sin servicio: prueba la migración 0002_banco por sí sola. Pruebas B1–B22 de la matriz de IMP-021;
// B23 (regresión H0–H2, dos corridas) y B24 (tsc, build, H1 y E0 intactos) se ejecutan fuera de este
// archivo. Cada caso imprime su identificador para registrar el resultado.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { Client, InArgs } from "@libsql/client";
import { crearVersionDominio } from "../server/catalogo";
import { migrar, verificarDeriva } from "../server/migrar";
import { baseArchivo } from "./lib/basePrueba";
import { aplicarEsquemaHeredado, sembrarFicticios } from "./lib/esquemaHeredado";

const b = baseArchivo();
const c: Client = b.client;
const AUTOR = "ficticio-autor", REV = "ficticio-validador", OTRO = "ficticio-otro";
const OPC = JSON.stringify([{ id: "o1", texto: "Uno" }, { id: "o2", texto: "Dos" }]);
const ok = (sql: string, args: InArgs = []) => c.execute({ sql, args });
const falla = (sql: string, args: InArgs, motivo: RegExp, nombre: string) => assert.rejects(c.execute({ sql, args }), motivo, nombre);
let casos = 0;
const salida: string[] = [];
const caso = async (id: string, nombre: string, f: () => Promise<unknown>) => { await f(); casos++; salida.push(`  ✓ ${id.padEnd(5)} ${nombre}`); };

// Contenido y su dominio, llevado al estado pedido (la aprobación de preguntas depende de él: Q-11).
async function dominio(dom: string, item: string, hasta: "borrador" | "en_revision" | "validada" | "publicada") {
  await ok("INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES (?, 'ls-mat-5b', ?)", [dom, dom]);
  await ok("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES (?, ?, 1, 'borrador', ?)", [`${dom}-v1`, dom, AUTOR]);
  await ok("INSERT INTO knowledge_items (id, domain_id, code) VALUES (?, ?, ?)", [item, dom, `COD-${item}`]);
  await ok("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES (?, ?, ?, ?, 'n', 'd')", [`${item}-iv`, item, `${dom}-v1`, dom]);
  await ok("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES (?, 'oa1')", [`${item}-iv`]);
  const v = `${dom}-v1`;
  if (hasta === "borrador") return;
  await ok("UPDATE knowledge_domain_versions SET status = 'en_revision' WHERE id = ?", [v]);
  if (hasta === "en_revision") return;
  await ok("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = ? WHERE id = ?", [REV, v]);
  if (hasta === "validada") return;
  await ok("UPDATE knowledge_domain_versions SET status = 'publicada', published_at = 1 WHERE id = ?", [v]);
}

const famItem = new Map<string, { item: string; bank: string }>();
const fam = async (id: string, item: string, bank = "practica", label: string | null = null) => {
  await ok("INSERT INTO question_families (id, item_id, bank, label) VALUES (?, ?, ?, ?)", [id, item, bank, label]);
  famItem.set(id, { item, bank });
};
const COLS = ["id", "family_id", "item_id", "bank", "version", "status", "stem", "options_json", "correct_option_id", "explanation", "origin",
  "ai_model", "prompt_hash", "content_hash", "authored_by", "reviewed_by", "reviewed_at", "retired_kind", "retired_reason", "retired_by", "retired_at"];
function valoresQ(id: string, f: string, version: number, extra: Record<string, unknown> = {}) {
  const fi = famItem.get(f)!;
  const v: Record<string, unknown> = {
    id, family_id: f, item_id: fi.item, bank: fi.bank, version, status: "borrador", stem: "¿Cuánto es 1/2 + 1/2?", options_json: OPC,
    correct_option_id: "o2", explanation: null, origin: "humano", ai_model: null, prompt_hash: null, content_hash: null, authored_by: AUTOR,
    reviewed_by: null, reviewed_at: null, retired_kind: null, retired_reason: null, retired_by: null, retired_at: null, ...extra,
  };
  return v;
}
const insSql = `INSERT INTO question_versions (${COLS.join(", ")}) VALUES (${COLS.map(() => "?").join(", ")})`;
const argsQ = (v: Record<string, unknown>) => COLS.map((k) => v[k] as any);
const qv = (id: string, f: string, version: number, extra: Record<string, unknown> = {}) => ok(insSql, argsQ(valoresQ(id, f, version, extra)));
const qvFalla = (id: string, f: string, version: number, extra: Record<string, unknown>, motivo: RegExp, nombre: string) =>
  falla(insSql, argsQ(valoresQ(id, f, version, extra)), motivo, nombre);
const estado = (id: string, a: string) => ok("UPDATE question_versions SET status = ? WHERE id = ?", [a, id]);
const aprobar = async (id: string, rev = REV) => {
  await estado(id, "en_revision");
  await ok("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = ?", [rev, id]);
};
const retirar = (id: string, kind = "renovacion", motivo = "nueva versión de la familia", por = REV) =>
  ok("UPDATE question_versions SET status = 'retirada', retired_kind = ?, retired_reason = ?, retired_by = ?, retired_at = 2 WHERE id = ?", [kind, motivo, por, id]);
// Huella de todas las tablas propias (sin las de anulación, que es lo único que debe cambiar al anular).
const huella = async () => {
  const filas = [] as unknown[];
  const tablas = (await c.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%' AND name <> 'question_voids' ORDER BY name")).rows.map((r) => String(r.name));
  for (const t of tablas) {
    filas.push([t, (await c.execute(`SELECT * FROM ${t}`)).rows.map((r) => JSON.stringify(Object.values(r))).sort()]);
  }
  return createHash("sha256").update(JSON.stringify(filas)).digest("hex");
};
const retiradas = async () => (await c.execute("SELECT id FROM question_families_retiradas ORDER BY id")).rows.map((r) => String(r.id));

try {
  await aplicarEsquemaHeredado(c);
  await sembrarFicticios(c);
  assert.deepEqual(await migrar(c, "migrations/vortice"), { aplicadas: ["0001_catalogo.sql", "0002_banco.sql"] });
  await ok("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa1', 'ls-mat-5b', 'MA05 OA 07', 't', 'https://ejemplo.test/oa', 2018)");

  // Contenidos en cada estado de su dominio (Q-11): A validada, P publicada, N borrador, R en revisión.
  await dominio("dom-a", "A", "validada");
  await dominio("dom-p", "P", "publicada");
  await dominio("dom-n", "N", "borrador");
  await dominio("dom-r", "R", "en_revision");
  await fam("fa", "A"); await fam("fa2", "A"); await fam("fp", "P"); await fam("fn", "N"); await fam("fr", "R");
  await fam("fe", "A", "evaluacion");

  // ── B1: integridad referencial compuesta ──
  await caso("B1", "versión con ítem o banco que no coinciden con su familia: FOREIGN KEY", async () => {
    await falla(insSql, argsQ({ ...valoresQ("x", "fa", 1), item_id: "P" }), /FOREIGN KEY/, "ítem distinto");
    await falla(insSql, argsQ({ ...valoresQ("x", "fa", 1), bank: "evaluacion" }), /FOREIGN KEY/, "banco distinto");
    await falla(insSql, argsQ({ ...valoresQ("x", "fa", 1), family_id: "no-existe" }), /FOREIGN KEY/, "familia inexistente");
  });
  // ── B2 ──
  await qv("qa1", "fa", 1);
  await caso("B2", "dos versiones con el mismo número en una familia: UNIQUE o qv_no_sustituir", async () => {
    await qvFalla("qa1b", "fa", 1, {}, /UNIQUE|no se sustituye/, "número repetido"); // lo rechaza qv_no_sustituir o el UNIQUE (declarativo)
    await qv("qb1", "fa2", 1); // mismo número en otra familia: permitido
  });
  // ── B3 ──
  await caso("B3", "banco fuera de la lista y número de versión inválido: CHECK", async () => {
    await falla("INSERT INTO question_families (id, item_id, bank) VALUES ('fx', 'A', 'otro')", [], /CHECK/, "banco");
    await qvFalla("qv0", "fa", 0, {}, /CHECK/, "versión 0");
  });
  // ── B4: K4 (pregunta↔contenido) y Q-11 (contenido validado o publicado para aprobar) ──
  await caso("B4", "familia de un contenido inexistente: FOREIGN KEY", () =>
    falla("INSERT INTO question_families (id, item_id, bank) VALUES ('fz', 'no-existe', 'practica')", [], /FOREIGN KEY/, "ítem inexistente"));
  await caso("B4b", "Q-11: no se aprueba con el dominio en borrador ni en revisión", async () => {
    await qv("qn1", "fn", 1); await estado("qn1", "en_revision");
    await falla("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = 'qn1'", [REV], /validada o publicada/, "borrador");
    await qv("qr1", "fr", 1); await estado("qr1", "en_revision");
    await falla("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = 'qr1'", [REV], /validada o publicada/, "en revisión");
  });
  await caso("B4c", "Q-11: se aprueba con el dominio validado y con el publicado", async () => {
    await aprobar("qa1");          // dominio validado
    await qv("qp1", "fp", 1); await aprobar("qp1"); // dominio publicado
  });

  // ── B5: identidad ──
  await caso("B5", "identidad de familia y de versión inmutable; la etiqueta sí se edita", async () => {
    await falla("UPDATE question_families SET bank = 'evaluacion' WHERE id = 'fa'", [], /identidad inmutable/, "banco");
    await falla("UPDATE question_families SET item_id = 'P' WHERE id = 'fa'", [], /identidad inmutable/, "ítem");
    await ok("UPDATE question_families SET label = 'Fracciones iguales' WHERE id = 'fa'");
    await qv("qb2", "fa2", 60); // un borrador mudable a la familia fa (mismo contenido y banco): solo el trigger lo impide
    for (const [col, val] of [["family_id", "fa"], ["item_id", "P"], ["bank", "evaluacion"], ["version", 9], ["authored_by", OTRO]] as const) {
      await falla(`UPDATE question_versions SET ${col} = ? WHERE id = 'qb2'`, [val], /identidad inmutable/, col);
    }
  });

  // ── B6 y B7: revisor humano distinto del autor, sin NULL ──
  await qv("qa2", "fa", 2); await estado("qa2", "en_revision");
  await caso("B6", "aprobar sin revisor, o con revisor = autor: CHECK", async () => {
    await falla("UPDATE question_versions SET status = 'aprobada' WHERE id = 'qa2'", [], /CHECK/, "sin revisor");
    await falla("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = 'qa2'", [AUTOR], /CHECK/, "revisor = autor");
    await qvFalla("qrev", "fa", 3, { reviewed_by: REV, reviewed_at: 1 }, /CHECK/, "borrador con revisor");
  });
  await caso("B7a", "autor NULL: NOT NULL", () => qvFalla("qn", "fa", 4, { authored_by: null }, /NOT NULL/, "autor nulo"));
  await caso("B7b", "aprobar con revisor NULL: CHECK", () =>
    falla("UPDATE question_versions SET status = 'aprobada', reviewed_by = NULL, reviewed_at = 1 WHERE id = 'qa2'", [], /CHECK/, "revisor nulo"));
  await caso("B7c", "aprobar con reviewed_at NULL: CHECK", () =>
    falla("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = NULL WHERE id = 'qa2'", [REV], /CHECK/, "fecha nula"));
  await caso("B7e", "autor inexistente: FOREIGN KEY", () => qvFalla("qau", "fa", 5, { authored_by: "no-existe" }, /FOREIGN KEY/, "autor"));
  // ── B8: procedencia ──
  await caso("B8", "origen ia sin modelo o huella, humano con modelo, origen inválido: CHECK; ia válida aceptada", async () => {
    await qvFalla("qi0", "fa", 6, { origin: "ia" }, /CHECK/, "ia sin nada");
    await qvFalla("qi1", "fa", 6, { origin: "ia", ai_model: "modelo-x" }, /CHECK/, "ia sin huella");
    await qvFalla("qi2", "fa", 6, { origin: "ia", ai_model: " ", prompt_hash: "h" }, /CHECK/, "ia con modelo vacío");
    await qvFalla("qh1", "fa", 6, { origin: "humano", ai_model: "modelo-x" }, /CHECK/, "humano con modelo");
    await qvFalla("qh2", "fa", 6, { origin: "robot" }, /CHECK/, "origen inválido");
    await qv("qi3", "fa", 6, { origin: "ia", ai_model: "modelo-x", prompt_hash: "h1" });
    await estado("qi3", "en_revision");
    await falla("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = 'qi3'", [AUTOR], /CHECK/, "la autora de la pregunta de IA no la revisa");
    await ok("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = 'qi3'", [REV]);
  });
  // ── B9 y B10: retiro ──
  await qv("qa3", "fa", 7); await aprobar("qa3");
  await caso("B9", "retiro sin clasificación, motivo, responsable o fecha, o con valores vacíos o inválidos: CHECK", async () => {
    const set = (extra: string) => `UPDATE question_versions SET status = 'retirada'${extra} WHERE id = 'qa3'`;
    await falla(set(""), [], /CHECK/, "nada");
    await falla(set(", retired_kind = 'renovacion', retired_by = ?, retired_at = 2"), [REV], /CHECK/, "sin motivo");
    await falla(set(", retired_kind = 'renovacion', retired_reason = '  ', retired_by = ?, retired_at = 2"), [REV], /CHECK/, "motivo vacío");
    await falla(set(", retired_reason = 'x', retired_by = ?, retired_at = 2"), [REV], /CHECK/, "sin clasificación");
    await falla(set(", retired_kind = 'otra', retired_reason = 'x', retired_by = ?, retired_at = 2"), [REV], /CHECK/, "clasificación inválida");
    await falla(set(", retired_kind = 'otro', retired_reason = 'x', retired_at = 2"), [], /CHECK/, "sin responsable");
    await falla(set(", retired_kind = 'otro', retired_reason = 'x', retired_by = ?"), [REV], /CHECK/, "sin fecha");
  });
  await caso("B7d", "retiro con retired_by NULL: CHECK", () =>
    falla("UPDATE question_versions SET status = 'retirada', retired_kind = 'otro', retired_reason = 'x', retired_by = NULL, retired_at = 2 WHERE id = 'qa3'", [], /CHECK/, "responsable nulo"));
  await caso("B10", "columnas de retiro en una versión no retirada: CHECK o congelada", async () => {
    await qvFalla("qr9", "fa", 8, { retired_reason: "x" }, /CHECK/, "borrador con motivo");
    await falla("UPDATE question_versions SET retired_reason = 'x' WHERE id = 'qa3'", [], /CHECK|no es editable/, "aprobada con motivo");
  });
  await caso("B9b", "retiro completo aceptado, con cada clasificación", async () => {
    await retirar("qa3", "renovacion");
    await qv("qd1", "fa2", 2); await aprobar("qd1"); await retirar("qd1", "defecto", "enunciado ambiguo");
    await qv("qd2", "fa2", 3); await aprobar("qd2"); await retirar("qd2", "otro", "fuera del programa");
  });

  // ── B11: aprobada y retirada no se editan ──
  await qv("qe1", "fp", 2); await aprobar("qe1");
  await caso("B11", "editar contenido de una aprobada o de una retirada: trigger", async () => {
    const nuevas = JSON.stringify([{ id: "o1", texto: "Uno" }, { id: "o2", texto: "Dos" }, { id: "o3", texto: "Tres" }]);
    for (const id of ["qe1", "qa3"]) {
      await falla("UPDATE question_versions SET stem = 'otro' WHERE id = ?", [id], /no es editable/, `${id} enunciado`);
      await falla("UPDATE question_versions SET options_json = ? WHERE id = ?", [nuevas, id], /no es editable/, `${id} opciones`);
      await falla("UPDATE question_versions SET correct_option_id = 'o1' WHERE id = ?", [id], /no es editable/, `${id} clave`);
      await falla("UPDATE question_versions SET explanation = 'otra' WHERE id = ?", [id], /no es editable/, `${id} explicación`);
      await falla("UPDATE question_versions SET origin = 'ia', ai_model = 'm', prompt_hash = 'h' WHERE id = ?", [id], /no es editable/, `${id} origen`);
      await falla("UPDATE question_versions SET content_hash = 'h' WHERE id = ?", [id], /no es editable/, `${id} huella`);
      await falla("UPDATE question_versions SET reviewed_by = ? WHERE id = ?", [OTRO, id], /no es editable/, `${id} revisor`);
    }
    await falla("UPDATE question_versions SET retired_reason = 'cambio' WHERE id = 'qa3'", [], /no es editable/, "motivo de retiro");
  });

  await caso("B11b", "en revisión el contenido y la procedencia no se editan, ni en el mismo UPDATE que aprueba", async () => {
    await qv("qrv", "fp", 20, { origin: "ia", ai_model: "modelo-x", prompt_hash: "h1" });
    await estado("qrv", "en_revision");
    await falla("UPDATE question_versions SET stem = 'otro' WHERE id = 'qrv'", [], /en revisión no se edita/, "enunciado");
    await falla("UPDATE question_versions SET correct_option_id = 'o1' WHERE id = 'qrv'", [], /en revisión no se edita/, "clave");
    await falla("UPDATE question_versions SET explanation = 'otra' WHERE id = 'qrv'", [], /en revisión no se edita/, "explicación");
    await falla("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1, correct_option_id = 'o1' WHERE id = 'qrv'", [REV], /en revisión no se edita/, "clave al aprobar");
    await falla("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1, origin = 'humano', ai_model = NULL, prompt_hash = NULL WHERE id = 'qrv'", [REV], /en revisión no se edita/, "reetiquetar IA como humana al aprobar");
    await estado("qrv", "borrador"); // para corregir se vuelve a borrador
    await ok("UPDATE question_versions SET stem = 'corregido' WHERE id = 'qrv'");
    await estado("qrv", "en_revision");
    await ok("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = 'qrv'", [REV]);
  });

  // ── B12 y B13: transiciones ──
  await qv("qt1", "fa2", 4);
  await caso("B12", "transiciones no permitidas: trigger", async () => {
    await falla("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = 'qt1'", [REV], /transición no permitida/, "borrador → aprobada");
    await falla("UPDATE question_versions SET status = 'retirada' WHERE id = 'qt1'", [], /transición no permitida/, "borrador → retirada");
    for (const [id, a] of [["qe1", "borrador"], ["qe1", "en_revision"], ["qa3", "aprobada"], ["qa3", "en_revision"], ["qa3", "borrador"]] as const) {
      await falla("UPDATE question_versions SET status = ? WHERE id = ?", [a, id], /transición no permitida/, `${id} → ${a}`);
    }
    await estado("qt1", "en_revision");
    await falla("UPDATE question_versions SET status = 'retirada', retired_kind = 'otro', retired_reason = 'x', retired_by = ?, retired_at = 2 WHERE id = 'qt1'", [REV], /transición no permitida/, "en_revision → retirada");
  });
  await caso("B13", "transiciones permitidas: borrador → en_revision → borrador → en_revision → aprobada → retirada", async () => {
    await estado("qt1", "borrador");
    await estado("qt1", "en_revision");
    await ok("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = 'qt1'", [REV]);
    await retirar("qt1");
  });
  // ── B14 ──
  await caso("B14", "insertar directo como en_revision, aprobada o retirada: trigger", async () => {
    await qvFalla("qd", "fa2", 20, { status: "en_revision" }, /nace en borrador/, "en_revision");
    await qvFalla("qd", "fa2", 20, { status: "aprobada", reviewed_by: REV, reviewed_at: 1 }, /nace en borrador/, "aprobada");
    await qvFalla("qd", "fa2", 20, { status: "retirada", reviewed_by: REV, reviewed_at: 1, retired_kind: "otro", retired_reason: "x", retired_by: REV, retired_at: 2 }, /nace en borrador/, "retirada");
  });

  // ── B15: opciones ──
  await caso("B15", "options_json inválido o con la clave fuera de las opciones (insertar y editar un borrador)", async () => {
    const malas: [string, string, string, RegExp][] = [
      ["a no es JSON", "esto no es json", "o1", /JSON válido/],
      ["b no es arreglo", JSON.stringify({ id: "o1", texto: "x" }), "o1", /arreglo de al menos 2/],
      ["c una sola opción", JSON.stringify([{ id: "o1", texto: "x" }]), "o1", /arreglo de al menos 2/],
      ["d ids repetidos", JSON.stringify([{ id: "o1", texto: "x" }, { id: "o1", texto: "y" }]), "o1", /repetidos/],
      ["e id vacío", JSON.stringify([{ id: " ", texto: "x" }, { id: "o2", texto: "y" }]), "o2", /no vacíos/],
      ["f texto vacío", JSON.stringify([{ id: "o1", texto: "" }, { id: "o2", texto: "y" }]), "o2", /no vacíos/],
      ["g id no textual", JSON.stringify([{ id: 1, texto: "x" }, { id: 2, texto: "y" }]), "1", /no vacíos/],
      ["h clave fuera", OPC, "o9", /no es una opción/],
      ["i textos con JSON en vez de objetos", JSON.stringify(['{"id":"o1","texto":"Uno"}', '{"id":"o2","texto":"Dos"}']), "o1", /no vacíos/],
    ];
    await qv("qo", "fa2", 30);
    for (const [n, opciones, clave, re] of malas) {
      await qvFalla(`qo${n}`, "fa2", 31, { options_json: opciones, correct_option_id: clave }, re, `insertar ${n}`);
      await falla("UPDATE question_versions SET options_json = ?, correct_option_id = ? WHERE id = 'qo'", [opciones, clave], re, `editar ${n}`);
    }
    await ok("UPDATE question_versions SET options_json = ?, correct_option_id = 'o3' WHERE id = 'qo'", [JSON.stringify([{ id: "o1", texto: "Uno" }, { id: "o2", texto: "Dos" }, { id: "o3", texto: "Tres" }])]);
  });

  // ── B16 y B17 ──
  await caso("B16", "borrar una versión: solo un borrador", async () => {
    await falla("DELETE FROM question_versions WHERE id = 'qe1'", [], /solo se puede descartar un borrador/, "aprobada");
    await falla("DELETE FROM question_versions WHERE id = 'qa3'", [], /solo se puede descartar un borrador/, "retirada");
    await qv("qen", "fa2", 40); await estado("qen", "en_revision");
    await falla("DELETE FROM question_versions WHERE id = 'qen'", [], /solo se puede descartar un borrador/, "en revisión");
    await qv("qbd", "fa2", 41);
    await ok("DELETE FROM question_versions WHERE id = 'qbd'");
  });
  await caso("B17", "borrar una familia: con versiones, FOREIGN KEY; vacía, permitido (Q-2)", async () => {
    await falla("DELETE FROM question_families WHERE id = 'fa'", [], /FOREIGN KEY/, "con versiones");
    await fam("fvacia", "A");
    await ok("DELETE FROM question_families WHERE id = 'fvacia'");
  });

  // ── B18 y B19: anulación ──
  await caso("B18", "anulación: solicitante ≠ aprobador, una sola, solo aprobada o retirada, motivo, solo inserción, sin reversión", async () => {
    await falla("INSERT INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('v0', 'qe1', 'r', ?, ?, 1)", [REV, REV], /CHECK/, "solicitante = aprobador");
    await falla("INSERT INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('v0', 'qe1', '  ', ?, ?, 1)", [REV, OTRO], /CHECK/, "motivo vacío");
    await falla("INSERT INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('v0', 'qe1', 'r', NULL, ?, 1)", [OTRO], /NOT NULL/, "solicitante nulo");
    await falla("INSERT INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('v0', 'qb1', 'r', ?, ?, 1)", [REV, OTRO], /solo se anula una versión aprobada o retirada/, "borrador");
    await falla("INSERT INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('v0', 'qen', 'r', ?, ?, 1)", [REV, OTRO], /solo se anula una versión aprobada o retirada/, "en revisión");
    await falla("INSERT INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('v0', 'no-existe', 'r', ?, ?, 1)", [REV, OTRO], /FOREIGN KEY/, "inexistente");
    await ok("INSERT INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('v1', 'qe1', 'enunciado defectuoso', ?, ?, 3)", [REV, OTRO]);
    await ok("INSERT INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('v2', 'qa3', 'defectuosa ya retirada', ?, ?, 3)", [OTRO, REV]);
    await falla("INSERT INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('v3', 'qe1', 'otra vez', ?, ?, 4)", [REV, OTRO], /UNIQUE|solo inserción/, "segunda anulación");
    await falla("UPDATE question_voids SET reason = 'corregido' WHERE id = 'v1'", [], /solo inserción/, "UPDATE");
    await falla("DELETE FROM question_voids WHERE id = 'v1'", [], /solo inserción/, "DELETE");
    await falla("DELETE FROM question_versions WHERE id = 'qe1'", [], /solo se puede descartar un borrador/, "borrar la anulada");
  });
  await caso("B19", "DB-13: anular una pregunta no cambia ninguna otra tabla ni su propio estado; una anulada aún puede retirarse", async () => {
    await qv("qv19", "fp", 3); await aprobar("qv19");
    const antes = await huella();
    await ok("INSERT INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('v19', 'qv19', 'defecto', ?, ?, 5)", [REV, OTRO]);
    assert.equal(await huella(), antes, "ninguna otra tabla cambió (sin anulación automática de evidencia)");
    assert.equal((await c.execute("SELECT status FROM question_versions WHERE id = 'qv19'")).rows[0].status, "aprobada", "anular no cambia el estado");
    await retirar("qv19", "defecto", "retirada tras anularla");
    assert.equal((await c.execute("SELECT COUNT(*) AS n FROM question_voids WHERE question_version_id = 'qv19'")).rows[0].n, 1, "la anulación persiste tras retirar");
  });

  // ── Vías de bypass: INSERT OR REPLACE borra la fila previa sin disparar los triggers de DELETE ──
  await caso("B16r", "bypass: INSERT OR REPLACE y UPSERT no sustituyen versiones, familias ni anulaciones", async () => {
    // qa1: aprobada y sin anulación (una anulada ya queda protegida por la FK RESTRICT de question_voids).
    const v = valoresQ("qa1", "fa", 1, { stem: "sustituida", options_json: OPC });
    await assert.rejects(c.execute({ sql: insSql.replace("INSERT INTO", "INSERT OR REPLACE INTO"), args: argsQ(v) }), /no se sustituye/, "por id");
    const w = valoresQ("otro-id", "fa", 1, { stem: "sustituida por número" });
    await assert.rejects(c.execute({ sql: insSql.replace("INSERT INTO", "INSERT OR REPLACE INTO"), args: argsQ(w) }), /no se sustituye/, "por (familia, versión)");
    assert.equal((await c.execute("SELECT stem FROM question_versions WHERE id = 'qa1'")).rows[0].stem, "¿Cuánto es 1/2 + 1/2?");
    await assert.rejects(c.execute({ sql: "INSERT OR REPLACE INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('v1', 'qe1', 'cambiada', ?, ?, 9)", args: [REV, OTRO] }), /solo inserción/, "anulación por id");
    await assert.rejects(c.execute({ sql: "INSERT OR REPLACE INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('nuevo', 'qe1', 'cambiada', ?, ?, 9)", args: [REV, OTRO] }), /solo inserción/, "anulación por versión");
    assert.equal((await c.execute("SELECT reason FROM question_voids WHERE id = 'v1'")).rows[0].reason, "enunciado defectuoso");
    // También un borrador (cambiaría su identidad), una familia sin versiones y un UPSERT sobre la aprobada.
    await qv("qrep", "fa2", 50, { stem: "borrador original" });
    const repl = (id: string, f: string, ver: number, extra: Record<string, unknown> = {}) => assert.rejects(
      c.execute({ sql: insSql.replace("INSERT INTO", "INSERT OR REPLACE INTO"), args: argsQ(valoresQ(id, f, ver, extra)) }), /no se sustituye/, `borrador ${id}`);
    await repl("qrep", "fa2", 50, { stem: "borrador reemplazado" });
    await repl("qrep", "fa", 99, { authored_by: OTRO }); // intentaría mudarlo de familia y de autor
    assert.equal((await c.execute("SELECT stem, family_id, authored_by FROM question_versions WHERE id = 'qrep'")).rows[0].stem, "borrador original");
    await ok("DELETE FROM question_versions WHERE id = 'qrep'");
    await fam("fvacia2", "A");
    await assert.rejects(c.execute({ sql: "INSERT OR REPLACE INTO question_families (id, item_id, bank) VALUES ('fvacia2', 'P', 'evaluacion')", args: [] }), /no se sustituye/, "familia vacía por REPLACE");
    await assert.rejects(c.execute({ sql: "INSERT INTO question_families (id, item_id, bank) VALUES ('fvacia2', 'P', 'evaluacion') ON CONFLICT(id) DO UPDATE SET bank = excluded.bank", args: [] }), /no se sustituye/, "familia vacía por UPSERT");
    assert.deepEqual((await c.execute("SELECT item_id, bank FROM question_families WHERE id = 'fvacia2'")).rows.map((r) => [r.item_id, r.bank]), [["A", "practica"]]);
    await ok("DELETE FROM question_families WHERE id = 'fvacia2'");
    await assert.rejects(c.execute({ sql: insSql.replace("INSERT INTO", "INSERT OR REPLACE INTO") + " ", args: argsQ(valoresQ("qa1", "fa", 1, { stem: "x" })) }), /no se sustituye/, "aprobada");
    await assert.rejects(c.execute({ sql: insSql + " ON CONFLICT(id) DO UPDATE SET stem = excluded.stem", args: argsQ(valoresQ("qa1", "fa", 1, { stem: "cambiado por UPSERT" })) }), /no se sustituye/, "UPSERT sobre aprobada");
    await assert.rejects(c.execute({ sql: "INSERT OR REPLACE INTO question_families (id, item_id, bank) VALUES ('fa', 'A', 'practica')", args: [] }), /no se sustituye/, "familia con versiones por id");
  });

  // ── B20: independencia del banco respecto de las versiones de contenido (H2) ──
  await caso("B20", "una versión nueva del dominio (H2) no altera familias ni preguntas", async () => {
    const t = async (q: string) => (await c.execute(q)).rows.map((r) => JSON.stringify(Object.values(r)));
    const banco = async () => [await t("SELECT * FROM question_families ORDER BY id"), await t("SELECT * FROM question_versions ORDER BY id"), await t("SELECT * FROM question_voids ORDER BY id")];
    const antes = await banco();
    const dominioAntes = await huella();
    const v2 = await crearVersionDominio(c, "dom-p", AUTOR);
    assert.equal(v2.version, 2);
    assert.notEqual(await huella(), dominioAntes, "la versión nueva sí agregó filas de dominio y contenido");
    assert.deepEqual(await banco(), antes, "familias, versiones y anulaciones intactas");
    assert.deepEqual(await t("SELECT item_id, bank FROM question_families WHERE id = 'fp'"), [JSON.stringify(["P", "practica"])]);
  });

  // ── B21: DB-4, familia retirada ──
  await caso("B21", "DB-4: retirada solo si tiene al menos una versión y todas retiradas", async () => {
    await fam("g-vacia", "A");
    await fam("g-solo-borrador", "A"); await qv("gb1", "g-solo-borrador", 1);
    await fam("g-aprobada", "A"); await qv("ga1", "g-aprobada", 1); await aprobar("ga1");
    await fam("g-todas", "A"); await qv("gt1", "g-todas", 1); await aprobar("gt1"); await retirar("gt1");
    await qv("gt2", "g-todas", 2); await aprobar("gt2"); await retirar("gt2", "otro", "ya no aplica");
    await fam("g-mixta-borrador", "A"); await qv("gm1", "g-mixta-borrador", 1); await aprobar("gm1"); await retirar("gm1");
    await qv("gm2", "g-mixta-borrador", 2);
    await fam("g-mixta-revision", "A"); await qv("gr1", "g-mixta-revision", 1); await aprobar("gr1"); await retirar("gr1");
    await qv("gr2", "g-mixta-revision", 2); await estado("gr2", "en_revision");
    await fam("g-mixta-aprobada", "A"); await qv("gx1", "g-mixta-aprobada", 1); await aprobar("gx1"); await retirar("gx1");
    await qv("gx2", "g-mixta-aprobada", 2); await aprobar("gx2");
    const r = await retiradas();
    assert.ok(r.includes("g-todas"), "todas retiradas");
    for (const f of ["g-vacia", "g-solo-borrador", "g-aprobada", "g-mixta-borrador", "g-mixta-revision", "g-mixta-aprobada"]) assert.ok(!r.includes(f), f);
    // Reversible: aprobar una versión nueva reactiva la familia, sin tocar las anteriores.
    await qv("gt3", "g-todas", 3); await aprobar("gt3");
    assert.ok(!(await retiradas()).includes("g-todas"), "una versión nueva aprobada reactiva la familia");
  });

  // ── B22: sin deriva ──
  await caso("B22", "sin deriva tras migrar; la migración queda registrada y no se vuelve a aplicar", async () => {
    const d = await verificarDeriva(c);
    assert.equal(d.ok, true, JSON.stringify(d));
    const objetos = (await c.execute("SELECT type, name FROM sqlite_master WHERE name LIKE 'qf\\_%' ESCAPE '\\' OR name LIKE 'qv\\_%' ESCAPE '\\' OR name LIKE 'qvoid\\_%' ESCAPE '\\' OR name LIKE 'question\\_%' ESCAPE '\\'")).rows.map((r) => `${r.type}:${r.name}`);
    for (const n of ["table:question_families", "table:question_versions", "table:question_voids", "view:question_families_retiradas",
      "trigger:qf_identidad", "trigger:qv_identidad", "trigger:qv_nace_borrador", "trigger:qv_transicion", "trigger:qv_congelada", "trigger:qv_sin_delete",
      "trigger:qv_aprobar_contenido", "trigger:qv_no_sustituir", "trigger:qf_no_sustituir", "trigger:qv_revision_congelada", "trigger:qvoid_no_sustituir", "index:qf_item", "trigger:qv_opciones_insert", "trigger:qv_opciones_update", "trigger:qvoid_requiere_vigente", "trigger:qvoid_sin_update", "trigger:qvoid_sin_delete"]) {
      assert.ok(objetos.includes(n), n);
    }
    assert.deepEqual(await migrar(c, "migrations/vortice"), { aplicadas: [] });
  });
} finally {
  await b.cerrar();
}
console.log(salida.join("\n"));
console.log(`banco-db: ok (${casos} casos)`);
