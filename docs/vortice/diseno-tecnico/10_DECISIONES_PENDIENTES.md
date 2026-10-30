# 10. Matriz de decisiones pendientes

**Nada aquí está decidido.** «Recomendación» es técnica, no aprobación. Detalle: `docs/p0e/CONTRADICCIONES_Y_PREGUNTAS.md`. Dirección reserva lo pedagógico.

**Bloquea:** **Diseño** = cambia el esquema o la arquitectura. **Prog.** = programar la función. **Piloto** = iniciar con estudiantes. Entre paréntesis, la etapa de [09](09_PLAN_DE_IMPLEMENTACION.md).

## 1. Qué se necesita primero

| Para | Falta |
|---|---|
| Comprobar soporte técnico (E0) | Autorizar base desechable |
| Catálogo y banco (E1) | O4, O5, N9 y ficha del piloto |
| Política de dominio (E2) | O1, O2, O3, N1, N2, N16, N17, N18 |
| Mapa (E3) | O6, N3 si aplica, N11 |
| Núcleo P0-E | P7, P8, P16, P17, P20-v, C16 |
| E2 con evidencia (E5) | N2, C6, C7, N4, C20, C21 |
| Resultados y P21 (E6) | D1–D4, C14, C15, N14 |
| Estudiantes reales (E7) | O10, C19, C22, C12, autenticación, revisión legal |

**Ninguna decisión exige rehacer el esquema**, salvo preguntas multi-contenido o una respuesta que cambie N2 o D2 de forma no prevista. Esto es una evaluación por lectura; las pruebas D1–D8 pueden cambiarlo.

## 2. Contradicciones

| ID | Qué resolver | Alternativas | Recomendación | Consecuencia técnica | Decide | Bloquea |
|---|---|---|---|---|---|---|
| C1 | ¿% real o solo estado? | A: desde `review_at`. B: nunca. C: siempre | A | Qué serializa la API | Dirección (D1) | Prog. (E6) |
| C2 | ¿Banda antes de `review_at`? | Igual que C1 | A | Igual | Dirección (D1) | Prog. (E6) |
| C3 | ¿P21 reemplaza no desbloquear? | A: reemplaza. B: liberación manual. C: mantiene | Sin recomendación académica; técnicamente viables A y B | Cambia `checkModuleAccess` | Dirección (D2) | Prog. (E6) |
| C4 | ¿Repaso por contenido antes de `review_at`? | A: después. B: antes, con riesgo | A | Filtro de publicación | Dirección (D1) | Prog. (E5) |
| C5 | ¿Familia y tutor ven %? | A: estado. B: % tras `review_at`. C: distinto por rol | A hasta decidir | DTO por rol | Dirección (D4) | Prog. (E6) |
| C6 | Feedback inmediato frente a regla aprobada | A: banco separado. B: E1, E3, E4. C: al cerrar la instancia | A | `release_policy` | Dirección; B y C enmiendan maestra | Prog. (E5) |
| C7 | Mapa delata E2 | Embargo; sin E2; inmediato (inviable) | Embargo | `released_at`, filtro único | Dirección (N2) | Prog. (E5) |
| C8 | K6 frente a <70 % por contenido | A: del estado. B: % por contenido. C: ambos | A | Fuente de «a reforzar» | Dirección | Prog. (E6) |
| C9 | Módulo abierto con contenidos sin base | A: abierto con aviso. B: bloquea dentro. C: ruta previa | A | Estado `requiere base` | Dirección (N3) | Prog. (E6) |
| C10 | Frontera individual frente a calendario | A: orienta. B: calendario flexible | A | Recomendación sin acceso | Dirección | Sin bloqueo inicial |
| C11 | Repaso usa preguntas evaluativas | A: banco separado. B: mantener | A; fuera del piloto | Retirar `review_items` luego | Dirección | Prog. (E1) |
| C12 | Textos públicos prometen funciones | A: corregir ahora. B: al lanzar | A | Ninguna en motor | Dirección (N7) | Piloto |
| C13 | Cómo nombrar el copiloto | A: «copiloto, sin validar». B: tutor | A | Sin cambio ahora | Dirección | Sin bloqueo |
| C14 | Mostrar pendientes antes de continuar | A: esperar `review_at`. B: lista sin detalle. C: adelantar | A | Cuándo habilitar continuar | Dirección (D1, D2) | Prog. (E6) |
| C15 | Revisión normativa de P21 | A: primero. B: después | A | Puede invalidar P21 | Dirección y asesoría | Prog. (E6), Piloto |
| C16 | 70 frente a 60 | A: 70 a todas. B: solo E2 | Sin recomendación académica | Constante y generador | Dirección (D3, Q1) | Prog. (P0) |
| C17 | P17 incoherente en maestra | Ratificar 2 | Ratificar | `max_attempts` | Dirección | Prog. (P0) |
| C18 | Matices en P7 | Unificar textos | Unificar | Regla de migración | Dirección | Prog. (P0) |

