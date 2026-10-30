# P0-E — Decisiones para aprobar: P7, P8, P16 y P21

**Estado de todas las decisiones: PROPUESTA.** Ninguna está aprobada ni implementada.
**Para quién:** la dirección del proyecto, que decide. ChatGPT revisa este documento de forma independiente.
**Qué no cambia:** la especificación maestra (`docs/p0-e-maestro`) y las reglas ya aprobadas (P1–P6, P12, P15, P18 base, P19, P20 base). No se modifica el esquema, los registros históricos ni producción.
**Base de código descrita:** rama `vortice/integracion`, commit `3bfb103` o posterior.
**Detalle técnico ampliado:** [`DECISIONES_P7_P8_P16_P21.md`](DECISIONES_P7_P8_P16_P21.md). **Índice y conflictos:** [`README.md`](README.md), [`CONTRADICCIONES_Y_PREGUNTAS.md`](CONTRADICCIONES_Y_PREGUNTAS.md).

Cómo leer cada punto:
- **Recomendación:** lo que propongo.
- **Alternativas:** otras opciones y lo que provocan.
- **Tu decisión:** la pregunta exacta que debes responder.
- **Cambios técnicos:** lo que habría que construir según lo que decidas.
- **Riesgos:** de aprobar y de rechazar.
- Las consecuencias marcadas **[A]** requieren tu aprobación académica; las marcadas **[T]** son técnicas.

---

## P7 — Historial de intentos anteriores a P0-E

**Situación.** Hay estudiantes que ya rindieron evaluaciones antes del sistema nuevo. Esos registros no tienen número de intento, plazo ni cierre.

**Recomendación.** Conservar el historial tal como está y empezar el conteo nuevo desde cero.
- **[T]** No se borra, renumera ni recalcula ningún registro antiguo. Se pueden distinguir porque no tendrán identificador de intento.
- **[A]** Los intentos antiguos **no cuentan** para el límite nuevo (2 en E1, E3 y E4; 3 en E2).
- **[A]** Si un estudiante **ya aprobó** una evaluación antes del cambio, esa aprobación **se respeta** para avanzar de módulo.
- **[A]** Una evaluación que solo tiene intentos antiguos **no muestra la pauta** automáticamente. La pauta seguirá la regla de plazo cuando esa evaluación tenga un plazo nuevo.

**Alternativas.**

| Alternativa | Consecuencia |
|---|---|
| Recomendada (historial intacto; conteo nuevo; aprobación antigua respetada) | Nadie pierde avances ni recibe intentos inventados. Quien falló antes vuelve a tener el máximo completo. |
| Contar los intentos antiguos para el límite | Algunos estudiantes empezarían con intentos ya gastados según reglas que no existían cuando rindieron. Habría que reconstruir números de intento, lo que contradice tu criterio de no inventar intentos. |
| Ignorar también las aprobaciones antiguas | Estudiantes que ya aprobaron E2 quedarían bloqueados y tendrían que rendir de nuevo. |

**Tu decisión.**
1. ¿Los intentos antiguos quedan fuera del límite nuevo? (sí / no)
2. ¿Una aprobación antigua sigue habilitando el avance? (sí / no)
3. ¿La pauta de una evaluación con solo intentos antiguos se habilita solo con un plazo nuevo? (sí / no)

**Cambios técnicos.**
- Si apruebas: agregar a los registros nuevos una referencia al intento (vacía en los antiguos). La regla de avance acepta una aprobación antigua o un cierre nuevo por aprobación.
- Si rechazas el punto 1: habría que reconstruir intentos antiguos. No lo recomiendo y requeriría otra especificación.

**Riesgos.**
- **Al aprobar:** quien falló varias veces antes del cambio tiene de nuevo todos los intentos.
- **Al rechazar:** bloqueos o intentos «gastados» sin haberlos tenido, y conflicto con tu criterio de no recalcular historial.

---

## P8 — Formularios externos

**Situación.** Algunas evaluaciones se rinden en formularios externos (Google Forms). La plataforma no puede corregirlos: solo sabe que el estudiante dice haber enviado. Hoy la entrega queda pendiente y una persona distinta del estudiante la valida.

