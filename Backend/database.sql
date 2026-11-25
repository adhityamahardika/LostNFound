-- Database: lostnfound_db
-- Dibuat untuk Sistem Pelaporan Barang Hilang & Temuan (LostnFound)

CREATE DATABASE IF NOT EXISTS `lostnfound_db` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `lostnfound_db`;

-- Tabel: users
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nim` VARCHAR(30) DEFAULT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `initials` VARCHAR(5) NOT NULL DEFAULT 'US',
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'Mahasiswa',
    `access_role` ENUM('user', 'petugas', 'admin') NOT NULL DEFAULT 'user',
    `prodi` VARCHAR(100) DEFAULT 'Teknologi Informasi',
    `fakultas` VARCHAR(100) DEFAULT 'Teknik',
    `phone` VARCHAR(30) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data Awal Pengguna (Password demo: admin123 / password123 / petugas123)
INSERT IGNORE INTO `users` (`id`, `nim`, `name`, `initials`, `email`, `password_hash`, `role`, `access_role`, `prodi`, `fakultas`, `phone`) VALUES
(1, 'admin', 'Admin LostnFound', 'AD', 'admin@kampus.ac.id', '$2y$10$Iecx0e0bxazYuWh6NFFV..ttRsPxbKm73c63Bwu/uQgiPZPkezRTa', 'Administrator', 'admin', '-', '-', '-'),
(2, '2408561089', 'Made Wirawan', 'MW', '2408561089@student.kampus.ac.id', '$2y$10$O3mqyKrkIzSxgHttPiQ26eVLU.tbfNgCppp43/64LCYPDWVGBvvl6', 'Mahasiswa', 'user', 'Informatika', 'MIPA', '0812-3456-7890'),
(3, '2505551106', 'Detuy Mahardika', 'DM', 'deta@student.kampus.ac.id', '$2y$10$O3mqyKrkIzSxgHttPiQ26eVLU.tbfNgCppp43/64LCYPDWVGBvvl6', 'Mahasiswa', 'user', 'Teknologi Informasi', 'Teknik', '0812-3456-7890'),
(4, '2408561012', 'Rizky', 'RZ', 'rizky@student.kampus.ac.id', '$2y$10$O3mqyKrkIzSxgHttPiQ26eVLU.tbfNgCppp43/64LCYPDWVGBvvl6', 'Mahasiswa', 'user', 'Teknik Elektro', 'Teknik', '0813-2222-3333'),
(5, '2408561034', 'Budi', 'BD', 'budi@student.kampus.ac.id', '$2y$10$O3mqyKrkIzSxgHttPiQ26eVLU.tbfNgCppp43/64LCYPDWVGBvvl6', 'Mahasiswa', 'user', 'Sistem Informasi', 'Teknik', '0814-4444-5555'),
(6, 'satpam', 'Petugas Satpam', 'PS', 'satpam@kampus.ac.id', '$2y$10$0Kt7vzO5C6i58LEAUsu8cethOS.0aQLCvMb7GiTDjD45yjj0xjHAu', 'Petugas Pos Satpam', 'petugas', '-', '-', '0811-0000-1111');

-- Tabel: laporan
CREATE TABLE IF NOT EXISTS `laporan` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tipe` ENUM('Hilang', 'Ditemukan') NOT NULL DEFAULT 'Hilang',
    `nama_barang` VARCHAR(100) NOT NULL,
    `jenis_barang` VARCHAR(50) NOT NULL,
    `tanggal` DATE NOT NULL,
    `lokasi` VARCHAR(150) NOT NULL,
    `penitipan` VARCHAR(100) DEFAULT NULL,
    `deskripsi` TEXT NOT NULL,
    `ciri_rahasia` TEXT DEFAULT NULL,
    `foto` VARCHAR(255) DEFAULT NULL,
    `status` ENUM('Hilang', 'Ditemukan', 'Diklaim', 'Dikembalikan') NOT NULL DEFAULT 'Hilang',
    `pelapor_email` VARCHAR(100) DEFAULT NULL,
    `pelapor_name` VARCHAR(100) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data Awal / Dummy untuk Pengujian
