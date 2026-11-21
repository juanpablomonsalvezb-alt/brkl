-- Vórtice: migración consolidada de todas las ramas vortice/* (incluye T37 Flow recurrente, T38 Brújula parte 2 y T39 perfil/evaluaciones).
-- Generada a partir de drizzle-kit/api + adición SQLite de flow_subscriptions, brujula_preferences, brujula_study_blocks,
-- perfil de evaluación en user_profiles y función de evaluación en module_evaluations.
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

-- T37 (Flow recurrente) y T38 (Brújula parte 2): tablas agregadas tras vortice/integracion.
CREATE TABLE `flow_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`reservation_id` text NOT NULL,
	`flow_plan_id` text NOT NULL,
	`flow_customer_id` text NOT NULL,
	`register_token` text,
	`flow_subscription_id` text,
	`amount` integer NOT NULL,
	`periods_total` integer NOT NULL,
	`periods_paid` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending_card' NOT NULL,
	`last_invoice_id` text,
	`last_paid_at` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "flow_sub_amount_nonneg" CHECK(`amount` >= 0),
	CONSTRAINT "flow_sub_periods_total_pos" CHECK(`periods_total` >= 1),
	CONSTRAINT "flow_sub_periods_paid_nonneg" CHECK(`periods_paid` >= 0),
	CONSTRAINT "flow_sub_status_chk" CHECK(`status` IN ('pending_card', 'card_registered', 'active', 'past_due', 'completed', 'cancelled', 'failed'))
);;

CREATE UNIQUE INDEX `flow_subscriptions_reservation_uq` ON `flow_subscriptions` (`reservation_id`);;

CREATE UNIQUE INDEX `flow_subscriptions_register_token_uq` ON `flow_subscriptions` (`register_token`);;

CREATE UNIQUE INDEX `flow_subscriptions_flow_sub_uq` ON `flow_subscriptions` (`flow_subscription_id`);;

CREATE TABLE `brujula_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`intensidad` text DEFAULT 'normal' NOT NULL,
	`dias_preferidos_json` text DEFAULT '[1,2,3,4,5]' NOT NULL,
	`franja` text DEFAULT 'tarde' NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "brujula_pref_intensidad_chk" CHECK(`intensidad` IN ('suave', 'normal', 'intensivo')),
	CONSTRAINT "brujula_pref_franja_chk" CHECK(`franja` IN ('manana', 'tarde', 'noche'))
);;

CREATE TABLE `brujula_study_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`week_start` text NOT NULL,
	`blocks_json` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);;

CREATE UNIQUE INDEX `brujula_blocks_user_week` ON `brujula_study_blocks` (`user_id`,`week_start`);;

-- T39: perfil de evaluación en ficha del estudiante (regular / neurodivergente) y clasificación de evaluaciones.
ALTER TABLE `user_profiles` ADD `evaluation_profile` text DEFAULT 'regular' NOT NULL CHECK(`evaluation_profile` IN ('regular', 'neurodivergente'));;

ALTER TABLE `user_profiles` ADD `evaluation_profile_set_by` text;;

ALTER TABLE `user_profiles` ADD `evaluation_profile_set_at` integer;;

ALTER TABLE `module_evaluations` ADD `evaluation_function` text CHECK(`evaluation_function` IS NULL OR `evaluation_function` IN ('diagnostico', 'proceso', 'modulo'));;

-- Bloque A (Aula Universal UDL): guardado real por tramo para pausar y retomar.
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
);;

CREATE UNIQUE INDEX IF NOT EXISTS `lesson_study_progress_user_oa_uidx` ON `lesson_study_progress` (`user_id`, `oa_id`);;
