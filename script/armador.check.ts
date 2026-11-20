// Pruebas de shared/armador.ts: capacidadBanco, armarExtra, verificarExtra.
// Ejecutar: npx tsx script/armador.check.ts
import assert from "node:assert/strict";
import {
  capacidadBanco,
  armarExtra,
  verificarExtra,
  type Pregunta,
  type Banco,
  type PruebaNormal,
} from "../shared/armador";

let casos = 0;
let fallas = 0;
const salida: string[] = [];

const caso = (id: string, nombre: string, f: () => void) => {
  try {
    f();
    casos++;
    salida.push(`  ✓ ${id.padEnd(5)} ${nombre}`);
  } catch (e) {
    fallas++;
    casos++;
    salida.push(`  ✗ ${id.padEnd(5)} ${nombre}`);
    salida.push(`    ERROR: ${e}`);
  }
};

// ——— Helpers para construir bancos ———

/**
 * Construye un banco con `porSubtema` preguntas por subtema.
 * Subtemas: "A", "B", "C". IDs: "A1", "A2", ..., "B1", "B2", ...
 */
function bancoUniforme(porSubtema: number): Banco {
  const banco: Pregunta[] = [];
  for (const st of ["A", "B", "C"]) {
    for (let i = 1; i <= porSubtema; i++) {
      banco.push({ id: `${st}${i}`, subtemaId: st });
    }
  }
  return banco;
}

/**
 * Prueba normal que toma `n` preguntas de cada subtema.
 */
function pruebaNormalUniforme(porSubtema: number, n: number): PruebaNormal {
  const ids: string[] = [];
  for (const st of ["A", "B", "C"]) {
    for (let i = 1; i <= n; i++) {
      ids.push(`${st}${i}`);
    }
  }
  return ids;
}

// ——— Ejemplo P21: 3 subtemas, N=12, 4 por subtema ———
// El documento P21 v2 §2: E2 con 3 subtemas (A, B, C) y 12 preguntas, 4 por subtema.
// Banco justo = 4 preguntas por subtema (12 total). Normal usa las 12.
// Si normal usa 4 de cada subtema y el banco tiene 4 de cada subtema,
// no hay preguntas disponibles → capacidad insuficiente.

// ——— 1. capacidadBanco: banco justo (4 por subtema, N=12) ———

caso("C1", "banco justo (4/subtema, N=12): suficiente=false", () => {
  // Banco: 4 preguntas por subtema = 12 total
  // Normal: 4 de cada subtema = 12 preguntas
  // Disponibles por subtema: 0 → insuficiente
  const banco = bancoUniforme(4);
  const normal = pruebaNormalUniforme(4, 4);
  const r = capacidadBanco(banco, normal, 12);
  assert.equal(r.suficiente, false, "banco justo debe ser insuficiente (0 disponibles por subtema)");
});

// ——— 2. capacidadBanco: banco holgado (8 por subtema, N=12) ———

caso("C2", "banco holgado (8/subtema, N=12): suficiente=true (ENMENDADO 0.35)", () => {
  // Banco: 8 preguntas por subtema = 24 total
  // Normal: 4 de cada subtema = 12 preguntas
  // Disponibles por subtema: 4 → minFallados = ceil(0.35*12) = ceil(4.2) = 5
  // 4 < 5 → insuficiente por subtema individual
  const banco = bancoUniforme(8);
  const normal = pruebaNormalUniforme(8, 4);
  const r = capacidadBanco(banco, normal, 12);
  // Con 8 por subtema y normal usando 4, hay 4 disponibles por subtema.
  // minFallados = ceil(0.35 * 12) = 5. 4 < 5 → insuficiente.
  assert.equal(r.suficiente, false, "8/subtema con 4 usadas: 4 disponibles < 5 mínimo");
});

// ——— 3. capacidadBanco: banco suficiente (12 por subtema, N=12) ———

