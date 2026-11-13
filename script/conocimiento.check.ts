// IMP-012 e IMP-032 (H3a): contrato EvidenciaLiberada y filtro único. Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import v8 from "node:v8"; import vm from "node:vm";
import type { Client, InArgs } from "@libsql/client";
import { crearClienteDb } from "../server/cliente"; import { assertBaseLocal } from "../server/dbGuard"; import { migrar } from "../server/migrar";
import { baseArchivo } from "./lib/basePrueba";
import { aplicarEsquemaHeredado, sembrarFicticios } from "./lib/esquemaHeredado";

if (process.env.NODE_ENV === "production") throw new Error("este check no debe correr con NODE_ENV=production");
// libSQL embebido: las transacciones de `migrar` dejan conexiones nativas vivas hasta que el recolector las
// finaliza, y esas finalizaciones tardías fallaban a veces con SIGSEGV (REGISTRO_H2_INTEGRIDAD). Se forzan
// los finalizadores con el proceso sano; si el proceso cae igual, sale con 139 y check:vortice falla.
v8.setFlagsFromString("--expose-gc");
const gc = vm.runInNewContext("gc") as () => void;
const liberarNativos = async () => { for (let i = 0; i < 2; i++) { gc(); await new Promise((r) => setImmediate(r)); await new Promise((r) => setTimeout(r, 0)); } };
const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), "h3a-"));
const AU = "ficticio-autor", VA = "ficticio-validador", OT = "ficticio-otro", EA = "est-a", EB = "est-b";
const OPC = JSON.stringify([{ id: "o1", texto: "Uno" }, { id: "o2", texto: "Dos" }]);
// Política SOLO DE PRUEBA (las alternativas recomendadas del diseño; ninguna aprobada salvo K6 y N18).
const POL_BASE = { k6_min_families: 2, k6_separation: "ninguna", assisted_counts: false, wrong_with_help_counts: false,
  error_repaired_counts: false, retired_counts: true, demote_wrong_families: 2, not_mastered_wrong_families: 2 };

type X = (sql: string, args?: InArgs) => ReturnType<Client["execute"]>;
// Dominio publicado con sus contenidos (la aprobación de preguntas y la práctica lo exigen).
async function dominioPublicado(x: X, dom: string, items: string[], hasta: "publicada" | "validada" = "publicada") {
  await x("INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES (?, 'ls-mat-5b', ?)", [dom, dom]);
  await x("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES (?, ?, 1, 'borrador', ?)", [`${dom}-v1`, dom, AU]);
  for (const it of items) {
    await x("INSERT INTO knowledge_items (id, domain_id, code) VALUES (?, ?, ?)", [it, dom, `COD-${it}`]);
    await x("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES (?, ?, ?, ?, 'n', 'd')", [`${it}-iv`, it, `${dom}-v1`, dom]);
    await x("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES (?, 'oa1')", [`${it}-iv`]);
  }
  await x("UPDATE knowledge_domain_versions SET status = 'en_revision' WHERE id = ?", [`${dom}-v1`]);
  await x("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = ? WHERE id = ?", [VA, `${dom}-v1`]);
  if (hasta === "publicada") await x("UPDATE knowledge_domain_versions SET status = 'publicada', published_at = 1 WHERE id = ?", [`${dom}-v1`]);
}
async function pregunta(x: X, id: string, fam: string, item: string, bank = "practica", version = 1) {
  if (version === 1) await x("INSERT INTO question_families (id, item_id, bank) VALUES (?, ?, ?)", [fam, item, bank]);
  await x(`INSERT INTO question_versions (id, family_id, item_id, bank, version, status, stem, options_json, correct_option_id, origin, authored_by)
           VALUES (?, ?, ?, ?, ?, 'borrador', 'Enunciado', ?, 'o2', 'humano', ?)`, [id, fam, item, bank, version, OPC, AU]);
  await x("UPDATE question_versions SET status = 'en_revision' WHERE id = ?", [id]);
  await x("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = ?", [VA, id]);
}
const retirar = (x: X, id: string, kind: string) =>
  x("UPDATE question_versions SET status = 'retirada', retired_kind = ?, retired_reason = 'motivo', retired_by = ?, retired_at = 2 WHERE id = ?", [kind, VA, id]);
async function politica(x: X, id = "pol1", version = 1, reglas: Record<string, unknown> = POL_BASE) {
  await x("INSERT INTO mastery_policies (id, version, rules_json, status) VALUES (?, ?, ?, 'borrador')", [id, version, JSON.stringify(reglas)]);
  await x("UPDATE mastery_policies SET status = 'aprobada', approved_by = ?, approved_at = 1 WHERE id = ?", [VA, id]);
}

