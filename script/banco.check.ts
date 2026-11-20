// Pruebas de shared/banco.ts: fuenteCompleta, validacionesDe, preguntaPublicable,
// evaluacionPublicable, PRIORIDAD_PILOTO, SUBTEMAS_PILOTO.
// Ejecutar: npx tsx script/banco.check.ts
//
// Wrapper con vigilante: ejecuta todo el cuerpo de pruebas dentro de un proceso
// hijo (node --import tsx script/banco.check.worker.ts) con timeout de 30 s.
// Si el proceso no termina a tiempo (posible bucle infinito provocado por una
// mutación), el hilo principal lo mata, imprime el mensaje de FALLA y sale
// con código 1.

import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerPath = resolve(__dirname, "banco.check.worker.ts");

const result = spawnSync(process.execPath, ["--import", "tsx", workerPath], {
  stdio: ["ignore", "inherit", "inherit"],
  timeout: 30_000,
  killSignal: "SIGKILL",
  cwd: resolve(__dirname, ".."),
});

if (result.status === null) {
  // timeout expiró
  console.error("FALLA: tiempo agotado (posible bucle infinito)");
  process.exit(1);
}

if (result.error) {
  console.error("FALLA: error al lanzar el worker");
  process.exit(1);
}

process.exit(result.status ?? 1);
