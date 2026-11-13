# Cierre de decisiones y preparación de la implementación de recursos

**Estado:** diseño. **No autoriza implementación.** Cada hito requiere autorización expresa y separada. Base: commits `975579c` y `da3f203` (auditoría), rama `vortice/auditoria-recursos`. Nada de código de aplicación, migraciones ni tablas se modificó.

## 0. Integridad de la evidencia (sección D de la instrucción)

`git show --stat 975579c` (salida literal, 8 archivos, 1072 inserciones):

| Archivo (en `docs/vortice/auditoria-recursos/`) | Líneas |
|---|---|
| `AUDITORIA_RECURSOS_HEREDADOS.md` | 126 |
| `PROPUESTA_PROTECCION_RECURSOS.md` | 130 |
| `PRUEBAS_RECURSOS_HEREDADOS.md` | 72 |
| `REGISTRO_AUDITORIA_RECURSOS.md` | 42 |
| `evidencia/bateria_adversarial.ts.txt` | 110 |
| `evidencia/inventario_esquema.ts.txt` | 21 |
| `evidencia/inventario_esquema.txt` | 209 |
| `evidencia/resultados_bateria.json` | 362 |

**Aclaración de la diferencia.** Los ocho archivos del commit son **cuatro documentos y cuatro archivos de evidencia**. Los **cinco documentos** que informé son esos cuatro más `MAPA_RELACIONES_RECURSOS.md`, que **no estaba** en `975579c`: un comando fallido (`sed`) cortó la cadena que lo creaba, y mi resumen lo dio por entregado. Se agregó después, en `da3f203` (1 archivo, 50 líneas), solo documentación. «Cinco documentos más cuatro archivos de evidencia» = 9 archivos = 8 de `975579c` + 1 de `da3f203`. Mi informe de entrega afirmó erróneamente que los cinco estaban en el commit; el error fue mío y está corregido aquí.
Este cierre agrega, en un commit posterior, este documento y tres archivos de evidencia (consultas y pruebas de reconciliación y sus resultados). Árbol limpio antes de este trabajo (`git status`: 0 líneas); el estado final se informa al cierre.

**Corrección sobre V-2.** La auditoría anotó V-2 como «probada: misma consulta, rama módulo». **No era cierto:** la consulta ejecutada entonces (R01) solo ejercitó la rama de **recursos** (V-1); la rama de módulos nunca se ejecutó. V-2 se prueba ahora de forma independiente (§4), incluido un caso en versión borrador.

## 1. Decisiones de dirección (cerradas)

| # | Decisión |
|---|---|
| 1 | Se aprueba **B**: lista blanca estricta para `PATCH /api/admin/resources/:id` |
| 2 | Se aprueba **C**: reconciliación en modo exclusivamente de lectura |
| 3 | No se mueven recursos mediante `PATCH` |
| 4 | No se crea una operación `move` |
| 5 | Sin triggers en tablas heredadas en esta fase |
| 6 | Los registros históricos inconsistentes solo se identifican e informan, sin reparación automática |
| 7 | Las seis rutas de configuración quedan fuera |
| 8 | `pedagogicalStep` y `reflectionPrompts` siguen en sus rutas específicas |

## 2. Matriz definitiva de las 13 columnas (A)

Lista blanca (8): `title`, `notebookLmUrl`, `barkleyFoundation`, `studentHelp`, `pedagogicalObjective`, `sortOrder`, `isActive`, `resourceType`. Excluidos (6): `id`, `learningObjectiveId`, `createdAt`, `updatedAt`, `pedagogicalStep`, `reflectionPrompts`, y cualquier campo desconocido. **Esquema estricto: un campo no permitido rechaza toda la solicitud con 400, sin aplicar parcialmente los válidos.**

