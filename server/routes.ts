import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import {
  insertLevelSchema, insertSubjectSchema, insertLevelSubjectSchema,
  insertLearningObjectiveSchema, insertWeeklyResourceSchema, insertStudentProgressSchema,
  insertEvaluationProgressSchema, updateLevelSubjectTextbookSchema, updateLearningObjectivePagesSchema,
  insertReservationSchema
} from "@shared/schema";
import { listRootFolders, listModuleFolders, getModuleResources, searchFolderByName } from "./googleDrive";
import {
  getAllModulesSchedule, getModuleSchedule, getCalendarSummary,
  isModuleAvailable, isEvaluationAvailable, DEFAULT_CONFIG, formatModuleDates
} from "./calendarUtils";
import mammoth from "mammoth";
import multer from "multer";
import { generateEvaluationQuestions } from "./aiEvaluationGenerator";
import { registerEvaluationLinksRoutes } from "./evaluationLinksRoutes";
import { registerFaqRoutes } from "./faqRoutes";
import { registerPaesRoutes } from "./paesRoutes";
import { registerSalesChatRoutes } from "./salesChatRoutes";
import { registerFlowRoutes } from "./flowRoutes";

// Helper to ensure string params (not arrays)
function getStringParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

// Multer configuration for Word document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword') {
      cb(null, true);
    } else {
      cb(new Error('Only Word documents are allowed'));
    }
  }
});

// Helper function to parse Word document and extract info for ALL modules
interface ModuleInfo {
  moduleNumber: number;
  dateRange: string;
  oas: string;
  contents: string;
}

function parseAllModulesFromText(text: string): ModuleInfo[] {
  const modules: ModuleInfo[] = [];

  // Split by "Módulo X:" pattern to get each module's content
  const modulePattern = /Módulo\s+(\d+)\s*:\s*([^\n]+)/gi;
  const parts = text.split(/(?=Módulo\s+\d+\s*:)/i);

  for (const part of parts) {
    if (!part.trim()) continue;

    // Extract module number and date range
    const headerMatch = part.match(/Módulo\s+(\d+)\s*:\s*([^\n]+)/i);
    if (!headerMatch) continue;

    const moduleNumber = parseInt(headerMatch[1]);
    const dateRange = headerMatch[2].trim();

    // Extract OAs
    let oas = "";
    const oaMatches = Array.from(part.matchAll(/OA\s*\d+\s*:\s*([^\n]+)/gi));
    for (const match of oaMatches) {
      oas += match[0] + "\n";
    }

    // Extract contents (everything after "Contenidos:")
    let contents = "";
    const contentsMatch = part.match(/Contenidos?\s*:\s*([\s\S]*?)(?=Módulo\s+\d+|HITO|$)/i);
    if (contentsMatch) {
      const contentLines = contentsMatch[1].split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.match(/^Objetivos?|^OA\s*\d/i));
      contents = contentLines.join('\n');
    }

    modules.push({
      moduleNumber,
      dateRange: `Módulo ${moduleNumber}: ${dateRange}`,
      oas: oas.trim(),
      contents: contents.trim()
    });
  }

  return modules;
}

