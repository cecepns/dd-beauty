-- Database schema for DD Beauty Serve (DD Beauty Studio Management)
-- Designed for MySQL 8.0+ / MariaDB

CREATE DATABASE IF NOT EXISTS `dd_beauty_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dd_beauty_db`;

-- 1. Tabel Users / Admins / Staff
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'owner', 'beautician', 'cashier') DEFAULT 'admin',
  `phone` VARCHAR(20) NULL,
  `avatar` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel Customers
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_code` VARCHAR(20) UNIQUE NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(25) NOT NULL,
  `email` VARCHAR(100) NULL,
  `gender` ENUM('female', 'male', 'other') DEFAULT 'female',
  `birth_date` DATE NULL,
  `address` TEXT NULL,
  `member_status` ENUM('regular', 'vip', 'vvip') DEFAULT 'regular',
  `total_visits` INT DEFAULT 0,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Medical Records / Catatan Kulit & Riwayat Perawatan
CREATE TABLE IF NOT EXISTS `medical_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `skin_type` VARCHAR(50) NULL COMMENT 'Normal, Kering, Berminyak, Kombinasi, Sensitif, Berjerawat',
  `allergies` TEXT NULL COMMENT 'Riwayat alergi obat, bahan aktif kosmetik, atau makanan',
  `skin_concerns` TEXT NULL COMMENT 'Keluhan utama: Flek hitam, Acne, Penuaan dini, Kusam, Pori-pori besar, dsb',
  `contraindications` TEXT NULL COMMENT 'Kondisi khusus: Hamil, Menyusui, Penggunaan Retinoid/Roaccutane, dsb',
  `treatment_history_notes` TEXT NULL COMMENT 'Riwayat treatment sebelumnya di klinik lain',
  `beautician_notes` TEXT NULL COMMENT 'Catatan khusus dari terapis/beautician',
  `photo_before` VARCHAR(255) NULL,
  `photo_after` VARCHAR(255) NULL,
  `record_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Kategori Treatment
CREATE TABLE IF NOT EXISTS `treatment_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(50) DEFAULT 'Sparkles',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabel Treatments / Layanan Studio
CREATE TABLE IF NOT EXISTS `treatments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NULL,
  `name` VARCHAR(150) NOT NULL,
  `duration_minutes` INT DEFAULT 60,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `description` TEXT NULL,
  `image` VARCHAR(255) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `treatment_categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabel Bookings / Transaksi Layanan
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_number` VARCHAR(30) UNIQUE NOT NULL,
  `customer_id` INT NOT NULL,
  `booking_date` DATE NOT NULL,
  `booking_time` TIME NOT NULL,
  `status` ENUM('booked', 'completed', 'cancelled') DEFAULT 'booked',
  `beautician_name` VARCHAR(100) NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `discount_type` ENUM('nominal', 'percentage') DEFAULT 'nominal',
  `discount_value` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `shipping_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `dp_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `remaining_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('unpaid', 'dp', 'paid') DEFAULT 'unpaid',
  `payment_method` ENUM('qris', 'cash') DEFAULT 'qris',
  `customer_notes` TEXT NULL,
  `internal_notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabel Detail Item Booking / Treatment Terpilih
CREATE TABLE IF NOT EXISTS `booking_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL,
  `treatment_id` INT NULL,
  `treatment_name` VARCHAR(150) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`treatment_id`) REFERENCES `treatments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabel Expenses / Pengeluaran Bulanan
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `expense_number` VARCHAR(30) UNIQUE NOT NULL,
  `category` ENUM('product_supply', 'staff_salary', 'rent', 'utilities', 'marketing', 'operational', 'other') NOT NULL DEFAULT 'operational',
  `title` VARCHAR(150) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `expense_date` DATE NOT NULL,
  `payment_method` ENUM('cash', 'transfer', 'card') DEFAULT 'transfer',
  `receipt_photo` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `created_by` VARCHAR(100) DEFAULT 'Admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Tabel Studio Settings
CREATE TABLE IF NOT EXISTS `studio_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `studio_name` VARCHAR(100) DEFAULT 'DD Beauty Serve',
  `tagline` VARCHAR(150) DEFAULT 'Luxury Beauty & Skin Care Studio',
  `phone` VARCHAR(25) DEFAULT '0812-3456-7890',
  `email` VARCHAR(100) DEFAULT 'info@ddbeautyserve.com',
  `address` TEXT DEFAULT 'Jl. Kemang Raya No. 45, Jakarta Selatan',
  `instagram` VARCHAR(50) DEFAULT '@ddbeauty.serve',
  `receipt_footer` TEXT DEFAULT 'Terima kasih atas kunjungan Anda di DD Beauty Serve! Sampai jumpa di perawatan berikutnya.',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SAMPLE INITIAL DATA
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`) VALUES
(1, 'DD Beauty Admin', 'admin@ddbeauty.com', 'admin123', 'owner', '081234567890');

INSERT INTO `studio_settings` (`id`, `studio_name`, `tagline`, `phone`, `email`, `address`, `instagram`, `receipt_footer`) VALUES
(1, 'DD Beauty Serve', 'Studio Perawatan & Kecantikan Eksklusif', '0812-8899-7722', 'care@ddbeautyserve.com', 'Ruko Emerald Boulevard Blok B3, Jakarta Selatan', '@ddbeauty.serve', 'Terima kasih telah mempercayakan kecantikan Anda bersama DD Beauty Serve.');

INSERT INTO `treatment_categories` (`id`, `name`, `description`, `icon`) VALUES
(1, 'Facial & Skin Therapy', 'Perawatan wajah mendalam, pencerahan, anti-aging, dan acne treatment', 'Sparkles'),
(2, 'Eyelash & Brow Art', 'Sambung bulu mata premium, lash lift, dan sulam/perapihan alis', 'Eye'),
(3, 'Nail Art & Spa', 'Manicure, pedicure, gel polish, dan nail art estetik', 'Hand'),
(4, 'Body Slimming & Spa', 'Relaksasi tubuh, massage aromaterapi, dan treatment slimming', 'HeartHandshake'),
(5, 'Hair & Scalp Care', 'Hair spa, creambath revitalisasi, dan perawatan kulit kepala', 'Scissors');

INSERT INTO `treatments` (`id`, `category_id`, `name`, `duration_minutes`, `price`, `description`, `is_active`) VALUES
(1, 1, 'Hydra Glow Deep Cleansing Facial', 75, 350000.00, 'Facial eksfoliasi mendalam dengan serum hidrasi pekat untuk hasil glowing instan.', 1),
(2, 1, 'Acne Clear Bio-Light Therapy', 60, 299000.00, 'Terapi sinar LED antibakteri & ekstraksi komedo untuk meredakan radang jerawat.', 1),
(3, 1, 'Korean Glass Skin Rejuvenation', 90, 480000.00, 'Perawatan premium collagen booster membuat kulit halus berkilau ala Korea.', 1),
(4, 2, 'Premium Russian Volume Eyelash', 120, 280000.00, 'Eyelash extension lebat bervolume namun tetap ringan dan natural di mata.', 1),
(5, 2, 'Keratin Lash Lift & Tint', 60, 195000.00, 'Melentikkan bulu mata asli dan memberikan tint hitam tahan hingga 8 minggu.', 1),
(6, 3, 'Luxury Gel Manicure + Free Nail Art 2 Jari', 75, 175000.00, 'Perawatan kuku tangan lengkap dengan kutek gel tahan gores dan desain estetik.', 1),
(7, 3, 'Aroma Foot Pedicure & Callus Removal', 60, 160000.00, 'Pembersihan tumit kapalan, rendaman garam spa, scrub, dan pijat relaksasi.', 1),
(8, 4, 'Full Body Aromatherapy Massage', 90, 250000.00, 'Pijat relaksasi seluruh tubuh dengan essential oil murni melepas lelah.', 1),
(9, 4, 'Body Contour Radio Frequency Slimming', 60, 390000.00, 'Treatment pengencangan dan pembakaran lemak area perut/lengan.', 1);

INSERT INTO `customers` (`id`, `customer_code`, `name`, `phone`, `email`, `gender`, `birth_date`, `address`, `member_status`, `total_visits`, `notes`) VALUES
(1, 'CUST-001', 'Clarissa Amanda', '081298765432', 'clarissa.amanda@email.com', 'female', '1996-04-12', 'Apartemen Sudirman Tower A No 12B', 'vip', 5, 'Suka aroma lavender saat massage'),
(2, 'CUST-002', 'Jessica Olivia', '081387654321', 'jessica.olivia@email.com', 'female', '1998-09-24', 'Jl. Tebet Barat Dalam No. 18', 'regular', 2, 'Kulit sensitif terhadap scrub kasar'),
(3, 'CUST-003', 'Nadia Putri Pratama', '081901234567', 'nadia.putri@email.com', 'female', '2000-01-15', 'Pondok Indah Plaza III Blok A-2', 'vvip', 10, 'Member VVIP loyal sejak 2024'),
(4, 'CUST-004', 'dr. Sherly Wijaya', '085712349876', 'sherly.wijaya@email.com', 'female', '1992-11-05', 'Kebayoran Baru, Jakarta Selatan', 'vip', 4, 'Booking rutin setiap 2 minggu sekali');

INSERT INTO `medical_records` (`id`, `customer_id`, `skin_type`, `allergies`, `skin_concerns`, `contraindications`, `treatment_history_notes`, `beautician_notes`, `record_date`) VALUES
(1, 1, 'Kombinasi', 'Alergi parfum sintetik pekat', 'Flek tipis di area pipi kanan, komedo T-zone', 'Tidak ada', 'Pernah laser di klinik estetik tahun lalu', 'Gunakan calming serum setelah ekstraksi', '2026-08-01'),
(2, 2, 'Sensitif & Kering', 'Alergi alkohol berkadar tinggi', 'Kemerahan dan kulit mudah mengelupas', 'Sedang hamil trimester pertama', 'Facial hidrasi ringan', 'Hindari alat frekuensi tinggi / RF', '2026-08-10'),
(3, 3, 'Berminyak & Acne-prone', 'Tidak ada riwayat alergi', 'Bekas jerawat PIH dan pori-pori besar', 'Tidak ada', 'Rutin chemical peeling ringan', 'Cocok dengan Bio-light biru dan masker tea tree', '2026-08-14');

INSERT INTO `bookings` (`id`, `invoice_number`, `customer_id`, `booking_date`, `booking_time`, `status`, `beautician_name`, `subtotal`, `discount_type`, `discount_value`, `discount_amount`, `grand_total`, `dp_amount`, `paid_amount`, `remaining_amount`, `payment_status`, `payment_method`, `customer_notes`) VALUES
(1, 'INV-20260815-001', 1, '2026-08-15', '14:00:00', 'completed', 'Maya Sari', 350000.00, 'nominal', 50000.00, 50000.00, 300000.00, 100000.00, 300000.00, 0.00, 'paid', 'qris', 'Ingin terapis Maya'),
(2, 'INV-20260817-002', 3, '2026-08-17', '11:00:00', 'booked', 'Rina Agustina', 475000.00, 'percentage', 10.00, 47500.00, 427500.00, 150000.00, 150000.00, 277500.00, 'dp', 'qris', 'Diskon member VVIP 10%'),
(3, 'INV-20260818-003', 2, '2026-08-18', '16:30:00', 'booked', 'Siti Rahma', 280000.00, 'nominal', 0.00, 0.00, 280000.00, 100000.00, 100000.00, 180000.00, 'dp', 'cash', 'Booking eyelash sore hari'),
(4, 'INV-20260819-004', 4, '2026-08-19', '10:00:00', 'booked', 'Maya Sari', 640000.00, 'nominal', 40000.00, 40000.00, 600000.00, 200000.00, 200000.00, 400000.00, 'dp', 'qris', 'Paket Glass Skin + Lash Lift');

INSERT INTO `booking_items` (`id`, `booking_id`, `treatment_id`, `treatment_name`, `quantity`, `unit_price`, `subtotal`) VALUES
(1, 1, 1, 'Hydra Glow Deep Cleansing Facial', 1, 350000.00, 350000.00),
(2, 2, 2, 'Acne Clear Bio-Light Therapy', 1, 299000.00, 299000.00),
(3, 2, 6, 'Luxury Gel Manicure + Free Nail Art 2 Jari', 1, 176000.00, 176000.00),
(4, 3, 4, 'Premium Russian Volume Eyelash', 1, 280000.00, 280000.00),
(5, 4, 3, 'Korean Glass Skin Rejuvenation', 1, 480000.00, 480000.00),
(6, 4, 5, 'Keratin Lash Lift & Tint', 1, 160000.00, 160000.00);

INSERT INTO `expenses` (`id`, `expense_number`, `category`, `title`, `amount`, `expense_date`, `payment_method`, `notes`) VALUES
(1, 'EXP-20260801-001', 'rent', 'Sewa Ruko Studio Bulan Agustus 2026', 4500000.00, '2026-08-01', 'transfer', 'Pembayaran sewa bulanan'),
(2, 'EXP-20260803-002', 'product_supply', 'Restock Serum Hyaluronic & Masker Sheet Korea', 1850000.00, '2026-08-03', 'transfer', 'Supplier Beauty Pro Indo'),
(3, 'EXP-20260805-003', 'product_supply', 'Bulu Mata Mink Premium & Lem Lash Jepang', 920000.00, '2026-08-05', 'transfer', 'Restock Eyelash Supply'),
(4, 'EXP-20260808-004', 'utilities', 'Listrik PLN & Tagihan Air PDAM Studio', 680000.00, '2026-08-08', 'transfer', 'Tagihan rutin bulanan'),
(5, 'EXP-20260810-005', 'marketing', 'Instagram Ads Promo Kemerdekaan Beauty', 500000.00, '2026-08-10', 'transfer', 'Iklan targeted Jakarta Selatan 5 hari');
