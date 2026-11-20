// IMP-015 (H1b-1): máquina de estados pura de una instancia ordinaria. Invariantes 1–5 en memoria, escenarios
// de la maestra §2–§3 y P15, comprobación exhaustiva de todas las secuencias de eventos hasta una profundidad, y
// que ningún estado ni comportamiento pendiente se haya implementado. Ejecutar: npm run check:vortice
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  consumidos, enviarIntento, esFinal, INTENTOS_ORDINARIOS, iniciarIntento, nuevaInstancia, vencer, violaciones,
  type InstanciaP0E, type Resultado,
} from "../shared/p0e";
import { ESTADOS_CERRADOS } from "../shared/p0e-estados";

let casos = 0; const salida: string[] = [];
const caso = (id: string, nombre: string, f: () => void) => { f(); casos++; salida.push(`  ✓ ${id.padEnd(4)} ${nombre}`); };
const FIN = 1000;
const nueva = (max = 2) => nuevaInstancia({ maxIntentos: max, finExtension: FIN });
const ok = (r: Resultado) => { assert.ok(r.ok, JSON.stringify(r)); return r; };
const iniciar = (i: InstanciaP0E, id: string, t = 0) => ok(iniciarIntento(i, id, t)).instancia;
const enviar = (i: InstanciaP0E, id: string, envio: string, aprobado: boolean, t = 0) => ok(enviarIntento(i, { intentoId: id, envioId: envio, aprobado }, t)).instancia;
const sano = (i: InstanciaP0E) => assert.deepEqual(violaciones(i), [], JSON.stringify(i));

