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

// Planes con diseño premium
const PREMIUM_PLANS = [
  {
    id: "basica",
    level: "Básica",
    grades: "7º y 8º Básico",
    period: "Mar — Oct 2026",
    price: "240.000",
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
    period: "Mar — Oct 2026",
    price: "280.000",
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
    period: "Mar — Oct 2026",
    price: "320.000",
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
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#002147]/5 border border-[#002147]/10 mb-6"
          >
            <Sparkles className="w-4 h-4 text-[#A51C30]" />
            <span className="text-sm font-medium text-[#002147]">Exámenes Libres</span>
          </motion.div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-[#002147] mb-6 tracking-tight">
            Planes Académicos
            <span className="block text-[#A51C30] mt-2">con Academic Copilot</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Programas diseñados con rigor académico y tecnología de vanguardia
            <span className="block mt-2 text-lg text-gray-500">para estudiantes menores de 18 años</span>
          </p>
        </motion.div>

        {/* Premium Plans Grid */}
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
              {/* Highlight Badge */}
              {plan.highlight && (
                <motion.div
                  initial={{ scale: 0, rotate: -12 }}
                  animate={{ scale: 1, rotate: -12 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                  className="absolute -top-4 -right-4 z-10 bg-gradient-to-r from-[#A51C30] to-[#C41E3A] text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg"
                >
                  MÁS POPULAR
                </motion.div>
              )}

              {/* Card */}
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className={`relative h-full rounded-2xl overflow-hidden shadow-lg transition-shadow duration-300
                  ${plan.highlight ? 'shadow-[#A51C30]/20 ring-2 ring-[#A51C30]/20' : 'shadow-gray-200'}
                  ${hoveredPlan === plan.id ? 'shadow-2xl' : ''}`}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-95`} />
                
                {/* Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.accentColor}`} />

                {/* Content */}
                <div className="relative p-8">
                  {/* Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${plan.accentColor}`} />
                      <span className="text-sm font-medium text-white/70 uppercase tracking-wider">
                        {plan.period}
                      </span>
                    </div>
                    
                    <h3 className="text-3xl font-bold text-white mb-2">
                      Plan {plan.level}
                    </h3>
                    
                    <p className="text-lg font-medium text-white/80 mb-3">
                      {plan.grades}
                    </p>
                    
                    <p className="text-sm text-white/60 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="mb-8 pb-8 border-b border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-white">
                        ${plan.price}
                      </span>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/80">
                        IVA incluido
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/80">
                        Marzo a Octubre
                      </span>
                    </div>
                  </div>


                  {/* CTA Button */}
                  <Button
                    onClick={() => handleInscribir(plan.id)}
                    className={`w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300
                      ${plan.highlight 
                        ? 'bg-gradient-to-r from-[#A51C30] to-[#C41E3A] hover:from-[#8B1725] hover:to-[#A51C30] text-white shadow-lg shadow-[#A51C30]/30' 
                        : 'bg-white text-[#002147] hover:bg-gray-50'
                      }
                      group/btn`}
                  >
                    <span>Inscribir ahora</span>
                    <ChevronRight className="inline-block ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Premium Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Background Card */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#002147] via-[#003366] to-[#002147] p-12 shadow-2xl">
            {/* Decorative Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '32px 32px'
              }} />
            </div>

            {/* Content */}
            <div className="relative">
              {/* Header */}
              <div className="text-center mb-16">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-3 mb-6"
                >
                  <Sparkles className="w-8 h-8 text-[#A51C30]" />
                  <h3 className="text-4xl font-bold text-white">
                    Experiencia Académica Integral
                  </h3>
                  <Sparkles className="w-8 h-8 text-[#A51C30]" />
                </motion.div>
                
                <p className="text-xl text-white/70 max-w-3xl mx-auto">
                  Todo lo que necesitas para alcanzar la excelencia académica, unificado en una plataforma premium
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {PREMIUM_FEATURES.map((section, sectionIndex) => (
                  <motion.div
                    key={sectionIndex}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: sectionIndex * 0.1, duration: 0.6 }}
                  >
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#A51C30] to-[#C41E3A] flex items-center justify-center shadow-lg">
                        <section.icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-white">
                        {section.category}
                      </h4>
                    </div>

                    {/* Items */}
                    <div className="space-y-4">
                      {section.items.map((item, itemIndex) => (
                        <motion.div
                          key={itemIndex}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + (itemIndex * 0.1) }}
                          className="flex items-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                        >
                          <Check className="w-5 h-5 text-[#A51C30] flex-shrink-0 mt-0.5" />
                          <p className="text-white/80 text-sm leading-relaxed">
                            {item}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reservation Dialog */}
      <ReservationDialog open={open} onOpenChange={setOpen} />
    </section>
  );
}
