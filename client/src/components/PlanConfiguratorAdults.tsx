import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Sparkles, ShoppingBag, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { ReservationDialog } from "@/components/ReservationDialog";

interface PlanConfiguration {
  id: string;
  planKey: string;
  planName: string;
  planSubtitle: string | null;
  monthlyPrice: number;
  enrollmentPrice: number;
  annualTotal: number | null;
  academicLoad: string | null;
  evaluationsDetail: string | null;
  subjects: string;
  description: string | null;
  category: string | null;
  linkText: string | null;
  isActive: boolean;
  sortOrder: number;
}

type ExtendedPlan = PlanConfiguration & { type: 'full' | 'standard' | 'tutor' };

interface SelectedPlan {
  basePlan: ExtendedPlan | null;
}

export function PlanConfiguratorAdults() {
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number | null>(null);
  const [isReservationOpen, setIsReservationOpen] = useState(false);

  // Define the 3 adult validation plans statically
  const isLoading = false;
  const isError = false;

  // Define the 3 adult validation plans
  const allPlans: ExtendedPlan[] = [
    {
      id: 'plan_basica',
      planKey: 'plan_basica_adultos',
      planName: 'Plan Básica',
      planSubtitle: 'Desde 1° Básico a 8° Básico',
      monthlyPrice: 30000, // $360,000 / 12 meses
      enrollmentPrice: 0,
      annualTotal: 360000,
      academicLoad: '15 Módulos (2 semanas c/u)',
      evaluationsDetail: '+60 Test de proceso, 2 Ensayos Generales',
      subjects: JSON.stringify([
        'Lengua Castellana y Comunicación',
        'Matemática',
        'Ciencias Naturales',
        'Estudios Sociales'
      ]),
      description: 'Plan completo para validar educación básica desde 1° a 8° básico. Incluye todas las asignaturas oficiales del currículo nacional.',
      category: 'Adultos',
      linkText: null,
      isActive: true,
      sortOrder: 1,
      type: 'full' as const,
    },
    {
      id: 'plan_media_i',
      planKey: 'plan_media_i_adultos',
      planName: 'Plan Media I',
      planSubtitle: '1er Nivel Medio (1° y 2°)',
      monthlyPrice: 33333, // $400,000 / 12 meses
      enrollmentPrice: 0,
      annualTotal: 400000,
      academicLoad: '15 Módulos (2 semanas c/u)',
      evaluationsDetail: '+60 Test de proceso, 2 Ensayos Generales',
      subjects: JSON.stringify([
        'Lengua Castellana y Comunicación',
        'Matemática',
        'Ciencias Naturales',
        'Estudios Sociales',
        'Idioma Extranjero: Inglés'
      ]),
      description: 'Plan completo para validar 1er Nivel Medio (equivalente a 1° y 2° medio). Incluye todas las asignaturas oficiales del currículo nacional más inglés.',
      category: 'Adultos',
      linkText: null,
      isActive: true,
      sortOrder: 2,
      type: 'full' as const,
    },
    {
      id: 'plan_media_ii',
      planKey: 'plan_media_ii_adultos',
      planName: 'Plan Media II',
      planSubtitle: '2do Nivel Medio (3° y 4°)',
      monthlyPrice: 36667, // $440,000 / 12 meses
      enrollmentPrice: 0,
      annualTotal: 440000,
      academicLoad: '15 Módulos (2 semanas c/u)',
      evaluationsDetail: '+60 Test de proceso, 2 Ensayos Generales',
      subjects: JSON.stringify([
        'Lengua Castellana y Comunicación',
        'Matemática',
        'Ciencias Naturales',
        'Estudios Sociales',
        'Idioma Extranjero: Inglés'
      ]),
      description: 'Plan completo para validar 2do Nivel Medio (equivalente a 3° y 4° medio). Incluye todas las asignaturas oficiales del currículo nacional más inglés.',
      category: 'Adultos',
      linkText: null,
      isActive: true,
      sortOrder: 3,
      type: 'full' as const,
    }
  ];

  const selectPlan = (index: number) => {
    setSelectedPlanIndex(index);
  };

  const selectedPlan = selectedPlanIndex !== null ? allPlans[selectedPlanIndex] : null;

  // Format currency
  const formatCurrency = (value: number) => {
    return "$" + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Calculate totals
  const calculateTotal = () => {
    if (!selectedPlan) return 0;
    return selectedPlan.monthlyPrice;
  };

  const calculateAnnualTotal = () => {
    if (!selectedPlan) return 0;
    return selectedPlan.annualTotal || 0;
  };

  // Parse subjects - handle both string and already parsed arrays
  const parseSubjects = (subjectsStr: string | string[]): string[] => {
    if (Array.isArray(subjectsStr)) return subjectsStr;
    try {
      return JSON.parse(subjectsStr);
    } catch {
      return [];
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 px-4 bg-gradient-to-b from-[#002147]/5 to-white">
        <div className="container mx-auto text-center">
          <p className="text-[#002147]/60">Cargando planes para adultos...</p>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="py-12 px-4 bg-gradient-to-b from-[#002147]/5 to-white">
        <div className="container mx-auto text-center">
          <p className="text-red-600">Error al cargar planes para adultos</p>
        </div>
      </section>
    );
  }

  if (allPlans.length === 0) {
    return (
      <section className="py-12 px-4 bg-gradient-to-b from-[#002147]/5 to-white">
        <div className="container mx-auto text-center">
          <p className="text-[#002147]/60">No hay planes disponibles para adultos.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="planes-adultos" className="py-12 px-4 bg-gradient-to-b from-[#002147]/5 to-white">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-6">
              <h2 className="text-5xl md:text-6xl font-bold text-[#002147] tracking-tight">
                Plan Adultos
              </h2>
              <div className="flex items-center gap-3 bg-[#002147]/5 border border-[#002147]/10 rounded-lg px-6 py-3">
                <span className="text-sm font-medium text-[#002147]/70">Matrícula</span>
                <span className="text-2xl font-bold text-[#A51C30]">$60.000</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Grid - 3 Columns for 3 Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Render all 3 plans simultaneously */}
          {allPlans.map((plan, index) => {
            const colorSchemes = [
              { 
                base: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
                hover: { from: '#10b981', to: '#14b8a6', border: '#10b981', shadow: '#10b98120' }
              },
              { 
                base: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
                hover: { from: '#059669', to: '#0d9488', border: '#059669', shadow: '#05966920' }
              },
              { 
                base: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
                hover: { from: '#14b8a6', to: '#06b6d4', border: '#14b8a6', shadow: '#14b8a620' }
              }
            ];
            const scheme = colorSchemes[index];
            const isSelected = selectedPlanIndex === index;
            
            return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + (index * 0.1) }}
            >
              <Card 
                className={`border-2 shadow-2xl overflow-hidden transition-all duration-500 cursor-pointer flex flex-col group ${
                  isSelected 
                    ? 'ring-4 ring-opacity-20 scale-105' 
                    : 'hover:shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:scale-[1.02]'
                }`}
                onClick={() => selectPlan(index)}
                style={{ 
                  minHeight: '580px', 
                  maxHeight: '580px',
                  background: isSelected ? `linear-gradient(135deg, ${scheme.hover.from} 0%, ${scheme.hover.to} 100%)` : scheme.base.bg,
                  borderColor: isSelected ? scheme.hover.border : scheme.base.border,
                  boxShadow: isSelected ? `0 0 0 4px ${scheme.hover.shadow}, 0 10px 30px ${scheme.hover.shadow}` : undefined
                }}
              >
                {/* Header */}
                <div 
                  className={`p-4 text-center border-b transition-all duration-500 ${isSelected ? 'border-white/20' : 'border-slate-300'}`}
                  style={{
                    background: isSelected ? `linear-gradient(to right, ${scheme.hover.from}, ${scheme.hover.to})` : 'linear-gradient(to right, #64748b, #475569)'
                  }}
                >
                  <h3 className={`text-xl font-bold mb-1 tracking-tight transition-colors duration-500 ${isSelected ? 'text-white' : 'text-white group-hover:text-white'}`}>
                    {plan.planName}
                  </h3>
                  <p className={`text-sm font-light transition-colors duration-500 ${isSelected ? 'text-white/90' : 'text-white/80 group-hover:text-white/90'}`}>
                    {plan.planSubtitle}
                  </p>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Pricing */}
                  <div className={`relative overflow-hidden rounded-lg p-4 mb-4 border transition-all duration-500 ${isSelected ? 'border-white/20 bg-white/10' : 'border-slate-300 bg-white group-hover:border-emerald-300'}`}>
                    {/* Harvard accent line */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1 transition-all duration-500"
                      style={{
                        background: isSelected ? `linear-gradient(to right, ${scheme.hover.from}, ${scheme.hover.to})` : 'linear-gradient(to right, #64748b, #475569)'
                      }}
                    ></div>
                    
                    <div className="relative text-center pt-1">
                      <div className={`text-xs font-semibold mb-1.5 tracking-wider uppercase transition-colors duration-500 ${isSelected ? 'text-white/80' : 'text-slate-600 group-hover:text-emerald-600'}`}>Inversión Anual</div>
                      <div className={`text-3xl font-bold mb-1 transition-colors duration-500`} style={{ color: isSelected ? '#ffffff' : scheme.base.text }}>
                        {formatCurrency(plan.annualTotal || 0)}
                      </div>
                      <div className={`text-xs transition-colors duration-500 ${isSelected ? 'text-white/70' : 'text-slate-600 group-hover:text-emerald-500'}`}>30 semanas</div>
                    </div>
                  </div>

                  {/* Compact Info */}
                  <div className="space-y-3 mb-4 flex-1">
                    {/* Academic Structure */}
                    <div className={`rounded-lg p-3 border transition-all duration-500 ${isSelected ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200 group-hover:bg-emerald-50 group-hover:border-emerald-200'}`}>
                      <h5 className={`font-semibold text-xs mb-1.5 uppercase tracking-wide transition-colors duration-500 ${isSelected ? 'text-white' : 'text-slate-700 group-hover:text-emerald-700'}`}>Estructura</h5>
                      <div className={`text-xs space-y-1 transition-colors duration-500 ${isSelected ? 'text-white/80' : 'text-slate-600 group-hover:text-emerald-600'}`}>
                        <p>• {plan.academicLoad}</p>
                        <p>• {plan.evaluationsDetail}</p>
                      </div>
                    </div>

                    {/* Subjects */}
                    <div 
                      className={`rounded-lg p-3 border transition-all duration-500 ${isSelected ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200 group-hover:bg-emerald-50 group-hover:border-emerald-200'}`}
                    >
                      <h5 className={`font-semibold text-xs mb-1.5 uppercase tracking-wide transition-colors duration-500 ${isSelected ? 'text-white' : 'text-slate-700 group-hover:text-emerald-700'}`}>Asignaturas</h5>
                      <div className="grid grid-cols-1 gap-1">
                        {parseSubjects(plan.subjects).map((subject, idx) => (
                          <div key={idx} className={`flex items-center gap-2 text-xs transition-colors duration-500 ${isSelected ? 'text-white/80' : 'text-slate-600 group-hover:text-emerald-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-500`} style={{ backgroundColor: isSelected ? '#ffffff' : scheme.base.text }}></span>
                            <span className="leading-tight">{subject}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Select Button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectPlan(index);
                    }}
                    className={`w-full font-semibold transition-all duration-500 text-sm py-3 text-white shadow-md hover:shadow-lg ${
                      isSelected
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-slate-600 hover:bg-emerald-600 group-hover:bg-emerald-500'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Seleccionado
                      </>
                    ) : (
                      'Seleccionar Plan'
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
            );
          })}
        </div>

        {/* Summary Section Below */}
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <Card className="border-2 border-[#A51C30]/50 bg-gradient-to-br from-[#002147]/5 to-white shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#A51C30] to-[#8B1725] p-4 border-b-2 border-[#002147]/10">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-[#A51C30]" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Resumen de tu Plan
                  </h3>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center pb-3 border-b border-[#002147]/10">
                    <div>
                      <p className="font-semibold text-[#002147] text-lg">{selectedPlan.planName}</p>
                      <p className="text-sm text-[#002147]/60">{selectedPlan.planSubtitle}</p>
                    </div>
                  </div>

                  <div className="relative overflow-hidden bg-gradient-to-br from-[#002147] to-[#003366] rounded-lg p-6 text-white border border-[#A51C30]/20">
                    {/* Harvard accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#A51C30] to-[#8B1725]"></div>
                    
                    <div className="relative pt-2">
                      <div className="text-center mb-3">
                        <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-white/80">Inversión Total</div>
                        <div className="text-4xl font-bold text-white">
                          {formatCurrency(calculateAnnualTotal())}
                        </div>
                        <div className="text-xs mt-2 text-white/70">30 semanas de formación integral</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setIsReservationOpen(true)}
                  className="w-full bg-[#A51C30] hover:bg-[#8B1725] text-white font-semibold py-4 text-base rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Reservar Plan
                </Button>

                <ReservationDialog 
                  open={isReservationOpen}
                  onOpenChange={setIsReservationOpen}
                />

                <p className="text-sm text-center text-[#002147]/50 mt-4">
                  Sin compromiso • Cancela cuando quieras
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </section>
  );
}
