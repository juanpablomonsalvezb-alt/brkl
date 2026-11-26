# UI-01 · Blueprint de interfaz de Vórtice

Fecha: 2026-11-26. Base: rama `vortice/h1b1-p0e-puro`, commit `5060b47` más el árbol de trabajo (ver 0.1).
Destinatario: agente implementador. Dirección única; no hay alternativas por elegir salvo las de la sección 11.

## 0. Antes de empezar

### 0.1 Árbol de trabajo ocupado
Al auditar había 17 archivos modificados y 5 nuevos sin confirmar, de otra sesión de trabajo (seguridad de aula, mapa, familia, portafolio, tutoría y sesiones). Incluyen `VorticeAula.tsx`, `VorticeMiAno.tsx` y `TutorBandeja.tsx`. **No implementar nada hasta que ese trabajo esté confirmado.** Después, volver a leer esos tres archivos.

### 0.2 Qué se inspeccionó y cómo
- Código de las pantallas de Vórtice, sus CSS y las rutas.
- Pantallas vistas en navegador con datos simulados: Inicio (1440 y 375 px), Aula, Mapa, Familia, Tutor, `/course/:id`, `/academic-copilot`, Evaluación (inicio, pregunta, modo calmo).
- **No visto en navegador:** Mi año (visto en una tarea anterior a 375 px), Together, estados de error y de carga, tablet, resultado de evaluación, sesión real. Lo que se afirma de ellos sale del código.

## 1. Diagnóstico

### 1.1 Qué existe hoy
| Sistema visual | Dónde | Cómo se reconoce |
|---|---|---|
| A. Shell con barra lateral | `VorticeInicio`, `FamiliaVista` | `.vx`, `vortice.css` |
| B. Página centrada con «Volver» | `VorticeAula`, `VorticeMapa`, `VorticeMiAno`, `TutorBandeja` | `.vx-editorial`, `.vx-topbar`, shadcn + Tailwind con hex a mano |
| C. Hoja de evaluación | `VorticeEvaluacion` | `.ve`, `evaluacion.css`, variables `--ve-*` |
| D. Heredado | `CoursePlayer`, `AcademicCopilot`, `Together`, `/dashboard` | Poppins, carmesí `#A51C30`, degradado violeta |

Medidas:
- Hex escritos en clases: `VorticeAula` 142, `VorticeMapa` 120, `VorticeInicio` 25, `BrujulaPanel` 10.
- 23 tamaños de fuente distintos en los CSS (de 10 a 32 px) y 15 radios distintos.
- 5 familias de botón: `.vx-cta`, `.vx-btn-primary`, `.vx-btn-ghost`, `.vx-pill-nav`, `.ve-btn`.
- 4 familias de superficie: `.vx-card`, `Card` de shadcn, `.vx-paper`, `.ve-hoja`.

Inicio:
- 8 tarjetas, 38 controles, 2.724 px de alto a 1440 (3 pantallas) y 4.993 px a 375 (6,1 pantallas).
- La acción principal aparece dos veces (hero y «Mi próximo paso») y hay tres enlaces al mapa.
- «Repasos hoy» se muestra 3 veces; «Metas de la semana» 2; estrellas 2.
- La columna derecha termina mucho más abajo que la izquierda y deja un gran vacío.

### 1.2 Problemas

**P0 (rompen la experiencia)**
| Id | Problema | Evidencia | Tipo |
|---|---|---|---|
| P0-1 | «Continuar» y las tarjetas de asignatura llevan a `/course/…`, con otra identidad (Poppins, carmesí, violeta) | `VorticeInicio.tsx:194-199` | Estructural |
| P0-2 | Desde `/course/…`, «Volver a Intranet» lleva a `/dashboard`, no a Vórtice. El estudiante se sale del sistema | `CoursePlayer.tsx:518-520` | Estructural, toca un flujo (ver 11) |
| P0-3 | No hay navegación persistente: Aula, Mapa, Mi año y Tutor solo tienen «Volver» | `.vx-topbar` | Estructural |
| P0-4 | El Inicio no se entiende en 3 segundos: 8 bloques que compiten y 6 pantallas en teléfono | medición | Estructural |
| P0-5 | El hero ofrece «Aula universal (5 OA)» a todo estudiante, aunque el piloto es solo de Matemática 5.º | `VorticeInicio.tsx:277` | Contenido de navegación |