**Recomendación.** Mantener temporalmente los formularios, con plazo y validación humana.

| Situación | Qué ocurre |
|---|---|
| Entrega **dentro del plazo** (hasta el fin de la extensión de 48 h) | Queda **pendiente de validación**. No hay resultado definitivo todavía. **[T]** |
| Entrega **fuera del plazo** | Se rechaza (error 409), igual que las evaluaciones en plataforma (P5, aprobada). **[T]** |
| Validación **aprobada** | La evaluación se cierra por aprobación y cuenta para el avance. **[A]** |
| Validación **rechazada**, con el plazo aún abierto | No gasta intento; el estudiante corrige y vuelve a enviar dentro del plazo. **[A]** |
| Validación **rechazada**, con el plazo ya cerrado | La evaluación queda vencida. En E2 abre la recuperación (P15, aprobada); en E1, E3 y E4 depende de P16. **[A]** |
| **Plazo para validar** | Propuesta: **5 días hábiles** después del fin de la extensión. Si se cumple sin validación, se avisa a coordinación. **El estudiante no pierde nada por la demora del validador.** **[A]** |
| Quién valida | Una persona del equipo distinta del estudiante, con fecha y motivo registrados (ya implementado). **[T]** |

**Alternativas.**

| Alternativa | Consecuencia |
|---|---|
| Recomendada (formularios con plazo + validación humana, temporal) | Los formularios dejan de ser una vía sin plazo; se mantiene la carga de revisión manual. |
| Sin plazo para formularios (como hoy) | Trato desigual frente a las evaluaciones en plataforma; las entregas tardías quedan abiertas. |
| Eliminar ya los formularios | Hay que pasar antes todas esas evaluaciones a la plataforma; mientras tanto no existirían. |

**Tu decisión.**
1. ¿Una validación aprobada cierra la evaluación por aprobación? (sí / no)
2. ¿Un rechazo con el plazo abierto permite reenviar sin gastar intento? (sí / no)
3. ¿Cuánto tiempo hay para validar? (propuesta: 5 días hábiles después de la extensión)
4. ¿Cuándo dejan de usarse los formularios externos? (fecha o condición)

**Cambios técnicos.** Control de plazo en el envío del formulario (rechazo 409 fuera de plazo); cierre por validación aprobada; aviso a coordinación cuando vence el plazo de validación; registro del validador (ya existe).

**Riesgos.**
- **Al aprobar:** carga de validación para el equipo; si no se cumple el plazo de validación, el estudiante espera su resultado (no pierde intentos).
- **Al rechazar:** resultados autodeclarados o entregas sin plazo; diferencia de trato con las evaluaciones en plataforma.

---

## P16 — Las cuatro evaluaciones de cada módulo

**Dependencia nueva.** K11 (feedback inmediato en prácticas) se apoya en esta clasificación, aún sin aprobar: C6.

**Situación.** El código llama «Evaluación Formativa» a las cuatro, pero E2 bloquea el avance al módulo siguiente. La etiqueta no puede deducirse del número.

**Recomendación.**

| Evaluación | Función | Nombre visible (propuesto) | Resultado visible | Efecto sobre la progresión | Recuperación |
|---|---|---|---|---|---|
| E1 | Práctica de diagnóstico | «Práctica 1» | «Logrado» / «No logrado» | No bloquea | No |
| E2 | Cierre del módulo | «Evaluación de cierre» | «Aprobado» / «No aprobado» | **Habilita el módulo siguiente** | **Sí, única** (P12, aprobada) |
| E3 | Práctica de profundización | «Práctica 2» | «Logrado» / «No logrado» | No bloquea | No |
| E4 | Práctica de integración | «Práctica 3» | «Logrado» / «No logrado» | No bloquea | No |

