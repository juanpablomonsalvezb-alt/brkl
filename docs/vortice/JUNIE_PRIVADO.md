# `.junie/` en dos repositorios (el principal es PÚBLICO)

**Decisión del sostenedor (2026-11-22):** subconjunto público más repositorio privado.

## Qué va dónde
| Destino | Contenido |
|---|---|
| **Repo público** (`brkl-motor`) | Solo `.junie/REGLAS_FIJAS.md`, `.junie/PLANTILLA_INFORME.md` y `.junie/PLANTILLA_TAREA.md`. El resto de `.junie/` está ignorado por `.gitignore`. |
| **Repo privado** (git-dir `~/Downloads/brkl-junie-privado.git`, árbol de trabajo `.junie/` en el mismo sitio) | Todo `.junie/`: decisiones, autorizaciones, estado, informes T0 a T36 y las reglas. Remoto privado en GitHub (`juanpablomonsalvezb-alt/brkl-junie-privado`), verificado PRIVADO con `gh repo view` y empujado el 2026-11-23 (`6cfc402..749e5f1`). |

## Cómo usar el repo privado (sin carpeta nueva ni `.git` dentro de `.junie/`)
```bash
export JGIT="git --git-dir=$HOME/Downloads/brkl-junie-privado.git"
$JGIT status --short          # ver cambios en .junie/
$JGIT add -A && $JGIT commit -m "<mensaje>"
$JGIT log --oneline | head
```
Respaldar al cerrar cada tarea importante (un commit por tarea). **El repo privado nunca debe tener remoto público.**

## Respaldo
Cada cierre de tarea importante: commit en el repo privado y, con autorización, `$JGIT push origin main`. Antes de cada push, comprobar con `gh repo view juanpablomonsalvezb-alt/brkl-junie-privado --json isPrivate` que sigue privado y escanear lo agregado en busca de secretos. Incluye `delegar.sh` (herramienta de delegación a Junie; copia instalada en `~/.local/bin/delegar.sh`).

## Efecto en el flujo con Junie
Sin cambios. Las copias aisladas se hacen con `git archive HEAD` **más `cp -r .junie`** (el árbol de trabajo trae `.junie/` completo; `git archive` solo incluye los 3 archivos públicos). Junie sigue leyendo `INSTRUCCIONES_ACTUALES.md` y `REGLAS_FIJAS.md` desde su copia.

## Por qué
El repositorio `juanpablomonsalvezb-alt/brkl` es público. Las decisiones de dirección, la estrategia de precios y los informes internos no deben publicarse. No hay credenciales en `.junie/` (auditoría 2026-11-22: 0 claves, 0 tokens, 0 teléfonos); lo sensible es estrategia interna.
