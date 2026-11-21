-- Vórtice (T39): migración incremental aditiva para bases que ya tienen `user_profiles` y `module_evaluations`
-- (por ejemplo brkl-preview o instalaciones que ya aplicaron `docs/vortice-migracion.sql` previo).
-- Agrega perfil de evaluación único por estudiante (regular / neurodivergente, sin datos clínicos)
-- y clasificación funcional nullable de evaluaciones (`diagnostico` | `proceso` | `modulo`) sin reescribir historial.
-- NO APLICADA EN NINGUNA BASE REAL NI EN TURSO. Aplicar en Turso o producción requiere autorización explícita y respaldo previo.

ALTER TABLE `user_profiles` ADD `evaluation_profile` text DEFAULT 'regular' NOT NULL CHECK(`evaluation_profile` IN ('regular', 'neurodivergente'));
--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `evaluation_profile_set_by` text;
--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `evaluation_profile_set_at` integer;
--> statement-breakpoint
ALTER TABLE `module_evaluations` ADD `evaluation_function` text CHECK(`evaluation_function` IS NULL OR `evaluation_function` IN ('diagnostico', 'proceso', 'modulo'));
