-- H2 (IMP-020): catálogo de conocimiento y versionamiento. Diseño: 02 §1–§4 y 04 §4, §5.1, §8 (3e5c488).
-- Se aplica con server/migrar.ts (prueba D4 de E0): los triggers no pasan por drizzle-kit.
-- Diferencias con 04 §5.1 (registradas en REGISTRO_H2.md): knowledge_item_versions copia domain_id
-- para atar contenido y versión al mismo dominio por clave foránea compuesta; `confidence` queda como
-- texto porque el diseño no fija su escala; sin governance_audit, cuyas columnas el diseño no define.

CREATE TABLE curriculum_objectives (
  id TEXT PRIMARY KEY,
  level_subject_id TEXT NOT NULL REFERENCES level_subjects(id) ON DELETE RESTRICT,
  official_code TEXT NOT NULL,
  text TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_year INTEGER NOT NULL,
  verified_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
  verified_at REAL,
  UNIQUE (level_subject_id, official_code, source_year),
  CHECK ((verified_by IS NULL) = (verified_at IS NULL))
);
--> statement-breakpoint
CREATE TABLE knowledge_domains (
  id TEXT PRIMARY KEY,
  level_subject_id TEXT NOT NULL REFERENCES level_subjects(id) ON DELETE RESTRICT,
  name TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE knowledge_domain_versions (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL REFERENCES knowledge_domains(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL CHECK (version >= 1),
  status TEXT NOT NULL CHECK (status IN ('borrador', 'en_revision', 'validada', 'publicada', 'retirada')),
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  validated_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
  published_at REAL,
  UNIQUE (domain_id, version),
  UNIQUE (id, domain_id),
  CHECK (validated_by IS NULL OR validated_by <> created_by),
  CHECK (status IN ('borrador', 'en_revision') OR validated_by IS NOT NULL),
  CHECK ((status IN ('publicada', 'retirada')) = (published_at IS NOT NULL))
);
--> statement-breakpoint
-- Una sola versión publicada por dominio (04 §5.1).
CREATE UNIQUE INDEX kdv_una_publicada ON knowledge_domain_versions (domain_id) WHERE status = 'publicada';
--> statement-breakpoint
CREATE TABLE knowledge_items (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL REFERENCES knowledge_domains(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  UNIQUE (domain_id, code),
  UNIQUE (id, domain_id)
);
--> statement-breakpoint
CREATE TABLE knowledge_item_versions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  domain_version_id TEXT NOT NULL,
  domain_id TEXT NOT NULL,
  name TEXT NOT NULL,
  operational_definition TEXT NOT NULL,
  supersedes_version_id TEXT,
  evidence_continuity TEXT CHECK (evidence_continuity IN ('compatible', 'ruptura')),
  continuity_decided_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (item_id, domain_id) REFERENCES knowledge_items (id, domain_id) ON DELETE RESTRICT,
  FOREIGN KEY (domain_version_id, domain_id) REFERENCES knowledge_domain_versions (id, domain_id) ON DELETE RESTRICT,
  FOREIGN KEY (supersedes_version_id, item_id) REFERENCES knowledge_item_versions (id, item_id) ON DELETE RESTRICT,
  UNIQUE (domain_version_id, item_id),
  UNIQUE (id, item_id),
  UNIQUE (id, item_id, domain_version_id),
  CHECK (supersedes_version_id IS NULL OR supersedes_version_id <> id),
  CHECK (supersedes_version_id IS NOT NULL OR evidence_continuity IS NULL),
  CHECK ((evidence_continuity IS NULL) = (continuity_decided_by IS NULL))
);
--> statement-breakpoint
CREATE TABLE knowledge_prerequisites (
  id TEXT PRIMARY KEY,
  domain_version_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  prerequisite_item_id TEXT NOT NULL,
  relation TEXT NOT NULL CHECK (relation IN ('necesaria', 'contributiva', 'alternativa')),
  alt_group TEXT,
  justification TEXT NOT NULL,
  confidence TEXT NOT NULL,
  -- P-H2-2 (2026-11-12): una arista copiada a una versión nueva llega sin validar (NULL) y debe
  -- validarse de nuevo antes de validar la versión.
  validated_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
  validated_at REAL,
  -- Ambos extremos deben ser contenidos de ESTA versión del dominio (02 §4: sin referencias externas).
  FOREIGN KEY (domain_version_id, item_id) REFERENCES knowledge_item_versions (domain_version_id, item_id) ON DELETE RESTRICT,
  FOREIGN KEY (domain_version_id, prerequisite_item_id) REFERENCES knowledge_item_versions (domain_version_id, item_id) ON DELETE RESTRICT,
  UNIQUE (domain_version_id, item_id, prerequisite_item_id),
  CHECK (item_id <> prerequisite_item_id),
  CHECK ((relation = 'alternativa') = (alt_group IS NOT NULL)),
  CHECK ((validated_by IS NULL) = (validated_at IS NULL))
);
--> statement-breakpoint
CREATE TABLE knowledge_item_oas (
  item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE RESTRICT,
  curriculum_objective_id TEXT NOT NULL REFERENCES curriculum_objectives(id) ON DELETE RESTRICT,
  PRIMARY KEY (item_id, curriculum_objective_id)
);
--> statement-breakpoint
CREATE TABLE knowledge_item_modules (
  item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE RESTRICT,
  learning_objective_id TEXT NOT NULL REFERENCES learning_objectives(id) ON DELETE RESTRICT,
  PRIMARY KEY (item_id, learning_objective_id)
);
--> statement-breakpoint
CREATE TABLE knowledge_item_resources (
  item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE RESTRICT,
  resource_id TEXT NOT NULL REFERENCES weekly_resources(id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('explicacion', 'ejemplo', 'repaso')),
  PRIMARY KEY (item_id, resource_id, role)
);
--> statement-breakpoint
-- Ciclo de vida de la versión de dominio (02 §2): borrador → en_revision → validada → publicada →
-- retirada, y en_revision → borrador (observada, 08 §5). Nada más cambia de una fila.
CREATE TRIGGER kdv_transicion BEFORE UPDATE ON knowledge_domain_versions
WHEN NOT (
  NEW.id = OLD.id AND NEW.domain_id = OLD.domain_id AND NEW.version = OLD.version AND NEW.created_by = OLD.created_by AND (
    (OLD.status = 'borrador' AND NEW.status = 'en_revision' AND NEW.validated_by IS OLD.validated_by AND NEW.published_at IS OLD.published_at) OR
    (OLD.status = 'en_revision' AND NEW.status = 'borrador' AND NEW.validated_by IS NULL AND NEW.published_at IS NULL) OR
    (OLD.status = 'en_revision' AND NEW.status = 'validada' AND NEW.published_at IS NULL) OR
    (OLD.status = 'validada' AND NEW.status = 'en_revision' AND NEW.validated_by IS NULL AND NEW.published_at IS NULL) OR
    (OLD.status = 'validada' AND NEW.status = 'publicada' AND NEW.validated_by IS OLD.validated_by) OR
    (OLD.status = 'publicada' AND NEW.status = 'retirada' AND NEW.validated_by IS OLD.validated_by AND NEW.published_at IS OLD.published_at)
  )
)
BEGIN SELECT RAISE(ABORT, 'knowledge_domain_versions: transición no permitida'); END;
--> statement-breakpoint
CREATE TRIGGER kdv_sin_delete BEFORE DELETE ON knowledge_domain_versions
WHEN OLD.status <> 'borrador'
BEGIN SELECT RAISE(ABORT, 'knowledge_domain_versions: solo se puede descartar un borrador'); END;
--> statement-breakpoint
-- Al publicar: continuidad declarada por una persona en cada contenido con versión anterior (04 §8)
-- y al menos un OA por contenido (02 §3).
CREATE TRIGGER kdv_publicar_requisitos BEFORE UPDATE OF status ON knowledge_domain_versions
WHEN NEW.status = 'publicada' AND OLD.status = 'validada'
BEGIN
  -- La continuidad se exige al validar (kdv_validar_requisitos) y desde ahí el contenido queda bloqueado.
  -- El OA se revisa también aquí porque los vínculos cuelgan del contenido, no de la versión (P-H2-4).
  SELECT RAISE(ABORT, 'knowledge_domain_versions: contenido sin OA')
  WHERE EXISTS (SELECT 1 FROM knowledge_item_versions v WHERE v.domain_version_id = NEW.id
                AND NOT EXISTS (SELECT 1 FROM knowledge_item_oas o WHERE o.item_id = v.item_id));
END;
--> statement-breakpoint
-- Lo publicado no se edita (04 §4: «inmutable tras publicar»): contenidos y aristas de una versión
-- publicada o retirada no se agregan, cambian ni borran. Antes de publicar (incluida `validada`) sí.
CREATE TRIGGER kiv_bloqueo_insert BEFORE INSERT ON knowledge_item_versions
WHEN (SELECT status FROM knowledge_domain_versions WHERE id = NEW.domain_version_id) IN ('validada', 'publicada', 'retirada')
BEGIN SELECT RAISE(ABORT, 'knowledge_item_versions: la versión del dominio no es editable'); END;
--> statement-breakpoint
CREATE TRIGGER kiv_bloqueo_update BEFORE UPDATE ON knowledge_item_versions
WHEN (SELECT status FROM knowledge_domain_versions WHERE id = OLD.domain_version_id) IN ('validada', 'publicada', 'retirada')
  OR NEW.id <> OLD.id OR NEW.item_id <> OLD.item_id OR NEW.domain_version_id <> OLD.domain_version_id OR NEW.domain_id <> OLD.domain_id
BEGIN SELECT RAISE(ABORT, 'knowledge_item_versions: versión no editable o cambio de identidad'); END;
--> statement-breakpoint
CREATE TRIGGER kiv_bloqueo_delete BEFORE DELETE ON knowledge_item_versions
WHEN (SELECT status FROM knowledge_domain_versions WHERE id = OLD.domain_version_id) IN ('validada', 'publicada', 'retirada')
BEGIN SELECT RAISE(ABORT, 'knowledge_item_versions: la versión del dominio no es editable'); END;
--> statement-breakpoint
-- Linaje (04 §5.1 `supersedes_version_id`): solo se reemplaza una versión ya publicada (o retirada) de
-- una versión de dominio anterior. Mismo contenido: lo garantiza la clave foránea (supersedes, item).
CREATE TRIGGER kiv_linaje_insert BEFORE INSERT ON knowledge_item_versions
WHEN NEW.supersedes_version_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM knowledge_item_versions a
  JOIN knowledge_domain_versions da ON da.id = a.domain_version_id
  JOIN knowledge_domain_versions dn ON dn.id = NEW.domain_version_id
  WHERE a.id = NEW.supersedes_version_id AND da.status IN ('publicada', 'retirada') AND da.version < dn.version)
BEGIN SELECT RAISE(ABORT, 'knowledge_item_versions: solo reemplaza una versión publicada anterior'); END;
--> statement-breakpoint
CREATE TRIGGER kiv_linaje_update BEFORE UPDATE OF supersedes_version_id ON knowledge_item_versions
WHEN NEW.supersedes_version_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM knowledge_item_versions a
  JOIN knowledge_domain_versions da ON da.id = a.domain_version_id
  JOIN knowledge_domain_versions dn ON dn.id = NEW.domain_version_id
  WHERE a.id = NEW.supersedes_version_id AND da.status IN ('publicada', 'retirada') AND da.version < dn.version)
