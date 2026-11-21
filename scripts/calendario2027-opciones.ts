#!/usr/bin/env npx tsx
// Script informativo: imprime la tabla de opciones de calendario 2027 por nivel.
// Solo lectura, no escribe en ninguna base.
// Ejecutar: npx tsx scripts/calendario2027-opciones.ts

import {
  PERFILES_2027,
  SUPUESTOS_2027,
  imprimirTablaOpciones,
  formatearFecha,
} from "../shared/calendario2027";

console.log("╔════════════════════════════════════════════════════════════════════════════╗");
console.log("║              CALENDARIO 2027 — TABLA DE OPCIONES POR NIVEL                ║");
console.log("╚════════════════════════════════════════════════════════════════════════════╝");
console.log();

// Nota sobre supuestos
console.log("⚠️  NOTA: Los recesos y feriados son SUPUESTOS basados en patrones 2026.");
console.log(`   ${SUPUESTOS_2027.nota}`);
console.log("   PENDIENTE: reemplazar con la resolución exenta Mineduc 2027.");
console.log();

for (const perfil of PERFILES_2027) {
  // Sin recesos
  console.log(imprimirTablaOpciones(perfil, false));

  // Con recesos
  console.log(imprimirTablaOpciones(perfil, true));

  console.log("─".repeat(80));
  console.log();
}

console.log("════════════════════════════════════════════════════════════════════════════");
console.log("FIN DEL REPORTE");
console.log("════════════════════════════════════════════════════════════════════════════");
console.log();
console.log("Decisiones PENDIENTE (no decididas por este script):");
console.log("  • Recesos y feriados oficiales 2027 (resolución exenta Mineduc).");
console.log("  • Cómo acortar el ciclo si no cabe (menos módulos, otra duración, inicio anterior).");
console.log("  • Qué hacer con niveles de adultos.");
console.log("  • El sostenedor debe elegir la opción que prefiera.");
