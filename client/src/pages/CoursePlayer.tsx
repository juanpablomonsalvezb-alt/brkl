import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  Brain,
  Video,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Headphones,
  Map,
  Presentation,
  Loader2,
  FileText,
  ClipboardCheck,
  Check,
  Lock,
  Upload,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { TextbookViewer } from "@/components/TextbookViewer";
import { EvaluationQuiz } from "@/components/EvaluationQuiz";
import { GeminiCopilotButton } from "@/components/GeminiCopilotButton";
import {
  AreaChart, Area,
  PieChart, Pie, Cell,
  BarChart, Bar,
  ResponsiveContainer,
  XAxis, YAxis, Tooltip
} from "recharts";

export default function CoursePlayer() {
  const [, params] = useRoute("/course/:id");
  const courseId = params?.id || "";
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const parts = courseId.split("-");
  const levelCode = parts[0];
  const subjectLabel = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");

  const levelNames: Record<string, string> = {
    "7b": "7° Básico", "8b": "8° Básico",
    "1m": "1° Medio", "2m": "2° Medio", "3m": "3° Medio", "4m": "4° Medio",
    "nm1": "NM1", "nm2": "NM2"
  };
  const levelSubjectName = `${levelNames[levelCode] || levelCode} - ${subjectLabel}`;

  const [currentModule, setCurrentModule] = useState(1);
  const [currentEvaluation, setCurrentEvaluation] = useState(0);
  const [selectedResource, setSelectedResource] = useState<null | {
    title: string,
    embedUrl: string,
    embedType: "video" | "audio" | "infografia" | "presentacion",
    id: string
  }>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<null | {
    number: number;
    title: string;
    htmlContent: string;
    objectiveId: string;
  }>(null);
  const [quizData, setQuizData] = useState<null | {
    evaluationId: string;
    title: string;
    questions: { id: number; question: string; options: string[] }[];
    passingScore: number;
  }>(null);
  const [htmlInputValue, setHtmlInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingWord, setIsUploadingWord] = useState(false);
  const [isGeneratingEvaluations, setIsGeneratingEvaluations] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [carouselStart, setCarouselStart] = useState(0); // Start index for module carousel
  const queryClient = useQueryClient();

  const levels: Record<string, string> = {
    "7b": "7° Básico", "8b": "8° Básico", "1m": "1° Medio", "2m": "2° Medio",
    "3m": "3° Medio", "4m": "4° Medio", "nb1": "NB1 (1-4)", "nb2": "NB2 (5-6)",
    "nb3": "NB3 (7-8)", "nm1": "NM1 (1-2 Media)", "nm2": "NM2 (3-4 Media)", "nm2i": "NM2 Intensivo"
  };

  const levelName = levels[levelCode] || levelCode;

  const { data: textbookData } = useQuery<{
    textbookPdfUrl: string | null;
    textbookTitle: string | null;
    modulePages: { startPage: number | null; endPage: number | null } | null;
  }>({
    queryKey: ['/api/level-subjects', courseId, 'textbook', currentModule],
    queryFn: async () => {
      const res = await fetch(`/api/level-subjects/${courseId}/textbook?moduleNumber=${currentModule}`, {
        credentials: 'include'
      });
      if (!res.ok) return { textbookPdfUrl: null, textbookTitle: null, modulePages: null };
      return res.json();
    },
    enabled: !!courseId
  });

  const { data: calendarData } = useQuery<{
    modules: Array<{
      moduleNumber: number;
      startDate: string;
      endDate: string;
      status: string;
      startFormatted: string;
      endFormatted: string;
    }>;
  }>({
    queryKey: ['/api/level-subjects', courseId, 'calendar'],
    queryFn: async () => {
      const res = await fetch(`/api/level-subjects/${courseId}/calendar`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch calendar');
      return res.json();
    },
    enabled: !!courseId
  });

  const currentModuleData = calendarData?.modules?.find(m => m.moduleNumber === currentModule);
  const currentObjectiveId = (currentModuleData as any)?.objective?.id || "";

  const { data: profileData } = useQuery<{ role: string }>({
    queryKey: ['/api/profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile', { credentials: 'include' });
      if (!res.ok) return { role: 'student' };
      return res.json();
    },
    enabled: isAuthenticated
  });

  const isAdmin = true; // profileData?.role === 'admin';

  const { data: moduleInfo } = useQuery<{ moduleOAs: string | null; moduleContents: string | null; moduleDateRange: string | null }>({
    queryKey: ['/api/objectives', currentObjectiveId, 'module-info'],
    queryFn: async () => {
      if (!currentObjectiveId) return { moduleOAs: null, moduleContents: null, moduleDateRange: null };
      const res = await fetch(`/api/objectives/${currentObjectiveId}/module-info`, { credentials: 'include' });
      if (!res.ok) return { moduleOAs: null, moduleContents: null, moduleDateRange: null };
      return res.json();
    },
    enabled: !!currentObjectiveId // && isAuthenticated
  });

  const { data: moduleEvaluations } = useQuery<Array<{
    id: string;
    evaluationNumber: number;
    title: string;
    hasQuestions: boolean;
    totalQuestions: number | null;
    generatedAt: string | null;
  }>>({
    queryKey: ['/api/learning-objectives', currentObjectiveId, 'evaluations'],
    queryFn: async () => {
      if (!currentObjectiveId) return [];
      const res = await fetch(`/api/learning-objectives/${currentObjectiveId}/evaluations`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!currentObjectiveId // && isAuthenticated
  });

  const { data: objectiveResources } = useQuery<Array<{
    id: string;
    resourceType: string;
    title: string;
    notebookLmUrl: string | null;
  }>>({
    queryKey: ['/api/objectives', currentObjectiveId, 'resources'],
    queryFn: async () => {
      if (!currentObjectiveId) return [];
      const res = await fetch(`/api/objectives/${currentObjectiveId}/resources`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!currentObjectiveId // && isAuthenticated
  });

  const getResourceUrl = (type: string): string => {
    const resource = objectiveResources?.find(r => r.resourceType === type);
    return resource?.notebookLmUrl || "";
  };

  const resources = [
    { id: "video", title: "Video", icon: Video, color: "bg-red-500", embedUrl: getResourceUrl("video") },
    { id: "infografia", title: "Infografía", icon: Map, color: "bg-blue-500", embedUrl: getResourceUrl("infografia") },
    { id: "presentacion", title: "Presentación", icon: Presentation, color: "bg-emerald-500", embedUrl: getResourceUrl("presentacion") },
    { id: "audio", title: "Audio", icon: Headphones, color: "bg-orange-500", embedUrl: getResourceUrl("audio") },
  ];

  const getEvaluationDates = (moduleStartDate: string) => {
    const start = new Date(moduleStartDate);
    const evaluations = [];

    for (let week = 0; week < 2; week++) {
      const wednesday = new Date(start);
      wednesday.setDate(start.getDate() + (week * 7) + (3 - start.getDay() + 7) % 7);
      if (wednesday < start) wednesday.setDate(wednesday.getDate() + 7);

      const friday = new Date(wednesday);
      friday.setDate(wednesday.getDate() + 2);

      evaluations.push({
        number: week * 2 + 1,
        title: `Evaluación Formativa ${week * 2 + 1}`,
        date: wednesday,
        dayName: "Miércoles",
        htmlContent: ""
      });
      evaluations.push({
        number: week * 2 + 2,
        title: `Evaluación Formativa ${week * 2 + 2}`,
        date: friday,
        dayName: "Viernes",
        htmlContent: ""
      });
    }

    return evaluations;
  };

  const evaluations = currentModuleData ? getEvaluationDates(currentModuleData.startDate) : [];

  /* Auth check disabled for dev
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Acceso Requerido",
        description: "Ingresa con tu cuenta para acceder al curso...",
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
          <p className="text-primary font-medium">Cargando curso...</p>
        </div>
      </div>
    );
  }

  /*
  if (!isAuthenticated) {
    return null;
  }
  */

  const handleResourceClick = (res: typeof resources[0]) => {
    setSelectedResource({
      title: res.title,
      embedUrl: res.embedUrl || "",
      embedType: res.id as "video" | "audio" | "infografia" | "presentacion",
      id: res.id
    });
  };

  const handleEvaluationClick = async (evaluation: typeof evaluations[0]) => {
    const moduleEval = moduleEvaluations?.find(e => e.evaluationNumber === evaluation.number);

    if (moduleEval?.hasQuestions) {
      await startEvaluationQuiz(moduleEval.id);
      return;
    }

    let htmlContent = evaluation.htmlContent;

    if (currentObjectiveId) {
      try {
        const res = await fetch(`/api/evaluations/${currentObjectiveId}/${evaluation.number}/html`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          htmlContent = data.htmlContent || "";
        }
      } catch (e) {
        console.error("Error fetching evaluation HTML:", e);
      }
    }

    setSelectedEvaluation({
      number: evaluation.number,
      title: evaluation.title,
      htmlContent,
      objectiveId: currentObjectiveId
    });
    setHtmlInputValue("");
  };

  const handleSaveEvaluationHtml = async () => {
    if (!selectedEvaluation || !htmlInputValue.trim() || !currentObjectiveId) {
      toast({
        title: "Error",
        description: "Debes ingresar el código HTML",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/evaluations/${currentObjectiveId}/${selectedEvaluation.number}/html`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ htmlContent: htmlInputValue })
      });

      if (!res.ok) throw new Error('Failed to save');

      toast({
        title: "Guardado",
        description: "El HTML de la evaluación ha sido guardado correctamente"
      });

      setSelectedEvaluation({
        ...selectedEvaluation,
        htmlContent: htmlInputValue
      });
      setHtmlInputValue("");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el HTML",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleWordUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !courseId) {
      toast({
        title: "Error",
        description: "Selecciona un archivo Word válido",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingWord(true);
    try {
      const formData = new FormData();
      formData.append('wordDoc', file);

      const res = await fetch(`/api/admin/level-subjects/${courseId}/word-upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!res.ok) throw new Error('Failed to upload');

      const data = await res.json();

      toast({
        title: "Documento procesado",
        description: `Se actualizaron ${data.modulesUpdated} módulos correctamente`
      });

      queryClient.invalidateQueries({ queryKey: ['/api/objectives', currentObjectiveId, 'module-info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/level-subjects', courseId, 'calendar'] });

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar el documento Word",
        variant: "destructive"
      });
    } finally {
      setIsUploadingWord(false);
      event.target.value = '';
    }
  };

  const handleGenerateEvaluations = async () => {
    if (!currentObjectiveId) {
      toast({
        title: "Error",
        description: "No hay un módulo seleccionado",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingEvaluations(true);
    setGenerationProgress({ current: 0, total: 4 });

    try {
      const res = await fetch(`/api/admin/learning-objectives/${currentObjectiveId}/generate-evaluations`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to generate evaluations');

      const data = await res.json();
      const successCount = data.results?.filter((r: any) => r.success).length || 0;

      toast({
        title: "Evaluaciones Generadas",
        description: `Se generaron ${successCount} evaluaciones para el Módulo ${currentModule} con IA`
      });

      queryClient.invalidateQueries({ queryKey: ['/api/objectives', currentObjectiveId, 'module-info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning-objectives', currentObjectiveId, 'evaluations'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron generar las evaluaciones",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingEvaluations(false);
      setGenerationProgress(null);
    }
  };

  const convertToEmbedUrl = (url: string, resourceType?: string): string => {
    if (!url) return "";
    if (url.includes("drive.google.com/file/d/")) {
      const fileId = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
      if (fileId) {
        // For images (infografia), use thumbnail URL which works better
        if (resourceType === "infografia") {
          return `https://lh3.googleusercontent.com/d/${fileId}`;
        }
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    if (url.includes("docs.google.com/presentation")) {
      return url.replace("/edit", "/embed").replace("/pub", "/embed");
    }
    return url;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
  };

  const nextEvaluation = () => {
    setCurrentEvaluation((prev) => (prev + 1) % evaluations.length);
  };

  const prevEvaluation = () => {
    setCurrentEvaluation((prev) => (prev - 1 + evaluations.length) % evaluations.length);
  };

  const startEvaluationQuiz = async (evaluationId: string) => {
    setLoadingQuiz(true);
    try {
      const res = await fetch(`/api/evaluations/${evaluationId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load evaluation');
      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        setQuizData({
          evaluationId: data.id,
          title: data.title,
          questions: data.questions,
          passingScore: data.passingScore || 60
        });
      } else {
        toast({
          title: "Sin preguntas",
          description: "Esta evaluación aún no tiene preguntas generadas",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la evaluación",
        variant: "destructive"
      });
    } finally {
      setLoadingQuiz(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
        <header className="h-16 bg-primary text-primary-foreground flex items-center justify-between px-8 shrink-0 border-b border-primary/20 sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/70 hover:text-white transition-colors" data-testid="back-button">
                <ArrowLeft className="w-4 h-4" /> Volver a Intranet
              </button>
            </Link>
            <div className="h-4 w-px bg-white/20"></div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-primary-foreground/90">{levelName} / {subjectLabel}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-[1600px] mx-auto">

            {/* Título del curso */}
            {/* Título del curso */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-[#A51C30]/10 text-[#A51C30] hover:bg-[#A51C30]/20 border-[#A51C30]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md">{levelName}</Badge>
                <span className="text-sm text-slate-500 font-medium">Programa 2026</span>
              </div>
              <h1 className="text-4xl font-serif font-bold text-[#1e1e1e] tracking-tight">{subjectLabel}</h1>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* LEFT SIDEBAR: Módulos List */}
              <div className="w-full lg:w-80 shrink-0 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-[#0A192F] to-[#1a365d] p-3 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Temario</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const el = document.getElementById('module-list');
                          if (el) el.scrollBy({ top: -150, behavior: 'smooth' });
                        }}
                        className="p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <ChevronLeft className="w-3 h-3 text-white rotate-90" />
                      </button>
                      <button
                        onClick={() => {
                          const el = document.getElementById('module-list');
                          if (el) el.scrollBy({ top: 150, behavior: 'smooth' });
                        }}
                        className="p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <ChevronRight className="w-3 h-3 text-white rotate-90" />
                      </button>
                    </div>
                  </div>
                  <div id="module-list" className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto scroll-smooth">
                    {(() => {
                      // Build items: 15 modules + 2 evaluation weeks
                      const items: Array<{ type: 'module' | 'evaluation'; number?: number; title: string; dateRange: string; afterModule?: number }> = [];

                      for (let i = 1; i <= 15; i++) {
                        const moduleData = calendarData?.modules?.find(m => m.moduleNumber === i);
                        items.push({
                          type: 'module',
                          number: i,
                          title: `Módulo ${i}`,
                          dateRange: (moduleData as any)?.dateRangeFormatted || (moduleData as any)?.startFormatted || ""
                        });

                        // Add evaluation week after module 7
                        if (i === 7) {
                          items.push({
                            type: 'evaluation',
                            title: 'Evaluaciones Generales',
                            dateRange: 'Semestre 1',
                            afterModule: 7
                          });
                        }
                      }

                      // Add final evaluation week after module 15
                      items.push({
                        type: 'evaluation',
                        title: 'Evaluaciones Finales',
                        dateRange: 'Cierre Programa',
                        afterModule: 15
                      });

                      return items.map((item) => {
                        if (item.type === 'evaluation') {
                          return (
                            <div
                              key={`eval-${item.afterModule}`}
                              className="p-3 bg-amber-50 flex items-center gap-3"
                            >
                              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                <ClipboardCheck className="w-4 h-4 text-amber-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-amber-800">{item.title}</p>
                                <p className="text-[10px] text-amber-600">{item.dateRange}</p>
                              </div>
                            </div>
                          );
                        }

                        const moduleNum = item.number!;
                        const moduleData = calendarData?.modules?.find(m => m.moduleNumber === moduleNum);
                        const isCompleted = moduleData?.status === 'completed';
                        const isCurrent = moduleNum === currentModule;

                        return (
                          <button
                            key={`module-${moduleNum}`}
                            onClick={() => setCurrentModule(moduleNum)}
                            className={cn(
                              "w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-center gap-3",
                              isCurrent && "bg-[#A51C30]/5 hover:bg-[#A51C30]/10 border-l-4 border-l-[#A51C30]"
                            )}
                            data-testid={`sidebar-module-${moduleNum}`}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                              isCompleted ? "bg-emerald-100 text-emerald-700" :
                                isCurrent ? "bg-[#A51C30] text-white" : "bg-slate-100 text-slate-400"
                            )}>
                              {isCompleted ? <Check className="w-4 h-4" /> : moduleNum}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-bold mb-0.5", isCurrent ? "text-[#A51C30]" : "text-slate-600")}>
                                Módulo {moduleNum}
                              </p>
                              <p className="text-xs text-slate-500">{item.dateRange}</p>
                            </div>
                            <div className={cn(
                              "text-[9px] px-2 py-0.5 rounded-full font-medium shrink-0",
                              isCompleted ? "bg-emerald-100 text-emerald-700" :
                                isCurrent ? "bg-[#A51C30]/10 text-[#A51C30]" : "bg-slate-100 text-slate-400"
                            )}>
                              {isCompleted ? "✓" : isCurrent ? "●" : "○"}
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* CENTER CONTENT: Main Area */}
              <div className="flex-1 min-w-0 space-y-6">
                {/* Admin Controls - Solo admin */}
                {isAdmin && (
                  <div className="bg-white border border-slate-200 p-4 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-[#0A192F]">Planificación del Programa</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Sube un documento Word con la tabla de módulos, fechas, OAs y contenidos
                        </p>
                      </div>
                      <label
                        className="flex items-center gap-2 px-4 py-2 bg-[#A51C30] hover:bg-[#821626] text-white cursor-pointer transition-colors text-sm"
                        data-testid="word-upload-button"
                      >
                        {isUploadingWord ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Subir Word
                          </>
                        )}
                        <input
                          type="file"
                          accept=".docx,.doc"
                          onChange={handleWordUpload}
                          disabled={isUploadingWord}
                          className="hidden"
                          data-testid="word-upload-input"
                        />
                      </label>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-[#0A192F]">Generar Evaluaciones con IA</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Genera 4 evaluaciones formativas (15-20 preguntas c/u) para el Módulo {currentModule}
                          </p>
                        </div>
                        <Button
                          onClick={handleGenerateEvaluations}
                          disabled={isGeneratingEvaluations || !currentObjectiveId}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                          data-testid="generate-evaluations-button"
                        >
                          {isGeneratingEvaluations ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Generar con IA
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* CUADRO DEL MÓDULO ACTUAL */}
                <Card className="bg-white shadow-soft border border-border/50 overflow-hidden rounded-2xl">
                  <div className="h-1.5 bg-gradient-to-r from-accent/80 to-accent" />
                  <div className="p-8 lg:p-12 text-center space-y-6">
                    <Badge className="bg-muted text-foreground border-border/50 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase">
                      Módulo {currentModule}
                    </Badge>

                    <h2 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                      Contenidos del Módulo {currentModule}
                    </h2>

                    {currentModuleData && (
                      <p className="text-sm font-medium text-muted-foreground">
                        {moduleInfo?.moduleDateRange || `${currentModuleData.startFormatted} — ${currentModuleData.endFormatted}`}
                      </p>
                    )}

                    {(moduleInfo?.moduleOAs || moduleInfo?.moduleContents) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                        {moduleInfo?.moduleOAs && (
                          <div className="text-left bg-muted/30 p-6 border border-border/50 rounded-xl hover:bg-muted/50 transition-colors">
                            <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-3">Objetivos de Aprendizaje</h4>
                            <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">{moduleInfo.moduleOAs}</p>
                          </div>
                        )}

                        {moduleInfo?.moduleContents && (
                          <div className="text-left bg-muted/30 p-6 border border-border/50 rounded-xl hover:bg-muted/50 transition-colors">
                            <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-3">Contenidos</h4>
                            <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">{moduleInfo.moduleContents}</p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </Card>


                {/* 4 RECURSOS DIDÁCTICOS */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-[#A51C30]" />
                    <h3 className="text-lg font-bold text-[#0A192F]">Recursos Didácticos</h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {resources.map((res) => (
                      <button
                        key={res.id}
                        onClick={() => handleResourceClick(res)}
                        className="p-6 bg-white border border-border/50 hover:border-accent hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center gap-4 group rounded-2xl"
                        data-testid={`resource-${res.id}`}
                      >
                        <div className={cn(
                          "w-14 h-14 flex items-center justify-center text-white rounded-xl shadow-md",
                          res.color
                        )}>
                          <res.icon className="w-7 h-7" />
                        </div>
                        <span className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">
                          {res.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* LIBRO DE TEXTO DEL MÓDULO */}
                {textbookData?.textbookPdfUrl && textbookData?.modulePages?.startPage && textbookData?.modulePages?.endPage && (
                  <div className="mt-8">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-2 bg-[#A51C30]/10 rounded-lg">
                        <BookOpen className="w-5 h-5 text-[#A51C30]" />
                      </div>
                      <h3 className="text-lg font-bold text-[#0A192F]">Libro de Texto del Módulo</h3>
                      <Badge className="bg-blue-100 text-blue-700 rounded-full text-[10px] ml-2 px-3">
                        Páginas {textbookData.modulePages.startPage}-{textbookData.modulePages.endPage}
                      </Badge>
                    </div>
                    <TextbookViewer
                      pdfUrl={textbookData.textbookPdfUrl}
                      title={textbookData.textbookTitle || "Texto Escolar"}
                      startPage={textbookData.modulePages.startPage}
                      endPage={textbookData.modulePages.endPage}
                      moduleNumber={currentModule}
                    />
                  </div>
                )}

                {/* EVALUACIONES FORMATIVAS EN CARRUSEL */}
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <ClipboardCheck className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Evaluaciones Formativas</h3>
                    <Badge className="bg-muted text-muted-foreground rounded-full text-[10px] ml-2 px-3">
                      4 evaluaciones por módulo
                    </Badge>
                  </div>

                  {/* Carrusel de evaluaciones */}
                  <div className="bg-white border border-border/50 p-8 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full w-10 h-10 shrink-0 hover:bg-muted"
                        onClick={prevEvaluation}
                        data-testid="prev-evaluation"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>

                      <div className="flex-1 mx-8">
                        {evaluations.length > 0 && (
                          <div
                            className="text-center cursor-pointer hover:bg-muted/30 p-6 rounded-xl transition-all border border-transparent hover:border-border/50"
                            onClick={() => handleEvaluationClick(evaluations[currentEvaluation])}
                            data-testid={`evaluation-carousel-${evaluations[currentEvaluation]?.number}`}
                          >
                            <div className="w-16 h-16 bg-accent/10 flex items-center justify-center mx-auto mb-4 rounded-2xl">
                              <FileText className="w-8 h-8 text-accent" />
                            </div>
                            <p className="text-xl font-bold text-foreground tracking-tight">
                              {evaluations[currentEvaluation]?.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2 font-medium">
                              {evaluations[currentEvaluation]?.dayName} {formatDate(evaluations[currentEvaluation]?.date)}
                            </p>
                            {moduleEvaluations?.find(e => e.evaluationNumber === evaluations[currentEvaluation]?.number)?.hasQuestions ? (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none rounded-full text-xs mt-4 px-3 py-1">
                                <Sparkles className="w-3 h-3 mr-1" />
                                IA • {moduleEvaluations?.find(e => e.evaluationNumber === evaluations[currentEvaluation]?.number)?.totalQuestions} preguntas
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none rounded-full text-xs mt-4 px-3 py-1">
                                Clic para abrir
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full w-10 h-10 shrink-0 hover:bg-muted"
                        onClick={nextEvaluation}
                        data-testid="next-evaluation"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Indicadores del carrusel */}
                    <div className="flex justify-center gap-2 mt-6">
                      {evaluations.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentEvaluation(idx)}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            idx === currentEvaluation ? "bg-accent w-6" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                          )}
                          data-testid={`evaluation-dot-${idx}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT METRICS PANEL */}
              <div className="hidden xl:block w-72 shrink-0 space-y-4">
                {/* Academic Copilot Button */}
                <div className="sticky top-4">
                  <GeminiCopilotButton levelId={levelCode} variant="sidebar" />
                </div>

                {/* Progress Chart */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Avance Total</h4>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width={130} height={130}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Completado', value: Math.round((calendarData?.modules?.filter((m: any) => m.status === 'completed').length || 0) / 15 * 100) || 7 },
                            { name: 'Pendiente', value: 100 - (Math.round((calendarData?.modules?.filter((m: any) => m.status === 'completed').length || 0) / 15 * 100) || 7) }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={55}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="#A51C30" />
                          <Cell fill="#e2e8f0" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center -mt-2">
                    <span className="text-3xl font-bold text-[#A51C30]">
                      {Math.round((calendarData?.modules?.filter((m: any) => m.status === 'completed').length || 0) / 15 * 100) || 7}%
                    </span>
                    <p className="text-xs text-slate-500">de la asignatura</p>
                  </div>
                </div>

                {/* Connection Time Chart */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tiempo de Conexión</h4>
                  <ResponsiveContainer width="100%" height={90}>
                    <AreaChart data={[
                      { day: 'L', hours: 2.5 },
                      { day: 'M', hours: 1.8 },
                      { day: 'X', hours: 3.2 },
                      { day: 'J', hours: 2.1 },
                      { day: 'V', hours: 4.5 },
                      { day: 'S', hours: 1.2 },
                      { day: 'D', hours: 0.5 },
                    ]}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A51C30" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#A51C30" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ background: '#0A192F', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: number) => [`${value}h`, 'Tiempo']}
                      />
                      <Area type="monotone" dataKey="hours" stroke="#A51C30" strokeWidth={2} fill="url(#colorHours)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="text-center mt-2">
                    <span className="text-2xl font-bold text-slate-700">15.8h</span>
                    <p className="text-xs text-slate-500">esta semana</p>
                  </div>
                </div>

                {/* Evaluations Average */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Promedio Evaluaciones</h4>
                  <ResponsiveContainer width="100%" height={75}>
                    <BarChart data={[
                      { eval: 'E1', score: 85 },
                      { eval: 'E2', score: 72 },
                      { eval: 'E3', score: 90 },
                      { eval: 'E4', score: 78 },
                    ]}>
                      <XAxis dataKey="eval" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ background: '#0A192F', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value: number) => [`${value}%`, 'Nota']}
                      />
                      <Bar dataKey="score" fill="#A51C30" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="text-center mt-2">
                    <span className="text-2xl font-bold text-emerald-600">81%</span>
                    <p className="text-xs text-slate-500">promedio general</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={selectedResource !== null} onOpenChange={() => setSelectedResource(null)}>
        <DialogContent className="max-w-5xl w-[90vw] h-[85vh] p-0 border-none bg-white flex flex-col overflow-hidden [&>button]:text-white [&>button]:hover:bg-white/20 [&>button]:top-4 [&>button]:right-4">
          {/* Institutional Header with accent bar */}
          <div className="shrink-0">
            <div className="h-1 bg-gradient-to-r from-[#A51C30] via-[#C41E3A] to-[#A51C30]" />
            <DialogHeader className="px-6 py-4 bg-[#0A192F]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#A51C30] flex items-center justify-center shrink-0">
                  {selectedResource?.embedType === "video" && <Video className="w-6 h-6 text-white" />}
                  {selectedResource?.embedType === "audio" && <Headphones className="w-6 h-6 text-white" />}
                  {selectedResource?.embedType === "presentacion" && <Presentation className="w-6 h-6 text-white" />}
                  {selectedResource?.embedType === "infografia" && <Map className="w-6 h-6 text-white" />}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <DialogTitle className="text-xl font-serif font-bold text-white">{selectedResource?.title}</DialogTitle>
                  <p className="text-sm text-slate-300 mt-1">
                    {(currentModuleData as any)?.objective?.title || `Módulo ${currentModule}`}
                    {moduleInfo?.moduleContents && (
                      <span className="block text-xs text-slate-400 mt-0.5 truncate">
                        {moduleInfo.moduleContents.split('\n')[0]}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[#A51C30] font-medium mt-1">
                    {levelSubjectName} • Instituto Barkley
                  </p>
                </div>
              </div>
              <DialogDescription className="sr-only">
                Recurso didáctico del módulo {currentModule}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 w-full bg-black relative overflow-hidden">
            {selectedResource?.embedUrl ? (
              selectedResource.embedType === "infografia" ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 p-4">
                  <img
                    src={convertToEmbedUrl(selectedResource.embedUrl, "infografia")}
                    alt={selectedResource.title}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = '<iframe src="' + convertToEmbedUrl(selectedResource.embedUrl) + '" class="w-full h-full border-0" allowFullScreen></iframe>';
                    }}
                  />
                </div>
              ) : (
                <iframe
                  src={convertToEmbedUrl(selectedResource.embedUrl, selectedResource.embedType)}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  title={selectedResource.title}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-6 bg-slate-50">
                <div className="w-20 h-20 bg-slate-200 flex items-center justify-center rounded-lg">
                  {selectedResource?.embedType === "video" && <Video className="w-10 h-10 text-slate-400" />}
                  {selectedResource?.embedType === "audio" && <Headphones className="w-10 h-10 text-slate-400" />}
                  {selectedResource?.embedType === "presentacion" && <Presentation className="w-10 h-10 text-slate-400" />}
                  {selectedResource?.embedType === "infografia" && <Map className="w-10 h-10 text-slate-400" />}
                </div>

                <div className="space-y-2 max-w-md">
                  <h3 className="text-xl font-bold text-[#0A192F]">Recurso Pendiente</h3>
                  <p className="text-sm text-slate-500">
                    Este recurso aún no ha sido configurado. El administrador debe agregar el enlace correspondiente.
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog >

      {/* Evaluation Modal with HTML content */}
      < Dialog open={selectedEvaluation !== null} onOpenChange={() => setSelectedEvaluation(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 rounded-none border-none bg-white overflow-hidden">
          <DialogHeader className="p-6 border-b border-slate-100 shrink-0 bg-[#F8F9FA]">
            <DialogTitle className="text-xl font-serif font-bold text-[#0A192F]">
              {selectedEvaluation?.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Módulo {currentModule} • Evaluación formativa generada por Gemini
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {selectedEvaluation?.htmlContent ? (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedEvaluation.htmlContent }}
              />
            ) : (
              <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 bg-[#A51C30]/10 flex items-center justify-center mx-auto">
                  <FileText className="w-10 h-10 text-[#A51C30]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#0A192F]">Evaluación Pendiente</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Esta evaluación aún no tiene contenido. El administrador debe pegar el código HTML generado por Gemini.
                  </p>
                </div>

                {isAdmin && (
                  <div className="bg-slate-50 border border-slate-200 p-6 max-w-lg mx-auto text-left">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                      Pegar código HTML de Gemini aquí:
                    </label>
                    <textarea
                      className="w-full h-32 border border-slate-300 p-3 text-sm font-mono resize-none focus:outline-none focus:border-[#A51C30]"
                      placeholder="<div>...</div>"
                      value={htmlInputValue}
                      onChange={(e) => setHtmlInputValue(e.target.value)}
                      data-testid="evaluation-html-input"
                    />
                    <Button
                      className="mt-3 bg-[#A51C30] hover:bg-[#821626] text-white rounded-none text-xs"
                      onClick={handleSaveEvaluationHtml}
                      disabled={isSaving || !htmlInputValue.trim()}
                      data-testid="save-evaluation-html"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar Evaluación"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog >


      {/* Quiz Modal for AI-generated evaluations */}
      {
        quizData && (
          <EvaluationQuiz
            evaluationId={quizData.evaluationId}
            title={quizData.title}
            questions={quizData.questions}
            passingScore={quizData.passingScore}
            onComplete={(result) => {
              toast({
                title: result.passed ? "¡Aprobado!" : "No Aprobado",
                description: `Obtuviste ${result.score}% (${result.totalCorrect}/${result.totalQuestions} correctas)`,
                variant: result.passed ? "default" : "destructive"
              });
              queryClient.invalidateQueries({ queryKey: ['/api/learning-objectives', currentObjectiveId, 'evaluations'] });
            }}
            onClose={() => setQuizData(null)}
          />
        )
      }
    </>
  );
}
