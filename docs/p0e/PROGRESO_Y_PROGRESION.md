# P0-E — Progreso visual, umbrales de rendimiento y progresión (P21 actualizada)

**Fecha:** 2026-10-26 · **Rama:** `vortice/integracion` · **Solo documentación:** no cambia código, esquema, pruebas ni producción.
**Fuente de reglas aprobadas:** `docs/P0-E/ESPECIFICACION_MAESTRA.md` en la rama `docs/p0-e-maestro` (commit `0e1f64f`). El PR #1 de correcciones de formato sigue abierto.

**Documento normativo** de P21, bandas, indicadores y experiencia de progreso (ver [`README.md`](README.md)). Contradicciones C6 en adelante: [`CONTRADICCIONES_Y_PREGUNTAS.md`](CONTRADICCIONES_Y_PREGUNTAS.md).

Estados que usa este documento:

| Estado | Significado |
|---|---|
| **APROBADO** | Regla ya aprobada en la especificación maestra. |
| **COMUNICADA** | Decisión transmitida por la dirección, pendiente de ratificación definitiva por escrito. |
| **PROPUESTA** | Recomendación técnica o de diseño, sin aprobar. |
| **REQUISITO DE INTERFAZ** | Lo que la pantalla debe hacer; no decide reglas académicas. |
| **PREGUNTA ABIERTA** | Falta una decisión; no se inventa la respuesta. |

---

## 1. Contradicciones con reglas aprobadas (requieren decisión explícita)

Las decisiones comunicadas chocan con reglas ya **APROBADAS** en la especificación maestra. No las resuelvo: las dejo para que la dirección elija.

| ID | Regla aprobada (especificación maestra) | Decisión comunicada | Por qué chocan |
|---|---|---|---|
| **C1** | «El estudiante ve únicamente «Aprobado» o «No aprobado»; no ve puntaje exacto ni total de respuestas correctas» (§2, línea 16). | Mostrar el **porcentaje real** de cada evaluación en el panel de rendimiento. | Mostrar el porcentaje es mostrar el puntaje exacto. Con intentos repetidos, el puntaje exacto permite deducir la pauta (hallazgo de seguridad documentado). |
| **C2** | El mismo principio, en §2. | Banda 70–79 % con «recomendación de reforzar». | Revelar la banda ya es información parcial del puntaje mientras la evaluación sigue abierta. |
| **C3** | «Agotar E2 sin aprobar no desbloquea automáticamente el módulo siguiente» (§4, línea 61). | Tras agotar E2 y la recuperación, **se permite continuar** al módulo siguiente. | La decisión comunicada **sustituye** una regla aprobada. Debe quedar ratificada expresamente como reemplazo. |
| **C4** | La pauta y el repaso dirigido no se muestran antes de `review_at`, y el repaso se organiza por contenido (§3 y §7; P10 y P23). | Ruta de repaso **personalizada por objetivos no logrados** al obtener menos de 70 %. | Si se muestran los objetivos fallados **mientras quedan intentos**, cada intento revela qué contenidos están bien o mal: un oráculo por objetivo. |
| **C5** | Portafolio compartido, familia y tutoría muestran estado, no puntajes (§2, línea 22). | El panel de rendimiento muestra porcentajes. | No se indica si apoderado y tutor también ven porcentajes. |

**Propuesta para compatibilizar C1, C2 y C4 (PROPUESTA, no aprobada).** Mostrar porcentaje, banda y objetivos no logrados **solo cuando el proceso evaluativo está cerrado, llegó su `review_at` y la versión cerró para todos**. Antes de esa fecha, el panel muestra solo el estado («Aprobado», «No aprobado» o «En curso»). Así se cumplen las dos cosas: el estudiante ve su porcentaje real, y nadie puede deducir la pauta mientras otros siguen rindiendo. Requiere la decisión **D1**.

---

## 2. Umbrales de rendimiento (COMUNICADA, pendiente de ratificación)

| Porcentaje obtenido | Estado de la evaluación | Indicación visible |
|---|---|---|
| Menos de 70 % | No aprobada | Ruta de repaso personalizada, vinculada a los objetivos no logrados |
| 70 % a menos de 80 % | Aprobada | Recomendación visible de reforzar contenidos |
| 80 % a 100 % | Aprobada | Sin aviso especial |

**Reglas de cálculo (REQUISITO).**
- El porcentaje sale **solo** del resultado real corregido por el servidor: `score` en `evaluation_progress`. Nunca del avance en lecciones ni de cifras de ejemplo.
- Límites exactos: 69,9 % queda por debajo de 70; 70 % aprueba; 79,9 % pide refuerzo; 80 % no.
- El servidor redondea hoy el puntaje a entero (`Math.round`). **Pregunta abierta Q3:** ¿69,5 % se redondea a 70 y aprueba?

