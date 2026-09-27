# Javiera · Documento madre

Todo lo necesario para seguir produciendo videos con **Javiera**, la presentadora
de Barkley, en cualquier sesión nueva. Para retomar, pídele a Claude: *"lee
`video/javiera/DOCUMENTO-MADRE.md` y hagamos un nuevo episodio sobre X"*.

---

## 1. Quién es Javiera

| | |
|---|---|
| Nombre | **Javiera** |
| Rol | Tutora de Barkley (presentadora de los videos de redes) |
| Edad aparente | 36–38 años |
| Cuerpo | Estatura media (~1,63 m), contextura normal y saludable; una mujer real, no modelo |
| Rostro | Facciones suaves, ojos café cálidos, cejas naturales, sonrisa genuina, maquillaje mínimo |
| Pelo | Castaño oscuro, ondas suaves, a la altura de los hombros, suelto y ordenado |
| Voz | Español con acento chileno neutro, ritmo pausado, tono cálido y seguro |
| Postura | Erguida pero relajada, levemente inclinada hacia la cámara, gestos de manos abiertos |

**Por qué este perfil** (criterios de marketing acordados):
- En educación pesa primero la **calidez** y después la competencia; nada de estética de modelo o de influencer.
- Debe parecerse al público que decide la matrícula: apoderados chilenos, mayoritariamente madres de 30 a 50 años.
- A los 32–42 años se ve con experiencia y a la vez como par de los apoderados.
- Siempre se declara como presentadora generada con IA. Lo exigen TikTok e Instagram, y además cuida la confianza.

### Vestuario
- **Principal (su "uniforme")**: sweater de punto crema de cuello redondo sobre camisa blanca con el cuello visible, aros pequeños dorados y pantalón azul marino. Sin collar, reloj ni anillos.
- **Variación formal** (admisión, precios): blazer azul marino liviano sobre polera blanca lisa y aros dorados.
- **Variación cercana** (Together, familias): camisa de lino beige con las mangas arremangadas y aros dorados.
- **Reglas**: paleta Barkley (azul marino, crema o beige, blanco, detalles dorados). Sin estampados, rayas finas ni cuadros, que "vibran" en video. Sin logos ajenos. Los aros dorados van siempre.

---

## 2. Cómo se generan sus clips (Google Flow / Veo 3)

1. En Flow ya existe el **retrato de referencia** de Javiera. Úsalo siempre como "Ingredients" para mantener la misma cara.
2. Cada clip dura unos 8–10 s y cabe **una frase de ~15–20 palabras**. Con frases más cortas, la boca sale mejor sincronizada.
3. Se graba con **fondo verde**, que después se reemplaza en el montaje.
4. Genera 2–3 variaciones por frase y elige las de **voz más parecida entre sí**. Es el punto débil de Flow: a veces cambia la voz entre clips.

### Prompt base (cambiar el GESTO y la FRASE)
```
Use the reference image as the exact same woman, Javiera, same face, same hair, same clothes: a warm Chilean woman aged 36 to 38 with shoulder-length dark brown wavy hair, wearing a cream crew-neck knit sweater over a white collared shirt and small gold stud earrings. Vertical 9:16, medium shot from the waist up, static camera. Background: a flat, evenly lit chroma-key green backdrop, no shadows on the background, clean edges around the hair. She looks directly into the camera and speaks warmly and calmly, with natural small head movements, natural blinking and GESTO. She says in Spanish, with a neutral Chilean accent, at a relaxed pace: "FRASE" Clean dialogue audio, no music, no room echo. Photorealistic, natural skin texture, accurate lip sync, natural hands. No text, no captions, no logos, no watermarks.
```
Gestos que funcionaron: `a friendly small wave at the start` (saludo), `one open palm gesture as if presenting an idea`, `a calm, relaxed hand gesture`, `a gentle hand-on-heart gesture`, `ends with a small friendly nod` (cierre).

