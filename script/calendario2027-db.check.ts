// Chequeo de server/calendario2027Db.ts con base SQLite en memoria.
// Ejecutar: npx tsx script/calendario2027-db.check.ts
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "../shared/schema";
import { users } from "../shared/models/auth";
import { levels, programCalendar, levelSubjects } from "../shared/schema";
import { applyCalendario2027 } from "../server/calendario2027Db";
import { resolveCalendarConfig, calendarInputToRow } from "../server/calendarConfig";
import { checkResourceAccess } from "../server/vortice";
import {
  DEFAULT_CONFIG, CHILE_TZ, ymdIn, getModuleEndDate, getGeneralEvaluationWeeks,
} from "../server/calendarUtils";
import { assertBaseLocal } from "../server/dbGuard";
import {
  NIVELES_GENERAL_2027,
  calcularCalendario,
  ymdMasDias,
} from "../shared/calendario2027";

const ymd = (d: Date) => ymdIn(CHILE_TZ, d);
const viernesDeEvaluacion = (e: { startDate: Date }) => ymdMasDias(ymdIn(CHILE_TZ, e.startDate), 4);

async function crearBase() {
  const client = createClient({ url: ":memory:" });
  const ddl = await generateSQLiteMigration(
    await generateSQLiteDrizzleJson({}),
    await generateSQLiteDrizzleJson(schema as any),
  );
  for (const stmt of ddl) await client.execute(stmt);
  return { client, db: drizzle(client, { schema }) };
}

type Db = Awaited<ReturnType<typeof crearBase>>["db"];

async function insertarNivelesEscolares(db: Db) {
  const niveles = [
    ...NIVELES_GENERAL_2027.map((id) => ({
      id,
      name: id.replace("b", "° Básico").replace("m", "° Medio"),
      programType: "menores" as const,
      totalWeeks: 30,
      sortOrder: 0,
    })),
    { id: "4m", name: "4° Medio", programType: "menores" as const, totalWeeks: 30, sortOrder: 0 },
  ];
  await db.insert(levels).values(niveles);
}

async function insertarNivelesAdultos(db: Db) {
  await db.insert(levels).values([
    { id: "nb1", name: "Nivel Básico 1", programType: "adultos" as const, totalWeeks: 30, sortOrder: 0 },
    { id: "nb2", name: "Nivel Básico 2", programType: "adultos" as const, totalWeeks: 30, sortOrder: 0 },
    { id: "nb3", name: "Nivel Básico 3", programType: "adultos" as const, totalWeeks: 30, sortOrder: 0 },
    { id: "nm1", name: "Nivel Medio 1", programType: "adultos" as const, totalWeeks: 30, sortOrder: 0 },
    { id: "nm2", name: "Nivel Medio 2", programType: "adultos" as const, totalWeeks: 30, sortOrder: 0 },
  ]);
}

// 1. Simulación (write: false): 12 en insertados, 0 filas en DB
{
  const { client, db } = await crearBase();
  await insertarNivelesEscolares(db);

  const result = await applyCalendario2027(db, { write: false });
  assert.equal(result.insertados.length, 12, "simulación: 12 niveles en insertados");
  assert.equal(result.yaExistian.length, 0);
  assert.equal(result.nivelesAusentes.length, 0);

  const filas = await db.select().from(programCalendar);
  assert.equal(filas.length, 0, "simulación: 0 filas en program_calendar");

  await client.close();
  console.log("✓ Test 1: simulación retorna 12 insertados sin escribir");
}

// 2. Aplicación (write: true) con escolares y adultos presentes: 12 filas, sin NULL ni adultos
{
  const { client, db } = await crearBase();
  await insertarNivelesEscolares(db);
  await insertarNivelesAdultos(db);

  const result = await applyCalendario2027(db, { write: true });
  assert.equal(result.insertados.length, 12, "aplicación: 12 insertados");
  assert.equal(result.yaExistian.length, 0);

  const filas = await db.select().from(programCalendar);
  assert.equal(filas.length, 12, "aplicación: 12 filas en program_calendar");

  const nulas = filas.filter((f) => f.levelId === null);
  assert.equal(nulas.length, 0, "no debe haber filas con levelId NULL");

  const adultos = filas.filter((f) => ["nb1", "nb2", "nb3", "nm1", "nm2"].includes(f.levelId!));
  assert.equal(adultos.length, 0, "no debe haber filas de adultos");

  await client.close();
  console.log("✓ Test 2: aplicación inserta 12 filas, sin NULL ni adultos");
}