| Columna real | Nulo | ¿Lista blanca? | Validación en tiempo de ejecución | Fuente de la regla |
|---|---|---|---|---|
| `id` | no | **No** | clave prohibida → 400 | Dirección (identidad) |
| `learning_objective_id` (`learningObjectiveId`) | no | **No** | clave prohibida → 400 | Dirección (decisiones 3 y 4) |
| `resource_type` (`resourceType`) | no | **Sí** | `z.enum` con los valores de la columna: `video, infografia, audio, presentacion, reflexion` | Lista ya declarada en `shared/schema.ts` (columna con `enum`) |
| `title` | no | **Sí** | cadena, no nula (NOT NULL de la columna) | Esquema de inserción existente (`insertWeeklyResourceSchema`) |
| `notebook_lm_url` (`notebookLmUrl`) | sí | **Sí** | **solo tipo:** cadena o `null`. Sin lista de hosts ni esquema (paridad con la creación). Ver §2.1 | Dirección: no inventar controles; los existentes se documentan abajo |
| `barkley_foundation` | sí | **Sí** | cadena o `null` | Esquema existente |
| `student_help` | sí | **Sí** | cadena o `null` | Esquema existente |
| `pedagogical_objective` | sí | **Sí** | cadena o `null` | Esquema existente |
| `pedagogical_step` (`pedagogicalStep`) | sí | **No** | clave prohibida → 400; se cambia por `/:id/pedagogical-step` | Dirección (decisión 8) |
| `reflection_prompts` (`reflectionPrompts`) | sí | **No** | clave prohibida → 400; solo por `/:id/pedagogical-step` | Dirección (decisión 8) |
| `sort_order` (`sortOrder`) | no | **Sí** | entero (`z.number().int()`) | Columna `INTEGER NOT NULL` |
| `is_active` (`isActive`) | sí | **Sí** | booleano (`z.boolean()`) | Columna booleana |
| `created_at` (`createdAt`) | sí | **No** | clave prohibida → 400 | Dirección (auditoría) |
| `updated_at` (`updatedAt`) | sí | **No** | clave prohibida → 400; lo fija el servidor | Dirección (auditoría) |

### 2.1 Controles que realmente existen para `notebookLmUrl`

| Capa | Control encontrado | Evidencia |
|---|---|---|
| Base | Ninguno (`TEXT` nulo) | `inventario_esquema.txt` |
| Servidor, creación | `insertWeeklyResourceSchema` (`createInsertSchema`): cadena nula, **sin validar formato** | `shared/schema.ts:451` |
| Servidor, `PATCH` actual | Ninguno | `server/routes.ts:997` |
| Servidor, `drive/sync` | La URL se **construye** desde el id de Drive con anfitriones fijos (`docs.google.com`, `drive.google.com`) | `server/googleDrive.ts:119-133`, `server/routes.ts:1114` |
| Cliente | `convertToEmbedUrl` solo reescribe URLs de Drive y de Presentaciones; **cualquier otra se pasa tal cual a `<iframe src>`**. El respaldo de error concatena la URL en `innerHTML` (`'<iframe src="' + url + '"…'`) sin escapar | `client/src/pages/CoursePlayer.tsx:439-455, 1039-1044` |
| Políticas de cabeceras | No se encontró CSP, `helmet` ni `X-Frame-Options` en `server/` | búsqueda de texto |
| Precedentes de validación de URL en el proyecto, no aplicados a este campo | `httpsUrl` (solo `https`, máximo 2048) en `server/portafolio.ts:22`; `z.string().url()` en libro de texto (`shared/schema.ts:473`) | lectura |

**Cambios adicionales, propuestos por separado (no incluidos en el hito de B):**
- **N-1:** para `notebookLmUrl`, exigir `https` y máximo 2048 (reutilizando el precedente de `server/portafolio.ts`), en el `POST` y el `PATCH`. Cambia lo que hoy se acepta: requiere decisión.
- **N-2:** en el cliente, no concatenar la URL en `innerHTML` (escapar o crear el elemento por DOM). Es un hallazgo de seguridad menor porque el campo solo lo escribe un administrador; requiere un hito propio de cliente.

## 3. Diseño definitivo de B

**Esquema** (en `shared/schema.ts`, junto a `updatePedagogicalStepSchema`):

