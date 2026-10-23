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
- Al alcanzar T+48 horas, la instancia se marca vencida si aún no está aprobada ni cerrada por agotamiento, aunque queden intentos sin usar.
- Un intento activo expira sin consumir intento.
- La causa del cierre se registra como vencimiento.
- La pauta se habilita en review_at únicamente si la instancia está cerrada y se cumplen las reglas de revisión.
- El estado de instancia no debe confundirse con el estado final del proceso evaluativo.

### Revisión de pauta
- Cada instancia tiene su propio review_at.
- Solo se publica la pauta si la instancia está cerrada, el reloj del servidor ha alcanzado review_at y ningún otro estudiante puede seguir respondiendo esa misma versión.
- Las versiones de recuperación tienen sus propias ventanas y tiempos de revisión.
- Una versión usada en un lote se retira permanentemente una vez habilitada su pauta.
- No se abre un lote de recuperación sin suficientes versiones validadas y sin uso previo.
- La pauta de una versión original puede habilitarse mientras el estudiante continúa una recuperación con preguntas diferentes.

## 4. Recuperación y lotes

- La evaluación 2 agotada sin aprobar pasa al flujo de recuperación tutorial.
- La recuperación usa una versión diferente de preguntas y ventanas por lote; las versiones deben rotar.
- La recuperación es la oportunidad final del proceso evaluativo. Si se agota o vence sin aprobación, el proceso se cierra como «Reprobado» y no se reabre.
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
- Si la nueva fecha cabe dentro de la extensión original, puede ampliarse esa ventana. Si excede esa ventana, asignar una versión alternativa para reducir el riesgo de exposición de la pauta.
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
- Posible creación duplicada de pending review items en /complete.
- Puntajes ficticios reportados en client/src/pages/CoursePlayer.tsx (E1 85, E2 72, E3 90, E4 78; referencia aproximada líneas 987–997).

Son hallazgos reportados durante la conversación y requieren verificación contra el código actual antes de tratarlos como hechos confirmados.

## 9. Decisiones pendientes

| ID | Tema | Estado / siguiente paso |
|---|---|---|
| P7–P11 | Reglas pendientes de la especificación original | Recuperar textos fuente; no inventar contenido |
| P13–P14 | Ventanas/extensión por lote | Pendiente de definición final |
| P15 | Vencimiento de instancia a T+48h y causa vencimiento | Aprobado en consolidación previa |
| P16 | E1/E3/E4 formativas o sumativas; recuperación formal o «No logrado» | Pendiente de Dirección Académica y validación normativa |
| P17 | 2 intentos enviados por recuperación; una recuperación final | Propuesta recomendada; confirmar aprobación formal |
| P18 | Excepciones, solicitante/aprobador distintos, ventana y auditoría | Regla base aprobada; límites y razones admisibles pendientes |
| P19 | Condiciones de publicación de pauta por instancia | Aprobado en consolidación previa |
| P20 | Lotes, retiro de versiones y revisión al cierre | Regla base aprobada; capacidad/frecuencia pendientes |
| P20-v | Capacidad mínima y frecuencia de lotes | Pendiente |
| P21 | Desbloqueo/progresión tras fallo definitivo de E2 | Pendiente de validación normativa y académica |
| P22–P24 | Temas abiertos en historial | Recuperar textos fuente; no completar por inferencia |
| P25 | Sustitución de versión, intentos heredados y límites | Propuesta detallada; ratificación pendiente |
| P16-v | Clasificación y rotulación académica de E1–E4 | Pendiente de Dirección Académica |
| P18-v | Máximos, razones y evidencia de excepciones | Pendiente de validación académica/legal |

El historial de trabajo disponible no contiene el texto íntegro de P7–P14 ni P22–P24. No reconstruirlos de memoria ni rellenarlos con supuestos.

## 10. Progresión después de evaluación 2 (P21)

Opciones pendientes:
1. **Avance con acompañamiento:** desbloquear el módulo siguiente con estado explícito «Avance con acompañamiento», repaso basado en contenido y tutoría; no equivale a promoción legal automática.
2. **Bloqueo hasta autorización:** mantener el siguiente módulo bloqueado hasta una liberación manual, auditada y aprobada por coordinación/dirección.

Se reportó que la regla actual en server/vortice.ts (aprox. líneas 144–160) desbloquea solo si E2 se aprueba. Cambiarla modifica comportamiento vigente. No decidir sin revisar normativa oficial aplicable y aprobación académica.

## 11. Historial y gobierno

- **2026-10-23 — Consolidación documental inicial:** se recopilan decisiones y propuestas presentes en el historial de trabajo. No constituye aprobación nueva de decisiones académicas pendientes.
- Toda modificación debe indicar ID de decisión, estado anterior, propuesta, fundamento, impacto, responsable de validación y fecha.
- Estados permitidos: APROBADO, PROPUESTA, PENDIENTE_ACADÉMICO, PENDIENTE_LEGAL, PENDIENTE_TÉCNICO y NO_VERIFICADO.
- No mezclar especificación con implementación. Un cambio de código requiere autorización explícita independiente.
