-- T40: tabla de facturas procesadas para deduplicación de webhooks de suscripción Flow.
-- Aditivo e idempotente. NO APLICAR automáticamente; requiere autorización explícita.
CREATE TABLE IF NOT EXISTS `flow_subscription_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`subscription_id` text NOT NULL,
	`processed_at` integer NOT NULL,
);

CREATE UNIQUE INDEX IF NOT EXISTS `flow_subscription_invoices_invoice_uq` ON `flow_subscription_invoices` (`invoice_id`);
