# IABARKLEY · Fase 3: Diseño de Presentación Pedagógica

**Barkley Instituto · Vórtice**  
**Versión:** 1.0  
**Estado:** Documento de diseño pedagógico (exclusivamente documental, sin cambios de código ni base de datos)  
**Referencias obligatorias:**
- Fase 1: `docs/vortice/IABARKLEY_MATRIZ_FUNDACIONAL.md`
- Fase 2: `docs/vortice/IABARKLEY_FASE2_COMPATIBILIDAD.md`

---

## 1. Objetivo de la Fase 3

Definir con precisión pedagógica y estructural cómo **IABARKLEY** enriquecerá la presentación de los contenidos académicos ya existentes en **Vórtice**, de modo que un desarrollador o equipo editorial pueda implementar la Fase 4 de forma controlada sin inventar el diseño ni alterar el funcionamiento académico de Vórtice.

Esta fase responde a la pregunta central de la Matriz Fundacional:

> ¿Cómo presentamos, explicamos, organizamos y representamos cada contenido ya definido por Vórtice para que resulte lo más comprensible, claro y accesible posible?

---

## 2. Límites absolutos

En estricto cumplimiento de las Secciones 2.2, 3.2, 11, 17 y 22 de la Matriz Fundacional:

1. **Alcance estrictamente documental en Fase 3:** no se modifica código, ni base de datos, ni componentes, ni archivos funcionales, ni el entorno de Producción.
2. **Protección total de Vórtice:** ninguna propuesta de este diseño modifica:
   - Los 15 módulos por asignatura ni su numeración o secuencia.
   - La estructura curricular ni los contenidos oficiales (`client/src/data/curriculo/*.json`, `scripts/data/modulos/*.json`).
   - Las evaluaciones, preguntas evaluativas, instrumentos, criterios ni umbrales (70% regular / 50% neurodivergente).
   - Los tiempos, plazos, calendario, bloqueos, desbloqueos, intentos, progreso, calificaciones, estados ni matrículas.
   - El motor de conocimiento ni los 5 archivos protegidos (`shared/p0e.ts`, `script/p0e.check.ts`, `script/mutar.ts`, `script/ventanas.check.ts`, `server/calendarUtils.ts`).
3. **No crear sistemas paralelos:** IABARKLEY no introduce rutas académicas alternas ni nuevas evaluaciones; opera únicamente como capa de presentación sobre los contenidos que Vórtice decide mostrar.
4. **Fidelidad e identidad:** toda presentación preserva el significado académico oficial, utiliza español latino con `tú`, respeta la identidad visual de Vórtice (fondo blanco invierno, cero verde) y nunca expone respuestas correctas de preguntas evaluativas.

---

## 3. Análisis de la Guía de Estudio Integral existente

Se inspeccionó la implementación actual en `client/src/components/vortice/GuiaEstudioModulo.tsx` y su fuente de datos del piloto Matemática · Módulo 1 (`Fracciones y decimales`: OA 7, OA 8, OA 10, OA 11 y OA 13) en `server/aulaUniversalCatalogo.ts`.

### 3.1 Estructura pedagógica actual y coincidencia con la Matriz Fundacional

| Bloque actual en `GuiaEstudioModulo.tsx` | Fuente actual (`LeccionUniversalPiloto`) | Coincidencia con Matriz IABARKLEY | Estado respecto al diseño |
|---|---|---|---|
| Barra de lectura e impresión (`Módulo completo / Solo OA actual`, `A / A+ / A++`, `Imprimir`, `Guardar en PDF`) | Estado local del componente + `@media print` A4 | Principio 12 (Inclusión) y Principio 8 (Carga cognitiva) | **Mantener intacto** |
| Índice lateral sticky (`OA 7` a `OA 13`) | `leccionesVisibles` | Principio 1 (Claridad) y Principio 4 (Segmentación) | **Mantener intacto** |
| Portada académica (kicker, título, asignatura, curso, cobertura, tiempo estimado, fecha) | Props del componente | Orientación general del documento | **Mantener intacto** |
| 1. `Qué aprenderás` | `leccion.objetivo` | Componente 1 (Orientación) | **Reutilizar** |
| 2. `Conceptos fundamentales` (tabla término, explicación, ejemplo) | `leccion.vocabulario` | Vocabulario y clarificación conceptual | **Reutilizar y enriquecer** |
| 3. `Desarrollo de la materia` (micro-tramos con título, consigna y texto) | `leccion.microTramos` | Capacidad 2 (Segmentación didáctica) y Componente 4 (Desarrollo) | **Reutilizar y enriquecer** |
| 4. `Ejemplo desarrollado paso a paso` | `leccion.ejemploResuelto.pasos` | Capacidad 7 (Modelado) y Capacidad 8 (Explicación de procedimientos) | **Enriquecer con "por qué" y verificación** |
| 5. `Representación visual` (2 barras proporcionales 0-100) | `puertas.explorar.explorarConfig` | Capacidad 6 (Representación alternativa) y Componente 5 | **Ampliar tipos visuales por disciplina** |
| 6. `Error frecuente a evitar` | `ejemploResuelto.errorFrecuente` | Capacidad 9 (Errores frecuentes) y Componente 7 (Aclaración) | **Enriquecer con causa del error** |
| 7. `Síntesis de conceptos clave` (lista + nodos de mapa mental) | `apoyos.infografiaResumen` y `apoyos.mapaMental` | Capacidad 10 (Síntesis) y Componente 8 | **Reutilizar** |
| 8. `Recursos complementarios` (saltos al Aula, `no-print`) | `puertasDisponibles(leccion)` | Integración no intrusiva con Vórtice | **Mantener intacto** |
| 9. `Autoevaluación de repaso` (enunciados sin respuestas) | `leccion.ejerciciosPractica` | Práctica de recuperación sin alterar evaluaciones | **Mantener intacto (no tocar preguntas)** |

