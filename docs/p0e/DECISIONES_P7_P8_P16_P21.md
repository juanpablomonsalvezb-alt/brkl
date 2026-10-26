# P0-E — Propuesta de decisiones P7, P8, P16 y P21

**Estado:** PROPUESTA. Nada de este documento está aprobado ni implementado. No autoriza migraciones ni cambios de esquema.
**Rama:** `vortice/integracion`. **Fuente de verdad del resto de P0-E:** rama `docs/p0-e-maestro`, `docs/P0-E/ESPECIFICACION_MAESTRA.md`.
**Base de código descrita:** commit `8e67e08` o posterior en esta rama.

Cada punto separa lo que **requiere aprobación académica** (A) de lo que es **decisión técnica** (T).

## Contexto del código actual (verificado)

- `module_evaluations`: `evaluation_number` 1–4, `form_url` (formulario externo), `questions_json` / `html_content` (cuestionario en plataforma), `passing_score` (60 por defecto), `is_required`. No hay tipo ni función de la evaluación.
- `evaluation_progress`: una fila por envío (`score`, `total_correct`, `answers_json`, `passed`, `completed_at`). No hay número de intento, estado de intento, ventana ni cierre. Las entregas de formulario guardan `answers_json = {"estado": "pendiente_revision"}` y luego `aprobada_validada` o `rechazada_requiere_correccion` con quien valida.
- Progresión: `server/vortice.ts` (`checkModuleAccess`) abre el módulo N+1 solo si existe un `evaluation_progress.passed = true` de la evaluación 2 del módulo N.
- Etiquetas: el texto «Evaluación Formativa 1/2» está fijo en `server/routes.ts` (`/api/modules/:n/evaluations`) y «Evaluación Formativa N» en `client/src/pages/CoursePlayer.tsx`; no proviene de datos.

---

## P7 — Registros históricos

**Problema.** Hay intentos registrados antes de P0-E sin número de intento, sin ventana y sin cierre. El sistema nuevo cuenta intentos, cierra evaluaciones y habilita la pauta; si interpreta mal el historial, podría bloquear a estudiantes, revelar pautas o reescribir resultados.

**Alternativas.**
1. *Corte limpio:* el historial queda intacto y fuera del conteo; el sistema nuevo empieza de cero para cada evaluación.
2. *Reconstrucción:* asignar números de intento y cierres a las filas antiguas.
3. *Corte con equivalencia mínima:* historial intacto; solo un intento antiguo aprobado se reconoce como aprobación para la progresión.

**Recomendación: alternativa 3.**
- No se modifica, renumera ni recalcula ninguna fila existente de `evaluation_progress` (T).
- Las filas antiguas no cuentan para el límite de intentos ni generan cierres retroactivos (A).
- Un intento antiguo con `passed = true` sigue habilitando la progresión, como hoy (A), para no bloquear a quien ya aprobó.
- La pauta de una evaluación con solo historial antiguo no se habilita automáticamente; seguirá la regla de ventana cuando esa evaluación tenga una ventana nueva (A).

**Consecuencias.** Nadie pierde avances ni recibe intentos inventados. Un estudiante con intentos fallidos antiguos tendrá el máximo completo en el sistema nuevo. El reporte histórico y el nuevo conviven y deben distinguirse en pantalla.

**Tablas y reglas afectadas.**
- `evaluation_progress`: se agrega `attempt_id` (nulo en filas antiguas); las filas antiguas se identifican por `attempt_id IS NULL` (T). Sin `UPDATE` sobre filas existentes (T).
- `evaluation_attempts`, `evaluation_closures`: solo reciben datos nuevos (T).
- `checkModuleAccess`: acepta `passed = true` antiguo o un cierre por aprobación nuevo (T, sujeto a A).

**Requiere aprobación académica:** que lo antiguo no cuente para el límite; que una aprobación antigua habilite la progresión; trato de la pauta de evaluaciones solo históricas.
**Técnico:** columna `attempt_id` nula, ausencia de reescritura, consultas que distinguen antiguo y nuevo.

