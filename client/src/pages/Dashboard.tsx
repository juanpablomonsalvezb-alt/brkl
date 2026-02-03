import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Clock,
  Target,
  Brain,
  Play,
  TrendingUp,
  History,
  Calendar,
  AlertCircle,
  Lock,
  CheckCircle2,
  Menu,
  Plus,
  Video,
  FileUp,
  HelpCircle,
  Settings,
  Users,
  Database,
  ChevronRight,
  LogOut,
  Loader2,
  User,
  CloudDownload,
  ClipboardList,
  DollarSign,
  Sliders,
  Home,
  LinkIcon,
  Bot,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/use-profile";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Removed activeTab - now showing all levels together
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null);

  const scrollDown = () => {
    if (scrollContainerRef) {
      scrollContainerRef.scrollBy({ top: 300, behavior: 'smooth' });
    }
  };

  const scrollUp = () => {
    if (scrollContainerRef) {
      scrollContainerRef.scrollBy({ top: -300, behavior: 'smooth' });
    }
  };
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { isAdmin } = useProfile();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  /* Auth check temporarily disabled for development
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Acceso Requerido",
        description: "Ingresa con tu cuenta para acceder al panel...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isLoading, isAuthenticated, toast]);
  */

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto" />
          <p className="text-primary font-medium">Cargando Barkley Instituto...</p>
        </div>
      </div>
    );
  }

  // Allow access even if not authenticated for now
  // if (!isAuthenticated) {
  //   return null;
  // }

  // All levels together from 7° Básico to 4° Medio
  const allLevels = [
    { id: "7b", label: "7° Básico", subjects: ["Lengua y Literatura", "Matemática", "Ciencias Naturales", "Historia, Geografía y C. Sociales", "Inglés"], sessions: 15 },
    { id: "8b", label: "8° Básico", subjects: ["Lengua y Literatura", "Matemática", "Ciencias Naturales", "Historia, Geografía y C. Sociales", "Inglés"], sessions: 15 },
    { id: "1m", label: "1° Medio", subjects: ["Lengua y Literatura", "Matemática", "Ciencias Naturales (Bio, Fis, Quim)", "Historia, Geografía y C. Sociales", "Inglés"], sessions: 15 },
    { id: "2m", label: "2° Medio", subjects: ["Lengua y Literatura", "Matemática", "Ciencias Naturales (Bio, Fis, Quim)", "Historia, Geografía y C. Sociales", "Inglés"], sessions: 15 },
    { id: "3m", label: "3° Medio", subjects: ["Lengua y Literatura", "Matemática", "Educación Ciudadana", "Filosofía", "Ciencias para la Ciudadanía", "Inglés"], sessions: 15 },
    { id: "4m", label: "4° Medio", subjects: ["Lengua y Literatura", "Matemática", "Educación Ciudadana", "Filosofía", "Ciencias para la Ciudadanía", "Inglés"], sessions: 15 },
  ];

  const getSubjectSlug = (subjectName: string) => {
    return subjectName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
  };

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground">
      {/* Sidebar */}
      <aside className={cn(
        "bg-sidebar flex flex-col transition-all duration-500 border-r border-sidebar-border h-screen sticky top-0",
        isSidebarCollapsed ? "w-20" : "w-72"
      )}>
        <div className="p-6 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#A51C30] rounded-sm flex items-center justify-center shrink-0">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg font-bold text-white tracking-tight">Barkley</span>
                <span className="text-[9px] tracking-[0.2em] font-medium text-white/70 uppercase">Aula Virtual</span>
              </div>
            </div>
          )}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5 rounded-lg transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 mt-8 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-4 mb-4">Módulos Académicos</p>
          {[
            { icon: LayoutDashboard, label: "Mis Cursos", active: true, href: "/dashboard" },
            { icon: CloudDownload, label: "Recursos de Apoyo", active: false, href: "/drive-sync" },
            { icon: BookOpen, label: "Textos Escolares", active: false, href: "/textbook-config" },
            { icon: Database, label: "Material Complementario", active: false, href: "#" },
            { icon: Settings, label: "Mi Cuenta", active: false, href: "#" },
          ].map((item) => (
            <Link key={item.label} href={item.href}>
              <button className={cn("w-full flex items-center gap-4 p-3 rounded-xl transition-all group", item.active ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5")}>
                <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", item.active ? "text-white" : "group-hover:text-white")} />
                {!isSidebarCollapsed && <span className="text-[13px] font-medium">{item.label}</span>}
              </button>
            </Link>
          ))}
          
          {isAdmin && (
            <>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-4 mb-4 mt-8">Administración</p>
              <Link href="/reservations">
                <button className="w-full flex items-center gap-4 p-3 rounded-xl transition-all group text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5">
                  <ClipboardList className="w-5 h-5 shrink-0 transition-colors group-hover:text-white" />
                  {!isSidebarCollapsed && <span className="text-[13px] font-medium">Reservas de Cupo</span>}
                </button>
              </Link>
              <Link href="/barkley-admin">
                <button className="w-full flex items-center gap-4 p-3 rounded-xl transition-all group text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5">
                  <Sliders className="w-5 h-5 shrink-0 transition-colors group-hover:text-white" />
                  {!isSidebarCollapsed && <span className="text-[13px] font-medium">Panel Barkley Institute</span>}
                </button>
              </Link>
              <Link href="/evaluation-links-admin">
                <button className="w-full flex items-center gap-4 p-3 rounded-xl transition-all group text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5">
                  <LinkIcon className="w-5 h-5 shrink-0 transition-colors group-hover:text-white" />
                  {!isSidebarCollapsed && <span className="text-[13px] font-medium">Evaluaciones Gemini</span>}
                </button>
              </Link>
              <Link href="/gemini-copilots-admin">
                <button className="w-full flex items-center gap-4 p-3 rounded-xl transition-all group text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5">
                  <Bot className="w-5 h-5 shrink-0 transition-colors group-hover:text-white" />
                  {!isSidebarCollapsed && <span className="text-[13px] font-medium">Copilotos IA</span>}
                </button>
              </Link>
              <Link href="/level-plan-settings">
                <button className="w-full flex items-center gap-4 p-3 rounded-xl transition-all group text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5">
                  <DollarSign className="w-5 h-5 shrink-0 transition-colors group-hover:text-white" />
                  {!isSidebarCollapsed && <span className="text-[13px] font-medium">Planes por Nivel</span>}
                </button>
              </Link>
              <Link href="/faq-admin">
                <button className="w-full flex items-center gap-4 p-3 rounded-xl transition-all group text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5">
                  <HelpCircle className="w-5 h-5 shrink-0 transition-colors group-hover:text-white" />
                  {!isSidebarCollapsed && <span className="text-[13px] font-medium">Preguntas Frecuentes</span>}
                </button>
              </Link>
            </>
          )}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-muted/30">
        <header className="h-20 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-8 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight">Mis Cursos <span className="text-[#A51C30] italic font-normal">Académicos</span></h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                <span className="text-xs font-bold text-slate-600" data-testid="text-user-name">
                  {user.firstName || user.email || "Usuario"}
                </span>
              </div>
            )}
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-[9px] font-bold uppercase tracking-widest gap-2 hover:bg-primary/5 hover:text-primary">
                <Home className="w-4 h-4" /> Home
              </Button>
            </Link>
            <a href="/api/logout" data-testid="btn-logout">
              <Button variant="outline" size="sm" className="text-[9px] font-bold uppercase tracking-widest gap-2">
                <LogOut className="w-3 h-3" /> Salir
              </Button>
            </a>
            {isAdmin && (
              <Badge className="bg-accent text-white border-none rounded-full px-3 py-1 text-xs font-semibold" data-testid="badge-admin">Admin Mode</Badge>
            )}
          </div>
        </header>

        <div 
          ref={setScrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden relative" 
          style={{ overscrollBehavior: 'contain' }}
        >
          {/* Scroll Navigation Buttons */}
          <div className="fixed right-8 bottom-24 flex flex-col gap-2 z-50">
            <button
              onClick={scrollUp}
              className="p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-110"
              title="Subir"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              onClick={scrollDown}
              className="p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-110"
              title="Bajar"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          <motion.div
            className="p-8 lg:p-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
          <div className="max-w-7xl mx-auto space-y-12">
            <section className="space-y-8">
              <div className="border-b border-border pb-6">
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl font-serif font-bold text-foreground tracking-tight"
                >
                  Asignaturas por Nivel
                </motion.h2>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 80 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="h-1 bg-[#A51C30] mt-4 mb-2"
                />
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground mt-2 text-sm font-medium"
                >
                  Seleccione la asignatura para configurar rutas de aprendizaje y contenido
                </motion.p>
              </div>

              <div className="grid grid-cols-1 gap-12">
                {allLevels.map((course, courseIndex) => (
                  <motion.div
                    key={course.id}
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * courseIndex }}
                  >
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-bold text-foreground bg-white px-4 py-2 border border-border rounded-lg shadow-sm">{course.label}</h3>
                      <div className="h-px flex-1 bg-border"></div>
                      <Badge variant="outline" className="text-xs font-medium py-1 border-border text-muted-foreground rounded-lg">{course.sessions} Sesiones (2 sem/sesión)</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                      {course.subjects.map((sub, subIndex) => (
                        <Link key={sub} href={`/course/${course.id}-${getSubjectSlug(sub)}`}>
                          <motion.div
                            whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="h-full"
                          >
                            <Card className="p-6 bg-white border border-border/50 hover:border-accent/50 transition-colors group cursor-pointer rounded-xl h-full relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-[#A51C30] opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="space-y-4">
                                <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center group-hover:bg-[#A51C30]/10 transition-colors">
                                  <BookOpen className="w-5 h-5 text-muted-foreground group-hover:text-[#A51C30] transition-colors" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-foreground group-hover:text-[#A51C30] transition-colors leading-tight">{sub}</h4>
                                  <p className="text-xs font-medium text-muted-foreground mt-3 flex items-center">
                                    Entrar <ChevronRight className="w-3 h-3 ml-1" />
                                  </p>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Footer / Tip Section - Student Focused */}
            <motion.section
              className="bg-primary text-primary-foreground p-10 rounded-2xl relative overflow-hidden shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="absolute top-0 right-0 p-8 opacity-10"><Brain className="w-64 h-64" /></div>
              <div className="relative z-10 max-w-2xl space-y-4">
                <h3 className="text-2xl font-serif font-bold tracking-tight">Tu Metodología de Estudio</h3>
                <p className="text-base text-primary-foreground/90 leading-relaxed font-sans-safe">
                  Recuerda: El éxito no depende de tu fuerza de voluntad, sino de tu estrategia. Utiliza los cronómetros visuales en cada asignatura y respeta las ráfagas de 20 minutos de estudio intenso. Externaliza el tiempo para conquistarlo.
                </p>
                <div className="pt-4 flex gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium bg-white/10 px-4 py-2 rounded-lg">
                    <Clock className="w-4 h-4" /> 20 min estudio
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium bg-white/10 px-4 py-2 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" /> 5 min descanso
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}