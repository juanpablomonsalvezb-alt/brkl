// Siembra una evaluación E2 de demostración con las 45 preguntas del piloto (Mat 5.º, Unidad 3):
// 15 en la prueba normal (3 por OA) y 30 de banco para el extra. Datos de prueba, nunca reales.
// Lo usan script/evaluacion-demo.ts (base desechable) y scripts/preparar-preview.ts (base de pruebas).
import fs from "node:fs"; import path from "node:path";
import type { InArgs, ResultSet } from "@libsql/client";

type X = (sql: string, args?: InArgs) => Promise<ResultSet>;
const AU = "ficticio-autor", VA = "ficticio-validador";
const CONT = path.resolve(import.meta.dirname, "../../docs/vortice/piloto/contenido");
const OAS = [7, 8, 10, 11, 13];

export interface OpcionesSiembra { levelSubjectId: string; evaluacionId: string; versionId: string; dominioId?: string; oaCurricularId?: string }

/** Devuelve la clave (pregunta → opción correcta), solo útil para la demo local. */
export async function sembrarEvaluacionPiloto(x: X, o: OpcionesSiembra): Promise<Record<string, string>> {
  const dom = o.dominioId ?? "d-piloto", oaC = o.oaCurricularId ?? "oa-piloto";
  await x("INSERT OR IGNORE INTO users (id, email) VALUES (?, ?), (?, ?)", [AU, "autor@ficticio.test", VA, "validador@ficticio.test"]);
  if (!(await x("SELECT 1 FROM curriculum_objectives WHERE id = ?", [oaC])).rows.length)
    await x("INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year) VALUES (?, ?, 'M1', 'Objetivo de demostración', 'https://e.test', 2018)", [oaC, o.levelSubjectId]);
  await x("INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES (?, ?, ?)", [dom, o.levelSubjectId, dom]);
  await x("INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES (?, ?, 1, 'borrador', ?)", [dom + "-v1", dom, AU]);
  for (const oa of OAS) {
    const it = `${dom}-oa${oa}`;
    await x("INSERT INTO knowledge_items (id, domain_id, code) VALUES (?, ?, ?)", [it, dom, "COD-" + it]);
    await x("INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES (?, ?, ?, ?, 'n', 'd')", [it + "-iv", it, dom + "-v1", dom]);
    await x("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES (?, ?)", [it + "-iv", oaC]);
  }
  await x("UPDATE knowledge_domain_versions SET status = 'en_revision' WHERE id = ?", [dom + "-v1"]);
  await x("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = ? WHERE id = ?", [VA, dom + "-v1"]);
  await x("INSERT INTO evaluation_versions (id, evaluation_id, version, status, created_by) VALUES (?, ?, 1, 'borrador', ?)", [o.versionId, o.evaluacionId, AU]);
  await x("UPDATE evaluation_versions SET status = 'validada', validated_by = ?, validated_at = 1 WHERE id = ?", [VA, o.versionId]);

  const clave: Record<string, string> = {}; let pos = 0;
  for (const oa of OAS) {
    const qs = JSON.parse(fs.readFileSync(path.join(CONT, `oa${oa}_preguntas.json`), "utf8")) as any[];
    for (const [k, q] of qs.entries()) {
      const id = q.id, it = `${dom}-oa${oa}`;
      await x("INSERT INTO question_families (id, item_id, bank) VALUES (?, ?, 'evaluacion')", ["f-" + id, it]);
      await x("INSERT INTO question_versions (id, family_id, item_id, bank, version, status, stem, options_json, correct_option_id, origin, authored_by) VALUES (?, ?, ?, 'evaluacion', 1, 'borrador', ?, ?, ?, 'humano', ?)",
        [id, "f-" + id, it, q.enunciado, JSON.stringify(q.alternativas), q.respuesta_correcta, AU]);
      await x("UPDATE question_versions SET status = 'en_revision' WHERE id = ?", [id]);
      await x("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = ?", [VA, id]);
      clave[id] = q.respuesta_correcta;
      if (k < 3) await x("INSERT INTO evaluation_version_questions (evaluation_version_id, question_version_id, family_id, item_id, bank, position) VALUES (?, ?, ?, ?, 'evaluacion', ?)", [o.versionId, id, "f-" + id, it, pos++]);
    }
  }
  return clave;
}
