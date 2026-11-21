# HANDOFF: Barkley / Vórtice, estado al 2026-11-21

Consolida el traspaso del 20 de noviembre (`~/Downloads/BRKL_TRASPASO_2026-11-20.md`), el tablero `.junie/ESTADO.md`, las decisiones de dirección (`.junie/DECISIONES_DIRECCION.md`), las reglas globales de `~/.claude/CLAUDE.md` y todo lo hecho el 21 de noviembre. No existe un `CLAUDE.md` dentro del proyecto; `ARQUITECTURA_ESTANDAR.md` describe la plataforma antigua (carpeta de Drive con detección por nombre de archivo) y no rige Vórtice.

**Para retomar en una sesión nueva**, el primer mensaje: «Lee `HANDOFF.md` en la raíz de `~/Downloads/brkl-motor` y `.junie/ESTADO.md` y continúa desde ahí.»

**Carpeta raíz:** `/Users/juanpablomonsalvez/Downloads/brkl-motor`, rama `vortice/h1b1-p0e-puro`. Es un *worktree* del repositorio real `~/Downloads/Moodle-Theme-Creator` (ahí vive el `.git` y los `node_modules`). Remoto: `github.com/juanpablomonsalvezb-alt/brkl`.

---

## 1. Estado actual (terminado y verificado)

Verificación general al cierre: `npx tsc --noEmit` limpio y `npm run check:vortice` con código de salida 0. Último commit: `66529b0`.

| Módulo | Estado | Dónde | Cómo se verificó |
|---|---|---|---|
| **Evaluación de cierre E2 (P21 v2)**: reglas, migración 0005, servicio, rutas, pantalla | Terminado | `server/evaluacion.ts`, `server/evaluacionRoutes.ts`, `migrations/vortice/0005_evaluacion.sql`, `client/src/pages/vortice/VorticeEvaluacion.tsx` | Checks locales (servicio 22 casos, extra 11, rutas 17, base 25) y recorrido completo **23 de 23 pasos** en Vercel Preview con cuentas ficticias |
| **Seguridad de la evaluación** (3 hallazgos corregidos) | Terminado | mismos archivos | Cada corrección probada quitándola y viendo fallar su caso (mutación) |
| **Brújula, parte 1** (panel del estudiante: métricas, ritmo frente al calendario, mensajes sin culpa) | Terminado, fusionado | `shared/brujulaPanel.ts`, `server/brujula.ts`, `BrujulaPanel.tsx`, `brujula.css` | 18 casos puros y casos de servidor; conteo de días en calendario de Chile corregido tras verificar el trabajo de Junie. **No se vio en pantalla con datos reales** |
| **Calendario 2027 por nivel** (cuántos módulos caben antes del cierre, tabla de opciones) | Terminado, fusionado | `shared/calendario2027.ts`, `scripts/calendario2027-opciones.ts` | 13 casos; corregidos 3 errores de Junie |
| **Piloto y banco**: Matemática 5.º, Unidad 3 (OA 7, 8, 10, 11, 13) con 45 preguntas, más 81 de los OA 1, 3, 4, 6, 15, 17, 18, 19, 26 | Terminado a nivel de script | `docs/vortice/piloto/` | Cada pregunta con pasaje del libro verificado por script. Banco de 126 preguntas «validadas» por validadores de script, **sin revisión humana** |
| **Libros** (109 textos del estudiante en Markdown) | Terminado | `~/Downloads/brkl-libros/libros_md/` (índice `INDICE_UNICO.md`) | MINEDUC 2026 de 1.º básico a 4.º medio (69) y Casa del Saber de 1.º a 6.º básico (40); sin vacíos ni imágenes incrustadas |
| **Precios del plan escolar 2027 en producción** | Publicado | `shared/precios.ts` (fuente única) | HTML publicado verificado: 0 apariciones de \$65.000, «7 pagos, de marzo a septiembre» presente |
| **P0, P21 v2, armador del extra, énfasis 35 %, regla de publicable** | Terminado | `shared/*.ts` | Checks y mutaciones del 20 de noviembre |

