// Conversor puro del HTML de evaluaciones (pegado desde Gemini) al formato de questionsJson.
// Formatos que reconoce, en este orden:
//   "script":     datos JS/JSON dentro de <script> (const preguntas = [{ pregunta, opciones, respuesta }]).
//   "formulario": <input type="radio"> agrupados por name; la correcta sale de data-correct / class
//                 "correct" / un mapa de respuestas en <script> / "Respuesta correcta: B" junto al grupo.
//   "texto":      enunciados numerados con alternativas "a) ...", y la correcta marcada en la línea
//                 ("Respuesta: B", "(correcta)", ✓, class/data-correct) o en una pauta final ("1-B, 2-C").
// Nunca adivina: una pregunta sin correcta detectable, con más de una, o con menos de 2 alternativas
// queda en `failed` con el motivo.

export interface ConvertedQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface FailedQuestion {
  index: number; // posición (1-based) en el HTML
  question: string;
  reason: string;
}

export type HtmlFormat = "script" | "formulario" | "texto" | "desconocido";

export interface HtmlConversion {
  format: HtmlFormat;
  questions: ConvertedQuestion[];
  failed: FailedQuestion[];
  // Máximo de preguntas detectadas en cualquiera de los formatos probados. Si es mayor que
  // questions.length + failed.length, la conversión elegida dejó preguntas fuera.
  detected: number;
}

interface Option { text: string; value?: string; correct?: boolean }
interface Draft { question: string; options: Option[]; answer?: unknown; explanation?: string }

const NAMED: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", iquest: "¿", iexcl: "¡",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", uuml: "ü",
  Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Ntilde: "Ñ", Uuml: "Ü",
  ordm: "º", ordf: "ª", deg: "°", laquo: "«", raquo: "»", hellip: "…", mdash: "—", ndash: "–",
  ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", middot: "·", times: "×", divide: "÷",
  check: "✓", cross: "✗",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return NAMED[e] ?? m;
  });
}

const clean = (s: string) => decodeEntities(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const stripNumber = (s: string) => s.replace(/^(?:pregunta\s*)?\d{1,3}\s*[.):\-–]\s*/i, "").trim();
const stripLetter = (s: string) => s.replace(/^\(?[a-f]\s*[).:\-–]\s+/i, "").trim();
const OK = "\u0001"; // marca interna de "esta alternativa es la correcta"

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decodeEntities(m[1] ?? m[2] ?? m[3]) : undefined;
}

// data-correct="true", class="... correct ..." (no "incorrect"), value="correct".
function tagMarksCorrect(tag: string): boolean {
  const flag = attr(tag, "data-correct") ?? attr(tag, "data-correcta") ?? attr(tag, "data-is-correct");
  if (flag !== undefined && /^(true|1|si|sí|yes|correct[a]?)?$/i.test(flag.trim())) return true;
  const cls = attr(tag, "class");
  if (cls && /(^|[\s_-])(correct|correcta|correcto|respuesta-correcta)($|[\s_-])/i.test(cls) && !/incorrect/i.test(cls)) return true;
  const value = attr(tag, "value");
  return !!value && /^(correct|correcta|correcto|true)$/i.test(value);
}

// ---------- Resolución de la respuesta correcta ----------

// Número: índice 0-based (convención de questionsJson). Texto: valor del input, letra A-F o texto exacto.
function resolveAnswer(raw: unknown, options: Option[]): number | null {
  if (typeof raw === "number") return Number.isInteger(raw) && raw >= 0 && raw < options.length ? raw : null;
  if (typeof raw !== "string") return null;
  const s = clean(raw);
  const byValue = options.findIndex((o) => o.value !== undefined && o.value.toLowerCase() === s.toLowerCase());
  if (byValue >= 0) return byValue;
  const letter = s.match(/^\(?([a-f])\s*[).:]?$/i);
  if (letter) {
    const i = letter[1].toLowerCase().charCodeAt(0) - 97;
    return i < options.length ? i : null;
  }
  if (/^\d+$/.test(s)) return resolveAnswer(Number(s), options);
  const byText = options.findIndex((o) => o.text.toLowerCase() === stripLetter(s).toLowerCase());
  return byText >= 0 ? byText : null;
}

