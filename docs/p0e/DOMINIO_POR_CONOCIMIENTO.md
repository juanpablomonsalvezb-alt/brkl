# Vórtice hacia el dominio por conocimiento (inspirado en ALEKS / KST)

**Estado:** decisiones K1–K14 **respondidas «sí» por la dirección en el chat (2026-10-30)**. Pendiente: revisión independiente de ChatGPT.
**Qué NO autoriza este documento:** implementación, cambios de esquema, migraciones, despliegues ni cambios en producción. Cada uno requiere autorización aparte.
**Fuente:** `Informe_ALEKS_KST_Vortice_Barkley.docx` (octubre 2026). Lo que el informe dice de ALEKS proviene de documentación pública del proveedor; todo lo demás son decisiones de Barkley.
**Relación con P0-E:** P0-E (intentos, cierres, ventanas, P7/P8/P16/P21) se mantiene como **capa de evidencia**. Este documento agrega, encima, el **modelo de conocimiento**. No contradice ninguna regla aprobada de P0-E.

---

## 1. Decisiones respondidas

| ID | Decisión | Respuesta |
|---|---|---|
| K1 | Vórtice evoluciona a dominio por conocimientos pequeños, al estilo ALEKS, y no solo por módulo | Sí |
| K2 | P0-E se mantiene como capa de evidencia | Sí |
| K3 | No se promete «adaptativo» ni «IA» en marketing hasta validarlo | Sí |
| K4 | Cada pregunta queda asociada a un contenido específico | Sí |
| K5 | El nombre y la definición de cada contenido los valida una persona del equipo pedagógico; no los fija la IA sola | Sí |
| K6 | «Dominado» exige al menos 2 respuestas correctas en preguntas distintas | Sí |
| K7 | Cada contenido declara sus prerrequisitos; una persona del equipo valida las relaciones | Sí |
| K8 | Un contenido puede tener más de una ruta previa válida | Sí (etapa 2, ver sección 6) |
| K9 | Se empieza con una sola asignatura y un solo nivel | Sí |
| K10 | El piloto es Matemática de 5º Básico | Sí |
| K11 | Las prácticas (E1, E3, E4) dan feedback inmediato por contenido; el cierre (E2) conserva el retraso de `review_at` | Sí |
| K12 | El estudiante ve un mapa de contenidos (dominados, por aprender, bloqueados) además de la ruta de estaciones | Sí |
| K13 | Las preguntas generadas con IA las revisa una persona antes de usarse | Sí |
| K14 | Se acepta guardar cada respuesta con su contenido asociado, lo que exigirá una migración posterior, pedida por separado | Sí |

---

## 2. Qué es un «contenido» (ítem de conocimiento)

Unidad pequeña que se puede **enseñar, practicar y evaluar**. Ejemplo bueno: «Sumar fracciones con distinto denominador». Ejemplo demasiado amplio: «Fracciones». Ejemplo demasiado pequeño: «Recordar el símbolo de la barra».

Ficha mínima de cada contenido (según el informe, sección 7.2):

| Campo | Contenido |
|---|---|
| Código estable | No cambia aunque cambie el nombre visible |
| Nombre y definición operacional | Qué debe poder hacer el estudiante |
| OA / habilidad | Vínculo con `learning_objectives` (currículo chileno) |
| Prerrequisitos | Contenidos previos, con tipo de relación (ver sección 5) |
| Criterio de dominio | Regla de evidencia (ver sección 3) |
| Preguntas asociadas | Al menos 3 variantes distintas |
| Errores frecuentes | Para orientar el repaso |
| Recursos de repaso | Lección, video o actividad existente |
| Gobernanza | Responsable, fecha, versión y estado de validación |

**Regla de separación (informe 7.1):** el currículo oficial (OA) y el modelo de conocimiento (contenidos) son dos capas distintas. Cada contenido se vincula a uno o más OA; ningún OA se redefine desde el motor.

---

## 3. Cuándo un contenido está «dominado» (K6)

Estados de cada contenido para cada estudiante:

| Estado | Significado |
|---|---|
| **Dominado** | Al menos 2 respuestas correctas en **preguntas distintas** del mismo contenido |
| **No dominado** | Evidencia suficiente de que no lo logra (ver pregunta abierta O1) |
| **Incierto** | Evidencia insuficiente o contradictoria (por ejemplo, 1 acierto y 1 error) |

- Un error aislado **no borra** un dominio ya establecido: marca el contenido como «por comprobar».
- El historial de intentos **no se sobrescribe**; el estado es una interpretación que puede cambiar (informe 8.1).
- Un contenido solo se muestra como «no dominado» ante el estudiante cuando corresponda según K11 (ver sección 4).

---

## 4. Qué ve el estudiante y cuándo (K11, K12)

| Tipo de evaluación | Feedback por contenido | Razón |
|---|---|---|
| **Práctica** (E1, E3, E4; P16) | **Inmediato** | Es formativa: ver el error enseña y orienta el repaso |
| **Cierre** (E2) | **Desde `review_at`** | Mantiene la regla aprobada: evita que cada intento revele la pauta |

**Mapa del estudiante** (K12), además de la ruta de estaciones:
- **Dominado:** contenidos con evidencia suficiente.
- **Listo para aprender:** no dominado, con todos sus prerrequisitos dominados (la «frontera externa» del informe).
- **Bloqueado por una base:** faltan prerrequisitos; se muestra qué base falta, no solo un candado.

**Consistencia con P21:** al agotar E2 sin aprobar, el estudiante sigue pudiendo continuar y recibe los contenidos no logrados con enlaces de repaso. Con este modelo, esos «contenidos no logrados» pasan de «el módulo completo» a **contenidos concretos**. Esto resuelve el requisito previo Q8 de [`PROGRESO_Y_PROGRESION.md`](PROGRESO_Y_PROGRESION.md).

