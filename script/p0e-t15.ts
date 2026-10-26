// Pruebas técnicas T1–T5 de P0-E (atomicidad y concurrencia) contra un libsql AISLADO por HTTP.
// No forma parte de check:vortice. Crea tablas de prueba con prefijo t15_ solo en la base indicada.
// Uso (base desechable local):
//   turso dev --db-file /tmp/p0e-t15.db --port 8099
//   T15_URL=http://127.0.0.1:8099 npx tsx script/p0e-t15.ts
// Se niega a correr contra Turso o cualquier host que no sea local.
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";

const url = process.env.T15_URL ?? "";
const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
if (!["127.0.0.1", "localhost"].includes(host)) throw new Error("T1–T5 solo corre contra un libsql local desechable (T15_URL=http://127.0.0.1:PUERTO)");

const client = createClient({ url });
const db = drizzle(client);
const REPS = Number(process.env.T15_REPS ?? 50);
const informe: string[] = [];

await client.batch([
  "drop table if exists t15_attempts", "drop table if exists t15_closures", "drop table if exists t15_progress",
  `create table t15_attempts (id text primary key, user_id text not null, evaluation_id text not null,
     attempt_no integer, status text not null check (status in ('en_curso','enviado','vencido')),
     submission_id text unique, passed integer)`,
  "create unique index t15_un_activo on t15_attempts (user_id, evaluation_id) where status = 'en_curso'",
  "create unique index t15_un_numero on t15_attempts (user_id, evaluation_id, attempt_no) where attempt_no is not null",
  `create table t15_closures (user_id text not null, evaluation_id text not null,
     cause text not null check (cause in ('aprobacion','agotamiento','vencimiento')), attempt_id text not null,
     primary key (user_id, evaluation_id))`,
  "create table t15_progress (id text primary key, attempt_id text not null unique, passed integer)",
], "write");

const count = async (q: string) => Number((await client.execute(q)).rows[0][0]);
const reset = () => client.batch(["delete from t15_attempts", "delete from t15_closures", "delete from t15_progress"], "write");

// Inicio: crea el intento en curso si no hay cierre ni otro en curso (el índice parcial lo garantiza).
const iniciar = (u: string, e: string, id: string) => client.execute({
  sql: `insert into t15_attempts (id, user_id, evaluation_id, status)
        select ?, ?, ?, 'en_curso' where not exists (select 1 from t15_closures where user_id = ? and evaluation_id = ?)
        on conflict do nothing`, args: [id, u, e, u, e] });

// Envío: un solo batch transaccional (pasa a enviado + progreso + cierre si corresponde).
async function enviar(u: string, e: string, attemptId: string, sid: string, passed: boolean, max: number) {
  try {
    await client.batch([
      { sql: `update t15_attempts set status = 'enviado', submission_id = ?, passed = ?,
                attempt_no = (select coalesce(max(attempt_no), 0) + 1 from t15_attempts where user_id = ? and evaluation_id = ?)
              where id = ? and status = 'en_curso'
                and not exists (select 1 from t15_closures where user_id = ? and evaluation_id = ?)
                and (select count(*) from t15_attempts where user_id = ? and evaluation_id = ? and status = 'enviado') < ?`,
        args: [sid, passed ? 1 : 0, u, e, attemptId, u, e, u, e, max] },
      { sql: `insert into t15_progress (id, attempt_id, passed) select ?, id, passed from t15_attempts where submission_id = ?`, args: ["p-" + sid, sid] },
      { sql: `insert into t15_closures (user_id, evaluation_id, cause, attempt_id)
              select user_id, evaluation_id, case when passed = 1 then 'aprobacion' else 'agotamiento' end, id
              from t15_attempts where submission_id = ? and (passed = 1 or attempt_no >= ?)
              on conflict do nothing`, args: [sid, max] },
      // Con la evaluación cerrada no puede quedar ningún intento abierto.
      { sql: `update t15_attempts set status = 'vencido'
              where user_id = ? and evaluation_id = ? and status = 'en_curso'
                and exists (select 1 from t15_closures where user_id = ? and evaluation_id = ?)`, args: [u, e, u, e] },
    ], "write");
    return "ok";
  } catch (e: any) { return /UNIQUE|constraint/i.test(String(e?.message)) ? "conflicto" : `error: ${e?.message}`; }
}

