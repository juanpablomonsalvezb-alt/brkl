# Diseño técnico propuesto — máquina de estados P0-E
**Estado:** PROPUESTA TÉCNICA; no aprobada para implementación.  
**Fecha:** 2026-10-24  
**Base funcional:** `ESPECIFICACION_MAESTRA.md`, `INFORME_BRECHAS_P0E_VORTICE.md` y `ANEXO_RASTREO_RUTAS_LECTURA.md`.  
**Código de referencia:** rama `vortice/integracion`, inspección estática. No se ejecutaron pruebas.

## 1. Objetivo

Traducir las reglas P0-E a un modelo técnico verificable antes de escribir código. El diseño mantiene separadas las entidades de instancia, intento, proceso evaluativo, versión de preguntas, lote de recuperación y solicitud de excepción. No prescribe migraciones definitivas: los nombres de entidades y tablas son conceptuales hasta comprobar las capacidades reales del motor LibSQL/SQLite y Drizzle.

## 2. Entidades conceptuales

| Entidad | Responsabilidad | Datos mínimos por definir |
|---|---|---|
| Proceso evaluativo | Resultado global del estudiante en una evaluación original y, si corresponde, recuperación final | estudiante, evaluación original, fase, estado final, fecha de cierre, causa |
| Instancia evaluativa | Una oportunidad/version concreta que el estudiante puede responder | estudiante, evaluación/version, fase, ventana UTC, `review_at`, estado, máximo de intentos, intentos consumidos, causa de cierre |
| Intento | Sesión de respuesta creada al iniciar y consumida al enviar | instancia, número, estado, inicio, vencimiento, envío, permutación persistida, respuestas, resultado interno |
| Versión | Conjunto inmutable de preguntas y alternativas para una evaluación | identificador, contenido/versionado, estado editorial, huella o versión, validación |
| Lote de recuperación | Agrupación de estudiantes que usa una versión de recuperación en una ventana común | versión, ventana, estado, fecha de revisión, versión retirada |
| Solicitud de excepción | Solicitud auditada de ajuste excepcional, resuelta por una persona distinta | caso, solicitante, aprobador, motivo/referencia, estado, fechas y ventana solicitada/anterior |
| Evento de auditoría | Historial inmutable de transiciones y acciones privilegiadas | entidad, acción, estado anterior/nuevo, actor, momento UTC, razón/correlación |

La arquitectura final podría normalizar estas entidades en varias tablas o usar una estructura equivalente. No crear tablas hasta que el equipo confirme el motor, las restricciones disponibles, las migraciones existentes y el plan de compatibilidad histórica.

## 3. Estados propuestos

### 3.1 Instancia
- `disponible`: dentro de su ventana y apta para iniciar un intento.
- `en_curso`: existe un intento activo.
- `cerrada_aprobada`: un envío válido produjo aprobación.
- `cerrada_agotada`: se consumió el máximo de intentos sin aprobar.
- `vencida`: alcanzó el fin de su ventana y extensión, sin cierre anterior.
- `cerrada_por_excepcion`: no se reabre la original; el ajuste autorizado crea una instancia/version alternativa.
- `en_revision`: estado derivado o explícito tras cierre, antes de `review_at`.
- `revision_disponible`: instancia cerrada y el servidor alcanzó `review_at`.

No debe existir transición desde un estado final hacia `disponible` o `en_curso`. Una excepción válida genera otra instancia; no cambia el historial de la original.

### 3.2 Intento
- `activo`: iniciado, aún no enviado.
- `enviado`: envío válido aceptado; consume un intento.
- `expirado`: expiró por cierre de ventana sin envío; no consume intento.
- `cancelado_por_cierre`: el intento ya no puede enviarse porque la instancia se cerró por otra causa; no consume intento, salvo que la política académica aprobada disponga explícitamente otra cosa.

El estado `enviado` es terminal. Reintentos de la misma petición deben devolver el resultado ya registrado o un conflicto idempotente, nunca crear un segundo consumo.

### 3.3 Proceso
- `abierto`: instancia ordinaria disponible/en curso.
- `recuperacion_pendiente`: E2 agotada o vencida y requiere el flujo tutorial/administrativo definido.
- `recuperacion_abierta`: recuperación final autorizada con versión nueva.
- `aprobado`: se aprobó la evaluación en alguna instancia autorizada.
- `reprobado`: se cerró la recuperación final sin aprobar.
- `cerrado_sin_resolucion`: posible estado para vencimiento sin intentos enviados; requiere ratificación académica.
- `en_espera_excepcion`: propuesta no aprobada para casos con excepción pendiente al vencer.

Los dos últimos estados son propuestas para resolver huecos documentados, no decisiones vigentes.

### 3.4 Versión y lote
- Versión: `borrador → validada → asignada → retirada`.
- Lote: `preparacion → abierto → cerrado → revision_disponible → retirado`.
- Una versión asignada a un lote no puede asignarse a otro. Tras publicar la pauta, se retira y no vuelve a usarse.
- Las transiciones de versión/lote deben impedir asignación de una versión sin validación académica y de seguridad.

