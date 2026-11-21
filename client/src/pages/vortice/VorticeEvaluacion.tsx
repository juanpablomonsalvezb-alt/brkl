// Evaluación de cierre (E2) del estudiante en Vórtice. Reglas: P21 v2 (DECISIONES_DIRECCION.md).
// - 1 intento normal + 1 extra (72 h, obligatorio para avanzar); sin nota 1-7: solo porcentaje.
// - Aprobación 70 % (50 % neurodivergentes), sin redondeo: el porcentaje se muestra truncado.
// - 60 min con reloj; 120 min sin cronómetro y con avisos suaves para neurodivergentes.
// - Las respuestas son solo inserción en el servidor: se guardan al confirmarlas y no se cambian.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Home, Leaf, Lock, RotateCcw } from "lucide-react";
import { RequiereSesion } from "@/components/RequiereSesion";
import "./evaluacion.css";

interface Intento {
  id: string; tipo: "normal" | "extra"; estado: "activo" | "enviado" | "expirado";
  expiraAt: number | null; enviadoAt: number | null; scorePct: number | null;
  correctas: number | null; total: number | null; aprobado: boolean | null;
}
interface Estado {
  ahora: number; titulo: string;
  proceso: null | {
    procesoId: string; instanciaId: string; estado: string; perfil: "regular" | "neurodivergente";
    duracionMin: number; umbral: number; intentos: Intento[]; extraEstado: string | null; extraCierraAt: number | null;
  };
}
interface Pregunta { preguntaVersionId: string; enunciado: string; posicion: number; opciones: { id: string; texto: string }[]; seleccion: string | null }

