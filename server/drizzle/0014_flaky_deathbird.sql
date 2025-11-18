CREATE TABLE `phaseSubtasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`completed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `phaseSubtasks_id` PRIMARY KEY(`id`)
);
