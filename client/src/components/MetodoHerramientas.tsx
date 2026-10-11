import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

type Herramienta = {
  id: "vortice" | "umbral" | "brujula" | "together";
  name: string;
  role: string;
  text: string;
  color: string;
  href: string;
};

const INK = "#10231f";
const SANS = "'Poppins', system-ui, sans-serif";

function useLoop() {
  const reduce = useReducedMotion();
  return (duration: number, delay = 0) =>
    reduce ? { duration: 0 } : { duration, delay, repeat: Infinity, ease: "easeInOut" as const };
}

/* ───────────── Vórtice: tu lugar para aprender ───────────── */
function EscenaVortice({ color }: { color: string }) {
  const loop = useLoop();
  const reduce = useReducedMotion();
  return (
    <g>
      {[150, 118, 86].map((r, i) => (
        <motion.ellipse key={r} cx="260" cy="195" rx={r + 60} ry={r * 0.62} fill="none" stroke={color} strokeOpacity={0.35 - i * 0.07} strokeWidth="1.6" strokeDasharray="4 9"
          style={{ transformOrigin: "260px 195px" }}
          animate={reduce ? undefined : { rotate: i % 2 ? -360 : 360 }}
          transition={reduce ? undefined : { duration: 40 + i * 14, repeat: Infinity, ease: "linear" }} />
      ))}
      {[[110, 150], [412, 120], [400, 290], [120, 300]].map(([x, y], i) => (
        <motion.circle key={i} cx={x} cy={y} r="6" fill={color} animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.5, 1] }} transition={loop(2.8, i * 0.5)} style={{ transformOrigin: `${x}px ${y}px` }} />
      ))}

      <rect x="132" y="108" width="256" height="190" rx="14" fill="#fff" />
      <path d="M132 122a14 14 0 0 1 14-14h228a14 14 0 0 1 14 14v18H132z" fill="#16352f" />
      <circle cx="150" cy="124" r="3.4" fill="#f5bf52" /><circle cx="162" cy="124" r="3.4" fill="#e76e83" /><circle cx="174" cy="124" r="3.4" fill="#3ec9a0" />
      <rect x="146" y="152" width="62" height="132" rx="8" fill="#eef4fb" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="154" y={162 + i * 28} width="10" height="10" rx="3" fill={i === 1 ? color : "#c9d6e6"} />
          <rect x="170" y={164 + i * 28} width={i === 1 ? 28 : 24} height="6" rx="3" fill={i === 1 ? color : "#c9d6e6"} />
        </g>
      ))}
      <rect x="220" y="152" width="154" height="84" rx="9" fill="#17335c" />
      <motion.circle cx="297" cy="194" r="19" fill={color} fillOpacity="0.28" animate={{ scale: [1, 1.45, 1], opacity: [0.7, 0, 0.7] }} transition={loop(2.4)} style={{ transformOrigin: "297px 194px" }} />
      <circle cx="297" cy="194" r="17" fill="#fff" />
      <path d="M292 185l16 9-16 9z" fill={color} />
      <rect x="232" y="224" width="130" height="5" rx="2.5" fill="#fff" fillOpacity="0.25" />
      <motion.rect x="232" y="224" width="18" height="5" rx="2.5" fill={color} animate={{ width: [18, 92, 18] }} transition={loop(7)} />
      <rect x="220" y="248" width="98" height="9" rx="4.5" fill="#d9e3ef" />
      <rect x="220" y="264" width="70" height="9" rx="4.5" fill="#e8eef6" />
      <rect x="330" y="248" width="44" height="25" rx="7" fill={color} />
      <path d="M345 260.5h14m-5-5 5 5-5 5" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      <motion.g animate={{ y: [0, -9, 0] }} transition={loop(4.2)}>
        <rect x="360" y="70" width="112" height="44" rx="12" fill="#fff" />
        <circle cx="381" cy="92" r="11" fill={color} fillOpacity="0.18" />
        <path d="M375.5 92.5l4 4 7-8" stroke={color} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="398" y="83" width="56" height="6" rx="3" fill="#16352f" />
        <rect x="398" y="95" width="38" height="5" rx="2.5" fill="#b6c4cf" />
      </motion.g>
      <motion.g animate={{ y: [0, 8, 0] }} transition={loop(5, 0.8)}>
        <rect x="52" y="260" width="104" height="42" rx="12" fill="#fff" />
        <circle cx="72" cy="281" r="10" fill="none" stroke="#e1e9f1" strokeWidth="4" />
        <motion.circle cx="72" cy="281" r="10" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={0.35} style={{ rotate: -90, transformOrigin: "72px 281px" }} />
        <rect x="90" y="270" width="52" height="6" rx="3" fill="#16352f" />
        <rect x="90" y="283" width="34" height="5" rx="2.5" fill="#b6c4cf" />
      </motion.g>
    </g>
  );
}

