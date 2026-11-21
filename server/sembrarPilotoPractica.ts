// Siembra idempotente del dominio piloto Matemática 5.º U3 (catálogo, aristas de prerrequisitos,
// banco de práctica y política ejecutable) para operar el motor M2 y el mapa M3 en local/preview.
// Solo usa servicios de catálogo y SQL de catálogo/banco/políticas; nunca lee del reloj del sistema.
import type { Client } from "@libsql/client";
import { obtenerLeccionesPiloto } from "../shared/aulaUniversal";
import { PRERREQUISITOS_PILOTO_MAT5_U3 } from "../shared/mapaConocimiento";
import { K6_FAMILIAS, type PoliticaEjecutable } from "../shared/politica";
import { agregarContenido, agregarPrerrequisito, cambiarEstado, crearDominio, crearVersionDominio, validarArista, versionPublicada } from "./catalogo";
import { politicaVigente } from "./conocimiento";
import { relojMotor } from "./reloj";

export const DOMINIO_PILOTO_PRACTICA_ID = "d-piloto-mat5-u3";

export const POLITICA_PILOTO_DEMO: PoliticaEjecutable = {
  k6_min_families: K6_FAMILIAS,
  k6_separation: "ninguna",
  assisted_counts: false,
  wrong_with_help_counts: false,
  error_repaired_counts: false,
  retired_counts: true,
  demote_wrong_families: 2,
  not_mastered_wrong_families: 2,
};

const AUTOR = "ficticio-autor";
const VALIDADOR = "ficticio-validador";

function codigoItemPiloto(oaId: string): string {
  const num = oaId.replace(/^oa/i, "").padStart(2, "0");
  return `MAT5U3-OA${num}`;
}

