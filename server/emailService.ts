import nodemailer from 'nodemailer';

// Configuración del transporter (puedes usar Gmail u otro servicio SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

interface ReservationEmailData {
  studentFullName: string;
  studentRut: string;
  dateOfBirth: string;
  age?: string;
  guardianFullName: string;
  guardianRut: string;
  studentEmail: string;
  guardianEmail: string;
  phone: string;
  courseOfInterest: string;
  selectedPlan: string;
}

export async function sendReservationEmail(data: ReservationEmailData) {
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #A51C30; border-bottom: 3px solid #002147; padding-bottom: 10px;">
        Nueva Reserva de Cupo
      </h2>
      
      <h3 style="color: #002147; margin-top: 20px;">Datos del Alumno</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Nombre Completo:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.studentFullName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>RUT:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.studentRut}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Fecha de Nacimiento:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.dateOfBirth}</td>
        </tr>
        ${data.age ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Edad:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.age}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Correo:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.studentEmail}</td>
        </tr>
      </table>

      <h3 style="color: #002147; margin-top: 20px;">Datos del Apoderado</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Nombre Completo:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.guardianFullName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>RUT:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.guardianRut}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Correo:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.guardianEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Teléfono:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.phone}</td>
        </tr>
      </table>

      <h3 style="color: #002147; margin-top: 20px;">Programa Seleccionado</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Curso de Interés:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.courseOfInterest}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Plan Seleccionado:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.selectedPlan}</td>
        </tr>
      </table>

      <div style="margin-top: 30px; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #A51C30;">
        <p style="margin: 0; color: #002147;">
          <strong>Fecha de registro:</strong> ${new Date().toLocaleString('es-CL', { 
            timeZone: 'America/Santiago',
            dateStyle: 'full',
            timeStyle: 'short'
          })}
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@institutoharvard.cl',
    to: 'juanpablo.monsalvezb@gmail.com',
    subject: `Nueva Reserva de Cupo - ${data.studentFullName}`,
    html: emailContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error enviando email:', error);
    // No lanzamos error para que la reserva se guarde aunque falle el email
    return { success: false, error };
  }
}
