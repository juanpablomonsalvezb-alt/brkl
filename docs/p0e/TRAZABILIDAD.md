# Matriz de trazabilidad

**Fecha:** 2026-10-30. **Clasificación:** ver [`README.md`](README.md). «Maestra» = `docs/P0-E/ESPECIFICACION_MAESTRA.md`, rama `docs/p0-e-maestro`, `0e1f64f`.
Toda implementación, migración o despliegue requiere además autorización nueva tras la revisión independiente.

| Decisión | Fuente | Estado | Documento | Implicancia funcional | Pendiente |
|---|---|---|---|---|---|
| P1 intentos 2/3/2/2 | Maestra §13 | APROBADO | Maestra | Límite por instancia. No existe en código | Implementación |
| P2 consumo al enviar | Maestra §13 | APROBADO | Maestra | Requiere intentos persistidos | Implementación |
| P3 T y 48 h | Maestra §13 | APROBADO | Maestra; T4 | Ventanas | Implementación |
| P4 `review_at` T+49 | Maestra §13 | APROBADO | Maestra; T4 | Publicación de pauta y resultados | Implementación |
| P5 tardío 409 | Maestra §13 | APROBADO | Maestra | Rechazo | Implementación |
| P6 lotes y versiones | Maestra §13 | APROBADO | Maestra | Recuperación | Implementación; P20-v |
| P12 recuperación única | Maestra §13 | APROBADO | Maestra | Cierre «Reprobado» | Implementación |
| P15 vencimiento | Maestra §3 | APROBADO | Maestra | Cierre por vencimiento | Implementación |
| P18 excepciones | Maestra §5 | APROBADO (límites pendientes) | Maestra | Versión alternativa | P18-v |
| P19 publicación de pauta | Maestra §9 | APROBADO | Maestra | Condiciona E2 y mapa | Implementación |
| Resultado binario inmediato | Maestra §2 | APROBADO; **EXISTE EN CÓDIGO** en `/submit` | Maestra | Sin puntaje en respuesta | D1, C1, C2 |
| Familia y tutor ven estado | Maestra §2 | APROBADO | Maestra | Vistas sin puntaje | D4, C5 |
| P17 2 intentos de recuperación | Orden de dirección; Maestra §9 | COMUNICADA | `PROGRESO` §3 | Recuperación | Ratificar; C17 |
| P21 continuar con E2 «Reprobado» | Dirección, 2026-10-26 | COMUNICADA; reemplaza regla aprobada | `PROGRESO` §3 | Avance registrado, sin cambiar resultado | **D2**, C3, C14, C15 |
| Bandas 70/80 | Dirección, 2026-10-26 | COMUNICADA | `PROGRESO` §2 | Estado y aviso | **D3**, Q1–Q3, C16 |
| Porcentaje desde la condición de publicación | Propuesta | PROPUESTA | `PROGRESO` §1 | Publicación diferida | **D1** |
| P7 histórico | `DECISIONES_*` | PROPUESTA | `DECISIONES_PARA_APROBAR` | Sin reescritura | Dirección; C18 |
| P8 formularios | `DECISIONES_*` | PROPUESTA | `DECISIONES_PARA_APROBAR` | Plazo y validación | Dirección |
| P16 función E1–E4 | `DECISIONES_*` | PROPUESTA | `DECISIONES_PARA_APROBAR` | Rótulos; base de K11 | Dirección |
| K1 dirección | Dirección, 2026-10-30 | COMUNICADA | `DOMINIO` §1 | Modelo por contenidos | Revisión independiente |
| K2 P0-E evidencia | Dirección | COMUNICADA | `DOMINIO` §5 | Capas separadas | Revisión |
| K3 sin promesas | Dirección | COMUNICADA | `DOMINIO` §1 | Mensajes | C12, N7 |
| K4 pregunta↔contenido | Dirección | COMUNICADA | `DOMINIO` §2 | Etiquetado | Migración; O4 |
| K5 validación humana | Dirección | COMUNICADA | `DOMINIO` §2 | Gobierno | O4 |
| K6 dominado | Dirección | COMUNICADA | `DOMINIO` §3 | Estado por contenido | O1–O3, N1, N2, N9 |
| K7 prerrequisitos | Dirección | COMUNICADA | `DOMINIO` §2 | Relaciones | O4 |
| K8 rutas alternativas | Dirección | COMUNICADA, etapa 2 | `DOMINIO` §2 | Sin efecto en etapa 1 | Etapa 2 |
| K9 un nivel y asignatura | Dirección | COMUNICADA | `DOMINIO` §6 | Alcance | N8 |
| K10 piloto 5.º Básico | Dirección | COMUNICADA | `DOMINIO` §6 | Matemática | O5 |
| K11 feedback | Dirección | COMUNICADA | `DOMINIO` §5 | Por contenido en prácticas | **C6**, P16, N4 |
| K12 mapa | Dirección | COMUNICADA | `DOMINIO` §4; `PROGRESO` §5 | Interfaz | C7, C9, N3 |
| K13 revisión de preguntas IA | Dirección | COMUNICADA | `DOMINIO` §1 | Flujo editorial | Generador actual no lo exige |
| K14 respuesta↔contenido | Dirección | COMUNICADA | `DOMINIO` §1 | Datos | **Migración separada** |
| Experiencia de progreso | Dirección | COMUNICADA; requisito | `PROGRESO` §5 | Ruta, mapa, panel, historial | D1–D4; no construir |
| Cuatro indicadores | Dirección | COMUNICADA; requisito | `PROGRESO` §5.4 | Sin mezclar | Implementación |
| Repaso espaciado | `server/repaso.ts` | **EXISTE EN CÓDIGO**, provisional | `CONTRADICCIONES` C11 | Usa preguntas evaluativas | Banco separado |
| Copiloto IA | `/api/academic-copilot/chat` | **EXISTE EN CÓDIGO**, sin verificar en uso | `CONTRADICCIONES` C13 | Conversación, no adaptación | Confirmar |
| Diagnóstico adaptativo, frontera, algoritmo | Informe | NO EXISTE | `DOMINIO` §7 | Ninguna hoy | Sin autorizar |
