#!/usr/bin/env tsx
// Verifica cargarModulos contra una base SQLite temporal con el esquema básico (sin columnas nuevas).
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type Client } from "@libsql/client";
import { cargarModulos, type DatosModulos } from "../server/cargarModulos";

const DDL = `
CREATE TABLE levels (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, program_type TEXT NOT NULL,
  total_weeks INTEGER NOT NULL DEFAULT 30, cadence_per_oa TEXT, sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE subjects (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  description TEXT, created_at INTEGER);
CREATE TABLE level_subjects (id TEXT PRIMARY KEY NOT NULL, level_id TEXT NOT NULL REFERENCES levels(id),
  subject_id TEXT NOT NULL REFERENCES subjects(id), total_oas INTEGER DEFAULT 0,
  textbook_pdf_url TEXT, textbook_title TEXT);
CREATE TABLE learning_objectives (id TEXT PRIMARY KEY NOT NULL,
  level_subject_id TEXT NOT NULL REFERENCES level_subjects(id), code TEXT NOT NULL, title TEXT NOT NULL,
  description TEXT, week_number INTEGER NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
  textbook_start_page INTEGER, textbook_end_page INTEGER, module_oas TEXT, module_contents TEXT,
  module_date_range TEXT, word_doc_url TEXT);
`;

let fallos = 0;
const eq = (actual: unknown, esperado: unknown, msg: string) => {
  const ok = JSON.stringify(actual) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(`${ok ? "OK  " : "FALLA"} ${msg}${ok ? "" : ` (obtuvo ${JSON.stringify(actual)}, esperado ${JSON.stringify(esperado)})`}`);
};

const contar = async (c: Client, tabla: string): Promise<number> =>
  Number((await c.execute(`SELECT COUNT(*) AS n FROM ${tabla}`)).rows[0].n);

