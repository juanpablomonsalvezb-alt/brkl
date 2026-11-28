# IABARKLEY · Fase 2: Mapa de Compatibilidad con Vórtice

**Referencia fundacional:** `docs/vortice/IABARKLEY_MATRIZ_FUNDACIONAL.md` (v1.0)  
**Estado:** Análisis de compatibilidad (solo documentación, sin cambios de código ni BD)  
**Principio rector:** Conservar intactos los 15 módulos por asignatura, evaluaciones, umbrales, calendario, progreso, motor de conocimiento y los 5 archivos protegidos.

---

## 1. Puntos de integración compatibles en Vórtice

| # | Superficie actual en Vórtice | Ubicación | Qué muestra hoy | Cómo aporta IABARKLEY sin interferir | Qué queda intocable |
|---|---|---|---|---|---|
| 1 | **Guía de Estudio Integral del Módulo** | `client/src/components/vortice/GuiaEstudioModulo.tsx` y tarjeta en `CoursePlayer.tsx` (líneas 852-890) | Estructura completa de lectura y PDF (`Qué aprenderás`, conceptos, desarrollo secuencial, ejemplo paso a paso, representación visual, error frecuente, síntesis, mapa conceptual, autoevaluación), hoy poblada solo en Matemática · Módulo 1 (5 OA piloto). | Nutrir progresivamente guías pedagógicas para los 860 módulos ya cargados (1° básico a 4° medio), siguiendo el Modelo de 9 Componentes (Sección 8) y los 10 Controles de Calidad (Sección 15), reutilizando el componente existente. | Estructura del módulo, OA oficiales, controles de acceso, calendario y evaluaciones del curso. |
| 2 | **Cuadro de Contenidos del Módulo en `/course/:id`** | `client/src/pages/CoursePlayer.tsx` (líneas 799-847) | Muestra `Módulo N`, título propio del módulo, fechas, `Objetivos de Aprendizaje` (`moduleOAs`) y `Contenidos` (`moduleContents`, 1 a 3 líneas del temario oficial). | Ofrecer una vista pedagógica opcional/complementaria de ese mismo contenido (orientación, conexión previa, explicación clara, ejemplo cotidiano, aclaración de error frecuente y pregunta metacognitiva no evaluativa). | `moduleOAs` y `moduleContents` originales en `learning_objectives`, fechas del calendario, bloqueos y Temario de 15 módulos. |
| 3 | **Puertas explicativas del Aula Universal** | `client/src/pages/vortice/VorticeAula.tsx` y `server/aulaUniversalCatalogo.ts` | Micro-tramos, ejemplo resuelto, representación visual y error frecuente por OA. | Optimizar claridad, segmentación, analogías, representaciones alternativas y explicaciones de errores frecuentes en las puertas expositivas ya existentes. | Preguntas de práctica, corrección en servidor, registro de progreso, motor de conocimiento, K6 y desbloqueo de fronteras. |

---

## 2. Frontera dura: zonas excluidas de IABARKLEY

De acuerdo con las Secciones 2.2, 3.2, 11 y 17 de la Matriz Fundacional, IABARKLEY **no interviene** en:

1. **Archivos protegidos del proyecto:** `shared/p0e.ts`, `script/p0e.check.ts`, `script/mutar.ts`, `script/ventanas.check.ts`, `server/calendarUtils.ts`.
2. **Evaluaciones y calificaciones:** `EvaluationQuiz.tsx`, `server/evaluacion*`, preguntas evaluativas, criterios, umbrales (70% regular / 50% neurodivergente sin redondeo), intentos, aprobaciones y reprobaciones.
3. **Progresión, tiempos y calendario:** desbloqueos, bloqueos, plazos, `VorticeCalendario.tsx`, simulador de carga y cierre del año escolar.
4. **Motor de conocimiento y estados:** registros de evidencia, `student_progress`, `weekly_completion`, matrículas, roles y permisos.
5. **Fuente curricular oficial:** `client/src/data/curriculo/*.json` y `scripts/data/modulos/*.json` (IABARKLEY los toma como fuente de verdad inmutable para explicar, nunca los altera).

---

## 3. Verificación contra la Directriz de la Sección 22

| Control | Verificación de este mapa de compatibilidad |
|---|---|
| 1. Alcance pedagógico | Sí: limitado a presentación, explicación, representación, ejemplos y síntesis. |
| 2. Mejora comprensión | Sí: ataca directamente los 860 módulos que hoy solo muestran 1 a 3 líneas de temario. |
| 3. Fidelidad curricular | Sí: cada presentación nace de `client/src/data/curriculo/*.json` y `scripts/data/modulos/*.json` sin alterar OA. |
| 4. Respeta el módulo existente | Sí: 15 módulos fijos por asignatura, mismos IDs y secuencia. |
| 5. Respeta evaluaciones | Sí: cero cambios a preguntas, instrumentos, intentos o umbrales. |
| 6. Respeta tiempos | Sí: no toca calendario, ventanas ni plazos. |
| 7. Respeta reglas | Sí: conserva reglas pedagógicas, políticas y aislamiento por matrícula. |
| 8. Respeta arquitectura de Vórtice | Sí: reutiliza `GuiaEstudioModulo.tsx`, `CoursePlayer.tsx` y `VorticeAula.tsx`. |
| 9. Evita funciones paralelas | Sí: no crea un LMS paralelo ni rutas académicas alternas. |
| 10. No modifica funcionamiento actual | Sí: esta fase es puramente documental y la futura Fase 3/4 operará como capa aditiva de solo lectura sobre los datos académicos. |

---

## 4. Siguiente paso sugerido (Fase 3: Diseño de Presentación)

Cuando se autorice avanzar a Fase 3, el paso natural de mayor impacto y menor riesgo es definir el **esquema pedagógico estandarizado** (JSON estático versionado, sin cambios de BD) para generar Guías de Estudio bajo los 9 componentes y 10 controles de calidad de IABARKLEY, comenzando por un curso piloto completo (por ejemplo, `1° básico` o `1° medio`) antes de escalar a los 12 cursos.
