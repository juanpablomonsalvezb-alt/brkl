# Memoria técnica viva de Vórtice

**Actualizar al cerrar cada tarea importante. Es la única fuente del estado actual.** (El `HANDOFF.md` del 2026-11-21 es histórico.) Última actualización: 2026-11-22.

## Estado
- Verificado el 2026-11-22: `tsc` limpio y `check:vortice` en 0 tras fusionar T40; los 5 archivos protegidos intactos.
- Rama `vortice/h1b1-p0e-puro`: empujada a GitHub hasta `ea3e7d3`; **commits solo locales** (M2 a M6, rediseño visual y T40, sin empujar). `main` solo tiene los 3 PR de precios.
- Terminado y verificado: evaluación E2, Brújula 1 y 2, calendario 2027 (+ carga a `program_calendar`), perfil neurodivergente y clasificación 0 a 4, Aula Universal, mapa M3, retención M4, cruce M5/M6, rediseño editorial (el rediseño no se vio en pantalla).
- **T40 fusionada y verificada (2026-11-22)**: Flow F1 a F7 implementadas y confirmadas (tsc, check:vortice, 3 mutaciones de sanidad, hashes protegidos, pago único intacto). El informe de Junie decía "3/3 mutaciones" siendo falso (script de test crasheaba); lo corregí y confirmé real. Flow **sigue sin habilitar**: falta migración SQL, variables Vercel, F8 (callback real). Ver `areas/flow.md`.
- Migraciones SQL nuevas (`docs/vortice-migracion*.sql`, incluida la de T40) **no aplicadas** a ninguna base. Solo `0001` a `0005` están aplicadas en `brkl-preview`.

## Versionado de `.junie/` (2026-11-22)
Repo público: solo reglas y plantillas. Repo privado local `~/Downloads/brkl-junie-privado.git` (commit `6cfc402`, 27 archivos, sin remoto): ver `JUNIE_PRIVADO.md`. **No empujar los 8 commits locales al repo público antes de cerrar T40:** `areas/flow.md` describe debilidades de Flow sin corregir.

## En curso
- Nada en curso con Junie. Próxima tarea: decidir arquitectura Sonnet 5 + Junie confirmada; consultor Gemini (BYOK) queda como mejora futura opcional.

## Próximas prioridades
1. Empujar o descartar los commits locales (ahora incluye T40).
2. Verificar en pantalla el rediseño visual y la Brújula.
3. Decidir cómo acortar el ciclo 2027 (la tabla de opciones está lista); confirmar la resolución 2027 del Mineduc.
4. Validadores O4, revisión humana de las 81 preguntas, confirmación de la fecha de cobro «enero 2027».
5. Si se decide habilitar Flow: aplicar migración SQL de facturas, definir variables en Vercel, verificar F8 en sandbox real — solo con orden «PRODUCCION».

## Riesgos abiertos
- Antigravity trabajó con aprobaciones de una palabra sin mi verificación: verificar por área antes de confiar.
- Formato real del callback de Flow sin verificar; `FLOW_API_URL` de producción desconocida (cifrada).
- Disco con ~4 GB libres.
