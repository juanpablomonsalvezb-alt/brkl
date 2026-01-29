CREATE TABLE `adult_cycle_configurations` (
	`id` text PRIMARY KEY NOT NULL,
	`cycle_key` text NOT NULL,
	`cycle_name` text NOT NULL,
	`monthly_price` integer NOT NULL,
	`enrollment_price` integer NOT NULL,
	`total_price` integer NOT NULL,
	`duration_months` integer NOT NULL,
	`modules_count` integer NOT NULL,
	`quizzes_total` integer NOT NULL,
	`essays_count` integer NOT NULL,
	`academic_load` text,
	`basica_ds10` text,
	`basica_ds257` text,
	`media_ds257` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `adult_cycle_configurations_cycle_key_unique` ON `adult_cycle_configurations` (`cycle_key`);--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`level_subject_id` text NOT NULL,
	`enrolled_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`is_active` integer DEFAULT true,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`level_subject_id`) REFERENCES `level_subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `evaluation_links` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`module_number` integer NOT NULL,
	`evaluation_number` integer NOT NULL,
	`gemini_link` text NOT NULL,
	`title` text,
	`release_date` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE TABLE `evaluation_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`evaluation_id` text NOT NULL,
	`completed_at` integer,
	`score` integer,
	`total_correct` integer,
	`total_questions` integer,
	`answers_json` text,
	`passed` integer DEFAULT false,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`evaluation_id`) REFERENCES `module_evaluations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `gemini_copilots` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`gemini_link` text NOT NULL,
	`description` text,
	`level_ids` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE TABLE `learning_objectives` (
	`id` text PRIMARY KEY NOT NULL,
	`level_subject_id` text NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`week_number` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`textbook_start_page` integer,
	`textbook_end_page` integer,
	`module_oas` text,
	`module_contents` text,
	`module_date_range` text,
	`word_doc_url` text,
	FOREIGN KEY (`level_subject_id`) REFERENCES `level_subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `level_plan_configurations` (
	`id` text PRIMARY KEY NOT NULL,
	`level_group_key` text NOT NULL,
	`level_group_name` text NOT NULL,
	`program_type` text NOT NULL,
	`levels_included` text NOT NULL,
	`monthly_price_full` integer NOT NULL,
	`monthly_price_standard` integer NOT NULL,
	`monthly_price_tutor` integer NOT NULL,
	`enrollment_price` integer NOT NULL,
	`modules` integer DEFAULT 15 NOT NULL,
	`evaluations_per_module` integer DEFAULT 4 NOT NULL,
	`total_evaluations` integer DEFAULT 60 NOT NULL,
	`essays` integer DEFAULT 2 NOT NULL,
	`sessions_per_month` integer DEFAULT 2,
	`subjects` text DEFAULT '["Lenguaje","Matemática","Ciencias Naturales","Historia y Geografía","Inglés"]' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `level_plan_configurations_level_group_key_unique` ON `level_plan_configurations` (`level_group_key`);--> statement-breakpoint
CREATE TABLE `level_subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`level_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`total_oas` integer DEFAULT 0,
	`textbook_pdf_url` text,
	`textbook_title` text,
	FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `levels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`program_type` text NOT NULL,
	`total_weeks` integer DEFAULT 30 NOT NULL,
	`cadence_per_oa` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `module_evaluations` (
	`id` text PRIMARY KEY NOT NULL,
	`learning_objective_id` text NOT NULL,
	`evaluation_number` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`release_day` integer DEFAULT 5 NOT NULL,
	`release_week` integer NOT NULL,
	`form_url` text,
	`html_content` text,
	`questions_json` text,
	`total_questions` integer,
	`passing_score` integer DEFAULT 60,
	`generated_at` integer,
	`is_required` integer DEFAULT true,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`learning_objective_id`) REFERENCES `learning_objectives`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `plan_configurations` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_key` text NOT NULL,
	`plan_name` text NOT NULL,
	`plan_subtitle` text,
	`monthly_price` integer NOT NULL,
	`enrollment_price` integer NOT NULL,
	`annual_total` integer,
	`academic_load` text,
	`evaluations_detail` text,
	`subjects` text DEFAULT '["Lenguaje","Matemática","Historia","Ciencias","Inglés"]' NOT NULL,
	`description` text,
	`category` text,
	`link_text` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plan_configurations_plan_key_unique` ON `plan_configurations` (`plan_key`);--> statement-breakpoint
CREATE TABLE `program_calendar` (
	`id` text PRIMARY KEY NOT NULL,
	`level_id` text NOT NULL,
	`start_date` integer NOT NULL,
	`module_duration_weeks` integer DEFAULT 2 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`rut` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`date_of_birth` text NOT NULL,
	`program_type` text NOT NULL,
	`level_interest` text,
	`how_did_you_hear` text,
	`comments` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE TABLE `site_configuration` (
	`id` text PRIMARY KEY NOT NULL,
	`config_key` text NOT NULL,
	`config_value` text NOT NULL,
	`config_type` text DEFAULT 'text' NOT NULL,
	`description` text,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_configuration_config_key_unique` ON `site_configuration` (`config_key`);--> statement-breakpoint
CREATE TABLE `student_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`resource_id` text NOT NULL,
	`completed_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`score` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resource_id`) REFERENCES `weekly_resources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subjects_slug_unique` ON `subjects` (`slug`);--> statement-breakpoint
CREATE TABLE `textbook_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`drive_folder_id` text,
	`pdf_url` text,
	`pdf_name` text NOT NULL,
	`total_pages` integer,
	`module_pages_config` text DEFAULT '{}' NOT NULL,
	`module_pdfs_map` text DEFAULT '{}',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'student' NOT NULL,
	`level_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE TABLE `weekly_completion` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`learning_objective_id` text NOT NULL,
	`is_complete` integer DEFAULT false,
	`completed_at` integer,
	`exam_score` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`learning_objective_id`) REFERENCES `learning_objectives`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `weekly_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`learning_objective_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`title` text NOT NULL,
	`notebook_lm_url` text,
	`barkley_foundation` text,
	`student_help` text,
	`pedagogical_objective` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`learning_objective_id`) REFERENCES `learning_objectives`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `IDX_session_expire` ON `sessions` (`expire`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`name` text,
	`first_name` text,
	`last_name` text,
	`profile_image_url` text,
	`provider` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversation_id` integer NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