### Prompt del retrato (por si hay que regenerarlo)
```
Photorealistic portrait of Javiera, a warm, approachable Chilean woman aged 36 to 38, an online school tutor. Average height and a natural, healthy average build, a real-looking woman, not a model. Upright but relaxed posture, loose shoulders, leaning very slightly toward the camera as if in a friendly conversation. Soft facial features, warm brown eyes, natural eyebrows, a genuine smile that reaches her eyes, minimal natural makeup. Shoulder-length dark brown hair with soft natural waves, worn down and neat. Short natural nails. Wearing a cream crew-neck knit sweater over a white collared shirt with the collar visible, small gold stud earrings, no necklace, no watch, no rings, navy trousers. Medium shot from the waist up, looking directly into the camera. Cinematic 35mm film look, shallow depth of field, soft natural film grain, teal-and-amber color grade with deep navy-blue shadows and warm golden highlights, soft warm key light from the front. Natural skin texture, natural hands. Vertical 9:16. No text, no logos, no watermarks.
```

### Subir los clips
- Página de subida: **https://github.com/juanpablomonsalvezb-alt/brkl/upload/main-8o37ot/video/javiera**
- Rama: **`main-8o37ot`**, nunca `main`, porque `main` publica el sitio.
- Máximo 25 MB por archivo desde el navegador.
- Los nombres automáticos de Flow sirven; el orden se define en `guion.json`. Para cada episodio nuevo conviene una subcarpeta (ver §5).

---

## 3. Episodio 1 · "Umbral: nadie avanza sin entender" (hecho)

Resultado: `out/javiera-umbral-9x16.mp4`, 40 s en 9:16, 24 fps, con audio, ~26 MB. Enviado al usuario.
`out/` no se sube al repositorio; se regenera con los comandos de §4.

| # | Clip (archivo de Flow) | Frase | Escena gráfica |
|---|---|---|---|
| 1 | `Woman_speaking_about_student_pro…_20260927135712.mp4` | Hola, soy Javiera, tutora de Barkley. ¿Sabes por qué tantos alumnos avanzan sin entender? | Tarjeta "JAVIERA · Tutora Barkley" → "¿Avanzan sin entender?" |
| 2 | `Woman_speaking_about_traditional…_1080p_20260927135731.mp4` | En el colegio tradicional, el curso sigue aunque tú no hayas entendido la unidad anterior. | Cinta de unidades que avanza sola; aparecen vacíos rojos "?" |
| 3 | `Woman_speaking_about_learning_pr…_20260927135736.mp4` | En Barkley es distinto. Umbral no te deja avanzar hasta que dominas lo que estás aprendiendo. | Escalera de unidades; candado de Umbral™ que se abre al llegar al 70% |
| 4 | `Woman_speaking_in_green_room_20260927135740.mp4` | Si una evaluación te cuesta, la repasas y la vuelves a rendir, a tu ritmo y sin presión. | Intento 1: 58% → "Repasas" → Intento 2: 86% ✓ |
| 5 | `Woman_speaking_warmly_in_Spanish_20260927135741.mp4` | Y si te trabas, no estás solo: tu tutor y la IA Barkley te ayudan a entender, no a copiar. | Tarjetas "Tutor humano" e "IA Barkley", burbuja "Te ayudo a entender, no a copiar." |
| 6 | `Woman_speaking_in_Spanish_1080p_20260927135751.mp4` | Así nadie queda atrás. Reserva tu cupo sin costo en nuestro sitio web. | "Nadie queda atrás." + botón "Reserva tu cupo sin costo" |

Estructura: **sello de marca de 4 s** → Javiera (33 s de voz) → **placa final de 3,2 s** (logo, "Colegio online · 100% asincrónico", www.barkleyinstituto.cl, "Admisión 2027 · Cupos limitados").

Pendiente de confirmar por el usuario: que los subtítulos coincidan palabra por palabra con lo que dice Javiera (se tomaron del guion, ver §6).

---

## 4. Cómo funciona el montaje (técnico)