### Nuevas en esta revisión

| ID | Qué resolver | Alternativas | Recomendación | Consecuencia técnica | Decide | Bloquea |
|---|---|---|---|---|---|---|
| **C19** | El copiloto queda fuera del motor, pero su enlace sigue en Vórtice: es ayuda no registrada durante la práctica | A: ocultar enlace a estudiantes del piloto. B: mantener y aceptar límite | B si la ayuda se entiende como límite de K6; A si se quiere una medición más limpia. Requiere decidir | A requiere cambio de interfaz, autorizado aparte | Dirección | Piloto |
| **C20** | «Todas las respuestas idénticas» choca con el estado inmediato APROBADO | A: dos pruebas, P1 y P2. B: ocultar también el estado (enmienda maestra) | A | Protocolo de [08](08_SEGURIDAD_Y_GOBIERNO.md) §7 | Dirección | Prog. (E5) |
| **C21** | Al aprobar, una evaluación sale de `openEvaluationsForStudent`: el copiloto deja de bloquearla aunque otros la estén rindiendo | A: bloquear hasta `review_at`. B: mantener | A | Cambio futuro de código, con P0-E | Dirección | Prog. (P0) |
| **C22** | Riesgo detectado sin aviso a nadie, ya con enlace en Vórtice | A: protocolo y responsables. B: mantener | A | Puede requerir registro y avisos | Dirección y asesoría | Piloto; independiente del motor |

## 3. Decisiones D

| ID | Qué resolver | Alternativas | Recomendación | Consecuencia técnica | Decide | Bloquea |
|---|---|---|---|---|---|---|
| D1 | Qué se ve y cuándo | Ver C1 | Estado; % desde `review_at` | DTO | Dirección | Prog. (E6) |
| D2 | P21 reemplaza regla | Ver C3 | Decidir solo tras C15 | Regla de acceso | Dirección | Prog. (E6) |
| D3 | Bandas 70/80 | Ratificar; ajustar | Ratificar con Q1–Q3 | Constantes | Dirección | Prog. (P0, E6) |
| D4 | Familia y tutor | Ver C5 | Estado y contenidos, sin % | Permisos | Dirección | Prog. (E6) |

## 4. Preguntas O

