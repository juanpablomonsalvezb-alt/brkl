// Agrega la estructura de 1° a 6° Básico. Por defecto solo muestra qué haría (no escribe).
//   Simulación:  npm run seed:basica
//   Aplicar:     npm run seed:basica -- --apply
// Usa la base de TURSO_DATABASE_URL (o db.sqlite local si no está definida).
import fs from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../shared/schema";
import { applyBasica, planBasica } from "../server/seedBasica";

const write = process.argv.includes("--apply");
const url = process.env.TURSO_DATABASE_URL || "file:./db.sqlite";
const db = drizzle(createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }), { schema });

const manifest = JSON.parse(fs.readFileSync("scripts/data/mineduc-temarios-manifest.json", "utf8"));
const result = await applyBasica(db, planBasica(manifest), write);

console.log(write ? "Aplicado sobre" : "Simulación (sin escribir) sobre", url);
console.log("Niveles:", result.levelsAdded.join(", ") || "ninguno nuevo");
console.log("Asignaturas:", result.subjectsAdded.join(", ") || "ninguna nueva");
console.log("Nivel-asignatura:", result.levelSubjectsAdded.length, result.levelSubjectsAdded.join(", "));
