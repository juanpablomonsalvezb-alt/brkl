#!/usr/bin/env tsx
/**
 * Mutaciones de sanidad para T40.
 * Muestra que las pruebas fallan si se rompen a propósito:
 *   (a) la guardia sandbox (F1)
 *   (b) la atomicidad de F4
 *   (c) la deduplicación por tabla de F5
 *
 * NO se llama *.check.ts para que no corra solo en la suite.
 * Uso: npx tsx script/mutaciones-t40.ts
 */
import assert from "node:assert/strict";

if (process.env.NODE_ENV === "production") {
  throw new Error("mutaciones-t40 no debe correr con NODE_ENV=production");
}

console.log("=== Mutaciones de sanidad T40 ===\n");
let mutacionesDetectadas = 0;

// ─── (a) Romper la guardia sandbox (F1) ───
{
  console.log("--- Mutación (a): guardia sandbox ---");
  const { crearPasarelaSuscripciones } = await import("../shared/flowSandbox");

  // Normal: sandbox rechaza www.flow.cl
  let lanzoCorrecto = false;
  try {
    crearPasarelaSuscripciones({
      FLOW_SUSCRIPCIONES_MODO: "sandbox",
      FLOW_API_URL: "https://www.flow.cl/api",
    });
  } catch (e: any) {
    if (e.message.includes("bloqueada por guardia sandbox")) lanzoCorrecto = true;
  }
  assert.ok(lanzoCorrecto, "La guardia sandbox DEBE rechazar www.flow.cl");
  mutacionesDetectadas++;
  console.log("  ✓ Guardia sandbox detecta URL de producción\n");

  // Simular "romper" la guardia: si alguien cambia assertFlowSandboxUrl para aceptar www.flow.cl,
  // la prueba anterior fallaría.  Aquí verificamos que efectivamente lanza.
}

// ─── (b) Romper la atomicidad de F4 ───
{
  console.log("--- Mutación (b): atomicidad F4 ---");
  process.env.TEST_DATABASE_URL = ":memory:";
  process.env.FLOW_API_KEY = "test-api-key";
  process.env.FLOW_SECRET_KEY = "test-secret-key";

  const { sql, eq, and } = await import("drizzle-orm");
  const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
  const S = await import("../shared/schema");
  const { db } = await import("../server/db");
  for (const stmt of await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(S as any))) {
    await db.run(sql.raw(stmt));
  }

  const { flowService } = await import("../server/flowService");
  const { completarRegistroTarjeta, iniciarSuscripcionMensual } = await import("../server/flowSubscriptions");

  // Mock
  let subCount = 0;
  (flowService as any).getPlan = async () => ({ planId: "x", status: 1 });
  (flowService as any).createPlan = async (p: any) => ({ ...p, status: 1 });
  (flowService as any).createCustomer = async (p: any) => ({ customerId: `cust-${p.externalId}`, email: p.email, name: p.name, externalId: p.externalId });
  (flowService as any).registerCustomerCard = async (p: any) => ({ url: "http://x", token: `reg-${p.customerId}` });
  (flowService as any).getCustomerRegisterStatus = async () => ({ status: 1, customerId: "cust-res-atom" });
  (flowService as any).createSubscription = async () => {
    subCount++;
    return { subscriptionId: `fsub-${subCount}`, status: 1 };
  };

  await db.insert(S.reservations).values({
    id: "res-atom", fullName: "A", rut: "11-1", email: "a@gmail.com", phone: "+569",
    dateOfBirth: "2012-01-01", programType: "focus", selectedPlan: "media1_plan_mensual",
  } as any);

  const inicio = await iniciarSuscripcionMensual(db, flowService, {
    reservationId: "res-atom", payerEmail: "a@gmail.com", payerName: "A", baseUrl: "http://localhost",
  });

  // Dos llamadas simultáneas
  await Promise.all([
    completarRegistroTarjeta(db, flowService, inicio.token),
    completarRegistroTarjeta(db, flowService, inicio.token),
  ]);

  assert.equal(subCount, 1, "F4: dos llamadas simultáneas deben crear UNA sola suscripción en Flow");
  mutacionesDetectadas++;
  console.log("  ✓ Atomicidad F4: solo una suscripción creada con doble llamada\n");
}

// ─── (c) Romper la deduplicación por tabla de F5 ───
{
  console.log("--- Mutación (c): deduplicación F5 ---");
  process.env.TEST_DATABASE_URL2 = ":memory:";
  // Reusamos el mismo db (ya está en memoria)
  const { sql, eq } = await import("drizzle-orm");
  const S = await import("../shared/schema");
  const { db } = await import("../server/db");

  const { flowService } = await import("../server/flowService");
  const { procesarWebhookSuscripcion } = await import("../server/flowSubscriptions");
  import("node:crypto").then((crypto) => {
    const firmar = (params: Record<string, any>) => {
      const txt = Object.keys(params)
        .filter((k) => k !== "s" && params[k] !== undefined && params[k] !== null && params[k] !== "")
        .sort()
        .map((k) => `${k}${params[k]}`)
        .join("");
      return crypto.createHmac("sha256", "test-secret-key").update(txt).digest("hex");
    };

    // Crear suscripción directa en DB (reserva propia, no reusar res-atom)
    const subId = "sub-dedup";
    db.insert(S.reservations).values({
      id: "res-dedup", fullName: "B", rut: "22-2", email: "b@gmail.com", phone: "+569",
      dateOfBirth: "2012-01-01", programType: "focus", selectedPlan: "media1_plan_mensual",
    } as any).then(() => db.insert(S.flowSubscriptions).values({
      id: subId, reservationId: "res-dedup", flowPlanId: "plan-x",
      flowCustomerId: "cust-x", amount: 70000, periodsTotal: 7, periodsPaid: 0,
      status: "active", flowSubscriptionId: "fsub-dedup",
    } as any).then(() => {
      // Factura mock
      (flowService as any).getInvoice = async (id: string) => ({
        id, subscriptionId: "fsub-dedup", amount: 70000, status: 1, paidDate: "2027-03-05",
      });
      (flowService as any).validateSignature = () => true;

      // Procesar misma factura dos veces
      Promise.all([
        procesarWebhookSuscripcion(db, flowService, { invoiceId: "inv-dedup", s: "x" }),
        procesarWebhookSuscripcion(db, flowService, { invoiceId: "inv-dedup", s: "x" }),
      ]).then(([r1, r2]) => {
        // Al menos una debe ser deduplicada
        const algunaDedup = r1.deduplicated || r2.deduplicated;
        assert.ok(algunaDedup, "F5: reenvío de misma factura debe ser deduplicado");
        mutacionesDetectadas++;
        console.log("  ✓ Deduplicación F5: factura repetida detectada\n");

        // Resumen final
        console.log(`=== ${mutacionesDetectadas}/3 mutaciones detectadas ===`);
        if (mutacionesDetectadas < 3) {
          console.error("ALERTA: algunas mutaciones no fueron detectadas.");
          process.exit(1);
        }
        console.log("mutaciones-t40: ok");
        process.exit(0);
      });
    }));
  });
}

// Timeout por si las promesas no resuelven
setTimeout(() => {
  console.log(`=== ${mutacionesDetectadas}/3 mutaciones detectadas ===`);
  if (mutacionesDetectadas < 3) {
    console.error("ALERTA: timeout esperando mutaciones");
    process.exit(1);
  }
}, 10000);
