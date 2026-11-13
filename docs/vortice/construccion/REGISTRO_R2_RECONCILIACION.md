# Registro R2: reconciliación de integridad de recursos heredados

**Rama:** `vortice/r2-reconciliacion`, desde `3ba6c03` (R1 aceptado). **Naturaleza:** herramienta CLI de **solo lectura**; sin rutas HTTP, sin reparación, sin migraciones. Pruebas solo en bases locales desechables (libSQL embebido en archivo). Los resultados no se extrapolan a `sqld` ni a Turso.

## Archivos

| Archivo | Estado |
|---|---|
| `server/reconciliacionRecursos.ts` | nuevo: `reconciliar()`, `formatear()`, `codigoSalida()` y el CLI |
| `script/reconciliacion.check.ts` | nuevo: pruebas V-1..V-5, combinada, incompleta, solo lectura y CLI |
| `script/mutar.ts` | modificado (auxiliar de pruebas): grupo `r2` con 34 mutaciones. Misma práctica que en R1 |
| este registro | nuevo |

No se tocó nada de H0, H1, H2, IMP-021, R1, E0 (`2edf702`), migraciones `0001`–`0003`, la especificación, ni `shared/schema.ts`, `routes.ts`, `storage.ts`.

## Uso

```bash
npx tsx server/reconciliacionRecursos.ts --db file:./copia.db [--json]
TEST_DATABASE_URL=file:./copia.db npx tsx server/reconciliacionRecursos.ts
```

| Salida | Significado |
|---|---|
| 0 | ejecución **completa**, sin hallazgos |
| 1 | ejecución **completa**, con hallazgos |
| 2 | ejecución **incompleta o fallida**: alguna consulta no pudo ejecutarse, base inexistente, base no local (`file:`), credenciales presentes, etc. |

Solo acepta `file:` ya existente (nunca crea el archivo), pasa por `assertBaseLocal` (bloquea Vercel, `NODE_ENV=production`, variables de credencial). No usa red.

## Las consultas (condiciones idénticas a `evidencia/reconciliacion_consultas.sql`)

| Código | Detecta | Severidad |
|---|---|---|
| V-1 | recurso vinculado a una versión de dominio de otra asignatura que la de su módulo | alta si la versión es validada, publicada o retirada; media si es borrador o en revisión |
| V-2 | módulo vinculado a una versión de dominio de otra asignatura | ídem |
| V-3 | caso de tutoría con `resource_id` y `learning_objective_id` de módulos distintos (con `resource_id` no nulo) | media |
| V-4 | `resource_type` o `pedagogical_step` fuera de lista; `sort_order` no entero; `is_active` ≠ 0/1 (cuatro sub-consultas) | media |
| V-5 | `reflection_prompts` en un recurso que no es de tipo `reflexion` | baja |

Se ejecutan **ocho sentencias** (V-4 tiene cuatro), cada una por separado. Hallazgo: `codigo`, `consulta`, `severidad`, `recurso`, `modulo`, `asignatura` (del módulo), `referencia` (`dominio/vN` o `caso …`), `asignaturaReferencia`, `detalle`. Orden total y determinista: código, consulta, recurso, módulo, referencia, detalle, comparados por unidades de código (sin locale). La salida no incluye fechas ni nada variable.

## Solo lectura y ejecución incompleta

- Cada sentencia es un `SELECT` (se verifica al cargar el módulo).
- Antes de leer se activa `PRAGMA query_only = 1` en la conexión y se restaura el valor previo al terminar (incluso con error). Si no se puede activar, **no se ejecuta ninguna consulta** y el resultado es incompleto.
- Si una consulta falla: queda `estado: "error"` con el mensaje, la reconciliación es `incompleta`, **no se entregan hallazgos** (ni los de las demás consultas) y el texto dice «INCOMPLETA: NO ES UN RESULTADO VALIDO». Nunca se convierte un error en un resultado vacío.
- La salida de texto neutraliza caracteres de control provenientes de la base.

## Pruebas (`script/reconciliacion.check.ts`)

Dos bases construidas **desde cero** (esquema heredado, `0001`–`0003`, datos sanos): A y B. Un dominio por estado de versión (borrador, en revisión, validada, publicada, retirada), cada uno con módulo y recurso vinculados. En cada prueba y en cada base:
1. escenario sano → cero hallazgos, salida 0 (**cero falsos positivos**);
2. se introduce la inconsistencia por SQL directo;
3. dos ejecuciones → resultados **idénticos** (objeto y texto);
4. huella de **todas** las tablas (y del esquema: triggers, índices) igual **antes y después**;
5. hallazgos **exactamente** los esperados, con severidad;
6. A y B dan el mismo resultado JSON.

| Prueba | Casos | Resultado |
|---|---|---|
| V-1 | 5 recursos movidos (uno por estado) y 1 solo | media ×2 (borrador, en revisión), alta ×3 (validada, publicada, retirada) |
| V-2 | 5 módulos reasignados | ídem |
| V-3 | caso `tc1` movido; `tc2` con recurso nulo no se reporta; y recurso con tutoría movido de módulo | 1 hallazgo media |
| V-4 | tipo fuera de lista, paso inventado, `sort_order` texto, `is_active` texto, `is_active` = 2 | 5 hallazgos, uno por fila |
| V-5 | recurso de video con preguntas; el recurso de reflexión con preguntas **no** se reporta | 1 hallazgo baja |
| Combinada | las cinco a la vez, filas distintas | exactamente 5 hallazgos, uno de cada código, sin interferencia |
| Incompleta | `tutoring_cases` borrada; `knowledge_item_resources` borrada; cliente que siempre falla | estado `incompleta`, salida 2, sin hallazgos presentados, solo la(s) consulta(s) afectada(s) en error |
| Solo lectura | cliente instrumentado | 8 `SELECT`; `query_only` activo durante la lectura y restaurado (0, o 1 si ya estaba); una escritura inyectada durante la lectura es **rechazada** por el motor |
| CLI | proceso real | 0 sana, 1 con hallazgos (stdout idéntico entre corridas, también `--json`), 2 por: base inexistente (no la crea), URL remota, sin base, credencial presente, base sin tablas; hash del archivo de la base igual antes y después; caracteres de control no llegan a la terminal |

