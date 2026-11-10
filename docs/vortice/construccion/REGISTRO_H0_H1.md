# Registro de construcción: H0 y H1

**Rama:** `vortice/motor-h0-h1`, desde `3e5c488`. Local, sin push.
**Autorización:** solo H0 (IMP-001 a IMP-008) y, de H1, IMP-010 e IMP-011. **No autoriza** IMP-012 a IMP-017, recomendaciones, evaluaciones, publicación, interfaces, M1–M8 ni migraciones de Preview.
**Decisiones aplicadas:**
- D6/D7, aprobada por la usuaria el 2026-11-10: mecanismo C, reloj de la base, falla cerrada, registro anticipado por tarea idempotente y rechazo con motivo sin versión de reserva. En H0 solo se usa el reloj de la base (`server/reloj.ts`); lo demás pertenece a H4 y no está construido.
- N18 = A.
- Prueba D4 de E0.

**Fuentes:**
- maestra `0a0ccaa`;
- diseño `3e5c488`;
- E0 `2edf702` (resultados de referencia, sin modificar);
- plan `5c0a21b` (rama `vortice/plan-implementacion`).

## H0: desviaciones respecto del backlog

| Tarea | Desviación | Motivo |
|---|---|---|
| IMP-001 | Sin `fetch` explícito por proxy (R-14) | Ningún entorno de la aplicación usa proxy. Se resuelve en R (A1) |
| IMP-001 | La regla de un solo `createClient` aplica a `server/` y `shared/` | Las pruebas antiguas y los scripts operativos crean su propio cliente. Los scripts de producción siguen siendo el riesgo R-01 aceptado |
| IMP-001, IMP-003 | La integridad al arrancar es estricta fuera de producción; en producción solo registra. No está conectada a `api/index.ts` | Turso sin verificar (A1): no arriesgar la disponibilidad |
| IMP-002 | Se portaron los casos centrales de la prueba D4, no los 30 de `d4def.ts` | Alcance |
| IMP-003 | El estado esperado se obtiene plegando el registro de migraciones; no hay un archivo de manifiesto aparte | Evita listas escritas a mano |
| IMP-005 | Pruebas sin aislamiento de red (usan solo 127.0.0.1). Sin cuentas ficticias | Aún no hay tablas que las usen |
| IMP-007 | 17 casos de guarda, no los 48 de E0. Sin host fijo en producción | Fijar el host exige configuración nueva y A1 |

## H1: diferencias con la referencia de E0

La referencia de E0 (`e0/src/referencia.ts`) es una transcripción del pseudocódigo de `05` §2. Sus resultados TK1–TK15 **no se modifican** y siguen aprobados (verificado al ejecutar `correrTK()` de E0 sin cambios).

| ID | Situación | E0 | H1 | Regla que sigue H1 |
|---|---|---|---|---|
| D-1 | Ruptura: el dominio de la versión anterior se calcula mezclando evidencia anterior y vigente | Hereda (por ejemplo, 1 acierto en v1 y 1 en v2 dan «dominado» heredado) | No hereda | N18 = A: la evidencia anterior **nunca** se suma con la nueva; hereda quien dominaba la versión anterior |
| D-2 | Ruptura: la versión anterior alcanzó K6, pero terminó en `incierto` (contradictoria) | Hereda (solo mira si alguna vez se cumplió K6) | No hereda | N18 = A: «quien dominaba» la versión anterior |
| D-2b | Varias versiones anteriores con ruptura | Las suma entre sí | Evalúa cada una por separado | Ídem. **Limitación:** sin el linaje de versiones (H2), dos versiones anteriores compatibles entre sí no se combinan; el error es conservador (nunca hereda de más) |
| D-3 | O3 = sí y N16 = no, con un error con ayuda | El error cuenta (N16 queda atado a O3) | El error no cuenta | O3 y N16 son decisiones independientes (03 §6, escenarios 5 y 6) |

**Comparación diferencial:** 20 000 casos aleatorios con todas las combinaciones de política.
- Idénticos: 18 639.
- Distintos: 1 361, todos explicados por D-1, D-2 o D-3. Ninguno sin causa.

D-1 y D-2 se detectaron al diseñar H1; D-2b y D-3, en el `/code-review`. Ninguna TK de E0 los cubría. Se agregaron las pruebas TK11f–i y N16b.

## H1: qué no es regla del motor

La política no tiene valores por omisión. Solo K6 (2 familias) está fijado en el código; los demás parámetros (O1, O2, O3, N16, N17 y los escenarios 3 y 4) son nulos hasta que se aprueben, y una política con nulos no se ejecuta. Los valores «recomendados» existen solo en las pruebas. La alternativa `intervalo:<n>` de O2 no está implementada: exige fijar un número.

`evaluar` recibe evidencia ya liberada. El filtro de publicación (P19-E1) y el tipo `EvidenciaLiberada` son IMP-012 e IMP-032: no están autorizados ni construidos. TK13 (idempotencia) es de persistencia (IMP-031).
