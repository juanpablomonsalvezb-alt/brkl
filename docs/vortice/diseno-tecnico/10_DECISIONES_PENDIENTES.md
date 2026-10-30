# 10. Matriz de decisiones pendientes

**Nada aquí está decidido.** «Recomendación» es una propuesta técnica. Detalle del conflicto: `docs/p0e/CONTRADICCIONES_Y_PREGUNTAS.md`. **Bloquea:** Datos = diseño de esquema; Impl = construir la función; Futuro = solo función posterior.

## 1. Lo que bloquea primero

| Para | Se necesita |
|---|---|
| Migrar catálogo y banco (E1) | O4, O5, N9 |
| Política de dominio (E2) | O1, O2, O3, N1, N2 |
| Mostrar mapa (E3) | O6, N3 |
| Núcleo P0-E | P7, P8, P16, P17, P20-v |
| E2 con evidencia (E5) | N2, C6, C7, N4 |
| Publicar resultados y P21 (E6) | **D1, D2, D3, D4, C14, C15** |
| Estudiantes reales (E7) | O10, autenticación, revisión legal |

El esquema de §3 de [04](04_MODELO_DE_DATOS.md) tolera casi todas las respuestas por política. **Ninguna decisión pendiente exige rehacerlo**, salvo si se opta por preguntas multi-contenido o por eliminar `incierto` en la capa de datos.

## 2. Contradicciones

| ID | Conflicto | Consecuencia técnica | Alternativas | Recomendación | Bloquea | Debe decidir |
|---|---|---|---|---|---|---|
| C1 | % real vs. solo estado | Qué serializa la API | A: desde `review_at`. B: nunca. C: siempre | A | Impl E6 | D1 |
| C2 | Banda vs. solo estado | Igual | Igual | A | Impl E6 | D1 |
| C3 | P21 vs. no desbloquear | Cambia `checkModuleAccess` | A: reemplazar. B: autorización manual. C: mantener | Sin recomendación académica; técnicamente viable A o B | Impl E6 | D2 |
| C4 | Repaso vs. `review_at` | Filtro de publicación | A: tras `review_at`. B: antes con riesgo | A | Impl E5 | D1 |
| C5 | Familia/tutor | DTO por rol | A: estado. B: %, tras `review_at`. C: distinto por rol | A hasta decidir | Impl E6 | D4 |
| C6 | Feedback inmediato vs. estado | `release_policy` | [03](03_MOTOR_DE_EVIDENCIAS.md) §8.2 | A: banco separado | Impl E5 | ¿Enmendar la maestra? |
| C7 | Mapa delata E2 | `released_at` | Embargo; sin E2; inmediato (inviable) | Embargo | Impl E5 | N2 |
| C8 | K6 vs. <70 por contenido | Fuente única de «a reforzar» | [03](03_MOTOR_DE_EVIDENCIAS.md) §8.5 | A: del estado | Impl E6 | Criterio |
| C9 | P21 vs. bloqueado | Estado `requiere base` | A: abierto con aviso. B: bloquea contenidos dentro del módulo. C: ruta previa obligatoria | A | Impl E6 | N3 |
| C10 | Frontera individual vs. calendario | La recomendación no abre nada | A: orienta. B: calendario flexible en piloto | A | Futuro | Modelo |
| C11 | Repaso con preguntas evaluativas | Congelar en piloto, retirar luego | A: banco separado. B: mantener | A | Impl E1 | Autorizar retiro |
| C12 | Textos públicos | Sin efecto técnico; riesgo | A: corregir ya. B: con el lanzamiento | A | No bloquea | N7 |
| C13 | Copiloto | Nombre y alcance | A: «copiloto». B: desactivar en piloto | Desactivado en piloto hasta evaluarlo | Futuro E8 | Dirección |
| C14 | Mostrar antes de continuar vs. `review_at` | Cuándo se habilita continuar | A: esperar. B: lista sin detalle antes. C: adelantar con riesgo | A | Impl E6 | D1, D2 |
| C15 | P21 sin revisión normativa | Puede invalidar el diseño | A: revisar primero. B: decidir y revisar luego | A | Impl E6 | Dirección y asesoría |
| C16 | 70 vs. 60 | Valor en código y generador | A: 70 a todas. B: solo E2 | Sin recomendación académica | Impl P0 | D3, Q1 |
| C17 | P17 incoherente | `max_attempts` | Ratificar 2 | Ratificar | Impl P0 | Dirección |
| C18 | P7 con matices | Regla de migración | Texto maestra o propuesta | Unificar al decidir | Impl P0 | P7 |

## 3. Decisiones D

