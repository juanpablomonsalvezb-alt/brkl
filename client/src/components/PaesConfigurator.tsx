import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Sparkles, Brain, GraduationCap } from "lucide-react";

interface PaesSubject {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  sortOrder: number;
  isActive: boolean;
}

export default function PaesConfigurator() {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [includeTutor, setIncludeTutor] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  // Precio del tutor por materia (configurable) - incluye matrícula e IVA
  const TUTOR_PRICE_PER_SUBJECT = 59500; // (50.000 + matrícula ya incluida) * 1.19
  const MATRICULA = 50000;

  // Fetch materias PAES
  const { data: subjects, isLoading } = useQuery<PaesSubject[]>({
    queryKey: ['/api/paes/subjects'],
  });

  // Calcular precio total (incluye matrícula $50.000 por materia + IVA 19%)
  useEffect(() => {
    if (!subjects) return;

    const selectedSubjectsData = subjects.filter(s => selectedSubjects.includes(s.id));
    // Cada materia incluye matrícula de $50.000 + IVA 19%
    const baseTotal = selectedSubjectsData.reduce((sum, s) => sum + Math.round((s.basePrice + MATRICULA) * 1.19), 0);
    const tutorTotal = includeTutor ? selectedSubjects.length * TUTOR_PRICE_PER_SUBJECT : 0;
    
    setTotalPrice(baseTotal + tutorTotal);
  }, [selectedSubjects, includeTutor, subjects]);

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleInscription = () => {
    // TODO: Abrir modal de inscripción con datos seleccionados
    console.log({
      selectedSubjects,
      includeTutor,
      totalPrice
    });
    alert("Modal de inscripción próximamente!");
  };

  const isSelected = (subjectId: string) => selectedSubjects.includes(subjectId);

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  if (isLoading) {
    return (
      <div className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 text-center">
          <div className="text-lg text-muted-foreground">Cargando materias PAES...</div>
        </div>
      </div>
    );
  }

  if (!subjects || subjects.length === 0) {
    return null; // No mostrar nada si no hay materias configuradas
  }

  return (
    <section className="py-8 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <div className="space-y-4">
            <div>
              <h2 className="text-5xl md:text-6xl font-bold text-[#002147] mb-3 tracking-tight">
                PAES
              </h2>
              <p className="text-lg text-[#002147]/70 max-w-2xl mx-auto">
                Selecciona las materias que necesitas • Incluye IA + Ensayos
              </p>
            </div>
          </div>
        </motion.div>

        {/* Two Module Layout - Horizontal */}
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          
          {/* MODULE 1: Subject Selection (Left) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="h-[480px]"
          >
            <Card className="border-2 border-[#002147]/10 shadow-lg h-full">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-[#002147] mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Asignaturas
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {subjects?.map((subject, index) => (
                    <motion.button
                      key={subject.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSubjectToggle(subject.id)}
                      className={`
                        p-4 rounded-xl border-2 transition-all duration-300 text-left flex items-center justify-between group
                        ${isSelected(subject.id)
                          ? 'border-blue-300 bg-blue-100 shadow-md scale-[1.02]'
                          : 'border-slate-300 bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 hover:border-pink-200'
                        }
                      `}
                    >
                      <span className={`font-bold text-base transition-colors duration-300 ${isSelected(subject.id) ? 'text-slate-800' : 'text-slate-700'}`}>
                        {subject.name}
                      </span>
                      <div className={`
                        w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300
                        ${isSelected(subject.id)
                          ? 'border-blue-500 bg-blue-500 scale-110'
                          : 'border-slate-400 group-hover:border-pink-400'
                        }
                      `}>
                        {isSelected(subject.id) && (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* MODULE 2: Values & Summary (Right) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="h-[480px]"
          >
            <Card className="border-2 border-[#002147]/20 shadow-xl bg-gradient-to-br from-white to-gray-50/30 h-full">
              <CardContent className="p-6 flex flex-col h-full gap-0">
                {/* Header */}
                <div className="pb-4 border-b-2 border-[#002147]/10 flex-shrink-0">
                  <h3 className="text-xl font-bold text-[#002147] mb-2">Tu Plan PAES</h3>
                  
                  {/* Descripción del programa */}
                  <div className="bg-[#002147]/5 rounded-lg p-3 border border-[#002147]/10">
                    <div className="space-y-1 text-xs text-[#002147]/70">
                      <p className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#A51C30] rounded-full"></span>
                        <span className="font-semibold">Plataforma + IA</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#A51C30] rounded-full"></span>
                        <span>32 semanas</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#A51C30] rounded-full"></span>
                        <span>32 evaluaciones de proceso</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#A51C30] rounded-full"></span>
                        <span>2 ensayos generales</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content Area - Fixed Height */}
                <div className="flex-1 overflow-y-auto min-h-0 py-2">
                  {selectedSubjects.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-[#002147]/5 flex items-center justify-center mx-auto mb-4">
                        <GraduationCap className="w-8 h-8 text-[#002147]/30" />
                      </div>
                      <p className="text-sm text-[#002147]/60 font-medium">
                        Selecciona las asignaturas que necesitas
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 py-2">
                      {/* Selected Subjects with Prices */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-[#002147]/70 mb-3">Asignaturas seleccionadas:</p>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                          {subjects
                            ?.filter(s => selectedSubjects.includes(s.id))
                            .map((subject, index) => (
                              <motion.div
                                key={subject.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex justify-between items-center bg-gradient-to-r from-[#002147]/5 to-transparent rounded-lg px-4 py-3 border border-[#002147]/10"
                              >
                                <span className="font-bold text-sm text-[#002147]">{subject.name}</span>
                                <span className="text-sm font-semibold text-[#002147]">${formatPrice(Math.round((subject.basePrice + 50000) * 1.19))}</span>
                              </motion.div>
                            ))}
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="flex justify-between items-center pt-3 border-t border-[#002147]/10">
                        <span className="text-sm font-medium text-[#002147]/70">Subtotal</span>
                        <span className="text-lg font-bold text-[#002147]">
                          ${formatPrice(selectedSubjects.reduce((sum, id) => {
                            const subject = subjects?.find(s => s.id === id);
                            return sum + Math.round(((subject?.basePrice || 0) + 50000) * 1.19);
                          }, 0))}
                        </span>
                      </div>

                      {/* Tutor Toggle */}
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setIncludeTutor(!includeTutor)}
                        className="cursor-pointer p-4 rounded-xl border-2 border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/10 to-white hover:border-[#D4AF37]/60 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-[#D4AF37]" />
                            <span className="font-bold text-sm text-[#002147]">Tutor Personal</span>
                          </div>
                          <motion.div
                            animate={{ scale: includeTutor ? [1, 1.2, 1] : 1 }}
                            transition={{ duration: 0.3 }}
                            className={`
                              w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all
                              ${includeTutor ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-[#002147]/30 bg-white'}
                            `}
                          >
                            {includeTutor && <CheckCircle2 className="w-5 h-5 text-white" />}
                          </motion.div>
                        </div>
                        <div className="text-xs font-semibold text-[#D4AF37]">
                          +${formatPrice(TUTOR_PRICE_PER_SUBJECT)} por materia
                        </div>
                        {includeTutor && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-3 pt-3 border-t border-[#D4AF37]/20 flex justify-between items-center"
                          >
                            <span className="text-xs text-[#002147]/70">Total tutor:</span>
                            <span className="text-sm font-bold text-[#D4AF37]">
                              +${formatPrice(TUTOR_PRICE_PER_SUBJECT * selectedSubjects.length)}
                            </span>
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                  )}
                </div>

                {/* Fixed Bottom Section */}
                <div className="space-y-4 flex-shrink-0 mt-auto pt-4">
                  {/* Total Section */}
                  {selectedSubjects.length > 0 && (
                    <div className="border-t-2 border-[#002147]/20 pt-4">
                      <div className="bg-gradient-to-br from-[#002147]/10 to-[#002147]/5 rounded-2xl p-5 shadow-inner">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-[#002147]">Marzo - Octubre</span>
                          <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                        </div>
                        <motion.div
                          key={totalPrice}
                          initial={{ scale: 1.2, color: "#10b981" }}
                          animate={{ scale: 1, color: "#002147" }}
                          transition={{ duration: 0.3 }}
                          className="text-5xl font-bold text-right"
                        >
                          ${formatPrice(totalPrice)}
                        </motion.div>
                        <div className="text-right text-xs text-[#002147]/60 font-medium mt-1">8 meses de preparación</div>
                        <div className="text-right text-xs text-[#002147]/50 font-medium">* Incluye matrícula, incluye I.V.A.</div>
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleInscription}
                      disabled={selectedSubjects.length === 0}
                      className="w-full bg-gradient-to-r from-[#a51c30] via-[#8a1828] to-[#a51c30] hover:from-[#8a1828] hover:via-[#6d1420] hover:to-[#8a1828] text-white py-6 text-lg font-bold shadow-xl disabled:opacity-40 transition-all duration-300 rounded-xl"
                    >
                      {selectedSubjects.length === 0 ? 'Selecciona asignaturas' : '🎓 Inscribirse Ahora'}
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
