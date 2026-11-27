// Siembra idempotente y unificada del dominio piloto Matemática 5.º U3 (M-R03):
// comparte un único `knowledge_domain` publicado (`d-piloto-mat5-u3`) y los mismos 5 `knowledge_items`
// entre el banco de práctica (`bank = 'practica'`) y el banco de evaluación E2 (`bank = 'evaluacion'`).
// Nunca lee del reloj del sistema ni usa INSERT OR IGNORE sobre tablas protegidas por triggers.
import fs from "node:fs";
import path from "node:path";
import type { Client, InArgs, ResultSet } from "@libsql/client";
import { obtenerLeccionesPilotoPrivadas } from "./aulaUniversalCatalogo";
import { BANCO_PRACTICA_INDEPENDIENTE_PILOTO } from "./bancoPracticaPiloto";
import { PRERREQUISITOS_PILOTO_MAT5_U3 } from "../shared/mapaConocimiento";
import { K6_FAMILIAS, type PoliticaEjecutable } from "../shared/politica";
import { relojMotor } from "./reloj";

export const DOMINIO_PILOTO_PRACTICA_ID = "d-piloto-mat5-u3";

// D1 (M-R04): dominio K6 exige evidencia correcta en días calendario diferentes (`k6_separation: "dia"`).
export const POLITICA_PILOTO_DEMO: PoliticaEjecutable = {
  k6_min_families: K6_FAMILIAS,
  k6_separation: "dia",
  assisted_counts: false,
  wrong_with_help_counts: false,
  error_repaired_counts: false,
  retired_counts: true,
  demote_wrong_families: 2,
  not_mastered_wrong_families: 2,
};

const AUTOR = "ficticio-autor";
const VALIDADOR = "ficticio-validador";
const OAS_PILOTO = [7, 8, 10, 11, 13] as const;
// Evita import.meta.dirname sin guarda porque el bundle CJS de Vercel (api/handler.js) deja import.meta vacío.
const BASE_PILOTO_DIR = typeof import.meta?.dirname === "string"
  ? path.resolve(import.meta.dirname, "..")
  : process.cwd();
const DIR_CONTENIDO_PILOTO = path.resolve(BASE_PILOTO_DIR, "docs/vortice/piloto/contenido");

export type EjecutorSql = (sql: string, args?: InArgs) => Promise<ResultSet>;

function codigoItemPiloto(oaId: string): string {
  const num = oaId.replace(/^oa/i, "").padStart(2, "0");
  return `MAT5U3-OA${num}`;
}

export async function resolverLevelSubjectMat5X(x: EjecutorSql): Promise<string> {
  const r = await x(
    `SELECT ls.id
     FROM level_subjects ls
     LEFT JOIN subjects s ON s.id = ls.subject_id
     WHERE ls.id IN ('5b-matematica', 'ls-mat-5b')
        OR (ls.level_id = '5b' AND s.slug = 'matematica')
     ORDER BY CASE
       WHEN ls.id = '5b-matematica' THEN 0
       WHEN ls.id = 'ls-mat-5b' THEN 1
       ELSE 2
     END
     LIMIT 1`,
  );
  if (!r.rows.length) {
    throw new Error("No existe asignatura de Matemática 5.º Básico en level_subjects");
  }
  return String(r.rows[0].id);
}

async function ahoraSql(x: EjecutorSql): Promise<number> {
  const r = await x("SELECT unixepoch('subsec')");
  return Number(r.rows[0][0]);
}

async function asegurarActoresX(x: EjecutorSql): Promise<void> {
  for (const [uid, email] of [
    [AUTOR, "autor@ficticio.test"],
    [VALIDADOR, "validador@ficticio.test"],
  ] as const) {
    const existe = (await x("SELECT 1 FROM users WHERE id = ? LIMIT 1", [uid])).rows.length > 0;
    if (!existe) {
      await x("INSERT INTO users (id, email) VALUES (?, ?)", [uid, email]);
    }
  }
}

