import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import dotenv from "dotenv";
import { assertPreviewDatabase } from "./dbGuard";
import { crearClienteDb, urlDesdeEntorno } from "./cliente";

// Load environment variables from .env.local in development
if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: ".env.local" });
}

// Turso en producción, SQLite local fuera de ella (ver server/cliente.ts).
const url = urlDesdeEntorno(process.env);
// En Vercel Preview, solo la base de pruebas confirmada (ver dbGuard.ts); si no, no arranca.
assertPreviewDatabase(process.env, url);
export const client = crearClienteDb(
  url,
  process.env.NODE_ENV === "production" ? process.env.TURSO_AUTH_TOKEN : undefined,
);

// Create Drizzle instance
export const db = drizzle(client, { schema });
