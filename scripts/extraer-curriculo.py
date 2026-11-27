#!/usr/bin/env python3
"""Extrae los objetivos e indicadores de los temarios oficiales MINEDUC."""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

import pdfplumber


GRADOS = {
    **{f"{numero}_basico": f"{numero}° Básico" for numero in range(1, 9)},
    **{f"{numero}_medio": f"{numero}° Medio" for numero in range(1, 5)},
}
ARCHIVO_GRADO = re.compile(r"temario_(?:basica|media)_(\d+)deg_(basico|medio)", re.IGNORECASE)
ENCABEZADO_OA = re.compile(r"Objetivo\s+de\s+Aprendizaje\s*(?:N\s*[°º]?\s*)?(\d+)\s*:?", re.IGNORECASE)
ENCABEZADO_TABLA = re.compile(r"Objetivos?\s+de\s+Aprendizaje", re.IGNORECASE)
ENCABEZADO_INDICADORES = re.compile(r"Indicadores?\s+de\s+Evaluaci[oó]n", re.IGNORECASE)
MARCADOR_VINETA = re.compile(r"^\s*([•●▪◦])\s*(.*)$")
MARCADOR_INDICADOR = re.compile(r"(^|\s)([-–−]|[•●▪◦])\s+")
ENCABEZADO_EJE = re.compile(r"^\s*Eje\b(?:\s+(?i:tem[aá]tico))?\s*:?\s*(.+?)\s*$")
ENCABEZADO_MODULO = re.compile(r"^\s*(M[oó]dulo\s+\d+\s*:.+?)\s*\.?\s*$")
PIE_DE_PAGINA = re.compile(r"^Temario\s+.+\d+\s+de\s+\d+$", re.IGNORECASE)

ASIGNATURAS = {
    "lenguaje y comunicacion": "lenguaje",
    "lengua y literatura": "lengua-literatura",
    "matematica": "matematica",
    "ciencias naturales": "ciencias-naturales",
    "ciencias para la ciudadania": "ciencias-para-la-ciudadania",
    "ciencia para la ciudadania": "ciencias-para-la-ciudadania",
    "historia, geografia y ciencias sociales": "historia-geografia-ciencias-sociales",
    "historia, geografia y formacion ciudadana": "historia-geografia-formacion-ciudadana",
    "educacion ciudadana": "educacion-ciudadana",
    "filosofia": "filosofia",
    "ingles": "ingles",
    "idioma extranjero: ingles": "ingles",
    "artes visuales": "artes-visuales",
    "artes": "artes",
    "musica": "musica",
    "tecnologia": "tecnologia",
    "educacion fisica y salud": "educacion-fisica-y-salud",
}


def sin_tildes(texto: str) -> str:
    return "".join(
        caracter
        for caracter in unicodedata.normalize("NFD", texto)
        if unicodedata.category(caracter) != "Mn"
    )


def normalizar_titulo(linea: str) -> tuple[str, str] | None:
    # Sin quitar el punto final: una frase de párrafo que termina en "." no es encabezado.
    titulo = re.sub(r"[_\s]+$", "", linea).strip()
    if not titulo[:1].isupper():
        # Líneas en minúscula son continuación de párrafo, no encabezados.
        return None
    clave = re.sub(r"\s+", " ", sin_tildes(titulo).lower())
    slug = ASIGNATURAS.get(clave)
    return (slug, titulo) if slug else None


def limpiar_lineas(texto: str) -> list[str]:
    texto = texto.replace("\r", "\n").replace("\xa0", " ")
    texto = re.sub(r"(?<=\w)-\s*\n\s*(?=\w)", "", texto)
    lineas = []
    for linea in texto.splitlines():
        linea = re.sub(r"\s+", " ", linea).strip()
        if not linea:
            continue
        if PIE_DE_PAGINA.match(linea):
            continue
        lineas.append(linea)
    return lineas


