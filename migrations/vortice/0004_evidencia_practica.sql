-- H3a (IMP-030): práctica, evidencia y estado en sombra. Migración ADITIVA: no modifica 0001, 0002 ni 0003
-- ni las tablas heredadas. Se aplica con server/migrar.ts. Diseño: 04 §5.4–§5.5 y §6 (3e5c488), con las
-- decisiones D1–D7 y D5.1–D5.5 de la dirección (H3a).
--
-- Alcance: siete tablas. El único origen de evidencia es la PRÁCTICA (D2): las columnas de evaluación
-- (`attempt_answer_id`, `evaluation_version_id`, `review_at`) existen pero un CHECK las fuerza a NULL; la
-- evidencia de evaluaciones se incorporará en H4 reconstruyendo la tabla (SQLite no agrega una FK a una
-- tabla existente). Fuera de esta migración: evaluación, E2, retención (agenda), recomendaciones.
-- Tiempos: REAL (segundos UTC con fracción, `unixepoch('subsec')` de la base), como 0001 y 0002 (D6).
--
-- Patrón de 0003 en CADA tabla: ninguna protección depende de PRAGMA foreign_keys ni de que la aplicación
-- se porte bien.
--   - *_no_sustituir (BEFORE INSERT): rechaza todo INSERT que choque por clave primaria o clave única.
--     Cubre INSERT OR REPLACE, INSERT OR IGNORE y ON CONFLICT DO UPDATE / DO NOTHING.
--   - Solo inserción: BEFORE UPDATE y BEFORE DELETE abortan (también UPDATE OR REPLACE, que dispara BEFORE UPDATE).
--   - Identidad inmutable donde la fila es actualizable.
--   - FK compuestas, CHECK, índices únicos y parciales, ON DELETE RESTRICT.
-- Endurecimientos D4: dominio publicado al abrir sesión, al responder y al generar evidencia; coherencia
-- sesión–dominio–respuesta–evidencia por FK compuesta (incluye fecha, secuencia y día copiados);
-- `sequence_no` único y creciente; ninguna respuesta en una sesión cerrada; `is_correct` verificado contra
-- la clave de la pregunta.
-- La proyección es actualizable (UPDATE) y sus altas son INSERT simples; el UPSERT se rechaza a propósito
-- (el servicio escribe UPDATE seguido de INSERT condicionado).

-- 1. Sesiones de práctica. D5.4: una abierta por estudiante y dominio, sin importar el propósito.
CREATE TABLE practice_sessions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  domain_id TEXT NOT NULL,
  domain_version_id TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('practica', 'retencion')),
  started_at REAL NOT NULL,
  ended_at REAL,
  FOREIGN KEY (domain_version_id, domain_id) REFERENCES knowledge_domain_versions (id, domain_id) ON DELETE RESTRICT,
  UNIQUE (id, student_id, purpose, domain_version_id),
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);
--> statement-breakpoint
CREATE UNIQUE INDEX ps_una_abierta ON practice_sessions (student_id, domain_id) WHERE ended_at IS NULL;
--> statement-breakpoint
CREATE TRIGGER ps_no_sustituir BEFORE INSERT ON practice_sessions
WHEN EXISTS (SELECT 1 FROM practice_sessions WHERE id = NEW.id
             OR (NEW.ended_at IS NULL AND student_id = NEW.student_id AND domain_id = NEW.domain_id AND ended_at IS NULL))