- **[T]** La función de cada evaluación se guardaría como dato explícito, nunca deducida del número. Mientras no esté definida, la pantalla mostraría «Evaluación N», sin calificativo.
- **[T]** **Por ahora no se cambia** la lógica que depende de `evaluation_number`: el avance sigue dependiendo de la evaluación número 2, como hoy.
- **[A]** Pendiente: si E2 **pone nota** (sumativa) o solo **habilita** el avance (sin nota).

**Alternativas.**

| Alternativa | Consecuencia |
|---|---|
| Recomendada (E2 de cierre; E1, E3 y E4 prácticas) | Desaparece la contradicción; la recuperación formal se concentra en E2. |
| Las cuatro formativas, ninguna bloquea | Contradice la regla vigente de que E2 habilita el avance. |
| Las cuatro sumativas, con recuperación | Cuatro veces más recuperaciones, versiones y trabajo de tutoría. |

**Tu decisión.**
1. ¿Apruebas la función de cada evaluación de la tabla? (sí / no / cambios)
2. ¿E2 pone nota o solo habilita el avance?
3. ¿Apruebas los nombres visibles («Práctica 1–3», «Evaluación de cierre»)?
4. ¿E1, E3 y E4 se muestran como «Logrado / No logrado»? (P24 sigue pendiente)

**Cambios técnicos.**
- Agregar la función a cada evaluación, como dato y sin autoclasificación.
- Mostrar el nombre desde ese dato, en vez del texto fijo «Formativa».
- Más adelante, que el avance dependa de la evaluación marcada «cierre» y no del número 2. Esto requeriría tu autorización aparte.

**Riesgos.**
- **Al aprobar:** hay que revisar y marcar cada evaluación existente; mientras falte el dato, se mostrará «Evaluación N».
- **Al rechazar:** se mantiene la etiqueta «Formativa» en una evaluación que bloquea el avance, lo que confunde a estudiantes y familias.

---

## P21 — Avance tras agotar E2 y su recuperación

**Estado: COMUNICADA por la dirección (2026-10-26), pendiente de ratificación.** Sustituye la propuesta anterior de este documento: bloquear el módulo siguiente hasta una autorización extraordinaria, que queda **SUSTITUIDA**.

**Resumen de la regla comunicada.**
1. E2 tiene 3 intentos ordinarios y luego una recuperación final única de 2 intentos.
2. Si el estudiante no alcanza el 70 % en ninguno, E2 queda «Reprobado».
3. Aun así **puede continuar** al módulo siguiente, después de ser informado de los contenidos que no logró y de recibir enlaces a sus recursos de repaso.
4. Continuar no cambia el resultado de E2.
5. Se registran el resultado, los contenidos pendientes y la decisión de continuar.

**Contradicción a ratificar.** La especificación maestra tiene **aprobada** la regla «agotar E2 sin aprobar no desbloquea automáticamente el módulo siguiente». La regla comunicada la reemplaza; requiere confirmación expresa (decisión **D2**).

Detalle completo, implicancias, identificación de contenidos no logrados y preguntas abiertas: [`PROGRESO_Y_PROGRESION.md`](PROGRESO_Y_PROGRESION.md). La especificación maestra exige revisar normativa antes de decidir: C15.

---

## Resumen

| Punto | Recomendación | Tu decisión |
|---|---|---|
| P7 | Historial intacto; conteo nuevo; aprobación antigua respetada | Tres respuestas sí/no |
| P8 | Plazo + validación humana; rechazo sin gastar intento; 5 días hábiles para validar | Efecto de aprobar y rechazar; plazo de validación; fin de los formularios |
| P16 | E2 «Evaluación de cierre»; E1, E3 y E4 «Práctica»; función como dato | Funciones, nota de E2, nombres visibles |
| P21 | COMUNICADA: continuar tras E2 «Reprobado», informado y con repaso; ver `PROGRESO_Y_PROGRESION.md` | D2 (reemplaza regla aprobada) y preguntas Q5–Q8 |

P7, P8 y P16 siguen en estado **PROPUESTA**; P21 está **COMUNICADA** y pendiente de ratificación. No se implementará nada sin tu aprobación expresa de cada decisión, la revisión independiente de ChatGPT y una autorización aparte para la migración.
