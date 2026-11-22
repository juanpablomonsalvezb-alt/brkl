// Guardia de seguridad para pruebas con Flow.cl: impide apuntar a producción (www.flow.cl).
// F1: Factoría crearPasarelaSuscripciones con modo explícito (sandbox por omisión).

export const FLOW_SANDBOX_API_URL = "https://sandbox.flow.cl/api";

export interface AssertFlowSandboxOptions {
  /** Permite solo endpoints HTTP locales efímeros (127.0.0.1 / localhost) en pruebas simuladas. */
  allowLocalhostMock?: boolean;
}

/**
 * Valida que la URL base de Flow corresponda exclusivamente al sandbox oficial
 * (https://sandbox.flow.cl/api) o, si se habilita explícitamente, a localhost para tests.
 * Rechaza www.flow.cl y cualquier otro dominio externo.
 */
export function assertFlowSandboxUrl(url: string, options: AssertFlowSandboxOptions = {}): string {
  const raw = (url || "").trim();
  if (!raw) {
    throw new Error("FLOW_API_URL vacía: se requiere https://sandbox.flow.cl/api");
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`FLOW_API_URL inválida: ${raw}`);
  }

  const host = parsed.hostname.toLowerCase();
  const pathNormalized = parsed.pathname.replace(/\/+$/, "");

  if (options.allowLocalhostMock && parsed.protocol === "http:" && (host === "127.0.0.1" || host === "localhost")) {
    return `${parsed.origin}${pathNormalized}`;
  }

  if (parsed.protocol !== "https:" || host !== "sandbox.flow.cl" || pathNormalized !== "/api") {
    throw new Error(
      `URL de Flow bloqueada por guardia sandbox (${raw}): solo se permite ${FLOW_SANDBOX_API_URL}`,
    );
  }

  return FLOW_SANDBOX_API_URL;
}

// ─── F1: Pasarela de suscripciones con modo explícito ─────────────────────────

/** Modo de operación de las suscripciones: sandbox (seguro) o produccion (requiere triple confirmación). */
export type FlowSuscripcionesModo = "sandbox" | "produccion";

/**
 * Factoría que devuelve un objeto FlowService configurado exclusivamente para las rutas de
 * suscripción mensual.  Lee `FLOW_SUSCRIPCIONES_MODO` del entorno (sandbox por omisión).
 *
 * - `sandbox`: la URL debe pasar `assertFlowSandboxUrl` (solo https://sandbox.flow.cl/api).
 * - `produccion`: exige NODE_ENV=production, VERCEL_ENV=production y
 *   FLOW_SUSCRIPCIONES_CONFIRMO_PRODUCCION=si; si falta cualquiera, lanza error.
 *
 * El singleton `flowService` (pago único) NO se ve afectado.
 */
export function crearPasarelaSuscripciones(env?: NodeJS.ProcessEnv) {
  const e = env ?? process.env;
  const modo: FlowSuscripcionesModo = (e.FLOW_SUSCRIPCIONES_MODO as FlowSuscripcionesModo) ?? "sandbox";

  if (modo === "sandbox") {
    const url = assertFlowSandboxUrl(e.FLOW_API_URL ?? "");
    return {
      modo,
      apiUrl: url,
      apiKey: e.FLOW_API_KEY ?? "",
      secretKey: e.FLOW_SECRET_KEY ?? "",
    };
  }

  /* modo === "produccion" */
  if (e.NODE_ENV !== "production") {
    throw new Error(
      "FLOW_SUSCRIPCIONES_MODO=produccion requiere NODE_ENV=production",
    );
  }
  if (e.VERCEL_ENV !== "production") {
    throw new Error(
      "FLOW_SUSCRIPCIONES_MODO=produccion requiere VERCEL_ENV=production",
    );
  }
  if (e.FLOW_SUSCRIPCIONES_CONFIRMO_PRODUCCION !== "si") {
    throw new Error(
      "FLOW_SUSCRIPCIONES_MODO=produccion requiere FLOW_SUSCRIPCIONES_CONFIRMO_PRODUCCION=si",
    );
  }

  const rawUrl = (e.FLOW_API_URL ?? "").trim().replace(/\/+$/, "");
  return {
    modo,
    apiUrl: rawUrl,
    apiKey: e.FLOW_API_KEY ?? "",
    secretKey: e.FLOW_SECRET_KEY ?? "",
  };
}

/** Resultado de `crearPasarelaSuscripciones`. */
export interface PasarelaSuscripcionesConfig {
  modo: FlowSuscripcionesModo;
  apiUrl: string;
  apiKey: string;
  secretKey: string;
}
