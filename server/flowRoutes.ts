import type { Express } from "express";
import { flowService } from "./flowService";
import { db } from "./db";
import { reservations } from "../shared/schema";
import { eq } from "drizzle-orm";

export function registerFlowRoutes(app: Express) {
  /**
   * Crea un pago en Flow.cl para una reserva
   */
  app.post("/api/flow/create-payment", async (req, res) => {
    try {
      const { reservationId, planPrice, studentEmail, studentName } = req.body;

      if (!reservationId || !planPrice || !studentEmail || !studentName) {
        return res.status(400).json({ 
          message: "Faltan datos requeridos: reservationId, planPrice, studentEmail, studentName" 
        });
      }

      // Obtener la reserva de la base de datos
      const [reservation] = await db
        .select()
        .from(reservations)
        .where(eq(reservations.id, reservationId));

      if (!reservation) {
        return res.status(404).json({ message: "Reserva no encontrada" });
      }

      // Convertir el precio chileno a número
      const amount = flowService.parseChileanAmount(planPrice);

      // Crear orden de comercio única (máximo 45 caracteres)
      // Usar solo los primeros 8 caracteres del ID + timestamp corto
      const shortId = reservationId.substring(0, 8);
      const timestamp = Date.now().toString().slice(-8); // Últimos 8 dígitos
      const commerceOrder = `UCE-${shortId}-${timestamp}`; // Formato: UCE-12345678-12345678 (25 chars)

      // URLs de confirmación y retorno
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      const urlConfirmation = `${baseUrl}/api/flow/confirm`;
      const urlReturn = `${baseUrl}/payment-result`;

      // Crear pago en Flow (sin optional por ahora para debug)
      const paymentData = await flowService.createPayment({
        commerceOrder,
        subject: `Inscripción UCE - ${reservation.selectedPlan || 'Plan'}`,
        currency: "CLP",
        amount,
        email: studentEmail,
        urlConfirmation,
        urlReturn,
        // optional: {
        //   reservationId,
        //   studentName,
        //   plan: reservation.selectedPlan,
        //   course: reservation.courseOfInterest,
        // },
      });

      // Actualizar la reserva con los datos del pago
      await db
        .update(reservations)
        .set({
          paymentStatus: "pending",
          flowOrder: paymentData.flowOrder.toString(),
          flowToken: paymentData.token,
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
        message: error.message || "Error al crear el pago" 
      });
    }
  });

  /**
   * Confirmación de pago desde Flow (webhook)
   */
  app.post("/api/flow/confirm", async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).send("Token no proporcionado");
      }

      // Obtener el estado del pago desde Flow
      const paymentStatus = await flowService.getPaymentStatus(token);

      console.log("Flow payment confirmation:", paymentStatus);

      // Buscar la reserva por flowOrder
      const [reservation] = await db
        .select()
        .from(reservations)
        .where(eq(reservations.flowOrder, paymentStatus.flowOrder.toString()));

      if (!reservation) {
        console.error("Reservation not found for flowOrder:", paymentStatus.flowOrder);
        return res.status(404).send("Reserva no encontrada");
      }

      // Actualizar el estado de la reserva según el estado del pago
      let newStatus = "pending";
      let paymentStatusText = "pending";

      if (paymentStatus.status === 2) {
        // Pago exitoso
        newStatus = "confirmed";
        paymentStatusText = "completed";
      } else if (paymentStatus.status === 3) {
        // Pago rechazado
        newStatus = "pending";
        paymentStatusText = "failed";
      } else if (paymentStatus.status === 4) {
        // Pago anulado
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

      res.status(200).send("OK");
    } catch (error: any) {
      console.error("Error confirming Flow payment:", error);
      res.status(500).send("Error al confirmar el pago");
    }
  });

  /**
   * Obtener el estado de un pago
   */
  app.get("/api/flow/payment-status/:token", async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ message: "Token no proporcionado" });
      }

      const paymentStatus = await flowService.getPaymentStatus(token);

      // Buscar la reserva asociada
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
        message: error.message || "Error al obtener el estado del pago" 
      });
    }
  });
}
