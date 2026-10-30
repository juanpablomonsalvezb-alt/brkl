---
title: "Vórtice: lo que hemos adquirido teóricamente"
subtitle: "Marco conceptual, reglas pedagógicas y decisiones acumuladas (octubre de 2026)"
lang: es-CL
---

# 1. Para qué sirve este documento

**Este resumen no es normativo.** Las reglas viven en los documentos indicados en `README.md`. Versión corregida el 30 de octubre de 2026; ver `CONTRADICCIONES_Y_PREGUNTAS.md`.

Vórtice ha avanzado, en las últimas semanas, mucho más en **claridad conceptual** que en funcionalidades. Este documento reúne lo que hoy sabemos y hemos decidido en teoría, para que el equipo pueda hablar el mismo lenguaje, y distingue con honestidad tres planos:

| Plano | Significado |
|---|---|
| **Existe** | Ya funciona en el código. |
| **Decidido** | La dirección lo aprobó o lo respondió, pero aún no está construido. |
| **Propuesto o abierto** | Falta decisión, validación o ambas. |

Nada de lo descrito como «decidido» está implementado. Su construcción exige aprobación expresa de la dirección, revisión independiente y, en el caso de los datos, una migración autorizada por separado.

# 2. La idea central: avanzar porque se aprendió

La mayoría de los colegios avanza por calendario: el curso sigue aunque un estudiante no haya aprendido. Vórtice parte de la idea contraria, conocida como **aprendizaje por dominio** (*mastery learning*, Benjamin Bloom, 1968): el estudiante avanza cuando demuestra que aprendió, y recibe apoyo y nuevas oportunidades cuando no.

Esta idea tiene tres consecuencias de diseño:

1. **Progresión condicionada.** Cada módulo termina con una evaluación de cierre; aprobarla abre el módulo siguiente. La regla P21 comunicada permitiría continuar tras agotar todos los intentos, por lo que esta consecuencia está pendiente de ratificación (D2).
2. **Oportunidades limitadas pero reales.** Hay intentos acotados, una recuperación única y repaso dirigido, no castigo.
3. **Evidencia por sobre tiempo.** Importa qué demostró el estudiante, no cuántas horas estuvo conectado.

# 3. Teoría de espacios de conocimiento (KST) y ALEKS

## 3.1. Qué es

ALEKS (*Assessment and Learning in Knowledge Spaces*) es un sistema educativo basado en la **Teoría de Espacios de Conocimiento**, desarrollada a partir de los trabajos de Jean-Claude Falmagne y Jean-Paul Doignon. Su aporte no es ofrecer ejercicios digitales ni ajustar la dificultad de una pregunta, sino **representar el conocimiento como un conjunto de elementos pequeños y estimar cuáles domina cada estudiante**.

## 3.2. Conceptos que incorporamos al vocabulario

| Concepto | Definición |
|---|---|
| **Dominio** | Conjunto de elementos de conocimiento de una materia. |
| **Ítem de conocimiento (contenido)** | Unidad pequeña que se puede enseñar, practicar y evaluar, por ejemplo «sumar fracciones con distinto denominador». |
| **Estado de conocimiento** | Conjunto de ítems que un estudiante domina en un momento dado. |
| **Espacio de conocimiento** | Colección de estados posibles. No todas las combinaciones son factibles: existen dependencias. |
| **Frontera externa** | Ítems que el estudiante está **listo para aprender** ahora, porque domina sus prerrequisitos. |
| **Frontera interna** | Aprendizajes recientes o frágiles, que conviene revisar si el estudiante falla en algo nuevo. |
| **Evaluación adaptativa** | La siguiente pregunta depende de las respuestas anteriores y del modelo de conocimiento. |

## 3.3. La idea que más cambia el diseño

Un espacio vacío en el mapa **no equivale** a algo que deba estudiarse hoy. Hay tres situaciones distintas:

| Categoría | Qué hacer |
|---|---|
| Dominado | Mantenerlo y comprobar su retención más adelante. |
| No dominado, pero listo | Ofrecerlo como siguiente objetivo. |
| No dominado y aún no listo | Construir primero la base que falta; no ofrecerlo todavía. |

## 3.4. Lo que adoptamos y lo que no

**Adoptamos como principio:** conocimiento en unidades pequeñas y evaluables, diagnóstico por evidencia, prerrequisitos y rutas alternativas, reevaluación y progreso comprensible.

**No copiamos:** la interfaz, la marca, los textos, el algoritmo propietario ni las cifras de precisión de ALEKS. La información sobre ALEKS proviene de su documentación pública; lo demás son decisiones de Barkley.

# 4. Decisiones de la dirección sobre el modelo de conocimiento (K1–K14)

Respondidas «sí» el 30 de octubre de 2026. Comunicadas, pendientes de revisión independiente. **Ninguna está construida.**

