// Pruebas del monitor de uso de Turso al 50 % y 80 % (Tarea 10).
// Sin red ni ejecución de CLI externo.
// Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import {
  evaluarUsoTurso,
  parsearTursoPlanShow,
  UMBRAL_AVISO_PCT,
  UMBRAL_CRITICO_PCT,
} from "../shared/tursoUso";

assert.equal(UMBRAL_AVISO_PCT, 50);
assert.equal(UMBRAL_CRITICO_PCT, 80);

const SALIDA_REAL = `Organization: personal
Plan: starter
Overages disabled

RESOURCE        USED    LIMIT       LIMIT %  
storage         2.9 MB  5.0 GB      0%       
rows read       <0.1M   500M        0%       
rows written    <0.1M   10M         0%       
embedded syncs  0 B     3.0 GB      0%       
databases       3       100         3%       
locations       4       3           133%     
groups          0       1000000000  0%       

Quota will reset on Mon, 30 Nov 2026 21:00:00 -03`;

const parsed = parsearTursoPlanShow(SALIDA_REAL);
assert.equal(parsed.length, 7);
assert.deepEqual(parsed[0], { recurso: "storage", usado: "2.9 MB", limite: "5.0 GB", porcentaje: 0 });
assert.deepEqual(parsed[1], { recurso: "rows read", usado: "<0.1M", limite: "500M", porcentaje: 0 });
assert.deepEqual(parsed[5], { recurso: "locations", usado: "4", limite: "3", porcentaje: 133 });

const evalReal = evaluarUsoTurso(parsed);
assert.equal(evalReal.nivelGlobal, "critico");
assert.equal(evalReal.alertas.length, 1);
assert.equal(evalReal.alertas[0].recurso, "locations");
assert.equal(evalReal.alertas[0].umbral, 80);

// Bordes exactos: 49 -> ok, 50 -> aviso, 79 -> aviso, 80 -> critico, 133 -> critico
const bordes = evaluarUsoTurso([
  { recurso: "r49", usado: "49", limite: "100", porcentaje: 49 },
  { recurso: "r50", usado: "50", limite: "100", porcentaje: 50 },
  { recurso: "r79", usado: "79", limite: "100", porcentaje: 79 },
  { recurso: "r80", usado: "80", limite: "100", porcentaje: 80 },
  { recurso: "r133", usado: "133", limite: "100", porcentaje: 133 },
]);
assert.equal(bordes.nivelGlobal, "critico");
assert.deepEqual(bordes.recursos.map((r) => r.nivel), ["ok", "aviso", "aviso", "critico", "critico"]);
assert.deepEqual(bordes.alertas.map((a) => [a.recurso, a.nivel, a.umbral]), [
  ["r50", "aviso", 50],
  ["r79", "aviso", 50],
  ["r80", "critico", 80],
  ["r133", "critico", 80],
]);

// Solo aviso -> nivelGlobal = aviso
const soloAviso = evaluarUsoTurso([
  { recurso: "rows read", usado: "250M", limite: "500M", porcentaje: 50 },
]);
assert.equal(soloAviso.nivelGlobal, "aviso");

// Vacío o sin tabla -> ok y vacío
assert.deepEqual(parsearTursoPlanShow("sin tabla\n"), []);
const vacia = evaluarUsoTurso([]);
assert.deepEqual(vacia, { nivelGlobal: "ok", alertas: [], recursos: [] });

console.log("turso-uso: ok");
