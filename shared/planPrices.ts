// Catálogo de planes y precios (CLP, IVA incluido). Única fuente para el formulario de reserva
// y para el servidor, que calcula el monto del pago desde aquí y nunca desde el cliente.
// Plan escolar (Básica, Media I y Media II): decisión del sostenedor 2026-11-21. Un mismo precio para los tres.
// Lista anual tachada $490.000; pago único del año con 15 % de descuento; o plan mensual de 7 meses (marzo a septiembre).
// Hoy el servidor cobra solo el pago único. El cobro mensual recurrente no está implementado: no se ofrece en el formulario.
export const PLAN_ESCOLAR = {
  mensual: 70_000,
  mesesMensual: 7,
  listaAnual: 490_000,
  descuentoPct: 15,
  pagoUnico: 416_500,
  ahorro: 73_500,
} as const;

const clp = (n: number) => "$" + n.toLocaleString("es-CL");
const ETIQUETA_ESCOLAR = `Plan Completo (Plataforma + IA + Mentor), pago único del año: ${clp(PLAN_ESCOLAR.pagoUnico)} (lista ${clp(PLAN_ESCOLAR.listaAnual)}, ahorras ${clp(PLAN_ESCOLAR.ahorro)})`;

export const plansByGroup: Record<string, Array<{ value: string; label: string; price: string }>> = {
  basica: [
    { value: "basica_plan", label: ETIQUETA_ESCOLAR, price: clp(PLAN_ESCOLAR.pagoUnico) },
  ],
  media1: [
    { value: "media1_plan", label: ETIQUETA_ESCOLAR, price: clp(PLAN_ESCOLAR.pagoUnico) },
  ],
  media2: [
    { value: "media2_plan", label: ETIQUETA_ESCOLAR, price: clp(PLAN_ESCOLAR.pagoUnico) },
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

/**
 * Monto a cobrar por el plan guardado en la reserva. PAES admite varias asignaturas separadas por
 * coma (se suman). Devuelve null si algún plan no existe: el pago no debe crearse.
 */
export function montoDelPlan(selectedPlan: string | null | undefined): number | null {
  const planes = (selectedPlan ?? "").split(",").map((p) => p.trim()).filter(Boolean);
  if (!planes.length) return null;
  let total = 0;
  for (const p of planes) {
    const monto = PRECIO_POR_PLAN.get(p);
    if (monto === undefined) return null;
    total += monto;
  }
  return total;
}
