# Modelo de aprendizaje por dominio de conocimientos pequeños (K1–K14)

**Estado global:** K1–K14 **COMUNICADAS**: respondidas «sí» por la dirección el 2026-10-30, pendientes de revisión independiente. **Nada de este modelo está construido.**
**Autorización:** ninguna para implementar, cambiar esquema, migrar o desplegar.
**Clasificación y documentos normativos:** ver [`README.md`](README.md).
**Fuente teórica:** `Informe_ALEKS_KST_Vortice_Barkley.docx` (octubre 2026). Lo que dice de ALEKS proviene de documentación pública del proveedor. Sus cifras (30–60 ítems, 3–6 variantes, 30–60 estudiantes) son hipótesis de planificación.

**Corrección a la versión anterior.** Este documento afirmaba que el modelo «no contradice ninguna regla aprobada de P0-E». Era incorrecto: ver C6, C7, C8 y C9 en [`CONTRADICCIONES_Y_PREGUNTAS.md`](CONTRADICCIONES_Y_PREGUNTAS.md). También presentaba como reglas algunos detalles no decididos; ahora están marcados.

---

## 1. Decisiones comunicadas

| ID | Decisión | Observación |
|---|---|---|
| K1 | Vórtice evoluciona a dominio por conocimientos pequeños, no solo por módulo | |
| K2 | P0-E se mantiene como capa de evidencia | Sección 5 |
| K3 | No se promete «adaptativo» ni «IA» en marketing hasta validarlo | Hay textos publicados en conflicto: C12 |
| K4 | Cada pregunta queda asociada a un contenido específico | |
| K5 | Una persona del equipo pedagógico valida nombre y definición de cada contenido | Quién y plazo: O4 |
| K6 | «Dominado» exige al menos 2 respuestas correctas en preguntas distintas | Detalles abiertos: sección 3 |
| K7 | Cada contenido declara prerrequisitos, validados por personas | |
| K8 | Se admiten rutas previas alternativas | **Segunda etapa** |
| K9 | Una sola asignatura y un solo nivel | |
| K10 | Piloto: Matemática de 5.º Básico | Unidad: O5 |
| K11 | Prácticas (E1, E3, E4): feedback inmediato por contenido. E2: retraso hasta `review_at` | Depende de P16 y requiere ratificar C6 |
| K12 | Mapa de contenidos además de la ruta de estaciones | |
| K13 | Preguntas generadas con IA: revisión humana antes de usarse | |
| K14 | Guardar cada respuesta con su contenido; exigirá migración pedida por separado | Sin autorización todavía |

## 2. Unidad de conocimiento («contenido»)

Unidad pequeña y observable que se puede enseñar, practicar y evaluar. Se separa del currículo: el OA pertenece a la capa curricular; el contenido, a la capa de conocimiento. Un contenido se vincula a uno o más OA, sin redefinirlos.

Ficha **PROPUESTA** (informe, sección 7.2): código estable; nombre y definición operacional; OA vinculados; prerrequisitos con tipo, justificación y validador; preguntas asociadas; errores frecuentes; recursos de repaso; versión, responsable y estado de validación.

**Prerrequisitos.** Etapa 1 (PROPUESTA): relaciones necesarias y contributivas. Etapa 2 (K8): rutas alternativas. Una correlación estadística no se convierte en prerrequisito sin revisión humana. Este documento no define ningún prerrequisito ni contenido curricular real.

## 3. Estados de conocimiento y K6

| Estado | Clasificación | Definición |
|---|---|---|
| **Dominado** | COMUNICADA (K6) | Al menos 2 respuestas correctas en preguntas distintas del contenido |
| **No dominado** | **PREGUNTA ABIERTA (O1)** | Sin definir |
| **Incierto** | PROPUESTA | Estado sugerido por el informe; su existencia y presentación siguen abiertas (O6) |

**Detalles de medición de K6 aún abiertos:**
- Qué respuestas cuentan: prácticas, E2, recuperación o un banco separado (N2).
- Si deben ocurrir en sesiones distintas (O2).
- Si una respuesta con ayuda cuenta (O3).
- Si una respuesta incorrecta posterior revierte el dominio, y cómo (O1, O8). La versión anterior decía que un error aislado no borra el dominio: era una hipótesis del informe, no una decisión.
- Si K6 basta frente a preguntas muy parecidas: qué hace «distintas» a dos preguntas (N9).
- Cuánto dura el dominio: retención y reevaluación (O8).

**Principio de datos (PROPUESTA, informe 8.1).** La respuesta es un hecho histórico; el estado es una interpretación revisable. El historial no se sobrescribe.

**Incertidumbre.** Una regla K6 no mide por sí sola la incertidumbre del modelo. Cómo representarla y comunicarla sigue abierto (O6, N10).

