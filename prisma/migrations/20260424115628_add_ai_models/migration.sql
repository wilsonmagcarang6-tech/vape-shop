-- CreateTable
CREATE TABLE `AiInsight` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `severity` VARCHAR(191) NOT NULL DEFAULT 'info',
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isRead` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SalesForecast` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ProductID` INTEGER NULL,
    `forecastDate` DATETIME(3) NOT NULL,
    `predictedQty` DOUBLE NOT NULL,
    `actualQty` DOUBLE NULL,
    `confidence` DOUBLE NOT NULL DEFAULT 0.8,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SalesForecast_ProductID_idx`(`ProductID`),
    INDEX `SalesForecast_forecastDate_idx`(`forecastDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
