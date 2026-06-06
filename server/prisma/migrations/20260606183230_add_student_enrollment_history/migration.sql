/*
  Warnings:

  - You are about to drop the column `amount` on the `fee_structures` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `fee_structures` table. All the data in the column will be lost.
  - You are about to drop the column `frequency` on the `fee_structures` table. All the data in the column will be lost.
  - You are about to drop the column `isOptional` on the `fee_structures` table. All the data in the column will be lost.
  - You are about to drop the column `fatherOcc` on the `parents` table. All the data in the column will be lost.
  - You are about to drop the column `motherOcc` on the `parents` table. All the data in the column will be lost.
  - The values [accountant,receptionist] on the enum `users_role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `book_issues` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `books` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory_transactions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,schoolId]` on the table `academic_years` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,schoolId]` on the table `classes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[examId,studentId,subjectId]` on the table `results` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `school_settings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sectionId,academicYearId]` on the table `timetables` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `book_issues` DROP FOREIGN KEY `book_issues_bookId_fkey`;

-- DropForeignKey
ALTER TABLE `book_issues` DROP FOREIGN KEY `book_issues_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `fee_structures` DROP FOREIGN KEY `fee_structures_classId_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_transactions` DROP FOREIGN KEY `inventory_transactions_itemId_fkey`;

-- DropIndex
DROP INDEX `academic_years_name_key` ON `academic_years`;

-- DropIndex
DROP INDEX `classes_name_key` ON `classes`;

-- AlterTable
ALTER TABLE `academic_years` ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `admissions` ADD COLUMN `aadhaarNumber` VARCHAR(191) NULL,
    ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `fatherName` VARCHAR(191) NULL,
    ADD COLUMN `fatherPhone` VARCHAR(191) NULL,
    ADD COLUMN `motherName` VARCHAR(191) NULL,
    ADD COLUMN `motherPhone` VARCHAR(191) NULL,
    ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `attendance` ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `classes` ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `enquiries` ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `exams` ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `fileUrl` VARCHAR(191) NULL,
    ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `fee_payments` ADD COLUMN `academicYearId` VARCHAR(191) NULL,
    ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `fee_structures` DROP COLUMN `amount`,
    DROP COLUMN `category`,
    DROP COLUMN `frequency`,
    DROP COLUMN `isOptional`,
    ADD COLUMN `academicYearId` VARCHAR(191) NULL,
    ADD COLUMN `components` JSON NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `schoolId` VARCHAR(191) NULL,
    ADD COLUMN `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `classId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `homework` ADD COLUMN `fileUrl` VARCHAR(191) NULL,
    ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `notices` ADD COLUMN `fileUrl` VARCHAR(191) NULL,
    ADD COLUMN `schoolId` VARCHAR(191) NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'text';

-- AlterTable
ALTER TABLE `parents` DROP COLUMN `fatherOcc`,
    DROP COLUMN `motherOcc`,
    ADD COLUMN `fatherOccupation` VARCHAR(191) NULL,
    ADD COLUMN `motherOccupation` VARCHAR(191) NULL,
    ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `results` ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `school_settings` ADD COLUMN `enabledModules` JSON NULL,
    ADD COLUMN `licensePlan` VARCHAR(191) NULL DEFAULT 'enterprise',
    ADD COLUMN `licensedRoles` JSON NULL,
    ADD COLUMN `slug` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sections` ADD COLUMN `classTeacherId` VARCHAR(191) NULL,
    ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `staff` ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `students` ADD COLUMN `aadhaarNumber` VARCHAR(191) NULL,
    ADD COLUMN `house` VARCHAR(191) NULL,
    ADD COLUMN `medicalNote` TEXT NULL,
    ADD COLUMN `previousSchool` VARCHAR(191) NULL,
    ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `subjects` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isOptional` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `teachers` ADD COLUMN `canViewAllStudents` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `timetables` ADD COLUMN `fileUrl` VARCHAR(191) NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `schoolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `schoolId` VARCHAR(191) NULL,
    MODIFY `role` ENUM('super_admin', 'admin', 'principal', 'teacher', 'clerk', 'parent', 'student') NOT NULL;

-- DropTable
DROP TABLE `book_issues`;

-- DropTable
DROP TABLE `books`;

-- DropTable
DROP TABLE `inventory_items`;

-- DropTable
DROP TABLE `inventory_transactions`;

-- CreateTable
CREATE TABLE `student_enrollment_history` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,
    `rollNumber` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_enrollment_history_studentId_idx`(`studentId`),
    INDEX `student_enrollment_history_schoolId_idx`(`schoolId`),
    INDEX `student_enrollment_history_academicYearId_idx`(`academicYearId`),
    INDEX `student_enrollment_history_classId_sectionId_idx`(`classId`, `sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_fees` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `feeStructureId` VARCHAR(191) NOT NULL,
    `customAmount` DOUBLE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `academicYearId` VARCHAR(191) NULL,
    `schoolId` VARCHAR(191) NULL,

    INDEX `student_fees_feeStructureId_fkey`(`feeStructureId`),
    INDEX `student_fees_schoolId_fkey`(`schoolId`),
    UNIQUE INDEX `student_fees_studentId_feeStructureId_academicYearId_key`(`studentId`, `feeStructureId`, `academicYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `archives` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `entityName` VARCHAR(191) NULL,
    `data` JSON NOT NULL,
    `deletedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admission_fees` (
    `id` VARCHAR(191) NOT NULL,
    `admissionId` VARCHAR(191) NOT NULL,
    `feeStructureId` VARCHAR(191) NOT NULL,
    `customAmount` DOUBLE NULL,

    INDEX `admission_fees_feeStructureId_fkey`(`feeStructureId`),
    UNIQUE INDEX `admission_fees_admissionId_feeStructureId_key`(`admissionId`, `feeStructureId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_requests` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `reason` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `remarks` VARCHAR(191) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `schoolId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `leave_requests_schoolId_fkey`(`schoolId`),
    INDEX `leave_requests_studentId_fkey`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `performedBy` VARCHAR(191) NULL,
    `schoolId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_schoolId_fkey`(`schoolId`),
    INDEX `activity_logs_studentId_fkey`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicles` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleNumber` VARCHAR(191) NOT NULL,
    `vehicleModel` VARCHAR(191) NOT NULL,
    `driverName` VARCHAR(191) NOT NULL,
    `driverPhone` VARCHAR(191) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `schoolId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vehicles_vehicleNumber_key`(`vehicleNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transport_routes` (
    `id` VARCHAR(191) NOT NULL,
    `routeName` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NULL,
    `stops` JSON NULL,
    `description` TEXT NULL,
    `schoolId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_tickets` (
    `id` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'open',
    `userId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ClassToTeacher` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ClassToTeacher_AB_unique`(`A`, `B`),
    INDEX `_ClassToTeacher_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `academic_years_schoolId_fkey` ON `academic_years`(`schoolId`);

-- CreateIndex
CREATE UNIQUE INDEX `academic_years_name_schoolId_key` ON `academic_years`(`name`, `schoolId`);

-- CreateIndex
CREATE INDEX `admissions_schoolId_fkey` ON `admissions`(`schoolId`);

-- CreateIndex
CREATE INDEX `attendance_schoolId_fkey` ON `attendance`(`schoolId`);

-- CreateIndex
CREATE INDEX `classes_schoolId_fkey` ON `classes`(`schoolId`);

-- CreateIndex
CREATE UNIQUE INDEX `classes_name_schoolId_key` ON `classes`(`name`, `schoolId`);

-- CreateIndex
CREATE INDEX `enquiries_schoolId_fkey` ON `enquiries`(`schoolId`);

-- CreateIndex
CREATE INDEX `exams_schoolId_fkey` ON `exams`(`schoolId`);

-- CreateIndex
CREATE INDEX `fee_payments_schoolId_fkey` ON `fee_payments`(`schoolId`);

-- CreateIndex
CREATE INDEX `fee_structures_academicYearId_fkey` ON `fee_structures`(`academicYearId`);

-- CreateIndex
CREATE INDEX `fee_structures_schoolId_fkey` ON `fee_structures`(`schoolId`);

-- CreateIndex
CREATE INDEX `homework_schoolId_fkey` ON `homework`(`schoolId`);

-- CreateIndex
CREATE INDEX `notices_schoolId_fkey` ON `notices`(`schoolId`);

-- CreateIndex
CREATE INDEX `parents_schoolId_fkey` ON `parents`(`schoolId`);

-- CreateIndex
CREATE INDEX `results_schoolId_fkey` ON `results`(`schoolId`);

-- CreateIndex
CREATE UNIQUE INDEX `results_examId_studentId_subjectId_key` ON `results`(`examId`, `studentId`, `subjectId`);

-- CreateIndex
CREATE UNIQUE INDEX `school_settings_slug_key` ON `school_settings`(`slug`);

-- CreateIndex
CREATE INDEX `sections_classTeacherId_fkey` ON `sections`(`classTeacherId`);

-- CreateIndex
CREATE INDEX `sections_schoolId_fkey` ON `sections`(`schoolId`);

-- CreateIndex
CREATE INDEX `staff_schoolId_fkey` ON `staff`(`schoolId`);

-- CreateIndex
CREATE INDEX `students_schoolId_fkey` ON `students`(`schoolId`);

-- CreateIndex
CREATE INDEX `subjects_schoolId_fkey` ON `subjects`(`schoolId`);

-- CreateIndex
CREATE INDEX `teachers_schoolId_fkey` ON `teachers`(`schoolId`);

-- CreateIndex
CREATE INDEX `timetables_schoolId_fkey` ON `timetables`(`schoolId`);

-- CreateIndex
CREATE UNIQUE INDEX `timetables_sectionId_academicYearId_key` ON `timetables`(`sectionId`, `academicYearId`);

-- CreateIndex
CREATE INDEX `users_schoolId_fkey` ON `users`(`schoolId`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_years` ADD CONSTRAINT `academic_years_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_classTeacherId_fkey` FOREIGN KEY (`classTeacherId`) REFERENCES `teachers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_enrollment_history` ADD CONSTRAINT `student_enrollment_history_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_enrollment_history` ADD CONSTRAINT `student_enrollment_history_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_enrollment_history` ADD CONSTRAINT `student_enrollment_history_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_enrollment_history` ADD CONSTRAINT `student_enrollment_history_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_enrollment_history` ADD CONSTRAINT `student_enrollment_history_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parents` ADD CONSTRAINT `parents_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teachers` ADD CONSTRAINT `teachers_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `results` ADD CONSTRAINT `results_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_fees` ADD CONSTRAINT `student_fees_feeStructureId_fkey` FOREIGN KEY (`feeStructureId`) REFERENCES `fee_structures`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_fees` ADD CONSTRAINT `student_fees_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_fees` ADD CONSTRAINT `student_fees_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_payments` ADD CONSTRAINT `fee_payments_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notices` ADD CONSTRAINT `notices_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admissions` ADD CONSTRAINT `admissions_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admission_fees` ADD CONSTRAINT `admission_fees_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `admissions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admission_fees` ADD CONSTRAINT `admission_fees_feeStructureId_fkey` FOREIGN KEY (`feeStructureId`) REFERENCES `fee_structures`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetables` ADD CONSTRAINT `timetables_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework` ADD CONSTRAINT `homework_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_routes` ADD CONSTRAINT `transport_routes_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_routes` ADD CONSTRAINT `transport_routes_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ClassToTeacher` ADD CONSTRAINT `_ClassToTeacher_A_fkey` FOREIGN KEY (`A`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ClassToTeacher` ADD CONSTRAINT `_ClassToTeacher_B_fkey` FOREIGN KEY (`B`) REFERENCES `teachers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
