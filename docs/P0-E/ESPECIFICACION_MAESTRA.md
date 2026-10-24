# P0-E — Especificación maestra de evaluaciones

**Estado:** documento de diseño; no autoriza implementación.  
**Repositorio:** juanpablomonsalvezb-alt/brkl  
**Rama documental:** docs/p0-e-maestro  
**Consolidación:** 2026-10-23

## 1. Propósito y límites

Este documento es la fuente compartida para consolidar la especificación P0-E entre ChatGPT y Claude Code/Opus. Se limita a reglas de negocio, decisiones, riesgos y validaciones pendientes. No autoriza cambios de código, base de datos, migraciones, pruebas sobre entornos reales, commits a main, despliegues ni cambios de producción.

Al proponer cambios, ambos asistentes deben leer primero este documento, distinguir hechos verificados de informes previos, separar decisiones aprobadas de propuestas y preguntas abiertas, y no cambiar una decisión aprobada sin registrar el conflicto. Los cambios documentales deben permanecer en una rama y pasar por revisión humana.

## 2. Principios funcionales aprobados

- El estudiante ve únicamente **«Aprobado»** o **«No aprobado»** como resultado inmediato del intento; no ve puntaje exacto ni total de respuestas correctas.
- Al aprobar, la evaluación se cierra inmediatamente y no permite nuevos intentos.
- Al agotarse los intentos sin aprobar, la instancia se cierra.
- La pauta y la revisión no se muestran hasta que termine la ventana de la instancia —incluida la extensión automática de 48 horas— y transcurra una hora adicional.
- La revisión es de solo lectura: puede mostrar respuestas correctas y explicaciones, pero nunca reabre una evaluación ni concede intentos.
- La evaluación 2 tiene un flujo de recuperación tutorial y una nueva versión autorizada por una persona distinta de quien la solicita.
- Portafolio compartido, familia y tutoría muestran estado, no puntajes exactos.
- El orden de preguntas y alternativas se mezcla por intento. La permutación exacta se persiste para permitir recarga y revisión. La corrección usa identificadores estables, nunca letras o posiciones.
- Se registra un intento al iniciarlo, pero se consume al enviarlo. Solo puede existir un intento activo. Recargar retoma el mismo intento y permutación. Abandonar no consume intento; un intento activo expira al final de la ventana sin consumirlo.
- La extensión automática de 48 horas se aplica a todos. El fin de esa extensión impide enviar intentos de la instancia original.
- Se envía un aviso 24 horas antes del fin de la ventana ordinaria (decisión reportada como aprobada; canal técnico sujeto a preferencias y confirmación operativa).
- Los formularios externos requieren validación humana; las reglas de ventana y efecto de aceptación/rechazo se mantienen como detalle P8 pendiente de ratificación.
- Un proceso evaluativo definitivamente cerrado no se reabre. La revisión posterior del contenido es una actividad separada, no una repetición de la evaluación.

## 3. Intentos, tiempo y revisión

### Intentos ordinarios
- Evaluaciones 1, 3 y 4: 2 intentos.
- Evaluación 2: 3 intentos.
- El intento se consume al enviar, no al abrir.
- No puede existir más de un intento activo por estudiante e instancia.
- La instancia tiene un límite temporal explícito y auditado.

### Reloj
- T es el fin del módulo según el calendario de Barkley, a las 23:59 en hora de Chile.
- La extensión automática dura 48 horas reales, calculadas en UTC.
- La zona horaria debe persistirse explícitamente y deben probarse los cambios de horario de verano en America/Santiago.
- La revisión se habilita en review_at = T + 49 horas, si la instancia está cerrada y se cumplen las demás condiciones.
- Después de T+48 horas, un envío tardío se rechaza con HTTP 409, sin período de gracia. Las excepciones requieren autorización separada y auditoría.

### Cierre por vencimiento
- Al alcanzar T+48 horas, la instancia se marca vencida si aún no está aprobada ni cerrada por agotamiento, aunque queden intentos sin usar. **P15 — APROBADO (2026-10-24):** esta regla cierra la instancia original; un intento activo expira sin consumir intento y se registra la causa del cierre. Una excepción autorizada no reabre la instancia original ni un proceso definitivamente cerrado; si procede y aún es admisible, debe tramitarse mediante el flujo de versión alternativa.
- Un intento activo expira sin consumir intento.
- La causa del cierre se registra como vencimiento.
- La pauta se habilita en review_at únicamente si la instancia está cerrada y se cumplen las reglas de revisión.
- El estado de instancia no debe confundirse con el estado final del proceso evaluativo.

