import { useState } from "react";
import { ReservationDialog } from "@/components/ReservationDialog";

export default function SimpleInscripcion() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #002147 0%, #003366 50%, #A51C30 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '60px',
        maxWidth: '800px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#002147',
          marginBottom: '20px'
        }}>
          Sistema de Inscripción UCE
        </h1>
        
        <p style={{
          fontSize: '20px',
          color: '#666',
          marginBottom: '40px'
        }}>
          Prueba el proceso completo de inscripción y pago con Flow.cl
        </p>

        <div style={{
          background: '#f5f5f5',
          padding: '30px',
          borderRadius: '10px',
          marginBottom: '40px',
          textAlign: 'left'
        }}>
          <h2 style={{ color: '#002147', marginBottom: '15px', fontSize: '24px' }}>
            📋 ¿Cómo funciona?
          </h2>
          <ol style={{ color: '#666', fontSize: '16px', lineHeight: '1.8' }}>
            <li>Haz clic en "Abrir Formulario de Inscripción"</li>
            <li>Llena los datos del alumno y apoderado</li>
            <li>Selecciona un curso (ej: 7° Básico, 1° Medio)</li>
            <li>Elige un plan (Solo Plataforma o Con Mentor)</li>
            <li>Haz clic en "Enviar Inscripción"</li>
            <li>Verás el botón "Pagar Ahora con Flow"</li>
            <li>Serás redirigido a Flow.cl para pagar</li>
          </ol>
        </div>

        <div style={{
          background: '#e3f2fd',
          border: '2px solid #2196f3',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <h3 style={{ color: '#1565c0', marginBottom: '10px' }}>
            🧪 Tarjetas de Prueba (Sandbox)
          </h3>
          <div style={{ fontSize: '14px' }}>
            <p><strong style={{ color: '#2e7d32' }}>✅ Pago Exitoso:</strong></p>
            <p style={{ color: '#666', marginBottom: '10px' }}>4051 8842 3993 7763 | CVV: 123</p>
            <p><strong style={{ color: '#c62828' }}>❌ Pago Rechazado:</strong></p>
            <p style={{ color: '#666' }}>5186 0589 2551 3346 | CVV: 123</p>
          </div>
        </div>

        <button
          onClick={() => setOpen(true)}
          style={{
            background: '#A51C30',
            color: 'white',
            fontSize: '20px',
            padding: '20px 40px',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#8B1725'}
          onMouseOut={(e) => e.currentTarget.style.background = '#A51C30'}
        >
          🎓 Abrir Formulario de Inscripción
        </button>

        <p style={{ fontSize: '12px', color: '#999', marginTop: '20px' }}>
          Ambiente de pruebas (Sandbox) - Los pagos no son reales
        </p>
      </div>

      <ReservationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
