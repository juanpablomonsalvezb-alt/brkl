"""Diseño sonoro de intro-v4 (explosión de color): marimba, resortes, confeti y base alegre a 120 BPM.

    python3 video/intro/sonido_v4.py  → video/intro/out/sonido-v4.wav (48 kHz, estéreo)

Todo sintetizado. Los tiempos replican la línea de tiempo de intro-v4.html.
"""
import os
import wave

import numpy as np
from scipy.ndimage import maximum_filter1d
from scipy.signal import butter, fftconvolve, istft, lfilter, sawtooth, sosfilt, stft

SR = 48000
DUR = 45.0
N = int(SR * DUR)
rng = np.random.default_rng(21)
AQUI = os.path.dirname(os.path.abspath(__file__))

sfx = np.zeros((2, N))
musica = np.zeros((2, N))
envio = np.zeros((2, N))
GOLPES = []


def t_arr(d):
    return np.arange(int(SR * d)) / SR


def filtro(x, tipo, f):
    return sosfilt(butter(4, f, btype=tipo, fs=SR, output="sos"), x)


def nota(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def poner(bus, x, t, g=1.0, pan=0.0, rev=0.0, golpe=False):
    i = int(t * SR)
    if i >= N or i < 0:
        return
    x = np.asarray(x)[: N - i]
    if golpe:
        GOLPES.append(t)
    l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    bus[0, i : i + len(x)] += x * g * l
    bus[1, i : i + len(x)] += x * g * r
    if rev:
        envio[:, i : i + len(x)] += x * g * rev


# ---------------- instrumentos ----------------
def marimba(f, d=0.45):
    t = t_arr(d)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 22)
    mazo = filtro(rng.standard_normal(len(t)), "bandpass", [1500, 5000]) * np.exp(-t * 300) * 0.25
    return (x + mazo) * np.minimum(1, t * 2000) * 0.6


def boing(f0=220, f1=520, d=0.42):
    t = t_arr(d)
    base = f0 + (f1 - f0) * (1 - np.exp(-t * 18))
    f = base * (1 + 0.12 * np.sin(2 * np.pi * 16 * t) * np.exp(-t * 7))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * np.minimum(1, t * 800) * 0.55


def pop(f0=420, f1=1100, d=0.12):
    t = t_arr(d)
    f = f0 + (f1 - f0) * (1 - np.exp(-t * 70))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30)


def golpe_suave(peso=1.0):
    d = 0.7 + 0.3 * peso
    t = t_arr(d)
    f = 55 + 80 * np.exp(-t * 16)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7 / peso)
    palma = filtro(rng.standard_normal(len(t)), "bandpass", [900, 4500]) * np.exp(-t * 40) * 0.6
    x = sub * 0.8 + palma
    return x / (np.max(np.abs(x)) + 1e-9)


def barrido(d=0.45, f_ini=300, f_fin=6000, ancho=0.6, subida=0.7):
    n = int(SR * d)
    x = rng.standard_normal(n)
    fr, tt, Z = stft(x, fs=SR, nperseg=1024)
    prog = np.clip(tt / d, 0, 1)
    centro = f_ini * (f_fin / f_ini) ** prog
    mascara = np.exp(-((np.log(np.maximum(fr[:, None], 1.0)) - np.log(centro[None, :])) ** 2) / (2 * ancho**2))
    _, y = istft(Z * mascara, fs=SR, nperseg=1024)
    y = y[:n]
    tn = np.arange(n) / n
    y = y * np.where(tn < subida, (tn / subida) ** 2, np.exp(-(tn - subida) * 9))
    return y / (np.max(np.abs(y)) + 1e-9)


