ALTER TABLE `users` ADD `temporaryResetCode` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `resetCodeExpiresAt` timestamp;