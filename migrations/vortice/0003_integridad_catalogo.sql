-- Corrección de integridad del catálogo (H2), autorizada por la dirección tras la incidencia de
-- INSERT OR REPLACE. Migración ADITIVA: no modifica 0001 ni 0002 ni las tablas heredadas de módulos y
-- recursos. Se aplica con server/migrar.ts (prueba D4): los triggers no pasan por drizzle-kit.
--
-- Qué ocurría. INSERT OR REPLACE borra la fila en conflicto sin disparar los triggers de DELETE
-- (recursive_triggers está apagado por omisión) y tampoco pasa por los de UPDATE; los triggers de
-- INSERT de 0001 solo miran el estado de la fila NUEVA. Resultado, reproducido en bases desechables:
--   - una arista de una versión publicada o validada se movía a un borrador y la versión perdía la arista;
--   - una versión de dominio publicada (o validada) sin contenidos volvía a borrador;
--   - contenidos, dominios y OA sin dependientes cambiaban de dominio o de asignatura;
--   - una versión de dominio podía nacer ya publicada, sin pasar por la validación;
--   - la protección de las versiones de contenido y de dominio con contenidos dependía solo de las
--     claves foráneas (ON DELETE RESTRICT) y de que la conexión las tuviera activas.
-- Qué hace esta migración. Cada protección es un trigger de la propia base, sin depender de claves
-- foráneas ni de PRAGMA de conexión:
--   1. *_no_sustituir (BEFORE INSERT): se rechaza todo INSERT que choque con una fila existente por su
--      clave primaria o por su clave única. Cubre INSERT OR REPLACE, INSERT OR IGNORE y
--      ON CONFLICT DO UPDATE / DO NOTHING (RAISE(ABORT) también aborta con OR IGNORE).
--   2. kdv_nace_borrador: una versión de dominio nace en borrador, sin validador ni fecha de publicación.
--   3. UPDATE OR REPLACE: los triggers *_clave_unica / *_id_inmutable rechazan antes de que el motor
--      resuelva el conflicto borrando otra fila (identidad y claves únicas modificables).
-- Costo aceptado (como en 0002): las reinserciones idempotentes de filas existentes fallan; las semillas
-- e importaciones deben comprobar antes la existencia. Un duplicado falla con el mensaje del trigger y no
-- con el del UNIQUE, que se mantiene como declaración.
-- Alcance fuera de esta migración: learning_objectives y weekly_resources (heredadas) y los vínculos de
-- OA, módulo y recurso (ya protegidos por kio/kim/kir_bloqueo_insert; su fila solo tiene columnas de clave).

-- 1. No sustituir filas existentes.
CREATE TRIGGER kp_no_sustituir BEFORE INSERT ON knowledge_prerequisites
WHEN EXISTS (SELECT 1 FROM knowledge_prerequisites
             WHERE id = NEW.id OR (domain_version_id = NEW.domain_version_id AND item_id = NEW.item_id
                                   AND prerequisite_item_id = NEW.prerequisite_item_id))
BEGIN SELECT RAISE(ABORT, 'knowledge_prerequisites: no se sustituye una arista existente'); END;
--> statement-breakpoint
CREATE TRIGGER kdv_no_sustituir BEFORE INSERT ON knowledge_domain_versions
WHEN EXISTS (SELECT 1 FROM knowledge_domain_versions WHERE id = NEW.id OR (domain_id = NEW.domain_id AND version = NEW.version))
BEGIN SELECT RAISE(ABORT, 'knowledge_domain_versions: no se sustituye una versión existente'); END;
--> statement-breakpoint
CREATE TRIGGER ki_no_sustituir BEFORE INSERT ON knowledge_items
WHEN EXISTS (SELECT 1 FROM knowledge_items WHERE id = NEW.id OR (domain_id = NEW.domain_id AND code = NEW.code))
BEGIN SELECT RAISE(ABORT, 'knowledge_items: no se sustituye un contenido existente'); END;
--> statement-breakpoint
CREATE TRIGGER kd_no_sustituir BEFORE INSERT ON knowledge_domains
WHEN EXISTS (SELECT 1 FROM knowledge_domains WHERE id = NEW.id)
BEGIN SELECT RAISE(ABORT, 'knowledge_domains: no se sustituye un dominio existente'); END;
--> statement-breakpoint
CREATE TRIGGER co_no_sustituir BEFORE INSERT ON curriculum_objectives
WHEN EXISTS (SELECT 1 FROM curriculum_objectives
             WHERE id = NEW.id OR (level_subject_id = NEW.level_subject_id AND official_code = NEW.official_code
                                   AND source_year = NEW.source_year))
