CREATE TABLE `material_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialId` int NOT NULL,
	`approverUserId` int NOT NULL,
	`approverName` varchar(255) NOT NULL,
	`approverRole` varchar(50) NOT NULL,
	`action` enum('approved','rejected') NOT NULL,
	`fromStatus` varchar(50) NOT NULL,
	`toStatus` varchar(50) NOT NULL,
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `material_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `project_materials` ADD `approvalStatus` enum('pending','leader','manager','quotation','director','financial','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `project_materials` ADD `quotationValue` int;--> statement-breakpoint
ALTER TABLE `project_materials` ADD `quotationNotes` text;