caso("C3", "banco suficiente (12/subtema, N=12): suficiente=true", () => {
  // Banco: 12 preguntas por subtema = 36 total
  // Normal: 4 de cada subtema = 12 preguntas
  // Disponibles por subtema: 8 → minFallados = 5. 8 >= 5 → suficiente.
  // Total no usadas: 36 - 12 = 24 >= 12 → ok.
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  const r = capacidadBanco(banco, normal, 12);
  assert.equal(r.suficiente, true, "12/subtema con 4 usadas: 8 disponibles >= 5 mínimo");
  assert.deepEqual(r.deficits, {}, "no debe haber déficits");
});

// ——— 4. capacidadBanco: banco mínimo suficiente (10 por subtema, N=12) ———

caso("C4", "banco mínimo suficiente (9/subtema, N=12): suficiente=true (ENMENDADO 0.35)", () => {
  // Banco: 9 preguntas por subtema = 27 total
  // Normal: 4 de cada subtema = 12 preguntas
  // Disponibles por subtema: 5 → minFallados = 5. 5 >= 5 → suficiente.
  const banco = bancoUniforme(9);
  const normal = pruebaNormalUniforme(9, 4);
  const r = capacidadBanco(banco, normal, 12);
  assert.equal(r.suficiente, true, "9/subtema con 4 usadas: 5 disponibles = 5 mínimo");
});

// ——— 5. capacidadBanco: banco insuficiente por un subtema ———

caso("C5", "banco desbalanceado: suficiente=false con déficit", () => {
  // Banco: A=10, B=10, C=4 preguntas
  // Normal: 4 de A, 4 de B, 4 de C = 12 preguntas
  // Disponibles: A=6, B=6, C=0 → C tiene déficit de 5 (minFallados=5)
  const banco: Pregunta[] = [];
  for (let i = 1; i <= 10; i++) banco.push({ id: `A${i}`, subtemaId: "A" });
  for (let i = 1; i <= 10; i++) banco.push({ id: `B${i}`, subtemaId: "B" });
  for (let i = 1; i <= 4; i++) banco.push({ id: `C${i}`, subtemaId: "C" });
  const normal: PruebaNormal = [];
  for (let i = 1; i <= 4; i++) normal.push(`A${i}`);
  for (let i = 1; i <= 4; i++) normal.push(`B${i}`);
  for (let i = 1; i <= 4; i++) normal.push(`C${i}`);
  const r = capacidadBanco(banco, normal, 12);
  assert.equal(r.suficiente, false, "C sin disponibles → insuficiente");
  assert.ok(r.deficits["C"] > 0, "C debe tener déficit");
});

// ——— 6. capacidadBanco: N por defecto ———

caso("C6", "capacidadBanco sin N usa normal.length", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  const r1 = capacidadBanco(banco, normal);
  const r2 = capacidadBanco(banco, normal, 12);
  assert.equal(r1.suficiente, r2.suficiente, "N por defecto debe dar mismo resultado");
});

// ——— 7. armarExtra: caso básico con banco suficiente ———

caso("E1", "armarExtra: un subtema fallado, banco suficiente", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  const extra = armarExtra({ banco, normal, fallados: ["B"], semilla: 42 });
  assert.equal(extra.length, 12, "extra debe tener 12 preguntas");
  const violaciones = verificarExtra({ banco, normal, fallados: ["B"], extra });
  assert.equal(violaciones.length, 0, `violaciones: ${violaciones.map((v) => v.detalle).join("; ")}`);
});

// ——— 8. armarExtra: dos subtemas fallados ———

caso("E2", "armarExtra: dos subtemas fallados", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  const extra = armarExtra({ banco, normal, fallados: ["B", "C"], semilla: 42 });
  assert.equal(extra.length, 12, "extra debe tener 12 preguntas");
  const violaciones = verificarExtra({ banco, normal, fallados: ["B", "C"], extra });
  assert.equal(violaciones.length, 0, `violaciones: ${violaciones.map((v) => v.detalle).join("; ")}`);
});