/* ───────────── Umbral: entender antes de seguir ───────────── */
function EscenaUmbral({ color }: { color: string }) {
  const loop = useLoop();
  const reduce = useReducedMotion();
  const ciclo = reduce ? { duration: 0 } : { duration: 6, repeat: Infinity, ease: "easeInOut" as const, times: [0, 0.5, 0.62, 0.9, 1] };
  return (
    <g>
      <path d="M92 270 A112 112 0 0 1 316 270" fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="22" strokeLinecap="round" />
      <motion.path d="M92 270 A112 112 0 0 1 316 270" fill="none" stroke={color} strokeWidth="22" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={reduce ? { pathLength: 0.72 } : { pathLength: [0, 0.72, 0.72, 0.72, 0] }} transition={ciclo} />
      <path d="M310.5 227.3l22-11" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 6" />
      <rect x="330" y="198" width="62" height="24" rx="12" fill="#fff" />
      <text x="361" y="214" textAnchor="middle" fontFamily={SANS} fontSize="13" fontWeight="700" fill={INK}>70%</text>
      <motion.text x="204" y="262" textAnchor="middle" fontFamily={SANS} fontSize="46" fontWeight="700" fill="#fff"
        animate={reduce ? undefined : { opacity: [0.55, 1, 1, 1, 0.55] }} transition={ciclo}>72%</motion.text>
      <text x="204" y="288" textAnchor="middle" fontFamily={SANS} fontSize="13" fontWeight="600" fill="#fff" fillOpacity="0.65">Practica hasta sentirte seguro</text>

      <g>
        <rect x="372" y="256" width="86" height="64" rx="14" fill="#fff" fillOpacity="0.08" stroke="#fff" strokeOpacity="0.18" />
        <motion.rect x="372" y="256" width="86" height="64" rx="14" fill={color} animate={reduce ? { opacity: 1 } : { opacity: [0, 0, 1, 1, 0] }} transition={ciclo} />
        <motion.path d="M393 270v-9a14 14 0 0 1 28 0v9" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round"
          animate={reduce ? { y: -8, rotate: -25 } : { y: [0, 0, -8, -8, 0], rotate: [0, 0, -25, -25, 0] }} transition={ciclo} style={{ transformOrigin: "393px 270px", transformBox: "fill-box" }} />
        <rect x="389" y="272" width="36" height="28" rx="7" fill="#fff" />
        <circle cx="407" cy="283" r="3.6" fill={INK} />
        <rect x="405.5" y="283" width="3" height="9" rx="1.5" fill={INK} />
      </g>
      <text x="415" y="344" textAnchor="middle" fontFamily={SANS} fontSize="12.5" fontWeight="700" fill="#fff" fillOpacity="0.8">Unidad siguiente</text>

      <g>
        <rect x="52" y="70" width="170" height="52" rx="13" fill="#fff" />
        <circle cx="80" cy="96" r="13" fill="#3ec9a0" />
        <path d="M73.5 96.5l4.5 4.5 8-9.5" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="102" y="86" width="86" height="8" rx="4" fill={INK} />
        <rect x="102" y="101" width="58" height="6" rx="3" fill="#b6c4cf" />
      </g>
      <motion.g animate={{ y: [0, -6, 0] }} transition={loop(4)}>
        <rect x="248" y="70" width="170" height="52" rx="13" fill="#fff" />
        <circle cx="276" cy="96" r="13" fill={color} />
        <text x="276" y="101" textAnchor="middle" fontFamily={SANS} fontSize="13" fontWeight="700" fill="#fff">2</text>
        <rect x="298" y="86" width="84" height="8" rx="4" fill={INK} />
        <rect x="298" y="101" width="50" height="6" rx="3" fill="#b6c4cf" />
      </motion.g>
      <path d="M222 96h26" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="3 5" />
    </g>
  );
}

