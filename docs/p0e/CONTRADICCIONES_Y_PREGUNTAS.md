# Informe de contradicciones y preguntas para la dirección

**Fecha:** 2026-10-30. **Base:** `vortice/integracion` en `117074f`; especificación maestra `0e1f64f`; `origin/landing/asi-trabajamos` en `dd66e9d` para textos publicados.
**Regla:** ninguna contradicción se resuelve aquí. Las compatibilizaciones son PROPUESTAS.

## 1. Contradicciones

### Ya registradas (detalle en `PROGRESO_Y_PROGRESION.md` §1)

| ID | Tema | Decide |
|---|---|---|
| C1 | Porcentaje real frente a «solo Aprobado/No aprobado» | D1 |
| C2 | Banda 70–79 frente al mismo principio | D1 |
| C3 | P21 continuar frente a «agotar E2 no desbloquea» | D2 |
| C4 | Repaso por objetivos frente a `review_at` | D1 |
| C5 | Porcentajes frente a «familia y tutoría ven estado» | D4 |

### Nuevas

| ID | Regla o fuente A | Fuente B | Conflicto | Propuesta, si existe | Decide |
|---|---|---|---|---|---|
| **C6** | Maestra §2: resultado inmediato solo «Aprobado/No aprobado», aplicable a toda evaluación; pauta solo tras la ventana (P19) | K11: feedback inmediato por contenido en E1, E3 y E4 | Con 2 intentos y ventana abierta, el feedback por contenido da pistas de la pauta. K11 además depende de P16, sin aprobar | Dar feedback inmediato en un banco de práctica separado, o aceptar expresamente el riesgo en E1, E3 y E4 | Dirección |
| **C7** | Maestra §2 y §3: E2 no revela información antes de `review_at` | K6, K12: mapa por contenido | Si las respuestas de E2 actualizan el mapa de inmediato, el mapa delata qué contenidos acertó | Excluir E2 del mapa hasta `review_at`, o no usarla como evidencia (N2) | Dirección |
| **C8** | K6: dominado = 2 correctas | `PROGRESO` §4 (PROPUESTA): no logrado = menos de 70 % por contenido; indicador «contenidos a reforzar» | Dos criterios por contenido pueden dar resultados opuestos | Ninguna; depende de N1 | Dirección |
| **C9** | P21: módulo siguiente abierto con E2 reprobada | K7, K12: «bloqueado» si falta una base | Un contenido puede estar bloqueado en el mapa dentro de un módulo abierto | Ninguna; N3 | Dirección |
| **C10** | Maestra: T por calendario común; lotes de recuperación | KST y mensaje «a tu ritmo»: ruta individual | La frontera es individual; módulo, ventanas y lotes son comunes. El mapa no reemplaza al calendario | Tratar el mapa como orientación dentro del módulo | Dirección |
| **C11** | Maestra §7: el repaso no repite preguntas de evaluación | Código: `server/repaso.ts` usa `questions_json` (dependencia declarada como provisional) | Código vigente distinto de la regla. Ya reconocido en el archivo | Banco separado, ya propuesto | Implementación futura |
| **C12** | K3, D2, D4 y maestra §2 | Textos publicados en producción (ver lista abajo) | Lo público promete cosas no vigentes o contrarias a lo decidido | Revisar textos con autorización aparte | Dirección |
| **C13** | Orden de trabajo y `APRENDIZAJE` (versión anterior): el tutor IA no existe | Código: existe copiloto conversacional | **Error mío en informes anteriores:** dije que el robot era solo visual. El robot es visual, pero «Tutor virtual» enlaza a un copiloto. No se verificó en uso real | Decir «copiloto no adaptativo, sin verificar» | Dirección: confirmar nombre y uso |
| **C14** | P21: mostrar contenidos no logrados **antes** de continuar | Maestra: revisión de la recuperación solo en su `review_at` | Entre el agotamiento y `review_at`, o se espera para continuar, o se muestran antes (Q5, Q6) | Continuar solo desde `review_at` de la recuperación | D1, D2 |
| **C15** | Maestra §10: no decidir P21 sin revisar normativa y aprobación académica | P21 comunicada | Falta el material normativo (reconocimiento oficial, Decreto 67/2018, Decreto Exento 2272/2007, reglamento interno). No se verificó si aplican a Barkley | Revisar antes de ratificar D2 | Dirección y asesoría |
| **C16** | D3: 70 % | Código: `passing_score` 60 por defecto y en generador | Código vigente distinto. La nota vigente solo cambiaría al implementar | Q1 | D3 |
| **C17** | Maestra §4: redacta 2 intentos de recuperación como regla | Maestra §9: P17 como propuesta. Orden actual: comunicada | Incoherencia interna de la maestra | Registrar ratificación en la maestra, sin editarla ahora | Dirección |
| **C18** | Maestra §9, P7: histórico aprobado se trata como cierre por aprobación | `DECISIONES_*`: la aprobación antigua habilita la progresión; pauta solo con ventana nueva | Matiz distinto; P7 sigue pendiente | Aclarar al decidir P7 | Dirección |

### Textos publicados afectados por C12

Verificados en `Home.tsx` de la rama desplegada e infografías de `/asi-trabajamos`. No se modificaron.