**P1 (importantes)**
| Id | Problema |
|---|---|
| P1-1 | Verde y salvia en la interfaz, ahora prohibidos: acento de `basica-1-4` (`vortice-editorial.css`), modo calmo (`evaluacion.css:25-28`), `--ve-ok #2F6B55`, `#F5F9F7` (`brujula.css`), `#DFE9E3` (`vortice.css`), icono «Presentación» de `CoursePlayer` y `emerald-*` heredados |
| P1-2 | Contraste: texto atenuado `#87867F` da 3,47:1; arcilla `#C96442` sobre blanco da 3,9:1 |
| P1-3 | 20 textos bajo 12 px en teléfono; rótulos en mayúsculas y monoespaciada de 10 a 11 px |
| P1-4 | Controles bajo 44 px de alto en teléfono (hasta 27 detectados; revisar uno a uno) |
| P1-5 | Jerga interna visible: «Aula Universal del Piloto», «Constelación de aprendizaje · M3», «OA10», «Programa 2026» |
| P1-6 | Aula: tres indicadores del mismo paso (barra, «Paso 3 de 4» y pestañas) |
| P1-7 | Familia: «9 días de estudio en 2026-06» (mes en bruto) |
| P1-8 | Carga y errores inconsistentes: esqueleto en Inicio, texto suelto en Tutor y Mi año; sin salida de reintento |
| P1-9 | Casi sin `aria-live` (0 en Inicio, Aula, Mapa, Brújula, Familia, Mi año) y sin enlace «Saltar al contenido» |
| P1-10 | Mapa: etiquetas de la constelación de unos 6 px en teléfono; cuatro contadores antes del mapa |
| P1-11 | Selector de OA del Aula con títulos cortados en escritorio |

**P2 (refinamiento)**
Numeral decorativo gigante y regla lateral en la evaluación; miniaturas `lenguaje` y `filosofia` ambiguas; Together sin tokens; microcopy repetido en estados vacíos del portafolio.

### 1.3 Conservar, rediseñar, retirar, unificar
- **Conservar:** Newsreader + DM Sans; base marina; modo calmo (sin cronómetro, sin urgencia); preferencias de lectura; lista accesible del mapa; escenas de hero y miniaturas; texto sin culpa; barras rojas bajo 55 % (decisión del sostenedor del 2026-11-23).
- **Rediseñar:** Inicio, navegación, `/course/:id` (solo estilo), selector de OA, contadores del mapa, estados.
- **Retirar (solo presentación, no funciones):** fila de 3 indicadores del hero, botones secundarios del hero, tarjeta «Mi próximo paso» duplicada, anillo y lista de 4 métricas, rótulos en mayúsculas sobre títulos, iconos junto a cada título de tarjeta, sombras de tarjeta.
- **Unificar:** botones, superficies, etiquetas de estado, barras de avance, cabeceras de página, estados vacío/carga/error.

## 2. Dirección de diseño

**Idea:** cuaderno de noche sobre papel claro. Todo es Winter White y silencio; una sola pieza azul noche dice qué hacer ahora. Esa pieza es el único elemento llamativo del producto.