// Escenario base: dominio d1 (contenidos i1 con familias f1, f2, f3 e i2 con g1), dominio d2 (i3, h1), banco de
// evaluación (e1) y dos estudiantes. Se arma DESDE CERO una vez por plantilla y cada prueba copia el archivo.
async function construirPlantilla(nombre: string): Promise<string> {
  const b = baseArchivo(); const c = b.client; const x: X = (s, a = []) => c.execute({ sql: s, args: a });
  await aplicarEsquemaHeredado(c); await sembrarFicticios(c); await migrar(c, "migrations/vortice");
  await x("INSERT INTO users (id, email) VALUES ('est-a', 'a@ficticio.test'), ('est-b', 'b@ficticio.test')");
  await x("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES ('oa1','ls-mat-5b','M1','t','https://e.test',2018)");
  await dominioPublicado(x, "d1", ["i1", "i2"]); await dominioPublicado(x, "d2", ["i3"]);
  await pregunta(x, "q1", "f1", "i1"); await pregunta(x, "q2", "f2", "i1"); await pregunta(x, "q3", "f3", "i1");
  await pregunta(x, "r1", "g1", "i2"); await pregunta(x, "s1", "h1", "i3"); await pregunta(x, "qe", "e1", "i1", "evaluacion");
  const f = path.join(RAIZ, `${nombre}.db`); fs.copyFileSync(b.url.replace(/^file:/, ""), f); await b.cerrar(); return f;
}
const abrir = (plantilla: string) => {
  const carpeta = fs.mkdtempSync(path.join(RAIZ, "b-")); const f = path.join(carpeta, "base.db"); fs.copyFileSync(plantilla, f);
  const url = `file:${f}`; assertBaseLocal(process.env, url);
  const abiertos: Client[] = []; const nueva = () => { const k = crearClienteDb(url); abiertos.push(k); return k; };
  const c = nueva();
  return { c, f, nueva, x: ((s: string, a: InArgs = []) => c.execute({ sql: s, args: a })) as X, cerrar: () => { for (const k of abiertos) k.close(); fs.rmSync(carpeta, { recursive: true, force: true }); } };
};
// Huella de TODAS las tablas (con sus datos) y del esquema (triggers e índices).
const huella = async (c: Client, solo?: string[]) => {
  const ts = (await c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%' ORDER BY name")).rows.map((r) => String(r.name)).filter((t) => !solo || solo.includes(t));
  const h = createHash("sha256");
  for (const t of ts) h.update(t + JSON.stringify((await c.execute(`SELECT * FROM "${t}"`)).rows.map((r) => JSON.stringify(Object.values(r))).sort()));
  if (!solo) h.update(JSON.stringify((await c.execute("SELECT type,name,sql FROM sqlite_master ORDER BY type,name")).rows.map((r) => JSON.stringify(Object.values(r)))));
  return h.digest("hex");
};
const n = async (c: Client, tabla: string, donde = "1=1") => Number((await c.execute(`SELECT COUNT(*) AS n FROM ${tabla} WHERE ${donde}`)).rows[0].n);
const salida: string[] = []; let casos = 0;
const caso = async (id: string, nombre: string, f: () => Promise<unknown>) => { await f(); casos++; salida.push(`  ✓ ${id.padEnd(6)} ${nombre}`); await liberarNativos(); };

// ── IMP-012 e IMP-032: contrato EvidenciaLiberada, filtro único y lectura del estado ──────────────────
import { spawnSync } from "node:child_process";
import { evidenciaLiberada, leerEstado, politicaVigente, respuestasSinEvidencia, retiradasPorDefectoSinAnular } from "../server/conocimiento";
import { iniciarSesion, registrarRespuesta } from "../server/practica";

const PA = await construirPlantilla("A"); await liberarNativos();
const conBase = async (f: (bd: ReturnType<typeof abrir>) => Promise<void>) => { const bd = abrir(PA); try { await f(bd); } finally { bd.cerrar(); } };
const TABLAS_RESTRINGIDAS = /knowledge_evidence|evidence_voids|knowledge_state_events|student_knowledge_state/;
const archivos = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? archivos(path.join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.join(dir, e.name)] : []);

