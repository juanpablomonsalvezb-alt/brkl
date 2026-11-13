# Registro de decisiones de construcción de Vórtice

**Naturaleza:** registro **de solo agregado** (append-only). Cada entrada es nueva, fechada y no reemplaza ni reescribe documentos o commits anteriores. Si una decisión cambia, se agrega otra entrada que la referencia; las anteriores no se editan.
**Complementa** (no sustituye) a los registros de hito: `REGISTRO_H0_H1.md`, `REGISTRO_H2.md`, `REGISTRO_H2_INTEGRIDAD.md`, `REGISTRO_IMP021_PREPARACION.md`, `REGISTRO_R1_RECURSOS.md`, `REGISTRO_R2_RECONCILIACION.md` y `REGISTRO_H3A.md`, que permanecen tal como están.
**Alcance:** decisiones de construcción (técnicas, académicas y limitaciones de implementación). No es una especificación normativa y no modifica `docs/p0-e-maestro`.
**Origen de las aprobaciones:** mensajes de la usuaria en la sesión de trabajo. Las marcas de hora están en UTC; Chile estaba en UTC−3 en noviembre de 2026. La transcripción es local (`4a9eb98a-daa5-439f-b34f-d427a8d2e14e.jsonl`) y no está versionada; por eso el texto aprobado se copia aquí.
**Convención de nombres:** «**decisión** D6/D7» (mecanismo de publicación de la pauta, esta entrada E-001) no es la «**prueba** D6/D7» del diseño (`04_MODELO_DE_DATOS.md` §10: publicación anticipada y atomicidad), cuyos resultados siguen siendo de E0 (`2edf702`). Tipos: **T** técnica · **A** académica · **L** limitación de implementación.

---

## E-001 — Decisión D6/D7: mecanismo de publicación de la pauta

| Campo | Valor |
|---|---|
| Fecha de la aprobación | **2026-11-10, 18:54:22 UTC (15:54 hora de Chile)**; entrada 85037 de la transcripción |
| Aprobada por | La usuaria |
| Tipo | T (con efecto sobre la publicación de la pauta, P18 y P19-E1; no cambia ninguna regla de la especificación maestra) |
| Estado | **APROBADA** |

**Texto aprobado (literal):**
> D6/D7 queda resuelto: Mecanismo C: reloj más registro transaccional. Autoridad temporal: reloj de la base de datos. Base ocupada: no revelar resultados y permitir reintento. Registro anticipado: sí, mediante tarea idempotente. Sin versión de reserva: rechazar asignación y registrar el motivo. Estas decisiones quedan aprobadas por la usuaria. Respeta su alcance y no las amplíes.

**Correspondencia con el diseño** (`vortice/plan-implementacion:docs/vortice/plan-implementacion/DECISIONES_BLOQUEANTES.md` §1.1 y §1.5):

| Elemento aprobado | Diseño (§1.1) |
|---|---|
| Mecanismo C: reloj más registro transaccional | C-1 a C-6 |
| Reloj de la base de datos | C-1 |
| No revelar y permitir reintento | Falla cerrada (§1.4 punto 3) |
| Registro anticipado mediante tarea idempotente | «Escritura anticipada, opcional (PROPUESTA)»: pasa a aprobada |
| Rechazar asignación y registrar el motivo | C-5 (`sin_version_disponible`) |

**Quedan pendientes y NO forman parte de esta aprobación:** el texto del aviso al estudiante cuando la base está ocupada, el presupuesto de espera de `revelar` (se fija tras medir en un entorno remoto, A1) y los umbrales A6.

**Trazabilidad histórica (no se alteran):**
- `DECISIONES_BLOQUEANTES.md` y el plan decían «PENDIENTE» en los commits `f6a042a` (14:49), `51e303a` (15:21) y `5c0a21b` (15:33, hora de Chile del 2026-11-10); eso era correcto en esa fecha.
- Mensajes anteriores de la usuaria: 2026-11-08 20:36 UTC («D6/D7: PENDIENTE. No está aprobada la regla “publicar = escribir primero la exposición”») y 2026-11-10 18:33:36 UTC («Las decisiones D6/D7 y las autorizaciones de construcción siguen pendientes de mi aprobación expresa»).
- `REGISTRO_H0_H1.md` (línea 6) registró la aprobación el 2026-11-10 sin citar la fuente; esta entrada la cita.
- Los resultados de E0 (`2edf702`) que usan los identificadores D6/D7 (`ANALISIS_D6_D7_PUBLICACION.md`, `REGISTRO_RIESGOS.md`, `MATRIZ_RESULTADOS.md`) son evidencia histórica y no se editan.

