// Fuente única de precios. Cambiar un valor acá actualiza la home, el chat de
// ventas, la FAQ de la base, las landings estáticas, llms.txt y los JSON-LD.
//
// En HTML/texto estático y en la FAQ (editable desde /faq-admin) se escriben
// marcadores como {{precio_escolar}}; se reemplazan en el build (dist/public)
// y al servir /api/faqs. Un marcador desconocido hace fallar el build.
const BASE = {
  escolarMensual: 65000,
  adultosMensual: 55000,
  matricula: 30000,
  mesesDelAnio: 8, // marzo a octubre
  descuentoAnual: 0.15,
};

const clp = (n: number) => "$" + n.toLocaleString("es-CL").replace(/,/g, ".");

function anual(mensual: number) {
  const lista = mensual * BASE.mesesDelAnio;
  const conDescuento = Math.round(lista * (1 - BASE.descuentoAnual));
  return { lista, conDescuento, ahorro: lista - conDescuento };
}

const escolar = anual(BASE.escolarMensual);
const adultos = anual(BASE.adultosMensual);

export const PRECIOS = {
  escolar: clp(BASE.escolarMensual),
  escolarAnual: clp(escolar.conDescuento),
  escolarAnualLista: clp(escolar.lista),
  escolarAhorroAnual: clp(escolar.ahorro),
  adultos: clp(BASE.adultosMensual),
  adultosAnual: clp(adultos.conDescuento),
  adultosAhorroAnual: clp(adultos.ahorro),
  matricula: clp(BASE.matricula),
  descuentoAnual: `${Math.round(BASE.descuentoAnual * 100)}%`,
};

export const MARCADORES: Record<string, string> = {
  precio_escolar: PRECIOS.escolar,
  precio_escolar_numero: String(BASE.escolarMensual),
  precio_escolar_anual: PRECIOS.escolarAnual,
  precio_escolar_anual_lista: PRECIOS.escolarAnualLista,
  ahorro_escolar_anual: PRECIOS.escolarAhorroAnual,
  precio_adultos: PRECIOS.adultos,
  precio_adultos_numero: String(BASE.adultosMensual),
  precio_adultos_anual: PRECIOS.adultosAnual,
  ahorro_adultos_anual: PRECIOS.adultosAhorroAnual,
  matricula: PRECIOS.matricula,
  descuento_anual: PRECIOS.descuentoAnual,
};

const MARCADOR = /\{\{\s*([a-z_]+)\s*\}\}/g;

export function aplicarPrecios(texto: string): string {
  return texto.replace(MARCADOR, (m, clave: string) => MARCADORES[clave] ?? m);
}

export function marcadoresDesconocidos(texto: string): string[] {
  return [...texto.matchAll(MARCADOR)].map((m) => m[1]).filter((c) => !(c in MARCADORES));
}
