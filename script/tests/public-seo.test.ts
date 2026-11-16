import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, mkdtempSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { PRERENDER_ROUTES, SITE_URL, snapshotFile } from "../../shared/prerender-routes";
import { canonicalFor, isPublicSeoRoute, privateFallback, assertSnapshot } from "../../shared/seo-policy";
import { snapshotSourceHash } from "../snapshot-source";
import { EXAM_PERIODS_2026 } from "../../shared/exam-calendar.mjs";

const read = (path: string) => readFileSync(path, "utf8");
const snapshot = (route: string) => read(`client/public/prerendered/${snapshotFile(route)}`);
const schemas = (html: string) => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => JSON.parse(m[1]));

test("solo las rutas públicas explícitas son indexables", () => {
  for (const route of PRERENDER_ROUTES) assert.equal(isPublicSeoRoute(route), true);
  for (const route of ["/dashboard", "/course/123", "/together/sala", "/vortice", "/asi-trabajamos", "/planes-2026", "/plataforma/media", "/api/faqs", "/ruta-nueva"]) {
    assert.equal(isPublicSeoRoute(route), false, route);
  }
  assert.equal(isPublicSeoRoute("/together/"), true);
  assert.equal(canonicalFor("/electivos/"), SITE_URL + "/electivos");
});

test("fallback privado contiene noindex inicial, sin canónica ni schema heredado", () => {
  const fallback = privateFallback(read("client/index.html"));
  assert.match(fallback, /name="robots" content="noindex, nofollow"/);
  assert.doesNotMatch(fallback, /rel="canonical"|property="og:url"|application\/ld\+json/);
});

test("se rechazan snapshots incompletos o noindex", () => {
  assert.throws(() => assertSnapshot('<h1>FAQ</h1>Cargando preguntas…', "/preguntas-frecuentes"));
  assert.throws(() => assertSnapshot('<h1>FAQ</h1>', "/preguntas-frecuentes"));
  assert.throws(() => assertSnapshot(`<h1>FAQ</h1><link href="${canonicalFor("/")}"><meta name="robots" content="noindex">`, "/"));
});

test("todos los snapshots son completos y corresponden a las fuentes actuales", () => {
  const hash = snapshotSourceHash();
  for (const route of PRERENDER_ROUTES) {
    const html = snapshot(route);
    assertSnapshot(html, route);
    assert.ok(html.includes(`name="barkley:snapshot-source" content="${hash}"`), route);
    assert.doesNotMatch(html, /\{\{precio_/);
    assert.equal((html.match(/<h1[\s>]/gi) ?? []).length, 1, route);
  }
});

test("FAQ dispone de respuestas iniciales y marcado; portada sin FAQ invisible ni entidad duplicada", () => {
  const faq = snapshot("/preguntas-frecuentes");
  const schema = schemas(faq).find((s) => s["@type"] === "FAQPage");
  assert.ok(schema.mainEntity.length >= 6);
  for (const entity of schema.mainEntity) {
    assert.ok(faq.includes(entity.name));
    assert.ok(faq.includes(entity.acceptedAnswer.text));
  }
  const home = schemas(snapshot("/"));
  assert.equal(home.filter((s) => s["@type"] === "FAQPage").length, 0);
  assert.equal(home.filter((s) => s["@type"] === "EducationalOrganization").length, 1);
  assert.equal(home.find((s) => s["@type"] === "EducationalOrganization")["@id"], SITE_URL + "/#organization");
});

test("metadatos sociales propios en cada ruta pública", () => {
  for (const route of PRERENDER_ROUTES) {
    const html = snapshot(route);
    const title = html.match(/<title>(.*?)<\/title>/s)![1];
    assert.ok(html.includes(`property="og:title" content="${title}"`), route);
    assert.ok(html.includes(`property="og:url" content="${canonicalFor(route)}"`), route);
  }
  const homeDescription = snapshot("/").match(/name="description" content="([^"]*)"/)![1];
  assert.ok(!snapshot("/neurodivergentes").includes(`name="description" content="${homeDescription}"`));
});

test("el HTML inicial contiene enlaces del menú, estado accesible y landmark principal", () => {
  const home = snapshot("/");
  for (const href of ["/por-que-barkley", "/preguntas-frecuentes", "/examenes-libres-y-resultados"]) assert.ok(home.includes(`href="${href}"`));
  assert.match(home, /aria-expanded="false"/);
  assert.match(home, /<main id="main-content">/);
});

test("los 12 niveles no repiten fechas antiguas ni el indicador corrupto conocido", () => {
  const dirs = readdirSync("client/public").filter((p) => /^examenes-libres-[1-8]-(basico|medio)$/.test(p));
  assert.equal(dirs.length, 12);
  for (const dir of dirs) {
    const html = read(`client/public/${dir}/index.html`);
    assert.doesNotMatch(html, /3-7 de junio|7-11 de octubre|eventos de la temporales|mismo plazo del primer/);
    for (const period of EXAM_PERIODS_2026) assert.ok(html.includes(period.exams), dir);
    schemas(html); // JSON-LD parseable, aun antes de sustituir precios en build.
  }
  assert.equal(EXAM_PERIODS_2026[2].registration, "12 de mayo al 17 de julio de 2026");
});

test("regenerar niveles conserva el calendario correcto (aislado del repositorio)", () => {
  const dir = mkdtempSync(join(tmpdir(), "barkley-landings-"));
  try {
    for (const path of ["scripts/generate-landings.mjs", "shared/exam-calendar.mjs", "scripts/data/mineduc-temarios-manifest.json"]) {
      mkdirSync(join(dir, path, ".."), { recursive: true });
      copyFileSync(path, join(dir, path));
    }
    const run = spawnSync(process.execPath, [join(dir, "scripts/generate-landings.mjs")], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    const html = read(join(dir, "client/public/examenes-libres-1-basico/index.html"));
    assert.doesNotMatch(html, /3-7 de junio|7-11 de octubre|eventos de la temporales/);
    for (const period of EXAM_PERIODS_2026) assert.ok(html.includes(period.registration));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