def silbato(n0, n1, d=0.35):
    t = t_arr(d)
    f = nota(n0) * (nota(n1) / nota(n0)) ** (t / d) * (1 + 0.01 * np.sin(2 * np.pi * 6 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t * 60) * np.minimum(1, (d - t) * 20) * 0.35


def wahwah():
    x = np.zeros(int(SR * 1.0))
    for k, (n, d) in enumerate([(58, 0.22), (57, 0.22), (56, 0.5)]):
        t = t_arr(d)
        s = sawtooth(2 * np.pi * nota(n) * t)
        corte = 500 + 1400 * (0.5 + 0.5 * np.sin(2 * np.pi * 3 * t - np.pi / 2))
        y = np.zeros(len(t))
        for j in range(0, len(t), 480):
            y[j : j + 480] = filtro(s[j : j + 480], "lowpass", float(np.mean(corte[j : j + 480])))
        env = np.minimum(1, t * 40) * np.minimum(1, (d - t) * 25)
        i = int(sum(dd for _, dd in [(58, 0.22), (57, 0.22)][:k]) * SR)
        x[i : i + len(t)] += y * env * 0.45
    return x


def campana(f, d=1.4):
    t = t_arr(d)
    return np.sin(2 * np.pi * f * t + 2.2 * np.exp(-t * 5) * np.sin(2 * np.pi * f * 3.5 * t)) * np.exp(-t * 3) * 0.5


def confeti_sonido(d=1.2):
    x = np.zeros(int(SR * d))
    t = t_arr(0.18)
    x[: len(t)] += filtro(rng.standard_normal(len(t)), "bandpass", [600, 6000]) * np.exp(-t * 25) * 0.9
    for _ in range(60):
        i = int(rng.uniform(0.02, d * 0.9) * SR)
        c = t_arr(0.012)
        s = filtro(rng.standard_normal(len(c)), "highpass", 3000) * np.exp(-c * 400) * rng.uniform(0.1, 0.35)
        x[i : i + len(s)] += s[: len(x) - i]
    return x


def paso():
    t = t_arr(0.06)
    return filtro(rng.standard_normal(len(t)), "lowpass", 900) * np.exp(-t * 80) * 0.7


def plumon(d=1.2):
    y = barrido(d, 1800, 3200, 0.25, 0.5)
    t = t_arr(d)[: len(y)]
    return y * (0.6 + 0.4 * np.sin(2 * np.pi * 11 * t))


def remolino(d=1.3):
    y = barrido(d, 250, 2500, 0.5, 0.5)
    return y * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t_arr(d)[: len(y)]))


def tic():
    t = t_arr(0.025)
    return np.sin(2 * np.pi * 3000 * t) * np.exp(-t * 200)


# ---------------- base musical (do mayor, 120 BPM) ----------------
BEAT = 0.5
ACORDES = [(36, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])]  # C G Am F


def bombo():
    t = t_arr(0.35)
    f = 45 + 90 * np.exp(-t * 30)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 1.3)


def palmas():
    t = t_arr(0.2)
    x = sum(np.concatenate([np.zeros(int(o * SR)), rng.standard_normal(len(t) - int(o * SR))]) for o in (0, 0.01, 0.022))
    return filtro(x * np.exp(-t * 26), "bandpass", [900, 5500]) * 0.6


def maraca():
    t = t_arr(0.05)
    return filtro(rng.standard_normal(len(t)), "highpass", 6000) * np.exp(-t * 90) * 0.5


def bajo(f, d=0.22):
    t = t_arr(d)
    x = filtro(sawtooth(2 * np.pi * f * t) + np.sin(2 * np.pi * f * t), "lowpass", 700)
    return x * np.exp(-t * 7) * np.minimum(1, t * 500) * 0.55


PATRON = [[0, 1, 2, 1, 3, 2, 1, 2], [2, 1, 0, 1, 2, 3, 2, 1]]


