// Reloj inyectable del motor (IMP-004). Decisión D6/D7 de la usuaria (2026-11-10): la autoridad
// temporal para publicar y asignar es el reloj de la base, no el de la aplicación.
// Los módulos del motor reciben un Reloj y nunca llaman a Date.now() ni a new Date() para decidir
// (script/reloj.check.ts lo comprueba).
import type { Client, Transaction } from "@libsql/client";

export interface Reloj {
  /** Segundos UTC con fracción. */
  ahora(): Promise<number>;
}

// Lee el reloj en la misma conexión o transacción que usará el valor.
export function relojMotor(c: Pick<Client | Transaction, "execute">): Reloj {
  return {
    async ahora() {
      const r = await c.execute("SELECT unixepoch('subsec')");
      return Number(r.rows[0][0]);
    },
  };
}

// Solo pruebas: reloj determinista que avanza cuando se le pide.
export function relojSimulado(inicio: number) {
  let t = inicio;
  return {
    async ahora() { return t; },
    avanzar(segundos: number) { t += segundos; },
    fijar(valor: number) { t = valor; },
  };
}
