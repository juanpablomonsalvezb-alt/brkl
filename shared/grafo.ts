// Validación técnica del grafo de prerrequisitos de una versión de dominio (IMP-013, H2).
// Diseño: 02 §4 (3e5c488). Al publicar: sin ciclos, sin referencias a contenidos fuera de la
// versión, sin contenidos inalcanzables y sin aristas sin validador. En etapa 1, `alternativa`
// no se publica (K8 es etapa 2). La validación pedagógica es humana; esto solo valida la forma.
// Función pura y determinista: el orden topológico se desempata por `code`.

export const RELACIONES = ["necesaria", "contributiva", "alternativa"] as const;
export type Relacion = (typeof RELACIONES)[number];

export interface NodoGrafo { itemId: string; code: string }
export interface AristaGrafo {
  itemId: string;
  prerequisiteItemId: string;
  relation: Relacion;
  altGroup: string | null;
  validatedBy: string | null;
}
export interface GrafoBorrador { nodos: readonly NodoGrafo[]; aristas: readonly AristaGrafo[] }

export type ErrorGrafo =
  | { tipo: "codigo_duplicado"; code: string }
  | { tipo: "referencia_externa"; itemId: string; prerequisiteItemId: string }
  | { tipo: "autorreferencia"; itemId: string }
  | { tipo: "arista_duplicada"; itemId: string; prerequisiteItemId: string }
  | { tipo: "sin_validador"; itemId: string; prerequisiteItemId: string }
  | { tipo: "alternativa_sin_grupo"; itemId: string; prerequisiteItemId: string }
  | { tipo: "alternativa_en_etapa_1"; itemId: string; prerequisiteItemId: string }
  | { tipo: "ciclo"; codes: string[] }
  | { tipo: "inalcanzable"; code: string };

export type ResultadoGrafo = { ok: true; orden: string[] } | { ok: false; errores: ErrorGrafo[] };

const porCodigo = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function validarGrafo(g: GrafoBorrador, etapa: 1 | 2): ResultadoGrafo {
  const errores: ErrorGrafo[] = [];
  const codigo = new Map<string, string>();
  const vistos = new Set<string>();
  for (const n of g.nodos) {
    if (vistos.has(n.code)) errores.push({ tipo: "codigo_duplicado", code: n.code });
    vistos.add(n.code);
    codigo.set(n.itemId, n.code);
  }

  const pares = new Set<string>();
  const validas: AristaGrafo[] = [];
  for (const a of g.aristas) {
    const par = { itemId: a.itemId, prerequisiteItemId: a.prerequisiteItemId };
    if (!codigo.has(a.itemId) || !codigo.has(a.prerequisiteItemId)) { errores.push({ tipo: "referencia_externa", ...par }); continue; }
    if (a.itemId === a.prerequisiteItemId) { errores.push({ tipo: "autorreferencia", itemId: a.itemId }); continue; }
    const clave = `${a.itemId}\u0000${a.prerequisiteItemId}`;
    if (pares.has(clave)) { errores.push({ tipo: "arista_duplicada", ...par }); continue; }
    pares.add(clave);
    if (!a.validatedBy) errores.push({ tipo: "sin_validador", ...par });
    if (a.relation === "alternativa" && !a.altGroup) errores.push({ tipo: "alternativa_sin_grupo", ...par });
    if (a.relation === "alternativa" && etapa === 1) errores.push({ tipo: "alternativa_en_etapa_1", ...par });
    validas.push(a);
  }

  // Orden topológico (Kahn): un contenido va después de todos sus prerrequisitos.
  const entrantes = new Map<string, number>();
  const sucesores = new Map<string, string[]>();
  for (const id of codigo.keys()) { entrantes.set(id, 0); sucesores.set(id, []); }
  for (const a of validas) {
    entrantes.set(a.itemId, entrantes.get(a.itemId)! + 1);
    sucesores.get(a.prerequisiteItemId)!.push(a.itemId);
  }
  const listos = [...codigo.keys()].filter((id) => entrantes.get(id) === 0).sort((x, y) => porCodigo(codigo.get(x)!, codigo.get(y)!));
  const orden: string[] = [];
  while (listos.length) {
    const id = listos.shift()!;
    orden.push(codigo.get(id)!);
    for (const s of sucesores.get(id)!) {
      entrantes.set(s, entrantes.get(s)! - 1);
      if (entrantes.get(s) === 0) { listos.push(s); listos.sort((x, y) => porCodigo(codigo.get(x)!, codigo.get(y)!)); }
    }
  }

  if (orden.length < codigo.size) {
    // Los que quedaron fuera están en un ciclo o dependen de uno (inalcanzables desde las raíces).
    const ordenados = new Set(orden);
    const fuera = new Set([...codigo.keys()].filter((id) => !ordenados.has(codigo.get(id)!)));
    const prerrequisitos = new Map<string, string[]>();
    for (const a of validas) if (fuera.has(a.itemId) && fuera.has(a.prerequisiteItemId)) {
      prerrequisitos.set(a.itemId, [...(prerrequisitos.get(a.itemId) ?? []), a.prerequisiteItemId]);
    }
    const enCiclo = new Set<string>();
    // ponytail: una búsqueda por nodo pendiente, O(V·(V+E)) solo sobre lo que quedó fuera; basta para
    // dominios de decenas de contenidos. Tarjan si un dominio llega a miles.
    for (const inicio of fuera) {
      // ¿El nodo vuelve a sí mismo siguiendo prerrequisitos dentro de `fuera`?
      const pila = [inicio];
      const visit = new Set<string>();
      while (pila.length) {
        for (const p of prerrequisitos.get(pila.pop()!) ?? []) {
          if (p === inicio) enCiclo.add(inicio);
          if (!visit.has(p)) { visit.add(p); pila.push(p); }
        }
      }
    }
    const codesCiclo = [...enCiclo].map((id) => codigo.get(id)!).sort(porCodigo);
    if (codesCiclo.length) errores.push({ tipo: "ciclo", codes: codesCiclo });
    for (const id of [...fuera].filter((id) => !enCiclo.has(id)).sort((x, y) => porCodigo(codigo.get(x)!, codigo.get(y)!))) {
      errores.push({ tipo: "inalcanzable", code: codigo.get(id)! });
    }
  }

  return errores.length ? { ok: false, errores } : { ok: true, orden };
}