| ID | Decisión |
|---|---|
| K1 | Vórtice evoluciona al dominio por conocimientos pequeños, y no solo por módulo. |
| K2 | P0-E (intentos, cierres, ventanas) se mantiene como capa de evidencia. |
| K3 | No se promete «adaptativo» ni «IA» en marketing hasta validarlo. |
| K4 | Cada pregunta se asocia a un contenido específico. |
| K5 | El nombre y la definición de cada contenido los valida una persona del equipo pedagógico. |
| K6 | «Dominado» exige al menos 2 respuestas correctas en preguntas distintas. |
| K7 | Cada contenido declara sus prerrequisitos, validados por el equipo. |
| K8 | Se admiten rutas previas alternativas (en una segunda etapa). |
| K9 | Se empieza con una sola asignatura y un solo nivel. |
| K10 | El piloto es Matemática de 5º Básico. |
| K11 | Las prácticas dan feedback inmediato por contenido; el cierre conserva el retraso hasta `review_at`. |
| K12 | El estudiante ve un mapa de contenidos, además de la ruta de estaciones. |
| K13 | Las preguntas generadas con IA las revisa una persona antes de usarse. |
| K14 | Se acepta guardar cada respuesta con su contenido, lo que requerirá una migración pedida por separado. |

Detalle completo, ficha del contenido, estados y piloto: `DOMINIO_POR_CONOCIMIENTO.md`.

# 5. Reglas académicas ya aprobadas (P0-E)

Estas reglas forman la **capa de evidencia** sobre la que se apoya el modelo de conocimiento.

| Regla | Contenido |
|---|---|
| Resultado binario al estudiante | Se informa «Aprobado» o «No aprobado» durante el proceso, no un puntaje exacto (ver sección 6 sobre cómo conviven con los porcentajes). |
| Intentos | 2 en E1, E3 y E4, y 3 en E2. El intento se consume al entregar. |
| Plazos | El plazo vence a las 23:59 hora de Chile. Hay una extensión de 48 horas. La revisión (`review_at`) llega 49 horas después del plazo. Las entregas tardías se rechazan con error 409. |
| Recuperación | Una sola recuperación por proceso, con lotes de recuperación. |

El tratamiento del historial (P7) **no** es una regla aprobada: es una propuesta (sección 9).

# 6. Umbrales y regla de avance comunicados por la dirección

| Rango de logro (comunicado, pendiente de D3) | Estado académico | Qué recibe el estudiante |
|---|---|---|
| Menos de 70 % | No aprobada | Repaso |
| 70 % a menos de 80 % | Aprobada, con refuerzo | Refuerzo sobre los contenidos más débiles |
| 80 % a 100 % | Aprobada | Sin aviso especial |

**Regla P21 (comunicada, pendiente de ratificación).** Si el estudiante agota los intentos de la evaluación de cierre y la recuperación sin alcanzar el 70 %, esa evaluación queda «Reprobada», pero el estudiante **puede continuar** al módulo siguiente. Antes se le informa qué contenidos no logró y recibe enlaces a sus recursos de repaso. Continuar no cambia el resultado, y todo queda registrado.

**Aviso importante.** Esta regla reemplaza una regla ya aprobada («agotar la evaluación sin aprobar no desbloquea el siguiente módulo»). Por eso figura como una decisión que la dirección debe ratificar expresamente (D2).

**Cómo convive con el modelo de conocimiento.** Con contenidos asociados a cada pregunta, «contenidos que no logró» podría pasar de «el módulo completo» a contenidos concretos. **El 70 % de una evaluación y K6 son medidas distintas, y su relación no está definida** (N1).

## 6.1. Contradicciones detectadas y su compatibilización

| Tensión | Compatibilización propuesta |
|---|---|
| El resultado binario contra el porcentaje real y la banda 70–79 | Durante el proceso solo se muestra el estado. Porcentaje, banda y contenidos no logrados aparecen al cierre, desde `review_at`. |
| Retraso de la pauta contra feedback inmediato por contenido | K11 lo plantea así, pero sigue en conflicto con la regla aprobada y depende de P16 (C6). |
| Módulo abierto por P21 contra contenido «bloqueado» en el mapa | Sin resolver (C9, N3). |

# 7. Clasificación de las cuatro evaluaciones de cada módulo (propuesta P16)

| Evaluación | Función propuesta | Resultado | Recuperación |
|---|---|---|---|
| E1 | Práctica de diagnóstico | «Logrado / No logrado» | No |
| E2 | Cierre del módulo, habilita el siguiente | «Aprobado / No aprobado» | Sí, única |
| E3 | Práctica de profundización | «Logrado / No logrado» | No |
| E4 | Práctica de integración | «Logrado / No logrado» | No |

Principio técnico asociado: la función de cada evaluación debe guardarse como **dato explícito**, nunca deducirse del número de la evaluación.

# 8. Cuatro indicadores que deben mantenerse separados

| Indicador | Qué mide |
|---|---|
| Avance de lecciones | Qué lecciones completó. |
| Porcentaje de evaluación | Cuánto logró en cada evaluación. |
| Estado académico | Aprobada, aprobada con refuerzo o no aprobada. |
| Contenidos por reforzar | Qué contenidos concretos debe repasar. |

