/**
 * Together — sala de estudio en silencio (body doubling). Video real en loop
 * de fondo (generado, sin audio) — el usuario elige entre 4 escritorios
 * (ESCENAS) antes de entrar, guardado en localStorage. Widgets a los
 * costados para dejar el centro despejado (el video es el protagonista, no
 * el UI). Al entrar, el video hace fade-in — nunca aparece de golpe.
 *
 * Correo @gmail.com obligatorio para entrar (sin contraseña, no es login):
 * es la captación de lead de la campaña hasta marzo 2027. El clientId sigue
 * siendo el único identificador anónimo en localStorage frente al servidor.
 *
 * Duración: 30/60/90/120 min, sin ciclo de pausa automática — sesión única
 * que cuenta hacia atrás, coherente con "cuánto voy a estudiar hoy" en vez
 * de forzar el ritmo Pomodoro de 25/5 a todo el mundo.
 *
 * Presencia: la real (heartbeat/DB) se completa con nombres y materias
 * FICTICIOS cuando hay poca gente real conectada, para que la sala nunca
 * se sienta vacía — mismo patrón de "actividad ambiental" que usan varias
 * plataformas de este tipo. Se regenera cada ~40s con una semilla por
 * bloque de tiempo (no random puro), así no cambia de golpe en cada poll.
 * Marcado explícito acá para que quede claro qué es real y qué no.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Music, VolumeX, ArrowLeft, Plus, X, Check, Users, Volume2, Image } from "lucide-react";

const LAMP = "#F2B84B";
const LAMP_SOFT = "#E0A02E";
const PAPER = "#FBF6EC";
const INK_SOFT_LIGHT = "rgba(251,246,236,.7)";
const RED = "#C8402F";
const SAGE = "#7FCB9E";
const RULE_DARK = "rgba(251,246,236,.18)";
const GLASS = "rgba(11,21,38,.6)";

const DISPLAY = "'Fraunces', Georgia, serif";
const BODY = "'Lexend', system-ui, sans-serif";

const DURACIONES = [30, 60, 90, 120]; // minutos

const SONIDOS = [
  { id: "lofi", label: "Lofi", src: "/together/lofi-ambiente.mp3" },
  { id: "lluvia", label: "Lluvia", src: "/together/sonidos/lluvia.mp3" },
  { id: "cafe", label: "Café", src: "/together/sonidos/cafe.mp3" },
  { id: "mar", label: "Mar", src: "/together/sonidos/mar.mp3" },
  { id: "chimenea", label: "Chimenea", src: "/together/sonidos/chimenea.mp3" },
] as const;
type SonidoId = (typeof SONIDOS)[number]["id"];

// Escritorios — cada video con su nombre. "Atardecer" es la única escena sin
// personaje (escritorio vacío), el resto son personas estudiando.
const ESCENAS = [
  { id: "diego", nombre: "Diego", src: "/together/man-studying.mp4", thumb: "/together/escenas/thumbs/diego.jpg" },
  { id: "sofia", nombre: "Sofía", src: "/together/escenas/sofia.mp4", thumb: "/together/escenas/thumbs/sofia.jpg" },
  { id: "valentina", nombre: "Valentina", src: "/together/escenas/valentina.mp4", thumb: "/together/escenas/thumbs/valentina.jpg" },
  { id: "atardecer", nombre: "Atardecer", src: "/together/escenas/atardecer.mp4", thumb: "/together/escenas/thumbs/atardecer.jpg" },
] as const;
type EscenaId = (typeof ESCENAS)[number]["id"];

function getClientId() {
  const key = "together_client_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

type Presencia = { displayName: string; subject?: string };
type Tarea = { id: string; texto: string; hecha: boolean };

function useTareas() {
  const [tareas, setTareas] = useState<Tarea[]>(() => {
    try {
      const raw = localStorage.getItem("together_tareas");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("together_tareas", JSON.stringify(tareas));
  }, [tareas]);
  return { tareas, setTareas };
}

/* Presencia simulada — nombres y materias ficticios para que la sala nunca
   se sienta vacía. PRNG con semilla (LCG simple) en vez de Math.random()
   puro: así la composición solo cambia cada ~40s, no en cada re-render. */
