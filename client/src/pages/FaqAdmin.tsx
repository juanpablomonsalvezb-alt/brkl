import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff, Upload, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function FaqAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replaceAll, setReplaceAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    sortOrder: 0,
    isActive: true,
  });

  // Fetch all FAQs (including inactive)
  const { data: faqs, isLoading } = useQuery<Faq[]>({
    queryKey: ["/api/admin/faqs"],
  });

  // Create FAQ mutation
  const createFaqMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/admin/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al crear FAQ");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      toast({ title: "FAQ creada exitosamente" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error al crear FAQ", variant: "destructive" });
    },
  });

  // Update FAQ mutation
  const updateFaqMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await fetch(`/api/admin/faqs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al actualizar FAQ");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      toast({ title: "FAQ actualizada exitosamente" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error al actualizar FAQ", variant: "destructive" });
    },
  });

  // Delete FAQ mutation
  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/faqs/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar FAQ");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      toast({ title: "FAQ eliminada exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al eliminar FAQ", variant: "destructive" });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/faqs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("Error al cambiar estado");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      toast({ title: "Estado actualizado" });
    },
  });

  // Import FAQs mutation
  const importFaqsMutation = useMutation({
    mutationFn: async ({ file, replaceAll }: { file: File; replaceAll: boolean }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("replaceAll", String(replaceAll));

      const response = await fetch("/api/admin/faqs/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al importar FAQs");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      toast({ 
        title: "Importación exitosa", 
        description: `${data.count} FAQs importadas correctamente` 
      });
      setIsImportDialogOpen(false);
      setSelectedFile(null);
      setReplaceAll(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error al importar", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.docx')) {
        toast({
          title: "Archivo inválido",
          description: "Solo se permiten archivos Word (.docx)",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: "No hay archivo seleccionado",
        description: "Por favor selecciona un archivo Word",
        variant: "destructive"
      });
      return;
    }

    importFaqsMutation.mutate({ file: selectedFile, replaceAll });
  };

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "",
      sortOrder: faqs?.length || 0,
      isActive: true,
    });
    setEditingFaq(null);
  };

  const handleOpenDialog = (faq?: Faq) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || "",
        sortOrder: faq.sortOrder,
        isActive: faq.isActive,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingFaq) {
      updateFaqMutation.mutate({ id: editingFaq.id, data: formData });
    } else {
      createFaqMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta FAQ?")) {
      deleteFaqMutation.mutate(id);
    }
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ id, isActive: !currentStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#002147]">Gestión de FAQ</h1>
          <p className="text-[#002147]/60 mt-2">
            Administra las preguntas frecuentes del sitio web
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#002147] text-[#002147] hover:bg-[#002147]/10">
                <Upload className="w-4 h-4 mr-2" />
                Importar Word
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Importar FAQs desde Word</DialogTitle>
                <DialogDescription>
                  Sube un archivo Word con una tabla de 2 columnas: Pregunta | Respuesta
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Formato requerido:</strong> Documento Word (.docx) con una tabla de 2 columnas.
                    <br />Primera columna: Pregunta
                    <br />Segunda columna: Respuesta
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Seleccionar archivo</Label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".docx"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {selectedFile && (
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {selectedFile.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="replace-all"
                    checked={replaceAll}
                    onCheckedChange={setReplaceAll}
                  />
                  <Label htmlFor="replace-all" className="text-sm">
                    Reemplazar todas las FAQs existentes
                  </Label>
                </div>
                
                {replaceAll && (
                  <Alert className="border-amber-500 bg-amber-50">
                    <AlertDescription className="text-amber-800">
                      ⚠️ Todas las FAQs existentes serán eliminadas y reemplazadas por las del archivo.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsImportDialogOpen(false);
                    setSelectedFile(null);
                    setReplaceAll(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || importFaqsMutation.isPending}
                  className="bg-[#002147] hover:bg-[#002147]/90"
                >
                  {importFaqsMutation.isPending ? "Importando..." : "Importar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-[#002147] hover:bg-[#002147]/90">
                <Plus className="w-4 h-4 mr-2" />
                Nueva FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFaq ? "Editar FAQ" : "Nueva FAQ"}</DialogTitle>
              <DialogDescription>
                {editingFaq ? "Actualiza los campos de la pregunta frecuente" : "Crea una nueva pregunta frecuente"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Pregunta *</Label>
                  <Input
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="¿Cómo funciona el sistema de validación?"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="answer">Respuesta *</Label>
                  <Textarea
                    id="answer"
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Nuestro sistema está alineado 100% con el currículo nacional..."
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría (opcional)</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="académico, planes, certificación..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Orden</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número menor = aparece primero
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Activa (visible en el sitio)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#002147] hover:bg-[#002147]/90">
                  {editingFaq ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {faqs && faqs.length > 0 ? (
          faqs.map((faq) => (
            <Card key={faq.id} className={!faq.isActive ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <GripVertical className="w-5 h-5 text-muted-foreground mt-1 cursor-move" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{faq.question}</CardTitle>
                        {faq.category && (
                          <Badge variant="outline" className="text-xs">
                            {faq.category}
                          </Badge>
                        )}
                        {!faq.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Inactiva
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        Orden: {faq.sortOrder}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(faq.id, faq.isActive)}
                      title={faq.isActive ? "Desactivar" : "Activar"}
                    >
                      {faq.isActive ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(faq)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(faq.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {faq.answer}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No hay preguntas frecuentes todavía
              </p>
              <Button onClick={() => handleOpenDialog()} className="bg-[#002147] hover:bg-[#002147]/90">
                <Plus className="w-4 h-4 mr-2" />
                Crear primera FAQ
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
