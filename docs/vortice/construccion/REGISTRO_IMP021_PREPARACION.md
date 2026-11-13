# Registro de preparación de IMP-021 (banco de preguntas)

**Estado:** preparación. **No autoriza implementar.** Archivo nuevo, sin versionar; no modifica ningún documento existente ni la especificación maestra.
**Base:** rama `vortice/motor-h2`, commit `bab2423`. H1 (`8dfdbf2`) y E0 (`2edf702`) sin cambios.
**Informe completo:** `informes/INFORME_PREPARACION_IMP021.md` (repositorio principal, sin versionar).

## Decisiones de la usuaria registradas

| ID | Decisión | Estado |
|---|---|---|
| **DB-0** | Opción B: el banco incluye las siete protecciones (inmutabilidad de preguntas aprobadas o retiradas, banco e ítem de la familia fijos, transiciones de estado, motivo de retiro obligatorio, procedencia y revisor, opciones válidas con clave dentro de ellas, «contenido aprobado» para publicar) | Confirmada; falta aclarar puntos (informe §4) |
| **DB-4** | Una familia está retirada cuando **todas las versiones de sus preguntas** están retiradas. No hay estado propio en la familia | Confirmada; contrastar con N17 y escenarios (informe §1–§2, C1–C3, C10, Q-14) |
| **DB-13** | Una pregunta anulada no admite respuestas nuevas. El retiro exige un motivo obligatorio. Las evidencias anteriores se conservan y **no se anulan automáticamente** | Confirmada; tensión parcial con `03` esc. 7 y `04` §8 (C5, C6, C7) |

## Contraste con la maestra (`0a0ccaa`)

La maestra no regula retiro ni anulación de **preguntas**, solo de versiones de evaluación (P18, P20). No hay contradicción. Coherente con la línea 23 (ids estables) y la línea 106 (banco de práctica distinto, con validación).

## Criterios preliminares de la usuaria (no son aún aprobación)

| Q | Criterio |
|---|---|
| Q-8 | El autor es un usuario humano responsable, no nulo; la procedencia de IA se registra aparte |
| Q-10 | Evaluar la estructura de `options_json`: ids únicos, mínimo de opciones, clave dentro de las opciones |
| Q-11 | Exigir una versión de dominio publicada, contrastando con K4 (K4 solo pide asociación; el resto es de `03`, PROPUESTO) |
| Q-13 | Conservar la evidencia por defecto; anulación explícita y humana, con motivo, responsable y trazabilidad; nunca automática |
| Q-14 | Los borradores nunca aprobados no determinan por sí solos que una familia está retirada |

Matriz final: `informes/MATRIZ_FINAL_DECISIONES_IMP021.md`.

## Consecuencias y puntos abiertos

C1 a C10 y las preguntas Q-1 a Q-16 están en el informe. Las más determinantes: Q-8 (autor de preguntas de IA), Q-10 (forma de `options_json`), Q-11 (K4), Q-13 (anulación en bloque de la evidencia previa) y Q-14 (familias retiradas frente a versiones nunca aprobadas).

## No hecho

Ninguna migración, código ni prueba de IMP-021. H3 y H4 no iniciadas.

---

## Implementación de IMP-021 (autorizada; rama `vortice/imp-021-banco`, desde `bab2423`)

**Alcance:** `migrations/vortice/0002_banco.sql`, `script/banco-db.check.ts`, el grupo `banco` de `script/mutar.ts` y una línea de `script/catalogo-db.check.ts` (la lista de migraciones aplicadas ahora incluye `0002`). No se tocó `evaluar`, H1, D-2b, E0, la especificación maestra ni documentos normativos. Solo bases locales desechables.

### Decisiones aplicadas, por origen

| Origen | Regla |
|---|---|
| **COMUNICADA** | K4: `question_families.item_id` NOT NULL con FK (la pregunta se asocia a un contenido). K13: origen `ia` exige modelo y huella; aprobar exige un revisor que no sea la autora |
| **PROPUESTO (`03`, `04`)** | Revisor ≠ autor; aprobada inmutable; estados y transiciones; banco e ítem de la familia fijos; anulación con solicitante ≠ aprobador y solo inserción |
| **DECISIÓN EDITORIAL aprobada** | DB-0 B (siete protecciones); DB-4 (familia retirada = al menos una versión y todas retiradas, derivada en la vista `question_families_retiradas`, sin estado propio); DB-13 (anulada: motivo obligatorio; la evidencia anterior no se toca; «sin respuestas nuevas» se hace cumplir en H3/H4); Q-1 a Q-12 de la matriz con Q-8 (autor humano no nulo, revisor distinto), Q-10 (opciones en JSON de texto plano, `correct_option_id`; sin máximo ni patrón de id), Q-11 (contenido en dominio `validada` o `publicada` para aprobar), Q-12 (anulación irreversible) |

### Desviaciones y añadidos (a confirmar)