function finish(format: HtmlFormat, drafts: Draft[]): HtmlConversion {
  const questions: ConvertedQuestion[] = [];
  const failed: FailedQuestion[] = [];
  drafts.forEach((d, i) => {
    const question = stripNumber(d.question);
    const fail = (reason: string) => failed.push({ index: i + 1, question, reason });
    if (!question) return fail("Sin enunciado");
    if (d.options.length < 2) return fail(`Tiene ${d.options.length} alternativa(s); se necesitan al menos 2`);
    if (d.options.some((o) => !o.text)) return fail("Alternativa vacía");
    const marked = d.options.flatMap((o, j) => (o.correct ? [j] : []));
    let correct: number | null;
    if (d.answer !== undefined && d.answer !== null && d.answer !== "") {
      // Un número (o texto solo de dígitos que no coincide con el value de una alternativa) no dice
      // si cuenta desde 0 o desde 1: se rechaza en vez de adivinar. Se aceptan letra, texto exacto,
      // value del input o marcas explícitas.
      const numeric = typeof d.answer === "number"
        || (typeof d.answer === "string" && /^\s*\d+\s*$/.test(d.answer)
          && !d.options.some((o) => o.value !== undefined && o.value.trim() === String(d.answer).trim()));
      if (numeric) return fail(`Respuesta numérica ambigua "${String(d.answer)}": no se sabe si cuenta desde 0 o desde 1`);
      correct = resolveAnswer(d.answer, d.options);
      if (correct === null) return fail(`Respuesta "${String(d.answer)}" no corresponde a ninguna alternativa`);
      if (marked.length && !(marked.length === 1 && marked[0] === correct)) return fail("Marcas de respuesta contradictorias");
    } else if (marked.length === 1) {
      correct = marked[0];
    } else {
      return fail(marked.length ? "Más de una alternativa marcada como correcta" : "No se detectó la respuesta correcta");
    }
    questions.push({
      id: questions.length + 1,
      question,
      options: d.options.map((o) => o.text),
      correctAnswer: correct,
      explanation: d.explanation?.trim() ?? "",
    });
  });
  return { format, questions, failed, detected: drafts.length };
}

// ---------- Formato "script": literales JS/JSON ----------

function scripts(html: string): string[] {
  return Array.from(html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi), (m) => m[1]);
}

// Devuelve el fin (exclusivo) del bloque [..] o {..} que abre en `start`, saltando strings y comentarios.
function balancedEnd(src: string, start: number): number {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === "\\") i++;
    } else if (c === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
    } else if (c === "/" && src[i + 1] === "*") {
      i = src.indexOf("*/", i + 2);
      if (i < 0) return -1;
      i++;
    } else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") {
      if (--depth === 0) return i + 1;
    }
  }
  return -1;
}

// Literal JS (claves sin comillas, comillas simples, comas finales) → valor. null si no es un literal puro.
function parseJsLiteral(src: string): unknown {
  let out = "";
  for (let i = 0; i < src.length; ) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      let s = "";
      for (i++; i < src.length && src[i] !== c; i++) {
        if (src[i] === "\\") {
          const n = src[++i];
          if (n === "u") { s += String.fromCharCode(parseInt(src.slice(i + 1, i + 5), 16)); i += 4; }
          else s += ({ n: "\n", t: "\t", r: "", b: "", f: "" } as Record<string, string>)[n] ?? n;
        } else if (c === "`" && src[i] === "$" && src[i + 1] === "{") return null; // plantilla con interpolación
        else s += src[i];
      }
      if (i >= src.length) return null;
      out += JSON.stringify(s);
      i++;
    } else if (c === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
    } else if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end < 0) return null;
      i = end + 2;
    } else if (/\d/.test(c) && /^\d+\s*:/.test(src.slice(i)) && /[{,]\s*$/.test(out)) {
      const digits = src.slice(i).match(/^\d+/)![0]; // clave numérica: { 1: "b" }
      out += JSON.stringify(digits);
      i += digits.length;
    } else if (/[A-Za-z_$]/.test(c)) {
      const word = src.slice(i).match(/^[\w$]+/)![0];
      i += word.length;
      if (/^\s*:/.test(src.slice(i))) out += JSON.stringify(word);
      else if (word === "true" || word === "false" || word === "null") out += word;
      else return null; // referencia a variable o expresión: no es dato literal
    } else if (c === ",") {
      if (/^,\s*(?:\/\/[^\n]*\s*)*[\]}]/.test(src.slice(i))) i++; // coma final
      else { out += c; i++; }
    } else {
      out += c;
      i++;
    }
  }
  try { return JSON.parse(out); } catch { return null; }
}