### 3.2 Capacidades de IABARKLEY ausentes o parciales hoy

1. **Activación de conocimientos previos (Capacidad 3 / Componente 2):** la guía salta de `Qué aprenderás` directamente a la tabla de vocabulario sin recordar qué saber previo facilita el tema.
2. **Analogías y contraejemplos (Capacidades 4 y 5):** el vocabulario y el ejemplo muestran casos correctos, pero no incluyen analogías cotidianas acotadas ni contraejemplos que delimiten dónde deja de cumplirse una idea.
3. **Explicitación del porqué y verificación en procedimientos (Principio 9 / Capacidad 7):** los pasos de `ejemploResuelto` explican *qué se hace*, pero casi no explicitan *por qué funciona* ni *cómo comprobar* que el resultado es razonable.
4. **Apoyo metacognitivo no evaluativo (Capacidad 12 / Componente 9):** hoy existe `Autoevaluación de repaso` (preguntas de alternativa múltiple del banco de práctica), pero falta un cierre breve de reflexión personal no evaluativa (2 a 3 preguntas abiertas para que el estudiante verifique qué comprendió y qué necesita repasar).

### 3.3 Limitaciones estructurales detectadas (para planificar Fase 4 sin reescribir Vórtice)

1. **Acoplamiento al piloto de 5 OA:** `GuiaEstudioModulo.tsx` recibe `lecciones: readonly LeccionUniversalPiloto[]` (`oaId: OaPilotoId`), limitado a los 5 OA de Matemática 5° básico U3. Los otros 855 módulos ya cargados en los 12 cursos no tienen aún un contrato de lectura equivalente.
2. **Representación visual monotipo:** `explorarConfig` solo modela una comparación de dos barras horizontales (`izqValor` vs `derValor`). Ese formato sirve para comparar fracciones o proporciones, pero no para líneas de tiempo históricas, diagramas causa-efecto, esquemas de sistemas científicos o tablas comparativas.
3. **Activación fija en `CoursePlayer.tsx`:** la tarjeta de la Guía hoy solo habilita el botón `Leer Guía de estudio` cuando `esMatematica && currentModule === 1`.

---

## 4. Patrón pedagógico IABARKLEY

IABARKLEY utiliza un **catálogo modular de 15 componentes pedagógicos**. No es una plantilla rígida ni una secuencia obligatoria: cada módulo activa **solo los componentes que aportan comprensión real**, aplicando el Principio 14 (*No sobrecargar*).

| # | Componente | Propósito pedagógico | Cuándo incluirlo | Cuándo omitirlo |
|---|---|---|---|---|
| 1 | **Orientación** | Anunciar en lenguaje claro qué aprenderás y para qué sirve. | Siempre (1 a 2 líneas). | Nunca (es el ancla del módulo). |
| 2 | **Activación de conocimientos previos** | Recordar 2 o 3 saberes anteriores necesarios para conectar lo nuevo. | Cuando el tema depende de nociones previas (fracciones, álgebra, procesos históricos encadenados). | En temas autocontenidos o introductorios de 1° básico sin prerrequisito explícito. |
| 3 | **Explicación central** | Presentar la idea principal con claridad, precisión y lenguaje adecuado al nivel. | Siempre. | Nunca. |
| 4 | **Segmentación en tramos** | Dividir un contenido complejo en 2 a 4 micro-tramos progresivos. | Cuando hay más de una idea o subtema en el módulo. | Cuando el módulo trata un concepto breve y unitario. |
| 5 | **Desarrollo conceptual** | Explicar elementos, propiedades y relaciones entre ideas. | En conceptos nuevos, teorías, modelos científicos o sociales. | En módulos puramente procedimentales donde basta el modelado. |
| 6 | **Vocabulario / Conceptos clave** | Definir términos disciplinares con explicación breve y ejemplo. | Cuando aparecen términos técnicos o de significado preciso. | Si no hay vocabulario técnico nuevo. |
| 7 | **Representación visual o estructural** | Mostrar la misma idea con esquema, recta, tabla, línea de tiempo, diagrama o barras. | Cuando una representación reduce abstracción o aclara relaciones. | Si la imagen sería meramente decorativa. |
| 8 | **Ejemplificación y contraejemplos** | Ilustrar casos concretos cotidianos y casos donde la regla no aplica. | Cuando el concepto suele confundirse o resulta abstracto. | Si ya está cubierto por el modelado paso a paso. |
| 9 | **Analogía acotada** | Conectar un concepto abstracto con una situación familiar, declarando su límite. | En conceptos abstractos (fracciones, electricidad, células, democracia). | Si la analogía puede inducir error conceptual o sobra por claridad directa. |
| 10 | **Modelado paso a paso** | Mostrar un caso resuelto con qué se hace, por qué, cómo y cómo verificar. | En procedimientos matemáticos, análisis de textos, métodos científicos o redacción. | En contenidos puramente declarativos o descriptivos. |
| 11 | **Explicación de procedimientos** | Descomponer una técnica en pasos explícitos sin saltos implícitos. | Cuando el estudiante debe ejecutar un algoritmo o estrategia. | Cuando no hay procedimiento reproducible. |
| 12 | **Aclaraciones conceptuales** | Resolver dudas sutiles o matices importantes del tema. | Cuando existen excepciones o distinciones finas (ej. ética vs moral, hecho vs opinión). | Si no existe ambigüedad relevante. |
| 13 | **Errores frecuentes** | Mostrar un error típico, explicar *por qué ocurre* y cómo evitarlo. | Siempre que exista un error documentado del tema (fin didáctico, nunca evaluativo). | Si no hay un error típico real (no inventar errores artificiales). |
| 14 | **Síntesis e ideas clave** | Condensar en 3 a 5 viñetas o mapa conceptual lo esencial para repasar. | Siempre en Guías de Estudio; breve (1 a 2 ideas) en Cuadro de Contenidos. | Nunca en Guías de Estudio. |
| 15 | **Reflexión metacognitiva no evaluativa** | 2 a 3 preguntas abiertas breves para autochequeo de comprensión. | Al cierre de la Guía de Estudio o del bloque pedagógico. | Nunca convertirla en prueba, puntaje ni requisito de avance. |

