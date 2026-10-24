// Pagos (Flow): el monto lo fija el servidor y el webhook no confirma montos distintos.
// Base SQLite EN MEMORIA y Flow simulado (sin red). Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

if (process.env.NODE_ENV === "production") throw new Error("pagos.check no debe correr con NODE_ENV=production");
process.env.TEST_DATABASE_URL = ":memory:";

const { sql, eq } = await import("drizzle-orm");
const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
const S = await import("../shared/schema");
const { db } = await import("../server/db");
for (const stmt of await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(S as any))) {
  await db.run(sql.raw(stmt));
}
const { montoDelPlan } = await import("../shared/planPrices");
const { flowService } = await import("../server/flowService");
const { registerRoutes } = await import("../server/routes");

// Catálogo
assert.equal(montoDelPlan("media1_plan"), 280000);
assert.equal(montoDelPlan("paes_lenguaje, paes_ciencias"), 360000, "PAES suma asignaturas");
assert.equal(montoDelPlan("plan_inventado"), null);
assert.equal(montoDelPlan("paes_lenguaje, inventado"), null, "un plan inválido invalida todo");
assert.equal(montoDelPlan(""), null);

// Flow simulado: registra lo que se le pide y responde lo que la prueba indique.
const pedidos: { amount: number }[] = [];
let estadoFlow = { flowOrder: 0, status: 2, amount: 0 };
(flowService as any).createPayment = async (p: { amount: number }) => {
  pedidos.push(p);
  return { url: "https://flow.example/pay", token: "tok-" + pedidos.length, flowOrder: 1000 + pedidos.length };
};
(flowService as any).validateSignature = () => true;
(flowService as any).getPaymentStatus = async () => estadoFlow;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const server = createServer(app);
await registerRoutes(server, app);
await new Promise<void>((r) => server.listen(0, r));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
const post = async (path: string, body: unknown) => {
  const res = await fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: res.status, json: await res.json().catch(() => null) };
};
const fila = async (id: string) => (await db.select().from(S.reservations).where(eq(S.reservations.id, id)))[0];
const nueva = async (id: string, selectedPlan: string) => {
  await db.insert(S.reservations).values({ id, fullName: "Ficticio", rut: "1-9", email: "f@ejemplo.invalid", phone: "1", dateOfBirth: "2010-01-01", programType: "focus", selectedPlan } as any);
};

// 1. Reserva pública: los campos de pago enviados por el cliente se descartan.
const r = await post("/api/reservations", {
  fullName: "Ficticio", rut: "11111111-1", email: "f@ejemplo.invalid", phone: "1", dateOfBirth: "2010-01-01", programType: "focus",
  selectedPlan: "media1_plan", paymentStatus: "completed", flowOrder: "999", flowToken: "x", paymentAmount: 1, status: "confirmed",
});
assert.equal(r.status, 201, JSON.stringify(r.json));
const creada = await fila(r.json.id);
assert.deepEqual([creada.paymentStatus, creada.flowOrder, creada.flowToken, creada.paymentAmount], [null, null, null, null], "sin campos de pago del cliente");
assert.notEqual(creada.status, "confirmed");

// 2. create-payment: el monto sale del plan, no del planPrice del cliente.
await nueva("res-1", "media1_plan");
const pago = await post("/api/flow/create-payment", { reservationId: "res-1", planPrice: "$1", studentEmail: "estudiante@gmail.com", studentName: "Ficticio" });
assert.equal(pago.status, 200, JSON.stringify(pago.json));
assert.equal(pedidos.at(-1)!.amount, 280000, "monto del catálogo, no $1");
assert.equal((await fila("res-1")).paymentAmount, 280000);
await nueva("res-2", "plan_inventado");
assert.equal((await post("/api/flow/create-payment", { reservationId: "res-2", studentEmail: "estudiante@gmail.com", studentName: "F" })).status, 400, "plan inválido");

// 3. Webhook: monto pagado distinto del esperado → no confirma (ni matricula).
const orden = (await fila("res-1")).flowOrder!;
estadoFlow = { flowOrder: Number(orden), status: 2, amount: 1 };
assert.equal((await post("/api/flow/confirm", { token: "t", s: "firma" })).status, 200);
assert.deepEqual([(await fila("res-1")).paymentStatus, (await fila("res-1")).status], ["failed", "pending"], "monto incorrecto no confirma");
// Monto correcto → confirma.
await db.update(S.reservations).set({ paymentStatus: "pending" }).where(eq(S.reservations.id, "res-1"));
estadoFlow = { flowOrder: Number(orden), status: 2, amount: 280000 };
await post("/api/flow/confirm", { token: "t", s: "firma" });
assert.deepEqual([(await fila("res-1")).paymentStatus, (await fila("res-1")).status], ["completed", "confirmed"]);

server.close();
console.log("pagos: ok");
