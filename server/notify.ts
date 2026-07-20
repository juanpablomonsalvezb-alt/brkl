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
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Barkley Online <notificaciones@nebbuler.com>",
        to: [to],
        subject,
        html,
      }),
    });
  } catch (err) {
    console.error("No se pudo enviar la notificación por correo:", err);
  }
}