// 3. Idempotencia: segunda corrida inserta 0, reporta 12 en yaExistian
{
  const { client, db } = await crearBase();
  await insertarNivelesEscolares(db);

  await applyCalendario2027(db, { write: true });
  const result2 = await applyCalendario2027(db, { write: true });
  assert.equal(result2.insertados.length, 0, "idempotencia: 0 insertados en segunda corrida");
  assert.equal(result2.yaExistian.length, 12, "idempotencia: 12 ya existían");

  const filas = await db.select().from(programCalendar);
  assert.equal(filas.length, 12, "idempotencia: sigue habiendo 12 filas");

  await client.close();
  console.log("✓ Test 3: idempotencia, segunda corrida no inserta");
}

// 4. Resolución con resolveCalendarConfig para niveles generales (1b-3m)
{
  const { client, db } = await crearBase();
  await insertarNivelesEscolares(db);
  await applyCalendario2027(db, { write: true });

  const abril2027 = new Date("2027-04-01T15:00:00Z");

  for (const nivel of NIVELES_GENERAL_2027) {
    const cfg = await resolveCalendarConfig(db, nivel, abril2027);
    assert.equal(ymd(cfg.programStartDate), "2027-03-08", `${nivel}: inicio correcto`);
    assert.equal(cfg.moduleDurationWeeks, 2, `${nivel}: duración 2 semanas`);
    assert.equal(cfg.totalModules, 15, `${nivel}: 15 módulos`);
    assert.equal(cfg.generalEvaluationWeeks.length, 2, `${nivel}: 2 evaluaciones`);
    assert.equal(cfg.generalEvaluationWeeks[0].afterModule, 7, `${nivel}: eval tras módulo 7`);
    assert.equal(cfg.generalEvaluationWeeks[1].afterModule, 15, `${nivel}: eval tras módulo 15`);
    assert.deepEqual(cfg.breaks, [], `${nivel}: sin recesos`);
    assert.deepEqual(cfg.holidays, [], `${nivel}: feriados vacíos`);

    const evalWeeks = getGeneralEvaluationWeeks(cfg);
    assert.equal(viernesDeEvaluacion(evalWeeks[1]), "2027-10-15", `${nivel}: fin 2027-10-15`);

    const calc = calcularCalendario(cfg, "2027-10-15");
    assert.equal(calc.cabe, true, `${nivel}: debe caber`);
    assert.equal(calc.fechaFinEvaluaciones, "2027-10-15", `${nivel}: fechaFinEvaluaciones 2027-10-15`);
  }

  await client.close();
  console.log("✓ Test 4: resolveCalendarConfig para niveles generales (1b-3m)");
}

// 5. Resolución para 4m: 12 módulos, fin módulo 12 el 2027-08-29, eval final el 2027-09-03
{
  const { client, db } = await crearBase();
  await insertarNivelesEscolares(db);
  await applyCalendario2027(db, { write: true });

  const abril2027 = new Date("2027-04-01T15:00:00Z");
  const cfg = await resolveCalendarConfig(db, "4m", abril2027);
  assert.equal(ymd(cfg.programStartDate), "2027-03-08");
  assert.equal(cfg.moduleDurationWeeks, 2);
  assert.equal(cfg.totalModules, 12);
  assert.equal(cfg.generalEvaluationWeeks.length, 2);
  assert.equal(cfg.generalEvaluationWeeks[0].afterModule, 7);
  assert.equal(cfg.generalEvaluationWeeks[1].afterModule, 12);
  assert.deepEqual(cfg.breaks, []);
  assert.deepEqual(cfg.holidays, []);
  assert.equal(ymd(getModuleEndDate(12, cfg)), "2027-08-29", "4m: fin módulo 12 el 2027-08-29");

  const evalWeeks = getGeneralEvaluationWeeks(cfg);
  assert.equal(viernesDeEvaluacion(evalWeeks[1]), "2027-09-03", "4m: fin de evaluaciones 2027-09-03");

  const calc = calcularCalendario(cfg, "2027-09-15");
  assert.equal(calc.cabe, true, "4m: debe caber antes del 15-sep");
  assert.equal(calc.fechaFinEvaluaciones, "2027-09-03");

  await client.close();
  console.log("✓ Test 5: 4m resuelve correctamente, fin 2027-09-03");
}

