# 10. Matriz de decisiones pendientes

**Nada aquí está decidido.** «Recomendación» es técnica, no aprobación. Detalle: `docs/p0e/CONTRADICCIONES_Y_PREGUNTAS.md`. Dirección reserva lo pedagógico.

**Bloquea:** **Diseño** = cambia el esquema o la arquitectura. **Prog.** = programar la función. **Piloto** = iniciar con estudiantes. Entre paréntesis, la etapa de construcción (M1–M8) de [09](09_PLAN_DE_IMPLEMENTACION.md).

## 1. Qué se necesita primero

| Para | Falta |
|---|---|
| Comprobar soporte técnico (M0) | Autorizar base desechable |
| Catálogo y banco (M1) | O4, O5, N9 y ficha del piloto |
| Política de dominio (M2) | O1, O2, O3, N1, N2, N16, N17, N18 |
| Mapa (M3) | O6, N3 si aplica, N11 |
| Núcleo P0-E | P7, P8, P16, P17, P20-v, C16 |
| E2 con evidencia (M5) | N2, C6, C7, N4, C20, C21 |
| Resultados y P21 (M6) | D1–D4, C14, C15, N14 |
| Estudiantes reales (M7) | O10, C19, C22, C12, autenticación, revisión legal |

**Ninguna decisión exige rehacer el esquema**, salvo preguntas multi-contenido o una respuesta que cambie N2 o D2 de forma no prevista. Esto es una evaluación por lectura; las pruebas D1–D8 pueden cambiarlo.

## 2. Contradicciones

| ID | Qué resolver | Alternativas | Recomendación | Consecuencia técnica | Decide | Bloquea |
|---|---|---|---|---|---|---|
| C1 | ¿% real o solo estado? | A: al cumplirse la condición de publicación. B: nunca. C: siempre | A | Qué serializa la API | Dirección (D1) | Prog. (M6) |
| C2 | ¿Banda antes de la condición de publicación? | Igual que C1 | A | Igual | Dirección (D1) | Prog. (M6) |
| C3 | ¿P21 reemplaza no desbloquear? | A: reemplaza. B: liberación manual. C: mantiene | Sin recomendación académica; técnicamente viables A y B | Cambia `checkModuleAccess` | Dirección (D2) | Prog. (M6) |
| C4 | ¿Repaso por contenido antes de la condición de publicación? | A: después. B: antes, con riesgo | A | Filtro de publicación | Dirección (D1) | Prog. (M5) |
| C5 | ¿Familia y tutor ven %? | A: estado. B: % tras la condición de publicación. C: distinto por rol | A hasta decidir | DTO por rol | Dirección (D4) | Prog. (M6) |
| C6 | Feedback inmediato frente a regla aprobada | A: banco separado. B: E1, E3, E4. C: al cerrar la instancia | A | `release_policy` | Dirección; B y C enmiendan maestra | Prog. (M5) |
| C7 | Mapa delata E2 | Embargo; sin E2; inmediato (inviable) | Embargo | Condición de publicación, filtro único | Dirección (N2) | Prog. (M5) |
| C8 | K6 frente a <70 % por contenido | A: del estado. B: % por contenido. C: ambos | A | Fuente de «a reforzar» | Dirección | Prog. (M6) |
| C9 | Módulo abierto con contenidos sin base | A: abierto con aviso. B: bloquea dentro. C: ruta previa | A | Estado `requiere base` | Dirección (N3) | Prog. (M6) |
| C10 | Frontera individual frente a calendario | A: orienta. B: calendario flexible | A | Recomendación sin acceso | Dirección | Sin bloqueo inicial |
| C11 | Repaso usa preguntas evaluativas | A: banco separado. B: mantener | A; fuera del piloto | Retirar `review_items` luego | Dirección | Prog. (M1) |
| C12 | Textos públicos prometen funciones | A: corregir ahora. B: al lanzar | A | Ninguna en motor | Dirección (N7) | Piloto |
| C13 | Cómo nombrar el copiloto | A: «copiloto, sin validar». B: tutor | A | Sin cambio ahora | Dirección | Sin bloqueo |
| C14 | Mostrar pendientes antes de continuar | A: esperar la condición de publicación. B: lista sin detalle. C: adelantar | A | Cuándo habilitar continuar | Dirección (D1, D2) | Prog. (M6) |
| C15 | Revisión normativa de P21 | A: primero. B: después | A | Puede invalidar P21 | Dirección y asesoría | Prog. (M6), Piloto |
| C16 | 70 frente a 60 | A: 70 a todas. B: solo E2 | Sin recomendación académica | Constante y generador | Dirección (D3, Q1) | Prog. (P0) |
| C17 | P17 incoherente en maestra | Ratificar 2 | Ratificar | `max_attempts` | Dirección | Prog. (P0) |
| C18 | Matices en P7 | Unificar textos | Unificar | Regla de migración | Dirección | Prog. (P0) |

