// Aviso por correo cuando alguien completa un formulario del sitio (inscripción o reserva).
// No bloquea la respuesta al usuario: se dispara y se ignoran errores de envío.
export async function notifyByEmail(subject: string, rows: Record<string, string | undefined>) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
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
        from: "Barkley Online <notificaciones@nebbuler.com>",
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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #003366;">¡Hola${name ? `, ${name}` : ""}!</h2>
      <p>Recibimos tu inscripción a Barkley Online. Un asesor te contactará a la brevedad.</p>
      <p style="color: #5f6156; font-size: 14px;">Barkley Online — Colegio 100% asincrónico en Chile</p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Barkley Online <notificaciones@nebbuler.com>",
        to: [to],
        subject: "Recibimos tu inscripción — Barkley Online",
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