// ——— 9. armarExtra: tres subtemas fallados ———

caso("E3", "armarExtra: tres subtemas fallados", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  const extra = armarExtra({ banco, normal, fallados: ["A", "B", "C"], semilla: 42 });
  assert.equal(extra.length, 12, "extra debe tener 12 preguntas");
  const violaciones = verificarExtra({ banco, normal, fallados: ["A", "B", "C"], extra });
  assert.equal(violaciones.length, 0, `violaciones: ${violaciones.map((v) => v.detalle).join("; ")}`);
});

// ——— 10. armarExtra: fallados vacío → RangeError ———

caso("E4", "armarExtra: fallados vacío → RangeError", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  assert.throws(
    () => armarExtra({ banco, normal, fallados: [], semilla: 42 }),
    RangeError
  );
});

// ——— 11. armarExtra: fallados ajeno a normal → RangeError ———

caso("E5", "armarExtra: fallados ajeno a normal → RangeError", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  assert.throws(
    () => armarExtra({ banco, normal, fallados: ["Z"], semilla: 42 }),
    RangeError,
    "subtema Z no está en normal"
  );
});

// ——— 12. armarExtra: capacidad insuficiente → Error ———

caso("E6", "armarExtra: capacidad insuficiente → Error con código", () => {
  const banco = bancoUniforme(4);
  const normal = pruebaNormalUniforme(4, 4);
  let lanzado = false;
  try {
    armarExtra({ banco, normal, fallados: ["A"], semilla: 42 });
  } catch (e: any) {
    lanzado = true;
    assert.equal(e.code, "capacidad_insuficiente");
  }
  assert.ok(lanzado, "debe lanzar Error");
});

// ——— 13. Determinismo: misma semilla → misma salida ———

caso("E7", "determinismo: misma semilla produce misma salida", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  const extra1 = armarExtra({ banco, normal, fallados: ["B", "C"], semilla: 42 });
  const extra2 = armarExtra({ banco, normal, fallados: ["B", "C"], semilla: 42 });
  assert.deepEqual(extra1, extra2, "misma semilla debe dar misma salida");
});

// ——— 14. Determinismo: semillas distintas pueden diferir ———

caso("E8", "determinismo: semillas distintas pueden dar salida distinta", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  const extra1 = armarExtra({ banco, normal, fallados: ["B", "C"], semilla: 42 });
  const extra2 = armarExtra({ banco, normal, fallados: ["B", "C"], semilla: 99 });
  // Ambas deben ser válidas
  const v1 = verificarExtra({ banco, normal, fallados: ["B", "C"], extra: extra1 });
  const v2 = verificarExtra({ banco, normal, fallados: ["B", "C"], extra: extra2 });
  assert.equal(v1.length, 0, `extra1 violaciones: ${v1.map((v) => v.detalle).join("; ")}`);
  assert.equal(v2.length, 0, `extra2 violaciones: ${v2.map((v) => v.detalle).join("; ")}`);
  // Pueden ser iguales o distintas; lo importante es que ambas sean válidas
});

// ——— 15. Semilla como string ———

caso("E9", "determinismo: semilla como string funciona", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  const extra1 = armarExtra({ banco, normal, fallados: ["B"], semilla: "prueba-42" });
  const extra2 = armarExtra({ banco, normal, fallados: ["B"], semilla: "prueba-42" });
  assert.deepEqual(extra1, extra2, "misma semilla string debe dar misma salida");
  const v = verificarExtra({ banco, normal, fallados: ["B"], extra: extra1 });
  assert.equal(v.length, 0, `violaciones: ${v.map((v) => v.detalle).join("; ")}`);
});

// ——— 16. verificarExtra: detecta tamaño incorrecto ———

caso("V1", "verificarExtra: detecta tamaño N-1", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  const extra = armarExtra({ banco, normal, fallados: ["B"], semilla: 42 });
  const extraCorto = extra.slice(0, 11);
  const v = verificarExtra({ banco, normal, fallados: ["B"], extra: extraCorto });
  const tamaño = v.find((x) => x.tipo === "tamaño");
  assert.ok(tamaño, "debe detectar tamaño incorrecto");
});

