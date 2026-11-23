// Vórtice: notificaciones de aprendizaje — lógica PURA (sin base de datos ni envío).
// Decide qué correos corresponden a un usuario en un instante dado.
// Principio: informar, no presionar. Nada de rachas, culpa ni urgencia artificial:
// solo se avisa lo que se abrió hoy y un resumen semanal; si no hubo avance, no se menciona.
// Decisiones del sostenedor (2026-11-23): un estudiante inactivo recibe un aviso amable a los
// 3 días sin actividad; a los 5 días se avisa a su apoderado y pasa a la lista de atención del tutor.
// Ambos avisos vienen activados por defecto. Al apoderado solo se le envía con vínculo activo
// (eso lo garantiza el servidor).
import { z } from "zod";
import type { VorticeOverview } from "./vortice";
// Importa solo constantes numéricas de atencion.ts. No hay ciclo problemático porque
// atencion.ts importa momentoChile (una función) y este archivo importa constantes
// que se resuelven antes de que cualquier función se ejecute.
import { UMBRAL_AVISO_ESTUDIANTE_DIAS, UMBRAL_ATENCION_DIAS } from "./atencion";

// Tipos de notificación (también son las claves de preferencias y el `type` del registro).
// - evaluacionLiberada: hoy se liberó una evaluación de un módulo que el estudiante ya tiene abierto.
// - moduloAbierto: hoy, por calendario, se abrió un módulo nuevo (no se avisa cuando lo abre el propio estudiante al aprobar el anterior).
// - resumenSemanal: resumen de la semana para el estudiante (de viernes a domingo, uno por semana ISO).
// - resumenSemanalApoderado: el mismo resumen para el apoderado. Requiere un vínculo estudiante→apoderado
//   que esta rama aún no modela (los datos del apoderado solo viven en `reservations`, sin relación con `users`).
//   El tipo y su preferencia existen; el despacho lo omite hasta que exista ese vínculo.
// - recordatorioInactividad: aviso amable al estudiante cuando lleva 3 o más días sin actividad.
// - avisoInactividadApoderado: aviso al apoderado cuando el estudiante lleva 5 o más días sin actividad.
//   Por decisión del sostenedor ambos vienen activados por defecto.
export const TIPOS = ["evaluacionLiberada", "moduloAbierto", "resumenSemanal", "resumenSemanalApoderado", "recordatorioInactividad", "avisoInactividadApoderado"] as const;
export type TipoNotificacion = (typeof TIPOS)[number];
export type Preferencias = Record<TipoNotificacion, boolean>;

// Por defecto, conservadoras: solo el resumen semanal (un correo a la semana como máximo).
// Los avisos diarios se activan explícitamente; al apoderado, nunca sin consentimiento.
// Excepción: los avisos de inactividad vienen activados por defecto (decisión del sostenedor 2026-11-23).
export const PREFERENCIAS_POR_DEFECTO: Preferencias = {
  evaluacionLiberada: false,
  moduloAbierto: false,
  resumenSemanal: true,
  resumenSemanalApoderado: false,
  recordatorioInactividad: true,
  avisoInactividadApoderado: true,
};

export const actualizarPreferenciasSchema = z.object({
  evaluacionLiberada: z.boolean().optional(),
  moduloAbierto: z.boolean().optional(),
  resumenSemanal: z.boolean().optional(),
  resumenSemanalApoderado: z.boolean().optional(),
  recordatorioInactividad: z.boolean().optional(),
  avisoInactividadApoderado: z.boolean().optional(),
}).strict();

// Horario de envío, hora de Chile continental: [desde, hasta). Nada de noche ni madrugada.
export const HORARIO = { zona: "America/Santiago", desde: 9, hasta: 20 } as const;

const FORMATO_CHILE = new Intl.DateTimeFormat("en-CA", {
  timeZone: HORARIO.zona, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", hourCycle: "h23", weekday: "short",
});
const DIAS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Fecha (AAAA-MM-DD), hora (0-23) y día ISO (1 = lunes … 7 = domingo) en Chile, con horario de verano incluido.
export function momentoChile(ahora: Date) {
  const p = Object.fromEntries(FORMATO_CHILE.formatToParts(ahora).map((x) => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: Number(p.hour), diaSemana: DIAS.indexOf(p.weekday) + 1 };
}

export function dentroDeHorario(ahora: Date): boolean {
  const { hora } = momentoChile(ahora);
  return hora >= HORARIO.desde && hora < HORARIO.hasta;
}

// Semana ISO de una fecha AAAA-MM-DD: "2026-W42".
export function semanaIso(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7)); // jueves de esa semana
  const anio = t.getUTCFullYear();
  const semana = Math.ceil(((t.getTime() - Date.UTC(anio, 0, 1)) / 86400000 + 1) / 7);
  return `${anio}-W${String(semana).padStart(2, "0")}`;
}

