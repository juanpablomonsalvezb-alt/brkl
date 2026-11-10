// Fábrica única de conexión a la base (IMP-001). Es el único `createClient` del código de la
// aplicación (server/ y shared/); script/guardas.check.ts lo comprueba. Sin efectos al importar:
// server/db.ts arma el cliente de la aplicación, y las pruebas, sus bases desechables.
import { createClient, type Client } from "@libsql/client";

// Misma regla que tenía server/db.ts: Turso en producción, archivo local fuera de ella.
export function urlDesdeEntorno(env: NodeJS.ProcessEnv): string {
  return env.NODE_ENV === "production"
    ? env.TURSO_DATABASE_URL!
    : env.TEST_DATABASE_URL || "file:./db.sqlite";
}

export function crearClienteDb(url: string, authToken?: string): Client {
  return createClient({ url, authToken });
}

// libSQL trae las claves foráneas activas por omisión (E0, prueba D1, solo local). No se activan
// aquí porque por HTTP cada petición es otra conexión y el PRAGMA no persistiría: se exige que la
// conexión real las tenga activas, y si no, se falla. Turso remoto sigue sin verificar (A1).
export async function verificarClavesForaneas(c: Pick<Client, "execute">): Promise<void> {
  const r = await c.execute("PRAGMA foreign_keys");
  if (Number(r.rows[0]?.[0]) !== 1) {
    throw new Error("Integridad: las claves foráneas no están activas en esta conexión (PRAGMA foreign_keys ≠ 1)");
  }
}