### 2.1 Color (reemplaza los valores en `vortice-editorial.css`)
```css
--vx-bg: #F6F5F1;          /* Winter White */
--vx-card: #FFFFFF;
--vx-surface: #EFEEEA;     /* fondos hundidos, pistas de barra */
--vx-line: #E3E2DD;        /* separadores */
--vx-line-strong: #868CA6; /* borde de controles, 3:1 */
--vx-ink: #0E1A3A;         /* azul noche, 15,7:1 */
--vx-ink-soft: #4A5270;    /* 7,0:1 */
--vx-muted: #5F6784;       /* 5,1:1, mínimo para texto */
--vx-night: #0E1A3A;

--vx-primary: #2447E5;       /* azul eléctrico: acción y foco */
--vx-primary-hover: #1A35B8;
--vx-primary-soft: #E8EDFD;

--vx-turquesa: #12B5CB;  --vx-turquesa-text: #0B6E86;  --vx-turquesa-soft: #E2F5F8;
--vx-violeta:  #6A3FD0;  --vx-violeta-soft: #EFE9FB;
--vx-naranja:  #F2801E;  --vx-naranja-text: #A8480A;   --vx-naranja-soft: #FDEEDF;
--vx-rojo:     #B3261E;  --vx-rojo-soft: #FBE9E7;
--vx-dorado:   #E8B31E;  --vx-dorado-text: #7A5A00;    --vx-dorado-soft: #FBF1D3;
```
| Color | Significa | Nunca |
|---|---|---|
| Eléctrico | Se puede tocar | Decoración |
| Turquesa | Hecho, correcto, completado | Acción |
| Violeta | En práctica, aprendiendo | Error |
| Dorado | Estrella confirmada (dominio) | Botones |
| Naranja | Pendiente que conviene mirar (repaso, evaluación próxima) | Fallo |
| Rojo | Error del sistema, y alerta de avance bajo (decisión vigente) | Respuesta incorrecta en práctica |

`--vx-turquesa`, `--vx-naranja` y `--vx-dorado` puros no llegan a 4,5:1: solo rellenos e iconos; texto con la variante `-text`. El estado siempre lleva palabra, no solo color. Respuesta incorrecta en práctica: violeta con «Sigue practicando».

Alias para no romper CSS: `--vx-clay → --vx-naranja`, `--vx-clay-text → --vx-naranja-text`, `--vx-amber → --vx-dorado`, `--vx-red → --vx-rojo`, `--vx-green → --vx-primary`.

Acento por tramo (solo fondo suave del bloque secundario y miniaturas):
- `basica-1-4`: `#E2F5F8` (reemplaza la salvia).
- `basica-5-8`: `#E8EDFD`.
- `media`: `#EFE9FB`.
Aplicar `data-tramo` en el shell, no solo en Inicio.

Modo calmo (`.ve[data-calmo="1"]`): `--ve-bg: #EEEDF4; --ve-paper: #F9F8FC; --ve-line: #DBD9E6; --ve-orange: #6E6A92; --ve-red: #5F5B82; --ve-ok: #4A6A86;` texto `#1D2547` (12,8:1). Mantiene sin cronómetro y sin urgencia.

### 2.2 Tipografía
- Display: Newsreader 500. Solo saludo, título de página y título de «Tu siguiente paso».
- Interfaz y cuerpo: DM Sans 400, 500, 600.
- JetBrains Mono: solo cifras de cronómetro. Quitar de rótulos.
- Sin mayúsculas sostenidas. Sin rótulo encima de títulos (`.vx-kicker` pasa a texto 13 px, caja normal, `--vx-muted`, y se elimina donde repita el título).

| Token | px / interlínea | Uso |
|---|---|---|
| `--t-display` | 34/40 (28/34 en teléfono) | Saludo, título de página |
| `--t-title` | 26/32 | Título del siguiente paso |
| `--t-section` | 20/28 Newsreader | Título de bloque |
| `--t-body` | 16/26 | Lectura |
| `--t-ui` | 15/22 | Controles y filas |
| `--t-meta` | 13/18 | Metadatos (mínimo del producto) |

Lectura con `max-width: 66ch`.

### 2.3 Espacio, forma, profundidad, iconos
- Espacio: 4, 8, 12, 16, 24, 32, 48, 64.
- Radios: 8 (controles), 14 (superficies), 999 (solo etiquetas de estado). Botones con radio 10.
- Sombras: ninguna en superficies. Una sola, `0 12px 32px -12px rgb(14 26 58 / .25)`, para capas flotantes (menú, panel).
- Superficie = fondo blanco sobre Winter White, sin borde y sin sombra. Dentro, filas separadas por línea de 1 px, no tarjetas anidadas.
- Iconos: lucide, 20 px, trazo 1,75. Solo en navegación, estados y botones donde ayuden. No en títulos de bloque.
- Imágenes: escena del tramo y miniaturas son las únicas ilustraciones. El hero tiene plantas verdes pintadas: es contenido ilustrado, no color de interfaz (ver 11).

