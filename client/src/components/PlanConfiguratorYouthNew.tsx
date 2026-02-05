import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Calendar, Sparkles, BookOpen, BarChart, Clock, Headphones, TrendingUp, FileText, Award, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReservationDialog } from "./ReservationDialog";

// Características generales incluidas en todos los planes
const PLAN_FEATURES = [
  { icon: Sparkles, text: "Sin Matrícula: El valor del plan es el precio final; no existen cobros por inscripción" },
  { icon: BookOpen, text: "Contenido MINEDUC: Alineado con el currículum oficial y temario DEMRE vigente" },
  { icon: TrendingUp, text: "Academic Copilot (IA Personalizada): Analiza tu rendimiento y recomienda qué reforzar" },
  { icon: Clock, text: "Acceso Completo a Plataforma 24/7: Estudia a tu propio ritmo, sin clases por Zoom" },
  { icon: FileText, text: "Material Digital Completo: Libros, guías y recursos descargables incluidos" },
  { icon: BarChart, text: "+100 Evaluaciones de Proceso: Micro-tests para validar el aprendizaje continuo" },
  { icon: Award, text: "4 Ensayos Generales: Simulacros de alta fidelidad con formato oficial" },
  { icon: Users, text: "Mentoring de Acompañamiento: Organización de horarios y orientación administrativa" },
  { icon: TrendingUp, text: "Métricas de Evaluación: Reportes detallados y gráficos de progreso" },
  { icon: Headphones, text: "Soporte Técnico 24/7: Asistencia continua para resolver inconvenientes" },
];

// Planes disponibles (precios con IVA incluido)
const PLANS = [
  {
    id: "basica",
    title: "Plan Básica",
    subtitle: "7º y 8º Básico",
    period: "Marzo - Octubre 2026",
    price: "$480.000",
    priceNote: "(IVA incluido)",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "media1",
    title: "Plan Media I",
    subtitle: "1º y 2º Medio",
    period: "Marzo - Octubre 2026",
    price: "$520.000",
    priceNote: "(IVA incluido)",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "media2",
    title: "Plan Media II",
    subtitle: "3º y 4º Medio",
    period: "Marzo - Octubre 2026",
    price: "$560.000",
    priceNote: "(IVA incluido)",
    gradient: "from-orange-500 to-red-500",
  },
];

export function PlanConfiguratorYouthNew() {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const handleInscribir = (planId: string) => {
    setSelectedPlan(planId);
    setOpen(true);
  };

  return (
    <div className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-[#002147] mb-4">
            Exámenes Libres - Menores de 18 años
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Elige el plan ideal para tu nivel educativo con Academic Copilot
          </p>
        </motion.div>

        {/* 3 Cards Horizontales Compactas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full">
                {/* Gradient Header */}
                <div className={`h-2 bg-gradient-to-r ${plan.gradient}`} />
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-[#002147] mb-2">
                    {plan.title}
                  </CardTitle>
                  <p className="text-lg font-semibold text-gray-700">
                    {plan.subtitle}
                  </p>
                </CardHeader>

                <CardContent className="text-center space-y-4">
                  {/* Periodo */}
                  <div className="flex items-center justify-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">{plan.period}</span>
                  </div>

                  {/* Precio */}
                  <div className="py-4">
                    <div className="text-4xl font-bold text-[#A51C30]">
                      {plan.price}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {plan.priceNote}
                    </div>
                  </div>

                  {/* Botón */}
                  <Button
                    onClick={() => handleInscribir(plan.id)}
                    className={`w-full bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white font-semibold py-6 text-lg`}
                  >
                    Inscribir
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Módulo Grande: Características Generales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-[#002147] to-[#003366] text-white">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8" />
                ¿Qué incluyen nuestros planes con Academic Copilot?
                <Sparkles className="w-8 h-8" />
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {PLAN_FEATURES.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-4 p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#A51C30] to-[#C41E3A] flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white/90 leading-relaxed">
                        {feature.text}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Dialog de Reserva */}
      <ReservationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
