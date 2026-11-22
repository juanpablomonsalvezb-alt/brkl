// Suscripciones mensuales recurrentes (Flow): $70.000 x 7 pagos (marzo a septiembre).
// Base SQLite EN MEMORIA y pasarela Flow simulada (sin red). Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import crypto from "node:crypto";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

if (process.env.NODE_ENV === "production") {
  throw new Error("flow-suscripciones.check no debe correr con NODE_ENV=production");
}
process.env.TEST_DATABASE_URL = ":memory:";
process.env.FLOW_API_KEY = "test-api-key";
process.env.FLOW_SECRET_KEY = "test-secret-key";
// F2: habilitar rutas de suscripción; F6: BASE_URL requerida
process.env.FLOW_SUSCRIPCIONES = "1";
process.env.FLOW_SUSCRIPCIONES_MODO = "sandbox";
process.env.FLOW_API_URL = "https://sandbox.flow.cl/api";
process.env.BASE_URL = "http://127.0.0.1:0";

const { sql, eq } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const S = await import("../shared/schema");
const { users } = await import("../shared/models/auth");
const { db } = await import("../server/db");
for (const stmt of await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(S as any))) {
  await db.run(sql.raw(stmt));
}
const {
  detalleCobroPlan,
  FLOW_PLAN_ESCOLAR_MENSUAL_ID,
  montoDelPlan,
} = await import("../shared/planPrices");
const { flowService } = await import("../server/flowService");
const FR = await import("../server/flowRoutes");
const { registerRoutes } = await import("../server/routes");

// 1. Catálogo y modalidad de cobro
for (const codigo of ["basica_plan_mensual", "media1_plan_mensual", "media2_plan_mensual"]) {
  assert.deepEqual(detalleCobroPlan(codigo), {
    modalidad: "mensual",
    monto: 70000,
    cuotas: 7,
    flowPlanId: FLOW_PLAN_ESCOLAR_MENSUAL_ID,
  });
  assert.equal(montoDelPlan(codigo), 70000);
}
assert.deepEqual(detalleCobroPlan("media1_plan"), {
  modalidad: "unico",
  monto: 416500,
  cuotas: 1,
  flowPlanId: null,
});
assert.deepEqual(detalleCobroPlan("paes_lenguaje, paes_ciencias"), {
  modalidad: "unico",
  monto: 360000,
  cuotas: 1,
  flowPlanId: null,
});
assert.equal(detalleCobroPlan("media1_plan_mensual, paes_lenguaje"), null);
assert.equal(detalleCobroPlan("plan_inventado"), null);
assert.equal(detalleCobroPlan(""), null);

// 2. Validación de firma en tiempo constante (HMAC real)
const firmar = (params: Record<string, any>) => {
  const txt = Object.keys(params)
    .filter((k) => k !== "s" && params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("");
  return crypto.createHmac("sha256", "test-secret-key").update(txt).digest("hex");
};
assert.equal(flowService.validateSignature({ invoiceId: "inv-1" }, firmar({ invoiceId: "inv-1" })), true);
assert.equal(flowService.validateSignature({ invoiceId: "inv-1" }, firmar({ invoiceId: "inv-2" })), false);
assert.equal(flowService.validateSignature({ invoiceId: "inv-1" }, "corta"), false);
assert.equal(flowService.validateSignature({ invoiceId: "inv-1" }, ""), false);

// 3. Mock sin red de Flow
let planExiste = false;
const planesCreados: any[] = [];
const clientesCreados: any[] = [];
const registrosTarjeta: any[] = [];
const suscripcionesCreadas: any[] = [];
const cancelaciones: any[] = [];
let regStatusMock: { status: number; customerId: string } = { status: 1, customerId: "" };
const facturasMock = new Map<string, { id: string; subscriptionId: string; amount: number; status: number; paidDate?: string }>();

// Mock tanto flowService (singleton) como subscriptionGateway (usado por rutas de suscripción)
const mockMethods = {
  getPlan: async (planId: string) => {
    if (!planExiste) throw new Error("Plan no existe");
    return { planId, name: "Barkley", currency: "CLP", amount: 70000, interval: 3, periods_number: 7, status: 1 };
  },
  createPlan: async (p: any) => {
    planExiste = true;
    planesCreados.push(p);
    return { ...p, status: 1 };
  },
  createCustomer: async (p: any) => {
    clientesCreados.push(p);
    return {
      customerId: `cust-${clientesCreados.length}`,
      created: "2027-03-01",
      email: p.email,
      name: p.name,
      externalId: p.externalId,
      status: "1",
    };
  },
  registerCustomerCard: async (p: any) => {
    const token = `reg-tok-${registrosTarjeta.length + 1}`;
    registrosTarjeta.push({ ...p, token });
    return { url: "https://sandbox.flow.cl/app/web/pay.php", token };
  },
  getCustomerRegisterStatus: async () => regStatusMock,
  createSubscription: async (p: any) => {
    const subscriptionId = `fsub-${suscripcionesCreadas.length + 1}`;
    suscripcionesCreadas.push({ ...p, subscriptionId });
    return { subscriptionId, planId: p.planId, customerId: p.customerId, status: 1, periods_number: p.periods_number };
  },
  getInvoice: async (invoiceId: string) => {
    const inv = facturasMock.get(invoiceId);
    if (!inv) throw new Error("Factura no encontrada");
    return inv;
  },
  cancelSubscription: async (subscriptionId: string, at_period_end?: 0 | 1) => {
    cancelaciones.push({ subscriptionId, at_period_end });
    return { subscriptionId, planId: FLOW_PLAN_ESCOLAR_MENSUAL_ID, customerId: "cust-1", status: 4 };
  },
};
Object.assign(flowService, mockMethods);
if (FR.subscriptionGateway) {
  Object.assign(FR.subscriptionGateway, mockMethods);
}

// Usuarios para probar cancelación admin
await db.insert(users).values([{ id: "adm" }, { id: "est" }]);
await db.insert(S.userProfiles).values([
  { userId: "adm", role: "admin" },
  { userId: "est", role: "student" },
]);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req: any, _res, next) => {
  const u = req.header("x-test-user");
  if (u) req.user = { id: u, claims: { sub: u } };
  next();
});
const server = createServer(app);
await registerRoutes(server, app);
await new Promise<void>((r) => server.listen(0, r));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

