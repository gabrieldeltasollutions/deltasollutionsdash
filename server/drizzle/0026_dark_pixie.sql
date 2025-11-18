ALTER TABLE `project_materials` MODIFY COLUMN `approvalStatus` enum('pending','leader','manager','quotation','director','financial','purchased','received','rejected') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `project_materials` ADD `purchaseDate` timestamp;--> statement-breakpoint
ALTER TABLE `project_materials` ADD `expectedDeliveryDate` timestamp;--> statement-breakpoint
ALTER TABLE `project_materials` ADD `receivedDate` timestamp;--> statement-breakpoint
ALTER TABLE `project_materials` ADD `receivedBy` varchar(255);