BEGIN SELECT RAISE(ABORT, 'knowledge_item_versions: solo reemplaza una versión publicada anterior'); END;
--> statement-breakpoint
CREATE TRIGGER kp_bloqueo_insert BEFORE INSERT ON knowledge_prerequisites
WHEN (SELECT status FROM knowledge_domain_versions WHERE id = NEW.domain_version_id) IN ('validada', 'publicada', 'retirada')
BEGIN SELECT RAISE(ABORT, 'knowledge_prerequisites: la versión del dominio no es editable'); END;
--> statement-breakpoint
CREATE TRIGGER kp_bloqueo_update BEFORE UPDATE ON knowledge_prerequisites
WHEN (SELECT status FROM knowledge_domain_versions WHERE id = OLD.domain_version_id) IN ('validada', 'publicada', 'retirada')
  OR NEW.domain_version_id <> OLD.domain_version_id
BEGIN SELECT RAISE(ABORT, 'knowledge_prerequisites: la versión del dominio no es editable'); END;
--> statement-breakpoint
CREATE TRIGGER kp_bloqueo_delete BEFORE DELETE ON knowledge_prerequisites
WHEN (SELECT status FROM knowledge_domain_versions WHERE id = OLD.domain_version_id) IN ('validada', 'publicada', 'retirada')
BEGIN SELECT RAISE(ABORT, 'knowledge_prerequisites: la versión del dominio no es editable'); END;
--> statement-breakpoint
-- Identidad estable (02 §2): el id y el dominio de un contenido no cambian; un dominio no cambia de asignatura.
CREATE TRIGGER ki_identidad BEFORE UPDATE ON knowledge_items
WHEN NEW.id <> OLD.id OR NEW.domain_id <> OLD.domain_id
BEGIN SELECT RAISE(ABORT, 'knowledge_items: identidad inmutable'); END;
--> statement-breakpoint
CREATE TRIGGER kd_identidad BEFORE UPDATE ON knowledge_domains
WHEN NEW.id <> OLD.id OR NEW.level_subject_id <> OLD.level_subject_id
BEGIN SELECT RAISE(ABORT, 'knowledge_domains: identidad inmutable'); END;
--> statement-breakpoint
-- Aislamiento: OA, módulo y recurso vinculados deben ser de la misma asignatura y nivel que el dominio.
CREATE TRIGGER kio_misma_asignatura BEFORE INSERT ON knowledge_item_oas
WHEN (SELECT d.level_subject_id FROM knowledge_items i JOIN knowledge_domains d ON d.id = i.domain_id WHERE i.id = NEW.item_id)
  IS NOT (SELECT level_subject_id FROM curriculum_objectives WHERE id = NEW.curriculum_objective_id)