---

## E-002 — Decisiones de H3a (D1–D7), aprobadas antes de implementar

| Campo | Valor |
|---|---|
| Fecha | **2026-11-13, 05:03:06 UTC** (autorización formal de H3a), con D5 pendiente; la propuesta técnica previa es del 04:57:14 UTC |
| Aprobadas por | La usuaria («la dirección») |

| ID | Decisión | Tipo |
|---|---|---|
| D1 | Siete tablas: `practice_sessions`, `practice_answers`, `knowledge_evidence`, `evidence_voids`, `mastery_policies`, `knowledge_state_events`, `student_knowledge_state`. Se mantienen las exclusiones (`retention_schedule`, `progression_continuations`, `recommendation_log`, `governance_audit`) | T |
| D2 | H3a implementa solo el origen de práctica. La evidencia de evaluaciones se resolverá en H4 por reconstrucción de la tabla o arquitectura equivalente, que deberá especificarse y aprobarse en esa etapa; no autoriza componentes de H4 | T |
| D3 | `EvidenciaLiberada` como contrato obligatorio de entrada de `evaluar`; modificación delimitada de `shared/dominio.ts` y `script/dominio.check.ts`; sin cambios a la política ni a sus parámetros pendientes | T |
| D4 | Endurecimientos de integridad en la base: dominio publicado al generar evidencia; coherencia sesión–dominio–evidencia; verificación de fecha, secuencia y día; unicidad de secuencias; sin respuestas en sesiones cerradas | T |
| D5 | **Pendiente** en este momento (cerrada en E-003) | A/T |
| D6 | Tiempos con `REAL`, consistente con el reloj y las migraciones existentes | T |
| D7 | Migración `0004_evidencia_practica.sql`. R3 y H4 usarán el siguiente número libre cuando se autoricen; no se reservan números | T |

## E-003 — Resolución de D5 (D5.1–D5.5) y autorización de implementar H3a

| Campo | Valor |
|---|---|
| Fecha | **2026-11-13, 10:08:44 UTC** («Autorización definitiva de implementación H3a»), tras la propuesta de cierre de D5 |
| Aprobadas por | La usuaria |

| ID | Decisión | Tipo |
|---|---|---|
| D5.1 | **Evidencia anulada:** existe anulación si existe una fila en `evidence_voids`; la evidencia nunca se elimina; se entrega al motor con `anulada: true` y `evaluar()` la excluye; la anulación de una pregunta no anula evidencias anteriores; la trazabilidad queda en `evidence_voids`. El servicio de anulación (IMP-035) y los eventos de anulación son H3b | T/A |
| D5.2 | **Familia retirada:** alcance de familia de DB-4 (todas las versiones retiradas); el mapeo usa el tipo de retiro de la versión que originó la evidencia; `otro` = sin defecto; detector de solo lectura de evidencias de versiones retiradas por defecto sin anulación explícita (informa; no anula ni excluye). **N17 permanece pendiente** (no se fija `retired_counts`) | T/A |
| D5.3 | **`mastery_policies`:** estados `borrador` y `aprobada`; nace en borrador; única transición `borrador → aprobada`; aprobada inmutable; sin retiro; vigente = mayor versión aprobada; los borradores se descartan; aprobar exige `approved_by`, `approved_at` y los ocho parámetros de `PoliticaEjecutable` completos, tipados y no nulos, validados también en la base. Sin servicio de aprobación ni roles (IMP-034, H3b) | T |
| D5.4 | **Sesiones:** una abierta por estudiante y dominio sin importar el propósito; abrir otra cierra la anterior en un lote atómico; sin caducidad automática; una sesión cuya versión dejó de estar publicada se rechaza como `sesion_obsoleta`. **O2 permanece pendiente** | T/A |
| D5.5 | **Proyección:** se omiten `correct_families`, `wrong_families`, `assisted_count` y `mastered_at` (sin definiciones inventadas; la evidencia permite reconstruirlos); `uncertainty_reason` admite `pocas_evidencias`, `solo_con_ayuda`, `contradictoria`, `ruptura`, `retencion_vencida` y `banco_insuficiente` | T |

## E-004 — Ajustes de regresión autorizados durante H3a

