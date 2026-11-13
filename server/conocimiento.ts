// Filtro único de evidencia y estado en sombra (IMP-032, H3a). ÚNICO archivo de producción que nombra las
// tablas `knowledge_evidence`, `evidence_voids`, `knowledge_state_events` y `student_knowledge_state`
// (script/conocimiento.check.ts lo comprueba por búsqueda de texto). El resto del servidor (práctica,
// reconstrucción) trabaja con las funciones que se exportan aquí.
//
// Diseño: 03 §8.3 y §9.1, 04 §5.5, 08 §7.3 (3e5c488) y las decisiones D5.1–D5.5 de H3a.
// - `evidenciaLiberada` es el único productor de `EvidenciaLiberada` (shared/evidencia.ts).
// - La evidencia anulada se entrega marcada `anulada: true`; `evaluar` la excluye. Nada se borra.
// - `familiaRetirada` (D5.2): la familia está retirada (DB-4: todas sus versiones retiradas) y la versión de
//   pregunta que originó la evidencia NO se retiró «por defecto». `otro` cuenta como sin defecto. N17
//   (`retired_counts`) sigue pendiente: aquí solo se mapea el dato, no se decide cómo cuenta.
// - Sin política aprobada (o con parámetros nulos) no se calcula ni se escribe estado.
// - Solo evidencia de práctica (D2). Sin evaluaciones, E2 ni retención.
import type { Client, InStatement, Transaction } from "@libsql/client";
import { evaluar, FUENTES, type Estado, type EstadoContenido, type Evidencia, type Fuente, type Motivo } from "../shared/dominio";
import type { EvidenciaLiberada } from "../shared/evidencia";
import { politicaEjecutable, type PoliticaEjecutable, type PoliticaGuardada } from "../shared/politica";
import { contextoVersion } from "./catalogo";

type Ejecutor = Pick<Client | Transaction, "execute">;
type Lote = Pick<Client, "execute" | "batch">;

export interface PoliticaVigente { id: string; version: number; politica: PoliticaEjecutable }

// D5.3: la vigente es la aprobada de mayor versión. Sin ninguna aprobada (o inválida): null, y no se calcula.
export async function politicaVigente(c: Ejecutor): Promise<PoliticaVigente | null> {
  const r = (await c.execute("SELECT id, version, rules_json FROM mastery_policies WHERE status = 'aprobada' ORDER BY version DESC LIMIT 1")).rows[0];
  if (!r) return null;
  let reglas: unknown;
  try { reglas = JSON.parse(String(r.rules_json)); } catch { return null; }
  if (typeof reglas !== "object" || reglas === null) return null;
  const p = politicaEjecutable(reglas as Partial<PoliticaGuardada>);
  return p.ejecutable ? { id: String(r.id), version: Number(r.version), politica: p.politica } : null;
}

// ── Filtro único ──────────────────────────────────────────────────────────────

// Evidencia publicable de un estudiante, agrupada por contenido. En H3a toda evidencia es de práctica y
// se libera al instante (`practice_released_at = occurred_at`); la condición `<= ahora` se conserva para
// que el contrato no cambie cuando existan orígenes embargados (H4). `ahora` lo fija el servidor.
export async function evidenciaLiberada(c: Ejecutor, estudiante: string, ahora: number, itemId?: string): Promise<Map<string, EvidenciaLiberada[]>> {
  const r = await c.execute({
    sql: `SELECT e.id, e.item_id, e.family_id, e.is_correct, e.assistance, e.session_ref, e.study_day, e.practice_released_at,
                 e.sequence_no, e.source_type, e.item_version_id,
                 EXISTS (SELECT 1 FROM evidence_voids v WHERE v.evidence_id = e.id) AS anulada,
                 (EXISTS (SELECT 1 FROM question_families_retiradas f WHERE f.id = e.family_id)
                  AND NOT EXISTS (SELECT 1 FROM question_versions q WHERE q.id = e.question_version_id AND q.retired_kind = 'defecto')) AS retirada
          FROM knowledge_evidence e
          WHERE e.student_id = ? AND e.practice_released_at <= ? ${itemId ? "AND e.item_id = ?" : ""}
          ORDER BY e.item_id, e.practice_released_at, e.sequence_no, e.id`,
    args: itemId ? [estudiante, ahora, itemId] : [estudiante, ahora],
  });
  const mapa = new Map<string, EvidenciaLiberada[]>();
  for (const f of r.rows) {
    const fuente = String(f.source_type);
    if (!(FUENTES as readonly string[]).includes(fuente)) throw new Error(`Fuente de evidencia no admitida: ${fuente}`);
    const e: Evidencia = {
      id: String(f.id), familia: String(f.family_id), correcta: Number(f.is_correct) === 1, conAyuda: String(f.assistance) !== "ninguna",
      sesion: String(f.session_ref), dia: String(f.study_day), ocurrida: Number(f.practice_released_at), secuencia: Number(f.sequence_no),
      fuente: fuente as Fuente, versionContenido: String(f.item_version_id), anulada: Number(f.anulada) === 1, familiaRetirada: Number(f.retirada) === 1,
    };
    const lista = mapa.get(String(f.item_id)) ?? [];
    lista.push(e as EvidenciaLiberada); // único lugar de producción que marca evidencia como liberada
    mapa.set(String(f.item_id), lista);
  }
  return mapa;
}