## 4. Mapa individual del estudiante (K12)

Tres categorías comunicadas: **dominado**, **por aprender** (listo: sus prerrequisitos están dominados) y **bloqueado** (falta una base, y se muestra cuál). El mapa muestra el estado estimado del modelo; no es diagnóstico adaptativo. Su comportamiento frente a E2 y P21 está en la sección 5. Requisitos de pantalla: `PROGRESO_Y_PROGRESION.md`, sección 5.

## 5. Convivencia con P0-E

**P0-E sigue siendo la capa de evidencia:** intentos, plazos, cierres, recuperaciones y revisión. El modelo de conocimiento interpreta evidencia; no cambia intentos, ventanas ni cierres.

### 70 % y K6 son medidas distintas

| | Umbral de evaluación (D3) | Dominio de contenido (K6) |
|---|---|---|
| Qué mide | Una evaluación completa | Un contenido |
| Regla | Porcentaje de correctas | Al menos 2 correctas en preguntas distintas |
| Efecto | Estado académico de la evaluación | Estado en el mapa |
| Estado | COMUNICADA, pendiente de D3 | COMUNICADA, detalles abiertos |

**La relación entre ambas no está definida (N1) y este documento no la inventa.** Son posibles, y deben contemplarse, casos como aprobar E2 con contenidos sin dominar, o dominar todos los contenidos del mapa y no aprobar E2. El «contenido no logrado» de `PROGRESO_Y_PROGRESION.md` §4 (menos de 70 % por contenido, PROPUESTA) es una tercera medida: ver C8.

### Publicación

| Evaluación | Durante el proceso | Después |
|---|---|---|
| Prácticas (función sujeta a P16) | Feedback inmediato por contenido (K11, sujeto a C6) | Según regla de revisión |
| E2 y recuperación | Solo estado. Sin puntaje, banda ni información que permita reconstruir la pauta. El mapa no debe delatar el resultado por contenido (C7) | Desde `review_at`: porcentaje real, banda y contenidos no logrados, **sujeto a D1–D4** |

### P21

Abrir el módulo siguiente con E2 «Reprobado» (COMUNICADA, requiere D2) no marca contenidos como dominados y no cambia el resultado. Qué muestra el mapa para contenidos del módulo abierto con base sin dominar: C9, N3.

## 6. Piloto (K9, K10)

- **Alcance:** Matemática de 5.º Básico. Unidad por definir (O5).
- **Hipótesis del informe, no reglas:** 30–60 contenidos; 3–6 variantes por contenido; 30–60 estudiantes.
- **Fuera del piloto:** rigen solo P0-E y la progresión vigente. Convivencia de ambos regímenes: N8.
- **Métricas:** el informe sugiere concordancia con evaluación docente, ganancia, retención y equidad. Ninguna está aprobada ni tiene meta; este documento no fija valores.

## 7. Lo que no existe y lo que no se copia

**No existe (a la fecha de este documento):** contenidos, prerrequisitos, estados, frontera, mapa, diagnóstico adaptativo, motor de recomendación, banco calibrado ni algoritmo tipo ALEKS.

**Tutor IA, precisión.** Existe en código un copiloto conversacional (`POST /api/academic-copilot/chat`, `shared/iaPolicy.ts`, `server/geminiChat.ts`), con límites y bloqueo de preguntas de evaluaciones abiertas. **No** usa modelo de conocimiento ni adapta la ruta, y no se verificó su funcionamiento real. No debe presentarse como tutor adaptativo. Ver C13.

**No se copia de ALEKS:** interfaz, marca, textos, algoritmo propietario ni afirmaciones de precisión.

**No se automatiza (informe 11.4):** crear prerrequisitos sin revisión humana; etiquetar permanentemente a un estudiante; usar el tiempo como único indicador; inferir condiciones clínicas; reducir expectativas curriculares.

## 8. Hoja de ruta (PROPUESTA, sin fechas)

| Fase | Trabajo | Requiere |
|---|---|---|
| 0–2 | Catálogo de contenidos, prerrequisitos y banco revisado de la unidad piloto (documentos) | O4, O5 y equipo pedagógico |
| 3 | Diseño de esquema | Resolver N1, N2, C6, C7 y C9; revisión independiente |
| 4 | Migración | Autorización nueva y expresa |
| 5–6 | Motor por reglas, mapa y panel | Autorización nueva y expresa |
| 7 | Piloto | Autorización nueva y expresa; revisión de datos (O10) |

## 9. Preguntas abiertas

O1–O10 y N1–N10: registro único en [`CONTRADICCIONES_Y_PREGUNTAS.md`](CONTRADICCIONES_Y_PREGUNTAS.md), sección 3.