BEGIN SELECT RAISE(ABORT, 'knowledge_item_oas: el OA es de otra asignatura o nivel'); END;
--> statement-breakpoint
CREATE TRIGGER kim_misma_asignatura BEFORE INSERT ON knowledge_item_modules
WHEN (SELECT d.level_subject_id FROM knowledge_items i JOIN knowledge_domains d ON d.id = i.domain_id WHERE i.id = NEW.item_id)
  IS NOT (SELECT level_subject_id FROM learning_objectives WHERE id = NEW.learning_objective_id)
BEGIN SELECT RAISE(ABORT, 'knowledge_item_modules: el módulo es de otra asignatura o nivel'); END;
--> statement-breakpoint
CREATE TRIGGER kir_misma_asignatura BEFORE INSERT ON knowledge_item_resources
WHEN (SELECT d.level_subject_id FROM knowledge_items i JOIN knowledge_domains d ON d.id = i.domain_id WHERE i.id = NEW.item_id)
  IS NOT (SELECT lo.level_subject_id FROM weekly_resources r JOIN learning_objectives lo ON lo.id = r.learning_objective_id WHERE r.id = NEW.resource_id)
BEGIN SELECT RAISE(ABORT, 'knowledge_item_resources: el recurso es de otra asignatura o nivel'); END;
--> statement-breakpoint
-- Linaje coherente al publicar (revisión de código H2): la versión que se publica debe ser posterior
-- a la última publicada (vigente o ya retirada en el mismo lote) y construirse sobre ella: cada
-- contenido que existía en esa base la reemplaza, y nada reemplaza a otra versión.
CREATE TRIGGER kdv_publicar_linaje BEFORE UPDATE OF status ON knowledge_domain_versions
WHEN NEW.status = 'publicada' AND OLD.status = 'validada'
BEGIN
  SELECT RAISE(ABORT, 'knowledge_domain_versions: hay una versión publicada igual o posterior')
  WHERE EXISTS (SELECT 1 FROM knowledge_domain_versions p WHERE p.domain_id = NEW.domain_id AND p.id <> NEW.id
                AND p.status IN ('publicada', 'retirada') AND p.version >= NEW.version);
  SELECT RAISE(ABORT, 'knowledge_domain_versions: un contenido no reemplaza a su versión en la última publicada')
  WHERE EXISTS (
    SELECT 1 FROM knowledge_item_versions v
    LEFT JOIN knowledge_item_versions a ON a.id = v.supersedes_version_id
    LEFT JOIN knowledge_item_versions enBase ON enBase.item_id = v.item_id AND enBase.domain_version_id = (
      SELECT p.id FROM knowledge_domain_versions p WHERE p.domain_id = NEW.domain_id AND p.id <> NEW.id
        AND p.status IN ('publicada', 'retirada') ORDER BY p.version DESC LIMIT 1)
    WHERE v.domain_version_id = NEW.id
      AND ((enBase.id IS NULL AND v.supersedes_version_id IS NOT NULL) OR (enBase.id IS NOT NULL AND v.supersedes_version_id IS NOT enBase.id)));