// ── Estado calculado ──────────────────────────────────────────────────────────

export interface FilaProyeccion {
  itemId: string;
  state: Estado;
  flag: "por_comprobar" | null;
  uncertaintyReason: Motivo | null;
  lastEvidenceAt: number | null;
  policyId: string;
  domainVersionId: string;
  computedThrough: number;
}

// Estado de un contenido a partir de su evidencia liberada. null si el contenido no tiene versión publicada.
export async function calcularEstado(c: Ejecutor, pol: PoliticaVigente, itemId: string, evidencias: readonly EvidenciaLiberada[]): Promise<FilaProyeccion | null> {
  const ctx = await contextoVersion(c, itemId, false); // retencionVencida: no es de H3a
  if (!ctx) return null;
  const dv = (await c.execute({ sql: "SELECT domain_version_id FROM knowledge_item_versions WHERE id = ?", args: [ctx.versionActual] })).rows[0];
  if (!dv) return null;
  const o: EstadoContenido = evaluar(evidencias, ctx, pol.politica);
  const vivas = evidencias.filter((x) => !x.anulada);
  return {
    itemId, state: o.estado, flag: o.marca, uncertaintyReason: o.motivo,
    lastEvidenceAt: vivas.length ? Math.max(...vivas.map((x) => x.ocurrida)) : null,
    policyId: pol.id, domainVersionId: String(dv.domain_version_id),
    computedThrough: evidencias.length ? Math.max(...evidencias.map((x) => x.ocurrida)) : 0,
  };
}

export interface Reconstruido { politica: PoliticaVigente | null; filas: FilaProyeccion[]; sinContexto: string[] }

