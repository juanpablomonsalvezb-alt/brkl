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
--> statement-breakpoint
CREATE INDEX `idx_tutoring_cases_student` ON `tutoring_cases` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_tutoring_cases_tutor_status` ON `tutoring_cases` (`tutor_id`,`status`);