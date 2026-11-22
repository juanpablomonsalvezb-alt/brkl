// Suscripciones mensuales recurrentes en Flow.cl (ej. plan escolar $70.000 x 7 pagos).
// Recibe la conexión Drizzle y la pasarela Flow inyectadas para probarse sin red contra SQLite en memoria.
import { eq, and } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import { flowSubscriptions, flowSubscriptionInvoices, reservations, type FlowSubscription } from "@shared/schema";
import { detalleCobroPlan } from "@shared/planPrices";
import { isValidEmail, getEmailErrorMessage } from "@shared/emailValidation";
import { enrollFromPaidReservation } from "./matricula";
import type {
  FlowCardRegisterParams,
  FlowCardRegisterResponse,
  FlowCardRegisterStatus,
  FlowCustomerParams,
  FlowCustomerResponse,
  FlowInvoiceResponse,
  FlowPlanParams,
  FlowPlanResponse,
  FlowSubscriptionParams,
  FlowSubscriptionResponse,
} from "./flowService";

type Db = LibSQLDatabase<typeof schema>;

// ─── F4: Lock en memoria para evitar concurrencia en completarRegistroTarjeta ──
// Mapa token → promesa en curso.  Si dos llamadas llegan con el mismo token,
// la segunda espera a que la primera termine y reutiliza el resultado.
const registroLocks = new Map<string, Promise<any>>();

export interface FlowSubscriptionsGateway {
  getWebBaseUrl(): string;
  getPlan(planId: string): Promise<FlowPlanResponse>;
  createPlan(params: FlowPlanParams): Promise<FlowPlanResponse>;
  createCustomer(params: FlowCustomerParams): Promise<FlowCustomerResponse>;
  registerCustomerCard(params: FlowCardRegisterParams): Promise<FlowCardRegisterResponse>;
  getCustomerRegisterStatus(token: string): Promise<FlowCardRegisterStatus>;
  createSubscription(params: FlowSubscriptionParams): Promise<FlowSubscriptionResponse>;
  getSubscription(subscriptionId: string): Promise<FlowSubscriptionResponse>;
  cancelSubscription(subscriptionId: string, at_period_end?: 0 | 1): Promise<FlowSubscriptionResponse>;
  getInvoice(invoiceId: string): Promise<FlowInvoiceResponse>;
  validateSignature(params: Record<string, any>, signature: string): boolean;
}

export class FlowSubscriptionError extends Error {
  constructor(public status: 400 | 401 | 404, message: string) {
    super(message);
  }
}

export interface IniciarSuscripcionInput {
  reservationId: string;
  payerEmail: string;
  payerName: string;
  baseUrl: string;
}

export interface IniciarSuscripcionResult {
  registerUrl: string;
  token: string;
  subscriptionRecordId: string;
  amount: number;
  periodsTotal: number;
  reused: boolean;
}

