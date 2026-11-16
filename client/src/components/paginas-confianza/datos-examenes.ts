/**
 * Contenido de /examenes-libres-y-resultados (especificación corregida y calibrada).
 *
 * DOS MÉTRICAS DISTINTAS, NUNCA MEZCLAR:
 *   A) Tasa de aprobación de los inscritos en Exámenes Libres (resultado histórico): 91,2 % (2023), 92,1 % (2024), 93,4 % (2025); promedio 92 %.
 *   B) Escala de exigencia: MINEDUC pide 60 % para la nota 4,0; Barkley (Umbral™) pide 70 % para avanzar de contenido (colchón de +10 puntos).
 *
 * Cifras que debe respaldar la dirección (vienen de la especificación, el código no las puede verificar):
 * los tres resultados anuales, el promedio y el 70 % interno. El 60 % oficial sí es el estándar chileno.
 */
export const RESULTADOS = [
  { anio: 2023, valor: 91.2 },
  { anio: 2024, valor: 92.1 },
  { anio: 2025, valor: 93.4 },
] as const;
export const PROMEDIO_APROBACION = 92;
export const EXIGENCIA_MINEDUC = 60;
export const EXIGENCIA_UMBRAL = 70;
export const COLCHON = EXIGENCIA_UMBRAL - EXIGENCIA_MINEDUC;

export const pct1 = (n: number) => n.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export interface Escenario {
  id: "zoom" | "libre" | "barkley";
  etiqueta: string;
  subetiqueta: string;
  funciona: string;
  octubre: string;
  impacto?: string;
}

export const ESCENARIOS: readonly Escenario[] = [
  {
    id: "zoom",
    etiqueta: "Colegio online tradicional",
    subetiqueta: "Solo clases por Zoom",
    funciona: "El profesor avanza con el calendario aunque el alumno no haya entendido. No se exige aprobar cada contenido para pasar al siguiente.",
    octubre: "El alumno llega al examen de exigencia 60 % con lagunas acumuladas de meses anteriores.",
  },
  {
    id: "libre",
    etiqueta: "Estudio libre sin plataforma",
    subetiqueta: "Guías sueltas",
    funciona: "Sin evaluaciones formativas calibradas ni control de exigencia paso a paso.",
    octubre: "Incertidumbre total frente a la escala del 60 % del Ministerio.",
  },
  {
    id: "barkley",
    etiqueta: "Método Barkley",
    subetiqueta: "Sistema Umbral™",
    funciona:
      "Para aprobar actividades, evaluaciones formativas y evaluaciones internas, y así desbloquear el siguiente contenido, el estudiante debe superar un 70 % de exigencia.",
    impacto: "Esa exigencia del 70 % paso a paso mejora su ritmo de estudio, consolida la comprensión real y elimina vacíos en el momento.",
    octubre:
      "Cuando rinde el Examen Libre del MINEDUC, que pide 60 %, viene acostumbrado todo el año a responder al 70 %. Va sobrado de preparación y aprueba con seguridad.",
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
      "100 % enfocado en los Objetivos de Aprendizaje (OA) que mide la Validación de Estudios del MINEDUC. Actividades formativas con exigencia del 70 % que aseguran lectura comprensiva y cálculo base sin sobrecargar a la familia.",
  },
  {
    id: "basica-5-8",
    etiqueta: "5° a 8° Básico",
    detalle: "5 asignaturas",
    asignaturas: ["Lenguaje", "Matemática", "Ciencias Naturales", "Historia", "Idioma Extranjero: Inglés"],
    barkley:
      "Mapeo directo de cada indicador oficial publicado por el Ministerio. Cada unidad se valida internamente al 70 % de exigencia antes de avanzar.",
    nota: "Se suma Inglés a las cuatro troncales.",
  },
  {
    id: "media-1-4",
    etiqueta: "1° a 4° Medio",
    detalle: "Con base para la PAES",
    asignaturas: [
      "Lengua y Literatura",
      "Matemática",
      "Ciencias Naturales (Biología, Física y Química)",
      "Historia / Educación Ciudadana / Filosofía (según curso)",
      "Inglés",
    ],
    barkley:
      "Preparación exacta sobre los temarios oficiales del MINEDUC y alineación con el colegio examinador asignado, construyendo al mismo tiempo la base para la PAES.",
  },
];

export interface Fase {
  id: string;
  numero: string;
  titulo: string;
  texto: string;
}

export const FASES: readonly Fase[] = [
  {
    id: "temario",
    numero: "1",
    titulo: "Contenidos 100 % basados en el temario MINEDUC",
    texto: "Estudias exactamente las asignaturas y objetivos que evalúa el Ministerio en Exámenes Libres, sin relleno innecesario.",
  },
  {
    id: "umbral",
    numero: "2",
    titulo: "Avance progresivo con exigencia del 70 % (Umbral™)",
    texto:
      "Cada actividad y evaluación formativa interna se aprueba con un 70 % de exigencia, apoyado las 24 horas por nuestra tutoría inteligente Sókra™ para mejorar el ritmo y asegurar que cada tema quede aprendido.",
  },
  {
    id: "examinador",
    numero: "3",
    titulo: "Alineación con tu colegio examinador asignado",
    texto:
      "Cuando la Seremi asigna el establecimiento examinador y se publica el desglose específico de tu prueba, enfocamos los repasos directamente en esos indicadores.",
  },
  {
    id: "ensayos",
    numero: "4",
    titulo: "Ensayos finales y aprobación segura",
    texto:
      "Rindes simulacros calibrados al 70 % de exigencia para llegar a octubre a superar con total tranquilidad el 60 % que pide el MINEDUC.",
  },
];
