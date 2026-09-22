/**
 * Together — sala de estudio en silencio (body doubling). No es un
 * formulario con un timer al lado: es una escena nocturna de estudio —
 * lámpara cálida, estantería, polvo flotando en la luz — con el cronómetro
 * como anillo de progreso al centro y la presencia de otros como luces
 * suaves alrededor. Música lofi real (YouTube, embed estándar) de fondo,
 * opcional. El punto no es la lista de nombres: es la sensación de cuarto
 * compartido, silencioso, sin cámara ni chat.
 *
 * Correo @gmail.com obligatorio para entrar (sin contraseña, no es login):
 * es la captación de lead de la campaña hasta marzo 2027. El clientId sigue
 * siendo el único identificador anónimo en localStorage frente al servidor.
 *
 * Nivel 1 del prototipo: heartbeat cada 15s a /api/together/heartbeat,
 * presencia leída cada 5s desde /api/together/presence. Sin websockets,
 * sin infraestructura nueva — corre sobre la misma DB Turso del resto del
 * sitio.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Music, Music as MusicOff, ArrowLeft } from "lucide-react";

const NIGHT_TOP = "#0B1526";
const NIGHT_BOTTOM = "#152A42";
const LAMP = "#F2B84B";
const LAMP_SOFT = "#E0A02E";
const PAPER = "#FBF6EC";
const INK_SOFT_LIGHT = "rgba(251,246,236,.62)";
const RED = "#C8402F";
const SAGE = "#7FCB9E";
const RULE_DARK = "rgba(251,246,236,.14)";

const DISPLAY = "'Fraunces', Georgia, serif";
const BODY = "'Lexend', system-ui, sans-serif";

const FOCUS_MIN = 25;
const BREAK_MIN = 5;
const LOFI_VIDEO_ID = "X4VbdwhkE10"; // lofi hip hop radio 📚 — beats to relax/study to

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

/* Estantería de libros dibujada en CSS — lomos de distinto ancho y alto,
   paleta muda para no competir con la lámpara. Puramente decorativa. */
function Estanteria() {
  const lomos = useMemo(() => {
    const colores = ["#3A5068", "#4A3B4E", "#5A4632", "#2E4A44", "#4E3630", "#354A5E"];
    return Array.from({ length: 22 }, (_, i) => ({
      w: 10 + ((i * 7) % 18),
      h: 60 + ((i * 13) % 40),
      c: colores[i % colores.length],
    }));
  }, []);
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, display: "flex", alignItems: "flex-end", gap: 3, padding: "0 24px", opacity: 0.55, pointerEvents: "none" }}>
      {lomos.map((l, i) => (
        <div key={i} style={{ width: l.w, height: l.h, background: l.c, borderRadius: "2px 2px 0 0", flexShrink: 0 }} />
      ))}
    </div>
  );
}