**Diferencias con el sistema actual.**
- **Umbral del código.** Hoy el umbral de aprobación es `passing_score`, que vale 60 por defecto (`shared/schema.ts`). La regla comunicada fija 70. **Pregunta abierta Q1:** ¿70 % aplica a todas las evaluaciones o solo a E2?
- **Etiquetas de prácticas.** P16 (propuesta) muestra «Logrado / No logrado» en las prácticas E1, E3 y E4. **Pregunta abierta Q2:** ¿los umbrales y las etiquetas «Aprobada / No aprobada» aplican también a las prácticas?

---

## 3. P21 actualizada — Progresión tras agotar E2 (COMUNICADA, sustituye la propuesta anterior)

**Cambio.** Se reemplaza la propuesta anterior de P21 («bloqueo + revisión académica + avance excepcional autorizado»), que queda **SUSTITUIDA**. El cambio afecta también la regla aprobada de la línea 61 de la especificación maestra (ver C3).

**Flujo comunicado.**
1. El estudiante rinde E2 dentro de sus intentos ordinarios (3, P1 aprobada).
2. Si los agota sin aprobar (menos de 70 %), pasa a la **recuperación final única** (P12 aprobada), con **2 intentos** (P17: antes propuesta, ahora comunicada).
3. Si aprueba la recuperación: avanza al módulo siguiente con E2 «Aprobado».
4. Si agota también la recuperación sin alcanzar 70 %:
   - el proceso evaluativo de E2 conserva el resultado **«Reprobado»**;
   - **se le permite continuar** al módulo siguiente;
   - **antes de avanzar**, se le informa que no alcanzó el mínimo y en qué objetivos o contenidos;
   - se le muestran esos contenidos pendientes, con **enlaces directos** a sus recursos de repaso;
   - avanzar **no cambia** el resultado de E2 ni equivale a aprobarlo;
   - se **registran** el resultado, los objetivos pendientes y la decisión de continuar (fecha y confirmación del estudiante).

**Implicancias.**

| Aspecto | Implicancia |
|---|---|
| Regla de avance (`checkModuleAccess`, hoy «E2 aprobada») | Pasaría a «E2 aprobada **o** proceso de E2 cerrado como Reprobado con continuación registrada». |
| Requisitos | El módulo siguiente se abre sin aprobar E2. Es lo que la dirección comunicó; debe ratificarse como reemplazo de C3. |
| Momento | Solo se puede continuar cuando el **proceso** está cerrado (recuperación agotada o vencida), no al agotar los intentos ordinarios. |
| Espera por lotes | La recuperación ocurre en lotes con ventana común (P6, P20). **Pregunta Q5:** ¿el estudiante espera el lote sin acceso al módulo siguiente? |
| Seguridad de la pauta | Mostrar los objetivos no logrados al cerrar el proceso es compatible con la pauta solo si ocurre **después de la condición de publicación (`review_at` y versión cerrada)** de la recuperación (ver C4). Si debe ser inmediato, ver Q6. |
| Nota y promoción | El «Reprobado» de E2 se mantiene como evidencia; el sistema no reprueba el módulo ni el curso. La promoción se decide fuera del sistema. |
| Tutoría y familia | **Pregunta Q7:** ¿se avisa al tutor o al apoderado cuando el estudiante continúa con objetivos pendientes? |

---

## 4. Cómo se identifican los objetivos no logrados (PROPUESTA)

> **Aviso.** El criterio de esta sección (menos de 70 % por contenido) **no** es K6 (2 correctas en preguntas distintas). Son medidas distintas y su relación no está definida: C8 y N1. El umbral de evaluación (70 %) tampoco equivale a ninguna de ellas.

**Situación actual (verificada en el código).**
- Cada módulo tiene un objetivo de aprendizaje (`learning_objectives`, uno por `week_number`).
- Las preguntas de las evaluaciones (`questions_json`) **no tienen etiqueta de objetivo ni de contenido**. Con los datos actuales solo se puede decir «no logró el objetivo del módulo», no qué contenidos dentro de él.

**Propuesta.**
1. **Etiquetado editorial:** cada pregunta lleva uno o más identificadores de contenido u objetivo (`contenidos: ["OA3.2", …]`). Las preguntas sin etiqueta cuentan solo para el objetivo general del módulo.
2. **Logro por contenido en cada intento:** porcentaje de preguntas correctas de ese contenido. Un contenido queda **«no logrado»** si está por debajo del 70 % (mismo umbral; **pregunta Q4:** ¿hace falta un mínimo de preguntas por contenido para que el resultado sea confiable?).
3. **Intento que cuenta:** se usan los resultados por contenido del intento que **cerró** el proceso (el último de la recuperación, o el que aprobó).
4. **Granularidad mostrada:** al estudiante se le muestra el contenido, nunca la pregunta ni la respuesta (protege la pauta, ver C4).

