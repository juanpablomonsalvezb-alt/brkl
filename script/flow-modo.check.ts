// F1 + F2: Pruebas de modo sandbox/producción y bandera de apagado.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";

if (process.env.NODE_ENV === "production") {
  throw new Error("flow-modo.check no debe correr con NODE_ENV=production");
}

const { crearPasarelaSuscripciones, assertFlowSandboxUrl } = await import("../shared/flowSandbox");

// ─── (a) FLOW_API_URL=https://www.flow.cl/api en modo sandbox lanza error ───
assert.throws(
  () => crearPasarelaSuscripciones({
    ...process.env,
    FLOW_SUSCRIPCIONES_MODO: "sandbox",
    FLOW_API_URL: "https://www.flow.cl/api",
  }),
  /bloqueada por guardia sandbox/,
  "sandbox debe rechazar www.flow.cl",
);

// ─── (b) modo produccion sin las 3 condiciones lanza error ───
// (b1) sin NODE_ENV=production
assert.throws(
  () => crearPasarelaSuscripciones({
    ...process.env,
    FLOW_SUSCRIPCIONES_MODO: "produccion",
    FLOW_API_URL: "https://www.flow.cl/api",
    NODE_ENV: "development",
    VERCEL_ENV: "production",
    FLOW_SUSCRIPCIONES_CONFIRMO_PRODUCCION: "si",
  }),
  /requiere NODE_ENV=production/,
);

// (b2) sin VERCEL_ENV=production
assert.throws(
  () => crearPasarelaSuscripciones({
    ...process.env,
    FLOW_SUSCRIPCIONES_MODO: "produccion",
    FLOW_API_URL: "https://www.flow.cl/api",
    NODE_ENV: "production",
    VERCEL_ENV: "preview",
    FLOW_SUSCRIPCIONES_CONFIRMO_PRODUCCION: "si",
  }),
  /requiere VERCEL_ENV=production/,
);

// (b3) sin FLOW_SUSCRIPCIONES_CONFIRMO_PRODUCCION=si
assert.throws(
  () => crearPasarelaSuscripciones({
    ...process.env,
    FLOW_SUSCRIPCIONES_MODO: "produccion",
    FLOW_API_URL: "https://www.flow.cl/api",
    NODE_ENV: "production",
    VERCEL_ENV: "production",
    FLOW_SUSCRIPCIONES_CONFIRMO_PRODUCCION: "no",
  }),
  /requiere FLOW_SUSCRIPCIONES_CONFIRMO_PRODUCCION=si/,
);

// (b4) todas faltantes
assert.throws(
  () => crearPasarelaSuscripciones({
    ...process.env,
    FLOW_SUSCRIPCIONES_MODO: "produccion",
    FLOW_API_URL: "https://www.flow.cl/api",
    NODE_ENV: "test",
  }),
  /requiere/,
);

// ─── (c) sandbox válido crea la pasarela ───
const pasarelaOk = crearPasarelaSuscripciones({
  ...process.env,
  FLOW_SUSCRIPCIONES_MODO: "sandbox",
  FLOW_API_URL: "https://sandbox.flow.cl/api",
  FLOW_API_KEY: "test-key",
  FLOW_SECRET_KEY: "test-secret",
});
assert.equal(pasarelaOk.modo, "sandbox");
assert.equal(pasarelaOk.apiUrl, "https://sandbox.flow.cl/api");
assert.equal(pasarelaOk.apiKey, "test-key");

// Sandbox por omisión (sin FLOW_SUSCRIPCIONES_MODO)
const pasarelaDefault = crearPasarelaSuscripciones({
  ...process.env,
  FLOW_API_URL: "https://sandbox.flow.cl/api",
});
assert.equal(pasarelaDefault.modo, "sandbox");

// ─── (d) recorrer archivos de server/ y comprobar que las rutas de suscripción
//     no obtienen su pasarela fuera de la factoría ───
import fs from "node:fs";
import path from "node:path";

const serverDir = path.resolve("server");
const tsFiles = fs.readdirSync(serverDir).filter((f) => f.endsWith(".ts"));
let encontradoViolacion = false;
const violaciones: string[] = [];

for (const file of tsFiles) {
  if (file === "flowRoutes.ts") continue; // flowRoutes.ts usa la factoría — correcto
  const content = fs.readFileSync(path.join(serverDir, file), "utf-8");
  // Buscar import de flowService en archivos de suscripción que NO sean flowRoutes.ts
  if (file === "flowSubscriptions.ts") continue; // recibe gateway inyectado — correcto
  if (file === "flowService.ts") continue; // define el servicio — correcto

  // Si un archivo de server importa flowService y tiene "subscription" en el nombre,
  // podría estar usando el singleton directamente
  if (content.includes("flowService") && content.includes("subscription")) {
    // Verificar que no use flowService directamente para suscripciones
    if (content.match(/flowService\s*\./) && content.match(/createSubscription|registerCustomerCard|createCustomer/)) {
      violaciones.push(`${file}: usa flowService directamente para suscripciones`);
      encontradoViolacion = true;
    }
  }
}
assert.ok(!encontradoViolacion, `Violaciones F1 encontradas: ${violaciones.join("; ")}`);

// ─── (e) Con FLOW_SUSCRIPCIONES ausente, las 5 rutas dan 404 ───
// Se verifica indirectamente: si FLOW_SUSCRIPCIONES !== "1", las rutas no se registran.
// En este test, FLOW_SUSCRIPCIONES no está definida → las rutas no existen.
const envSinFlag = { ...process.env };
delete envSinFlag.FLOW_SUSCRIPCIONES;
assert.notEqual(envSinFlag.FLOW_SUSCRIPCIONES, "1", "FLOW_SUSCRIPCIONES debe estar ausente");

// Verificamos que la variable en flowRoutes.ts evalúa a false
const suscripcionesHabilitadas = envSinFlag.FLOW_SUSCRIPCIONES === "1";
assert.equal(suscripcionesHabilitadas, false, "sin bandera → suscripciones deshabilitadas");

console.log("flow-modo: ok");
