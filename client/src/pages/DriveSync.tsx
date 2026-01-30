import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  FolderOpen,
  FileVideo,
  FileAudio,
  FileImage,
  Presentation,
  FileText,
  RefreshCw,
  CloudDownload,
  Check,
  AlertCircle,
  Plus
} from "lucide-react";

interface DriveFolder {
  id: string;
  name: string;
  programType?: string;
}

interface Subject {
  id: string;
  name: string;
}

interface LevelSubject {
  id: string;
  levelId: string;
  subjectId: string;
  level: { id: string, name: string };
  subject: { id: string, name: string };
  mimeType: string;
}

interface ModuleContent {
  moduleNumber: number;
  folderId: string;
  folderName: string;
  resources: DriveResource[];
}

interface ResourceType {
  id: string;
  type: 'video' | 'audio' | 'infografia' | 'presentacion' | 'documento';
  name: string;
}

// Fix DriveResource interface based on usage
interface DriveResource {
  id: string;
  name: string;
  type: string;
  mimeType: string;
  webViewLink: string;
}

interface LearningObjective {
  id: string;
  levelSubjectId: string;
  weekNumber: number;
  title: string;
}

function getResourceIcon(type: string) {
  switch (type) {
    case 'video': return <FileVideo className="h-4 w-4 text-red-500" />;
    case 'audio': return <FileAudio className="h-4 w-4 text-purple-500" />;
    case 'infografia': return <FileImage className="h-4 w-4 text-green-500" />;
    case 'presentacion': return <Presentation className="h-4 w-4 text-orange-500" />;
    default: return <FileText className="h-4 w-4 text-gray-500" />;
  }
}

function getResourceTypeName(type: string) {
  const names: Record<string, string> = {
    'video': 'Video',
    'audio': 'Audio',
    'infografia': 'Infografía',
    'presentacion': 'Presentación'
  };
  return names[type] || type;
}

