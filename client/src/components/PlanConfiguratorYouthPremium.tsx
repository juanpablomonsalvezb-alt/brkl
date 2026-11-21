import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check, Sparkles, BookOpen, TrendingUp, Clock, Headphones, FileText, Award, Users, BarChart, ChevronRight, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReservationDialog } from "./ReservationDialog";

// Características premium con categorización
const PREMIUM_FEATURES = [
  {
    category: "Excelencia Académica",
    icon: Shield,
    items: [
      "Sin Matrícula: Precio final transparente, sin cargos ocultos ni administrativos",
      "Contenido MINEDUC: Curricularmente alineado con estándares oficiales y temario DEMRE",
    ]
  },
  {
    category: "Tecnología de Vanguardia",
    icon: Zap,
    items: [
      "Academic Copilot con IA: Sistema predictivo que analiza tu rendimiento y personaliza tu ruta de aprendizaje",
      "Acceso 24/7 sin Restricciones: Plataforma disponible en cualquier momento, estudia con total autonomía",
    ]
  },
  {
    category: "Recursos Completos",
    icon: BookOpen,
    items: [
      "Material Digital Integral: Biblioteca completa con libros, guías y recursos teóricos descargables",
      "+100 Evaluaciones Progresivas: Micro-tests calibrados para validar dominio de cada unidad temática",
      "4 Ensayos de Alta Fidelidad: Simulacros que replican formato oficial con precisión milimétrica",
    ]
  },
  {
    category: "Acompañamiento Profesional",
    icon: Users,
    items: [
      "Mentoring Estratégico: Orientación personalizada para optimizar tu planificación de estudio",
      "Métricas Avanzadas: Dashboard con visualización de progreso, puntajes y proyección de resultados",
      "Soporte Técnico Continuo: Asistencia profesional disponible 24/7 para cualquier necesidad",
    ]
  }
];

// Plan escolar (Básica, Media I y Media II), decisión del sostenedor 2026-11-21: lista anual tachada, pago único con 15 % de descuento.
const PRECIO_ESCOLAR = { listaAnual: 490_000, pagoUnico: 416_500, ahorro: 73_500, descuentoPct: 15 } as const;

// Planes con diseño premium
const PREMIUM_PLANS = [
  {
    id: "basica",
    level: "Básica",
    grades: "7º y 8º Básico",
    period: "Mar — Oct 2027",
    price: "416.500",
    currency: "CLP",
    description: "Fundamentos sólidos para la educación media",
    highlight: false,
    gradient: "from-slate-700 via-slate-800 to-slate-900",
    accentColor: "from-blue-500 to-cyan-500",
  },
  {
    id: "media1",
    level: "Media I",
    grades: "1º y 2º Medio",
    period: "Mar — Oct 2027",
    price: "416.500",
    currency: "CLP",
    description: "Consolidación de competencias clave",
    highlight: true,
    gradient: "from-[#002147] via-[#003366] to-[#004477]",
    accentColor: "from-[#A51C30] to-[#C41E3A]",
  },
  {
    id: "media2",
    level: "Media II",
    grades: "3º y 4º Medio",
    period: "Mar — Oct 2027",
    price: "416.500",
    currency: "CLP",
    description: "Preparación integral para la educación superior",
    highlight: false,
    gradient: "from-slate-700 via-slate-800 to-slate-900",
    accentColor: "from-orange-500 to-red-500",
  },
];

