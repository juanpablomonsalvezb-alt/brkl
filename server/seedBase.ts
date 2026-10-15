// Datos base de POST /api/admin/seed: niveles 7° Básico–4° Medio y adultos, asignaturas
// y una combinación nivel-asignatura por cada nivel × asignatura existentes.
// Idempotente: reutiliza applyBasica, que verifica existencia antes de insertar.
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import { levels, subjects } from "@shared/schema";
import { applyBasica, type BasicaPlan } from "./seedBasica";

const level = (id: string, name: string, programType: "menores" | "adultos", sortOrder: number) =>
  ({ id, name, programType, totalWeeks: 15, cadencePerOA: "2 sem/sesión", sortOrder });

// 15 sesiones, cada sesión planificada para 2 semanas.
export const BASE_LEVELS = [
  level("7b", "7° Básico", "menores", 1),
  level("8b", "8° Básico", "menores", 2),
  level("1m", "1° Medio", "menores", 3),
  level("2m", "2° Medio", "menores", 4),
  level("3m", "3° Medio", "menores", 5),
  level("4m", "4° Medio", "menores", 6),
  level("nb1", "NB1 (1-4)", "adultos", 7),
  level("nb2", "NB2 (5-6)", "adultos", 8),
  level("nb3", "NB3 (7-8)", "adultos", 9),
  level("nm1", "NM1 (1-2 Media)", "adultos", 10),
  level("nm2", "NM2 (3-4 Media)", "adultos", 11),
];

export const BASE_SUBJECTS = [
  { name: "Lengua y Literatura", slug: "lengua-y-literatura", description: "Comunicación, lectura y escritura" },
  { name: "Matemática", slug: "matematica", description: "Álgebra, geometría y estadística" },
  { name: "Ciencias Naturales", slug: "ciencias-naturales", description: "Física, química y biología" },
  { name: "Historia", slug: "historia", description: "Historia, geografía y ciencias sociales" },
  { name: "Inglés", slug: "ingles", description: "Idioma inglés" },
  { name: "Educación Ciudadana", slug: "educacion-ciudadana", description: "Formación ciudadana" },
  { name: "Filosofía", slug: "filosofia", description: "Pensamiento crítico y ética" },
];

export async function seedBase(db: LibSQLDatabase<typeof schema>) {
  const first = await applyBasica(db, { levels: BASE_LEVELS, subjects: BASE_SUBJECTS, levelSubjects: [] }, true);

  // Igual que antes: combina todos los niveles con todas las asignaturas presentes en la base.
  const allLevels = await db.select({ id: levels.id }).from(levels);
  const allSubjects = await db.select({ slug: subjects.slug }).from(subjects);
  const combos: BasicaPlan["levelSubjects"] = allLevels.flatMap((l) =>
    allSubjects.map((s) => ({ levelId: l.id, subjectSlug: s.slug, totalOAs: 15 })));
  const second = await applyBasica(db, { levels: [], subjects: [], levelSubjects: combos }, true);

  return { levelsAdded: first.levelsAdded, subjectsAdded: first.subjectsAdded, levelSubjectsAdded: second.levelSubjectsAdded };
}
