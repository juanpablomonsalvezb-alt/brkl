import type { Express, Request, Response } from "express";
import { db } from "./db";
import { 
  paesSubjects, 
  paesPlans, 
  paesSubscriptions,
  insertPaesSubjectSchema,
  insertPaesPlanSchema,
  insertPaesSubscriptionSchema,
  type PaesSubject,
  type PaesPlan,
  type PaesSubscription
} from "../shared/schema";
import { eq, desc } from "drizzle-orm";

export function registerPaesRoutes(app: Express) {
  
  // ============================================
  // PAES SUBJECTS ROUTES
  // ============================================
  
  // GET: All active subjects (public)
  app.get("/api/paes/subjects", async (req: Request, res: Response) => {
    try {
      const subjects = await db
        .select()
        .from(paesSubjects)
        .where(eq(paesSubjects.isActive, true))
        .orderBy(paesSubjects.sortOrder, paesSubjects.name);

      return res.json(subjects);
    } catch (error: any) {
      console.error("Error fetching PAES subjects:", error);
      return res.status(500).json({ error: "Error al obtener materias PAES" });
    }
  });

  // GET: All subjects including inactive (admin)
  app.get("/api/admin/paes/subjects", async (req: Request, res: Response) => {
    try {
      const subjects = await db
        .select()
        .from(paesSubjects)
        .orderBy(paesSubjects.sortOrder, paesSubjects.name);

      return res.json(subjects);
    } catch (error: any) {
      console.error("Error fetching all PAES subjects:", error);
      return res.status(500).json({ error: "Error al obtener materias PAES" });
    }
  });

  // POST: Create subject (admin)
  app.post("/api/admin/paes/subjects", async (req: Request, res: Response) => {
    try {
      const validated = insertPaesSubjectSchema.safeParse(req.body);
      
      if (!validated.success) {
        return res.status(400).json({ 
          error: "Datos inválidos",
          details: validated.error.errors 
        });
      }

      const newSubject = await db
        .insert(paesSubjects)
        .values(validated.data)
        .returning();

      return res.status(201).json(newSubject[0]);
    } catch (error: any) {
      console.error("Error creating PAES subject:", error);
      return res.status(500).json({ error: "Error al crear materia PAES" });
    }
  });

  // PUT: Update subject (admin)
  app.put("/api/admin/paes/subjects/:id", async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validated = insertPaesSubjectSchema.partial().safeParse(req.body);
      
      if (!validated.success) {
        return res.status(400).json({ 
          error: "Datos inválidos",
          details: validated.error.errors 
        });
      }

      const updated = await db
        .update(paesSubjects)
        .set({ ...validated.data, updatedAt: new Date() })
        .where(eq(paesSubjects.id, id as string))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Materia no encontrada" });
      }

      return res.json(updated[0]);
    } catch (error: any) {
      console.error("Error updating PAES subject:", error);
      return res.status(500).json({ error: "Error al actualizar materia PAES" });
    }
  });

  // DELETE: Delete subject (admin)
  app.delete("/api/admin/paes/subjects/:id", async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      await db
        .delete(paesSubjects)
        .where(eq(paesSubjects.id, id as string));

      return res.json({ message: "Materia eliminada exitosamente" });
    } catch (error: any) {
      console.error("Error deleting PAES subject:", error);
      return res.status(500).json({ error: "Error al eliminar materia PAES" });
    }
  });

  // ============================================
  // PAES PLANS ROUTES
  // ============================================

  // GET: All active plans (public)
  app.get("/api/paes/plans", async (req: Request, res: Response) => {
    try {
      const plans = await db
        .select()
        .from(paesPlans)
        .where(eq(paesPlans.isActive, true))
        .orderBy(paesPlans.sortOrder);

      return res.json(plans);
    } catch (error: any) {
      console.error("Error fetching PAES plans:", error);
      return res.status(500).json({ error: "Error al obtener planes PAES" });
    }
  });

  // GET: All plans including inactive (admin)
  app.get("/api/admin/paes/plans", async (req: Request, res: Response) => {
    try {
      const plans = await db
        .select()
        .from(paesPlans)
        .orderBy(paesPlans.sortOrder);

      return res.json(plans);
    } catch (error: any) {
      console.error("Error fetching all PAES plans:", error);
      return res.status(500).json({ error: "Error al obtener planes PAES" });
    }
  });

  // POST: Create plan (admin)
  app.post("/api/admin/paes/plans", async (req: Request, res: Response) => {
    try {
      const validated = insertPaesPlanSchema.safeParse(req.body);
      
      if (!validated.success) {
        return res.status(400).json({ 
          error: "Datos inválidos",
          details: validated.error.errors 
        });
      }

      const newPlan = await db
        .insert(paesPlans)
        .values(validated.data)
        .returning();

      return res.status(201).json(newPlan[0]);
    } catch (error: any) {
      console.error("Error creating PAES plan:", error);
      return res.status(500).json({ error: "Error al crear plan PAES" });
    }
  });

  // PUT: Update plan (admin)
  app.put("/api/admin/paes/plans/:id", async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validated = insertPaesPlanSchema.partial().safeParse(req.body);
      
      if (!validated.success) {
        return res.status(400).json({ 
          error: "Datos inválidos",
          details: validated.error.errors 
        });
      }

      const updated = await db
        .update(paesPlans)
        .set({ ...validated.data, updatedAt: new Date() })
        .where(eq(paesPlans.id, id as string))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Plan no encontrado" });
      }

      return res.json(updated[0]);
    } catch (error: any) {
      console.error("Error updating PAES plan:", error);
      return res.status(500).json({ error: "Error al actualizar plan PAES" });
    }
  });

  // DELETE: Delete plan (admin)
  app.delete("/api/admin/paes/plans/:id", async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      await db
        .delete(paesPlans)
        .where(eq(paesPlans.id, id as string));

      return res.json({ message: "Plan eliminado exitosamente" });
    } catch (error: any) {
      console.error("Error deleting PAES plan:", error);
      return res.status(500).json({ error: "Error al eliminar plan PAES" });
    }
  });

  // ============================================
  // PAES SUBSCRIPTIONS ROUTES
  // ============================================

  // GET: All subscriptions (admin)
  app.get("/api/admin/paes/subscriptions", async (req: Request, res: Response) => {
    try {
      const subscriptions = await db
        .select()
        .from(paesSubscriptions)
        .orderBy(desc(paesSubscriptions.createdAt));

      return res.json(subscriptions);
    } catch (error: any) {
      console.error("Error fetching PAES subscriptions:", error);
      return res.status(500).json({ error: "Error al obtener inscripciones PAES" });
    }
  });

  // POST: Create subscription (public/user)
  app.post("/api/paes/subscriptions", async (req: Request, res: Response) => {
    try {
      const validated = insertPaesSubscriptionSchema.safeParse(req.body);
      
      if (!validated.success) {
        return res.status(400).json({ 
          error: "Datos inválidos",
          details: validated.error.errors 
        });
      }

      const newSubscription = await db
        .insert(paesSubscriptions)
        .values(validated.data)
        .returning();

      return res.status(201).json(newSubscription[0]);
    } catch (error: any) {
      console.error("Error creating PAES subscription:", error);
      return res.status(500).json({ error: "Error al crear inscripción PAES" });
    }
  });

  // PUT: Update subscription status (admin)
  app.put("/api/admin/paes/subscriptions/:id", async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status, notes } = req.body;

      const updated = await db
        .update(paesSubscriptions)
        .set({ 
          status, 
          notes,
          updatedAt: new Date() 
        })
        .where(eq(paesSubscriptions.id, id as string))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Inscripción no encontrada" });
      }

      return res.json(updated[0]);
    } catch (error: any) {
      console.error("Error updating PAES subscription:", error);
      return res.status(500).json({ error: "Error al actualizar inscripción PAES" });
    }
  });

  // DELETE: Delete subscription (admin)
  app.delete("/api/admin/paes/subscriptions/:id", async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      await db
        .delete(paesSubscriptions)
        .where(eq(paesSubscriptions.id, id as string));

      return res.json({ message: "Inscripción eliminada exitosamente" });
    } catch (error: any) {
      console.error("Error deleting PAES subscription:", error);
      return res.status(500).json({ error: "Error al eliminar inscripción PAES" });
    }
  });
}
