// Contrato de la evidencia liberada (IMP-012, H3a/D3). Solo la evidencia que pasó por el filtro único
// (server/conocimiento.ts → evidenciaLiberada) puede entrar a `evaluar`, `fronteras` y `siguiente`.
//
// El tipo lleva una marca con un símbolo que NO se exporta: fuera de este módulo no se puede escribir la
// propiedad, así que un objeto `Evidencia` común no es asignable a `EvidenciaLiberada`. Solo una conversión
// explícita (`as`) lo fuerza, y script/conocimiento.check.ts prohíbe esa conversión en el código de
// producción salvo en server/conocimiento.ts. Es un contrato de tipos: no existe en tiempo de ejecución.
import type { Evidencia } from "./dominio";

declare const liberada: unique symbol;

export type EvidenciaLiberada = Evidencia & { readonly [liberada]: true };
