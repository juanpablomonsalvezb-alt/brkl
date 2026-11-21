// Lógica pura de retención espaciada (M4): agenda determinista por contenido dominado,
// intervalos crecientes sin castigo por ausencia y selección de pregunta del banco de práctica.
// Puro: sin acceso a BD ni reloj del sistema (`ahora` siempre entra como parámetro en segundos UTC).
import { z } from "zod";
import { addDays, dayKey } from "./repaso";

export const INTERVALOS_RETENCION_DIAS = [3, 7, 14, 30] as const;
export const MAX_COMPROBACIONES_RETENCION = 3;

export const registrarRetencionInputSchema = z.object({
  oaId: z.string().trim().min(1).max(32),
  preguntaId: z.string().trim().min(1).max(80),
  opcionId: z.string().trim().min(1).max(32),
  clientSubmissionId: z.string().trim().min(1).max(120),
  dominioId: z.string().trim().min(1).max(80).optional(),
}).strict();

export type RegistrarRetencionInput = z.infer<typeof registrarRetencionInputSchema>;

export interface EntradaDominadoRetencion {
  itemId: string;
  code: string;
  oaId: string;
  nombre: string;
  dominadoDesdeAt: number;
}

export interface EventoRetencion {
  itemId: string;
  correcta: boolean;
  sinAyuda: boolean;
  ocurridaAt: number;
  studyDay: string;
}

export interface ItemRetencionProgramado {
  itemId: string;
  code: string;
  oaId: string;
  nombre: string;
  paso: number;
  intervaloDias: number;
  ultimoDia: string;
  proximoDia: string;
  vencida: boolean;
  diasEsperando: number;
}

export interface AgendaRetencionResultado {
  hoy: string;
  pendientes: ItemRetencionProgramado[];
  pendientesMostradas: ItemRetencionProgramado[];
  proximas: ItemRetencionProgramado[];
  vencidosIds: string[];
}

/** Convierte segundos UTC a día calendario de Chile (`YYYY-MM-DD`). */
export function diaChileDesdeSegundos(ahora: number): string {
  return dayKey(new Date(ahora * 1000));
}

function diaAUtcDias(dia: string): number {
  const [y, m, d] = dia.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function diasEntre(desdeDia: string, hastaDia: string): number {
  if (hastaDia <= desdeDia) return 0;
  return Math.max(0, diaAUtcDias(hastaDia) - diaAUtcDias(desdeDia));
}

/**
 * Calcula la agenda de retención para contenidos `dominado`.
 * Regla O8 / M4:
 * - Solo comprobaciones sin ayuda (`sinAyuda === true`) avanzan o reinician el intervalo.
 * - Acierto sube de paso (`3 -> 7 -> 14 -> 30` días) contando desde el día real de respuesta.
 * - Error reinicia a `paso = 0` (`+3` días).
 * - Los días sin estudio no castigan: el paso se conserva intacto hasta que el estudiante responda.
 */
export function calcularAgendaRetencion(params: {
  dominados: readonly EntradaDominadoRetencion[];
  historialRetencion: readonly EventoRetencion[];
  ahora: number;
}): AgendaRetencionResultado {
  const hoy = diaChileDesdeSegundos(params.ahora);
  const eventosPorItem = new Map<string, EventoRetencion[]>();
  for (const ev of params.historialRetencion) {
    if (!ev.sinAyuda) continue;
    const lista = eventosPorItem.get(ev.itemId) ?? [];
    lista.push(ev);
    eventosPorItem.set(ev.itemId, lista);
  }

  const programados: ItemRetencionProgramado[] = params.dominados.map((dom) => {
    let paso = 0;
    let ultimoDia = diaChileDesdeSegundos(dom.dominadoDesdeAt);
    let proximoDia = addDays(ultimoDia, INTERVALOS_RETENCION_DIAS[0]);

    const eventos = (eventosPorItem.get(dom.itemId) ?? [])
      .filter((ev) => ev.ocurridaAt >= dom.dominadoDesdeAt)
      .sort((a, b) => a.ocurridaAt - b.ocurridaAt);

    for (const ev of eventos) {
      if (ev.correcta) {
        paso = Math.min(paso + 1, INTERVALOS_RETENCION_DIAS.length - 1);
      } else {
        paso = 0;
      }
      ultimoDia = ev.studyDay;
      proximoDia = addDays(ev.studyDay, INTERVALOS_RETENCION_DIAS[paso]);
    }

    const intervaloDias = INTERVALOS_RETENCION_DIAS[paso];
    const vencida = proximoDia <= hoy;
    return {
      itemId: dom.itemId,
      code: dom.code,
      oaId: dom.oaId,
      nombre: dom.nombre,
      paso,
      intervaloDias,
      ultimoDia,
      proximoDia,
      vencida,
      diasEsperando: vencida ? diasEntre(proximoDia, hoy) : 0,
    };
  });

  programados.sort((a, b) =>
    a.proximoDia !== b.proximoDia
      ? a.proximoDia < b.proximoDia ? -1 : 1
      : a.code < b.code ? -1 : a.code > b.code ? 1 : 0,
  );

  const pendientes = programados.filter((p) => p.vencida);
  const proximas = programados.filter((p) => !p.vencida);

  return {
    hoy,
    pendientes,
    pendientesMostradas: pendientes.slice(0, MAX_COMPROBACIONES_RETENCION),
    proximas,
    vencidosIds: pendientes.map((p) => p.itemId),
  };
}

/**
 * Selecciona una pregunta de práctica evitando familias usadas recientemente.
 * `familiasUsadasRecientes` debe venir en orden cronológico (más antigua -> más reciente).
 */
export function seleccionarPreguntaRetencion<T extends { questionVersionId: string; familyId: string }>(
  candidatas: readonly T[],
  familiasUsadasRecientes: readonly string[],
): T | null {
  if (candidatas.length === 0) return null;
  const ultimoIndicePorFamilia = new Map<string, number>();
  familiasUsadasRecientes.forEach((famId, idx) => {
    ultimoIndicePorFamilia.set(famId, idx);
  });

  const ordenadas = [...candidatas].sort((a, b) => {
    const idxA = ultimoIndicePorFamilia.get(a.familyId) ?? -1;
    const idxB = ultimoIndicePorFamilia.get(b.familyId) ?? -1;
    if (idxA !== idxB) return idxA - idxB;
    return a.questionVersionId < b.questionVersionId
      ? -1
      : a.questionVersionId > b.questionVersionId
        ? 1
        : 0;
  });

  return ordenadas[0] ?? null;
}
