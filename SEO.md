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

## Lo que este bucle NO mide

Importante, porque es la mitad que decide si el SEO sirve:

| No cubierto | Por qué | Dónde se ve |
|---|---|---|
| Clics, impresiones y posiciones | Requiere la API de Search Console | Search Console, a mano |
| Consultas que traen visitas | Ídem | Search Console → Rendimiento |
| Backlinks | Requiere herramienta externa | Ahrefs / Search Console → Enlaces |
| Core Web Vitals reales | Requiere datos de campo | Search Console → Experiencia |

El bucle automatiza la **mitad técnica**: que el sitio esté bien construido y
rastreable. La **mitad de demanda** —si alguien efectivamente llega— se sigue
revisando a mano en Search Console hasta conectar su API.
