/**
 * Contenido de /examenes-libres-y-resultados.
 *
 * CIFRAS QUE DEBE RESPALDAR LA DIRECCIÓN ANTES DE PUBLICAR EN PRODUCCIÓN
 * (vienen de la especificación del equipo; el código no las puede verificar):
 *   - APROBACION_MINIMA: «más de 92 %» de aprobación en Exámenes Libres, cohortes 2023, 2024 y 2025.
 *   - DOMINIO_UMBRAL: avance por dominio de 80 % a 100 % por módulo (regla de Umbral™).
 *   - COMPRENSION_ZOOM: 55 % de comprensión del colegio online tradicional (cifra ilustrativa de la especificación).
 * La exigencia oficial del 60 % para la nota 4,0 sí es el estándar chileno.
 */
export const APROBACION_MINIMA = 92;
export const ANIOS_RESULTADOS = [2023, 2024, 2025] as const;
export const EXIGENCIA_MINEDUC = 60;
export const DOMINIO_UMBRAL = { desde: 80, hasta: 100 } as const;
export const COMPRENSION_ZOOM = 55;

export interface Escenario {
  id: "zoom" | "solitario" | "barkley";
  etiqueta: string;
  subetiqueta: string;
  descripcion: string;
  riesgo: string;
  mensaje?: string;
}

export const ESCENARIOS: readonly Escenario[] = [
  {
    id: "zoom",
    etiqueta: "Colegio online tradicional",
    subetiqueta: "Clases por Zoom",
    descripcion:
      "El profesor pasa la materia al ritmo del grupo. El alumno entiende el 55 %, acumula lagunas silenciosas y llega a octubre jugándose el año al azar en una sola prueba.",
    riesgo: "Riesgo alto de reprobación o nota mínima.",
  },
  {
    id: "solitario",
    etiqueta: "Estudio solitario",
    subetiqueta: "Con guías en PDF",
    descripcion:
      "Sin retroalimentación inmediata ni control de dominio. El alumno estudia temas de relleno que no entran en el temario oficial y deja vacíos en los indicadores clave.",
    riesgo: "Nadie mide qué sabe realmente: el resultado se descubre recién en el examen.",
  },
  {
    id: "barkley",
    etiqueta: "Ecosistema Barkley",
    subetiqueta: "Sistema Umbral™",
    descripcion:
      "El alumno no puede desbloquear el módulo N+1 si no demuestra un dominio real de entre el 80 % y el 100 % en el módulo N, asistido las 24 horas por el tutor socrático Sókra™.",
    riesgo: "Cada módulo se aprueba sobre el estándar antes de avanzar.",
    mensaje:
      "Resultado comprobado (2023–2024–2025): más del 92 % de tasa de aprobación. Cuando tu hijo se sienta a rendir el Examen Libre del MINEDUC (que pide 60 %), ya lleva meses aprobando evaluaciones internas sobre el 80 %. El examen oficial se siente fácil porque entrenó en un estándar superior.",
  },
];

export interface NivelTemario {
  id: string;
  etiqueta: string;
  detalle: string;
  asignaturas: readonly string[];
  barkley: string;
  nota?: string;
}

export const NIVELES_TEMARIO: readonly NivelTemario[] = [
  {
    id: "basica-1-4",
    etiqueta: "1° a 4° Básico",
    detalle: "4 asignaturas",
    asignaturas: ["Lenguaje y Comunicación", "Matemática", "Ciencias Naturales", "Historia, Geografía y Ciencias Sociales"],
    barkley:
      "Mapeo exacto de los Objetivos de Aprendizaje (OA) nucleares del temario de Validación de Estudios, más lectoescritura y pensamiento lógico, sin sobrecarga de tareas inútiles para los padres.",
  },
  {
    id: "basica-5-8",
    etiqueta: "5° a 8° Básico",
    detalle: "5 asignaturas",
    asignaturas: ["Lenguaje y Comunicación", "Matemática", "Ciencias Naturales", "Historia, Geografía y Ciencias Sociales", "Idioma Extranjero: Inglés"],
    barkley:
      "Cobertura del 100 % de los indicadores del temario oficial del MINEDUC y nivelación automática de los vacíos arrastrados de años anteriores mediante diagnóstico adaptativo.",
    nota: "Se suma Inglés a las cuatro troncales.",
  },
  {
    id: "media-1-4",
    etiqueta: "1° a 4° Medio",
    detalle: "Con proyección a la PAES",
    asignaturas: [
      "Lengua y Literatura",
      "Matemática",
      "Ciencias Naturales (Biología, Física y Química)",
      "Historia, Educación Ciudadana y Filosofía (según nivel)",
      "Inglés",
    ],
    barkley:
      "Doble blindaje académico: preparación exacta para el temario del colegio examinador asignado y una base sólida de habilidades para la PAES y la Educación Superior.",
  },
];

