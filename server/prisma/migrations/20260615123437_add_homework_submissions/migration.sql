-- CreateTable
CREATE TABLE `homework_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `homeworkId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'submitted',
    `submissionText` TEXT NULL,
    `fileName` VARCHAR(191) NULL,
    `filePath` VARCHAR(191) NULL,
    `mimeType` VARCHAR(191) NULL,
    `fileSize` INTEGER NULL,
    `teacherFeedback` TEXT NULL,
    `marks` DOUBLE NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `homework_submissions_schoolId_idx`(`schoolId`),
    INDEX `homework_submissions_homeworkId_idx`(`homeworkId`),
    INDEX `homework_submissions_studentId_idx`(`studentId`),
    UNIQUE INDEX `homework_submissions_homeworkId_studentId_key`(`homeworkId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `homework_submissions` ADD CONSTRAINT `homework_submissions_homeworkId_fkey` FOREIGN KEY (`homeworkId`) REFERENCES `homework`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_submissions` ADD CONSTRAINT `homework_submissions_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