Detalle de la evaluación E2:
- **Regla:** 1 intento normal más 1 extra (plazo 72 h, obligatorio para avanzar), aprobación 70 % (50 % para neurodivergentes, sin redondeo), 15 preguntas, 60 min con reloj (120 min sin cronómetro y con avisos suaves para neurodivergentes), sin nota 1 a 7, el extra toma al menos 35 % de los subtemas fallados y nunca repite preguntas del normal, vale el mejor porcentaje.
- **Rutas apagadas por defecto:** solo se registran con `VORTICE_EVALUACION_RUTAS=1`. Se enlazan desde el inicio de Vórtice solo si están encendidas.
- **Demo local:** `npx tsx script/evaluacion-demo.ts` (puerto 3002; entrar por `/demo/entrar?u=est-reg` o `?u=est-neuro`), con las 45 preguntas del piloto.

---

## 2. Decisiones de arquitectura y reglas (NO cambiar sin decisión del sostenedor)

**Roles y método**
- **Junie programa; Claude es el arquitecto.** Todo código nuevo lo hace Junie (CLI) en una copia aislada; Claude escribe el brief, verifica por su cuenta (código de salida real, mutaciones, diff) y corrige lo que Junie ya hizo. No escribir features nuevas desde cero (decisión del sostenedor, 2026-11-21, para cuidar sus tokens).
- Cada decisión de dirección se registra con fecha en `.junie/DECISIONES_DIRECCION.md`.

**Producción y seguridad operativa**
- **Producción solo con la orden explícita «PRODUCCION».** Se trabaja en rama, se prueba y se publica con esa orden. Se publica desde una rama limpia a partir de `main` con solo lo pedido (así se hizo con los precios); **nada de Vórtice ha ido a producción**.
- Vórtice: ningún push a `main`, migración real ni Turso real sin autorización por etapa. La migración 0005 y las rutas de evaluación no se han aplicado a producción.
- **Turso:** no usar la cuenta real para pruebas de carga (el 2026-11-20 lecturas masivas bloquearon toda la cuenta). E0 remoto cancelado. El Preview solo acepta bases `brkl-preview-*` (`server/dbGuard.ts`).

**Reglas de las reglas globales (`~/.claude/CLAUDE.md`)**
- Responder siempre en español, breve. Sin guiones largos en textos entregados. Español neutro (tú, no voseo).
- Código nuevo: implementar, revisar el diff (`/code-review`), revisar seguridad (`/security-review`), corregir y recién entonces commit. En Vórtice, commit solo local hasta que el sostenedor ordene el push.

**Reglas del dominio**
- **Prioridad curricular:** manda el temario de Exámenes Libres 2026 (MINEDUC); lo que no está en él igual se estudia con menor énfasis. Toda pregunta debe citar fuente oficial (OA, texto escolar o programa). Contenido y preguntas salen de los libros oficiales (meta ~90 %) y **se consultan siempre ambas fuentes** (Sumo Primero y Casa del Saber). Prohibido usar Khan Academy o Coursera como referente.
- **Archivos protegidos (no modificar, verificar sus hashes al iniciar y al cerrar):** `shared/p0e.ts`, `script/p0e.check.ts`, `script/mutar.ts`, `script/ventanas.check.ts`, `server/calendarUtils.ts`. No tocar la especificación maestra ni el commit E0 (`2edf702`).
- **Respuestas de la evaluación: solo inserción.** Una respuesta guardada no se cambia; la pantalla lo avisa y se guarda al confirmar.
- **Porcentajes sin redondeo:** se muestran truncados (69,99 nunca se ve como 70).
- Brújula: orienta y propone, **sin castigos, rachas ni puntajes ni culpa**. Los mensajes son por reglas, sin IA.
- ORBBI no debe llevar IA en el producto sin instrucción explícita; Barkley no nombra al fundador ni a su colegio anterior en el sitio.