### Revisión de pauta
- Cada instancia tiene su propio review_at.
- Solo se publica la pauta si la instancia está cerrada, el reloj del servidor ha alcanzado review_at y ningún otro estudiante puede seguir respondiendo esa misma versión.
- Las versiones de recuperación tienen sus propias ventanas y tiempos de revisión.
- Cada versión de recuperación se usa en un solo lote. Una versión usada en un lote se retira permanentemente una vez habilitada su pauta.
- No se abre un lote de recuperación sin suficientes versiones validadas y sin uso previo.
- La pauta de una versión original puede habilitarse mientras el estudiante continúa una recuperación con preguntas diferentes.

## 4. Recuperación y lotes

- La evaluación 2 agotada sin aprobar pasa al flujo de recuperación tutorial.
- Si el estudiante no rinde dentro del plazo, se propone/ha sido reportado como aprobado el flujo de recuperación con versión nueva, solicitud tutorial y autorización administrativa; verificar la formulación exacta del acuerdo antes de implementación.
- Agotar E2 sin aprobar no desbloquea automáticamente el módulo siguiente. P21 sigue pendiente para definir el tratamiento posterior y cualquier avance excepcional.
- La recuperación usa una versión diferente de preguntas y ventanas por lote; las versiones deben rotar.
- La recuperación es la oportunidad final del proceso evaluativo (P12, reportado como APROBADO). Si se agota o vence sin aprobación, el proceso se cierra como «Reprobado» y no se reabre.
- La recuperación tiene 2 intentos enviados. Recargar o abandonar no consume intento; el intento activo vencido no se consume.
- Un lote se cierra cuando termina su ventana (incluida cualquier extensión aplicable), todas las instancias están cerradas y no quedan intentos activos.
- La revisión del lote se habilita una hora después del fin de la ventana; luego las versiones se retiran.
- Una versión excepcional asignada a un estudiante funciona como un lote individual.
- El número mínimo de versiones por lote, la capacidad y la frecuencia de lotes siguen pendientes de definición.

## 5. Excepciones y sustitución de versión

### Excepción
- Tutoría solicita; una persona autorizada distinta, de coordinación académica, aprueba.
- Registrar motivo/referencia, caso, solicitante, aprobador, fechas y ventanas anterior/nueva en UTC. No guardar evidencia sensible en el registro de auditoría.
- Nunca reabrir un proceso definitivamente cerrado.
- Si la nueva fecha cabe dentro de la extensión original, puede ampliarse esa ventana. Si excede esa ventana, asignar una versión alternativa para reducir el riesgo de exposición de la pauta. **P18 — APROBADO (2026-10-24):** una excepción nunca reabre la evaluación original ni permite responder una versión cuya pauta ya se publicó. Si se autoriza y el proceso sigue abierto y admite una alternativa, se asigna una versión distinta con ventana y revisión propias. Si el proceso está definitivamente cerrado, no se reabre.
- No se concede extensión automáticamente mientras la excepción esté pendiente; el comportamiento del reloj en ese estado requiere decisión explícita.
- Límites máximos, motivos admisibles y tratamiento de evidencia sensible requieren validación académica/legal.

### Sustitución (P25: propuesta pendiente de ratificación)
- La versión sustituta reemplaza la instancia afectada y hereda los intentos restantes; no consume ni concede recuperación adicional.
- Como máximo una sustitución en fase ordinaria y una en fase de recuperación.
- Solo se puede solicitar si el proceso no está definitivamente cerrado y la instancia no terminó por aprobación o agotamiento; requiere solicitud tutorial y aprobación de otra persona autorizada.
- Si no quedan intentos, no se realiza la sustitución.
- La sustituta tiene su propia ventana, revisión y lote individual.
- Agotamiento/vencimiento de una sustituta ordinaria lleva a los resultados que correspondan a la evaluación original; agotamiento/vencimiento de una sustituta de recuperación cierra el proceso como «Reprobado».
- Registrar instancia reemplazada, sustituta, intentos heredados, excepción, solicitante, aprobador y fechas.

## 6. Estados y presentación

