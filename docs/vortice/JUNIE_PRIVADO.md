# `.junie/` en dos repositorios (el principal es PÚBLICO)

**Decisión del sostenedor (2026-11-22):** subconjunto público más repositorio privado.

## Qué va dónde
| Destino | Contenido |
|---|---|
| **Repo público** (`brkl-motor`) | Solo `.junie/REGLAS_FIJAS.md`, `.junie/PLANTILLA_INFORME.md` y `.junie/PLANTILLA_TAREA.md`. El resto de `.junie/` está ignorado por `.gitignore`. |
| **Repo privado** (git-dir `~/Downloads/brkl-junie-privado.git`, árbol de trabajo `.junie/` en el mismo sitio) | Todo `.junie/`: decisiones, autorizaciones, estado, informes T0 a T36 y las reglas. Hoy **solo local, sin remoto**. |

## Cómo usar el repo privado (sin carpeta nueva ni `.git` dentro de `.junie/`)
```bash
export JGIT="git --git-dir=$HOME/Downloads/brkl-junie-privado.git"
$JGIT status --short          # ver cambios en .junie/
$JGIT add -A && $JGIT commit -m "<mensaje>"
$JGIT log --oneline | head
```
Respaldar al cerrar cada tarea importante (un commit por tarea). **El repo privado nunca debe tener remoto público.**

## Pendiente (requiere autorización del sostenedor)
Crear el remoto privado en GitHub para tener copia fuera de este equipo:
`gh repo create juanpablomonsalvezb-alt/brkl-junie-privado --private` y luego `$JGIT remote add origin <url>` y `$JGIT push -u origin main`. Comprobar antes con `gh repo view --json isPrivate` que quedó privado.

## Efecto en el flujo con Junie
Sin cambios. Las copias aisladas se hacen con `git archive HEAD` **más `cp -r .junie`** (el árbol de trabajo trae `.junie/` completo; `git archive` solo incluye los 3 archivos públicos). Junie sigue leyendo `INSTRUCCIONES_ACTUALES.md` y `REGLAS_FIJAS.md` desde su copia.

## Por qué
El repositorio `juanpablomonsalvezb-alt/brkl` es público. Las decisiones de dirección, la estrategia de precios y los informes internos no deben publicarse. No hay credenciales en `.junie/` (auditoría 2026-11-22: 0 claves, 0 tokens, 0 teléfonos); lo sensible es estrategia interna.
