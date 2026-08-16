# Bucle de SEO

El SEO no se "termina": se mide, se corrige y se vuelve a medir. Estos cuatro
comandos son ese ciclo.

## El ciclo

```
npm run seo:build    # 1. regenera landings, blog y llms.txt desde sus fuentes
npm run prerender    # 2. actualiza el snapshot que reciben los bots
vercel --prod        # 3. despliega
npm run seo:loop     # 4. audita producción, compara con la corrida anterior y avisa a buscadores
```

O todo junto: `npm run publicar`

## Qué hace cada paso

**`seo:audit`** — 39 controles fijos contra producción. Es determinística: dos
corridas del mismo sitio dan el mismo resultado. Guarda cada corrida en
`seo-history/` y compara con la anterior, marcando tres cosas:

- `ARREGLADO` — algo que fallaba ahora pasa
- `REGRESIÓN` — algo que funcionaba dejó de funcionar (lo más grave)
- `nuevo` — control agregado a la lista

Devuelve código de error si hay fallas, así que sirve como candado antes de
publicar.

**`seo:ping`** — notifica a IndexNow (Bing, Copilot, Yandex) que hay contenido
nuevo, en vez de esperar el rastreo pasivo. Google no participa de IndexNow: ahí
manda el sitemap ya enviado en Search Console.

## Cadencia sugerida

- **Cada vez que se publica algo**: `npm run publicar`
- **Semanal, aunque no se toque nada**: `npm run seo:audit` — detecta lo que se
  rompe solo (un enlace externo que muere, un certificado, un cambio de Vercel)

## Datos de demanda (Search Console)

`npm run seo:gsc` — clics, impresiones, CTR, posición media, qué consultas
traen gente y qué páginas tienen impresiones. Compara contra el período
anterior de la misma duración.

Usa una cuenta de servicio de Google Cloud (`barkley-seo@patagonia-focus`) con
acceso de lectura a la propiedad. La credencial vive en `.gsc-key.json`, está en
`.gitignore` y nunca se sube.

Search Console tiene ~2 días de rezago: el reporte pide hasta hace 3 días para
no devolver ceros.

## Lo que este bucle NO mide

Importante, porque es la mitad que decide si el SEO sirve:

| No cubierto | Por qué | Dónde se ve |
|---|---|---|
| Backlinks | Requiere herramienta externa | Ahrefs / Search Console → Enlaces |
| Core Web Vitals reales | Requiere datos de campo | Search Console → Experiencia |

El bucle cubre ahora la mitad técnica (sitio bien construido) y la de demanda
(si alguien llega). Quedan fuera backlinks y Core Web Vitals de campo, que
requieren herramientas externas.
