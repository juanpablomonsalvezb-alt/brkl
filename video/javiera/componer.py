"""Video final de Javiera (9:16): fondo + Javiera recortada + subtítulos + audio + sello.

    python3 video/javiera/linea.py      # línea de tiempo (out/linea.json)
    node video/javiera/fondo.mjs        # fondo y gráficos (out/fondo.mp4)
    python3 video/javiera/componer.py   # → out/javiera-umbral-9x16.mp4
        --stills 3,12   solo cuadros de prueba (out/comp-*.png)

Requiere el sello ya renderizado en video/intro/out/barkley-sello-9x16.mp4.
"""
import json
import os
import re
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import maximum_filter1d
from scipy.signal import butter, fftconvolve, lfilter, sawtooth, sosfilt

from clave import recortar

AQUI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(AQUI, "out")
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
L = json.load(open(os.path.join(OUT, "linea.json"), encoding="utf-8"))
FPS = L["fps"]
W, H = 1080, 1920
N = int(round(L["duracion"] * FPS))
SELLO = os.path.join(AQUI, "..", "intro", "out", "barkley-sello-9x16.mp4")

# Encuadres alternados en cada corte: (escala, altura de la coronilla en pantalla)
ENCUADRES = [(0.74, 720), (0.86, 690)]
CORONILLA = 285  # px desde arriba en el clip original

# ---------------- subtítulos ----------------
FUENTE = os.path.join(OUT, "poppins-800.ttf")


def bloques():
    """Grupos de hasta 3 palabras, cortando en la puntuación."""
    out, act = [], []
    for w in L["palabras"]:
        if act and (act[-1]["tramo"] != w["tramo"] or act[-1]["clip"] != w["clip"]):
            out.append(act)
            act = []
        act.append(w)
        if len(act) == 3 or re.search(r"[,.:?]$", w["p"]):
            out.append(act)
            act = []
    if act:
        out.append(act)
    for i, b in enumerate(out):
        sig = out[i + 1][0]["desde"] if i + 1 < len(out) else 1e9
        b_fin = min(sig, b[-1]["hasta"] + 0.25)
        yield {"palabras": b, "desde": b[0]["desde"], "hasta": b_fin}


BLOQUES = list(bloques())
_cache = {}


