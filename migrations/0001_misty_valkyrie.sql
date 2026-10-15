-- Vórtice: repaso espaciado. Solo crea review_items.
-- drizzle-kit generate también emitió las tablas/columnas ya existentes en producción
-- (faqs, funnel_events, paes_*, together_presence, waitlist_signups, columnas de reservations)
-- porque el snapshot 0000 estaba desfasado; se quitaron a mano. 0001_snapshot.json sí refleja el schema actual.
CREATE TABLE `review_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`evaluation_id` text NOT NULL,
	`question_id` integer NOT NULL,
	`box` integer DEFAULT 0 NOT NULL,
	`due_day` text NOT NULL,
	`reviews` integer DEFAULT 0 NOT NULL,
	`last_reviewed_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`evaluation_id`) REFERENCES `module_evaluations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_items_user_question_idx` ON `review_items` (`user_id`,`evaluation_id`,`question_id`);