```ts
export const updateWeeklyResourceSchema = z.object({
  title: z.string(),
  notebookLmUrl: z.string().nullable(),
  barkleyFoundation: z.string().nullable(),
  studentHelp: z.string().nullable(),
  pedagogicalObjective: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  resourceType: z.enum(weeklyResources.resourceType.enumValues),
}).partial().strict();
```
`.strict()` rechaza toda clave desconocida o excluida; `.partial()` permite enviar solo algunos campos; los `null` solo son válidos donde la columna admite nulo.

**Ruta** (`PATCH /api/admin/resources/:id`, sigue bajo `isAdmin`):

1. `safeParse(req.body)`; si falla → **400** `{ message: "Datos inválidos", errors }` (como las demás rutas), **sin ejecutar ninguna escritura**.
2. Cuerpo válido pero sin ninguna clave → **400** (propuesta: hoy un cuerpo vacío «actualiza» solo `updatedAt`).
3. `storage.updateResource(id, datos)` con un tipo restringido a los ocho campos; una única sentencia `UPDATE … SET … , updatedAt` → atómica.
4. Sin fila → **404**; éxito → **200** con la fila.
5. Los errores de base siguen siendo **500** genéricos.

**Rechazo total, sin aplicación parcial:** la validación ocurre antes de cualquier escritura y es todo-o-nada; el caso A17 (campo válido + prohibido) debe terminar en 400 con la fila intacta.

**Regla pendiente de decisión (no incluida):** si se cambia `resourceType` desde o hacia `reflexion` en un recurso con `reflection_prompts` o con `reflection_responses`, se crearía una inconsistencia V-5. Propuesta: **409** en ese caso. No es una instrucción de dirección; requiere confirmación (D-3 del §9).

**Pruebas de aceptación de B** (nuevo `script/recursos-patch.check.ts`, mismo montaje que `acceso.check.ts`, con comprobación de que **ninguna tabla cambia** cuando se espera 400):

| Caso (de la batería) | Esperado |
|---|---|
| A01, A02, A03, A04 (`learningObjectiveId` de cualquier valor) | 400, sin cambios |
| A05, A06 (`id`) | 400, sin cambios |
| A07, A08 (`createdAt`, `updatedAt`) | 400, sin cambios |
| A09 (desconocido + válido) | **400, y el campo válido no se aplica** |
| A10 (`title:null`) | 400 |
| A12 (`resourceType` fuera de lista) | 400 |
| A13 (`pedagogicalStep`) y `reflectionPrompts` | 400 (se cambian por su ruta) |
| A14, A15, A16 (objeto, arreglo, texto en numérico/booleano) | 400 |
| A17 (válido + `learningObjectiveId`) | 400, sin cambios |
| A19 (cuerpo vacío) | 400 |
| A20 (sin sesión, estudiante) | 401, 403 |
| Regresión: cambiar título, URL, textos, orden, activo, tipo permitido | 200, solo esos campos cambian, `learning_objective_id` y los vínculos de H2 intactos |
| Ruta `/pedagogical-step` | igual que hoy (D02) |
| `POST /api/admin/resources` | igual que hoy |

## 4. Diseño y pruebas de C (reconciliación)

**Consultas definitivas:** `evidencia/reconciliacion_consultas.sql` (una sola sentencia `SELECT … UNION ALL … ORDER BY`, solo lectura, determinista por el orden explícito). Columnas: `codigo, severidad, recurso_id, modulo_id, asignatura_modulo, referencia, asignatura_ref, detalle`.

| Verificación | Qué detecta | Severidad |
|---|---|---|
| V-1 | Recurso vinculado a una versión de dominio de **otra asignatura** que la de su módulo | alta si la versión está validada, publicada o retirada; media si es borrador o en revisión |
| V-2 | **Módulo** vinculado a una versión de dominio de otra asignatura | ídem |
| V-3 | Caso de tutoría cuyo recurso pertenece a un módulo distinto del objetivo del caso | media |
| V-4 | `resource_type` o `pedagogical_step` fuera de lista; `sort_order` que no es entero; `is_active` que no es 0 o 1 | media |
| V-5 | `reflection_prompts` en un recurso que no es de reflexión | baja |

