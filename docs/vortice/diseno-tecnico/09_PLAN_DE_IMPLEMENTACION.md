# 09. Plan de implementación

**Estado:** PROPUESTO. **No autoriza nada.** Cada etapa requiere autorización expresa, tras revisión independiente. Sin estimaciones de fecha: dependen de equipo y decisiones. Piloto: Matemática de 5.º Básico, unidad pendiente (O5). Flujo: rama, pruebas, Preview aislada con cuentas ficticias.

**Idea rectora.** La primera versión útil es **práctica + mapa**, sin tocar E2, sin P0-E y **sin copiloto**. Es medible, y su fallo no afecta resultados académicos. P0-E avanza en una vía paralela.

**Este plan no asume decisiones.** Cada etapa indica qué debe aprobarse antes. Sin esa aprobación, la etapa no comienza. Nada aquí está autorizado, incluida E0.

```mermaid
flowchart TD
  E0[E0 Decisiones y verificaciones] --> E1[E1 Catálogo y banco]
  E1 --> E2M[E2 Motor en sombra]
  E2M --> E3[E3 Mapa y práctica]
  E0 --> P0[P0 Núcleo P0-E]
  E3 --> E5[E5 Integración evidencia E2]
  P0 --> E5
  P0 --> E6[E6 P21 y resultados]
  E5 --> E6
  E3 --> E4[E4 Retención]
  E4 --> E7[E7 Piloto con estudiantes]
  E6 --> E7
  E7 --> E8[E8 Copiloto y modelos, decisión aparte]
```

Si la dirección quiere empezar antes con estudiantes, E7 puede hacerse solo con E3 y E4, sin E5 ni E6.

| Etapa | Objetivo | Componentes | Depende de | Cambios de datos | Riesgos | Pruebas | Aceptación | Dirección aprueba antes |
|---|---|---|---|---|---|---|---|---|
| **E0** | Decidir y verificar | Lectura de esquema real; FK, triggers en base desechable; T2 en Turso | | Ninguno en Vórtice; base desechable autorizada | Deriva de esquema | Comparación sin escritura | Informe de deriva; soporte confirmado | O1–O5, N1, N2, N9, D3; autorizar base desechable |
| **E1** | Catálogo y banco de la unidad | Herramienta admin; flujo editorial; revisor | E0 | Conocimiento y banco (aditivo) | Calidad, carga editorial | Publicación rechaza ciclos; FK de bancos; revisión obligatoria | Unidad publicada, validada por personas; banco suficiente | Unidad, validadores, migración |
| **E2** | Motor sin mostrar | Evidencia, política, estado, fronteras, log | E1 | Evidencia, estado, retención, log | Reglas erradas | §7 de [05](05_ALGORITMOS_Y_RECOMENDACIONES.md); datos ficticios | Determinista, reconstruible, auditado | Política de dominio, migración |
| **E3** | Práctica y mapa en Preview | Práctica, feedback, mapa, panel | E2 | Ninguno nuevo | Motivación, claridad, móvil | CA1–CA3, CA8, CA10; accesibilidad | Tres lentes separados; dato real | O6, diseño |
| **E4** | Retención | Agenda, comprobaciones | E3 | Ninguno nuevo | Carga | Intervalos con reloj simulado | Sin castigo por ausencia; agenda correcta | O8 |
| **P0** | Núcleo evaluativo | Instancias, intentos, ventanas, cierres, lotes, versiones | E0 | Migración P0-E | Concurrencia, histórico | T1–T5 reales; invariantes 1–14 | Según maestra | P7, P8, P16, P17, P20-v; migración |
| **E5** | E2 aporta evidencia | Respuestas por pregunta, embargo | E3, P0 | `evaluation_attempt_answers` | **Filtración** | **No interferencia**, CA4 | Payloads iguales hasta `review_at` | N2, C6, C7, N4 |
| **E6** | Resultados y P21 | Publicación, bandas, continuación | P0, E5 | `progression_continuations` | Normativo | CA4–CA7; límites 69,9/70/79,9/80 | E2 sigue «Reprobado» | **D1–D4, C14, C15**, Q1–Q3 |
| **E7** | Piloto real | Medición, acompañamiento | E3, E4 (E5, E6 si aplica) | Ninguno | Privacidad, equidad, muestra pequeña | Protocolo con docentes | Métricas aprobadas; informe | Datos, O10, revisión legal, autenticación real, despliegue |
| **E8** | Ampliar, solo si se autoriza | Copiloto ([07](07_COPILOTO_IA.md) §6); modelos | E7 con evidencia | Según diseño | Promesas sin evidencia | Validación fuera de muestra | Criterios fijados | N10, K3 |