### 2.4 Movimiento
Solo respuesta a acciones: 150 ms en hover y foco; 200 ms al desplegar. Una sola entrada orquestada: el bloque noche al cargar (opacidad 0 a 1, 240 ms). Quitar `translateX` de opciones de evaluación y animaciones de crecimiento de barras. Respetar `prefers-reduced-motion`.

## 3. Arquitectura visual

### 3.1 Shell único (`VorticeShell`)
```
>= 1024 px                                  < 1024 px
+----------+------------------------+       +----------------------------+
| Barkley  |  contenido máx 1040    |       | título          [Aa] [yo]  |
| Inicio   |                        |       |----------------------------|
| Aula     |                        |       | contenido                  |
| Saber    |                        |       |                            |
| Semana   |                        |       |----------------------------|
| Mi año   |                        |       |Inicio Aula Saber Semana Más|
| Portafol.|                        |       +----------------------------+
| Apoyo    |                        |
| yo/Salir |                        |
+----------+------------------------+
```
- Barra lateral 232 px, fondo `--vx-bg`, línea derecha; ítem activo con fondo `--vx-primary-soft` y texto eléctrico. Sin títulos de grupo.
- Rótulos: «Inicio», «Aula», «Lo que sé», «Mi semana», «Mi año», «Portafolio», «Apoyo».
- Teléfono: barra inferior fija de 5 (Inicio, Aula, Lo que sé, Semana, Más). «Más» abre hoja con Mi año, Portafolio, Apoyo, Salir. Alto de ítem 56 px.
- Botón «Aa» abre `PreferenciasLectura` desde cualquier pantalla.
- Primer elemento: enlace «Saltar al contenido».
- Evaluación **no** usa el shell (concentración): solo cabecera con «Inicio», título y estado.
- Familia usa el shell con sus 3 ítems. Tutor usa el shell con 1 ítem y «Salir».
- La raíz del shell conserva las clases `.vx` o `.vx-editorial`: `lectura.css` depende de ellas. No anidar dos raíces (duplicaría el zoom).

### 3.2 Rutas nuevas (solo reubican lo que ya existe)
| Ruta | Contiene | Sale de |
|---|---|---|
| `/vortice/semana` | `BrujulaPanel` completo y calendario semanal con metas | Inicio |
| `/vortice/portafolio` | Pestañas Producciones y Evaluaciones | Inicio |
| `/vortice/apoyo` | Tutor virtual, `AyudaTutor`, Together | Inicio |

Mismas consultas, mismas claves de React Query, mismas mutaciones. Mover, no reescribir.

## 4. Inicio: cuatro bloques

```
+---------------------------------------------------------------+
| Hola, Mateo                                   (Newsreader)    |
| +-----------------------------------------------------------+ |
| | 1. Tu siguiente paso            (azul noche)   [escena]   | |
| |    Ciencias Naturales                                     | |
| |    Lectura 1                                              | |
| |    [ Continuar ]                                          | |
| +-----------------------------------------------------------+ |
| 2. Lo que estoy aprendiendo        | 3. Lo que sé            |
|  [mini] Matemática   ----   38 %   |  1 confirmada (dorado)  |
|  [mini] Lenguaje     --     13 %   |  1 en práctica (violeta)|
|  [mini] Historia     --     17 %   |  2 repasos (naranja)    |
|  [mini] Ciencias            0 %    |  Ver mi mapa            |
|-----------------------------------------------------------   |
| 4. Cómo voy: 3 de 5 bloques de la semana · 18 % del curso     |
|    Próxima evaluación en 3 días: Lenguaje      Ver mi semana  |
+---------------------------------------------------------------+
```
| Bloque | Datos (ya existen) | Reglas |
|---|---|---|
| 1. Tu siguiente paso | `ov.nextStep`, `aEvaluacion`, `linkSiguiente` | Único botón relleno de la pantalla. Fondo noche, texto blanco, botón blanco con texto noche. Texto: «Continuar» o «Rendir mi evaluación». Sin paso: «Ver mis asignaturas». Escena del tramo al 40 % derecho solo desde 1024 px. Sin KPIs |
| 2. Lo que estoy aprendiendo | `ov.subjects`, `linkAsignatura`, `miniaturaAsignatura`, `claseAvance` | Filas de 64 px (miniatura 48 px, nombre, barra, porcentaje). Fila completa clicable. Mantener la lógica de color de `claseAvance` |
| 3. Lo que sé | `mapa.data.resumen`, `retencion.pendientesCount`, `repaso` | Máximo 3 líneas y un enlace. Si el mapa no está disponible: solo repasos |
| 4. Cómo voy | `bloques`, `metas`, `ov.totals.percent`, evaluación próxima de `panel` | Dos líneas y un enlace a `/vortice/semana`. Sin anillo ni lista de métricas |

