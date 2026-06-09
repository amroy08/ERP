-- CreateTable
CREATE TABLE `subject_teachers` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `subject_teachers_schoolId_idx`(`schoolId`),
    INDEX `subject_teachers_subjectId_idx`(`subjectId`),
    INDEX `subject_teachers_sectionId_idx`(`sectionId`),
    INDEX `subject_teachers_teacherId_idx`(`teacherId`),
    UNIQUE INDEX `subject_teachers_schoolId_academicYearId_subjectId_sectionId_key`(`schoolId`, `academicYearId`, `subjectId`, `sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `subject_teachers` ADD CONSTRAINT `subject_teachers_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_teachers` ADD CONSTRAINT `subject_teachers_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_teachers` ADD CONSTRAINT `subject_teachers_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_teachers` ADD CONSTRAINT `subject_teachers_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_teachers` ADD CONSTRAINT `subject_teachers_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
