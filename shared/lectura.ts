export const TAMANOS = ["normal", "grande", "muy-grande"] as const;
export const FUENTES = ["editorial", "legible"] as const;
export const CONTRASTES = ["normal", "alto"] as const;

export interface PreferenciasLectura {
  tamano: (typeof TAMANOS)[number];
  fuente: (typeof FUENTES)[number];
  contraste: (typeof CONTRASTES)[number];
}

export const LECTURA_POR_DEFECTO: PreferenciasLectura = {
  tamano: "normal",
  fuente: "editorial",
  contraste: "normal",
};

export const CLAVE_LECTURA = "vortice.lectura.v1";

export function normalizarLectura(valor: unknown): PreferenciasLectura {
  try {
    if (typeof valor !== "object" || valor === null || Array.isArray(valor)) {
      return { ...LECTURA_POR_DEFECTO };
    }

    const objeto = valor as Record<string, unknown>;
    const tamano = objeto.tamano;
    const fuente = objeto.fuente;
    const contraste = objeto.contraste;

    return {
      tamano: TAMANOS.includes(tamano as PreferenciasLectura["tamano"]) ? tamano as PreferenciasLectura["tamano"] : LECTURA_POR_DEFECTO.tamano,
      fuente: FUENTES.includes(fuente as PreferenciasLectura["fuente"]) ? fuente as PreferenciasLectura["fuente"] : LECTURA_POR_DEFECTO.fuente,
      contraste: CONTRASTES.includes(contraste as PreferenciasLectura["contraste"]) ? contraste as PreferenciasLectura["contraste"] : LECTURA_POR_DEFECTO.contraste,
    };
  } catch {
    return { ...LECTURA_POR_DEFECTO };
  }
}

export function leerLecturaGuardada(texto: string | null): PreferenciasLectura {
  if (texto === null) return LECTURA_POR_DEFECTO;

  try {
    return normalizarLectura(JSON.parse(texto));
  } catch {
    return LECTURA_POR_DEFECTO;
  }
}