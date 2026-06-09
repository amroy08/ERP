/*
  Warnings:

  - A unique constraint covering the columns `[sourceAdmissionId]` on the table `students` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `students` ADD COLUMN `birthCertificateDoc` VARCHAR(191) NULL,
    ADD COLUMN `parentAadhaarDoc` VARCHAR(191) NULL,
    ADD COLUMN `previousMarksCardDoc` VARCHAR(191) NULL,
    ADD COLUMN `sourceAdmissionId` VARCHAR(191) NULL,
    ADD COLUMN `studentAadhaarDoc` VARCHAR(191) NULL,
    ADD COLUMN `studentPhoto` VARCHAR(191) NULL,
    ADD COLUMN `transferCertificateDoc` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `students_sourceAdmissionId_key` ON `students`(`sourceAdmissionId`);

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_sourceAdmissionId_fkey` FOREIGN KEY (`sourceAdmissionId`) REFERENCES `admissions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
