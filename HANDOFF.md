> **DOCUMENTO HISTÓRICO (desde 2026-11-22).** No es la fuente del estado actual. Usar `docs/vortice/MEMORIA.md` (estado vivo) y `docs/vortice/CAMBIOS.md`. Se conserva como registro.

# HANDOFF: Barkley / Vórtice, estado al 2026-11-21

Consolida el traspaso del 20 de noviembre (`~/Downloads/BRKL_TRASPASO_2026-11-20.md`), el tablero `.junie/ESTADO.md`, las decisiones de dirección (`.junie/DECISIONES_DIRECCION.md`), las reglas globales de `~/.claude/CLAUDE.md` y todo lo hecho el 21 de noviembre. No existe un `CLAUDE.md` dentro del proyecto; `ARQUITECTURA_ESTANDAR.md` describe la plataforma antigua (carpeta de Drive con detección por nombre de archivo) y no rige Vórtice.

**Para retomar en una sesión nueva**, el primer mensaje: «Lee `HANDOFF.md` en la raíz de `~/Downloads/brkl-motor` y `.junie/ESTADO.md` y continúa desde ahí.»

**Carpeta raíz:** `/Users/juanpablomonsalvez/Downloads/brkl-motor`, rama `vortice/h1b1-p0e-puro`. Es un *worktree* del repositorio real `~/Downloads/Moodle-Theme-Creator` (ahí vive el `.git` y los `node_modules`). Remoto: `github.com/juanpablomonsalvezb-alt/brkl`.

---

## 1. Estado actual (terminado y verificado)

Verificación general al cierre: `npx tsc --noEmit` limpio y `npm run check:vortice` con código de salida 0 en rama local `vortice/h1b1-p0e-puro` (sin push ni escritura en Turso/producción).