const call = async (method: string, path: string, body?: unknown, user?: string) => {
  const res = await fetch(base + path, {
    method,
    headers: { "content-type": "application/json", ...(user ? { "x-test-user": user } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null), text: async () => "" };
};

const nuevaReserva = async (id: string, selectedPlan: string) => {
  await db.insert(S.reservations).values({
    id,
    fullName: "Apoderado Prueba",
    rut: "11111111-1",
    email: "apo@gmail.com",
    phone: "+56911111111",
    dateOfBirth: "2012-05-10",
    programType: "focus",
    selectedPlan,
  } as any);
};

// 4. Pago único rechaza plan mensual; suscripción rechaza pago único
await nuevaReserva("res-mensual", "media1_plan_mensual");
await nuevaReserva("res-unico", "media1_plan");

const cpMensual = await call("POST", "/api/flow/create-payment", {
  reservationId: "res-mensual",
  studentEmail: "est@gmail.com",
  studentName: "Estudiante",
});
assert.equal(cpMensual.status, 400, "create-payment debe rechazar plan mensual");

const csUnico = await call("POST", "/api/flow/create-subscription", {
  reservationId: "res-unico",
  payerEmail: "apo@gmail.com",
  payerName: "Apoderado",
});
assert.equal(csUnico.status, 400, "create-subscription debe rechazar plan de pago único");

// 5. Crear suscripción mensual (ignora montos/cuotas del cliente, es idempotente en pending_card)
const cs1 = await call("POST", "/api/flow/create-subscription", {
  reservationId: "res-mensual",
  payerEmail: "apo@gmail.com",
  payerName: "Apoderado Prueba",
  amount: 1,
  periods_number: 99,
});
assert.equal(cs1.status, 200, JSON.stringify(cs1.json));
assert.equal(planesCreados.length, 1);
assert.equal(planesCreados[0].amount, 70000);
assert.equal(planesCreados[0].interval, 3);
assert.equal(planesCreados[0].periods_number, 7);
assert.equal(clientesCreados.length, 1);
assert.equal(cs1.json.amount, 70000);
assert.equal(cs1.json.periodsTotal, 7);
assert.equal(cs1.json.reused, false);

const cs2 = await call("POST", "/api/flow/create-subscription", {
  reservationId: "res-mensual",
  payerEmail: "apo@gmail.com",
  payerName: "Apoderado Prueba",
});
assert.equal(cs2.status, 200);
assert.equal(cs2.json.reused, true);
assert.equal(cs2.json.token, cs1.json.token);
assert.equal(clientesCreados.length, 1, "no debe crear cliente duplicado en pending_card");

// 6. Registro de tarjeta: se prueba directamente con completarRegistroTarjeta
// (el flujo HTTP completo de card-return se prueba en flow-concurrencia.check.ts)
const { completarRegistroTarjeta } = await import("../server/flowSubscriptions");

regStatusMock = { status: 1, customerId: "cust-1" };
const regOk = await completarRegistroTarjeta(db, flowService, cs1.json.token);
assert.equal(regOk.status, "active");
assert.equal(regOk.flowSubscriptionId, "fsub-1");
assert.equal(suscripcionesCreadas.length, 1);
assert.equal(suscripcionesCreadas[0].periods_number, 7);

// F3: después de completarRegistroTarjeta, la reserva NO está pagada (esperando primera factura)
const resDespuesCard = (await db.select().from(S.reservations).where(eq(S.reservations.id, "res-mensual")))[0];
assert.ok(
  resDespuesCard.paymentStatus !== "completed",
  "F3: después de completarRegistroTarjeta la reserva no debe tener paymentStatus=completed",
);

// La suscripción en la tabla debe estar active
const subDespuesCard = (await db.select().from(S.flowSubscriptions).where(eq(S.flowSubscriptions.reservationId, "res-mensual")))[0];
assert.equal(subDespuesCard.status, "active");
assert.equal(subDespuesCard.flowSubscriptionId, "fsub-1");

// Idempotencia: segunda llamada a completarRegistroTarjeta con mismo token
const regIdem = await completarRegistroTarjeta(db, flowService, cs1.json.token);
assert.equal(regIdem.alreadyActive, true);
assert.equal(suscripcionesCreadas.length, 1, "no debe crear suscripción duplicada");

// 7. Webhook: firma, validación de monto, deduplicación y 7 cuotas hasta completed
const noSig = await call("POST", "/api/flow/subscription-webhook", { invoiceId: "inv-1" });
assert.equal(noSig.status, 401);
const badSig = await call("POST", "/api/flow/subscription-webhook", { invoiceId: "inv-1", s: "firma-mala" });
assert.equal(badSig.status, 401);

// Monto incorrecto ($1 != $70.000)
facturasMock.set("inv-bad", { id: "inv-bad", subscriptionId: "fsub-1", amount: 1, status: 1 });
const whBadAmt = await call("POST", "/api/flow/subscription-webhook", {
  invoiceId: "inv-bad",
  s: firmar({ invoiceId: "inv-bad" }),
});
assert.equal(whBadAmt.status, 200);
assert.equal(whBadAmt.json.status, "past_due");
assert.equal(whBadAmt.json.periodsPaid, 0);

// Cuota 1 correcta + deduplicación
facturasMock.set("inv-1", { id: "inv-1", subscriptionId: "fsub-1", amount: 70000, status: 1, paidDate: "2027-03-05" });
const wh1 = await call("POST", "/api/flow/subscription-webhook", {
  invoiceId: "inv-1",
  s: firmar({ invoiceId: "inv-1" }),
});
assert.equal(wh1.status, 200);
assert.equal(wh1.json.periodsPaid, 1);
assert.equal(wh1.json.status, "active");

const wh1Dup = await call("POST", "/api/flow/subscription-webhook", {
  invoiceId: "inv-1",
  s: firmar({ invoiceId: "inv-1" }),
});
assert.equal(wh1Dup.status, 200);
assert.equal(wh1Dup.json.deduplicated, true);
assert.equal(wh1Dup.json.periodsPaid, 1, "factura repetida no debe sumar cuota");

// Cuotas 2..7 -> completed
for (let i = 2; i <= 7; i++) {
  const id = `inv-${i}`;
  facturasMock.set(id, { id, subscriptionId: "fsub-1", amount: 70000, status: 1, paidDate: `2027-0${i}-05` });
  const wh = await call("POST", "/api/flow/subscription-webhook", { invoiceId: id, s: firmar({ invoiceId: id }) });
  assert.equal(wh.status, 200);
  assert.equal(wh.json.periodsPaid, i);
  assert.equal(wh.json.status, i === 7 ? "completed" : "active");
}

// 8. Cancelación admin en suscripción activa aparte
await nuevaReserva("res-cancel", "basica_plan_mensual");
const csC = await call("POST", "/api/flow/create-subscription", {
  reservationId: "res-cancel",
  payerEmail: "apo@gmail.com",
  payerName: "Apoderado Dos",
});
regStatusMock = { status: 1, customerId: "cust-2" };
// Activar suscripción directamente
await completarRegistroTarjeta(db, flowService, csC.json.token);
const subCancelId = csC.json.subscriptionRecordId;

assert.equal((await call("POST", `/api/admin/flow/subscriptions/${subCancelId}/cancel`, {})).status, 401);
assert.equal((await call("POST", `/api/admin/flow/subscriptions/${subCancelId}/cancel`, {}, "est")).status, 403);
const cancelOk = await call("POST", `/api/admin/flow/subscriptions/${subCancelId}/cancel`, {}, "adm");
assert.equal(cancelOk.status, 200);
assert.equal(cancelOk.json.subscription.status, "cancelled");
assert.equal(cancelaciones.length, 1);

server.close();
console.log("flow-suscripciones: ok");
