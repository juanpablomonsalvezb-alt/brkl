# Memoria técnica viva de Vórtice

**Actualizar al cerrar cada tarea importante. Es la única fuente del estado actual.** (El `HANDOFF.md` del 2026-11-21 es histórico.) Última actualización: 2026-11-22.

## Estado
- Verificado el 2026-11-22: `tsc` limpio y `check:vortice` en 0 sobre HEAD `20136ee`; los 5 archivos protegidos intactos.
- Rama `vortice/h1b1-p0e-puro`: empujada a GitHub hasta `ea3e7d3`; **5 commits solo locales** (M2 a M6 y rediseño visual: `5e88351` a `20136ee`). `main` solo tiene los 3 PR de precios.
- Terminado y verificado: evaluación E2, Brújula 1 y 2, calendario 2027 (+ carga a `program_calendar`), perfil neurodivergente y clasificación 0 a 4, Aula Universal, mapa M3, retención M4, cruce M5/M6, rediseño editorial (el rediseño no se vio en pantalla).
- Flow mensual construido pero **inseguro para habilitar** (auditoría 2026-11-22): ver `areas/flow.md`.
- Migraciones SQL nuevas (`docs/vortice-migracion*.sql`) **no aplicadas** a ninguna base. Solo `0001` a `0005` están aplicadas en `brkl-preview`.

## Versionado de `.junie/` (2026-11-22)
Repo público: solo reglas y plantillas. Repo privado local `~/Downloads/brkl-junie-privado.git` (commit `6cfc402`, 27 archivos, sin remoto): ver `JUNIE_PRIVADO.md`. **No empujar los 8 commits locales al repo público antes de cerrar T40:** `areas/flow.md` describe debilidades de Flow sin corregir.

## En curso
- **T40** (Junie, copia `~/Downloads/brkl-motor-flow`): endurecer Flow F1 a F7. Pendiente verificarla por mi cuenta antes de fusionar.

## Próximas prioridades
1. Verificar T40 y fusionarla a `brkl-motor` (commit local).
2. Empujar o descartar los 5 commits locales.
3. Verificar en pantalla el rediseño visual y la Brújula.
4. Decidir cómo acortar el ciclo 2027 (la tabla de opciones está lista); confirmar la resolución 2027 del Mineduc.
5. Validadores O4, revisión humana de las 81 preguntas, confirmación de la fecha de cobro «enero 2027».

## Riesgos abiertos
- Antigravity trabajó con aprobaciones de una palabra sin mi verificación: verificar por área antes de confiar.
- Formato real del callback de Flow sin verificar; `FLOW_API_URL` de producción desconocida (cifrada).
- Disco con ~4 GB libres.
