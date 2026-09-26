"""Diseño sonoro de intro-v3: efectos sincronizados con la animación + base a 120 BPM.

    python3 video/intro/sonido.py  → video/intro/out/sonido-v3.wav (48 kHz, estéreo)

Todo se sintetiza (no hay muestras externas). Los tiempos replican la línea de
tiempo de intro-v3.html; si se mueve una escena allá, hay que moverla acá.
"""
import os
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sawtooth, sosfilt, istft, stft

SR = 48000
DUR = 45.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
AQUI = os.path.dirname(os.path.abspath(__file__))

sfx = np.zeros((2, N))
musica = np.zeros((2, N))
envio = np.zeros((2, N))  # bus de reverberación


def t_arr(d):
    return np.arange(int(SR * d)) / SR


def filtro(x, tipo, f):
    sos = butter(4, f, btype=tipo, fs=SR, output="sos")
    return sosfilt(sos, x)


GOLPES = []  # instantes de impacto, para bajar la música bajo cada uno


def poner(bus, x, t, g=1.0, pan=0.0, rev=0.0):
    i = int(t * SR)
    if i >= N:
        return
    if isinstance(x, Impacto) and bus is sfx:
        GOLPES.append(t)
        g *= 0.62
    x = np.asarray(x)
    x = x[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[0, i : i + len(x)] += x * g * l * 1.414
    bus[1, i : i + len(x)] += x * g * r * 1.414
    if rev:
        envio[0, i : i + len(x)] += x * g * rev
        envio[1, i : i + len(x)] += x * g * rev


def nota(n):
    """Número MIDI → Hz."""
    return 440.0 * 2 ** ((n - 69) / 12)


# ---------------- instrumentos ----------------
def bombo(d=0.42, f0=130, f1=42):
    t = t_arr(d)
    f = f1 + (f0 - f1) * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 7.5)
    click = rng.standard_normal(len(t)) * np.exp(-t * 400) * 0.35
    return np.tanh((x + click) * 1.6)


def impacto_(grande=1.0):
    """Golpe limpio: el peso viene del ataque y del cuerpo medio, no de saturar el grave."""
    d = 0.9 + 0.6 * grande
    t = t_arr(d)
    f = 48 + 70 * np.exp(-t * 12)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (5.5 / grande))
    cuerpo = filtro(rng.standard_normal(len(t)), "bandpass", [140, 700]) * np.exp(-t * 16) * 0.45
    aire = filtro(rng.standard_normal(len(t)), "lowpass", 3000) * np.exp(-t * 11) * 0.3
    ataque = filtro(rng.standard_normal(len(t)), "bandpass", [2000, 7000]) * np.exp(-t * 90) * 0.5
    x = sub * 0.8 + cuerpo + aire + ataque
    x = x * np.minimum(1, t * 2000)
    return x / (np.max(np.abs(x)) + 1e-9)


class Impacto(np.ndarray):
    pass


def impacto(grande=1.0):
    return impacto_(grande).view(Impacto)


def aplauso(d=0.22):
    t = t_arr(d)
    x = np.zeros(len(t))
    for k, off in enumerate([0, 0.011, 0.023]):
        i = int(off * SR)
        seg = rng.standard_normal(len(t) - i) * np.exp(-t[: len(t) - i] * (38 if k < 2 else 16))
        x[i:] += seg
    return filtro(x, "bandpass", [900, 5200]) * 0.8


def hihat(d=0.06, abierto=False):
    t = t_arr(0.24 if abierto else d)
    x = rng.standard_normal(len(t)) * np.exp(-t * (14 if abierto else 70))
    return filtro(x, "highpass", 7000) * 0.6


