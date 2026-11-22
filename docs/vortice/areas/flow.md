# Área: pagos Flow (pago único y suscripción mensual $70.000 x 7)
**Archivos:** `server/flowService.ts` (singleton `flowService` + `createFlowService`), `server/flowRoutes.ts`, `server/flowSubscriptions.ts`, `shared/flowSandbox.ts`, `scripts/probar-flow-sandbox.ts`, tabla `flow_subscriptions` en `shared/schema.ts`.
**Hallazgos de la auditoría (2026-11-22):** `assertFlowSandboxUrl` no se usa en el servidor; el singleton toma credenciales y URL del entorno sin validar; las 5 rutas de suscripción se registran sin bandera; reserva marcada pagada y alumno matriculado al registrar tarjeta (antes del primer cobro); carrera que puede crear 2 suscripciones; dedupe solo contra la última factura; formato real del callback sin verificar.
**Regla:** NO habilitar ni fusionar a `main` hasta cerrar T40 (F1 a F7) y ordenar producción. No tocar el pago único.
**Pruebas:** `script/flow-suscripciones.check.ts`, `flow-sandbox.check.ts`; T40 agrega `flow-modo` y `flow-concurrencia`.
