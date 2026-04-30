-- AlterTable
ALTER TABLE `billing` ADD COLUMN `AdminID` INTEGER NULL,
    ADD COLUMN `CashierID` INTEGER NULL;

-- CreateIndex
CREATE INDEX `billing_CashierID_idx` ON `billing`(`CashierID`);

-- CreateIndex
CREATE INDEX `billing_AdminID_idx` ON `billing`(`AdminID`);

-- AddForeignKey
ALTER TABLE `billing` ADD CONSTRAINT `billing_CashierID_fkey` FOREIGN KEY (`CashierID`) REFERENCES `cashier`(`CashierID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billing` ADD CONSTRAINT `billing_AdminID_fkey` FOREIGN KEY (`AdminID`) REFERENCES `admin`(`AdminID`) ON DELETE SET NULL ON UPDATE CASCADE;
