# Registro de la auditoría de recursos heredados

## Alcance

Auditoría y diseño, sin implementación. Rama `vortice/auditoria-recursos`, desde `b67b9fa` (descendiente de `249e233` y `7e4314c`). No se modificó código de aplicación, migraciones, tablas, H0–H2 ni IMP-021; no se inició H3 ni H4. Sin Turso, Vercel, credenciales reales, push, merge, Preview ni despliegues. Todo en bases locales desechables.

## Commits de referencia

| Commit | Contenido |
|---|---|
| `b67b9fa` | Último estado aceptado de H2 (terminación de `integridad-db`) |
| `249e233` | Migración `0003` de integridad |
| `7e4314c` | Corrección documental de IMP-021 |
| `c6137f2`, `bab2423`, `8dfdbf2`, `2edf702` | IMP-021, P-H2-4, H1 y E0 (sin cambios) |

## Comandos ejecutados (resumen)

| Comando | Para qué |
|---|---|
| `git checkout -b vortice/auditoria-recursos` | Rama de investigación |
| `grep -rnE "\.(insert\|update\|delete)\(<tabla>\)"` en `server`, `shared`, `scripts`, `script`, `client/src` | Rutas y funciones de escritura |
| `grep` de `req.body` hacia `.set()`, `.values()` y `storage.*` | Patrón de propagación directa |
| `npx tsx script/zz_inv.ts <salida>` (copia en `evidencia/inventario_esquema.ts.txt`) | Inventario del esquema real con `PRAGMA` (30 tablas) |
| `npx tsx script/zz_aud.ts <salida>` (copia en `evidencia/bateria_adversarial.ts.txt`) | Batería adversarial de 36 casos sobre el servidor real |

Los dos scripts son **temporales**: se ejecutaron desde `script/` (necesitan las importaciones relativas del repositorio), se copiaron como `.txt` a `evidencia/` y se **eliminaron** de `script/` antes de cualquier commit.

## Resultados

Ver `AUDITORIA_RECURSOS_HEREDADOS.md` (hallazgos H-1 a H-9), `PRUEBAS_RECURSOS_HEREDADOS.md` (36 casos) y `PROPUESTA_PROTECCION_RECURSOS.md`. Resumen: 30 tablas examinadas; 13 rutas y 22 funciones o módulos escritores; 13 campos clasificados (todas las columnas de `weekly_resources`); 6 vulnerabilidades distintas reproducidas; 1 inconsistencia histórica detectada en la base de prueba, producida por el propio ataque.

## Limitaciones

- libSQL embebido en archivo local; no se extrapola a `sqld` ni a Turso.
- Drive y las rutas de lectura no se ejercitaron.
- Los efectos sobre progreso, reflexiones y tutoría se analizaron por lectura (no ejecutados).
- No se auditó ninguna base real: no se conoce el estado de los datos de producción.
- Las seis rutas de configuración con propagación directa de `req.body` se informan sin auditoría a fondo.

## Archivos generados

`docs/vortice/auditoria-recursos/`: `AUDITORIA_RECURSOS_HEREDADOS.md`, `PRUEBAS_RECURSOS_HEREDADOS.md`, `PROPUESTA_PROTECCION_RECURSOS.md`, `MAPA_RELACIONES_RECURSOS.md`, este registro y `evidencia/` (`bateria_adversarial.ts.txt`, `inventario_esquema.ts.txt`, `inventario_esquema.txt`, `resultados_bateria.json`). Resumen para dirección en la respuesta de entrega.

## Fase de cierre de decisiones (tras `975579c` y `da3f203`)

| Comando | Para qué |
|---|---|
| `git show --stat 975579c`, `git show --stat da3f203`, `git status --short` | Integridad de la evidencia (8 + 1 archivos; árbol limpio) |
| Lectura de `server/googleDrive.ts`, `server/routes.ts`, `shared/schema.ts`, `client/src/pages/CoursePlayer.tsx`, `DriveSync.tsx` | Identificación de recursos de Drive; controles de `notebookLmUrl` |
| `npx tsx script/zz_recon.ts` ×2 (copia en `evidencia/pruebas_reconciliacion.ts.txt`) | Pruebas de V-1 a V-5: salida 0 las dos, salidas idénticas |

Resultados: `CIERRE_DECISIONES_RECURSOS.md`. Archivos nuevos: ese documento, `evidencia/reconciliacion_consultas.sql`, `evidencia/pruebas_reconciliacion.ts.txt`, `evidencia/resultados_reconciliacion.txt`. El script temporal se ejecutó desde `script/` y se eliminó antes del commit. **No se modificó código de aplicación, migraciones ni tablas.** Corrección: el mapa de relaciones no estaba en `975579c`; está en `da3f203` (ver el cierre §0).
