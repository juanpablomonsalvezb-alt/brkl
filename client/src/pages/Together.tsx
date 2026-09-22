/**
 * Together — sala de estudio en silencio (body doubling). Video real en loop
 * de fondo (generado, sin audio) + música lofi opcional aparte, con los
 * widgets que los sitios reales del género traen (StudyStream, StudyClock,
 * LofiSpace): timer Pomodoro, presencia de otros estudiantes y lista de
 * tareas. Nada de esto es original — es lo que ya existe afuera, adaptado.
 *
 * Correo @gmail.com obligatorio para entrar (sin contraseña, no es login):
 * es la captación de lead de la campaña hasta marzo 2027. El clientId sigue
 * siendo el único identificador anónimo en localStorage frente al servidor.
 *
 * Nivel 1 del prototipo: heartbeat cada 15s a /api/together/heartbeat,
 * presencia leída cada 5s desde /api/together/presence. Lista de tareas
 * es puramente local (localStorage) — no hay backend de tareas todavía.
 */
import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Music, VolumeX, ArrowLeft, Plus, X, Check } from "lucide-react";

const LAMP = "#F2B84B";
const LAMP_SOFT = "#E0A02E";
const PAPER = "#FBF6EC";
const INK_SOFT_LIGHT = "rgba(251,246,236,.7)";
const RED = "#C8402F";
const SAGE = "#7FCB9E";
const RULE_DARK = "rgba(251,246,236,.18)";
const GLASS = "rgba(11,21,38,.55)";

const DISPLAY = "'Fraunces', Georgia, serif";
const BODY = "'Lexend', system-ui, sans-serif";

const FOCUS_MIN = 25;
const BREAK_MIN = 5;

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