// 6. Adultos y null devuelven DEFAULT_CONFIG
{
  const { client, db } = await crearBase();
  await insertarNivelesEscolares(db);
  await insertarNivelesAdultos(db);
  await applyCalendario2027(db, { write: true });

  const abril2027 = new Date("2027-04-01T15:00:00Z");

  for (const adulto of ["nb1", "nb2", "nb3", "nm1", "nm2"]) {
    const cfg = await resolveCalendarConfig(db, adulto, abril2027);
    assert.strictEqual(cfg, DEFAULT_CONFIG, `${adulto}: debe devolver DEFAULT_CONFIG`);
  }

  const cfgNull = await resolveCalendarConfig(db, null, abril2027);
  assert.strictEqual(cfgNull, DEFAULT_CONFIG, "null: debe devolver DEFAULT_CONFIG");

  await client.close();
  console.log("✓ Test 6: adultos y null devuelven DEFAULT_CONFIG");
}

// 7. Defensa en profundidad: nivel con programType !== "menores" se omite
{
  const { client, db } = await crearBase();
  await db.insert(levels).values([
    { id: "4m", name: "4° Medio mal marcado", programType: "adultos", totalWeeks: 30, sortOrder: 0 },
  ]);

  const result = await applyCalendario2027(db, { write: true });
  assert.equal(result.insertados.length, 0, "no debe insertar nivel marcado como adultos");
  assert.equal(result.nivelesAusentes.length, 11);

  const filas = await db.select().from(programCalendar);
  assert.equal(filas.length, 0, "program_calendar debe quedar vacía");

  await client.close();
  console.log("✓ Test 7: filtro programType === 'menores' protege contra adultos");
}

// 8. Año 2026 devuelve DEFAULT_CONFIG
{
  const { client, db } = await crearBase();
  await insertarNivelesEscolares(db);
  await applyCalendario2027(db, { write: true });

  const abril2026 = new Date("2026-04-01T15:00:00Z");
  const cfg = await resolveCalendarConfig(db, "5b", abril2026);
  assert.strictEqual(cfg, DEFAULT_CONFIG, "2026: debe devolver DEFAULT_CONFIG");

  await client.close();
  console.log("✓ Test 8: año 2026 devuelve DEFAULT_CONFIG");
}

// 9. Base parcial: solo 7b..4m presentes, inserta 6 y reporta 1b..6b ausentes
{
  const { client, db } = await crearBase();
  await db.insert(levels).values([
    { id: "7b", name: "7° Básico", programType: "menores", totalWeeks: 30, sortOrder: 0 },
    { id: "8b", name: "8° Básico", programType: "menores", totalWeeks: 30, sortOrder: 0 },
    { id: "1m", name: "1° Medio", programType: "menores", totalWeeks: 30, sortOrder: 0 },
    { id: "2m", name: "2° Medio", programType: "menores", totalWeeks: 30, sortOrder: 0 },
    { id: "3m", name: "3° Medio", programType: "menores", totalWeeks: 30, sortOrder: 0 },
    { id: "4m", name: "4° Medio", programType: "menores", totalWeeks: 30, sortOrder: 0 },
  ]);

  const result = await applyCalendario2027(db, { write: true });
  assert.equal(result.insertados.length, 6, "parcial: 6 insertados");
  assert.equal(result.nivelesAusentes.length, 6, "parcial: 6 niveles ausentes");
  const ausentesEsperados = ["1b", "2b", "3b", "4b", "5b", "6b"];
  assert.deepEqual([...result.nivelesAusentes].sort(), [...ausentesEsperados].sort(), "ausentes: 1b..6b");

  const filas = await db.select().from(programCalendar);
  assert.equal(filas.length, 6, "parcial: 6 filas en DB");

  await client.close();
  console.log("✓ Test 9: base parcial inserta 6, reporta 1b..6b ausentes");
}

