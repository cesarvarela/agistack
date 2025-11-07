CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`allowed_commands` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `settings` (`id`, `allowed_commands`, `updated_at`)
VALUES (1, '["docker","ls","cat","grep","ps","df","du","pwd","whoami","uname"]', strftime('%s', 'now'));