def compas(t0, i, nivel):
    raiz, ac = ACORDES[i % 4]
    tonos = sorted(ac) + [sorted(ac)[0] + 12]
    for b in range(4):
        tb = t0 + b * BEAT
        poner(musica, bombo(), tb, 0.85 * nivel)
        if b in (1, 3):
            poner(musica, palmas(), tb, 0.5 * nivel, pan=0.12, rev=0.25)
        for k in range(4):
            poner(musica, maraca(), tb + k * BEAT / 4, (0.18 if k % 2 else 0.1) * nivel, pan=0.4)
        poner(musica, bajo(nota(raiz)), tb, 0.8 * nivel)
        poner(musica, bajo(nota(raiz + 12)), tb + BEAT / 2, 0.45 * nivel)
    for k in range(8):
        n = tonos[PATRON[i % 2][k]] + 12
        poner(musica, marimba(nota(n)), t0 + k * BEAT / 2, 0.3 * nivel, pan=-0.35 + 0.7 * (k % 2), rev=0.3)


def seccion(t0, t1, nivel):
    i, t = 0, t0
    while t < t1 - 0.01:
        compas(t, i, nivel)
        t += 4 * BEAT
        i += 1


seccion(3.0, 7.0, 0.55)
seccion(7.0, 11.0, 1.0)
seccion(11.0, 39.0, 0.6)
seccion(41.0, 43.0, 1.0)
for tb, n in [(39.0, 60), (39.5, 64), (40.0, 67), (40.5, 72)]:
    for m in (n, n + 4, n + 7):
        poner(musica, marimba(nota(m), 0.5), tb, 0.35, rev=0.4)
    poner(musica, bombo(), tb, 1.0)
for m in (48, 60, 64, 67, 72, 76):
    poner(musica, marimba(nota(m), 1.4), 43.7, 0.28, rev=0.6)
    poner(musica, campana(nota(m + 12), 1.4), 43.72, 0.08, rev=0.6)

# ---------------- efectos ----------------
ESCALA = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96]


def letras(t0, n, paso_t, g=0.22, base=0):
    for i in range(n):
        poner(sfx, marimba(nota(ESCALA[(base + i) % len(ESCALA)] + 12), 0.25), t0 + i * paso_t + 0.06, g, pan=-0.6 + 1.2 * i / max(1, n - 1))


def iris(t):
    poner(sfx, barrido(0.35, 400, 7000, 0.6, 0.8), t - 0.05, 0.45)


# A · golpes
for k, (tb, palabra) in enumerate([(0.35, "No"), (0.85, "todos"), (1.35, "aprenden"), (1.85, "igual.")]):
    iris(tb)
    poner(sfx, golpe_suave(1.0 + 0.3 * (k == 3)), tb, 0.75, rev=0.3, golpe=True)
    letras(tb, len(palabra), 0.04, 0.2, base=k * 2)
for i in range(6):
    poner(sfx, pop(500 + i * 80, 1300 + i * 100), 0.4 + i * 0.35, 0.35, pan=np.cos(i * 1.3) * 0.7)
# B · personajes
iris(3.0)
letras(3.1, 14, 0.03, 0.14)
for i in range(8):
    poner(sfx, boing(200 + i * 25, 480 + i * 45), 3.5 + i * 0.12, 0.4, pan=-0.7 + 0.2 * i)
letras(5.4, 10, 0.03, 0.14, base=3)
# C · marca
poner(sfx, golpe_suave(1.6), 7.0, 0.9, rev=0.5, golpe=True)
poner(sfx, confeti_sonido(1.6), 7.0, 0.55, rev=0.3)
poner(sfx, boing(160, 420, 0.5), 7.15, 0.5)
letras(7.5, 7, 0.05, 0.25, base=2)
for i in range(3):
    poner(sfx, pop(600 + i * 100, 1400 + i * 120), 8.4 + i * 0.15, 0.4)


