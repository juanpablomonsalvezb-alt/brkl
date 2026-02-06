import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Sparkles, Brain, GraduationCap, Check } from "lucide-react";
import { ReservationDialog } from "@/components/ReservationDialog";

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
  const [isReservationOpen, setIsReservationOpen] = useState(false);

  // Precio del tutor por materia (configurable) - precio base + IVA 19%
  const TUTOR_PRICE_PER_SUBJECT = 59500; // 50.000 * 1.19

  // Fetch materias PAES
  const { data: subjects, isLoading } = useQuery<PaesSubject[]>({
    queryKey: ['/api/paes/subjects'],
  });

  // Calcular precio total (los precios ya incluyen IVA)
  useEffect(() => {
    if (!subjects) return;

    const selectedSubjectsData = subjects.filter(s => selectedSubjects.includes(s.id));
    // Los precios base ya incluyen IVA, solo sumar
    const baseTotal = selectedSubjectsData.reduce((sum, s) => sum + s.basePrice, 0);
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
    // Abrir el modal de inscripción
    console.log("🔔 Botón de inscripción clickeado - abriendo modal");
    console.log("Estado actual:", { selectedSubjects, includeTutor, totalPrice });
    setIsReservationOpen(true);
    console.log("isReservationOpen cambiado a true");
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
    <section className="py-16 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-block mb-4">
            <Badge className="bg-[#A51C30] text-white px-6 py-2 text-sm font-bold">
              PREPARACIÓN PAES 2026
            </Badge>
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-[#002147] mb-4 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Planes PAES
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Selecciona las materias que necesitas • Precio por asignatura
          </p>
        </motion.div>

        {/* Two Module Layout - Horizontal - MANTENER FUNCIONALIDAD ORIGINAL */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* MODULE 1: Subject Selection (Left) - CON DISEÑO PREMIUM */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <Card className="relative overflow-hidden border-2 border-gray-200 shadow-xl bg-white">
              {/* Harvard Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#A51C30]"></div>
              
              <CardContent className="p-5">
                {/* Header con ícono */}
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#002147] to-[#001a35] flex items-center justify-center border-2 border-[#002147] shadow-lg">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="text-center mb-4 border-b border-gray-100 pb-3">
                  <h3 className="text-xl font-black text-[#002147] tracking-tight mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                    Asignaturas PAES
                  </h3>
                  <p className="text-xs text-gray-600">
                    Selecciona las que necesites
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
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
                        p-3 rounded-lg border-2 transition-all duration-300 text-left flex items-center justify-between group
                        ${isSelected(subject.id)
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-300 bg-white hover:bg-gray-50 hover:border-[#002147]'
                        }
                      `}
                    >
                      <div className="flex-1">
                        <span className={`font-bold text-sm block ${isSelected(subject.id) ? 'text-[#002147]' : 'text-gray-700'}`}>
                          {subject.name}
                        </span>
                        <span className="text-xs font-semibold text-[#002147]">
                          ${formatPrice(subject.basePrice)}
                        </span>
                      </div>
                      <div className={`
                        w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300
                        ${isSelected(subject.id)
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-400 group-hover:border-[#002147]'
                        }
                      `}>
                        {isSelected(subject.id) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* MODULE 2: Summary (Right) - CON DISEÑO PREMIUM */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="relative overflow-hidden border-2 border-gray-200 shadow-xl bg-gradient-to-br from-white to-gray-50">
              {/* Harvard Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#A51C30]"></div>
              
              <CardContent className="p-5">
                {/* Header con ícono */}
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#002147] to-[#001a35] flex items-center justify-center border-2 border-[#002147] shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="text-center mb-4 border-b border-gray-100 pb-3">
                  <h3 className="text-xl font-black text-[#002147] tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                    Tu Plan PAES
                  </h3>
                </div>

                {selectedSubjects.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <GraduationCap className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      Selecciona las asignaturas que necesitas
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Selected Subjects */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Asignaturas:</p>
                      {subjects
                        ?.filter(s => selectedSubjects.includes(s.id))
                        .map((subject) => (
                          <div key={subject.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-gray-200">
                            <span className="font-semibold text-sm text-[#002147]">{subject.name}</span>
                            <span className="font-bold text-sm text-[#002147]">${formatPrice(subject.basePrice)}</span>
                          </div>
                        ))}
                    </div>

                    {/* Total Section - Estilo Premium */}
                    <div className="bg-gradient-to-br from-[#002147] to-[#001a35] rounded-xl p-4 text-white">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold">Marzo - Octubre 2026</span>
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div className="text-4xl font-black mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                        ${formatPrice(totalPrice)}
                      </div>
                      <p className="text-xs text-white/70">IVA incluido</p>
                    </div>

                    {/* CTA Button */}
                    <Button
                      onClick={handleInscription}
                      className="w-full bg-[#A51C30] hover:bg-[#8B1725] text-white py-3 text-sm font-bold uppercase tracking-wider shadow-xl transition-all duration-300 rounded-xl"
                    >
                      Solicitar Inscripción
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Reservation Dialog */}
      <ReservationDialog 
        open={isReservationOpen}
        onOpenChange={setIsReservationOpen}
      />
    </section>
  );
}
