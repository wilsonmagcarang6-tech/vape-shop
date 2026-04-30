-- CreateTable
CREATE TABLE `SmsAlert` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ProductID` INTEGER NULL,
    `productName` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SmsSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phoneNumber` VARCHAR(191) NULL,
    `twilioSid` VARCHAR(191) NULL,
    `twilioToken` VARCHAR(191) NULL,
    `twilioPhone` VARCHAR(191) NULL,
    `alertsEnabled` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
