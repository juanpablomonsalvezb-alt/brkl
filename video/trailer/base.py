"""Corte base del tráiler: toma cada segmento de edl.json, unifica tamaño, cuadros y color.

    python3 video/trailer/base.py  → video/trailer/out/base.mp4 (sin títulos ni audio)
"""
import json
import os
import subprocess

AQUI = os.path.dirname(os.path.abspath(__file__))
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
edl = json.load(open(os.path.join(AQUI, "edl.json"), encoding="utf-8"))
FPS = edl["fps"]

usados = [c for c in dict.fromkeys(t["clip"] for t in edl["tomas"]) if c]
entradas = []
for c in usados:
    entradas += ["-i", os.path.join(AQUI, edl["clips"][c])]
indice = {c: i for i, c in enumerate(usados)}

partes, etiquetas = [], []
comun = f"fps={FPS},scale=1080:1920:flags=lanczos,setsar=1,format=yuv420p"
for k, t in enumerate(edl["tomas"]):
    et = f"s{k}"
    if t["clip"] is None:
        partes.append(f"color=c=black:s=1080x1920:r={FPS}:d={t['dur']},format=yuv420p,setsar=1[{et}]")
    else:
        fundido = ""
        siguiente = edl["tomas"][k + 1] if k + 1 < len(edl["tomas"]) else None
        if siguiente is not None and siguiente["clip"] is None:
            fundido = f",fade=t=out:st={t['dur'] - 0.4:.3f}:d=0.4"
        # Algunos clips traen un marco generado en los bordes: se acercan lo justo para dejarlo fuera.
        r = edl.get("recorte", {}).get(t["clip"], 0)
        recorte = f"crop=iw*{1 - r:.3f}:ih*{1 - r:.3f}," if r else ""
        partes.append(
            f"[{indice[t['clip']]}:v]trim=start={t['entrada']}:duration={t['dur']},setpts=PTS-STARTPTS,{recorte}{comun}{fundido}[{et}]"
        )
    etiquetas.append(f"[{et}]")

# Color unificado: sombras azul marino, luces cálidas, algo menos de saturación, viñeta suave.
grado = (
    "eq=contrast=1.07:saturation=0.9:gamma=0.98,"
    "colorbalance=rs=-0.05:gs=-0.01:bs=0.06:rh=0.05:gh=0.015:bh=-0.04,"
    "vignette=angle=PI/5,"
    "fade=t=in:st=0:d=0.7"
)
grafo = ";".join(partes) + ";" + "".join(etiquetas) + f"concat=n={len(etiquetas)}:v=1:a=0,{grado}[v]"

os.makedirs(os.path.join(AQUI, "out"), exist_ok=True)
salida = os.path.join(AQUI, "out", "base.mp4")
subprocess.run(
    [FFMPEG, "-hide_banner", "-loglevel", "error", "-y", *entradas, "-filter_complex", grafo, "-map", "[v]",
     "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p", "-r", str(FPS), salida],
    check=True,
)
print(salida)