---

## P8 — Formularios externos

**Problema.** Algunas evaluaciones se rinden en formularios externos (Google Forms). El servidor no puede corregirlas ni conocer el resultado real; hoy la entrega queda pendiente y una persona distinta del estudiante la valida.

**Alternativas.**
1. Mantener la validación humana como única vía para formularios, sin ventanas ni intentos (estado actual).
2. Aplicarles las mismas ventanas que a las evaluaciones en plataforma, con validación humana del resultado.
3. Eliminar los formularios y migrar todo a cuestionarios en plataforma.

**Recomendación: alternativa 2, temporal hasta completar la alternativa 3.**
- La entrega del formulario solo se acepta dentro de la ventana de la evaluación (T, + P3 aprobado); después, 409 como en P5.
- La entrega queda `pendiente_revision`; ningún resultado es definitivo hasta la validación humana (A, criterio de partida).
- La validación aprobada cierra la evaluación por aprobación; el rechazo no consume intento y deja la evaluación abierta si la ventana sigue vigente (A).
- Quien valida debe ser distinto del estudiante (ya implementado) y queda registrado con fecha y motivo (T).
- Plazo máximo para validar después del cierre de la ventana: pendiente (A).

**Consecuencias.** Los formularios dejan de ser una vía sin plazo. Las validaciones tardías no cambian el plazo del estudiante. Se mantiene una carga operativa de revisión hasta migrar a la plataforma.

**Tablas y reglas afectadas.** `evaluation_progress.answers_json` (estado del formulario, ya existe); `evaluation_windows` (ventana también para formularios); `evaluation_closures` (cierre por validación aprobada, causa `aprobacion`); ruta `POST /api/evaluations/:id/complete` (rechazo tardío 409).

**Requiere aprobación académica:** efecto de aprobación y rechazo; plazo máximo de validación; calendario de migración a la plataforma.
**Técnico:** control de ventana en `/complete`, registro del validador, cierre por validación.

---

## P16 — Clasificación de las cuatro evaluaciones por módulo

**Problema.** El código llama «Evaluación Formativa» a las cuatro evaluaciones, pero la evaluación 2 bloquea la progresión del módulo. La etiqueta no puede inferirse del número ni del código; además decide si hay recuperación, cómo se muestra el resultado y si califica.

**Alternativas.**
1. Las cuatro formativas; ninguna bloquea (contradice la progresión vigente).
2. E1, E3 y E4 formativas; E2 «de cierre del módulo» (sumativa o de habilitación), con recuperación.
3. Las cuatro sumativas, con recuperación en todas.

**Recomendación: alternativa 2, con la clasificación guardada como dato y no como texto fijo.**

| Evaluación | Función propuesta | Etiqueta propuesta | Resultado visible | Recuperación | Bloquea progresión |
|---|---|---|---|---|---|
| E1 | Formativa de diagnóstico y práctica | «Práctica 1» | «Logrado» / «No logrado» | No | No |
| E2 | Cierre del módulo (habilita el siguiente) | «Evaluación de cierre» | «Aprobado» / «No aprobado» | Sí, única (P12) | Sí |
| E3 | Formativa de profundización | «Práctica 2» | «Logrado» / «No logrado» | No | No |
| E4 | Formativa de integración | «Práctica 3» | «Logrado» / «No logrado» | No | No |

- No se clasifica automáticamente ninguna evaluación: la clasificación de cada fila se carga explícitamente (T).
- Si la dirección decide que E2 es «sumativa» (califica) o «de habilitación» (no califica, solo habilita), cambia la etiqueta y el efecto en la nota, no el flujo de recuperación (A).
- Las etiquetas definitivas, y si E1/E3/E4 aparecen como «No logrado» o «No aprobado», requieren aprobación (A, ver P24).

**Consecuencias.** Se elimina la contradicción entre etiqueta y bloqueo. La recuperación formal queda acotada a E2, con carga editorial y tutorial razonable. E1/E3/E4 alimentan el repaso por contenidos.

