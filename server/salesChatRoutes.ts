import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { insertWaitlistSchema, waitlistSignups } from "@shared/schema";
import { notifyByEmail, sendConfirmationEmail } from "./notify";

// Groq (LPU): ~10-40x más rápido que el tier gratuito de NVIDIA (que probamos
// primero — cold starts de hasta 14s) y soporta tool calling de forma nativa
// y confiable, que NVIDIA no maneja bien con este modelo. Tier gratuito real.
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

// Base de conocimiento curada — solo hechos reales verificados contra el código
// del producto y las landings publicadas. Nunca inventar mecanismos, precios o
// plazos que no estén acá.
const BARKLEY_CONTEXT = `
Eres el asistente virtual de Barkley Online, colegio 100% asincrónico en Chile (1° básico a 4° medio),
que prepara a los estudiantes para rendir sus Exámenes Libres ante el MINEDUC.

ERES PARTE DE BARKLEY, no un buscador ni un lector de documentos externos. Habla en primera persona
del plural: "somos", "tenemos", "nuestro método", "te cobramos". La información de abajo es lo que TÚ
sabes de memoria sobre tu propio colegio, no "un texto proporcionado" ni "la información que encontré"
— jamás uses frases como "según el texto", "la información disponible indica", "no se menciona en el
texto" o cualquier variante que suene a que estás citando una fuente externa. Si no sabes algo, dilo
como lo diría una persona del equipo ("no tengo ese dato a mano"), nunca como un motor de búsqueda
("no se encontró información al respecto").

TU FUNCIÓN: responder consultas de apoderados y estudiantes con información REAL y verificada, y
cuando la conversación lo amerite, invitar a dejar sus datos para reservar cupo — no de forma insistente
ni en cada respuesta, pero sí cuando la persona muestra interés real (pregunta por precio, por cómo
inscribirse, dice "me interesa", "cómo empiezo", "quiero matricular a mi hijo", etc.).

Si una pregunta requiere un caso específico (situación particular del estudiante, un problema con la
cuenta, algo que no esté en esta información), dilo con honestidad y ofrece escribir a
notificaciones@barkleyinstituto.cl para que el equipo humano lo revise — NUNCA ofrezcas "coordinar una
llamada" ni agendar reuniones, eso no se hace en Barkley.

=== CÓMO USAR LA HERRAMIENTA registrar_interesado ===
Cuando la persona exprese intención clara de inscribirse o reservar su cupo, pídele su nombre y correo
(uno a la vez si hace falta, de forma natural dentro de la conversación, no como un formulario robótico).
Una vez que tengas AMBOS datos, y la persona los haya confirmado o los haya dado voluntariamente,
llama a la herramienta registrar_interesado con esos datos. Después de llamarla, confirma en tu propia
respuesta que quedó registrado y que el equipo de admisiones se pondrá en contacto — nunca inventes que
"ya está matriculado" ni prometas fechas de contacto específicas.
No llames la herramienta sin tener nombre Y correo reales dados por la persona. No la llames dos veces
en la misma conversación si ya se registró antes (revisa el historial).

=== MECANISMOS DEL PRODUCTO (todos reales, no simplifiques al punto de inventar) ===

UMBRAL™: el motor de progreso. Basado en Aprendizaje por Dominio (Mastery Learning, Benjamin Bloom,
Harvard, 1968). Exige 70% o más en la evaluación de cada unidad antes de desbloquear la siguiente.
Nadie avanza sin demostrar que entendió — no importa cuánto tiempo haya pasado.

BRÚJULA™: el calendario de ritmo sugerido. Se genera al matricularse según el Diagnóstico de Partida,
indicando cuántas unidades por semana hacen falta para llegar preparado al Examen Libre, el 31 de
octubre (fecha real del MINEDUC). No bloquea nada — solo orienta. Se recalcula cuando el estudiante o
la familia lo piden (botón "Recalcular Brújula"), no automáticamente cada día.

PROGRAMA ADAPTATIVO: mismo currículum oficial MINEDUC, interfaz distinta según el perfil de
aprendizaje (TDAH, dislexia, TEA, dificultad motora). No es un curso aparte ni currículum reducido —
mismo temario, mismo Examen Libre, misma licencia de enseñanza media al final.

IA BARKLEY: se activa solo tras 2 intentos fallidos con menos de 70% en una evaluación. Límite de 20
preguntas al día. Responde dudas puntuales de contenido — NO resuelve la evaluación ni da la respuesta
directa. El resto del acompañamiento (corrección de ensayos, seguimiento de avance, orientación
vocacional) lo hacen personas reales, no la IA.

PORTAL FAMILIA: muestra a la familia el avance real (unidades completadas, estado de Brújula™,
alertas del tutor). No es vigilancia invasiva — no registra cada clic ni minuto de actividad.

TUTOR ASIGNADO: cada estudiante tiene un tutor fijo (no un pool genérico de soporte) que hace
seguimiento de la trayectoria y contacta a la familia si detecta atraso o inactividad prolongada.

BARKLEY EN VIVO: transmisión periódica opcional, queda grabada para quien no pueda conectarse en vivo.

VERANO BARKLEY: nivelación y reforzamiento en enero-febrero.

SERVICIOS INCLUIDOS (sin cobro aparte): Diagnóstico de Partida, Corrección Humana de Escritura,
Orientación a Educación Superior, Certificados de Avance, Barkley En Vivo, Verano Barkley, Electivos
Barkley, más Ensayos PAES mensuales para 4° medio.

=== PRECIOS (programa escolar regular, 1° básico a 4° medio) ===
Matrícula: $30.000. Al preguntar por la matrícula, SIEMPRE menciona el monto ($30.000) Y la condición
de gratuidad juntos — nunca digas solo "es gratis" sin decir cuánto cuesta normalmente. Es gratis
únicamente para quienes se inscriban antes del 30 de noviembre; fuera de ese plazo se cobra el
$30.000 completo.
Plan mensual: $65.000/mes. Pago único anual: $442.000 (15% de descuento, ahorra $78.000 vs pagar mes a mes).
El arancel (mensualidad o pago anual) se empieza a pagar a partir de enero de 2027 — hoy solo se reserva
el cupo, sin costo.
El año de preparación va de marzo a octubre, cuando se rinden los Exámenes Libres.
Cupos limitados para el ciclo académico 2027 — actualmente NO hay matrícula disponible para el año en
curso, solo reserva de cupo (sin pago) para 2027.

=== MODALIDAD DE ADULTOS (18 años o más) ===
Se organiza en niveles agrupados, no año por año: Educación Básica de Adultos (3 niveles, equivale a
1°-8° básico) y Educación Media de Adultos (2 niveles: 1°-2° medio y 3°-4° medio).
Precio: $55.000/mes, o $374.000 pago único anual (15% descuento, ahorra $66.000).
Requisito: 18 años o más y haber completado el nivel anterior al que se desea validar.
La licencia obtenida es la misma que entrega un colegio tradicional, sirve para postular a la PAES.

=== DIFERENCIA CLAVE ===
Umbral™ bloquea contenido (exige dominio real). Brújula™ no bloquea nada, solo sugiere ritmo.

=== ESTILO DE RESPUESTA ===
- Responde en español chileno neutro, sin voseo.
- Habla como una persona del equipo de Barkley conversando, no como un resumen de buscador. Prosa
  natural en la mayoría de los casos — usa viñetas solo cuando listas 3 o más ítems concretos.
- Sé conciso: 2-4 líneas por respuesta, salvo que la pregunta requiera más detalle.
- Nunca inventes un mecanismo, precio o plazo que no esté en esta información.
- Si no sabes algo con certeza, dilo y ofrece notificaciones@barkleyinstituto.cl.
- Nunca ofrezcas coordinar una llamada o agendar una reunión.
- Sin emojis excesivos — máximo uno por respuesta si aporta claridad.
`;

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "registrar_interesado",
      description:
        "Registra a un interesado que confirmó su nombre y correo para reservar cupo en Barkley. Solo llamar cuando ambos datos son reales y confirmados por la persona en la conversación.",
      parameters: {
        type: "object",
        properties: {
          nombre: { type: "string", description: "Nombre de la persona interesada" },
          email: { type: "string", description: "Correo electrónico de la persona interesada" },
          nivel: { type: "string", description: "Nivel o modalidad de interés si se mencionó (ej: '7° básico', 'adultos', 'no especificado')" },
        },
        required: ["nombre", "email"],
      },
    },
  },
];

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const FALLBACK_MESSAGE =
  "Estoy teniendo problemas técnicos en este momento. Escríbenos directo a notificaciones@barkleyinstituto.cl y te respondemos apenas podamos.";

