"""Diseño sonoro del tráiler: dron, tic de reloj, golpes graves en cada producto y cierre.

    python3 video/trailer/sonido_trailer.py  → video/trailer/out/sonido.wav (48 kHz, estéreo)

Todo se sintetiza. Los tiempos salen de edl.json (inicio de cada toma), así que
si se mueve el montaje, el sonido lo sigue.
"""
import json
import os
import wave

import numpy as np
from scipy.ndimage import maximum_filter1d
from scipy.signal import butter, fftconvolve, lfilter, sawtooth, sosfilt

SR = 48000
AQUI = os.path.dirname(os.path.abspath(__file__))
edl = json.load(open(os.path.join(AQUI, "edl.json"), encoding="utf-8"))
DUR = edl["duracion"]
N = int(SR * DUR)
rng = np.random.default_rng(11)

inicios, t = [], 0.0
for toma in edl["tomas"]:
    inicios.append((t, toma))
    t += toma["dur"]
PRODUCTOS = [a for a, x in inicios if x.get("titulo")]
RAPIDAS = [a for a, x in inicios if x.get("rapida")]
RETRATO = next(a for a, x in inicios if x["clip"] == "retrato")
FINAL = next(a for a, x in inicios if x.get("final"))
ENTRADA = PRODUCTOS[0]  # primer producto: el golpe grande ("Llega un colegio distinto")

sfx = np.zeros((2, N))
musica = np.zeros((2, N))
envio = np.zeros((2, N))


def t_arr(d):
    return np.arange(int(SR * d)) / SR


def filtro(x, tipo, f, orden=4):
    return sosfilt(butter(orden, f, btype=tipo, fs=SR, output="sos"), x)


def nota(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def poner(bus, x, t, g=1.0, pan=0.0, rev=0.0):
    i = int(t * SR)
    if i >= N:
        return
    x = np.asarray(x)[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[0, i : i + len(x)] += x * g * l * 1.414
    bus[1, i : i + len(x)] += x * g * r * 1.414
    if rev:
        envio[:, i : i + len(x)] += x * g * rev


def norm(x):
    return x / (np.max(np.abs(x)) + 1e-9)


def barrido_filtro(x, corte, tipo="lowpass"):
    """Filtro que se mueve en el tiempo sin clics: mezcla versiones fijas según la frecuencia de corte."""
    fijas = np.geomspace(80, 12000, 14)
    versiones = [filtro(x, tipo, [f * 0.7, min(f * 1.4, 20000)] if tipo == "bandpass" else f, 2) for f in fijas]
    pos = np.interp(np.log(np.clip(corte, fijas[0], fijas[-1])), np.log(fijas), np.arange(len(fijas)))
    i0 = np.floor(pos).astype(int)
    i1 = np.minimum(i0 + 1, len(fijas) - 1)
    w = pos - i0
    V = np.stack(versiones)
    idx = np.arange(len(x))
    return V[i0, idx] * (1 - w) + V[i1, idx] * w


# ---------------- instrumentos ----------------
def braam(d=3.2, raiz=33):
    """Metales graves de tráiler: sierras desafinadas, filtro que se abre y se cierra."""
    tt = t_arr(d)
    x = np.zeros(len(tt))
    for n, g in ((raiz, 1.0), (raiz + 12, 0.55), (raiz + 7, 0.35)):
        for det in (-0.15, 0.0, 0.13):
            x += sawtooth(2 * np.pi * nota(n + det) * tt) * g
    corte = 180 + 1400 * np.exp(-tt * 2.2) * np.minimum(1, tt * 30)
    y = barrido_filtro(x, corte)
    env = np.minimum(1, tt * 25) * np.exp(-tt * (1.4 / d * 2))
    return norm(np.tanh(y * env * 1.3))


def golpe(grande=1.0):
    """Impacto limpio: sub, cuerpo, ataque. El peso viene del cuerpo, no de saturar."""
    d = 1.0 + 1.2 * grande
    tt = t_arr(d)
    f = 42 + 80 * np.exp(-tt * 10)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * (3.2 / grande))
    cuerpo = filtro(rng.standard_normal(len(tt)), "bandpass", [120, 650]) * np.exp(-tt * 12) * 0.5
    ataque = filtro(rng.standard_normal(len(tt)), "bandpass", [1800, 8000]) * np.exp(-tt * 70) * 0.45
    cola = filtro(rng.standard_normal(len(tt)), "lowpass", 900) * np.exp(-tt * 2.5) * 0.12 * grande
    return norm((sub * 0.85 + cuerpo + ataque + cola) * np.minimum(1, tt * 2000))


def tic(f=3100):
    tt = t_arr(0.05)
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 220) + rng.standard_normal(len(tt)) * np.exp(-tt * 900) * 0.4
    return filtro(x, "highpass", 1200)


