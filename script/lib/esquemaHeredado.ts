// Tablas heredadas de la aplicación (shared/schema.ts) en una base de prueba desechable, más filas
// mínimas ficticias a las que el catálogo se ata por clave foránea. Solo para *checks* (H2).
import type { Client } from "@libsql/client";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "../../shared/schema";

export async function aplicarEsquemaHeredado(c: Client): Promise<void> {
  const ddl = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema as any));
  for (const s of ddl) await c.execute(s);
}

// Dos asignaturas de nivel (para probar aislamiento) y personas ficticias: autor y validador distintos.
export async function sembrarFicticios(c: Client): Promise<void> {
  await c.batch([
    "INSERT INTO users (id, email) VALUES ('ficticio-autor', 'autor@ficticio.test'), ('ficticio-validador', 'validador@ficticio.test'), ('ficticio-otro', 'otro@ficticio.test')",
    "INSERT INTO levels (id, name, program_type) VALUES ('5b', '5° Básico', 'menores'), ('6b', '6° Básico', 'menores')",
    "INSERT INTO subjects (id, name, slug) VALUES ('mat', 'Matemática', 'matematica'), ('len', 'Lenguaje', 'lenguaje')",
    "INSERT INTO level_subjects (id, level_id, subject_id) VALUES ('ls-mat-5b', '5b', 'mat'), ('ls-len-6b', '6b', 'len')",
    "INSERT INTO learning_objectives (id, level_subject_id, code, title, week_number) VALUES ('lo-mat', 'ls-mat-5b', 'M1', 'Fracciones', 1), ('lo-len', 'ls-len-6b', 'M1', 'Lectura', 1)",
    "INSERT INTO weekly_resources (id, learning_objective_id, resource_type, title) VALUES ('wr-mat', 'lo-mat', 'video', 'Fracciones'), ('wr-len', 'lo-len', 'video', 'Lectura')",
  ], "write");
}