### 3.5 Solicitud de excepción
Propuesta de estados: `solicitada → aprobada | rechazada | sin_objeto`.
La solicitud no suspende el reloj ni amplía la ventana por sí misma. Los efectos al vencimiento y el plazo de resolución siguen pendientes de decisión académica/legal.

## 4. Transiciones e invariantes principales

| Evento | Precondiciones | Efecto transaccional esperado |
|---|---|---|
| Iniciar intento | Sesión válida; matrícula y acceso válidos; instancia abierta dentro de ventana; sin otro intento activo; intentos disponibles | Crear intento `activo`, persistir permutación y vencimiento; no incrementar intentos consumidos |
| Reanudar | Intento activo del mismo estudiante e instancia; no vencido | Devolver el mismo intento, misma permutación y respuestas guardadas |
| Guardar respuesta | Intento activo y dentro de ventana | Guardar por ID estable de pregunta y alternativa, no por posición visible |
| Enviar intento | Intento activo; ventana válida; payload validado; intento no enviado | Corregir en servidor, persistir resultado interno, cambiar a `enviado`, incrementar consumo exactamente una vez y cerrar instancia si aprueba o agota intentos |
| Repetir envío | El mismo intento ya está enviado | Respuesta idempotente o 409; nunca crear un segundo resultado ni consumir otro intento |
| Vencer intento activo | Fin de ventana alcanzado y no enviado | Cambiar a `expirado`; no consumir intento |
| Vencer instancia | Fin de `T+48h`, sin aprobación ni agotamiento previo | Cerrar instancia como `vencida`; cancelar/expirar intento activo sin consumo; registrar causa |
| Habilitar pauta | Instancia cerrada; servidor UTC ≥ `review_at`; no quedan estudiantes habilitados para responder esa versión | Permitir lectura de pauta en modo solo lectura |
| Autorizar excepción | Proceso aún admisible; aprobador autorizado y distinto del solicitante; justificación registrada | Mantener intacta la instancia original; crear instancia alternativa con versión y ventana/revisión propias |
| Validar formulario externo | Resultado verificado por mecanismo humano autorizado | Solo entonces registrar el estado aprobado/reprobado verificado y actor/fecha |
| Cerrar lote | Ventana terminada; todas las instancias cerradas; sin intentos activos | Marcar lote cerrado; calcular `review_at` del lote; no reasignar versión |
| Publicar pauta del lote | Lote cerrado y hora de revisión alcanzada | Publicar pauta de solo lectura y retirar versión según regla P0-E |

## 5. Invariantes que la implementación debe demostrar

1. **Un solo intento activo:** por estudiante e instancia.
2. **Consumo único:** un intento consume como máximo una unidad, al aceptar el primer envío válido.
3. **Sin doble corrección:** dos envíos concurrentes no pueden generar dos resultados aceptados.
4. **Sin resurrección:** ninguna transición reabre una instancia o proceso definitivo.
5. **Versión inmutable:** la permutación y la versión de preguntas no cambian durante un intento.
6. **Separación de datos:** respuesta inmediata pública = estado; puntaje y pauta quedan en almacenamiento privado y no se serializan antes de tiempo.
7. **Autorización en servidor:** el acceso a preguntas requiere sesión, matrícula, disponibilidad y ventana; no basta ocultar botones en el cliente.
8. **Ventana UTC autoritativa:** los cálculos usan reloj del servidor y límites explícitos, con representación de zona horaria para T y pruebas de DST.
9. **Revisión posterior:** ninguna ruta de evaluación, HTML, repaso, API auxiliar o exportación entrega clave antes de `review_at`.
10. **Auditoría:** las transiciones privilegiadas y los cierres guardan actor, momento, causa y correlación.
11. **Formularios externos:** los valores del cliente no pueden por sí solos producir una aprobación verificada.
12. **Historial preservado:** no reescribir intentos históricos; mapearlos con una política de migración revisada y trazable.
13. **Datos no confiables:** validar IDs, estructura de respuestas, rangos de alternativas, tamaño del payload, duplicados y pertenencia de cada pregunta a la versión asignada.
14. **No filtración por analítica:** dashboards, portafolio, familia, tutoría, notificaciones y copiloto no muestran puntajes ni claves si P0-E no lo autoriza.

## 6. Contrato de API sugerido (no definitivo)

- `GET /api/evaluations/:id`: exigir sesión, matrícula, ventana y acceso; devolver solo campos públicos de preguntas, con IDs estables y sin clave/explicación.
- `POST /api/evaluations/:id/attempts`: iniciar o recuperar el intento activo de forma idempotente; devolver ID de intento y estado, no la clave.
- `PATCH /api/evaluations/:id/attempts/:attemptId`: persistir respuestas parciales si se adopta guardado incremental.
- `POST /api/evaluations/:id/attempts/:attemptId/submit`: enviar un intento concreto; validar estado/ventana y consumir una sola vez; devolver únicamente `Aprobado` o `No aprobado` y campos de estado estrictamente necesarios.
- `GET /api/evaluations/:id/review`: rechazar hasta `review_at`; luego entregar pauta de solo lectura y comprobar pertenencia/autorización.
- `POST /api/evaluations/:id/exceptions` y endpoint administrativo de resolución: propuesta; separación solicitante/aprobador y auditoría obligatorias.
- Formularios externos: separar recepción de evidencia y verificación humana de la operación que cierra el proceso.

