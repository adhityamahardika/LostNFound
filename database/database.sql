-- =============================================================================
-- LostNFound - Database Schema (MVC)
-- Tahap 3: Auth + Laporan (Hilang & Temuan)
--
-- Cara pakai:
--   1. Buka phpMyAdmin -> Import -> pilih file ini, atau
--   2. Jalankan: mysql -u root < database/database.sql
--
-- PERINGATAN: script ini menghapus tabel `laporan` dan `users` lalu
-- membuatnya ulang (fresh install). Data lama akan hilang.
--
-- Database: lostnfound_db
-- Akun admin awal: admin / admin123
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `lostnfound_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `lostnfound_db`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `laporan`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- Tabel: users
-- -----------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `nama` VARCHAR(100) NOT NULL,
  `nim` VARCHAR(30) DEFAULT NULL,
  `email` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('member', 'admin') NOT NULL DEFAULT 'member',
  `status` ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password: admin123 (bcrypt)
INSERT INTO `users`
  (`id`, `username`, `nama`, `nim`, `email`, `phone`, `password_hash`, `role`, `status`)
VALUES
  (
    1,
    'admin',
    'Admin LostnFound',
    NULL,
    'admin@kampus.ac.id',
    NULL,
    '$2y$12$uxndk4orGPoTg8PRQwpujOC.bWyUDT3GG21QaAGKVtMHTvRiYJ8ia',
    'admin',
    'aktif'
  );

-- -----------------------------------------------------------------------------
-- Tabel: laporan (Hilang & Temuan dalam satu tabel, dibedakan `tipe`)
-- -----------------------------------------------------------------------------
CREATE TABLE `laporan` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tipe` ENUM('Hilang', 'Ditemukan') NOT NULL,
  `nama_barang` VARCHAR(100) NOT NULL,
  `jenis_barang` VARCHAR(50) NOT NULL,
  `tanggal` DATE NOT NULL,
  `lokasi` VARCHAR(150) NOT NULL,
  `penitipan` VARCHAR(100) DEFAULT NULL,
  `deskripsi` TEXT NOT NULL,
  `ciri_rahasia` TEXT DEFAULT NULL,
  `foto` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('Hilang', 'Ditemukan', 'Diklaim', 'Dikembalikan') NOT NULL,
  `pelapor_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_laporan_status` (`status`),
  KEY `idx_laporan_tanggal` (`tanggal`),
  KEY `idx_laporan_jenis` (`jenis_barang`),
  CONSTRAINT `fk_laporan_pelapor`
    FOREIGN KEY (`pelapor_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data contoh (foto memakai aset statis di assets/items/).
INSERT INTO `laporan`
  (`id`, `tipe`, `nama_barang`, `jenis_barang`, `tanggal`, `lokasi`, `penitipan`,
   `deskripsi`, `ciri_rahasia`, `foto`, `status`, `pelapor_id`)
VALUES
  (1, 'Hilang', 'Dompet kulit', 'Aksesoris', '2026-09-27', 'Kantin Utama', NULL,
   'Dompet kulit cokelat dengan kancing. Ciri lain sengaja tidak ditampilkan untuk verifikasi pemilik.',
   'Ada uang tunai dan kartu member di kantong dalam', 'items/dompet.jpg', 'Hilang', 1),

  (2, 'Ditemukan', 'Kunci motor', 'Kendaraan', '2026-09-28', 'Gedung B', 'Tata Usaha',
   'Kunci dengan gantungan karakter. Ciri lain sengaja tidak ditampilkan untuk verifikasi pemilik.',
   'Gantungan kunci bertuliskan Honda dengan pita merah', 'items/kunci.jpg', 'Ditemukan', 1),

  (3, 'Ditemukan', 'Kartu Mahasiswa', 'Dokumen', '2026-09-28', 'Perpustakaan', 'Pos Satpam Depan',
   'Kartu mahasiswa atas nama Made Wirawan. Hubungi untuk verifikasi lebih lanjut.',
   'NIM berakhiran 106', 'items/ktm.jpg', 'Ditemukan', 1),

  (4, 'Hilang', 'Botol minum hijau', 'Aksesoris', '2026-09-26', 'Lab Komputer', NULL,
   'Botol minum warna hijau dengan stiker. Detail lain tidak ditampilkan untuk verifikasi.',
   'Stiker Linux di bagian tutup botol', 'items/tumbler.jpg', 'Hilang', 1),

  (5, 'Ditemukan', 'Tas ransel hitam', 'Tas', '2026-09-25', 'Parkiran Timur', 'Pos Satpam Depan',
   'Tas ransel hitam ukuran sedang. Ciri khusus disembunyikan untuk keperluan klaim.',
   'Di kantong depan ada buku catatan bersampul biru', 'items/tas.jpg', 'Ditemukan', 1),

  (6, 'Hilang', 'Charger Laptop', 'Elektronik', '2026-09-24', 'Aula', NULL,
   'Charger laptop HP original. Barang sudah dikembalikan ke pemiliknya.',
   'Ada selotip hitam di ujung kabel adaptor', 'items/charger.jpg', 'Dikembalikan', 1);