def barrido(d=0.5, f_ini=300, f_fin=6000, ancho=0.6, subida=0.7):
    """Ruido con banda que se desplaza: 'whoosh'."""
    n = int(SR * d)
    x = rng.standard_normal(n)
    fr, tt, Z = stft(x, fs=SR, nperseg=1024)
    prog = np.clip(tt / d, 0, 1)
    centro = f_ini * (f_fin / f_ini) ** prog
    lf = np.log(np.maximum(fr[:, None], 1.0))
    mascara = np.exp(-((lf - np.log(centro[None, :])) ** 2) / (2 * ancho**2))
    _, y = istft(Z * mascara, fs=SR, nperseg=1024)
    y = y[:n]
    tn = np.arange(n) / n
    env = np.where(tn < subida, (tn / subida) ** 2, np.exp(-(tn - subida) * 9))
    y = y * env
    return y / (np.max(np.abs(y)) + 1e-9)


def clic(f=2600, d=0.03):
    t = t_arr(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 180) + rng.standard_normal(len(t)) * np.exp(-t * 600) * 0.3


def pop(f0=380, f1=900, d=0.14):
    t = t_arr(d)
    f = f0 + (f1 - f0) * (1 - np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26)


def tono_subida(d, n0, n1, brillo=1.0):
    t = t_arr(d)
    f = nota(n0) * (nota(n1) / nota(n0)) ** (t / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.35 * np.sin(2 * ph) * brillo + 0.18 * np.sin(3 * ph) * brillo
    env = (t / d) ** 1.6 * np.minimum(1, (d - t) * 30)
    return x * env * 0.5


def zumbido_error(d=0.42):
    t = t_arr(d)
    x = np.sign(np.sin(2 * np.pi * 98 * t)) + np.sign(np.sin(2 * np.pi * 104 * t))
    x = filtro(x, "lowpass", 1400) * np.exp(-t * 4) * np.minimum(1, t * 200)
    return x * 0.45


def campana(f, d=2.2):
    t = t_arr(d)
    idx = 3.2 * np.exp(-t * 5)
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t)) * np.exp(-t * 2.4)
    return x * 0.55


def pluck(f, d=0.32):
    t = t_arr(d)
    x = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (6 + k * 6)) / k for k in range(1, 6))
    return x * np.minimum(1, t * 900) * 0.5


def bajo(f, d=0.24):
    t = t_arr(d)
    x = sawtooth(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f / 2 * t)
    x = filtro(x, "lowpass", 520) * np.exp(-t * 5) * np.minimum(1, t * 400)
    return x * 0.5


def acorde_pad(notas, d, ataque=0.4):
    t = t_arr(d)
    x = np.zeros(len(t))
    for n in notas:
        for det in (-0.12, 0.0, 0.11):
            x += sawtooth(2 * np.pi * nota(n + det) * t)
    x = filtro(x, "lowpass", 1800) / (len(notas) * 3)
    env = np.minimum(1, t / ataque) * np.minimum(1, (d - t) / 0.3)
    return x * env


def destello(d=1.2):
    x = np.zeros(int(SR * d))
    for _ in range(26):
        i = int(rng.uniform(0, d * 0.8) * SR)
        f = rng.uniform(2400, 6400)
        tt = t_arr(0.18)
        s = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 30) * rng.uniform(0.2, 0.6)
        x[i : i + len(s)] += s[: len(x) - i]
    return x


def remolino(d=1.3):
    y = barrido(d, 200, 2200, 0.5, 0.5)
    t = t_arr(d)[: len(y)]
    return y * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t))


# ---------------- base musical (re mayor, 120 BPM) ----------------
BEAT = 0.5
ACORDES = [(50, [62, 66, 69]), (45, [61, 64, 69]), (47, [62, 66, 71]), (43, [62, 67, 71])]  # D A Bm G
ARPEGIO = [[0, 1, 2, 1, 3, 2, 1, 2], [0, 2, 1, 3, 2, 1, 3, 2]]  # índices sobre las notas del acorde