const pick = (o: Record<string, unknown>, re: RegExp) => {
  const k = Object.keys(o).find((key) => re.test(key));
  return k === undefined ? undefined : o[k];
};
const Q_KEY = /^(question|pregunta|enunciado|text|texto|q|title|titulo|título)$/i;
const OPT_KEY = /^(options|opciones|alternativas|answers|choices|respuestas)$/i;
const ANS_KEY = /^(correctanswer|correct_answer|correct|correcta|answer|respuesta|respuestacorrecta|respuesta_correcta|correctindex|correct_index|solution|solucion|solución|clave)$/i;
const EXP_KEY = /^(explanation|explicacion|explicación|feedback|retroalimentacion|retroalimentación|rationale|justificacion|justificación)$/i;

function draftFromObject(o: Record<string, unknown>): Draft | null {
  const q = pick(o, Q_KEY);
  const opts = pick(o, OPT_KEY);
  if (typeof q !== "string" || !Array.isArray(opts)) return null;
  const options: Option[] = opts.map((op) => {
    if (op && typeof op === "object") {
      const r = op as Record<string, unknown>;
      const text = pick(r, /^(text|texto|label|option|opcion|opción|answer|respuesta|value)$/i);
      const flag = pick(r, /^(correct|correcta|correcto|iscorrect|is_correct|escorrecta)$/i);
      return { text: stripLetter(clean(String(text ?? ""))), correct: flag === true || flag === "true" || flag === 1 };
    }
    return { text: stripLetter(clean(String(op ?? ""))) };
  });
  const exp = pick(o, EXP_KEY);
  return { question: clean(q), options, answer: pick(o, ANS_KEY), explanation: typeof exp === "string" ? clean(exp) : undefined };
}

