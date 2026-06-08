-- CreateTable
CREATE TABLE `email_notification_logs` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NULL,
    `recipientEmail` VARCHAR(191) NOT NULL,
    `recipientUserId` VARCHAR(191) NULL,
    `recipientRole` VARCHAR(191) NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `errorMessage` TEXT NULL,
    `sentAt` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `email_notification_logs_schoolId_idx`(`schoolId`),
    INDEX `email_notification_logs_eventType_idx`(`eventType`),
    INDEX `email_notification_logs_status_idx`(`status`),
    INDEX `email_notification_logs_recipientEmail_idx`(`recipientEmail`),
    INDEX `email_notification_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `email_notification_logs` ADD CONSTRAINT `email_notification_logs_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
