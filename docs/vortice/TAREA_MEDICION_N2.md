# Tarea de medición (nivel 2) para una sesión NUEVA

**No ejecutar en la sesión larga `4aa4e204`.** Abrir una sesión nueva en `~/Downloads/brkl-motor` y pegar: «Lee `docs/vortice/TAREA_MEDICION_N2.md` y ejecútala».

## Propósito
1. Comprobar que la optimización (`a062f53` y siguientes) funciona al iniciar una sesión.
2. Medir el consumo de una tarea de nivel 2 con el protocolo de exploración selectiva y compararlo con la línea base de `docs/vortice/MEDICION.md`.

## Paso 0: verificación de carga (antes de cualquier lectura)
Responder, sin abrir archivos, y anotar:
- ¿Qué archivos de instrucciones aparecen cargados (global y de proyecto)? ¿Se ve `CLAUDE.md` de `brkl-motor`?
- ¿Cuántos bloques de «CAVEMAN MODE ACTIVE» recibió el inicio de sesión (esperado: 1) y cuántos el primer mensaje (esperado: 1)?
- ¿Cuántas entradas tiene el `MEMORY.md` cargado (esperado: 13 de reglas y proyecto más 6 punteros a índices) y están los índices temáticos sin cargar?
- ¿El `HANDOFF.md` y `.junie/ESTADO.md` se tratan como históricos?

## Tarea (nivel 2, solo verificación; NO modificar código ni configuración)
**Verificar el área «aula-mapa»**, hoy marcada «sin verificar a fondo» en `docs/vortice/CAMBIOS.md`: Aula Universal, mapa M3, retención M4 y cruce M5/M6.

Protocolo de exploración selectiva (obligatorio):
1. Objetivo: confirmar que lo que dice el registro de Antigravity sobre el área es cierto.
2. Leer solo `docs/vortice/MEMORIA.md` y `docs/vortice/areas/aula-mapa.md`.
3. Fijar los archivos del área (los listados en `areas/aula-mapa.md`) y comprobar cambios con `git diff --stat 4f16b84 -- <rutas>`. No releer lo que no cambió.
4. Examinar solo lo necesario:
   - Correr `script/aula-universal.check.ts`, `script/mapa-conocimiento.check.ts` y `script/retencion-cruce-m4m5m6.check.ts` (verificar código de salida real).
   - Comprobar con `git diff 574f07e..HEAD --stat` que **no** cambiaron `server/conocimiento.ts`, `server/practica.ts`, `server/reconstruccion.ts`, `migrations/vortice/0001..0005` ni los 5 archivos protegidos.
   - Comprobar que ninguna ruta del área lee puntajes o respuestas de una evaluación bajo embargo (`server/cruceEvaluacionMapa.ts`).
   - Comprobar que las evaluaciones de proceso `1..3` no muestran porcentaje ni cronómetro y que el perfil neurodivergente solo afecta la Evaluación del módulo `4`.
5. Ampliar la exploración solo si aparece una dependencia o riesgo concreto, y anotar por qué.

## Entregable
- Informe breve en `docs/vortice/verificaciones/aula-mapa.md`: hechos verificados, inferencias, hallazgos, riesgos, qué no se pudo verificar.
- Actualizar la fila `aula-mapa` de `docs/vortice/CAMBIOS.md` (columna «Revisado») y la línea correspondiente de `docs/vortice/MEMORIA.md`.
- Solo esos archivos de documentación cambian. Sin commit hasta recibir autorización.

## Medición (registrar en `docs/vortice/MEDICION.md`)
Al **inicio** (antes del Paso 0) y al **final**, ejecutar `python3 scripts/medir-sesion.py` y anotar la diferencia. Registrar:
| Métrica | Cómo |
|---|---|
| Tokens de caché leída, creada y de salida de la tarea | final menos inicio |
| Respuestas y llamadas por herramienta | `medir-sesion.py` |
| Archivos explorados | contar los `Read` y las lecturas por `Bash` (`cat`, `sed`, `grep`) |
| Lecturas repetidas | salida «archivos releídos» |
| Contexto medio por llamada | `medir-sesion.py` |
| Archivos fuera de la lista del área que hubo que abrir | anotar cada uno con su motivo |
| Hallazgos de la verificación | cantidad y gravedad |
| Resultado del Paso 0 | respuestas literales |

**Criterios de éxito:** el contexto medio por llamada queda por debajo de ~150 mil; no hay lecturas repetidas; no se abre el repositorio completo; el Paso 0 confirma una sola inyección de caveman y las instrucciones nuevas cargadas. Si algo falla, anotarlo como hallazgo de la optimización, no corregirlo en esa sesión.
