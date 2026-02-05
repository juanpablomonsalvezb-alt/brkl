import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migración: Agregar índices para mejorar performance de consultas de Flow
 * Ejecutar una vez en producción después del deploy
 */
export async function addFlowIndices() {
  try {
    console.log("🔄 Agregando índices de Flow...");

    // Índice en flow_order para búsquedas rápidas en webhook
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_reservations_flow_order ON reservations(flow_order)`);
    
    // Índice en flow_token para búsquedas rápidas por token
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_reservations_flow_token ON reservations(flow_token)`);
    
    // Índice en payment_status para filtrar pagos por estado
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_reservations_payment_status ON reservations(payment_status)`);

    console.log("✅ Índices de Flow agregados exitosamente");
  } catch (error) {
    console.error("❌ Error agregando índices:", error);
    // No lanzar el error para que el servidor continúe
  }
}
