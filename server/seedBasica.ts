// Estructura de 1° a 6° Básico (niveles, asignaturas y combinaciones nivel-asignatura)
// a partir del temario oficial MINEDUC en scripts/data/mineduc-temarios-manifest.json.
// Idempotente: solo agrega lo que falta; nunca modifica ni borra filas existentes.
// No crea objetivos ni módulos: esos se cargan con el flujo de administración existente.
import { and, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import { levels, subjects, levelSubjects } from "@shared/schema";

type Manifest = {
  grades: Record<string, { grade_label: string; subjects: Record<string, { objetivos_aprendizaje: unknown }> }>;
};

// Clave del temario → asignatura de la plataforma. Matemática, Ciencias e Historia reutilizan
// las existentes; claves fuera de esta lista (p. ej. "fisica" en 2° Básico, un artefacto
// del extractor del temario) se ignoran.
const SUBJECTS: Record<string, { slug: string; name: string; description: string }> = {
  lenguaje_y_comunicacion: { slug: "lenguaje-y-comunicacion", name: "Lenguaje y Comunicación", description: "Lectura, escritura y comunicación oral" },
  matematica: { slug: "matematica", name: "Matemática", description: "Álgebra, geometría y estadística" },
  ciencias_naturales: { slug: "ciencias-naturales", name: "Ciencias Naturales", description: "Física, química y biología" },
  historia_geografia_y_ciencias_sociales: { slug: "historia", name: "Historia", description: "Historia, geografía y ciencias sociales" },
};

const GRADES = ["1", "2", "3", "4", "5", "6"] as const;

// El temario guarda la lista de OA como texto con formato de lista de Python.
function countObjectives(raw: unknown): number {
  if (Array.isArray(raw)) return raw.length;
  return typeof raw === "string" ? (raw.match(/'oa_number'/g) ?? []).length : 0;
}

export interface BasicaPlan {
  levels: (typeof levels.$inferInsert)[];
  subjects: (typeof subjects.$inferInsert)[];
  levelSubjects: { levelId: string; subjectSlug: string; totalOAs: number }[];
}

export function planBasica(manifest: Manifest): BasicaPlan {
  const plan: BasicaPlan = { levels: [], subjects: [], levelSubjects: [] };
  const seenSubjects = new Set<string>();
  for (const g of GRADES) {
    const grade = manifest.grades[`${g}_basico`];
    if (!grade) throw new Error(`Falta ${g}_basico en el temario`);
    // sortOrder negativo: quedan antes de 7° Básico (sortOrder 1) sin renumerar niveles existentes.
    plan.levels.push({ id: `${g}b`, name: `${g}° Básico`, programType: "menores", totalWeeks: 15, cadencePerOA: "2 sem/sesión", sortOrder: Number(g) - 7 });
    for (const [key, data] of Object.entries(grade.subjects)) {
      const subject = SUBJECTS[key];
      if (!subject) continue;
      if (!seenSubjects.has(subject.slug)) {
        seenSubjects.add(subject.slug);
        plan.subjects.push(subject);
      }
      plan.levelSubjects.push({ levelId: `${g}b`, subjectSlug: subject.slug, totalOAs: countObjectives(data.objetivos_aprendizaje) });
    }
  }
  return plan;
}

export interface ApplyResult {
  levelsAdded: string[];
  subjectsAdded: string[];
  levelSubjectsAdded: string[];
}

export async function applyBasica(db: LibSQLDatabase<typeof schema>, plan: BasicaPlan, write: boolean): Promise<ApplyResult> {
  const result: ApplyResult = { levelsAdded: [], subjectsAdded: [], levelSubjectsAdded: [] };

  const existingLevels = new Set((await db.select({ id: levels.id }).from(levels)).map((l) => l.id));
  for (const level of plan.levels) {
    if (existingLevels.has(level.id)) continue;
    if (write) await db.insert(levels).values(level);
    result.levelsAdded.push(level.id);
  }

  const subjectIdBySlug = new Map((await db.select({ id: subjects.id, slug: subjects.slug }).from(subjects)).map((s) => [s.slug, s.id]));
  for (const subject of plan.subjects) {
    if (subjectIdBySlug.has(subject.slug)) continue;
    if (write) {
      const [created] = await db.insert(subjects).values(subject).returning({ id: subjects.id });
      subjectIdBySlug.set(subject.slug, created.id);
    }
    result.subjectsAdded.push(subject.slug);
  }

  for (const ls of plan.levelSubjects) {
    const subjectId = subjectIdBySlug.get(ls.subjectSlug);
    // level_subjects no tiene índice único: se verifica antes de insertar para no duplicar.
    const exists = subjectId
      ? (await db.select({ id: levelSubjects.id }).from(levelSubjects)
          .where(and(eq(levelSubjects.levelId, ls.levelId), eq(levelSubjects.subjectId, subjectId)))).length > 0
      : false;
    if (exists) continue;
    if (write && subjectId) await db.insert(levelSubjects).values({ levelId: ls.levelId, subjectId, totalOAs: ls.totalOAs });
    result.levelSubjectsAdded.push(`${ls.levelId}:${ls.subjectSlug}`);
  }

  return result;
}