def unir_texto(texto: str) -> str:
    partes: list[tuple[str | None, str]] = []
    for linea in limpiar_lineas(texto):
        vineta = MARCADOR_VINETA.match(linea)
        if vineta:
            partes.append((vineta.group(1), vineta.group(2).strip()))
        elif partes:
            marcador, contenido = partes[-1]
            partes[-1] = (marcador, f"{contenido} {linea}".strip())
        else:
            partes.append((None, linea))

    resultado = ""
    for marcador, contenido in partes:
        if not contenido:
            continue
        if marcador:
            resultado += f"\n{marcador} {contenido}" if resultado else f"{marcador} {contenido}"
        else:
            resultado = f"{resultado} {contenido}".strip()
    return resultado.strip()


def extraer_indicadores(texto: str, indicadores: list[str]) -> list[str]:
    """Agrega a `indicadores` (se modifica en sitio) los indicadores de `texto`.

    Una línea sin marcador continúa el último indicador existente, incluso
    cuando ese indicador viene de una fila anterior de la tabla.
    """
    texto = re.sub(r"(?<=\w)-\s*\n\s*(?=\w)", "", texto.replace("\r", "\n"))
    lineas = [re.sub(r"\s+", " ", linea).strip() for linea in texto.splitlines()]
    lineas = [linea for linea in lineas if linea]
    actual: str | None = indicadores[-1] if indicadores else None
    # Líneas previas al primer marcador de la celda: fragmentos de fórmulas
    # (p. ej. el numerador de una fracción) que van delante del primer indicador.
    prefijo = ""

    for linea in lineas:
        if ENCABEZADO_INDICADORES.search(linea):
            continue
        marcadores = list(MARCADOR_INDICADOR.finditer(linea))
        if marcadores:
            for indice, marcador in enumerate(marcadores):
                inicio = marcador.end()
                fin = marcadores[indice + 1].start() if indice + 1 < len(marcadores) else len(linea)
                contenido = linea[inicio:fin].strip()
                if contenido and prefijo:
                    contenido = f"{prefijo} {contenido}"
                    prefijo = ""
                if contenido:
                    indicadores.append(contenido)
            actual = indicadores[-1] if indicadores else None
        elif actual is not None:
            indicadores[-1] = f"{indicadores[-1]} {linea}".strip()
            actual = indicadores[-1]
        elif " " not in linea and len(linea) <= 12:
            # Fragmento de fórmula sin espacios (p. ej. "∆𝑦"), no una frase.
            prefijo = f"{prefijo} {linea}".strip()
        else:
            actual = unir_texto(linea)
            if actual:
                indicadores.append(actual)

    if prefijo:
        indicadores.append(unir_texto(prefijo))

    return indicadores


def limpiar_encabezado_tabla(fila: list[Any]) -> bool:
    celdas = [str(celda or "") for celda in fila]
    texto = " ".join(celdas)
    return bool(ENCABEZADO_TABLA.search(texto) and ENCABEZADO_INDICADORES.search(texto))


def separar_eje(celda: str) -> tuple[str, str | None]:
    """Quita del inicio de la celda las líneas de eje o módulo y devuelve (resto, eje)."""
    eje: str | None = None
    lineas = celda.split("\n")
    while lineas:
        linea = lineas[0].strip()
        encabezado = ENCABEZADO_EJE.match(linea) or ENCABEZADO_MODULO.match(linea)
        if not encabezado or ENCABEZADO_OA.search(linea):
            break
        eje = encabezado.group(1).strip()
        lineas.pop(0)
    return "\n".join(lineas).strip(), eje


