// IMP-001: conexión única con claves foráneas activas y verificadas, en cada modo de conexión, e
// integridad transaccional de db.batch. Bases desechables (archivo y sqld en 127.0.0.1).
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import type { Client } from "@libsql/client";
import { verificarClavesForaneas } from "../server/cliente";
import { asegurarIntegridad } from "../server/migrar";
import { baseArchivo, baseSqld, type BasePrueba } from "./lib/basePrueba";

const huerfano = (id: string) => ({ sql: "INSERT INTO hijo (id, padre) VALUES (?, 'no-existe')", args: [id] });
const rechazaFK = async (f: () => Promise<unknown>, modo: string) =>
  assert.rejects(f, /FOREIGN KEY/, `${modo}: el hijo huérfano debió rechazarse`);

async function modos(b: BasePrueba, etiqueta: string): Promise<string[]> {
  const c = b.client;
  await c.batch([
    "CREATE TABLE padre (id TEXT PRIMARY KEY)",
    "CREATE TABLE hijo (id TEXT PRIMARY KEY, padre TEXT NOT NULL REFERENCES padre(id))",
  ], "write");
  const vistos: string[] = [];
  const probar = async (modo: string, cli: Client, insertar: (id: string) => Promise<unknown>) => {
    await verificarClavesForaneas(cli);
    await rechazaFK(() => insertar(`${etiqueta}-${modo}`), `${etiqueta}/${modo}`);
    vistos.push(modo);
  };
  await probar("execute", c, (id) => c.execute(huerfano(id)));
  await probar("batch", c, (id) => c.batch([huerfano(id)], "write"));
  await probar("transaccion", c, async (id) => {
    const t = await c.transaction("write");
    try { await t.execute(huerfano(id)); await t.commit(); } catch (e) { await t.rollback().catch(() => {}); throw e; }
  });
  // Tras una transacción, el cliente embebido abre otra conexión: debe seguir con FK activas.
  await probar("conexion_tras_transaccion", c, (id) => c.execute(huerfano(id)));
  const otra = b.nueva();
  await probar("cliente_nuevo", otra, (id) => otra.execute(huerfano(id)));

  // Integridad transaccional: un lote con un huérfano no deja nada escrito.
  await assert.rejects(c.batch([
    "INSERT INTO padre (id) VALUES ('p-lote')",
    huerfano(`${etiqueta}-lote`),
  ], "write"), /FOREIGN KEY/);
  const quedo = await c.execute("SELECT count(*) FROM padre WHERE id = 'p-lote'");
  assert.equal(Number(quedo.rows[0][0]), 0, `${etiqueta}: el lote fallido no debe dejar el padre`);
  vistos.push("lote_atomico");

  // Persistencia: lo confirmado se lee desde otra conexión.
  await c.batch(["INSERT INTO padre (id) VALUES ('p-ok')", "INSERT INTO hijo (id, padre) VALUES ('h-ok', 'p-ok')"], "write");
  const lectora = b.nueva();
  const leido = await lectora.execute("SELECT padre FROM hijo WHERE id = 'h-ok'");
  assert.equal(String(leido.rows[0]?.[0]), "p-ok", `${etiqueta}: lo confirmado debe leerse desde otra conexión`);
  vistos.push("persistencia");
  return vistos;
}

const archivo = baseArchivo();
try {
  const vistos = await modos(archivo, "archivo");

  // Control de eficacia: con las FK apagadas en la conexión, la verificación falla y el arranque
  // estricto se detiene; el no estricto (producción, hasta A1) solo registra.
  const apagada = archivo.nueva();
  await apagada.execute("PRAGMA foreign_keys = OFF");
  await assert.rejects(verificarClavesForaneas(apagada), /claves foráneas no están activas/);
  await assert.rejects(asegurarIntegridad(apagada, { estricto: true }), /claves foráneas/);
  const errores: string[] = [];
  const original = console.error;
  console.error = (m: string) => { errores.push(m); };
  try { await asegurarIntegridad(apagada, { estricto: false }); } finally { console.error = original; }
  assert.equal(errores.length, 1, "en modo no estricto se registra el error");
  console.log(`db-fk archivo: ${vistos.join(", ")}`);
} finally {
  await archivo.cerrar();
}

const sqld = await baseSqld();
if (!sqld) {
  if (process.env.VORTICE_EXIGIR_SQLD === "1") throw new Error("sqld no instalado y VORTICE_EXIGIR_SQLD=1");
  console.log("db-fk sqld: OMITIDA (sqld no instalado; definir SQLD_BIN)");
} else {
  try {
    console.log(`db-fk sqld: ${(await modos(sqld, "sqld")).join(", ")}`);
  } finally {
    await sqld.cerrar();
  }
}
console.log("db-fk: ok");