def compas(t0, i, nivel=1.0, bombo_on=True, melodia=True):
    raiz, pad = ACORDES[i % 4]
    for b in range(4):
        tb = t0 + b * BEAT
        if bombo_on:
            poner(musica, bombo(), tb, 0.9 * nivel)
        if b in (1, 3):
            poner(musica, aplauso(), tb, 0.45 * nivel, pan=0.1, rev=0.25)
        poner(musica, hihat(), tb + BEAT / 2, 0.22 * nivel, pan=0.35)
        for k in range(2):
            poner(musica, bajo(nota(raiz)), tb + k * BEAT / 2, 0.8 * nivel)
    poner(musica, acorde_pad(pad, 4 * BEAT), t0, 0.16 * nivel, rev=0.4)
    if melodia:
        for k in range(8):
            tonos = sorted(pad) + [sorted(pad)[0] + 12]
            n = tonos[ARPEGIO[(i + k) % 2][k]] + 12
            poner(musica, pluck(nota(n)), t0 + k * BEAT / 2, 0.22 * nivel, pan=-0.3 + 0.6 * (k % 2), rev=0.3)


def seccion(t0, t1, nivel, melodia=True):
    i = 0
    t = t0
    while t < t1 - 0.01:
        compas(t, i, nivel, melodia=melodia)
        t += 4 * BEAT
        i += 1


# intro: pulso grave y redoble que acelera hacia la caída de 7.0
poner(musica, tono_subida(3.0, 26, 38, 0.2), 0.0, 0.25)
for k in range(16):
    tb = 5.0 + k * 0.125
    poner(musica, aplauso(0.12), tb, 0.15 + 0.35 * k / 16, pan=0.1)
for k in range(4):
    poner(musica, bombo(), 5.0 + k * BEAT, 0.7)
poner(musica, tono_subida(2.0, 50, 74), 5.0, 0.35, rev=0.3)
poner(musica, barrido(2.0, 200, 9000, 0.9, 0.95), 5.0, 0.35)

seccion(7.0, 11.0, 1.0)
seccion(11.0, 39.0, 0.62)
seccion(41.0, 43.0, 1.0)
# repaso: acordes cortados en cada golpe
for k, (tb, n) in enumerate([(39.0, 62), (39.5, 66), (40.0, 69), (40.5, 74)]):
    poner(musica, acorde_pad([n, n + 4, n + 7], 0.45, 0.01), tb, 0.5, rev=0.4)
    poner(musica, bombo(), tb, 1.0)
# cierre
poner(musica, acorde_pad([50, 62, 66, 69, 74], 1.3, 0.02), 43.7, 0.55, rev=0.6)

# ---------------- efectos sincronizados ----------------
# A · golpes
for tb, g in [(0.5, 0.9), (1.0, 0.9), (1.5, 0.95), (2.0, 1.2)]:
    poner(sfx, impacto(g), tb, 0.8, rev=0.35)
    poner(sfx, barrido(0.25, 3000, 300, 0.7, 0.3), tb - 0.02, 0.25)
poner(sfx, barrido(0.5, 200, 4000, 0.7, 0.9), 0.0, 0.3)
# B · perfiles que vuelan
for i in range(8):
    poner(sfx, barrido(0.5, 500 + i * 120, 5000, 0.5, 0.55), 3.0 + i * 0.22, 0.32, pan=(-1) ** i * 0.5)
# C
poner(sfx, impacto(0.7), 5.0, 0.55, rev=0.3)
for tb in (5.05, 5.3):
    poner(sfx, barrido(0.35, 900, 3500, 0.5, 0.4), tb, 0.3)
poner(sfx, destello(0.8), 5.7, 0.25, rev=0.4)
# D · marca (caída)
poner(sfx, impacto(1.6), 7.0, 1.0, rev=0.6)
poner(sfx, barrido(1.2, 8000, 800, 0.9, 0.05), 7.0, 0.45, rev=0.3)
poner(sfx, tono_subida(0.7, 72, 84), 7.1, 0.3, rev=0.3)
poner(sfx, pop(300, 700, 0.2), 7.5, 0.6)
poner(sfx, barrido(0.8, 400, 6000, 0.6, 0.6), 8.1, 0.35)
poner(sfx, clic(1800), 8.7, 0.4)


