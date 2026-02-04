import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentResult() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  
  // Debug: Log all parameters
  console.log('Payment Result - Full URL:', window.location.href);
  console.log('Payment Result - Search params:', Array.from(searchParams.entries()));
  
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de pago no encontrado");
      return;
    }

    // Verificar el estado del pago con el token
    fetch(`/api/flow/payment-status/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.payment) {
          if (data.payment.status === 2) {
            setStatus("success");
            setMessage("¡Pago completado exitosamente!");
          } else if (data.payment.status === 3) {
            setStatus("error");
            setMessage("El pago fue rechazado");
          } else if (data.payment.status === 4) {
            setStatus("error");
            setMessage("El pago fue anulado");
          } else {
            setStatus("loading");
            setMessage("Procesando pago...");
          }
        } else {
          setStatus("error");
          setMessage("No se pudo verificar el estado del pago");
        }
      })
      .catch(error => {
        console.error("Error checking payment:", error);
        setStatus("error");
        setMessage("Error al verificar el pago");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002147] via-[#003366] to-[#A51C30] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-[#002147] mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-[#002147] mb-2">
                Verificando Pago
              </h1>
              <p className="text-[#002147]/70">
                {message || "Por favor espera mientras verificamos tu pago..."}
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
              <h1 className="text-2xl font-bold text-[#002147] mb-2">
                ¡Pago Exitoso!
              </h1>
              <p className="text-[#002147]/70 mb-6">
                Tu inscripción ha sido confirmada. Recibirás un correo electrónico con los detalles de tu matrícula.
              </p>
              <Link to="/">
                <Button className="bg-[#A51C30] hover:bg-[#8B1725] text-white">
                  Volver al Inicio
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-600 mb-4" />
              <h1 className="text-2xl font-bold text-[#002147] mb-2">
                Error en el Pago
              </h1>
              <p className="text-[#002147]/70 mb-6">
                {message || "Hubo un problema con tu pago. Por favor, intenta nuevamente."}
              </p>
              <div className="flex gap-3">
                <Link to="/">
                  <Button variant="outline">
                    Volver al Inicio
                  </Button>
                </Link>
                <Button 
                  className="bg-[#A51C30] hover:bg-[#8B1725] text-white"
                  onClick={() => window.history.back()}
                >
                  Intentar Nuevamente
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
