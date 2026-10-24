import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@shared/schema";
import dotenv from "dotenv";
import { assertPreviewDatabase } from "./dbGuard";

// Load environment variables from .env.local in development
if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: ".env.local" });
}

// Create client - use Turso in production, SQLite locally
const url = process.env.NODE_ENV === "production"
  ? process.env.TURSO_DATABASE_URL!
  : process.env.TEST_DATABASE_URL || "file:./db.sqlite"; // pruebas locales: base en memoria
// En Vercel Preview, solo la base de pruebas confirmada (ver dbGuard.ts); si no, no arranca.
assertPreviewDatabase(process.env, url);
const client = createClient({
  url,
  authToken: process.env.NODE_ENV === "production"
    ? process.env.TURSO_AUTH_TOKEN
    : undefined,
});

// Create Drizzle instance
export const db = drizzle(client, { schema });
