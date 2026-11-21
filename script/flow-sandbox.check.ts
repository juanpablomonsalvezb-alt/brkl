// Pruebas del Bloque C: guardia de URL Flow Sandbox (nunca www.flow.cl) + ciclo HTTP
// completo con validación real de firmas HMAC para suscripción mensual ($70.000 x 7).
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import { assertFlowSandboxUrl, FLOW_SANDBOX_API_URL } from "../shared/flowSandbox";
import { ejecutarCicloFlowHttpSimulado } from "../scripts/probar-flow-sandbox";

if (process.env.NODE_ENV === "production") {
  throw new Error("flow-sandbox.check no debe correr en producción");
}

// 1. Guardia de URL: solo https://sandbox.flow.cl/api (o localhost solo cuando allowLocalhostMock=true).
assert.equal(assertFlowSandboxUrl("https://sandbox.flow.cl/api"), FLOW_SANDBOX_API_URL);
assert.equal(assertFlowSandboxUrl("https://sandbox.flow.cl/api/"), FLOW_SANDBOX_API_URL);
assert.equal(
  assertFlowSandboxUrl("http://127.0.0.1:4555/api", { allowLocalhostMock: true }),
  "http://127.0.0.1:4555/api",
);

for (const urlProhibida of [
  "",
  "https://www.flow.cl/api",
  "https://flow.cl/api",
  "http://sandbox.flow.cl/api",
  "https://sandbox.flow.cl/otro",
  "http://127.0.0.1:4555/api",
  "no-es-url",
]) {
  assert.throws(() => assertFlowSandboxUrl(urlProhibida), `Debió rechazar ${urlProhibida}`);
}

// 2. Ciclo HTTP completo de FlowService contra API sandbox local emulada con verificación HMAC real.
const resumen = await ejecutarCicloFlowHttpSimulado();
assert.equal(resumen.periodsPaid, 1);
assert.equal(resumen.finalStatus, "cancelled");

console.log("flow-sandbox: ok");