export default function DriveSync() {
  const { toast } = useToast();
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const { data: folders, isLoading: foldersLoading, error: foldersError } = useQuery<DriveFolder[]>({
    queryKey: ['/api/admin/drive/folders'],
    queryFn: async () => {
      const res = await fetch('/api/admin/drive/folders');
      if (!res.ok) throw new Error('Failed to fetch folders');
      return res.json();
    },
    retry: 1
  });

  const { data: levelSubjectsList } = useQuery<LevelSubject[]>({
    queryKey: ['/api/level-subjects'],
    queryFn: async () => {
      const res = await fetch('/api/level-subjects', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch level subjects');
      return res.json();
    }
  });

  // Extract unique levels and subjects for the dropdowns
  const uniqueLevels = useMemo(() => {
    return Array.from(new Set(levelSubjectsList?.map(ls => JSON.stringify(ls.level))))
      .map(s => JSON.parse(s) as { id: string, name: string });
  }, [levelSubjectsList]);

  const uniqueSubjects = useMemo(() => {
    return selectedLevelId
      ? levelSubjectsList?.filter(ls => ls.levelId === selectedLevelId).map(ls => ls.subject)
      : [];
  }, [selectedLevelId, levelSubjectsList]);

  // Auto-select Level and Subject based on Folder Name
  useEffect(() => {
    if (!selectedFolderId || !folders || !uniqueLevels) return;

    const folder = folders.find(f => f.id === selectedFolderId);
    if (!folder) return;

    // Normalize text for comparison (handle º vs °, accents, etc.)
    const normalizeText = (text: string) => {
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[º°]/g, '') // Remove degree symbols
        .toLowerCase()
        .trim();
    };

    const folderNormalized = normalizeText(folder.name);

    // Try to match level (e.g., "7 basico" from "7º Básico - Matematica")
    const matchedLevel = uniqueLevels.find(l => {
      const levelNormalized = normalizeText(l.name);
      // Extract just the number and type (e.g., "7 basico", "1 medio")
      const levelPattern = levelNormalized.replace(/\s+/g, '');
      const folderPattern = folderNormalized.replace(/\s+/g, '');
      return folderPattern.includes(levelPattern);
    });

    if (matchedLevel) {
      setSelectedLevelId(curr => (curr !== matchedLevel.id ? matchedLevel.id : curr));

      // If level matched, try to match subject
      const relevantSubjects = levelSubjectsList
        ?.filter(ls => ls.levelId === matchedLevel.id)
        .map(ls => ls.subject);

      if (relevantSubjects) {
        const matchedSubject = relevantSubjects.find(s => {
          const subjectNormalized = normalizeText(s.name);
          // Handle partial matches: "Matematica" matches "Matemática", "Lenguaje" matches "Lengua y Literatura"
          const subjectWords = subjectNormalized.split(/\s+/);
          return subjectWords.some(word => word.length > 4 && folderNormalized.includes(word));
        });
        if (matchedSubject) {
          setSelectedSubjectId(curr => (curr !== matchedSubject.id ? matchedSubject.id : curr));
        }
      }
    }
  }, [selectedFolderId, folders, uniqueLevels, levelSubjectsList]);

  // Derived state for levelSubjectId
  const selectedLevelSubjectId = selectedLevelId && selectedSubjectId
    ? levelSubjectsList?.find(ls => ls.levelId === selectedLevelId && ls.subjectId === selectedSubjectId)?.id
    : "";

  const { data: modules, isLoading: modulesLoading, refetch: refetchModules } = useQuery<ModuleContent[]>({
    queryKey: ['/api/admin/drive/folders', selectedFolderId, 'modules'],
    enabled: !!selectedFolderId,
    queryFn: async () => {
      const res = await fetch(`/api/admin/drive/folders/${selectedFolderId}/modules`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch modules');
      return res.json();
    }
  });

  const { data: objectives } = useQuery<LearningObjective[]>({
    queryKey: ['/api/level-subjects', selectedLevelSubjectId, 'objectives'],
    enabled: !!selectedLevelSubjectId,
    queryFn: async () => {
      const res = await fetch(`/api/level-subjects/${selectedLevelSubjectId}/objectives`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch objectives');
      return res.json();
    }
  });

  const syncMutation = useMutation({
    mutationFn: async (data: { folderId: string; learningObjectiveId: string; moduleNumber: number }) => {
      const res = await fetch('/api/admin/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to sync resources');
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sincronización completada",
        description: `${data.resourcesCreated} recursos importados correctamente`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/objectives'] });
    },
    onError: (error) => {
      toast({
        title: "Error de sincronización",
        description: String(error),
        variant: "destructive"
      });
    }
  });

  const createModulesMutation = useMutation({
    mutationFn: async (levelSubjectId: string) => {
      const res = await fetch(`/api/admin/level-subjects/${levelSubjectId}/create-modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create modules');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Módulos creados",
        description: `Se crearon ${data.count} módulos correctamente`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/level-subjects', selectedLevelSubjectId, 'objectives'] });
    },
    onError: (error) => {
      toast({
        title: "Error al crear módulos",
        description: String(error),
        variant: "destructive"
      });
    }
  });

  const handleCreateModules = () => {
    if (selectedLevelSubjectId) {
      createModulesMutation.mutate(selectedLevelSubjectId);
    }
  };

  const handleSync = (moduleContent: ModuleContent) => {
    const objective = objectives?.find(o => o.weekNumber === moduleContent.moduleNumber);
    if (!objective) {
      toast({
        title: "Objetivo no encontrado",
        description: `No existe un objetivo para el Módulo ${moduleContent.moduleNumber}. Créalo primero.`,
        variant: "destructive"
      });
      return;
    }

    syncMutation.mutate({
      folderId: moduleContent.folderId,
      learningObjectiveId: objective.id,
      moduleNumber: moduleContent.moduleNumber
    });
  };

  const handleSyncAll = async () => {
    if (!modules || !selectedLevelSubjectId) return;
    setIsSyncingAll(true);
    let successCount = 0;
    let failCount = 0;

    try {
      let currentObjectives = objectives || [];

      // 1. Auto-create skeleton if missing (Magic Fix)
      if (currentObjectives.length === 0) {
        toast({
          title: "Preparando estructura del curso...",
          description: "Generando los 15 módulos base en la base de datos."
        });

        try {
          await createModulesMutation.mutateAsync(selectedLevelSubjectId);
          // Fetch the newly created objectives manually
          const res = await fetch(`/api/level-subjects/${selectedLevelSubjectId}/objectives`);
          if (res.ok) {
            currentObjectives = await res.json();
          } else {
            throw new Error("No se pudieron cargar los módulos creados");
          }
        } catch (e) {
          toast({ title: "Error preparando el curso", description: String(e), variant: "destructive" });
          setIsSyncingAll(false);
          return;
        }
      }

      // 2. Proceed with Sync
      const promises = modules.map(async (moduleContent) => {
        const objective = currentObjectives.find(o => o.weekNumber === moduleContent.moduleNumber);
        if (objective) {
          try {
            await syncMutation.mutateAsync({
              folderId: moduleContent.folderId,
              learningObjectiveId: objective.id,
              moduleNumber: moduleContent.moduleNumber
            });
            successCount++;
          } catch (e) {
            failCount++;
          }
        }
      });

      await Promise.all(promises);

      toast({
        title: "Sincronización Total Completada",
        description: `Se procesaron ${successCount} módulos exitosamente. ${failCount > 0 ? `${failCount} errores.` : ''}`,
        variant: successCount > 0 ? "default" : "destructive"
      });

      // Refetch to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/objectives'] });

    } catch (error) {
      toast({ title: "Error en el proceso", variant: "destructive" });
    } finally {
      setIsSyncingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" data-testid="link-back" className="hover:text-[#A51C30]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Aula
            </Button>
          </Link>
          <h1 className="text-3xl font-serif font-bold text-[#1e1e1e]">Recursos de Apoyo <span className="text-[#A51C30] italic font-normal">Drive</span></h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Carpeta de Drive
              </CardTitle>
              <CardDescription>
                Selecciona la carpeta de la materia en Drive
              </CardDescription>
            </CardHeader>
            <CardContent>
              {foldersLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Cargando carpetas...
                </div>
              ) : (
                <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                  <SelectTrigger data-testid="select-drive-folder">
                    <SelectValue placeholder="Seleccionar carpeta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {folders?.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Materia Destino</CardTitle>
              <CardDescription>
                Selecciona dónde importar los recursos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">1. Selecciona Nivel</label>
                  <Select value={selectedLevelId} onValueChange={(val) => { setSelectedLevelId(val); setSelectedSubjectId(""); }}>
                    <SelectTrigger data-testid="select-level">
                      <SelectValue placeholder="Ej: 7° Básico" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueLevels?.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">2. Selecciona Asignatura</label>
                  <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={!selectedLevelId}>
                    <SelectTrigger data-testid="select-subject">
                      <SelectValue placeholder="Ej: Matemática" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueSubjects?.map((subject) => (
                        <SelectItem key={subject?.id} value={subject?.id}>
                          {subject?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedLevelSubjectId && objectives?.length === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-3">
                    No hay módulos creados para esta materia. Debes crearlos antes de sincronizar recursos.
                  </p>
                  <Button
                    onClick={handleCreateModules}
                    disabled={createModulesMutation.isPending}
                    data-testid="button-create-modules"
                  >
                    {createModulesMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Crear 15 Módulos
                  </Button>
                </div>
              )}

              {selectedLevelSubjectId && objectives && objectives.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    {objectives.length} módulos disponibles para sincronizar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedFolderId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Módulos Detectados</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchModules()}
                  data-testid="button-refresh"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span>Carpetas de módulos encontradas en la carpeta seleccionada</span>
                {modules && modules.length > 0 && selectedLevelSubjectId && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleSyncAll}
                    disabled={isSyncingAll || syncMutation.isPending}
                  >
                    {isSyncingAll ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CloudDownload className="h-4 w-4 mr-2" />
                    )}
                    Sincronizar Curso Completo
                  </Button>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {modulesLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Escaneando carpetas...
                </div>
              ) : modules?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron carpetas de módulos.</p>
                  <p className="text-sm">Crea carpetas como "Módulo 1", "Módulo 2", etc.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules?.map((module) => (
                    <div
                      key={module.moduleNumber}
                      className="border rounded-lg p-4"
                      data-testid={`module-card-${module.moduleNumber}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{module.folderName}</h3>
                          <p className="text-sm text-gray-500">
                            {module.resources.length} recursos detectados
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSync(module)}
                          disabled={syncMutation.isPending || !selectedLevelSubjectId}
                          data-testid={`button-sync-${module.moduleNumber}`}
                        >
                          {syncMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CloudDownload className="h-4 w-4 mr-2" />
                          )}
                          Sincronizar
                        </Button>
                      </div>

                      {module.resources.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {module.resources.map((resource) => (
                            <Badge
                              key={resource.id}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {getResourceIcon(resource.type)}
                              <span className="truncate max-w-[150px]" title={resource.name}>
                                {resource.name}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Estructura de Carpetas Requerida</CardTitle>
            <CardDescription>
              Organiza tus archivos en Drive siguiendo esta estructura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
              <div className="space-y-1">
                <p>📁 Instituto Barkley/</p>
                <p className="pl-4">📁 7° Básico - Matemática/</p>
                <p className="pl-8">📁 Módulo 1/</p>
                <p className="pl-12">📹 video.mp4</p>
                <p className="pl-12">🖼️ infografia.png</p>
                <p className="pl-12">🎧 audio.m4a</p>
                <p className="pl-12">📊 presentacion.pdf</p>
                <p className="pl-8">📁 Módulo 2/</p>
                <p className="pl-12">...</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Los archivos se clasifican automáticamente según su tipo (video, audio, imagen, presentación, documento).
              Los nombres de las carpetas deben contener "Módulo" seguido del número.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