// Clave de idempotencia: diaria para avisos, semanal para resúmenes y avisos de inactividad.
export function periodoDe(tipo: TipoNotificacion, ahora: Date): string {
  const { fecha } = momentoChile(ahora);
  const semanal = ["resumenSemanal", "resumenSemanalApoderado", "recordatorioInactividad", "avisoInactividadApoderado"].includes(tipo);
  return semanal ? semanaIso(fecha) : fecha;
}

export const claveEnvio = (tipo: TipoNotificacion, periodo: string) => `${tipo}|${periodo}`;

export interface EvaluacionNotif {
  id: string;
  titulo: string;
  liberadaEl: string; // AAAA-MM-DD según calendario
  aprobada: boolean;
}

export interface ModuloNotif {
  asignatura: string;
  titulo: string;
  abierto: boolean; // calendario + módulo anterior cerrado (mismas reglas que el acceso)
  abreEl: string; // AAAA-MM-DD según calendario
  evaluaciones: EvaluacionNotif[];
}

export interface Destinatario {
  nombre: string | null;
  email: string;
}

export interface EntradaNotificaciones {
  ahora: Date;
  estudiante: Destinatario;
  apoderado: Destinatario | null;
  preferencias: Preferencias;
  // Claves claveEnvio(tipo, periodo) ya registradas para este usuario.
  enviadas: ReadonlySet<string>;
  modulos: ModuloNotif[];
  resumen: VorticeOverview;
  // Recursos vistos + evaluaciones aprobadas en los últimos 7 días.
  avancesSemana: number;
  // Días sin actividad del estudiante (null si no se puede medir).
  diasSinActividad?: number | null;
  // Resumen cualitativo de Brújula parte 2 para el correo del apoderado (sin notas ni porcentajes de E2).
  brujulaApoderado?: {
    estadoGeneral: "al_dia" | "por_recuperar" | "adelantado" | "sin_datos";
    bloquesPlanificados: number;
    bloquesCompletados: number;
    orientacion?: string;
  };
}

export interface Notificacion {
  tipo: TipoNotificacion;
  periodo: string;
  para: string;
  asunto: string;
  lineas: string[];
}

const saludo = (d: Destinatario) => (d.nombre ? `Hola, ${d.nombre}:` : "Hola:");
const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);
const CIERRE = "Puedes elegir qué correos recibir en tus preferencias de notificaciones.";

function lineasResumen(e: EntradaNotificaciones, sujeto: "tu" | "su"): string[] {
  const lineas: string[] = [];
  if (e.avancesSemana > 0) {
    const n = e.avancesSemana;
    lineas.push(sujeto === "tu"
      ? `Esta semana avanzaste en ${n} ${plural(n, "actividad", "actividades")}. ¡Bien hecho!`
      : `Esta semana avanzó en ${n} ${plural(n, "actividad", "actividades")}.`);
  }
  const conAvance = e.resumen.subjects.filter((s) => s.percent !== null);
  if (conAvance.length) {
    lineas.push(sujeto === "tu" ? "Así va tu año:" : "Así va su año:");
    for (const s of conAvance) lineas.push(`• ${s.subjectName}: ${s.percent} %`);
  }
  const sig = e.resumen.nextStep;
  if (sig) {
    lineas.push(sujeto === "tu"
      ? `Cuando quieras seguir, tu siguiente paso es «${sig.itemTitle}» en ${sig.subjectName}.`
      : `Su siguiente paso es «${sig.itemTitle}» en ${sig.subjectName}.`);
  } else if (e.resumen.subjects.some((s) => s.waitingForRelease)) {
    lineas.push("Por ahora no hay nada pendiente: lo siguiente se abrirá según el calendario.");
  }
  if (sujeto === "su" && e.brujulaApoderado) {
    if (e.brujulaApoderado.bloquesPlanificados > 0) {
      lineas.push(`Plan semanal de estudio: ${e.brujulaApoderado.bloquesCompletados} de ${e.brujulaApoderado.bloquesPlanificados} bloques completados.`);
    }
    if (e.brujulaApoderado.orientacion) {
      lineas.push(e.brujulaApoderado.orientacion);
    }
  }
  return lineas;
}