**Datos necesarios (requieren migración, no autorizada).**
- Etiquetas de contenido en las preguntas.
- Tabla de logro por contenido: intento, contenido, correctas, total, porcentaje.
- Tabla de continuación: estudiante, módulo, evaluación, resultado, contenidos pendientes, fecha y confirmación.
- Vínculo contenido → recursos de repaso: un banco de práctica separado de las preguntas evaluativas (requisito ya aprobado de repaso por contenidos).

---

## 5. Requisitos de interfaz: progreso dentro de cada lección (REQUISITO)

Referencia visual: el diseño de inicio aprobado por la dirección (barra lateral clara, serif oscuro, verde profundo, tarjetas claras). Sin barras de progreso tradicionales.

### 5.1 Ruta de aprendizaje
- Camino visual de **estaciones** (nodos o misiones), una por lección o recurso del módulo, unidas por un trazo.
- Estados de cada estación, con color, icono y texto (nunca solo color):

| Estado | Fuente del dato |
|---|---|
| Completada | Recurso marcado como completado (`student_progress`) |
| En curso | Siguiente paso del resumen de Vórtice |
| Pendiente | Recurso liberado y no completado |
| Requiere refuerzo | Recurso vinculado a un contenido no logrado (sección 4); visible solo cuando lo permita C4/D1 |
| Bloqueada | Módulo o recurso aún no liberado por calendario |

- Microanimaciones sutiles solo al cambiar de estado (por ejemplo, al completar una estación). Se respeta `prefers-reduced-motion`.

### 5.2 Panel compacto de rendimiento (persistente)
- Visible mientras el estudiante estudia: lateral en escritorio, plegable en móvil.
- Por evaluación del módulo: nombre visible (según P16), estado y, si D1 lo permite, el porcentaje real con su banda (sección 2).
- Accesos directos a los contenidos que requieren refuerzo.

### 5.3 Historial de módulos anteriores
- Lista compacta de módulos ya cursados, consultable sin salir de la lección (panel o desplegable).
- Por módulo: estado de E2 («Aprobado», «Reprobado — continuó con contenidos pendientes») y, si D1 lo permite, porcentajes.

### 5.4 Cuatro indicadores separados (obligatorio)

| Indicador | Qué mide | Fuente | Nunca se mezcla con |
|---|---|---|---|
| Avance en lecciones | Recursos completados / liberados | `student_progress` | Rendimiento en evaluaciones |
| Rendimiento en evaluación | % de respuestas correctas del intento que cuenta | `evaluation_progress.score` (servidor) | Avance en lecciones |
| Estado académico | Aprobado, No aprobado, En curso, Reprobado, Cerrada | Cierre del proceso (P0-E) | Porcentajes |
| Contenidos a reforzar | Contenidos por debajo de 70 % | Logro por contenido (sección 4) | Avance en lecciones |

Cada indicador lleva su propia etiqueta y unidad. El porcentaje de lecciones completadas nunca aparece junto a la palabra «evaluación».

### 5.5 Datos reales
Ningún número de ejemplo en producción ni en Preview. Si un dato no existe, se muestra un estado vacío explicado («Aún no rindes esta evaluación»). El gráfico de horas con datos inventados que sigue en `CoursePlayer.tsx` se elimina al implementar esta sección.

---

### 5.6 Mapa de contenidos (K12)
- Vista complementaria de la ruta: dominado, por aprender y bloqueado, con la base faltante nombrada.
- Solo donde exista el modelo (piloto). Fuera del piloto no se simula.
- No se muestra como diagnóstico ni como evaluación académica.

### 5.7 Cuándo se publica cada dato

`review_at` es necesario, no suficiente. Condición completa: [`03`](../vortice/diseno-tecnico/03_MOTOR_DE_EVIDENCIAS.md) §8.3 (PROPUESTO).

| Dato | Antes de la condición de publicación | Desde que se cumple |
|---|---|---|
| Avance de lecciones | Visible | Visible |
| E2 y recuperación: estado | Visible | Visible |
| E2 y recuperación: porcentaje, banda, contenidos no logrados, efecto en el mapa | **Oculto** | Visible, sujeto a D1–D4 y C7 |
| Prácticas: feedback por contenido | Inmediato, sujeto a C6 y P16 | Visible |
| Pauta y respuestas | Oculta | Según P19, en revisión de solo lectura |