const datos = JSON.parse(
  readFileSync(fileURLToPath(new URL("../scripts/data/modulos/1_basico.json", import.meta.url)), "utf8"),
) as DatosModulos;
const ASIGNATURAS = Object.keys(datos).length; // 4

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "cargar-modulos-"));
  const c = createClient({ url: `file:${join(dir, "prueba.db")}` });
  try {
    await c.executeMultiple(DDL);
    // Asignatura preexistente con otro id: la carga debe reutilizarla, no duplicarla.
    await c.execute("INSERT INTO subjects (id, name, slug) VALUES ('mat-existente', 'Matemática', 'matematica')");

    // 1. Simulación: no escribe nada.
    const sim = await cargarModulos(c, "1", datos, { escribir: false });
    eq(await contar(c, "levels"), 0, "simulación no crea nivel");
    eq(await contar(c, "learning_objectives"), 0, "simulación no inserta módulos");
    eq(await contar(c, "subjects"), 1, "simulación no crea asignaturas");
    eq(sim.modulosInsertados, ASIGNATURAS * 15, "simulación cuenta 60 módulos por insertar");

    // 2. Aplicar: 15 filas por asignatura, sin duplicar nivel ni asignaturas.
    const ap = await cargarModulos(c, "1", datos, { escribir: true });
    eq(ap.modulosInsertados, ASIGNATURAS * 15, "aplicar inserta 60 módulos");
    eq(await contar(c, "levels"), 1, "un solo nivel 1b");
    eq(await contar(c, "subjects"), ASIGNATURAS, "asignaturas sin duplicar (reutiliza matematica)");
    eq(await contar(c, "level_subjects"), ASIGNATURAS, "un level_subject por asignatura");
    const porAsignatura = (await c.execute(
      "SELECT COUNT(*) AS n FROM learning_objectives GROUP BY level_subject_id",
    )).rows.map((r) => Number(r.n));
    eq(porAsignatura, Array(ASIGNATURAS).fill(15), "15 filas por asignatura");
    const mat = await c.execute(
      "SELECT lo.code, lo.module_oas FROM learning_objectives lo JOIN level_subjects ls ON ls.id = lo.level_subject_id WHERE ls.subject_id = 'mat-existente' AND lo.week_number = 1",
    );
    eq(mat.rows.length, 1, "módulo 1 de Matemática cuelga de la asignatura preexistente");

    // 3. Segunda vez: no cambia nada.
    const antes = await c.execute("SELECT id, title, module_contents, module_oas FROM learning_objectives ORDER BY id");
    const segunda = await cargarModulos(c, "1", datos, { escribir: true });
    const despues = await c.execute("SELECT id, title, module_contents, module_oas FROM learning_objectives ORDER BY id");
    eq(segunda.modulosInsertados + segunda.modulosActualizados, 0, "segunda pasada no inserta ni actualiza");
    eq(segunda.modulosSinCambios, ASIGNATURAS * 15, "segunda pasada: todo sin cambios");
    eq(despues.rows.map((r) => [r.id, r.title, r.module_contents, r.module_oas]),
       antes.rows.map((r) => [r.id, r.title, r.module_contents, r.module_oas]), "segunda pasada deja las filas idénticas");
    eq(await contar(c, "levels"), 1, "segunda pasada no duplica nivel");
    eq(await contar(c, "subjects"), ASIGNATURAS, "segunda pasada no duplica asignaturas");

    // 4. Contenido manual distinto: no se sobrescribe y se reporta como omitido.
    await c.execute(
      "UPDATE learning_objectives SET module_contents = 'Contenido manual' WHERE week_number = 3 AND level_subject_id IN (SELECT id FROM level_subjects WHERE subject_id = 'mat-existente')",
    );
    const manual = await cargarModulos(c, "1", datos, { escribir: true });
    eq(manual.omitidos.length, 1, "contenido manual aparece como omitido");
    eq(manual.omitidos[0]?.modulo, 3, "omitido corresponde al módulo 3");
    const contenidoManual = await c.execute(
      "SELECT lo.module_contents AS c FROM learning_objectives lo JOIN level_subjects ls ON ls.id = lo.level_subject_id WHERE ls.subject_id = 'mat-existente' AND lo.week_number = 3",
    );
    eq(contenidoManual.rows[0]?.c, "Contenido manual", "contenido manual no se sobrescribe");

    // 5. Placeholder "Módulo 5" sin contenido: se completa.
    await c.execute(
      "UPDATE learning_objectives SET title = 'Módulo 5', module_contents = NULL WHERE week_number = 5 AND level_subject_id IN (SELECT id FROM level_subjects WHERE subject_id = 'mat-existente')",
    );
    const placeholder = await cargarModulos(c, "1", datos, { escribir: true });
    eq(placeholder.modulosActualizados, 1, "placeholder 'Módulo 5' vacío se actualiza");
    const titulo5 = await c.execute(
      "SELECT lo.title AS t FROM learning_objectives lo JOIN level_subjects ls ON ls.id = lo.level_subject_id WHERE ls.subject_id = 'mat-existente' AND lo.week_number = 5",
    );
    eq(titulo5.rows[0]?.t, datos["Matemática"]?.find((m) => m.modulo === 5)?.titulo, "título de Matemática módulo 5 cargado");

    // 6. Grado inválido (adultos o fuera de 1° básico a 4° medio) se rechaza sin tocar nada.
    let rechazo = false;
    try { await cargarModulos(c, "nb1", datos, { escribir: true }); } catch { rechazo = true; }
    eq(rechazo, true, "grado no escolar (nb1) se rechaza");

    // 7. Inglés y cursos de media (p. ej. 7b) se aceptan y reutilizan slug 'ingles'.
    const datosIngles: DatosModulos = {
      "Idioma Extranjero: Inglés": Array.from({ length: 15 }, (_, i) => ({
        modulo: i + 1,
        oa: [5],
        titulo: `Tema inglés ${i + 1}`,
        contenido: `Contenido de prueba ${i + 1}.`,
      })),
    };
    const r7 = await cargarModulos(c, "7b", datosIngles, { escribir: true });
    eq(r7.nivelCreado, true, "7b se crea si no existe");
    eq(r7.modulosInsertados, 15, "7b inserta 15 módulos de Inglés");
    const slugIngles = await c.execute("SELECT slug FROM subjects WHERE slug = 'ingles'");
    eq(slugIngles.rows.length, 1, "Idioma Extranjero: Inglés mapea al slug ingles");

    // 8. Ciencias para la ciudadanía (3m/4m) mapea al slug ciencias-naturales.
    const datosCiudadania: DatosModulos = {
      "Ciencias para la ciudadanía": Array.from({ length: 15 }, (_, i) => ({
        modulo: i + 1,
        oa: [2],
        titulo: `Tema sostenibilidad ${i + 1}`,
        contenido: `Contenido científico ${i + 1}.`,
      })),
    };
    const r4m = await cargarModulos(c, "4m", datosCiudadania, { escribir: true });
    eq(r4m.modulosInsertados, 15, "4m inserta 15 módulos de Ciencias para la ciudadanía");
    const slugCiencias = await c.execute("SELECT COUNT(*) AS n FROM subjects WHERE slug = 'ciencias-naturales'");
    eq(Number(slugCiencias.rows[0]?.n), 1, "Ciencias para la ciudadanía reutiliza ciencias-naturales sin duplicar");
  } finally {
    c.close();
    rmSync(dir, { recursive: true, force: true });
  }

  if (fallos) {
    console.error(`\n${fallos} verificación(es) fallaron`);
    process.exit(1);
  }
  console.log("\nTodas las verificaciones pasaron");
}

main().catch((e) => {
  console.error("Error inesperado:", e);
  process.exit(1);
});
