// Migración de evaluaciones con htmlContent (Gemini) a questionsJson, corregible en el servidor.
// Solo escribe si write=true, solo filas sin questionsJson y solo si TODAS sus preguntas se convirtieron.
// Nunca toca htmlContent: el original se conserva.
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import { moduleEvaluations } from "@shared/schema";
import { htmlToQuestions, type FailedQuestion, type HtmlFormat } from "@shared/evaluationHtml";

export type ConversionStatus = "convertible" | "parcial" | "sin-preguntas" | "ya-tiene-preguntas";

export interface ConversionItem {
  id: string;
  title: string;
  status: ConversionStatus;
  format: HtmlFormat;
  converted: number;
  failed: FailedQuestion[];
  written: boolean;
}

export async function convertHtmlEvaluations(db: LibSQLDatabase<typeof schema>, write: boolean): Promise<ConversionItem[]> {
  const rows = await db
    .select({ id: moduleEvaluations.id, title: moduleEvaluations.title, html: moduleEvaluations.htmlContent, questionsJson: moduleEvaluations.questionsJson })
    .from(moduleEvaluations)
    .where(isNotNull(moduleEvaluations.htmlContent));

  const items: ConversionItem[] = [];
  for (const row of rows) {
    if (!row.html?.trim()) continue;
    const r = htmlToQuestions(row.html);
    const status: ConversionStatus = row.questionsJson ? "ya-tiene-preguntas"
      : !r.questions.length ? "sin-preguntas"
      : r.failed.length ? "parcial"
      : "convertible";
    let written = false;
    if (write && status === "convertible") {
      // Condición questionsJson IS NULL: no pisa preguntas cargadas entre la lectura y la escritura.
      const res = await db.update(moduleEvaluations)
        .set({ questionsJson: JSON.stringify(r.questions), totalQuestions: r.questions.length })
        .where(and(eq(moduleEvaluations.id, row.id), isNull(moduleEvaluations.questionsJson)))
        .returning({ id: moduleEvaluations.id });
      written = res.length > 0;
    }
    items.push({ id: row.id, title: row.title, status, format: r.format, converted: r.questions.length, failed: r.failed, written });
  }
  return items;
}
