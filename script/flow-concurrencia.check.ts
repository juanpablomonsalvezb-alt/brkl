// F3 + F4 + F5: Concurrencia, pago solo al confirmar factura, deduplicación por tabla.
// Base SQLite EN MEMORIA y pasarela Flow simulada (sin red).
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import crypto from "node:crypto";

if (process.env.NODE_ENV === "production") {
  throw new Error("flow-concurrencia.check no debe correr con NODE_ENV=production");
}
process.env.TEST_DATABASE_URL = ":memory:";
process.env.FLOW_API_KEY = "test-api-key";
process.env.FLOW_SECRET_KEY = "test-secret-key";

const { sql, eq } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const S = await import("../shared/schema");
const { db } = await import("../server/db");
for (const stmt of await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(S as any))) {
  await db.run(sql.raw(stmt));
}

const {
  detalleCobroPlan,
  FLOW_PLAN_ESCOLAR_MENSUAL_ID,
} = await import("../shared/planPrices");
const { flowService } = await import("../server/flowService");
const {
  completarRegistroTarjeta,
  FlowSubscriptionError,
  iniciarSuscripcionMensual,
  procesarWebhookSuscripcion,
} = await import("../server/flowSubscriptions");

// ─── Mock sin red ───
let planExiste = false;
const suscripcionesCreadas: any[] = [];
let regStatusMock = { status: 1, customerId: "" };
const facturasMock = new Map<string, any>();

(flowService as any).getPlan = async (planId: string) => {
  if (!planExiste) throw new Error("Plan no existe");
  return { planId, name: "Barkley", currency: "CLP", amount: 70000, interval: 3, periods_number: 7, status: 1 };
};
(flowService as any).createPlan = async (p: any) => {
  planExiste = true;
  return { ...p, status: 1 };
};
(flowService as any).createCustomer = async (p: any) => ({
  customerId: `cust-${p.externalId}`,
  created: "2027-03-01",
  email: p.email,
  name: p.name,
  externalId: p.externalId,
  status: "1",
});
(flowService as any).registerCustomerCard = async (p: any) => {
  return { url: "https://sandbox.flow.cl/app/web/pay.php", token: `reg-${p.customerId}` };
};
(flowService as any).getCustomerRegisterStatus = async () => regStatusMock;
(flowService as any).createSubscription = async (p: any) => {
  const subscriptionId = `fsub-${suscripcionesCreadas.length + 1}`;
  suscripcionesCreadas.push({ ...p, subscriptionId });
  return { subscriptionId, planId: p.planId, customerId: p.customerId, status: 1, periods_number: p.periods_number };
};
(flowService as any).getInvoice = async (invoiceId: string) => {
  const inv = facturasMock.get(invoiceId);
  if (!inv) throw new Error("Factura no encontrada");
  return inv;
};
(flowService as any).cancelSubscription = async () => ({});