def agregar_oa(
    asignatura: dict[str, Any],
    texto: str,
    indicadores: list[str],
    pagina: int,
    eje: str | None,
) -> dict[str, Any] | None:
    encabezados = list(ENCABEZADO_OA.finditer(texto))
    if not encabezados:
        return None

    ultimo: dict[str, Any] | None = None
    for indice, encabezado in enumerate(encabezados):
        fin = encabezados[indice + 1].start() if indice + 1 < len(encabezados) else len(texto)
        contenido = unir_texto(texto[encabezado.end() : fin].lstrip(" :\n\t"))
        oa_indicadores = indicadores if len(encabezados) == 1 else []
        ultimo = {
            "numero": int(encabezado.group(1)),
            "texto": contenido,
            "indicadores": oa_indicadores,
            "eje": eje,
            "pagina": pagina,
        }
        # El PDF puede reimprimir una fila idéntica al inicio de la página siguiente.
        repetido = next(
            (
                oa
                for oa in asignatura["oa"]
                if {k: oa[k] for k in ("numero", "texto", "indicadores", "eje")}
                == {k: ultimo[k] for k in ("numero", "texto", "indicadores", "eje")}
            ),
            None,
        )
        if repetido is not None:
            ultimo = repetido
            continue
        asignatura["oa"].append(ultimo)
    return ultimo


def eventos_de_pagina(pagina: Any) -> list[tuple[str, Any]]:
    """Devuelve las líneas de texto fuera de tablas y las tablas, en orden vertical."""
    tablas = pagina.find_tables()
    cajas = [tabla.bbox for tabla in tablas]
    eventos: list[tuple[float, int, str, Any]] = []
    for linea in pagina.extract_text_lines():
        texto = re.sub(r"\s+", " ", linea["text"].replace("\xa0", " ")).strip()
        if not texto or PIE_DE_PAGINA.match(texto):
            continue
        centro = (linea["top"] + linea["bottom"]) / 2
        if any(caja[1] <= centro <= caja[3] for caja in cajas):
            continue
        eventos.append((linea["top"], 0, "texto", texto))
    for tabla in tablas:
        eventos.append((tabla.bbox[1], 1, "tabla", tabla))
    eventos.sort(key=lambda evento: (evento[0], evento[1]))
    return [(tipo, valor) for _, _, tipo, valor in eventos]


