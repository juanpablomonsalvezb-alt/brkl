#!/usr/bin/env tsx
/**
 * Production Database Seeding Script
 * 
 * This script seeds/updates the production database with essential data
 * Run after migrations to ensure data is up to date
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { paesSubjects } from '../shared/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedProduction() {
  console.log('🌱 Starting production database seeding...');
  
  const dbUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl || !authToken) {
    console.error('❌ Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
    process.exit(1);
  }

  try {
    const client = createClient({
      url: dbUrl,
      authToken: authToken,
    });

    const db = drizzle(client);

    console.log('📝 Updating PAES subjects...');

    // PAES subjects with updated prices
    const paesData = [
      { 
        id: 'paes-lenguaje', 
        name: 'Lenguaje y Comunicación',
        description: 'Comprensión lectora y producción de textos',
        basePrice: 200000,
        duration: '32 semanas',
        sessionType: 'online'
      },
      { 
        id: 'paes-matematica', 
        name: 'Matemática M1',
        description: 'Matemática fundamental para todas las carreras',
        basePrice: 200000,
        duration: '32 semanas',
        sessionType: 'online'
      },
      { 
        id: 'paes-matematica2', 
        name: 'Matemática M2',
        description: 'Matemática avanzada para carreras científicas',
        basePrice: 240000,
        duration: '32 semanas',
        sessionType: 'online'
      },
      { 
        id: 'paes-historia', 
        name: 'Historia y Ciencias Sociales',
        description: 'Historia de Chile, América y el mundo',
        basePrice: 160000,
        duration: '32 semanas',
        sessionType: 'online'
      },
      { 
        id: 'paes-ciencias', 
        name: 'Ciencias',
        description: 'Biología, Química y Física',
        basePrice: 160000,
        duration: '32 semanas',
        sessionType: 'online'
      },
    ];

    // Upsert PAES subjects (update if exists, insert if not)
    for (const subject of paesData) {
      try {
        // Try to update first
        const existing = await db.select().from(paesSubjects).where(eq(paesSubjects.id, subject.id));
        
        if (existing.length > 0) {
          await db.update(paesSubjects)
            .set(subject)
            .where(eq(paesSubjects.id, subject.id));
          console.log(`  ✅ Updated: ${subject.name} - $${subject.basePrice.toLocaleString('es-CL')}`);
        } else {
          await db.insert(paesSubjects).values(subject);
          console.log(`  ✅ Created: ${subject.name} - $${subject.basePrice.toLocaleString('es-CL')}`);
        }
      } catch (error) {
        console.error(`  ❌ Error with ${subject.name}:`, error);
      }
    }

    console.log('✅ Production database seeded successfully!');
    
    client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedProduction();