class ErrorApi extends Error { constructor(readonly status: number, m: string) { super(m); } }
async function api<T>(metodo: string, url: string, cuerpo?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: metodo, credentials: "include",
    headers: cuerpo === undefined ? undefined : { "content-type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const j = await res.json().catch(() => null);
  if (!res.ok) throw new ErrorApi(res.status, j?.message ?? "No se pudo completar la acción");
  return j as T;
}

// Sin redondeo: se trunca a 2 decimales para que 69,99 nunca se vea como 70.
const pct = (n: number) => (Math.floor(n * 100) / 100).toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const reloj = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const horas = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min` : `${Math.max(0, Math.floor(s / 60))} min`);
const LETRAS = "ABCDEFGH";

export default function VorticeEvaluacion() {
  const [, params] = useRoute("/vortice/evaluacion/:evaluacionId");
  const evaluacionId = params?.evaluacionId ?? "";
  const [estado, setEstado] = useState<Estado | null>(null);
  const [sinSesion, setSinSesion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const offset = useRef(0); // segundos: reloj del servidor menos reloj local

  useEffect(() => {
    const id = "ve-fuentes";
    if (document.getElementById(id)) return;
    document.head.appendChild(Object.assign(document.createElement("link"), {
      id, rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&display=swap",
    }));
  }, []);

  const cargar = useCallback(async () => {
    try {
      const e = await api<Estado>("GET", `/api/vortice/evaluaciones/${encodeURIComponent(evaluacionId)}/estado`);
      offset.current = e.ahora - Date.now() / 1000;
      setEstado(e); setError(null);
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 401) setSinSesion(true);
      else setError((e as Error).message);
    }
  }, [evaluacionId]);
  useEffect(() => { if (evaluacionId) void cargar(); }, [cargar, evaluacionId]);

  const accion = async (f: () => Promise<unknown>) => {
    setOcupado(true); setError(null);
    try { await f(); await cargar(); } catch (e) { setError((e as Error).message); await cargar(); } finally { setOcupado(false); }
  };

  if (sinSesion) return <RequiereSesion titulo="Inicia sesión para rendir tu evaluación" />;
  const calmo = estado?.proceso?.perfil === "neurodivergente";
  const activo = estado?.proceso?.intentos.find((i) => i.estado === "activo");

  return (
    <div className="ve" data-calmo={calmo ? "1" : "0"}>
      <header className="ve-top">
        <Link href="/vortice" className="ve-inicio"><Home size={17} aria-hidden /> Inicio</Link>
        <div className="ve-titulo">
          <span className="ve-kicker">Evaluación del módulo</span>
          <h1>{estado?.titulo ?? "Evaluación"}</h1>
        </div>
        {activo && <span className="ve-chip">{activo.tipo === "extra" ? "Intento extra" : "Intento normal"}</span>}
      </header>

      <main className="ve-main">
        {error && <p role="alert" className="ve-error">{error}</p>}
        {!estado && !error && <p className="ve-cargando">Preparando tu hoja…</p>}
        {estado && !estado.proceso && (
          <Intro estado={estado} ocupado={ocupado} onComenzar={() => accion(async () => {
            const p = await api<{ instanciaId: string }>("POST", `/api/vortice/evaluaciones/${encodeURIComponent(evaluacionId)}/proceso`);
            await api("POST", `/api/vortice/evaluaciones/instancias/${p.instanciaId}/intentos`, { tipo: "normal" });
          })} />
        )}
        {estado?.proceso && activo && (
          <Rendir key={activo.id} intento={activo} proceso={estado.proceso} offset={offset} onTerminar={cargar} setError={setError} />
        )}
        {estado?.proceso && !activo && (
          <Resultado estado={estado} ocupado={ocupado}
            onIniciarNormal={() => accion(() => api("POST", `/api/vortice/evaluaciones/instancias/${estado.proceso!.instanciaId}/intentos`, { tipo: "normal" }))}
            onIniciarExtra={() => accion(() => api("POST", `/api/vortice/evaluaciones/instancias/${estado.proceso!.instanciaId}/intentos`, { tipo: "extra" }))}
            onCerrar={() => accion(() => api("POST", `/api/vortice/evaluaciones/procesos/${estado.proceso!.procesoId}/cerrar`))} />
        )}
      </main>
    </div>
  );
}

// ——— Antes de empezar ———
function Intro({ estado, ocupado, onComenzar }: { estado: Estado; ocupado: boolean; onComenzar: () => void }) {
  return (
    <section className="ve-hoja ve-intro">
      <p className="ve-kicker">Antes de empezar</p>
      <h2>Una prueba para mostrar lo que ya sabes</h2>
      <ul className="ve-reglas">
        <li><b>15 preguntas</b> de alternativas, sobre lo que trabajaste en el módulo.</li>
        <li>Si hace falta, tienes <b>un intento extra</b> dentro de las 72 horas siguientes.</li>
        <li>Al guardar una respuesta <b>ya no se cambia</b>. Léela con calma antes de guardarla.</li>
        <li>Se te muestra tu porcentaje; <b>no hay nota del 1 al 7</b>.</li>
      </ul>
      <p className="ve-nota">Cuando pulses «Comenzar» el tiempo empieza a correr. Tu perfil y el tiempo disponible se muestran en cuanto abras la prueba.</p>
      <button className="ve-btn ve-btn-primario" disabled={ocupado} onClick={onComenzar}>
        {ocupado ? "Abriendo…" : "Comenzar"} <ArrowRight size={18} aria-hidden />
      </button>
      <p className="ve-pie">{estado.titulo}</p>
    </section>
  );
}

// ——— Rendir ———
function Rendir({ intento, proceso, offset, onTerminar, setError }: {
  intento: Intento; proceso: NonNullable<Estado["proceso"]>; offset: React.MutableRefObject<number>;
  onTerminar: () => Promise<void>; setError: (m: string | null) => void;
}) {
  const calmo = proceso.perfil === "neurodivergente";
  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null);
  const [guardadas, setGuardadas] = useState<Record<string, string>>({});
  const [borrador, setBorrador] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [revisando, setRevisando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [restante, setRestante] = useState<number | null>(null);
  const terminado = useRef(false);
  const envioId = useRef(crypto.randomUUID());

  useEffect(() => {
    api<Pregunta[]>("GET", `/api/vortice/evaluaciones/intentos/${intento.id}/preguntas`).then((ps) => {
      setPreguntas(ps);
      const g: Record<string, string> = {};
      ps.forEach((p) => { if (p.seleccion) g[p.preguntaVersionId] = p.seleccion; });
      setGuardadas(g);
      const primera = ps.findIndex((p) => !g[p.preguntaVersionId]);
      setI(primera === -1 ? Math.max(0, ps.length - 1) : primera);
    }).catch((e) => setError((e as Error).message));
  }, [intento.id, setError]);

  const duracion = proceso.duracionMin * 60;
  const enviar = useCallback(async (porTiempo: boolean) => {
    if (terminado.current) return;
    terminado.current = true;
    try {
      if (porTiempo) await api("POST", `/api/vortice/evaluaciones/intentos/${intento.id}/verificar-tiempo`);
      else await api("POST", `/api/vortice/evaluaciones/intentos/${intento.id}/enviar`, { envioId: envioId.current });
    } catch (e) { terminado.current = false; setError((e as Error).message); return; }
    await onTerminar();
  }, [intento.id, onTerminar, setError]);

  useEffect(() => {
    if (intento.expiraAt == null) return;
    const tick = () => {
      const r = intento.expiraAt! - (Date.now() / 1000 + offset.current);
      setRestante(r);
      if (r <= 0) void enviar(true);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [intento.expiraAt, offset, enviar]);

  const p = preguntas?.[i];
  const yaGuardada = p ? guardadas[p.preguntaVersionId] : undefined;
  const elegida = yaGuardada ?? borrador;
  const total = preguntas?.length ?? 0;
  const sinResponder = preguntas ? preguntas.filter((q) => !guardadas[q.preguntaVersionId]).length : 0;

  const guardarYSeguir = async () => {
    if (!p || !borrador || yaGuardada) { setBorrador(null); setI((x) => Math.min(x + 1, total - 1)); return; }
    setGuardando(true);
    try {
      await api("POST", `/api/vortice/evaluaciones/intentos/${intento.id}/responder`, { preguntaVersionId: p.preguntaVersionId, opcionId: borrador });
      setGuardadas((g) => ({ ...g, [p.preguntaVersionId]: borrador }));
      setBorrador(null);
      if (i < total - 1) setI(i + 1); else setRevisando(true);
    } catch (e) { setError((e as Error).message); } finally { setGuardando(false); }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!p || yaGuardada || revisando) return;
      const n = LETRAS.indexOf(e.key.toUpperCase());
      if (n >= 0 && n < p.opciones.length && e.key.length === 1) setBorrador(p.opciones[n].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p, yaGuardada, revisando]);

  // Avisos: con reloj (regular) o suaves y sin cuenta regresiva (neurodivergente).
  const aviso = useMemo(() => {
    if (restante == null || restante <= 0) return null;
    if (calmo) {
      if (restante <= 300) return "Quedan unos 5 minutos. Responde lo que puedas; lo que falte se cuenta como sin responder.";
      if (restante <= 900) return "Te quedan unos 15 minutos. Puedes seguir a tu ritmo.";
      if (restante <= duracion / 2) return "Vas a la mitad del tiempo. No hay apuro.";
      return null;
    }
    if (restante <= 60) return "Queda menos de 1 minuto.";
    if (restante <= 300) return "Quedan 5 minutos.";
    if (restante <= 600) return "Quedan 10 minutos.";
    return null;
  }, [restante, calmo, duracion]);

  if (!preguntas || !p) return <p className="ve-cargando">Abriendo tu hoja…</p>;

  if (revisando) {
    return (
      <section className="ve-hoja ve-revision">
        <p className="ve-kicker">Revisión final</p>
        <h2>{sinResponder === 0 ? "Respondiste todas las preguntas" : `Te faltan ${sinResponder} por responder`}</h2>
        <p className="ve-nota">Al enviar, la evaluación se cierra. {sinResponder > 0 && "Las que queden sin responder cuentan como incorrectas."}</p>
        <ol className="ve-grilla">
          {preguntas.map((q, k) => (
            <li key={q.preguntaVersionId}>
              <button className={guardadas[q.preguntaVersionId] ? "ok" : "falta"} onClick={() => { setRevisando(false); setI(k); setBorrador(null); }}>
                <span>{k + 1}</span><small>{guardadas[q.preguntaVersionId] ? "guardada" : "sin responder"}</small>
              </button>
            </li>
          ))}
        </ol>
        <div className="ve-acciones">
          <button className="ve-btn" onClick={() => setRevisando(false)}><ArrowLeft size={18} aria-hidden /> Volver</button>
          <button className="ve-btn ve-btn-primario" onClick={() => void enviar(false)}>Enviar evaluación <CheckCircle2 size={18} aria-hidden /></button>
        </div>
      </section>
    );
  }

  return (
    <div className="ve-rendir">
      <div className="ve-panel">
        <nav className="ve-regla" aria-label="Preguntas">
          {preguntas.map((q, k) => (
            <button key={q.preguntaVersionId} aria-label={`Pregunta ${k + 1}${guardadas[q.preguntaVersionId] ? ", guardada" : ""}`}
              aria-current={k === i ? "step" : undefined}
              className={`ve-marca ${guardadas[q.preguntaVersionId] ? "hecha" : ""} ${k === i ? "actual" : ""}`}
              onClick={() => { setI(k); setBorrador(null); }}>{k + 1}</button>
          ))}
        </nav>
        {calmo ? (
          <p className="ve-ritmo"><Leaf size={16} aria-hidden /> Sin cronómetro. Vas a tu ritmo.</p>
        ) : restante != null && (
          <div className={`ve-reloj ${restante <= 300 ? "urgente" : ""}`} role="timer" aria-label="Tiempo restante">
            <Clock size={16} aria-hidden /><b>{reloj(Math.max(0, restante))}</b>
            <span className="ve-barra"><i style={{ width: `${Math.max(0, Math.min(100, (restante / duracion) * 100))}%` }} /></span>
          </div>
        )}
      </div>

      <div className="ve-aviso" aria-live="polite">{aviso}</div>

      <section className="ve-hoja ve-pregunta" key={p.preguntaVersionId} aria-labelledby="ve-enun">
        <span className="ve-numero" aria-hidden>{i + 1}</span>
        <div className="ve-cuerpo">
          <p className="ve-kicker">Pregunta {i + 1} de {total}</p>
          <h2 id="ve-enun">{p.enunciado}</h2>
          <div role="radiogroup" aria-labelledby="ve-enun" className="ve-opciones">
            {p.opciones.map((o, k) => {
              const marcada = elegida === o.id;
              return (
                <button key={o.id} role="radio" aria-checked={marcada} disabled={!!yaGuardada}
                  className={`ve-opcion ${marcada ? "marcada" : ""}`} onClick={() => setBorrador(o.id)} style={{ animationDelay: `${k * 55}ms` }}>
                  <span className="ve-letra">{LETRAS[k]}</span><span>{o.texto}</span>
                </button>
              );
            })}
          </div>
          {yaGuardada && <p className="ve-bloqueada"><Lock size={14} aria-hidden /> Respuesta guardada. Ya no se puede cambiar.</p>}
        </div>
      </section>

      <div className="ve-acciones">
        <button className="ve-btn" disabled={i === 0} onClick={() => { setI(i - 1); setBorrador(null); }}><ArrowLeft size={18} aria-hidden /> Anterior</button>
        {i < total - 1 || !yaGuardada ? (
          <button className="ve-btn ve-btn-primario" disabled={guardando || (!borrador && !yaGuardada)} onClick={() => void guardarYSeguir()}>
            {yaGuardada ? "Siguiente" : i === total - 1 ? "Guardar y revisar" : "Guardar y seguir"} <ArrowRight size={18} aria-hidden />
          </button>
        ) : (
          <button className="ve-btn ve-btn-primario" onClick={() => setRevisando(true)}>Revisar y enviar <CheckCircle2 size={18} aria-hidden /></button>
        )}
      </div>
    </div>
  );
}

// ——— Resultado y extra ———
function Resultado({ estado, ocupado, onIniciarNormal, onIniciarExtra, onCerrar }: {
  estado: Estado; ocupado: boolean; onIniciarNormal: () => void; onIniciarExtra: () => void; onCerrar: () => void;
}) {
  const pr = estado.proceso!;
  const normal = pr.intentos.find((x) => x.tipo === "normal" && x.estado === "enviado");
  const extra = pr.intentos.find((x) => x.tipo === "extra" && x.estado === "enviado");
  const sinIntentos = pr.intentos.length === 0;
  const mejor = [normal, extra].filter((x): x is Intento => !!x && x.scorePct != null).sort((a, b) => b.scorePct! - a.scorePct!)[0];
  const aprobado = !!mejor && mejor.scorePct! >= pr.umbral;
  const cerrado = pr.estado === "aprobado" || pr.estado === "reprobado";
  const cierraEn = pr.extraCierraAt != null ? pr.extraCierraAt - estado.ahora : null;
  const cerrando = useRef(false);
  useEffect(() => {
    // Con el proceso abierto y nada pendiente, se cierra para que el servidor registre el resultado.
    if (cerrando.current || cerrado || !mejor) return;
    if (aprobado || extra || pr.extraEstado === "no_rendido") { cerrando.current = true; onCerrar(); }
  }, [aprobado, cerrado, extra, mejor, onCerrar, pr.extraEstado]);

  if (sinIntentos) {
    return (
      <section className="ve-hoja ve-intro">
        <h2>Tu evaluación está lista</h2>
        <button className="ve-btn ve-btn-primario" disabled={ocupado} onClick={onIniciarNormal}>Comenzar <ArrowRight size={18} aria-hidden /></button>
      </section>
    );
  }
  if (!mejor) return <p className="ve-cargando">Cargando tu resultado…</p>;

  return (
    <section className="ve-hoja ve-resultado">
      <p className="ve-kicker">{extra ? "Resultado final" : "Resultado de tu intento"}</p>
      <div className="ve-score">
        <span className="ve-grande">{pct(mejor.scorePct!)}<small>%</small></span>
        <span className={`ve-sello ${aprobado ? "ok" : "no"}`}>{aprobado ? "Aprobado" : "Todavía no"}</span>
      </div>
      <div className="ve-escala" role="img" aria-label={`Tu porcentaje: ${pct(mejor.scorePct!)} %. Se aprueba con ${pr.umbral} %.`}>
        <i className="ve-relleno" style={{ width: `${Math.min(100, mejor.scorePct!)}%` }} />
        <i className="ve-umbral" style={{ left: `${pr.umbral}%` }}><em>{pr.umbral} %</em></i>
      </div>
      <p className="ve-detalle">{mejor.correctas} de {mejor.total} respuestas correctas. Se aprueba con {pr.umbral} %.</p>

      {aprobado ? (
        <p className="ve-mensaje">Lo lograste. {extra && !normal?.aprobado ? "Tu intento extra mejoró el resultado." : "Ya puedes seguir con el módulo siguiente."}</p>
      ) : extra || pr.extraEstado === "no_rendido" ? (
        <p className="ve-mensaje">{pr.extraEstado === "no_rendido" ? "El plazo del intento extra terminó." : "Este fue tu mejor resultado."} Igual avanzas al módulo siguiente.</p>
      ) : (
        <div className="ve-extra">
          <h3><RotateCcw size={18} aria-hidden /> Tienes un intento extra</h3>
          <p>Es obligatorio para avanzar y se arma con foco en los temas que faltaron. {cierraEn != null && cierraEn > 0 && <>Te quedan <b>{horas(cierraEn)}</b> para rendirlo.</>}</p>
          <button className="ve-btn ve-btn-primario" disabled={ocupado || pr.extraEstado === "no_rendido"} onClick={onIniciarExtra}>
            Rendir intento extra <ArrowRight size={18} aria-hidden />
          </button>
        </div>
      )}
      <Link href="/vortice" className="ve-btn ve-volver"><Home size={17} aria-hidden /> Volver al inicio</Link>
    </section>
  );
}
