import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";

const reservationSchema = z.object({
  studentFullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  studentRut: z.string().min(8, "RUT inválido"),
  dateOfBirth: z.string().min(1, "La fecha de nacimiento es requerida"),
  guardianFullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  guardianRut: z.string().min(8, "RUT inválido"),
  studentEmail: z.string().email("Email inválido").refine(
    (email) => email.endsWith("@gmail.com"),
    "Solo se aceptan correos de Gmail (@gmail.com)"
  ),
  guardianEmail: z.string().email("Email inválido"),
  phone: z.string().min(8, "Teléfono inválido"),
  courseOfInterest: z.string().min(1, "Debe seleccionar un curso"),
  selectedPlan: z.string().min(1, "Debe seleccionar un plan"),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Cursos disponibles
const courseOptions = [
  // Menores
  { value: "7basico", label: "7° Básico", type: "menores", planGroup: "basica" },
  { value: "8basico", label: "8° Básico", type: "menores", planGroup: "basica" },
  { value: "1medio", label: "1° Medio", type: "menores", planGroup: "media1" },
  { value: "2medio", label: "2° Medio", type: "menores", planGroup: "media1" },
  { value: "3medio", label: "3° Medio", type: "menores", planGroup: "media2" },
  { value: "4medio", label: "4° Medio", type: "menores", planGroup: "media2" },
  // Adultos
  { value: "adultos_nivel1_basica", label: "Nivel 1 Básica (1° a 4° Básico)", type: "adultos", planGroup: "adultos_basica" },
  { value: "adultos_nivel2_basica", label: "Nivel 2 Básica (5° y 6° Básico)", type: "adultos", planGroup: "adultos_basica" },
  { value: "adultos_nivel3_basica", label: "Nivel 3 Básica (7° y 8° Básico)", type: "adultos", planGroup: "adultos_basica" },
  { value: "adultos_nivel1_media", label: "Nivel 1 Media (1° y 2° Medio)", type: "adultos", planGroup: "adultos_media1" },
  { value: "adultos_nivel2_media", label: "Nivel 2 Media (3° y 4° Medio)", type: "adultos", planGroup: "adultos_media2" },
  // PAES
  { value: "paes_lenguaje", label: "PAES - Lenguaje", type: "paes", planGroup: "paes" },
  { value: "paes_matematica", label: "PAES - Matemática", type: "paes", planGroup: "paes" },
  { value: "paes_matematica2", label: "PAES - Matemática 2", type: "paes", planGroup: "paes" },
  { value: "paes_historia", label: "PAES - Historia y Ciencias Sociales", type: "paes", planGroup: "paes" },
  { value: "paes_ciencias", label: "PAES - Ciencias", type: "paes", planGroup: "paes" },
];

// Planes disponibles según el grupo (precio incluye IVA 19% y matrícula)
const plansByGroup: Record<string, Array<{ value: string; label: string; price: string }>> = {
  basica: [
    { value: "basica_plataforma", label: "Plataforma + IA: $480.000", price: "$480.000" },
    { value: "basica_mentor", label: "Plataforma + IA + Mentor: $708.480", price: "$708.480" },
  ],
  media1: [
    { value: "media1_plataforma", label: "Plataforma + IA: $520.000", price: "$520.000" },
    { value: "media1_mentor", label: "Plataforma + IA + Mentor: $748.480", price: "$748.480" },
  ],
  media2: [
    { value: "media2_plataforma", label: "Plataforma + IA: $560.000", price: "$560.000" },
    { value: "media2_mentor", label: "Plataforma + IA + Mentor: $788.480", price: "$788.480" },
  ],
  adultos_basica: [
    { value: "adultos_basica", label: "Plan Básica (1° a 8° Básico) - $360.000", price: "$360.000" },
    { value: "adultos_basica_mentor", label: "Plan Básica (1° a 8° Básico) + Mentor - $588.480", price: "$588.480" },
  ],
  adultos_media1: [
    { value: "adultos_media1", label: "Plan Media I (1° y 2° Medio) - $400.000", price: "$400.000" },
    { value: "adultos_media1_mentor", label: "Plan Media I (1° y 2° Medio) + Mentor - $628.480", price: "$628.480" },
  ],
  adultos_media2: [
    { value: "adultos_media2", label: "Plan Media II (3° y 4° Medio) - $440.000", price: "$440.000" },
    { value: "adultos_media2_mentor", label: "Plan Media II (3° y 4° Medio) + Mentor - $668.480", price: "$668.480" },
  ],
  paes: [
    { value: "paes_lenguaje", label: "Lenguaje - $238.000", price: "$238.000" },
    { value: "paes_matematica", label: "Matemática (M1) - $238.000", price: "$238.000" },
    { value: "paes_matematica2", label: "Matemática 2 (M2) - $333.200", price: "$333.200" },
    { value: "paes_historia", label: "Historia y Ciencias Sociales - $190.400", price: "$190.400" },
    { value: "paes_ciencias", label: "Ciencias - $190.400", price: "$190.400" },
  ],
};

function calculateAge(birthDate: string): { years: number; months: number } {
  if (!birthDate) return { years: 0, months: 0 };
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (today.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  
  return { years, months };
}

export function ReservationDialog({ open, onOpenChange }: ReservationDialogProps) {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [age, setAge] = useState({ years: 0, months: 0 });
  const [availablePlans, setAvailablePlans] = useState<Array<{ value: string; label: string; price: string }>>([]);

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      studentFullName: "",
      studentRut: "",
      dateOfBirth: "",
      guardianFullName: "",
      guardianRut: "",
      studentEmail: "",
      guardianEmail: "",
      phone: "",
      courseOfInterest: "",
      selectedPlan: "",
    },
  });

  const dateOfBirth = form.watch("dateOfBirth");
  const courseOfInterest = form.watch("courseOfInterest");

  // Calculate age when date of birth changes
  useEffect(() => {
    if (dateOfBirth) {
      const calculatedAge = calculateAge(dateOfBirth);
      setAge(calculatedAge);
    }
  }, [dateOfBirth]);

  // Update available plans when course changes
  useEffect(() => {
    if (courseOfInterest) {
      const selectedCourse = courseOptions.find(c => c.value === courseOfInterest);
      if (selectedCourse) {
        const plans = plansByGroup[selectedCourse.planGroup] || [];
        setAvailablePlans(plans);
        form.setValue("selectedPlan", ""); // Reset plan selection
      }
    }
  }, [courseOfInterest, form]);

  const [reservationId, setReservationId] = useState<string | null>(null);
  const [showPaymentOption, setShowPaymentOption] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          age: `${age.years} años, ${age.months} meses`,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al enviar la reserva");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setReservationId(data.id);
      setShowPaymentOption(true);
      setIsSuccess(true);
      toast({
        title: "¡Reserva creada!",
        description: "Ahora puedes proceder con el pago.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!reservationId) throw new Error("No reservation ID");
      
      const formData = form.getValues();
      const selectedPlanData = availablePlans.find(p => p.value === formData.selectedPlan);
      
      const response = await fetch("/api/flow/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          planPrice: selectedPlanData?.price || "$0",
          studentEmail: formData.studentEmail,
          studentName: formData.studentFullName,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear el pago");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Redirigir a Flow.cl para completar el pago
      window.location.href = data.paymentUrl;
    },
    onError: (error: Error) => {
      toast({
        title: "Error al procesar pago",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReservationFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#002147]">
            Formulario de Inscripción
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-[#002147] mb-2">
              ¡Inscripción Creada!
            </h3>
            
            {showPaymentOption ? (
              <>
                <p className="text-[#002147]/70 text-center mb-6">
                  Tu inscripción ha sido registrada. Ahora puedes proceder con el pago a través de Flow.cl
                </p>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setIsSuccess(false);
                      setShowPaymentOption(false);
                      setReservationId(null);
                      form.reset();
                      onOpenChange(false);
                    }}
                    variant="outline"
                  >
                    Pagar después
                  </Button>
                  <Button
                    onClick={() => paymentMutation.mutate()}
                    disabled={paymentMutation.isPending}
                    className="bg-[#A51C30] hover:bg-[#8B1725] text-white"
                  >
                    {paymentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Pagar Ahora con Flow"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-[#002147]/70 text-center">
                Nos pondremos en contacto contigo pronto.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* PARTE 1: DATOS PERSONALES */}
            <div className="bg-[#002147]/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-[#002147] mb-4">Datos Personales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre Completo Alumno */}
                <div>
                  <Label htmlFor="studentFullName">Nombre Completo Alumno *</Label>
                  <Input
                    id="studentFullName"
                    {...form.register("studentFullName")}
                    placeholder="Nombre completo del alumno"
                  />
                  {form.formState.errors.studentFullName && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.studentFullName.message}
                    </p>
                  )}
                </div>

                {/* RUT Alumno */}
                <div>
                  <Label htmlFor="studentRut">RUT Alumno *</Label>
                  <Input
                    id="studentRut"
                    {...form.register("studentRut")}
                    placeholder="12.345.678-9"
                  />
                  {form.formState.errors.studentRut && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.studentRut.message}
                    </p>
                  )}
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                  <Label htmlFor="dateOfBirth">Fecha de Nacimiento *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...form.register("dateOfBirth")}
                  />
                  {form.formState.errors.dateOfBirth && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.dateOfBirth.message}
                    </p>
                  )}
                </div>

                {/* Correo Alumno */}
                <div>
                  <Label htmlFor="studentEmail">Correo Alumno (Gmail) *</Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    {...form.register("studentEmail")}
                    placeholder="alumno@gmail.com"
                  />
                  {form.formState.errors.studentEmail && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.studentEmail.message}
                    </p>
                  )}
                </div>

                {/* Nombre Completo Apoderado */}
                <div>
                  <Label htmlFor="guardianFullName">Nombre Completo Apoderado *</Label>
                  <Input
                    id="guardianFullName"
                    {...form.register("guardianFullName")}
                    placeholder="Nombre completo del apoderado"
                  />
                  {form.formState.errors.guardianFullName && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.guardianFullName.message}
                    </p>
                  )}
                </div>

                {/* RUT Apoderado */}
                <div>
                  <Label htmlFor="guardianRut">RUT Apoderado *</Label>
                  <Input
                    id="guardianRut"
                    {...form.register("guardianRut")}
                    placeholder="12.345.678-9"
                  />
                  {form.formState.errors.guardianRut && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.guardianRut.message}
                    </p>
                  )}
                </div>

                {/* Correo Apoderado */}
                <div>
                  <Label htmlFor="guardianEmail">Correo Apoderado *</Label>
                  <Input
                    id="guardianEmail"
                    type="email"
                    {...form.register("guardianEmail")}
                    placeholder="apoderado@ejemplo.com"
                  />
                  {form.formState.errors.guardianEmail && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.guardianEmail.message}
                    </p>
                  )}
                </div>

                {/* Teléfono de Contacto */}
                <div className="md:col-span-2">
                  <Label htmlFor="phone">Teléfono de Contacto *</Label>
                  <Input
                    id="phone"
                    {...form.register("phone")}
                    placeholder="+56 9 1234 5678"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* PARTE 2: SELECCIÓN DE PROGRAMA */}
            <div className="bg-[#A51C30]/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-[#002147] mb-4">Selección de Programa</h3>
              
              {/* Curso de Interés */}
              <div className="mb-4">
                <Label htmlFor="courseOfInterest">Curso de Interés *</Label>
                <Select
                  value={form.watch("courseOfInterest")}
                  onValueChange={(value) => form.setValue("courseOfInterest", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-sm font-semibold text-[#A51C30]">
                      Menores de 18 años
                    </div>
                    {courseOptions.filter(c => c.type === "menores").map((course) => (
                      <SelectItem key={course.value} value={course.value}>
                        {course.label}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-sm font-semibold text-[#A51C30] border-t mt-2 pt-2">
                      Educación de Adultos
                    </div>
                    {courseOptions.filter(c => c.type === "adultos").map((course) => (
                      <SelectItem key={course.value} value={course.value}>
                        {course.label}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-sm font-semibold text-[#002147] border-t mt-2 pt-2">
                      PAES
                    </div>
                    {courseOptions.filter(c => c.type === "paes").map((course) => (
                      <SelectItem key={course.value} value={course.value}>
                        {course.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.courseOfInterest && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.courseOfInterest.message}
                  </p>
                )}
              </div>

              {/* PARTE 3: SELECCIÓN DE PLAN */}
              {availablePlans.length > 0 && (
                <div>
                  <Label htmlFor="selectedPlan">Plan Seleccionado *</Label>
                  <Select
                    value={form.watch("selectedPlan")}
                    onValueChange={(value) => form.setValue("selectedPlan", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlans.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[#002147]/60 mt-1">
                    * Incluye matrícula, incluye I.V.A.
                  </p>
                  {form.formState.errors.selectedPlan && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.selectedPlan.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Botón Submit */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-[#A51C30] hover:bg-[#8B1725] text-white"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Inscripción"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
