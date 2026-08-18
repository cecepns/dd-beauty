-- Migration Script: Revisions for DD Beauty Studio Management
-- Applies column modifications and data cleanups for existing databases.

USE `dd_beauty_db`;

-- 1. Update status 'on_going' to 'booked' for existing booking records
UPDATE `bookings` 
SET `status` = 'booked' 
WHERE `status` = 'on_going';

-- 2. Modify `status` ENUM column in `bookings` to remove 'on_going'
ALTER TABLE `bookings` 
MODIFY COLUMN `status` ENUM('booked', 'completed', 'cancelled') DEFAULT 'booked';

-- 3. Update existing payment methods that are not 'qris' or 'cash' to 'qris'
UPDATE `bookings` 
SET `payment_method` = 'qris' 
WHERE `payment_method` NOT IN ('qris', 'cash');

-- 4. Modify `payment_method` ENUM column in `bookings` to only allow ('qris', 'cash')
ALTER TABLE `bookings` 
MODIFY COLUMN `payment_method` ENUM('qris', 'cash') DEFAULT 'qris';

-- 5. Add `shipping_fee` (ongkir / biaya transportasi) column to `bookings`
ALTER TABLE `bookings`
ADD COLUMN IF NOT EXISTS `shipping_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `discount_amount`;

