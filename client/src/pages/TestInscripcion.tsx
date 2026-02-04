import { useState } from "react";
import { ReservationDialog } from "@/components/ReservationDialog";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export default function TestInscripcion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002147] via-[#003366] to-[#A51C30] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl w-full text-center">
        <GraduationCap className="w-20 h-20 text-[#A51C30] mx-auto mb-6" />
        
        <h1 className="text-4xl font-bold text-[#002147] mb-4">
          Sistema de Inscripción y Pago
        </h1>
        
        <p className="text-lg text-[#002147]/70 mb-8">
          Prueba el proceso completo de inscripción y pago con Flow.cl
        </p>

        <div className="space-y-4 mb-8 text-left bg-gray-50 p-6 rounded-lg">
          <h2 className="font-bold text-[#002147] text-xl mb-3">¿Cómo funciona?</h2>
          <ol className="list-decimal list-inside space-y-2 text-[#002147]/80">
            <li>Haz clic en "Abrir Formulario de Inscripción"</li>
            <li>Llena los datos del alumno y apoderado</li>
            <li>Selecciona un curso (ej: 7° Básico, 1° Medio)</li>
            <li>Elige un plan (Solo Plataforma o Con Mentor)</li>
            <li>Haz clic en "Enviar Inscripción"</li>
            <li>Verás el botón "Pagar Ahora con Flow"</li>
            <li>Serás redirigido a Flow.cl para pagar</li>
          </ol>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-blue-900 mb-2">🧪 Tarjetas de Prueba (Sandbox)</h3>
          <div className="text-sm text-left space-y-2">
            <div>
              <p className="font-semibold text-green-700">✅ Pago Exitoso:</p>
              <p className="text-gray-700">4051 8842 3993 7763 | CVV: 123</p>
            </div>
            <div>
              <p className="font-semibold text-red-700">❌ Pago Rechazado:</p>
              <p className="text-gray-700">5186 0589 2551 3346 | CVV: 123</p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setOpen(true)}
          className="bg-[#A51C30] hover:bg-[#8B1725] text-white text-lg px-8 py-6 h-auto"
        >
          <GraduationCap className="mr-3 w-6 h-6" />
          Abrir Formulario de Inscripción
        </Button>

        <p className="text-sm text-[#002147]/50 mt-6">
          Ambiente de pruebas (Sandbox) - Los pagos no son reales
        </p>
      </div>

      <ReservationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
