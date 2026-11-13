# Auditoría del subsistema de recursos heredados

**Rama:** `vortice/auditoria-recursos`, desde `b67b9fa`. **Naturaleza:** investigación. No se modificó código, migraciones, tablas ni la aplicación. Bases locales desechables; sin Turso, Vercel ni credenciales.
**Evidencia:** `evidencia/` (inventario del esquema real, script y resultados de la batería). Pruebas: `PRUEBAS_RECURSOS_HEREDADOS.md`. Mapa: `MAPA_RELACIONES_RECURSOS.md`. Diseño: `PROPUESTA_PROTECCION_RECURSOS.md`.

## 1. Cartografía de tablas (Fase I)

Inventario generado del **esquema real** (drizzle heredado + migraciones `0001`–`0003`) con `PRAGMA`: `evidencia/inventario_esquema.txt` (30 tablas: columnas, claves foráneas con su acción, índices, triggers y claves entrantes). Resumen por origen:

| Origen | Tablas | Comentario |
|---|---|---|
| **Heredado** (`shared/schema.ts`, drizzle) | `levels`, `subjects`, `level_subjects`, `learning_objectives`, `weekly_resources` (el núcleo); `module_evaluations`, `evaluation_progress`, `review_items`, `student_progress`, `reflection_responses`, `learning_events`, `portfolio_evidences`, `weekly_completion`, `rubrics`, `tutoring_cases`, `brujula_weeks`, `textbook_configs`, `enrollments` (dependientes) | Todas con claves foráneas `NO ACTION`; **ningún trigger**, ningún `CHECK`, solo la clave primaria y pocos índices |
| **H2** (`0001`, `0003`) | `curriculum_objectives`, `knowledge_domains`, `knowledge_domain_versions`, `knowledge_items`, `knowledge_item_versions`, `knowledge_prerequisites`, `knowledge_item_oas`, `knowledge_item_modules`, `knowledge_item_resources` | Aquí están los triggers. Solo `knowledge_item_modules` y `knowledge_item_resources` tocan el subsistema heredado: referencian `learning_objectives` y `weekly_resources` con `ON DELETE RESTRICT` |
| **IMP-021** (`0002`) | `question_families`, `question_versions`, `question_voids` | No referencian módulos ni recursos; se citan por completitud |

**Qué usa la aplicación hoy.** El servidor escribe y lee `weekly_resources` y `learning_objectives` por `server/storage.ts`, `server/vortice.ts` y las rutas administrativas. **Las tablas de H2 no las usa ninguna ruta ni servicio de la aplicación** (solo `server/catalogo.ts`, que no está conectado a rutas): el catálogo de conocimiento es, por ahora, una capa lateral cuya única conexión con el subsistema heredado son los dos vínculos. El modelo curricular real de la aplicación es: `levels` × `subjects` → `level_subjects` → módulos (`learning_objectives`, 15 por asignatura, con `week_number` que es en realidad el número de módulo) → recursos (`weekly_resources`).

**El esquema no representa el modelo curricular.** La asignatura de un recurso no está en su fila: se **deriva** (`weekly_resources.learning_objective_id` → `learning_objectives.level_subject_id`). Cualquier cambio de módulo cambia la asignatura de forma implícita. Tampoco hay ninguna restricción que ate una fila dependiente a la asignatura de su módulo.

### 1.1 Tablas del núcleo (columnas e identidad)

| Tabla | Identidad | Clasificación curricular | Modificables | Debería ser inmutable tras publicar |
|---|---|---|---|---|
| `level_subjects` | `id` | `level_id`, `subject_id` | `total_oas`, `textbook_pdf_url`, `textbook_title` (por `PUT .../textbook`, validado) | `level_id`, `subject_id` |
| `learning_objectives` | `id` | `level_subject_id` (asignatura), `week_number` (número de módulo), `code` | `title`, `description`, páginas del libro, `module_oas`, `module_contents`, `module_date_range`, `word_doc_url` | **`level_subject_id`** mientras tenga vínculos de H2, recursos o dependientes |
| `weekly_resources` | `id` | `learning_objective_id` (módulo y, por derivación, asignatura), `resource_type`, `pedagogical_step` | título, URL, textos pedagógicos, orden, activo | **`id` y `learning_objective_id`** mientras haya vínculos o dependientes |