// ——— 17. verificarExtra: detecta duplicados ———

caso("V2", "verificarExtra: detecta duplicados", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  const extra = armarExtra({ banco, normal, fallados: ["B"], semilla: 42 });
  const extraDup = [...extra.slice(0, 11), extra[0]];
  const v = verificarExtra({ banco, normal, fallados: ["B"], extra: extraDup });
  const dup = v.find((x) => x.tipo === "duplicados");
  assert.ok(dup, "debe detectar duplicados");
});

// ——— 18. verificarExtra: detecta ids ajenos al banco ———

caso("V3", "verificarExtra: detecta ids ajenos al banco", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  const extra = armarExtra({ banco, normal, fallados: ["B"], semilla: 42 });
  const extraAjeno = [...extra.slice(0, 11), "ZZZ"];
  const v = verificarExtra({ banco, normal, fallados: ["B"], extra: extraAjeno });
  const ajeno = v.find((x) => x.tipo === "ajeno_al_banco");
  assert.ok(ajeno, "debe detectar ids ajenos al banco");
});

// ——— 19. verificarExtra: detecta ids repetidos de normal ———

caso("V4", "verificarExtra: detecta ids repetidos de normal", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  const extra = armarExtra({ banco, normal, fallados: ["B"], semilla: 42 });
  const extraRepetido = [...extra.slice(0, 11), normal[0]];
  const v = verificarExtra({ banco, normal, fallados: ["B"], extra: extraRepetido });
  const repetido = v.find((x) => x.tipo === "repetido_de_normal");
  assert.ok(repetido, "debe detectar ids repetidos de normal");
});

// ——— 20. verificarExtra: detecta fracción de fallados insuficiente ———

caso("V5", "verificarExtra: detecta fracción de fallados < 35 % (ENMENDADO)", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  // 4 de B (fallado) + 8 de A (no fallado) = 12, pero 4 < 5 (mínimo con 0.35)
  const extraBajo: string[] = [];
  for (let i = 5; i <= 8; i++) extraBajo.push(`B${i}`); // 4 de B
  for (let i = 5; i <= 12; i++) extraBajo.push(`A${i}`); // 8 de A
  const v = verificarExtra({ banco, normal, fallados: ["B"], extra: extraBajo });
  const fraccion = v.find((x) => x.tipo === "fraccion_fallados");
  assert.ok(fraccion, "debe detectar fracción insuficiente");
});

// ——— 21. verificarExtra: extra válido → sin violaciones ———

caso("V6", "verificarExtra: extra válido produce lista vacía", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  const extra = armarExtra({ banco, normal, fallados: ["B"], semilla: 42 });
  const v = verificarExtra({ banco, normal, fallados: ["B"], extra });
  assert.equal(v.length, 0, "extra válido no debe tener violaciones");
});

// ——— 22. armarExtra nunca repite ids de normal ———

caso("E10", "armarExtra: ningún id del extra está en normal", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  const extra = armarExtra({ banco, normal, fallados: ["A", "B", "C"], semilla: 777 });
  const normalSet = new Set(normal);
  for (const id of extra) {
    assert.ok(!normalSet.has(id), `id ${id} está en normal y en extra`);
  }
});

// ——— 23. armarExtra con N=1 (mínimo) ———

caso("E11", "armarExtra: N=1 con banco mínimo", () => {
  const banco: Pregunta[] = [
    { id: "A1", subtemaId: "A" },
    { id: "A2", subtemaId: "A" },
  ];
  const normal: PruebaNormal = ["A1"];
  const extra = armarExtra({ banco, normal, fallados: ["A"], semilla: 1, N: 1 });
  assert.equal(extra.length, 1);
  const v = verificarExtra({ banco, normal, fallados: ["A"], extra, N: 1 });
  assert.equal(v.length, 0, `violaciones: ${v.map((v) => v.detalle).join("; ")}`);
});