---

## 5. Patrones según la naturaleza del contenido

Cada disciplina y tipo de contenido responde mejor a una combinación distinta. Ninguna asignatura está obligada a usar el mismo formato.

| # | Naturaleza del contenido | Secuencia pedagógica recomendada | Representación preferida | Qué evitar |
|---|---|---|---|---|
| 1 | **Conceptos abstractos** | Orientación → Conocimiento previo → Analogía acotada → Representación → Definición precisa → Ejemplo y contraejemplo → Síntesis | Diagrama conceptual o modelo visual concreto | Empezar por una definición formal sin anclaje concreto |
| 2 | **Procedimientos** | Orientación → Conocimiento previo → Modelado (qué, por qué, cómo) → Pasos explícitos → Verificación del resultado → Error frecuente → Síntesis | Secuencia numerada con anotación de "por qué" | Saltos implícitos entre pasos o reglas sin explicación |
| 3 | **Fórmulas** | Orientación → Significado de cada variable y unidad → Relación entre variables → Ejemplo resuelto con sustitución y verificación → Error frecuente | Tabla de variables + ejemplo desarrollado | Presentar la fórmula aislada para memorizar sin contexto |
| 4 | **Contenidos extensos** | Orientación → Mapa general → Segmentación en 3 a 4 tramos → Micro-síntesis por tramo → Síntesis integradora | Esquema jerárquico o mapa de nodos | Bloques largos de texto continuo sin subtítulos |
| 5 | **Vocabulario** | Orientación → Tabla (término, explicación clara, ejemplo en contexto) → Contraste con términos similares | Tabla estructurada de 3 columnas | Listas de definiciones de diccionario descontextualizadas |
| 6 | **Conceptos relacionados** | Orientación → Explicación breve de cada concepto → Tabla de comparación y contraste → Conexión entre ambos → Aclaración | Tabla comparativa de doble entrada | Explicar ambos conceptos por separado sin mostrar su relación |
| 7 | **Procesos** | Orientación → Visión global → Fases en orden secuencial → Entradas, transformaciones y salidas → Ejemplo cotidiano → Síntesis | Diagrama de flujo o secuencia de etapas | Mezclar fases fuera de orden o omitir transiciones |
| 8 | **Relaciones causales** | Orientación → Situación o fenómeno → Causas → Mecanismo que las conecta → Consecuencias → Error frecuente (confundir causa y efecto) | Esquema causa → mecanismo → consecuencia | Enumerar hechos sueltos sin explicitar el vínculo causal |
| 9 | **Contenidos históricos** | Orientación → Contexto temporal y espacial → Antecedentes → Acontecimientos y actores → Múltiples perspectivas / relaciones → Consecuencias y proyección al presente → Síntesis | Línea de tiempo + cuadro de actores/perspectivas | Memorización de fechas aisladas sin contexto ni multicausalidad |
| 10 | **Contenidos científicos** | Orientación → Fenómeno observable cercano → Conocimiento previo → Explicación con modelo científico → Evidencia o ejemplo experimental → Aclaración / error frecuente → Síntesis | Modelo rotulado, ciclo o tabla de variables | Afirmaciones sin modelo ni relación con fenómenos observables |
| 11 | **Contenidos matemáticos** | Orientación → Conocimiento previo → Representación concreta/pictórica → Representación simbólica → Modelado paso a paso con verificación → Error frecuente → Síntesis | Barra proporcional, recta numérica, tabla de valores o esquema geométrico | Pasar directo a lo simbólico sin puente visual o intuitivo |
| 12 | **Textos complejos (Lenguaje / Filosofía / Ciudadanía)** | Orientación → Contexto y propósito del texto → Segmentación de ideas principales → Análisis de recursos o argumentos → Ejemplo comentado → Reflexión metacognitiva | Esquema de estructura argumentativa o tabla idea/evidencia | Resúmenes superficiales que omiten cómo se construye el sentido |
| 13 | **Contenidos que requieren representación visual** | Orientación → Señalización de qué observar en la representación → Descripción guiada parte por parte → Conexión con el concepto → Ejemplo de lectura del recurso | Gráfico, mapa, plano, diagrama rotulado o barra proporcional | Insertar un gráfico sin guía explícita de lectura |

