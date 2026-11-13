# Registro H1b-1: ventanas, publicabilidad y máquina de estados puras

**Rama:** `vortice/h1b1-p0e-puro`, desde `0fd4324` (H3a aceptado). **Local, sin push ni merge.**
**Alcance autorizado (2026-11-13, 13:40 UTC):** IMP-015, IMP-016 e IMP-017, solo con los comportamientos de definición normativa suficiente. Funciones **puras** de `shared/`: sin base de datos, sin migraciones, sin servidor, sin rutas, sin reloj del sistema (`ahora` llega en segundos UTC).
**No autoriza:** H1b-2 (IMP-014), H3b, H4, IMP-022 ni cambios a hitos aceptados.

## 1. Reglas aplicables, pendientes y ambigüedades (identificadas antes de codificar)

Fuentes: `docs/P0-E/ESPECIFICACION_MAESTRA.md` (`0a0ccaa`, en `docs/p0-e-maestro`), `DISENO_TECNICO_PROPUESTO_MAQUINA_ESTADOS.md` §3–§5 (propuesta, no normativa), `BACKLOG_IMPLEMENTACION_P0E.md` IMP-015 a 017 (rama `vortice/plan-implementacion`), `shared/p0e-estados.ts` (IMP-006, aceptado).

### Implementado (aprobado)

| IMP | Regla | Fuente | Dónde |
|---|---|---|---|
| 016 | T = fin del módulo a las 23:59 en hora de Chile | Maestra §3 «Reloj» | `ventanas.finDeModulo` |
| 016 | Extensión automática de 48 horas **reales**, calculadas en UTC, para todos | Maestra §2 y §3 «Reloj» | `ventanaOrdinaria.finExtension` |
| 016 | review_at = T + 49 h (la pauta no se muestra hasta terminar la ventana con la extensión y una hora más) | Maestra §2 y §3 «Revisión» | `ventanaOrdinaria.revisionDesde` |
| 016 | Zona horaria persistida explícitamente; pruebas de cambio de horario de America/Santiago | Maestra §3 «Reloj» | `VentanaOrdinaria.zonaHoraria`; `ventanas.check` V3–V6 |
| 016 | Después del fin de la extensión, el envío se rechaza (409), sin gracia | Maestra §3 «Reloj»; P15 | `envioAceptable`, `extensionAgotada` |
| 017 | Se publica si la instancia está **cerrada** y el reloj alcanzó **su** `review_at`; no se espera a otros estudiantes | Maestra §3 «Revisión»; **P19-E1** (aprobado 2026-11-08) | `publicable` |
| 017 | «Cerrada» = conjunto único `ESTADOS_CERRADOS` (`cerrada_aprobada`, `cerrada_agotada`, `vencida`) | IMP-006; P15 (el vencimiento cierra) | `publicable` usa `esEstadoCerrado` |
| 015 | Intentos ordinarios: E1, E3, E4 = 2; E2 = 3; se consume al **enviar**, no al abrir | Maestra §3 «Intentos ordinarios» | `INTENTOS_ORDINARIOS`, `enviarIntento` |
| 015 | Un solo intento activo; recargar retoma el mismo intento; abandonar no consume | Maestra §2, §3 | `iniciarIntento` |
| 015 | Aprobar cierra la instancia de inmediato; agotar los intentos sin aprobar la cierra | Maestra §2 | `enviarIntento` |
| 015 | **P15** (aprobado 2026-10-24): al alcanzar T+48 h la instancia queda `vencida` aunque queden intentos; el intento activo expira sin consumir; se registra la causa | Maestra §3 «Cierre por vencimiento» | `vencer` |
| 015 | Envío repetido: resultado ya registrado o conflicto, nunca un segundo consumo | Máquina de estados §4, inv. 2–3 | `enviarIntento` |
| 015 | Sin resurrección: un estado final no vuelve a `disponible` ni a `en_curso` | Máquina de estados §3.1, inv. 4 | `iniciarIntento`, `vencer`; `p0e.check` M8, X1 |
| 015 | «Aprobado» cierra el proceso con resultado aprobado | Maestra §6 | `efectoProceso: "aprobado"` |

### Pendiente: **excluido** (no se infiere ni se reemplaza)

| Elemento | Motivo | Qué hace el código |
|---|---|---|
| Estados de instancia `cerrada_por_excepcion`, `en_revision`, `revision_disponible` | Sin ratificar (P18-v); `en_revision` y `revision_disponible` son «derivado o explícito» sin decidir | No existen; la revisión se deriva con `publicable` |
| Estado de intento `cancelado_por_cierre` | Solo aplica a cierres por excepción (no aprobadas) | No existe |
| Estados de proceso `recuperacion_pendiente`, `recuperacion_abierta`, `reprobado`, `cerrado_sin_resolucion`, `en_espera_excepcion` | P12/P17 (intentos de recuperación), P20-v, P16, P21 y «vencimiento sin intentos enviados» pendientes | Tras agotar o vencer, el efecto sobre el proceso se devuelve como `"sin_definir"` |
| Recuperación, lotes, sustitución, excepciones, formularios externos, solicitud pendiente al vencer | P17, P20-v, P25, P18-v, P8 | No implementados |
| Pauta de instancia vencida solo si hubo un intento | Propuesta no aprobada (maestra §12) | No implementada (`publicable` publica por el texto aprobado) |
| Aviso 24 h antes del fin de la ventana | Canal pendiente (P11); no pertenece a IMP-016 | No implementado |
| Umbral de aprobación | C16/Q1, decisión D3 | La máquina recibe `aprobado` ya corregido |
| Ventanas de recuperación y de lotes | P20-v | No implementadas |

### Ambigüedades de texto (no bloquean; resueltas de la forma indicada, a consideración de la dirección)

