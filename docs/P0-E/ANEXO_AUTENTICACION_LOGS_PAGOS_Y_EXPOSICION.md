# Revisión complementaria de autenticación, middleware y exposición de datos

**Repositorio:** `juanpablomonsalvezb-alt/brkl`  
**Rama inspeccionada:** `vortice/integracion`  
**Fecha de revisión:** 2026-10-24  
**Tipo:** revisión estática de código; no se ejecutó la aplicación ni se probaron endpoints en producción.

## Alcance y fuentes

- `server/replit_integrations/auth/replitAuth.ts` — SHA `69ce786fb8ff371fe3b5e04c6bd2e4a3642abacb`.
- `server/index.ts` — SHA `62ba3cd9e96810de143832e8655d394eb6e3ff35`.
- `server/routes.ts` — SHA `fa05596aa0d9be9e8efa7757599e564b7b9c96d0`.
- `server/paesRoutes.ts` — SHA `e91a8efd5c982db824197a604cf874a1fd783e7f`.
- `server/flowRoutes.ts` — SHA `82c82b65cac44677ecd01446c955273117ac3e50`.
- `server/salesChatRoutes.ts` — SHA `212408ce9a23691beb1447c13487df6b35ab6568`.

Este documento registra señales estáticas y preguntas de verificación. **No demuestra por sí solo que una ruta esté accesible desde Internet ni que una configuración insegura esté activa en producción.** Se requiere revisar configuración de despliegue, rutas completas, guards externos y, después de autorizarlo, pruebas controladas.

## Hallazgos adicionales

### H-01 — La configuración de autenticación puede omitirse o fallar y el servidor continúa
**Señal:** en `server/routes.ts`, `setupAuth(app)` se ejecuta solo si existe `REPLIT_DEPLOYMENT` o el par `GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET`. Si no, el código registra que corre sin autenticación. Si el setup lanza una excepción, se captura y se continúa registrando rutas.

**Impacto potencial:** el estado de autenticación depende de variables de entorno y de un fallo que no detiene el arranque. Esto no significa que todas las rutas queden abiertas: algunas comprueban usuario/rol de forma local y deben evaluarse por separado.

**Prioridad propuesta:** P0 de configuración, si la aplicación puede arrancar en un entorno accesible sin autenticación configurada.

**Verificación requerida:** confirmar variables y estrategia de autenticación en cada entorno de despliegue; decidir si un entorno de producción debe fallar de forma cerrada cuando falten credenciales o falle la inicialización; probar rutas protegidas con y sin sesión en entorno autorizado.

### H-02 — Registro global de respuestas JSON de API
**Señal:** `server/index.ts` reemplaza `res.json` para capturar el cuerpo y, al terminar cada respuesta `/api`, agrega `JSON.stringify(capturedJsonResponse)` al registro.

**Impacto potencial:** pueden terminar en logs datos personales, resultados académicos, identificadores, contenido de formularios o detalles internos. El riesgo depende de los cuerpos reales de respuesta y de quién puede acceder/conservar los logs.

**Prioridad propuesta:** P0/P1, hasta revisar las políticas y el contenido registrado.

**Recomendación documental:** preferir logging estructurado por lista permitida (ruta normalizada, método, estado, duración, identificador de correlación) y excluir por defecto cuerpos de respuesta, tokens, datos personales y respuestas académicas. Si se necesita depuración, usar redacción explícita y temporal.

### H-03 — Resultado de evaluación con puntaje y respuestas correctas en la respuesta de envío
**Señal:** `POST /api/evaluations/:id/submit` calcula el puntaje en servidor, persiste el intento y devuelve `score`, cantidad correcta/total, umbral y `results` con `correctAnswer` y `explanation`.

**Impacto potencial:** la respuesta expone más información que el resultado inmediato definido para P0-E y puede revelar la pauta antes de la ventana autorizada de revisión. El almacenamiento del resultado no sustituye la política de cuándo puede mostrarse.

**Prioridad propuesta:** P0 funcional/académica.

**Recomendación:** separar el resultado inmediato (solo “Aprobado”/“No aprobado”) de la revisión posterior; aplicar la regla de publicación temporal antes de devolver respuestas correctas o explicaciones.