- «Aprobado» cierra el proceso con resultado aprobado.
- «Reprobado» cierra definitivamente el proceso cuando corresponde por agotamiento/vencimiento de la recuperación final.
- «No logrado» se propone para evaluaciones formativas sin recuperación formal; P16 sigue pendiente de validación académica.
- «Repaso pendiente» debe ser un indicador separado del resultado evaluativo.
- No depender solo del color: estado textual e icono accesibles. La propuesta visual es verde para «Aprobado» y rojo para «Reprobado», sin usar el color como único indicador.
- «Reprobado» cierra el proceso evaluativo, pero no implica por sí solo la reprobación automática del módulo, curso o año escolar.
- Debe resolverse si las evaluaciones 1, 3 y 4 son realmente formativas o sumativas: se reportó que el repositorio etiqueta todas como «Evaluación Formativa», mientras la evaluación 2 bloquea progresión. Las etiquetas actuales no sustituyen la decisión académica.

## 7. Repaso de contenido separado

La revisión posterior no debe repetir las mismas preguntas de evaluación. La propuesta es usar un banco de práctica distinto, etiquetado por contenido/Objetivo de Aprendizaje (OA), con un plan de repaso por estudiante y evidencia de práctica por contenido. Requiere etiquetado editorial y validación académica.

## 8. Riesgos técnicos por verificar (no verificados)

- Atomicidad de db.batch en libsql.
- Inserciones concurrentes e índices únicos parciales.
- Soporte de Drizzle para índices parciales y restricciones CHECK.
- Cálculo de fechas y DST en America/Santiago.
- Consistencia del reloj del servidor.
- Endpoint /submit como posible oráculo de puntaje exacto.
- Datos históricos review_items que podrían codificar corrección.
- Flujo Copilot que podría omitir evaluationId.
- Endpoint de metadatos que podría exponer formUrl.
- Verificación de matrícula/sesión en endpoints relevantes.
- Uso de passingScore || 60 en lugar de nullish coalescing.
- Posible creación duplicada de entregas pendientes en `evaluation_progress` al llamar varias veces a /complete (no son ítems de repaso).
- Puntajes ficticios reportados en client/src/pages/CoursePlayer.tsx (E1 85, E2 72, E3 90, E4 78; referencia aproximada líneas 987–997). La instrucción de sustituirlos por estados académicos reales fue reportada como aprobada; el hallazgo en código aún requiere verificación en el commit correcto.

Son hallazgos reportados durante la conversación y requieren verificación contra el código actual antes de tratarlos como hechos confirmados. Claude reporta que algunas referencias corresponden a cinco commits locales P0 no publicados y que las líneas citadas no coinciden con la rama documental basada en otro commit. Por tanto, ninguna referencia de línea se considera verificada contra GitHub hasta identificar el commit de código pertinente.

**Precisión sobre un riesgo:** la posible duplicación en /complete se reportó como duplicación de entregas pendientes en evaluation_progress (server/routes.ts:1348), no como ítems de repaso. La fuga de registros históricos de repaso se reportó reproducida en memoria con funciones reales de server/repaso.ts; el oráculo de puntaje se reprodujo solo con una función simulada, no contra el endpoint. No se probaron endpoints reales ni producción.

## 9. Decisiones pendientes

