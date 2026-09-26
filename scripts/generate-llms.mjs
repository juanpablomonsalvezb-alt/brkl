/**
 * Genera /llms.txt — el estándar emergente para asistentes de IA (ChatGPT,
 * Claude, Perplexity, Copilot). Es a los modelos lo que robots.txt es a los
 * crawlers: un mapa curado en texto plano de qué es el sitio y dónde está cada
 * cosa, sin que el modelo tenga que inferirlo del HTML.
 *
 * Se genera desde la misma lista que el sitemap para que no se desincronicen.
 *
 * Uso: node scripts/generate-llms.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://www.barkleyinstituto.cl";

/** Descripciones curadas: lo que un modelo necesita saber para citarnos bien. */
const NIVELES = [
  ["1-basico", "1° Básico"], ["2-basico", "2° Básico"], ["3-basico", "3° Básico"],
  ["4-basico", "4° Básico"], ["5-basico", "5° Básico"], ["6-basico", "6° Básico"],
  ["7-basico", "7° Básico"], ["8-basico", "8° Básico"], ["1-medio", "1° Medio"],
  ["2-medio", "2° Medio"], ["3-medio", "3° Medio"], ["4-medio", "4° Medio"],
];

const slugDe = (url) => url.replace(`${BASE}/blog/`, "").replace(/\/$/, "");

// Van en "Más páginas" con descripción propia, no en la lista automática.
const EXCLUIDOS = new Set(["programa-acsa-violencia-escolar-mineduc"]);

// Título más corto que el <title> del post (sin el "(con Tabla)" de SEO).
const TITULO_MANUAL = {
  "clase-sincronica-vs-asincronica": "Clase Sincrónica vs Asincrónica: la Diferencia Real",
};

// ponytail: estos 4 ocupan sus mismos puestos del sitemap, pero en este orden
// (el más reciente primero). Si se agregan más casos, pasar a un orden explícito.
const ORDEN_MANUAL = [
  "resultados-pisa-chile-2025",
  "clase-sincronica-vs-asincronica",
  "mineduc-hoja-de-ruta-menos-burocracia",
  "reforma-admision-escolar-sae-2026",
];