export function PlanConfiguratorYouthPremium() {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const handleInscribir = (planId: string) => {
    setSelectedPlan(planId);
    setOpen(true);
  };

  return (
    <section className="relative py-24 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,33,71,0.03),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(165,28,48,0.03),transparent_50%)]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-[#002147] mb-3 tracking-tight">
            Planes Exámenes Libres
          </h2>
          
          <p className="text-xl text-[#A51C30] font-semibold">
            Menores de 18 años
          </p>
        </motion.div>

        {/* Premium Plans Grid - Harvard-Inspired Elite Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {PREMIUM_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              onHoverStart={() => setHoveredPlan(plan.id)}
              onHoverEnd={() => setHoveredPlan(null)}
              className="relative group"
            >

              {/* Elite Card Container */}
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`relative h-full bg-white rounded-2xl overflow-hidden border-2 transition-all duration-300
                  ${plan.highlight 
                    ? 'border-[#A51C30] shadow-2xl shadow-[#A51C30]/20' 
                    : 'border-gray-200 shadow-xl'
                  }
                  ${hoveredPlan === plan.id ? 'shadow-3xl' : ''}`}
              >
                {/* Top Accent Bar - Harvard Crimson */}
                <div className={`h-1.5 ${plan.highlight ? 'bg-[#A51C30]' : 'bg-[#002147]'}`} />

                {/* Watermark Pattern */}
                <div className="absolute inset-0 opacity-[0.015] pointer-events-none">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23002147' fill-opacity='1'/%3E%3C/svg%3E")`,
                    backgroundSize: '30px 30px'
                  }} />
                </div>

                {/* Content */}
                <div className="relative p-7">
                  {/* Academic Crest Icon */}
                  <div className="flex justify-center mb-5">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                      className={`w-18 h-18 rounded-full flex items-center justify-center border-3 ${
                        plan.highlight 
                          ? 'bg-gradient-to-br from-[#A51C30] to-[#8B1725] border-[#A51C30]' 
                          : 'bg-gradient-to-br from-[#002147] to-[#001a35] border-[#002147]'
                      } shadow-lg`}
                      style={{ width: '4.5rem', height: '4.5rem' }}
                    >
                      <Sparkles className="w-9 h-9 text-white" />
                    </motion.div>
                  </div>

                  {/* Plan Title */}
                  <div className="text-center mb-5 border-b border-gray-100 pb-5">
                    <h3 className="text-2xl font-black text-[#002147] tracking-tight mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                      Plan {plan.level}
                    </h3>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide" style={{ letterSpacing: '0.1em' }}>
                      {plan.grades}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-center text-sm text-gray-600 leading-relaxed mb-5 px-2">
                    {plan.description}
                  </p>

                  {/* Pricing Section */}
                  <div className="text-center mb-5 py-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-400 line-through" aria-label={`Precio de lista anual $${PRECIO_ESCOLAR.listaAnual.toLocaleString("es-CL")}`}>
                      ${PRECIO_ESCOLAR.listaAnual.toLocaleString("es-CL")}
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-2xl font-bold text-gray-500">$</span>
                      <span className="text-5xl font-black text-[#002147]" style={{ fontFamily: 'Georgia, serif' }}>
                        {PRECIO_ESCOLAR.pagoUnico.toLocaleString("es-CL")}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#A51C30] mt-1">
                      Pago único del año · {PRECIO_ESCOLAR.descuentoPct}% de descuento · ahorras ${PRECIO_ESCOLAR.ahorro.toLocaleString("es-CL")}
                    </p>
                  </div>

                  {/* Academic Features */}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#A51C30]" />
                      <span>IVA incluido</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#A51C30]" />
                      <span>Pago único Marzo - Octubre 2027</span>
                    </div>
                  </div>

                  {/* CTA Button - Harvard Style */}
                  <Button
                    onClick={() => handleInscribir(plan.id)}
                    className={`w-full py-5 text-sm font-bold uppercase tracking-wider rounded-lg transition-all duration-300
                      ${plan.highlight 
                        ? 'bg-[#A51C30] hover:bg-[#8B1725] text-white shadow-lg hover:shadow-xl' 
                        : 'bg-[#002147] hover:bg-[#001a35] text-white shadow-lg hover:shadow-xl'
                      }
                      group/btn`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      Solicitar Inscripción
                      <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Reservation Dialog */}
      <ReservationDialog open={open} onOpenChange={setOpen} />
    </section>
  );
}
