import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, GraduationCap, ChevronRight, X, Clock, Target, Brain, ArrowRight, Loader2, BookOpen, Users, Award, Calendar, Settings, Zap, Battery, Trophy, CheckCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

// Asset Imports
import csThumbnail from "@assets/generated_images/computer_science_course_thumbnail.png";
import artThumbnail from "@assets/generated_images/art_history_course_thumbnail.png";
import mathThumbnail from "@assets/generated_images/mathematics_course_thumbnail.png";
import heroBg from "@assets/generated_images/harvard_yard_entrance_with_banners.png";

import { motion } from "framer-motion";

// import { ThinkingBridge } from "@/components/ThinkingBridge"; // Temporalmente deshabilitado
import { ReservationDialog } from "@/components/ReservationDialog";
import { PlanConfiguratorYouthPremium } from "@/components/PlanConfiguratorYouthPremium";
import { PlanConfiguratorAdults } from "@/components/PlanConfiguratorAdults";
import { PlanConfiguratorAdultsNew } from "@/components/PlanConfiguratorAdultsNew";
import PaesConfigurator from "@/components/PaesConfigurator";
import PremiumExperiences from "@/components/PremiumExperiences";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

// Filter options - Harvard style
const topics = ["Cualquier Tema", "Matemáticas", "Ciencias", "Historia", "Lenguaje", "Artes"];
const levels = ["Cualquier Nivel", "7° Básico", "8° Básico", "1° Medio", "2° Medio", "3° Medio", "4° Medio"];
const durations = ["Cualquier Duración", "Semestral", "Anual", "Por Asignatura"];

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
  const [nosotrosDialogOpen, setNosotrosDialogOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // Harvard-style filter states
  const [selectedTopic, setSelectedTopic] = useState("Cualquier Tema");
  const [selectedLevel, setSelectedLevel] = useState("Cualquier Nivel");
  const [selectedDuration, setSelectedDuration] = useState("Cualquier Duración");
  const [topicOpen, setTopicOpen] = useState(false);
  const [levelOpen, setLevelOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);

  // Fetch plans from API
  const { data: apiPlans, isLoading: isLoadingPlans } = useQuery<PlanConfiguration[]>({
    queryKey: ["/api/plans"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch adult cycles
  const { data: adultCycles, isLoading: isLoadingAdult } = useQuery<any[]>({
    queryKey: ["/api/adult-cycles"],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch FAQs from API
  const { data: faqs, isLoading: isLoadingFaqs } = useQuery<Array<{
    id: string;
    question: string;
    answer: string;
    category?: string | null;
    sortOrder: number;
  }>>({
    queryKey: ['/api/faqs'],
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Harvard style: hide on scroll down, show on scroll up
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
      }
      
      setLastScrollY(currentScrollY);
      setIsScrolled(currentScrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Format currency for Chilean Pesos
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Map API plans to program format - with safety checks
  const programs = (apiPlans && Array.isArray(apiPlans) ? apiPlans.map((plan, index) => ({
    id: plan.id,
    title: plan.planName,
    subtitle: plan.planSubtitle || "",
    price: `Mensualidad: ${formatCurrency(plan.monthlyPrice || 0)} | Matrícula: ${formatCurrency(plan.enrollmentPrice || 0)}`,
    description: plan.description || "",
    image: [csThumbnail, mathThumbnail, artThumbnail, heroBg][index % 4], // Rotate through images
    category: plan.category || "Validación de Estudios",
    linkText: plan.linkText || "Más Información",
    academicLoad: plan.academicLoad,
    evaluationsDetail: plan.evaluationsDetail,
  })) : null) || [
    // Fallback data if API fails
    {
      id: "1",
      title: "Plan Barkley FOCUS",
      subtitle: "Jóvenes (7° a 4° Medio)",
      price: "Desde $240.000 (IVA incluido · Mentor incluido)",
      description: "Preparación para Exámenes Libres (Decreto 2272). Diseñado para estudiantes que necesitan estructura y apoyo constante.",
      image: csThumbnail,
      category: "Validación de Estudios",
      linkText: "Más Información"
    },
  ];

  const masteryPillars = [
    {
      title: "1. Enfoque en Autonomía (Self-Paced)",
      description: "Paso 1: Rompemos la inercia de la educación pasiva. Tomas el control total de tu tiempo con contenido On-Demand de alto impacto, eliminando la dependencia de horarios fijos y clases magistrales innecesarias.",
      icon: Zap
    },
    {
      title: "2. Aprendizaje Adaptativo (Mastery Path)",
      description: "Paso 2: Avanzas solo cuando demuestras dominio. Nuestra IA especialista detecta tus brechas en tiempo real y personaliza tu ruta, asegurando que cada concepto sea una competencia ganada antes de dar el siguiente paso.",
      icon: Target
    },
    {
      title: "3. Success Mentoring (Performance)",
      description: "Paso 3: Gestión de éxito estratégica. Tu mentor de rendimiento, inspirado en el modelo del MIT, supervisa tu progreso y entrena tu disciplina para asegurar que alcances tu meta de validación oficial en tiempo récord.",
      icon: Battery
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans text-[#1e1e1e] antialiased">
      
      {/* Harvard Style Header - Off-white background, ALWAYS VISIBLE */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa]">
        <div className="max-w-[1400px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            
            {/* Logo with Institute Name - Always visible */}
            <a href="/" className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity z-10">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#002F6C] to-[#003d8f] flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[18px] font-serif font-bold text-[#002F6C] leading-none tracking-tight">
                  BLUE
                </span>
                <span className="text-[9px] text-[#1a1a1a] font-medium tracking-[0.15em] uppercase mt-0.5">
                  TUTOR IA
                </span>
              </div>
            </a>

            {/* Navigation Pills - Show when NOT scrolled OR when menu is expanded */}
            <div className={`hidden lg:flex items-center gap-4 transition-all duration-500 ease-out ${(isScrolled && !menuExpanded) ? 'opacity-0 translate-x-8 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
              
              {/* First Pill - Main Navigation */}
              <div className="flex items-center gap-6 bg-white rounded-full px-8 py-3 shadow-sm">
                <a href="#" className="text-[14px] text-[#1e1e1e] hover:text-[#a51c30] font-normal transition-colors whitespace-nowrap">
                  Programas
                </a>
                <a href="#metodo" className="text-[14px] text-[#1e1e1e] hover:text-[#a51c30] font-normal transition-colors whitespace-nowrap">
                  Método
                </a>
                <a href="#plataforma" className="text-[14px] text-[#1e1e1e] hover:text-[#a51c30] font-normal transition-colors whitespace-nowrap">
                  Plataforma
                </a>
                <button 
                  onClick={() => setNosotrosDialogOpen(true)}
                  className="text-[14px] text-[#1e1e1e] hover:text-[#a51c30] font-normal transition-colors whitespace-nowrap"
                >
                  Nosotros
                </button>
                <button 
                  onClick={() => setReservationDialogOpen(true)}
                  className="text-[14px] text-[#1e1e1e] hover:text-[#a51c30] font-normal transition-colors whitespace-nowrap"
                >
                  Inscripción
                </button>
              </div>

            </div>

            {/* Hamburger Button - Circle with 2 lines (shows when scrolled AND menu not expanded) */}
            <button 
              onClick={() => setMenuExpanded(!menuExpanded)}
              className={`hidden lg:flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm hover:shadow-md transition-all duration-500 ease-out ${(isScrolled && !menuExpanded) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'}`}
            >
              <div className="flex flex-col gap-1.5">
                <div className="w-5 h-0.5 bg-[#1e1e1e] rounded-full"></div>
                <div className="w-5 h-0.5 bg-[#1e1e1e] rounded-full"></div>
              </div>
            </button>

            {/* Mobile Hamburger - Always visible on mobile */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col gap-1.5">
                <div className="w-5 h-0.5 bg-[#1e1e1e] rounded-full"></div>
                <div className="w-5 h-0.5 bg-[#1e1e1e] rounded-full"></div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20"></div>

      <main className="bg-[#fafafa]">
        {/* Hero Section - Standards.site Style */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#f2f2f2]">
          {/* Clean gray background */}
          <div className="absolute inset-0 bg-[#f2f2f2]" />

          <div className="container-harvard relative z-10 pt-40 pb-32">
            <div className="max-w-6xl mx-auto">
              
              {/* Simple Clean Headline - Standards Style */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-8"
              >
                {/* Main Headline - Simple, Clean, Minimalist */}
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-light text-[#1a1a1a] leading-[1.1] tracking-tight">
                  Piensa. Aprende. Crea.
                </h1>

                {/* Subheadline - Clean and direct */}
                <div className="max-w-3xl">
                  <p className="text-xl md:text-2xl text-[#1a1a1a] leading-[1.5] font-light">
                    El tutor IA basado en el Método Socrático y el Andamiaje de Stanford University.
                  </p>
                  <p className="text-base md:text-lg text-[#666666] mt-4 leading-relaxed font-light">
                    Potenciado por la experiencia de Juan Pablo Monsalvez (CEO Stratmore Partners, Certificado HarvardX).
                  </p>
                </div>

                {/* CTA - Simple Button with Red Dot */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex items-center gap-4"
                >
                  <motion.button
                    onClick={() => setReservationDialogOpen(true)}
                    whileHover={{ x: 2 }}
                    className="inline-flex items-center gap-3 bg-[#1a1a1a] px-8 py-4 text-white font-normal text-base hover:bg-[#333333] transition-colors"
                  >
                    <span>Probar BLUE gratis</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  
                  {/* Red Dot - Standards.site signature */}
                  <div className="w-2 h-2 rounded-full bg-[#FF2E00]"></div>
                </motion.div>

                {/* Simple Credentials Text */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="pt-6"
                >
                  <p className="text-sm text-[#666666] font-light">
                    Stanford University · Harvard University
                  </p>
                </motion.div>

              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Science Section - Standards.site Style */}
        <section id="ciencia" className="bg-white py-32 scroll-mt-20">
          <div className="container-harvard">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-6xl mx-auto"
            >
              {/* Header - Standards.site Style */}
              <div className="mb-20">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1a1a1a] leading-tight mb-6">
                  Nuestra Ciencia
                </h2>
                <p className="text-xl md:text-2xl text-[#666666] leading-relaxed max-w-4xl font-light">
                  BLUE no es un experimento. Es el resultado de décadas de experiencia pedagógica combinada con la ciencia del aprendizaje de las universidades más prestigiosas del mundo.
                </p>
              </div>

              {/* Founder Bio Section */}
              <div className="grid md:grid-cols-5 gap-12 mb-20">
                {/* Left - Profile */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="md:col-span-2"
                >
                  <div className="bg-[#f2f2f2] p-8">
                    {/* Photo */}
                    <div className="mb-6">
                      <img 
                        src="/imagen01.jpg"
                        alt="Juan Pablo Monsalvez - Fundador BLUE" 
                        className="w-full h-64 object-cover rounded-lg border border-[#002F6C]/20"
                      />
                    </div>
                    
                    {/* Name & Title */}
                    <h3 className="text-2xl font-light text-[#1a1a1a] mb-2">
                      Juan Pablo Monsalvez
                    </h3>
                    <p className="text-base text-[#666666] font-light mb-4">
                      Fundador & Arquitecto Pedagógico
                    </p>
                    
                    {/* Credentials */}
                    <div className="space-y-3 pt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF2E00] mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-normal text-[#1a1a1a]">HarvardX</p>
                          <p className="text-sm text-[#666666] font-light">Certificación en Ciencias del Aprendizaje</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF2E00] mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-normal text-[#1a1a1a]">20+ Años</p>
                          <p className="text-sm text-[#666666] font-light">Experiencia en Educación</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF2E00] mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-normal text-[#1a1a1a]">Miles de Estudiantes</p>
                          <p className="text-sm text-[#666666] font-light">Formados en Chile</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Right - Biography */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="md:col-span-3"
                >
                  <div className="space-y-6 text-lg text-[#1a1a1a] leading-relaxed font-light">
                    <p className="text-xl text-[#1a1a1a] font-normal">
                      La Trayectoria
                    </p>
                    
                    <p>
                      Durante dos décadas, Juan Pablo Monsalvez ha dedicado su vida a comprender una pregunta fundamental: ¿cómo hacer que los estudiantes realmente aprendan a pensar?
                    </p>
                    
                    <p>
                      Su respuesta no vino de los métodos tradicionales. Vino de Harvard University, donde se certificó en las ciencias del aprendizaje que transforman la educación moderna.
                    </p>
                    
                    <p>
                      BLUE es la culminación de esa búsqueda: un sistema que replica el Método Socrático usado en Stanford, pero escalado a través de inteligencia artificial para llegar a cada hogar chileno.
                    </p>

                    <div className="bg-[#f2f2f2] p-6 mt-8">
                      <p className="text-lg font-light italic text-[#1a1a1a]">
                        "BLUE nunca da la respuesta. Hace las preguntas correctas para que el alumno la descubra por sí mismo."
                      </p>
                      <p className="text-sm text-[#666666] font-light mt-2">
                        — Juan Pablo Monsalvez
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Methodology Section */}
              <div className="pt-20">
                <h3 className="text-3xl md:text-4xl font-light text-[#1a1a1a] mb-12">
                  El Método Socrático (Scaffolding)
                </h3>

                <div className="grid md:grid-cols-3 gap-8">
                  {/* Principle 1 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <div className="bg-[#f2f2f2] p-8 h-full">
                      <div className="text-5xl font-light text-[#1a1a1a] mb-4">01</div>
                      <h4 className="text-xl font-normal text-[#1a1a1a] mb-4">
                        Nunca da respuestas
                      </h4>
                      <p className="text-[#666666] leading-relaxed font-light">
                        BLUE no resuelve el ejercicio por ti. Te guía con preguntas estratégicas para que tú descubras la solución.
                      </p>
                    </div>
                  </motion.div>

                  {/* Principle 2 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <div className="bg-[#f2f2f2] p-8 h-full">
                      <div className="text-5xl font-light text-[#1a1a1a] mb-4">02</div>
                      <h4 className="text-xl font-normal text-[#1a1a1a] mb-4">
                        Andamiaje Inteligente
                      </h4>
                      <p className="text-[#666666] leading-relaxed font-light">
                        Adapta la dificultad de las preguntas según tu nivel, construyendo conocimiento paso a paso como lo haría un mentor experto.
                      </p>
                    </div>
                  </motion.div>

                  {/* Principle 3 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <div className="bg-[#f2f2f2] p-8 h-full">
                      <div className="text-5xl font-light text-[#1a1a1a] mb-4">03</div>
                      <h4 className="text-xl font-normal text-[#1a1a1a] mb-4">
                        Validado por Harvard
                      </h4>
                      <p className="text-[#666666] leading-relaxed font-light">
                        Estudio publicado en Nature (2025) demuestra que duplica la velocidad de aprendizaje vs. métodos tradicionales.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Bottom Citation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-12 text-center"
              >
                <p className="text-sm text-[#1a1a1a]/50 italic">
                  "La IA que no da la respuesta, enseña a pensar"
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* BLUE Features Section - Standards.site Style */}
        <section id="metodo" className="bg-[#f2f2f2] py-32 scroll-mt-20">
          <div className="container-harvard">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-16"
            >
              {/* Section Header - Minimalist */}
              <div className="max-w-4xl mb-16">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1a1a1a] leading-tight mb-6">
                  Funcionalidades Diseñadas para el Hogar Chileno
                </h2>
                <p className="text-xl md:text-2xl text-[#666666] leading-relaxed font-light">
                  BLUE no es una plataforma más. Es un tutor inteligente construido específicamente para familias homeschooling y estudiantes que necesitan estructura.
                </p>
              </div>

              {/* Three Features - Minimalist Style */}
              <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                
                {/* Feature 1 - Voz Nativa */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                >
                  <div className="bg-white p-8 h-full">
                    <div className="text-5xl font-light text-[#1a1a1a] mb-6">01</div>
                    
                    <h3 className="text-2xl font-normal text-[#1a1a1a] mb-4">
                      Voz Nativa
                    </h3>
                    
                    <p className="text-base text-[#666666] leading-relaxed mb-6 font-light">
                      Los niños pequeños pueden aprender hablando. BLUE escucha y responde por voz, perfecto para quienes aún no escriben con fluidez.
                    </p>

                    <div className="pt-4">
                      <p className="text-sm text-[#666666] font-light">
                        Ideal para estudiantes de 7° básico y menores
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 2 - Currículum Chileno */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className="bg-white p-8 h-full">
                    <div className="text-5xl font-light text-[#1a1a1a] mb-6">02</div>
                    
                    <h3 className="text-2xl font-normal text-[#1a1a1a] mb-4">
                      Currículum Chileno
                    </h3>
                    
                    <p className="text-base text-[#666666] leading-relaxed mb-6 font-light">
                      Adaptado 100% al MINEDUC. Cada contenido, cada ejercicio, cada evaluación está alineado con los programas oficiales de estudio chilenos.
                    </p>

                    <div className="pt-4">
                      <p className="text-sm text-[#666666] font-light">
                        De 7° básico a 4° medio completo
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 3 - Dashboard Padres */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <div className="bg-white p-8 h-full">
                    <div className="text-5xl font-light text-[#1a1a1a] mb-6">03</div>
                    
                    <h3 className="text-2xl font-normal text-[#1a1a1a] mb-4">
                      Dashboard Padres
                    </h3>
                    
                    <p className="text-base text-[#666666] leading-relaxed mb-6 font-light">
                      Reportes de progreso directo a tu correo. Monitorea el avance sin interrumpir la autonomía. Incluye métricas anti-procrastinación.
                    </p>

                    <div className="pt-4">
                      <p className="text-sm text-[#666666] font-light">
                        Reportes semanales automáticos
                      </p>
                    </div>
                  </div>
                </motion.div>

              </div>

              {/* Bottom CTA - Clean Stanford style */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-center mt-12"
              >
                <p className="text-lg text-[#666666]/70 mb-6">
                  Ideal para familias homeschooling y estudiantes que procrastinan
                </p>
                <motion.button
                  onClick={() => setReservationDialogOpen(true)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 bg-[#002F6C] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#003d8f] transition-colors"
                >
                  <span>Prueba BLUE gratis</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Plans and Programs Section - Standards.site Style */}
        <section id="planes" className="bg-white py-32 scroll-mt-20">
          <div className="container-harvard">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-7xl mx-auto"
            >
              {/* Header - Minimalist */}
              <div className="mb-20">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1a1a1a] leading-tight mb-6">
                  Planes y Programas 2026
                </h2>
                <p className="text-xl md:text-2xl text-[#666666] leading-relaxed max-w-4xl font-light">
                  Ciclo académico de 10 meses: Marzo - Diciembre. Todos los valores incluyen 19% de IVA.
                </p>
              </div>

              {/* Plans Table - Desktop */}
              <div className="hidden lg:block overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#f2f2f2]">
                    <tr className="border-b border-[#1a1a1a]/10">
                      <th className="text-left py-4 px-6 font-normal text-sm text-[#1a1a1a]">Plan / Programa</th>
                      <th className="text-left py-4 px-6 font-normal text-sm text-[#1a1a1a]">Público Objetivo</th>
                      <th className="text-left py-4 px-6 font-normal text-sm text-[#1a1a1a]">Enfoque Académico</th>
                      <th className="text-right py-4 px-6 font-normal text-sm text-[#1a1a1a]">Mensual</th>
                      <th className="text-right py-4 px-6 font-normal text-sm text-[#1a1a1a]">Anual (10 cuotas)</th>
                      <th className="text-center py-4 px-6 font-normal text-sm text-[#1a1a1a]">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* BLUE Home */}
                    <tr className="border-b border-[#1a1a1a]/10 hover:bg-[#f2f2f2] transition-colors">
                      <td className="py-6 px-6">
                        <div className="font-normal text-base text-[#1a1a1a]">BLUE Home</div>
                      </td>
                      <td className="py-6 px-6 text-[#666666] font-light">1º Básico a 4º Medio</td>
                      <td className="py-6 px-6 text-[#666666] text-sm font-light">Acompañamiento integral en todas las asignaturas (inc. Ed. Física)</td>
                      <td className="py-6 px-6 text-right">
                        <div className="font-light text-xl text-[#1a1a1a]">$17.900</div>
                      </td>
                      <td className="py-6 px-6 text-right">
                        <div className="font-light text-base text-[#666666]">$179.000</div>
                      </td>
                      <td className="py-6 px-6 text-center">
                        <button
                          onClick={() => setReservationDialogOpen(true)}
                          className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 text-sm font-normal hover:bg-[#333333] transition-colors"
                        >
                          Contratar
                        </button>
                      </td>
                    </tr>

                    {/* Exámenes Libres */}
                    <tr className="border-b border-[#1a1a1a]/10 hover:bg-[#f2f2f2] transition-colors">
                      <td className="py-6 px-6">
                        <div className="font-normal text-base text-[#1a1a1a]">Exámenes Libres</div>
                      </td>
                      <td className="py-6 px-6 text-[#666666]">7º Básico a 4º Medio</td>
                      <td className="py-6 px-6 text-[#666666] text-sm">Preparación intensiva para validación de estudios (menores)</td>
                      <td className="py-6 px-6 text-right">
                        <div className="font-light text-xl text-[#1a1a1a]">$29.900</div>
                      </td>
                      <td className="py-6 px-6 text-right">
                        <div className="font-serif font-bold text-xl text-[#666666]">$299.000</div>
                      </td>
                      <td className="py-6 px-6 text-center">
                        <button
                          onClick={() => setReservationDialogOpen(true)}
                          className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 text-sm font-normal hover:bg-[#333333] transition-colors"
                        >
                          Contratar
                        </button>
                      </td>
                    </tr>

                    {/* Validación Adultos */}
                    <tr className="border-b border-[#1a1a1a]/10 hover:bg-[#f2f2f2] transition-colors">
                      <td className="py-6 px-6">
                        <div className="font-normal text-base text-[#1a1a1a]">Validación Adultos</div>
                      </td>
                      <td className="py-6 px-6 text-[#666666]">Mayores de 18 años</td>
                      <td className="py-6 px-6 text-[#666666] text-sm">Nivelación acelerada y estratégica para fines laborales</td>
                      <td className="py-6 px-6 text-right">
                        <div className="font-light text-xl text-[#1a1a1a]">$24.900</div>
                      </td>
                      <td className="py-6 px-6 text-right">
                        <div className="font-serif font-bold text-xl text-[#666666]">$249.000</div>
                      </td>
                      <td className="py-6 px-6 text-center">
                        <button
                          onClick={() => setReservationDialogOpen(true)}
                          className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 text-sm font-normal hover:bg-[#333333] transition-colors"
                        >
                          Contratar
                        </button>
                      </td>
                    </tr>

                    {/* PAES M1 / Lenguaje */}
                    <tr className="border-b border-[#1a1a1a]/10 hover:bg-[#f2f2f2] transition-colors">
                      <td className="py-6 px-6">
                        <div className="font-normal text-base text-[#1a1a1a]">PAES (M1 / Lenguaje)</div>
                      </td>
                      <td className="py-6 px-6 text-[#666666]">Alumnos de 4º Medio</td>
                      <td className="py-6 px-6 text-[#666666] text-sm">Preparación específica por área (valor unitario)</td>
                      <td className="py-6 px-6 text-right">
                        <div className="font-light text-xl text-[#1a1a1a]">$12.000</div>
                      </td>
                      <td className="py-6 px-6 text-right">
                        <div className="font-serif font-bold text-xl text-[#666666]">$120.000</div>
                      </td>
                      <td className="py-6 px-6 text-center">
                        <button
                          onClick={() => setReservationDialogOpen(true)}
                          className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 text-sm font-normal hover:bg-[#333333] transition-colors"
                        >
                          Contratar
                        </button>
                      </td>
                    </tr>

                    {/* PAES M2 */}
                    <tr className="border-b border-[#1a1a1a]/10 hover:bg-[#f2f2f2] transition-colors">
                      <td className="py-6 px-6">
                        <div className="font-normal text-base text-[#1a1a1a]">PAES (M2)</div>
                      </td>
                      <td className="py-6 px-6 text-[#666666]">Futuros STEM</td>
                      <td className="py-6 px-6 text-[#666666] text-sm">Razonamiento matemático de alta complejidad</td>
                      <td className="py-6 px-6 text-right">
                        <div className="font-light text-xl text-[#1a1a1a]">$20.000</div>
                      </td>
                      <td className="py-6 px-6 text-right">
                        <div className="font-serif font-bold text-xl text-[#666666]">$200.000</div>
                      </td>
                      <td className="py-6 px-6 text-center">
                        <button
                          onClick={() => setReservationDialogOpen(true)}
                          className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 text-sm font-normal hover:bg-[#333333] transition-colors"
                        >
                          Contratar
                        </button>
                      </td>
                    </tr>

                    {/* PAES Historia / CC */}
                    <tr className="hover:bg-[#F9F6EF] transition-colors">
                      <td className="py-6 px-6">
                        <div className="font-normal text-base text-[#1a1a1a]">PAES (Historia / CC)</div>
                      </td>
                      <td className="py-6 px-6 text-[#666666]">Alumnos de 4º Medio</td>
                      <td className="py-6 px-6 text-[#666666] text-sm">Preparación para pruebas electivas específicas (valor unitario)</td>
                      <td className="py-6 px-6 text-right">
                        <div className="font-light text-xl text-[#1a1a1a]">$10.000</div>
                      </td>
                      <td className="py-6 px-6 text-right">
                        <div className="font-serif font-bold text-xl text-[#666666]">$100.000</div>
                      </td>
                      <td className="py-6 px-6 text-center">
                        <button
                          onClick={() => setReservationDialogOpen(true)}
                          className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 text-sm font-normal hover:bg-[#333333] transition-colors"
                        >
                          Contratar
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Plans Cards - Mobile */}
              <div className="lg:hidden space-y-6">
                {/* Card template for each plan */}
                {[
                  {
                    name: "BLUE Home",
                    target: "1º Básico a 4º Medio",
                    focus: "Acompañamiento integral en todas las asignaturas (inc. Ed. Física)",
                    monthly: "$17.900",
                    annual: "$179.000"
                  },
                  {
                    name: "Exámenes Libres",
                    target: "7º Básico a 4º Medio",
                    focus: "Preparación intensiva para validación de estudios (menores)",
                    monthly: "$29.900",
                    annual: "$299.000"
                  },
                  {
                    name: "Validación Adultos",
                    target: "Mayores de 18 años",
                    focus: "Nivelación acelerada y estratégica para fines laborales",
                    monthly: "$24.900",
                    annual: "$249.000"
                  },
                  {
                    name: "PAES (M1 / Lenguaje)",
                    target: "Alumnos de 4º Medio",
                    focus: "Preparación específica por área (valor unitario)",
                    monthly: "$12.000",
                    annual: "$120.000"
                  },
                  {
                    name: "PAES (M2)",
                    target: "Futuros STEM",
                    focus: "Razonamiento matemático de alta complejidad",
                    monthly: "$20.000",
                    annual: "$200.000"
                  },
                  {
                    name: "PAES (Historia / CC)",
                    target: "Alumnos de 4º Medio",
                    focus: "Preparación para pruebas electivas específicas (valor unitario)",
                    monthly: "$10.000",
                    annual: "$100.000"
                  }
                ].map((plan, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-[#f2f2f2] p-6"
                  >
                    <h3 className="font-light text-xl text-[#1a1a1a] mb-2">{plan.name}</h3>
                    <p className="text-sm text-[#666666] mb-4">{plan.target}</p>
                    <p className="text-sm text-[#666666]/70 mb-6">{plan.focus}</p>
                    
                    <div className="flex items-end justify-between mb-6">
                      <div>
                        <div className="text-xs text-[#666666]/60 mb-1">Mensual</div>
                        <div className="font-serif font-bold text-3xl text-[#002F6C]">{plan.monthly}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#666666]/60 mb-1">Anual (10 cuotas)</div>
                        <div className="font-serif font-bold text-xl text-[#666666]">{plan.annual}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setReservationDialogOpen(true)}
                      className="w-full bg-[#002F6C] text-white py-3 font-semibold hover:bg-[#003d8f] transition-colors"
                    >
                      Contratar
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Footer Note */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-12 text-center"
              >
                <p className="text-sm text-[#666666]/60">
                  Todos los valores incluyen 19% de IVA. Ciclo académico: Marzo - Diciembre (10 meses).
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Premium Experiences Section */}
        <PremiumExperiences />

        {/* Thinking Bridge - Metaphor Section */}
        {/* <ThinkingBridge /> */}

        {/* Interactive Plan Configurator - MOVED UP */}
        <div id="planes" className="scroll-mt-20">
          {/* Youth Plans - Exámenes Libres */}
          <PlanConfiguratorYouthPremium />
          
          {/* Adult Plans - Validación de Estudios */}
          <PlanConfiguratorAdultsNew />
          
          {/* PAES Plans */}
          <div id="paes" className="scroll-mt-20">
            <PaesConfigurator />
          </div>
        </div>

                        {/* MediaGrid Section - Standards.site Style with Real Images */}
        <section className="py-0 bg-white">
          <div className="w-full max-w-[2000px] mx-auto">
            
            {/* Full Width Hero Media */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative w-full overflow-hidden"
              style={{ aspectRatio: '2/1' }}
            >
              <img 
                src="/portada_plataforma.png" 
                alt="BLUE Plataforma" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#0066FF]/90 hover:bg-[#0066FF]/70 transition-all duration-300 cursor-pointer">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-3 h-3 rounded-full bg-white mb-6 mx-auto"></div>
                    <h3 className="text-4xl md:text-5xl font-light">BLUE en Acción</h3>
                    <p className="text-xl font-light mt-4 opacity-90">Plataforma de aprendizaje inteligente</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Two Column Grid */}
            <div className="grid md:grid-cols-2 gap-0">
              
              {/* Item 1 - Voz Nativa */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative group cursor-pointer overflow-hidden"
                style={{ aspectRatio: '1/1' }}
              >
                <img 
                  src="/1.png" 
                  alt="Voz Nativa" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#FF2E00]/90 group-hover:bg-[#FF2E00]/70 transition-all duration-300">
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="text-center text-white">
                      <div className="w-2 h-2 rounded-full bg-white mb-6 mx-auto"></div>
                      <h4 className="text-2xl md:text-3xl font-light">Voz Nativa</h4>
                      <p className="text-base font-light mt-3 opacity-90">Interacción por voz para niños</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Item 2 - Dashboard Padres */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative group cursor-pointer overflow-hidden"
                style={{ aspectRatio: '1/1' }}
              >
                <img 
                  src="/2.png" 
                  alt="Dashboard Padres" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#00CC66]/90 group-hover:bg-[#00CC66]/70 transition-all duration-300">
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="text-center text-white">
                      <div className="w-2 h-2 rounded-full bg-white mb-6 mx-auto"></div>
                      <h4 className="text-2xl md:text-3xl font-light">Dashboard Padres</h4>
                      <p className="text-base font-light mt-3 opacity-90">Seguimiento en tiempo real</p>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Three Column Grid */}
            <div className="grid md:grid-cols-3 gap-0">
              
              {/* Item 3 - Método Socrático */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative group cursor-pointer overflow-hidden"
                style={{ aspectRatio: '1/1' }}
              >
                <img 
                  src="/3.png" 
                  alt="Método Socrático" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#9933FF]/90 group-hover:bg-[#9933FF]/70 transition-all duration-300">
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="text-center text-white">
                      <div className="w-2 h-2 rounded-full bg-white mb-4 mx-auto"></div>
                      <h4 className="text-xl md:text-2xl font-light">Método Socrático</h4>
                      <p className="text-sm font-light mt-2 opacity-90">Preguntas que enseñan</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Item 4 - Gamificación */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative group cursor-pointer overflow-hidden"
                style={{ aspectRatio: '1/1' }}
              >
                <img 
                  src="/video-poster-1.jpg" 
                  alt="Anti-Procrastinación" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#FF6600]/90 group-hover:bg-[#FF6600]/70 transition-all duration-300">
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="text-center text-white">
                      <div className="w-2 h-2 rounded-full bg-white mb-4 mx-auto"></div>
                      <h4 className="text-xl md:text-2xl font-light">Anti-Procrastinación</h4>
                      <p className="text-sm font-light mt-2 opacity-90">Gamificación científica</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Item 5 - Currículum MINEDUC */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative group cursor-pointer overflow-hidden"
                style={{ aspectRatio: '1/1' }}
              >
                <img 
                  src="/video-poster-2.jpg" 
                  alt="Currículum MINEDUC" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#FFCC00]/90 group-hover:bg-[#FFCC00]/70 transition-all duration-300">
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="text-center text-white">
                      <div className="w-2 h-2 rounded-full bg-white mb-4 mx-auto"></div>
                      <h4 className="text-xl md:text-2xl font-light">100% MINEDUC</h4>
                      <p className="text-sm font-light mt-2 opacity-90">Currículum oficial</p>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Full Width Bottom */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative w-full overflow-hidden"
              style={{ aspectRatio: '2/1' }}
            >
              <img 
                src="/imagen01.jpg" 
                alt="Resultados Comprobados" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#FF0099]/90 hover:bg-[#FF0099]/70 transition-all duration-300 cursor-pointer">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-3 h-3 rounded-full bg-white mb-6 mx-auto"></div>
                    <h3 className="text-4xl md:text-5xl font-light">Resultados Comprobados</h3>
                    <p className="text-xl font-light mt-4 opacity-90">Miles de estudiantes transformados</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </section>







        {/* Platform Showcase Section - Standards.site Style */}
        <section id="plataforma" className="py-32 bg-[#f2f2f2] scroll-mt-20">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02]">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, #002F6C 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="container-harvard relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid lg:grid-cols-[1fr_2.34fr] gap-16 items-center"
            >
              {/* Left Column - Text Content */}
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <Badge className="mb-6 bg-[#002F6C]/10 text-[#002F6C] hover:bg-[#002F6C]/20 border-[#002F6C]/20 px-4 py-2 text-sm font-semibold">
                    La Plataforma del Futuro
                  </Badge>
                  
                  <h2 className="text-5xl md:text-6xl font-serif font-bold text-[#1a1a1a] leading-tight mb-6">
                    Aprende con{" "}
                    <span className="text-[#002F6C] italic">BLUE</span>
                  </h2>
                  
                  <div className="space-y-6 text-lg text-[#1a1a1a]/80 leading-relaxed">
                    <p>
                      La <span className="font-semibold text-[#1a1a1a]">plataforma educativa</span> que combina inteligencia artificial con el currículo oficial del MINEDUC, diseñada para <span className="font-semibold text-[#002F6C]">familias homeschooling</span>.
                    </p>
                    
                    <p>
                      BLUE interactúa por <span className="font-semibold text-[#002F6C]">voz nativa</span>, envía reportes automáticos a los padres y mantiene la motivación alta con <span className="font-semibold text-[#1a1a1a]">gamificación científicamente validada</span>.
                    </p>
                    
                    <p>
                      Tu hijo avanza a su propio ritmo con <span className="font-semibold text-[#002F6C]">tecnología de Stanford</span>, mientras tú monitoras su progreso sin interferir en su autonomía.
                    </p>
                  </div>

                  <motion.button
                    onClick={() => setReservationDialogOpen(true)}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 bg-[#002F6C] text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all mt-8"
                  >
                    <span>Comienza hoy</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              </div>

              {/* Right Column - Video Player */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="group"
              >
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_30px_60px_-15px_rgba(0,47,108,0.3)] transition-all duration-500 p-4">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#002F6C]/20 via-transparent to-[#002F6C]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative rounded-xl overflow-hidden shadow-inner" style={{ height: '450px' }}>
                    <video 
                      controls
                      className="w-full h-full rounded-lg"
                      poster="/portada_plataforma.png"
                      style={{
                        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
                        objectFit: 'cover',
                        backgroundColor: '#000'
                      }}
                    >
                      <source src="/final_plataforma.mov" type="video/mp4" />
                      Tu navegador no soporta el elemento de video.
                    </video>
                    
                    {/* Elegant shine effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                  </div>

                  {/* Decorative corner accent */}
                  <div className="absolute top-8 right-8 w-20 h-20 border-t-2 border-r-2 border-[#002F6C]/30 rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Case Studies Section - Standards.site Style with Color Blocks */}
        <section className="py-32 bg-white relative overflow-hidden">
          <div className="container-harvard">
            {/* Header */}
            <div className="max-w-4xl mb-16">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1a1a1a] leading-tight mb-6">
                Casos de Éxito
              </h2>
              <p className="text-xl md:text-2xl text-[#666666] leading-relaxed font-light">
                Estudiantes reales transformando su aprendizaje con BLUE
              </p>
            </div>

            {/* Color Blocks Grid - Standards.site Style */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
              {/* Case Study 1 - Bright Blue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-[#0066FF] p-8 aspect-square flex flex-col justify-between"
              >
                <div>
                  <div className="w-2 h-2 rounded-full bg-white mb-6"></div>
                  <h3 className="text-2xl font-normal text-white mb-4">
                    María, 8° Básico
                  </h3>
                  <p className="text-white/90 font-light leading-relaxed">
                    "Pasé de 4.5 a 6.2 en Matemáticas en solo 3 meses usando BLUE"
                  </p>
                </div>
                <div className="text-sm text-white/70 font-light">
                  Exámenes Libres · Santiago
                </div>
              </motion.div>

              {/* Case Study 2 - Vibrant Red */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-[#FF2E00] p-8 aspect-square flex flex-col justify-between"
              >
                <div>
                  <div className="w-2 h-2 rounded-full bg-white mb-6"></div>
                  <h3 className="text-2xl font-normal text-white mb-4">
                    Carlos, Validación Adultos
                  </h3>
                  <p className="text-white/90 font-light leading-relaxed">
                    "Terminé mi 4° Medio en 8 meses mientras trabajaba tiempo completo"
                  </p>
                </div>
                <div className="text-sm text-white/70 font-light">
                  Validación · Valparaíso
                </div>
              </motion.div>

              {/* Case Study 3 - Bright Green */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-[#00CC66] p-8 aspect-square flex flex-col justify-between"
              >
                <div>
                  <div className="w-2 h-2 rounded-full bg-white mb-6"></div>
                  <h3 className="text-2xl font-normal text-white mb-4">
                    Sofía, PAES
                  </h3>
                  <p className="text-white/90 font-light leading-relaxed">
                    "820 puntos en Matemática M2 con el método Socrático de BLUE"
                  </p>
                </div>
                <div className="text-sm text-white/70 font-light">
                  PAES 2025 · Concepción
                </div>
              </motion.div>

              {/* Case Study 4 - Purple */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-[#9933FF] p-8 aspect-square flex flex-col justify-between"
              >
                <div>
                  <div className="w-2 h-2 rounded-full bg-white mb-6"></div>
                  <h3 className="text-2xl font-normal text-white mb-4">
                    Diego, 1° Medio
                  </h3>
                  <p className="text-white/90 font-light leading-relaxed">
                    "BLUE me ayudó a entender Ciencias con preguntas que me hacían pensar"
                  </p>
                </div>
                <div className="text-sm text-white/70 font-light">
                  BLUE Home · La Serena
                </div>
              </motion.div>

              {/* Case Study 5 - Orange */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-[#FF6600] p-8 aspect-square flex flex-col justify-between"
              >
                <div>
                  <div className="w-2 h-2 rounded-full bg-white mb-6"></div>
                  <h3 className="text-2xl font-normal text-white mb-4">
                    Valentina, 3° Medio
                  </h3>
                  <p className="text-white/90 font-light leading-relaxed">
                    "Mi familia homeschooling encontró en BLUE el tutor perfecto 24/7"
                  </p>
                </div>
                <div className="text-sm text-white/70 font-light">
                  Homeschooling · Puerto Montt
                </div>
              </motion.div>

              {/* Case Study 6 - Pink */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-[#FF0099] p-8 aspect-square flex flex-col justify-between"
              >
                <div>
                  <div className="w-2 h-2 rounded-full bg-white mb-6"></div>
                  <h3 className="text-2xl font-normal text-white mb-4">
                    Matías, 7° Básico
                  </h3>
                  <p className="text-white/90 font-light leading-relaxed">
                    "Aprender hablando con BLUE es increíble, es como tener un profesor siempre disponible"
                  </p>
                </div>
                <div className="text-sm text-white/70 font-light">
                  Voz Nativa · Temuco
                </div>
              </motion.div>

            </div>
          </div>
        </section>
      </main>

      {/* Tech Stack / Partners Section */}

      {/* Founder Story Section - Standards.site Style */}
      <section className="bg-white py-32">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column - Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative h-[500px] rounded-lg overflow-hidden border border-[#002F6C]/20"
            >
              <img 
                src="/imagen01.jpg"
                alt="Fundador - Experto en Educación" 
                className="w-full h-full object-cover"
              />
              
              {/* Badge on Image - Clean design */}
              <div className="absolute bottom-8 left-8 bg-white rounded-lg px-6 py-4 border border-[#002F6C]/20">
                <div className="text-3xl font-bold font-serif text-[#002F6C]">20+ años</div>
                <div className="text-sm text-[#666666] font-medium">de experiencia docente</div>
              </div>
            </motion.div>

            {/* Right Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              {/* Badge */}
              <div className="inline-block">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#002F6C]/5 text-[#002F6C] text-sm font-medium rounded-full border border-[#002F6C]/10">
                  Quiénes Somos
                </span>
              </div>

              {/* Title */}
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#002F6C] leading-[1.1]">
                Escalando la experiencia docente con tecnología
              </h2>

              {/* Decorative line */}
              <div className="h-0.5 w-16 bg-[#002F6C]"></div>

              {/* Description */}
              <div className="space-y-4 text-base md:text-lg text-[#666666] leading-[1.8]">
                <p>
                  <span className="font-serif font-bold text-[#002F6C]">BLUE</span> nació de una necesidad real: cómo llevar <span className="font-semibold text-[#002F6C]">20 años de experiencia docente</span> a miles de niños simultáneamente.
                </p>
                
                <p>
                  Como educador con dos décadas formando estudiantes, comprendí que el modelo tradicional tiene un límite: <span className="font-semibold text-[#8C1515]">un profesor solo puede atender a un número limitado de alumnos</span>.
                </p>

                <p>
                  La tecnología de <span className="font-semibold text-[#002F6C]">Stanford</span> nos permitió hacer algo revolucionario: <span className="font-semibold text-[#002F6C]">multiplicar la capacidad de guiar, sin perder la calidad pedagógica</span>.
                </p>

                <p className="text-[#002F6C] font-semibold italic">
                  BLUE es mi experiencia convertida en IA, disponible para cada familia chilena que busca excelencia educativa.
                </p>
              </div>

              {/* Key Stats - Clean, no gradients */}
              <div className="grid grid-cols-3 gap-4 pt-6">
                <div className="text-center p-4 bg-white rounded-lg border border-[#002F6C]/20">
                  <div className="text-3xl font-bold font-serif text-[#002F6C]">20+</div>
                  <div className="text-xs text-[#666666]/60 mt-1">Años Docente</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-[#002F6C]/20">
                  <div className="text-3xl font-bold font-serif text-[#002F6C]">1000s</div>
                  <div className="text-xs text-[#666666]/60 mt-1">Estudiantes</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-[#002F6C]/20">
                  <div className="text-3xl font-bold font-serif text-[#002F6C]">24/7</div>
                  <div className="text-xs text-[#666666]/60 mt-1">Con BLUE</div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Harvard-Style Benefits Section */}
      <section className="py-24 bg-white">
        <div className="container-harvard">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Educación de calidad con metodología innovadora
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: Brain,
                title: "Metodología Barkley",
                description: "Sistema probado de autorregulación y desarrollo de funciones ejecutivas basado en neurociencia"
              },
              {
                icon: Users,
                title: "Acompañamiento Personalizado",
                description: "Success Mentors dedicados con seguimiento continuo del progreso académico"
              },
              {
                icon: Award,
                title: "Certificación Oficial",
                description: "Programas validados y reconocidos por el Ministerio de Educación de Chile"
              },
              {
                icon: Calendar,
                title: "Flexibilidad Total",
                description: "Aprende a tu ritmo con contenido disponible 24/7 y evaluaciones adaptadas"
              },
              {
                icon: CheckCircle,
                title: "Evaluación Continua",
                description: "Sistema de evaluación formativa con retroalimentación constante e inmediata"
              },
              {
                icon: Trophy,
                title: "Resultados Garantizados",
                description: "100% de tasa de aprobación con metodología comprobada científicamente"
              }
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center space-y-6 p-8 rounded-2xl hover:bg-muted/30 transition-all duration-300 group"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/5 rounded-2xl group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                  <benefit.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      <section className="bg-[#f2f2f2] py-16">
        <div className="container-harvard">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#1e1e1e]/40 mb-12">
              Construido con tecnología de clase mundial
            </p>
            <div className="flex flex-nowrap items-center justify-center gap-8 md:gap-12 lg:gap-16 opacity-25 grayscale hover:grayscale-0 hover:opacity-60 transition-all duration-500 overflow-x-auto pb-12">
              {/* VS Code */}
              <motion.div
                whileHover={{ scale: 1.2, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center gap-3 group relative flex-shrink-0"
              >
                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.5.5l-.67.07L8.5 4.43 3.76 1.68l-.38-.22-.42.14-1.47.5-.49.17v.76l.02 18.5v.63l.5.18 1.47.5.39.13.41-.12 4.7-2.7 8.34 3.85.66.07.85-.44 3.51-1.82.5-.25V1.99l-.5-.25L18.35.92l-.85-.42zM18 4.42v15.15l-6-2.76V7.18l6-2.76zm-8 .64v13.88l-3.5 2.03V3.03L10 5.06z"/>
                </svg>
                <span className="text-xs font-semibold text-[#1e1e1e] opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute -bottom-8 whitespace-nowrap">
                  VS Code
                </span>
              </motion.div>

              {/* Gemini AI */}
              <motion.div
                whileHover={{ scale: 1.2, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center gap-3 group relative flex-shrink-0"
              >
                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.82 8 12 11.82 4.18 8 12 4.18zM4 9.47l7 3.5v7.86l-7-3.5V9.47zm16 0v7.86l-7 3.5v-7.86l7-3.5z"/>
                </svg>
                <span className="text-xs font-semibold text-[#1e1e1e] opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute -bottom-8 whitespace-nowrap">
                  Gemini AI
                </span>
              </motion.div>

              {/* Vercel */}
              <motion.div
                whileHover={{ scale: 1.2, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center gap-3 group relative flex-shrink-0"
              >
                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L24 22H0L12 1z"/>
                </svg>
                <span className="text-xs font-semibold text-[#1e1e1e] opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute -bottom-8 whitespace-nowrap">
                  Vercel
                </span>
              </motion.div>

              {/* GitHub */}
              <motion.div
                whileHover={{ scale: 1.2, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center gap-3 group relative flex-shrink-0"
              >
                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span className="text-xs font-semibold text-[#1e1e1e] opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute -bottom-8 whitespace-nowrap">
                  GitHub
                </span>
              </motion.div>

              {/* NotebookLM */}
              <motion.div
                whileHover={{ scale: 1.2, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center gap-3 group relative flex-shrink-0"
              >
                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.5l1.5 1.5L13 13.5 11.5 12 8 15.5zm0-4l1.5 1.5L13 9.5 11.5 8 8 11.5z"/>
                </svg>
                <span className="text-xs font-semibold text-[#1e1e1e] opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute -bottom-8 whitespace-nowrap">
                  NotebookLM
                </span>
              </motion.div>

              {/* TypeScript */}
              <motion.div
                whileHover={{ scale: 1.2, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center gap-3 group relative flex-shrink-0"
              >
                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 12v12h24V0H0zm19.341-.956c.61.152 1.074.423 1.501.865.221.236.549.666.575.77.008.03-1.036.73-1.668 1.123-.023.015-.115-.084-.217-.236-.31-.45-.633-.644-1.128-.678-.728-.05-1.196.331-1.192.967a.88.88 0 00.102.45c.16.331.458.53 1.39.933 1.719.74 2.454 1.227 2.911 1.92.51.773.625 2.008.278 2.926-.38.998-1.325 1.676-2.655 1.9-.411.073-1.386.062-1.828-.018-.964-.172-1.878-.648-2.442-1.273-.221-.244-.651-.88-.625-.925.011-.016.11-.077.22-.141.108-.061.509-.294.889-.517l.69-.406.185.272c.305.43.72.753 1.188.924.757.27 1.788.169 2.297-.229.204-.16.305-.406.305-.781 0-.278-.035-.41-.174-.609-.183-.26-.55-.484-1.542-.944-1.134-.528-1.617-.848-2.074-1.375a3.026 3.026 0 01-.65-1.64c-.01-.427.015-.846.082-1.194.25-1.313 1.208-2.179 2.624-2.372.396-.055 1.323-.026 1.743.053zM10.15 11.08h2.41v1.141h-1.269v6.73H9.62v-6.73H8.35V11.08h1.8z"/>
                </svg>
                <span className="text-xs font-semibold text-[#1e1e1e] opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute -bottom-8 whitespace-nowrap">
                  TypeScript
                </span>
              </motion.div>

              {/* React */}
              <motion.div
                whileHover={{ scale: 1.2, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center gap-3 group relative flex-shrink-0"
              >
                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 10.11c1.03 0 1.87.84 1.87 1.89 0 1-.84 1.85-1.87 1.85S10.13 13 10.13 12c0-1.05.84-1.89 1.87-1.89M7.37 20c.63.38 2.01-.2 3.6-1.7-.52-.59-1.03-1.23-1.51-1.9a22.7 22.7 0 01-2.4-.36c-.51 2.14-.32 3.61.31 3.96m.71-5.74l-.29-.51c-.11.29-.22.58-.29.86.27.06.57.11.88.16l-.3-.51m6.54-.76l.81-1.5-.81-1.5c-.3-.53-.62-1-.91-1.47C13.17 9 12.6 9 12 9s-1.17 0-1.71.03c-.29.47-.61.94-.91 1.47L8.57 12l.81 1.5c.3.53.62 1 .91 1.47.54.03 1.11.03 1.71.03s1.17 0 1.71-.03c.29-.47.61-.94.91-1.47M12 6.78c-.19.22-.39.45-.59.72h1.18c-.2-.27-.4-.5-.59-.72m0 10.44c.19-.22.39-.45.59-.72h-1.18c.2.27.4.5.59.72M16.62 4c-.62-.38-2 .2-3.59 1.7.52.59 1.03 1.23 1.51 1.9.82.08 1.63.2 2.4.36.51-2.14.32-3.61-.32-3.96m-.7 5.74l.29.51c.11-.29.22-.58.29-.86-.27-.06-.57-.11-.88-.16l.3.51m1.45-7.05c1.47.84 1.63 3.05 1.01 5.63 2.54.75 4.37 1.99 4.37 3.68s-1.83 2.93-4.37 3.68c.62 2.58.46 4.79-1.01 5.63-1.46.84-3.45-.12-5.37-1.95-1.92 1.83-3.91 2.79-5.38 1.95-1.46-.84-1.62-3.05-1-5.63-2.54-.75-4.37-1.99-4.37-3.68s1.83-2.93 4.37-3.68c-.62-2.58-.46-4.79 1-5.63 1.47-.84 3.46.12 5.38 1.95 1.92-1.83 3.91-2.79 5.37-1.95M17.08 12c.34.75.64 1.5.89 2.26 2.1-.63 3.28-1.53 3.28-2.26s-1.18-1.63-3.28-2.26c-.25.76-.55 1.51-.89 2.26M6.92 12c-.34-.75-.64-1.5-.89-2.26-2.1.63-3.28 1.53-3.28 2.26s1.18 1.63 3.28 2.26c.25-.76.55-1.51.89-2.26m9.55 4.54c.3-.03.59-.07.85-.13-.07-.28-.15-.56-.27-.87l-.29.51c-.29.49-.6.96-.91 1.41.19-.03.37-.07.55-.13.28-.06.54-.11.81-.17l.26-.62m-2.92 2.38c.38-.6.73-1.23 1.05-1.89-.32.02-.65.03-.98.03s-.66-.01-.98-.03c.32.66.67 1.29 1.05 1.89-.14-.35-.28-.71-.41-1.08.13.37.27.73.41 1.08-.38-.6-.73-1.23-1.05-1.89M16.63 20c.63-.38 2.01.2 3.6 1.7-.52-.59-1.03-1.23-1.51-1.9a22.7 22.7 0 01-2.4.36c.51-2.14.32-3.61-.31-3.96"/>
                </svg>
                <span className="text-xs font-semibold text-[#1e1e1e] opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute -bottom-8 whitespace-nowrap">
                  React
                </span>
              </motion.div>

              {/* Node.js */}
              <motion.div
                whileHover={{ scale: 1.2, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center gap-3 group relative flex-shrink-0"
              >
                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z M19.099,13.993 c0-1.9-1.284-2.406-3.987-2.763c-2.731-0.361-3.009-0.548-3.009-1.187c0-0.528,0.235-1.233,2.258-1.233 c1.807,0,2.473,0.389,2.747,1.607c0.024,0.115,0.129,0.199,0.247,0.199h1.141c0.071,0,0.138-0.031,0.186-0.081 c0.048-0.054,0.074-0.123,0.067-0.196c-0.177-2.098-1.571-3.076-4.388-3.076c-2.508,0-4.004,1.058-4.004,2.833 c0,1.925,1.488,2.457,3.895,2.695c2.88,0.282,3.103,0.703,3.103,1.269c0,0.983-0.789,1.402-2.642,1.402 c-2.327,0-2.839-0.584-3.011-1.742c-0.02-0.124-0.126-0.215-0.253-0.215h-1.137c-0.141,0-0.254,0.112-0.254,0.253 c0,1.482,0.806,3.248,4.655,3.248C17.501,17.007,19.099,15.91,19.099,13.993z"/>
                </svg>
                <span className="text-xs font-semibold text-[#1e1e1e] opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute -bottom-8 whitespace-nowrap">
                  Node.js
                </span>
              </motion.div>

              {/* TailwindCSS */}
              <motion.div
                whileHover={{ scale: 1.2, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center gap-3 group relative flex-shrink-0"
              >
                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 6c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.31.74 1.91 1.35.98 1 2.09 2.15 4.59 2.15 2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.91-1.35C15.61 7.15 14.5 6 12 6zM7 12c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.3.74 1.91 1.35C8.39 16.85 9.5 18 12 18c2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.91-1.35C10.61 13.15 9.5 12 7 12z"/>
                </svg>
                <span className="text-xs font-semibold text-[#1e1e1e] opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute -bottom-8 whitespace-nowrap">
                  TailwindCSS
                </span>
              </motion.div>

              {/* SQLite */}
              <motion.div
                whileHover={{ scale: 1.2, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center gap-3 group relative flex-shrink-0"
              >
                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.678 13.001c.268-.425.354-.904.237-1.356-.119-.449-.42-.835-.85-1.088l-8.203-4.815c-.572-.336-1.303-.336-1.875 0L2.785 10.557c-.43.253-.731.639-.85 1.088-.117.452-.031.931.237 1.356.268.425.697.697 1.178.747.063.008.126.012.188.012.42 0 .819-.152 1.125-.428l7.337-4.31 7.337 4.31c.306.276.705.428 1.125.428.062 0 .125-.004.188-.012.481-.05.91-.322 1.178-.747zM11.797 15.429L4.475 19.73c-.85.5-.85 1.754 0 2.254l7.322 4.301c.425.249.95.249 1.375 0l7.322-4.301c.85-.5.85-1.754 0-2.254l-7.322-4.301c-.425-.249-.95-.249-1.375 0z"/>
                </svg>
                <span className="text-xs font-semibold text-[#1e1e1e] opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute -bottom-8 whitespace-nowrap">
                  SQLite
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
      {/* FAQ Section - Standards.site Style */}
      <section className="py-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#002147] mb-3">
                Preguntas Frecuentes
              </h2>
              <div className="h-1 w-16 bg-[#D4AF37] mx-auto mb-4"></div>
              <p className="text-sm text-[#002147]/60">
                Pasa el cursor sobre cada pregunta para ver la respuesta
              </p>
            </motion.div>
          </div>

          {/* FAQ Buttons Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-6xl mx-auto"
          >
            {isLoadingFaqs ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#002147]" />
              </div>
            ) : faqs && faqs.length > 0 ? (
              <Accordion type="single" collapsible className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={faq.id} 
                    value={`item-${index + 1}`} 
                    className="border border-[#002147]/10 rounded-lg px-6 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <AccordionTrigger className="text-left font-semibold text-[#002147] hover:text-[#a51c30] py-6">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-[#002147]/80 leading-relaxed pb-6 whitespace-pre-wrap">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-12 text-[#002147]/60">
                No hay preguntas frecuentes disponibles en este momento.
              </div>
            )}

            {/* CTA después del FAQ */}
            <div className="mt-12 text-center p-8 bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl border-2 border-[#D4AF37]/20">
              <p className="text-lg text-[#002147] mb-4 font-semibold">
                ¿Tienes otra pregunta?
              </p>
              <p className="text-[#002147]/70 mb-6">
                Nuestro equipo está listo para ayudarte. Chatea con nosotros o reserva una asesoría gratuita.
              </p>
              <Button className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#002147] font-bold px-8 py-3">
                Hablar con un Asesor
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Harvard Clean Style */}
      <footer className="bg-gradient-to-br from-[#0a1628] via-[#0d1b2a] to-[#1b263b] border-t border-white/10 pt-24 pb-16">
        <div className="container-harvard">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-20">
            <div className="lg:col-span-5 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#D4AF37] flex items-center justify-center">
                  <GraduationCap className="text-[#0a1628] w-7 h-7" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-serif text-[24px] font-bold text-white leading-none">Barkley</span>
                  <span className="text-[10px] tracking-[0.5em] font-semibold text-[#D4AF37] uppercase mt-0.5">Instituto</span>
                </div>
              </div>
              <p className="text-base text-white/75 leading-[1.7] max-w-sm italic font-normal">
                "Cerrando la brecha entre la intención y el resultado mediante neurociencia aplicada."
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-12">
              {[
                { title: "Programas", links: ["Plan Focus", "Plan Impulso", "Stratmore"] },
                { title: "Método", links: ["Pilares", "Neurociencia", "Investigación"] },
                { title: "Legal", links: ["Privacidad", "Términos", "Cookies"] }
              ].map(col => (
                <div key={col.title} className="space-y-6">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a51c30]">{col.title}</h4>
                  <ul className="space-y-3">
                    {col.links.map(link => (
                      <li key={link}>
                        <a href="#" className="text-sm font-medium text-white/70 hover:text-[#D4AF37] transition-colors duration-200">{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-medium tracking-[0.15em] text-white/50 uppercase">
              © 2026 BLUE - Tutor IA. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6 text-[10px] font-medium tracking-[0.15em] text-white/50">
              <span>Neurociencia Aplicada</span>
              <div className="w-12 h-px bg-white/20" />
              <span>Chile</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-[#1e1e1e] text-white p-8 flex flex-col">
          <div className="flex justify-end mb-12">
            <button onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X className="w-8 h-8" />
            </button>
          </div>
          <div className="space-y-6">
            {['Programas', 'Método', 'Plataforma'].map(item => (
              <a key={item} href="#" className="block text-3xl font-serif font-bold border-b border-white/10 pb-4 hover:text-[#a51c30] transition-colors">{item}</a>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setReservationDialogOpen(true);
              }}
              className="block text-3xl font-serif font-bold border-b border-white/10 pb-4 hover:text-[#a51c30] transition-colors text-left w-full"
            >
              Reserva de Cupo
            </button>
          </div>
          <Button
            onClick={() => {
              setMobileMenuOpen(false);
              setReservationDialogOpen(true);
            }}
            className="mt-12 bg-[#a51c30] hover:bg-[#8a1828] h-14 text-base font-semibold rounded-none uppercase tracking-[0.15em]"
          >
            <Calendar className="mr-2 w-5 h-5" />
            Reservar Cupo
          </Button>
        </div>
      )}

      {/* Nosotros Dialog */}
      <Dialog open={nosotrosDialogOpen} onOpenChange={setNosotrosDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b border-[#002147]/10 pb-6">
            <DialogTitle className="text-4xl font-serif font-bold text-[#002147] text-center">
              Transformando el Futuro de la Educación en Chile
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-8 py-6 px-2">
            {/* Nuestra Identidad y Génesis */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-serif font-bold text-[#a51c30] flex items-center gap-3">
                <div className="w-1.5 h-8 bg-[#a51c30] rounded-full"></div>
                Nuestra Identidad y Génesis
              </h3>
              <div className="pl-6 space-y-4 text-[#1e1e1e]/80 leading-relaxed">
                <p>
                  <span className="font-bold text-[#002147]">Barkley Institute Online</span> es un ecosistema educativo de vanguardia diseñado para democratizar el acceso a una formación de alto nivel técnico y pedagógico. Formamos parte de <span className="font-semibold text-[#002147]">Stratmore Partners</span>, una organización dedicada a la investigación y desarrollo de soluciones tecnológicas aplicadas. Nuestra razón de ser es la integración inteligente de la Inteligencia Artificial y las metodologías activas en el proceso de enseñanza-aprendizaje, preparando a nuestros estudiantes para los desafíos de la era digital.
                </p>
                <p>
                  No nos limitamos a ser una plataforma de contenidos; somos una <span className="font-semibold text-[#002147]">comunidad de aprendizaje</span> orientada al dominio de competencias específicas, inspirada en los estándares de excelencia de instituciones líderes a nivel global, pero adaptada a la realidad y necesidades del contexto nacional.
                </p>
              </div>
            </motion.section>

            {/* Los Pilares */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4 bg-gradient-to-br from-[#002147]/[0.02] to-[#a51c30]/[0.02] p-6 rounded-xl border border-[#002147]/10"
            >
              <h3 className="text-2xl font-serif font-bold text-[#a51c30] flex items-center gap-3">
                <div className="w-1.5 h-8 bg-[#a51c30] rounded-full"></div>
                Los Pilares de la Experiencia Barkley
              </h3>
              <p className="pl-6 text-[#1e1e1e]/80 leading-relaxed">
                Nuestra propuesta se sostiene sobre tres ejes fundamentales que garantizan un estándar de calidad superior:
              </p>
              
              <div className="pl-6 space-y-6">
                {/* Pilar 1 */}
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-[#002147] flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#a51c30] text-white text-sm font-bold">1</span>
                    Trayectoria y Liderazgo Pedagógico
                  </h4>
                  <p className="text-[#1e1e1e]/80 leading-relaxed pl-10">
                    El Método Barkley surge de una síntesis de más de <span className="font-semibold text-[#002147]">20 años de experiencia estratégica</span> en el diseño curricular y la gestión académica de alto desempeño. Nuestra metodología integra estándares internacionales de liderazgo educativo y aprendizaje adaptativo, asegurando que la tecnología sea un vehículo para la excelencia pedagógica y no solo una herramienta. Esta base sólida garantiza que cada módulo de nuestro ecosistema inteligente esté diseñado para maximizar el potencial cognitivo y el éxito académico de nuestros estudiantes.
                  </p>
                </div>

                {/* Pilar 2 */}
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-[#002147] flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#a51c30] text-white text-sm font-bold">2</span>
                    Modelo de Dominio por Competencias
                  </h4>
                  <p className="text-[#1e1e1e]/80 leading-relaxed pl-10">
                    Rompemos con la rigidez del modelo tradicional basado exclusivamente en el tiempo. En Barkley, lo que importa es el <span className="font-semibold text-[#002147]">logro de aprendizajes significativos</span>. Nuestro enfoque permite que cada estudiante avance de forma personalizada, asegurando que el conocimiento se traduzca en habilidades prácticas y verificables.
                  </p>
                </div>

                {/* Pilar 3 */}
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-[#002147] flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#a51c30] text-white text-sm font-bold">3</span>
                    Acompañamiento Integral (Success Mentors)
                  </h4>
                  <p className="text-[#1e1e1e]/80 leading-relaxed pl-10">
                    Entendemos que la educación online requiere cercanía. Por ello, hemos implementado un sistema de <span className="font-semibold text-[#002147]">mentores dedicados al éxito del estudiante</span>. No solo entregamos herramientas, sino que brindamos el soporte estratégico y motivacional necesario para que cada alumno culmine su proceso con éxito.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Misión y Visión */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* Misión */}
              <div className="space-y-3 p-6 bg-gradient-to-br from-[#a51c30]/[0.05] to-transparent rounded-xl border border-[#a51c30]/20">
                <h3 className="text-xl font-serif font-bold text-[#a51c30] flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  Nuestra Misión
                </h3>
                <p className="text-[#1e1e1e]/80 leading-relaxed">
                  Proveer soluciones educativas ágiles, innovadoras y profundamente humanas que empoderen a las personas para liderar su propio desarrollo profesional. Buscamos eliminar las brechas de acceso a la educación de calidad a través del uso ético de la tecnología, permitiendo un <span className="font-semibold text-[#002147]">aprendizaje sin fronteras</span>.
                </p>
              </div>

              {/* Visión */}
              <div className="space-y-3 p-6 bg-gradient-to-br from-[#002147]/[0.05] to-transparent rounded-xl border border-[#002147]/20">
                <h3 className="text-xl font-serif font-bold text-[#002147] flex items-center gap-2">
                  <Brain className="w-6 h-6" />
                  Nuestra Visión
                </h3>
                <p className="text-[#1e1e1e]/80 leading-relaxed">
                  Consolidarnos como la <span className="font-semibold text-[#002147]">institución referente en educación online en Chile</span>, siendo reconocidos por nuestra capacidad de innovar en el diseño instruccional y por formar profesionales capaces de integrar la tecnología y el pensamiento crítico en sus respectivos campos de acción.
                </p>
              </div>
            </motion.div>

            {/* Footer con logo o firma */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="pt-6 border-t border-[#002147]/10 text-center"
            >
              <p className="text-sm text-[#1e1e1e]/60 italic">
                Parte de <span className="font-semibold text-[#002147]">Stratmore Partners</span>
              </p>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reservation Dialog */}
      <ReservationDialog open={reservationDialogOpen} onOpenChange={setReservationDialogOpen} />
    </div>
  );
}