// Convierte evaluaciones HTML (Gemini) a questionsJson. Por defecto solo simula (no escribe).
//   Simulación:  npm run evaluaciones:convertir
//   Aplicar:     npm run evaluaciones:convertir -- --apply
// Usa la base de TURSO_DATABASE_URL (o db.sqlite local si no está definida). htmlContent se conserva.
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../shared/schema";
import { convertHtmlEvaluations } from "../server/evaluationHtmlMigration";

const write = process.argv.includes("--apply");
const url = process.env.TURSO_DATABASE_URL || "file:./db.sqlite";
const db = drizzle(createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }), { schema });

const items = await convertHtmlEvaluations(db, write);
console.log(write ? "Aplicado sobre" : "Simulación (sin escribir) sobre", url.replace(/\?.*$/, ""));
for (const it of items) {
  console.log(`- [${it.status}] ${it.title} (${it.id}) formato=${it.format} convertidas=${it.converted} fallidas=${it.failed.length}${it.written ? " ESCRITA" : ""}`);
  for (const f of it.failed) console.log(`    #${f.index}: ${f.reason} — ${f.question.slice(0, 80)}`);
}
const count = (s: string) => items.filter((i) => i.status === s).length;
console.log(`Total con HTML: ${items.length} · convertibles: ${count("convertible")} · parciales: ${count("parcial")} · sin preguntas: ${count("sin-preguntas")} · ya con preguntas: ${count("ya-tiene-preguntas")}`);
if (write) console.log("Escritas:", items.filter((i) => i.written).length);
else if (count("convertible")) console.log("Para escribir: npm run evaluaciones:convertir -- --apply");