/* ───────────── Brújula: un plan que se mueve contigo ───────────── */
function EscenaBrujula({ color }: { color: string }) {
  const loop = useLoop();
  const reduce = useReducedMotion();
  const dias = ["L", "M", "X", "J", "V"];
  return (
    <g>
      <circle cx="260" cy="150" r="112" fill="#fff" fillOpacity="0.05" stroke="#fff" strokeOpacity="0.22" strokeWidth="2" />
      <circle cx="260" cy="150" r="92" fill="none" stroke={color} strokeOpacity="0.5" strokeWidth="1.6" strokeDasharray="2 7" />
      {Array.from({ length: 36 }).map((_, i) => {
        const a = (i * 10 * Math.PI) / 180;
        const r1 = i % 9 === 0 ? 96 : 102;
        return <line key={i} x1={260 + Math.sin(a) * r1} y1={150 - Math.cos(a) * r1} x2={260 + Math.sin(a) * 108} y2={150 - Math.cos(a) * 108} stroke="#fff" strokeOpacity={i % 9 === 0 ? 0.8 : 0.35} strokeWidth={i % 9 === 0 ? 2.4 : 1.4} />;
      })}
      {[["N", 260, 74], ["E", 336, 155], ["S", 260, 236], ["O", 184, 155]].map(([t, x, y]) => (
        <text key={t as string} x={x as number} y={y as number} textAnchor="middle" fontFamily={SANS} fontSize="14" fontWeight="700" fill="#fff" fillOpacity="0.85">{t}</text>
      ))}
      <motion.g style={{ transformOrigin: "260px 150px" }} animate={reduce ? { rotate: 24 } : { rotate: [-28, 38, 8, 24, -28] }} transition={reduce ? { duration: 0 } : { duration: 9, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M260 82l13 68h-26z" fill={color} />
        <path d="M260 218l-13-68h26z" fill="#fff" fillOpacity="0.85" />
      </motion.g>
      <circle cx="260" cy="150" r="9" fill="#fff" />
      <circle cx="260" cy="150" r="4" fill={color} />

      <g>
        <rect x="70" y="288" width="380" height="70" rx="16" fill="#fff" />
        {dias.map((d, i) => (
          <g key={d}>
            <rect x={84 + i * 72} y="298" width="62" height="50" rx="11" fill={i === 2 ? `${color}22` : "#f1f6f4"} />
            <text x={115 + i * 72} y="316" textAnchor="middle" fontFamily={SANS} fontSize="11.5" fontWeight="700" fill="#60766f">{d}</text>
          </g>
        ))}
        {[0, 1, 3, 4].map((i) => (
          <rect key={i} x={94 + i * 72} y="326" width="42" height="9" rx="4.5" fill="#c8d7d1" />
        ))}
        <motion.rect y="326" width="42" height="9" rx="4.5" fill={color}
          initial={{ x: 94 + 2 * 72 }} animate={reduce ? { x: 94 + 2 * 72 } : { x: [94 + 2 * 72, 94 + 2 * 72, 94 + 3 * 72 + 0, 94 + 3 * 72, 94 + 2 * 72] }}
          transition={reduce ? { duration: 0 } : { duration: 7, repeat: Infinity, ease: "easeInOut", times: [0, 0.3, 0.45, 0.85, 1] }} />
      </g>
      <motion.g animate={{ y: [0, -7, 0] }} transition={loop(4)}>
        <rect x="372" y="62" width="110" height="42" rx="12" fill="#fff" />
        <path d="M391 83h13m-5-5 5 5-5 5" stroke={color} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="412" y="75" width="54" height="6" rx="3" fill={INK} />
        <rect x="412" y="87" width="36" height="5" rx="2.5" fill="#b6c4cf" />
      </motion.g>
    </g>
  );
}

/* ───────────── Together: estudiar en compañía ───────────── */
function EscenaTogether({ color }: { color: string }) {
  const loop = useLoop();
  const personas = [
    { x: 110, y: 205, piel: "#f2c9a8", ropa: "#3978d4" },
    { x: 215, y: 170, piel: "#d9a67e", ropa: "#edaa2f" },
    { x: 305, y: 170, piel: "#f5d3b5", ropa: "#299d72" },
    { x: 410, y: 205, piel: "#c58f68", ropa: "#7a5fd0" },
  ];
  return (
    <g>
      <motion.circle cx="260" cy="190" r="150" fill={color} fillOpacity="0.1" animate={{ scale: [1, 1.07, 1] }} transition={loop(6)} style={{ transformOrigin: "260px 190px" }} />
      <circle cx="260" cy="190" r="104" fill={color} fillOpacity="0.12" />
      <ellipse cx="260" cy="292" rx="196" ry="42" fill="#fff" fillOpacity="0.08" />
      <path d="M64 292h392" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" />

      {personas.map((p, i) => (
        <motion.g key={i} animate={{ y: [0, -4, 0] }} transition={loop(3.6, i * 0.5)}>
          <path d={`M${p.x - 40} ${p.y + 118}c0-34 18-52 40-52s40 18 40 52z`} fill={p.ropa} />
          <circle cx={p.x} cy={p.y + 28} r="23" fill={p.piel} />
          <path d={`M${p.x - 25} ${p.y + 24}c2-22 20-30 36-24 10 4 14 12 14 24-12-10-30-12-50 0z`} fill="#2b2f45" />
          <path d={`M${p.x - 9} ${p.y + 36}q9 6 18 0`} stroke="#8a4f3b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <circle cx={p.x - 8} cy={p.y + 29} r="1.8" fill="#2b2f45" /><circle cx={p.x + 8} cy={p.y + 29} r="1.8" fill="#2b2f45" />
          <rect x={p.x - 34} y={p.y + 96} width="68" height="14" rx="5" fill="#fff" />
          <rect x={p.x - 28} y={p.y + 102} width="56" height="3" rx="1.5" fill="#d3dfdc" />
          <motion.circle cx={p.x + 36} cy={p.y + 10} r="5" fill="#3ec9a0" animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }} transition={loop(2.4, i * 0.6)} style={{ transformOrigin: `${p.x + 36}px ${p.y + 10}px` }} />
        </motion.g>
      ))}

      <g>
        <rect x="134" y="58" width="124" height="38" rx="19" fill="#fff" />
        <g transform="translate(158 77)">
          <rect x="-7" y="-6" width="14" height="12" rx="3" fill="none" stroke={INK} strokeWidth="2.2" />
          <path d="M7 -2l6-3v10l-6-3" fill="none" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M-11 9L13 -9" stroke="#e76e83" strokeWidth="2.8" strokeLinecap="round" />
        </g>
        <text x="214" y="82" textAnchor="middle" fontFamily={SANS} fontSize="12.5" fontWeight="700" fill={INK}>Sin cámara</text>
        <rect x="270" y="58" width="116" height="38" rx="19" fill="#fff" />
        <g transform="translate(294 77)">
          <path d="M-9 -7h18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4h-5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" fill="none" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M-11 9L11 -9" stroke="#e76e83" strokeWidth="2.8" strokeLinecap="round" />
        </g>
        <text x="345" y="82" textAnchor="middle" fontFamily={SANS} fontSize="12.5" fontWeight="700" fill={INK}>Sin chat</text>
      </g>
    </g>
  );
}

