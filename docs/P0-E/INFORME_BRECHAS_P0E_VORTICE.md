# Informe de brechas P0-E ↔ Vórtice
**Fecha:** 2026-10-24  
**Rama revisada:** `vortice/integracion`  
**Alcance:** inspección estática del código disponible en GitHub. No se ejecutaron pruebas, no se consultó producción y no se modificó código.

## 1. Resumen ejecutivo

El modelo actual de evaluaciones se apoya en `evaluation_progress`, que almacena resultados terminados. En el código revisado no se encontró un modelo persistente explícito del intento en curso con estado, orden/permutación estable y expiración. Esto deja una brecha de diseño frente a P0-E, que exige distinguir intento activo, envío, consumo del intento, expiración y cierre definitivo.

También se identificaron dos riesgos visibles en las respuestas de la API: el envío de evaluaciones internas devuelve datos de puntaje y respuestas correctas; y el endpoint para formularios externos acepta `score` y `passed` declarados por el cliente. El HTML de evaluaciones puede además incluir respuestas incrustadas, según advertencia del propio código; hace falta comprobar el contenido real almacenado y la autorización efectiva de la ruta.

Estos son hallazgos del código publicado en la rama indicada, no una auditoría dinámica ni una afirmación sobre producción.

## 2. Hallazgos

### H-01 — El endpoint de envío expone puntaje y respuestas correctas
- **Evidencia:** `server/routes.ts`, `POST /api/evaluations/:id/submit`, aprox. líneas 1935–1994.
- **Observación:** el endpoint calcula el puntaje y devuelve `score`, `totalCorrect`, `totalQuestions`, `passingScore` y `results`; cada resultado incluye `correctAnswer` y `explanation`.
- **Regla P0-E relacionada:** el resultado inmediato visible para el estudiante debe limitarse a «Aprobado» o «No aprobado»; la pauta/revisión se habilita después de `review_at`.
- **Impacto potencial:** exposición anticipada de puntaje y clave de respuestas.
- **Confianza:** alta para la forma de la respuesta del código publicado; no se verificó en producción.
- **Prueba necesaria:** prueba de contrato del endpoint que confirme que la respuesta no contiene puntaje, clave, explicaciones ni conteos antes de `review_at`.

### H-02 — La persistencia no representa explícitamente el intento activo
- **Evidencia:** `shared/schema.ts`, `evaluation_progress`, aprox. líneas 202–213; `server/storage.ts`, `saveEvaluationAttempt`, aprox. líneas 496–517.
- **Observación:** la tabla contiene `completedAt`, puntaje, conteos, respuestas y `passed`. El método de guardado inserta una fila de resultado por envío. En esos fragmentos no se modelan estado de intento, expiración, número de intento ni permutación estable.
- **Regla P0-E relacionada:** inicio, reanudación tras recarga, un solo intento activo, consumo al enviar y expiración sin consumo.
- **Impacto potencial:** la persistencia existente no demuestra que pueda garantizarse el ciclo de vida requerido.
- **Confianza:** alta respecto de los fragmentos examinados; no prueba que no exista lógica complementaria en otros archivos.
- **Prueba necesaria:** revisión de todas las rutas y del esquema completo, seguida de pruebas de recarga, concurrencia, abandono, envío repetido y vencimiento.

### H-03 — El componente mantiene respuestas en estado local
- **Evidencia:** `client/src/components/EvaluationQuiz.tsx`, aprox. líneas 49–70 y flujo de navegación posterior.
- **Observación:** `answers`, `currentIndex` y el resultado se mantienen en estado React local; el componente envía las respuestas al endpoint al confirmar.
- **Regla P0-E relacionada:** al recargar debe retomarse el mismo intento y conservar la permutación asignada.
- **Impacto potencial:** el componente examinado no ofrece por sí solo persistencia de borrador ni garantía de reanudación.
- **Confianza:** alta para este componente; podría existir otra capa externa que no se observó.
- **Prueba necesaria:** comprobar el flujo completo de apertura, recarga, reentrada y reanudación antes de concluir el comportamiento integral.

### H-04 — El resultado de formularios externos es autodeclarado por el cliente
- **Evidencia:** `server/routes.ts`, `POST /api/evaluations/:id/complete`, aprox. líneas 1321–1347.
- **Observación:** para evaluaciones sin `questionsJson`, el endpoint acepta `score` y `passed` de `req.body` y los guarda. El comentario del código reconoce que la validación requiere leer las respuestas del formulario.
- **Regla P0-E relacionada:** formularios externos sujetos a validación humana; no confiar en resultados declarados sin validación.
- **Impacto potencial:** un cliente podría declarar un resultado que el servidor no ha verificado, si no existe validación en otra capa.
- **Confianza:** alta para el comportamiento del fragmento publicado; no se probó un intento de explotación.
- **Prueba necesaria:** identificar el flujo de validación humana y bloquear la escritura de un estado aprobado antes de la validación autorizada.