// T1: atomicidad — un batch con una sentencia que falla no deja nada escrito.
for (let i = 0; i < REPS; i++) {
  await reset();
  await client.execute("insert into t15_progress (id, attempt_id, passed) values ('x', 'a-dup', 0)");
  let fallo = false;
  try {
    await client.batch([
      "insert into t15_attempts (id, user_id, evaluation_id, status) values ('a1','u','e','enviado')",
      "insert into t15_closures (user_id, evaluation_id, cause, attempt_id) values ('u','e','aprobacion','a1')",
      "insert into t15_progress (id, attempt_id, passed) values ('y', 'a-dup', 1)", // viola unique(attempt_id)
    ], "write");
  } catch { fallo = true; }
  assert.ok(fallo, "T1: el batch debía fallar");
  assert.equal(await count("select count(*) from t15_attempts") + await count("select count(*) from t15_closures"), 0, "T1: rollback completo");
}
informe.push(`T1 atomicidad de db.batch: ${REPS}/${REPS} sin escrituras parciales`);

// T2a: 20 inicios simultáneos → un solo intento en curso.
for (let i = 0; i < REPS; i++) {
  await reset();
  await Promise.all(Array.from({ length: 20 }, (_, k) => iniciar("u", "e", `a${k}`)));
  assert.equal(await count("select count(*) from t15_attempts where status = 'en_curso'"), 1, "T2a");
}
informe.push(`T2a 20 inicios simultáneos: ${REPS}/${REPS} con un único intento en curso`);

// T2b: 20 envíos simultáneos del mismo intento (último permitido, max=3, ya hay 2) → 1 envío y 1 cierre.
for (let i = 0; i < REPS; i++) {
  await reset();
  await client.batch([
    "insert into t15_attempts (id,user_id,evaluation_id,status,attempt_no,passed) values ('p1','u','e','enviado',1,0),('p2','u','e','enviado',2,0),('a3','u','e','en_curso',null,null)",
  ], "write");
  await Promise.all(Array.from({ length: 20 }, (_, k) => enviar("u", "e", "a3", `s${k}`, false, 3)));
  assert.equal(await count("select count(*) from t15_attempts where status = 'enviado'"), 3, "T2b: tres enviados en total");
  assert.equal(await count("select count(*) from t15_progress"), 1, "T2b: un solo registro de progreso");
  assert.equal(await count("select count(*) from t15_closures where cause = 'agotamiento'"), 1, "T2b: un cierre por agotamiento");
}
informe.push(`T2b 20 envíos simultáneos del último intento: ${REPS}/${REPS} con 1 envío, 1 progreso y 1 cierre`);

// T2c: aprobación con intentos concurrentes. Tras el cierre por aprobación:
//  - existe exactamente un cierre, con causa "aprobacion", ligado al intento que aprobó;
//  - hay un solo intento enviado (el que aprobó) y un solo registro de progreso;
//  - no queda ningún intento abierto ("en_curso");
//  - un inicio y un envío posteriores al cierre no registran nada.
let t2cCarreras = 0;
for (let i = 0; i < REPS; i++) {
  await reset();
  await iniciar("u", "e", "a1");
  // En paralelo: el envío que aprueba y 10 intentos de abrir y enviar otro intento.
  await Promise.all([
    enviar("u", "e", "a1", "sa", true, 3),
    ...Array.from({ length: 10 }, (_, k) => (async () => { await iniciar("u", "e", `b${k}`); return enviar("u", "e", `b${k}`, `sb${k}`, false, 3); })()),
  ]);
  const cierres = (await client.execute("select cause, attempt_id from t15_closures")).rows;
  assert.equal(cierres.length, 1, "T2c: un cierre");
  assert.deepEqual([cierres[0].cause, cierres[0].attempt_id], ["aprobacion", "a1"], "T2c: cierre por aprobación del intento a1");
  assert.equal(await count("select count(*) from t15_attempts where status = 'enviado'"), 1, "T2c: solo el intento que aprobó quedó enviado");
  assert.equal(await count("select count(*) from t15_progress"), 1, "T2c: un solo registro de progreso");
  assert.equal(await count("select count(*) from t15_attempts where status = 'en_curso'"), 0, "T2c: ningún intento abierto tras el cierre");
  t2cCarreras += await count("select count(*) from t15_attempts where status = 'vencido'");
  // Después del cierre: ni iniciar ni enviar registran nada.
  await iniciar("u", "e", "post");
  assert.equal(await count("select count(*) from t15_attempts where id = 'post'"), 0, "T2c: no se puede iniciar tras el cierre");
  assert.equal(await enviar("u", "e", "a1", "sa-repetido", false, 3), "ok");
  assert.equal(await count("select count(*) from t15_attempts where status = 'enviado' and user_id = 'u'"), 1, "T2c: ningún envío nuevo tras el cierre");
  assert.equal(await count("select count(*) from t15_progress"), 1, "T2c: sin progreso nuevo tras el cierre");
}
informe.push(`T2c aprobación + 10 intentos concurrentes: ${REPS}/${REPS} con 1 cierre (aprobación, intento a1), 1 enviado, 1 progreso, 0 abiertos, sin inicio ni envío posteriores (${t2cCarreras} intentos abiertos en la carrera quedaron "vencido")`);