const ESCENAS = { vortice: EscenaVortice, umbral: EscenaUmbral, brujula: EscenaBrujula, together: EscenaTogether };

function Escenario({ h }: { h: Herramienta }) {
  const Escena = ESCENAS[h.id];
  return (
    <svg viewBox="0 0 520 390" role="img" aria-label={`Ilustración de ${h.name}`} style={{ width: "100%", height: "100%", display: "block" }}>
      <Escena color={h.color} />
    </svg>
  );
}

export function MetodoHerramientas({ herramientas }: { herramientas: Herramienta[] }): ReactNode {
  const reduce = useReducedMotion();
  const [activa, setActiva] = useState(0);
  const [pausa, setPausa] = useState(false);

  useEffect(() => {
    if (pausa || reduce) return;
    const t = setInterval(() => setActiva((a) => (a + 1) % herramientas.length), 7000);
    return () => clearInterval(t);
  }, [pausa, reduce, herramientas.length]);

  const h = herramientas[activa];

  return (
    <div onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)} onFocusCapture={() => setPausa(true)} onBlurCapture={() => setPausa(false)}
      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: "clamp(20px,3vw,36px)", alignItems: "center" }}>
      <div style={{ position: "relative", order: 2, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }} role="tablist" aria-label="Herramientas Barkley">
        {herramientas.map((x, i) => {
          const on = i === activa;
          return (
            <motion.div key={x.id} layout={!reduce}
              style={{ position: "relative", background: on ? "#fff" : "rgba(255,255,255,.55)", border: `1px solid ${on ? x.color : "#d6e5dd"}`, borderRadius: 14, overflow: "hidden", boxShadow: on ? "0 14px 36px rgba(16,35,31,.10)" : "none", transition: "background .25s, box-shadow .25s, border-color .25s" }}>
              <button type="button" role="tab" aria-selected={on} aria-controls="escenario-herramienta" onClick={() => setActiva(i)}
                style={{ all: "unset", boxSizing: "border-box", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "16px 20px" }}>
                <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 99, background: x.color, boxShadow: on ? `0 0 0 6px ${x.color}26` : "none", transition: "box-shadow .25s", flexShrink: 0 }} />
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 24, lineHeight: 1.1, color: INK }}>{x.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: on ? x.color : "#60766f" }}>{x.role}</span>
                </span>
              </button>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduce ? undefined : { height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: "hidden" }}>
                    <div style={{ padding: "0 20px 20px 46px" }}>
                      <p style={{ margin: "0 0 14px", color: "#405951", fontSize: 15.5, lineHeight: 1.65 }}>{x.text}</p>
                      <a href={x.href} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: INK, fontSize: 13.5, fontWeight: 700, textDecoration: "none", borderBottom: `2px solid ${x.color}`, paddingBottom: 2 }}>
                        Conocer más <ArrowUpRight aria-hidden="true" style={{ width: 15, height: 15 }} />
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {on && !pausa && !reduce && (
                <motion.span key={`${activa}-barra`} aria-hidden="true" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 7, ease: "linear" }}
                  style={{ position: "absolute", left: 0, bottom: 0, height: 3, width: "100%", background: x.color, transformOrigin: "left" }} />
              )}
            </motion.div>
          );
        })}
      </div>

      <div id="escenario-herramienta" role="tabpanel" style={{ order: 1, position: "relative", width: "100%", minWidth: 0, aspectRatio: "4 / 3", borderRadius: 22, overflow: "hidden", background: `radial-gradient(120% 90% at 50% 0%, ${h.color}55 0%, transparent 62%), linear-gradient(160deg, #15332d, ${INK})`, transition: "background .5s" }}>
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,.12) 1px, transparent 1px)", backgroundSize: "22px 22px", opacity: 0.6 }} />
        <AnimatePresence mode="wait">
          <motion.div key={h.id} initial={reduce ? false : { opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, scale: 1.03 }} transition={{ duration: 0.4 }} style={{ position: "absolute", inset: 0, padding: "clamp(8px,2vw,18px)" }}>
            <Escenario h={h} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