Huellas de tablas (prefijos SHA-256, antes → después): idénticas en las 16 comparaciones (ver salida del check), p. ej. `V-1/A 6d17d09a3205→6d17d09a3205`. Las de A y B difieren entre sí (ids y marcas de tiempo generados) pero los resultados coinciden.

### Ejemplo de ejecución (base desechable con dos filas inconsistentes)

```
RECONCILIACION COMPLETA
consulta V-1: ok, 0 hallazgo(s)
consulta V-2: ok, 0 hallazgo(s)
consulta V-3: ok, 0 hallazgo(s)
consulta V-4/resource_type: ok, 1 hallazgo(s)
consulta V-4/pedagogical_step: ok, 0 hallazgo(s)
consulta V-4/sort_order: ok, 0 hallazgo(s)
consulta V-4/is_active: ok, 0 hallazgo(s)
consulta V-5: ok, 1 hallazgo(s)
hallazgos: 2
V-4 | media | recurso=wr-len | modulo=lo-len | asignatura=- | referencia=- | resource_type=ejecutable
V-5 | baja | recurso=wr-mat | modulo=lo-mat | asignatura=- | referencia=- | tipo video con reflection_prompts
```
Salida del proceso: 1.

## Resultados

| Verificación | Resultado |
|---|---|
| `reconciliacion.check.ts` ×30 (con la corrección de abajo) | salida 0 las 30 |
| Mutaciones `r2` | **34/34 detectadas** (salida 1) |
| `check:vortice` ×2 | salida 0, 40 «ok», salidas idénticas |
| Mutaciones h0 / h1 | 10/10, 22/22 |
| `tsc` / build | 0 / 0 (`api/handler.js` revertido) |
| Migraciones frente a `b67b9fa`; `shared/dominio.ts` frente a `8dfdbf2` | 0 diferencias |

### Fallas halladas durante la construcción (no ocultas)

1. **SIGSEGV intermitente (139)** en la primera tanda de 10 corridas: 1 de 10, con el check imprimiendo «reconciliacion: ok» y cayendo al salir. Es el defecto ya documentado de libSQL (conexiones de `client.transaction()` que `migrar` deja abiertas y que el recolector finaliza tarde). Corrección dentro del alcance, en la propia prueba: forzar los finalizadores tras cada base (mismo mecanismo que `integridad-db.check.ts`). Después, 30/30 con salida 0. No se corrigió libSQL: si reaparece, el check sale con 139 y `check:vortice` falla.
2. `tsc` rechazó un `await` de nivel superior en el CLI (TS1378): se reemplazó por `void principal().then(...)`.
3. Primera versión de la prueba V-4 esperaba un orden distinto del real (el orden es por consulta y no por recurso); se corrigió la expectativa, no el código: el orden documentado es el contractual.
4. Revisión: caracteres de control de la base podían llegar a la terminal → neutralizados (con prueba y mutación).

### Mutante equivalente (no es una prueba omitida)

«V-4 is_active texto permitido» (quitar `typeof(w.is_active) <> 'integer' OR` de la condición) **no cambia ningún resultado**: se comprobó sobre una columna `INTEGER` con 15 valores (`'no'`, `'1'`, `1.5`, `X'31'`, `2`, `-1`, `' 1'`…), con resultados idénticos. La cláusula se mantiene porque la autorización dice «distinto de 0 o 1», y el mutante se retiró del grupo.

## Revisión de código y de seguridad

**Código:** consultas idénticas a las aprobadas, sin reglas nuevas; sin estado compartido; `query_only` se restaura siempre; errores no se convierten en vacío. Los hallazgos de arriba (2, 4 y el SIGSEGV) se corrigieron.
**Seguridad (manual):** solo `SELECT` estáticos, sin SQL construido con entrada (el único parámetro, la URL, nunca entra en SQL); sin red ni credenciales (`assertBaseLocal`, solo `file:`); no crea ni escribe archivos; sin endpoints; salida sin caracteres de control; mensajes de error sin secretos.

## Limitaciones y riesgos residuales

- Detecta, no impide: SQL directo sigue pudiendo crear las inconsistencias (decisión de dirección: sin triggers en tablas heredadas).
- Solo comprueba lo que describen V-1..V-5; no examina `reflection_responses`, `resource_type` frente a las respuestas, ni recursos huérfanos, ni deriva entre dominios y módulos fuera de los vínculos.
- V-3 no se activa si `resource_id` es nulo (por diseño). V-1 y V-2 miran todas las versiones, también retiradas.
- Una base que cambia mientras se lee: las ocho sentencias no comparten una transacción de lectura única (una por conexión de prueba); cada una es consistente por sí sola. Para una foto coherente, ejecutar sobre una copia.
- Verificado solo sobre libSQL embebido en archivo; no sobre `sqld` ni Turso. Nunca se ejecutó contra una base real.
- El SIGSEGV de libSQL sigue siendo un riesgo del entorno de pruebas (1/10 sin la mitigación).
- No se ejecutó la revisión de código con subagentes en paralelo: fue una revisión manual del diff.