def placa(t0, t1, n):
    iris(t0)
    poner(sfx, golpe_suave(1.2), t0, 0.8, rev=0.35, golpe=True)
    letras(t0 + 0.1, n, 0.05, 0.26, base=1)
    poner(sfx, pop(900, 1800, 0.1), t0 + 0.6, 0.35)
    poner(sfx, pop(500, 1000, 0.14), t0 + 0.75, 0.35)
    poner(sfx, silbato(84, 64, 0.3), t1 - 0.3, 0.45)
    iris(t1)


# Vórtice
placa(10.0, 11.8, 7)
poner(sfx, remolino(1.4), 11.8, 0.4, rev=0.2)
for i in range(6):
    poner(sfx, pop(420 + i * 70, 1000 + i * 100), 11.85 + i * 0.07, 0.35, pan=np.cos(i) * 0.6)
poner(sfx, boing(150, 330, 0.5), 12.2, 0.45)
for i in range(6):
    poner(sfx, tic(), 13.9 + i * 0.05, 0.3)
poner(sfx, golpe_suave(0.5), 14.4, 0.4, golpe=True)
letras(14.6, 11, 0.03, 0.18)
letras(15.1, 14, 0.03, 0.18, base=4)
# Umbral
placa(17.0, 18.8, 6)
poner(sfx, pop(500, 900), 18.9, 0.35)
poner(sfx, boing(180, 360), 19.0, 0.4)
for i in range(10):
    poner(sfx, marimba(nota(60 + ESCALA[i] - 60), 0.2), 19.3 + i * 0.12, 0.18)
poner(sfx, wahwah(), 20.6, 0.8)
poner(sfx, boing(300, 150, 0.4), 20.6, 0.35)
poner(sfx, silbato(79, 60, 0.35), 21.35, 0.3)
for i in range(12):
    poner(sfx, marimba(nota(ESCALA[i] + 12), 0.2), 21.7 + i * 0.1, 0.18)
poner(sfx, golpe_suave(1.4), 22.65, 0.9, rev=0.4, golpe=True)
poner(sfx, confeti_sonido(1.8), 22.65, 0.6, rev=0.3)
for k, n in enumerate([72, 76, 79, 84, 88]):
    poner(sfx, campana(nota(n + 12)), 22.65 + k * 0.07, 0.25, pan=-0.5 + 0.25 * k, rev=0.5)
letras(22.7, 18, 0.025, 0.14, base=5)
poner(sfx, pop(700, 1300), 24.1, 0.3)
# Brújula
placa(25.0, 26.8, 7)
poner(sfx, remolino(1.2), 25.2, 0.35)
poner(sfx, plumon(1.2), 27.0, 0.3)
for i in range(7):
    poner(sfx, pop(600 + i * 60, 1200 + i * 80, 0.1), 27.3 + i * 0.12, 0.3)
for k in range(8):
    poner(sfx, paso(), 27.4 + k * 0.18, 0.5, pan=-0.3 + 0.08 * k)
poner(sfx, boing(260, 120, 0.45), 28.8, 0.5, golpe=True)
letras(28.8, 15, 0.025, 0.14)
for k, n in enumerate([76, 72]):
    poner(sfx, campana(nota(n), 0.6), 30.0 + k * 0.18, 0.3)
poner(sfx, golpe_suave(0.8), 30.0, 0.55, golpe=True)
letras(30.0, 13, 0.025, 0.14, base=4)
poner(sfx, plumon(0.9), 30.0, 0.25)
poner(sfx, pop(500, 1200, 0.14), 30.6, 0.45)
for k in range(7):
    poner(sfx, paso(), 30.9 + k * 0.18, 0.5, pan=0.3 - 0.08 * k)
poner(sfx, golpe_suave(0.9), 31.3, 0.6, golpe=True)
letras(31.3, 16, 0.025, 0.14, base=2)
# Together
placa(32.5, 34.3, 8)
for i in range(6):
    poner(sfx, boing(220 + i * 30, 480 + i * 50, 0.35), 34.4 + i * 0.1 + (0.5 if i == 5 else 0), 0.35, pan=-0.5 + 0.2 * i)
