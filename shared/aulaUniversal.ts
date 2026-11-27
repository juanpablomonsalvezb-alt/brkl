// Tipos públicos, esquemas Zod y utilidades puras sin claves para el Aula Universal UDL.
// SEGURIDAD (M-R01 / H-01): Este módulo es compartido con `client/` y NO contiene respuestas
// correctas ni explicaciones de pauta. El catálogo con claves y los evaluadores viven en
// `server/aulaUniversalCatalogo.ts`.
import { z } from "zod";

export const PUERTAS_APRENDIZAJE = ["video", "podcast", "presentacion", "explorar"] as const;
export type PuertaAprendizaje = (typeof PUERTAS_APRENDIZAJE)[number];

export const PASOS_LECCION = ["me_ubico", "aprende", "intentalo", "comprueba"] as const;
export type PasoLeccion = (typeof PASOS_LECCION)[number];

export type OaPilotoId = "oa7" | "oa8" | "oa10" | "oa11" | "oa13";

export const guardarProgresoLeccionSchema = z.object({
  pasoActual: z.enum(PASOS_LECCION),
  tramoActual: z.number().int().min(0).max(20),
  puertaPreferida: z.enum(PUERTAS_APRENDIZAJE),
  pasoEjemploVisto: z.number().int().min(0).max(20),
  completadaPorYaLoSe: z.boolean().optional(),
}).strict();

export const diagnosticoRespuestasSchema = z.object({
  respuestas: z.record(z.string().min(1), z.string().min(1)),
}).strict();

export const procesoRespuestasSchema = z.object({
  respuestas: z.record(z.string().min(1), z.string().min(1)),
  origen: z.enum(["normal", "ya_lo_se"]).optional(),
}).strict();

export const practicaAulaRespuestaSchema = z.object({
  preguntaId: z.string().trim().min(1).max(64),
  opcionId: z.string().trim().min(1).max(16),
  usoPista: z.boolean().default(false),
  clientSubmissionId: z.string().trim().min(1).max(128).optional(),
}).strict();

export type GuardarProgresoLeccionInput = z.infer<typeof guardarProgresoLeccionSchema>;
export type PracticaAulaRespuestaInput = z.infer<typeof practicaAulaRespuestaSchema>;

export interface VocabularioItem {
  termino: string;
  definicion: string;
  ejemplo: string;
}

export interface MicroTramo {
  titulo: string;
  consigna: string;
  contenido: string;
}

export interface EjemploResuelto {
  titulo: string;
  pasos: readonly string[];
  errorFrecuente: string;
}

export interface PuertaDetalle {
  tipo: PuertaAprendizaje;
  etiqueta: string;
  duracion: string;
  descripcion: string;
  transcripcion: string;
  /** M-R06: URL de archivo multimedia real. Si es null/ausente en video, podcast o presentacion, la puerta se oculta en UI. */
  mediaUrl?: string | null;
  explorarConfig?: {
    titulo: string;
    descripcion: string;
    izqEtiqueta: string;
    izqValor: number;
    derEtiqueta: string;
    derValor: number;
  };
}

export interface TarjetaRepaso {
  frente: string;
  reverso: string;
}

export interface ApoyosLeccion {
  mapaMental: readonly { nodo: string; detalle: string }[];
  infografiaResumen: readonly string[];
  tarjetas: readonly TarjetaRepaso[];
}

export interface AlternativaItem {
  id: string;
  texto: string;
}

export interface EjercicioConPistasPublico {
  id: string;
  enunciado: string;
  alternativas: readonly AlternativaItem[];
  pistas: readonly [string, string, string];
}

export interface EjercicioSimplePublico {
  id: string;
  enunciado: string;
  alternativas: readonly AlternativaItem[];
}

export interface LeccionUniversalPublica {
  oaId: OaPilotoId;
  codigo: string;
  titulo: string;
  modulo: string;
  prioridad: "nucleo_examen" | "solo_nivel";
  objetivo: string;
  tiempoEstimadoMin: number;
  vocabulario: readonly VocabularioItem[];
  microTramos: readonly MicroTramo[];
  ejemploResuelto: EjemploResuelto;
  puertaSugerida: PuertaAprendizaje;
  puertas: Record<PuertaAprendizaje, PuertaDetalle>;
  apoyos: ApoyosLeccion;
  preguntaDiagnostico: EjercicioSimplePublico;
  ejerciciosPractica: readonly [EjercicioConPistasPublico, EjercicioConPistasPublico];
  ejerciciosComprobacion: readonly [EjercicioSimplePublico, EjercicioSimplePublico, EjercicioSimplePublico];
}

// Alias público para consumidores de UI sin claves.
export type EjercicioConPistas = EjercicioConPistasPublico;
export type EjercicioSimple = EjercicioSimplePublico;
export type LeccionUniversalPiloto = LeccionUniversalPublica;

/**
 * M-R06: devuelve únicamente las puertas que tienen contenido real utilizable.
 * `explorar` es un interactivo real; `video`, `podcast` y `presentacion` solo aparecen
 * cuando cuentan con un `mediaUrl` real no vacío.
 */
export function puertasDisponibles(
  leccion: Pick<LeccionUniversalPublica, "puertas">,
): PuertaAprendizaje[] {
  return PUERTAS_APRENDIZAJE.filter((tipo) => {
    if (tipo === "explorar") return true;
    const url = leccion.puertas[tipo]?.mediaUrl;
    return typeof url === "string" && url.trim().length > 0;
  });
}

/**
 * Mantiene una sola puerta principal visible en «Aprende» (preferida o sugerida)
 * entre las puertas realmente disponibles y agrupa las restantes como secundarias.
 */
export function seleccionarPuertaPrincipal(
  leccion: Pick<LeccionUniversalPublica, "puertaSugerida" | "puertas">,
  puertaPreferida?: PuertaAprendizaje,
): { principal: PuertaDetalle; secundarias: readonly PuertaDetalle[] } {
  const disponibles = puertasDisponibles(leccion);
  const lista = disponibles.length > 0 ? disponibles : (["explorar"] as PuertaAprendizaje[]);
  const elegida: PuertaAprendizaje =
    puertaPreferida && lista.includes(puertaPreferida)
      ? puertaPreferida
      : lista.includes(leccion.puertaSugerida)
        ? leccion.puertaSugerida
        : lista[0];
  const principal = leccion.puertas[elegida];
  const secundarias = lista
    .filter((tipo) => tipo !== elegida)
    .map((tipo) => leccion.puertas[tipo]);
  return { principal, secundarias };
}

/** Devuelve la pista determinista (sin IA) correspondiente al nivel pedido (1 a 3). */
export function pistaPorNivel(
  ejercicio: Pick<EjercicioConPistasPublico, "pistas">,
  nivel: 1 | 2 | 3,
): string {
  return ejercicio.pistas[nivel - 1];
}
