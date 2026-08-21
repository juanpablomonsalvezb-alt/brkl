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
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://www.barkleyinstituto.cl";

/* Temario oficial MINEDUC (391 OA, 12 niveles). Se publica en cada landing porque
   los datos de Search Console muestran que la consulta dominante hacia estas
   páginas es exactamente esa: "temario <nivel> examenes libres", con ~10 de
   posición media y cero clics. Estábamos rankeando por algo que teníamos y no
   mostrábamos. No es contenido inventado: es el temario público del Ministerio. */
const MANIFEST = JSON.parse(readFileSync(join(ROOT, "scripts", "data", "mineduc-temarios-manifest.json"), "utf8"));

/** "4-medio" → "4_medio", la clave del manifiesto. */
const claveNivel = (slug) => slug.replace("-", "_");

function temarioDe(slug) {
  const grado = MANIFEST.grades[claveNivel(slug)];
  if (!grado) return [];
  return Object.values(grado.subjects)
    .filter((s) => (s.objetivos_aprendizaje ?? []).length > 0)
    .map((s) => ({
      asignatura: s.subject_name,
      ejes: s.ejes ?? [],
      oas: s.objetivos_aprendizaje.map((oa) => ({
        codigo: oa.oa_code,
        logros: (oa.indicadores ?? []).filter(indicadorUtilizable).slice(0, 4),
      })),
    }));
}

/**
 * Los temarios se parsearon de PDFs a dos columnas y el texto de las
 * DESCRIPCIONES quedó entrelazado ("Identificar (conciencia combinando sus
 * fonemas y sílabas. fonológica), las palabras..."). Publicarlas sería mostrar
 * el temario oficial deformado, así que no se usan.
 *
 * Los INDICADORES sobrevivieron mucho mejor —son frases cortas de una línea—
 * pero algunos quedaron truncados. Este filtro deja pasar solo los que son una
 * oración completa y autoexplicativa.
 */
function indicadorUtilizable(texto) {
  const t = String(texto).replace(/\s+/g, " ").trim();
  if (t.length < 25 || t.length > 220) return false;
  if (!/[.]$/.test(t)) return false;                 // truncado a media frase
  if (/(^|\s)(el|la|los|las|su|de|del|y|o|con|para|por|un|una)\.$/i.test(t)) return false;
  if (/(por ejemplo|ejemplo:|:)$/i.test(t)) return false;
  if (/•/.test(t)) return false;                     // viñeta partida
  return /^[A-ZÁÉÍÓÚÑ]/.test(t);                     // empieza como oración
}

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function temarioHtml(slug, nombre) {
  const bloques = temarioDe(slug);
  if (bloques.length === 0) return "";
  const totalOA = bloques.reduce((n, b) => n + b.oas.length, 0);
  return `
  <section id="temario" style="background:#fff;">
    <div class="inner">
      <h2>Temario oficial de ${nombre}</h2>
      <p>El Ministerio de Educación evalúa <strong>${totalOA} Objetivos de Aprendizaje</strong> en los exámenes libres de ${nombre}, repartidos en ${bloques.length} asignaturas. Abajo está el detalle por asignatura, con los ejes temáticos y ejemplos concretos de lo que el estudiante debe ser capaz de hacer.</p>
      <p>En Barkley cada uno de esos ${totalOA} objetivos es una lección, con su video, su pódcast y su evaluación.</p>
      ${bloques
        .map(
          (b) => `
      <div class="asig-bloque">
        <h3>${esc(b.asignatura)}<span class="oa-count">${b.oas.length} objetivos</span></h3>
        ${b.ejes.length ? `<p class="ejes"><strong>Ejes:</strong> ${b.ejes.map(esc).join(" · ")}</p>` : ""}
        ${(() => {
          const conLogros = b.oas.filter((o) => o.logros.length > 0);
          if (conLogros.length === 0) return "";
          return `<p class="logros-intro">Algunos de los desempeños evaluados:</p>
        <ul class="oa-lista">
          ${conLogros
            .slice(0, 6)
            .flatMap((o) => o.logros.slice(0, 2).map((l) => `<li><code>${esc(o.codigo)}</code> ${esc(l)}</li>`))
            .join("")}
        </ul>`;
        })()}
      </div>`,
        )
        .join("")}
      <p class="fuente">
        Ejes y cantidad de objetivos según el Temario Oficial MINEDUC para Exámenes de Validación de Estudios.
        El texto completo de cada objetivo está en el temario que publica el Ministerio:
        <a href="https://www.ayudamineduc.cl/ficha/examenes-libres-menores-de-18-anos-11" target="_blank" rel="noopener noreferrer">ficha oficial de exámenes libres</a>.
      </p>
    </div>
  </section>`;
}

