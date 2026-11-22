# Plantilla de brief para Junie (objetivo ≤ 2 KB; las restricciones fijas ya están en REGLAS_FIJAS.md)

# TAREA Txx: <título>
Directorio: copia aislada `<carpeta>`. Sin commit ni push. Sin dependencias nuevas. Reglas fijas: `.junie/REGLAS_FIJAS.md`.

## Objetivo
<una o dos frases>

## Contexto imprescindible
<solo lo que Junie no puede deducir del código; decisión de dirección y fecha, y qué NO se debe cambiar>

## Archivos y componentes
Tocar: `<rutas>`. No tocar: `<rutas>` (los 5 protegidos, además).

## Restricciones propias de esta tarea
<lista corta>

## Criterios de aceptación
- `npx tsc --noEmit` limpio; `npm run check:vortice` con código 0 real (`echo $?`).
- <criterios funcionales verificables>
- Hashes de los 5 protegidos iguales al inicio y al cierre.

## Pruebas requeridas
<casos nuevos, mutaciones de sanidad en script manual NO `*.check.ts`>

## Informe
`.junie/informes/Txx.md` con la plantilla; PENDIENTES sin decidir; qué NO se pudo verificar.
