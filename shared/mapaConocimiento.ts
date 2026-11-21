// Algoritmos puros de fronteras (F = externa, interna, bloqueados), estados visuales de
// «Mis conocimientos» y recomendación determinista de siguiente contenido (M2/M3).
// Puro y determinista: sin acceso a BD, sin reloj del sistema y sin marcas de evidencia privada.
import { z } from "zod";
import type { Estado, Motivo } from "./dominio";
import { validarGrafo, type Relacion } from "./grafo";

export const PRERREQUISITOS_PILOTO_MAT5_U3: ReadonlyArray<{
  oaId: "oa7" | "oa8" | "oa10" | "oa11" | "oa13";
  prereqOaId: "oa7" | "oa8" | "oa10" | "oa11" | "oa13";
  relation: Relacion;
  justification: string;
}> = [
  {
    oaId: "oa8",
    prereqOaId: "oa7",
    relation: "necesaria",
    justification: "Para trabajar fracciones impropias y números mixtos conviene dominar antes las fracciones propias.",
  },
  {
    oaId: "oa10",
    prereqOaId: "oa7",
    relation: "necesaria",
    justification: "Convertir fracciones a decimales requiere amplificar y simplificar fracciones equivalentes.",
  },
  {
    oaId: "oa11",
    prereqOaId: "oa10",
    relation: "necesaria",
    justification: "Comparar y ordenar decimales se apoya en comprender décimos, centésimos y su relación con fracciones.",
  },
  {
    oaId: "oa13",
    prereqOaId: "oa10",
    relation: "necesaria",
    justification: "Resolver problemas combinados requiere pasar con soltura entre fracciones y decimales.",
  },
  {
    oaId: "oa13",
    prereqOaId: "oa11",
    relation: "necesaria",
    justification: "Alinear decimales en suma y resta requiere comparar correctamente su valor posicional.",
  },
] as const;

export const registrarPracticaInputSchema = z.object({
  oaId: z.string().trim().min(1).max(32),
  preguntaId: z.string().trim().min(1).max(64),
  opcionId: z.string().trim().min(1).max(32),
  usoPista: z.boolean(),
  clientSubmissionId: z.string().trim().min(4).max(120),
}).strict();

export type RegistrarPracticaInput = z.infer<typeof registrarPracticaInputSchema>;

export type EstadoVisualMapa =
  | "dominado"
  | "por_comprobar"
  | "incierto"
  | "listo"
  | "no_dominado"
  | "bloqueado";

export interface NodoEntradaMapa {
  itemId: string;
  code: string;
  oaId: string;
  nombre: string;
  definicion: string;
  estado: Estado;
  marca: "por_comprobar" | null;
  motivo: Motivo | null;
}

export interface AristaMapa {
  itemId: string;
  prerequisiteItemId: string;
  relation: Relacion;
}

export interface NodoMapa extends NodoEntradaMapa {
  estadoVisual: EstadoVisualMapa;
  etiqueta: string;
  accion: string;
  disponible: boolean;
  faltantes: Array<{ itemId: string; code: string; oaId: string; nombre: string }>;
  desbloquea: string[];
  inconsistencia: boolean;
}

export interface RecomendacionMapa {
  itemId: string;
  code: string;
  oaId: string;
  nombre: string;
  tipo: "comprobar" | "reforzar" | "aprender";
  motivo: string;
}

export interface ResumenMapaConocimiento {
  dominados: number;
  porComprobar: number;
  enPractica: number;
  porReforzar: number;
  listos: number;
  bloqueados: number;
  total: number;
}

export interface MapaFronterasResultado {
  nodos: NodoMapa[];
  aristas: AristaMapa[];
  ordenTopologico: string[];
  fronteraExterna: string[];
  fronteraInterna: string[];
  bloqueados: string[];
  inconsistencias: string[];
  resumen: ResumenMapaConocimiento;
}

const porCodigoAsc = (a: { code: string }, b: { code: string }) =>
  a.code < b.code ? -1 : a.code > b.code ? 1 : 0;

/**
 * Calcula fronteras (externa, interna, bloqueados), estado visual por nodo y orden topológico
 * a partir del estado calculado por el motor (`dominado`, `incierto`, `no_dominado`, `sin_evidencia`)
 * y las aristas del grafo publicado.
 */
