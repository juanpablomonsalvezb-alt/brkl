/**
 * Contenido de /por-que-barkley: los siete miedos de las familias chilenas y cómo los resuelve Barkley.
 *
 * CIFRAS NACIONALES QUE DEBE RESPALDAR LA DIRECCIÓN ANTES DE PUBLICAR EN PRODUCCIÓN
 * (vienen de la especificación del equipo; el código no las puede verificar): «más del 70 %» de las denuncias
 * (Superintendencia de Educación), «más del 60 %» de padres con ansiedad percibida, «más del 80 %» de
 * preocupación por seguridad, y el resto de datos de la columna «Realidad en Chile».
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
    titulo: "Bullying, violencia y convivencia escolar",
    cifra: "> 70 %",
    dato: "de las denuncias en la Superintendencia de Educación son por maltrato físico o psicológico y problemas de convivencia escolar.",
    anguloA: "La impotencia de pedir ayuda en el colegio y que todo quede en reuniones y protocolos que no cambian nada mientras tu hijo sufre.",
    anguloB: "Cuando un niño entra a clases con miedo a las burlas o a la exclusión, su cerebro se bloquea y es imposible que aprenda.",
    solucion:
      "Entorno 100 % online, asincrónico y seguro desde casa. Cero maltrato, cero humillaciones y acompañamiento positivo que le devuelve la sonrisa y la confianza para aprender.",
  },
  {
    id: "salud-mental",
    corto: "Ansiedad y estrés",
    titulo: "Salud mental, ansiedad y estrés escolar",
    cifra: "> 60 %",
    dato: "de los padres chilenos percibe síntomas de ansiedad, desmotivación o somatización asociados al colegio post-pandemia.",
    anguloA: "El dolor de estómago los domingos en la noche, el insomnio o el llanto antes de entrar a clases.",
    anguloB: "Estudiar toda la semana y bloquearse en una prueba de una hora por la presión tóxica del sistema tradicional.",
    solucion:
      "Un modelo sin timbres ni gritos, a su propio ritmo. Con Umbral™, tu hijo avanza por progreso diario y dominio real, cambiando el miedo a las pruebas por confianza genuina.",
    motor: "Umbral™",
  },
  {
    id: "seguridad",
    corto: "Seguridad y trayectos",
    titulo: "Inseguridad en trayectos y malas influencias",
    cifra: "> 80 %",
    dato: "de preocupación nacional por seguridad ciudadana: robos a la salida de clases, transporte público y exposición temprana a drogas o peleas.",
    anguloA: "Quedar con el corazón en la mano desde que tu hijo sale en la mañana a tomar la micro hasta que regresa a oscuras.",
    anguloB: "El temor en el paso a 7° Básico y Media por las malas juntas y presiones de grupo fuera de la sala.",
    solucion:
      "Colegio de vanguardia directo en la seguridad de tu hogar. Cero traslados peligrosos en la calle y tardes libres para socializar en entornos sanos (deporte, música, familia).",
  },
  {
    id: "vacios",
    corto: "Vacíos y clases perdidas",
    titulo: "Vacíos de aprendizaje y pérdida de clases",
    dato: "Brechas críticas en Comprensión Lectora y Matemática en diagnósticos nacionales, agravadas por rotación docente y paros.",
    anguloA: "El miedo silencioso a que pase de curso con notas infladas pero llegue a 4° Medio o a la PAES lleno de lagunas.",
    anguloB: "Meses perdidos por licencias médicas de profesores, cambios de docentes o suspensiones de clases.",
    solucion:
      "Con Umbral™ ningún alumno avanza con vacíos (requiere dominio verificado para desbloquear el siguiente módulo), con Sókra™ tiene tutoría activa las 24 horas los 365 días del año y cuenta con el respaldo de una tasa de aprobación que ha superado el 92 % entre 2023 y 2025.",
    motor: "Umbral™ y Sókra™",
  },
  {
    id: "neurodivergencia",
    corto: "Neurodivergencia",
    titulo: "Exclusión o incomprensión de hijos neurodivergentes (TDAH, TEA, DEA)",
    dato: "Alza sostenida de denuncias por falta de adecuaciones reales en salas sobrepobladas de 35 a 45 alumnos.",
    anguloA: "El miedo a que suene el teléfono con otra citación de inspectoría etiquetando a tu hijo como «el niño problema» porque la sala lo sobreestimula.",
    anguloB: "Colegios que prometen inclusión en marzo, pero en la práctica el profesor no da abasto y tu hijo pierde su autoestima.",
    solucion:
      "Nuestro sistema Brújula™ diseña una ruta neuroafirmativa y a su medida, respetando sus tiempos sensoriales, mientras nuestra IA le explica con paciencia infinita de diez formas distintas hasta que triunfe.",
    motor: "Brújula™",
  },
  {
    id: "tombola",
    corto: "La tómbola (SAE)",
    titulo: "Incertidumbre de la «tómbola» (SAE) y falta de colegios confiables cerca",
    dato: "Miles de familias cada año quedan sin cupo en sus colegios de preferencia o dependen de un sorteo aleatorio.",
    anguloA: "Sentir que el futuro y los valores de tu hijo dependen del azar de una tómbola o de listas de espera eternas.",
    anguloB: "Mirar los colegios de tu comuna y que ninguno te dé confianza, ni académica ni en su ambiente.",
    solucion:
      "Matrícula directa, sin sorteos ni barreras geográficas. Tú recuperas el derecho a elegir hoy mismo una educación de excelencia desde casa, vivas donde vivas en Chile.",
  },
  {
    id: "economia",
    corto: "Gastos de marzo",
    titulo: "Agobio económico de marzo y gastos ocultos",
    dato: "El gasto escolar presencial (mensualidades en UF, furgón escolar, uniformes exclusivos y listas de útiles) es una de las mayores causas de endeudamiento familiar en marzo.",
    anguloA: "Pagar colegio, furgón y uniformes carísimos, para que a mitad de semestre igual tengas que pagar un profesor particular porque no entendió en clases.",
    anguloB: "Endeudarse en marzo en ropa escolar y textos que no hacen que tu hijo aprenda mejor.",
    solucion:
      "Inversión inteligente en lo que sí educa: 0 gasto en furgón escolar, 0 gasto en uniformes o útiles redundantes, y tutoría inteligente 24/7 incluida para que nunca más pagues clases particulares.",
  },
];

export interface Motor {
  id: string;
  nombre: string;
  lema: string;
  descripcion: string;
}

export const MOTORES: readonly Motor[] = [
  { id: "umbral", nombre: "Umbral™", lema: "Dominio garantizado", descripcion: "Avance por maestría (80 % o más): cero vacíos académicos de un año a otro." },
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
