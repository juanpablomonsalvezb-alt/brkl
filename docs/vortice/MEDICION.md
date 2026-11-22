# Medición de consumo de la arquitectura (Claude + Junie)

**Fuente:** los registros de sesión de Claude Code (`~/.claude/projects/-Users-juanpablomonsalvez/*.jsonl`) traen `usage` por mensaje. Herramienta de solo lectura: `python3 scripts/medir-sesion.py [archivo.jsonl]` (sin argumento mide la sesión más reciente).

## Línea base (antes de optimizar), sesión `4aa4e204`, medida el 2026-11-22
| Métrica | Valor |
|---|---|
| Respuestas del asistente | 682 |
| Tokens releídos de caché | 271.152.746 (≈ 397 mil por llamada) |
| Tokens creados en caché | 3.757.070 |
| Tokens de salida | 506.231 |
| Llamadas `Bash` / `Monitor` / `WebSearch` / `fetch` | 466 / 13 / 15 / 11 |
| Archivos leídos más de una vez con `Read` | 0 |
| Fijo por llamada (estimado, chars ÷ 4) | skills ~18.000 + agentes ~9.800 + `MEMORY.md` ~4.200 + `CLAUDE.md` global ~2.000 |

Los tokens por mensaje y por herramienta son datos; el «fijo por llamada» es una **estimación**.

## Qué medir por tarea
Tokens (entrada, caché, salida); llamadas por herramienta; archivos explorados y repetidos; intervenciones del arquitecto sobre el trabajo de Junie (líneas cambiadas en su resultado); correcciones registradas en la sección «Verificación del arquitecto» de cada informe; resultado de la suite y de las mutaciones.

## Registro de comparaciones
| Fecha | Sesión | Tarea | Tokens caché | Llamadas | Notas |
|---|---|---|---|---|---|
| 2026-11-22 | `4aa4e204` | línea base | 271 M | 682 | sesión larga, contexto medio ~397 mil |