| Módulo | Estado | Dónde | Cómo se verificó |
|---|---|---|---|
| **Evaluación de cierre E2 (P21 v2)**: reglas, migración 0005, servicio, rutas, pantalla | Terminado | `server/evaluacion.ts`, `server/evaluacionRoutes.ts`, `migrations/vortice/0005_evaluacion.sql`, `client/src/pages/vortice/VorticeEvaluacion.tsx` | Checks locales (servicio 22 casos, extra 11, rutas 17, base 25) y recorrido completo **23 de 23 pasos** en Vercel Preview con cuentas ficticias |
| **Seguridad de la evaluación** (3 hallazgos corregidos) | Terminado | mismos archivos | Cada corrección probada quitándola y viendo fallar su caso (mutación) |
| **Brújula, parte 1 y 2** (panel del estudiante, intensidad suave/normal/intensivo, bloques semanales, vista `/familia` del apoderado y correo semanal) | Terminado en local | `shared/brujula.ts`, `shared/brujulaPanel.ts`, `server/brujula.ts`, `server/familia.ts`, `server/notificaciones.ts`, `BrujulaPanel.tsx`, `FamiliaVista.tsx` | 18 casos panel, `brujula.check.ts`, `brujula-parte2.check.ts`, `familia-db.check.ts`, `notificaciones.check.ts` y 3/3 mutaciones |
| **Cobro mensual recurrente (Flow)** (\$70.000 × 7 pagos marzo a septiembre) + sync `shared/precios.ts` | Terminado en local | `shared/planPrices.ts`, `shared/precios.ts`, `server/flowService.ts`, `server/flowSubscriptions.ts`, `server/flowRoutes.ts`, `ReservationDialog.tsx`, `PaymentResult.tsx` | `pagos.check.ts`, `flow-suscripciones.check.ts` y 3/3 mutaciones (Flow simulado sin red) |
| **Migraciones SQL listas (T37 + T38 + T39 + Bloque A)** (`flow_subscriptions`, `brujula_preferences`, `brujula_study_blocks`, `user_profiles.evaluation_profile*`, `module_evaluations.evaluation_function`, `lesson_study_progress`) | Listas en local (sin aplicar a Turso) | `docs/vortice-migracion.sql`, `docs/vortice-migracion-incremental-flow-brujula2.sql`, `docs/vortice-migracion-incremental-perfil-y-evaluaciones.sql`, `docs/vortice-migracion-incremental-aula-universal.sql` | `migraciones-nuevas.check.ts` (paridad exacta con `shared/schema.ts`, constraints, idempotencia, convivencia con `0001..0005`) |
| **Perfil único neurodivergente y clasificación de evaluaciones (0 diagnóstico, 1..3 proceso, 4 módulo)** | Terminado en local | `shared/clasificacionEvaluacion.ts`, `shared/schema.ts`, `server/perfilEvaluacion.ts`, `server/evaluacionRoutes.ts`, `server/vortice.ts`, `server/storage.ts`, `server/analitica.ts`, `server/routes.ts`, `CoursePlayer.tsx`, `VorticeEvaluacion.tsx` | `perfil-y-clasificacion.check.ts` y 3/3 mutaciones |
| **Bloque A · Aula Universal UDL del piloto** (5 OA en 4 bloques, 1 puerta + apoyos desplegables, voz Web Speech API, pistas 3 niveles sin IA, guardado por tramo) | Terminado en local | `shared/aulaUniversal.ts`, `server/aulaUniversal.ts`, `server/routes.ts`, `client/src/pages/vortice/VorticeAula.tsx`, `VorticeInicio.tsx` | `aula-universal.check.ts`, `migraciones-nuevas.check.ts` y mutación de cordura |
| **Bloque B · Panel Admin T39** (listado y edición de `evaluation_profile` y clasificación `0..4` con P7 heredado) | Terminado en local | `server/perfilEvaluacion.ts`, `server/routes.ts`, `client/src/pages/EvaluacionesPerfilAdmin.tsx`, `BarkleyAdmin.tsx` | `admin-perfiles-ui.check.ts` y mutación de cordura |
| **Bloque C · Flow Sandbox recurrente** (`$70.000 × 7`, guardia contra `www.flow.cl`, simulador HTTP HMAC y modo sandbox real) | Terminado en local | `shared/flowSandbox.ts`, `server/flowService.ts`, `scripts/probar-flow-sandbox.ts` | `flow-sandbox.check.ts`, `probar-flow-sandbox.ts --simulado` y mutación de cordura |
| **Paso 2 · Motor en sombra M2 + Mapa «Mis conocimientos» M3** (piloto `d-piloto-mat5-u3`, cálculo de fronteras/recomendación, rutas M2/M3, enganche en sombra desde aula, vista `/vortice/conocimientos`) | Terminado en local | `shared/mapaConocimiento.ts`, `server/sembrarPilotoPractica.ts`, `server/mapaConocimiento.ts`, `server/routes.ts`, `VorticeMapa.tsx`, `VorticeAula.tsx`, `VorticeInicio.tsx`, `App.tsx`, `evaluacion-demo.ts` | `mapa-conocimiento.check.ts`, `conocimiento.check.ts`, `reloj.check.ts`, `acceso.check.ts` y mutaciones de cordura |
| **Paso 3 · Retención M4 + Cruce evaluación `4` M5/M6** (agenda espaciada `[3,7,14,30]` sin castigo, embargo P19-E1, bloqueo P18, refuerzo C8 y progresión P21 v2) | Terminado en local | `shared/retencionMapa.ts`, `shared/cruceEvaluacionMapa.ts`, `shared/mapaConocimiento.ts`, `server/retencionMapa.ts`, `server/cruceEvaluacionMapa.ts`, `server/mapaConocimiento.ts`, `server/evaluacion.ts`, `server/vortice.ts`, `server/routes.ts`, `VorticeMapa.tsx`, `VorticeEvaluacion.tsx`, `evaluacion-demo.ts` | `retencion-cruce-m4m5m6.check.ts` (NI1–NI5, M4, M6), `conocimiento.check.ts`, `reloj.check.ts`, `evaluacion-servicio`, `evaluacion-rutas` y 2/2 mutaciones de cordura |
| **Rediseño visual editorial de Vórtice** (tipografía `Newsreader` + `DM Sans` + `JetBrains Mono`, fondo `#FAF9F5`, acento `#C96442` y verde `#1F4A3D`, aislado bajo `.vx-editorial`, `.vx` y `.ve`) | Terminado en local | `client/index.html`, `vortice-editorial.css`, `vortice.css`, `brujula.css`, `evaluacion.css`, `VorticeInicio.tsx`, `FamiliaVista.tsx`, `VorticeMapa.tsx`, `VorticeAula.tsx`, `VorticeEvaluacion.tsx`, `EvaluacionesPerfilAdmin.tsx` | `npx vite build`, `npx tsc --noEmit`, `npm run check:vortice` (70/70) y checksums protegidos sin tocar backend ni landing |
| **Fechas de cobro unificadas (enero de 2027)** | Terminado en local | `Home.tsx`, `Legal.tsx`, `prerendered/reembolso.html`, `scripts/generate-landings.mjs`, 12 landings `examenes-libres-*`, `guia-examenes-libres`, `server/notify.ts` | `fechas-cobro.check.ts` y mutación de cordura (sin tocar Verano Barkley ni regenerar a ciegas) |
| **Monitor de uso en Turso (50 % / 80 %)** (`turso plan show`, solo lectura) | Terminado | `shared/tursoUso.ts`, `scripts/turso-uso-alerta.ts` | `turso-uso.check.ts`, 2/2 mutaciones y lectura real de cuota Turso |
| **Calendario 2027 por nivel** (cuántos módulos caben antes del cierre, tabla de opciones y carga idempotente `program_calendar` por nivel) | Terminado | `shared/calendario2027.ts`, `server/calendario2027Db.ts`, `scripts/aplicar-calendario-2027.ts`, `scripts/calendario2027-opciones.ts` | 16 casos puros (`calendario2027.check.ts`) y 12 casos DB en memoria (`calendario2027-db.check.ts`); 3/3 mutaciones |
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
- **Solo Neon e Hydrogen (decisión del sostenedor, 2026-11-21):** se deja de usar Junie CLI. La planificación/arquitectura se hace con Neon y la ejecución/código con Hydrogen en este entorno, manteniendo verificación por código de salida real, mutaciones y revisión de código/seguridad. (Regla previa de Junie CLI reemplazada tras T36.)
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
- **Estándar universal de estudio (UDL, 2026-11-21):** el aula de estudio es idéntica para todos (1 puerta principal en «Aprende» + apoyos desplegables, libreto en 4 bloques con guardado real por tramo, audio híbrido opcional con «Escuchar enunciado», diagnóstico `0` orientador con «Ya lo sé», proceso `1..3` sin reloj ni porcentaje visible, pistas deterministas en 3 niveles sin IA y preferencias de estudio sin diagnósticos clínicos). El `evaluation_profile` (`regular` vs. `neurodivergente`) diferencia **exclusivamente** la Evaluación del módulo (`4`) (60/120 min, reloj visible/oculto, avisos, 70 %/50 % sin redondeo).

