// Mutación de sanidad: demuestra que 3 pruebas nuevas FALLAN si rompo a propósito
// (a) la regla de atraso, (b) el conteo de días en zona horaria, (c) el filtro por estudiante.
// Luego se restaura y se confirma que vuelven a pasar.
import assert from "node:assert/strict";
import fs from "node:fs";
import { execSync } from "node:child_process";

const panelPath = "shared/brujulaPanel.ts";
const original = fs.readFileSync(panelPath, "utf8");
let mutaciones = 0;

function runPanel() {
  try {
    execSync("npx tsx script/brujula-panel.check.ts", { stdio: "inherit", cwd: "/Users/juanpablomonsalvez/Downloads/brkl-motor-brujula" });
    return true;
  } catch {
    return false;
  }
}

// (a) Romper la regla de atraso: cambiar "atrasado" por "al_dia" cuando hay vencidos sin cerrar.
console.log("\n=== MUTACION A: romper regla de atraso ===");
fs.writeFileSync(panelPath, original.replace(
  'vencidosCerrados < vencidos ? "atrasado"',
  'false ? "atrasado"'
));
const aPasa = runPanel();
console.log(aPasa ? "  ERROR: la mutación NO fue detectada (debería fallar)" : "  ✓ La mutación fue detectada (pruebas fallan como se espera)");
mutaciones += aPasa ? 0 : 1;
fs.writeFileSync(panelPath, original);

// (b) Romper el conteo de días en zona horaria: forzar siempre 24h exactas ignorando ymdIn/midnightIn.
console.log("\n=== MUTACION B: romper conteo de días zona horaria ===");
fs.writeFileSync(panelPath, original.replace(
  'if (ymdIn) {',
  'if (false) {'
));
const bPasa = runPanel();
console.log(bPasa ? "  ERROR: la mutación NO fue detectada (debería fallar)" : "  ✓ La mutación fue detectada (pruebas fallan como se espera)");
mutaciones += bPasa ? 0 : 1;
fs.writeFileSync(panelPath, original);

// (c) Romper el filtro por estudiante: en server/brujula.ts, getBrujulaPanel ignora el userId
// y siempre consulta con un userId fijo → un estudiante vería datos de otro.
console.log("\n=== MUTACION C: romper filtro por estudiante en getBrujulaPanel ===");
const brujulaServerPath = "server/brujula.ts";
const brujulaServerOriginal = fs.readFileSync(brujulaServerPath, "utf8");
fs.writeFileSync(brujulaServerPath, brujulaServerOriginal.replace(
  'export async function getBrujulaPanel(db: Db, userId: string, now: Date): Promise<PanelBrujula> {',
  'export async function getBrujulaPanel(db: Db, _userId: string, now: Date): Promise<PanelBrujula> {'
).replace(
  'const { level, input, completed, passed } = await loadVorticeInput(db, userId, now);',
  'const { level, input, completed, passed } = await loadVorticeInput(db, "usuario-fijo-mutacion", now);'
));
// Ejecutar brujula.check.ts: la prueba que verifica panelU2 (sin matrícula) debería fallar
// porque ahora todos los userIds devuelven datos del usuario fijo.
const cPasa = () => {
  try {
    execSync("npx tsx script/brujula.check.ts", { stdio: "inherit", cwd: "/Users/juanpablomonsalvez/Downloads/brkl-motor-brujula" });
    return true;
  } catch {
    return false;
  }
};
const cDetectada = !cPasa();
console.log(cDetectada ? "  ✓ La mutación fue detectada (pruebas fallan como se espera)" : "  ERROR: la mutación NO fue detectada");
mutaciones += cDetectada ? 1 : 0;
fs.writeFileSync(brujulaServerPath, brujulaServerOriginal);

// Restaurar todo y confirmar que pasan
console.log("\n=== RESTAURACION ===");
fs.writeFileSync(panelPath, original);
fs.writeFileSync(brujulaServerPath, brujulaServerOriginal);
const restaurado = runPanel();
console.log(restaurado ? "  ✓ Pruebas restauradas y pasan" : "  ERROR: las pruebas no pasan después de restaurar");

console.log(`\nMutaciones detectadas: ${mutaciones}/3`);
if (mutaciones === 3 && restaurado) {
  console.log("SANITY MUTATION: OK");
} else {
  console.log("SANITY MUTATION: FALLA");
  process.exit(1);
}