def subida(d, f0=200, f1=5000):
    """Ruido que sube de altura y volumen: 'riser'."""
    tt = t_arr(d)
    k = tt / d
    c = f0 * (f1 / f0) ** k
    y = barrido_filtro(rng.standard_normal(len(tt)), c, "bandpass")
    tono = sum(np.sin(2 * np.pi * np.cumsum(nota(n) * 2 ** (k * 1.0)) / SR) for n in (45, 52, 57)) / 3
    return norm((norm(y) * 0.7 + tono * 0.35) * k**2.2)


def whoosh(d=0.35):
    tt = t_arr(d)
    x = filtro(rng.standard_normal(len(tt)), "bandpass", [500, 5000], 2)
    env = np.sin(np.pi * np.minimum(1, tt / d)) ** 2
    return norm(x * env)


def reverso(d=1.0):
    """Golpe invertido que 'aspira' hacia el corte."""
    return golpe(0.8)[: int(SR * d)][::-1] * np.linspace(0, 1, int(SR * d)) ** 2


def dron(d, notas, brillo=500):
    tt = t_arr(d)
    x = np.zeros(len(tt))
    for n in notas:
        for det in (-0.08, 0.0, 0.07):
            x += sawtooth(2 * np.pi * nota(n + det) * tt + rng.uniform(0, 6))
    x = filtro(x, "lowpass", brillo) / (len(notas) * 3)
    trem = 0.85 + 0.15 * np.sin(2 * np.pi * 0.25 * tt)
    return x * trem * np.minimum(1, tt / 2.0) * np.minimum(1, (d - tt) / 1.0)


def pulso(f, d=0.22):
    tt = t_arr(d)
    x = filtro(sawtooth(2 * np.pi * f * tt) + np.sin(2 * np.pi * f / 2 * tt), "lowpass", 400)
    return x * np.exp(-tt * 9) * np.minimum(1, tt * 300)


def piano(n, d=4.0):
    f = nota(n)
    tt = t_arr(d)
    x = sum(np.sin(2 * np.pi * f * k * tt) * np.exp(-tt * (0.9 + k * 0.9)) / k**1.3 for k in range(1, 7))
    return x * np.minimum(1, tt * 600) * 0.5


def cuerdas(notas, d, ataque=1.5):
    tt = t_arr(d)
    x = np.zeros(len(tt))
    for n in notas:
        for det in (-0.1, -0.03, 0.04, 0.1):
            vib = 0.004 * np.sin(2 * np.pi * 5.2 * tt + rng.uniform(0, 6))
            x += sawtooth(2 * np.pi * np.cumsum(nota(n + det) * (1 + vib)) / SR)
    x = filtro(x, "lowpass", 2400) / (len(notas) * 4)
    return x * np.minimum(1, tt / ataque) * np.minimum(1, (d - tt) / 0.8)


# ---------------- apertura en frío (0 → ENTRADA) ----------------
# Re menor: dron grave + tic de reloj que se acelera hacia el golpe.
poner(musica, dron(ENTRADA + 0.4, [26, 38, 45], 380), 0.0, 0.55, rev=0.3)
t = 0.4
paso = 1.0
while t < ENTRADA - 0.9:
    poner(sfx, tic(3100 if int(t / paso) % 2 else 2500), t, 0.22, pan=0.25 if int(t) % 2 else -0.25, rev=0.4)
    t += paso
    if t > 6.0:
        paso = max(0.28, paso * 0.86)
poner(musica, piano(62, 5.0), 0.6, 0.18, rev=0.6)   # "Durante años…"
poner(musica, piano(65, 5.0), 5.6, 0.18, rev=0.6)   # "Pero nadie…"
poner(musica, piano(69, 4.0), 7.8, 0.14, rev=0.6)
poner(sfx, subida(2.4, 150, 6000), ENTRADA - 2.4, 0.42, rev=0.2)
poner(sfx, reverso(0.9), ENTRADA - 0.9, 0.35)
poner(sfx, golpe(1.4), ENTRADA - 0.1, 0.72, rev=0.45)       # corte a negro → "Llega un colegio distinto"
poner(sfx, braam(4.0, 26), ENTRADA - 0.1, 0.6, rev=0.3)

