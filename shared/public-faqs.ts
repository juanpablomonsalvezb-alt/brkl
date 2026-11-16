import { PRECIOS } from "./precios";

// Respuestas públicas de respaldo. El FAQ remoto puede ampliarlas; nunca se
// necesita consultar datos de estudiantes para renderizar esta información.
export const PUBLIC_FAQS = [
  { id: "modalidad", question: "¿Cómo se estudia en Barkley?", answer: "Barkley ofrece preparación online y asincrónica de 1° básico a 4° medio. El contenido se estudia a tu ritmo, sin un horario fijo de clases en vivo." },
  { id: "validacion", question: "¿Quién certifica los estudios?", answer: "Barkley prepara para rendir Exámenes Libres. La validación de estudios corresponde al MINEDUC y a los establecimientos examinadores que designe; Barkley no administra esos exámenes ni entrega la certificación ministerial." },
  { id: "dominio", question: "¿Qué es el Aprendizaje por Dominio?", answer: "Las unidades avanzan en secuencia. Para desbloquear la siguiente se debe aprobar la evaluación de la anterior con al menos un 70 %." },
  { id: "precio", question: "¿Cuánto cuesta la preparación escolar?", answer: `La mensualidad escolar es ${PRECIOS.escolar}. La matrícula es ${PRECIOS.matricula}, con la promoción vigente informada en la página de admisión.` },
  { id: "inscripcion", question: "¿Quién inscribe al estudiante a Exámenes Libres?", answer: "Para menores de 18 años, el trámite lo realiza el adulto responsable ante el MINEDUC, dentro de sus plazos oficiales. La inscripción al examen es gratuita e independiente de la preparación contratada." },
  { id: "apoyos", question: "¿Barkley reemplaza terapias o tratamientos?", answer: "No. Barkley es una propuesta educativa, no un servicio clínico. Los apoyos dependen de las funciones disponibles y de las necesidades de cada estudiante; no sustituyen la atención profesional que requiera." },
];
