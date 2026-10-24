# Matriz consolidada de rutas y controles — P0-E / Vórtice

**Estado:** consolidación documental de inspección estática; pendiente de verificación técnica autorizada.  
**Repositorio:** `juanpablomonsalvezb-alt/brkl`  
**Rama de código revisada:** `vortice/integracion`  
**Rama documental:** `docs/p0-e-maestro`  
**Fecha:** 2026-10-24

## 1. Propósito

Este documento conecta los inventarios parciales y anexos P0-E para que la revisión no dependa de leer hallazgos dispersos. No sustituye la lectura de cada archivo fuente y no afirma que la rama inspeccionada esté desplegada.

## 2. Criterio de lectura

- **Observado:** se leyó el handler o la configuración citada.
- **No visible localmente:** el archivo inspeccionado no muestra control local; todavía hay que verificar middleware global, infraestructura y configuración.
- **Requiere verificación:** falta leer la ruta completa, confirmar el entorno o ejecutar pruebas negativas en un entorno autorizado.
- **No confirmado:** no se han hecho peticiones, pruebas de explotación ni comprobaciones de producción.

No tratar la falta de middleware local como prueba definitiva de exposición, pero tampoco aceptar un prefijo `/api/admin`, un comentario o un control nominal como sustituto de autorización real.

## 3. Matriz de áreas prioritarias

| Área | Evidencia de referencia | Qué debe verificarse | Prioridad propuesta |
|---|---|---|---|
| Autorización admin central | `server/routes.ts`: `isAdmin` hace `next(); return;` antes de comprobar rol | Cadena completa por ruta; existencia de controles externos; anónimo vs usuario sin rol admin vs admin | P0 |
| Creación de módulos | `POST /api/admin/level-subjects/:id/create-modules` se observó sin guard local y comentario temporal de desarrollo | Si existe en el entorno accesible y qué control global la cubre | P0 |
| Envío de evaluación | `POST /api/evaluations/:id/submit` devuelve puntaje, correctas y resultados según lectura previa | Contrato real de respuesta y acceso a claves antes de `review_at` | P0 |
| Lectura de evaluación | `GET /api/evaluations/:id` y HTML de evaluación requieren revisión de acceso/ventana | Matrícula, identidad, publicación, pauta y permisos por rol | P0 |
| Ciclo de vida del intento | `shared/schema.ts`, `server/storage.ts`, `client/src/components/EvaluationQuiz.tsx` | Intento activo, expiración, consumo, permutación persistida, recarga y doble envío | P0 |
| Routers de enlaces evaluativos | `server/evaluationLinksRoutes.ts` | Lectura y mutaciones, array vacío, coherencia curso/módulo y calendario | P0 |
| FAQ administrativas | `server/faqRoutes.ts` | CRUD/importación con rol admin, tamaño de archivo, operación reemplazar todo | P0 |
| PAES administrativas | `server/paesRoutes.ts` | CRUD, acceso a suscripciones, enum de estado y lectura de datos personales | P0 |
| Flow / pagos | `server/flowRoutes.ts`, `server/flowService.ts` | Precio autoritativo, propiedad de reserva, minimización de respuesta, idempotencia, URL por entorno | P0 |
| Logs API | `server/index.ts` | Si los cuerpos JSON se registran y quién accede/retiene logs; redacción de datos sensibles | P0 |
| Autenticación y sesiones | `server/routes.ts`, `server/replit_integrations/auth/replitAuth.ts` | Fallo cerrado, variables obligatorias, secreto fuerte y store adecuado al despliegue | P0 |
| Formulario externo | `POST /api/evaluations/:id/complete` | No confiar en `score`/`passed` del cliente sin validación independiente | Alta |
| Repaso | `server/repaso.ts` | Filtro explícito por `review_at`, banco de práctica separado y autorización de respuesta | Alta |
| Captación pública | `/api/waitlist`, chat de ventas, suscripción PAES | Rate limits, consentimientos, minimización de datos y protección ante spam | Alta |
| Presencia anónima | `/api/together/heartbeat`, `/api/together/presence` | Suplantación, frecuencia, contenido visible y uso con menores | Media |
| Cargas de archivo | Multer en router FAQ y configuración general de Word | Límites por endpoint, validación de contenido real, tamaño y consumo de memoria | Alta |