const NOMBRES_FICTICIOS = [
  "Martina", "Benjamín", "Antonia", "Vicente", "Isidora", "Matías", "Florencia",
  "Joaquín", "Catalina", "Agustín", "Josefa", "Tomás", "Constanza", "Diego",
  "Valentina", "Cristóbal", "Emilia", "Sebastián", "Amanda", "Nicolás",
];
const MATERIAS_FICTICIAS = [
  "Matemáticas", "Lenguaje", "Historia", "Ciencias", "Inglés", "PAES",
  "Física", "Química", "Biología", "Filosofía",
];

const FRASES_MOTIVACIONALES = [
  "El progreso no se nota día a día, se nota mes a mes.",
  "No necesitas motivación, necesitas un plan y 25 minutos.",
  "Cada bloque terminado es una prueba de que puedes seguir.",
  "La constancia le gana a la intensidad, casi siempre.",
  "Nadie te está mirando. Eso es lo que lo hace más difícil, y más tuyo.",
  "Empezar mal es mejor que no empezar.",
  "Hoy no tienes que sentir ganas. Solo tienes que empezar.",
  "El cansancio de estudiar se olvida. El de no haber empezado, no.",
  "Una hora de foco real vale más que tres horas distraído.",
  "No compitas con nadie de esta sala. Compite con el de ayer.",
  "El primer minuto es el único difícil.",
  "Lo que haces en silencio, hoy, se nota después.",
];

function seedRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function presenciaSimulada(): Presencia[] {
  const bloque = Math.floor(Date.now() / 40_000); // cambia cada ~40s
  const rand = seedRandom(bloque);
  const cantidad = 2 + Math.floor(rand() * 4); // 2 a 5
  const nombres = [...NOMBRES_FICTICIOS].sort(() => rand() - 0.5).slice(0, cantidad);
  return nombres.map((n) => ({
    displayName: n,
    subject: rand() > 0.15 ? MATERIAS_FICTICIAS[Math.floor(rand() * MATERIAS_FICTICIAS.length)] : undefined,
  }));
}

function Anillo({ segundos, total }: { segundos: number; total: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? 1 - segundos / total : 0;
  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");
  return (
    <svg width={110} height={110} viewBox="0 0 110 110" style={{ filter: `drop-shadow(0 0 14px ${LAMP}55)`, flexShrink: 0 }}>
      <circle cx={55} cy={55} r={r} fill="none" stroke="rgba(251,246,236,.12)" strokeWidth={6} />
      <circle
        cx={55} cy={55} r={r} fill="none" stroke={LAMP} strokeWidth={6} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 55 55)"
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
      <text x="55" y="60" textAnchor="middle" fontFamily={DISPLAY} fontSize={19} fontWeight={500} fill={PAPER}>{mm}:{ss}</text>
    </svg>
  );
}

