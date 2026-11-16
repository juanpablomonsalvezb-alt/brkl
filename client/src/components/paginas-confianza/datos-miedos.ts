/**
 * Contenido de /por-que-barkley: los siete miedos de las familias chilenas y cómo los resuelve Barkley.
 *
 * CIFRAS NACIONALES QUE DEBE RESPALDAR LA DIRECCIÓN ANTES DE PUBLICAR EN PRODUCCIÓN
 * (vienen de la especificación del equipo; el código no las puede verificar): «más del 70 %» de las denuncias
 * (Superintendencia de Educación), «más del 60 %» de padres con ansiedad percibida, «más del 80 %» de
 * preocupación por seguridad, y el resto de datos de la columna «Realidad en Chile», y el 92 % de aprobación promedio.
 * Cada miedo guarda su dato en `dato`, para actualizarlo o citarlo con su fuente exacta sin tocar el componente.
 */
export interface Miedo {
  id: string;
  corto: string;
  titulo: string;
  dato: string;
  cifra?: string;
  anguloA: string;
  anguloB: string;
  solucion: string;
  motor?: string;
}

export const MIEDOS: readonly Miedo[] = [
  {
    id: "bullying",
    corto: "Bullying y violencia",
    titulo: "Bullying, violencia y ciberacoso",
    cifra: "> 70 %",
    dato: "de las denuncias en la Superintendencia de Educación son por maltrato y convivencia escolar.",
    anguloA: "El dolor de ver a tu hijo sufrir y que el colegio se quede en reuniones y protocolos que no cambian nada.",
    anguloB: "Cómo el miedo a las burlas o a la exclusión bloquea su mente e impide que aprenda.",
    solucion: "Entorno 100 % online, asincrónico y seguro en casa, donde recupera su autoestima y vuelve a sonreír.",
  },
  {
    id: "salud-mental",
    corto: "Ansiedad y estrés",
    titulo: "Salud mental, ansiedad y estrés escolar",
    cifra: "> 60 %",
    dato: "de los padres percibe ansiedad, estrés o somatización escolar en sus hijos.",
    anguloA: "El dolor de estómago los domingos en la noche, el insomnio o la angustia antes de ir al colegio.",
    anguloB: "El bloqueo emocional frente a pruebas tradicionales por la presión tóxica de la sala.",
    solucion:
      "Estudio sin timbres ni gritos, a su propio ritmo. Con Umbral™, el alumno avanza superando actividades formativas e internas al 70 % de exigencia paso a paso, ganando ritmo y seguridad real sin terror escénico.",
    motor: "Umbral™",
  },
  {
    id: "seguridad",
    corto: "Seguridad y trayectos",
    titulo: "Inseguridad en los trayectos y malas influencias",
    cifra: "> 80 %",
    dato: "de preocupación nacional por seguridad en calles, transporte público y riesgos a la salida de clases.",
    anguloA: "La intranquilidad diaria desde que sale en la mañana hasta que vuelve a oscuras en la tarde.",
    anguloB: "El temor a las malas juntas, peleas o presiones de grupo en el paso a 7° Básico y Enseñanza Media.",
    solucion: "Educación de excelencia sin salir de la seguridad de tu hogar y tardes libres para compartir con amigos sanos en el deporte o en sus pasiones.",
  },
  {
    id: "vacios",
    corto: "Vacíos y clases perdidas",
    titulo: "Vacíos de aprendizaje y pérdida de clases",
    dato: "Brechas severas en Comprensión Lectora y Matemática por rotación de profesores, licencias y clases interrumpidas.",
    anguloA: "Que pase de curso por inercia pero llegue a 4° Medio o a la universidad lleno de lagunas.",
    anguloB: "Meses perdidos cuando faltan profesores o se suspenden clases en el colegio presencial.",
    solucion:
      "Continuidad 24/7 todo el año con Sókra™ y exigencia interna del 70 % en Umbral™ para pasar cada contenido (superando el 60 % que pide el MINEDUC), logrando que el 92 % promedio de nuestros inscritos apruebe sus exámenes.",
    motor: "Umbral™ y Sókra™",
  },
  {
    id: "neurodivergencia",
    corto: "Neurodivergencia",
    titulo: "Incomprensión y exclusión de hijos neurodivergentes (TDAH, TEA, DEA)",
    dato: "Aumento sostenido de denuncias por falta de adaptación real en salas con 35 a 45 alumnos.",
    anguloA: "El cansancio de recibir llamadas semanales de inspectoría porque «no se adapta a la sala».",
    anguloB: "Cuando la inclusión queda solo en el papel porque un profesor no da abasto con cuarenta niños.",
    solucion: "Nuestro sistema Brújula™ adapta el ritmo y la ruta de aprendizaje sin etiquetas, explicándole con paciencia infinita hasta que logra dominar cada tema.",
    motor: "Brújula™",
  },
  {
    id: "tombola",
    corto: "La tómbola (SAE)",
    titulo: "La incertidumbre de la «tómbola» y no poder elegir",
    dato: "Miles de familias sufren cada año por el sorteo escolar o por no tener colegios confiables en su comuna.",
    anguloA: "Sentir que la educación y el ambiente de tu hijo dependen del azar de una lista de espera.",
    anguloB: "Mirar los colegios cercanos a tu casa y que ninguno te dé tranquilidad.",
    solucion: "Matrícula directa, sin sorteos ni barreras geográficas, desde cualquier lugar de Chile.",
  },
  {
    id: "economia",
    corto: "Gastos de marzo",
    titulo: "El agobio económico de marzo y los gastos ocultos",
    dato: "El gasto en furgón escolar, uniformes exclusivos, listas de útiles y clases particulares dispara el endeudamiento familiar.",
    anguloA: "Pagar mensualidad, furgón y uniformes para terminar pagando además un profesor particular en la tarde.",
    anguloB: "Endeudarse en marzo en ropa escolar y materiales que no mejoran su aprendizaje.",
    solucion: "Cero gasto en locomoción o uniformes, y tutoría inteligente 24/7 incluida para que aprenda todo dentro de la plataforma.",
  },
];

