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

---

## Aceptación de H1 (revisión del 2026-11-11)

**Alcance:** revisión de los commits `c413ea3` (H0) y `1421a84` (H1). No se modificó código; solo se agregó esta sección. H2 no se inició.

### Resultado por criterio

| # | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 1 | `1421a84` contiene exactamente lo informado | **APROBADO** | 6 archivos: `shared/politica.ts`, `shared/dominio.ts`, `script/politica.check.ts`, `script/dominio.check.ts`, `script/mutar.ts` (mutaciones de H1) y este registro. 452 líneas agregadas, 1 eliminada |
| 2 | H0 y H1 funcionan juntos | **APROBADO** | `npm run check:vortice`: 26 pruebas en verde (19 previas, 5 de H0, 2 de H1), con `sqld` local incluido. `tsc`: 0 errores. `npm run build`: compila (se revirtió el `api/handler.js` regenerado). La prueba del reloj revisa también `shared/politica.ts` y `shared/dominio.ts` |
| 3 | D-1, D-2, D-2b y D-3 frente a las reglas aprobadas | **APROBADO** para D-1, D-2b y D-3. **PENDIENTE de confirmación** para D-2 | Ver «Diferencias frente a las reglas» |
| 4 | K6 y N18 = A bien aplicados | K6: **APROBADO**. N18 = A: **PENDIENTE** (hallazgo A-1) | Ver «Hallazgo A-1» |
| 5 | Ninguna decisión pendiente convertida en valor por omisión | **APROBADO**, con la limitación L-1 | Ningún literal de parámetro pendiente en `shared/politica.ts` ni en `shared/dominio.ts` (búsqueda). Los valores de prueba están solo en `script/*.check.ts`. Ningún código de la aplicación importa la política ni `evaluar` (búsqueda en `server/`, `shared/`, `client/src/` y `api/`) |
| 6 | 41 variantes y mutaciones reproducibles | **APROBADO** | Dos corridas completas con salidas **idénticas byte a byte** (`check:vortice`, `dominio.check`, `politica.check`, `mutar h0`, `mutar h1`). 44 líneas APROBADA (41 variantes más TK12, TK14 y TK15), 0 RECHAZADA. Mutaciones: H0 10/10 y H1 19/19 en ambas corridas |
| 7 | La rama E0 sigue intacta | **APROBADO** | `e0/revalidacion-local` en `2edf702`, sin cambios en su worktree, sin publicar. `correrTK()` de E0, ejecutado sin modificarlo: TK1–TK15 APROBADAS |
| 8 | Nada fuera del alcance de H0–H1 | **APROBADO** | `3e5c488..1421a84`: 20 archivos, todos de H0 o H1. Sin cambios en `client/`, `api/`, migraciones reales, la maestra, documentos normativos ni la rama E0. Sin push (la rama no existe en `origin`) |

**Veredicto:** H1 cumple sus criterios técnicos. Para cerrarlo formalmente faltan dos decisiones de la usuaria: A-1 (umbral tras ruptura) y la confirmación de D-2.

### Diferencias frente a las reglas

| ID | Regla aprobada | Texto de origen | Conforme |
|---|---|---|---|
| D-1 | La evidencia anterior nunca se suma con la nueva | 03 §9, escenario 9; 04 §8 («la evidencia anterior no se suma con la nueva para K6») | **Sí**, literal |
| D-2 | «Quien dominaba la versión anterior sigue `dominado` con `por_comprobar`» | 03 §9, escenario 9 | **Interpretación.** H1 lee «dominaba» como el estado final de esa versión. E0 lo leía como «alguna vez cumplió K6». **Requiere confirmar** |
| D-2b | La versión con ruptura no suma evidencia con la anterior | Ídem, aplicado a cada ruptura sucesiva | **Sí**. Limitación: dos versiones anteriores compatibles entre sí no se combinan, porque falta el linaje del catálogo (H2) |
| D-3 | O3 (ayuda para K6) y N16 (error con ayuda) son decisiones distintas | 10 §4 (O3) y §5 (N16); 03 §6 | **Sí** |

### Hallazgo A-1: umbral de `no_dominado` después de una ruptura

- **Texto aprobado** (03 §9, escenario 9, y 04 §8, publicado en `3e5c488` con la decisión N18 = A): «dos familias erradas en la versión nueva llevan a `no_dominado`».
- **Pseudocódigo** (05 §2, PROPUESTO): usa `política.not_mastered_wrong_families`, es decir, el parámetro de O1.
- **H1 sigue el pseudocódigo.** Comprobado:
  - con O1 = 2: `no_dominado`, conforme;
  - con O1 = 3: dos errores nuevos dejan `dominado` con `por_comprobar`, contra el texto aprobado.
