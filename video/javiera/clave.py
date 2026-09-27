"""Recorte del fondo verde por dominancia de verde (no depende del brillo, que en
los clips de Flow varía de las esquinas al centro) + eliminación del verde
reflejado en bordes y pelo."""
import numpy as np
from scipy.ndimage import gaussian_filter, minimum_filter

BAJO, ALTO = 18.0, 48.0  # g - max(r, b): por debajo es persona, por encima es fondo


def recortar(rgb):
    """rgb uint8 (H, W, 3) → (rgb float 0..1 sin derrame verde, alfa float 0..1)."""
    x = rgb.astype(np.float32)
    r, g, b = x[..., 0], x[..., 1], x[..., 2]
    dom = g - np.maximum(r, b)
    alfa = 1.0 - np.clip((dom - BAJO) / (ALTO - BAJO), 0, 1)
    # cierra huecos finos y suaviza el borde sin comerse el pelo
    alfa = minimum_filter(alfa, size=3) * 0.5 + alfa * 0.5
    alfa = gaussian_filter(alfa, 0.8)
    # derrame: el verde nunca supera al promedio de rojo y azul
    g2 = np.minimum(g, (r + b) / 2 + 6)
    out = np.stack([r, g2, b], -1) / 255.0
    return out, alfa
