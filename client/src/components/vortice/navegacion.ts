export interface ItemNav { id: string; texto: string; href: string; }
export const NAV_ESTUDIANTE: ItemNav[] = [
  { id: "inicio", texto: "Inicio", href: "/vortice" },
  { id: "aula", texto: "Aula", href: "/vortice/aula" },
  { id: "saber", texto: "Lo que sé", href: "/vortice/conocimientos" },
  { id: "semana", texto: "Mi semana", href: "/vortice#brujula" },
  { id: "ano", texto: "Mi año", href: "/vortice/mi-ano" },
  { id: "portafolio", texto: "Portafolio", href: "/vortice#portafolio" },
  { id: "tutor-virtual", texto: "Tutor virtual", href: "/academic-copilot" },
  { id: "together", texto: "Together", href: "/together" },
];
export const BARRA_ESTUDIANTE = ["inicio", "aula", "saber", "semana"];
export const NAV_FAMILIA: ItemNav[] = [
  { id: "resumen", texto: "Resumen", href: "/familia#resumen" },
  { id: "asignaturas", texto: "Asignaturas", href: "/familia#asignaturas" },
  { id: "evaluaciones", texto: "Evaluaciones", href: "/familia#evaluaciones" },
];