import type { Express, Request, Response } from "express";
import { db } from "./db";
import { faqs, insertFaqSchema, type Faq, type InsertFaq } from "../shared/schema";
import { eq, desc } from "drizzle-orm";

export function registerFaqRoutes(app: Express) {
  // GET: Obtener todas las FAQ activas (para el público)
  app.get("/api/faqs", async (req: Request, res: Response) => {
    try {
      const allFaqs = await db
        .select()
        .from(faqs)
        .where(eq(faqs.isActive, true))
        .orderBy(faqs.sortOrder, faqs.createdAt);

      return res.json(allFaqs);
    } catch (error: any) {
      console.error("Error fetching FAQs:", error);
      return res.status(500).json({ error: "Error al obtener FAQs" });
    }
  });

  // GET: Obtener todas las FAQ (incluyendo inactivas, para admin)
  app.get("/api/admin/faqs", async (req: Request, res: Response) => {
    try {
      const allFaqs = await db
        .select()
        .from(faqs)
        .orderBy(faqs.sortOrder, faqs.createdAt);

      return res.json(allFaqs);
    } catch (error: any) {
      console.error("Error fetching all FAQs:", error);
      return res.status(500).json({ error: "Error al obtener FAQs" });
    }
  });

  // GET: Obtener una FAQ específica por ID
  app.get("/api/faqs/:id", async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const faq = await db
        .select()
        .from(faqs)
        .where(eq(faqs.id, id as string))
        .limit(1);

      if (faq.length === 0) {
        return res.status(404).json({ error: "FAQ no encontrada" });
      }

      return res.json(faq[0]);
    } catch (error: any) {
      console.error("Error fetching FAQ:", error);
      return res.status(500).json({ error: "Error al obtener FAQ" });
    }
  });

  // POST: Crear una nueva FAQ
  app.post("/api/admin/faqs", async (req: Request, res: Response) => {
    try {
      const validated = insertFaqSchema.safeParse(req.body);
      
      if (!validated.success) {
        return res.status(400).json({ 
          error: "Datos inválidos",
          details: validated.error.errors 
        });
      }

      const newFaq = await db
        .insert(faqs)
        .values(validated.data)
        .returning();

      return res.status(201).json(newFaq[0]);
    } catch (error: any) {
      console.error("Error creating FAQ:", error);
      return res.status(500).json({ error: "Error al crear FAQ" });
    }
  });

  // PUT: Actualizar una FAQ existente
  app.put("/api/admin/faqs/:id", async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updateData = req.body;

      const validated = insertFaqSchema.partial().safeParse(updateData);
      
      if (!validated.success) {
        return res.status(400).json({ 
          error: "Datos inválidos",
          details: validated.error.errors 
        });
      }

      const updated = await db
        .update(faqs)
        .set({
          ...validated.data,
          updatedAt: new Date(),
        })
        .where(eq(faqs.id, id as string))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "FAQ no encontrada" });
      }

      return res.json(updated[0]);
    } catch (error: any) {
      console.error("Error updating FAQ:", error);
      return res.status(500).json({ error: "Error al actualizar FAQ" });
    }
  });

  // DELETE: Eliminar una FAQ
  app.delete("/api/admin/faqs/:id", async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      await db
        .delete(faqs)
        .where(eq(faqs.id, id as string));

      return res.json({ message: "FAQ eliminada exitosamente" });
    } catch (error: any) {
      console.error("Error deleting FAQ:", error);
      return res.status(500).json({ error: "Error al eliminar FAQ" });
    }
  });

  // PATCH: Reordenar FAQs (actualizar sortOrder)
  app.patch("/api/admin/faqs/reorder", async (req: Request, res: Response) => {
    try {
      const { items } = req.body as { items: { id: string; sortOrder: number }[] };

      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Se requiere un array de items" });
      }

      // Update each item's sortOrder
      await Promise.all(
        items.map((item) =>
          db
            .update(faqs)
            .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
            .where(eq(faqs.id, item.id))
        )
      );

      return res.json({ message: "Orden actualizado exitosamente" });
    } catch (error: any) {
      console.error("Error reordering FAQs:", error);
      return res.status(500).json({ error: "Error al reordenar FAQs" });
    }
  });
}
