# 07. Copiloto conversacional

**Estado:** lo descrito EXISTE EN CÓDIGO, según lectura de esta rama. **No se ejecutó ni se probó con el proveedor.** Sin validación pedagógica. No se verificó si está activo en algún entorno: requiere `GEMINI_API_KEY`, no consultada. No se modifica en esta etapa.

**Decisión de diseño (PROPUESTO, orden de dirección):** el copiloto queda **fuera del primer piloto del motor**. El piloto funciona sin él. No hay contexto, API ni prompt nuevos.

## 1. Funciones

| Existe en código | Pieza |
|---|---|
| Chat en `/academic-copilot`, enlazado como «Tutor virtual» | `AcademicCopilot.tsx`, `VorticeInicio.tsx` |
| `POST /api/academic-copilot/chat`: sesión, límite de frecuencia, llamada al proveedor | `server/routes.ts` |
| Política pura, probada con `script/iaPolicy.check.ts` | `shared/iaPolicy.ts` |
| Llamada a `gemini-2.5-flash`, sin persistir ni registrar contenido | `server/geminiChat.ts` |
| Prompt de tutor por tramo: pistas, no respuestas finales | `buildSystemPrompt` |
| Quita correo, RUT, teléfono y UUID | `redactPII` |
| Respuesta fija ante palabras de riesgo | `detectRisk`, `riskResponse` |
| Bloqueo de preguntas de evaluaciones abiertas | `matchesEvaluationQuestion` |

| NO EXISTE |
|---|
| Conocimiento del estado, módulo o avance del estudiante |
| Selección de contenidos o recomendaciones; cambio de ruta |
| Escritura de evidencia, estado o resultados |
| Historial guardado o auditoría de conversaciones |
| Aviso a un adulto o a la institución ante riesgo |
| Evaluación de la exactitud de sus respuestas |
| Moderación de la salida del proveedor |

## 2. Información

| Recibe hoy | No recibe |
|---|---|
| Cliente: mensaje (hasta 1500), últimos 8 turnos, `evaluationId` opcional | Evidencias, estados, mapa |
| Servidor: nivel del perfil, para el tono | Puntajes, resultados, intentos |
| Servidor: texto de evaluaciones abiertas, **solo para comparar localmente** | Contenidos, recursos, módulo |
| **Al proveedor:** prompt, mensaje e historial saneados | Nombre, correo o id añadidos por el servidor |

El historial vive en el navegador y lo envía el cliente: **no es confiable**, aunque se sanea.

## 3. Riesgos del bloqueo por similitud

`matchesEvaluationQuestion` bloquea si coincide ≥ 60 % de las palabras de contenido; ignora preguntas con menos de 3.

| Riesgo | Efecto |
|---|---|
| Paráfrasis, sinónimos, otro idioma, faltas de ortografía | No bloquea |
| Dividir la pregunta en varios mensajes | No bloquea |
| Matemática: números y símbolos; palabras de menos de 4 letras se ignoran | **Especialmente débil en el piloto** |
| Preguntas cortas | Sin protección |
| Pregunta legítima de estudio parecida | Bloqueo injusto |
| El cliente no envía `evaluationId` | El modo estricto del prompt no se activa en esta pantalla |
| Las evaluaciones aprobadas salen de la lista | C21 |
| Consulta en cada mensaje sobre todas las evaluaciones | Costo, comentado en el código |

Sirve de barrera básica, no de garantía de integridad.

## 4. Riesgos de enviar mensajes de menores a un proveedor

- Un menor puede escribir datos sensibles (salud, familia, nombres): `redactPII` no detecta nombres ni direcciones.
- Salen del control de Barkley hacia Google. **No se verificaron** términos contractuales, retención, uso para entrenamiento, ubicación ni tipo de cuenta.
- Consentimiento de familias y base legal: sin verificar ([08](08_SEGURIDAD_Y_GOBIERNO.md) §6).
- Respuestas erróneas o inadecuadas sin filtro de salida.

## 5. Límites de la detección de riesgo

- Lista de palabras clave en español, **no un clasificador**. El propio código lo indica.
- No detecta: lenguaje indirecto, errores de escritura, jerga, riesgo a lo largo de varios turnos.
- Falsos positivos: frases escolares.
- **Solo revisa el mensaje actual, y responde con contactos. Nadie se entera.** Al no guardar la conversación, no hay seguimiento.
- Los teléfonos escritos en el código no se verificaron en esta revisión.
- Política institucional de protección: sin definir.

Este punto es independiente del piloto, porque el copiloto ya está enlazado: C22.

## 6. Condiciones antes de conectarlo al modelo

