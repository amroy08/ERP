-- CreateTable
CREATE TABLE `fee_payment_allocations` (
    `id` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `studentFeeId` VARCHAR(191) NOT NULL,
    `componentName` VARCHAR(191) NOT NULL,
    `allocatedAmount` DOUBLE NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fee_payment_allocations_paymentId_idx`(`paymentId`),
    INDEX `fee_payment_allocations_studentFeeId_idx`(`studentFeeId`),
    INDEX `fee_payment_allocations_studentId_idx`(`studentId`),
    INDEX `fee_payment_allocations_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `fee_payment_allocations` ADD CONSTRAINT `fee_payment_allocations_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `fee_payments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_payment_allocations` ADD CONSTRAINT `fee_payment_allocations_studentFeeId_fkey` FOREIGN KEY (`studentFeeId`) REFERENCES `student_fees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_payment_allocations` ADD CONSTRAINT `fee_payment_allocations_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_payment_allocations` ADD CONSTRAINT `fee_payment_allocations_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school_settings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
