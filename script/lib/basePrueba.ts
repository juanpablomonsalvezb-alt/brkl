// Bases desechables para los *checks* del motor (IMP-005). Siempre locales: la guarda de
// server/dbGuard.ts (IMP-007) se aplica antes de crear cualquier cliente.
import type { Client } from "@libsql/client";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { crearClienteDb } from "../../server/cliente";
import { assertBaseLocal } from "../../server/dbGuard";

export interface BasePrueba { url: string; client: Client; nueva(): Client; cerrar(): Promise<void> }

// Archivo temporal: libSQL embebido, el modo de las pruebas y de desarrollo.
export function baseArchivo(): BasePrueba {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-base-"));
  const url = `file:${path.join(dir, "base.db")}`;
  assertBaseLocal(process.env, url);
  const abiertos: Client[] = [];
  const nueva = () => { const c = crearClienteDb(url); abiertos.push(c); return c; };
  const client = nueva();
  return {
    url, client, nueva,
    async cerrar() { for (const c of abiertos) c.close(); fs.rmSync(dir, { recursive: true, force: true }); },
  };
}

const puertoLibre = () => new Promise<number>((ok, mal) => {
  const s = net.createServer().listen(0, "127.0.0.1", () => {
    const { port } = s.address() as net.AddressInfo;
    s.close(() => ok(port));
  }).on("error", mal);
});

// sqld nativo en 127.0.0.1, el mismo servidor que usa Turso. Devuelve null si no está instalado.
export async function baseSqld(): Promise<BasePrueba | null> {
  const bin = process.env.SQLD_BIN ?? path.join(os.homedir(), ".turso", "sqld");
  if (!fs.existsSync(bin)) return null;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-sqld-"));
  const port = await puertoLibre();
  const url = `http://127.0.0.1:${port}`;
  assertBaseLocal(process.env, url);
  const proc = spawn(bin, ["--http-listen-addr", `127.0.0.1:${port}`, "--db-path", path.join(dir, "sqld.db")], {
    stdio: "ignore",
    env: { PATH: process.env.PATH ?? "", HOME: dir },
  });
  const abiertos: Client[] = [];
  const nueva = () => { const c = crearClienteDb(url); abiertos.push(c); return c; };
  const terminado = new Promise<void>((r) => proc.once("exit", () => r()));
  const cerrar = async () => {
    for (const c of abiertos) c.close();
    if (proc.exitCode === null && proc.signalCode === null) proc.kill();
    await terminado;
    fs.rmSync(dir, { recursive: true, force: true });
  };
  const client = nueva();
  for (let i = 0; ; i++) {
    try { await client.execute("SELECT 1"); break; } catch (e) {
      if (i >= 100) { await cerrar(); throw new Error(`sqld no respondió en ${url}: ${(e as Error).message}`); }
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return { url, client, nueva, cerrar };
}
