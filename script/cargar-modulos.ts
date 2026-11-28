#!/usr/bin/env tsx
// Carga los módulos 1..15 de un grado básico (scripts/data/modulos/<grado>_basico.json).
//   Simulación (por omisión): tsx script/cargar-modulos.ts 1 --db file:/ruta/local.db
//   Aplicar:                  tsx script/cargar-modulos.ts 1 --db file:/ruta/local.db --apply
//   Vista previa Vercel:      PREVIEW_DB_URL=... PREVIEW_DB_TOKEN=... tsx script/cargar-modulos.ts 1 [--apply]
// Nunca lee TURSO_DATABASE_URL. Solo acepta un archivo local o un host brkl-preview-*.turso.io.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PREVIEW_HOST_PATTERN, assertBaseLocal } from "../server/dbGuard";
import { crearClienteDb } from "../server/cliente";
import { cargarModulos, type DatosModulos } from "../server/cargarModulos";

const fallar = (m: string): never => {
  console.error(`Abortado: ${m}`);
  process.exit(1);
};

async function main() {
  if (process.env.NODE_ENV === "production") fallar("NODE_ENV=production");

  const args = process.argv.slice(2);
  const grado = args.find((a) => /^[1-6]$/.test(a));
  if (!grado) fallar("indica el grado (1 a 6)");
  const apply = args.includes("--apply");
  const dbIdx = args.indexOf("--db");
  const dbArg = dbIdx >= 0 ? args[dbIdx + 1] : undefined;
  const previewUrl = process.env.PREVIEW_DB_URL;
  const previewToken = process.env.PREVIEW_DB_TOKEN;

  let url: string;
  let authToken: string | undefined;
  let destino: string;
  if (previewUrl) {
    if (dbArg) fallar("usa --db o PREVIEW_DB_URL, no ambos");
    if (!previewToken) fallar("falta PREVIEW_DB_TOKEN");
    let host: string;
    try {
      host = new URL(previewUrl).hostname;
    } catch {
      return fallar("PREVIEW_DB_URL inválida");
    }
    if (!PREVIEW_HOST_PATTERN.test(host)) fallar("el host no es una base de pruebas brkl-preview-*");
    url = previewUrl;
    authToken = previewToken;
    destino = `preview ${host}`;
  } else if (dbArg?.startsWith("file:")) {
    const ruta = resolve(dbArg.slice("file:".length));
    if (!existsSync(ruta)) fallar(`no existe el archivo ${ruta}`);
    assertBaseLocal(process.env, `file:${ruta}`);
    url = `file:${ruta}`;
    destino = `archivo local ${ruta}`;
  } else {
    fallar("indica --db file:<ruta> o PREVIEW_DB_URL y PREVIEW_DB_TOKEN");
  }

  const archivo = fileURLToPath(new URL(`../scripts/data/modulos/${grado}_basico.json`, import.meta.url));
  if (!existsSync(archivo)) fallar(`no existe ${archivo}`);
  const datos = JSON.parse(readFileSync(archivo, "utf8")) as DatosModulos;

  const client = crearClienteDb(url!, authToken);
  try {
    console.log(`Destino: ${destino}`);
    console.log(`Modo: ${apply ? "APLICAR (escribe)" : "simulación (no escribe)"}`);
    const r = await cargarModulos(client, grado!, datos, { escribir: apply });
    console.log(`Nivel ${grado}b creado: ${r.nivelCreado ? "sí" : "no"}`);
    console.log(`Asignaturas creadas: ${r.asignaturasCreadas}`);
    console.log(`level_subjects creados: ${r.levelSubjectsCreados}`);
    console.log(`Módulos insertados: ${r.modulosInsertados}`);
    console.log(`Módulos actualizados: ${r.modulosActualizados}`);
    console.log(`Módulos sin cambios: ${r.modulosSinCambios}`);
    console.log(`Módulos omitidos: ${r.omitidos.length}`);
    for (const o of r.omitidos) console.log(`  - ${o.asignatura} módulo ${o.modulo}: ${o.motivo}`);
    if (!apply) console.log("Simulación: no se escribió nada. Usa --apply para escribir.");
  } finally {
    client.close();
  }
}

main().catch((e) => fallar((e as Error).message));