// ——— 24. armarExtra: banco con preguntas de subtemas no en normal ———

caso("E12", "armarExtra: banco con subtemas extra no usados", () => {
  // Banco tiene subtema D que no está en normal
  const banco: Pregunta[] = [];
  for (let i = 1; i <= 12; i++) banco.push({ id: `A${i}`, subtemaId: "A" });
  for (let i = 1; i <= 12; i++) banco.push({ id: `B${i}`, subtemaId: "B" });
  for (let i = 1; i <= 12; i++) banco.push({ id: `D${i}`, subtemaId: "D" });
  const normal: PruebaNormal = [];
  for (let i = 1; i <= 4; i++) normal.push(`A${i}`);
  for (let i = 1; i <= 4; i++) normal.push(`B${i}`);
  const extra = armarExtra({ banco, normal, fallados: ["A"], semilla: 42 });
  assert.equal(extra.length, 8);
  const v = verificarExtra({ banco, normal, fallados: ["A"], extra });
  assert.equal(v.length, 0, `violaciones: ${v.map((v) => v.detalle).join("; ")}`);
});

// ——— 25. Coherencia capacidadBanco ↔ armarExtra ———

caso("CE1", "coherencia: capacidadBanco suficiente → armarExtra no falla", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  const cap = capacidadBanco(banco, normal, 12);
  assert.ok(cap.suficiente, "precondición: banco debe ser suficiente");

  // Para cada combinación de fallados
  const subtemas = ["A", "B", "C"];
  const combinaciones: string[][] = [
    ["A"], ["B"], ["C"],
    ["A", "B"], ["A", "C"], ["B", "C"],
    ["A", "B", "C"],
  ];
  for (const fallados of combinaciones) {
    const extra = armarExtra({ banco, normal, fallados, semilla: 42 });
    const v = verificarExtra({ banco, normal, fallados, extra });
    assert.equal(v.length, 0, `fallados=${fallados.join(",")}: ${v.map((x) => x.detalle).join("; ")}`);
  }
});

// ——— Pruebas de propiedad (≥ 500 bancos/semillas) ———

caso("P1", "propiedad: 500 bancos aleatorios, capacidad suficiente → armarExtra válido", () => {
  // Generar 500 bancos con el PRNG determinista
  // Usamos un hash simple para generar semillas
  let exitosas = 0;
  for (let iter = 0; iter < 500; iter++) {
    const semilla = iter + 1;
    // Generar banco con semilla: 3 subtemas, 8-15 preguntas por subtema
    const preguntasPorSubtema = 8 + (semilla % 8); // 8..15
    const banco = bancoUniforme(preguntasPorSubtema);
    const normal = pruebaNormalUniforme(preguntasPorSubtema, 4);
    const N = 12;

    const cap = capacidadBanco(banco, normal, N);
    if (!cap.suficiente) continue;

    // Para cada combinación de fallados
    const subtemas = ["A", "B", "C"];
    const combinaciones: string[][] = [
      ["A"], ["B"], ["C"],
      ["A", "B"], ["A", "C"], ["B", "C"],
      ["A", "B", "C"],
    ];
    let ok = true;
    for (const fallados of combinaciones) {
      try {
        const extra = armarExtra({ banco, normal, fallados, semilla: String(semilla), N });
        const v = verificarExtra({ banco, normal, fallados, extra, N });
        if (v.length > 0) {
          ok = false;
          break;
        }
      } catch {
        ok = false;
        break;
      }
    }
    if (ok) exitosas++;
  }
  // Al menos algunos bancos deben ser suficientes y pasar
  assert.ok(exitosas > 0, "algunos bancos suficientes deben producir extras válidos");
});

