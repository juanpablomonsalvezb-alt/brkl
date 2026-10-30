# Documentación P0-E y modelo de conocimiento: índice

**Rama:** `vortice/integracion`. Solo documentación. Este índice no aprueba ni autoriza nada.

## Qué documento manda en cada materia

Cada materia tiene **una sola** fuente normativa. Los demás documentos la citan, no la repiten.

| Materia | Documento normativo | Ubicación |
|---|---|---|
| Reglas evaluativas aprobadas: intentos, reloj, cierres, recuperación, revisión | `ESPECIFICACION_MAESTRA.md` | Rama `docs/p0-e-maestro`, carpeta `docs/P0-E/`, commit `0e1f64f`. **No está en esta rama y no se modificó.** PR de correcciones `docs/p0-e-correcciones` aparte. |
| Modelo de conocimiento K1–K14 y piloto | [`DOMINIO_POR_CONOCIMIENTO.md`](DOMINIO_POR_CONOCIMIENTO.md) | Esta carpeta |
| P21, bandas 70/80, cuatro indicadores y experiencia de progreso | [`PROGRESO_Y_PROGRESION.md`](PROGRESO_Y_PROGRESION.md) | Esta carpeta |
| Propuestas P7, P8 y P16 | [`DECISIONES_PARA_APROBAR.md`](DECISIONES_PARA_APROBAR.md) (resumen) y [`DECISIONES_P7_P8_P16_P21.md`](DECISIONES_P7_P8_P16_P21.md) (detalle técnico; su P21 es historial) | Esta carpeta |
| Registro de contradicciones y preguntas a la dirección | [`CONTRADICCIONES_Y_PREGUNTAS.md`](CONTRADICCIONES_Y_PREGUNTAS.md) | Esta carpeta |
| Trazabilidad de cada decisión | [`TRAZABILIDAD.md`](TRAZABILIDAD.md) | Esta carpeta |
| Evidencia de pruebas técnicas | [`RESULTADOS_T1_T5.md`](RESULTADOS_T1_T5.md) | Esta carpeta |
| Resumen divulgativo (**no normativo**) | [`APRENDIZAJE_TEORICO_VORTICE.md`](APRENDIZAJE_TEORICO_VORTICE.md) y `.docx` | Esta carpeta |

**Si dos documentos se contradicen:** manda la especificación maestra hasta que la dirección ratifique el cambio, y el conflicto se registra en `CONTRADICCIONES_Y_PREGUNTAS.md`.

## Clasificación usada

| Estado | Significado |
|---|---|
| **APROBADO** | Regla aprobada en la especificación maestra. |
| **COMUNICADA** | Decisión transmitida por la dirección, pendiente de ratificación formal o revisión independiente. No está construida. |
| **PROPUESTA** | Recomendación sin aprobar. |
| **PREGUNTA ABIERTA** | Falta una decisión. No se inventa la respuesta. |
| **RIESGO TÉCNICO** | Duda técnica por verificar o limitación conocida. |
| **EXISTE EN CÓDIGO** | Verificado por lectura en esta rama. No implica que funcione en producción ni que cumpla la regla. |

## Límite de autorización

Ningún documento de esta carpeta autoriza implementación, esquema, migraciones, despliegues, merge a `main` ni cambios de producción. Eso requiere autorización nueva y expresa de la dirección, después de la revisión independiente de ChatGPT.
