import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatTurn } from '@shared/iaPolicy';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Recibe prompt, mensaje e historial ya saneados por planCopilotTurn (shared/iaPolicy.ts).
// No persiste nada ni registra el contenido de la conversación.
export async function sendChatMessage(
  systemPrompt: string,
  userMessage: string,
  history: ChatTurn[],
): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API not configured. Please set GEMINI_API_KEY environment variable.');
  }

  try {
    // gemini-pro fue retirado; mismo modelo que el resto del servidor.
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });
    const chat = model.startChat({
      history: history.map((t) => ({ role: t.role, parts: [{ text: t.parts }] })),
    });
    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (error) {
    // Solo el tipo/mensaje del error del proveedor; nunca el texto del estudiante.
    console.error('Error en Gemini API:', error instanceof Error ? error.message : 'desconocido');
    throw new Error('Error al procesar tu mensaje. Por favor, intenta nuevamente.');
  }
}
