-- Vórtice (módulo de alertas): migración incremental aditiva para bases que ya tienen `notification_preferences`
-- (por ejemplo brkl-preview o instalaciones que ya aplicaron `docs/vortice-migracion.sql` previo).
-- Agrega las dos preferencias de los avisos por inactividad: aviso al estudiante (3 días sin actividad) y aviso al
-- apoderado (5 días). Por decisión del sostenedor (2026-11-23) vienen ACTIVADAS por defecto, también para las filas
-- que ya existen. Cada columna se puede apagar después por usuario.
-- Se ejecuta UNA vez: SQLite no permite ADD COLUMN condicional (igual que la migración incremental T39).
-- NO APLICADA EN NINGUNA BASE REAL NI EN TURSO. Aplicar en Turso o producción requiere autorización explícita y respaldo previo.

ALTER TABLE `notification_preferences` ADD `recordatorio_inactividad` integer DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD `aviso_inactividad_apoderado` integer DEFAULT true NOT NULL;