---

## 5. Prerrequisitos (K7, K8)

Cada relación entre contenidos registra: tipo, justificación, nivel de confianza y quién la validó.

| Tipo | Significado | Etapa |
|---|---|---|
| Necesaria | El avanzado requiere el previo | 1 |
| Contributiva | Ayuda, pero no es indispensable | 1 |
| Alternativa | Hay más de una combinación válida de previos | **2** |

- Una correlación estadística **no** se convierte en prerrequisito sin revisión humana (informe 11.4).
- La etapa 1 usa solo relaciones necesarias y contributivas, con validación humana.

---

## 6. Piloto: Matemática de 5º Básico (K9, K10)

- **Alcance:** una unidad de Matemática de 5º Básico, descompuesta en **30–60 contenidos** (hipótesis inicial del informe; no es un estándar científico).
- **Banco:** 3–6 variantes de pregunta por contenido, todas revisadas por una persona (K13).
- **Fuera del piloto:** las demás asignaturas y niveles. No se simula cobertura que no existe: Barkley cubre 1º Básico a 4º Medio, pero el modelo de conocimiento solo existirá donde se haya construido y validado.
- **Éxito del piloto** (informe sección 12): concordancia del diagnóstico con la evaluación docente, ganancia entre antes y después, retención diferida, abandono y equidad por dispositivo y conectividad. No se mide por minutos conectados ni por ejercicios completados.

---

## 7. Hoja de ruta (propuesta, sin fechas comprometidas)

| Fase | Trabajo | Autorización necesaria |
|---|---|---|
| 0 | Catálogo de contenidos de la unidad piloto y criterios de dominio (documento) | Ninguna adicional |
| 1 | Relaciones de prerrequisito, validadas por el equipo (documento) | Ninguna adicional |
| 2 | Banco de preguntas: variantes revisadas por una persona | Ninguna adicional |
| 3 | **Diseño de esquema** (tablas de contenidos, relaciones, respuestas por contenido) | Revisión de ChatGPT |
| 4 | **Migración** (K14) | **Autorización explícita separada** |
| 5 | Motor por reglas: estados, frontera, recomendación explicable | Aprobación + pruebas |
| 6 | Mapa del estudiante y panel de tutor | Aprobación |
| 7 | Piloto con estudiantes ficticios y luego con grupo acotado | Aprobación |

Las fases 0 a 2 son trabajo pedagógico y no tocan código. El informe advierte que la calidad depende más de cómo se definen los contenidos que del algoritmo.

---

## 8. Modelo de datos conceptual (para revisión; no es una migración)

Entidades nuevas esperadas: **contenido**, **relación entre contenidos**, **vínculo contenido ↔ OA**, **vínculo pregunta ↔ contenido**, **respuesta por pregunta** (hecho histórico), **estimación de dominio** (interpretación revisable, con fecha y versión).

Principios de diseño:
- La respuesta es un hecho; la estimación de dominio es una interpretación que puede cambiar. No se sobrescribe el historial.
- Cada recomendación guarda su motivo («se ofrece este contenido porque A y B, sus prerrequisitos, están dominados»).
- Lo existente se reutiliza: `learning_objectives` (OA), `learning_events` (eventos sin texto libre), `review_items` (repaso espaciado), `evaluation_progress` y las tablas de intentos de P0-E.
- El diseño de P0-E debe evitar atar la lógica a `evaluation_number`; ya está contemplado en P16.

---

## 9. Lo que NO se automatiza todavía (informe 11.4)

- El algoritmo **no crea** prerrequisitos curriculares sin revisión humana.
- No se etiqueta permanentemente a un estudiante a partir de un diagnóstico breve.
- El tiempo de respuesta no es indicador único de dominio.
- No se infieren condiciones clínicas a partir del desempeño.
- No se recomienda automáticamente reducir expectativas curriculares.

---

## 10. Preguntas abiertas (no respondidas por mí)

| ID | Pregunta |
|---|---|
| O1 | ¿Cuándo un contenido pasa a «no dominado»: tras 2 errores en preguntas distintas, o con otra regla? |
| O2 | ¿Las 2 respuestas correctas de K6 deben ocurrir en sesiones distintas o pueden ser en la misma práctica? |
| O3 | ¿Una respuesta con ayuda (pista, explicación del robot, si existiera) cuenta como evidencia de dominio? |
| O4 | ¿Quién del equipo pedagógico valida contenidos y prerrequisitos, y en qué plazo? |
| O5 | ¿Qué unidad concreta de Matemática de 5º Básico es el piloto? |
| O6 | ¿El estudiante ve «incierto» como estado propio, o se le muestra como «por comprobar»? |
| O7 | ¿Los apoderados y tutores ven el mapa por contenido o solo el resumen? (ver D4 en `PROGRESO_Y_PROGRESION.md`) |
| O8 | ¿Cada cuánto se reevalúa un contenido dominado para comprobar retención, y con qué política? |
| O9 | ¿Qué adaptaciones (tiempo, formato) son compatibles con la validez de cada evaluación? |
| O10 | ¿Qué datos se conservan, por cuánto tiempo y quién accede? Requiere revisión de protección de datos aplicable en Chile antes de escalar. |

---

## 11. Marketing (K3)

Frases compatibles con lo que existe hoy y con lo que este documento promete a futuro:
- «Identifica qué aprendió cada estudiante y orienta el siguiente paso.»
- «Cada evaluación te muestra con precisión qué contenidos dominas y cuáles reforzar.»

Frases que **no** se usan hasta validar el piloto: «inteligencia artificial adaptativa», «conoce exactamente todo lo que sabe tu hijo», «como ALEKS» o cualquier uso de su marca.
