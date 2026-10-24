// Mascota del tutor virtual (SVG completo; reemplaza el recorte provisional del diseño).
export function RobotTutor({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 140" role="img" aria-label="Robot del tutor virtual">
      <defs>
        <linearGradient id="vx-rb-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe6ee" />
        </linearGradient>
        <radialGradient id="vx-rb-eye" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#d9fbff" />
          <stop offset="1" stopColor="#38c9e0" />
        </radialGradient>
      </defs>
      {/* sombra */}
      <ellipse cx="60" cy="132" rx="30" ry="5" fill="#1c2a3a" opacity=".08" />
      {/* antena */}
      <line x1="60" y1="20" x2="60" y2="10" stroke="#9fb1c2" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="8" r="5" fill="#6ec3d4" />
      {/* brazo que saluda */}
      <path d="M92 86 q14 -6 16 -24" fill="none" stroke="#c9d4df" strokeWidth="9" strokeLinecap="round" />
      <circle cx="108" cy="60" r="7" fill="#2b3a4a" />
      {/* brazo izquierdo */}
      <path d="M28 88 q-10 8 -10 22" fill="none" stroke="#c9d4df" strokeWidth="9" strokeLinecap="round" />
      <circle cx="18" cy="112" r="7" fill="#2b3a4a" />
      {/* cuerpo */}
      <rect x="30" y="76" width="60" height="50" rx="22" fill="url(#vx-rb-body)" stroke="#d3dce6" />
      {/* hoja en el pecho */}
      <path d="M60 112 c-10 -2 -12 -12 -6 -18 c6 2 8 10 6 18z" fill="#4f9d5c" />
      <path d="M60 112 c8 -3 10 -11 5 -16 c-5 2 -7 9 -5 16z" fill="#6cbf6f" />
      {/* cabeza */}
      <rect x="20" y="20" width="80" height="62" rx="30" fill="url(#vx-rb-body)" stroke="#d3dce6" />
      {/* orejas */}
      <rect x="12" y="40" width="12" height="24" rx="6" fill="#9fb1c2" />
      <rect x="96" y="40" width="12" height="24" rx="6" fill="#9fb1c2" />
      {/* visor */}
      <rect x="30" y="32" width="60" height="38" rx="19" fill="#13202e" />
      <ellipse cx="47" cy="49" rx="6" ry="8" fill="url(#vx-rb-eye)" />
      <ellipse cx="73" cy="49" rx="6" ry="8" fill="url(#vx-rb-eye)" />
      <path d="M52 61 q8 6 16 0" fill="none" stroke="#5fd6e8" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
