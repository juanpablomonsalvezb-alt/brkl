// Reconstrucción, comparación y reparación de la proyección (IMP-033, H3a). Sin acceso directo a las
// tablas de evidencia, eventos o proyección: todo pasa por server/conocimiento.ts.
// - reconstruir: solo lee; reproduce el estado desde las evidencias liberadas no anuladas (D9).
// - compararProyeccion: solo lee; lista las diferencias entre lo almacenado y lo reconstruido.
// - rehacerProyeccion: reescribe SOLO la proyección; no escribe eventos (los eventos son historia, 04 §8).
// - detectores: solo lectura, informan para revisión humana.
import type { Client } from "@libsql/client";
import {
  leerProyeccion, reconstruirEstados, reescribirProyeccion, respuestasSinEvidencia, retiradasPorDefectoSinAnular,
  type FilaProyeccion, type Reconstruido,
} from "./conocimiento";

export const reconstruir = (c: Pick<Client, "execute">, estudiante: string, ahora: number): Promise<Reconstruido> => reconstruirEstados(c, estudiante, ahora);

const CAMPOS = ["state", "flag", "uncertaintyReason", "lastEvidenceAt", "policyId", "domainVersionId", "computedThrough"] as const;
export interface Diferencia { itemId: string; campo: (typeof CAMPOS)[number] | "fila"; almacenado: unknown; reconstruido: unknown }
export interface Comparacion { iguales: boolean; politicaEjecutable: boolean; diferencias: Diferencia[]; sinContexto: string[] }

// `updated_at` queda fuera: es de control, no parte del estado.
export async function compararProyeccion(c: Pick<Client, "execute">, estudiante: string, ahora: number): Promise<Comparacion> {
  const rec = await reconstruirEstados(c, estudiante, ahora);
  const almacenadas = new Map((await leerProyeccion(c, estudiante)).map((f) => [f.itemId, f]));
  const diferencias: Diferencia[] = [];
  if (rec.politica) {
    const vistos = new Set<string>();
    for (const f of rec.filas) {
      vistos.add(f.itemId);
      const a = almacenadas.get(f.itemId);
      if (!a) { diferencias.push({ itemId: f.itemId, campo: "fila", almacenado: null, reconstruido: f.state }); continue; }
      for (const k of CAMPOS) if (a[k] !== f[k]) diferencias.push({ itemId: f.itemId, campo: k, almacenado: a[k], reconstruido: f[k] });
    }
    for (const a of almacenadas.values()) if (!vistos.has(a.itemId) && !rec.sinContexto.includes(a.itemId)) diferencias.push({ itemId: a.itemId, campo: "fila", almacenado: a.state, reconstruido: null });
  }
  return { iguales: diferencias.length === 0, politicaEjecutable: !!rec.politica, diferencias, sinContexto: rec.sinContexto };
}

// Reparación: sin política ejecutable no escribe nada.
export const rehacerProyeccion = (c: Pick<Client, "execute" | "batch">, estudiante: string, ahora: number) => reescribirProyeccion(c, estudiante, ahora);

export { respuestasSinEvidencia, retiradasPorDefectoSinAnular };
export type { FilaProyeccion };
