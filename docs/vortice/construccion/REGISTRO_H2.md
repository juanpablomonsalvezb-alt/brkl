# Registro de construcción: H2, catálogo y versionamiento de contenidos

**Rama:** `vortice/motor-h2`, desde `8dfdbf2` (H0 y H1 aceptados). Local, sin push.

**Fuentes:**
- maestra `0a0ccaa`;
- diseño `3e5c488` (02 §1–§4; 04 §4, §5.1, §8);
- plan `5c0a21b`;
- registro de H0 y H1.

**Base de datos:** solo archivos locales desechables, uno por prueba. Sin Turso, Vercel, Preview ni credenciales.

## 1. Alcance: tareas del backlog frente a la autorización

La autorización de H2 cubre el catálogo y su versionamiento, y excluye M1, herramientas editoriales, interfaces y migración a Preview. El backlog asociaba H2 a «autorización de M1». Lo interpreté así:
- se construye el código y el esquema del catálogo y se prueba en una base desechable;
- no se hace la etapa M1: ni herramienta editorial, ni carga de una unidad real, ni migración en Preview.

| Tarea | Estado | Motivo |
|---|---|---|
| IMP-013 Validación del grafo | **Hecha** | Necesaria para los puntos 3, 4 y ciclos. Estaba en H1 sin autorizar; se incluye aquí |
| IMP-020 Migración del catálogo | **Hecha** | `migrations/vortice/0001_catalogo.sql`. Solo en bases desechables |
| IMP-023 Servicio del catálogo | **Hecha, sin auditoría** | `server/catalogo.ts`. `governance_audit` queda fuera: 04 §5.5 no define sus columnas (dice «como en la versión previa»), y definirlas sería inventar |
| Consultas para H1 (punto 10) | **Hechas** | `contextoVersion`, `linaje`, `versionPublicada`, `diferencias`, `grafoDeVersion` |
| IMP-021 Banco de preguntas | **Fuera del alcance** | No está entre los 10 puntos autorizados |
| IMP-022 Rol revisor y permisos | **Bloqueada** | Cambia los roles de `user_profiles` (esquema heredado) y depende de O4. Hoy la base solo exige validador distinto del autor |
| IMP-024 Flujo de preguntas (K13) | **Fuera del alcance** | Depende del banco |
| IMP-025 Herramienta de carga | **Bloqueada** | Interfaz editorial (M1), excluida |
| IMP-026 Informe de faltantes | **Fuera del alcance** | Depende del banco (familias) y de N5/Q4 |

**Secuencia ejecutada:**
1. IMP-013, puro y sin dependencias.
2. IMP-020, sobre el runner de H0.
3. Servicio y consultas, sobre 1 y 2.
4. Integración con `evaluar`, sobre 3 y H1.
5. Mutaciones, revisiones y regresión.

## 2. Arquitectura efectiva

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Regla pura | `shared/grafo.ts` | Validar la forma del grafo y dar un orden topológico determinista |
| Base | `migrations/vortice/0001_catalogo.sql` | Identidad, integridad, ciclo de vida, inmutabilidad tras publicar, linaje y aislamiento |
| Servicio | `server/catalogo.ts` | Flujo de versiones, publicación (grafo dentro de la transacción), consultas |
| Núcleo H1 | `shared/dominio.ts`, `shared/politica.ts` | **Sin cambios.** Reciben el `ContextoVersion` que arma el catálogo |

El catálogo usa SQL propio y no modelos Drizzle: la prueba D4 de E0 prohíbe que `drizzle-kit` gestione tablas con triggers. Ninguna ruta HTTP llama todavía a estas funciones.

## 3. Modelo de datos

Son las tablas de 04 §5.1: `curriculum_objectives`, `knowledge_domains`, `knowledge_domain_versions`, `knowledge_items`, `knowledge_item_versions`, `knowledge_prerequisites`, `knowledge_item_oas`, `knowledge_item_modules` y `knowledge_item_resources`.

| Garantía | Cómo |
|---|---|
| Identificador único | Ids UUID. Código único por dominio. Número de versión único por dominio. Una versión del contenido por versión de dominio. OA único por (asignatura, código, año) |
| Contenido y versión del mismo dominio | `knowledge_item_versions.domain_id` y claves foráneas compuestas hacia el contenido y hacia la versión del dominio |
| Aristas solo entre contenidos de la misma versión | Claves foráneas compuestas (`domain_version_id`, `item_id`) para ambos extremos |
| Aristas válidas | Sin autorreferencia; `alternativa` si y solo si hay grupo; validador y fecha obligatorios |
| Validador distinto del autor | CHECK |
| Aislamiento por asignatura | Triggers: OA, módulo y recurso vinculados deben ser de la misma asignatura y nivel que el dominio. Los vínculos no se reescriben y la asignatura de un OA no cambia |
| Identidad estable | El contenido no cambia de id ni de dominio; el dominio no cambia de asignatura |