// Reproduce el estado desde las evidencias liberadas con la política y el contexto vigentes. Solo lee.
export async function reconstruirEstados(c: Ejecutor, estudiante: string, ahora: number): Promise<Reconstruido> {
  const politica = await politicaVigente(c);
  if (!politica) return { politica: null, filas: [], sinContexto: [] };
  const filas: FilaProyeccion[] = [], sinContexto: string[] = [];
  for (const [itemId, evs] of [...(await evidenciaLiberada(c, estudiante, ahora)).entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const f = await calcularEstado(c, politica, itemId, evs);
    if (f) filas.push(f); else sinContexto.push(itemId);
  }
  return { politica, filas, sinContexto };
}

const fila = (x: Record<string, unknown>): FilaProyeccion & { updatedAt: number } => ({
  itemId: String(x.item_id), state: String(x.state) as Estado, flag: x.flag == null ? null : (String(x.flag) as "por_comprobar"),
  uncertaintyReason: x.uncertainty_reason == null ? null : (String(x.uncertainty_reason) as Motivo),
  lastEvidenceAt: x.last_evidence_at == null ? null : Number(x.last_evidence_at), policyId: String(x.policy_id),
  domainVersionId: String(x.domain_version_id), computedThrough: Number(x.computed_through), updatedAt: Number(x.updated_at),
});

export async function leerProyeccion(c: Ejecutor, estudiante: string): Promise<(FilaProyeccion & { updatedAt: number })[]> {
  const r = await c.execute({ sql: "SELECT * FROM student_knowledge_state WHERE student_id = ? ORDER BY item_id", args: [estudiante] });
  return r.rows.map((x) => fila(x as unknown as Record<string, unknown>));
}

// Escribe una fila de la proyección: UPDATE y, si no existe, INSERT (el UPSERT se rechaza a propósito).
// `guarda`: si se indica, el UPDATE solo aplica con ese `computed_through` (lecturas simultáneas, 08 §7.3).
function sentenciasProyeccion(estudiante: string, f: FilaProyeccion, ahora: number, guarda?: { computedThrough: number }, existeEvidencia?: string): InStatement[] {
  const valores = [f.state, f.flag, f.uncertaintyReason, f.lastEvidenceAt, f.policyId, f.domainVersionId, f.computedThrough, ahora];
  const cond = existeEvidencia ? " AND EXISTS (SELECT 1 FROM knowledge_evidence WHERE id = ?)" : "";
  const extra = existeEvidencia ? [existeEvidencia] : [];
  return [
    { sql: `UPDATE student_knowledge_state SET state = ?, flag = ?, uncertainty_reason = ?, last_evidence_at = ?, policy_id = ?, domain_version_id = ?,
            computed_through = ?, updated_at = ? WHERE student_id = ? AND item_id = ?${guarda ? " AND computed_through = ?" : ""}${cond}`,
      args: [...valores, estudiante, f.itemId, ...(guarda ? [guarda.computedThrough] : []), ...extra] },
    { sql: `INSERT INTO student_knowledge_state (student_id, item_id, state, flag, uncertainty_reason, last_evidence_at, policy_id, domain_version_id, computed_through, updated_at)
            SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM student_knowledge_state WHERE student_id = ? AND item_id = ?)${cond}`,
      args: [estudiante, f.itemId, ...valores, estudiante, f.itemId, ...extra] },
  ];
}

// Lectura del estado (08 §7.3): pone al día lo publicable que la proyección aún no incluye, con
// actualización condicionada por `computed_through` (dos lecturas simultáneas no se pisan), y devuelve la
// proyección. No emite eventos. Sin política ejecutable no calcula ni escribe nada.
export async function leerEstado(c: Lote, estudiante: string, ahora: number): Promise<{ politicaEjecutable: boolean; filas: FilaProyeccion[] }> {
  const existentes = await leerProyeccion(c, estudiante);
  const rec = await reconstruirEstados(c, estudiante, ahora);
  if (!rec.politica) return { politicaEjecutable: false, filas: existentes };
  const actuales = new Map(existentes.map((x) => [x.itemId, x]));
  const stmts: InStatement[] = [];
  for (const f of rec.filas) {
    const previa = actuales.get(f.itemId);
    if (!previa) stmts.push(...sentenciasProyeccion(estudiante, f, ahora));
    else if (f.computedThrough > previa.computedThrough) stmts.push(...sentenciasProyeccion(estudiante, f, ahora, { computedThrough: previa.computedThrough }));
  }
  if (stmts.length) await c.batch(stmts, "write");
  return { politicaEjecutable: true, filas: stmts.length ? await leerProyeccion(c, estudiante) : existentes };
}

// Reparación (IMP-033): reescribe SOLO la proyección con lo reconstruido. No toca eventos ni evidencia.
export async function reescribirProyeccion(c: Lote, estudiante: string, ahora: number): Promise<{ escritas: number; politicaEjecutable: boolean }> {
  const rec = await reconstruirEstados(c, estudiante, ahora);
  if (!rec.politica) return { escritas: 0, politicaEjecutable: false };
  const stmts = rec.filas.flatMap((f) => sentenciasProyeccion(estudiante, f, ahora));
  if (stmts.length) await c.batch(stmts, "write");
  return { escritas: rec.filas.length, politicaEjecutable: true };
}

// ── Registro de una respuesta (lo usa server/practica.ts) ─────────────────────

export interface PlanEstado {
  fila: FilaProyeccion;
  previo: { state: Estado; flag: "por_comprobar" | null } | null;
}

export interface Hipotetica { familia: string; correcta: boolean; conAyuda: boolean; sesion: string; dia: string; fuente: Fuente; versionContenido: string }

// Estado que resultaría de agregar esta respuesta. null si no hay política ejecutable o el contenido no
// tiene versión publicada: en ese caso la respuesta y la evidencia se conservan y no se escribe estado.
export async function planificarEstado(c: Ejecutor, estudiante: string, itemId: string, ahora: number, h: Hipotetica): Promise<PlanEstado | null> {
  const pol = await politicaVigente(c);
  if (!pol) return null;
  const evs = (await evidenciaLiberada(c, estudiante, ahora, itemId)).get(itemId) ?? [];
  const nueva: Evidencia = {
    id: "nueva", familia: h.familia, correcta: h.correcta, conAyuda: h.conAyuda, sesion: h.sesion, dia: h.dia, ocurrida: ahora,
    secuencia: Number.MAX_SAFE_INTEGER, fuente: h.fuente, versionContenido: h.versionContenido, anulada: false, familiaRetirada: false,
  };
  const fila = await calcularEstado(c, pol, itemId, [...evs, nueva as EvidenciaLiberada]);
  if (!fila) return null;
  fila.computedThrough = ahora; fila.lastEvidenceAt = ahora;
  const p = (await c.execute({ sql: "SELECT state, flag FROM student_knowledge_state WHERE student_id = ? AND item_id = ?", args: [estudiante, itemId] })).rows[0];
  return { fila, previo: p ? { state: String(p.state) as Estado, flag: p.flag == null ? null : "por_comprobar" } : null };
}

// Sentencias S1–S3 del lote atómico de una respuesta. Todas derivan de la fila de la respuesta (S1) o
// exigen que la evidencia exista, así que si la respuesta no se insertó (guarda de concurrencia) no
// escriben nada.
export function sentenciasEvidencia(p: { respuestaId: string; evidenciaId: string; eventoId: string; estudiante: string; itemId: string; ahora: number; plan: PlanEstado | null }): InStatement[] {
  const s: InStatement[] = [{
    sql: `INSERT INTO knowledge_evidence (id, student_id, item_id, family_id, question_version_id, item_version_id, domain_version_id, source_type,
            practice_answer_id, attempt_answer_id, is_correct, assistance, accommodation, session_ref, sequence_no, study_day,
            evaluation_version_id, review_at, occurred_at, practice_released_at)
          SELECT ?, a.student_id, a.item_id, a.family_id, a.question_version_id, v.id, a.domain_version_id, a.purpose,
                 a.id, NULL, a.is_correct, a.assistance, a.accommodation, a.session_id, a.sequence_no, a.study_day,
                 NULL, NULL, a.answered_at, a.answered_at
          FROM practice_answers a JOIN knowledge_item_versions v ON v.domain_version_id = a.domain_version_id AND v.item_id = a.item_id
          WHERE a.id = ?`,
    args: [p.evidenciaId, p.respuestaId],
  }];
  if (!p.plan) return s;
  const { fila: f, previo } = p.plan;
  if (!previo || previo.state !== f.state || previo.flag !== f.flag) {
    s.push({
      sql: `INSERT INTO knowledge_state_events (id, student_id, item_id, from_state, to_state, from_flag, to_flag, reason, trigger_evidence_id, trigger_void_id,
              policy_id, domain_version_id, computed_at, effective_at)
            SELECT ?, ?, ?, ?, ?, ?, ?, 'evidencia', ?, NULL, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM knowledge_evidence WHERE id = ?)`,
      args: [p.eventoId, p.estudiante, p.itemId, previo?.state ?? null, f.state, previo?.flag ?? null, f.flag, p.evidenciaId, f.policyId, f.domainVersionId, p.ahora, p.ahora, p.evidenciaId],
    });
  }
  s.push(...sentenciasProyeccion(p.estudiante, f, p.ahora, undefined, p.evidenciaId));
  return s;
}

// Resultado ya registrado de una respuesta (idempotencia): la evidencia y el estado proyectado actual.
export async function resultadoDeRespuesta(c: Ejecutor, respuestaId: string, estudiante: string, itemId: string): Promise<{ evidenciaId: string | null; estado: { estado: Estado; marca: "por_comprobar" | null; motivo: Motivo | null } | null }> {
  const e = (await c.execute({ sql: "SELECT id FROM knowledge_evidence WHERE practice_answer_id = ?", args: [respuestaId] })).rows[0];
  const p = (await c.execute({ sql: "SELECT state, flag, uncertainty_reason FROM student_knowledge_state WHERE student_id = ? AND item_id = ?", args: [estudiante, itemId] })).rows[0];
  return {
    evidenciaId: e ? String(e.id) : null,
    estado: p ? { estado: String(p.state) as Estado, marca: p.flag == null ? null : "por_comprobar", motivo: p.uncertainty_reason == null ? null : (String(p.uncertainty_reason) as Motivo) } : null,
  };
}

// ── Detectores de solo lectura (informan para revisión humana; no corrigen nada) ─────────────────────

// Respuestas sin su evidencia (el lote atómico no debería dejarlas; detecta SQL directo).
export async function respuestasSinEvidencia(c: Ejecutor): Promise<{ respuestaId: string; estudiante: string }[]> {
  const r = await c.execute(`SELECT a.id, a.student_id FROM practice_answers a LEFT JOIN knowledge_evidence e ON e.practice_answer_id = a.id
                             WHERE e.id IS NULL ORDER BY a.student_id, a.sequence_no, a.id`);
  return r.rows.map((x) => ({ respuestaId: String(x.id), estudiante: String(x.student_id) }));
}

// D5.2: evidencia de versiones de pregunta retiradas por defecto SIN anulación explícita. No anula ni excluye.
export async function retiradasPorDefectoSinAnular(c: Ejecutor): Promise<{ evidenciaId: string; estudiante: string; itemId: string; preguntaVersionId: string }[]> {
  const r = await c.execute(`SELECT e.id, e.student_id, e.item_id, e.question_version_id FROM knowledge_evidence e
    JOIN question_versions q ON q.id = e.question_version_id LEFT JOIN evidence_voids v ON v.evidence_id = e.id
    WHERE q.status = 'retirada' AND q.retired_kind = 'defecto' AND v.id IS NULL ORDER BY e.student_id, e.item_id, e.sequence_no, e.id`);
  return r.rows.map((x) => ({ evidenciaId: String(x.id), estudiante: String(x.student_id), itemId: String(x.item_id), preguntaVersionId: String(x.question_version_id) }));
}
