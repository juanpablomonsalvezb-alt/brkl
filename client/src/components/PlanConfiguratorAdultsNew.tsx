import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReservationDialog } from "@/components/ReservationDialog";

const ADULT_PLANS = [
  {
    id: 'plan_basica_adultos',
    level: 'Básica',
    grades: '1° Básico a 8° Básico',
    price: '180.000',
    description: 'Programa completo de validación para educación básica',
    gradient: 'from-blue-600 via-blue-700 to-blue-800',
    accentColor: 'from-blue-400 via-blue-500 to-blue-600',
    highlight: false,
  },
  {
    id: 'plan_media_i_adultos',
    level: 'Media I',
    grades: '1° y 2° Medio',
    price: '220.000',
    description: 'Validación de primer nivel de enseñanza media',
    gradient: 'from-[#A51C30] via-[#8B1725] to-[#6B1220]',
    accentColor: 'from-[#C41E3A] via-[#A51C30] to-[#8B1725]',
    highlight: true,
  },
  {
    id: 'plan_media_ii_adultos',
    level: 'Media II',
    grades: '3° y 4° Medio',
    price: '260.000',
    description: 'Validación de segundo nivel de enseñanza media',
    gradient: 'from-purple-600 via-purple-700 to-purple-800',
    accentColor: 'from-purple-400 via-purple-500 to-purple-600',
    highlight: false,
  },
];

export function PlanConfiguratorAdultsNew() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const handleInscribir = (planId: string) => {
    setSelectedPlanId(planId);
    setIsReservationOpen(true);
  };

  return (
    <section className="relative py-24 bg-white overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-transparent to-gray-50" />
      
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
            Planes Validación de Estudios
          </h2>
          
          <p className="text-xl text-[#A51C30] font-semibold">
            Mayores de 18 años
          </p>
        </motion.div>

        {/* Plans Grid - Harvard-Inspired Elite Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {ADULT_PLANS.map((plan, index) => (
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
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-2xl font-bold text-gray-500">$</span>
                      <span className="text-5xl font-black text-[#002147]" style={{ fontFamily: 'Georgia, serif' }}>
                        {plan.price.split('.')[0]}
                      </span>
                      <span className="text-2xl font-bold text-gray-500">.000</span>
                    </div>
                  </div>

                  {/* Academic Features */}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#A51C30]" />
                      <span>IVA incluido</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#A51C30]" />
                      <span>Pago único Marzo - Octubre 2026</span>
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
      <ReservationDialog
        open={isReservationOpen}
        onOpenChange={setIsReservationOpen}
        planId={selectedPlanId}
      />
    </section>
  );
}
