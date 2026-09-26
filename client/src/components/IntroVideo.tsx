import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play } from "lucide-react";

const NAVY = "#003366";
const GOLD = "#FFC548";

const FORMATOS = {
  horizontal: { base: "/videos/intro-barkley-v3", poster: "/videos/intro-barkley-v3-poster.webp", ratio: "16 / 9" },
  vertical: { base: "/videos/intro-barkley-v3-vertical", poster: "/videos/intro-barkley-v3-vertical-poster.webp", ratio: "9 / 16" },
};

/**
 * Intro de 45 s. Se descarga recién cuando el módulo se acerca a la pantalla,
 * corre sin sonido mientras está visible y se pausa al salir. En celular usa
 * el corte 9:16. Con "reducir movimiento" activo no arranca sola.
 */
export function IntroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [movil, setMovil] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  const [cargado, setCargado] = useState(false);
  const [silencio, setSilencio] = useState(true);
  const [enPausa, setEnPausa] = useState(true);
  const yaConSonido = useRef(false);
  const enVista = useRef(false);
  const reducirMovimiento = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const f = movil ? FORMATOS.vertical : FORMATOS.horizontal;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const cambio = () => setMovil(mq.matches);
    mq.addEventListener("change", cambio);
    return () => mq.removeEventListener("change", cambio);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const cerca = new IntersectionObserver(([e]) => { if (e.isIntersecting) setCargado(true); }, { rootMargin: "400px 0px" });
    const visible = new IntersectionObserver(([e]) => {
      enVista.current = e.intersectionRatio >= 0.5;
      if (reducirMovimiento) return;
      if (enVista.current) v.play().catch(() => {});
      else v.pause();
    }, { threshold: [0, 0.5] });
    cerca.observe(v);
    visible.observe(v);
    return () => { cerca.disconnect(); visible.disconnect(); };
  }, [reducirMovimiento, movil]);

  const alternarSonido = () => {
    const v = ref.current;
    if (!v) return;
    if (!yaConSonido.current) {
      // La primera vez que activan el sonido, el video parte desde el inicio para escucharlo completo.
      yaConSonido.current = true;
      v.currentTime = 0;
    }
    v.muted = !v.muted;
    setSilencio(v.muted);
    v.play().catch(() => {});
  };

  // Las fuentes se agregan recién al acercarse: el navegador necesita load() para tomarlas.
  useEffect(() => { if (cargado) ref.current?.load(); }, [cargado, movil]);

  const reproducir = () => { setCargado(true); ref.current?.play().catch(() => {}); };

  return (
    <section id="intro-video" aria-label="Barkley en 45 segundos" style={{ background: "#000b1c", padding: movil ? "28px 16px 36px" : "56px 24px 64px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: "Barkley en 45 segundos: Vórtice, Umbral, Brújula y Together",
            description: "Colegio online de preparación para Exámenes Libres MINEDUC, de 1° básico a 4° medio. Cómo funcionan Vórtice, Umbral, Brújula y Together, diseñados para cada alumno. Admisión 2027.",
            thumbnailUrl: "https://www.barkleyinstituto.cl/videos/intro-barkley-v3-poster.webp",
            uploadDate: "2026-09-26T12:00:00-04:00",
            duration: "PT45S",
            contentUrl: "https://www.barkleyinstituto.cl/videos/intro-barkley-v3.mp4",
            embedUrl: "https://www.barkleyinstituto.cl/#intro-video",
          }),
        }}
      />
      <div style={{ maxWidth: movil ? 420 : 1180, margin: "0 auto" }}>
        <p style={{ margin: "0 0 16px", textAlign: "center", color: GOLD, fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Barkley en 45 segundos
        </p>
        <div style={{ position: "relative", aspectRatio: f.ratio, maxHeight: movil ? "80vh" : undefined, margin: "0 auto", borderRadius: movil ? 18 : 24, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.45)", background: NAVY }}>
          <video
            key={f.base}
            ref={ref}
            poster={f.poster}
            muted
            loop
            playsInline
            preload="none"
            onLoadedData={(e) => { if (enVista.current && !reducirMovimiento) e.currentTarget.play().catch(() => {}); }}
            onPlay={() => setEnPausa(false)}
            onPause={() => setEnPausa(true)}
            aria-label="Video de presentación de Barkley"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          >
            {cargado && <source src={`${f.base}.webm`} type="video/webm" />}
            {cargado && <source src={`${f.base}.mp4`} type="video/mp4" />}
          </video>
          {enPausa && reducirMovimiento && (
            <button type="button" onClick={reproducir} aria-label="Reproducir video"
              style={{ position: "absolute", inset: 0, margin: "auto", width: 84, height: 84, borderRadius: "50%", border: "none", background: GOLD, color: NAVY, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Play style={{ width: 34, height: 34, marginLeft: 4 }} fill={NAVY} />
            </button>
          )}
          <button type="button" onClick={alternarSonido} aria-label={silencio ? "Activar sonido" : "Silenciar"}
            style={{ position: "absolute", right: 14, bottom: 14, display: "flex", alignItems: "center", gap: 8, border: "none", borderRadius: 999, padding: "10px 16px", background: "rgba(0,11,28,.72)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(6px)" }}>
            {silencio ? <VolumeX style={{ width: 18, height: 18 }} /> : <Volume2 style={{ width: 18, height: 18 }} />}
            {silencio ? "Activar sonido" : "Silenciar"}
          </button>
        </div>
      </div>
    </section>
  );
}