const firmar = (params: Record<string, any>) => {
  const txt = Object.keys(params)
    .filter((k) => k !== "s" && params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("");
  return crypto.createHmac("sha256", "test-secret-key").update(txt).digest("hex");
};

// ─── Crear reserva ───
const resId = "res-conc-1";
await db.insert(S.reservations).values({
  id: resId,
  fullName: "Apoderado Conc",
  rut: "11111111-1",
  email: "apo@gmail.com",
  phone: "+56911111111",
  dateOfBirth: "2012-05-10",
  programType: "focus",
  selectedPlan: "media1_plan_mensual",
} as any);

// ─── Iniciar suscripción ───
const inicio = await iniciarSuscripcionMensual(db, flowService, {
  reservationId: resId,
  payerEmail: "apo@gmail.com",
  payerName: "Apoderado",
  baseUrl: "http://localhost:3000",
});
assert.equal(inicio.token, `reg-cust-${resId}`);
assert.equal(suscripcionesCreadas.length, 0, "iniciar no crea suscripción en Flow");

// ─── F4: doble card-return simultáneo = una creación en el mock ───
regStatusMock = { status: 1, customerId: `cust-${resId}` };

const [r1, r2] = await Promise.all([
  completarRegistroTarjeta(db, flowService, inicio.token),
  completarRegistroTarjeta(db, flowService, inicio.token),
]);

// Una de las dos debe haber creado la suscripción; la otra debe detectar que ya se procesó
assert.equal(suscripcionesCreadas.length, 1, "doble card-return debe crear UNA sola suscripción en Flow");
assert.equal(r1.status, "active" || r1.status === "active", "al menos uno debe quedar active");

// ─── F3: tarjeta registrada sin factura pagada = reserva sin pagar y sin matrícula ───
const [resDespuesCard] = await db.select().from(S.reservations).where(eq(S.reservations.id, resId));
// La reserva NO debe estar confirmed/completed porque aún no llegó la primera factura
// (F3: completarRegistroTarjeta ya no marca paymentStatus=completed)
assert.ok(
  resDespuesCard.paymentStatus !== "completed" || resDespuesCard.status !== "confirmed",
  "F3: después de card-return la reserva no debe estar pagada (esperando primera factura)",
);

// ─── Primera factura pagada = pagada y matriculada ───
const subRow = (await db.select().from(S.flowSubscriptions).where(eq(S.flowSubscriptions.reservationId, resId)))[0];
facturasMock.set("inv-1", {
  id: "inv-1",
  subscriptionId: subRow.flowSubscriptionId,
  amount: 70000,
  status: 1,
  paidDate: "2027-03-05",
});

const wh1 = await procesarWebhookSuscripcion(db, flowService, {
  invoiceId: "inv-1",
  s: firmar({ invoiceId: "inv-1" }),
});
assert.equal(wh1.periodsPaid, 1);
assert.equal(wh1.status, "active");

const [resDespuesFactura] = await db.select().from(S.reservations).where(eq(S.reservations.id, resId));
assert.equal(resDespuesFactura.paymentStatus, "completed", "F3: primera factura pagada → paymentStatus=completed");
assert.equal(resDespuesFactura.status, "confirmed" || resDespuesFactura.status === "enrolled", "F3: primera factura → reserva confirmada");

// ─── Reenvío de una factura vieja tras una nueva no suma cuota (F5 deduplicación) ───
facturasMock.set("inv-2", {
  id: "inv-2",
  subscriptionId: subRow.flowSubscriptionId,
  amount: 70000,
  status: 1,
  paidDate: "2027-04-05",
});
await procesarWebhookSuscripcion(db, flowService, {
  invoiceId: "inv-2",
  s: firmar({ invoiceId: "inv-2" }),
});

// Reenviar inv-1 → deduplicado
const wh1Dup = await procesarWebhookSuscripcion(db, flowService, {
  invoiceId: "inv-1",
  s: firmar({ invoiceId: "inv-1" }),
});
assert.equal(wh1Dup.deduplicated, true, "F5: factura vieja reenviada debe ser deduplicada");

const [subDespuesDup] = await db.select().from(S.flowSubscriptions).where(eq(S.flowSubscriptions.id, subRow.id));
assert.equal(subDespuesDup.periodsPaid, 2, "deduplicación no debe sumar cuota extra");

// ─── Factura pendiente no cambia estado (F5) ───
facturasMock.set("inv-pendiente", {
  id: "inv-pendiente",
  subscriptionId: subRow.flowSubscriptionId,
  amount: 70000,
  status: 0, // pendiente
});
const whPendiente = await procesarWebhookSuscripcion(db, flowService, {
  invoiceId: "inv-pendiente",
  s: firmar({ invoiceId: "inv-pendiente" }),
});
assert.notEqual(whPendiente.status, "past_due", "F5: factura pendiente no debe cambiar a past_due");

console.log("flow-concurrencia: ok");