Aprobados por la usuaria el 2026-11-13 (11:21:51, 11:54:01 y 11:57:01 UTC), cada uno con alcance cerrado:
- Listas esperadas de migraciones en `script/banco-db.check.ts` (línea 82) y `script/catalogo-db.check.ts` (línea 20), ahora con `0004_evidencia_practica.sql`.
- `script/integridad-db.check.ts`: directorio `dirHasta0003` para I4 (0003 sobre una base poblada) y para I10 (los 12 triggers de 0003), sin modificar `huella` ni otros casos.

Tipo: L (el conjunto de migraciones del directorio cambió). Detalle: `REGISTRO_H3A.md` §3.

## E-005 — Aceptación formal de H3a

| Campo | Valor |
|---|---|
| Fecha | **2026-11-13, 13:00:09 UTC** («H3a formalmente aceptado») |
| Rama y commit | `vortice/h3a-evidencia`, **`0fd4324`** |
| Aceptado por | La usuaria |

**Implementado y aceptado:** IMP-012, IMP-030, IMP-031, IMP-032 e IMP-033 (contrato `EvidenciaLiberada`; migración `0004`; práctica atómica e idempotente; filtro único; reconstrucción, comparación y reparación de la proyección). Evidencia de verificación: `REGISTRO_H3A.md` §2 (4 checks nuevos, 55 casos; `check:vortice` ×2 idénticos; mutaciones h3a 113/113 y las anteriores sin cambios).

**Limitaciones declaradas (L)**, de `REGISTRO_H3A.md` §6: solo libSQL embebido, sin `sqld` ni Turso; `0004` no aplicada en ningún entorno real; `tsconfig` no incluye `script/`; un reenvío idempotente devuelve el estado proyectado de hoy; `rehacerProyeccion` no borra filas sin evidencia; una versión retirada por defecto sin anulación explícita sigue contando; sin política aprobada no se calcula estado; sin caducidad de sesión.

**Pendiente expresamente:** H3b (IMP-034, IMP-035, IMP-036), H4 (incluida la arquitectura de la evidencia de evaluación), IMP-022.

## E-006 — Autorización de la regularización documental y de H1b-1

| Campo | Valor |
|---|---|
| Fecha | **2026-11-13, 13:40:06 UTC** («Instrucción formal»: Paquete 0, regularización documental y H1b-1) |
| Aprobada por | La usuaria |

Autoriza únicamente: (1) esta regularización documental (E-001 a E-006, referencias de migraciones); (2) H1b-1 = IMP-015, IMP-016 e IMP-017, solo con comportamientos de definición normativa suficiente. **No autoriza** H3b, H1b-2 (IMP-014), H4, IMP-022, push, merge ni entornos reales.

**Decisiones que siguen pendientes, sin valor por defecto** (Paquete 0, §3 y §4): O1, O2, O3, N16, N17, escenario 3 (`error_repaired_counts`), escenarios 4 y 10 (`demote_wrong_families`), O4 y definición de roles, P-H2-3, P7, P8, P16, P17, P20-v, C16/D3/Q1, C21, N2, C6/N4, C20, y las demás identificadas en el Paquete 0.

## E-007 — Fe de erratas de referencias de migraciones

Estado real: `0001_catalogo.sql`, `0002_banco.sql`, `0003_integridad_catalogo.sql` y `0004_evidencia_practica.sql` (todas creadas y aceptadas; ninguna aplicada en un entorno real). Siguiente número libre: `0005`, **sin reservar** para R3, H4 ni otro componente (decisión D7).

| Referencia desfasada | Dónde | Corrección |
|---|---|---|
| IMP-030 «`0003_evidencia.sql`» | `BACKLOG_IMPLEMENTACION_P0E.md` | Es `0004_evidencia_practica.sql` (actualizado en el backlog, rama `vortice/plan-implementacion`) |
| IMP-040 «`0004_p0e.sql`» | `BACKLOG_IMPLEMENTACION_P0E.md` | Número libre al momento de su autorización (actualizado en el backlog) |
| R3 «`0004_recursos_origen.sql` (o el número que corresponda)» | `docs/vortice/auditoria-recursos/CIERRE_DECISIONES_RECURSOS.md` §6 | Debe leerse como «siguiente número libre al autorizarse». **No se edita** ese documento de un hito cerrado; esta entrada lo corrige por referencia |
| `0003_integridad_catalogo.sql` sin entrada | Backlog | Corrección de integridad de H2 (`REGISTRO_H2_INTEGRIDAD.md`); anotado en el backlog |
