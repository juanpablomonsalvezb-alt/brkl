// Verificación de rol y matrícula activa para Aula Universal y Mapa de Conocimiento (M-R01 / H-02).
import { and, eq, inArray, or } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Client } from "@libsql/client";
import * as schema from "@shared/schema";
import { enrollments, levelSubjects, subjects, userProfiles } from "@shared/schema";
import { hasActiveEnrollment } from "./vortice";
import { esEntornoEstrictoEsquema } from "./saludEsquema";

type Db = LibSQLDatabase<typeof schema>;

export type AccesoEstudianteRes =
  | { ok: true }
  | { ok: false; status: 403; reason: string };

const IDS_PILOTO_MAT5 = ["ls-mat-5b", "5b-matematica"] as const;

async function tieneMatriculaPilotoMat5(db: Db, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .innerJoin(levelSubjects, eq(enrollments.levelSubjectId, levelSubjects.id))
    .innerJoin(subjects, eq(levelSubjects.subjectId, subjects.id))
    .where(
      and(
        eq(enrollments.userId, userId),
        eq(enrollments.isActive, true),
        or(
          inArray(levelSubjects.id, [...IDS_PILOTO_MAT5]),
          and(eq(levelSubjects.levelId, "5b"), eq(subjects.slug, "matematica")),
        ),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/**
 * Exige rol `student` en `user_profiles` y matrícula activa en la asignatura asociada al dominio
 * (o en Matemática 5.º Básico para el Aula Universal del piloto y dominios aún no sembrados).
 */
export async function verificarAccesoEstudiantePiloto(
  db: Db,
  client: Client,
  userId: string,
  dominioId?: string,
): Promise<AccesoEstudianteRes> {
  const [perfil] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (!perfil || perfil.role !== "student") {
    return {
      ok: false,
      status: 403,
      reason: "Acceso exclusivo para estudiantes con matrícula activa",
    };
  }

  if (dominioId) {
    try {
      const domRes = await client.execute({
        sql: "SELECT level_subject_id FROM knowledge_domains WHERE id = ? LIMIT 1",
        args: [dominioId],
      });
      const lsId = domRes.rows[0]?.level_subject_id;
      if (lsId) {
        const matriculado = await hasActiveEnrollment(db, userId, String(lsId));
        if (!matriculado) {
          return { ok: false, status: 403, reason: "No tienes matrícula activa en esta asignatura" };
        }
        return { ok: true };
      }
    } catch (error) {
      if (esEntornoEstrictoEsquema() || !/no such table/i.test((error as Error)?.message ?? "")) {
        throw error;
      }
    }
  }

  if (!(await tieneMatriculaPilotoMat5(db, userId))) {
    return { ok: false, status: 403, reason: "No tienes matrícula activa en esta asignatura" };
  }

  return { ok: true };
}
