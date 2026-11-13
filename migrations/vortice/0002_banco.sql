-- IMP-021: banco de preguntas (familias y versiones) y anulación de preguntas.
-- Diseño: 04 §5.2, §4 y §5.5 y 03 §3–§5 (3e5c488, PROPUESTO), más las decisiones de la usuaria:
-- DB-0 B (siete protecciones), DB-4, DB-13 y Q-1 a Q-12 (matriz de IMP-021). Se aplica con
-- server/migrar.ts (prueba D4 de E0): los triggers no pasan por drizzle-kit.
--
-- Qué viene de dónde (no se convierte en regla de la especificación maestra):
--   COMUNICADA (dirección): K4 (la pregunta se asocia a un contenido: item_id NOT NULL con FK) y K13
--     (las preguntas de IA las revisa una persona).
--   PROPUESTO (03, 04): revisor distinto del autor en toda pregunta, aprobada inmutable, transiciones,
--     banco fijo por familia, anulación con solicitante y aprobador distintos.
--   DECISIÓN EDITORIAL aprobada expresamente: Q-1 a Q-12 (ver REGISTRO_IMP021_PREPARACION.md).
-- Diferencias con 04 §5.2 (a registrar): authored_by NOT NULL (cierra el hueco de NULL en
-- «reviewed_by <> authored_by»); retired_kind/reason/by/at (Q-5, Q-7); question_voids vive aquí y no con
-- la evidencia; las fechas son REAL como en 0001 (la unidad de tiempo, DB-5, sigue abierta); el máximo
-- de opciones y el patrón de los ids de opción NO se fijan (decisión abierta); content_hash es opcional.
-- Añadido por la revisión de código y ratificado por la dirección: el contenido tampoco se edita en
-- `en_revision` (lo que la persona revisa es lo que se aprueba) y se rechaza todo INSERT que choque con una
-- fila existente (INSERT OR REPLACE borra la fila en conflicto sin disparar los triggers de DELETE y no pasa
-- por los de UPDATE; el UPSERT sí dispara los de UPDATE y ya estaba cubierto).
-- Fuera de esta migración: respuestas, evidencia y evidence_voids (H3), uso del banco por evaluaciones (H4).