export async function iniciarSuscripcionMensual(
  db: Db,
  flow: FlowSubscriptionsGateway,
  input: IniciarSuscripcionInput,
): Promise<IniciarSuscripcionResult> {
  const { reservationId, payerEmail, payerName, baseUrl } = input;
  if (!reservationId || !payerEmail || !payerName) {
    throw new FlowSubscriptionError(400, "Faltan datos requeridos: reservationId, payerEmail, payerName");
  }
  if (!isValidEmail(payerEmail)) {
    throw new FlowSubscriptionError(400, getEmailErrorMessage(payerEmail));
  }

  const [reservation] = await db.select().from(reservations).where(eq(reservations.id, reservationId));
  if (!reservation) {
    throw new FlowSubscriptionError(404, "Reserva no encontrada");
  }

  const detalle = detalleCobroPlan(reservation.selectedPlan);
  if (!detalle || detalle.modalidad !== "mensual" || !detalle.flowPlanId) {
    throw new FlowSubscriptionError(400, "La reserva no corresponde a un plan mensual");
  }

  const [existing] = await db
    .select()
    .from(flowSubscriptions)
    .where(eq(flowSubscriptions.reservationId, reservation.id));

  if (existing) {
    if (existing.status === "active" || existing.status === "completed") {
      throw new FlowSubscriptionError(400, "Esta reserva ya tiene una suscripción activa");
    }
    if (existing.status === "pending_card" && existing.registerToken) {
      return {
        registerUrl: `${flow.getWebBaseUrl()}/app/web/pay.php?token=${existing.registerToken}`,
        token: existing.registerToken,
        subscriptionRecordId: existing.id,
        amount: existing.amount,
        periodsTotal: existing.periodsTotal,
        reused: true,
      };
    }
  }

  // F6: Asegurar que el plan mensual exista en Flow antes de inscribir la tarjeta.
  // Distinguir «el plan no existe» de otros errores; ante error de red o credenciales
  // NO se crea el plan.
  try {
    await flow.getPlan(detalle.flowPlanId);
  } catch (planErr: any) {
    const msg = (planErr.message ?? "").toLowerCase();
    const planNotFound =
      msg.includes("no existe") ||
      msg.includes("not found") ||
      planErr.status === 404;
    if (!planNotFound) {
      // Error de red, credenciales, timeout → no crear plan, propagar
      throw new Error(`No se puede verificar el plan en Flow: ${planErr.message}`);
    }
    await flow.createPlan({
      planId: detalle.flowPlanId,
      name: "Barkley Plan Escolar Mensual 2027 (7 pagos)",
      currency: "CLP",
      amount: detalle.monto,
      interval: 3,
      periods_number: detalle.cuotas,
      urlCallback: `${baseUrl}/api/flow/subscription-webhook`,
    });
  }

  const customerId = existing?.flowCustomerId
    ? existing.flowCustomerId
    : (await flow.createCustomer({ name: payerName, email: payerEmail, externalId: reservation.id })).customerId;

  const reg = await flow.registerCustomerCard({
    customerId,
    url_return: `${baseUrl}/api/flow/card-return`,
  });

  const now = new Date();
  let subscriptionRecordId: string;
  if (existing) {
    await db
      .update(flowSubscriptions)
      .set({
        flowPlanId: detalle.flowPlanId,
        flowCustomerId: customerId,
        registerToken: reg.token,
        flowSubscriptionId: null,
        amount: detalle.monto,
        periodsTotal: detalle.cuotas,
        periodsPaid: 0,
        status: "pending_card",
        updatedAt: now,
      })
      .where(eq(flowSubscriptions.id, existing.id));
    subscriptionRecordId = existing.id;
  } else {
    const [created] = await db
      .insert(flowSubscriptions)
      .values({
        reservationId: reservation.id,
        flowPlanId: detalle.flowPlanId,
        flowCustomerId: customerId,
        registerToken: reg.token,
        amount: detalle.monto,
        periodsTotal: detalle.cuotas,
        periodsPaid: 0,
        status: "pending_card",
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: flowSubscriptions.id });
    subscriptionRecordId = created.id;
  }

  return {
    registerUrl: `${reg.url}?token=${reg.token}`,
    token: reg.token,
    subscriptionRecordId,
    amount: detalle.monto,
    periodsTotal: detalle.cuotas,
    reused: false,
  };
}

export interface CompletarRegistroResult {
  status: FlowSubscription["status"];
  flowSubscriptionId: string | null;
  amount: number;
  periodsTotal: number;
  periodsPaid: number;
  reservationId: string;
  alreadyActive: boolean;
}

/**
 * F3 + F4: completarRegistroTarjeta — registra la tarjeta y crea la suscripción en Flow,
 * pero NO marca paymentStatus=completed ni cambia la reserva a confirmed ni llama
 * enrollFromPaidReservation.  Eso ocurre en procesarWebhookSuscripcion al llegar la
 * primera factura pagada.
 *
 * F4: transición atómica pending_card → card_registered con UPDATE WHERE status='pending_card'
 * y verificación de filas afectadas para evitar duplicados por concurrencia.
 */
