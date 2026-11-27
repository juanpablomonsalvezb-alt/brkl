// Runner unificado e idempotente de migraciones de Vórtice (M-R08).
// Aplica en una sola operación verificada:
// 1. Migraciones SQL protegidas `migrations/vortice/0001..0006` con registro `vortice_migraciones`.
// 2. Migraciones incrementales (`flow-brujula2`, `aula-universal`) + tabla `universal_lessons`.
// 3. Columnas aditivas idempotentes en `user_profiles`, `module_evaluations` y `level_subjects.delivery_mode`.
// 4. Verificación final `verificarDeriva(c)` (falla si existe deriva de esquema).
import fs from "node:fs";
import path from "node:path";
import type { Client } from "@libsql/client";
import { migrar, verificarDeriva, type Deriva } from "./migrar";

const INCREMENTALES_SQL = [
  "docs/vortice-migracion-incremental-flow-brujula2.sql",
  "docs/vortice-migracion-incremental-aula-universal.sql",
] as const;

const DDL_UNIVERSAL_LESSONS = `CREATE TABLE IF NOT EXISTS universal_lessons (
  id TEXT PRIMARY KEY NOT NULL,
  oa_id TEXT NOT NULL UNIQUE,
  level_subject_id TEXT NOT NULL,
  learning_objective_id TEXT,
  knowledge_item_id TEXT,
  version INTEGER DEFAULT 1 NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at INTEGER DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
)`;

async function ejecutarSqlArchivo(c: Client, rutaRelativa: string): Promise<void> {
  const ruta = path.resolve(rutaRelativa);
  const sentencias = fs
    .readFileSync(ruta, "utf8")
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("--"))
    .join("\n")
    .replaceAll("--> statement-breakpoint", ";")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const s of sentencias) {
    await c.execute(s);
  }
}

async function columnasDeTabla(c: Client, tabla: string): Promise<Set<string>> {
  const r = await c.execute(`PRAGMA table_info(${tabla})`);
  return new Set(r.rows.map((row) => String(row.name)));
}

export async function aplicarMigracionesUnificadas(
  c: Client,
  opts: { dirMigraciones?: string } = {},
): Promise<{ aplicadas: string[]; deriva: Deriva }> {
  const { aplicadas } = await migrar(c, opts.dirMigraciones);

  for (const rutaInc of INCREMENTALES_SQL) {
    await ejecutarSqlArchivo(c, rutaInc);
  }
  await c.execute(DDL_UNIVERSAL_LESSONS);

  const upCols = await columnasDeTabla(c, "user_profiles");
  if (upCols.size > 0) {
    const colsUpAgregar: Array<[string, string]> = [
      ["evaluation_profile", "ALTER TABLE `user_profiles` ADD `evaluation_profile` text DEFAULT 'regular' NOT NULL CHECK(`evaluation_profile` IN ('regular', 'neurodivergente'))"],
      ["evaluation_profile_set_by", "ALTER TABLE `user_profiles` ADD `evaluation_profile_set_by` text"],
      ["evaluation_profile_set_at", "ALTER TABLE `user_profiles` ADD `evaluation_profile_set_at` integer"],
    ];
    for (const [col, ddl] of colsUpAgregar) {
      if (!upCols.has(col)) await c.execute(ddl);
    }
  }

  const meCols = await columnasDeTabla(c, "module_evaluations");
  if (meCols.size > 0 && !meCols.has("evaluation_function")) {
    await c.execute("ALTER TABLE `module_evaluations` ADD `evaluation_function` text CHECK(`evaluation_function` IS NULL OR `evaluation_function` IN ('diagnostico', 'proceso', 'modulo'))");
  }

  const lsCols = await columnasDeTabla(c, "level_subjects");
  if (lsCols.size > 0 && !lsCols.has("delivery_mode")) {
    await c.execute("ALTER TABLE `level_subjects` ADD `delivery_mode` text DEFAULT 'legacy' NOT NULL CHECK(`delivery_mode` IN ('legacy', 'aula_universal'))");
  }

  const deriva = await verificarDeriva(c);
  if (!deriva.ok) {
    throw new Error(`Deriva de esquema tras migración unificada: faltan [${deriva.faltantes.join(", ")}], alterados [${deriva.alterados.join(", ")}]`);
  }

  return { aplicadas, deriva };
}
