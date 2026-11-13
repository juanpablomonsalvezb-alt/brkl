# Registro H3a: evidencia atómica mínima

**Rama:** `vortice/h3a-evidencia`, desde `9c53f93` (R2 aceptado). **Local, sin push ni merge.** Bases locales desechables (libSQL embebido en archivo); sin Turso, Vercel, credenciales ni Preview.
**Alcance:** IMP-012, IMP-030, IMP-031, IMP-032 e IMP-033, con las decisiones D1–D7 y D5.1–D5.5 de la dirección. No incluye H3b (IMP-034 a IMP-036), H4, evaluaciones, E2, retención, rutas HTTP ni interfaces.

## 1. Qué se implementó

| Componente | Archivo | Contenido |
|---|---|---|
| IMP-012 | `shared/evidencia.ts`; `shared/dominio.ts` | `EvidenciaLiberada` con símbolo no exportado. `evaluar` exige el tipo marcado. Solo cambia la firma: las 47 variantes de H1 dan los mismos resultados |
| IMP-030 | `migrations/vortice/0004_evidencia_practica.sql` | 7 tablas, 42 triggers, CHECK, FK compuestas, índices únicos y parciales. Tiempos `REAL` (D6) |
| IMP-031 | `server/practica.ts` | Sesiones y respuestas en un lote atómico con idempotencia y guarda de concurrencia |
| IMP-032 | `server/conocimiento.ts` | Filtro único, único punto de acceso a evidencia, anulaciones, eventos y proyección |
| IMP-033 | `server/reconstruccion.ts` | Reconstruir, comparar y rehacer la proyección sin escribir eventos; detectores de solo lectura |

### Tablas (D1)

`practice_sessions`, `practice_answers`, `knowledge_evidence`, `evidence_voids`, `mastery_policies`, `knowledge_state_events`, `student_knowledge_state`. Excluidas: `retention_schedule`, `progression_continuations`, `recommendation_log`, `governance_audit`.

- **Evidencia solo de práctica (D2):** las columnas de evaluación existen y un CHECK las fuerza a NULL. H4 reconstruirá la tabla.
- **Proyección (D5.5):** sin `correct_families`, `wrong_families`, `assisted_count` ni `mastered_at`. `uncertainty_reason` admite los seis valores aprobados.
- **Políticas (D5.3):** estados `borrador` y `aprobada`, sin retiro; la vigente es la aprobada de mayor versión. Aprobar exige en la base los ocho parámetros completos, tipados y no nulos.
- **Sesiones (D5.4):** una abierta por estudiante y dominio, sin importar el propósito. Abrir otra cierra la anterior en el mismo lote. Sin caducidad. Una sesión cuya versión dejó de estar publicada se rechaza como `sesion_obsoleta`.
- **Anulación (D5.1):** anulada = existe fila en `evidence_voids`; se entrega con `anulada: true` y `evaluar` la excluye. La anulación de una pregunta no anula evidencia. No hay servicio de anulación ni eventos de anulación (H3b).
- **Familia retirada (D5.2):** familia retirada por completo (DB-4) y versión citada sin `retired_kind = 'defecto'`; `otro` cuenta como sin defecto. `retired_counts` (N17) no se fija ni se lee en el código nuevo. El detector `retiradasPorDefectoSinAnular` informa para revisión humana y no excluye nada.

### Endurecimientos de integridad (D4), en la base

Dominio publicado al abrir sesión, al responder y al generar evidencia; coherencia sesión–dominio–respuesta–evidencia (FK compuesta que incluye fecha, secuencia y día copiados, más `accommodation` por trigger); `sequence_no` único y creciente; respuestas en sesión cerrada rechazadas; `is_correct` y la opción verificadas contra la pregunta; contenido de la pregunta dentro de la versión de dominio de la sesión.

Patrón de `0003` en cada tabla: `*_no_sustituir` (cubre `INSERT OR REPLACE`, `OR IGNORE` y `ON CONFLICT`), solo inserción, identidad inmutable, `ON DELETE RESTRICT`. Ninguna protección depende de `PRAGMA foreign_keys` (se prueba con las FK apagadas). La proyección escribe `UPDATE` y luego `INSERT` condicionado; el UPSERT se rechaza a propósito.

### Atomicidad y concurrencia (IMP-031)

El servidor fija estudiante, ids, tiempo (reloj de la base, una lectura), secuencia, día (Chile) y correctitud. Una respuesta es un solo `batch` de hasta cuatro sentencias: respuesta, evidencia, evento (solo si cambia estado o marca) y proyección. La respuesta lleva una guarda («ninguna respuesta nueva del contenido desde la lectura»); las demás sentencias dependen de que la respuesta exista. Si la guarda falla no se escribe nada y se reintenta (máximo 3, luego `reintente`). Sin política ejecutable se escriben solo respuesta y evidencia.

## 2. Resultados