/* Polvo flotando en la luz de la lámpara — unos pocos puntos, no una lluvia. */
function Polvo() {
  const motas = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({
      left: 30 + Math.random() * 40,
      delay: Math.random() * 8,
      duration: 7 + Math.random() * 6,
      size: 2 + Math.random() * 2,
    })),
    []
  );
  return (
    <>
      <style>{`
        @keyframes together-float {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: .55; }
          90%  { opacity: .3; }
          100% { transform: translateY(-160px) translateX(14px); opacity: 0; }
        }
      `}</style>
      {motas.map((m, i) => (
        <div
          key={i}
          style={{
            position: "absolute", bottom: "30%", left: `${m.left}%`, width: m.size, height: m.size,
            borderRadius: "50%", background: LAMP, pointerEvents: "none",
            animation: `together-float ${m.duration}s ease-in ${m.delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}

function Anillo({ segundos, total, enFoco }: { segundos: number; total: number; enFoco: boolean }) {
  const r = 92;
  const c = 2 * Math.PI * r;
  const pct = 1 - segundos / total;
  const color = enFoco ? LAMP : SAGE;
  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");
  return (
    <svg width={220} height={220} viewBox="0 0 220 220" style={{ filter: `drop-shadow(0 0 24px ${color}55)` }}>
      <circle cx={110} cy={110} r={r} fill="none" stroke="rgba(251,246,236,.1)" strokeWidth={8} />
      <circle
        cx={110} cy={110} r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 110 110)"
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
      <text x="110" y="102" textAnchor="middle" fontFamily={DISPLAY} fontSize={40} fontWeight={500} fill={PAPER}>{mm}:{ss}</text>
      <text x="110" y="128" textAnchor="middle" fontFamily={BODY} fontSize={11} letterSpacing="2" fill={color} style={{ textTransform: "uppercase" }}>
        {enFoco ? "Foco" : "Pausa"}
      </text>
    </svg>
  );
}

export default function Together() {
  useEffect(() => {
    document.title = "Together — Sala de estudio en silencio | Barkley";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Estudia acompañado sin clases en vivo. Escena nocturna, cronómetro y presencia real de otros estudiantes — el mismo principio de body doubling que ayuda a sostener el foco en TDAH.");
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

  const sceneStyle: React.CSSProperties = {
    position: "relative", minHeight: "100vh", overflow: "hidden",
    background: `radial-gradient(ellipse 800px 500px at 50% 30%, ${LAMP}22 0%, transparent 60%), linear-gradient(180deg, ${NIGHT_TOP} 0%, ${NIGHT_BOTTOM} 100%)`,
    color: PAPER, fontFamily: BODY,
  };

  return (
    <div style={sceneStyle}>
      {/* Ambiente lofi real, opcional — visual + audio, apagado por defecto */}
      {musica && (
        <iframe
          title="Música ambiental — lofi"
          src={`https://www.youtube-nocookie.com/embed/${LOFI_VIDEO_ID}?autoplay=1&controls=0&modestbranding=1`}
          allow="autoplay"
          style={{
            position: "fixed", inset: 0, width: "100%", height: "100%", border: "none",
            opacity: 0.14, filter: "blur(2px)", pointerEvents: "none", zIndex: 0,
          }}
        />
      )}

      <Polvo />
      <Estanteria />

      <div style={{ position: "relative", zIndex: 2, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header style={{ padding: "20px 24px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
              <div style={{ width: 40, height: 40, background: PAPER, borderRadius: 5, color: NIGHT_TOP, fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY }}>BK</div>
              <span style={{ fontWeight: 500, color: PAPER, fontSize: 14, lineHeight: 1.25 }}>The Barkley<br />Online School</span>
            </a>
            <button
              onClick={() => setMusica((m) => !m)}
              style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(251,246,236,.08)", color: PAPER, border: `1px solid ${RULE_DARK}`, borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              {musica ? <MusicOff style={{ width: 14, height: 14 }} /> : <Music style={{ width: 14, height: 14 }} />}
              {musica ? "Música: on" : "Música ambiental"}
            </button>
          </div>
        </header>

        {!unido ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <div style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: LAMP, margin: "0 0 14px" }}>
                Together™ · sala de estudio en silencio
              </p>
              <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px,5vw,40px)", fontWeight: 500, margin: "0 0 14px", lineHeight: 1.15, fontVariationSettings: "'SOFT' 30" }}>
                Aunque estudies solo,<br />no estás solo
              </h1>
              <p style={{ fontSize: 14.5, color: INK_SOFT_LIGHT, margin: "0 0 30px", lineHeight: 1.7 }}>
                Sin cámara, sin chat, sin clase. Un cuarto compartido en silencio —
                el mismo efecto de estudiar en la biblioteca, sin salir de tu pieza.
              </p>

              <div style={{ background: "rgba(251,246,236,.06)", borderRadius: 16, padding: "clamp(24px,5vw,32px)", border: `1px solid ${RULE_DARK}`, textAlign: "left", backdropFilter: "blur(6px)" }}>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre o apodo"
                  maxLength={40}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${RULE_DARK}`, fontFamily: BODY, fontSize: 15, marginBottom: 10, background: "rgba(0,0,0,.2)", color: PAPER }}
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@gmail.com"
                  type="email"
                  maxLength={80}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${email.length > 0 && !emailValido ? RED : RULE_DARK}`, fontFamily: BODY, fontSize: 15, marginBottom: 6, background: "rgba(0,0,0,.2)", color: PAPER }}
                />
                <p style={{ fontSize: 12, color: email.length > 0 && !emailValido ? "#FF8A73" : INK_SOFT_LIGHT, margin: "0 0 10px" }}>
                  {email.length > 0 && !emailValido ? "Debe ser un correo @gmail.com" : "Solo para entrar a la sala — no se comparte con nadie más."}
                </p>
                <input
                  value={materia}
                  onChange={(e) => setMateria(e.target.value)}
                  placeholder="¿Qué vas a estudiar? (opcional)"
                  maxLength={60}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${RULE_DARK}`, fontFamily: BODY, fontSize: 15, marginBottom: 18, background: "rgba(0,0,0,.2)", color: PAPER }}
                />
                <button
                  onClick={() => puedeUnirse && setUnido(true)}
                  disabled={!puedeUnirse}
                  style={{
                    width: "100%", background: puedeUnirse ? LAMP : "rgba(251,246,236,.15)", color: puedeUnirse ? NIGHT_TOP : INK_SOFT_LIGHT,
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
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", gap: 32 }}>
            <button
              onClick={() => setUnido(false)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: INK_SOFT_LIGHT, fontSize: 13, cursor: "pointer", position: "absolute", top: 90 }}
            >
              <ArrowLeft style={{ width: 14, height: 14 }} /> Salir de la sala
            </button>

            <Anillo segundos={segundos} total={totalActual} enFoco={enFoco} />

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setCorriendo((c) => !c)}
                style={{ display: "flex", alignItems: "center", gap: 8, background: LAMP, color: NIGHT_TOP, border: "none", borderRadius: 999, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                {corriendo ? <Pause style={{ width: 15, height: 15 }} /> : <Play style={{ width: 15, height: 15 }} />}
                {corriendo ? "Pausar" : "Empezar"}
              </button>
              <button
                onClick={() => { setCorriendo(false); setEnFoco(true); setSegundos(FOCUS_MIN * 60); }}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", color: PAPER, border: `1.5px solid ${RULE_DARK}`, borderRadius: 999, padding: "11px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                <RotateCcw style={{ width: 14, height: 14 }} />
                Reiniciar
              </button>
            </div>

            {/* Presencia — luces suaves, no una lista de formulario */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, maxWidth: 560 }}>
              <p style={{ fontSize: 12.5, letterSpacing: "0.1em", textTransform: "uppercase", color: INK_SOFT_LIGHT, margin: 0 }}>
                {presentes.length} {presentes.length === 1 ? "estudiando ahora" : "estudiando ahora contigo"}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {presentes.length === 0 ? (
                  <span style={{ fontSize: 13, color: INK_SOFT_LIGHT, fontStyle: "italic" }}>Eres el primero en esta sala — igual cuenta.</span>
                ) : (
                  presentes.map((p, i) => (
                    <div
                      key={i}
                      title={p.subject || p.displayName}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, background: "rgba(251,246,236,.07)",
                        border: `1px solid ${RULE_DARK}`, borderRadius: 999, padding: "7px 14px 7px 8px",
                      }}
                    >
                      <span style={{
                        width: 22, height: 22, borderRadius: "50%", background: LAMP_SOFT, color: NIGHT_TOP,
                        fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 0 10px ${LAMP}88`,
                      }}>
                        {p.displayName.trim().charAt(0).toUpperCase() || "?"}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{p.displayName}</span>
                      {p.subject && <span style={{ fontSize: 12, color: INK_SOFT_LIGHT }}>· {p.subject}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <footer style={{ padding: "20px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: INK_SOFT_LIGHT, margin: 0 }}>Barkley Online · The Barkley Online School</p>
        </footer>
      </div>
    </div>
  );
}
