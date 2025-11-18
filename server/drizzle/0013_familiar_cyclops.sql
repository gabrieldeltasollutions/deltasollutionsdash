CREATE TABLE `phaseActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`phase` enum('planejamento','desenvolvimento','testes','entrega','finalizado') NOT NULL,
	`name` varchar(255) NOT NULL,
	`startDate` timestamp,
	`endDate` timestamp,
	`completed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `phaseActivities_id` PRIMARY KEY(`id`)
);
