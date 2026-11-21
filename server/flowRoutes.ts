import type { Express, RequestHandler } from "express";
import { flowService } from "./flowService";
import { db } from "./db";
import { reservations } from "../shared/schema";
import { eq } from "drizzle-orm";
import { isValidEmail, getEmailErrorMessage } from "../shared/emailValidation";
import { enrollFromPaidReservation } from "./matricula";
import { detalleCobroPlan, montoDelPlan } from "../shared/planPrices";
import {
  cancelarSuscripcionAdmin,
  completarRegistroTarjeta,
  FlowSubscriptionError,
  iniciarSuscripcionMensual,
  procesarWebhookSuscripcion,
} from "./flowSubscriptions";

export interface FlowRoutesOptions {
  isAdmin?: RequestHandler;
}

const denyWithoutAdminMiddleware: RequestHandler = (_req, res) => {
  res.status(401).json({ message: "Unauthorized" });
};

export function registerFlowRoutes(app: Express, options: FlowRoutesOptions = {}) {
  const requireAdmin = options.isAdmin ?? denyWithoutAdminMiddleware;

  /**
   * Crea un pago único en Flow.cl para una reserva
   */
  app.post("/api/flow/create-payment", async (req, res) => {
    try {
      // planPrice del cliente se ignora: el monto sale del plan guardado en la reserva.
      const { reservationId, studentEmail, studentName } = req.body;

      if (!reservationId || !studentEmail || !studentName) {
        return res.status(400).json({
          message: "Faltan datos requeridos: reservationId, studentEmail, studentName",
        });
      }

      if (!isValidEmail(studentEmail)) {
        return res.status(400).json({
          message: getEmailErrorMessage(studentEmail),
        });
      }

      const [reservation] = await db
        .select()
        .from(reservations)
        .where(eq(reservations.id, reservationId));

      if (!reservation) {
        return res.status(404).json({ message: "Reserva no encontrada" });
      }

      const detalle = detalleCobroPlan(reservation.selectedPlan);
      if (!detalle) {
        return res.status(400).json({ message: "El plan de la reserva no es válido" });
      }
      if (detalle.modalidad === "mensual") {
        return res.status(400).json({ message: "Este plan requiere suscripción mensual recurrente" });
      }

      // IDEMPOTENCIA: Verificar si ya existe un pago en proceso o completado
      if (reservation.flowOrder && reservation.flowToken) {
        if (reservation.paymentStatus === "completed") {
          return res.status(400).json({
            message: "Esta reserva ya tiene un pago completado",
          });
        }

        if (reservation.paymentStatus === "pending") {
          const existingPaymentUrl = `${flowService.getWebBaseUrl()}/app/web/pay.php?token=${reservation.flowToken}`;
          return res.json({
            success: true,
            paymentUrl: existingPaymentUrl,
            flowOrder: parseInt(reservation.flowOrder),
            token: reservation.flowToken,
            message: "Ya existe un pago en proceso para esta reserva",
          });
        }
      }

      const amount = detalle.monto;
      const shortId = reservationId.substring(0, 8);
      const timestamp = Date.now().toString().slice(-8);
      const commerceOrder = `UCE-${shortId}-${timestamp}`;

      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
      const urlConfirmation = `${baseUrl}/api/flow/confirm`;
      const urlReturn = `${baseUrl}/payment-result?token={{token}}`;

      const paymentData = await flowService.createPayment({
        commerceOrder,
        subject: `Inscripción UCE - ${reservation.selectedPlan || "Plan"}`,
        currency: "CLP",
        amount,
        email: studentEmail,
        urlConfirmation,
        urlReturn,
        optional: {
          reservationId,
          studentName,
          plan: reservation.selectedPlan || "N/A",
          course: reservation.courseOfInterest || "N/A",
        },
      });

      await db
        .update(reservations)
        .set({
          paymentStatus: "pending",
          flowOrder: paymentData.flowOrder.toString(),
          flowToken: paymentData.token,
          paymentAmount: amount,
        })
        .where(eq(reservations.id, reservationId));

      res.json({
        success: true,
        paymentUrl: `${paymentData.url}?token=${paymentData.token}`,
        flowOrder: paymentData.flowOrder,
        token: paymentData.token,
      });
    } catch (error: any) {
      console.error("Error creating Flow payment:", error);
      res.status(500).json({
        message: error.message || "Error al crear el pago",
      });
    }
  });

  /**
   * Inicia suscripción mensual recurrente en Flow (7 pagos de $70.000, marzo a septiembre)
   */
  app.post("/api/flow/create-subscription", async (req, res) => {
    try {
      const { reservationId, payerEmail, payerName, studentEmail, studentName } = req.body ?? {};
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
      const result = await iniciarSuscripcionMensual(db, flowService, {
        reservationId: String(reservationId ?? ""),
        payerEmail: String(payerEmail || studentEmail || ""),
        payerName: String(payerName || studentName || ""),
        baseUrl,
      });
      res.json({ success: true, ...result });
    } catch (error: any) {
      if (error instanceof FlowSubscriptionError) {
        return res.status(error.status).json({ message: error.message });
      }
      console.error("Error creating Flow subscription:", error);
      res.status(500).json({ message: error.message || "Error al iniciar la suscripción" });
    }
  });

  /**
   * Retorno de Flow tras inscribir tarjeta del cliente (redirige al frontend)
   */
  app.post("/api/flow/card-return", async (req, res) => {
    const token = String(req.body?.token ?? req.query?.token ?? "");
    if (!token) {
      return res.redirect("/payment-result?mode=subscription");
    }
    try {
      await completarRegistroTarjeta(db, flowService, token);
    } catch (error) {
      console.error("Error in Flow card return:", error);
    }
    return res.redirect(`/payment-result?mode=subscription&token=${encodeURIComponent(token)}`);
  });

  /**
   * Consulta segura del estado de registro de tarjeta / activación de suscripción mensual
   */
  app.get("/api/flow/subscription-register-status/:token", async (req, res) => {
    try {
      const result = await completarRegistroTarjeta(db, flowService, String(req.params.token ?? ""));
      res.json({ success: true, ...result });
    } catch (error: any) {
      if (error instanceof FlowSubscriptionError) {
        return res.status(error.status).json({ message: error.message });
      }
      console.error("Error getting subscription register status:", error);
      res.status(500).json({ message: error.message || "Error al verificar la suscripción" });
    }
  });

  /**
   * Webhook de cobros periódicos y cambios de estado de suscripción en Flow
   */
  app.post("/api/flow/subscription-webhook", async (req, res) => {
    try {
      const result = await procesarWebhookSuscripcion(db, flowService, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof FlowSubscriptionError) {
        return res.status(error.status).send(error.message);
      }
      console.error("Error confirming Flow subscription webhook:", error);
      res.status(500).send("Error al procesar webhook de suscripción");
    }
  });

  /**
   * Cancelación administrativa de una suscripción mensual en Flow
   */
  app.post("/api/admin/flow/subscriptions/:id/cancel", requireAdmin, async (req, res) => {
    try {
      const updated = await cancelarSuscripcionAdmin(db, flowService, String(req.params.id ?? ""));
      res.json({ success: true, subscription: updated });
    } catch (error: any) {
      if (error instanceof FlowSubscriptionError) {
        return res.status(error.status).json({ message: error.message });
      }
      console.error("Error cancelling Flow subscription:", error);
      res.status(500).json({ message: error.message || "Error al cancelar la suscripción" });
    }
  });

  /**
   * Confirmación de pago desde Flow (webhook pago único)
   */
  app.post("/api/flow/confirm", async (req, res) => {
    try {
      const { token, s } = req.body;

      if (!token) {
        console.error("Webhook error: Token no proporcionado");
        return res.status(400).send("Token no proporcionado");
      }

      if (!s) {
        console.error("Webhook error: Firma no proporcionada");
        return res.status(401).send("Firma no proporcionada");
      }

      const paramsToValidate = { token };
      const isValidSignature = flowService.validateSignature(paramsToValidate, s);

      if (!isValidSignature) {
        console.error("Webhook error: Firma inválida - posible ataque");
        return res.status(401).send("Firma inválida");
      }

      const paymentStatus = await flowService.getPaymentStatus(token);

      if (process.env.NODE_ENV !== "production") {
        console.log("Flow payment confirmation:", paymentStatus);
      }

      const [reservation] = await db
        .select()
        .from(reservations)
        .where(eq(reservations.flowOrder, paymentStatus.flowOrder.toString()));

      if (!reservation) {
        console.error("Reservation not found for flowOrder:", paymentStatus.flowOrder);
        return res.status(404).send("Reserva no encontrada");
      }

      let newStatus: "pending" | "confirmed" | "cancelled" = "pending";
      let paymentStatusText: "pending" | "completed" | "failed" | "cancelled" = "pending";

      // El monto pagado debe ser el esperado para el plan; si no, no se confirma ni se matricula.
      const esperado = montoDelPlan(reservation.selectedPlan);
      const montoCorrecto = esperado != null && Number(paymentStatus.amount) === esperado;

      if (paymentStatus.status === 2 && !montoCorrecto) {
        console.error(`Flow: monto pagado distinto del esperado (reserva ${reservation.id})`);
        newStatus = "pending";
        paymentStatusText = "failed";
      } else if (paymentStatus.status === 2) {
        newStatus = "confirmed";
        paymentStatusText = "completed";
      } else if (paymentStatus.status === 3) {
        newStatus = "pending";
        paymentStatusText = "failed";
      } else if (paymentStatus.status === 4) {
        newStatus = "cancelled";
        paymentStatusText = "cancelled";
      }

      await db
        .update(reservations)
        .set({
          status: newStatus,
          paymentStatus: paymentStatusText,
          paymentDate: paymentStatus.paymentData?.date || null,
        })
        .where(eq(reservations.id, reservation.id));

      if (paymentStatusText === "completed") {
        try {
          const auto = await enrollFromPaidReservation(db, reservation.id);
          if (!auto.ok) console.warn(`Matrícula automática pendiente (reserva ${reservation.id}): ${auto.reason}`);
        } catch (error) {
          console.error(`Error en matrícula automática (reserva ${reservation.id}):`, error);
        }
      }

      res.status(200).send("OK");
    } catch (error: any) {
      console.error("Error confirming Flow payment:", error);
      res.status(500).send("Error al confirmar el pago");
    }
  });

  /**
   * Obtener el estado de un pago único
   */
  app.get("/api/flow/payment-status/:token", async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ message: "Token no proporcionado" });
      }

      const paymentStatus = await flowService.getPaymentStatus(token);

      const [reservation] = await db
        .select()
        .from(reservations)
        .where(eq(reservations.flowToken, token));

      res.json({
        success: true,
        payment: paymentStatus,
        reservation: reservation || null,
      });
    } catch (error: any) {
      console.error("Error getting Flow payment status:", error);
      res.status(500).json({
        message: error.message || "Error al obtener el estado del pago",
      });
    }
  });
}
