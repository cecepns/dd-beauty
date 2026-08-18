-- Migration: Tambah Kolom shipping_fee (Ongkir / Biaya Transportasi)
-- DD Beauty Studio Management

USE `dd_beauty_db`;

-- Tambahkan kolom shipping_fee pada tabel bookings jika belum ada
ALTER TABLE `bookings`
ADD COLUMN IF NOT EXISTS `shipping_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `discount_amount`;
