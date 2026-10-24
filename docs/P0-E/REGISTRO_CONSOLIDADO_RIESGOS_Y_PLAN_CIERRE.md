# Registro consolidado de riesgos y plan de cierre P0-E / Vórtice

Estado: documento de trabajo basado en inspección estática. No autoriza cambios de código, pruebas en producción, integración ni despliegue.
Rama documental: docs/p0-e-maestro.
Fecha: 24-10-2026.

## 1. Alcance y certeza

Este registro consolida señales observadas en archivos publicados de la rama de código examinada. No acredita que esa rama esté desplegada ni demuestra explotación. Los controles globales, la configuración del entorno y otras capas pueden alterar el riesgo efectivo; deben comprobarse antes de declarar una vulnerabilidad confirmada.

## 2. Registro de riesgos priorizados

| ID | Prioridad provisional | Área | Evidencia estática observada | Riesgo / impacto potencial | Próximo control de cierre |
|---|---|---|---|---|---|
| R-01 | Crítica por validar | Autorización administrativa | En server/routes.ts, isAdmin ejecuta next() y return antes de comprobar identidad/rol; el chequeo queda comentado | Rutas administrativas que dependen de este middleware podrían no aplicar rol admin | Confirmar alcance por ruta y entorno; corregir solo tras autorización específica; pruebas negativas en staging |
| R-02 | Alta | Registro de respuestas API | server/index.ts captura res.json y agrega el cuerpo JSON completo a logs para rutas /api | Puntajes, claves, datos personales o información de reservas podrían copiarse a logs | Inventariar cuerpos sensibles; redacción/allowlist; revisar retención y acceso a logs |
| R-03 | Alta | Envío de evaluación | server/routes.ts contiene un submit que devuelve score, correctas, umbral, resultados y explicación | Contradice la regla P0-E de resultado inmediato limitado a Aprobado/No aprobado y puede filtrar pauta | Contrato de respuesta por rol/estado y pruebas antes de review_at |
| R-04 | Alta | Lectura de evaluaciones | GET /api/evaluations/:id y ruta HTML requieren revisar sesión, matrícula, ventana y posible exposición de claves | Acceso prematuro a preguntas o contenido de evaluación | Revisar middleware global, handler completo, contenido HTML real y autorización por curso/ventana |
| R-05 | Alta | Estado del intento | evaluation_progress almacena resultado terminado, pero el esquema inspeccionado no modela intento activo, expiración ni permutación estable | No se puede demostrar persistencia completa de ciclo de vida P0-E | Diseño de entidades/invariantes y migración aprobada antes de implementación |
| R-06 | Alta | Formulario externo | POST /api/evaluations/:id/complete acepta score y passed enviados por cliente en el código revisado | Resultado autodeclarado puede no tener validación independiente | Definir evidencia y proceso humano; rechazar confianza directa en campos del cliente |
| R-07 | Alta | Revisión/repaso | server/repaso.ts sincroniza ítems desde evaluación_progress al consultar repaso; no se observa filtro explícito por review_at en syncReviewItems | Material de repaso derivado de evaluaciones podría habilitarse antes del momento autorizado | Definir regla académica y probar fechas frontera T+48h/T+49h |
| R-08 | Alta | Evaluation links | Rutas GET/POST/PUT/DELETE de evaluationLinks no muestran auth local; POST elimina y vuelve a insertar por curso/módulo | Lectura no autorizada o cambios/eliminaciones de links; falta validación de array vacío y consistencia | Confirmar middleware global; controles de rol, matrícula y validación transaccional |
| R-09 | Alta | FAQ administrativas | /api/admin/faqs permite lectura completa, CRUD, reordenamiento e importación sin auth local visible en el módulo | Modificación no autorizada del contenido público | Verificar montaje y añadir control central si se autoriza |
| R-10 | Alta | PAES administrativas | /api/admin/paes/* expone CRUD/lectura sin auth local visible en el módulo | Cambios de planes/materias y acceso a suscripciones | Verificar montaje, permisos y validación de payloads |
| R-11 | Alta | Flow: precio y reserva | create-payment recibe planPrice del cuerpo y busca reserva por ID; no se observa comprobación de propiedad del solicitante | Precio manipulable o acceso a pago/reserva de otra persona, según contexto | Calcular precio desde catálogo/reserva en servidor y autorizar propiedad |
| R-12 | Alta | Flow: estado de pago | payment-status devuelve objeto de pago y registro de reserva por token | El token puede dar acceso a datos personales o internos no necesarios | Minimizar campos y comprobar autorización/uso seguro del token |
| R-13 | Media | Chat de ventas | Endpoint público tiene límite de 2.000 caracteres, pero en el módulo no se observa rate limiting; herramienta de chat puede registrar interesados | Abuso automatizado, gasto de proveedor o registros no solicitados | Revisar límites globales; validación determinista de consentimiento antes de registrar |
| R-14 | Media | Suscripción PAES pública | Endpoint de alta valida esquema, pero la operación es pública y el cambio de estado no muestra esquema específico | Abuso, registros falsos o estados inconsistentes | Rate limiting, validación de estado y política de identidad/consentimiento |
| R-15 | Media | Sesiones y configuración auth | replitAuth.ts usa SESSION_SECRET con valor de respaldo de desarrollo y MemoryStore en el código inspeccionado | Riesgo si configuración de producción usa defaults o el store no es adecuado para despliegue | Verificar variables y modo de despliegue real; no asumir configuración efectiva |
| R-16 | Media | Repaso | answerReviewItem devuelve correctAnswer y explicación tras responder un ítem de repaso | Puede ser correcto dentro del repaso, pero debe comprobarse que el ítem ya esté autorizado y que el banco sea independiente | Confirmar política de review_at y separación del banco de práctica |

## 3. Decisiones académicas que bloquean el diseño final

La matriz académica existente sigue siendo la referencia. Los temas de mayor prioridad son:
- P21: progresión después de agotar E2.
- P13: adecuaciones y autorizaciones por necesidades educativas.
- P16/P16-v: clasificación de E2 y etiquetas finales.
- P17 y P12: intentos de recuperación y alcance de recuperación final.
- P7: tratamiento del historial previo.
- P8: validación de resultados de formularios externos.
- P9/P10: roles autorizados para puntajes y contenido que se muestra antes de review_at.
- P14/P11: ventanas, extensión y avisos.
- P18-v: motivos, límites y aprobadores de excepciones.
- P22/P23: definición, activación y salida de Repaso pendiente.
- P25: sustitución de versión.
- P20-v: capacidad y validación editorial de lotes.
- P24: estados visibles a familia/tutor y lenguaje de interfaz.

No se deben resolver por inferencia técnica. Dirección Académica y responsables jurídicos/operativos deben documentar la decisión, o excluir formalmente el caso del primer alcance.

## 4. Hoja de ruta propuesta

### Etapa A — Terminar inspección estática
1. Completar el inventario de rutas, routers, middleware, configuración de sesión y acceso a datos.
2. Identificar cuáles controles son locales, cuáles globales y cuáles no se han podido verificar.
3. Asociar a cada hallazgo archivo, ruta, evidencia, certeza, impacto y criterio de cierre.

### Etapa B — Cerrar decisiones de política
1. Actualizar la matriz de decisiones con responsable, resolución, fecha y evidencia.
2. Resolver contradicciones entre reglas aprobadas y propuestas.
3. Mantener pendientes fuera del alcance inicial si no pueden resolverse aún.

### Etapa C — Aprobar diseño técnico definitivo
1. Especificar proceso, instancia, intento, versión, lote y excepción.
2. Fijar invariantes de intentos, reloj, permutación, cierre, recuperación y revisión.
3. Definir contrato API, permisos por rol y datos que puede ver cada actor.
4. Revisar compatibilidad, migración y reversa.

### Etapa D — Implementar por lotes con autorización específica
Orden recomendado: autorización transversal y logs; acceso a evaluación; contrato de resultado; persistencia de intentos; máquina de estados; recuperación; excepciones/sustitución; repaso diferido; interfaz.
Cada lote debe ser pequeño, revisable y vinculado a decisiones aprobadas. Este documento no autoriza cambios de código.

### Etapa E — Pruebas aisladas autorizadas
Usar staging/local aprobado y datos sintéticos. Probar cuentas anónimas, estudiantes, familia/tutor, usuario sin rol admin y administrador; ventanas de tiempo; doble envío; concurrencia; recarga; expiración; permutación; recuperación; excepciones; HTML; logs; reservas y rutas públicas. No usar producción como entorno de prueba.

### Etapa F — Aceptación y salida
Exigir revisión técnica, aceptación académica, resultados de pruebas, migraciones revisadas, registros minimizados, estrategia de reversa, responsables y autorización separada para merge/despliegue. Después del despliegue, documentar verificación autorizada.

## 5. Criterios de término

P0-E se considera cerrado solo cuando:
1. Las reglas académicas están aprobadas o los pendientes se excluyen formalmente.
2. Los controles de acceso se comprueban en entorno autorizado.
3. Los resultados no revelan claves antes de review_at.
4. Los intentos, permutaciones, vencimientos, cierres y recuperación son consistentes.
5. Logs y respuestas API no exponen información innecesaria.
6. La regresión se repite tras corregir fallos.
7. Dirección Académica y responsable técnico aceptan el resultado.
8. Merge y despliegue cuentan con autorización independiente.

## 6. Límites vigentes

- No se han ejecutado pruebas dinámicas ni llamadas a producción.
- No se ha demostrado explotación ni confirmado el estado real del despliegue.
- No se han modificado código, esquema, datos o configuración.
- No se deben publicar commits locales no publicados de vortice/integracion sin autorización específica.
- Esta matriz es un instrumento de planificación y priorización, no una orden de cambio.
