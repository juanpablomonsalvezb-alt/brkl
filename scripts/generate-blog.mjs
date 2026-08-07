/**
 * Genera artículos evergreen del blog (client/public/blog/<slug>/index.html).
 * Mismo patrón que generate-landings.mjs: HTML estático con title/description/
 * canonical/Article schema propios, sin depender del render JS de la SPA.
 *
 * Uso: node scripts/generate-blog.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://www.barkleyinstituto.cl";
const NAVY = "#003366";
const GOLD = "#FFC548";
const RED = "#FF3D37";
const TEXT = "#525252";

// Destinos de conversión enlazables desde los artículos. Sin esto el blog queda
// como isla: recibe enlace del home pero no pasa autoridad a las landings ni le
// da al lector una ruta hacia el nivel que le corresponde.
const DESTINOS = {
  guia: { href: "/guia-examenes-libres/", label: "Guía completa de exámenes libres en Chile" },
  adaptativo: { href: "/adaptativo", label: "Barkley Adaptativo — apoyo para TDAH, dislexia y TEA" },
  "1-basico": { href: "/examenes-libres-1-basico/", label: "Exámenes libres 1° Básico" },
  "2-basico": { href: "/examenes-libres-2-basico/", label: "Exámenes libres 2° Básico" },
  "3-basico": { href: "/examenes-libres-3-basico/", label: "Exámenes libres 3° Básico" },
  "5-basico": { href: "/examenes-libres-5-basico/", label: "Exámenes libres 5° Básico" },
  "6-basico": { href: "/examenes-libres-6-basico/", label: "Exámenes libres 6° Básico" },
  "7-basico": { href: "/examenes-libres-7-basico/", label: "Exámenes libres 7° Básico" },
  "8-basico": { href: "/examenes-libres-8-basico/", label: "Exámenes libres 8° Básico" },
  "1-medio": { href: "/examenes-libres-1-medio/", label: "Exámenes libres 1° Medio" },
  "2-medio": { href: "/examenes-libres-2-medio/", label: "Exámenes libres 2° Medio" },
  "3-medio": { href: "/examenes-libres-3-medio/", label: "Exámenes libres 3° Medio" },
  "4-medio": { href: "/examenes-libres-4-medio/", label: "Exámenes libres 4° Medio" },
};

// Qué destinos enlaza cada artículo, por pertinencia temática.
const RELACIONADOS = {
  "diferencia-examen-libre-colegio-online": ["guia", "8-basico", "4-medio"],
  "tdah-y-colegio-presencial": ["adaptativo", "guia", "7-basico"],
  "dislexia-estudiar-en-casa": ["adaptativo", "guia", "3-basico"],
  "aprendizaje-por-dominio-que-es": ["guia", "5-basico", "1-medio"],
  "colegio-para-deportistas-alto-rendimiento": ["guia", "2-medio", "8-basico"],
  "terminar-el-colegio-siendo-adulto": ["4-medio", "3-medio", "guia"],
  "como-inscribirse-examenes-libres-mineduc": ["guia", "8-basico", "4-medio"],
  "ansiedad-escolar-y-aula-tradicional": ["adaptativo", "guia", "6-basico"],
  "paes-despues-de-cuarto-medio": ["4-medio", "3-medio", "guia"],
  "adulto-acompanante-examenes-libres-basica": ["1-basico", "2-basico", "3-basico"],
  "educacion-asincronica-que-es": ["guia", "1-medio", "5-basico"],
};

// Meta compartida por todas las páginas estáticas. Sin max-image-preview:large
// Google recorta la miniatura en resultados y en Discover.
const ROBOTS = `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`;

function ogExtra(title, desc) {
  return `<meta property="og:site_name" content="Barkley Online" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Barkley Online — colegio 100% asincrónico en Chile" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${BASE}/og-image.jpg" />`;
}

function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${BASE}${it.path}`,
    })),
  };
}

const POSTS = [
  {
    slug: "diferencia-examen-libre-colegio-online",
    title: "Examen libre o colegio online: la diferencia real",
    desc: "Examen libre y colegio online no son lo mismo en Chile. Te explicamos la diferencia real y cómo Barkley combina ambos.",
    date: "2026-06-02",
    body: `
      <h2>Son dos cosas distintas que se confunden todo el tiempo</h2>
      <p>"Examen libre" es la modalidad oficial del Ministerio de Educación para validar un año escolar sin asistir a un colegio presencial. Es un trámite: te inscribes en el Portal de Ayuda MINEDUC, rindes una prueba en una fecha oficial, y si apruebas, obtienes la certificación de ese nivel — sin importar cómo estudiaste para llegar ahí.</p>
      <p>"Colegio online" es la preparación: cómo estudias el temario antes de llegar a esa prueba. Puede ser con clases en vivo por Zoom, con apuntes en PDF, o —como en Barkley— con lecciones grabadas en video y pódcast que ves cuando tu día lo permite.</p>
      <h2>Por qué se confunden</h2>
      <p>Porque casi todos los colegios online en Chile preparan exactamente para exámenes libres — es la única vía oficial para validar estudios fuera del sistema presencial tradicional. Ningún colegio 100% online está "certificado por el MINEDUC" como colegio; lo que hace es preparar bien para el trámite que sí es oficial.</p>
      <h2>Qué significa esto en la práctica</h2>
      <p>Si alguien te promete un "colegio online reconocido por el MINEDUC" sin mencionar exámenes libres, vale la pena preguntar cómo funciona exactamente la validación. En Barkley lo decimos directo: preparamos el temario completo para que rindas los exámenes libres oficiales, con Aprendizaje por Dominio para que no llegues con vacíos.</p>
    `,
    faqs: [
      { q: "¿El examen libre lo rinde cualquier colegio online?", a: "No, lo administra directamente el MINEDUC en fechas oficiales. El colegio online solo prepara el contenido previo." },
      { q: "¿Necesito estar matriculado en un colegio para rendir examen libre?", a: "No. Es un trámite independiente que hace el apoderado (o el propio adulto si rinde por sí mismo) directamente en el Portal de Ayuda MINEDUC." },
    ],
  },
  {
    slug: "tdah-y-colegio-presencial",
    title: "TDAH y colegio presencial: por qué el aula complica más",
    desc: "El horario fijo y el aula ruidosa no son neutros para un estudiante con TDAH. Explicamos por qué, y qué cambia con un formato asincrónico.",
    date: "2026-06-05",
    body: `
      <h2>El aula impone una norma que no es neutra</h2>
      <p>Cuarenta minutos sentado, en silencio, siguiendo el ritmo del grupo — esa estructura funciona razonablemente bien para el estudiante promedio. Para un estudiante con TDAH, cada uno de esos elementos (tiempo fijo, bloque largo, exposición constante) es una fricción adicional que no tiene que ver con cuánto entiende la materia.</p>
      <h2>Qué cambia con un formato sin horario fijo</h2>
      <p>Cuando no hay una hora de clase que empieza y termina para todos igual, el estudiante puede estudiar en bloques más cortos, repetir la parte que no entendió sin sentir que "atrasa al curso", y avanzar en el momento del día en que realmente rinde mejor — que no siempre es a las 8 de la mañana.</p>
      <h2>Lo que un formato online no resuelve por sí solo</h2>
      <p>Ser online no es magia: si las clases igual duran 40 minutos seguidos y hay que verlas completas de corrido, el problema sigue ahí. Lo que realmente ayuda es la posibilidad de pausar, repetir y avanzar en bloques cortos — que es justamente lo que estamos construyendo en el <a href="/adaptativo">programa Adaptativo de Barkley</a>.</p>
    `,
    faqs: [
      { q: "¿Un colegio online resuelve el TDAH por sí solo?", a: "No. Ayuda a remover la fricción de tiempo y exposición, pero no reemplaza apoyo profesional cuando corresponde." },
      { q: "¿Qué es lo mínimo que debería ofrecer una plataforma para TDAH?", a: "Sin horario fijo, posibilidad real de repetir contenido y evaluaciones, y bloques cortos en vez de sesiones largas seguidas." },
    ],
  },
  {
    slug: "dislexia-estudiar-en-casa",
    title: "Dislexia y estudio en casa: menos presión, mismo nivel",
    desc: "Cómo adaptar el estudio en casa cuando leer cuesta más, sin reducir la exigencia académica ni la comprensión del contenido.",
    date: "2026-06-09",
    body: `
      <h2>La dificultad es con el texto, no con el contenido</h2>
      <p>Un niño o joven con dislexia puede entender perfectamente un concepto de historia o de ciencias — el obstáculo aparece cuando ese concepto llega solo en forma de texto largo y denso. Confundir "le cuesta leer" con "le cuesta aprender" es el error más común y el más dañino.</p>
      <h2>Qué ayuda de verdad en casa</h2>
      <p>Dar la misma información en más de un formato (audio además de texto), usar tipografías pensadas para dislexia, aumentar el interlineado, y quitar la presión de "leer en voz alta frente a otros" — que en un aula es casi inevitable y en casa se puede evitar por completo.</p>
      <h2>Lo que no hay que hacer</h2>
      <p>Bajar la exigencia del contenido no es la solución — la materia sigue siendo la misma. Lo que cambia es el canal por el que llega. Ese es exactamente el principio detrás de las adaptaciones de lectura del <a href="/adaptativo">programa Adaptativo de Barkley</a>.</p>
    `,
    faqs: [
      { q: "¿La dislexia significa que hay que exigir menos contenido?", a: "No. La dificultad es con el texto, no con la comprensión del contenido — se puede mantener el mismo nivel cambiando el formato." },
      { q: "¿Sirve la fuente OpenDyslexic para todos los casos?", a: "Ayuda a muchos lectores con dislexia al aumentar la distinción entre letras, pero no es una solución universal — cada caso es distinto." },
    ],
  },
  {
    slug: "aprendizaje-por-dominio-que-es",
    title: "Aprendizaje por Dominio: nadie avanza sin entender",
    desc: "Qué es el Aprendizaje por Dominio (Mastery Learning), el método detrás de Barkley, y por qué evita que un estudiante arrastre vacíos hasta el examen.",
    date: "2026-06-13",
    body: `
      <h2>El problema que resuelve</h2>
      <p>En un curso tradicional, el calendario manda: si la clase de fracciones terminó, la clase pasa al siguiente tema aunque un tercio del curso no haya entendido fracciones todavía. Ese vacío no desaparece — reaparece meses después, cuando el nuevo contenido depende del anterior.</p>
      <h2>Cómo funciona el Aprendizaje por Dominio</h2>
      <p>La unidad siguiente se desbloquea solo cuando la anterior está aprobada con un umbral real (70% o más en Barkley), no cuando pasó cierta cantidad de días. Si no se alcanza, se puede repetir la evaluación las veces que sea necesario antes de avanzar.</p>
      <h2>Por qué esto es más fácil de aplicar en un formato asincrónico</h2>
      <p>En una sala con 35 estudiantes al mismo ritmo, frenar a todo el curso hasta que uno solo domine el contenido no es viable. Sin ese límite de "todos al mismo tiempo", cada estudiante avanza según su propio dominio real del contenido — ese es el principio detrás de cada nivel que preparamos en Barkley.</p>
    `,
    faqs: [
      { q: "¿El Aprendizaje por Dominio hace que el proceso sea más lento?", a: "Puede ser más lento para quien necesita repasar, y más rápido para quien domina el contenido a la primera — se ajusta a cada caso, no impone un ritmo único." },
      { q: "¿Qué porcentaje se exige para avanzar de unidad en Barkley?", a: "70% o más en la evaluación de la unidad, con posibilidad de repetir si no se alcanza." },
    ],
  },
  {
    slug: "colegio-para-deportistas-alto-rendimiento",
    title: "Colegio para deportistas de alto rendimiento",
    desc: "Giras, entrenamientos y competencias no calzan con un horario escolar fijo. Cómo un formato asincrónico resuelve ese conflicto real.",
    date: "2026-06-17",
    body: `
      <h2>El conflicto real</h2>
      <p>Un deportista de alto rendimiento entrena en horarios que no siempre coinciden con la jornada escolar, viaja a competencias en días de semana, y necesita recuperación física que no espera al timbre de la próxima clase. El colegio presencial tradicional obliga a elegir entre deporte y estudios cuando ambos chocan.</p>
      <h2>Qué necesita realmente este perfil</h2>
      <p>No es "menos exigencia académica" — es flexibilidad real de cuándo y desde dónde estudiar. Clases grabadas que se ven en un hotel entre competencias, evaluaciones que se rinden cuando el calendario deportivo lo permite, y avance que no depende de estar presente un día específico.</p>
      <h2>Por qué esto encaja con Barkley</h2>
      <p>El mismo Aprendizaje por Dominio que ayuda a estudiantes con distintos ritmos de aprendizaje resuelve este problema por una razón distinta: el estudiante avanza cuando puede, no cuando el calendario escolar dice que debe.</p>
    `,
    faqs: [
      { q: "¿Un deportista de alto rendimiento puede rendir exámenes libres igual que cualquier estudiante?", a: "Sí, el trámite MINEDUC es el mismo — lo que cambia es la flexibilidad de cuándo estudiar el contenido previo." },
      { q: "¿Qué pasa si hay que viajar justo en fecha de evaluación de unidad?", a: "Las evaluaciones de unidad se rinden dentro de la plataforma cuando el estudiante esté listo, no en una fecha fija de curso." },
    ],
  },
  {
    slug: "terminar-el-colegio-siendo-adulto",
    title: "Terminar el colegio siendo adulto, en Chile",
    desc: "Guía práctica para adultos que quieren completar su escolaridad y obtener la licencia de enseñanza media a través de exámenes libres.",
    date: "2026-06-21",
    body: `
      <h2>No hay límite de edad para terminar el colegio</h2>
      <p>Muchos adultos asumen que retomar el colegio después de los 20, 30 o 40 años ya no es una opción formal. En Chile sí lo es: los exámenes libres MINEDUC no tienen límite de edad superior — el único requisito es haber completado el nivel anterior al que se quiere validar.</p>
      <h2>Por qué el formato presencial no funciona para un adulto</h2>
      <p>Volver a una sala de clases con adolescentes, en un horario que compite con un trabajo de jornada completa, es la principal barrera práctica para un adulto. Un formato 100% asincrónico elimina ese problema de raíz: se estudia de noche, los fines de semana, o en los tiempos que el trabajo deja libres.</p>
      <h2>Qué se obtiene al final</h2>
      <p>La licencia de enseñanza media obtenida por exámenes libres es la misma licencia que entrega cualquier colegio tradicional — habilita para rendir la PAES y postular a educación superior en igualdad de condiciones.</p>
    `,
    faqs: [
      { q: "¿Hay edad máxima para rendir exámenes libres en Chile?", a: "No. El único requisito es tener 18 años o más (para la modalidad de adultos) y haber completado el nivel anterior al que se desea validar." },
      { q: "¿La licencia obtenida por examen libre sirve para postular a la PAES?", a: "Sí, es la misma licencia de enseñanza media que entrega un colegio tradicional." },
    ],
  },
  {
    slug: "como-inscribirse-examenes-libres-mineduc",
    title: "Cómo inscribirse a exámenes libres MINEDUC paso a paso",
    desc: "Guía práctica y gratuita para inscribir a exámenes libres en el Portal de Ayuda MINEDUC, con fechas oficiales 2026.",
    date: "2026-06-25",
    body: `
      <h2>Es un trámite gratuito, y lo hace el apoderado</h2>
      <p>La inscripción a exámenes libres ante el MINEDUC no tiene costo. Para menores de 18 años, el trámite lo realiza el adulto responsable en el Portal de Ayuda MINEDUC, siguiendo la ficha oficial del ministerio.</p>
      <h2>Los pasos generales</h2>
      <p>1) Verificar el nivel que corresponde validar (el estudiante debe haber completado el nivel anterior). 2) Ingresar al Portal de Ayuda MINEDUC dentro del período de inscripción oficial. 3) Completar los datos del estudiante y el nivel a rendir. 4) Guardar el comprobante de inscripción. 5) Presentarse a rendir en la fecha y sede asignada.</p>
      <h2>Fechas oficiales 2026</h2>
      <p>Primer período: inscripción del 6 al 24 de abril, rendición del 3 al 7 de junio. Segundo período: inscripción del 1 al 22 de julio, rendición del 7 al 11 de octubre.</p>
      <h2>Dónde pedir ayuda con el trámite</h2>
      <p>En Barkley entregamos charlas y asesoría personalizada para hacer correctamente la inscripción, aunque el trámite en sí siempre lo completa el apoderado directamente ante el MINEDUC.</p>
    `,
    faqs: [
      { q: "¿La inscripción a examen libre tiene costo?", a: "No, la inscripción ante el MINEDUC es 100% gratuita." },
      { q: "¿Quién hace el trámite si el estudiante es menor de edad?", a: "El adulto responsable (apoderado), directamente en el Portal de Ayuda MINEDUC." },
    ],
  },
  {
    slug: "ansiedad-escolar-y-aula-tradicional",
    title: "Ansiedad escolar: rendir mejor sin exposición constante",
    desc: "Para algunos estudiantes, la exposición social permanente del aula es un costo diario que no tiene relación con cuánto saben. Qué cambia en un formato sin esa exposición.",
    date: "2026-06-30",
    body: `
      <h2>Un costo invisible del aula tradicional</h2>
      <p>Levantar la mano y equivocarse frente a 30 personas, ser evaluado socialmente todo el día, no tener un momento realmente propio — para un estudiante con ansiedad escolar, ese costo social diario compite directamente con la capacidad de concentrarse en el contenido.</p>
      <h2>Qué cambia sin esa exposición constante</h2>
      <p>Estudiar sin público reduce la carga emocional que antecede al aprendizaje. El estudiante puede equivocarse en una práctica autocorregida, repetir sin que nadie lo note, y solo mostrar su avance cuando está listo para hacerlo.</p>
      <h2>Lo que hay que tener claro</h2>
      <p>Esto no reemplaza apoyo psicológico cuando se necesita — es un cambio de formato, no un tratamiento. Lo que sí resuelve es que la exposición social ya no sea una barrera diaria para poder estudiar.</p>
    `,
    faqs: [
      { q: "¿Estudiar online resuelve la ansiedad escolar por sí solo?", a: "No reemplaza apoyo profesional, pero sí elimina la exposición social constante que puede agravar los síntomas durante el estudio." },
      { q: "¿El estudiante pierde interacción social por completo?", a: "El formato asincrónico quita la exposición forzada del aula, pero no impide que la familia gestione instancias sociales por otras vías." },
    ],
  },
  {
    slug: "paes-despues-de-cuarto-medio",
    title: "PAES después de 4° medio: qué necesitas y cuándo",
    desc: "Con la licencia de enseñanza media en mano, la PAES es el siguiente paso. Qué se necesita y cuándo conviene empezar a prepararla.",
    date: "2026-07-03",
    body: `
      <h2>La licencia es el requisito, no el fin</h2>
      <p>Tener la licencia de enseñanza media (por examen libre o colegio tradicional) habilita para rendir la PAES y postular a educación superior a través del sistema centralizado de admisión chileno.</p>
      <h2>Cuándo conviene empezar a prepararla</h2>
      <p>Idealmente, la preparación de contenidos PAES se solapa con el último tramo de 3° y 4° medio — no es algo que se improvisa en las últimas semanas antes de la prueba. Las bases de matemática y comprensión lectora que se consolidan en el plan común son la misma base que evalúa la PAES.</p>
      <h2>Qué rol cumple aquí un colegio online bien estructurado</h2>
      <p>Un temario completo y bien dominado en 3° y 4° medio (sin vacíos arrastrados) es la mejor preparación indirecta para la PAES — llegar sin lagunas es más valioso que un curso de preparación intensivo de último momento.</p>
    `,
    faqs: [
      { q: "¿Se puede rendir la PAES sin licencia de enseñanza media?", a: "No, la licencia es un requisito para inscribirse y postular a través del sistema de admisión." },
      { q: "¿Barkley prepara directamente para la PAES?", a: "Barkley prepara el temario oficial de 1° básico a 4° medio bajo Aprendizaje por Dominio, lo que da una base sólida para la PAES sin ser un preuniversitario dedicado a ella." },
    ],
  },
  {
    slug: "adulto-acompanante-examenes-libres-basica",
    title: "Adulto Acompañante en exámenes libres de básica",
    desc: "En los primeros niveles de básica, el Adulto Acompañante cumple un rol clave. Qué se espera de esa persona y cómo cambia con los años.",
    date: "2026-07-07",
    body: `
      <h2>Por qué se necesita en los primeros niveles</h2>
      <p>En 1° y 2° básico, el niño está recién consolidando lectoescritura y las primeras operaciones — necesita a un adulto presente casi todo el tiempo de estudio, no como profesor, sino como guía y compañía durante la lección.</p>
      <h2>Cómo cambia el rol con los años</h2>
      <p>De 3° a 4° básico, el adulto empieza a soltar: acompaña el inicio de la jornada y supervisa el resto del día. De 5° en adelante, el rol pasa a ser principalmente de supervisión — revisar avances y estar disponible si el estudiante lo necesita, no sentado al lado todo el tiempo.</p>
      <h2>Qué entrega la plataforma para facilitar este rol</h2>
      <p>Guías paso a paso para el adulto en los niveles iniciales, y un Portal Familia donde se ve el avance real del estudiante en tiempo real, sin necesidad de estar presente físicamente para saber cómo va.</p>
    `,
    faqs: [
      { q: "¿El Adulto Acompañante necesita conocimientos de la materia?", a: "No, su rol es de guía y compañía, no de enseñar el contenido — eso lo entrega la plataforma con video y pódcast." },
      { q: "¿Hasta qué nivel se necesita Adulto Acompañante presente?", a: "La necesidad de presencia constante disminuye progresivamente desde 1° hasta 4° básico; de 5° en adelante el rol es principalmente de supervisión." },
    ],
  },
  {
    slug: "educacion-asincronica-que-es",
    title: "Educación asincrónica: qué es y por qué crece",
    desc: "La educación asincrónica separa el aprendizaje del horario fijo. Qué es exactamente, y por qué colegios en EE.UU. y Reino Unido ya la usan hace años.",
    date: "2026-07-11",
    body: `
      <h2>La definición simple</h2>
      <p>Educación asincrónica significa que el contenido no se entrega en tiempo real (como una clase de Zoom a la que hay que conectarse a una hora fija), sino en formatos que el estudiante consume cuando puede: video grabado, pódcast, lectura, práctica autocorregida.</p>
      <h2>No es lo mismo que "clases online"</h2>
      <p>Muchos colegios online en Chile simplemente trasladaron la sala de clases a Zoom, manteniendo el horario fijo. Eso sigue siendo síncrono — solo cambió la ubicación, no el problema del tiempo compartido obligatorio.</p>
      <h2>Por qué ya existe en otros países</h2>
      <p>Colegios online acreditados de EE.UU. como Acellus Academy, y plataformas como Edmentum o Apex Learning en EE.UU. y Reino Unido, llevan años operando bajo este modelo con estudiantes de todas las edades — incluyendo a los más pequeños, con el adulto acompañante cumpliendo un rol similar al que describimos en Barkley.</p>
      <h2>Por qué crece ahora en Chile</h2>
      <p>La necesidad de flexibilidad real —para deportistas, adultos que retoman estudios, familias que se mudan seguido, o estudiantes para quienes el aula tradicional no calza— no es nueva, pero recién ahora hay infraestructura (video, evaluación autocorregida, seguimiento en tiempo real) para ofrecerla bien.</p>
    `,
    faqs: [
      { q: "¿Educación asincrónica es lo mismo que clases grabadas nada más?", a: "Incluye clases grabadas, pero también evaluación con reintento, seguimiento de avance y apoyo cuando se necesita — no es solo un video subido." },
      { q: "¿Qué colegios en el mundo usan este modelo?", a: "Acellus Academy en EE.UU. y plataformas como Edmentum/Apex Learning en EE.UU. y Reino Unido son referentes reales de este método con estudiantes de todas las edades." },
    ],
  },
];

function articleHtml(p) {
  const url = `${BASE}/blog/${p.slug}/`;
  // Google corta el title alrededor de los 65 caracteres. El sufijo de marca solo
  // se agrega si cabe; si no, el titular del artículo vale más que repetir la marca.
  const conMarca = `${p.title} | Barkley Online`;
  const title = conMarca.length <= 65 ? conMarca : p.title;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.desc,
    datePublished: p.date,
    dateModified: p.date,
    author: { "@type": "Organization", name: "Barkley Online" },
    publisher: { "@type": "Organization", name: "Barkley Online", logo: { "@type": "ImageObject", url: `${BASE}/og-image.jpg` } },
    mainEntityOfPage: url,
    image: `${BASE}/og-image.jpg`,
  };
  const faqSchema = p.faqs && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: p.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  const crumbs = breadcrumbSchema([
    { name: "Inicio", path: "/" },
    { name: "Blog", path: "/blog/" },
    { name: p.title, path: `/blog/${p.slug}/` },
  ]);

  const otros = POSTS.filter((x) => x.slug !== p.slug).slice(0, 4)
    .map((x) => `<a href="/blog/${x.slug}/">${x.title}</a>`).join("");

  const destinos = (RELACIONADOS[p.slug] || ["guia"])
    .map((k) => DESTINOS[k])
    .filter(Boolean)
    .map((d) => `<a href="${d.href}">${d.label}</a>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="es-CL">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${p.desc}" />
  ${ROBOTS}
  <link rel="canonical" href="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${p.desc}" />
  <meta property="og:type" content="article" />
  <meta property="og:locale" content="es_CL" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${BASE}/og-image.jpg" />
  <meta property="article:published_time" content="${p.date}" />
  <meta name="twitter:card" content="summary_large_image" />
  ${ogExtra(title, p.desc)}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
  ${faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : ""}
  <script type="application/ld+json">${JSON.stringify(crumbs)}</script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Poppins', system-ui, sans-serif; color: ${TEXT}; background: #fff; line-height: 1.7; }
    a { color: inherit; }
    .nav { background: #fff; border-bottom: 1px solid #e8e8e8; padding: 14px 24px; }
    .nav-inner { max-width: 760px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .brand-badge { width: 42px; height: 42px; background: ${NAVY}; border: 2px solid ${GOLD}; border-radius: 8px; color: #fff; font-weight: 800; font-size: 17px; display: flex; align-items: center; justify-content: center; }
    .brand-name { font-weight: 700; color: ${NAVY}; font-size: 15px; line-height: 1.2; }
    .nav-cta { background: ${RED}; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 10px 22px; border-radius: 999px; white-space: nowrap; }
    article { max-width: 760px; margin: 0 auto; padding: 56px 24px 64px; }
    .kicker { color: ${RED}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px; }
    h1 { font-size: clamp(28px, 4.5vw, 42px); font-weight: 800; color: ${NAVY}; line-height: 1.2; margin-bottom: 14px; }
    .meta { font-size: 13.5px; color: #8a8a8a; margin-bottom: 34px; }
    article h2 { color: ${NAVY}; font-size: 22px; font-weight: 700; margin: 34px 0 12px; }
    article p { font-size: 16px; margin-bottom: 4px; }
    .faq-item { border-bottom: 1px solid #e8e8e8; padding: 18px 0; }
    .faq-item b { display: block; color: ${NAVY}; font-size: 15.5px; margin-bottom: 6px; }
    .faq-item p { font-size: 14.5px; }
    .cta-box { background: #f5f5f5; border-radius: 16px; padding: 28px 26px; margin-top: 40px; text-align: center; }
    .cta-box p { font-size: 15.5px; margin-bottom: 16px; }
    .btn-gold { background: ${GOLD}; color: ${NAVY}; text-decoration: none; font-weight: 700; font-size: 15px; padding: 13px 28px; border-radius: 999px; display: inline-block; }
    .otros { border-top: 1px solid #e8e8e8; padding-top: 30px; margin-top: 40px; }
    .otros .lbl { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${TEXT}; margin-bottom: 12px; display: block; }
    .otros a { display: block; font-size: 14.5px; font-weight: 600; color: ${NAVY}; text-decoration: none; padding: 8px 0; }
    .crumbs { font-size: 13px; color: #8a8a8a; margin-bottom: 18px; }
    .crumbs a { color: ${NAVY}; text-decoration: none; font-weight: 600; }
    .crumbs span { margin: 0 7px; }
    .rutas { background: #fff8ea; border-radius: 16px; padding: 24px 26px; margin-top: 40px; }
    .rutas .lbl { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${NAVY}; margin-bottom: 10px; display: block; }
    .rutas a { display: block; font-size: 15px; font-weight: 600; color: ${NAVY}; text-decoration: underline; padding: 7px 0; }
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

  <article>
    <nav class="crumbs" aria-label="Ruta de navegación">
      <a href="/">Inicio</a><span>›</span><a href="/blog/">Blog</a><span>›</span>${p.title}
    </nav>
    <p class="kicker">Blog Barkley Online</p>
    <h1>${p.title}</h1>
    <p class="meta">Publicado el ${new Date(p.date + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}</p>
    ${p.body}

    ${p.faqs ? `
    <h2>Preguntas frecuentes</h2>
    ${p.faqs.map((f) => `<div class="faq-item"><b>${f.q}</b><p>${f.a}</p></div>`).join("")}
    ` : ""}

    <nav class="rutas" aria-label="Páginas relacionadas">
      <span class="lbl">Si esto te sirvió, sigue por acá</span>
      ${destinos}
    </nav>

    <div class="cta-box">
      <p><strong>¿Quieres ver cómo funciona Barkley por dentro?</strong><br>Prueba la demo real de la plataforma, sin costo.</p>
      <a class="btn-gold" href="https://barkley-platform.vercel.app/demo/student">Probar la demo gratis →</a>
    </div>

    <nav class="otros">
      <span class="lbl">Sigue leyendo</span>
      ${otros}
    </nav>
  </article>

  <footer>
    <p>Barkley Online — Colegio 100% asincrónico e inclusivo en Chile · Preparación para Exámenes Libres ante el MINEDUC · <a href="/">barkleyinstituto.cl</a></p>
  </footer>
</body>
</html>
`;
}

function indexHtml() {
  const url = `${BASE}/blog/`;
  const title = "Blog — Exámenes libres, TDAH y dislexia | Barkley";
  const desc = "Artículos sobre exámenes libres MINEDUC, TDAH, dislexia, Aprendizaje por Dominio y educación asincrónica en Chile.";
  const cards = POSTS.map((p) => `
    <a class="card" href="/blog/${p.slug}/">
      <b>${p.title}</b>
      <p>${p.desc}</p>
    </a>
  `).join("");

  const crumbs = breadcrumbSchema([
    { name: "Inicio", path: "/" },
    { name: "Blog", path: "/blog/" },
  ]);

  // ItemList explícito: le dice a Google qué artículos componen el hub y en qué
  // orden, en vez de dejarlo inferir desde los <a> del grid.
  const listSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog Barkley Online",
    url,
    inLanguage: "es-CL",
    publisher: { "@type": "Organization", name: "Barkley Online", url: `${BASE}/` },
    blogPost: POSTS.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.desc,
      datePublished: p.date,
      url: `${BASE}/blog/${p.slug}/`,
    })),
  };

  return `<!DOCTYPE html>
<html lang="es-CL">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  ${ROBOTS}
  <link rel="canonical" href="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="es_CL" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${BASE}/og-image.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  ${ogExtra(title, desc)}
  <script type="application/ld+json">${JSON.stringify(listSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(crumbs)}</script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Poppins', system-ui, sans-serif; color: ${TEXT}; background: #fff; line-height: 1.7; }
    a { color: inherit; }
    .nav { background: #fff; border-bottom: 1px solid #e8e8e8; padding: 14px 24px; }
    .nav-inner { max-width: 1000px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .brand-badge { width: 42px; height: 42px; background: ${NAVY}; border: 2px solid ${GOLD}; border-radius: 8px; color: #fff; font-weight: 800; font-size: 17px; display: flex; align-items: center; justify-content: center; }
    .brand-name { font-weight: 700; color: ${NAVY}; font-size: 15px; line-height: 1.2; }
    .nav-cta { background: ${RED}; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 10px 22px; border-radius: 999px; white-space: nowrap; }
    header.hero { background: ${NAVY}; color: #fff; padding: 56px 24px; text-align: center; }
    header.hero h1 { font-size: clamp(28px, 4.5vw, 42px); font-weight: 800; margin-bottom: 12px; }
    header.hero p { font-size: 16px; color: rgba(255,255,255,0.85); max-width: 640px; margin: 0 auto; }
    .grid { max-width: 1000px; margin: 0 auto; padding: 48px 24px 64px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
    .card { display: block; text-decoration: none; background: #f5f5f5; border-radius: 16px; padding: 24px 22px; transition: background 0.2s; }
    .card:hover { background: #eee; }
    .card b { display: block; color: ${NAVY}; font-size: 16.5px; margin-bottom: 8px; line-height: 1.35; }
    .card p { font-size: 14px; color: ${TEXT}; }
    .niveles { border-top: 1px solid #e8e8e8; padding: 34px 24px 48px; }
    .niveles .inner { max-width: 1000px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .niveles a { font-size: 13.5px; font-weight: 600; color: ${NAVY}; text-decoration: none; background: #f5f5f5; border-radius: 999px; padding: 8px 16px; }
    .niveles .lbl { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${TEXT}; margin-right: 6px; width: 100%; }
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
    <h1>Blog Barkley Online</h1>
    <p>Exámenes libres MINEDUC, TDAH, dislexia, Aprendizaje por Dominio y educación asincrónica — explicado sin vueltas.</p>
  </header>

  <div class="grid">${cards}</div>

  <nav class="niveles" aria-label="Preparación por nivel">
    <div class="inner">
      <span class="lbl">Prepara tu nivel:</span>
      <a href="/guia-examenes-libres/">Guía completa</a>
      <a href="/adaptativo">Adaptativo</a>
      ${["1-basico","2-basico","3-basico","4-basico","5-basico","6-basico","7-basico","8-basico","1-medio","2-medio","3-medio","4-medio"]
        .map((s) => `<a href="/examenes-libres-${s}/">${s.replace("-basico", "° Básico").replace("-medio", "° Medio")}</a>`)
        .join("")}
    </div>
  </nav>

  <footer>
    <p>Barkley Online — Colegio 100% asincrónico e inclusivo en Chile · Preparación para Exámenes Libres ante el MINEDUC · <a href="/">barkleyinstituto.cl</a></p>
  </footer>
</body>
</html>
`;
}

for (const p of POSTS) {
  const dir = join(ROOT, "client", "public", "blog", p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), articleHtml(p));
  console.log(`✓ blog/${p.slug}/index.html`);
}
mkdirSync(join(ROOT, "client", "public", "blog"), { recursive: true });
writeFileSync(join(ROOT, "client", "public", "blog", "index.html"), indexHtml());
console.log(`✓ blog/index.html (hub)`);
console.log(`Listo: ${POSTS.length} artículos generados.`);
