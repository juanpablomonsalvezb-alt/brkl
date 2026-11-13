# Pruebas adversariales de recursos heredados

**Método.** Servidor real (`registerRoutes`, el mismo montaje que `script/acceso.check.ts`) sobre una base **SQLite en archivo temporal desechable** con el esquema heredado y las migraciones `0001`–`0003`. Cada caso toma una huella de **todas las tablas** antes y después: «cambios persistidos» lista las tablas cuya huella cambió (no basta con que la ruta devuelva un error). Estado inicial común: dos asignaturas (`ls-mat-5b`, `ls-len-6b`), módulos `lo-mat`, `lo-mat2`, `lo-len`; recursos `wr-mat` (vinculado a una versión **publicada** de H2), `wr-free` (con progreso de estudiante), `wr-free2` y `wr-sync` (sin dependientes); un administrador y un estudiante; un dominio con una versión publicada que vincula `wr-mat` y `lo-mat`. Entre casos se restaura la fila con SQL de preparación. Sin red: se borraron `REPL_IDENTITY`, `WEB_REPL_RENEWAL` y `REPLIT_CONNECTORS_HOSTNAME`, y la lectura de Drive falla localmente antes de cualquier conexión (comprobado en el seguimiento de pila).

**Evidencia:** `evidencia/bateria_adversarial.ts.txt` (script), `evidencia/resultados_bateria.json` (resultado por caso con fila antes y después). Código de salida de la batería: 0 (no es una prueba con aserciones: registra el comportamiento).

## Resultados (36 casos)

