# Inventario estático de rutas sensibles y mutaciones sin guard visible

**Repositorio:** `juanpablomonsalvezb-alt/brkl`  
**Rama inspeccionada:** `vortice/integracion`  
**Archivo principal:** `server/routes.ts`, SHA `fa05596aa0d9be9e8efa7757599e564b7b9c96d0`  
**Fecha:** 2026-10-24  
**Método:** inspección estática de fragmentos del archivo. No se ejecutó la aplicación, no se hicieron llamadas HTTP ni se probaron controles en producción.

## Resumen ejecutivo

Además del bypass documentado en `isAdmin`, se identificaron rutas de escritura bajo prefijo `/api/admin` que no muestran el middleware `isAuthenticated` ni una comprobación de rol local en el handler revisado. El prefijo de URL y los comentarios “admin only” no constituyen por sí solos un control de acceso.

Esta es una lista prioritaria de rutas encontradas en los fragmentos revisados, no un inventario exhaustivo de todas las rutas del repositorio. La exposición efectiva depende de la cadena completa de middleware y de la infraestructura del despliegue.

## Rutas de escritura que requieren verificación inmediata

| Ruta | Señal estática observada | Riesgo potencial | Prioridad propuesta |
|---|---|---|---|
| `POST /api/admin/level-subjects/:id/create-modules` | Handler declarado sin middleware de autenticación/rol visible; el comentario indica “temporary public for development”. Crea hasta 15 módulos si no existen. | Escritura académica no autorizada si no hay control exterior. | P0 |
| `POST /api/admin/objectives/:id/rubrica` y `PUT /api/admin/objectives/:id/rubrica` | Pasan por `isAdmin`, que en el código revisado hace `next(); return;`. | Cambio de rúbricas sin validación de rol efectiva por ese middleware. | P0 |
| `POST /api/admin/resources` | Pasa por `isAdmin`, sin una verificación local adicional visible en el fragmento. | Creación de recursos académicos no autorizada si no hay guard externo. | P0 |
| `PATCH /api/admin/resources/:id` | Pasa por `isAdmin`; el handler actualiza con el cuerpo recibido. | Modificación de recursos y posible validación insuficiente de campos. | P0 |
| `PATCH /api/admin/resources/:id/pedagogical-step` | Pasa por `isAdmin`; requiere revisar el handler completo y validación de entrada. | Alteración de configuración pedagógica. | P0 |
| `GET/POST/PATCH /api/admin/calendar-configs...` | Muestran `isAuthenticated` seguido de `isAdmin`. La autenticación se invoca, pero la autorización de rol del segundo middleware no se ejecuta efectivamente según su implementación actual. | Usuario autenticado sin rol admin podría superar el middleware de rol. | P0 |
| `POST /api/admin/evaluations/:objectiveId/:evaluationNumber/html` (PUT en el código) | Usa `isAdmin`; requiere revisar controles específicos y acceso al contenido de evaluación. | Cambios de material evaluativo. | P0 |
| CRUD de `/api/admin/faqs` | En el módulo FAQ no se observa guard local en los handlers. | Modificación pública del contenido del sitio si no hay guard externo. | P0 condicionado |
| CRUD de `/api/admin/paes/*` | En el módulo PAES no se observa guard local en los handlers. | Modificación de planes/materias o lectura de suscripciones. | P0 condicionado |
| `POST /api/evaluation-links` | En el módulo de links no se observa guard local; reemplaza links existentes de un curso/módulo. | Sustitución de enlaces evaluativos si no hay guard externo. | P0 condicionado |

## Señal adicional: perfil de desarrollo

En el fragmento de `GET /api/profile` (aprox. líneas 470 en la revisión), si no se obtiene `currentUserId(req)`, el handler devuelve un perfil de desarrollo con `id: "dev-user"` y `role: "admin"`. Es necesario revisar el handler completo para entender todas las ramas y confirmar si el perfil de desarrollo puede ser consumido en un entorno accesible. No se concluye que esa respuesta por sí sola otorgue permisos de servidor; sí puede confundir el estado de autenticación/autorización del cliente y debe quedar restringida a desarrollo.

## Controles que sí se observan en rutas concretas

- `GET /api/admin/analitica/resumen` comprueba usuario, recupera el perfil y exige `profile.role === "admin"` dentro del propio handler.
- Varias rutas de Vórtice comprueban `currentUserId(req)` y responden 401 si no hay usuario.
- Los controles locales anteriores no compensan automáticamente otros endpoints y deben registrarse por ruta.

## Acciones recomendadas

1. **Bloqueo previo a producción:** revisar si el despliegue accesible contiene `isAdmin` en modo “DEV MODE” y si la ruta `create-modules` está expuesta sin guard. No afirmar exposición real hasta confirmar entorno y cadena de middleware.
2. Elaborar inventario exhaustivo por método y ruta, incluyendo handlers registrados dinámicamente y routers auxiliares.
3. Sustituir la autorización implícita por controles explícitos y centralizados de autenticación/rol, una vez autorizada la modificación del código.
4. Separar las rutas públicas de contenido comercial de las operaciones administrativas de escritura.
5. Añadir pruebas negativas para anónimo, usuario autenticado no administrador y administrador autorizado, únicamente en entorno de pruebas confirmado.
6. Restringir el perfil “dev-user/admin” a un entorno local no accesible externamente y comprobar que no se use como autoridad de servidor.

## Estado y límites

- Documento de triage basado en lectura estática; las prioridades son propuestas.
- No se modificó el código de la aplicación ni la base de datos.
- No se ejecutaron pruebas ni peticiones contra servicios.
- No se accedió a producción ni se verificaron variables de entorno, proxy, WAF o guards de plataforma.
- El alcance no es todavía un inventario completo; se documentan las rutas sensibles confirmadas en los fragmentos consultados.
