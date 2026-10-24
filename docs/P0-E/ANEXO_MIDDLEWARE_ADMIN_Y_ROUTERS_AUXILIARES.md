# Revisión focalizada: middleware administrativo y routers auxiliares

**Repositorio:** `juanpablomonsalvezb-alt/brkl`  
**Rama de código revisada:** `vortice/integracion`  
**Fecha:** 2026-10-24  
**Método:** lectura estática de archivos en GitHub. No se ejecutó el sistema, no se enviaron solicitudes HTTP y no se probó producción.

## 1. Hallazgo crítico confirmado en el código fuente

### H-07 — El middleware `isAdmin` continúa inmediatamente sin comprobar el rol

En `server/routes.ts` (SHA `fa05596aa0d9be9e8efa7757599e564b7b9c96d0`), la función `isAdmin` ejecuta `next(); return;` antes de un bloque comentado que contiene la verificación de sesión y del perfil con rol `admin`. El comentario lo describe como “DEV MODE”.

**Qué demuestra la evidencia:** cualquier ruta que dependa exclusivamente de ese middleware no recibe la comprobación de rol implementada en el bloque comentado.

**Qué no demuestra:** que todas esas rutas sean anónimas; algunas pueden hacer controles propios en el handler, y puede haber controles externos al código inspeccionado.

**Prioridad propuesta:** P0. Requiere verificación de alcance y corrección autorizada antes de considerar el sistema listo para producción.

## 2. Routers auxiliares registrados en la aplicación

Al final de `registerRoutes`, `server/routes.ts` registra directamente `registerEvaluationLinksRoutes(app)`, `registerFaqRoutes(app)`, `registerPaesRoutes(app)`, `registerSalesChatRoutes(app)` y `registerFlowRoutes(app)`. Registrar estos módulos no añade automáticamente un middleware de autorización a las rutas que cada uno declara.

### H-08 — CRUD de FAQ bajo prefijo administrativo sin guard local visible

Archivo: `server/faqRoutes.ts`, SHA `ab4ed058ec03557e8f0ffd5ed52e9eebab61cf6a`.

Las rutas `/api/admin/faqs` y sus operaciones POST/PUT/DELETE/PATCH se declaran dentro del módulo sin un middleware local visible de autenticación o rol. Algunas rutas públicas de lectura son intencionales; las operaciones de administración requieren una autorización efectiva que debe comprobarse en toda la cadena de middleware.

**Prioridad propuesta:** P0 condicionada a confirmar que no exista un guard equivalente fuera del módulo.

### H-09 — Escritura de links de evaluaciones sin guard local visible

Archivo: `server/evaluationLinksRoutes.ts`, SHA `9361625e63256da0b17f3cad934d3b86d5fde6d7`.

El endpoint `POST /api/evaluation-links` valida la forma de los datos y luego elimina los links existentes para el curso/módulo del primer elemento e inserta el conjunto recibido. No muestra guard local de autenticación/rol en el handler.

Además, la secuencia presupone que el array validado contiene al menos un elemento antes de acceder a `validatedLinks[0]`. Un array vacío puede llevar a un error en vez de un rechazo de validación claro. Esto es un hallazgo de robustez distinto del control de acceso.

**Prioridad propuesta:** P0 para autorización si no hay protección exterior; P2 para validación del array vacío.

### H-10 — Rutas administrativas de PAES sin guard local visible

Archivo: `server/paesRoutes.ts`, SHA `e91a8efd5c982db824197a604cf874a1fd783e7f`.

Los handlers bajo `/api/admin/paes/*` para listar y modificar materias/planes, y consultar suscripciones, no muestran middleware local de autenticación/rol. La validación de esquema de entrada no reemplaza autorización.

**Prioridad propuesta:** P0 condicionada a verificar guards externos y exposición efectiva.

## 3. Interacción con los hallazgos ya documentados

Estos hallazgos se deben analizar conjuntamente, no como vulnerabilidades aisladas:

1. `isAdmin` deja pasar la solicitud de forma incondicional en el código revisado.
2. Los routers auxiliares se registran por separado y no heredan `isAdmin` solo por registrarse desde `registerRoutes`.
3. Algunos endpoints de `routes.ts` sí tienen controles propios, mientras que otros confían en `isAdmin`; por ello el análisis debe hacerse ruta por ruta.
4. `setupAuth` puede omitirse o fallar y continuar, según las condiciones descritas en el anexo de autenticación. La existencia de un middleware de sesión no constituye autorización administrativa.
5. El middleware global de logging registra cuerpos JSON y debe incluirse en la revisión de privacidad y seguridad operacional.

## 4. Plan de verificación estática pendiente

- Construir una matriz de cada ruta administrativa con: archivo, método, middleware aplicado, autenticación, autorización por rol, control de titularidad, validación de entrada y datos devueltos.
- Buscar y documentar controles globales o de plataforma antes de concluir que una ruta es explotable.
- Identificar rutas de lectura que devuelven contenido académico y verificar por separado autenticación, matrícula, calendario y política de publicación de respuestas.
- Para rutas de escritura, comprobar controles de autorización, límites de tamaño, validación de arrays/objetos y consistencia transaccional.
- Preparar pruebas negativas para un entorno no productivo; no ejecutarlas hasta autorización expresa y confirmación del entorno.

## 5. Límites y criterio de severidad

La prioridad P0 representa la urgencia de verificar un control fundamental; no es una declaración de explotación en producción. No se conocen desde esta revisión las variables de entorno reales, los guards de infraestructura, las reglas de red ni el estado del despliegue. Las conclusiones de exposición deben permanecer condicionadas hasta completar esas verificaciones.

No se modificó código, configuración ni base de datos. No se hicieron commits en la rama de código ni despliegues.