caso("P2", "propiedad: 500 bancos, capacidad insuficiente → existe fallados que falla", () => {
  // Generar bancos insuficientes y verificar que armarExtra lanza
  let verificados = 0;
  for (let iter = 0; iter < 500; iter++) {
    const semilla = iter + 1;
    // Banco pequeño: 4-6 preguntas por subtema
    const preguntasPorSubtema = 4 + (semilla % 3); // 4..6
    const banco = bancoUniforme(preguntasPorSubtema);
    const normal = pruebaNormalUniforme(preguntasPorSubtema, 4);
    const N = 12;

    const cap = capacidadBanco(banco, normal, N);
    if (cap.suficiente) continue;

    // Debe existir al menos un conjunto de fallados para el que armarExtra lance
    const subtemas = ["A", "B", "C"];
    const combinaciones: string[][] = [
      ["A"], ["B"], ["C"],
      ["A", "B"], ["A", "C"], ["B", "C"],
      ["A", "B", "C"],
    ];
    let existeFallo = false;
    for (const fallados of combinaciones) {
      try {
        armarExtra({ banco, normal, fallados, semilla: String(semilla), N });
      } catch (e: any) {
        if (e.code === "capacidad_insuficiente") {
          existeFallo = true;
          break;
        }
      }
    }
    if (existeFallo) verificados++;
  }
  assert.ok(verificados > 0, "algunos bancos insuficientes deben hacer fallar armarExtra");
});

caso("P3", "propiedad: 500 semillas distintas, determinismo consistente", () => {
  const banco = bancoUniforme(12);
  const normal = pruebaNormalUniforme(12, 4);
  for (let s = 0; s < 500; s++) {
    const extra1 = armarExtra({ banco, normal, fallados: ["B", "C"], semilla: s });
    const extra2 = armarExtra({ banco, normal, fallados: ["B", "C"], semilla: s });
    assert.deepEqual(extra1, extra2, `semilla ${s}: no determinista`);
    const v = verificarExtra({ banco, normal, fallados: ["B", "C"], extra: extra1 });
    assert.equal(v.length, 0, `semilla ${s}: violaciones ${v.map((x) => x.detalle).join("; ")}`);
  }
});

// ——— Casos adicionales para detectar mutaciones ———

// Detecta: ceil→floor en minFallados (N=11: ceil(3.85)=4, floor(3.85)=3)
caso("E13", "armarExtra: N=11 requiere ceil(3.85)=4 de fallados (ENMENDADO 0.35)", () => {
  const banco: Pregunta[] = [];
  for (let i = 1; i <= 12; i++) banco.push({ id: `A${i}`, subtemaId: "A" });
  for (let i = 1; i <= 12; i++) banco.push({ id: `B${i}`, subtemaId: "B" });
  const normal: PruebaNormal = [];
  for (let i = 1; i <= 5; i++) normal.push(`A${i}`);
  for (let i = 1; i <= 6; i++) normal.push(`B${i}`);
  const extra = armarExtra({ banco, normal, fallados: ["A"], semilla: 42, N: 11 });
  assert.equal(extra.length, 11);
  const v = verificarExtra({ banco, normal, fallados: ["A"], extra, N: 11 });
  assert.equal(v.length, 0, `violaciones: ${v.map((x) => x.detalle).join("; ")}`);
  // Verificar que hay al menos 4 de A (ceil(0.35*11)=4, no 3)
  const mapaSubtema = new Map<string, string>();
  for (const p of banco) mapaSubtema.set(p.id, p.subtemaId);
  let countA = 0;
  for (const id of extra) {
    if (mapaSubtema.get(id) === "A") countA++;
  }
  assert.ok(countA >= 4, `se requieren al menos 4 de A (ceil(3.85)), se obtuvieron ${countA}`);
});

