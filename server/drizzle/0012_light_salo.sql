CREATE TABLE `phaseSchedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`phase` enum('planejamento','desenvolvimento','testes','entrega','finalizado') NOT NULL,
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `phaseSchedule_id` PRIMARY KEY(`id`)
);