| ID | Caso | Entrada | Estado HTTP / resultado | Tablas con cambios persistidos | Fila del recurso | Valoración |
|---|---|---|---|---|---|---|
| A01 | Mover un recurso VINCULADO a un módulo de otra asignatura | `PATCH wr-mat {learningObjectiveId:'lo-len'}` | 200 | weekly_resources | cambió | VULNERABLE: se mueve a otra asignatura; deja la versión publicada incoherente (ver F01) |
| A02 | Mover un recurso NO vinculado a un módulo de otra asignatura | `PATCH wr-free {learningObjectiveId:'lo-len'}` | 200 | weekly_resources | cambió | VULNERABLE: cruce de asignatura sin vínculos aún |
| A03 | Mover un recurso a otro módulo de la MISMA asignatura | `PATCH wr-free {learningObjectiveId:'lo-mat2'}` | 200 | weekly_resources | cambió | Aceptable si la regla permite mover entre módulos de la misma asignatura (decisión pendiente) |
| A04 | Mover a un objetivo inexistente | `PATCH wr-free {learningObjectiveId:'no-existe'}` | 500 | ninguna | igual | Protegido por clave foránea (error 500, sin cambios); mensaje no informativo |
| A05 | Cambiar el id de un recurso con progreso de estudiantes | `PATCH wr-free {id:'otro-id'}` | 500 | ninguna | igual | Protegido por clave foránea (hay progreso del estudiante); 500 sin mensaje |
| A06 | Cambiar el id de un recurso vinculado a una versión publicada | `PATCH wr-mat {id:'otro-id'}` | 500 | ninguna | igual | Protegido por clave foránea (vínculo publicado); 500 |
| A07 | Cambiar campos de auditoría (createdAt, updatedAt) como texto | `PATCH wr-free {createdAt:'2000-01-01', updatedAt:'2000-01-01'}` | 500 | ninguna | igual | Protegido de hecho: drizzle rechaza el texto en columnas de fecha; 500, sin cambios |
| A08 | Cambiar createdAt con un número | `PATCH wr-free {createdAt: 946684800}` | 500 | ninguna | igual | Protegido de hecho: drizzle rechaza el número; 500 |
| A09 | Campo desconocido junto con uno válido | `PATCH wr-free {campoDesconocido:'x', title:'Titulo B'}` | 200 | weekly_resources | cambió | Campo desconocido ignorado; el válido se aplica |
| A10 | Nulo en una columna obligatoria (title) | `PATCH wr-free {title:null}` | 500 | ninguna | igual | Protegido por NOT NULL; 500 |
| A11 | Nulo en learningObjectiveId | `PATCH wr-free {learningObjectiveId:null}` | 500 | ninguna | igual | Protegido por NOT NULL; 500 |
| A12 | Tipo de recurso fuera de la lista | `PATCH wr-free {resourceType:'ejecutable'}` | 200 | weekly_resources | cambió | VULNERABLE: valor fuera de la lista cerrada se guarda |
| A13 | Paso pedagógico fuera de la lista | `PATCH wr-free {pedagogicalStep:'inventado'}` | 200 | weekly_resources | cambió | VULNERABLE: valor fuera de la lista cerrada se guarda |
| A14 | Objeto donde se espera texto (title) | `PATCH wr-free {title:{a:1}}` | 500 | ninguna | igual | Protegido de hecho (error de tipo en el driver); 500 |
| A15 | Arreglo donde se espera texto (title) | `PATCH wr-free {title:['x','y']}` | 500 | ninguna | igual | Protegido de hecho; 500 |
| A16 | Texto donde se espera número (sortOrder) y booleano (isActive) | `PATCH wr-free {sortOrder:'abc', isActive:'no'}` | 200 | weekly_resources | cambió | VULNERABLE: texto guardado en columnas numéricas/booleanas |
| A17 | Valor válido y prohibido a la vez | `PATCH wr-free {title:'Valido', learningObjectiveId:'lo-len'}` | 200 | weekly_resources | cambió | VULNERABLE: el campo permitido y el prohibido se aplican juntos |
| A18 | Recurso inexistente | `PATCH no-existe {title:'x'}` | 404 | ninguna | — | Correcto: 404 |
| A19 | Cuerpo vacío | `PATCH wr-free {}` | 200 | ninguna | igual | Aceptado: solo actualiza updatedAt |
| A20 | Sin sesión y con un estudiante | `PATCH wr-free sin sesión / como estudiante` | 401/403 | ninguna | igual | Correcto: 401 sin sesión, 403 estudiante |
| A21 | Dos movimientos simultáneos del mismo recurso | `PATCH wr-free {lo-len} y {lo-mat2} a la vez` | 200/200 | weekly_resources | cambió | Carrera: gana el último; ambos 200; resultado depende del orden |
| A22 | Error en el servidor tras un cuerpo válido a medias (título nulo y movimiento) | `PATCH wr-free {learningObjectiveId:'lo-len', title:null}` | 500 | ninguna | igual | Protegido: el error revierte la sentencia entera (sin modificación parcial) |
| B01 | Crear recurso con objetivo inexistente | `POST /api/admin/resources {learningObjectiveId:'no-existe',...}` | 500 | ninguna | — | Protegido por clave foránea; 500 |
| B02 | Crear recurso con campos extra (id propio, sortOrder) | `POST /api/admin/resources {id:'impuesto',...}` | 200 | weekly_resources | — | Correcto: el id propio se descarta y los campos extra se ignoran |
| C01 | Sincronización con Drive de un módulo SIN recursos vinculados (borra y luego falla al leer Drive) | `POST /api/admin/drive/sync {folderId, learningObjectiveId:'lo-mat2'}` | 500 | weekly_resources | — | VULNERABLE: borra los recursos del módulo y después falla al leer Drive: pérdida de datos (modificación parcial) |
| C02 | Sincronización con Drive de un módulo con un recurso vinculado a una versión publicada | `POST /api/admin/drive/sync {learningObjectiveId:'lo-mat'}` | 500 | ninguna | — | Protegido: la clave foránea impide borrar recursos vinculados; la sincronización falla entera |
| C03 | Sincronización sobre un objetivo inexistente | `POST /api/admin/drive/sync {learningObjectiveId:'no-existe'}` | 500 | ninguna | — | Sin efecto: 500 por Drive; no había recursos que borrar |
| G01 | Rutas con comentario «temporary public»: sin sesión y como estudiante | `POST /api/admin/seed, POST /api/admin/level-subjects/ls-len-6b/create-modules` | 401/403/401/403/401/403 | ninguna | — | Correcto: 401 sin sesión y 403 estudiante en las tres rutas |
| D01 | Página del libro con campos extra de identidad | `PUT /api/admin/learning-objectives/lo-mat/pages {levelSubjectId:'ls-len-6b', textbookStartPage:3}` | 200 | learning_objectives | — | Correcto: la ruta solo aplica las columnas de páginas; el campo de identidad se ignora |
| D02 | Paso pedagógico con campo de relación en el cuerpo | `PATCH /api/admin/resources/wr-free/pedagogical-step {pedagogicalStep:'x', learningObjectiveId:'lo-len'}` | 400 | ninguna | igual | Correcto: la ruta hermana valida con esquema (400) |
| E01 | SQL directo: cambiar la asignatura de un módulo vinculado | `UPDATE learning_objectives SET level_subject_id='ls-len-6b' WHERE id='lo-mat'` | SQL | learning_objectives | — | VULNERABLE (SQL directo): cambia la asignatura de un módulo vinculado |
| E02 | SQL directo: INSERT OR REPLACE de un recurso vinculado | `INSERT OR REPLACE INTO weekly_resources ... id='wr-mat' otro módulo` | SQL | ninguna | — | Protegido por clave foránea (recurso vinculado) |
| E03 | SQL directo: INSERT OR REPLACE de un recurso no vinculado | `INSERT OR REPLACE INTO weekly_resources ... id='wr-free2' otro módulo` | SQL | weekly_resources | cambió | VULNERABLE (SQL directo): REPLACE cambia el módulo de un recurso sin vínculos |
| E04 | SQL directo: borrar un módulo con recursos vinculados | `DELETE FROM learning_objectives WHERE id='lo-mat'` | SQL | ninguna | — | Protegido por clave foránea |
| F01 | Consecuencia de A01: crear la versión 2 del dominio | `crearVersionDominio(d)` | falla | ninguna | — | CONSECUENCIA de A01: crear la versión 2 del dominio falla |
| R01 | Reconciliación (solo lectura) sobre el estado final | `consulta de vínculos incoherentes` | consulta | ninguna | — | Detecta 1 vínculo incoherente tras A01 |