### 1.2 Dependientes de los recursos y de los módulos

| Dependiente | Referencia | Qué se rompe si el recurso o el módulo cambian de asignatura |
|---|---|---|
| `student_progress`, `reflection_responses` | `resource_id` | El progreso del estudiante pasa, sin que él haga nada, a contar en otro módulo (el cálculo de avance sale del módulo del recurso) *(por lectura; no ejecutado)* |
| `tutoring_cases` | `learning_objective_id` **y** `resource_id` | El caso queda con un objetivo y un recurso de módulos distintos (dos referencias sin restricción que las ate) *(por lectura; la consulta de reconciliación del §7 de la propuesta lo detecta)* |
| `module_evaluations`, `rubrics`, `portfolio_evidences`, `weekly_completion`, `brujula_weeks` | `learning_objective_id` | Dependen del módulo, no del recurso: **no** cambian al mover un recurso, sí al cambiar la asignatura del módulo |
| `knowledge_item_modules`, `knowledge_item_resources` (H2) | `learning_objective_id`, `resource_id` | **Vínculo incoherente con la versión publicada** y fallo al crear versiones nuevas (comprobado: F01) |
| `learning_events`, `enrollments` | `level_subject_id` | Dependen de la asignatura, no del recurso |

## 2. Rutas y funciones de escritura (Fase II)

Autorización: `app.use("/api/admin", isAdmin)` (`server/routes.ts:381`) cubre toda ruta `/api/admin/*`; comprobado (G01): `seed`, `create-modules` y `drive/sync`, aunque sus comentarios digan «temporary public», responden 401 sin sesión y 403 a un estudiante.

### 2.1 Rutas administrativas del subsistema (13)

| Endpoint | Método | Tabla | Campos modificables | Validación | Relaciones que puede cambiar | Riesgo | Prueba existente | Corrección recomendada |
|---|---|---|---|---|---|---|---|---|
| `/api/admin/levels` | POST | `levels` | los del esquema de inserción | `insertLevelSchema` | — | Bajo | No | — |
| `/api/admin/subjects` | POST | `subjects` | ídem | `insertSubjectSchema` | — | Bajo | No | — |
| `/api/admin/level-subjects` | POST | `level_subjects` | ídem | `insertLevelSubjectSchema` | crea la clasificación nivel × asignatura | Bajo | No | Comprobar duplicado (no hay índice único) |
| `/api/admin/objectives` | POST | `learning_objectives` | ídem | `insertLearningObjectiveSchema` | fija la asignatura del módulo al crearlo | Bajo | No | — |
| `/api/admin/level-subjects/:id/create-modules` | POST | `learning_objectives` | crea 15 módulos | existe/no hay módulos | — | Bajo | No | — |
| `/api/admin/resources` | POST | `weekly_resources` | todas salvo `id`, fechas | `insertWeeklyResourceSchema` (los enums de TypeScript **no** se aplican a la base) | módulo del recurso al crearlo | Medio | No | Verificar que el módulo exista (hoy lo hace la clave foránea, con error 500 genérico) |
| **`/api/admin/resources/:id`** | **PATCH** | `weekly_resources` | **todas las columnas** | **Ninguna** (`req.body` va a `.set()`) | **módulo y asignatura derivada**, `id`, tipo y paso | **Alto** | **No** | Lista blanca y validación (propuesta B) |
| `/api/admin/resources/:id/pedagogical-step` | PATCH | `weekly_resources` | `pedagogicalStep`, `reflectionPrompts` | `updatePedagogicalStepSchema` `.strict()` + tipo reflexión | — | Bajo | No | Es el modelo a imitar |
| `/api/admin/seed` | POST | `levels`, `subjects`, `level_subjects` | semilla | ninguna necesaria (idempotente por `seedBase`) | — | Bajo | Parcial (`seed-base.check`) | — |
| **`/api/admin/drive/sync`** | POST | `weekly_resources` | **borra** todos los recursos del módulo y los recrea con ids nuevos | solo `folderId` y `learningObjectiveId` presentes | recursos de un módulo; **ids nuevos** | **Alto** | No | Leer Drive **antes** de borrar, en una transacción; actualizar en lugar de borrar |
| `/api/admin/level-subjects/:id/word-upload` | POST | `learning_objectives` | `module_oas`, `module_contents`, `module_date_range` | archivo + análisis | texto del módulo | Bajo | Parcial | — |
| `/api/admin/level-subjects/:id/textbook` | PUT | `level_subjects` | URL y título del libro | `updateLevelSubjectTextbookSchema` | — | Bajo | No | — |
| `/api/admin/learning-objectives/:id/pages` | PUT | `learning_objectives` | páginas del libro | esquema + selección explícita | — | Bajo | No | — (D01 comprueba que un campo de identidad en el cuerpo se ignora) |

