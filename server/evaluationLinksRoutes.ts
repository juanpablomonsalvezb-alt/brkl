import { Express, Request, Response } from "express";
import { db } from "./db";
import { evaluationLinks, insertEvaluationLinkSchema, userProfiles } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { checkModuleAccess, hasActiveEnrollment } from "./vortice";
import { resolveCalendarConfigForLevelSubject } from "./calendarConfig";
import { isEvaluationAvailable } from "./calendarUtils";

type EvaluationLink = typeof evaluationLinks.$inferSelect;

// Los enlaces de evaluación (Gemini) son privados: se exige sesión; el admin real ve todos;
// el estudiante solo los de su asignatura matriculada, de módulos abiertos y ya liberados.
async function visibleLinks(
  req: Request, res: Response, courseId: string, links: EvaluationLink[], moduleNumber?: number,
): Promise<EvaluationLink[] | null> {
  const user = (req as any).user;
  const userId: string | undefined = user?.id || user?.claims?.sub;
  if (!userId) { res.status(401).json({ error: "No autorizado" }); return null; }
  const [profile] = await db.select({ role: userProfiles.role }).from(userProfiles).where(eq(userProfiles.userId, userId));
  if (profile?.role === "admin") return links;
  if (!(await hasActiveEnrollment(db, userId, courseId))) {
    res.status(403).json({ error: "No tienes matrícula activa en esta asignatura" });
    return null;
  }
  const now = new Date();
  const config = await resolveCalendarConfigForLevelSubject(db, courseId, now);
  const openModules = new Map<number, boolean>();
  const isOpen = async (m: number) => {
    if (!openModules.has(m)) openModules.set(m, (await checkModuleAccess(db, userId, courseId, m, now, config)).ok);
    return openModules.get(m)!;
  };
  if (moduleNumber !== undefined && !(await isOpen(moduleNumber))) {
    res.status(403).json({ error: "El módulo aún no está disponible" });
    return null;
  }
  const visible: EvaluationLink[] = [];
  for (const l of links) {
    if (!(await isOpen(l.moduleNumber))) continue;
    const n = l.evaluationNumber;
    const released = l.releaseDate
      ? l.releaseDate.getTime() <= now.getTime()
      : n >= 1 && n <= 4 && isEvaluationAvailable(l.moduleNumber, n as 1 | 2 | 3 | 4, now, config);
    if (released) visible.push(l);
  }
  return visible;
}