- Con el valor recomendado de O1 (2), no hay diferencia. O1 sigue abierta.
- **Decide la usuaria:**
  - **(a)** fijar 2 tras una ruptura, según el texto de N18 (cambio de una línea y una prueba); o
  - **(b)** atarlo a O1, según el pseudocódigo.
- No se corrigió: requiere autorización.

### Limitación L-1: alternativas que la política no puede expresar

No son valores por omisión, pero si la dirección eligiera alguna de estas alternativas haría falta código nuevo:

| Decisión | Alternativa no representable |
|---|---|
| O1 | B: «no dominado solo si falla también el prerrequisito inmediato». Requiere el grafo (H2) |
| O2 | D: `intervalo:<n>` |
| O3 | B: ayuda con peso menor |
| Escenarios 4 y 10 | C: dominio permanente. La marca `por_comprobar` tras un error o con la retención vencida es la conducta común a A y B |

### Riesgos de rendimiento

- **`evaluar` es O(n²)** sobre la evidencia de un estudiante en un contenido (posiciones con `indexOf` dentro de los bucles). Basta para decenas de evidencias. Hay que medirlo con la proyección (H3) y con D8.
- **Ruptura:** el recálculo masivo al publicar una versión (IMP-036, H3) evaluará a todos los estudiantes con evidencia de ese contenido. Sin medir; diseñarlo en lotes.
- **Pruebas:** `dominio.check` evalúa 41 variantes × 100 órdenes y 2 000 conjuntos × 20 órdenes. Tarda segundos. Las mutaciones vuelven a correr la prueba completa por cada mutación.

### Dependencias pendientes de H2 y H3

| Necesita | Para | Hito |
|---|---|---|
| Linaje de versiones y continuidad declarada (`supersedes_version_id`, `evidence_continuity`) | Construir `ContextoVersion.compatibles` desde datos reales y resolver la limitación de D-2b | H2 (IMP-020, IMP-023) |
| Tablas de evidencia y respuesta | Alimentar `evaluar` con datos persistidos | H3 (IMP-030, IMP-031) |
| Filtro único y tipo `EvidenciaLiberada` | Que `evaluar` reciba solo evidencia publicable (P19-E1) | IMP-012, IMP-032 (no autorizados) |
| Política aprobada (O1, O2, O3, N16, N17, escenarios 3 y 4) | Ejecutar con estudiantes; hoy no se ejecuta con nulos | Decisión de la dirección (IMP-034) |
| Decisión A-1 y confirmación de D-2 | Cerrar N18 = A | Usuaria |
| Agenda de retención | Calcular `retencionVencida` | H7 (IMP-076, O8) |

### Limitaciones de integración

- `evaluar` y la política **no están conectadas** a ninguna ruta ni servicio. Solo las usan las pruebas.
- El contexto de versión (`versionActual`, `compatibles`, `retencionVencida`) lo debe armar quien llame. Aún no existe ese código.
- TK13 (idempotencia) y TK14 (embargo) se prueban sobre `evaluar` en memoria. Las garantías en base son de IMP-031 e IMP-032.
- La integridad al arrancar no está conectada a `api/index.ts` (Vercel) y en producción solo registra (desviación de H0).
- La parte de `sqld` de las pruebas se omite si no está instalado (`VORTICE_EXIGIR_SQLD=1` la vuelve obligatoria).

### Evidencias de esta revisión

- **Comandos:**
  - `npm run check:vortice` (dos veces);
  - `tsx script/dominio.check.ts` y `tsx script/politica.check.ts` (dos veces);
  - `tsx script/mutar.ts h0` y `h1` (dos veces);
  - `tsc --noEmit` y `npm run build`;
  - comparación diferencial de un solo uso contra `e0/src/referencia.ts` (lectura, no versionada): 20 000 casos, 18 639 idénticos y 1 361 distintos, todos por D-1, D-2, D-2b o D-3. El mismo resultado de la corrida anterior.
- **Sumas SHA-256 (16 primeros caracteres) de los archivos revisados:**
  - `shared/dominio.ts` `c03d78455ca7353c`;
  - `shared/politica.ts` `d38b1e685ad7299b`;
  - `script/dominio.check.ts` `2309ed3d2caf64c3`;
  - `script/politica.check.ts` `b73f7c3b2dde2e9e`.
- **Salidas de las pruebas:** se conservaron fuera del repositorio, en la carpeta temporal de la sesión. No se publicaron.

---