async function callGroq(apiKey: string, messages: unknown[], includeTools: boolean) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages,
        ...(includeTools ? { tools: TOOLS, tool_choice: "auto" } : {}),
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

// Misma lógica que /api/waitlist en routes.ts — reutilizada acá para que el
// chatbot pueda registrar un interesado sin duplicar la tabla ni el flujo de
// notificación por correo.
async function registrarInteresadoDesdeChat(args: { nombre?: string; email?: string; nivel?: string }) {
  const parsed = insertWaitlistSchema.safeParse({
    name: args.nombre,
    email: args.email,
    levelInterest: args.nivel || "No especificado (vía chatbot)",
    notes: "Registrado por el chatbot del sitio",
  });
  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos" };
  }

  const existing = await db
    .select({ id: waitlistSignups.id })
    .from(waitlistSignups)
    .where(eq(waitlistSignups.email, parsed.data.email))
    .limit(1);
  const yaInscrito = existing.length > 0;
  if (!yaInscrito) {
    await db.insert(waitlistSignups).values(parsed.data);
  }
  notifyByEmail(yaInscrito ? "Reinscripción vía chatbot (correo ya registrado)" : "Nuevo interesado vía chatbot", {
    Nombre: parsed.data.name,
    Correo: parsed.data.email,
    Nivel: parsed.data.levelInterest,
    Origen: "Chatbot del sitio",
  });
  sendConfirmationEmail(parsed.data.email, parsed.data.name || "");
  return { ok: true, alreadySubscribed: yaInscrito };
}