await caso("AC1", "acceso centralizado: solo server/conocimiento.ts nombra las tablas de evidencia, anulación, eventos y proyección", async () => {
  const detecta = (texto: string) => TABLAS_RESTRINGIDAS.test(texto);
  assert.ok(detecta("SELECT * FROM knowledge_evidence") && detecta("x student_knowledge_state") && !detecta("SELECT * FROM practice_answers"), "el detector reconoce las tablas");   // control del detector
  const ajenos = ["server", "shared"].flatMap(archivos).filter((f) => f !== path.join("server", "conocimiento.ts")).filter((f) => TABLAS_RESTRINGIDAS.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(ajenos, [], `acceso directo fuera de server/conocimiento.ts: ${ajenos.join(", ")}`);
  assert.ok(TABLAS_RESTRINGIDAS.test(fs.readFileSync("server/conocimiento.ts", "utf8")));
  // Solo el filtro único produce evidencia marcada: ninguna conversión a EvidenciaLiberada en otro archivo de producción.
  const conversion = /\bas\s+(?:readonly\s+)?EvidenciaLiberada\b|<EvidenciaLiberada>/;
  assert.ok(conversion.test("x as EvidenciaLiberada[]") && conversion.test("<EvidenciaLiberada>y"), "control del detector de conversiones");
  const falsificadores = ["server", "shared"].flatMap(archivos).filter((f) => f !== path.join("server", "conocimiento.ts")).filter((f) => conversion.test(fs.readFileSync(f, "utf8").replace(/\/\/.*$/gm, "")));
  assert.deepEqual(falsificadores, [], `conversión a EvidenciaLiberada fuera del filtro único: ${falsificadores.join(", ")}`);
  const ok = fs.readFileSync("server/conocimiento.ts", "utf8").split("\n").filter((l) => /as EvidenciaLiberada/.test(l.replace(/\/\/.*$/, "")));
  assert.equal(ok.length, 2, "dos conversiones en el filtro único (liberada y la hipotética del cálculo)");
  // N17 sigue pendiente: ni el filtro ni el servicio fijan `retired_counts`.
  for (const f of ["server/conocimiento.ts", "server/practica.ts", "server/reconstruccion.ts"]) assert.ok(!/retired_counts/.test(fs.readFileSync(f, "utf8").replace(/\/\/.*$/gm, "")), `${f} no debe decidir N17`);
  // Reloj: ningún módulo nuevo lee el reloj del sistema para decidir.
  for (const f of ["server/conocimiento.ts", "server/practica.ts", "server/reconstruccion.ts", "shared/evidencia.ts"]) {
    const lect = fs.readFileSync(f, "utf8").split("\n").map((l) => l.replace(/\/\/.*$/, "")).filter((l) => /Date\.now\s*\(|new Date\s*\(\s*\)/.test(l));
    assert.deepEqual(lect, [], `${f} lee el reloj del sistema`);
  }
});

await caso("TS1", "tipos: una evidencia sin marcar no compila como entrada de evaluar; la marcada sí", async () => {
  const dir = fs.mkdtempSync(path.join(RAIZ, "tsc-")); const raiz = process.cwd();
  const sonda = (cuerpo: string) => {
    fs.writeFileSync(path.join(dir, "sonda.ts"), `import { evaluar, type Evidencia, type ContextoVersion } from "${raiz}/shared/dominio";\nimport type { EvidenciaLiberada } from "${raiz}/shared/evidencia";\nimport type { PoliticaEjecutable } from "${raiz}/shared/politica";\n` +
      `declare const plana: Evidencia[]; declare const marcada: EvidenciaLiberada[]; declare const ctx: ContextoVersion; declare const pol: PoliticaEjecutable; declare const una: Evidencia;\n${cuerpo}\n`);
    fs.writeFileSync(path.join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true, noEmit: true, module: "ESNext", target: "ES2022", moduleResolution: "bundler", skipLibCheck: true, types: [] }, files: ["sonda.ts"] }));
    return spawnSync(path.join(raiz, "node_modules/.bin/tsc"), ["-p", dir], { encoding: "utf8" });
  };
  let r = sonda("evaluar(marcada, ctx, pol);");
  assert.equal(r.status, 0, `la evidencia marcada debe compilar: ${r.stdout}`);
  r = sonda("evaluar(plana, ctx, pol);");
  assert.notEqual(r.status, 0, "evaluar(Evidencia[]) debe fallar en tipos"); assert.match(r.stdout, /TS2345|not assignable/);
  r = sonda("const x: EvidenciaLiberada = una; void x;");
  assert.notEqual(r.status, 0, "asignar una Evidencia común a EvidenciaLiberada debe fallar");
  r = sonda("// @ts-expect-error evidencia sin marcar\nevaluar(plana, ctx, pol);\n// @ts-expect-error literal sin marca\nconst y: EvidenciaLiberada = { id: 'a', familia: 'f', correcta: true, conAyuda: false, sesion: 's', dia: 'd', ocurrida: 1, secuencia: 1, fuente: 'practica', versionContenido: 'v', anulada: false, familiaRetirada: false }; void y;");
  assert.equal(r.status, 0, `ambas negaciones deben darse: ${r.stdout}`);
  fs.rmSync(dir, { recursive: true, force: true });
});

