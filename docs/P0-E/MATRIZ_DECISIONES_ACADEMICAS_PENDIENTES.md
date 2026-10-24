# P0-E — Matriz de decisiones académicas y operativas pendientes

**Estado:** instrumento de trabajo; no constituye aprobación de reglas nuevas.  
**Fecha:** 2026-10-24  
**Rama:** `docs/p0-e-maestro`  
**Base:** `ESPECIFICACION_MAESTRA.md`, informe de brechas, anexo de rastreo y diseño técnico propuesto de máquina de estados.

## 1. Propósito y regla de uso

Esta matriz convierte los puntos abiertos en preguntas concretas para Dirección Académica y, cuando corresponda, asesoría jurídica o responsables de marca. No autoriza implementación. Ninguna propuesta de respuesta se considera aprobada por aparecer en este documento.

Estados:
- **Aprobado:** existe una decisión previa identificada como aprobada en la especificación.
- **Pendiente académico:** requiere definición de Dirección Académica.
- **Pendiente jurídico/académico:** necesita revisar normativa aplicable y el régimen oficial del establecimiento.
- **Pendiente operativo/técnico:** requiere decisión de operación o validación técnica, sin reemplazar la decisión académica.
- **Propuesta:** alternativa para discusión; no usar como regla productiva.

## 2. Decisiones prioritarias antes de implementar