Mezclarlos produce interpretaciones erróneas: completar una lección no equivale a dominar el contenido.

# 9. Evaluación de formularios externos y registros históricos (propuestas)

- **Formularios externos (P8).** La plataforma no puede corregirlos. Se propone aplicarles el mismo plazo, con validación humana y un tope de tiempo para validar. Es una solución temporal hasta migrar todo a la plataforma.
- **Historial anterior (P7).** Se conserva intacto. Los intentos antiguos no cuentan para los límites nuevos, y una aprobación antigua sigue habilitando el avance.

# 10. Posicionamiento y comunicación

## 10.1. Qué tipo de plataforma es Vórtice

**Plataforma de aprendizaje por dominio con progresión condicionada**, dentro de un colegio completo. No se la presenta como «IA adaptativa» mientras eso no exista y esté validado.

## 10.2. Plataformas de referencia

| Referencia | Por qué importa |
|---|---|
| Khan Academy | Aprendizaje por dominio, niveles de logro y repaso. Es la comparación pública más clara. |
| Duolingo | Ruta visual de estaciones; modelo para la ruta de avance. |
| ALEKS | Mapa de conocimiento, frontera y diagnóstico adaptativo; el modelo hacia el que se orienta el diseño. |
| Summit Learning | Filosofía de ritmo propio, mentor y evaluación de dominio, útil para audiencias educativas. |

Se recomienda no nombrar marcas ajenas en publicidad ni sugerir alianzas con ellas.

## 10.3. Mensajes

Hoy no hay repaso por contenido ni modelo de conocimiento, y P21 cambiaría el sentido de «avanzas cuando demuestras». Frases como «sabes exactamente qué repasar» o «nadie avanza sin entender» deben revisarse antes de usarse (C12, N7).

# 11. Lo que no hacemos todavía (y por qué)

Estas salvaguardas provienen del informe y de las decisiones de la dirección:

- El algoritmo no crea prerrequisitos curriculares sin revisión humana.
- No se etiqueta de forma permanente a un estudiante a partir de un diagnóstico breve.
- El tiempo de respuesta no se usa como único indicador de dominio.
- No se infieren condiciones clínicas a partir del desempeño.
- No se recomienda automáticamente reducir expectativas curriculares.
- No se afirma que el sistema sea adaptativo o mejore resultados hasta contar con evidencia propia.

# 12. Dónde estamos

| Capa | Estado |
|---|---|
| Currículo (OA, módulos, asignaturas) | Existe |
| Registro de eventos y repaso espaciado básico | Existe |
| Reglas de intentos, plazos y cierres (P0-E) | Decidido; construcción pendiente |
| Umbrales 70/80 y regla P21 | Comunicados; ratificación pendiente |
| Modelo de conocimiento (contenidos, prerrequisitos, estados) | Decidido; construcción pendiente |
| Banco de preguntas por contenido, revisado | No existe |
| Diagnóstico adaptativo y mapa del estudiante | No existe |
| Copiloto conversacional | Existe en código; sin verificar en uso; no es adaptativo (C13) |
| Tutor adaptativo | No existe |

# 13. Pendientes que condicionan el avance

**Decisiones de la dirección:** ratificar D1 a D4 (porcentaje al estudiante, reemplazo de la regla de bloqueo por P21, umbrales 70/80 y qué ven familia y tutor), y las decisiones P7, P8 y P16.

**Preguntas abiertas del modelo de conocimiento (O1 a O10 y N1 a N10, incluida la relación entre 70 % y K6):** cuándo un contenido pasa a «no dominado», si cuenta una respuesta con ayuda, quién valida los contenidos y en qué plazo, qué unidad concreta es el piloto, cómo se muestra la incertidumbre, qué ven familia y tutor, cada cuánto se reevalúa la retención, qué adaptaciones son compatibles con la validez, y qué datos se conservan y por cuánto tiempo.

**Autorizaciones separadas:** la migración de base de datos, cualquier despliegue y la integración a `main`.

# 14. Documentos de detalle

- `README.md`: índice y documento normativo por materia.
- `CONTRADICCIONES_Y_PREGUNTAS.md` y `TRAZABILIDAD.md`: conflictos y matriz.
- `DOMINIO_POR_CONOCIMIENTO.md`: decisiones K1–K14, ficha del contenido, estados, piloto y modelo de datos conceptual.
- `PROGRESO_Y_PROGRESION.md`: umbrales 70/80, regla P21, contradicciones y los cuatro indicadores.
- `DECISIONES_PARA_APROBAR.md` y `DECISIONES_P7_P8_P16_P21.md`: propuestas pendientes de aprobación.
- `RESULTADOS_T1_T5.md`: pruebas técnicas de las reglas de intentos, plazos y atomicidad.
- Informe base: *Vórtice: de la teoría de los espacios de conocimiento a una plataforma adaptativa para Barkley Instituto* (octubre de 2026).
