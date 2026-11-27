# Área: interfaz de Vórtice (rediseño UI-01)

Actualizado 2026-11-26. Último commit de la serie: `819764b`. Especificación: `docs/vortice/ui/UI-01_BLUEPRINT.md`.

## Reglas vigentes (sostenedor, 2026-11-26)
- Fondo Winter White (`#F6F5F1`). **Verde prohibido** como color de interfaz. **El landing no se toca.**
- Paleta con significado: azul eléctrico = acción, turquesa = hecho, violeta = en práctica, dorado = dominado, naranja = pendiente, rojo = error y avance bajo 55 % (decisión del 2026-11-23, vigente).
- Newsreader para títulos, DM Sans para el resto. Sin rótulos en mayúsculas.
- Inicio: saludo y 4 bloques; un solo botón principal («Tu siguiente paso», según `ov.nextStep`).

## Qué existe
- Tokens en `vortice-editorial.css` (también `.vx-course` y `.vx-copilot`); `curso.css` para asignatura y tutor virtual.
- Componentes en `client/src/components/vortice/`: `VorticeShell` (barra lateral, barra inferior bajo 1024 px, «Más»), `navegacion.ts`, `StateBlock`, `StatusTag`.
- Páginas: Inicio, `/vortice/semana`, `/vortice/portafolio`, `/vortice/apoyo` (comparten `useInicioDatos`), «Lo que sé», Familia, Evaluación, `/course/:id`, `/academic-copilot`.
- Enlaces antiguos `#brujula`, `#semana`, `#portafolio`, `#apoyo` redirigen. Desde `/course`, el estudiante vuelve a `/vortice`.

## Pruebas
`script/ui-colores.check.ts` (sin verde, contraste de tokens), `script/ui-navegacion.check.ts` (cada enlace del menú existe), `script/lectura.check.ts`.

## Pendiente
- Aula: rediseño del paso 6. Aula, Mi año y Tutor: navegación común (paso 3). Esperaban a que se confirmara otro trabajo en curso sobre esos archivos.
- Paso 9: hex sueltos, contraste y tamaños táctiles en todo, capturas 375/768/1024/1440.
- Anotado: en teléfono la lista de 15 módulos de `/course` ocupa más de una pantalla; en «Lo que sé» el panel de detalle tiene un segundo botón relleno; Familia muestra el mes en bruto.

## No verificado
Todo se vio con datos simulados. Sin probar: vista de administrador de `/course`, evaluación formativa, revisión y resultado de la evaluación, últimos 5 minutos del reloj, repaso breve con preguntas pendientes, tablet, estados sin sesión.

## Para publicar
Nada de Vórtice está en producción. `/course/:id` lo usan también los estudiantes de la intranet antigua: verán el estilo nuevo. El cambio de «Volver» debe publicarse junto con Vórtice.

## Cómo trabajar aquí
- Si hay trabajo ajeno sin confirmar que rompe `check:vortice`, delegar sobre `git archive HEAD` en una copia temporal (sin videos) y aplicar solo el diff.
- Junie puede pasar las pruebas con errores visibles (constelación oculta, cronómetro tapando la pregunta): **mirar siempre la pantalla**.
