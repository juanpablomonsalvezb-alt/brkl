// Worker: ejecuta las pruebas de shared/banco.ts.
runTests().catch((e) => { console.error(e); process.exit(1); });

async function runTests() {
  // Las importaciones se hacen aquí para que el worker las ejecute en su contexto
  const assert = await import("node:assert/strict");
  const {
    fuenteCompleta,
    validacionesDe,
    preguntaPublicable,
    evaluacionPublicable,
    PREGUNTAS_E2,
    VALIDADORES_MINIMOS,
    PRIORIDAD_PILOTO,
    SUBTEMAS_PILOTO,
  } = await import("../shared/banco");
  const { armarExtra, verificarExtra } = await import("../shared/armador");

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

  // ——— Helpers ———

  const fuenteOk = () => ({
    tipo: "texto_escolar" as const,
    referencia: "Sumo Primero 5.º básico",
    edicion: "2026",
    ubicacion: "Cap. 6, p. 12",
  });

  const oaOficiales = new Set([7, 8, 10, 11, 13]);

  const preguntaOk = (id: string, subtemaId: string, oa: number) => ({
    id,
    subtemaId,
    oa,
    fuente: fuenteOk(),
    autorId: "autor1",
    validadoPor: ["val1", "val2"] as readonly string[],
  });

  function construirPilotoCompleto() {
    const banco = [];
    const normal = [];
    const subtemas = [...SUBTEMAS_PILOTO];
    for (const st of subtemas) {
      for (let n = 1; n <= 9; n++) {
        const id = `${st.id}-q${n}`;
        banco.push(preguntaOk(id, st.id, st.oa));
        if (n <= 3) normal.push(id);
      }
    }
    return { banco, normal, subtemas };
  }

  // ——— Constantes ———

  caso("C1", "PREGUNTAS_E2 = 15", () => { assert.default.equal(PREGUNTAS_E2, 15); });
  caso("C2", "VALIDADORES_MINIMOS = 2", () => { assert.default.equal(VALIDADORES_MINIMOS, 2); });
  caso("C3", "PRIORIDAD_PILOTO: OA 7,10,11,13 = temario_examen_libre", () => {
    assert.default.equal(PRIORIDAD_PILOTO[7], "temario_examen_libre");
    assert.default.equal(PRIORIDAD_PILOTO[10], "temario_examen_libre");
    assert.default.equal(PRIORIDAD_PILOTO[11], "temario_examen_libre");
    assert.default.equal(PRIORIDAD_PILOTO[13], "temario_examen_libre");
  });
  caso("C4", "PRIORIDAD_PILOTO: OA 8 = solo_nivel", () => {
    assert.default.equal(PRIORIDAD_PILOTO[8], "solo_nivel");
  });
  caso("C5", "SUBTEMAS_PILOTO: 5 subtemas, 3 preguntasEnNormal cada uno", () => {
    assert.default.equal(SUBTEMAS_PILOTO.length, 5);
    for (const st of SUBTEMAS_PILOTO) {
      assert.default.equal(st.preguntasEnNormal, 3, `subtema ${st.id}`);
    }
  });

  // ——— fuenteCompleta ———

  caso("F1", "fuenteCompleta: fuente completa → []", () => {
    assert.default.deepEqual(fuenteCompleta(fuenteOk()), []);
  });
  caso("F2", "fuenteCompleta: fuente ausente → ['fuente ausente']", () => {
    assert.default.deepEqual(fuenteCompleta(), ["fuente ausente"]);
  });
  caso("F3", "fuenteCompleta: referencia vacía", () => {
    const f = { ...fuenteOk(), referencia: "" };
    const r = fuenteCompleta(f);
    assert.default.ok(r.includes("referencia vacía"), `debe incluir 'referencia vacía': ${JSON.stringify(r)}`);
    assert.default.equal(r.length, 1);
  });
  caso("F4", "fuenteCompleta: referencia con espacios solos", () => {
    const f = { ...fuenteOk(), referencia: "   " };
    const r = fuenteCompleta(f);
    assert.default.ok(r.includes("referencia vacía"), `debe incluir 'referencia vacía': ${JSON.stringify(r)}`);
  });
  caso("F5", "fuenteCompleta: edición vacía", () => {
    const f = { ...fuenteOk(), edicion: "" };
    const r = fuenteCompleta(f);
    assert.default.ok(r.includes("edición vacía"));
    assert.default.equal(r.length, 1);
  });
  caso("F6", "fuenteCompleta: edición con espacios solos", () => {
    const f = { ...fuenteOk(), edicion: "  " };
    const r = fuenteCompleta(f);
    assert.default.ok(r.includes("edición vacía"));
  });
  caso("F7", "fuenteCompleta: ubicación vacía", () => {
    const f = { ...fuenteOk(), ubicacion: "" };
    const r = fuenteCompleta(f);
    assert.default.ok(r.includes("ubicación vacía"));
    assert.default.equal(r.length, 1);
  });
  caso("F8", "fuenteCompleta: ubicación con espacios solos", () => {
    const f = { ...fuenteOk(), ubicacion: "   " };
    const r = fuenteCompleta(f);
    assert.default.ok(r.includes("ubicación vacía"));
  });
  caso("F9", "fuenteCompleta: tipo inválido", () => {
    const f = { ...fuenteOk(), tipo: "otro" as any };
    const r = fuenteCompleta(f);
    assert.default.ok(r.includes("tipo inválido"));
    assert.default.equal(r.length, 1);
  });
  caso("F10", "fuenteCompleta: múltiples campos vacíos", () => {
    const f = { ...fuenteOk(), referencia: "", edicion: "", ubicacion: "" };
    const r = fuenteCompleta(f);
    assert.default.equal(r.length, 3);
  });

  // ——— validacionesDe ———

  caso("V1", "validacionesDe: 2 validadores distintos del autor → 2", () => {
    assert.default.equal(validacionesDe(preguntaOk("x", "s", 7)), 2);
  });
  caso("V2", "validacionesDe: duplicados entre validadores → cuenta 1", () => {
    assert.default.equal(validacionesDe({ ...preguntaOk("x", "s", 7), validadoPor: ["val1", "val1"] }), 1);
  });
  caso("V3", "validacionesDe: autor entre los validadores → ignorado", () => {
    assert.default.equal(validacionesDe({ ...preguntaOk("x", "s", 7), validadoPor: ["autor1", "val1"] }), 1);
  });
  caso("V4", "validacionesDe: autor + duplicados → 0", () => {
    assert.default.equal(validacionesDe({ ...preguntaOk("x", "s", 7), validadoPor: ["autor1", "autor1", "val1", "val1"] }), 1);
  });
  caso("V5", "validacionesDe: solo 1 validador distinto", () => {
    assert.default.equal(validacionesDe({ ...preguntaOk("x", "s", 7), validadoPor: ["val1"] }), 1);
  });
  caso("V6", "validacionesDe: sin validadores → 0", () => {
    assert.default.equal(validacionesDe({ ...preguntaOk("x", "s", 7), validadoPor: [] }), 0);
  });
  caso("V7", "validacionesDe: solo el autor → 0", () => {
    assert.default.equal(validacionesDe({ ...preguntaOk("x", "s", 7), validadoPor: ["autor1"] }), 0);
  });
  caso("V8", "validacionesDe: 3 validadores distintos → 3", () => {
    assert.default.equal(validacionesDe({ ...preguntaOk("x", "s", 7), validadoPor: ["val1", "val2", "val3"] }), 3);
  });

  // ——— preguntaPublicable ———

  caso("P1", "preguntaPublicable: pregunta válida → ok", () => {
    const r = preguntaPublicable(preguntaOk("x", "s", 7), oaOficiales);
    assert.default.equal(r.ok, true);
    assert.default.equal(r.motivos.length, 0);
  });
  caso("P2", "preguntaPublicable: OA fuera de oaOficiales", () => {
    const r = preguntaPublicable({ ...preguntaOk("x", "s", 99) }, oaOficiales);
    assert.default.equal(r.ok, false);
    assert.default.equal(r.motivos.length, 1);
    assert.default.ok(r.motivos[0].includes("OA 99"));
  });
  caso("P3", "preguntaPublicable: sin fuente", () => {
    const r = preguntaPublicable({ ...preguntaOk("x", "s", 7), fuente: undefined }, oaOficiales);
    assert.default.equal(r.ok, false);
    assert.default.ok(r.motivos.some((m) => m.includes("Fuente incompleta")));
  });
  caso("P4", "preguntaPublicable: fuente incompleta (referencia vacía)", () => {
    const r = preguntaPublicable({ ...preguntaOk("x", "s", 7), fuente: { ...fuenteOk(), referencia: "" } }, oaOficiales);
    assert.default.equal(r.ok, false);
    assert.default.ok(r.motivos.some((m) => m.includes("referencia vacía")));
  });
  caso("P5", "preguntaPublicable: solo 1 validador", () => {
    const r = preguntaPublicable({ ...preguntaOk("x", "s", 7), validadoPor: ["val1"] }, oaOficiales);
    assert.default.equal(r.ok, false);
    assert.default.ok(r.motivos.some((m) => m.includes("1 validador")));
  });
  caso("P6", "preguntaPublicable: sin validadores", () => {
    const r = preguntaPublicable({ ...preguntaOk("x", "s", 7), validadoPor: [] }, oaOficiales);
    assert.default.equal(r.ok, false);
    assert.default.ok(r.motivos.some((m) => m.includes("0 validador")));
  });
  caso("P7", "preguntaPublicable: múltiples motivos", () => {
    const r = preguntaPublicable({ id: "x", subtemaId: "s", oa: 99, fuente: undefined, autorId: "a", validadoPor: [] }, oaOficiales);
    assert.default.equal(r.ok, false);
    assert.default.equal(r.motivos.length, 3);
  });

  // ——— evaluacionPublicable ———

  caso("E1", "evaluacionPublicable: piloto completo (45 preguntas, 9/subtema) → ok", () => {
    const { banco, normal, subtemas } = construirPilotoCompleto();
    const r = evaluacionPublicable({ banco, normal, oaOficiales, subtemas });
    assert.default.equal(r.ok, true, `motivos: ${r.motivos.join("; ")}`);
    assert.default.equal(r.capacidad?.suficiente, true);
  });

  caso("E2", "evaluacionPublicable: 44 preguntas (8 por subtema) → capacidad insuficiente", () => {
    const banco = [];
    const normal = [];
    const subtemas = [...SUBTEMAS_PILOTO];
    for (const st of subtemas) {
      for (let n = 1; n <= 8; n++) {
        const id = `${st.id}-q${n}`;
        banco.push(preguntaOk(id, st.id, st.oa));
        if (n <= 3) normal.push(id);
      }
    }
    const r = evaluacionPublicable({ banco, normal, oaOficiales, subtemas });
    assert.default.equal(r.ok, false, "debe fallar con 8 preguntas por subtema");
    assert.default.ok(r.motivos.some((m) => m.includes("Capacidad insuficiente")));
  });

  caso("E3", "evaluacionPublicable: una pregunta de normal sin fuente → no ok", () => {
    const { banco, normal, subtemas } = construirPilotoCompleto();
    banco[0] = { ...banco[0], fuente: undefined };
    const r = evaluacionPublicable({ banco, normal, oaOficiales, subtemas });
    assert.default.equal(r.ok, false, "debe fallar si una pregunta de normal no es publicable");
    assert.default.ok(r.motivos.some((m) => m.includes("no es publicable")));
  });

  caso("E4", "evaluacionPublicable: una pregunta de normal con 1 validador → no ok", () => {
    const { banco, normal, subtemas } = construirPilotoCompleto();
    banco[0] = { ...banco[0], validadoPor: ["val1"] };
    const r = evaluacionPublicable({ banco, normal, oaOficiales, subtemas });
    assert.default.equal(r.ok, false, "debe fallar si una pregunta de normal tiene 1 validador");
    assert.default.ok(r.motivos.some((m) => m.includes("no es publicable")));
  });

  caso("E5", "evaluacionPublicable: OA de subtema fuera de oaOficiales → no ok", () => {
    const { banco, normal } = construirPilotoCompleto();
    const subtemas = SUBTEMAS_PILOTO.map((st) => ({ ...st }));
    subtemas[0] = { ...subtemas[0], oa: 99 };
    const r = evaluacionPublicable({ banco, normal, oaOficiales, subtemas });
    assert.default.equal(r.ok, false, "debe fallar si un OA no está en oaOficiales");
    assert.default.ok(r.motivos.some((m) => m.includes("OA 99")));
  });

  caso("E6", "evaluacionPublicable: 14 en normal → no ok", () => {
    const { banco, subtemas } = construirPilotoCompleto();
    const normal = [];
    for (const st of subtemas) {
      const ids = banco.filter((p) => p.subtemaId === st.id).map((p) => p.id);
      for (let i = 0; i < 3 && i < ids.length; i++) normal.push(ids[i]);
    }
    const normal14 = normal.slice(0, 14);
    const r = evaluacionPublicable({ banco, normal: normal14, oaOficiales, subtemas });
    assert.default.equal(r.ok, false, "debe fallar con 14 preguntas en normal");
    assert.default.ok(r.motivos.some((m) => m.includes("14")));
  });

  caso("E7", "evaluacionPublicable: 16 en normal → no ok", () => {
    const { banco, subtemas } = construirPilotoCompleto();
    const normal = [];
    for (const st of subtemas) {
      const ids = banco.filter((p) => p.subtemaId === st.id).map((p) => p.id);
      for (let i = 0; i < 4 && i < ids.length; i++) normal.push(ids[i]);
    }
    const normal16 = normal.slice(0, 16);
    const r = evaluacionPublicable({ banco, normal: normal16, oaOficiales, subtemas });
    assert.default.equal(r.ok, false, "debe fallar con 16 preguntas en normal");
    assert.default.ok(r.motivos.some((m) => m.includes("16")));
  });

  caso("E8", "evaluacionPublicable: ids de normal ajenos al banco → no ok", () => {
    const { banco, subtemas } = construirPilotoCompleto();
    const normal = [...banco.slice(0, 14).map((p) => p.id), "AJENO"];
    const r = evaluacionPublicable({ banco, normal, oaOficiales, subtemas });
    assert.default.equal(r.ok, false, "debe fallar con ids ajenos al banco");
    assert.default.ok(r.motivos.some((m) => m.includes("AJENO")));
  });

  caso("E9", "evaluacionPublicable: subtema desbalanceado → no ok", () => {
    const { banco, subtemas } = construirPilotoCompleto();
    const normal = [];
    const st0Ids = banco.filter((p) => p.subtemaId === subtemas[0].id).map((p) => p.id);
    const st1Ids = banco.filter((p) => p.subtemaId === subtemas[1].id).map((p) => p.id);
    for (let i = 0; i < 4; i++) normal.push(st0Ids[i]);
    for (let i = 0; i < 2; i++) normal.push(st1Ids[i]);
    for (let s = 2; s < subtemas.length; s++) {
      const ids = banco.filter((p) => p.subtemaId === subtemas[s].id).map((p) => p.id);
      for (let i = 0; i < 3; i++) normal.push(ids[i]);
    }
    const r = evaluacionPublicable({ banco, normal, oaOficiales, subtemas });
    assert.default.equal(r.ok, false, "debe fallar con subtema desbalanceado");
    assert.default.ok(r.motivos.some((m) => m.includes("en normal, se esperan")));
  });

  caso("E10", "evaluacionPublicable: suma preguntasEnNormal = 14 → no ok", () => {
    const { banco, normal } = construirPilotoCompleto();
    const subtemas = SUBTEMAS_PILOTO.map((st) => ({ ...st }));
    subtemas[0] = { ...subtemas[0], preguntasEnNormal: 2 };
    const r = evaluacionPublicable({ banco, normal, oaOficiales, subtemas });
    assert.default.equal(r.ok, false, "debe fallar con suma = 14");
    assert.default.ok(r.motivos.some((m) => m.includes("14")));
  });

  // ——— Prueba de propiedad (≥ 300 casos) ———

  function mulberry32(semilla: number): () => number {
    let s = semilla | 0;
    return () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  caso("PROP", "propiedad: ≥300 subconjuntos verificados, evaluacionPublicable.ok ⇒ armarExtra válido", () => {
    const rng = mulberry32(12345);
    const iteraciones = 10;
    let okCount = 0;
    let totalSubsets = 0;

    for (let iter = 0; iter < iteraciones; iter++) {
      const preguntasPorSubtema: number[] = [];
      for (let s = 0; s < SUBTEMAS_PILOTO.length; s++) {
        preguntasPorSubtema.push(9 + Math.floor(rng() * 7));
      }
      const banco = [];
      const normal = [];
      for (let s = 0; s < SUBTEMAS_PILOTO.length; s++) {
        const st = SUBTEMAS_PILOTO[s];
        const count = preguntasPorSubtema[s];
        for (let n = 1; n <= count; n++) {
          const id = `${st.id}-q${n}`;
          banco.push(preguntaOk(id, st.id, st.oa));
          if (n <= 3) normal.push(id);
        }
      }
      const r = evaluacionPublicable({ banco, normal, oaOficiales, subtemas: SUBTEMAS_PILOTO });
      if (!r.ok) continue;
      okCount++;
      const subtemaIds = SUBTEMAS_PILOTO.map((st) => st.id);
      const bancoSimple = banco.map((p) => ({ id: p.id, subtemaId: p.subtemaId }));
      for (let mask = 1; mask < (1 << subtemaIds.length); mask++) {
        const fallados: string[] = [];
        for (let b = 0; b < subtemaIds.length; b++) {
          if (mask & (1 << b)) fallados.push(subtemaIds[b]);
        }
        totalSubsets++;
        try {
          const extra = armarExtra({ banco: bancoSimple, normal, fallados, semilla: `${iter}-${mask}` });
          const violaciones = verificarExtra({ banco: bancoSimple, normal, fallados, extra });
          assert.default.equal(violaciones.length, 0,
            `iter=${iter}, mask=${mask}, fallados=${fallados.join(",")}: ${violaciones.map((v) => v.detalle).join("; ")}`);
        } catch (e: any) {
          assert.default.fail(`iter=${iter}, mask=${mask}, fallados=${fallados.join(",")}: ${e.message}`);
        }
      }
    }
    assert.default.ok(okCount > 0, "algunos casos deben tener evaluacionPublicable.ok");
    assert.default.ok(totalSubsets >= 300, `se requieren ≥300 subconjuntos verificados, solo ${totalSubsets}`);
    salida.push(`    (de ${iteraciones} casos, ${okCount} con ok=true, ${totalSubsets} subconjuntos verificados)`);
  });

  // ——— Resumen ———
  salida.push("");
  salida.push(`Resultados: ${casos} casos, ${fallas} fallas`);
  console.log(salida.join("\n"));
  if (fallas > 0) process.exit(1);
}