def extraer_pdf(pdf_path: Path, grado: str, etiqueta: str) -> dict[str, Any]:
    asignaturas: list[dict[str, Any]] = []
    por_slug: dict[str, dict[str, Any]] = {}
    asignatura_actual: dict[str, Any] | None = None
    eje_actual: str | None = None
    ultimo_oa: dict[str, Any] | None = None
    # Descripción en curso: (asignatura, líneas) hasta la primera tabla u OA.
    descripcion: tuple[dict[str, Any], list[str]] | None = None

    def cerrar_descripcion() -> None:
        nonlocal descripcion
        if descripcion is not None:
            asignatura, lineas = descripcion
            if not asignatura["descripcion"]:
                asignatura["descripcion"] = unir_texto("\n".join(lineas)) or None
        descripcion = None

    with pdfplumber.open(pdf_path) as pdf:
        for numero_pagina, pagina in enumerate(pdf.pages, start=1):
            for tipo, valor in eventos_de_pagina(pagina):
                if tipo == "texto":
                    titulo = normalizar_titulo(valor)
                    if titulo:
                        cerrar_descripcion()
                        slug, nombre = titulo
                        asignatura_actual = por_slug.get(slug)
                        if asignatura_actual is None:
                            asignatura_actual = {
                                "slug": slug,
                                "nombre": nombre,
                                "descripcion": None,
                                "fuente": pdf_path.name,
                                "oa": [],
                            }
                            asignaturas.append(asignatura_actual)
                            por_slug[slug] = asignatura_actual
                        eje_actual = None
                        ultimo_oa = asignatura_actual["oa"][-1] if asignatura_actual["oa"] else None
                        if not asignatura_actual["descripcion"]:
                            descripcion = (asignatura_actual, [])
                        continue

                    eje = ENCABEZADO_EJE.match(valor) or ENCABEZADO_MODULO.match(valor)
                    if eje:
                        eje_actual = eje.group(1).strip()
                        continue
                    if ENCABEZADO_OA.search(valor) or ENCABEZADO_TABLA.search(valor):
                        cerrar_descripcion()
                    elif descripcion is not None:
                        descripcion[1].append(valor)
                    continue

                cerrar_descripcion()
                for fila in valor.extract():
                    if not fila or limpiar_encabezado_tabla(fila):
                        continue
                    celdas = [str(celda or "").strip() for celda in fila]
                    primera = celdas[0] if celdas else ""
                    segunda = celdas[1] if len(celdas) > 1 else ""
                    if not primera and not segunda:
                        continue
                    if ENCABEZADO_INDICADORES.search(primera) or (
                        ENCABEZADO_TABLA.search(primera) and not ENCABEZADO_OA.search(primera)
                    ):
                        continue

                    primera, eje_celda = separar_eje(primera)
                    if eje_celda:
                        eje_actual = eje_celda
                    if not primera and not segunda:
                        continue

                    if asignatura_actual is None:
                        if ENCABEZADO_OA.search(primera):
                            print(f"Aviso: OA sin asignatura en {pdf_path.name}, página {numero_pagina}.", file=sys.stderr)
                        continue

                    if ENCABEZADO_OA.search(primera):
                        ultimo_oa = agregar_oa(
                            asignatura_actual,
                            primera,
                            extraer_indicadores(segunda, []),
                            numero_pagina,
                            eje_actual,
                        ) or ultimo_oa
                    elif ultimo_oa is not None:
                        continuacion = unir_texto(primera)
                        if continuacion:
                            ultimo_oa["texto"] = unir_texto(f"{ultimo_oa['texto']}\n{continuacion}")
                        extraer_indicadores(segunda, ultimo_oa["indicadores"])

    cerrar_descripcion()
    return {"grado": grado, "etiqueta": etiqueta, "asignaturas": asignaturas}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("carpeta_pdf", type=Path, help="Carpeta con los temarios oficiales en PDF")
    args = parser.parse_args()
    carpeta_pdf = args.carpeta_pdf.expanduser().resolve()
    if not carpeta_pdf.is_dir():
        parser.error(f"no existe la carpeta de PDF: {carpeta_pdf}")

    candidatos: dict[str, list[Path]] = {grado: [] for grado in GRADOS}
    for pdf_path in sorted(carpeta_pdf.glob("*.pdf"), key=lambda path: path.name.lower()):
        coincidencia = ARCHIVO_GRADO.search(pdf_path.stem)
        if not coincidencia:
            print(f"Aviso: se omite el PDF sin grado reconocible: {pdf_path.name}", file=sys.stderr)
            continue
        grado = f"{coincidencia.group(1)}_{coincidencia.group(2).lower()}"
        if grado in candidatos:
            candidatos[grado].append(pdf_path)

    faltantes = [grado for grado, archivos in candidatos.items() if not archivos]
    if faltantes:
        parser.error(f"faltan PDF para estos grados: {', '.join(faltantes)}")

    raiz = Path(__file__).resolve().parents[1]
    salida = raiz / "client" / "src" / "data" / "curriculo"
    salida.mkdir(parents=True, exist_ok=True)

    for grado, etiqueta in GRADOS.items():
        archivos = candidatos[grado]
        if len(archivos) > 1:
            print(
                f"Aviso: {grado} tiene varios PDF; se usa solo {archivos[0].name}.",
                file=sys.stderr,
            )
        contenido = extraer_pdf(archivos[0], grado, etiqueta)
        destino = salida / f"{grado}.json"
        destino.write_text(
            json.dumps(contenido, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        total_oa = sum(len(asignatura["oa"]) for asignatura in contenido["asignaturas"])
        print(f"{destino.relative_to(raiz)}: {total_oa} OA en {len(contenido['asignaturas'])} asignaturas")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