## 4. Documentos de evidencia relacionados

### Especificación y decisiones
- [Especificación maestra P0-E](ESPECIFICACION_MAESTRA.md)
- [Matriz de decisiones académicas pendientes](MATRIZ_DECISIONES_ACADEMICAS_PENDIENTES.md)
- [Diseño técnico propuesto de máquina de estados](DISENO_TECNICO_PROPUESTO_MAQUINA_ESTADOS.md)

### Autorización y rutas
- [Inventario de rutas administrativas y controles de autorización](INVENTARIO_RUTAS_ADMIN_CONTROLES_AUTORIZACION.md)
- [Inventario prioritario de rutas de mutación sensibles](INVENTARIO_PRIORITARIO_RUTAS_MUTACION_SENSIBLES.md)
- [Anexo de routers auxiliares, sesiones y cargas](ANEXO_ROUTERS_AUXILIARES_SESIONES_Y_CARGAS.md)

### Evaluaciones, exposición y servicios
- [Informe de brechas P0-E / Vórtice](INFORME_BRECHAS_P0E_VORTICE.md)
- [Anexo de rastreo de rutas de lectura](ANEXO_RASTREO_RUTAS_LECTURA.md)
- [Matriz de pruebas negativas de autorización y evaluaciones](MATRIZ_PRUEBAS_NEGATIVAS_AUTORIZACION_Y_EVALUACIONES.md)
- [Anexo de autenticación, logs, pagos y exposición](ANEXO_AUTENTICACION_LOGS_PAGOS_Y_EXPOSICION.md)
- [Anexo de pagos, chat, repaso y acceso a evaluaciones](ANEXO_PAGOS_CHAT_REPASO_Y_ACCESO_EVALUACIONES.md)
- [Anexo de pagos, autenticación y captación pública](ANEXO_PAGOS_AUTENTICACION_CAPTACION_PUBLICA.md)
- [Registro consolidado de riesgos y plan de cierre](REGISTRO_CONSOLIDADO_RIESGOS_Y_PLAN_CIERRE.md)

## 5. Secuencia de cierre recomendada

### Fase 1 — Confirmación del entorno y autorización
1. Identificar qué commit/branch está realmente desplegado y cuál es la configuración efectiva, sin alterar producción.
2. Dibujar la cadena de middleware completa por ruta y comprobar dónde se aplica autenticación, rol y alcance del estudiante.
3. Resolver primero las rutas administrativas y la protección de datos de evaluación.

### Fase 2 — Contrato académico P0-E
1. Alinear API, almacenamiento y cliente con las reglas aprobadas en la especificación maestra.
2. Confirmar que el resultado inmediato solo exponga “Aprobado” o “No aprobado”.
3. Confirmar que ninguna pauta, respuesta correcta o explicación se exponga antes de `review_at`.
4. Definir y verificar intento activo, consumo al enviar, expiración, permutación persistida, cierre y recuperación.

### Fase 3 — Servicios comerciales y datos
1. Hacer el precio de Flow autoritativo en servidor y limitar la respuesta de estado.
2. Revisar logs, captación pública, chat y cargas de archivos.
3. Revisar calendario de evaluación y sus fuentes de verdad.

### Fase 4 — Pruebas autorizadas
Usar staging/local aprobado y datos sintéticos. Para cada ruta sensible probar anónimo, estudiante, familia/tutor, usuario autenticado sin rol admin y administrador autorizado. Incluir fechas frontera, recarga, concurrencia, doble envío, expiración, revisión, recuperación y redacción de logs. No usar producción como entorno de prueba.

### Fase 5 — Cambios y aceptación
Cada cambio de código requiere autorización específica, diff revisable, pruebas, revisión de compatibilidad y plan de reversa. Merge y despliegue requieren autorización independiente.

## 6. Límites

- Esta matriz consolida evidencia estática disponible; no representa un escaneo completo automatizado del repositorio.
- No se ejecutaron pruebas dinámicas ni llamadas a producción.
- No se confirma que la rama inspeccionada sea la desplegada.
- No se modificó código, esquema, datos ni configuración.
- Los anexos documentales no autorizan implementación, merge ni despliegue.
