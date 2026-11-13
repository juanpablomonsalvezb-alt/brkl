# Registro: corrección de integridad del catálogo (H2), migración 0003

**Rama:** `vortice/h2-integridad`, desde `7e4314c`. **Autorización:** corrección acotada de la dirección tras la incidencia de `INSERT OR REPLACE`. No modifica `0001`, `0002` ni las tablas heredadas de módulos y recursos. Solo bases locales desechables (libSQL embebido): no se extrapola a `sqld` ni a Turso.

## Qué corrige

`INSERT OR REPLACE` borra la fila en conflicto sin disparar los triggers de DELETE (`recursive_triggers` apagado) y sin pasar por los de UPDATE; los triggers de INSERT de `0001` solo miran la fila nueva. Reproducido antes de la corrección (prueba I1, 17 bypasses con las claves foráneas activas; I2, 6 más que solo detenían las claves foráneas):

| Tabla | Bypass reproducido |
|---|---|
| `knowledge_prerequisites` | Arista de una versión publicada, validada o retirada movida a un borrador |
| `knowledge_domain_versions` | Versión publicada, validada o retirada **sin contenidos** reemplazada por un borrador; una versión nace ya publicada, validada, retirada, en revisión o con validador preinstalado |
| `knowledge_items`, `knowledge_domains`, `curriculum_objectives` | Identidad (dominio o asignatura) de filas sin dependientes |
| `knowledge_item_versions`, versiones de dominio con contenidos | Con las claves foráneas apagadas, sustitución de versiones publicadas |

## Protecciones de `0003_integridad_catalogo.sql` (12 triggers, todos en la base)

| Trigger | Tabla | Efecto |
|---|---|---|
| `kp_no_sustituir`, `kdv_no_sustituir`, `ki_no_sustituir`, `kd_no_sustituir`, `co_no_sustituir`, `kiv_no_sustituir` | las seis del alcance | Rechazan todo INSERT que choque con una fila existente por clave primaria o única: cubre `OR REPLACE`, `OR IGNORE` y `ON CONFLICT DO UPDATE / DO NOTHING` |
| `kdv_nace_borrador` | `knowledge_domain_versions` | Una versión nace en `borrador`, sin validador ni fecha de publicación |
| `ki_codigo_unico`, `co_clave_unica`, `co_id_inmutable`, `kp_clave_unica`, `kp_id_inmutable` | contenidos, OA, aristas | Cierran `UPDATE OR REPLACE` (colisión con otra fila) |

No dependen de claves foráneas ni de `PRAGMA` de conexión. Dependencias con triggers de `0001` documentadas en el encabezado de la migración.

## Costos aceptados (ratificados por la dirección en M2 para el banco; mismo criterio aquí)

- Las reinserciones idempotentes de filas existentes fallan; las semillas e importaciones deben comprobar antes la existencia. Búsqueda en `server/`, `shared/`, `scripts/` y `script/lib/`: ningún código usa `OR REPLACE`, `OR IGNORE` ni `ON CONFLICT` sobre estas tablas.
- Un duplicado falla con el mensaje del trigger y no con el del `UNIQUE`, que se conserva como declaración (comprobado en I11). Cinco aserciones de `catalogo-db.check.ts` pasaron de `/UNIQUE/` a `/UNIQUE|no se sustituye/`.
- Una versión de dominio ya publicada no puede cargarse de golpe: toda versión pasa por el flujo.

## Pruebas (`script/integridad-db.check.ts`, 17 casos, 358 ataques por modo)

| Caso | Qué demuestra |
|---|---|
| I1, I2, I3 | Reproduce los bypasses **antes** de `0003` (y, informativo, con `recursive_triggers` activo: lo detienen los triggers de DELETE existentes salvo en filas sin dependientes) |
| I4 | `0003` se aplica sobre una base ya poblada sin cambiar datos; sin deriva; segunda aplicación vacía |
| I5.1–I5.4 | Tras `0003`, los 358 ataques (REPLACE, OR IGNORE, UPSERT por clave primaria y por clave única, DO NOTHING, UPDATE OR REPLACE) en versiones borrador, en revisión, validada, publicada y retirada, quedan rechazados con una restricción y sin cambios, en las cuatro combinaciones de claves foráneas y `recursive_triggers` |
| I6 | Con las claves foráneas apagadas, los bypasses que antes solo detenía la clave foránea los detiene el trigger de `0003` (mensaje `no se sustituye`) |
| I7 | Un lote con una sustitución rechazada se revierte entero |
| I8.1–I8.4 | Controles: el flujo normal sigue (altas, ediciones, validar la arista por otra persona, transiciones, retiro) |
| I9 | Los vínculos de OA, módulo y recurso siguen protegidos |
| I10, I11 | Los 12 triggers están en el manifiesto; los `UNIQUE` declarados siguen |

Resultados finales: `check:vortice` ×2 salida 0, 38 líneas «ok», salidas idénticas; mutaciones h0 10/10, h1 22/22, h2 40/40, banco 39/39, **integridad 24/24**; `tsc` 0; build 0 (`api/handler.js` revertido); H1 0 líneas frente a `8dfdbf2`; E0 en `2edf702`.

## Revisión de código (medio) y seguridad

Hallazgos corregidos: las pruebas exigen ahora una restricción (no cualquier error) y que, sin claves foráneas, el rechazo sea del trigger de `0003`; la prueba I6 acepta solo `no se sustituye`; se agregó la comprobación de los `UNIQUE` declarados y el caso de un borrador con fecha de publicación; el ataque de I4 e I7 se elige por nombre; la migración documenta la dependencia de `UPDATE OR REPLACE` con triggers de `0001`.
Límites: el trigger `kdv_nace_borrador` cláusula `published_at` es redundante con el `CHECK` de la tabla (defensa en profundidad, no aislable). Seguridad (manual): sin SQL dinámico ni entrada externa; quien pueda ejecutar DDL sigue pudiendo borrar triggers (R-01, aceptado en D4).

## Limitaciones

- **`integridad-db.check.ts` termina con `process.exit(0)`** tras vaciar la salida: sin esto el proceso moría con SIGSEGV (salida 139) en más de la mitad de las corridas, después de pasar todas las aserciones. La causa no se aisló (libSQL nativo con cientos de conexiones). Las aserciones corren antes; un fallo previo sale con código 1.
- Solo libSQL embebido en archivos locales.
- Módulos y recursos heredados: **no modificados**; informe aparte (LG2 y LG3 siguen reproduciéndose).
- No cubre `INSERT OR REPLACE` sobre los vínculos de OA, módulo y recurso (su fila solo tiene columnas de clave y `bloqueo_insert` los protege; probado en I9).