### Nuevas en revisiones anteriores y en esta

| ID | Qué resolver | Alternativas | Recomendación | Consecuencia técnica | Decide | Bloquea |
|---|---|---|---|---|---|---|
| **C19** | Copiloto fuera del motor, pero accesible: ayuda sin registro ni supervisión | [07](07_COPILOTO_IA.md) §7: A oculto y deshabilitado. B con controles. C sin controles | A para primera exposición | A requiere programar, autorizado aparte | Sostenedor | **Etapa 3** |
| **C20** | «Todas las respuestas idénticas» choca con el estado inmediato APROBADO | A: pruebas NI1 y NI2. B: ocultar también el estado (enmienda maestra) | A | Protocolo de [08](08_SEGURIDAD_Y_GOBIERNO.md) §7 | Dirección | Prog. (M5) |
| **C21** | Al aprobar, una evaluación sale de `openEvaluationsForStudent`: el copiloto deja de bloquearla aunque otros la estén rindiendo | A: bloquear hasta liberar la versión. B: mantener | A | Cambio futuro de código, con P0-E | Dirección | Prog. (P0) |
| **C22** | Riesgo detectado sin aviso a nadie, ya con enlace en Vórtice | A: protocolo y responsables. B: mantener | A | Puede requerir registro y avisos | Dirección y asesoría | Piloto; independiente del motor |

| **C23** | Maestra P4 define `review_at` = T+49 h, pero P19 exige versión cerrada: la fecha puede no ser la real | A: comunicar «cuando cierre para todos». B: enmendar | A | Sin fecha prometida en UI | Sostenedor | Prog. (M6) |
| **C24** | «D1–D4» (decisiones) y «D1–D9» (pruebas) comparten sigla. «E2» etapa se renombró a M2; pruebas de no interferencia, a NI1–NI6, para no chocar con P1–P6 de la maestra | A: citar siempre «decisión» o «prueba» | A | Ninguna | Técnica | Sin bloqueo |

## 3. Decisiones D

| ID | Qué resolver | Alternativas | Recomendación | Consecuencia técnica | Decide | Bloquea |
|---|---|---|---|---|---|---|
| D1 | Qué se ve y cuándo | Ver C1 | Estado; % al cumplirse la condición de publicación | DTO | Dirección | Prog. (M6) |
| D2 | P21 reemplaza regla | Ver C3 | Decidir solo tras C15 | Regla de acceso | Dirección | Prog. (M6) |
| D3 | Bandas 70/80 | Ratificar; ajustar | Ratificar con Q1–Q3 | Constantes | Dirección | Prog. (P0, M6) |
| D4 | Familia y tutor | Ver C5 | Estado y contenidos, sin % | Permisos | Dirección | Prog. (M6) |

## 4. Preguntas O

