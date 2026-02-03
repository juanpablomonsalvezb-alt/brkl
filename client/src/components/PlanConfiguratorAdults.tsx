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

  // Define the 3 adult validation plans (precios incluyen IVA 19%)
  const allPlans: ExtendedPlan[] = [
    {
      id: 'plan_basica',
      planKey: 'plan_basica_adultos',
      planName: 'Plan Básica',
      planSubtitle: 'Desde 1° Básico a 8° Básico',
      monthlyPrice: 35700, // $428,400 / 12 meses
      enrollmentPrice: 0,
      annualTotal: 428400,
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
      monthlyPrice: 39667, // $476,000 / 12 meses
      enrollmentPrice: 0,
      annualTotal: 476000,
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
      monthlyPrice: 43633, // $523,600 / 12 meses
      enrollmentPrice: 0,
      annualTotal: 523600,
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
                header: { normal: '#64748b', hover: '#fde68a' } // Amarillo pastel
              },
              { 
                base: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
                header: { normal: '#64748b', hover: '#fecaca' } // Rojo pastel
              },
              { 
                base: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
                header: { normal: '#64748b', hover: '#fed7aa' } // Naranja pastel
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
                className={`border-2 shadow-lg overflow-hidden transition-all duration-300 cursor-pointer flex flex-col group ${
                  isSelected 
                    ? 'ring-2 ring-blue-300 scale-[1.02]' 
                    : 'hover:shadow-xl'
                }`}
                onClick={() => selectPlan(index)}
                style={{ 
                  minHeight: '580px', 
                  maxHeight: '580px',
                  background: scheme.base.bg,
                  borderColor: scheme.base.border
                }}
              >
                {/* Header */}
                <div 
                  className="p-4 text-center border-b border-slate-300 transition-all duration-300"
                  style={{
                    backgroundColor: isSelected ? scheme.header.hover : scheme.header.normal
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = scheme.header.hover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = scheme.header.normal;
                    }
                  }}
                >
                  <h3 className={`text-xl font-bold mb-1 tracking-tight transition-colors duration-300 ${isSelected ? 'text-slate-800' : 'text-white group-hover:text-slate-800'}`}>
                    {plan.planName}
                  </h3>
                  <p className={`text-sm font-light transition-colors duration-300 ${isSelected ? 'text-slate-700' : 'text-white/90 group-hover:text-slate-700'}`}>
                    {plan.planSubtitle}
                  </p>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col bg-white">
                  {/* Pricing */}
                  <div className="relative overflow-hidden rounded-lg p-4 mb-4 border border-slate-300 bg-slate-50">
                    {/* Harvard accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400"></div>
                    
                    <div className="relative text-center pt-1">
                      <div className="text-xs font-semibold mb-1.5 tracking-wider uppercase text-slate-600">Inversión Anual</div>
                      <div className="text-3xl font-bold mb-1 text-slate-700">
                        {formatCurrency(plan.annualTotal || 0)}
                      </div>
                      <div className="text-xs text-slate-600">30 semanas</div>
                      <div className="text-xs text-slate-500 mt-1">* Incluye IVA</div>
                    </div>
                  </div>

                  {/* Compact Info */}
                  <div className="space-y-3 mb-4 flex-1">
                    {/* Academic Structure */}
                    <div className="rounded-lg p-3 border border-slate-200 bg-slate-50">
                      <h5 className="font-semibold text-xs mb-1.5 uppercase tracking-wide text-slate-700">Estructura</h5>
                      <div className="text-xs space-y-1 text-slate-600">
                        <p>• {plan.academicLoad}</p>
                        <p>• {plan.evaluationsDetail}</p>
                      </div>
                    </div>

                    {/* Subjects */}
                    <div className="rounded-lg p-3 border border-slate-200 bg-slate-50">
                      <h5 className="font-semibold text-xs mb-1.5 uppercase tracking-wide text-slate-700">Asignaturas</h5>
                      <div className="grid grid-cols-1 gap-1">
                        {parseSubjects(plan.subjects).map((subject, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400"></span>
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
                      setIsReservationOpen(true);
                    }}
                    className="w-full font-semibold transition-all text-sm py-3 text-white shadow-md hover:shadow-lg bg-[#002147] hover:bg-[#001a3a] active:scale-95"
                  >
                    Inscripción
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