## Resumen

| Concepto | Número |
|---|---|
| Casos ejecutados | 36 |
| Vulnerabilidades reproducidas (distintas) | **6**: V1 mover recurso vinculado entre asignaturas (A01, A17), V2 mover recurso sin vínculos (A02), V3 datos sin validar (A12, A13, A16), V4 borrado no atómico en `drive/sync` (C01), V5 `UPDATE` directo de la asignatura de un módulo (E01), V6 `REPLACE` de un recurso sin vínculos (E03) |
| Consecuencia comprobada | F01: crear la versión 2 del dominio falla tras A01 |
| Inconsistencias históricas detectadas por la consulta de reconciliación en la base de prueba | **1** (R01), producida por A01; en la base inicial, 0 |
| Casos protegidos por la base (claves foráneas, NOT NULL, driver) | A04, A05, A06, A07, A08, A10, A11, A14, A15, B01, C02, E02, E04 |
| Casos protegidos por la aplicación | A18, A20, B02, D01, D02, G01 |

## Corrección sobre V-2

La auditoría decía que la consulta de reconciliación para V-2 estaba «probada con la misma consulta». **No era cierto:** el caso R01 ejercitó solo la rama de recursos (V-1). V-2, V-3, V-4 y V-5 se prueban de forma independiente en `CIERRE_DECISIONES_RECURSOS.md` §4.

## Observaciones

- **Modificación parcial.** Los errores de una sola sentencia no dejan nada a medias (A22: título nulo más movimiento → sin cambios). **Sí hay modificación parcial entre sentencias en `drive/sync` (C01)**: borra, luego falla.
- **Carrera (A21).** Dos movimientos simultáneos devuelven 200 ambos; gana el último y el resultado depende del orden. No hay control de versión del recurso.
- **A03** (mover a otro módulo de la misma asignatura) es aceptado hoy; si es legítimo es una decisión de dirección (propuesta §4).
- Los errores de base se devuelven como `500 Failed to update resource`, sin motivo: la API no distingue «entrada inválida» de «fallo del servidor».

## Limitaciones

- libSQL embebido en archivo local; no se extrapola a `sqld` ni a Turso.
- Las rutas de lectura, las de `word-upload` y la integración real con Drive no se ejercitaron (no hay credenciales).
- Los efectos sobre `student_progress`, `reflection_responses` y `tutoring_cases` de mover un recurso se **analizaron por lectura**; la batería no los ejecutó. La consulta de reconciliación del §7 de la propuesta se ejecutó solo para los vínculos de H2 (R01).
- No se probó concurrencia más allá de A21 ni volumen.
- El estado inicial es sintético; no se auditó ninguna base real.