# ---------------- productos ----------------
# Base rítmica: pulso de bajo a 100 BPM desde el primer producto hasta el montaje rápido.
BPM = 100
b = 60 / BPM
fin_productos = RAPIDAS[0]
progresion = [26, 26, 22, 24]  # re, re, sib, do (graves)
k = 0
t = ENTRADA
while t < fin_productos - 0.05:
    raiz = progresion[(k // 8) % 4]
    poner(musica, pulso(nota(raiz + 12)), t, 0.5 if k % 2 == 0 else 0.3)
    if k % 4 == 2:
        poner(sfx, tic(4200), t, 0.08, pan=0.4)
    t += b / 2
    k += 1
acordes = [[50, 53, 57], [50, 53, 57], [46, 50, 53], [48, 52, 55]]
t = ENTRADA
k = 0
while t < fin_productos:
    d = min(b * 16, fin_productos - t)
    poner(musica, cuerdas(acordes[k % 4], d + 0.6, 1.2), t, 0.34 + 0.02 * k, rev=0.35)
    t += b * 16
    k += 1

for i, a in enumerate(PRODUCTOS):
    if i > 0:
        poner(sfx, whoosh(0.4), a - 0.3, 0.3, pan=-0.3 if i % 2 else 0.3)
        poner(sfx, golpe(0.9 + 0.05 * i), a, 0.7, rev=0.4)
        poner(sfx, braam(2.8, 26 if i < 4 else 29), a, 0.42 + 0.02 * i, rev=0.25)

# ---------------- montaje rápido: tensión creciente ----------------
poner(sfx, subida(RAPIDAS[-1] + 0.6 - RAPIDAS[0], 250, 7000), RAPIDAS[0], 0.35)
poner(musica, cuerdas([50, 57, 62, 65], RAPIDAS[-1] + 0.6 - RAPIDAS[0] + 0.3, 0.3), RAPIDAS[0], 0.42, rev=0.3)
for i, a in enumerate(RAPIDAS):
    poner(sfx, golpe(0.6), a, 0.5 + 0.035 * i, pan=0.25 * (-1) ** i, rev=0.3)
    poner(sfx, whoosh(0.22), a - 0.18, 0.2, pan=-0.25 * (-1) ** i)
    poner(musica, pulso(nota(38), 0.3), a, 0.7)
    poner(musica, pulso(nota(38), 0.3), a + 0.3, 0.45)

# ---------------- respiro + retrato + cierre ----------------
# Silencio con una sola nota sobre el retrato; golpe final con cola larga en la placa.
poner(sfx, golpe(1.2), RETRATO, 0.65, rev=0.6)
poner(musica, piano(62, 6.0), RETRATO + 0.05, 0.3, rev=0.8)
poner(musica, piano(69, 5.0), RETRATO + 1.1, 0.2, rev=0.8)
poner(musica, cuerdas([50, 57, 62, 66], FINAL - RETRATO + 3.0, 1.2), RETRATO + 0.4, 0.28, rev=0.5)  # re mayor
poner(sfx, reverso(0.8), FINAL - 0.8, 0.3)
poner(sfx, golpe(1.6), FINAL, 0.55, rev=0.6)
poner(sfx, braam(DUR - FINAL, 26), FINAL, 0.34, rev=0.3)
poner(musica, piano(74, 3.0), FINAL + 0.8, 0.14, rev=0.8)

# ---------------- mezcla ----------------
ir_t = t_arr(3.2)
ir = rng.standard_normal((2, len(ir_t))) * np.exp(-ir_t * 2.0)
ir = np.stack([filtro(c, "lowpass", 5000) for c in ir]) * 0.035
rev = np.stack([fftconvolve(envio[c], ir[c])[:N] for c in range(2)])

# la música baja bajo cada golpe (ducking) para que el impacto se sienta sin subir el nivel
golpes = [ENTRADA - 0.1, *PRODUCTOS[1:], *RAPIDAS, RETRATO, FINAL]
duck = np.ones(N)
for g in golpes:
    i = int(g * SR)
    d = t_arr(0.6)
    seg = 1 - 0.4 * np.exp(-d * 6)
    duck[i : i + len(seg)] = np.minimum(duck[i : i + len(seg)], seg[: N - i])

mezcla = sfx + musica * duck + rev
mezcla = filtro(mezcla, "highpass", 28, 2)
cola = int(1.2 * SR)
mezcla[:, -cola:] *= np.linspace(1, 0, cola) ** 2

techo = 0.89
rms = np.sqrt(np.mean(mezcla**2))
mezcla = mezcla * (10 ** (-15.0 / 20) / rms)
nivel = maximum_filter1d(np.max(np.abs(mezcla), axis=0), size=int(0.004 * SR))
ganancia = np.minimum(1.0, techo / np.maximum(nivel, 1e-9))
a = np.exp(-1 / (0.12 * SR))
suave = lfilter([1 - a], [1, -a], 1 - ganancia)
ganancia = np.minimum(ganancia, 1 - suave)
reduccion = -20 * np.log10(np.min(ganancia))
import sys
if "--diag" in sys.argv:
    g = 20 * np.log10(ganancia)
    for s in range(int(DUR)):
        m = g[s * SR:(s + 1) * SR].min()
        if m < -2: print(s, f"{m:.1f}")
mezcla = np.clip(mezcla * ganancia, -techo, techo)

os.makedirs(os.path.join(AQUI, "out"), exist_ok=True)
ruta = os.path.join(AQUI, "out", "sonido.wav")
with wave.open(ruta, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mezcla.T * 32767).astype("<i2").tobytes())
print(ruta, f"reducción máxima del limitador: {reduccion:.1f} dB", "RMS final:",
      f"{20 * np.log10(np.sqrt(np.mean(mezcla**2))):.1f} dBFS")
