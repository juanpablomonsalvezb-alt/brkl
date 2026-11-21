-- Vórtice: migración incremental aditiva e idempotente para T37 (Flow recurrente) y T38 (Brújula parte 2).
-- Pensada para bases que ya cuentan con las tablas base (`users`, `reservations`) y el esquema de vortice/integracion
-- (por ejemplo brkl-preview o instalaciones que ya aplicaron docs/vortice-migracion.sql previo).
-- NO APLICADA EN NINGUNA BASE REAL NI EN TURSO. Aplicar en Turso o producción requiere autorización explícita y respaldo previo.

CREATE TABLE IF NOT EXISTS `flow_subscriptions` (
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
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `flow_subscriptions_reservation_uq` ON `flow_subscriptions` (`reservation_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `flow_subscriptions_register_token_uq` ON `flow_subscriptions` (`register_token`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `flow_subscriptions_flow_sub_uq` ON `flow_subscriptions` (`flow_subscription_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `brujula_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`intensidad` text DEFAULT 'normal' NOT NULL,
	`dias_preferidos_json` text DEFAULT '[1,2,3,4,5]' NOT NULL,
	`franja` text DEFAULT 'tarde' NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "brujula_pref_intensidad_chk" CHECK(`intensidad` IN ('suave', 'normal', 'intensivo')),
	CONSTRAINT "brujula_pref_franja_chk" CHECK(`franja` IN ('manana', 'tarde', 'noche'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `brujula_study_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`week_start` text NOT NULL,
	`blocks_json` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `brujula_blocks_user_week` ON `brujula_study_blocks` (`user_id`,`week_start`);