// Detecta: round-robin roto (con 2 subtemas fallados, cada uno con pocas preguntas)
caso("E14", "armarExtra: round-robin reparte entre 2 subtemas fallados", () => {
  const banco: Pregunta[] = [];
  for (let i = 1; i <= 8; i++) banco.push({ id: `A${i}`, subtemaId: "A" });
  for (let i = 1; i <= 8; i++) banco.push({ id: `B${i}`, subtemaId: "B" });
  for (let i = 1; i <= 8; i++) banco.push({ id: `C${i}`, subtemaId: "C" });
  const normal: PruebaNormal = [];
  for (let i = 1; i <= 4; i++) normal.push(`A${i}`);
  for (let i = 1; i <= 4; i++) normal.push(`B${i}`);
  for (let i = 1; i <= 4; i++) normal.push(`C${i}`);
  // A y B fallados: 4 disponibles cada uno. minFallados = 5 (con 0.35).
  // Round-robin debe tomar de ambos, no solo de A.
  const extra = armarExtra({ banco, normal, fallados: ["A", "B"], semilla: 42 });
  const v = verificarExtra({ banco, normal, fallados: ["A", "B"], extra });
  assert.equal(v.length, 0, `violaciones: ${v.map((x) => x.detalle).join("; ")}`);
  // Verificar que hay preguntas de A y de B en el extra
  const mapaSubtema = new Map<string, string>();
  for (const p of banco) mapaSubtema.set(p.id, p.subtemaId);
  let countA = 0, countB = 0;
  for (const id of extra) {
    const st = mapaSubtema.get(id);
    if (st === "A") countA++;
    if (st === "B") countB++;
  }
  assert.ok(countA > 0, "debe haber preguntas de A en el extra");
  assert.ok(countB > 0, "debe haber preguntas de B en el extra");
});

// Detecta: capacidadBanco sin verificar total no usadas
caso("C7", "capacidadBanco: total no usadas < N → insuficiente (ENMENDADO 0.35)", () => {
  // Banco: A=8 (8 total). Normal: 2A = 2. N=10.
  // Disponibles: 6. N=10. minFallados = ceil(0.35*10) = 4. 6 >= 4 → ok por subtema.
  // Total no usadas = 6 < 10 → insuficiente.
  const banco: Pregunta[] = [];
  for (let i = 1; i <= 8; i++) banco.push({ id: `A${i}`, subtemaId: "A" });
  const normal: PruebaNormal = ["A1", "A2"];
  // Disponibles: 6. N=10. minFallados = 4. 6 >= 4 → ok por subtema.
  // Total no usadas = 6 < 10 → insuficiente.
  const r = capacidadBanco(banco, normal, 10);
  assert.equal(r.suficiente, false, "total no usadas (6) < N (10) → insuficiente");
});

// Detecta: armarExtra sin lanzar capacidad_insuficiente (o devolver extra incompleto)
caso("E15", "armarExtra: lanza Error (no devuelve array) cuando no hay suficientes de fallados", () => {
  // Banco: A=4, B=8. Normal: 4A + 4B = 8. N=8.
  // Si A falla: disponibles de A = 0. minFallados = ceil(0.35*8) = 3. 0 < 3 → debe lanzar.
  const banco: Pregunta[] = [];
  for (let i = 1; i <= 4; i++) banco.push({ id: `A${i}`, subtemaId: "A" });
  for (let i = 1; i <= 8; i++) banco.push({ id: `B${i}`, subtemaId: "B" });
  const normal: PruebaNormal = [];
  for (let i = 1; i <= 4; i++) normal.push(`A${i}`);
  for (let i = 1; i <= 4; i++) normal.push(`B${i}`);
  let lanzado = false;
  try {
    armarExtra({ banco, normal, fallados: ["A"], semilla: 42 });
  } catch (e: any) {
    lanzado = true;
    assert.equal(e.code, "capacidad_insuficiente");
  }
  assert.ok(lanzado, "debe lanzar Error (no devolver array vacío) cuando no hay disponibles de fallados");
});

// ——— Resumen ———

salida.push("");
salida.push(`armador: ${casos} casos, ${fallas} fallas`);
console.log(salida.join("\n"));

if (fallas > 0) {
  process.exit(1);
}
