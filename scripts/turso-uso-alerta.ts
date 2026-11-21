#!/usr/bin/env tsx
/**
 * Monitor de uso de cuota de la organización Turso (solo lectura via `turso plan show`).
 * Nunca consulta `brkl-db` ni imprime credenciales.
 *
 * Uso:
 *   npx tsx scripts/turso-uso-alerta.ts
 *   npx tsx scripts/turso-uso-alerta.ts --notificar   (envía correo si hay alertas >= 50 % o >= 80 % y hay RESEND_API_KEY/NOTIFY_EMAIL)
 *   npx tsx scripts/turso-uso-alerta.ts --estricto    (sale con 2 si hay aviso >= 50 %, 3 si hay crítico >= 80 %)
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { evaluarUsoTurso, parsearTursoPlanShow, UMBRAL_AVISO_PCT, UMBRAL_CRITICO_PCT } from "../shared/tursoUso";
import { notifyByEmail } from "../server/notify";

function resolverTursoBin(): string {
  if (process.env.TURSO_BIN) return process.env.TURSO_BIN;
  const local = path.join(os.homedir(), ".turso", "turso");
  return fs.existsSync(local) ? local : "turso";
}

async function main() {
  const notificar = process.argv.includes("--notificar");
  const estricto = process.argv.includes("--estricto");
  const bin = resolverTursoBin();

  const salida = execFileSync(bin, ["plan", "show"], { encoding: "utf8", timeout: 20_000 });
  const recursos = parsearTursoPlanShow(salida);
  if (!recursos.length) {
    console.error("No se pudieron interpretar métricas de `turso plan show`.");
    process.exit(1);
  }

  const evalUso = evaluarUsoTurso(recursos);
  console.log(`Uso de Turso (umbrales: aviso >= ${UMBRAL_AVISO_PCT}%, crítico >= ${UMBRAL_CRITICO_PCT}%): nivel=${evalUso.nivelGlobal}`);
  for (const r of evalUso.recursos) {
    console.log(`  [${r.nivel.toUpperCase().padEnd(7)}] ${r.recurso}: ${r.usado} / ${r.limite} (${r.porcentaje}%)`);
  }

  if (evalUso.alertas.length && notificar) {
    const filas: Record<string, string> = {};
    for (const a of evalUso.alertas) {
      filas[`${a.recurso} (${a.nivel})`] = `${a.usado} / ${a.limite} (${a.porcentaje}% >= ${a.umbral}%)`;
    }
    await notifyByEmail(`Alerta uso Turso (${evalUso.nivelGlobal.toUpperCase()})`, filas);
  }

  if (estricto) {
    if (evalUso.nivelGlobal === "critico") process.exit(3);
    if (evalUso.nivelGlobal === "aviso") process.exit(2);
  }
}

main().catch((err) => {
  console.error("Error al revisar uso de Turso:", (err as Error).message);
  process.exit(1);
});