BEGIN SELECT RAISE(ABORT, 'practice_sessions: no se sustituye una sesión existente ni se abre otra mientras haya una abierta'); END;
--> statement-breakpoint
CREATE TRIGGER ps_nace_abierta BEFORE INSERT ON practice_sessions
WHEN NEW.ended_at IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'practice_sessions: una sesión nace abierta'); END;
--> statement-breakpoint
CREATE TRIGGER ps_dominio_publicado BEFORE INSERT ON practice_sessions
WHEN (SELECT status FROM knowledge_domain_versions WHERE id = NEW.domain_version_id) IS NOT 'publicada'
BEGIN SELECT RAISE(ABORT, 'practice_sessions: la versión de dominio no está publicada'); END;
--> statement-breakpoint
CREATE TRIGGER ps_identidad BEFORE UPDATE ON practice_sessions
WHEN NEW.id IS NOT OLD.id OR NEW.student_id IS NOT OLD.student_id OR NEW.domain_id IS NOT OLD.domain_id
  OR NEW.domain_version_id IS NOT OLD.domain_version_id OR NEW.purpose IS NOT OLD.purpose OR NEW.started_at IS NOT OLD.started_at
BEGIN SELECT RAISE(ABORT, 'practice_sessions: identidad inmutable; solo se cierra'); END;
--> statement-breakpoint
CREATE TRIGGER ps_no_reabrir BEFORE UPDATE ON practice_sessions
WHEN OLD.ended_at IS NOT NULL AND NEW.ended_at IS NOT OLD.ended_at
BEGIN SELECT RAISE(ABORT, 'practice_sessions: una sesión cerrada no se reabre ni se modifica'); END;
--> statement-breakpoint
CREATE TRIGGER ps_sin_delete BEFORE DELETE ON practice_sessions
BEGIN SELECT RAISE(ABORT, 'practice_sessions: no se borra'); END;
--> statement-breakpoint

