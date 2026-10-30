# 05. Algoritmos y recomendaciones

**Estado:** PROPUESTO. NO EXISTE. Versión 1: **reglas deterministas**, puras y auditables. Parámetros: `mastery_policies`. Pedagógicos: pendientes.

## 1. Entradas

Grafo publicado; evidencias con `released_at <= ahora`; política aprobada; agenda de retención; módulo actual y acceso (P0-E); banco aprobado.

**Regla absoluta:** ninguna función de este documento lee evidencia no liberada. Reciben la evidencia ya filtrada, por `conocimiento.evidenciaLiberada` ([08](08_SEGURIDAD_Y_GOBIERNO.md) §7.2).

**Motor sin efectos en acceso:** ninguna función escribe en P0-E ni es consultada por `checkModuleAccess` o `checkEvaluationAccess`.

## 2. Estado de un contenido

```text
# Entrada ya filtrada: released_at <= ahora. Parámetros nulos en política = no ejecutable.
función evaluar(evidencias, versión_actual, política):
  e = evidencias sin anulación                                   # [T] escenario 7
  e = e con versión compatible con versión_actual, o versión_actual  # [P] escenario 9
  si e vacío: retorna sin_evidencia

  válidas = e sin ayuda, si política.assisted_counts = falso    # [P] escenarios 5, 6

  # Orden por (occurred_at, id)
  correctas(t) = familias con acierto en válidas hasta t
  dominio_en   = primer t con |correctas(t)| >= política.k6_min_families   # [K6]
                 # política.same_session_allowed = falso: exige sesiones distintas (O2)

  errada(f, desde) = f tiene error en válidas después de desde,
                     y sin acierto en f posterior a ese error    # [P] escenario 3

  si dominio_en existe:
    n = |{f : errada(f, dominio_en)}|
    si n >= política.demote_wrong_families: retorna incierto, contradictoria   # [P] 4, 10
    marca = por_comprobar si n >= 1, o retención vencida, o ruptura de versión
    retorna dominado, marca

  n = |{f : errada(f, inicio)}|
  si política.not_mastered_wrong_families != nulo y n >= ese valor: retorna no_dominado  # O1
  retorna incierto, motivo(e, válidas)
```

Cada escenario de [03](03_MOTOR_DE_EVIDENCIAS.md) §9 es una prueba obligatoria de esta función.

Función pura. Se recalcula por respuesta nueva, anulación o liberación, y se inserta un evento **solo si cambió**. La liberación no depende de una tarea programada: [08](08_SEGURIDAD_Y_GOBIERNO.md) §7.3.

## 3. Fronteras

```text
K = contenidos dominados
disponible(c) = todos los prereq necesarios de c están en K
                y (etapa 2) cada alt_group de c tiene alguno en K

externa = { c ∉ K : disponible(c) }
interna = { c ∈ K : ningún sucesor necesario de c ∈ K
                    y (dominado hace < ventana o sin retención comprobada) }
bloqueado = { c ∉ K : no disponible(c) }, con faltantes = prereq necesarios fuera de K
```

**Estados no factibles.** Puede haber C dominado sin su prerrequisito A. Etapa 1: no se infiere A; se marca `inconsistencia` para revisión pedagógica. Si son muchos, indica mala arista. Inferencia automática: etapa posterior.

**Estado inicial (N11).** Sin diagnóstico, todo parte `sin_evidencia`; las raíces son la frontera externa. Una prueba inicial fija de contenidos es opcional; diagnóstico con selección dinámica: NO EXISTE, etapa posterior.

## 4. Siguiente paso

Orden lexicográfico. El orden es una propuesta y necesita validación docente.

```text
función siguiente(estudiante, ahora):
  1 retención vencida de la frontera interna (máx. política.max_retention)
  2 contenidos a reforzar del módulo, si están disponibles (publicados por regla)
  3 frontera externa en el módulo actual, por orden topológico, luego sort_order
  4 no_dominado o incierto con base disponible de módulos previos
  5 retención vencida restante
  si banco sin familia nueva para c: omite c y registra banco_insuficiente
  guarda recommendation_log con motivo
```

Regla de desempate: `code` ascendente, para que dos ejecuciones iguales den el mismo resultado.

**Elegir pregunta:** familia aprobada del banco de práctica de `c`, sin acierto previo; si no hay, la menos reciente de otra variante. No cuenta como nueva para K6.

**Calendario (C10).** La recomendación orienta dentro del módulo; **no** abre ni cierra módulos, ni evaluaciones. Eso lo decide `checkModuleAccess`/P0-E.

**Explicación guardada:** «Se ofrece C porque A y B, sus prerrequisitos, están dominados», guardada en `reason_json`. Evidencias de E2 no liberadas nunca se citan.

## 5. Ejemplo (HIPOTÉTICO, continúa [02](02_MODELO_DE_CONOCIMIENTO.md) §7)

K = {A, B}; A con retención errada. Paso 1: ofrece A (familia nueva). Paso 3: ofrece C. D y E no aparecen. Cuando C llegue a 2 familias correctas: externa = {D}; interna = {C}.

## 6. Reglas frente a modelos

| Función | Versión 1 reglas | Después, con datos y validación |
|---|---|---|
| Estado | K6 + política | Estimación probabilística por contenido (por ejemplo, modelos bayesianos), con azar y descuido |
| Prerrequisitos | Humanos | Sugerencias estadísticas, siempre con revisión |
| Selección de preguntas | Orden fijo | Valor informativo con selección dinámica |
| Retención | Intervalos fijos | Intervalos estimados |
| Calibración | No hay | Dificultad y discriminación, validadas fuera de muestra |

No se describirá como inteligencia artificial o adaptativo nada de esto hasta implementarlo y validarlo (K3). Requisito mínimo para pasar de columna: lo fija la dirección (N10).

## 7. Pruebas del motor

Funciones puras en `shared/`, con el patrón `script/*.check.ts`, solo memoria:
- Los 10 escenarios de [03](03_MOTOR_DE_EVIDENCIAS.md) §9, con cada alternativa de política.
- Ciclos y grafos inválidos rechazados al publicar.
- Fronteras sobre grafos conocidos, incluida coincidencia con enumeración de estados factibles.
- Determinismo: misma entrada, misma salida.
- **No interferencia** de evidencia embargada.
- Reconstrucción: rehacer proyección desde eventos da el mismo estado.
- Cambio de política: nuevos eventos, nada reescrito.
