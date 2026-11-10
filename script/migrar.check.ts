// IMP-002 y IMP-003: runner de migraciones con SQL propio, registro con suma de verificación,
// protección de triggers e índices, y detección de deriva. Bases desechables.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { asegurarIntegridad, leerMigraciones, migrar, REGISTRO, verificarDeriva } from "../server/migrar";
import { baseArchivo } from "./lib/basePrueba";

const BR = "\n--> statement-breakpoint\n";
const M1 = [
  "CREATE TABLE m_padre (id TEXT PRIMARY KEY)",
  "CREATE TABLE m_hijo (id TEXT PRIMARY KEY, padre TEXT NOT NULL REFERENCES m_padre(id))",
  "CREATE INDEX m_hijo_padre ON m_hijo (padre)",
  "CREATE TRIGGER m_hijo_sin_delete BEFORE DELETE ON m_hijo BEGIN SELECT RAISE(ABORT, 'm_hijo es solo inserción'); END",
].join(BR);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vortice-mig-"));
const escribir = (nombre: string, texto: string) => fs.writeFileSync(path.join(dir, nombre), texto);
const triggers = async (c: any) => (await c.execute("SELECT name FROM sqlite_master WHERE type = 'trigger' ORDER BY name")).rows.map((r: any) => String(r.name));
const registradas = async (c: any) => Number((await c.execute(`SELECT count(*) FROM ${REGISTRO}`)).rows[0][0]);

const b = baseArchivo();
const c = b.client;
try {
  // Base sin migraciones del motor: sin registro, sin deriva, sin escribir nada.
  assert.deepEqual(await verificarDeriva(c), { ok: true, sinRegistro: true, faltantes: [], alterados: [] });
  await asegurarIntegridad(c, { estricto: true });

  // Aplicar y volver a aplicar: idempotente.
  escribir("0001_base.sql", M1);
  assert.deepEqual(await migrar(c, dir), { aplicadas: ["0001_base.sql"] });
  assert.deepEqual(await migrar(c, dir), { aplicadas: [] });
  assert.equal(await registradas(c), 1);
  assert.ok((await triggers(c)).includes("m_hijo_sin_delete"));
  assert.equal((await verificarDeriva(c)).ok, true);

  // El registro es solo inserción.
  await assert.rejects(c.execute(`UPDATE ${REGISTRO} SET suma = 'x'`), /solo inserción/);
  await assert.rejects(c.execute(`DELETE FROM ${REGISTRO}`), /solo inserción/);

  // Una migración que borra un trigger sin declararlo se revierte entera (atomicidad).
  escribir("0002_borra.sql", ["CREATE TABLE m_otra (id TEXT PRIMARY KEY)", "DROP TRIGGER m_hijo_sin_delete"].join(BR));
  await assert.rejects(migrar(c, dir), /elimina o altera objetos protegidos sin declararlo: trigger m_hijo_sin_delete/);
  assert.ok((await triggers(c)).includes("m_hijo_sin_delete"), "el trigger sigue");
  assert.equal((await c.execute("SELECT count(*) FROM sqlite_master WHERE name = 'm_otra'")).rows[0][0], 0, "nada de la migración quedó");
  assert.equal(await registradas(c), 1);

  // Declarado, se admite y el estado esperado lo descuenta.
  escribir("0002_borra.sql", ["-- declara: m_hijo_sin_delete", "CREATE TABLE m_otra (id TEXT PRIMARY KEY)" + BR + "DROP TRIGGER m_hijo_sin_delete"].join("\n"));
  assert.deepEqual(await migrar(c, dir), { aplicadas: ["0002_borra.sql"] });
  assert.equal((await verificarDeriva(c)).ok, true);

  // Alterar una migración ya aplicada se detecta por su suma.
  const original = fs.readFileSync(path.join(dir, "0001_base.sql"), "utf8");
  escribir("0001_base.sql", original + "\n-- cambio");
  await assert.rejects(migrar(c, dir), /alterada después de aplicada: 0001_base.sql/);
  escribir("0001_base.sql", original);

  // Archivo aplicado que desaparece; migración nueva anterior a la última aplicada.
  fs.renameSync(path.join(dir, "0001_base.sql"), path.join(dir, "0001_base.sql.bak"));
  await assert.rejects(migrar(c, dir), /aplicada sin archivo: 0001_base.sql/);
  fs.renameSync(path.join(dir, "0001_base.sql.bak"), path.join(dir, "0001_base.sql"));
  escribir("0000_previa.sql", "CREATE TABLE m_previa (id TEXT)");
  await assert.rejects(migrar(c, dir), /fuera de orden/);
  fs.rmSync(path.join(dir, "0000_previa.sql"));

  // Nombres inválidos se rechazan antes de tocar la base.
  escribir("3_mal.sql", "SELECT 1");
  assert.throws(() => leerMigraciones(dir), /Nombre de migración inválido/);
  fs.rmSync(path.join(dir, "3_mal.sql"));

  // Deriva: acceso directo (lo que haría drizzle-kit push o un DROP manual) quita un índice.
  await c.execute("DROP INDEX m_hijo_padre");
  const d = await verificarDeriva(c);
  assert.deepEqual(d.faltantes, ["index m_hijo_padre"]);
  await assert.rejects(migrar(c, dir), /Deriva de esquema/);
  await assert.rejects(asegurarIntegridad(c, { estricto: true }), /deriva de esquema/);

  // Deriva por alteración: mismo nombre, otra definición.
  await c.execute("CREATE INDEX m_hijo_padre ON m_hijo (id)");
  assert.deepEqual((await verificarDeriva(c)).alterados, ["index m_hijo_padre"]);
  await c.execute("DROP INDEX m_hijo_padre");
  await c.execute("CREATE INDEX m_hijo_padre ON m_hijo (padre)");
  assert.equal((await verificarDeriva(c)).ok, true, "restaurado igual, sin deriva");

  // Borrar los triggers del propio registro también es deriva.
  const otraBase = baseArchivo();
  try {
    await migrar(otraBase.client, dir);
    await otraBase.client.execute(`DROP TRIGGER ${REGISTRO}_sin_delete`);
    assert.deepEqual((await verificarDeriva(otraBase.client)).faltantes, [`trigger ${REGISTRO}_sin_delete`]);
  } finally {
    await otraBase.cerrar();
  }

  // Control de eficacia: el mismo DROP aplicado sin el runner pasa sin aviso.
  // La protección viene del runner, no del motor.
  const sinRunner = baseArchivo();
  try {
    for (const s of M1.split(BR)) await sinRunner.client.execute(s);
    await sinRunner.client.execute("DROP TRIGGER m_hijo_sin_delete");
    assert.ok(!(await triggers(sinRunner.client)).includes("m_hijo_sin_delete"));
  } finally {
    await sinRunner.cerrar();
  }
} finally {
  await b.cerrar();
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log("migrar: ok");
