// Guardia de seguridad para pruebas con Flow.cl: impide apuntar a producción (www.flow.cl).

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