| ID | Tema | Estado / siguiente paso |
|---|---|---|
| P7 | Tratamiento de registros históricos | PROPUESTA pendiente: intentos históricos no cuentan para límite; aprobados se tratan como cierre por aprobación, con revisión sujeta a ventana; no reescribir filas |
| P8 | Formularios externos y ventanas | PROPUESTA pendiente: mismas ventanas; validación humana aprobada cierra por aprobación; rechazo no consume intento |
| P9 | Visibilidad del puntaje interno | PROPUESTA pendiente: solo administradores en vistas internas |
| P10 | Repaso de evaluaciones abiertas | PROPUESTA pendiente: excluir preguntas hasta review_at y repasar adaptativamente después |
| P11 | Canal de aviso de 24 horas | Regla de aviso aprobada; canal dentro de plataforma y correo respetando preferencias, pendiente de confirmar detalle operativo |
| P12 | Segunda recuperación fallida | APROBADO: una única recuperación final por proceso evaluativo |
| P13 | Ajustes por necesidades especiales | PENDIENTE_ACADÉMICO/LEGAL; definir con Dirección Académica |
| P14 | Aviso y extensión en ventanas de recuperación | PENDIENTE; sin recomendación cerrada |
| P15 | Vencimiento de instancia a T+48h y causa vencimiento; la excepción no reabre la original | APROBADO (2026-10-24); instancia original cerrada, intento activo expira sin consumir, causa registrada |
| P16 | E1/E3/E4 formativas o sumativas; recuperación formal o «No logrado» | Pendiente de Dirección Académica y validación normativa |
| P17 | 2 intentos enviados por recuperación; una recuperación final | Propuesta recomendada; confirmar aprobación formal |
| P18 | Excepciones, solicitante/aprobador distintos, ventana y auditoría; evitar responder versión con pauta publicada | APROBADO (2026-10-24): no reabrir original ni proceso definitivamente cerrado; si procede, versión alternativa con ventana/revisión propias. Límites y razones admisibles siguen pendientes |
| P19 | Condiciones de publicación de pauta por instancia | Aprobado en consolidación previa |
| P20 | Lotes, retiro de versiones y revisión al cierre | Regla base aprobada; capacidad/frecuencia pendientes |
| P20-v | Capacidad mínima y frecuencia de lotes | Pendiente |
| P21 | Desbloqueo/progresión tras fallo definitivo de E2 | Pendiente de validación normativa y académica |
| P22 | Criterio y responsables de «Repaso pendiente» | PENDIENTE_ACADÉMICO; depende de etiquetado por contenido |
| P23 | Activación, frecuencia, duración y salida del repaso | PENDIENTE_ACADÉMICO; nunca antes de review_at |
| P24 | Visibilidad de estados para familia/tutor y tratamiento visual | PENDIENTE académico/de marca; propuesta de rojo semántico distinto del rojo de marca, siempre con texto e icono |
| P25 | Sustitución de versión, intentos heredados y límites | Propuesta detallada; ratificación pendiente |
| P16-v | Clasificación y rotulación académica de E1–E4 | Pendiente de Dirección Académica |
| P18-v | Máximos, razones y evidencia de excepciones | Pendiente de validación académica/legal |

Los textos resumidos de P7–P14 y P22–P24 se recuperaron del informe de Claude compartido el 2026-10-23; las recomendaciones de Claude permanecen como propuestas cuando así se indica. No se han verificado contra fuentes originales adicionales.

## 10. Progresión después de evaluación 2 (P21)

Opciones pendientes:
1. **Avance con acompañamiento:** desbloquear el módulo siguiente con estado explícito «Avance con acompañamiento», repaso basado en contenido y tutoría; no equivale a promoción legal automática.
2. **Bloqueo hasta autorización:** mantener el siguiente módulo bloqueado hasta una liberación manual, auditada y aprobada por coordinación/dirección.

Se reportó que la regla actual en server/vortice.ts (aprox. líneas 144–160) desbloquea solo si E2 se aprueba. Cambiarla modifica comportamiento vigente. No decidir sin revisar normativa oficial aplicable y aprobación académica.

## 11. Historial y gobierno

- **2026-10-23 — Consolidación documental inicial:** se recopilan decisiones y propuestas presentes en el historial de trabajo. No constituye aprobación nueva de decisiones académicas pendientes.
- **2026-10-24 — Ratificación de P15 y P18:** la persona responsable del proyecto aprobó el cierre de la instancia original al vencer, la expiración sin consumo del intento activo y el registro de la causa; además, confirmó que una excepción no reabre la evaluación original ni permite responder una versión cuya pauta se publicó, y que una alternativa autorizada requiere versión, ventana y revisión propias. No se autorizó implementación técnica.
- Toda modificación debe indicar ID de decisión, estado anterior, propuesta, fundamento, impacto, responsable de validación y fecha.
- Estados permitidos: APROBADO, PROPUESTA, PENDIENTE_ACADÉMICO, PENDIENTE_LEGAL, PENDIENTE_TÉCNICO y NO_VERIFICADO.
- No mezclar especificación con implementación. Un cambio de código requiere autorización explícita independiente.


## 12. Propuestas adicionales recuperadas de Claude (no aprobadas)

Las siguientes propuestas se agregan para evitar perderlas. No son reglas aprobadas ni autorización para implementarlas.

### Solicitud de excepción pendiente al vencer
Propuesta: si vence el plazo con una solicitud pendiente, la instancia vence, pero el proceso queda en estado de espera de excepción sin cierre definitivo. Si se aprueba, se crea una sustituta; si se rechaza, se aplica la consecuencia que estaba pendiente. Solo se admiten solicitudes antes de extension_ends_at. Si el estudiante aprueba o agota intentos mientras la solicitud está pendiente, esta pasa a «sin objeto». Quedan por definir plazo de resolución, estados exactos y tratamiento de reloj.

