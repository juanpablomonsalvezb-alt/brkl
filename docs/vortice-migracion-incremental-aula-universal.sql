-- Vórtice (Aula Universal UDL): tabla aditiva e idempotente para guardado real de progreso por tramo.
-- Pensada para bases que ya tienen la tabla `users` y migraciones previas.
-- NO APLICADA EN NINGUNA BASE REAL NI EN TURSO. Aplicar en Turso o producción requiere autorización explícita y respaldo previo.

CREATE TABLE IF NOT EXISTS `lesson_study_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`oa_id` text NOT NULL,
	`paso_actual` text DEFAULT 'me_ubico' NOT NULL,
	`tramo_actual` integer DEFAULT 0 NOT NULL,
	`puerta_preferida` text DEFAULT 'video' NOT NULL,
	`paso_ejemplo_visto` integer DEFAULT 0 NOT NULL,
	`completada_por_ya_lo_se` integer DEFAULT 0 NOT NULL,
	`practica_lograda` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "lesson_prog_paso_chk" CHECK(`paso_actual` IN ('me_ubico', 'aprende', 'intentalo', 'comprueba')),
	CONSTRAINT "lesson_prog_tramo_chk" CHECK(`tramo_actual` >= 0),
	CONSTRAINT "lesson_prog_puerta_chk" CHECK(`puerta_preferida` IN ('video', 'podcast', 'presentacion', 'explorar')),
	CONSTRAINT "lesson_prog_ej_chk" CHECK(`paso_ejemplo_visto` >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `lesson_study_progress_user_oa_uidx` ON `lesson_study_progress` (`user_id`, `oa_id`);
