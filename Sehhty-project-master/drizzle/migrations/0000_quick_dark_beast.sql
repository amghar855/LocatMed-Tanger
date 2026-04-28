CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`doctor_id` text NOT NULL,
	`hospital_id` text NOT NULL,
	`datetime` integer NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hospitals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`phone` text,
	`specialties` text
);
--> statement-breakpoint
CREATE TABLE `medical_records` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`doctor_id` text NOT NULL,
	`appointment_id` text,
	`date` integer NOT NULL,
	`diagnosis` text NOT NULL,
	`notes` text NOT NULL,
	`prescription` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `medicines` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`active_ingredient` text NOT NULL,
	`dosage_form` text,
	`ppm` real,
	`is_generic` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `notification_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pharmacy_id` text NOT NULL,
	`medicine_id` text NOT NULL,
	`email` text,
	`phone_number` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `patient_favorite_hospitals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` text NOT NULL,
	`hospital_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `favorites_patient_hospital_unique` ON `patient_favorite_hospitals` (`patient_id`,`hospital_id`);--> statement-breakpoint
CREATE TABLE `pharmacies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`address` text,
	`city` text NOT NULL,
	`neighborhood` text,
	`is_on_duty` integer DEFAULT false NOT NULL,
	`opening_hours` text
);
--> statement-breakpoint
CREATE TABLE `pharmacy_stock` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pharmacy_id` text NOT NULL,
	`medicine_id` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`price` real NOT NULL,
	`min_threshold` integer DEFAULT 5 NOT NULL,
	`expiry_date` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pharmacy_id` text NOT NULL,
	`medicine_id` text NOT NULL,
	`user_id` text,
	`citizen_name` text NOT NULL,
	`citizen_phone` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`full_name` text NOT NULL,
	`phone` text,
	`specialty` text,
	`hospital_id` text,
	`pharmacy_id` text,
	`created_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);