| ID | Qué resolver | Alternativas | Recomendación | Consecuencia técnica | Decide | Bloquea |
|---|---|---|---|---|---|---|
| O1 | Qué es «no dominado» | Ver [03](03_MOTOR_DE_EVIDENCIAS.md) §7 | 2 errores en familias distintas | Parámetro | Dirección | Prog. (E2) |
| O2 | ¿2 correctas en misma sesión? | Permitido; sesiones; días | Sesiones distintas | Parámetro | Dirección | Prog. (E2) |
| O3 | ¿Ayuda cuenta? | Ver §6 de 03 | No cuenta para K6 | Parámetro | Dirección | Prog. (E2) |
| O4 | Quién valida | Interno; externo | Dos personas nombradas | Rol revisor | Dirección | Prog. (E1) |
| O5 | Qué unidad | Elegir | Sin recomendación: falta planificación | Catálogo | Dirección | Prog. (E1) |
| O6 | Mostrar incertidumbre | «Sigue practicando»; estado propio; nada | Primera | UI | Dirección | Prog. (E3) |
| O7 | Mapa a familia y tutor | Resumen; completo | Tutor completo; familia resumen | DTO | Dirección | Prog. (E3) |
| O8 | Retención | Intervalos actuales; otros | Actuales, como hipótesis | Agenda | Dirección | Prog. (E4) |
| O9 | Adaptaciones | Registrar y contar; caso a caso | Primera, si no altera el constructo | `accommodation` | Dirección | Piloto |
| O10 | Conservación de datos | Seudonimizar; borrar; conservar | Seudonimizar, con revisión | Choca con solo inserción: **puede tocar diseño** | Dirección y legal | Diseño parcial, Piloto |

## 5. Preguntas N

| ID | Qué resolver | Alternativas | Recomendación | Consecuencia técnica | Decide | Bloquea |
|---|---|---|---|---|---|---|
| N1 | 70 % y K6 | §8.1 de 03 | Independientes | Canales separados | Dirección | Prog. (E2) |
| N2 | Evidencia válida | §8.3 de 03 | Práctica primero; E2 embargada después | `evidence_sources` | Dirección | Prog. (E2, E5) |
| N3 | Módulo sin base | Ver C9 | Abierto con aviso | UI | Dirección | Prog. (E6) |
| N4 | Dónde va el feedback | Ver C6 | Banco separado | `release_policy` | Dirección | Prog. (E5) |
| N5 | Cobertura de preguntas | K6 en práctica; más preguntas; por contenido clave | Práctica | Tamaño del banco | Dirección | Prog. (E1) |
| N6 | Evidencia histórica | No cuenta; pista | No cuenta | Sin migrar | Dirección (P7) | Sin bloqueo inicial |
| N7 | Textos | Ver C12 | Corregir | Ninguna | Dirección | Piloto |
| N8 | Piloto y resto | Conviven; solo con mapa | Conviven | Interruptor por dominio | Dirección | Prog. (E3) |
| N9 | Preguntas distintas | §5 de 03 | Familia por revisor | Ya en esquema | Dirección | Prog. (E1) |
| N10 | Modelos estadísticos | Definir criterios | Después del piloto | Sin efecto | Dirección | Sin bloqueo inicial |
| N11 | Estado inicial | Vacío; prueba fija | Vacío | Primer mapa | Dirección | Prog. (E3) |
| N12 | Pregunta defectuosa y resultado P0-E | Proceso aparte; no | Proceso aparte | Sin alterar intentos | Dirección | Prog. (P0) |
| N13 | Copiloto con evaluación abierta | Por contenido; textual | Por contenido | Futuro | Dirección | Sin bloqueo inicial |
| N14 | Qué intento da el % | El que cerró; mejor; último | El que cerró | Publicación | Dirección | Prog. (E6) |
| N15 | Calendario enero 2027 | Piloto después; E3–E4 antes | Sin verificar capacidad | Alcance | Dirección | Plan |
| N16 | Error con ayuda | No cuenta; cuenta | No cuenta | Parámetro | Dirección | Prog. (E2) |
| N17 | Pregunta retirada | Sigue contando; no | Sigue | Parámetro | Dirección | Prog. (E2) |
| N18 | Nueva versión | Caso a caso; reinicia; nunca | Caso a caso | `evidence_continuity` | Dirección | Prog. (E2) |
| N19 | Corrección docente | Nuevo `source_type`; solo anulación | Solo anulación | Esquema, si cambia | Dirección | Sin bloqueo inicial |

Q1–Q8 y P7–P25 pendientes siguen en sus documentos, sin cambios.
