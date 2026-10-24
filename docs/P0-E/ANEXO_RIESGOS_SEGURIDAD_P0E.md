# Anexo de riesgos de seguridad P0-E — Vórtice

**Estado:** hallazgos documentales para revisión; no constituye autorización de corrección ni certificación de explotación.  
**Rama inspeccionada:** `vortice/integracion`  
**Rama documental:** `docs/p0-e-maestro`  
**Fecha:** 2026-10-24

## 1. Propósito y límites

Este anexo prioriza riesgos visibles en la inspección estática de archivos publicados del repositorio. No se ejecutaron pruebas, no se llamó a endpoints en vivo, no se accedió a producción y no se modificó código ni base de datos. Los fragmentos descritos son evidencia de lectura de código, no demostración de explotabilidad en un entorno desplegado. Middleware global, configuración de despliegue, datos reales y controles externos podrían cambiar el alcance; deben verificarse antes de declarar una vulnerabilidad confirmada.

## 2. Resumen ejecutivo

| Prioridad provisional | Área | Observación estática | Riesgo principal | Verificación requerida |
|---|---|---|---|---|
| P0 / crítica por validar | Middleware de administración | En `server/routes.ts`, el middleware identificado como `isAdmin` contiene una salida temprana `next(); return;` y la comprobación de rol aparece comentada, con referencia a modo de desarrollo. | Si el middleware se usa sin otra barrera efectiva en rutas desplegadas, un usuario autenticado o no autenticado podría acceder a operaciones administrativas. | Confirmar entorno, orden de middleware, rutas protegidas, autenticación global y configuración de despliegue. No probar contra producción. |
| P0 / alta | Resultado de evaluación | `POST /api/evaluations/:id/submit` calcula y devuelve puntuación, número de correctas, umbral y detalle de resultados. | Contradice la regla P0-E de mostrar inicialmente solo «Aprobado» / «No aprobado» y puede revelar respuestas antes de `review_at`. | Revisar el contrato completo, `EvaluationQuiz.tsx`, cliente alternativo y consumidores de la respuesta. |
| P0 / alta | Respuestas y explicaciones | El cálculo de resultados incluye `correctAnswer` y `explanation`, y el cliente muestra revisión por pregunta inmediatamente. | Divulgación prematura de claves y explicaciones, incompatible con el cierre temporal de revisión. | Trazar todos los endpoints y vistas que entregan preguntas, HTML o respuestas; validar la barrera temporal en servidor. |
| P1 / alta | HTML de formularios/evaluaciones | La ruta `GET /api/evaluations/:objectiveId/:evaluationNumber/html` devuelve `htmlContent`; el comentario del código advierte que las respuestas incrustadas podrían quedar visibles en el DOM. | Si el HTML incluye la clave, ocultarla visualmente no la protege. | Inspeccionar formatos almacenados y validar acceso, matrícula, ventana y ausencia de claves en el HTML servido. |
| P1 / alta | Integridad de finalización externa | `POST /api/evaluations/:id/complete` acepta `score` y `passed` en el cuerpo y persiste la finalización; el comentario señala que los resultados externos son autodeclarados y requieren verificación. | Si no existe validación fiable en otra capa, un cliente podría declarar un resultado no verificado. | Trazar validación humana, autorización, origen del resultado y transición de estado. |
| P1 / media-alta | Repaso derivado de evaluaciones | En `server/repaso.ts`, `syncReviewItems` deriva ítems de `evaluation_progress`; `loadDueReview` sincroniza al consultar. En el fragmento inspeccionado no se observó una comprobación explícita de `review_at`. | Podría activarse repaso derivado antes de la hora permitida si no existe un control equivalente en otra capa. | Seguir la ruta completa de lectura/escritura y comprobar el bloqueo temporal del lado servidor. |
| P1 / media | Acceso a evaluación | `GET /api/evaluations/:id` entrega una evaluación transformada con `toStudentQuestions`; en la ruta inspeccionada no se veía comprobación explícita de matrícula/ventana. | Posible acceso fuera de la ventana si no lo impone middleware global u otra capa. | Verificar middleware global, autenticación, autorización, matrícula y calendario efectivo. |
| P2 / media | Lógica de umbral | El cálculo utiliza `evaluation.passingScore || 60`. | Un umbral configurado en cero podría sustituirse por 60; además, el umbral no debería exponerse al estudiante si la especificación así lo prohíbe. | Confirmar valores válidos y contrato de salida; usar criterio de ausencia explícita, si corresponde, solo después de aprobar diseño. |

**Nota sobre prioridades:** son niveles de triage provisionales. La etiqueta P0 de administración se usa por el impacto potencial si se confirma la exposición, no porque se haya demostrado explotación. No debe publicarse como vulnerabilidad confirmada hasta completar la verificación segura.

## 3. Evidencia de código publicada