## 4. Versionamiento

- **Ciclo de vida:** borrador → en revisión → validada → publicada → retirada, más en revisión → borrador (observada). Cualquier otro cambio de una fila se rechaza. Solo se puede borrar un borrador.
- **Una publicada por dominio:** índice único parcial. Publicar retira la anterior en la misma transacción.
- **Inmutable tras publicar** (04 §4): contenidos y aristas de una versión publicada o retirada no se agregan, cambian ni borran. Además no se puede quitar el último OA de un contenido publicado (02 §3).
- **Nueva versión:** copia los contenidos de la publicada, y cada uno la reemplaza (`supersedes_version_id`) con continuidad **sin declarar**. También copia las aristas.
- **Linaje coherente al publicar:**
  - la versión debe ser posterior a la última publicada;
  - debe construirse sobre ella: cada contenido que existía reemplaza su versión en esa base, y nada reemplaza a otra.
  - Así, dos borradores en paralelo no rompen el linaje: el segundo se rechaza.
- **Identificación de cambios:** `diferencias(a, b)` compara por código y entrega contenidos agregados, retirados, modificados (nombre o definición) y sin cambios, y aristas agregadas, retiradas y modificadas.

## 5. Compatibilidad y rupturas

- **Quién decide:** una persona declara `compatible` o `ruptura` en cada contenido que reemplaza a otro (04 §8). Sin declaración no se publica. El sistema no detecta rupturas por su cuenta: no hay regla aprobada para eso.
- **Si cambia el reemplazado:** la continuidad declarada contra el anterior se anula, y hay que declararla de nuevo.
- **`contextoVersion(item)` para `evaluar`:**
  - `versionActual` es la versión en la publicada;
  - `compatibles` son las anteriores alcanzables por eslabones `compatible`, hasta la primera `ruptura`, sin cruzarla.
  - `retencionVencida` la entrega quien llama (H7).
- **Integración comprobada con H1, sin modificar `evaluar`:**
  - TK10: la evidencia compatible cuenta junto con la vigente.
  - N18 = A: con ruptura, conserva el dominio y marca `por_comprobar`.
  - D-1: la evidencia anterior no se suma con la vigente.
  - D-2: hereda solo una versión anterior que terminó dominada.
  - A-1: dos familias erradas tras una ruptura dan `no_dominado`.
  - La retención vencida llega desde el contexto.

## 6. Pruebas

| Prueba | Qué cubre | Resultado |
|---|---|---|
| `grafo.check` | Orden topológico; determinismo en 50 órdenes; ciclo, inalcanzable, referencia externa, autorreferencia, duplicada, sin validador, código duplicado; alternativa en etapa 1 y sin grupo | OK |
| `catalogo-db.check` | 45 casos en la base: identificadores únicos, integridad, ciclo de vida, protección histórica, linaje, continuidad, aislamiento, último OA, una publicada | OK |
| `catalogo.check` | 9 bloques: flujo completo de v1 a v7, ciclo y alternativa al publicar, continuidad obligatoria, diferencias, linaje, contexto, integración con `evaluar`, borradores en paralelo, creación concurrente, aislamiento | OK |

**Mutaciones H2: 23/23 detectadas.** Cubren el grafo (4), la base (12) y el servicio (7). H0 sigue en 10/10 y H1 en 22/22.

**Regresión H0, H1 y H2:**
- `npm run check:vortice`: 33 líneas «ok» (las 19 pruebas previas, las 7 de H0 y H1, y las 3 de H2), en dos corridas con salida idéntica byte a byte.
- `tsc`: 0 errores. `npm run build`: compila.
- E0 sigue intacta en `2edf702`.

## 7. Revisiones

**`/code-review`: 10 hallazgos.**
- **Corregidos (8):**
  - linaje roto con borradores en paralelo y publicación desordenada (trigger `kdv_publicar_linaje`);
  - validación del grafo fuera de la transacción de publicación, con riesgo de que cambie entre la lectura y la publicación;
  - vínculos reescribibles entre asignaturas;
  - último OA de un contenido publicado borrable;
  - carrera al crear versiones (ahora es una transacción de escritura);
  - continuidad que sobrevivía a un cambio del reemplazado;
  - `diferencias` aceptaba un id inexistente;
  - costo del grafo.