export async function sembrarPilotoPractica(
  c: Client,
  opts: {
    levelSubjectId?: string;
    dominioId?: string;
    oaCurricularId?: string;
    aprobarPolitica?: boolean;
  } = {},
): Promise<{ domainId: string; yaPublicado: boolean }> {
  const levelSubjectId = opts.levelSubjectId ?? "ls-mat-5b";
  const dominioId = opts.dominioId ?? DOMINIO_PILOTO_PRACTICA_ID;
  const oaCurricularPref = opts.oaCurricularId ?? "oa-piloto-mat5-u3";
  const ahora = await relojMotor(c).ahora();

  // Asegurar autor y validador distintos sin usar INSERT OR IGNORE sobre tablas protegidas.
  for (const [uid, email] of [
    [AUTOR, "autor@ficticio.test"],
    [VALIDADOR, "validador@ficticio.test"],
  ] as const) {
    const existe = (await c.execute({ sql: "SELECT 1 FROM users WHERE id = ? LIMIT 1", args: [uid] })).rows.length > 0;
    if (!existe) {
      await c.execute({ sql: "INSERT INTO users (id, email) VALUES (?, ?)", args: [uid, email] });
    }
  }

  let yaPublicado = false;
  const pub = await versionPublicada(c, dominioId);
  if (pub) {
    yaPublicado = true;
  } else {
    // Resolver o crear el OA curricular oficial en esa asignatura de nivel.
    const oaExistente = (
      await c.execute({
        sql: "SELECT id FROM curriculum_objectives WHERE id = ? OR (level_subject_id = ? AND official_code = 'MAT5-U3' AND source_year = 2026) LIMIT 1",
        args: [oaCurricularPref, levelSubjectId],
      })
    ).rows[0];
    const oaCurricularId = oaExistente ? String(oaExistente.id) : oaCurricularPref;
    if (!oaExistente) {
      await c.execute({
        sql: `INSERT INTO curriculum_objectives (id, level_subject_id, official_code, text, source_url, source_year)
              VALUES (?, ?, 'MAT5-U3', 'Fracciones y decimales · Unidad 3 Matemática 5.º Básico', 'https://www.curriculumnacional.cl/', 2026)`,
        args: [oaCurricularId, levelSubjectId],
      });
    }

    const domExiste = (
      await c.execute({ sql: "SELECT id FROM knowledge_domains WHERE id = ? LIMIT 1", args: [dominioId] })
    ).rows.length > 0;
    if (!domExiste) {
      await c.execute({
        sql: "INSERT INTO knowledge_domains (id, level_subject_id, name) VALUES (?, ?, ?)",
        args: [dominioId, levelSubjectId, "Matemática 5.º · Fracciones y decimales"],
      });
    }

    // Si existiera algún borrador previo sin publicar, lo reutilizamos o creamos nueva versión.
    const dv = await crearVersionDominio(c, dominioId, AUTOR);
    const lecciones = obtenerLeccionesPiloto();
    const itemPorOa = new Map<string, { itemId: string; itemVersionId: string }>();

    for (const l of lecciones) {
      const added = await agregarContenido(c, dv.id, {
        code: codigoItemPiloto(l.oaId),
        name: l.titulo,
        operationalDefinition: l.objetivo,
      });
      await c.execute({
        sql: "INSERT INTO knowledge_item_oas (item_version_id, curriculum_objective_id) VALUES (?, ?)",
        args: [added.itemVersionId, oaCurricularId],
      });
      itemPorOa.set(l.oaId, added);
    }

    for (const arista of PRERREQUISITOS_PILOTO_MAT5_U3) {
      const dest = itemPorOa.get(arista.oaId);
      const orig = itemPorOa.get(arista.prereqOaId);
      if (!dest || !orig) continue;
      const pid = await agregarPrerrequisito(c, dv.id, {
        itemId: dest.itemId,
        prerequisiteItemId: orig.itemId,
        relation: arista.relation,
        altGroup: null,
        justification: arista.justification,
        confidence: "curricular_mineduc",
      });
      await validarArista(c, pid, VALIDADOR, ahora);
    }

    await cambiarEstado(c, dv.id, "en_revision", AUTOR, ahora);
    await cambiarEstado(c, dv.id, "validada", VALIDADOR, ahora);
    await cambiarEstado(c, dv.id, "publicada", VALIDADOR, ahora);

    // Sembrar preguntas del Aula Universal (2 práctica + 3 comprobación por OA) en familias propias
    // para que K6 (2 aciertos sin ayuda en familias distintas) sea verificable con ejercicios reales.
    for (const l of lecciones) {
      const item = itemPorOa.get(l.oaId)!;
      const ejercicios = [...l.ejerciciosPractica, ...l.ejerciciosComprobacion];
      for (const ej of ejercicios) {
        const famId = `fam-prac-${ej.id}`;
        const qvId = `qv-prac-${ej.id}`;
        await c.execute({
          sql: "INSERT INTO question_families (id, item_id, bank, label) VALUES (?, ?, 'practica', ?)",
          args: [famId, item.itemId, `${l.codigo} · ${ej.id}`],
        });
        await c.execute({
          sql: `INSERT INTO question_versions
                  (id, family_id, item_id, bank, version, status, stem, options_json, correct_option_id, explanation, origin, authored_by)
                VALUES (?, ?, ?, 'practica', 1, 'borrador', ?, ?, ?, ?, 'humano', ?)`,
          args: [
            qvId,
            famId,
            item.itemId,
            ej.enunciado,
            JSON.stringify(ej.alternativas),
            ej.respuestaCorrecta,
            ej.explicacionCorrecta,
            AUTOR,
          ],
        });
        await c.execute({ sql: "UPDATE question_versions SET status = 'en_revision' WHERE id = ?", args: [qvId] });
        await c.execute({
          sql: "UPDATE question_versions SET status = 'aprobada', reviewed_by = ?, reviewed_at = ? WHERE id = ?",
          args: [VALIDADOR, ahora, qvId],
        });
      }
    }
  }

  if (opts.aprobarPolitica !== false) {
    const vigente = await politicaVigente(c);
    if (!vigente) {
      const maxVer = Number(
        (await c.execute("SELECT COALESCE(MAX(version), 0) AS v FROM mastery_policies")).rows[0]?.v ?? 0,
      );
      const polId = `pol-piloto-${maxVer + 1}`;
      await c.execute({
        sql: "INSERT INTO mastery_policies (id, version, rules_json, status) VALUES (?, ?, ?, 'borrador')",
        args: [polId, maxVer + 1, JSON.stringify(POLITICA_PILOTO_DEMO)],
      });
      await c.execute({
        sql: "UPDATE mastery_policies SET status = 'aprobada', approved_by = ?, approved_at = ? WHERE id = ?",
        args: [VALIDADOR, ahora, polId],
      });
    }
  }

  // Reasegurar createDominio referenciado solo si fuera útil exportado en otros callers.
  void crearDominio;
  return { domainId: dominioId, yaPublicado };
}
