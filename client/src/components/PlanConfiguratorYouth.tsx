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

  // Define the 3 youth plans
  const allPlans: ExtendedPlan[] = [
    {
      id: 'plan_basica_jovenes',
      planKey: 'plan_7_8_basico',
      planName: 'Plan Básica',
      planSubtitle: '7° y 8° Básico',
      monthlyPrice: 55000,
      enrollmentPrice: 60000,
      annualTotal: 500000,
      annualTotalWithMentor: 740000,
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
      monthlyPrice: 60000,
      enrollmentPrice: 60000,
      annualTotal: 540000,
      annualTotalWithMentor: 780000,
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
      monthlyPrice: 65000,
      enrollmentPrice: 60000,
      annualTotal: 580000,
      annualTotalWithMentor: 820000,
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
                hover: { from: '#3b82f6', to: '#8b5cf6', border: '#3b82f6', shadow: '#3b82f620' }
              },
              { 
                base: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
                hover: { from: '#6366f1', to: '#8b5cf6', border: '#6366f1', shadow: '#6366f120' }
              },
              { 
                base: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
                hover: { from: '#2563eb', to: '#7c3aed', border: '#2563eb', shadow: '#2563eb20' }
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
                className={`border-2 shadow-2xl overflow-hidden transition-all duration-500 cursor-pointer flex flex-col group ${
                  isSelected 
                    ? 'ring-4 ring-opacity-20 scale-105' 
                    : 'hover:shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:scale-[1.02]'
                }`}
                onClick={() => selectPlan(index)}
                style={{ 
                  minHeight: '620px', 
                  maxHeight: '620px',
                  background: isSelected ? `linear-gradient(135deg, ${scheme.hover.from} 0%, ${scheme.hover.to} 100%)` : scheme.base.bg,
                  borderColor: isSelected ? scheme.hover.border : scheme.base.border,
                  boxShadow: isSelected ? `0 0 0 4px ${scheme.hover.shadow}, 0 10px 30px ${scheme.hover.shadow}` : undefined
                }}
              >
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

                <div className="p-5 flex-1 flex flex-col">
                  <div className={`relative overflow-hidden rounded-lg p-4 mb-4 border transition-all duration-500 ${isSelected ? 'border-white/20 bg-white/10' : 'border-slate-300 bg-white group-hover:border-blue-300'}`}>
                    <div 
                      className="absolute top-0 left-0 right-0 h-1 transition-all duration-500"
                      style={{
                        background: isSelected ? `linear-gradient(to right, ${scheme.hover.from}, ${scheme.hover.to})` : 'linear-gradient(to right, #64748b, #475569)'
                      }}
                    ></div>
                    
                    <div className="relative text-center pt-1">
                      <div className={`text-xs font-semibold mb-1.5 tracking-wider uppercase transition-colors duration-500 ${isSelected ? 'text-white/80' : 'text-slate-600 group-hover:text-blue-600'}`}>Marzo - Octubre</div>
                      <div className={`text-3xl font-bold mb-1 transition-colors duration-500`} style={{ color: isSelected ? '#ffffff' : scheme.base.text }}>
                        {formatCurrency(currentPrice || 0)}
                      </div>
                      <div className={`text-xs transition-colors duration-500 ${isSelected ? 'text-white/70' : 'text-slate-600 group-hover:text-blue-500'}`}>8 meses de formación</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMentor(index);
                      }}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all duration-500 ${
                        hasMentor
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : isSelected 
                            ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 group-hover:border-blue-400'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        hasMentor ? 'bg-green-500 border-green-500' : isSelected ? 'border-white/50' : 'border-slate-400'
                      }`}>
                        {hasMentor && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium">
                        {hasMentor ? 'Con Mentor' : 'Agregar Mentor'}
                      </span>
                    </button>
                  </div>

                  <div className="space-y-3 mb-4 flex-1">
                    <div className={`rounded-lg p-3 border transition-all duration-500 ${isSelected ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200'}`}>
                      <h5 className={`font-semibold text-xs mb-1.5 uppercase tracking-wide transition-colors duration-500 ${isSelected ? 'text-white' : 'text-slate-700 group-hover:text-blue-700'}`}>Estructura</h5>
                      <div className={`text-xs space-y-1 transition-colors duration-500 ${isSelected ? 'text-white/80' : 'text-slate-600 group-hover:text-blue-600'}`}>
                        <p>• {plan.academicLoad}</p>
                        <p>• {plan.evaluationsDetail}</p>
                      </div>
                    </div>

                    <div 
                      className={`rounded-lg p-3 border transition-all duration-500 ${isSelected ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200'}`}
                    >
                      <h5 className={`font-semibold text-xs mb-1.5 uppercase tracking-wide transition-colors duration-500 ${isSelected ? 'text-white' : 'text-slate-700 group-hover:text-blue-700'}`}>Asignaturas</h5>
                      <div className="grid grid-cols-1 gap-1">
                        {parseSubjects(plan.subjects).map((subject, idx) => (
                          <div key={idx} className={`flex items-center gap-2 text-xs transition-colors duration-500 ${isSelected ? 'text-white/80' : 'text-slate-600 group-hover:text-blue-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-500`} style={{ backgroundColor: isSelected ? '#ffffff' : scheme.base.text }}></span>
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
                    }}
                    className={`w-full font-semibold transition-all duration-500 text-sm py-3 text-white shadow-md hover:shadow-lg ${
                      isSelected
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-slate-600 hover:bg-blue-600 group-hover:bg-blue-500'
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