## Cierre definitivo de H1 (2026-11-11)

Esta sección reemplaza los dos puntos que quedaron pendientes en la revisión de aceptación anterior. El resto de esa revisión sigue vigente.

### Decisiones de la usuaria (2026-11-11)

| ID | Decisión | Efecto en el código | Pruebas |
|---|---|---|---|
| **A-1** | Alternativa (a). Después de una ruptura de versión, dos familias erradas en la versión nueva dan `no_dominado`, con umbral **fijo en 2** (N18 = A; 03 §9 y 04 §8). **No depende de O1**, que sigue abierta | `shared/dominio.ts`: la constante `N18_FAMILIAS_ERRADAS = 2` se aplica cuando hay dominio heredado. Sin herencia, `no_dominado` sigue dependiendo de O1 | A1a (2 errores nuevos con O1 = 3 y con O1 = 2: `no_dominado`); A1b (1 error nuevo con O1 = 1: sigue `dominado` + `por_comprobar`); A1c (sin ruptura, O1 = 3 conserva su efecto: `incierto`). Mutaciones: «umbral atado a O1» y «umbral distinto de 2», ambas detectadas |
| **D-2** | Interpretación confirmada. Solo se hereda el dominio de una versión anterior si esa versión **terminó en `dominado`**. Haber cumplido K6 en algún momento no basta | Ya estaba así. Se documentó en el código, junto a la herencia | TK11g y D2b (cumplió K6, terminó `incierto`: no hereda); D2a (dominado con 1 error posterior, que sigue `dominado`: hereda). Mutación: «hereda si alguna vez cumplió K6 (como E0)», detectada |

### Nueva diferencia con E0

| ID | Caso | E0 | H1 | Regla |
|---|---|---|---|---|
| D-4 | Ruptura con dominio heredado, 2 familias erradas nuevas y O1 = 3 | `dominado` + `por_comprobar` | `no_dominado` | Decisión A-1 |

Se comprobó directamente sobre ambas implementaciones. La comparación aleatoria de 20 000 casos no generó esta combinación: sigue en 18 639 idénticos y 1 361 distintos, todos por D-1, D-2, D-2b o D-3. D-4 queda cubierta por A1a y por su mutación.

### Resultado definitivo por criterio

| # | Criterio | Resultado |
|---|---|---|
| 1 | El commit contiene exactamente lo informado | **APROBADO** (`1421a84`; el cierre va en el commit siguiente) |
| 2 | H0 y H1 funcionan juntos | **APROBADO** |
| 3 | D-1, D-2, D-2b, D-3 (y D-4) frente a las reglas | **APROBADO**. D-2 está confirmada por la usuaria |
| 4 | K6 y N18 = A | **APROBADO**. A-1 aplicada |
| 5 | Ninguna decisión pendiente como valor por omisión | **APROBADO**. El 2 de A-1 es una decisión aprobada, no un valor por omisión. O1 sigue nula hasta decidirse. Se mantiene la limitación L-1 |
| 6 | Reproducibilidad | **APROBADO** |
| 7 | E0 intacta | **APROBADO** |
| 8 | Nada fuera del alcance | **APROBADO** |

**H1: ACEPTADO.**

### Evidencias del cierre

- **Pruebas específicas:** `dominio.check` tiene 47 variantes (41 anteriores más 6 nuevas: A1a ×2, A1b, A1c, D2a, D2b), cada una en 100 órdenes, y 2 000 conjuntos aleatorios × 20 órdenes. 50 líneas APROBADA (las 47 variantes más TK12, TK14 y TK15), 0 RECHAZADA.
- **Regresión conjunta de H0 y H1, dos corridas:** `npm run check:vortice` con salida idéntica byte a byte; las 26 pruebas pasan.
- **Mutaciones, dos corridas idénticas:** H0 10/10 y H1 22/22 (19 anteriores más 3 nuevas).
- **Compilación:** `tsc --noEmit` sin errores; `npm run build` compila. Se revirtió el `api/handler.js` regenerado.
- **E0:** `e0/revalidacion-local` sigue en `2edf702`, sin cambios ni publicación, y `correrTK()` de E0 sigue aprobando TK1–TK15.
- **Sumas SHA-256 (16 primeros caracteres):**
  - `shared/dominio.ts` `053cc313e047644d`;
  - `shared/politica.ts` `d38b1e685ad7299b` (sin cambios);
  - `script/dominio.check.ts` `5c0b81d658f2df65`;
  - `script/politica.check.ts` `b73f7c3b2dde2e9e` (sin cambios);
  - `script/mutar.ts` `1054622c37b6f51d`.