1. **Instante exacto T+48 h.** P15 (aprobado) dice «**al alcanzar** T+48 horas, la instancia se marca vencida»; maestra §3 «Reloj» dice «**después de** T+48 horas, un envío tardío se rechaza». Se sigue P15: en `ahora = T+48 h` el envío **no** se acepta. Cambiarlo es un solo comparador (`envioAceptable`, `extensionAgotada`, `vencer`).
2. **T = 23:59:00** (como está escrito, minuto) y no 23:59:59.
3. **23:59 ambiguas.** El sábado del cambio de abril los relojes retroceden a las 24:00, de modo que las 23:59 de ese día ocurren dos veces (2026-04-04 y su equivalente de 2027). Se lanza `HoraLocalInvalida` en vez de elegir una; un módulo que termine ese día requiere una decisión. En 2026 y 2027 es el único caso.
4. **Dependencia con el calendario:** `ventanaOrdinaria` recibe el día de fin como entrada («YYYY-MM-DD»); no lo calcula del calendario (`server/calendarUtils.ts` no se toca).

## 2. Implementación

| Archivo | Contenido |
|---|---|
| `shared/ventanas.ts` (nuevo) | IMP-016 |
| `shared/publicable.ts` (nuevo) | IMP-017 |
| `shared/p0e.ts` (nuevo) | IMP-015: `nuevaInstancia`, `iniciarIntento`, `enviarIntento`, `vencer`, `violaciones` (invariantes) |
| `script/ventanas.check.ts`, `script/publicable.check.ts`, `script/p0e.check.ts` (nuevos) | 9 + 6 + 11 casos |
| `script/mutar.ts` | Grupo `h1b1` (44 mutaciones) |
| `docs/vortice/construccion/REGISTRO_H1B1.md` | Este registro |

Sin migraciones ni cambios a `shared/politica.ts`, `shared/dominio.ts`, `shared/p0e-estados.ts` ni a ningún archivo de hitos aceptados. Una guarda técnica de la máquina (`intento_duplicado`: el id de un intento no se reutiliza) la reveló la prueba exhaustiva; no es una regla de negocio.

## 3. Pruebas y resultados

| Verificación | Resultado |
|---|---|
| `ventanas.check` | 9 casos: oráculo independiente con instantes UTC calculados a mano (verano UTC−3, invierno UTC−4, cambios de abril y septiembre de 2026), barrido de 730 días (2026 y 2027), 2 días ambiguos exactos |
| `publicable.check` | 6 casos: tabla de verdad, bordes `ahora = review_at` y `review_at − 1 ms`, estados no cerrados, falla cerrada, independencia de otras instancias |
| `p0e.check` | 11 casos: escenarios de la maestra y de P15, e **comprobación exhaustiva**: todas las secuencias de eventos hasta profundidad 7 (2538 estados distintos y 294 408 transiciones) para 1, 2 y 3 intentos, con tiempos antes, en y después de T+48 h; los invariantes se cumplen en cada estado |
| Lo pendiente no está implementado | `p0e.check` B1: ningún estado ni transición excluidos aparece en el código |
| Cada check nuevo ×30 | 30/30 con salida 0, los tres |
| Mutaciones `h1b1` | **44/44 detectadas** (salida 1) |
| `check:vortice` ×2 | salida 0 las dos, 47 «ok», salidas idénticas |
| Mutaciones h0 / h1 / h2 / banco / integridad / r1 / r2 / h3a | 10/10, 22/22, 40/40, 39/39, 24/24, 21/21, 34/34, 113/113 |
| Nota sobre `integridad` | En la corrida general una mutación (`0003 kp_id_inmutable`) terminó con salida 143 (SIGTERM externo, no una aserción) y quedó como «no detectada»; se repitió el grupo completo aparte: **24/24 detectadas** |
| `tsc` / build | 0 / 0 |

### Mutantes equivalentes retirados (con prueba)
- «día inexistente aceptado» (quitar la comparación del día en `instanteLocal`): un día inválido (`02-30`, `03-00`) desborda al mes o año siguiente, y la comparación del mes ya lo rechaza; el caso solo del día es inalcanzable.
- «se excede el máximo al iniciar» (`>=` → `>`): una instancia no final con `consumidos = max` no existe (el último envío la cierra); la guarda es defensiva.

## 4. Revisión de seguridad y efectos secundarios

Funciones puras y deterministas; sin entradas de usuario hacia SQL, sin red ni disco, sin credenciales; sin lectura del reloj del sistema (lo comprueban `ventanas.check` V9, `publicable.check` U6 y `p0e.check` B1). `publicable` falla cerrado ante entradas no numéricas. Efecto sobre lo existente: ninguno (no se importan desde `server/`; solo `publicable` importa `shared/p0e-estados.ts`, sin modificarlo). Límite: la zona horaria depende de los datos de la plataforma (ICU de Node); los casos de abril y septiembre de 2026 y 2027 están fijados en las pruebas.

## 5. Limitaciones y pendientes

- Las decisiones pendientes siguen sin resolver y sin valor por defecto (O1, O2, O3, N16, N17, escenarios 3, 4 y 10, O4, P7, P8, P16, P17, P20-v, P21, C16 y las demás del Paquete 0). Este hito no las toca ni las necesita.
- La máquina cubre solo la instancia **ordinaria**; IMP-041 a 044 (H4a) la consumirán, además de las decisiones de la sección 1.
- Las ambigüedades 1 a 3 de la sección 1 requieren confirmación de la dirección antes de integrarse en H4.

## 6. Estado

| | |
|---|---|
| Implementado | IMP-015, IMP-016 e IMP-017 (alcance de la sección 1) |
| Probado | Sección 3 |
| Aceptado | Nada: pendiente de la revisión y aceptación formal de la usuaria |
