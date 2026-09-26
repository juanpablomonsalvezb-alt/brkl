import { useState } from "react";
import { Check, Sparkles, BookOpen, Users, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePageMeta } from "@/lib/usePageMeta";

// Tipos
interface Plan {
  id: string;
  name: string;
  icon: React.ReactNode;
  subjects: string[];
  modules: number;
  evaluations: number;
  essays: number;
  sessions?: number;
  monthlyPrice: number;
  annualPrice: number;
  isPopular?: boolean;
  description: string;
}

const levels = [
  { id: "7b", name: "7° Básico" },
  { id: "8b", name: "8° Básico" },
  { id: "1m", name: "1° Medio" },
  { id: "2m", name: "2° Medio" },
  { id: "3m", name: "3° Medio" },
  { id: "4m", name: "4° Medio" },
];

const plansData: Record<string, Plan[]> = {
  "7b": [
    {
      id: "full-7b",
      name: "Plan Full",
      icon: <Crown className="w-6 h-6" />,
      subjects: ["Lenguaje", "Matemática", "Ciencias Naturales", "Historia y Geografía", "Inglés"],
      modules: 15,
      evaluations: 60,
      essays: 2,
      sessions: 2,
      monthlyPrice: 115000,
      annualPrice: 920000,
      isPopular: true,
      description: "Programa completo con tutorías personalizadas mensuales"
    },
    {
      id: "standard-7b",
      name: "Plan Estándar",
      icon: <BookOpen className="w-6 h-6" />,
      subjects: ["Lenguaje", "Matemática", "Ciencias Naturales", "Historia y Geografía", "Inglés"],
      modules: 15,
      evaluations: 60,
      essays: 2,
      monthlyPrice: 95000,
      annualPrice: 760000,
      description: "Acceso completo a la plataforma y contenidos"
    },
    {
      id: "tutor-7b",
      name: "Solo Tutor",
      icon: <Users className="w-6 h-6" />,
      subjects: ["Lenguaje", "Matemática", "Ciencias Naturales", "Historia y Geografía", "Inglés"],
      modules: 15,
      evaluations: 60,
      essays: 2,
      sessions: 2,
      monthlyPrice: 75000,
      annualPrice: 600000,
      description: "Tutorías personalizadas sin acceso a plataforma"
    }
  ],
  // Aquí irían los demás niveles con sus planes
};

export default function PlanSelector2026() {
  // Precios de una estructura de planes anterior: fuera del índice para que
  // buscadores e IA no citen montos que ya no aplican.
  usePageMeta({ title: "Planes académicos 2026 | Barkley Online", noindex: true });
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const currentPlans = selectedLevel ? plansData[selectedLevel] || [] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header Minimalista */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <h1 className="text-4xl font-light text-slate-900 tracking-tight">
            Planes Académicos <span className="font-semibold">2026</span>
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Selecciona tu nivel y descubre el plan perfecto para tu éxito académico
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 space-y-16">
        
        {/* SEGMENTO 1: Selección de Curso */}
        <section>
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">
              Paso 1
            </h2>
            <p className="text-2xl font-light text-slate-800">
              Selecciona tu nivel académico
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {levels.map((level) => (
              <button
                key={level.id}
                onClick={() => {
                  setSelectedLevel(level.id);
                  setSelectedPlan(null);
                }}
                className={`
                  px-8 py-4 rounded-full text-base font-medium transition-all duration-300
                  ${selectedLevel === level.id
                    ? "bg-slate-900 text-white shadow-lg scale-105"
                    : "bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-400"
                  }
                `}
              >
                {level.name}
              </button>
            ))}
          </div>
        </section>

        {/* SEGMENTO 2: Selección de Plan */}
        {selectedLevel && (
          <section className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">
                Paso 2
              </h2>
              <p className="text-2xl font-light text-slate-800">
                Elige el plan que se ajuste a tus necesidades
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {currentPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`
                    relative p-8 rounded-2xl text-left transition-all duration-300
                    ${selectedPlan?.id === plan.id
                      ? "bg-slate-900 text-white shadow-2xl scale-105"
                      : "bg-white text-slate-900 border-2 border-slate-200 hover:border-slate-400 hover:shadow-lg"
                    }
                  `}
                >
                  {plan.isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white border-0">
                      Más Elegido
                    </Badge>
                  )}
                  
                  <div className={`mb-4 ${selectedPlan?.id === plan.id ? "text-white" : "text-slate-700"}`}>
                    {plan.icon}
                  </div>
                  
                  <h3 className="text-2xl font-semibold mb-2">
                    {plan.name}
                  </h3>
                  
                  <p className={`text-sm ${selectedPlan?.id === plan.id ? "text-slate-300" : "text-slate-600"}`}>
                    {plan.description}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* SEGMENTO 3: Descripción Dinámica */}
        {selectedPlan && (
          <section className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">
                Paso 3
              </h2>
              <p className="text-2xl font-light text-slate-800">
                Detalles de tu plan seleccionado
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-slate-200 p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-slate-700">
                  {selectedPlan.icon}
                </div>
                <h3 className="text-3xl font-semibold text-slate-900">
                  {selectedPlan.name}
                </h3>
              </div>

              {/* Asignaturas */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                  Asignaturas Incluidas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedPlan.subjects.map((subject, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600 shrink-0" />
                      <span className="text-slate-700">{subject}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carga Académica */}
              <div className="bg-slate-50 rounded-xl p-6 mb-8">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                  Carga Académica
                </h4>
                <div className="space-y-2 text-slate-700">
                  <p><strong>{selectedPlan.modules}</strong> Módulos Quincenales</p>
                  <p><strong>{selectedPlan.evaluations}</strong> Evaluaciones Anuales</p>
                  <p><strong>{selectedPlan.essays}</strong> Ensayos Mineduc</p>
                  {selectedPlan.sessions && (
                    <p className="text-amber-700 font-medium">
                      <strong>{selectedPlan.sessions}</strong> Sesiones Personalizadas al mes (Vía Online)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SEGMENTO 4: Valor y Acción */}
        {selectedPlan && (
          <section className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">
                Paso 4
              </h2>
              <p className="text-2xl font-light text-slate-800">
                Inversión en tu educación
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-10 text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex-1">
                  <p className="text-slate-300 text-sm uppercase tracking-wider mb-2">
                    Cuota Mensual
                  </p>
                  <p className="text-5xl font-bold mb-4">
                    ${selectedPlan.monthlyPrice.toLocaleString('es-CL')}
                  </p>
                  <p className="text-slate-400 text-sm">
                    Valor anual: <span className="font-semibold">${selectedPlan.annualPrice.toLocaleString('es-CL')}</span>
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    (8 cuotas de marzo a octubre)
                  </p>
                </div>

                <Button 
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-12 py-6 h-auto font-semibold shadow-xl"
                >
                  Reservar mi Cupo 2026
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
