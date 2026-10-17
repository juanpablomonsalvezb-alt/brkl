-- Vórtice: migración consolidada de todas las ramas vortice/* (rama vortice/integracion).
-- Generada en memoria con drizzle-kit/api: diferencia entre shared/schema.ts de main y el de esta rama.
-- NO APLICADA EN NINGUNA BASE. Aplicar en producción requiere autorización explícita y respaldo previo.
-- Supone que producción coincide con shared/schema.ts de main (creada con db:push); verificarlo antes.
-- program_calendar: el INSERT fue corregido a mano (el generado leía columnas que la tabla antigua no tiene).
-- together_presence.email se elimina: el servidor nunca guardaba un valor real (ver docs/privacidad-datos.md).

CREATE TABLE `brujula_weeks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`week_start` text NOT NULL,
	`goals_json` text NOT NULL,
	`difficulty` text,
	`note` text,
	`closed_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
;

CREATE UNIQUE INDEX `brujula_weeks_user_week` ON `brujula_weeks` (`user_id`,`week_start`);;

CREATE TABLE `guardian_links` (
	`id` text PRIMARY KEY NOT NULL,
	`guardian_user_id` text NOT NULL,
	`student_user_id` text NOT NULL,
	`status` text DEFAULT 'pendiente' NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`guardian_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
;

CREATE UNIQUE INDEX `guardian_links_pair_idx` ON `guardian_links` (`guardian_user_id`,`student_user_id`);;

CREATE TABLE `learning_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tipo` text NOT NULL,
	`referencia` text NOT NULL,
	`level_subject_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`level_subject_id`) REFERENCES `level_subjects`(`id`) ON UPDATE no action ON DELETE no action
);
;

CREATE INDEX `idx_learning_events_ls_fecha` ON `learning_events` (`level_subject_id`,`created_at`);;

CREATE INDEX `idx_learning_events_user_fecha` ON `learning_events` (`user_id`,`created_at`);;

CREATE TABLE `notification_log` (
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`period_key` text NOT NULL,
	`sent_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `type`, `period_key`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
;

CREATE TABLE `notification_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`evaluacion_liberada` integer NOT NULL,
	`modulo_abierto` integer NOT NULL,
	`resumen_semanal` integer NOT NULL,
	`resumen_semanal_apoderado` integer NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
;

CREATE TABLE `portfolio_evidence_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`evidence_id` text NOT NULL,
	`version` integer NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`reflection` text DEFAULT '' NOT NULL,
	`content` text,
	`url` text,
	`evaluation_progress_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`evidence_id`) REFERENCES `portfolio_evidences`(`id`) ON UPDATE no action ON DELETE cascade
);
;

CREATE UNIQUE INDEX `portfolio_evidence_versions_uq` ON `portfolio_evidence_versions` (`evidence_id`,`version`);;

CREATE TABLE `portfolio_evidences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`learning_objective_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`reflection` text DEFAULT '' NOT NULL,
	`content` text,
	`url` text,
	`evaluation_progress_id` text,
	`visibility` text DEFAULT 'privada' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`learning_objective_id`) REFERENCES `learning_objectives`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`evaluation_progress_id`) REFERENCES `evaluation_progress`(`id`) ON UPDATE no action ON DELETE no action
);
;

CREATE INDEX `portfolio_evidences_user_idx` ON `portfolio_evidences` (`user_id`);;

CREATE TABLE `reflection_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`resource_id` text NOT NULL,
	`answers_json` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resource_id`) REFERENCES `weekly_resources`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "reflection_answers_len" CHECK(length("reflection_responses"."answers_json") <= 16000)
);
;

CREATE UNIQUE INDEX `reflection_responses_user_resource_idx` ON `reflection_responses` (`user_id`,`resource_id`);;

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
;

CREATE UNIQUE INDEX `review_items_user_question_idx` ON `review_items` (`user_id`,`evaluation_id`,`question_id`);;

CREATE TABLE `rubric_criteria` (
	`id` text PRIMARY KEY NOT NULL,
	`rubric_id` text NOT NULL,
	`description` text NOT NULL,
	`performance_levels` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`rubric_id`) REFERENCES `rubrics`(`id`) ON UPDATE no action ON DELETE no action
);
;

CREATE TABLE `rubrics` (
	`id` text PRIMARY KEY NOT NULL,
	`learning_objective_id` text NOT NULL,
	`title` text NOT NULL,
	`version` integer NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`learning_objective_id`) REFERENCES `learning_objectives`(`id`) ON UPDATE no action ON DELETE no action
);
;

CREATE UNIQUE INDEX `rubrics_objective_version_uq` ON `rubrics` (`learning_objective_id`,`version`);;

CREATE TABLE `tutoring_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`tutor_id` text,
	`learning_objective_id` text NOT NULL,
	`resource_id` text,
	`question` text NOT NULL,
	`response` text,
	`closing_note` text,
	`status` text DEFAULT 'abierto' NOT NULL,
	`created_at` integer NOT NULL,
	`assigned_at` integer,
	`responded_at` integer,
	`closed_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tutor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`learning_objective_id`) REFERENCES `learning_objectives`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resource_id`) REFERENCES `weekly_resources`(`id`) ON UPDATE no action ON DELETE no action
);
;

CREATE INDEX `idx_tutoring_cases_student` ON `tutoring_cases` (`student_id`);;

CREATE INDEX `idx_tutoring_cases_tutor_status` ON `tutoring_cases` (`tutor_id`,`status`);;

PRAGMA foreign_keys=OFF;;

CREATE TABLE `__new_program_calendar` (
	`id` text PRIMARY KEY NOT NULL,
	`academic_year` integer NOT NULL,
	`level_id` text,
	`start_date` integer NOT NULL,
	`module_duration_weeks` integer DEFAULT 2 NOT NULL,
	`total_modules` integer DEFAULT 15 NOT NULL,
	`general_evaluation_weeks` text DEFAULT '[]' NOT NULL,
	`breaks` text DEFAULT '[]' NOT NULL,
	`holidays` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer,
	FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON UPDATE no action ON DELETE no action
);
;

INSERT INTO `__new_program_calendar`("id","academic_year","level_id","start_date","module_duration_weeks","created_at") SELECT "id", CAST(strftime('%Y', "start_date", 'unixepoch') AS integer), "level_id", "start_date", "module_duration_weeks", "created_at" FROM `program_calendar`;

DROP TABLE `program_calendar`;;

ALTER TABLE `__new_program_calendar` RENAME TO `program_calendar`;;

PRAGMA foreign_keys=ON;;

CREATE UNIQUE INDEX `program_calendar_year_level_unique` ON `program_calendar` (`academic_year`,`level_id`);;

CREATE UNIQUE INDEX `program_calendar_year_all_levels_unique` ON `program_calendar` (`academic_year`) WHERE "program_calendar"."level_id" IS NULL;;

ALTER TABLE `user_profiles` ADD `tutor_user_id` text;;

ALTER TABLE `weekly_resources` ADD `pedagogical_step` text;;

ALTER TABLE `weekly_resources` ADD `reflection_prompts` text;;

ALTER TABLE `together_presence` DROP COLUMN `email`;;
