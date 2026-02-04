import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables from .env.local in development
if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: ".env.local" });
}

// Create client - use Turso in production, SQLite locally
const client = createClient({
  url: process.env.NODE_ENV === "production" 
    ? process.env.TURSO_DATABASE_URL!
    : "file:./db.sqlite",
  authToken: process.env.NODE_ENV === "production"
    ? process.env.TURSO_AUTH_TOKEN
    : undefined,
});

// Create Drizzle instance
export const db = drizzle(client, { schema });