export function calcularFronteras(
  nodosEntrada: readonly NodoEntradaMapa[],
  aristas: readonly AristaMapa[],
): MapaFronterasResultado {
  const porId = new Map(nodosEntrada.map((n) => [n.itemId, n]));
  const gVal = validarGrafo(
    {
      nodos: nodosEntrada.map((n) => ({ itemId: n.itemId, code: n.code })),
      aristas: aristas.map((a) => ({
        itemId: a.itemId,
        prerequisiteItemId: a.prerequisiteItemId,
        relation: a.relation,
        altGroup: null,
        validatedBy: "grafo-validado",
      })),
    },
    1,
  );
  const ordenCodigos = gVal.ok
    ? gVal.orden
    : [...nodosEntrada].sort(porCodigoAsc).map((n) => n.itemId);
  const idPorCodigo = new Map(nodosEntrada.map((n) => [n.code, n.itemId]));
  const ordenTopologico = gVal.ok
    ? ordenCodigos.map((cod) => idPorCodigo.get(cod)!).filter(Boolean)
    : ordenCodigos;
  const posTopo = new Map(ordenTopologico.map((id, idx) => [id, idx]));

  const dominadosSet = new Set(
    nodosEntrada.filter((n) => n.estado === "dominado").map((n) => n.itemId),
  );

  const prereqNecesarios = new Map<string, string[]>();
  const sucesoresNecesarios = new Map<string, string[]>();
  for (const n of nodosEntrada) {
    prereqNecesarios.set(n.itemId, []);
    sucesoresNecesarios.set(n.itemId, []);
  }
  for (const a of aristas) {
    if (a.relation !== "necesaria") continue;
    if (!porId.has(a.itemId) || !porId.has(a.prerequisiteItemId)) continue;
    prereqNecesarios.get(a.itemId)!.push(a.prerequisiteItemId);
    sucesoresNecesarios.get(a.prerequisiteItemId)!.push(a.itemId);
  }

  const nodos: NodoMapa[] = [...nodosEntrada]
    .sort((a, b) => (posTopo.get(a.itemId) ?? 0) - (posTopo.get(b.itemId) ?? 0) || porCodigoAsc(a, b))
    .map((n) => {
      const reqIds = prereqNecesarios.get(n.itemId) ?? [];
      const faltantes = reqIds
        .filter((pid) => !dominadosSet.has(pid))
        .map((pid) => porId.get(pid)!)
        .sort(porCodigoAsc)
        .map((p) => ({ itemId: p.itemId, code: p.code, oaId: p.oaId, nombre: p.nombre }));

      const disponible = faltantes.length === 0;
      const inconsistencia = n.estado === "dominado" && !disponible;
      const desbloquea = [...(sucesoresNecesarios.get(n.itemId) ?? [])];

      let estadoVisual: EstadoVisualMapa;
      let etiqueta: string;
      let accion: string;

      if (n.estado === "dominado") {
        if (n.marca === "por_comprobar") {
          estadoVisual = "por_comprobar";
          etiqueta = "Vamos a comprobarlo";
          accion = "Comprobar";
        } else {
          estadoVisual = "dominado";
          etiqueta = "Lo dominas";
          accion = "Ver";
        }
      } else if (n.estado === "no_dominado") {
        estadoVisual = "no_dominado";
        etiqueta = "Lo reforzamos";
        accion = "Repasar";
      } else if (n.estado === "incierto") {
        estadoVisual = "incierto";
        etiqueta = "Sigue practicando";
        accion = "Practicar";
      } else if (disponible) {
        estadoVisual = "listo";
        etiqueta = "Listo para aprender";
        accion = "Empezar";
      } else {
        estadoVisual = "bloqueado";
        etiqueta = `Primero: ${faltantes[0].nombre}`;
        accion = "Ir a la base";
      }

      return {
        ...n,
        estadoVisual,
        etiqueta,
        accion,
        disponible,
        faltantes,
        desbloquea,
        inconsistencia,
      };
    });

  const fronteraExterna = nodos
    .filter((n) => n.estado !== "dominado" && n.disponible)
    .map((n) => n.itemId);

  const fronteraInterna = nodos
    .filter((n) => {
      if (n.estado !== "dominado") return false;
      const sucs = sucesoresNecesarios.get(n.itemId) ?? [];
      return sucs.length === 0 || sucs.some((sid) => !dominadosSet.has(sid));
    })
    .map((n) => n.itemId);

  const bloqueados = nodos
    .filter((n) => n.estado !== "dominado" && !n.disponible)
    .map((n) => n.itemId);

  const inconsistencias = nodos.filter((n) => n.inconsistencia).map((n) => n.itemId);

  const resumen: ResumenMapaConocimiento = {
    dominados: nodos.filter((n) => n.estadoVisual === "dominado").length,
    porComprobar: nodos.filter((n) => n.estadoVisual === "por_comprobar").length,
    enPractica: nodos.filter((n) => n.estadoVisual === "incierto").length,
    porReforzar: nodos.filter((n) => n.estadoVisual === "no_dominado").length,
    listos: nodos.filter((n) => n.estadoVisual === "listo").length,
    bloqueados: nodos.filter((n) => n.estadoVisual === "bloqueado").length,
    total: nodos.length,
  };

  return {
    nodos,
    aristas: [...aristas],
    ordenTopologico,
    fronteraExterna,
    fronteraInterna,
    bloqueados,
    inconsistencias,
    resumen,
  };
}

