# Anexo: revisión estática de módulos de rutas registrados por separado

**Proyecto:** Barkley / Vórtice  
**Rama de referencia:** `docs/p0-e-maestro`  
**Fecha de revisión:** 24 de octubre de 2026  
**Alcance:** lectura estática de los módulos de rutas citados abajo y del punto de registro en `server/routes.ts`. No se ejecutaron pruebas, no se llamaron endpoints y no se verificó comportamiento en producción.

## Conclusión ejecutiva

La revisión detecta rutas con efectos de escritura y rutas administrativas en módulos separados que, en el propio archivo revisado, no declaran middleware de autenticación ni autorización. Como estos módulos se registran directamente mediante `register...(app)`, el middleware local `isAdmin` definido en `server/routes.ts` no se aplica automáticamente a ellas. La conclusión es sobre el código estático de esta rama; no acredita exposición efectiva en producción ni descarta controles externos no incluidos en el alcance.

## Evidencia por módulo

### 1. `server/evaluationLinksRoutes.ts`

Rutas observadas:
- `GET /api/evaluation-links/:courseId/:moduleNumber`
- `POST /api/evaluation-links`
- `GET /api/evaluation-links/:courseId`
- `DELETE /api/evaluation-links/:id`
- `PUT /api/evaluation-links/:id`

Hallazgos:
- Las rutas de lectura devuelven registros de links asociados a cursos/módulos; en este archivo no se ve comprobación de sesión, matrícula o autorización del solicitante.
- El `POST` valida el esquema, pero después elimina los links existentes del curso/módulo indicado por el primer elemento y crea los nuevos. No se ve autorización del actor ni comprobación de que todos los elementos correspondan al mismo curso/módulo.
- `PUT` y `DELETE` modifican o eliminan registros por ID sin una comprobación local de rol.
- El `POST` usa `validatedLinks[0]`; un array vacío puede conducir a una excepción y respuesta 500. Es un problema de validación/robustez, separado de autorización.

**Prioridad sugerida:** alta para escrituras; revisar si los links contienen URLs o información que deba limitarse a estudiantes matriculados.

### 2. `server/faqRoutes.ts`

Rutas públicas identificadas:
- `GET /api/faqs`
- `GET /api/faqs/:id`

Rutas con prefijo administrativo:
- `GET /api/admin/faqs`
- `POST /api/admin/faqs`
- `PUT /api/admin/faqs/:id`
- `DELETE /api/admin/faqs/:id`
- `PATCH /api/admin/faqs/reorder`
- `POST /api/admin/faqs/import`

Hallazgos:
- Las rutas administrativas leen datos inactivos y permiten crear, modificar, borrar, reordenar o importar FAQs. En este módulo no se declaran `isAuthenticated`, `isAdmin` ni comprobaciones equivalentes antes de esas operaciones.
- La validación de esquema en creación/actualización no sustituye autorización.
- La importación procesa un archivo Word en memoria; además de autorización, conviene revisar límites de tamaño y validación del archivo, ya que el `multer` local se configura sin límite explícito en este archivo.

**Prioridad sugerida:** alta para las rutas administrativas y la importación.

### 3. `server/paesRoutes.ts`

Rutas públicas identificadas:
- `GET /api/paes/subjects`
- `GET /api/paes/plans`
- `POST /api/paes/subscriptions` (comentada como pública/usuario)

Rutas administrativas identificadas:
- Lectura y CRUD de `/api/admin/paes/subjects`
- Lectura y CRUD de `/api/admin/paes/plans`
- Lectura, actualización y eliminación de `/api/admin/paes/subscriptions`

Hallazgos:
- En el archivo revisado, las rutas `/api/admin/paes/*` no declaran middleware de autenticación/autorización ni chequeos locales de rol.
- La ruta pública de suscripciones crea registros a partir del cuerpo validado. La validación de esquema no acredita consentimiento, identidad ni evita por sí sola abuso automatizado.
- La actualización de suscripciones toma `status` y `notes` del cuerpo sin validación de esquema visible en ese handler.

**Prioridad sugerida:** alta para administración de materias/planes/suscripciones; revisar abuso y validación de la ruta pública de suscripción.

### 4. `server/salesChatRoutes.ts`

