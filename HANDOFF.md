# HANDOFF: Barkley / Vórtice, estado al 2026-11-21

**Para qué sirve:** retomar el trabajo en una conversación nueva sin perder nada. Consolida el traspaso del 20 de noviembre (`~/Downloads/BRKL_TRASPASO_2026-11-20.md`), el tablero `.junie/ESTADO.md`, las decisiones de dirección (`.junie/DECISIONES_DIRECCION.md`) y todo lo hecho el 21 de noviembre.
**Primer mensaje sugerido en la sesión nueva:** «Lee `HANDOFF.md` en la raíz de `~/Downloads/brkl-motor` y `.junie/ESTADO.md` y continúa desde ahí.»

## 1. Dónde está todo (carpeta raíz)
- **Carpeta raíz de Vórtice:** `/Users/juanpablomonsalvez/Downloads/brkl-motor`, rama `vortice/h1b1-p0e-puro`. Es un *worktree* del repositorio real `~/Downloads/Moodle-Theme-Creator` (ahí vive el `.git` y los `node_modules`). Remoto: `github.com/juanpablomonsalvezb-alt/brkl`.
- Diseño y decisiones: `docs/vortice/`. Piloto: `docs/vortice/piloto/`. Motor: `server/` y `shared/`. Migraciones: `migrations/vortice/`. Pruebas: `script/*.check.ts`. Pantallas: `client/src/pages/vortice/`. Instrucciones y decisiones para Junie: `.junie/`.
- Copias y carpetas auxiliares (no son la raíz): `brkl-motor-brujula` y `brkl-motor-cal` (copias aisladas de Junie, ya fusionadas), `brkl-prod-precios` (rama limpia desde `main` usada para publicar precios), `~/Downloads/brkl-libros` (libros convertidos a Markdown), `~/Downloads/BRKL_TEXTOS_OFICIALES` (textos y temario del piloto).

## 2. Reglas de trabajo vigentes
- **Junie programa, Claude es arquitecto.** Todo código nuevo lo hace Junie (CLI) en copia aislada; Claude escribe el brief, verifica por su cuenta (código de salida real, mutaciones, diff) y puede corregir lo que Junie ya hizo. Junie ha dejado errores reales que su informe no vio: en T34 el conteo de días daba 400 al cruzar el cambio de horario de septiembre de 2027; en T35 el fin con menos módulos, el conteo de semanas (31 en vez de 32) y el viernes de evaluación. **Verificar siempre.**
- **Producción solo con la orden explícita «PRODUCCION».** Se trabaja en rama, se prueba y se publica solo con esa orden. Vórtice: nada de push a `main`, migraciones reales ni Turso real sin autorización por etapa.
- **Archivos protegidos (no modificar):** `shared/p0e.ts`, `script/p0e.check.ts`, `script/mutar.ts`, `script/ventanas.check.ts`, `server/calendarUtils.ts`. Verificar sus hashes al iniciar y al cerrar.
- **Turso:** no usar la cuenta real para pruebas de carga (el 2026-11-20 lecturas masivas bloquearon la cuenta). E0 remoto cancelado.
- **Estilo:** responder en español, breve. Sin guiones largos en textos entregados. Decisiones del sostenedor con fecha en `.junie/DECISIONES_DIRECCION.md`.
- Prueba completa: `npm run check:vortice` (debe salir con código 0; comprobarlo con `echo $?`) y `npx tsc --noEmit`.

## 3. Estado de Vórtice (rama local y remota `vortice/h1b1-p0e-puro`)
Último commit: `5660554`. Rama empujada a GitHub el 2026-11-21 (CI en verde la primera vez; los commits posteriores a `4f9ee9f` están solo locales).

