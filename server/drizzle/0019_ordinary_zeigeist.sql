CREATE TABLE `task_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskType` enum('activity','subtask') NOT NULL,
	`taskId` int NOT NULL,
	`comment` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_comments_id` PRIMARY KEY(`id`)
);