### Pauta de instancia vencida
Propuesta: habilitar la pauta de una instancia vencida solo si el estudiante envió al menos un intento. Requiere confirmar su coherencia con las reglas de revisión de las secciones anteriores.

### Modelo formal de estados
Propuesta técnica pendiente: definir estados e invariantes de instancia, proceso, versión (borrador, validada, asignada, retirada) y solicitud de excepción, junto con tabla de transiciones. El rojo semántico se usaría solo para un «Reprobado» definitivo; toda señal debe incluir texto e icono accesibles.

### Material para resolver P21
Antes de decidir la progresión tras fallo de E2, reunir y revisar: resolución de reconocimiento oficial y RBD o régimen de exámenes libres; textos oficiales de BCN del Decreto 67/2018 y Decreto Exento 2272/2007; reglamento interno de evaluación; acta de Dirección Académica; plan de acompañamiento. La aplicabilidad normativa debe confirmarse según el régimen efectivo de Barkley.

### Anexo técnico propuesto (PENDIENTE_TÉCNICO)
Propuesta, no diseño aprobado: evaluar tablas `evaluation_attempts`, `evaluation_closures`, `evaluation_windows`, `evaluation_window_changes`, `recovery_batches`, `evaluation_recoveries` y `evaluation_exceptions`; columnas `max_attempts` y `recovery_of_id`; índices únicos parciales; transacciones para inicio/envío; y pruebas T1–T5 en base aislada, más pruebas de seguridad, aleatorización, ventanas con reloj simulado y regresión. No crear tablas, migraciones ni ejecutar pruebas sin autorización específica.

### Contradicciones por resolver
1. Etiqueta «Formativa» frente al bloqueo de E2.
2. E2 reprobada que bloquea progresión sin salida definida.
3. P14 sin definición final.
4. Margen de una hora de revisión que puede hacer necesaria una sustitución para excepciones tardías.
5. Solicitudes de excepción presentadas después del plazo.
6. Solicitud pendiente sin plazo de resolución.
7. Estados visibles para familia/tutor y uso del rojo (P24).

## 13. Trazabilidad de decisiones iniciales

- P1: intentos ordinarios 2/3/2/2 — APROBADO.
- P2: el intento se consume al enviar — APROBADO.
- P3: T a las 23:59 de Chile y extensión de 48 horas reales — APROBADO.
- P4: review_at = T + 49 horas — APROBADO.
- P5: envío tardío rechazado con 409, sin período de gracia — APROBADO.
- P6: recuperación mediante lotes y versiones alternativas — APROBADO.
- P12: una única recuperación final por proceso — APROBADO.

## 14. Evidencia y límites de verificación

El informe de Claude compartido el 2026-10-23 señala:
- Fuga de registros históricos de repaso: reproducida en memoria con funciones reales de `server/repaso.ts`.
- Oráculo de puntaje: reproducido únicamente con una función simulada, no contra el endpoint real.
- Otros hallazgos: lectura de código con rutas/líneas reportadas, pero el commit de referencia no está publicado o no coincide con la rama documental.
- No se probaron endpoints reales ni producción.

**Base de código de los anexos.** Los anexos de esta rama analizan el código publicado en GitHub (`b8a6897`). Los cinco commits locales P0 (`7a81975`, `a75b348`, `f582ccc`, `7d005fb` y `8a67d49`), aún no publicados, ya modifican parte de lo descrito: `/submit` deja de devolver resultados por pregunta y clave, `GET /api/evaluations/:id` exige acceso, el HTML no se entrega al estudiante, `/complete` deja la entrega pendiente de validación y el repaso usa programación neutra. Siguen vigentes en esos commits: el puntaje exacto en `/submit`, la ausencia de un filtro por `review_at` en el repaso, la vía para omitir el bloqueo del copiloto y los puntajes ficticios del gráfico. Cada hallazgo de los anexos debe volver a verificarse contra el commit que finalmente se publique.

Estas afirmaciones son informes atribuidos a Claude, no una auditoría independiente de ChatGPT. Los cinco commits locales P0 pendientes de publicar no deben subirse sin autorización explícita. Cualquier publicación futura debe ser aislada y revisada.