caso("M1", "intentos ordinarios de la maestra §3 (P21 v2): E1, E3 y E4 = 2; E2 = 1 (normal) + 1 extra", () => {
  assert.deepEqual({ ...INTENTOS_ORDINARIOS }, { E1: 2, E2: 1, E3: 2, E4: 2 });
});
caso("M2", "aprobar cierra la instancia de inmediato y el proceso queda aprobado", () => {
  let i = iniciar(nueva(), "a1");
  assert.equal(i.estado, "en_curso");
  const r = ok(enviarIntento(i, { intentoId: "a1", envioId: "e1", aprobado: true }, 10));
  assert.deepEqual([r.instancia.estado, r.instancia.causaCierre, r.efectoProceso, consumidos(r.instancia)], ["cerrada_aprobada", "aprobacion", "aprobado", 1]); sano(r.instancia);
  assert.deepEqual(iniciarIntento(r.instancia, "a2", 11), { ok: false, motivo: "instancia_cerrada" }, "no se abre otro intento tras aprobar");
});
caso("M3", "el intento se consume al ENVIAR, no al abrir; recargar retoma el mismo intento; abandonar no consume", () => {
  let i = iniciar(nueva(), "a1");
  assert.equal(consumidos(i), 0);
  const r = ok(iniciarIntento(i, "otro-id", 5));
  assert.deepEqual([r.repetido, r.intento.id, r.instancia.intentos.length], [true, "a1", 1], "retoma el activo; no crea uno nuevo");
  i = vencer(i, FIN).instancia; assert.equal(consumidos(i), 0, "abandonado y vencido: ningún intento consumido");
});
caso("M4", "no aprobar con intentos restantes deja la instancia disponible; agotarlos la cierra", () => {
  let i = enviar(iniciar(nueva(2), "a1"), "a1", "e1", false);
  assert.deepEqual([i.estado, consumidos(i), i.causaCierre], ["disponible", 1, null]); sano(i);
  const r = ok(enviarIntento(iniciar(i, "a2"), { intentoId: "a2", envioId: "e2", aprobado: false }, 20));
  assert.deepEqual([r.instancia.estado, r.instancia.causaCierre, r.efectoProceso], ["cerrada_agotada", "agotamiento", "sin_definir"]); sano(r.instancia);
  // P21 v2: E2 tiene 1 intento normal (maxIntentos=1, esE2=true). Al fallar → extra_disponible.
  const e2Normal = enviar(iniciar(nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true }), "a1"), "a1", "e1", false);
  assert.deepEqual([e2Normal.estado, consumidos(e2Normal), e2Normal.extraDisponible], ["disponible", 1, true], "E2: 1 normal fallido → extra_disponible");
  // El extra fallido → reprobada_continua.
  const e2ExtraStarted = ok(iniciarIntento(e2Normal, "a2", 20, "extra"));
  const e2Extra = enviar(e2ExtraStarted.instancia, "a2", "e2", false);
  assert.deepEqual([e2Extra.estado, consumidos(e2Extra), e2Extra.extraAgotado], ["cerrada_agotada", 2, true], "E2: extra fallido → reprobada_continua");
});
caso("M5", "P15: al alcanzar T+48 h la instancia vence aunque queden intentos; el activo expira sin consumir", () => {
  const i = iniciar(enviar(iniciar(nueva(3), "a1"), "a1", "e1", false), "a2");
  assert.equal(vencer(i, FIN - 0.001).cambio, false, "antes de T+48 h no vence");
  const v = vencer(i, FIN);
  assert.deepEqual([v.cambio, v.instancia.estado, v.instancia.causaCierre, v.efectoProceso, consumidos(v.instancia)], [true, "vencida", "vencimiento", "sin_definir", 1]);
  assert.deepEqual(v.instancia.intentos.map((x) => x.estado), ["enviado", "expirado"]); sano(v.instancia);
  assert.deepEqual(vencer(v.instancia, FIN + 5), { instancia: v.instancia, cambio: false, efectoProceso: null }, "idempotente");
  const sinActivo = vencer(nueva(), FIN + 1); assert.equal(sinActivo.instancia.estado, "vencida"); assert.equal(sinActivo.instancia.intentos.length, 0);
});
caso("M6", "fuera de la extensión no se aceptan envíos ni inicios (409): el intento activo sigue activo hasta vencer", () => {
  const i = iniciar(nueva(), "a1");
  assert.deepEqual(enviarIntento(i, { intentoId: "a1", envioId: "e1", aprobado: true }, FIN), { ok: false, motivo: "ventana_cerrada" });
  assert.deepEqual(enviarIntento(i, { intentoId: "a1", envioId: "e1", aprobado: true }, FIN + 100), { ok: false, motivo: "ventana_cerrada" });
  assert.deepEqual(iniciarIntento(nueva(), "z", FIN), { ok: false, motivo: "ventana_cerrada" });
  assert.deepEqual(iniciarIntento(i, "a1", FIN), { ok: false, motivo: "ventana_cerrada" }, "tampoco se retoma");
  ok(enviarIntento(i, { intentoId: "a1", envioId: "e1", aprobado: true }, FIN - 0.001)); // un instante antes sí
  const v = vencer(i, FIN).instancia;
  assert.deepEqual(enviarIntento(v, { intentoId: "a1", envioId: "e1", aprobado: true }, FIN), { ok: false, motivo: "intento_expirado" });
});
caso("M7", "envío repetido: mismo resultado, un solo consumo; otro envío sobre el mismo intento es conflicto", () => {
  // 1. Reenvío inmediato de un intento fallido.
  const a = ok(enviarIntento(iniciar(nueva(), "a1"), { intentoId: "a1", envioId: "e1", aprobado: false }, 3));
  assert.equal(a.efectoProceso, null);
  const b = ok(enviarIntento(a.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 4));
  assert.deepEqual([b.repetido, b.efectoProceso, b.instancia, consumidos(b.instancia)], [true, null, a.instancia, 1]);

  // 2. Conflicto cuando se reutiliza el mismo intento con otro envioId; intento inexistente.
  assert.deepEqual(enviarIntento(a.instancia, { intentoId: "a1", envioId: "e2", aprobado: true }, 4), { ok: false, motivo: "conflicto_idempotencia" });
  assert.deepEqual(enviarIntento(a.instancia, { intentoId: "no", envioId: "e1", aprobado: true }, 4), { ok: false, motivo: "intento_inexistente" });

  // 3. Reenvío de un intento fallido después de la aprobación de otro (FABLE-009 escenario 1: A1 falla → A2 aprueba).
  const trasA2Aprueba = ok(enviarIntento(iniciar(a.instancia, "a2", 5), { intentoId: "a2", envioId: "e2", aprobado: true }, 6));
  assert.deepEqual([trasA2Aprueba.instancia.estado, trasA2Aprueba.efectoProceso], ["cerrada_aprobada", "aprobado"]);
  const reenvioA1TrasAprobar = ok(enviarIntento(trasA2Aprueba.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 7));
  assert.deepEqual([reenvioA1TrasAprobar.repetido, reenvioA1TrasAprobar.efectoProceso, reenvioA1TrasAprobar.intento.aprobado], [true, null, false]);
  // El reenvío conserva su efecto original independientemente del flag `aprobado` del payload repetido.
  const reenvioA1PayloadDistinto = ok(enviarIntento(trasA2Aprueba.instancia, { intentoId: "a1", envioId: "e1", aprobado: true }, 8));
  assert.deepEqual([reenvioA1PayloadDistinto.repetido, reenvioA1PayloadDistinto.efectoProceso, reenvioA1PayloadDistinto.intento.aprobado], [true, null, false]);

  // 4. Reenvío de un intento fallido anterior después del agotamiento y reenvío del intento que produjo el agotamiento (FABLE-009 escenario 2).
  const trasA2Agota = ok(enviarIntento(iniciar(a.instancia, "a2", 5), { intentoId: "a2", envioId: "e2", aprobado: false }, 6));
  assert.deepEqual([trasA2Agota.instancia.estado, trasA2Agota.efectoProceso], ["cerrada_agotada", "sin_definir"]);
  const reenvioA1TrasAgotar = ok(enviarIntento(trasA2Agota.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 7));
  assert.deepEqual([reenvioA1TrasAgotar.repetido, reenvioA1TrasAgotar.efectoProceso, reenvioA1TrasAgotar.intento.id], [true, null, "a1"]);
  const reenvioA2QueAgoto = ok(enviarIntento(trasA2Agota.instancia, { intentoId: "a2", envioId: "e2", aprobado: false }, 8));
  assert.deepEqual([reenvioA2QueAgoto.repetido, reenvioA2QueAgoto.efectoProceso, reenvioA2QueAgoto.intento.id], [true, "sin_definir", "a2"]);

  // 5. Reenvío de un intento aprobado (incluso fuera de ventana).
  const cierre = ok(enviarIntento(iniciar(nueva(), "a1"), { intentoId: "a1", envioId: "e1", aprobado: true }, 3));
  const rep = ok(enviarIntento(cierre.instancia, { intentoId: "a1", envioId: "e1", aprobado: true }, 99));
  assert.deepEqual([rep.repetido, rep.efectoProceso, rep.instancia.estado], [true, "aprobado", "cerrada_aprobada"], "el reenvío del envío que cerró sigue idempotente aun fuera de ventana");
});
caso("M8", "sin resurrección: ningún estado final vuelve a disponible o en_curso", () => {
  for (const f of [(): InstanciaP0E => enviar(iniciar(nueva(), "a1"), "a1", "e1", true), (): InstanciaP0E => vencer(nueva(), FIN).instancia,
    (): InstanciaP0E => { let x = nueva(1); x = enviar(iniciar(x, "a1"), "a1", "e1", false); return x; }]) {
    const i = f(); assert.ok(esFinal(i.estado), i.estado);
    assert.deepEqual(iniciarIntento(i, "nuevo", 0), { ok: false, motivo: "instancia_cerrada" });
    assert.equal(vencer(i, FIN * 2).cambio, false);
    assert.equal(esFinal(vencer(i, FIN * 2).instancia.estado), true);
  }
});
caso("M9", "un solo intento activo; no se excede el máximo", () => {
  let i = iniciar(nueva(2), "a1");
  assert.equal(ok(iniciarIntento(i, "a2", 1)).instancia.intentos.length, 1);
  i = enviar(i, "a1", "e1", false); i = enviar(iniciar(i, "a2"), "a2", "e2", false);
  assert.equal(i.estado, "cerrada_agotada"); assert.deepEqual(iniciarIntento(i, "a3", 1), { ok: false, motivo: "instancia_cerrada" });
  assert.throws(() => nuevaInstancia({ maxIntentos: 0, finExtension: 1 }), RangeError); assert.throws(() => nuevaInstancia({ maxIntentos: 1.5, finExtension: 1 }), RangeError);
});

