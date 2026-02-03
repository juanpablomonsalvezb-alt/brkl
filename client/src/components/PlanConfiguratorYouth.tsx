import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, ShoppingBag, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReservationDialog } from "@/components/ReservationDialog";

interface PlanConfiguration {
  id: string;
  planKey: string;
  planName: string;
  planSubtitle: string | null;
  monthlyPrice: number;
  enrollmentPrice: number;
  annualTotal: number | null;
  annualTotalWithMentor?: number;
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

export function PlanConfiguratorYouth() {
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number | null>(null);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [mentorStates, setMentorStates] = useState<boolean[]>([false, false, false]);

  const toggleMentor = (index: number) => {
    setMentorStates(prev => {
      const newStates = [...prev];
      newStates[index] = !newStates[index];
      return newStates;
    });
  };

  // Define the 3 youth plans (precios incluyen IVA 19%)
  const allPlans: ExtendedPlan[] = [
    {
      id: 'plan_basica_jovenes',
      planKey: 'plan_7_8_basico',
      planName: 'Plan Básica',
      planSubtitle: '7° y 8° Básico',
      monthlyPrice: 65450,
      enrollmentPrice: 71400,
      annualTotal: 595000,
      annualTotalWithMentor: 880600,
      academicLoad: '15 Módulos (2 semanas c/u)',
      evaluationsDetail: '+60 Test de proceso, 2 Ensayos Generales',
      subjects: JSON.stringify([
        'Lengua Castellana y Comunicación',
        'Matemática',
        'Ciencias Naturales',
        'Estudios Sociales'
      ]),
      description: 'Plan completo para 7° y 8° básico.',
      category: 'Jóvenes',
      linkText: null,
      isActive: true,
      sortOrder: 1,
      type: 'full' as const,
    },
    {
      id: 'plan_media_i_jovenes',
      planKey: 'plan_1_2_medio',
      planName: 'Plan Media I',
      planSubtitle: '1° y 2° Medio',
      monthlyPrice: 71400,
      enrollmentPrice: 71400,
      annualTotal: 642600,
      annualTotalWithMentor: 928200,
      academicLoad: '15 Módulos (2 semanas c/u)',
      evaluationsDetail: '+60 Test de proceso, 2 Ensayos Generales',
      subjects: JSON.stringify([
        'Lengua Castellana y Comunicación',
        'Matemática',
        'Ciencias Naturales',
        'Estudios Sociales',
        'Idioma Extranjero: Inglés'
      ]),
      description: 'Plan completo para 1° y 2° medio.',
      category: 'Jóvenes',
      linkText: null,
      isActive: true,
      sortOrder: 2,
      type: 'full' as const,
    },
    {
      id: 'plan_media_ii_jovenes',
      planKey: 'plan_3_4_medio',
      planName: 'Plan Media II',
      planSubtitle: '3° y 4° Medio',
      monthlyPrice: 77350,
      enrollmentPrice: 71400,
      annualTotal: 690200,
      annualTotalWithMentor: 975800,
      academicLoad: '15 Módulos (2 semanas c/u)',
      evaluationsDetail: '+60 Test de proceso, 2 Ensayos Generales',
      subjects: JSON.stringify([
        'Lengua Castellana y Comunicación',
        'Matemática',
        'Ciencias Naturales',
        'Estudios Sociales',
        'Idioma Extranjero: Inglés',
        'Filosofía / Educación Ciudadana'
      ]),
      description: 'Plan completo para 3° y 4° medio.',
      category: 'Jóvenes',
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

  const formatCurrency = (value: number) => {
    return "$" + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const calculateAnnualTotal = () => {
    if (!selectedPlan || selectedPlanIndex === null) return 0;
    const hasMentor = mentorStates[selectedPlanIndex];
    return hasMentor ? (selectedPlan.annualTotalWithMentor || selectedPlan.annualTotal) : selectedPlan.annualTotal;
  };

  const parseSubjects = (subjectsStr: string | string[]): string[] => {
    if (Array.isArray(subjectsStr)) return subjectsStr;
    try {
      return JSON.parse(subjectsStr);
    } catch {
      return [];
    }
  };

  if (allPlans.length === 0) {
    return (
      <section className="py-12 px-4 bg-gradient-to-b from-white to-[#002147]/5">
        <div className="container mx-auto text-center">
          <p className="text-[#002147]/60">No hay planes disponibles.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="planes-jovenes" className="py-12 px-4 bg-gradient-to-b from-white to-[#002147]/5">
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
                Planes menores de 18 años
              </h2>
              <div className="flex items-center gap-3 bg-[#002147]/5 border border-[#002147]/10 rounded-lg px-6 py-3">
                <span className="text-sm font-medium text-[#002147]/70">Matrícula</span>
                <span className="text-2xl font-bold text-[#A51C30]">$60.000</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Grid - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {allPlans.map((plan, index) => {
            const colorSchemes = [
              { 
                base: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
                header: { normal: '#64748b', hover: '#bfdbfe' } // Azul pastel
              },
              { 
                base: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
                header: { normal: '#64748b', hover: '#ddd6fe' } // Púrpura pastel
              },
              { 
                base: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
                header: { normal: '#64748b', hover: '#bbf7d0' } // Verde pastel
              }
            ];
            const scheme = colorSchemes[index];
            const hasMentor = mentorStates[index];
            const currentPrice = hasMentor ? (plan.annualTotalWithMentor || plan.annualTotal) : plan.annualTotal;
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
                  minHeight: '620px', 
                  maxHeight: '620px',
                  background: scheme.base.bg,
                  borderColor: scheme.base.border
                }}
              >
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

                <div className="p-5 flex-1 flex flex-col bg-white">
                  <div className="relative overflow-hidden rounded-lg p-4 mb-4 border border-slate-300 bg-slate-50">
                    <div 
                      className="absolute top-0 left-0 right-0 h-1 bg-slate-400"
                    ></div>
                    
                    <div className="relative text-center pt-1">
                      <div className="text-xs font-semibold mb-1.5 tracking-wider uppercase text-slate-600">Marzo - Octubre</div>
                      <div className="text-3xl font-bold mb-1 text-slate-700">
                        {formatCurrency(currentPrice || 0)}
                      </div>
                      <div className="text-xs text-slate-600">8 meses de formación</div>
                      <div className="text-xs text-slate-500 mt-1">* Incluye IVA</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMentor(index);
                      }}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                        hasMentor
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        hasMentor ? 'bg-green-500 border-green-500' : 'border-slate-400'
                      }`}>
                        {hasMentor && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium">
                        {hasMentor ? 'Con Mentor' : 'Agregar Mentor'}
                      </span>
                    </button>
                  </div>

                  <div className="space-y-3 mb-4 flex-1">
                    <div className="rounded-lg p-3 border border-slate-200 bg-slate-50">
                      <h5 className="font-semibold text-xs mb-1.5 uppercase tracking-wide text-slate-700">Estructura</h5>
                      <div className="text-xs space-y-1 text-slate-600">
                        <p>• {plan.academicLoad}</p>
                        <p>• {plan.evaluationsDetail}</p>
                      </div>
                    </div>

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

        {/* Summary Section */}
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
                      {mentorStates[selectedPlanIndex!] && (
                        <p className="text-sm text-green-600 font-medium mt-1">✓ Con Mentor</p>
                      )}
                    </div>
                  </div>

                  <div className="relative overflow-hidden bg-gradient-to-br from-[#002147] to-[#003366] rounded-lg p-6 text-white border border-[#A51C30]/20">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#A51C30] to-[#8B1725]"></div>
                    
                    <div className="relative pt-2">
                      <div className="text-center mb-3">
                        <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-white/80">Marzo - Octubre</div>
                        <div className="text-4xl font-bold text-white">
                          {formatCurrency(calculateAnnualTotal())}
                        </div>
                        <div className="text-xs mt-2 text-white/70">8 meses de formación integral</div>
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
