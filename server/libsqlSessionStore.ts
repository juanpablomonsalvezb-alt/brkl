// Store de sesiones de express-session sobre la tabla `sessions` de LibSQL/Turso (M-R02).
// Sin estado en memoria ni temporizadores: sobrevive a cold starts y a varias instancias serverless.
import session from "express-session";
import type { Client } from "@libsql/client";

export interface OpcionesStoreSesion {
  ttlMs?: number;
  cleanupIntervalMs?: number;
}

const TTL_DEFECTO_MS = 7 * 24 * 60 * 60 * 1000;

export class LibSQLSessionStore extends session.Store {
  private listo: Promise<void> | null = null;
  private ultimaLimpieza = 0;
  private readonly ttlMs: number;
  private readonly cleanupIntervalMs: number;

  constructor(private readonly c: Client, opciones: OpcionesStoreSesion = {}) {
    super();
    this.ttlMs = opciones.ttlMs ?? TTL_DEFECTO_MS;
    this.cleanupIntervalMs = opciones.cleanupIntervalMs ?? 5 * 60 * 1000;
  }

  private asegurarTabla(): Promise<void> {
    if (!this.listo) {
      this.listo = (async () => {
        await this.c.execute("CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, sess TEXT NOT NULL, expire INTEGER NOT NULL)");
        await this.c.execute("CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire)");
      })().catch((e) => {
        this.listo = null;
        throw e;
      });
    }
    return this.listo;
  }

  private expiraEnSeg(sess: any): number {
    const maxAge = typeof sess?.cookie?.maxAge === "number" ? sess.cookie.maxAge : this.ttlMs;
    return Math.floor((Date.now() + maxAge) / 1000);
  }

  get(sid: string, callback: (err?: any, session?: any) => void): void {
    (async () => {
      await this.asegurarTabla();
      const r = await this.c.execute({ sql: "SELECT sess, expire FROM sessions WHERE sid = ?", args: [sid] });
      const fila = r.rows[0];
      if (!fila) return null;
      const n = Number(fila.expire);
      const expiraMs = n > 1e11 ? n : n * 1000;
      if (expiraMs < Date.now()) {
        await this.c.execute({ sql: "DELETE FROM sessions WHERE sid = ?", args: [sid] });
        return null;
      }
      return JSON.parse(String(fila.sess));
    })().then((s) => callback(null, s ?? undefined), (e) => callback(e));
  }

  set(sid: string, sess: any, callback?: (err?: any) => void): void {
    (async () => {
      await this.asegurarTabla();
      await this.c.execute({
        sql: "INSERT INTO sessions (sid, sess, expire) VALUES (?, ?, ?) ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expire = excluded.expire",
        args: [sid, JSON.stringify(sess), this.expiraEnSeg(sess)],
      });
      if (Date.now() - this.ultimaLimpieza > this.cleanupIntervalMs) {
        this.ultimaLimpieza = Date.now();
        await this.cleanup();
      }
    })().then(() => callback?.(), (e) => callback?.(e));
  }

  destroy(sid: string, callback?: (err?: any) => void): void {
    (async () => {
      await this.asegurarTabla();
      await this.c.execute({ sql: "DELETE FROM sessions WHERE sid = ?", args: [sid] });
    })().then(() => callback?.(), (e) => callback?.(e));
  }

  touch(sid: string, sess: any, callback?: (err?: any) => void): void {
    (async () => {
      await this.asegurarTabla();
      await this.c.execute({ sql: "UPDATE sessions SET expire = ? WHERE sid = ?", args: [this.expiraEnSeg(sess), sid] });
    })().then(() => callback?.(), (e) => callback?.(e));
  }

  async cleanup(nowMs = Date.now()): Promise<number> {
    await this.asegurarTabla();
    const r = await this.c.execute({ sql: "DELETE FROM sessions WHERE expire < ?", args: [Math.floor(nowMs / 1000)] });
    return r.rowsAffected;
  }
}