| Texto | Problema |
|---|---|
| «El colegio online donde nadie avanza sin entender» (H1) | Contrario a P21 si se ratifica D2 |
| «Con 70% o más, se abre la unidad que viene» (Umbral) | Lo mismo; la regla vigente del código usa 60 |
| Portal Familia: «promedio general»; infografía con porcentajes por asignatura | Contrario a maestra §2 hasta decidir D4 |
| Infografías: «Resultados al instante» | Contrario a E2 sin puntaje |
| Infografías: «Recomendaciones automáticas», radar de nivel de dominio, «ruta personalizada» | No existen; K3 |
| Infografías: «IA de Barkley», «Disponible 24/7» | Sin verificar (C13) |
| Infografías: «Psicólogo educativo (a solicitud)» | No hay evidencia en el código; confirmar servicio |

**Recordatorio:** yo publiqué `/asi-trabajamos` a pedido de la dirección, antes de K3. También hay frases en el guion de video que usan «avanzas cuando demuestras».

### Correcciones a mis propios documentos

| Documento | Error | Corrección |
|---|---|---|
| `DOMINIO_POR_CONOCIMIENTO.md` | «No contradice ninguna regla aprobada» | Retirado |
| `DOMINIO_POR_CONOCIMIENTO.md` | «Incierto», «por comprobar» y «al menos 3 variantes» como reglas | Marcados como propuesta o hipótesis |
| `DOMINIO_POR_CONOCIMIENTO.md` §11 | Frases «compatibles con lo que existe hoy» que no existen hoy | Retiradas |
| `APRENDIZAJE_TEORICO_VORTICE` | P7 dentro de «reglas ya aprobadas» | Movida a propuesta |
| `APRENDIZAJE_TEORICO_VORTICE` | «Tutor IA: no existe» | Corregido (C13) |
| `APRENDIZAJE_TEORICO_VORTICE` | Mensajes como «compatibles con la realidad actual» | Corregido |
| `APRENDIZAJE_TEORICO_VORTICE` | «Aprobarla abre el módulo siguiente» como consecuencia sin matiz | Añadida la tensión con P21 |

## 2. Decisiones pendientes

| ID | Decisión | Documento |
|---|---|---|
| D1 | Estado durante el proceso; porcentaje, banda y contenidos desde `review_at` | `PROGRESO` §7 |
| D2 | P21 reemplaza la regla de no desbloqueo. Requiere C15 | `PROGRESO` §3 |
| D3 | Bandas 70/80 y mínimo de 70 % | `PROGRESO` §2 |
| D4 | Qué ven familia y tutor | `PROGRESO` §7 |
| P7, P8, P16 | Histórico, formularios y función de E1–E4 | `DECISIONES_PARA_APROBAR.md` |
| P9–P11, P13, P14, P20-v, P22–P25, P18-v | Pendientes de la maestra, sin cambios | Maestra §9 |

## 3. Preguntas abiertas

### Registradas

**Q1–Q8:** `PROGRESO` §7.

| ID | Pregunta |
|---|---|
| O1 | ¿Qué define «no dominado»? |
| O2 | ¿Las 2 correctas pueden darse en la misma sesión? |
| O3 | ¿Una respuesta con ayuda cuenta como evidencia? |
| O4 | ¿Quién valida contenidos y prerrequisitos, y en qué plazo? |
| O5 | ¿Qué unidad de Matemática de 5.º Básico es el piloto? |
| O6 | ¿Se muestra la incertidumbre al estudiante? ¿Cómo? |
| O7 | ¿Familia y tutores ven el mapa o solo un resumen? |
| O8 | ¿Con qué frecuencia y política se reevalúa la retención? |
| O9 | ¿Qué adaptaciones son compatibles con la validez? (relacionada con P13) |
| O10 | ¿Qué datos se conservan, cuánto tiempo y quién accede? Requiere revisión de protección de datos |

### Nuevas

| ID | Pregunta |
|---|---|
| **N1** | ¿Qué relación hay entre 70 % de evaluación y K6? ¿Una afecta a la otra? |
| **N2** | ¿Qué respuestas son evidencia para K6: prácticas, E2, recuperación, banco separado? |
| **N3** | ¿Qué ve el estudiante si P21 abre un módulo con contenidos sin base? ¿Puede estudiarlos? |
| **N4** | ¿El feedback de K11 opera sobre E1, E3 y E4 o sobre un banco separado? (C6) |
| **N5** | ¿Cuántas preguntas mínimas por contenido debe cubrir una evaluación? E2 tiene hoy 15 o 20 preguntas; con 30–60 contenidos no se puede cubrir K6 solo con ella. (relacionada con Q4) |
| **N6** | ¿Cuenta la evidencia histórica anterior al modelo? (relacionada con P7) |
| **N7** | ¿Qué textos publicados de C12 se corrigen, y cuándo? |
| **N8** | ¿Cómo conviven piloto y resto del colegio, y dentro del piloto, el mapa y la regla de módulo? |
| **N9** | ¿Qué hace «distintas» a dos preguntas para K6? |
| **N10** | ¿Se usará una estimación probabilística más adelante, y con qué datos? |

## 4. Riesgos técnicos

| Riesgo | Situación |
|---|---|
| Sin tablas de contenidos, intentos, ventanas ni cierres | Requiere migración no autorizada |
| `questions_json` sin etiquetas ni identificador estable de contenido | Requiere K4 y migración |
| Progresión ligada a `evaluation_number = 2` | `server/vortice.ts`; P16 |
| Concurrencia sin verificar en Turso con réplicas | T2 solo local (`RESULTADOS_T1_T5.md`) |
| Reloj entre instancias de Vercel sin medir | T5 solo local |
| Cobertura insuficiente de K6 por pocas preguntas | N5 |
| Banco sin calibrar y generado con IA | K13 no implementado; el generador no exige revisión |
| Oráculo por mapa o feedback | C6, C7 |
| Muestra pequeña en el piloto | Hipótesis del informe, sin validar |
| Datos educativos sensibles | O10 |
