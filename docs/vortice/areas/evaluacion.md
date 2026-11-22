# Área: evaluación de cierre E2 (P21 v2)
**Archivos:** `server/evaluacion.ts`, `server/evaluacionRoutes.ts`, `server/perfilEvaluacion.ts`, `migrations/vortice/0005_evaluacion.sql`, `client/src/pages/vortice/VorticeEvaluacion.tsx` + `evaluacion.css`. Protegidos relacionados: `shared/p0e.ts`, `shared/ventanas.ts` (no `ventanas.check.ts`).
**Invariantes:** 15 preguntas; normal + extra (72 h, obligatorio); 70 % (50 % neurodivergente), sin redondeo; respuestas solo inserción; el tiempo lo aplica el servidor; `cerrarProceso` solo con aprobado, extra enviado o plazo vencido; acceso por `checkEvaluationAccess`; rutas apagadas salvo `VORTICE_EVALUACION_RUTAS=1`. Subtema = `item_id`.
**Pruebas:** `script/evaluacion-{servicio,db,extra,rutas}.check.ts`, `script/perfil-y-clasificacion.check.ts`. Demo: `npx tsx script/evaluacion-demo.ts` (puerto 3002).
**Estado:** terminada y probada en Preview (23/23). Migración 0005 solo en `brkl-preview`.
