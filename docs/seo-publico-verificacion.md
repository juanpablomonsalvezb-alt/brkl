# Correcciones SEO públicas

## Alcance

No cambian el motor pedagógico, el manifiesto curricular, autenticación, bases
ni configuración de Vercel. No confundir noindex con protección de datos.
No se ejecutan migraciones ni seeds para generar o comprobar estas páginas.

## Generación sin backend

```sh
npx vite build
npx tsx script/prerender.ts
npx tsx --test script/tests/public-seo.test.ts
node --test script/tests/public-browser.test.mjs
npm run build
```

El prerender solo inicia Vite Preview y bloquea peticiones API y externas desde
Chromium. Usa respuestas FAQ públicas de respaldo cuando no hay API. Actualiza
los 19 snapshots, incluso `/en/support`, en dist y en el directorio versionado.
El FAQ remoto sigue pudiendo actualizar el contenido de la página en ejecución.

El build normal rechaza snapshots faltantes, sin contenido, con noindex o con
huella de fuentes obsoleta. Para romper la dependencia circular, `npm run
prerender` permite usar snapshots viejos durante su build intermedio, pero el
siguiente build normal siempre los valida. No se debe publicar esa salida
intermedia sin regenerar y volver a compilar.

La huella incluye cliente y shared; es deliberadamente conservadora. Un cambio
en esos archivos exige volver a generar snapshots. No incluye credenciales,
bases de datos ni el contenido de los propios snapshots.

## Pruebas y límites

- Pruebas de lista positiva pública, fallback noindex y snapshots incompletos.
- FAQ inicial con respuestas y JSON-LD en la misma página; una entidad de marca.
- Canonical y metadatos sociales propios; enlaces iniciales de navegación.
- Calendario y regeneración de landings en un directorio temporal.
- TypeScript tiene 8 diagnósticos preexistentes; comparar con la base, no ocultarlos.
- No se afirma mejora de Core Web Vitals ni indexación: requieren mediciones.

## Pendientes que requieren otra decisión o evidencia

1. Validación institucional de la estadística de aprobación 92 % (2023–2025),
   sus denominadores y su relación con el lanzamiento. No se inventa respaldo.
2. Revisión pedagógica/editorial de todos los indicadores extraídos de PDF.
   Se excluye el indicador malformado detectado, sin editar el manifiesto del motor.
3. Las fuentes de generadores y algunos HTML curados ya divergían. No ejecutar
   `seo:build` indiscriminadamente: revisar el diff generado. Las fechas antiguas
   del generador de niveles y del artículo de inscripción sí se corrigieron.
4. Revisar controles HTTP y autenticación privados por separado. app.html ahora
   incluye noindex inicial; robots.txt y vercel.json permanecen sin cambios.
   Una URL bloqueada en robots puede impedir que un crawler vea su noindex.
5. No crear páginas locales repetidas ni direcciones ficticias. La identidad
   legal, equipo, autorías y fuentes deben ser confirmados por la institución.
6. Verificar cobertura, redirecciones y Core Web Vitals con datos actuales antes
   de nuevas decisiones de arquitectura o rendimiento.

## Fuente de calendario

Calendario 2026 de menores de 18 años revisado el 16 de noviembre de 2026:
https://www.ayudamineduc.cl/ficha/examenes-libres-menores-de-18-anos-11/
El tercer período inscribe del 12 de mayo al 17 de julio. No se extrapolan fechas
2026 a 2027. El módulo compartido solo describe información pública; no programa
evaluaciones ni cambia fechas de estudiantes.
