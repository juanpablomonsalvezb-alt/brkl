-- Vórtice familia: vínculo apoderado ↔ estudiante. NO aplicada.
-- drizzle-kit generate también arrastró deriva previa del snapshot (faqs, funnel_events, paes_*,
-- together_presence, waitlist_signups, columnas de reservations) que la base ya tiene vía db:push;
-- se dejó fuera para que migrate:prod no falle. El snapshot 0001 sí queda al día con shared/schema.ts.
-- user_profiles.role admite 'guardian': el enum es solo de aplicación en SQLite, sin DDL.
CREATE TABLE IF NOT EXISTS `guardian_links` (
	`id` text PRIMARY KEY NOT NULL,
	`guardian_user_id` text NOT NULL,
	`student_user_id` text NOT NULL,
	`status` text DEFAULT 'pendiente' NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`guardian_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `guardian_links_pair_idx` ON `guardian_links` (`guardian_user_id`,`student_user_id`);
