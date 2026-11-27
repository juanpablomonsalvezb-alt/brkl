// Paleta de Vórtice: sin verde en sus hojas de estilo y contraste AA en los tokens de texto.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const DIR = "client/src/pages/vortice";
type RGB = [number, number, number];
const rgb = (h: string): RGB => {
  const s = h.length === 4 ? h.replace(/[0-9a-f]/gi, "$&$&") : h;
  return [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)) as RGB;
};
const esVerde = ([r, g, b]: RGB) => {
  const [x, y, z] = [r, g, b].map((v) => v / 255);
  const max = Math.max(x, y, z), min = Math.min(x, y, z), d = max - min;
  if (!d) return false;
  const s = d / (1 - Math.abs(max + min - 1));
  const h = 60 * (max === x ? (((y - z) / d) % 6 + 6) % 6 : max === y ? (z - x) / d + 2 : (x - y) / d + 4);
  return h >= 70 && h <= 170 && s > 0.08;
};

const verdes: string[] = [];
for (const f of readdirSync(DIR).filter((n) => n.endsWith(".css"))) {
  const css = readFileSync(`${DIR}/${f}`, "utf8");
  for (const m of css.matchAll(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi)) if (esVerde(rgb(m[0]))) verdes.push(`${f} ${m[0]}`);
  for (const m of css.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi)) if (esVerde([+m[1], +m[2], +m[3]])) verdes.push(`${f} ${m[0]})`);
}
assert.deepEqual(verdes, [], "hay verde en la interfaz de Vórtice");

const editorial = readFileSync(`${DIR}/vortice-editorial.css`, "utf8");
const token = (n: string) => {
  const m = editorial.match(new RegExp(`--${n}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(m, `falta el token --${n}`);
  return rgb(m[1]);
};
const lum = (c: RGB) => {
  const [r, g, b] = c.map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a: RGB, b: RGB) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
for (const t of ["vx-ink", "vx-ink-soft", "vx-muted", "vx-primary", "vx-turquesa-text", "vx-naranja-text", "vx-violeta", "vx-rojo", "vx-dorado-text"]) {
  for (const f of ["vx-bg", "vx-card"]) assert.ok(contraste(token(t), token(f)) >= 4.5, `${t} sobre ${f} no llega a 4,5:1`);
}
assert.ok(contraste(token("vx-line-strong"), token("vx-card")) >= 3, "borde de control bajo 3:1");
assert.ok(contraste([255, 255, 255], token("vx-primary")) >= 4.5, "texto blanco sobre el azul eléctrico");

const uiFiles = [
  "client/src/pages/CoursePlayer.tsx",
  "client/src/pages/AcademicCopilot.tsx",
  "client/src/components/TextbookViewer.tsx",
  "client/src/components/EvaluationQuiz.tsx",
  "client/src/components/GeminiCopilotButton.tsx",
];
for (const f of uiFiles) {
  const source = readFileSync(f, "utf8");
  assert.ok(!/\b(?:bg|text|border|from|to|via|ring|fill|stroke)-(?:emerald|green|teal|lime)-\d+\b/i.test(source), `${f} contiene un color verde de Tailwind`);
  assert.ok(!/#(?:A51C30|821626|C41E3A|8B1725)\b/i.test(source), `${f} contiene un color de marca anterior`);
}

console.log("ui-colores: ok");