// Artículo del blog más pertinente por nivel (no genérico: por edad/etapa real)
// + si conviene destacar Adaptativo. Las 13 landings de nivel no enlazaban a
// NADA fuera de sí mismas — Google reparte autoridad por enlaces internos, y
// esas dos secciones (blog, Adaptativo) quedaban aisladas del tráfico que ya
// llega ahí (ej. 8° básico: 266 impresiones/mes).
const RELACIONADO_POR_NIVEL = {
  "1-basico": { post: "adulto-acompanante-examenes-libres-basica", adaptativo: true },
  "2-basico": { post: "adulto-acompanante-examenes-libres-basica", adaptativo: true },
  "3-basico": { post: "adulto-acompanante-examenes-libres-basica", adaptativo: true },
  "4-basico": { post: "diferencia-examen-libre-colegio-online", adaptativo: true },
  "5-basico": { post: "aprendizaje-por-dominio-que-es", adaptativo: true },
  "6-basico": { post: "educacion-asincronica-que-es", adaptativo: true },
  "7-basico": { post: "tdah-y-colegio-presencial", adaptativo: true },
  "8-basico": { post: "dislexia-estudiar-en-casa", adaptativo: true },
  "1-medio": { post: "ansiedad-escolar-y-aula-tradicional", adaptativo: true },
  "2-medio": { post: "colegio-para-deportistas-alto-rendimiento", adaptativo: false },
  "3-medio": { post: "paes-despues-de-cuarto-medio", adaptativo: false },
  "4-medio": { post: "paes-despues-de-cuarto-medio", adaptativo: false },
};

// Títulos reales del blog (deben calzar con scripts/generate-blog.mjs — están
// duplicados a propósito para no acoplar los dos generadores por import).
const TITULO_POST = {
  "diferencia-examen-libre-colegio-online": "Examen libre o colegio online: la diferencia real",
  "tdah-y-colegio-presencial": "TDAH y colegio presencial: por qué el aula complica más",
  "dislexia-estudiar-en-casa": "Dislexia y estudio en casa: menos presión, mismo nivel",
  "aprendizaje-por-dominio-que-es": "Aprendizaje por Dominio: nadie avanza sin entender",
  "colegio-para-deportistas-alto-rendimiento": "Colegio para deportistas de alto rendimiento",
  "terminar-el-colegio-siendo-adulto": "Terminar el colegio siendo adulto, en Chile",
  "como-inscribirse-examenes-libres-mineduc": "Cómo inscribirse a exámenes libres MINEDUC paso a paso",
  "ansiedad-escolar-y-aula-tradicional": "Ansiedad escolar: rendir mejor sin exposición constante",
  "paes-despues-de-cuarto-medio": "PAES después de 4° medio: qué necesitas y cuándo",
  "adulto-acompanante-examenes-libres-basica": "Adulto Acompañante en exámenes libres de básica",
  "educacion-asincronica-que-es": "Qué significa clase asincrónica (explicado simple)",
};

function relacionadosHtml(slug) {
  const r = RELACIONADO_POR_NIVEL[slug];
  if (!r) return "";
  const items = [
    `<a href="/blog/${r.post}/">${TITULO_POST[r.post]}</a>`,
    r.adaptativo ? `<a href="/adaptativo">Programa Adaptativo — TDAH, dislexia, TEA y motricidad</a>` : "",
  ].filter(Boolean);
  return `
  <section style="background:#fff;">
    <div class="inner">
      <h2>Sigue leyendo</h2>
      <div class="relacionados">${items.join("")}</div>
    </div>
  </section>`;
}