function ListaTareas() {
  const { tareas, setTareas } = useTareas();
  const [nueva, setNueva] = useState("");

  const agregar = () => {
    const texto = nueva.trim();
    if (!texto) return;
    setTareas((t) => [...t, { id: crypto.randomUUID(), texto, hecha: false }]);
    setNueva("");
  };

  return (
    <div style={{ background: GLASS, backdropFilter: "blur(10px)", border: `1px solid ${RULE_DARK}`, borderRadius: 14, padding: "14px 16px", width: 260 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: LAMP, margin: "0 0 10px" }}>
        Lo que voy a hacer
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && agregar()}
          placeholder="Agregar tarea…"
          maxLength={80}
          style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: `1px solid ${RULE_DARK}`, background: "rgba(0,0,0,.25)", color: PAPER, fontFamily: BODY, fontSize: 12.5 }}
        />
        <button onClick={agregar} style={{ background: LAMP, border: "none", borderRadius: 8, width: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Plus style={{ width: 15, height: 15, color: "#0B1526" }} />
        </button>
      </div>
      {tareas.length === 0 ? (
        <p style={{ fontSize: 12, color: INK_SOFT_LIGHT, margin: 0, fontStyle: "italic" }}>Sin tareas todavía.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 110, overflowY: "auto" }}>
          {tareas.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <button
                onClick={() => setTareas((ts) => ts.map((x) => (x.id === t.id ? { ...x, hecha: !x.hecha } : x)))}
                style={{
                  width: 16, height: 16, borderRadius: 5, border: `1.5px solid ${t.hecha ? SAGE : RULE_DARK}`,
                  background: t.hecha ? SAGE : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                {t.hecha && <Check style={{ width: 10, height: 10, color: "#0B1526" }} />}
              </button>
              <span style={{ fontSize: 12.5, flex: 1, color: t.hecha ? INK_SOFT_LIGHT : PAPER, textDecoration: t.hecha ? "line-through" : "none" }}>
                {t.texto}
              </span>
              <button onClick={() => setTareas((ts) => ts.filter((x) => x.id !== t.id))} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5, display: "flex" }}>
                <X style={{ width: 12, height: 12, color: PAPER }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Together() {
  useEffect(() => {
    document.title = "Together — Sala de estudio en silencio | Barkley";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Estudia acompañado sin clases en vivo. Video ambiental, cronómetro, lista de tareas y presencia real de otros estudiantes — el mismo principio de body doubling que ayuda a sostener el foco en TDAH.");
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", "https://www.barkleyinstituto.cl/together");
    const id = "together-fonts";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600&family=Lexend:wght@300;400;500;600&display=swap');`;
      document.head.appendChild(s);
    }
  }, []);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [materia, setMateria] = useState("");
  const [unido, setUnido] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const [presentesReal, setPresentesReal] = useState<Presencia[]>([]);
  const [presentesFicticios, setPresentesFicticios] = useState<Presencia[]>(presenciaSimulada());
  const [frase] = useState(() => FRASES_MOTIVACIONALES[Math.floor(Math.random() * FRASES_MOTIVACIONALES.length)]);

  const [escenaId, setEscenaId] = useState<EscenaId>(() => {
    const guardada = localStorage.getItem("together_escena") as EscenaId | null;
    return ESCENAS.some((e) => e.id === guardada) ? (guardada as EscenaId) : "atardecer";
  });
  useEffect(() => localStorage.setItem("together_escena", escenaId), [escenaId]);
  const escena = ESCENAS.find((e) => e.id === escenaId)!;

  const [escenaAbierta, setEscenaAbierta] = useState(false);
  const escenaMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!escenaAbierta) return;
    const cerrar = (e: MouseEvent) => {
      if (escenaMenuRef.current && !escenaMenuRef.current.contains(e.target as Node)) setEscenaAbierta(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [escenaAbierta]);

  // Mezclador — cada sonido se prende/apaga independiente, varios a la vez
  const [sonidosActivos, setSonidosActivos] = useState<Set<SonidoId>>(new Set());
  const [mezcladorAbierto, setMezcladorAbierto] = useState(false);
  const audioRefs = useRef<Record<SonidoId, HTMLAudioElement | null>>({} as Record<SonidoId, HTMLAudioElement | null>);
  const mezcladorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mezcladorAbierto) return;
    const cerrar = (e: MouseEvent) => {
      if (mezcladorRef.current && !mezcladorRef.current.contains(e.target as Node)) setMezcladorAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [mezcladorAbierto]);

  const toggleSonido = (id: SonidoId) => {
    setSonidosActivos((prev) => {
      const next = new Set(prev);
      const el = audioRefs.current[id];
      if (next.has(id)) {
        next.delete(id);
        el?.pause();
      } else {
        next.add(id);
        el?.play().catch(() => {});
      }
      return next;
    });
  };

  const detenerTodo = () => {
    SONIDOS.forEach((s) => audioRefs.current[s.id]?.pause());
    setSonidosActivos(new Set());
  };

  const portadaRef = useRef<HTMLVideoElement>(null);
  const salaVideoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (unido) salaVideoRef.current?.play().catch(() => {});
    else portadaRef.current?.play().catch(() => {});
  }, [unido]);

  const emailValido = /^[^\s@]+@gmail\.com$/i.test(email.trim());
  const puedeUnirse = nombre.trim().length > 0 && emailValido;

  const [duracionMin, setDuracionMin] = useState(30);
  const total = duracionMin * 60;
  const [segundos, setSegundos] = useState(30 * 60);
  const [corriendo, setCorriendo] = useState(false);

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ficticiosRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!corriendo) return;
    const t = setInterval(() => {
      setSegundos((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [corriendo]);

  useEffect(() => {
    if (segundos === 0) setCorriendo(false);
  }, [segundos]);

  // Fade-in del video al entrar a la sala
  useEffect(() => {
    if (!unido) { setVideoVisible(false); return; }
    const t = setTimeout(() => setVideoVisible(true), 60);
    return () => clearTimeout(t);
  }, [unido]);

  useEffect(() => {
    if (!unido) return;
    const clientId = getClientId();

    const latir = () => {
      fetch("/api/together/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, displayName: nombre || "Anónimo", email, subject: materia || undefined }),
      }).catch(() => {});
    };
    const consultar = () => {
      fetch("/api/together/presence")
        .then((r) => r.json())
        .then(setPresentesReal)
        .catch(() => {});
    };

    latir();
    consultar();
    setPresentesFicticios(presenciaSimulada());
    heartbeatRef.current = setInterval(latir, 15_000);
    pollRef.current = setInterval(consultar, 5_000);
    ficticiosRef.current = setInterval(() => setPresentesFicticios(presenciaSimulada()), 40_000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      if (ficticiosRef.current) clearInterval(ficticiosRef.current);
    };
  }, [unido, nombre, email, materia]);

  const presentes = useMemo(() => [...presentesReal, ...presentesFicticios], [presentesReal, presentesFicticios]);

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "#0B1526", color: PAPER, fontFamily: BODY }}>
      {/* Video ambiental en loop, de fondo, sin audio — hace fade-in al entrar a la sala.
          autoPlay solo no dispara el play() de forma confiable en todos los
          navegadores (visto en móvil), por eso se fuerza vía ref + onCanPlay. */}
      <video
        key={escenaId}
        ref={salaVideoRef}
        src={escena.src}
        autoPlay loop muted playsInline
        onCanPlay={(e) => e.currentTarget.play().catch(() => {})}
        style={{
          position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0,
          opacity: unido && videoVisible ? 1 : 0, transition: "opacity 1.4s ease",
        }}
      />
      {/* Video de portada para la pantalla de ingreso — se detiene al unirse
          para no competir con el fade-in del video de la sala. autoPlay solo
          no siempre dispara el play() real, por eso se fuerza en el ref. */}
      {!unido && (
        <video
          ref={portadaRef}
          src="/together/portada.mp4"
          autoPlay loop muted playsInline
          onCanPlay={(e) => e.currentTarget.play().catch(() => {})}
          style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
        />
      )}
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, rgba(11,21,38,.55) 0%, rgba(11,21,38,.3) 45%, rgba(11,21,38,.8) 100%)", zIndex: 1 }} />

      {/* Mezclador de sonido — cada pista independiente, todas apagadas por defecto */}
      {SONIDOS.map((s) => (
        <audio key={s.id} ref={(el) => { audioRefs.current[s.id] = el; }} src={s.src} loop />
      ))}

      <div style={{ position: "relative", zIndex: 2, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header style={{ padding: "clamp(14px,3vw,20px) clamp(16px,4vw,24px)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
              <div style={{ width: 34, height: 34, background: PAPER, borderRadius: 5, color: "#0B1526", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, flexShrink: 0 }}>BK</div>
              <span style={{ fontWeight: 500, color: PAPER, fontSize: 13, whiteSpace: "nowrap", textShadow: "0 1px 4px rgba(0,0,0,.5)" }}>Barkley Online</span>
            </a>
            <div style={{ display: "flex", gap: 8 }}>
              {unido && (
                <button
                  onClick={() => setUnido(false)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: GLASS, backdropFilter: "blur(6px)", color: PAPER, border: `1px solid ${RULE_DARK}`, borderRadius: 999, padding: "8px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  <ArrowLeft style={{ width: 13, height: 13 }} /> Salir
                </button>
              )}
              {unido && (
                <div ref={escenaMenuRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setEscenaAbierta((m) => !m)}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: GLASS, backdropFilter: "blur(6px)", color: PAPER, border: `1px solid ${RULE_DARK}`, borderRadius: 999, padding: "8px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    <Image style={{ width: 13, height: 13 }} /> {escena.nombre}
                  </button>
                  {escenaAbierta && (
                    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: GLASS, backdropFilter: "blur(12px)", border: `1px solid ${RULE_DARK}`, borderRadius: 12, padding: 10, display: "flex", gap: 8, zIndex: 10 }}>
                      {ESCENAS.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => { setEscenaId(e.id); setEscenaAbierta(false); }}
                          style={{
                            padding: 0, borderRadius: 8, overflow: "hidden", cursor: "pointer", width: 68,
                            border: `2px solid ${escenaId === e.id ? LAMP : "transparent"}`, background: "none",
                          }}
                        >
                          <img src={e.thumb} alt={e.nombre} style={{ width: "100%", height: 40, objectFit: "cover", display: "block" }} />
                          <span style={{ display: "block", fontSize: 10, fontWeight: 600, color: escenaId === e.id ? LAMP : INK_SOFT_LIGHT, padding: "3px 0", background: "rgba(0,0,0,.35)" }}>
                            {e.nombre}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div ref={mezcladorRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setMezcladorAbierto((m) => !m)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: GLASS, backdropFilter: "blur(6px)", color: PAPER, border: `1px solid ${RULE_DARK}`, borderRadius: 999, padding: "8px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  {sonidosActivos.size > 0 ? <Music style={{ width: 13, height: 13 }} /> : <VolumeX style={{ width: 13, height: 13 }} />}
                  {sonidosActivos.size > 0
                    ? SONIDOS.filter((s) => sonidosActivos.has(s.id)).map((s) => s.label).join(" + ")
                    : "Sonido"}
                </button>
                {mezcladorAbierto && (
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: GLASS, backdropFilter: "blur(12px)", border: `1px solid ${RULE_DARK}`, borderRadius: 12, padding: 10, display: "flex", flexDirection: "column", gap: 4, minWidth: 170, zIndex: 10 }}>
                    <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: LAMP, margin: "2px 6px 6px" }}>Mezclador</p>
                    {SONIDOS.map((s) => {
                      const activo = sonidosActivos.has(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleSonido(s.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, background: activo ? "rgba(242,184,75,.18)" : "transparent",
                            border: "none", borderRadius: 8, padding: "7px 8px", cursor: "pointer", textAlign: "left",
                          }}
                        >
                          {activo ? <Volume2 style={{ width: 14, height: 14, color: LAMP }} /> : <VolumeX style={{ width: 14, height: 14, color: INK_SOFT_LIGHT }} />}
                          <span style={{ fontSize: 13, color: activo ? PAPER : INK_SOFT_LIGHT, fontWeight: activo ? 600 : 400 }}>{s.label}</span>
                        </button>
                      );
                    })}
                    {sonidosActivos.size > 0 && (
                      <button
                        onClick={detenerTodo}
                        style={{ marginTop: 4, background: "none", border: `1px solid ${RULE_DARK}`, borderRadius: 8, padding: "6px 8px", fontSize: 12, color: INK_SOFT_LIGHT, cursor: "pointer" }}
                      >
                        Detener todo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {!unido ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <div style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: LAMP, margin: "0 0 14px", textShadow: "0 1px 6px rgba(0,0,0,.5)" }}>
                Together™ · sala de estudio en silencio
              </p>
              <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px,5vw,40px)", fontWeight: 500, margin: "0 0 14px", lineHeight: 1.15, fontVariationSettings: "'SOFT' 30", textShadow: "0 2px 12px rgba(0,0,0,.6)" }}>
                Aunque estudies solo,<br />no estás solo
              </h1>
              <p style={{ fontSize: 14.5, color: INK_SOFT_LIGHT, margin: "0 0 30px", lineHeight: 1.7, textShadow: "0 1px 6px rgba(0,0,0,.5)" }}>
                Sin cámara, sin chat, sin clase. Un cuarto compartido en silencio —
                el mismo efecto de estudiar en la biblioteca, sin salir de tu pieza.
              </p>

              <div style={{ background: GLASS, borderRadius: 16, padding: "clamp(24px,5vw,32px)", border: `1px solid ${RULE_DARK}`, textAlign: "left", backdropFilter: "blur(10px)" }}>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre o apodo"
                  maxLength={40}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${RULE_DARK}`, fontFamily: BODY, fontSize: 15, marginBottom: 10, background: "rgba(0,0,0,.3)", color: PAPER }}
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@gmail.com"
                  type="email"
                  maxLength={80}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${email.length > 0 && !emailValido ? RED : RULE_DARK}`, fontFamily: BODY, fontSize: 15, marginBottom: 6, background: "rgba(0,0,0,.3)", color: PAPER }}
                />
                <p style={{ fontSize: 12, color: email.length > 0 && !emailValido ? "#FF8A73" : INK_SOFT_LIGHT, margin: "0 0 10px" }}>
                  {email.length > 0 && !emailValido ? "Debe ser un correo @gmail.com" : "Solo para entrar a la sala — no se comparte con nadie más."}
                </p>
                <input
                  value={materia}
                  onChange={(e) => setMateria(e.target.value)}
                  placeholder="¿Qué vas a estudiar? (opcional)"
                  maxLength={60}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${RULE_DARK}`, fontFamily: BODY, fontSize: 15, marginBottom: 18, background: "rgba(0,0,0,.3)", color: PAPER }}
                />

                <button
                  onClick={() => puedeUnirse && setUnido(true)}
                  disabled={!puedeUnirse}
                  style={{
                    width: "100%", background: puedeUnirse ? LAMP : "rgba(251,246,236,.15)", color: puedeUnirse ? "#0B1526" : INK_SOFT_LIGHT,
                    border: "none", borderRadius: 999, padding: "13px 20px", fontSize: 15, fontWeight: 700,
                    cursor: puedeUnirse ? "pointer" : "not-allowed",
                  }}
                >
                  Entrar a la sala
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Widgets por los costados — el centro del video queda libre */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(16px,4vw,40px)", gap: 16 }}>
              {/* Izquierda: timer */}
              <div style={{ background: GLASS, backdropFilter: "blur(10px)", border: `1px solid ${RULE_DARK}`, borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <Anillo segundos={segundos} total={total} />
                <div style={{ display: "flex", gap: 4 }}>
                  {DURACIONES.map((d) => (
                    <button
                      key={d}
                      onClick={() => { if (corriendo) return; setDuracionMin(d); setSegundos(d * 60); }}
                      disabled={corriendo}
                      style={{
                        padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: duracionMin === d ? LAMP : "rgba(251,246,236,.1)",
                        color: duracionMin === d ? "#0B1526" : PAPER,
                        border: "none", cursor: corriendo ? "default" : "pointer", opacity: corriendo && duracionMin !== d ? 0.4 : 1,
                      }}
                    >
                      {d < 60 ? `${d}m` : `${Math.floor(d / 60)}h${d % 60 ? "30" : ""}`}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => setCorriendo((c) => !c)}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: LAMP, color: "#0B1526", border: "none", borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    {corriendo ? <Pause style={{ width: 12, height: 12 }} /> : <Play style={{ width: 12, height: 12 }} />}
                    {corriendo ? "Pausar" : "Empezar"}
                  </button>
                  <button
                    onClick={() => { setCorriendo(false); setSegundos(duracionMin * 60); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(251,246,236,.1)", color: PAPER, border: "none", borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    <RotateCcw style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              </div>

              {/* Derecha: tareas + presencia apiladas */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
                <ListaTareas />
                <div style={{ background: GLASS, backdropFilter: "blur(10px)", border: `1px solid ${RULE_DARK}`, borderRadius: 14, padding: "12px 16px", width: 260 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: LAMP, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Users style={{ width: 12, height: 12 }} /> {presentes.length} estudiando
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 90, overflowY: "auto" }}>
                    {presentes.map((p, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{
                          width: 16, height: 16, borderRadius: "50%", background: LAMP_SOFT, color: "#0B1526",
                          fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {p.displayName.trim().charAt(0).toUpperCase() || "?"}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.displayName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Frase motivacional — abajo al centro, discreta */}
            <div style={{ padding: "0 24px 24px", textAlign: "center" }}>
              <p style={{ fontFamily: DISPLAY, fontSize: "clamp(14px,2vw,17px)", fontStyle: "italic", color: "rgba(251,246,236,.75)", margin: 0, textShadow: "0 1px 8px rgba(0,0,0,.6)" }}>
                "{frase}"
              </p>
            </div>
          </>
        )}

        {!unido && (
          <footer style={{ padding: "16px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 11.5, color: INK_SOFT_LIGHT, margin: 0, textShadow: "0 1px 4px rgba(0,0,0,.5)" }}>Barkley Online · The Barkley Online School</p>
          </footer>
        )}
      </div>
    </div>
  );
}
