CREATE TABLE `projectTeamMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`teamMemberId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectTeamMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `leaderId` int;--> statement-breakpoint
ALTER TABLE `projects` ADD `duration` int;