**Fechas y precios decididos (2026-11-21)**
- **Cierre del año 2027:** viernes **15 de octubre** para 1.º básico a 3.º medio y miércoles **15 de septiembre** para 4.º medio (4.º medio no puede rendir en la ventana de octubre).
- **Precios del plan escolar** (Básica, Media I y Media II, mismo precio): lista anual \$490.000 tachada, pago único \$416.500 (15 % de descuento, ahorro \$73.500) y mensual \$70.000 × 7 pagos de marzo a septiembre. Octubre sin cobro mensual es intencional. Adultos y PAES sin cambio. Fuente única: `shared/precios.ts`.
- El año de preparación se escribe «de marzo a octubre» (sin «31»).

---

## 3. Punto exacto donde quedamos

1. **Calendario 2027:** la tabla de opciones está lista, pero **falta que el sostenedor decida cómo acortar el ciclo.** Con inicio el 8 de marzo hay 32 semanas hasta el 15 de octubre, justo el plan actual (15 módulos × 2 semanas + 2 de evaluación), pero **no cabe con receso de invierno y Fiestas Patrias** (faltan unas 3 semanas); 4.º medio tiene ~27 semanas.
2. **Brújula parte 2** (intensidad suave, normal e intensivo; calendarización de bloques de estudio; vista del apoderado con correo semanal): decidida, **sin construir**.
3. **Plan mensual de \$70.000:** hoy solo se *muestra*; el servidor cobra un solo monto. El cobro mensual recurrente no está implementado en ninguna parte.
4. **Evaluación E2:** lista y probada en Preview. Falta aplicar la migración 0005 y las rutas a producción (etapa aparte, con orden explícita), cargar las 45 preguntas con validación humana y definir dónde se declara el perfil neurodivergente en la base.
5. **Rama de Vórtice:** empujada a GitHub hasta `4f9ee9f`; los commits siguientes (corrección de 409, Brújula, calendario, precios locales, este archivo) están solo locales.

---

## 4. Próximas tareas en orden de prioridad

1. **Decidir cómo acortar el ciclo 2027** (menos módulos, inicio en febrero u otra opción) y definir los recesos reales; luego pedirle a Junie que lo aplique como `program_calendar` por nivel (con 4.º medio propio).
2. **Confirmar el calendario oficial de exámenes libres 2027** (resolución exenta del Mineduc, suele salir entre febrero y abril) y revisar las dos fechas de cierre.
3. **Nombrar a los 2 validadores del banco (O4)** y organizar la revisión humana de las 81 preguntas del resto y de las escritas por Claude. Sin esto ninguna pregunta cumple «dos validadores».
4. **Decidir P16 y P7** (columnas de la migración) y dónde se declara el perfil neurodivergente; luego autorizar la migración 0005 en producción.
5. **Tarea para Junie: cobro mensual recurrente (Flow)** para poder ofrecer \$70.000 × 7.
6. **Tarea para Junie: Brújula parte 2** (con tu visto bueno por parte).
7. **Ver en pantalla** la tarjeta de precios y el panel de Brújula; ajustar si no gustan.
8. Corregir la inconsistencia de fechas de cobro (landings: «pagas recién en febrero de 2027»; home: «Arancel desde enero 2027»).
9. Cifras de la landing con datos reales (91,2 / 92,1 / 93,4 %, 70 %, estadísticas nacionales de «Por qué Barkley»).
10. Alertas de uso en Turso (50 % y 80 %). Interfaz restante, M2 a M8 y piloto con estudiantes: etapas futuras, cada una con autorización.

---

## 5. Advertencias y deuda técnica

**Lecciones sobre el trabajo de Junie (verificar SIEMPRE por tu cuenta):** su informe dijo «OK» con errores reales:
- T30: inventó 50 citas y dijo que el texto «no era exacto».
- T33: un check imprimía «ok» pero salía con código 1 (casos V1 y V2 duplicados con la salida borrada).
- T34: el conteo de días daba **400 al cruzar el 5 de septiembre de 2027** (cambio de horario, la medianoche no existe); su prueba de horario de verano solo cubría abril.
- T35: con menos módulos la opción de ajuste ignoraba los últimos módulos (decía «cabe» con fin en junio), el conteo de semanas daba 31 en vez de 32 y el viernes de evaluación salía jueves cerca del cambio de horario. Arreglado por el arquitecto.
- Además cambió una vez el ejecutor de mutaciones sin permiso (rechazado y restaurado). Verificar el ejecutor y los grupos antiguos.
- Recalcular a mano las respuestas correctas del banco; revisar alternativas con la misma afirmación; no usar dinero con decimales; sin páginas en el cuerpo de los libretos; «según el libro» solo si se verifica.