export function planificarNotificaciones(e: EntradaNotificaciones): Notificacion[] {
  if (!dentroDeHorario(e.ahora)) return [];
  const { fecha, diaSemana } = momentoChile(e.ahora);
  const out: Notificacion[] = [];
  const corresponde = (tipo: TipoNotificacion) =>
    e.preferencias[tipo] && !e.enviadas.has(claveEnvio(tipo, periodoDe(tipo, e.ahora)));
  const agregar = (tipo: TipoNotificacion, para: Destinatario, asunto: string, cuerpo: string[]) =>
    out.push({ tipo, periodo: periodoDe(tipo, e.ahora), para: para.email, asunto, lineas: [saludo(para), ...cuerpo, ...(para === e.estudiante ? [CIERRE] : [])] });

  if (corresponde("evaluacionLiberada")) {
    const hoy = e.modulos.filter((m) => m.abierto).flatMap((m) =>
      m.evaluaciones.filter((ev) => ev.liberadaEl === fecha && !ev.aprobada).map((ev) => ({ ev, m })));
    if (hoy.length) {
      agregar("evaluacionLiberada", e.estudiante,
        plural(hoy.length, "Hay una evaluación nueva disponible", `Hay ${hoy.length} evaluaciones nuevas disponibles`),
        ["Desde hoy puedes hacer:", ...hoy.map(({ ev, m }) => `• «${ev.titulo}» (${m.asignatura})`),
          "Hazla cuando te acomode, a tu ritmo."]);
    }
  }

  if (corresponde("moduloAbierto")) {
    const abiertos = e.modulos.filter((m) => m.abierto && m.abreEl === fecha);
    if (abiertos.length) {
      agregar("moduloAbierto", e.estudiante,
        plural(abiertos.length, "Se abrió un módulo nuevo", `Se abrieron ${abiertos.length} módulos nuevos`),
        ["Desde hoy puedes empezar:", ...abiertos.map((m) => `• ${m.asignatura}: ${m.titulo}`),
          "Avanza a tu ritmo; el contenido queda disponible."]);
    }
  }

  // Resumen: de viernes a domingo (si el viernes no se pudo, sale el sábado), una vez por semana.
  const hayCursos = e.resumen.subjects.length > 0;
  if (diaSemana >= 5 && hayCursos) {
    if (corresponde("resumenSemanal")) {
      agregar("resumenSemanal", e.estudiante, "Tu semana en Barkley", lineasResumen(e, "tu"));
    }
    if (e.apoderado && corresponde("resumenSemanalApoderado")) {
      const quien = e.estudiante.nombre ?? "tu estudiante";
      agregar("resumenSemanalApoderado", e.apoderado, `La semana de ${quien} en Barkley`, lineasResumen(e, "su"));
    }
  }

  // Avisos de inactividad: usan semana ISO para no enviar más de uno por semana de cada tipo.
  const dias = e.diasSinActividad ?? null;
  const sig = e.resumen.nextStep;

  if (hayCursos && dias !== null && dias >= UMBRAL_AVISO_ESTUDIANTE_DIAS && corresponde("recordatorioInactividad")) {
    const lineasInact: string[] = [];
    lineasInact.push(`Hace ${dias} días que no avanzas en Barkley. No pasa nada: puedes retomar cuando quieras.`);
    if (sig) {
      lineasInact.push(`Tu siguiente paso es «${sig.itemTitle}» en ${sig.subjectName}.`);
    }
    lineasInact.push("Si algo se te hizo difícil, puedes pedir ayuda a tu tutor desde tu Inicio.");
    agregar("recordatorioInactividad", e.estudiante, "Te esperamos en Barkley", lineasInact);
  }

  if (e.apoderado && hayCursos && dias !== null && dias >= UMBRAL_ATENCION_DIAS && corresponde("avisoInactividadApoderado")) {
    const quien = e.estudiante.nombre ?? "tu estudiante";
    const lineasApo: string[] = [];
    lineasApo.push(`${quien} lleva ${dias} días sin actividad en Barkley.`);
    lineasApo.push('Puedes acompañarle con una pregunta simple, por ejemplo: «¿qué es lo próximo que te toca?»');
    if (sig) {
      lineasApo.push(`Su siguiente paso es «${sig.itemTitle}» en ${sig.subjectName}.`);
    }
    lineasApo.push("Si necesita apoyo, puede pedir ayuda a su tutor desde su Inicio.");
    lineasApo.push("Si prefieres no recibir estos avisos, responde a este correo.");
    agregar("avisoInactividadApoderado", e.apoderado, `${quien} lleva unos días sin avanzar en Barkley`, lineasApo);
  }

  return out;
}
