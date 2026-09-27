"""Sonido del sello de marca (4 s), sincronizado con sello.html.

    python3 video/intro/sonido_sello.py  → video/intro/out/sonido-sello.wav (48 kHz, estéreo)
"""
import os
import wave

import numpy as np
from scipy.ndimage import maximum_filter1d
from scipy.signal import butter, fftconvolve, lfilter, sawtooth, sosfilt

SR = 48000
DUR = 4.0
N = int(SR * DUR)
rng = np.random.default_rng(3)
AQUI = os.path.dirname(os.path.abspath(__file__))

seco = np.zeros((2, N))
envio = np.zeros((2, N))


def t_arr(d):
    return np.arange(int(SR * d)) / SR


def filtro(x, tipo, f, orden=4):
    return sosfilt(butter(orden, f, btype=tipo, fs=SR, output="sos"), x)


def nota(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def norm(x):
    return x / (np.max(np.abs(x)) + 1e-9)


def poner(x, t, g=1.0, pan=0.0, rev=0.0):
    """pan puede ser un número o un arreglo del largo de x (paneo que se mueve)."""
    i = int(t * SR)
    x = np.asarray(x)[: N - i]
    pan = np.asarray(pan)[: len(x)] if np.ndim(pan) else pan
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    seco[0, i : i + len(x)] += x * g * l * 1.414
    seco[1, i : i + len(x)] += x * g * r * 1.414
    envio[:, i : i + len(x)] += x * g * rev


def barrido(x, cortes):
    """Filtro pasabanda que se mueve en el tiempo, sin clics: mezcla versiones fijas."""
    fijas = np.geomspace(120, 14000, 16)
    V = np.stack([filtro(x, "bandpass", [f * 0.6, min(f * 1.6, 23000)], 2) for f in fijas])
    pos = np.interp(np.log(np.clip(cortes, fijas[0], fijas[-1])), np.log(fijas), np.arange(len(fijas)))
    i0 = np.floor(pos).astype(int)
    i1 = np.minimum(i0 + 1, len(fijas) - 1)
    w = pos - i0
    idx = np.arange(len(x))
    return V[i0, idx] * (1 - w) + V[i1, idx] * w


# 1. Aire que sube desde el negro hasta que la luz enciende la B (0 → 0.45)
d = 0.62
tt = t_arr(d)
k = tt / d
aire = barrido(rng.standard_normal(len(tt)), 300 * (9000 / 300) ** (k**1.4))
poner(norm(aire) * k**2.4 * np.minimum(1, (d - tt) * 60), 0.0, 0.34, rev=0.35)
sub = np.sin(2 * np.pi * np.cumsum(38 + 18 * k) / SR) * k**2
poner(sub, 0.0, 0.22)

# 2. Golpe cinematográfico cuando aparece la B (0.45)
d = 3.5
tt = t_arr(d)
f = 44 + 90 * np.exp(-tt * 14)
cuerpo_sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.2)
cuerpo = filtro(rng.standard_normal(len(tt)), "bandpass", [110, 600]) * np.exp(-tt * 10) * 0.5
ataque = filtro(rng.standard_normal(len(tt)), "bandpass", [2200, 9000]) * np.exp(-tt * 80) * 0.4
golpe = norm((cuerpo_sub * 0.9 + cuerpo + ataque) * np.minimum(1, tt * 2500))
poner(golpe, 0.44, 0.78, rev=0.55)
# nota grave de metal (re) que sostiene el golpe
braam = sum(sawtooth(2 * np.pi * nota(n + det) * tt) for n in (26, 38) for det in (-0.12, 0.0, 0.1))
braam = filtro(braam, "lowpass", 500) * np.minimum(1, tt * 20) * np.exp(-tt * 1.3)
poner(norm(braam), 0.44, 0.2, rev=0.3)

# 3. Destello brillante cuando la luz cruza la B (1.0) y al final (3.1)
def brillo(d=1.6, base=88):
    tt = t_arr(d)
    x = np.zeros(len(tt))
    for j, n in enumerate((base, base + 7, base + 12, base + 16)):
        f = nota(n)
        s = np.sin(2 * np.pi * f * tt + 2.0 * np.exp(-tt * 6) * np.sin(2 * np.pi * f * 2.01 * tt))
        ini = int(j * 0.045 * SR)
        x[ini:] += (s * np.exp(-tt * 3.2))[: len(x) - ini] * (0.9 - j * 0.12)
    return norm(x) * np.minimum(1, tt * 800)


poner(brillo(1.8, 86), 1.0, 0.13, pan=-0.2, rev=0.7)
poner(brillo(1.0, 91), 3.12, 0.12, pan=0.25, rev=0.8)

# 4. Barrido de izquierda a derecha mientras se revela BARKLEY (1.35 → 2.05)
d = 0.85
tt = t_arr(d)
k = tt / d
whoosh = barrido(rng.standard_normal(len(tt)), 700 * (6000 / 700) ** k)
env = np.sin(np.pi * np.clip(k, 0, 1)) ** 1.5
poner(norm(whoosh) * env, 1.3, 0.28, pan=np.linspace(-0.7, 0.7, len(tt)), rev=0.3)

# 5. Acorde cálido (re mayor con novena) que queda sonando bajo el lema y la web
d = 2.3
tt = t_arr(d)
pad = np.zeros(len(tt))
for n in (50, 57, 62, 64, 66):
    for det in (-0.07, 0.0, 0.08):
        pad += sawtooth(2 * np.pi * nota(n + det) * tt + rng.uniform(0, 6))
pad = filtro(pad, "lowpass", 1600) * np.minimum(1, tt / 0.7)
poner(norm(pad), 1.75, 0.16, rev=0.5)

# 6. Toque suave al aparecer el lema (2.1) y la web (2.6)
def toque(f):
    tt = t_arr(0.5)
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9) * np.minimum(1, tt * 1500)


poner(toque(nota(74)), 2.08, 0.1, pan=-0.15, rev=0.5)
poner(toque(nota(81)), 2.58, 0.08, pan=0.15, rev=0.5)

# ---------- mezcla ----------
ir_t = t_arr(2.8)
ir = rng.standard_normal((2, len(ir_t))) * np.exp(-ir_t * 2.3)
ir = np.stack([filtro(c, "lowpass", 6000) for c in ir]) * 0.03
mezcla = seco + np.stack([fftconvolve(envio[c], ir[c])[:N] for c in range(2)])
mezcla = filtro(mezcla, "highpass", 28, 2)
cola = int(0.18 * SR)
mezcla[:, -cola:] *= np.linspace(1, 0, cola) ** 1.5

techo = 0.89
rms = np.sqrt(np.mean(mezcla**2))
mezcla *= 10 ** (-16.0 / 20) / rms
nivel = maximum_filter1d(np.max(np.abs(mezcla), axis=0), size=int(0.004 * SR))
ganancia = np.minimum(1.0, techo / np.maximum(nivel, 1e-9))
a = np.exp(-1 / (0.12 * SR))
ganancia = np.minimum(ganancia, 1 - lfilter([1 - a], [1, -a], 1 - ganancia))
reduccion = -20 * np.log10(np.min(ganancia))
mezcla = np.clip(mezcla * ganancia, -techo, techo)

os.makedirs(os.path.join(AQUI, "out"), exist_ok=True)
ruta = os.path.join(AQUI, "out", "sonido-sello.wav")
with wave.open(ruta, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mezcla.T * 32767).astype("<i2").tobytes())
print(ruta, f"limitador: {reduccion:.1f} dB")