def imagen_bloque(ib, iw):
    if (ib, iw) in _cache:
        return _cache[(ib, iw)]
    b = BLOQUES[ib]["palabras"]
    tam = 74
    while True:
        f = ImageDraw.Draw(Image.new("L", (1, 1)))
        fuente = ImageFont.truetype(FUENTE, tam)
        esp = tam * 0.28
        anchos = [f.textlength(w["p"], font=fuente) for w in b]
        total = sum(anchos) + esp * (len(b) - 1)
        if total <= 940 or tam <= 50:
            break
        tam -= 4
    im = Image.new("RGBA", (int(total) + 60, tam + 70), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x = 30
    for k, (w, a) in enumerate(zip(b, anchos)):
        color = (255, 197, 72, 255) if k == iw else (255, 255, 255, 255)
        d.text((x + 3, 28), w["p"], font=fuente, fill=(0, 0, 0, 150), stroke_width=8, stroke_fill=(0, 0, 0, 150))
        d.text((x, 24), w["p"], font=fuente, fill=color, stroke_width=7, stroke_fill=(8, 14, 30, 255))
        x += a + esp
    _cache[(ib, iw)] = im
    return im


def subtitulo(t):
    for ib, b in enumerate(BLOQUES):
        if b["desde"] - 0.02 <= t < b["hasta"]:
            iw = 0
            for k, w in enumerate(b["palabras"]):
                if t >= w["desde"] - 0.02:
                    iw = k
            im = imagen_bloque(ib, iw)
            k = min(1.0, (t - b["desde"] + 0.02) / 0.14)
            esc = 0.82 + 0.18 * (1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2)
            if esc != 1:
                im = im.resize((max(1, int(im.width * esc)), max(1, int(im.height * esc))), Image.BILINEAR)
            return im
    return None


# ---------------- video ----------------
def lector(args, ancho, alto):
    p = subprocess.Popen([FFMPEG, "-v", "error", *args, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    tam = ancho * alto * 3
    ultimo = None
    while True:
        buf = p.stdout.read(tam)
        if len(buf) < tam:
            break
        ultimo = np.frombuffer(buf, np.uint8).reshape(alto, ancho, 3)
        yield ultimo
    while ultimo is not None:  # si el clip se acaba antes, se repite el último cuadro
        yield ultimo


def cuadros_javiera():
    """Genera (rgb, alfa, escala, y) por cuadro de salida, o None en la placa final."""
    for i, s in enumerate(L["segmentos"]):
        f0, f1 = round(s["desde"] * FPS), round((s["desde"] + s["dur"]) * FPS)
        esc, cor = ENCUADRES[i % 2]
        src = lector(["-ss", str(s["entrada"]), "-t", str(s["dur"] + 0.2), "-i", os.path.join(AQUI, s["archivo"]), "-vf", f"fps={FPS}"], 1080, 1920)
        for _ in range(f1 - f0):
            yield next(src), esc, cor
    ultimo = None
    while True:
        yield ultimo


def componer(stills=None):
    fondo = lector(["-i", os.path.join(OUT, "fondo.mp4")], W, H)
    jav = cuadros_javiera()
    fin_voz_f = round(L["fin_voz"] * FPS)
    ultimo = None
    enc = None
    if not stills:
        enc = subprocess.Popen([FFMPEG, "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                                "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", os.path.join(OUT, "cuerpo-sin-audio.mp4")],
                               stdin=subprocess.PIPE)
    objetivo = {round(s * FPS) for s in stills} if stills else None
    for f in range(N):
        t = f / FPS
        bg = next(fondo).astype(np.float32) / 255.0
        j = next(jav)
        if j is not None and j[0] is not None:
            ultimo = j
        if objetivo is not None and f not in objetivo:
            continue
        frame = bg
        # Javiera: se desvanece al entrar la placa final
        op = 1.0 if f < fin_voz_f else max(0.0, 1 - (f - fin_voz_f) / (0.35 * FPS))
        if ultimo is not None and op > 0:
            src, esc, cor = ultimo
            w2, h2 = int(1080 * esc), int(1920 * esc)
            im = np.asarray(Image.fromarray(src).resize((w2, h2), Image.LANCZOS))
            rgb, a = recortar(im)
            rgb = np.clip((rgb - 0.5) * 1.03 + 0.5, 0, 1) * np.array([0.99, 0.99, 1.01])
            x0, y0 = (W - w2) // 2, int(cor - CORONILLA * esc)
            ya, yb = max(0, y0), min(H, y0 + h2)
            a = a[ya - y0:yb - y0, :, None] * op
            zona = frame[ya:yb, x0:x0 + w2]
            frame[ya:yb, x0:x0 + w2] = rgb[ya - y0:yb - y0] * a + zona * (1 - a)
        img = Image.fromarray((frame * 255).astype(np.uint8))
        sub = subtitulo(t) if f < fin_voz_f else None
        if sub is not None:
            img.paste(sub, ((W - sub.width) // 2, 1390 - sub.height // 2), sub)
        if stills:
            img.save(os.path.join(OUT, f"comp-{str(round(t, 2)).replace('.', '_')}.png"))
        else:
            enc.stdin.write(img.tobytes())
        if f % 120 == 0:
            print(f"cuadro {f}/{N}", flush=True)
    if enc:
        enc.stdin.close()
        enc.wait()


# ---------------- audio ----------------
SR = 48000
rng = np.random.default_rng(5)


def t_arr(d):
    return np.arange(int(SR * d)) / SR


def filtro(x, tipo, fc, orden=4):
    return sosfilt(butter(orden, fc, btype=tipo, fs=SR, output="sos"), x)


def nota(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def norm(x):
    return x / (np.max(np.abs(x)) + 1e-9)


def leer_audio(archivo, desde, dur):
    raw = subprocess.run([FFMPEG, "-v", "error", "-ss", str(desde), "-t", str(dur), "-i", archivo, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.copy()


def audio():
    NA = int(L["duracion"] * SR)
    voz = np.zeros((2, NA))
    # nivel parejo entre clips: se mide la voz de cada clip y se lleva al mismo RMS
    por_clip = {}
    for s in L["segmentos"]:
        x = leer_audio(os.path.join(AQUI, s["archivo"]), s["entrada"], s["dur"])
        por_clip.setdefault(s["clip"], []).append((s, x))
    for clip, partes in por_clip.items():
        todo = np.concatenate([x for _, x in partes], axis=1)
        g = 10 ** (-19 / 20) / (np.sqrt(np.mean(todo**2)) + 1e-9)
        for s, x in partes:
            x = x * g
            n = x.shape[1]
            fade = int(0.012 * SR)
            env = np.ones(n)
            env[:fade] = np.linspace(0, 1, fade)
            env[-fade:] = np.linspace(1, 0, fade)
            i = int(s["desde"] * SR)
            m = min(n, NA - i)
            voz[:, i:i + m] += (x * env)[:, :m]
    voz = filtro(voz, "highpass", 80, 2)

    # música: acordes cálidos y arpegio suave a 96 BPM, siempre por debajo de la voz
    musica = np.zeros((2, NA))
    b = 60 / 96
    acordes = [[50, 54, 57, 62], [47, 50, 54, 59], [43, 47, 50, 55], [45, 49, 52, 57]]  # re, si m, sol, la
    t, k = 0.0, 0
    while t < L["duracion"]:
        d = min(b * 8, L["duracion"] - t) + 0.8
        tt = t_arr(d)
        pad = sum(sawtooth(2 * np.pi * nota(n + det) * tt + rng.uniform(0, 6)) for n in acordes[k % 4] for det in (-0.06, 0.06))
        pad = filtro(pad, "lowpass", 1300) * np.minimum(1, tt / 0.6) * np.minimum(1, (d - tt) / 0.8)
        i = int(t * SR)
        m = min(len(tt), NA - i)
        musica[:, i:i + m] += norm(pad)[:m] * 0.5
        for j in range(16):
            n = acordes[k % 4][j % 4] + 12 * (1 + (j // 4) % 2)
            ta = t_arr(0.5)
            pl = sum(np.sin(2 * np.pi * nota(n) * h * ta) * np.exp(-ta * (7 + h * 5)) / h for h in (1, 2, 3)) * np.minimum(1, ta * 600)
            ii = int((t + j * b / 2) * SR)
            if ii >= NA:
                break
            mm = min(len(ta), NA - ii)
            pan = 0.3 * np.sin(j)
            musica[0, ii:ii + mm] += pl[:mm] * 0.16 * (1 - pan)
            musica[1, ii:ii + mm] += pl[:mm] * 0.16 * (1 + pan)
        t += b * 8
        k += 1
    # la música baja cuando Javiera habla (sidechain suave)
    envv = maximum_filter1d(np.abs(voz).max(axis=0), int(0.05 * SR))
    envv = lfilter([1 - np.exp(-1 / (0.15 * SR))], [1, -np.exp(-1 / (0.15 * SR))], envv)
    duck = 1 - 0.55 * np.clip(envv / 0.05, 0, 1)
    musica = musica * duck * 10 ** (-24 / 20)

    # efectos: barrido en cada escena, "pop" en cada gráfico, campanita al desbloquear
    sfx = np.zeros((2, NA))

    def poner(x, t0, g, pan=0.0):
        i = int(t0 * SR)
        if i < 0 or i >= NA:
            return
        m = min(len(x), NA - i)
        sfx[0, i:i + m] += x[:m] * g * (1 - pan)
        sfx[1, i:i + m] += x[:m] * g * (1 + pan)

    def whoosh(d=0.45):
        tt = t_arr(d)
        x = filtro(rng.standard_normal(len(tt)), "bandpass", [600, 5000], 2)
        return norm(x * np.sin(np.pi * tt / d) ** 2)

    def popp(f0=500, f1=1100):
        tt = t_arr(0.12)
        return np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * (1 - np.exp(-tt * 60))) / SR) * np.exp(-tt * 30)

    def campana(n, d=1.4):
        tt = t_arr(d)
        f = nota(n)
        return np.sin(2 * np.pi * f * tt + 1.6 * np.exp(-tt * 5) * np.sin(2 * np.pi * f * 3.01 * tt)) * np.exp(-tt * 3)

    for e in L["escenas"][1:]:
        poner(whoosh(), e["desde"] - 0.2, 0.05)
    E = L["eventos"]
    for clave in ("nombre", "pregunta", "unidades", "check1", "candado", "intento1", "intento2", "tutor", "ia", "burbuja", "nadie", "cta"):
        poner(popp(), E[clave], 0.07, pan=0.2 * rng.uniform(-1, 1))
    poner(campana(86), E["desbloqueo"], 0.07)
    poner(campana(91, 1.0), E["desbloqueo"] + 0.09, 0.05)
    poner(campana(88), E["aprobado"], 0.06)
    # placa final: golpe suave y brillo
    tt = t_arr(2.5)
    golpe = np.sin(2 * np.pi * np.cumsum(46 + 70 * np.exp(-tt * 12)) / SR) * np.exp(-tt * 2.5)
    poner(norm(golpe), L["fin_voz"], 0.28)
    poner(campana(86, 2.0), L["fin_voz"] + 0.3, 0.06)
    poner(campana(93, 1.6), L["fin_voz"] + 0.42, 0.04)

    mezcla = voz + musica + sfx
    ir_t = t_arr(1.6)
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 4) * 0.02
    mezcla = mezcla + np.stack([fftconvolve(sfx[c] + musica[c] * 0.5, ir)[:NA] for c in range(2)])
    cola = int(0.4 * SR)
    mezcla[:, -cola:] *= np.linspace(1, 0, cola)
    # limitador
    techo = 0.9
    nivel = maximum_filter1d(np.abs(mezcla).max(axis=0), int(0.004 * SR))
    g = np.minimum(1.0, techo / np.maximum(nivel, 1e-9))
    a = np.exp(-1 / (0.1 * SR))
    g = np.minimum(g, 1 - lfilter([1 - a], [1, -a], 1 - g))
    mezcla = np.clip(mezcla * g, -techo, techo)
    ruta = os.path.join(OUT, "cuerpo.wav")
    with wave.open(ruta, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mezcla.T * 32767).astype("<i2").tobytes())
    print("audio", ruta, f"limitador {-20 * np.log10(g.min()):.1f} dB")


def final():
    salida = os.path.join(OUT, "javiera-umbral-9x16.mp4")
    subprocess.run([
        FFMPEG, "-y", "-v", "error", "-i", SELLO, "-i", os.path.join(OUT, "cuerpo-sin-audio.mp4"), "-i", os.path.join(OUT, "cuerpo.wav"),
        "-filter_complex",
        f"[0:v]fps={FPS},settb=AVTB,format=yuv420p[s];[1:v]settb=AVTB,format=yuv420p[c];[s][c]xfade=transition=fade:duration=0.25:offset=3.75[v];"
        "[0:a]aresample=48000[sa];[sa][2:a]acrossfade=d=0.25[a]",
        "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", salida,
    ], check=True)
    print(salida)


if __name__ == "__main__":
    if "--stills" in sys.argv:
        componer([float(x) for x in sys.argv[sys.argv.index("--stills") + 1].split(",")])
    else:
        componer()
        audio()
        final()
