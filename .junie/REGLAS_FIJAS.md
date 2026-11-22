# Reglas fijas de Vórtice (rigen en TODA tarea)

Arquitecto único: Claude. Junie: ejecutor. Junie no decide arquitectura; si algo requiere decisión, lo anota como PENDIENTE en el informe y se detiene en ese punto.

## Prohibido
- Commit, push, merge, rebase, reset, checkout de otras ramas, deploy, migraciones reales, uso de Turso o Vercel.
- Modificar: `shared/p0e.ts`, `script/p0e.check.ts`, `script/mutar.ts`, `server/calendarUtils.ts`.
- Tocar la especificación maestra ni el commit E0 (`2edf702`).
- Decidir O1–O3, N16, N17, escenarios 3/4/10, O4, ni autorizar H3b/H1b-2/H4/IMP-022/R3/R4.
- Instalar dependencias o cambiar `package.json` sin que la instrucción lo pida.

## Obligatorio
1. Al INICIO y al CIERRE: `git rev-parse HEAD`, `git status --short` y `shasum -a 256` de los 5 archivos protegidos (los 4 anteriores + `script/ventanas.check.ts`). Pegar ambas salidas en el informe.
2. Hacer solo lo que dice `INSTRUCCIONES_ACTUALES.md`. Nada extra, ningún "arreglo de paso".
3. Pegar la salida ORIGINAL de cada comando de prueba (sin resumir) en el informe.
4. Cerrar siempre con el informe en `.junie/informes/` usando `PLANTILLA_INFORME.md`.
5. Si algo falla, informar el error exacto; no ocultarlo ni adornarlo.