poner(sfx, pop(700, 1300), 34.7, 0.3)
for s in range(5):
    poner(sfx, tic(), 34.6 + s, 0.25)
for i in range(10):
    poner(sfx, campana(nota(int(rng.choice([84, 88, 91, 96]))), 0.4), 34.8 + i * 0.4, 0.05, pan=rng.uniform(-0.7, 0.7), rev=0.4)
poner(sfx, golpe_suave(0.9), 35.6, 0.6, golpe=True)
letras(35.6, 13, 0.03, 0.14)
poner(sfx, golpe_suave(1.1), 36.8, 0.7, golpe=True)
letras(36.8, 16, 0.03, 0.15, base=4)
# repaso
for k, tb in enumerate((39.0, 39.5, 40.0, 40.5)):
    poner(sfx, golpe_suave(1.0), tb, 0.8, rev=0.3, golpe=True)
    poner(sfx, boing(220 + 60 * k, 520 + 80 * k, 0.3), tb + 0.02, 0.3)
# diseñado para cada alumno
iris(41.0)
for i in range(10):
    poner(sfx, pop(500 + i * 60, 1200 + i * 70, 0.1), 41.05 + i * 0.05, 0.3, pan=np.cos(i * 0.63) * 0.8)
letras(41.1, 12, 0.025, 0.14)
letras(41.45, 11, 0.035, 0.16, base=5)
# admisión
iris(42.6)
poner(sfx, golpe_suave(1.4), 42.62, 0.9, rev=0.45, golpe=True)
poner(sfx, confeti_sonido(1.1), 42.6, 0.55)
# cierre
iris(43.7)
poner(sfx, golpe_suave(1.6), 43.7, 0.9, rev=0.6, golpe=True)
for i in range(6):
    poner(sfx, pop(600 + i * 80, 1300 + i * 90, 0.1), 43.8 + i * 0.07, 0.3, pan=np.cos(i) * 0.7)
poner(sfx, boing(200, 480), 43.95, 0.4)
poner(sfx, pop(600, 1400, 0.16), 44.2, 0.45)

# ---------------- mezcla ----------------
ir_t = t_arr(1.6)
ir = [filtro(rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.4), "lowpass", 6000) for _ in range(2)]
rev = np.stack([fftconvolve(envio[c], ir[c])[:N] for c in range(2)]) * 0.06

duck = np.ones(N)
for tg in GOLPES:
    i = int(tg * SR)
    tt = t_arr(0.4)
    curva = 1 - 0.45 * np.exp(-tt / 0.1)
    j = min(N, i + len(tt))
    duck[i:j] = np.minimum(duck[i:j], curva[: j - i])
mezcla = sfx * 0.9 + musica * 0.55 * duck + rev
mezcla = np.stack([filtro(mezcla[c], "highpass", 35) for c in range(2)])
fin = t_arr(0.6)
mezcla[:, -len(fin):] *= np.linspace(1, 0, len(fin))

techo = 0.89
mezcla = mezcla * (10 ** (-15.5 / 20) / np.sqrt(np.mean(mezcla**2)))
nivel = maximum_filter1d(np.max(np.abs(mezcla), axis=0), size=int(0.004 * SR))
ganancia = np.minimum(1.0, techo / np.maximum(nivel, 1e-9))
a = np.exp(-1 / (0.12 * SR))
ganancia = np.minimum(ganancia, 1 - lfilter([1 - a], [1, -a], 1 - ganancia))
reduccion = -20 * np.log10(np.min(ganancia))
mezcla = np.clip(mezcla * ganancia, -techo, techo)

os.makedirs(os.path.join(AQUI, "out"), exist_ok=True)
ruta = os.path.join(AQUI, "out", "sonido-v4.wav")
with wave.open(ruta, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mezcla.T * 32767).astype("<i2").tobytes())
print(ruta, f"reducción máxima del limitador: {reduccion:.1f} dB")
