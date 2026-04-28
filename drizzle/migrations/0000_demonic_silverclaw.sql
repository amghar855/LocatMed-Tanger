CREATE TABLE `appointments` (
	`id` varchar(191) NOT NULL,
	`patient_id` varchar(191) NOT NULL,
	`doctor_id` varchar(191) NOT NULL,
	`hospital_id` varchar(191) NOT NULL,
	`datetime` timestamp(3) NOT NULL,
	`status` enum('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`reason` text,
	`created_at` timestamp(3) NOT NULL,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hospitals` (
	`id` varchar(191) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('public','private','chu') NOT NULL,
	`lat` double NOT NULL,
	`lng` double NOT NULL,
	`address` text NOT NULL,
	`city` varchar(100) NOT NULL,
	`phone` varchar(50),
	`specialties` json,
	CONSTRAINT `hospitals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medical_records` (
	`id` varchar(191) NOT NULL,
	`patient_id` varchar(191) NOT NULL,
	`doctor_id` varchar(191) NOT NULL,
	`appointment_id` varchar(191),
	`date` timestamp(3) NOT NULL,
	`diagnosis` text NOT NULL,
	`notes` text NOT NULL,
	`prescription` json,
	`created_at` timestamp(3) NOT NULL,
	CONSTRAINT `medical_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicines` (
	`id` varchar(191) NOT NULL,
	`name` varchar(255) NOT NULL,
	`active_ingredient` varchar(255) NOT NULL,
	`dosage_form` varchar(255),
	`ppm` double,
	`is_generic` boolean DEFAULT false,
	CONSTRAINT `medicines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pharmacy_id` varchar(191) NOT NULL,
	`medicine_id` varchar(191) NOT NULL,
	`email` varchar(255),
	`phone_number` varchar(50),
	`status` enum('pending','sent') NOT NULL DEFAULT 'pending',
	`created_at` timestamp(3) NOT NULL,
	CONSTRAINT `notification_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient_favorite_hospitals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patient_id` varchar(191) NOT NULL,
	`hospital_id` varchar(191) NOT NULL,
	`created_at` timestamp(3) NOT NULL,
	CONSTRAINT `patient_favorite_hospitals_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorites_patient_hospital_unique` UNIQUE(`patient_id`,`hospital_id`)
);
--> statement-breakpoint
CREATE TABLE `pharmacies` (
	`id` varchar(191) NOT NULL,
	`name` varchar(255) NOT NULL,
	`lat` double NOT NULL,
	`lng` double NOT NULL,
	`address` text,
	`city` varchar(100) NOT NULL,
	`neighborhood` varchar(100),
	`is_on_duty` boolean NOT NULL DEFAULT false,
	`opening_hours` varchar(50),
	CONSTRAINT `pharmacies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pharmacy_stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pharmacy_id` varchar(191) NOT NULL,
	`medicine_id` varchar(191) NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`price` double NOT NULL,
	`min_threshold` int NOT NULL DEFAULT 5,
	`expiry_date` timestamp(3),
	`updated_at` timestamp(3) NOT NULL,
	CONSTRAINT `pharmacy_stock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pharmacy_id` varchar(191) NOT NULL,
	`medicine_id` varchar(191) NOT NULL,
	`user_id` varchar(191),
	`citizen_name` varchar(255) NOT NULL,
	`citizen_phone` varchar(50) NOT NULL,
	`status` enum('pending','confirmed','collected','cancelled') NOT NULL DEFAULT 'pending',
	`created_at` timestamp(3) NOT NULL,
	`updated_at` timestamp(3) NOT NULL,
	CONSTRAINT `reservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(191) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('patient','hospital_admin','doctor','pharmacist') NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`phone` varchar(50),
	`specialty` varchar(255),
	`hospital_id` varchar(191),
	`pharmacy_id` varchar(191),
	`created_by` varchar(191),
	`created_at` timestamp(3) NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_patient_id_users_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_hospital_id_hospitals_id_fk` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_patient_id_users_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_appointment_id_appointments_id_fk` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_requests` ADD CONSTRAINT `notification_requests_pharmacy_id_pharmacies_id_fk` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_requests` ADD CONSTRAINT `notification_requests_medicine_id_medicines_id_fk` FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patient_favorite_hospitals` ADD CONSTRAINT `patient_favorite_hospitals_patient_id_users_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patient_favorite_hospitals` ADD CONSTRAINT `patient_favorite_hospitals_hospital_id_hospitals_id_fk` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pharmacy_stock` ADD CONSTRAINT `pharmacy_stock_pharmacy_id_pharmacies_id_fk` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pharmacy_stock` ADD CONSTRAINT `pharmacy_stock_medicine_id_medicines_id_fk` FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_pharmacy_id_pharmacies_id_fk` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_medicine_id_medicines_id_fk` FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_hospital_id_hospitals_id_fk` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_pharmacy_id_pharmacies_id_fk` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;