// Comprobación exhaustiva: todas las secuencias de eventos (iniciar, enviar ±, repetir, conflicto, vencer) con
// tiempos antes, en y después de T+48 h, hasta profundidad 7, para 1, 2 y 3 intentos.
caso("X1", "exhaustivo: todas las secuencias respetan los invariantes y los estados finales son absorbentes", () => {
  let estados = 0, transiciones = 0;
  const efectosRepetidos = new Set<string | null>();
  for (const max of [1, 2, 3]) {
    const vistos = new Set<string>(); let frontera: InstanciaP0E[] = [nuevaInstancia({ maxIntentos: max, finExtension: FIN })];
    for (let prof = 0; prof < 7; prof++) {
      const sig: InstanciaP0E[] = [];
      for (const i of frontera) {
        const k = JSON.stringify(i); if (vistos.has(k)) continue; vistos.add(k); estados++;
        assert.deepEqual(violaciones(i), [], k);
        const ids = ["a1", "a2", "a3", "a4"], envios = ["e1", "e2", "e3"];
        for (const t of [0, FIN - 1, FIN, FIN + 1]) {
          const eventos: (() => Resultado | { instancia: InstanciaP0E; cambio: boolean })[] = [
            ...ids.map((id) => () => iniciarIntento(i, id, t)),
            ...ids.flatMap((id) => envios.flatMap((e) => [true, false].map((ap) => () => enviarIntento(i, { intentoId: id, envioId: e, aprobado: ap }, t)))),
            () => vencer(i, t),
          ];
          for (const ev of eventos) {
            transiciones++;
            const r = ev() as Resultado & { cambio?: boolean };
            const nuevaI = "instancia" in r ? r.instancia : i;
            assert.deepEqual(violaciones(nuevaI), [], `tras evento desde ${k}`);
            // sin resurrección y consumo monótono
            if (esFinal(i.estado)) assert.ok(esFinal(nuevaI.estado), "un final no deja de serlo");
            assert.ok(consumidos(nuevaI) >= consumidos(i) && consumidos(nuevaI) <= consumidos(i) + 1, "el consumo crece como mucho en 1");
            assert.ok(nuevaI.intentos.length >= i.intentos.length && nuevaI.intentos.length <= i.intentos.length + 1);
            // consumir solo al enviar con éxito; nunca fuera de ventana
            if (consumidos(nuevaI) > consumidos(i)) assert.ok(t < FIN, "no se consume fuera de la extensión");
            if (esFinal(i.estado) && "instancia" in r && !(r as { repetido?: boolean }).repetido && "ok" in r) assert.equal(consumidos(nuevaI), consumidos(i));
            // Consistencia histórica de efectoProceso en cada intento enviado (idempotencia por intento).
            const enviados = nuevaI.intentos.filter((x) => x.estado === "enviado");
            for (let idx = 0; idx < enviados.length; idx++) {
              const int = enviados[idx];
              const esperado = int.aprobado
                ? "aprobado"
                : nuevaI.causaCierre === "agotamiento" && idx === enviados.length - 1
                  ? "sin_definir"
                  : null;
              const rep = enviarIntento(nuevaI, { intentoId: int.id, envioId: int.envioId!, aprobado: false }, t);
              assert.ok(rep.ok && rep.repetido, `reenvío idempotente debe ser ok/repetido en ${k}`);
              assert.equal(rep.efectoProceso, esperado, `efectoProceso histórico inconsistente para ${int.id} en ${k}`);
              assert.equal(rep.instancia, nuevaI, "el reenvío no muta la instancia");
              efectosRepetidos.add(rep.efectoProceso);
            }
            sig.push(nuevaI);
          }
        }
      }
      frontera = sig;
    }
  }
  assert.deepEqual(efectosRepetidos, new Set(["aprobado", "sin_definir", null]), "X1 debe cubrir los tres resultados posibles de efectoProceso");
  assert.ok(estados > 100 && transiciones > 50_000, `cobertura: ${estados} estados, ${transiciones} transiciones`);
  salida.push(`        (${estados} estados distintos, ${transiciones} transiciones comprobadas)`);
});