**Deuda técnica y errores conocidos**
- La migración 0005 se editó en su sitio (trigger `eaa_pregunta_del_intento`) porque nunca se aplicó a una base real; en `brkl-preview` ya está aplicada con esa versión.
- `server/evaluacion.ts` tiene un nombre `ErrorEvaluacion` mapeado a HTTP en `evaluacionRoutes.ts`; el código `proceso_no_encontrado` también se usa como respuesta de «ya existe» en `abrirProceso` (la ruta lo evita comprobando antes).
- El extra no excluye variantes de la misma familia de una pregunta del normal (solo garantiza ids distintos) ni filtra el banco por evaluación, solo por los subtemas de la versión.
- En `main` (producción) **no existe** el catálogo de cobro por servidor ni Flow para el plan escolar: los precios son lo que se muestra y reserva. Los snapshots prerenderizados para buscadores (`client/public/prerendered/*.html`) se parchearon a mano con los precios nuevos: **regenerarlos con `npm run prerender` falló** (timeout esperando el servidor) y `npm run seo:build` mete cambios ajenos a precios (títulos y fuentes). No regenerar a ciegas.
- `api/handler.js` es un artefacto versionado que `npm run build` regenera; revertirlo (`git checkout -- api/handler.js`) tras compilar localmente.
- Errores de tipos antiguos ya existentes en `main` (`GeminiCopilotButton.tsx`, `PlanConfiguratorAdultsNew.tsx`); no son de Vórtice.
- Página antigua `PlanSelector2026` dice «8 cuotas de marzo a octubre»: no se tocó, no se sabe si está en uso.
- Los recesos 2027 (`SUPUESTOS_2027`) son supuestos marcados; la lista de feriados está vacía a propósito hasta que haya resolución oficial.
- Las fracciones en los libros convertidos salen partidas; solo se cita prosa. Los libros de Casa del Saber son de 2013 y los de MINEDUC de 2026: riesgo de desfase de edición al citar.

**Archivos y datos delicados**
- No tocar: los 5 archivos protegidos, la especificación maestra, el commit `2edf702`, ni `brkl-db` (producción).
- El token de Turso de 1 día para `brkl-preview` y el secreto del acceso de prueba de Vercel están en el entorno local (`/tmp/ctx/vl/.env.preview`); no commitear ni pegar en ningún lado. El vínculo local de Vercel (`/tmp/ctx/vl`) se pierde al reiniciar: recrear con `vercel link --yes --project brkl`.
- `script/evaluacion-demo.ts` entrega la clave de respuestas por `/demo/clave`: es solo para desarrollo local, nunca montar esa ruta en un servidor real.

**Cómo lanzar a Junie:** `cd <copia aislada> && junie -p . --max-steps=150 "Lee .junie/INSTRUCCIONES_ACTUALES.md y .junie/REGLAS_FIJAS.md y ejecuta la tarea Txx"`. En este Mac no existen `timeout` ni `gtimeout`: limitar con `perl -e 'alarm shift; exec @ARGV' 3300 <comando>`. Copias con `rsync --exclude .git --exclude node_modules` (o `git archive HEAD`) más `git init` propio y `ln -s` a los `node_modules` del repositorio real; nunca copiar el `.git` del worktree. Informes en `.junie/informes/` (T0 a T35).

**Otras carpetas (no son la raíz):** `brkl-motor-brujula` y `brkl-motor-cal` (copias aisladas de Junie ya fusionadas, se pueden borrar), `brkl-prod-precios` (rama limpia desde `main` para publicar precios), `~/Downloads/BRKL_TEXTOS_OFICIALES` (textos y temario del piloto).
