CREATE TABLE `project_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`unit` varchar(50) NOT NULL,
	`unitPrice` int NOT NULL,
	`supplier` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_materials_id` PRIMARY KEY(`id`)
);