/**
 * Recomendación determinista (05 §4, reglas sin IA):
 * 1. Contenidos dominados con marca `por_comprobar` en la frontera interna.
 * 2. Contenidos `no_dominado` o `incierto` con bases disponibles.
 * 3. Frontera externa `listo` en orden topológico (desempate por código ascendente).
 * 4. Resto no dominado por código ascendente.
 */
export function recomendarSiguienteContenido(mapa: MapaFronterasResultado): RecomendacionMapa | null {
  const porId = new Map(mapa.nodos.map((n) => [n.itemId, n]));
  const internaSet = new Set(mapa.fronteraInterna);

  const porComprobarInterno = mapa.nodos
    .filter((n) => n.estadoVisual === "por_comprobar" && internaSet.has(n.itemId))
    .sort(porCodigoAsc)[0];
  if (porComprobarInterno) {
    return {
      itemId: porComprobarInterno.itemId,
      code: porComprobarInterno.code,
      oaId: porComprobarInterno.oaId,
      nombre: porComprobarInterno.nombre,
      tipo: "comprobar",
      motivo: `Te sugerimos comprobar ${porComprobarInterno.nombre} para reafirmar lo que ya sabes.`,
    };
  }

  const enProgresoDisponible = mapa.nodos.find(
    (n) => (n.estadoVisual === "no_dominado" || n.estadoVisual === "incierto") && n.disponible,
  );
  if (enProgresoDisponible) {
    const tipo = enProgresoDisponible.estadoVisual === "no_dominado" ? "reforzar" : "aprender";
    const motivo =
      enProgresoDisponible.estadoVisual === "no_dominado"
        ? `Te sugerimos reforzar ${enProgresoDisponible.nombre} con ejemplos y práctica guiada.`
        : `Te sugerimos seguir practicando ${enProgresoDisponible.nombre} sin pistas para consolidarlo.`;
    return {
      itemId: enProgresoDisponible.itemId,
      code: enProgresoDisponible.code,
      oaId: enProgresoDisponible.oaId,
      nombre: enProgresoDisponible.nombre,
      tipo,
      motivo,
    };
  }

  const listo = mapa.nodos.find((n) => n.estadoVisual === "listo");
  if (listo) {
    const bases = mapa.aristas
      .filter((a) => a.itemId === listo.itemId && a.relation === "necesaria")
      .map((a) => porId.get(a.prerequisiteItemId)?.nombre)
      .filter((x): x is string => Boolean(x));
    const motivo = bases.length
      ? `Te sugerimos ${listo.nombre} porque ya dominas ${bases.join(" y ")}.`
      : `Te sugerimos empezar por ${listo.nombre}, que es la base de este módulo.`;
    return {
      itemId: listo.itemId,
      code: listo.code,
      oaId: listo.oaId,
      nombre: listo.nombre,
      tipo: "aprender",
      motivo,
    };
  }

  const pendiente = mapa.nodos
    .filter((n) => n.estado !== "dominado")
    .sort(porCodigoAsc)[0];
  if (pendiente) {
    return {
      itemId: pendiente.itemId,
      code: pendiente.code,
      oaId: pendiente.oaId,
      nombre: pendiente.nombre,
      tipo: pendiente.estado === "no_dominado" ? "reforzar" : "aprender",
      motivo: `Te sugerimos revisar primero ${pendiente.faltantes[0]?.nombre ?? pendiente.nombre}.`,
    };
  }

  return null;
}
