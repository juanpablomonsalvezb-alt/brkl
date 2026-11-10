// IMP-006: un solo conjunto de estados cerrados para publicación (P19-E1) y para P18 (R-13 de E0).
// Toda lista SQL que mencione un estado cerrado debe ser exactamente SQL_ESTADOS_CERRADOS.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ESTADOS_CERRADOS, SQL_ESTADOS_CERRADOS, esEstadoCerrado } from "../shared/p0e-estados";

assert.deepEqual([...ESTADOS_CERRADOS], ["cerrada_aprobada", "cerrada_agotada", "vencida"]);
assert.equal(SQL_ESTADOS_CERRADOS, "('cerrada_aprobada', 'cerrada_agotada', 'vencida')");
assert.ok(esEstadoCerrado("vencida") && !esEstadoCerrado("en_curso") && !esEstadoCerrado("cerrada_por_excepcion"));

const cerrados = new Set<string>(ESTADOS_CERRADOS);
// Listas literales entre paréntesis que contengan algún estado cerrado y no sean el conjunto exacto.
export function listasDistintas(texto: string): string[] {
  return [...texto.matchAll(/\(\s*'[a-z_]+'(?:\s*,\s*'[a-z_]+')*\s*\)/g)]
    .map((m) => m[0])
    .filter((lista) => {
      const valores = [...lista.matchAll(/'([a-z_]+)'/g)].map((v) => v[1]);
      if (!valores.some((v) => cerrados.has(v) || v.startsWith("cerrada"))) return false;
      return valores.length !== cerrados.size || !valores.every((v) => cerrados.has(v));
    });
}
// Controles: detecta la lista incompleta del hallazgo R-13 y acepta la correcta.
assert.deepEqual(listasDistintas("status in ('cerrada_aprobada','cerrada_agotada')"), ["('cerrada_aprobada','cerrada_agotada')"]);
assert.deepEqual(listasDistintas(`status in ${SQL_ESTADOS_CERRADOS}`), []);
assert.deepEqual(listasDistintas("x in ('cerrada_aprobada','cerrada_agotada','vencida','cerrada_por_excepcion')").length, 1);

const archivos = (dir: string, ext: string): string[] => !fs.existsSync(dir) ? [] :
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? archivos(path.join(dir, e.name), ext) : e.name.endsWith(ext) ? [path.join(dir, e.name)] : []);
const revisados = [...archivos("migrations/vortice", ".sql"), ...archivos("server", ".ts"), ...archivos("shared", ".ts")];
for (const f of revisados) assert.deepEqual(listasDistintas(fs.readFileSync(f, "utf8")), [], `${f}: lista de estados cerrados distinta`);
console.log(`estados-cerrados: ok (${revisados.length} archivos)`);