const sesionYRespuesta = async (bd: ReturnType<typeof abrir>, est: string, qv: string, opt: string, csid: string, ses?: string) => {
  const s = ses ?? (await iniciarSesion(bd.c, { estudiante: est, dominioId: "d1", proposito: "practica" })).id;
  return { s, r: await registrarRespuesta(bd.c, { estudiante: est, sesionId: s, preguntaVersionId: qv, opcionId: opt, clientSubmissionId: csid }) };
};

await caso("FL1", "filtro único: evidencia marcada, anulada solo con fila en evidence_voids, ordenada, y acotada por `ahora`", () => conBase(async (bd) => {
  const { s, r: r1 } = await sesionYRespuesta(bd, EA, "q1", "o2", "c1");
  const r2 = (await sesionYRespuesta(bd, EA, "q2", "o1", "c2", s)).r;
  await sesionYRespuesta(bd, EB, "q1", "o2", "c1");
  const t = Number((await bd.x("SELECT MAX(answered_at) AS t FROM practice_answers")).rows[0].t);
  const mapa = await evidenciaLiberada(bd.c, EA, t + 1);
  const l = mapa.get("i1")!;
  assert.deepEqual(l.map((e) => [e.id, e.familia, e.correcta, e.conAyuda, e.fuente, e.versionContenido, e.anulada, e.familiaRetirada, e.secuencia]),
    [[r1.evidenciaId, "f1", true, false, "practica", "i1-iv", false, false, 1], [r2.evidenciaId, "f2", false, false, "practica", "i1-iv", false, false, 2]]);
  assert.deepEqual([...mapa.keys()], ["i1"], "solo lo del estudiante");
  assert.equal((await evidenciaLiberada(bd.c, EA, 0)).size, 0, "lo posterior a `ahora` no se libera");
  assert.equal((await evidenciaLiberada(bd.c, EA, t + 1, "i2")).size, 0, "filtro por contenido");
  // Anulación de pregunta: NO anula la evidencia (DB-13, D5.1).
  await bd.x("INSERT INTO question_voids (id, question_version_id, reason, requested_by, approved_by, at) VALUES ('qvo', 'q1', 'x', ?, ?, 3)", [AU, VA]);
  assert.equal((await evidenciaLiberada(bd.c, EA, t + 1)).get("i1")![0].anulada, false);
  // Anulación de evidencia: se marca, no se borra.
  const antesEv = await n(bd.c, "knowledge_evidence");
  await bd.x("INSERT INTO evidence_voids (id, evidence_id, reason, requested_by, approved_by, at) VALUES ('v1', ?, 'm', ?, ?, 5)", [r1.evidenciaId, AU, VA]);
  const m2 = (await evidenciaLiberada(bd.c, EA, t + 1)).get("i1")!;
  assert.deepEqual(m2.map((e) => e.anulada), [true, false]);
  assert.equal(await n(bd.c, "knowledge_evidence"), antesEv, "la evidencia nunca se borra");
}));
await caso("FL2", "familia retirada (D5.2): familia retirada por completo y versión citada sin defecto; `otro` cuenta sin defecto; N17 no interviene", () => conBase(async (bd) => {
  const { s } = await sesionYRespuesta(bd, EA, "q1", "o2", "x0");
  const resp = async (qv: string, csid: string) => (await registrarRespuesta(bd.c, { estudiante: EA, sesionId: s, preguntaVersionId: qv, opcionId: "o2", clientSubmissionId: csid })).evidenciaId;
  const ev = { f1: (await evidenciaLiberada(bd.c, EA, 4e9)).get("i1")![0].id, f2: await resp("q2", "x1"), f3: await resp("q3", "x2"), g1: await resp("r1", "x3") };
  await pregunta(bd.x, "r1b", "g1", "i2", "practica", 2);
  const g1b = await resp("r1b", "x4");
  await retirar(bd.x, "q1", "renovacion"); await retirar(bd.x, "q2", "otro"); await retirar(bd.x, "q3", "defecto"); await retirar(bd.x, "r1", "renovacion");
  const flag = async () => { const m = await evidenciaLiberada(bd.c, EA, 4e9); const todas = [...m.values()].flat(); return Object.fromEntries(todas.map((e) => [e.id, e.familiaRetirada])); };
  let f = await flag();
  assert.equal(f[ev.f1], true, "familia de una versión retirada por renovación");
  assert.equal(f[ev.f2], true, "retirada «otro» cuenta como sin defecto");
  assert.equal(f[ev.f3], false, "retirada por defecto: no es del N17");
  assert.equal(f[ev.g1], false, "la familia tiene otra versión aprobada: no está retirada");
  assert.equal(f[g1b], false);
  await retirar(bd.x, "r1b", "renovacion");
  f = await flag();
  assert.equal(f[ev.g1], true, "ahora todas las versiones de la familia están retiradas"); assert.equal(f[g1b], true);
  await pregunta(bd.x, "q4", "fx", "i1"); await pregunta(bd.x, "q4b", "fx", "i1", "practica", 2);
  const e4 = await resp("q4", "x5"); await retirar(bd.x, "q4", "defecto");
  const e4b = await resp("q4b", "x6"); await retirar(bd.x, "q4b", "renovacion");
  f = await flag();
  assert.equal(f[e4], false, "la evidencia de la versión retirada por defecto no cuenta como retirada sin defecto");
  assert.equal(f[e4b], true, "la de la versión retirada por renovación sí");
  await politica(bd.x, "pol1", 1, { ...POL_BASE, retired_counts: false });
  assert.deepEqual(await flag(), f);
  await bd.x("INSERT INTO mastery_policies (id, version, rules_json, status) VALUES ('pol2', 2, ?, 'borrador')", [JSON.stringify({ ...POL_BASE, retired_counts: true })]);
  await bd.x("UPDATE mastery_policies SET status = 'aprobada', approved_by = ?, approved_at = 9 WHERE id = 'pol2'", [VA]);
  assert.deepEqual(await flag(), f);
}));
await caso("PV1", "política vigente: la aprobada de mayor versión; sin aprobar o con borradores no hay política", () => conBase(async (bd) => {
  assert.equal(await politicaVigente(bd.c), null);
  await bd.x("INSERT INTO mastery_policies (id, version, rules_json, status) VALUES ('b1', 1, ?, 'borrador')", [JSON.stringify(POL_BASE)]);
  assert.equal(await politicaVigente(bd.c), null, "un borrador no es vigente");
  await politica(bd.x, "p3", 3, { ...POL_BASE, k6_separation: "dia" });
  assert.deepEqual([(await politicaVigente(bd.c))?.id, (await politicaVigente(bd.c))?.politica.k6_separation], ["p3", "dia"]);
  await politica(bd.x, "p2", 2, { ...POL_BASE, k6_separation: "sesion" });
  assert.equal((await politicaVigente(bd.c))?.version, 3, "la mayor versión aprobada, no la última insertada");
  await bd.x("INSERT INTO mastery_policies (id, version, rules_json, status) VALUES ('b9', 9, '{}', 'borrador')");
  assert.equal((await politicaVigente(bd.c))?.version, 3);
}));
await caso("LE1", "leerEstado: sin política no calcula ni escribe; con política pone al día la proyección sin emitir eventos", () => conBase(async (bd) => {
  const { s } = await sesionYRespuesta(bd, EA, "q1", "o2", "c1");
  await registrarRespuesta(bd.c, { estudiante: EA, sesionId: s, preguntaVersionId: "q2", opcionId: "o2", clientSubmissionId: "c2" });
  const t = 4e9;
  let antes = await huella(bd.c);
  assert.deepEqual(await leerEstado(bd.c, EA, t), { politicaEjecutable: false, filas: [] });
  assert.equal(await huella(bd.c), antes, "sin política no escribe nada");
  await politica(bd.x);
  const l = await leerEstado(bd.c, EA, t);
  assert.equal(l.politicaEjecutable, true);
  assert.deepEqual(l.filas.map((f) => [f.itemId, f.state, f.flag, f.policyId, f.domainVersionId]), [["i1", "dominado", null, "pol1", "d1-v1"]]);
  assert.equal(await n(bd.c, "knowledge_state_events"), 0, "leer no emite eventos");
  antes = await huella(bd.c); await leerEstado(bd.c, EA, t + 5); assert.equal(await huella(bd.c), antes, "una segunda lectura (con otro `ahora`) no escribe nada si no hay nada que poner al día");
  await bd.x("DELETE FROM student_knowledge_state");
  const clientes = Array.from({ length: 4 }, () => bd.nueva());
  const res = await Promise.allSettled(clientes.map((k) => leerEstado(k, EA, t)));
  assert.ok(res.some((r) => r.status === "fulfilled")); assert.equal(await n(bd.c, "student_knowledge_state"), 1);
  assert.equal(String((await bd.x("SELECT state FROM student_knowledge_state")).rows[0].state), "dominado");
}));
await caso("LE2", "leerEstado: la actualización está condicionada por computed_through; no pisa una fila cambiada entre la lectura y la escritura", () => conBase(async (bd) => {
  await politica(bd.x);
  const { s } = await sesionYRespuesta(bd, EA, "q1", "o2", "c1");
  const t0 = Number((await bd.x("SELECT computed_through AS t FROM student_knowledge_state")).rows[0].t);
  await registrarRespuesta(bd.c, { estudiante: EA, sesionId: s, preguntaVersionId: "q2", opcionId: "o2", clientSubmissionId: "c2" });
  await bd.x("UPDATE student_knowledge_state SET computed_through = ?, state = 'incierto'", [t0]);
  const otro = bd.nueva();
  const envuelto = { execute: bd.c.execute.bind(bd.c), batch: async (...a: Parameters<Client["batch"]>) => { await otro.execute("UPDATE student_knowledge_state SET computed_through = 9999999999, state = 'no_dominado'"); return bd.c.batch(...a); } } as unknown as Client;
  await leerEstado(envuelto, EA, 4e9);
  const f = (await bd.x("SELECT state, computed_through FROM student_knowledge_state")).rows[0];
  assert.deepEqual([f.state, f.computed_through], ["no_dominado", 9999999999], "la fila modificada por otro no se pisó");
}));
await caso("DE1", "detectores de solo lectura: respuestas sin evidencia y evidencia de versiones retiradas por defecto sin anular", () => conBase(async (bd) => {
  const { s } = await sesionYRespuesta(bd, EA, "q3", "o2", "c1");
  const e3 = (await evidenciaLiberada(bd.c, EA, 4e9)).get("i1")![0].id;
  await retirar(bd.x, "q3", "defecto");
  let antes = await huella(bd.c);
  assert.deepEqual((await retiradasPorDefectoSinAnular(bd.c)).map((x) => [x.evidenciaId, x.estudiante, x.itemId, x.preguntaVersionId]), [[e3, EA, "i1", "q3"]]);
  assert.deepEqual(await respuestasSinEvidencia(bd.c), []);
  assert.equal(await huella(bd.c), antes, "los detectores no modifican nada: no anulan, no excluyen, no reparan");
  assert.equal((await evidenciaLiberada(bd.c, EA, 4e9)).get("i1")![0].anulada, false, "informar no anula");
  await bd.x("INSERT INTO evidence_voids (id, evidence_id, reason, requested_by, approved_by, at) VALUES ('v1', ?, 'defecto', ?, ?, 5)", [e3, AU, VA]);
  assert.deepEqual(await retiradasPorDefectoSinAnular(bd.c), [], "con anulación explícita ya no se informa");
  await sesionYRespuesta(bd, EA, "q1", "o2", "c2", s); await retirar(bd.x, "q1", "renovacion");
  assert.deepEqual(await retiradasPorDefectoSinAnular(bd.c), []);
  await bd.x(`INSERT INTO practice_answers (id, session_id, student_id, purpose, domain_version_id, question_version_id, family_id, item_id, bank, selected_option_id, is_correct, assistance, client_submission_id, answered_at, sequence_no, study_day)
    VALUES ('huerfana', ?, ?, 'practica', 'd1-v1', 'q2', 'f2', 'i1', 'practica', 'o2', 1, 'ninguna', 'ch', 9999, 99, '2027-03-01')`, [s, EA]);
  antes = await huella(bd.c);
  assert.deepEqual(await respuestasSinEvidencia(bd.c), [{ respuestaId: "huerfana", estudiante: EA }]);
  assert.equal(await huella(bd.c), antes);
}));

fs.rmSync(RAIZ, { recursive: true, force: true });
console.log(salida.join("\n"));
console.log(`conocimiento: ok (${casos} casos)`);
await liberarNativos();
