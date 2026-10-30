# 00. Resumen ejecutivo: diseño técnico del motor de dominio

**Estado:** diseño **PROPUESTO**, corregido tras auditoría de ChatGPT, para última auditoría. **Nada de esto está construido ni autorizado.** Rama `vortice/integracion`. Especificación maestra `0e1f64f`, sin cambios.

**Clasificación:** APROBADO, COMUNICADO, PROPUESTO, PREGUNTA ABIERTA, EXISTE EN CÓDIGO, NO EXISTE, RIESGO TÉCNICO.

## La idea en cinco decisiones de diseño

1. **Dos canales independientes.** P0-E produce el *resultado* de una evaluación. El modelo produce el *estado* por contenido. Ninguno se calcula desde el otro: 70 % y K6 no se mezclan.
2. **Evidencia con fecha de liberación.** Toda evidencia lleva `released_at`. La de E2 se libera en `review_at`. Cada lectura filtra por esa fecha, en un solo componente, y se pone al día sin depender de tareas programadas. Se comprobará con el protocolo de no interferencia ([08](08_SEGURIDAD_Y_GOBIERNO.md) §7), aún sin ejecutar.
3. **Consistencia en la base de datos.** Claves foráneas compuestas atan cada evidencia a su respuesta y separan bancos ([04](04_MODELO_DE_DATOS.md)). Depende de una prueba aún no hecha (D1).
4. **La familia es la unidad de independencia.** K6, criterio operativo de evidencia suficiente y no certeza, cuenta familias asignadas por un revisor. Diez escenarios definidos ([03](03_MOTOR_DE_EVIDENCIAS.md) §9).
5. **Reglas puras y versionadas.** La versión 1 es determinista. Hechos solo de inserción; proyecciones reconstruibles; políticas que la dirección deberá aprobar.

## Primera versión recomendada

**Práctica + mapa en una unidad de Matemática de 5.º Básico, aún sin elegir**, sin P0-E y sin copiloto. Ficha de definición: [09](09_PLAN_DE_IMPLEMENTACION.md). Es medible, no toca resultados académicos y es reversible. Integrar E2 y P21 viene después.

## Hallazgos de la auditoría de código

| Hallazgo | Efecto |
|---|---|
| `learning_objectives` es un módulo, no un OA | Se necesita catálogo de OA |
| Preguntas sin contenido, y clave por posición de la opción | Banco nuevo con id estable |
| No hay intentos, ventanas, cierres ni `review_at` | P0-E es requisito de E2 y P21 |
| Umbral 60 en código, generador y cliente | C16 |
| `repaso.ts` usa preguntas evaluativas | C11, ya declarado en el código |
| Gráfico de horas con datos fijos en `CoursePlayer.tsx` | Retirar |
| El copiloto existe, sin contexto de estudiante; modo estricto inactivo en su pantalla; riesgo sin aviso a adultos | [07](07_COPILOTO_IA.md), C21, C22 |
| No aparece `PRAGMA foreign_keys`; solo hay una migración inicial | Verificar antes de confiar en las FK |
| Falta rol de revisor pedagógico | Requisito de K5, K7, K13 |
| El documento maestro de máquina de estados dice que `/submit` da puntaje y clave; hoy solo da resultado | Desactualizado |

No se leyeron bases de datos: la presencia de contenidos de 5.º Básico o el estado real de los esquemas **no está verificado**.

## Decisiones que bloquean

Matriz completa: [10](10_DECISIONES_PENDIENTES.md). Las primeras: **O4, O5, N9** (catálogo); **O1–O3, N1, N2, N16–N18** (política); **D1–D4, C14, C15** (resultados y P21). Conflictos que requieren decidir si se enmienda la maestra: **C3, C6**.

## Riesgos principales

| Riesgo | Mitigación |
|---|---|
| Filtración de pauta | Filtro único, DTO por lista blanca, no interferencia |
| Trabajo editorial mayor que el código | Una unidad; empezar por catálogo |
| Prerrequisitos o preguntas de mala calidad | Validación humana y monitoreo |
| K6 da falsa certeza (ayuda externa, azar) | Retención, marca `por_comprobar`, sin promesas |
| P21 con normativa no revisada | C15 antes de D2 |
| Datos de menores y proveedor externo | Revisión legal antes de E7 |
| Textos públicos ya prometen funciones inexistentes | C12: sigue en producción |
| Soporte técnico sin verificar (FK, triggers, réplicas) | E0 en base desechable |

## Documentos

[01 Arquitectura](01_ARQUITECTURA_GENERAL.md) · [02 Modelo](02_MODELO_DE_CONOCIMIENTO.md) · [03 Evidencias y P0-E](03_MOTOR_DE_EVIDENCIAS.md) · [04 Datos](04_MODELO_DE_DATOS.md) · [05 Algoritmos](05_ALGORITMOS_Y_RECOMENDACIONES.md) · [06 Experiencia](06_EXPERIENCIA_DEL_ESTUDIANTE.md) · [07 Copiloto](07_COPILOTO_IA.md) · [08 Seguridad](08_SEGURIDAD_Y_GOBIERNO.md) · [09 Plan](09_PLAN_DE_IMPLEMENTACION.md) · [10 Decisiones](10_DECISIONES_PENDIENTES.md)

**Siguiente paso:** auditoría independiente; después, la dirección decide si autoriza la tercera etapa. No se empieza a programar sin esa autorización.
