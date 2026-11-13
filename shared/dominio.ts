// Determinación del dominio por contenido (IMP-011). Función pura y determinista.
// Diseño: 05 §2 y 03 §6–§9 (3e5c488). K6 (COMUNICADO): dos respuestas correctas en familias
// distintas. N18 = A (DECIDIDA, 2026-11-08). Los demás comportamientos dependen de la política
// (shared/politica.ts), sin valores por omisión.
//
// Límites de responsabilidad:
// - Recibe evidencia YA LIBERADA: el tipo `EvidenciaLiberada` (shared/evidencia.ts, IMP-012) solo lo
//   produce el filtro único (server/conocimiento.ts, IMP-032), que aplica la publicación (P19-E1). Esta
//   función no sabe de publicación.
// - No escribe nada ni lee el reloj: el orden sale de (ocurrida, secuencia), que fija el servidor.
// - El estado de un contenido nunca cambia resultados de evaluación (dos canales, 01 §2.1).
import type { EvidenciaLiberada } from "./evidencia";
import { esPoliticaEjecutable, K6_FAMILIAS, type PoliticaEjecutable } from "./politica";

// Fuentes de evidencia admitidas (04 §5.5). Una corrección docente no es fuente (N19, TK12).
export const FUENTES = ["practica", "retencion", "evaluacion_practica", "evaluacion_cierre", "recuperacion"] as const;
export type Fuente = (typeof FUENTES)[number];

export interface Evidencia {
  id: string;
  familia: string;
  correcta: boolean;
  /** Ayuda ofrecida por la práctica (assistance ≠ ninguna). No es ajuste de accesibilidad. */
  conAyuda: boolean;
  sesion: string;
  /** study_day, fecha de Chile. */
  dia: string;
  /** occurred_at en segundos; para evidencia embargada, su fecha efectiva de publicación. */
  ocurrida: number;
  /** sequence_no del servidor, único por estudiante. */
  secuencia: number;
  fuente: Fuente;
  /** item_version_id con que se interpretó. */
  versionContenido: string;
  anulada: boolean;
  /** Familia retirada sin defecto (N17). Una retirada por defecto es una anulación. */
  familiaRetirada: boolean;
}

export interface ContextoVersion {
  versionActual: string;
  /** Versiones anteriores declaradas `compatible` por una persona. Las demás son `ruptura`. */
  compatibles: readonly string[];
  /** La agenda de retención venció para este contenido. */
  retencionVencida: boolean;
}

export type Estado = "sin_evidencia" | "incierto" | "dominado" | "no_dominado";
export type Motivo = "pocas_evidencias" | "solo_con_ayuda" | "contradictoria" | "ruptura";
export interface EstadoContenido {
  estado: Estado;
  marca: "por_comprobar" | null;
  motivo: Motivo | null;
}

// N18 = A (decisión A-1, 2026-11-11): tras una ruptura, dos familias erradas en la versión nueva.
export const N18_FAMILIAS_ERRADAS = 2;

const posterior = (a: number, b: number) => a > b; // por posición en el orden total
// ponytail: indexOf dentro de bucles es O(n²) por contenido; basta para decenas de evidencias por
// estudiante y contenido. Indexar posiciones si D8 o la proyección (H3) lo muestran lento.

