// Carga los módulos (15 por asignatura) de un curso escolar (1° básico a 4° medio) desde scripts/data/modulos/<curso>.json.
// Idempotente: crea nivel, asignaturas y level_subject solo si faltan; nunca borra ni sobrescribe
// contenido distinto. Usa SQL explícito con columnas del esquema inicial (migrations/0000), no drizzle,
// porque la base de vista previa puede no tener columnas nuevas (p. ej. level_subjects.delivery_mode).
import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";

export interface ModuloJson {
  modulo: number;
  oa: number[];
  titulo: string;
  contenido: string;
}

// Clave = nombre de asignatura tal como aparece en el JSON.
export type DatosModulos = Record<string, ModuloJson[]>;

export interface ResumenCarga {
  nivelCreado: boolean;
  asignaturasCreadas: number;
  levelSubjectsCreados: number;
  modulosInsertados: number;
  modulosActualizados: number;
  modulosSinCambios: number;
  omitidos: { asignatura: string; modulo: number; motivo: string }[];
}

export interface CursoEscolar {
  nivelId: string;
  archivo: string;
  nombre: string;
  sortOrder: number;
}

const CURSOS_ESCOLARES: Record<string, CursoEscolar> = {
  "1": { nivelId: "1b", archivo: "1_basico", nombre: "1° Básico", sortOrder: -6 },
  "2": { nivelId: "2b", archivo: "2_basico", nombre: "2° Básico", sortOrder: -5 },
  "3": { nivelId: "3b", archivo: "3_basico", nombre: "3° Básico", sortOrder: -4 },
  "4": { nivelId: "4b", archivo: "4_basico", nombre: "4° Básico", sortOrder: -3 },
  "5": { nivelId: "5b", archivo: "5_basico", nombre: "5° Básico", sortOrder: -2 },
  "6": { nivelId: "6b", archivo: "6_basico", nombre: "6° Básico", sortOrder: -1 },
  "1b": { nivelId: "1b", archivo: "1_basico", nombre: "1° Básico", sortOrder: -6 },
  "2b": { nivelId: "2b", archivo: "2_basico", nombre: "2° Básico", sortOrder: -5 },
  "3b": { nivelId: "3b", archivo: "3_basico", nombre: "3° Básico", sortOrder: -4 },
  "4b": { nivelId: "4b", archivo: "4_basico", nombre: "4° Básico", sortOrder: -3 },
  "5b": { nivelId: "5b", archivo: "5_basico", nombre: "5° Básico", sortOrder: -2 },
  "6b": { nivelId: "6b", archivo: "6_basico", nombre: "6° Básico", sortOrder: -1 },
  "7b": { nivelId: "7b", archivo: "7_basico", nombre: "7° Básico", sortOrder: 1 },
  "8b": { nivelId: "8b", archivo: "8_basico", nombre: "8° Básico", sortOrder: 2 },
  "1m": { nivelId: "1m", archivo: "1_medio", nombre: "1° Medio", sortOrder: 3 },
  "2m": { nivelId: "2m", archivo: "2_medio", nombre: "2° Medio", sortOrder: 4 },
  "3m": { nivelId: "3m", archivo: "3_medio", nombre: "3° Medio", sortOrder: 5 },
  "4m": { nivelId: "4m", archivo: "4_medio", nombre: "4° Medio", sortOrder: 6 },
  "1_basico": { nivelId: "1b", archivo: "1_basico", nombre: "1° Básico", sortOrder: -6 },
  "2_basico": { nivelId: "2b", archivo: "2_basico", nombre: "2° Básico", sortOrder: -5 },
  "3_basico": { nivelId: "3b", archivo: "3_basico", nombre: "3° Básico", sortOrder: -4 },
  "4_basico": { nivelId: "4b", archivo: "4_basico", nombre: "4° Básico", sortOrder: -3 },
  "5_basico": { nivelId: "5b", archivo: "5_basico", nombre: "5° Básico", sortOrder: -2 },
  "6_basico": { nivelId: "6b", archivo: "6_basico", nombre: "6° Básico", sortOrder: -1 },
  "7_basico": { nivelId: "7b", archivo: "7_basico", nombre: "7° Básico", sortOrder: 1 },
  "8_basico": { nivelId: "8b", archivo: "8_basico", nombre: "8° Básico", sortOrder: 2 },
  "1_medio": { nivelId: "1m", archivo: "1_medio", nombre: "1° Medio", sortOrder: 3 },
  "2_medio": { nivelId: "2m", archivo: "2_medio", nombre: "2° Medio", sortOrder: 4 },
  "3_medio": { nivelId: "3m", archivo: "3_medio", nombre: "3° Medio", sortOrder: 5 },
  "4_medio": { nivelId: "4m", archivo: "4_medio", nombre: "4° Medio", sortOrder: 6 },
};

export function resolverCursoEscolar(grado: string): CursoEscolar | undefined {
  return CURSOS_ESCOLARES[grado.trim().toLowerCase()];
}