// Admin authorization middleware - must be used after isAuthenticated
const isAdmin: RequestHandler = async (req: any, res, next) => {
  // DEV MODE: Allow all access
  next();
  return;

  /*
  try {
    // Support both Google OAuth (req.user.id) and Replit Auth (req.user.claims.sub)
    const userId = req.user?.id || req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const profile = await storage.getUserProfile(userId);
    if (!profile || profile.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ message: "Failed to verify admin status" });
  }
  */
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Helper function to resolve level-subject ID (supports both UUID and slug like "7b-matematica")
  const resolveLevelSubjectId = async (idOrSlug: string): Promise<string | null> => {
    // If it looks like a UUID, return it directly
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)) {
      return idOrSlug;
    }

    // Otherwise, try to parse as slug "levelCode-subjectSlug" (e.g., "7b-matematica")
    const parts = idOrSlug.split("-");
    if (parts.length < 2) return null;

    const levelCode = parts[0];
    const subjectSlug = parts.slice(1).join("-").toLowerCase();

    // Map level codes to database level IDs
    const levelMap: Record<string, string> = {
      "7b": "7b", "8b": "8b",
      "1m": "1m", "2m": "2m", "3m": "3m", "4m": "4m",
      "nb1": "nb1", "nb2": "nb2", "nb3": "nb3",
      "nm1": "nm1", "nm2": "nm2"
    };

    const levelId = levelMap[levelCode];
    if (!levelId) return null;

    // Get all level-subjects for this level and find matching subject
    try {
      const levelSubjects = await storage.getAllLevelSubjects();
      const match = levelSubjects.find(ls => {
        if (ls.levelId !== levelId) return false;

        // Normalize subject name for comparison
        const normalizedSubject = ls.subject.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        return normalizedSubject.includes(subjectSlug) || subjectSlug.includes(normalizedSubject.split('-')[0]);
      });

      return match?.id || null;
    } catch (e) {
      console.error("Error resolving level-subject ID:", e);
      return null;
    }
  };

  // Health check endpoint for keep-alive service
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: "Instituto Barkley LMS"
    });
  });

  // Setup authentication (BEFORE registering other routes)
  // Only enable auth if OAuth credentials are configured
  if (process.env.REPLIT_DEPLOYMENT || (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)) {
    try {
      await setupAuth(app);
    } catch (error) {
      console.warn("Authentication setup failed, continuing without auth:", error);
    }
  } else {
    console.log("⚠️  Running in development mode without authentication");
  }
  registerAuthRoutes(app);

  // === PUBLIC ROUTES ===

  // Get all levels
  app.get("/api/levels", async (req, res) => {
    try {
      const allLevels = await storage.getLevels();
      res.json(allLevels);
    } catch (error) {
      console.error("Error fetching levels:", error);
      res.status(500).json({ message: "Failed to fetch levels" });
    }
  });

  // Get single level
  app.get("/api/levels/:id", async (req, res) => {
    try {
      const level = await storage.getLevelById(req.params.id);
      if (!level) {
        return res.status(404).json({ message: "Level not found" });
      }
      res.json(level);
    } catch (error) {
      console.error("Error fetching level:", error);
      res.status(500).json({ message: "Failed to fetch level" });
    }
  });

  // Get subjects for a level
  app.get("/api/levels/:levelId/subjects", async (req, res) => {
    try {
      const levelSubjects = await storage.getLevelSubjects(req.params.levelId);
      res.json(levelSubjects);
    } catch (error) {
      console.error("Error fetching level subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  // Get all subjects
  app.get("/api/subjects", async (req, res) => {
    try {
      const allSubjects = await storage.getSubjects();
      res.json(allSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  // Get all level-subjects with level and subject info
  app.get("/api/level-subjects", async (req, res) => {
    try {
      const levelSubjects = await storage.getAllLevelSubjects();
      res.json(levelSubjects);
    } catch (error) {
      console.error("Error fetching level-subjects:", error);
      res.status(500).json({ message: "Failed to fetch level-subjects" });
    }
  });

  // Get learning objectives for a level-subject combination
  app.get("/api/level-subjects/:id/objectives", async (req, res) => {
    try {
      const objectives = await storage.getLearningObjectives(req.params.id);
      res.json(objectives);
    } catch (error) {
      console.error("Error fetching objectives:", error);
      res.status(500).json({ message: "Failed to fetch objectives" });
    }
  });

  // Get resources for a learning objective
  app.get("/api/objectives/:id/resources", async (req, res) => {
    try {
      const resources = await storage.getResourcesByObjective(req.params.id);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  // === PROTECTED ROUTES (require authentication) ===

  // Get user profile
  app.get("/api/profile", async (req: any, res) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.claims || !req.user.claims.sub) {
        // In development, return a default profile
        return res.json({ 
          id: "dev-user",
          name: "Usuario de Desarrollo",
          role: "admin",
          email: "dev@barkley.edu"
        });
      }
      
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      res.json(profile || { role: "student" });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Get user's enrollments
  app.get("/api/enrollments", async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userEnrollments = await storage.getEnrollmentsByUser(userId);
      res.json(userEnrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Get user's progress
  app.get("/api/progress", async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getProgressByUser(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Mark resource as complete
  app.post("/api/progress", async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertStudentProgressSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const progress = await storage.markResourceComplete(parsed.data);
      res.json(progress);
    } catch (error) {
      console.error("Error saving progress:", error);
      res.status(500).json({ message: "Failed to save progress" });
    }
  });

  // === ADMIN ROUTES (require admin role) ===

  // Create level (admin only)
  app.post("/api/admin/levels", isAdmin, async (req: any, res) => {
    try {
      const parsed = insertLevelSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const level = await storage.createLevel(parsed.data);
      res.json(level);
    } catch (error) {
      console.error("Error creating level:", error);
      res.status(500).json({ message: "Failed to create level" });
    }
  });

  // Create subject (admin only)
  app.post("/api/admin/subjects", isAdmin, async (req: any, res) => {
    try {
      const parsed = insertSubjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const subject = await storage.createSubject(parsed.data);
      res.json(subject);
    } catch (error) {
      console.error("Error creating subject:", error);
      res.status(500).json({ message: "Failed to create subject" });
    }
  });

  // Create level-subject association (admin only)
  app.post("/api/admin/level-subjects", isAdmin, async (req: any, res) => {
    try {
      const parsed = insertLevelSubjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const ls = await storage.createLevelSubject(parsed.data);
      res.json(ls);
    } catch (error) {
      console.error("Error creating level-subject:", error);
      res.status(500).json({ message: "Failed to create level-subject" });
    }
  });

  // Create learning objective (admin only)
  app.post("/api/admin/objectives", isAdmin, async (req: any, res) => {
    try {
      const parsed = insertLearningObjectiveSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const objective = await storage.createLearningObjective(parsed.data);
      res.json(objective);
    } catch (error) {
      console.error("Error creating objective:", error);
      res.status(500).json({ message: "Failed to create objective" });
    }
  });

  // Create all 15 modules for a level-subject (temporary public for development)
  app.post("/api/admin/level-subjects/:id/create-modules", async (req: any, res) => {
    try {
      const { id } = req.params;

      // Check if level-subject exists
      const levelSubject = await storage.getLevelSubjectById(id);
      if (!levelSubject) {
        return res.status(404).json({ message: "Level-subject not found" });
      }

      // Check if modules already exist
      const existingObjectives = await storage.getLearningObjectives(id);
      if (existingObjectives.length > 0) {
        return res.status(400).json({
          message: "Modules already exist",
          count: existingObjectives.length
        });
      }

      // Create 15 modules
      const createdModules = [];
      for (let moduleNum = 1; moduleNum <= 15; moduleNum++) {
        const objective = await storage.createLearningObjective({
          levelSubjectId: id,
          weekNumber: moduleNum,
          code: `M${moduleNum}`,
          title: `Módulo ${moduleNum}`,
          sortOrder: moduleNum
        });
        createdModules.push(objective);
      }

      res.json({
        message: "Modules created successfully",
        count: createdModules.length,
        modules: createdModules
      });
    } catch (error) {
      console.error("Error creating modules:", error);
      res.status(500).json({ message: "Failed to create modules" });
    }
  });

  // Create resource (admin only)
  app.post("/api/admin/resources", isAdmin, async (req: any, res) => {
    try {
      const parsed = insertWeeklyResourceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const resource = await storage.createResource(parsed.data);
      res.json(resource);
    } catch (error) {
      console.error("Error creating resource:", error);
      res.status(500).json({ message: "Failed to create resource" });
    }
  });

  // Update resource (admin only)
  app.patch("/api/admin/resources/:id", isAdmin, async (req: any, res) => {
    try {
      const resource = await storage.updateResource(req.params.id, req.body);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(resource);
    } catch (error) {
      console.error("Error updating resource:", error);
      res.status(500).json({ message: "Failed to update resource" });
    }
  });

  // Seed initial data endpoint (temporary public for development)
  app.post("/api/admin/seed", async (req: any, res) => {
    try {
      // Seed levels (15 sesiones, cada sesión planificada para 2 semanas)
      const levelsData = [
        { id: "7b", name: "7° Básico", programType: "menores" as const, totalWeeks: 15, cadencePerOA: "2 sem/sesión", sortOrder: 1 },
        { id: "8b", name: "8° Básico", programType: "menores" as const, totalWeeks: 15, cadencePerOA: "2 sem/sesión", sortOrder: 2 },
        { id: "1m", name: "1° Medio", programType: "menores" as const, totalWeeks: 15, cadencePerOA: "2 sem/sesión", sortOrder: 3 },
        { id: "2m", name: "2° Medio", programType: "menores" as const, totalWeeks: 15, cadencePerOA: "2 sem/sesión", sortOrder: 4 },
        { id: "3m", name: "3° Medio", programType: "menores" as const, totalWeeks: 15, cadencePerOA: "2 sem/sesión", sortOrder: 5 },
        { id: "4m", name: "4° Medio", programType: "menores" as const, totalWeeks: 15, cadencePerOA: "2 sem/sesión", sortOrder: 6 },
        { id: "nb1", name: "NB1 (1-4)", programType: "adultos" as const, totalWeeks: 15, cadencePerOA: "2 sem/sesión", sortOrder: 7 },
        { id: "nb2", name: "NB2 (5-6)", programType: "adultos" as const, totalWeeks: 15, cadencePerOA: "2 sem/sesión", sortOrder: 8 },
        { id: "nb3", name: "NB3 (7-8)", programType: "adultos" as const, totalWeeks: 15, cadencePerOA: "2 sem/sesión", sortOrder: 9 },
        { id: "nm1", name: "NM1 (1-2 Media)", programType: "adultos" as const, totalWeeks: 15, cadencePerOA: "2 sem/sesión", sortOrder: 10 },
        { id: "nm2", name: "NM2 (3-4 Media)", programType: "adultos" as const, totalWeeks: 15, cadencePerOA: "2 sem/sesión", sortOrder: 11 },
      ];

      for (const level of levelsData) {
        try {
          await storage.createLevel(level);
        } catch (e) {
          // Ignore duplicate key errors
        }
      }

      // Seed subjects
      const subjectsData = [
        { name: "Lengua y Literatura", slug: "lengua-y-literatura", description: "Comunicación, lectura y escritura" },
        { name: "Matemática", slug: "matematica", description: "Álgebra, geometría y estadística" },
        { name: "Ciencias Naturales", slug: "ciencias-naturales", description: "Física, química y biología" },
        { name: "Historia", slug: "historia", description: "Historia, geografía y ciencias sociales" },
        { name: "Inglés", slug: "ingles", description: "Idioma inglés" },
        { name: "Educación Ciudadana", slug: "educacion-ciudadana", description: "Formación ciudadana" },
        { name: "Filosofía", slug: "filosofia", description: "Pensamiento crítico y ética" },
      ];

      const createdSubjects: any[] = [];
      for (const subject of subjectsData) {
        try {
          const created = await storage.createSubject(subject);
          createdSubjects.push(created);
        } catch (e) {
          // Ignore duplicate key errors
        }
      }

      // Create LevelSubject combinations
      const allLevels = await storage.getLevels();
      const allSubjects = await storage.getSubjects();
      let levelSubjectsCreated = 0;

      for (const level of allLevels) {
        for (const subject of allSubjects) {
          try {
            await storage.createLevelSubject({
              levelId: level.id,
              subjectId: subject.id,
              totalOAs: 15
            });
            levelSubjectsCreated++;
          } catch (e) {
            // Ignore duplicate key errors
          }
        }
      }

      res.json({ message: "Seed completed", levels: levelsData.length, subjects: subjectsData.length, levelSubjects: levelSubjectsCreated });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ message: "Failed to seed data" });
    }
  });

  // === GOOGLE DRIVE INTEGRATION ROUTES ===

  // List all folders in Google Drive (admin only)
  app.get("/api/admin/drive/folders", async (req: any, res) => {
    try {
      const folders = await listRootFolders();
      res.json(folders);
    } catch (error) {
      console.error("Error listing Drive folders:", error);
      res.status(500).json({ message: "Failed to list Drive folders" });
    }
  });

  // Search folder by name (admin only)
  app.get("/api/admin/drive/search", async (req: any, res) => {
    try {
      const folderName = req.query.name as string;
      if (!folderName) {
        return res.status(400).json({ message: "Folder name is required" });
      }
      const folder = await searchFolderByName(folderName);
      res.json(folder);
    } catch (error) {
      console.error("Error searching Drive folder:", error);
      res.status(500).json({ message: "Failed to search folder" });
    }
  });

  // List modules in a subject folder (admin only)
  app.get("/api/admin/drive/folders/:folderId/modules", async (req: any, res) => {
    try {
      const modules = await listModuleFolders(req.params.folderId);
      res.json(modules);
    } catch (error) {
      console.error("Error listing modules:", error);
      res.status(500).json({ message: "Failed to list modules" });
    }
  });

  // Get resources from a specific folder (admin only)
  app.get("/api/admin/drive/folders/:folderId/resources", async (req: any, res) => {
    try {
      const resources = await getModuleResources(req.params.folderId);
      res.json(resources);
    } catch (error) {
      console.error("Error getting resources:", error);
      res.status(500).json({ message: "Failed to get resources" });
    }
  });

  // Sync resources from Drive folder to a learning objective (admin only)
  app.post("/api/admin/drive/sync", async (req: any, res) => {
    try {
      const { folderId, learningObjectiveId, moduleNumber } = req.body;

      if (!folderId || !learningObjectiveId) {
        return res.status(400).json({ message: "folderId and learningObjectiveId are required" });
      }

      // Delete existing resources for this learning objective before syncing
      await storage.deleteResourcesByObjective(learningObjectiveId);

      const resources = await getModuleResources(folderId);
      const createdResources: any[] = [];

      const resourceTypeOrder: Record<string, number> = {
        'video': 1,
        'infografia': 2,
        'audio': 3,
        'presentacion': 4
      };

      const sortedResources = [...resources].sort((a, b) => {
        return (resourceTypeOrder[a.type] || 99) - (resourceTypeOrder[b.type] || 99);
      });

      for (let i = 0; i < sortedResources.length; i++) {
        const resource = sortedResources[i];

        const created = await storage.createResource({
          learningObjectiveId: learningObjectiveId,
          resourceType: resource.type as any,
          title: resource.name,
          notebookLmUrl: resource.embedUrl,
          sortOrder: i + 1
        });
        createdResources.push(created);
      }

      res.json({
        message: "Sync completed",
        resourcesCreated: createdResources.length,
        resources: createdResources
      });
    } catch (error) {
      console.error("Error syncing resources:", error);
      res.status(500).json({ message: "Failed to sync resources" });
    }
  });

  // === CALENDAR AND MODULE ACCESS ROUTES ===

  // Get calendar summary
  app.get("/api/calendar/summary", async (req, res) => {
    try {
      const summary = getCalendarSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error getting calendar summary:", error);
      res.status(500).json({ message: "Failed to get calendar summary" });
    }
  });

  // Get all modules schedule for a level-subject (public for development)
  app.get("/api/level-subjects/:id/calendar", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || "dev-user";
      const idOrSlug = req.params.id;
      const currentDate = new Date();

      // Resolve slug to UUID if needed
      const levelSubjectId = await resolveLevelSubjectId(idOrSlug);
      if (!levelSubjectId) {
        return res.status(404).json({ message: "Course not found" });
      }

      const completedModules = await storage.getUserCompletedModules(userId, levelSubjectId);
      const objectives = await storage.getLearningObjectives(levelSubjectId);

      // Admin bypass mode: unlock all modules for development/testing
      const adminBypass = true;
      const modulesSchedule = getAllModulesSchedule(currentDate, completedModules, DEFAULT_CONFIG, adminBypass);

      const modulesWithDetails = modulesSchedule.map(schedule => {
        const objective = objectives.find(o => o.weekNumber === schedule.moduleNumber);
        const dates = formatModuleDates(schedule);

        return {
          ...schedule,
          ...dates,
          objective: objective ? {
            id: objective.id,
            code: objective.code,
            title: objective.title,
            description: objective.description,
          } : null,
        };
      });

      res.json({
        levelSubjectId,
        modules: modulesWithDetails,
        summary: getCalendarSummary(),
      });
    } catch (error) {
      console.error("Error getting calendar:", error);
      res.status(500).json({ message: "Failed to get calendar" });
    }
  });

  // Check if a specific module is accessible
  app.get("/api/modules/:moduleNumber/access", async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const moduleNumber = parseInt(req.params.moduleNumber);
      const levelSubjectId = req.query.levelSubjectId as string;

      if (!levelSubjectId) {
        return res.status(400).json({ message: "levelSubjectId is required" });
      }

      const currentDate = new Date();
      const completedModules = await storage.getUserCompletedModules(userId, levelSubjectId);

      const previousCompleted = moduleNumber === 1 || completedModules.includes(moduleNumber - 1);
      const isAvailable = isModuleAvailable(moduleNumber, currentDate, previousCompleted);

      const schedule = getModuleSchedule(moduleNumber, currentDate, previousCompleted, completedModules.includes(moduleNumber));
      const dates = formatModuleDates(schedule);

      res.json({
        ...schedule,
        ...dates,
        reason: !schedule.isAvailable
          ? (schedule.daysUntilStart > 0
            ? `Disponible en ${schedule.daysUntilStart} días`
            : "Completa el módulo anterior primero")
          : null,
      });
    } catch (error) {
      console.error("Error checking module access:", error);
      res.status(500).json({ message: "Failed to check module access" });
    }
  });

  // Check evaluation availability
  app.get("/api/modules/:moduleNumber/evaluations", async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const moduleNumber = parseInt(req.params.moduleNumber);
      const levelSubjectId = req.query.levelSubjectId as string;
      const currentDate = new Date();

      if (!levelSubjectId) {
        return res.status(400).json({ message: "levelSubjectId is required" });
      }

      const objectives = await storage.getLearningObjectives(levelSubjectId);
      const objective = objectives.find(o => o.weekNumber === moduleNumber);

      if (!objective) {
        return res.status(404).json({ message: "Module not found" });
      }

      const evaluations = await storage.getModuleEvaluations(objective.id);
      const userProgress = await storage.getEvaluationProgressByUser(userId, evaluations.map(e => e.id));

      const schedule = getModuleSchedule(moduleNumber, currentDate, true, false);

      const evaluationsWithStatus = [
        {
          number: 1,
          title: "Evaluación Formativa 1",
          releaseDate: schedule.evaluation1ReleaseDate,
          releaseDateFormatted: formatModuleDates(schedule).eval1Formatted,
          isAvailable: isEvaluationAvailable(moduleNumber, 1, currentDate),
          evaluation: evaluations.find(e => e.evaluationNumber === 1),
          completed: userProgress.some(p => evaluations.find(e => e.evaluationNumber === 1 && e.id === p.evaluationId)),
        },
        {
          number: 2,
          title: "Evaluación Formativa 2",
          releaseDate: schedule.evaluation2ReleaseDate,
          releaseDateFormatted: formatModuleDates(schedule).eval2Formatted,
          isAvailable: isEvaluationAvailable(moduleNumber, 2, currentDate),
          evaluation: evaluations.find(e => e.evaluationNumber === 2),
          completed: userProgress.some(p => evaluations.find(e => e.evaluationNumber === 2 && e.id === p.evaluationId) && p.passed),
        },
      ];

      res.json({
        moduleNumber,
        objectiveId: objective.id,
        evaluations: evaluationsWithStatus,
      });
    } catch (error) {
      console.error("Error getting evaluations:", error);
      res.status(500).json({ message: "Failed to get evaluations" });
    }
  });

  // Mark evaluation as complete
  app.post("/api/evaluations/:id/complete", async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const evaluationId = req.params.id;
      const { score, passed } = req.body;

      const progress = await storage.markEvaluationComplete({
        userId,
        evaluationId,
        completedAt: new Date(),
        score: score || null,
        passed: passed !== undefined ? passed : true,
      });

      res.json(progress);
    } catch (error) {
      console.error("Error completing evaluation:", error);
      res.status(500).json({ message: "Failed to complete evaluation" });
    }
  });

  // Save evaluation HTML content (admin only)
  app.put("/api/admin/evaluations/:objectiveId/:evaluationNumber/html", isAdmin, async (req: any, res) => {
    try {
      const { objectiveId, evaluationNumber } = req.params;
      const { htmlContent } = req.body;

      if (!htmlContent || typeof htmlContent !== 'string') {
        return res.status(400).json({ message: "htmlContent is required" });
      }

      const evalNum = parseInt(evaluationNumber);
      if (isNaN(evalNum) || evalNum < 1 || evalNum > 4) {
        return res.status(400).json({ message: "evaluationNumber must be 1, 2, 3, or 4" });
      }

      const evaluation = await storage.upsertEvaluationHtml(objectiveId, evalNum, htmlContent);
      res.json(evaluation);
    } catch (error) {
      console.error("Error saving evaluation HTML:", error);
      res.status(500).json({ message: "Failed to save evaluation HTML" });
    }
  });

  // Get evaluation HTML content
  app.get("/api/evaluations/:objectiveId/:evaluationNumber/html", async (req: any, res) => {
    try {
      const { objectiveId, evaluationNumber } = req.params;
      const evalNum = parseInt(evaluationNumber);

      const evaluation = await storage.getEvaluationHtml(objectiveId, evalNum);
      res.json({ htmlContent: evaluation?.htmlContent || null });
    } catch (error) {
      console.error("Error getting evaluation HTML:", error);
      res.status(500).json({ message: "Failed to get evaluation HTML" });
    }
  });

  // Upload Word document for ALL modules (admin only)
  app.post("/api/admin/level-subjects/:levelSubjectId/word-upload", isAdmin, upload.single('wordDoc'), async (req: any, res) => {
    try {
      const { levelSubjectId } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Get all learning objectives for this level-subject
      const objectives = await storage.getLearningObjectives(levelSubjectId);
      if (!objectives || objectives.length === 0) {
        return res.status(404).json({ message: "No learning objectives found for this course" });
      }

      // Parse Word document using mammoth
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      const text = result.value;

      // Extract info for all modules from the text
      const parsedModules = parseAllModulesFromText(text);

      // Update each learning objective with its corresponding module info
      const updatedModules: any[] = [];
      for (const parsed of parsedModules) {
        const objective = objectives.find(o => o.weekNumber === parsed.moduleNumber);
        if (objective) {
          const updated = await storage.updateLearningObjectiveModuleInfo(objective.id, {
            moduleOAs: parsed.oas || null,
            moduleContents: parsed.contents || null,
            moduleDateRange: parsed.dateRange || null,
          });
          updatedModules.push({
            moduleNumber: parsed.moduleNumber,
            objectiveId: objective.id,
            updated: !!updated
          });
        }
      }

      res.json({
        success: true,
        modulesUpdated: updatedModules.length,
        modules: updatedModules,
        parsedModules: parsedModules.length
      });
    } catch (error) {
      console.error("Error processing Word document:", error);
      res.status(500).json({ message: "Failed to process Word document" });
    }
  });

  // Get module info for a learning objective
  app.get("/api/objectives/:objectiveId/module-info", async (req: any, res) => {
    try {
      const { objectiveId } = req.params;
      const objective = await storage.getLearningObjectiveById(objectiveId);
      if (!objective) {
        return res.status(404).json({ message: "Learning objective not found" });
      }
      res.json({
        moduleOAs: objective.moduleOAs,
        moduleContents: objective.moduleContents,
        moduleDateRange: objective.moduleDateRange,
      });
    } catch (error) {
      console.error("Error getting module info:", error);
      res.status(500).json({ message: "Failed to get module info" });
    }
  });

  // Update textbook PDF for a level-subject
  app.put("/api/admin/level-subjects/:id/textbook", isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const parsed = updateLevelSubjectTextbookSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request body", errors: parsed.error.flatten() });
      }

      const updated = await storage.updateLevelSubjectTextbook(id, {
        textbookPdfUrl: parsed.data.textbookPdfUrl ?? undefined,
        textbookTitle: parsed.data.textbookTitle ?? undefined
      });
      if (!updated) {
        return res.status(404).json({ message: "Level subject not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating textbook:", error);
      res.status(500).json({ message: "Failed to update textbook" });
    }
  });

  // Update page range for a learning objective (module)
  app.put("/api/admin/learning-objectives/:id/pages", isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const parsed = updateLearningObjectivePagesSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request body", errors: parsed.error.flatten() });
      }

      const updateData: { textbookStartPage?: number; textbookEndPage?: number } = {};

      if (typeof parsed.data.textbookStartPage === 'number') {
        updateData.textbookStartPage = parsed.data.textbookStartPage;
      }

      if (typeof parsed.data.textbookEndPage === 'number') {
        updateData.textbookEndPage = parsed.data.textbookEndPage;
      }

      const updated = await storage.updateLearningObjectivePages(id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "Learning objective not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating page range:", error);
      res.status(500).json({ message: "Failed to update page range" });
    }
  });

  // Get textbook info for a module (public for development)
  app.get("/api/level-subjects/:id/textbook", async (req: any, res) => {
    try {
      const idOrSlug = req.params.id;
      const { moduleNumber } = req.query;

      // Resolve slug to UUID if needed
      const resolvedId = await resolveLevelSubjectId(idOrSlug);
      if (!resolvedId) {
        return res.status(404).json({ message: "Course not found" });
      }

      const levelSubject = await storage.getLevelSubjectById(resolvedId);
      if (!levelSubject) {
        return res.status(404).json({ message: "Level subject not found" });
      }

      let modulePages = null;
      let specificModulePdfUrl = levelSubject.textbookPdfUrl;
      
      if (moduleNumber) {
        const objectives = await storage.getLearningObjectives(resolvedId);
        const objective = objectives.find(o => o.weekNumber === Number(moduleNumber));
        if (objective) {
          modulePages = {
            startPage: objective.textbookStartPage,
            endPage: objective.textbookEndPage
          };
        }
      }

      // Check if textbookPdfUrl is actually a Drive folder URL
      const isFolderUrl = levelSubject.textbookPdfUrl?.includes('/folders/');
      
      if (isFolderUrl && moduleNumber && modulePages) {
        try {
          // Extract folder ID
          const folderIdMatch = levelSubject.textbookPdfUrl?.match(/\/folders\/([a-zA-Z0-9_-]+)/);
          if (folderIdMatch) {
            const folderId = folderIdMatch[1];
            
            // List PDFs from folder and find matching one
            const { listPDFsFromFolder, extractPageRangeFromFilename } = await import("./googleDrive");
            const pdfs = await listPDFsFromFolder(folderId);
            
            // Find PDF that matches this module's page range
            for (const pdf of pdfs) {
              const pdfRange = extractPageRangeFromFilename(pdf.name);
              if (pdfRange && 
                  pdfRange.start === modulePages.startPage && 
                  pdfRange.end === modulePages.endPage) {
                specificModulePdfUrl = pdf.webViewLink;
                console.log(`✅ Found PDF for Module ${moduleNumber}: ${pdf.name}`);
                break;
              }
            }
          }
        } catch (error) {
          console.error("Error finding specific module PDF:", error);
          // Fall back to folder URL if matching fails
        }
      }

      res.json({
        textbookPdfUrl: specificModulePdfUrl,
        textbookTitle: levelSubject.textbookTitle,
        modulePages
      });
    } catch (error) {
      console.error("Error getting textbook info:", error);
      res.status(500).json({ message: "Failed to get textbook info" });
    }
  });

  // PDF Proxy - fetches PDF from Google Drive to bypass CORS with page range support
  // Note: Authentication relaxed for iframe embedding
  app.get("/api/pdf-proxy", async (req: any, res) => {
    try {
      const { url, startPage, endPage } = req.query;
      console.log(`[PDF-PROXY] Request: url=${url}, startPage=${startPage}, endPage=${endPage}`);
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL parameter required" });
      }

      // Extract file ID from Google Drive URL
      let fileId = null;
      if (url.includes("drive.google.com/file/d/")) {
        fileId = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
      } else if (url.includes("drive.google.com/open?id=")) {
        fileId = url.match(/id=([a-zA-Z0-9_-]+)/)?.[1];
      }

      if (!fileId) {
        console.log(`[PDF-PROXY] Invalid URL: ${url}`);
        return res.status(400).json({ message: "Invalid Google Drive URL" });
      }

      console.log(`[PDF-PROXY] Extracted file ID: ${fileId}`);

      // Use Google Drive API with authentication
      console.log(`[PDF-PROXY] Fetching PDF using Google Drive API...`);
      
      let arrayBuffer: ArrayBuffer;
      try {
        const { getGoogleDriveClient } = await import('./googleDrive');
        const drive = await getGoogleDriveClient();
        
        console.log(`[PDF-PROXY] Downloading file ${fileId} from Drive...`);
        const driveResponse = await drive.files.get(
          {
            fileId: fileId,
            alt: 'media'
          },
          { responseType: 'arraybuffer' }
        );

        arrayBuffer = driveResponse.data as ArrayBuffer;
        console.log(`[PDF-PROXY] PDF downloaded successfully from Drive API, size: ${arrayBuffer.byteLength} bytes`);
      } catch (driveError: any) {
        console.error(`[PDF-PROXY] Drive API error:`, driveError.message);
        
        // Fallback to public download URL
        console.log(`[PDF-PROXY] Falling back to public download URL...`);
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        
        const response = await fetch(downloadUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          console.log(`[PDF-PROXY] Fetch failed with status: ${response.status}`);
          return res.status(response.status).json({ message: "Failed to fetch PDF from Google Drive" });
        }

        arrayBuffer = await response.arrayBuffer();
        console.log(`[PDF-PROXY] PDF fetched via public URL, size: ${arrayBuffer.byteLength} bytes`);
      }
      console.log(`[PDF-PROXY] ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);
      
      // If page range is specified, extract only those pages
      if (startPage && endPage) {
        console.log(`[PDF-PROXY] Extracting pages ${startPage}-${endPage}`);
        const { PDFDocument } = await import('pdf-lib');
        
        const start = parseInt(startPage as string, 10);
        const end = parseInt(endPage as string, 10);
        
        if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
          console.log(`[PDF-PROXY] Invalid page range: start=${start}, end=${end}`);
          return res.status(400).json({ message: "Invalid page range" });
        }

        try {
          console.log(`[PDF-PROXY] Loading PDF with pdf-lib...`);
          const startTime = Date.now();
          
          // Load the full PDF with options
          const pdfDoc = await PDFDocument.load(arrayBuffer, { 
            ignoreEncryption: true,
            updateMetadata: false
          });
          
          const totalPages = pdfDoc.getPageCount();
          console.log(`[PDF-PROXY] PDF loaded in ${Date.now() - startTime}ms, total pages: ${totalPages}`);
          
          // Validate page range
          if (start > totalPages || end > totalPages) {
            console.log(`[PDF-PROXY] Page range ${start}-${end} exceeds PDF pages (${totalPages})`);
            return res.status(400).json({ 
              message: `Page range exceeds PDF length`,
              totalPages: totalPages,
              requestedRange: `${start}-${end}`
            });
          }
          
          // Create a new PDF with only the specified pages
          const newPdfDoc = await PDFDocument.create();
          
          // Copy pages (PDFLib uses 0-based indexing)
          console.log(`[PDF-PROXY] Copying pages ${start}-${end}...`);
          const copyStartTime = Date.now();
          
          const pageIndices = Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
          const pages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
          
          // Add copied pages to new document
          pages.forEach(page => newPdfDoc.addPage(page));
          console.log(`[PDF-PROXY] ${pages.length} pages copied in ${Date.now() - copyStartTime}ms`);
          
          // Save the new PDF
          console.log(`[PDF-PROXY] Saving new PDF...`);
          const saveStartTime = Date.now();
          
          const pdfBytes = await newPdfDoc.save({ 
            useObjectStreams: false,
            addDefaultPage: false
          });
          
          const sizeKB = Math.round(pdfBytes.length / 1024);
          console.log(`[PDF-PROXY] New PDF saved in ${Date.now() - saveStartTime}ms, size: ${sizeKB}KB`);
          console.log(`[PDF-PROXY] Total processing time: ${Date.now() - startTime}ms`);
          
          // Set appropriate headers for PDF
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
          res.setHeader('Content-Disposition', 'inline; filename="modulo.pdf"');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Content-Length', pdfBytes.length.toString());
          
          res.send(Buffer.from(pdfBytes));
        } catch (pdfError: any) {
          console.error("[PDF-PROXY] Error processing PDF pages:", pdfError.message);
          return res.status(500).json({ 
            message: "Failed to extract PDF pages", 
            error: pdfError.message 
          });
        }
      } else {
        // No page range, return full PDF
        console.log(`[PDF-PROXY] Returning full PDF`);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Content-Disposition', 'inline; filename="textbook-full.pdf"');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.send(Buffer.from(arrayBuffer));
      }
    } catch (error) {
      console.error("Error proxying PDF:", error);
      res.status(500).json({ message: "Failed to proxy PDF" });
    }
  });

  // Generate AI evaluations for a single module
  app.post("/api/admin/learning-objectives/:id/generate-evaluations", isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const objective = await storage.getLearningObjectiveById(id);
      if (!objective) {
        return res.status(404).json({ message: "Learning objective not found" });
      }

      const results: { evaluationNumber: number; success: boolean; questionCount?: number; error?: string }[] = [];
      const questionCounts = [15, 18, 15, 20];

      for (let evalNum = 1; evalNum <= 4; evalNum++) {
        try {
          const generated = await generateEvaluationQuestions(
            objective.weekNumber,
            evalNum,
            objective.moduleOAs || "",
            objective.moduleContents || "",
            null,
            questionCounts[evalNum - 1]
          );

          await storage.upsertEvaluationQuestions(
            id,
            evalNum,
            JSON.stringify(generated.questions),
            generated.totalQuestions
          );

          results.push({
            evaluationNumber: evalNum,
            success: true,
            questionCount: generated.totalQuestions
          });

          if (evalNum < 4) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        } catch (error: any) {
          console.error(`Error generating evaluation ${evalNum}:`, error);
          results.push({
            evaluationNumber: evalNum,
            success: false,
            error: error.message
          });
        }
      }

      res.json({
        message: "Evaluation generation completed",
        moduleNumber: objective.weekNumber,
        results
      });
    } catch (error) {
      console.error("Error generating evaluations:", error);
      res.status(500).json({ message: "Failed to generate evaluations" });
    }
  });

  // Generate AI evaluations for all modules in a level-subject (batch generation)
  app.post("/api/admin/level-subjects/:id/generate-all-evaluations", isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const startModule = Math.max(1, Math.min(15, Number(req.body.startModule) || 1));
      const endModule = Math.max(1, Math.min(15, Number(req.body.endModule) || 15));

      const objectives = await storage.getLearningObjectives(id);
      if (objectives.length === 0) {
        return res.status(404).json({ message: "No learning objectives found" });
      }

      const filteredObjectives = objectives.filter(
        o => o.weekNumber >= startModule && o.weekNumber <= endModule
      );

      const allResults: { moduleNumber: number; results: any[] }[] = [];
      const questionCounts = [15, 18, 15, 20];

      for (const objective of filteredObjectives) {
        const moduleResults: { evaluationNumber: number; success: boolean; questionCount?: number; error?: string }[] = [];

        for (let evalNum = 1; evalNum <= 4; evalNum++) {
          try {
            const generated = await generateEvaluationQuestions(
              objective.weekNumber,
              evalNum,
              objective.moduleOAs || "",
              objective.moduleContents || "",
              null,
              questionCounts[evalNum - 1]
            );

            await storage.upsertEvaluationQuestions(
              objective.id,
              evalNum,
              JSON.stringify(generated.questions),
              generated.totalQuestions
            );

            moduleResults.push({
              evaluationNumber: evalNum,
              success: true,
              questionCount: generated.totalQuestions
            });

            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error: any) {
            console.error(`Error generating M${objective.weekNumber} E${evalNum}:`, error);
            moduleResults.push({
              evaluationNumber: evalNum,
              success: false,
              error: error.message
            });
          }
        }

        allResults.push({
          moduleNumber: objective.weekNumber,
          results: moduleResults
        });
      }

      res.json({
        message: "Evaluation generation completed",
        totalModules: filteredObjectives.length,
        results: allResults
      });
    } catch (error) {
      console.error("Error generating all evaluations:", error);
      res.status(500).json({ message: "Failed to generate evaluations" });
    }
  });

  // Get evaluation with questions for a student
  app.get("/api/evaluations/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      const evaluation = await storage.getModuleEvaluationById(id);
      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }

      if (!evaluation.questionsJson) {
        return res.status(404).json({ message: "No questions available for this evaluation" });
      }

      const questions = JSON.parse(evaluation.questionsJson);
      const questionsWithoutAnswers = questions.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options
      }));

      res.json({
        id: evaluation.id,
        title: evaluation.title,
        totalQuestions: evaluation.totalQuestions,
        passingScore: evaluation.passingScore,
        questions: questionsWithoutAnswers
      });
    } catch (error) {
      console.error("Error getting evaluation:", error);
      res.status(500).json({ message: "Failed to get evaluation" });
    }
  });

  // Submit evaluation answers
  app.post("/api/evaluations/:id/submit", async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const { answers } = req.body;

      if (!Array.isArray(answers)) {
        return res.status(400).json({ message: "Answers must be an array" });
      }

      const evaluation = await storage.getModuleEvaluationById(id);
      if (!evaluation || !evaluation.questionsJson) {
        return res.status(404).json({ message: "Evaluation not found" });
      }

      const questions = JSON.parse(evaluation.questionsJson);
      let correctCount = 0;
      const results: { questionId: number; correct: boolean; correctAnswer: number; explanation: string }[] = [];

      for (const question of questions) {
        const userAnswer = answers.find((a: { questionId: number }) => a.questionId === question.id);
        const isCorrect = userAnswer && userAnswer.answer === question.correctAnswer;
        if (isCorrect) correctCount++;

        results.push({
          questionId: question.id,
          correct: isCorrect,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation
        });
      }

      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= (evaluation.passingScore || 60);

      await storage.saveEvaluationAttempt(
        userId,
        id,
        correctCount,
        questions.length,
        JSON.stringify(answers),
        passed
      );

      res.json({
        score,
        totalCorrect: correctCount,
        totalQuestions: questions.length,
        passed,
        passingScore: evaluation.passingScore || 60,
        results
      });
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      res.status(500).json({ message: "Failed to submit evaluation" });
    }
  });

  // Get module evaluations with generation status
  app.get("/api/learning-objectives/:id/evaluations", async (req: any, res) => {
    try {
      const { id } = req.params;
      const evaluations = await storage.getModuleEvaluations(id);

      const evaluationsWithStatus = evaluations.map(e => ({
        id: e.id,
        evaluationNumber: e.evaluationNumber,
        title: e.title,
        releaseDay: e.releaseDay,
        releaseWeek: e.releaseWeek,
        hasQuestions: !!e.questionsJson,
        totalQuestions: e.totalQuestions,
        generatedAt: e.generatedAt
      }));

      res.json(evaluationsWithStatus);
    } catch (error) {
      console.error("Error getting evaluations:", error);
      res.status(500).json({ message: "Failed to get evaluations" });
    }
  });

  // ===== TEXTBOOK CONFIGURATION ENDPOINTS =====
  
  // List PDF files from a Google Drive folder
  app.get("/api/drive/folder/:folderId/pdfs", async (req, res) => {
    try {
      const { folderId } = req.params;
      const { listPDFsFromFolder, extractPageRangeFromFilename } = await import("./googleDrive");
      
      const pdfs = await listPDFsFromFolder(folderId);
      
      // Add extracted page ranges to each PDF
      const pdfsWithRanges = pdfs.map(pdf => ({
        ...pdf,
        pageRange: extractPageRangeFromFilename(pdf.name)
      }));
      
      res.json(pdfsWithRanges);
    } catch (error) {
      console.error("Error listing PDFs from Drive folder:", error);
      res.status(500).json({ message: "Failed to list PDFs from folder" });
    }
  });

  // Auto-match PDFs from folder to modules
  app.post("/api/textbooks/auto-match", async (req, res) => {
    try {
      const { folderId, modulePagesConfig } = req.body;
      
      if (!folderId || !modulePagesConfig) {
        return res.status(400).json({ message: "Missing folderId or modulePagesConfig" });
      }

      const { listPDFsFromFolder, matchPDFsToModules } = await import("./googleDrive");
      
      const pdfs = await listPDFsFromFolder(folderId);
      const matches = matchPDFsToModules(pdfs, modulePagesConfig);
      
      res.json({ matches, totalPDFs: pdfs.length, matchedModules: Object.keys(matches).length });
    } catch (error) {
      console.error("Error auto-matching PDFs:", error);
      res.status(500).json({ message: "Failed to auto-match PDFs" });
    }
  });
  
  // Get all textbook configs
  app.get("/api/textbooks", async (req, res) => {
    try {
      const textbooks = await storage.getAllTextbookConfigs();
      res.json(textbooks);
    } catch (error) {
      console.error("Error fetching textbook configs:", error);
      res.status(500).json({ message: "Failed to fetch textbook configs" });
    }
  });

  // Get textbook config for a specific subject
  app.get("/api/textbooks/subject/:subjectId", async (req, res) => {
    try {
      const textbook = await storage.getTextbookConfigBySubject(req.params.subjectId);
      if (!textbook) {
        return res.status(404).json({ message: "Textbook config not found" });
      }
      res.json(textbook);
    } catch (error) {
      console.error("Error fetching textbook config:", error);
      res.status(500).json({ message: "Failed to fetch textbook config" });
    }
  });

  // Get pages for a specific module
  app.get("/api/textbooks/module/:levelSubjectId/:moduleNumber", async (req, res) => {
    try {
      const { levelSubjectId, moduleNumber } = req.params;
      
      // Get the level-subject to find the subject
      const levelSubject = await storage.getLevelSubjectById(levelSubjectId);
      if (!levelSubject) {
        return res.status(404).json({ message: "Level-subject not found" });
      }

      const textbook = await storage.getTextbookConfigBySubject(levelSubject.subjectId);
      if (!textbook) {
        return res.status(404).json({ message: "No textbook configured for this subject" });
      }

      // Parse the module pages config
      const modulePagesConfig = JSON.parse(textbook.modulePagesConfig);
      const moduleKey = `module_${moduleNumber}`;
      const pages = modulePagesConfig[moduleKey];

      if (!pages) {
        return res.status(404).json({ message: "No pages configured for this module" });
      }

      res.json({
        pdfUrl: textbook.pdfUrl,
        pdfName: textbook.pdfName,
        startPage: pages.start,
        endPage: pages.end,
        totalPages: textbook.totalPages
      });
    } catch (error) {
      console.error("Error fetching module pages:", error);
      res.status(500).json({ message: "Failed to fetch module pages" });
    }
  });

  // Create or update textbook config (Admin only)
  app.post("/api/textbooks", isAdmin, async (req, res) => {
    try {
      const { subjectId, pdfUrl, pdfName, totalPages, modulePagesConfig } = req.body;

      // Validate required fields
      if (!subjectId || !pdfUrl || !pdfName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if config already exists for this subject
      const existing = await storage.getTextbookConfigBySubject(subjectId);

      if (existing) {
        // Update existing
        const updated = await storage.updateTextbookConfig(existing.id, {
          pdfUrl,
          pdfName,
          totalPages,
          modulePagesConfig: typeof modulePagesConfig === 'string' 
            ? modulePagesConfig 
            : JSON.stringify(modulePagesConfig)
        });
        res.json(updated);
      } else {
        // Create new
        const created = await storage.createTextbookConfig({
          subjectId,
          pdfUrl,
          pdfName,
          totalPages,
          modulePagesConfig: typeof modulePagesConfig === 'string' 
            ? modulePagesConfig 
            : JSON.stringify(modulePagesConfig),
          modulePDFsMap: '{}'
        });
        res.json(created);
      }
    } catch (error) {
      console.error("Error saving textbook config:", error);
      res.status(500).json({ message: "Failed to save textbook config" });
    }
  });

  // Update module pages config (Admin only)
  app.patch("/api/textbooks/:id/modules", isAdmin, async (req, res) => {
    try {
      const { modulePagesConfig } = req.body;

      if (!modulePagesConfig) {
        return res.status(400).json({ message: "Missing modulePagesConfig" });
      }

      const updated = await storage.updateTextbookConfig(getStringParam(req.params.id), {
        modulePagesConfig: typeof modulePagesConfig === 'string' 
          ? modulePagesConfig 
          : JSON.stringify(modulePagesConfig),
        updatedAt: new Date()
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating module pages:", error);
      res.status(500).json({ message: "Failed to update module pages" });
    }
  });

  // Delete textbook config (Admin only)
  app.delete("/api/textbooks/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteTextbookConfig(getStringParam(req.params.id));
      res.json({ message: "Textbook config deleted" });
    } catch (error) {
      console.error("Error deleting textbook config:", error);
      res.status(500).json({ message: "Failed to delete textbook config" });
    }
  });

  // ========== RESERVATIONS API ==========
  
  // Create a new reservation (Public endpoint - no auth required)
  app.post("/api/reservations", async (req, res) => {
    try {
      // Validate request body
      const result = insertReservationSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Datos de reserva inválidos", 
          errors: result.error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        });
      }
      
      // Create reservation
      const reservation = await storage.createReservation(result.data);
      
      res.status(201).json(reservation);
    } catch (error) {
      console.error("Error creating reservation:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create reservation" });
    }
  });

  // Get all reservations (Admin only)
  app.get("/api/reservations", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const reservations = await storage.getAllReservations();
      res.json(reservations);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  // Get reservation by ID (Admin only)
  app.get("/api/reservations/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const reservation = await storage.getReservationById(getStringParam(req.params.id));
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      res.json(reservation);
    } catch (error) {
      console.error("Error fetching reservation:", error);
      res.status(500).json({ message: "Failed to fetch reservation" });
    }
  });

  // Update reservation status (Admin only)
  app.patch("/api/reservations/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !["pending", "contacted", "enrolled", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const updated = await storage.updateReservationStatus(getStringParam(req.params.id), status);
      res.json(updated);
    } catch (error) {
      console.error("Error updating reservation:", error);
      res.status(500).json({ message: "Failed to update reservation" });
    }
  });

  // Delete reservation (Admin only)
  app.delete("/api/reservations/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteReservation(getStringParam(req.params.id));
      res.json({ message: "Reservation deleted" });
    } catch (error) {
      console.error("Error deleting reservation:", error);
      res.status(500).json({ message: "Failed to delete reservation" });
    }
  });

  // ========== PLAN CONFIGURATIONS API ==========
  
  // Get all plan configurations (Public - for displaying on landing page)
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await storage.getAllPlanConfigurations();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  // Get plan by key (Public)
  app.get("/api/plans/key/:planKey", async (req, res) => {
    try {
      const plan = await storage.getPlanConfigurationByKey(req.params.planKey);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching plan:", error);
      res.status(500).json({ message: "Failed to fetch plan" });
    }
  });

  // Create new plan (Admin only)
  app.post("/api/plans", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const plan = await storage.createPlanConfiguration(req.body);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating plan:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create plan" });
    }
  });

  // Update plan (Admin only)
  app.patch("/api/plans/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const updated = await storage.updatePlanConfiguration(getStringParam(req.params.id), req.body);
      if (!updated) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(500).json({ message: "Failed to update plan" });
    }
  });

  // Delete plan (Admin only)
  app.delete("/api/plans/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deletePlanConfiguration(getStringParam(req.params.id));
      res.json({ message: "Plan deleted" });
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ message: "Failed to delete plan" });
    }
  });

  // Initialize default plans (Admin only - one-time setup)
  app.post("/api/plans/initialize", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.initializeDefaultPlans();
      res.json({ message: "Default plans initialized" });
    } catch (error) {
      console.error("Error initializing plans:", error);
      res.status(500).json({ message: "Failed to initialize plans" });
    }
  });

  // ========== SITE CONFIGURATION API ==========
  
  // Get all site configurations (Public)
  app.get("/api/site-config", async (req, res) => {
    try {
      const configs = await storage.getAllSiteConfigurations();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching site config:", error);
      res.status(500).json({ message: "Failed to fetch site configuration" });
    }
  });

  // Get site configuration by key (Public)
  app.get("/api/site-config/:key", async (req, res) => {
    try {
      const config = await storage.getSiteConfigurationByKey(req.params.key);
      if (!config) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching site config:", error);
      res.status(500).json({ message: "Failed to fetch site configuration" });
    }
  });

  // Upsert site configuration (Admin only)
  app.post("/api/site-config", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const config = await storage.upsertSiteConfiguration(req.body);
      res.json(config);
    } catch (error) {
      console.error("Error upserting site config:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to upsert site configuration" });
    }
  });

  // Initialize default site config (Admin only)
  app.post("/api/site-config/initialize", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.initializeDefaultSiteConfig();
      res.json({ message: "Default site configuration initialized" });
    } catch (error) {
      console.error("Error initializing site config:", error);
      res.status(500).json({ message: "Failed to initialize site configuration" });
    }
  });

  // ========== ADULT CYCLE CONFIGURATIONS API ==========
  
  // Get all adult cycles (Public)
  app.get("/api/adult-cycles", async (req, res) => {
    try {
      const cycles = await storage.getAllAdultCycleConfigurations();
      res.json(cycles);
    } catch (error) {
      console.error("Error fetching adult cycles:", error);
      res.status(500).json({ message: "Failed to fetch adult cycles" });
    }
  });

  // Get adult cycle by key (Public)
  app.get("/api/adult-cycles/key/:cycleKey", async (req, res) => {
    try {
      const cycle = await storage.getAdultCycleConfigurationByKey(req.params.cycleKey);
      if (!cycle) {
        return res.status(404).json({ message: "Cycle not found" });
      }
      res.json(cycle);
    } catch (error) {
      console.error("Error fetching adult cycle:", error);
      res.status(500).json({ message: "Failed to fetch adult cycle" });
    }
  });

  // Create new adult cycle (Admin only)
  app.post("/api/adult-cycles", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const cycle = await storage.createAdultCycleConfiguration(req.body);
      res.status(201).json(cycle);
    } catch (error) {
      console.error("Error creating adult cycle:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create adult cycle" });
    }
  });

  // Update adult cycle (Admin only)
  app.patch("/api/adult-cycles/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const updated = await storage.updateAdultCycleConfiguration(getStringParam(req.params.id), req.body);
      if (!updated) {
        return res.status(404).json({ message: "Cycle not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating adult cycle:", error);
      res.status(500).json({ message: "Failed to update adult cycle" });
    }
  });

  // Delete adult cycle (Admin only)
  app.delete("/api/adult-cycles/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteAdultCycleConfiguration(getStringParam(req.params.id));
      res.json({ message: "Cycle deleted" });
    } catch (error) {
      console.error("Error deleting adult cycle:", error);
      res.status(500).json({ message: "Failed to delete adult cycle" });
    }
  });

  // Initialize default adult cycles (Admin only)
  app.post("/api/adult-cycles/initialize", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.initializeDefaultAdultCycles();
      res.json({ message: "Default adult cycles initialized" });
    } catch (error) {
      console.error("Error initializing adult cycles:", error);
      res.status(500).json({ message: "Failed to initialize adult cycles" });
    }
  });

  // ============================================
  // Gemini Copilots Routes
  // ============================================

  // POST: Send chat message to Gemini
  app.post("/api/academic-copilot/chat", async (req, res) => {
    try {
      const { message, conversationHistory } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const { sendChatMessage } = await import('./geminiChat');
      const response = await sendChatMessage(message, conversationHistory || []);
      
      res.json({ response });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process chat message" 
      });
    }
  });

  // GET: Get all copilots
  app.get("/api/gemini-copilots", async (req, res) => {
    try {
      const copilots = await storage.getAllGeminiCopilots();
      res.json(copilots);
    } catch (error) {
      console.error("Error fetching copilots:", error);
      res.status(500).json({ message: "Failed to fetch copilots" });
    }
  });

  // GET: Get copilot by level ID
  app.get("/api/gemini-copilots/by-level/:levelId", async (req, res) => {
    try {
      const copilot = await storage.getGeminiCopilotByLevel(req.params.levelId);
      if (!copilot) {
        return res.status(404).json({ message: "No copilot found for this level" });
      }
      res.json(copilot);
    } catch (error) {
      console.error("Error fetching copilot:", error);
      res.status(500).json({ message: "Failed to fetch copilot" });
    }
  });

  // GET: Get copilot by ID
  app.get("/api/gemini-copilots/:id", async (req, res) => {
    try {
      const copilot = await storage.getGeminiCopilotById(req.params.id);
      if (!copilot) {
        return res.status(404).json({ message: "Copilot not found" });
      }
      res.json(copilot);
    } catch (error) {
      console.error("Error fetching copilot:", error);
      res.status(500).json({ message: "Failed to fetch copilot" });
    }
  });

  // POST: Create new copilot (Admin only)
  app.post("/api/gemini-copilots", isAdmin, async (req, res) => {
    try {
      const copilot = await storage.createGeminiCopilot(req.body);
      res.status(201).json({ message: "Copilot created successfully", data: copilot });
    } catch (error: any) {
      console.error("Error creating copilot:", error);
      res.status(500).json({ message: "Failed to create copilot", error: error.message });
    }
  });

  // PUT: Update copilot (Admin only)
  app.put("/api/gemini-copilots/:id", isAdmin, async (req, res) => {
    try {
      const copilot = await storage.updateGeminiCopilot(getStringParam(req.params.id), req.body);
      if (!copilot) {
        return res.status(404).json({ message: "Copilot not found" });
      }
      res.json({ message: "Copilot updated successfully", data: copilot });
    } catch (error: any) {
      console.error("Error updating copilot:", error);
      res.status(500).json({ message: "Failed to update copilot", error: error.message });
    }
  });

  // DELETE: Delete copilot (Admin only)
  app.delete("/api/gemini-copilots/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteGeminiCopilot(getStringParam(req.params.id));
      res.json({ message: "Copilot deleted successfully" });
    } catch (error) {
      console.error("Error deleting copilot:", error);
      res.status(500).json({ message: "Failed to delete copilot" });
    }
  });

  // PATCH: Toggle active status (Admin only)
  app.patch("/api/gemini-copilots/:id/toggle", isAdmin, async (req, res) => {
    try {
      const copilot = await storage.toggleGeminiCopilotStatus(getStringParam(req.params.id));
      if (!copilot) {
        return res.status(404).json({ message: "Copilot not found" });
      }
      res.json({ message: "Copilot status toggled", data: copilot });
    } catch (error) {
      console.error("Error toggling copilot:", error);
      res.status(500).json({ message: "Failed to toggle copilot status" });
    }
  });

  // ============================================
  // Level-Based Plan Configurations Routes
  // ============================================

  // GET: Get all level-based plans
  app.get("/api/level-plans", async (req, res) => {
    try {
      const plans = await storage.getAllLevelPlanConfigurations();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching level plans:", error);
      res.status(500).json({ message: "Failed to fetch level plans" });
    }
  });

  // GET: Get level plan by ID
  app.get("/api/level-plans/:id", async (req, res) => {
    try {
      const plan = await storage.getLevelPlanConfigurationById(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Level plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching level plan:", error);
      res.status(500).json({ message: "Failed to fetch level plan" });
    }
  });

  // GET: Get level plan by key
  app.get("/api/level-plans/key/:levelGroupKey", async (req, res) => {
    try {
      const plan = await storage.getLevelPlanConfigurationByKey(req.params.levelGroupKey);
      if (!plan) {
        return res.status(404).json({ message: "Level plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching level plan:", error);
      res.status(500).json({ message: "Failed to fetch level plan" });
    }
  });

  // POST: Create new level plan (Admin only)
  app.post("/api/level-plans", isAdmin, async (req, res) => {
    try {
      const plan = await storage.createLevelPlanConfiguration(req.body);
      res.status(201).json({ message: "Level plan created successfully", data: plan });
    } catch (error: any) {
      console.error("Error creating level plan:", error);
      res.status(500).json({ message: "Failed to create level plan", error: error.message });
    }
  });

  // PATCH: Update level plan (Admin only)
  app.patch("/api/level-plans/:id", isAdmin, async (req, res) => {
    try {
      const plan = await storage.updateLevelPlanConfiguration(getStringParam(req.params.id), req.body);
      if (!plan) {
        return res.status(404).json({ message: "Level plan not found" });
      }
      res.json({ message: "Level plan updated successfully", data: plan });
    } catch (error: any) {
      console.error("Error updating level plan:", error);
      res.status(500).json({ message: "Failed to update level plan", error: error.message });
    }
  });

  // DELETE: Delete level plan (Admin only)
  app.delete("/api/level-plans/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteLevelPlanConfiguration(getStringParam(req.params.id));
      res.json({ message: "Level plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting level plan:", error);
      res.status(500).json({ message: "Failed to delete level plan" });
    }
  });

  // POST: Initialize default level plans (Admin only)
  app.post("/api/level-plans/initialize", isAdmin, async (req, res) => {
    try {
      await storage.initializeDefaultLevelPlans();
      res.json({ message: "Default level plans initialized successfully" });
    } catch (error) {
      console.error("Error initializing level plans:", error);
      res.status(500).json({ message: "Failed to initialize level plans" });
    }
  });

  // Register evaluation links routes
  registerEvaluationLinksRoutes(app);

  // Register FAQ routes
  registerFaqRoutes(app);

  // Register PAES routes
  registerPaesRoutes(app);

  // Register Sales Chat routes
  registerSalesChatRoutes(app);

  // Register Flow.cl payment routes
  registerFlowRoutes(app);

  return httpServer;
}
