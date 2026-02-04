import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables from .env.local in development
if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: ".env.local" });
}

// Create client - using local SQLite database
const client = createClient({
  url: "file:./db.sqlite", // Using local database
});

// Create Drizzle instance
export const db = drizzle(client, { schema });