### H-05 — HTML de evaluación podría exponer la clave
- **Evidencia:** `server/routes.ts`, `GET /api/evaluations/:objectiveId/:evaluationNumber/html`, aprox. líneas 1396–1411.
- **Observación:** la ruta devuelve `htmlContent`. El comentario señala que, si el HTML contiene respuestas incrustadas, el estudiante podría verlas en el DOM y que la migración a `questionsJson` evita ese problema.
- **Regla P0-E relacionada:** la pauta solo se habilita tras `review_at`.
- **Impacto potencial:** exposición anticipada si el contenido guardado incluye respuestas.
- **Confianza:** media; el riesgo está advertido en el código, pero el contenido almacenado y las condiciones de acceso no se inspeccionaron.
- **Prueba necesaria:** auditar contenido real de las evaluaciones y autorización de la ruta, sin usar datos sensibles en el informe.

### H-06 — Valor alternativo del puntaje mínimo
- **Evidencia:** `server/routes.ts`, aprox. líneas 1972–1993.
- **Observación:** se usa `evaluation.passingScore || 60`. Si `0` fuera un valor válido, se sustituiría por `60`.
- **Regla relacionada:** umbral de aprobación configurado.
- **Impacto potencial:** umbral distinto del configurado cuando el valor cero sea válido.
- **Confianza:** alta respecto de la expresión; la validez pedagógica de cero debe confirmarse.
- **Prueba necesaria:** acordar el dominio permitido de `passingScore` y cubrirlo con pruebas unitarias.

### H-07 — El acceso por calendario no demuestra las ventanas P0-E
- **Evidencia:** `server/vortice.ts`, `checkEvaluationAccess`, aprox. líneas 183–203; endpoint de envío en `server/routes.ts`.
- **Observación:** la comprobación revisada consulta disponibilidad por calendario y acceso al módulo. No demuestra por sí sola que se apliquen las ventanas `T`, `T+48h`, `review_at = T+49h`, el rechazo tardío con 409 o el vencimiento del intento activo.
- **Impacto potencial:** confundir disponibilidad del módulo con la máquina de estados y plazos de P0-E.
- **Confianza:** alta respecto al alcance del fragmento; no se afirma que ninguna otra ruta implemente esas reglas.
- **Prueba necesaria:** rastrear todas las rutas que abren, envían, completan y revisan evaluaciones, y probar los límites temporales con reloj controlado.

## 3. Brechas de diseño que debe cubrir la especificación técnica

El diseño futuro debe explicar, como mínimo:
1. Identidad única de instancia e intento; estado explícito y transiciones permitidas.
2. Creación del intento, guardado de respuestas y reanudación tras recarga.
3. Consumo del intento exclusivamente al aceptar un envío válido.
4. Protección contra dos intentos activos y contra envíos simultáneos/repetidos.
5. Validación de ventana en el servidor y rechazo tardío con el contrato P0-E.
6. Persistencia de orden de preguntas y alternativas para una instancia.
7. Separación entre resultado inmediato y pauta posterior a `review_at`.
8. Validación humana de formularios externos y registro de aprobación/rechazo.
9. Cierre por aprobación, agotamiento o vencimiento y su auditoría.
10. Restricciones e índices compatibles con el motor real de base de datos, verificados antes de elegir una implementación.

## 4. Plan de verificación propuesto (sin ejecutar todavía)

- **V1 Contrato de respuesta:** comprobar que el estudiante no recibe puntajes ni claves antes de la revisión autorizada.
- **V2 Recarga:** responder parcialmente, recargar y verificar que se restaura el mismo intento y la misma permutación.
- **V3 Envío duplicado:** enviar dos veces la misma petición; debe existir un solo resultado aceptado y un consumo de intento.
- **V4 Concurrencia:** dos envíos simultáneos no pueden crear dos resultados válidos ni exceder el límite.
- **V5 Límite temporal:** probar antes, exactamente en y después del vencimiento; después del límite debe rechazarse según P0-E.
- **V6 Abandono:** cerrar sin enviar y confirmar que no se consume el intento, pero que el intento activo expira según la regla.
- **V7 Formularios externos:** un cliente no puede declarar aprobación sin la validación requerida.
- **V8 Pauta/HTML:** confirmar que la clave no se entrega antes de `review_at`.
- **V9 Umbral:** cubrir valores límite y configuración ausente de `passingScore`.
- **V10 Regresión de progresión:** comprobar que las rutas de acceso a módulos respetan el estado académico definitivo, no solo la existencia de una fila histórica aprobada.

Estas pruebas requieren entorno aislado y autorización explícita antes de ejecutarse. No se propone probar contra producción.

## 5. Límites, referencias y gobernanza

- Repositorio: `juanpablomonsalvezb-alt/brkl`.
- Rama inspeccionada: `vortice/integracion`.
- Los enlaces y líneas se refieren al código visible en GitHub al momento de la inspección; pueden cambiar con nuevos commits.
- La revisión fue estática. No se ejecutaron endpoints, pruebas, migraciones ni consultas a producción.
- No se modificó código.
- No se publicaron los cinco commits locales P0 mencionados por Claude.
- Las decisiones pedagógicas/legales pendientes de P0-E deben mantenerse separadas de las decisiones técnicas.
- Próximo paso recomendado: revisar el flujo completo de rutas y los contratos de lectura del estudiante antes de redactar un diseño técnico de cambios.
