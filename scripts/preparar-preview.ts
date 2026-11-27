#!/usr/bin/env tsx
/**
 * Prepara la base de PRUEBAS de Vercel Preview (brkl-preview-*) para la evaluación E2 de Vórtice.
 * Escribe solo allí: rechaza cualquier host que no sea brkl-preview-*.turso.io, aunque se le pase otro.
 * Variables (solo de este proceso, nunca se imprimen): PREVIEW_DB_URL, PREVIEW_DB_TOKEN.
 * Uso:  tsx scripts/preparar-preview.ts --solo-verificar   (lee, no escribe)
 *       tsx scripts/preparar-preview.ts                    (migra 0001-0005 y siembra la evaluación)
 * Opcional: EVALUACION_ID (por omisión ficticio-e2, de la siembra ficticia existente).
 */
import { crearClienteDb, verificarClavesForaneas } from "../server/cliente";
import { PREVIEW_HOST_PATTERN } from "../server/dbGuard";
import { aplicarMigracionesUnificadas } from "../server/migrarTodo";
import { sembrarLeccionesAulaUniversalSql } from "../server/aulaUniversalDb";
import { sembrarPilotoPractica } from "../server/sembrarPilotoPractica";
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

const { aplicadas, deriva: d } = await aplicarMigracionesUnificadas(c);
console.log("Migraciones aplicadas ahora:", aplicadas.join(", ") || "ninguna (ya estaban)");
console.log("Deriva:", JSON.stringify({ ok: d.ok, faltantes: d.faltantes, alterados: d.alterados }));

const evaluacionId = process.env.EVALUACION_ID ?? "ficticio-e2";
const ev = await x("SELECT o.level_subject_id AS ls FROM module_evaluations m JOIN learning_objectives o ON o.id = m.learning_objective_id WHERE m.id = ?", [evaluacionId]);
if (!ev.rows.length) fallar(`la evaluación ${evaluacionId} no existe en la base de pruebas`);
const lsId = String((ev.rows[0] as any).ls);

// M-R06: sembrar lecciones de Aula Universal en BD y activar delivery_mode = 'aula_universal' para Matemática 5.º.
const aulaSeed = await sembrarLeccionesAulaUniversalSql(c, { levelSubjectId: lsId });
console.log("Aula Universal BD:", JSON.stringify(aulaSeed));

// M-R03: asegurar siempre de forma idempotente el dominio único publicado (`d-piloto-mat5-u3`), banco práctica y política.
const prac = await sembrarPilotoPractica(c, { levelSubjectId: lsId });
console.log("Dominio piloto práctica:", prac.domainId, prac.yaPublicado ? "(ya publicado)" : "(publicado ahora)");

const ya = await x("SELECT 1 FROM evaluation_versions WHERE evaluation_id = ?", [evaluacionId]);
if (ya.rows.length) {
  console.log("La evaluación ya tiene versión: no se siembra de nuevo.");
} else {
  await sembrarEvaluacionPiloto(x, { levelSubjectId: lsId, evaluacionId, versionId: "ev-preview-1" });
}
const n = await x("SELECT (SELECT COUNT(*) FROM question_versions WHERE bank = 'practica') AS qp, (SELECT COUNT(*) FROM question_versions WHERE bank = 'evaluacion') AS qe, (SELECT COUNT(*) FROM evaluation_version_questions) AS v");
console.log("Sembrado unificado:", JSON.stringify(n.rows[0]), "-> evaluación", evaluacionId);
