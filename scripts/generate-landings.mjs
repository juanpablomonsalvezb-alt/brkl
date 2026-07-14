/**
 * Genera las landings estáticas de exámenes libres por nivel
 * (client/public/examenes-libres-<slug>/index.html).
 *
 * Estáticas a propósito: el sitio es una SPA Vite (CSR) y una ruta client-side
 * heredaría el canonical/meta del home en el HTML inicial. Con HTML estático
 * cada landing tiene title, description, canonical y schema Course propios,
 * sin depender del render JS. Vercel sirve archivos del filesystem antes de
 * aplicar el rewrite SPA, así que no chocan con el router.
 *
 * Uso: node scripts/generate-landings.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://www.barkleyinstituto.cl";

const NIVELES = [
  {
    slug: "5-basico",
    nombre: "5° Básico",
    titleNivel: "Exámenes Libres 5° Básico",
    intro:
      "Quinto básico es la primera puerta de entrada a los exámenes libres: desde este nivel el MINEDUC permite validar estudios rindiendo una vez al año, sin asistir a un colegio presencial. En Barkley tu hijo o hija prepara todo el temario oficial a su ritmo, con video y pódcast en cada lección.",
    asignaturas: ["Lenguaje y Comunicación", "Matemática", "Ciencias Naturales", "Historia, Geografía y Cs. Sociales"],
    foco: "Es el año ideal para instalar hábitos de estudio autónomo: lecciones cortas, práctica inmediata y avance solo cuando el contenido está dominado.",
  },
  {
    slug: "6-basico",
    nombre: "6° Básico",
    titleNivel: "Exámenes Libres 6° Básico",
    intro:
      "Sexto básico cierra el primer ciclo de enseñanza básica. Con Barkley, tu hijo o hija prepara los exámenes libres del MINEDUC estudiando desde casa, sin horarios fijos ni clases en vivo, con un método donde solo se avanza al dominar cada unidad.",
    asignaturas: ["Lenguaje y Comunicación", "Matemática", "Ciencias Naturales", "Historia, Geografía y Cs. Sociales"],
    foco: "Reforzamos comprensión lectora y operatoria matemática — las dos bases que definen el éxito en los niveles siguientes.",
  },
  {
    slug: "7-basico",
    nombre: "7° Básico",
    titleNivel: "Exámenes Libres 7° Básico",
    intro:
      "Séptimo básico marca el salto a contenidos más abstractos. Nuestro modelo asincrónico permite dedicar más tiempo a lo difícil y pasar rápido lo ya dominado — algo imposible en una sala con 35 estudiantes al mismo ritmo.",
    asignaturas: ["Lengua y Literatura", "Matemática", "Ciencias Naturales", "Historia, Geografía y Cs. Sociales", "Inglés"],
    foco: "Álgebra inicial, método científico y análisis de fuentes históricas: los tres pilares nuevos de este nivel, cada uno con video, pódcast y práctica autocorregida.",
  },
  {
    slug: "8-basico",
    nombre: "8° Básico",
    titleNivel: "Exámenes Libres 8° Básico",
    intro:
      "Octavo básico es el cierre de la enseñanza básica y la antesala de la media. Con Barkley se prepara completo desde casa: cada lección con video y pódcast, evaluaciones por unidad y un asesor humano que monitorea el avance.",
    asignaturas: ["Lengua y Literatura", "Matemática", "Ciencias Naturales", "Historia, Geografía y Cs. Sociales", "Inglés"],
    foco: "Consolidamos las bases para la enseñanza media: ecuaciones, física y química introductorias, y escritura argumentativa.",
  },
  {
    slug: "1-medio",
    nombre: "1° Medio",
    titleNivel: "Exámenes Libres 1° Medio",
    intro:
      "Primero medio inaugura la enseñanza media y sube la exigencia. El Aprendizaje por Dominio de Barkley evita el problema clásico de este nivel: arrastrar vacíos de básica que explotan en las pruebas. Aquí nadie avanza sin dominar la unidad anterior.",
    asignaturas: ["Lengua y Literatura", "Matemática", "Biología, Física y Química", "Historia, Geografía y Cs. Sociales", "Inglés"],
    foco: "Las ciencias se separan en biología, física y química — cada una con su propia ruta de lecciones y evaluaciones.",
  },
  {
    slug: "2-medio",
    nombre: "2° Medio",
    titleNivel: "Exámenes Libres 2° Medio",
    intro:
      "Segundo medio completa la formación general común. Estudiando con Barkley, tu hijo o hija rinde los exámenes libres del MINEDUC con preparación estructurada: temario oficial completo, práctica autocorregida y tutoría cuando de verdad la necesita.",
    asignaturas: ["Lengua y Literatura", "Matemática", "Biología, Física y Química", "Historia, Geografía y Cs. Sociales", "Inglés"],
    foco: "Nivel clave para deportistas y artistas de alto rendimiento: la flexibilidad total permite compatibilizar entrenamiento o giras con el avance académico.",
  },
  {
    slug: "3-medio",
    nombre: "3° Medio",
    titleNivel: "Exámenes Libres 3° Medio",
    intro:
      "Tercero medio introduce el plan diferenciado y la mirada ya está puesta en el egreso. Con Barkley, la preparación de exámenes libres es compatible con trabajo, deporte de alto rendimiento o cualquier proyecto que haga imposible un colegio presencial.",
    asignaturas: ["Lengua y Literatura", "Matemática", "Ciencias (plan común)", "Educación Ciudadana", "Filosofía", "Inglés"],
    foco: "Incorporamos Educación Ciudadana y Filosofía, las asignaturas nuevas del currículum de 3° y 4° medio.",
  },
  {
    slug: "4-medio",
    nombre: "4° Medio",
    titleNivel: "Exámenes Libres 4° Medio",
    intro:
      "Cuarto medio es la meta: la licencia de enseñanza media. Rendir los exámenes libres de 4° medio con Barkley significa llegar a la fecha oficial con el temario completo dominado — y con la licencia, quedan abiertas la PAES y la educación superior.",
    asignaturas: ["Lengua y Literatura", "Matemática", "Ciencias (plan común)", "Educación Ciudadana", "Filosofía", "Inglés"],
    foco: "El nivel más buscado por adultos que retoman estudios y jóvenes que necesitan terminar su escolaridad por vía flexible. La licencia obtenida es la misma que entrega un colegio tradicional.",
  },
];

const NAVY = "#003366";
const GOLD = "#FFC548";
const RED = "#FF3D37";
const TEXT = "#525252";

function pageHtml(n) {
  const url = `${BASE}/examenes-libres-${n.slug}/`;
  const title = `${n.titleNivel} — Preparación online | Barkley Online`;
  const desc = `Prepara los exámenes libres MINEDUC de ${n.nombre} 100% online y a tu ritmo. Sin clases en vivo, con video y pódcast en cada lección. Validación oficial en Chile.`;

  const otros = NIVELES.filter((x) => x.slug !== n.slug)
    .map((x) => `<a href="/examenes-libres-${x.slug}/">${x.nombre}</a>`)
    .join("");

  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `Preparación Exámenes Libres ${n.nombre}`,
    description: desc,
    url,
    inLanguage: "es-CL",
    educationalLevel: n.nombre,
    teaches: n.asignaturas.join(", "),
    provider: {
      "@type": "EducationalOrganization",
      name: "Barkley Online",
      alternateName: "Instituto Barkley",
      url: `${BASE}/`,
      areaServed: { "@type": "Country", name: "Chile" },
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT8H",
    },
    offers: {
      "@type": "Offer",
      category: "Mensualidad",
      price: "65000",
      priceCurrency: "CLP",
    },
  };

  return `<!DOCTYPE html>
<html lang="es-CL">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="es_CL" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${BASE}/og-image.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Poppins', system-ui, sans-serif; color: ${TEXT}; background: #fff; line-height: 1.65; }
    a { color: inherit; }
    .nav { background: #fff; border-bottom: 1px solid #e8e8e8; padding: 14px 24px; }
    .nav-inner { max-width: 1080px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .brand-badge { width: 42px; height: 42px; background: ${NAVY}; border: 2px solid ${GOLD}; border-radius: 8px; color: #fff; font-weight: 800; font-size: 17px; display: flex; align-items: center; justify-content: center; }
    .brand-name { font-weight: 700; color: ${NAVY}; font-size: 15px; line-height: 1.2; }
    .nav-cta { background: ${RED}; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 10px 22px; border-radius: 999px; white-space: nowrap; }
    .hero { background: ${NAVY}; color: #fff; padding: 72px 24px 64px; }
    .hero-inner { max-width: 860px; margin: 0 auto; }
    .kicker { color: ${GOLD}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
    h1 { font-size: clamp(30px, 5.5vw, 50px); font-weight: 800; line-height: 1.15; margin-bottom: 18px; }
    h1 em { font-style: normal; color: ${GOLD}; }
    .hero p { font-size: 17px; color: rgba(255,255,255,0.88); max-width: 700px; }
    .hero-ctas { margin-top: 30px; display: flex; gap: 14px; flex-wrap: wrap; }
    .btn-gold { background: ${GOLD}; color: ${NAVY}; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 30px; border-radius: 999px; }
    .btn-ghost { border: 1.5px solid rgba(255,255,255,0.5); color: #fff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 30px; border-radius: 999px; }
    section { padding: 56px 24px; }
    .inner { max-width: 860px; margin: 0 auto; }
    h2 { color: ${NAVY}; font-size: clamp(22px, 3.4vw, 32px); font-weight: 700; margin-bottom: 18px; }
    .asigs { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
    .asig { background: #f5f5f5; border-radius: 999px; padding: 10px 20px; font-size: 14.5px; font-weight: 600; color: ${NAVY}; }
    .foco { background: #fff8ea; border-left: 4px solid ${GOLD}; border-radius: 0 12px 12px 0; padding: 20px 24px; margin-top: 26px; font-size: 15.5px; }
    .grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; margin-top: 24px; }
    .card { background: #f5f5f5; border-radius: 16px; padding: 26px 24px; }
    .card b { display: block; color: ${NAVY}; font-size: 16px; margin-bottom: 8px; }
    .card p { font-size: 14.5px; }
    .fechas { background: ${NAVY}; color: #fff; }
    .fechas h2 { color: #fff; }
    .fechas .card { background: rgba(255,255,255,0.08); }
    .fechas .card b { color: ${GOLD}; }
    .fechas .card p { color: rgba(255,255,255,0.85); }
    .fechas a.mineduc { color: ${GOLD}; font-weight: 600; }
    .cta-final { text-align: center; }
    .cta-final .precio { font-size: 42px; font-weight: 800; color: ${NAVY}; }
    .cta-final .precio span { font-size: 17px; font-weight: 500; color: ${TEXT}; }
    .niveles { border-top: 1px solid #e8e8e8; padding: 34px 24px 44px; }
    .niveles .inner { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .niveles a { font-size: 13.5px; font-weight: 600; color: ${NAVY}; text-decoration: none; background: #f5f5f5; border-radius: 999px; padding: 8px 16px; }
    .niveles .lbl { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${TEXT}; margin-right: 6px; }
    footer { background: ${NAVY}; color: rgba(255,255,255,0.75); font-size: 13px; text-align: center; padding: 26px 24px; }
    footer a { color: ${GOLD}; text-decoration: none; }
  </style>
</head>
<body>
  <nav class="nav">
    <div class="nav-inner">
      <a class="brand" href="/">
        <span class="brand-badge">BK</span>
        <span class="brand-name">The Barkley<br>Online School</span>
      </a>
      <a class="nav-cta" href="/#inscripcion">Inscribirse</a>
    </div>
  </nav>

  <header class="hero">
    <div class="hero-inner">
      <p class="kicker">Validación oficial MINEDUC · Chile</p>
      <h1>Exámenes libres de <em>${n.nombre}</em>, preparados 100% online y a tu ritmo</h1>
      <p>${n.intro}</p>
      <div class="hero-ctas">
        <a class="btn-gold" href="/#inscripcion">Reservar cupo 2027 →</a>
        <a class="btn-ghost" href="https://barkley-platform.vercel.app/demo/student">Probar la demo gratis</a>
      </div>
    </div>
  </header>

  <section>
    <div class="inner">
      <h2>Qué se estudia en ${n.nombre}</h2>
      <p>El programa cubre el temario oficial del MINEDUC para ${n.nombre}, organizado en unidades que se desbloquean solo cuando la anterior está dominada (Aprendizaje por Dominio). Cada lección incluye video, pódcast, práctica autocorregida y evaluación.</p>
      <div class="asigs">${n.asignaturas.map((a) => `<span class="asig">${a}</span>`).join("")}</div>
      <div class="foco">${n.foco}</div>
    </div>
  </section>

  <section style="background:#f5f5f5;">
    <div class="inner">
      <h2>Cómo funciona Barkley</h2>
      <div class="grid3">
        <div class="card"><b>Sin clases en vivo</b><p>Nada de Zoom ni horarios fijos. Estudias cuando tu día lo permite, desde cualquier lugar de Chile.</p></div>
        <div class="card"><b>Video + pódcast por lección</b><p>Cada objetivo del temario viene en dos formatos: para ver o para escuchar, con pausa y repetición ilimitadas.</p></div>
        <div class="card"><b>Avance por dominio</b><p>Solo pasas a la siguiente unidad con 70% o más. Nadie arrastra vacíos hasta el examen.</p></div>
        <div class="card"><b>IA Barkley</b><p>Tutor con inteligencia artificial que se activa cuando detecta dificultad real y guía sin dar las respuestas.</p></div>
        <div class="card"><b>Asesor humano</b><p>Una persona monitorea el avance, contacta a la familia y acompaña durante todo el año.</p></div>
        <div class="card"><b>Portal para la familia</b><p>Los apoderados ven progreso, notas y actividad en tiempo real, en modo solo lectura.</p></div>
      </div>
    </div>
  </section>

  <section class="fechas">
    <div class="inner">
      <h2>Fechas oficiales MINEDUC 2026</h2>
      <div class="grid3">
        <div class="card"><b>Primer período</b><p>Inscripción: 6 al 24 de abril de 2026<br>Rendición: 3 al 7 de junio de 2026</p></div>
        <div class="card"><b>Segundo período</b><p>Inscripción: 1 al 22 de julio de 2026<br>Rendición: 7 al 11 de octubre de 2026</p></div>
        <div class="card"><b>Inscripción gratuita</b><p>Se realiza en el Portal de Ayuda MINEDUC. Para menores de 18 años, revisa la <a class="mineduc" href="https://www.ayudamineduc.cl/ficha/examenes-libres-menores-de-18-anos-11" target="_blank" rel="noopener noreferrer">ficha oficial</a>.</p></div>
      </div>
    </div>
  </section>

  <section class="cta-final">
    <div class="inner">
      <h2>Un solo valor, sin matrícula</h2>
      <p class="precio">$65.000 <span>/ mes</span></p>
      <p style="margin:10px 0 26px;">O pago anual de $442.000 (15% de descuento). Reserva ahora sin costo — pagas recién en febrero de 2027.</p>
      <a class="btn-gold" style="background:${RED};color:#fff;" href="/#inscripcion">Inscribirme en ${n.nombre} →</a>
    </div>
  </section>

  <nav class="niveles" aria-label="Otros niveles">
    <div class="inner">
      <span class="lbl">Otros niveles:</span>
      ${otros}
    </div>
  </nav>

  <footer>
    <p>Barkley Online — Colegio 100% asincrónico e inclusivo en Chile · Preparación para Exámenes Libres ante el MINEDUC · <a href="/">barkleyinstituto.cl</a></p>
  </footer>
</body>
</html>
`;
}

for (const n of NIVELES) {
  const dir = join(ROOT, "client", "public", `examenes-libres-${n.slug}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), pageHtml(n));
  console.log(`✓ examenes-libres-${n.slug}/index.html`);
}
console.log("Listo: 8 landings generadas.");
