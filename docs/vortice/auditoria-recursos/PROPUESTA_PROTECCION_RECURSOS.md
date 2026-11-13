# Propuesta de protección de recursos heredados

**Estado:** diseño. No se implementó nada. Todo lo que sigue es **propuesta técnica**; ninguna regla es pedagógica ni está aprobada. Lo que se afirma como funcionamiento está respaldado por `PRUEBAS_RECURSOS_HEREDADOS.md`; lo demás se marca como no ejecutado.

## 1. Problema

`PATCH /api/admin/resources/:id` pasa `req.body` a `.set()` sin validar (A01, A17). Al mover un recurso a otro módulo cambia su asignatura derivada, deja incoherente un vínculo publicado de H2 (R01) y bloquea crear la versión siguiente del dominio (F01). La raíz es doble: (1) la **identidad curricular** (módulo, asignatura) se edita por la misma vía que los metadatos y (2) **nada comprueba la invariante después de crear el vínculo**. Además `drive/sync` borra antes de leer (C01), y valores fuera de las listas cerradas se guardan (A12, A13, A16). Quitar `learningObjectiveId` del `PATCH` cerraría A01, pero no C01, E01, E03, ni la validación de tipos, ni la detección de lo ya inconsistente.

## 2. Alternativas

| Opción | Cierra | No cierra | Costo y riesgo |
|---|---|---|---|
| **A. Triggers en las tablas heredadas** (`learning_objectives`, `weekly_resources`) | Cualquier vía, incluido SQL directo (E01, E03, A01) | Tipos y listas (A12, A13, A16); `drive/sync` | Modifica tablas que gestiona `drizzle-kit`; la prueba D4 de E0 mostró que `db:push` las reconstruye y **borra sus triggers**. Depende del procedimiento de migraciones y de la verificación de deriva. Una migración que añade triggers a tablas heredadas |
| **B. Lista blanca y validación en la ruta** | A01, A02, A17, A12, A13, A16 por la vía de la aplicación | SQL directo (E01, E03), `drive/sync`, lo ya inconsistente | Bajo: un esquema como el de `pedagogical-step`. Cambia el comportamiento de una ruta sin consumidor conocido |
| **C. Reconciliación (solo lectura)** | **Detecta** R01 y cualquier vía, también histórica | No impide nada | Aditiva, sin tocar tablas; no previene |
| **B + C** (recomendada) | Prevención por la única vía de la aplicación y detección de lo demás | SQL directo no bloqueado | Bajo |
| B + C + A | Todo lo anterior | — | A añade el riesgo de `db:push`; ver §9 |

## 3. Arquitectura recomendada: B + C, y A solo si dirección quiere que lo garantice la base

1. **B.** `PATCH /api/admin/resources/:id` valida el cuerpo con un esquema `.strict()` propio y rechaza lo que no sea metadato. La identidad curricular no se edita aquí.
2. **Movimiento de módulo como operación aparte** (solo si dirección la quiere): `POST /api/admin/resources/:id/move` con comprobaciones de relación (§5) y en una transacción.
3. **`drive/sync` atómico:** leer Drive antes de borrar, y hacer borrado y creación en una sola transacción; ideal, actualizar por clave de origen en lugar de borrar y recrear (conserva ids).
4. **C.** Una consulta de reconciliación reproducible, ejecutada en el arranque en entornos no productivos, antes de validar o publicar una versión de dominio y en el monitoreo editorial (§7).
5. **Mensajes y códigos:** distinguir entrada inválida (400) de fallo (500) (§6).

## 4. Archivos y funciones que se modificarían (propuesta, sin tocar)

| Archivo | Cambio |
|---|---|
| `shared/schema.ts` | `updateWeeklyResourceSchema` (`.strict()`), junto a `updatePedagogicalStepSchema` |
| `server/routes.ts` (≈995) | `PATCH`: `safeParse`, 400 con el detalle; `updateResource` solo con campos permitidos. Nueva ruta `move` solo si se aprueba |
| `server/storage.ts` | `updateResource` acepta un tipo restringido (no `Partial<InsertWeeklyResource>`); `deleteResourcesByObjective` y la creación en `drive/sync` en una transacción |
| `server/routes.ts` (≈1080) | `drive/sync`: leer Drive primero |
| Nuevo `server/reconciliacionRecursos.ts` | La consulta de §7 como función de solo lectura |
| `script/` | Pruebas de §10 (nuevos archivos `*.check.ts`) |