---

## 6. Modelo de selección de estrategias de presentación (Presentación Adaptativa)

La adaptación de IABARKLEY opera **exclusivamente en la forma de presentar el contenido**, sin alterar módulos, tiempos ni evaluaciones y sin crear rutas paralelas.

### 6.1 Variables de entrada para la selección

| Variable | Valores posibles | Impacto en la presentación |
|---|---|---|
| 1. **Naturaleza del contenido** | Uno o dos tipos de la Sección 5 (ej. Matemático + Procedimiento) | Determina la secuencia base y el tipo de representación. |
| 2. **Nivel académico** | Tramo 1 (`1°–4° básico`), Tramo 2 (`5°–8° básico`), Tramo 3 (`1°–4° medio`) | Ajusta registro, longitud de párrafos, vocabulario y grado de abstracción. |
| 3. **Complejidad** | Baja / Media / Alta | Define si se segmenta en 2, 3 o 4 tramos y cuántos ejemplos se muestran. |
| 4. **Abstracción** | Concreto / Intermedio / Abstracto | Activa analogía acotada y puente concreto → pictórico → simbólico si es alta. |
| 5. **Cantidad de conceptos** | 1–2 / 3–5 / 6+ | Activa tabla de vocabulario y mapa conceptual cuando hay 3 o más conceptos. |
| 6. **Conocimientos previos requeridos** | Ninguno / 1–2 / 3+ | Activa el bloque de Conexión previa solo si el tema requiere andamiaje previo. |
| 7. **Necesidad de procedimiento** | No / Sí | Activa Modelado paso a paso (qué, por qué, cómo, verificación). |
| 8. **Necesidad de representación** | No / Opcional / Alta | Selecciona el formato visual apropiado (barras, recta, tabla, línea de tiempo, flujo). |
| 9. **Confusiones conceptuales conocidas** | No / Sí | Activa Aclaración + Error frecuente con explicación causal y contraejemplo. |

### 6.2 Reglas de carga cognitiva por tramo escolar (Principios 8 y 14)

- **Tramo 1 (`1° a 4° básico`):** lenguaje directo y cotidiano, oraciones breves (máximo 2 líneas por idea), máximo 5 a 6 componentes activos por capítulo, prioridad a ejemplos concretos, ilustraciones/esquemas simples y 1 pregunta metacognitiva guiada.
- **Tramo 2 (`5° a 8° básico`):** equilibrio entre intuición concreta y vocabulario disciplinar preciso, máximo 7 a 8 componentes activos, modelado explícito con "por qué", errores frecuentes explicados y 2 preguntas metacognitivas.
- **Tramo 3 (`1° a 4° medio`):** rigor conceptual y disciplinar completo, análisis de múltiples perspectivas/evidencias, representaciones analíticas (tablas, modelos, gráficos, estructuras argumentativas), máximo 8 a 9 componentes activos y 2 a 3 preguntas metacognitivas de transferencia.

### 6.3 Algoritmo conceptual de selección

1. Vórtice entrega el módulo activo (`curso`, `asignatura`, `modulo`, `oa`, `titulo`, `contenido` oficial).
2. IABARKLEY clasifica el contenido según las 9 variables de la tabla 6.1.
3. Selecciona el patrón principal de la Sección 5 (y, si es mixto, combina a lo sumo 2).
4. Aplica el techo de componentes del tramo escolar (Sección 6.2) descartando bloques redundantes.
5. Verifica los 10 Controles de Calidad (Sección 9) antes de exponer la presentación.

---

## 7. Ejemplos concretos del piloto: Matemática · Módulo 1 (`Fracciones y decimales`)

Todos los ejemplos distinguen explícitamente el **contenido actualmente implementado** en `server/aulaUniversalCatalogo.ts` de la **propuesta pedagógica IABARKLEY** (sin modificar ningún archivo ni OA).

### Ejemplo 1 · Explicación actual vs propuesta mejorada (`OA 7 · Tramo 1: Amplificar`)

**CONTENIDO EXISTENTE (actual en `aulaUniversalCatalogo.ts:63-67`):**
> **Tramo 1 · Amplificar sin cambiar el valor**  
> *Consigna:* Lee cómo cambia la cantidad de partes manteniendo el mismo tamaño total.  
> Cuando amplificas una fracción multiplicando arriba y abajo por el mismo número distinto de cero, obtienes partes más pequeñas pero cubres exactamente la misma cantidad del entero (1/2 = 2/4 = 4/8).

