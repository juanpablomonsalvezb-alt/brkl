# Registro de cambios por área (último commit revisado)

Sirve para no releer lo que no cambió: `git diff --stat <commit> -- <rutas del área>`. Si no hay salida, no ha cambiado desde la última revisión. **Actualizar la columna «revisado» al verificar un área.**

| Área | Rutas clave | Último commit que la tocó (2026-11-22) | Revisado por el arquitecto |
|---|---|---|---|
| evaluacion | `server/evaluacion*.ts`, `VorticeEvaluacion.tsx`, `migrations/vortice/0005*` | `ac51d91` | `923826e` (seguridad) y `a292d75`; cambios posteriores de Antigravity sin verificar |
| brujula | `shared/brujula*.ts`, `server/brujula.ts`, `BrujulaPanel.tsx`, `script/brujula-orientacion-apoderado.check.ts` | `94ef248` (campo `orientacionSinProximaEvaluacion` en `shared/brujulaPanel.ts` y su check; antes `a0c8373`) | parte 1: `9939051`; parte 2 sin verificar; check `a0c8373` endurecido con 3 mutaciones el 2026-11-23 |
| calendario | `shared/calendario2027.ts`, `server/calendario2027Db.ts` | `aac8752` | `5660554` (T35); carga a BD sin verificar |
| flow | `server/flow*.ts`, `shared/flowSandbox.ts` | `ae7cf3a` | F1 a F7 verificadas 2026-11-22; corregido 1 error del informe de Junie (script de test) |
| precios | `shared/precios.ts`, `shared/planPrices.ts` | `3580a91` | publicado en producción (PR 4, 5 y 6) |
| aula-mapa | `shared/{aulaUniversal,mapaConocimiento,retencionMapa,cruceEvaluacionMapa}.ts` | `4f16b84` | sin verificar a fondo |
| banco | `docs/vortice/piloto/` | `ad8c264` | `ad8c264` |
| perfil | `server/perfilEvaluacion.ts`, `shared/clasificacionEvaluacion.ts` | `835f124` | sin verificar a fondo |

## Registro reciente
- 2026-11-23: arquitectura Sonnet 5.5 + Junie Lite decidida y `delegar.sh` probado (fuera del repo); primera tarea real delegada: `a0c8373` (check de «Próxima evaluación» en la orientación del apoderado, endurecido por el arquitecto). Revisados en lectura los 9 archivos sin commitear del 2026-11-22 (rediseño visual y reloj determinista de `retencion-cruce-m4m5m6.check.ts`); siguen sin commitear y sin verse en pantalla.
- 2026-11-22: auditoría de reconciliación (Antigravity), auditoría de seguridad de Flow, optimización de contexto, T40 fusionada (verificada, corregido 1 error del informe de Junie).
- 2026-11-21: precios y 3 PR a producción; Brújula 1; calendario 2027; evaluación E2 probada en Preview; HANDOFF.