- **Pasan a decisión (2):** ver §9.

**Revisión de seguridad** (subagente sobre el diff correcto): sin hallazgos.
- Todo el SQL va con parámetros.
- Limitación: estas funciones no verifican roles. Cuando se conecten a rutas, el actor debe salir de la sesión y hay que exigir el rol (IMP-022).

## 8. Diferencias con el diseño (04 §5.1)

| Diferencia | Motivo |
|---|---|
| `knowledge_item_versions` copia `domain_id` | Atar contenido y versión al mismo dominio por clave foránea compuesta (principio de 04 §1) |
| `confidence` es texto obligatorio, sin escala | El diseño no fija la escala |
| Sin `governance_audit` | Columnas sin definir en el diseño |
| Triggers de aislamiento por asignatura, de linaje al publicar, de continuidad y de último OA | Hacen cumplir en la base reglas del diseño (02 §3, 02 §4, 04 §8) que el texto deja a la aplicación |
| Validación del grafo dentro de la transacción de publicación | La base de SQLite no admite CTE en triggers, así que un ciclo no se puede detectar ahí. Una publicación por SQL directo lo elude (R-01, riesgo aceptado con la prueba D4) |
| Las aristas se copian a la versión nueva con su validador original | Ver decisión P-H2-2 |

## 9. Riesgos y decisiones pendientes

| ID | Tema | Situación | Propuesta (sin aplicar) |
|---|---|---|---|
| **P-H2-1** | Edición después de validar | La especificación dice «inmutable tras publicar», así que en `validada` el autor aún puede cambiar contenido y aristas que el validador ya aprobó. Bloquear desde `validada` sin una vía de regreso dejaba versiones sin salida | Bloquear desde `validada` y permitir `validada → en_revision`, que borra el validador. **Decide la usuaria** |
| **P-H2-2** | Aristas copiadas | Una versión nueva hereda las aristas con su validador original, aunque cambie la definición de un contenido | (a) Copiarlas sin validar y obligar a revalidarlas; (b) revalidar solo las de contenidos con ruptura; (c) dejarlo así. **Decide la usuaria** |
| P-H2-3 | Linaje de versiones anteriores compatibles entre sí (limitación de D-2b) | El catálogo ya tiene el linaje, pero aplicarlo cambiaría el comportamiento aceptado de D-2b en `evaluar`. **No se aplicó** | Agrupar en `evaluar` las versiones anteriores por tramo compatible. Cambia D-2b: **requiere autorización** |
| R-H2-1 | Concurrencia | En libSQL embebido, la transacción perdedora falla con `SQLITE_BUSY` en vez de esperar. No hay datos a medias ni números repetidos | Reintento con espera en la herramienta editorial (M1) |
| R-H2-2 | Sin roles | Cualquier código del servidor puede publicar. Solo se exige validador distinto del autor | IMP-022 con O4 |
| R-H2-3 | Rendimiento | Copiar una versión es una sentencia por fila, y la búsqueda de ciclos es O(V·(V+E)) sobre lo que queda fuera del orden | Basta para un piloto de 30 a 60 contenidos (09). Medir con la unidad real |
| R-H2-4 | Tablas heredadas | Cambiar `weekly_resources.learning_objective_id` o la asignatura de un módulo elude el aislamiento | Esas tablas no se tocan en H2 (esquema heredado) |

---

## 10. Cierre de H2 (2026-11-12): decisiones P-H2-1, P-H2-2 y P-H2-3

### Decisiones de la usuaria