**Fechas, calendario y precios decididos (2026-11-21)**
- **Cierre del año 2027:** viernes **15 de octubre** para 1.º básico a 3.º medio y miércoles **15 de septiembre** para 4.º medio (4.º medio no puede rendir en la ventana de octubre).
- **Ciclo y recesos 2027:** sin recesos (`breaks: []`); feriados pendientes de resolución exenta del Mineduc 2027 (`holidays: []`). Desde lunes 8 de marzo: `1b`–`3m` mantienen 15 módulos × 2 semanas + 2 evaluaciones generales (termina 15 de octubre); `4m` usa 12 módulos × 2 semanas + 2 evaluaciones generales (termina 3 de septiembre); adultos (`nb1`–`nm2`) quedan fuera y no se crea fila `level_id = NULL`.
- **Precios del plan escolar** (Básica, Media I y Media II, mismo precio): lista anual \$490.000 tachada, pago único \$416.500 (15 % de descuento, ahorro \$73.500) y mensual \$70.000 × 7 pagos de marzo a septiembre. Octubre sin cobro mensual es intencional. Adultos y PAES sin cambio. Fuente única: `shared/precios.ts`.
- El año de preparación se escribe «de marzo a octubre» (sin «31»).

---

## 3. Punto exacto donde quedamos