**Tablas y reglas afectadas.**
- `module_evaluations`: columna nueva `funcion` (`practica` | `cierre`), sin valor por defecto que clasifique automáticamente; mientras sea nula, la interfaz muestra «Evaluación N» sin calificativo (T).
- `server/routes.ts` y `client/src/pages/CoursePlayer.tsx`: dejan de usar «Formativa» fijo y leen la función (T).
- `checkModuleAccess`: bloquea por la evaluación con `funcion = cierre`, no por el número 2 (T, sujeto a A).

**Requiere aprobación académica:** función de cada evaluación; si E2 califica; etiquetas visibles; si E1/E3/E4 tienen recuperación.
**Técnico:** columna `funcion` sin autoclasificación, lectura de la etiqueta desde datos, bloqueo por función.

---

## P21 — Progresión al agotar E2 sin aprobar

**Problema.** Si un estudiante agota los intentos de E2 (y su recuperación única) sin aprobar, hoy el módulo siguiente queda bloqueado sin salida. El criterio de partida exige que esto no repruebe automáticamente el módulo y que tampoco permita saltarse requisitos.

**Alternativas.**
1. Desbloqueo automático con acompañamiento (contradice «no saltarse requisitos»).
2. Bloqueo permanente (reprobación de hecho).
3. Bloqueo con salida por decisión humana auditada, sin efecto automático en la nota del módulo.

**Recomendación: alternativa 3.**
1. Agotar E2 en la fase ordinaria abre un caso de tutoría y la recuperación única (P6, P12, aprobado).
2. Si la recuperación se aprueba, se habilita el módulo siguiente (aprobado).
3. Si la recuperación se agota o vence sin aprobar, el proceso de E2 queda «Reprobado» (aprobado), pero:
   - el módulo siguiente **sigue bloqueado** (no se saltan requisitos) (A);
   - el sistema **no** marca el módulo ni el curso como reprobados (criterio de partida) (T);
   - se abre automáticamente una solicitud de **revisión académica** del caso (T);
   - solo la dirección o coordinación (persona distinta de quien solicita) puede autorizar un **avance con acompañamiento**, con plan de repaso por contenidos y motivo registrado (A);
   - la promoción del año se decide fuera del sistema, de forma deliberativa, con el registro como evidencia (A, normativa por confirmar).

**Consecuencias.** Nadie queda reprobado del módulo por una regla automática, y nadie avanza sin una decisión humana registrada. Requiere capacidad de coordinación para resolver las revisiones a tiempo.

**Tablas y reglas afectadas.**
- `evaluation_recoveries`: estado final de la recuperación (T).
- Nueva tabla `module_progression_overrides` (estudiante, módulo, autorizado por, motivo, plan de acompañamiento, fecha) (T).
- `checkModuleAccess`: habilita el módulo N+1 si E2 está aprobada (ordinaria o recuperación) **o** existe una autorización de avance (T, sujeto a A).
- `tutoring_cases`: caso abierto automáticamente al agotar E2 (T).

**Requiere aprobación académica:** si existe la vía de avance con acompañamiento; quién puede autorizarla; contenido mínimo del plan; relación con la normativa aplicable (régimen legal de Barkley por confirmar).
**Técnico:** tabla de autorizaciones auditadas, condición adicional en `checkModuleAccess`, apertura automática del caso.

---

## Resumen de aprobaciones requeridas

| ID | Decisión que necesita aprobación |
|---|---|
| P7 | Historial fuera del límite de intentos; aprobación antigua habilita progresión; pauta de evaluaciones solo históricas |
| P8 | Efecto de aprobación/rechazo del formulario; plazo máximo de validación; calendario de migración |
| P16 | Función de E1–E4; si E2 califica; etiquetas visibles; recuperación de E1/E3/E4 |
| P21 | Existencia y autorizadores de la vía de avance con acompañamiento; contenido del plan; encaje normativo |

Ninguna de estas decisiones se implementará sin aprobación expresa, ni sin autorización separada para la migración.
