import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, RefreshCw, DollarSign, BookOpen, AlertCircle, Users, GraduationCap, Calculator } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
}

interface AdultCycleConfiguration {
  id: string;
  cycleKey: string;
  cycleName: string;
  monthlyPrice: number;
  enrollmentPrice: number;
  totalPrice: number;
  durationMonths: number;
  modulesCount: number;
  quizzesTotal: number;
  essaysCount: number;
  academicLoad: string | null;
  basicaDS10: string | null;
  basicaDS257: string | null;
  mediaDS257: string | null;
}

interface SiteConfiguration {
  id: string;
  configKey: string;
  configValue: string;
  configType: string;
  description: string | null;
}

export default function BarkleyAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all data
  const { data: youthPlans = [], isLoading: loadingYouth } = useQuery<PlanConfiguration[]>({
    queryKey: ["/api/plans"],
  });

  const { data: adultCycles = [], isLoading: loadingAdult } = useQuery<AdultCycleConfiguration[]>({
    queryKey: ["/api/adult-cycles"],
  });

  const { data: siteConfigs = [], isLoading: loadingConfig } = useQuery<SiteConfiguration[]>({
    queryKey: ["/api/site-config"],
  });

  // Local state for editing
  const [editedYouthPlans, setEditedYouthPlans] = useState<Record<string, PlanConfiguration>>({});
  const [editedAdultCycles, setEditedAdultCycles] = useState<Record<string, AdultCycleConfiguration>>({});
  const [editedConfigs, setEditedConfigs] = useState<Record<string, string>>({});

  // Initialize edited state when data loads
  useEffect(() => {
    const plansMap: Record<string, PlanConfiguration> = {};
    youthPlans.forEach(plan => {
      plansMap[plan.id] = { ...plan };
    });
    setEditedYouthPlans(plansMap);
  }, [youthPlans]);

  useEffect(() => {
    const cyclesMap: Record<string, AdultCycleConfiguration> = {};
    adultCycles.forEach(cycle => {
      cyclesMap[cycle.id] = { ...cycle };
    });
    setEditedAdultCycles(cyclesMap);
  }, [adultCycles]);

  useEffect(() => {
    const configsMap: Record<string, string> = {};
    siteConfigs.forEach(config => {
      configsMap[config.configKey] = config.configValue;
    });
    setEditedConfigs(configsMap);
  }, [siteConfigs]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calculate youth plan annual total (8 months)
  const calculateYouthTotal = (monthly: number, enrollment: number) => {
    return (monthly * 8) + enrollment;
  };

  // Calculate adult cycle total
  const calculateAdultTotal = (monthly: number, enrollment: number, months: number) => {
    return (monthly * months) + enrollment;
  };

  // Calculate quizzes based on modules (4 quizzes per module)
  const calculateQuizzes = (modules: number) => {
    return modules * 4;
  };

  // Update youth plan mutation
  const updateYouthPlanMutation = useMutation({
    mutationFn: async (plan: PlanConfiguration) => {
      const response = await fetch(`/api/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Error al actualizar plan");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({
        title: "Plan actualizado",
        description: "Los cambios han sido guardados correctamente.",
      });
    },
  });

  // Update adult cycle mutation
  const updateAdultCycleMutation = useMutation({
    mutationFn: async (cycle: AdultCycleConfiguration) => {
      const response = await fetch(`/api/adult-cycles/${cycle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cycle),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Error al actualizar ciclo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adult-cycles"] });
      toast({
        title: "Ciclo actualizado",
        description: "Los cambios han sido guardados correctamente.",
      });
    },
  });

  // Update site config mutation
  const updateSiteConfigMutation = useMutation({
    mutationFn: async (config: { configKey: string; configValue: string; configType: string; description?: string }) => {
      const response = await fetch("/api/site-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Error al actualizar configuración");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-config"] });
      toast({
        title: "Configuración actualizada",
        description: "Los cambios han sido guardados correctamente.",
      });
    },
  });

  // Initialize all defaults
  const initializeAllMutation = useMutation({
    mutationFn: async () => {
      const promises = [
        fetch("/api/plans/initialize", { method: "POST", credentials: "include" }),
        fetch("/api/adult-cycles/initialize", { method: "POST", credentials: "include" }),
        fetch("/api/site-config/initialize", { method: "POST", credentials: "include" }),
      ];
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/adult-cycles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-config"] });
      toast({
        title: "Sistema inicializado",
        description: "Todas las configuraciones por defecto han sido creadas.",
      });
    },
  });

  // Handle youth plan field change
  const updateYouthPlanField = (planId: string, field: keyof PlanConfiguration, value: any) => {
    setEditedYouthPlans(prev => {
      const updated = { ...prev };
      if (updated[planId]) {
        updated[planId] = { ...updated[planId], [field]: value };
        
        // Auto-calculate annual total if monthly or enrollment changes
        if (field === "monthlyPrice" || field === "enrollmentPrice") {
          updated[planId].annualTotal = calculateYouthTotal(
            field === "monthlyPrice" ? value : updated[planId].monthlyPrice,
            field === "enrollmentPrice" ? value : updated[planId].enrollmentPrice
          );
        }
      }
      return updated;
    });
  };

  // Handle adult cycle field change
  const updateAdultCycleField = (cycleId: string, field: keyof AdultCycleConfiguration, value: any) => {
    setEditedAdultCycles(prev => {
      const updated = { ...prev };
      if (updated[cycleId]) {
        updated[cycleId] = { ...updated[cycleId], [field]: value };
        
        // Auto-calculate total if monthly, enrollment, or duration changes
        if (field === "monthlyPrice" || field === "enrollmentPrice" || field === "durationMonths") {
          updated[cycleId].totalPrice = calculateAdultTotal(
            field === "monthlyPrice" ? value : updated[cycleId].monthlyPrice,
            field === "enrollmentPrice" ? value : updated[cycleId].enrollmentPrice,
            field === "durationMonths" ? value : updated[cycleId].durationMonths
          );
        }
        
        // Auto-calculate quizzes if modules change
        if (field === "modulesCount") {
          updated[cycleId].quizzesTotal = calculateQuizzes(value);
        }
      }
      return updated;
    });
  };

  // Save all changes
  const saveAllChanges = async () => {
    try {
      // Save youth plans
      const youthPromises = Object.values(editedYouthPlans).map(plan =>
        updateYouthPlanMutation.mutateAsync(plan)
      );
      
      // Save adult cycles
      const adultPromises = Object.values(editedAdultCycles).map(cycle =>
        updateAdultCycleMutation.mutateAsync(cycle)
      );
      
      // Save site configs
      const configPromises = Object.entries(editedConfigs).map(([key, value]) => {
        const original = siteConfigs.find(c => c.configKey === key);
        return updateSiteConfigMutation.mutateAsync({
          configKey: key,
          configValue: value,
          configType: original?.configType || "text",
          description: original?.description || undefined,
        });
      });
      
      await Promise.all([...youthPromises, ...adultPromises, ...configPromises]);
      
      toast({
        title: "¡Todo guardado!",
        description: "Todos los cambios han sido guardados correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al guardar algunos cambios.",
        variant: "destructive",
      });
    }
  };

  const isLoading = loadingYouth || loadingAdult || loadingConfig;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#002147]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-serif font-bold text-[#002147] mb-2">
              Panel de Administración - Barkley Institute
            </h1>
            <p className="text-[#002147]/70">
              Gestión completa de la oferta comercial para Landing Page
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/evaluaciones-perfil">
              <Button variant="outline" className="border-[#002147] text-[#002147]">
                <Users className="w-4 h-4 mr-2" />
                Perfiles y Evaluaciones 0..4
              </Button>
            </Link>
            {(youthPlans.length === 0 || adultCycles.length === 0) && (
              <Button
                onClick={() => initializeAllMutation.mutate()}
                disabled={initializeAllMutation.isPending}
                variant="outline"
                className="border-[#D4AF37] text-[#002147]"
              >
                {initializeAllMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Inicializando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Inicializar Datos
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={saveAllChanges}
              className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#002147] font-semibold"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Todos los Cambios
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="youth" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-[#002147]/10">
          <TabsTrigger value="youth" className="data-[state=active]:bg-[#002147] data-[state=active]:text-white">
            <GraduationCap className="w-4 h-4 mr-2" />
            Jóvenes (7° a 4° M)
          </TabsTrigger>
          <TabsTrigger value="adult" className="data-[state=active]:bg-[#002147] data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Adultos 2x1
          </TabsTrigger>
          <TabsTrigger value="notices" className="data-[state=active]:bg-[#002147] data-[state=active]:text-white">
            <AlertCircle className="w-4 h-4 mr-2" />
            Avisos
          </TabsTrigger>
          <TabsTrigger value="preview" className="data-[state=active]:bg-[#002147] data-[state=active]:text-white">
            <BookOpen className="w-4 h-4 mr-2" />
            Vista Previa
          </TabsTrigger>
        </TabsList>

        {/* YOUTH PLANS TAB */}
        <TabsContent value="youth" className="space-y-6">
          <Card className="border-[#002147]">
            <CardHeader className="bg-[#002147] text-white">
              <CardTitle className="text-2xl font-serif">Planes para Menores (7° a 4° Medio)</CardTitle>
              <CardDescription className="text-white/70">
                Edita los 3 planes principales para jóvenes. Total calculado automáticamente (8 meses).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {Object.values(editedYouthPlans).map((plan, idx) => (
                <Card key={plan.id} className="border-[#D4AF37]/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-[#002147]">{plan.planName}</CardTitle>
                      <Badge className="bg-[#D4AF37] text-[#002147]">Plan {idx + 1}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`youth-name-${plan.id}`} className="text-[#002147] font-semibold">
                          Nombre del Plan *
                        </Label>
                        <Input
                          id={`youth-name-${plan.id}`}
                          value={plan.planName}
                          onChange={(e) => updateYouthPlanField(plan.id, "planName", e.target.value)}
                          className="border-[#002147]/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`youth-subtitle-${plan.id}`} className="text-[#002147] font-semibold">
                          Subtítulo
                        </Label>
                        <Input
                          id={`youth-subtitle-${plan.id}`}
                          value={plan.planSubtitle || ""}
                          onChange={(e) => updateYouthPlanField(plan.id, "planSubtitle", e.target.value)}
                          className="border-[#002147]/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#D4AF37]/10 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor={`youth-monthly-${plan.id}`} className="text-[#002147] font-semibold flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Mensualidad *
                        </Label>
                        <Input
                          id={`youth-monthly-${plan.id}`}
                          type="number"
                          value={plan.monthlyPrice}
                          onChange={(e) => updateYouthPlanField(plan.id, "monthlyPrice", parseInt(e.target.value))}
                          className="border-[#002147]/30 font-mono"
                        />
                        <p className="text-xs text-[#002147]/60">{formatCurrency(plan.monthlyPrice)}</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`youth-enrollment-${plan.id}`} className="text-[#002147] font-semibold flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Matrícula *
                        </Label>
                        <Input
                          id={`youth-enrollment-${plan.id}`}
                          type="number"
                          value={plan.enrollmentPrice}
                          onChange={(e) => updateYouthPlanField(plan.id, "enrollmentPrice", parseInt(e.target.value))}
                          className="border-[#002147]/30 font-mono"
                        />
                        <p className="text-xs text-[#002147]/60">{formatCurrency(plan.enrollmentPrice)}</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[#002147] font-semibold flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Total Anual (8 meses)
                        </Label>
                        <div className="h-10 flex items-center justify-center bg-[#002147] text-white rounded-md font-bold text-lg">
                          {formatCurrency(plan.annualTotal || 0)}
                        </div>
                        <p className="text-xs text-[#002147]/60 text-center">Calculado automáticamente</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`youth-load-${plan.id}`} className="text-[#002147] font-semibold">
                          Carga Académica
                        </Label>
                        <Input
                          id={`youth-load-${plan.id}`}
                          value={plan.academicLoad || ""}
                          onChange={(e) => updateYouthPlanField(plan.id, "academicLoad", e.target.value)}
                          placeholder="15 Módulos"
                          className="border-[#002147]/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`youth-eval-${plan.id}`} className="text-[#002147] font-semibold">
                          Detalle de Evaluaciones
                        </Label>
                        <Input
                          id={`youth-eval-${plan.id}`}
                          value={plan.evaluationsDetail || ""}
                          onChange={(e) => updateYouthPlanField(plan.id, "evaluationsDetail", e.target.value)}
                          placeholder="75 Quizzes y 2 Ensayos por asignatura"
                          className="border-[#002147]/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`youth-subjects-${plan.id}`} className="text-[#002147] font-semibold">
                        Asignaturas (JSON Array)
                      </Label>
                      <Input
                        id={`youth-subjects-${plan.id}`}
                        value={plan.subjects}
                        onChange={(e) => updateYouthPlanField(plan.id, "subjects", e.target.value)}
                        placeholder='["Lenguaje","Matemática","Historia","Ciencias","Inglés"]'
                        className="border-[#002147]/30 font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`youth-desc-${plan.id}`} className="text-[#002147] font-semibold">
                        Descripción
                      </Label>
                      <Textarea
                        id={`youth-desc-${plan.id}`}
                        value={plan.description || ""}
                        onChange={(e) => updateYouthPlanField(plan.id, "description", e.target.value)}
                        rows={3}
                        className="border-[#002147]/30"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADULT CYCLES TAB */}
        <TabsContent value="adult" className="space-y-6">
          <Card className="border-[#002147]">
            <CardHeader className="bg-[#002147] text-white">
              <CardTitle className="text-2xl font-serif">Planes para Adultos 2x1</CardTitle>
              <CardDescription className="text-white/70">
                Regla: 4 Quizzes por Módulo. Total calculado automáticamente según duración.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {Object.values(editedAdultCycles).map((cycle, idx) => (
                <Card key={cycle.id} className="border-[#D4AF37]/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-[#002147]">{cycle.cycleName}</CardTitle>
                      <Badge className="bg-[#D4AF37] text-[#002147]">Ciclo {idx + 1}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`adult-name-${cycle.id}`} className="text-[#002147] font-semibold">
                          Nombre del Ciclo *
                        </Label>
                        <Input
                          id={`adult-name-${cycle.id}`}
                          value={cycle.cycleName}
                          onChange={(e) => updateAdultCycleField(cycle.id, "cycleName", e.target.value)}
                          className="border-[#002147]/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`adult-duration-${cycle.id}`} className="text-[#002147] font-semibold">
                          Duración (meses) *
                        </Label>
                        <Input
                          id={`adult-duration-${cycle.id}`}
                          type="number"
                          value={cycle.durationMonths}
                          onChange={(e) => updateAdultCycleField(cycle.id, "durationMonths", parseInt(e.target.value))}
                          className="border-[#002147]/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#D4AF37]/10 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor={`adult-monthly-${cycle.id}`} className="text-[#002147] font-semibold flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Mensualidad *
                        </Label>
                        <Input
                          id={`adult-monthly-${cycle.id}`}
                          type="number"
                          value={cycle.monthlyPrice}
                          onChange={(e) => updateAdultCycleField(cycle.id, "monthlyPrice", parseInt(e.target.value))}
                          className="border-[#002147]/30 font-mono"
                        />
                        <p className="text-xs text-[#002147]/60">{formatCurrency(cycle.monthlyPrice)}</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`adult-enrollment-${cycle.id}`} className="text-[#002147] font-semibold flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Matrícula *
                        </Label>
                        <Input
                          id={`adult-enrollment-${cycle.id}`}
                          type="number"
                          value={cycle.enrollmentPrice}
                          onChange={(e) => updateAdultCycleField(cycle.id, "enrollmentPrice", parseInt(e.target.value))}
                          className="border-[#002147]/30 font-mono"
                        />
                        <p className="text-xs text-[#002147]/60">{formatCurrency(cycle.enrollmentPrice)}</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[#002147] font-semibold flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Total Ciclo
                        </Label>
                        <div className="h-10 flex items-center justify-center bg-[#002147] text-white rounded-md font-bold text-lg">
                          {formatCurrency(cycle.totalPrice)}
                        </div>
                        <p className="text-xs text-[#002147]/60 text-center">Calculado automáticamente</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#002147]/5 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor={`adult-modules-${cycle.id}`} className="text-[#002147] font-semibold">
                          Cantidad de Módulos *
                        </Label>
                        <Input
                          id={`adult-modules-${cycle.id}`}
                          type="number"
                          value={cycle.modulesCount}
                          onChange={(e) => updateAdultCycleField(cycle.id, "modulesCount", parseInt(e.target.value))}
                          className="border-[#002147]/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[#002147] font-semibold flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Quizzes Totales
                        </Label>
                        <div className="h-10 flex items-center justify-center bg-[#D4AF37]/20 rounded-md font-bold">
                          {cycle.quizzesTotal}
                        </div>
                        <p className="text-xs text-[#002147]/60 text-center">4 x {cycle.modulesCount} módulos</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`adult-essays-${cycle.id}`} className="text-[#002147] font-semibold">
                          Ensayos Finales *
                        </Label>
                        <Input
                          id={`adult-essays-${cycle.id}`}
                          type="number"
                          value={cycle.essaysCount}
                          onChange={(e) => updateAdultCycleField(cycle.id, "essaysCount", parseInt(e.target.value))}
                          className="border-[#002147]/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`adult-load-${cycle.id}`} className="text-[#002147] font-semibold">
                        Carga Académica (Resumen)
                      </Label>
                      <Input
                        id={`adult-load-${cycle.id}`}
                        value={cycle.academicLoad || ""}
                        onChange={(e) => updateAdultCycleField(cycle.id, "academicLoad", e.target.value)}
                        placeholder="6 Módulos, 24 Quizzes Totales y 1 Ensayo General Final"
                        className="border-[#002147]/30"
                      />
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-4">
                      <h4 className="font-semibold text-[#002147]">Editor de Temarios por Decreto</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`adult-ds10-${cycle.id}`} className="text-[#002147] font-semibold">
                          Básica - D.S. 10 (JSON)
                        </Label>
                        <Input
                          id={`adult-ds10-${cycle.id}`}
                          value={cycle.basicaDS10 || ""}
                          onChange={(e) => updateAdultCycleField(cycle.id, "basicaDS10", e.target.value)}
                          placeholder='["Lenguaje","Matemática","Ciencias Naturales","Historia y Geografía"]'
                          className="border-[#002147]/30 font-mono text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`adult-ds257-basica-${cycle.id}`} className="text-[#002147] font-semibold">
                          Básica - D.S. 257 (JSON)
                        </Label>
                        <Input
                          id={`adult-ds257-basica-${cycle.id}`}
                          value={cycle.basicaDS257 || ""}
                          onChange={(e) => updateAdultCycleField(cycle.id, "basicaDS257", e.target.value)}
                          placeholder='["Lenguaje","Matemática","Ciencias Naturales","Historia y Geografía"]'
                          className="border-[#002147]/30 font-mono text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`adult-ds257-media-${cycle.id}`} className="text-[#002147] font-semibold">
                          Media - D.S. 257 (JSON)
                        </Label>
                        <Input
                          id={`adult-ds257-media-${cycle.id}`}
                          value={cycle.mediaDS257 || ""}
                          onChange={(e) => updateAdultCycleField(cycle.id, "mediaDS257", e.target.value)}
                          placeholder='["Lenguaje","Matemática","Ciencias Naturales","Historia y Geografía","Inglés"]'
                          className="border-[#002147]/30 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTICES TAB */}
        <TabsContent value="notices" className="space-y-6">
          <Card className="border-[#002147]">
            <CardHeader className="bg-[#002147] text-white">
              <CardTitle className="text-2xl font-serif">Avisos Importantes</CardTitle>
              <CardDescription className="text-white/70">
                Gestiona los mensajes y descripciones que aparecen en la landing page
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <Card className="border-[#D4AF37]/30">
                <CardHeader>
                  <CardTitle className="text-lg text-[#002147] flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Descripción de Cabecera
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={editedConfigs["header_description"] || ""}
                    onChange={(e) => setEditedConfigs(prev => ({ ...prev, header_description: e.target.value }))}
                    rows={4}
                    className="border-[#002147]/30"
                    placeholder="Descripción principal que aparece en el header de la landing page"
                  />
                  <p className="text-xs text-[#002147]/60 mt-2">
                    Esta descripción aparece en la parte superior de la página principal
                  </p>
                </CardContent>
              </Card>

              <Card className="border-[#D4AF37]/30">
                <CardHeader>
                  <CardTitle className="text-lg text-[#002147] flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Aviso para Estudiantes de 4° Medio y Educación Superior
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={editedConfigs["important_notice_4medio"] || ""}
                    onChange={(e) => setEditedConfigs(prev => ({ ...prev, important_notice_4medio: e.target.value }))}
                    rows={3}
                    className="border-[#002147]/30"
                    placeholder="Aviso importante para estudiantes de 4° Medio"
                  />
                  <p className="text-xs text-[#002147]/60 mt-2">
                    Este aviso aparece destacado en la sección de información importante
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREVIEW TAB */}
        <TabsContent value="preview" className="space-y-6">
          <Card className="border-[#002147]">
            <CardHeader className="bg-[#002147] text-white">
              <CardTitle className="text-2xl font-serif">Vista Previa - Tabla Comparativa</CardTitle>
              <CardDescription className="text-white/70">
                Visualiza cómo se verán los cambios antes de publicarlos
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Youth Plans Preview */}
              <div className="mb-8">
                <h3 className="text-xl font-serif font-bold text-[#002147] mb-4 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6" />
                  Planes para Jóvenes (7° a 4° Medio)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#002147] text-white">
                        <th className="border border-[#002147] p-3 text-left">Plan</th>
                        <th className="border border-[#002147] p-3 text-center">Mensualidad</th>
                        <th className="border border-[#002147] p-3 text-center">Matrícula</th>
                        <th className="border border-[#002147] p-3 text-center">Total Anual</th>
                        <th className="border border-[#002147] p-3 text-left">Carga Académica</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(editedYouthPlans).map((plan, idx) => (
                        <tr key={plan.id} className={idx % 2 === 0 ? "bg-white" : "bg-[#D4AF37]/5"}>
                          <td className="border border-[#002147]/20 p-3">
                            <div className="font-semibold text-[#002147]">{plan.planName}</div>
                            <div className="text-sm text-[#002147]/60">{plan.planSubtitle}</div>
                          </td>
                          <td className="border border-[#002147]/20 p-3 text-center font-bold text-[#002147]">
                            {formatCurrency(plan.monthlyPrice)}
                          </td>
                          <td className="border border-[#002147]/20 p-3 text-center font-bold text-[#002147]">
                            {formatCurrency(plan.enrollmentPrice)}
                          </td>
                          <td className="border border-[#002147]/20 p-3 text-center font-bold text-[#D4AF37]">
                            {formatCurrency(plan.annualTotal || 0)}
                          </td>
                          <td className="border border-[#002147]/20 p-3 text-sm">
                            <div>{plan.academicLoad}</div>
                            <div className="text-[#002147]/60 mt-1">{plan.evaluationsDetail}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Adult Cycles Preview */}
              <div>
                <h3 className="text-xl font-serif font-bold text-[#002147] mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Planes para Adultos 2x1
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#002147] text-white">
                        <th className="border border-[#002147] p-3 text-left">Ciclo</th>
                        <th className="border border-[#002147] p-3 text-center">Mensualidad</th>
                        <th className="border border-[#002147] p-3 text-center">Matrícula</th>
                        <th className="border border-[#002147] p-3 text-center">Total</th>
                        <th className="border border-[#002147] p-3 text-center">Duración</th>
                        <th className="border border-[#002147] p-3 text-left">Carga</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(editedAdultCycles).map((cycle, idx) => (
                        <tr key={cycle.id} className={idx % 2 === 0 ? "bg-white" : "bg-[#D4AF37]/5"}>
                          <td className="border border-[#002147]/20 p-3">
                            <div className="font-semibold text-[#002147]">{cycle.cycleName}</div>
                          </td>
                          <td className="border border-[#002147]/20 p-3 text-center font-bold text-[#002147]">
                            {formatCurrency(cycle.monthlyPrice)}
                          </td>
                          <td className="border border-[#002147]/20 p-3 text-center font-bold text-[#002147]">
                            {formatCurrency(cycle.enrollmentPrice)}
                          </td>
                          <td className="border border-[#002147]/20 p-3 text-center font-bold text-[#D4AF37]">
                            {formatCurrency(cycle.totalPrice)}
                          </td>
                          <td className="border border-[#002147]/20 p-3 text-center">
                            {cycle.durationMonths} meses
                          </td>
                          <td className="border border-[#002147]/20 p-3 text-sm">
                            <div>{cycle.modulesCount} Módulos</div>
                            <div className="text-[#002147]/60">{cycle.quizzesTotal} Quizzes</div>
                            <div className="text-[#002147]/60">{cycle.essaysCount} Ensayos</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notices Preview */}
              <div className="mt-8 p-6 bg-[#D4AF37]/10 border-l-4 border-[#D4AF37] rounded-lg">
                <h3 className="text-lg font-semibold text-[#002147] mb-4">Descripción de Cabecera</h3>
                <p className="text-[#002147]/80 leading-relaxed">
                  {editedConfigs["header_description"] || "No configurado"}
                </p>
              </div>

              <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <p className="text-red-800 font-medium">
                    {editedConfigs["important_notice_4medio"] || "No configurado"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