// ——— Casos mínimos P21 v2: E2 con intento extra ———

caso("E2-1", "E2 normal reprobado → extra_disponible", () => {
  const i = nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true });
  const r1 = ok(iniciarIntento(i, "a1", 0));
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  assert.equal(r2.efectoProceso, "extra_disponible");
  assert.equal(r2.instancia.estado, "disponible");
  assert.equal(r2.instancia.extraDisponible, true);
  sano(r2.instancia);
});

caso("E2-2", "E2 extra reprobado → reprobada_continua", () => {
  let i = nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true });
  const r1 = ok(iniciarIntento(i, "a1", 0));
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  i = r2.instancia;
  const r3 = ok(iniciarIntento(i, "a2", 20, "extra"));
  const r4 = ok(enviarIntento(r3.instancia, { intentoId: "a2", envioId: "e2", aprobado: false }, 30));
  assert.equal(r4.efectoProceso, "reprobada_continua");
  assert.equal(r4.instancia.estado, "cerrada_agotada");
  assert.equal(r4.instancia.extraAgotado, true);
  sano(r4.instancia);
});

caso("E2-3", "E2 extra aprobado → aprobado", () => {
  let i = nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true });
  const r1 = ok(iniciarIntento(i, "a1", 0));
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  i = r2.instancia;
  const r3 = ok(iniciarIntento(i, "a2", 20, "extra"));
  const r4 = ok(enviarIntento(r3.instancia, { intentoId: "a2", envioId: "e2", aprobado: true }, 30));
  assert.equal(r4.efectoProceso, "aprobado");
  assert.equal(r4.instancia.estado, "cerrada_aprobada");
  sano(r4.instancia);
});

