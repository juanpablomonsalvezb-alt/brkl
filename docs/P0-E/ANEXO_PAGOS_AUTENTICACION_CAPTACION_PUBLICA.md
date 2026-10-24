# Anexo de verificación — pagos, autenticación y captación pública

Estado: inspección estática de código; sin ejecución ni comprobación del entorno desplegado.
Rama de código revisada: `vortice/integracion`.
Rama documental: `docs/p0-e-maestro`.
Fecha: 24-10-2026.

## 1. Alcance y cautela

Este anexo amplía el registro consolidado de riesgos. Los hallazgos describen lo visible en los archivos revisados; no prueban explotación ni confirman que esta rama sea la desplegada. Antes de clasificar un riesgo como vulnerabilidad efectiva, hay que comprobar el entorno, el montaje de rutas, las políticas externas y los controles de infraestructura.

## 2. Hallazgos adicionales

### H-16 — El endpoint de estado de Flow devuelve datos más amplios que el estado mínimo necesario
- Evidencia: `server/flowRoutes.ts`, handler `GET /api/flow/payment-status/:token`. Consulta el estado en Flow y devuelve `payment: paymentStatus` y `reservation: reservation || null`, donde la reserva se obtiene por `flowToken`.
- Impacto potencial: el objeto de pago contiene campos como correo del pagador, monto, concepto, orden, datos opcionales y detalles de pago; la reserva completa puede contener datos personales o internos innecesarios para una pantalla de resultado.
- Certeza: alta sobre la amplitud de la respuesta en el código; exposición efectiva depende de si el token puede obtenerse/compartirse y de qué campos devuelve la tabla de reservas.
- Cierre propuesto: responder solo con estado, monto/moneda y referencia pública imprescindibles; no devolver la fila completa ni el objeto completo de Flow. Revisar redacción de logs y política de expiración/uso del token.

### H-17 — La creación de pago confía en un precio enviado por el cliente y no muestra autorización sobre la reserva
- Evidencia: `server/flowRoutes.ts`, `POST /api/flow/create-payment` toma `reservationId`, `planPrice`, `studentEmail` y `studentName` del body; busca la reserva por ID y calcula el monto desde `planPrice`. En el handler revisado no se observa comprobación de que el solicitante sea propietario de la reserva ni que el precio coincida con el plan contratado.
- Impacto potencial: monto alterado, pago iniciado para una reserva ajena o datos de pagador no coherentes con la reserva, según las capas que existan fuera del handler.
- Cierre propuesto: obtener precio desde catálogo/configuración del servidor y plan persistido; validar relación entre reserva, persona autorizada, plan y moneda; hacer la operación idempotente bajo concurrencia.

### H-18 — La respuesta de estado de pago y los datos de pago requieren minimización
- Evidencia: `server/flowService.ts` tipa `FlowPaymentStatus` con `payer`, `optional`, `paymentData`, `merchantId`, montos y metadatos; `flowRoutes.ts` devuelve el objeto entero en JSON.
- Impacto potencial: exposición de metadatos comerciales o personales en navegador, cachés, herramientas de analítica o logs que no necesitan esa información.
- Cierre propuesto: crear DTO explícito y reducido para cliente. No cambiar el contrato hasta inventariar los consumidores y aprobar compatibilidad.

### H-19 — El montaje de autenticación puede continuar tras fallar la inicialización
- Evidencia: `server/routes.ts` configura autenticación solo cuando existe `REPLIT_DEPLOYMENT` o están presentes `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`; el `catch` de `setupAuth(app)` registra advertencia y continúa. Si no hay variables, registra que corre sin autenticación. Esto ocurre antes del registro de rutas, pero el propio código no detiene el arranque.
- Impacto potencial: configuración equivocada o fallo de autenticación podría dejar una instancia operando con rutas que esperan controles globales. El riesgo real depende de las condiciones de despliegue y del resto de middleware.
- Cierre propuesto: definir un modo de producción explícito; si faltan credenciales o falla la autenticación en producción, fallar el arranque de forma cerrada. Verificar el montaje real en un entorno autorizado antes de cambiarlo.