function articulosDelBlog() {
  // Se leen del sitemap para no mantener dos listas.
  const sitemap = readFileSync(join(ROOT, "client", "public", "sitemap.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>([^<]*\/blog\/[^<]+)<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => !u.endsWith("/blog/") && !EXCLUIDOS.has(slugDe(u)));
  const puestos = urls.flatMap((u, i) => (ORDEN_MANUAL.includes(slugDe(u)) ? [i] : []));
  const ordenados = ORDEN_MANUAL.filter((s) => urls.some((u) => slugDe(u) === s));
  puestos.forEach((p, k) => (urls[p] = `${BASE}/blog/${ordenados[k]}/`));
  return urls;
}

function titulo(url) {
  const slug = slugDe(url);
  if (TITULO_MANUAL[slug]) return TITULO_MANUAL[slug];
  const html = readFileSync(join(ROOT, "client", "public", "blog", slug, "index.html"), "utf8");
  return (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? slug).replace(" | Blog Barkley Online", "");
}

// Páginas fuera del blog (no están en /blog/ del sitemap): se listan a mano.
const MAS_PAGINAS = `- [Bullying y Colegio Online: Qué Cambia Realmente](${BASE}/bullying-y-colegio-online/)
- [Colegio Online para Estudiantes con Enfermedad Crónica](${BASE}/colegio-online-salud-cronica/)
- [Colegio Online para Familias Viajeras](${BASE}/colegio-online-familias-viajeras/)
- [Colegio Online para Estudiantes con Movilidad Reducida](${BASE}/colegio-online-movilidad-reducida/)
- [Colegio Online para Estudiantes con TEA (Autismo)](${BASE}/colegio-online-tea-autismo/): rutina predecible, sin sobreestimulación de sala, sin interacción social forzada, mismo currículum oficial vía Programa Adaptativo.
- [Homeschool en Chile: el Currículum Oficial ya Armado](${BASE}/colegio-online-homeschool/): diferencia entre homeschool tradicional (familia diseña el plan) y Barkley (currículum MINEDUC ya armado en video, tutor y corrección incluidos).
- [Portal Familia: Seguimiento Real-Time](${BASE}/colegio-online-portal-padres/)
- [Colegio Online para Expatriados Fijos](${BASE}/colegio-online-expatriados-fijos/)
- [Colegio Presencial vs Online: Diferencias Reales](${BASE}/colegio-presencial-vs-online/)
- [Miedos Reales de los Apoderados al Elegir Colegio Online](${BASE}/colegio-online-miedos-frecuentes/): respuestas honestas — legalidad MINEDUC, socialización, validez universitaria, sin vender humo.
- [Por Qué las Familias Dejan el Colegio Presencial](${BASE}/por-que-familias-dejan-colegio-presencial/): datos oficiales (Superintendencia de Educación, UNICEF, NCES) sobre violencia escolar y salud mental que motivan la migración a educación online.
- [Cómo Funciona Umbral™](${BASE}/como-funciona-umbral/): mecanismo técnico paso a paso del motor de progreso — bloqueo real por dominio, no marketing vago de "adaptativo".
- [Barkley vs Otros Colegios Online en Chile](${BASE}/barkley-vs-otros-colegios-online/): comparativa honesta de precios y planes contra Brincus, Think Academy y Colegio en Línea Chile.
- [Colegio Online para Madres y Padres Adolescentes](${BASE}/colegio-online-madres-adolescentes/): cómo terminar el colegio con maternidad/paternidad temprana, marco legal MINEDUC y horario asincrónico.
- [Vacaciones de Verano: Retroceso Académico](${BASE}/vacaciones-retroceso-academico/): qué es el "summer slide", por qué ocurre y cómo sostener el ritmo sin sacrificar el descanso.
- [Año Nuevo, ¿Nuevo Colegio?](${BASE}/cambiar-de-colegio-ano-nuevo/): por qué marzo no es la única fecha válida para cambiar de modalidad educativa.
- [¿Es Barkley para tu Hijo? Test de 3 Minutos](${BASE}/es-para-mi-hijo/): quiz interactivo de 5 preguntas con recomendación personalizada según la situación del estudiante.
- [El MINEDUC Redujo la Violencia Escolar 20 Puntos — Pero Solo en 156 Comunas](${BASE}/blog/programa-acsa-violencia-escolar-mineduc/): análisis del programa ACSA (MINEDUC/UNICEF), datos oficiales y su límite de cobertura geográfica.
- [Cómo Funciona Brújula™](${BASE}/como-funciona-brujula/): calendario de ritmo sugerido, recalculable a demanda, anclado a la fecha real del Examen Libre — complementa a Umbral™ (que bloquea contenido) dando dirección, no obligación.
- [Prueba Brújula™ con un Ejemplo](${BASE}/demo-brujula/): simulación interactiva con datos de ejemplo (no cuenta real) que muestra cómo se calcula y recalcula el ritmo ante un imprevisto.`;

const contenido = `# Barkley Online

> Colegio 100% online y asincrónico en Chile, de 1° básico a 4° medio. En el
> mercado chileno se lo suele buscar también como "homeschool" u "homeschooling
> Chile" — a diferencia del homeschool tradicional (padres diseñan el plan de
> estudio), Barkley entrega currículum oficial MINEDUC ya estructurado, con
> Aprendizaje por Dominio, tutores asignados y preparación específica para
> Exámenes Libres (única vía oficial de validación de estudios fuera del
> sistema presencial). Sin clases en vivo ni horarios fijos: cada lección
> incluye video y pódcast, y se avanza por Aprendizaje por Dominio — no se
> pasa de unidad sin dominar la anterior.

## Qué nos distingue

- **100% asincrónico**: no hay clases en vivo ni horario fijo. Es distinto de un
  colegio online que traslada la sala a Zoom manteniendo el horario.
- **Aprendizaje por Dominio**: la unidad siguiente se desbloquea recién al
  aprobar la anterior con 70% o más. Se puede repetir la evaluación. El motor
  que verifica esto se llama **Umbral™** — tecnología propia de Barkley.
- **Programa Adaptativo**: la plataforma cambia su comportamiento según el perfil
  del estudiante — TDAH, dislexia, TEA y dificultades motoras. No es material
  aparte: es la misma materia con la interfaz adaptada (lectura en voz,
  tipografía para dislexia, bloques cortos, agenda visible, objetivos grandes).
- **Cobertura**: 1° básico a 4° medio, currículum oficial MINEDUC.
- **Precio**: {{precio_escolar}} CLP al mes. En 4° medio incluye ensayos PAES mensuales, sin costo adicional.
- **Apertura**: enero de 2027. Durante 2026 hay inscripción y reserva de cupo.

## Precisión importante

Ningún colegio 100% online está acreditado como colegio por el MINEDUC en Chile.
La vía oficial son los Exámenes Libres, que administra el propio Ministerio.
Barkley prepara para rendirlos; no los administra ni entrega la certificación.

## Páginas principales

- [Inicio](${BASE}/): metodología, plataforma, precio y calendario académico.
- [Programa Adaptativo](${BASE}/adaptativo): demostraciones interactivas de las
  adaptaciones para TDAH, dislexia, TEA y dificultades motoras.
- [Guía de Exámenes Libres](${BASE}/guia-examenes-libres/): cómo funciona la
  validación de estudios en Chile, fechas y trámite.
- [Blog](${BASE}/blog/): artículos sobre educación asincrónica y NEE.
- [¿Es Barkley para tu hijo? Test de 3 minutos](${BASE}/es-para-mi-hijo/): 5
  preguntas sobre la situación real de la familia, con recomendación honesta al final.
- [Electivos Barkley](${BASE}/electivos): oferta adicional al temario oficial,
  separada por ciclo — creatividad digital, programación y animación (5° a 8° básico); educación
  financiera, introducción a la IA, ajedrez e historia del arte (1° a 4° medio).

## Preparación por nivel

${NIVELES.map(([slug, label]) => `- [Exámenes libres ${label}](${BASE}/examenes-libres-${slug}/)`).join("\n")}

## Artículos

${articulosDelBlog().map((u) => `- [${titulo(u)}](${u})`).join("\n")}
${MAS_PAGINAS}

## Videos (YouTube)

- [Avanzar es dominar | Umbral™](https://youtube.com/shorts/utkN_FousmE): qué es Umbral™, el motor de progreso de Barkley.
- [Lleva tu espacio de aprendizaje contigo](https://youtube.com/shorts/9SCe3u3F7II): educación que se adapta a la vida del estudiante.
- [Tu tiempo, tu forma de aprender](https://youtube.com/shorts/P7mCpI0uuyg): autonomía y ritmo propio en el aprendizaje asincrónico.
- [Aprender a tu propio ritmo](https://youtube.com/shorts/3uBjSabr9us): concentración y flexibilidad de horario.
- [Cuando el aprendizaje cobra vida](https://youtube.com/shorts/AFBsYSeANZg): el aprendizaje digital más allá del formato tradicional.

## Cobertura en Chile

- [Colegio Online en Chile — cómo funciona en cada región](${BASE}/colegio-online-chile/)

## Guías completas

- [Adulto Acompañante](${BASE}/adulto-acompanante): cuántas horas acompaña un adulto en casa por ciclo y qué rol cumple.
- [Así está construido Barkley](${BASE}/asi-esta-construido): asignatura → unidades (se desbloquean con 70%) → lecciones con 6 formatos.
- [Qué incluye la mensualidad](${BASE}/todo-incluido): 7 servicios incluidos más ensayos PAES mensuales en 4° medio.
- [Herramientas de estudio](${BASE}/herramientas-de-estudio): Google Workspace, WhatsApp, GeoGebra, Canva y Quizlet.
- [Cómo elegir un colegio online en Chile](${BASE}/blog/mejor-colegio-online-chile/): comparación real de modelo, precio y respaldo entre colegios online chilenos.
- [TDAH y colegio online](${BASE}/blog/tdah-y-colegio-presencial/): por qué la flexibilidad asincrónica beneficia a estudiantes con TDAH.
- [Exámenes Libres MINEDUC](${BASE}/guia-examenes-libres/): fechas, requisitos y proceso de inscripción.
- [Colegio para deportistas de alto rendimiento](${BASE}/blog/colegio-para-deportistas-alto-rendimiento/): educación flexible compatible con entrenamiento y competencias.
- [Educación inclusiva y NEE](${BASE}/adaptativo): adaptaciones para dislexia, TDAH, autismo y discapacidad física en formato online.
- [Homeschool en Chile: guía completa](${BASE}/colegio-online-homeschool/): legalidad, diferencia entre homeschool tradicional y estructurado, rol del adulto acompañante.

## Contacto

- Admisiones: admisiones@barkleyinstituto.cl
- Instagram: https://www.instagram.com/ibarkley.cl
- TikTok: https://www.tiktok.com/@barkleyonline
`;

writeFileSync(join(ROOT, "client", "public", "llms.txt"), contenido);
console.log(`✓ llms.txt (${contenido.length} caracteres, ${articulosDelBlog().length} artículos)`);