### 2.2 Funciones de escritura directas (`storage`, servicios, semillas)

`createLevel`, `createSubject`, `createLevelSubject`, `updateLevelSubjectTextbook`, `createLearningObjective`, `updateLearningObjectivePages`, `updateLearningObjectiveModuleInfo`, `createResource`, **`updateResource`** (pasa cualquier `Partial<InsertWeeklyResource>` a `.set()`), **`deleteResourcesByObjective`**, `setPedagogicalStep` (`server/vortice.ts`, validada), `seedBase`, `seedBasica` (semilla con verificación previa de duplicados).
Escritores de **tablas dependientes** (no cambian la clasificación de un recurso, pero la heredan): `server/vortice.ts` (progreso, reflexiones), `server/tutoria.ts`, `server/portafolio.ts`, `server/brujula.ts`, `server/rubricas.ts`, `server/matricula.ts`, `storage` (evaluaciones, matrículas, libros), `server/analitica.ts`, `server/evaluationHtmlMigration.ts`, `server/evaluationLinksRoutes.ts`.
Total examinado: **13 rutas, 12 funciones del subsistema y 10 módulos escritores de dependientes**. No hay otra ruta que modifique `learning_objectives.level_subject_id` ni `weekly_resources.learning_objective_id` salvo la `PATCH` (y `createResource`, al crear).

### 2.3 Patrón `req.body` → `.set()` / `.values()` en otras rutas

Además de `PATCH /api/admin/resources/:id`: `createPlanConfiguration`, `upsertSiteConfiguration`, `createAdultCycleConfiguration`, `createGeminiCopilot`, `createLevelPlanConfiguration` y `updateLevelPlanConfiguration` reciben `req.body` sin validar en la propia ruta (`server/routes.ts:2458, 2532, 2581, 2714, 2807, 2818`). **No son del subsistema curricular** y no se auditaron a fondo: se informan como la misma clase de riesgo (propagación directa), con su propia decisión. Ninguna toca recursos, módulos ni asignaturas.

### 2.4 Consumidores en el cliente

`client/src` llama a `/api/admin/drive/sync` y `/api/admin/level-subjects/:id/create-modules` (`DriveSync.tsx`), a `.../textbook` (`TextbookConfig.tsx`) y a `.../word-upload` (`CoursePlayer.tsx`). **Ninguna llama a `PATCH /api/admin/resources/:id`**: la ruta no tiene consumidor conocido en el cliente. Puede usarse desde fuera (scripts o herramientas administrativas), por lo que **no se asume que pueda eliminarse**.

## 3. Matriz de campos editables de `weekly_resources` (Fase III)

Columnas reales (`PRAGMA table_info`): 13. Clases: **A** editable directo, **B** editable con validación, **C** no editable por `PATCH`, **D** derivado.

