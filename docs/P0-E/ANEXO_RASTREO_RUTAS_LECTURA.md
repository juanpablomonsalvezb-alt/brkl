# Anexo de rastreo de rutas y superficies de lectura P0-E
**Fecha:** 2026-10-24  
**Rama inspeccionada:** `vortice/integracion`  
**Tipo de revisión:** estática, complementaria al `INFORME_BRECHAS_P0E_VORTICE.md`. Sin pruebas dinámicas ni acceso a producción.

## 1. Hallazgo adicional de prioridad alta — lectura de preguntas sin comprobación de sesión

### H-08 — `GET /api/evaluations/:id` no comprueba autenticación en la propia ruta
- **Evidencia:** `server/routes.ts`, aprox. líneas 1908–1933.
- **Observación:** la ruta obtiene la evaluación por ID, transforma las preguntas mediante `toStudentQuestions` y responde con título, cantidad de preguntas, umbral y preguntas. A diferencia de `POST /api/evaluations/:id/submit`, el fragmento de lectura no comprueba `currentUserId(req)` ni aplica `checkEvaluationAccess`.
- **Control positivo:** `toStudentQuestions` elimina `correctAnswer` y `explanation` mediante lista blanca, por lo que el fragmento sí evita exponer esos dos campos en la respuesta de lectura.
- **Riesgo:** si no hay middleware global aplicable a esta ruta —no visible en el registro examinado— una persona sin sesión que conozca o consiga el ID podría recuperar las preguntas, incluso sin verificar matrícula, disponibilidad o ventana de evaluación.
- **Confianza:** alta sobre la ausencia de controles dentro de esta ruta; pendiente comprobar middleware global, configuración de montaje y comportamiento real.
- **Verificación requerida:** revisar el middleware de la aplicación y confirmar que la ruta exige sesión, matrícula y disponibilidad; después probar acceso anónimo y acceso con un usuario matriculado en otra asignatura, siempre en entorno aislado.

## 2. H-09 — La ruta de HTML comprueba sesión, pero no matrícula ni ventana

- **Evidencia:** `server/routes.ts`, aprox. líneas 1397–1411.
- **Observación:** comprueba que `currentUserId(req)` exista, pero devuelve `htmlContent` consultado por objetivo y número de evaluación sin llamar en el fragmento a `checkEvaluationAccess` ni comprobar matrícula. El propio comentario advierte que el HTML puede llevar respuestas incrustadas.
- **Riesgo:** usuarios autenticados podrían acceder a HTML fuera de su asignatura/ventana, y la pauta podría estar en el DOM si se encuentra incrustada.
- **Confianza:** alta para los controles visibles en el fragmento; pendiente descartar middleware o controles de datos adicionales.
- **Verificación requerida:** inspeccionar la política de acceso completa y el HTML almacenado; verificar la autorización por estudiante, asignatura, calendario y ventana antes de devolver contenido.

## 3. H-10 — El repaso espaciado se sincroniza desde intentos sin esperar a `review_at`

- **Evidencia:** `server/repaso.ts`, aprox. líneas 25–62 y 75–115.
- **Observación:** `syncReviewItems` recorre los resultados de `evaluation_progress` y crea ítems de repaso a partir de las respuestas y preguntas. `loadDueReview` llama a esa sincronización al cargar el repaso. En los fragmentos examinados no se ve una condición que compare la fecha actual con `review_at` antes de crear los ítems.
- **Matiz:** la respuesta de repaso no incluye `correctAnswer` en su estructura pública. Sin embargo, el usuario puede ver preguntas/opciones derivadas de la evaluación y responderlas; la corrección posterior devuelve la respuesta correcta y explicación.
- **Riesgo:** si P0-E exige que toda revisión derivada de una evaluación quede bloqueada hasta `review_at`, el flujo actual podría permitir repaso antes del momento permitido. El riesgo exacto depende del calendario de los ítems y de otros controles.
- **Confianza:** media-alta para la falta de comprobación visible en las funciones revisadas; falta validar fechas y flujo completo.
- **Verificación requerida:** usar reloj controlado para comprobar que ni la sesión de repaso ni la corrección entregan contenido de una evaluación antes de `review_at`.

## 4. Controles positivos que deben conservarse

1. **Lista blanca para preguntas:** `shared/evaluations.ts` define `toStudentQuestions` y devuelve únicamente `id`, `question` y `options`.
2. **Lista blanca para el listado de evaluaciones:** `toPublicEvaluation` omite `questionsJson` y `htmlContent`; la ruta de calendario usa este transformador.
3. **Repaso sin clave en la sesión inicial:** `loadDueReview` arma preguntas sin incluir `correctAnswer` en el objeto `ReviewQuestion`.
4. **El módulo depende de E2 aprobada:** en `server/vortice.ts` y `server/storage.ts`, la finalización de módulo se basa en una E2 aprobada. Esto es consistente con la regla de que agotar E2 no desbloquea automáticamente el siguiente módulo, aunque el estado definitivo y los intentos múltiples requieren un modelo más explícito.

Estos controles positivos no eliminan las brechas de ventana, autenticación/autorización y ciclo de vida descritas arriba.

## 5. Resultado del rastreo ampliado

La revisión confirma que existen transformadores de respuesta seguros en algunas rutas, pero no están aplicados uniformemente a todos los caminos de lectura. La prioridad para la siguiente revisión técnica debería ser:

1. **P0 de seguridad y pauta:** acceso a `GET /api/evaluations/:id`, acceso al HTML y cualquier clave embebida.
2. **P0 de reglas de revisión:** bloquear repaso y devolución de clave hasta `review_at` según P0-E.
3. **P1 de ciclo de vida:** modelo persistente de intentos, límites de envío, reanudación, ventanas y cierre.
4. **P1 de integridad:** validación de formularios externos y consistencia transaccional del envío.

No se ejecutaron pruebas ni se modificó código. El siguiente paso de verificación requiere un entorno aislado y autorización expresa para ejecutar pruebas; no se debe validar contra producción.