CREATE TABLE question_families (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE RESTRICT,
  bank TEXT NOT NULL CHECK (bank IN ('practica', 'evaluacion')),
  label TEXT,
  UNIQUE (id, item_id, bank)
);
--> statement-breakpoint
CREATE INDEX qf_item ON question_families (item_id);
--> statement-breakpoint
CREATE TABLE question_versions (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  bank TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 1),
  status TEXT NOT NULL CHECK (status IN ('borrador', 'en_revision', 'aprobada', 'retirada')),
  stem TEXT NOT NULL CHECK (length(trim(stem)) > 0),
  options_json TEXT NOT NULL,
  correct_option_id TEXT NOT NULL,
  explanation TEXT,
  origin TEXT NOT NULL CHECK (origin IN ('humano', 'ia')),
  ai_model TEXT,
  prompt_hash TEXT,
  content_hash TEXT,
  authored_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_at REAL,
  retired_kind TEXT CHECK (retired_kind IN ('renovacion', 'defecto', 'otro')),
  retired_reason TEXT,
  retired_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
  retired_at REAL,
  FOREIGN KEY (family_id, item_id, bank) REFERENCES question_families (id, item_id, bank) ON DELETE RESTRICT,
  UNIQUE (family_id, version),
  UNIQUE (id, family_id, item_id, bank),
  -- K13 y revisor ≠ autor. La comparación es segura frente a NULL (IS NOT) y authored_by es NOT NULL.
  CHECK (status NOT IN ('aprobada', 'retirada')
         OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND reviewed_by IS NOT authored_by)),
  CHECK (status NOT IN ('borrador', 'en_revision') OR (reviewed_by IS NULL AND reviewed_at IS NULL)),
  -- Procedencia (K13): la IA se registra aparte; el autor es siempre una persona.
  CHECK ((origin = 'humano' AND ai_model IS NULL AND prompt_hash IS NULL)
         OR (origin = 'ia' AND ai_model IS NOT NULL AND length(trim(ai_model)) > 0
             AND prompt_hash IS NOT NULL AND length(trim(prompt_hash)) > 0)),
  -- Q-5 y Q-7: el retiro lleva clasificación, motivo, responsable y fecha; las demás versiones, nada de eso.
  CHECK ((status = 'retirada'
          AND retired_kind IS NOT NULL AND retired_reason IS NOT NULL AND length(trim(retired_reason)) > 0
          AND retired_by IS NOT NULL AND retired_at IS NOT NULL)
         OR (status <> 'retirada'
             AND retired_kind IS NULL AND retired_reason IS NULL AND retired_by IS NULL AND retired_at IS NULL))
);
--> statement-breakpoint
-- Anulación de una pregunta (DB-13, Q-9, Q-12): solo de una versión aprobada o retirada, con motivo,
-- solicitante y aprobador distintos, y sin reversión. No toca la evidencia anterior ni la anula.
CREATE TABLE question_voids (
  id TEXT PRIMARY KEY,
  question_version_id TEXT NOT NULL UNIQUE REFERENCES question_versions(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  requested_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  at REAL NOT NULL,
  CHECK (requested_by <> approved_by)
);
--> statement-breakpoint
-- Protección (b): la familia pertenece a un contenido y a un banco para siempre (`label` sí se edita).
CREATE TRIGGER qf_identidad BEFORE UPDATE ON question_families
WHEN NEW.id <> OLD.id OR NEW.item_id <> OLD.item_id OR NEW.bank <> OLD.bank
BEGIN SELECT RAISE(ABORT, 'question_families: identidad inmutable'); END;
--> statement-breakpoint
CREATE TRIGGER qv_identidad BEFORE UPDATE ON question_versions
WHEN NEW.id <> OLD.id OR NEW.family_id <> OLD.family_id OR NEW.item_id <> OLD.item_id OR NEW.bank <> OLD.bank
  OR NEW.version <> OLD.version OR NEW.authored_by <> OLD.authored_by
BEGIN SELECT RAISE(ABORT, 'question_versions: identidad inmutable'); END;
--> statement-breakpoint
-- Protección (c), Q-4: una versión nace siempre en borrador y recorre las transiciones.
CREATE TRIGGER qv_nace_borrador BEFORE INSERT ON question_versions
WHEN NEW.status <> 'borrador'
BEGIN SELECT RAISE(ABORT, 'question_versions: una versión nace en borrador'); END;
--> statement-breakpoint
-- Protección (c), Q-3: borrador → en_revision → aprobada → retirada, y en_revision → borrador (rechazo).
CREATE TRIGGER qv_transicion BEFORE UPDATE OF status ON question_versions
WHEN NEW.status <> OLD.status AND NOT (
  (OLD.status = 'borrador' AND NEW.status = 'en_revision') OR
  (OLD.status = 'en_revision' AND NEW.status = 'borrador') OR
  (OLD.status = 'en_revision' AND NEW.status = 'aprobada') OR
  (OLD.status = 'aprobada' AND NEW.status = 'retirada')
)
BEGIN SELECT RAISE(ABORT, 'question_versions: transición no permitida'); END;
--> statement-breakpoint
-- Protección (a), Q-1: aprobada y retirada no se editan; toda corrección es una versión nueva. Lo único
-- que cambia es el estado y, al retirar, los campos del retiro.
CREATE TRIGGER qv_congelada BEFORE UPDATE ON question_versions
WHEN OLD.status IN ('aprobada', 'retirada') AND NOT (
  NEW.stem IS OLD.stem AND NEW.options_json IS OLD.options_json AND NEW.correct_option_id IS OLD.correct_option_id
  AND NEW.explanation IS OLD.explanation AND NEW.origin IS OLD.origin AND NEW.ai_model IS OLD.ai_model
  AND NEW.prompt_hash IS OLD.prompt_hash AND NEW.content_hash IS OLD.content_hash
  AND NEW.reviewed_by IS OLD.reviewed_by AND NEW.reviewed_at IS OLD.reviewed_at
  AND ((NEW.retired_kind IS OLD.retired_kind AND NEW.retired_reason IS OLD.retired_reason
        AND NEW.retired_by IS OLD.retired_by AND NEW.retired_at IS OLD.retired_at)
       OR (OLD.status = 'aprobada' AND NEW.status = 'retirada'))
)
BEGIN SELECT RAISE(ABORT, 'question_versions: aprobada o retirada no es editable'); END;
--> statement-breakpoint
-- Lo que la persona revisa es lo que se aprueba: en revisión el contenido y la procedencia tampoco cambian
-- (ni en el mismo UPDATE que aprueba). Para corregir se vuelve a borrador (Q-3). Cierra el hueco de la
-- protección (a) en el paso en_revision → aprobada y que se reetiquete una pregunta de IA como humana.
CREATE TRIGGER qv_revision_congelada BEFORE UPDATE ON question_versions
WHEN OLD.status = 'en_revision' AND NOT (
  NEW.stem IS OLD.stem AND NEW.options_json IS OLD.options_json AND NEW.correct_option_id IS OLD.correct_option_id
  AND NEW.explanation IS OLD.explanation AND NEW.origin IS OLD.origin AND NEW.ai_model IS OLD.ai_model
  AND NEW.prompt_hash IS OLD.prompt_hash
)
BEGIN SELECT RAISE(ABORT, 'question_versions: en revisión no se edita; vuelva a borrador'); END;
--> statement-breakpoint
CREATE TRIGGER qv_sin_delete BEFORE DELETE ON question_versions
WHEN OLD.status <> 'borrador'
BEGIN SELECT RAISE(ABORT, 'question_versions: solo se puede descartar un borrador'); END;
--> statement-breakpoint
-- INSERT OR REPLACE borra la fila en conflicto sin disparar los triggers de DELETE (recursive_triggers está
-- apagado por omisión) y tampoco pasa por los de UPDATE: una versión aprobada se cambiaría por otra y la
-- identidad de una familia o de un borrador se eludiría. Se rechaza todo INSERT que choque con una fila
-- existente. Un UPSERT (ON CONFLICT DO UPDATE) sí dispara los triggers de UPDATE y ya estaba cubierto por
-- qv_congelada y qf_identidad: aquí su rechazo es defensa en profundidad. Un duplicado cualquiera falla en
-- este trigger o en el UNIQUE, que se mantiene como declaración.
CREATE TRIGGER qv_no_sustituir BEFORE INSERT ON question_versions
WHEN EXISTS (SELECT 1 FROM question_versions WHERE id = NEW.id OR (family_id = NEW.family_id AND version = NEW.version))
BEGIN SELECT RAISE(ABORT, 'question_versions: no se sustituye una versión existente'); END;
--> statement-breakpoint
CREATE TRIGGER qf_no_sustituir BEFORE INSERT ON question_families
WHEN EXISTS (SELECT 1 FROM question_families WHERE id = NEW.id)
BEGIN SELECT RAISE(ABORT, 'question_families: no se sustituye una familia existente'); END;
--> statement-breakpoint
-- Protección (g), Q-11: para aprobar, el contenido de la familia debe estar en una versión de dominio
-- validada o publicada. K4 (comunicada) pide solo la asociación a un contenido; esto es decisión editorial.
-- Es una comprobación en el instante de aprobar: lo que se responde sobre contenido no publicado lo
-- controla la evidencia (H3).
CREATE TRIGGER qv_aprobar_contenido BEFORE UPDATE OF status ON question_versions
WHEN NEW.status = 'aprobada' AND OLD.status <> 'aprobada'
BEGIN
  SELECT RAISE(ABORT, 'question_versions: el contenido debe estar en una versión de dominio validada o publicada')
  WHERE NOT EXISTS (SELECT 1 FROM knowledge_item_versions v JOIN knowledge_domain_versions d ON d.id = v.domain_version_id
                    WHERE v.item_id = NEW.item_id AND d.status IN ('validada', 'publicada'));
END;
--> statement-breakpoint
-- Protección (f), Q-10: opciones en JSON de texto plano, con ids únicos, al menos dos opciones y la clave
-- correcta entre ellas. Sin máximo de opciones ni patrón de id (decisiones abiertas). Dos triggers con el
-- mismo cuerpo: SQLite no comparte el cuerpo entre INSERT y UPDATE.
CREATE TRIGGER qv_opciones_insert BEFORE INSERT ON question_versions
BEGIN
  SELECT RAISE(ABORT, 'question_versions: options_json no es un JSON válido') WHERE json_valid(NEW.options_json) = 0;
  SELECT RAISE(ABORT, 'question_versions: options_json debe ser un arreglo de al menos 2 opciones')
  WHERE json_type(NEW.options_json) <> 'array' OR json_array_length(NEW.options_json) < 2;
  SELECT RAISE(ABORT, 'question_versions: cada opción necesita id y texto no vacíos')
  WHERE EXISTS (SELECT 1 FROM json_each(NEW.options_json)
                WHERE type <> 'object' OR json_type(value, '$.id') <> 'text' OR length(trim(json_extract(value, '$.id'))) = 0
                   OR json_type(value, '$.texto') <> 'text' OR length(trim(json_extract(value, '$.texto'))) = 0);
  SELECT RAISE(ABORT, 'question_versions: ids de opción repetidos')
  WHERE (SELECT COUNT(DISTINCT json_extract(value, '$.id')) FROM json_each(NEW.options_json)) <> json_array_length(NEW.options_json);
  SELECT RAISE(ABORT, 'question_versions: correct_option_id no es una opción')
  WHERE NOT EXISTS (SELECT 1 FROM json_each(NEW.options_json) WHERE json_extract(value, '$.id') = NEW.correct_option_id);
END;
--> statement-breakpoint
CREATE TRIGGER qv_opciones_update BEFORE UPDATE OF options_json, correct_option_id ON question_versions
BEGIN
  SELECT RAISE(ABORT, 'question_versions: options_json no es un JSON válido') WHERE json_valid(NEW.options_json) = 0;
  SELECT RAISE(ABORT, 'question_versions: options_json debe ser un arreglo de al menos 2 opciones')
  WHERE json_type(NEW.options_json) <> 'array' OR json_array_length(NEW.options_json) < 2;
  SELECT RAISE(ABORT, 'question_versions: cada opción necesita id y texto no vacíos')
  WHERE EXISTS (SELECT 1 FROM json_each(NEW.options_json)
                WHERE type <> 'object' OR json_type(value, '$.id') <> 'text' OR length(trim(json_extract(value, '$.id'))) = 0
                   OR json_type(value, '$.texto') <> 'text' OR length(trim(json_extract(value, '$.texto'))) = 0);
  SELECT RAISE(ABORT, 'question_versions: ids de opción repetidos')
  WHERE (SELECT COUNT(DISTINCT json_extract(value, '$.id')) FROM json_each(NEW.options_json)) <> json_array_length(NEW.options_json);
  SELECT RAISE(ABORT, 'question_versions: correct_option_id no es una opción')
  WHERE NOT EXISTS (SELECT 1 FROM json_each(NEW.options_json) WHERE json_extract(value, '$.id') = NEW.correct_option_id);
END;
--> statement-breakpoint
-- Anulación (Q-9, Q-12): solo de una versión aprobada o retirada; solo inserción y sin reversión.
CREATE TRIGGER qvoid_requiere_vigente BEFORE INSERT ON question_voids
WHEN (SELECT status FROM question_versions WHERE id = NEW.question_version_id) NOT IN ('aprobada', 'retirada')
BEGIN SELECT RAISE(ABORT, 'question_voids: solo se anula una versión aprobada o retirada'); END;
--> statement-breakpoint
CREATE TRIGGER qvoid_sin_update BEFORE UPDATE ON question_voids
BEGIN SELECT RAISE(ABORT, 'question_voids es solo inserción'); END;
--> statement-breakpoint
CREATE TRIGGER qvoid_sin_delete BEFORE DELETE ON question_voids
BEGIN SELECT RAISE(ABORT, 'question_voids es solo inserción'); END;
--> statement-breakpoint
-- Lo mismo para la anulación: INSERT OR REPLACE no puede sustituir una existente (por id ni por pregunta).
CREATE TRIGGER qvoid_no_sustituir BEFORE INSERT ON question_voids
WHEN EXISTS (SELECT 1 FROM question_voids WHERE id = NEW.id OR question_version_id = NEW.question_version_id)
BEGIN SELECT RAISE(ABORT, 'question_voids es solo inserción'); END;
--> statement-breakpoint
-- DB-4: una familia está retirada si tiene al menos una versión y todas sus versiones están retiradas.
-- Se deriva; no hay estado propio en la familia. Una familia sin versiones no aparece (no hay grupo) y
-- una con algún borrador, en revisión o aprobada tampoco.
CREATE VIEW question_families_retiradas AS
SELECT family_id AS id FROM question_versions GROUP BY family_id
HAVING SUM(status <> 'retirada') = 0;