| ID | Qué resolver | Alternativas | Recomendación | Consecuencia técnica | Decide | Bloquea |
|---|---|---|---|---|---|---|
| O1 | Qué es «no dominado» | Ver [03](03_MOTOR_DE_EVIDENCIAS.md) §7 | 2 errores en familias distintas | Parámetro | Dirección | Prog. (M2) |
| O2 | ¿Qué separa dos aciertos? | Ninguna; sesión; día; intervalo (03 §9.1) | Día, o ninguna por sencillez. **Abierta** | `k6_separation` | Dirección | Prog. (M2) |
| O3 | ¿Ayuda cuenta? | Ver §6 de 03 | No cuenta para K6 | Parámetro | Dirección | Prog. (M2) |
| O4 | Quién valida | Interno; externo | Dos personas nombradas | Rol revisor | Dirección | Prog. (M1) |
| O5 | Qué unidad | Elegir | Sin recomendación: falta planificación | Catálogo | Dirección | Prog. (M1) |
| O6 | Mostrar incertidumbre | «Sigue practicando»; estado propio; nada | Primera | UI | Dirección | Prog. (M3) |
| O7 | Mapa a familia y tutor | Resumen; completo | Tutor completo; familia resumen | DTO | Dirección | Prog. (M3) |
| O8 | Retención | Intervalos actuales; otros | Actuales, como hipótesis | Agenda | Dirección | Prog. (M4) |
| O9 | Adaptaciones | Registrar y contar; caso a caso | Primera, si no altera el constructo | `accommodation` | Dirección | Piloto |
| O10 | Conservación de datos | Seudonimizar; borrar; conservar | Seudonimizar, con revisión | Choca con solo inserción: **puede tocar diseño** | Dirección y legal | Diseño parcial, Piloto |

## 5. Preguntas N

| ID | Qué resolver | Alternativas | Recomendación | Consecuencia técnica | Decide | Bloquea |
|---|---|---|---|---|---|---|
| N1 | 70 % y K6 | §8.1 de 03 | Independientes | Canales separados | Dirección | Prog. (M2) |
| N2 | Evidencia válida | §8.3 de 03 | Práctica primero; E2 embargada después | `evidence_sources` | Dirección | Prog. (M2, M5) |
| N3 | Módulo sin base | Ver C9 | Abierto con aviso | UI | Dirección | Prog. (M6) |
| N4 | Dónde va el feedback | Ver C6 | Banco separado | `release_policy` | Dirección | Prog. (M5) |
| N5 | Cobertura de preguntas | K6 en práctica; más preguntas; por contenido clave | Práctica | Tamaño del banco | Dirección | Prog. (M1) |
| N6 | Evidencia histórica | No cuenta; pista | No cuenta | Sin migrar | Dirección (P7) | Sin bloqueo inicial |
| N7 | Textos | Ver C12 | Corregir | Ninguna | Dirección | Piloto |
| N8 | Piloto y resto | Conviven; solo con mapa | Conviven | Interruptor por dominio | Dirección | Prog. (M3) |
| N9 | Preguntas distintas | §5 de 03 | Familia por revisor | Ya en esquema | Dirección | Prog. (M1) |
| N10 | Modelos estadísticos | Definir criterios | Después del piloto | Sin efecto | Dirección | Sin bloqueo inicial |
| N11 | Estado inicial | Vacío; prueba fija | Vacío | Primer mapa | Dirección | Prog. (M3) |
| N12 | Pregunta defectuosa y resultado P0-E | Proceso aparte; no | Proceso aparte | Sin alterar intentos | Dirección | Prog. (P0) |
| N13 | Copiloto con evaluación abierta | Por contenido; textual | Por contenido | Futuro | Dirección | Sin bloqueo inicial |
| N14 | Qué intento da el % | El que cerró; mejor; último | El que cerró | Publicación | Dirección | Prog. (M6) |
| N15 | Calendario enero 2027 | Piloto después; M3–M4 antes | Sin verificar capacidad | Alcance | Dirección | Plan |
| N16 | Error con ayuda | No cuenta; cuenta | No cuenta | Parámetro | Dirección | Prog. (M2) |
| N17 | Pregunta retirada | Sigue contando; no | Sigue | Parámetro | Dirección | Prog. (M2) |
| N18 | Nueva versión | Caso a caso; reinicia; nunca | Caso a caso | `evidence_continuity` | Dirección | Prog. (M2) |
| N19 | Corrección docente | Nuevo `source_type`; solo anulación | Solo anulación | Esquema, si cambia | Dirección | Sin bloqueo inicial |
| N20 | Quién o qué determina que una versión ya no puede responderse | Derivada; acto humano; ambas (03 §8.3) | Sin recomendación cerrada | `evaluation_version_releases` | Sostenedor y académica | Prog. (M5, M6) |
| N21 | Estudiante que entra después: ¿qué versión recibe? ¿Mantiene abierta la anterior? | Versión nueva; misma con ventana; esperar | Versión nueva: no retrasa a otros | Asignación de instancias | Sostenedor y académica | Prog. (P0) |