| Verificación | Resultado |
|---|---|
| Checks nuevos | `evidencia-db` 25 casos, `practica` 13, `conocimiento` 8, `reconstruccion` 9: todos en verde |
| Cada check nuevo ×30 | 30/30 con salida 0 (los cuatro) |
| Mutaciones `h3a` | **113/113 detectadas** (salida 1) |
| `check:vortice` ×2 | salida 0 las dos, 44 «ok», salidas idénticas |
| Mutaciones h0 / h1 / h2 / banco / integridad / r1 / r2 | 10/10, 22/22, 40/40, 39/39, 24/24, 21/21, 34/34 |
| `tsc` / build | 0 / 0 (`api/handler.js` revertido) |
| `dominio.check` | 47 variantes, mismos resultados |
| `0001`–`0003` frente a `9c53f93` | 0 líneas de diferencia |
| `shared/politica.ts`, H0, H2, R1, R2 | 0 líneas de diferencia |
| E0 | `2edf702` intacta |

### Mutantes equivalentes retirados (con prueba)

Cuatro, todos con defensa redundante. Con cada mutación aplicada pasan los cuatro checks nuevos:
- `mp_transicion`: la política solo admite dos estados y `mp_aprobada_inmutable` cubre toda salida desde `aprobada`.
- `UNIQUE (student_id, sequence_no)` y `UNIQUE (student_id, client_submission_id)` de `practice_answers`, y el índice único parcial `ke_practice_uq`: los triggers `*_no_sustituir` los cubren, también con `INSERT OR REPLACE`.

## 3. Cambios fuera de H3a (autorizados caso por caso)

| Archivo | Cambio |
|---|---|
| `script/banco-db.check.ts` (82), `script/catalogo-db.check.ts` (20) | La lista esperada de migraciones aplicadas incluye `0004_evidencia_practica.sql` |
| `script/integridad-db.check.ts` | Se agrega `dirHasta0003`. I4 y I10 usan ese directorio (el escenario histórico de `0003`); la aserción de I4 conserva su lista original y `huella` no cambia. I5–I9 y el resto siguen con el directorio vivo y `0004` |
| `shared/dominio.ts`, `script/dominio.check.ts` | Solo el contrato `EvidenciaLiberada` (D3) |
| `script/mutar.ts` | Grupo `h3a` |

I4 se verificó aparte: detecta un `UPDATE` real de datos preexistentes (variante temporal), y aplicar `0004` sobre una base con `0001`–`0003` agrega 7 tablas sin alterar los datos de las previas. I10 cuenta 12 triggers con `dirHasta0003` y 20 con el directorio vivo (los 8 adicionales son de `0004`).

## 4. Fallas halladas y corregidas

1. Las mutaciones `WHEN 0 AND …` solo anulaban el primer término de un `OR`; se rehicieron anulando el cuerpo del trigger.
2. `ps_no_sustituir` no cubría la sesión abierta: un `INSERT OR REPLACE` borraba la sesión abierta existente. Corregido en `0004` (no aplicada en ningún entorno).
3. Faltaban casos de `sks_politica_*`, de la FK de la sesión, del propósito, del reloj inyectado y de la ayuda de la respuesta nueva; se agregaron. La segunda lectura de `leerEstado` se prueba con otro `ahora`.
4. Regresión por la nueva migración en tres checks previos (sección 3).

## 5. Revisión de código y de seguridad (manual)

**Código:** sin SQL dinámico con entrada (solo parámetros; lo único interpolado es una condición fija); tiempo del reloj de la base; ningún `Date.now()`/`new Date()` sin argumento en los módulos nuevos (lo comprueba `conocimiento.check`); `evaluar` sin cambios de lógica.
**Seguridad:** el estudiante lo fija el servidor y la sesión se verifica contra él; `is_correct` nunca viene del cliente y la base lo contrasta con la clave; evidencia y proyección solo se alcanzan por `server/conocimiento.ts` (búsqueda de texto); no hay rutas, red ni credenciales; los rechazos no escriben nada (huella de todas las tablas).

## 6. Limitaciones y riesgos

- `tsconfig` no incluye `script/`: el rechazo de evidencia sin marcar se prueba con una sonda de `tsc` generada por `conocimiento.check.ts`. La marca es un contrato de tipos: no existe en tiempo de ejecución y `as` la fuerza (prohibido en producción por búsqueda).
- Un reenvío idempotente devuelve ids, correctitud y secuencia originales y el estado proyectado hoy; el motivo original no se guarda en los eventos.
- `rehacerProyeccion` no borra filas sin evidencia: las informa la comparación.
- Una versión retirada por defecto sin anulación explícita sigue contando (Q-13: nada es automático); el detector la informa.
- La definición de «sesión» para K6 sigue en O2; sin caducidad, una sesión abandonada sigue abierta hasta la siguiente apertura.
- Sin política aprobada no se calcula ningún estado en producción: O1–O3, N16, N17 siguen abiertas.
- `0004` no se aplicó en ningún entorno real. Solo libSQL embebido: la concurrencia no se probó contra `sqld` ni Turso. El defecto de libSQL (SIGSEGV intermitente) se mitiga en las pruebas forzando los finalizadores.
- Pendiente de H4: reconstruir `knowledge_evidence` para evidencia de evaluaciones.

## 7. Estado

| | |
|---|---|
| Implementado | IMP-012, 030, 031, 032, 033 |
| Probado | Secciones 2 a 5 |
| Aceptado | Nada: pendiente de la aceptación formal de la dirección |