### 5.8 Dirección de la experiencia (REQUISITO)
Moderna, motivadora y persistente dentro de la lección: se ve como una ruta en curso, no como una tabla o barras administrativas. La motivación nunca reemplaza el significado: no hay puntos ni celebraciones que oculten un «Reprobado» o sugieran que continuar equivale a aprobar.

### 5.9 Criterios de aceptación (para una implementación futura, no autorizada)

| ID | Criterio |
|---|---|
| CA1 | Ruta, panel, historial y acceso a contenidos por reforzar se pueden usar sin salir de la lección, en escritorio y móvil |
| CA2 | Los cuatro indicadores aparecen separados, cada uno con etiqueta y unidad; completar lecciones nunca modifica el rendimiento y viceversa |
| CA3 | Todo porcentaje procede de un resultado real del servidor; sin dato hay estado vacío explicado. Ningún valor ficticio |
| CA4 | Antes de cumplirse la condición de publicación (instancia cerrada, `review_at` y versión cerrada para todos; maestra §3), ninguna respuesta de la API ni elemento de pantalla revela puntaje, banda, contenidos fallados o pauta de E2 o recuperación. Se prueba en API, no solo en pantalla |
| CA5 | Cumplida esa condición, y ratificadas D1–D4, se muestran porcentaje real, banda y contenidos no logrados |
| CA6 | 69,9 %, 70 %, 79,9 % y 80 % dan la banda correcta; el redondeo sigue Q3 |
| CA7 | Con P21 ratificada: antes de continuar, se muestran contenidos no logrados y enlaces de repaso; se registran resultado y decisión; E2 sigue «Reprobado» en todas las vistas |
| CA8 | El mapa solo cambia a «dominado» según K6 y sus reglas abiertas ya definidas |
| CA9 | Familia y tutor ven únicamente lo que D4 y O7 determinen |
| CA10 | Estados con texto e icono, teclado, lector de pantalla y `prefers-reduced-motion` |

## 6. Coherencia verificada

| Regla | ¿Coherente con P21 actualizada y el umbral de 70 %? |
|---|---|
| Intentos E2: 3 ordinarios (P1, aprobada) | Sí |
| Recuperación única (P12, aprobada) | Sí |
| 2 intentos de recuperación (P17, ahora comunicada) | Sí; la especificación maestra la tiene como propuesta y debe actualizarse al ratificarla |
| Revisión de la pauta en `review_at` (P4/P19, aprobadas) | Sí, solo si los objetivos no logrados se muestran después de la condición de publicación (`review_at` y versión cerrada) (C4, D1) |
| Resultado binario (§2, aprobada) | **No**: C1 y C2 |
| E2 bloquea el avance si no se aprueba (§4, aprobada) | **No**: C3, sustitución comunicada |
| Portafolio, familia y tutor sin puntaje (§2, aprobada) | Depende de C5 |
| `passing_score` 60 en el código | **No**: Q1 |

---

## 7. Decisiones y preguntas para la dirección

| ID | Decisión o pregunta |
|---|---|
| **D1** | ¿Se reemplaza la regla «solo Aprobado/No aprobado» por «estado durante la evaluación; porcentaje, banda y contenidos no logrados al cerrar el proceso, llegar `review_at` y cerrar la versión para todos»? (C1, C2, C4) |
| **D2** | ¿Se ratifica que la P21 actualizada **reemplaza** la regla aprobada «agotar E2 sin aprobar no desbloquea el módulo siguiente»? (C3) |
| **D3** | ¿Se ratifican los umbrales 70/80 y que 70 % es el mínimo de aprobación? |
| **D4** | ¿Apoderado y tutor ven porcentajes o solo estados? (C5) |
| Q1 | ¿El 70 % aplica a E1–E4 o solo a E2? |
| Q2 | ¿Las prácticas (E1, E3, E4) usan «Aprobada / No aprobada» o «Logrado / No logrado»? |
| Q3 | Redondeo: ¿69,5 % aprueba? |
| Q4 | Mínimo de preguntas por contenido para declarar un contenido «no logrado». |
| Q5 | ¿El estudiante puede avanzar mientras espera su lote de recuperación? |
| Q6 | Si los contenidos no logrados deben mostrarse antes de `review_at`, ¿se acepta el riesgo de deducción de la pauta? |
| Q7 | ¿Se avisa al tutor o al apoderado cuando el estudiante continúa con contenidos pendientes? |
| Q8 | ¿Quién etiqueta las preguntas por contenido y en qué plazo? (requisito para la sección 4) — **respondida en parte:** K4/K5 en [`DOMINIO_POR_CONOCIMIENTO.md`](DOMINIO_POR_CONOCIMIENTO.md); falta quién y plazo (O4) |

Nada de esta lista se implementará sin aprobación expresa, revisión de ChatGPT y una autorización aparte para la migración.
