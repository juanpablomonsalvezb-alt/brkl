// Verifica en bases SQLite locales desechables las migraciones SQL preparadas para T37 y T38
// (docs/vortice-migracion.sql y docs/vortice-migracion-incremental-flow-brujula2.sql), su paridad con
// shared/schema.ts, sus constraints e idempotencia, y su convivencia con migrations/vortice/0001..0005.
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
const bSchema = baseArchivo();

try {
  // ── Suite A: Camino completo main -> docs/vortice-migracion.sql -> migrations/vortice/0001..0005 ──
  const cMain = bMain.client;
  await verificarClavesForaneas(cMain);
  await esquemaMinimoMain(cMain);
  await cMain.execute("INSERT INTO levels (id, name, program_type) VALUES ('5b', '5° Básico', 'menores')");
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

  // ── Suite B: Camino incremental (idempotencia + constraints reales en SQLite) ──
  const cInc = bInc.client;
  await verificarClavesForaneas(cInc);
  await cInc.execute("CREATE TABLE users (id TEXT PRIMARY KEY NOT NULL, email TEXT)");
  await cInc.execute("CREATE TABLE reservations (id TEXT PRIMARY KEY NOT NULL, email TEXT)");
  await cInc.execute("INSERT INTO users (id, email) VALUES ('u-1', 'est@prueba.test')");
  await cInc.execute("INSERT INTO reservations (id, email) VALUES ('res-1', 'a@prueba.test'), ('res-2', 'b@prueba.test')");

  await ejecutarArchivoSql(cInc, "docs/vortice-migracion-incremental-flow-brujula2.sql");
  await ejecutarArchivoSql(cInc, "docs/vortice-migracion-incremental-flow-brujula2.sql");

  // flow_subscriptions: valid + FK + UNIQUE + nullable UNIQUE + CHECK
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

  // brujula_preferences: defaults + FK + CHECK
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

  // brujula_study_blocks: valid + UNIQUE(user_id, week_start) + FK
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
} finally {
  await bMain.cerrar();
  await bInc.cerrar();
  await bSchema.cerrar();
}

console.log("migraciones-nuevas: ok");