// 10. No sobrescritura: fila preexistente para 4m se conserva intacta
{
  const { client, db } = await crearBase();
  await insertarNivelesEscolares(db);

  const filaManual = calendarInputToRow(schema.calendarConfigInputSchema.parse({
    academicYear: 2027,
    levelId: "4m",
    startDate: "2027-03-08",
    totalModules: 11,
    moduleDurationWeeks: 2,
    generalEvaluationWeeks: [
      { afterModule: 7, name: "Semana de Evaluaciones Generales (Primer Semestre)" },
      { afterModule: 11, name: "Semana de Evaluaciones Finales" },
    ],
    breaks: [],
    holidays: [],
  }));
  await db.insert(programCalendar).values(filaManual);

  const result = await applyCalendario2027(db, { write: true });
  assert.ok(result.yaExistian.includes("4m"), "4m debe estar en yaExistian");
  assert.equal(result.insertados.length, 11);

  const filas = await db.select().from(programCalendar).where(eq(programCalendar.levelId, "4m"));
  assert.equal(filas.length, 1, "solo 1 fila para 4m");
  assert.equal(filas[0].totalModules, 11, "totalModules conservado: 11");

  await client.close();
  console.log("✓ Test 10: no sobrescritura, fila preexistente conservada");
}

// 11. Apertura en hora de Chile para 5b y 4m: 2027-03-08T02:59:00Z cerrado, 03:00:00Z abierto
{
  const { client, db } = await crearBase();
  await insertarNivelesEscolares(db);
  await applyCalendario2027(db, { write: true });

  await db.insert(users).values([{ id: "u1" }]);
  await db.insert(schema.subjects).values([{ id: "s", name: "Matemática", slug: "matematica" }]);
  await db.insert(levelSubjects).values([
    { id: "ls5b", levelId: "5b", subjectId: "s" },
    { id: "ls4m", levelId: "4m", subjectId: "s" },
  ]);
  await db.insert(schema.enrollments).values([
    { userId: "u1", levelSubjectId: "ls5b" },
    { userId: "u1", levelSubjectId: "ls4m" },
  ]);
  await db.insert(schema.learningObjectives).values([
    { id: "oa5b", levelSubjectId: "ls5b", code: "OA 1", title: "Números", weekNumber: 1 },
    { id: "oa4m", levelSubjectId: "ls4m", code: "OA 1", title: "Funciones", weekNumber: 1 },
  ]);
  await db.insert(schema.weeklyResources).values([
    { id: "r5b", learningObjectiveId: "oa5b", resourceType: "video", title: "Video 5b" },
    { id: "r4m", learningObjectiveId: "oa4m", resourceType: "video", title: "Video 4m" },
  ]);

  const antesInicio = new Date("2027-03-08T02:59:00Z");
  assert.equal((await checkResourceAccess(db, "u1", "r5b", antesInicio)).ok, false, "5b antes del inicio: cerrado");
  assert.equal((await checkResourceAccess(db, "u1", "r4m", antesInicio)).ok, false, "4m antes del inicio: cerrado");

  const inicioExacto = new Date("2027-03-08T03:00:00Z");
  assert.equal((await checkResourceAccess(db, "u1", "r5b", inicioExacto)).ok, true, "5b inicio exacto: abierto");
  assert.equal((await checkResourceAccess(db, "u1", "r4m", inicioExacto)).ok, true, "4m inicio exacto: abierto");

  await client.close();
  console.log("✓ Test 11: apertura en hora de Chile correcta para 5b y 4m");
}

// 12. Guardia local: assertBaseLocal acepta :memory: y file: con entorno limpio, rechaza remoto y TURSO_*
{
  const limpio = { PATH: "" } as NodeJS.ProcessEnv;
  assert.doesNotThrow(() => assertBaseLocal(limpio, ":memory:"));
  assert.doesNotThrow(() => assertBaseLocal(limpio, "file:./db.sqlite"));
  assert.throws(() => assertBaseLocal(limpio, "libsql://brkl-db.turso.io"), /Base local bloqueada/);
  assert.throws(() => assertBaseLocal({ ...limpio, TURSO_DATABASE_URL: "libsql://test.turso.io" }, ":memory:"), /Base local bloqueada/);

  console.log("✓ Test 12: assertBaseLocal funciona correctamente");
}

console.log("\n✅ calendario2027-db.check.ts: todas las pruebas pasaron");
