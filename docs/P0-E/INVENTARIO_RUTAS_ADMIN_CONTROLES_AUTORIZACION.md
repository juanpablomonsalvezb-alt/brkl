# Inventario estático de rutas administrativas y controles de autorización

**Estado:** inventario documental parcial basado en el código publicado; requiere revisión de responsable técnico.  
**Rama de código inspeccionada:** `vortice/integracion`  
**Archivo principal:** `server/routes.ts`  
**Rama documental:** `docs/p0-e-maestro`  
**Fecha:** 2026-10-24

## 1. Conclusión ejecutiva

En el archivo revisado, `isAdmin` contiene una salida temprana `next(); return;` antes de la comprobación de identidad y rol. Por ello, **el middleware por sí solo no autoriza como administrador**.

La revisión encontró varias rutas que usan ese middleware. Algunas incorporan comprobaciones adicionales dentro del handler, pero muchas de las inspeccionadas no muestran una comprobación local equivalente. Esto constituye una señal crítica que debe verificarse en el entorno y en las rutas completas antes de concluir el alcance real. No se ha comprobado si existe una capa externa de autorización, si esta rama está desplegada ni si todos los handlers son alcanzables sin otra barrera.

## 2. Clasificación de controles observados

- **Control local adicional visible:** el handler consulta la identidad/perfil y exige `role === "admin"` o aplica otra comprobación explícita.
- **Solo `isAuthenticated` + `isAdmin`:** la ruta exige sesión en el middleware de autenticación, pero el middleware `isAdmin` no verifica rol en el código publicado inspeccionado.
- **Solo `isAdmin`:** no se ve comprobación de sesión ni de rol en la cadena de middleware declarada para esa ruta. El handler puede o no realizar verificaciones internas.
- **Pendiente de revisar:** rutas que delegan autorización a wrappers, servicios o archivos no inspeccionados.

Autenticación e autorización no son equivalentes: identificar al usuario no demuestra que tenga privilegios administrativos.

## 3. Rutas observadas en `server/routes.ts`

La siguiente tabla enumera rutas que aparecen usando `isAdmin` en el archivo inspeccionado. “Control adicional” solo se marca cuando se observó una comprobación en el fragmento revisado; no equivale a una auditoría completa del flujo.

| Método | Ruta | Cadena visible | Control adicional visible en handler |
|---|---|---|---|
| GET | `/api/admin/tutoria/casos` | `isAdmin` + `tutoriaRoute` | No verificado dentro del wrapper |
| POST | `/api/admin/tutoria/casos/:id/asignar` | `isAdmin` + `tutoriaRoute` | No verificado dentro del wrapper |
| POST/PUT | `/api/admin/objectives/:id/rubrica` | `isAdmin` | No observado en fragmento |
| POST | `/api/admin/familia/vinculos` | `isAdmin` | **Sí:** exige usuario y perfil con rol `admin` |
| POST | `/api/admin/matriculas` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| GET | `/api/admin/matriculas` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| POST | `/api/admin/levels` | `isAdmin` | No observado en fragmento |
| POST | `/api/admin/subjects` | `isAdmin` | No observado en fragmento |
| POST | `/api/admin/level-subjects` | `isAdmin` | No observado en fragmento |
| POST | `/api/admin/objectives` | `isAdmin` | No observado en fragmento |
| POST | `/api/admin/resources` | `isAdmin` | No observado en fragmento |
| PATCH | `/api/admin/resources/:id` | `isAdmin` | No observado en fragmento |
| PATCH | `/api/admin/resources/:id/pedagogical-step` | `isAdmin` | No observado en fragmento |
| GET | `/api/admin/calendar-configs` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| POST | `/api/admin/calendar-configs` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| PATCH | `/api/admin/calendar-configs/:id` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| PUT | `/api/admin/evaluations/:objectiveId/:evaluationNumber/html` | `isAdmin` | No observado en fragmento |
| GET | `/api/admin/evaluations/:id/html-preview` | `isAdmin` | **Parcial:** exige sesión; no se observa comprobación de rol |
| POST | `/api/admin/level-subjects/:levelSubjectId/word-upload` | `isAdmin` | No observado en fragmento |
| PUT | `/api/admin/learning-objectives/:id/pages` | `isAdmin` | No observado en fragmento |
| POST | `/api/admin/learning-objectives/:id/generate-evaluations` | `isAdmin` | No observado en fragmento |
| POST | `/api/admin/level-subjects/:id/generate-all-evaluations` | `isAdmin` | No observado en fragmento |
| POST | `/api/textbooks` | `isAdmin` | No observado en fragmento |
| PATCH | `/api/textbooks/:id/modules` | `isAdmin` | No observado en fragmento |
| DELETE | `/api/textbooks/:id` | `isAdmin` | No observado en fragmento |
| GET | `/api/reservations/:id/attachment` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| GET | `/api/reservations` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| GET | `/api/reservations/:id` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| PATCH | `/api/reservations/:id` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| DELETE | `/api/reservations/:id` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| POST | `/api/plans` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| PATCH | `/api/plans/:id` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| DELETE | `/api/plans/:id` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| POST | `/api/plans/initialize` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| POST | `/api/site-config` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| POST | `/api/site-config/initialize` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| POST | `/api/adult-cycles` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| PATCH | `/api/adult-cycles/:id` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| DELETE | `/api/adult-cycles/:id` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| POST | `/api/adult-cycles/initialize` | `isAuthenticated` + `isAdmin` | No observado en fragmento |
| POST | `/api/gemini-copilots` | `isAdmin` | No observado en fragmento |
| PUT | `/api/gemini-copilots/:id` | `isAdmin` | No observado en fragmento |
| DELETE | `/api/gemini-copilots/:id` | `isAdmin` | No observado en fragmento |
| PATCH | `/api/gemini-copilots/:id/toggle` | `isAdmin` | No observado en fragmento |
| POST | `/api/level-plans` | `isAdmin` | No observado en fragmento |
| PATCH | `/api/level-plans/:id` | `isAdmin` | No observado en fragmento |
| DELETE | `/api/level-plans/:id` | `isAdmin` | No observado en fragmento |
| POST | `/api/level-plans/initialize` | `isAdmin` | No observado en fragmento |