// Mismas asignaturas que server/seedBasica.ts y server/seedBase.ts (slug y nombre reutilizados para no duplicar).
const ASIGNATURAS: Record<string, { slug: string; name: string; description: string }> = {
  "Lenguaje y Comunicación": { slug: "lenguaje-y-comunicacion", name: "Lenguaje y Comunicación", description: "Lectura, escritura y comunicación oral" },
  "Lengua y Literatura": { slug: "lengua-y-literatura", name: "Lengua y Literatura", description: "Comunicación, lectura y escritura" },
  "Matemática": { slug: "matematica", name: "Matemática", description: "Álgebra, geometría y estadística" },
  "Ciencias Naturales": { slug: "ciencias-naturales", name: "Ciencias Naturales", description: "Física, química y biología" },
  "Ciencia para la Ciudadanía": { slug: "ciencias-naturales", name: "Ciencias Naturales", description: "Física, química y biología" },
  "Ciencias para la ciudadanía": { slug: "ciencias-naturales", name: "Ciencias Naturales", description: "Física, química y biología" },
  "Historia, Geografía y Ciencias Sociales": { slug: "historia", name: "Historia", description: "Historia, geografía y ciencias sociales" },
  "Idioma Extranjero: Inglés": { slug: "ingles", name: "Inglés", description: "Idioma inglés" },
  "Inglés": { slug: "ingles", name: "Inglés", description: "Idioma inglés" },
  "Educación Ciudadana": { slug: "educacion-ciudadana", name: "Educación Ciudadana", description: "Formación ciudadana" },
  "Filosofía": { slug: "filosofia", name: "Filosofía", description: "Pensamiento crítico y ética" },
};

// Título genérico que deja el sistema por defecto: "Módulo 3".
const esTituloGenerico = (titulo: string, modulo: number): boolean =>
  new RegExp(`^m[óo]dulo\\s*${modulo}$`, "i").test(titulo.trim());

export async function cargarModulos(
  client: Client,
  grado: string,
  datos: DatosModulos,
  { escribir }: { escribir: boolean },
): Promise<ResumenCarga> {
  const curso = resolverCursoEscolar(grado);
  if (!curso) throw new Error(`Grado inválido: ${grado} (se admite 1b..8b, 1m..4m, 1..6 o 1_basico..4_medio)`);
  const nivelId = curso.nivelId;
  const resumen: ResumenCarga = {
    nivelCreado: false, asignaturasCreadas: 0, levelSubjectsCreados: 0,
    modulosInsertados: 0, modulosActualizados: 0, modulosSinCambios: 0, omitidos: [],
  };

  const nivel = await client.execute({ sql: "SELECT id FROM levels WHERE id = ?", args: [nivelId] });
  if (!nivel.rows.length) {
    resumen.nivelCreado = true;
    if (escribir) {
      await client.execute({
        sql: "INSERT INTO levels (id, name, program_type, total_weeks, cadence_per_oa, sort_order) VALUES (?, ?, 'menores', 15, '2 sem/sesión', ?)",
        args: [nivelId, curso.nombre, curso.sortOrder],
      });
    }
  }

  for (const [nombreAsignatura, modulos] of Object.entries(datos)) {
    const asig = ASIGNATURAS[nombreAsignatura];
    if (!asig) throw new Error(`Asignatura sin mapeo: ${nombreAsignatura}`);

    let subjectId = (await client.execute({ sql: "SELECT id FROM subjects WHERE slug = ?", args: [asig.slug] })).rows[0]?.id as string | undefined;
    if (!subjectId) {
      resumen.asignaturasCreadas++;
      if (escribir) {
        subjectId = randomUUID();
        await client.execute({
          sql: "INSERT INTO subjects (id, name, slug, description) VALUES (?, ?, ?, ?)",
          args: [subjectId, asig.name, asig.slug, asig.description],
        });
      }
    }

    let lsId = subjectId
      ? (await client.execute({
          sql: "SELECT id FROM level_subjects WHERE level_id = ? AND subject_id = ?",
          args: [nivelId, subjectId],
        })).rows[0]?.id as string | undefined
      : undefined;
    if (!lsId) {
      resumen.levelSubjectsCreados++;
      if (escribir && subjectId) {
        lsId = randomUUID();
        const totalOAs = new Set(modulos.flatMap((m) => m.oa)).size;
        await client.execute({
          sql: "INSERT INTO level_subjects (id, level_id, subject_id, total_oas) VALUES (?, ?, ?, ?)",
          args: [lsId, nivelId, subjectId, totalOAs],
        });
      }
    }

    for (const m of modulos) {
      const oas = m.oa.map((n) => `OA ${n}`).join(", ");
      const fila = lsId
        ? (await client.execute({
            sql: "SELECT id, title, module_contents FROM learning_objectives WHERE level_subject_id = ? AND week_number = ? ORDER BY sort_order, id LIMIT 1",
            args: [lsId, m.modulo],
          })).rows[0]
        : undefined;

      if (!fila) {
        resumen.modulosInsertados++;
        if (escribir && lsId) {
          await client.execute({
            sql: "INSERT INTO learning_objectives (id, level_subject_id, code, title, week_number, sort_order, module_oas, module_contents) VALUES (?, ?, ?, ?, ?, 0, ?, ?)",
            args: [randomUUID(), lsId, `M${m.modulo}`, m.titulo, m.modulo, oas, m.contenido],
          });
        }
        continue;
      }

      const actual = String(fila.module_contents ?? "").trim();
      if (actual === m.contenido.trim()) {
        resumen.modulosSinCambios++;
        continue;
      }
      if (actual === "" && esTituloGenerico(String(fila.title), m.modulo)) {
        resumen.modulosActualizados++;
        if (escribir) {
          await client.execute({
            sql: "UPDATE learning_objectives SET title = ?, module_contents = ?, module_oas = ? WHERE id = ?",
            args: [m.titulo, m.contenido, oas, String(fila.id)],
          });
        }
        continue;
      }
      resumen.omitidos.push({
        asignatura: nombreAsignatura,
        modulo: m.modulo,
        motivo: actual ? "ya tiene contenido distinto (manual)" : "título propio sin contenido",
      });
    }
  }

  return resumen;
}
