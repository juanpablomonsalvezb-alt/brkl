import type { Express, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SALES_CONTEXT = `
Eres un asistente virtual amigable y profesional del Instituto de preparación académica.

INFORMACIÓN CLAVE:

PLANES DISPONIBLES:
1. Plan Menores (7º y 8º Básico):
   - Matrícula: $60.000
   - Duración: 8 meses (Marzo - Octubre)
   - 16 módulos de contenido
   - 32 ensayos de proceso
   - Academic Copilot IA 24/7
   - Asignaturas: Lenguaje, Matemáticas, Historia, Ciencias, Inglés

2. Plan Adultos (Validación de Estudios):
   - Matrícula: $60.000
   - Duración: 30 semanas
   - Validación oficial de estudios
   - Modalidad 100% online
   - Asignaturas: Lenguaje, Matemáticas, Historia, Ciencias, Inglés, Ed. Ciudadana

3. Plan PAES (Preparación PSU):
   - Precio por asignatura
   - Asignaturas: Matemáticas M1, M2, Lenguaje, Historia, Ciencias
   - Preparación intensiva
   - Material actualizado DEMRE

BENEFICIOS GENERALES:
- Plataforma online 24/7
- Material digital incluido
- Seguimiento personalizado
- Academic Copilot con IA
- Tecnología de vanguardia
- Certificación oficial

PROCESO DE INSCRIPCIÓN:
1. Seleccionar plan deseado
2. Completar formulario online
3. Confirmar inscripción
4. Recibir acceso a plataforma

CONTACTO:
- Email: contacto@instituto.cl
- Horario: Lunes a Viernes 9:00-18:00
- Modalidad: 100% Online

INSTRUCCIONES:
- Sé conciso y directo (máximo 3-4 líneas)
- Usa emojis relevantes pero con moderación
- Si preguntan por inscripción, ofrece llevarlos al formulario
- Si no sabes algo, ofrece contactar a un asesor
- Sé amable y profesional
- Sugiere opciones cuando sea apropiado
`;

export function registerSalesChatRoutes(app: Express) {
  // POST: Send message and get AI response
  app.post("/api/chat/sales", async (req: Request, res: Response) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Mensaje inválido" });
      }

      // Check if Gemini API key exists
      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY not found, using fallback response");
        return res.json({
          response: "Disculpa, estoy teniendo problemas técnicos. ¿Podrías intentar con una de estas opciones?",
          suggestions: ["Ver planes", "Precios", "Inscribirme", "Hablar con asesor"]
        });
      }

      // Generate AI response
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `${SALES_CONTEXT}

Usuario pregunta: "${message}"

Responde de manera amigable, concisa y profesional. Si es apropiado, incluye sugerencias de seguimiento.`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Generate intelligent suggestions based on context
      const suggestions: string[] = [];
      
      if (text.toLowerCase().includes("plan")) {
        suggestions.push("Ver planes", "Comparar planes");
      }
      if (text.toLowerCase().includes("precio") || text.toLowerCase().includes("costo")) {
        suggestions.push("Formas de pago", "Inscribirme");
      }
      if (text.toLowerCase().includes("inscri")) {
        suggestions.push("Ir a formulario", "Hablar con asesor");
      }
      
      // Default suggestions if none generated
      if (suggestions.length === 0) {
        suggestions.push("Ver planes", "Más información");
      }

      return res.json({
        response: text,
        suggestions: suggestions.slice(0, 3) // Max 3 suggestions
      });

    } catch (error: any) {
      console.error("Error in sales chat:", error);
      
      // Fallback response
      return res.json({
        response: "Disculpa, no pude procesar tu pregunta. ¿Podrías reformularla o elegir una opción?",
        suggestions: ["Ver planes", "Precios", "Inscribirme", "Hablar con asesor"]
      });
    }
  });

  // GET: Get chat statistics (optional, for analytics)
  app.get("/api/chat/stats", async (req: Request, res: Response) => {
    try {
      // TODO: Implement analytics tracking
      return res.json({
        totalConversations: 0,
        averageMessages: 0,
        conversionRate: 0
      });
    } catch (error: any) {
      console.error("Error getting chat stats:", error);
      return res.status(500).json({ error: "Error al obtener estadísticas" });
    }
  });
}
