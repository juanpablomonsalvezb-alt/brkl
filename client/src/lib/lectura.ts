import { useState } from "react";
import {
  CLAVE_LECTURA,
  LECTURA_POR_DEFECTO,
  leerLecturaGuardada,
  normalizarLectura,
  type PreferenciasLectura,
} from "@shared/lectura";

export function cargarLectura(): PreferenciasLectura {
  try {
    return leerLecturaGuardada(localStorage.getItem(CLAVE_LECTURA));
  } catch {
    return LECTURA_POR_DEFECTO;
  }
}

export function aplicarLectura(preferencias: PreferenciasLectura): void {
  const raiz = document.documentElement;
  raiz.setAttribute("data-vx-tam", preferencias.tamano);
  raiz.setAttribute("data-vx-fuente", preferencias.fuente);
  raiz.setAttribute("data-vx-contraste", preferencias.contraste);
}

export function guardarLectura(preferencias: PreferenciasLectura): void {
  try {
    localStorage.setItem(CLAVE_LECTURA, JSON.stringify(preferencias));
  } catch {
    // La preferencia se aplica aunque el almacenamiento no esté disponible.
  }
  aplicarLectura(preferencias);
}

export function useLectura(): [PreferenciasLectura, (parcial: Partial<PreferenciasLectura>) => void] {
  const [preferencias, setPreferencias] = useState(cargarLectura);

  function cambiar(parcial: Partial<PreferenciasLectura>): void {
    setPreferencias((actuales) => {
      const siguientes = normalizarLectura({ ...actuales, ...parcial });
      guardarLectura(siguientes);
      return siguientes;
    });
  }

  return [preferencias, cambiar];
}