END;
--> statement-breakpoint
-- Cambiar el reemplazado anula una continuidad declarada contra otro: hay que volver a declararla.
CREATE TRIGGER kiv_continuidad_vigente BEFORE UPDATE OF supersedes_version_id ON knowledge_item_versions
WHEN NEW.supersedes_version_id IS NOT OLD.supersedes_version_id AND NEW.evidence_continuity IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'knowledge_item_versions: al cambiar el reemplazado, la continuidad debe declararse de nuevo'); END;
--> statement-breakpoint
-- Vínculos: no se reescriben (se borran y se crean, y la creación pasa por el control de asignatura).
CREATE TRIGGER kio_sin_update BEFORE UPDATE ON knowledge_item_oas BEGIN SELECT RAISE(ABORT, 'knowledge_item_oas: no se modifica; se borra y se crea'); END;
--> statement-breakpoint
CREATE TRIGGER kim_sin_update BEFORE UPDATE ON knowledge_item_modules BEGIN SELECT RAISE(ABORT, 'knowledge_item_modules: no se modifica; se borra y se crea'); END;
--> statement-breakpoint
CREATE TRIGGER kir_sin_update BEFORE UPDATE ON knowledge_item_resources BEGIN SELECT RAISE(ABORT, 'knowledge_item_resources: no se modifica; se borra y se crea'); END;
--> statement-breakpoint
CREATE TRIGGER co_asignatura_fija BEFORE UPDATE OF level_subject_id ON curriculum_objectives
WHEN NEW.level_subject_id IS NOT OLD.level_subject_id
BEGIN SELECT RAISE(ABORT, 'curriculum_objectives: la asignatura no cambia'); END;
--> statement-breakpoint
-- 02 §3: todo contenido publicado tiene al menos un OA; no se le puede quitar el último.
CREATE TRIGGER kio_ultimo_oa_publicado BEFORE DELETE ON knowledge_item_oas
WHEN EXISTS (SELECT 1 FROM knowledge_item_versions v JOIN knowledge_domain_versions d ON d.id = v.domain_version_id
             WHERE v.item_id = OLD.item_id AND d.status = 'publicada')
  AND (SELECT COUNT(*) FROM knowledge_item_oas WHERE item_id = OLD.item_id) = 1