function fromScripts(html: string): Draft[] | null {
  let best: Draft[] | null = null;
  for (const src of scripts(html)) {
    for (const m of Array.from(src.matchAll(/(?:^|[=:(,]\s*)\[/g))) {
      const start = m.index! + m[0].length - 1;
      const end = balancedEnd(src, start);
      if (end < 0) continue;
      const value = parseJsLiteral(src.slice(start, end));
      if (!Array.isArray(value)) continue;
      const drafts = value.filter((v) => v && typeof v === "object").map((v) => draftFromObject(v as Record<string, unknown>));
      if (!drafts.length || drafts.some((d) => !d)) continue;
      if (!best || drafts.length > best.length) best = drafts as Draft[];
    }
  }
  return best;
}

// Mapa de respuestas en <script>: const respuestasCorrectas = { q1: "b", q2: "a" } o ["b", "a"].
function answerMapFromScripts(html: string): Record<string, unknown> | unknown[] | null {
  for (const src of scripts(html)) {
    for (const m of Array.from(src.matchAll(/[\w$]*(?:correct|answer|respuesta|solucion|clave)[\w$]*\s*[=:]\s*([[{])/gi))) {
      const start = m.index! + m[0].length - 1;
      const end = balancedEnd(src, start);
      const value = end < 0 ? null : parseJsLiteral(src.slice(start, end));
      if (Array.isArray(value) && value.every((v) => typeof v === "string" || typeof v === "number")) return value;
      if (value && typeof value === "object" && !Array.isArray(value)
        && Object.values(value).every((v) => typeof v === "string" || typeof v === "number")) return value as Record<string, unknown>;
    }
  }
  return null;
}

// ---------- Formato "formulario": <input type="radio"> ----------

// La letra debe ir seguida de puntuación o fin de línea: "Respuesta: a la izquierda" no cuenta.
const ANSWER_LINE = /\b(?:respuesta\s+correcta|respuesta|clave|correcta|soluci[oó]n)\s*(?:[:\-–]|\bes\b)\s*(?:(?:la|el)\s+)?(?:(?:opci[oó]n|alternativa|letra)\s+)?\(?([a-f])(?=\s*(?:[).,:;\-–—]|$))/i;
const EXPLANATION_LINE = /^(?:explicaci[oó]n|retroalimentaci[oó]n|justificaci[oó]n|feedback|por qu[eé])\s*[:\-–]\s*(.+)$/i;

function fromRadios(html: string): Draft[] | null {
  const body = html.replace(/<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->/gi, "");
  const inputs = Array.from(body.matchAll(/<input\b[^>]*>/gi)).filter((m) => /type\s*=\s*["']?radio/i.test(m[0]));
  if (!inputs.length) return null;

  const groups: { name: string; items: { tag: string; at: number; end: number }[] }[] = [];
  for (const m of inputs) {
    const name = attr(m[0], "name") ?? `__${groups.length}`;
    let g = groups.find((x) => x.name === name);
    if (!g) groups.push((g = { name, items: [] }));
    g.items.push({ tag: m[0], at: m.index!, end: m.index! + m[0].length });
  }
  groups.sort((a, b) => a.items[0].at - b.items[0].at);

  const labelsFor = new Map<string, string>();
  for (const m of Array.from(body.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label\s*>/gi))) {
    const f = attr(m[0], "for");
    if (f) labelsFor.set(f, m[2]);
  }
  const answerMap = answerMapFromScripts(html);

  return groups.map((g, gi) => {
    const prevEnd = gi === 0 ? 0 : Math.max(...groups[gi - 1].items.map((it) => it.end));
    const lastEnd = Math.max(...g.items.map((it) => it.end));
    const nextStart = gi + 1 < groups.length ? groups[gi + 1].items[0].at : body.length;
    // Enunciado: última línea con texto entre el grupo anterior y la primera alternativa.
    const before = htmlToLines(body.slice(prevEnd, g.items[0].at).replace(/^[^<]*<\/label\s*>/i, ""))
      .filter((l) => !ANSWER_LINE.test(l) && !EXPLANATION_LINE.test(l));
    const options: Option[] = g.items.map((it, i) => {
      const id = attr(it.tag, "id");
      const stop = i + 1 < g.items.length ? g.items[i + 1].at : nextStart;
      const after = body.slice(it.end, stop);
      const raw = id && labelsFor.has(id) ? labelsFor.get(id)! : after.split(/<\/label\s*>|<input\b|<\/li\s*>|<br\s*\/?>|<\/p\s*>|<\/div\s*>/i)[0];
      // La etiqueta <label ...> que envuelve al input también puede traer la marca.
      const wrapper = body.slice(Math.max(prevEnd, it.at - 300), it.at).match(/<(?:label|li|div)\b[^>]*>\s*$/i)?.[0] ?? "";
      return { text: stripLetter(clean(raw)), value: attr(it.tag, "value"), correct: tagMarksCorrect(it.tag) || tagMarksCorrect(wrapper) };
    });
    const tail = htmlToLines(body.slice(lastEnd, nextStart));
    const explanation = tail.map((l) => l.match(EXPLANATION_LINE)?.[1]).find(Boolean);
    let answer: unknown = Array.isArray(answerMap) ? answerMap[gi] : answerMap?.[g.name] ?? answerMap?.[String(gi + 1)];
    if (answer === undefined) answer = tail.map((l) => l.match(ANSWER_LINE)?.[1]).find(Boolean);
    return { question: before[before.length - 1] ?? "", options, answer, explanation };
  });
}

// ---------- Formato "texto" ----------

// HTML → líneas de texto. Los elementos marcados como correctos llevan la marca OK al inicio.
function htmlToLines(html: string): string[] {
  const marked = html
    .replace(/<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->/gi, "")
    .replace(/<(li|p|div|label|td)\b[^>]*>/gi, (tag) => (tagMarksCorrect(tag) ? `\n${OK}` : "\n"))
    .replace(/<\/?(br|p|div|li|ul|ol|h[1-6]|tr|table|section|article|fieldset|legend|form|label|button|header|footer|blockquote|pre)\b[^>]*>/gi, "\n");
  const out: string[] = [];
  let pending = false; // marca en una línea sin texto (p. ej. <li class="correct"><p>…</p></li>)
  for (const raw of decodeEntities(marked.replace(/<[^>]*>/g, " ")).split("\n")) {
    const ok = raw.includes(OK);
    const text = raw.split(OK).join("").replace(/\s+/g, " ").trim();
    if (!text) { pending ||= ok; continue; }
    out.push((ok || pending ? OK : "") + text);
    pending = false;
  }
  return out;
}

const NUMBERED = /^(?:pregunta\s*)?(\d{1,3})\s*[.):\-–]\s*(.*)$|^pregunta\s+(\d{1,3})\s*$/i;
const OPTION = /^\(?([a-f])\s*[).:\-–]\s+(.+)$/i;
const KEY_HEADER = /^(?:hoja de respuestas|respuestas(?: correctas)?|claves|clave de respuestas|pauta(?: de correcci[oó]n)?|solucionario|soluciones)\s*:?\s*(.*)$/i;
const CORRECT_SUFFIX = /\s*(?:\((?:correcta|correcto|respuesta correcta)\)|[✓✔✅]|\*)\s*$/i;
const CORRECT_PREFIX = /^(?:[✓✔✅]|\*)\s*/;

function fromText(html: string): Draft[] {
  const drafts: (Draft & { num?: number })[] = [];
  let cur: (Draft & { num?: number }) | undefined;
  let key: string[] | null = null;

  for (let line of htmlToLines(html)) {
    if (key) { key.push(line); continue; }
    const header = line.match(KEY_HEADER);
    if (header && drafts.length) { key = [header[1]]; continue; }

    let ok = false;
    if (line.startsWith(OK)) { ok = true; line = line.slice(1).trim(); }

    const num = line.match(NUMBERED);
    if (num && !OPTION.test(line)) {
      // Alternativas en la misma línea: "1. ¿...? a) x b) y c) z"
      const parts = (num[2] ?? "").split(/\s+(?=\(?[a-f]\)\s)/i);
      cur = { num: Number(num[1] ?? num[3]), question: parts[0], options: [] };
      drafts.push(cur);
      for (const p of parts.slice(1)) addOption(cur, p, false);
      continue;
    }
    if (!cur) continue;
    const answer = !OPTION.test(line) ? line.match(new RegExp(`^${ANSWER_LINE.source}`, "i")) : null;
    if (answer) { cur.answer = answer[1]; continue; }
    const exp = line.match(EXPLANATION_LINE);
    if (exp) { cur.explanation = exp[1]; continue; }
    if (OPTION.test(line)) { addOption(cur, line, ok); continue; }
    if (!cur.options.length) cur.question = `${cur.question} ${line}`.trim(); // enunciado en varias líneas
  }

  // Pauta final: "1-B, 2-C" / "1. b" / "1) c"
  if (key) {
    for (const m of Array.from(key.join(" ").matchAll(/(\d{1,3})\s*[.):\-–=]?\s*\(?([a-f])\b/gi))) {
      const d = drafts.find((x) => x.num === Number(m[1]));
      if (d && d.answer === undefined) d.answer = m[2];
    }
  }
  return drafts;
}

function addOption(d: Draft, line: string, ok: boolean) {
  const m = line.match(OPTION);
  if (!m) return;
  let text = m[2];
  if (CORRECT_SUFFIX.test(text) || CORRECT_PREFIX.test(text)) { ok = true; text = text.replace(CORRECT_SUFFIX, "").replace(CORRECT_PREFIX, ""); }
  d.options.push({ text: text.trim(), value: m[1].toLowerCase(), correct: ok });
}

// ---------- Entrada ----------

// Prueba los tres formatos y se queda con el que convierte más preguntas (a igualdad, el de menos fallas).
export function htmlToQuestions(html: unknown): HtmlConversion {
  let best: HtmlConversion = { format: "desconocido", questions: [], failed: [], detected: 0 };
  if (typeof html !== "string" || !html.trim()) return best;
  // Preguntas en <script> y en el DOM estático son conjuntos distintos (un HTML mixto suma ambos);
  // formulario y texto leen el mismo DOM, así que entre ellos cuenta el mayor.
  let inScript = 0, inDom = 0;
  const attempts: [HtmlFormat, () => Draft[] | null][] = [["script", () => fromScripts(html)], ["formulario", () => fromRadios(html)], ["texto", () => fromText(html)]];
  for (const [format, run] of attempts) {
    const drafts = run();
    if (!drafts?.length) continue;
    const r = finish(format, drafts);
    if (format === "script") inScript = drafts.length; else inDom = Math.max(inDom, drafts.length);
    if (best.format === "desconocido" || r.questions.length > best.questions.length
      || (r.questions.length === best.questions.length && r.failed.length < best.failed.length)) best = r;
  }
  return { ...best, detected: inScript + inDom };
}