1. **Envío y respuesta de evaluación**  
   Archivo: [`server/routes.ts`](https://github.com/juanpablomonsalvezb-alt/brkl/blob/vortice/integracion/server/routes.ts#L1935-L1994)  
   La ruta procesa las respuestas, calcula resultados y devuelve puntuación, total de correctas, cantidad de preguntas, estado de aprobación, umbral y resultados por pregunta.

2. **Persistencia de intento**  
   Archivo: [`server/storage.ts`](https://github.com/juanpablomonsalvezb-alt/brkl/blob/vortice/integracion/server/storage.ts#L496-L517)  
   `saveEvaluationAttempt` crea una fila en `evaluationProgress` con fecha de finalización, puntuación, cantidad de correctas, respuestas y estado aprobado. En esa función no se observa por sí sola una máquina de estados de intento activo ni un número de intento.

3. **Esquema de progreso**  
   Archivo: [`shared/schema.ts`](https://github.com/juanpablomonsalvezb-alt/brkl/blob/vortice/integracion/shared/schema.ts#L202-L213)  
   La tabla `evaluationProgress` declara identificadores de usuario/evaluación, fecha, puntuación, totales, respuestas y aprobado. En esa declaración no aparecen campos explícitos para intento activo, permutación persistida, expiración o número de intento.

4. **Interfaz del cuestionario**  
   Archivo: [`client/src/components/EvaluationQuiz.tsx`](https://github.com/juanpablomonsalvezb-alt/brkl/blob/vortice/integracion/client/src/components/EvaluationQuiz.tsx)  
   La interfaz consume la ruta de envío y presenta porcentajes, totales, umbral y revisión por pregunta. Debe adecuarse al contrato P0-E una vez que la especificación se ratifique.

5. **Control de acceso parcial**  
   Archivo: [`server/vortice.ts`](https://github.com/juanpablomonsalvezb-alt/brkl/blob/vortice/integracion/server/vortice.ts#L183-L203)  
   `checkEvaluationAccess` verifica calendario de liberación y acceso al módulo; el fragmento no implementa por sí solo todos los estados de intento, cierre, extensión y revisión definidos en P0-E.

6. **Finalización externa**  
   Archivo: [`server/routes.ts`](https://github.com/juanpablomonsalvezb-alt/brkl/blob/vortice/integracion/server/routes.ts#L1321-L1347)  
   La ruta `/complete` acepta `score` y `passed` del cuerpo para evaluaciones sin `questionsJson`. El flujo de validación debe trazarse antes de concluir que el dato es manipulable en el sistema completo.

7. **HTML de evaluación**  
   Archivo: [`server/routes.ts`](https://github.com/juanpablomonsalvezb-alt/brkl/blob/vortice/integracion/server/routes.ts#L1396-L1411)  
   La ruta devuelve `htmlContent`. La presencia real de claves dentro de los registros y los controles de acceso no se verificaron con datos reales.

8. **Repaso**  
   Archivo: `server/repaso.ts`  
   La inspección estática observó sincronización desde `evaluation_progress` al cargar repaso. Debe verificarse si la condición temporal se impone en una capa superior o en una función no revisada.

## 4. Acciones de verificación recomendadas (sin ejecutar todavía)

1. Confirmar que el middleware administrativo exige rol válido en cualquier entorno desplegable y que las rutas administrativas fallan de forma segura si falta identidad o rol.
2. Trazar la cadena de middleware de las rutas de evaluación y repaso, desde el registro de rutas hasta el almacenamiento.
3. Definir pruebas de seguridad en entorno local aislado con datos ficticios: usuario sin sesión, estudiante autenticado, estudiante sin matrícula, fuera de ventana, antes de `review_at`, y administrador autorizado.
4. Verificar que el servidor nunca devuelve puntuación exacta, respuestas correctas, explicaciones ni umbral antes del momento permitido, independientemente de lo que haga el cliente.
5. Verificar que los HTML entregados no contienen respuestas incrustadas antes de la revisión autorizada.
6. Verificar que `score` y `passed` de formularios externos proceden de una validación autorizada y auditable, no de un valor libre del cliente.
7. Comprobar los límites de intentos, reenvíos, solicitudes concurrentes y duplicados una vez ratificado el modelo de estados.
8. Documentar resultados, evidencia reproducible y commit exacto revisado. No usar producción para pruebas.

## 5. Relación con la especificación P0-E

El contrato funcional propuesto establece que el estudiante recibe inicialmente solo «Aprobado» o «No aprobado»; que la revisión de respuestas se habilita en `review_at = T + 49 h`; que no se aceptan envíos tardíos tras el fin de la extensión; y que los estados de cierre y recuperación deben aplicarse en el servidor. Por tanto, las rutas de envío, consulta, HTML y repaso deben respetar una misma regla de autorización y reloj. La implementación actual debe contrastarse con el documento maestro y las decisiones académicas ratificadas.

Referencias documentales:
- [Especificación maestra P0-E](https://github.com/juanpablomonsalvezb-alt/brkl/blob/docs/p0-e-maestro/docs/P0-E/ESPECIFICACION_MAESTRA.md)
- [Informe de brechas P0-E](https://github.com/juanpablomonsalvezb-alt/brkl/blob/docs/p0-e-maestro/docs/P0-E/INFORME_BRECHAS_P0E_VORTICE.md)
- [Diseño técnico propuesto de máquina de estados](https://github.com/juanpablomonsalvezb-alt/brkl/blob/docs/p0-e-maestro/docs/P0-E/DISENO_TECNICO_PROPUESTO_MAQUINA_ESTADOS.md)
- [Matriz de decisiones académicas pendientes](https://github.com/juanpablomonsalvezb-alt/brkl/blob/docs/p0-e-maestro/docs/P0-E/MATRIZ_DECISIONES_ACADEMICAS_PENDIENTES.md)

## 6. Restricciones de gobernanza

Este documento no autoriza implementar correcciones. Antes de cambiar código se requiere:
- aprobación explícita de los hallazgos y su alcance;
- ratificación de las decisiones académicas relevantes;
- un plan de cambios aislado, con pruebas locales y revisión;
- autorización separada para commit, push, merge o despliegue.

No se modificaron código, base de datos, migraciones ni configuración. No se ejecutaron pruebas ni se accedió a producción al elaborar este anexo.
