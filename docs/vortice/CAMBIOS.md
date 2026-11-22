# Registro de cambios por área (último commit revisado)

Sirve para no releer lo que no cambió: `git diff --stat <commit> -- <rutas del área>`. Si no hay salida, no ha cambiado desde la última revisión. **Actualizar la columna «revisado» al verificar un área.**

| Área | Rutas clave | Último commit que la tocó (2026-11-22) | Revisado por el arquitecto |
|---|---|---|---|
| evaluacion | `server/evaluacion*.ts`, `VorticeEvaluacion.tsx`, `migrations/vortice/0005*` | `ac51d91` | `923826e` (seguridad) y `a292d75`; cambios posteriores de Antigravity sin verificar |
| brujula | `shared/brujula*.ts`, `server/brujula.ts`, `BrujulaPanel.tsx` | `20136ee` | parte 1: `9939051`; parte 2 sin verificar |
| calendario | `shared/calendario2027.ts`, `server/calendario2027Db.ts` | `aac8752` | `5660554` (T35); carga a BD sin verificar |
| flow | `server/flow*.ts`, `shared/flowSandbox.ts` | `835f124` | auditoría de seguridad 2026-11-22 (sin cambios de código) |
| precios | `shared/precios.ts`, `shared/planPrices.ts` | `3580a91` | publicado en producción (PR 4, 5 y 6) |
| aula-mapa | `shared/{aulaUniversal,mapaConocimiento,retencionMapa,cruceEvaluacionMapa}.ts` | `4f16b84` | sin verificar a fondo |
| banco | `docs/vortice/piloto/` | `ad8c264` | `ad8c264` |
| perfil | `server/perfilEvaluacion.ts`, `shared/clasificacionEvaluacion.ts` | `835f124` | sin verificar a fondo |

## Registro reciente
- 2026-11-22: auditoría de reconciliación (Antigravity), auditoría de seguridad de Flow, optimización de contexto; T40 en curso.
- 2026-11-21: precios y 3 PR a producción; Brújula 1; calendario 2027; evaluación E2 probada en Preview; HANDOFF.