- Saludo: Newsreader, `Hola, {nombre}`. Se elimina el subtítulo `SUBTITULO` y «nivel · mes».
- El nivel se muestra bajo el nombre del usuario en la barra.
- Meta medible: a 1440×900 los 4 bloques se ven sin desplazar; a 375 px el botón del bloque 1 queda sobre el pliegue y la página no supera 2,5 pantallas.
- La prioridad de la acción principal la sigue decidiendo `ov.nextStep`. No crear reglas nuevas.
- El enlace al Aula piloto sale del hero y queda en la navegación.

## 5. Componentes

### 5.1 Nuevos (carpeta `client/src/components/vortice/`)
| Componente | Para qué |
|---|---|
| `VorticeShell` | Barra, barra inferior, cabecera, «Saltar al contenido», `data-tramo` |
| `PageHeader` | Título y una acción secundaria opcional |
| `NextStep` | Bloque noche. Props: asignatura, título, texto del botón, href |
| `StatusTag` | `hecho`, `practica`, `confirmada`, `pendiente`, `alerta`, `neutro`: color + palabra |
| `Meter` | Barra de 6 px con etiqueta accesible (envuelve `Progress`) |
| `StateBlock` | `cargando` (esqueleto), `vacio` (texto + acción), `error` (texto + «Reintentar» con `refetch`), `sin-sesion` |

No crear más. `Surface` es una clase CSS (`.vx-surface-block`), no un componente.

### 5.2 Unificaciones
- Botones: `.vx-btn` con `--primary` (relleno eléctrico), `--secondary` (borde `--vx-line-strong`), `--quiet` (solo texto). Alto mínimo 44 px. Migrar `.vx-cta`, `.vx-btn-primary`, `.vx-btn-ghost`, `.vx-pill-nav`, `.ve-btn`.
- Superficies: reemplazar `.vx-card`, `.vx-paper`, `.ve-hoja` y `Card` con la regla de 2.3.
- Hex a mano en `className`: reemplazar por tokens. Tabla: `#141413`→`--vx-ink`, `#5E5D59`→`--vx-ink-soft`, `#87867F`→`--vx-muted`, `#E6E2D8` y `#D5CFC2`→`--vx-line`, `#F3F1EA` y `#EFECE3`→`--vx-surface`, `#FAF9F5`→`--vx-bg`, `#C96442` y `#9A4225`→`--vx-naranja-text`, `#2F5EA8`→`--vx-primary`.
- Foco: `outline: 3px solid var(--vx-primary); outline-offset: 2px` en todo.

### 5.3 Estados (texto exacto)
| Situación | Texto | Acción |
|---|---|---|
| Cargando | esqueleto con la forma del contenido, `aria-busy` | |
| Error de red | «No pudimos cargar esto.» | «Reintentar» |
| Sin sesión | «Inicia sesión para continuar.» | «Iniciar sesión» |
| Sin permiso | «Esta pantalla no está disponible para tu cuenta.» | «Ir a Inicio» |
| Sin asignaturas | «Tus cursos aparecerán aquí cuando queden asignados.» | |
| Portafolio vacío | «Aquí guardarás tus trabajos.» | |
Resultados de acciones con `aria-live="polite"`; errores con `role="alert"`.

## 6. Pantallas