### 3.1 Evaluación de cierre E2 (P21 v2): hecha de punta a punta
- **Regla:** 1 intento normal + 1 extra (plazo 72 h, obligatorio para avanzar); aprobación 70 % (50 % neurodivergentes, sin redondeo); 15 preguntas; 60 min (120 sin cronómetro para neurodivergentes); sin nota 1 a 7; ≥ 35 % del extra de los subtemas fallados, sin repetir preguntas del normal; mejor porcentaje.
- **Migración 0005** (`migrations/vortice/0005_evaluacion.sql`): 8 tablas, con un trigger que acepta respuestas del normal o del extra (la FK original no dejaba guardar las del extra).
- **Servicio** `server/evaluacion.ts`: abrir proceso, iniciar intento, responder, enviar, cerrar, reabrir por administrador, cargador del banco (`cargarBancoExtra`), subtema = `item_id`.
- **Rutas** `server/evaluacionRoutes.ts` (apagadas salvo `VORTICE_EVALUACION_RUTAS=1`): proceso, estado, intentos, preguntas sin clave, responder (409 si ya hay respuesta), enviar, verificar tiempo, cerrar, y rutas de administrador (declarar perfil, reabrir).
- **Seguridad (revisión del 21-nov, 3 hallazgos corregidos con pruebas):** el tiempo lo aplica el servidor (`responder` rechaza vencido el plazo y `enviarIntento` no cuenta respuestas tardías); `cerrarProceso` exige aprobar, extra enviado o plazo vencido; `estado` y `proceso` exigen `checkEvaluationAccess` (matrícula y liberación).
- **Pantalla** `client/src/pages/vortice/VorticeEvaluacion.tsx` + `evaluacion.css`: estilo «cuaderno de examen»; modo calmo para neurodivergentes; las respuestas se guardan y no se cambian (la base es solo inserción). Enlazada desde el inicio de Vórtice (botón «Rendir mi evaluación») solo si las rutas están encendidas.
- **Probado en Vercel Preview** (`brkl-preview`, cuentas ficticias): recorrido completo 23 de 23 pasos (abrir, responder, reprobar, extra, aprobar, 401, 403, 404, admin). Las claves foráneas están activas en Turso remoto.
- **Demo local:** `npx tsx script/evaluacion-demo.ts` (puerto 3002; `/demo/entrar?u=est-reg` o `est-neuro`), datos ficticios y las 45 preguntas del piloto.

### 3.2 Brújula (panel del estudiante): hecha, fusionada (`9939051`)
Métricas por asignatura, ritmo frente al calendario (al día, atrasado, adelantado), próxima evaluación, mensajes de orientación sin culpa, panel en el inicio y botón «Brújula» en el menú. Ruta `GET /api/vortice/brujula/panel` (solo lectura). Código en `shared/brujulaPanel.ts`, `server/brujula.ts`, `client/src/pages/vortice/BrujulaPanel.tsx`. Pruebas: `script/brujula-panel.check.ts` (18 casos) y `script/brujula-mutacion.ts` (herramienta manual de mutación, no corre en la suite).
**Falta de Brújula (decidido, sin construir):** intensidad (suave, normal, intensivo), calendarización de bloques de estudio y vista del apoderado con correo semanal. Brújula nace de una apoderada que no sabía cómo le iba a su hijo.

### 3.3 Calendario 2027 por nivel: hecho, fusionado (`5660554`)
`shared/calendario2027.ts`, `script/calendario2027.check.ts` (13 casos) y `scripts/calendario2027-opciones.ts` (imprime la tabla de opciones). Recesos y feriados 2027 son **supuestos marcados** (invierno 5 al 16 de julio, Fiestas Patrias 13 al 17 de septiembre); la resolución del Mineduc no está publicada.

### 3.4 Piloto y banco
Matemática 5.º Básico, Unidad 3 (OA 7, 8, 10, 11, 13): 45 preguntas validadas con libretos de citas literales de los dos libros oficiales (Sumo Primero y Casa del Saber). Además 81 preguntas de los OA 1, 3, 4, 6, 15, 17, 18, 19 y 26 (`docs/vortice/piloto/mat5_resto/`), banco total de 126 preguntas con estado «validada» por script. **Sin revisión humana** de las 81 del resto ni de las preguntas escritas por Claude; las fracciones en los libros salen partidas por la conversión (solo se cita prosa).
Libros: 109 textos del estudiante en Markdown (`~/Downloads/brkl-libros/libros_md/`, índice en `INDICE_UNICO.md`): MINEDUC 2026 de 1.º básico a 4.º medio (69) y Casa del Saber de 1.º a 6.º básico (40). Las guías docentes no se convirtieron.

## 4. Decisiones de dirección del 2026-11-21
- **Cierre del año 2027:** viernes **15 de octubre** (resto de cursos) y miércoles **15 de septiembre** (4.º medio). Razón: los exámenes libres de menores 2026 fueron 8 al 19 de junio (1.er período, opcional), 21 de septiembre al 2 de octubre (solo 4.º medio y NEE) y 19 al 30 de octubre (resto de cursos). 4.º medio no puede rendir en la ventana de octubre y su certificado llega a inicios de noviembre, antes de la PAES regular (~30 de noviembre). El calendario oficial 2027 sale por resolución exenta entre febrero y abril: confirmarlo. Con inicio el 8 de marzo hay 32 semanas hasta el 15 de octubre, justo las del plan actual (15 módulos × 2 semanas + 2 de evaluación), sin descontar recesos; con recesos faltan unas 3 semanas y 4.º medio tiene ~27 semanas. **Pendiente: decidir cómo acortar el ciclo.**
- **Precios del plan escolar 2027** (Básica, Media I y Media II, mismo precio): lista anual \$490.000 tachada, pago único \$416.500 (15 % dto., ahorro \$73.500) y plan mensual \$70.000 × 7 pagos de marzo a septiembre. Octubre sin cobro mensual es intencional. Adultos y PAES sin cambio.

