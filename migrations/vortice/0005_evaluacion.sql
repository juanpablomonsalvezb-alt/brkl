-- P0-E (T32): evaluación — procesos, instancias, intentos y respuestas. Migración ADITIVA: no modifica
-- 0001–0004 ni las tablas heredadas. Se aplica con server/migrar.ts. Diseño: 04 §5.3 y §6 (f80ed1f),
-- con P21 v2 aprobada (1 normal + 1 extra en E2, perfil regular/neurodivergente, mejor porcentaje,
-- E2 sin nota 1–7). Lotes y excepciones siguen FUERA (P20-v, P18-v).
--
-- Qué viene de dónde:
--   04 §5.3: evaluación_versions, evaluation_version_releases, evaluation_version_questions,
--     evaluation_processes, evaluation_instances, evaluation_attempts, evaluation_attempt_answers,
--     progression_continuations.
--   P21 v2: attempt_kind ('normal','extra') con UNIQUE por instancia y tipo; perfil del estudiante
--     (regular/neurodivergente: 60 o 120 min, umbral 70 % o 50 %); porcentaje por intento sin
--     redondeo; E2 sin nota 1–7.
--   DECISIONES_DIRECCION: 70 % a todas (C16/Q1), sin redondeo (Q3), E2 = 15 preguntas (P16-2).
--
-- Tiempos: REAL (segundos UTC con fracción), como 0001–0004.
-- Patrón de 0002–0004 en CADA tabla: *_no_sustituir, solo inserción donde corresponda, identidad
-- inmutable, FK compuestas, CHECK, índices únicos/parciales, ON DELETE RESTRICT.
--
-- Decisiones pendientes anotadas en el informe T32:
--   - evaluation_function y release_policy de module_evaluations (P16): no se añaden columnas;
--     se deja como decisión pendiente.
--   - evaluation_progress histórico (P7): no se toca; la migración solo crea las nuevas tablas.