## 7. Estado por punto

**Etapa que bloquea:** Etapa 1 (E0); Etapa 2 (contenidos y catálogo); Construcción (programar M2–M6 y P0, autorización propia); Etapa 3 (estudiantes reales). Las pruebas D bloquean además la Etapa 3 mientras no estén superadas. **Nada aparece aprobado.**

| ID | Estado | Observación | Responsable | Evidencia necesaria | Bloquea | Tipo |
|---|---|---|---|---|---|---|
| C1 | PENDIENTE | % contra regla aprobada | Sostenedor | Ratificación escrita | Construcción | Sostenedor |
| C2 | PENDIENTE | Banda contra regla aprobada | Sostenedor | Ratificación escrita | Construcción | Sostenedor |
| C3 | PENDIENTE | P21 reemplaza regla aprobada | Sostenedor | Ratificación y enmienda | Construcción | Sostenedor, Legal |
| C4 | PENDIENTE | Oráculo por objetivo | Sostenedor | Decisión; prueba NI1 | Construcción | Sostenedor, Técnica |
| C5 | PENDIENTE | % a familia y tutor | Sostenedor | Decisión | Construcción | Sostenedor |
| C6 | PENDIENTE | Feedback frente a regla aprobada; depende de P16 | Sostenedor, académica | Decisión; enmienda si aplica | Construcción | Sostenedor, Académica |
| C7 | PROPUESTO | Embargo diseñado, sin probar | Técnica, sostenedor | N2; NI1–NI5 | Construcción | Sostenedor, Técnica |
| C8 | PENDIENTE | Dos criterios por contenido | Académica | Decisión | Construcción | Académica |
| C9 | PENDIENTE | Módulo abierto, contenido sin base | Académica | Decisión | Construcción | Académica |
| C10 | PENDIENTE | Frontera frente a calendario | Sostenedor | Decisión de modelo | Sin bloqueo inicial | Sostenedor |
| C11 | EXISTE EN CÓDIGO | Repaso con preguntas evaluativas | Técnica | Fuera del piloto; retiro autorizado | Construcción | Técnica |
| C12 | **PENDIENTE** | Textos en producción prometen funciones inexistentes | Sostenedor | Revisión de textos | Etapa 3 | Sostenedor, Legal |
| C13 | PENDIENTE | Nombre del copiloto | Sostenedor | Decisión | Sin bloqueo | Sostenedor |
| C14 | PENDIENTE | Continuar frente a publicación | Sostenedor | Decisión | Construcción | Sostenedor |
| C15 | **PENDIENTE** | P21 sin revisión normativa | Sostenedor, asesoría | Informe legal | Construcción, Etapa 3 | Legal |
| C16 | EXISTE EN CÓDIGO | 60 frente a 70 | Sostenedor | D3, Q1 | Construcción | Sostenedor |
| C17 | PENDIENTE | P17 incoherente en maestra | Sostenedor | Ratificación | Construcción | Sostenedor |
| C18 | PENDIENTE | Matices de P7 | Sostenedor | Texto unificado | Construcción | Sostenedor |
| C19 | **PENDIENTE** | Acceso al copiloto en piloto real | Sostenedor | Decisión de acceso | Etapa 3 | Sostenedor |
| C20 | PROPUESTO | Estado inmediato frente a identidad total | Sostenedor | Aceptar protocolo | Construcción | Sostenedor, Técnica |
| C21 | EXISTE EN CÓDIGO | Copiloto no bloquea tras aprobar | Técnica, sostenedor | Prueba NI6 | Construcción, Etapa 3 | Técnica |
| C22 | **PENDIENTE** | Riesgo detectado sin aviso a nadie | Sostenedor, asesoría | Protocolo aprobado y probado | Etapa 3 | Sostenedor, Legal |
| C23 | PENDIENTE | Fecha de resultados no garantizada | Sostenedor | Decisión | Construcción | Sostenedor |
| C24 | PROPUESTO | Siglas repetidas | Técnica | Citas explícitas | Sin bloqueo | Técnica |
| Decisión D1 | PENDIENTE | Qué se ve y cuándo | Sostenedor | Ratificación | Construcción | Sostenedor |
| Decisión D2 | PENDIENTE | P21 reemplaza regla | Sostenedor | Ratificación tras C15 | Construcción | Sostenedor, Legal |
| Decisión D3 | COMUNICADO | Bandas 70/80 | Sostenedor | Ratificación | Construcción | Sostenedor |
| Decisión D4 | PENDIENTE | Familia y tutor | Sostenedor | Ratificación | Construcción | Sostenedor |
| Prueba D1 | SIN EJECUTAR | FK activas por conexión | Técnica | 04 §10 | Etapa 1 | Técnica |
| Prueba D2 | SIN EJECUTAR | FK compuestas, nulos, versiones | Técnica | 04 §10 | Etapa 1 | Técnica |
| Prueba D3 | SIN EJECUTAR | Drizzle | Técnica | 04 §10 | Etapa 1 | Técnica |
| Prueba D4 | SIN EJECUTAR | Triggers y deriva | Técnica | 04 §10 | Etapa 1 | Técnica |
| Prueba D5 | SIN EJECUTAR | Evidencia cruzada | Técnica | 04 §10 | Etapa 1 | Técnica |
| Prueba D6 | SIN EJECUTAR | Publicación | Técnica | 04 §10 | Etapa 1 | Técnica |
| Prueba D7 | SIN EJECUTAR | Atomicidad y concurrencia | Técnica | 04 §10 | Etapa 1 | Técnica |
| Prueba D8 | SIN EJECUTAR | Costos | Técnica | 04 §10 | Etapa 1 | Técnica |
| Prueba D9 | SIN EJECUTAR | Proyección consistente | Técnica | 04 §10 | Etapa 1 | Técnica |
| O1 | ABIERTA | No dominado | Académica | Parámetro aprobado | Construcción | Académica |
| O2 | ABIERTA | Separación de aciertos | Académica | `k6_separation` aprobado | Construcción | Académica |
| O3 | ABIERTA | Ayuda | Académica | Parámetro | Construcción | Académica |
| O4 | ABIERTA | Validadores | Sostenedor | Nombres | Etapa 2 | Sostenedor |
| O5 | ABIERTA | Unidad | Académica | Ficha | Etapa 2 | Académica |
| O6 | ABIERTA | Incertidumbre | Académica | Decisión | Construcción | Académica |
| O7 | ABIERTA | Mapa a familia y tutor | Sostenedor | Decisión | Construcción | Sostenedor |
| O8 | ABIERTA | Retención | Académica | Política | Construcción | Académica |
| O9 | ABIERTA | Adaptaciones | Académica | Criterios; P13 | Etapa 3 | Académica, Legal |
| O10 | ABIERTA | Datos; choca con solo inserción | Sostenedor, asesoría | Política de datos | Etapa 3 | Sostenedor, Legal |
| N1 | ABIERTA | 70 % y K6 | Sostenedor | Decisión | Construcción | Sostenedor |
| N2 | ABIERTA | Evidencia válida | Sostenedor | Decisión | Construcción | Sostenedor, Académica |
| N3 | ABIERTA | Módulo sin base | Académica | Decisión | Construcción | Académica |
| N4 | ABIERTA | Lugar del feedback | Sostenedor | Decisión | Construcción | Sostenedor |
| N5 | ABIERTA | Cobertura | Académica | Ficha | Etapa 2 | Académica |
| N6 | ABIERTA | Histórico | Sostenedor | P7 | Sin bloqueo inicial | Sostenedor |
| N7 | ABIERTA | Textos | Sostenedor | C12 | Etapa 3 | Sostenedor |
| N8 | ABIERTA | Piloto y resto | Sostenedor | Decisión | Construcción | Sostenedor |
| N9 | ABIERTA | Familias | Académica | Criterio | Etapa 2 | Académica |
| N10 | ABIERTA | Modelos | Sostenedor | Criterios | Sin bloqueo inicial | Sostenedor |
| N11 | ABIERTA | Estado inicial | Académica | Decisión | Construcción | Académica |
| N12 | ABIERTA | Defecto y resultado | Sostenedor | Proceso | Construcción | Sostenedor |
| N13 | ABIERTA | Copiloto y evaluación abierta | Académica | Decisión | Sin bloqueo inicial | Académica |
| N14 | ABIERTA | Intento que cuenta | Sostenedor | Decisión | Construcción | Sostenedor |
| N15 | ABIERTA | Calendario | Sostenedor | Capacidad real, sin verificar | Plan | Sostenedor |
| N16 | ABIERTA | Error con ayuda | Académica | Parámetro | Construcción | Académica |
| N17 | ABIERTA | Pregunta retirada | Académica | Parámetro | Construcción | Académica |
| N18 | ABIERTA | Nueva versión | Académica | Parámetro | Construcción | Académica |
| N19 | ABIERTA | Corrección docente | Sostenedor | Decisión | Sin bloqueo inicial | Sostenedor |
| N20 | ABIERTA | Cierre de versión | Sostenedor | Decisión; NI4, NI5 | Construcción | Sostenedor, Académica |
| N21 | ABIERTA | Entrada tardía | Sostenedor | Decisión | Construcción | Sostenedor, Académica |
| Q1 | ABIERTA | ¿70 % a E1–E4? | Académica | Decisión; ver `PROGRESO` §7 | Construcción | Académica |
| Q2 | ABIERTA | Etiquetas de prácticas | Académica | Decisión; ver `PROGRESO` §7 | Construcción | Académica |
| Q3 | ABIERTA | Redondeo | Académica | Decisión; ver `PROGRESO` §7 | Construcción | Académica |
| Q4 | ABIERTA | Mínimo por contenido | Académica | Decisión; ver `PROGRESO` §7 | Etapa 2 | Académica |
| Q5 | ABIERTA | ¿Avanza esperando lote? | Académica | Decisión; ver `PROGRESO` §7 | Construcción | Académica |
| Q6 | ABIERTA | Contenidos antes de publicar | Académica | Decisión; ver `PROGRESO` §7 | Construcción | Académica |
| Q7 | ABIERTA | ¿Aviso al continuar? | Académica | Decisión; ver `PROGRESO` §7 | Construcción | Académica |
| Q8 | ABIERTA | Quién etiqueta y plazo | Académica | Decisión; ver `PROGRESO` §7 | Etapa 2 | Académica |
| P7 | PROPUESTO | Histórico | Sostenedor | Decisión; maestra §9 | Construcción | Sostenedor |
| P8 | PROPUESTO | Formularios externos | Sostenedor | Decisión; maestra §9 | Construcción | Sostenedor |
| P16 | PROPUESTO | Función de E1–E4 | Sostenedor | Decisión; maestra §9 | Construcción | Académica |
| P17 | PENDIENTE | 2 intentos en recuperación | Sostenedor | Decisión; maestra §9 | Construcción | Sostenedor |
| P20-v | PENDIENTE | Capacidad y frecuencia de lotes | Sostenedor | Decisión; maestra §9 | Construcción | Sostenedor |
| P21 | COMUNICADO | Continuar con E2 reprobada; reemplaza regla aprobada | Sostenedor | Decisión D2, C15 | Construcción | Sostenedor, Legal |

**E0:** autorizaciones A1–A6, todas PENDIENTES: [11](11_PLAN_E0.md) §10.

Detalle de Q1–Q8: `docs/p0e/PROGRESO_Y_PROGRESION.md` §7. P7–P25: especificación maestra §9 y `docs/p0e/DECISIONES_PARA_APROBAR.md`.