function calcular(e: Evidencia[], pol: PoliticaEjecutable, retencionVencida: boolean, heredado: boolean): EstadoContenido {
  if (!e.length && !heredado) return { estado: "sin_evidencia", marca: null, motivo: null };

  const validas = pol.assisted_counts ? e : e.filter((x) => !x.conAyuda);
  const separados = (a: Evidencia, b: Evidencia) =>
    pol.k6_separation === "ninguna" || (pol.k6_separation === "sesion" ? a.sesion !== b.sesion : a.dia !== b.dia);

  // K6: primer acierto que, con un acierto anterior de otra familia y separado según O2, completa 2.
  let dominio = -1;
  const aciertos: Evidencia[] = [];
  for (const x of validas) {
    if (!x.correcta) continue;
    if (aciertos.some((a) => a.familia !== x.familia && separados(a, x))) { dominio = e.indexOf(x); break; }
    aciertos.push(x);
  }

  // Familias erradas desde una posición: un error cuenta salvo que un acierto posterior de la misma
  // familia lo repare (escenario 3), a menos que la política diga que el error reparado sigue contando.
  // O3 decide qué aciertos con ayuda cuentan (incluso para reparar); N16, qué errores con ayuda.
  // Son independientes: con O3 = sí y N16 = no, un error con ayuda no cuenta.
  const fuenteErrores = e.filter((x) => !x.conAyuda || (x.correcta ? pol.assisted_counts : pol.wrong_with_help_counts));
  const erradas = (desde: number) => {
    const familias = new Set<string>();
    fuenteErrores.forEach((x) => {
      const i = e.indexOf(x);
      if (x.correcta || !posterior(i, desde)) return;
      const reparada = fuenteErrores.some((y) => y.familia === x.familia && y.correcta && posterior(e.indexOf(y), i));
      if (!reparada || pol.error_repaired_counts) familias.add(x.familia);
    });
    return familias.size;
  };

  if (dominio >= 0) {
    const n = erradas(dominio);
    if (n >= pol.demote_wrong_families) return { estado: "incierto", marca: null, motivo: "contradictoria" };
    return { estado: "dominado", marca: n >= 1 || retencionVencida ? "por_comprobar" : null, motivo: null };
  }
  const errores = erradas(-1);
  // N18 = A: quien dominaba la versión anterior lo conserva, con marca, hasta cumplir K6 en la nueva.
  // Decisión A-1 (2026-11-11): con ruptura, dos familias erradas en la versión nueva dan no_dominado.
  // El umbral es fijo (N18) y no depende de O1, que sigue abierta.
  if (heredado) {
    return errores >= N18_FAMILIAS_ERRADAS
      ? { estado: "no_dominado", marca: null, motivo: null }
      : { estado: "dominado", marca: "por_comprobar", motivo: "ruptura" };
  }
  if (errores >= pol.not_mastered_wrong_families) return { estado: "no_dominado", marca: null, motivo: null };
  return { estado: "incierto", marca: null, motivo: validas.length === 0 ? "solo_con_ayuda" : "pocas_evidencias" };
}

export function evaluar(evidencias: readonly EvidenciaLiberada[], ctx: ContextoVersion, pol: PoliticaEjecutable): EstadoContenido {
  if (!esPoliticaEjecutable(pol)) throw new Error("Política no ejecutable: parámetros nulos o inválidos (TK15)");
  if (pol.k6_min_families !== K6_FAMILIAS) throw new Error("K6 exige 2 familias");
  for (const x of evidencias) {
    if (!(FUENTES as readonly string[]).includes(x.fuente)) throw new Error(`Fuente de evidencia no admitida: ${x.fuente}`);
  }
  // Orden total: (ocurrida, secuencia) del servidor; el id solo desempata duplicados imposibles.
  const orden = [...evidencias].sort((a, b) => a.ocurrida - b.ocurrida || a.secuencia - b.secuencia || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  let vivas = orden.filter((x) => !x.anulada); // escenario 7: lo anulado no cuenta
  if (!pol.retired_counts) vivas = vivas.filter((x) => !x.familiaRetirada); // N17

  // N18 = A: la evidencia de versiones con ruptura nunca se suma con la vigente, ni entre versiones
  // anteriores distintas. Solo sirve para saber si una versión anterior, por sí sola, estaba dominada.
  // ponytail: sin el linaje de versiones (catálogo, H2) cada versión anterior se evalúa sola. Si dos
  // versiones anteriores eran compatibles entre sí, esto puede no heredar un dominio que las abarcaba
  // (error conservador: nunca hereda de más). Usar el linaje cuando exista `supersedes_version_id`.
  // Decisión D-2 (2026-11-11): hereda solo si la versión anterior TERMINÓ en `dominado`. Haber
  // cumplido K6 en algún momento no basta si después quedó en otro estado.
  const vigente = (v: string) => v === ctx.versionActual || ctx.compatibles.includes(v);
  const actuales = vivas.filter((x) => vigente(x.versionContenido));
  const anteriores = new Map<string, Evidencia[]>();
  for (const x of vivas) if (!vigente(x.versionContenido)) anteriores.set(x.versionContenido, [...(anteriores.get(x.versionContenido) ?? []), x]);
  const heredado = [...anteriores.values()].some((l) => calcular(l, pol, false, false).estado === "dominado");
  return calcular(actuales, pol, ctx.retencionVencida, heredado);
}