| ID | Tema | Pregunta que debe resolverse | Estado conocido | Responsable sugerido | Evidencia/insumo necesario | Riesgo si queda abierto |
|---|---|---|---|---|---|---|
| P21 | Progresión después de agotar E2 | Si el estudiante no aprueba E2 tras el proceso de recuperación, ¿qué ocurre con el módulo siguiente y con el avance curricular? | Pendiente académico/jurídico | Dirección Académica + asesoría jurídica | Reconocimiento oficial/RBD y régimen aplicable; Reglamento de Evaluación; Decreto 67/2018 y Decreto Exento 2272/2007, según corresponda; actas o criterios institucionales | Bloqueo indefinido o progresión incompatible con el régimen aplicable |
| P13 | Adecuaciones por necesidades educativas | ¿Qué adecuaciones se permiten (tiempo adicional, ventana, apoyos), quién las autoriza y cómo se documentan sin revelar información sensible? | Pendiente académico/jurídico | Dirección Académica + inclusión/asesoría jurídica | Reglamento, protocolos y plan de apoyo individual cuando corresponda | Trato inconsistente, falta de trazabilidad o afectación de derechos |
| P16 / P16-v | Clasificación de evaluación y etiquetas | ¿E1, E3 y E4 son formativas o sumativas (P16), y qué función cumple E2, rotulada «Formativa» pero con bloqueo de progresión (P16-v)? ¿Qué significa exactamente «No logrado» y qué estados se muestran al estudiante? | Pendiente académico | Dirección Académica | Reglamento de Evaluación, objetivos de aprendizaje, criterios de calificación y comunicación a familias | Contradicción entre etiqueta formativa y bloqueo de progresión; estados que se interpretan como calificación anual |
| P22 | «Repaso pendiente» | ¿Quién lo determina, con qué criterios, en qué granularidad (objetivo/contenido) y qué condiciones permiten salir de ese estado? | Pendiente académico | Dirección Académica + equipo curricular | Mapa curricular, objetivos/contenidos etiquetados, criterios de dominio y ejemplos validados | Recomendaciones arbitrarias o estado que no puede resolverse |
| P23 | Activación y duración del repaso | ¿Cuándo se activa, con qué frecuencia, cuánto dura y qué evento lo cierra? Confirmar que nunca se active antes de `review_at`. | Pendiente académico/operativo | Dirección Académica + producto | Política de revisión y criterios curriculares; decisión P22 | Filtración prematura de respuestas o repaso persistente sin salida |
| P14 | Avisos y ventanas de recuperación | ¿Se avisa 24 horas antes de cada ventana de recuperación? ¿Cómo se aplica la extensión de 48 horas y a qué eventos? | Pendiente operativo/académico | Dirección Académica + operaciones | Calendario y política oficial de comunicaciones; canales y preferencias de notificación | Estudiantes informados de forma desigual o plazos ambiguos |
| P17 | Número de intentos de recuperación | ¿Se formalizan dos intentos enviados para la recuperación final única (P12)? No existe una recuperación ordinaria distinta de la final. | Pendiente académico | Dirección Académica | Acta/decisión formal que armonice intentos ordinarios con P12 | Diferentes interpretaciones del límite de intentos |
| P12 | Recuperación final única | Confirmar alcance: una sola recuperación final por evaluación/proceso, sin crear nuevas recuperaciones al fallar. | Aprobado, según registro existente | Dirección Académica (verificación documental) | Referencia formal de aprobación y definición del alcance exacto | Implementar una interpretación distinta de la aprobada |
| P7 | Historial previo | ¿Cómo cuentan los intentos históricos anteriores a P0-E? ¿Qué sucede con una aprobación previa y con su revisión? | Pendiente académico | Dirección Académica + datos | Inventario de registros históricos, política de transición y casos reales anonimizados | Reescritura indebida del historial o límites aplicados retroactivamente |
| P8 | Formularios externos | ¿Qué evidencia valida un resultado autodeclarado en formulario externo, quién la revisa y cuándo se cierra el proceso? | Pendiente académico/operativo | Dirección Académica + responsable de evaluación | Procedimiento de validación humana, evidencias admitidas y registro de resolución | Aprobaciones no verificadas o cierre inconsistente |
| P9 | Puntaje interno | Confirmar qué roles autorizados pueden ver puntajes internos y con qué finalidad; mantenerlos fuera de vistas de estudiante, familia y tutor. | Pendiente académico/privacidad | Dirección Académica + responsable de datos | Matriz de roles, finalidad y política de acceso | Exposición de datos o diferencias entre pantallas |
| P10 | Evaluaciones abiertas y revisión | ¿Qué contenido se puede mostrar antes de `review_at` y qué se habilita después? | Pendiente académico; restricción de seguridad ya definida | Dirección Académica + producto | Política de retroalimentación; ejemplos de contenido aprobado | Filtración de claves o explicaciones antes de tiempo |
| P11 | Aviso de vencimiento | Confirmar aviso 24 horas antes del vencimiento, canales (in-app/correo) y respeto de preferencias. | Pendiente operativo; aprobación previa reportada, referencia exacta por verificar | Operaciones + responsable de notificaciones | Registro/acta de decisión, canales disponibles y preferencias | Aviso omitido o enviado por canal no autorizado |
| P18-v | Excepciones | ¿Cuántas excepciones se permiten, por qué motivos, qué evidencias se requieren y quién aprueba/rechaza? | Pendiente académico/operativo | Dirección Académica + administración | Catálogo de motivos, límites, responsables, plazos y registro de auditoría | Excepciones arbitrarias o reapertura indebida |
| P24 | Vista de familia/tutor | ¿Qué etiquetas se muestran («No aprobado», «No logrado», «Repaso pendiente», «Solicitud en revisión») y con qué tratamiento visual? | Pendiente académico/identidad de marca | Dirección Académica + marca/producto | Glosario aprobado, ejemplos de pantallas y criterios de accesibilidad | Confusión con calificación oficial o estigmatización |
| P25 | Sustitución de evaluación | ¿Se autoriza sustituir una instancia por una versión alternativa, heredando intentos restantes y con qué límites? | Propuesta pendiente | Dirección Académica + operaciones | Política formal, motivos, autorizadores, ventanas y trazabilidad | Reaperturas no controladas o cambios de reglas entre estudiantes |
| P20-v | Capacidad de lotes | ¿Cuál es el tamaño, frecuencia y capacidad mínima de lotes de recuperación, y qué ocurre si no hay suficientes versiones validadas? | Pendiente operativo/editorial | Equipo curricular + operaciones | Inventario de versiones, pauta de validación y calendario | Lote insuficiente o reutilización indebida de una versión |
| Revisión de preguntas | Banco de práctica separado | ¿Quién etiqueta contenidos y valida que el banco de repaso no reutilice preguntas de evaluación? | Principio de separación aprobado; criterios operativos pendientes | Equipo curricular | Taxonomía, revisión editorial y validación académica | Filtración de ítems o repaso no alineado con objetivos |

