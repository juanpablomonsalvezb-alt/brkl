#!/usr/bin/env tsx
/**
 * Prepara la base de PRUEBAS de Vercel Preview (brkl-preview-*) para la evaluación E2 de Vórtice.
 * Escribe solo allí: rechaza cualquier host que no sea brkl-preview-*.turso.io, aunque se le pase otro.
 * Variables (solo de este proceso, nunca se imprimen): PREVIEW_DB_URL, PREVIEW_DB_TOKEN.
 * Uso:  tsx scripts/preparar-preview.ts --solo-verificar   (lee, no escribe)
 *       tsx scripts/preparar-preview.ts                    (migra 0001-0005 y siembra la evaluación)
 * Opcional: EVALUACION_ID (por omisión ficticio-e2, de la siembra ficticia existente).
 */
import fs from "node:fs";
import { crearClienteDb, verificarClavesForaneas } from "../server/cliente";
import { PREVIEW_HOST_PATTERN } from "../server/dbGuard";
import { migrar, verificarDeriva } from "../server/migrar";
import { sembrarEvaluacionPiloto } from "../script/lib/sembrarEvaluacionPiloto";

const soloVerificar = process.argv.includes("--solo-verificar");
const url = process.env.PREVIEW_DB_URL, token = process.env.PREVIEW_DB_TOKEN;
const fallar = (m: string): never => { console.error("Abortado: " + m); process.exit(1); };
if (process.env.NODE_ENV === "production") fallar("NODE_ENV=production");
if (!url || !token) fallar("faltan PREVIEW_DB_URL y PREVIEW_DB_TOKEN");
const host = new URL(url!).hostname;
if (!PREVIEW_HOST_PATTERN.test(host)) fallar(`el host ${host} no es una base de pruebas brkl-preview-*`);

const c = crearClienteDb(url!, token);
const x = (s: string, a: any[] = []) => c.execute({ sql: s, args: a });
console.log("Base de pruebas:", host);

try { await verificarClavesForaneas(c); console.log("PRAGMA foreign_keys = 1 (activas)"); }
catch (e) { fallar("las claves foráneas NO están activas en la conexión remota: " + (e as Error).message); }

const antes = (await x("SELECT name FROM sqlite_master WHERE type='table' AND name = 'vortice_migraciones'")).rows.length;
console.log("Registro de migraciones Vórtice:", antes ? "existe" : "aún no existe");
if (soloVerificar) { console.log("Solo verificación: sin cambios."); process.exit(0); }

const r = await migrar(c);
console.log("Migraciones aplicadas ahora:", r.aplicadas.join(", ") || "ninguna (ya estaban)");

// Migraciones incrementales T37/T38 (IF NOT EXISTS), Aula Universal UDL y T39 (columnas idempotentes en user_profiles/module_evaluations).
const ejecutarSqlArchivo = async (ruta: string) => {
  const sentencias = fs
    .readFileSync(ruta, "utf8")
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("--"))
    .join("\n")
    .replaceAll("--> statement-breakpoint", ";")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const s of sentencias) await x(s);
};

for (const rutaInc of [
  "docs/vortice-migracion-incremental-flow-brujula2.sql",
  "docs/vortice-migracion-incremental-aula-universal.sql",
]) {
  await ejecutarSqlArchivo(rutaInc);
}

const colsTabla = async (tabla: string) =>
  new Set((await x(`PRAGMA table_info(${tabla})`)).rows.map((row: any) => String(row.name)));
const upCols = await colsTabla("user_profiles");
const colsUpAgregar: Array<[string, string]> = [
  ["evaluation_profile", "ALTER TABLE `user_profiles` ADD `evaluation_profile` text DEFAULT 'regular' NOT NULL CHECK(`evaluation_profile` IN ('regular', 'neurodivergente'))"],
  ["evaluation_profile_set_by", "ALTER TABLE `user_profiles` ADD `evaluation_profile_set_by` text"],
  ["evaluation_profile_set_at", "ALTER TABLE `user_profiles` ADD `evaluation_profile_set_at` integer"],
];
for (const [col, ddl] of colsUpAgregar) {
  if (!upCols.has(col)) await x(ddl);
}
const meCols = await colsTabla("module_evaluations");
if (!meCols.has("evaluation_function")) {
  await x("ALTER TABLE `module_evaluations` ADD `evaluation_function` text CHECK(`evaluation_function` IS NULL OR `evaluation_function` IN ('diagnostico', 'proceso', 'modulo'))");
}

const d = await verificarDeriva(c);
console.log("Deriva:", JSON.stringify({ ok: d.ok, faltantes: d.faltantes, alterados: d.alterados }));
if (!d.ok) fallar("la base no coincide con las migraciones");

const evaluacionId = process.env.EVALUACION_ID ?? "ficticio-e2";
const ev = await x("SELECT o.level_subject_id AS ls FROM module_evaluations m JOIN learning_objectives o ON o.id = m.learning_objective_id WHERE m.id = ?", [evaluacionId]);
if (!ev.rows.length) fallar(`la evaluación ${evaluacionId} no existe en la base de pruebas`);
const ya = await x("SELECT 1 FROM evaluation_versions WHERE evaluation_id = ?", [evaluacionId]);
if (ya.rows.length) { console.log("La evaluación ya tiene versión: no se siembra de nuevo."); process.exit(0); }
await sembrarEvaluacionPiloto(x, { levelSubjectId: String((ev.rows[0] as any).ls), evaluacionId, versionId: "ev-preview-1", dominioId: "d-preview", oaCurricularId: "oa-preview" });
const n = await x("SELECT (SELECT COUNT(*) FROM question_versions) AS q, (SELECT COUNT(*) FROM evaluation_version_questions) AS v");
console.log("Sembrado:", JSON.stringify(n.rows[0]), "→ evaluación", evaluacionId);