**PROPUESTA IABARKLEY (enriquecimiento con conexión previa + analogía acotada + porqué):**
> **Antes de empezar (conocimiento previo):** recuerda que el denominador indica en cuántas partes iguales se divide el entero y el numerador cuántas de esas partes tomas.  
> **¿Por qué amplificar no cambia el valor?**  
> Imagina una barra de chocolate cortada en 2 mitades iguales y pintas 1 mitad ($\frac{1}{2}$). Si ahora cortas cada mitad en 2 trozos iguales, la barra queda en 4 partes y tu misma porción ahora tiene 2 trozos ($\frac{2}{4}$).  
> Comiste exactamente la misma cantidad de chocolate: lo único que cambió fue el tamaño de los cortes.  
> Por eso, al multiplicar numerador y denominador por el mismo número distinto de cero ($\frac{1 \times 2}{2 \times 2} = \frac{2}{4}$), duplicas el número de trozos y a la vez haces cada trozo la mitad de grande.  
> *Límite de la analogía:* sirve para visualizar fracciones equivalentes positivas; en matemática el principio general funciona con cualquier número natural distinto de cero.

---

### Ejemplo 2 · Ejemplos y contraejemplos (`OA 7 · Fracciones equivalentes`)

**CONTENIDO EXISTENTE (`aulaUniversalCatalogo.ts:58`):**
> **Fracciones equivalentes:** Fracciones distintas que valen exactamente la misma cantidad. Ejemplo: `1/2 = 2/4 = 3/6`.

**PROPUESTA IABARKLEY (ejemplo contextualizado + contraejemplo explícito):**
> - **Ejemplo que SÍ es equivalente:** $\frac{3}{4}$ y $\frac{6}{8}$ representan la misma porción de una torta, porque al multiplicar numerador y denominador por 2 se mantiene la proporción ($\frac{3 \times 2}{4 \times 2} = \frac{6}{8}$).
> - **Contraejemplo (NO es equivalente):** $\frac{3}{4}$ y $\frac{5}{6}$ **no** son equivalentes aunque a ambos números se les haya sumado 2 ($3+2=5$ y $4+2=6$). Al sumar el mismo número arriba y abajo se altera la proporción ($\frac{3}{4} = 0,75$, mientras que $\frac{5}{6} \approx 0,83$).

---

### Ejemplo 3 · Representación alternativa (`OA 7 · Comparar 2/3 y 3/4`)

**CONTENIDO EXISTENTE (`aulaUniversalCatalogo.ts:117-124`):**
> Dos barras horizontales etiquetadas `2/3 (= 8/12)` al 67% y `3/4 (= 9/12)` al 75%.

**PROPUESTA IABARKLEY (complemento con guía de lectura + segunda representación en recta numérica):**
> - **Qué observar en las barras:** ambas barras tienen el mismo largo total (1 entero). Al dividir ambas en 12 partes iguales, `2/3` cubre 8 marcas y `3/4` cubre 9 marcas; esa diferencia de 1/12 se ve directamente a la derecha.
> - **Representación alternativa (recta numérica de 0 a 1 en doceavos):** ubicar `8/12` y `9/12` entre 0 y 1 muestra que `9/12` queda más a la derecha (más cerca de 1), confirmando que $\frac{3}{4} > \frac{2}{3}$.

---

### Ejemplo 4 · Clarificación de conceptos y conexión previa (`OA 8 · Fracciones impropias y números mixtos`)

**CONTENIDO EXISTENTE (`aulaUniversalCatalogo.ts:241-242`):**
> **Fracción impropia:** Fracción igual o mayor que 1: su numerador es igual o mayor que el denominador. Ejemplo: `7/4 o 4/3`.  
> **Número mixto:** Número mayor que 1 formado por un entero y una fracción propia. Ejemplo: `1 3/4`.

**PROPUESTA IABARKLEY (conexión previa + aclaración clave):**
> - **Conocimiento previo:** en `OA 7` viste que una fracción propia es menor que 1 entero (por ejemplo, $\frac{3}{4}$). Cuando juntas 4 cuartos ($\frac{4}{4}$), completas exactamente 1 entero.
> - **Aclaración clave:** una fracción impropia ($\frac{7}{4}$) y su número mixto ($1\frac{3}{4}$) **no son dos números distintos**, sino dos formas de escribir exactamente la misma cantidad. En ambas, el denominador (`4`) se mantiene porque el tamaño de cada parte sigue siendo un cuarto.

---

### Ejemplo 5 · Modelado y explicación de procedimientos (`OA 8 · Convertir 11/4 a número mixto`)

**CONTENIDO EXISTENTE (`aulaUniversalCatalogo.ts:256-262`):**
> 1. Dividimos 11 ÷ 4: cabe 2 veces exactas (2 × 4 = 8).  
> 2. Calculamos lo que sobra: 11 − 8 = 3.  
> 3. Armamos el número mixto conservando el denominador 4: 2 3/4.

