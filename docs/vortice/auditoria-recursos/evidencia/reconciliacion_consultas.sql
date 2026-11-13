-- Consultas de reconciliación de recursos heredados (SOLO LECTURA). Diseño; sin implementar en la aplicación.
-- Columnas: codigo, severidad, recurso_id, modulo_id, asignatura_modulo, referencia, asignatura_ref, detalle.
-- V-1: recurso vinculado a una versión de dominio cuya asignatura no coincide con la del módulo del recurso.
SELECT 'V-1' AS codigo,
       CASE WHEN dv.status IN ('validada','publicada','retirada') THEN 'alta' ELSE 'media' END AS severidad,
       l.resource_id AS recurso_id, w.learning_objective_id AS modulo_id, lo.level_subject_id AS asignatura_modulo,
       kd.id || '/v' || dv.version AS referencia, kd.level_subject_id AS asignatura_ref,
       'version ' || dv.status || '; contenido ' || iv.item_id AS detalle
FROM knowledge_item_resources l
JOIN knowledge_item_versions iv ON iv.id = l.item_version_id
JOIN knowledge_domain_versions dv ON dv.id = iv.domain_version_id
JOIN knowledge_domains kd ON kd.id = iv.domain_id
JOIN weekly_resources w ON w.id = l.resource_id
JOIN learning_objectives lo ON lo.id = w.learning_objective_id
WHERE lo.level_subject_id IS NOT kd.level_subject_id
UNION ALL
-- V-2: módulo vinculado a una versión de dominio de otra asignatura.
SELECT 'V-2',
       CASE WHEN dv.status IN ('validada','publicada','retirada') THEN 'alta' ELSE 'media' END,
       NULL, l.learning_objective_id, lo.level_subject_id,
       kd.id || '/v' || dv.version, kd.level_subject_id,
       'version ' || dv.status || '; contenido ' || iv.item_id
FROM knowledge_item_modules l
JOIN knowledge_item_versions iv ON iv.id = l.item_version_id
JOIN knowledge_domain_versions dv ON dv.id = iv.domain_version_id
JOIN knowledge_domains kd ON kd.id = iv.domain_id
JOIN learning_objectives lo ON lo.id = l.learning_objective_id
WHERE lo.level_subject_id IS NOT kd.level_subject_id
UNION ALL
-- V-3: caso de tutoría cuyo recurso pertenece a un módulo distinto del objetivo del caso.
SELECT 'V-3', 'media', c.resource_id, w.learning_objective_id, lo.level_subject_id,
       'caso ' || c.id, NULL, 'objetivo del caso ' || c.learning_objective_id || ' / módulo del recurso ' || w.learning_objective_id
FROM tutoring_cases c
JOIN weekly_resources w ON w.id = c.resource_id
JOIN learning_objectives lo ON lo.id = w.learning_objective_id
WHERE c.resource_id IS NOT NULL AND w.learning_objective_id <> c.learning_objective_id
UNION ALL
-- V-4: valores fuera de las listas cerradas o de tipo equivocado.
SELECT 'V-4', 'media', w.id, w.learning_objective_id, NULL, NULL, NULL, 'resource_type=' || w.resource_type
FROM weekly_resources w WHERE w.resource_type NOT IN ('video','infografia','audio','presentacion','reflexion')
UNION ALL
SELECT 'V-4', 'media', w.id, w.learning_objective_id, NULL, NULL, NULL, 'pedagogical_step=' || w.pedagogical_step
FROM weekly_resources w WHERE w.pedagogical_step IS NOT NULL AND w.pedagogical_step NOT IN ('ejemplo','practica_guiada','practica_independiente','reflexion')
UNION ALL
SELECT 'V-4', 'media', w.id, w.learning_objective_id, NULL, NULL, NULL, 'sort_order(' || typeof(w.sort_order) || ')=' || w.sort_order
FROM weekly_resources w WHERE typeof(w.sort_order) <> 'integer'
UNION ALL
SELECT 'V-4', 'media', w.id, w.learning_objective_id, NULL, NULL, NULL, 'is_active(' || typeof(w.is_active) || ')=' || w.is_active
FROM weekly_resources w WHERE w.is_active IS NOT NULL AND (typeof(w.is_active) <> 'integer' OR w.is_active NOT IN (0, 1))
UNION ALL
-- V-5: preguntas de reflexión en un recurso que no es de reflexión.
SELECT 'V-5', 'baja', w.id, w.learning_objective_id, NULL, NULL, NULL, 'tipo ' || w.resource_type || ' con reflection_prompts'
FROM weekly_resources w WHERE w.reflection_prompts IS NOT NULL AND w.resource_type <> 'reflexion'
ORDER BY 1, 3, 4, 8;
