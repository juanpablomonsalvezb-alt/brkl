// Aviso por correo cuando alguien completa un formulario del sitio (inscripción o reserva).
// No bloquea la respuesta al usuario: se dispara y se ignoran errores de envío.
export async function notifyByEmail(subject: string, rows: Record<string, string | undefined>) {
  // .trim(): un salto de línea invisible al final de la variable de entorno
  // (típico de `echo` al cargarlas en Vercel) rompe el header Authorization y
  // la dirección del destinatario — Resend rechaza el envío sin explicación.
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.NOTIFY_EMAIL?.trim();
  if (!apiKey || !to) return;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #003366;">${subject}</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${Object.entries(rows)
          .filter(([, v]) => v)
          .map(
            ([k, v]) =>
              `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">${k}</td><td style="padding:8px;border-bottom:1px solid #eee;">${v}</td></tr>`,
          )
          .join("")}
      </table>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Barkley Online <notificaciones@barkleyinstituto.cl>",
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error("Resend rechazó el envío:", res.status, await res.text());
    }
  } catch (err) {
    console.error("No se pudo enviar la notificación por correo:", err);
  }
}

// Confirmación al propio apoderado/estudiante que llenó el formulario — distinto
// del aviso interno de arriba (que va al admin). Sin esto, el usuario no tiene
// ninguna señal de que su inscripción se recibió salvo la pantalla de éxito.
export async function sendConfirmationEmail(to: string, name: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || !to) return;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #3a3a3a; line-height: 1.6;">
      <h2 style="color: #003366;">¡Hola${name ? `, ${name}` : ""}!</h2>
      <p>Qué alegría tenerte con nosotros. Tu inscripción a Barkley Online quedó <strong>confirmada</strong> — diste el primer paso hacia un año escolar distinto, a tu propio ritmo, sin clases en vivo, sin horarios que te aprieten.</p>
      <p>Y tenemos una buena noticia: como te inscribiste antes del 30 de noviembre, <strong>tu matrícula es completamente gratuita</strong>. No necesitas pagar nada hoy — el arancel recién comienza en <strong>enero o febrero de 2027</strong>, con tiempo de sobra para organizarte.</p>
      <p>Mientras se acerca el inicio, queremos que estés cerca de nosotros. Síguenos en <a href="https://www.instagram.com/ibarkley.cl" style="color: #003366;">Instagram</a> y <a href="https://www.tiktok.com/@barkleyonline" style="color: #003366;">TikTok</a> — ahí vamos a ir compartiendo novedades, contenido y todo lo que necesitas saber antes de que arranque el año. Revísalas seguido, así no te pierdes nada.</p>
      <p>Si tienes cualquier duda o consulta en el camino, escríbenos directo a <a href="mailto:admisiones@barkleyinstituto.cl" style="color: #003366;">admisiones@barkleyinstituto.cl</a> — estamos para ayudarte.</p>
      <p><strong>Bienvenido a Barkley. Esto recién empieza.</strong></p>
      <p style="color: #5f6156; font-size: 14px;">— El equipo de Barkley Online</p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Barkley Online <notificaciones@barkleyinstituto.cl>",
        to: [to],
        subject: "¡Bienvenido a Barkley! Tu inscripción está confirmada 🎉",
        html,
      }),
    });
    if (!res.ok) {
      console.error("Resend rechazó la confirmación al usuario:", res.status, await res.text());
    }
  } catch (err) {
    console.error("No se pudo enviar la confirmación al usuario:", err);
  }
}
