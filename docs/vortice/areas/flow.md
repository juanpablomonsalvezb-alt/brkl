# Área: pagos Flow (pago único y suscripción mensual $70.000 x 7)
**Archivos:** `server/flowService.ts` (singleton `flowService` + `createFlowService` + `crearFlowServiceDesdePasarela` F1), `server/flowRoutes.ts`, `server/flowSubscriptions.ts`, `shared/flowSandbox.ts` (`crearPasarelaSuscripciones` F1), `scripts/probar-flow-sandbox.ts`, tablas `flow_subscriptions` y `flow_subscription_invoices` en `shared/schema.ts`.

**T40 cerrada y verificada (2026-11-22, commit ver. `CAMBIOS.md`):** F1 a F7 implementadas.
- F1: pasarela de suscripciones con modo explícito (`FLOW_SUSCRIPCIONES_MODO`, sandbox por omisión; producción exige `NODE_ENV`, `VERCEL_ENV` y `FLOW_SUSCRIPCIONES_CONFIRMO_PRODUCCION=si`). El singleton `flowService` sigue intacto para el pago único.
- F2: rutas de suscripción solo con `FLOW_SUSCRIPCIONES=1` (sin ella, 404).
- F3: pagar y matricular solo al confirmarse la primera factura (webhook), no al registrar tarjeta.
- F4: transición `pending_card`→`active` atómica (doble llamada simultánea = una sola suscripción en Flow).
- F5: tabla `flow_subscription_invoices` para deduplicar (no contra `lastInvoiceId`); migración incremental sin aplicar (`docs/vortice-migracion-incremental-flow-facturas.sql`).
- F6: sin respaldo al header Host; `getPlan`/`createPlan` distinguen error real de "no existe".
- F7: rate limit en memoria por IP; `card-return` solo POST; `subscription-register-status` de solo lectura.
- F8: pendiente de verificar en sandbox real (formato del callback: `invoiceId`+firma `s` vs. solo `token`).

**Hallazgo de la verificación (no de Junie):** el informe de Junie reportó "3/3 mutaciones de sanidad detectadas" siendo falso — el script `script/mutaciones-t40.ts` crasheaba antes de probar (b) y (c) por datos de prueba defectuosos (email inválido, luego id de reserva duplicado). Corregido el script (no la lógica de producción); las 3 mutaciones (guardia sandbox, atomicidad F4, deduplicación F5) sí pasan verificadas por mí.

**Sigue sin habilitar:** falta aplicar la migración SQL, definir variables en Vercel (`FLOW_SUSCRIPCIONES`, `FLOW_SUSCRIPCIONES_MODO`, `BASE_URL`, `FLOW_SUSCRIPCIONES_CONFIRMO_PRODUCCION`), verificar `FLOW_API_URL` de producción y el formato real del callback (F8). No fusionar a `main` ni habilitar sin orden "PRODUCCION".

**Pruebas:** `script/flow-suscripciones.check.ts`, `flow-sandbox.check.ts`, `flow-modo.check.ts`, `flow-concurrencia.check.ts` (todas en `check:vortice`); `script/mutaciones-t40.ts` manual (no corre en la suite).