-- 1. Versiones de evaluación. Una versión por evaluación y número de versión. Inmutable tras validar.
CREATE TABLE evaluation_versions (
  id TEXT PRIMARY KEY,
  evaluation_id TEXT NOT NULL REFERENCES module_evaluations(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL CHECK (version >= 1),
  status TEXT NOT NULL CHECK (status IN ('borrador', 'validada', 'asignada', 'retirada')),
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  validated_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
  validated_at REAL,
  UNIQUE (evaluation_id, version),
  UNIQUE (id, evaluation_id),
  CHECK (validated_by IS NULL OR validated_by <> created_by),
  CHECK ((status = 'borrador') = (validated_by IS NULL AND validated_at IS NULL)),
  CHECK ((status IN ('validada', 'asignada', 'retirada')) = (validated_by IS NOT NULL AND validated_at IS NOT NULL))
);
--> statement-breakpoint
CREATE TRIGGER evv_no_sustituir BEFORE INSERT ON evaluation_versions
WHEN EXISTS (SELECT 1 FROM evaluation_versions WHERE id = NEW.id OR (evaluation_id = NEW.evaluation_id AND version = NEW.version))
BEGIN SELECT RAISE(ABORT, 'evaluation_versions: no se sustituye una versión existente'); END;
--> statement-breakpoint
CREATE TRIGGER evv_identidad BEFORE UPDATE ON evaluation_versions
WHEN NEW.id <> OLD.id OR NEW.evaluation_id <> OLD.evaluation_id OR NEW.version <> OLD.version OR NEW.created_by <> OLD.created_by
BEGIN SELECT RAISE(ABORT, 'evaluation_versions: identidad inmutable'); END;
--> statement-breakpoint
CREATE TRIGGER evv_transicion BEFORE UPDATE OF status ON evaluation_versions
WHEN NEW.status <> OLD.status AND NOT (
  (OLD.status = 'borrador' AND NEW.status = 'validada') OR
  (OLD.status = 'validada' AND NEW.status = 'asignada') OR
  (OLD.status IN ('borrador', 'validada', 'asignada') AND NEW.status = 'retirada')
)
BEGIN SELECT RAISE(ABORT, 'evaluation_versions: transición no permitida'); END;
--> statement-breakpoint
CREATE TRIGGER evv_validada_inmutable BEFORE UPDATE ON evaluation_versions
WHEN OLD.status IN ('validada', 'asignada', 'retirada') AND NOT (
  NEW.status <> OLD.status
)
BEGIN SELECT RAISE(ABORT, 'evaluation_versions: solo se cambia el estado tras validar'); END;
--> statement-breakpoint
CREATE TRIGGER evv_aprobar_exige_validador BEFORE UPDATE OF status ON evaluation_versions
WHEN NEW.status = 'validada' AND OLD.status <> 'validada'
BEGIN
  SELECT RAISE(ABORT, 'evaluation_versions: validar exige validador distinto del autor y fecha')
  WHERE NEW.validated_by IS NULL OR NEW.validated_at IS NULL;
END;
--> statement-breakpoint

-- 2. Liberación de versión (solo inserción). Significa «versión expuesta» (P19-E1, P18): alguna
-- instancia ya es publicable. Una fila por versión, sin deshacer.
CREATE TABLE evaluation_version_releases (
  evaluation_version_id TEXT PRIMARY KEY REFERENCES evaluation_versions(id) ON DELETE RESTRICT,
  released_at REAL NOT NULL,
  basis TEXT,
  declared_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
  verification_json TEXT
);
--> statement-breakpoint
CREATE TRIGGER evr_no_update BEFORE UPDATE ON evaluation_version_releases
BEGIN SELECT RAISE(ABORT, 'evaluation_version_releases es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER evr_no_delete BEFORE DELETE ON evaluation_version_releases
BEGIN SELECT RAISE(ABORT, 'evaluation_version_releases es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER evr_no_sustituir BEFORE INSERT ON evaluation_version_releases
WHEN EXISTS (SELECT 1 FROM evaluation_version_releases WHERE evaluation_version_id = NEW.evaluation_version_id)
BEGIN SELECT RAISE(ABORT, 'evaluation_version_releases: no se sustituye una liberación existente'); END;
--> statement-breakpoint
-- Una versión liberada no admite instancia nueva (04 §5.3).
CREATE TRIGGER evr_bloquea_instancia BEFORE INSERT ON evaluation_version_releases
WHEN EXISTS (SELECT 1 FROM evaluation_instances WHERE evaluation_version_id = NEW.evaluation_version_id)
BEGIN SELECT RAISE(ABORT, 'evaluation_version_releases: no se libera una versión con instancias'); END;
--> statement-breakpoint

-- 3. Preguntas de cada versión de evaluación. Bank debe ser 'evaluacion'.
CREATE TABLE evaluation_version_questions (
  evaluation_version_id TEXT NOT NULL,
  question_version_id TEXT NOT NULL,
  family_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  bank TEXT NOT NULL CHECK (bank = 'evaluacion'),
  position INTEGER NOT NULL CHECK (position >= 0),
  PRIMARY KEY (evaluation_version_id, question_version_id),
  FOREIGN KEY (evaluation_version_id) REFERENCES evaluation_versions(id) ON DELETE RESTRICT,
  FOREIGN KEY (question_version_id, family_id, item_id, bank)
    REFERENCES question_versions(id, family_id, item_id, bank) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE INDEX evq_posicion ON evaluation_version_questions (evaluation_version_id, position);
--> statement-breakpoint
CREATE TRIGGER evq_no_sustituir BEFORE INSERT ON evaluation_version_questions
WHEN EXISTS (SELECT 1 FROM evaluation_version_questions
             WHERE evaluation_version_id = NEW.evaluation_version_id AND question_version_id = NEW.question_version_id)
BEGIN SELECT RAISE(ABORT, 'evaluation_version_questions: no se sustituye una fila existente'); END;
--> statement-breakpoint
-- La posición debe ser única dentro de la versión.
CREATE UNIQUE INDEX evq_posicion_unica ON evaluation_version_questions (evaluation_version_id, position);
--> statement-breakpoint

-- 4. Proceso de evaluación por estudiante. Estado: máquina de estados.
CREATE TABLE evaluation_processes (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  evaluation_id TEXT NOT NULL REFERENCES module_evaluations(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('abierto', 'recuperacion_pendiente', 'recuperacion_abierta', 'aprobado', 'reprobado')),
  closed_at REAL,
  close_cause TEXT CHECK (close_cause IN ('aprobacion', 'agotamiento', 'vencimiento', 'reprobada_continua')),
  UNIQUE (student_id, evaluation_id),
  UNIQUE (id, student_id),
  CHECK ((status IN ('aprobado', 'reprobado')) = (closed_at IS NOT NULL AND close_cause IS NOT NULL)),
  CHECK ((status IN ('abierto', 'recuperacion_pendiente', 'recuperacion_abierta')) = (closed_at IS NULL AND close_cause IS NULL))
);
--> statement-breakpoint
CREATE TRIGGER ep_no_sustituir BEFORE INSERT ON evaluation_processes
WHEN EXISTS (SELECT 1 FROM evaluation_processes WHERE id = NEW.id OR (student_id = NEW.student_id AND evaluation_id = NEW.evaluation_id))
BEGIN SELECT RAISE(ABORT, 'evaluation_processes: no se sustituye un proceso existente'); END;
--> statement-breakpoint
CREATE TRIGGER ep_identidad BEFORE UPDATE ON evaluation_processes
WHEN NEW.id <> OLD.id OR NEW.student_id <> OLD.student_id OR NEW.evaluation_id <> OLD.evaluation_id
BEGIN SELECT RAISE(ABORT, 'evaluation_processes: identidad inmutable'); END;
--> statement-breakpoint
CREATE TRIGGER ep_transicion BEFORE UPDATE ON evaluation_processes
WHEN NEW.status <> OLD.status AND NOT (
  (OLD.status = 'abierto' AND NEW.status IN ('recuperacion_pendiente', 'aprobado', 'reprobado')) OR
  (OLD.status = 'recuperacion_pendiente' AND NEW.status IN ('recuperacion_abierta', 'aprobado', 'reprobado')) OR
  (OLD.status = 'recuperacion_abierta' AND NEW.status IN ('aprobado', 'reprobado'))
)
BEGIN SELECT RAISE(ABORT, 'evaluation_processes: transición no permitida'); END;
--> statement-breakpoint
CREATE TRIGGER ep_cierre_coherente BEFORE UPDATE ON evaluation_processes
WHEN NEW.status IN ('aprobado', 'reprobado') AND (NEW.closed_at IS NULL OR NEW.close_cause IS NULL)
BEGIN SELECT RAISE(ABORT, 'evaluation_processes: cerrar exige fecha y causa'); END;
--> statement-breakpoint
CREATE TRIGGER ep_no_reabrir BEFORE UPDATE ON evaluation_processes
WHEN OLD.status IN ('aprobado', 'reprobado')
BEGIN SELECT RAISE(ABORT, 'evaluation_processes: un proceso cerrado no se reabre'); END;
--> statement-breakpoint
CREATE TRIGGER ep_sin_delete BEFORE DELETE ON evaluation_processes
BEGIN SELECT RAISE(ABORT, 'evaluation_processes: no se borra'); END;
--> statement-breakpoint

-- 5. Instancia de evaluación dentro de un proceso. Estado: máquina de estados.
-- P21 v2: attempt_kind ('normal','extra') con UNIQUE por instancia y tipo.
CREATE TABLE evaluation_instances (
  id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  evaluation_version_id TEXT NOT NULL REFERENCES evaluation_versions(id) ON DELETE RESTRICT,
  phase TEXT NOT NULL CHECK (phase IN ('ordinaria', 'recuperacion')),
  window_end_at REAL NOT NULL,
  extension_ends_at REAL,
  review_at REAL,
  time_zone TEXT,
  max_attempts INTEGER NOT NULL CHECK (max_attempts >= 1),
  status TEXT NOT NULL CHECK (status IN ('disponible', 'en_curso') OR status IN ('cerrada_aprobada', 'cerrada_agotada', 'vencida')),
  close_cause TEXT CHECK (close_cause IN ('aprobacion', 'agotamiento', 'vencimiento')),
  -- P21 v2: perfil del estudiante para E2 (regular / neurodivergente).
  student_profile TEXT CHECK (student_profile IN ('regular', 'neurodivergente')),
  -- P21 v2: duración en minutos según perfil (60 regular, 120 neurodivergente).
  duration_minutes INTEGER CHECK (duration_minutes IN (60, 120)),
  -- P21 v2: umbral de aprobación según perfil (70 regular, 50 neurodivergente).
  passing_score INTEGER CHECK (passing_score IN (50, 70)),
  -- P21 v2: plazo máximo del intento extra en segundos (72 h = 259200 s).
  extra_deadline_at REAL,
  -- FK compuesta: (process_id, student_id) → proceso.
  FOREIGN KEY (process_id, student_id) REFERENCES evaluation_processes (id, student_id) ON DELETE RESTRICT,
  UNIQUE (id, student_id, evaluation_version_id),
  UNIQUE (id, student_id, evaluation_version_id, review_at),
  CHECK (status IN ('cerrada_aprobada', 'cerrada_agotada', 'vencida') = (close_cause IS NOT NULL)),
  -- Si hay extensión, debe ser posterior a la ventana.
  CHECK (extension_ends_at IS NULL OR extension_ends_at > window_end_at)
);
--> statement-breakpoint
CREATE TRIGGER ei_no_sustituir BEFORE INSERT ON evaluation_instances
WHEN EXISTS (SELECT 1 FROM evaluation_instances WHERE id = NEW.id)
BEGIN SELECT RAISE(ABORT, 'evaluation_instances: no se sustituye una instancia existente'); END;
--> statement-breakpoint
CREATE TRIGGER ei_identidad BEFORE UPDATE ON evaluation_instances
WHEN NEW.id <> OLD.id OR NEW.process_id <> OLD.process_id OR NEW.student_id <> OLD.student_id
  OR NEW.evaluation_version_id <> OLD.evaluation_version_id OR NEW.phase <> OLD.phase
  OR NEW.window_end_at <> OLD.window_end_at
BEGIN SELECT RAISE(ABORT, 'evaluation_instances: identidad inmutable'); END;
--> statement-breakpoint
CREATE TRIGGER ei_transicion BEFORE UPDATE ON evaluation_instances
  WHEN NEW.status <> OLD.status AND NOT (
  (OLD.status = 'disponible' AND (NEW.status = 'en_curso' OR NEW.status IN ('cerrada_aprobada', 'cerrada_agotada', 'vencida'))) OR
  (OLD.status = 'en_curso' AND (NEW.status = 'disponible' OR NEW.status IN ('cerrada_aprobada', 'cerrada_agotada', 'vencida')))
)
BEGIN SELECT RAISE(ABORT, 'evaluation_instances: transición no permitida'); END;
--> statement-breakpoint
CREATE TRIGGER ei_cierre_coherente BEFORE UPDATE ON evaluation_instances
WHEN NEW.status IN ('cerrada_aprobada', 'cerrada_agotada', 'vencida') AND (NEW.close_cause IS NULL)
BEGIN SELECT RAISE(ABORT, 'evaluation_instances: cerrar exige causa'); END;
--> statement-breakpoint
CREATE TRIGGER ei_no_reabrir BEFORE UPDATE ON evaluation_instances
WHEN OLD.status IN ('cerrada_aprobada', 'cerrada_agotada', 'vencida')
BEGIN SELECT RAISE(ABORT, 'evaluation_instances: una instancia cerrada no se reabre'); END;
--> statement-breakpoint
CREATE TRIGGER ei_sin_delete BEFORE DELETE ON evaluation_instances
BEGIN SELECT RAISE(ABORT, 'evaluation_instances: no se borra'); END;
--> statement-breakpoint
-- Una versión liberada no admite instancia nueva.
CREATE TRIGGER ei_version_liberada BEFORE INSERT ON evaluation_instances
WHEN EXISTS (SELECT 1 FROM evaluation_version_releases WHERE evaluation_version_id = NEW.evaluation_version_id)
BEGIN SELECT RAISE(ABORT, 'evaluation_instances: no se crea instancia sobre versión liberada'); END;
--> statement-breakpoint

-- 6. Intento dentro de una instancia. Estado: máquina de estados.
-- P21 v2: attempt_kind ('normal','extra') con UNIQUE por instancia y tipo (1 de cada).
CREATE TABLE evaluation_attempts (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  evaluation_version_id TEXT NOT NULL,
  review_at REAL,
  -- P21 v2: tipo de intento (normal o extra). Solo E2 usa 'extra'.
  attempt_kind TEXT NOT NULL CHECK (attempt_kind IN ('normal', 'extra')),
  attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
  status TEXT NOT NULL CHECK (status IN ('activo', 'enviado', 'expirado')),
  permutation_json TEXT,
  started_at REAL,
  expires_at REAL,
  submitted_at REAL,
  submission_id TEXT,
  -- P9: solo servidor.
  score_pct REAL,
  total_correct INTEGER CHECK (total_correct IS NULL OR total_correct >= 0),
  total_questions INTEGER CHECK (total_questions IS NULL OR total_questions >= 0),
  passed INTEGER CHECK (passed IN (0, 1)),
  -- [K]: origen de evidencia.
  evidence_source_type TEXT NOT NULL CHECK (evidence_source_type IN ('evaluacion_practica', 'evaluacion_cierre', 'recuperacion')),
  -- FK a instancia (PK). Las copias (student_id, evaluation_version_id, review_at) atan la evidencia.
  FOREIGN KEY (instance_id) REFERENCES evaluation_instances(id) ON DELETE RESTRICT,
  UNIQUE (instance_id, attempt_kind),
  UNIQUE (instance_id, attempt_number),
  UNIQUE (submission_id),
  UNIQUE (id, student_id, evaluation_version_id, evidence_source_type, review_at),
  -- score_pct sin redondeo (Q3): REAL, no INTEGER.
  CHECK (score_pct IS NULL OR score_pct >= 0 AND score_pct <= 100),
  -- Un intento enviado tiene resultado.
  CHECK ((status <> 'enviado') OR (submitted_at IS NOT NULL AND submission_id IS NOT NULL)),
  -- Un intento activo no tiene resultado.
  CHECK ((status = 'activo') OR (score_pct IS NULL AND passed IS NULL AND total_correct IS NULL AND total_questions IS NULL)
         OR (status = 'enviado'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX ea_una_activo ON evaluation_attempts (instance_id) WHERE status = 'activo';
--> statement-breakpoint
CREATE TRIGGER ea_no_sustituir BEFORE INSERT ON evaluation_attempts
WHEN EXISTS (SELECT 1 FROM evaluation_attempts
             WHERE id = NEW.id
             OR (instance_id = NEW.instance_id AND attempt_kind = NEW.attempt_kind)
             OR (instance_id = NEW.instance_id AND attempt_number = NEW.attempt_number)
             OR (NEW.submission_id IS NOT NULL AND submission_id = NEW.submission_id))
BEGIN SELECT RAISE(ABORT, 'evaluation_attempts: no se sustituye un intento existente'); END;
--> statement-breakpoint
CREATE TRIGGER ea_identidad BEFORE UPDATE ON evaluation_attempts
WHEN NEW.id <> OLD.id OR NEW.instance_id <> OLD.instance_id OR NEW.student_id <> OLD.student_id
  OR NEW.evaluation_version_id <> OLD.evaluation_version_id OR NEW.attempt_kind <> OLD.attempt_kind
  OR NEW.attempt_number <> OLD.attempt_number
BEGIN SELECT RAISE(ABORT, 'evaluation_attempts: identidad inmutable'); END;
--> statement-breakpoint
CREATE TRIGGER ea_enviado_inmutable BEFORE UPDATE ON evaluation_attempts
WHEN OLD.status = 'enviado'
BEGIN SELECT RAISE(ABORT, 'evaluation_attempts: un intento enviado no cambia'); END;
--> statement-breakpoint
CREATE TRIGGER ea_transicion BEFORE UPDATE OF status ON evaluation_attempts
WHEN NEW.status <> OLD.status AND NOT (
  (OLD.status = 'activo' AND NEW.status IN ('enviado', 'expirado'))
)
BEGIN SELECT RAISE(ABORT, 'evaluation_attempts: transición no permitida'); END;
--> statement-breakpoint
CREATE TRIGGER ea_sin_delete BEFORE DELETE ON evaluation_attempts
BEGIN SELECT RAISE(ABORT, 'evaluation_attempts: no se borra'); END;
--> statement-breakpoint

-- 7. Respuestas de un intento: solo inserción.
CREATE TABLE evaluation_attempt_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  evaluation_version_id TEXT NOT NULL,
  evidence_source_type TEXT NOT NULL,
  review_at REAL,
  question_version_id TEXT NOT NULL,
  family_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  bank TEXT NOT NULL,
  selected_option_id TEXT NOT NULL CHECK (length(trim(selected_option_id)) > 0),
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  answered_at REAL NOT NULL,
  sequence_no INTEGER NOT NULL CHECK (sequence_no >= 1),
  study_day TEXT NOT NULL CHECK (study_day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  -- FK a intento (PK). Las copias atan la evidencia.
  FOREIGN KEY (attempt_id) REFERENCES evaluation_attempts(id) ON DELETE RESTRICT,
  -- La pregunta debe integrar la versión de evaluación.
  FOREIGN KEY (evaluation_version_id, question_version_id)
    REFERENCES evaluation_version_questions (evaluation_version_id, question_version_id) ON DELETE RESTRICT,
  -- La pregunta debe existir en el banco.
  FOREIGN KEY (question_version_id, family_id, item_id, bank)
    REFERENCES question_versions (id, family_id, item_id, bank) ON DELETE RESTRICT,
  UNIQUE (attempt_id, question_version_id),
  UNIQUE (id, student_id, evaluation_version_id, attempt_id, question_version_id, family_id, item_id, is_correct, evidence_source_type, review_at)
);
--> statement-breakpoint
CREATE INDEX eaa_item ON evaluation_attempt_answers (student_id, item_id, sequence_no);
--> statement-breakpoint
CREATE TRIGGER eaa_no_update BEFORE UPDATE ON evaluation_attempt_answers
BEGIN SELECT RAISE(ABORT, 'evaluation_attempt_answers es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER eaa_no_delete BEFORE DELETE ON evaluation_attempt_answers
BEGIN SELECT RAISE(ABORT, 'evaluation_attempt_answers es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER eaa_no_sustituir BEFORE INSERT ON evaluation_attempt_answers
WHEN EXISTS (SELECT 1 FROM evaluation_attempt_answers
             WHERE id = NEW.id
             OR (attempt_id = NEW.attempt_id AND question_version_id = NEW.question_version_id))
BEGIN SELECT RAISE(ABORT, 'evaluation_attempt_answers: no se sustituye una respuesta existente'); END;
--> statement-breakpoint

-- 8. Continuación de progreso con E2 reprobada (P21 v2): solo inserción.
CREATE TABLE progression_continuations (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  process_id TEXT NOT NULL,
  from_module_id TEXT,
  pending_items_json TEXT,
  offered_resources_json TEXT,
  acknowledged_at REAL,
  UNIQUE (process_id),
  FOREIGN KEY (process_id, student_id) REFERENCES evaluation_processes (id, student_id) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TRIGGER pc_no_update BEFORE UPDATE ON progression_continuations
BEGIN SELECT RAISE(ABORT, 'progression_continuations es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER pc_no_delete BEFORE DELETE ON progression_continuations
BEGIN SELECT RAISE(ABORT, 'progression_continuations es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER pc_no_sustituir BEFORE INSERT ON progression_continuations
WHEN EXISTS (SELECT 1 FROM progression_continuations WHERE id = NEW.id OR process_id = NEW.process_id)
BEGIN SELECT RAISE(ABORT, 'progression_continuations: no se sustituye una continuación existente'); END;
--> statement-breakpoint
