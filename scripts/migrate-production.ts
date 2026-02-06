#!/usr/bin/env tsx
/**
 * Production Database Migration Script
 * 
 * This script runs all pending migrations on the Turso production database
 * It's executed automatically during Render deployment
 */

import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

async function runMigrations() {
  console.log('🚀 Starting production database migration...');
  console.log('📍 Environment:', process.env.NODE_ENV || 'production');
  
  const dbUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl || !authToken) {
    console.error('❌ Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
    process.exit(1);
  }

  console.log('🔗 Connecting to Turso database...');
  console.log('📦 Database:', dbUrl.replace(/\/\/.*@/, '//*****@')); // Hide credentials

  try {
    // Create Turso client
    const client = createClient({
      url: dbUrl,
      authToken: authToken,
    });

    // Create drizzle instance
    const db = drizzle(client);

    console.log('⚡ Running migrations...');
    
    // Run migrations
    await migrate(db, { 
      migrationsFolder: join(__dirname, '../migrations')
    });

    console.log('✅ Migrations completed successfully!');
    
    // Close connection
    client.close();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