### H-04 — Rutas de administración de PAES sin guard local visible en el módulo
**Señal:** en `server/paesRoutes.ts`, varias rutas `/api/admin/paes/*` para listar, crear, actualizar y eliminar materias/planes/suscripciones no muestran middleware local de autenticación/rol en sus handlers.

**Impacto potencial:** si no hay un guard equivalente en otra capa, operaciones administrativas podrían quedar expuestas. La revisión del archivo por sí sola no permite descartar guards externos o de plataforma.

**Prioridad propuesta:** P0, condicionada a confirmar el encadenamiento real de middleware.

**Verificación requerida:** rastrear todas las capas previas a esas rutas y probar 401/403 con sesión ausente, usuario autenticado sin rol y administrador autorizado, solo en entorno de pruebas autorizado.

### H-05 — Creación de pago recibe precio desde el cliente
**Señal:** el módulo `server/flowRoutes.ts` recibe `planPrice` en el cuerpo de la solicitud de creación de pago. El flujo también debe verificarse por titularidad de reserva, uso del token, idempotencia y minimización de datos en consulta de estado.

**Impacto potencial:** si el importe se acepta como autoridad del cliente en vez de derivarse de un plan/precio del servidor, existe riesgo de manipulación del monto. No se ha demostrado aquí que el proveedor acepte un importe manipulado.

**Prioridad propuesta:** P0 para validación de pagos.

**Verificación requerida:** confirmar que el servidor recalcula el importe desde una tarifa canónica, valida reserva y usuario, limita el acceso al estado por token y maneja confirmaciones repetidas de forma idempotente. Nunca probar pagos reales durante la revisión estática.

### H-06 — El endpoint de evaluación por ID no muestra una comprobación local de usuario
**Señal:** `GET /api/evaluations/:id` obtiene la evaluación y devuelve preguntas saneadas con título, total y puntaje de aprobación; en el fragmento revisado no aparece una comprobación explícita de sesión ni una llamada visible a `checkEvaluationAccess`.

**Impacto potencial:** podría permitir recuperar preguntas de evaluaciones sin validar identidad, matrícula, calendario o acceso al módulo, si no existe un guard global o de infraestructura.

**Prioridad propuesta:** P0, condicionado a confirmar middleware previo y sensibilidad del contenido.

**Verificación requerida:** rastrear el montaje completo de rutas y validar acceso para anónimo, estudiante de otro curso, estudiante sin ventana habilitada y estudiante autorizado.

## Confirmaciones relevantes

- `isAuthenticated` devuelve 401 cuando no hay sesión Passport válida, no existe `expires_at` o no puede renovarse el token. Esto protege solo rutas donde se aplica efectivamente.
- El middleware de logging corre antes del registro de rutas y observa las respuestas JSON de API que pasan por esa instancia.
- El código contiene algunos controles locales (por ejemplo, verificaciones de usuario en endpoints concretos), por lo que no debe generalizarse que todas las rutas carecen de protección.
- La llamada a `setupAuth` y la presencia de `isAuthenticated` no prueban que todos los handlers administrativos estén protegidos.

## Orden recomendado para la próxima fase

1. Elaborar una matriz ruta por ruta de **middleware efectivo**, no solo del nombre de la ruta: autenticación, rol, titularidad, acceso académico y límites temporales.
2. Confirmar configuración de autenticación y política de arranque por entorno, sin publicar secretos ni valores.
3. Retirar cuerpos de respuesta del logging por defecto o especificar redacción y retención.
4. Alinear el contrato de envío de evaluación con P0-E y con `review_at = T+49h`.
5. Auditar la autoridad de precio, titularidad e idempotencia del flujo de pagos.
6. Preparar pruebas negativas reproducibles; no ejecutarlas hasta autorización expresa y entorno identificado.

## Límites de esta revisión

- Solo lectura estática de archivos y fragmentos del repositorio.
- No se modificó código de aplicación, esquema ni base de datos.
- No se ejecutaron tests, migraciones, llamadas HTTP ni pruebas de penetración.
- No se accedió a producción ni se verificó la configuración real de despliegue.
- Las prioridades son propuestas de triage y deben ajustarse al confirmar exposición efectiva.