1. **Calendario 2027:** definición cerrada (sin recesos; 1b–3m 15 módulos; 4m 12 módulos; adultos fuera) y cargador idempotente `applyCalendario2027` + script local `scripts/aplicar-calendario-2027.ts` listos en rama local (T36). Falta resolución exenta Mineduc 2027 para cargar feriados y autorización aparte para aplicar a Turso/producción.
2. **Brújula parte 1 y 2** (panel del estudiante, intensidad, bloques semanales, vista `/familia` y correo semanal al apoderado): construidas en rama local y con SQL listo/verificado en local (`docs/vortice-migracion.sql` + `docs/vortice-migracion-incremental-flow-brujula2.sql`); pendiente autorización para aplicar a Turso/producción.
3. **Plan mensual de \$70.000 × 7 (Flow recurrente):** flujo de suscripción implementado y probado en rama local con Flow simulado y SQL listo/verificado en local; pendiente autorización para aplicar migración a Turso/producción y prueba en sandbox/credenciales reales.
4. **Evaluación E2 y clasificación real de evaluaciones (T39):** `0` = evaluación de diagnóstico (al abrir el módulo), `1..3` = evaluaciones de proceso, `4` = evaluación del módulo (cierre que habilita el siguiente; compatibilidad P7 conservada cuando `evaluation_function` es `NULL`), y perfil `regular`/`neurodivergente` único por alumno en `user_profiles`. Listo en rama local junto con sus migraciones SQL (`docs/vortice-migracion-incremental-perfil-y-evaluaciones.sql`). Falta autorización aparte para aplicar `0005` + migraciones T37/T38/T39 a Turso/producción, encender rutas y validar las 45 preguntas humanas.
5. **Fechas de cobro:** unificadas en rama local a **enero de 2027** (pendiente push/publicación con orden explícita).
6. **Bloques A, B y C cerrados en local:** Aula Universal UDL (`/vortice/aula` con `lesson_study_progress`), panel admin T39 (`/admin/evaluaciones-perfil`) y Flow Sandbox (`scripts/probar-flow-sandbox.ts --simulado` y guardia contra `www.flow.cl`; falta solo configurar `FLOW_API_KEY`/`FLOW_SECRET_KEY` sandbox si se quiere probar contra el endpoint remoto de Flow Sandbox).
7. **Paso 2 cerrado en local (M2 + M3):** motor en sombra sobre `d-piloto-mat5-u3` (`shared/mapaConocimiento.ts`, `server/sembrarPilotoPractica.ts`, `server/mapaConocimiento.ts`, enganche en sombra desde `/api/vortice/aula/lecciones/:oaId/comprobar`), rutas M2/M3 y vista «Mis conocimientos» (`/vortice/conocimientos` en `VorticeMapa.tsx`). Sin tocar `server/conocimiento.ts`, `server/practica.ts`, `server/reconstruccion.ts`, `0001..0005` ni los 5 archivos protegidos.
8. **Paso 3 cerrado en local (M4 + M5/M6):** agenda de retención `[3, 7, 14, 30]` días sin castigo por ausencia (`shared/retencionMapa.ts`, `server/retencionMapa.ts`, rutas `GET/POST /api/vortice/conocimiento/retencion` con `Cache-Control: no-store`), cruce embargado bajo P19-E1 / NI1–NI5 y P18 (`shared/cruceEvaluacionMapa.ts`, `server/cruceEvaluacionMapa.ts`, refuerzo C8 rec. A), progresión P21 v2 real en `server/evaluacion.ts` (`progression_continuations` en todo reprobado y orden de transición P0-E en `enviarIntento`) y `server/vortice.ts`, vistas en `VorticeMapa.tsx` / `VorticeEvaluacion.tsx` y demo local en `script/evaluacion-demo.ts`. Sin tocar `server/conocimiento.ts`, `server/practica.ts`, `server/reconstruccion.ts`, `0001..0005` ni los 5 archivos protegidos.
9. **Rediseño visual editorial de Vórtice cerrado en local:** sistema tipográfico y visual inspirado en Anthropic (`Newsreader` 400/500/600, `DM Sans`, `JetBrains Mono`, fondo cálido alabastro `#FAF9F5`, acento terracota `#C96442` y verde `#1F4A3D`) en `client/index.html`, `vortice-editorial.css`, `vortice.css`, `brujula.css`, `evaluacion.css`, `VorticeInicio.tsx`, `FamiliaVista.tsx`, `VorticeMapa.tsx`, `VorticeAula.tsx`, `VorticeEvaluacion.tsx` y `EvaluacionesPerfilAdmin.tsx`, preservando `[data-calmo="1"]` y aislado bajo `.vx-editorial`, `.vx` y `.ve` sin alterar backend ni la landing `Home.tsx`. Pendiente inspección visual en Chrome una vez habilitado `chrome://inspect/#remote-debugging`.
10. **Rama de Vórtice:** todos los cambios están en rama `vortice/h1b1-p0e-puro`, sin push a `main` ni escritura en producción/`brkl-db`.

