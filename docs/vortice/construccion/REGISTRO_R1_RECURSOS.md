# Registro R1: lista blanca del `PATCH /api/admin/resources/:id`

**Rama:** `vortice/r1-patch-recursos`, desde `b5d1cef`. **Autorización:** R1 de la dirección (D-1, D-2, D-3 aprobadas; D-7, N-1 y N-2 no incluidas). Solo bases locales desechables (libSQL embebido en archivo): no se extrapola a `sqld` ni a Turso.

## Cambios

| Archivo | Cambio |
|---|---|
| `shared/schema.ts` | `updateWeeklyResourceSchema` (Zod `.strict()`, parcial, con al menos una clave) y el tipo `UpdateWeeklyResource` |
| `server/routes.ts` | El `PATCH` valida el cuerpo completo **antes** de escribir: 400 con el detalle; 409 por la regla de reflexión; 404; el resto igual (401/403 por `isAdmin`, 500) |
| `server/storage.ts` | `updateResource(id, UpdateWeeklyResource)` devuelve `{ ok, resource } \| { ok: false, motivo }`; la regla D-3 va **dentro del propio `UPDATE`** |
| `script/recursos-patch.check.ts` (nuevo) | 74 casos sobre el servidor real |
| `script/mutar.ts` | Grupo `r1` con 21 mutaciones (dependencia técnica de «ejecutar mutaciones pertinentes») |

No se modificaron `notebookLmUrl` (sin N-1), `CoursePlayer.tsx`, la ruta `pedagogical-step`, `POST`, migraciones, H0–H2, IMP-021 ni E0.

## Reglas

Permitidos: `title`, `notebookLmUrl`, `barkleyFoundation`, `studentHelp`, `pedagogicalObjective`, `sortOrder` (entero), `isActive` (booleano), `resourceType` (la lista de la columna). Rechazan **todo el cuerpo** con 400: `id`, `learningObjectiveId`, `createdAt`, `updatedAt`, `pedagogicalStep`, `reflectionPrompts` y cualquier clave desconocida; también cuerpo vacío (D-1), tipos incorrectos y nulos donde la columna no los admite. `title` conserva la exigencia de la creación (`z.string()`, sin longitud mínima: D-2; el caso L11 y L12 lo demuestran con `POST`).
**D-3:** cambiar `resourceType` desde o hacia `reflexion` responde **409** y no modifica ninguna tabla si el recurso tiene `reflection_prompts` o filas en `reflection_responses`. Los cambios de metadatos y el mismo tipo no se bloquean. No se borra ni se migra nada.

## Pruebas (`script/recursos-patch.check.ts`, 74 casos)

En **cada rechazo** se comprueba que ninguna tabla cambió (huella de todas) y que la fila del recurso quedó igual. En cada aceptación, que solo cambiaron las columnas enviadas, que `learning_objective_id`, los vínculos de H2 y el resto de las tablas quedaron intactos.

| Grupo | Casos |
|---|---|
| Movimiento curricular, identidad y auditoría (A01–A08, A11, A17) | `learningObjectiveId` (vinculado, libre, misma asignatura, inexistente, nulo), `id`, `createdAt`/`updatedAt`, válido + prohibido |
| Rutas propias (A13) | `pedagogicalStep` y `reflectionPrompts` por el `PATCH` general → 400 |
| Desconocidos (A09) | desconocido + válido: **no se aplica el válido**; dos desconocidos |
| Valores y tipos (A10, A12, A14–A16) | nulos, enum, objeto, arreglo, número, texto en numérico y booleano, decimales, cada campo de texto anulable |
| Cuerpo (A19) | vacío, arreglo, `null`, JSON mal formado (estos dos últimos los rechaza el analizador JSON de express antes de la ruta) |
| Autorización y existencia (A18, A20) | 404, 401 sin sesión, 403 estudiante |
| Metadatos legítimos (L1–L13) | cada campo, todos a la vez, nulos, recurso vinculado a una versión publicada, respuesta 200 con la fila |
| D-3 (R1–R9) | video→reflexion y reflexion→video sin preguntas ni respuestas: 200; con preguntas, con respuestas y video con preguntas: 409 sin cambios (también con otros campos válidos en el cuerpo); mismo tipo con preguntas: 200; `[]` cuenta como vacío; el 409 no toca preguntas ni respuestas |
| Regresión (G1–G5, H2) | `POST` válido e inválido; `pedagogical-step` válida, inválida y estricta; crear la versión 2 del dominio tras los cambios |

## Resultados

| Verificación | Resultado |
|---|---|
| `recursos-patch.check.ts` ×10 | salida 0 las diez; sin `process.exit` |
| Mutaciones `r1` | **21/21 detectadas** (esquema, ruta, regla D-3 en sus ramas) |
| `check:vortice` ×2 (H0–H2, IMP-021, R1) | salida 0, 39 «ok», salidas idénticas |
| Mutaciones h0 / h1 | 10/10, 22/22 |
| `tsc` / build | 0 / 0 (`api/handler.js` revertido) |
| H1 frente a `8dfdbf2`; E0; migraciones frente a `b67b9fa` | 0 líneas; `2edf702`; 0 líneas |

## Revisión de código (medio) y seguridad

Hallazgos corregidos: la condición D-3 comparaba con un tipo leído antes del `UPDATE` (ventana de carrera) → ahora la comparación con el tipo actual va dentro del `UPDATE`; `[]` y `null` en `reflection_prompts` ya no cuentan como preguntas; la prueba de `acepta` verifica las columnas no enviadas; las pruebas de cuerpo `null` y JSON roto se rotularon como lo que son; se agregaron mutaciones para cada rama de D-3 y para cada campo de texto.
Seguridad (manual): lista blanca estricta; el cuerpo se valida antes de escribir; sin SQL dinámico (parámetros enlazados de drizzle); autorización `isAdmin` intacta; el módulo no se puede mover por esta ruta.

## Riesgos residuales y limitaciones

- `notebookLmUrl` sigue sin validar el formato (N-1 no autorizado); el cliente sigue concatenando la URL en `innerHTML` (N-2 no autorizado).
- `title` admite cadena vacía y `sortOrder` cualquier entero (paridad con la creación, por D-2 y la regla «entero»).
- La rama «sin fila actualizada» decide 404 o 409 con una segunda lectura sin transacción: si el recurso se borra justo entre las dos, puede responder 404 aunque la causa fuera la regla; no se puede probar de forma determinista.
- **`server/routes.ts.bak`** (archivo respaldado en el repositorio) conserva la versión antigua del `PATCH` sin lista blanca. No se tocó (fuera de alcance); si se restaurara o empaquetara, la lista blanca se saltaría.
- El `PATCH` no tiene consumidor conocido en el cliente; el nuevo 409 y el formato del 400 no están documentados en ningún cliente.
- SQL directo sigue pudiendo cambiar el módulo de un recurso (sin triggers por decisión de dirección); R2 lo detectará.
- Resultados sobre libSQL embebido; no se extrapolan.