| Pantalla | Cambios |
|---|---|
| Inicio | Sección 4 |
| Aula | Shell. Título: nombre del OA (Newsreader); «Aula piloto · Matemática 5.º» como metadato. Selector de OA: lista vertical a la izquierda desde 1024 px con título completo en 2 líneas; en teléfono, `<select>` nativo o lista desplegable que conserve `role="tablist"`. Un solo indicador de paso (las pestañas con marca de hecho). Quitar la barra «Paso 3 de 4». Aviso «Retomaste donde quedaste» como línea, no como alerta |
| Lo que sé | Shell. Título «Lo que sé». Quitar «· M3». Recomendación como `NextStep` en variante clara (no noche, para no competir). Cuatro contadores en una sola línea de `StatusTag`. En teléfono mostrar la lista accesible primero y el grafo plegado; etiquetas mínimo 13 px. «OA10» pasa a metadato después del nombre |
| Mi semana (nueva) | `BrujulaPanel` sin sombra ni rótulos en mayúsculas; calendario y metas debajo |
| Mi año | Shell. Lista compacta: una fila por módulo, expandir para ver las 4 evaluaciones; el módulo en curso abierto. Usar `<details>` |
| Portafolio (nueva) | Filas, `StatusTag` neutro para visibilidad |
| Apoyo (nueva) | Dos bloques: «Pregúntale a tu tutor» (`AyudaTutor`, primero) y «Tutor virtual». Together como enlace |
| Evaluación | Tokens de 2.1. Quitar numeral gigante y regla lateral. Cronómetro fijo arriba a la derecha (modo normal). Centrar verticalmente la intro. Opciones de 56 px. Sin cambios de lógica |
| Familia | Shell. Mes con `toLocaleDateString` («junio de 2026»). Una superficie por sección, filas |
| Tutor | Shell. En escritorio, dos columnas: casos y «Necesitan atención». `StateBlock` para carga y error |
| `/course/:id` | **Solo estilo**, acotado bajo `.vx-course` en la raíz: tipografías y tokens de Vórtice; quitar carmesí, degradado violeta, verde; cabecera como `PageHeader`; recursos como filas. No tocar consultas ni lógica |
| `/academic-copilot` | Solo color y tipografía bajo `.vx-copilot` |
| Together | No se toca (ver 12) |

## 7. Orden de implementación (un commit por paso, cada uno verificable)
1. Tokens y alias en `vortice-editorial.css`; verdes fuera; modo calmo nuevo.
2. Botones, superficies, `StatusTag`, `Meter`, `StateBlock`.
3. `VorticeShell` y migrar Aula, Mapa, Mi año, Familia, Tutor.
4. Rutas `/vortice/semana`, `/portafolio`, `/apoyo` (mover sin cambiar lógica).
5. Inicio de cuatro bloques.
6. Aula y Lo que sé.
7. Evaluación.
8. `/course/:id` y copiloto (solo estilo).
9. Hex restantes, contraste, tamaños táctiles, revisión final en 375, 768, 1024 y 1440.

## 8. Riesgos de regresión
| Riesgo | Control |
|---|---|
| `script/seguridad-m022.check.ts` (nuevo, sin confirmar) lee `VorticeAula.tsx` como texto | Leerlo antes de tocar el Aula; correr `npm run check:vortice` |
| `lectura.css` usa `.vx`, `.ve`, `.vx-editorial` y `.whitespace-nowrap` | Conservar clases; no anidar raíces; probar 3 tamaños |
| `BrujulaPanel`, portafolio y apoyo dependen de consultas y mutaciones definidas en Inicio | Moverlas a un hook `useBrujula()` sin cambiar claves ni cuerpos |
| Anclas `#asignaturas`, `#semana`, `#brujula`, `#portafolio` pueden estar enlazadas (correos, otras pantallas) | Buscar con `grep`; en Inicio redirigir `#brujula` y `#semana` a `/vortice/semana`, `#portafolio` a `/vortice/portafolio` |
| CSS de Tailwind global (Poppins) en `/course` | Acotar todo bajo `.vx-course` |
| `/course` lo usan también administradores | Probar controles de edición como admin |
| Barra inferior tapa contenido y botones de evaluación | `padding-bottom: calc(72px + env(safe-area-inset-bottom))` |

Prohibido tocar: `server/`, `shared/` (salvo lectura), esquema, API, autenticación, cálculos, y `shared/p0e.ts`, `script/p0e.check.ts`, `script/mutar.ts`, `script/ventanas.check.ts`, `server/calendarUtils.ts`.