| Campo | Tipo | Nulo | Defecto | Restricción real | Dependencias | Clase | Riesgo y consecuencia de una modificación incorrecta | Justificación |
|---|---|---|---|---|---|---|---|---|
| `id` | TEXT PK | no | UUID (aplicación) | clave primaria; referenciado por 4 tablas | `student_progress`, `reflection_responses`, `tutoring_cases`, `knowledge_item_resources` | **C** | Alto: rompe o desvincula progreso y vínculos (hoy lo frena la FK solo si hay hijos: A05, A06) | Identidad |
| `learning_objective_id` | TEXT | no | — | FK `NO ACTION` a `learning_objectives` | determina módulo y asignatura derivada | **C** (mover = operación aparte) | Alto: cruza asignatura; vínculo publicado incoherente; bloquea versiones nuevas (A01, F01) | Relación curricular |
| `resource_type` | TEXT | no | — | ninguna (lista solo en TypeScript) | `reflection_prompts` solo si `reflexion`; interfaz | **B** | Medio: valor fuera de la lista se guarda (A12) | Lista cerrada: `video, infografia, audio, presentacion, reflexion` |
| `title` | TEXT | no | — | NOT NULL | interfaz | **A** | Bajo | Metadato |
| `notebook_lm_url` | TEXT | sí | — | ninguna | reproductor | **B** | Medio: URL arbitraria (esquema, host) | Referencia externa: validar `https` y host |
| `barkley_foundation` | TEXT | sí | — | ninguna | interfaz | **A** | Bajo | Metadato |
| `student_help` | TEXT | sí | — | ninguna | interfaz | **A** | Bajo | Texto para el estudiante |
| `pedagogical_objective` | TEXT | sí | — | ninguna | interfaz | **A** | Bajo | Metadato |
| `pedagogical_step` | TEXT | sí | — | ninguna (lista en TypeScript) | secuencia pedagógica | **B** (o solo por su ruta) | Medio: valor fuera de la lista se guarda (A13) | `ejemplo, practica_guiada, practica_independiente, reflexion`; ya tiene ruta propia validada |
| `reflection_prompts` | TEXT (JSON) | sí | — | ninguna | solo recursos `reflexion` | **B** (o solo por su ruta) | Medio: JSON arbitrario o en recurso que no es de reflexión | `string[]` con límites; la ruta propia lo valida |
| `sort_order` | INTEGER | no | 0 | ninguna | orden de presentación | **B** | Bajo/medio: texto guardado en columna entera (A16) | Entero |
| `is_active` | INTEGER (bool) | sí | 1 | ninguna | visibilidad | **B** | Bajo/medio: texto guardado (A16) | Booleano |
| `created_at` | INTEGER | sí | ms de época | ninguna | auditoría | **C** | Bajo: el driver rechaza un valor no-fecha (A07, A08), pero un `Date` válido sí podría llegar de un llamador interno | Auditoría |
| `updated_at` | INTEGER | sí | ms de época | ninguna | auditoría | **D** | Ninguno hoy: lo escribe el servidor (`new Date()`) | Derivado |

No hay `moduleId` ni `subject_id` en la tabla: la asignatura es **derivada** de `learning_objective_id`.

## 4. Modelo de integridad curricular (Fase IV)

Reglas, su estado y origen. **Ninguna es una regla pedagógica aprobada**: son invariantes técnicos de consistencia; la columna «origen» lo distingue.