**PROPUESTA IABARKLEY (modelado completo: qué, por qué, cómo y verificación):**
> 1. **Qué hacemos:** averiguamos cuántos enteros completos de 4 cuartos caben en 11 cuartos.  
>    **Por qué:** cada 4 cuartos forman 1 entero ($\frac{4}{4} = 1$).  
>    **Cómo:** dividimos $11 \div 4 = 2$ enteros (usamos $2 \times 4 = 8$ cuartos).
> 2. **Qué hacemos:** contamos cuántos cuartos quedan sin completar otro entero.  
>    **Cómo:** restamos $11 - 8 = 3$ cuartos ($\frac{3}{4}$).
> 3. **Resultado:** reunimos los enteros y lo que sobró conservando el mismo denominador: $2\frac{3}{4}$.
> 4. **Cómo verificar tu resultado:** vuelve atrás multiplicando enteros por denominador y sumando el numerador: $2 \times 4 + 3 = 11$, lo que devuelve $\frac{11}{4}$. Si el numerador que sobra es menor que el denominador ($3 < 4$), la conversión está bien hecha.

---

### Ejemplo 6 · Error frecuente con explicación causal (`OA 10 · Fracciones y decimales`)

**CONTENIDO EXISTENTE (`aulaUniversalCatalogo.ts:437`):**
> Juntar los dígitos del numerador y denominador tras la coma (1/5 no es 0,15; 1/5 = 2/10 = 0,2).

**PROPUESTA IABARKLEY (error + por qué ocurre + cómo evitarlo):**
> **Error frecuente:** escribir $\frac{1}{5}$ como `0,15` pegando el `1` y el `5` después de la coma.  
> **Por qué ocurre:** porque se leen el numerador y el denominador como si fueran dos dígitos sueltos, olvidando que el primer lugar tras la coma representa **décimos** (partes de 10), no quintos.  
> **Cómo evitarlo:** antes de escribir la coma, lleva el denominador a 10 o a 100 ($\frac{1}{5} = \frac{2}{10} = 0,2$), o divide el numerador por el denominador ($1 \div 5 = 0,2$).

---

### Ejemplo 7 · Síntesis y apoyo metacognitivo no evaluativo (`OA 7 y OA 10`)

**CONTENIDO EXISTENTE (`aulaUniversalCatalogo.ts:134-138`):**
> Tres viñetas de síntesis + 4 nodos de mapa mental + 2 ejercicios de práctica con alternativas.

**PROPUESTA IABARKLEY (mantiene la síntesis y agrega cierre metacognitivo no evaluativo):**
> **Antes de pasar a practicar, comprueba tu comprensión (no lleva nota):**
> 1. ¿Cómo le explicarías con tus propias palabras a un compañero por qué $\frac{2}{3}$ y $\frac{8}{12}$ valen lo mismo?
> 2. De los pasos para comparar dos fracciones con distinto denominador, ¿cuál te resulta más claro y cuál necesitas repasar?
> 3. Si ves el decimal `0,6`, ¿qué estrategia usarías primero para escribirlo como fracción?

---

## 8. Diseño conceptual de los tres puntos de integración

### 8.1 Punto 1 (Prioritario): Guía de Estudio Integral del Módulo

- **Ubicación:** `client/src/components/vortice/GuiaEstudioModulo.tsx` y acceso en `CoursePlayer.tsx` (líneas 852-890).
- **Qué puede aportar IABARKLEY:**
  - Enriquecer los capítulos de la guía con los 4 bloques hoy ausentes o parciales: *Conocimientos previos*, *Analogía / contraejemplo*, *Modelado con porqué y verificación*, y *Reflexión metacognitiva no evaluativa*.
  - Extender la cobertura progresivamente desde el piloto actual (Matemática · Módulo 1) hacia los 860 módulos cargados en los 12 cursos, respetando los patrones por disciplina de la Sección 5.
- **Qué elementos existentes se reutilizan:** portada académica, índice lateral sticky, barra `A / A+ / A++`, conmutador de alcance, botones `Imprimir` / `Guardar en PDF`, `@media print` A4 limpio, tabla de vocabulario, bloques de micro-tramos, caja de error frecuente, síntesis y enlaces al Aula.
- **Qué elementos se mantienen intactos:** OA oficiales, textos de los 15 módulos en `learning_objectives`, preguntas de `Autoevaluación de repaso` (sin respuestas), reglas de acceso y navegación del curso.
- **Enriquecimiento de presentación posible:** ampliar el bloque `Representación visual` para admitir, además de barras comparativas, formatos declarativos seguros según asignatura (tabla comparativa, línea de tiempo, esquema causa-efecto, diagrama de flujo en texto/HTML semántico imprimible).
- **Riesgos de interferencia:** acoplar la guía a escritura en BD o mezclar preguntas metacognitivas con evaluaciones.
- **Controles de fidelidad:** revisión contra `client/src/data/curriculo/<grado>.json` y `scripts/data/modulos/<grado>.json` + checklist de los 10 Controles de Calidad (Sección 9).
- **Recomendación de diseño:** introducir en Fase 4 un contrato de datos de solo lectura (`GuiaPedagogicaModulo`, opcional y aditivo) que pueda nutrirse tanto desde `universal_lessons` (piloto existente) como desde archivos estáticos versionados por curso/módulo, sin alterar el esquema de BD.