function Anillo({ segundos, total, enFoco }: { segundos: number; total: number; enFoco: boolean }) {
  const r = 78;
  const c = 2 * Math.PI * r;
  const pct = 1 - segundos / total;
  const color = enFoco ? LAMP : SAGE;
  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");
  return (
    <svg width={190} height={190} viewBox="0 0 190 190" style={{ filter: `drop-shadow(0 0 20px ${color}55)` }}>
      <circle cx={95} cy={95} r={r} fill="none" stroke="rgba(251,246,236,.12)" strokeWidth={7} />
      <circle
        cx={95} cy={95} r={r} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 95 95)"
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
      <text x="95" y="88" textAnchor="middle" fontFamily={DISPLAY} fontSize={34} fontWeight={500} fill={PAPER}>{mm}:{ss}</text>
      <text x="95" y="112" textAnchor="middle" fontFamily={BODY} fontSize={10} letterSpacing="2" fill={color} style={{ textTransform: "uppercase" }}>
        {enFoco ? "Foco" : "Pausa"}
      </text>
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
    <div style={{ background: GLASS, backdropFilter: "blur(8px)", border: `1px solid ${RULE_DARK}`, borderRadius: 14, padding: "18px 20px", width: 280 }}>
      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: LAMP, margin: "0 0 12px" }}>
        Lo que voy a hacer
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && agregar()}
          placeholder="Agregar tarea…"
          maxLength={80}
          style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${RULE_DARK}`, background: "rgba(0,0,0,.25)", color: PAPER, fontFamily: BODY, fontSize: 13 }}
        />
        <button onClick={agregar} style={{ background: LAMP, border: "none", borderRadius: 8, width: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Plus style={{ width: 16, height: 16, color: "#0B1526" }} />
        </button>
      </div>
      {tareas.length === 0 ? (
        <p style={{ fontSize: 12.5, color: INK_SOFT_LIGHT, margin: 0, fontStyle: "italic" }}>Sin tareas todavía.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
          {tareas.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setTareas((ts) => ts.map((x) => (x.id === t.id ? { ...x, hecha: !x.hecha } : x)))}
                style={{
                  width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${t.hecha ? SAGE : RULE_DARK}`,
                  background: t.hecha ? SAGE : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                {t.hecha && <Check style={{ width: 12, height: 12, color: "#0B1526" }} />}
              </button>
              <span style={{ fontSize: 13, flex: 1, color: t.hecha ? INK_SOFT_LIGHT : PAPER, textDecoration: t.hecha ? "line-through" : "none" }}>
                {t.texto}
              </span>
              <button onClick={() => setTareas((ts) => ts.filter((x) => x.id !== t.id))} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5, display: "flex" }}>
                <X style={{ width: 13, height: 13, color: PAPER }} />
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
  const [presentes, setPresentes] = useState<Presencia[]>([]);
  const [musica, setMusica] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (!audioRef.current) return;
    if (musica) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [musica]);

  const emailValido = /^[^\s@]+@gmail\.com$/i.test(email.trim());
  const puedeUnirse = nombre.trim().length > 0 && emailValido;

  const [enFoco, setEnFoco] = useState(true);
  const totalActual = (enFoco ? FOCUS_MIN : BREAK_MIN) * 60;
  const [segundos, setSegundos] = useState(FOCUS_MIN * 60);
  const [corriendo, setCorriendo] = useState(false);

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!corriendo) return;
    const t = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) {
          setEnFoco((f) => !f);
          return (enFoco ? BREAK_MIN : FOCUS_MIN) * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [corriendo, enFoco]);

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
        .then(setPresentes)
        .catch(() => {});
    };

    latir();
    consultar();
    heartbeatRef.current = setInterval(latir, 15_000);
    pollRef.current = setInterval(consultar, 5_000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [unido, nombre, email, materia]);

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "#0B1526", color: PAPER, fontFamily: BODY }}>
      {/* Video ambiental en loop, de fondo, sin audio */}
      <video
        src="/together/man-studying.mp4"
        autoPlay loop muted playsInline
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
      />
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, rgba(11,21,38,.55) 0%, rgba(11,21,38,.35) 40%, rgba(11,21,38,.75) 100%)", zIndex: 1 }} />

      {/* Música lofi real, separada del video — apagada por defecto */}
      <audio ref={audioRef} src="/together/lofi-ambiente.mp3" loop />

      <div style={{ position: "relative", zIndex: 2, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header style={{ padding: "20px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
              <div style={{ width: 40, height: 40, background: PAPER, borderRadius: 5, color: "#0B1526", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY }}>BK</div>
              <span style={{ fontWeight: 500, color: PAPER, fontSize: 14, lineHeight: 1.25, textShadow: "0 1px 4px rgba(0,0,0,.5)" }}>The Barkley<br />Online School</span>
            </a>
            <button
              onClick={() => setMusica((m) => !m)}
              style={{ display: "flex", alignItems: "center", gap: 7, background: GLASS, backdropFilter: "blur(6px)", color: PAPER, border: `1px solid ${RULE_DARK}`, borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              {musica ? <Music style={{ width: 14, height: 14 }} /> : <VolumeX style={{ width: 14, height: 14 }} />}
              {musica ? "Música: on" : "Música ambiental"}
            </button>
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
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px" }}>
            <button
              onClick={() => setUnido(false)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: PAPER, fontSize: 13, cursor: "pointer", alignSelf: "flex-start", textShadow: "0 1px 4px rgba(0,0,0,.5)" }}
            >
              <ArrowLeft style={{ width: 14, height: 14 }} /> Salir de la sala
            </button>

            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(20px,4vw,48px)", flexWrap: "wrap" }}>
              {/* Timer */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <Anillo segundos={segundos} total={totalActual} enFoco={enFoco} />
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setCorriendo((c) => !c)}
                    style={{ display: "flex", alignItems: "center", gap: 8, background: LAMP, color: "#0B1526", border: "none", borderRadius: 999, padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                  >
                    {corriendo ? <Pause style={{ width: 15, height: 15 }} /> : <Play style={{ width: 15, height: 15 }} />}
                    {corriendo ? "Pausar" : "Empezar"}
                  </button>
                  <button
                    onClick={() => { setCorriendo(false); setEnFoco(true); setSegundos(FOCUS_MIN * 60); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, background: GLASS, color: PAPER, border: `1.5px solid ${RULE_DARK}`, borderRadius: 999, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                  >
                    <RotateCcw style={{ width: 14, height: 14 }} />
                    Reiniciar
                  </button>
                </div>
              </div>

              {/* Tareas */}
              <ListaTareas />

              {/* Presencia */}
              <div style={{ background: GLASS, backdropFilter: "blur(8px)", border: `1px solid ${RULE_DARK}`, borderRadius: 14, padding: "18px 20px", width: 240 }}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: LAMP, margin: "0 0 12px" }}>
                  {presentes.length} estudiando ahora
                </p>
                {presentes.length === 0 ? (
                  <p style={{ fontSize: 12.5, color: INK_SOFT_LIGHT, margin: 0, fontStyle: "italic" }}>Eres el primero — igual cuenta.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 160, overflowY: "auto" }}>
                    {presentes.map((p, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: "50%", background: LAMP_SOFT, color: "#0B1526",
                          fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          boxShadow: `0 0 8px ${LAMP}88`,
                        }}>
                          {p.displayName.trim().charAt(0).toUpperCase() || "?"}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{p.displayName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <footer style={{ padding: "16px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 11.5, color: INK_SOFT_LIGHT, margin: 0, textShadow: "0 1px 4px rgba(0,0,0,.5)" }}>Barkley Online · The Barkley Online School</p>
        </footer>
      </div>
    </div>
  );
}