## 5. Producción (barkleyinstituto.cl), publicado el 2026-11-21 con la orden «PRODUCCION»
- PR 4, 5 y 6 fusionados a `main` desde ramas limpias (`precios-2027`, `precios-fuente-unica`, `precios-siete-pagos`). Solo cambios de precios y textos; **nada de Vórtice fue a producción.**
- La fuente única de precios es `shared/precios.ts` (marcadores `{{precio_escolar}}` etc.). Quedó: \$70.000, «7 pagos, de marzo a septiembre», \$490.000 / \$416.500 / \$73.500, «de marzo a octubre» (sin «31»). Verificado en el HTML publicado: 0 apariciones de \$65.000.
- En `main` no existe el catálogo de cobro por servidor ni Flow para el plan escolar; en producción los precios son lo que se muestra y reserva. El cobro mensual recurrente no está implementado en ninguna parte.
- Para revertir: un commit de reversa de cada PR.

## 6. Entornos y credenciales
- **Vercel:** proyecto `brkl`, rama de producción `main`; los Preview están protegidos (SSO). Vínculo local de Vercel en `/tmp/ctx/vl` (se pierde al reiniciar; recrear con `vercel link --yes --project brkl`).
- **Turso:** bases `brkl-db` (producción, no tocar), `brkl-preview` (pruebas, con las migraciones 0001 a 0005 y la evaluación sembrada sobre `ficticio-e2`), `brkl-staging` (sin uso). El Preview solo acepta hosts `brkl-preview-*` (guarda en `server/dbGuard.ts`). Variable `VORTICE_EVALUACION_RUTAS=1` activa solo en el Preview de la rama de Vórtice.
- Script `scripts/preparar-preview.ts` (migra y siembra la base de pruebas; rechaza cualquier otro host). Se creó un token de Turso de 1 día para `brkl-preview` (no se imprimió).
- Cuentas de prueba ficticias: `ficticio-estudiante`, `ficticio-ajeno`, `ficticio-admin`, etc. (acceso por cabeceras en el Preview).

## 7. Pendientes
| Pendiente | De quién |
|---|---|
| **Cómo acortar el ciclo 2027** (menos módulos, inicio en febrero u otra opción) y recesos oficiales | Tú |
| Confirmar el calendario oficial de exámenes libres 2027 (feb a abr) | Tú |
| **O4:** nombres de los 2 validadores del banco (sin ellos ninguna pregunta cumple «dos validadores») | Tú |
| P16 y P7 (columnas de la migración), dónde se declara el perfil neurodivergente en la base | Tú |
| Revisión humana de las 81 preguntas del resto y de las escritas por Claude | Tu equipo |
| Cobro mensual recurrente (Flow) para ofrecer los \$70.000 × 7: tarea para Junie | Junie |
| Brújula parte 2: intensidad, calendarización y vista del apoderado | Junie, con tu visto bueno |
| Aplicar la migración 0005 y las rutas a producción (etapa aparte, con tu orden) | Tú |
| Cifras de la landing (91,2 / 92,1 / 93,4 %, 70 %, estadísticas nacionales) con datos reales | Tú |
| Inconsistencia: landings dicen «pagas recién en febrero de 2027», la home «enero 2027» | Tú |
| Página antigua `PlanSelector2026` dice «8 cuotas de marzo a octubre» (no se tocó, no se sabe si está en uso) | Revisar |
| Alertas de uso en Turso (50 % y 80 %) | Tú |
| Ver en pantalla la tarjeta de precios y el panel de Brújula (solo se verificó el código publicado) | Tú |

## 8. Cómo lanzar a Junie (para Claude)
`cd <copia aislada> && junie -p . --max-steps=150 "Lee .junie/INSTRUCCIONES_ACTUALES.md y .junie/REGLAS_FIJAS.md y ejecuta la tarea Txx"`. En este Mac no existen `timeout` ni `gtimeout`: limitar con `perl -e 'alarm shift; exec @ARGV' 3300 <comando>`. Las copias se hacen con `rsync --exclude .git --exclude node_modules` (o `git archive HEAD`) + `git init` propio y `ln -s` a los `node_modules` del repositorio real. Nunca copiar el `.git` del worktree. Informes en `.junie/informes/` (T0 a T35).
