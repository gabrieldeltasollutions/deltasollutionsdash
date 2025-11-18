CREATE TABLE `machines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('centro_usinagem','torno_convencional','torno_cnc','fresadora','outros') NOT NULL,
	`purchaseValue` int NOT NULL,
	`residualValue` int NOT NULL DEFAULT 0,
	`usefulLifeHours` int NOT NULL,
	`occupiedArea` int NOT NULL,
	`powerKw` int NOT NULL,
	`maintenanceCostPerYear` int NOT NULL DEFAULT 0,
	`consumablesCostPerYear` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `machines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`machineId` int NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`partDescription` text NOT NULL,
	`rawMaterialCost` int NOT NULL DEFAULT 0,
	`toolingCost` int NOT NULL DEFAULT 0,
	`thirdPartyServicesCost` int NOT NULL DEFAULT 0,
	`machineTimeHours` int NOT NULL,
	`setupTimeHours` int NOT NULL DEFAULT 0,
	`machineHourlyCost` int NOT NULL,
	`totalMachineCost` int NOT NULL,
	`totalLaborCost` int NOT NULL,
	`subtotal` int NOT NULL,
	`taxAmount` int NOT NULL,
	`profitAmount` int NOT NULL,
	`finalPrice` int NOT NULL,
	`profitMargin` int NOT NULL,
	`taxRate` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rentPerSquareMeter` int NOT NULL DEFAULT 0,
	`electricityCostPerKwh` int NOT NULL DEFAULT 0,
	`operatorHourlyCost` int NOT NULL DEFAULT 0,
	`defaultProfitMargin` int NOT NULL DEFAULT 20,
	`defaultTaxRate` int NOT NULL DEFAULT 0,
	`workingHoursPerYear` int NOT NULL DEFAULT 2080,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_userId_unique` UNIQUE(`userId`)
);