BEGIN SELECT RAISE(ABORT, 'curriculum_objectives: no se sustituye un OA existente'); END;
--> statement-breakpoint
CREATE TRIGGER kiv_no_sustituir BEFORE INSERT ON knowledge_item_versions
WHEN EXISTS (SELECT 1 FROM knowledge_item_versions WHERE id = NEW.id OR (domain_version_id = NEW.domain_version_id AND item_id = NEW.item_id))
BEGIN SELECT RAISE(ABORT, 'knowledge_item_versions: no se sustituye una versión de contenido existente'); END;
--> statement-breakpoint
-- 2. Una versión de dominio nace en borrador: la validación y la publicación son transiciones posteriores
-- (kdv_transicion, kdv_validar_requisitos, kdv_publicar_*), todas BEFORE UPDATE. Sin validador preinstalado.
CREATE TRIGGER kdv_nace_borrador BEFORE INSERT ON knowledge_domain_versions
WHEN NEW.status <> 'borrador' OR NEW.validated_by IS NOT NULL OR NEW.published_at IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'knowledge_domain_versions: una versión nace en borrador, sin validador ni publicación'); END;
--> statement-breakpoint
-- 3. UPDATE OR REPLACE: si la actualización colisiona con la clave única o la clave primaria de otra fila,
-- el motor la borraría sin disparar triggers de DELETE. Se rechaza antes.
-- Cobertura y dependencias: estos triggers (UPDATE OF <columnas>) cubren las columnas de clave que 0001 deja
-- modificables. Las demás columnas de clave las inmovilizan triggers de 0001: ki_identidad (id, dominio),
-- kd_identidad, kdv_transicion (id, dominio, número), kiv_bloqueo_update (id, contenido, versión, dominio) y
-- co_asignatura_fija. Si alguno se debilita, o se agrega una clave única nueva, hay que revisar esta lista.
-- kdv_una_publicada (índice único parcial) solo se alcanza por UPDATE OR REPLACE de `status`, que pasa por
-- kdv_transicion y kdv_publicar_linaje.
CREATE TRIGGER ki_codigo_unico BEFORE UPDATE OF code ON knowledge_items
WHEN EXISTS (SELECT 1 FROM knowledge_items WHERE domain_id = NEW.domain_id AND code = NEW.code AND id <> NEW.id)
BEGIN SELECT RAISE(ABORT, 'knowledge_items: el código ya existe en el dominio'); END;
--> statement-breakpoint
CREATE TRIGGER co_clave_unica BEFORE UPDATE OF official_code, source_year ON curriculum_objectives
WHEN EXISTS (SELECT 1 FROM curriculum_objectives
             WHERE level_subject_id = NEW.level_subject_id AND official_code = NEW.official_code
               AND source_year = NEW.source_year AND id <> NEW.id)
BEGIN SELECT RAISE(ABORT, 'curriculum_objectives: ya existe ese código oficial y año en la asignatura'); END;
--> statement-breakpoint
CREATE TRIGGER co_id_inmutable BEFORE UPDATE OF id ON curriculum_objectives
WHEN NEW.id <> OLD.id
BEGIN SELECT RAISE(ABORT, 'curriculum_objectives: identidad inmutable'); END;
--> statement-breakpoint
CREATE TRIGGER kp_clave_unica BEFORE UPDATE OF item_id, prerequisite_item_id ON knowledge_prerequisites
WHEN EXISTS (SELECT 1 FROM knowledge_prerequisites
             WHERE domain_version_id = NEW.domain_version_id AND item_id = NEW.item_id
               AND prerequisite_item_id = NEW.prerequisite_item_id AND id <> NEW.id)
BEGIN SELECT RAISE(ABORT, 'knowledge_prerequisites: esa arista ya existe en la versión'); END;
--> statement-breakpoint
CREATE TRIGGER kp_id_inmutable BEFORE UPDATE OF id ON knowledge_prerequisites
WHEN NEW.id <> OLD.id
BEGIN SELECT RAISE(ABORT, 'knowledge_prerequisites: identidad inmutable'); END;
