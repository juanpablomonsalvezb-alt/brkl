/**
 * Migration: Update PAES prices
 * Date: 2026-02-05
 * 
 * Updates PAES subject prices to new values:
 * - Lenguaje: $200,000
 * - Matemática M1: $200,000
 * - Matemática M2: $240,000
 * - Historia y Ciencias Sociales: $160,000
 * - Ciencias: $160,000
 */

import { db } from '../db';
import { paesSubjects } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export async function updatePaesPrices() {
  console.log('🔄 Updating PAES prices...');

  const updates = [
    { id: 'paes-lenguaje', name: 'Lenguaje y Comunicación', price: 200000 },
    { id: 'paes-matematica', name: 'Matemática M1', price: 200000 },
    { id: 'paes-matematica2', name: 'Matemática M2', price: 240000 },
    { id: 'paes-historia', name: 'Historia y Ciencias Sociales', price: 160000 },
    { id: 'paes-ciencias', name: 'Ciencias', price: 160000 },
  ];

  try {
    for (const subject of updates) {
      await db
        .update(paesSubjects)
        .set({ 
          basePrice: subject.price,
          name: subject.name 
        })
        .where(eq(paesSubjects.id, subject.id));
      
      console.log(`✅ Updated ${subject.name}: $${subject.price.toLocaleString('es-CL')}`);
    }

    console.log('✅ PAES prices updated successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error updating PAES prices:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updatePaesPrices()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
