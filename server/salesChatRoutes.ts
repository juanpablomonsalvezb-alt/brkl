import type { Express, Request, Response } from "express";

// Mismo motor gratuito (NVIDIA NIM, tier gratuito) que usa la IA Barkley dentro
// de la plataforma real — ver barkley-platform/src/lib/nvidia.ts. Acá se usa
// para consultas del sitio de marketing, no para resolver evaluaciones.
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = "meta/llama-3.2-11b-vision-instruct";

// Base de conocimiento curada — solo hechos reales verificados contra el código
// del producto y las landings publicadas. Nunca inventar mecanismos, precios o
// plazos que no estén acá.
const BARKLEY_CONTEXT = `
Eres el asistente virtual de Barkley Online, colegio 100% asincrónico en Chile (1° básico a 4° medio),
que prepara a los estudiantes para rendir sus Exámenes Libres ante el MINEDUC.

TU FUNCIÓN: responder consultas de apoderados y estudiantes con información REAL y verificada.
Si una pregunta requiere un caso específico (situación particular del estudiante, un problema con la
cuenta, algo que no esté en esta información), dilo con honestidad y ofrece escribir a
notificaciones@barkleyinstituto.cl para que el equipo humano lo revise — NUNCA ofrezcas "coordinar una
llamada" ni agendar reuniones, eso no se hace en Barkley.

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
Plan mensual: $65.000/mes. Matrícula gratis para quienes se inscriban antes del 30 de noviembre.
Pago único anual: $442.000 (15% de descuento, ahorra $78.000 vs pagar mes a mes).
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
- Sé conciso: 2-4 líneas por respuesta, salvo que la pregunta requiera más detalle.
- Nunca inventes un mecanismo, precio o plazo que no esté en esta información.
- Si no sabes algo con certeza, dilo y ofrece notificaciones@barkleyinstituto.cl.
- Nunca ofrezcas coordinar una llamada o agendar una reunión.
- Sin emojis excesivos — máximo uno por respuesta si aporta claridad.
`;

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
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

      const apiKey = process.env.NVIDIA_API_KEY;
      if (!apiKey) {
        return res.json({
          response:
            "Estoy teniendo problemas técnicos en este momento. Escríbenos directo a notificaciones@barkleyinstituto.cl y te respondemos apenas podamos.",
        });
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

      // El tier gratuito de NVIDIA a veces tarda mucho en cold start (visto hasta
      // 14s). Sin límite propio, Vercel puede matar la función a mitad de camino
      // y el cliente ve un fetch() reventado en vez de un mensaje claro — por eso
      // el timeout acá, bien por debajo del maxDuration de la función.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25_000);
      let nvidiaRes: globalThis.Response;
      try {
        nvidiaRes = await fetch(NVIDIA_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: "system", content: BARKLEY_CONTEXT },
              ...priorTurns,
              { role: "user", content: message.trim() },
            ],
            temperature: 0.3,
            max_tokens: 400,
          }),
          signal: controller.signal,
        });
      } catch (fetchError) {
        console.error("NVIDIA API no respondió a tiempo:", fetchError);
        return res.json({
          response:
            "Estoy teniendo problemas técnicos en este momento. Escríbenos directo a notificaciones@barkleyinstituto.cl y te respondemos apenas podamos.",
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!nvidiaRes.ok) {
        console.error("NVIDIA API error:", nvidiaRes.status, await nvidiaRes.text().catch(() => ""));
        return res.json({
          response:
            "Estoy teniendo problemas técnicos en este momento. Escríbenos directo a notificaciones@barkleyinstituto.cl y te respondemos apenas podamos.",
        });
      }

      const data = await nvidiaRes.json();
      const text: string | undefined = data?.choices?.[0]?.message?.content;

      if (!text) {
        return res.json({
          response:
            "No pude generar una respuesta clara para eso. Escríbenos a notificaciones@barkleyinstituto.cl y te ayudamos directamente.",
        });
      }

      res.json({ response: text.trim() });
    } catch (error) {
      console.error("Error en chat de Barkley:", error);
      res.status(500).json({
        response:
          "Estoy teniendo problemas técnicos en este momento. Escríbenos directo a notificaciones@barkleyinstituto.cl y te respondemos apenas podamos.",
      });
    }
  });
}
