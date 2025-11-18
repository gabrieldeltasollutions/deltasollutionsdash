CREATE TABLE `phase_subtasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`startDate` timestamp,
	`endDate` timestamp,
	`completed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `phase_subtasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `phaseSubtasks`;