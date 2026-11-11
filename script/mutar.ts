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
  h1: [
    { id: "K6 sin familias distintas", archivo: "shared/dominio.ts", de: "a.familia !== x.familia && separados(a, x)", a: "separados(a, x)", check: "dominio" },
    { id: "O2 separación ignorada", archivo: "shared/dominio.ts", de: 'pol.k6_separation === "ninguna" ||', a: "true ||", check: "dominio" },
    { id: "O3 ayuda cuenta siempre", archivo: "shared/dominio.ts", de: "const validas = pol.assisted_counts ? e : e.filter((x) => !x.conAyuda);", a: "const validas = e;", check: "dominio" },
    { id: "N16 error con ayuda cuenta siempre", archivo: "shared/dominio.ts", de: "const fuenteErrores = e.filter((x) => !x.conAyuda || (x.correcta ? pol.assisted_counts : pol.wrong_with_help_counts));", a: "const fuenteErrores = e;", check: "dominio" },
    { id: "N16 atado a O3 (como E0)", archivo: "shared/dominio.ts", de: "const fuenteErrores = e.filter((x) => !x.conAyuda || (x.correcta ? pol.assisted_counts : pol.wrong_with_help_counts));", a: "const fuenteErrores = pol.wrong_with_help_counts ? e : validas;", check: "dominio" },
    { id: "Escenario 3 sin reparación", archivo: "shared/dominio.ts", de: "if (!reparada || pol.error_repaired_counts)", a: "if (true)", check: "dominio" },
    { id: "Escenario 7 anuladas cuentan", archivo: "shared/dominio.ts", de: "orden.filter((x) => !x.anulada)", a: "orden.filter(() => true)", check: "dominio" },
    { id: "N17 retiradas siempre cuentan", archivo: "shared/dominio.ts", de: "if (!pol.retired_counts) vivas", a: "if (false) vivas", check: "dominio" },
    { id: "Escenario 4 umbral desplazado", archivo: "shared/dominio.ts", de: "if (n >= pol.demote_wrong_families)", a: "if (n > pol.demote_wrong_families)", check: "dominio" },
    { id: "Escenario 10 retención vencida ignorada", archivo: "shared/dominio.ts", de: "n >= 1 || retencionVencida", a: "n >= 1", check: "dominio" },
    { id: "N18 evidencia anterior se suma", archivo: "shared/dominio.ts", de: "const actuales = vivas.filter((x) => vigente(x.versionContenido));", a: "const actuales = vivas;", check: "dominio" },
    { id: "N18 sin herencia", archivo: "shared/dominio.ts", de: "const heredado = [...anteriores.values()].some(", a: "const heredado = false && [...anteriores.values()].some(", check: "dominio" },
    { id: "N18 herencia mezclada con la vigente (como E0)", archivo: "shared/dominio.ts", de: "const heredado = [...anteriores.values()].some(", a: "const heredado = [vivas].some(", check: "dominio" },
    { id: "N18 versiones anteriores sumadas entre sí", archivo: "shared/dominio.ts", de: "const heredado = [...anteriores.values()].some(", a: "const heredado = [[...anteriores.values()].flat()].some(", check: "dominio" },
    { id: "A-1 umbral atado a O1", archivo: "shared/dominio.ts", de: "return errores >= N18_FAMILIAS_ERRADAS", a: "return errores >= pol.not_mastered_wrong_families", check: "dominio" },
    { id: "A-1 umbral distinto de 2", archivo: "shared/dominio.ts", de: "export const N18_FAMILIAS_ERRADAS = 2;", a: "export const N18_FAMILIAS_ERRADAS = 3;", check: "dominio" },
    { id: "D-2 hereda si alguna vez cumplió K6 (como E0)", archivo: "shared/dominio.ts", de: 'calcular(l, pol, false, false).estado === "dominado")', a: 'calcular(l, pol, false, false).estado === "dominado" || calcular(l, pol, false, false).motivo === "contradictoria")', check: "dominio" },
    { id: "Orden por llegada (no determinista)", archivo: "shared/dominio.ts", de: "[...evidencias].sort((a, b) => a.ocurrida - b.ocurrida || a.secuencia - b.secuencia ||", a: "[...evidencias].sort(() => 0 ||", check: "dominio" },
    { id: "TK12 fuente libre", archivo: "shared/dominio.ts", de: "if (!(FUENTES as readonly string[]).includes(x.fuente)) throw", a: "if (false) throw", check: "dominio" },
    { id: "TK15 política nula se ejecuta (evaluar)", archivo: "shared/dominio.ts", de: "if (!esPoliticaEjecutable(pol)) throw", a: "if (false) throw", check: "dominio" },
    { id: "TK15 nulos aceptados (política)", archivo: "shared/politica.ts", de: "const nulos = CAMPOS.filter((k) => p[k] === null || p[k] === undefined);", a: "const nulos: typeof CAMPOS = [];", check: "politica" },
    { id: "K6 admite otro número", archivo: "shared/politica.ts", de: "k6_min_families: (v) => v === K6_FAMILIAS,", a: "k6_min_families: entero,", check: "politica" },
  ],
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