### Ruta administrativa con comprobación adicional fuera del middleware

- `GET /api/admin/analitica/resumen` no usa `isAdmin` en su cadena; el handler exige identidad y consulta `profile.role === "admin"`. La comprobación local sí está visible en el código inspeccionado.

### Casos que requieren lectura adicional

La lista es una enumeración de las rutas con coincidencias observadas en el archivo, no una auditoría exhaustiva de todos los puntos de entrada. Los wrappers `tutoriaRoute`, rutas registradas por módulos separados y middleware de autenticación deben revisarse de extremo a extremo. El hecho de que una ruta no aparezca en esta tabla no prueba que esté protegida.

## 4. Priorización por impacto potencial

1. **Operaciones de configuración y contenido:** crear, modificar o borrar niveles, asignaturas, objetivos, recursos, páginas, libros y calendarios.
2. **Evaluaciones:** guardar HTML con preguntas/respuestas, previsualizar conversiones y generar evaluaciones.
3. **Matrícula y vínculos familiares:** asociar estudiantes, acceder a reservas y descargar adjuntos con datos personales.
4. **Configuraciones operativas:** planes, ciclos, configuración del sitio y copilotos.
5. **Tutoría y analítica:** leer o asignar casos y acceder a datos académicos.

La prioridad describe el impacto potencial si la ruta carece de otra barrera efectiva; no es una afirmación de que cada operación se haya explotado.

## 5. Plan de verificación recomendado

1. Confirmar el commit exacto desplegado y la configuración de entorno con el responsable de despliegue.
2. Para cada ruta, seguir el registro de middleware, el handler, los wrappers y la capa de datos.
3. Identificar una única función central de autorización administrativa y comprobar que falle de forma segura ante identidad ausente, perfil inexistente o rol incorrecto.
4. Diseñar pruebas negativas en un entorno local aislado y con datos ficticios: anónimo, estudiante autenticado, usuario con rol distinto y administrador.
5. No ejecutar pruebas contra producción, no modificar el middleware y no realizar cambios de datos como parte de este inventario.
6. Registrar resultado, evidencia y commit revisado antes de clasificar cada ruta como protegida o expuesta.

## 6. Límites y gobernanza

Esta revisión es estática y documental. No se ejecutaron pruebas, no se llamó a endpoints, no se accedió a producción ni se modificaron código, base de datos, migraciones o configuración.

El inventario no autoriza correcciones. Se requiere aprobación explícita independiente para modificar código, crear commits, hacer push, abrir/actualizar PR, fusionar o desplegar.

Referencia de contexto: [verificación prioritaria de seguridad administrativa y logs](https://github.com/juanpablomonsalvezb-alt/brkl/blob/docs/p0-e-maestro/docs/P0-E/VERIFICACION_PRIORITARIA_SEGURIDAD_ADMIN_Y_LOGS.md).
