// Control de eficacia de las pruebas: cada mutación rompe una regla en el código real y su *check*
// debe fallar. Restaura siempre el archivo y verifica que quedó idéntico.
// Ejecutar: npx tsx script/mutar.ts [h0|h1]
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";

type Mutacion = { id: string; archivo: string; de: string; a: string; check: string };

export const MUTACIONES: Record<string, Mutacion[]> = {
  h0: [
    { id: "FK sin verificar", archivo: "server/cliente.ts", de: "if (Number(r.rows[0]?.[0]) !== 1) {", a: "if (false) {", check: "db-fk" },
    { id: "runner sin proteger triggers", archivo: "server/migrar.ts", de: ".filter((o) => !m.declara.includes(o.name) && mapaDespues.get(o.name)?.sql !== o.sql)", a: ".filter(() => false)", check: "migrar" },
    { id: "runner sin suma", archivo: "server/migrar.ts", de: "if (m.suma !== r.suma)", a: "if (false)", check: "migrar" },
    { id: "deriva sin alterados", archivo: "server/migrar.ts", de: "else if (actual.sql !== o.sql)", a: "else if (false)", check: "migrar" },
    { id: "deriva sin faltantes", archivo: "server/migrar.ts", de: "if (!actual) faltantes.push", a: "if (false) faltantes.push", check: "migrar" },
    { id: "guarda acepta credenciales", archivo: "server/dbGuard.ts", de: "if (presentes.length) fail(", a: "if (false) fail(", check: "guardas" },
    { id: "guarda acepta host remoto", archivo: "server/dbGuard.ts", de: "if (!local || u.username", a: "if (u.username", check: "guardas" },
    { id: "drizzle-kit sin bloqueo", archivo: "drizzle.config.ts", de: 'if (process.env.DB_ENTORNO !== "local") {', a: "if (false) {", check: "guardas" },
    { id: "estados cerrados sin vencida", archivo: "shared/p0e-estados.ts", de: '"cerrada_agotada", "vencida"]', a: '"cerrada_agotada"]', check: "estados-cerrados" },
    { id: "reloj del sistema en el motor", archivo: "server/reloj.ts", de: "return Number(r.rows[0][0]);", a: "return Date.now() / 1000;", check: "reloj" },
  ],
  h1: [],
};

const suma = (f: string) => createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const grupo = process.argv[2] ?? "h0";
const lista = MUTACIONES[grupo];
if (!lista?.length) throw new Error(`Grupo sin mutaciones: ${grupo}`);
let fallas = 0;
for (const m of lista) {
  const original = fs.readFileSync(m.archivo, "utf8");
  const antes = suma(m.archivo);
  if (original.split(m.de).length !== 2) throw new Error(`${m.id}: el texto a mutar no aparece exactamente una vez en ${m.archivo}`);
  let estado: number | null;
  try {
    fs.writeFileSync(m.archivo, original.replace(m.de, m.a));
    estado = spawnSync("node_modules/.bin/tsx", [`script/${m.check}.check.ts`], { encoding: "utf8", timeout: 300000 }).status;
  } finally {
    fs.writeFileSync(m.archivo, original);
  }
  if (suma(m.archivo) !== antes) throw new Error(`${m.archivo} no quedó restaurado`);
  const detectada = estado !== 0;
  if (!detectada) fallas++;
  console.log(`${detectada ? "DETECTADA " : "NO DETECTADA"}  ${m.id}  (${m.check}.check, salida ${estado})`);
}
if (fallas) { console.error(`${fallas} mutación(es) no detectada(s)`); process.exit(1); }
console.log(`mutar ${grupo}: ok (${lista.length}/${lista.length} detectadas)`);