Ninguna migración ni cambio de tablas en la opción B + C.

## 5. Lista blanca, campos prohibidos y reglas de relación

**Permitidos** (clases A y B de la matriz): `title`, `notebookLmUrl` (`https`, con lista de hosts si dirección la define), `barkleyFoundation`, `studentHelp`, `pedagogicalObjective`, `sortOrder` (entero), `isActive` (booleano), `resourceType` (`video | infografia | audio | presentacion | reflexion`). `pedagogicalStep` y `reflectionPrompts` **no** por esta ruta: ya tienen la suya validada.
**Prohibidos** (clases C y D): `id`, `learningObjectiveId`, `createdAt`, `updatedAt`, y cualquier clave desconocida (`.strict()` → 400, en lugar de ignorarla en silencio).
**Reglas de relación**, si se aprueba mover:
1. El módulo de destino existe.
2. Su `level_subject_id` es el del recurso (misma asignatura): **decisión de dirección** (A03 hoy se acepta).
3. El recurso no tiene vínculos de H2 con versiones validadas, publicadas o retiradas (si los tiene, no se mueve).
4. Si hay `tutoring_cases` con ese recurso, su `learning_objective_id` coincide con el destino, o se rechaza.

**Cambio de `resourceType` a/desde `reflexion`:** rechazar si el recurso tiene `reflection_responses` o `reflection_prompts` (propuesta; no probado).

## 6. Errores y códigos HTTP

| Caso | Código | Mensaje |
|---|---|---|
| Cuerpo con campos prohibidos o desconocidos | 400 | `Campos no permitidos: …` |
| Valor inválido (tipo, lista) | 400 | detalle del esquema |
| Recurso inexistente | 404 | (se mantiene) |
| Movimiento que cruza asignatura o rompe un vínculo publicado | 409 | `El recurso está vinculado a una versión publicada` / `Módulo de otra asignatura` |
| Sin sesión / sin rol | 401 / 403 | (se mantiene) |
| Fallo de base | 500 | (se mantiene, sin detalle) |

## 7. Reconciliación (Fase VII, diseño)

Solo lectura, determinista (orden por clave), reproducible y segura sobre una copia local. Salida: una fila por inconsistencia con **recurso o módulo, módulo, asignatura del módulo, objetivo o dominio relacionado, asignatura del dominio, tipo, severidad, posible origen y acción sugerida**. No repara nada.

| Tipo | Consulta (resumen) | Severidad | Posible origen | Acción sugerida | Probada |
|---|---|---|---|---|---|
| V-1 vínculo de recurso de otra asignatura | `knowledge_item_resources` ⋈ `weekly_resources` ⋈ `learning_objectives` ⋈ `knowledge_domains` donde `lo.level_subject_id IS NOT d.level_subject_id` | **Alta** si la versión está publicada o validada | `PATCH` o SQL directo | Revisión manual: devolver el recurso o crear la versión con otro vínculo | **Sí** (R01) |
| V-2 vínculo de módulo de otra asignatura | `knowledge_item_modules` ⋈ `learning_objectives` ⋈ dominio | Alta | SQL directo (no hay ruta) | Igual | Sí (misma consulta, rama módulo) |
| V-3 caso de tutoría con recurso y objetivo distintos | `tutoring_cases` donde `resource_id` no es nulo y `weekly_resources.learning_objective_id <> learning_objective_id` | Media | Mover el recurso | Corregir el objetivo del caso o el recurso | **No** (por lectura) |
| V-4 valores fuera de las listas | `resource_type` o `pedagogical_step` fuera de lista; columnas enteras con texto (`typeof`) | Media | `PATCH` sin validar | Normalizar | **No** |
| V-5 recursos con `reflection_prompts` y tipo distinto de `reflexion` | `weekly_resources` | Baja | `PATCH` | Revisión | **No** |

**Procedimiento posterior de reparación** (sujeto a autorización): una lista revisada por una persona; cada reparación en una transacción, con registro del valor anterior, y comprobando que la reconciliación posterior da cero filas. Ninguna reparación automática.

