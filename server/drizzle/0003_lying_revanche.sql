ALTER TABLE `machines` MODIFY COLUMN `consumablesCostPerYear` int NOT NULL;--> statement-breakpoint
ALTER TABLE `machines` ADD `manualHourlyCost` int;