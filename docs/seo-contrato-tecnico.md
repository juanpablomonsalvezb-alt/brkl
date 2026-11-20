# Contrato técnico SEO público

## Qué es fuente de verdad y qué no

`scripts/data/public-seo-manifest.json` registra 77 documentos públicos ya
existentes, incluida una landing antigua con noindex. 73 están en sitemap.
La exclusión de sitemap no implica noindex: las páginas legales conservan su
política anterior. El registro no concede acceso ni reemplaza autenticación.

Es la fuente de generación del sitemap del build y el contrato esperado para
canonical, title, description, Open Graph y tipos JSON-LD. **No reescribe ni
inyecta metadatos en runtime**: compara las fuentes de contenido y snapshots con
lo esperado para que no diverjan silenciosamente. PRERENDER_ROUTES sigue siendo
la lista del runtime; el control exige coincidencia exacta entre ella y las
entradas snapshot. No se cambia esa arquitectura en esta tanda.

Las intenciones son categorías editoriales, no keywords ni volúmenes de búsqueda
medidos. `editorialReview: null` significa que el registro no acredita una
revisión profesional. La ruta source identifica el archivo técnico; los enlaces
oficiales y la evidencia editorial siguen en cada página y el mapa de contenidos.

## Comandos (offline, sin backend, sin datos privados)

```sh
# Solo lectura: contrato y equivalencia del sitemap versionado
node scripts/public-seo.mjs --check-sitemap

# Informe JSON con errores, avisos, enlaces y profundidad
node scripts/public-seo.mjs --check-sitemap --json > /tmp/seo-publico.json

# Escribe SOLO el sitemap versionado después de validar el manifiesto
node scripts/public-seo.mjs --write-sitemap

# Pruebas positivas y negativas aisladas
node --test script/tests/seo-contract.test.mjs
npx tsx --test script/tests/public-seo.test.ts
node --test script/tests/public-browser.test.mjs
```

El build publicable ejecuta el contrato antes de Vite y se detiene si hay errores.
Después de copiar assets genera `dist/public/sitemap.xml` desde el manifiesto.
Conserva fechas y destinos declarados: no usa la fecha actual ni fechas del
filesystem. El sitemap versionado se comprueba con `--check-sitemap`; actualizarlo
es explícito. La salida generada puede ordenar URLs de otra forma sin cambiar
su significado. No solicita indexación a Google ni envía pings.

`npm run prerender` permite snapshots intermedios, como antes; no es una salida
publicable por sí sola. Regenerar, revisar el diff, actualizar explícitamente el
contrato si cambió un metadato y volver a ejecutar el build normal.

## Errores que bloquean publicación

- Documento HTML nuevo que no se registró deliberadamente.
- Ruta duplicada, fuente reutilizada o ruta fuera del proyecto.
- Rutas internas/privadas conocidas en el registro público o sitemap.
- Canonical ausente, duplicada o diferente a la URL registrada.
- Title, description u Open Graph diferentes del contrato.
- Noindex accidental, o inclusión de una entrada noindex en sitemap.
- JSON-LD no parseable, tipo registrado ausente o número de H1 distinto de uno.
- Destinos HTML, fragmentos o recursos locales comprobados que no existen.
- Lista de snapshots distinta de las rutas prerender del runtime.

Cambios deliberados requieren revisar fuente Y registro; no se captura
automáticamente el nuevo estado porque eso legitimaría regresiones.

## Avisos, no correcciones automáticas

El grafo parte de la portada y usa enlaces presentes en HTML (incluso menús
cerrados), resolviendo redirecciones locales configuradas. Informa enlaces a
rutas excluidas, redirecciones y páginas no alcanzables. No agrega enlaces ni
elimina contenido para silenciar avisos.

En esta revisión hay seis URLs indexables sin recorrido HTML desde portada:
- /barkley-vs-otros-colegios-online/
- /blog/programa-acsa-violencia-escolar-mineduc/
- /blog/terminar-el-colegio-siendo-adulto/
- /cambiar-de-colegio-ano-nuevo/
- /colegio-online-madres-adolescentes/
- /vacaciones-retroceso-academico/

También se informan tres enlaces desde portada a vistas /plataforma/*, excluidas
de indexación. No significa que esas vistas expongan datos ni que sean un fallo
de autorización. Profundidad máxima HTML observada: cuatro enlaces.

## Límites

El extractor se limita al HTML generado del proyecto; no es un validador general
HTML/XML ni un validador completo de Schema.org o Rich Results. Valida JSON-LD
parseable y tipos presentes, no elegibilidad para resultados enriquecidos.
No revisa todos los srcset, CSS url(), recursos con hash /assets ni enlaces
externos. Vite y las pruebas de navegador aportan comprobaciones complementarias.

No hace solicitudes HTTP al sitio: no acredita 200/301/404 de producción,
latencia, ausencia de soft 404 ni todos los saltos de redirección. Esas pruebas
requieren un entorno HTTP verificable. No mide Core Web Vitals, indexación real,
rankings o citas de IA. No convierte datos internos en contenido público ni
pretende optimizar crawl budget de un sitio masivo.

No hay cambios de diseño ni de lógica renderizada en esta tanda: solo tooling,
registro y sitemap de build semánticamente equivalente. Por eso las capturas
previas corresponden a la revisión visual anterior, no a una nueva interfaz.