**Medir en E7** (propuesta de lo que se mide, sin meta): concordancia con evaluación docente, aciertos diferidos, abandono, claridad, carga docente, y diferencias por dispositivo y conectividad. No minutos conectados.

**Plan de reversión:** cada migración es aditiva. Interruptor por dominio para ocultar mapa y práctica, sin afectar el resto de Vórtice.

**Calendario.** El acceso a la plataforma se anuncia para enero de 2027 (`Home.tsx`). No se verificó que este plan llegue a esa fecha: N15.

## Ficha de definición del piloto

**Plantilla para completar. No es catálogo: no contiene contenidos ni preguntas.** No se verificó qué materiales de 5.º Básico hay cargados: no se leyeron bases de datos. Aunque el nivel `5b` figura en código, eso no prueba que existan módulos o recursos.

| # | Información | Debe entregar | Debe aprobar | Requisito para aceptar |
|---|---|---|---|---|
| 1 | Unidad curricular (O5) | Equipo pedagógico | Dirección | Nombre, duración, módulos que cubre |
| 2 | OA oficiales | Equipo pedagógico | Validador | Código y texto de fuente oficial, año |
| 3 | Contenidos observables y evaluables | Equipo pedagógico | Validador distinto del autor | Definición operacional. Hipótesis: 30–60 contenidos |
| 4 | Prerrequisitos | Equipo pedagógico | Validador | Tipo, justificación, confianza. Solo necesaria y contributiva |
| 5 | Recursos disponibles | Equipo pedagógico | Validador | Lista real por contenido; vacíos señalados |
| 6 | Preguntas de práctica | Equipo pedagógico; borrador con IA solo si se autoriza | Revisor (K13) | Clave, explicación, contenido |
| 7 | Familias independientes (N9) | Equipo pedagógico | Validador | Mínimo por contenido, a decidir. K6 exige al menos 2; retención requiere más |
| 8 | Preguntas de evaluación, si corresponde | Equipo pedagógico | Validador | **No en la primera versión**, salvo decisión. Nunca del banco de práctica |
| 9 | Responsables (O4) | Dirección | Dirección | Nombres; autor y validador distintos; suplentes |
| 10 | Política de dominio (O1–O3, N16–N18) | Equipo pedagógico propone | Dirección | Sin parámetros nulos |
| 11 | Grupo de estudiantes, si hay piloto real | Dirección | Dirección y revisión legal | Consentimiento, criterio, tamaño |

### Reparto de tareas

| Equipo pedagógico | Equipo técnico |
|---|---|
| Elegir unidad, OA y contenidos | Herramienta de carga y flujo editorial |
| Escribir o revisar preguntas y asignar familias | Validar grafo: ciclos, referencias |
| Definir prerrequisitos | Informar faltantes: contenido sin familias, sin OA |
| Proponer criterios de dominio | Implementar política como parámetros |
| Revisar calidad con datos del monitoreo | Detector de similitud como aviso |
| Decidir qué mostrar a cada edad | Pruebas, seguridad y datos |

**El equipo técnico no define contenidos ni prerrequisitos. El pedagógico no edita datos fuera del flujo.** No se creó catálogo ni se cargaron preguntas.