## 3. Propuestas técnicas que requieren decisión de política

Las siguientes alternativas están documentadas como propuestas y no deben implementarse hasta ser ratificadas:

1. **Solicitud de excepción pendiente al vencer el plazo:** cerrar la instancia por vencimiento y mantener el proceso en espera de resolución; si se aprueba y el proceso sigue abierto, asignar versión alternativa con ventana propia. Si se rechaza, aplicar la consecuencia definida. Requiere resolver plazos de solicitud y resolución.
2. **Excepción después de publicar la clave:** no reabrir la instancia original ni permitir contestar una versión cuya clave ya esté publicada; si procede la excepción, utilizar versión alternativa y ventana propia.
3. **Clave para instancia vencida:** habilitar la clave solo si existe al menos un intento enviado. La regla requiere ratificación académica.
4. **Sustitución:** máximo una en evaluación ordinaria y una en recuperación, heredando intentos restantes; requiere solicitud del tutor y aprobación de otra persona autorizada. Sigue siendo propuesta.
5. **Intento activo al vencer la ventana:** expirar sin consumir el intento no enviado; mantener registro de la causa. La instancia se cierra conforme al plazo aprobado.
6. **Etiquetas visibles:** separar el estado operativo de repaso de la calificación o resultado académico oficial. Los nombres finales requieren aprobación.

## 4. Contradicciones que deben cerrarse explícitamente

- La etiqueta «formativa» puede entrar en conflicto con que el agotamiento de E2 bloquee el avance.
- E2 puede quedar agotada sin que exista una salida académica aprobada.
- La extensión de 48 horas y el margen de una hora antes de publicar la revisión hacen necesaria una regla clara para solicitudes tardías.
- No está definido un plazo máximo de resolución de excepciones.
- La vista de familias/tutores puede confundir estados operativos con calificaciones oficiales.
- Los registros históricos pueden activar reglas actuales si no se define una política de transición.
- La revisión adaptativa no debe exponer preguntas, respuestas o explicaciones antes de `review_at`.

## 5. Formato de resolución requerido

Para cerrar cualquier fila, registrar en la especificación maestra:

- ID de decisión y pregunta resuelta.
- Resolución exacta, redactada como regla verificable.
- Estado: aprobado / rechazado / pendiente.
- Responsable que decide y fecha.
- Evidencia o documento de respaldo.
- Casos límite y ejemplos.
- Documentos y componentes afectados.
- Si cambia una decisión aprobada, registrar el conflicto y la nueva aprobación; no sobrescribir silenciosamente el historial.

## 6. Puerta de entrada a implementación

No iniciar implementación P0-E hasta que:
- las decisiones académicas que afectan progresión, intentos, recuperación, revisión y excepciones estén formalizadas;
- se confirme el régimen jurídico/educativo aplicable;
- el diseño de estados se contraste con el esquema real LibSQL/SQLite y Drizzle;
- los riesgos de autorización, filtración de claves y exposición de resultados tengan un plan de corrección revisado;
- la especificación maestra y la matriz de decisiones no presenten contradicciones abiertas que afecten reglas de negocio.

**Límite de este documento:** es documentación de coordinación. No modifica código, base de datos, migraciones, pruebas ni producción, y no equivale a aprobación para implementarlos.
