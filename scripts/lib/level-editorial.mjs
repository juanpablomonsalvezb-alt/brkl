// Contenido editorial PÚBLICO. No son evaluaciones ni reglas del motor.
// Pilotos por contraste de etapa, no por demanda inferida de Search Console.
const OFFICIAL = 'https://www.ayudamineduc.cl/ficha/examenes-libres-menores-de-18-anos-11/';
const EXAMPLES = {
  '1-basico': {
    heading: 'Preparar 1° básico: leer la consigna y explicar lo que se entiende',
    context: 'En esta etapa conviene distinguir dos necesidades: comprender la materia y poder leer la instrucción de la actividad. La preparación no consiste solo en memorizar una respuesta. El MINEDUC señala que quienes rinden 1° básico deben saber leer y escribir en español al momento de la examinación.',
    adult: 'Durante el estudio en casa, el adulto puede ayudar a iniciar la rutina y pedir al niño que explique con sus palabras qué debe hacer. Ese acompañamiento no equivale a responder por él ni autoriza por sí mismo el ingreso del adulto a la sala del examen oficial.',
    prompt: 'Ejemplo original de práctica: «En una mesa hay 4 lápices y en otra hay 3. ¿Cuántos lápices hay en total? Dibuja cómo lo resolviste».',
    reasoning: 'Una forma de resolverlo es dibujar los dos grupos, reunirlos y contar 7 lápices. Para comprobar comprensión, cambiar los grupos a 2 y 5 y pedir una nueva explicación, no solo el resultado.',
    review: 'Si puede contar los objetos pero no entiende la consigna escrita, registrar esa diferencia para orientar el apoyo de lectura. Si comprende la consigna pero se equivoca al reunir los grupos, volver a la representación con objetos.',
    next: 'Antes de contratar preparación para 1° básico',
    checklist: ['Revisar en MINEDUC la edad y los antecedentes que corresponden al caso; no asumir que todos los niños pueden inscribirse en cualquier curso.', 'Confirmar quién acompañará el estudio cotidiano en casa y qué apoyo concreto necesita para leer las instrucciones.', 'Distinguir las actividades de práctica de Barkley de las pruebas y condiciones oficiales de examinación.'],
    related: '/adulto-acompanante', relatedLabel: 'Conocer el rol del adulto acompañante en casa',
  },
  '8-basico': {
    heading: 'Preparar 8° básico: explicar el procedimiento antes de pasar a media',
    context: 'Al cerrar la enseñanza básica, interesa comprobar no solo si se llega al resultado, sino si el estudiante puede justificarlo. Una respuesta acertada por ensayo no permite identificar por sí sola qué entiende y qué necesita practicar.',
    adult: 'La familia puede acordar momentos de revisión y pedir una explicación breve del trabajo realizado. La autonomía se observa en tareas concretas; no debe suponerse únicamente por la edad ni confundirse con estudiar sin apoyo.',
    prompt: 'Ejemplo original de práctica: «Una compra de 3 cuadernos del mismo precio más $600 de envío cuesta $4.200. ¿Cuánto cuesta cada cuaderno? Escribe una ecuación y comprueba el resultado».',
    reasoning: 'Si x es el precio de un cuaderno: 3x + 600 = 4.200; al restar 600 quedan 3.600 y, al dividir por 3, x = 1.200. La comprobación es 3 × 1.200 + 600 = 4.200.',
    review: 'Si la ecuación está bien pero falla la operación, revisar el cálculo. Si el resultado aparece sin procedimiento, pedir que explique qué representa cada número. Después cambiar un dato y comprobar si puede transferir el razonamiento.',
    next: 'Antes de organizar la transición a enseñanza media',
    checklist: ['Identificar qué contenidos requieren repaso y separarlos de las dificultades de organización del estudio.', 'Revisar la trayectoria escolar y los requisitos oficiales antes de elegir el curso a validar.', 'Para menores de edad, usar el calendario y temario de menores; no trasladar automáticamente los requisitos de adultos a 8° básico.'],
    related: '/examenes-libres-1-medio/', relatedLabel: 'Revisar la preparación de 1° medio',
  },
};
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export function levelEditorialHtml(slug) {
  const data = EXAMPLES[slug];
  if (!data) return '';
  return `<!-- level-editorial:start -->
  <section id="orientacion-del-nivel" aria-labelledby="orientacion-titulo">
    <div class="inner">
      <h2 id="orientacion-titulo">${esc(data.heading)}</h2>
      <p>${esc(data.context)}</p>
      <h3>Acompañamiento durante el estudio</h3>
      <p>${esc(data.adult)}</p>
      <h3>Ejemplo resuelto para conversar en familia</h3>
      <p><strong>Ilustración educativa, no pregunta oficial MINEDUC ni evaluación interna de Barkley.</strong> No representa por sí sola la cobertura completa del nivel.</p>
      <div class="foco"><p>${esc(data.prompt)}</p><p style="margin-top:12px;"><strong>Razonamiento:</strong> ${esc(data.reasoning)}</p></div>
      <p style="margin-top:16px;">${esc(data.review)}</p>
      <h3>${esc(data.next)}</h3>
      <ul style="padding-left:24px;">${data.checklist.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      <nav aria-label="Siguientes pasos para este nivel" class="relacionados" style="margin-top:24px;">
        <a href="/guia-examenes-libres/#quien-puede">Requisitos y diferencias entre menores y adultos</a>
        <a href="/tour-plataforma#ejemplo-vortice">Ver un recorrido ilustrativo de Vórtice</a>
        <a href="${data.related}">${esc(data.relatedLabel)}</a>
      </nav>
      <p style="margin-top:20px;font-size:14px;">Fuentes y límites: <a href="${OFFICIAL}" rel="noopener noreferrer" target="_blank">requisitos, temarios y condiciones oficiales para menores de 18 años</a>. Consulta revisada el 16 de noviembre de 2026. Los ejemplos anteriores son elaboración editorial de esta página; no predicen la prueba oficial ni garantizan aprobación.</p>
    </div>
  </section>
  <!-- level-editorial:end -->`;
}
