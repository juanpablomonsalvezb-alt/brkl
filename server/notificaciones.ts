// Vórtice: despacho de notificaciones de aprendizaje.
// Base de datos y transporte se inyectan para probarlo con SQLite en memoria y un transporte simulado.
import { createHash, timingSafeEqual } from "node:crypto";
import { and, count, eq, gte, inArray, isNotNull } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import { enrollments, evaluationProgress, notificationLog, notificationPreferences, studentProgress } from "@shared/schema";
import { users } from "@shared/models/auth";
import { buildOverview } from "@shared/vortice";
import {
  PREFERENCIAS_POR_DEFECTO, TIPOS, claveEnvio, dentroDeHorario, momentoChile, planificarNotificaciones, semanaIso,
  type ModuloNotif, type Notificacion, type Preferencias,
} from "@shared/notificaciones";
import { loadVorticeInput } from "./vortice";
import {
  getModuleStartDate, getEvaluation1ReleaseDate, getEvaluation2ReleaseDate, getEvaluation3ReleaseDate, getEvaluation4ReleaseDate,
} from "./calendarUtils";

type Db = LibSQLDatabase<typeof schema>;

export interface Correo {
  para: string;
  asunto: string;
  texto: string;
  html: string;
}
// Lanza si el envío falla: el despacho libera el registro para reintentar en la próxima ejecución.
export type Transporte = (correo: Correo) => Promise<void>;

// calendarUtils arma las fechas en la hora local del servidor; sus componentes locales son el día del calendario.
const diaCalendario = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const LIBERACION = [getEvaluation1ReleaseDate, getEvaluation2ReleaseDate, getEvaluation3ReleaseDate, getEvaluation4ReleaseDate];

export async function leerPreferencias(db: Db, userId: string): Promise<Preferencias> {
  const [fila] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
  if (!fila) return { ...PREFERENCIAS_POR_DEFECTO };
  return Object.fromEntries(TIPOS.map((t) => [t, fila[t]])) as Preferencias;
}

export async function guardarPreferencias(db: Db, userId: string, cambios: Partial<Preferencias>): Promise<Preferencias> {
  const prefs = { ...(await leerPreferencias(db, userId)), ...cambios };
  await db.insert(notificationPreferences).values({ userId, ...prefs, updatedAt: new Date() })
    .onConflictDoUpdate({ target: notificationPreferences.userId, set: { ...prefs, updatedAt: new Date() } });
  return prefs;
}

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function aCorreo(n: Notificacion): Correo {
  return {
    para: n.para,
    asunto: n.asunto,
    texto: n.lineas.join("\n\n"),
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#3a3a3a;line-height:1.6;">${
      n.lineas.map((l) => `<p style="margin:0 0 12px;">${escapar(l)}</p>`).join("")
    }<p style="color:#5f6156;font-size:14px;">— Barkley Online</p></div>`,
  };
}

export interface ResultadoDespacho {
  fueraDeHorario: boolean;
  usuarios: number;
  enviadas: number;
  fallidas: number;
}

// ponytail: un usuario a la vez (≈6 consultas c/u). Si el colegio crece a miles, paginar por lotes entre ejecuciones.
export async function despacharNotificaciones(db: Db, transporte: Transporte, ahora: Date): Promise<ResultadoDespacho> {
  const resultado: ResultadoDespacho = { fueraDeHorario: !dentroDeHorario(ahora), usuarios: 0, enviadas: 0, fallidas: 0 };
  if (resultado.fueraDeHorario) return resultado;

  const destinatarios = await db.selectDistinct({ id: users.id, email: users.email, firstName: users.firstName, name: users.name })
    .from(users)
    .innerJoin(enrollments, eq(enrollments.userId, users.id))
    .where(and(eq(enrollments.isActive, true), isNotNull(users.email)));

  const { fecha } = momentoChile(ahora);
  const hace7Dias = new Date(ahora.getTime() - 7 * 86400000);

  for (const u of destinatarios) {
    if (!u.email) continue;
    resultado.usuarios++;
    try {
      const preferencias = await leerPreferencias(db, u.id);
      if (!TIPOS.some((t) => preferencias[t])) continue;

      const registradas = await db.select({ type: notificationLog.type, periodKey: notificationLog.periodKey }).from(notificationLog)
        .where(and(eq(notificationLog.userId, u.id), inArray(notificationLog.periodKey, [fecha, semanaIso(fecha)])));
      const { level, input, completed, passed } = await loadVorticeInput(db, u.id, ahora);

      const modulos: ModuloNotif[] = input.flatMap((s) => s.objectives.map((o) => ({
        asignatura: s.subjectName,
        titulo: o.title,
        abierto: o.available !== false,
        abreEl: diaCalendario(getModuleStartDate(o.weekNumber)),
        evaluaciones: (o.evaluations ?? [])
          .filter((ev) => ev.evaluationNumber >= 1 && ev.evaluationNumber <= 4)
          .map((ev) => ({
            id: ev.id, titulo: ev.title, aprobada: passed.has(ev.id),
            liberadaEl: diaCalendario(LIBERACION[ev.evaluationNumber - 1](o.weekNumber)),
          })),
      })));

      const [[vistos], [aprobadas]] = await Promise.all([
        db.select({ n: count() }).from(studentProgress)
          .where(and(eq(studentProgress.userId, u.id), gte(studentProgress.completedAt, hace7Dias))),
        db.select({ n: count() }).from(evaluationProgress)
          .where(and(eq(evaluationProgress.userId, u.id), eq(evaluationProgress.passed, true), gte(evaluationProgress.completedAt, hace7Dias))),
      ]);

      const plan = planificarNotificaciones({
        ahora,
        estudiante: { nombre: u.firstName || u.name || null, email: u.email },
        // ponytail: sin modelo de vínculo estudiante→apoderado en esta rama; el resumen al apoderado queda definido pero no se envía.
        apoderado: null,
        preferencias,
        enviadas: new Set(registradas.map((r) => claveEnvio(r.type as Notificacion["tipo"], r.periodKey))),
        modulos,
        resumen: buildOverview(level, input, completed, passed),
        avancesSemana: (vistos?.n ?? 0) + (aprobadas?.n ?? 0),
      });

      for (const n of plan) {
        // Reservar antes de enviar: la clave primaria impide duplicados aun con dos ejecuciones simultáneas.
        const reservada = await db.insert(notificationLog)
          .values({ userId: u.id, type: n.tipo, periodKey: n.periodo, sentAt: ahora })
          .onConflictDoNothing().returning();
        if (!reservada.length) continue;
        try {
          await transporte(aCorreo(n));
          resultado.enviadas++;
        } catch (err) {
          resultado.fallidas++;
          console.error(`Notificación ${n.tipo} no enviada:`, err instanceof Error ? err.message : err);
          await db.delete(notificationLog).where(and(
            eq(notificationLog.userId, u.id), eq(notificationLog.type, n.tipo), eq(notificationLog.periodKey, n.periodo)));
        }
      }
    } catch (err) {
      resultado.fallidas++;
      console.error("Error preparando notificaciones de un usuario:", err instanceof Error ? err.message : err);
    }
  }
  return resultado;
}

// Compara `Authorization: Bearer <CRON_SECRET>` en tiempo constante (los hash igualan el largo).
export function cronAutorizado(header: string | undefined, secreto: string): boolean {
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(header ?? ""), h(`Bearer ${secreto}`));
}