### H-20 — URL de pago pendiente construida con host de sandbox fijo
- Evidencia: en `server/flowRoutes.ts`, cuando la reserva ya tiene pago pendiente, `existingPaymentUrl` se construye con `https://sandbox.flow.cl/app/web/pay.php?token=...`, en lugar de derivarse del entorno/proveedor configurado.
- Impacto potencial: en un entorno de producción, una repetición podría devolver una URL de sandbox y bloquear o desviar el flujo de pago.
- Cierre propuesto: usar una URL provista/configurada por el servicio de pagos y comprobar comportamiento de sandbox y producción con cuentas de prueba autorizadas.

### H-21 — Parseo del precio sin validación explícita del resultado numérico
- Evidencia: `server/flowService.ts`, `parseChileanAmount` elimina símbolos y separadores y llama a `parseInt`; no valida en ese método que el resultado sea un entero positivo y finito. `create-payment` comprueba presencia truthy de `planPrice`, pero no se observa una validación de importe posterior a la conversión.
- Impacto potencial: cadenas malformadas pueden producir montos inválidos o inesperados; la aceptación final depende de Flow y de las validaciones no visibles.
- Cierre propuesto: validar monto en servidor contra el catálogo; rechazar NaN, valores no enteros, cero, negativos y rangos fuera de política.

### H-22 — Captación pública de lista de espera puede disparar notificaciones por cada reenvío
- Evidencia: `server/routes.ts`, `POST /api/waitlist` no inserta un duplicado si el correo ya existe, pero igualmente llama a `notifyByEmail` y `sendConfirmationEmail` antes de responder que ya estaba inscrito. No se observa rate limiting en el fragmento revisado.
- Impacto potencial: abuso de correo, ruido operativo o costes de envío mediante reenvíos repetidos. El efecto puede estar mitigado por controles externos no inspeccionados.
- Cierre propuesto: rate limiting, cooldown por correo/IP o mecanismo equivalente, límites de envío y observabilidad sin registrar más datos personales de los necesarios.

### H-23 — Sala de estudio anónima permite actualizar presencia con identificador del cliente
- Evidencia: comentario y handler `POST /api/together/heartbeat` describen que no requiere login y que `clientId` vive en localStorage; actualiza nombre, asignatura, sala y última actividad. `GET /api/together/presence` expone nombres y asignaturas de usuarios activos.
- Impacto potencial: suplantación de nombres, spam de presencia o divulgación de actividad educativa; el alcance es limitado por los campos devueltos y la ventana de 30 segundos.
- Cierre propuesto: limitar frecuencia y tamaño de payload; definir nombres visibles permitidos; considerar identificadores efímeros firmados o controles adicionales si la sala se usa con menores.

## 3. Controles positivos observados

- `POST /api/flow/confirm` valida que exista firma y usa `flowService.validateSignature` antes de consultar el estado de la transacción.
- La confirmación consulta el estado en Flow antes de cambiar el estado local; no confía únicamente en un campo de estado enviado por el cliente.
- `multer` en `server/routes.ts` establece límite de 10 MB y filtra por MIME de Word para la carga revisada. Esto no sustituye validar el contenido real del archivo ni revisar rutas concretas de carga.

## 4. Orden recomendado de verificación

1. Confirmar entorno de despliegue, variables de autenticación y política de fallo cerrado.
2. Minimizar respuesta y logs de estado de pago; comprobar que no se filtra la reserva completa.
3. Hacer precio y autorización de reserva autoritativos en servidor.
4. Corregir la URL de pago pendiente por entorno y validar importes.
5. Aplicar límites a lista de espera, chat y presencia anónima.
6. Mantener pruebas de verificación fuera de producción, con datos sintéticos y autorización separada.

## 5. Límites de este trabajo

- No se modificó código, esquema, configuración ni datos.
- No se ejecutaron pruebas dinámicas ni solicitudes a producción.
- No se confirma que la rama revisada esté desplegada.
- Este anexo no autoriza implementación, merge ni despliegue.
