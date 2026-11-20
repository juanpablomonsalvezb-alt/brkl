# ¿Qué es esta plantilla?

Es la lista vacía de las **45 preguntas** que necesita el piloto de Matemática 5.º Básico, Unidad 3. Cada fila es un espacio para una pregunta que aún no se ha escrito.

## ¿Cómo se llena?

1. **enunciado**: Escribe la pregunta (sin inventar números de página ni títulos).
2. **alternativas**: Las opciones de respuesta en formato JSON, p. ej. `[{"id":"A","texto":"..."},{"id":"B","texto":"..."}]`.
3. **respuesta_correcta**: El `id` de la alternativa correcta (p. ej. `"A"`).
4. **fuente_tipo**: El tipo de fuente oficial: `texto_escolar`, `plan_programa`, `bases_curriculares` o `banco_items_mineduc`.
5. **fuente_referencia**: Título, autor y editorial de la fuente.
6. **fuente_edicion**: Año o edición.
7. **fuente_ubicacion**: Capítulo y/o página donde se encuentra el contenido.
8. **autor_id**: Tu identificador (p. ej. `"juan"`).
9. **validador_1** y **validador_2**: Los identificadores de dos personas distintas que revisen la pregunta.

## Regla de «publicable»

Para que una pregunta pueda usarse en una evaluación oficial, debe cumplir **tres condiciones**:

1. **OA oficial**: El OA de la pregunta debe estar en la lista oficial (7, 8, 10, 11 o 13).
2. **Fuente completa**: Debe tener `fuente_tipo`, `fuente_referencia`, `fuente_edicion` y `fuente_ubicacion` llenos (sin espacios vacíos).
3. **Dos validadores**: Debe tener al menos **dos validadores distintos entre sí y distintos del autor**.

Si falta algo, la pregunta queda en estado `borrador` y no se puede publicar.

## Distribución

- **5 subtemas**: OA 7, OA 8, OA 10, OA 11, OA 13.
- **9 preguntas por subtema** = 45 preguntas en total.
- **3 preguntas por subtema** entran en cada prueba de 15 preguntas (E2).
- Las otras 6 preguntas por subtema sirven para el intento extra y para variar las pruebas.
