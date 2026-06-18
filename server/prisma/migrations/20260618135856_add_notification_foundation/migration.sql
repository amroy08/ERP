-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `recipientUserId` VARCHAR(191) NOT NULL,
    `recipientRole` ENUM('super_admin', 'admin', 'principal', 'teacher', 'clerk', 'parent', 'student') NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `type` ENUM('HOMEWORK_POSTED', 'EXAM_POSTED', 'MARKS_POSTED', 'NOTICE_POSTED', 'FEES_OVERDUE', 'FEES_REMINDER', 'ATTENDANCE_ABSENCE_ALERT') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `relatedEntityType` VARCHAR(191) NULL,
    `relatedEntityId` VARCHAR(191) NULL,
    `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    INDEX `notifications_schoolId_idx`(`schoolId`),
    INDEX `notifications_recipientUserId_idx`(`recipientUserId`),
    INDEX `notifications_studentId_idx`(`studentId`),
    INDEX `notifications_isRead_idx`(`isRead`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_delivery_logs` (
    `id` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NOT NULL,
    `channel` ENUM('EMAIL', 'PUSH', 'IN_APP') NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED') NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `errorMessage` TEXT NULL,

    INDEX `notification_delivery_logs_notificationId_idx`(`notificationId`),
    INDEX `notification_delivery_logs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_rules` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `type` ENUM('HOMEWORK_POSTED', 'EXAM_POSTED', 'MARKS_POSTED', 'NOTICE_POSTED', 'FEES_OVERDUE', 'FEES_REMINDER', 'ATTENDANCE_ABSENCE_ALERT') NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `cooldownHours` INTEGER NOT NULL DEFAULT 0,
    `thresholdCount` INTEGER NULL,
    `thresholdDays` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `notification_rules_schoolId_type_key`(`schoolId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipientUserId_fkey` FOREIGN KEY (`recipientUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_delivery_logs` ADD CONSTRAINT `notification_delivery_logs_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `notifications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_rules` ADD CONSTRAINT `notification_rules_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
