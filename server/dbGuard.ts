// Barrera de aislamiento: en Vercel Preview solo se permite la base de pruebas.
// Valida la URL efectiva (la que usará createClient), no solo que exista una variable:
// - DB_ENTORNO debe ser "pruebas";
// - el host debe ser el de la base de pruebas (brkl-preview-*.turso.io);
// - DB_PREVIEW_HOST debe coincidir exactamente con ese host (confirmación explícita).
// Fuera de Preview no hace nada.

export const PREVIEW_HOST_PATTERN = /^brkl-preview-[a-z0-9-]+\.[a-z0-9-]+\.turso\.io$/;

export function assertPreviewDatabase(env: NodeJS.ProcessEnv, effectiveUrl: string | undefined): void {
  if (env.VERCEL_ENV !== "preview") return;
  const fail = (motivo: string): never => {
    throw new Error(`Preview bloqueado: ${motivo}. No se conecta a ninguna base de datos.`);
  };
  if (env.DB_ENTORNO !== "pruebas") fail("DB_ENTORNO no confirma la base de pruebas");
  if (!effectiveUrl) fail("falta la URL de la base");
  let host: string;
  try {
    host = new URL(effectiveUrl!).hostname;
  } catch {
    return fail("URL de base inválida");
  }
  if (!PREVIEW_HOST_PATTERN.test(host)) fail("el host no corresponde a la base de pruebas");
  if (env.DB_PREVIEW_HOST !== host) fail("DB_PREVIEW_HOST no coincide con el host efectivo");
}