export async function completarRegistroTarjeta(
  db: Db,
  flow: FlowSubscriptionsGateway,
  token: string,
): Promise<CompletarRegistroResult> {
  if (!token) {
    throw new FlowSubscriptionError(400, "Token no proporcionado");
  }

  // F4: lock por token — si ya hay una promesa en curso con este token, esperar
  const existingPromise = registroLocks.get(token);
  if (existingPromise) {
    const result = await existingPromise;
    return result;
  }

  const promise = (async (): Promise<CompletarRegistroResult> => {
    const [sub] = await db
      .select()
      .from(flowSubscriptions)
      .where(eq(flowSubscriptions.registerToken, token));

  if (!sub) {
    throw new FlowSubscriptionError(404, "Registro de tarjeta no encontrado");
  }

  if (sub.status === "active" || sub.status === "completed") {
    return {
      status: sub.status,
      flowSubscriptionId: sub.flowSubscriptionId,
      amount: sub.amount,
      periodsTotal: sub.periodsTotal,
      periodsPaid: sub.periodsPaid,
      reservationId: sub.reservationId,
      alreadyActive: true,
    };
  }

  const regStatus = await flow.getCustomerRegisterStatus(token);
  if (regStatus.customerId !== sub.flowCustomerId) {
    throw new FlowSubscriptionError(400, "El cliente registrado en Flow no coincide con la suscripción");
  }

  const now = new Date();
  if (regStatus.status !== 1) {
    await db
      .update(flowSubscriptions)
      .set({ status: "failed", updatedAt: now })
      .where(eq(flowSubscriptions.id, sub.id));
    return {
      status: "failed",
      flowSubscriptionId: null,
      amount: sub.amount,
      periodsTotal: sub.periodsTotal,
      periodsPaid: sub.periodsPaid,
      reservationId: sub.reservationId,
      alreadyActive: false,
    };
  }

  // F4: transición atómica — solo una llamada concurrente avanza.
  // Paso 1: intentar mover pending_card → card_registered (solo uno lo logra)
  await db
    .update(flowSubscriptions)
    .set({ status: "card_registered", updatedAt: now })
    .where(and(eq(flowSubscriptions.id, sub.id), eq(flowSubscriptions.status, "pending_card")));

  // Paso 2: leer de nuevo — si el estado no es card_registered, otra llamada ya lo procesó
  const [subAfter] = await db
    .select()
    .from(flowSubscriptions)
    .where(eq(flowSubscriptions.id, sub.id));

  if (subAfter.status !== "card_registered") {
    // Otra llamada concurrente ya procesó esto
    return {
      status: subAfter.status as FlowSubscription["status"],
      flowSubscriptionId: subAfter.flowSubscriptionId,
      amount: subAfter.amount,
      periodsTotal: subAfter.periodsTotal,
      periodsPaid: subAfter.periodsPaid,
      reservationId: subAfter.reservationId,
      alreadyActive: true,
    };
  }

  // Paso 3: ahora card_registered → active (solo el ganador avanza)
  const [subBeforeCreate] = await db
    .select()
    .from(flowSubscriptions)
    .where(and(eq(flowSubscriptions.id, sub.id), eq(flowSubscriptions.status, "card_registered")));

  if (!subBeforeCreate) {
    // Edge case: otra llamada ya pasó de card_registered a active
    const [subFinal] = await db
      .select()
      .from(flowSubscriptions)
      .where(eq(flowSubscriptions.id, sub.id));
    return {
      status: subFinal.status as FlowSubscription["status"],
      flowSubscriptionId: subFinal.flowSubscriptionId,
      amount: subFinal.amount,
      periodsTotal: subFinal.periodsTotal,
      periodsPaid: subFinal.periodsPaid,
      reservationId: subFinal.reservationId,
      alreadyActive: true,
    };
  }

  const [reservation] = await db.select().from(reservations).where(eq(reservations.id, sub.reservationId));
  if (!reservation) {
    throw new FlowSubscriptionError(404, "Reserva no encontrada");
  }

  const detalle = detalleCobroPlan(reservation.selectedPlan);
  if (!detalle || detalle.modalidad !== "mensual" || detalle.monto !== sub.amount || detalle.cuotas !== sub.periodsTotal) {
    throw new FlowSubscriptionError(400, "El plan de la reserva no coincide con la suscripción");
  }

  const flowSub = await flow.createSubscription({
    planId: sub.flowPlanId,
    customerId: sub.flowCustomerId,
    periods_number: sub.periodsTotal,
  });

  await db
    .update(flowSubscriptions)
    .set({
      flowSubscriptionId: flowSub.subscriptionId,
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(flowSubscriptions.id, sub.id));

  // F3: NO marcamos paymentStatus=completed ni confirmamos la reserva ni matriculamos.
  // Eso se hace en procesarWebhookSuscripcion al llegar la primera factura pagada.

  return {
    status: "active",
    flowSubscriptionId: flowSub.subscriptionId,
    amount: sub.amount,
    periodsTotal: sub.periodsTotal,
    periodsPaid: sub.periodsPaid,
    reservationId: sub.reservationId,
    alreadyActive: false,
  };
  })();

  // Registrar la promesa en el lock; limpiar cuando termine
  registroLocks.set(token, promise);
  try {
    const result = await promise;
    return result;
  } finally {
    registroLocks.delete(token);
  }
}

/**
 * F7: obtenerEstadoRegistroTarjeta — versión de solo lectura para
 * subscription-register-status.  Consulta el estado local sin crear nada en Flow.
 */
export async function obtenerEstadoRegistroTarjeta(
  db: Db,
  _flow: FlowSubscriptionsGateway,
  token: string,
): Promise<CompletarRegistroResult> {
  if (!token) {
    throw new FlowSubscriptionError(400, "Token no proporcionado");
  }

  const [sub] = await db
    .select()
    .from(flowSubscriptions)
    .where(eq(flowSubscriptions.registerToken, token));

  if (!sub) {
    throw new FlowSubscriptionError(404, "Registro de tarjeta no encontrado");
  }

  return {
    status: sub.status,
    flowSubscriptionId: sub.flowSubscriptionId,
    amount: sub.amount,
    periodsTotal: sub.periodsTotal,
    periodsPaid: sub.periodsPaid,
    reservationId: sub.reservationId,
    alreadyActive: sub.status === "active" || sub.status === "completed",
  };
}

export interface WebhookSuscripcionResult {
  ok: true;
  status: FlowSubscription["status"];
  periodsPaid: number;
  deduplicated?: boolean;
  amountMismatch?: boolean;
}

/**
 * F3: procesarWebhookSuscripcion — aquí es donde se paga y matricula al confirmarse
 * la primera factura (status === 1 y monto correcto).
 * F5: deduplicación por tabla flow_subscription_invoices (no por lastInvoiceId).
 * Una factura pendiente (status === 0) NO cambia el estado a past_due.
 * Solo una fallida/anulada (status === 2) lo hace.
 */
export async function procesarWebhookSuscripcion(
  db: Db,
  flow: FlowSubscriptionsGateway,
  body: Record<string, any> | undefined,
): Promise<WebhookSuscripcionResult> {
  if (!body || typeof body !== "object") {
    throw new FlowSubscriptionError(400, "Cuerpo inválido");
  }

  const signature = typeof body.s === "string" ? body.s : "";
  const paramsSinS: Record<string, any> = {};
  for (const [key, val] of Object.entries(body)) {
    if (key !== "s" && val !== undefined && val !== null && val !== "") {
      paramsSinS[key] = val;
    }
  }

  if (!signature || Object.keys(paramsSinS).length === 0 || !flow.validateSignature(paramsSinS, signature)) {
    throw new FlowSubscriptionError(401, "Firma inválida");
  }

  const now = new Date();
  const invoiceId = body.invoiceId !== undefined && body.invoiceId !== null && String(body.invoiceId).trim() !== ""
    ? String(body.invoiceId)
    : null;

  if (invoiceId) {
    const invoice = await flow.getInvoice(invoiceId);
    const [sub] = await db
      .select()
      .from(flowSubscriptions)
      .where(eq(flowSubscriptions.flowSubscriptionId, String(invoice.subscriptionId)));

    if (!sub) {
      throw new FlowSubscriptionError(404, "Suscripción no encontrada");
    }

    // F5: deduplicación por tabla flow_subscription_invoices
    const [existingInvoice] = await db
      .select()
      .from(flowSubscriptionInvoices)
      .where(eq(flowSubscriptionInvoices.invoiceId, String(invoice.id)));

    if (existingInvoice) {
      return {
        ok: true,
        deduplicated: true,
        status: sub.status,
        periodsPaid: sub.periodsPaid,
      };
    }

    // F5: registrar la factura como procesada (idempotente por unique invoice_id)
    try {
      await db.insert(flowSubscriptionInvoices).values({
        invoiceId: String(invoice.id),
        subscriptionId: String(invoice.subscriptionId),
        processedAt: now,
      });
    } catch {
      // UNIQUE constraint violation → ya estaba procesada
      return {
        ok: true,
        deduplicated: true,
        status: sub.status,
        periodsPaid: sub.periodsPaid,
      };
    }

    // F5: factura pendiente (status === 0) NO cambia el estado
    if (invoice.status === 0) {
      return {
        ok: true,
        status: sub.status,
        periodsPaid: sub.periodsPaid,
      };
    }

    // Factura fallida/anulada (status === 2) → past_due
    if (invoice.status === 2) {
      await db
        .update(flowSubscriptions)
        .set({ status: "past_due", updatedAt: now })
        .where(eq(flowSubscriptions.id, sub.id));
      return {
        ok: true,
        status: "past_due",
        periodsPaid: sub.periodsPaid,
      };
    }

    // Factura pagada (status === 1)
    if (invoice.status === 1 && Number(invoice.amount) !== sub.amount) {
      console.error(`Flow suscripción: monto distinto del esperado (${invoice.amount} vs ${sub.amount}) en ${sub.id}`);
      await db
        .update(flowSubscriptions)
        .set({ status: "past_due", updatedAt: now })
        .where(eq(flowSubscriptions.id, sub.id));
      return {
        ok: true,
        amountMismatch: true,
        status: "past_due",
        periodsPaid: sub.periodsPaid,
      };
    }

    if (invoice.status === 1) {
      const nextPaid = Math.min(sub.periodsTotal, sub.periodsPaid + 1);
      const nextStatus: FlowSubscription["status"] = nextPaid >= sub.periodsTotal ? "completed" : "active";
      const paidAt = invoice.paidDate ?? now.toISOString();

      await db
        .update(flowSubscriptions)
        .set({
          periodsPaid: nextPaid,
          lastInvoiceId: String(invoice.id),
          lastPaidAt: paidAt,
          status: nextStatus,
          updatedAt: now,
        })
        .where(eq(flowSubscriptions.id, sub.id));

      // F3: pagar y matricular al confirmarse la primera factura
      const [reservation] = await db.select().from(reservations).where(eq(reservations.id, sub.reservationId));
      if (reservation) {
        await db
          .update(reservations)
          .set({
            status: reservation.status === "enrolled" ? "enrolled" : "confirmed",
            paymentStatus: "completed",
            paymentDate: paidAt,
            paymentAmount: sub.amount,
            updatedAt: now,
          })
          .where(eq(reservations.id, reservation.id));

        // Matricular solo en la primera factura pagada
        if (sub.periodsPaid === 0) {
          try {
            const auto = await enrollFromPaidReservation(db, reservation.id);
            if (!auto.ok) console.warn(`Matrícula automática pendiente (reserva ${reservation.id}): ${auto.reason}`);
          } catch (error) {
            console.error(`Error en matrícula automática (reserva ${reservation.id}):`, error);
          }
        }
      }

      return {
        ok: true,
        deduplicated: false,
        status: nextStatus,
        periodsPaid: nextPaid,
      };
    }

    return {
      ok: true,
      status: sub.status,
      periodsPaid: sub.periodsPaid,
    };
  }

  const subscriptionId = body.subscriptionId !== undefined && body.subscriptionId !== null && String(body.subscriptionId).trim() !== ""
    ? String(body.subscriptionId)
    : null;

  if (!subscriptionId) {
    throw new FlowSubscriptionError(400, "Falta invoiceId o subscriptionId");
  }

  const flowSub = await flow.getSubscription(subscriptionId);
  const [sub] = await db
    .select()
    .from(flowSubscriptions)
    .where(eq(flowSubscriptions.flowSubscriptionId, String(flowSub.subscriptionId)));

  if (!sub) {
    throw new FlowSubscriptionError(404, "Suscripción no encontrada");
  }

  let nextStatus: FlowSubscription["status"] = sub.status;
  if (flowSub.status === 4) nextStatus = "cancelled";
  else if (flowSub.status === 1) nextStatus = sub.periodsPaid >= sub.periodsTotal ? "completed" : "active";
  else if (flowSub.status === 2 || flowSub.status === 3) nextStatus = "past_due";

  await db
    .update(flowSubscriptions)
    .set({ status: nextStatus, updatedAt: now })
    .where(eq(flowSubscriptions.id, sub.id));

  return {
    ok: true,
    status: nextStatus,
    periodsPaid: sub.periodsPaid,
  };
}

export async function cancelarSuscripcionAdmin(
  db: Db,
  flow: FlowSubscriptionsGateway,
  id: string,
): Promise<FlowSubscription> {
  const [sub] = await db.select().from(flowSubscriptions).where(eq(flowSubscriptions.id, id));
  if (!sub) {
    throw new FlowSubscriptionError(404, "Suscripción no encontrada");
  }

  if (sub.flowSubscriptionId && sub.status !== "cancelled" && sub.status !== "completed") {
    await flow.cancelSubscription(sub.flowSubscriptionId, 1);
  }

  const [updated] = await db
    .update(flowSubscriptions)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(flowSubscriptions.id, sub.id))
    .returning();

  return updated;
}
