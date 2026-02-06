import { motion } from "framer-motion";
import { BookOpen, Users, Video, Award, Check, Sparkles } from "lucide-react";

const PREMIUM_FEATURES = [
  {
    category: "Contenido Académico Premium",
    icon: BookOpen,
    items: [
      "Material didáctico actualizado según currículo MINEDUC",
      "Recursos multimedia interactivos y gamificados", 
      "+ de 100 evaluaciones de proceso",
      "4 ensayos generales de preparación",
      "Acceso 24/7 desde cualquier dispositivo",
    ]
  },
  {
    category: "Acompañamiento Personalizado",
    icon: Users,
    items: [
      "Más de 64 módulos de aprendizaje",
      "Utilización de la IA ACADEMIC COPILOT",
      "Mentoría personalizada",
      "Comunicación directa con la familia",
      "Plan de estudios adaptado a tu ritmo",
    ]
  },
  {
    category: "Evaluación y Certificación",
    icon: Award,
    items: [
      "Preparación completa para exámenes libres MINEDUC",
      "Simulacros de pruebas oficiales",
      "Certificado de estudios válido nacionalmente",
      "Seguimiento personalizado del progreso",
      "Retroalimentación continua y detallada",
    ]
  }
];

export default function PremiumExperiences() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,33,71,0.03),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(165,28,48,0.03),transparent_50%)]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Premium Features Section - Revolutionary Bento Grid Design */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mb-24"
        >
          {/* Section Header with Magnetic Effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div 
              className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full bg-gradient-to-r from-[#A51C30]/10 to-[#002147]/10 border border-[#A51C30]/20"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-5 h-5 text-[#A51C30]" />
              <span className="text-sm font-bold text-[#A51C30] uppercase tracking-wider">
                Todo Incluido
              </span>
            </motion.div>
            
            <h3 className="text-5xl md:text-6xl font-black text-[#002147] mb-6 tracking-tight">
              Experiencias que se incluyen
              <span className="block text-[#A51C30] mt-2">en todos los planes</span>
            </h3>
            
            <p className="text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed">
              Una experiencia de aprendizaje integral diseñada para tu éxito
            </p>
          </motion.div>

          {/* Three Column Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PREMIUM_FEATURES.map((section, sectionIndex) => (
              <motion.div
                key={sectionIndex}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: sectionIndex * 0.2, duration: 0.6, type: "spring" }}
                className="relative group"
              >
                <motion.div
                  whileHover={{ y: -12, scale: 1.02 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 250 }}
                  className="relative h-full rounded-3xl overflow-hidden bg-white shadow-2xl shadow-gray-300/40 border border-gray-100 group-hover:shadow-3xl group-hover:shadow-[#A51C30]/30 group-hover:border-[#A51C30]/20 transition-all duration-500"
                >
                  {/* Top Accent Bar */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#A51C30] via-[#C41E3A] to-[#A51C30]">
                    <motion.div
                      animate={{ x: [-100, 300] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="h-full w-32 bg-white/40 blur-sm"
                    />
                  </div>

                  {/* Gradient Overlay Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#A51C30]/3 via-transparent to-[#002147]/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Decorative Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.02]">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, #A51C30 1px, transparent 0)',
                      backgroundSize: '40px 40px'
                    }} />
                  </div>

                  <div className="relative p-8 h-full flex flex-col">
                    {/* Category Header - Centered and Prominent */}
                    <div className="text-center mb-8">
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 360 }}
                        transition={{ type: "spring", stiffness: 300, duration: 0.8 }}
                        className="relative inline-block mb-5"
                      >
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#A51C30] to-[#C41E3A] flex items-center justify-center shadow-xl shadow-[#A51C30]/40">
                          <section.icon className="w-10 h-10 text-white" />
                        </div>
                        {/* 3D Shadow Effect */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#A51C30] to-[#C41E3A] blur-2xl opacity-40 -z-10 scale-90" />
                      </motion.div>
                      
                      <h4 className="text-2xl font-black text-[#002147] tracking-tight mb-3">
                        {section.category}
                      </h4>
                      <div className="h-1 w-16 bg-gradient-to-r from-transparent via-[#A51C30] to-transparent rounded-full mx-auto" />
                    </div>

                    {/* Items with Enhanced Styling */}
                    <div className="space-y-4 flex-1">
                      {section.items.map((item, itemIndex) => (
                        <motion.div
                          key={itemIndex}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + (itemIndex * 0.1) }}
                          whileHover={{ x: 6, scale: 1.01 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 group-hover:bg-white border border-transparent group-hover:border-[#A51C30]/10 transition-all duration-300 group/item"
                        >
                          {/* Animated Check with Modern Style */}
                          <motion.div
                            whileHover={{ scale: 1.2, rotate: 360 }}
                            transition={{ duration: 0.6, type: "spring" }}
                            className="relative flex-shrink-0"
                          >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#A51C30] to-[#C41E3A] flex items-center justify-center shadow-lg shadow-[#A51C30]/30">
                              <Check className="w-4 h-4 text-white font-bold stroke-[3]" />
                            </div>
                            {/* Subtle Glow */}
                            <div className="absolute inset-0 rounded-full bg-[#A51C30]/30 blur-md opacity-0 group-hover/item:opacity-100 transition-opacity" />
                          </motion.div>
                          
                          <p className="text-gray-700 text-sm leading-relaxed font-medium group-hover/item:text-[#002147] transition-colors flex-1">
                            {item}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA with Floating Animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="text-center mt-16"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#002147] to-[#003366] text-white shadow-2xl shadow-[#002147]/30"
            >
              <Sparkles className="w-6 h-6 text-[#A51C30]" />
              <span className="text-lg font-bold">
                Todo esto incluído en todos nuestros planes
              </span>
              <Sparkles className="w-6 h-6 text-[#A51C30]" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
