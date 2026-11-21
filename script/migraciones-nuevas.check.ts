// Verifica en bases SQLite locales desechables las migraciones SQL preparadas para T37, T38 y T39
// (docs/vortice-migracion.sql, docs/vortice-migracion-incremental-flow-brujula2.sql y
// docs/vortice-migracion-incremental-perfil-y-evaluaciones.sql), su paridad con shared/schema.ts,
// sus constraints e idempotencia, y su convivencia con migrations/vortice/0001..0005.
// Nunca toca Turso ni producción.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import fs from "node:fs";
import type { Client } from "@libsql/client";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import { verificarClavesForaneas } from "../server/cliente";
import { migrar, verificarDeriva } from "../server/migrar";
import * as schema from "../shared/schema";
import { baseArchivo } from "./lib/basePrueba";

function sentenciasSql(ruta: string): string[] {
  const sinComentarios = fs
    .readFileSync(ruta, "utf8")
    .split("\n")
    .filter((linea) => !linea.trimStart().startsWith("--"))
    .join("\n")
    .replaceAll("--> statement-breakpoint", ";");
  return sinComentarios
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function ejecutarArchivoSql(c: Client, ruta: string): Promise<void> {
  for (const sql of sentenciasSql(ruta)) {
    await c.execute(sql);
  }
}

async function esquemaMinimoMain(c: Client): Promise<void> {
  const ddls = [
    `CREATE TABLE users (id TEXT PRIMARY KEY NOT NULL, email TEXT, name TEXT)`,
    `CREATE TABLE levels (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, program_type TEXT NOT NULL, total_weeks INTEGER DEFAULT 30 NOT NULL, sort_order INTEGER DEFAULT 0 NOT NULL)`,
    `CREATE TABLE subjects (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL)`,
    `CREATE TABLE level_subjects (id TEXT PRIMARY KEY NOT NULL, level_id TEXT NOT NULL REFERENCES levels(id), subject_id TEXT NOT NULL REFERENCES subjects(id))`,
    `CREATE TABLE learning_objectives (id TEXT PRIMARY KEY NOT NULL, level_subject_id TEXT NOT NULL REFERENCES level_subjects(id), code TEXT NOT NULL, title TEXT NOT NULL, week_number INTEGER NOT NULL)`,
    `CREATE TABLE weekly_resources (id TEXT PRIMARY KEY NOT NULL, learning_objective_id TEXT NOT NULL REFERENCES learning_objectives(id), resource_type TEXT NOT NULL, title TEXT NOT NULL)`,
    `CREATE TABLE module_evaluations (id TEXT PRIMARY KEY NOT NULL, learning_objective_id TEXT NOT NULL REFERENCES learning_objectives(id), evaluation_number INTEGER NOT NULL, title TEXT NOT NULL, release_week INTEGER NOT NULL)`,
    `CREATE TABLE evaluation_progress (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL REFERENCES users(id), evaluation_id TEXT NOT NULL REFERENCES module_evaluations(id), completed_at INTEGER, score INTEGER, total_correct INTEGER, total_questions INTEGER, answers_json TEXT, passed INTEGER DEFAULT 0)`,
    `CREATE TABLE reservations (id TEXT PRIMARY KEY NOT NULL, full_name TEXT NOT NULL, rut TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, date_of_birth TEXT NOT NULL, program_type TEXT NOT NULL, status TEXT DEFAULT 'pending' NOT NULL)`,
    `CREATE TABLE program_calendar (id TEXT PRIMARY KEY NOT NULL, level_id TEXT NOT NULL REFERENCES levels(id), start_date INTEGER NOT NULL, module_duration_weeks INTEGER DEFAULT 2 NOT NULL, created_at INTEGER)`,
    `CREATE TABLE user_profiles (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, role TEXT DEFAULT 'student' NOT NULL, level_id TEXT, created_at INTEGER)`,
    `CREATE TABLE together_presence (client_id TEXT PRIMARY KEY, display_name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT, last_seen INTEGER NOT NULL, room TEXT)`,
  ];
  for (const s of ddls) await c.execute(s);
}

type ColInfo = { name: string; notnull: number; pk: number };

async function describirTabla(c: Client, tabla: string): Promise<{ cols: ColInfo[]; uniqueIndexes: string[] }> {
  const info = await c.execute(`PRAGMA table_info(${tabla})`);
  const cols: ColInfo[] = info.rows.map((r: any) => ({
    name: String(r.name),
    notnull: Number(r.notnull),
    pk: Number(r.pk),
  }));
  const idx = await c.execute(`PRAGMA index_list(${tabla})`);
  const uniqueIndexes = idx.rows
    .filter((r: any) => Number(r.unique) === 1 && !String(r.name).startsWith("sqlite_autoindex_"))
    .map((r: any) => String(r.name))
    .sort();
  return { cols, uniqueIndexes };
}

const bMain = baseArchivo();
const bInc = baseArchivo();
const bIncPerfil = baseArchivo();
const bIncAula = baseArchivo();
const bSchema = baseArchivo();

try {
  // ── Suite A: Camino completo main -> docs/vortice-migracion.sql -> migrations/vortice/0001..0005 ──
  const cMain = bMain.client;
  await verificarClavesForaneas(cMain);
  await esquemaMinimoMain(cMain);
  await cMain.execute("INSERT INTO levels (id, name, program_type) VALUES ('5b', '5° Básico', 'menores')");
  await cMain.execute("INSERT INTO subjects (id, name, slug) VALUES ('mat', 'Matemática', 'matematica')");
  await cMain.execute("INSERT INTO level_subjects (id, level_id, subject_id) VALUES ('ls-5b', '5b', 'mat')");
  await cMain.execute("INSERT INTO learning_objectives (id, level_subject_id, code, title, week_number) VALUES ('oa-1', 'ls-5b', 'OA 1', 'Números', 1)");
  // 2027-03-08 00:00:00 UTC = 1804464000 s
  await cMain.execute(
    "INSERT INTO program_calendar (id, level_id, start_date, module_duration_weeks, created_at) VALUES ('cal-seed', '5b', 1804464000, 2, 1700000000000)",
  );

  await ejecutarArchivoSql(cMain, "docs/vortice-migracion.sql");
  await verificarClavesForaneas(cMain);
  const fkCheck = await cMain.execute("PRAGMA foreign_key_check");
  assert.equal(fkCheck.rows.length, 0, "foreign_key_check debe quedar vacío tras vortice-migracion.sql");

  const calMigrado = await cMain.execute(
    "SELECT id, academic_year, level_id, module_duration_weeks, total_modules FROM program_calendar WHERE id = 'cal-seed'",
  );
  assert.equal(calMigrado.rows.length, 1);
  assert.equal(Number((calMigrado.rows[0] as any).academic_year), 2027);
  assert.equal(String((calMigrado.rows[0] as any).level_id), "5b");
  assert.equal(Number((calMigrado.rows[0] as any).total_modules), 15);

  const tpCols = await cMain.execute("PRAGMA table_info(together_presence)");
  assert.ok(!tpCols.rows.some((r: any) => String(r.name) === "email"), "together_presence.email debe quedar eliminada");

  // Columnas T39 y sus CHECK en la consolidada.
  await assert.rejects(
    cMain.execute("INSERT INTO user_profiles (id, user_id, evaluation_profile) VALUES ('up-bad', 'u-bad', 'otro')"),
    /CHECK/,
  );
  await assert.rejects(
    cMain.execute("INSERT INTO module_evaluations (id, learning_objective_id, evaluation_number, title, release_week, evaluation_function) VALUES ('me-bad', 'oa-1', 1, 'X', 1, 'invalida')"),
    /CHECK/,
  );

  const resMigr = await migrar(cMain, "migrations/vortice");
  assert.deepEqual(resMigr.aplicadas, [
    "0001_catalogo.sql",
    "0002_banco.sql",
    "0003_integridad_catalogo.sql",
    "0004_evidencia_practica.sql",
    "0005_evaluacion.sql",
  ]);
  assert.equal((await verificarDeriva(cMain)).ok, true);
  assert.deepEqual((await migrar(cMain, "migrations/vortice")).aplicadas, []);

  // ── Suite B: Camino incremental Flow + Brújula 2 ──
  const cInc = bInc.client;
  await verificarClavesForaneas(cInc);
  await cInc.execute("CREATE TABLE users (id TEXT PRIMARY KEY NOT NULL, email TEXT)");
  await cInc.execute("CREATE TABLE reservations (id TEXT PRIMARY KEY NOT NULL, email TEXT)");
  await cInc.execute("INSERT INTO users (id, email) VALUES ('u-1', 'est@prueba.test')");
  await cInc.execute("INSERT INTO reservations (id, email) VALUES ('res-1', 'a@prueba.test'), ('res-2', 'b@prueba.test')");

  await ejecutarArchivoSql(cInc, "docs/vortice-migracion-incremental-flow-brujula2.sql");
  await ejecutarArchivoSql(cInc, "docs/vortice-migracion-incremental-flow-brujula2.sql");

  await cInc.execute(
    "INSERT INTO flow_subscriptions (id, reservation_id, flow_plan_id, flow_customer_id, register_token, flow_subscription_id, amount, periods_total) VALUES ('fs-1', 'res-1', 'plan-1', 'cust-1', 'tok-1', 'sub-1', 70000, 7)",
  );
  await assert.rejects(
    cInc.execute(
      "INSERT INTO flow_subscriptions (id, reservation_id, flow_plan_id, flow_customer_id, amount, periods_total) VALUES ('fs-bad-fk', 'res-inexistente', 'plan-1', 'cust-x', 70000, 7)",
    ),
    /FOREIGN KEY/,
  );
  await assert.rejects(
    cInc.execute(
      "INSERT INTO flow_subscriptions (id, reservation_id, flow_plan_id, flow_customer_id, amount, periods_total) VALUES ('fs-dup-res', 'res-1', 'plan-1', 'cust-2', 70000, 7)",
    ),
    /UNIQUE/,
  );
  await assert.rejects(
    cInc.execute(
      "INSERT INTO flow_subscriptions (id, reservation_id, flow_plan_id, flow_customer_id, register_token, amount, periods_total) VALUES ('fs-dup-tok', 'res-2', 'plan-1', 'cust-2', 'tok-1', 70000, 7)",
    ),
    /UNIQUE/,
  );
  await assert.rejects(
    cInc.execute(
      "INSERT INTO flow_subscriptions (id, reservation_id, flow_plan_id, flow_customer_id, flow_subscription_id, amount, periods_total) VALUES ('fs-dup-sub', 'res-2', 'plan-1', 'cust-2', 'sub-1', 70000, 7)",
    ),
    /UNIQUE/,
  );
  await cInc.execute(
    "INSERT INTO flow_subscriptions (id, reservation_id, flow_plan_id, flow_customer_id, register_token, flow_subscription_id, amount, periods_total) VALUES ('fs-null-1', 'res-2', 'plan-1', 'cust-2', NULL, NULL, 70000, 7)",
  );
  await cInc.execute("INSERT INTO reservations (id, email) VALUES ('res-3', 'c@prueba.test')");
  await cInc.execute(
    "INSERT INTO flow_subscriptions (id, reservation_id, flow_plan_id, flow_customer_id, register_token, flow_subscription_id, amount, periods_total) VALUES ('fs-null-2', 'res-3', 'plan-1', 'cust-3', NULL, NULL, 70000, 7)",
  );
  await assert.rejects(
    cInc.execute("UPDATE flow_subscriptions SET status = 'invalido' WHERE id = 'fs-1'"),
    /CHECK/,
  );
  await cInc.execute("INSERT INTO reservations (id, email) VALUES ('res-4', 'd@prueba.test')");
  await assert.rejects(
    cInc.execute(
      "INSERT INTO flow_subscriptions (id, reservation_id, flow_plan_id, flow_customer_id, amount, periods_total) VALUES ('fs-bad-per', 'res-4', 'plan-1', 'cust-4', 70000, 0)",
    ),
    /CHECK/,
  );

  await cInc.execute("INSERT INTO brujula_preferences (user_id) VALUES ('u-1')");
  const pref = await cInc.execute("SELECT intensidad, dias_preferidos_json, franja FROM brujula_preferences WHERE user_id = 'u-1'");
  assert.equal(String((pref.rows[0] as any).intensidad), "normal");
  assert.equal(String((pref.rows[0] as any).dias_preferidos_json), "[1,2,3,4,5]");
  assert.equal(String((pref.rows[0] as any).franja), "tarde");

  await assert.rejects(
    cInc.execute("INSERT INTO brujula_preferences (user_id) VALUES ('u-no-existe')"),
    /FOREIGN KEY/,
  );
  await assert.rejects(
    cInc.execute("UPDATE brujula_preferences SET intensidad = 'extremo' WHERE user_id = 'u-1'"),
    /CHECK/,
  );
  await assert.rejects(
    cInc.execute("UPDATE brujula_preferences SET franja = 'madrugada' WHERE user_id = 'u-1'"),
    /CHECK/,
  );

  await cInc.execute(
    "INSERT INTO brujula_study_blocks (id, user_id, week_start, blocks_json) VALUES ('bsb-1', 'u-1', '2027-03-08', '[]')",
  );
  await assert.rejects(
    cInc.execute(
      "INSERT INTO brujula_study_blocks (id, user_id, week_start, blocks_json) VALUES ('bsb-2', 'u-1', '2027-03-08', '[]')",
    ),
    /UNIQUE/,
  );
  await assert.rejects(
    cInc.execute(
      "INSERT INTO brujula_study_blocks (id, user_id, week_start, blocks_json) VALUES ('bsb-bad', 'u-no-existe', '2027-03-08', '[]')",
    ),
    /FOREIGN KEY/,
  );

  // ── Suite B2: Camino incremental T39 (perfil de evaluación y función de evaluación) ──
  const cIncP = bIncPerfil.client;
  await verificarClavesForaneas(cIncP);
  await cIncP.execute("CREATE TABLE learning_objectives (id TEXT PRIMARY KEY NOT NULL)");
  await cIncP.execute("CREATE TABLE user_profiles (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, role TEXT DEFAULT 'student' NOT NULL, level_id TEXT, tutor_user_id TEXT, created_at INTEGER)");
  await cIncP.execute("CREATE TABLE module_evaluations (id TEXT PRIMARY KEY NOT NULL, learning_objective_id TEXT NOT NULL REFERENCES learning_objectives(id), evaluation_number INTEGER NOT NULL, title TEXT NOT NULL, release_week INTEGER NOT NULL)");
  await cIncP.execute("INSERT INTO learning_objectives (id) VALUES ('oa-1')");
  await cIncP.execute("INSERT INTO user_profiles (id, user_id, role) VALUES ('up-prev', 'u-1', 'student')");
  await cIncP.execute("INSERT INTO module_evaluations (id, learning_objective_id, evaluation_number, title, release_week) VALUES ('me-prev', 'oa-1', 2, 'Evaluación Formativa 2', 1)");

  await ejecutarArchivoSql(cIncP, "docs/vortice-migracion-incremental-perfil-y-evaluaciones.sql");

  const upPrev = await cIncP.execute("SELECT evaluation_profile, evaluation_profile_set_by, evaluation_profile_set_at FROM user_profiles WHERE id = 'up-prev'");
  assert.equal(String((upPrev.rows[0] as any).evaluation_profile), "regular");
  assert.equal((upPrev.rows[0] as any).evaluation_profile_set_by, null);
  assert.equal((upPrev.rows[0] as any).evaluation_profile_set_at, null);

  const mePrev = await cIncP.execute("SELECT evaluation_function FROM module_evaluations WHERE id = 'me-prev'");
  assert.equal((mePrev.rows[0] as any).evaluation_function, null, "no autoclasifica historial previo");

  await assert.rejects(
    cIncP.execute("UPDATE user_profiles SET evaluation_profile = 'otro' WHERE id = 'up-prev'"),
    /CHECK/,
  );
  await cIncP.execute("UPDATE user_profiles SET evaluation_profile = 'neurodivergente', evaluation_profile_set_by = 'adm-1', evaluation_profile_set_at = 1700000000 WHERE id = 'up-prev'");

  await assert.rejects(
    cIncP.execute("UPDATE module_evaluations SET evaluation_function = 'sumativa' WHERE id = 'me-prev'"),
    /CHECK/,
  );
  for (const [idx, fn] of [[0, "diagnostico"], [1, "proceso"], [4, "modulo"]] as const) {
    await cIncP.execute({
      sql: "INSERT INTO module_evaluations (id, learning_objective_id, evaluation_number, title, release_week, evaluation_function) VALUES (?, 'oa-1', ?, 'T', 1, ?)",
      args: [`me-fn-${idx}`, idx, fn],
    });
  }

  // ── Suite B3: Camino incremental Aula Universal UDL (lesson_study_progress) ──
  const cIncA = bIncAula.client;
  await verificarClavesForaneas(cIncA);
  await cIncA.execute("CREATE TABLE users (id TEXT PRIMARY KEY NOT NULL, email TEXT)");
  await cIncA.execute("INSERT INTO users (id, email) VALUES ('u-aula', 'aula@prueba.test')");
  await ejecutarArchivoSql(cIncA, "docs/vortice-migracion-incremental-aula-universal.sql");
  await ejecutarArchivoSql(cIncA, "docs/vortice-migracion-incremental-aula-universal.sql");

  await cIncA.execute(
    "INSERT INTO lesson_study_progress (id, user_id, oa_id, paso_actual, tramo_actual, puerta_preferida, paso_ejemplo_visto) VALUES ('lsp-1', 'u-aula', 'oa11', 'aprende', 1, 'explorar', 2)",
  );
  await assert.rejects(
    cIncA.execute("INSERT INTO lesson_study_progress (id, user_id, oa_id) VALUES ('lsp-dup', 'u-aula', 'oa11')"),
    /UNIQUE/,
  );
  await assert.rejects(
    cIncA.execute("INSERT INTO lesson_study_progress (id, user_id, oa_id) VALUES ('lsp-fk', 'u-inexistente', 'oa7')"),
    /FOREIGN KEY/,
  );
  await assert.rejects(
    cIncA.execute("UPDATE lesson_study_progress SET paso_actual = 'inventado' WHERE id = 'lsp-1'"),
    /CHECK/,
  );
  await assert.rejects(
    cIncA.execute("UPDATE lesson_study_progress SET puerta_preferida = 'otra' WHERE id = 'lsp-1'"),
    /CHECK/,
  );

  // ── Suite C: Paridad exacta con shared/schema.ts generado por drizzle-kit ──
  const cSchema = bSchema.client;
  const ddlSchema = await generateSQLiteMigration(
    await generateSQLiteDrizzleJson({}),
    await generateSQLiteDrizzleJson(schema as any),
  );
  for (const s of ddlSchema) await cSchema.execute(s);

  for (const tabla of ["flow_subscriptions", "brujula_preferences", "brujula_study_blocks"] as const) {
    const esperado = await describirTabla(cSchema, tabla);
    const deConsolidada = await describirTabla(cMain, tabla);
    const deIncremental = await describirTabla(cInc, tabla);
    assert.deepEqual(deConsolidada, esperado, `${tabla} en docs/vortice-migracion.sql difiere de shared/schema.ts`);
    assert.deepEqual(
      deIncremental,
      esperado,
      `${tabla} en docs/vortice-migracion-incremental-flow-brujula2.sql difiere de shared/schema.ts`,
    );
  }

  const lspEsperado = await describirTabla(cSchema, "lesson_study_progress");
  const lspConsolidada = await describirTabla(cMain, "lesson_study_progress");
  const lspIncremental = await describirTabla(cIncA, "lesson_study_progress");
  assert.deepEqual(lspConsolidada, lspEsperado, "lesson_study_progress en consolidada difiere de shared/schema.ts");
  assert.deepEqual(lspIncremental, lspEsperado, "lesson_study_progress en incremental aula difiere de shared/schema.ts");

  // Paridad de columnas nuevas T39 entre shared/schema.ts, consolidada e incremental.
  const extraerCols = (cols: ColInfo[], nombres: string[]) =>
    nombres.map((n) => cols.find((c) => c.name === n));
  const upSchema = extraerCols((await describirTabla(cSchema, "user_profiles")).cols, [
    "evaluation_profile", "evaluation_profile_set_by", "evaluation_profile_set_at",
  ]);
  const upCons = extraerCols((await describirTabla(cMain, "user_profiles")).cols, [
    "evaluation_profile", "evaluation_profile_set_by", "evaluation_profile_set_at",
  ]);
  const upInc = extraerCols((await describirTabla(cIncP, "user_profiles")).cols, [
    "evaluation_profile", "evaluation_profile_set_by", "evaluation_profile_set_at",
  ]);
  assert.deepEqual(upCons, upSchema, "user_profiles en consolidada difiere de shared/schema.ts");
  assert.deepEqual(upInc, upSchema, "user_profiles en incremental T39 difiere de shared/schema.ts");

  const meSchema = extraerCols((await describirTabla(cSchema, "module_evaluations")).cols, ["evaluation_function"]);
  const meCons = extraerCols((await describirTabla(cMain, "module_evaluations")).cols, ["evaluation_function"]);
  const meInc = extraerCols((await describirTabla(cIncP, "module_evaluations")).cols, ["evaluation_function"]);
  assert.deepEqual(meCons, meSchema, "module_evaluations en consolidada difiere de shared/schema.ts");
  assert.deepEqual(meInc, meSchema, "module_evaluations en incremental T39 difiere de shared/schema.ts");
} finally {
  await bMain.cerrar();
  await bInc.cerrar();
  await bIncPerfil.cerrar();
  await bIncAula.cerrar();
  await bSchema.cerrar();
}

console.log("migraciones-nuevas: ok");
