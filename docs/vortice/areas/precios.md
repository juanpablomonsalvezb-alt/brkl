# Área: precios
**Fuente única:** `shared/precios.ts` (marcadores `{{precio_escolar}}`...). En producción (`main`) ya está: escolar $70.000/mes x 7 (marzo a septiembre), lista $490.000, pago único $416.500 (15 %), ahorro $73.500; adultos sin cambio; «de marzo a octubre» sin «31».
**Catálogo de cobro por servidor:** `shared/planPrices.ts` (solo en la rama de Vórtice; `main` no lo tiene).
**Cuidado:** los snapshots `client/public/prerendered/*.html` se parcharon a mano; `npm run prerender` falla y `seo:build` mete cambios ajenos. No regenerar a ciegas. `api/handler.js` se regenera al compilar: revertirlo con `git checkout -- api/handler.js`.
**Pruebas:** `script/pagos.check.ts`, `script/fechas-cobro.check.ts`.