| # | Regla | Origen | ¿Implementada? | Dónde | ¿Eludible? | Protección mínima necesaria |
|---|---|---|---|---|---|---|
| R1 | Un vínculo de H2 con un recurso o módulo es de la misma asignatura y nivel que su dominio | **Aprobada** (diseño `02`/`04`, implementada en `0001`) | **Parcial**: solo al **crear** el vínculo y al validar y publicar la versión | Base (`kim/kir_misma_asignatura`, `kdv_validar/publicar_requisitos`) | **Sí**: cambiar el módulo del recurso después (A01) o la asignatura del módulo (E01) | Validación en la ruta que cambia la relación (B) y reconciliación (C) |
| R2 | Un recurso no queda asociado, directa o indirectamente, a dos asignaturas | Propuesta técnica nueva | No | — | Sí: `tutoring_cases` guarda objetivo y recurso por separado | C (reconciliación de `tutoring_cases`) |
| R3 | Un módulo o recurso vinculado a una versión publicada no cambia de relación por un `PATCH` | Propuesta técnica nueva (derivada de «lo publicado no se edita», `04` §4) | No | — | Sí (A01) | B |
| R4 | Modificar una relación no invalida en silencio una versión publicada | Propuesta técnica nueva | No | — | Sí (A01 → R01) | B y C |
| R5 | Crear una versión nueva del dominio no falla por inconsistencias introducidas por la administración | Propuesta técnica nueva | No | — | Sí: F01 | B (prevención), C (detección antes de publicar) |
| R6 | Una edición legítima de metadatos no altera la identidad curricular | Propuesta técnica nueva | **No**: el `PATCH` mezcla ambos | — | Sí (A17) | B (lista blanca) |
| R7 | Las operaciones dejan rastro de qué relación cambió y cuándo | Propuesta técnica nueva | **No**: solo `updated_at`, sin quién ni valor anterior | — | — | Registro de cambios de relación (decisión pendiente) |
| R8 | Una operación fallida no deja modificaciones parciales | Propuesta técnica nueva | **Parcial**: sentencias únicas sí (A22); `drive/sync` borra y luego falla (C01) | — | Sí (C01) | Orden y transacción en `drive/sync` |

## 5. Hallazgos

| # | Hallazgo | Gravedad | Reproducido |
|---|---|---|---|
| H-1 | `PATCH /api/admin/resources/:id` mueve un recurso, vinculado o no, a un módulo de **otra asignatura** | Alta | A01, A02, A17 |
| H-2 | Ese cambio deja la **versión publicada incoherente** sin que nada lo detecte, y **bloquea crear la versión siguiente del dominio** | Alta | F01, R01 |
| H-3 | El cuerpo no se valida: valores fuera de las listas cerradas y de tipo equivocado (texto en columnas enteras) se guardan | Media | A12, A13, A16 |
| H-4 | `POST /api/admin/drive/sync` **borra los recursos del módulo antes de leer Drive**: si Drive falla se pierden y no hay transacción; con recursos que tengan vínculos de H2, progreso, reflexiones o casos de tutoría el borrado lo frena la clave foránea y la sincronización falla entera (error 500); cuando no frena, recrea los recursos con **ids nuevos**, de modo que cualquier referencia futura apunta a otra fila | Alta | C01, C02 |
| H-5 | Sin triggers en el esquema heredado: `UPDATE` directo de la asignatura de un módulo, o `INSERT OR REPLACE` de un recurso sin vínculos, se aceptan | Media (exige SQL directo) | E01, E03 |
| H-6 | La invariante de asignatura se comprueba solo al crear el vínculo y al validar y publicar: **no hay comprobación posterior** | Alta | R01 |
| H-7 | `tutoring_cases` guarda módulo y recurso por separado sin restricción que los ate | Media | Por lectura (no ejecutado) |
| H-8 | La ruta no tiene consumidor conocido en el cliente ni pruebas | Informativo | Búsqueda y lectura |
| H-9 | Mismo patrón de propagación de `req.body` en seis rutas de configuración (fuera del subsistema) | Informativo | Por lectura |

Lo que **está protegido** (comprobado): cambiar el `id` de un recurso con dependientes (FK), nulos en columnas obligatorias, objetivo inexistente, fechas y tipos complejos (el driver), borrar un módulo con vínculos (FK), `REPLACE` de un recurso vinculado (FK), la autorización administrativa (401/403), y los vínculos de H2 frente a `INSERT OR REPLACE` (`0003`).