| # | Qué | Por qué |
|---|---|---|
| 1 | `authored_by` NOT NULL y comparación `IS NOT` | Cierra el hueco de NULL de `04`/E0 (comprobado) |
| 2 | Columnas `retired_kind`, `retired_reason`, `retired_by`, `retired_at` | Q-5 (clasificación `renovacion`/`defecto`/`otro` + motivo) y Q-7 (una persona) |
| 3 | `question_voids` está en `0002`, no con la evidencia | Deja el banco autocontenido; solo depende de `question_versions` |
| 4 | **Añadido por la revisión de código:** el contenido y la procedencia no se editan en `en_revision`, ni en el UPDATE que aprueba | Sin esto, lo aprobado podía diferir de lo revisado y una pregunta de IA podía reetiquetarse como humana. **No estaba en la matriz: confirmar** |
| 5 | **Añadido por la revisión de código:** triggers que rechazan todo INSERT que sustituya una versión o una familia existente (y la anulación) | `INSERT OR REPLACE` y `ON CONFLICT DO UPDATE` sustituyen filas sin pasar por los triggers de UPDATE ni DELETE (comprobado: sustituía una aprobada). Consecuencia: un duplicado falla por el trigger y no por el UNIQUE, que queda como declaración |
| 6 | Fechas `REAL` y `content_hash` opcional | Convención de `0001` (DB-5 sigue abierta); la matriz no exigió hash |
| 7 | Índice `qf_item` | FK de la familia hacia el contenido |

### Pruebas ejecutadas (`script/banco-db.check.ts`, 31 casos; mensaje exacto por caso)

B1, B2, B3, B4, B4b, B4c, B5, B6, B7a, B7b, B7c, B7d, B7e, B8, B9, B9b, B10, B11, B11b, B12, B13, B14, B15 (a–i), B16, B16r, B17, B18, B19, B20, B21, B22: **todos ✓**. B23 (regresión) y B24 (tsc, build, H1, E0) se ejecutaron fuera del archivo.

| Comando | Resultado |
|---|---|
| `npx tsx script/banco-db.check.ts` | `banco-db: ok (31 casos)` |
| `npm run check:vortice` ×2 | Salida 0 las dos; 37 líneas «ok»; salidas idénticas |
| `tsx script/mutar.ts h0` / `h1` / `h2` / `banco` | 10/10, 22/22, 40/40, **39/39** detectadas |
| `npx tsc --noEmit -p .` | sin errores |
| `npm run build` | compila; `api/handler.js` revertido (lo regenera el build) |
| `git diff 8dfdbf2 -- shared/dominio.ts shared/politica.ts script/dominio.check.ts script/politica.check.ts` | 0 líneas |
| `git rev-parse e0/revalidacion-local` | `2edf702`; ningún archivo de `e0/` tocado |

### Revisión de código y seguridad

- **`/code-review`** (medio): 8 hallazgos. Corregidos: opciones con textos que contienen JSON (se validaba con `json_type(value)`; ahora con la columna `type` de `json_each`), contenido editable en revisión, `INSERT OR REPLACE`/UPSERT sobre identidad y versiones, aserción de B19 atada a la hoja de ruta, cobertura de mutaciones (de 30 a 39), índice. **No corregidos, aceptados:** el revisor solo es un usuario distinto del autor (la base no sabe si es una persona: IMP-022 y O4); una pregunta anulada sigue `aprobada` y el consumidor debe excluirla (H3/H4).
- **Seguridad** (revisión manual: la skill calcula el diff de otra rama): sin SQL dinámico ni entrada externa; los triggers usan `RAISE(ABORT)` con condiciones seguras frente a NULL; vías de bypass comprobadas: `INSERT OR REPLACE`, UPSERT, edición en revisión, tipos JSON. **Limitación aceptada:** quien tenga permiso de DDL puede borrar triggers o desactivar claves foráneas (riesgo R-01, ya aceptado en D4).

### Hallazgo fuera de alcance (H2, `0001`)

`INSERT OR REPLACE` sobre `knowledge_prerequisites` sustituye una arista de una versión **publicada** por otra apuntando a una versión en borrador (comprobado con una arista publicada). Es el mismo mecanismo cerrado aquí para el banco. Las FK protegen otras tablas de `0001` (versiones de contenido y de dominio). **No se corrigió** (H2 cerrado; fuera del alcance autorizado). Requiere una decisión y una migración propia.

### Pruebas no ejecutadas o límites

- Las respuestas, la evidencia y `evidence_voids` no existen (H3): la regla «anulada no admite respuestas nuevas» y la anulación explícita de evidencia quedan sin comprobar.
- `content_hash` no se exige; máximo de opciones y patrón de id sin fijar; quien revisa no se verifica como persona.
- Mutaciones equivalentes retiradas: el UNIQUE `(family_id, version)` queda cubierto por `qv_no_sustituir`; la comparación de `origin` en revisión, por `ck_origen`.
- `/security-review` como skill no se ejecutó: se hizo la revisión manual descrita.