**Pruebas independientes** (`evidencia/pruebas_reconciliacion.ts.txt`, ejecutadas desde `script/` y luego retiradas; resultados en `evidencia/resultados_reconciliacion.txt`). Cada prueba, sobre bases desechables **copiadas de una plantilla correcta**:

1. **Sin falsos positivos:** el escenario correcto devuelve **0 filas** (incluye un recurso de reflexión legítimo con preguntas, casos de tutoría sin recurso, vínculos en versión borrador y publicada).
2. **Detección:** tras introducir la inconsistencia, aparecen exactamente las filas esperadas y **ninguna** de las otras verificaciones se activa (independencia).
3. **Sin modificaciones:** la huella de **todas** las tablas es idéntica antes y después de reconciliar.
4. **Determinismo:** dos ejecuciones sobre la misma base dan el mismo resultado, y una segunda base construida desde cero con las mismas inconsistencias da el mismo resultado (reproducibilidad).

| Prueba | Inconsistencia introducida | Resultado |
|---|---|---|
| V-1 | dos recursos vinculados movidos a otra asignatura (uno en versión publicada, otro en borrador) | 2 filas: `alta` (publicada) y `media` (borrador) |
| **V-2** | dos módulos vinculados cuya asignatura se cambia (uno en versión publicada, otro en borrador) | 2 filas: `alta` y `media` — **evidencia directa de V-2, que faltaba** |
| V-3 | el objetivo de un caso de tutoría se cambia | 1 fila `media` |
| V-4 | tipo fuera de lista, `sort_order` texto, `is_active` texto, paso fuera de lista | 4 filas |
| V-5 | preguntas de reflexión en un recurso de video | 1 fila `baja` |
| Combinada | una inconsistencia de cada tipo a la vez | 5 filas, una por tipo, sin interferencia |

Dos corridas consecutivas: salida 0 ambas y salidas idénticas. **Hallazgo durante la prueba:** mover un recurso que además tiene casos de tutoría activa a la vez V-1 y V-3 (efecto en cadena legítimo); las pruebas independientes usan recursos distintos para no mezclarlas.
**No corrige nada.** Los registros históricos solo se informan (decisión 6).
**Límite:** se probó sobre libSQL embebido y datos sintéticos; no se conoce el estado de los datos reales.

## 5. Drive: identificación de recursos importados (B de la instrucción)

### 5.1 Qué existe hoy (con referencias)

| Pregunta | Respuesta | Referencia |
|---|---|---|
| ¿Qué identifica a un recurso importado? | **Nada persistente.** La fila de `weekly_resources` guarda `title` (nombre del archivo), `notebookLmUrl` (URL de embebido), tipo y orden. **No hay columna de origen** | 13 columnas de `weekly_resources`: `inventario_esquema.txt`; `server/routes.ts:1110-1116` |
| ¿Existe el id de Drive en el código? | **Sí, en memoria:** `ModuleResource.id` es el id del archivo en Drive (`file.id`) | `server/googleDrive.ts:85-91, 187-195` |
| ¿Se conserva? | **No:** `drive/sync` descarta `resource.id` y guarda solo nombre y URL | `server/routes.ts:1110-1116` |
| ¿Se puede recuperar de la URL? | Para filas **creadas por la sincronización**, sí: `getEmbedUrl` construye siempre una URL que contiene `/d/<id>/` (cinco formas) | `server/googleDrive.ts:119-133` |
| ¿Es fiable la URL como clave? | **No, demostrado por el esquema y el código:** (1) `notebook_lm_url` no tiene índice único ni restricción; (2) la columna también la escriben `POST /api/admin/resources` y `PATCH` con texto libre (hoy sin validar); (3) hay varios recursos del mismo tipo por módulo y el cliente toma el primero de cada tipo (`CoursePlayer.tsx:201-203`); (4) el nombre de la columna sugiere URLs de NotebookLM anteriores a Drive |
| ¿Es seguro el título? | **No:** Drive admite nombres repetidos en una carpeta (comportamiento documentado de Drive, no verificado aquí) y el título se edita con `PATCH` |
| Otros datos relevantes | La lista de Drive pide `files.list` **sin `pageSize` ni `pageToken`**: con más de 100 archivos (límite por defecto de la API, documentación de Drive, no verificado aquí) la lectura sería **parcial sin aviso** | `server/googleDrive.ts:177-185` |

