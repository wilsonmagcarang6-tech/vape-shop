-- CreateTable
CREATE TABLE `admin` (
    `AdminID` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `admin_username_key`(`username`),
    PRIMARY KEY (`AdminID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product` (
    `ProductID` INTEGER NOT NULL AUTO_INCREMENT,
    `ProductName` VARCHAR(191) NOT NULL,
    `CostPrice` DECIMAL(10, 2) NOT NULL,
    `SellingPrice` DECIMAL(10, 2) NOT NULL,
    `Quantity` INTEGER NOT NULL,
    `ReorderPoint` INTEGER NOT NULL DEFAULT 5,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `PictureURL` VARCHAR(191) NULL,

    PRIMARY KEY (`ProductID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `billing` (
    `BillingID` INTEGER NOT NULL AUTO_INCREMENT,
    `CustomerName` VARCHAR(191) NULL,
    `TotalAmount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`BillingID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction` (
    `TransactionID` INTEGER NOT NULL AUTO_INCREMENT,
    `ProductID` INTEGER NOT NULL,
    `BillingID` INTEGER NOT NULL,
    `Qty` INTEGER NOT NULL,
    `CostPrice` DECIMAL(10, 2) NOT NULL,
    `SellingPrice` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `transaction_ProductID_idx`(`ProductID`),
    INDEX `transaction_BillingID_idx`(`BillingID`),
    PRIMARY KEY (`TransactionID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment` (
    `PaymentID` INTEGER NOT NULL AUTO_INCREMENT,
    `BillingID` INTEGER NOT NULL,
    `Amount` DECIMAL(10, 2) NOT NULL,
    `Method` ENUM('Cash', 'GCash') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payment_BillingID_idx`(`BillingID`),
    PRIMARY KEY (`PaymentID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transaction` ADD CONSTRAINT `transaction_ProductID_fkey` FOREIGN KEY (`ProductID`) REFERENCES `product`(`ProductID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction` ADD CONSTRAINT `transaction_BillingID_fkey` FOREIGN KEY (`BillingID`) REFERENCES `billing`(`BillingID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_BillingID_fkey` FOREIGN KEY (`BillingID`) REFERENCES `billing`(`BillingID`) ON DELETE RESTRICT ON UPDATE CASCADE;
