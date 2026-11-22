# Vórtice / Barkley: reglas del proyecto (mandan sobre `~/.claude/CLAUDE.md`)

Carpeta raíz: `~/Downloads/brkl-motor`, rama `vortice/h1b1-p0e-puro` (worktree de `~/Downloads/Moodle-Theme-Creator`). Remoto: `juanpablomonsalvezb-alt/brkl`.

## Roles
- **Claude = arquitecto.** Diseña, escribe el brief, verifica por su cuenta y puede corregir lo que Junie ya hizo. **No escribe features nuevas desde cero.**
- **Junie = programador (CLI).** Trabaja en copia aislada: `junie -p . --max-steps=150 "Lee .junie/INSTRUCCIONES_ACTUALES.md y .junie/REGLAS_FIJAS.md y ejecuta la tarea Txx"`. Sin `timeout` en este Mac: usar `perl -e 'alarm shift; exec @ARGV' 3300 <cmd>`. Copias con `git archive HEAD` o `rsync --exclude .git --exclude node_modules`, más `git init` propio y `ln -s` a los `node_modules` reales. Nunca copiar el `.git` del worktree.
- **Junie se equivoca sin verlo** (T30, T33, T34, T35): verificar siempre código de salida real, mutaciones y diff antes de fusionar.

## Reglas inamovibles
1. **Producción solo con la orden «PRODUCCION».** Se publica desde una rama limpia a partir de `main` con solo lo pedido. Nada de Vórtice ha ido a producción. Sin push a `main`, migraciones reales, Turso real ni uso de credenciales de producción sin autorización por etapa.
2. **Archivos protegidos (no modificar):** `shared/p0e.ts`, `script/p0e.check.ts`, `script/mutar.ts`, `script/ventanas.check.ts`, `server/calendarUtils.ts`. Verificar sus hashes al iniciar y al cerrar.
3. **Turso:** nunca la cuenta real para pruebas de carga. El Preview solo acepta `brkl-preview-*` (`server/dbGuard.ts`).
4. Respuestas de la evaluación: solo inserción. Porcentajes sin redondeo (truncados). Brújula sin castigos ni puntajes.
5. Contenido solo de los libros oficiales (MINEDUC y Casa del Saber, ambas fuentes). Sin Khan Academy ni Coursera como referente.
6. El sitio no nombra al fundador ni a su colegio anterior. Sin ofrecer llamadas en correos o respuestas de Barkley.
7. Pagos Flow: suscripciones solo en sandbox hasta que la corrección T40 esté verificada y se ordene producción.
8. Cierre 2027: **15-oct** (resto de cursos) y **15-sep** (4.º medio). Precios fuente única: `shared/precios.ts`.

## Verificar antes de cerrar
`npx tsc --noEmit` y `npm run check:vortice` (comprobar `echo $?`). Cambios de nivel 2 y 3: `/code-review` y `/security-review`.

## Niveles de tarea
| Nivel | Qué es | Cómo |
|---|---|---|
| 1 Rutinario | Documentación, correcciones simples | Brief corto, esfuerzo bajo o medio |
| 2 Intermedio | Varios archivos, integración | Esfuerzo medio, verificación estándar |
| 3 Crítico | Seguridad, auth, BD, migraciones, pagos, arquitectura transversal | Razonamiento profundo y verificación independiente obligatoria; nunca sin revisión |

## Cómo se trabaja una tarea (exploración selectiva)
1. Objetivo. 2. Leer solo `docs/vortice/MEMORIA.md` y el documento de su área en `docs/vortice/areas/`. 3. Ver los archivos involucrados y si cambiaron desde la última revisión: `git diff --stat <commit en docs/vortice/CAMBIOS.md> -- <rutas>`. 4. Examinar solo lo necesario; ampliar solo si hay dependencia o riesgo. Exploración completa solo en auditorías, cambios transversales o fallos sin causa localizada.
5. Al cerrar una tarea importante, actualizar `MEMORIA.md`, el documento del área y `CAMBIOS.md` (sin duplicar).

## Mapa de documentos (cargar bajo demanda, no todos)
- Estado vivo: `docs/vortice/MEMORIA.md`. Cambios y último commit revisado por área: `docs/vortice/CAMBIOS.md`.
- Áreas: `docs/vortice/areas/{evaluacion,brujula,calendario,flow,precios,aula-mapa,banco}.md`.
- Decisiones: índice `docs/vortice/DECISIONES_INDICE.md` (el detalle completo está en `.junie/DECISIONES_DIRECCION.md`, no cargarlo entero).
- Brief a Junie: plantilla `.junie/PLANTILLA_TAREA.md`. Reglas fijas de Junie: `.junie/REGLAS_FIJAS.md`.
- Medición de consumo: `docs/vortice/MEDICION.md`.
- Histórico (no cargar por defecto): `HANDOFF.md`, `.junie/ESTADO.md`, `~/Downloads/BRKL_TRASPASO_2026-11-20.md`.
