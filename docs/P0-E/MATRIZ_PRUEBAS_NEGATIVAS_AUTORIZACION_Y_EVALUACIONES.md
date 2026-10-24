# Matriz de pruebas negativas de autorización — Vórtice

**Estado:** plan de pruebas propuesto; no ejecutado.  
**Código de referencia:** rama `vortice/integracion`, archivo `server/routes.ts`.  
**Rama documental:** `docs/p0-e-maestro`.  
**Fecha:** 2026-10-24.

## 1. Objetivo

Definir verificaciones seguras y repetibles para confirmar que las rutas administrativas solo permiten acciones a administradores autorizados y que los endpoints de evaluación no revelan información antes de los plazos de P0-E.

Esta matriz no implica autorización para ejecutar pruebas, modificar código, desplegar ni probar producción. Las pruebas deben realizarse únicamente en un entorno local o de staging expresamente aprobado, con datos sintéticos.

## 2. Precondiciones

- Confirmar commit exacto que se va a probar.
- Aislar entorno de producción y usar base de datos ficticia.
- Disponer de cuentas de prueba: anónima, estudiante, usuario autenticado sin rol admin y administrador.
- Registrar resultado HTTP, ruta, identidad de prueba, estado esperado y evidencia no sensible.
- No utilizar datos reales de estudiantes ni registrar cuerpos completos de respuestas en artefactos de prueba.

## 3. Matriz de autorización administrativa

| ID | Identidad | Acción de prueba | Resultado esperado |
|---|---|---|---|
| AUTH-01 | Sin sesión | Consultar una ruta administrativa de solo lectura | Rechazo 401 o respuesta equivalente que no revele datos |
| AUTH-02 | Sin sesión | Intentar crear o modificar una entidad administrativa | Rechazo; ningún cambio persistido |
| AUTH-03 | Estudiante autenticado | Consultar datos administrativos | Rechazo 403 o respuesta equivalente sin datos |
| AUTH-04 | Usuario autenticado sin rol admin | Crear, modificar o eliminar configuración | Rechazo; ningún cambio persistido |
| AUTH-05 | Administrador válido | Ejecutar una operación administrativa permitida sobre datos de prueba | Éxito según contrato y registro auditable |
| AUTH-06 | Perfil inexistente o rol nulo | Invocar una ruta administrativa | Rechazo seguro; sin excepción que permita continuar |
| AUTH-07 | Sesión inválida o expirada | Invocar una ruta administrativa | Rechazo; no se acepta identidad residual |
| AUTH-08 | Administrador con entrada inválida | Enviar datos que no cumplen el esquema | 400 o respuesta de validación; ningún cambio parcial |
| AUTH-09 | Usuario sin privilegios | Solicitar adjunto de reserva de prueba | Rechazo; el contenido del archivo no se entrega |
| AUTH-10 | Usuario sin privilegios | Crear vínculo apoderado-estudiante de prueba | Rechazo; no se crea ni activa vínculo |
| AUTH-11 | Usuario sin privilegios | Cambiar planes, ciclos o configuración del sitio | Rechazo; valores no cambian |
| AUTH-12 | Usuario sin privilegios | Crear/editar rúbricas o generar evaluaciones | Rechazo; no se crean ni modifican datos |

### Familias de rutas a cubrir

- Niveles, asignaturas, asociaciones, objetivos y recursos.
- Calendarios, matrícula y configuración académica.
- HTML de evaluación, previsualización, carga de documentos y generación de preguntas.
- Libros de texto y configuración de páginas.
- Reservas y adjuntos.
- Planes, ciclos, configuración del sitio y copilotos.
- Rúbricas, tutoría y analítica.
- Endpoints registrados desde módulos separados, incluidos enlaces de evaluación, FAQ, PAES, chat de ventas y Flow; requieren inventario independiente de sus rutas y middleware.

No debe asumirse que una ruta está cubierta por una prueba solo porque comparte el prefijo `/api/admin`; la matriz debe vincular cada caso con la ruta y el handler concretos.

## 4. Matriz de protección de evaluaciones P0-E

| ID | Condición | Comportamiento esperado |
|---|---|---|
| EVAL-01 | Estudiante sin sesión | No se accede a evaluación ni resultados privados |
| EVAL-02 | Usuario sin matrícula válida | No puede consultar ni enviar la evaluación |
| EVAL-03 | Antes de la ventana autorizada | No se puede iniciar ni enviar |
| EVAL-04 | Intento activo con recarga | Se recupera el mismo intento y la misma permutación persistida |
| EVAL-05 | Envío de un intento válido | Respuesta inicial contiene únicamente «Aprobado» o «No aprobado» y datos operativos estrictamente permitidos |
| EVAL-06 | Antes de `review_at` | No se devuelven respuestas correctas, explicaciones, puntuación exacta ni claves |
| EVAL-07 | Consulta de HTML de evaluación | No se sirve HTML que contenga claves o explicaciones antes del momento permitido |
| EVAL-08 | Repaso antes de `review_at` | No se habilitan ítems derivados de esa evaluación antes del momento permitido |
| EVAL-09 | Envío después de `T+48h` | Rechazo conforme a la especificación, sin gracia adicional ni consumo indebido |
| EVAL-10 | Dos envíos concurrentes | Se respeta el límite de intentos; no se duplican cierres ni se consumen intentos extra |
| EVAL-11 | Excepción aprobada | No reabre la instancia original; usa versión alternativa con ventana propia cuando corresponda |
| EVAL-12 | Usuario familia/tutor | Solo ve el estado permitido; no recibe puntuación exacta ni clave |
| EVAL-13 | Resultado de formulario externo no validado | No puede producir una aprobación definitiva sin la validación autorizada |
| EVAL-14 | Log de respuesta | No contiene claves, explicaciones, puntuación detallada, datos personales ni tokens innecesarios |

Los valores de ventana, intentos y estados deben provenir de la especificación P0-E ratificada. Si hay decisiones académicas pendientes, los casos relacionados deben marcarse como bloqueados por decisión, no resolverse por suposición.

## 5. Evidencia que se debe guardar

Para cada caso:
- Identificador de caso y commit probado.
- Entorno y versión del esquema, sin credenciales.
- Ruta y método HTTP.
- Tipo de cuenta sintética y rol asignado.
- Resultado esperado y observado.
- Código de estado y campos de respuesta no sensibles.
- Confirmación de ausencia de cambios persistidos en casos negativos.
- Resultado de revisión de logs sin copiar datos sensibles.
- Responsable, fecha y enlace a la ejecución.

No adjuntar cookies, tokens, contraseñas, respuestas de estudiantes reales ni cuerpos sensibles completos.

## 6. Criterios de salida

La revisión no se considera completada hasta que:
1. Todos los endpoints administrativos identificados y los registrados en módulos separados tengan propietario y clasificación de acceso.
2. Los casos negativos se rechacen de forma consistente.
3. El administrador autorizado pueda realizar las operaciones permitidas.
4. Las rutas de evaluación, HTML y repaso respeten `review_at` desde el servidor.
5. La salida inicial y los logs cumplan el contrato de datos mínimo.
6. Los fallos tengan incidencia documentada, severidad y plan de corrección aprobado.

## 7. Limitaciones y autorización

Esta matriz se elaboró mediante revisión estática. No se ejecutaron pruebas, no se llamó a endpoints, no se accedió a producción y no se modificó código, base de datos, migraciones ni configuración. La ejecución requiere autorización explícita, entorno aislado y datos ficticios. La corrección, commit, push, merge y despliegue requieren aprobaciones separadas.