**Conclusión:** no existe una clave de origen persistente. Con el esquema actual **no se pueden actualizar recursos conservando sus ids** sin añadir una.

### 5.2 Alternativas

| Alternativa | Qué es | Conserva ids | Toca tablas heredadas | Riesgos |
|---|---|---|---|---|
| **D-A. Tabla de mapeo aditiva** `resource_sources` | Tabla nueva (migración): `resource_id` PK con FK a `weekly_resources` (`RESTRICT`), `provider` (`drive`), `source_id` (id del archivo), `source_folder_id`, `UNIQUE(provider, source_id, source_folder_id)` | **Sí** | **No** (solo una tabla nueva con FK, como los vínculos de H2) | Requiere migración nueva y relleno inicial de las filas existentes |
| D-B. Columna `source_key` en `weekly_resources` | Columna nula + índice único parcial | Sí | **Sí** (altera la tabla de `drizzle-kit`) | Contradice el criterio de no tocar tablas heredadas; `db:push` |
| D-C. Derivar el id de `notebookLmUrl` | Sin cambios de esquema | Solo para filas creadas por sync | No | **No recomendable:** la columna es editable y de texto libre; filas manuales o editadas se tratarían mal |
| D-D. Borrar y recrear, pero atómico | Sin clave de origen | **No** (ids nuevos) | No | Las claves foráneas hacen fallar la sincronización cuando hay progreso, reflexiones, tutoría o vínculos |

### 5.3 Alternativa técnicamente viable recomendada: D-A

**Relleno inicial** (a decidir, solo lectura previa): para cada recurso cuya `notebook_lm_url` coincida **exactamente** con una de las cinco formas construidas por `getEmbedUrl`, extraer el id y proponer el mapeo; las demás filas **no se mapean** y se informan. Un informe previo de solo lectura lista los candidatos, y no se aplica nada sin aprobación (decisión 6).

**Algoritmo de sincronización** (cumple los requisitos de dirección):

1. **Leer Drive completo primero**, con paginación hasta agotar `nextPageToken`. Cualquier error, o una lista que no se pueda declarar completa, **termina sin tocar la base**.
2. Leer el estado actual del módulo (recursos y mapeos).
3. Calcular el plan en memoria: para cada archivo de Drive, si existe el mapeo → **actualizar** título, URL, tipo y orden **conservando el id**; si no → crear fila y mapeo; para los recursos mapeados que ya no están en Drive → **desactivarlos** (`isActive = 0`), no borrarlos (decisión pendiente D-4); los recursos sin mapeo (manuales) **no se tocan**.
4. Ejecutar el plan en **una sola operación atómica** (`db.batch`, ya usado en `server/portafolio.ts`). El `UNIQUE` del mapeo hace fallar el lote entero ante una sincronización concurrente.
5. Resultado: una falla de lectura de Drive **no modifica la base**; las escrituras posteriores son todo-o-nada; los ids, el progreso y los vínculos se conservan.

**No se implementa** hasta que dirección apruebe la estrategia de identificación (D-A) y la política de los recursos que desaparecen de Drive.

## 6. Plan de implementación por hitos independientes (con los archivos exactos)