def placa(t0, letras, extra=None):
    poner(sfx, barrido(0.4, 400, 7000, 0.6, 0.65), t0 - 0.26, 0.5)
    poner(sfx, impacto(1.1), t0, 0.85, rev=0.45)
    for i in range(letras):
        poner(sfx, clic(1800 + i * 160, 0.025), t0 + 0.05 + i * 0.045 + 0.12, 0.35, pan=-0.6 + 1.2 * i / letras)
    poner(sfx, pop(700, 1500, 0.1), t0 + 0.6, 0.45)
    poner(sfx, barrido(0.3, 800, 9000, 0.6, 0.85), t0 + 1.72, 0.45)


# Vórtice
placa(10.0, 7)
poner(sfx, remolino(1.4), 10.2, 0.3, rev=0.3)
poner(sfx, remolino(1.3), 12.0, 0.4, rev=0.2)
for i in range(6):
    poner(sfx, pop(420 + i * 60, 1000 + i * 90, 0.12), 12.0 + i * 0.06, 0.35, pan=np.cos(i) * 0.6)
poner(sfx, pop(160, 260, 0.3), 12.9, 0.5)
poner(sfx, clic(1200, 0.05), 14.5, 0.7)
poner(sfx, impacto(0.4), 14.5, 0.3)
poner(sfx, tono_subida(2.2, 69, 81, 0.5), 14.2, 0.2)
for tb in (14.6, 15.1):
    poner(sfx, barrido(0.35, 900, 3500, 0.5, 0.4), tb, 0.35)
    poner(sfx, impacto(0.5), tb + 0.05, 0.3)
# Umbral
placa(17.0, 6)
poner(sfx, barrido(0.7, 2000, 9000, 0.3, 0.2), 17.0, 0.35)  # línea láser
poner(sfx, pop(500, 1200, 0.12), 17.6, 0.4)
poner(sfx, tono_subida(1.3, 57, 67), 19.2, 0.45)
poner(sfx, zumbido_error(), 20.6, 0.8)
poner(sfx, impacto(0.8), 20.6, 0.7, rev=0.3)
poner(sfx, tono_subida(0.4, 67, 55, 0.3)[::-1] * 0.8, 21.3, 0.3)
poner(sfx, tono_subida(1.2, 57, 72), 21.7, 0.5)
poner(sfx, impacto(1.3), 22.65, 0.95, rev=0.5)
for k, n in enumerate([86, 90, 93, 98]):
    poner(sfx, campana(nota(n)), 22.65 + k * 0.06, 0.35, pan=-0.4 + k * 0.27, rev=0.5)
poner(sfx, destello(1.3), 22.7, 0.4, rev=0.5)
poner(sfx, clic(1600), 24.1, 0.3)
# Brújula
placa(25.0, 7)
poner(sfx, remolino(1.2), 25.0, 0.35)
for i in range(30):
    poner(sfx, clic(900 + i * 55, 0.02), 27.0 + i * 0.025, 0.22, pan=-0.8 + 1.6 * i / 30)
poner(sfx, barrido(1.6, 600, 1800, 0.4, 0.5), 27.6, 0.18)
poner(sfx, bombo(0.5, 90, 35), 28.8, 0.8)
for tb in (28.9, 30.0, 31.3):
    poner(sfx, impacto(0.9), tb, 0.7, rev=0.35)
    poner(sfx, barrido(0.25, 3000, 400, 0.7, 0.3), tb - 0.05, 0.3)
poner(sfx, barrido(1.2, 500, 7000, 0.6, 0.6), 30.0, 0.35)
poner(sfx, destello(0.9), 30.4, 0.2)
# Together
placa(32.5, 8)
for i in range(18):
    poner(sfx, campana(nota(rng.choice([86, 88, 90, 93, 95])), 0.5), 32.6 + i * 0.1, 0.07, pan=rng.uniform(-0.8, 0.8), rev=0.4)
for i in range(6):
    late = 0.6 if i == 5 else 0
    poner(sfx, pop(360 + i * 50, 900 + i * 80, 0.13), 34.6 + i * 0.1 + late, 0.4, pan=-0.5 + 0.2 * i)
for s in range(5):
    poner(sfx, clic(3200, 0.02), 34.6 + s, 0.25)
