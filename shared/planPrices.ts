// Catálogo de planes y precios (CLP, IVA incluido). Única fuente para el formulario de reserva
// y para el servidor, que calcula el monto del pago desde aquí y nunca desde el cliente.
// Plan escolar (Básica, Media I y Media II): decisión del sostenedor 2026-11-21. Un mismo precio para los tres.
// Lista anual tachada $490.000; pago único del año con 15 % de descuento ($416.500);
// o plan mensual de 7 pagos de $70.000 de marzo a septiembre (octubre sin cobro mensual es intencional).
export const PLAN_ESCOLAR = {
  mensual: 70_000,
  mesesMensual: 7,
  listaAnual: 490_000,
  descuentoPct: 15,
  pagoUnico: 416_500,
  ahorro: 73_500,
} as const;

export const FLOW_PLAN_ESCOLAR_MENSUAL_ID = "brkl_escolar_2027_mensual_7" as const;

export type ModalidadCobro = "unico" | "mensual";

export interface PlanCatalogOption {
  value: string;
  label: string;
  price: string;
  billingType?: "once" | "monthly";
  months?: number;
}

export interface DetalleCobroPlan {
  modalidad: ModalidadCobro;
  monto: number;
  cuotas: number;
  flowPlanId: string | null;
}

const clp = (n: number) => "$" + n.toLocaleString("es-CL");
const ETIQUETA_ESCOLAR = `Plan Completo (Plataforma + IA + Mentor), pago único del año: ${clp(PLAN_ESCOLAR.pagoUnico)} (lista ${clp(PLAN_ESCOLAR.listaAnual)}, ahorras ${clp(PLAN_ESCOLAR.ahorro)})`;
const ETIQUETA_ESCOLAR_MENSUAL = `Plan Completo (Plataforma + IA + Mentor), mensual: ${clp(PLAN_ESCOLAR.mensual)} / mes × ${PLAN_ESCOLAR.mesesMensual} pagos (marzo a septiembre)`;

export const plansByGroup: Record<string, PlanCatalogOption[]> = {
  basica: [
    { value: "basica_plan", label: ETIQUETA_ESCOLAR, price: clp(PLAN_ESCOLAR.pagoUnico), billingType: "once", months: 1 },
    { value: "basica_plan_mensual", label: ETIQUETA_ESCOLAR_MENSUAL, price: clp(PLAN_ESCOLAR.mensual), billingType: "monthly", months: PLAN_ESCOLAR.mesesMensual },
  ],
  media1: [
    { value: "media1_plan", label: ETIQUETA_ESCOLAR, price: clp(PLAN_ESCOLAR.pagoUnico), billingType: "once", months: 1 },
    { value: "media1_plan_mensual", label: ETIQUETA_ESCOLAR_MENSUAL, price: clp(PLAN_ESCOLAR.mensual), billingType: "monthly", months: PLAN_ESCOLAR.mesesMensual },
  ],
  media2: [
    { value: "media2_plan", label: ETIQUETA_ESCOLAR, price: clp(PLAN_ESCOLAR.pagoUnico), billingType: "once", months: 1 },
    { value: "media2_plan_mensual", label: ETIQUETA_ESCOLAR_MENSUAL, price: clp(PLAN_ESCOLAR.mensual), billingType: "monthly", months: PLAN_ESCOLAR.mesesMensual },
  ],
  adultos_basica: [
    { value: "adultos_basica", label: "Plan Básica (1° a 8° Básico) - $360.000", price: "$360.000" },
    { value: "adultos_basica_mentor", label: "Plan Básica (1° a 8° Básico) + Mentor - $588.480", price: "$588.480" },
  ],
  adultos_media1: [
    { value: "adultos_media1", label: "Plan Media I (1° y 2° Medio) - $400.000", price: "$400.000" },
    { value: "adultos_media1_mentor", label: "Plan Media I (1° y 2° Medio) + Mentor - $628.480", price: "$628.480" },
  ],
  adultos_media2: [
    { value: "adultos_media2", label: "Plan Media II (3° y 4° Medio) - $440.000", price: "$440.000" },
    { value: "adultos_media2_mentor", label: "Plan Media II (3° y 4° Medio) + Mentor - $668.480", price: "$668.480" },
  ],
  paes: [
    { value: "paes_lenguaje", label: "Lenguaje - $200.000", price: "$200.000" },
    { value: "paes_matematica", label: "Matemática (M1) - $200.000", price: "$200.000" },
    { value: "paes_matematica2", label: "Matemática 2 (M2) - $240.000", price: "$240.000" },
    { value: "paes_historia", label: "Historia y Ciencias Sociales - $160.000", price: "$160.000" },
    { value: "paes_ciencias", label: "Ciencias - $160.000", price: "$160.000" },
  ],
};

const precio = (p: string) => parseInt(p.replace(/\D/g, ""), 10);
const PRECIO_POR_PLAN = new Map(Object.values(plansByGroup).flat().map((p) => [p.value, precio(p.price)]));
const PLANES_MENSUALES = new Set(["basica_plan_mensual", "media1_plan_mensual", "media2_plan_mensual"]);

/**
 * Resuelve la modalidad de cobro, monto por cuota, cantidad de cuotas y plan en Flow.
 * Los planes mensuales no se mezclan con otros planes; PAES admite múltiples asignaturas separadas por coma.
 */
export function detalleCobroPlan(selectedPlan: string | null | undefined): DetalleCobroPlan | null {
  const planes = (selectedPlan ?? "").split(",").map((p) => p.trim()).filter(Boolean);
  if (!planes.length) return null;

  if (planes.some((p) => PLANES_MENSUALES.has(p))) {
    if (planes.length !== 1) return null;
    return {
      modalidad: "mensual",
      monto: PLAN_ESCOLAR.mensual,
      cuotas: PLAN_ESCOLAR.mesesMensual,
      flowPlanId: FLOW_PLAN_ESCOLAR_MENSUAL_ID,
    };
  }

  let total = 0;
  for (const p of planes) {
    const monto = PRECIO_POR_PLAN.get(p);
    if (monto === undefined) return null;
    total += monto;
  }
  return {
    modalidad: "unico",
    monto: total,
    cuotas: 1,
    flowPlanId: null,
  };
}

/**
 * Monto a cobrar por el plan guardado en la reserva. PAES admite varias asignaturas separadas por
 * coma (se suman). Devuelve null si algún plan no existe: el pago no debe crearse.
 */
export function montoDelPlan(selectedPlan: string | null | undefined): number | null {
  return detalleCobroPlan(selectedPlan)?.monto ?? null;
}
