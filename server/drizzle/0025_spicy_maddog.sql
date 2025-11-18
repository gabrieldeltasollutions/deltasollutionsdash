CREATE TABLE `material_quotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialId` int NOT NULL,
	`supplier` varchar(255) NOT NULL,
	`quotedPrice` int NOT NULL,
	`deliveryTime` varchar(100),
	`paymentTerms` varchar(255),
	`notes` text,
	`isRecommended` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `material_quotations_id` PRIMARY KEY(`id`)
);
