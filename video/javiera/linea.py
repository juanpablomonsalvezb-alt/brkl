"""Línea de tiempo del video de Javiera: quita los silencios y reparte las palabras.

    EP=ep02-brujula python3 video/javiera/linea.py → video/javiera/out/<EP>/linea.json

Cada clip de Flow trae silencio al inicio, al final y pausas largas entre frases.
Se detectan los tramos con voz (silencedetect) y se encadenan dejando solo una
respiración corta. Cada tramo corresponde a una frase del guion (se verifica que
la cantidad coincida); dentro del tramo, las palabras se reparten según su largo
en sílabas aproximadas, suficiente para subtítulos de 2 a 4 palabras.
"""
import json
import os
import re
import subprocess

AQUI = os.path.dirname(os.path.abspath(__file__))
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
EP = os.environ.get("EP", "ep01-umbral")
guion = json.load(open(os.path.join(AQUI, EP, "guion.json"), encoding="utf-8"))
CARPETA = os.path.normpath(os.path.join(AQUI, EP, guion.get("carpeta", ".")))
OUT = os.path.join(AQUI, "out", EP)

ANTES, DESPUES = 0.08, 0.12  # margen de voz que se conserva en cada corte
UMBRAL_DB, SILENCIO_MIN = -35, 0.25


def tramos_con_voz(ruta):
    err = subprocess.run(
        [FFMPEG, "-hide_banner", "-i", ruta, "-af", f"silencedetect=noise={UMBRAL_DB}dB:d={SILENCIO_MIN}", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    dur = float(re.search(r"Duration: (\d+):(\d+):([\d.]+)", err).group(3))
    ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    fin = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    silencios = list(zip(ini, fin + [dur] * (len(ini) - len(fin))))
    tramos, t = [], 0.0
    for a, b in silencios:
        if a - t > 0.05:
            tramos.append((t, a))
        t = b
    if dur - t > 0.05:
        tramos.append((t, dur))
    return tramos


def partir(texto):
    """Texto → trozos cortados en cada signo de puntuación (candidatos a pausa)."""
    return [x.strip() for x in re.findall(r"[^,.:;?!]+[,.:;?!]*", texto) if x.strip()]


HUECOS = []  # pausas internas de frases fundidas; se quitan igual que "quitar"


def emparejar(tramos, frases):
    """Hace calzar tramos de voz con trozos de texto aunque no haya el mismo número:
    agrupa lo que sobra (trozos si hay menos pausas, tramos si hay más) buscando que
    la duración de cada tramo sea proporcional a las sílabas de su texto."""
    import itertools

    sil = [sum(silabas(p) for p in f.split()) for f in frases]
    dur = [b - a for a, b in tramos]
    if len(tramos) == len(frases):
        return tramos, frases

    def mejor(largos, n, objetivo):
        """Cortes de 'largos' en n grupos cuyo total relativo se acerque a 'objetivo'."""
        tot, tobj = sum(largos), sum(objetivo)
        mejor_c, mejor_err = None, 1e9
        for cortes in itertools.combinations(range(1, len(largos)), n - 1):
            b = (0, *cortes, len(largos))
            err = sum((sum(largos[b[i]:b[i + 1]]) / tot - objetivo[i] / tobj) ** 2 for i in range(n))
            if err < mejor_err:
                mejor_c, mejor_err = b, err
        return mejor_c

    if len(tramos) > len(frases):
        b = mejor(dur, len(frases), sil)
        # los silencios entre tramos fundidos también se recortan (se devuelven como huecos)
        for i in range(len(frases)):
            for j in range(b[i], b[i + 1] - 1):
                HUECOS.append((tramos[j][1] + DESPUES, tramos[j + 1][0] - ANTES))
        tramos = [(tramos[b[i]][0], tramos[b[i + 1] - 1][1]) for i in range(len(frases))]
    else:
        b = mejor(sil, len(tramos), dur)
        frases = [" ".join(frases[b[i]:b[i + 1]]) for i in range(len(tramos))]
    return tramos, frases


def silabas(p):
    return max(1, len(re.findall(r"[aeiouáéíóúü]+", p.lower())))


linea = {"fps": guion["fps"], "segmentos": [], "palabras": [], "escenas": []}
t = 0.0
for ic, clip in enumerate(guion["clips"]):
    ruta = os.path.join(CARPETA, clip["archivo"])
    tramos = tramos_con_voz(ruta)
    frases = clip["frases"] if "frases" in clip else partir(clip["texto"])
    HUECOS.clear()
    tramos, frases = emparejar(tramos, frases)
    linea["escenas"].append({"escena": clip["escena"], "desde": round(t, 3)})
    quitar = clip.get("quitar", []) + [h for h in HUECOS if h[1] - h[0] > 0.05]  # repeticiones de Flow + pausas internas
    for jt, ((a, b), frase) in enumerate(zip(tramos, frases)):
        a0, b0 = max(0.0, a - ANTES), b + DESPUES
        piezas = [(a0, b0)]
        for qa, qb in quitar:
            piezas = [p for x, y in piezas for p in ((x, min(y, qa)), (max(x, qb), y)) if p[1] - p[0] > 0.04]
        d = sum(y - x for x, y in piezas)
        tp = t
        for x, y in piezas:
            linea["segmentos"].append({"clip": ic, "archivo": clip["archivo"], "ruta": os.path.relpath(ruta, AQUI), "entrada": round(x, 3), "dur": round(y - x, 3), "desde": round(tp, 3), "tramo": jt})
            tp += y - x
        palabras = frase.split()
        pesos = [silabas(p) + (0.8 if re.search(r"[,.:?]$", p) else 0) for p in palabras]
        voz0, voz = t + ANTES, max(0.2, d - ANTES - DESPUES)
        acc = 0.0
        for p, w in zip(palabras, pesos):
            ini = voz0 + voz * acc / sum(pesos)
            acc += w
            linea["palabras"].append({"p": p, "desde": round(ini, 3), "hasta": round(voz0 + voz * acc / sum(pesos), 3), "clip": ic, "tramo": jt})
        t += d
linea["fin_voz"] = round(t, 3)


def palabra(clip, patron, cual="desde", tramo=None):
    for w in linea["palabras"]:
        if w["clip"] == clip and (tramo is None or w["tramo"] == tramo) and re.match(patron, w["p"]):
            return w[cual]
    raise KeyError(f"no está '{patron}' en el clip {clip + 1}")


# Momentos que animación (escena.html) y sonido (componer.py) comparten, definidos en el guion:
# nombre: [clip, patrón de palabra, "desde"|"hasta", tramo, desfase en s]
linea["eventos"] = {}
for nombre, d in guion.get("eventos", {}).items():
    clip, patron, cual, tramo, mas = list(d) + [None] * (5 - len(d))
    linea["eventos"][nombre] = round(palabra(clip, patron, cual or "desde", tramo) + (mas or 0), 3)
linea["sonidos"] = guion.get("sonidos", {})
linea["salida"] = guion.get("salida", EP + ".mp4")
linea["duracion"] = round(t + guion["cierre"], 3)

os.makedirs(OUT, exist_ok=True)
json.dump(linea, open(os.path.join(OUT, "linea.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(linea['segmentos'])} tramos, voz {linea['fin_voz']} s, total {linea['duracion']} s")
