// Script CLI: aplica el calendario 2027 a la base local.
// Por defecto solo simula. Usa --aplicar para escribir.
// Ejecutar: npx tsx scripts/aplicar-calendario-2027.ts [--aplicar]
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../shared/schema";
import { assertBaseLocal } from "../server/dbGuard";
import { crearClienteDb } from "../server/cliente";
import { applyCalendario2027 } from "../server/calendario2027Db";

const write = process.argv.includes("--aplicar");
const url = process.env.CALENDARIO_DB_URL || "file:./db.sqlite";

// Guardia: solo base local, antes de abrir la conexión.
assertBaseLocal(process.env, url);

async function main() {
  const client = crearClienteDb(url);
  try {
    const db = drizzle(client, { schema });
    const result = await applyCalendario2027(db, { write });

    const modo = write ? "Aplicado" : "Simulación";
    console.log(`\nCalendario 2027: ${modo}`);
    console.log(`  Insertados: ${result.insertados.length} (${result.insertados.join(", ") || "ninguno"})`);
    console.log(`  Ya existían: ${result.yaExistian.length} (${result.yaExistian.join(", ") || "ninguno"})`);
    console.log(`  Niveles ausentes: ${result.nivelesAusentes.length} (${result.nivelesAusentes.join(", ") || "ninguno"})`);

    if (!write) {
      console.log("\n  (Usa --aplicar para escribir en la base)");
    }
  } finally {
    client.close();
  }
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