caso("E2-4", "E2 tercer intento rechazado tras agotar normal y extra", () => {
  let i = nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true });
  const r1 = ok(iniciarIntento(i, "a1", 0));
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  i = r2.instancia;
  const r3 = ok(iniciarIntento(i, "a2", 20, "extra"));
  const r4 = ok(enviarIntento(r3.instancia, { intentoId: "a2", envioId: "e2", aprobado: false }, 30));
  i = r4.instancia;
  const r5 = iniciarIntento(i, "a3", 40);
  assert.equal(r5.ok, false);
  assert.equal((r5 as { motivo: string }).motivo, "instancia_cerrada");
  const r6 = iniciarIntento(i, "a3", 40, "extra");
  assert.equal(r6.ok, false);
  assert.equal((r6 as { motivo: string }).motivo, "instancia_cerrada");
});

caso("E2-5", "E1/E3/E4 sin efecto extra (maxIntentos=2, esE2=false)", () => {
  const i = nuevaInstancia({ maxIntentos: 2, finExtension: FIN });
  const r1 = ok(iniciarIntento(i, "a1", 0));
  const r2 = ok(enviarIntento(r1.instancia, { intentoId: "a1", envioId: "e1", aprobado: false }, 10));
  assert.equal(r2.efectoProceso, null, "primer fallo E1/E3/E4 → null (no extra_disponible)");
  assert.equal(r2.instancia.extraDisponible, false);
  sano(r2.instancia);
});

caso("E2-6", "E2 extra rechazado si extraDisponible = false", () => {
  const i = nuevaInstancia({ maxIntentos: 1, finExtension: FIN, esE2: true });
  // Sin fallar el normal, extraDisponible es false → extra rechazado.
  const r = iniciarIntento(i, "a1", 0, "extra");
  assert.equal(r.ok, false);
  assert.equal((r as { motivo: string }).motivo, "extra_no_disponible");
});

caso("E2-7", "extra rechazado si esE2 = false", () => {
  const i = nuevaInstancia({ maxIntentos: 2, finExtension: FIN, esE2: false });
  const r = iniciarIntento(i, "a1", 0, "extra");
  assert.equal(r.ok, false);
  assert.equal((r as { motivo: string }).motivo, "extra_no_disponible");
});

caso("B1", "lo pendiente NO está implementado: sin estados ni transiciones inventados", () => {
  const codigo = fs.readFileSync("shared/p0e.ts", "utf8").split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("\n");
  for (const prohibido of ["cerrada_por_excepcion", "cerrado_sin_resolucion", "en_espera_excepcion", "cancelado_por_cierre", "recuperacion_pendiente", "recuperacion_abierta", "reprobado", "revision_disponible", "en_revision"]) {
    assert.ok(!codigo.includes(prohibido), `${prohibido} sigue pendiente y no debe aparecer en el código`);
  }
  assert.deepEqual([...ESTADOS_CERRADOS], ["cerrada_aprobada", "cerrada_agotada", "vencida"], "el conjunto de H0 no cambió");
  assert.ok(!/Date\.now\s*\(|new Date\s*\(\s*\)/.test(codigo), "sin reloj del sistema");
  for (const efecto of ["sin_definir"]) assert.ok(codigo.includes(efecto));
});

console.log(salida.join("\n")); console.log(`p0e: ok (${casos} casos)`);
