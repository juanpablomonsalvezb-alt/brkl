// Fuente única de precios. Cambiar un valor acá actualiza la home, el chat de
// ventas, la FAQ de la base, las landings estáticas, llms.txt y los JSON-LD.
//
// En HTML/texto estático y en la FAQ (editable desde /faq-admin) se escriben
// marcadores como {{precio_escolar}}; se reemplazan en el build (dist/public)
// y al servir /api/faqs. Un marcador desconocido hace fallar el build.
const BASE = {
  escolarMensual: 59990, // decisión 2026-11-28: 7 cuotas, marzo a septiembre; octubre incluido
  adultosMensual: 55000,
  matricula: 30000,
  mesesEscolar: 7, // marzo a septiembre (el año cierra el 15-oct, pero octubre no se cobra: intencional)
  mesesAdultos: 8, // marzo a octubre
  descuentoAnual: 0.10, // escolar (decisión 2026-11-28)
  descuentoAdultos: 0.15,
};

const clp = (n: number) => "$" + n.toLocaleString("es-CL").replace(/,/g, ".");

function anual(mensual: number, meses: number, descuento: number) {
  const lista = mensual * meses;
  const conDescuento = Math.round(lista * (1 - descuento));
  return { lista, conDescuento, ahorro: lista - conDescuento };
}

const escolar = anual(BASE.escolarMensual, BASE.mesesEscolar, BASE.descuentoAnual);
const adultos = anual(BASE.adultosMensual, BASE.mesesAdultos, BASE.descuentoAdultos);

export const PRECIOS = {
  escolar: clp(BASE.escolarMensual),
  escolarAnual: clp(escolar.conDescuento),
  escolarAnualLista: clp(escolar.lista),
  escolarAhorroAnual: clp(escolar.ahorro),
  escolarPagos: `${BASE.mesesEscolar} pagos, de marzo a septiembre`,
  adultos: clp(BASE.adultosMensual),
  adultosAnual: clp(adultos.conDescuento),
  adultosAhorroAnual: clp(adultos.ahorro),
  matricula: clp(BASE.matricula),
  descuentoAnual: `${Math.round(BASE.descuentoAnual * 100)}%`,
  descuentoAdultos: `${Math.round(BASE.descuentoAdultos * 100)}%`,
};

export const MARCADORES: Record<string, string> = {
  precio_escolar: PRECIOS.escolar,
  precio_escolar_numero: String(BASE.escolarMensual),
  detalle_pagos_escolar: PRECIOS.escolarPagos,
  meses_escolar: String(BASE.mesesEscolar),
  meses_adultos: String(BASE.mesesAdultos),
  precio_escolar_anual: PRECIOS.escolarAnual,
  precio_escolar_anual_lista: PRECIOS.escolarAnualLista,
  ahorro_escolar_anual: PRECIOS.escolarAhorroAnual,
  precio_adultos: PRECIOS.adultos,
  precio_adultos_numero: String(BASE.adultosMensual),
  precio_adultos_anual: PRECIOS.adultosAnual,
  ahorro_adultos_anual: PRECIOS.adultosAhorroAnual,
  matricula: PRECIOS.matricula,
  descuento_anual: PRECIOS.descuentoAnual,
  descuento_adultos: PRECIOS.descuentoAdultos,
};

const MARCADOR = /\{\{\s*([a-z_]+)\s*\}\}/g;

export function aplicarPrecios(texto: string): string {
  return texto.replace(MARCADOR, (m, clave: string) => MARCADORES[clave] ?? m);
}

export function marcadoresDesconocidos(texto: string): string[] {
  return [...texto.matchAll(MARCADOR)].map((m) => m[1]).filter((c) => !(c in MARCADORES));
}