BEGIN SELECT RAISE(ABORT, 'knowledge_item_oas: un contenido publicado necesita al menos un OA'); END;
--> statement-breakpoint
-- P-H2-1 y P-H2-2 (2026-11-12): la validación corresponde exactamente a lo que se publica. Desde
-- `validada` el contenido queda bloqueado (kiv_*, kp_*); para cambiarlo se vuelve a `en_revision`, lo que
-- anula la validación (kdv_transicion). Al validar se exige que todo esté listo: continuidad declarada,
-- al menos un OA y todas las aristas validadas, incluidas las copiadas de la versión anterior.
CREATE TRIGGER kdv_validar_requisitos BEFORE UPDATE OF status ON knowledge_domain_versions
WHEN NEW.status = 'validada' AND OLD.status = 'en_revision'
BEGIN
  SELECT RAISE(ABORT, 'knowledge_domain_versions: contenido con versión anterior sin continuidad declarada')
  WHERE EXISTS (SELECT 1 FROM knowledge_item_versions WHERE domain_version_id = NEW.id AND supersedes_version_id IS NOT NULL AND evidence_continuity IS NULL);
  SELECT RAISE(ABORT, 'knowledge_domain_versions: contenido sin OA')
  WHERE EXISTS (SELECT 1 FROM knowledge_item_versions v WHERE v.domain_version_id = NEW.id
                AND NOT EXISTS (SELECT 1 FROM knowledge_item_oas o WHERE o.item_id = v.item_id));
  SELECT RAISE(ABORT, 'knowledge_domain_versions: arista sin validar')
  WHERE EXISTS (SELECT 1 FROM knowledge_prerequisites WHERE domain_version_id = NEW.id AND validated_by IS NULL);
