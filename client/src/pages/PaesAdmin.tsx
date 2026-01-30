import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, BookOpen, GraduationCap, Users } from "lucide-react";

interface PaesSubject {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  sortOrder: number;
  isActive: boolean;
}

interface PaesPlan {
  id: string;
  name: string;
  description?: string | null;
  basePricePerSubject: number;
  tutorPricePerSubject?: number | null;
  maxSubjects?: number | null;
  includesTutor: boolean;
  features?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface PaesSubscription {
  id: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string | null;
  planId?: string | null;
  selectedSubjects: string;
  includesTutor: boolean;
  totalPrice: number;
  status: string;
  createdAt: Date;
}

export default function PaesAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("subjects");

  // ============================================
  // SUBJECTS MANAGEMENT
  // ============================================
  
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<PaesSubject | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    description: "",
    basePrice: 0,
    sortOrder: 0,
    isActive: true,
  });

  const { data: subjects } = useQuery<PaesSubject[]>({
    queryKey: ["/api/admin/paes/subjects"],
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (data: typeof subjectForm) => {
      const response = await fetch("/api/admin/paes/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al crear materia");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/paes/subjects"] });
      toast({ title: "Materia creada exitosamente" });
      setIsSubjectDialogOpen(false);
      resetSubjectForm();
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof subjectForm> }) => {
      const response = await fetch(`/api/admin/paes/subjects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al actualizar materia");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/paes/subjects"] });
      toast({ title: "Materia actualizada exitosamente" });
      setIsSubjectDialogOpen(false);
      resetSubjectForm();
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/paes/subjects/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar materia");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/paes/subjects"] });
      toast({ title: "Materia eliminada exitosamente" });
    },
  });

  const resetSubjectForm = () => {
    setSubjectForm({
      name: "",
      description: "",
      basePrice: 0,
      sortOrder: subjects?.length || 0,
      isActive: true,
    });
    setEditingSubject(null);
  };

  const handleOpenSubjectDialog = (subject?: PaesSubject) => {
    if (subject) {
      setEditingSubject(subject);
      setSubjectForm({
        name: subject.name,
        description: subject.description || "",
        basePrice: subject.basePrice,
        sortOrder: subject.sortOrder,
        isActive: subject.isActive,
      });
    } else {
      resetSubjectForm();
    }
    setIsSubjectDialogOpen(true);
  };

  const handleSubmitSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      updateSubjectMutation.mutate({ id: editingSubject.id, data: subjectForm });
    } else {
      createSubjectMutation.mutate(subjectForm);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#002147]">Gestión de Planes PAES</h1>
        <p className="text-[#002147]/60 mt-2">
          Administra materias, planes y inscripciones para Preparación PAES
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="subjects" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Materias
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <GraduationCap className="w-4 h-4" />
            Planes
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-2">
            <Users className="w-4 h-4" />
            Inscripciones
          </TabsTrigger>
        </TabsList>

        {/* SUBJECTS TAB */}
        <TabsContent value="subjects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Materias PAES</CardTitle>
                <CardDescription>
                  Gestiona las materias disponibles: Lenguaje, Matemática, etc.
                </CardDescription>
              </div>
              <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenSubjectDialog()} className="bg-[#002147]">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Materia
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingSubject ? "Editar Materia" : "Nueva Materia"}</DialogTitle>
                    <DialogDescription>
                      Configura la materia PAES (IA + Ensayos incluidos)
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitSubject}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre de la Materia *</Label>
                        <Input
                          id="name"
                          value={subjectForm.name}
                          onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                          placeholder="Ej: Lenguaje, Matemática, Historia..."
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                          id="description"
                          value={subjectForm.description}
                          onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                          placeholder="Descripción de la materia..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="basePrice">Precio Base (IA + Ensayos) *</Label>
                        <Input
                          id="basePrice"
                          type="number"
                          value={subjectForm.basePrice}
                          onChange={(e) => setSubjectForm({ ...subjectForm, basePrice: parseInt(e.target.value) })}
                          placeholder="Ej: 50000"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Precio incluye IA + Ensayos (sin tutor)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sortOrder">Orden de Aparición</Label>
                        <Input
                          id="sortOrder"
                          type="number"
                          value={subjectForm.sortOrder}
                          onChange={(e) => setSubjectForm({ ...subjectForm, sortOrder: parseInt(e.target.value) })}
                          min={0}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={subjectForm.isActive}
                          onCheckedChange={(checked) => setSubjectForm({ ...subjectForm, isActive: checked })}
                        />
                        <Label htmlFor="isActive">Activa (visible para usuarios)</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsSubjectDialogOpen(false);
                          resetSubjectForm();
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-[#002147]">
                        {editingSubject ? "Actualizar" : "Crear"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {subjects && subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <Card key={subject.id} className={!subject.isActive ? "opacity-60" : ""}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold">{subject.name}</h3>
                              {!subject.isActive && (
                                <Badge variant="secondary">Inactiva</Badge>
                              )}
                            </div>
                            {subject.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {subject.description}
                              </p>
                            )}
                            <div className="flex gap-4 text-sm">
                              <span className="font-semibold text-[#002147]">
                                ${subject.basePrice.toLocaleString()} CLP
                              </span>
                              <span className="text-muted-foreground">
                                Orden: {subject.sortOrder}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenSubjectDialog(subject)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("¿Estás seguro de eliminar esta materia?")) {
                                  deleteSubjectMutation.mutate(subject.id);
                                }
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground mb-4">
                        No hay materias PAES todavía
                      </p>
                      <Button onClick={() => handleOpenSubjectDialog()} className="bg-[#002147]">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear primera materia
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLANS TAB - Placeholder */}
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Planes PAES</CardTitle>
              <CardDescription>
                Próximamente: Gestión de planes (Individual, Duo, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-12">
                Panel de planes en desarrollo...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUBSCRIPTIONS TAB - Placeholder */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Inscripciones PAES</CardTitle>
              <CardDescription>
                Próximamente: Ver y gestionar inscripciones de estudiantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-12">
                Panel de inscripciones en desarrollo...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