export async function sembrarDominioYPracticaX(
  x: EjecutorSql,
  opts: {
    levelSubjectId?: string;
    dominioId?: string;
    oaCurricularId?: string;
    aprobarPolitica?: boolean;
    ahora?: number;
  } = {},
): Promise<{ domainId: string; yaPublicado: boolean; itemsPorOa: Record<string, string> }> {
  const levelSubjectId = opts.levelSubjectId ?? (await resolverLevelSubjectMat5X(x));
  const dominioId = opts.dominioId ?? DOMINIO_PILOTO_PRACTICA_ID;
  const oaCurricularPref = opts.oaCurricularId ?? "oa-piloto-mat5-u3";
  const ahora = opts.ahora ?? (await ahoraSql(x));

  await asegurarActoresX(x);

  const pubRes = await x(
    "SELECT id FROM knowledge_domain_versions WHERE domain_id = ? AND status = 'publicada' LIMIT 1",
    [dominioId],
  );
  const lecciones = obtenerLeccionesPilotoPrivadas();
  const itemsPorOa: Record<string, string> = {};
  let yaPublicado = false;

  if (pubRes.rows.length > 0) {
    yaPublicado = true;
    const pubId = String(pubRes.rows[0].id);
    const itemsRes = await x(
      `SELECT v.item_id, i.code
       FROM knowledge_item_versions v
       JOIN knowledge_items i ON i.id = v.item_id
       WHERE v.domain_version_id = ?`,
      [pubId],
    );
    for (const r of itemsRes.rows) {
      const code = String(r.code);
      const m = /OA0?(\d+)$/i.exec(code);
      if (m) itemsPorOa[`oa${Number(m[1])}`] = String(r.item_id);
    }
  } else {
    const oaExistente = (
      await x(
        "SELECT id FROM curriculum_objectives WHERE id = ? OR (level_subject_id = ? AND official_code = 'MAT5-U3' AND source_year = 2026) LIMIT 1",
        [oaCurricularPref, levelSubjectId],
      )
    ).rows[0];
    const oaCurricularId = oaExistente ? String(oaExistente.id) : oaCurricularPref;
    if (!oaExistente) {
      await x(
        `INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year)
         VALUES (?, ?, 'MAT5-U3', 'Fracciones y decimales · Unidad 3 Matemática 5.º Básico', 'https://www.curriculumnacional.cl/', 2026)`,
        [oaCurricularId, levelSubjectId],
      );
    }

    const domExiste = (await x("SELECT id FROM knowledge_domains WHERE id = ? LIMIT 1", [dominioId])).rows.length > 0;
    if (!domExiste) {
      await x("INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES (?, ?, ?)", [
        dominioId,
        levelSubjectId,
        "Matemática 5.º · Fracciones y decimales",
      ]);
    }

    const verMaxRow = (
      await x("SELECT COALESCE(MAX(version), 0) AS v FROM knowledge_domain_versions WHERE domain_id = ?", [dominioId])
    ).rows[0];
    const nextVer = Number(verMaxRow?.v ?? 0) + 1;
    const dvId = `${dominioId}-v${nextVer}`;
    await x(
      "INSERT INTO knowledge_domain_versions (id, domain_id, version, status, created_by) VALUES (?, ?, ?, 'borrador', ?)",
      [dvId, dominioId, nextVer, AUTOR],
    );

    const itemVerPorOa = new Map<string, { itemId: string; itemVersionId: string }>();
    for (const l of lecciones) {
      const code = codigoItemPiloto(l.oaId);
      const itemExistente = (
        await x("SELECT id FROM knowledge_items WHERE domain_id = ? AND code = ? LIMIT 1", [dominioId, code])
      ).rows[0];
      const itemId = itemExistente ? String(itemExistente.id) : `${dominioId}-${l.oaId}`;
      if (!itemExistente) {
        await x("INSERT INTO knowledge_items (id, domain_id, code) VALUES (?, ?, ?)", [itemId, dominioId, code]);
      }
      const itemVersionId = `${itemId}-v${nextVer}`;
      await x(
        "INSERT INTO knowledge_item_versions (id, item_id, domain_version_id, domain_id, name, operational_definition) VALUES (?, ?, ?, ?, ?, ?)",
        [itemVersionId, itemId, dvId, dominioId, l.titulo, l.objetivo],
      );
      await x("INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES (?, ?)", [
        itemVersionId,
        oaCurricularId,
      ]);
      itemVerPorOa.set(l.oaId, { itemId, itemVersionId });
      itemsPorOa[l.oaId] = itemId;
    }

    for (const arista of PRERREQUISITOS_PILOTO_MAT5_U3) {
      const dest = itemVerPorOa.get(arista.oaId);
      const orig = itemVerPorOa.get(arista.prereqOaId);
      if (!dest || !orig) continue;
      const pid = `${dvId}-pre-${arista.oaId}-${arista.prereqOaId}`;
      await x(
        `INSERT INTO knowledge_prerequisites
           (id, domain_version_id, item_id, prerequisite_item_id, relation, alt_group, justification, confidence, validated_by, validated_at)
         VALUES (?, ?, ?, ?, ?, NULL, ?, 'curricular_mineduc', NULL, NULL)`,
        [pid, dvId, dest.itemId, orig.itemId, arista.relation, arista.justification],
      );
      await x("UPDATE knowledge_prerequisites SET validated_by = ?, validated_at = ? WHERE id = ?", [
        VALIDADOR,
        ahora,
        pid,
      ]);
    }

    await x("UPDATE knowledge_domain_versions SET status = 'en_revision' WHERE id = ?", [dvId]);
    await x("UPDATE knowledge_domain_versions SET status = 'validada', validated_by = ? WHERE id = ?", [VALIDADOR, dvId]);
    await x("UPDATE knowledge_domain_versions SET status = 'publicada', published_at = ? WHERE id = ?", [ahora, dvId]);
  }

  // Asegurar idempotentemente las 25 preguntas de `bank = 'practica'` ligadas a los 5 `item_id` del dominio.
  for (const l of lecciones) {
    const itemId = itemsPorOa[l.oaId];
    if (!itemId) continue;
    const ejercicios = [...l.ejerciciosPractica, ...l.ejerciciosComprobacion];
    for (const ej of ejercicios) {
      const famId = `fam-prac-${ej.id}`;
      const qvId = `qv-prac-${ej.id}`;
      if (!(await x("SELECT 1 FROM question_families WHERE id = ? LIMIT 1", [famId])).rows.length) {
        await x("INSERT INTO question_families (id, item_id, bank, label) VALUES (?, ?, 'practica', ?)", [
          famId,
          itemId,
          `${l.codigo} · ${ej.id}`,
        ]);
      }
      if (!(await x("SELECT 1 FROM question_versions WHERE id = ? LIMIT 1", [qvId])).rows.length) {
        await x(
          `INSERT INTO question_versions
             (id, family_id, item_id, bank, version, status, stem, options_json, correct_option_id, explanation, origin, authored_by)
           VALUES (?, ?, ?, 'practica', 1, 'borrador', ?, ?, ?, ?, 'humano', ?)`,
          [qvId, famId, itemId, ej.enunciado, JSON.stringify(ej.alternativas), ej.respuestaCorrecta, ej.explicacionCorrecta, AUTOR],
        );
        await x("UPDATE question_versions SET status = 'en_revision' WHERE id = ?", [qvId]);
        await x("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = ? WHERE id = ?", [
          VALIDADOR,
          ahora,
          qvId,
        ]);
      }
    }
  }

  // Asegurar idempotentemente las 30 preguntas del banco independiente de práctica (M-R04: 3 familias × 2 variantes por OA).
  for (const q of BANCO_PRACTICA_INDEPENDIENTE_PILOTO) {
    const itemId = itemsPorOa[q.oaId];
    if (!itemId) continue;
    const famId = `fam-ind-${q.familyKey}`;
    const qvId = `qv-prac-${q.id}`;
    if (!(await x("SELECT 1 FROM question_families WHERE id = ? LIMIT 1", [famId])).rows.length) {
      await x("INSERT INTO question_families (id, item_id, bank, label) VALUES (?, ?, 'practica', ?)", [
        famId,
        itemId,
        q.fuenteOficial,
      ]);
    }
    if (!(await x("SELECT 1 FROM question_versions WHERE id = ? LIMIT 1", [qvId])).rows.length) {
      await x(
        `INSERT INTO question_versions
           (id, family_id, item_id, bank, version, status, stem, options_json, correct_option_id, explanation, origin, authored_by)
         VALUES (?, ?, ?, 'practica', ?, 'borrador', ?, ?, ?, ?, 'humano', ?)`,
        [qvId, famId, itemId, q.variante, q.enunciado, JSON.stringify(q.alternativas), q.respuestaCorrecta, q.explicacionCorrecta, AUTOR],
      );
      await x("UPDATE question_versions SET status = 'en_revision' WHERE id = ?", [qvId]);
      await x("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = ? WHERE id = ?", [
        VALIDADOR,
        ahora,
        qvId,
      ]);
    }
  }

  if (opts.aprobarPolitica !== false) {
    const vigente = (
      await x("SELECT id, rules_json FROM mastery_policies WHERE status = 'aprobada' ORDER BY version DESC LIMIT 1")
    ).rows[0];
    let necesitaPoliticaDiaria = !vigente;
    if (vigente) {
      try {
        const reglas = JSON.parse(String(vigente.rules_json));
        if (reglas?.k6_separation !== "dia") necesitaPoliticaDiaria = true;
      } catch {
        necesitaPoliticaDiaria = true;
      }
    }
    if (necesitaPoliticaDiaria) {
      const maxVer = Number((await x("SELECT COALESCE(MAX(version), 0) AS v FROM mastery_policies")).rows[0]?.v ?? 0);
      const polId = `pol-piloto-${maxVer + 1}`;
      await x("INSERT INTO mastery_policies (id, version, rules_json, status) VALUES (?, ?, ?, 'borrador')", [
        polId,
        maxVer + 1,
        JSON.stringify(POLITICA_PILOTO_DEMO),
      ]);
      await x("UPDATE mastery_policies SET status = 'aprobada', approved_by = ?, approved_at = ? WHERE id = ?", [
        VALIDADOR,
        ahora,
        polId,
      ]);
    }
  }

  return { domainId: dominioId, yaPublicado, itemsPorOa };
}

