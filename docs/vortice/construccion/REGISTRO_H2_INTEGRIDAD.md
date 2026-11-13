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

- **Terminación del proceso:** corregida en el commit siguiente (ver la sección «Terminación del proceso»). Ya no se usa `process.exit(0)`.
- Solo libSQL embebido en archivos locales.
- Módulos y recursos heredados: **no modificados**; informe aparte (LG2 y LG3 siguen reproduciéndose).
- No cubre `INSERT OR REPLACE` sobre los vínculos de OA, módulo y recurso (su fila solo tiene columnas de clave y `bloqueo_insert` los protege; probado en I9).

## Terminación del proceso de `integridad-db.check.ts` (SIGSEGV intermitente)

**Síntoma.** Con la versión de `249e233`, el proceso terminaba a veces con salida 139 (SIGSEGV) después de pasar todas las aserciones; esa versión lo ocultaba con `process.exit(0)`, que se retiró.

**Causa identificada (con evidencia, sin pruebas sobre el código fuente nativo):**

1. El informe de caída de macOS (`.ips`) muestra el fallo en el **hilo principal, dentro de un finalizador N-API del addon nativo de libSQL** (`index.node`), ejecutado desde el bucle de eventos (`RunAndClearNativeImmediates` → `Reference::Finalize`). No es una aserción ni la lógica de la migración: es la liberación de un objeto nativo por el recolector de basura.
2. `@libsql/client` 0.17.0 abre, en modo embebido, **una conexión nativa nueva por cada `client.transaction()`**, y `Transaction.close()` solo hace `ROLLBACK`: **no cierra esa conexión**. Queda viva hasta que el recolector la finaliza. `server/migrar.ts` usa una transacción por migración, y la prueba armaba decenas de bases (decenas de migraciones).
3. Evidencia experimental (libsql 0.5.22, Node 20.20, darwin-x64): una prueba que arma 45 bases con las migraciones se cae en 2 de 8 corridas; **sin las migraciones, 0 de 6**; forzando los finalizadores tras cerrar cada base, **0 de 8** (contra 4 de 8 sin forzarlos). Las pruebas de aserciones aisladas (cada caso por separado) no se caen. Experimentos de control (miles de sentencias, errores de triggers, `PRAGMA`, `UNION`, 150 bases sin transacciones) **no** reproducen la caída.
4. Conclusión: la causa está en **libSQL (cierre incompleto de las conexiones de transacción y finalizadores tardíos)**, activada por el volumen de bases y migraciones de esta prueba. No está en la migración `0003`, en las claves foráneas ni en el diseño de las pruebas de ataque. **No se identificó el objeto exacto ni el defecto en el código nativo.**

**Corrección (solo en la prueba, sin cambiar `0003`):**

- Las bases se arman **una vez por estado de migración** (plantilla: antes y después de `0003`) y cada prueba trabaja sobre una copia del archivo. Se pasó de decenas de migraciones a cuatro aplicaciones del ejecutor (las dos plantillas, una sobre base poblada en I4 y la verificación de deriva), y de unos 50 s a unos 10 s.
- Tras cerrar cada base y al final se **fuerzan los finalizadores** (`gc` más dos vueltas del bucle de eventos), para que las conexiones colgadas se liberen con el proceso sano.
- Sin `process.exit(0)`: el código de salida es el del proceso. Un fallo de aserción o una excepción termina con salida 1.

**Resultados.** Antes: 1 caída en 30 corridas con solo las plantillas, y entre el 50 y el 75 % de las corridas con la versión anterior. Después de forzar los finalizadores: **40 corridas, 40 con salida 0**. Un fallo provocado en una copia (se quitó el trigger `kp_no_sustituir`) termina con salida 1 y el mensaje de la aserción; una excepción en un caso termina con salida 1.

**Endurecimiento de las mutaciones.** `script/mutar.ts` contaba como «detectada» cualquier salida distinta de cero, de modo que una caída (139) habría pasado por detección. Ahora exige salida 1 (aserción) y avisa de cualquier otra.

**Límite.** La causa sigue siendo del componente nativo: no se corrigió libSQL. Si reaparece una caída, el código de salida será 139, no 0, y `check:vortice` fallará.

