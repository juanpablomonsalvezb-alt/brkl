import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";

const reservationSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  rut: z.string().min(8, "RUT inválido"),
  email: z.string().email("Email inválido").refine(
    (email) => email.endsWith("@gmail.com"),
    { message: "Debe usar una cuenta de Gmail (@gmail.com)" }
  ),
  phone: z.string().min(8, "Teléfono inválido"),
  dateOfBirth: z.string().min(1, "La fecha de nacimiento es requerida"),
  nivel: z.enum([
    // Menores - cursos individuales
    "7b", "8b", "1m", "2m", "3m", "4m",
    // Adultos - por rangos
    "adultos_7b-8b", "adultos_1m-2m", "adultos_3m-4m"
  ]),
  programType: z.string().min(1, "Debes seleccionar un plan"),
  howDidYouHear: z.string().optional(),
  comments: z.string().optional(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Precios de los programas - 5 planes principales (valores mensuales marzo-octubre)
const programPrices: Record<string, { matricula: string; mensualidad: string }> = {
  menores_full: { matricula: "$90.000", mensualidad: "$110.000" },
  menores_standard: { matricula: "$90.000", mensualidad: "$60.000" },
  menores_mentor: { matricula: "$90.000", mensualidad: "$50.000" },
  adultos_standard_basica: { matricula: "$50.000", mensualidad: "$40.000" },
  adultos_standard_media: { matricula: "$50.000", mensualidad: "$50.000" },
};

export function ReservationDialog({ open, onOpenChange }: ReservationDialogProps) {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      fullName: "",
      rut: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      nivel: "7b",
      programType: "",
      howDidYouHear: "",
      comments: "",
    },
  });

  const selectedProgram = form.watch("programType");

  const mutation = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al enviar la reserva");
      }

      return response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "¡Reserva enviada!",
        description: "Nos pondremos en contacto contigo pronto.",
      });
      form.reset();
      setTimeout(() => {
        setIsSuccess(false);
        onOpenChange(false);
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReservationFormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      form.reset();
      setIsSuccess(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-[#a51c30]" />
            <DialogTitle className="text-2xl font-serif text-center">¡Reserva Confirmada!</DialogTitle>
            <DialogDescription className="text-center">
              Hemos recibido tu solicitud. Nos pondremos en contacto contigo pronto.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-3xl font-serif text-[#1e1e1e]">
                Formulario de Reserva de Cupo
              </DialogTitle>
              <DialogDescription>
                Completa los siguientes datos para reservar tu cupo en nuestros programas.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              {/* Datos Personales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#1e1e1e] border-b border-[#1e1e1e]/10 pb-2">
                  Datos Personales
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre Completo *</Label>
                    <Input
                      id="fullName"
                      placeholder="Juan Pérez González"
                      {...form.register("fullName")}
                      className="rounded-none"
                    />
                    {form.formState.errors.fullName && (
                      <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rut">RUT *</Label>
                    <Input
                      id="rut"
                      placeholder="12.345.678-9"
                      {...form.register("rut")}
                      className="rounded-none"
                    />
                    {form.formState.errors.rut && (
                      <p className="text-sm text-red-500">{form.formState.errors.rut.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Gmail requerido) *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu.correo@gmail.com"
                      {...form.register("email")}
                      className="rounded-none"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      {...form.register("phone")}
                      className="rounded-none"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Fecha de Nacimiento *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...form.register("dateOfBirth")}
                    className="rounded-none"
                  />
                  {form.formState.errors.dateOfBirth && (
                    <p className="text-sm text-red-500">{form.formState.errors.dateOfBirth.message}</p>
                  )}
                </div>
              </div>

              {/* Datos del Programa */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#1e1e1e] border-b border-[#1e1e1e]/10 pb-2">
                  Programa de Interés
                </h3>

                <div className="space-y-4">
                  {/* Nivel - Primero preguntamos esto */}
                  <div className="space-y-2">
                    <Label htmlFor="nivel">1. ¿Qué curso o nivel deseas cursar? *</Label>
                    <Select
                      onValueChange={(value) => {
                        form.setValue("nivel", value as any);
                        form.setValue("programType", ""); // Reset plan when nivel changes
                      }}
                      value={form.watch("nivel")}
                    >
                      <SelectTrigger className="rounded-none">
                        <SelectValue placeholder="Selecciona tu curso o nivel" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Menores - Cursos individuales */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-[#002147] bg-[#D4AF37]/10">
                          MENORES (Jóvenes)
                        </div>
                        <SelectItem value="7b">7° Básico</SelectItem>
                        <SelectItem value="8b">8° Básico</SelectItem>
                        <SelectItem value="1m">1° Medio</SelectItem>
                        <SelectItem value="2m">2° Medio</SelectItem>
                        <SelectItem value="3m">3° Medio</SelectItem>
                        <SelectItem value="4m">4° Medio</SelectItem>

                        {/* Adultos - Por rangos de niveles */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-[#002147] bg-[#D4AF37]/10 mt-2">
                          ADULTOS (Educación de Adultos)
                        </div>
                        <SelectItem value="adultos_7b-8b">7° y 8° Básico</SelectItem>
                        <SelectItem value="adultos_1m-2m">1° y 2° Medio</SelectItem>
                        <SelectItem value="adultos_3m-4m">3° y 4° Medio</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.nivel && (
                      <p className="text-sm text-red-500">{form.formState.errors.nivel.message}</p>
                    )}
                  </div>

                  {/* Tipo de Programa - Solo se muestra después de elegir nivel */}
                  {form.watch("nivel") && (
                    <div className="space-y-2">
                      <Label htmlFor="programType">2. Selecciona tu Plan *</Label>
                    <Select
                      onValueChange={(value) => form.setValue("programType", value as any)}
                      defaultValue={form.watch("programType")}
                    >
                      <SelectTrigger className="rounded-none">
                        <SelectValue placeholder="Selecciona un programa" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Nota informativa */}
                        <div className="px-2 py-2 text-xs text-[#002147]/60 bg-[#D4AF37]/5 border-b border-[#D4AF37]/20">
                          💡 Valores mensuales de marzo a octubre
                        </div>

                        {/* Mostrar planes según nivel seleccionado */}
                        {/* Planes para Menores - Todos los cursos tienen los mismos 3 planes */}
                        {(form.watch("nivel") === "7b" || form.watch("nivel") === "8b" || 
                          form.watch("nivel") === "1m" || form.watch("nivel") === "2m" || 
                          form.watch("nivel") === "3m" || form.watch("nivel") === "4m") && (
                          <>
                            <SelectItem value="menores_full">Plan Full</SelectItem>
                            <SelectItem value="menores_standard">Plan Estándar</SelectItem>
                            <SelectItem value="menores_mentor">Plan Mentor</SelectItem>
                          </>
                        )}

                        {/* Planes para Adultos 7° y 8° Básico */}
                        {form.watch("nivel") === "adultos_7b-8b" && (
                          <>
                            <SelectItem value="adultos_standard_basica">Plan Estándar</SelectItem>
                          </>
                        )}

                        {/* Planes para Adultos 1° y 2° Medio */}
                        {form.watch("nivel") === "adultos_1m-2m" && (
                          <>
                            <SelectItem value="adultos_standard_media">Plan Estándar</SelectItem>
                          </>
                        )}

                        {/* Planes para Adultos 3° y 4° Medio */}
                        {form.watch("nivel") === "adultos_3m-4m" && (
                          <>
                            <SelectItem value="adultos_standard_media">Plan Estándar</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.programType && (
                      <p className="text-sm text-red-500">{form.formState.errors.programType.message}</p>
                    )}
                  </div>
                  )}

                  {/* Precios del programa seleccionado */}
                  {selectedProgram && (
                    <div className="bg-[#a51c30]/5 border border-[#a51c30]/20 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-[#1e1e1e] text-sm">Valores del Programa</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-[#1e1e1e]/60 mb-1">Matrícula</p>
                          <p className="text-2xl font-bold text-[#a51c30]">
                            {programPrices[selectedProgram].matricula}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#1e1e1e]/60 mb-1">Mensualidad</p>
                          <p className="text-2xl font-bold text-[#a51c30]">
                            {programPrices[selectedProgram].mensualidad}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#1e1e1e]/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={mutation.isPending}
                  className="rounded-none"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="bg-[#a51c30] hover:bg-[#8a1828] text-white rounded-none px-8"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Reserva"
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
