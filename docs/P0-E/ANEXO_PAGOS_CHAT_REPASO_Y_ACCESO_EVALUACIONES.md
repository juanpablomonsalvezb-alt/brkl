# Revisión complementaria de pagos, chat público y repaso espaciado

**Repositorio:** `juanpablomonsalvezb-alt/brkl`  
**Rama inspeccionada:** `vortice/integracion`  
**Fecha:** 2026-10-24  
**Método:** inspección estática de archivos en GitHub. Sin ejecución de código, solicitudes HTTP ni pruebas en producción.

## H-11 — El monto del pago se toma de un campo enviado por el cliente

**Archivo:** `server/flowRoutes.ts`, SHA `82c82b65cac44677ecd01446c955273117ac3e50`.

El endpoint `POST /api/flow/create-payment` extrae `planPrice` del cuerpo y lo convierte con `flowService.parseChileanAmount(planPrice)` para crear el pago. En el fragmento revisado no se observa una comparación con una tarifa canónica del plan obtenida del servidor.

**Riesgo potencial:** modificación del monto si el cliente puede elegir libremente el valor y el servidor no lo reemplaza o valida en otra capa. La evidencia estática no demuestra que un pago manipulado sea aceptado por Flow ni que este endpoint esté accesible en producción.

**Prioridad propuesta:** P0 para confirmar autoridad de precios.

**Verificación requerida:** derivar el importe del plan almacenado en el servidor, comprobar que el plan y la reserva coinciden, validar titularidad/estado de la reserva y probar escenarios de importe alterado en sandbox autorizado.

## H-12 — Consulta del estado del pago y datos devueltos requieren revisión de minimización

**Archivo:** `server/flowRoutes.ts`, mismo SHA.

El módulo incluye un endpoint GET de estado de pago por token. Este documento no afirma que el token sea adivinable ni que se devuelvan datos sensibles concretos, porque el fragmento completo de respuesta y el modelo de amenazas deben verificarse juntos.

**Riesgo potencial:** exposición excesiva de datos de la reserva o del estado de pago si el token funciona como único control y la respuesta devuelve más información de la necesaria.

**Prioridad propuesta:** P1.

**Verificación requerida:** inspeccionar el handler completo, definir si el token se trata como secreto portador, limitar la respuesta a estado mínimo, no devolver datos personales innecesarios y revisar caducidad/reutilización.

## H-13 — Endpoint público de chat puede disparar una operación de captación y notificación

**Archivo:** `server/salesChatRoutes.ts`, SHA `212408ce9a23691beb1447c13487df6b35ab6568`.

El endpoint público `POST /api/chat/sales` valida que el mensaje sea texto no vacío y de hasta 2000 caracteres, filtra el historial a roles `user/assistant` y conserva los últimos diez turnos. Si el modelo genera una llamada a `registrar_interesado`, el servidor analiza sus argumentos, valida nombre/correo con el esquema de lista de espera, consulta duplicados y puede disparar notificaciones por correo.

En el módulo revisado no se observa un límite de frecuencia por IP, sesión o identificador de cliente. La llamada a la herramienta depende de la salida del modelo; el texto del prompt indica que el nombre y correo deben ser aportados por la persona, pero una instrucción al modelo no reemplaza una validación determinista en el servidor.

**Riesgos potenciales:** abuso del servicio externo de IA, consumo de cuota, envío reiterado de correos y registros no deseados si no existen límites en otra capa.

**Prioridad propuesta:** P1.

**Recomendación:** límites de frecuencia y tamaño a nivel de servidor/proxy; límite de llamadas a herramientas por petición; validación determinista de consentimiento e intención antes de registrar; idempotencia para notificaciones; observabilidad sin registrar datos personales innecesarios.

## H-14 — La sincronización de repaso genera ítems a partir de intentos históricos

**Archivo:** `server/repaso.ts`, SHA `914f0af8786f748b694f89ef63db17b1a0525771`.

`loadDueReview` llama a `syncReviewItems`, que consulta los intentos del estudiante con respuestas guardadas, une las evaluaciones y genera ítems de repaso a partir de sus preguntas. El código comentado indica que el conjunto se sincroniza al leer el repaso y que los ítems existentes no se modifican. En el fragmento revisado no se observa un filtro explícito por `review_at` o por la ventana de publicación P0-E en esa sincronización.

**Riesgo funcional/académico potencial:** si la sincronización incluye intentos antes de la fecha autorizada, el sistema podría poner contenido de una evaluación en el circuito de repaso antes del momento permitido. El handler de respuesta y los controles de acceso deben revisarse en conjunto; no se afirma que la respuesta correcta sea devuelta por el endpoint de listado, que explícitamente comenta que no incluye `correctAnswer`.

**Prioridad propuesta:** P0 funcional, condicionada a confirmar la política temporal aplicada en todos los caminos.

**Recomendación:** centralizar la elegibilidad temporal del intento antes de crear/listar ítems, según la decisión académica aprobada, y probar límites temporales con casos de antes, exactamente en y después de `review_at = T+49h`.

## H-15 — Endpoint de evaluación por ID no muestra comprobación local de acceso en el fragmento revisado

**Archivo:** `server/routes.ts`, SHA `fa05596aa0d9be9e8efa7757599e564b7b9c96d0`.

El handler `GET /api/evaluations/:id` recupera una evaluación, transforma las preguntas para retirar respuestas y devuelve título, total de preguntas, puntaje de aprobación y preguntas. En el fragmento revisado no se observa una comprobación local de sesión ni una llamada a `checkEvaluationAccess` antes de responder.

**Riesgo potencial:** acceso a preguntas sin verificar identidad, matrícula, ventana temporal o disponibilidad, si no existe un control anterior en otra capa. La transformación elimina respuestas, pero no sustituye autorización académica.

**Prioridad propuesta:** P0 condicionado a revisar el encadenamiento completo de middleware.

**Recomendación:** exigir sesión y validar acceso al módulo/evaluación desde el servidor; devolver solo campos permitidos; probar anónimo, alumno sin matrícula, alumno fuera de ventana y alumno autorizado en entorno de pruebas.

## Correlación con P0-E

Los hallazgos H-11 a H-15 deben revisarse junto con el contrato académico P0-E:
- resultado inmediato solo “Aprobado” o “No aprobado”;
- cierre por aprobación o agotamiento de intentos;
- clave y revisión no antes de `review_at = T+49h`;
- la evaluación debe aplicar un ciclo de intento explícito y persistir la versión/permutación si se adopta el diseño aprobado.

## Límites

- Lectura estática únicamente; las prioridades son propuestas.
- No se probaron pagos reales ni sandbox, no se enviaron correos de prueba y no se llamó al proveedor de IA.
- No se hicieron solicitudes a producción.
- No se modificó código, configuración ni base de datos.
- Los riesgos que dependen de controles externos permanecen condicionados hasta verificar toda la cadena.