const NIVELES = [
  {
    slug: "1-basico",
    nombre: "1° Básico",
    titleNivel: "Exámenes Libres 1° Básico",
    intro:
      "Primero básico es el punto de partida de la validación de estudios en Chile. A esta edad el niño o niña necesita un Adulto Acompañante presente casi todo el estudio — Barkley entrega el contenido (video, pódcast, práctica) y guía paso a paso al adulto en casa, igual que hacen los colegios online acreditados de EE.UU. y Reino Unido con sus estudiantes más pequeños.",
    asignaturas: ["Lenguaje y Comunicación", "Matemática", "Ciencias Naturales", "Historia, Geografía y Cs. Sociales"],
    foco: "Lecciones muy breves (5-7 minutos), lectoescritura inicial y conteo — con el Adulto Acompañante al lado casi todo el tiempo de estudio.",
  },
  {
    slug: "2-basico",
    nombre: "2° Básico",
    titleNivel: "Exámenes Libres 2° Básico",
    intro:
      "Segundo básico consolida la lectoescritura y las primeras operaciones matemáticas. Con Barkley, el Adulto Acompañante sigue muy presente, pero el niño ya empieza a reconocer su propia rutina de estudio dentro de la plataforma.",
    asignaturas: ["Lenguaje y Comunicación", "Matemática", "Ciencias Naturales", "Historia, Geografía y Cs. Sociales"],
    foco: "Refuerzo de lectura comprensiva y las cuatro operaciones básicas, con práctica autocorregida y repetición sin límite.",
  },
  {
    slug: "3-basico",
    nombre: "3° Básico",
    titleNivel: "Exámenes Libres 3° Básico",
    intro:
      "Tercero básico da el salto a contenidos más largos y a mayor responsabilidad del estudiante sobre su propio avance. El Adulto Acompañante empieza a soltar: acompaña el inicio del estudio y supervisa el resto del día.",
    asignaturas: ["Lenguaje y Comunicación", "Matemática", "Ciencias Naturales", "Historia, Geografía y Cs. Sociales"],
    foco: "Comprensión lectora de textos más extensos y operatoria con números de más dígitos, siempre con video y pódcast por lección.",
  },
  {
    slug: "4-basico",
    nombre: "4° Básico",
    titleNivel: "Exámenes Libres 4° Básico",
    intro:
      "Cuarto básico cierra el primer ciclo básico. Con Barkley, el estudiante ya reconoce su rutina de estudio asincrónico y el Adulto Acompañante reduce sus horas a solo el inicio de la jornada y revisión de avances.",
    asignaturas: ["Lenguaje y Comunicación", "Matemática", "Ciencias Naturales", "Historia, Geografía y Cs. Sociales"],
    foco: "Consolidación de las bases de 1° ciclo antes del salto a 5°-8°, con evaluación por unidad y Portal Familia en tiempo real.",
  },
  {
    slug: "5-basico",
    nombre: "5° Básico",
    titleNivel: "Exámenes Libres 5° Básico",
    intro:
      "Quinto básico abre el segundo ciclo de enseñanza básica. En Barkley tu hijo o hija prepara todo el temario oficial a su ritmo, con video y pódcast en cada lección, y un Adulto Acompañante que ya supervisa más que enseña.",
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

function faqsFor(n) {
  return [
    {
      q: `¿Cuánto dura la preparación de ${n.nombre} en Barkley?`,
      a: `Se estudia a tu propio ritmo durante el año lectivo (marzo a octubre). Las fechas de rendición oficial MINEDUC 2026 son el 3-7 de junio (1er período) y 7-11 de octubre (2do período).`,
    },
    {
      q: `¿Qué asignaturas se rinden en ${n.nombre}?`,
      a: `${n.asignaturas.join(", ")}.`,
    },
    {
      q: `¿Hay que conectarse a una hora fija para estudiar ${n.nombre}?`,
      a: `No. Barkley es 100% asincrónico: sin clases en vivo ni horario fijo, cada lección con video y pódcast disponible cuando el estudiante quiera verla.`,
    },
    {
      q: `¿Qué distingue la preparación de ${n.nombre}?`,
      a: n.foco,
    },
  ];
}

function pageHtml(n) {
  const url = `${BASE}/examenes-libres-${n.slug}/`;
  // Los datos mandan: "temario <nivel> examenes libres" es la consulta dominante.
  const title = `Temario Exámenes Libres ${n.nombre} — Oficial MINEDUC`;
  const desc = `Temario oficial completo de ${n.nombre} para exámenes libres MINEDUC: todos los objetivos de aprendizaje evaluados, por asignatura. Prepáralo online y a tu ritmo.`;
  const faqs = faqsFor(n);
  // BreadcrumbList: Google lo usa para mostrar la ruta en el resultado en vez de
  // la URL cruda. El blog ya lo tenía; las landings de nivel no.
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Exámenes libres", item: `${BASE}/guia-examenes-libres/` },
      { "@type": "ListItem", position: 3, name: n.nombre, item: url },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const otros = NIVELES.filter((x) => x.slug !== n.slug)
    .map((x) => `<a href="/examenes-libres-${x.slug}/">${x.nombre}</a>`)
    .join("");


  // Enlaces al blog: cierran el circuito con el cluster informacional, que hasta
  // ahora solo recibía enlaces y no devolvía ninguno hacia estas páginas.
  const esMedia = n.slug.endsWith("-medio");
  const lecturas = [
    { href: "/guia-examenes-libres/", label: "Guía completa: cómo funcionan los exámenes libres en Chile" },
    { href: "/blog/como-inscribirse-examenes-libres-mineduc/", label: "Cómo inscribirse a exámenes libres MINEDUC paso a paso" },
    esMedia
      ? { href: "/blog/paes-despues-de-cuarto-medio/", label: "PAES después de 4° medio: qué necesitas y cuándo empezar" }
      : { href: "/blog/adulto-acompanante-examenes-libres-basica/", label: "Adulto Acompañante en exámenes de básica: qué implica" },
    { href: "/blog/aprendizaje-por-dominio-que-es/", label: "Aprendizaje por Dominio: por qué nadie avanza con vacíos" },
  ].map((l) => `<a href="${l.href}">${l.label}</a>`).join("");

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
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <link rel="canonical" href="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="es_CL" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${BASE}/og-image.jpg" />
  <meta property="og:site_name" content="Barkley Online" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Barkley Online — colegio 100% asincrónico en Chile" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${BASE}/og-image.jpg" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(crumbs)}</script>
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
    .relacionados { display: flex; flex-wrap: wrap; gap: 12px; }
    .relacionados a { font-size: 14.5px; font-weight: 600; color: ${NAVY}; text-decoration: none; background: #fff8ea; border: 1px solid #f0e2bd; border-radius: 10px; padding: 12px 18px; }
    .faq-item { border-bottom: 1px solid #e8e8e8; padding: 18px 0; }
    .faq-item b { display: block; color: ${NAVY}; font-size: 15.5px; margin-bottom: 6px; }
    .faq-item p { font-size: 14.5px; }
    .asig-bloque { margin-top: 30px; }
    .asig-bloque h3 { color: ${NAVY}; font-size: 19px; display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
    .oa-count { font-size: 12.5px; font-weight: 600; color: ${TEXT}; background: #f5f5f5; border-radius: 999px; padding: 3px 11px; }
    .ejes { font-size: 13px; color: ${TEXT}; margin-top: 5px; }
    .oa-lista { margin: 12px 0 0; padding-left: 0; list-style: none; }
    .oa-lista li { font-size: 14.5px; line-height: 1.65; padding: 9px 0 9px 14px; border-left: 3px solid #ececec; margin-bottom: 5px; }
    .oa-lista code { font-size: 12px; font-weight: 700; color: ${NAVY}; background: #fff8ea; border-radius: 4px; padding: 2px 7px; margin-right: 7px; white-space: nowrap; }
    .logros-intro { font-size: 13.5px; font-weight: 600; color: ${TEXT}; margin-top: 14px; }
    .fuente { font-size: 12.5px; color: #9aa4b0; margin-top: 26px; border-top: 1px solid #ececec; padding-top: 14px; }
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
        <a class="btn-ghost" href="#temario">Ver el temario oficial ↓</a>
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

  ${temarioHtml(n.slug, n.nombre)}

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

  ${relacionadosHtml(n.slug)}

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

  <section>
    <div class="inner">
      <h2>Preguntas frecuentes — ${n.nombre}</h2>
      ${faqs.map((f) => `<div class="faq-item"><b>${f.q}</b><p>${f.a}</p></div>`).join("")}
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
console.log(`Listo: ${NIVELES.length} landings generadas.`);
