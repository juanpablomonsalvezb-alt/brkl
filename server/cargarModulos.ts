// Carga los módulos (15 por asignatura) de un grado básico desde scripts/data/modulos/<grado>_basico.json.
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

// Mismas asignaturas que server/seedBasica.ts (slug y nombre reutilizados para no duplicar).
const ASIGNATURAS: Record<string, { slug: string; name: string; description: string }> = {
  "Lenguaje y Comunicación": { slug: "lenguaje-y-comunicacion", name: "Lenguaje y Comunicación", description: "Lectura, escritura y comunicación oral" },
  "Matemática": { slug: "matematica", name: "Matemática", description: "Álgebra, geometría y estadística" },
  "Ciencias Naturales": { slug: "ciencias-naturales", name: "Ciencias Naturales", description: "Física, química y biología" },
  "Historia, Geografía y Ciencias Sociales": { slug: "historia", name: "Historia", description: "Historia, geografía y ciencias sociales" },
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
  if (!/^[1-6]$/.test(grado)) throw new Error(`Grado inválido: ${grado} (se admite 1 a 6 básico)`);
  const nivelId = `${grado}b`;
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
        args: [nivelId, `${grado}° Básico`, Number(grado) - 7],
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