export interface Motor {
  id: string;
  nombre: string;
  lema: string;
  descripcion: string;
}

export const MOTORES: readonly Motor[] = [
  { id: "umbral", nombre: "Umbral™", lema: "Dominio garantizado", descripcion: "Avance por maestría (70 % de exigencia en cada contenido): cero vacíos académicos de un año a otro." },
  {
    id: "sokra",
    nombre: "Sókra™",
    lema: "Tutoría socrática 24/7",
    descripcion: "Inteligencia artificial pedagógica que no regala la respuesta, sino que guía a tu hijo paso a paso hasta que comprende de verdad.",
  },
  {
    id: "brujula",
    nombre: "Brújula™",
    lema: "Adaptación neuroafirmativa",
    descripcion: "Personalización del ritmo, formato y carga sensorial para que cada mente brille sin etiquetas.",
  },
  {
    id: "vortice",
    nombre: "Vórtice™",
    lema: "Alineación curricular y simulacros",
    descripcion: "Precisión quirúrgica sobre los temarios oficiales del MINEDUC y preparación exacta para los Exámenes Libres.",
  },
];

export interface LimitesCalculadora {
  id: "furgon" | "uniformes" | "particulares" | "traslado";
  etiqueta: string;
  ayuda: string;
  min: number;
  max: number;
  paso: number;
  inicial: number;
  unidad: "clp-mes" | "clp-anio" | "horas-dia";
}

export const CONTROLES_CALCULADORA: readonly LimitesCalculadora[] = [
  { id: "furgon", etiqueta: "Furgón escolar o transporte", ayuda: "Gasto mensual", min: 0, max: 150000, paso: 5000, inicial: 60000, unidad: "clp-mes" },
  { id: "uniformes", etiqueta: "Uniformes, calzado y lista de útiles", ayuda: "Gasto anual", min: 50000, max: 600000, paso: 10000, inicial: 250000, unidad: "clp-anio" },
  { id: "particulares", etiqueta: "Profesores particulares o psicopedagogos externos", ayuda: "Gasto mensual", min: 0, max: 160000, paso: 5000, inicial: 40000, unidad: "clp-mes" },
  { id: "traslado", etiqueta: "Horas diarias en traslados", ayuda: "Ida y vuelta, por día", min: 0.5, max: 3, paso: 0.25, inicial: 1.5, unidad: "horas-dia" },
];

/** Supuestos de la calculadora (se muestran a la familia, no se esconden). */
export const MESES_LECTIVOS = 10;
export const DIAS_LECTIVOS = 190;
