// Salud del esquema de Vórtice (M-R02): sin tablas núcleo ni migraciones aplicadas, el sistema debe
// fallar de forma visible en vez de responder 200 con datos vacíos.
import type { Client } from "@libsql/client";
import { verificarDeriva, type Deriva } from "./migrar";

export function esEntornoEstrictoEsquema(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === "production" || env.VERCEL_ENV === "preview" || env.VORTICE_STRICT_SCHEMA === "1";
}

export const TABLAS_NUCLEO_VORTICE = [
  "sessions", "users", "user_profiles", "enrollments", "lesson_study_progress",
  "knowledge_domains", "knowledge_domain_versions", "knowledge_items", "question_versions",
  "practice_sessions", "evaluation_processes", "evaluation_instances", "evaluation_attempts",
] as const;

export interface SaludEsquema {
  ok: boolean;
  tablasFaltantes: string[];
  deriva: Deriva;
}

export async function verificarSaludEsquemaVortice(c: Client): Promise<SaludEsquema> {
  const r = await c.execute("SELECT name FROM sqlite_master WHERE type = 'table'");
  const existentes = new Set(r.rows.map((x) => String(x.name)));
  const tablasFaltantes = TABLAS_NUCLEO_VORTICE.filter((t) => !existentes.has(t));
  const deriva = await verificarDeriva(c);
  return { ok: tablasFaltantes.length === 0 && !deriva.sinRegistro && deriva.ok, tablasFaltantes, deriva };
}