---

### 8.2 Punto 2: Cuadro de Contenidos de `CoursePlayer`

- **Ubicación:** `client/src/pages/CoursePlayer.tsx` (líneas 799-847).
- **Qué puede aportar IABARKLEY:**
  - Mostrar, como apoyo colapsable o bloque complementario opcional debajo de `Objetivos de Aprendizaje` y `Contenidos`, una micro-cápsula pedagógica de 3 elementos: *En palabras simples* (orientación), *Ejemplo rápido* y *Qué evitar* (error frecuente), cuando el módulo aún no tenga guía completa o como entrada rápida antes de abrirla.
- **Qué elementos existentes se reutilizan:** tarjeta principal del módulo, badge `Módulo N`, título propio del módulo (`tituloCuadro`), fechas del calendario y bloques `Objetivos de Aprendizaje` / `Contenidos`.
- **Qué elementos se mantienen intactos:** `moduleInfo.moduleOAs`, `moduleInfo.moduleContents`, fechas, estado de desbloqueo, Temario lateral de 15 módulos, Recursos Didácticos y Evaluaciones Formativas.
- **Enriquecimiento de presentación posible:** micro-cápsula desplegable bajo demanda ("Ver explicación guiada") para no recargar la vista principal del curso (Principio 8 y Principio 14).
- **Riesgos de interferencia:** sobrecargar visualmente el panel central de `CoursePlayer`, o reemplazar visualmente el contenido oficial del módulo en lugar de complementarlo.
- **Controles de fidelidad:** los bloques oficiales `Objetivos de Aprendizaje` y `Contenidos` siempre permanecen visibles y sin alteración; la cápsula IABARKLEY es estrictamente complementaria y de solo lectura.
- **Recomendación de diseño:** mantener este punto como segunda prioridad (después de validar la Guía de Estudio en un curso piloto), siempre colapsable por defecto.

---

### 8.3 Punto 3: Puertas explicativas del Aula Universal

- **Ubicación:** `client/src/pages/vortice/VorticeAula.tsx` y catálogo `server/aulaUniversalCatalogo.ts`.
- **Qué puede aportar IABARKLEY:**
  - Mejorar la calidad explicativa de las puertas expositivas ya existentes (`video` guion/transcripción, `podcast` guion, `presentacion` láminas, `explorar` descripción y micro-tramos de lectura) incorporando el "por qué" en procedimientos, analogías acotadas y errores frecuentes con causa.
- **Qué elementos existentes se reutilizan:** la estructura de puertas (`video`, `podcast`, `presentacion`, `explorar`), micro-tramos, ejemplo resuelto y apoyos (`mapaMental`, `infografiaResumen`, `tarjetas`).
- **Qué elementos se mantienen intactos:** `preguntaDiagnostico`, `ejerciciosPractica`, `ejerciciosComprobacion`, corrección en servidor, cálculo de dominio/K6, progreso (`PUT /progreso`, `POST /practica`), desbloqueo de fronteras y aislamiento por matrícula.
- **Enriquecimiento de presentación posible:** alinear el contenido explicativo del Aula con la Guía de Estudio para que ambos compartan la misma fuente explicativa y nunca se contradigan ni se dupliquen.
- **Riesgos de interferencia:** tocar por error los campos `respuestaCorrecta` / `explicacionCorrecta` o las reglas de práctica/comprobación en `server/aulaUniversalCatalogo.ts`.
- **Controles de fidelidad:** prohibición explícita de modificar objetos `preguntaDiagnostico`, `ejerciciosPractica` y `ejerciciosComprobacion`; ejecutar `script/aula-catalogo-db.check.ts` y `script/piloto-adulto-e2e.check.ts` tras cualquier cambio editorial en Fase 4.
- **Recomendación de diseño:** usar fuente única compartida entre la Guía de Estudio y las puertas expositivas del Aula cuando el OA exista en ambos espacios.

---

## 9. Controles de fidelidad curricular

Antes de aprobar cualquier presentación pedagógica generada o enriquecida por IABARKLEY (ya sea en piloto o a escala), debe superar los **10 Controles de Calidad** de la Sección 15 más la verificación de no interferencia de la Sección 22:

| # | Control | Criterio verificable de aprobación |
|---|---|---|
| 1 | **Corrección disciplinar** | Cero errores conceptuales, de cálculo, históricos, científicos o lingüísticos; verificación en ejemplos numéricos y contraejemplos. |
| 2 | **Fidelidad al contenido oficial** | Cada afirmación y ejemplo corresponde a los OA e indicadores de `client/src/data/curriculo/<grado>.json` y `scripts/data/modulos/<grado>.json`. |
| 3 | **Alineación al objetivo** | El bloque `Qué aprenderás` refleja fielmente el OA del módulo sin desviarse ni añadir contenidos de otro curso. |
| 4 | **Claridad y registro** | Español latino con `tú`, sin guiones largos, oraciones claras y vocabulario técnico explicado antes o al aparecer. |
| 5 | **Adecuación al nivel** | Respeta la profundidad y extensión del tramo (`1°–4° básico`, `5°–8° básico`, `1°–4° medio`). |
| 6 | **Carga cognitiva controlada** | Respeta el máximo de componentes del tramo y evita texto redundante o adornos sin finalidad pedagógica. |
| 7 | **Pertinencia de ejemplos y analogías** | Ejemplos verificados; toda analogía declara explícitamente su alcance o límite si podría inducir confusión. |
| 8 | **Utilidad de la representación** | El recurso visual aclara relaciones reales y es legible tanto en pantalla (desktop, tablet, móvil) como en impresión A4/PDF. |
| 9 | **Inclusión y accesibilidad** | Jerarquía semántica limpia, contraste adecuado, compatible con escalas `A / A+ / A++`, cero verde, sin estereotipos. |
| 10 | **No alteración de Vórtice** | Cero cambios a módulos, evaluaciones, umbrales, tiempos, calendario, progreso, motor de conocimiento ni los 5 archivos protegidos; cero filtración de claves evaluativas. |