**Tratamiento de registros históricos:** los detectados no se modifican; se informan. Si dirección decide reparar, se hace por el procedimiento anterior.

## 8. Trazabilidad (regla R7)

Hoy solo existe `updated_at`. Propuesta (decisión de dirección): una tabla de cambios de relación (`resource_relation_changes`: recurso, módulo anterior y nuevo, quién, cuándo, motivo) **solo si** se aprueba la operación `move`. No se propone para el `PATCH` de metadatos.

## 9. Riesgos residuales

- B no protege frente a SQL directo (E01, E03) ni frente a código futuro que escriba en la tabla; C solo detecta.
- A protegería esas vías, pero los triggers sobre tablas de `drizzle-kit` se pierden con `db:push` (D4): requeriría la verificación de deriva sobre el esquema heredado, que hoy no la tiene.
- `drive/sync` recrea ids; mientras no actualice por clave de origen, cada sincronización invalida referencias.
- Las seis rutas de configuración con propagación directa de `req.body` siguen igual.
- No se conoce el estado de los datos reales: la reconciliación debe correrse sobre una copia antes de decidir reparaciones.
- Libsql embebido: no se extrapola a Turso.

## 10. Plan de pruebas de aceptación y de regresión (Fase VIII)

**Aceptación (deben fallar hoy y pasar después):** los casos A01, A02, A12, A13, A16, A17 (400 y fila sin cambios), A09 (campo desconocido → 400), C01 (con Drive caído, los recursos siguen), V-1 con la reconciliación en cero tras A01 rechazado.
**Regresión (deben pasar hoy y después):**

| Operación legítima | Prueba |
|---|---|
| Crear un recurso | `POST` válido → 200, fila creada |
| Editar título, descripción pedagógica (`pedagogicalObjective`), URL, textos | `PATCH` con campos permitidos → 200, solo esos cambian |
| Modificar el orden | `PATCH {sortOrder}` |
| Activar o desactivar | `PATCH {isActive}` |
| Consultar un recurso y los recursos de un módulo | `GET /api/objectives/:id/resources` sin cambios de formato |
| Mantener sus relaciones | tras cualquier `PATCH` permitido, `learning_objective_id` y los vínculos de H2 no cambian |
| Asignar paso pedagógico | la ruta `/pedagogical-step` sigue igual (D02) |
| Cargar recursos históricos | la reconciliación no modifica nada; los datos antiguos con valores fuera de lista se **informan** (V-4), no se rechazan al leer |
| Operaciones administrativas con sesión | 401/403 sin cambios (A20, G01) |
| Clientes existentes | `client/src` no llama a este `PATCH`; las rutas que sí usa (`drive/sync`, `create-modules`, `textbook`, `word-upload`) conservan su contrato |

**Consumidores.** Ninguno en el frontend para el `PATCH`; **no se asume que pueda eliminarse** (puede usarse desde fuera).

## 11. Plan de implementación (por separado, con autorización)

1. Esquema y ruta `PATCH` con lista blanca, con pruebas de A01–A22 y regresión.
2. Reconciliación de solo lectura y su prueba (R01, V-3 a V-5) sobre una copia.
3. `drive/sync` atómico.
4. (Opcional, dirección) operación `move` y registro de cambios.
5. (Opcional, dirección) triggers en tablas heredadas, con prueba D4 y verificación de deriva.

## 12. Decisiones que requieren dirección

| # | Decisión | Recomendación |
|---|---|---|
| 1 | ¿Se permite mover un recurso de módulo? Si sí, ¿solo dentro de la misma asignatura y si no está vinculado a una versión validada o publicada? | No por `PATCH`; operación aparte si hace falta |
| 2 | Lista cerrada de `resourceType` y de hosts de `notebookLmUrl` | Mantener las del código |
| 3 | `drive/sync`: ¿actualizar por clave de origen (conservar ids) o borrar y recrear? | Actualizar por clave |
| 4 | ¿Registro de cambios de relación? | Solo con `move` |
| 5 | ¿Triggers en tablas heredadas (opción A)? | No ahora; revisar tras la implementación de B + C |
| 6 | ¿Qué hacer con registros históricos inconsistentes? | Primero reconciliar sobre una copia |
| 7 | Las seis rutas de configuración con `req.body` directo | Auditoría aparte |