## 9. Archivos
Modificar: `client/src/App.tsx`; en `client/src/pages/vortice/`: `VorticeInicio.tsx`, `VorticeAula.tsx`, `VorticeMapa.tsx`, `VorticeEvaluacion.tsx`, `VorticeMiAno.tsx`, `FamiliaVista.tsx`, `TutorBandeja.tsx`, `BrujulaPanel.tsx`, `AyudaTutor.tsx`, `PreferenciasLectura.tsx`, `vortice.css`, `vortice-editorial.css`, `evaluacion.css`, `brujula.css`, `lectura.css`; en `client/src/pages/`: `CoursePlayer.tsx`, `AcademicCopilot.tsx`.
Crear: `client/src/components/vortice/{VorticeShell,PageHeader,NextStep,StatusTag,Meter,StateBlock}.tsx`; `client/src/pages/vortice/{VorticeSemana,VorticePortafolio,VorticeApoyo}.tsx`.

## 10. Criterios de aceptación
1. `npx tsc --noEmit` y `npm run check:vortice` terminan en 0; `git diff --stat` no muestra `server/` ni `shared/`.
2. Ningún color con tono entre 70° y 170° y saturación mayor a 8 % en CSS o TSX de Vórtice, curso y copiloto.
3. Inicio: exactamente 4 bloques y 1 botón relleno. A 1440×900 se ven los 4 sin desplazar. A 375×812 el botón principal está sobre el pliegue y el alto total es menor o igual a 2.030 px.
4. Toda pantalla de Vórtice (salvo Evaluación) muestra la navegación y marca dónde estás.
5. Sin scroll horizontal a 375, 768, 1024 y 1440 px, también con texto «muy grande».
6. Ningún texto bajo 13 px; contraste de texto 4,5:1 o más; bordes de control 3:1.
7. Todo control táctil mide 44 px o más.
8. Navegación completa solo con teclado, foco visible, «Saltar al contenido» funciona.
9. Cada pantalla tiene estados de carga, vacío y error con `StateBlock`, comprobados forzando 401, 403 y 500.
10. Todo lo que hoy se puede hacer se puede seguir haciendo: marcar bloques, guardar ritmo, pedir ayuda, tomar, responder y cerrar casos, cambiar lectura, rendir evaluación, practicar en Aula y Mapa.
11. Capturas antes y después de cada pantalla a 375 y 1440 px.

## 11. Decisiones que necesita el sostenedor
Cada una trae la opción por defecto; si no hay respuesta, aplicar la opción por defecto salvo la 1.
1. **P0-2:** cambiar el enlace «Volver a Intranet» para que un estudiante vuelva a `/vortice` (administradores siguen a `/dashboard`). Cambia un flujo: **requiere un sí**.
2. **Tres rutas nuevas** para sacar Brújula, portafolio y apoyo del Inicio. Por defecto: sí.
3. **Reemplaza decisiones anteriores:** salvia en 1.º a 4.º y en modo calmo pasa a turquesa suave y lavanda gris. Por defecto: sí, por la nueva prohibición del verde.
4. **Rojo en barras bajo 55 %:** se conserva (decisión del 2026-11-23). Ojo: al inicio del año todas las asignaturas se verán en rojo, lo que choca con «nunca sentirse castigado». Por defecto: conservar.
5. **Ilustraciones con plantas verdes** (hero y miniaturas): se conservan como contenido ilustrado. Por defecto: conservar.

## 12. Fuera de alcance (instrucción del sostenedor, 2026-11-26)

**El landing no se toca.** El alcance es solo la interfaz de Vórtice. No modificar `Home.tsx`, `HomeEn.tsx`, `SiteHeader.tsx`, las páginas públicas, `client/public/`, `client/index.html` ni los estilos globales de `client/src/index.css`. Los cambios de tokens y estilos se acotan a las raíces `.vx`, `.ve`, `.vx-editorial`, `.vx-course` y `.vx-copilot`. Tampoco entran `/dashboard` ni Together.

Criterio de aceptación adicional: `git diff --stat` no muestra ninguno de esos archivos y el landing se ve igual antes y después.