INSERT IGNORE INTO `laporan` (`id`, `tipe`, `nama_barang`, `jenis_barang`, `tanggal`, `lokasi`, `penitipan`, `deskripsi`, `ciri_rahasia`, `foto`, `status`, `pelapor_email`, `pelapor_name`) VALUES
(1, 'Hilang', 'Dompet kulit', 'Aksesoris', '2026-09-27', 'Kantin Utama', NULL, 'Dompet kulit cokelat dengan kancing. Ciri lain sengaja tidak ditampilkan untuk verifikasi pemilik.', 'Ada uang tunai dan kartu member di kantong dalam', 'assets/items/dompet.jpg', 'Hilang', 'deta@student.kampus.ac.id', 'Detuy Mahardika'),
(2, 'Ditemukan', 'Kunci motor', 'Kendaraan', '2026-09-28', 'Gedung B', 'Tata Usaha', 'Kunci dengan gantungan karakter. Ciri lain sengaja tidak ditampilkan untuk verifikasi pemilik.', 'Gantungan kunci bertuliskan Honda dengan pita merah', 'assets/items/kunci.jpg', 'Ditemukan', 'rizky@student.kampus.ac.id', 'Rizky'),
(3, 'Ditemukan', 'Kartu Mahasiswa', 'Dokumen', '2026-09-28', 'Perpustakaan', 'Pos Satpam Depan', 'Kartu mahasiswa atas nama Made Wirawan. Hubungi untuk verifikasi lebih lanjut.', 'NIM berakhiran 106', 'assets/items/ktm.jpg', 'Ditemukan', 'rizky@student.kampus.ac.id', 'Rizky'),
(4, 'Hilang', 'Botol minum hijau', 'Aksesoris', '2026-09-26', 'Lab Komputer', NULL, 'Botol minum warna hijau dengan stiker. Detail lain tidak ditampilkan untuk verifikasi.', 'Stiker Linux di bagian tutup botol', 'assets/items/tumbler.jpg', 'Hilang', 'budi@student.kampus.ac.id', 'Budi'),
(5, 'Ditemukan', 'Tas ransel hitam', 'Tas', '2026-09-25', 'Parkiran Timur', 'Pos Satpam Depan', 'Tas ransel hitam ukuran sedang. Ciri khusus disembunyikan untuk keperluan klaim.', 'Di kantong depan ada buku catatan bersampul biru', 'assets/items/tas.jpg', 'Ditemukan', 'satpam@kampus.ac.id', 'Petugas Satpam'),
(6, 'Hilang', 'Charger Laptop', 'Elektronik', '2026-09-24', 'Aula', NULL, 'Charger laptop HP original. Barang sudah dikembalikan ke pemiliknya.', 'Ada selotip hitam di ujung kabel adaptor', 'assets/items/charger.jpg', 'Dikembalikan', 'deta@student.kampus.ac.id', 'Detuy Mahardika');

-- Tabel: conversations (Ruang obrolan antara pelapor dan pengklaim)
CREATE TABLE IF NOT EXISTS `conversations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `laporan_id` INT NOT NULL,
    `pelapor_email` VARCHAR(100) NOT NULL,
    `pelapor_name` VARCHAR(100) NOT NULL,
    `pengklaim_email` VARCHAR(100) NOT NULL,
    `pengklaim_name` VARCHAR(100) NOT NULL,
    `status` ENUM('Menunggu', 'Terverifikasi', 'Selesai') NOT NULL DEFAULT 'Menunggu',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_laporan_pengklaim` (`laporan_id`, `pengklaim_email`),
    INDEX `idx_conv_pelapor` (`pelapor_email`),
    INDEX `idx_conv_pengklaim` (`pengklaim_email`),
    CONSTRAINT `fk_conv_laporan` FOREIGN KEY (`laporan_id`) REFERENCES `laporan`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel: messages (Riwayat pesan di dalam setiap conversation)
CREATE TABLE IF NOT EXISTS `messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `conversation_id` INT NOT NULL,
    `sender_email` VARCHAR(100) NOT NULL,
    `sender_type` ENUM('user', 'sys') NOT NULL DEFAULT 'user',
    `message` TEXT NOT NULL,
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_msg_conv_id` (`conversation_id`, `id`),
    CONSTRAINT `fk_msg_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data Awal Percakapan Demo
INSERT IGNORE INTO `conversations` (`id`, `laporan_id`, `pelapor_email`, `pelapor_name`, `pengklaim_email`, `pengklaim_name`, `status`) VALUES
(1, 3, 'rizky@student.kampus.ac.id', 'Rizky', '2408561089@student.kampus.ac.id', 'Made Wirawan', 'Terverifikasi'),
(2, 2, 'rizky@student.kampus.ac.id', 'Rizky', 'deta@student.kampus.ac.id', 'Detuy Mahardika', 'Menunggu');

INSERT IGNORE INTO `messages` (`id`, `conversation_id`, `sender_email`, `sender_type`, `message`, `is_read`) VALUES
(1, 1, 'system', 'sys', 'Percakapan dimulai untuk barang "Kartu Mahasiswa".', 1),
(2, 1, 'rizky@student.kampus.ac.id', 'user', 'Halo, KTM-nya sudah saya titipkan di Pos Satpam Depan.', 0),
(3, 1, '2408561089@student.kampus.ac.id', 'user', 'Terima kasih banyak! NIM saya berakhiran 106, besok pagi saya ambil.', 1),
(4, 2, 'system', 'sys', 'Klaim diajukan untuk barang "Kunci motor".', 1),
(5, 2, 'deta@student.kampus.ac.id', 'user', 'Halo, saya mengajukan klaim kunci motor. Gantungan Honda dengan pita merah.', 0);
