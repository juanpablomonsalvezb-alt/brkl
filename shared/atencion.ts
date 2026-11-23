// Atención por inactividad: lógica pura para decidir cuándo avisar al estudiante
// y cuándo notificar al apoderado. No envía correos ni toca la base de datos.
// Principio: informar, no presionar. Nada de culpa, rachas ni urgencia.
import { momentoChile } from "./notificaciones";

export const UMBRAL_AVISO_ESTUDIANTE_DIAS = 3;
export const UMBRAL_ATENCION_DIAS = 5;

export type NivelAtencion = "al_dia" | "aviso_estudiante" | "atencion";

/**
 * Calcula los días civiles de Chile sin actividad.
 * @param ahora instante actual.
 * @param ultimaActividad última actividad del estudiante (null si nunca hubo).
 * @param desde fecha desde la que el contenido está disponible para el estudiante
 *   (null si aún no hay contenido disponible).
 * @returns días sin actividad, o null si no se puede medir.
 */
export function diasSinActividad(
  ahora: Date,
  ultimaActividad: Date | null,
  desde: Date | null,
): number | null {
  // Sin contenido disponible → no se mide.
  if (desde === null) return null;

  // La referencia es ultimaActividad si existe y no es anterior a `desde`;
  // en cualquier otro caso es `desde`.
  const referencia =
    ultimaActividad !== null && ultimaActividad.getTime() >= desde.getTime()
      ? ultimaActividad
      : desde;

  // Días civiles de Chile: convierte ambas fechas a AAAA-MM-DD y resta como UTC puro.
  const fechaAhora = momentoChile(ahora).fecha;
  const fechaRef = momentoChile(referencia).fecha;
  const a = Date.UTC(
    Number(fechaAhora.slice(0, 4)),
    Number(fechaAhora.slice(5, 7)) - 1,
    Number(fechaAhora.slice(8, 10)),
  );
  const b = Date.UTC(
    Number(fechaRef.slice(0, 4)),
    Number(fechaRef.slice(5, 7)) - 1,
    Number(fechaRef.slice(8, 10)),
  );
  const diff = Math.round((a - b) / 86_400_000);
  return Math.max(0, diff);
}

/**
 * Determina el nivel de atención según los días sin actividad.
 */
export function nivelDeAtencion(dias: number | null): NivelAtencion {
  if (dias === null || dias < UMBRAL_AVISO_ESTUDIANTE_DIAS) return "al_dia";
  if (dias < UMBRAL_ATENCION_DIAS) return "aviso_estudiante";
  return "atencion";
}
