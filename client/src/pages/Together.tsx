/**
 * Together — sala de estudio en silencio (body doubling). Sin video, sin
 * chat: un timer Pomodoro compartido y una lista de quién más está
 * estudiando ahora. La compañía es la lista, no la conversación —
 * exactamente el mecanismo detrás de "body doubling" para TDAH: la sola
 * presencia de otro ayuda a empezar y sostener la tarea, sin interacción.
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
import { useEffect, useRef, useState } from "react";
import { Users, Play, Pause, RotateCcw } from "lucide-react";

const PAPER = "#FBF6EC";
const PAPER_DEEP = "#F2E9D8";
const INK = "#152A42";
const INK_SOFT = "#5A6B7E";
const GOLD = "#E0A02E";
const RED = "#C8402F";
const RULE = "#DCCFB8";

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

export default function Together() {
  useEffect(() => {
    document.title = "Together — Sala de estudio en silencio | Barkley";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Estudia acompañado sin clases en vivo. Timer compartido y presencia real de otros estudiantes — el mismo principio de body doubling que ayuda a sostener el foco en TDAH.");
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

  const emailValido = /^[^\s@]+@gmail\.com$/i.test(email.trim());
  const puedeUnirse = nombre.trim().length > 0 && emailValido;

  const [enFoco, setEnFoco] = useState(true);
  const [segundos, setSegundos] = useState(FOCUS_MIN * 60);
  const [corriendo, setCorriendo] = useState(false);

  const clientIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
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

  // Heartbeat + presencia, solo mientras "unido"
  useEffect(() => {
    if (!unido) return;
    const clientId = getClientId();
    clientIdRef.current = clientId;

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

  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");

  return (
    <div style={{ background: PAPER, color: INK, fontFamily: BODY, fontSize: 16, lineHeight: 1.75, minHeight: "100vh" }}>
      <header style={{ padding: "20px 24px", borderBottom: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, background: INK, borderRadius: 5, color: PAPER, fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY }}>BK</div>
            <span style={{ fontWeight: 500, color: INK, fontSize: 14, lineHeight: 1.25 }}>The Barkley<br />Online School</span>
          </a>
          <a href="/#inscripcion" style={{ background: RED, color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 14, padding: "10px 22px", borderRadius: 999 }}>Inscribirse</a>
        </div>
      </header>

      <section style={{ padding: "clamp(48px,8vw,88px) 24px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: RED, margin: "0 0 14px" }}>
            Together™ · sala de estudio en silencio
          </p>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(30px,5vw,46px)", fontWeight: 500, color: INK, margin: "0 0 16px", lineHeight: 1.15, fontVariationSettings: "'SOFT' 30" }}>
            Aunque estudies solo, no estás solo
          </h1>
          <p style={{ fontSize: 16, color: INK_SOFT, maxWidth: 560, margin: "0 auto" }}>
            Sin cámara, sin chat, sin clase. Solo un timer compartido y la certeza de que hay
            otros estudiando al mismo tiempo que tú — el mismo efecto que estudiar en una
            biblioteca, sin salir de tu pieza.
          </p>
        </div>
      </section>

      <section style={{ padding: "0 24px clamp(56px,9vw,96px)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {!unido ? (
            <div style={{ background: PAPER_DEEP, borderRadius: 14, padding: "clamp(28px,5vw,40px)", border: `1px solid ${RULE}` }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: INK, margin: "0 0 16px" }}>Únete a la sala</p>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre o apodo"
                maxLength={40}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${RULE}`, fontFamily: BODY, fontSize: 15, marginBottom: 10, background: PAPER, color: INK }}
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.correo@gmail.com"
                type="email"
                maxLength={80}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${email.length > 0 && !emailValido ? RED : RULE}`, fontFamily: BODY, fontSize: 15, marginBottom: 6, background: PAPER, color: INK }}
              />
              <p style={{ fontSize: 12.5, color: email.length > 0 && !emailValido ? RED : INK_SOFT, margin: "0 0 10px" }}>
                {email.length > 0 && !emailValido ? "Debe ser un correo @gmail.com" : "Solo para entrar a la sala — no se comparte con nadie más."}
              </p>
              <input
                value={materia}
                onChange={(e) => setMateria(e.target.value)}
                placeholder="¿Qué vas a estudiar? (opcional)"
                maxLength={60}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${RULE}`, fontFamily: BODY, fontSize: 15, marginBottom: 18, background: PAPER, color: INK }}
              />
              <button
                onClick={() => puedeUnirse && setUnido(true)}
                disabled={!puedeUnirse}
                style={{
                  width: "100%", background: puedeUnirse ? RED : RULE, color: "#fff", border: "none",
                  borderRadius: 999, padding: "13px 20px", fontSize: 15, fontWeight: 700,
                  cursor: puedeUnirse ? "pointer" : "not-allowed",
                }}
              >
                Entrar a la sala
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Timer */}
              <div style={{ background: INK, borderRadius: 14, padding: "clamp(32px,6vw,48px)", textAlign: "center" }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: enFoco ? GOLD : "#9FD8B4", margin: "0 0 10px" }}>
                  {enFoco ? "Bloque de foco" : "Pausa"}
                </p>
                <p style={{ fontFamily: DISPLAY, fontSize: "clamp(56px,12vw,88px)", fontWeight: 500, color: PAPER, margin: 0, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {mm}:{ss}
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22 }}>
                  <button
                    onClick={() => setCorriendo((c) => !c)}
                    style={{ display: "flex", alignItems: "center", gap: 8, background: GOLD, color: INK, border: "none", borderRadius: 999, padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                  >
                    {corriendo ? <Pause style={{ width: 15, height: 15 }} /> : <Play style={{ width: 15, height: 15 }} />}
                    {corriendo ? "Pausar" : "Empezar"}
                  </button>
                  <button
                    onClick={() => { setCorriendo(false); setEnFoco(true); setSegundos(FOCUS_MIN * 60); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", color: PAPER, border: "1.5px solid rgba(251,246,236,.3)", borderRadius: 999, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                  >
                    <RotateCcw style={{ width: 14, height: 14 }} />
                    Reiniciar
                  </button>
                </div>
              </div>

              {/* Presencia */}
              <div style={{ background: PAPER_DEEP, borderRadius: 14, padding: "24px 26px", border: `1px solid ${RULE}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Users style={{ width: 16, height: 16, color: GOLD }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: INK, margin: 0 }}>
                    {presentes.length} estudiando ahora
                  </p>
                </div>
                {presentes.length === 0 ? (
                  <p style={{ fontSize: 13.5, color: INK_SOFT, margin: 0 }}>Eres el primero en esta sala — igual cuenta.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {presentes.map((p, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0", borderBottom: i < presentes.length - 1 ? `1px solid ${RULE}` : "none" }}>
                        <span style={{ fontWeight: 600, color: INK }}>{p.displayName}</span>
                        {p.subject && <span style={{ color: INK_SOFT }}>{p.subject}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <footer style={{ padding: "24px", textAlign: "center", borderTop: `1px solid ${RULE}` }}>
        <p style={{ fontSize: 12.5, color: INK_SOFT, margin: 0 }}>Barkley Online · The Barkley Online School</p>
      </footer>
    </div>
  );
}