Ruta identificada:
- `POST /api/chat/sales`

Hallazgos:
- Es un endpoint público de chatbot y el carácter público parece intencional para el sitio.
- Valida que el mensaje sea texto no vacío y que no supere 2.000 caracteres; filtra el historial a turnos de usuario/asistente y conserva los últimos diez.
- El historial es aportado por el cliente y no se observa límite de frecuencia en este módulo. Debe revisarse en el contexto del montaje completo si hay rate limiting, controles de coste o protección ante automatización.
- El chatbot puede invocar una herramienta que registra interesados y envía notificaciones. La instrucción del prompt exige confirmación de nombre y correo, pero no es un control de autorización fuerte: conviene validar la confirmación en lógica determinista antes de insertar/enviar.

**Prioridad sugerida:** media, enfocada en abuso, gasto de proveedor y registros no solicitados.

### 5. `server/flowRoutes.ts`

Rutas identificadas:
- `POST /api/flow/create-payment`
- `POST /api/flow/confirm`
- `GET /api/flow/payment-status/:token`

Hallazgos:
- `POST /api/flow/confirm` comprueba que exista firma y la valida con `flowService.validateSignature`, lo cual es un control explícito positivo. La revisión estática no verifica la corrección criptográfica interna de esa función ni el comportamiento real del proveedor.
- `POST /api/flow/create-payment` busca una reserva por `reservationId`, pero no se observa una verificación de propiedad/identidad del solicitante. Recibe `planPrice` del cuerpo y lo convierte a monto; debe comprobarse que el precio se derive del plan guardado en servidor y no de un valor controlado por el cliente.
- `GET /api/flow/payment-status/:token` consulta el estado en Flow y devuelve también el registro completo de la reserva encontrada por `flowToken`. El token puede funcionar como credencial de acceso; revisar si la respuesta expone datos personales o administrativos innecesarios y devolver solo campos mínimos.
- En la respuesta de pago pendiente se construye una URL de `sandbox.flow.cl`; confirmar configuración de entorno para que no se use accidentalmente en producción.
- La confirmación consulta el estado directamente al proveedor, lo que es positivo; revisar idempotencia y transiciones de estado ante callbacks repetidos.

**Prioridad sugerida:** alta para propiedad de reserva, monto autoritativo y minimización de datos del endpoint de estado.

## Registro de los módulos

En `server/routes.ts`, al final de `registerRoutes`, se invocan directamente:
- `registerEvaluationLinksRoutes(app)`
- `registerFaqRoutes(app)`
- `registerPaesRoutes(app)`
- `registerSalesChatRoutes(app)`
- `registerFlowRoutes(app)`

El registro directo no añade por sí mismo `isAuthenticated` o `isAdmin` a las rutas declaradas dentro de esos módulos. En consecuencia, no debe suponerse que el middleware `isAdmin` usado en rutas declaradas en `server/routes.ts` proteja automáticamente estas rutas separadas.

## Acciones recomendadas para una revisión posterior

1. Añadir autenticación y autorización de servidor a toda ruta administrativa o de escritura que no sea intencionalmente pública; definir explícitamente las excepciones públicas.
2. Para evaluation-links, validar array no vacío, consistencia de curso/módulo, permiso sobre el curso y acceso del estudiante antes de devolver links.
3. Para FAQ y PAES, proteger todas las rutas `/api/admin/*` con middleware central y pruebas negativas 401/403.
4. Para Flow, derivar monto/plan desde la reserva y catálogo en servidor, comprobar permiso de acceso a la reserva y minimizar los datos devueltos por `payment-status`.
5. Para el chatbot y suscripciones públicas, aplicar límites de frecuencia/coste, validación determinista de confirmación y medidas antiabuso.
6. Verificar por separado middleware global, proxy, configuración de despliegue y entorno productivo antes de afirmar exposición real.

## Límites y cautelas

- Este documento es un inventario de señales estáticas, no una auditoría de penetración.
- No se ha afirmado explotación, acceso externo exitoso ni estado de producción.
- No se modificó código, base de datos, configuración ni despliegue.
- No se ejecutaron pruebas automatizadas ni llamadas a servicios externos.
- Los hallazgos deben validarse contra la arquitectura completa y los controles compartidos antes de implementar cambios.