| ID | Decisión | Implementación |
|---|---|---|
| **P-H2-1** | **A.** Desde `validada` se bloquean las modificaciones. Para cambiar algo, la versión vuelve a `en_revision`, la validación anterior queda anulada y hace falta una nueva. La validación debe corresponder exactamente a lo que se publica | Los triggers `kiv_*` y `kp_*` bloquean desde `validada`. `kdv_transicion` admite `validada → en_revision` solo con `validated_by` en NULL, y no admite `en_revision → publicada`. `kdv_validar_requisitos` exige al validar la continuidad, al menos un OA y todas las aristas validadas. El servicio anula `validated_by` al volver a `en_revision` o a `borrador` |
| **P-H2-2** | **A.** Las aristas copiadas a una versión nueva llegan sin su validación, y todas se validan de nuevo antes de publicar | `crearVersionDominio` copia las aristas con `validated_by` y `validated_at` en NULL. `validarArista` valida una sola vez y solo aristas pendientes. Con la revisión de código se agregó: ninguna arista nace validada (`kp_nace_sin_validar`); la autora de la versión no valida sus aristas (`kp_validador_distinto`, 08 §5); modificar una arista exige anular su validación (`kp_cambio_anula_validacion`); cambiar el nombre o la definición de un contenido anula las aristas que lo tocan (`kiv_cambio_anula_aristas`) |
| **P-H2-3** | **No autorizada.** `evaluar` y D-2b no cambian | No se tocó `shared/dominio.ts` ni `shared/politica.ts`: 0 líneas de diferencia con `8dfdbf2`. El uso del linaje de versiones compatibles queda como propuesta pedagógica |

Se quitaron dos controles que ya no se podían alcanzar: la revisión de aristas al publicar y la de continuidad al publicar. Ambas se exigen al validar, y desde `validada` el contenido está bloqueado. El chequeo de OA al publicar se mantiene, porque los vínculos se pueden cambiar (P-H2-4).

La migración `0001` se corrigió en el mismo archivo porque **no se ha aplicado en ningún entorno**: solo en bases desechables de prueba. Desde la primera aplicación real, el runner la protege por su suma, y todo cambio irá en una migración nueva.

### Resultados

| Verificación | Resultado |
|---|---|
| `catalogo-db.check` | 55 casos OK. Incluyen: contenido y aristas bloqueados en `validada`; volver a revisión conservando la validación, rechazado; validación anulada al volver; no se publica sin validar de nuevo; arista copiada sin validar que bloquea la validación; arista que nace validada, rechazada; autovalidación, rechazada; modificar una arista validada, rechazado; cambiar la definición anula las aristas que la tocan |
| `catalogo.check` | 10 bloques OK, estable en 3 corridas. Incluyen el flujo de P-H2-1 y P-H2-2 por el servicio, las publicaciones simultáneas (una sola publicada, sin estados a medias) y la creación simultánea (sin números repetidos ni escrituras a medias) |
| Mutaciones | H2 **33/33**, más 10 por las decisiones. H0 10/10 y H1 22/22 |
| Regresión de H0, H1 y H2 | `check:vortice`: 33 «ok», en dos corridas idénticas byte a byte |
| H1 | `shared/dominio.ts`, `shared/politica.ts` y sus pruebas sin cambios frente a `8dfdbf2`, y la salida de `dominio.check` es la misma (47 variantes) |
| `tsc` / build | Sin errores. Compila |
| E0 | `2edf702`, sin cambios |
| Revisión de código | Primera pasada: 9 hallazgos; se corrigieron 6, 2 quedaron explicados y 1 es un conflicto (P-H2-4). Segunda pasada: sin fallos; queda una limitación para la etapa 2 (grupos de `alternativa`) |
| Revisión de seguridad | Sin hallazgos. Limitación: no hay roles mientras las funciones no se expongan en rutas |

### Conflicto que requiere decisión

| ID | Conflicto | Opciones |
|---|---|---|
| **P-H2-4** | P-H2-1 exige que lo validado sea exactamente lo publicado. Pero en 04 §5.1 los vínculos con OA, módulo y recurso cuelgan del **contenido**, no de su versión. Por eso pueden cambiar después de validar e incluso después de publicar, y el cambio afecta a todas las versiones del contenido. Hoy solo se impide quitar el último OA de un contenido publicado | (a) Llevar los vínculos a la versión del contenido. Cambia el modelo de 04 §5.1. (b) Bloquear los vínculos mientras el contenido tenga una versión en `validada` y aceptar que lo publicado puede cambiar de vínculos después. (c) Dejarlo como está. **No se aplicó ninguna: decide la usuaria** |

### Riesgos actualizados

- **R-H2-1, concurrencia:** en libSQL embebido, las transacciones simultáneas pueden fallar todas con `SQLITE_BUSY`, no solo la perdedora. Nunca quedan datos a medias, ni números repetidos, ni dos publicadas. Falta una política de reintento para la herramienta editorial (M1).
- **R-H2-5, grupos de `alternativa`:** si una arista de un grupo cambia o se borra, el resto del grupo conserva su validación. No aplica en la etapa 1, porque `alternativa` no se publica. Resolver con K8, en la etapa 2.