Todas, con autorización expresa:

1. Piloto del motor evaluado sin copiloto.
2. Revisión legal y de proveedor completas.
3. Protocolo de riesgo institucional, con responsables.
4. Evaluación pedagógica con preguntas de prueba, revisada por docentes, incluida exactitud matemática.
5. Pruebas adversas de extracción de respuestas.
6. Resolución de C21 y N13.
7. Prueba de no interferencia ampliada: [08](08_SEGURIDAD_Y_GOBIERNO.md) §7.
8. Definición de cómo cuenta la ayuda (O3).

## 7. Acceso durante el piloto

**Dos cosas distintas.** Excluir el copiloto **de la arquitectura** (no recibe ni entrega datos del motor) no impide que un estudiante **lo use**: el enlace «Tutor virtual» sigue en `VorticeInicio.tsx` y la ruta sigue en la aplicación. Esta sección no cambia enlaces ni funciones.

| Escenario | Participantes | Copiloto | Condición |
|---|---|---|---|
| **Piloto técnico** | Cuentas ficticias, datos ficticios | Ninguna prueba del motor depende de él. Si se prueba, con proveedor simulado | Sin mensajes hacia el proveedor real, salvo autorización |
| **Piloto con estudiantes reales** | Alumnos reales | **BLOQUEO:** sin decisión institucional aprobada no se inicia | Decisión de C19 y C22 |

**Decisión pendiente para estudiantes reales (C19):**

| Alternativa | Consecuencia |
|---|---|
| A. Oculto y deshabilitado para el grupo piloto, en servidor | Sin riesgo de canal; medición más limpia; requiere programar, con autorización. Ocultar solo el enlace no basta: la ruta sigue |
| B. Disponible, con los controles de abajo | Ayuda real; exige todos los controles |
| C. Disponible sin controles | **No recomendado** |

**Recomendación técnica:** A para la primera exposición. **Debe quedar oculto o deshabilitado si falta cualquiera:** protocolo de riesgo, revisión legal, consentimiento, control de evaluaciones abiertas por versión, o decisión de ambas.

**Riesgos de mantener acceso sin supervisión:** mensajes de riesgo sin atención; datos de menores hacia un tercero; ayuda en evaluación por paráfrasis; respuestas erróneas; ayuda no registrada que distorsiona K6; sin registro para investigar un incidente.

**Protocolo requerido ante riesgo (contenidos mínimos; la institución lo define, C22):**
1. Qué activa una alerta y con qué precisión aceptable.
2. Responsable y suplente, con horario, incluida fuera de horario.
3. Plazo de respuesta y escalamiento.
4. Cuándo se informa a familia, y cuándo no (por ejemplo, si la familia es la fuente del riesgo).
5. Vínculo con autoridades o servicios, con asesoría.
6. Registro mínimo: qué se guarda, quién accede, cuánto tiempo. Hoy nada se guarda.
7. Mensaje al estudiante, revisado por especialistas, incluidos los teléfonos.
8. Prueba del protocolo antes de usarlo.

Este documento no fija ninguno de esos valores.

**Información:**

| Puede recibir, si se autoriza | No debe recibir |
|---|---|
| Mensaje saneado e historial limitado | Identidad, RUT, correo |
| Tramo de edad | Puntajes, resultados, porcentajes |
| En el futuro: nombre y definición de un contenido en práctica | Evidencia, estado, mapa |
| | Pauta, preguntas de evaluación abierta o de versión sin liberar |
| | Datos clínicos, `accommodation` |

**Evaluaciones compartidas.** El bloqueo debe seguir la condición de versión ([03](03_MOTOR_DE_EVIDENCIAS.md) §8.3): una evaluación sigue protegida hasta que la versión se libere, **aunque ese estudiante la haya aprobado**. Hoy deja de bloquearse al aprobar (C21). No se cambia ahora. Una vez dentro del mensaje, el texto llega al proveedor si la similitud no lo detecta.

**Controles antes de usarlo con estudiantes reales:** los de §6, más decisión de acceso; límite global de frecuencia; filtro de salida; registro acordado; canal de reporte; consentimiento.

## 8. Arquitectura futura (solo referencia, NO autorizada)

```mermaid
flowchart LR
  U[Estudiante] --> G[Puerta del copiloto]
  G --> P[Política actual]
  G --> CTX[Constructor de contexto]
  CTX --> S[Solo datos liberados por DTO]
  P --> L[Proveedor]
```

Principio: **una sola vía**. El copiloto nunca escribe evidencia, estado, recomendaciones ni resultados, y no genera preguntas para estudiantes.
