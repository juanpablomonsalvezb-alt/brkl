"""Línea de tiempo del video de Javiera: quita los silencios y reparte las palabras.

    python3 video/javiera/linea.py → video/javiera/out/linea.json

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
guion = json.load(open(os.path.join(AQUI, "guion.json"), encoding="utf-8"))

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


def silabas(p):
    return max(1, len(re.findall(r"[aeiouáéíóúü]+", p.lower())))


linea = {"fps": guion["fps"], "segmentos": [], "palabras": [], "escenas": []}
t = 0.0
for ic, clip in enumerate(guion["clips"]):
    ruta = os.path.join(AQUI, clip["archivo"])
    tramos = tramos_con_voz(ruta)
    frases = clip["frases"]
    if len(tramos) != len(frases):
        # si no calzan, se funden los tramos y se reparten todas las palabras juntas
        print(f"aviso: clip {ic + 1} tiene {len(tramos)} tramos y {len(frases)} frases; se reparte por largo")
        tramos, frases = [(tramos[0][0], tramos[-1][1])], [" ".join(frases)]
    linea["escenas"].append({"escena": clip["escena"], "desde": round(t, 3)})
    for jt, ((a, b), frase) in enumerate(zip(tramos, frases)):
        a0, b0 = max(0.0, a - ANTES), b + DESPUES
        d = b0 - a0
        linea["segmentos"].append({"clip": ic, "archivo": clip["archivo"], "entrada": round(a0, 3), "dur": round(d, 3), "desde": round(t, 3), "tramo": jt})
        palabras = frase.split()
        pesos = [silabas(p) + (0.8 if re.search(r"[,.:?]$", p) else 0) for p in palabras]
        voz0, voz = t + ANTES, (b - a)
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


# Momentos que animación (escena.html) y sonido (sonido.py) comparten.
linea["eventos"] = {
    "nombre": palabra(0, "soy"),
    "pregunta": palabra(0, r"¿Sabes"),
    "unidades": palabra(1, "En"),
    "sigue": palabra(1, "sigue"),
    "vacio": palabra(1, "entendido"),
    "check1": palabra(2, "Barkley"),
    "candado": palabra(2, "Umbral"),
    "barra": palabra(2, "hasta"),
    "desbloqueo": palabra(2, r"aprendiendo", "hasta"),
    "intento1": palabra(3, r"evaluación"),
    "repasa": palabra(3, "repasas"),
    "intento2": palabra(3, r"rendir"),
    "aprobado": palabra(3, r"rendir", "hasta") + 0.5,
    "tutor": palabra(4, "tutor"),
    "ia": palabra(4, "IA"),
    "burbuja": palabra(4, "no", tramo=2),
    "nadie": palabra(5, "nadie"),
    "cta": palabra(5, "Reserva"),
}
linea["duracion"] = round(t + guion["cierre"], 3)

os.makedirs(os.path.join(AQUI, "out"), exist_ok=True)
json.dump(linea, open(os.path.join(AQUI, "out", "linea.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(linea['segmentos'])} tramos, voz {linea['fin_voz']} s, total {linea['duracion']} s")