| ID | Conflicto | Consecuencia | Alternativas | Recomendación | Bloquea | Debe decidir |
|---|---|---|---|---|---|---|
| D1 | Qué se ve y cuándo | DTO | Ver C1 | Estado; % desde `review_at` | Impl E6 | Dirección |
| D2 | P21 reemplaza regla | Regla de acceso | Ver C3 | Ratificar solo tras C15 | Impl E6 | Dirección |
| D3 | Bandas 70/80 | Constantes | Ratificar; ajustar | Ratificar con Q1–Q3 | Impl P0, E6 | Dirección |
| D4 | Familia y tutor | Permisos | Ver C5 | Estado y contenidos, sin % | Impl E6 | Dirección |

## 4. Preguntas O

| ID | Conflicto | Consecuencia | Alternativas | Recomendación | Bloquea | Debe decidir |
|---|---|---|---|---|---|---|
| O1 | Qué es «no dominado» | Política | [03](03_MOTOR_DE_EVIDENCIAS.md) §7 | 2 errores en familias distintas | Impl E2 | Pedagogía |
| O2 | ¿Misma sesión? | Política | A: permitido. B: sesiones distintas. C: días distintos | B: distingue memoria inmediata | Impl E2 | Pedagogía |
| O3 | Con ayuda | `assistance` | §6 de 03 | No cuenta para K6 | Impl E2 | Pedagogía |
| O4 | Quién valida | Rol y flujo | A: equipo interno. B: externo | Dos personas distintas, nombradas | **Impl E1** | Dirección |
| O5 | Unidad | Catálogo | Elegir unidad | Sin recomendación: no se conoce la planificación | **Impl E1** | Pedagogía |
| O6 | Mostrar incertidumbre | UI | A: «sigue practicando». B: estado propio. C: nada | A | Impl E3 | Pedagogía |
| O7 | Mapa a familia/tutor | DTO | A: resumen. B: completo | Tutor completo; familia resumen | Impl E3 | D4 |
| O8 | Retención | Agenda | A: intervalos actuales. B: otros | A como hipótesis a medir | Impl E4 | Pedagogía |
| O9 | Adaptaciones | `accommodation` | A: registrar y contar. B: revisar caso a caso | A si no altera el constructo | Impl E7 | Pedagogía, P13 |
| O10 | Conservación | Purga vs. inmutabilidad | A: seudonimizar. B: borrar. C: conservar | A, con revisión legal | Impl E7 | Dirección, legal |

## 5. Preguntas N

| ID | Conflicto | Consecuencia | Alternativas | Recomendación | Bloquea | Debe decidir |
|---|---|---|---|---|---|---|
| N1 | 70 % y K6 | Independencia de canales | §8.1 de 03 | Independientes | Impl E2 | Dirección |
| N2 | Evidencia válida | `evidence_sources` | §8.3 de 03 | Práctica ya; E2 con embargo después | Impl E2, E5 | Dirección |
| N3 | Módulo sin base | UI | Ver C9 | Abierto con aviso | Impl E6 | Dirección |
| N4 | Dónde el feedback | `release_policy` | Ver C6 | Banco separado | Impl E5 | Dirección |
| N5 | Cobertura | Con 15–20 preguntas, K6 no se logra en E2 sola | A: K6 sobre todo en práctica. B: más preguntas. C: E2 por contenido clave | A | Impl E1 | Pedagogía |
| N6 | Histórico | Sin evidencia antigua | A: no cuenta. B: cuenta como pista | A: faltan datos por pregunta | Futuro | P7 |
| N7 | Textos | Ninguna técnica | Ver C12 | Corregir | No bloquea | Dirección |
| N8 | Piloto y resto | Interruptor por dominio | A: conviven. B: reglas solo donde hay mapa | A, sin cambios fuera del piloto | Impl E3 | Dirección |
| N9 | Preguntas distintas | Familias | §5 de 03 | Familia por revisor | **Datos** (ya resuelto en diseño); Impl E1 | Pedagogía |
| N10 | Modelos | Columna de [05](05_ALGORITMOS_Y_RECOMENDACIONES.md) §6 | Definir criterios | Después del piloto | Futuro | Dirección |

## 6. Preguntas nuevas de esta etapa

| ID | Conflicto | Consecuencia | Alternativas | Recomendación | Bloquea | Debe decidir |
|---|---|---|---|---|---|---|
| N11 | Estado inicial | Primer mapa | A: vacío. B: prueba fija | A en la primera versión | Impl E3 | Pedagogía |
| N12 | Corregir resultado por pregunta defectuosa | Inmutabilidad vs. justicia | A: proceso auditado aparte. B: no | A, por definir | Impl P0 | Dirección |
| N13 | Copiloto con evaluación abierta | Bloqueo por contenido | A: bloquear contenido. B: solo textual | A | Futuro E8 | Pedagogía |
| N14 | Qué intento da el porcentaje | Regla de publicación | A: el que cerró (ya propuesto). B: mejor. C: último | A | Impl E6 | Dirección |
| N15 | Calendario | Alcance enero 2027 | A: piloto después. B: solo E3–E4 antes | B, si hay capacidad | Plan | Dirección |

Las preguntas Q1–Q8 y pendientes P9–P11, P13, P14, P22–P25 siguen en sus documentos, sin cambios.