export async function sembrarPilotoPractica(
  c: Client,
  opts: {
    levelSubjectId?: string;
    dominioId?: string;
    oaCurricularId?: string;
    aprobarPolitica?: boolean;
  } = {},
): Promise<{ domainId: string; yaPublicado: boolean; itemsPorOa: Record<string, string> }> {
  const ahora = await relojMotor(c).ahora();
  const x: EjecutorSql = (sql, args = []) => c.execute({ sql, args });
  return sembrarDominioYPracticaX(x, { ...opts, ahora });
}

export interface OpcionesSiembraEvaluacionUnificada {
  levelSubjectId?: string;
  evaluacionId: string;
  versionId: string;
  dominioId?: string;
  oaCurricularId?: string;
}

/**
 * Siembra las 45 preguntas de evaluación E2 (`bank = 'evaluacion'`) y la versión de evaluación
 * sobre el MISMO dominio publicado y los MISMOS 5 `knowledge_items` de práctica (`d-piloto-mat5-u3`).
 * Devuelve la clave (pregunta -> opción correcta), solo para tests/demo local.
 */
export async function sembrarEvaluacionPilotoUnificadaX(
  x: EjecutorSql,
  o: OpcionesSiembraEvaluacionUnificada,
): Promise<Record<string, string>> {
  const dom = o.dominioId ?? DOMINIO_PILOTO_PRACTICA_ID;
  const { itemsPorOa } = await sembrarDominioYPracticaX(x, {
    levelSubjectId: o.levelSubjectId,
    dominioId: dom,
    oaCurricularId: o.oaCurricularId,
    aprobarPolitica: false,
  });

  const evExiste = (await x("SELECT 1 FROM evaluation_versions WHERE id = ? LIMIT 1", [o.versionId])).rows.length > 0;
  if (!evExiste) {
    const maxVer = Number(
      (await x("SELECT COALESCE(MAX(version), 0) AS v FROM evaluation_versions WHERE evaluation_id = ?", [o.evaluacionId]))
        .rows[0]?.v ?? 0,
    );
    await x(
      "INSERT INTO evaluation_versions (id, evaluation_id, version, status, created_by) VALUES (?, ?, ?, 'borrador', ?)",
      [o.versionId, o.evaluacionId, maxVer + 1, AUTOR],
    );
    await x("UPDATE evaluation_versions SET status = 'validada', validated_by = ?, validated_at = 1 WHERE id = ?", [
      VALIDADOR,
      o.versionId,
    ]);
  }

  const clave: Record<string, string> = {};
  let pos = 0;
  for (const oa of OAS_PILOTO) {
    const qs = JSON.parse(fs.readFileSync(path.join(DIR_CONTENIDO_PILOTO, `oa${oa}_preguntas.json`), "utf8")) as any[];
    const itemId = itemsPorOa[`oa${oa}`];
    if (!itemId) throw new Error(`No se encontró item_id para oa${oa} en dominio ${dom}`);
    for (const [k, q] of qs.entries()) {
      const id = String(q.id);
      const famId = `f-${id}`;
      if (!(await x("SELECT 1 FROM question_families WHERE id = ? LIMIT 1", [famId])).rows.length) {
        await x("INSERT INTO question_families (id, item_id, bank) VALUES (?, ?, 'evaluacion')", [famId, itemId]);
      }
      if (!(await x("SELECT 1 FROM question_versions WHERE id = ? LIMIT 1", [id])).rows.length) {
        await x(
          `INSERT INTO question_versions
             (id, family_id, item_id, bank, version, status, stem, options_json, correct_option_id, origin, authored_by)
           VALUES (?, ?, ?, 'evaluacion', 1, 'borrador', ?, ?, ?, 'humano', ?)`,
          [id, famId, itemId, q.enunciado, JSON.stringify(q.alternativas), q.respuesta_correcta, AUTOR],
        );
        await x("UPDATE question_versions SET status = 'en_revision' WHERE id = ?", [id]);
        await x("UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = 1 WHERE id = ?", [
          VALIDADOR,
          id,
        ]);
      }
      clave[id] = String(q.respuesta_correcta);
      if (k < 3) {
        const yaEnVer = (
          await x(
            "SELECT 1 FROM evaluation_version_questions WHERE evaluation_version_id = ? AND question_version_id = ? LIMIT 1",
            [o.versionId, id],
          )
        ).rows.length > 0;
        if (!yaEnVer) {
          await x(
            "INSERT INTO evaluation_version_questions (evaluation_version_id, question_version_id, family_id, item_id, bank, position) VALUES (?, ?, ?, ?, 'evaluacion', ?)",
            [o.versionId, id, famId, itemId, pos],
          );
        }
        pos += 1;
      }
    }
  }
  return clave;
}
