-- Vórtice · Migración 0006: Reapertura administrativa auditable de E2 (D2 · M-R05).
-- Migración aditiva sobre 0005_evaluacion.sql:
--   - Crea la tabla de solo inserción `evaluation_reopenings` (máximo 1 reapertura por proceso).
--   - Actualiza los triggers `ep_transicion` y `ep_no_reabrir` en `evaluation_processes` para
--     permitir la transición `reprobado` -> `recuperacion_abierta` (y `abierto` -> `recuperacion_abierta`)
--     EXCLUSIVAMENTE cuando existe una fila de auditoría en `evaluation_reopenings` para ese proceso.
--   - Todo intento de UPDATE directo sobre un proceso cerrado sin fila en `evaluation_reopenings`
--     (o cualquier UPDATE sobre un proceso `aprobado`) sigue siendo abortado por SQLite.
--
-- declara: ep_transicion, ep_no_reabrir

CREATE TABLE evaluation_reopenings (
  id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL UNIQUE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  evaluation_id TEXT NOT NULL REFERENCES module_evaluations(id) ON DELETE RESTRICT,
  admin_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL CHECK (length(trim(reason)) >= 10),
  source_attempt_id TEXT REFERENCES evaluation_attempts(id) ON DELETE RESTRICT,
  new_instance_id TEXT NOT NULL UNIQUE REFERENCES evaluation_instances(id) ON DELETE RESTRICT,
  reopened_at REAL NOT NULL,
  FOREIGN KEY (process_id, student_id) REFERENCES evaluation_processes (id, student_id) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE INDEX idx_er_student_eval ON evaluation_reopenings (student_id, evaluation_id);
--> statement-breakpoint
CREATE TRIGGER er_no_sustituir BEFORE INSERT ON evaluation_reopenings
WHEN EXISTS (SELECT 1 FROM evaluation_reopenings WHERE id = NEW.id OR process_id = NEW.process_id OR new_instance_id = NEW.new_instance_id)
BEGIN SELECT RAISE(ABORT, 'evaluation_reopenings: solo se permite una reapertura por proceso'); END;
--> statement-breakpoint
CREATE TRIGGER er_no_update BEFORE UPDATE ON evaluation_reopenings
BEGIN SELECT RAISE(ABORT, 'evaluation_reopenings es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER er_no_delete BEFORE DELETE ON evaluation_reopenings
BEGIN SELECT RAISE(ABORT, 'evaluation_reopenings es solo inserción'); END;
--> statement-breakpoint
DROP TRIGGER ep_transicion;
--> statement-breakpoint
CREATE TRIGGER ep_transicion BEFORE UPDATE ON evaluation_processes
WHEN NEW.status <> OLD.status AND NOT (
  (OLD.status = 'abierto' AND NEW.status IN ('recuperacion_pendiente', 'aprobado', 'reprobado')) OR
  (OLD.status = 'abierto' AND NEW.status = 'recuperacion_abierta' AND EXISTS (SELECT 1 FROM evaluation_reopenings r WHERE r.process_id = OLD.id)) OR
  (OLD.status = 'recuperacion_pendiente' AND NEW.status IN ('recuperacion_abierta', 'aprobado', 'reprobado')) OR
  (OLD.status = 'recuperacion_abierta' AND NEW.status IN ('aprobado', 'reprobado')) OR
  (OLD.status = 'reprobado' AND NEW.status = 'recuperacion_abierta' AND EXISTS (SELECT 1 FROM evaluation_reopenings r WHERE r.process_id = OLD.id))
)
BEGIN SELECT RAISE(ABORT, 'evaluation_processes: transición no permitida'); END;
--> statement-breakpoint
DROP TRIGGER ep_no_reabrir;
--> statement-breakpoint
CREATE TRIGGER ep_no_reabrir BEFORE UPDATE ON evaluation_processes
WHEN OLD.status IN ('aprobado', 'reprobado') AND NOT (
  OLD.status = 'reprobado'
  AND NEW.status = 'recuperacion_abierta'
  AND NEW.closed_at IS NULL
  AND NEW.close_cause IS NULL
  AND EXISTS (SELECT 1 FROM evaluation_reopenings r WHERE r.process_id = OLD.id)
)
BEGIN SELECT RAISE(ABORT, 'evaluation_processes: un proceso cerrado no se reabre'); END;