Los endpoints son una propuesta de contrato, no una instrucción de renombrar rutas inmediatamente. Compatibilidad con clientes actuales y migración gradual requieren un plan separado.

## 7. Orden recomendado de implementación futura

### Fase A — Seguridad y exposición
1. Inventario de todas las rutas de lectura y entrega de respuestas.
2. Aplicar/confirmar autenticación, matrícula, acceso y ventanas en servidor.
3. Bloquear la pauta/HTML/repaso antes de `review_at`.
4. Eliminar puntaje, conteos, respuesta correcta y explicación de la respuesta inmediata del estudiante.
5. Desactivar la aprobación autodeclarada de formularios externos.

### Fase B — Ciclo de vida
1. Acordar modelo de datos compatible con LibSQL/Drizzle.
2. Migrar historial de forma aditiva y reversible, con respaldo y mapeo.
3. Implementar inicio, reanudación, guardado, envío idempotente y expiración.
4. Garantizar transacciones e invariantes bajo concurrencia.
5. Persistir permutación por intento y corregir por IDs estables.

### Fase C — Recuperación y excepciones
1. Resolver decisiones pendientes P7–P14 y P16–P25 que afectan reglas.
2. Implementar lotes, versiones, excepciones y separación de funciones.
3. Incorporar auditoría y estados accesibles.
4. Alinear progreso, portafolio, familia, tutoría y analítica con los estados aprobados.

### Fase D — Validación
Solo en entorno aislado y tras autorización explícita: pruebas de contrato, permisos, concurrencia, ventanas con reloj simulado, idempotencia, recarga, migración histórica y regresión. No ejecutar pruebas de escritura ni migraciones contra producción.

## 8. Decisiones que bloquean el diseño definitivo

- Política de intentos históricos y registros previamente aprobados (P7).
- Reglas y verificación de formularios externos (P8).
- Visibilidad interna de puntaje (P9).
- Si las preguntas de repaso pueden aparecer antes de `review_at` (P10/P22/P23).
- Canal y comportamiento operativo del aviso 24h (P11).
- Ajustes por necesidades especiales (P13).
- Avisos y extensiones para recuperación (P14).
- Definición académica de E1/E3/E4 y de «No logrado» (P16).
- Confirmación formal de dos intentos de recuperación (P17).
- Estados y condiciones para pauta de instancia vencida.
- Tratamiento de vencimiento cuando no hubo ningún intento enviado.
- Resolución de excepciones pendientes, plazos de solicitud y plazo para resolver.
- Política P21 sobre progresión tras E2 fallida.
- Criterios y frecuencia de repaso por contenido (P22/P23).
- Estados visibles a familia/tutor (P24).
- Ratificación de sustituciones y límites P25.
- Confirmación del motor, soporte de transacciones/índices y estrategia de migración.

## 9. Mapeo preliminar al código publicado

| Área | Código visto en `vortice/integracion` | Brecha principal |
|---|---|---|
| Lectura de preguntas | `server/routes.ts`, `GET /api/evaluations/:id` | En fragmento no se ve sesión, matrícula ni ventana; lista blanca elimina clave |
| Envío/corrección | `server/routes.ts`, `POST /api/evaluations/:id/submit` | Devuelve puntaje y clave; no identifica un intento persistente |
| Resultados históricos | `server/storage.ts`, `saveEvaluationAttempt`; `shared/schema.ts`, `evaluation_progress` | Guarda resultados por envío; no representa por sí sola el intento activo |
| HTML externo | `server/routes.ts`, ruta `/html` | Comprueba sesión, no se ve control de matrícula/ventana; posible clave embebida |
| Repaso | `server/repaso.ts`, `syncReviewItems` y `loadDueReview` | No se ve bloqueo explícito por `review_at` |
| Formularios externos | `server/routes.ts`, `POST /api/evaluations/:id/complete` | El resultado se declara en el body y necesita validación humana |
| Acceso de módulo | `server/vortice.ts`, `checkEvaluationAccess` y `checkModuleAccess` | Calendario/módulo no sustituye la máquina de estados P0-E |

Los nombres de funciones y rutas corresponden al contenido publicado inspeccionado; antes de implementar, volver a comprobar el commit de código y revisar el contexto completo de middleware.

## 10. Registro de cambios y gobernanza

- Este documento es una **propuesta técnica** para discusión y revisión humana.
- No resuelve decisiones pedagógicas/legales pendientes ni convierte propuestas previas en reglas aprobadas.
- No autoriza cambios de código, base de datos, migraciones, ejecución de pruebas, publicación de commits locales, merge ni despliegue.
- Antes de implementarlo, solicitar aprobación explícita para un alcance concreto y revisar el diseño con responsables técnicos y académicos.