-- 2. Respuestas de práctica: solo inserción.
CREATE TABLE practice_answers (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  purpose TEXT NOT NULL,
  domain_version_id TEXT NOT NULL,
  question_version_id TEXT NOT NULL,
  family_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  bank TEXT NOT NULL CHECK (bank = 'practica'),
  selected_option_id TEXT NOT NULL CHECK (length(trim(selected_option_id)) > 0),
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  assistance TEXT NOT NULL CHECK (assistance IN ('ninguna', 'pista', 'explicacion_vista', 'tutor')),
  accommodation TEXT,
  client_submission_id TEXT NOT NULL CHECK (length(trim(client_submission_id)) > 0),
  answered_at REAL NOT NULL,
  sequence_no INTEGER NOT NULL CHECK (sequence_no >= 1),
  study_day TEXT NOT NULL CHECK (study_day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  FOREIGN KEY (session_id, student_id, purpose, domain_version_id)
    REFERENCES practice_sessions (id, student_id, purpose, domain_version_id) ON DELETE RESTRICT,
  FOREIGN KEY (question_version_id, family_id, item_id, bank)
    REFERENCES question_versions (id, family_id, item_id, bank) ON DELETE RESTRICT,
  UNIQUE (student_id, client_submission_id),
  UNIQUE (student_id, sequence_no),
  UNIQUE (id, student_id, session_id, question_version_id, family_id, item_id, is_correct, assistance, purpose,
          domain_version_id, answered_at, sequence_no, study_day)
);
--> statement-breakpoint
CREATE INDEX pa_item ON practice_answers (student_id, item_id, sequence_no);
--> statement-breakpoint
CREATE TRIGGER pa_no_update BEFORE UPDATE ON practice_answers
BEGIN SELECT RAISE(ABORT, 'practice_answers es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER pa_no_delete BEFORE DELETE ON practice_answers
BEGIN SELECT RAISE(ABORT, 'practice_answers es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER pa_no_sustituir BEFORE INSERT ON practice_answers
WHEN EXISTS (SELECT 1 FROM practice_answers WHERE id = NEW.id
             OR (student_id = NEW.student_id AND client_submission_id = NEW.client_submission_id)
             OR (student_id = NEW.student_id AND sequence_no = NEW.sequence_no))
BEGIN SELECT RAISE(ABORT, 'practice_answers: no se sustituye una respuesta existente'); END;
--> statement-breakpoint
-- La pregunta debe estar aprobada al responder (una FK no ve el estado) y no anulada (DB-13).
CREATE TRIGGER pa_pregunta_aprobada BEFORE INSERT ON practice_answers
WHEN (SELECT status FROM question_versions WHERE id = NEW.question_version_id) IS NOT 'aprobada'
BEGIN SELECT RAISE(ABORT, 'practice_answers: pregunta no aprobada'); END;
--> statement-breakpoint
CREATE TRIGGER pa_pregunta_no_anulada BEFORE INSERT ON practice_answers
WHEN EXISTS (SELECT 1 FROM question_voids WHERE question_version_id = NEW.question_version_id)
BEGIN SELECT RAISE(ABORT, 'practice_answers: pregunta anulada'); END;
--> statement-breakpoint
CREATE TRIGGER pa_sesion_abierta BEFORE INSERT ON practice_answers
WHEN (SELECT ended_at FROM practice_sessions WHERE id = NEW.session_id) IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'practice_answers: sesion_cerrada'); END;
--> statement-breakpoint
CREATE TRIGGER pa_dominio_publicado BEFORE INSERT ON practice_answers
WHEN (SELECT status FROM knowledge_domain_versions WHERE id = NEW.domain_version_id) IS NOT 'publicada'
BEGIN SELECT RAISE(ABORT, 'practice_answers: sesion_obsoleta, la versión de dominio ya no está publicada'); END;
--> statement-breakpoint
CREATE TRIGGER pa_item_en_dominio BEFORE INSERT ON practice_answers
WHEN NOT EXISTS (SELECT 1 FROM knowledge_item_versions WHERE domain_version_id = NEW.domain_version_id AND item_id = NEW.item_id)
BEGIN SELECT RAISE(ABORT, 'practice_answers: el contenido no pertenece a la versión de dominio de la sesión'); END;
--> statement-breakpoint
-- La correctitud la fija el servidor, y la base la verifica contra la clave de la pregunta.
CREATE TRIGGER pa_opcion_valida BEFORE INSERT ON practice_answers
WHEN NOT EXISTS (SELECT 1 FROM question_versions q, json_each(q.options_json) o
                 WHERE q.id = NEW.question_version_id AND json_extract(o.value, '$.id') = NEW.selected_option_id)
BEGIN SELECT RAISE(ABORT, 'practice_answers: la opción no pertenece a la pregunta'); END;
--> statement-breakpoint
CREATE TRIGGER pa_correctitud BEFORE INSERT ON practice_answers
WHEN NEW.is_correct IS NOT (NEW.selected_option_id = (SELECT correct_option_id FROM question_versions WHERE id = NEW.question_version_id))
BEGIN SELECT RAISE(ABORT, 'practice_answers: is_correct no corresponde a la clave de la pregunta'); END;
--> statement-breakpoint
-- sequence_no creciente por estudiante (además de único).
CREATE TRIGGER pa_secuencia_creciente BEFORE INSERT ON practice_answers
WHEN EXISTS (SELECT 1 FROM practice_answers WHERE student_id = NEW.student_id AND sequence_no >= NEW.sequence_no)
BEGIN SELECT RAISE(ABORT, 'practice_answers: la secuencia debe ser creciente'); END;
--> statement-breakpoint

-- 3. Evidencia: solo inserción, una por respuesta, copia atada por FK a la respuesta de origen.
CREATE TABLE knowledge_evidence (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  item_id TEXT NOT NULL,
  family_id TEXT NOT NULL,
  question_version_id TEXT NOT NULL,
  item_version_id TEXT NOT NULL,
  domain_version_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  practice_answer_id TEXT NOT NULL,
  attempt_answer_id TEXT,
  is_correct INTEGER NOT NULL,
  assistance TEXT NOT NULL,
  accommodation TEXT,
  session_ref TEXT NOT NULL,
  sequence_no INTEGER NOT NULL,
  study_day TEXT NOT NULL,
  evaluation_version_id TEXT,
  review_at REAL,
  occurred_at REAL NOT NULL,
  practice_released_at REAL,
  -- D2: solo práctica. H4 reconstruirá la tabla para admitir los orígenes de evaluación.
  CHECK (source_type IN ('practica', 'retencion')
         AND attempt_answer_id IS NULL AND evaluation_version_id IS NULL AND review_at IS NULL
         AND practice_released_at IS NOT NULL AND practice_released_at = occurred_at),
  FOREIGN KEY (practice_answer_id, student_id, session_ref, question_version_id, family_id, item_id, is_correct,
               assistance, source_type, domain_version_id, occurred_at, sequence_no, study_day)
    REFERENCES practice_answers (id, student_id, session_id, question_version_id, family_id, item_id, is_correct,
               assistance, purpose, domain_version_id, answered_at, sequence_no, study_day) ON DELETE RESTRICT,
  FOREIGN KEY (item_version_id, item_id, domain_version_id)
    REFERENCES knowledge_item_versions (id, item_id, domain_version_id) ON DELETE RESTRICT,
  UNIQUE (student_id, sequence_no)
);
--> statement-breakpoint
CREATE UNIQUE INDEX ke_practice_uq ON knowledge_evidence (practice_answer_id) WHERE practice_answer_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX ke_read ON knowledge_evidence (student_id, item_id, occurred_at);
--> statement-breakpoint
CREATE TRIGGER ke_no_update BEFORE UPDATE ON knowledge_evidence
BEGIN SELECT RAISE(ABORT, 'knowledge_evidence es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER ke_no_delete BEFORE DELETE ON knowledge_evidence
BEGIN SELECT RAISE(ABORT, 'knowledge_evidence es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER ke_no_sustituir BEFORE INSERT ON knowledge_evidence
WHEN EXISTS (SELECT 1 FROM knowledge_evidence WHERE id = NEW.id OR practice_answer_id = NEW.practice_answer_id
             OR (student_id = NEW.student_id AND sequence_no = NEW.sequence_no))
BEGIN SELECT RAISE(ABORT, 'knowledge_evidence: no se sustituye una evidencia existente'); END;
--> statement-breakpoint
CREATE TRIGGER ke_dominio_publicado BEFORE INSERT ON knowledge_evidence
WHEN (SELECT status FROM knowledge_domain_versions WHERE id = NEW.domain_version_id) IS NOT 'publicada'
BEGIN SELECT RAISE(ABORT, 'knowledge_evidence: la versión de dominio no está publicada'); END;
--> statement-breakpoint
-- `accommodation` es nulable y por eso no entra en la FK compuesta (una columna NULL desactiva la FK).
CREATE TRIGGER ke_copia_ajuste BEFORE INSERT ON knowledge_evidence
WHEN NEW.accommodation IS NOT (SELECT accommodation FROM practice_answers WHERE id = NEW.practice_answer_id)
BEGIN SELECT RAISE(ABORT, 'knowledge_evidence: accommodation distinto de la respuesta de origen'); END;
--> statement-breakpoint

-- 4. Anulación de evidencia (D5.1): solo inserción. Los servicios de anulación son H3b.
CREATE TABLE evidence_voids (
  id TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL UNIQUE REFERENCES knowledge_evidence(id) ON DELETE RESTRICT,
  question_void_id TEXT REFERENCES question_voids(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  requested_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  at REAL NOT NULL,
  CHECK (requested_by <> approved_by OR question_void_id IS NOT NULL)
);
--> statement-breakpoint
CREATE TRIGGER ev_no_update BEFORE UPDATE ON evidence_voids
BEGIN SELECT RAISE(ABORT, 'evidence_voids es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER ev_no_delete BEFORE DELETE ON evidence_voids
BEGIN SELECT RAISE(ABORT, 'evidence_voids es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER ev_no_sustituir BEFORE INSERT ON evidence_voids
WHEN EXISTS (SELECT 1 FROM evidence_voids WHERE id = NEW.id OR evidence_id = NEW.evidence_id)
BEGIN SELECT RAISE(ABORT, 'evidence_voids: no se sustituye una anulación existente'); END;
--> statement-breakpoint
-- Una anulación en bloque debe referirse a la pregunta de la evidencia.
CREATE TRIGGER ev_pregunta_coherente BEFORE INSERT ON evidence_voids
WHEN NEW.question_void_id IS NOT NULL
 AND (SELECT question_version_id FROM question_voids WHERE id = NEW.question_void_id)
     IS NOT (SELECT question_version_id FROM knowledge_evidence WHERE id = NEW.evidence_id)
BEGIN SELECT RAISE(ABORT, 'evidence_voids: la anulación de pregunta no corresponde a la evidencia'); END;
--> statement-breakpoint

-- 5. Políticas de dominio (D5.3): borrador y aprobada. Aprobada es inmutable; sin estado de retiro; la
-- vigente es la aprobada de mayor versión. La carga y la aprobación por servicio son IMP-034 (H3b).
CREATE TABLE mastery_policies (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL UNIQUE CHECK (version >= 1),
  rules_json TEXT NOT NULL CHECK (json_valid(rules_json) AND json_type(rules_json) = 'object'),
  status TEXT NOT NULL CHECK (status IN ('borrador', 'aprobada')),
  approved_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
  approved_at REAL,
  CHECK ((status = 'borrador' AND approved_by IS NULL AND approved_at IS NULL)
         OR (status = 'aprobada' AND approved_by IS NOT NULL AND approved_at IS NOT NULL))
);
--> statement-breakpoint
CREATE TRIGGER mp_no_sustituir BEFORE INSERT ON mastery_policies
WHEN EXISTS (SELECT 1 FROM mastery_policies WHERE id = NEW.id OR version = NEW.version)
BEGIN SELECT RAISE(ABORT, 'mastery_policies: no se sustituye una política existente'); END;
--> statement-breakpoint
CREATE TRIGGER mp_nace_borrador BEFORE INSERT ON mastery_policies
WHEN NEW.status <> 'borrador'
BEGIN SELECT RAISE(ABORT, 'mastery_policies: una política nace en borrador'); END;
--> statement-breakpoint
CREATE TRIGGER mp_identidad BEFORE UPDATE ON mastery_policies
WHEN NEW.id IS NOT OLD.id OR NEW.version IS NOT OLD.version
BEGIN SELECT RAISE(ABORT, 'mastery_policies: identidad inmutable'); END;
--> statement-breakpoint
CREATE TRIGGER mp_aprobada_inmutable BEFORE UPDATE ON mastery_policies
WHEN OLD.status = 'aprobada'
BEGIN SELECT RAISE(ABORT, 'mastery_policies: una política aprobada es inmutable'); END;
--> statement-breakpoint
CREATE TRIGGER mp_transicion BEFORE UPDATE OF status ON mastery_policies
WHEN NEW.status IS NOT OLD.status AND NOT (OLD.status = 'borrador' AND NEW.status = 'aprobada')
BEGIN SELECT RAISE(ABORT, 'mastery_policies: la única transición es borrador a aprobada'); END;
--> statement-breakpoint
-- Aprobar exige los ocho parámetros de PoliticaEjecutable (shared/politica.ts), completos, tipados y no
-- nulos, y ninguna clave desconocida. COALESCE evita que un NULL (clave ausente) deje la condición en NULL.
CREATE TRIGGER mp_aprobar_completa BEFORE UPDATE OF status ON mastery_policies
WHEN NEW.status = 'aprobada' AND NOT (
  COALESCE(json_type(NEW.rules_json, '$.k6_min_families') = 'integer' AND json_extract(NEW.rules_json, '$.k6_min_families') = 2, 0)
  AND COALESCE(json_type(NEW.rules_json, '$.k6_separation') = 'text' AND json_extract(NEW.rules_json, '$.k6_separation') IN ('ninguna', 'sesion', 'dia'), 0)
  AND COALESCE(json_type(NEW.rules_json, '$.assisted_counts') IN ('true', 'false'), 0)
  AND COALESCE(json_type(NEW.rules_json, '$.wrong_with_help_counts') IN ('true', 'false'), 0)
  AND COALESCE(json_type(NEW.rules_json, '$.error_repaired_counts') IN ('true', 'false'), 0)
  AND COALESCE(json_type(NEW.rules_json, '$.retired_counts') IN ('true', 'false'), 0)
  AND COALESCE(json_type(NEW.rules_json, '$.demote_wrong_families') = 'integer' AND json_extract(NEW.rules_json, '$.demote_wrong_families') >= 1, 0)
  AND COALESCE(json_type(NEW.rules_json, '$.not_mastered_wrong_families') = 'integer' AND json_extract(NEW.rules_json, '$.not_mastered_wrong_families') >= 1, 0)
  AND NOT EXISTS (SELECT 1 FROM json_each(NEW.rules_json) WHERE key NOT IN ('k6_min_families', 'k6_separation', 'assisted_counts',
        'wrong_with_help_counts', 'error_repaired_counts', 'retired_counts', 'demote_wrong_families', 'not_mastered_wrong_families'))
)
BEGIN SELECT RAISE(ABORT, 'mastery_policies: aprobar exige los ocho parámetros completos, tipados y no nulos'); END;
--> statement-breakpoint
CREATE TRIGGER mp_sin_delete_aprobada BEFORE DELETE ON mastery_policies
WHEN OLD.status = 'aprobada'
BEGIN SELECT RAISE(ABORT, 'mastery_policies: una política aprobada no se borra'); END;
--> statement-breakpoint

-- 6. Eventos de estado: solo inserción; uno por cambio de estado o de marca.
CREATE TABLE knowledge_state_events (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE RESTRICT,
  from_state TEXT CHECK (from_state IS NULL OR from_state IN ('sin_evidencia', 'incierto', 'dominado', 'no_dominado')),
  to_state TEXT NOT NULL CHECK (to_state IN ('sin_evidencia', 'incierto', 'dominado', 'no_dominado')),
  from_flag TEXT CHECK (from_flag IS NULL OR from_flag = 'por_comprobar'),
  to_flag TEXT CHECK (to_flag IS NULL OR to_flag = 'por_comprobar'),
  reason TEXT NOT NULL CHECK (reason IN ('evidencia', 'liberacion', 'anulacion', 'nueva_version', 'cambio_politica', 'retencion_vencida')),
  trigger_evidence_id TEXT REFERENCES knowledge_evidence(id) ON DELETE RESTRICT,
  trigger_void_id TEXT REFERENCES evidence_voids(id) ON DELETE RESTRICT,
  policy_id TEXT NOT NULL REFERENCES mastery_policies(id) ON DELETE RESTRICT,
  domain_version_id TEXT NOT NULL REFERENCES knowledge_domain_versions(id) ON DELETE RESTRICT,
  computed_at REAL NOT NULL,
  effective_at REAL NOT NULL,
  CHECK (from_state IS NOT to_state OR from_flag IS NOT to_flag),
  CHECK ((reason = 'evidencia' AND trigger_evidence_id IS NOT NULL AND trigger_void_id IS NULL)
         OR (reason = 'anulacion' AND trigger_void_id IS NOT NULL)
         OR reason NOT IN ('evidencia', 'anulacion'))
);
--> statement-breakpoint
CREATE INDEX kse_estudiante ON knowledge_state_events (student_id, item_id, effective_at);
--> statement-breakpoint
CREATE TRIGGER kse_no_update BEFORE UPDATE ON knowledge_state_events
BEGIN SELECT RAISE(ABORT, 'knowledge_state_events es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER kse_no_delete BEFORE DELETE ON knowledge_state_events
BEGIN SELECT RAISE(ABORT, 'knowledge_state_events es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER kse_no_sustituir BEFORE INSERT ON knowledge_state_events
WHEN EXISTS (SELECT 1 FROM knowledge_state_events WHERE id = NEW.id)
BEGIN SELECT RAISE(ABORT, 'knowledge_state_events: no se sustituye un evento existente'); END;
--> statement-breakpoint
CREATE TRIGGER kse_politica_aprobada BEFORE INSERT ON knowledge_state_events
WHEN (SELECT status FROM mastery_policies WHERE id = NEW.policy_id) IS NOT 'aprobada'
BEGIN SELECT RAISE(ABORT, 'knowledge_state_events: la política no está aprobada'); END;
--> statement-breakpoint
CREATE TRIGGER kse_evidencia_coherente BEFORE INSERT ON knowledge_state_events
WHEN NEW.trigger_evidence_id IS NOT NULL
 AND NOT EXISTS (SELECT 1 FROM knowledge_evidence WHERE id = NEW.trigger_evidence_id AND student_id = NEW.student_id AND item_id = NEW.item_id)
BEGIN SELECT RAISE(ABORT, 'knowledge_state_events: la evidencia no es del mismo estudiante y contenido'); END;
--> statement-breakpoint

-- 7. Proyección del estado por contenido: reconstruible (D9). D5.5: sin conteos de familias, sin
-- assisted_count ni mastered_at (se agregarán cuando se apruebe su semántica, con ALTER TABLE ADD COLUMN).
CREATE TABLE student_knowledge_state (
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE RESTRICT,
  state TEXT NOT NULL CHECK (state IN ('sin_evidencia', 'incierto', 'dominado', 'no_dominado')),
  flag TEXT CHECK (flag IS NULL OR flag = 'por_comprobar'),
  uncertainty_reason TEXT CHECK (uncertainty_reason IS NULL OR uncertainty_reason IN
    ('pocas_evidencias', 'solo_con_ayuda', 'contradictoria', 'ruptura', 'retencion_vencida', 'banco_insuficiente')),
  last_evidence_at REAL,
  policy_id TEXT NOT NULL REFERENCES mastery_policies(id) ON DELETE RESTRICT,
  domain_version_id TEXT NOT NULL REFERENCES knowledge_domain_versions(id) ON DELETE RESTRICT,
  computed_through REAL NOT NULL,
  updated_at REAL NOT NULL,
  PRIMARY KEY (student_id, item_id)
);
--> statement-breakpoint
CREATE TRIGGER sks_no_sustituir BEFORE INSERT ON student_knowledge_state
WHEN EXISTS (SELECT 1 FROM student_knowledge_state WHERE student_id = NEW.student_id AND item_id = NEW.item_id)
BEGIN SELECT RAISE(ABORT, 'student_knowledge_state: no se sustituye una fila existente; se actualiza'); END;
--> statement-breakpoint
CREATE TRIGGER sks_identidad BEFORE UPDATE ON student_knowledge_state
WHEN NEW.student_id IS NOT OLD.student_id OR NEW.item_id IS NOT OLD.item_id
BEGIN SELECT RAISE(ABORT, 'student_knowledge_state: identidad inmutable'); END;
--> statement-breakpoint
CREATE TRIGGER sks_politica_insert BEFORE INSERT ON student_knowledge_state
WHEN (SELECT status FROM mastery_policies WHERE id = NEW.policy_id) IS NOT 'aprobada'
BEGIN SELECT RAISE(ABORT, 'student_knowledge_state: la política no está aprobada'); END;
--> statement-breakpoint
CREATE TRIGGER sks_politica_update BEFORE UPDATE OF policy_id ON student_knowledge_state
WHEN (SELECT status FROM mastery_policies WHERE id = NEW.policy_id) IS NOT 'aprobada'
BEGIN SELECT RAISE(ABORT, 'student_knowledge_state: la política no está aprobada'); END;