END;
--> statement-breakpoint
-- P-H2-2, cerrada con la revisión de código: ninguna arista nace validada. La validación es siempre un
-- acto aparte, de otra persona que la autora de la versión (08 §5: «validado por otra persona»).
CREATE TRIGGER kp_nace_sin_validar BEFORE INSERT ON knowledge_prerequisites
WHEN NEW.validated_by IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'knowledge_prerequisites: una arista se crea sin validar y se valida aparte'); END;
--> statement-breakpoint
CREATE TRIGGER kp_validador_distinto BEFORE UPDATE OF validated_by ON knowledge_prerequisites
WHEN NEW.validated_by IS NOT NULL
  AND NEW.validated_by = (SELECT created_by FROM knowledge_domain_versions WHERE id = NEW.domain_version_id)
BEGIN SELECT RAISE(ABORT, 'knowledge_prerequisites: la autora de la versión no valida sus aristas'); END;
--> statement-breakpoint
-- Si cambia la arista, su validación anterior ya no corresponde: debe anularse en el mismo cambio.
CREATE TRIGGER kp_cambio_anula_validacion BEFORE UPDATE ON knowledge_prerequisites
WHEN NEW.validated_by IS NOT NULL AND (SELECT status FROM knowledge_domain_versions WHERE id = OLD.domain_version_id) IN ('borrador', 'en_revision') AND (
  NEW.item_id IS NOT OLD.item_id OR NEW.prerequisite_item_id IS NOT OLD.prerequisite_item_id OR NEW.relation IS NOT OLD.relation
  OR NEW.alt_group IS NOT OLD.alt_group OR NEW.justification IS NOT OLD.justification OR NEW.confidence IS NOT OLD.confidence)
BEGIN SELECT RAISE(ABORT, 'knowledge_prerequisites: al modificar una arista su validación se anula'); END;
--> statement-breakpoint
-- Si cambia la definición de un contenido, las aristas que lo tocan en esa versión pierden su validación.
CREATE TRIGGER kiv_cambio_anula_aristas AFTER UPDATE OF name, operational_definition ON knowledge_item_versions
WHEN NEW.name IS NOT OLD.name OR NEW.operational_definition IS NOT OLD.operational_definition
BEGIN
  UPDATE knowledge_prerequisites SET validated_by = NULL, validated_at = NULL
  WHERE domain_version_id = NEW.domain_version_id AND (item_id = NEW.item_id OR prerequisite_item_id = NEW.item_id);
END;
