# Anexo — routers auxiliares, permisos y sesiones

Estado: inspección estática de código; sin ejecución ni comprobación del entorno desplegado.
Rama de código revisada: `vortice/integracion`.
Rama documental: `docs/p0-e-maestro`.
Fecha: 24-10-2026.

## 1. Alcance y cautela

Los endpoints descritos son los que aparecen en los archivos revisados. Que un router no muestre middleware local no demuestra por sí solo que sea accesible sin autenticación en producción: hay que comprobar middleware global, configuración de despliegue, proxy y versión efectivamente desplegada. En esta revisión sí se observa que los routers auxiliares se registran directamente desde `registerRoutes`, sin que la llamada de registro les pase un middleware de autorización.

## 2. Hallazgos

### H-24 — Cambios en enlaces de evaluaciones sin control local de rol visible
- Archivo: `server/evaluationLinksRoutes.ts`.
- Rutas: GET por curso/módulo y curso; POST masivo; PUT y DELETE por ID.
- Evidencia: handlers consultan, borran, insertan y actualizan enlaces; el módulo no importa ni aplica `isAuthenticated` ni un control de rol.
- Riesgo potencial: lectura de calendario/enlaces y modificación o eliminación de configuración académica si no hay una capa global efectiva.
- Cierre: definir permisos de lectura por alumno/curso y permisos de escritura administrativos; comprobar middleware global y añadir pruebas negativas autorizadas.

### H-25 — Operaciones administrativas de FAQ sin control local de rol visible
- Archivo: `server/faqRoutes.ts`.
- Rutas sensibles: `GET /api/admin/faqs`, POST/PUT/DELETE, PATCH de reordenamiento y POST de importación Word.
- Evidencia: el módulo aplica validación de esquema en algunas operaciones, pero no muestra autenticación/rol en los handlers.
- Riesgo potencial: leer FAQ inactivas, alterar contenido público o importar/reemplazar en bloque el conjunto de preguntas si la autorización no se aplica externamente.
- Nota adicional: el `multer` de este módulo usa memoria y no declara límite de tamaño en su configuración visible; el filtro de extensión .docx ocurre dentro del handler, después de recibir el archivo.
- Cierre: autorización central, límites de tamaño/tipo antes de procesar, validación de contenido y operación transaccional para reemplazos.

### H-26 — Operaciones administrativas PAES sin control local de rol visible
- Archivo: `server/paesRoutes.ts`.
- Rutas sensibles: CRUD de materias/planes y lectura, cambio de estado y eliminación de suscripciones bajo `/api/admin/paes/*`.
- Evidencia: los handlers validan algunos esquemas de entrada, pero no muestran middleware de autenticación o rol. La actualización de estado de suscripción toma `status` y `notes` del body sin esquema específico visible en el handler.
- Riesgo potencial: modificación de catálogo o acceso a datos de suscripción, sujeto a controles globales no verificados.
- Cierre: control de rol y alcance de datos, enum de estados permitidos, validación parcial explícita y pruebas negativas.

### H-27 — Sesión de memoria y secreto de respaldo requieren garantía de configuración de producción
- Archivo: `server/replit_integrations/auth/replitAuth.ts`.
- Evidencia: `getSession()` crea un `MemoryStore` y usa `SESSION_SECRET || "dev-secret-change-in-production"`. El comentario indica que el store de memoria es para desarrollo y que producción se maneja por Vercel Edge, pero el código mostrado configura `getSession()` con ese store.
- Riesgo potencial: sesiones no compartidas entre instancias/reinicios y secreto de desarrollo si faltara la variable de entorno. No se puede afirmar que esto ocurra en producción sin verificar configuración y ruta real de ejecución.
- Cierre: exigir un secreto fuerte en producción y abortar el arranque si falta; confirmar estrategia de persistencia de sesión compatible con la plataforma y con múltiples instancias.

### H-28 — El registro de rutas continúa tras un fallo al configurar autenticación
- Archivo: `server/routes.ts`.
- Evidencia: `setupAuth(app)` está dentro de un `try/catch` que registra advertencia y continúa; si no se cumplen las condiciones de variables, el código registra que ejecuta sin autenticación. Después registra rutas auxiliares y principales.
- Riesgo potencial: si una instancia que debería estar protegida inicia sin middleware de sesión, las rutas que dependen de él pueden responder de forma distinta a lo esperado. El alcance real requiere revisar rutas y entorno.
- Cierre: separar explícitamente desarrollo y producción; fallo cerrado en producción si falta autenticación obligatoria o no puede inicializarse; comprobación automatizada de arranque.

### H-29 — Importación de FAQ puede consumir memoria sin límite visible
- Archivo: `server/faqRoutes.ts`, `multer({ storage: multer.memoryStorage() })`.
- Evidencia: la configuración local no define `limits.fileSize`; el archivo se mantiene en memoria y se procesa con Mammoth.
- Riesgo potencial: consumo excesivo de memoria mediante carga grande si no hay límite externo.
- Cierre: imponer límite de tamaño en middleware y plataforma; restringir número de archivos y validar el tipo real, no solo la extensión.

### H-30 — Enlaces de evaluación masivos pueden fallar con array vacío y exponer detalles internos
- Archivo: `server/evaluationLinksRoutes.ts`, POST `/api/evaluation-links`.
- Evidencia: se valida que el body sea un array, pero no que tenga al menos un elemento antes de leer `validatedLinks[0]`; el catch devuelve `error.message` en el campo `details`.
- Riesgo potencial: petición vacía produce error de servidor y mensajes internos pueden filtrarse al cliente.
- Cierre: validar longitud mínima y coherencia de que todos los enlaces pertenezcan al mismo curso/módulo; devolver errores de validación controlados sin detalles internos.

### H-31 — La fecha de liberación de enlaces se calcula con una fecha fija codificada
- Archivo: `server/evaluationLinksRoutes.ts`, `calculateReleaseDate`.
- Evidencia: la función usa `new Date(2026, 2, 9)` como inicio de programa y duraciones/semana de evaluación codificadas.
- Riesgo potencial: calendarios incorrectos en otros ciclos, años o configuraciones de nivel.
- Cierre: usar calendario configurado por ciclo/curso, zona horaria documentada y pruebas de fechas; no usar esta función como fuente autoritativa P0-E sin reconciliarla con la política aprobada.

## 3. Señales de control positivas observadas

- Los handlers de FAQ y PAES validan con esquemas Zod parte de los payloads.
- Los enlaces de evaluación también validan cada elemento con `insertEvaluationLinkSchema`.
- `isAuthenticated` devuelve 401 cuando no hay sesión reconocida, no hay `expires_at` o falla la renovación. Esto solo protege rutas donde efectivamente se monta y usa el middleware.

## 4. Prioridad de verificación propuesta

1. Resolver la autorización transversal: comprobar montaje real de middleware y hacer inventario de cada ruta sensible.
2. Proteger las operaciones de escritura de evaluación-links, FAQ y PAES.
3. Verificar el modelo de sesión y que el arranque de producción falle cerrado.
4. Limitar y validar importaciones de documentos.
5. Corregir validación de array vacío, errores de cliente y fuente de calendario.
6. Ejecutar pruebas negativas solo en staging/local autorizado, con datos sintéticos.

## 5. Límites vigentes

- No se modificó código, esquema, datos ni configuración.
- No se ejecutaron pruebas dinámicas ni llamadas a producción.
- No se confirma que la rama revisada esté desplegada ni que no existan controles externos.
- Este anexo no autoriza implementación, merge ni despliegue.