---

## 4. Próximas tareas en orden de prioridad

1. ~~Decidir cómo acortar el ciclo 2027 y aplicarlo como `program_calendar` por nivel~~ (**hecho en T36**, pendiente aplicar a base real tras autorización y feriados 2027).
2. **Confirmar el calendario oficial de exámenes libres 2027** (resolución exenta del Mineduc, suele salir entre febrero y abril), cargar feriados reales y revisar las dos fechas de cierre.
3. **Nombrar a los 2 validadores del banco (O4)** y organizar la revisión humana de las 81 preguntas del resto y de las escritas por Claude. Sin esto ninguna pregunta cumple «dos validadores».
4. ~~Decidir P16 y P7 (columnas de la migración) y dónde se declara el perfil neurodivergente; luego autorizar la migración 0005 en producción.~~ (**T39 decidido e implementado en local:** perfil en `user_profiles`, `0` diagnóstico / `1..3` proceso / `4` evaluación del módulo y compatibilidad P7; falta autorizar aplicación de `0005` + SQL incremental en Turso/producción).
5. ~~Cobro mensual recurrente (Flow)~~ (**hecho en local**, pendiente migración/Turso y prueba con credenciales reales).
6. ~~Brújula parte 2~~ (**hecho en local**, pendiente migración/Turso).
7. **Ver en pantalla** la tarjeta de precios, el panel de Brújula (parte 1 y 2) y `/familia`; ajustar si no gustan.
8. ~~Corregir la inconsistencia de fechas de cobro (landings: «pagas recién en febrero de 2027»; home: «Arancel desde enero 2027»).~~ (**unificadas a «enero de 2027» en rama local**, pendiente publicación tras autorización).
9. Cifras de la landing con datos reales (auditado: `91,2 / 92,1 / 93,4 %` ya no figuran en `Home.tsx`, solo el 70 % de regla de dominio).
10. ~~Alertas de uso en Turso (50 % y 80 %)~~ (**hecho** con `scripts/turso-uso-alerta.ts`). Interfaz restante, M7 a M8 y piloto con estudiantes: etapas futuras, cada una con autorización.

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
- Página antigua `PlanSelector2026` retirada: `/planes-2026` y `AsiTrabajamos.tsx` ya redirigen a `/#precio`.
- Los recesos 2027 (`SUPUESTOS_2027`) son supuestos marcados; la lista de feriados está vacía a propósito hasta que haya resolución oficial.
- Las fracciones en los libros convertidos salen partidas; solo se cita prosa. Los libros de Casa del Saber son de 2013 y los de MINEDUC de 2026: riesgo de desfase de edición al citar.

**Archivos y datos delicados**
- No tocar: los 5 archivos protegidos, la especificación maestra, el commit `2edf702`, ni `brkl-db` (producción).
- El token de Turso de 1 día para `brkl-preview` y el secreto del acceso de prueba de Vercel están en el entorno local (`/tmp/ctx/vl/.env.preview`); no commitear ni pegar en ningún lado. El vínculo local de Vercel (`/tmp/ctx/vl`) se pierde al reiniciar: recrear con `vercel link --yes --project brkl`.
- `script/evaluacion-demo.ts` entrega la clave de respuestas por `/demo/clave`: es solo para desarrollo local, nunca montar esa ruta en un servidor real.

**Historial de copias aisladas (método anterior con Junie, hasta T36):** `brkl-motor-brujula`, `brkl-motor-cal` y `brkl-motor-cal2027` ya fueron fusionadas y se pueden borrar. Informes históricos en `.junie/informes/` (T0 a T36). En este Mac no existen `timeout` ni `gtimeout`: si hace falta limitar un comando, usar `perl -e 'alarm shift; exec @ARGV' 3300 <comando>`.

**Otras carpetas (no son la raíz):** `brkl-prod-precios` (rama limpia desde `main` para publicar precios), `~/Downloads/BRKL_TEXTOS_OFICIALES` (textos y temario del piloto).