poner(sfx, impacto(0.9), 35.6, 0.75, rev=0.35)
poner(sfx, impacto(1.2), 36.8, 0.85, rev=0.45)
poner(sfx, acorde_pad([62, 66, 69, 74], 2.0, 0.05), 36.8, 0.25, rev=0.6)
# repaso
for tb in (39.0, 39.5, 40.0, 40.5):
    poner(sfx, impacto(1.0), tb, 0.8, rev=0.35)
    poner(sfx, barrido(0.22, 3500, 400, 0.7, 0.3), tb - 0.03, 0.3)
# diseñado para cada alumno
poner(sfx, barrido(0.4, 400, 7000, 0.6, 0.65), 40.74, 0.5)
poner(sfx, impacto(1.0), 41.0, 0.7, rev=0.4)
for tb in (41.05, 41.3):
    poner(sfx, barrido(0.35, 900, 3500, 0.5, 0.4), tb, 0.3)
poner(sfx, destello(0.8), 41.8, 0.25, rev=0.4)
# admisión
poner(sfx, barrido(0.4, 400, 7000, 0.6, 0.65), 42.34, 0.55)
poner(sfx, impacto(1.4), 42.6, 0.95, rev=0.5)
poner(sfx, clic(1800), 42.95, 0.35)
# cierre
poner(sfx, impacto(1.8), 43.7, 0.9, rev=0.7)
poner(sfx, pop(500, 1100, 0.14), 43.9, 0.45)
poner(sfx, pop(600, 1300, 0.16), 44.1, 0.5)
for k, n in enumerate([74, 78, 81, 86]):
    poner(sfx, campana(nota(n), 1.0), 44.1 + k * 0.05, 0.18, rev=0.5)

# ---------------- mezcla ----------------
ir_t = t_arr(1.8)
ir = [rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.45) for _ in range(2)]
ir = [filtro(x, "lowpass", 5000) for x in ir]
rev = np.stack([fftconvolve(envio[c], ir[c])[:N] for c in range(2)]) * 0.06

# la música se aparta 0,3 s en cada golpe (ducking)
duck = np.ones(N)
for tg in GOLPES:
    i = int(tg * SR)
    tt = t_arr(0.45)
    curva = 1 - 0.5 * np.exp(-tt / 0.12)
    j = min(N, i + len(tt))
    duck[i:j] = np.minimum(duck[i:j], curva[: j - i])
mezcla = sfx * 0.9 + musica * 0.55 * duck + rev
mezcla = np.stack([filtro(mezcla[c], "highpass", 32) for c in range(2)])
fin = t_arr(0.8)
mezcla[:, -len(fin):] *= np.linspace(1, 0, len(fin))

# limitador: ataque instantáneo, liberación 120 ms, techo -1 dBFS
from scipy.ndimage import maximum_filter1d
from scipy.signal import lfilter
techo = 0.89
nivel = maximum_filter1d(np.max(np.abs(mezcla), axis=0), size=int(0.004 * SR))
rms = np.sqrt(np.mean(mezcla**2))
mezcla = mezcla * (10 ** (-14.5 / 20) / rms)  # nivel promedio objetivo: -14,5 dBFS
nivel = maximum_filter1d(np.max(np.abs(mezcla), axis=0), size=int(0.004 * SR))
ganancia = np.minimum(1.0, techo / np.maximum(nivel, 1e-9))
a = np.exp(-1 / (0.12 * SR))
suave = lfilter([1 - a], [1, -a], 1 - ganancia)
ganancia = np.minimum(ganancia, 1 - suave)
REDUCCION_MAX_DB = -20 * np.log10(np.min(ganancia))
mezcla = np.clip(mezcla * ganancia, -techo, techo)

os.makedirs(os.path.join(AQUI, "out"), exist_ok=True)
ruta = os.path.join(AQUI, "out", "sonido-v3.wav")
with wave.open(ruta, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mezcla.T * 32767).astype("<i2").tobytes())
print(ruta, f"reducción máxima del limitador: {REDUCCION_MAX_DB:.1f} dB")