export function registerEvaluationLinksRoutes(app: Express) {
  
  // GET: Obtener links de evaluaciones por curso y módulo
  app.get("/api/evaluation-links/:courseId/:moduleNumber", async (req: Request, res: Response) => {
    try {
      const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
      const moduleNumberParam = Array.isArray(req.params.moduleNumber) ? req.params.moduleNumber[0] : req.params.moduleNumber;
      const moduleNumber = parseInt(moduleNumberParam);

      if (!courseId || isNaN(moduleNumber)) {
        return res.status(400).json({ error: "IDs inválidos" });
      }

      const links = await db
        .select()
        .from(evaluationLinks)
        .where(
          and(
            eq(evaluationLinks.courseId, courseId.toString()),
            eq(evaluationLinks.moduleNumber, moduleNumber)
          )
        )
        .orderBy(evaluationLinks.evaluationNumber);

      const visible = await visibleLinks(req, res, courseId.toString(), links, moduleNumber);
      if (!visible) return;
      return res.json(visible);
    } catch (error: any) {
      console.error("Error fetching evaluation links:", error);
      return res.status(500).json({ error: "Error al obtener links" });
    }
  });

  // Helper function to calculate release dates
  function calculateReleaseDate(moduleNumber: number, evaluationNumber: number): Date {
    const programStartDate = new Date(2026, 2, 9); // Monday, March 9, 2026
    const moduleDurationWeeks = 2;
    
    // Calculate module start (accounting for eval weeks after modules 7 and 15)
    let weeksOffset = (moduleNumber - 1) * moduleDurationWeeks;
    if (moduleNumber > 7) weeksOffset += 1; // Add eval week after module 7
    if (moduleNumber > 15) weeksOffset += 1; // Add eval week after module 15
    
    const moduleStart = new Date(programStartDate);
    moduleStart.setDate(moduleStart.getDate() + (weeksOffset * 7));
    
    // Calculate specific evaluation date
    if (evaluationNumber === 1) {
      // Week 1 Wednesday (day 2 of module)
      return new Date(moduleStart.getTime() + (2 * 24 * 60 * 60 * 1000));
    } else if (evaluationNumber === 2) {
      // Week 1 Friday (day 4 of module)
      return new Date(moduleStart.getTime() + (4 * 24 * 60 * 60 * 1000));
    } else if (evaluationNumber === 3) {
      // Week 2 Wednesday (day 9 of module)
      return new Date(moduleStart.getTime() + (9 * 24 * 60 * 60 * 1000));
    } else {
      // Week 2 Friday (day 11 of module)
      return new Date(moduleStart.getTime() + (11 * 24 * 60 * 60 * 1000));
    }
  }

  // POST: Guardar múltiples links de evaluación
  app.post("/api/evaluation-links", async (req: Request, res: Response) => {
    try {
      const linksData = req.body;

      if (!Array.isArray(linksData)) {
        return res.status(400).json({ error: "Se esperaba un array de links" });
      }

      // Validar cada link y calcular fecha de liberación
      const validatedLinks = linksData.map((link) => {
        const result = insertEvaluationLinkSchema.safeParse(link);
        if (!result.success) {
          throw new Error(`Validación fallida: ${result.error.message}`);
        }
        
        // Calculate and add release date
        const releaseDate = calculateReleaseDate(link.moduleNumber, link.evaluationNumber);
        
        return {
          ...result.data,
          releaseDate
        };
      });

      // Eliminar links existentes para este curso/módulo
      const firstLink = validatedLinks[0];
      await db
        .delete(evaluationLinks)
        .where(
          and(
            eq(evaluationLinks.courseId, firstLink.courseId),
            eq(evaluationLinks.moduleNumber, firstLink.moduleNumber)
          )
        );

      // Insertar nuevos links
      const inserted = await db
        .insert(evaluationLinks)
        .values(validatedLinks)
        .returning();

      return res.status(201).json({
        message: "Links guardados exitosamente",
        data: inserted,
      });
    } catch (error: any) {
      console.error("Error saving evaluation links:", error);
      return res.status(500).json({ 
        error: "Error al guardar links",
        details: error.message 
      });
    }
  });

  // GET: Obtener todos los links de un curso (todos los módulos)
  app.get("/api/evaluation-links/:courseId", async (req: Request, res: Response) => {
    try {
      const courseId = req.params.courseId;

      if (!courseId) {
        return res.status(400).json({ error: "ID de curso inválido" });
      }

      const links = await db
        .select()
        .from(evaluationLinks)
        .where(eq(evaluationLinks.courseId, courseId as string));

      const visible = await visibleLinks(req, res, courseId as string, links);
      if (!visible) return;
      return res.json(visible);
    } catch (error: any) {
      console.error("Error fetching course evaluation links:", error);
      return res.status(500).json({ error: "Error al obtener links del curso" });
    }
  });

  // DELETE: Eliminar un link específico
  app.delete("/api/evaluation-links/:id", async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      await db
        .delete(evaluationLinks)
        .where(eq(evaluationLinks.id, id as string));

      return res.json({ message: "Link eliminado exitosamente" });
    } catch (error: any) {
      console.error("Error deleting evaluation link:", error);
      return res.status(500).json({ error: "Error al eliminar link" });
    }
  });

  // PUT: Actualizar un link específico
  app.put("/api/evaluation-links/:id", async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updateData = req.body;

      const validated = insertEvaluationLinkSchema.safeParse(updateData);
      if (!validated.success) {
        return res.status(400).json({ 
          error: "Datos inválidos",
          details: validated.error.message 
        });
      }

      const updated = await db
        .update(evaluationLinks)
        .set({
          ...validated.data,
          updatedAt: new Date(),
        })
        .where(eq(evaluationLinks.id, id as string))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Link no encontrado" });
      }

      return res.json({
        message: "Link actualizado exitosamente",
        data: updated[0],
      });
    } catch (error: any) {
      console.error("Error updating evaluation link:", error);
      return res.status(500).json({ error: "Error al actualizar link" });
    }
  });
}