| Hito | Contenido | Archivos que se modificarían o crearían | Depende de | Autorización |
|---|---|---|---|---|
| **R1: lista blanca del `PATCH`** (B) | Esquema estricto, ruta, tipo restringido de `updateResource`, pruebas | `shared/schema.ts` (agregar `updateWeeklyResourceSchema`), `server/routes.ts` (el `PATCH`, líneas ≈995-1007), `server/storage.ts` (firma de `updateResource`, ≈280), **nuevo** `script/recursos-patch.check.ts`, registro en `docs/vortice/construccion/` | Nada | Separada |
| **R2: reconciliación de solo lectura** (C) | Función y pruebas | **nuevo** `server/reconciliacionRecursos.ts`, **nuevo** `script/reconciliacion.check.ts` (a partir de `evidencia/pruebas_reconciliacion.ts.txt`), `docs/…` | Nada | Separada. La exposición por ruta o por línea de comandos **no** está incluida |
| **R3: Drive atómico con conservación de ids** | Migración de mapeo, lectura completa antes de escribir, plan atómico | **nuevo** `migrations/vortice/0004_recursos_origen.sql` (o el número que corresponda), `server/googleDrive.ts` (paginación), `server/routes.ts` (≈1080-1130, `drive/sync`), `server/storage.ts` (funciones del plan), **nuevo** `script/drive-sync.check.ts` (con un lector de Drive simulado), `script/integridad-db.check.ts`/`migrar.check.ts` (conteo de migraciones aplicadas) | R2 recomendada antes (para el informe de relleno) y **aprobación de D-A y de D-4** | Separada |
| **R4 (opcional, por separado): endurecimiento de `notebookLmUrl`** | N-1 y N-2 | `shared/schema.ts`, `server/routes.ts`, `client/src/pages/CoursePlayer.tsx` | R1 | Separada, solo si dirección aprueba N-1 y N-2 |

Cada hito: rama propia desde el último estado aceptado, pruebas específicas con mutaciones cuando proceda, regresión, `tsc`, build, revisión de código y de seguridad, registro y commit local. Sin push, merge ni Turso.

## 7. Riesgos residuales

- B no protege frente a SQL directo ni a código futuro que escriba en la tabla (sin triggers: decisión 5); C solo detecta.
- Los registros históricos inconsistentes permanecen hasta que dirección decida reparar (decisión 6).
- `notebookLmUrl` sigue sin validar el formato mientras no se apruebe N-1; el cliente sigue concatenando la URL en `innerHTML` mientras no se apruebe N-2.
- Mientras R3 no exista, cada sincronización de Drive borra y recrea (ids nuevos) y puede dejar un módulo sin recursos si Drive falla (C01).
- La paginación de Drive no está probada contra Drive real (sin credenciales): se probaría con un lector simulado.
- La política de recursos que desaparecen de Drive (desactivar o borrar) y el comportamiento ante un recurso mapeado cuyo archivo cambia de carpeta requieren decisión.
- Las seis rutas de configuración con `req.body` directo siguen igual (decisión 7).
- Los resultados provienen de libSQL embebido; no se extrapolan a Turso ni a `sqld`.

## 8. Decisiones técnicas cerradas y pendientes

**Cerradas por dirección:** las ocho del §1, la lista blanca y exclusiones del §2, el rechazo total con 400, el esquema estricto y la verificación de tipos y valores en tiempo de ejecución, no inventar hosts, la lectura de Drive antes de escribir, la atomicidad de las escrituras y no implementar Drive hasta aprobar la estrategia.

**Propuestas técnicas a confirmar (no cerradas):**

| # | Propuesta | Recomendación |
|---|---|---|
| D-1 | Cuerpo vacío → 400 | Sí |
| D-2 | `title` sin exigir longitud mínima (paridad con `POST`) | Sí, paridad |
| D-3 | Cambio de `resourceType` desde o hacia `reflexion` con preguntas o respuestas → 409 | Sí |
| D-4 | Recursos que desaparecen de Drive: desactivar (`isActive=0`) en lugar de borrar | Sí |
| D-5 | Estrategia de identificación de Drive: D-A (tabla de mapeo) | Sí |
| D-6 | Relleno inicial de mapeos solo con informe previo de solo lectura | Sí |
| D-7 | N-1 (https, 2048) y N-2 (cliente) como hito R4 aparte | A decidir |
| D-8 | Exposición de la reconciliación (ruta de administración o línea de comandos) | No incluida; a decidir |
