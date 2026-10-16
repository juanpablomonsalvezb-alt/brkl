-- NO APLICAR A CIEGAS. Diferencia acumulada entre el snapshot 0000 y shared/schema.ts
-- antes de tutoría (tablas y columnas que producción ya usa, creadas con db:push).
-- Se genera solo para que 0002 contenga únicamente tutoría. Antes de aplicarla, comparar
-- con el esquema real de Turso y marcarla como aplicada si ya está todo.
CREATE TABLE `faqs` (
	`id` text PRIMARY KEY NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`category` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE TABLE `funnel_events` (
	`id` text PRIMARY KEY NOT NULL,
	`step` text NOT NULL,
	`path` text,
	`source` text,
	`session_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE TABLE `paes_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`base_price_per_subject` integer NOT NULL,
	`tutor_price_per_subject` integer,
	`max_subjects` integer,
	`includes_tutor` integer DEFAULT false NOT NULL,
	`features` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE TABLE `paes_subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`base_price` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE TABLE `paes_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`student_name` text NOT NULL,
	`student_email` text NOT NULL,
	`student_phone` text,
	`plan_id` text,
	`selected_subjects` text NOT NULL,
	`includes_tutor` integer DEFAULT false NOT NULL,
	`total_price` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`notes` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`plan_id`) REFERENCES `paes_plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `together_presence` (
	`client_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`subject` text,
	`last_seen` integer NOT NULL,
	`room` text
);
--> statement-breakpoint
CREATE TABLE `waitlist_signups` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`level_interest` text,
	`learning_profile_interest` text,
	`notes` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_signups_email_unique` ON `waitlist_signups` (`email`);--> statement-breakpoint
ALTER TABLE `reservations` ADD `student_full_name` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `student_rut` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `student_email` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `guardian_full_name` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `guardian_rut` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `guardian_email` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `age` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `course_of_interest` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `selected_plan` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `attachment_name` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `attachment_mime_type` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `attachment_data` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `payment_status` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `flow_order` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `flow_token` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `payment_date` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `payment_amount` integer;