---

## 10. Riesgos identificados y mitigaciones

| Riesgo | Impacto | Mitigación de diseño |
|---|---|---|
| **1. Deriva curricular (inventar temas fuera del temario UCE)** | Alto | Toda presentación se redacta tomando como entrada obligatoria el OA y los indicadores oficiales del JSON del curso y se valida con los Controles 1, 2 y 3. |
| **2. Sobrecarga cognitiva por activar los 15 bloques siempre** | Medio-Alto | Aplicar la matriz de selección adaptativa (Sección 6) y el techo de componentes por tramo escolar (Principio 14). |
| **3. Rigidez de formato entre asignaturas distintas** | Medio | Usar los 13 patrones por naturaleza del contenido (Sección 5) y admitir múltiples tipos de representación visual (no solo barras). |
| **4. Interferencia con evaluaciones o motor de conocimiento** | Crítico | Separación estricta de capa: las preguntas metacognitivas nunca se envían al servidor, no tienen clave ni puntaje y no bloquean ni desbloquean nada. |
| **5. Duplicación entre Guía de Estudio y Aula Universal** | Medio | Diseñar un contrato compartido de solo lectura para que un OA enriquecido alimente ambas vistas desde una única fuente. |
| **6. Regresión en bases Preview sin columnas nuevas** | Medio | Priorizar contenido estático versionado en el repositorio (sin cambios de esquema en BD) o lecturas defensivas verificadas en Preview antes de cualquier despliegue. |

---

## 11. Recomendación para la siguiente fase (Fase 4: Implementación controlada)

1. **Empezar únicamente por el Punto 1 (Guía de Estudio Integral)**, porque `GuiaEstudioModulo.tsx` ya existe, está validado visualmente en Preview y cubre de inmediato la mayor brecha de valor para el estudiante (pasar de 1 módulo piloto a guías estructuradas reales).
2. **Arquitectura aditiva de solo lectura (cero cambios de BD):** definir un formato JSON estático y tipado para presentaciones pedagógicas IABARKLEY (compatible con `GuiaEstudioModulo.tsx`), dejando intactos `learning_objectives`, `universal_lessons` y toda la lógica del servidor.
3. **Despliegue incremental con piloto acotado:**
   - **Paso 4A:** aplicar el patrón IABARKLEY al piloto existente (**Matemática · Módulo 1**) sumando los 4 bloques faltantes (conocimientos previos, analogía/contraejemplo, porqué/verificación y reflexión metacognitiva) y validarlo en Preview sin alterar el Aula ni las evaluaciones.
   - **Paso 4B:** elegir **1 asignatura completa de 1 curso** (15 módulos) con diversidad de tipos de contenido (por ejemplo, Ciencias Naturales o Historia de `1° medio` o `5° básico`) para validar los distintos patrones disciplinares y representaciones visuales antes de escalar a los 12 cursos.
4. **Dejar Punto 2 (`CoursePlayer` micro-cápsula) y Punto 3 (`VorticeAula` puertas)** para iteraciones posteriores una vez validado el contrato y la calidad pedagógica en el Punto 1.

---

## 12. Decisiones que requieren autorización antes de iniciar Fase 4

Antes de escribir código o crear archivos funcionales en Fase 4, se requiere confirmación explícita sobre:

1. **Aprobación del diseño de Fase 3** y de los 4 bloques pedagógicos a incorporar en `GuiaEstudioModulo.tsx` (conocimientos previos, analogía/contraejemplo, porqué/verificación en modelado y reflexión metacognitiva no evaluativa).
2. **Alcance del primer piloto de Fase 4:**
   - Opción A: enriquecer primero **Matemática · Módulo 1** (piloto existente) + **1 asignatura completa (15 módulos)** de un curso a elección.
   - Opción B: partir directamente con **1 curso completo** (todas sus asignaturas).
3. **Estrategia de almacenamiento de las presentaciones IABARKLEY:**
   - Opción recomendada: archivos JSON estáticos versionados en el repositorio (cero migraciones de BD, 100% compatible con Preview y sin riesgo sobre Producción).
4. **Publicación documental de esta Fase 3:** confirmar si autorizas hacer `git commit` y `git push` únicamente de `docs/vortice/IABARKLEY_FASE3_DISENO_PRESENTACION.md` en la rama `vortice/h1b1-p0e-puro`.
