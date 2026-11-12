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
  h2: [
    // Grafo (shared/grafo.ts)
    { id: "grafo sin detectar ciclos", archivo: "shared/grafo.ts", de: "if (orden.length < codigo.size) {", a: "if (false) {", check: "grafo" },
    { id: "grafo acepta alternativa en etapa 1", archivo: "shared/grafo.ts", de: 'if (a.relation === "alternativa" && etapa === 1)', a: "if (false)", check: "grafo" },
    { id: "grafo acepta arista sin validador", archivo: "shared/grafo.ts", de: 'if (!a.validatedBy) errores.push({ tipo: "sin_validador", ...par });', a: "", check: "grafo" },
    { id: "grafo desempata sin código", archivo: "shared/grafo.ts", de: "listos.sort((x, y) => porCodigo(codigo.get(x)!, codigo.get(y)!)); }", a: "}", check: "grafo" },
    // Base (migrations/vortice/0001_catalogo.sql)
    { id: "base deja editar lo publicado", archivo: "migrations/vortice/0001_catalogo.sql", de: "kiv_bloqueo_update BEFORE UPDATE ON knowledge_item_versions", a: "kiv_bloqueo_update BEFORE UPDATE OF supersedes_version_id ON knowledge_item_versions", check: "catalogo-db" },
    { id: "base valida sin requisitos (continuidad, OA, aristas)", archivo: "migrations/vortice/0001_catalogo.sql", de: "WHEN NEW.status = 'validada' AND OLD.status = 'en_revision'\nBEGIN", a: "WHEN 0\nBEGIN", check: "catalogo-db" },
    { id: "P-H2-1 validada sigue editable", archivo: "migrations/vortice/0001_catalogo.sql", de: "WHEN (SELECT status FROM knowledge_domain_versions WHERE id = OLD.domain_version_id) IN ('validada', 'publicada', 'retirada')\n  OR NEW.id <> OLD.id OR NEW.item_id", a: "WHEN (SELECT status FROM knowledge_domain_versions WHERE id = OLD.domain_version_id) IN ('publicada', 'retirada')\n  OR NEW.id <> OLD.id OR NEW.item_id", check: "catalogo-db" },
    { id: "P-H2-1 volver a revisión conserva la validación (base)", archivo: "migrations/vortice/0001_catalogo.sql", de: "(OLD.status = 'validada' AND NEW.status = 'en_revision' AND NEW.validated_by IS NULL AND", a: "(OLD.status = 'validada' AND NEW.status = 'en_revision' AND", check: "catalogo-db" },
    { id: "P-H2-1 volver a revisión conserva la validación (servicio)", archivo: "server/catalogo.ts", de: 'const extra = a === "borrador" || a === "en_revision" ?', a: 'const extra = a === "borrador" ?', check: "catalogo" },
    { id: "P-H2-2 aristas copiadas conservan la validación", archivo: "server/catalogo.ts", de: "a.justification, a.confidence, null, null] as any", a: "a.justification, a.confidence, a.validated_by, a.validated_at] as any", check: "catalogo" },
    { id: "P-H2-2 se valida la versión con aristas sin validar", archivo: "migrations/vortice/0001_catalogo.sql", de: "  SELECT RAISE(ABORT, 'knowledge_domain_versions: arista sin validar')\n  WHERE EXISTS (SELECT 1 FROM knowledge_prerequisites WHERE domain_version_id = NEW.id AND validated_by IS NULL);", a: "  SELECT 1;", check: "catalogo-db" },
    { id: "P-H2-2 una arista nace validada", archivo: "migrations/vortice/0001_catalogo.sql", de: "WHEN NEW.validated_by IS NOT NULL\nBEGIN SELECT RAISE(ABORT, 'knowledge_prerequisites: una arista se crea sin validar", a: "WHEN 0\nBEGIN SELECT RAISE(ABORT, 'knowledge_prerequisites: una arista se crea sin validar", check: "catalogo-db" },
    { id: "P-H2-2 la autora valida sus aristas", archivo: "migrations/vortice/0001_catalogo.sql", de: "AND NEW.validated_by = (SELECT created_by FROM knowledge_domain_versions WHERE id = NEW.domain_version_id)", a: "AND 0", check: "catalogo-db" },
    { id: "P-H2-2 modificar arista conserva la validación", archivo: "migrations/vortice/0001_catalogo.sql", de: "CREATE TRIGGER kp_cambio_anula_validacion BEFORE UPDATE ON knowledge_prerequisites\nWHEN NEW.validated_by IS NOT NULL AND", a: "CREATE TRIGGER kp_cambio_anula_validacion BEFORE UPDATE ON knowledge_prerequisites\nWHEN 0 AND", check: "catalogo-db" },
    { id: "P-H2-2 cambiar el contenido no anula sus aristas", archivo: "migrations/vortice/0001_catalogo.sql", de: "WHERE domain_version_id = NEW.domain_version_id AND (item_id = NEW.item_id OR prerequisite_item_id = NEW.item_id);", a: "WHERE 0;", check: "catalogo-db" },
    { id: "P-H2-2 validarArista sobrescribe una validación", archivo: "server/catalogo.ts", de: "WHERE id = ? AND validated_by IS NULL\"", a: "WHERE id = ?\"", check: "catalogo" },
    { id: "base admite dos publicadas", archivo: "migrations/vortice/0001_catalogo.sql", de: "(domain_id) WHERE status = 'publicada';", a: "(domain_id) WHERE status = 'nunca';", check: "catalogo-db" },
    { id: "base admite arista externa", archivo: "migrations/vortice/0001_catalogo.sql", de: "  FOREIGN KEY (domain_version_id, prerequisite_item_id) REFERENCES knowledge_item_versions (domain_version_id, item_id) ON DELETE RESTRICT,\n", a: "", check: "catalogo-db" },
    { id: "base admite validador = autor", archivo: "migrations/vortice/0001_catalogo.sql", de: "CHECK (validated_by IS NULL OR validated_by <> created_by),", a: "CHECK (1),", check: "catalogo-db" },
    { id: "base admite OA de otra asignatura", archivo: "migrations/vortice/0001_catalogo.sql", de: "IS NOT (SELECT level_subject_id FROM curriculum_objectives WHERE id = NEW.curriculum_objective_id)", a: "IS NOT (SELECT d2.level_subject_id FROM knowledge_item_versions v2 JOIN knowledge_domains d2 ON d2.id = v2.domain_id WHERE v2.id = NEW.item_version_id)", check: "catalogo-db" },
    { id: "base deja reemplazar un borrador", archivo: "migrations/vortice/0001_catalogo.sql", de: "da.status IN ('publicada', 'retirada') AND da.version < dn.version)\nBEGIN SELECT RAISE(ABORT, 'knowledge_item_versions: solo reemplaza una versión publicada anterior'); END;\n--> statement-breakpoint\nCREATE TRIGGER kiv_linaje_update", a: "1)\nBEGIN SELECT RAISE(ABORT, 'knowledge_item_versions: solo reemplaza una versión publicada anterior'); END;\n--> statement-breakpoint\nCREATE TRIGGER kiv_linaje_update", check: "catalogo-db" },
    // Servicio (server/catalogo.ts)
    { id: "contexto cruza la ruptura", archivo: "server/catalogo.ts", de: 'cadena[i].continuidad === "compatible"', a: "cadena[i].continuidad !== null", check: "catalogo" },
    { id: "publica sin validar el grafo", archivo: "server/catalogo.ts", de: 'if (!r.ok) throw new CatalogoError("El grafo no se puede publicar", r.errores);', a: "", check: "catalogo" },
    { id: "publica sin retirar la anterior", archivo: "server/catalogo.ts", de: "await t.execute({ sql: \"UPDATE knowledge_domain_versions SET status = 'retirada' WHERE domain_id = ? AND status = 'publicada'\", args: [String(dv.domain_id)] });", a: "", check: "catalogo" },
    { id: "publica sin leer el grafo de la versión", archivo: "server/catalogo.ts", de: "const r = validarGrafo(await grafoDeVersion(t, domainVersionId), 1);", a: "const r = validarGrafo({ nodos: [], aristas: [] }, 1);", check: "catalogo" },
    { id: "diferencias acepta versión inexistente", archivo: "server/catalogo.ts", de: 'if (filas.length !== (versionA === versionB ? 1 : 2)) throw new CatalogoError("Versión de dominio inexistente");', a: "", check: "catalogo" },
    { id: "base publica sobre una base vieja", archivo: "migrations/vortice/0001_catalogo.sql", de: "OR (enBase.id IS NOT NULL AND v.supersedes_version_id IS NOT enBase.id)", a: "OR 0", check: "catalogo-db" },
    { id: "base publica una versión anterior", archivo: "migrations/vortice/0001_catalogo.sql", de: "AND p.status IN ('publicada', 'retirada') AND p.version >= NEW.version);", a: "AND 0);", check: "catalogo" },
    { id: "base conserva continuidad al cambiar el reemplazado", archivo: "migrations/vortice/0001_catalogo.sql", de: "WHEN NEW.supersedes_version_id IS NOT OLD.supersedes_version_id AND NEW.evidence_continuity IS NOT NULL", a: "WHEN 0", check: "catalogo-db" },
    { id: "P-H2-4: base deja agregar OA a versión cerrada", archivo: "migrations/vortice/0001_catalogo.sql", de: "CREATE TRIGGER kio_bloqueo_insert BEFORE INSERT ON knowledge_item_oas\nWHEN", a: "CREATE TRIGGER kio_bloqueo_insert BEFORE INSERT ON knowledge_item_oas\nWHEN 0 AND", check: "catalogo-db" },
    { id: "P-H2-4: base deja quitar OA de versión cerrada", archivo: "migrations/vortice/0001_catalogo.sql", de: "CREATE TRIGGER kio_bloqueo_delete BEFORE DELETE ON knowledge_item_oas\nWHEN", a: "CREATE TRIGGER kio_bloqueo_delete BEFORE DELETE ON knowledge_item_oas\nWHEN 0 AND", check: "catalogo-db" },
    { id: "P-H2-4: base deja agregar módulo a versión cerrada", archivo: "migrations/vortice/0001_catalogo.sql", de: "CREATE TRIGGER kim_bloqueo_insert BEFORE INSERT ON knowledge_item_modules\nWHEN", a: "CREATE TRIGGER kim_bloqueo_insert BEFORE INSERT ON knowledge_item_modules\nWHEN 0 AND", check: "catalogo-db" },
    { id: "P-H2-4: base deja quitar módulo de versión cerrada", archivo: "migrations/vortice/0001_catalogo.sql", de: "CREATE TRIGGER kim_bloqueo_delete BEFORE DELETE ON knowledge_item_modules\nWHEN", a: "CREATE TRIGGER kim_bloqueo_delete BEFORE DELETE ON knowledge_item_modules\nWHEN 0 AND", check: "catalogo-db" },
    { id: "P-H2-4: publicar no revisa la integridad de asociaciones", archivo: "migrations/vortice/0001_catalogo.sql", de: "o.item_version_id = v.id));\n  SELECT RAISE(ABORT, 'knowledge_domain_versions: asociación de otra asignatura o nivel')\n  WHERE EXISTS", a: "o.item_version_id = v.id));\n  SELECT RAISE(ABORT, 'knowledge_domain_versions: asociación de otra asignatura o nivel')\n  WHERE 0 AND EXISTS", check: "catalogo-db" },
    { id: "P-H2-4: quitar un vínculo inexistente es silencioso", archivo: "server/catalogo.ts", de: "if (r.rowsAffected === 0) throw", a: "if (false) throw", check: "catalogo" },
    { id: "P-H2-4: la versión nueva no copia los vínculos", archivo: "server/catalogo.ts", de: "FROM ${tabla} WHERE item_version_id = ?`", a: "FROM ${tabla} WHERE 0 AND item_version_id = ?`", check: "catalogo" },
    { id: "P-H2-4: validar no revisa la integridad de asociaciones", archivo: "migrations/vortice/0001_catalogo.sql", de: "  SELECT RAISE(ABORT, 'knowledge_domain_versions: arista sin validar')\n  WHERE EXISTS (SELECT 1 FROM knowledge_prerequisites WHERE domain_version_id = NEW.id AND validated_by IS NULL);\n  SELECT RAISE(ABORT, 'knowledge_domain_versions: asociación de otra asignatura o nivel')\n  WHERE EXISTS", a: "  SELECT RAISE(ABORT, 'knowledge_domain_versions: arista sin validar')\n  WHERE EXISTS (SELECT 1 FROM knowledge_prerequisites WHERE domain_version_id = NEW.id AND validated_by IS NULL);\n  SELECT RAISE(ABORT, 'knowledge_domain_versions: asociación de otra asignatura o nivel')\n  WHERE 0 AND EXISTS", check: "catalogo-db" },
    { id: "base deja reescribir vínculos de OA", archivo: "migrations/vortice/0001_catalogo.sql", de: "CREATE TRIGGER kio_sin_update BEFORE UPDATE ON knowledge_item_oas BEGIN", a: "CREATE TRIGGER kio_sin_update BEFORE UPDATE ON knowledge_item_oas WHEN 0 BEGIN", check: "catalogo-db" },
    { id: "diferencias no ve modificados", archivo: "server/catalogo.ts", de: "ca.has(k) && ca.get(k) !== cb.get(k)", a: "false", check: "catalogo" },
    { id: "nueva versión sin linaje", archivo: "server/catalogo.ts", de: "String(v.operational_definition), String(v.id)] as any", a: "String(v.operational_definition), null] as any", check: "catalogo" },
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
