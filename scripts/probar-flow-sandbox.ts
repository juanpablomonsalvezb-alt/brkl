#!/usr/bin/env tsx
/**
 * Prueba de suscripción mensual recurrente en Flow.cl ($70.000 x 7 pagos, marzo a septiembre).
 * Uso:
 *   npx tsx scripts/probar-flow-sandbox.ts --simulado   (levanta servidor HTTP local con validación HMAC real)
 *   npx tsx scripts/probar-flow-sandbox.ts              (ejecuta en https://sandbox.flow.cl/api; bloquea producción)
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "../shared/schema";
import { flowSubscriptions, reservations } from "../shared/schema";
import { assertFlowSandboxUrl, FLOW_SANDBOX_API_URL } from "../shared/flowSandbox";
import { FLOW_PLAN_ESCOLAR_MENSUAL_ID } from "../shared/planPrices";
import { createFlowService } from "../server/flowService";
import {
  cancelarSuscripcionAdmin,
  completarRegistroTarjeta,
  FlowSubscriptionError,
  iniciarSuscripcionMensual,
  procesarWebhookSuscripcion,
} from "../server/flowSubscriptions";

function firmarFlow(params: Record<string, any>, secret: string): string {
  const txt = Object.keys(params)
    .filter((k) => k !== "s" && params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("");
  return crypto.createHmac("sha256", secret).update(txt).digest("hex");
}

async function crearDbLocalTemporal() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "brkl-flow-sandbox-"));
  const client = createClient({ url: `file:${path.join(dir, "flow.db")}` });
  const db = drizzle(client, { schema });
  const ddls = await generateSQLiteMigration(
    await generateSQLiteDrizzleJson({}),
    await generateSQLiteDrizzleJson(schema as any),
  );
  for (const s of ddls) await client.execute(s);
  return {
    db,
    cerrar: () => {
      client.close();
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

export async function ejecutarCicloFlowHttpSimulado() {
  const apiKey = "sandbox-sim-api-key";
  const secretKey = "sandbox-sim-secret-key";

  const flowApiApp = express();
  flowApiApp.use(express.urlencoded({ extended: true }));
  flowApiApp.use(express.json());

  const planes = new Map<string, any>();
  const clientes = new Map<string, any>();
  const registros = new Map<string, any>();
  const suscripciones = new Map<string, any>();
  const facturas = new Map<string, any>();
  let seq = 0;

  const verificarFirmaFlow = (req: express.Request, res: express.Response): Record<string, any> | null => {
    const payload = req.method === "GET" ? { ...req.query } : { ...req.body };
    const firmaRecibida = String(payload.s ?? "");
    if (String(payload.apiKey ?? "") !== apiKey) {
      res.status(401).json({ message: "apiKey inválida" });
      return null;
    }
    const esperada = firmarFlow(payload, secretKey);
    const a = Buffer.from(esperada, "utf8");
    const b = Buffer.from(firmaRecibida, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      res.status(401).json({ message: "Firma HMAC inválida en API simulada" });
      return null;
    }
    return payload;
  };

  flowApiApp.get("/api/plans/get", (req, res) => {
    const p = verificarFirmaFlow(req, res);
    if (!p) return;
    const plan = planes.get(String(p.planId));
    if (!plan) return res.status(404).json({ message: "Plan no existe" });
    res.json(plan);
  });

  flowApiApp.post("/api/plans/create", (req, res) => {
    const p = verificarFirmaFlow(req, res);
    if (!p) return;
    const plan = {
      planId: String(p.planId),
      name: String(p.name),
      currency: String(p.currency),
      amount: Number(p.amount),
      interval: Number(p.interval),
      periods_number: Number(p.periods_number),
      status: 1,
    };
    planes.set(plan.planId, plan);
    res.json(plan);
  });

  flowApiApp.post("/api/customer/create", (req, res) => {
    const p = verificarFirmaFlow(req, res);
    if (!p) return;
    const customerId = `cust-http-${++seq}`;
    const c = {
      customerId,
      created: "2027-03-01",
      email: String(p.email),
      name: String(p.name),
      externalId: String(p.externalId),
      status: "1",
    };
    clientes.set(customerId, c);
    res.json(c);
  });

  flowApiApp.post("/api/customer/register", (req, res) => {
    const p = verificarFirmaFlow(req, res);
    if (!p) return;
    const token = `reg-http-${++seq}`;
    registros.set(token, { status: 1, customerId: String(p.customerId), creditCardType: "VISA", last4CardDigits: "4242" });
    res.json({ url: "http://127.0.0.1/app/web/pay.php", token });
  });

  flowApiApp.get("/api/customer/getRegisterStatus", (req, res) => {
    const p = verificarFirmaFlow(req, res);
    if (!p) return;
    const reg = registros.get(String(p.token));
    if (!reg) return res.status(404).json({ message: "Token no encontrado" });
    res.json(reg);
  });

  flowApiApp.post("/api/subscription/create", (req, res) => {
    const p = verificarFirmaFlow(req, res);
    if (!p) return;
    const subscriptionId = `fsub-http-${++seq}`;
    const sub = {
      subscriptionId,
      planId: String(p.planId),
      customerId: String(p.customerId),
      status: 1,
      periods_number: Number(p.periods_number ?? 7),
    };
    suscripciones.set(subscriptionId, sub);
    res.json(sub);
  });

  flowApiApp.get("/api/invoice/get", (req, res) => {
    const p = verificarFirmaFlow(req, res);
    if (!p) return;
    const inv = facturas.get(String(p.invoiceId));
    if (!inv) return res.status(404).json({ message: "Factura no encontrada" });
    res.json(inv);
  });

  flowApiApp.post("/api/subscription/cancel", (req, res) => {
    const p = verificarFirmaFlow(req, res);
    if (!p) return;
    const sub = suscripciones.get(String(p.subscriptionId));
    if (!sub) return res.status(404).json({ message: "Suscripción no encontrada" });
    sub.status = 4;
    res.json(sub);
  });

  const server = createServer(flowApiApp);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const { port } = server.address() as AddressInfo;
  const mockApiUrl = assertFlowSandboxUrl(`http://127.0.0.1:${port}/api`, { allowLocalhostMock: true });

  const localDb = await crearDbLocalTemporal();
  try {
    const flow = createFlowService({ apiKey, secretKey, apiUrl: mockApiUrl });
    const reservationId = "res-flow-http-1";
    await localDb.db.insert(reservations).values({
      id: reservationId,
      fullName: "Estudiante Demo Flow",
      rut: "21.234.567-8",
      email: "familia.flow.demo@gmail.com",
      phone: "+56912345678",
      dateOfBirth: "2015-05-10",
      programType: "focus",
      courseOfInterest: "5° Básico",
      selectedPlan: "media1_plan_mensual",
      paymentStatus: "pending",
      status: "pending",
    });

    const inicio = await iniciarSuscripcionMensual(localDb.db, flow, {
      reservationId,
      payerEmail: "apoderado.flow.demo@gmail.com",
      payerName: "Apoderado Demo",
      baseUrl: "http://127.0.0.1:3002",
    });
    assert.equal(inicio.amount, 70000);
    assert.equal(inicio.periodsTotal, 7);
    assert.equal(planes.get(FLOW_PLAN_ESCOLAR_MENSUAL_ID)?.amount, 70000);

    const regRes = await completarRegistroTarjeta(localDb.db, flow, inicio.token);
    assert.equal(regRes.status, "active");
    assert.ok(regRes.flowSubscriptionId);

    // Webhook sin firma o alterado debe fallar con 401.
    await assert.rejects(
      procesarWebhookSuscripcion(localDb.db, flow, {
        invoiceId: "inv-http-1",
        s: firmarFlow({ invoiceId: "inv-alterada" }, secretKey),
      }),
      (e: any) => e instanceof FlowSubscriptionError && e.status === 401,
    );

    // Factura con monto adulterado ($10.000 != $70.000) marca amountMismatch/past_due sin acreditar cuota.
    facturas.set("inv-monto-malo", {
      id: "inv-monto-malo",
      subscriptionId: regRes.flowSubscriptionId,
      amount: 10000,
      status: 1,
      paidDate: "2027-03-05",
    });
    const wm = await procesarWebhookSuscripcion(localDb.db, flow, {
      invoiceId: "inv-monto-malo",
      s: firmarFlow({ invoiceId: "inv-monto-malo" }, secretKey),
    });
    assert.equal(wm.amountMismatch, true);
    assert.equal(wm.status, "past_due");
    assert.equal(wm.periodsPaid, 0);

    // Factura válida pagada ($70.000) + idempotencia en repetición.
    facturas.set("inv-ok-1", {
      id: "inv-ok-1",
      subscriptionId: regRes.flowSubscriptionId,
      amount: 70000,
      status: 1,
      paidDate: "2027-03-05",
    });
    const w1 = await procesarWebhookSuscripcion(localDb.db, flow, {
      invoiceId: "inv-ok-1",
      s: firmarFlow({ invoiceId: "inv-ok-1" }, secretKey),
    });
    assert.equal(w1.periodsPaid, 1);
    assert.equal(w1.status, "active");
    const w2 = await procesarWebhookSuscripcion(localDb.db, flow, {
      invoiceId: "inv-ok-1",
      s: firmarFlow({ invoiceId: "inv-ok-1" }, secretKey),
    });
    assert.equal(w2.deduplicated, true);
    assert.equal(w2.periodsPaid, 1);

    // Cancelación administrativa sobre HTTP.
    const cancelada = await cancelarSuscripcionAdmin(localDb.db, flow, inicio.subscriptionRecordId);
    assert.equal(cancelada.status, "cancelled");
    const [rowFinal] = await localDb.db
      .select()
      .from(flowSubscriptions)
      .where(eq(flowSubscriptions.id, inicio.subscriptionRecordId));
    assert.equal(rowFinal?.status, "cancelled");

    return {
      apiUrl: mockApiUrl,
      subscriptionRecordId: inicio.subscriptionRecordId,
      flowSubscriptionId: regRes.flowSubscriptionId!,
      periodsPaid: w2.periodsPaid,
      finalStatus: rowFinal!.status,
    };
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    localDb.cerrar();
  }
}

async function ejecutarSandboxReal() {
  const faltantes: string[] = [];
  if (!process.env.FLOW_API_KEY?.trim()) faltantes.push("FLOW_API_KEY");
  if (!process.env.FLOW_SECRET_KEY?.trim()) faltantes.push("FLOW_SECRET_KEY");
  if (faltantes.length > 0) {
    console.error(`Faltan credenciales requeridas para Flow Sandbox: ${faltantes.join(", ")}`);
    console.error("Define FLOW_API_KEY y FLOW_SECRET_KEY (sandbox) o usa --simulado para prueba local sin red.");
    process.exit(2);
  }

  const sandboxUrl = assertFlowSandboxUrl(process.env.FLOW_API_URL || FLOW_SANDBOX_API_URL);
  const flow = createFlowService({
    apiKey: process.env.FLOW_API_KEY!.trim(),
    secretKey: process.env.FLOW_SECRET_KEY!.trim(),
    apiUrl: sandboxUrl,
  });

  const localDb = await crearDbLocalTemporal();
  try {
    const reservationId = `res-sbx-${Date.now()}`;
    await localDb.db.insert(reservations).values({
      id: reservationId,
      fullName: "Prueba Sandbox Flow",
      rut: "20.111.222-3",
      email: "sandbox.prueba.demo@gmail.com",
      phone: "+56912345678",
      dateOfBirth: "2014-04-01",
      programType: "focus",
      courseOfInterest: "5° Básico",
      selectedPlan: "media1_plan_mensual",
      paymentStatus: "pending",
      status: "pending",
    });

    const res = await iniciarSuscripcionMensual(localDb.db, flow, {
      reservationId,
      payerEmail: process.env.FLOW_SANDBOX_TEST_EMAIL?.trim() || "sandbox.prueba.demo@gmail.com",
      payerName: "Apoderado Prueba Sandbox",
      baseUrl: process.env.BASE_URL?.trim() || "http://localhost:3002",
    });

    console.log("Flow Sandbox conectado en:", sandboxUrl);
    console.log("subscriptionRecordId:", res.subscriptionRecordId);
    console.log("amount / periodsTotal:", `${res.amount} x ${res.periodsTotal}`);
    console.log("URL de inscripción de tarjeta:", res.registerUrl);
  } finally {
    localDb.cerrar();
  }
}

const esEjecucionDirecta = process.argv[1] && path.resolve(process.argv[1]).endsWith("probar-flow-sandbox.ts");
if (esEjecucionDirecta) {
  if (process.argv.includes("--simulado")) {
    const resumen = await ejecutarCicloFlowHttpSimulado();
    console.log("flow-sandbox-simulado: ok", JSON.stringify(resumen));
  } else {
    await ejecutarSandboxReal();
  }
}