### Archivos (`video/javiera/`)
| Archivo | Qué hace |
|---|---|
| `<episodio>/guion.json` | Carpeta de los clips, orden, texto de cada clip (`texto`: el programa empareja solo pausas y puntuación; o `frases` si se quiere control exacto), escena, **eventos** (momentos de cada animación) y **sonidos** |
| `<episodio>/escena.html` | Gráficos del episodio (se parte copiando el de otro episodio) |
| `linea.py` | Detecta los tramos con voz de cada clip (`silencedetect`, -35 dB, ≥0,25 s), elimina los silencios dejando 0,08 s antes y 0,12 s después, reparte las palabras por sílabas y calcula los **eventos** (momentos de cada animación). Genera `out/linea.json` |
| `escena.html` | Fondo "estudio Barkley" (azul marino, rayos, halo cálido, polvo dorado), etiqueta "Presentadora generada con IA", gráficos de cada escena y placa final. Se controla con `window.preparar(linea)` y `window.render(t)` |
| `fondo.mjs` | Renderiza `escena.html` cuadro a cuadro → `out/fondo.mp4` (`--stills 3,9` para pruebas) |
| `clave.py` | Recorte del verde por **dominancia de verde** (g − max(r, b); umbrales 18/48). No depende del brillo, que en Flow varía entre las esquinas y el centro. Incluye limpieza del verde reflejado en bordes y pelo |
| `componer.py` | Pone a Javiera sobre el fondo, alternando encuadres en cada corte (escala 0,74 y 0,86), agrega subtítulos (bloques de hasta 3 palabras, palabra actual en dorado #FFC548, Poppins 800), audio (voz con nivel parejo por clip, música en re mayor a 96 BPM que baja cuando ella habla, efectos en cada gráfico) y une con el sello mediante un fundido de 0,25 s. `--stills 3,12` para pruebas |

### Dependencias externas
- **Sello de marca**: `video/intro/out/barkley-sello-9x16.mp4`, que no está en el repositorio. Se regenera con `video/intro/sello.html` + `video/intro/sonido_sello.py` (ver comandos).
- **Logos**: `video/intro/vectores/barkley-logos.js`, generado desde `client/public/logos/`.
- **Fuentes**: `video/intro/fonts/` (Poppins woff2). Los subtítulos necesitan TTF: se convierten con fonttools hacia `out/poppins-700.ttf` y `out/poppins-800.ttf`.

### Comandos (desde la raíz del repo)
```bash
export FFMPEG=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
export PUPPETEER_EXECUTABLE_PATH=/opt/pw-browsers/chromium

# 0) Solo si falta el sello (video/intro/out/barkley-sello-9x16.mp4)
SUB=4 node video/intro/render.mjs --file sello.html --vertical
python3 video/intro/sonido_sello.py
cd video/intro/out && $FFMPEG -y -i sello-vertical-1080x1920.mp4 -i sonido-sello.wav -map 0:v -map 1:a \
  -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 256k -shortest barkley-sello-9x16.mp4 && cd -

# 0b) Solo si faltan las fuentes TTF para subtítulos
pip install fonttools brotli
mkdir -p video/javiera/out && python3 -c "
from fontTools.ttLib import TTFont
for w in (700,800):
    f=TTFont(f'video/intro/fonts/poppins-latin-{w}-normal.woff2'); f.flavor=None; f.save(f'video/javiera/out/poppins-{w}.ttf')"

# 1) Línea de tiempo → 2) fondo → 3) composición final
export EP=ep02-brujula          # o ep01-umbral
python3 video/javiera/linea.py
node video/javiera/fondo.mjs
cd video/javiera && python3 componer.py      # → out/<EP>/<salida del guion>
```
Tiempos aproximados: fondo ~3 min, composición ~3 min. Los mensajes "Broken pipe" / "Error muxing a packet" al final son normales: se cierran los lectores de clips.

---

## 4b. Episodios
- `ep01-umbral/`: hecho (los clips están en `video/javiera/`, por eso `"carpeta": ".."`).
- `ep02-brujula/`: hecho (41 s). Vestuario **blazer azul marino + polera blanca**. Clips `brujula-01.mp4` … `brujula-06.mp4` (Flow entregó el 3 y el 4 intercambiados; se detectó por gestos y pausas).
- `ep03-vortice/`: hecho (45 s). Vestuario **blusa blanca lisa de manga larga**. El clip 6 original ("Reserva tu cupo…" + "Vórtice:") fue rechazado por Flow por políticas; se usó "Tu año completo, ordenado en un solo lugar. Conoce más sobre Barkley en nuestra página." y el botón de reserva va en el gráfico. En los prompts se agregó *"saying each word only once with no repeated words or syllables"* para evitar repeticiones.
- `ep04-together/`: hecho (34 s, 5 clips). Vestuario **camisa de mezclilla clara abierta sobre polera blanca** (casual). El clip 2 original ("No es falta de ganas…") fue rechazado por Flow; se usó "Es normal. Cuando otras personas estudian cerca, es más fácil mantener el foco."
- Desde el ep. 4, `linea.py` también recorta las pausas internas cuando funde varios tramos en una frase (si se re-renderizan ep. 2 y 3 quedan algo más ágiles que las versiones entregadas).

## 5. Cómo hacer un episodio nuevo

1. **Guion**: 5–7 frases de 15–20 palabras. Estructura que funcionó:
   - gancho o pregunta;
   - problema del colegio tradicional;
   - solución Barkley (el concepto);
   - cómo se vive;
   - no estás solo;
   - llamado a la acción ("Reserva tu cupo sin costo…").
2. **Clips en Flow** con el prompt base (§2), fondo verde y el mismo vestuario (o una variación de §1).
3. **Subirlos** a una subcarpeta nueva, por ejemplo `video/javiera/ep02-brujula/`.
4. **Generalizar el montaje** para varios episodios (hoy está armado para el episodio 1):
   - `guion.json` por episodio (ruta de los clips, frases, escenas);
   - en `linea.py`, los **eventos** son específicos de Umbral: definirlos por episodio dentro de su guion;
   - en `escena.html`, las escenas gráficas son las de Umbral; crear las del nuevo tema;
   - salida con el nombre del episodio.
5. **Probar con `--stills`** antes de renderizar el video completo.

Ideas de próximos episodios, con los fundamentos y diferenciadores de Barkley:
- **Brújula™**: tu ritmo, recalculado cada semana.
- **Vórtice™**: todo tu año en un solo lugar.
- **Together™**: estudias solo, pero no estás solo.
- **Programa Adaptativo**: TDAH, dislexia y TEA.
- **Portal Familia**: sabes cómo va, sin vigilar.
- **Exámenes Libres**: cómo se valida el año.
- **Precios**: escolar $65.000 y adultos $55.000 mensuales, de marzo a octubre. La fuente única es `shared/precios.ts`.

---

## 6. Limitaciones conocidas y decisiones

- **Sin transcripción automática.** La red del entorno bloquea Hugging Face y los modelos de voz, así que los subtítulos salen del texto del guion, repartido por sílabas. Si Flow cambia alguna palabra, el subtítulo no coincide: hay que corregir la frase en `guion.json`.
- **Palabras repetidas por Flow** (ej. "cada, cada"): se quitan con `"quitar": [[inicio, fin]]` en el clip del guion (segundos del clip original). Para ubicarlas sin escuchar se usa autosimilitud del espectrograma: dos trozos seguidos casi idénticos = repetición; el corte se alinea al mínimo de energía.
- **El orden y las frases de cada clip** se validan comparando la cantidad de pausas del audio con la puntuación de la frase. Si no coinciden, `linea.py` avisa y reparte las palabras en un solo bloque.
- **No se puede generar video de personas** en este entorno. Los clips los genera el usuario en Flow y el montaje lo hace Claude.
- **Plataforma**: solo formato **9:16** para redes (preferencia del usuario).
- **Transparencia**: la etiqueta "Presentadora generada con IA" va siempre en pantalla; se recomienda también en la descripción del post.
- **Siguiente mejora sugerida**: una prueba A/B con dos presentadores (Javiera y un presentador hombre) con el mismo guion, midiendo la retención en TikTok durante 7 días.