export interface Fase {
  id: string;
  numero: string;
  periodo: string;
  titulo: string;
  texto: string;
}

export const FASES: readonly Fase[] = [
  {
    id: "mapeo",
    numero: "1",
    periodo: "Marzo a julio",
    titulo: "Mapeo oficial MINEDUC",
    texto:
      "El estudiante avanza a su ritmo por los módulos construidos directamente sobre las Bases Curriculares y los Temarios Oficiales del Ministerio. Cero materia de relleno.",
  },
  {
    id: "dominio",
    numero: "2",
    periodo: "Todo el año",
    titulo: "Dominio continuo con Umbral™ y Sókra™",
    texto:
      "Nadie pasa de tema con dudas. Si un concepto cuesta, nuestra IA pedagógica Sókra™ lo explica de diez formas distintas hasta lograr al menos un 80 % de dominio verificado.",
  },
  {
    id: "examinador",
    numero: "3",
    periodo: "Agosto a septiembre",
    titulo: "Ajuste quirúrgico al colegio examinador",
    texto:
      "Apenas te asignan el colegio examinador y recibes su temario específico, nuestro motor Vórtice™ alinea los repasos y ensayos exactamente a los indicadores que ese establecimiento evaluará.",
  },
  {
    id: "simulacros",
    numero: "4",
    periodo: "Octubre",
    titulo: "Simulacros oficiales y rendición segura",
    texto:
      "Tu hijo rinde ensayos cronometrados idénticos a la prueba real. Llega al día del examen tranquilo, sin ansiedad y con el respaldo de un modelo que ya ha superado el 92 % de aprobación en 2023, 2024 y 2025.",
  },
];

export const CONTEXTO_EXAMINADOR =
  "En Chile, para menores de 18 años, el MINEDUC publica el temario marco, pero la Seremi asigna un colegio examinador presencial en la comuna de la familia, y ese establecimiento entrega su propio desglose o énfasis semanas antes de la prueba. Ahí fallan otras opciones; Barkley lo convierte en ventaja.";

export interface TarjetaTransparencia {
  id: string;
  titulo: string;
  resumen: string;
  cuerpo: string;
}

export const TARJETAS_TRANSPARENCIA: readonly TarjetaTransparencia[] = [
  {
    id: "tasa",
    titulo: "Tasa de aprobación superior al 92 % (cohortes 2023, 2024 y 2025)",
    resumen: "Tres temporadas consecutivas sobre el 92 %.",
    cuerpo:
      "Nuestras tres temporadas consecutivas superaron el 92 % de aprobación en Exámenes Libres. Antes de que el alumno se presente ante el colegio examinador, medimos su Índice de Preparación Real (IPR), para saber con anticipación si está listo y no descubrirlo en octubre.",
  },
  {
    id: "dominar",
    titulo: "Diferencia entre «pasar la materia» y «dominar el temario»",
    resumen: "Entrenar sobre 80 % para superar con holgura el 60 %.",
    cuerpo:
      "Un alumno que entrena bajo la regla del 80 % o más de Umbral™ supera con holgura la barrera del 60 % (nota 4,0) que exige el MINEDUC. Pasar la materia es avanzar porque se acabó la unidad; dominar el temario es demostrar, módulo a módulo, que se entendió.",
  },
  {
    id: "panel",
    titulo: "Panel en tiempo real para apoderados",
    resumen: "El avance, todos los días, desde el celular.",
    cuerpo:
      "El papá no tiene que esperar a octubre para saber si su hijo sabe: ve el porcentaje exacto de cobertura del temario MINEDUC todos los días desde su celular.",
  },
];
