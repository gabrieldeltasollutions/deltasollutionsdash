CREATE TABLE `materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`widthMm` int NOT NULL,
	`lengthMm` int NOT NULL,
	`purchasePrice` int NOT NULL,
	`costPerMm2` int NOT NULL,
	`supplier` varchar(255),
	`stockQuantity` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`)
);
