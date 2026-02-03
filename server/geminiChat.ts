import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export async function sendChatMessage(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'model'; parts: string }> = []
): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API not configured. Please set GEMINI_API_KEY environment variable.');
  }

  try {
    // Usar el modelo Gemini Pro
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // System prompt personalizado para Academic Copilot
    const systemPrompt = `Eres Academic Copilot, un asistente de IA especializado.

Tu misión es ayudar a estudiantes chilenos con:
- Explicación de conceptos académicos de manera clara y didáctica
- Resolución de dudas sobre materias escolares (7° básico a 4° medio) y PAES
- Técnicas de estudio y estrategias de aprendizaje
- Revisión y feedback sobre ejercicios y respuestas
- Preparación para evaluaciones y exámenes

Características de tu comportamiento:
- Eres amable, paciente y motivador
- Usas ejemplos concretos y cercanos a la realidad chilena
- Adaptas tu lenguaje al nivel del estudiante
- Fomentas el pensamiento crítico haciendo preguntas guía
- No das respuestas directas a tareas, sino que guías al estudiante
- Eres profesional pero cercano

Contexto educativo:
- Modalidades: Exámenes Libres (menores), Validación (adultos), PAES
- Sistema educativo: Curriculum chileno

Responde siempre en español de Chile.`;

    // Construir el historial de conversación
    const history = conversationHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.parts }],
    }));

    // Iniciar chat con historial
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Entendido. Soy Academic Copilot, listo para ayudar a los estudiantes con sus estudios. ¿En qué puedo ayudarte hoy?' }],
        },
        ...history,
      ],
    });

    // Enviar mensaje del usuario
    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error en Gemini API:', error);
    throw new Error('Error al procesar tu mensaje. Por favor, intenta nuevamente.');
  }
}