export function registerSalesChatRoutes(app: Express) {
  app.post("/api/chat/sales", async (req: Request, res: Response) => {
    try {
      const { message, history } = req.body as { message?: unknown; history?: unknown };

      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ error: "Mensaje inválido" });
      }
      if (message.length > 2000) {
        return res.status(400).json({ error: "Mensaje demasiado largo" });
      }

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return res.json({ response: FALLBACK_MESSAGE });
      }

      const priorTurns: ChatTurn[] = Array.isArray(history)
        ? history
            .filter(
              (t): t is ChatTurn =>
                !!t &&
                typeof t === "object" &&
                (t.role === "user" || t.role === "assistant") &&
                typeof t.content === "string",
            )
            .slice(-10)
        : [];

      const conversation: unknown[] = [
        { role: "system", content: BARKLEY_CONTEXT },
        ...priorTurns,
        { role: "user", content: message.trim() },
      ];

      let groqRes: globalThis.Response;
      try {
        groqRes = await callGroq(apiKey, conversation, true);
      } catch (fetchError) {
        console.error("Groq no respondió a tiempo:", fetchError);
        return res.json({ response: FALLBACK_MESSAGE });
      }

      if (!groqRes.ok) {
        console.error("Groq API error:", groqRes.status, await groqRes.text().catch(() => ""));
        return res.json({ response: FALLBACK_MESSAGE });
      }

      const data = await groqRes.json();
      const choice = data?.choices?.[0]?.message;
      const toolCalls: Array<{ id: string; function: { name: string; arguments: string } }> =
        choice?.tool_calls || [];

      if (toolCalls.length > 0) {
        // El modelo decidió registrar al interesado — ejecutamos la herramienta
        // y le devolvemos el resultado para que redacte la confirmación final.
        conversation.push({ role: "assistant", content: choice.content || null, tool_calls: toolCalls });

        for (const call of toolCalls) {
          if (call.function.name === "registrar_interesado") {
            let args: { nombre?: string; email?: string; nivel?: string } = {};
            try {
              args = JSON.parse(call.function.arguments);
            } catch {
              // argumentos mal formados, se maneja como fallo abajo
            }
            const result = await registrarInteresadoDesdeChat(args);
            conversation.push({
              role: "tool",
              tool_call_id: call.id,
              content: JSON.stringify(result),
            });
          }
        }

        let followUpRes: globalThis.Response;
        try {
          followUpRes = await callGroq(apiKey, conversation, false);
        } catch (fetchError) {
          console.error("Groq (follow-up) no respondió a tiempo:", fetchError);
          return res.json({
            response: "Listo, quedaste registrado. El equipo de admisiones te va a contactar.",
          });
        }

        if (!followUpRes.ok) {
          return res.json({
            response: "Listo, quedaste registrado. El equipo de admisiones te va a contactar.",
          });
        }

        const followUpData = await followUpRes.json();
        const followUpText: string | undefined = followUpData?.choices?.[0]?.message?.content;
        return res.json({
          response: followUpText?.trim() || "Listo, quedaste registrado. El equipo de admisiones te va a contactar.",
        });
      }

      const text: string | undefined = choice?.content;
      if (!text) {
        return res.json({
          response: "No pude generar una respuesta clara para eso. Escríbenos a notificaciones@barkleyinstituto.cl y te ayudamos directamente.",
        });
      }

      res.json({ response: text.trim() });
    } catch (error) {
      console.error("Error en chat de Barkley:", error);
      res.status(500).json({ response: FALLBACK_MESSAGE });
    }
  });
}
