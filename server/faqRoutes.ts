import type { Express, Request, Response } from "express";
import { db } from "./db";
import { faqs, insertFaqSchema, type Faq, type InsertFaq } from "../shared/schema";
import { eq, desc } from "drizzle-orm";
import multer from "multer";
import mammoth from "mammoth";
import { z } from "zod";

// Configurar multer para manejar archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

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

  // POST: Importación masiva de FAQs desde archivo Word
  app.post("/api/admin/faqs/import", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se ha proporcionado ningún archivo" });
      }

      // Verificar que sea un archivo Word
      if (!req.file.originalname.match(/\.(docx)$/)) {
        return res.status(400).json({ error: "Solo se permiten archivos Word (.docx)" });
      }

      // Extraer texto del documento Word
      const result = await mammoth.convertToHtml({ buffer: req.file.buffer });
      const html = result.value;

      // Parsear HTML para extraer tablas
      const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

      const tables = html.match(tableRegex);
      
      if (!tables || tables.length === 0) {
        return res.status(400).json({ error: "No se encontraron tablas en el documento" });
      }

      const faqsToImport: InsertFaq[] = [];
      let sortOrder = 0;

      // Procesar la primera tabla
      const table = tables[0];
      const rows = table.match(rowRegex);

      if (!rows || rows.length < 2) {
        return res.status(400).json({ error: "La tabla debe tener al menos 2 filas (encabezado + datos)" });
      }

      // Saltar la primera fila (encabezado)
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].match(cellRegex);
        
        if (cells && cells.length >= 2) {
          // Limpiar HTML tags de las celdas
          const question = cells[0].replace(/<[^>]*>/g, '').trim();
          const answer = cells[1].replace(/<[^>]*>/g, '').trim();

          if (question && answer) {
            faqsToImport.push({
              question,
              answer,
              category: "General",
              sortOrder: sortOrder++,
              isActive: true,
            });
          }
        }
      }

      if (faqsToImport.length === 0) {
        return res.status(400).json({ error: "No se encontraron preguntas válidas en el documento" });
      }

      // Opción de reemplazar o agregar
      const replaceAll = req.body.replaceAll === "true" || req.body.replaceAll === true;

      if (replaceAll) {
        // Eliminar todas las FAQs existentes
        await db.delete(faqs);
      }

      // Insertar nuevas FAQs
      const inserted = await db
        .insert(faqs)
        .values(faqsToImport)
        .returning();

      return res.status(201).json({
        message: `${inserted.length} FAQs importadas exitosamente`,
        count: inserted.length,
        faqs: inserted,
      });
    } catch (error: any) {
      console.error("Error importing FAQs:", error);
      return res.status(500).json({ 
        error: "Error al importar FAQs",
        details: error.message 
      });
    }
  });
}