// T2d: idempotencia — mismo submission_id 10 veces → una fila.
for (let i = 0; i < REPS; i++) {
  await reset();
  await iniciar("u", "e", "a1");
  await Promise.all(Array.from({ length: 10 }, () => enviar("u", "e", "a1", "mismo", false, 3)));
  assert.equal(await count("select count(*) from t15_attempts where submission_id = 'mismo'"), 1, "T2d");
  assert.equal(await count("select count(*) from t15_progress"), 1, "T2d progreso");
}
informe.push(`T2d mismo submission_id ×10: ${REPS}/${REPS} con una sola fila`);

// T3: índices parciales y CHECK rechazan datos inválidos.
await reset();
await assert.rejects(client.execute("insert into t15_attempts (id,user_id,evaluation_id,status) values ('z','u','e','inventado')"), /CHECK/i);
await client.execute("insert into t15_attempts (id,user_id,evaluation_id,status) values ('c1','u','e','en_curso')");
await assert.rejects(client.execute("insert into t15_attempts (id,user_id,evaluation_id,status) values ('c2','u','e','en_curso')"), /UNIQUE/i);
await client.execute("insert into t15_attempts (id,user_id,evaluation_id,status) values ('c3','u','e','vencido')"); // fuera del índice parcial
informe.push("T3 CHECK de status y único parcial de intento en curso: rechazan lo inválido, aceptan lo válido");

// T4: T = 23:59 Chile; extensión 48 h reales; review_at = T + 49 h, en fechas de cambio de horario.
const tz = "America/Santiago";
const offsetMin = (d: Date) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(d).map((x) => [x.type, x.value]));
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - d.getTime()) / 60000;
};
const finDia = (ymd: string) => { // 23:59 local de ese día como instante UTC
  const [y, m, d] = ymd.split("-").map(Number);
  let t = Date.UTC(y, m - 1, d, 23, 59);
  for (let k = 0; k < 2; k++) t = Date.UTC(y, m - 1, d, 23, 59) - offsetMin(new Date(t)) * 60000;
  return new Date(t);
};
const casos = ["2026-04-04", "2026-04-05", "2026-09-05", "2026-09-06", "2027-04-03", "2027-09-04", "2026-06-15"];
for (const dia of casos) {
  const T = finDia(dia);
  const local = new Intl.DateTimeFormat("es-CL", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(T);
  assert.equal(local, "23:59", `T4: ${dia} T debe ser 23:59 local`);
  const ext = new Date(T.getTime() + 48 * 3600e3), rev = new Date(T.getTime() + 49 * 3600e3);
  assert.equal(ext.getTime() - T.getTime(), 172800000, "T4: 48 h reales");
  informe.push(`T4 ${dia}: T=${T.toISOString()} ext=${ext.toISOString()} (local ${new Intl.DateTimeFormat("es-CL", { timeZone: tz, dateStyle: "short", timeStyle: "short" }).format(ext)}) review_at=${rev.toISOString()}`);
}

// T5: reloj — diferencia entre la hora local y la del servidor libsql.
const srv = String((await client.execute("select strftime('%Y-%m-%dT%H:%M:%fZ','now')")).rows[0][0]);
const desfaseMs = Math.abs(Date.parse(srv) - Date.now());
informe.push(`T5 desfase reloj app↔libsql local: ${desfaseMs} ms (en Vercel debe medirse entre instancias desplegadas)`);

await client.batch(["drop table t15_attempts", "drop table t15_closures", "drop table t15_progress"], "write");
console.log(informe.join("\n"));
console.log("p0e-t15: ok");
