import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronRight, Sparkles, ChevronLeft, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";

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

type YouthPlan = PlanConfiguration & { type: 'youth' };
type AdultPlan = Omit<PlanConfiguration, 'planSubtitle' | 'category' | 'linkText' | 'isActive' | 'sortOrder'> & { type: 'adult' };
type CombinedPlan = YouthPlan | AdultPlan;

interface SelectedPlan {
  basePlan: CombinedPlan | null;
  hasTeacher: boolean;
  extras: string[];
}

export function PlanConfigurator() {
  const [step, setStep] = useState(1);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>({
    basePlan: null,
    hasTeacher: false,
    extras: [],
  });
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);
  const [direction, setDirection] = useState(0); // For animation direction

  // Fetch plans from API
  const { data: youthPlans = [] } = useQuery<PlanConfiguration[]>({
    queryKey: ["/api/plans"],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch adult cycles
  const { data: adultCycles = [] } = useQuery<any[]>({
    queryKey: ["/api/adult-cycles"],
    staleTime: 5 * 60 * 1000,
  });

  // Combine all plans
  const allPlans = [
    ...youthPlans.map(p => ({ ...p, type: 'youth' as const })),
    ...adultCycles.map(c => ({
      id: c.id,
      planKey: c.cycleKey,
      planName: c.cycleName,
      monthlyPrice: c.monthlyPrice,
      enrollmentPrice: c.enrollmentPrice,
      annualTotal: c.totalPrice,
      academicLoad: c.academicLoad,
      evaluationsDetail: `${c.modulesCount} Módulos, ${c.quizzesTotal} Quizzes, ${c.essaysCount} Ensayos`,
      subjects: c.mediaDS257 || '[]',
      description: `Programa para adultos con duración de ${c.durationMonths} meses`,
      type: 'adult' as const,
    }))
  ];

  // Calculate final price
  const calculateTotal = () => {
    if (!selectedPlan.basePlan) return 0;
    
    let total = selectedPlan.basePlan.monthlyPrice;
    
    // Add teacher cost (example: +40.000)
    if (selectedPlan.hasTeacher) {
      total += 40000;
    }
    
    return total;
  };

  const calculateAnnualTotal = () => {
    const monthly = calculateTotal();
    const enrollment = selectedPlan.basePlan?.enrollmentPrice || 0;
    return (monthly * 8) + enrollment;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const parseSubjects = (subjectsStr: string): string[] => {
    try {
      return JSON.parse(subjectsStr);
    } catch {
      return [];
    }
  };

  // Type guard to check if plan is youth plan
  const isYouthPlan = (plan: CombinedPlan): plan is YouthPlan => {
    return plan.type === 'youth';
  };

  // Navigation functions for carousel
  const goToNextPlan = () => {
    setDirection(1);
    setCurrentPlanIndex((prev) => (prev + 1) % allPlans.length);
  };

  const goToPreviousPlan = () => {
    setDirection(-1);
    setCurrentPlanIndex((prev) => (prev - 1 + allPlans.length) % allPlans.length);
  };

  const currentPlan = allPlans[currentPlanIndex];

  // Select current plan
  const selectCurrentPlan = () => {
    setSelectedPlan(prev => ({ ...prev, basePlan: currentPlan }));
    setStep(2);
  };

  // Framer Motion variants for smooth transitions
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Header - Compact */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#002147] mb-2">
            Configura tu Plan
          </h2>
          <p className="text-[#002147]/60">
            Elige y personaliza en 3 pasos simples
          </p>
        </div>

        {/* Horizontal 3-Step Layout - Same Height */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* STEP 1: Carousel Plan Selector */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-4"
            >
              <Card className="border-2 border-[#002147]/30 overflow-hidden shadow-xl" style={{ height: '600px' }}>
                {/* Header - Better Contrast */}
                <div className="p-5 bg-gradient-to-r from-[#002147] to-[#003d7a] text-white flex items-center justify-between border-b-4 border-[#D4AF37]">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg transition-all duration-300 ${
                      selectedPlan.basePlan 
                        ? 'bg-[#D4AF37] text-[#002147] scale-110' 
                        : 'bg-white/20 text-white'
                    }`}>
                      {selectedPlan.basePlan ? <Check className="w-5 h-5" /> : '1'}
                    </div>
                    <h3 className="text-xl font-bold tracking-wide">Elige tu Plan</h3>
                  </div>
                  {selectedPlan.basePlan && (
                    <Badge className="bg-[#D4AF37] text-[#002147] font-bold">
                      Seleccionado
                    </Badge>
                  )}
                </div>

                {/* Carousel Content */}
                <div className="relative p-8 flex flex-col justify-between" style={{ height: 'calc(600px - 85px)' }}>
                  {allPlans.length > 0 && currentPlan && (
                    <>
                      {/* Plan Card with Animation */}
                      <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                          key={currentPlanIndex}
                          custom={direction}
                          variants={slideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.3 }
                          }}
                          className="flex-1 flex flex-col justify-between"
                        >
                          {/* Plan Content */}
                          <div className="space-y-4">
                            {/* Category Badge */}
                            {isYouthPlan(currentPlan) && currentPlan.category && (
                              <div className="flex justify-center">
                                <Badge className="bg-[#D4AF37]/20 text-[#002147] border border-[#D4AF37]">
                                  {currentPlan.category}
                                </Badge>
                              </div>
                            )}

                            {/* Plan Title */}
                            <div className="text-center">
                              <h4 className="text-2xl font-bold text-[#002147] mb-1">
                                {currentPlan.planName}
                              </h4>
                              {isYouthPlan(currentPlan) && currentPlan.planSubtitle && (
                                <p className="text-sm text-[#002147]/60">
                                  {currentPlan.planSubtitle}
                                </p>
                              )}
                            </div>

                            {/* Price Display */}
                            <div className="bg-gradient-to-br from-[#002147]/5 to-[#D4AF37]/10 rounded-xl p-6 text-center">
                              <div className="mb-3">
                                <span className="text-4xl font-bold text-[#002147]">
                                  {formatCurrency(currentPlan.monthlyPrice)}
                                </span>
                                <span className="text-sm text-[#002147]/60 ml-2">/mes</span>
                              </div>
                              <div className="text-sm text-[#002147]/70">
                                Matrícula: <span className="font-bold">{formatCurrency(currentPlan.enrollmentPrice)}</span>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-[#002147]/70 text-center leading-relaxed">
                              {currentPlan.description}
                            </p>

                            {/* Collapsible Details */}
                            <Collapsible
                              open={expandedDetails === currentPlan.id}
                              onOpenChange={(open) => setExpandedDetails(open ? currentPlan.id : null)}
                            >
                              <CollapsibleTrigger className="w-full">
                                <button className="flex items-center justify-center gap-2 text-sm text-[#002147] hover:text-[#002147]/70 w-full py-2 border-t border-[#002147]/10">
                                  <span>Ver detalles completos</span>
                                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedDetails === currentPlan.id ? 'rotate-180' : ''}`} />
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="mt-3 p-4 bg-[#002147]/5 rounded-lg text-sm space-y-3">
                                  {currentPlan.academicLoad && (
                                    <div className="flex items-start gap-2">
                                      <Check className="w-4 h-4 text-[#002147] mt-0.5 shrink-0" />
                                      <span className="text-[#002147]/80">{currentPlan.academicLoad}</span>
                                    </div>
                                  )}
                                  {currentPlan.evaluationsDetail && (
                                    <div className="flex items-start gap-2">
                                      <Check className="w-4 h-4 text-[#002147] mt-0.5 shrink-0" />
                                      <span className="text-[#002147]/80">{currentPlan.evaluationsDetail}</span>
                                    </div>
                                  )}
                                  <div className="pt-2 border-t border-[#002147]/10">
                                    <p className="text-xs text-[#002147]/60 font-semibold mb-2">Asignaturas:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {parseSubjects(currentPlan.subjects).map((subject, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs border-[#002147]/30">
                                          {subject}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>

                          {/* Select Button */}
                          <div className="space-y-3">
                            <Button
                              onClick={selectCurrentPlan}
                              className={`w-full py-6 text-base font-bold transition-all duration-300 ${
                                selectedPlan.basePlan?.id === currentPlan.id
                                  ? 'bg-[#D4AF37] text-[#002147] hover:bg-[#C5A028]'
                                  : 'bg-[#002147] text-white hover:bg-[#003366]'
                              }`}
                            >
                              {selectedPlan.basePlan?.id === currentPlan.id ? (
                                <>
                                  <Check className="w-5 h-5 mr-2" />
                                  Plan Seleccionado
                                </>
                              ) : (
                                'Seleccionar este Plan'
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      {/* Carousel Navigation */}
                      <div className="flex items-center justify-between gap-4 mt-4">
                        <Button
                          onClick={goToPreviousPlan}
                          variant="outline"
                          size="sm"
                          className="border-[#002147] text-[#002147] hover:bg-[#002147] hover:text-white"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Anterior
                        </Button>

                        <div className="flex gap-2">
                          {allPlans.map((_, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setDirection(idx > currentPlanIndex ? 1 : -1);
                                setCurrentPlanIndex(idx);
                              }}
                              className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                                idx === currentPlanIndex
                                  ? 'w-8 bg-[#002147]'
                                  : 'w-2 bg-[#002147]/20 hover:bg-[#002147]/40'
                              }`}
                            />
                          ))}
                        </div>

                        <Button
                          onClick={goToNextPlan}
                          variant="outline"
                          size="sm"
                          className="border-[#002147] text-[#002147] hover:bg-[#002147] hover:text-white"
                        >
                          Siguiente
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* STEP 2: Add Options */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: selectedPlan.basePlan ? 1 : 0.5,
                x: 0 
              }}
              className="lg:col-span-4"
            >
              <Card className={`border-2 overflow-hidden transition-all ${
                selectedPlan.basePlan 
                  ? 'border-[#002147]/20' 
                  : 'border-[#002147]/10 pointer-events-none'
              }`} style={{ height: '600px' }}>
                {/* Header Inside Card */}
                <div className={`p-4 flex items-center gap-3 border-b ${
                  selectedPlan.basePlan ? 'bg-[#002147] text-white' : 'bg-[#002147]/20 text-[#002147]/40'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
                    step >= 2 ? 'bg-white text-[#002147]' : 'bg-white/20'
                  }`}>
                    {step >= 2 ? <Check className="w-4 h-4" /> : '2'}
                  </div>
                  <h3 className="text-lg font-bold">Opciones</h3>
                </div>

                {/* Content Area */}
                <div className="p-4" style={{ height: 'calc(600px - 65px)' }}>
                  {!selectedPlan.basePlan ? (
                    <div className="flex items-center justify-center h-full text-[#002147]/30">
                      <p className="text-sm">Primero selecciona un plan base</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                    {/* Teacher Option */}
                    <button
                      onClick={() => {
                        setSelectedPlan(prev => ({ ...prev, hasTeacher: !prev.hasTeacher }));
                        setStep(3);
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedPlan.hasTeacher
                          ? 'border-[#002147] bg-[#002147]/5'
                          : 'border-[#002147]/10 hover:border-[#002147]/30 hover:bg-[002147]/5'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                            selectedPlan.hasTeacher
                              ? 'border-[#002147] bg-[#002147]'
                              : 'border-[#002147]/30'
                          }`}>
                            {selectedPlan.hasTeacher && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#002147] mb-1">+ Tutor Personalizado</p>
                            <p className="text-sm text-[#002147]/60">Sesiones individuales para resolver dudas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#002147]">+$40.000</p>
                          <p className="text-xs text-[#002147]/50">/mes</p>
                        </div>
                      </div>
                    </button>

                      {/* Future: Add more options here */}
                      <div className="p-4 border-2 border-dashed border-[#002147]/10 rounded-lg text-center">
                        <p className="text-sm text-[#002147]/40">Más opciones próximamente</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* STEP 3: Summary & Price */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: selectedPlan.basePlan ? 1 : 0.5,
                x: 0 
              }}
              className="lg:col-span-4"
            >
              <Card className={`border-2 overflow-hidden sticky top-6 ${
                selectedPlan.basePlan 
                  ? 'border-[#002147]/20 bg-gradient-to-br from-[#002147]/5 to-transparent' 
                  : 'border-[#002147]/10'
              }`} style={{ height: '600px' }}>
                {/* Header Inside Card */}
                <div className={`p-4 flex items-center gap-3 border-b ${
                  selectedPlan.basePlan ? 'bg-[#002147] text-white' : 'bg-[#002147]/20 text-[#002147]/40'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
                    step >= 3 ? 'bg-white text-[#002147]' : 'bg-white/20'
                  }`}>
                    {step >= 3 ? <Sparkles className="w-4 h-4" /> : '3'}
                  </div>
                  <h3 className="text-lg font-bold">Resumen</h3>
                </div>

                {/* Content Area */}
                <div className="p-6" style={{ height: 'calc(600px - 65px)', overflow: 'auto' }}>
                  {!selectedPlan.basePlan ? (
                    <div className="flex items-center justify-center h-full text-[#002147]/30">
                      <p className="text-sm text-center">Selecciona un plan<br/>para ver el resumen</p>
                    </div>
                  ) : (
                  <div className="space-y-6">
                    {/* Selected Items */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-[#002147]/10">
                        <div>
                          <p className="font-semibold text-[#002147]">{selectedPlan.basePlan.planName}</p>
                          <p className="text-xs text-[#002147]/60">Plan base</p>
                        </div>
                        <p className="font-bold text-[#002147]">{formatCurrency(selectedPlan.basePlan.monthlyPrice)}</p>
                      </div>

                      {selectedPlan.hasTeacher && (
                        <div className="flex items-center justify-between pb-3 border-b border-[#002147]/10">
                          <div>
                            <p className="font-semibold text-[#002147]">Tutor Personalizado</p>
                            <p className="text-xs text-[#002147]/60">Opción adicional</p>
                          </div>
                          <p className="font-bold text-[#002147]">+$40.000</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pb-3 border-b border-[#002147]/10">
                        <div>
                          <p className="font-semibold text-[#002147]">Matrícula</p>
                          <p className="text-xs text-[#002147]/60">Pago único</p>
                        </div>
                        <p className="font-bold text-[#002147]">{formatCurrency(selectedPlan.basePlan.enrollmentPrice)}</p>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="pt-4 border-t-2 border-[#002147]/20">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-sm text-[#002147]/60">Mensualidad Total</span>
                        <div className="text-right">
                          <span className="text-3xl font-bold text-[#002147]">{formatCurrency(calculateTotal())}</span>
                          <span className="text-sm text-[#002147]/50 ml-1">/mes</span>
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between mb-4">
                        <span className="text-sm text-[#002147]/60">Total Anual (8 meses)</span>
                        <span className="text-xl font-bold text-[#002147]">{formatCurrency(calculateAnnualTotal())}</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button 
                      className="w-full bg-[#002147] hover:bg-[#001a3a] text-white font-bold py-6 text-lg group"
                    >
                      Reservar este Plan
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>

                    <p className="text-xs text-center text-[#002147]/50">
                      Sin compromiso • Puedes cambiar más adelante
                    </p>
                  </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
