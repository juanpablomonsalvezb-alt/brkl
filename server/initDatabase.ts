import { db } from "./db";
import { paesSubjects } from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Inicializa la base de datos con datos por defecto
 * Se ejecuta automáticamente al iniciar el servidor
 */
export async function initializeDatabase() {
  try {
    console.log("🔄 Verificando datos de la base de datos...");

    // Verificar si ya existen datos PAES
    const existingPaesSubjects = await db.select().from(paesSubjects).limit(1);

    if (existingPaesSubjects.length === 0) {
      console.log("📚 Inicializando materias PAES...");
      
      await db.insert(paesSubjects).values([
        {
          id: "paes-lenguaje",
          name: "Lenguaje y Comunicación",
          description: "Comprensión lectora, vocabulario y expresión escrita",
          basePrice: 200000,
          sortOrder: 1,
          isActive: true,
        },
        {
          id: "paes-matematica1",
          name: "Matemática M1",
          description: "Números, álgebra, geometría y probabilidades",
          basePrice: 200000,
          sortOrder: 2,
          isActive: true,
        },
        {
          id: "paes-matematica2",
          name: "Matemática M2",
          description: "Matemática avanzada para carreras científicas",
          basePrice: 280000,
          sortOrder: 3,
          isActive: true,
        },
        {
          id: "paes-historia",
          name: "Historia y Ciencias Sociales",
          description: "Historia de Chile, geografía y ciudadanía",
          basePrice: 160000,
          sortOrder: 4,
          isActive: true,
        },
        {
          id: "paes-ciencias",
          name: "Ciencias",
          description: "Biología, Física o Química (a elección)",
          basePrice: 160000,
          sortOrder: 5,
          isActive: true,
        },
      ]);

      console.log("✅ Materias PAES inicializadas correctamente");
    } else {
      console.log("✅ Datos PAES ya existen");
    }

    console.log("✅ Base de datos verificada y lista");
  } catch (error) {
    console.error("❌ Error inicializando base de datos:", error);
    // No lanzar el error para que el servidor continúe
  }
}
